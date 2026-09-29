/**
 * Area module: checkout, payment processing, top-ups, package purchases, the ad-licence payment.
 * Consulted BEFORE the other areas (harness/fixtures.mjs answer()), so it
 * must answer only endpoints no other area answers — or answer them only in
 * a mode of its own — or it changes pages it does not own.
 *
 *   export default (h) => [[RegExp, (search, mode, pathname, method) => body], …]
 *
 * ── the three purchases a KSA agent makes, and what each one asks for ──────
 *   Credit top-up   Credits Usage › Top-Up your Credits (credits-usage.js:119)
 *                   or Credits & Packages › Credit Top-up (creditTopUps.js)
 *                     GET  /packages/calculate_price?total_credits=N  the price as it is typed
 *                     GET  /packages/custom_package_rules             member-area users only
 *                     POST /carts                                     → /checkout?cart_id=
 *   Package         Credits & Packages › Get Titanium › Upgrade (package-upgrade-modal.js)
 *                     POST /carts (item_type Package)                 → /checkout?cart_id=
 *   Ad licence      /ad-license › Continue (bayut/components/ad-license/create-ad-license.js)
 *                     POST /ad_license_requests, then POST /carts     → /checkout?cart_id=&ad_license=true
 *
 *   /checkout       GET  /carts/current      the cart — the URL's cart_id is NOT sent
 *                                            (bayut/apis/cart.js:9), so which cart is
 *                                            current is this module's MODE (below)
 *                   POST /checkout/request_payment   Credit/Debit Card: a Checkout.com Flow
 *                                            payment session, asked for as soon as the
 *                                            method is selected (creditDebitWithCheckout.js:46)
 *                   POST /tabby/prepare_checkout, GET /tabby/:id/payment_link   Tabby's Pay
 *                   POST /checkout/update_payment, /tabby/update_payment        the result
 *                   GET  /ksa_verifications/nafaz_auth   the Nafath gate's link
 *
 * ── where the product hands off, and how the return is drawn ─────────────
 * The card form is not the product's. index.html:32 loads Checkout.com's
 * Flow (checkout-web-components.checkout.com) and creditCardItem.js:301
 * mounts it — card fields, its own Pay button and 3-D Secure. The harness
 * blocks that host, so the card method renders what the product renders
 * while Flow loads: its skeleton (creditCardItem.js:368). Tabby hands off
 * with window.open(web_url, '_self') (tabby.js:132). Nothing here answers for
 * a provider; the RETURN is the product's own:
 *   /content/process-payment?status=success&cko-payment-id=…   (the success_url
 *   request_payment registers, bayut/apis/cart.js:71) — a full-page spinner that
 *   forwards to /checkout?paymentChannel=checkout&paymentType=success&cko-payment-id=…
 *   (payment-process.js:53), where POST /checkout/update_payment decides:
 *     a success status   → the "Credits Purchased" modal (successfulPaymentModal.js)
 *     Declined           → "Payment failed due to an error." and a jump to /packages
 *     Cancelled/Expired  → "You aborted the payment…" and a jump to /packages
 * Flow's in-page completion (no redirect — creditCardItem.js onPaymentCompleted →
 * checkout.js:155) goes to the same update_payment; on an ad-licence cart it keeps
 * ?ad_license=true and shows AdLicenseSuccessModal. The redirect DROPS that flag
 * (payment-process.js:32 forwards only channel, type and payment id), so an ad
 * licence paid through the redirect is congratulated with "Credits Purchased".
 *
 * ── modes (all 'pay-…'; any other mode, and none, is the top-up) ──────────
 *   MODE.PACKAGE / AD_LICENSE        carts/current is that purchase's cart
 *   …DECLINED / CANCELLED            update_payment's answer (any cart)
 *   MODE.NO_SESSION                  request_payment has no session: "Your payment couldn't be processed…"
 *   MODE.TABBY_REJECTED              Tabby's link is not a URL: "Sorry, Tabby is unable to approve…"
 *   MODE.AD_LICENSE_REFUSED          POST ad_license_requests refused — delivered as a 422 by
 *                                    refusing(page, act), because harness/page.mjs answers 200
 *   MODE.NAFATH_PENDING              users/current not Nafath-verified: the checkout's
 *                                    "Verification Required Before Purchase" gate
 * The profile area's own 'non-saudi' mode is the other gate ("Credit Purchase not
 * Permitted", LimitNonSaudiNationalModal.js) — this module adds nothing for it.
 *
 * No real API shape was ever recorded for any endpoint here (data/api-shapes*.json
 * have none), so every body is shaped by what the product READS, with the line.
 *
 * ── a GET on a shared path goes back to its own area ─────────────────────
 * POST /ad_license_requests shares its pathname with the Listings tab's GET,
 * which the listings area answers, and users/current is the profile area's.
 * A pattern cannot see the method, so those two are `own()` patterns: while
 * pass() hands a request on, they stop matching and answer() walks on to the
 * area that owns it (the same device as harness/fixtures/forms.mjs).
 */
