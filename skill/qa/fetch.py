#!/usr/bin/env python3
"""Fetch the compiled files a design needs, from registry.json, into this package.

    python3 qa/fetch.py <page> [<state> ...] [--375] [--roles] [--dry-run]
    python3 qa/fetch.py --flow <name> [--375] [--dry-run]
    python3 qa/fetch.py --component <slug> [<slug> ...] [--dry-run]
    python3 qa/fetch.py --css [--dry-run]

Run from skill/. <page> is a registry.pages id (or one of its aliases).
A <state> is a registry state id, with or without its @web / @375 suffix,
or a pattern ('message-*', 'loading', 'empty', 'error').

It expands, in this order:
  the base page            pages/<page>.html (+ .mobile.html with --375)
  each state named         pages/<page>/<state>.html, .mobile.html
  --roles                  as-staff and as-individual of the page, and
                           <state>-as-staff / <state>-as-individual of each
                           state named, where compiled (a state with none is
                           the owner fixture's only: product/roles.md)
  --flow <name>            every step of registry.flows[<name>]
  --component              the arguments are components: registry.components[x].file
  --css                    every shared file: css/ and pages/prototype.js
                           (registry.source.assets) — before grepping css/ or
                           running qa/validate.py
  and, for every page file, the stylesheets and scripts it links that are not
  here yet (../css/…, prototype.js), so it renders as the product does.

A state id ending @web exists only as pages/<page>/<state>.html; one ending
@375 (@360 on the new My Listings) only as pages/<page>/<state>.mobile.html —
the suffix is not in the file name; any other state has both (when the page
has a 375 file). The 375 files are fetched with --375, and always for a
phone-only state named on its own.

Each file prints with its size: "have" (already here), "get" (fetched now)
or "need" (--dry-run: not here; its size asked of the server). Missing files
come from the skill's public repo, at the tag the .skill was built with
(registry.json -> source), into the same relative path, so their ../css/
links hold: from raw.githubusercontent.com (source.raw + the path) or, where
that is blocked, from github.com through git (source.git: a shallow clone
without file contents, kept in the temp folder, then a sparse checkout of
just these files). claude.ai's default network ("package managers only")
allows github.com, not raw.githubusercontent.com. A read-only skill folder
(claude.ai mounts skills read-only) is not written: copy the skill somewhere
writable first; the message says how.

Exits 1 when a file could not be fetched, 2 on a page or state the registry
does not know. Standard library and git only.
"""
import fnmatch
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from difflib import get_close_matches

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHONE_ONLY = ('375', '360')
ROLES = ('as-staff', 'as-individual')
RAW = 'https://raw.githubusercontent.com/{repo}/{ref}/skill/{path}'
GIT_CACHE = os.path.join(tempfile.gettempdir(), 'profolio-ksa-design-git')
UNREACHABLE = '''
  GitHub is not reachable from here — raw.githubusercontent.com: {raw}; github.com (git): {git}.
  The pages come from the skill's public repo: the user needs no link and no file.
  On claude.ai, code execution needs network access: the organisation owner turns it on under
  Organization settings -> Capabilities (a personal plan: Settings -> Capabilities). The default,
  "package managers only", already allows github.com. Meanwhile run the intake: it needs no page.'''


def die(msg):
    print(f'  {msg}')
    sys.exit(2)


def load_registry():
    path = os.path.join(ROOT, 'registry.json')
    if not os.path.exists(path):
        die('registry.json is missing — run from skill/')
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def find_page(reg, name):
    pages = reg.get('pages', {})
    if name in pages:
        return name
    low = name.lower()
    for slug, p in pages.items():
        if low in (a.lower() for a in p.get('aliases', [])):
            return slug
    near = get_close_matches(name, list(pages), n=4, cutoff=0.5)
    die(f'no page "{name}" in registry.json' + (f' — did you mean {", ".join(near)}?' if near else ''))


def state_files(page, entry, state_id):
    """registry state id -> [(path, layout)]"""
    name, _, only = state_id.partition('@')
    folder = f'{os.path.dirname(entry["file"])}/{page}'
    out = []
    if only not in PHONE_ONLY:
        out.append((f'{folder}/{name}.html', 'web'))
    if only in PHONE_ONLY or (not only and entry.get('mobile')):
        out.append((f'{folder}/{name}.mobile.html', '375'))
    return out


