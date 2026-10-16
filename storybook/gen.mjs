#!/usr/bin/env node
/**
 * The Profolio components as a Storybook: one story per variant of every compiled component,
 * the kit's patterns, and the components that locked designs propose, each proposal a version.
 *
 *   node gen.mjs [--skill ../skill] [--label "v2.6.1 · Profolio 2.0 look"]
 *
 * Writes (all ignored by git, rebuilt on every build):
 *   generated/**.stories.js       a CSF file per component
 *   public/previews/<id>/<n>.html one page per variant: the component page's own render of it
 *   public/css/                   the skill's stylesheets, as the previews link them
 *
 * Each component page (skill/atoms|molecules|organisms/<id>.html) draws its variants as figures:
 * a web variant inline, styled by profolio.css, states.css and ds.css; a phone variant as a
 * self-contained preview (srcdoc). Each becomes a preview page, framed by its story, so it
 * renders exactly as on the component page. The spec card (size, padding, radius, fill, type,
 * text) becomes the story's description.
 *
 * Proposed components live in storybook/proposed/<feature>/<component>.json + .html (written by
 * the skill's retro, qa/retro.mjs, when a design is locked): every proposal of one component
 * is a version of it, in order.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, cpSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const SKILL = resolve(HERE, arg('--skill', '../skill'));
const LABEL = arg('--label', process.env.SB_LABEL || 'current');
const GEN = join(HERE, 'generated'), PREV = join(HERE, 'public', 'previews');
for (const d of [GEN, PREV, join(HERE, 'public', 'css')]) rmSync(d, { recursive: true, force: true });
mkdirSync(GEN, { recursive: true }); mkdirSync(PREV, { recursive: true });
cpSync(join(SKILL, 'css'), join(HERE, 'public', 'css'), { recursive: true });
if (existsSync(join(SKILL, 'kit'))) cpSync(join(SKILL, 'kit'), join(HERE, 'public', 'kit'), { recursive: true });

const reg = JSON.parse(readFileSync(join(SKILL, 'registry.json'), 'utf8'));
const unesc = (t) => t.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const strip = (t) => unesc(t.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const js = (s) => JSON.stringify(s);
const ident = (s, used) => {
  let id = s.replace(/[^A-Za-z0-9]+(.)?/g, (m, c) => (c ? c.toUpperCase() : '')).replace(/^[^A-Za-z]+/, '') || 'Variant';
  id = id[0].toUpperCase() + id.slice(1, 60);
  let n = id, i = 2;
  while (used.has(n)) n = `${id}${i++}`;
  used.add(n);
  return n;
};
const LEVEL = { atom: 'Atoms', molecule: 'Molecules', organism: 'Organisms' };
const page = (head, body) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${head}<style>html,body{margin:0;background:transparent}body{padding:16px;font:14px/1.5 Geist,"Droid Arabic Kufi",sans-serif;color:#222}</style></head><body>${body}</body></html>\n`;
const WEB_CSS = '<link rel="stylesheet" href="../../css/profolio.css"><link rel="stylesheet" href="../../css/states.css"><link rel="stylesheet" href="../../css/ds.css">';

/* the frame every story draws: the variant's own page, as tall as it is */
writeFileSync(join(GEN, 'frame.js'), `export function frame(src, title) {
  const box = document.createElement('div');
  box.style.cssText = 'overflow-x:auto;max-width:100%';
  const f = document.createElement('iframe');
  f.src = src; f.title = title; f.loading = 'lazy';
  f.style.cssText = 'border:0;width:100%;min-height:80px;display:block;background:transparent';
  f.addEventListener('load', () => {
    try {
      const d = f.contentDocument, w = Math.max(d.documentElement.scrollWidth, d.body.scrollWidth);
      if (w > box.clientWidth) f.style.width = w + 'px';   /* a wide variant scrolls in its box, never cut */
      f.style.height = Math.ceil(Math.max(d.documentElement.scrollHeight, d.body.scrollHeight)) + 'px';
    } catch (e) { f.style.height = '480px'; }
  });
  box.appendChild(f);
  return box;
}
`);