import { answer } from '../fixtures.mjs';

export const MODE = {
  PACKAGE: 'pay-package',
  AD_LICENSE: 'pay-ad-license',
  DECLINED: 'pay-declined',
  CANCELLED: 'pay-cancelled',
  PACKAGE_DECLINED: 'pay-package-declined',
  AD_LICENSE_DECLINED: 'pay-ad-license-declined',
  NO_SESSION: 'pay-no-session',
  TABBY_REJECTED: 'pay-tabby-rejected',
  AD_LICENSE_REFUSED: 'pay-ad-license-refused',
  NAFATH_PENDING: 'pay-nafath-pending',
};

/* which cart a mode is about, and what the payment comes back as */
const cartOf = (mode) => (/^pay-package/.test(mode || '') ? 'package' : /^pay-ad-license/.test(mode || '') ? 'ad-license' : 'top-up');
const outcomeOf = (mode) => (/-declined$/.test(mode || '') ? 'Declined' : /-cancelled$/.test(mode || '') ? 'Cancelled' : 'Captured');

/* while true, this module's own() patterns do not match (see the note above) */
let passing = false;
const own = (re) => { re.test = function (s) { return !passing && RegExp.prototype.test.call(this, s); }; return re; };
const pass = (method, pathname, search, mode) => {
  passing = true;
  try { return answer(method, pathname, search, mode); } finally { passing = false; }
};

/* ── the steps' side ──────────────────────────────────────────────────────── */

/* 26 characters of Checkout.com's id alphabet from a seed — ids look like theirs */
const token = (seed) => {
  let s = '', x = seed;
  for (let i = 0; i < 26; i++) { x = (Math.imul(x, 1103515245) + 12345) >>> 0; s += 'abcdefghijklmnopqrstuvwxyz234567'[x % 32]; }
  return s;
};
/** the payment id Checkout.com hands back — on the return URL, or to Flow's callback */
export const PAYMENT_ID = `pay_${token(7731049)}`;

/** a phone is tapped, a desktop clicked: a click on a phone leaves the
    pointer over the control, and its :hover then shows in the shot */
export async function press(page, locator, opts = {}) {
  const touch = await page.evaluate(() => navigator.maxTouchPoints > 0).catch(() => false);
  await locator.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {});
  return touch ? locator.tap({ timeout: 8000, ...opts }) : locator.click({ timeout: 8000, ...opts });
}

/** a toast — antd message, 3 s for success and 4.5 s for an error
    (components/common/notification/notifications.js) — outlives no compile;
    it pauses while the pointer rests on it, so the step rests it there */
export async function holdToast(page, text, timeout = 20000) {
  const n = (text ? page.locator('.ant-message-notice', { hasText: text }) : page.locator('.ant-message-notice')).last();
  await n.waitFor({ state: 'visible', timeout });
  await n.hover({ timeout: 3000, force: true }).catch(() => {});
  await page.waitForTimeout(400);
  return n;
}

/** no spinner or skeleton with an area left (harness/page.mjs settle, for
    a page reached inside a step) — the checkout's own card placeholder is
    Flow's and never settles here, so it is not waited for */
export async function quiet(page, timeout = 12000) {
  await page.waitForFunction(() => ![...document.querySelectorAll('.ant-spin-spinning, .ant-skeleton-active')]
    .some((el) => { if (el.closest('.flow-skeleton')) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }),
  null, { timeout }).catch(() => {});
  await page.waitForTimeout(600);
}

/** THE RETURN FROM THE GATEWAY: Checkout.com sends the customer back to the
    success_url or failure_url request_payment registered (bayut/apis/cart.js:71)
    with its payment id. /content/process-payment forwards that to /checkout
    (payment-process.js:53), which asks update_payment what happened. A full
    page load — nothing from before the hand-off carries over. */
