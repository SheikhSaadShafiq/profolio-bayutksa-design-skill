/**
 * Fixture answers for the credits area, in the real API's shape.
 * See harness/fixtures.mjs (answer) for how these are loaded, and
 * scripts/check-fixtures.mjs for what they are held to.
 *
 * Shapes are data/api-shapes.json's (recorded from staging, keys and types
 * only); values are the invented account's — the same 75,000-credit Platinum
 * Plus package, 2,120 used, and the same ten listings the listings table,
 * the dashboard and the upgrade modal already show.
 *
 * WHY THIS AREA WAS REWRITTEN. Surge renamed its fields and the base table
 * kept answering the old way, which the product does not reject — it renders
 * what it can and leaves the rest blank:
 *
 *   history card   "for undefined"  — history-breakdown.js:173 reads
 *                  listing.purpose.title; the old answer had purpose under
 *                  listing_category.purpose_hash.name
 *                  no product pill, no "applied to listing … by …" line —
 *                  renderListingLog (:83) switches on `action_performed`
 *                  and draws NOTHING for any other value, including undefined
 *                  no "n Used" pill — renderCreditsTag (:46), same switch
 *                  blank location line — getLocationTitle (:37) reads
 *                  `location.breadcrumb` (singular) on the ITEM, not the
 *                  listing's `breadcrumbs`
 *   summary        Total 0 — bayut/apis/quotaCredits.js:71 reads `allocated`, not `total`
 *   breakdown      blank labels — ProductBreakdown gets item.title
 *                  (credits-usage.js:391); the old answer sent `name`
 *
 * Also load-bearing, and easy to break again:
 *   - every history item needs `performed_by` as an OBJECT:
 *     history-breakdown.js:101 calls Object.keys(item.performed_by) with no
 *     guard, so a missing one throws inside the card.
 *   - the history page is an infinite scroll driven by pagination.next_page
 *     (credits-usage.js:454) — null on the last page, or it asks forever.
 *   - the history and summary are keyed 'bayut' (the platform's
 *     platform_slug), not 'ksa' (its slug): bayut/apis/quotaCredits.js:158/:180.
 *
 * @param h  the shared invented account — user, listings, credits, dates
 * @returns  [[RegExp over the pathname, (search, mode, pathname, method) => body], …]
 */
