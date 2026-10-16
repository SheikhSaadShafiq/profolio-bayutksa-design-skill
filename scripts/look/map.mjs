#!/usr/bin/env node
/**
 * The Profolio 2.0 look's colour map, as the skill keeps it: data/look/map.json.
 *
 *   node scripts/look/map.mjs <colour-map.csv>
 *
 * The source is the colour map attached to the ticket "[KSA + GCC] [B] Profolio 2.0 look: teal
 * to green, 2.0 greys and Geist" (ClickUp z8v0kmv11c, 8 Oct 2026; written by
 * scripts/theme/colour-map.mjs from profolio-reactjs): every colour in the product's code, per
 * role (text, or fill/border/art), with its 2.0 value. The ticket's scope keeps only teal, the
 * greys and the greens: blue, red, amber, purple and pink stay as they are, so they are left out.
 *
 * It also writes the 2.0 colours the look may land on, for a colour only the render has
 * (qa/look.mjs maps it by the same rules): the green ramp and tints, and the greys, the seven
 * the ticket left unnamed included (mapping-filled.md § 4).
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const src = process.argv[2];
if (!src) { console.error('  usage: node scripts/look/map.mjs <colour-map.csv>'); process.exit(2); }

/* a small CSV reader: quoted fields, commas inside quotes */
function parseCsv(text) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; continue; }
    if (ch === '"') q = true; else if (ch === ',') { row.push(cur); cur = ''; } else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; } else if (ch !== '\r') cur += ch;
  }
  if (cur || row.length) { row.push(cur); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}

const KEEP = new Set(['teal', 'neutral', 'green']);
const colours = {};
for (const r of parseCsv(readFileSync(src, 'utf8'))) {
  if (!KEEP.has(r.family)) continue;
  const v = r.value.toLowerCase().replace(/\s+/g, '');
  const e = colours[v] || (colours[v] = { family: r.family });
  const to = r.new_value.toLowerCase().replace(/\s+/g, '');
  if (r.role === 'text') e.text = to; else e.fill = to;
  if (r.method === 'art' || r.method === 'keep' || r.method === 'brand') e.keep = true;
}

const map = {
  source: 'the colour map attached to ClickUp z8v0kmv11c (colour-map.csv, 2026-10-08): teal, grey and green rows',
  primary: { old: '#006169', brand: '#28b16d', pressed: '#208e57' },
  greens: ['#f0faf5', '#e9f7f0', '#d4efe2', '#bee8d3', '#a9e0c5', '#93d8b6', '#7ed0a7', '#69c899', '#53c18a', '#28b16d', '#249f62', '#208e57', '#10603a'],
  textGreys: ['#000000', '#222222', '#4f4f4f', '#626262', '#707070', '#9d9d9d', '#ffffff'],
  fillGreys: ['#000000', '#222222', '#4f4f4f', '#626262', '#707070', '#8a9099', '#9d9d9d', '#d6d6d6', '#dedede', '#e6e6e6', '#ededed', '#f0f0f0', '#f3f4f5', '#f5f5f5', '#f6f7fb', '#fafafa', '#fcfcfc', '#ffffff'],
  colours,
};
mkdirSync(join(ROOT, 'data', 'look'), { recursive: true });
writeFileSync(join(ROOT, 'data', 'look', 'map.json'), JSON.stringify(map, null, 1) + '\n');
const n = (f) => Object.values(colours).filter((c) => c.family === f).length;
console.log(`  data/look/map.json — ${Object.keys(colours).length} colours: ${n('teal')} teal, ${n('neutral')} grey, ${n('green')} green`);
