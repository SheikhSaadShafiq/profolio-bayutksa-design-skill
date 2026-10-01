# Rendered copy — checkout

Every string the compiled files of `pages/checkout` draw — 28 web, 25 phone (@375) — in the order first drawn; the header and the rail are in `_shell.md`. Quote a string as it is here, with its file. `is`: **t** a translation · **t+** translations joined with values — ⟨pattern⟩: {{x}} the translation's placeholder, {n} a number ("75,000" is one), {date}, {time}, {x} a fixture value; ×N strings of one pattern; Arabic part by part · **code** drawn by the product, not in the translation files — spelled in its code or its data files (the Arabic beside it is the data file's own twin, `label` / `label_l1`; else "not in translations") · **data** the fixture's data, a mocked response or a value — not copy (copied unchanged into a design, it stays unmarked) · **note** quoted by a state note, drawn nowhere. A suffix says how the string is drawn: **(placeholder)** an input's placeholder attribute · **(value)** what a field holds, an input's or a textarea's value (the fixture's, unless a translation). The class is the first word — `t (placeholder)` is a **t** row: grep `| t |` and `| t (` for every t row. data-pf-src: without `src/`. files, per layout (web · @375): `all`, `all but` the states named, the states named, or `none`; `page` = `pages/checkout.html` (`.mobile.html` for @375), a state = `pages/checkout/<state>.html`.

| English | Arabic | is | data-pf-src | files |
|---|---|---|---|---|
| Payment Method | طريقة الدفع | t | container/pages/payment/paymentMethods.js:46 | all but error, flow-buy-package-02-checkout, flow-buy-package-04-success, flow-top-up-04-success, loading (web and @375) |
| Credit / Debit Card | بطاقة الائتمان / الخصم · also الرصيد / بطاقة الائتمان | t | components/common/textWithIcon/styled.js:3 | all but error, flow-buy-package-02-checkout, flow-buy-package-04-success, flow-top-up-04-success, loading (web and @375) |
| Tabby | تابي | t | components/common/textWithIcon/styled.js:3 · components/checkout/tabby.js:166 | all but error, flow-buy-package-02-checkout, flow-buy-package-04-success, flow-top-up-04-success, loading (web and @375) |
| NEW | جديد | t | container/pages/payment/paymentMethods.js:62 | all but error, flow-buy-package-02-checkout, flow-buy-package-04-success, flow-top-up-04-success, loading (web and @375) |
| Order Summary | ملخص الطلب | t | components/prop-shop/Ordersummary.js:119 | all but error, flow-buy-package-04-success, flow-top-up-04-success, loading (web and @375) |
| Credits | نقطة · also أرصدة | t | components/prop-shop/Ordersummary.js:155 | all but error, flow-ad-license-04-review-and-pay, flow-ad-license-05-success, flow-buy-package-02-checkout +3 more (web and @375) |
| (1,000) ⟨({n})⟩ ×2 | value | data | components/prop-shop/Ordersummary.js:160 | all but error, flow-ad-license-04-review-and-pay, flow-ad-license-05-success, flow-buy-package-04-success, flow-top-up-04-success, loading (web and @375) |
| [riyal] 2,500.00 ⟨[riyal]{n}⟩ ×5 | value | data | components/common/number/number.js:107 | all but error, flow-buy-package-04-success, flow-top-up-04-success, loading (web and @375) |
| Discount: | خصم | t | components/prop-shop/Ordersummary.js:223 | all but error, flow-ad-license-04-review-and-pay, flow-ad-license-05-success, flow-buy-package-04-success, flow-top-up-04-success, loading (web and @375) |
| -[riyal] 250.00 ⟨-[riyal]{n}⟩ ×2 | value | data | components/common/number/number.js:107 | all but error, flow-ad-license-04-review-and-pay, flow-ad-license-05-success, flow-buy-package-04-success, flow-top-up-04-success, loading (web and @375) |
| Total Payable: | المبلغ الاجمالي | t | components/prop-shop/Ordersummary.js:250 | all but error, flow-buy-package-04-success, flow-top-up-04-success, loading (web and @375) |
| © 2026 – All Rights Reserved ⟨© {n} – All Rights Reserved⟩ | {n} + كل الحقوق محفوظة | t+ | layout/withAdminLayout.js:477 | all |
| FEEDBACK | ملاحظاتك | t | components/feedback/FeedbackTab.js:98 | web: all but drawer-feedback, flow-ad-license-05-success, flow-buy-package-04-success, flow-top-up-04-success +4 more · @375: all but drawer-feedback, drawer-notifications-mark-all-as, drawer-profile-information-faisal-al-harbi, flow-ad-license-05-success +4 more |
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
| Error | خطأ! | t | components/common/heading/heading.js:10 | error (web and @375) |
| Something went wrong, please try again | حدث خطا ما. اعد المحاولة من فضلك | t | components/common/EmptyState/EmptyState.js:149 | error (web and @375) |
| Retry | اعادة المحاولة | t | components/common/button/button.js:40 | error (web and @375) |
| Ad License Sell | not in translations | code | components/prop-shop/Ordersummary.js:77 | flow-ad-license-04-review-and-pay, flow-ad-license-05-success (web and @375) |
| Ad License request submitted successfully! | تم تقديم طلب ترخيص الإعلان بنجاح | t | — | flow-ad-license-04-review-and-pay (web and @375) |
| Your request has been submitted successfully | تم تقديم طلبك بنجاح | t | components/common/heading/heading.js:10 | flow-ad-license-05-success (web and @375) |
| Our agent will contact you for any additional information. We’ve also sent a confirmation message to your mobile number. | .سيتواصل معك أحد ممثلينا للحصول على أي معلومات إضافية. تم إرسال رسالة تأكيد إلى رقم هاتفك المحمول | t | components/common/text/text.js:8 | flow-ad-license-05-success (web and @375) |
| Request ID: | رقم الطلب | t | components/common/text/text.js:8 | flow-ad-license-05-success (web and @375) |
| 22031 ⟨{n}⟩ | value | data | components/checkout/adLicenseSuccessModal.js:62 | flow-ad-license-05-success (web and @375) |
| For any queries regarding your request, contact us at | لأي استفسارات بخصوص طلبك، يُرجى التواصل معنا عبر | t | components/common/text/text.js:8 | flow-ad-license-05-success (web and @375) |
| Call | اتصال | t | components/common/button/button.js:40 | flow-ad-license-05-success (web and @375) |
| Email | إيميل / البريد الإلكتروني · also إيميل | t | components/common/button/button.js:40 | flow-ad-license-05-success (web and @375) |
| WhatsApp | واتساب | t | components/common/button/button.js:40 | flow-ad-license-05-success (web and @375) |
| Go to Ad License Requests | الذهاب إلى طلبات الترخيص الإعلاني | t | components/common/button/button.js:40 | flow-ad-license-05-success (web and @375) |
| Titanium | fixture: fixtures/credits.mjs | data | components/prop-shop/Ordersummary.js:77 | flow-buy-package-02-checkout (web and @375) |
| Credits Purchased | تم إضافة الرصيد | t | components/common/heading/heading.js:10 | flow-buy-package-04-success, flow-top-up-04-success (web and @375) |
| Congratulations! You have purchased credits | تهانينا! لقد قمت بشراء الرصيد | t | components/success-modal/successModalContent.js:56 | flow-buy-package-04-success, flow-top-up-04-success (web and @375) |
| Go to Dashboard | الذهاب الى لوحة التحكم | t | components/common/button/button.js:40 | flow-buy-package-04-success, flow-top-up-04-success (web and @375) |
| Date of Birth | تاريخ الميلاد | t | components/common/Label/Label.js:9 | form-method-tabby, form-tabby-date-of-birth-filled, form-tabby-date-of-birth-open, form-tabby-date-of-birth-required, inline-tabby, message-tabby-unable-to-approve (web and @375) |
| Enter your date of birth | ادخل تاريخ ميلادك | t (placeholder) | components/common/dateSelect/DateSelect.js:33 | form-method-tabby, form-tabby-date-of-birth-filled, form-tabby-date-of-birth-open, form-tabby-date-of-birth-required, inline-tabby, message-tabby-unable-to-approve (web and @375) |
| Pay in 4. No interest, no fees. | قسّمها على 4. بدون أي فوائد، أو رسوم | t | components/checkout/tabby.js:188 | form-method-tabby, form-tabby-date-of-birth-filled, form-tabby-date-of-birth-open, form-tabby-date-of-birth-required, inline-tabby, message-tabby-unable-to-approve (web and @375) |
| Learn More | تعرف على المزيد | t | components/common/button/button.js:40 | form-method-tabby, form-tabby-date-of-birth-filled, form-tabby-date-of-birth-open, form-tabby-date-of-birth-required, inline-tabby, message-tabby-unable-to-approve (web and @375) |
| Use any card. | استخدم أي بطاقة. | t | components/checkout/tabby.js:199 | form-method-tabby, form-tabby-date-of-birth-filled, form-tabby-date-of-birth-open, form-tabby-date-of-birth-required, inline-tabby, message-tabby-unable-to-approve (web and @375) |
| 562.5 ⟨{n}⟩ | value | data | components/checkout/tabby.js:49 | form-method-tabby, form-tabby-date-of-birth-filled, form-tabby-date-of-birth-open, form-tabby-date-of-birth-required, inline-tabby, message-tabby-unable-to-approve (web and @375) |
| Today | اليوم | t | components/checkout/tabby.js:203 | form-method-tabby, form-tabby-date-of-birth-filled, form-tabby-date-of-birth-open, form-tabby-date-of-birth-required, inline-tabby, message-tabby-unable-to-approve (web and @375) |
| In 1 month | خلال شهر واحد | t | components/checkout/tabby.js:203 | form-method-tabby, form-tabby-date-of-birth-filled, form-tabby-date-of-birth-open, form-tabby-date-of-birth-required, inline-tabby, message-tabby-unable-to-approve (web and @375) |
| In 2 months | خلال شهرين | t | components/checkout/tabby.js:203 | form-method-tabby, form-tabby-date-of-birth-filled, form-tabby-date-of-birth-open, form-tabby-date-of-birth-required, inline-tabby, message-tabby-unable-to-approve (web and @375) |
| In 3 months | خلال 3 أشهر | t | components/checkout/tabby.js:203 | form-method-tabby, form-tabby-date-of-birth-filled, form-tabby-date-of-birth-open, form-tabby-date-of-birth-required, inline-tabby, message-tabby-unable-to-approve (web and @375) |
| Pay | ادفع | t | components/prop-shop/Ordersummary.js:276 | form-method-tabby, form-tabby-date-of-birth-filled, form-tabby-date-of-birth-open, form-tabby-date-of-birth-required, inline-tabby, message-tabby-unable-to-approve (web and @375) |
| Oct | not in translations | code | — | form-tabby-date-of-birth-open (web and @375) |
| 2026 ⟨{n}⟩ ×32 | value | data | — | form-tabby-date-of-birth-open (web and @375) |
| Su | value | data | — | form-tabby-date-of-birth-open (web and @375) |
| Mo | value | data | — | form-tabby-date-of-birth-open (web and @375) |
| Tu | value | data | — | form-tabby-date-of-birth-open (web and @375) |
| We | value | data | — | form-tabby-date-of-birth-open (web and @375) |
| Th | value | data | — | form-tabby-date-of-birth-open (web and @375) |
| Fr | value | data | — | form-tabby-date-of-birth-open (web and @375) |
| Sa | value | data | — | form-tabby-date-of-birth-open (web and @375) |
| Please select date of birth before proceeding | يرجى اختيار تاريخ الميلاد قبل المتابعة | t | — | form-tabby-date-of-birth-required (web and @375) |
| Your payment couldn't be processed. Please check with your bank or retry. | تعذّر معالجة عملية الدفع الخاصة بك. يُرجى التحقق من البنك أو إعادة المحاولة. | t | — | message-payment-could-not-process (web and @375) |
| Sorry, Tabby is unable to approve this purchase. Please use an alternative payment method for your order | نأسف، تابي غير قادرة على الموافقة على هذه العملية. الرجاء استخدام طريقة دفع أخرى. | t | — | message-tabby-unable-to-approve (web and @375) |
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
| Verification Required Before Purchase | التحقق مطلوب قبل إتمام الشراء | t | components/common/heading/heading.js:10 | modal-nafath-verification (web and @375) |
| To comply with local regulations, only Saudi nationals are eligible to purchase packages and credits on Bayut. | تماشيًا مع نظام الوساطة العقارية في المملكة العربية السعودية، يقتصر شراء الباقات والنقاط على بيوت فقط للوسطاء العقاريين السعوديين. | t | components/success-modal/successModalContent.js:56 | modal-nafath-verification (web and @375) |
| Verify Nafath | تحقق من النفاذ الوطني | t | components/common/button/button.js:40 | modal-nafath-verification (web and @375) |
| Credit Purchase not Permitted | نعتذر، لا يمكنك شراء النقاط | t | components/common/heading/heading.js:10 | modal-purchase-not-permitted (web and @375) |
| In compliance with the Real Estate Brokerage Law in Saudi Arabia, only licensed Saudi national real estate brokers are eligible to purchase packages and credits to post listings on the Bayut platform. | تماشيًا مع نظام الوساطة العقارية في المملكة العربية السعودية، يسمح فقط للوسطاء العقاريين السعوديين شراء الباقات والنقاط لنشر الإعلانات على منصة بيوت. | t | components/success-modal/successModalContent.js:56 | modal-purchase-not-permitted (web and @375) |
