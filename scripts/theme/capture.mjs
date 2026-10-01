#!/usr/bin/env node
/**
 * The NEW theme's My Listings — compiled from the designer's handover, the
 * way scripts/compile.mjs compiles the product.
 *
 * The new My Listings is not live yet (Profolio 2.0, due mid-October 2026),
 * so the product cannot be rendered. What exists is the designer's handover
 * (authoring/themes/new/*.handover.html — Claude Design exports: a spec with
 * the real build embedded, one live instance per screen). Each state is
 * reached in that build through the spec's own controls — a screen card's
 * toggle (03), a scenario of the state panel (02c) — or, for the moments
 * only the prototype reaches (a menu, the tour, a confirmation), by setting
 * the build's own state. The live instance is lifted out of its scaled frame
 * to its native size, frozen with exactly the CSS that paints it, then
 * re-rendered and pixel-diffed against the instance it came from — the same
 * bar as the product, 0.5%.
 *
 * Everything written is tagged as the design, not the product: a
 * <meta name="pf-theme" content="new">, and a pf-compiled line that says it
 * came from the handover. At launch the product is compiled instead, and the
 * two are compared.
 *
 *   node scripts/theme/capture.mjs                  web and phone
 *   node scripts/theme/capture.mjs --device web --only sorting,modal-share
 *
 * Writes deliverables/new-theme/{listings.html, states/, mobile/, fonts.css}
 * and data/theme/{live,ours}/*.png, data/theme/states.json.
 */
import pkg from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import STATES from './states.mjs';
import { ownFrame } from './frame.mjs';
import { ZONE } from '../../harness/devices.mjs';

const { chromium } = pkg;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = join(ROOT, 'authoring', 'themes', 'new');
const OUT = join(ROOT, 'deliverables', 'new-theme');
const DATA = join(ROOT, 'data', 'theme');
const arg = (n, d = null) => { const i = process.argv.indexOf(n); return i > -1 ? process.argv[i + 1] : d; };
const ONLY = (arg('--only') || '').split(',').filter(Boolean);
const DEVICES = arg('--device') ? [arg('--device')] : ['web', 'mobile'];
const WORKERS = +arg('--workers', 3);
const BAR = 0.5;
const HANDOVER = { web: join(SRC, 'my-listings-web.handover.html'), mobile: join(SRC, 'my-listings-mobile.handover.html') };
const SIZE = { web: [1440, 900], mobile: [360, 800] };
const DRAFT = "the designer's handover (Profolio 2.0 · My Listings · Draft 3, 15 Sep 2026)";
/* the official riyal sign, as the product's icon font draws it (scripts/kit/riyal.py) */
const RIYAL = (() => {
  const svg = readFileSync(join(ROOT, 'skill', 'kit', 'riyal.svg'), 'utf8');
  const [, w, h] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  return { d: svg.match(/ d="([^"]+)"/)[1], w: +w, h: +h };
})();

/* ── in the handover page ───────────────────────────────────────────── */

/* the frame a state is reached through: a screen card of 03 (by its letter)
   or a section (by its heading), marked data-pf-scope */
const markScope = (page, { card, section, title }) => page.evaluate((via) => {
  const t = (e) => (e.textContent || '').trim();
  const sectionOf = (head) => { let s = [...document.querySelectorAll('*')].find((e) => e.children.length === 0 && t(e).startsWith(head)); while (s && s.tagName !== 'SECTION') s = s.parentElement; return s; };
  let scope = null;
  if (via.card) {
    /* a card of 03, found by its title (its controls change as it loads) */
    const s03 = sectionOf(via.cards || '03 ·');
    const head = s03 && [...s03.querySelectorAll('div,span')].find((e) => t(e) === via.title);
    scope = head;
    if (scope) while (scope.parentElement && t(scope).length < 250) scope = scope.parentElement;
  } else if (via.section) scope = sectionOf(via.section);
  document.querySelectorAll('[data-pf-scope]').forEach((e) => e.removeAttribute('data-pf-scope'));
  if (!scope) return false;
  scope.setAttribute('data-pf-scope', '');
  scope.scrollIntoView({ block: 'center' });
  return true;
}, { card, section, title });

/* a control of the spec inside the scope, by its exact words — the innermost
   one, and never one inside the live build (a chip named "Improve Quality"
   is not the build's own Improve Quality link) */
const press = (page, text) => page.evaluate((text) => {
  const scope = document.querySelector('[data-pf-scope]');
  const inBuild = (e) => !!e.closest('.sc-host[data-sc-name^="My Listing"], [data-phone], [data-screen-label]');
  const el = scope && [...scope.querySelectorAll('div,span,button,a')].filter((e) => !inBuild(e) && (e.textContent || '').trim().replace(/\s+/g, ' ') === text).sort((a, b) => a.textContent.length - b.textContent.length || (a.contains(b) ? 1 : -1))[0];
  if (!el) return false;
  el.click();
  return true;
}, text);

