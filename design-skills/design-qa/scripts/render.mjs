#!/usr/bin/env node
/**
 * design-qa's render pass: every screen rendered at its platform's widths, and measured.
 *
 *   node scripts/render.mjs --screens <dir|file> [<dir|file> ...] [--platforms web,ios]
 *        [--context design/context.json] [--profile hifi|wireframe] [--out qa/report]
 *        [--also-widths 320,1280] [--shots] [--no-install]
 *
 * --also-widths renders every screen at those widths too (brk.render, lay.overlap, lay.clip):
 * 320 CSS px is WCAG's reflow width (1.4.10), which no platform breakpoint covers.
 * For each screen, on each platform in scope (schema/platforms.json, widths from the
 * context card where it has them):
 *   - the layout, accessibility, resource and motion checks (scripts/page-checks.js)
 *     at the platform's own width;
 *   - brk.render, lay.overlap and lay.clip again at each of its breakpoints;
 *   - mot.reduced, with prefers-reduced-motion: reduce (hi-fi);
 *   - a Tab pass for a11y.focusring and a11y.focus, where the platform needs a visible
 *     focus (hi-fi);
 *   - the content extremes (ovf.*), in the first row of every repeated structure;
 *   - the interaction sweep (int.*): every control that opens a menu, dialog, sheet or
 *     popover is clicked, and what it opens is checked: visible, in view, not clipped,
 *     styled.
 *
 * Writes <out>/render.json, which `run.py --rendered-dir <out>` folds into report.json,
 * and with --shots a PNG of each render to <out>/shots/. Exit 3 when no browser could be
 * had: the render checks stay skipped, and the report says so.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, basename, resolve, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL = join(HERE, '..');
const argv = process.argv.slice(2);
const opt = (n, d = null) => { const i = argv.indexOf(n); return i > -1 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const many = (n) => { const i = argv.indexOf(n); const out = []; if (i < 0) return out; for (let k = i + 1; k < argv.length && !argv[k].startsWith('--'); k++) out.push(argv[k]); return out; };
const flag = (n) => argv.includes(n);
const OUT = resolve(opt('--out', 'qa/report'));
const PROFILE = opt('--profile', 'hifi');
const WIRE = PROFILE === 'wireframe';
const SHOTS = flag('--shots');
const log = (s) => console.log(s);

/* the launcher: scripts/browser.mjs in a built skill, design-skills/_shared/ in the source */
const LAUNCHER = [join(HERE, 'browser.mjs'), join(HERE, '..', '..', '_shared', 'browser.mjs')].find(existsSync);
const CHECKS = readFileSync(join(HERE, 'page-checks.js'), 'utf8');
const PLATFORMS = JSON.parse(readFileSync(join(SKILL, 'schema', 'platforms.json'), 'utf8')).platforms;
const cardPath = opt('--context') || ['design/context.json'].find(existsSync);
const CARD = cardPath && existsSync(cardPath) ? JSON.parse(readFileSync(cardPath, 'utf8')) : null;

/* the screens */
const screens = [];
const take = (p) => {
  if (!existsSync(p)) return;
  if (statSync(p).isDirectory()) for (const n of readdirSync(p)) { if (/^(qa|shots|node_modules)$/.test(n)) continue; take(join(p, n)); }
  else if (/\.html?$/i.test(p)) screens.push(resolve(p));
};
many('--screens').forEach(take);
if (!screens.length) { console.error('  no screens: pass --screens <folder or files>'); process.exit(2); }

