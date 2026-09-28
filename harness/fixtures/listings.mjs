/**
 * Fixture answers for the listings area, in the real API's shape.
 * See harness/fixtures.mjs (answer) for how these are loaded, and
 * scripts/check-fixtures.mjs for what they are held to.
 *
 * WHAT THIS DOES. The ten rows are still built in harness/fixtures.mjs — every
 * row keeps the job the long comment there gives it, and row 0 stays the plain
 * live listing the interaction steps click. This module does not decide
 * anything about a row; it re-expresses each one the way Surge sends it
 * (data/api-shapes.json → GET /api/surge/listings), reading the job off the
 * base row's own fields (its disposition, its rega_info, its booked dates…),
 * so the jobs are still defined in exactly one place.
 *
 * Why it matters, in the product's own reads — each of these was blank or
 * wrong on the fixture account and right on a real one:
 *
 *   purpose_hash.slug 'sale' / 'rent' (not 'for-sale')
 *       listing-purpose.js only appends " | Ready" when purpose.slug === 'sale'
 *       (SHOW_COMPLETION_STATUS_FOR_SELL), so every sale row read "Floor for
 *       Sale" where the account's own data says "Floor for Sale | Ready".
 *   health.*_title / *_message / overall_classification
 *       the quality popover's subtitles and messages come straight from these
 *       (listing/health/health.js) and were empty; the chip colour is
 *       overall_classification, which defaulted every row to warning.
 *   ad_license_expiry_date
 *       the Timeline cell's "REGA Ad Licence Expiry Date" line
 *       (expiry-renewal.js:70) — a real licensed listing always has one.
 *   posted_by.platform_mapping.ksa.external_id
 *       getUserIdsForOvationStats reads it; without it the page never asked
 *       /ovation/stats at all and the Performance column had no numbers.
 *   products_information[].end_date
 *       products.js reads the "Expiring on" line (time_to_expiry) and a
 *       requested service's "Selected Date & Time" (requested_at) from
 *       end_date — row 3's applied/requested states had neither.
 *   rejection_reason: [{ reason, reason_l1 }]
 *       objects, not strings: the drawer's Alert maps them through
 *       getLocalisedString(reason, 'reason') and rendered an empty line.
 *   booked
 *       listingMapper takes `listing.booked` when it is present and only falls
 *       back to booked_dates when it is not — the real API always sends it.
 *   listing_category.purpose_hash.slug 'daily-rental'  (rows 4 and 9)
 *       the only key that makes a daily rental — it drives Mark as Booked,
 *       "Night" after the price and rent_frequency 'daily'; the root
 *       listing_purpose these rows used to carry is not a real key. As on
 *       the real accounts they are MOT-permitted ("Permit No:"), priced per
 *       night, with no REGA licence.
 *   auto_renewable_item { id, renewing_on }  (row 5), residence_type
 *   'family' / face 'western' / 'lawn-or-garden'  (row 9), tier 'poor'
 *       the second real account's (agency staff) values — see the comments
 *       at each; only auto-renew is drawn, and only on the mobile card.
 *   is_otp_required / phone_number  (row 7)
 *       platformActions.js:47 opens the OTP modal only when the listing says
 *       is_otp_required === true, after POST /api/surge/otps; otherwise
 *       Publish Now navigates to /post-listing/:id/upgrade. That is why
 *       `modal-otp` timed out waiting for .ant-modal.
 *
 * Keys the real API does not send (root beds, area_unit, images_count,
 * expiry_days, user, …) are not sent: the product's normaliser
 * (utility.js normalizeSurgeListingsResponse) derives each of them from the
 * real fields, and deriving them is what a real account does.
 *
 * @param h  the shared invented account — user, listings, credits, dates
 * @returns  [[RegExp over the pathname, (search, mode, pathname, method) => body], …]
 */
