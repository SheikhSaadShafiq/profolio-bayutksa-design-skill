/**
 * Fixture answers for the profile area, in the real API's shape.
 * See harness/fixtures.mjs (answer) for how these are loaded, and
 * scripts/check-fixtures.mjs for what they are held to.
 *
 *   GET /api/surge/users/current        the shell's user (user.json, plus the few
 *                                       fields below that must agree with users/:id)
 *   GET /api/surge/users/:id            the settings form, AND the header avatar —
 *                                       auth-info/info.js:28 asks for it on every page
 *   GET /api/surge/agencies/:id         Agency Settings, Agency Staff, and — through
 *                                       router.js:66 → apis/agency.js:16 — every page:
 *                                       it is merged into loginUser.agency and becomes
 *                                       the users list (LMS "Users" filter, dashboard
 *                                       user selector)
 *   GET /api/surge/languages            ┐ the three option lists the profile form's
 *   GET /api/surge/area_units           │ selects draw from (bayut/apis/user.js:187).
 *   GET /api/surge/experience_list      ┘ They answered {} and every select sat on
 *                                       its placeholder
 *
 * Shapes are data/api-shapes.json's; values are the invented account's —
 * Faisal Al-Harbi, Najd Horizon Real Estate, Riyadh, the 75,000-credit
 * Platinum Plus package. None of it is a real person or agency.
 *
 * ── THE PHOTO: profile_image is null ────────────────────────────────────────
 * The account has no profile photo, and that decision stands (fixtures.mjs,
 * the AVATAR comment): the header draws the FiUser glyph on every page. What
 * changes is how "no photo" is SPELLED over the wire.
 *
 * AVATAR is an array with a `sizes` property bolted on. JSON.stringify drops
 * named properties of arrays, and every answer goes through it
 * (capture.mjs:164 `JSON.stringify(body)`), so what the product actually
 * received was `[{ id: null, gallerythumb: null, title: '' }]` — no `sizes`.
 * Which means read 1 in that comment never held:
 *
 *   1  profileDataMapper  values.profile_image.sizes.thumbnail   (common/transformers/user.js:35)
 *      → "Cannot read properties of undefined (reading 'thumbnail')" — the
 *        /user-settings/preferences error in the capture log. It is the only
 *        caller (getProfileDetails, preference.js:37).
 *
 * and the one-element array had a cost nobody listed: the form's image field
 * takes the value as its image list (json-form.js:523), so User Settings drew
 * a phantom upload tile with a "Retry" button — a failed upload, which is a
 * state no real account is in (and which data/ours copied).
 *
 * null is how the real API spells "no photo": the same recording's
 * agency.users[].profile_image is null for a staff member without one. Against
 * the same reads:
 *
 *   1  profileDataMapper   null.sizes → still throws. Nothing that says "no
 *                          photo" can pass this read: it needs an OBJECT with
 *                          sizes, and an object with an empty thumbnail
 *                          survives read 2 unconverted and dies on read 3 and
 *                          in ImageUpload (images.map is not a function). It
 *                          is a product bug for every photo-less account, and
 *                          the array did not pass it either.
 *   2  getLoggedInUserValues  thumbnail undefined → leaves the value alone
 *   3  profile.js:157  profileData?.profile_image?.[0].gallerythumb — the
 *                          optional chain short-circuits the WHOLE chain on
 *                          null, so .gallerythumb is never read → the glyph
 *      info.js:55 (header) same → the glyph, identical on every page
 *      json-form.js:523   `value ? value : []` → [] → "Browse and Upload",
 *                          which is what data/fixtures/settings.json already
 *                          documents for this field
 *
 * So check-fixtures reports `missing .user.profile_image` (null against the
 * recording's object) on purpose: the recorded account has a photo, ours does
 * not. agency.owner.profile_image is the same person's photo and is null for
 * the same reason.
 *
 * @param h  the shared invented account — user, listings, credits, dates
 * @returns  [[RegExp over the pathname, (search, mode, pathname, method) => body], …]
 */
import creditsArea from './credits.mjs';

