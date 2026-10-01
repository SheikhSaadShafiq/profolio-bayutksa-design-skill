# Rendered copy — credits-usage

Every string the compiled files of `pages/credits-usage` draw — 20 web, 14 phone (@375) — in the order first drawn; the header and the rail are in `_shell.md`. Quote a string as it is here, with its file. `is`: **t** a translation · **t+** translations joined with values — ⟨pattern⟩: {{x}} the translation's placeholder, {n} a number ("75,000" is one), {date}, {time}, {x} a fixture value; ×N strings of one pattern; Arabic part by part · **code** drawn by the product, not in the translation files — spelled in its code or its data files (the Arabic beside it is the data file's own twin, `label` / `label_l1`; else "not in translations") · **data** the fixture's data, a mocked response or a value — not copy (copied unchanged into a design, it stays unmarked) · **note** quoted by a state note, drawn nowhere. A suffix says how the string is drawn: **(placeholder)** an input's placeholder attribute · **(value)** what a field holds, an input's or a textarea's value (the fixture's, unless a translation). The class is the first word — `t (placeholder)` is a **t** row: grep `| t |` and `| t (` for every t row. data-pf-src: without `src/`. files, per layout (web · @375): `all`, `all but` the states named, the states named, or `none`; `page` = `pages/credits-usage.html` (`.mobile.html` for @375), a state = `pages/credits-usage/<state>.html`.

| English | Arabic | is | data-pf-src | files |
|---|---|---|---|---|
| Credits Usage | استخدام نقاط الرصيد | t | components/styled.js:113 | all but loading (web and @375) |
| Top-Up your Credits | اشحن رصيدك | t | components/common/button/button.js:40 | all but loading (web and @375) |
| Status of your current package | حالة باقتك الحالية | t | container/pages/credits-usage/credits-usage.js:341 | all but loading (web and @375) |
| Available | متاح | t | components/common/statistic/index.js:93 | all but error, loading (web and @375) |
| 72,880 ⟨{n}⟩ ×6 | value | data | components/common/statistic/index.js:93 | all but error, loading (web and @375) |
| Used | النقاط المستخدمة | t | components/common/statistic/index.js:93 | all but error, loading (web and @375) |
| Total | الإجمالي | t | components/common/statistic/index.js:93 · tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:349 | all but error, loading (web and @375) |
| Usage Breakdown | تفاصيل الاستخدام | t | components/common/heading/heading.js:10 | all but error, loading (web and @375) |
| Basic Listing | الإعلان أساسي | t | components/credits-usage/product-breakdown.js:18 · components/common/tag/styled.js:6 +1 | all but error, loading (web and @375) |
| 980 ⟨{n}⟩ ×12 | value | data | components/common/number/number.js:107 · components/common/textWithIcon/styled.js:3 +1 | all but error, loading (web and @375) |
| Hot Listing | الإعلان مميّز | t | components/credits-usage/product-breakdown.js:18 · components/common/tag/styled.js:6 +1 | all but error, loading (web and @375) |
| Signature Listing | الإعلان استثنائي | t | components/credits-usage/product-breakdown.js:18 · components/common/tag/styled.js:6 +1 | all but error, loading (web and @375) |
| Refresh | إعادة نشر | t | components/common/tag/styled.js:6 · components/credits-usage/product-breakdown.js:18 +1 | all but error, loading (web and @375) |
| Photography Service | خدمة التصوير الاحترافي | t | components/credits-usage/product-breakdown.js:18 · components/common/tag/styled.js:6 +1 | all but error, loading (web and @375) |
| Videography Service | خدمة تصوير الفيديو | t | components/credits-usage/product-breakdown.js:18 · components/common/select/styled.js:20 | all but error, loading (web and @375) |
| Drone Footage Service | خدمة تصوير درون | t | components/credits-usage/product-breakdown.js:18 · components/common/select/styled.js:20 | all but error, loading (web and @375) |
| Credits Usage History | سجل استخدام الرصيد | t | components/styled.js:113 | all but loading (web and @375) |
| applied to listing 88238421 by Faisal Al-Harbi ⟨applied to listing {n} by {x}⟩ ×10 | تم استخدامها على الإعلان + {n} + بواسطة + {x} | t+ | components/credits-usage/history-breakdown.js:97 | all but empty, error, loading (web and @375) |
| [riyal] 1,999,000 ⟨[riyal]{n}⟩ ×6 | value | data | components/common/number/number.js:107 | all but empty, error, loading (web and @375) |
| Al Mughrizat, North Riyadh, Riyadh | fixture: fixtures/credits.mjs | data | components/credits-usage/history-breakdown.js:166 | web: all but empty, error, loading · @375: all but as-staff, drawer-top-up-your-credits-as-staff, empty, error, loading |
| Chalet for Rent ⟨{x} for Rent⟩ | {x} + للإيجار | t+ | components/common/tag/styled.js:6 | web: all but empty, error, loading · @375: all but as-staff, drawer-top-up-your-credits-as-staff, empty, error, loading |
| 4 Rooms ⟨{n} Rooms⟩ ×4 | {n} + غرف | t+ | components/common/textWithIcon/styled.js:3 | all but empty, error, loading (web and @375) |
| 79 Sq. M. ⟨{n} Sq. M.⟩ ×4 | {n} + م2 | t+ | components/common/textWithIcon/styled.js:3 | all but empty, error, loading (web and @375) |
| Sep 30, 2026, 11:42 am ⟨{date}⟩ ×9 | value | data | components/credits-usage/history-breakdown.js:197 | all but empty, error, loading (web and @375) |
| 5 Used ⟨{n} Used⟩ ×5 | {n} + النقاط المستخدمة | t+ | components/credits-usage/history-breakdown.js:51 | all but empty, error, loading (web and @375) |
| Al Wurud, North Riyadh, Riyadh | fixture: fixtures/credits.mjs | data | components/credits-usage/history-breakdown.js:166 | all but empty, error, loading (web and @375) |
| Floor for Sale ⟨{x} for Sale⟩ ×2 | {x} + للبيع | t+ | components/common/tag/styled.js:6 | all but empty, error, loading (web and @375) |
| Al Rawabi, East Riyadh, Riyadh | fixture: fixtures/credits.mjs | data | components/credits-usage/history-breakdown.js:166 | all but empty, error, loading (web and @375) |
| Apartment for Sale | fixture: fixtures/listing-form.mjs | data | components/common/tag/styled.js:6 | all but empty, error, loading (web and @375) |
| As Sulaymaniyah, Al Diriyah | fixture: fixtures/credits.mjs | data | components/credits-usage/history-breakdown.js:166 | all but empty, error, loading (web and @375) |
| Al Nahdah, East Riyadh, Riyadh | fixture: fixtures/credits.mjs | data | components/credits-usage/history-breakdown.js:166 | web: all but as-staff, empty, error, loading, modal-top-up-your-credits-as-staff · @375: none |
| © 2026 – All Rights Reserved ⟨© {n} – All Rights Reserved⟩ | {n} + كل الحقوق محفوظة | t+ | layout/withAdminLayout.js:477 | all |
| FEEDBACK | ملاحظاتك | t | components/feedback/FeedbackTab.js:98 | web: page, as-individual, as-staff, empty +6 more · @375: page, as-individual, as-staff, empty +3 more |
| Al Yarmuk, East Riyadh, Riyadh | fixture: fixtures/credits.mjs | data | components/credits-usage/history-breakdown.js:166 | web: as-staff, modal-top-up-your-credits-as-staff · @375: as-staff, drawer-top-up-your-credits-as-staff |
| Send us feedback | أرسل لنا ملاحظاتك | t | components/feedback/FeedbackDrawer.js:189 | web: drawer-feedback · @375: drawer-send-us-feedback-the |
| The product team reads every message. | فريق المنتج يقرأ كل رسالة. | t | components/feedback/FeedbackDrawer.js:190 | web: drawer-feedback · @375: drawer-send-us-feedback-the |
| What kind of feedback is this? | ما نوع هذه الملاحظة؟ | t | components/feedback/FeedbackDrawer.js:285 | web: drawer-feedback · @375: drawer-send-us-feedback-the |
| Feedback | ملاحظة | t | components/feedback/FeedbackDrawer.js:290 | web: drawer-feedback · @375: drawer-send-us-feedback-the |
| Feature request | طلب ميزة | t | components/feedback/FeedbackDrawer.js:290 | web: drawer-feedback · @375: drawer-send-us-feedback-the |
| Issue | مشكلة | t | components/feedback/FeedbackDrawer.js:290 | web: drawer-feedback · @375: drawer-send-us-feedback-the |
| Tell us more | أخبرنا المزيد | t | components/feedback/FeedbackDrawer.js:322 | web: drawer-feedback · @375: drawer-send-us-feedback-the |
| Describe what happened, or the change you would like to see. | صف ما حدث، أو التغيير الذي تود رؤيته. | t (placeholder) | components/feedback/FeedbackDrawer.js:323 | web: drawer-feedback · @375: drawer-send-us-feedback-the |
| Attach a screenshot | إرفاق لقطة شاشة | t | components/feedback/FeedbackAttachment.js:131 | web: drawer-feedback · @375: drawer-send-us-feedback-the |
| We attach the page you are on (Credits Usage) and your account details. ⟨We attach the page you are on ({{pageName}}) and your account details.⟩ | نرفق الصفحة التي تتصفحها ({{pageName}}) وتفاصيل حسابك. | t+ | components/feedback/FeedbackDrawer.js:362 | web: drawer-feedback · @375: drawer-send-us-feedback-the |
| Cancel | إلغاء | t | components/feedback/FeedbackDrawer.js:225 | web: drawer-feedback · @375: drawer-send-us-feedback-the |
| Send feedback | إرسال الملاحظة | t | components/feedback/FeedbackDrawer.js:244 | web: drawer-feedback · @375: drawer-send-us-feedback-the |
| Filters | فلاتر البحث | t | components/common/title/title.js:7 | web: drawer-filters-apply-filters-to, drawer-filters-apply-filters-to__dropdown-select-upgrades, drawer-filters-apply-filters-to__dropdown-select-users · @375: none |
| Apply filters to organize data accordingly | قم بتطبيق عوامل التصفية لتنظيم البيانات وفقًا لذلك | t | components/common/filters/filters.js:532 | web: drawer-filters-apply-filters-to, drawer-filters-apply-filters-to__dropdown-select-upgrades, drawer-filters-apply-filters-to__dropdown-select-users · @375: none |
| Listing ID | رقم الإعلان | t | components/common/flex/styled.js:3 | web: drawer-filters-apply-filters-to, drawer-filters-apply-filters-to__dropdown-select-upgrades, drawer-filters-apply-filters-to__dropdown-select-users · @375: none |
| Enter Listing ID | أدخل رقم الإعلان | t (placeholder) | components/common/textInput/styled.js:9 | web: drawer-filters-apply-filters-to, drawer-filters-apply-filters-to__dropdown-select-upgrades, drawer-filters-apply-filters-to__dropdown-select-users · @375: none |
| Upgrades | الترقيات | t | components/common/Label/Label.js:9 | web: drawer-filters-apply-filters-to, drawer-filters-apply-filters-to__dropdown-select-upgrades, drawer-filters-apply-filters-to__dropdown-select-users · @375: none |
| Select Upgrades | اختر الترقيات | t | components/common/select/styled.js:20 | web: drawer-filters-apply-filters-to, drawer-filters-apply-filters-to__dropdown-select-upgrades, drawer-filters-apply-filters-to__dropdown-select-users · @375: none |
| 1 ⟨{n}⟩ ×4 | value | data | components/common/select/styled.js:20 | web: drawer-filters-apply-filters-to__dropdown-select-upgrades, drawer-filters-apply-filters-to__dropdown-select-users · @375: none |
| Users | المستخدمين | t | components/common/Label/Label.js:9 | web: drawer-filters-apply-filters-to, drawer-filters-apply-filters-to__dropdown-select-upgrades, drawer-filters-apply-filters-to__dropdown-select-users · @375: none |
| Select Users | حدد المستخدمين | t | components/common/select/styled.js:20 | web: drawer-filters-apply-filters-to, drawer-filters-apply-filters-to__dropdown-select-upgrades, drawer-filters-apply-filters-to__dropdown-select-users · @375: none |
| Reset Filters | اعادة ضبط الفلاتر | t | components/common/button/button.js:40 | web: drawer-filters-apply-filters-to, drawer-filters-apply-filters-to__dropdown-select-upgrades, drawer-filters-apply-filters-to__dropdown-select-users · @375: none |
| Search | ابحث | t | components/common/button/button.js:40 | web: drawer-filters-apply-filters-to, drawer-filters-apply-filters-to__dropdown-select-upgrades, drawer-filters-apply-filters-to__dropdown-select-users · @375: none |
| Faisal Al-Harbi | fixture: fixtures/user.json | data | components/common/select/styled.js:20 · components/utilities/auth-info/info.js:84 | web: drawer-filters-apply-filters-to__dropdown-select-users · @375: drawer-profile-information-faisal-al-harbi |
| Noura Al-Qahtani | fixture: fixtures/profile.mjs | data | components/common/select/styled.js:20 | web: drawer-filters-apply-filters-to__dropdown-select-users · @375: none |
| Abdullah Al-Otaibi | fixture: fixtures/credits.mjs | data | components/common/select/styled.js:20 | web: drawer-filters-apply-filters-to__dropdown-select-users · @375: none |
| Reem Al-Shehri | fixture: fixtures/profile.mjs | data | components/common/select/styled.js:20 | web: drawer-filters-apply-filters-to__dropdown-select-users · @375: none |
| Notifications | الإشعارات | t | components/notification-center/notification-center.js:85 | web: none · @375: drawer-notifications-mark-all-as |
| Mark all as read | تحديد الكل كمقروء | t | components/common/button/button.js:40 | web: none · @375: drawer-notifications-mark-all-as |
| Your listing is live | fixture: fixtures.mjs | data | components/common/flex/styled.js:3 | web: none · @375: drawer-notifications-mark-all-as |
| an hour ago | not in translations | code | components/common/text/text.js:8 | web: none · @375: drawer-notifications-mark-all-as |
| Credits expiring soon | fixture: fixtures.mjs | data | components/common/flex/styled.js:3 | web: none · @375: drawer-notifications-mark-all-as |
| a day ago | not in translations | code | components/common/text/text.js:8 | web: none · @375: drawer-notifications-mark-all-as |
| TruCheck visit scheduled | fixture: fixtures.mjs | data | components/common/flex/styled.js:3 | web: none · @375: drawer-notifications-mark-all-as |
| 3 days ago ⟨{n} days ago⟩ | not in translations | code | components/common/text/text.js:8 | web: none · @375: drawer-notifications-mark-all-as |
| Profile Information | معلومات الحساب الشخصي | t | components/common/drawer/drawer.js:90 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| Agency User | not in translations | code | components/utilities/auth-info/info.js:89 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| faisal@najdhorizon.example | fixture: fixtures/user.json | data | components/utilities/auth-info/info.js:96 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| Nafath Verified | تم توثيق الحساب من النفاذ الوطني | t | components/utilities/auth-info/info.js:105 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| REGA Verified | تم التحقق من رخصة فال | t | components/utilities/auth-info/info.js:114 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| Account Settings | إعدادت الحساب | t | components/utilities/auth-info/info.js:124 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| Sign Out | not in translations | code | components/utilities/auth-info/info.js:144 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| Credit Top-Up | شحن الرصيد | t | components/common/drawer/drawer.js:90 · components/common/modals/antd-modals.js:33 | web: flow-top-up-01-choose-amount, modal-top-up-your-credits, modal-top-up-your-credits-as-individual, modal-top-up-your-credits-as-staff · @375: drawer-top-up-your-credits, drawer-top-up-your-credits-as-individual, drawer-top-up-your-credits-as-staff, flow-top-up-01-choose-amount |
| Credit Top-up | شحن الرصيد | t | components/common/heading/heading.js:10 | web: flow-top-up-01-choose-amount, modal-top-up-your-credits, modal-top-up-your-credits-as-individual, modal-top-up-your-credits-as-staff · @375: drawer-top-up-your-credits, drawer-top-up-your-credits-as-individual, drawer-top-up-your-credits-as-staff, flow-top-up-01-choose-amount |
| Ran out of credits? Add more credits to your account to post more listings and avail more services seamlessly. | نفذ رصيدك؟ أضف رصيدًا إلى حسابك لنشر المزيد من الإعلانات والاستفادة من المزيد من الخدمات | t | tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:236 | web: flow-top-up-01-choose-amount, modal-top-up-your-credits, modal-top-up-your-credits-as-individual, modal-top-up-your-credits-as-staff · @375: drawer-top-up-your-credits, drawer-top-up-your-credits-as-individual, drawer-top-up-your-credits-as-staff, flow-top-up-01-choose-amount |
| Total Credits | مجموع الرصيد | t | tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:250 · tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:319 | web: flow-top-up-01-choose-amount, modal-top-up-your-credits, modal-top-up-your-credits-as-individual, modal-top-up-your-credits-as-staff · @375: drawer-top-up-your-credits, drawer-top-up-your-credits-as-individual, drawer-top-up-your-credits-as-staff, flow-top-up-01-choose-amount |
| Enter the number of credits | أدخل عدد الاعتمادات | t (placeholder) | tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:251 | web: flow-top-up-01-choose-amount, modal-top-up-your-credits, modal-top-up-your-credits-as-individual, modal-top-up-your-credits-as-staff · @375: drawer-top-up-your-credits, drawer-top-up-your-credits-as-individual, drawer-top-up-your-credits-as-staff, flow-top-up-01-choose-amount |
| Get Top-up | احصل على شحن | t | components/common/button/button.js:40 | web: flow-top-up-01-choose-amount, modal-top-up-your-credits, modal-top-up-your-credits-as-individual, modal-top-up-your-credits-as-staff · @375: drawer-top-up-your-credits, drawer-top-up-your-credits-as-individual, drawer-top-up-your-credits-as-staff, flow-top-up-01-choose-amount |
| No Credits Usage this Month | لا يوجد استخدام لنقاط الرصيد هذا الشهر | t | components/common/heading/heading.js:10 | empty (web and @375) |
| Your credits usage for the month will appear here | سيظهر استخدامك لنقاط الرصيد لهذا الشهر هنا | t | components/common/EmptyState/EmptyState.js:149 | empty (web and @375) |
| Post Listing | نشر إعلان | t | components/common/button/button.js:40 | empty (web and @375) |
| Retry | اعادة المحاولة | t | components/common/button/button.js:40 | error (web and @375) |
| Something went wrong, please try again | حدث خطا ما. اعد المحاولة من فضلك | t | components/common/EmptyState/EmptyState.js:149 | error (web and @375) |
| 1000 ⟨{n}⟩ | value | data | components/common/textWithIcon/textWithIcon.js:65 | flow-top-up-01-choose-amount (web and @375) |
| All credits will be allocated upfront and will remain valid for 12 months ⟨All credits will be allocated upfront and will remain valid for {{months}} {{monthWord}}⟩ | سيتم إضافة جميع نقاط الرصيد دفعة واحدة، وتبقى صالحة لمدة {{months}} {{monthWord}}. | t+ | tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:151 | flow-top-up-01-choose-amount (web and @375) |
| [riyal]2,250 ⟨[riyal]{n}⟩ | value | data | tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:352 | flow-top-up-01-choose-amount (web and @375) |
| [riyal]2,500 ⟨[riyal]{n}⟩ | value | data | tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:368 | flow-top-up-01-choose-amount (web and @375) |
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