def pick_states(page, entry, wanted):
    """state args -> registry ids, in the order asked; unknown ones die"""
    ids = entry.get('states', [])
    by_name = {s.partition('@')[0]: s for s in ids}
    out = []
    for w in wanted:
        name = w.partition('@')[0]
        if any(c in name for c in '*?['):
            hits = [by_name[n] for n in by_name if fnmatch.fnmatchcase(n, name)]
            if not hits:
                print(f'  {page}: no state matches "{w}"')
            out += [h for h in hits if h not in out]
        elif name in by_name:
            if by_name[name] not in out:
                out.append(by_name[name])
        else:
            near = get_close_matches(name, list(by_name), n=4, cutoff=0.5)
            die(f'{page} has no state "{w}"' + (f' — did you mean {", ".join(near)}?' if near else '') + f' ({len(ids)} states: registry.pages["{page}"].states)')
    return out


def role_variants(page, entry, chosen):
    """the page's own as-staff / as-individual, and each chosen state's <state>-as-<role>; a state
    compiled for another account (registry state_roles) is that account's alone"""
    by_name = {s.partition('@')[0]: s for s in entry.get('states', [])}
    other = entry.get('state_roles') or {}
    out, notes = [], []
    for r in ROLES:
        if r in by_name:
            out.append(by_name[r])
    for s in chosen:
        name = s.partition('@')[0]
        if name in ROLES or name.endswith(ROLES):
            continue
        if name in other:
            notes.append(f'{page}/{name}: compiled as the {other[name]} account, not the owner — no other role\'s version exists (product/roles.md)')
            continue
        have = [by_name[f'{name}-{r}'] for r in ROLES if f'{name}-{r}' in by_name]
        out += have
        missing = [r for r in ROLES if f'{name}-{r}' not in by_name]
        if missing:
            notes.append(f'{page}/{name}: owner fixture only — no {", ".join(f"-{r}" for r in missing)} (product/roles.md)')
    return [x for x in out if x not in chosen], notes


def expand(reg, page, states, phone, roles):
    """-> [(path, layout)], notes"""
    entry = reg['pages'][page]
    files = [(entry['file'], 'web')]
    if phone and entry.get('mobile'):
        files.append((entry['mobile'], '375'))
    chosen = pick_states(page, entry, states)
    notes = []
    if roles:
        extra, notes = role_variants(page, entry, chosen)
        chosen += extra
    named = {x.partition('@')[0] for x in states}
    for s in chosen:
        name, _, only = s.partition('@')
        got = [(p, l) for p, l in state_files(page, entry, s) if l == 'web' or phone or (only in PHONE_ONLY and name in named)]
        files += got
        if not got:
            notes.append(f'{page}/{s}: phone only — add --375 to fetch it')
        if phone and only == 'web':
            notes.append(f'{page}/{s}: web only — no 375 file')
    return files, notes


def human(n):
    if n is None:
        return '?'
    return f'{n / 1048576:.1f} MB' if n >= 1048576 else f'{n / 1024:.0f} KB' if n >= 1024 else f'{n} B'


def url_of(reg, path):
    src = reg.get('source') or {}
    if src.get('raw'):
        return src['raw'] + urllib.parse.quote(path, safe='/')
    if not src.get('repo') or not src.get('ref'):
        die('registry.json has no source.repo / source.ref to fetch from')
    ref = src['ref'] if src['ref'].startswith('refs/') else f'refs/heads/{src["ref"]}'
    return RAW.format(repo=src['repo'], ref=urllib.parse.quote(ref, safe='/'), path=urllib.parse.quote(path, safe='/'))


def ref_name(reg):
    """refs/tags/skill-v1.2 -> skill-v1.2: what git clone --branch takes"""
    ref = (reg.get('source') or {}).get('ref') or 'main'
    return ref.split('/', 2)[2] if ref.startswith('refs/') else ref


LINKED = re.compile(r'(?:href|src)="([^"]+)"|@import\s+(?:url\()?["\']([^"\']+)["\']|url\(["\']?([^"\')]+)')
ASSET_EXT = ('.css', '.js', '.svg', '.json', '.woff', '.woff2')