let nComp = 0, nStory = 0;
const TITLES = new Set();
for (const [id, c] of Object.entries(reg.components || {})) {
  const file = join(SKILL, c.file || '');
  if (!c.file || !existsSync(file)) continue;
  const html = readFileSync(file, 'utf8');
  const figs = [...html.matchAll(/<figure class="ds-example"[^>]*>([\s\S]*?)<\/figure>/g)].map((m) => m[1]);
  if (!figs.length) continue;
  let title = strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || id);
  const tkey = `${c.level}/${title.toLowerCase()}`;
  if (TITLES.has(tkey)) title = `${title} (${id})`;   /* two components named alike: card and antd-card */
  TITLES.add(tkey);
  const dir = join(PREV, id); mkdirSync(dir, { recursive: true });
  const used = new Set(), stories = [];
  figs.forEach((f, i) => {
    const name = strip((f.match(/<span class="ds-vname">([\s\S]*?)<\/span>/) || [])[1] || `variant ${i + 1}`);
    const src = (f.match(/\ssrcdoc="([^"]*)"/) || [])[1];
    let doc;
    if (src) doc = unesc(src).replace(/href="\.\.\/css\//g, 'href="../../css/').replace(/href="states\.css"/g, 'href="../../css/states.css"');
    else {
      const stage = (f.match(/(<div class="ds-stage[\s\S]*?)<figcaption/) || [])[1];
      if (!stage) return;
      doc = page(WEB_CSS, stage);
    }
    writeFileSync(join(dir, `${i + 1}.html`), doc);
    const spec = [...(f.match(/<dl class="ds-spec">([\s\S]*?)<\/dl>/) || ['', ''])[1].matchAll(/<dt>([^<]*)<\/dt><dd>([\s\S]*?)<\/dd>/g)].map((m) => `**${m[1]}** ${strip(m[2])}`).join(' · ');
    stories.push(`export const ${ident(name, used)} = { name: ${js(name)}, parameters: { docs: { description: { story: ${js(spec)} } } }, render: () => frame(${js(`previews/${id}/${i + 1}.html`)}, ${js(`${title} · ${name}`)}) };`);
    nStory++;
  });
  if (!stories.length) continue;
  const about = [`${(c.variants || []).length} variants`, c.used_on ? `used on ${c.used_on.length} pages: ${c.used_on.join(', ')}` : '', c.tokens ? `tokens ${c.tokens.join(', ')}` : ''].filter(Boolean).join('. ');
  mkdirSync(join(GEN, LEVEL[c.level] || 'Other'), { recursive: true });
  writeFileSync(join(GEN, LEVEL[c.level] || 'Other', `${id}.stories.js`), `import { frame } from '../frame.js';
export default { title: ${js(`Components/${LEVEL[c.level] || 'Other'}/${title}`)}, tags: ['autodocs'], parameters: { layout: 'fullscreen', docs: { description: { component: ${js(`\`${id}\` · ${about}. In the skill: ${c.file}.`)} } } } };
${stories.join('\n')}
`);
  nComp++;
}

/* the kit: its patterns and visual elements, as the skill's README draws them */
const KIT = join(HERE, 'kit');
let nKit = 0;
if (existsSync(KIT)) {
  mkdirSync(join(PREV, 'kit'), { recursive: true });
  mkdirSync(join(GEN, 'Kit'), { recursive: true });
  for (const f of readdirSync(KIT).filter((n) => n.endsWith('.html'))) {
    const body = readFileSync(join(KIT, f), 'utf8');
    const name = strip((body.match(/<!--\s*title:\s*([^>]*?)\s*-->/) || [])[1] || f.replace(/\.html$/, ''));
    const note = strip((body.match(/<!--\s*about:\s*([\s\S]*?)\s*-->/) || [])[1] || '');
    writeFileSync(join(PREV, 'kit', f), page('<link rel="stylesheet" href="../../css/fonts.css"><link rel="stylesheet" href="../../css/new-theme/tokens.css"><link rel="stylesheet" href="../../kit/kit.css">', body));
    const sid = ident(name, new Set());
    writeFileSync(join(GEN, 'Kit', f.replace(/\.html$/, '.stories.js')), `import { frame } from '../frame.js';