export async function returnFromGateway(page, status = 'success') {
  const origin = new URL(page.url()).origin;
  await page.goto(`${origin}/en/content/process-payment?status=${status}&cko-payment-id=${PAYMENT_ID}`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/checkout\?/, { timeout: 60000 });
  await page.waitForSelector('.ant-layout', { timeout: 60000 });
}

/** Flow's IN-PAGE completion — a card that needs no redirect: the Flow form
    (Checkout.com's, not loaded here) calls the onPaymentCompleted the product
    gave it (creditCardItem.js:314 → checkout.js:155 handleCheckoutFlowCompleted),
    and the product asks update_payment. The step makes that one call, with the
    id Checkout.com would pass; everything after it is the product's. */
export async function completeInPage(page, paymentId = PAYMENT_ID) {
  await page.waitForSelector('#flow-container', { timeout: 30000 });
  const r = await page.evaluate((id) => {
    const el = document.querySelector('#flow-container');
    const key = el && Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
    for (let f = key ? el[key] : null; f; f = f.return) {
      if (typeof f.memoizedProps?.onPaymentCompleted === 'function') { f.memoizedProps.onPaymentCompleted({ id }); return true; }
    }
    return false;
  }, paymentId);
  if (!r) throw new Error('the card form has no onPaymentCompleted to call');
}

/** run `act` (a submit) with this module's refusals delivered as 422s — the
    product only takes a refusal from the STATUS (store/parentApi.js:107) and
    harness/page.mjs answers every call 200. A GET is never touched. */
export async function refusing(page, act, mode = MODE.AD_LICENSE_REFUSED) {
  const handler = async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    if (req.method() === 'GET' || !u.pathname.startsWith('/api/')) return route.fallback();
    const body = answer(req.method(), u.pathname, u.search, mode);
    if (!body || body.success !== false) return route.fallback();
    return route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify(body) });
  };
  await page.route('**/api/**', handler);
  try { return await act(); } finally { await page.unroute('**/api/**', handler); }
}

/* ── the ad-licence form's places: the product's location index ───────────
   The City and Location/District selects on /ad-license are not answered by
   the API — they search the Algolia locations index straight from the
   browser (services/algolia, bayut/components/post-listing/location-select/
   location-select.js:124 and :188), with REACT_APP_ALGOLIA_APP_ID empty in
   harness/env, so its host is -dsn.algolia.net. harness/page.mjs blocks it,
   the product logs "Failed to fetch cities" and both selects stay empty —
   and the form cannot be submitted without them (city and location are
   required, bayut/data/getValidationSchema.js:21). The ad-licence steps
   answer that one host from here for the length of their act
   (harness/interactions/ad-license.mjs `withPlaces`), so nothing leaves the
   machine; the answer is Algolia's search response, hits shaped by what the
   select reads: location_id, a {en, ar} title, level, city_id, lat/lng.
   Cities are level 2 (LOCATION_LEVELS.city, bayut/constants/constants.js:150);
   districts level 4, as the listings area's breadcrumbs and ad-licence rows
   have them — and with the same ids (listings.mjs hid(): a city at 100 + …,
   a district at 300 + …), so a district picked here is the listings' own. */