/* the platforms, and which screens each one draws */
const ids = (opt('--platforms') || (CARD && CARD.platforms && CARD.platforms.map((p) => p.id).join(',')) || 'web').split(',').map((s) => s.trim()).filter(Boolean);
const phoneFile = (f) => /\.(mobile|phone|ios|android)\.html?$/i.test(f);
const plats = ids.map((id) => {
  /* a platform id the config does not name: "phone" or "mobile" is a web product on a phone (WCAG's 24px),
     never iOS's 44pt; a native app names ios or android */
  const known = PLATFORMS[id] || (/phone|mobile/.test(id) ? PLATFORMS.phone : /ios/.test(id) ? PLATFORMS.ios : /android/.test(id) ? PLATFORMS.android : /tablet/.test(id) ? PLATFORMS.tablet : PLATFORMS.web);
  const fromCard = CARD && (CARD.platforms || []).find((p) => p.id === id);
  const touch = !!known.gestures;
  const bps = (known.breakpoints || []).slice().sort((a, b) => a - b);
  const width = (fromCard && fromCard.width) || (touch ? bps[0] : bps[bps.length - 1]) || 1440;
  const height = (fromCard && fromCard.height) || (touch ? 812 : 900);
  const mine = touch ? (screens.some(phoneFile) ? screens.filter(phoneFile) : screens) : screens.filter((f) => !phoneFile(f));
  return { id, touch, width, height, breakpoints: bps.filter((b) => b !== width), minTarget: (fromCard && fromCard.min_target) || known.hit_target_min || 24, wcag: !/^(ios|android|tablet)$/.test(id), gapMin: known.adjacent_gap_min || 8, focusVisible: !!known.focus_visible_required, screens: mine };
});
const durations = CARD && CARD.tokens && CARD.tokens.motion && CARD.tokens.motion.durations ? Object.values(CARD.tokens.motion.durations).map((d) => { const v = String(d.value); return /ms$/.test(v) ? parseFloat(v) : parseFloat(v) * 1000; }).filter((n) => n > 0) : [];
const BUDGET = durations.length ? Math.max(...durations) * 1.5 : 500;
const RTL = flag('--rtl') || !!(CARD && (CARD.locales || []).some((l) => l.dir === 'rtl'));
const TEXT_SPACING = '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}';
const ALSO = (opt('--also-widths') || '').split(',').map((w) => parseInt(w, 10)).filter((w) => w > 0);
for (const p of plats) p.breakpoints = [...new Set([...p.breakpoints, ...ALSO])].filter((w) => w !== p.width).sort((a, b) => a - b);

if (!LAUNCHER) { console.error('  scripts/browser.mjs is missing'); process.exit(2); }
const { launch } = await import(pathToFileURL(LAUNCHER).href);
mkdirSync(OUT, { recursive: true });
const b = await launch({ install: !flag('--no-install'), log });
if (b.error) {
  writeFileSync(join(OUT, 'render.json'), JSON.stringify({ schema: 'design-qa/render/v1', ok: false, error: b.error, findings: [], checks_run: [] }, null, 2));
  log(`  no browser — ${b.error}. The render checks are skipped; the report will say so.`);
  process.exit(3);
}

const findings = [], cases = {}, count = (check, n = 1) => { cases[check] = (cases[check] || 0) + n; };
const cov = { renders: 0, widths: 0, interactions: 0, extremes: 0, focus: 0 };
const nameOf = (f) => relative(process.cwd(), f).split('\\').join('/');
const record = (f, screen, platform, width, kase) => findings.push({ check: f.check, screen, platform, width, case: kase, message: f.message, css_path: f.css_path || null, node: f.node || null, expected: f.expected ?? null, actual: f.actual ?? null, box: f.box || null });
const LAYOUT = new Set(['brk.render', 'lay.overlap', 'lay.clip', 'cpy.undefined']);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function load(page, file) {
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => 1) : 1));
  await wait(150);
  await page.addScript(CHECKS);
}
const shot = async (page, file, plat, tag) => { if (!SHOTS) return; mkdirSync(join(OUT, 'shots'), { recursive: true }); await page.screenshot({ path: join(OUT, 'shots', `${basename(file).replace(/\.html?$/i, '')}.${plat.id}.${tag}.png`), fullPage: tag === 'default' }); };

