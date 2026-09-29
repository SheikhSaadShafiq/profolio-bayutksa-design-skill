# Rendered copy — user-settings-licenses

Every string the compiled files of `pages/user-settings-licenses` draw — 18 web, 15 phone (@375) — in the order first drawn; the header and the rail are in `_shell.md`. Quote a string as it is here, with its file. `is`: **t** a translation · **t+** translations joined with values — ⟨pattern⟩: {{x}} the translation's placeholder, {n} a number ("75,000" is one), {date}, {time}, {x} a fixture value; ×N strings of one pattern; Arabic part by part · **code** drawn by the product, not in the translation files — spelled in its code or its data files (the Arabic beside it is the data file's own twin, `label` / `label_l1`; else "not in translations") · **data** the fixture's data, a mocked response or a value — not copy (copied unchanged into a design, it stays unmarked) · **note** quoted by a state note, drawn nowhere. A suffix says how the string is drawn: **(placeholder)** an input's placeholder attribute · **(value)** what a field holds, an input's or a textarea's value (the fixture's, unless a translation). The class is the first word — `t (placeholder)` is a **t** row: grep `| t |` and `| t (` for every t row. data-pf-src: without `src/`. files, per layout (web · @375): `all`, `all but` the states named, the states named, or `none`; `page` = `pages/user-settings-licenses.html` (`.mobile.html` for @375), a state = `pages/user-settings-licenses/<state>.html`.

| English | Arabic | is | data-pf-src | files |
|---|---|---|---|---|
| User Settings | إعدادات حساب المستخدم | t | components/common/navbar/navbar.js:25 · components/common/flex/styled.js:3 | all |
| Agency Settings | إعدادات حساب الشركة | t | components/common/navbar/navbar.js:25 · components/common/flex/styled.js:3 | all but as-individual, as-staff (web and @375) |
| Licenses | التراخيص | t | components/common/navbar/navbar.js:25 · components/common/flex/styled.js:3 | all |
| Preferences | التفضيلات | t | components/common/navbar/navbar.js:25 · components/common/flex/styled.js:3 | all |
| Change Password | تغيير كلمة المرور | t | components/common/navbar/navbar.js:25 · components/common/flex/styled.js:3 | all |
| Add FAL license | اضافة رخصة فال | t | components/common/button/button.js:40 | all but error, loading (web and @375) |
| FAL License:1100387642 ⟨FAL License:{n}⟩ ×5 | ترخيص فال: + {n} | t+ | components/license-card/license-card.js:103 | all but empty, error, loading (web and @375) |
| Verified | تم التحقق | t | components/common/tag/styled.js:6 | all but empty, error, loading (web and @375) |
| Noura Al-Qahtani | fixture: fixtures/profile.mjs | data | components/license-card/license-card.js:131 · components/license-card/license-card.js:183 | all but as-individual, empty, error, loading (web and @375) |
| +966503418826 ⟨{n}⟩ ×4 | value | data | components/render-text/render-text.js:3 | all but empty, error, loading (web and @375) |
| Al Malqa, Riyadh | fixture: fixtures/extra.mjs | data | components/common/textWithIcon/styled.js:3 | all but as-individual, empty, error, loading (web and @375) |
| Owner | مالك الرخصة | t | components/license-card/license-card.js:182 | all but empty, error, loading (web and @375) |
| Valid until | صالح حتى | t | components/license-card/license-card.js:190 | all but empty, error, loading (web and @375) |
| Jan 14, 2027 ⟨{date}⟩ ×5 | value | data | components/license-card/license-card.js:191 | all but empty, error, loading (web and @375) |
| agency | not in translations | code | components/license-card/license-card.js:118 | all but as-individual, empty, error, loading (web and @375) |
| CR Number: 1010458213 ⟨CR Number: {n}⟩ | رقم السجل التجاري: + {n} | t+ | components/license-card/license-card.js:122 | all but as-individual, empty, error, loading (web and @375) |
| Najd Horizon Real Estate | fixture: fixtures/user.json | data | components/license-card/license-card.js:131 | all but as-individual, empty, error, loading (web and @375) |
| info@najdhorizon.example | fixture: fixtures/profile.mjs | data | components/common/textWithIcon/styled.js:3 | all but as-individual, empty, error, loading (web and @375) |
| Al Olaya, Riyadh | fixture: fixtures/extra.mjs | data | components/common/textWithIcon/styled.js:3 | all but empty, error, loading (web and @375) |
| Faisal Al-Harbi | fixture: fixtures/user.json | data | components/license-card/license-card.js:183 · components/license-card/license-card.js:131 +1 | all but empty, error, loading (web and @375) |
| Share with agency staff | مشاركة مع موظفي المنشأة | t | components/license-card/license-card.js:212 | all but as-individual, as-staff, empty, error, loading (web and @375) |
| Reem Al-Shehri | fixture: fixtures/profile.mjs | data | components/license-card/license-card.js:131 · components/license-card/license-card.js:183 | all but as-individual, empty, error, loading (web and @375) |
| reem@najdhorizon.example | fixture: fixtures/profile.mjs | data | components/common/textWithIcon/styled.js:3 | all but as-individual, empty, error, loading (web and @375) |
| Hittin, Riyadh | fixture: fixtures/extra.mjs | data | components/common/textWithIcon/styled.js:3 | all but as-individual, empty, error, loading (web and @375) |
| © 2026 – All Rights Reserved ⟨© {n} – All Rights Reserved⟩ | {n} + كل الحقوق محفوظة | t+ | layout/withAdminLayout.js:477 | all |
| FEEDBACK | ملاحظاتك | t | components/feedback/FeedbackTab.js:98 | web: all but drawer-feedback, message-share-license-failed, modal-download-app, modal-help-support-profolio, modal-information-share-license-with, modal-share-license-by-enabling · @375: all but drawer-feedback, drawer-information-share-license-with, drawer-notifications-mark-all-as, drawer-profile-information-faisal-al-harbi, drawer-share-license-by-enabling, message-share-license-failed |
| faisal.alharbi@mail.example | fixture: fixtures/profile.mjs | data | components/common/textWithIcon/styled.js:3 | as-individual (web and @375) |
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
| Information | توضيح | t | components/common/drawer/drawer.js:90 · components/common/modals/antd-modals.js:33 | web: modal-information-share-license-with · @375: drawer-information-share-license-with |
| Share License with Agency | مشاركة رخصة فال مع المسوقين في الحساب | t | components/license-card/license-card.js:76 | web: modal-information-share-license-with · @375: drawer-information-share-license-with |
| By enabling this, you are allowing other agency members to post listings using this FAL license. | عند تفعيل هذا الخيار ، فانك تسمح للمسوقين الاخرين في الحساب بنشر الاعلانات باستخدام رخصة فال الخاصة بك. | t | components/license-card/license-card.js:77 | web: modal-information-share-license-with · @375: drawer-information-share-license-with |
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
| License sharing status changed | تم تغيير حالة مشاركة رخصة فال | t | — | web: message-share-license-saved, modal-share-license-by-enabling__message-share · @375: drawer-share-license-by-enabling__message-share, message-share-license-saved |
| Unshare | إلغاء المشاركة | t | components/common/button/button.js:40 · components/common/drawer/drawer.js:90 +1 | web: message-share-license-failed, modal-share-license-by-enabling · @375: drawer-share-license-by-enabling, message-share-license-failed |
| Are you sure to unshare your license with Agency Members. | هل أنت متأكد من رغبتك في إلغاء مشاركة رخصتك مع أعضاء الوكالة؟ | t | components/common/drawer/drawer.js:90 · components/common/modals/antd-modals.js:33 | web: message-share-license-failed, modal-share-license-by-enabling · @375: drawer-share-license-by-enabling, message-share-license-failed |
| Share License | شارك الترخيص | t | components/common/drawer/drawer.js:90 · components/common/modals/antd-modals.js:33 | web: message-share-license-failed, modal-share-license-by-enabling · @375: drawer-share-license-by-enabling, message-share-license-failed |
| By Enabling this you are sharing license with other Agency Members. Are you sure to share your license | بتمكين هذا، أنت تقوم بمشاركة الرخصة مع أعضاء وكالة آخرين. هل أنت متأكد من رغبتك في مشاركة رخصتك؟ | t | components/common/drawer/drawer.js:90 · components/common/modals/antd-modals.js:33 | web: message-share-license-failed, modal-share-license-by-enabling · @375: drawer-share-license-by-enabling, message-share-license-failed |
| Share | مشاركة | t | components/common/button/button.js:40 | web: message-share-license-failed, modal-share-license-by-enabling · @375: drawer-share-license-by-enabling, message-share-license-failed |
| No License Added | لم تتم اضافة رخصة فال | t | components/common/heading/heading.js:10 | empty (web and @375) |
| Add your FAL License for an easier ad posting experience and get a "Verified" badge. | اضف رخصة فال لتتمكن من نشر اعلانك بسهولة ولتحصل على علامة حساب موثق | t | components/common/EmptyState/EmptyState.js:149 | empty (web and @375) |
| Something went wrong, please try again | حدث خطا ما. اعد المحاولة من فضلك | t | components/common/EmptyState/EmptyState.js:149 | error (web and @375) |
| Retry | اعادة المحاولة | t | components/common/button/button.js:40 | error (web and @375) |
| License sharing could not be changed. Please try again. | fixture: fixtures/forms.mjs | data | — | message-share-license-failed (web and @375) |
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
