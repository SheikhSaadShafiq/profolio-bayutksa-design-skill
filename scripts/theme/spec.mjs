#!/usr/bin/env node
/**
 * The new My Listings' spec, in words — read out of the designer's handover
 * (authoring/themes/new/*.handover.html), section by section, with the live
 * builds hidden so only the spec's own text is read.
 *
 * Each section becomes markdown: its heading, its prose, and every screen's
 * ELEMENT / SPEC table as a table. Nothing is rewritten — the words are the
 * designer's; this only lays them out.
 *
 *   node scripts/theme/spec.mjs
 *
 * Writes data/theme/spec/{web,phone}-spec.md (the package copies them into
 * skill/product/listings-new/) and
 * data/theme/spec-{web,mobile}.txt (the raw text, for diffs between drafts).
 */
import pkg from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'authoring', 'themes', 'new');
const KB = join(ROOT, 'data', 'theme', 'spec');                 /* scripts/package.mjs copies it into skill/product/listings-new/ */
const DOCS = [
  { device: 'web', file: 'my-listings-web.handover.html', out: 'web-spec.md', title: 'My Listings — new theme · web spec (1440)', card: /^[A-L]$/ },
  { device: 'mobile', file: 'my-listings-mobile.handover.html', out: 'phone-spec.md', title: 'My Listings — new theme · phone spec (360)', card: /^S[1-8]$/ },
];

const READ = () => {
  /* a stylesheet, not inline styles: the builds re-render their own */
  const css = document.createElement('style');
  css.textContent = '.sc-host[data-sc-name^="My Listing"], [data-screen-label], [data-mock-id] { display: none !important; }';
  document.head.appendChild(css);
  return [...document.querySelectorAll('section')].map((s) => s.innerText);
};

/* the lines of a section as markdown */
const md = (text, card) => {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const out = [];
  let i = 0;
  const [head, ...rest] = [lines[0], ...lines.slice(1)];
  out.push(`## ${head.replace(/^(\d\d[a-z]?) · (.+)$/, (m, n, t) => `${n} · ${t.charAt(0) + t.slice(1).toLowerCase()}`)}`, '');
  const L = rest;
  const CONTROL = /^(Show redlines|Redlines|Load screen|Replay( all)?|Download all \.lottie|\.lottie|\.json|Reset|Reload build|Renders the real build at this state)$/;
  while (i < L.length) {
    const l = L[i];
    if (card.test(l) && L[i + 1] && !CONTROL.test(L[i + 1])) {
      /* a screen: its letter, title and subtitle */
      out.push('', `### ${l} · ${L[i + 1]}${L[i + 2] && !/^(ELEMENT|RULES)$/.test(L[i + 2]) ? ` — ${L[i + 2]}` : ''}`, '');
      i += L[i + 2] && !/^(ELEMENT|RULES)$/.test(L[i + 2]) ? 3 : 2;
      continue;
    }
    if (l === 'ELEMENT' && L[i + 1] === 'SPEC') {
      out.push('', '| element | spec |', '|---|---|');
      i += 2;
      while (i < L.length && L[i] !== 'RULES' && !card.test(L[i])) {
        if (L[i] === '→') { i++; continue; }
        const name = L[i], value = L[i + 1] === '→' ? L[i + 2] : L[i + 1];
        if (value === undefined || value === 'RULES' || card.test(value)) { out.push(`| ${name.replace(/\|/g, '\\|')} | |`); i++; break; }
        out.push(`| ${name.replace(/\|/g, '\\|')} | ${value.replace(/\|/g, '\\|')} |`);
        i += L[i + 1] === '→' ? 3 : 2;
      }
      out.push('');
      continue;
    }
    if (l === 'RULES') { out.push('', '**Rules**', ''); i++; continue; }
    if (CONTROL.test(l) || (card.test(l) && CONTROL.test(L[i + 1] || ''))) { i++; continue; }
    out.push(l.length > 60 || /[.:]$/.test(l) ? `${l}\n` : `- ${l}`);
    i++;
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n');
};

const browser = await chromium.launch();
mkdirSync(KB, { recursive: true });
mkdirSync(join(ROOT, 'data', 'theme'), { recursive: true });
for (const d of DOCS) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(pathToFileURL(join(SRC, d.file)).href, { waitUntil: 'load' });
  await page.waitForTimeout(7000);
  const sections = await page.evaluate(READ);
  await page.close();
  writeFileSync(join(ROOT, 'data', 'theme', `spec-${d.device}.txt`), sections.join('\n\n────────\n\n'));
  /* the phone handover opens on an unnumbered summary: it is its 00 */
  const body = sections.map((s, i) => (i === 0 && !/^\d\d[a-z]? · /.test(s.trim()) ? `00 · SUMMARY\n${s}` : s)).filter((s) => /^\d\d[a-z]? · /.test(s.trim())).map((s) => md(s, d.card)).join('\n\n');
  writeFileSync(join(KB, d.out), `# ${d.title}

> The designer's handover for the new My Listings (Profolio 2.0, not yet live), in the
> designer's own words — laid out by \`scripts/theme/spec.mjs\` from
> \`authoring/themes/new/${d.file}\`, nothing rewritten. Its screens and states, compiled:
> \`pages/listings/new/\`. Its tokens: \`tokens.md\` → *My Listings — new theme*.
> Where this spec and the compiled states disagree, the compiled states are the build as
> drawn; flag the difference [TBC].

${body}
`);
  console.log(`  data/theme/spec/${d.out} — ${sections.length} sections, ${body.length} chars`);
}
await browser.close();
