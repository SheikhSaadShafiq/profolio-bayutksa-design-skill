# Rendered copy — post-ad

Every string the compiled files of `pages/post-ad` draw — 16 web, 7 phone (@375) — in the order first drawn; the header and the rail are in `_shell.md`. Quote a string as it is here, with its file. `is`: **t** a translation · **t+** translations joined with values — ⟨pattern⟩: {{x}} the translation's placeholder, {n} a number ("75,000" is one), {date}, {time}, {x} a fixture value; ×N strings of one pattern; Arabic part by part · **code** drawn by the product, not in the translation files — spelled in its code or its data files (the Arabic beside it is the data file's own twin, `label` / `label_l1`; else "not in translations") · **data** the fixture's data, a mocked response or a value — not copy (copied unchanged into a design, it stays unmarked) · **note** quoted by a state note, drawn nowhere. A suffix says how the string is drawn: **(placeholder)** an input's placeholder attribute · **(value)** what a field holds, an input's or a textarea's value (the fixture's, unless a translation). The class is the first word — `t (placeholder)` is a **t** row: grep `| t |` and `| t (` for every t row. data-pf-src: without `src/`. files, per layout (web · @375): `all`, `all but` the states named, the states named, or `none`; `page` = `pages/post-ad.html` (`.mobile.html` for @375), a state = `pages/post-ad/<state>.html`.

| English | Arabic | is | data-pf-src | files |
|---|---|---|---|---|
| العربية | not in translations | code | components/common/button/button.js:40 | all |
| Add Images of your Property | أضف صور عقارك | t | components/common/Label/Label.js:9 | all but error, loading (web and @375) |
| Great images sell faster! Add at-least 5 clear images (Max 15MB). Drag to reorder. First image is the cover. | الصور الجيدة تبيع بشكل أسرع! أضف 5 صور واضحة على الأقل (بحد أقصى 15 ميجابايت). اسحب لإعادة الترتيب. الصورة الأولى هي صورة الغلاف. | t | components/post-listing/image-select/image-select.js:236 | all but error, loading (web and @375) |
| Cover | الغلاف | t | components/common/image-uploads/image-upload-item.js:275 | all but error, loading (web and @375) |
| Add more | أضف المزيد | t | components/post-listing/image-select/image-select.js:316 | web: all but error, loading · @375: none |
| Add Videos of your Property | إضافة مقاطع فيديو لعقارك | t | components/post-listing/video-select/video-select.js:179 | all but error, loading (web and @375) |
| Bring your property to life. Add a youtube tour link below. | أضف الحياة إلى عقارك. أضف رابط جولة يوتيوب أدناه. | t | components/post-listing/video-select/video-select.js:180 | all but error, loading (web and @375) |
| Paste youtube video link here | الصق رابط فيديو يوتيوب هنا | t (placeholder) | components/post-listing/video-select/video-select.js:138 | all but error, loading (web and @375) |
| Map Pin | دبوس الخريطة | t | components/common/Label/Label.js:9 | all but error, loading (web and @375) |
| Google Maps API key is missing. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file. | مفتاح Google Maps API مفقود. يرجى إضافة REACT_APP_GOOGLE_MAPS_API_KEY إلى ملف .env الخاص بك. | t | components/post-listing/google-map/google-map.js:210 | all but error, loading (web and @375) |
| Rental Frequency | مدة الايجار | t | components/common/Label/Label.js:9 | all but error, loading (web and @375) |
| Monthly | شهري | t | components/common/radio-button/radio-button.js:156 | all but error, loading (web and @375) |
| Yearly | سنوي | t | components/common/radio-button/radio-button.js:156 | all but error, loading (web and @375) |
| Bedrooms | غرف النوم | code | components/common/Label/Label.js:9 | all but error, loading (web and @375) |
| Studio | استوديو | t | components/common/radio-button/radio-button.js:156 | all but error, loading (web and @375) |
| 1 ⟨{n}⟩ ×10 | value | data | components/common/radio-button/radio-button.js:156 · tenant/bayut/components/post-listing/listing-preview/listing-preview.js:593 +3 | all but error, loading (web and @375) |
| 10+ ⟨{n}+⟩ | value | data | components/common/radio-button/radio-button.js:156 | all but error, loading (web and @375) |
| Bathrooms | الحمامات | code | components/common/Label/Label.js:9 | all but error, loading (web and @375) |
| Floor Number | الدور · also رقم الطابق | code | components/common/flex/styled.js:3 | all but error, loading (web and @375) |
| Enter floor number | أدخل رقم الطابق | code (placeholder) | components/common/textInput/styled.js:9 | all but error, loading (web and @375) |
| Built-up Area | المساحة المبنية | code | components/common/flex/styled.js:3 | all but error, loading (web and @375) |
| e.g., 180 ⟨e.g., {n}⟩ | not in translations | code (placeholder) | components/common/textInput/styled.js:9 | all but error, loading (web and @375) |
| Sq. M. | م2 | t | components/common/textInput/textInput.js:112 | all but error, loading (web and @375) |
| Furnished | مفروش | t | components/common/Label/Label.js:9 | all but error, loading (web and @375) |
| Yes | نعم | t | components/common/radio-button/radio-button.js:156 · tenant/bayut/components/post-listing/RegaDetailFields.js:190 | all but error, loading (web and @375) |
| No | لا | t | components/common/radio-button/radio-button.js:156 · tenant/bayut/components/post-listing/RegaDetailFields.js:190 | all but error, loading (web and @375) |
| Residence Type | نوع السكن | t | components/common/Label/Label.js:9 | all but error, loading (web and @375) |
| Family | عائلات | t | components/common/radio-button/radio-button.js:156 | all but error, loading (web and @375) |
| Open to all | متاح للجميع | t | components/common/radio-button/radio-button.js:156 | all but error, loading (web and @375) |
| Singles | عزاب | t | components/common/radio-button/radio-button.js:156 | all but error, loading (web and @375) |
| Features and Amenities | المزايا والخدمات | t | components/common/Label/Label.js:9 · components/common/modals/antd-modals.js:33 | all but error, loading (web and @375) |
| Add additional features e.g. parking spaces | إضافة ميزات إضافية على سبيل المثال مواقف للسيارات | t | components/post-listing/add-amenities/add-amenities.js:308 | all but error, loading (web and @375) |
| Add Amenities | أضف المزايا والخدمات | t | components/common/button/button.js:40 | all but error, loading (web and @375) |
| Main Features | الميزات الرئيسية | code | components/common/title/title.js:7 · components/common/tabs/tabs.js:11 | all but error, loading (web and @375) |
| Electricity | كهرباء | code | components/post-listing/add-amenities/add-amenities.js:387 · components/common/textWithIcon/styled.js:3 | all but error, loading (web and @375) |
| Water Supply | مياه | code | components/post-listing/add-amenities/add-amenities.js:387 · components/common/textWithIcon/styled.js:3 | all but error, loading (web and @375) |
| Sewerage | صرف صحي | code | components/post-listing/add-amenities/add-amenities.js:387 · components/common/textWithIcon/styled.js:3 | all but error, loading (web and @375) |
| Central Air Conditioning | fixture: fixtures/listing-form.mjs | data | components/post-listing/add-amenities/add-amenities.js:387 · components/common/textWithIcon/styled.js:3 | all but error, loading (web and @375) |
| Building and Services | fixture: fixtures/listing-form.mjs | data | components/common/title/title.js:7 · components/common/tabs/tabs.js:11 | all but error, loading (web and @375) |
| Elevator | fixture: fixtures/listing-form.mjs | data | components/post-listing/add-amenities/add-amenities.js:387 · components/common/textWithIcon/styled.js:3 | all but error, loading (web and @375) |
| Title | عنوان الإعلان | t | components/common/flex/styled.js:3 | all but error, loading (web and @375) |
| Enter title e.g Beautiful new house... | أدخل العنوان على سبيل المثال منزل جديد جميل... | t (placeholder) | components/common/textInput/textInput.js:95 | all but error, loading (web and @375) |
| 2 Bedroom Apartment for Rent in Al Aqiq, Riyadh ⟨{n} Bedroom Apartment for Rent in Al Aqiq, Riyadh⟩ | value | data (value) | components/common/textInput/textInput.js:95 | all but error, form-errors-empty, loading (web and @375) |
| Auto Translate Arabic Title | not in translations | code | components/common/text/text.js:8 | all but error, loading (web and @375) |
| Generate Title | اكتب عنوان تلقائي | t | components/common/button/button.js:40 | all but error, loading (web and @375) |
| Description | وصف الإعلان | t | components/common/flex/styled.js:3 | all but error, loading (web and @375) |
| Describe your property in detail | أدخل وصف العقار | code (placeholder) | components/common/textInput/textInput.js:95 | all but error, loading (web and @375) |
| 140 sq. m. apartment for rent in Al Aqiq, North Riyadh, with 2 bedrooms, a family living room and a separate majlis. It faces east on a street 15 m wide, with central air conditioning, a fitted kitchen and a covered parking space. Close to schools, mosques and daily shopping, with quick access to the main roads of Riyadh. Contact Najd Horizon Real Estate to arrange a viewing. ⟨{n} sq. m. apartment for rent in Al Aqiq, North Riyadh, with {n} bedrooms, a family living room and a separate majlis. It faces east on a street {n} m wide, with central air conditioning, a fitted kitchen and a covered parking space. Close to schools, mosques and daily shopping, with quick access to the main roads of Riyadh. Contact Najd Horizon Real Estate to arrange a viewing.⟩ | value | data (value) | components/common/textInput/textInput.js:95 | all but error, form-errors-empty, loading (web and @375) |
| Auto Translate Arabic Description | not in translations | code | components/common/text/text.js:8 | all but error, loading (web and @375) |
| Generate Description | اكتب وصف تلقائي | t | components/common/button/button.js:40 | all but error, loading (web and @375) |
| Post Listing | نشر إعلان | t | components/common/button/button.js:40 | all but error, loading (web and @375) |
| Listing Details from REGA | تفاصيل الإعلان من هيئة العقار | t | tenant/bayut/components/post-listing/RegaCard.js:257 · components/common/drawer/drawer.js:90 +1 | all but error, loading (web and @375) |
| Ad License | رخصة الإعلان | t | tenant/bayut/components/post-listing/RegaCard.js:265 | all but error, loading (web and @375) |
| 7201352296 ⟨{n}⟩ | value | data | tenant/bayut/components/post-listing/RegaCard.js:266 · tenant/bayut/components/post-listing/listingDetailModal.js:105 | all but error, loading (web and @375) |
| Property Type | نوع العقار | t | tenant/bayut/components/post-listing/RegaCard.js:314 · tenant/bayut/components/post-listing/RegaCard.js:287 +1 | all but error, loading (web and @375) |
| Apartment | not in translations | code | tenant/bayut/components/post-listing/RegaCard.js:315 · tenant/bayut/components/post-listing/RegaCard.js:288 +1 | all but error, loading (web and @375) |
| Purpose | الغرض | t | tenant/bayut/components/post-listing/RegaCard.js:320 · tenant/bayut/components/post-listing/RegaCard.js:287 | all but error, loading (web and @375) |
| For Rent | للإيجار | t | tenant/bayut/components/post-listing/RegaCard.js:321 · tenant/bayut/components/post-listing/RegaCard.js:288 +1 | all but error, loading (web and @375) |
| Price | السعر | t | tenant/bayut/components/post-listing/RegaCard.js:326 · tenant/bayut/components/post-listing/RegaCard.js:287 | all but error, loading (web and @375) |
| [riyal] 65,000 ⟨[riyal]{n}⟩ | value | data | tenant/bayut/components/post-listing/RegaCard.js:327 · tenant/bayut/components/post-listing/listing-preview/listing-preview.js:564 +2 | all but error, loading (web and @375) |
| Area | المساحة | t | tenant/bayut/components/post-listing/RegaCard.js:334 · tenant/bayut/components/post-listing/RegaCard.js:287 | all but error, loading (web and @375) |
| 140 Sq. M. ⟨{n} Sq. M.⟩ | {n} + م2 | t+ | tenant/bayut/components/post-listing/RegaCard.js:335 · tenant/bayut/components/post-listing/RegaCard.js:288 +1 | all but error, loading (web and @375) |
| Go to REGA ⟨Go to {{link}}⟩ | انتقل إلى منصة بيوت | t+ | tenant/bayut/components/post-listing/RegaCard.js:353 | web: all but error, loading · @375: none |
| Al Aqiq, Riyadh, منطقة الرياض | fixture: fixtures/listing-form.mjs | data | tenant/bayut/components/post-listing/RegaCard.js:364 · tenant/bayut/components/post-listing/RegaCard.js:301 +1 | all but error, loading (web and @375) |
| See More Details | عرض المزيد من التفاصيل | t | tenant/bayut/components/post-listing/RegaCard.js:372 · tenant/bayut/components/post-listing/RegaCard.js:304 | all but error, loading (web and @375) |
| Your Listing will look like this | سيبدو إعلانك هكذا | t | tenant/bayut/components/post-listing/listing-preview/listing-preview.js:492 | web: all but error, loading · @375: none |
| 1/8 ⟨{n}/{n}⟩ | value | data | tenant/bayut/components/post-listing/listing-preview/listing-preview.js:548 · components/post-listing/media-gallery/media-gallery-modal.js:314 | web: all but error, loading · @375: none |
| 140 sqm ⟨{n} sqm⟩ | {n} + م2 | t+ | tenant/bayut/components/post-listing/listing-preview/listing-preview.js:605 | web: all but error, loading · @375: none |
| 2 Bedroom Apartment for Rent in Al Aqiq, Riyadh | fixture: fixtures/listing-form.mjs | data | tenant/bayut/components/post-listing/listing-preview/listing-preview.js:614 | web: all but error, loading · @375: none |
| Al Aqiq, Riyadh | fixture: fixtures/listing-form.mjs | data | tenant/bayut/components/post-listing/listing-preview/listing-preview.js:622 | web: all but error, loading · @375: none |
| From Gallery | من المعرض | t | components/post-listing/image-select/image-select.js:311 | web: none · @375: all but error, loading |
| See Preview | معاينة | t | components/common/button/button.js:40 | web: none · @375: all but error, loading |
| REGA Details | تفاصيل ترخيص الإعلان | t | tenant/bayut/components/post-listing/listingDetailModal.js:90 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Apartment For Rent | fixture: fixtures/listing-form.mjs | data | tenant/bayut/components/post-listing/listingDetailModal.js:91 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Ad License: | ترخيص الإعلان: | t | tenant/bayut/components/post-listing/listingDetailModal.js:104 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| View Details on Rega | not in translations | code | tenant/bayut/components/post-listing/listingDetailModal.js:135 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| License Info | معلومات رخصة فال | t | tenant/bayut/components/post-listing/RegaDetailFields.js:152 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| FAL License no. | رقم رخصة فال | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Created date | تاريخ الاصدار | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| 2026-09-30 ⟨{n}-{n}-{n}⟩ ×2 | value | data | tenant/bayut/components/post-listing/RegaDetailFields.js:190 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Expiry Date | تاريخ الانتهاء | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Ad Responsible Info | معلومات مسؤول الإعلان | t | tenant/bayut/components/post-listing/RegaDetailFields.js:152 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Responsible Name | اسم المسؤول | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| فيصل الحربي - نجد هورايزن للعق | not in translations | code | tenant/bayut/components/post-listing/RegaDetailFields.js:190 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Responsible Number | رقم المسؤول | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| 0501234567 ⟨{n}⟩ ×9 | value | data | tenant/bayut/components/post-listing/RegaDetailFields.js:190 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Location | الموقع | t | tenant/bayut/components/post-listing/RegaDetailFields.js:152 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Region | المنطقة | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| منطقة الرياض | fixture: fixtures/credits.mjs | data | tenant/bayut/components/post-listing/RegaDetailFields.js:190 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| City | المدينة | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Riyadh | fixture: fixtures/extra.mjs | data | tenant/bayut/components/post-listing/RegaDetailFields.js:190 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| District | الحي | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Al Aqiq | fixture: fixtures/listing-form.mjs | data | tenant/bayut/components/post-listing/RegaDetailFields.js:190 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Street name | اسم الشارع | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Postal Code | الرمز البريدي | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Building no. | رقم المبنى | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Additional no. | الرقم الاضافي | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Latitude | خط العرض | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Longitude | خط الطول | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Property Specs | تفاصيل العقار | t | tenant/bayut/components/post-listing/RegaDetailFields.js:152 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Ad type | نوع الإعلان | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Property usage | استخدام العقار | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Area size | المساحة | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| 140 Sqm ⟨{n} Sqm⟩ | {n} + م2 | t+ | tenant/bayut/components/post-listing/RegaDetailFields.js:190 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| No.of rooms | عدد الغرف | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Utilities | خدمات العقار | t | tenant/bayut/components/post-listing/RegaDetailFields.js:152 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Electricty | كهرباء | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Sanitation | صرف صحي | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Water | ماء | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Additional Info | تفاصيل اضافية | t | tenant/bayut/components/post-listing/RegaDetailFields.js:152 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Property age | not in translations | code | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| 3 years | 3 سنوات | t | tenant/bayut/components/post-listing/RegaDetailFields.js:190 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Street width | عرض الشارع | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Plan no | رقم المخطط | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Deed no. | رقم صك الملكية | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Property Facade | واجهة العقار | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Eastern | شرقية | code | tenant/bayut/components/post-listing/RegaDetailFields.js:190 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Border & lengths | حدود واطوال العقار | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Guarantees or Duration | الضمانات والمدة | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Channels | قنوات الإعلان | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Licensed Platform | fixture: fixtures/listing-form.mjs | data | tenant/bayut/components/post-listing/RegaDetailFields.js:190 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Any obligations on property | هل يوجد اي التزام على العقار ؟ | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| لا يوجد | fixture: fixtures/credits.mjs | data | tenant/bayut/components/post-listing/RegaDetailFields.js:190 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Compliance with Saudi building | مطابقة لكود البناء السعودي | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Property is pawned | العقار مرهون | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Property is Constrained | العقار مقيد | t | tenant/bayut/components/post-listing/RegaDetailFields.js:187 | web: modal-listing-details-from-rega-ad-license · @375: drawer-listing-details-from-rega-ad-license |
| Error | خطأ! | t | components/common/heading/heading.js:10 | error (web and @375) |
| Something went wrong, please try again | حدث خطا ما. اعد المحاولة من فضلك | t | components/common/EmptyState/EmptyState.js:149 | error (web and @375) |
| Retry | اعادة المحاولة | t | components/common/button/button.js:40 | error (web and @375) |
| Please enter title ⟨Please enter {{label}}⟩ ×2 | الرجاء إدخال {{label}} | t+ | components/common/errorMessage/errorMessage.js:26 | form-errors-empty (web and @375) |
| Listing could not be saved. Please try again. | fixture: fixtures/listing-form.mjs | data | — | message-post-failed (web and @375) |
| Rooms | غرف | t | components/common/tabs/tabs.js:11 | web: modal-add-amenities, modal-add-amenities__modal-building-and-services, modal-add-amenities__modal-rooms · @375: none |
| Outdoor | fixture: fixtures/listing-form.mjs | data | components/common/tabs/tabs.js:11 | web: modal-add-amenities, modal-add-amenities__modal-building-and-services, modal-add-amenities__modal-rooms · @375: none |
| Parking Spaces | مواقف سيارات | code | components/common/textWithIcon/styled.js:3 | web: modal-add-amenities__modal-building-and-services · @375: none |
| Private Parking | fixture: fixtures/listing-form.mjs | data | components/common/textWithIcon/styled.js:3 | web: modal-add-amenities__modal-building-and-services · @375: none |
| Security | fixture: fixtures/listing-form.mjs | data | components/common/textWithIcon/styled.js:3 | web: modal-add-amenities__modal-building-and-services · @375: none |
| Cancel | إلغاء | t | components/common/button/button.js:40 | web: modal-add-amenities, modal-add-amenities__modal-building-and-services, modal-add-amenities__modal-rooms · @375: none |
| Maid Room | غرفة خادمة | code | components/common/textWithIcon/styled.js:3 | web: modal-add-amenities__modal-rooms · @375: none |
| Driver Room | fixture: fixtures/listing-form.mjs | data | components/common/textWithIcon/styled.js:3 | web: modal-add-amenities__modal-rooms · @375: none |
| Laundry Room | fixture: fixtures/listing-form.mjs | data | components/common/textWithIcon/styled.js:3 | web: modal-add-amenities__modal-rooms · @375: none |
| Majlis | fixture: fixtures/listing-form.mjs | data | components/common/textWithIcon/styled.js:3 | web: modal-add-amenities__modal-rooms · @375: none |
| Fitted Kitchen | fixture: fixtures/listing-form.mjs | data | components/common/textWithIcon/styled.js:3 | web: modal-add-amenities · @375: none |
| Images (8) ⟨Images ({n})⟩ | الصور + {n} | t+ | components/post-listing/media-gallery/media-gallery-modal.js:265 | web: modal-cover-add-more, modal-cover-add-more__modal-images-8-videos-0, modal-cover-add-more__modal-videos-0, modal-images-8-videos-0, modal-images-8-videos-0__modal-images-8-videos-0, modal-images-8-videos-0__modal-videos-0 · @375: none |
| Videos (0) ⟨Videos ({n})⟩ | فيديوهات + {n} | t+ | components/post-listing/media-gallery/media-gallery-modal.js:269 | web: modal-cover-add-more, modal-cover-add-more__modal-images-8-videos-0, modal-cover-add-more__modal-videos-0, modal-images-8-videos-0, modal-images-8-videos-0__modal-images-8-videos-0, modal-images-8-videos-0__modal-videos-0 · @375: none |
| 4/8 ⟨{n}/{n}⟩ ×3 | value | data | components/post-listing/media-gallery/media-gallery-modal.js:314 | web: modal-cover-add-more, modal-cover-add-more__modal-images-8-videos-0, modal-images-8-videos-0__modal-images-8-videos-0 · @375: none |
| No videos added yet | لم تتم إضافة مقاطع فيديو بعد | t | components/post-listing/media-gallery/media-gallery-modal.js:309 | web: modal-cover-add-more__modal-videos-0, modal-images-8-videos-0__modal-videos-0 · @375: none |
| Your listing has been submitted successfully | fixture: fixtures/listing-form.mjs | data | components/common/heading/heading.js:10 | modal-post-listing (web and @375) |