export default { title: ${js(`Kit/${name}`)}, tags: ['autodocs'], parameters: { layout: 'fullscreen', docs: { description: { component: ${js(note)} } } } };
export const ${sid} = { name: ${js(name)}, render: () => frame(${js(`previews/kit/${f}`)}, ${js(name)}) };
`);
    nKit++;
  }
}

/* proposed components: every locked design's new components, each proposal a version */
const PROP = join(HERE, 'proposed');
const byComp = new Map();
if (existsSync(PROP)) for (const feat of readdirSync(PROP)) {
  const d = join(PROP, feat);
  if (!existsSync(d) || !readdirSync(d).length) continue;
  for (const f of readdirSync(d).filter((n) => n.endsWith('.json'))) {
    const meta = JSON.parse(readFileSync(join(d, f), 'utf8'));
    const markup = join(d, f.replace(/\.json$/, '.html'));
    if (!existsSync(markup)) continue;
    const key = meta.component || f.replace(/\.json$/, '');
    (byComp.get(key) || byComp.set(key, []).get(key)).push({ ...meta, feature: meta.feature || feat, markup, slug: `${feat}--${f.replace(/\.json$/, '')}` });
  }
}
let nProp = 0;
if (byComp.size) { mkdirSync(join(GEN, 'Proposed'), { recursive: true }); mkdirSync(join(PREV, 'proposed'), { recursive: true }); }
for (const [comp, list] of byComp) {
  list.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  const used = new Set();
  const stories = list.map((p, i) => {
    let doc = readFileSync(p.markup, 'utf8');
    if (!/<html/i.test(doc)) doc = page('<link rel="stylesheet" href="../../css/profolio.css"><link rel="stylesheet" href="../../css/states.css"><link rel="stylesheet" href="../../css/new-theme/tokens.css"><link rel="stylesheet" href="../../kit/kit.css">' + (p.css ? `<style>${p.css}</style>` : ''), doc);
    writeFileSync(join(PREV, 'proposed', `${p.slug}.html`), doc);
    const name = `v${i + 1} · ${p.feature}${p.direction ? ` (${p.direction})` : ''}${p.date ? ` · ${p.date}` : ''}`;
    const about = [p.status ? `**${p.status}**` : '', p.why || '', p.based_on ? `based on ${p.based_on}` : ''].filter(Boolean).join(' · ');
    return `export const ${ident(name, used)} = { name: ${js(name)}, parameters: { docs: { description: { story: ${js(about)} } } }, render: () => frame(${js(`previews/proposed/${p.slug}.html`)}, ${js(`${comp} ${name}`)}) };`;
  });
  writeFileSync(join(GEN, 'Proposed', `${comp.replace(/[^\w-]+/g, '-')}.stories.js`), `import { frame } from '../frame.js';
export default { title: ${js(`Proposed/${list[0].title || comp}`)}, tags: ['autodocs'], parameters: { layout: 'fullscreen', docs: { description: { component: ${js(`Proposed by locked designs, not in the product yet. Each version is one design's proposal, oldest first.`)} } } } };
${stories.join('\n')}
`);
  nProp += list.length;
}

/* the welcome page: what this is, which version */
writeFileSync(join(GEN, 'Welcome.mdx'), `import { Meta } from '@storybook/addon-docs/blocks';

<Meta title="Welcome" />

# Profolio KSA components

**${LABEL}**. Every component of the Profolio KSA web design system, each variant as the product renders it, from the design skill (\`profolio-ksa-design\`).

- **Components**: ${nComp} compiled components, ${nStory} variants, by level (atoms, molecules, organisms).
- **Kit**: the skill's patterns for what the product does not draw yet.
- **Proposed**: components locked designs add, not in the product yet; each proposal is a version (${nProp} so far).
- **Releases**: the last section of the sidebar, below Kit, carries a release's name; its menu opens the components of each earlier skill release.
`);
console.log(`  storybook: ${nComp} components · ${nStory} variant stories · ${nKit} kit stories · ${nProp} proposed versions — ${LABEL} (from ${relative(process.cwd(), SKILL) || '.'})`);
