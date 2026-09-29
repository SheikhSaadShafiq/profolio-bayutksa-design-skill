# Rendered copy — user-settings-agency-profile

Every string the compiled files of `pages/user-settings-agency-profile` draw — 21 web, 18 phone (@375) — in the order first drawn; the header and the rail are in `_shell.md`. Quote a string as it is here, with its file. `is`: **t** a translation · **t+** translations joined with values — ⟨pattern⟩: {{x}} the translation's placeholder, {n} a number ("75,000" is one), {date}, {time}, {x} a fixture value; ×N strings of one pattern; Arabic part by part · **code** drawn by the product, not in the translation files — spelled in its code or its data files (the Arabic beside it is the data file's own twin, `label` / `label_l1`; else "not in translations") · **data** the fixture's data, a mocked response or a value — not copy (copied unchanged into a design, it stays unmarked) · **note** quoted by a state note, drawn nowhere. A suffix says how the string is drawn: **(placeholder)** an input's placeholder attribute · **(value)** what a field holds, an input's or a textarea's value (the fixture's, unless a translation). The class is the first word — `t (placeholder)` is a **t** row: grep `| t |` and `| t (` for every t row. data-pf-src: without `src/`. files, per layout (web · @375): `all`, `all but` the states named, the states named, or `none`; `page` = `pages/user-settings-agency-profile.html` (`.mobile.html` for @375), a state = `pages/user-settings-agency-profile/<state>.html`.

| English | Arabic | is | data-pf-src | files |
|---|---|---|---|---|
| User Settings | إعدادات حساب المستخدم | t | components/common/flex/styled.js:3 · components/common/navbar/navbar.js:25 | all |
| Agency Settings | إعدادات حساب الشركة | t | components/common/navbar/navbar.js:25 · components/common/flex/styled.js:3 | all but as-individual, as-staff (web and @375) |
| Licenses | التراخيص | t | components/common/navbar/navbar.js:25 · components/common/flex/styled.js:3 | all |
| Preferences | التفضيلات | t | components/common/navbar/navbar.js:25 · components/common/flex/styled.js:3 | all |
| Change Password | تغيير كلمة المرور | t | components/common/navbar/navbar.js:25 · components/common/flex/styled.js:3 | all |
| Najd Horizon Real Estate | fixture: fixtures/user.json | data | components/common/heading/heading.js:10 | web: all but as-individual, as-staff, loading · @375: none |
| info@najdhorizon.example | fixture: fixtures/profile.mjs | data | components/common/textWithIcon/textWithIcon.js:65 | web: all but as-individual, as-staff, error, loading · @375: none |
| 4 Users ⟨{n} Users⟩ ×2 | {n} + المستخدمين | t+ | components/common/textWithIcon/textWithIcon.js:65 | web: all but as-individual, as-staff, error, loading · @375: none |
| Agency Name | اسم الشركة | t | components/common/flex/styled.js:3 | all but as-individual, as-staff (web and @375) |
| Enter Business Name | أدخل اسم الشركة | t (placeholder) | components/common/textInput/styled.js:9 | all but as-individual, as-staff (web and @375) |
| Phone Number | رقم الجوال | t | components/common/Label/Label.js:9 | all |
| Enter Phone Number | أدخل رقم الهاتف | t (placeholder) | components/phone-input/styled.js:6 | all |
| Website | الموقع الإلكتروني | t | components/common/flex/styled.js:3 | all but as-individual, as-staff (web and @375) |
| www.example.com | not in translations | code (placeholder) | components/common/textInput/styled.js:9 | all but as-individual, as-staff (web and @375) |
| City | المدينة | t | components/common/Label/Label.js:9 | all |
| Riyadh | fixture: fixtures/extra.mjs | data | components/common/select/styled.js:20 | all but error, loading (web and @375) |
| National Short Address | العنوان الوطني | t | components/common/flex/styled.js:3 | all |
| Enter National Short Address | أدخل العنوان الوطني للشركة | t (placeholder) | components/common/textInput/styled.js:9 | all |
| Address | العنوان | t | components/common/flex/styled.js:3 | all |
| Enter Business Address | أدخل عنوان الشركة | t (placeholder) | components/common/textInput/styled.js:9 | all but as-individual, as-staff (web and @375) |
| Agency Description | وصف الشركة | t | components/common/flex/styled.js:3 | all but as-individual, as-staff (web and @375) |
| Enter Agency Description | أدخل وصف الشركة | t (placeholder) | components/common/textInput/textInput.js:95 | all but as-individual, as-staff (web and @375) |
| Residential brokerage serving Riyadh. | fixture: fixtures/profile.mjs | data (value) | components/common/textInput/textInput.js:95 | all but as-individual, as-staff, error, form-agency-filled +3 more (web and @375) |
| Agency Logo | شعار الشركة | t | components/common/Label/Label.js:9 | all but as-individual, as-staff (web and @375) |
| Save Changes | حفظ التغييرات | t | container/pages/user-settings/agancy-settings.js:116 · components/common/button/button.js:40 | all |
| © 2026 – All Rights Reserved ⟨© {n} – All Rights Reserved⟩ | {n} + كل الحقوق محفوظة | t+ | layout/withAdminLayout.js:477 | all |
| FEEDBACK | ملاحظاتك | t | components/feedback/FeedbackTab.js:98 | web: all but drawer-feedback, inline-save-changes, modal-agency-saved, modal-download-app, modal-help-support-profolio, modal-preview · @375: all but drawer-feedback, drawer-notifications-mark-all-as, drawer-preview, drawer-profile-information-faisal-al-harbi, inline-save-changes, modal-agency-saved |
| 100% ⟨{n}%⟩ | value | data | components/common/avatar/avatar.js:20 | as-individual (web and @375) |
| Faisal Al-Harbi | fixture: fixtures/user.json | data | components/common/flex/styled.js:3 · components/utilities/auth-info/info.js:84 | web: as-individual · @375: as-individual, drawer-profile-information-faisal-al-harbi |
| Individual | مسوق فرد | t | components/common/textWithIcon/styled.js:3 | as-individual (web and @375) |
| Nafath Verified | تم توثيق الحساب من النفاذ الوطني | t | components/common/flex/styled.js:3 · components/utilities/auth-info/info.js:105 | web: as-individual, as-staff · @375: as-individual, as-staff, drawer-profile-information-faisal-al-harbi |
| faisal.alharbi@mail.example | fixture: fixtures/profile.mjs | data | container/pages/user-settings/profile.js:260 | as-individual (web and @375) |
| Convert to Agency | التحويل إلى حساب منشأة | t | components/common/button/button.js:40 | as-individual (web and @375) |
| Additional Information | معلومات إضافية | t | container/pages/user-settings/profile.js:301 | as-individual, as-staff (web and @375) |
| Title (English) | الاسم (بالإنجليزية) | t | components/common/flex/styled.js:3 | as-individual, as-staff (web and @375) |
| Please enter English title | أدخل العنوان باللغة الإنجليزية | t (placeholder) | components/common/textInput/styled.js:9 | as-individual, as-staff (web and @375) |
| العنوان (عربي) | not in translations | code | components/common/flex/styled.js:3 | as-individual, as-staff (web and @375) |
| Please enter Arabic title | أدخل العنوان باللغة العربية | t (placeholder) | components/common/textInput/styled.js:9 | as-individual, as-staff (web and @375) |
| Email | إيميل / البريد الإلكتروني · also إيميل | t | components/common/flex/styled.js:3 | as-individual, as-staff (web and @375) |
| Enter Email | أدخل البريد الالكتروني | t (placeholder) | components/common/textInput/styled.js:9 | as-individual, as-staff (web and @375) |
| Whatsapp | واتساب | t | components/common/Label/Label.js:9 | as-individual, as-staff (web and @375) |
| Enter whatsapp number | أدخل رقم الواتساب | t (placeholder) | components/phone-input/styled.js:6 | as-individual, as-staff (web and @375) |
| Enter Address | أدخل العنوان | t (placeholder) | components/common/textInput/styled.js:9 | as-individual, as-staff (web and @375) |
| Service Area | منطقة الخدمة | t | components/common/Label/Label.js:9 | as-individual, as-staff (web and @375) |
| Diriyah | fixture: fixtures/profile.mjs | data | components/common/select/styled.js:20 | as-individual (web and @375) |
| Al Kharj | fixture: fixtures/payments.mjs | data | components/common/select/styled.js:20 | web: as-individual, as-staff · @375: as-staff |
| +23 ⟨{n}⟩ ×2 | value | data | components/common/popup/popup.js:23 | as-individual (web and @375) |
| User Languages | لغات المستخدم | t | components/common/Label/Label.js:9 | as-individual, as-staff (web and @375) |
| English | not in translations | code | components/common/select/styled.js:20 | as-individual (web and @375) |
| Arabic | not in translations | code | components/common/select/styled.js:20 | as-individual (web and @375) |
| Years of Experience | سنوات الخبرة | t | components/common/Label/Label.js:9 | as-individual, as-staff (web and @375) |
| 3-5 Years | fixture: fixtures/profile.mjs | data | components/common/select/styled.js:20 | as-individual (web and @375) |
| Agent Description - English | وصف الوكيل - بالإنجليزية | t | components/common/flex/styled.js:3 | as-individual, as-staff (web and @375) |
| Enter Agent Description | أدخل وصف الوكيل | t (placeholder) | components/common/textInput/textInput.js:95 | as-individual, as-staff (web and @375) |
| Faisal Al-Harbi is an independent, FAL-licensed real estate broker in Riyadh, focusing on residential sales across the north and east of the city. For the past four years he has helped families and first-time buyers find apartments, floors and villas in Al Wurud, Al Masif, Al Yarmuk and Al Nahdah, and advises investors on off-plan projects and ready units. Every listing he publishes carries a valid REGA advertising licence and verified photographs. He speaks Arabic and English, arranges viewings seven days a week, and follows each client through valuation, negotiation, financing and the final transfer of title. | value | data (value) | components/common/textInput/textInput.js:95 | as-individual (web and @375) |
| Generate Agent Description (English) | إنشاء وصف الوكيل (بالإنجليزية) | t | components/common/button/button.js:40 | as-individual, as-staff (web and @375) |
| وصف الوكيل - بالعربية (اختياري) | not in translations | code | components/common/flex/styled.js:3 | as-individual, as-staff (web and @375) |
| أدخل وصف الوكيل | not in translations | code (placeholder) | components/common/textInput/textInput.js:95 | as-individual, as-staff (web and @375) |
| فيصل الحربي وسيط عقاري مستقل مرخّص في الرياض، ويتخصص في بيع العقارات السكنية في شمال المدينة وشرقها. ساعد خلال السنوات الأربع الماضية العائلات والمشترين لأول مرة في العثور على الشقق والأدوار والفلل في أحياء الورود والمصيف واليرموك والنهضة، ويقدّم المشورة للمستثمرين في المشاريع على الخارطة والوحدات الجاهزة. جميع إعلاناته تحمل ترخيصاً إعلانياً سارياً من الهيئة العامة للعقار وصوراً موثّقة. يتحدث العربية والإنجليزية، وينظّم المعاينات طوال أيام الأسبوع، ويرافق عملاءه في التقييم والتفاوض والتمويل حتى إفراغ الصك. | value | data (value) | components/common/textInput/textInput.js:95 | as-individual (web and @375) |
| إنشاء وصف الوكيل (بالعربية) | not in translations | code | components/common/button/button.js:40 | as-individual, as-staff (web and @375) |
| Upload a picture | إضافة صورة | t | components/common/Label/Label.js:9 | as-individual, as-staff (web and @375) |
| Browse and Upload | تصفح وإضافة | t | components/common/button/button.js:40 | as-individual, as-staff, error, inline-icon, loading (web and @375) |
| Profile Picture Guidelines: | إرشادات صورة الملف الشخصي | t | components/common/title/title.js:7 | as-individual, as-staff (web and @375) |
| Upload a clear, high-resolution headshot with a solid background. | رفع صورة شخصية واضحة مع خلفية ثابتة | t | tenant/bayut/data/profileFields.js:144 | as-individual, as-staff (web and @375) |
| Pictures of logos, buildings, or irrelevant images are not allowed. | الصور التي تحتوي على شعارات أو مباني أو صور غير ذات صلة غير مسموح بها | t | tenant/bayut/data/profileFields.js:144 | as-individual, as-staff (web and @375) |
| Learn more | تعرف على المزيد | t | components/common/button/button.js:40 | as-individual, as-staff (web and @375) |
| Profile Completeness | اكتمال الحساب الشخصي | t | tenant/common/components/profile-completion/profile-settings-card.js:36 | as-staff, profile-incomplete (web and @375) |
| Why is this important? | لماذا هذا مهم؟ | t | tenant/common/components/profile-completion/profile-settings-card.js:45 | as-staff, profile-incomplete (web and @375) |
| 50% ⟨{n}%⟩ ×2 | value | data | tenant/common/components/profile-completion/profile-settings-card.js:54 · components/common/avatar/avatar.js:20 | as-staff, profile-incomplete (web and @375) |
| FAL License Verification | التحقق من رخصة فال | t | components/common/flex/styled.js:3 | as-staff, profile-incomplete (web and @375) |
| Nafath Verification | التحقق من نفاذ الوطني | t | components/common/flex/styled.js:3 | as-staff, profile-incomplete (web and @375) |
| Abdullah Al-Otaibi | fixture: fixtures/credits.mjs | data | components/common/flex/styled.js:3 | as-staff (web and @375) |
| Agency | منشاة | t | components/common/textWithIcon/styled.js:3 | as-staff (web and @375) |
| abdullah@najdhorizon.example | fixture: fixtures/profile.mjs | data | container/pages/user-settings/profile.js:260 | as-staff (web and @375) |
| Select City | اختر المدينة | t | components/common/select/styled.js:20 | as-staff, error, loading (web and @375) |
| Select User Languages | اختر لغات المستخدم | t | components/common/select/styled.js:20 | as-staff (web and @375) |
| Select Years of Experiences | not in translations | code | components/common/select/styled.js:20 | as-staff (web and @375) |
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
| Preview | معاينة | t | components/common/drawer/drawer.js:90 · components/common/modals/antd-modals.js:33 | web: modal-preview · @375: drawer-preview |
| Profile Information | معلومات الحساب الشخصي | t | components/common/drawer/drawer.js:90 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| Agency User | not in translations | code | components/utilities/auth-info/info.js:89 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| faisal@najdhorizon.example | fixture: fixtures/user.json | data | components/utilities/auth-info/info.js:96 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| REGA Verified | تم التحقق من رخصة فال | t | components/utilities/auth-info/info.js:114 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| Account Settings | إعدادت الحساب | t | components/utilities/auth-info/info.js:124 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| Sign Out | not in translations | code | components/utilities/auth-info/info.js:144 | web: none · @375: drawer-profile-information-faisal-al-harbi |
| undefined Users | not in translations | code | components/common/textWithIcon/textWithIcon.js:65 | web: error · @375: none |
| Please Enter Agency Name | أدخل اسم الشركة | t | components/common/errorMessage/errorMessage.js:26 | form-agency-errors (web and @375) |
| Enter a valid website address | أدخل عنوان موقع ويب صالحاً | t | components/common/errorMessage/errorMessage.js:26 | form-agency-errors (web and @375) |
| Residential brokerage serving Riyadh: apartments, floors and villas for sale and rent in the north and east of the city. | value | data (value) | components/common/textInput/textInput.js:95 | form-agency-filled, message-agency-failed, modal-agency-saved (web and @375) |
| Your request for update profile has been sent | تم ارسال طلبك لتحديث الملف الشخصي | t | container/pages/user-settings/agancy-settings.js:111 | inline-save-changes, modal-agency-saved (web and @375) |
| Website is invalid | fixture: fixtures/forms.mjs | data | — | message-agency-failed (web and @375) |
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