export default (h) => {
  const { U, C, day, iso, num, listings } = h;

  /* ── products, as Surge names them ──────────────────────────────────────
     ids are the tenant's own (tenant/bayut/data/products.js), which is what
     the Upgrades filter sends back as q[product_id_in][]. `cost` is what one
     application consumes, and matches the upgrade modal's required_quantity
     (fixtures.mjs, applicable_products) so the two pages agree. */
  const PRODUCTS = {
    'basic-listing':         { id: 1, name: 'Basic Listing',         name_l1: 'الإعلان الأساسي',   cost: 2 },
    'hot-listing':           { id: 2, name: 'Hot Listing',           name_l1: 'الإعلان المميز',    cost: 5 },
    'signature-listing':     { id: 3, name: 'Signature Listing',     name_l1: 'إعلان سيغنتشر',     cost: 10 },
    'refresh':               { id: 4, name: 'Refresh',               name_l1: 'تحديث الإعلان',     cost: 1 },
    'photography-service':   { id: 5, name: 'Photography Service',   name_l1: 'خدمة التصوير',      cost: 3 },
    'videography-service':   { id: 6, name: 'Videography Service',   name_l1: 'خدمة تصوير الفيديو', cost: 4 },
    'drone-footage-service': { id: 8, name: 'Drone Footage Service', name_l1: 'خدمة التصوير الجوي', cost: 6 },
  };
  const product = (slug) => {
    const { id, name, name_l1 } = PRODUCTS[slug];
    return { id, slug, name, name_l1, platform_id: 1 };
  };

  /* ── the package ───────────────────────────────────────────────────────── */
  const allocated = num(C.total), used = num(C.used), available = num(C.available);
  const percentage_used = Math.round((used / allocated) * 10000) / 100;
  /* Usage Breakdown, in the order the real page lists them. Sums to `used`
     (2,120), which is what the donut divides by; the three services this
     account has barely touched stay at or near zero, as they do on the real
     one. */
  const BREAKDOWN = [
    ['basic-listing', 980], ['hot-listing', 640], ['signature-listing', 320],
    ['refresh', 120], ['photography-service', 60],
    ['videography-service', 0], ['drone-footage-service', 0],
  ];
  /* the slug has to be one tenant/bayut/data/packages.js:7 knows, or the
     Current Plan line on the dashboard loses its package icon — the old
     'platinum_plus' mapped to nothing */
  const currentPackage = {
    name: C.plan, name_l1: 'بلاتينيوم بلس',
    next_disbursement_date: null,
    end_date: iso(day(-185)),
    credits_per_month: Math.round(allocated / 12),
    slug: 'platinum-plus-yearly',
    top_up_credits: 0,
    net_amount: 150000,
    duration_in_months: 12,
    is_multi_platform: false,
  };

  /* ── places ──────────────────────────────────────────────────────────────
     the listings fixture carries English only; the history card localises
     every breadcrumb (history-breakdown.js:39), so the RTL page needs these */
  const AR = {
    Riyadh: 'الرياض', 'North Riyadh': 'شمال الرياض', 'East Riyadh': 'شرق الرياض',
    'Al Wurud': 'الورود', 'Al Masif': 'المصيف', 'Al Mughrizat': 'المغرزات',
    'Al Rawabi': 'الروابي', 'Al Nahdah': 'النهضة', 'Al Yarmuk': 'اليرموك',
    'Al Diriyah': 'الدرعية', 'As Sulaymaniyah': 'السليمانية',
  };
  const LOC_ID = {};
  const locId = (t) => (LOC_ID[t] ||= 2000 + Object.keys(LOC_ID).length * 7);
  /* level 1 is the country and is dropped by the card; the rest read back
     reversed: "Al Wurud, North Riyadh, Riyadh" */
  const locationOf = (l) => {
    const parts = l._row.location.split(', ');
    const breadcrumb = [{ id: 1, title: 'KSA', title_l1: 'السعودية', level: 1 },
      ...parts.map((t, i) => ({ id: locId(t), title: t, title_l1: AR[t] || t, level: i + 2 }))];
    const leaf = breadcrumb[breadcrumb.length - 1];
    return { id: leaf.id, title: leaf.title, breadcrumb };
  };

  const TYPES = {
    Apartment: { id: 1, title_l1: 'شقة' }, Villa: { id: 2, title_l1: 'فيلا' },
    Floor: { id: 3, title_l1: 'دور' }, Chalet: { id: 4, title_l1: 'شاليه' },
  };

  /* Surge writes timestamps in Riyadh time with the offset spelled out:
     "2026-09-25T14:03:11.000+03:00" — 29 characters, as recorded */
  const riyadh = (ms) => new Date(ms + 3 * 36e5).toISOString().slice(0, 19) + '.000+03:00';
  const H = 36e5, M = 6e4;

  /* the agency's own REGA licence (user.json), which is who advertises */
  const ADVERTISER = String(U.license?.number ?? '7201000001');
  const opt = (id, slug, label, label_l1, value_l1 = label_l1) => ({ id, slug, label, value: label, label_l1, value_l1 });

  /* the history's copy of a listing — a projection, not the listing: price,
     purpose, type, beds, area and one image are all the card draws, and
     dynamic_data is carried because the real answer carries it */
  const historyListing = (l) => {
    const r = l._row;
    const typeName = l.listing_category.name;
    const sale = l.listing_category.purpose_hash.slug === 'for-sale';
    const type = TYPES[typeName] || { id: 9, title_l1: typeName };
    const bedsN = r.beds || 0;
    const img = (size) => `/harness-img/${l.id}-${size}.svg`;
    return {
      id: l.id,
      expiry_date: riyadh(Date.parse(l.platform_listings[0].expiry_date)),
      currency: 'SAR',
      price: l.price,
      dynamic_data: { dynamic_fields: {
        age: opt(1, 'new', 'New', 'جديد'),
        area: l.area,
        beds: opt(10 + bedsN, String(bedsN), String(bedsN), String(bedsN)),
        face: opt(1, 'northern', 'Northern', 'شمالية'),
        baths: opt(20 + (r.baths || 0), String(r.baths || 0), String(r.baths || 0), String(r.baths || 0)),
        id_type: 1,
        features: [
          { id: 11, slug: 'central-ac', title: 'Central A/C', title_l1: 'تكييف مركزي' },
          { id: 14, slug: 'parking', title: 'Parking', title_l1: 'موقف سيارات' },
          { id: 19, slug: 'maid-room', title: 'Maid Room', title_l1: 'غرفة خادمة' },
        ],
        area_unit: { id: 2, slug: 'square-meters', label: 'Square Meters', value: 'sqm', label_l1: 'متر مربع', value_l1: 'متر مربع' },
        furnished: opt(2, 'no', 'No', 'لا'),
        sale_type: opt(1, 'initial-sale', 'Initial Sale', 'بيع أولي', null),
        is_verified: true,
        floor_number: typeName === 'Villa' ? 0 : 2,
        otp_attempts: 0,
        rega_details: {
          ai_data: { title_matches: true, price_matches: true },
          isValid: true,
          message: null,
          advertisement: { advertisement_number: l.ad_license, advertiser_id: ADVERTISER, is_valid: true },
        },
        rental_price: sale ? '0.00' : String(l.price),
        advertiser_id: ADVERTISER,
        built_up_area: l.area,
        campaign_type: opt(2, 'by-staff', 'By Staff', 'بواسطة الموظفين', null),
        is_bi_approved: true,
        is_installment: false,
        license_number: l.ad_license,
        rent_frequency: opt(3, 'monthly', 'Monthly', 'شهري', null),
        residence_type: opt(1, 'open-to-all', 'Open To All', 'متاح للجميع', null),
        area_unit_value: l.area,
        completion_status: opt(1, l.completion_status, l.completion_status === 'ready' ? 'Ready' : 'Off-Plan', l.completion_status === 'ready' ? 'جاهز' : 'على الخارطة', null),
        is_contact_hidden: false,
        is_photo_verified: false,
        is_posted_on_rega: true,
        is_video_verified: false,
        auto_generated_title: true,
        is_location_editable: false,
        possession_available: true,
        apply_refresh_by_default: false,
        title_translation_enabled: true,
        auto_generated_description: false,
        description_translation_enabled: true,
      } },
      purpose: sale ? { id: 1, title: 'Sale', title_l1: 'للبيع' } : { id: 2, title: 'Rent', title_l1: 'للإيجار' },
      type: { id: type.id, title: typeName, title_l1: type.title_l1 },
      beds: bedsN,
      area_unit: { id: 2, value: l.area },
      image: {
        id: 7700000 + (l.id % 100000), status: 'on', is_unique: true, listing_id: l.id,
        filename: `${String(l.id).padStart(32, 'a')}.jpg`,
        uuid: `${String(l.id).padStart(8, '0')}-0000-4000-8000-000000000000`,
        full: img('full'), large: img('large'), medium: img('medium'), thumbnail: img('thumbnail'), small: img('small'),
        default: 1, order: 0, rejection_reason: null, is_rega_image: false, image_type: 'listing_image',
      },
    };
  };
  const performer = { id: U.id, name: U.name, name_l1: U.name_l1 };

  /* ── the month's history, built from what the listings table says happened
     Every listing was posted (Basic Listing); the hot and signature rows had
     that upgrade; row 3 — the one the listings fixture shows with Signature
     applied and Photography requested — has both; row 1 is the REJECTED row,
     so its posting credits came back (the "Refunded" card); a few rows were
     refreshed. Nothing here contradicts the listings page. Row 2's Hot was
     bought yesterday, so the newest cards read Hot Listing then Basic
     Listing, as on the real account. */
  const events = [];
  const at = (i, slug, ms, action = 'consumed') => events.push({ i, slug, ms, action });
  listings.forEach((l, i) => {
    const posted = Date.parse(l.posted_at);
    const p = l._row.product;
    at(i, 'basic-listing', posted + 6 * H + i * 17 * M);
    if (p === 'hot' && i !== 2) at(i, 'hot-listing', posted + 6 * H + (i * 17 + 4) * M);
    if (p === 'signature' || i === 3) at(i, 'signature-listing', posted + 7 * H + i * 11 * M);
  });
  at(2, 'hot-listing',         day(1).getTime() + 8 * H + 42 * M);
  at(3, 'photography-service', day(2).getTime() + 5 * M);   /* = its requested_at in the listings fixture */
  at(1, 'basic-listing',       Date.parse(listings[1].posted_at) + 27 * H, 'reverted');
  at(5, 'refresh',             day(3).getTime() + 5 * H + 12 * M);
  at(4, 'refresh',             day(4).getTime() + 13 * H + 30 * M);
  at(6, 'refresh',             day(7).getTime() + 9 * H + 48 * M);
  at(9, 'refresh',             day(12).getTime() + 7 * H + 3 * M);
  at(9, 'refresh',             day(20).getTime() + 11 * H + 26 * M);
  events.sort((a, b) => b.ms - a.ms);

  const historyItem = ({ i, slug, ms, action }) => {
    const l = listings[i];
    return {
      product: product(slug),
      credits_quantity: PRODUCTS[slug].cost,
      action_performed: action,
      listing: historyListing(l),
      location: locationOf(l),
      performed_at: riyadh(ms),
      performed_by: performer,
    };
  };

  const PER_PAGE = 10;
  /* the page's own filters — creditsUsageFilters.js: listing id, upgrade, user */
  const filtered = (search) => {
    const q = new URLSearchParams(search || '');
    const idEq = q.get('q[consumed_on_id_eq]');
    const productIds = q.getAll('q[product_id_in][]').concat(q.getAll('q[product_id_in]')).filter(Boolean).map(Number);
    const userEq = q.get('q[user_id_eq]');
    return events.filter((e) =>
      (!idEq || String(listings[e.i].id) === idEq.trim()) &&
      (!productIds.length || productIds.includes(PRODUCTS[e.slug].id)) &&
      (!userEq || String(U.id) === userEq));
  };

  return [
    [/^\/api\/surge\/credits\/consumption_history$/, (search) => {
      const set = filtered(search);
      const total_pages = Math.max(1, Math.ceil(set.length / PER_PAGE));
      const page = Math.min(Math.max(1, Number(new URLSearchParams(search || '').get('page')) || 1), total_pages);
      return {
        credits_consumption_history: {
          bayut: set.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(historyItem),
        },
        pagination: {
          current_page: page,
          next_page: page < total_pages ? page + 1 : null,
          prev_page: page > 1 ? page - 1 : null,
          total_pages,
          total_count: set.length,
        },
      };
    }],

    [/^\/api\/surge\/credits\/consumption_summary$/, () => ({
      credits_consumption_summary: {
        bayut: {
          available, expiring: 0, allocated, used, percentage_used,
          product_wise: BREAKDOWN.map(([slug, consumed_credits]) => ({
            id: PRODUCTS[slug].id,
            title: PRODUCTS[slug].name,
            title_l1: PRODUCTS[slug].name_l1,
            slug,
            platform_id: 1,
            consumed_credits,
          })),
        },
      },
    })],

    /* the dashboard's Credits Balance card (creditsWidgetMapper,
       common/transformers/quotaCredits.js:109) and the prop-shop package
       header. `expiring` stays 0: above it the card grows a
       "credits are expiring within 7 days" notice the real account does not
       show. */
    [/^\/api\/surge\/credits\/summary$/, () => ({
      credits_summary: {
        bayut: {
          allocated, available, used, expiring: 0, percentage_used, top_up_credits: 0,
          product_wise: [{
            id: 7, name: 'Credit',
            allocated, available, used, expiring: 0, percentage_used, top_up_credits: 0,
          }],
          current_package: currentPackage,
        },
      },
    })],

    /* NOT RECORDED — data/api-shapes.json has no entry. A credit user never
       asks for it: bayut/apis/quotaCredits.js:129 sends currency users to
       credits/summary, and its transformer returns nothing for anyone else.
       The only reader of the body is manageTransferQuotaCreditsTransformer
       (common/transformers/quotaCredits.js:225), which destructures
       body[platform.slug] with no guard — so it is answered keyed 'ksa' with
       {quota, credits} rather than {}, which would throw there. */
    [/^\/api\/surge\/dashboard\/qc_summary$/, () => ({
      ksa: {
        quota: { id: 1, name: 'Basic Listing', available: 0, used: 0, total: 0 },
        credits: [{ id: 7, name: 'Credit', available, used, total: allocated }],
      },
    })],
  ];
};