export default (h) => {
  const { listings: base, SUMMARY, U, AGENCY, day, iso, num } = h;

  /* ── vocabulary ────────────────────────────────────────────────────────── */
  const AR = {
    Riyadh: 'الرياض', 'North Riyadh': 'شمال الرياض', 'East Riyadh': 'شرق الرياض',
    'Al Wurud': 'الورود', 'Al Masif': 'المصيف', 'Al Mughrizat': 'المغرزات', 'Al Rawabi': 'الروابي',
    'Al Nahdah': 'النهضة', 'Al Yarmuk': 'اليرموك', 'Al Diriyah': 'الدرعية', 'As Sulaymaniyah': 'السليمانية',
    'Al Narjis': 'النرجس', 'Al Qirawan': 'القيروان', 'Al Arid': 'العارض', 'Al Aqiq': 'العقيق',
    /* invented projects (mode 'projects' below) */
    'Ruba Heights': 'روبا هايتس', 'Qamar Residences': 'قمر ريزيدنس', 'Dana Gardens': 'حدائق دانة',
  };
  /* coordinates of each district, roughly — REGA carries them as strings */
  const GEO = {
    'Al Wurud': [24.723611, 46.674917], 'Al Masif': [24.754722, 46.672805], 'Al Mughrizat': [24.754027, 46.724013],
    'Al Rawabi': [24.709205, 46.783711], 'Al Nahdah': [24.756694, 46.812930], 'Al Yarmuk': [24.808305, 46.795672],
    'As Sulaymaniyah': [24.740613, 46.575012], 'Al Aqiq': [24.770418, 46.628370],
    'Ruba Heights': [24.852230, 46.651109], 'Qamar Residences': [24.861874, 46.589402], 'Dana Gardens': [24.843715, 46.743026],
  };
  /* listing types — external ids are Bayut KSA's (listing-form-data.js: apartment 3; listingTypes.js) */
  const TYPES = {
    Floor: { ext: '6', slug: 'floor', ar: 'دور', order: 6 },
    Apartment: { ext: '3', slug: 'apartment', ar: 'شقة', order: 3 },
    Villa: { ext: '4', slug: 'villa', ar: 'فيلا', order: 4 },
    Chalet: { ext: '12', slug: 'chalet', ar: 'شاليه', order: 12 },
  };
  const PURPOSE = {
    sale: { id: 1, name: 'Sale', slug: 'sale', name_l1: 'بيع', crumb: 'Property for Sale', crumb_l1: 'عقار للبيع', ad: 'For Sale', ad_l1: 'للبيع' },
    rent: { id: 2, name: 'Rent', slug: 'rent', name_l1: 'إيجار', crumb: 'Property for Rent', crumb_l1: 'عقار للإيجار', ad: 'For Rent', ad_l1: 'للإيجار' },
    /* only a row whose job is a daily rental (base rows 4 and 9, or a
       fakeBase `_daily`) is one by category — base row 2's title says "Daily
       Rental" but its job is the REGA expiry. The crumb is the staff
       account's own (25 and 19 characters in data/api-shapes.b.json). */
    daily: { id: 4, name: 'Daily Rental', slug: 'daily-rental', name_l1: 'إيجار يومي', crumb: 'Property for Daily Rental', crumb_l1: 'عقار للإيجار اليومي', ad: 'For Rent', ad_l1: 'للإيجار' },
  };
  const PRODUCT_TITLES = {
    'basic-listing': ['Basic Listing', 'الإعلان أساسي'],
    'hot-listing': ['Hot Listing', 'الإعلان مميّز'],
    'signature-listing': ['Signature Listing', 'الإعلان استثنائي'],
    refresh: ['Refresh', 'إعادة نشر'],
    'photography-service': ['Photography Service', 'خدمة التصوير الاحترافي'],
    'videography-service': ['Videography Service', 'خدمة تصوير الفيديو'],
    'drone-footage-service': ['Drone Footage Service', 'خدمة تصوير درون'],
  };
  /* ids stay the ones the base STATUSES use, because the tab key IS the id */
  const STATUS = {
    active: { id: 1, name: 'Active', slug: 'active', name_l1: 'نشطة' },
    draft: { id: 2, name: 'Draft', slug: 'draft', name_l1: 'مسودة' },
    pending: { id: 3, name: 'Pending', slug: 'pending', name_l1: 'معلقة' },
    removed: { id: 4, name: 'Removed', slug: 'removed', name_l1: 'محذوفة' },
  };
  const DISPOSITION = {
    live: { id: 1, name: 'Live', name_l1: 'مباشر' },
    'changes-in-review': { id: 4, name: 'Changes In Review', name_l1: 'التعديلات قيد المراجعة' },
    'not-posted': { id: 2, name: 'Not Posted', name_l1: 'غير منشور' },
    'info-completed': { id: 17, name: 'Info Completed', name_l1: 'اكتملت المعلومات' },
    'pending-otp-verification': { id: 22, name: 'Pending OTP Verification', name_l1: 'بانتظار التحقق برمز OTP' },
    'ad-in-review': { id: 3, name: 'Ad In Review', name_l1: 'الإعلان قيد المراجعة' },
    rejected: { id: 8, name: 'Rejected', name_l1: 'مرفوض' },
    deleted: { id: 7, name: 'Deleted', name_l1: 'محذوف' },
    expired: { id: 10, name: 'Expired', name_l1: 'منتهي' },
  };
  const disposition = (slug) => ({ id: DISPOSITION[slug].id, name: DISPOSITION[slug].name, slug,
    name_l1: DISPOSITION[slug].name_l1, description: null, description_l1: null });
  /* the real API opens every status with the dispositions it can carry */
  const STATUSES_AND_DISPOSITIONS = [
    { ...STATUS.active, dispositions: ['live', 'changes-in-review'].map(disposition) },
    { ...STATUS.draft, dispositions: ['not-posted', 'info-completed', 'pending-otp-verification'].map(disposition) },
    { ...STATUS.pending, dispositions: ['ad-in-review', 'rejected'].map(disposition) },
    { ...STATUS.removed, dispositions: ['deleted', 'expired'].map(disposition) },
  ];

  /* ── helpers ───────────────────────────────────────────────────────────── */
  const pad = (n, w = 2) => String(n).padStart(w, '0');
  /* Surge stamps in Riyadh time, 29 chars: 2026-09-26T10:15:30.123+03:00.
     Hours stay 09–16 local so the date is the same in UTC and in +05. */
  const stamp = (d, k = 0) => `${iso(d)}T${pad(9 + (k % 8))}:${pad((k * 7 + 4) % 60)}:${pad((k * 13 + 9) % 60)}.${pad((k * 37 + 120) % 1000, 3)}+03:00`;
  const daysAgo = (isoString) => Math.round((day(0) - new Date(`${String(isoString).slice(0, 10)}T00:00:00Z`)) / 864e5);
  /* stable small ids from a name */
  const hid = (s, at) => at + [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 8999, 17);
  const uuid = (seed, k = 0) => {
    const hex = (n, w) => (Math.abs(Math.imul(n ^ 0x5bd1e995, 2654435761 + k * 97) >>> 0).toString(16).padStart(8, '0').slice(0, w));
    return `${hex(seed, 8)}-${hex(seed + 1, 4)}-4${hex(seed + 2, 3)}-a${hex(seed + 3, 3)}-${hex(seed + 4, 8)}${hex(seed + 5, 4)}`;
  };
  const option = (id, slug, label, label_l1, value_l1 = label_l1) => ({ id, slug, label, value: label, label_l1, value_l1 });
  const USER_UUID = '3f6c9e2a-4b7d-4e1a-9c5f-000088010234';   /* invented; Surge maps users to a uuid */
  const localMobile = `0${U.mobile.replace(/^\+966/, '')}`;     /* 05XXXXXXXX, how REGA writes it */

  /* ── one real-shaped listing from one base row ─────────────────────────── */
  const toReal = (l, i) => {
    const r = l._row;
    const pl0 = l.platform_listings[0];
    const [type] = r.title.split(' for ');
    const T = TYPES[type] || TYPES.Apartment;
    const parts = r.location.split(', ');
    const [city, district, area] = parts;
    const where = parts[parts.length - 1];
    const [lat, lng] = GEO[where] || [24.7136, 46.6753];
    /* A daily rental is one BY CATEGORY: listing_category.purpose_hash.slug
       'daily-rental' is the only place the real API says so. The base row
       marks the job with a listing_purpose (harness/fixtures.mjs rows 4 and
       9); that key is read here and not sent — Surge has no root
       listing_purpose. Both things the job needs still render from the
       category alone (bayut/transformers/listings.js mapListingPurpose
       prefers purpose_hash):
         Mark as Booked  platformMapper's listingForActions falls back to it
                         when the root key is absent → listingUtilities.js:247
         "Night"         listingMapper's property.isDailyRental → listing-purpose.js:344 */
    const dailyJob = !!(l._daily || l.listing_purpose?.slug === 'daily-rental');
    const P = dailyJob ? PURPOSE.daily : /Rent/i.test(r.title) ? PURPOSE.rent : PURPOSE.sale;
    const rent = P !== PURPOSE.sale;
    const id = l.id;
    /* a project unit (WAFI) or an MOT-permitted daily rental has no REGA ad
       licence: the Property cell reads "Permit No:" (listing-purpose.js:478),
       as the owner's real daily rental does, and the Timeline has no REGA line */
    const hasRega = r.regaId != null && !dailyJob;
    const license = hasRega ? num(r.regaId) : null;
    /* a daily rental is priced per NIGHT. The base rows carry sale prices
       (2,330,000 would print "SAR 2,330,000 Night"), so a base row that is a
       daily rental by job is priced at a thousandth of it; a fakeBase
       `_daily` row is already nightly */
    const price = dailyJob && !l._daily ? Math.round(l.price / 1000) : l.price;
    /* a daily rental carries its Ministry of Tourism permit — the real shape's
       permit_number / legal_id / mot_details / national_address */
    const crNumber = '1010456789';                               /* invented: the agency's commercial registration */
    const mot = dailyJob ? {
      legal_id: crNumber,
      issue_date: iso(day(daysAgo(l.posted_at) + 140)),
      expiry_date: iso(day(daysAgo(l.posted_at) - 225)),
      permit_number: `4${String(l.id).slice(-7)}`,
      commercial_name: 'Najd Horizon Holiday Homes Est.',
    } : null;
    const nationalAddress = `RNWA${String(2400 + i * 113).slice(-4)}`;
    const beds = r.beds || 0, baths = r.baths || 0;
    const size = num(r.area);
    const postedDays = daysAgo(l.posted_at);
    const posted = day(postedDays);
    const dispSlug = pl0.disposition.slug;
    const live = dispSlug === 'live';
    const expiry = iso(day(-28));
    /* every REGA-licensed ad carries its licence window; row 2's job is the
       REGA expiry, so its licence ends when its rega_details say it does */
    const regaEnd = pl0.rega_info?.rega_details?.expiry_date
      ? iso(new Date(pl0.rega_info.rega_details.expiry_date))
      : iso(day(postedDays - 90));
    const regaStart = iso(day(postedDays + 2));
    const deed = `3${String(license ?? id).slice(-7)}${pad(i + 11)}17`.slice(0, 12);
    const bookedDates = l.additional_details?.booked_dates;
    /* row 9 also carries an APPLIED DISCOUNT — the DiscountTag over the
       thumbnail (listing-purpose.js:257), which the real account's first row
       shows and no fixture row ever did. Row 9's other job (a second
       daily-rental entry point) lives in its actions, not its thumbnail. */
    const discounted = i === 9;
    /* the pre-discount price, rounded the way its own magnitude is written —
       to the thousand for a sale price, to the ten for a nightly one */
    const unit = price >= 100000 ? 1000 : 10;
    const actualPrice = discounted ? Math.round(price / 0.95 / unit) * unit : price;
    /* Row 9 is also THE STAFF ACCOUNT'S ROW. The second real account (agency
       staff, data/api-shapes.b.json) opens its list with a furnished
       daily-rental apartment for FAMILIES, facing WEST, with a lawn or garden
       — four enum values the owner account never sent (data/qa/delta-b.json).
       None of them is drawn in the table; residence type is a line in the
       detail drawer (listingDrawer.js:228). Row 9's jobs are its actions and
       its thumbnail, so these ride along without moving anything. */
    const staffLike = i === 9;

    const titleEn = `${beds ? `${beds} Bedroom ` : ''}${type} for ${P.name} in ${where}, ${city}`;
    const titleAr = `${T.ar} ${P.slug === 'daily-rental' ? 'للإيجار اليومي' : rent ? 'للإيجار' : 'للبيع'} في ${AR[where] || where}، ${AR[city] || city}`;
    const descEn = [
      `${type} for ${P.name.toLowerCase()} in ${where}, ${district || city}, ${city}.`,
      `${size} sq. m. of ${beds ? `${beds}-bedroom, ${baths}-bathroom ` : ''}living space, ready to move in, facing ${staffLike ? 'west' : 'north'} onto a 20 m street.`,
      'Private entrance, central air conditioning in every room, a fitted kitchen with storage, a maid\'s room with its own bathroom, and a covered parking space.',
      `Close to schools, mosques and daily shopping, with quick access to King Fahd Road and the ${city} ring roads.`,
      dailyJob ? 'Water, electricity and sewerage connected. Furnished and serviced; Ministry of Tourism holiday-home permit issued.' : 'Water, electricity and sewerage connected. Title deed ready for transfer; REGA advertising licence issued.',
      `Contact ${AGENCY.name} to arrange a viewing.`,
    ].join('\n\n');
    const descAr = [
      `${T.ar} ${dailyJob ? 'للإيجار اليومي' : rent ? 'للإيجار' : 'للبيع'} في حي ${AR[where] || where}، ${AR[city] || city}.`,
      `مساحة ${size} متر مربع${beds ? ` تضم ${beds} غرف نوم و${baths} دورات مياه` : ''}، جاهز للسكن، واجهة ${staffLike ? 'غربية' : 'شمالية'} على شارع عرض 20 متر.`,
      'مدخل خاص، تكييف مركزي في جميع الغرف، مطبخ راكب مع خزائن، غرفة خادمة بدورة مياه، وموقف سيارة مظلل.',
      'قريب من المدارس والمساجد والخدمات اليومية مع وصول سريع إلى طريق الملك فهد.',
      dailyJob ? 'الماء والكهرباء والصرف الصحي متصلة، مفروش ومخدوم، وتصريح بيت العطلات من وزارة السياحة صادر.' : 'الماء والكهرباء والصرف الصحي متصلة، والصك جاهز للإفراغ، ورخصة الإعلان من الهيئة العامة للعقار صادرة.',
      `تواصل مع ${AGENCY.name_l1} لترتيب موعد المعاينة.`,
    ].join('\n\n');

    /* the base health set, completed with the titles and messages the
       quality popover prints (health.js) and the classification the chip is
       coloured by. Sub-scores are the base row's, unchanged. */
    const b = l.health;
    const score = b.overall_percentage_score;
    const overallClass = score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low';
    const ext = b.exterior_images_count, int = b.interior_images_count, uniq = b.unique_images_count;
    const featuresSelected = Math.round((b.features_percentage_score / 100) * 8);
    const health = {
      age: b.age,
      age_score: Math.round(b.age_percentage_score * 0.15),
      age_title: `Listing is ${b.age} days old`,
      age_message: 'Fresh listings get more views and leads',
      age_title_l1: `عمر الإعلان ${b.age} أيام`,
      overall_score: score,
      unique_images: uniq,
      age_message_l1: 'الإعلانات الحديثة تحصل على مشاهدات أكثر',
      features_score: Math.round(b.features_percentage_score * 0.2),
      features_title: `${featuresSelected} of 8 Features Added`,
      duplicate_count: 0,
      duplicate_title: 'No Duplicate Images',
      features_message: 'Add more features to your ad.',
      uniqueness_score: 25,
      duplicate_message: 'All images in this listing are unique across your listings',
      features_selected: featuresSelected,
      features_title_l1: `تمت إضافة ${featuresSelected} من 8 ميزات`,
      age_classification: b.age_classification,
      duplicate_title_l1: 'لا توجد صور مكررة',
      features_message_l1: 'أضف المزيد من الميزات إلى إعلانك',
      unique_images_score: 25,
      unique_images_title: `${uniq} Unique Images`,
      age_percentage_score: b.age_percentage_score,
      duplicate_message_l1: 'جميع صور هذا الإعلان فريدة بين إعلاناتك',
      exterior_images_count: ext,
      exterior_images_title: `${ext} Exterior Images Added`,
      interior_images_count: int,
      interior_images_title: `${int} Interior Images Added`,
      unique_images_message: 'Your listing images are all unique',
      overall_classification: overallClass,
      unique_images_title_l1: `${uniq} صورة فريدة`,
      exterior_images_message: 'Your listing has sufficient images',
      features_classification: b.features_classification,
      interior_images_message: 'Your listing has enough images',
      exterior_images_title_l1: `تمت إضافة ${ext} صور خارجية`,
      interior_images_title_l1: `تمت إضافة ${int} صور داخلية`,
      overall_percentage_score: score,
      unique_images_message_l1: 'جميع صور إعلانك فريدة',
      features_percentage_score: b.features_percentage_score,
      duplicate_percentage_score: b.duplicate_percentage_score,
      exterior_images_message_l1: 'إعلانك يحتوي على صور خارجية كافية',
      interior_images_message_l1: 'إعلانك يحتوي على صور داخلية كافية',
      unique_images_classification: b.unique_images_classification,
      exterior_images_classification: b.exterior_images_percentage_score === 100 ? 'high' : 'medium',
      interior_images_classification: b.interior_images_percentage_score === 100 ? 'high' : 'medium',
      unique_images_percentage_score: b.unique_images_percentage_score,
      duplicate_images_classification: b.duplicate_percentage_score === 100 ? 'high' : 'low',
      exterior_images_percentage_score: b.exterior_images_percentage_score,
      interior_images_percentage_score: b.interior_images_percentage_score,
    };

    /* The listing-quality model Surge sends beside health. NOTHING in the
       product reads it (no `listing_quality`, `tier` or `quick_wins` anywhere
       in profolio-reactjs/src) — the quality chip is health.overall_
       classification. It is here so the shape is whole.

       The ladder is the two real accounts' own: the owner's rows are 'weak'
       → next 'moderate' ("Moderate", "متوسط"); the staff account's are
       'poor' ("Poor", "ضعيف") → next 'weak' ("Needs Work", "يحتاج تحسين").
       Both sit under the 50 where the chip turns red, so the cut between them
       is ours: under 35 is poor — rows 6, 7 and 9 here. Colours are NAMES,
       as the components' chip_colour are: the staff account's poor tier is
       3 characters ('red'), the owner's weak one 6 ('orange'). */
    const tier = score >= 80 ? ['strong', 'Strong', 'قوي', null, null, null, 'green']
      : score >= 50 ? ['moderate', 'Moderate', 'متوسط', 'strong', 'Strong', 'قوي', 'yellow']
        : score >= 35 ? ['weak', 'Needs Work', 'يحتاج تحسين', 'moderate', 'Moderate', 'متوسط', 'orange']
          : ['poor', 'Poor', 'ضعيف', 'weak', 'Needs Work', 'يحتاج تحسين', 'red'];
    const nextAt = score >= 80 ? score : score >= 50 ? 80 : score >= 35 ? 50 : 35;
    const chip = (state) => ({
      partial: { chip: 'partial', chip_label: 'Partial', chip_colour: 'orange', chip_label_l1: 'جزئي' },
      missing: { chip: 'missing', chip_label: 'Missing', chip_colour: 'red', chip_label_l1: 'غير مضاف' },
      complete: { chip: 'complete', chip_label: 'Complete', chip_colour: 'green', chip_label_l1: 'مكتمل' },
    })[state];
    const component = (state, s, weight, details) => {
      const c = chip(state);
      return { chip: c.chip, score: s, weight, details, applicable: true, chip_label: c.chip_label,
        chip_colour: c.chip_colour, chip_label_l1: c.chip_label_l1, effective_weight: weight };
    };
    const listing_quality = {
      tier: { key: tier[0], label: tier[1], colour: tier[6],
        label_l1: tier[2], next_tier: tier[3], next_tier_label: tier[4], next_tier_label_l1: tier[5],
        points_to_next_tier: nextAt - score },
      components: {
        title: component('partial', 9, 15, { word_count: titleEn.split(' ').length, word_count_l1: titleAr.split(' ').length, hygiene_flagged: false }),
        video: component('missing', 0, 10, { count: 0 }),
        images: component(score >= 50 ? 'complete' : 'partial', Math.round(score * 0.3), 30, {
          land: false, total: r.images, unique: uniq, exterior: ext, interior: int, duplicates: 0, exterior_target: 8, interior_target: 10 }),
        trucheck: component('missing', 0, 15, { active: false, expired: false }),
        amenities: component('partial', Math.round(featuresSelected * 1.25), 10, { target: 8, selected: featuresSelected }),
        description: component('complete', 20, 20, { word_count: descEn.split(/\s+/).length, word_count_l1: descAr.split(/\s+/).length, hygiene_flagged: false }),
      },
      quick_wins: [
        { rank: 1, effort: 2, impact: 15, priority: 7.5, component: 'trucheck', remaining: 1, fix_action: 'book_trucheck', suggestion: 'Book a TruCheck visit', points_gain: 15, suggestion_l1: 'احجز زيارة تروتشيك' },
        { rank: 2, effort: 2, impact: 10, priority: 5, component: 'video', remaining: 1, fix_action: 'add_video', suggestion: 'Add a property video', points_gain: 10, suggestion_l1: 'أضف فيديو للعقار' },
        { rank: 3, effort: 1, impact: 5, priority: 5, component: 'amenities', remaining: 8 - featuresSelected, fix_action: 'add_amenities', suggestion: `Add ${8 - featuresSelected} more amenities`, points_gain: 5, suggestion_l1: `أضف ${8 - featuresSelected} ميزات أخرى` },
        { rank: 4, effort: 1, impact: 6, priority: 6, component: 'title', remaining: 1, fix_action: 'improve_title', suggestion: 'Improve your title', points_gain: 6, suggestion_l1: 'حسّن عنوان إعلانك' },
        { rank: 5, effort: 2, impact: 4, priority: 2, component: 'images', remaining: Math.max(0, 18 - r.images), fix_action: 'add_images', suggestion: 'Add interior images', points_gain: 4, suggestion_l1: 'أضف صوراً داخلية' },
      ],
      overall_score: score,
      quick_wins_count: 5,
    };

    const thumb = `/harness-img/${r.bayutId}.svg`;
    const images = Array.from({ length: r.images }, (_, k) => ({
      id: id * 100 + k,
      main: k === 0 ? 1 : 0,
      uuid: uuid(id, k),
      order: k,
      sizes: { full: thumb, large: thumb, small: thumb, medium: thumb, thumbnail: thumb },
      status: 'on',
      is_unique: true,
      image_type: 'listing_image',
    }));

    /* locations: Saudi Arabia > (Riyadh Region) > city > zone > district.
       loc_1…loc_5 walk that chain; breadcrumbs are the levels the row prints */
    const chain = ['KSA', ...parts];
    const crumbs = chain.map((t, k) => ({
      id: k === 0 ? 1 : hid(t, 100 * k),
      level: k + 1,
      title: t,
      title_l1: k === 0 ? 'السعودية' : (AR[t] || t),
    }));
    const locIds = [1, 2, ...crumbs.slice(1).map((c) => c.id)];   /* 2 = Riyadh Region */
    const location = {
      id: crumbs[crumbs.length - 1].id,
      slug: null,
      level: locIds.length,
      loc_1: locIds[0] ?? null, loc_2: locIds[1] ?? null, loc_3: locIds[2] ?? null, loc_4: locIds[3] ?? null,
      loc_5: locIds[4] ?? null, loc_6: locIds[5] ?? null, loc_7: locIds[6] ?? null,
      title: where,
      latitude: lat,
      title_l1: AR[where] || where,
      longitude: lng,
      breadcrumbs: crumbs,
      external_id: null,
    };

    const category = {
      id: 100 + Number(T.ext) + (rent ? 50 : 0),
      name: type,
      slug: T.slug,
      level: 3,
      name_l1: T.ar,
      purpose: P.name,
      logo_url: null,
      parent_id: rent ? 21 : 11,
      purpose_l1: P.name_l1,
      breadcrumbs: [
        { id: P.id, name: P.crumb, level: 1, name_l1: P.crumb_l1 },
        { id: rent ? 21 : 11, name: 'Residential', level: 2, name_l1: 'سكني' },
      ],
      external_id: T.ext,
      name_plural: '',
      purpose_hash: { id: P.id, name: P.name, slug: P.slug, name_l1: P.name_l1 },
      allow_posting: true,
      display_order: T.order,
      name_plural_l1: '',
      dynamic_section: { id: 1, name: 'Residential', slug: 'residential', name_l1: 'سكني', display_order: 1, secondary_display_order: 1 },
      classification_scope: [1, 2],
    };

    /* REGA's own answer for this licence — once raw (camelCase, Arabic, as
       REGA sends it, under dynamic_fields) and once as Surge maps it
       (snake_case, under platform_listings[].rega_info) */
    const postal = String(12200 + ((i * 37) % 90));
    const building = String(2400 + i * 113);
    const additional = String(7100 + i * 61);
    const street = String(12 + i * 3);
    const borders = {
      north: ['شارع', 'شارع عرض 20 متر', '20 متر طولي'],
      south: ['جار', 'قطعة', '20 متر طولي'],
      east: ['شارع', 'شارع 15م', '15 متر طولي'],
      west: ['قطعة', 'قطعة رقم 14', '15 متر طولي'],
    };
    const employee = `${U.name_l1} - ${AGENCY.name_l1}`.slice(0, 30);
    const onDeed = `حي ${AR[where] || where} - مخطط ${2150 + i}`;
    const regaDetails = {
      url: `https://rega.gov.sa/rega-services/ads/license-verification?adLicenseNumber=${license}&idType=1`,
      borders: {
        east_limit_name: borders.east[0], west_limit_name: borders.west[0],
        north_limit_name: borders.north[0], south_limit_name: borders.south[0],
        east_limit_description: borders.east[1], east_limit_length_char: borders.east[2],
        west_limit_description: borders.west[1], west_limit_length_char: borders.west[2],
        north_limit_description: borders.north[1], north_limit_length_char: borders.north[2],
        south_limit_description: borders.south[1], south_limit_length_char: borders.south[2],
      },
      location: {
        city, region: 'منطقة الرياض', city_l1: AR[city] || city, district: where,
        latitude: String(lat), longitude: String(lng), district_l1: AR[where] || where,
        postal_code: postal, street_name: street, building_number: building, additional_number: additional,
      },
      utilities: { Sewerage: true, Electricity: true, 'Water Supply': true },
      seller_info: { name: U.name, email: U.email },
      license_info: { end_date: regaEnd, start_date: regaStart, ad_license_number: String(license), fal_license_number: null },
      utilities_l1: { 'مياه': true, 'كهرباء': true, 'صرف صحي': true },
      property_specs: {
        price, area_size: size, listing_type: type, listing_usages: [], listing_type_l1: T.ar,
        number_of_rooms: beds, listing_usages_l1: [], advertisement_type: P.ad, advertisement_type_l1: P.ad_l1,
      },
      additional_info: {
        notes: null, channels: ['Licensed Platform'], channels_l1: ['منصة مرخصة'], deed_number: deed,
        land_number: `${240 + i}/12`, listing_age: 'New', plan_number: String(2150 + i), rer_borders: [],
        listing_face: 'Northern', street_width: 20, listing_age_l1: 'جديد', land_total_rent: null,
        listing_face_l1: 'شمالية', rer_constraints: null, is_listing_pawned: false, borders_and_lengths: null,
        is_listing_constrained: false, obligations_on_listing: 'لا يوجد', guarantees_and_duration: '',
        responsible_employee_name: employee, location_description_on_moj_deed: onDeed,
        responsible_employee_phone_number: localMobile, compliance_with_saudi_building_code: null,
      },
      /* row 2's job — see harness/fixtures.mjs. Not a key Surge sends; it is
         the one listing-purpose.js:346 reads for the "Expiring on" popover */
      ...(pl0.rega_info?.rega_details?.expiry_date && { expiry_date: pl0.rega_info.rega_details.expiry_date }),
    };
    const advertisement = {
      notes: null,
      borders: {
        eastLimitName: borders.east[0], westLimitName: borders.west[0], northLimitName: borders.north[0], southLimitName: borders.south[0],
        eastLimitLengthChar: borders.east[2], westLimitLengthChar: borders.west[2],
        eastLimitDescription: borders.east[1], northLimitLengthChar: borders.north[2],
        southLimitLengthChar: borders.south[2], westLimitDescription: borders.west[1],
        northLimitDescription: borders.north[1], southLimitDescription: borders.south[1],
      },
      endDate: regaEnd,
      adSource: 'REGA',
      channels: ['منصة مرخصة'],
      isHalted: false,
      isPawned: false,
      location: {
        city: AR[city] || city, cityId: uuid(hid(city, 0), 1), region: 'منطقة الرياض', street,
        cityCode: String(21000 + hid(city, 0) % 900), district: AR[where] || where,
        latitude: String(lat), regionId: uuid(2, 2), longitude: String(lng),
        districtId: uuid(hid(where, 0), 3), postalCode: postal, regionCode: '1',
        districtCode: String(1000 + hid(where, 0) % 9000), buildingNumber: building, additionalNumber: additional,
      },
      deedNumber: deed,
      isTestment: false,
      landNumber: `${240 + i}/12`,
      planNumber: String(2150 + i),
      /* the owner's rows send [], the staff account's four empty border slots;
         rows 5–8 take the staff form so both are served (the product reads neither) */
      rerBorders: i >= 5 ? Array.from({ length: 4 }, () => ({ type: null, length: null, direction: null })) : [],
      phoneNumber: localMobile,
      propertyAge: 'جديد',
      streetWidth: 20,
      adLicenseUrl: regaDetails.url,
      advertiserId: '1098765432',
      creationDate: regaStart,
      propertyArea: size,
      propertyFace: 'شمالية',
      propertyType: T.ar,
      isConstrained: false,
      numberOfRooms: beds,
      propertyPrice: price,
      advertiserName: U.name_l1,
      landTotalPrice: null,
      propertyUsages: [],
      rerConstraints: null,
      adLicenseNumber: String(license),
      redZoneTypeName: 'غير مصنفة',
      advertisementType: rent ? 'إيجار' : 'بيع',
      propertyUtilities: ['كهرباء', 'مياه', 'صرف صحي'],
      titleDeedTypeName: 'صك إلكتروني',
      landTotalAnnualRent: null,
      mainLandUseTypeName: 'سكني',
      responsibleEmployeeName: employee,
      obligationsOnTheProperty: 'لا يوجد',
      ownershipTransferFeeType: null,
      guaranteesAndTheirDuration: '',
      locationDescriptionOnMOJDeed: onDeed,
      responsibleEmployeePhoneNumber: localMobile,
      brokerageAndMarketingLicenseNumber: U.license.number,
      complianceWithTheSaudiBuildingCode: null,
    };

    const feature = (fid, slug, label, label_l1) => ({
      id: fid, slug, label, value: 'Yes', label_l1, value_l1: 'نعم', format_type: 'checkbox',
      dynamic_section: { id: 31, name: 'Main Features', slug: 'main-features', name_l1: 'الميزات الرئيسية', display_order: 1, secondary_display_order: 1 },
    });
    const n = (v) => option(100 + v, String(v), String(v), String(v));
    const dynamic_fields = {
      age: option(1, 'new', 'New', 'جديد'),
      area: size,
      ...(beds > 0 && { beds: n(beds) }),
      face: staffLike ? option(4, 'western', 'Western', 'غربية') : option(1, 'northern', 'Northern', 'شمالية'),
      ...(baths > 0 && { baths: n(baths) }),
      id_type: 1,
      features: [
        feature(201, 'electricity', 'Electricity', 'كهرباء'),
        feature(202, 'water-supply', 'Water Supply', 'مياه'),
        feature(203, 'sewerage', 'Sewerage', 'صرف صحي'),
        staffLike ? feature(212, 'lawn-or-garden', 'Lawn or Garden', 'حديقة') : feature(204, 'private-parking', 'Private Parking', 'موقف خاص'),
      ].slice(0, featuresSelected),
      area_unit: option(2, 'square-meters', 'Square Meters', 'متر مربع'),
      /* a holiday home is let furnished; the staff account also sends the
         flag as a boolean beside the option */
      furnished: dailyJob ? option(1, 'yes', 'Yes', 'نعم') : option(2, 'no', 'No', 'لا'),
      is_furnished: dailyJob,
      sale_type: { ...option(1, 'initial-sale', 'Initial Sale', 'بيع أولي'), value_l1: null },
      is_verified: false,
      floor_number: type === 'Floor' ? 1 : 0,
      otp_attempts: pl0.otp_attempts ?? 0,
      ...(hasRega && { rega_details: {
        ai_data: {
          title: { ar: titleAr, en: titleEn },
          description: { ar: descAr, en: descEn },
        },
        isValid: true,
        message: null,
        advertisement,
      } }),
      /* the real API carries both purposes' fields (its rent listing sends a
         sale_type) — on a sale row these are the form's untouched defaults */
      rental_price: rent ? String(price) : '',
      advertiser_id: '1098765432',
      built_up_area: size,
      campaign_type: { ...option(1, 'by-staff', 'By Staff', 'بواسطة الموظفين'), value_l1: null },
      is_bi_approved: true,
      is_installment: false,
      license_number: U.license.number,
      rent_frequency: P.slug === 'daily-rental'
        ? { ...option(1, 'daily', 'Daily', 'يومي'), value_l1: null }
        : { ...option(3, 'yearly', 'Yearly', 'سنوي'), value_l1: null },
      residence_type: staffLike
        ? { ...option(2, 'family', 'Family', 'عائلات'), value_l1: null }
        : { ...option(1, 'open-to-all', 'Open to All', 'مفتوح للكل'), value_l1: null },
      area_unit_value: size,
      completion_status: { ...option(1, 'ready', 'Ready', 'جاهز'), value_l1: null },
      is_contact_hidden: false,
      is_photo_verified: false,
      is_posted_on_rega: hasRega,
      is_video_verified: false,
      auto_generated_title: false,
      is_location_editable: false,
      possession_available: true,
      apply_refresh_by_default: false,
      title_translation_enabled: true,
      auto_generated_description: false,
      description_translation_enabled: true,
      ...(bookedDates && { additional_details: { booked_dates: bookedDates } }),
      /* the MOT permit's CR number and the national short address */
      ...(dailyJob && { legal_id: crNumber, national_address: nationalAddress }),
    };

    /* AUTO-RENEW. The staff account sends auto_renewable_item as
       { id, renewing_on: 'YYYY-MM-DD' } — on the listing and on the product
       it renews — where the owner's sends {} everywhere. The product reads
       ONLY the basic-listing's copy (bayut/transformers/listings.js
       listingMapper → platforms.auto_renewable_item.isApplied = !!id, and
       platformMapper → renewing_on), and on Bayut KSA desktop draws nothing
       from it: the Timeline's second date and its AUTO-RENEW switch are both
       gated off (constants.js HIDE_AUTO_RENEWAL, HIDE_TIMELINE_DATA). Where
       it shows is the MOBILE card, whose second date is not gated:
       "Renewing on <date>" in place of "Expiring on <date>"
       (listingCard.js:69, getDateFieldsByStatus). Row 5's job is its
       six-action row, so its Timeline is free to renew — on the day it
       would otherwise expire. */
    const autoRenew = i === 5 ? { id: 64100 + i, renewing_on: expiry } : null;
    /* the base's own auto-renew (row 3's applied Signature) in the same
       shape: an id, and a date rather than a timestamp */
    const renewShape = (a) => (a?.renewing_on ? { id: a.id ?? 64000 + i, renewing_on: iso(new Date(a.renewing_on)) } : {});

    /* products: the base row decides applied / applicable / requested; the
       real API adds titles and the dates the popovers print */
    const products_information = pl0.products_information.map((p) => {
      const [title, title_l1] = PRODUCT_TITLES[p.slug];
      const requested = p.status === 'requested';
      const applied = p.is_applied && !requested;
      const end = requested ? iso(day(-3))                               /* the booked shoot date */
        : applied ? iso(p.expiry_date ? new Date(p.expiry_date) : day(-28)) : null;
      const start = requested ? stamp(day(2), i)
        : applied ? stamp(p.slug === 'basic-listing' ? posted : day(9), i) : null;
      return {
        slug: p.slug,
        title,
        status: p.status ?? null,
        end_date: end,
        title_l1,
        till_date: end,
        is_applied: p.is_applied,
        start_date: start,
        platform_id: 1,
        is_applicable: p.is_applicable,
        auto_renewable_item: p.slug === 'basic-listing' && autoRenew ? autoRenew : renewShape(p.auto_renewable_item),
      };
    });

    const url = `https://www.bayut.sa/en/property/details-${id}.html`;
    const url_l1 = `https://www.bayut.sa/property/details-${id}.html`;
    const source = 'profolio_web_desktop';
    const statusObj = STATUS[pl0.status.slug] || STATUS.active;

    return {
      id,
      url,
      phone: null,
      price,
      title: titleEn,
      booked: !!bookedDates?.length,
      health,
      images,
      source,
      url_l1,
      videos: [],
      project: null,
      unit_no: null,
      latitude: lat,
      legal_id: mot ? crNumber : null,
      location,
      title_l1: titleAr,
      trucheck: { is_applied: false, is_applicable: live, current_trucheck: {} },
      whatsapp: null,
      longitude: lng,
      posted_at: stamp(posted, i),
      posted_by: {
        id: U.id,
        name: U.name,
        agency: { id: AGENCY.id, name: AGENCY.name, logo_url: '' },   /* the agency has no logo */
        name_l1: U.name_l1,
        profile_image: '',                                             /* nor the user a photo — see AVATAR */
        license_number: null,
        platform_mapping: { ksa: { mapped: true, external_id: USER_UUID, platform_id: 1 } },
      },
      ad_license: license,
      description: descEn,
      external_id: id,
      mot_details: mot || {},                                           /* {} on a listing with no MOT permit, as Surge sends it */
      actual_price: actualPrice,
      dynamic_data: { dynamic_fields },
      social_media: [],
      wafi_license: null,
      permit_number: mot ? mot.permit_number : null,
      description_l1: descAr,
      discount_value: actualPrice - price,
      residence_type: staffLike ? { id: 2, name: 'Family', slug: 'family', name_l1: 'عوائل' } : { id: 1, name: 'Open to All', slug: 'open-to-all', name_l1: 'مفتوح للجميع' },
      listing_quality,
      discount_applied: discounted,
      listing_category: category,
      rejection_reason: l.rejection_reason
        ? l.rejection_reason.map((reason) => ({ reason, reason_l1: {
            'Images do not match the property': 'الصور لا تطابق العقار',
            'Price is outside the expected range': 'السعر خارج النطاق المتوقع',
          }[reason] ?? reason }))
        : [{ reason: null, reason_l1: null }],                         /* what Surge sends for a listing never rejected */
      platform_listings: [{
        id: pl0.id,
        url,
        score,
        health,
        source,
        status: statusObj,
        url_l1,
        platform: { id: 1, slug: 'bayut', title: 'KSA' },               /* drawerListingDetail.js:206 keys on exactly this */
        extension: null,
        is_posted: live,
        posted_at: stamp(posted, i),
        rega_info: { rega_details: hasRega ? regaDetails : {}, expiry_message: '' },
        created_at: stamp(day(postedDays + 1), i + 3),
        listing_id: id,
        updated_at: stamp(posted, i + 5),
        disposition: disposition(dispSlug),
        expiry_date: expiry,
        show_on_web: live,
        contact_details: {
          id: U.id, name: U.name, email: U.email, phone: null, mobile: U.mobile, name_l1: U.name_l1, whatsapp: U.mobile,
        },
        platform_listing_id: pl0.platform_listing_id,
        products_information,
      }],
      additional_details: bookedDates ? { booked_dates: bookedDates } : null,
      is_offplan_listing: false,
      auto_renewable_item: autoRenew || {},
      discount_applicable: l.discount_applicable,
      discount_percentage: discounted ? '5.00' : '0.00',
      project_detail_card: null,
      is_location_editable: false,
      is_unit_type_listing: false,
      ad_license_expiry_date: hasRega ? regaEnd : null,
      residence_type_applicable: true,
      title_translation_enabled: true,
      maximum_discount_threshold: 20,
      minimum_discount_threshold: 0.1,
      description_translation_enabled: true,

      /* ── not in the real shape, kept for a row's job ───────────────────── */
      /* (rows 4 and 9 used to carry a root listing_purpose here for Mark as
         Booked; they are daily rentals by category now — see dailyJob) */
      /* row 7: platformActions.js:47 — the OTP modal needs both */
      ...(dispSlug === 'pending-otp-verification' && { is_otp_required: true, phone_number: U.mobile }),
    };
  };

  const rows = base.map(toReal);

  /* ── mode 'projects': the real account's other row design ───────────────
     Eight of the real account's ten rows are PROJECT UNIT-TYPE listings
     (data/live/listings.real.capture.json rows 2–9): an off-plan unit sold
     from a developer's project. The product draws them differently on every
     axis (utils/listingUtilities.js UNIT_TYPE_EXCLUDED_PRODUCTS,
     helpers/unitTypeListing.js, listing-purpose.js):
       · 3 upgrade circles — no photography / videography / drone, the unit
         does not physically exist yet
       · no TruCheck row action, so 5 actions
       · "Apartment for Sale | Off-plan" — the project's state in the tag
       · the project name on the end of the location → a two-line location
       · the WAFI licence (when the project has one) instead of a REGA ID,
         and no REGA expiry line in the Timeline
     and the rows come out ~170px. The answer mirrors the real list: the plain
     row 0 first, then an MOT-permitted daily rental (the real row 1 — "Night",
     "Permit No:", no REGA), then eight units from three invented projects. */
  const fakeBase = ({ id, i, title, location, images, price, area, beds, baths, product = 'basic', score, postedDays, daily = false }) => {
    const applied = (slug) => slug === 'basic-listing' || slug === `${product}-listing`;
    return {
      id, price, _daily: daily, discount_applicable: true,
      posted_at: day(postedDays).toISOString(),
      health: {
        age: postedDays, age_percentage_score: postedDays > 14 ? 40 : 80, age_classification: postedDays > 14 ? 'low' : 'high',
        exterior_images_count: Math.min(images, 3), exterior_images_percentage_score: images >= 3 ? 38 : 0,
        interior_images_count: Math.max(0, images - 3), interior_images_percentage_score: images > 3 ? 40 : 0,
        duplicate_percentage_score: 100, unique_images_count: images, unique_images_percentage_score: images ? 100 : 0,
        unique_images_classification: images ? 'high' : 'low',
        features_percentage_score: 25, features_classification: 'low', overall_percentage_score: score,
      },
      platform_listings: [{
        id: 9910000 + i, platform_listing_id: id, status: { slug: 'active' }, disposition: { slug: 'live' },
        products_information: ['basic-listing', 'hot-listing', 'signature-listing', 'refresh',
          'photography-service', 'videography-service', 'drone-footage-service']
          .map((slug) => ({ slug, is_applied: applied(slug), is_applicable: !applied(slug), status: null })),
      }],
      _row: { title, location, images, price: String(price), area: `${area} Sq. M.`, beds, baths, bayutId: String(id), regaId: null },
    };
  };

  const DEVELOPERS = [
    { id: 5301, name: 'Tilal Najd Real Estate Development', name_l1: 'تلال نجد للتطوير العقاري', logo_url: '' },
    { id: 5302, name: 'Raseen Development Company', name_l1: 'شركة رصين للتطوير', logo_url: '' },
  ];
  /* invented projects, all in North Riyadh */
  const PROJECTS = {
    ruba: { id: 7101, name: 'Ruba Heights', district: 'Al Narjis', status: 'off_plan', completion: '2028-06-30', wafi: '81234567', units: 240, dev: 0 },
    qamar: { id: 7102, name: 'Qamar Residences', district: 'Al Arid', status: 'off_plan', completion: '2027-12-31', wafi: '81239904', units: 180, dev: 0 },
    dana: { id: 7103, name: 'Dana Gardens', district: 'Al Qirawan', status: 'ready', completion: '2026-03-31', wafi: null, units: 96, dev: 1 },
  };
  /* project · unit type (en, ar) · category · beds · baths · m² · price · images · quality % */
  const UNITS = [
    ['ruba', 'Studio Apartment - Type S1', 'استوديو - نموذج S1', 'Apartment', 'Studio', 1, 48, 520000, 7, 38],
    ['ruba', '1 Bedroom Apartment - Type A', 'شقة غرفة واحدة - نموذج A', 'Apartment', 1, 1, 74, 690000, 6, 41],
    ['ruba', '2 Bedroom Apartment - Type B', 'شقة غرفتين - نموذج B', 'Apartment', 2, 2, 112, 980000, 8, 36],
    ['qamar', '2 Bedroom Apartment - Type B2', 'شقة غرفتين - نموذج B2', 'Apartment', 2, 3, 124, 1090000, 5, 44],
    ['qamar', '3 Bedroom Apartment - Type C', 'شقة ثلاث غرف - نموذج C', 'Apartment', 3, 3, 158, 1420000, 0, 29],
    ['dana', '3 Bedroom Villa - Type V3', 'فيلا ثلاث غرف - نموذج V3', 'Villa', 3, 4, 260, 2150000, 9, 47],
    ['dana', '4 Bedroom Villa - Type V4', 'فيلا أربع غرف - نموذج V4', 'Villa', 4, 5, 310, 2690000, 6, 45],
    ['qamar', '1 Bedroom Apartment - Type A1', 'شقة غرفة واحدة - نموذج A1', 'Apartment', 1, 1, 70, 640000, 4, 33],
  ];
  const PROJECT_PHONE = '+966920004512';                           /* invented sales line, 13 chars like the real one */
  const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const projectImage = (p, n) => {
    const src = `/harness-img/project-${p.id}-${n}.svg`;
    return { id: uuid(p.id, 10 + n), uuid: uuid(p.id, 20 + n), order: n,
      sizes: { full: src, large: src, small: src, medium: src, thumbnail: src }, status: 'done', filename: uuid(p.id, 30 + n) };
  };

  const unitRow = ([key, unitName, unitName_l1, type, beds, baths, size, price, images, score], k) => {
    const p = PROJECTS[key];
    const dev = DEVELOPERS[p.dev];
    const id = 88241001 + k;
    const studio = beds === 'Studio';
    const row = toReal(fakeBase({
      id, i: 20 + k, title: `${type} for Sale`, location: `Riyadh, North Riyadh, ${p.district}, ${p.name}`,
      images, price, area: size, beds: studio ? 0 : beds, baths, score, postedDays: 12 + k * 2,
    }), 20 + k);
    const offPlan = p.status === 'off_plan';
    const phaseId = p.id * 10 + 1;
    const unitsOfProject = UNITS.filter((u) => u[0] === key);
    return {
      ...row,
      phone: PROJECT_PHONE,
      whatsapp: PROJECT_PHONE,
      title: `${unitName} in ${p.name}, ${p.district}`,
      title_l1: `${unitName_l1} في ${AR[p.name]}، ${AR[p.district]}`,
      project: {
        id: p.id,
        phone: PROJECT_PHONE,
        title: p.name,
        images: Array.from({ length: 6 }, (_, n) => projectImage(p, n)),
        progress: { id: p.id * 10, date: iso(day(20)), progress_title: null, progress_title_l1: null, completion_percentage: '' },
        title_l1: AR[p.name],
        whatsapp: PROJECT_PHONE,
        developer: dev,
        map_image: {},
        payment_plans: [],
        property_types: unitsOfProject.map((u, n) => ({ id: p.id * 100 + n, title: u[1], title_l1: u[2], floor_plans: [projectImage(p, 40 + n)] })),
        geographical_zones: [],
        project_classification: 'high',
      },
      unit_no: null,
      location: {
        ...row.location,
        slug: `${slugify(p.name)}-${phaseId}`,                      /* a project's location has a slug; a district's does not */
        id: phaseId, level: 7, loc_7: phaseId,
      },
      trucheck: { is_applied: false, is_applicable: false, current_trucheck: {} },
      wafi_license: p.wafi,
      dynamic_data: { dynamic_fields: {
        ...row.dynamic_data.dynamic_fields,
        ...(studio && { beds: option(100, 'studio', 'Studio', 'استوديو') }),
        completion_status: offPlan
          ? { ...option(2, 'offplan', 'Off-Plan', 'على الخارطة'), value_l1: null }
          : row.dynamic_data.dynamic_fields.completion_status,
      } },
      is_offplan_listing: offPlan,
      project_detail_card: {
        project: { name: p.name, image: projectImage(p, 0).sizes.thumbnail, status: p.status, name_l1: AR[p.name],
          total_units: p.units, completion_date: p.completion, wafi_license: p.wafi },
        unit_type: { total_units: 12 + (k * 7) % 30, name: unitName, name_l1: unitName_l1 },
      },
      is_unit_type_listing: true,
    };
  };

  const dailyChalet = toReal(fakeBase({
    id: 88239105, i: 11, title: 'Chalet for Daily Rental', location: 'Riyadh, North Riyadh, Al Aqiq',
    images: 14, price: 1450, area: 600, beds: 3, baths: 4, product: 'hot', score: 52, postedDays: 6, daily: true,
  }), 11);
  const projectRows = [rows[0], dailyChalet, ...UNITS.map(unitRow)];

  /* A tab is a query on the platform listing's status
     (`f[nested.platform_listings.status.slug]`), so every row a tab answers
     carries that tab's status — the base served live rows under Draft. The
     SETS are the base's: the first N rows, N from the summary. */
  const restamp = (row, slug, dispSlug) => ({
    ...row,
    platform_listings: row.platform_listings.map((pl) => ({
      ...pl, status: STATUS[slug], disposition: disposition(dispSlug), is_posted: false, show_on_web: false,
      /* a draft was never posted, so it holds no ad slot and no upgrade */
      ...(slug === 'draft' && { products_information: pl.products_information.map((p) => (
        p.is_applied ? { ...p, is_applied: false, is_applicable: true, status: null, end_date: null, till_date: null, start_date: null } : p)) }),
    })),
  });
  const TAB = {
    active: () => rows,
    draft: () => rows.slice(0, SUMMARY.draft).map((r) => restamp(r, 'draft', 'not-posted')),
    pending: () => rows.slice(0, SUMMARY.pending).map((r) => restamp(r, 'pending', 'ad-in-review')),
    removed: () => [],
  };

  /* the drawer reads /edit: same listing, minus the rent-only defaults a sale
     row carries (drawerListingDetail.js prints rent_frequency beside the
     price whenever it is present) */
  const forDrawer = (row) => {
    if (row.listing_category.purpose_hash.slug !== 'sale') return row;
    const { rent_frequency, rental_price, ...fields } = row.dynamic_data.dynamic_fields;
    return { ...row, dynamic_data: { dynamic_fields: fields } };
  };

  /* ── ad licence requests ─────────────────────────────────────────────────
     The staff account's shape (data/api-shapes.b.json): a flat request with
     the pin as STRINGS (8 and 9 characters), a location whose lat/lng are
     NUMBERS, and a `type` that is the form's Residential/Commercial choice
     (create-ad-license.js:148 `type_id: property_type`, staticLists.js:172)
     with a purpose-combined title — "Residential for Rent" is its 20
     characters, "سكني للإيجار" its 12. ad_license_number and external_id stay
     null until REGA issues the licence, as all three of the staff account's do.

     What the table draws from it (bayut/utils/listingUtilities.js:366):
     property_price + location.title + type.combined_title in the Property
     cell, deed_number, id, the stage Tag, created_at, and the Actions cell.
     AdLicenseStatus (ad-license-status.js) colours seven stages; these four
     are the lifecycle in order, newest first, each drawn differently:
       payment_pending         red   — and the ONLY stage with an action:
                                        Pay Now (ad-license-actions.js:64)
       request_confirmation    lime  — "Verifying Details", the staff
                                        account's own (20 and 17 characters)
       rega_contract_creation  blue  — "Preparing Contract"
       completed               green — the licence issued
     Not used: rega_contract_signing has NO colour in the switch, so the Tag
     would be handed the string "undefined"; ad_license_creation (gold),
     post_listing (orange) and rejected (red, as Payment Pending) are the
     other three a fifth row could carry. */
  const AD_LICENSE_TYPE = {
    residential: { id: 1, title: 'Residential', title_l1: 'سكني' },
    commercial: { id: 2, title: 'Commercial', title_l1: 'تجاري' },
  };
  const AD_LICENSE_REQUESTS = [
    /* id · stage · display name · purpose_id (1 sale, 2 rent) · type · district · price · days ago · licence */
    [22017, 'payment_pending', 'Payment Pending', 1, 'residential', 'Al Wurud', 1180000, 0, null],
    [21964, 'request_confirmation', 'Verifying Details', 2, 'residential', 'Al Masif', 85000, 3, null],
    [21902, 'rega_contract_creation', 'Preparing Contract', 1, 'commercial', 'Al Aqiq', 3400000, 9, null],
    [21815, 'completed', 'Completed', 2, 'residential', 'Al Rawabi', 62000, 24, 7201352240],
  ].map(([id, stage, stageName, purposeId, typeKey, district, price, ago, licence], k) => {
    const T = AD_LICENSE_TYPE[typeKey];
    const [lat, lng] = GEO[district];
    const created = stamp(day(ago), k);
    return {
      id,
      user_id: U.id,
      deed_number: `31${String(id * 7919).slice(-8)}${pad(k + 21)}`,     /* 12 digits, like a MOJ e-deed */
      latitude: lat.toFixed(5),
      longitude: lng.toFixed(6),
      purpose_id: purposeId,
      property_price: price,
      jarvis_stages: stage,
      jarvis_stages_display_name: stageName,
      external_id: null,
      ad_license_number: licence,
      created_at: created,
      /* the stage last moved a day or two after the request was made; an
         unpaid request has not moved at all */
      updated_at: ago ? stamp(day(ago - 1 - (k % 2)), k + 4) : created,
      location: {
        id: hid(district, 300),                 /* the same district id the listings' breadcrumbs use */
        title: district,
        title_l1: AR[district],
        level: 4,
        city_id: hid('Riyadh', 100),
        latitude: lat,
        longitude: lng,
        external_id: 10100000 + hid(district, 0),
      },
      type: {
        ...T,
        combined_title: `${T.title} for ${purposeId === 1 ? 'Sale' : 'Rent'}`,
        combined_title_l1: `${T.title_l1} ${purposeId === 1 ? 'للبيع' : 'للإيجار'}`,
      },
    };
  });

  /* TruCheck statuses — the filter drawer's "TruCheck Status" select */
  const TRUCHECK = [
    ['active', 'Active', 'نشط'], ['pending', 'Pending', 'قيد الانتظار'], ['rejected', 'Rejected', 'مرفوض'],
    ['expired', 'Expired', 'منتهي'], ['deleted', 'Deleted', 'محذوف'],
  ].map(([slug, name, name_l1], k) => ({
    id: k + 1, name, slug, name_l1,
    dispositions: [{ id: k + 1, name, name_l1, slug, description: null, description_l1: null }],
  }));

  return [
    [/^\/api\/surge\/listings\/summary$/, () => ({ summary: SUMMARY, statuses_and_dispositions: STATUSES_AND_DISPOSITIONS })],
    [/^\/api\/surge\/listings$/, (search, mode) => {
      const q = new URLSearchParams(search || '');
      const slug = q.get('f[nested.platform_listings.status.slug]') || 'active';
      const set = mode === 'projects' && slug === 'active' ? projectRows : (TAB[slug] || TAB.active)();
      const total = SUMMARY[slug] ?? SUMMARY.active;
      const pages = Math.max(1, Math.ceil(total / 10));
      const page = Math.min(pages, Math.max(1, Number(q.get('page')) || 1));
      return {
        listings: set,
        pagination: { current_page: page, next_page: page < pages ? page + 1 : null, prev_page: page > 1 ? page - 1 : null,
                      total_pages: pages, total_count: total },
        statuses_and_dispositions: STATUSES_AND_DISPOSITIONS,
      };
    }],
    [/^\/api\/surge\/listings\/\d+\/edit$/, (search, mode, pathname) => {
      const id = Number((pathname || '').match(/listings\/(\d+)\/edit/)?.[1]);
      return { listing: forDrawer(rows.find((x) => x.id === id) || projectRows.find((x) => x.id === id) || rows[0]) };
    }],
    [/^\/api\/surge\/statuses$/, () => ({ statuses: TRUCHECK })],
    /* The Ad License Requests tab (listings.js:133, one call on every
       Listings load, so the tab count is always live) and the mobile card's
       ad-license branch (listingCard.js:214). The owner account has never
       requested one; the staff account has three, so the tab is a table,
       not an empty state. Four here, one per stage the product draws
       differently — the query's own filters are honoured, so the filter
       drawer's Status select narrows the list. See AD_LICENSE_REQUESTS. */
    [/^\/api\/surge\/ad_license_requests$/, (search) => {
      const q = new URLSearchParams(search || '');
      const eq = (k) => (q.get(k) ?? '').trim();
      const from = eq('q[created_at_gteq]').slice(0, 10), to = eq('q[created_at_lteq]').slice(0, 10);
      const list = AD_LICENSE_REQUESTS.filter((r) =>
        (!eq('q[id_eq]') || String(r.id) === eq('q[id_eq]')) &&
        (!eq('q[deed_number_eq]') || r.deed_number === eq('q[deed_number_eq]')) &&
        (!eq('q[jarvis_stages_eq]') || r.jarvis_stages === eq('q[jarvis_stages_eq]')) &&
        (!from || r.created_at.slice(0, 10) >= from) && (!to || r.created_at.slice(0, 10) <= to));
      const pages = Math.ceil(list.length / 10);
      const pageNo = Math.min(Math.max(1, pages), Math.max(1, Number(q.get('page')) || 1));
      return {
        ad_license_requests: list.slice((pageNo - 1) * 10, pageNo * 10),
        pagination: { current_page: pageNo, next_page: pageNo < pages ? pageNo + 1 : null,
                      prev_page: pageNo > 1 ? pageNo - 1 : null, total_pages: pages, total_count: list.length },
      };
    }],
    /* the purpose radio on /ad-license — one priced product per purpose.
       Unanswered, the page drew "Purpose" over nothing. */
    [/^\/api\/surge\/ad_license_products$/, () => ({ ad_license_products: [
      { id: 9, name: 'Ad License Sell', price: '600', purpose_id: 1 },
      { id: 10, name: 'Ad License Rent', price: '250', purpose_id: 2 },
    ] })],
    /* Property Age on /ad-license; the titles are the product's own strings (locales/en) */
    [/^\/api\/surge\/listing_age$/, () => ({ listing_ages: [
      'Less than 1 year', '1 year', '2 years', '3 years', '4 years', '5 years',
      '6 years', '7 years', '8 years', '9 years', '10 years', '10+ years',
    ].map((title, k) => ({ id: k + 1, title })) })],
    /* Publish Now on a pending-otp-verification row sends the licence OTP
       first (apis/postlisting.js:71) and opens the modal on success */
    [/^\/api\/surge\/otps$/, () => ({ reference_number: `LOTP-${day(0).getTime().toString(36).toUpperCase()}`, expires_in: 300 })],
  ];
};