/* the build's own logic, through React: its state is what the scenario
   props set, and what the prototype's clicks change */
const BUILD = () => {
  const scope = document.querySelector('[data-pf-scope]');
  const hostEl = scope && scope.querySelector('.sc-host[data-sc-name]');
  if (!hostEl) return false;
  const key = Object.keys(hostEl).find((k) => k.startsWith('__reactFiber$'));
  const isBuild = (s) => s && typeof s.setState === 'function' && s.state && ('caseKey' in s.state || 'tab' in s.state);
  window.__pfBuild = null;
  for (let f = hostEl[key]; f && !window.__pfBuild; f = f.return) {
    const n = f.stateNode;
    if (n && isBuild(n.logic)) window.__pfBuild = n.logic;
    else if (isBuild(n)) window.__pfBuild = n;
  }
  return !!window.__pfBuild;
};

/* stop time: timers, frames, Lottie, CSS animations held where they are */
const STOP_CLOCK = () => {
  const last = setTimeout(() => {}, 0);
  for (let i = 1; i <= last; i++) { clearTimeout(i); clearInterval(i); }
  window.requestAnimationFrame = () => 0;
  try { window.lottie && window.lottie.freeze && window.lottie.freeze(); } catch {}
  const kebab = (p) => p.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
  for (const a of document.getAnimations()) {
    const el = a.effect && a.effect.target;
    if (!el || !a.effect.getKeyframes) continue;
    const props = new Set(a.effect.getKeyframes().flatMap((k) => Object.keys(k)).filter((k) => !['offset', 'easing', 'composite', 'computedOffset'].includes(k)).map(kebab));
    const cs = getComputedStyle(el);
    const hold = [...props].map((p) => [p, cs.getPropertyValue(p)]);
    a.cancel();
    for (const [p, v] of hold) if (v) el.style.setProperty(p, v, 'important');
    el.style.setProperty('animation', 'none', 'important');
    el.style.setProperty('transition', 'none', 'important');
  }
};

/* the frame and its screen never scroll — a scrollIntoView inside the build
   can move them; what scrolls inside the screen (a list, a drawer) is kept */
const FRAME_STILL = () => {
  const host = document.querySelector('[data-pf-theme-host]');
  const board = host && (host.hasAttribute('data-screen-label') ? host : host.querySelectorAll('[data-screen-label]')[+host.getAttribute('data-pf-theme-board')]);
  if (!board) return 'no screen';
  for (let e = board; e && e !== host.parentElement; e = e.parentElement) { e.scrollTop = 0; e.scrollLeft = 0; }
  /* and the window: a shot is clipped in page coordinates */
  document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  return 'ok';
};

