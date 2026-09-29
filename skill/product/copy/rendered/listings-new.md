# Rendered copy — listings-new

**The designer's handover — not yet the product (Profolio 2.0).** These are the build's words, not shipped copy; Arabic is not in the handover. A string beside a translation is one the product already ships.

Every string the compiled files of `pages/listings-new` draw — 65 web, 70 phone (@360) — in the order first drawn; the header and the rail are in `_shell.md`. Quote a string as it is here, with its file. `is`: **t** a translation · **t+** translations joined with values — ⟨pattern⟩: {{x}} the translation's placeholder, {n} a number ("75,000" is one), {date}, {time}, {x} a fixture value; ×N strings of one pattern; Arabic part by part · **code** drawn by the product, not in the translation files — spelled in its code or its data files (the Arabic beside it is the data file's own twin, `label` / `label_l1`; else "not in translations") · **data** the fixture's data, a mocked response or a value — not copy (copied unchanged into a design, it stays unmarked) · **note** quoted by a state note, drawn nowhere. A suffix says how the string is drawn: **(placeholder)** an input's placeholder attribute · **(value)** what a field holds, an input's or a textarea's value (the fixture's, unless a translation). The class is the first word — `t (placeholder)` is a **t** row: grep `| t |` and `| t (` for every t row. data-pf-src: without `src/`. files, per layout (web · @360): `all`, `all but` the states named, the states named, or `none`; `page` = `pages/listings-new.html` (`.mobile.html` for @360), a state = `pages/listings-new/<state>.html`.

| English | Arabic | is | data-pf-src | files |
|---|---|---|---|---|
| All | الكل | t | — | all but tab-ad-license-requests, tab-ad-license-requests-full (web and @360) |
| Low Performing | not in translations | code | — | web: all but tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| High Performing | not in translations | code | — | web: all but tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Enter Listing ID | أدخل رقم الإعلان | t (placeholder) | — | web: all but tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Listing ID | رقم الإعلان | t | — | web: all but tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| For Sale | للبيع | t | — | all web, no @360 |
| Select Property Types | حدد أنواع العقارات | t | — | web: all but tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| More Filters | بحث متقدم | t | — | web: all but tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| 1 ⟨{n}⟩ ×252 | value | data | — | all |
| Purpose: | الغرض | t | — | all web, no @360 |
| City: | المدينة | t | — | all web, no @360 |
| Riyadh | fixture: fixtures/extra.mjs | data | — | all web, no @360 |
| Clear All | not in translations | code | — | all web, no @360 |
| Active | فعال | t | — | all |
| Draft | مسودة | t | — | all |
| Pending | معلق | t | — | all |
| Removed | المحذوفة | t | — | all |
| Ad License Requests | طلبات ترخيص | t | — | all web, no @360 |
| Newest First | not in translations | code | — | web: all but empty-draft, empty-pending, empty-removed, tab-ad-license-requests +7 more · @360: sheet-sort |
| Property Details | تفاصيل العقار | t | — | web: all but tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Performance | الأداء | t | — | web: all but empty-draft, empty-pending, tab-ad-license-requests, tab-ad-license-requests-full +4 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| Quality | جودة | t | — | web: all but empty-draft, empty-pending, empty-removed, tab-ad-license-requests +7 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| Actions | الإجراءات | t | — | web: all but empty-pending, tab-pending, tab-pending-full · @360: none |
| Live | فعال | t | — | all |
| Hot | مُميز | t | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| Apartment for Sale | fixture: fixtures/listing-form.mjs | data | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +5 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +8 more |
| Al Hazm, West Riyadh | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +9 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +12 more |
| Bayut ID | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +7 more · @360: all but tab-ad-license-requests, tab-ad-license-requests-full |
| REGA ID | fixture: fixtures/listing-form.mjs | data | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +9 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +12 more |
| Posted | تمت اضافة الإعلان | t | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| 22 Days Ago ⟨{n} Days Ago⟩ ×10 | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| Last updated | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| Shared on | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| License expires in | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| 19 days ⟨{n} days⟩ ×9 | {n} + أيام | t+ | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| Views | المشاهدات | t | — | all |
| 58% ⟨{n}%⟩ ×49 | value | data | — | web: all · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +21 more |
| Clicks | الزيارات | t | — | all |
| Leads | العملاء المحتملين | t | — | all |
| Listing Ranked … of 120 similar listings ⟨Listing Ranked … of {n} similar listings⟩ ×8 | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| th | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| Top Listing is getting … more leads than yours. | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| 3.4x ⟨{n}x⟩ ×7 | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +14 more |
| Improve Listing Rank | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| Quality 31% ⟨Quality {n}⟩ ×9 | جودة + {n} | t+ | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| Add 2 Interior Images ⟨Add {n} Interior Images⟩ | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: sheet-improve-quality, sheet-improve-quality-full |
| Description too Short | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: sheet-case-everything-unfinished, sheet-improve-quality, sheet-improve-quality-full, sheet-trend-no-data |
| Add Video of your Property | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: sheet-case-everything-unfinished, sheet-improve-quality, sheet-improve-quality-full |
| +4 More Fixes ⟨{n} More Fixes⟩ ×4 | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: sheet-case-everything-unfinished, sheet-improve-quality, sheet-improve-quality-full, sheet-trend-no-data |
| Improve Quality | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +15 more |
| Apply Signature | ترقية الى اعلان استثنائي | t | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| Hot Applied | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| Services | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| 15% Off ⟨{n} Off⟩ ×3 | {n} + خصم | t+ | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| Title too Short | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| Hot Listing | الإعلان مميّز | t | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| Yesterday | أمس | t | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| nd | not in translations | code | — | web: all but drawer-rank-updating, empty-active, empty-draft, empty-filter +14 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| Top listing is getting … more leads than yours. | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| TruCheck Verification Missing ⟨TruCheck Verification {x}⟩ | ترو تشيك + تَحَقّق + {x} | t+ | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| Add 1 more Interior Image ⟨Add {n} more Interior Image⟩ | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: sheet-amenities, sheet-amenities-full, sheet-performance, sheet-performance-full +7 more |
| Add 3 more Features and Amenities ⟨Add {n} more Features and Amenities⟩ | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-performance +9 more |
| Booked | محجوزة | t | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| Night | ليلة | t | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +7 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +12 more |
| Apartment for Daily Rental ⟨{x} for Daily Rental⟩ | {x} + للإيجار اليومي | t+ | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +9 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +12 more |
| Abu Markha, Madinah | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +9 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +12 more |
| You are getting … more leads than the area average. | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| View Performance Details | عرض + الأداء + التفاصيل | t+ | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| Add 3 more Interior Images ⟨Add {n} more Interior Images⟩ ×2 | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: sheet-case-daily-rental, sheet-case-low-impression-high-conversion |
| 12 Minutes Ago ⟨{n} Minutes Ago⟩ | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| Your rank against similar listings will be available within 1 hour. ⟨Your rank against similar listings will be available within {n} hour.⟩ | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: sheet-trend-no-data |
| Add 4 more Images ⟨Add {n} more Images⟩ ×2 | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: sheet-case-everything-unfinished, sheet-trend-no-data |
| Apartment \| Off-Plan \| Initial sale | fixture: fixtures/listing-form.mjs | data | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +11 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +14 more |
| Dhahrat Laban, West Riyadh | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +11 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +14 more |
| Wafi License | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +11 more · @360: all but tab-ad-license-requests, tab-ad-license-requests-full |
| 1 Day Ago ⟨{n} Day Ago⟩ | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| Add the payment plan | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: sheet-case-off-plan |
| Today | اليوم | t | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| Make sure your listing quality is excellent to climb ranks. | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| Add more listing description | value | data | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: sheet-case-just-posted |
| Signature | استثنائي | t | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| st | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| Perfect Quality Score | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| Keep it fresh to maintain the rank, so buyers keep seeing it at the top. | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| Signature Applied | تم تعيين كاعلان استثنائي | t | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| You convert … better than the area average, it just isn't being seen. | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: none |
| Boost Visibility | not in translations | code | — | web: all but empty-active, empty-draft, empty-filter, empty-pending +13 more · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| How to Earn Quality Score? | not in translations | code | — | all |
| Listing Rank | اعلان + ترتيبك | t+ | — | all |
| Every listing is placed in a line-up of its similar listings: same property type, same purpose (sale / rent / daily rental), same area. The order is set by how often each one is seen by people searching on Bayut. | not in translations | code | — | all |
| A listing | not in translations | code | — | all |
| Seen the most, ranked 1st | not in translations | code | — | all |
| Seen the least, ranked last | not in translations | code | — | all web, no @360 |
| Lower is better | not in translations | code | — | all |
| 1st means seen the most | not in translations | code | — | all |
| Once a day | not in translations | code | — | all |
| The order is recalculated daily | not in translations | code | — | all |
| After day one | not in translations | code | — | all |
| A new listing gets its first rank once it has been live a day | not in translations | code | — | all |
| Similar listings, Top & Average | not in translations | code | — | all |
| Similar listings are the real competition: same type, purpose and area. Inside that group, two markers matter. | not in translations | code | — | all |
| Average | not in translations | code | — | all |
| Top listing | value | data | — | all |
| Fewer views, clicks and leads | not in translations | code | — | all web, no @360 |
| More | المزيد | t | — | all |
| Top listing: the single best performer in the group, the benchmark to beat. | not in translations | code | — | all |
| Average: the typical listing in the group. Above it beats most of the competition. | not in translations | code | — | all |
| Fair comparison, per day | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| A week-old listing is never compared against someone's year of history. Every comparison uses a daily average: total divided by days live. | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| A NEW LISTING | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| 2.5x better ⟨{n}x better⟩ | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| 1,400 views ⟨{n} views⟩ ×2 | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| / 7 days ⟨/ {n} days⟩ ×2 | {n} + أيام | t+ | — | web: all · @360: all but sheet-quality-score |
| views a day | not in translations | code | — | all web, no @360 |
| AN OLD LISTING | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| 17x the total ⟨{n}x the total⟩ | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Views, Clicks & Leads | المشاهدات + الزيارات + العملاء المحتملين | t+ | — | web: all · @360: all but sheet-quality-score |
| Times people opened your listing page. | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| click rate | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Times people tapped it in search results. | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| lead rate | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Calls, WhatsApp, email and SMS combined. | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| The gaps are the useful part: many views but few clicks points at the cover photo and price, many clicks but few leads points at the detail inside. | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Counters are live. Rank and comparisons refresh once a day, and the "as of" time shows the last update. | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Quality Score | نقاط الجودة | t | — | web: all · @360: all but sheet-quality-score |
| Scored out of 100 ⟨Scored out of {n}⟩ | not in translations | code | — | all web, no @360 |
| A score for how complete and attractive a listing is. It only measures what you control, so fixing an issue always moves it up. A higher score builds buyer trust and helps the listing perform better in search. | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| 0 to 45 ⟨{n} to {n}⟩ ×2 | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Needs work, fix the listed issues | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Getting there, a few gaps left | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Above 70 ⟨Above {n}⟩ | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Healthy, keep it fresh | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Component and pillar | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Weight | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| What earns full points | not in translations | code | — | all web, no @360 |
| Images | الصور | t | — | web: all · @360: all but sheet-quality-score |
| Media | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| 4 interior + 2 exterior, no duplicates ⟨{n} interior + {n} exterior, no duplicates⟩ | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Amenities | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Relevance | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| 6 or more selected ⟨{n} or more selected⟩ | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Description | وصف الإعلان | t | — | web: all · @360: all but sheet-quality-score |
| Content | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| 150 to 400 words ⟨{n} to {n} words⟩ | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Title | عنوان الإعلان | t | — | web: all · @360: all but sheet-quality-score |
| 10 to 14 words: type + feature + location ⟨{n} to {n} words: type + feature + location⟩ | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| TruCheck | ترو تشيك | t | — | web: all · @360: all but sheet-quality-score |
| Trust | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Listing verified (drafts: applies when live) | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Video | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| A YouTube walkthrough | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Total | الإجمالي | t | — | web: all · @360: all but sheet-quality-score |
| Six components, 100 points ⟨Six components, {n} points⟩ | not in translations | code | — | all web, no @360 |
| Boost your score | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Your top quick wins, ranked by biggest gain for the least effort. Each one shows exactly how many points it's worth. Use Fix to sort it right here without leaving the page. | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Recoverable on this listing | not in translations | code | — | all web, no @360 |
| Add 2 interior images ⟨Add {n} interior images⟩ | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Fix | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Lengthen the description | not in translations | code | — | web: all · @360: all but sheet-quality-score |
| Filters | فلاتر البحث | t | — | web: all · @360: sheet-filters, sheet-filters-full |
| Apply filters to organize data accordingly | قم بتطبيق عوامل التصفية لتنظيم البيانات وفقًا لذلك | t | — | all web, no @360 |
| Posted On | تم النشر في | t | — | web: all · @360: sheet-filters, sheet-filters-full |
| Select Date Range | حدد النطاق الزمني | t | — | web: all · @360: sheet-filters, sheet-filters-full |
| City | المدينة | t | — | web: all · @360: all but tab-ad-license-requests, tab-ad-license-requests-full |
| Location | الموقع | t | — | web: all · @360: sheet-filters, sheet-filters-full |
| Select Location | حدد الموقع | t | — | web: all · @360: sheet-filters, sheet-filters-full |
| Posted By | تم النشر بواسطة | t | — | web: all · @360: sheet-filters, sheet-filters-full |
| Select Users | حدد المستخدمين | t | — | web: all · @360: sheet-filters, sheet-filters-full |
| TruCheck Status | حالة تروتشيك | t | — | web: all · @360: sheet-filters, sheet-filters-full |
| Select TruCheck Status | اختر حالة تروتشيك | t | — | web: all · @360: sheet-filters, sheet-filters-full |
| Show Discounted Listings Only | عرض الإعلانات المخفضة فقط | t | — | web: all · @360: sheet-filters, sheet-filters-full |
| Price Range | نطاق السعر | t | — | web: all · @360: sheet-filters, sheet-filters-full |
| Reset | إعادة ضبط | t | — | web: all · @360: sheet-location-no-match, sheet-location-search |
| Min | دقيقة | t (placeholder) | — | all web, no @360 |
| To | not in translations | code | — | all web, no @360 |
| Max | الأعلى | t (placeholder) | — | all web, no @360 |
| [riyal]0 ⟨[riyal]{n}⟩ ×3 | value | data | — | web: all · @360: sheet-delete, sheet-trucheck, sheet-trucheck-rejected |
| [riyal]10,000,000+ ⟨[riyal]{n}+⟩ | value | data | — | all web, no @360 |
| Area Range | نطاق المساحة | t | — | web: all · @360: sheet-filters, sheet-filters-full |
| Sq. M | value | data | — | web: all · @360: sheet-filters, sheet-filters-full |
| 0 Sq. M ⟨{n} Sq. M⟩ | value | data | — | all web, no @360 |
| 10,000+ Sq. M ⟨{n}+ Sq. M⟩ | value | data | — | all web, no @360 |
| Reset Filters | اعادة ضبط الفلاتر | t | — | web: all · @360: sheet-filters, sheet-filters-full |
| Search | ابحث | t | — | web: all · @360: sheet-filters, sheet-filters-full |
| Low | منخفض | t | — | web: none · @360: all but tab-ad-license-requests, tab-ad-license-requests-full |
| High | مرتفع | t | — | web: none · @360: all but tab-ad-license-requests, tab-ad-license-requests-full |
| REGA Ad License ⟨{x} Ad License⟩ | {x} + رخصة الإعلان | t+ | — | web: none · @360: all but tab-ad-license-requests, tab-ad-license-requests-full |
| Purpose | الغرض | t | — | web: none · @360: all but tab-ad-license-requests, tab-ad-license-requests-full |
| Property Type | نوع العقار | t | — | web: none · @360: all but tab-ad-license-requests, tab-ad-license-requests-full |
| Ad License | رخصة الإعلان | t | — | all @360, no web |
| ↑19% ⟨↑{n}%⟩ ×10 | value | data | — | web: none · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| ↓10% ⟨↓{n}%⟩ ×8 | value | data | — | web: none · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| of 240 ⟨of {n}⟩ ×8 | not in translations | code | — | web: none · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| What decides your listing rank | not in translations | code | — | web: none · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| Views, leads and listing quality all count. See how the order is worked out. | not in translations | code | — | web: none · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| Al Malqa, North Riyadh | fixture: fixtures/extra.mjs | data | — | web: tab-ad-license-requests, tab-ad-license-requests-full, tab-draft, tab-draft-full, tab-pending, tab-pending-full · @360: all but empty-active, empty-draft, empty-filter, empty-pending +10 more |
| View Performance | عرض + الأداء | t+ | — | web: none · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| Al Yasmin, North Riyadh | fixture: fixtures/payments.mjs | data | — | web: tab-draft, tab-draft-full, tab-pending, tab-pending-full · @360: all but empty-active, empty-draft, empty-filter, empty-pending +12 more |
| Rank available within 1 hour ⟨Rank available within {n} hour⟩ | not in translations | code | — | web: none · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| An Nakheel, North Riyadh | not in translations | code | — | web: none · @360: all but empty-active, empty-draft, empty-filter, empty-pending +16 more |
| Al Aqiq, North Riyadh | fixture: fixtures/listing-form.mjs | data | — | web: tab-removed, tab-removed-full · @360: all but empty-active, empty-draft, empty-filter, empty-pending +14 more |
| Rank | ترتيبك | t | — | all @360, no web |
| Competition | not in translations | code | — | all @360, no web |
| Per day | not in translations | code | — | all @360, no web |
| Metrics | not in translations | code | — | all @360, no web |
| Score | not in translations | code | — | all @360, no web |
| Boost | ترقية | t | — | all @360, no web |
| Seen the least | not in translations | code | — | all @360, no web |
| Fewer views and leads | not in translations | code | — | all @360, no web |
| a day | not in translations | code | — | web: none · @360: all but sheet-quality-score |
| Out of 100 ⟨Out of {n}⟩ | not in translations | code | — | web: none · @360: all but sheet-quality-score |
| +14 pts ⟨{n} pts⟩ ×2 | not in translations | code | — | web: none · @360: all but sheet-quality-score |
| Listing Performance | أداء الإعلان | t | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| listing photo | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: none |
| Refreshed Today | not in translations | code | — | web: drawer-amenities, drawer-case-happy-full, drawer-listing-performance, drawer-listing-performance-full +7 more · @360: none |
| Al Hazm, West Riyadh, Saudi Arabia | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-everything-unfinished +20 more · @360: none |
| Last updated Yesterday | not in translations | code | — | web: drawer-amenities, drawer-case-off-plan, drawer-case-off-plan-full, drawer-listing-performance +8 more · @360: none |
| Export as PDF | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: none |
| Listing Ranked | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: none |
| /240 ⟨/{n}⟩ ×8 | value | data | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +19 more · @360: none |
| Ranked … of 240 similar listings in Al Hazm ⟨Ranked … of {n} similar listings in Al Hazm⟩ ×8 | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +19 more · @360: none |
| Buyers are finding it but not enquiring. Trust and detail are what convert views into leads. | not in translations | code | — | web: drawer-amenities, drawer-listing-performance, drawer-listing-performance-full, drawer-menu-range +6 more · @360: none |
| Last 30 Days | آخر 30 يومًا | t | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| vs previous 30 days ⟨vs previous {n} days⟩ | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: none |
| vs Top Listing | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: none |
| ↓ 20% ⟨↓ {n}%⟩ ×22 | value | data | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +16 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +13 more |
| vs Area Average | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: none |
| ↑ 12% ⟨↑ {n}%⟩ ×11 | value | data | — | web: drawer-amenities, drawer-case-daily-rental, drawer-case-daily-rental-full, drawer-case-happy-full +14 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-happy +11 more |
| Trend | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| DATA STATE | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| Steady growth | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| Sudden drop | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| Down, then back up | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| One day spike | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| Flat | شقة | t | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| Up and down | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| Stalled after a good start | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| You vs Top | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: none |
| You vs Average | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: none |
| Oct 10 ⟨Oct {n}⟩ ×14 | value | data | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +15 more |
| Your Listing | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +15 more |
| Top Similar Listing | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: none |
| Avg Similar Listing | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: none |
| Top placement and featured styling with 1.7x more views. ⟨Top placement and featured styling with {n}x more views.⟩ | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +20 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +15 more |
| Upgrade to Signature | ترقية الى + استثنائي | t+ | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +20 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +15 more |
| Refresh your listing | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: none |
| Refresh your listing to move up in search and get seen by more buyers. | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: none |
| Refresh Listing | إعادة نشر الإعلان | t | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: none |
| 3 Fixes ⟨{n} Fixes⟩ ×3 | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +18 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +14 more |
| How it's calculated | not in translations | code | — | web: drawer-amenities, drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental +22 more · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| Get your listing TruChecked™ to build trust with buyers, boost visibility, and stand out from other listings. | not in translations | code | — | web: drawer-amenities, drawer-listing-performance, drawer-listing-performance-full, drawer-menu-range +6 more · @360: none |
| Go to App ⟨Go to {{link}}⟩ | انتقل إلى منصة بيوت | t+ | — | web: drawer-amenities, drawer-listing-performance, drawer-listing-performance-full, drawer-menu-range +6 more · @360: none |
| Add Features & Amenities | not in translations | code | — | web: drawer-amenities · @360: none |
| 0 selected ⟨{n} selected⟩ | not in translations | code | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Search amenities e.g. Balcony, Gym, Parking | not in translations | code (placeholder) | — | web: drawer-amenities · @360: none |
| Indoor | not in translations | code | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Balcony or Terrace | شرفة أو تراس | code | — | web: drawer-amenities · @360: none |
| Central A/C | fixture: fixtures/credits.mjs | data | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Built-in Wardrobes | not in translations | code | — | web: drawer-amenities · @360: none |
| Maid's Room | not in translations | code | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Built-in Kitchen | not in translations | code | — | web: drawer-amenities · @360: none |
| Laundry Room | fixture: fixtures/listing-form.mjs | data | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Study Room | not in translations | code | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Storage Room | not in translations | code | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Outdoor | fixture: fixtures/listing-form.mjs | data | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Private Pool | not in translations | code | — | web: drawer-amenities · @360: none |
| Private Garden | not in translations | code | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Covered Parking | not in translations | code | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Roof Terrace | not in translations | code | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Barbecue Area | not in translations | code | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Front Yard | not in translations | code | — | web: drawer-amenities · @360: none |
| Building | بناية | t | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Gym or Health Club | صالة رياضية | code | — | web: drawer-amenities · @360: none |
| Lift | not in translations | code | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| 24/7 Security | fixture: fixtures/listing-form.mjs | data | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Children's Play Area | not in translations | code | — | web: drawer-amenities · @360: none |
| Shared Pool | not in translations | code | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Reception | not in translations | code | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| CCTV | not in translations | code | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Waste Disposal | خدمة التخلص من النفايات | code | — | web: drawer-amenities · @360: none |
| Clear all | not in translations | code | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Apply | تطبيق | t | — | web: drawer-amenities · @360: sheet-amenities, sheet-amenities-full |
| Last updated 18 Days Ago ⟨Last updated {n} Days Ago⟩ ×5 | not in translations | code | — | web: drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental, drawer-case-daily-rental-full +6 more · @360: none |
| A weak listing is costing you both visibility and leads. Fix the three below to climb. | not in translations | code | — | web: drawer-case-all-bad, drawer-case-all-bad-full · @360: none |
| You have 9 photos but only 2 interior, Add 2 more images to increase listing health. ⟨You have {n} photos but only {n} interior, Add {n} more images to increase listing health.⟩ | not in translations | code | — | web: drawer-case-all-bad, drawer-case-all-bad-full · @360: none |
| of 50 images ⟨of {n} images⟩ | not in translations | code | — | web: drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental, drawer-case-daily-rental-full +4 more · @360: sheet-case-daily-rental, sheet-case-everything-unfinished, sheet-case-low-impression-high-conversion, sheet-improve-quality, sheet-improve-quality-full, sheet-trend-no-data |
| Cover | الغلاف | t | — | web: drawer-case-all-bad, drawer-case-all-bad-full, drawer-case-daily-rental, drawer-case-daily-rental-full +4 more · @360: sheet-case-daily-rental, sheet-case-everything-unfinished, sheet-case-low-impression-high-conversion, sheet-improve-quality, sheet-improve-quality-full, sheet-trend-no-data |
| Abu Markha, Madinah, Saudi Arabia | not in translations | code | — | web: drawer-case-daily-rental, drawer-case-daily-rental-full · @360: none |
| Nightly listings live on photos and the calendar. Two fixes lift both. | not in translations | code | — | web: drawer-case-daily-rental, drawer-case-daily-rental-full · @360: none |
| Nightly guests scan interiors first. You have 7 photos, top rentals carry 12. ⟨Nightly guests scan interiors first. You have {n} photos, top rentals carry {n}.⟩ | not in translations | code | — | web: drawer-case-daily-rental, drawer-case-daily-rental-full · @360: sheet-case-daily-rental |
| Almost nothing is filled in yet. Every fix below moves the score, and the rank with it. | not in translations | code | — | web: drawer-case-everything-unfinished, drawer-case-everything-unfinished-full · @360: none |
| Make your title 10 to 14 words with type, feature and location. ⟨Make your title {n} to {n} words with type, feature and location.⟩ | not in translations | code | — | web: drawer-case-everything-unfinished, drawer-case-everything-unfinished-full · @360: none |
| Property for Sale In Location | not in translations | code | — | web: drawer-case-everything-unfinished, drawer-case-everything-unfinished-full · @360: none |
| 1 more word for a good title, 10 is the limit ⟨{n} more word for a good title, {n} is the limit⟩ | not in translations | code | — | web: drawer-case-everything-unfinished, drawer-case-everything-unfinished-full · @360: none |
| 5 / 10 words ⟨{n} / {n} words⟩ | not in translations | code | — | web: drawer-case-everything-unfinished, drawer-case-everything-unfinished-full · @360: none |
| Auto Translate Arabic Title | not in translations | code | — | web: drawer-case-everything-unfinished, drawer-case-everything-unfinished-full · @360: none |
| Generate Title | اكتب عنوان تلقائي | t | — | web: drawer-case-everything-unfinished, drawer-case-everything-unfinished-full · @360: none |
| Perfect score. Nothing to fix. Keep it fresh so buyers keep seeing it at the top. | not in translations | code | — | web: drawer-case-happy-full, drawer-listing-performance-perfect · @360: none |
| Best | not in translations | code | — | web: drawer-case-happy-full, drawer-listing-performance-perfect · @360: sheet-case-happy |
| Nothing to fix. Keep it fresh to maintain the rank, so buyers keep seeing it at the top. | not in translations | code | — | web: drawer-case-happy-full, drawer-listing-performance-perfect · @360: none |
| Last updated Today | not in translations | code | — | web: drawer-case-just-posted, drawer-case-just-posted-full · @360: none |
| Good start. Two small fixes before the first buyers arrive will set the rank higher. | not in translations | code | — | web: drawer-case-just-posted, drawer-case-just-posted-full · @360: none |
| Your line starts tomorrow | not in translations | code | — | web: drawer-case-just-posted, drawer-case-just-posted-full, drawer-case-rank-pending, drawer-case-rank-pending-full · @360: sheet-case-just-posted |
| Dashed lines are today's top and average in Al Hazm | not in translations | code | — | web: drawer-case-just-posted, drawer-case-just-posted-full, drawer-case-rank-pending, drawer-case-rank-pending-full · @360: sheet-case-just-posted |
| Your Description is 84 words. Top ranking listings in Al Hazm have 150 - 400 words. ⟨Your Description is {n} words. Top ranking listings in Al Hazm have {n} - {n} words.⟩ | not in translations | code | — | web: drawer-case-just-posted, drawer-case-just-posted-full · @360: none |
| This studio apartment is available for rent in the vibrant neighborhood of Al Olaya, Riyadh. With a competitive price of SAR 225,000, this property is an excellent choice for ⟨This studio apartment is available for rent in the vibrant neighborhood of Al Olaya, Riyadh. With a competitive price of SAR {n}, this property is an excellent choice for⟩ | not in translations | code | — | web: drawer-case-just-posted, drawer-case-just-posted-full, drawer-case-off-plan, drawer-case-off-plan-full · @360: sheet-case-just-posted, sheet-case-off-plan |
| 118 more words for a perfect description ⟨{n} more words for a perfect description⟩ | not in translations | code | — | web: drawer-case-just-posted, drawer-case-just-posted-full, drawer-case-off-plan, drawer-case-off-plan-full · @360: none |
| 32 / 150 ⟨{n} / {n}⟩ ×6 | value | data | — | web: drawer-case-just-posted, drawer-case-just-posted-full, drawer-case-off-plan, drawer-case-off-plan-full +4 more · @360: sheet-case-just-posted, sheet-case-off-plan, tour-2, tour-3 +3 more |
| Auto Translate Arabic Description | not in translations | code | — | web: drawer-case-just-posted, drawer-case-just-posted-full, drawer-case-off-plan, drawer-case-off-plan-full · @360: sheet-case-just-posted, sheet-case-off-plan |
| Generate Description | اكتب وصف تلقائي | t | — | web: drawer-case-just-posted, drawer-case-just-posted-full, drawer-case-off-plan, drawer-case-off-plan-full · @360: sheet-case-just-posted, sheet-case-off-plan |
| The listing itself is strong. Visibility, not quality, is what's holding the leads back. | not in translations | code | — | web: drawer-case-low-impression-high-conversion, drawer-case-low-impression-high-conversion-full · @360: none |
| 1 Fix ⟨{n} Fix⟩ | not in translations | code | — | web: drawer-case-low-impression-high-conversion, drawer-case-low-impression-high-conversion-full · @360: sheet-case-low-impression-high-conversion |
| 14 photos, 4 interior. Two more takes you to a perfect score. ⟨{n} photos, {n} interior. Two more takes you to a perfect score.⟩ | not in translations | code | — | web: drawer-case-low-impression-high-conversion, drawer-case-low-impression-high-conversion-full · @360: sheet-case-low-impression-high-conversion |
| Dhahrat Laban, West Riyadh, Saudi Arabia | not in translations | code | — | web: drawer-case-off-plan, drawer-case-off-plan-full · @360: none |
| Off-plan buyers compare payment plans. Add the missing detail and a few more interior images. | not in translations | code | — | web: drawer-case-off-plan, drawer-case-off-plan-full · @360: none |
| Off-plan listings with a payment plan in the description get 1.6x more leads. ⟨Off-plan listings with a payment plan in the description get {n}x more leads.⟩ | not in translations | code | — | web: drawer-case-off-plan, drawer-case-off-plan-full · @360: none |
| Last updated 12 Minutes Ago ⟨Last updated {n} Minutes Ago⟩ | not in translations | code | — | web: drawer-case-rank-pending, drawer-case-rank-pending-full · @360: none |
| We compare you against 96 similar listings in Al Hazm as soon as the first data arrives. ⟨We compare you against {n} similar listings in Al Hazm as soon as the first data arrives.⟩ | not in translations | code | — | web: drawer-case-rank-pending, drawer-case-rank-pending-full · @360: none |
| Quality is what sets your opening rank. Fix these before the first buyers arrive. | not in translations | code | — | web: drawer-case-rank-pending, drawer-case-rank-pending-full · @360: none |
| 5 photos is below the 12 that top listings in Al Hazm carry. ⟨{n} photos is below the {n} that top listings in Al Hazm carry.⟩ | not in translations | code | — | web: drawer-case-rank-pending, drawer-case-rank-pending-full · @360: sheet-trend-no-data |
| Last 7 Days | آخر 7 أيام | t | — | web: drawer-menu-range · @360: sheet-range |
| Last 90 Days ⟨Last {n} Days⟩ ×2 | not in translations | code | — | web: drawer-menu-range · @360: sheet-range |
| Custom range | not in translations | code | — | web: drawer-menu-range · @360: none |
| Your rank is being updated | not in translations | code | — | web: drawer-rank-updating, rank-updating · @360: none |
| We are processing your latest improvements. Your refreshed rank will be available shortly. | not in translations | code | — | web: drawer-rank-updating, rank-updating · @360: none |
| Refreshed Just Now | not in translations | code | — | web: drawer-rank-updating · @360: none |
| Updating | not in translations | code | — | web: drawer-rank-updating · @360: none |
| No active listings yet | not in translations | code | — | web: empty-active, non-package-empty · @360: empty-active, non-package-empty, tour-no-listings, tour-no-listings-2, tour-no-listings-3, tour-no-listings-4 |
| Post your first listing to track its rank and performance. | not in translations | code | — | web: empty-active, non-package-empty · @360: empty-active, non-package-empty, tour-no-listings, tour-no-listings-2, tour-no-listings-3, tour-no-listings-4 |
| Post a Listing | انشر إعلان | t | — | web: empty-active, empty-draft, non-package-empty · @360: empty-active, empty-draft, non-package-empty, tour-no-listings +3 more |
| See how scores work | not in translations | code | — | web: empty-active, empty-draft, empty-pending, empty-removed, non-package-empty · @360: empty-active, empty-draft, non-package-empty, tour-no-listings +3 more |
| Timeline | التاريخ | t | — | web: empty-draft, empty-pending, empty-removed, tab-draft +5 more · @360: none |
| Status | الحالة | t | — | web: empty-draft, empty-pending, empty-removed, tab-ad-license-requests +7 more · @360: tab-ad-license-requests, tab-ad-license-requests-full |
| No drafts saved | not in translations | code | — | empty-draft (web and @360) |
| Listings you start but do not post stay here for 30 days. ⟨Listings you start but do not post stay here for {n} days.⟩ | not in translations | code | — | empty-draft (web and @360) |
| No listings match these filters | not in translations | code | — | empty-filter (web and @360) |
| Try removing a filter, or search a different Bayut ID. | not in translations | code | — | empty-filter (web and @360) |
| Clear filters | مسح المرشحات | t | — | empty-filter (web and @360) |
| Nothing waiting for approval | not in translations | code | — | empty-pending (web and @360) |
| Listings in review, or waiting on a license or payment, show up here. | not in translations | code | — | empty-pending (web and @360) |
| View Active Listings | عرض + الاعلانات الفعالة | t+ | — | empty-pending, empty-removed (web and @360) |
| No removed listings | fixture: fixtures.mjs | data | — | empty-removed (web and @360) |
| Expired, rejected and deleted listings stay here for 90 days. ⟨Expired, rejected and deleted listings stay here for {n} days.⟩ | not in translations | code | — | empty-removed (web and @360) |
| Preview Listing | معاينة + اعلان | t+ | — | web: menu-row · @360: sheet-row-menu |
| View On Bayut | not in translations | code | — | web: menu-row · @360: none |
| Edit Listing | تحرير الإدراج | t | — | web: menu-row · @360: sheet-row-menu |
| Copy Bayut Link | not in translations | code | — | web: menu-row, modal-share, modal-share-panel · @360: none |
| Add Discount | اضافة خصم | t | — | web: menu-row · @360: none |
| Change Ownership | تغيير الملكية | t | — | web: menu-row, modal-change-ownership · @360: sheet-row-menu |
| Delete Listing | حذف الإعلان | t | — | web: menu-row, modal-delete · @360: sheet-row-menu |
| Oldest First | not in translations | code | — | web: menu-sort, tour-4 · @360: sheet-sort |
| Highest Quality | not in translations | code | — | web: menu-sort, tour-4 · @360: sheet-sort |
| Lowest Quality | not in translations | code | — | web: menu-sort, tour-4 · @360: sheet-sort |
| Highest Clicks | not in translations | code | — | web: menu-sort, tour-4 · @360: sheet-sort |
| Lowest Click | not in translations | code | — | web: menu-sort, tour-4 · @360: sheet-sort |
| Highest Impression | not in translations | code | — | web: menu-sort, tour-4 · @360: sheet-sort |
| Lowest Impression | not in translations | code | — | web: menu-sort, tour-4 · @360: sheet-sort |
| Change Listing Ownership | تغيير المعلن | t | — | web: modal-change-ownership · @360: none |
| Hand this listing to another agent in your agency | not in translations | code | — | web: modal-change-ownership · @360: none |
| Al Hazm, West Riyadh · ID 123494 ⟨Al Hazm, West Riyadh · ID {n}⟩ | not in translations | code | — | web: modal-change-ownership · @360: none |
| Current assignee | not in translations | code | — | web: modal-change-ownership · @360: none |
| ZA | value | data | — | web: modal-change-ownership · @360: none |
| Zeeshan Ali (Me) | not in translations | code | — | web: modal-change-ownership · @360: none |
| zeeshan.aly@dubizzlelabs.com · +966 50 865 3278 ⟨zeeshan.aly@dubizzlelabs.com · {n} {n} {n} {n}⟩ | not in translations | code | — | web: modal-change-ownership · @360: none |
| Current | not in translations | code | — | web: modal-change-ownership · @360: none |
| Select the new assignee | اختر المُعيَّن الجديد | t | — | web: modal-change-ownership · @360: none |
| HI | value | data | — | web: modal-change-ownership · @360: none |
| Hamza Ishfaq | not in translations | code | — | web: modal-change-ownership · @360: none |
| hamza.ishfaq@dubizzlelabs.com · +966 50 800 3738 ⟨hamza.ishfaq@dubizzlelabs.com · {n} {n} {n} {n}⟩ | not in translations | code | — | web: modal-change-ownership · @360: none |
| 2 Active Listings ⟨{n} Active Listings⟩ ×3 | {n} + الاعلانات الفعالة | t+ | — | web: modal-change-ownership · @360: none |
| SK | value | data | — | web: modal-change-ownership · @360: none |
| Sara Khan | not in translations | code | — | web: modal-change-ownership · @360: none |
| sara.khan@dubizzlelabs.com · +966 50 112 2334 ⟨sara.khan@dubizzlelabs.com · {n} {n} {n} {n}⟩ | not in translations | code | — | web: modal-change-ownership · @360: none |
| FH | value | data | — | web: modal-change-ownership · @360: none |
| Faisal Al-Harbi | fixture: fixtures/user.json | data | — | web: modal-change-ownership · @360: none |
| faisal.harbi@dubizzlelabs.com · +966 50 556 6778 ⟨faisal.harbi@dubizzlelabs.com · {n} {n} {n} {n}⟩ | not in translations | code | — | web: modal-change-ownership · @360: none |
| NZ | value | data | — | web: modal-change-ownership · @360: none |
| Noura Al-Zahrani | not in translations | code | — | web: modal-change-ownership · @360: none |
| noura.zahrani@dubizzlelabs.com · +966 50 334 4556 ⟨noura.zahrani@dubizzlelabs.com · {n} {n} {n} {n}⟩ | not in translations | code | — | web: modal-change-ownership · @360: none |
| 1 Active Listing ⟨{n} Active Listing⟩ | {n} + إعلان نشط | t+ | — | web: modal-change-ownership · @360: none |
| Cancel | إلغاء | t | — | web: modal-change-ownership, modal-delete, modal-mark-as-booked, modal-mark-as-booked-blocked, modal-mark-as-booked-range, modal-request-services · @360: sheet-delete, sheet-mark-as-booked, sheet-mark-as-booked-range, sheet-request-services, sheet-services-requested |
| Delete this listing? | not in translations | code | — | web: modal-delete · @360: sheet-delete |
| This removes it from Bayut. You cannot undo this. | not in translations | code | — | web: modal-delete · @360: sheet-delete |
| Bayut ID 123494 ⟨Bayut ID {n}⟩ ×2 | بيوت + رقم + {n} | t+ | — | web: modal-delete · @360: sheet-delete |
| Why are you deleting your listing? | لماذا تقوم بحذف قائمتك؟ | t | — | web: modal-delete · @360: sheet-delete |
| The property has been rented | not in translations | code | — | web: modal-delete · @360: sheet-delete |
| Ownership of the property has been transferred | not in translations | code | — | web: modal-delete · @360: sheet-delete |
| The real estate advertising license data is incorrect | not in translations | code | — | web: modal-delete · @360: sheet-delete |
| Other | آخرى | t | — | web: modal-delete · @360: sheet-delete |
| Mark as Booked | تحديد كمحجوز | t | — | web: modal-mark-as-booked, modal-mark-as-booked-blocked, modal-mark-as-booked-range · @360: sheet-mark-as-booked, sheet-mark-as-booked-range |
| Booked by guest | not in translations | code | — | web: modal-mark-as-booked, modal-mark-as-booked-blocked, modal-mark-as-booked-range · @360: sheet-mark-as-booked, sheet-mark-as-booked-range |
| Blocked (unavailable) | not in translations | code | — | web: modal-mark-as-booked, modal-mark-as-booked-blocked, modal-mark-as-booked-range · @360: sheet-mark-as-booked, sheet-mark-as-booked-range |
| September 2026 ⟨{date}⟩ ×36 | value | data | — | web: modal-mark-as-booked, modal-mark-as-booked-blocked, modal-mark-as-booked-range, tab-ad-license-requests +7 more · @360: sheet-mark-as-booked, sheet-mark-as-booked-range, sheet-services-requested, tab-ad-license-requests +5 more |
| Sun | not in translations | code | — | web: modal-mark-as-booked, modal-mark-as-booked-blocked, modal-mark-as-booked-range · @360: sheet-mark-as-booked, sheet-mark-as-booked-range |
| Mon | not in translations | code | — | web: modal-mark-as-booked, modal-mark-as-booked-blocked, modal-mark-as-booked-range · @360: sheet-mark-as-booked, sheet-mark-as-booked-range |
| Tue | not in translations | code | — | web: modal-mark-as-booked, modal-mark-as-booked-blocked, modal-mark-as-booked-range · @360: sheet-mark-as-booked, sheet-mark-as-booked-range |
| Wed | not in translations | code | — | web: modal-mark-as-booked, modal-mark-as-booked-blocked, modal-mark-as-booked-range · @360: sheet-mark-as-booked, sheet-mark-as-booked-range |
| Thu | not in translations | code | — | web: modal-mark-as-booked, modal-mark-as-booked-blocked, modal-mark-as-booked-range · @360: sheet-mark-as-booked, sheet-mark-as-booked-range |
| Fri | not in translations | code | — | web: modal-mark-as-booked, modal-mark-as-booked-blocked, modal-mark-as-booked-range · @360: sheet-mark-as-booked, sheet-mark-as-booked-range |
| Sat | not in translations | code | — | web: modal-mark-as-booked, modal-mark-as-booked-blocked, modal-mark-as-booked-range · @360: sheet-mark-as-booked, sheet-mark-as-booked-range |
| 3 nights: Sep 11 to Sep 14 ⟨{n} nights: Sep {n} to Sep {n}⟩ | not in translations | code | — | web: modal-mark-as-booked-blocked, modal-mark-as-booked-range · @360: none |
| Block These Dates | not in translations | code | — | web: modal-mark-as-booked-blocked · @360: none |
| Pick the check in date | not in translations | code | — | web: modal-mark-as-booked · @360: sheet-mark-as-booked |
| Request Services | not in translations | code | — | web: modal-request-services · @360: sheet-request-services, sheet-row-menu, sheet-services-requested |
| Request another service | not in translations | code | — | web: modal-request-services · @360: sheet-services-requested |
| Videography | تصوير الفيديو | t | — | web: modal-request-services · @360: sheet-request-services, sheet-services-requested |
| Drone | not in translations | code | — | web: modal-request-services · @360: sheet-request-services, sheet-row-menu, sheet-services-requested |
| Photography | تصوير فوتوغرافي | t | — | web: modal-request-services · @360: sheet-request-services, sheet-row-menu, sheet-services-requested |
| Date & Time | التاريخ والوقت | t | — | web: modal-request-services · @360: sheet-request-services, sheet-services-requested |
| Select Date & Time | حدد التاريخ + الوقت | t+ | — | web: modal-request-services · @360: sheet-request-services |
| Comments | التعليقات | t | — | web: modal-request-services · @360: sheet-request-services, sheet-services-requested |
| E.g Please call before visiting site | not in translations | code | — | web: modal-request-services · @360: sheet-request-services |
| Payment | not in translations | code | — | web: modal-request-services · @360: sheet-request-services |
| Available credits | متاح + ائتمانات · also الاعتمادات | t+ | — | web: modal-request-services · @360: sheet-request-services |
| Credits | نقطة · also أرصدة | t | — | web: modal-request-services · @360: sheet-request-services |
| Credit Card | not in translations | code | — | web: modal-request-services · @360: none |
| Your credits cover this service. They are deducted once the visit is confirmed. | not in translations | code | — | web: modal-request-services · @360: sheet-request-services |
| Request Service | not in translations | code | — | web: modal-request-services · @360: sheet-request-services |
| Copy the link and send buyers straight to this property | not in translations | code | — | web: modal-share, modal-share-panel · @360: none |
| Listing link | not in translations | code | — | web: modal-share, modal-share-panel · @360: sheet-share |
| bayut.sa/property/details-123492.html ⟨bayut.sa/property/details-{n}.html⟩ ×2 | not in translations | code | — | web: modal-share, modal-share-panel · @360: sheet-share |
| Copy link | not in translations | code | — | web: modal-share, modal-share-panel · @360: sheet-share |
| Last shared on Facebook, Instagram | not in translations | code | — | web: modal-share, modal-share-panel · @360: none |
| Done | تم | t | — | web: modal-share, modal-share-panel · @360: sheet-location-no-match, sheet-location-search, sheet-services-requested, sheet-share |
| Verification status for this listing | not in translations | code | — | web: modal-trucheck · @360: none |
| Request Rejected | not in translations | code | — | web: modal-trucheck · @360: sheet-trucheck-rejected |
| Your TruCheck request was rejected | not in translations | code | — | web: modal-trucheck · @360: sheet-trucheck-rejected |
| Reason: The property could not be accessed at the scheduled visit. | not in translations | code | — | web: modal-trucheck · @360: sheet-trucheck-rejected |
| Resolve the reason above, then re-apply from the Bayut mobile app. | not in translations | code | — | web: modal-trucheck · @360: sheet-trucheck-rejected |
| Re Apply TruCheck | not in translations | code | — | web: modal-trucheck · @360: sheet-trucheck-rejected |
| Are you a broker or an agency? | not in translations | code | — | non-package, non-package-empty (web and @360) |
| Packages get you discounted listing credits and the full performance tools. | not in translations | code | — | non-package, non-package-empty (web and @360) |
| Get a Package Now | احصل على باقة الآن | t | — | non-package, non-package-empty (web and @360) |
| No internet connection | not in translations | code | — | offline (web and @360) |
| Your listings could not load. Check your connection and try again. | not in translations | code | — | offline (web and @360) |
| Try Again | حاول مرة ثانية | t | — | offline (web and @360) |
| I am back online | not in translations | code | — | offline (web and @360) |
| Export PDF | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| Updated Sep 06 ⟨Updated Sep {n}⟩ ×6 | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-happy +13 more |
| License expires in 93 days ⟨License expires in {n} days⟩ ×9 | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| Top listing is getting | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full, sheet-case-everything-unfinished, sheet-case-off-plan +11 more |
| more leads than yours | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full, sheet-case-everything-unfinished, sheet-case-off-plan +11 more |
| Buyers find it but do not enquire. Trust and detail convert views into leads. | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full, sheet-performance, sheet-performance-full +7 more |
| vs Top | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| vs Avg | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +16 more |
| Top Similar | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +15 more |
| Avg Similar | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-case-everything-unfinished +15 more |
| Apply TruCheck | تطبيق + ترو تشيك | t+ | — | web: none · @360: sheet-amenities, sheet-amenities-full, sheet-performance, sheet-performance-full +7 more |
| Verified listings get 2.3x more enquiries in Al Hazm. ⟨Verified listings get {n}x more enquiries in Al Hazm.⟩ | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full, sheet-performance, sheet-performance-full +7 more |
| You have 9 photos but only 2 interior. Buyers drop off without them. ⟨You have {n} photos but only {n} interior. Buyers drop off without them.⟩ | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full, sheet-performance, sheet-performance-full +7 more |
| Listings with 8+ amenities appear in 40% more filtered searches. ⟨Listings with {n}+ amenities appear in {n}% more filtered searches.⟩ | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full, sheet-performance, sheet-performance-full +7 more |
| 5 amenities added ⟨{n} amenities added⟩ | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full |
| 8 or more ranks best ⟨{n} or more ranks best⟩ | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full |
| Balcony | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full |
| Add amenities | fixture: fixtures/listings.mjs | data | — | web: none · @360: sheet-amenities, sheet-amenities-full |
| Search amenities | fixture: fixtures/listings.mjs | data (placeholder) | — | web: none · @360: sheet-amenities, sheet-amenities-full |
| Built in Wardrobes | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full |
| Kitchen Appliances | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full |
| Furnished | مفروش | t | — | web: none · @360: sheet-amenities, sheet-amenities-full |
| Shared Gym | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full |
| Mosque Nearby | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full |
| +1 More Fix ⟨{n} More Fix⟩ | not in translations | code | — | web: none · @360: sheet-amenities, sheet-amenities-full, sheet-case-daily-rental, sheet-performance +8 more |
| You are getting | not in translations | code | — | web: none · @360: sheet-case-daily-rental, sheet-case-happy |
| more leads than the area average | not in translations | code | — | web: none · @360: sheet-case-daily-rental, sheet-case-happy |
| Nightly listings live on photos and the calendar. | not in translations | code | — | web: none · @360: sheet-case-daily-rental |
| Wi-Fi, kitchen and parking are the top filters for nightly stays. | not in translations | code | — | web: none · @360: sheet-case-daily-rental |
| Updated Aug 27 ⟨Updated Aug {n}⟩ ×2 | not in translations | code | — | web: none · @360: sheet-case-everything-unfinished, sheet-improve-quality, sheet-improve-quality-full |
| Almost nothing is filled in yet. Every fix moves the score, and the rank with it. | not in translations | code | — | web: none · @360: sheet-case-everything-unfinished |
| 3 photos is well below the 12 top listings carry. ⟨{n} photos is well below the {n} top listings carry.⟩ | not in translations | code | — | web: none · @360: sheet-case-everything-unfinished |
| Your Description is 34 words. Top listings have 150 - 400 words. ⟨Your Description is {n} words. Top listings have {n} - {n} words.⟩ ×3 | not in translations | code | — | web: none · @360: sheet-case-everything-unfinished, sheet-case-just-posted, sheet-trend-no-data |
| Bring your property to life. Add a youtube tour link below. | أضف الحياة إلى عقارك. أضف رابط جولة يوتيوب أدناه. | t | — | web: none · @360: sheet-case-everything-unfinished, sheet-improve-quality, sheet-improve-quality-full |
| Perfect score. Keep it fresh to hold the rank. | not in translations | code | — | web: none · @360: sheet-case-happy |
| Keep it fresh to maintain the rank. | not in translations | code | — | web: none · @360: sheet-case-happy |
| Make sure your listing quality is excellent to climb ranks | not in translations | code | — | web: none · @360: sheet-case-just-posted |
| Two small fixes before the first buyers arrive. | not in translations | code | — | web: none · @360: sheet-case-just-posted |
| 118 more words for a perfect description. ⟨{n} more words for a perfect description.⟩ | not in translations | code | — | web: none · @360: sheet-case-just-posted, sheet-case-off-plan |
| Lengthen the listing title | not in translations | code | — | web: none · @360: sheet-case-just-posted |
| Titles with 45+ characters get more clicks in search. ⟨Titles with {n}+ characters get more clicks in search.⟩ | not in translations | code | — | web: none · @360: sheet-case-just-posted |
| You convert | not in translations | code | — | web: none · @360: sheet-case-low-impression-high-conversion |
| better than the area average, it just isn't seen | not in translations | code | — | web: none · @360: sheet-case-low-impression-high-conversion |
| Visibility, not quality, is holding leads back. | not in translations | code | — | web: none · @360: sheet-case-low-impression-high-conversion |
| Scroll to see all 14 images ⟨Scroll to see all {n} images⟩ | not in translations | code | — | web: none · @360: sheet-case-low-impression-high-conversion |
| Off-plan buyers compare payment plans. | not in translations | code | — | web: none · @360: sheet-case-off-plan |
| Off-plan listings with a payment plan get 1.6x more leads. ⟨Off-plan listings with a payment plan get {n}x more leads.⟩ | not in translations | code | — | web: none · @360: sheet-case-off-plan |
| Add a floor plan image | not in translations | code | — | web: none · @360: sheet-case-off-plan |
| You have 5 photos and no floor plan. Buyers ask for it first. ⟨You have {n} photos and no floor plan. Buyers ask for it first.⟩ | not in translations | code | — | web: none · @360: sheet-case-off-plan |
| Delete | حذف | t | — | web: none · @360: sheet-delete |
| Enter Bayut ID | not in translations | code | — | web: none · @360: sheet-filters, sheet-filters-full |
| REGA Ad License Number | رقم ترخيص الإعلان | t | — | web: none · @360: sheet-filters, sheet-filters-full |
| Enter REGA Ad License Number | أدخل رقم ترخيص الإعلان العقارية | t | — | web: none · @360: sheet-filters, sheet-filters-full |
| Wafi License Number | not in translations | code | — | web: none · @360: sheet-filters, sheet-filters-full |
| Enter Wafi License Number | not in translations | code | — | web: none · @360: sheet-filters, sheet-filters-full |
| Select Purpose | نوع العرض | t | — | web: none · @360: sheet-filters, sheet-filters-full |
| Select Property Type | نوع العقار | t | — | web: none · @360: sheet-filters, sheet-filters-full |
| Select City | اختر المدينة | t | — | web: none · @360: sheet-filters, sheet-filters-full |
| [riyal]0 to 5,000,000+ ⟨[riyal]{n} to {n}+⟩ | not in translations | code | — | web: none · @360: sheet-filters, sheet-filters-full |
| 0 to 1,000+ ⟨{n} to {n}+⟩ | not in translations | code | — | web: none · @360: sheet-filters, sheet-filters-full |
| A weak listing costs you visibility and leads. Fix the three below to climb. | not in translations | code | — | web: none · @360: sheet-improve-quality, sheet-improve-quality-full |
| You have 9 photos but only 2 interior, Add 2 more images to increase listing health ⟨You have {n} photos but only {n} interior, Add {n} more images to increase listing health⟩ | not in translations | code | — | web: none · @360: sheet-improve-quality, sheet-improve-quality-full |
| Your Description is 68 words. Top ranking listing in Al hazm have 150 - 400 words. ⟨Your Description is {n} words. Top ranking listing in Al hazm have {n} - {n} words.⟩ | not in translations | code | — | web: none · @360: sheet-improve-quality, sheet-improve-quality-full |
| Select Locations | not in translations | code (placeholder) | — | web: none · @360: sheet-location-no-match, sheet-location-search |
| No location found | not in translations | code | — | web: none · @360: sheet-location-no-match |
| Nothing matches "Zzz". Check the spelling or pick one of the popular cities. | not in translations | code | — | web: none · @360: sheet-location-no-match |
| Clear search | not in translations | code | — | web: none · @360: sheet-location-no-match |
| Recently Searched Locations | not in translations | code | — | web: none · @360: sheet-location-search |
| Al Khobar | fixture: fixtures/payments.mjs | data | — | web: none · @360: sheet-location-search |
| Popular Locations in KSA | not in translations | code | — | web: none · @360: sheet-location-search |
| 3 nights selected ⟨{n} nights selected⟩ | not in translations | code | — | web: none · @360: sheet-mark-as-booked-range |
| A Bayut agent visits and verifies the property. Slots available this week. | not in translations | code | — | web: none · @360: sheet-performance, sheet-performance-full, sheet-quality-score, sheet-quality-score-full +5 more |
| Book TruCheck | not in translations | code | — | web: none · @360: sheet-performance, sheet-performance-full, sheet-quality-score, sheet-quality-score-full +5 more |
| Date range | not in translations | code | — | web: none · @360: sheet-range |
| Performance is compared over the same window | not in translations | code | — | web: none · @360: sheet-range |
| This Year | not in translations | code | — | web: none · @360: sheet-range |
| Since Posted | not in translations | code | — | web: none · @360: sheet-range |
| Select your service | not in translations | code | — | web: none · @360: sheet-request-services |
| Card | not in translations | code | — | web: none · @360: sheet-request-services |
| Listing actions | not in translations | code | — | web: none · @360: sheet-row-menu |
| Share Bayut Link | not in translations | code | — | web: none · @360: sheet-row-menu, sheet-share |
| Remove Discount | إزالة + خصم | t+ | — | web: none · @360: sheet-row-menu |
| Completed on Aug 28, 2026 ⟨Completed on {date}⟩ | مكتمل + على + {date} | t+ | — | web: none · @360: sheet-row-menu |
| Completed | مكتمل | t | — | web: none · @360: sheet-row-menu |
| Scheduled for Sep 14, 2026 ⟨Scheduled for {date}⟩ | not in translations | code | — | web: none · @360: sheet-row-menu |
| Scheduled | not in translations | code | — | web: none · @360: sheet-row-menu, sheet-services-requested |
| Unit is furnished, shoot the balcony view as well. | not in translations | code | — | web: none · @360: sheet-services-requested |
| Paid with credits ⟨Paid {x} credits⟩ | مدفوع + {x} + ائتمانات · also الاعتمادات | t+ | — | web: none · @360: sheet-services-requested |
| 250 credits ⟨{n} credits⟩ | {n} + ائتمانات · also الاعتمادات | t+ | — | web: none · @360: sheet-services-requested |
| Share the link and send buyers straight to this property | not in translations | code | — | web: none · @360: sheet-share |
| Sort listings | not in translations | code | — | web: none · @360: sheet-sort |
| Rank pending | fixture: fixtures.mjs | data | — | web: none · @360: sheet-trend-no-data |
| Quality sets your opening rank. Fix these first. | not in translations | code | — | web: none · @360: sheet-trend-no-data |
| No trend data yet | not in translations | code | — | web: none · @360: sheet-trend-no-data |
| This listing went live a few minutes ago. Views, clicks and leads start plotting from tomorrow. | not in translations | code | — | web: none · @360: sheet-trend-no-data |
| Listings with 8+ amenities appear in 40% more searches. ⟨Listings with {n}+ amenities appear in {n}% more searches.⟩ | not in translations | code | — | web: none · @360: sheet-trend-no-data |
| Not Verified | not in translations | code | — | web: none · @360: sheet-trucheck |
| Get this listing TruCheck verified | not in translations | code | — | web: none · @360: sheet-trucheck |
| A Bayut representative visits the property to validate that it is authentic and still available. Verified listings carry the TruCheck badge and earn more buyer trust. | not in translations | code | — | web: none · @360: sheet-trucheck |
| Applications are submitted from the Bayut mobile app. | not in translations | code | — | web: none · @360: sheet-trucheck |
| Apply for TruCheck | التقديم للحصول على ترو تشيك | t | — | web: none · @360: sheet-trucheck |
| Filtering 65 listings... ⟨Filtering {n} listings...⟩ | not in translations | code | — | skeleton-filtering (web and @360) |
| Sorting 65 listings... ⟨Sorting {n} listings...⟩ | not in translations | code | — | web: sorting · @360: none |
| Enter Request ID | أدخل رقم الطلب | t (placeholder) | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Enter Deed Number | أدخل رقم الصك | t (placeholder) | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Select Status | اختر الحالة | t | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Select Date | حدد التاريخ | t | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Property Listing | not in translations | code | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Deed Number | رقم الصك | t | — | tab-ad-license-requests, tab-ad-license-requests-full (web and @360) |
| Request ID | رقم الطلب | t | — | tab-ad-license-requests, tab-ad-license-requests-full (web and @360) |
| Ad License Request | not in translations | code | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Requested on | not in translations | code | — | tab-ad-license-requests, tab-ad-license-requests-full (web and @360) |
| Ad License Sell · [riyal]600 ⟨Ad License Sell · [riyal]{n}⟩ | رخصة الإعلان + للبيع + {n} | t+ | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Payment Pending | بانتظار الدفعة | t | — | tab-ad-license-requests, tab-ad-license-requests-full, tab-pending, tab-pending-full (web and @360) |
| Payment required | not in translations | code | — | web: tab-ad-license-requests, tab-ad-license-requests-full, tab-pending, tab-pending-full · @360: tab-pending, tab-pending-full |
| The request pauses here until the license fee clears. | not in translations | code | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Pay Now | ادفع الآن | t | — | tab-ad-license-requests, tab-ad-license-requests-full, tab-pending, tab-pending-full (web and @360) |
| Villa for Sale ⟨{x} for Sale⟩ | {x} + للبيع | t+ | — | tab-ad-license-requests, tab-ad-license-requests-full, tab-draft, tab-draft-full +4 more (web and @360) |
| Al Shati, North Jeddah | fixture: fixtures/payments.mjs | data | — | tab-ad-license-requests, tab-ad-license-requests-full, tab-pending, tab-pending-full, tab-removed, tab-removed-full (web and @360) |
| Verifying Details | التحقق من التفاصيل | t | — | tab-ad-license-requests, tab-ad-license-requests-full (web and @360) |
| Verifying your deed | not in translations | code | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| We are matching the deed details against REGA records. | not in translations | code | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Apartment for Rent | fixture: fixtures/listing-form.mjs | data | — | tab-ad-license-requests, tab-ad-license-requests-full (web and @360) |
| Hittin, North Riyadh | fixture: fixtures/extra.mjs | data | — | tab-ad-license-requests, tab-ad-license-requests-full, tab-removed, tab-removed-full (web and @360) |
| Ad License Rent · [riyal]250 ⟨Ad License Rent · [riyal]{n}⟩ | رخصة الإعلان + للإيجار + {n} | t+ | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Preparing Contract | إعداد العقد | t | — | tab-ad-license-requests, tab-ad-license-requests-full (web and @360) |
| Contract being drafted | not in translations | code | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| REGA is preparing the contract. You will be asked to sign it next. | not in translations | code | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| License Ready | الترخيص جاهز | t | — | tab-ad-license-requests, tab-ad-license-requests-full (web and @360) |
| License 7201073564 issued ⟨License {n} issued⟩ | not in translations | code | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Post the listing to put it in front of buyers. | not in translations | code | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Post Listing | نشر إعلان | t | — | tab-ad-license-requests, tab-ad-license-requests-full (web and @360) |
| Al Faisaliyah, Dammam | fixture: fixtures/payments.mjs | data | — | tab-ad-license-requests, tab-ad-license-requests-full, tab-removed, tab-removed-full (web and @360) |
| Request Cancelled | تم إلغاء الطلب | t | — | tab-ad-license-requests, tab-ad-license-requests-full (web and @360) |
| Ownership not verified | not in translations | code | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| REGA could not confirm deed ownership. Start a new request to try again. | not in translations | code | — | web: tab-ad-license-requests, tab-ad-license-requests-full · @360: none |
| Created On | تاريخ الإنشاء | t | — | web: none · @360: tab-ad-license-requests, tab-ad-license-requests-full |
| Location: | الموقع | t | — | web: none · @360: tab-ad-license-requests, tab-ad-license-requests-full |
| Deed | not in translations | code | — | web: none · @360: tab-ad-license-requests, tab-ad-license-requests-full |
| Pay the license fee to continue the REGA request. | not in translations | code | — | web: none · @360: tab-ad-license-requests, tab-ad-license-requests-full |
| We are matching your deed details with REGA records. | not in translations | code | — | web: none · @360: tab-ad-license-requests, tab-ad-license-requests-full |
| Your REGA contract is being drafted. No action needed. | not in translations | code | — | web: none · @360: tab-ad-license-requests, tab-ad-license-requests-full |
| License 7201073564 issued. Post the listing to go live. ⟨License {n} issued. Post the listing to go live.⟩ | not in translations | code | — | web: none · @360: tab-ad-license-requests, tab-ad-license-requests-full |
| Deed ownership could not be verified with REGA. Start a new request. | not in translations | code | — | web: none · @360: tab-ad-license-requests, tab-ad-license-requests-full |
| Not Posted | لم يتم النشر | t | — | tab-draft, tab-draft-full (web and @360) |
| Location not added | not in translations | code | — | tab-draft, tab-draft-full (web and @360) |
| Permit No. | رقم التصريح · also رقم الترخيص: | t | — | tab-draft, tab-draft-full, tab-pending, tab-pending-full, tab-removed, tab-removed-full (web and @360) |
| REGA Ad license expires in 18 days ⟨REGA Ad license expires in {n} days⟩ ×12 | not in translations | code | — | web: tab-draft, tab-draft-full, tab-pending, tab-pending-full, tab-removed, tab-removed-full · @360: none |
| Created on | تم الإنشاء في | t | — | tab-draft, tab-draft-full (web and @360) |
| Last updated on | آخر تحديث في | t | — | tab-draft, tab-draft-full (web and @360) |
| Listing incomplete | fixture: fixtures/profile.mjs | data | — | tab-draft, tab-draft-full (web and @360) |
| 8/12 ⟨{n}/{n}⟩ ×2 | value | data | — | web: tab-draft, tab-draft-full · @360: none |
| 4 of 12 required details missing ⟨{n} of {n} required details missing⟩ | not in translations | code | — | web: tab-draft, tab-draft-full · @360: none |
| Post Now | انشر الآن | t | — | tab-draft, tab-draft-full, tab-removed, tab-removed-full (web and @360) |
| Info Completed | انتهت المعلومات | t | — | tab-draft, tab-draft-full (web and @360) |
| Ready to publish | not in translations | code | — | web: tab-draft, tab-draft-full · @360: none |
| All required details added | not in translations | code | — | web: tab-draft, tab-draft-full · @360: none |
| All required details are added. Publishing sends it for moderation. | not in translations | code | — | web: tab-draft, tab-draft-full · @360: none |
| Insufficient Credits | الرصيد غير كافي | t | — | tab-draft, tab-draft-full (web and @360) |
| Not enough credits | not in translations | code | — | tab-draft, tab-draft-full (web and @360) |
| You need 2 more listing credits to post this property. ⟨You need {n} more listing credits to post this property.⟩ | not in translations | code | — | tab-draft, tab-draft-full (web and @360) |
| Payment Failed | فشل الدفع | t | — | tab-draft, tab-draft-full (web and @360) |
| An Narjis, North Riyadh | not in translations | code | — | tab-draft, tab-draft-full (web and @360) |
| Card declined | not in translations | code | — | tab-draft, tab-draft-full (web and @360) |
| The last payment attempt did not go through. Try another card to publish. | not in translations | code | — | web: tab-draft, tab-draft-full · @360: none |
| Pending Nafaz Verification | التحقق من تأكيد النفاذ معلق | t | — | tab-draft, tab-draft-full, tab-pending, tab-pending-full (web and @360) |
| Nafath verification pending | not in translations | code | — | tab-draft, tab-draft-full (web and @360) |
| Confirm the owner identity in the Nafath app and this listing can be published. | not in translations | code | — | web: tab-draft, tab-draft-full · @360: none |
| Pending Otp Verification | not in translations | code | — | tab-draft, tab-draft-full (web and @360) |
| Chalet for Daily Rental | fixture: fixtures/listings.mjs | data | — | tab-draft, tab-draft-full, tab-removed, tab-removed-full (web and @360) |
| Half Moon Bay, Dammam | not in translations | code | — | tab-draft, tab-draft-full, tab-removed, tab-removed-full (web and @360) |
| OTP not confirmed | not in translations | code | — | tab-draft, tab-draft-full (web and @360) |
| We sent a code to the owner number. The listing publishes once it is entered. | not in translations | code | — | web: tab-draft, tab-draft-full · @360: none |
| 8 of 12 ⟨{n} of {n}⟩ ×2 | not in translations | code | — | web: none · @360: tab-draft, tab-draft-full |
| Nightly price, Area, +1 more ⟨Nightly price, Area, {n} more⟩ | not in translations | code | — | web: none · @360: tab-draft, tab-draft-full |
| Ready to post | not in translations | code | — | web: none · @360: tab-draft, tab-draft-full |
| All required details are added. Posting sends it for moderation. | not in translations | code | — | web: none · @360: tab-draft, tab-draft-full |
| The last payment attempt did not go through. Try another card to post. | not in translations | code | — | web: none · @360: tab-draft, tab-draft-full |
| Confirm the owner identity in the Nafath app and this listing can be posted. | not in translations | code | — | web: none · @360: tab-draft, tab-draft-full |
| We sent a code to the owner number. The listing posts once it is entered. | not in translations | code | — | web: none · @360: tab-draft, tab-draft-full |
| Ad In Review | الإعلان قيد المراجعة | t | — | tab-pending, tab-pending-full (web and @360) |
| Uploaded on | تم التحميل في | t | — | tab-pending, tab-pending-full (web and @360) |
| Waiting on moderation | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| Reviews usually finish within 24 hours. Nothing is needed from you. ⟨Reviews usually finish within {n} hours. Nothing is needed from you.⟩ | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| Changes In Review | التعديلات قيد المراجعة | t | — | tab-pending, tab-pending-full (web and @360) |
| Edits under review | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| Your live version stays visible to buyers until the edits are approved. | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| Ready For Moderation | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| Queued for a moderator | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| Every check has passed. A moderator picks it up shortly. | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| Waiting on Nafath | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| Moderation starts once the owner completes Nafath verification. | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| Awaiting Ad License | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| Deed No. | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| Ad license requested on Sep 06, 2026 ⟨Ad license requested on {date}⟩ | not in translations | code | — | web: tab-pending, tab-pending-full · @360: none |
| Waiting on the ad license | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| REGA has not issued the ad license yet. Moderation begins when it arrives. | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| Pending Host Verification | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| Host verification pending | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| Nightly listings go live once the host identity is verified. | not in translations | code | — | web: tab-pending, tab-pending-full · @360: none |
| Verify Host | not in translations | code | — | tab-pending, tab-pending-full (web and @360) |
| Ad license fee [riyal]600 ⟨Ad license fee [riyal]{n}⟩ | not in translations | code | — | web: tab-pending, tab-pending-full · @360: none |
| Nothing goes to moderation until the listing fee clears. | not in translations | code | — | web: tab-pending, tab-pending-full · @360: none |
| Nightly rentals need host verification before the ad can be reviewed. | not in translations | code | — | web: none · @360: tab-pending, tab-pending-full |
| Pay to send this ad for moderation. Nothing is published until payment clears. | not in translations | code | — | web: none · @360: tab-pending, tab-pending-full |
| Al Narjis, North Riyadh | fixture: fixtures/listing-form.mjs | data | — | tab-removed, tab-removed-full (web and @360) |
| REGA Ad license valid till Nov 30, 2026 ⟨REGA Ad license valid till {date}⟩ ×2 | not in translations | code | — | web: tab-removed, tab-removed-full · @360: none |
| Posted on | تاريخ الإضافة | t | — | web: tab-removed, tab-removed-full · @360: none |
| Removed on | تم الحذف في | t | — | web: tab-removed, tab-removed-full · @360: none |
| Rejected | مرفوض | t | — | tab-removed, tab-removed-full (web and @360) |
| Photos do not match the property described in the listing. Replace them and resubmit. | not in translations | code | — | web: tab-removed, tab-removed-full · @360: none |
| REGA Ad license expired on Aug 02, 2026 ⟨REGA Ad license expired on {date}⟩ | not in translations | code | — | web: tab-removed, tab-removed-full · @360: none |
| Expired | منتهي | t | — | tab-removed, tab-removed-full (web and @360) |
| Townhouse for Sale | fixture: fixtures/listing-form.mjs | data | — | tab-removed, tab-removed-full (web and @360) |
| Sold | تم البيع | t | — | tab-removed, tab-removed-full (web and @360) |
| Duplicate of Bayut ID 2000011488 ⟨Duplicate of Bayut ID {n}⟩ | not in translations | code | — | web: tab-removed, tab-removed-full · @360: none |
| Removed By Bayut | not in translations | code | — | web: tab-removed, tab-removed-full · @360: none |
| The same property is already live, so moderation removed this copy. | not in translations | code | — | web: tab-removed, tab-removed-full · @360: none |
| Al Rabie, North Riyadh | not in translations | code | — | tab-removed, tab-removed-full (web and @360) |
| Removed from the admin panel | not in translations | code | — | web: tab-removed, tab-removed-full · @360: none |
| Deleted By Ops | fixture: fixtures/lms.mjs | data | — | tab-removed, tab-removed-full (web and @360) |
| Our operations team took this listing down. Support can share the reason. | not in translations | code | — | web: tab-removed, tab-removed-full · @360: none |
| Al Nada, North Riyadh | not in translations | code | — | tab-removed, tab-removed-full (web and @360) |
| Agency contract ended on Aug 31, 2026 ⟨Agency contract ended on {date}⟩ | not in translations | code | — | web: tab-removed, tab-removed-full · @360: none |
| Contract Expired | not in translations | code | — | tab-removed, tab-removed-full (web and @360) |
| Fal License | not in translations | code | — | tab-removed, tab-removed-full (web and @360) |
| Fal license does not match the owner record | not in translations | code | — | web: tab-removed, tab-removed-full · @360: none |
| Unauthorized Fal License | not in translations | code | — | tab-removed, tab-removed-full (web and @360) |
| License cancelled on Aug 12, 2026 ⟨License cancelled on {date}⟩ | not in translations | code | — | web: tab-removed, tab-removed-full · @360: none |
| Cancelled License | not in translations | code | — | tab-removed, tab-removed-full (web and @360) |
| Ad license cancelled on Aug 26, 2026 ⟨Ad license cancelled on {date}⟩ | not in translations | code | — | web: tab-removed, tab-removed-full · @360: none |
| Ad License Cancelled | رخصة إعلان ملغية | t | — | tab-removed, tab-removed-full (web and @360) |
| Blocked by REGA on Aug 07, 2026 ⟨Blocked by REGA on {date}⟩ | not in translations | code | — | web: tab-removed, tab-removed-full · @360: none |
| Blocked By Rega | not in translations | code | — | tab-removed, tab-removed-full (web and @360) |
| Verification failed 5 times on Aug 23, 2026 ⟨Verification failed {n} times on {date}⟩ | not in translations | code | — | web: tab-removed, tab-removed-full · @360: none |
| Otp Verification Limit Exceeded | not in translations | code | — | tab-removed, tab-removed-full (web and @360) |
| Removed By Host | not in translations | code | — | tab-removed, tab-removed-full (web and @360) |
| The host took this nightly listing down. Publish it again when the property is free. | not in translations | code | — | web: tab-removed, tab-removed-full · @360: none |
| Rejected: | مرفوض | t | — | web: none · @360: tab-removed, tab-removed-full |
| Interior photos did not match the property address. Fix the photos and republish. | not in translations | code | — | web: none · @360: tab-removed, tab-removed-full |
| Removed by Bayut | المحذوفة + بواسطة + بيوت | t+ | — | web: none · @360: tab-removed, tab-removed-full |
| Removed by Bayut: | المحذوفة + بواسطة + بيوت | t+ | — | web: none · @360: tab-removed, tab-removed-full |
| Removed by Bayut moderation: the same property is already live as listing 2000011488. ⟨Removed by Bayut moderation: the same property is already live as listing {n}.⟩ | not in translations | code | — | web: none · @360: tab-removed, tab-removed-full |
| Deleted By Ops: | fixture: fixtures/lms.mjs | data | — | web: none · @360: tab-removed, tab-removed-full |
| Our operations team removed this listing after an account review. Contact support for the details. | not in translations | code | — | web: none · @360: tab-removed, tab-removed-full |
| Removed By Host: | not in translations | code | — | web: none · @360: tab-removed, tab-removed-full |
| The host took this nightly listing offline on Aug 06, 2026. Publish it again when the calendar reopens. ⟨The host took this nightly listing offline on {date}. Publish it again when the calendar reopens.⟩ | not in translations | code | — | web: none · @360: tab-removed, tab-removed-full |
| 3 nights marked as booked: Sep 11 to Sep 14 ⟨{n} nights marked as booked: Sep {n} to Sep {n}⟩ | not in translations | code | — | web: toast-booked · @360: none |
| 3 nights marked as booked ⟨{n} nights marked as booked⟩ | not in translations | code | — | web: none · @360: toast-booked |
| My Listings has a new look | not in translations | code | — | web: tour-1 · @360: tour, tour-no-listings |
| New | جديد | t | — | web: tour-1 · @360: tour, tour-no-listings, tour-no-listings-3, tour-no-listings-4 |
| Same listings, now working harder for you. Every listing shows how it ranks, what to add next, and where your next leads will come from. | not in translations | code | — | web: tour-1 · @360: none |
| Skip | تخطي | t | — | web: tour-1, tour-2, tour-3, tour-4, tour-5 · @360: tour, tour-no-listings, tour-no-listings-3, tour-no-listings-4 |
| See What's New | not in translations | code | — | web: tour-1 · @360: tour, tour-no-listings, tour-no-listings-3, tour-no-listings-4 |
| Performance and improvements | not in translations | code | — | tour-2 (web and @360) |
| See how each listing performs against similar ones nearby, then add what is missing to improve quality and outshine the competition. Use Improve Quality to fix it all in one go. | not in translations | code | — | web: tour-2 · @360: none |
| Next | التالي | t | — | web: tour-2, tour-3, tour-4 · @360: tour-2, tour-3, tour-4, tour-no-listings-2 |
| See how each listing performs against similar ones nearby, then add what is missing to improve quality and outshine the competition. Tap Improve Quality to fix it all in one go. | not in translations | code | — | web: none · @360: tour-2 |
| Split the list by performance | not in translations | code | — | web: tour-3 · @360: none |
| All, Low Performing and High Performing sit beside the filters, so the listings that need work are one click away. | not in translations | code | — | web: tour-3 · @360: none |
| Filter and sort from one bar | not in translations | code | — | web: none · @360: tour-3, tour-no-listings-2 |
| Filter, sort, and split your listings by performance to find the ones worth your time. The badge shows how many filters are on. | not in translations | code | — | web: none · @360: tour-3, tour-no-listings-2 |
| Sort by what matters | not in translations | code | — | tour-4 (web and @360) |
| Sort by quality score, rank, views or leads to bring the listings you care about to the top. | not in translations | code | — | tour-4 (web and @360) |
| Quality Score: High to Low | not in translations | code | — | web: tour-4 · @360: none |
| Listing Rank: Best First | not in translations | code | — | web: tour-4 · @360: none |
| Most Views | not in translations | code | — | web: tour-4 · @360: none |
| Most Leads | not in translations | code | — | web: tour-4 · @360: none |
| See how the score works | not in translations | code | — | web: tour-5 · @360: tour-5, tour-no-listings-4 |
| Open the full explainer any time to see how your quality score is calculated, and how rank, views, clicks and leads are measured. | not in translations | code | — | tour-5 (web and @360) |
| Got it | not in translations | code | — | tour-5 (web and @360) |
| Post your first listing | not in translations | code | — | web: none · @360: tour-no-listings-3 |
| Add the property, photos and price. Bayut scores the listing as you go, so you can see its quality before it goes live. | not in translations | code | — | web: none · @360: tour-no-listings-3 |
| The explainer covers rank, quality score, and how views, clicks and leads are measured. Worth two minutes before you post. | not in translations | code | — | web: none · @360: tour-no-listings-4 |
| Improve Rank | not in translations | code | — | web: none · @360: tour, tour-no-listings |
| Once your first listing is live, every card will show how it ranks, what to add next, and where your next leads will come from. | not in translations | code | — | web: none · @360: tour-no-listings |
| Same listings, now working harder for you. Every card shows how it ranks, what to add next, and where your next leads will come from. | not in translations | code | — | web: none · @360: tour |