export default (h) => {
  const { user, U, AGENCY, page, day, iso, memberUser } = h;

  /* ── the package ─────────────────────────────────────────────────────────
     Taken from the credits area's own credits/summary answer so the shell,
     users/:id, the agency and the Credits Balance card name the same package.
     The slug has to be one tenant/bayut/data/packages.js:7 knows
     ('platinum-plus-yearly') or the plan icon drops out wherever the product
     falls back to user.package (QuotaCreditsStatWidget.js:25); user.json's
     'platinum_plus' mapped to nothing. */
  const summary = (() => {
    try {
      const route = creditsArea(h).find(([re]) => re.test('/api/surge/credits/summary'));
      return route?.[1]('', null, '/api/surge/credits/summary', 'GET')?.credits_summary?.bayut;
    } catch { return undefined; }
  })();
  const pool = U.credits.bayut;
  const PKG = summary?.current_package || {
    name: 'Platinum Plus', name_l1: 'بلاتينيوم بلس', next_disbursement_date: null,
    end_date: iso(day(-185)), credits_per_month: Math.round(pool.allocated / 12),
    slug: 'platinum-plus-yearly', top_up_credits: 0, net_amount: 150000,
    duration_in_months: 12, is_multi_platform: false,
  };
  const credit = (allocated, used) => {
    const n = { allocated, available: allocated - used, used, expiring: 0,
                percentage_used: allocated ? Math.round((used / allocated) * 10000) / 100 : 0, top_up_credits: 0 };
    return { ...n, product_wise: [{ id: 7, name: 'Credit', ...n }], current_package: PKG };
  };
  /* the account's pool, as users/current already states it */
  const CREDITS = { bayut: credit(pool.allocated, pool.used) };

  /* ── option lists (product config, not anybody's data) ───────────────── */
  const stamp = '2023-06-14T11:05:22.418+03:00';      /* 29 chars, Surge's timestamp shape */
  const LANGUAGE_NAMES = [
    'Albanian', 'Amharic', 'Arabic', 'Armenian', 'Azerbaijani', 'Bengali', 'Bosnian', 'Bulgarian',
    'Burmese', 'Cantonese', 'Croatian', 'Czech', 'Danish', 'Dari', 'Dutch', 'English', 'Filipino',
    'Finnish', 'French', 'Georgian', 'German', 'Greek', 'Gujarati', 'Hausa', 'Hindi', 'Hungarian',
    'Indonesian', 'Italian', 'Japanese', 'Kannada', 'Kazakh', 'Korean', 'Kurdish', 'Malay',
    'Malayalam', 'Mandarin', 'Marathi', 'Nepali', 'Norwegian', 'Pashto', 'Persian', 'Polish',
    'Portuguese', 'Punjabi', 'Romanian', 'Russian', 'Serbian', 'Sinhala', 'Somali', 'Spanish',
    'Swahili', 'Swedish', 'Tamil', 'Telugu', 'Thai', 'Tigrinya', 'Turkish', 'Ukrainian', 'Urdu',
    'Uzbek', 'Vietnamese', 'Yoruba',
  ];
  /* name_l1 is null on every row of the real list */
  const LANGUAGES = LANGUAGE_NAMES.map((name, i) => ({ id: i + 1, name, created_at: stamp, updated_at: stamp, name_l1: null }));
  const lang = (name) => { const l = LANGUAGES.find((x) => x.name === name); return { id: l.id, name: l.name }; };

  const EXPERIENCE = [
    { value: 1, label: '0-2 Years',   label_l1: '0-2 سنة' },
    { value: 2, label: '3-5 Years',   label_l1: '3-5 سنوات' },
    { value: 3, label: '6-10 Years',  label_l1: '6-10 سنوات' },
    { value: 4, label: '11-15 Years', label_l1: '11-15 سنة' },
    { value: 5, label: '15+ Years',   label_l1: '+15 سنة' },
  ];

  /* one unit on KSA; id and short title match the listings' area_unit */
  const AREA_UNITS = [{
    id: 2, unit_title: 'Square Meters', unit_short_title: 'Sq. M.', conversion_rate: null,
    unit_title_l1: 'متر مربع', unit_short_title_l1: 'م²', slug: 'square-meters',
  }];

  /* ── where the account works ─────────────────────────────────────────────
     Service areas are CITIES — the field's options are Algolia's city list
     plus these (bayut/data/profileFields.js:17). Algolia is blocked in the
     harness, so these rows are the only options the select has, and they are
     what turns its tags from ids into names. 26, as on the real account:
     three tags and a "+ 23" is the shape that field has to hold. Riyadh is
     id 1, the user's own city. */
  const CITIES = [
    ['Riyadh', 'الرياض'], ['Diriyah', 'الدرعية'], ['Al Kharj', 'الخرج'], ['Jeddah', 'جدة'],
    ['Makkah', 'مكة المكرمة'], ['Al Madinah', 'المدينة المنورة'], ['Dammam', 'الدمام'], ['Al Khobar', 'الخبر'],
    ['Dhahran', 'الظهران'], ['Al Ahsa', 'الأحساء'], ['Al Jubail', 'الجبيل'], ['Al Qatif', 'القطيف'],
    ['Taif', 'الطائف'], ['Buraidah', 'بريدة'], ['Unaizah', 'عنيزة'], ['Hail', 'حائل'],
    ['Tabuk', 'تبوك'], ['Abha', 'أبها'], ['Khamis Mushait', 'خميس مشيط'], ['Jazan', 'جازان'],
    ['Najran', 'نجران'], ['Yanbu', 'ينبع'], ['Al Baha', 'الباحة'], ['Arar', 'عرعر'],
    ['Sakaka', 'سكاكا'], ['Hafar Al Batin', 'حفر الباطن'],
  ];
  const SERVICE_AREAS = CITIES.map(([title, title_l1], i) => ({ id: i + 1, title, title_l1 }));

  /* the user's and the agency's address are the same office, as they are on
     the real account (both 67 characters there) */
  const ADDRESS = 'Office 14, Najd Horizon Building, King Fahd Road, Al Olaya, Riyadh';
  const SHORT_ADDRESS = 'RRKA7421';     /* KSA national short address: 4 letters + 4 digits */

  const DESCRIPTION =
    'Faisal Al-Harbi is a licensed real estate broker with Najd Horizon Real Estate in Riyadh, ' +
    'focusing on residential sales across the north and east of the city. For the past four years ' +
    'he has helped families and first-time buyers find apartments, floors and villas in Al Wurud, ' +
    'Al Masif, Al Yarmuk and Al Nahdah, and advises investors on off-plan projects and ready units. ' +
    'Every listing he publishes carries a valid REGA advertising licence and verified photographs. ' +
    'He speaks Arabic and English, arranges viewings seven days a week, and follows each client ' +
    'through valuation, negotiation, financing and the final transfer of title.';
  const DESCRIPTION_L1 =
    'فيصل الحربي وسيط عقاري مرخّص لدى نجد هورايزن للعقارات في الرياض، ويتخصص في بيع العقارات ' +
    'السكنية في شمال المدينة وشرقها. ساعد خلال السنوات الأربع الماضية العائلات والمشترين لأول مرة ' +
    'في العثور على الشقق والأدوار والفلل في أحياء الورود والمصيف واليرموك والنهضة، ويقدّم المشورة ' +
    'للمستثمرين في المشاريع على الخارطة والوحدات الجاهزة. جميع إعلاناته تحمل ترخيصاً إعلانياً ' +
    'سارياً من الهيئة العامة للعقار وصوراً موثّقة. يتحدث العربية والإنجليزية، وينظّم المعاينات ' +
    'طوال أيام الأسبوع، ويرافق عملاءه في التقييم والتفاوض والتمويل حتى إفراغ الصك.';

  const ACTIVE = { id: 1, name: 'Active', name_l1: 'نشط', slug: 'active' };
  /* the recording's external ids are strings; the value stays user.json's id */
  const mapping = (id) => ({ bayut: { mapped: true, external_id: String(id), platform_id: 1 } });

  /* settings rows, shared by users/current and users/:id. image_detail_usage
     is the row the real account sends first; 'disabled' is what users/current
     already implied by not sending it (preference.js:135 reads it there) */
  const SETTINGS = [
    { id: 3, setting_id: 3, name: 'Image Detail Usage', value: 'disabled', slug: 'image_detail_usage' },
    ...U.settings,
  ];

  /* a logo, as the real agency has: mapSurgeAgencyResponse reads
     logo.sizes.thumbnail (common/transformers/agency.js:444) into the header
     image (agency-info-card.js:23) and the Agency Logo tile. Any
     /harness-img/ path is served the grey placeholder (capture.mjs:143).
     This is the AGENCY's logo, not the user's photo — the header avatar
     never reads it. */
  const img = (n) => `/harness-img/agency-${AGENCY.id}-logo-${n}.svg`;
  const LOGO_ID = 'c7a4e2d1-5b3f-4e8a-9d61-2f0b8c3a7e54';
  const LOGO = {
    id: LOGO_ID, status: 'done', filename: LOGO_ID, uuid: LOGO_ID,
    sizes: { full: img('full'), large: img('large'), medium: img('medium'), thumbnail: img('thumbnail'), small: img('small') },
    order: null,
  };

  /* ── users/current ───────────────────────────────────────────────────────
     user.json, changed only where it has to agree with the answers below.
     Deliberately NOT given the rest of users/:id: the shell reads several of
     those keys off users/current and they would move other pages —
     profile_completion.applicable draws the dashboard banner
     (profile-completion-banner.js:97), `unified: false` turns the unified
     features off (utility/user.js:38), an area_unit row changes the
     account's unit preference (common/transformers/user.js:153), and
     tru_broker_start_date feeds the dashboard's LMS tour gate
     (dashboard.js:117). */
  const CURRENT = {
    ...U,
    /* the agency OWNER: leads-summary-header.js:135 and leads-dashboard.js:207
       gate the profile switcher's owner-only entries on
       user_role_within_agency === 'owner' (= role, transformers/user.js:100);
       the real record's role is a five-letter word, and so is this one */
    role: 'owner',
    credits: CREDITS,
    settings: SETTINGS,
    /* the real user has both; with them the reports ask for
       lms/stats/product_stats and phone_lead_stats (bayut/apis/reports.js:29-33) */
    is_call_tracking_enabled: true,
    is_whatsapp_tracking_enabled: true,
    agency: {
      ...U.agency, address: ADDRESS, is_verified: false, logo: LOGO,
      /* The dashboard's agency row draws loginUser.agency.agency_logo
         (useDashboardData.js:87/:125), and router.js:66 merges the agencies
         answer INTO loginUser.agency with these keys winning
         (apis/agency.js:16). The real account's agency has a logo and its
         dashboard still shows the glyph: on staging the agency answer lands
         after the dashboard has picked its selected user (the effect at
         useDashboardData.js:115 only runs while none is selected). The
         harness answers instantly, the logo won that race, and the row drew a
         picture where the real one draws FiUser. Stating it here makes the
         outcome the real one, deterministically. */
      agency_logo: null,
    },
  };
  delete CURRENT._avatar;

  /* ── the dashboard promo banner ──────────────────────────────────────────
     users/current's top-level banners[] (dashboard.js:96,
     utility/dashboardBanners.js): an entry with no expires_at and an image
     per variant. The real account carries a TruCheck promo there, drawn
     1332×203 above the agency row; the slot is 1390×212
     (dashboard-promo-banner.js:6), so the image is exactly that, inline —
     /harness-img/ would serve a 320×240 box. An invented graphic, not
     Bayut's artwork. Package user only: memberUser keeps its own. */
  const bannerSvg = (dir, title, sub, cta) => {
    const rtl = dir === 'rtl';
    /* with direction="rtl", text-anchor "start" is the RIGHT edge */
    const x = rtl ? 1250 : 140, anchor = 'start';
    const ctaX = rtl ? 100 : 1110;
    return `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1390" height="212" viewBox="0 0 1390 212">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#006169"/><stop offset="1" stop-color="#0b8a7f"/></linearGradient></defs>` +
      `<rect width="1390" height="212" fill="url(#g)"/>` +
      `<circle cx="${rtl ? 180 : 1210}" cy="-30" r="190" fill="#ffffff" fill-opacity="0.06"/>` +
      `<circle cx="${rtl ? 60 : 1330}" cy="230" r="120" fill="#ffffff" fill-opacity="0.05"/>` +
      `<g transform="translate(${rtl ? 1278 : 56} 70)"><path d="M30 0 L56 10 V34 C56 52 44 66 30 72 C16 66 4 52 4 34 V10 Z" fill="#ffffff" fill-opacity="0.18"/>` +
      `<path d="M18 36 L27 45 L43 27" stroke="#ffffff" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>` +
      `<text x="${x}" y="96" text-anchor="${anchor}" direction="${dir}" font-family="Figtree, Arial, sans-serif" font-size="40" font-weight="700" fill="#ffffff">${title}</text>` +
      `<text x="${x}" y="140" text-anchor="${anchor}" direction="${dir}" font-family="Figtree, Arial, sans-serif" font-size="20" fill="#d7f0ee">${sub}</text>` +
      `<rect x="${ctaX}" y="82" width="180" height="48" rx="24" fill="#ffffff"/>` +
      `<text x="${ctaX + 90}" y="113" text-anchor="middle" direction="${dir}" font-family="Figtree, Arial, sans-serif" font-size="18" font-weight="700" fill="#006169">${cta}</text>` +
      `</svg>`)}`;
  };
  const BANNERS = [{
    id: 31,
    title: 'Introducing TruCheck™',
    priority: 1,
    expires_at: null,
    url: 'https://www.bayut.sa/trucheck/',
    desktop_en: { full: bannerSvg('ltr', 'Introducing TruCheck™', 'Verified listings earn more trust, more views and more leads', 'Learn more') },
    desktop_ar: { full: bannerSvg('rtl', 'نقدّم لكم تروتشيك™', 'الإعلانات الموثّقة تكسب ثقة أكبر ومشاهدات وعملاء أكثر', 'اعرف المزيد') },
  }];

  /* ── users/:id ──────────────────────────────────────────────────────────── */
  const { _avatar, ...base } = U;
  const PROFILE = {
    ...base,
    phone: null,
    mobile: U.mobile,
    whatsapp: U.mobile,
    address: ADDRESS,
    profile_image: null,                                  /* see the top of this file */
    is_auto_utilization_enabled: false,
    is_verified: null,
    role: 'owner',
    quotas: { bayut: null },
    credits: CREDITS,
    settings: SETTINGS,
    is_listing_posted: true,
    status: ACTIVE,
    disposition: ACTIVE,
    platform_mapping: mapping(U.platform_mapping.bayut.external_id),
    /* the real users/:id carries only these four agency keys */
    agency: { id: AGENCY.id, name: AGENCY.name, name_l1: AGENCY.name_l1, is_verified: false },
    social_logged_in: false,
    password_updated: true,
    languages: [lang('English'), lang('Arabic')],
    experience: EXPERIENCE[1],
    area_unit: { setting_id: 5, name: 'area_unit', value: 'square_meter' },
    is_saudi_national: true,
    contract_grace_period_ends_at: null,
    /* score and classification stay users/current's (the header ring and the
       completeness card read them there); applicable false is what
       users/current implies by not sending it — no dashboard banner */
    profile_completion: {
      applicable: false,
      title: 'Complete your profile to reach more buyers and tenants on Bayut',
      title_l1: 'أكمل ملفك الشخصي للوصول إلى عملاء أكثر',
      message: null, message_l1: null,
      classification: U.profile_completion.classification,
      score: U.profile_completion.score,
    },
    service_areas: SERVICE_AREAS,
    unified: true,                                        /* = users/current's undefined (utility/user.js:38) */
    description: DESCRIPTION,
    description_l1: DESCRIPTION_L1,
    gender: { id: 1, slug: 'male', name: 'Male', name_l1: null },
    external_id: String(U.platform_mapping.bayut.external_id),
    package: {
      id: 14, total_credits: pool.allocated, duration_in_months: PKG.duration_in_months,
      total_amount: '165000.0', net_amount: `${PKG.net_amount}.0`,
      name: `${PKG.name} Yearly`, slug: PKG.slug,
      created_at: '2024-01-09T08:30:00.000+03:00', updated_at: '2025-11-02T14:12:09.000+03:00',
      platform_id: 1, name_l1: PKG.name_l1, external_name: PKG.name, external_id: 1014, is_active: true,
      description: null,
      additional_info: {
        options: {
          hot_listing:                 { name: 'Hot Listings',              order: 2, value: '100 / mo', name_l1: 'إعلانات مميزة',        value_l1: '100 شهرياً' },
          photography:                 { name: 'Professional Photography',  order: 5, value: 'Included', name_l1: 'تصوير احترافي',         value_l1: 'متضمن' },
          videography:                 { name: 'Professional Videography',  order: 6, value: '4 shoots / year', name_l1: 'تصوير فيديو احترافي', value_l1: '4 جلسات سنوياً' },
          basic_listing:               { name: 'Basic Listings',            order: 1, value: 'Unlimited', name_l1: 'إعلانات أساسية',      value_l1: 'غير محدود' },
          signature_listing:           { name: 'Signature Listings',        order: 3, value: '50 / mo', name_l1: 'إعلانات سيغنتشر',       value_l1: '50 شهرياً' },
          featured_tag_for_agency:     { name: 'Featured tag for the agency', order: 7, value: 'Yes', name_l1: 'شارة مميزة للوكالة', value_l1: 'نعم' },
          dedicated_account_manager:   { name: 'Dedicated account manager', order: 8, value: 'Yes', name_l1: 'مدير حساب مخصص',        value_l1: 'نعم' },
          credit_allocation_to_staff:  { name: 'Credit allocation to staff', order: 4, value: 'Yes', name_l1: 'توزيع الرصيد على الموظفين', value_l1: 'نعم' },
          listing_collection_by_bayut: { name: 'Listing collection by Bayut', order: 9, value: 'Yes', name_l1: 'جمع الإعلانات من بيوت', value_l1: 'نعم' },
        },
        discount: 10,
      },
      priority: 6, is_multi_platform: false, app_description: null, user_ids: null, is_test: false,
      package_type: 'package', bundle_category: null,
    },
    national_short_address: SHORT_ADDRESS,
    score: 0,
    rank: 0,
    active_listings_count: page.listings.active,
    is_call_tracking_enabled: true,
    is_whatsapp_tracking_enabled: true,
    is_tru_broker: false,
    is_quality_lister: true,                              /* user.json: quality_lister 'high' */
    is_super_lister: false,
    is_responsive_broker: false,
    is_daily_rental_redirection_enabled: false,
    nudges: [],
    is_rega_verified: U.is_rega_verified,
    tru_broker_start_date: '2025-02-01T00:00:00.000+03:00',
    domain_name: 'www.bayut.sa',
    /* the Title fields render disabled on the real account (profileFields.js:160) */
    name_editable: false,
    tru_broker_streak: 0,
    license: U.license,
  };

  /* ── agencies/:id ─────────────────────────────────────────────────────── */

  /* the owner first (appUsers, the LMS Users filter and the staff table all
     keep this order), then three agents. The filter only renders with more
     than one user (common/filters/leads-staff-filters.js:138). Every listing
     in this account is posted by the owner and every credit it consumed was
     his, so the agents have a credit limit and nothing used yet. */
  const member = ({ id, name, name_l1, email, mobile, role = 'agent', credits, listings = 0, whatsapp = null }) => ({
    id, name, name_l1, phone: null, mobile, whatsapp, email, address: null,
    profile_image: null,                                  /* none of them has a photo either */
    is_email_verified: true, is_mobile_verified: true, is_verified: null,
    role, credit_user: true, status: ACTIVE, disposition: ACTIVE,
    platform_mapping: mapping(id),
    experience_list: EXPERIENCE,
    user_profiles: [],
    location: { id: null, name: null },
    score: 0, rank: null, active_listings_count: listings,
    is_call_tracking_enabled: true, is_whatsapp_tracking_enabled: true,
    is_tru_broker: false, is_quality_lister: role === 'owner', is_super_lister: false,
    is_responsive_broker: false, is_daily_rental_redirection_enabled: false,
    credits, tru_broker_streak: 0, name_editable: false, quotas: { bayut: null },
  });
  const USERS = [
    member({ id: U.id, name: U.name, name_l1: U.name_l1, email: U.email, mobile: U.mobile, whatsapp: U.mobile,
             role: 'owner', credits: CREDITS, listings: page.listings.active }),
    member({ id: 88010241, name: 'Noura Al-Qahtani',   name_l1: 'نورة القحطاني',   email: 'noura@najdhorizon.example',
             mobile: '+966503418826', credits: { bayut: credit(10000, 0) } }),
    member({ id: 88010257, name: 'Abdullah Al-Otaibi', name_l1: 'عبدالله العتيبي', email: 'abdullah@najdhorizon.example',
             mobile: '+966541209375', credits: { bayut: credit(5000, 0) } }),
    member({ id: 88010263, name: 'Reem Al-Shehri',     name_l1: 'ريم الشهري',       email: 'reem@najdhorizon.example',
             mobile: '+966558837140', credits: { bayut: credit(3000, 0) } }),
  ];

  const AGENCY_BODY = {
    agency: {
      ...AGENCY,                                          /* keeps platform_mapping's bayut + ksa keys */
      id: AGENCY.id,
      status: ACTIVE,
      disposition: { id: 3, name: 'Live', name_l1: 'منشور', slug: 'live' },
      flag: 'A',
      creator_id: U.id,
      name: AGENCY.name,
      name_l1: AGENCY.name_l1,
      address: ADDRESS,
      national_short_address: SHORT_ADDRESS,
      city: AGENCY.city,
      location: null,
      description: 'Residential brokerage serving Riyadh.',
      description_l1: 'نجد هورايزن للعقارات مكتب وساطة عقارية في الرياض يقدّم خدمات البيع والتأجير للعقارات السكنية، ويعمل فريقه المرخّص من الهيئة العامة للعقار على تسويق الشقق والفلل في شمال الرياض وشرقها.',
      phone: null,
      mobile: '+966555880042',
      /* read through loginUser.agency (the router merges this answer into it,
         apis/agency.js:16) — the email line under the name in AgencyInfoCard */
      email: 'info@najdhorizon.example',
      website: 'www.najdhorizon.example',
      entity_type: 'Commercial',
      logo: LOGO,
      created_at: '2021-04-18T10:22:31.000+03:00',
      whatsapp: null,
      enable_whatsapp_leads: false,
      users: USERS,
      use_agency_whatsapp: null,
      agency_type: 'standard',
      /* null, as on the real account — 'Agency Broker' would add the
         Commercial Registration field (bayut/data/agencySettingsFields.js:28) */
      broker_type: null,
      quotas: { bayut: null },
      credits: { bayut: credit(pool.allocated, pool.used), dubizzle: credit(0, 0) },
      /* verified and present: the Phone Number field renders disabled, as on
         the real account (agencySettingsFields.js:52) */
      is_mobile_verified: true,
      is_email_verified: true,
      addresses: [],
      deals_in: 'sale',
      authorized: null,
      social_links: null,
      dealing_cities: [],
      owner: { name: U.name, designation: null, message: null, profile_image: null },
    },
  };

  /* COMPLETE BY DEFAULT, as the real account is (score 100: no completeness
     card on the settings pages, a full ring in the header —
     profile-completion.js:59/119). The 90% account, with its card and its
     part-filled ring, is the 'incomplete' mode, which the settings pages'
     interaction files capture as a state of their own. */
  const completion = (u, mode) => mode === 'incomplete' ? u
    : { ...u, profile_completion: { ...u.profile_completion, score: 100 } };
  return [
    [/^\/api\/surge\/users\/current$/, (search, mode) => (mode === 'member'
      ? { ...memberUser, user: { ...completion(CURRENT, mode), is_package_user: false } }
      : { ...user, user: completion(CURRENT, mode), banners: BANNERS })],
    [/^\/api\/surge\/users\/\d+$/, (search, mode) => ({ user: completion(PROFILE, mode) })],
    [/^\/api\/surge\/agencies\/\d+$/, () => AGENCY_BODY],
    [/^\/api\/surge\/languages$/, () => ({ languages: LANGUAGES })],
    [/^\/api\/surge\/experience_list$/, () => ({ experience: EXPERIENCE })],
    [/^\/api\/surge\/area_units$/, () => ({ area_units: AREA_UNITS })],
  ];
};
