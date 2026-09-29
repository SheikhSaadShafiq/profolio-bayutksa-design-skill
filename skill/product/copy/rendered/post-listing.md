# Rendered copy — post-listing

Every string the compiled files of `pages/post-listing` draw — 24 web, 21 phone (@375) — in the order first drawn; the header and the rail are in `_shell.md`. Quote a string as it is here, with its file. `is`: **t** a translation · **t+** translations joined with values — ⟨pattern⟩: {{x}} the translation's placeholder, {n} a number ("75,000" is one), {date}, {time}, {x} a fixture value; ×N strings of one pattern; Arabic part by part · **code** drawn by the product, not in the translation files — spelled in its code or its data files (the Arabic beside it is the data file's own twin, `label` / `label_l1`; else "not in translations") · **data** the fixture's data, a mocked response or a value — not copy (copied unchanged into a design, it stays unmarked) · **note** quoted by a state note, drawn nowhere. A suffix says how the string is drawn: **(placeholder)** an input's placeholder attribute · **(value)** what a field holds, an input's or a textarea's value (the fixture's, unless a translation). The class is the first word — `t (placeholder)` is a **t** row: grep `| t |` and `| t (` for every t row. data-pf-src: without `src/`. files, per layout (web · @375): `all`, `all but` the states named, the states named, or `none`; `page` = `pages/post-listing.html` (`.mobile.html` for @375), a state = `pages/post-listing/<state>.html`.

| English | Arabic | is | data-pf-src | files |
|---|---|---|---|---|
| Enter Ad License Number | ادخل رقم ترخيص الإعلان | t | components/common/heading/heading.js:10 | web: all but form-cr-number, form-national-id, form-national-id-invalid · @375: flow-post-listing-01-license-number, flow-post-listing-02-otp, form-license-invalid, inline-continue +3 more |
| As per the real estate brokerage regulations, you must add an advertisement license to be able to publish it. | حسب نظام الوساطة العقارية، يجب إضافة ترخيص الإعلان لتتمكن من نشره | t | tenant/common/components/post-listing/ad-license-form.js:55 | web: all but form-cr-number, form-national-id, form-national-id-invalid · @375: flow-post-listing-01-license-number, flow-post-listing-02-otp, form-license-invalid, inline-continue +3 more |
| Learn More | تعرف على المزيد | t | components/common/button/button.js:40 | web: all but form-cr-number, form-national-id, form-national-id-invalid · @375: flow-post-listing-01-license-number, flow-post-listing-02-otp, form-license-invalid, inline-continue +3 more |
| e.g 7200000001 | not in translations | code (placeholder) | components/common/textInput/styled.js:9 | web: all but form-cr-number, form-national-id, form-national-id-invalid · @375: flow-post-listing-01-license-number, flow-post-listing-02-otp, form-license-invalid, inline-continue +3 more |
| Continue | متابعة | t | components/common/button/button.js:40 | web: all · @375: flow-post-listing-01-license-number, flow-post-listing-02-otp, form-cr-number, form-license-invalid +6 more |
| OR | أو | t | tenant/common/components/post-listing/ad-license-form.js:97 · tenant/common/components/post-listing/national-cr-form.js:95 +1 | web: all but form-national-id, form-national-id-invalid · @375: flow-post-listing-01-license-number, flow-post-listing-02-otp, form-cr-number, form-license-invalid +4 more |
| Don't have an Ad License? | لا تملك ترخيص إعلان؟ | t | tenant/common/components/post-listing/ad-license-form.js:105 | web: all but form-cr-number, form-national-id, form-national-id-invalid · @375: flow-post-listing-01-license-number, flow-post-listing-02-otp, form-license-invalid, inline-continue +3 more |
| Get one through Bayut, starting from SAR 250. | احصل على ترخيص عبر بيوت، ابتداءً من 250 ريال سعودي | t | tenant/common/components/post-listing/ad-license-form.js:106 | web: all but form-cr-number, form-national-id, form-national-id-invalid · @375: flow-post-listing-01-license-number, flow-post-listing-02-otp, form-license-invalid, inline-continue +3 more |
| Get an Ad License | احصل على ترخيص الإعلان | t | components/common/button/button.js:40 | web: all but form-cr-number, form-national-id, form-national-id-invalid · @375: flow-post-listing-01-license-number, flow-post-listing-02-otp, form-license-invalid, inline-continue +3 more |
| NEW | جديد | t | components/common/tag/styled.js:6 · tenant/bayut/components/post-listing/post-listing-with-options.js:246 | all but form-cr-number, form-national-id, form-national-id-invalid (web and @375) |
| © 2026 – All Rights Reserved ⟨© {n} – All Rights Reserved⟩ | {n} + كل الحقوق محفوظة | t+ | layout/withAdminLayout.js:477 | all |
| FEEDBACK | ملاحظاتك | t | components/feedback/FeedbackTab.js:98 | web: all but drawer-feedback, flow-post-listing-02-otp, message-otp-incorrect, modal-download-app +3 more · @375: all but drawer-feedback, drawer-notifications-mark-all-as, drawer-profile-information-faisal-al-harbi, flow-post-listing-02-otp, message-otp-incorrect, modal-non-saudi |
| Back | العودة | t | components/common/button/button.js:40 | web: form-cr-number, form-national-id, form-national-id-invalid · @375: all |
| Post a Listing | انشر إعلان | t | tenant/bayut/components/post-listing/post-listing-with-options.js:338 | web: none · @375: all but flow-post-listing-01-license-number, flow-post-listing-02-otp, form-cr-number, form-license-invalid +6 more |
| Choose the type of listing you want to publish | اختر نوع الإعلان الذي تريد نشره | t | tenant/bayut/components/post-listing/post-listing-with-options.js:339 | web: none · @375: all but flow-post-listing-01-license-number, flow-post-listing-02-otp, form-cr-number, form-license-invalid +6 more |
| Sale/Rent Listing | إعلان بيع/إيجار | t | tenant/bayut/components/post-listing/post-listing-with-options.js:238 | web: none · @375: all but flow-post-listing-01-license-number, flow-post-listing-02-otp, form-cr-number, form-license-invalid +6 more |
| Publish a property using a REGA Ad License. | انشر عقارك باستخدام رخصة إعلان من الهيئة العامة للعقار. | t | tenant/bayut/components/post-listing/post-listing-with-options.js:239 | web: none · @375: all but flow-post-listing-01-license-number, flow-post-listing-02-otp, form-cr-number, form-license-invalid +6 more |
| REGA ad licence required | يتطلب رخصة إعلان من الهيئة العامة للعقار | t | tenant/bayut/components/post-listing/post-listing-with-options.js:267 | web: none · @375: all but flow-post-listing-01-license-number, flow-post-listing-02-otp, form-cr-number, form-license-invalid +6 more |
| Request Ad License | طلب رخصة إعلان | t | tenant/bayut/components/post-listing/post-listing-with-options.js:238 | web: none · @375: all but flow-post-listing-01-license-number, flow-post-listing-02-otp, form-cr-number, form-license-invalid +6 more |
| Generate a new REGA ad license for your property | أصدر رخصة إعلان جديدة لعقارك من الهيئة العامة للعقار | t | tenant/bayut/components/post-listing/post-listing-with-options.js:239 | web: none · @375: all but flow-post-listing-01-license-number, flow-post-listing-02-otp, form-cr-number, form-license-invalid +6 more |
| Bayut gets your licence issued | تتولى بيوت إصدار رخصة إعلانك من الهيئة العامة للعقار | t | tenant/bayut/components/post-listing/post-listing-with-options.js:267 | web: none · @375: all but flow-post-listing-01-license-number, flow-post-listing-02-otp, form-cr-number, form-license-invalid +6 more |
| Daily Rental Listing | إعلان إيجار يومي | t | tenant/bayut/components/post-listing/post-listing-with-options.js:238 | web: none · @375: all but flow-post-listing-01-license-number, flow-post-listing-02-otp, form-cr-number, form-license-invalid +6 more |
| Host guests at your place for short stays | استقبل الضيوف في مكانك لفترات قصيرة | t | tenant/bayut/components/post-listing/post-listing-with-options.js:239 | web: none · @375: all but flow-post-listing-01-license-number, flow-post-listing-02-otp, form-cr-number, form-license-invalid +6 more |
| MOT permit required | يتطلب تصريح وزارة السياحة | t | tenant/bayut/components/post-listing/post-listing-with-options.js:267 | web: none · @375: all but flow-post-listing-01-license-number, flow-post-listing-02-otp, form-cr-number, form-license-invalid +6 more |
| Send us feedback | أرسل لنا ملاحظاتك | t | components/feedback/FeedbackDrawer.js:189 | drawer-feedback (web and @375) |
| The product team reads every message. | فريق المنتج يقرأ كل رسالة. | t | components/feedback/FeedbackDrawer.js:190 | drawer-feedback (web and @375) |
| What kind of feedback is this? | ما نوع هذه الملاحظة؟ | t | components/feedback/FeedbackDrawer.js:285 | drawer-feedback (web and @375) |
| Feedback | ملاحظة | t | components/feedback/FeedbackDrawer.js:290 | drawer-feedback (web and @375) |
| Feature request | طلب ميزة | t | components/feedback/FeedbackDrawer.js:290 | drawer-feedback (web and @375) |
| Issue | مشكلة | t | components/feedback/FeedbackDrawer.js:290 | drawer-feedback (web and @375) |
| Tell us more | أخبرنا المزيد | t | components/feedback/FeedbackDrawer.js:322 | drawer-feedback (web and @375) |
| Describe what happened, or the change you would like to see. | صف ما حدث، أو التغيير الذي تود رؤيته. | t (placeholder) | components/feedback/FeedbackDrawer.js:323 | drawer-feedback (web and @375) |
| Attach a screenshot | إرفاق لقطة شاشة | t | components/feedback/FeedbackAttachment.js:131 | drawer-feedback (web and @375) |
| We attach the page you are on (Post Listing) and your account details. ⟨We attach the page you are on ({{pageName}}) and your account details.⟩ | نرفق الصفحة التي تتصفحها ({{pageName}}) وتفاصيل حسابك. | t+ | components/feedback/FeedbackDrawer.js:362 | drawer-feedback (web and @375) |
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
| OTP Verification | تأكيد رمز التحقق | t | components/common/modals/antd-modals.js:33 · components/common/drawer/drawer.js:90 | flow-post-listing-02-otp, message-otp-incorrect (web and @375) |
| You've received a 4-digit code on: | لقد تلقيت رمزًا من 4 أرقام على: | t | components/otp-verification-modal/otp-verification-modal.js:237 | flow-post-listing-02-otp, message-otp-incorrect (web and @375) |
| +966501234567 ⟨{n}⟩ | value | data | components/render-text/render-text.js:3 | flow-post-listing-02-otp, message-otp-incorrect (web and @375) |
| 00:57 ⟨{time}⟩ ×3 | value | data | components/common/textWithIcon/styled.js:3 | flow-post-listing-02-otp, message-otp-incorrect (web and @375) |
| I didn't receive any code | لم اتلق اي رمز | t | components/otp-verification-modal/otp-verification-modal.js:265 | flow-post-listing-02-otp, message-otp-incorrect (web and @375) |
| Resend OTP | اعادة ارسال رمز التحقق | t | components/common/button/button.js:40 | flow-post-listing-02-otp, message-otp-incorrect (web and @375) |
| Verify | تأكيد | t | components/common/button/button.js:40 | flow-post-listing-02-otp, message-otp-incorrect (web and @375) |
| Provide Your Commercial Registry Number | ادخل رقم السجل التجاري | t | components/common/heading/heading.js:10 | form-cr-number (web and @375) |
| Your ad license will be verified against the provided CR Number | سيتم التحقق من رخصة إعلانك مع رقم السجل التجاري المقدم | t | tenant/common/components/post-listing/national-cr-form.js:60 | form-cr-number (web and @375) |
| e.g 7010000000 | not in translations | code (placeholder) | components/common/textInput/styled.js:9 | form-cr-number (web and @375) |
| Permanently Skip this step by verifying your FAL License | تجاوز هذه الخطوة بشكل دائم من خلال التحقق من رخصة فال | t | components/common/button/button.js:40 | form-cr-number (web and @375) |
| Please enter a valid advertisement license number | الرجاء إدخال رقم رخصة إعلان صحيح | t | components/common/group/group.js:8 | form-license-invalid (web and @375) |
| Provide Your National ID Number | ادخل رقمك الوطني | t | components/common/heading/heading.js:10 | form-national-id, form-national-id-invalid (web and @375) |
| Your ad license will be verified against the provided ID. | سيتم التحقق من رخصة إعلانك مع الهوية المقدمة. | t | tenant/common/components/post-listing/national-cr-form.js:60 | form-national-id, form-national-id-invalid (web and @375) |
| e.g 1100000000 | not in translations | code (placeholder) | components/common/textInput/styled.js:9 | form-national-id, form-national-id-invalid (web and @375) |
| Please enter a valid national ID number | الرجاء إدخال رقم وطني صحيح | t | components/common/errorMessage/errorMessage.js:26 | form-national-id-invalid (web and @375) |
| Please enter AD License to continue | الرجاء إدخال رخصة الإعلان للمتابعة | t | components/common/group/group.js:8 | inline-continue (web and @375) |
| Ad license not found on REGA. Check the number and try again. | fixture: fixtures/listing-form.mjs | data | — | message-license-not-found (web and @375) |
| Invalid OTP code | رمز التحقق غير صحيح | t | — | message-otp-incorrect (web and @375) |
| Get the Bayut KSA App | حمل تطبيق بيوت السعودية | t | tenant/common/components/downloadAppModal/downloadAppModal.js:22 | web: modal-download-app · @375: none |
| Scan the QR code to download the app | قم بسمح الكود لتحميل التطبيق | t | tenant/common/components/downloadAppModal/downloadAppModal.js:29 | web: modal-download-app · @375: none |
| Help & Support | المساعدة والدعم | t | components/common/modals/antd-modals.js:33 | web: modal-help-support-profolio · @375: none |
| Profolio | بروفوليو | t | components/common/flex/styled.js:3 | web: modal-help-support-profolio · @375: none |
| Discover more about Profolio. Our best-in-class listings management software. | تعرف أكثر على بروفوليو، أفضل برنامج لإدارة متجرك العقاري أونلاين | t | components/common/custom-card/customCard.js:80 | web: modal-help-support-profolio · @375: none |
| REGA Compliance | ضوابط الإعلانات العقارية ورخصة فال | t | components/common/flex/styled.js:3 | web: modal-help-support-profolio · @375: none |
| Discover more about REGA and real estate regulations. | اكتشف المزيد عن الهيئة العامة للعقار ونظام الوساطة العقارية | t | components/common/custom-card/customCard.js:80 | web: modal-help-support-profolio · @375: none |
| FAQ's | الأسئلة المتكررة | t | components/common/flex/styled.js:3 | web: modal-help-support-profolio · @375: none |
| Explore answers to frequently asked questions and have your issues resolved. | اكتشف الإجابات على الأسئلة المتكررة واحصل على حلول لمشاكلك | t | components/common/custom-card/customCard.js:80 | web: modal-help-support-profolio · @375: none |
| Report to REGA | الإبلاغ إلى الهيئة العامة للعقار | t | components/common/flex/styled.js:3 | web: modal-help-support-profolio · @375: none |
| Report issues so we can review this listing. | أبلغ عن المشاكل حتى نتمكن من مراجعة هذا الإعلان. | t | components/common/custom-card/customCard.js:80 | web: modal-help-support-profolio · @375: none |
| Steps to Issue Real Estate Advertisement Licenses | خطوات ترخيص الإعلان | t | components/common/modals/antd-modals.js:33 | web: modal-learn-more · @375: none |
| Step 1 | الخطوة 1 | t | tenant/common/components/post-listing/license-validation-guide.js:62 | web: modal-learn-more · @375: none |
| FAL License | رخصة فال | t | tenant/common/components/post-listing/license-validation-guide.js:65 | web: modal-learn-more · @375: none |
| REGA issues the FAL License which certifies the agents & the agencies to practice real estate brokerage across the kingdom. | تصدر الهيئة العامة للعقار رخصة فال التي تتيح للوسطاء والوكالات ممارسة الوساطة العقارية في جميع أنحاء المملكة. | t | tenant/common/components/post-listing/license-validation-guide.js:76 | web: modal-learn-more · @375: none |
| Step 2 | الخطوة 2 | t | tenant/common/components/post-listing/license-validation-guide.js:62 | web: modal-learn-more · @375: none |
| Brokerage Contract | عقد الوساطة | t | tenant/common/components/post-listing/license-validation-guide.js:65 | web: modal-learn-more · @375: none |
| Licensed brokers issue a brokerage contract with the property owner through the official REGA website. | يصدر الوسطاء المرخصون عقد وساطة مع مالك العقار عبر الموقع الرسمي للهيئة العامة للعقار. | t | tenant/common/components/post-listing/license-validation-guide.js:76 | web: modal-learn-more · @375: none |
| Step 3 | الخطوة 3 | t | tenant/common/components/post-listing/license-validation-guide.js:62 | web: modal-learn-more · @375: none |
| Ad License | رخصة الإعلان | t | tenant/common/components/post-listing/license-validation-guide.js:65 | web: modal-learn-more · @375: none |
| Brokerage contract is used to secure an ad license for the property, allowing brokers to advertise that property | يستخدم عقد الوساطة للحصول على رخصة إعلان، مما يسمح للوسطاء بالإعلان عن العقار. | t | tenant/common/components/post-listing/license-validation-guide.js:76 | web: modal-learn-more · @375: none |
| Unable to Post Listing | نعتذر، لا يمكنك نشر الإعلانات | t | components/common/heading/heading.js:10 | modal-non-saudi (web and @375) |
| In compliance with the Real Estate Brokerage Law in Saudi Arabia, only Saudi nationals real estate brokers are permitted to post listings. We appreciate your understanding and cooperation. | تماشيًا مع نظام الوساطة العقارية في المملكة العربية السعودية، يسمح فقط للوسطاء العقاريين السعوديين بنشر الإعلانات العقارية. نشكر تفهمك وتعاونك | t | components/success-modal/successModalContent.js:56 | modal-non-saudi (web and @375) |
