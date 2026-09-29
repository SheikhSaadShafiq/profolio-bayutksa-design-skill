# Rendered copy — ad-license

Every string the compiled files of `pages/ad-license` draw — 26 web, 24 phone (@375) — in the order first drawn; the header and the rail are in `_shell.md`. Quote a string as it is here, with its file. `is`: **t** a translation · **t+** translations joined with values — ⟨pattern⟩: {{x}} the translation's placeholder, {n} a number ("75,000" is one), {date}, {time}, {x} a fixture value; ×N strings of one pattern; Arabic part by part · **code** drawn by the product, not in the translation files — spelled in its code or its data files (the Arabic beside it is the data file's own twin, `label` / `label_l1`; else "not in translations") · **data** the fixture's data, a mocked response or a value — not copy (copied unchanged into a design, it stays unmarked) · **note** quoted by a state note, drawn nowhere. A suffix says how the string is drawn: **(placeholder)** an input's placeholder attribute · **(value)** what a field holds, an input's or a textarea's value (the fixture's, unless a translation). The class is the first word — `t (placeholder)` is a **t** row: grep `| t |` and `| t (` for every t row. data-pf-src: without `src/`. files, per layout (web · @375): `all`, `all but` the states named, the states named, or `none`; `page` = `pages/ad-license.html` (`.mobile.html` for @375), a state = `pages/ad-license/<state>.html`.

| English | Arabic | is | data-pf-src | files |
|---|---|---|---|---|
| Get a New Ad License | إصدار ترخيص جديد | t | components/common/heading/heading.js:10 | all |
| Property Information | معلومات العقار | t | tenant/bayut/components/ad-license/card-block.js:20 | all web, no @375 |
| Purpose | الغرض | t | components/common/Label/Label.js:9 | all |
| Sell | للبيع | t | components/common/radio-button/radio-button.js:156 | all |
| 600 ⟨{n}⟩ ×2 | value | data | tenant/bayut/components/ad-license/purpose-radio-button.js:11 · tenant/bayut/components/ad-license/create-ad-license.js:534 | all |
| Rent | للإيجار | t | components/common/radio-button/radio-button.js:156 | all |
| Property Type | نوع العقار | t | components/common/Label/Label.js:9 | all |
| Residential | سكني | t | components/common/radio-button/radio-button.js:156 | all |
| Commercial | تجاري | t | components/common/radio-button/radio-button.js:156 | all |
| Property Sub Type | النوع الفرعي للعقار | t | components/common/Label/Label.js:9 | all |
| Select Property Sub Type | اختر نوع العقار الفرعي | t | components/common/select/styled.js:20 | all but flow-ad-license-01-property-information, flow-ad-license-02-property-location, flow-ad-license-03-contact-information, message-submit-failed (web and @375) |
| Property Ownership Document Number | رقم وثيقة ملكية العقار | t | components/common/flex/styled.js:3 | all |
| Enter 10-20 digit deed number | أدخل رقم الصك من 10-20 رقمًا | t (placeholder) | components/common/textInput/styled.js:9 | all |
| Property Age | عمر العقار | t | components/common/Label/Label.js:9 | all |
| Select Property Age | اختر عمر العقار | t | components/common/select/styled.js:20 | all but flow-ad-license-01-property-information, flow-ad-license-02-property-location, flow-ad-license-03-contact-information, message-submit-failed (web and @375) |
| Number of Bedrooms | عدد الغرف | t | components/common/Label/Label.js:9 | all |
| Studio | استوديو | t | components/common/radio-button/radio-button.js:156 | all |
| 1 ⟨{n}⟩ ×10 | value | data | components/common/radio-button/radio-button.js:156 · components/common/select/styled.js:20 | all |
| 10+ ⟨{n}+⟩ | value | data | components/common/radio-button/radio-button.js:156 | all |
| Area Size | المساحة | t | components/common/flex/styled.js:3 | all |
| (Sq. M.) | م2 | t+ | tenant/bayut/components/ad-license/create-ad-license.js:391 | all |
| Enter Area | أدخل المساحة | t (placeholder) | components/common/textInput/styled.js:9 | all |
| Price of Property ([riyal]) | سعر العقار | t+ | components/common/flex/styled.js:3 | all |
| Enter Price | أدخل السعر | t (placeholder) | components/common/textInput/styled.js:9 | all |
| Property Location | موقع العقار | t | tenant/bayut/components/ad-license/card-block.js:20 | all web, no @375 |
| City | المدينة | t | components/common/Label/Label.js:9 | all |
| Select City | اختر المدينة | t | components/common/select/styled.js:20 | all but flow-ad-license-02-property-location, flow-ad-license-03-contact-information, form-district-options, message-submit-failed (web and @375) |
| Location/District | الموقع/الحي | t | components/common/Label/Label.js:9 | all |
| Search Location | ابحث عن موقع | t | components/common/select/styled.js:20 | all but flow-ad-license-02-property-location, flow-ad-license-03-contact-information, form-district-options, message-submit-failed (web and @375) |
| Map Pin | دبوس الخريطة | t | components/common/Label/Label.js:9 | all |
| Google Maps API key is missing. Please add REACT_APP_GOOGLE_MAPS_API_KEY to your .env file. | مفتاح Google Maps API مفقود. يرجى إضافة REACT_APP_GOOGLE_MAPS_API_KEY إلى ملف .env الخاص بك. | t | components/post-listing/google-map/google-map.js:210 | all |
| Pin moved to 24.7742650, 46.7385860 ⟨Pin moved to {n}.{n}, {n}.{n}⟩ | تم نقل الدبوس إلى + {n} + {n} + {n} + {n} | t+ | tenant/bayut/components/post-listing/location-select/location-select.js:542 | web: all but flow-ad-license-02-property-location, flow-ad-license-03-contact-information, form-district-options, inline-adjust, message-submit-failed · @375: all but flow-ad-license-02-property-location, flow-ad-license-03-contact-information, form-district-options, message-submit-failed |
| Adjust | تعديل | t | tenant/bayut/components/post-listing/location-select/location-select.js:565 | web: all but inline-adjust · @375: all |
| Contact Information | معلومات الاتصال | t | tenant/bayut/components/ad-license/card-block.js:20 | all web, no @375 |
| Name | الاسم | t | components/common/flex/styled.js:3 | all |
| Enter Name | أدخل الاسم | t (placeholder) | components/common/textInput/styled.js:9 | all |
| Phone Number | رقم الجوال | t | components/common/Label/Label.js:9 | all |
| Enter Phone Number | أدخل رقم الهاتف | t (placeholder) | components/phone-input/styled.js:6 | all |
| Total | الإجمالي | t | tenant/bayut/components/ad-license/create-ad-license.js:530 | all |
| 0 ⟨{n}⟩ | value | data | tenant/bayut/components/ad-license/create-ad-license.js:534 | all but flow-ad-license-01-property-information, flow-ad-license-02-property-location, flow-ad-license-03-contact-information, form-property-sub-type-options, form-purpose-and-type-selected, message-submit-failed (web and @375) |
| Continue | متابعة | t | components/common/button/button.js:40 | all |
| © 2026 – All Rights Reserved ⟨© {n} – All Rights Reserved⟩ | {n} + كل الحقوق محفوظة | t+ | layout/withAdminLayout.js:477 | all |
| FEEDBACK | ملاحظاتك | t | components/feedback/FeedbackTab.js:98 | web: all but drawer-feedback, modal-download-app, modal-help-support-profolio · @375: all but drawer-feedback, drawer-notifications-mark-all-as, drawer-profile-information-faisal-al-harbi |
| Back | العودة | t | components/common/button/button.js:40 | all @375, no web |
| Send us feedback | أرسل لنا ملاحظاتك | t | components/feedback/FeedbackDrawer.js:189 | drawer-feedback (web and @375) |
| The product team reads every message. | فريق المنتج يقرأ كل رسالة. | t | components/feedback/FeedbackDrawer.js:190 | drawer-feedback (web and @375) |
| What kind of feedback is this? | ما نوع هذه الملاحظة؟ | t | components/feedback/FeedbackDrawer.js:285 | drawer-feedback (web and @375) |
| Feedback | ملاحظة | t | components/feedback/FeedbackDrawer.js:290 | drawer-feedback (web and @375) |
| Feature request | طلب ميزة | t | components/feedback/FeedbackDrawer.js:290 | drawer-feedback (web and @375) |
| Issue | مشكلة | t | components/feedback/FeedbackDrawer.js:290 | drawer-feedback (web and @375) |
| Tell us more | أخبرنا المزيد | t | components/feedback/FeedbackDrawer.js:322 | drawer-feedback (web and @375) |
| Describe what happened, or the change you would like to see. | صف ما حدث، أو التغيير الذي تود رؤيته. | t (placeholder) | components/feedback/FeedbackDrawer.js:323 | drawer-feedback (web and @375) |
| Attach a screenshot | إرفاق لقطة شاشة | t | components/feedback/FeedbackAttachment.js:131 | drawer-feedback (web and @375) |
| We attach your account details. | نرفق تفاصيل حسابك. | t | components/feedback/FeedbackDrawer.js:362 | drawer-feedback (web and @375) |
| Cancel | إلغاء | t | components/feedback/FeedbackDrawer.js:225 · tenant/bayut/components/post-listing/location-select/location-select.js:652 | web: drawer-feedback · @375: drawer-feedback, inline-adjust |
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
| Less than 1 year | أقل من سنة واحدة | t | components/common/select/styled.js:20 | dropdown-select-property-age (web and @375) |
| 1 year | سنة واحدة | t | components/common/select/styled.js:20 | dropdown-select-property-age (web and @375) |
| 2 years | سنتان | t | components/common/select/styled.js:20 | dropdown-select-property-age (web and @375) |
| 3 years | 3 سنوات | t | components/common/select/styled.js:20 | dropdown-select-property-age (web and @375) |
| 4 years | 4 سنوات | t | components/common/select/styled.js:20 | dropdown-select-property-age (web and @375) |
| 5 years | 5 سنوات | t | components/common/select/styled.js:20 | dropdown-select-property-age, flow-ad-license-01-property-information, flow-ad-license-02-property-location, flow-ad-license-03-contact-information, message-submit-failed (web and @375) |
| 6 years | 6 سنوات | t | components/common/select/styled.js:20 | dropdown-select-property-age (web and @375) |
| 7 years | 7 سنوات | t | components/common/select/styled.js:20 | dropdown-select-property-age (web and @375) |
| Apartment | not in translations | code | components/common/select/styled.js:20 | flow-ad-license-01-property-information, flow-ad-license-02-property-location, flow-ad-license-03-contact-information, form-property-sub-type-options, message-submit-failed (web and @375) |
| [riyal] 1,250,000 ⟨[riyal]{n}⟩ | value | data | components/common/number/number.js:107 | flow-ad-license-01-property-information, flow-ad-license-02-property-location, flow-ad-license-03-contact-information, message-submit-failed (web and @375) |
| Riyadh | fixture: fixtures/extra.mjs | data | components/common/select/styled.js:20 | web: flow-ad-license-02-property-location, flow-ad-license-03-contact-information, form-city-options, form-district-options, message-submit-failed · @375: flow-ad-license-02-property-location, flow-ad-license-03-contact-information, form-city-options, form-district-options, inline-select-city, message-submit-failed |
| Al Yasmin | fixture: fixtures/payments.mjs | data | components/common/select/styled.js:20 | flow-ad-license-02-property-location, flow-ad-license-03-contact-information, form-district-options, message-submit-failed (web and @375) |
| 3537 ⟨{n}⟩ ×6 | value | data | components/common/select/styled.js:20 | web: form-city-options, form-district-options, form-property-sub-type-options · @375: form-city-options, form-district-options, form-property-sub-type-options, inline-select-city |
| Jeddah | fixture: fixtures/listing-form.mjs | data | components/common/select/styled.js:20 | web: form-city-options · @375: form-city-options, inline-select-city |
| Makkah | fixture: fixtures/payments.mjs | data | components/common/select/styled.js:20 | web: form-city-options · @375: form-city-options, inline-select-city |
| Dammam | fixture: fixtures/payments.mjs | data | components/common/select/styled.js:20 | web: form-city-options · @375: form-city-options, inline-select-city |
| Madinah | fixture: fixtures/payments.mjs | data | components/common/select/styled.js:20 | web: form-city-options · @375: form-city-options, inline-select-city |
| Al Khobar | fixture: fixtures/payments.mjs | data | components/common/select/styled.js:20 | web: form-city-options · @375: form-city-options, inline-select-city |
| Taif | fixture: fixtures/payments.mjs | data | components/common/select/styled.js:20 | web: form-city-options · @375: form-city-options, inline-select-city |
| Tabuk | fixture: fixtures/payments.mjs | data | components/common/select/styled.js:20 | web: form-city-options · @375: form-city-options, inline-select-city |
| Property ownership document number must be 10-20 digits only | يجب أن يكون رقم وثيقة ملكية العقار من 10-20 رقمًا فقط | t | components/common/errorMessage/errorMessage.js:26 | form-deed-number-invalid, form-errors-on-submit, inline-continue (web and @375) |
| Search from Riyadh ⟨Search from {x}⟩ | البحث من + {x} | t+ | components/common/select/styled.js:20 | form-district-options (web and @375) |
| Al Malqa | fixture: fixtures/extra.mjs | data | components/common/select/styled.js:20 | form-district-options (web and @375) |
| Al Narjis | fixture: fixtures/listing-form.mjs | data | components/common/select/styled.js:20 | form-district-options (web and @375) |
| Hittin | fixture: fixtures/extra.mjs | data | components/common/select/styled.js:20 | form-district-options (web and @375) |
| Al Olaya | fixture: fixtures/extra.mjs | data | components/common/select/styled.js:20 | form-district-options (web and @375) |
| Al Sahafa | fixture: fixtures/payments.mjs | data | components/common/select/styled.js:20 | form-district-options (web and @375) |
| Al Aqiq | fixture: fixtures/listing-form.mjs | data | components/common/select/styled.js:20 | form-district-options (web and @375) |
| Al Wurud | fixture: fixtures/credits.mjs | data | components/common/select/styled.js:20 | form-district-options (web and @375) |
| Please select purpose | الرجاء تحديد نوع العرض | t | components/common/errorMessage/errorMessage.js:26 | form-errors-on-submit, inline-continue (web and @375) |
| Please select property type | يرجى تحديد نوع العقار | t | components/common/errorMessage/errorMessage.js:26 | form-errors-on-submit, inline-continue (web and @375) |
| Please select property sub type | يرجى تحديد نوع العقار الفرعي | t | components/common/errorMessage/errorMessage.js:26 | form-errors-on-submit, inline-continue (web and @375) |
| Please select property age | يرجى تحديد عمر العقار | t | components/common/errorMessage/errorMessage.js:26 | form-errors-on-submit, inline-continue (web and @375) |
| Please select number of bedrooms | يرجى تحديد عدد غرف النوم | t | components/common/errorMessage/errorMessage.js:26 | form-errors-on-submit, inline-continue (web and @375) |
| Please enter a valid area size | يرجى إدخال مساحة صحيحة | t | components/common/errorMessage/errorMessage.js:26 | form-errors-on-submit, inline-continue (web and @375) |
| Please enter a valid price | يرجى إدخال سعر صحيح | t | components/common/errorMessage/errorMessage.js:26 | form-errors-on-submit, inline-continue (web and @375) |
| City is required | المدينة مطلوبة | t | components/common/errorMessage/errorMessage.js:26 | form-errors-on-submit, inline-continue (web and @375) |
| Location is required | الموقع مطلوب | t | components/common/errorMessage/errorMessage.js:26 | form-errors-on-submit, inline-continue (web and @375) |
| Villa | not in translations | code | components/common/select/styled.js:20 | form-property-sub-type-options (web and @375) |
| Floor | not in translations | code | components/common/select/styled.js:20 | form-property-sub-type-options (web and @375) |
| Townhouse | not in translations | code | components/common/select/styled.js:20 | form-property-sub-type-options (web and @375) |
| Building | بناية | t | components/common/select/styled.js:20 | form-property-sub-type-options (web and @375) |
| Residential Building | مبنى سكني | t | components/common/select/styled.js:20 | form-property-sub-type-options (web and @375) |
| Land | أرض | code | components/common/select/styled.js:20 | form-property-sub-type-options (web and @375) |
| Residential Land | أرض سكنية | t | components/common/select/styled.js:20 | form-property-sub-type-options (web and @375) |
| Save | حفظ · also وفّر | t | tenant/bayut/components/post-listing/location-select/location-select.js:565 | web: inline-adjust · @375: none |
| Drag to Select Location on Map | اسحب لتحديد الموقع على الخريطة | t | tenant/bayut/components/post-listing/location-select/location-select.js:623 | web: none · @375: inline-adjust |
| Save Changes | حفظ التغييرات | t | tenant/bayut/components/post-listing/location-select/location-select.js:669 | web: none · @375: inline-adjust |
| Failed to create ad license request. Please try again. | فشل في إنشاء طلب رخصة الإعلان. يرجى المحاولة مرة أخرى. | t | — | message-submit-failed (web and @375) |
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