const hid = (s, at) => at + [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 8999, 17);
/* name · Arabic · lat · lng — in the order the index ranks them */
const CITIES = [
  ['Riyadh', 'الرياض', 24.713552, 46.675296], ['Jeddah', 'جدة', 21.543333, 39.172778],
  ['Makkah', 'مكة المكرمة', 21.389082, 39.857912], ['Dammam', 'الدمام', 26.420683, 50.088794],
  ['Madinah', 'المدينة المنورة', 24.524654, 39.569184], ['Al Khobar', 'الخبر', 26.217191, 50.197138],
  ['Taif', 'الطائف', 21.285406, 40.415774], ['Tabuk', 'تبوك', 28.383508, 36.566191],
  ['Buraydah', 'بريدة', 26.359231, 43.981812], ['Abha', 'أبها', 18.216427, 42.505300],
  ['Khamis Mushait', 'خميس مشيط', 18.300000, 42.733333], ['Al Hofuf', 'الهفوف', 25.383333, 49.586389],
  ['Hail', 'حائل', 27.511416, 41.720824], ['Al Kharj', 'الخرج', 24.155589, 47.312039],
  ['Jazan', 'جازان', 16.889359, 42.551117], ['Najran', 'نجران', 17.565604, 44.228944],
  ['Yanbu', 'ينبع', 24.089570, 38.061810], ['Al Jubail', 'الجبيل', 27.004626, 49.646003],
  ['Dhahran', 'الظهران', 26.236125, 50.039302], ['Al Qatif', 'القطيف', 26.519602, 50.011530],
];
/* city · zone · district · Arabic · lat · lng */
const DISTRICTS = [
  ['Riyadh', 'North Riyadh', 'Al Yasmin', 'الياسمين', 24.824610, 46.643718],
  ['Riyadh', 'North Riyadh', 'Al Malqa', 'الملقا', 24.813047, 46.613004],
  ['Riyadh', 'North Riyadh', 'Al Narjis', 'النرجس', 24.856012, 46.659013],
  ['Riyadh', 'West Riyadh', 'Hittin', 'حطين', 24.763227, 46.599241],
  ['Riyadh', 'Central Riyadh', 'Al Olaya', 'العليا', 24.693606, 46.685213],
  ['Riyadh', 'North Riyadh', 'Al Sahafa', 'الصحافة', 24.805013, 46.636102],
  ['Riyadh', 'North Riyadh', 'Al Aqiq', 'العقيق', 24.770418, 46.628370],
  ['Riyadh', 'North Riyadh', 'Al Wurud', 'الورود', 24.723611, 46.674917],
  ['Riyadh', 'East Riyadh', 'Al Rawabi', 'الروابي', 24.709205, 46.783711],
  ['Riyadh', 'East Riyadh', 'Al Nahdah', 'النهضة', 24.756694, 46.812930],
  ['Riyadh', 'East Riyadh', 'Al Yarmuk', 'اليرموك', 24.808305, 46.795672],
  ['Riyadh', 'North Riyadh', 'Al Masif', 'المصيف', 24.754722, 46.672805],
  ['Riyadh', 'North Riyadh', 'Al Mughrizat', 'المغرزات', 24.754027, 46.724013],
  ['Riyadh', 'West Riyadh', 'As Sulaymaniyah', 'السليمانية', 24.740613, 46.575012],
  ['Riyadh', 'North Riyadh', 'Al Qirawan', 'القيروان', 24.842118, 46.598012],
  ['Riyadh', 'North Riyadh', 'Al Arid', 'العارض', 24.874021, 46.604117],
  ['Jeddah', 'North Jeddah', 'Al Rawdah', 'الروضة', 21.561307, 39.157903],
  ['Jeddah', 'North Jeddah', 'Al Salamah', 'السلامة', 21.588512, 39.151205],
  ['Jeddah', 'North Jeddah', 'Al Shati', 'الشاطئ', 21.590117, 39.109812],
  ['Jeddah', 'North Jeddah', 'Al Zahra', 'الزهراء', 21.573402, 39.126913],
  ['Jeddah', 'North Jeddah', 'Obhur Al Shamaliyah', 'أبحر الشمالية', 21.721508, 39.107711],
  ['Dammam', 'Dammam', 'Al Faisaliyah', 'الفيصلية', 26.405311, 50.049813],
  ['Dammam', 'Dammam', 'Al Shati', 'الشاطئ', 26.466903, 50.139412],
  ['Dammam', 'Dammam', 'Al Mazruiyah', 'المزروعية', 26.451207, 50.087614],
];
const ZONES_AR = { 'North Riyadh': 'شمال الرياض', 'East Riyadh': 'شرق الرياض', 'West Riyadh': 'غرب الرياض',
  'Central Riyadh': 'وسط الرياض', 'North Jeddah': 'شمال جدة', Dammam: 'الدمام' };
