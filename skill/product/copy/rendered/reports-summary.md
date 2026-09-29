# Rendered copy — reports-summary

Every string the compiled files of `pages/reports-summary` draw — 21 web, 24 phone (@375) — in the order first drawn; the header and the rail are in `_shell.md`. Quote a string as it is here, with its file. `is`: **t** a translation · **t+** translations joined with values — ⟨pattern⟩: {{x}} the translation's placeholder, {n} a number ("75,000" is one), {date}, {time}, {x} a fixture value; ×N strings of one pattern; Arabic part by part · **code** drawn by the product, not in the translation files — spelled in its code or its data files (the Arabic beside it is the data file's own twin, `label` / `label_l1`; else "not in translations") · **data** the fixture's data, a mocked response or a value — not copy (copied unchanged into a design, it stays unmarked) · **note** quoted by a state note, drawn nowhere. A suffix says how the string is drawn: **(placeholder)** an input's placeholder attribute · **(value)** what a field holds, an input's or a textarea's value (the fixture's, unless a translation). The class is the first word — `t (placeholder)` is a **t** row: grep `| t |` and `| t (` for every t row. data-pf-src: without `src/`. files, per layout (web · @375): `all`, `all but` the states named, the states named, or `none`; `page` = `pages/reports-summary.html` (`.mobile.html` for @375), a state = `pages/reports-summary/<state>.html`.

| English | Arabic | is | data-pf-src | files |
|---|---|---|---|---|
| Listings | الإعلانات | t | components/common/textWithIcon/styled.js:3 | all but loading (web and @375) |
| Active | فعال | t | components/common/statistic/index.js:93 | all but loading (web and @375) |
| 20 ⟨{n}⟩ ×9 | value | data | components/common/statistic/index.js:93 · components/common/datePicker/datePicker.js:59 +3 | all but loading (web and @375) |
| For Sale | للبيع | t | components/common/statistic/index.js:93 · components/charts/chartjs.js:713 +2 | all but loading (web and @375) |
| To Rent | للايجار | t | components/common/statistic/index.js:93 · components/charts/chartjs.js:713 | all but loading (web and @375) |
| Daily Rentals | إيجارات يومية | t | components/common/statistic/index.js:93 · components/common/segmented/segmented.js:8 +1 | all but loading (web and @375) |
| 2 ⟨{n}⟩ ×3 | value | data | components/widgets/BreakdownByAreaWidget.js:197 · components/common/statistic/index.js:93 +2 | all but empty, error, loading (web and @375) |
| Signature | استثنائي | t | components/common/statistic/index.js:93 · components/widgets/LeadsStatsGraphWidget.js:207 | all but loading (web and @375) |
| Hot | مُميز | t | components/common/statistic/index.js:93 · components/widgets/LeadsStatsGraphWidget.js:207 | all but loading (web and @375) |
| Basic | أساسي | t | components/common/statistic/index.js:93 · components/widgets/LeadsStatsGraphWidget.js:207 | all but loading (web and @375) |
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
| Performance | الأداء | t | components/common/textWithIcon/styled.js:3 | all but error, loading (web and @375) |
| All | الكل | t | components/widgets/LeadsStatsGraphWidget.js:215 · components/common/select/styled.js:20 +2 | all but error, loading (web and @375) |
| For Rent | للإيجار | t | components/common/segmented/segmented.js:8 · — | web: all but error, loading · @375: dropdown-all |
| Views | المشاهدات | t | components/common/statistic/index.js:93 | all but error, loading (web and @375) |
| 13% ⟨{n}%⟩ ×3 | value | data | components/common/statistic/index.js:51 | all but empty, error, loading (web and @375) |
| Clicks | الزيارات | t | components/common/statistic/index.js:93 | all but error, loading (web and @375) |
| Leads | العملاء المحتملين | t | components/common/statistic/index.js:93 | all but error, loading (web and @375) |
| Calls | المكالمات | t | components/common/statistic/index.js:93 · components/widgets/LeadsStatsGraphWidget.js:367 | web: all but error, loading · @375: inline-div, inline-emails-2, inline-leads-13-8, inline-sms-1, popover-calls-3, popover-whatsapp-7 |
| WhatsApp | واتساب | t | components/common/statistic/index.js:93 · components/widgets/LeadsStatsGraphWidget.js:367 | web: all but error, loading · @375: inline-div, inline-emails-2, inline-leads-13-8, inline-sms-1, popover-calls-3, popover-whatsapp-7 |
| SMS | الرسائل النصية | t | components/common/statistic/index.js:93 · components/widgets/LeadsStatsGraphWidget.js:367 | web: all but error, loading · @375: inline-div, inline-emails-2, inline-leads-13-8, inline-sms-1, popover-calls-3, popover-whatsapp-7 |
| Emails | الرسائل البريدية | t | components/common/statistic/index.js:93 · components/widgets/LeadsStatsGraphWidget.js:367 | web: all but error, loading · @375: inline-div, inline-emails-2, inline-leads-13-8, inline-sms-1, popover-calls-3, popover-whatsapp-7 |
| © 2026 – All Rights Reserved ⟨© {n} – All Rights Reserved⟩ | {n} + كل الحقوق محفوظة | t+ | layout/withAdminLayout.js:477 | all |
| FEEDBACK | ملاحظاتك | t | components/feedback/FeedbackTab.js:98 | web: all but drawer-feedback, modal-download-app, modal-help-support-profolio · @375: all but drawer-feedback, drawer-notifications-mark-all-as, drawer-profile-information-faisal-al-harbi, drawer-search-by-calendar-today +5 more |
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
| We attach the page you are on (Summary) and your account details. ⟨We attach the page you are on ({{pageName}}) and your account details.⟩ | نرفق الصفحة التي تتصفحها ({{pageName}}) وتفاصيل حسابك. | t+ | components/feedback/FeedbackDrawer.js:362 | drawer-feedback (web and @375) |
| Cancel | إلغاء | t | components/common/button/button.js:40 · components/feedback/FeedbackDrawer.js:225 | web: drawer-feedback, popover-today-yesterday-last-7 · @375: drawer-feedback, drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months +3 more |
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
| Search by Calendar | البحث عن طريق التقويم | t | components/common/drawer/drawer.js:90 | web: none · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Today | اليوم | t | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Yesterday | أمس | t | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Last 7 Days | آخر 7 أيام | t | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Last 15 Days | آخر 15 يومًا | t | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Last 30 Days | آخر 30 يومًا | t | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Last 3 Months | آخر 3 أشهر | t | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Last 6 Months | آخر 6 أشهر | t | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Last Year | العام الماضي | t | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Jul 2026 ⟨{date}⟩ ×6 | value | data | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Sun | not in translations | code | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Mon | not in translations | code | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Tue | not in translations | code | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Wed | not in translations | code | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Thu | not in translations | code | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Fri | not in translations | code | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Sat | not in translations | code | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| 28 ⟨{n}⟩ ×22 | value | data | components/common/datePicker/datePicker.js:59 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Jul 02, 2026 - Sep 29, 2026 ⟨{date} - {date}⟩ ×4 | value | data | components/common/datePicker/datePicker.js:81 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| Search | ابحث | t | components/common/button/button.js:40 | web: popover-today-yesterday-last-7 · @375: drawer-search-by-calendar-today, drawer-search-by-calendar-today__drawer-last-3-months, drawer-search-by-calendar-today__drawer-last-6-months, drawer-search-by-calendar-today__drawer-today, drawer-search-by-calendar-today__inline-last-30-days, popover-today-yesterday-last-7 |
| all | not in translations | code | — | web: none · @375: dropdown-all |
| sale | not in translations | code | — | web: none · @375: dropdown-all |
| Not enough data | لا توجد بيانات كافية | t | components/widgets/BreakdownByAreaWidget.js:208 | empty (web and @375) |
| View In-Depth Insights | عرض تحليلات مفصلة | t | components/common/heading/heading.js:10 | empty (web and @375) |
| See the number of views, clicks and leads that your listing has received. | اطلع على عدد المشاهدات والنقرات والعملاء المحتملين لاعلانك. | t | components/common/EmptyState/EmptyState.js:149 | empty (web and @375) |
| Error! | خطأ! | t | components/common/heading/heading.js:10 | error (web and @375) |
| [object Object] | not in translations | code | components/common/EmptyState/EmptyState.js:149 | error (web and @375) |
| Retry | اعادة المحاولة | t | components/common/button/button.js:40 | error (web and @375) |
| Calls Clicked | المكالمات التي تم النقر عليها | t | components/widgets/LeadsStatsGraphWidget.js:186 | inline-div, popover-calls-3 (web and @375) |
| Calls Received | المكالمات المستلمة | t | components/widgets/LeadsStatsGraphWidget.js:186 | inline-div, popover-calls-3 (web and @375) |
| Calls Answered | المكالمات التي تمت الإجابة عليها | t | components/widgets/LeadsStatsGraphWidget.js:186 | inline-div, popover-calls-3 (web and @375) |
| Calls Missed | المكالمات الفائتة | t | components/widgets/LeadsStatsGraphWidget.js:186 | inline-div, popover-calls-3 (web and @375) |
| All Leads | جميع الاستفسارات | t | components/widgets/LeadsStatsGraphWidget.js:367 | web: none · @375: inline-div, inline-emails-2, inline-leads-13-8, inline-sms-1, popover-calls-3, popover-whatsapp-7 |
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
| Calls Clicked 3 ⟨Calls Clicked {n}⟩ | المكالمات التي تم النقر عليها + {n} | t+ | components/common/popup/popup.js:20 | web: popover-calls-3 · @375: none |
| WhatsApp Clicked | الواتساب الذي تم النقر عليه | t | components/widgets/LeadsStatsGraphWidget.js:186 | popover-whatsapp-7 (web and @375) |
| WhatsApp Sent | الواتساب المرسل | t | components/widgets/LeadsStatsGraphWidget.js:186 | popover-whatsapp-7 (web and @375) |
| Chats Initiated | المحادثات التي تم بدؤها | t | components/widgets/LeadsStatsGraphWidget.js:186 | popover-whatsapp-7 (web and @375) |
| WhatsApp Clicked 7 ⟨WhatsApp Clicked {n}⟩ | الواتساب الذي تم النقر عليه + {n} | t+ | components/common/popup/popup.js:20 | web: popover-whatsapp-7 · @375: none |
