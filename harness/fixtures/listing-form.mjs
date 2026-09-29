/**
 * Area module: the listing form and its flow: /post-listing/:id, /post-listing/:id/upgrade, /post-ad/:id.
 * Consulted BEFORE the other areas (harness/fixtures.mjs answer()), so it
 * must answer only endpoints no other area answers — or answer them only in
 * a mode of its own — or it changes pages it does not own.
 *
 *   export default (h) => [[RegExp, (search, mode, pathname, method) => body], …]
 *
 * WHAT IT ANSWERS, and why nobody else is touched
 *
 *   listing_categories, features              nobody else asks; without them
 *                                              the form is "Form configuration
 *                                              is not available." and nothing else
 *   listings/new_listing_data, listings/new    the licence step (post-listing)
 *   listings/:id/edit, PUT listings/:id,       ONLY for the drafts this module
 *   PUT listings/:id/apply_products            creates (DRAFTS below) — each
 *                                              pattern names their ids, so
 *                                              88240117 and every other row
 *                                              stay listings.mjs's
 *   products/applicable_products               the drafts only; any other
 *                                              listing passes through to
 *                                              fixtures.mjs ROUTES unchanged
 *   POST listings/generate_content             Generate Title / Description
 *   attachments/presigned_urls                 only in lf-upload-fail — the
 *                                              upload handshake is forms.mjs's
 *
 * Not here, because another area answers them: otps (the licence OTP's send
 * — listings.mjs) and otps/verify (forms.mjs, whose FAIL mode is the
 * refusal), and the upload handshake itself (forms.mjs).
 *
 * MODES of its own (all 'lf-…', so no other area reacts to them):
 *
 *   lf-posted       a draft of this module answers as it does AFTER it was
 *                   posted (status pending / ad-in-review, basic listing
 *                   applied). harness/interactions/post-listing-*.mjs switch to
 *                   it mid-state, when the product has sent the PUT — the
 *                   backend's listing changes there, and a stateless fixture
 *                   has no other way to say so.
 *   lf-fail         every write answers the API's refusal envelope
 *   (and form-fail)  ({ success: false, errors: [...] }). The HTTP STATUS is not
 *                   a fixture's to set (harness/page.mjs fulfils 200): the
 *                   failure states wrap their submit in forms.mjs failing(),
 *                   which answers in 'form-fail' and sends a refusal out as 422.
 *   lf-upload-fail  the presigned upload URL points off the machine, so the
 *                   harness blocks the upload and the product marks the image
 *                   failed — its own error state, no override needed.
 *   lf-low-credits  the upgrade page's own credits block reports 1 credit, so
 *                   the product draws "Insufficient Credits" and its top-up line.
 *   lf-nafath       the posted listing comes back pending Nafath verification
 *                   (the product's NafathVerificationModal).
 *
 * ── what the form asks for ────────────────────────────────────────────────
 * The KSA form's FIELDS are static (tenant/bayut/data/listingCategories/ksa —
 * "Never fall back to /api/surge/dynamic_fields for bayut flows"); what comes
 * over the wire is the category tree and the amenities.
 *
 *   GET /api/surge/listing_categories      → { listing_categories: [...] }
 *       surgePostListingEndpoints.js:95. The tree is the one the form's own
 *       helpers are written against (helpers/post-listing/property-type-
 *       options.js): a purpose row per purpose (parent_id null), leaf types
 *       whose parent IS the purpose ("plain leaf types whose parent is the
 *       purpose itself (e.g. Apartment, Villa)"), and the two grouping nodes
 *       Land (42) and Building (43) under the purpose with their sub-types
 *       under them. A row's breadcrumbs run from its purpose to itself — the
 *       real listing_category carries two (data/api-shapes.json, "×2") and
 *       starts "Property for Rent" (17 characters). external_id is Bayut
 *       KSA's property-type id, the key bayut/data/listing-form-data.js's
 *       field rules are written against. Row ids follow the listings area
 *       (100 + external id for sale, 150 + for rent — listings.mjs
 *       `category`), so every listing's category is in the tree.
 *   GET /api/surge/features?source_id=<category id>   → { features: [...] }
 *       surgePostListingEndpoints.js:103; each option's dynamic_section is a
 *       group heading in the amenities modal (transformers/listings.js
 *       dynamicFieldsToFeaturesModalData).
 *
 * ── the drafts: listings this module creates ──────────────────────────────
 * A KSA listing starts from a REGA advertising licence: the licence step asks
 * new_listing_data whether the licence can be used as it is (the agent holds
 * a FAL licence → `license_number`) or needs the advertiser's National ID /
 * CR number (`show_nafaz_id`), then GET listings/new creates the DRAFT and
 * the product navigates to /post-listing/<its id> (post-listing-with-
 * options.js postNewListings). The drafts are keyed by licence, the way the
 * real API resolves them; each one is REGA's own answer for that licence
 * (under dynamic_fields.rega_details, as listings.mjs records it) plus what
 * the agent has not filled in yet — no images, no title, no description.
 * Option values come from the product's own option catalogue (the static
 * dynamic_field_options in listingCategories/ksa/shared/*.json — beds 3 is
 * id 194, "Open to all" is 246), so the form finds the chip it has to tick.
 */
/* a cycle (fixtures.mjs imports this file), used only inside a handler — by
   then both modules have finished loading (credits.mjs does the same) */
import { answer } from '../fixtures.mjs';