def linked_assets(path):
    """the shared files a page, component or stylesheet here links by a relative path"""
    dest = os.path.join(ROOT, path)
    if not path.endswith(('.html', '.css')) or not os.path.exists(dest):
        return []
    with open(dest, encoding='utf-8', errors='replace') as f:
        text = f.read()
    out = []
    for m in LINKED.finditer(text):
        link = next(g for g in m.groups() if g)
        link = link.split('#')[0].split('?')[0]
        if not link or ':' in link or link.startswith(('/', '//')) or not link.endswith(ASSET_EXT):
            continue
        rel = os.path.normpath(os.path.join(os.path.dirname(path), link)).replace(os.sep, '/')
        if not rel.startswith('..') and rel not in out:
            out.append(rel)
    return out


def writable_or_die(paths):
    """claude.ai mounts a skill read-only: say how to work on a copy instead"""
    missing = [p for p in paths if not os.path.exists(os.path.join(ROOT, p))]
    if not missing or os.access(ROOT, os.W_OK):
        return
    home = os.path.join(os.path.expanduser('~'), os.path.basename(ROOT))
    print(f'  {ROOT} is read-only, so nothing can be fetched into it. Work on a copy:')
    print(f'\n    cp -r "{ROOT}" "{home}" && cd "{home}"\n')
    print('  then run this command again from there, and write designs/ there.')
    sys.exit(2)


def request(url, method='GET'):
    req = urllib.request.Request(url, method=method, headers={'Accept-Encoding': 'identity', 'User-Agent': 'profolio-skill-fetch'})
    return urllib.request.urlopen(req, timeout=60)


def remote_size(url):
    try:
        with request(url, 'HEAD') as r:
            n = r.headers.get('Content-Length')
            return int(n) if n else None, None
    except (urllib.error.URLError, OSError) as e:
        return None, getattr(e, 'code', None) or str(getattr(e, 'reason', e))


def fetch(url, dest):
    tmp = dest + '.part'
    try:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with request(url) as r, open(tmp, 'wb') as f:
            while True:
                chunk = r.read(1 << 16)
                if not chunk:
                    break
                f.write(chunk)
        os.replace(tmp, dest)
        return os.path.getsize(dest), None
    except (urllib.error.URLError, OSError) as e:
        if os.path.exists(tmp):
            os.remove(tmp)
        return None, getattr(e, 'code', None) or str(getattr(e, 'reason', e))


def git_fetch(reg, paths):
    """the same files through github.com alone: a shallow clone without file contents (once, in
    the temp folder), then a sparse checkout of just these paths -> ({path: size}, error)"""
    if not shutil.which('git'):
        return {}, 'git is not installed'
    src = reg.get('source') or {}
    name = ref_name(reg)
    cache = f'{GIT_CACHE}-{re.sub(r"[^A-Za-z0-9_.-]", "_", name)}'

    def git(*args, cwd=cache):
        r = subprocess.run(['git', *args], cwd=cwd, capture_output=True, text=True, timeout=600)
        return None if r.returncode == 0 else (r.stderr.strip().splitlines() or [f'git {args[0]} failed'])[-1]
    try:
        if not os.path.isdir(os.path.join(cache, '.git')):
            shutil.rmtree(cache, ignore_errors=True)
            url = src.get('git') or f'https://github.com/{src.get("repo")}.git'
            err = git('clone', '--quiet', '--depth', '1', '--filter=blob:none', '--no-checkout', '--branch', name, url, cache, cwd=None)
            if err:
                shutil.rmtree(cache, ignore_errors=True)
                return {}, err
            git('config', 'core.sparseCheckout', 'true')
        info = os.path.join(cache, '.git', 'info', 'sparse-checkout')
        os.makedirs(os.path.dirname(info), exist_ok=True)
        have = set(open(info).read().split('\n')) if os.path.exists(info) else set()
        want = {'/skill/' + re.sub(r'([*?\[\]\\])', r'\\\1', p) for p in paths}
        with open(info, 'w') as f:
            f.write('\n'.join(sorted((have | want) - {''})) + '\n')
        err = git('read-tree', '-mu', 'HEAD')
        if err:
            return {}, err
    except (OSError, subprocess.SubprocessError) as e:
        return {}, str(e)
    got = {}
    for p in paths:
        s = os.path.join(cache, 'skill', p)
        if os.path.isfile(s):
            dest = os.path.join(ROOT, p)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.copyfile(s, dest)
            got[p] = os.path.getsize(dest)
    return got, None


