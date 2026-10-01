#!/usr/bin/env node
/**
 * Redraw the riyal in files that are already compiled. Each svg that draws the 2.0
 * handover's rough four-bar sketch (viewBox 0 0 11 12, first path "M7.9 0 9.9 0 …")
 * becomes the official sign, skill/kit/riyal.svg, at the same height and in the same
 * place: its style, fill and data- attributes are kept, and its width follows the
 * glyph's own proportions. A recompile does the same (scripts/theme/capture.mjs);
 * this saves recompiling for a change of shape alone.
 *
 * The designer's own handover (authoring/) is not touched.
 *
 *   node scripts/kit/riyal-migrate.mjs            deliverables/new-theme and skill/pages
 *   node scripts/kit/riyal-migrate.mjs --check    exit 1 when any file still has the old glyph
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CHECK = process.argv.includes('--check');
const svg = readFileSync(join(ROOT, 'skill', 'kit', 'riyal.svg'), 'utf8');
const [, W, H] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
const D = svg.match(/ d="([^"]+)"/)[1];

const OLD = /<svg\b([^>]*\bview[Bb]ox="0 0 11 12"[^>]*)>((?:(?!<\/svg>)[\s\S])*?M7\.9 0 9\.9 0(?:(?!<\/svg>)[\s\S])*?)<\/svg>/g;
const redraw = (attrs) => {
  const h = parseFloat((attrs.match(/\sheight="([\d.]+)"/) || [])[1]);
  let a = attrs.replace(/(\sview[Bb]ox=)"0 0 11 12"/, `$1"0 0 ${W} ${H}"`);
  if (h) a = a.replace(/\swidth="[\d.]+"/, ` width="${Math.round(h * W / H * 10) / 10}"`);
  return `<svg${a}><path d="${D}"></path></svg>`;
};

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.html$/.test(name)) files.push(p);
  }
};
walk(join(ROOT, 'deliverables', 'new-theme'));
walk(join(ROOT, 'skill', 'pages'));

let changed = 0, glyphs = 0;
for (const f of files) {
  const html = readFileSync(f, 'utf8');
  if (!html.includes('M7.9 0 9.9 0')) continue;
  let n = 0;
  const out = html.replace(OLD, (m, attrs) => { n++; return redraw(attrs); });
  if (CHECK) { console.log(`  ${relative(ROOT, f)}: ${n || 'an unmatched'} old glyph(s)`); changed++; continue; }
  if (out.includes('M7.9 0 9.9 0')) console.log(`  ${relative(ROOT, f)}: an old glyph this does not recognise is left`);
  writeFileSync(f, out);
  changed++; glyphs += n;
}
if (CHECK) { console.log(changed ? `  ${changed} file(s) still draw the old riyal — node scripts/kit/riyal-migrate.mjs` : '  no file draws the old riyal'); process.exit(changed ? 1 : 0); }
console.log(`  ${glyphs} riyal glyph(s) redrawn in ${changed} file(s) — the official sign, skill/kit/riyal.svg`);
