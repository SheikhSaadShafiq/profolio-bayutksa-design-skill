# Rendered copy — packages

Every string the compiled files of `pages/packages` draw — 22 web, 19 phone (@375) — in the order first drawn; the header and the rail are in `_shell.md`. Quote a string as it is here, with its file. `is`: **t** a translation · **t+** translations joined with values — ⟨pattern⟩: {{x}} the translation's placeholder, {n} a number ("75,000" is one), {date}, {time}, {x} a fixture value; ×N strings of one pattern; Arabic part by part · **code** drawn by the product, not in the translation files — spelled in its code or its data files (the Arabic beside it is the data file's own twin, `label` / `label_l1`; else "not in translations") · **data** the fixture's data, a mocked response or a value — not copy (copied unchanged into a design, it stays unmarked) · **note** quoted by a state note, drawn nowhere. A suffix says how the string is drawn: **(placeholder)** an input's placeholder attribute · **(value)** what a field holds, an input's or a textarea's value (the fixture's, unless a translation). The class is the first word — `t (placeholder)` is a **t** row: grep `| t |` and `| t (` for every t row. data-pf-src: without `src/`. files, per layout (web · @375): `all`, `all but` the states named, the states named, or `none`; `page` = `pages/packages.html` (`.mobile.html` for @375), a state = `pages/packages/<state>.html`.

| English | Arabic | is | data-pf-src | files |
|---|---|---|---|---|
| Current Package | الرزمة الحالية | t | components/common/textWithIcon/styled.js:3 · components/common/button/button.js:40 | all but loading (web and @375) |
| Platinum Plus (Yearly) | fixture: fixtures/extra.mjs | data | tenant/common/components/prop-shop/package-header.js:72 | all but as-staff, error, loading (web and @375) |
| 6250 ⟨{n}⟩ ×10 | value | data | components/common/textWithIcon/styled.js:3 · components/common/statistic/index.js:93 | all but error, loading (web and @375) |
| credits | ائتمانات · also الاعتمادات | t | components/common/iconSubText/icon-with-subtext.js:33 | all |
| Package End Date | تاريخ انتهاء الحزمة | t | components/common/statistic/index.js:93 | all |
| Apr 04, 2027 ⟨{date}⟩ | value | data | components/common/statistic/index.js:93 | all but error, loading (web and @375) |
| Top-ups Purchased | تم شراء عمليات تعبئة الرصيد | t | components/common/statistic/index.js:93 | all |
| 0 ⟨{n}⟩ ×5 | value | data | components/common/statistic/index.js:93 · components/common/textWithIcon/styled.js:3 | all |
| Available Credits | النقاط المتاحة | t | components/common/statistic/index.js:93 · tenant/bayut/components/credit-info-drawer/creditInfoDrawer.js:125 | all |
| Used | النقاط المستخدمة | t | components/common/statistic/index.js:93 | all |
| Total | الإجمالي | t | components/common/statistic/index.js:93 · tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:349 | all |
| What are Credits? | ما هي الاعتمادات؟ | t | components/common/button/button.js:40 | all |
| Get a Package According to Your Business Needs | احصل على باقة تناسب احتياجات عملك | t | components/common/heading/heading.js:10 | all web, no @375 |
| Package Duration | مدة الباقة | t | tenant/common/components/prop-shop/offered-packages/offeredPackages.js:262 · tenant/common/components/prop-shop/offered-packages/offeredPackages.js:325 | all |
| 1 Year | سنة واحدة | t | components/common/segmented/segmented.js:8 | all |
| 6 Months | 6 أشهر | t | components/common/segmented/segmented.js:8 | all |
| Benefits | المزايا | t | components/common/heading/heading.js:10 | all web, no @375 |
| Basic Listings | fixture: fixtures/extra.mjs | data | tenant/common/components/prop-shop/offered-packages/packageCardMobile.js:154 · tenant/common/components/prop-shop/offered-packages/offeredPackages.js:284 | all but error, loading (web and @375) |
| Hot Listings | fixture: fixtures/extra.mjs | data | tenant/common/components/prop-shop/offered-packages/packageCardMobile.js:154 · tenant/common/components/prop-shop/offered-packages/offeredPackages.js:284 | all but error, loading (web and @375) |
| Signature Listings | fixture: fixtures/extra.mjs | data | tenant/common/components/prop-shop/offered-packages/packageCardMobile.js:154 · tenant/common/components/prop-shop/offered-packages/offeredPackages.js:284 | all but error, loading (web and @375) |
| Photography Services | fixture: fixtures/extra.mjs | data | tenant/common/components/prop-shop/offered-packages/packageCardMobile.js:154 · tenant/common/components/prop-shop/offered-packages/offeredPackages.js:284 | all but error, loading (web and @375) |
| Videography Services | fixture: fixtures/extra.mjs | data | tenant/common/components/prop-shop/offered-packages/packageCardMobile.js:154 · tenant/common/components/prop-shop/offered-packages/offeredPackages.js:284 | all but error, loading (web and @375) |
| Credit Allocation to Staff | fixture: fixtures/extra.mjs | data | tenant/common/components/prop-shop/offered-packages/packageCardMobile.js:154 · tenant/common/components/prop-shop/offered-packages/offeredPackages.js:284 | all but error, loading (web and @375) |
| Dedicated Account Manager | fixture: fixtures/extra.mjs | data | tenant/common/components/prop-shop/offered-packages/packageCardMobile.js:154 · tenant/common/components/prop-shop/offered-packages/offeredPackages.js:284 | all but error, loading (web and @375) |
| Featured Tag for Your Agency | fixture: fixtures/extra.mjs | data | tenant/common/components/prop-shop/offered-packages/packageCardMobile.js:154 · tenant/common/components/prop-shop/offered-packages/offeredPackages.js:284 | all but error, loading (web and @375) |
| Listing Collection by Bayut | fixture: fixtures/extra.mjs | data | tenant/common/components/prop-shop/offered-packages/packageCardMobile.js:154 · tenant/common/components/prop-shop/offered-packages/offeredPackages.js:284 | all but error, loading (web and @375) |
| Titanium | fixture: fixtures/credits.mjs | data | components/render-text/render-text.js:3 · components/common/textWithIcon/styled.js:3 | all but error, loading (web and @375) |
| Pay | ادفع | t | tenant/common/components/prop-shop/offered-packages/packageCard.js:53 · tenant/common/components/prop-shop/offered-packages/packageCardMobile.js:76 | all but as-staff, error, loading (web and @375) |
| 250,000 to Upgrade ⟨{n} to Upgrade⟩ | {n} + لترقية | t+ | tenant/common/components/prop-shop/offered-packages/packageCard.js:60 · tenant/common/components/prop-shop/offered-packages/packageCardMobile.js:83 | all but as-staff, error, loading (web and @375) |
| Get Titanium | fixture: fixtures/credits.mjs | data | components/render-text/render-text.js:3 | all but as-staff, error, loading (web and @375) |
| 1000 ⟨{n}⟩ ×20 | value | data | tenant/common/components/prop-shop/offered-packages/packageCard.js:202 · tenant/common/components/prop-shop/offered-packages/packageCardMobile.js:162 +1 | all but error, loading (web and @375) |
| Save 8% ⟨Save {n}⟩ ×2 | حفظ · also وفّر + {n} | t+ | components/common/tag/styled.js:6 | all but error, loading (web and @375) |
| Platinum Plus | fixture: fixtures/extra.mjs | data | components/render-text/render-text.js:3 | all but error, loading (web and @375) |
| 150,000 ⟨{n}⟩ ×8 | value | data | tenant/common/components/prop-shop/offered-packages/packageCard.js:60 · tenant/common/components/prop-shop/offered-packages/packageCardMobile.js:83 | all but error, loading (web and @375) |
| Platinum | fixture: fixtures/extra.mjs | data | components/render-text/render-text.js:3 | all but error, loading (web and @375) |
| Downgrade Unavailable | خفض غير متاح | t | components/common/button/button.js:40 | all but error, loading (web and @375) |
| Gold | fixture: fixtures/extra.mjs | data | components/render-text/render-text.js:3 | all but error, loading (web and @375) |
| Silver | fixture: fixtures/extra.mjs | data | components/render-text/render-text.js:3 | all but error, loading (web and @375) |
| Bronze | fixture: fixtures/extra.mjs | data | components/render-text/render-text.js:3 | all but error, loading (web and @375) |
| Starter Pro | fixture: fixtures/extra.mjs | data | components/render-text/render-text.js:3 | all but error, loading (web and @375) |
| Starter | fixture: fixtures/extra.mjs | data | components/render-text/render-text.js:3 | all but error, loading (web and @375) |
| Credit Top-up | شحن الرصيد | t | components/common/heading/heading.js:10 | all |
| Ran out of credits? Add more credits to your account to post more listings and avail more services seamlessly. | نفذ رصيدك؟ أضف رصيدًا إلى حسابك لنشر المزيد من الإعلانات والاستفادة من المزيد من الخدمات | t | tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:236 | all |
| Total Credits | مجموع الرصيد | t | tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:250 · tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:319 | all |
| Enter the number of credits | أدخل عدد الاعتمادات | t (placeholder) | tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:251 | all |
| Get Top-up | احصل على شحن | t | components/common/button/button.js:40 | all |
| © 2026 – All Rights Reserved ⟨© {n} – All Rights Reserved⟩ | {n} + كل الحقوق محفوظة | t+ | layout/withAdminLayout.js:477 | all |
| FEEDBACK | ملاحظاتك | t | components/feedback/FeedbackTab.js:98 | web: all but drawer-feedback, drawer-what-are-credits, flow-buy-package-01-choose-package, modal-download-app, modal-get-titanium, modal-help-support-profolio · @375: all but drawer-feedback, drawer-get-titanium, drawer-notifications-mark-all-as, drawer-profile-information-faisal-al-harbi, drawer-what-are-credits, flow-buy-package-01-choose-package |
| Titanium (Yearly) | fixture: fixtures/credits.mjs | data | tenant/common/components/prop-shop/package-header.js:72 | as-staff (web and @375) |
| Send us feedback | أرسل لنا ملاحظاتك | t | components/feedback/FeedbackDrawer.js:189 | drawer-feedback (web and @375) |
| The product team reads every message. | فريق المنتج يقرأ كل رسالة. | t | components/feedback/FeedbackDrawer.js:190 | drawer-feedback (web and @375) |
| What kind of feedback is this? | ما نوع هذه الملاحظة؟ | t | components/feedback/FeedbackDrawer.js:285 | drawer-feedback (web and @375) |
| Feedback | ملاحظة | t | components/feedback/FeedbackDrawer.js:290 | drawer-feedback (web and @375) |
| Feature request | طلب ميزة | t | components/feedback/FeedbackDrawer.js:290 | drawer-feedback (web and @375) |
| Issue | مشكلة | t | components/feedback/FeedbackDrawer.js:290 | drawer-feedback (web and @375) |
| Tell us more | أخبرنا المزيد | t | components/feedback/FeedbackDrawer.js:322 | drawer-feedback (web and @375) |
| Describe what happened, or the change you would like to see. | صف ما حدث، أو التغيير الذي تود رؤيته. | t (placeholder) | components/feedback/FeedbackDrawer.js:323 | drawer-feedback (web and @375) |
| Attach a screenshot | إرفاق لقطة شاشة | t | components/feedback/FeedbackAttachment.js:131 | drawer-feedback (web and @375) |
| We attach the page you are on (Credits & Packages) and your account details. ⟨We attach the page you are on ({{pageName}}) and your account details.⟩ | نرفق الصفحة التي تتصفحها ({{pageName}}) وتفاصيل حسابك. | t+ | components/feedback/FeedbackDrawer.js:362 | drawer-feedback (web and @375) |
| Cancel | إلغاء | t | components/feedback/FeedbackDrawer.js:225 | drawer-feedback (web and @375) |
| Send feedback | إرسال الملاحظة | t | components/feedback/FeedbackDrawer.js:244 | drawer-feedback (web and @375) |
| Upgrade to Titanium ⟨Upgrade to {x}⟩ | ترقية الى + {x} | t+ | tenant/common/components/prop-shop/offered-packages/package-upgrade-modal.js:33 | web: flow-buy-package-01-choose-package, modal-get-titanium · @375: drawer-get-titanium, flow-buy-package-01-choose-package |
| Package Price | سعر الطرد | t | tenant/common/components/prop-shop/offered-packages/package-upgrade-modal.js:83 | web: flow-buy-package-01-choose-package, modal-get-titanium · @375: drawer-get-titanium, flow-buy-package-01-choose-package |
| [riyal] 250,000 ⟨[riyal]{n}⟩ | value | data | tenant/common/components/prop-shop/offered-packages/package-upgrade-modal.js:84 · tenant/common/components/prop-shop/offered-packages/package-upgrade-modal.js:42 | web: flow-buy-package-01-choose-package, modal-get-titanium · @375: drawer-get-titanium, flow-buy-package-01-choose-package |
| Amount to Pay | المبلغ المطلوب دفعه | t | tenant/common/components/prop-shop/offered-packages/package-upgrade-modal.js:41 | web: flow-buy-package-01-choose-package, modal-get-titanium · @375: drawer-get-titanium, flow-buy-package-01-choose-package |
| Upgrade | ترقية | t | components/common/button/button.js:40 | web: flow-buy-package-01-choose-package, modal-get-titanium · @375: drawer-get-titanium, flow-buy-package-01-choose-package |
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
| Bayut Credits | رصيد حساب الأعمال | t | tenant/bayut/components/credit-info-drawer/creditInfoDrawer.js:96 | drawer-what-are-credits (web and @375) |
| What are Bayut Credits? | ما هو رصيد بيوت؟ | t | components/common/heading/heading.js:10 | drawer-what-are-credits (web and @375) |
| Credits are the currency used on Bayut. This credits system makes it easier and more flexible for you to advertise your properties on Bayut. When you sign a contract with us, you will receive credits that you can use to post property listings or upgrade them to increase your listings' visibility. | النقاط هي العملة المستخدمة على بيوت. يوفر لك نظام الرصيد طريقة أسهل وأكثر مرونة للإعلان عن عقاراتك على بيوت. عند توقيع عقد معنا، ستحصل على نقاط يمكنك استخدامها لنشر الإعلانات أو ترقيتها لزيادة ظهورها. | t | tenant/bayut/components/credit-info-drawer/creditInfoDrawer.js:109 | drawer-what-are-credits (web and @375) |
| Here’s some information to help you get started: | إليك بعض المعلومات لمساعدتك على البدء: | t | tenant/bayut/components/credit-info-drawer/creditInfoDrawer.js:114 | drawer-what-are-credits (web and @375) |
| Your total credits have been allocated at the start of your contract. You can use them anytime during your contract period based on the listings you post. You can view your current credit balance in the Dashboard and Credits Usage. | تم تخصيص إجمالي الرصيدك عند بدء عقدك ويمكنك استخدامه في أي وقت خلال مدة العقد بناءً على الإعلانات التي تنشرها، ويمكنك الاطلاع ايضا على رصيدك الحالي في لوحة التحكم واستخدام الرصيد. + لوحة التحكم + و + استخدام نقاط الرصيد | t+ | tenant/bayut/components/credit-info-drawer/creditInfoDrawer.js:26 | drawer-what-are-credits (web and @375) |
| Using Credits | استخدام الرصيد | t | tenant/bayut/components/credit-info-drawer/creditInfoDrawer.js:125 | drawer-what-are-credits (web and @375) |
| On Bayut, credits are used when a listing is published or when upgrading a listing such as Hot and Signature listings, photography and videography services, or refreshing the listing for a day. Credit usage can be viewed in detail in the Credits Usage. | على بيوت، تُستخدم النقاط عند نشر الإعلان أو ترقيته مثل الإعلانات المميزة أو الاستثنائية، وخدمات التصوير الفوتوغرافي والفيديو، أو تجديد نشر الإعلان ليوم واحد.يمكنك الاطلاع على تفاصيل استخدام النقاط في قسم + استخدام نقاط الرصيد | t+ | tenant/bayut/components/credit-info-drawer/creditInfoDrawer.js:61 | drawer-what-are-credits (web and @375) |
| Publishing and Expiry of Listings | النشر وانتهاء صلاحية الإعلانات | t | tenant/bayut/components/credit-info-drawer/creditInfoDrawer.js:125 | drawer-what-are-credits (web and @375) |
| Each listing on Bayut remains active based on the duration of your package and Ad License validity period. Listings will become inactive if the package is not renewed after expiry, or if the Ad License has expired. | يبقى كل إعلان على بيوت نشطًا بناءً على مدة الباقة ورخصة الإعلان. ستصبح الإعلانات غير نشطة في حال عدم تجديد الباقة بعد انتهاء صلاحيتها، أو في حال انتهاء صلاحية رخصة الإعلان. | t | tenant/bayut/components/credit-info-drawer/creditInfoDrawer.js:82 | drawer-what-are-credits (web and @375) |
| (Yearly) | سنوي | t+ | tenant/common/components/prop-shop/package-header.js:74 | error (web and @375) |
| Payment failed due to an error. | فشل الدفع بسبب خطأ ما. | t | — | flow-ad-license-06-failure, flow-buy-package-05-failure, flow-top-up-05-failure (web and @375) |
| All credits will be allocated upfront and will remain valid for 12 months ⟨All credits will be allocated upfront and will remain valid for {{months}} {{monthWord}}⟩ | سيتم إضافة جميع نقاط الرصيد دفعة واحدة، وتبقى صالحة لمدة {{months}} {{monthWord}}. | t+ | tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:151 | form-credit-top-up-priced (web and @375) |
| [riyal]2,250 ⟨[riyal]{n}⟩ | value | data | tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:352 | form-credit-top-up-priced (web and @375) |
| [riyal]2,500 ⟨[riyal]{n}⟩ | value | data | tenant/common/components/prop-shop/credit-top-ups/creditTopUps.js:368 | form-credit-top-up-priced (web and @375) |
| You aborted the payment. Please retry or choose another payment method. | لقد ألغيت الدفعة. فضلاً حاول مجددًا أو اختر طريقة دفع أخرى. | t | — | message-payment-cancelled (web and @375) |
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