/* the live instance in the scope: the scaled box that holds its screen */
const LIFT = ([W, H]) => {
  const scope = document.querySelector('[data-pf-scope]');
  const board = scope && [...scope.querySelectorAll('[data-screen-label]')].find((e) => e.offsetWidth >= W - 1 && e.offsetHeight >= H * 0.8);
  if (!board) return `no screen in the scope (${scope ? [...scope.querySelectorAll('[data-screen-label]')].map((e) => `${e.getAttribute('data-screen-label')} ${e.offsetWidth}x${e.offsetHeight}`).join(', ') || 'none' : 'no scope'})`;
  let host = null;
  for (let e = board.parentElement; e && e !== scope; e = e.parentElement) {
    const tr = getComputedStyle(e).transform;
    if (tr && tr !== 'none' && !/^matrix\(1, 0, 0, 1,/.test(tr)) { host = e; break; }
  }
  /* a screen drawn at its own size (the phone prototype) is its own frame */
  if (!host && board.offsetWidth === W && board.offsetHeight === H && getComputedStyle(board).overflow === 'hidden') host = board;
  if (!host) return 'no scaled frame';
  /* nothing above the frame may hold its fixed layers */
  for (let e = host.parentElement; e && e !== document.documentElement; e = e.parentElement) {
    const cs = getComputedStyle(e);
    if (cs.transform !== 'none' || cs.filter !== 'none' || cs.perspective !== 'none' || /paint|layout|strict|content/.test(cs.contain) || cs.willChange.includes('transform'))
      for (const p of ['transform', 'filter', 'contain', 'perspective']) e.style.setProperty(p, 'none', 'important');
  }
  host.setAttribute('data-pf-theme-host', '');
  for (const [p, v] of [['transform', 'none'], ['position', 'fixed'], ['left', '0'], ['top', '0'], ['right', 'auto'], ['bottom', 'auto'], ['margin', '0'], ['width', `${W}px`], ['height', `${H}px`], ['overflow', 'hidden'], ['z-index', '2147483646']]) host.style.setProperty(p, v, 'important');
  document.documentElement.style.setProperty('overflow', 'hidden', 'important');
  document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important');
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  /* the frame never scrolls (a scrollIntoView inside the build can move it);
     what scrolls inside the screen is kept */
  host.setAttribute('data-pf-theme-board', [...host.querySelectorAll('[data-screen-label]')].indexOf(board));
  for (let e = board; e && e !== host.parentElement; e = e.parentElement) { e.scrollTop = 0; e.scrollLeft = 0; }
  if (host === board) host.style.setProperty('flex', 'none', 'important');
  return 'ok';
};

/* the whole screen: the frame (and the window, which the build's fixed
   layers measure) grows by what its scrollers still hide, until none does */
const OVERFLOW = () => {
  const host = document.querySelector('[data-pf-theme-host]');
  let extra = 0;
  for (const e of host.querySelectorAll('*')) {
    const cs = getComputedStyle(e);
    if (!/(auto|scroll)/.test(cs.overflowY) || cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = e.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) continue;
    /* a closed drawer parked beside the frame is not part of the screen */
    const hr = host.getBoundingClientRect();
    if (r.left >= hr.right - 1 || r.right <= hr.left + 1 || !e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    extra = Math.max(extra, e.scrollHeight - e.clientHeight);
  }
  return extra;
};
const GROW = async (page, W, H) => {
  let h = H;
  for (let i = 0; i < 6; i++) {
    const extra = await page.evaluate(OVERFLOW);
    if (extra <= 1) break;
    h += extra;
    await page.setViewportSize({ width: W, height: h });
    await page.evaluate((h) => document.querySelector('[data-pf-theme-host]').style.setProperty('height', `${h}px`, 'important'), h);
    await page.waitForTimeout(400);
  }
  /* a scroller other than the screen's own can grow the frame past its content (a longer list
     kept in another tab): the frame ends where the last thing drawn ends */
  const bottom = await page.evaluate((h) => {
    const host = document.querySelector('[data-pf-theme-host]');
    let low = 0;
    for (const e of host.querySelectorAll('*')) {
      const r = e.getBoundingClientRect();
      if (!e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) || r.height >= h * 0.8 || r.width < 1 || r.height < 1) continue;
      /* what is pinned to the frame's foot (a banner) follows the foot; it is not content to keep */
      if (r.bottom >= h - 2) continue;
      const cs = getComputedStyle(e);
      const drawn = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || e instanceof SVGElement || cs.backgroundColor !== 'rgba(0, 0, 0, 0)' || cs.backgroundImage !== 'none' || parseFloat(cs.borderBottomWidth) > 0;
      if (!drawn) continue;
      /* and seen: a list under an opaque sheet is not what the frame shows */
      const top = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), Math.min(Math.max(r.bottom - 2, 0), innerHeight - 1));
      if (top && (e.contains(top) || top.contains(e))) low = Math.max(low, r.bottom);
    }
    return Math.ceil(low);
  }, h);
  if (h > H && bottom > 0 && h - bottom > 80) {
    h = Math.max(H, bottom + 40);
    await page.setViewportSize({ width: W, height: h });
    await page.evaluate((h) => document.querySelector('[data-pf-theme-host]').style.setProperty('height', `${h}px`, 'important'), h);
    await page.waitForTimeout(400);
  }
  return h;
};

/* quiet: half a second without a DOM change, three seconds at most */
const QUIET = async () => {
  let last = performance.now();
  const obs = new MutationObserver(() => { last = performance.now(); });
  obs.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
  const t0 = performance.now();
  while (performance.now() - t0 < 3000) { await new Promise((r) => setTimeout(r, 100)); if (performance.now() - last > 500) break; }
  obs.disconnect();
};