const kebabOf = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const CITY_HITS = CITIES.map(([en, ar, lat, lng], k) => {
  const id = hid(en, 100);
  return { objectID: String(id), location_id: id, external_id: String(10100000 + id), title: { en, ar },
    slug: `/${kebabOf(en)}`, level: 2, city_id: id, latitude: lat, longitude: lng, rank: k + 1,
    hierarchy: [{ id: 1, level: 1, title: { en: 'Saudi Arabia', ar: 'السعودية' } }, { id, level: 2, title: { en, ar } }] };
});
const DISTRICT_HITS = DISTRICTS.map(([city, zone, en, ar, lat, lng], k) => {
  const c = CITY_HITS.find((x) => x.title.en === city);
  const id = hid(en, 300) + (city === 'Riyadh' ? 0 : c.location_id);    /* the listings' ids for Riyadh's */
  const zoneId = hid(zone, 200);
  return { objectID: String(id), location_id: id, external_id: String(10100000 + id), title: { en, ar },
    slug: `${c.slug}/${kebabOf(zone)}/${kebabOf(en)}`, level: 4, city_id: c.location_id, latitude: lat, longitude: lng, rank: k + 1,
    hierarchy: [...c.hierarchy, { id: zoneId, level: 3, title: { en: zone, ar: ZONES_AR[zone] } }, { id, level: 4, title: { en, ar } }] };
});

/** Algolia's answer to one `index.search('', params)` of the locations index
    (algoliasearch 4: POST /1/indexes/<index>/query, the params as its JSON
    body) — filters, numericFilters and query, as the location select sends them */
export function searchLocations(params = {}) {
  const conds = [String(params.filters || ''), ...[].concat(params.numericFilters || [])].join(' AND ');
  const tests = {};
  for (const [, key, op, raw] of conds.matchAll(/([\w.]+)\s*(>=|<=|=|>|<|:)\s*([\w.-]+)/g)) {
    const v = Number(raw);
    (tests[key] ||= []).push({ op, v });
  }
  const valueOf = (hit, key) => (key === 'hierarchy.id' ? hit.hierarchy.map((x) => x.id) : [hit[key]]);
  const ok = (hit) => Object.entries(tests).every(([key, list]) => {
    const vals = valueOf(hit, key);
    /* several `=` on one attribute are alternatives (city_id=1 OR city_id=2) */
    const eqs = list.filter((t) => t.op === '=' || t.op === ':');
    const cmp = list.filter((t) => !(t.op === '=' || t.op === ':'));
    return (!eqs.length || eqs.some((t) => vals.includes(t.v)))
      && cmp.every((t) => vals.some((x) => ({ '>': x > t.v, '<': x < t.v, '>=': x >= t.v, '<=': x <= t.v })[t.op]));
  });
  const q = String(params.query || '').trim().toLowerCase();
  const hits = [...CITY_HITS, ...DISTRICT_HITS].filter(ok)
    .filter((hit) => !q || hit.title.en.toLowerCase().includes(q) || hit.title.ar.includes(q))
    .slice(0, Number(params.hitsPerPage) || 20);
  return { hits, nbHits: hits.length, page: 0, nbPages: 1, hitsPerPage: Number(params.hitsPerPage) || 20,
    exhaustiveNbHits: true, query: params.query || '', params: '', processingTimeMS: 1 };
}

