# Copy — the product's own strings

English beside Arabic, verbatim, from the product's translation files and code — one file per area. Use these exact words. These are the translation strings. A compiled render carries more shipped text (relative dates, date presets, API messages, hard-coded labels): see `copy/rendered/<page>.md` — every string each page's compiled files draw, with its Arabic, where it is drawn and whether it is a translation, code, or the fixture's data (`_shell.md`: the header and the rail). Before calling a string new, or claiming the product never says something, grep `copy/rendered/` (or `pages/`). Quote a render-only string with its file path, character for character. A string in neither is new copy, marked `data-pf-new-copy` and put to the designer in both languages.

**hidden by**: an area no compiled screen draws, and why — a KSA flag that switches it off, with the line that reads it (`FLAG=false`, `OBJ.SUB=false`, or `FLAG (not defined for KSA)`, which is false: its strings never show in KSA — never cite them as shipped), not in the KSA build (another tenant's), or no compiled screen draws it (reachable, not compiled). Blank: drawn.

| area | strings | file | hidden by |
|---|---|---|---|
| add-license | 1 | copy/add-license.md |  |
| agency-staff-header | 2 | copy/agency-staff-header.md |  |
| appBanner | 2 | copy/appBanner.md |  |
| auto-utilisation | 35 | copy/auto-utilisation.md | no compiled screen draws it |
| bookedUntilModal | 7 | copy/bookedUntilModal.md |  |
| buy-package-lead | 5 | copy/buy-package-lead.md | BUY_PACKAGE_LEAD_CAPTURE (not defined for KSA) — `tenant/common/components/prop-shop/offered-packages/offeredPackages.js:412` |
| charts | 2 | copy/charts.md |  |
| checkout | 44 | copy/checkout.md |  |
| cityLocationFilter | 2 | copy/cityLocationFilter.md |  |
| common-EmptyState | 4 | copy/common-EmptyState.md |  |
| common-banner | 1 | copy/common-banner.md |  |
| common-bayut-match-badge | 2 | copy/common-bayut-match-badge.md | no compiled screen draws it |
| common-captcha | 5 | copy/common-captcha.md | CAPTCHA_CONFIG.enableWithKCOtpEndpoints=false — `components/common/captcha/GoogleReCaptcha.js:56` |
| common-dateFilter | 1 | copy/common-dateFilter.md |  |
| common-datePicker | 2 | copy/common-datePicker.md |  |
| common-drawer | 3 | copy/common-drawer.md |  |
| common-filters | 6 | copy/common-filters.md |  |
| common-image-uploads | 3 | copy/common-image-uploads.md |  |
| common-infinite-scroll | 1 | copy/common-infinite-scroll.md |  |
| common-json-form | 1 | copy/common-json-form.md |  |
| common-listingActionPopover | 2 | copy/common-listingActionPopover.md |  |
| common-lite-no-data-modal | 1 | copy/common-lite-no-data-modal.md | no compiled screen draws it |
| common-modals | 2 | copy/common-modals.md |  |
| common-nationalDayModal | 6 | copy/common-nationalDayModal.md | no compiled screen draws it |
| common-range-inputs | 3 | copy/common-range-inputs.md | not in the KSA build |
| common-rangeSlide | 3 | copy/common-rangeSlide.md |  |
| common-sectionIntroModal | 1 | copy/common-sectionIntroModal.md | no compiled screen draws it |
| common-unitRangeSlider | 3 | copy/common-unitRangeSlider.md |  |
| common-unitSelect | 1 | copy/common-unitSelect.md |  |
| convert-to-agency | 5 | copy/convert-to-agency.md |  |
| credits-info | 2 | copy/credits-info.md |  |
| credits-usage | 5 | copy/credits-usage.md |  |
| delete-agency-user | 2 | copy/delete-agency-user.md |  |
| discount-tag | 2 | copy/discount-tag.md |  |
| feedback | 24 | copy/feedback.md |  |
| image-upload | 6 | copy/image-upload.md |  |
| inbox | 1 | copy/inbox.md | not in the KSA build |
| index | 102 | copy/index.md | — |
| invite-user | 10 | copy/invite-user.md |  |
| leads-management | 124 | copy/leads-management.md |  |
| license-card | 15 | copy/license-card.md |  |
| listing-card-container | 3 | copy/listing-card-container.md |  |
| listing-drawer | 24 | copy/listing-drawer.md |  |
| listing-health | 2 | copy/listing-health.md |  |
| locationFilter | 2 | copy/locationFilter.md |  |
| manager-info | 3 | copy/manager-info.md | no compiled screen draws it |
| mobile-number-verification | 2 | copy/mobile-number-verification.md |  |
| nafath-verification-modal | 3 | copy/nafath-verification-modal.md |  |
| notification-center | 2 | copy/notification-center.md |  |
| otp-verification-modal | 6 | copy/otp-verification-modal.md |  |
| page-ad-license | 2 | copy/page-ad-license.md |  |
| page-agancy-staff | 18 | copy/page-agancy-staff.md |  |
| page-agent-performance | 48 | copy/page-agent-performance.md |  |
| page-authentication | 10 | copy/page-authentication.md | no compiled screen draws it |
| page-auto-utilisation | 11 | copy/page-auto-utilisation.md | no compiled screen draws it |
| page-credits-calculator | 14 | copy/page-credits-calculator.md | no compiled screen draws it |
| page-credits-usage | 9 | copy/page-credits-usage.md |  |
| page-dashboard | 8 | copy/page-dashboard.md |  |
| page-email-leads | 3 | copy/page-email-leads.md | not in the KSA build |
| page-inbox | 12 | copy/page-inbox.md | not in the KSA build |
| page-invite-user | 5 | copy/page-invite-user.md |  |
| page-lms | 40 | copy/page-lms.md |  |
| page-payment | 9 | copy/page-payment.md |  |
| page-post-listing | 1 | copy/page-post-listing.md |  |
| page-quota-credits | 4 | copy/page-quota-credits.md | no compiled screen draws it |
| page-reports | 5 | copy/page-reports.md |  |
| page-user-settings | 47 | copy/page-user-settings.md |  |
| pitch-package-modal | 3 | copy/pitch-package-modal.md | no compiled screen draws it |
| post-listing-button | 1 | copy/post-listing-button.md |  |
| post-listing-menu | 12 | copy/post-listing-menu.md |  |
| post-listing | 47 | copy/post-listing.md |  |
| prop-shop | 20 | copy/prop-shop.md |  |
| render-if-loggedIn | 2 | copy/render-if-loggedIn.md | no compiled screen draws it |
| set-capping-limit | 4 | copy/set-capping-limit.md |  |
| set-credit-limit | 12 | copy/set-credit-limit.md |  |
| shell | 3 | copy/shell.md |  |
| table | 78 | copy/table.md |  |
| tenant-ad-license | 27 | copy/tenant-ad-license.md |  |
| tenant-credit-info-drawer | 7 | copy/tenant-credit-info-drawer.md |  |
| tenant-downloadAppModal | 2 | copy/tenant-downloadAppModal.md |  |
| tenant-email-leads | 4 | copy/tenant-email-leads.md | HIDE_INBOX=true — `tenant/common/routes/appRoutes.js:133` |
| tenant-header-component | 5 | copy/tenant-header-component.md |  |
| tenant-headerLink | 1 | copy/tenant-headerLink.md |  |
| tenant-helpAndSupport | 5 | copy/tenant-helpAndSupport.md |  |
| tenant-inbox | 12 | copy/tenant-inbox.md | not in the KSA build |
| tenant-layout | 53 | copy/tenant-layout.md |  |
| tenant-listing | 121 | copy/tenant-listing.md |  |
| tenant-manage-quota | 7 | copy/tenant-manage-quota.md | not in the KSA build |
| tenant-page-alerts | 2 | copy/tenant-page-alerts.md | no compiled screen draws it |
| tenant-post-listing | 221 | copy/tenant-post-listing.md |  |
| tenant-preference | 16 | copy/tenant-preference.md |  |
| tenant-profile-completion | 24 | copy/tenant-profile-completion.md |  |
| tenant-profile | 5 | copy/tenant-profile.md | no compiled screen draws it |
| tenant-prop-shop | 58 | copy/tenant-prop-shop.md |  |
| tenant-report-unwanted-contact | 27 | copy/tenant-report-unwanted-contact.md | no compiled screen draws it |
| tenant-reports | 12 | copy/tenant-reports.md |  |
| tenant-smart-credits-utilisation | 5 | copy/tenant-smart-credits-utilisation.md |  |
| tenant-upgrade-listing | 49 | copy/tenant-upgrade-listing.md |  |
| tru-broker | 24 | copy/tru-broker.md |  |
| trucheckmodal | 14 | copy/trucheckmodal.md |  |
| utilities | 6 | copy/utilities.md |  |
| widgets | 24 | copy/widgets.md |  |

Rendered: `copy/rendered/ad-license.md` · `copy/rendered/agency-staff.md` · `copy/rendered/agent-performance.md` · `copy/rendered/checkout.md` · `copy/rendered/credits-usage.md` · `copy/rendered/dashboard.md` · `copy/rendered/invite.md` · `copy/rendered/listings.md` · `copy/rendered/listings-new.md` · `copy/rendered/lms-leads.md` · `copy/rendered/maintenance.md` · `copy/rendered/packages.md` · `copy/rendered/post-ad.md` · `copy/rendered/post-listing.md` · `copy/rendered/post-listing-edit.md` · `copy/rendered/post-listing-upgrade.md` · `copy/rendered/process-payment.md` · `copy/rendered/reports-leads-reports.md` · `copy/rendered/reports-listing-report.md` · `copy/rendered/reports-summary.md` · `copy/rendered/user-settings-agency-profile.md` · `copy/rendered/user-settings-change-password.md` · `copy/rendered/user-settings-licenses.md` · `copy/rendered/user-settings-preferences.md` · `copy/rendered/user-settings-user-profile.md`
