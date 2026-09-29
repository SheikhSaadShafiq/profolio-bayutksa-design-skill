#!/usr/bin/env python3
"""Fetch the compiled files a design needs, from registry.json, into this package.

    python3 qa/fetch.py <page> [<state> ...] [--375] [--roles] [--dry-run]
    python3 qa/fetch.py --flow <name> [--375] [--dry-run]
    python3 qa/fetch.py --component <slug> [<slug> ...] [--dry-run]

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

A state id ending @web exists only as pages/<page>/<state>.html; one ending
@375 (@360 on the new My Listings) only as pages/<page>/<state>.mobile.html —
the suffix is not in the file name; any other state has both (when the page
has a 375 file). The 375 files are fetched with --375, and always for a
phone-only state named on its own.

Each file prints with its size: "have" (already here), "get" (fetched now)
or "need" (--dry-run: not here; its size asked of the server). Missing files
come from the public repo, registry.json -> source.repo at source.ref, into the
same relative path, so their ../css/ and ../prototype.js links hold.

Exits 1 when a file could not be fetched, 2 on a page or state the registry
does not know. Standard library only.
"""
import fnmatch
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from difflib import get_close_matches

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHONE_ONLY = ('375', '360')
ROLES = ('as-staff', 'as-individual')
RAW = 'https://raw.githubusercontent.com/{repo}/refs/heads/{ref}/skill/{path}'


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
    if not src.get('repo') or not src.get('ref'):
        die('registry.json has no source.repo / source.ref to fetch from')
    return RAW.format(repo=src['repo'], ref=urllib.parse.quote(src['ref'], safe='/'), path=urllib.parse.quote(path, safe='/'))


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


def main(argv):
    flags = {'--help' if a == '-h' else a for a in argv if a.startswith('-')}
    args = [a for a in argv if not a.startswith('-')]
    unknown = flags - {'--375', '--roles', '--dry-run', '--flow', '--component', '--help'}
    if '--help' in flags or (not args and '--flow' not in flags):
        print(__doc__.strip())
        return 0 if '--help' in flags else 2
    if unknown:
        die(f'unknown option {", ".join(sorted(unknown))}')
    reg = load_registry()
    phone, roles, dry = '--375' in flags, '--roles' in flags, '--dry-run' in flags
    files, notes = [], []
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
    seen, total, failed, need = set(), 0, 0, 0
    for path, layout in files:
        if path in seen:
            continue
        seen.add(path)
        dest = os.path.join(ROOT, path)
        if os.path.exists(dest):
            n = os.path.getsize(dest)
            total += n
            print(f'  have {human(n):>8}  {path}')
            continue
        url = url_of(reg, path)
        if dry:
            n, err = remote_size(url)
            need += 1
            total += n or 0
            print(f'  need {human(n):>8}  {path}' + (f'   ({err})' if err else ''))
            failed += bool(err)
            continue
        n, err = fetch(url, dest)
        if err:
            failed += 1
            print(f'  FAIL {"":>8}  {path}   ({err}: {url})')
        else:
            total += n
            print(f'  get  {human(n):>8}  {path}')
    for note in notes:
        print(f'  note {note}')
    print(f'\n  {len(seen)} files, {human(total)}' + (f' — {need} to fetch' if dry else '') + (f' — {failed} failed' if failed else ''))
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
