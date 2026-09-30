#!/usr/bin/env python3
"""Unpack the compiled files a design needs, from screens.tar.xz, into this folder.

    python3 qa/fetch.py <page> [<state> ...] [--375] [--roles] [--dry-run]
    python3 qa/fetch.py --flow <name> [--375] [--dry-run]
    python3 qa/fetch.py --component <slug> [<slug> ...] [--dry-run]
    python3 qa/fetch.py --css [--dry-run]

Run from the skill's folder (skill/ in the repo). <page> is a registry.pages id (or one of its aliases).
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
                           (registry.source.assets) — the .skill carries them
                           as files; this checks they are all here
  and, for every page file, the stylesheets and scripts it links that are not
  here yet (../css/…, prototype.js), so it renders as the product does.

A state id ending @web exists only as pages/<page>/<state>.html; one ending
@375 (@360 on the new My Listings) only as pages/<page>/<state>.mobile.html —
the suffix is not in the file name; any other state has both (when the page
has a 375 file). The 375 files are fetched with --375, and always for a
phone-only state named on its own.

Each file prints with its size: "have" (already here), "get" (unpacked now)
or "need" (--dry-run: not here yet). Every page, state and component is packed
in screens.tar.xz, next to registry.json (the .skill carries it; one pass reads
it, about 2 s), and unpacks into the same relative path, so its ../css/ links
hold. Nothing needs the internet. A read-only skill folder (claude.ai mounts
skills read-only) is not written: copy the skill somewhere writable first; the
message says how.

Exits 1 when a file is not in the archive, 2 on a page or state the registry
does not know. Standard library only.
"""
import fnmatch
import json
import os
import re
import shutil
import sys
import tarfile
from difflib import get_close_matches

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHONE_ONLY = ('375', '360')
ROLES = ('as-staff', 'as-individual')
ARCHIVE = os.path.join(ROOT, 'screens.tar.xz')


def die(msg):
    print(f'  {msg}')
    sys.exit(2)


def load_registry():
    path = os.path.join(ROOT, 'registry.json')
    if not os.path.exists(path):
        die('registry.json is missing — run from the skill\'s folder')
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
            notes.append(f'{page}/{s}: phone only — add --375 to unpack it')
        if phone and only == 'web':
            notes.append(f'{page}/{s}: web only — no 375 file')
    return files, notes


def human(n):
    if n is None:
        return '?'
    return f'{n / 1048576:.1f} MB' if n >= 1048576 else f'{n / 1024:.0f} KB' if n >= 1024 else f'{n} B'


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
    print(f'  {ROOT} is read-only, so nothing can be unpacked into it. Work on a copy:')
    print(f'\n    cp -r "{ROOT}" "{home}" && cd "{home}"\n')
    print('  then run this command again from there, and write designs/ there.')
    sys.exit(2)


def unpack(paths, dry=False):
    """one pass through screens.tar.xz -> {path: size} of the paths it holds; written here unless dry"""
    want, found = set(paths), {}
    if not want or not os.path.exists(ARCHIVE):
        return found
    with tarfile.open(ARCHIVE, 'r:xz') as tf:
        for m in tf:
            if m.name not in want or not m.isfile():
                continue
            found[m.name] = m.size
            if not dry:
                dest = os.path.join(ROOT, m.name)
                os.makedirs(os.path.dirname(dest), exist_ok=True)
                with tf.extractfile(m) as src, open(dest + '.part', 'wb') as out:
                    shutil.copyfileobj(src, out)
                os.replace(dest + '.part', dest)
            if len(found) == len(want):
                break
    return found


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
    queue = [p for p, _ in files]
    while queue:
        todo = [p for p in dict.fromkeys(queue) if p not in seen]
        seen.update(todo)
        queue, missing = [], []
        for path in todo:
            dest = os.path.join(ROOT, path)
            if os.path.exists(dest):
                n = os.path.getsize(dest)
                total += n
                print(f'  have {human(n):>8}  {path}')
                queue += linked_assets(path)
            else:
                missing.append(path)
        found = unpack(missing, dry)
        for path in missing:
            n = found.get(path)
            if n is None:
                failed += 1
                why = 'not in screens.tar.xz' if os.path.exists(ARCHIVE) else 'screens.tar.xz is missing'
                print(f'  FAIL {"":>8}  {path}   ({why} — reinstall the .skill)')
            elif dry:
                need += 1
                total += n
                print(f'  need {human(n):>8}  {path}')
            else:
                total += n
                print(f'  get  {human(n):>8}  {path}')
                queue += linked_assets(path)
        queue = [a for a in queue if a not in seen]
    for note in notes:
        print(f'  note {note}')
    print(f'\n  {len(seen)} files, {human(total)}' + (f' — {need} to unpack' if dry else '') + (f' — {failed} failed' if failed else ''))
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
