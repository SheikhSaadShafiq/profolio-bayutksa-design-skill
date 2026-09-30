#!/usr/bin/env python3
"""Write skill/kit/riyal.svg: the Saudi riyal sign exactly as the product draws it.

The product draws the riyal with its icon font. The class is .currency-Saudi_Riyal_Symbol,
and the glyph is U+E900 of the 'icomoon' font, which skill/css/profolio.css embeds as a
base64 woff. This reads that glyph's outline and writes it as one SVG path. The path is
flipped so that y runs down, with viewBox 0 0 <advance> <units per em>. Every place the
icon font can't load then draws the same shape:
  - the new My Listings (Profolio 2.0);
  - a prototype;
  - a wireframe.

The 2.0 handover's own icon("sar") is a rough four-bar drawing and is not the official
symbol; scripts/kit/riyal-migrate.mjs replaces it in the compiled files.

    python3 scripts/kit/riyal.py        (needs fontTools: pip install fonttools)
"""
import base64
import io
import os
import re
import sys

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CSS = os.path.join(ROOT, 'skill', 'css', 'profolio.css')
OUT = os.path.join(ROOT, 'skill', 'kit', 'riyal.svg')

css = open(CSS, encoding='utf-8').read()
rule = re.search(r'\.currency-Saudi_Riyal_Symbol::before\s*\{\s*content:\s*"(\\[0-9a-fA-F]+|[^"])"', css)
face = re.search(r'@font-face\s*\{[^}]*font-family:\s*icomoon[^}]*\}', css)
if not rule or not face:
    sys.exit('profolio.css has no .currency-Saudi_Riyal_Symbol rule or no icomoon @font-face')
font = TTFont(io.BytesIO(base64.b64decode(re.search(r'base64,([A-Za-z0-9+/=]+)', face.group(0)).group(1))))
code = int(rule.group(1)[1:], 16) if rule.group(1).startswith('\\') else ord(rule.group(1))   # an escape, or the character itself
name = font.getBestCmap()[code]
glyphs = font.getGlyphSet()
upm = font['head'].unitsPerEm
ascent = font['hhea'].ascent
advance = font['hmtx'][name][0]

pen = SVGPathPen(glyphs, ntos=lambda v: ('%.1f' % v).rstrip('0').rstrip('.'))
glyphs[name].draw(TransformPen(pen, (1, 0, 0, -1, 0, ascent)))   # y down: font y → ascent - y
bounds = BoundsPen(glyphs)
glyphs[name].draw(bounds)

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" data-pf-riyal viewBox="0 0 {advance} {upm}" '
       f'fill="currentColor" aria-label="SAR" role="img"><path d="{pen.getCommands()}"/></svg>\n')
os.makedirs(os.path.dirname(OUT), exist_ok=True)
open(OUT, 'w', encoding='utf-8').write(svg)
print(f'{os.path.relpath(OUT, ROOT)}: U+{code:04X} ({name}) of icomoon, advance {advance} of {upm} units, ink {bounds.bounds}; {len(svg)} bytes')