export default (h) => {
  const { U, C, num, day, iso } = h;

  /* Surge's timestamp: Riyadh time, 29 characters */
  const two = (n) => String(n).padStart(2, '0');
  const stamp = (daysAgo, hh = 10, mm = 0) => `${iso(day(daysAgo))}T${two(hh)}:${two(mm)}:${two((hh * 7 + mm) % 60)}.000+03:00`;
  const available = num(C.available);                      /* 72,880 — the account's balance */

  /* ── what a credit costs ─────────────────────────────────────────────────
     Bought on their own, credits cost more than inside a package (Platinum
     Plus Yearly is 75,000 for ﷼150,000 — ﷼2 each): ﷼2.50 each, 10% off from
     1,000 and 15% off from 5,000. They are allocated upfront and last 12
     months (MONTH_DURATION_FOR_CREDITS — creditTopUps.js:147 reads
     duration_in_months into "remain valid for 12 months"). */
  const PER_CREDIT = 2.5;
  const priceOf = (credits) => {
    const n = Math.max(0, Math.round(Number(credits) || 0));
    const price = Math.round(n * PER_CREDIT * 100) / 100;
    const off = n >= 5000 ? 0.15 : n >= 1000 ? 0.10 : 0;
    const net_price = Math.round(price * (1 - off) * 100) / 100;
    return { total_credits: n, price, net_price, discount: Math.round((price - net_price) * 100) / 100, duration_in_months: 12 };
  };

  /* ── the three carts ─────────────────────────────────────────────────────
     cartDataMapper (common/transformers/cart.js:54) reads each detail's
     item_* keys and the cart's net_amount (the total), amount (before the
     discount — the Discount row shows when it is larger, Ordersummary.js:223),
     discount, refundable_amount, total_credits and available_channels.
     A credit user's line shows item_price as it is (Ordersummary.js:78), so
     item_price is the LINE's price, not a unit price. */
  const TOP_UP = 1000;                                   /* what the top-up flow types */
  const topUpPrice = priceOf(TOP_UP);                    /* ﷼2,500 → ﷼2,250 */
  /* Titanium Yearly, as the packages area lists it (extra.mjs: the staff
     user's package record — id 19, 150,000 credits, ﷼250,000 after its 8%) */
  const TITANIUM = { id: 19, name: 'Titanium', name_l1: 'التيتانيوم', slug: 'titanium', credits: 150000, net: 250000, list: 270000 };
  /* the ad licence for a SALE (ad_license_products, listings.mjs: id 9, ﷼600) */
  const AD_LICENSE = { id: 9, name: 'Ad License Sell', name_l1: 'ترخيص إعلان بيع', slug: 'ad-license-sell', price: 600 };
  /* the request the ad-licence form creates — newer than the four the
     Listings tab already has (listings.mjs AD_LICENSE_REQUESTS, newest 22017) */
  const REQUEST_ID = 22031;

  /* Checkout.com (Flow) first, then Tabby — the two the product's own empty
     cart lists (payment/constants.js CART_INITIAL_STATE); usePaymentMethod
     selects the first enabled one, and with two the Payment Method cards
     show (paymentMethods.js:45). fee 0: no Service Charges row. Tabby's
     pay-in-4 is for small baskets: up to ﷼5,000 it is enabled (the top-up,
     the ad licence); a ﷼250,000 package is offered the card alone, which is
     the checkout's one-method layout. */
  const TABBY_LIMIT = 5000;
  const channels = (amount, net) => [
    { id: 1, slug: 'checkout', enabled: true, fee: 0, total_amount: amount, net_amount: net },
    { id: 3, slug: 'tabby', enabled: net <= TABBY_LIMIT, fee: 0, total_amount: amount, net_amount: net },
  ];
  const CARTS = {
    'top-up': { id: 4410231, credits: TOP_UP, amount: topUpPrice.price, net: topUpPrice.net_price,
      detail: { item_id: 7, item_type: 'Product', item_slug: 'credit', item_title: 'Credit', item_title_l1: 'رصيد', item_quantity: TOP_UP, item_price: topUpPrice.price, crm_item_id: 54 } },
    package: { id: 4410232, credits: TITANIUM.credits, amount: TITANIUM.list, net: TITANIUM.net,
      detail: { item_id: TITANIUM.id, item_type: 'Package', item_slug: TITANIUM.slug, item_title: TITANIUM.name, item_title_l1: TITANIUM.name_l1, item_quantity: TITANIUM.credits, item_price: TITANIUM.list, crm_item_id: 1019 } },
    'ad-license': { id: 4410233, credits: 1, amount: AD_LICENSE.price, net: AD_LICENSE.price, requestable: REQUEST_ID,
      detail: { item_id: AD_LICENSE.id, item_type: 'Product', item_slug: AD_LICENSE.slug, item_title: AD_LICENSE.name, item_title_l1: AD_LICENSE.name_l1, item_quantity: 1, item_price: AD_LICENSE.price, crm_item_id: null } },
  };
  const cartBody = (kind) => {
    const c = CARTS[kind];
    const created = stamp(0, 11, 20 + Object.keys(CARTS).indexOf(kind));
    return {
      cart: {
        id: c.id,
        user_id: U.id,
        source: 'profolio',
        status: 'active',
        amount: c.amount,
        net_amount: c.net,
        discount: Math.round((c.amount - c.net) * 100) / 100,
        refundable_amount: null,
        total_credits: c.credits,
        user_available_credits: available,
        listing_id: null,
        listing_expiry_days: null,
        purchased_full_credits: false,
        requestable_type: c.requestable ? 'AdLicenseRequest' : null,
        requestable_id: c.requestable || null,
        currency: 'SAR',
        cart_details: [{
          id: c.id * 10 + 1,
          cart_id: c.id,
          source: 'profolio',
          platform_id: 1,
          product_id: c.detail.item_type === 'Product' ? c.detail.item_id : null,
          installment_rule_id: null,
          item_image: null,
          ...c.detail,
        }],
        available_channels: channels(c.amount, c.net),
        created_at: created,
        updated_at: created,
      },
    };
  };

  /* ── a payment's ids, Checkout.com's formats (ps_ / pay_ + 26) ─────────── */
  const ORDER = { 'top-up': 7731042, package: 7731043, 'ad-license': 7731044 };

  /* the Nafath gate: users/current as the profile area answers it, not yet
     verified (checkout.js:128 opens NafathVerificationModal; Pay is disabled
     too, Ordersummary.js:268) */
  const nafathPending = (search, mode) => {
    const body = pass('GET', '/api/surge/users/current', search, null);
    return body?.user ? { ...body, user: { ...body.user, is_nafaz_verified: false } } : body;
  };

  return [
    /* only in MODE.NAFATH_PENDING; any other mode is the profile area's */
    [own(/^\/api\/surge\/users\/current$/), (search, mode, pathname, method = 'GET') =>
      (mode === MODE.NAFATH_PENDING ? nafathPending(search, mode) : pass(method, pathname, search, mode))],

    /* the Nafath link (bayut/apis/user.js:308) — the modal's Verify Nafath
       button is an href to it (nafath-verification-modal.js:53); never followed */
    [/^\/api\/surge\/ksa_verifications\/nafaz_auth$/, () => ({
      auth_request_url: { redirectUrl: 'https://www.bayut.sa/en/verification/nafath/?request=5f2c81d0' },
    })],

    /* ── the top-up ──────────────────────────────────────────────────────── */
    /* customCreditsPriceDataMapper (common/transformers/quotaCredits.js:221)
       reads net_price (the Total), price (struck through when larger) and
       duration_in_months */
    [/^\/api\/surge\/packages\/calculate_price$/, (search) => {
      const q = new URLSearchParams(search || '');
      const p = priceOf(q.get('total_credits'));
      return q.get('duration_in_months') ? { ...p, duration_in_months: Number(q.get('duration_in_months')) } : p;
    }],
    /* the Duration select a member-area user gets (creditTopUps.js:68,
       apis/common.js:26 reads `rules`): a range of credits → the months it
       may be spread over */
    [/^\/api\/surge\/packages\/custom_package_rules$/, () => ({ rules: [
      { id: 1, min_range: 1, max_range: 99, months: [{ id: 1, value: '1 Month', value_l1: 'شهر واحد' }] },
      { id: 2, min_range: 100, max_range: 999999, months: [
        { id: 1, value: '1 Month', value_l1: 'شهر واحد' }, { id: 3, value: '3 Months', value_l1: '3 أشهر' },
        { id: 6, value: '6 Months', value_l1: '6 أشهر' }, { id: 12, value: '12 Months', value_l1: '12 شهراً' },
      ] },
    ] })],

    /* ── the cart ─────────────────────────────────────────────────────────
       POST /carts answers the cart it made (offeredPackages.js:202,
       creditTopUps.js:113 and create-ad-license.js:196 read cart.id);
       PUT /carts/update the same (bayut/apis/cart.js:51 reads cart_details) */
    [/^\/api\/surge\/carts$/, (search, mode) => cartBody(cartOf(mode))],
    [/^\/api\/surge\/carts\/current$/, (search, mode) => cartBody(cartOf(mode))],
    [/^\/api\/surge\/carts\/update$/, (search, mode) => cartBody(cartOf(mode))],

    /* ── Credit/Debit Card: the Flow session ─────────────────────────────
       creditDebitWithCheckout.js:72 reads response.payment (the envelope
       with `success`) and needs payment_session_id; order_id is kept so a
       retry — or Tabby after it — reuses the order (tabby.js:106). */
    [/^\/api\/surge\/checkout\/request_payment$/, (search, mode) => {
      if (mode === MODE.NO_SESSION) return { response: { payment: { order_id: ORDER[cartOf(mode)] } } };
      const kind = cartOf(mode);
      const id = `ps_${token(CARTS[kind].id)}`;
      return { response: { payment: {
        id, payment_session_id: id, payment_session_secret: `pss_${token(ORDER[kind])}`,
        order_id: ORDER[kind], amount: Math.round(CARTS[kind].net * 100), currency: 'SAR',
      } } };
    }],
    /* the result — "{ data: { status, message } }" (utility.js:391):
       Authorized/Captured/Paid… succeed, Expired/Cancelled are "aborted",
       anything else fails */
    [/^\/api\/surge\/checkout\/update_payment$/, (search, mode) => {
      const kind = cartOf(mode);
      const status = outcomeOf(mode);
      return { data: {
        status,
        message: { Captured: 'Payment captured successfully', Declined: 'Payment declined by the card issuer', Cancelled: 'Payment was cancelled by the customer' }[status],
        payment_id: `pay_${token(ORDER[kind] + 7)}`,
        order_id: ORDER[kind],
        amount: CARTS[kind].net,
        currency: 'SAR',
      } };
    }],

    /* ── Tabby ──────────────────────────────────────────────────────────────
       prepare_checkout's transformer keeps `response` (bayut/apis/cart.js:88):
       tabby.js:118 and :123 read order_id and payment_id from it. The payment link's
       web_url is Tabby's hosted page — the product leaves for it with
       window.open(url, '_self'); in MODE.TABBY_REJECTED it is not a URL and
       the product says Tabby cannot approve the purchase (tabby.js:134). */
    [/^\/api\/surge\/tabby\/prepare_checkout$/, (search, mode) => ({ response: {
      payment_id: `${token(ORDER[cartOf(mode)] + 3).slice(0, 8)}-${token(11).slice(0, 4)}-${token(12).slice(0, 4)}-${token(13).slice(0, 4)}-${token(14).slice(0, 12)}`,
      order_id: ORDER[cartOf(mode)],
    } })],
    [/^\/api\/surge\/tabby\/[^/]+\/payment_link$/, (search, mode) => ({ response: { configuration: { available_products: { installments: [{
      web_url: mode === MODE.TABBY_REJECTED ? null : `https://checkout.tabby.ai/?sessionId=${token(21).slice(0, 8)}&apiKey=pk_test&product=installments`,
    }] } } } })],
    /* the tabby / hyperpay result keeps the older envelope (utility.js:403) */
    [/^\/api\/surge\/(tabby|hyperpay)\/update_payment$/, (search, mode) => ({ response: { payment: {
      approved: outcomeOf(mode) === 'Captured',
      status: outcomeOf(mode) === 'Captured' ? 'AUTHORIZED' : 'REJECTED',
      order_id: ORDER[cartOf(mode)],
    } } })],

    /* ── the ad-licence request ─────────────────────────────────────────────
       POST: create-ad-license.js:162 reads ad_license_request.id and goes on
       to the cart; in MODE.AD_LICENSE_REFUSED it is refused the way the API
       refuses (refusing() delivers it as a 422). The record is the listings
       area's row shape (listings.mjs AD_LICENSE_REQUESTS), at its first stage.
       A GET is the Listings tab's, answered there. */
    [own(/^\/api\/surge\/ad_license_requests$/), (search, mode, pathname, method = 'GET') => {
      if (method === 'GET') return pass(method, pathname, search, mode);
      if (mode === MODE.AD_LICENSE_REFUSED) return { success: false, errors: ['An ad license request already exists for this deed number'] };
      const created = stamp(0, 11, 18);
      /* what the flow's steps fill in (harness/interactions/ad-license.mjs
         AD): a residential sale in Al Yasmin, Riyadh */
      const place = DISTRICT_HITS.find((d) => d.title.en === 'Al Yasmin');
      return { ad_license_request: {
        id: REQUEST_ID,
        user_id: U.id,
        deed_number: '310547829163',
        latitude: place.latitude.toFixed(5),
        longitude: place.longitude.toFixed(6),
        purpose_id: 1,
        property_price: 1250000,
        jarvis_stages: 'payment_pending',
        jarvis_stages_display_name: 'Payment Pending',
        external_id: null,
        ad_license_number: null,
        created_at: created,
        updated_at: created,
        location: {
          id: place.location_id, title: place.title.en, title_l1: place.title.ar, level: 4,
          city_id: place.city_id, latitude: place.latitude, longitude: place.longitude, external_id: 10100000 + place.location_id,
        },
        type: { id: 1, title: 'Residential', title_l1: 'سكني', combined_title: 'Residential for Sale', combined_title_l1: 'سكني للبيع' },
      } };
    }],
  ];
};