/* the instance as markup, with exactly the CSS that paints it */
const SERIALIZE = async () => {
  const host = document.querySelector('[data-pf-theme-host]');
  const els = [host, ...host.querySelectorAll('*')];
  const cs = getComputedStyle(host);
  const INHERIT = ['font-family', 'font-size', 'font-weight', 'font-style', 'line-height', 'color', 'letter-spacing', 'word-spacing', 'text-align', 'text-transform', 'white-space', 'direction', '-webkit-font-smoothing', 'text-rendering', 'font-feature-settings', 'font-variant-numeric'];
  /* what the frame inherits, and every custom property it sees */
  const custom = [...cs].filter((p) => p.startsWith('--')).map((p) => `${p}:${cs.getPropertyValue(p).trim()}`);
  const inherited = [...INHERIT.map((p) => `${p}:${cs.getPropertyValue(p)}`), ...custom].join(';').replace(/"/g, "'");
  const strip = (sel) => sel.replace(/::?(before|after|placeholder|selection|marker|backdrop|first-letter|first-line|-webkit-[\w-]+|-moz-[\w-]+)(\([^)]*\))?/g, '').replace(/:(hover|focus|focus-visible|focus-within|active|visited|checked|disabled)\b/g, '');
  const used = (sel) => sel.split(',').some((part) => { const s = strip(part).trim() || '*'; try { return host.matches(s) || !!host.querySelector(s); } catch { return false; } });
  const families = new Set();
  for (const e of els) for (const f of getComputedStyle(e).fontFamily.split(',')) families.add(f.trim().replace(/["']/g, '').toLowerCase());
  const anims = new Set();
  const css = [], faces = [];
  const walk = (rules, into) => {
    for (const r of rules) {
      if (r instanceof CSSStyleRule) { if (used(r.selectorText)) { into.push(r.cssText); const a = r.style.animationName; if (a) a.split(',').forEach((x) => anims.add(x.trim())); } }
      else if (r instanceof CSSMediaRule) { const inner = []; walk(r.cssRules, inner); if (inner.length) into.push(`@media ${r.conditionText} { ${inner.filter((x) => typeof x === 'string').join('\n')} }`); }
      else if (r instanceof CSSFontFaceRule) { const fam = r.style.getPropertyValue('font-family').replace(/["']/g, '').trim().toLowerCase(); if (families.has(fam)) faces.push(r.cssText); }
      else if (r instanceof CSSKeyframesRule) into.push({ keyframes: r.name, text: r.cssText });
      else if (r.cssRules) walk(r.cssRules, into);
    }
  };
  for (const sh of document.styleSheets) { try { walk(sh.cssRules, css); } catch {} }
  for (const e of els) { const a = getComputedStyle(e).animationName; if (a && a !== 'none') a.split(',').forEach((x) => anims.add(x.trim())); }
  const cssText = css.filter((x) => typeof x === 'string' || anims.has(x.keyframes)).map((x) => (typeof x === 'string' ? x : x.text)).join('\n');
  /* pictures the build holds as blob: URLs become data: URLs */
  const toData = async (url) => { try { const b = await (await fetch(url)).blob(); return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(b); }); } catch { return url; } };
  /* what is scrolled inside the screen stays scrolled; a canvas is kept as the picture it shows */
  for (const e of host.querySelectorAll('*')) if (e.scrollTop || e.scrollLeft) e.setAttribute('data-pf-scroll', `${e.scrollLeft},${e.scrollTop}`);
  for (const c of host.querySelectorAll('canvas')) { try { c.setAttribute('data-pf-canvas', c.toDataURL()); } catch {} }
  const clone = host.cloneNode(true);
  for (const e of host.querySelectorAll('[data-pf-scroll],[data-pf-canvas]')) { e.removeAttribute('data-pf-scroll'); e.removeAttribute('data-pf-canvas'); }
  for (const c of clone.querySelectorAll('canvas[data-pf-canvas]')) { const img = document.createElement('img'); for (const a of c.attributes) if (!['data-pf-canvas', 'width', 'height'].includes(a.name)) img.setAttribute(a.name, a.value); img.src = c.getAttribute('data-pf-canvas'); c.replaceWith(img); }
  for (const img of clone.querySelectorAll('img[src^="blob:"], image[href^="blob:"]')) { const k = img.hasAttribute('src') ? 'src' : 'href'; img.setAttribute(k, await toData(img.getAttribute(k))); }
  for (const el of clone.querySelectorAll('[style*="blob:"]')) { let s = el.getAttribute('style'); for (const m of s.match(/blob:[^)"']+/g) || []) s = s.replace(m, await toData(m)); el.setAttribute('style', s); }
  const facesOut = [];
  for (let f of faces) { for (const m of f.match(/url\("?(blob:[^)"]+)"?\)/g) || []) { const u = m.replace(/^url\("?|"?\)$/g, ''); f = f.replace(u, await toData(u)); } facesOut.push(f); }
  return { html: clone.innerHTML, css: cssText, inherited, faces: facesOut, background: cs.backgroundColor, text: host.innerText.replace(/\s+/g, ' ').slice(0, 400) };
};

/* ── the designer's decisions, applied to the live build before it is shot ──
   The screen is then verified exactly as before: what is written is held to
   what the browser drew, decisions included.
     · the shell stays the product's (2026-09-29): the handover's own header
       and rail are replaced by the product's (data/theme/shell.json, from
       scripts/theme/shell.mjs), its CSS scoped under [data-pf-shell];
     · the riyal is a glyph, never "SAR": written-out "SAR" becomes the riyal
       glyph, sized to its text. That glyph is the official sign as the product's icon font draws it
       (skill/kit/riyal.svg, 2026-09-30). The handover's own icon("sar"), drawn before every price,
       is a rough four-bar sketch, so it is redrawn with the same shape at the same height. */
const SHELL = existsSync(join(DATA, 'shell.json')) ? JSON.parse(readFileSync(join(DATA, 'shell.json'), 'utf8')) : null;
const DECIDE = ({ shell, device, W, H, riyal }) => {
  const host = document.querySelector('[data-pf-theme-host]');
  const board = host.hasAttribute('data-screen-label') ? host : host.querySelectorAll('[data-screen-label]')[+host.getAttribute('data-pf-theme-board')];
  const done = [];
  if (shell) {
    if (!document.querySelector('style[data-pf-shell-css]')) {
      const css = document.createElement('style');
      css.setAttribute('data-pf-shell-css', '');
      css.textContent = Object.values(shell).map((part) => part.css).join('\n');
      document.head.appendChild(css);
    }
    const hb = board.getBoundingClientRect();
    /* the outermost element that is the box */
    const find = (test) => {
      const all = [...board.querySelectorAll('*')].filter((e) => !(e instanceof SVGElement) && !e.closest('[data-pf-shell]') && test(e.getBoundingClientRect(), e));
      return all.find((e) => !all.some((o) => o !== e && o.contains(e))) || null;
    };
    const near = (a, b) => Math.abs(a - b) <= 1;
    const into = (target, part, style, rootStyle, { pinHeight = true } = {}) => {
      /* the box keeps the size it had: its old children may have been what gave it that size.
         The rail keeps only its width — its height follows the frame, which grows later for a
         -full screen (the product's rail is the viewport's height) */
      const box = target.getBoundingClientRect();
      for (const [k, v] of [['width', `${box.width}px`], ['min-width', `${box.width}px`], ['flex', 'none'], ...(pinHeight ? [['height', `${box.height}px`], ['min-height', `${box.height}px`]] : [])]) target.style.setProperty(k, v, 'important');
      target.style.setProperty('position', getComputedStyle(target).position === 'static' ? 'relative' : getComputedStyle(target).position, 'important');
      for (const p of ['background', 'border', 'box-shadow', 'outline']) target.style.setProperty(p, 'none', 'important');
      /* the variables name quoted faces: quoted with ' so the attribute holds */
      target.innerHTML = `<div data-pf-shell="${part}" style="${`${style};${shell[part].vars};${shell[part].inherited}`.replace(/"/g, "'")}">${shell[part].html}</div>`;
      const root = target.querySelector('[data-pf-shell-root]');
      for (const [k, v] of Object.entries(rootStyle)) root.style.setProperty(k, v, 'important');
    };
    if (device === 'web') {
      const rail = find((r) => near(r.left, hb.left) && near(r.top, hb.top) && near(r.width, 60) && r.height >= H * 0.8);
      const header = find((r, e) => near(r.left, hb.left + 60) && near(r.top, hb.top) && near(r.width, W - 60) && near(r.height, 60) && /My Listings/.test(e.textContent || ''));
      /* the shell keeps the product's look, not its stacking: as in the product, an overlay's
         backdrop lies over the header and the rail, so the shell is its own layer at the level
         of the box it replaces */
      if (header) { into(header, 'header', 'position:absolute;inset:0;overflow:hidden;z-index:0;isolation:isolate', { 'z-index': 'auto', position: 'relative', inset: 'auto', width: '100%', height: '60px', 'padding-inline-start': '25px', transition: 'none' }); done.push('header'); }
      if (rail) { into(rail, 'rail', 'position:absolute;inset:0;z-index:0;isolation:isolate', { 'z-index': 'auto', position: 'absolute', top: '0', bottom: '0', 'inset-inline-start': '0', height: '100%', transition: 'none' }, { pinHeight: false }); done.push('rail'); }
    } else {
      /* the artboard's own status bar (the device frame) and its title row give way to the
         product's phone header */
      const status = find((r, e) => near(r.top, hb.top) && near(r.width, W) && r.height < 50 && /^9:41/.test((e.innerText || '').trim()));
      const title = status && status.nextElementSibling && /^My Listings/.test((status.nextElementSibling.innerText || '').trim()) ? status.nextElementSibling : null;
      if (status) {
        const slot = document.createElement('div');
        status.parentElement.insertBefore(slot, status);
        slot.style.cssText = 'position:relative;flex:none;align-self:stretch;height:60px';
        into(slot, 'header', 'position:absolute;inset:0;overflow:hidden;z-index:0;isolation:isolate', { 'z-index': 'auto', position: 'relative', inset: 'auto', width: '100%', height: '60px', transition: 'none' });
        status.style.setProperty('display', 'none', 'important');
        if (title) title.style.setProperty('display', 'none', 'important');
        done.push('header');
      }
    }
  }
  /* the riyal glyph for every "SAR" written out — the gap after it only where a space followed
     the SAR (a label of its own already sits apart from its amount) */
  const glyph = (fs, gap) => { const h = Math.max(7, Math.round(fs * 6) / 10), w = Math.round(h * riyal.w / riyal.h * 10) / 10; return `<svg data-pf-riyal width="${w}" height="${h}" viewBox="0 0 ${riyal.w} ${riyal.h}" fill="currentColor" style="display:inline-block;vertical-align:baseline${gap ? ';margin-inline-end:0.22em' : ''}"><path d="${riyal.d}"></path></svg>`; };
  /* the handover's own glyph (icon("sar"): viewBox 0 0 11 12, four bars) → the official shape, same height */
  let redrawn = 0;
  for (const svg of host.querySelectorAll('svg[viewBox="0 0 11 12"]')) {
    if (!svg.querySelector('path[d^="M7.9 0 9.9 0"]')) continue;
    const h = parseFloat(svg.getAttribute('height'));
    if (h) svg.setAttribute('width', String(Math.round(h * riyal.w / riyal.h * 10) / 10));
    svg.setAttribute('viewBox', `0 0 ${riyal.w} ${riyal.h}`);
    svg.innerHTML = `<path d="${riyal.d}"></path>`;
    redrawn++;
  }
  if (redrawn) done.push(`riyal redrawn ×${redrawn}`);
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
  const hits = [];
  /* never inside what a user types (a description, a field): that text is theirs, as written */
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (/\bSAR\b/.test(n.textContent) && !n.parentElement.closest('[data-pf-shell], script, style, textarea, input, [contenteditable]:not([contenteditable="false"])')) hits.push(n);
  for (const n of hits) {
    const fs = parseFloat(getComputedStyle(n.parentElement).fontSize) || 12;
    const span = document.createElement('span');
    span.setAttribute('data-pf-riyal-text', '');
    span.innerHTML = n.textContent.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\bSAR\b(\s?)/g, (m, sp) => glyph(fs, !!sp));
    n.replaceWith(span);
  }
  if (hits.length) done.push(`riyal ×${hits.length}`);
  host.setAttribute('data-pf-decisions', done.join(', '));
  return done;
};

/* ── one state ──────────────────────────────────────────────────────── */
const fontFaces = new Map();
const shoot = async (browser, device, st) => {
  const [W, H] = SIZE[device];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, timezoneId: ZONE });
  const page = await ctx.newPage();
  try {
    await page.goto(pathToFileURL(HANDOVER[device]).href, { waitUntil: 'load' });
    await page.waitForTimeout(6000);
    if (!(await markScope(page, st.via))) throw new Error(`no ${st.via.card ? `card ${st.via.card}` : st.via.section}`);
    await page.waitForTimeout(600);
    for (const step of st.via.press || []) {
      if (!(await press(page, step))) throw new Error(`no control "${step}"`);
      await page.waitForTimeout(900);
      await markScope(page, st.via);                         /* a control can re-render its card */
    }
    if (st.via.card && (await press(page, `Load screen ${st.via.card}`))) { await page.waitForTimeout(3500); if (!(await page.evaluate(() => { const s = document.querySelector('[data-pf-scope]'); return !!s && s.isConnected; }))) await markScope(page, st.via); }
    else await page.waitForTimeout(st.via.settle ?? 1500);
    if (st.via.build) {
      if (!(await page.evaluate(BUILD))) throw new Error('no build instance');
      await page.evaluate(st.via.build);
      await page.waitForTimeout(st.via.wait ?? 1800);
    }
    /* a screen neither build draws, composed in the build from its own data (the note says what) */
    if (st.derive) {
      const made = await page.evaluate(st.derive);
      if (made !== 'ok') throw new Error(`derive: ${made}`);
      await page.waitForTimeout(600);
    }
    if (st.at != null) { await page.waitForTimeout(st.at); await page.evaluate(STOP_CLOCK); }
    const lifted = await page.evaluate(LIFT, [W, H]);
    if (lifted !== 'ok') throw new Error(lifted);
    await page.setViewportSize({ width: W, height: H });
    await page.evaluate(FRAME_STILL);
    const decided = await page.evaluate(DECIDE, { shell: SHELL ? SHELL[device] : null, device, W, H, riyal: RIYAL });
    if (SHELL && !decided.includes('header')) throw new Error(`no header to swap (${decided.join(', ') || 'nothing'})`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    await page.evaluate(FRAME_STILL);
    /* a moment the build measures on screen (the tour's spotlight) is set once
       the screen is at its own size */
    if (st.after) { await page.evaluate(st.after); await page.waitForTimeout(st.afterWait ?? 1500); await page.evaluate(FRAME_STILL); }
    const h = st.full ? await GROW(page, W, H) : H;
    if (st.at == null) { await page.evaluate(QUIET); await page.waitForTimeout(600); await page.evaluate(STOP_CLOCK); }
    await page.evaluate(FRAME_STILL);
    await page.waitForTimeout(300);
    if (process.env.PF_DEBUG) console.log(await page.evaluate(() => { const host = document.querySelector('[data-pf-theme-host]'); const r = (e) => { const b = e.getBoundingClientRect(); return `${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}x${Math.round(b.height)}`; }; const sc = [...document.querySelectorAll('*')].filter((e) => e.scrollTop > 0).map((e) => `${e.tagName}.${e.getAttribute('data-screen-label') || ''} top=${e.scrollTop} in=${host.contains(e)}`); const tr = [...host.querySelectorAll('*')].filter((e) => { const t = getComputedStyle(e).transform; return t !== 'none' && e.getBoundingClientRect().width > 1000; }).map((e) => `${e.tagName} ${getComputedStyle(e).transform} ${e.getAttribute('style')?.slice(0, 80)}`); return JSON.stringify({ host: r(host), scrollY, sc, tr: tr.slice(0, 5), board: r(host.querySelector('[data-screen-label]')) }); }));
    const live = join(DATA, 'live', `${device}--${st.name || 'page'}.png`);
    await page.screenshot({ path: live, clip: { x: 0, y: 0, width: W, height: h }, animations: 'disabled' });
    const s = await page.evaluate(SERIALIZE);
    for (const f of s.faces) fontFaces.set(f.replace(/src:[^;]+;/, ''), f);
    return { ...s, live, h, decided };
  } finally { await ctx.close(); }
};

const fileFor = (device, st) => {
  const dir = device === 'web' ? OUT : join(OUT, 'mobile');
  return st.name ? join(dir, 'states', `listings--${st.name}.html`) : join(dir, 'listings.html');
};
const write = (device, st, s) => {
  const [W, H] = SIZE[device];
  const file = fileFor(device, st);
  mkdirSync(dirname(file), { recursive: true });
  const fonts = `${device === 'web' ? '' : '../'}${st.name ? '../' : ''}fonts.css`;
  const bg = s.background === 'rgba(0, 0, 0, 0)' ? '#F3F4F5' : s.background;
  const attr = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  writeFileSync(file, ownFrame(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=${W}, initial-scale=1">
<meta name="pf-frame" content="${W}x${s.h}">
<meta name="pf-compiled" content="/listings · new theme · ${device === 'web' ? 'web 1440' : 'phone 360'} · ${st.name || 'page'} · from ${attr(DRAFT)} · the design, not yet the product">
<meta name="pf-theme" content="new">
<meta name="pf-state-note" content="${attr(st.note)}">
<meta name="pf-state-via" content="${attr(st.how)}">
<meta name="pf-decisions" content="${attr((s.decided || []).join(', '))}">${st.derived ? `\n<meta name="pf-derived" content="${attr(st.derived)}">` : ''}
<title>My Listings · new theme${st.name ? ` · ${st.name}` : ''}${device === 'mobile' ? ' · 360' : ''}</title>
<link rel="stylesheet" href="${fonts}">
<style>
html, body { margin: 0; padding: 0; background: ${bg}; }
*, *::before, *::after { box-sizing: border-box; }
${s.css}
</style>
</head>
<body>
<div data-pf-theme-root style="position:relative;width:${W}px;height:${s.h}px;overflow:hidden;${s.inherited}">${s.html}</div>
<script>/* what was scrolled stays scrolled — again once the fonts have set the text's height */ const pfScroll = () => { for (const e of document.querySelectorAll('[data-pf-scroll]')) { const [x, y] = e.dataset.pfScroll.split(','); e.scrollLeft = +x; e.scrollTop = +y; } }; pfScroll(); document.fonts.ready.then(pfScroll); addEventListener('load', pfScroll);</script>
</body>
</html>
`, W, s.h));
  return file;
};

/* ── compile ────────────────────────────────────────────────────────── */
const crop = (png, w, h) => { const o = Buffer.alloc(w * h * 4); for (let y = 0; y < h; y++) png.data.copy(o, y * w * 4, y * png.width * 4, y * png.width * 4 + w * 4); return o; };
const hashOf = (f) => createHash('sha1').update(PNG.sync.read(readFileSync(f)).data).digest('hex');
const browser = await chromium.launch();
const ledger = existsSync(join(DATA, 'states.json')) ? JSON.parse(readFileSync(join(DATA, 'states.json'), 'utf8')) : {};
mkdirSync(join(DATA, 'live'), { recursive: true }); mkdirSync(join(DATA, 'ours'), { recursive: true });
if (existsSync(join(OUT, 'fonts.css'))) for (const f of readFileSync(join(OUT, 'fonts.css'), 'utf8').split('\n').filter((l) => l.startsWith('@font-face'))) fontFaces.set(f.replace(/src:[^;]+;/, ''), f);

for (const device of DEVICES) {
  const [W, H] = SIZE[device];
  const todo = STATES[device].filter((st) => !ONLY.length || ONLY.includes(st.name || 'page'));
  const results = new Map();
  let next = 0;
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    while (next < todo.length) {
      const st = todo[next++];
      const key = `${device}:${st.name || 'page'}`;
      try {
        const s = await shoot(browser, device, st);
        results.set(st, s);
        console.log(`  froze ${key.padEnd(48)} ${s.text.slice(0, 70)}`);
      } catch (e) {
        console.log(`  FAILED ${key}: ${String(e).split('\n')[0].slice(0, 140)}`);
        ledger[key] = { note: st.note, how: st.how, failed: String(e).split('\n')[0].slice(0, 200) };
      }
    }
  }));
  /* the same picture reached two ways is one state — the first in the list keeps it. The same
     means no pixel differs past pixelmatch's threshold: two routes to one screen can leave
     sub-pixel noise between them, which exact bytes would count as different */
  const kept = [];
  const same = (a, b) => a.width === b.width && a.height === b.height && pixelmatch(a.data, b.data, null, a.width, a.height, { threshold: 0.1, includeAA: false }) === 0;
  for (const [key, L] of Object.entries(ledger)) if (key.startsWith(device + ':') && L.file && !todo.some((st) => `${device}:${st.name || 'page'}` === key) && existsSync(join(DATA, 'live', `${key.replace(':', '--')}.png`))) kept.push([key, PNG.sync.read(readFileSync(join(DATA, 'live', `${key.replace(':', '--')}.png`)))]);
  for (const st of STATES[device]) {
    const s = results.get(st);
    if (!s) continue;
    const key = `${device}:${st.name || 'page'}`;
    const h = hashOf(s.live);
    const png = PNG.sync.read(readFileSync(s.live));
    /* a state declared the same picture as another (states.mjs \`same\`) folds whatever its
       animation phase; any other folds when no pixel differs */
    const twin = st.same ? kept.find(([k]) => k === `${device}:${st.same}`) : kept.find(([, k]) => same(png, k));
    if (twin) {
      console.log(`  same  ${key.padEnd(48)} = ${twin[0]}`);
      ledger[key] = { same: twin[0], note: st.note, how: st.how, group: st.group };
      if (existsSync(fileFor(device, st))) rmSync(fileFor(device, st));
      const img = join(ROOT, 'deliverables', 'new-theme', 'img', `${key.replace(':', '--')}.png`);
      if (existsSync(img)) rmSync(img);
      results.delete(st);
      continue;
    }
    kept.push([key, png]);
    const file = write(device, st, s);
    ledger[key] = { file: file.slice(ROOT.length + 1), note: st.note, how: st.how, group: st.group, frame: `${W}x${s.h}`, hash: h, decisions: s.decided, ...(st.derived ? { derived: st.derived } : {}) };
  }
  mkdirSync(OUT, { recursive: true });
  if (fontFaces.size) writeFileSync(join(OUT, 'fonts.css'), `/* the new theme's typefaces, as the handover loads them (SIL Open Font License) — written by scripts/theme/capture.mjs */\n${[...fontFaces.values()].join('\n')}\n`);
  /* render what was written, and hold it to the build it came from */
  for (const st of STATES[device]) {
    const key = `${device}:${st.name || 'page'}`;
    const L = ledger[key];
    if (!L || !L.file || !results.has(st)) continue;
    const fh = results.get(st).h;
    const ctx = await browser.newContext({ viewport: { width: W, height: fh }, deviceScaleFactor: 1, timezoneId: ZONE });
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(join(ROOT, L.file)).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    const ours = join(DATA, 'ours', `${device}--${st.name || 'page'}.png`);
    await page.screenshot({ path: ours, clip: { x: 0, y: 0, width: W, height: fh }, animations: 'disabled' });
    await ctx.close();
    const a = PNG.sync.read(readFileSync(results.get(st).live)), b = PNG.sync.read(readFileSync(ours));
    const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
    const diff = new PNG({ width: w, height: h });
    const n = pixelmatch(crop(a, w, h), crop(b, w, h), diff.data, w, h, { threshold: 0.1, includeAA: false, alpha: 0.15 });
    writeFileSync(join(DATA, 'live', `${device}--${st.name || 'page'}.diff.png`), PNG.sync.write(diff));
    L.pct = +(100 * n / (w * h)).toFixed(3);
    L.ok = L.pct <= BAR;
    console.log(`  ${key.padEnd(48)} ${L.pct.toFixed(3).padStart(7)}%  ${L.ok ? 'ok' : 'OVER'}`);
  }
}
if (fontFaces.size) writeFileSync(join(OUT, 'fonts.css'), `/* the new theme's typefaces, as the handover loads them (SIL Open Font License) — written by scripts/theme/capture.mjs */\n${[...fontFaces.values()].join('\n')}\n`);
writeFileSync(join(DATA, 'states.json'), JSON.stringify(Object.fromEntries(Object.entries(ledger).sort()), null, 1));
const all = Object.values(ledger).filter((l) => l.file);
console.log(`\n  ${all.filter((l) => l.ok).length} of ${all.length} within the bar · ${Object.values(ledger).filter((l) => l.same).length} reached two ways · ${Object.values(ledger).filter((l) => l.failed).length} failed`);
await browser.close();