def main(argv):
    flags = {'--help' if a == '-h' else a for a in argv if a.startswith('-')}
    args = [a for a in argv if not a.startswith('-')]
    unknown = flags - {'--375', '--roles', '--dry-run', '--flow', '--component', '--css', '--help'}
    if '--help' in flags or (not args and '--flow' not in flags and '--css' not in flags):
        print(__doc__.strip())
        return 0 if '--help' in flags else 2
    if unknown:
        die(f'unknown option {", ".join(sorted(unknown))}')
    reg = load_registry()
    phone, roles, dry = '--375' in flags, '--roles' in flags, '--dry-run' in flags
    files, notes = [], []
    if '--css' in flags:
        assets = (reg.get('source') or {}).get('assets') or []
        if not assets:
            die('registry.json has no source.assets — rebuild the package')
        files += [(a, 'web') for a in assets]
    if '--flow' in flags:
        i = argv.index('--flow')
        name = argv[i + 1] if i + 1 < len(argv) and not argv[i + 1].startswith('--') else None
        flows = reg.get('flows', {})
        if name not in flows:
            die(f'no flow "{name}" — flows: {", ".join(flows)}')
        args = [a for a in args if a != name]
        for step in flows[name]:
            sid = step['id'] if isinstance(step, dict) else step
            page, _, state = sid.partition('/')
            got, n = expand(reg, page, [state], phone, roles)
            files += got
            notes += n
    if args and '--component' in flags:
        comps = reg.get('components', {})
        for c in args:
            if c not in comps:
                near = get_close_matches(c, list(comps), n=4, cutoff=0.5)
                die(f'no component "{c}" in registry.json' + (f' — did you mean {", ".join(near)}?' if near else ''))
            files.append((comps[c]['file'], 'web'))
    elif args:
        page = find_page(reg, args[0])
        got, n = expand(reg, page, args[1:], phone, roles)
        files += got
        notes += n
    if not dry:
        writable_or_die([p for p, _ in files])
    seen, total, failed, need = set(), 0, 0, 0
    raw_err, via_git = None, 0
    queue = [p for p, _ in files]
    while queue:
        todo = [p for p in dict.fromkeys(queue) if p not in seen]
        seen.update(todo)
        queue, missing, blocked = [], [], []
        for path in todo:
            dest = os.path.join(ROOT, path)
            if os.path.exists(dest):
                n = os.path.getsize(dest)
                total += n
                print(f'  have {human(n):>8}  {path}')
                queue += linked_assets(path)
            else:
                missing.append(path)
        for path in missing:
            if raw_err:
                blocked.append(path)
                continue
            url = url_of(reg, path)
            n, err = remote_size(url) if dry else fetch(url, os.path.join(ROOT, path))
            if err == 404:
                failed += 1
                print(f'  FAIL {"":>8}  {path}   (not in the repo at {ref_name(reg)}: {url})')
            elif err:
                raw_err = err
                blocked.append(path)
            elif dry:
                need += 1
                total += n or 0
                print(f'  need {human(n):>8}  {path}')
            else:
                total += n
                print(f'  get  {human(n):>8}  {path}')
                queue += linked_assets(path)
        if blocked and dry:
            need += len(blocked)
            for path in blocked:
                print(f'  need {human(None):>8}  {path}')
        elif blocked:
            # each git batch is one round trip of a few seconds: take the stylesheets and the
            # prototype script every page links in this one, not in a second
            extra = [a for a in (reg.get('source') or {}).get('assets', []) if a not in seen and not os.path.exists(os.path.join(ROOT, a))]
            seen.update(extra)
            blocked += extra
            got, git_err = git_fetch(reg, blocked)
            for path in blocked:
                if path in got:
                    via_git += 1
                    total += got[path]
                    print(f'  get  {human(got[path]):>8}  {path}   (github.com)')
                    queue += linked_assets(path)
                else:
                    failed += 1
                    print(f'  FAIL {"":>8}  {path}' + ('' if git_err else f'   (not in the repo at {ref_name(reg)})'))
            if git_err:
                print(UNREACHABLE.format(raw=raw_err, git=git_err))
        queue = [a for a in queue if a not in seen]
    if via_git:
        notes.append(f'raw.githubusercontent.com is not reachable here ({raw_err}): fetched through github.com (git)')
    for note in notes:
        print(f'  note {note}')
    print(f'\n  {len(seen)} files, {human(total)}' + (f' — {need} to fetch' if dry else '') + (f' — {failed} failed' if failed else ''))
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
