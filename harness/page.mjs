/**
 * One harness page: a signed-in fixture account on the harness Vite server,
 * every API call answered from harness/fixtures.mjs, nothing leaving the
 * machine but Google Fonts (answered locally, see capture.mjs for why).
 *
 * capture.mjs grew this inline; compile.mjs needs exactly the same page, and
 * two copies of a route handler drift the way two copies of a shell did. So
 * the handler lives here.
 *
 *   import { openPage, settle } from './page.mjs';
 *   const { page, ctx, log } = await openPage(browser, base, { locale: 'en', mode: () => MODE });
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { answer, THUMB, AVATAR_SVG } from './fixtures.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const FONTS_CSS = readFileSync(join(HERE, '..', 'deliverables', 'fonts.css'), 'utf8');
export { FONTS_CSS };

export async function openPage(browser, base, { locale = 'en', mode = () => null } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, locale: locale === 'ar' ? 'ar-SA' : 'en',
  });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('tapTargets', JSON.stringify({ lms: { introModal: { hide: true } } })); } catch {}
  });
  await ctx.addCookies([{ name: 'byt_cd', value: 'harness-token', domain: '127.0.0.1', path: '/' }]);
  const page = await ctx.newPage();
  const log = { answered: [], unanswered: [], errors: [], blocked: 0 };
  page.on('pageerror', (e) => log.errors.push(String(e).slice(0, 300)));

  const appHost = new URL(base).host;
  await page.route('**/*', async (r) => {
    const u = new URL(r.request().url());
    if (/^fonts\.(googleapis|gstatic)\.com$/.test(u.host)) {
      if (u.host === 'fonts.googleapis.com') return r.fulfill({ status: 200, contentType: 'text/css', body: FONTS_CSS });
      return r.abort();
    }
    if (u.host !== appHost) { log.blocked++; return r.abort(); }
    if (u.pathname.startsWith('/harness-img/')) return r.fulfill({ status: 200, contentType: THUMB.contentType, body: u.pathname.includes('avatar') ? AVATAR_SVG : THUMB.body });
    if (u.pathname.startsWith('/api/')) {
      const MODE = mode();
      if (MODE === 'error' && /\/api\/surge\/listings$/.test(u.pathname))
        return r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"harness: deliberate failure"}' });
      if (MODE === 'slow' && /\/api\/surge\/(listings|ovation)/.test(u.pathname)) return new Promise(() => {});
      const body = answer(r.request().method(), u.pathname, u.search, MODE);
      (body === undefined ? log.unanswered : log.answered).push(`${r.request().method()} ${u.pathname}`);
      return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body ?? {}) });
    }
    return r.continue();
  });
  return { page, ctx, log };
}

/* the same settle every capture uses */
export async function settle(page) {
  try { await page.waitForLoadState('networkidle', { timeout: 20_000 }); } catch {}
  try {
    await page.waitForFunction(() => ![...document.querySelectorAll('.ant-spin-spinning, .ant-skeleton-active')]
      .some((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }), null, { timeout: 15_000 });
  } catch {}
  await page.waitForTimeout(1200);
}
