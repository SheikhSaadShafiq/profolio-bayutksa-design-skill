/**
 * Fixture answers for the stats area, in the real API's shape.
 * See harness/fixtures.mjs (answer) for how these are loaded, and
 * scripts/check-fixtures.mjs for what they are held to.
 *
 * @param h  the shared invented account — user, listings, credits, dates
 * @returns  [[RegExp over the pathname, (search, mode, pathname, method) => body], …]
 *
 * ── what reads these ────────────────────────────────────────────────────
 *   dashboard + reports/summary + reports/leads-reports  Performance card
 *       tenant/bayut/apis/reports.js:38  trends + product_stats (+ lms product_stats
 *       and phone_lead_stats when the user has call/WhatsApp tracking on, :31)
 *       → common/transformers/reports.js:180 reportsGraphDataMapper
 *   dashboard + reports  Listings card        dashboard/listing_stats
 *       → bayut/transformers/reports.js:49 widgetParser, which takes the FIRST
 *         key of `stats` as the platform — so `ksa` must come before `platforms`
 *   reports  Breakdown By Location donuts     dashboard/listings_by_area
 *       → bayut/transformers/reports.js:13 getAreaBreakdownData; the donut's
 *         centre is the SUM of the rows' counts, not the `sale`/`rent` fields
 *   reports/listing-report  Listing Performance table   ovation/stats per ad
 *       → bayut/transformers/reports.js:107 tableMapper (and updateListingStats
 *         on the listings table, bayut/transformers/listings.js:283)
 *   reports/listing-report  Listing By Date tab         dashboard/listings_history
 *   reports/leads-reports  Traffic and Leads by date    ovation/stats/product_stats
 *       → common/transformers/reports.js:848; Total Leads there is
 *         calls + sms + whatsapp + emails, so every day's channels must add up
 *         to its sum_lead_count or the table disagrees with the chart
 *   lms/leads-dashboard  Call / WhatsApp insight cards  lms/stats/insights,
 *       response_time_metrics, response_time_graph (container/pages/lms/utils.js)
 *
 * ── the numbers ─────────────────────────────────────────────────────────
 * Views per day are the 30-point series the dashboard chart already draws
 * (page.performance.chart.series, via h.items) — unchanged, so the line and
 * "Views 26,080" stay where they were. Clicks are the same 1.56% of views the
 * base table used. What was missing was everything under Leads: the base
 * answer rounded calls and WhatsApp off a fraction of views, so they came out
 * 0 or 1 on a handful of days, SMS and Email were hard 0, and product_wise was
 * empty — which made the Basic / Hot / Signature chips draw flat lines and
 * left the leads-by-date table a column of dashes.
 *
 * So leads are now a SCHEDULE: thirteen individual leads over the last thirty
 * days, each with a channel, a purpose and a product. Every total on every page
 * is a sum over that one list, which is what keeps the dashboard, the summary
 * and the two report tables agreeing with each other.
 *
 * ── the product chips (a 4-radio group, 3 borderless tags) ─────────────────
 * All / Basic / Hot / Signature above the Performance chart are a Radio.Group
 * of RadioPills, and each product pill holds a ProductTag — an antd Tag with
 * no border (components/widgets/LeadsStatsGraphWidget.js:205). The whole row
 * renders only when `!isNoGraph(data[currentTab])` — when the window has ANY
 * non-zero traffic (utility/utility.js:139). It is not a staff or a
 * tracking-off variant: the first real account had no traffic at all in its
 * window (product_stats.items {}), so it drew the "View In-Depth Insights"
 * empty state instead; the staff account had traffic and draws the row; this
 * account has traffic in every mode, so it draws it too.
 *
 * ── mode 'staff' ──────────────────────────────────────────────────────────
 * A staff user with call and WhatsApp tracking off (see `tracked`). The same
 * traffic and the same lead schedule — the product just stops asking LMS for
 * it — with three things the staff account's recording does differently:
 * a null leads trend, six sale and five rent areas in the donuts, and null /
 * zero figures wherever only a tracked number could know the answer.
 *
 * ── mode 'empty' ──────────────────────────────────────────────────────────
 * A brand-new account: no listing has been live, so there has been no
 * traffic and no lead. Every count is 0; every per-day and per-ad list is
 * empty, the way the real API spelled the first account's traffic-less
 * window (product_stats.items {}); nothing has a previous period, so every
 * trend is null. The Performance card then draws its "View In-Depth
 * Insights" empty state (utility/utility.js:139 isNoGraph), the donuts
 * "Not enough data", the report tables their empty tables.
 */
