#!/usr/bin/env python3
"""Pack every compiled page, state and component of skill/ into one screens.tar.xz.

    python3 scripts/pack-screens.py <out.tar.xz>

The pages repeat themselves (the shell, the icons, the images), so one solid xz
stream holds all of them, about 450 MB of HTML, in about 7 MB. qa/fetch.py
unpacks what a design opens. Files are sorted and owners and times zeroed, so
the same pages give the same archive.
"""
import glob
import os
import sys
import tarfile

SKILL = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'skill')


def clean(ti):
    ti.mtime, ti.uid, ti.gid, ti.uname, ti.gname, ti.mode = 0, 0, 0, '', '', 0o644
    return ti


def main(out):
    os.chdir(SKILL)
    files = sorted(f for d in ('pages', 'organisms', 'molecules', 'atoms') for f in glob.glob(f'{d}/**/*.html', recursive=True))
    with tarfile.open(out, 'w:xz', preset=9) as tf:
        for f in files:
            tf.add(f, filter=clean)
    raw = sum(map(os.path.getsize, files))
    print(f'  screens.tar.xz — {len(files)} files, {raw / 1048576:.0f} MB of HTML in {os.path.getsize(out) / 1048576:.1f} MB')


if __name__ == '__main__':
    main(os.path.abspath(sys.argv[1]))
