/**
 * skill/context.json — the context card this skill ships at its root, so that every
 * design-* skill (design-skills/, schema: design-skills/_shared/context.schema.json) works
 * inside Profolio KSA's style without scanning for it.
 *
 * Read, not written by hand:
 *   - tokens: css/tokens.css, by design-context's own scanner (measured); a family the
 *     sheet does not name (motion) from the compiled css/profolio.css;
 *   - platforms: the widths the pages are compiled at (measured);
 *   - typefaces and themes: registry.themes;
 *   - voice: real strings from product/copy/ (measured);
 *   - rules: what this skill's SKILL.md holds the product to, quoted.
 *
 *   node scripts/skill/context-card.mjs        (run by scripts/package.mjs)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { DEVICES } from '../../harness/devices.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SKILL = join(ROOT, 'skill');
const OUT = join(SKILL, 'context.json');
const sha = (f) => createHash('sha1').update(readFileSync(f)).digest('hex').slice(0, 12);

export function contextCard() {
  /* the tokens, as design-context reads any product's code */
  const tmp = join(ROOT, '.build', 'context.scan.json');
  execFileSync('python3', [join(ROOT, 'design-skills', '_shared', 'scan.py'), join(SKILL, 'css', 'tokens.css'), join(SKILL, 'css', 'profolio.css'), '--name', 'Profolio KSA', '--out', tmp], { stdio: ['ignore', 'ignore', 'inherit'] });
  const scan = JSON.parse(readFileSync(tmp, 'utf8'));
  const reg = JSON.parse(readFileSync(join(SKILL, 'registry.json'), 'utf8'));
  const tokens = scan.tokens;
  tokens.file = 'css/tokens.css';
  const families = reg.themes && reg.themes.current && reg.themes.current.typefaces;
  if (families) tokens.type.families = Object.fromEntries(families.map((f, i) => [i ? 'arabic' : 'latin', { value: f, provenance: 'measured', source: 'registry.themes.current' }]));

  /* the spacing unit, from the named spacing values */
  const steps = Object.values(tokens.space || {}).map((v) => parseFloat(String(v.value))).filter((n) => n > 0);
  /* the base unit, by the rule the design-* skills use: 8 if 80% of the steps are multiples of 8, else 4 */
  const share = (m) => steps.filter((n) => n % m === 0).length / (steps.length || 1);
  const base = steps.length ? (share(8) >= 0.8 ? 8 : share(4) >= 0.8 ? 4 : null) : null;

  /* what the pages draw that the token sheet does not name: their own <style>, a sample of pages */
  const sample = readdirSync(join(SKILL, 'pages')).filter((f) => f.endsWith('.html') && !f.includes('.mobile')).slice(0, 12).map((f) => join(SKILL, 'pages', f));
  const drawnTmp = join(ROOT, '.build', 'context.drawn.json');
  execFileSync('python3', [join(ROOT, 'design-skills', '_shared', 'scan.py'), ...sample, '--html', '--name', 'drawn', '--out', drawnTmp], { stdio: ['ignore', 'ignore', 'inherit'] });
  const usage = JSON.parse(readFileSync(drawnTmp, 'utf8')).usage || {};
  const named = new Set(tokens.type.scale.map((x) => x.size));
  const inUseSizes = (usage.font_sizes || []).map(([v]) => v).filter((n) => n > 1 && !named.has(n)).sort((a, b) => a - b);
  const namedColours = new Set(Object.values(tokens.color || {}).map((v) => String(v.value).toLowerCase()));
  const inUseColours = (usage.colours || []).map(([c]) => c).filter((c) => !namedColours.has(c.toLowerCase())).slice(0, 12);
  tokens.in_use = { sizes: inUseSizes, colours: inUseColours, from: sample.map((f) => 'pages/' + f.split('/').pop()), provenance: 'derived' };

  /* the casing the product's buttons use, counted on the same pages */
  const casing = { title: 0, sentence: 0 };
  for (const f of sample) for (const m of readFileSync(f, 'utf8').matchAll(/<button\b[^>]*>([\s\S]*?)<\/button>/g)) {
    const t = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const words = t.split(' ').filter((w) => /^[A-Za-z]/.test(w));
    if (words.length < 2 || t.length > 40) continue;
    const caps = words.filter((w) => /^[A-Z]/.test(w)).length;
    if (caps === words.length) casing.title++; else if (caps === 1 && /^[A-Z]/.test(words[0])) casing.sentence++;
  }

  /* the product's own words for its main things, and their Arabic, from its copy tables */
  const pairs = [];
  for (const f of readdirSync(join(SKILL, 'product', 'copy')).filter((x) => x.endsWith('.md'))) {
    const hidden = /no compiled screen draws it|not defined for KSA|=false/.test(readFileSync(join(SKILL, 'product', 'copy.md'), 'utf8').split('\n').find((l) => l.includes(`copy/${f}`)) || '');
    if (hidden) continue;
    for (const m of readFileSync(join(SKILL, 'product', 'copy', f), 'utf8').matchAll(/^\| ([^|]+?) \| ([^|]+?) \|$/gm)) pairs.push([m[1].trim(), m[2].trim()]);
  }
  const terms = {};
  for (const term of ['Credits', 'Listing', 'Listings', 'Leads', 'Agent', 'Agency', 'Staff', 'Package', 'Property', 'Profile']) {
    const ar = pairs.filter(([en]) => en.toLowerCase() === term.toLowerCase()).map(([, a]) => a);
    if (!ar.length) continue;
    const count = ar.reduce((o, a) => ((o[a] = (o[a] || 0) + 1), o), {});
    const ranked = Object.entries(count).sort((a, b) => b[1] - a[1]).map(([a]) => a);
    terms[term] = ranked.length > 1 ? { ar: ranked[0], ar_also: ranked.slice(1) } : { ar: ranked[0] };
  }
  const arDigits = pairs.filter(([, a]) => /[٠-٩]/.test(a)).length, arWestern = pairs.filter(([, a]) => /[0-9]/.test(a)).length;

  /* the components people use most, by how many pages draw them */
  const names = Object.entries(reg.components || {}).sort((a, b) => (b[1].used_on || []).length - (a[1].used_on || []).length).slice(0, 60).map(([slug]) => slug);

  /* ten real strings: the product's own words for the jobs every design has */
  const voice = [];
  for (const area of ['common-EmptyState', 'common-filters', 'common-drawer', 'checkout']) {
    const f = join(SKILL, 'product', 'copy', `${area}.md`);
    if (!existsSync(f)) continue;
    for (const m of readFileSync(f, 'utf8').matchAll(/^\| ([^|]+?) \| ([^|]+?) \|$/gm)) {
      if (/^(English|---)/.test(m[1]) || m[1].length > 70) continue;
      voice.push(`${m[1].trim()} — ${m[2].trim()}`);
      if (voice.length >= 10) break;
    }
    if (voice.length >= 10) break;
  }

  const card = {
    schema_version: 1,
    context_skill_name: 'profolio-ksa-design',
    context_skill_version: reg.source && reg.source.ref ? String(reg.source.ref).replace(/^refs\/tags\/skill-v/, '').replace(/^refs\/tags\//, '') : 'unreleased',
    built: reg.built,
    product: {
      name: 'Bayut Profolio KSA',
      summary: 'The agent and seller portal at profolio.bayut.sa: listings, credits, leads (TruLeads), reports and agency staff, for the KSA property market.',
      audience: 'agency owners, agency staff and individual sellers',
      market: 'KSA',
      design_system: 'profolio-ksa-design (registry.json, css/tokens.css, kit/)',
    },
    sources: [
      { kind: 'design-system-skill', ref: 'css/tokens.css', hash: sha(join(SKILL, 'css', 'tokens.css')) },
      { kind: 'design-system-skill', ref: 'css/profolio.css', hash: sha(join(SKILL, 'css', 'profolio.css')) },
      { kind: 'design-system-skill', ref: 'registry.json', hash: sha(join(SKILL, 'registry.json')) },
      { kind: 'design-system-skill', ref: 'product/copy.md', hash: sha(join(SKILL, 'product', 'copy.md')) },
    ],
    platforms: [
      { id: 'web', width: DEVICES.web.viewport.width, height: DEVICES.web.viewport.height, min_target: 24, provenance: 'measured', notes: 'compiled at 1440 (measured); the rail is 60 px, 220 px expanded, and pushes the page. min_target is WCAG 2.2\'s 24px (2.5.8): this skill\'s target, not a product measurement' },
      { id: 'phone', width: DEVICES.mobile.viewport.width, height: DEVICES.mobile.viewport.height, min_target: 32, provenance: 'measured', notes: 'the product\'s controls are 32 px tall on the phone (the platforms ask 44): new controls take 44 where the layout allows' },
    ],
    locales: [{ id: 'en', dir: 'ltr', font: families ? families[0] : undefined, provenance: 'measured' }, { id: 'ar', dir: 'rtl', font: families ? families[1] : undefined, provenance: 'measured' }],
    formats: {
      currency: { code: 'SAR', sign: 'the riyal sign, drawn from kit/riyal.svg (the icon font\'s U+E900), never the letters', position: 'before' },
      digits: { en: 'western', ar: arDigits > arWestern ? 'arabic-indic' : 'western' },
      time: 'Riyadh time (Asia/Riyadh)',
      provenance: 'measured',
    },
    tokens,
    grid: base ? { web: { base, provenance: 'derived' }, phone: { base, provenance: 'derived' } } : {},
    components: { registry: 'registry.json', count: Object.keys(reg.components || {}).length, names, notes: 'the product\'s components, cut from its own render, most used first; kit/README.md has the patterns it does not draw yet', provenance: 'measured' },
    voice: {
      copy_source: 'product/copy.md and product/copy/ (English beside Arabic, verbatim); copy.md\'s "hidden by" column marks the areas no KSA screen shows: those strings are not reused',
      terms,
      casing: { button: casing.title >= casing.sentence ? 'title' : 'sentence' },
      tone: 'plain and direct: short labels and messages, as in the examples. The product\'s casing varies ("Clear filters", "Reset Filters"), so take an existing string\'s casing from product/copy/ rather than a rule',
      examples: voice,
      provenance: 'derived',
    },
    assets: {
      icons: 'atoms/icon.html (every icon the product draws) and css/sprite.svg',
      illustrations: 'the empty-state art in the compiled pages (registry: empty states)',
      style: 'the product\'s own line icons; new art in the same stroke and palette is flagged [new]',
    },
    a11y: { target: 'WCAG 2.2 AA', min_contrast: 4.5, notes: 'the product states no target; this skill holds new work to WCAG 2.2 AA' },
    rules: [
      'KSA only: not Oman, Bahrain, Qatar, Jordan, Egypt or Zameen, and not the consumer side of bayut.sa.',
      'An amount is drawn with the riyal sign (kit/riyal.svg, the icon font\'s U+E900), never written as "SAR", "ر.س" or U+20C1.',
      'Use the product\'s copy verbatim (product/copy/); a string it does not have is new copy, flagged.',
      'Times of day are in Riyadh time.',
      'Arabic RTL is not compiled: say so rather than mirroring a screen by hand.',
      'A value the product neither names (css/tokens.css, documented in tokens.md) nor draws (tokens.in_use) is a proposal for the designer, flagged [new].',
    ],
    gaps: [
      'grid columns, gutters and margins are not measured yet; the base comes from the named spacing values',
      'motion: the product animates with antd\'s durations (tokens.motion); it states nothing for reduced motion',
    ],
  };
  writeFileSync(OUT, JSON.stringify(card, null, 2) + '\n');
  return card;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const c = contextCard();
  console.log(`  context.json — ${Object.keys(c.tokens.color || {}).length} colours · ${c.tokens.type.scale.length} type sizes · ${Object.keys(c.tokens.motion.durations || {}).length} durations · ${c.voice.examples.length} real strings`);
}