export default (h) => {
  const { day, iso, num, listings, page, products } = h;
  const DAY = 864e5;
  const today = day(0);

  /* ── the request ─────────────────────────────────────────────────────── */
  const params = (search) => new URLSearchParams(search || '');
  /* every stats call carries its window as start_date/end_date, except
     phone_lead_stats which uses start_datetime/end_datetime (reports.js:48).
     Unset — check-fixtures, or a caller that relies on the default — is the
     product's own default: the last 30 days (reportUtilities.js initialFilter). */
  const windowOf = (search) => {
    const q = params(search);
    const pick = (k) => (q.get(k) || q.get(k.replace('_date', '_datetime')) || '').slice(0, 10);
    const s = pick('start_date') || iso(day(29));
    const e = pick('end_date') || iso(day(0));
    const out = [];
    for (let t = Date.parse(`${s}T00:00:00Z`), end = Date.parse(`${e}T00:00:00Z`); t <= end && out.length < 800; t += DAY) {
      out.push(new Date(t).toISOString().slice(0, 10));
    }
    return out;
  };
  /* category_ids: 1 sale, 2 rent, 4 daily rental; "All" sends [1, 2]
     (bayut/utils/reportUtilities.js:627) — daily rentals are NOT part of All */
  const categoriesOf = (search) => {
    const c = params(search).getAll('category_ids[]').map(Number).filter(Boolean);
    return c.length ? [...new Set(c)] : [1, 2];
  };
  const offsetOf = (d) => Math.round((today - Date.parse(`${d}T00:00:00Z`)) / DAY);

  /* ── views ───────────────────────────────────────────────────────────── */
  const series = page.performance.chart.series;             /* index 0 = 29 days ago */
  const viewsAt = (off) => {
    if (off < 0) return 0;                                   /* the future has no traffic */
    if (off < series.length) return series[series.length - 1 - off];
    /* before the traced window: a plausible, deterministic month-on-month shape */
    return Math.max(0, Math.round(760 + 380 * Math.sin(off / 4.3) + ((off * 37) % 130)));
  };
  /* how the traffic splits by purpose; sale + rent is exactly the series */
  const SHARE = { 1: 0.8, 2: 0.2, 4: 0.07 };
  const shareOf = (cats) => cats.reduce((a, c) => a + (SHARE[c] || 0), 0);
  /* and by product — the ad_product keys are the product tabs' keys
     (bayut/utils/reportUtilities.js:170): premium = Basic, superhot = Signature */
  const PRODUCTS = ['premium', 'hot', 'superhot'];
  const splitByProduct = (n) => {
    const premium = Math.round(n * 0.15), hot = Math.round(n * 0.3);
    return { premium, hot, superhot: n - premium - hot };
  };

  /* ── leads: one row per lead ─────────────────────────────────────────── */
  /* off = days ago · ch = channel · cat = purpose · p = product. Thirteen in
     "All" (sale + rent): 3 calls, 7 WhatsApp, 1 SMS, 2 email. The Daily Rentals
     tab gets one of its own, since All leaves category 4 out. Nine of the ten
     most recent days carry at least one, so the first page of the leads table
     is populated the way an active account's is.
     The first three are the TruLeads list's own three (/lms/leads: a call on
     day 1 about the Al Rawabi apartment, WhatsApp on days 3 and 5 about the
     Al Wurud floor and the Al Nahdah villa), so the insight cards above that
     list count the leads it shows. `answered` is whether the call was picked
     up / the chat replied to: 2 of 3 calls and 5 of 7 chats, which is where
     67% and 71% come from. */
  const LEADS = [
    { off: 1, ch: 'call', cat: 1, p: 'superhot', answered: true },
    { off: 3, ch: 'whatsapp', cat: 1, p: 'premium', answered: true },
    { off: 5, ch: 'whatsapp', cat: 1, p: 'superhot', answered: true },
    { off: 2, ch: 'whatsapp', cat: 1, p: 'hot', answered: false },
    { off: 3, ch: 'email', cat: 1, p: 'premium' },
    { off: 4, ch: 'whatsapp', cat: 1, p: 'hot', answered: true },
    { off: 6, ch: 'sms', cat: 1, p: 'superhot' },
    { off: 7, ch: 'whatsapp', cat: 2, p: 'premium', answered: true },
    { off: 8, ch: 'email', cat: 1, p: 'superhot' },
    { off: 9, ch: 'call', cat: 2, p: 'superhot', answered: true },
    { off: 9, ch: 'whatsapp', cat: 1, p: 'hot', answered: true },
    { off: 10, ch: 'whatsapp', cat: 4, p: 'hot', answered: true },
    { off: 12, ch: 'call', cat: 1, p: 'hot', answered: false },
    { off: 15, ch: 'whatsapp', cat: 1, p: 'superhot', answered: false },
  ];
  /* older windows (Last 90 days, a custom range) repeat the month's pattern */
  const leadsOn = (off, cats) => (off < 0 ? [] : LEADS.filter((l) => l.off === off % 30 && cats.includes(l.cat)));

  /* ── one day's record, in the key set fillMissingDates writes
       (common/transformers/reports.js:109) plus what the real API adds ── */
  const count = (ls, ch) => ls.filter((l) => l.ch === ch).length;
  const record = (views, clicks, ls) => {
    const calls = count(ls, 'call'), wa = count(ls, 'whatsapp'), sms = count(ls, 'sms'), email = count(ls, 'email');
    const initiated = ls.filter((l) => l.ch === 'whatsapp' && l.answered).length;
    return {
      sum_view_count: clicks,
      sum_search_count: views,
      sum_phone_view_count: calls,
      sum_sms_view_count: sms,
      sum_whatsapp_view_count: wa,
      sum_email_view_count: email,
      sum_email_lead_count: email,
      sum_chat_view_count: 0,
      sum_chat_lead_count: 0,
      sum_confirmed_whatsapp: wa,
      sum_confirmed_sms: sms,
      sum_phone_lead: calls,
      sum_sms_lead_count: sms,
      sum_whatsapp_lead_count: wa,
      sum_lead_count: calls + wa + sms + email,
      chats_initiated: initiated,
      sum_whatsapp_contact_agent_count: 0,
      sum_whatsapp_contact_lead_count: 0,
    };
  };
  /* a row PER AD or PER PRODUCT carries a different key set from a day's
     total (data/api-shapes.b.json, ovation/stats items and product_wise[]):
     sum_phone_lead_count rather than sum_phone_lead, and the four
     apply / book-now counters, which are null on every row the real API
     sent — no KSA listing has an Apply or Book Now button. Nothing in the
     product reads these five; they are here because the API sends them. */
  const rowRecord = (views, clicks, ls) => ({
    ...record(views, clicks, ls),
    sum_phone_lead_count: count(ls, 'call'),
    sum_apply_view_count: null,
    sum_apply_lead_count: null,
    sum_book_now_view_count: null,
    sum_book_now_lead_count: null,
  });
  const dayItem = (d, cats) => {
    const off = offsetOf(d);
    const views = Math.round(viewsAt(off) * shareOf(cats));
    const clicks = Math.round(views * 0.0156);             /* the base table's click-through */
    const ls = leadsOn(off, cats);
    const v = splitByProduct(views), c = splitByProduct(clicks);
    return {
      ...record(views, clicks, ls),
      /* each product row repeats its day as `date` (string(10) in the recording) */
      product_wise: PRODUCTS.map((p) => ({ date: d, ad_product: p, ...rowRecord(v[p], c[p], ls.filter((l) => l.p === p)) })),
    };
  };
  const itemsFor = (search) => {
    const cats = categoriesOf(search);
    return Object.fromEntries(windowOf(search).map((d) => [d, dayItem(d, cats)]));
  };
  const SUM_KEYS = Object.keys(record(0, 0, []));
  const totalsOf = (items) => Object.fromEntries(SUM_KEYS.map((k) =>
    [k, Object.values(items).reduce((a, it) => a + (it[k] || 0), 0)]));

  /* period-on-period change, in percent — for the three metric tabs only.
     Views and clicks keep the values the dashboard has always shown (↑13%,
     ↓3%); leads is ↑8%. Every other key is NULL, as the real API sends it
     (data/api-shapes.json records all sixteen trends as null): with a number
     there, Calls / WhatsApp / SMS / Emails each grow an arrow and a percentage
     the real account's row does not have (+125px, and the row no longer lines
     up with the real capture). */
  const TRENDS = {
    ...Object.fromEntries(SUM_KEYS.filter((k) => !/contact_(agent|lead)/.test(k)).map((k) => [k, null])),
    sum_search_count: 12.5, sum_view_count: -3.1, sum_lead_count: 8.3,
  };
  /* the staff account's recording has views and clicks trends and a NULL
     leads trend (data/api-shapes.b.json) — its Leads tab carries no arrow */
  const STAFF_TRENDS = { ...TRENDS, sum_lead_count: null };
  /* The real API sends a date only when something happened on it: the staff
     account's recording has 23 of its 31 days (the first account, which had
     no traffic at all, got `items: {}`). The chart does not care —
     fillMissingDates puts the gaps back (common/transformers/reports.js:103)
     — but the Traffic and Leads by date table lists only the dates it is
     sent (:848), and its page count is parseInt(rows / 10) + 1. So in mode
     'staff' the two days before this account's traffic starts (Aug 30-31
     in the default window: no views, no clicks, no leads) are left out, and
     that table has three pages, as the staff account's does. Owner mode keeps
     every day, as it always has, so its pages do not move. */
  const productStats = (search, mode) => {
    if (mode === 'empty') return { stats: { items: {}, total: 0, ...totalsOf({}) } };
    const all = itemsFor(search);
    const items = mode === 'staff'
      ? Object.fromEntries(Object.entries(all).filter(([, it]) => SUM_KEYS.some((k) => it[k])))
      : all;
    return { stats: { items, total: Object.keys(items).length, ...totalsOf(items) } };
  };

  /* ── per listing ─────────────────────────────────────────────────────── */
  /* The row strings (views / clicks / leads) are the ones the dashboard's
     Recent Listings and the listings table already print; the channels are
     dealt out so that each row's leads are its calls + WhatsApp + SMS + email. */
  const CHANNELS = ['whatsapp', 'call', 'whatsapp', 'email', 'sms'];
  const adStats = (id, i, views, clicks, leads) => {
    const ls = Array.from({ length: leads }, (_, k) => ({ ch: CHANNELS[(i * 2 + k) % CHANNELS.length], answered: k % 2 === 0 }));
    const calls = ls.filter((l) => l.ch === 'call');
    return {
      /* a STRING over the wire (string(9) in data/api-shapes.b.json); every
         reader matches it with == against the numeric listing id
         (bayut/transformers/reports.js:108, bayut/apis/listings.js:83) */
      ad_external_id: String(id),
      ...rowRecord(views, clicks, ls),
      received_calls: calls.length,
      answered_calls: calls.filter((l) => l.answered).length,
      missed_calls: calls.filter((l) => !l.answered).length,
    };
  };
  const byId = new Map(listings.map((l, i) => [l.id, adStats(l.id, i, num(l._row.views), num(l._row.clicks), num(l._row.leads))]));
  /* an id this account does not own (another area's page 2, say) still gets
     numbers rather than a row of dashes — derived from the id, so stable */
  const statsForAd = (id, i) => byId.get(id) || (() => {
    const views = 380 + (id % 1900);
    return adStats(id, i, views, Math.round(views * 0.021), id % 3);
  })();

  /* ── listing counts ──────────────────────────────────────────────────── */
  /* The real Listings card shows a two-digit For Sale, a one-digit To Rent and
     a non-zero Daily Rentals (data/live/reports-summary.real.capture.json: the
     value boxes are 21, 8 and 12px wide). 20 active = 13 sale + 5 rent + 2 daily
     rentals, which is also what the ten listing rows imply (a rental on row 2,
     daily rentals on rows 4 and 9). Products are the shared account's. */
  const KSA = {
    active: page.listings.active, rent: 5, sale: 13, daily_rental: 2,
    basic: products.basic, signature: products.signature, hot: products.hot,
  };
  const DUBIZZLE = { active: 0, rent: 0, sale: 0, basic: 0, boost_to_top: 0, feature: 0 };
  /* mode 'empty': nothing posted yet */
  const NONE = Object.fromEntries(Object.keys(KSA).map((k) => [k, 0]));

  /* the donuts: four areas each, as on the real account. Counts sum to the
     purpose's listings; percentage is the API's own share of that sum. */
  const areas = (rows) => {
    const total = rows.reduce((a, [, , c]) => a + c, 0);
    return rows.map(([title, title_l1, c]) => ({ title, title_l1, count: c, percentage: Math.round((c / total) * 10000) / 100 }));
  };
  const SALE_AREAS = areas([
    ['Al Yarmuk', 'اليرموك', 5], ['Al Nahdah', 'النهضة', 4], ['Al Wurud', 'الورود', 2], ['Al Masif', 'المصيف', 2],
  ]);
  const RENT_AREAS = areas([
    ['Al Mughrizat', 'المغرزات', 2], ['Al Malqa', 'الملقا', 1], ['Al Narjis', 'النرجس', 1], ['Al Rawabi', 'الروابي', 1],
  ]);
  const byArea = {
    total: KSA.sale + KSA.rent, rent: KSA.rent, sale: KSA.sale,
    basic: KSA.basic, signature: KSA.signature, hot: KSA.hot,
    sale_breakdown_by_area: SALE_AREAS, rent_breakdown_by_area: RENT_AREAS,
  };
  /* mode 'staff': the staff account's donuts have SIX sale areas and FIVE
     rent areas (data/api-shapes.b.json), so its legends are six and five rows
     tall. Same 13 sale / 5 rent listings; the six sale areas are exactly the
     six the visible listing rows sit in. */
  const STAFF_SALE_AREAS = areas([
    ['Al Yarmuk', 'اليرموك', 5], ['Al Wurud', 'الورود', 2], ['Al Nahdah', 'النهضة', 2],
    ['Al Masif', 'المصيف', 2], ['Al Rawabi', 'الروابي', 1], ['As Sulaymaniyah', 'السليمانية', 1],
  ]);
  const STAFF_RENT_AREAS = areas([
    ['Al Mughrizat', 'المغرزات', 1], ['Al Malqa', 'الملقا', 1], ['Al Narjis', 'النرجس', 1],
    ['Al Rawabi', 'الروابي', 1], ['Al Sahafa', 'الصحافة', 1],
  ]);
  const staffByArea = { ...byArea, sale_breakdown_by_area: STAFF_SALE_AREAS, rent_breakdown_by_area: STAFF_RENT_AREAS };
  const emptyByArea = { total: 0, rent: 0, sale: 0, basic: 0, signature: 0, hot: 0, sale_breakdown_by_area: [], rent_breakdown_by_area: [] };
  const byAreaIn = (mode) => (mode === 'staff' ? staffByArea : mode === 'empty' ? emptyByArea : byArea);

  /* ── LMS call tracking ───────────────────────────────────────────────── */
  const callsIn = (ls) => ls.filter((l) => l.ch === 'call');
  const phoneRecord = (ls) => {
    const c = callsIn(ls), answered = c.filter((l) => l.answered).length;
    return {
      received_calls: c.length, answered_calls: answered, missed_calls: c.length - answered, rejected_calls: 0,
      response_rate: c.length ? Math.round((answered / c.length) * 10000) / 100 : 0,
    };
  };
  const leadsInWindow = (search) => {
    const cats = categoriesOf(search);
    return windowOf(search).flatMap((d) => leadsOn(offsetOf(d), cats));
  };
  const waRate = (ls) => {
    const wa = ls.filter((l) => l.ch === 'whatsapp');
    return wa.length ? Math.round((wa.filter((l) => l.answered).length / wa.length) * 10000) / 100 : 0;
  };
  /* mode 'staff' is a user with call AND WhatsApp tracking OFF (the second
     real account). The product then never asks for lms/stats/product_stats
     or phone_lead_stats (reports.js:31) — the Performance card's leads come
     from ovation's product_stats, which already counts every lead above.
     What tracking-off takes away is what only a TRACKED number knows: whether
     a call was received, answered or missed, and how fast a chat was
     answered. So those figures are empty; clicks are still counted. */
  const tracked = (ls, mode) => (mode === 'staff' || mode === 'empty' ? [] : ls);
  /* every lead and every day's traffic, as this mode has them — a brand-new
     account has had neither */
  const leadsIn = (search, mode) => (mode === 'empty' ? [] : leadsInWindow(search));
  const totalsIn = (search, mode) => (mode === 'empty' ? totalsOf({}) : totalsOf(itemsFor(search)));

  return [
    /* Listings card — dashboard and all three reports pages */
    [/^\/api\/surge\/dashboard\/listing_stats$/, (search, mode) => {
      const ksa = mode === 'empty' ? NONE : KSA;
      return { stats: { ksa: { ...ksa }, platforms: { ksa: { ...ksa }, dubizzle: { ...DUBIZZLE } } } };
    }],

    /* Breakdown By Location. Unanswered, both donuts said "Not enough data". */
    [/^\/api\/surge\/dashboard\/listings_by_area$/, (search, mode) => ({
      listings: {
        ksa: byAreaIn(mode),
        platforms: {
          ksa: byAreaIn(mode),
          dubizzle: { total: 0, rent: 0, sale: 0, basic: 0, 'boost-to-top': 0, feature: 0, sale_breakdown_by_area: [], rent_breakdown_by_area: [] },
        },
      },
    })],

    /* Listing By Date — the second tab of the listing report
       (bayut/apis/reports.js:147 → transformers/reports.js:247). Newest first,
       ten a page, the account growing to today's 20 active. */
    [/^\/api\/surge\/dashboard\/listings_history$/, (search, mode) => {
      const q = params(search);
      /* a brand-new account has no listing history: no dates at all */
      const dates = mode === 'empty' ? [] : windowOf(search).reverse();
      const perPage = 10, pg = Math.max(1, Number(q.get('page')) || 1);
      const rows = dates.slice((pg - 1) * perPage, pg * perPage);
      const result = Object.fromEntries(rows.map((d) => {
        const off = Math.max(0, offsetOf(d));
        const active = Math.max(6, KSA.active - Math.floor(off / 5));
        const rent = Math.min(KSA.rent, Math.round(active * 0.25));
        const hot = Math.min(KSA.hot, Math.round(active * 0.25)), basic = Math.min(KSA.basic, Math.round(active * 0.15));
        return [d, {
          active, sale: active - rent - (off < 20 ? KSA.daily_rental : 0), rent,
          signature: active - hot - basic, hot, basic, total: active,
          photography: off % 9 === 2 ? 1 : 0, videography: off % 13 === 4 ? 1 : 0, refresh: off % 4 === 1 ? 2 : 0,
        }];
      }));
      return { result, pagination: { current_page: pg, total_pages: Math.max(1, Math.ceil(dates.length / perPage)), total_count: dates.length, per_page: perPage } };
    }],

    /* per-listing stats: the listing report's table and the listings table */
    [/^\/api\/surge\/ovation\/stats$/, (search, mode) => {
      const ids = params(search).getAll('ad_external_ids[]').map(Number).filter(Boolean);
      const items = mode === 'empty' ? [] : (ids.length ? ids : listings.map((l) => l.id)).map((id, i) => statsForAd(id, i));
      return { stats: { total: items.length, items } };
    }],

    /* the Performance card's totals and ↑/↓ */
    [/^\/api\/surge\/ovation\/stats\/trends$/, (search, mode) => ({
      /* aggregates carry the sixteen keys trends does — not the two
         whatsapp_contact counts, which only product_stats sends */
      /* nothing has a previous period on a brand-new account: every trend null */
      stats: { aggregates: Object.fromEntries(Object.keys(TRENDS).map((k) => [k, totalsIn(search, mode)[k]])),
               trends: mode === 'empty' ? Object.fromEntries(Object.keys(TRENDS).map((k) => [k, null])) : { ...(mode === 'staff' ? STAFF_TRENDS : TRENDS) } },
    })],

    /* the Performance chart (per day, per product) and the leads-by-date table */
    [/^\/api\/surge\/ovation\/stats\/product_stats$/, (search, mode) => productStats(search, mode)],

    /* the same, as counted by LMS tracking — requested instead of the ovation
       leads when the user has call or WhatsApp tracking on (reports.js:31) */
    [/^\/api\/surge\/lms\/stats\/product_stats$/, (search, mode) => productStats(search, mode === 'empty' ? mode : undefined)],

    /* Calls Received / Answered / Missed in the Leads tab of the chart
       (common/transformers/leads.js:912 phoneStatsMapper) */
    [/^\/api\/surge\/lms\/stats\/phone_lead_stats$/, (search, mode) => {
      if (mode === 'empty') return { stats: { items: {}, total: 0, ...phoneRecord([]) } };
      const cats = categoriesOf(search);
      const items = Object.fromEntries(windowOf(search).map((d) => {
        const ls = leadsOn(offsetOf(d), cats);
        return [d, { ...phoneRecord(ls), product_wise: PRODUCTS.map((p) => ({ ad_product: p, ...phoneRecord(ls.filter((l) => l.p === p)) })) }];
      }));
      return { stats: { items, total: Object.keys(items).length, ...phoneRecord(leadsInWindow(search)) } };
    }],

    /* the Call Insights / WhatsApp Insights cards (container/pages/lms/utils.js).
       With the KSA clicks layout the call card reads its row from
       response_time_metrics and the WhatsApp card from here, so both carry
       every key either identifier is read for. */
    [/^\/api\/surge\/lms\/stats\/insights$/, (search, mode) => {
      const ls = tracked(leadsInWindow(search), mode);
      const t = totalsIn(search, mode);
      const { sum_view_count, sum_search_count, sum_sms_view_count, sum_whatsapp_view_count, sum_email_view_count,
        sum_chat_view_count, sum_phone_view_count, sum_whatsapp_lead_count, sum_email_lead_count, sum_chat_lead_count,
        sum_phone_lead, sum_whatsapp_contact_agent_count, sum_whatsapp_contact_lead_count, chats_initiated } = t;
      return { insights: {
        sum_view_count, sum_search_count, sum_sms_view_count, sum_whatsapp_view_count, sum_email_view_count,
        sum_chat_view_count, sum_phone_view_count, sum_whatsapp_lead_count, sum_email_lead_count, sum_chat_lead_count,
        sum_phone_lead, sum_whatsapp_contact_agent_count, sum_whatsapp_contact_lead_count, chats_initiated,
        whatsapp_response_rate: waRate(ls),
        ...phoneRecord(ls),
      } };
    }],

    /* the cards' stats row — Response Rate, Avg Duration, Avg Resp. Time. The
       values are printed as sent (utils.js:67), so they are sent formatted. */
    [/^\/api\/surge\/lms\/stats\/response_time_metrics$/, (search, mode) => {
      const ls = leadsIn(search, mode);
      const off = mode === 'staff' || mode === 'empty';  /* tracking off (see `tracked`), or nothing to time */
      /* Clicked is the same click the Performance card counts as Calls /
         WhatsApp (sum_phone_view_count / sum_whatsapp_view_count), so the
         two pages print the same 3 and 7 — with tracking on or off, since a
         click is counted either way */
      return { metrics: {
        avg_whatsapp_response_time: off ? null : '7m 40s',
        whatsapp_clicks: count(ls, 'whatsapp'),
        period: 'custom',
        clicked_calls: count(ls, 'call'),
        ...phoneRecord(tracked(ls, mode)),
        /* recorded by the second account; nothing reads it. Every call on this
           account either connected or was missed outright. */
        not_connected_calls: 0,
        /* null, not '0s', is how the staff account's recording spells "none" */
        avg_call_duration: off ? null : '2m 14s',
        avg_call_response_time: off ? null : '21s',
      } };
    }],

    /* the View Trend modal behind either card (common/transformers/leads.js:1017,
       which reads a missing rate or time as 0) */
    [/^\/api\/surge\/lms\/stats\/response_time_graph$/, (search, mode) => {
      const off = mode === 'staff' || mode === 'empty';
      const daily_data = windowOf(search).map((d) => {
        const o = offsetOf(d);
        return {
          date: d,
          calls: off ? { response_rate: 0, avg_response_time: null } : { response_rate: 50 + ((o * 17) % 45), avg_response_time: 12 + ((o * 7) % 25) },
          whatsapp: off ? { response_rate: 0, avg_response_time: null } : { response_rate: 55 + ((o * 13) % 40), avg_response_time: 4 + ((o * 5) % 9) },
        };
      });
      return { daily_response_rates: { daily_data, summary: off ? {
        calls: { avg_response_rate: 0, avg_response_time: null },
        whatsapp: { avg_response_rate: 0, avg_response_time: null },
      } : {
        calls: { avg_response_rate: 66.67, avg_response_time: '21s' },
        whatsapp: { avg_response_rate: 71.43, avg_response_time: '7m 40s' },
      } } };
    }],
  ];
};