export default (h) => {
  const { U, AGENCY, day, iso } = h;

  /* ── the category tree ─────────────────────────────────────────────────── */
  const PURPOSES = [
    { id: 1, slug: 'sale', name: 'Sale', name_l1: 'بيع', crumb: 'Property for Sale', crumb_l1: 'عقار للبيع', at: 100 },
    { id: 2, slug: 'rent', name: 'Rent', name_l1: 'إيجار', crumb: 'Property for Rent', crumb_l1: 'عقار للإيجار', at: 150 },
    { id: 4, slug: 'daily-rental', name: 'Daily Rental', name_l1: 'إيجار يومي', crumb: 'Property for Daily Rental', crumb_l1: 'عقار للإيجار اليومي', at: 200 },
  ];
  /* external id · slug · name · name_l1 · residential? · group (42 Land / 43 Building) · purposes.
     The names are the ones helpers/propertyTypeHelpers.js draws an icon for. */
  const TYPES = [
    [3, 'apartment', 'Apartment', 'شقة', true, null, ['sale', 'rent', 'daily-rental']],
    [4, 'villa', 'Villa', 'فيلا', true, null, ['sale', 'rent', 'daily-rental']],
    [6, 'floor', 'Floor', 'دور', true, null, ['sale', 'rent']],
    [46, 'townhouse', 'Townhouse', 'تاون هاوس', true, null, ['sale', 'rent']],
    [43, 'building', 'Building', 'عمارة', true, null, ['sale', 'rent']],
    [8, 'residential-building', 'Residential Building', 'عمارة سكنية', true, 43, ['sale', 'rent']],
    [17, 'commercial-building', 'Commercial Building', 'عمارة تجارية', false, 43, ['sale', 'rent']],
    [42, 'land', 'Land', 'أرض', true, null, ['sale', 'rent']],
    [9, 'residential-land', 'Residential Land', 'أرض سكنية', true, 42, ['sale', 'rent']],
    [19, 'commercial-land', 'Commercial Land', 'أرض تجارية', false, 42, ['sale', 'rent']],
    [20, 'industrial-land', 'Industrial Land', 'أرض صناعية', false, 42, ['sale', 'rent']],
    [11, 'rest-house', 'Rest House', 'استراحة', true, null, ['sale', 'rent', 'daily-rental']],
    [12, 'chalet', 'Chalet', 'شاليه', true, null, ['sale', 'rent', 'daily-rental']],
    [14, 'office', 'Office', 'مكتب', false, null, ['sale', 'rent']],
    [15, 'shop', 'Shop', 'محل', false, null, ['sale', 'rent']],
    [16, 'showroom', 'Showrooms', 'معرض', false, null, ['sale', 'rent']],
    [18, 'warehouse', 'Warehouse', 'مستودع', false, null, ['sale', 'rent']],
  ];
  const RESIDENTIAL = { id: 1, name: 'Residential', slug: 'residential', name_l1: 'سكني', display_order: 1, secondary_display_order: 1 };
  const COMMERCIAL = { id: 2, name: 'Commercial', slug: 'commercial', name_l1: 'تجاري', display_order: 2, secondary_display_order: 2 };
  const purposeHash = (P) => ({ id: P.id, name: P.name, slug: P.slug, name_l1: P.name_l1 });
  const crumb = (P) => ({ id: P.id, name: P.crumb, level: 1, name_l1: P.crumb_l1 });

  const CATEGORIES = [];
  for (const P of PURPOSES) {
    CATEGORIES.push({
      id: P.id, name: P.crumb, slug: `property-for-${P.slug}`, level: 1, name_l1: P.crumb_l1,
      purpose: P.name, logo_url: null, parent_id: null, purpose_l1: P.name_l1, breadcrumbs: [crumb(P)],
      external_id: null, name_plural: '', purpose_hash: purposeHash(P), allow_posting: false,
      display_order: P.id, name_plural_l1: '', dynamic_section: null, classification_scope: [1, 2],
    });
    const idOf = (ext) => P.at + ext;
    TYPES.forEach(([ext, slug, name, name_l1, residential, group, purposes], k) => {
      if (!purposes.includes(P.slug)) return;
      const groupRow = group ? TYPES.find((t) => t[0] === group) : null;
      const self = { id: idOf(ext), name, level: group ? 3 : 2, name_l1 };
      CATEGORIES.push({
        id: idOf(ext), name, slug, level: self.level, name_l1,
        purpose: P.name, logo_url: null, parent_id: group ? idOf(group) : P.id, purpose_l1: P.name_l1,
        breadcrumbs: [crumb(P), ...(group ? [{ id: idOf(group), name: groupRow[2], level: 2, name_l1: groupRow[3] }] : []), self],
        external_id: String(ext), name_plural: '', purpose_hash: purposeHash(P),
        allow_posting: true, display_order: k + 1, name_plural_l1: '',
        dynamic_section: residential ? RESIDENTIAL : COMMERCIAL, classification_scope: [1, 2],
      });
    });
  }
  const categoryOf = (purposeSlug, ext) => CATEGORIES.find((c) => c.purpose_hash.slug === purposeSlug && c.external_id === String(ext));
  const categoryById = (id) => CATEGORIES.find((c) => String(c.id) === String(id));

  /* ── amenities ─────────────────────────────────────────────────────────────
     The ids and the Main Features section are the listings area's own
     (listings.mjs `feature` — electricity 201 … lawn-or-garden 212), so a
     listing's saved features tick the right boxes. */
  const SECTIONS = {
    main: { id: 31, name: 'Main Features', slug: 'main-features', name_l1: 'الميزات الرئيسية', display_order: 1, secondary_display_order: 1 },
    rooms: { id: 32, name: 'Rooms', slug: 'rooms', name_l1: 'الغرف', display_order: 2, secondary_display_order: 2 },
    building: { id: 33, name: 'Building and Services', slug: 'building-and-services', name_l1: 'المبنى والخدمات', display_order: 3, secondary_display_order: 3 },
    outdoor: { id: 34, name: 'Outdoor', slug: 'outdoor', name_l1: 'المساحات الخارجية', display_order: 4, secondary_display_order: 4 },
  };
  /* id · slug · label · label_l1 · section · format · value (a select's choices) */
  const FEATURES = [
    [201, 'electricity', 'Electricity', 'كهرباء', 'main', 'checkbox'],
    [202, 'water-supply', 'Water Supply', 'مياه', 'main', 'checkbox'],
    [203, 'sewerage', 'Sewerage', 'صرف صحي', 'main', 'checkbox'],
    [205, 'central-air-conditioning', 'Central Air Conditioning', 'تكييف مركزي', 'main', 'checkbox'],
    [206, 'fitted-kitchen', 'Fitted Kitchen', 'مطبخ راكب', 'main', 'checkbox'],
    [207, 'maids-room', 'Maid Room', 'غرفة خادمة', 'rooms', 'checkbox'],
    [208, 'drivers-room', 'Driver Room', 'غرفة سائق', 'rooms', 'checkbox'],
    [209, 'laundry-room', 'Laundry Room', 'غرفة غسيل', 'rooms', 'checkbox'],
    [210, 'majlis', 'Majlis', 'مجلس', 'rooms', 'checkbox'],
    [204, 'private-parking', 'Private Parking', 'موقف خاص', 'building', 'checkbox'],
    [211, 'elevator', 'Elevator', 'مصعد', 'building', 'checkbox'],
    [213, 'security', 'Security', 'حراسة أمنية', 'building', 'checkbox'],
    [214, 'parking-spaces', 'Parking Spaces', 'عدد المواقف', 'building', 'select', '1,2,3,4,5+'],
    [212, 'lawn-or-garden', 'Lawn or Garden', 'حديقة', 'outdoor', 'checkbox'],
    [215, 'swimming-pool', 'Swimming Pool', 'مسبح', 'outdoor', 'checkbox'],
    [216, 'rooftop', 'Roof', 'سطح', 'outdoor', 'checkbox'],
  ];
  const featureOption = ([id, slug, label, label_l1, section, format, value], k) => ({
    id, label, label_l1, value: value ?? null, value_l1: value ?? null, slug, format_type: format,
    dynamic_section: SECTIONS[section], display_order: k + 1, secondary_display_order: k + 1,
  });
  /* land has no rooms, building or outdoor: its utilities only */
  const featuresFor = (sourceId) => {
    const ext = Number(categoryById(sourceId)?.external_id);
    const land = [42, 9, 19, 20].includes(ext);
    return FEATURES.map(featureOption).filter((f) => !land || (f.dynamic_section.id === SECTIONS.main.id && f.id <= 203));
  };
  /* a saved feature, the way a listing carries it (listings.mjs `feature`) */
  const savedFeature = (id) => {
    const f = featureOption(FEATURES.find((x) => x[0] === id), 0);
    return { id: f.id, slug: f.slug, label: f.label, value: 'Yes', label_l1: f.label_l1, value_l1: 'نعم', format_type: 'checkbox', dynamic_section: f.dynamic_section };
  };

  /* ── the product's option catalogue (listingCategories/ksa/shared) ─────────
     Surge's own dynamic_field_options, one catalogue per purpose — the sale
     form's (dynamicFieldsResponse.json) and the rent form's
     (rentDynamicFieldsResponse.json) number the same choice differently */
  const opt = (id, slug, label, label_l1, value = label, value_l1 = null) => ({ id, slug, label, value, label_l1, value_l1 });
  const CATALOGUE = {
    sale: {
      beds: { 1: 192, 2: 193, 3: 194, 4: 195, 5: 196, 6: 197 }, baths: { 1: 204, 2: 205, 3: 206, 4: 207, 5: 208, 6: 209 },
      furnished: { yes: 243, no: 244 }, residence: { family: 245, 'open-to-all': 246, singles: 247 },
      face: { northern: 234, eastern: 242, western: 233 }, age: { new: 219, '3-years': 223 },
      area_unit: 215, ready: 250, initial_sale: 248, rega_data: 310,
    },
    rent: {
      beds: { 1: 4163, 2: 4164, 3: 4165, 4: 4166, 5: 4167, 6: 4168 }, baths: { 1: 4175, 2: 4176, 3: 4177, 4: 4178, 5: 4179, 6: 4180 },
      furnished: { yes: 4214, no: 4215 }, residence: { family: 4220, 'open-to-all': 4221, singles: 4222 },
      face: { northern: 4205, eastern: 4213, western: 4204 }, age: { new: 4190, '3-years': 4194 },
      area_unit: 4186, ready: 4225, initial_sale: 4223, rega_data: 4231, yearly: 4219,
    },
  };
  const FACE = { northern: ['Northern', 'شمالية'], eastern: ['Eastern', 'شرقية'], western: ['Western', 'غربية'] };
  const AGE = { new: ['New', 'جديد'], '3-years': ['3 years', 'ثلاث سنوات'] };
  const RESIDENCE = { family: ['Family', 'عائلات'], 'open-to-all': ['Open to all', 'متاح للجميع'], singles: ['Singles', 'عزاب'] };
  const n = (c, key, v) => opt(c[key][v], String(v), String(v), String(v), String(v), String(v));

  /* ── the drafts, keyed by licence ──────────────────────────────────────────
     path: how the licence step resolves it —
       fal    the agent's own FAL licence covers it: new_listing_data answers
              license_number, the listing is created at once, then the FAL OTP
              (ENABLE_FAL_LICENSE_OTP_VERIFICATION) goes to the licence holder
       nid    an individual owner's licence: the advertiser's National ID first
       cr     a company's licence: its Commercial Registration number first
       magic  prepared for the agent and opened from a Magic Post Ad link
              (/post-ad/:id) — no licence step on this machine */
  const ADS = [
    { licence: '7201352264', id: 88241126, path: 'fal', ext: 3, purpose: 'sale', city: 'Riyadh', zone: 'North Riyadh', district: 'Al Narjis', geo: [24.842716, 46.635804], size: 165, beds: 3, price: 1150000, face: 'northern', age: 'new', plan: '2374', land: '118/3', street: 18, postal: '13327', building: '7481', additional: '2915' },
    { licence: '7201352296', id: 88241127, path: 'magic', ext: 3, purpose: 'rent', city: 'Riyadh', zone: 'North Riyadh', district: 'Al Aqiq', geo: [24.770418, 46.628370], size: 140, beds: 2, baths: 2, price: 65000, face: 'eastern', age: '3-years', plan: '1932', land: '44/7', street: 15, postal: '13515', building: '3342', additional: '6107', furnished: 'no', features: [201, 202, 203, 205, 211] },
    { licence: '7101352271', id: 88241128, path: 'nid', ext: 4, purpose: 'sale', city: 'Riyadh', zone: 'North Riyadh', district: 'Al Malqa', geo: [24.812944, 46.603447], size: 400, beds: 5, price: 3450000, face: 'western', age: 'new', plan: '2951', land: '306/12', street: 20, postal: '13524', building: '8120', additional: '4471' },
    { licence: '7201352289', id: 88241129, path: 'cr', ext: 6, purpose: 'rent', city: 'Jeddah', zone: 'North Jeddah', district: 'Al Rawdah', geo: [21.566873, 39.154532], size: 210, beds: 4, price: 85000, face: 'northern', age: '3-years', plan: '613', land: '27/4', street: 16, postal: '23435', building: '2715', additional: '8834' },
  ];
  const AR = {
    Riyadh: 'الرياض', Jeddah: 'جدة', 'North Riyadh': 'شمال الرياض', 'North Jeddah': 'شمال جدة',
    'Al Narjis': 'النرجس', 'Al Aqiq': 'العقيق', 'Al Malqa': 'الملقا', 'Al Rawdah': 'الروضة',
  };
  const REGION = { Riyadh: 'منطقة الرياض', Jeddah: 'منطقة مكة المكرمة' };          /* REGA writes the region in Arabic only (12 characters for Riyadh — data/api-shapes.json) */
  const TYPE_AR = { 3: 'شقة', 4: 'فيلا', 6: 'دور' };
  const TYPE_EN = { 3: 'Apartment', 4: 'Villa', 6: 'Floor' };
  const byLicence = (n) => ADS.find((a) => a.licence === String(n));
  const byId = (id) => ADS.find((a) => a.id === Number(id));
  const IDS = ADS.map((a) => a.id).join('|');

  /* the same small stable ids the listings area derives from a name (listings.mjs `hid`) */
  const hid = (s, at) => at + [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 8999, 17);
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  /* Surge stamps in Riyadh time, 29 characters: 2026-09-29T10:15:30.123+03:00 */
  const stamp = (d, k = 0) => `${iso(d)}T${pad(9 + (k % 8))}:${pad((k * 7 + 4) % 60)}:${pad((k * 13 + 9) % 60)}.${pad((k * 37 + 120) % 1000, 3)}+03:00`;
  const localMobile = `0${U.mobile.replace(/^\+966/, '')}`;
  const USER_UUID = '3f6c9e2a-4b7d-4e1a-9c5f-000088010234';                     /* listings.mjs's */

  const STATUS = {
    draft: { id: 2, name: 'Draft', slug: 'draft', name_l1: 'مسودة' },
    pending: { id: 3, name: 'Pending', slug: 'pending', name_l1: 'معلقة' },
  };
  const DISPOSITION = {
    'not-posted': { id: 2, name: 'Not Posted', slug: 'not-posted', name_l1: 'غير منشور', description: null, description_l1: null },
    'ad-in-review': { id: 3, name: 'Ad In Review', slug: 'ad-in-review', name_l1: 'الإعلان قيد المراجعة', description: null, description_l1: null },
    'pending-nafaz-verification': { id: 21, name: 'Pending Nafath Verification', slug: 'pending-nafaz-verification', name_l1: 'بانتظار التحقق عبر نفاذ', description: null, description_l1: null },
  };
  const PRODUCT = {
    'basic-listing': { id: 1, title: 'Basic Listing', title_l1: 'الإعلان الأساسي', cost: 2, add_on: false, description: 'Get standard visibility and leads', description_l1: 'احصل على ظهور قياسي وعملاء محتملين' },
    'hot-listing': { id: 2, title: 'Hot Listing', title_l1: 'الإعلان المميز', cost: 5, add_on: false, description: 'Get enhanced visibility and leads', description_l1: 'احصل على ظهور أعلى وعملاء محتملين أكثر', recommended: true },
    'signature-listing': { id: 3, title: 'Signature Listing', title_l1: 'إعلان سيغنتشر', cost: 10, add_on: false, description: 'Get maximum visibility and leads', description_l1: 'احصل على أعلى ظهور وأكبر عدد من العملاء المحتملين' },
    refresh: { id: 4, title: 'Refresh', title_l1: 'تحديث الإعلان', cost: 1, add_on: false, description: 'Place your property at the top', description_l1: 'ضع عقارك في المقدمة' },
    'photography-service': { id: 5, title: 'Photography Service', title_l1: 'خدمة التصوير', cost: 3, add_on: true, description: 'Property photos by Bayut’s professionals', description_l1: 'صور احترافية لعقارك من فريق بيوت' },
    'videography-service': { id: 6, title: 'Videography Service', title_l1: 'خدمة تصوير الفيديو', cost: 4, add_on: true, description: 'Professional property videography by Bayut\'s experts', description_l1: 'تصوير فيديو احترافي لعقارك من خبراء بيوت' },
    'drone-footage-service': { id: 8, title: 'Drone Footage Service', title_l1: 'خدمة التصوير الجوي', cost: 6, add_on: true, description: 'Aerial footage of your property and its surroundings', description_l1: 'تصوير جوي لعقارك ومحيطه' },
  };
  /* the ids and costs are credits.mjs's PRODUCTS (and the upgrade modal's), so
     the pages agree on what an upgrade costs; a credit is SAR 100 */
  const CREDIT_UNIT_PRICE = 100;

  /* REGA's own answer for a licence — raw (camelCase, Arabic) under
     dynamic_fields.rega_details.advertisement, and as Surge maps it (snake
     case) under platform_listings[].rega_info — the listings area's shapes */
  const rega = (ad) => {
    const rent = ad.purpose !== 'sale';
    const [lat, lng] = ad.geo;
    const start = iso(day(1)), end = iso(day(-364));
    const deed = `31${ad.licence.slice(-6)}${ad.plan.slice(-2)}17`.slice(0, 12);
    const url = `https://rega.gov.sa/rega-services/ads/license-verification?adLicenseNumber=${ad.licence}&idType=1`;
    const employee = `${U.name_l1} - ${AGENCY.name_l1}`.slice(0, 30);
    const onDeed = `حي ${AR[ad.district]} - مخطط ${ad.plan}`;
    const borders = {
      north: ['شارع', `شارع عرض ${ad.street} متر`, '20 متر طولي'],
      south: ['جار', 'قطعة', '20 متر طولي'],
      east: ['شارع', 'شارع 15م', '15 متر طولي'],
      west: ['قطعة', `قطعة رقم ${ad.land.split('/')[0]}`, '15 متر طولي'],
    };
    const details = {
      url,
      borders: {
        east_limit_name: borders.east[0], west_limit_name: borders.west[0], north_limit_name: borders.north[0], south_limit_name: borders.south[0],
        east_limit_description: borders.east[1], east_limit_length_char: borders.east[2],
        west_limit_description: borders.west[1], west_limit_length_char: borders.west[2],
        north_limit_description: borders.north[1], north_limit_length_char: borders.north[2],
        south_limit_description: borders.south[1], south_limit_length_char: borders.south[2],
      },
      location: {
        city: ad.city, region: REGION[ad.city], city_l1: AR[ad.city], district: ad.district,
        latitude: String(lat), longitude: String(lng), district_l1: AR[ad.district],
        postal_code: ad.postal, street_name: String(ad.street), building_number: ad.building, additional_number: ad.additional,
      },
      utilities: { Sewerage: true, Electricity: true, 'Water Supply': true },
      seller_info: { name: U.name, email: U.email },
      license_info: { end_date: end, start_date: start, ad_license_number: ad.licence, fal_license_number: ad.path === 'fal' ? U.license.number : null },
      utilities_l1: { 'مياه': true, 'كهرباء': true, 'صرف صحي': true },
      property_specs: {
        price: ad.price, area_size: ad.size, listing_type: TYPE_EN[ad.ext], listing_usages: [], listing_type_l1: TYPE_AR[ad.ext],
        number_of_rooms: ad.beds, listing_usages_l1: [], advertisement_type: rent ? 'For Rent' : 'For Sale', advertisement_type_l1: rent ? 'للإيجار' : 'للبيع',
      },
      additional_info: {
        notes: null, channels: ['Licensed Platform'], channels_l1: ['منصة مرخصة'], deed_number: deed,
        land_number: ad.land, listing_age: AGE[ad.age][0], plan_number: ad.plan, rer_borders: [],
        listing_face: FACE[ad.face][0], street_width: ad.street, listing_age_l1: AGE[ad.age][1], land_total_rent: null,
        listing_face_l1: FACE[ad.face][1], rer_constraints: null, is_listing_pawned: false, borders_and_lengths: null,
        is_listing_constrained: false, obligations_on_listing: 'لا يوجد', guarantees_and_duration: '',
        responsible_employee_name: employee, location_description_on_moj_deed: onDeed,
        responsible_employee_phone_number: localMobile, compliance_with_saudi_building_code: null,
      },
    };
    const advertisement = {
      notes: null,
      borders: {
        eastLimitName: borders.east[0], westLimitName: borders.west[0], northLimitName: borders.north[0], southLimitName: borders.south[0],
        eastLimitLengthChar: borders.east[2], westLimitLengthChar: borders.west[2], eastLimitDescription: borders.east[1],
        northLimitLengthChar: borders.north[2], southLimitLengthChar: borders.south[2], westLimitDescription: borders.west[1],
        northLimitDescription: borders.north[1], southLimitDescription: borders.south[1],
      },
      endDate: end, adSource: 'REGA', channels: ['منصة مرخصة'], isHalted: false, isPawned: false,
      location: {
        city: AR[ad.city], cityId: `c1d2${String(hid(ad.city, 0)).padStart(4, '0')}-5e6f-4a7b-8c9d-0e1f2a3b4c5d`, region: REGION[ad.city], street: String(ad.street),
        cityCode: String(21000 + (hid(ad.city, 0) % 900)), district: AR[ad.district], latitude: String(lat), regionId: `a0b1c2d3-e4f5-4a6b-8c7d-${pad(hid(ad.city, 0), 12)}`,
        longitude: String(lng), districtId: `d4e5${String(hid(ad.district, 0)).padStart(4, '0')}-6f7a-4b8c-9d0e-1f2a3b4c5d6e`, postalCode: ad.postal,
        regionCode: ad.city === 'Riyadh' ? '1' : '2', districtCode: String(1000 + (hid(ad.district, 0) % 9000)),
        buildingNumber: ad.building, additionalNumber: ad.additional,
      },
      deedNumber: deed, isTestment: false, landNumber: ad.land, planNumber: ad.plan, rerBorders: [],
      phoneNumber: localMobile, propertyAge: AGE[ad.age][1], streetWidth: ad.street, adLicenseUrl: url,
      advertiserId: ad.path === 'cr' ? '7010458823' : ad.path === 'nid' ? '1076543219' : '1098765432',
      creationDate: start, propertyArea: ad.size, propertyFace: FACE[ad.face][1], propertyType: TYPE_AR[ad.ext],
      isConstrained: false, numberOfRooms: ad.beds, propertyPrice: ad.price, advertiserName: U.name_l1,
      landTotalPrice: null, propertyUsages: [], rerConstraints: null, adLicenseNumber: ad.licence,
      redZoneTypeName: 'غير مصنفة', advertisementType: rent ? 'إيجار' : 'بيع',
      propertyUtilities: ['كهرباء', 'مياه', 'صرف صحي'], titleDeedTypeName: 'صك إلكتروني',
      landTotalAnnualRent: null, mainLandUseTypeName: 'سكني', responsibleEmployeeName: employee,
      obligationsOnTheProperty: 'لا يوجد', ownershipTransferFeeType: null, guaranteesAndTheirDuration: '',
      locationDescriptionOnMOJDeed: onDeed, responsibleEmployeePhoneNumber: localMobile,
      brokerageAndMarketingLicenseNumber: U.license.number, complianceWithTheSaudiBuildingCode: null,
    };
    return { details, advertisement, end, start };
  };

  /* the words a listing is written in — what Generate Title / Description
     (POST listings/generate_content) answers, and REGA's ai_data */
  const words = (ad) => {
    const rent = ad.purpose !== 'sale';
    const type = TYPE_EN[ad.ext];
    const titleEn = `${ad.beds} Bedroom ${type} for ${rent ? 'Rent' : 'Sale'} in ${ad.district}, ${ad.city}`;
    const titleAr = `${TYPE_AR[ad.ext]} ${rent ? 'للإيجار' : 'للبيع'} ${ad.beds} غرف نوم في ${AR[ad.district]}، ${AR[ad.city]}`;
    const descEn = [
      `${ad.size} sq. m. ${type.toLowerCase()} for ${rent ? 'rent' : 'sale'} in ${ad.district}, ${ad.zone}, with ${ad.beds} bedrooms, a family living room and a separate majlis.`,
      `It faces ${ad.face.replace(/ern$/, '')} on a street ${ad.street} m wide, with central air conditioning, a fitted kitchen and a covered parking space.`,
      `Close to schools, mosques and daily shopping, with quick access to the main roads of ${ad.city}. Contact ${AGENCY.name} to arrange a viewing.`,
    ].join('\n\n');
    const descAr = [
      `${TYPE_AR[ad.ext]} ${rent ? 'للإيجار' : 'للبيع'} بمساحة ${ad.size} متر مربع في حي ${AR[ad.district]}، ${AR[ad.zone] || AR[ad.city]}، تضم ${ad.beds} غرف نوم وصالة عائلية ومجلساً مستقلاً.`,
      `واجهة ${FACE[ad.face][1]} على شارع عرض ${ad.street} متر، مع تكييف مركزي ومطبخ راكب وموقف سيارة مظلل.`,
      `قريب من المدارس والمساجد والخدمات اليومية. تواصل مع ${AGENCY.name_l1} لترتيب موعد المعاينة.`,
    ].join('\n\n');
    return { titleEn, titleAr, descEn, descAr };
  };

  /* one draft, in the listings area's shape (listings.mjs toReal — the real
     API's, data/api-shapes.json), as the API answers /listings/:id/edit */
  const draft = (ad, { posted = false, nafath = false } = {}) => {
    const rent = ad.purpose !== 'sale';
    const P = PURPOSES.find((p) => p.slug === ad.purpose);
    const category = categoryOf(ad.purpose, ad.ext);
    const [lat, lng] = ad.geo;
    const { details, advertisement, end } = rega(ad);
    const W = words(ad);
    const created = day(0);
    const magic = ad.path === 'magic';
    /* the magic ad arrives written (its images, title and description came
       with the link); a licence draft has only what REGA knows until the
       agent writes it — and a posted one has been written: the six photos
       and the words the flow gives it (harness/interactions/post-listing-edit.mjs) */
    const written = magic || posted;
    const chain = ['KSA', ad.city, ad.zone, ad.district];
    const crumbs = chain.map((t, k) => ({ id: k === 0 ? 1 : hid(t, 100 * k), level: k + 1, title: t, title_l1: k === 0 ? 'السعودية' : AR[t] }));
    const location = {
      id: crumbs[3].id, slug: null, level: 5,
      loc_1: 1, loc_2: 2, loc_3: crumbs[1].id, loc_4: crumbs[2].id, loc_5: crumbs[3].id, loc_6: null, loc_7: null,
      title: ad.district, latitude: lat, title_l1: AR[ad.district], longitude: lng, breadcrumbs: crumbs, external_id: null,
    };
    const images = written ? Array.from({ length: magic ? 8 : 6 }, (_, k) => {
      const src = `/harness-img/${ad.id}-${k}.svg`;
      return { id: ad.id * 100 + k, main: k === 0 ? 1 : 0, uuid: `7a1c${pad(k, 4)}-2b3d-4e5f-8a9b-${String(ad.id).padStart(12, '0')}`, order: k,
        sizes: { full: src, large: src, small: src, medium: src, thumbnail: src }, status: 'on', is_unique: true, image_type: 'listing_image' };
    }) : [];
    /* REGA's utilities, ticked for the agent; a posted draft carries what the
       flow chose as well (bathrooms, floor, built-up area, residence type,
       the amenities — harness/interactions/post-listing-edit.mjs toSpecs,
       toAmenities) */
    const chose = posted && !magic;
    const features = (chose ? [201, 202, 203, 205, 206, 207, 210, 204, 211] : ad.features || [201, 202, 203]).map(savedFeature);
    if (chose) Object.assign(ad = { ...ad }, { baths: 3, furnished: 'no', residence: 'family', floor: 2, builtUp: 150 });
    if (magic) Object.assign(ad = { ...ad }, { residence: 'open-to-all' });
    const c = CATALOGUE[rent ? 'rent' : 'sale'];
    const df = {
      age: opt(c.age[ad.age], ad.age, AGE[ad.age][0], AGE[ad.age][1], AGE[ad.age][0], AGE[ad.age][1]),
      area: ad.size,
      beds: n(c, 'beds', ad.beds),
      /* REGA counts rooms, not bathrooms: a licence draft has none until the agent picks */
      ...(ad.baths && { baths: n(c, 'baths', ad.baths) }),
      face: opt(c.face[ad.face], ad.face, FACE[ad.face][0], FACE[ad.face][1], FACE[ad.face][0], FACE[ad.face][1]),
      id_type: ad.path === 'cr' ? 2 : 1,
      features,
      area_unit: opt(c.area_unit, 'square-meters', 'Square Meters', 'متر مربع'),
      ...(ad.furnished && { furnished: ad.furnished === 'yes' ? opt(c.furnished.yes, 'yes', 'Yes', 'نعم', 'Yes', 'نعم') : opt(c.furnished.no, 'no', 'No', 'لا', 'No', 'لا') }),
      is_furnished: ad.furnished ? ad.furnished === 'yes' : null,
      /* the real API sends a sale type on a rent listing too (listings.mjs) */
      sale_type: opt(c.initial_sale, 'initial-sale', 'Initial Sale', 'بيع أولي', 'Initial sale'),
      is_verified: false,
      otp_attempts: 0,
      rega_details: {
        ai_data: { title: { ar: W.titleAr, en: W.titleEn }, description: { ar: W.descAr, en: W.descEn } },
        isValid: true, message: null, advertisement,
      },
      /* rent only: the listings area's /edit drops it from a sale listing, as the drawer needs */
      ...(rent && { rental_price: String(ad.price) }),
      advertiser_id: advertisement.advertiserId,
      /* a listing made from a REGA licence is campaign "Rega Data" (the catalogue's own option) */
      campaign_type: opt(c.rega_data, 'rega-data', 'Rega Data', 'بيانات REGA'),
      is_bi_approved: false,
      is_installment: false,
      license_number: ad.path === 'fal' || magic ? U.license.number : null,
      ...(rent && { rent_frequency: opt(c.yearly, 'yearly', 'Yearly', 'سنوي') }),
      ...(ad.residence && { residence_type: opt(c.residence[ad.residence], ad.residence, RESIDENCE[ad.residence][0], RESIDENCE[ad.residence][1]) }),
      ...(chose && { floor_number: ad.floor, built_up_area: ad.builtUp }),
      area_unit_value: ad.size,
      completion_status: opt(c.ready, 'ready', 'Ready', 'جاهز'),
      is_contact_hidden: false,
      is_photo_verified: false,
      is_posted_on_rega: true,
      is_video_verified: false,
      auto_generated_title: magic,
      is_location_editable: false,
      possession_available: true,
      apply_refresh_by_default: false,
      title_translation_enabled: true,
      auto_generated_description: magic,
      description_translation_enabled: true,
    };
    const disp = posted ? (nafath ? 'pending-nafaz-verification' : 'ad-in-review') : 'not-posted';
    const url = `https://www.bayut.sa/en/property/details-${ad.id}.html`;
    const url_l1 = `https://www.bayut.sa/property/details-${ad.id}.html`;
    const products_information = Object.entries(PRODUCT).map(([slug, p]) => {
      const applied = posted && slug === 'basic-listing';
      return {
        slug, title: p.title, status: null, end_date: applied ? iso(day(-30)) : null, title_l1: p.title_l1,
        till_date: applied ? iso(day(-30)) : null, is_applied: applied, start_date: applied ? stamp(created, 2) : null,
        platform_id: 1, is_applicable: !applied, auto_renewable_item: {},
      };
    });
    const health = {
      age: 0, age_score: 15, age_title: 'Listing is 0 days old', age_message: 'Fresh listings get more views and leads',
      age_title_l1: 'عمر الإعلان 0 أيام', overall_score: written ? 58 : 22, unique_images: images.length,
      age_message_l1: 'الإعلانات الحديثة تحصل على مشاهدات أكثر', features_score: Math.round(features.length * 2.5),
      features_title: `${features.length} of 8 Features Added`, duplicate_count: 0, duplicate_title: 'No Duplicate Images',
      features_message: 'Add more features to your ad.', uniqueness_score: 25,
      duplicate_message: 'All images in this listing are unique across your listings', features_selected: features.length,
      features_title_l1: `تمت إضافة ${features.length} من 8 ميزات`, age_classification: 'high', duplicate_title_l1: 'لا توجد صور مكررة',
      features_message_l1: 'أضف المزيد من الميزات إلى إعلانك', unique_images_score: images.length ? 25 : 0,
      unique_images_title: `${images.length} Unique Images`, age_percentage_score: 100,
      duplicate_message_l1: 'جميع صور هذا الإعلان فريدة بين إعلاناتك', exterior_images_count: images.length ? 3 : 0,
      exterior_images_title: `${images.length ? 3 : 0} Exterior Images Added`, interior_images_count: Math.max(0, images.length - 3),
      interior_images_title: `${Math.max(0, images.length - 3)} Interior Images Added`,
      unique_images_message: images.length ? 'Your listing images are all unique' : 'Add images to your listing',
      overall_classification: written ? 'medium' : 'low', unique_images_title_l1: `${images.length} صورة فريدة`,
      exterior_images_message: images.length ? 'Your listing has sufficient images' : 'Add exterior images to your listing',
      features_classification: 'low', interior_images_message: images.length ? 'Your listing has enough images' : 'Add interior images to your listing',
      exterior_images_title_l1: `تمت إضافة ${images.length ? 3 : 0} صور خارجية`, interior_images_title_l1: `تمت إضافة ${Math.max(0, images.length - 3)} صور داخلية`,
      overall_percentage_score: written ? 58 : 22, unique_images_message_l1: images.length ? 'جميع صور إعلانك فريدة' : 'أضف صوراً إلى إعلانك',
      features_percentage_score: Math.round((features.length / 8) * 100), duplicate_percentage_score: 100,
      exterior_images_message_l1: images.length ? 'إعلانك يحتوي على صور خارجية كافية' : 'أضف صوراً خارجية لإعلانك',
      interior_images_message_l1: images.length ? 'إعلانك يحتوي على صور داخلية كافية' : 'أضف صوراً داخلية لإعلانك',
      unique_images_classification: images.length ? 'high' : 'low', exterior_images_classification: images.length ? 'high' : 'low',
      interior_images_classification: images.length ? 'high' : 'low', unique_images_percentage_score: images.length ? 100 : 0,
      duplicate_images_classification: 'high', exterior_images_percentage_score: images.length ? 100 : 0,
      interior_images_percentage_score: images.length ? 100 : 0,
    };
    const score = health.overall_percentage_score;
    const chip = (state) => ({
      partial: ['partial', 'Partial', 'orange', 'جزئي'], missing: ['missing', 'Missing', 'red', 'غير مضاف'], complete: ['complete', 'Complete', 'green', 'مكتمل'],
    })[state];
    const component = (state, s, weight, detailsObj) => {
      const [c, label, colour, label_l1] = chip(state);
      return { chip: c, score: s, weight, details: detailsObj, applicable: true, chip_label: label, chip_colour: colour, chip_label_l1: label_l1, effective_weight: weight };
    };
    const listing_quality = {
      tier: written
        ? { key: 'moderate', label: 'Moderate', colour: 'yellow', label_l1: 'متوسط', next_tier: 'strong', next_tier_label: 'Strong', next_tier_label_l1: 'قوي', points_to_next_tier: 80 - score }
        : { key: 'poor', label: 'Poor', colour: 'red', label_l1: 'ضعيف', next_tier: 'weak', next_tier_label: 'Needs Work', next_tier_label_l1: 'يحتاج تحسين', points_to_next_tier: 35 - score },
      components: {
        title: component(written ? 'complete' : 'missing', written ? 15 : 0, 15, { word_count: written ? W.titleEn.split(' ').length : 0, word_count_l1: written ? W.titleAr.split(' ').length : 0, hygiene_flagged: false }),
        video: component('missing', 0, 10, { count: 0 }),
        images: component(images.length ? 'complete' : 'missing', images.length ? 30 : 0, 30, { land: false, total: images.length, unique: images.length, exterior: images.length ? 3 : 0, interior: Math.max(0, images.length - 3), duplicates: 0, exterior_target: 8, interior_target: 10 }),
        trucheck: component('missing', 0, 15, { active: false, expired: false }),
        amenities: component('partial', Math.round(features.length * 1.25), 10, { target: 8, selected: features.length }),
        description: component(written ? 'complete' : 'missing', written ? 20 : 0, 20, { word_count: written ? W.descEn.split(/\s+/).length : 0, word_count_l1: written ? W.descAr.split(/\s+/).length : 0, hygiene_flagged: false }),
      },
      quick_wins: [
        { rank: 1, effort: 1, impact: 30, priority: 30, component: 'images', remaining: 5, fix_action: 'add_images', suggestion: 'Add at least 5 images', points_gain: 30, suggestion_l1: 'أضف 5 صور على الأقل' },
        { rank: 2, effort: 1, impact: 20, priority: 20, component: 'description', remaining: 1, fix_action: 'add_description', suggestion: 'Write a description', points_gain: 20, suggestion_l1: 'اكتب وصفاً للإعلان' },
        { rank: 3, effort: 1, impact: 15, priority: 15, component: 'title', remaining: 1, fix_action: 'add_title', suggestion: 'Write a title', points_gain: 15, suggestion_l1: 'اكتب عنواناً للإعلان' },
      ],
      overall_score: score,
      quick_wins_count: 3,
    };
    return {
      id: ad.id,
      url,
      phone: null,
      price: ad.price,
      title: written ? W.titleEn : null,
      booked: false,
      health,
      images,
      source: magic ? 'profolio_web_magic' : 'profolio_web_desktop',
      url_l1,
      videos: [],
      project: null,
      unit_no: null,
      latitude: lat,
      legal_id: ad.path === 'cr' ? advertisement.advertiserId : null,
      location,
      title_l1: written ? W.titleAr : null,
      trucheck: { is_applied: false, is_applicable: false, current_trucheck: {} },
      whatsapp: null,
      longitude: lng,
      posted_at: posted ? stamp(created, 5) : null,
      posted_by: {
        id: U.id, name: U.name, agency: { id: AGENCY.id, name: AGENCY.name, logo_url: '' }, name_l1: U.name_l1,
        profile_image: '', license_number: null, platform_mapping: { ksa: { mapped: true, external_id: USER_UUID, platform_id: 1 } },
      },
      ad_license: Number(ad.licence),
      description: written ? W.descEn : null,
      external_id: ad.id,
      mot_details: {},
      actual_price: ad.price,
      dynamic_data: { dynamic_fields: df },
      social_media: [],
      wafi_license: null,
      permit_number: null,
      description_l1: written ? W.descAr : null,
      discount_value: 0,
      residence_type: ad.residence ? { id: c.residence[ad.residence], name: RESIDENCE[ad.residence][0], slug: ad.residence, name_l1: RESIDENCE[ad.residence][1] } : null,
      listing_quality,
      discount_applied: false,
      listing_category: category,
      rejection_reason: [{ reason: null, reason_l1: null }],
      platform_listings: [{
        id: 9910100 + (ad.id % 100),
        url,
        score,
        health,
        source: magic ? 'profolio_web_magic' : 'profolio_web_desktop',
        status: posted ? STATUS.pending : STATUS.draft,
        url_l1,
        platform: { id: 1, slug: 'bayut', title: 'KSA' },
        extension: null,
        is_posted: posted,
        posted_at: posted ? stamp(created, 5) : null,
        rega_info: { rega_details: details, expiry_message: '' },
        created_at: stamp(created, 1),
        listing_id: ad.id,
        updated_at: stamp(created, posted ? 6 : 3),
        disposition: DISPOSITION[disp],
        expiry_date: posted ? iso(day(-30)) : null,
        show_on_web: false,
        contact_details: { id: U.id, name: U.name, email: U.email, phone: null, mobile: U.mobile, name_l1: U.name_l1, whatsapp: U.mobile },
        platform_listing_id: ad.id,
        products_information,
      }],
      additional_details: null,
      is_offplan_listing: false,
      auto_renewable_item: {},
      /* REGA-priced sale ads carry the discount field; a rent ad does not */
      discount_applicable: !rent,
      discount_percentage: '0.00',
      project_detail_card: null,
      is_location_editable: false,
      is_unit_type_listing: false,
      ad_license_expiry_date: end,
      residence_type_applicable: true,
      title_translation_enabled: true,
      maximum_discount_threshold: 20,
      minimum_discount_threshold: 0.1,
      description_translation_enabled: true,
    };
  };
  /* the edit response: the listing, and — at its root — the categories the
     agent may switch the property type to (drawerListingDetail.js
     listingCategoriesFromResponse; KSA's FORM.USE_LISTING_CATEGORIES_FOR_
     PROPERTY_TYPE_ON_EDIT). A REGA ad fixes its type: the licence drafts
     offer the one REGA names; the magic ad none, which the form hides
     (FORM.HIDE_PROPERTY_TYPE_WHEN_DISABLED) */
  const editBody = (ad, mode) => {
    /* lf-nafath is the PUT's answer (below): the draft reads as a draft until then */
    const listing = draft(ad, { posted: mode === 'lf-posted' });
    return { listing, listing_categories: ad.path === 'magic' ? [] : [listing.listing_category] };
  };

  /* ── applicable products (the form's Required Total, the upgrade page) ──
     bayut/apis/listings.js:220 getUpsellDetail reads res.bayut; the upsell
     mapper (bayut/transformers/listings.js:352) splits products by is_add_on
     and drops refresh; required_quantity and price are maps by duration
     (pickProductTierDuration). A posted listing is not offered the basic
     listing again. */
  const applicable = (ad, mode) => {
    const posted = mode === 'lf-posted';
    const available = mode === 'lf-low-credits' ? 1 : Number(U.credits?.bayut?.available ?? 72880);
    const products = Object.entries(PRODUCT)
      .filter(([slug]) => !(posted && slug === 'basic-listing'))
      .map(([slug, p]) => ({
        id: p.id, slug, title: p.title, title_l1: p.title_l1, description: p.description, description_l1: p.description_l1,
        usage_type: 'credit', required_quantity: { 30: p.cost, 60: p.cost * 2, 90: p.cost * 3 },
        price: { 30: p.cost * CREDIT_UNIT_PRICE, 60: p.cost * 2 * CREDIT_UNIT_PRICE, 90: p.cost * 3 * CREDIT_UNIT_PRICE },
        default_expiry_days: 30, allowed_expiry_durations: [30, 60, 90], is_add_on: p.add_on,
        is_recommended: !!p.recommended, is_applicable: true,
      }));
    return { bayut: { credits: { available }, credit_unit_price: CREDIT_UNIT_PRICE, currency: 'SAR', products } };
  };

  /* ── the refusal envelope (harness/page.mjs FAILURE's shape) ─────────────── */
  const refuse = (...errors) => ({ success: false, errors });
  /* this module's own failure mode, and forms.mjs's shared one (FAIL, 'form-fail'):
     a failed state wraps its submit in forms.mjs failing(), which answers in
     'form-fail' and sends every refusal out with a 422 */
  const failing = (mode) => mode === 'lf-fail' || mode === 'form-fail';

  /* lf-upload-fail's handshake: the bucket's own upload URL, which the
     harness does not reach (harness/page.mjs blocks every other host), so
     the product's XHR fails and the image is marked failed
     (imageUploadHelper.js uploadFile → inError) */
  let uploads = 0;
  const presigned = () => {
    const uuid = `5e0f${pad(++uploads % 10000, 4)}-9a1b-4c2d-8e3f-000088241126`;
    return { presigned_urls: [{ uuid, key: 'listing_image',
      upload_url: `https://bayut-sa-listing-images.s3.me-south-1.amazonaws.com/uploads/${uuid}?X-Amz-Expires=900`,
      base_url: 'https://images.bayut.sa/thumbnails' }] };
  };

  return [
    [/^\/api\/surge\/listing_categories$/, () => ({ listing_categories: CATEGORIES })],
    [/^\/api\/surge\/features$/, (search) => ({ features: featuresFor(new URLSearchParams(search || '').get('source_id')) })],

    /* ── the licence step ──────────────────────────────────────────────── */
    /* license-validation.js:99 — license_number → the listing is created at
       once; otherwise show_nafaz_id picks National ID (true) or CR (false).
       A licence REGA does not know is refused (lf-fail's envelope; the state
       that shows it answers it 422). */
    [/^\/api\/surge\/listings\/new_listing_data$/, (search) => {
      const ad = byLicence(new URLSearchParams(search || '').get('ad_license_number'));
      if (!ad || ad.path === 'magic') return refuse('Ad license not found on REGA. Check the number and try again.');
      if (ad.path === 'fal') return { license_number: U.license.number, license_type: 'agency', show_nafaz_id: false };
      return { license_number: null, license_type: ad.path === 'nid' ? 'individual' : 'agency', show_nafaz_id: ad.path === 'nid' };
    }],
    /* bayut/apis/postListing.js — GET listings/new creates the draft;
       post-listing-with-options.js:180 reads listing.id, is_otp_required and
       phone_number (the FAL licence holder's) */
    [/^\/api\/surge\/listings\/new$/, (search, mode) => {
      const q = new URLSearchParams(search || '');
      const ad = byLicence(q.get('ad_license_number') || q.get('permit_number'));
      if (failing(mode) || !ad) return refuse('This ad license is already used by another listing.');
      return { listing: draft(ad), is_otp_required: ad.path === 'fal', phone_number: U.mobile };
    }],
    /* ── the drafts ──────────────────────────────────────────────────────────
       Every route here names this module's own ids: a pathname regex that
       matched any listing would win over listings.mjs (answer() returns the
       FIRST match, answered or not) and take the listings drawer with it. */
    [new RegExp(`^/api/surge/listings/(${IDS})/edit$`), (search, mode, pathname) => editBody(byId(pathname.split('/')[4]), mode)],
    /* applicable_products carries its listing in the QUERY, so the pathname
       cannot tell a draft from any other listing. A draft is answered here;
       every other listing is passed through, unchanged, to the answer it has
       always had (fixtures.mjs ROUTES, whose pattern is a prefix — so the
       same call with a trailing segment reaches it past this one). */
    [/^\/api\/surge\/products\/applicable_products$/, (search, mode, pathname, method, page) => {
      const ad = byId(new URLSearchParams(search || '').get('listing_id'));
      if (ad) return applicable(ad, mode);
      const owner = answer(method, `${pathname}/-`, search, mode, page);
      if (owner === undefined) console.error('  listing-form.mjs: applicable_products pass-through found no owner — fixtures.mjs ROUTES changed its pattern');
      return owner;
    }],

    /* ── writes ──────────────────────────────────────────────────────────── */
    /* PUT listings/:id — Save Changes, Post Listing, Update
       (surgePostListingEndpoints.js updateListing). The answer is the listing
       as it now is: a draft that was posted is pending review with the basic
       listing applied. The Magic Post Ad success modal is titled with
       `message` (post-ad/index.js). Any other listing's PUT stays unanswered,
       as it was — the product reads an empty answer as success. */
    [new RegExp(`^/api/surge/listings/(${IDS})$`), (search, mode, pathname, method) => {
      if (method !== 'PUT' && method !== 'PATCH') return undefined;
      if (failing(mode)) return refuse('Listing could not be saved. Please try again.');
      return { listing: draft(byId(pathname.split('/')[4]), { posted: true, nafath: mode === 'lf-nafath' }), message: 'Your listing has been submitted successfully' };
    }],
    /* any other listing's save, refused: the failure states of the page's own
       listing (88240117's Update) need a refusal to deliver, and nobody
       answered this pathname — every other mode and method stays unanswered,
       exactly as before */
    [/^\/api\/surge\/listings\/\d+$/, (search, mode, pathname, method) => (method !== 'GET' && failing(mode)
      ? refuse('Listing could not be saved. Please try again.') : undefined)],
    /* the upgrade page's Post Listing / Upgrade (bayut/apis/listings.js applyProduct) */
    [new RegExp(`^/api/surge/listings/(${IDS})/apply_products$`), (search, mode, pathname, method) => {
      if (method !== 'PUT') return undefined;
      if (failing(mode)) return refuse('The upgrade could not be applied. Please try again.');
      return { listing: draft(byId(pathname.split('/')[4]), { posted: true }) };
    }],
    /* Generate Title / Description (GenerateContentField.js:130 reads
       `content`) — the words the listing is written in.
       WHICH field and WHICH listing are in the POST body (bayut/payloads/
       listings.js: content_type, listing_id), and an answer is not given the
       body (harness/page.mjs passes method, path, query and the asking page).
       The post-listing states pass the two through as a query
       (harness/interactions/post-listing-edit.mjs generating()). Without them
       — the explorer's click — the listing is the one whose form is asking
       (the page's route names it), and the field is taken to be the title,
       which is long enough for either field (min_length 20). */
    [/^\/api\/surge\/listings\/generate_content$/, (search, mode, pathname, method, page) => {
      if (method !== 'POST') return undefined;
      if (failing(mode)) return refuse('Content could not be generated right now. Please try again.');
      const q = new URLSearchParams(search || '');
      const type = q.get('content_type') || '';
      const kind = /desc/.test(type) ? 'description' : 'title';
      const arabic = /(_l1|_ar)$/.test(type);
      const id = q.get('listing_id') || String(page || '').match(/\/post-(?:listing|ad)\/(\d+)/)?.[1];
      const ad = byId(id);
      if (ad) {
        const W = words(ad);
        return { content: kind === 'description' ? (arabic ? W.descAr : W.descEn) : (arabic ? W.titleAr : W.titleEn) };
      }
      /* any other listing: its own words, as its owner has it */
      const l = id ? answer('GET', `/api/surge/listings/${id}/edit`, '', mode, page)?.listing : null;
      const W = words(ADS[0]);
      const own = kind === 'description' ? (arabic ? l?.description_l1 : l?.description) : (arabic ? l?.title_l1 : l?.title);
      return { content: own || (kind === 'description' ? W.descEn : W.titleEn) };
    }],
    /* the image upload's handshake (helpers/fileHelpers/imageUploadHelper.js)
       is forms.mjs's — it answers presigned_urls for every upload, with an
       upload URL on this machine. Only mode lf-upload-fail is answered here:
       the bucket's own URL, off the machine, so the harness blocks the PUT
       and the product marks the image failed. Any other mode returns nothing,
       and forms.mjs (which asks the rest of the chain first) answers. */
    [/^\/api\/surge\/attachments\/presigned_urls$/, (search, mode) => (mode === 'lf-upload-fail' ? presigned() : undefined)],
  ];
};
