# Rendered copy — reports-listing-report

Every string the compiled files of `pages/reports-listing-report` draw — 23 web, 11 phone (@375) — in the order first drawn; the header and the rail are in `_shell.md`. Quote a string as it is here, with its file. `is`: **t** a translation · **t+** translations joined with values — ⟨pattern⟩: {{x}} the translation's placeholder, {n} a number ("75,000" is one), {date}, {time}, {x} a fixture value; ×N strings of one pattern; Arabic part by part · **code** drawn by the product, not in the translation files — spelled in its code or its data files (the Arabic beside it is the data file's own twin, `label` / `label_l1`; else "not in translations") · **data** the fixture's data, a mocked response or a value — not copy (copied unchanged into a design, it stays unmarked) · **note** quoted by a state note, drawn nowhere. A suffix says how the string is drawn: **(placeholder)** an input's placeholder attribute · **(value)** what a field holds, an input's or a textarea's value (the fixture's, unless a translation). The class is the first word — `t (placeholder)` is a **t** row: grep `| t |` and `| t (` for every t row. data-pf-src: without `src/`. files, per layout (web · @375): `all`, `all but` the states named, the states named, or `none`; `page` = `pages/reports-listing-report.html` (`.mobile.html` for @375), a state = `pages/reports-listing-report/<state>.html`.

| English | Arabic | is | data-pf-src | files |
|---|---|---|---|---|
| Listings | الإعلانات | t | components/common/textWithIcon/styled.js:3 · components/common/dataTable/dataTable.js:185 | all but loading (web and @375) |
| Active | فعال | t | components/common/statistic/index.js:93 | all but loading (web and @375) |
| 20 ⟨{n}⟩ ×4 | value | data | components/common/statistic/index.js:93 · components/common/number/number.js:107 +2 | all but loading (web and @375) |
| For Sale | للبيع | t | components/common/statistic/index.js:93 · components/charts/chartjs.js:713 | all but loading (web and @375) |
| 13 ⟨{n}⟩ ×19 | value | data | components/common/number/number.js:107 · components/common/statistic/index.js:93 +4 | all but empty, error, loading (web and @375) |
| To Rent | للايجار | t | components/common/statistic/index.js:93 · components/charts/chartjs.js:713 | all but loading (web and @375) |
| Daily Rentals | إيجارات يومية | t | components/common/statistic/index.js:93 | all but loading (web and @375) |
| 2 ⟨{n}⟩ ×2 | value | data | components/widgets/BreakdownByAreaWidget.js:197 · components/common/statistic/index.js:93 +5 | all but empty, error, loading (web and @375) |
| Signature | استثنائي | t | components/common/statistic/index.js:93 · components/common/dataTable/dataTable.js:185 | all but loading (web and @375) |
| Hot | مُميز | t | components/common/statistic/index.js:93 · components/common/dataTable/dataTable.js:185 | all but loading (web and @375) |
| Basic | أساسي | t | components/common/statistic/index.js:93 · components/common/dataTable/dataTable.js:185 | all but loading (web and @375) |
| 3 ⟨{n}⟩ ×2 | value | data | components/common/textWithIcon/textWithIcon.js:65 · components/common/statistic/index.js:93 +3 | all but empty, error, loading (web and @375) |
| Breakdown By Location | التفاصيل حسب الموقع | t | components/common/textWithIcon/styled.js:3 | all but error, loading (web and @375) |
| Al Yarmuk | fixture: fixtures/credits.mjs | data | components/widgets/BreakdownByAreaWidget.js:179 | all but empty, error, loading (web and @375) |
| 38.5% ⟨{n}%⟩ ×6 | value | data | components/widgets/BreakdownByAreaWidget.js:198 | all but empty, error, loading (web and @375) |
| Al Nahdah | fixture: fixtures/credits.mjs | data | components/widgets/BreakdownByAreaWidget.js:179 | all but empty, error, loading (web and @375) |
| Al Wurud | fixture: fixtures/credits.mjs | data | components/widgets/BreakdownByAreaWidget.js:179 | all but empty, error, loading (web and @375) |
| Al Masif | fixture: fixtures/credits.mjs | data | components/widgets/BreakdownByAreaWidget.js:179 | all but empty, error, loading (web and @375) |
| Al Mughrizat | fixture: fixtures/credits.mjs | data | components/widgets/BreakdownByAreaWidget.js:179 | all but empty, error, loading (web and @375) |
| Al Malqa | fixture: fixtures/extra.mjs | data | components/widgets/BreakdownByAreaWidget.js:179 | all but empty, error, loading (web and @375) |
| Al Narjis | fixture: fixtures/listing-form.mjs | data | components/widgets/BreakdownByAreaWidget.js:179 | all but empty, error, loading (web and @375) |
| Al Rawabi | fixture: fixtures/credits.mjs | data | components/widgets/BreakdownByAreaWidget.js:179 | all but empty, error, loading (web and @375) |
| Listing Performance | أداء الإعلان | t | components/common/cards/styled.js:17 | all |
| Listing By Date | الإعلانات حسب التاريخ | t | components/common/cards/styled.js:17 | all |
| Property | عقار | t | components/common/dataTable/dataTable.js:185 | web: all but empty, error, inline-listing-by-date, loading · @375: none |
| Posted On | تم النشر في | t | components/common/dataTable/dataTable.js:185 | web: all but empty, error, inline-listing-by-date, loading · @375: none |
| Views | المشاهدات | t | components/common/statistic/index.js:93 · components/common/dataTable/dataTable.js:185 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| Clicks | الزيارات | t | components/common/statistic/index.js:93 · components/common/dataTable/dataTable.js:185 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| All Leads | جميع الاستفسارات | t | components/common/dataTable/dataTable.js:185 | web: all but empty, error, inline-listing-by-date, loading · @375: none |
| Whatsapp | واتساب | t | components/common/dataTable/dataTable.js:185 | web: all but empty, error, inline-listing-by-date, loading · @375: none |
| Calls | المكالمات | t | components/common/statistic/index.js:93 · components/common/dataTable/dataTable.js:185 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| SMS | الرسائل النصية | t | components/common/statistic/index.js:93 · components/common/dataTable/dataTable.js:185 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| Emails | الرسائل البريدية | t | components/common/dataTable/dataTable.js:185 | web: all but empty, error, inline-listing-by-date, loading · @375: none |
| [riyal] 1,250,000 ⟨[riyal]{n}⟩ ×10 | value | data | components/common/number/number.js:107 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| 62% ⟨{n}%⟩ ×11 | value | data | components/listing-health/styled.js:41 | web: all but empty, error, inline-listing-by-date, loading · @375: none |
| Floor for Sale ⟨{x} for Sale⟩ ×2 | {x} + للبيع | t+ | components/common/tag/styled.js:6 · tenant/common/components/reports/CardListingPerformance.js:134 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| 64 Sq. M. ⟨{n} Sq. M.⟩ ×8 | {n} + م2 | t+ | components/common/textWithIcon/textWithIcon.js:65 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| Al Wurud, North Riyadh, Riyadh | fixture: fixtures/credits.mjs | data | components/table/table-components/listing-purpose.js:424 · tenant/common/components/reports/CardListingPerformance.js:131 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| Bayut ID: | رقم بيوت المرجعي: | t | components/table/table-components/listing-purpose.js:427 | web: all but empty, error, inline-listing-by-date, loading · @375: none |
| 88240117 ⟨{n}⟩ ×10 | value | data | components/table/table-components/listing-purpose.js:434 | web: all but empty, error, inline-listing-by-date, loading · @375: none |
| REGA ID: | رقم ترخيص الإعلان: | t | components/table/table-components/listing-purpose.js:461 | web: all but empty, error, inline-listing-by-date, loading · @375: none |
| 7201340882 ⟨{n}⟩ ×8 | value | data | components/table/table-components/listing-purpose.js:462 | web: all but empty, error, inline-listing-by-date, loading · @375: none |
| Sep 28, 2026 ⟨{date}⟩ ×10 | value | data | components/table/table-components/date.js:19 · components/common/statistic/index.js:93 +1 | all but empty, error, loading (web and @375) |
| Al Masif, North Riyadh, Riyadh | fixture: fixtures/credits.mjs | data | components/table/table-components/listing-purpose.js:424 · tenant/common/components/reports/CardListingPerformance.js:131 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| Chalet for Rent ⟨{x} for Rent⟩ | {x} + للإيجار | t+ | components/common/tag/styled.js:6 · tenant/common/components/reports/CardListingPerformance.js:134 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| Al Mughrizat, North Riyadh, Riyadh | fixture: fixtures/credits.mjs | data | components/table/table-components/listing-purpose.js:424 · tenant/common/components/reports/CardListingPerformance.js:131 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| Apartment for Sale | fixture: fixtures/listing-form.mjs | data | components/common/tag/styled.js:6 · tenant/common/components/reports/CardListingPerformance.js:134 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| Al Rawabi, East Riyadh, Riyadh | fixture: fixtures/credits.mjs | data | components/table/table-components/listing-purpose.js:424 · tenant/common/components/reports/CardListingPerformance.js:131 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| Villa for Daily Rental ⟨{x} for Daily Rental⟩ ×2 | {x} + للإيجار اليومي | t+ | components/common/tag/styled.js:6 · tenant/common/components/reports/CardListingPerformance.js:134 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| Al Nahdah, East Riyadh, Riyadh | fixture: fixtures/credits.mjs | data | components/table/table-components/listing-purpose.js:424 · tenant/common/components/reports/CardListingPerformance.js:131 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| Permit No. | رقم التصريح · also رقم الترخيص: | t | components/table/table-components/listing-purpose.js:485 | web: all but empty, error, inline-listing-by-date, loading · @375: none |
| 48235710 ⟨{n}⟩ ×2 | value | data | components/table/table-components/listing-purpose.js:488 | web: all but empty, error, inline-listing-by-date, loading · @375: none |
| As Sulaymaniyah, Al Diriyah | fixture: fixtures/credits.mjs | data | components/table/table-components/listing-purpose.js:424 · tenant/common/components/reports/CardListingPerformance.js:131 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| Al Yarmuk, East Riyadh, Riyadh | fixture: fixtures/credits.mjs | data | components/table/table-components/listing-purpose.js:424 · tenant/common/components/reports/CardListingPerformance.js:131 | all but empty, error, inline-listing-by-date, loading (web and @375) |
| © 2026 – All Rights Reserved ⟨© {n} – All Rights Reserved⟩ | {n} + كل الحقوق محفوظة | t+ | layout/withAdminLayout.js:477 | all |
| FEEDBACK | ملاحظاتك | t | components/feedback/FeedbackTab.js:98 | web: all but drawer-feedback, modal-download-app, modal-help-support-profolio · @375: all but drawer-feedback, drawer-notifications-mark-all-as, drawer-profile-information-faisal-al-harbi |
| 3 Beds ⟨{n} Beds⟩ ×3 | {n} + غرف النوم | t+ | components/common/textWithIcon/textWithIcon.js:65 | web: none · @375: all but empty, error, inline-listing-by-date, loading |
| Date | التاريخ · also تاريخ الإضافة | t | components/common/statistic/index.js:93 · components/common/dataTable/dataTable.js:185 | web: inline-listing-by-date · @375: all but empty, error, loading |
| Total Leads | إجمالي العملاء المحتملين | t | components/common/statistic/index.js:93 | web: none · @375: all but empty, error, inline-listing-by-date, loading |
| WhatsApp | واتساب | t | components/common/statistic/index.js:93 | web: none · @375: all but empty, error, inline-listing-by-date, loading |
| Email | إيميل / البريد الإلكتروني · also إيميل | t | components/common/statistic/index.js:93 | web: none · @375: all but empty, error, inline-listing-by-date, loading |
| Others | آحرون | t | components/widgets/BreakdownByAreaWidget.js:179 | as-staff (web and @375) |
| Al Sahafa | fixture: fixtures/payments.mjs | data | components/widgets/BreakdownByAreaWidget.js:179 | as-staff (web and @375) |
| Send us feedback | أرسل لنا ملاحظاتك | t | components/feedback/FeedbackDrawer.js:189 | drawer-feedback (web and @375) |
| The product team reads every message. | فريق المنتج يقرأ كل رسالة. | t | components/feedback/FeedbackDrawer.js:190 | drawer-feedback (web and @375) |
| What kind of feedback is this? | ما نوع هذه الملاحظة؟ | t | components/feedback/FeedbackDrawer.js:285 | drawer-feedback (web and @375) |
| Feedback | ملاحظة | t | components/feedback/FeedbackDrawer.js:290 | drawer-feedback (web and @375) |
| Feature request | طلب ميزة | t | components/feedback/FeedbackDrawer.js:290 | drawer-feedback (web and @375) |
| Issue | مشكلة | t | components/feedback/FeedbackDrawer.js:290 | drawer-feedback (web and @375) |
| Tell us more | أخبرنا المزيد | t | components/feedback/FeedbackDrawer.js:322 | drawer-feedback (web and @375) |
| Describe what happened, or the change you would like to see. | صف ما حدث، أو التغيير الذي تود رؤيته. | t (placeholder) | components/feedback/FeedbackDrawer.js:323 | drawer-feedback (web and @375) |
| Attach a screenshot | إرفاق لقطة شاشة | t | components/feedback/FeedbackAttachment.js:131 | drawer-feedback (web and @375) |
| We attach the page you are on (Listing Report) and your account details. ⟨We attach the page you are on ({{pageName}}) and your account details.⟩ | نرفق الصفحة التي تتصفحها ({{pageName}}) وتفاصيل حسابك. | t+ | components/feedback/FeedbackDrawer.js:362 | drawer-feedback (web and @375) |
| Cancel | إلغاء | t | components/feedback/FeedbackDrawer.js:225 | drawer-feedback (web and @375) |
| Send feedback | إرسال الملاحظة | t | components/feedback/FeedbackDrawer.js:244 | drawer-feedback (web and @375) |
| Notifications | الإشعارات | t | components/notification-center/notification-center.js:85 | web: none · @375: drawer-notifications-mark-all-as |
| Mark all as read | تحديد الكل كمقروء | t | components/common/button/button.js:40 | web: none · @375: drawer-notifications-mark-all-as |
| Your listing is live | fixture: fixtures.mjs | data | components/common/flex/styled.js:3 | web: none · @375: drawer-notifications-mark-all-as |
| an hour ago | not in translations | code | components/common/text/text.js:8 | web: none · @375: drawer-notifications-mark-all-as |
| Credits expiring soon | fixture: fixtures.mjs | data | components/common/flex/styled.js:3 | web: none · @375: drawer-notifications-mark-all-as |
| a day ago | not in translations | code | components/common/text/text.js:8 | web: none · @375: drawer-notifications-mark-all-as |
| TruCheck visit scheduled | fixture: fixtures.mjs | data | components/common/flex/styled.js:3 | web: none · @375: drawer-notifications-mark-all-as |
| 3 days ago ⟨{n} days ago⟩ | not in translations | code | components/common/text/text.js:8 | web: none · @375: drawer-notifications-mark-all-as |
| Profile Information | معلومات الحساب الشخصي | t | components/common/drawer/drawer.js:90 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| Faisal Al-Harbi | fixture: fixtures/user.json | data | components/utilities/auth-info/info.js:84 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| Agency User | not in translations | code | components/utilities/auth-info/info.js:89 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| faisal@najdhorizon.example | fixture: fixtures/user.json | data | components/utilities/auth-info/info.js:96 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| Nafath Verified | تم توثيق الحساب من النفاذ الوطني | t | components/utilities/auth-info/info.js:105 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| REGA Verified | تم التحقق من رخصة فال | t | components/utilities/auth-info/info.js:114 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| Account Settings | إعدادت الحساب | t | components/utilities/auth-info/info.js:124 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| Sign Out | not in translations | code | components/utilities/auth-info/info.js:144 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| Not enough data | لا توجد بيانات كافية | t | components/widgets/BreakdownByAreaWidget.js:208 | empty (web and @375) |
| No Record Found | لا توجد بيانات | t | components/common/heading/heading.js:10 | web: empty · @375: none |
| Error! | خطأ! | t | components/common/heading/heading.js:10 | error (web and @375) |
| [object Object] | not in translations | code | components/common/EmptyState/EmptyState.js:149 | error (web and @375) |
| Retry | اعادة المحاولة | t | components/common/button/button.js:40 | error (web and @375) |
| Error | خطأ! | t | components/common/heading/heading.js:10 | error (web and @375) |
| Something went wrong, please try again | حدث خطا ما. اعد المحاولة من فضلك | t | components/common/EmptyState/EmptyState.js:149 | error (web and @375) |
| Sale | بيع | t | components/common/dataTable/dataTable.js:185 | web: inline-listing-by-date · @375: none |
| Rent | للإيجار | t | components/common/dataTable/dataTable.js:185 | web: inline-listing-by-date · @375: none |
| Oct 01, 2026 ⟨{date}⟩ ×7 | value | data | components/table/table-components/date.js:16 · components/common/statistic/index.js:93 | inline-listing-by-date (web and @375) |
| Posted Listings | not in translations | code | components/common/statistic/index.js:93 | web: none · @375: inline-listing-by-date |
| Refresh | إعادة نشر | t | components/common/statistic/index.js:93 | web: none · @375: inline-listing-by-date |
| Photography | تصوير فوتوغرافي | t | components/common/statistic/index.js:93 | web: none · @375: inline-listing-by-date |
| Videography | تصوير الفيديو | t | components/common/statistic/index.js:93 | web: none · @375: inline-listing-by-date |
| Get the Bayut KSA App | حمل تطبيق بيوت السعودية | t | tenant/common/components/downloadAppModal/downloadAppModal.js:22 | web: modal-download-app · @375: none |
| Scan the QR code to download the app | قم بسمح الكود لتحميل التطبيق | t | tenant/common/components/downloadAppModal/downloadAppModal.js:29 | web: modal-download-app · @375: none |
| OR | أو | t | tenant/common/components/downloadAppModal/downloadAppModal.js:39 | web: modal-download-app · @375: none |
| Help & Support | المساعدة والدعم | t | components/common/modals/antd-modals.js:33 | web: modal-help-support-profolio · @375: none |
| Profolio | بروفوليو | t | components/common/flex/styled.js:3 | web: modal-help-support-profolio · @375: none |
| Discover more about Profolio. Our best-in-class listings management software. | تعرف أكثر على بروفوليو، أفضل برنامج لإدارة متجرك العقاري أونلاين | t | components/common/custom-card/customCard.js:80 | web: modal-help-support-profolio · @375: none |
| REGA Compliance | ضوابط الإعلانات العقارية ورخصة فال | t | components/common/flex/styled.js:3 | web: modal-help-support-profolio · @375: none |
| Discover more about REGA and real estate regulations. | اكتشف المزيد عن الهيئة العامة للعقار ونظام الوساطة العقارية | t | components/common/custom-card/customCard.js:80 | web: modal-help-support-profolio · @375: none |
| FAQ's | الأسئلة المتكررة | t | components/common/flex/styled.js:3 | web: modal-help-support-profolio · @375: none |
| Explore answers to frequently asked questions and have your issues resolved. | اكتشف الإجابات على الأسئلة المتكررة واحصل على حلول لمشاكلك | t | components/common/custom-card/customCard.js:80 | web: modal-help-support-profolio · @375: none |
| Report to REGA | الإبلاغ إلى الهيئة العامة للعقار | t | components/common/flex/styled.js:3 | web: modal-help-support-profolio · @375: none |
| Report issues so we can review this listing. | أبلغ عن المشاكل حتى نتمكن من مراجعة هذا الإعلان. | t | components/common/custom-card/customCard.js:80 | web: modal-help-support-profolio · @375: none |
| Overall Quality | مؤشر الجودة | t | components/listing-health/listing-health.js:32 | web: popover-31, popover-33, popover-34, popover-39 +5 more · @375: none |
| Higher quality means more listing visibility & leads | جودة أعلى تعني زيادة في ظهور الإعلان والعملاء المحتملين | t | components/listing-health/listing-health.js:35 | web: popover-31, popover-33, popover-34, popover-39 +5 more · @375: none |
| Freshness | الحداثة | t | components/common/heading/heading.js:10 | web: popover-31, popover-33, popover-34, popover-39 +5 more · @375: none |
| Listing is 9 days old | fixture: fixtures/listings.mjs | data | components/listing-health/listing-health.js:106 | web: popover-31 · @375: none |
| Fresh listings get more views and leads | fixture: fixtures/listing-form.mjs | data | components/listing-health/listing-health.js:109 | web: popover-31, popover-33, popover-34, popover-39 +5 more · @375: none |
| Images | الصور | t | components/common/heading/heading.js:10 | web: popover-31, popover-33, popover-34, popover-39 +5 more · @375: none |
| 8/8 Exterior Images Added ⟨{{count}}/{{required}} Exterior Images Added⟩ | {{count}}/{{required}} صور خارجية مضافة | t+ | components/listing-health/listing-health.js:106 | web: popover-31, popover-33, popover-34, popover-39 +5 more · @375: none |
| Your listing has sufficient exterior images | إعلانك يحتوي على صور خارجية كافية | t | components/listing-health/listing-health.js:109 | web: popover-31, popover-33, popover-34, popover-39 +5 more · @375: none |
| 10/10 Interior Images Added ⟨{{count}}/{{required}} Interior Images Added⟩ ×9 | {{count}}/{{required}} صور داخلية مضافة | t+ | components/listing-health/listing-health.js:106 | web: popover-31, popover-33, popover-34, popover-39 +5 more · @375: none |
| Your listing has sufficient interior images | إعلانك يحتوي على صور داخلية كافية | t | components/listing-health/listing-health.js:109 | web: popover-31, popover-33, popover-34, popover-39 +5 more · @375: none |
| No Duplicate Images | fixture: fixtures/listing-form.mjs | data | components/listing-health/listing-health.js:106 | web: popover-31, popover-33, popover-34, popover-39 +5 more · @375: none |
| All images in this listing are unique across your listings | fixture: fixtures/listing-form.mjs | data | components/listing-health/listing-health.js:109 | web: popover-31, popover-33, popover-34, popover-39 +5 more · @375: none |
| Features | المميزات | t | components/common/heading/heading.js:10 | web: popover-31, popover-33, popover-34, popover-39 +5 more · @375: none |
| Add | إضافة | t | components/common/button/button.js:40 | web: popover-31, popover-33, popover-34, popover-39 +5 more · @375: none |
| 4 of 8 Features Added | fixture: fixtures/listing-form.mjs | data | components/listing-health/listing-health.js:106 | web: popover-31, popover-33, popover-34, popover-39 +5 more · @375: none |
| Add more features to your ad. | fixture: fixtures/listing-form.mjs | data | components/listing-health/listing-health.js:109 | web: popover-31, popover-33, popover-34, popover-39 +5 more · @375: none |
| Listing is 12 days old | fixture: fixtures/listings.mjs | data | components/listing-health/listing-health.js:106 | web: popover-33 · @375: none |
| Listing is 10 days old | fixture: fixtures/listings.mjs | data | components/listing-health/listing-health.js:106 | web: popover-34 · @375: none |
| Listing is 11 days old | fixture: fixtures/listings.mjs | data | components/listing-health/listing-health.js:106 | web: popover-39 · @375: none |
| Listing is 7 days old | fixture: fixtures/listings.mjs | data | components/listing-health/listing-health.js:106 | web: popover-43 · @375: none |
| Listing is 8 days old | fixture: fixtures/listings.mjs | data | components/listing-health/listing-health.js:106 | web: popover-46 · @375: none |
| Listing is 6 days old | fixture: fixtures/listings.mjs | data | components/listing-health/listing-health.js:106 | web: popover-50 · @375: none |
| Listing is 5 days old | fixture: fixtures/listings.mjs | data | components/listing-health/listing-health.js:106 | web: popover-54 · @375: none |
| Listing is 3 days old | fixture: fixtures/listings.mjs | data | components/listing-health/listing-health.js:106 | web: popover-62 · @375: none |