for (const plat of plats) {
  for (const file of plat.screens) {
    const screen = nameOf(file);
    const page = await b.page({ width: plat.width, height: plat.height });
    const args = { profile: PROFILE, minTarget: plat.minTarget, wcag: plat.wcag, gapMin: plat.gapMin, touch: plat.touch, motionBudget: BUDGET };
    try {
      await load(page, file);
      const base = await page.evaluate((a) => window.__dqa.run(a), args);
      cov.renders++; cov.widths++;
      base.findings.forEach((f) => record(f, screen, plat.id, plat.width, 'default'));
      ['lay.align', 'lay.controls', 'lay.rows', 'lay.squashed', 'lay.spacing', 'lay.overlap', 'lay.clip', 'a11y.target', 'a11y.small', 'res.image', 'brk.render', 'cpy.undefined'].concat(plat.touch ? ['a11y.gap'] : []).concat(WIRE ? [] : ['a11y.contrast.body', 'a11y.contrast.large', 'a11y.contrast.ui', 'res.font', 'mot.budget', 'mot.infinite']).forEach((c) => count(c));
      const baseline = new Set(base.findings.map((f) => f.check + '|' + f.message));
      await shot(page, file, plat, 'default');

      /* the other breakpoints */
      for (const w of plat.breakpoints) {
        await page.setViewport({ width: w, height: plat.height });
        await wait(120);
        const r = await page.evaluate((a) => window.__dqa.run(a), args);
        cov.widths++;
        r.findings.filter((f) => LAYOUT.has(f.check) && !baseline.has(f.check + '|' + f.message)).forEach((f) => record(f, screen, plat.id, w, `width ${w}`));
        count('brk.render');
      }
      await page.setViewport({ width: plat.width, height: plat.height });
      const again = async (prep, check, kase, msg) => {
        await load(page, file);
        await prep();
        await wait(120);
        const r = await page.evaluate((a) => window.__dqa.run(a), args);
        r.findings.filter((f) => LAYOUT.has(f.check) && !baseline.has(f.check + '|' + f.message)).forEach((f) => record({ ...f, check, message: `${msg}: ${f.message}` }, screen, plat.id, plat.width, kase));
        count(check);
      };
      /* WCAG 1.4.12: text spacing raised to its limits; 1.4.4: text at 200% (half the CSS width) */
      await again(() => page.addScript(`document.head.insertAdjacentHTML('beforeend','<style>${TEXT_SPACING}</style>')`), 'a11y.spacing', 'text spacing 1.4.12', 'With WCAG text spacing');
      if (!plat.touch) { await again(() => page.setViewport({ width: Math.round(plat.width / 2), height: plat.height }), 'a11y.zoom', 'zoom 200%', `At 200% zoom (${Math.round(plat.width / 2)} CSS px)`); await page.setViewport({ width: plat.width, height: plat.height }); }
      /* WCAG 1.3.4: a phone turned sideways */
      if (plat.touch) { await again(() => page.setViewport({ width: plat.height, height: plat.width }), 'a11y.orientation', 'landscape', `In landscape (${plat.height} × ${plat.width})`); await page.setViewport({ width: plat.width, height: plat.height }); }
      /* right to left: the layout mirrored, where the product ships an RTL language */
      if (RTL) await again(() => page.evaluate(() => { document.documentElement.dir = 'rtl'; }), 'rtl.layout', 'dir=rtl', 'Right to left');

      if (!WIRE) {
        /* reduced motion */
        await page.reducedMotion(true);
        await load(page, file);
        (await page.evaluate(() => window.__dqa.stillMoving())).forEach((f) => record(f, screen, plat.id, plat.width, 'prefers-reduced-motion'));
        count('mot.reduced');
        await page.reducedMotion(false);

        /* focus: Tab through, and see each control's focus */
        if (plat.focusVisible) {
          await load(page, file);
          const before = await page.evaluate(() => window.__dqa.focusables());
          const total = Object.keys(before).length, seen = new Set();
          for (let i = 0; i < Math.min(total, 40); i++) {
            await page.keyboard.press('Tab');
            const st = await page.evaluate(() => window.__dqa.focusState());
            if (!st || seen.has(st.css_path)) break;
            seen.add(st.css_path);
            cov.focus++;
            if (before[st.css_path] !== undefined && before[st.css_path] === st.look) record({ check: 'a11y.focusring', message: `“${st.label}” shows no change when it has keyboard focus`, css_path: st.css_path, node: st.node, box: st.box }, screen, plat.id, plat.width, 'keyboard focus');
            if (st.obscured) record({ check: 'a11y.focusobscured', message: `“${st.label}” has keyboard focus but is hidden behind ${st.obscured}`, css_path: st.css_path, node: st.node, box: st.box }, screen, plat.id, plat.width, 'keyboard focus');
            if (st.tabindex && +st.tabindex > 0) record({ check: 'a11y.focus', message: `“${st.label}” has tabindex=${st.tabindex}, which takes it out of the reading order`, css_path: st.css_path, node: st.node, box: st.box }, screen, plat.id, plat.width, 'keyboard focus');
          }
          count('a11y.focusring', seen.size); count('a11y.focus', seen.size); count('a11y.focusobscured', seen.size);
        }
      }

      /* each state a screen holds as a hidden block ([data-state]): shown alone, and checked */
      const states = await page.evaluate(() => [...new Set([...document.querySelectorAll('[data-state]')].map((e) => e.getAttribute('data-state')))]);
      for (const st of states) {
        await load(page, file);
        const shown = await page.evaluate((name) => {
          const all = [...document.querySelectorAll('[data-state]')];
          const mine = all.filter((e) => e.getAttribute('data-state') === name);
          if (!mine.length || mine.every((e) => !e.hidden && getComputedStyle(e).display !== 'none')) return false;   /* already on screen */
          all.forEach((e) => { const on = e.getAttribute('data-state') === name; e.hidden = !on; if (on) e.style.display = ''; });
          return true;
        }, st);
        if (!shown) continue;
        const r = await page.evaluate((a) => window.__dqa.run(a), args);
        cov.states = (cov.states || 0) + 1; count('cov.state');
        r.findings.forEach((f) => record(f, screen, plat.id, plat.width, `state: ${st}`));
        await shot(page, file, plat, 'state-' + st);
      }

      /* content extremes */
      for (const kind of ['long', 'big_number', 'zero', 'negative', 'empty_string', 'single_char', 'arabic', 'no_image']) {
        await load(page, file);
        const ex = await page.evaluate((k) => window.__dqa.extremes(k), kind);
        if (!ex.changed) continue;
        cov.extremes++; count('ovf.' + kind);
        const r = await page.evaluate((a) => window.__dqa.run(a), args);
        r.findings.filter((f) => LAYOUT.has(f.check) && !baseline.has(f.check + '|' + f.message)).forEach((f) => record({ ...f, check: 'ovf.' + kind, message: `${f.message} (with ${kind.replace('_', ' ')} values)` }, screen, plat.id, plat.width, `extreme: ${kind}`));
        if (kind === 'empty_string' || kind === 'no_image') (await page.evaluate(() => window.__dqa.collapsed())).forEach((f) => record({ ...f, check: 'ovf.' + kind, message: `${f.message} when its ${kind === 'no_image' ? 'image is missing' : 'values are empty'}` }, screen, plat.id, plat.width, `extreme: ${kind}`));
        if (ex.changed) await shot(page, file, plat, 'x-' + kind);
      }

      /* the interaction sweep */
      await load(page, file);
      const targets = await page.evaluate(() => window.__dqa.triggers());
      for (const t of targets.slice(0, 12)) {
        await load(page, file);
        const at = await page.evaluate((p) => { const e = document.querySelector(p); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); window.__dqa.mark(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, t.css_path);
        if (!at) continue;
        await page.mouse.click(at.x, at.y);
        await wait(400);
        /* a control that goes to another screen is a link, not something that opens here */
        const r = await page.evaluate((n) => (window.__dqa ? window.__dqa.opened(n) : { navigated: true, findings: [] }), t.label).catch(() => ({ navigated: true, findings: [] }));
        if (r.navigated) continue;
        cov.interactions++; count('int.dead'); count('int.offscreen'); count('int.clip'); count('int.unstyled');
        r.findings.forEach((f) => record(f, screen, plat.id, plat.width, `opened: ${t.label}`));
        await shot(page, file, plat, 'i' + cov.interactions);
      }
    } catch (e) {
      record({ check: 'brk.render', message: `The screen did not render: ${String(e.message).split('\n')[0]}` }, screen, plat.id, plat.width, 'load');
    } finally {
      await page.close();
    }
  }
}
await b.close();

/* one finding per check, screen, platform and message; at most ten of one check on one screen,
   the tenth saying how many more there are — a list of forty contrast findings hides the rest */
const seenF = new Set(), per = new Map();
const unique = [];
for (const f of findings) {
  const k = [f.check, f.screen, f.platform, f.message].join('|');
  if (seenF.has(k)) continue;
  seenF.add(k);
  const g = [f.check, f.screen, f.platform].join('|');
  const n = (per.get(g) || 0) + 1;
  per.set(g, n);
  if (n <= 10) unique.push(f);
}
for (const [g, n] of per) if (n > 10) { const [check, screen, platform] = g.split('|'); const last = unique.filter((f) => f.check === check && f.screen === screen && f.platform === platform).pop(); last.message += ` (and ${n - 10} more like this on this screen)`; last.more = n - 10; }
const coverage = `${plats.reduce((n, p) => n + p.screens.length, 0)} screen renders on ${plats.map((p) => p.id).join(' + ')} · ${cov.widths} widths${cov.states ? ` · ${cov.states} hidden states` : ''} · ${cov.interactions} interactions · ${cov.extremes} extreme-data renders` + (WIRE ? '' : ` · ${cov.focus} keyboard-focus stops`);
writeFileSync(join(OUT, 'render.json'), JSON.stringify({
  schema: 'design-qa/render/v1', ok: true, browser: b.name, profile: PROFILE, generated_at: new Date().toISOString(),
  platforms: plats.map((p) => ({ id: p.id, width: p.width, breakpoints: p.breakpoints, min_target: p.minTarget, screens: p.screens.length })),
  context: cardPath || null, motion_budget_ms: BUDGET, coverage,
  checks_run: Object.entries(cases).map(([check, n]) => ({ check, cases: n })),
  findings: unique,
}, null, 2));
log(`  render: ${coverage} (${b.name})`);
log(`  ${unique.length} finding(s) → ${relative(process.cwd(), join(OUT, 'render.json'))}`);
