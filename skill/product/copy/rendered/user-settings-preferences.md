# Rendered copy — user-settings-preferences

Every string the compiled files of `pages/user-settings-preferences` draw — 21 web, 18 phone (@375) — in the order first drawn; the header and the rail are in `_shell.md`. Quote a string as it is here, with its file. `is`: **t** a translation · **t+** translations joined with values — ⟨pattern⟩: {{x}} the translation's placeholder, {n} a number ("75,000" is one), {date}, {time}, {x} a fixture value; ×N strings of one pattern; Arabic part by part · **code** drawn by the product, not in the translation files — spelled in its code or its data files (the Arabic beside it is the data file's own twin, `label` / `label_l1`; else "not in translations") · **data** the fixture's data, a mocked response or a value — not copy (copied unchanged into a design, it stays unmarked) · **note** quoted by a state note, drawn nowhere. A suffix says how the string is drawn: **(placeholder)** an input's placeholder attribute · **(value)** what a field holds, an input's or a textarea's value (the fixture's, unless a translation). The class is the first word — `t (placeholder)` is a **t** row: grep `| t |` and `| t (` for every t row. data-pf-src: without `src/`. files, per layout (web · @375): `all`, `all but` the states named, the states named, or `none`; `page` = `pages/user-settings-preferences.html` (`.mobile.html` for @375), a state = `pages/user-settings-preferences/<state>.html`.

| English | Arabic | is | data-pf-src | files |
|---|---|---|---|---|
| User Settings | إعدادات حساب المستخدم | t | components/common/navbar/navbar.js:25 · components/common/flex/styled.js:3 | all |
| Agency Settings | إعدادات حساب الشركة | t | components/common/navbar/navbar.js:25 · components/common/flex/styled.js:3 | all but as-individual, as-staff (web and @375) |
| Licenses | التراخيص | t | components/common/navbar/navbar.js:25 · components/common/flex/styled.js:3 | all |
| Preferences | التفضيلات | t | components/common/navbar/navbar.js:25 · components/common/flex/styled.js:3 | all |
| Change Password | تغيير كلمة المرور | t | components/common/navbar/navbar.js:25 · components/common/flex/styled.js:3 | all |
| Smart Credit Utilization | استخدام الرصيد الذكي | t | components/common/Label/Label.js:9 | all |
| Turn on this to ensure that your expiring credits are smartly utilized to boost your property listings | قم بتفعيل هذا الخيار لضمان الاستخدام الأمثل لرصيدك المنتهي الصلاحية لتعزيز إعلاناتك | t | components/common/switch/switch.js:27 | all |
| Push Notification | الإشعارات الفورية | t | components/common/Label/Label.js:9 | all |
| Allow to receive push notifications | السماح باستلام الإشعارات الفورية | t | components/common/switch/switch.js:27 | all |
| Image and Details Usage | استخدام الصور والتفاصيل | t | components/common/Label/Label.js:9 | all |
| Allow Bayut to use your images and details in TruBrokerTM marketing campaign across TV and digital channels | اسمح لبيوت باستخدام صورك ومعلوماتك في حملات TruBroker™ الإعلانية عبر التلفزيون والمنصات الرقمية | t | components/common/switch/switch.js:27 | all |
| © 2026 – All Rights Reserved ⟨© {n} – All Rights Reserved⟩ | {n} + كل الحقوق محفوظة | t+ | layout/withAdminLayout.js:477 | all |
| FEEDBACK | ملاحظاتك | t | components/feedback/FeedbackTab.js:98 | web: all but drawer-feedback, modal-download-app, modal-help-support-profolio, modal-smart-credits, modal-smart-credits-utilization-maximize · @375: all but drawer-feedback, drawer-notifications-mark-all-as, drawer-profile-information-faisal-al-harbi, drawer-smart-credits-utilization-maximize, modal-smart-credits |
| Profile Completeness | اكتمال الحساب الشخصي | t | tenant/common/components/profile-completion/profile-settings-card.js:36 | as-staff (web and @375) |
| Why is this important? | لماذا هذا مهم؟ | t | tenant/common/components/profile-completion/profile-settings-card.js:45 | as-staff (web and @375) |
| 50% ⟨{n}%⟩ | value | data | tenant/common/components/profile-completion/profile-settings-card.js:54 | as-staff (web and @375) |
| FAL License Verification | التحقق من رخصة فال | t | components/common/flex/styled.js:3 | as-staff (web and @375) |
| Nafath Verification | التحقق من نفاذ الوطني | t | components/common/flex/styled.js:3 | as-staff (web and @375) |
| Send us feedback | أرسل لنا ملاحظاتك | t | components/feedback/FeedbackDrawer.js:189 | drawer-feedback (web and @375) |
| The product team reads every message. | فريق المنتج يقرأ كل رسالة. | t | components/feedback/FeedbackDrawer.js:190 | drawer-feedback (web and @375) |
| What kind of feedback is this? | ما نوع هذه الملاحظة؟ | t | components/feedback/FeedbackDrawer.js:285 | drawer-feedback (web and @375) |
| Feedback | ملاحظة | t | components/feedback/FeedbackDrawer.js:290 | drawer-feedback (web and @375) |
| Feature request | طلب ميزة | t | components/feedback/FeedbackDrawer.js:290 | drawer-feedback (web and @375) |
| Issue | مشكلة | t | components/feedback/FeedbackDrawer.js:290 | drawer-feedback (web and @375) |
| Tell us more | أخبرنا المزيد | t | components/feedback/FeedbackDrawer.js:322 | drawer-feedback (web and @375) |
| Describe what happened, or the change you would like to see. | صف ما حدث، أو التغيير الذي تود رؤيته. | t (placeholder) | components/feedback/FeedbackDrawer.js:323 | drawer-feedback (web and @375) |
| Attach a screenshot | إرفاق لقطة شاشة | t | components/feedback/FeedbackAttachment.js:131 | drawer-feedback (web and @375) |
| We attach the page you are on (Settings) and your account details. ⟨We attach the page you are on ({{pageName}}) and your account details.⟩ | نرفق الصفحة التي تتصفحها ({{pageName}}) وتفاصيل حسابك. | t+ | components/feedback/FeedbackDrawer.js:362 | drawer-feedback (web and @375) |
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
| Smart Credits Utilization | استخدام الرصيد الذكي | t | components/common/flex/styled.js:3 · components/common/drawer/drawer.js:90 +1 | web: modal-smart-credits, modal-smart-credits-utilization-maximize · @375: drawer-smart-credits-utilization-maximize, modal-smart-credits |
| Maximize Value | أقصى قيمة | t | components/common/flex/styled.js:3 | web: modal-smart-credits, modal-smart-credits-utilization-maximize · @375: drawer-smart-credits-utilization-maximize, modal-smart-credits |
| Credits expiring at the end of the month will be automatically utilized to ensure you get the maximum value from them. | ستنتهي صلاحية نقاط الرصيد في نهاية الشهر وسيتم استخدامها تلقائيًا لضمان حصولك على أقصى قيمة منها. | t | components/common/custom-card/customCard.js:80 | web: modal-smart-credits, modal-smart-credits-utilization-maximize · @375: drawer-smart-credits-utilization-maximize, modal-smart-credits |
| Boost Listings Visibility | تحسين ظهور الإعلانات | t | components/common/flex/styled.js:3 | web: modal-smart-credits, modal-smart-credits-utilization-maximize · @375: drawer-smart-credits-utilization-maximize, modal-smart-credits |
| Your active listings will be automatically upgraded and refreshed to reach more potential buyers or renters. | سيتم ترقية وإعادة تفعيل اعلاناتك النشطة تلقائيًا للوصول إلى المزيد من المشترين أو المستأجرين المحتملين. | t | components/common/custom-card/customCard.js:80 | web: modal-smart-credits, modal-smart-credits-utilization-maximize · @375: drawer-smart-credits-utilization-maximize, modal-smart-credits |
| Our intelligent system works efficiently, using your credits to give your listings a fresh look effortlessly. | يعمل نظامنا الذكي بكفاءة، مستخدمًا نقاط رصيدك لإعادة نشر اعلاناتك بسهولة. | t | components/common/custom-card/customCard.js:80 | web: modal-smart-credits, modal-smart-credits-utilization-maximize · @375: drawer-smart-credits-utilization-maximize, modal-smart-credits |
| Preference updated successfully | not in translations | code | — | message-preference-updated-successfully, saved-image-details, saved-push-notification, saved-smart-credit (web and @375) |
| Unable to update preference. Please refresh and try again. | not in translations | code | — | message-push-notification-failed (web and @375) |
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
