/**
 * A headless browser for the Design QA. Takes whatever this machine has, in this order:
 *
 *   1. Playwright (playwright or playwright-core) with its own Chromium;
 *   2. Puppeteer (puppeteer, or puppeteer-core);
 *   3. a Chrome or Chromium on the machine (CHROME_PATH, the usual places, or the PATH),
 *      driven by playwright-core or puppeteer-core;
 *   4. @sparticuz/chromium: a Chromium shipped inside an npm package, so it installs in
 *      sandboxes where only package managers are allowed (claude.ai's default network).
 *
 * When there is none, it installs puppeteer-core (and, on Linux, @sparticuz/chromium) into
 * a cache folder with npm, once, and tries again. Returns { page(viewport), close, name }
 * or { error }. Each page has goto(url), evaluate(fn, arg), screenshot({ path, clip }) and
 * mouse.move(x, y, { steps }), a real pointer.
 */
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir, tmpdir, platform, arch } from 'node:os';
import { createRequire } from 'node:module';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const CACHE = process.env.PF_QA_CACHE || join(existsSync(homedir()) ? join(homedir(), '.cache') : tmpdir(), 'profolio-ksa-design', 'qa-browser');

/* a package from: this skill's folders, the working folder, the cache, the global npm root */
function roots() {
  const out = [HERE, process.cwd(), CACHE];
  try { out.push(execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()); } catch { /* no npm */ }
  return out;
}
async function load(name) {
  for (const r of roots()) {
    try {
      const req = createRequire(join(r, 'noop.js'));
      const p = req.resolve(name);
      return await import(pathToFileURL(p).href);
    } catch { /* not there */ }
  }
  return null;
}
function systemChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const known = platform() === 'darwin'
    ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
    : platform() === 'win32'
      ? ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe']
      : ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/snap/bin/chromium'];
  for (const k of known) if (existsSync(k)) return k;
  for (const n of ['chromium', 'chromium-browser', 'google-chrome', 'google-chrome-stable']) {
    try { const p = execFileSync('which', [n], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); if (p && !/snap/.test(p)) return p; } catch { /* not on PATH */ }
  }
  return null;
}
const ARGS = ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--font-render-hinting=none', '--hide-scrollbars'];

function wrapPlaywright(browser, name) {
  return {
    name,
    async page({ width, height }) {
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
      return { goto: (u) => page.goto(u, { waitUntil: 'load', timeout: 60000 }), evaluate: (fn, arg) => page.evaluate(fn, arg), screenshot: (o) => page.screenshot(o), setViewport: (v) => page.setViewportSize(v), mouse: { move: (x, y, o) => page.mouse.move(x, y, o) }, close: () => page.close() };
    },
    close: () => browser.close(),
  };
}
function wrapPuppeteer(browser, name) {
  return {
    name,
    async page({ width, height }) {
      const page = await browser.newPage();
      await page.setViewport({ width, height, deviceScaleFactor: 1 });
      return { goto: (u) => page.goto(u, { waitUntil: 'load', timeout: 60000 }), evaluate: (fn, arg) => page.evaluate(fn, arg), screenshot: (o) => page.screenshot(o), setViewport: (v) => page.setViewport({ ...v, deviceScaleFactor: 1 }), mouse: { move: (x, y, o) => page.mouse.move(x, y, o) }, close: () => page.close() };
    },
    close: () => browser.close(),
  };
}

async function attempt() {
  const errors = [];
  const pw = (await load('playwright')) || (await load('playwright-core'));
  const chromium = pw && (pw.chromium || (pw.default && pw.default.chromium));
  const withLaunch = (m) => (m && m.default && m.default.launch ? m.default : m && m.launch ? m : null);   /* call launch on its own object */
  if (chromium) {
    try { return wrapPlaywright(await chromium.launch({ args: ARGS }), 'Playwright Chromium'); } catch (e) { errors.push('Playwright: ' + String(e.message).split('\n')[0]); }
  }
  const pup = withLaunch(await load('puppeteer'));
  if (pup) {
    try { return wrapPuppeteer(await pup.launch({ headless: true, args: ARGS }), 'Puppeteer Chrome'); } catch (e) { errors.push('Puppeteer: ' + String(e.message).split('\n')[0]); }
  }
  const chrome = systemChrome();
  const core = withLaunch(await load('puppeteer-core'));
  if (chrome && chromium) {
    try { return wrapPlaywright(await chromium.launch({ executablePath: chrome, args: ARGS }), 'Playwright + ' + chrome); } catch (e) { errors.push('Playwright with ' + chrome + ': ' + String(e.message).split('\n')[0]); }
  }
  if (chrome && core) {
    try { return wrapPuppeteer(await core.launch({ executablePath: chrome, headless: true, args: ARGS }), 'Puppeteer + ' + chrome); } catch (e) { errors.push('puppeteer-core with ' + chrome + ': ' + String(e.message).split('\n')[0]); }
  }
  const sparMod = await load('@sparticuz/chromium');
  const spar = sparMod && (sparMod.default || sparMod);
  if (spar && spar.executablePath && core) {
    try {
      const exe = await spar.executablePath();
      return wrapPuppeteer(await core.launch({ executablePath: exe, headless: 'shell', args: [...(spar.args || []), ...ARGS] }), '@sparticuz/chromium');
    } catch (e) { errors.push('@sparticuz/chromium: ' + String(e.message).split('\n')[0]); }
  }
  return { error: errors.length ? errors.join('; ') : 'no browser and no driver found' };
}

export async function launch({ install = true, log = () => {} } = {}) {
  let b = await attempt();
  if (!b.error || !install) return b;
  /* none: install a driver (and, on Linux, a Chromium from npm) into the cache, once */
  const pkgs = ['puppeteer-core'];
  if (platform() === 'linux' && !systemChrome() && ['x64', 'arm64'].includes(arch())) pkgs.push('@sparticuz/chromium');
  const first = b.error;
  try {
    mkdirSync(CACHE, { recursive: true });
    log(`  no browser here (${first}) — installing ${pkgs.join(' + ')} with npm into ${CACHE}, once…`);
    execFileSync('npm', ['install', '--prefix', CACHE, '--no-audit', '--no-fund', '--loglevel=error', ...pkgs], { stdio: ['ignore', 'ignore', 'pipe'], timeout: 300000 });
  } catch (e) {
    return { error: `${first}; npm install failed: ${String((e.stderr || e.message || '')).split('\n').filter(Boolean).slice(-1)[0] || 'no npm'}` };
  }
  b = await attempt();
  return b.error ? { error: `${first}; after installing: ${b.error}` } : b;
}
