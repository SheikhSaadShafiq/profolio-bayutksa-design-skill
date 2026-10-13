# Copy — the product's own strings

English beside Arabic, verbatim, from the product's translation files and code — every area in `copy/areas.md`, one section each: read an area's lines (below), or grep the file — each row starts with its area. Use these exact words. These are the translation strings. A compiled render carries more shipped text (relative dates, date presets, API messages, hard-coded labels): see `copy/rendered/<page>.md` — every string each page's compiled files draw, with its Arabic, where it is drawn and whether it is a translation, code, or the fixture's data (`_shell.md`: the header and the rail). Before calling a string new, or claiming the product never says something, grep `copy/rendered/` (or `pages/`). Quote a render-only string with its file path, character for character. A string in neither is new copy, marked `data-pf-new-copy` and put to the designer in both languages.

**hidden by**: an area no compiled screen draws, and why — a KSA flag that switches it off, with the line that reads it (`FLAG=false`, `OBJ.SUB=false`, or `FLAG (not defined for KSA)`, which is false: its strings never show in KSA — never cite them as shipped), not in the KSA build (another tenant's), or no compiled screen draws it (reachable, not compiled). Blank: drawn.

| area | strings | lines in copy/areas.md | hidden by |
|---|---|---|---|
| add-license | 1 | 9–13 |  |
| agency-staff-header | 2 | 15–20 |  |
| appBanner | 2 | 22–27 |  |
| auto-utilisation | 35 | 29–67 | no compiled screen draws it |
| bookedUntilModal | 7 | 69–79 |  |
| buy-package-lead | 5 | 81–89 | BUY_PACKAGE_LEAD_CAPTURE (not defined for KSA) — `tenant/common/components/prop-shop/offered-packages/offeredPackages.js:412` |
| charts | 2 | 91–96 |  |
| checkout | 44 | 98–145 |  |
| cityLocationFilter | 2 | 147–152 |  |
| common-EmptyState | 4 | 154–161 |  |
| common-banner | 1 | 163–167 |  |
| common-bayut-match-badge | 2 | 169–174 | no compiled screen draws it |
| common-captcha | 5 | 176–184 | CAPTCHA_CONFIG.enableWithKCOtpEndpoints=false — `components/common/captcha/GoogleReCaptcha.js:56` |
| common-dateFilter | 1 | 186–190 |  |
| common-datePicker | 2 | 192–197 |  |
| common-drawer | 3 | 199–205 |  |
| common-filters | 6 | 207–216 |  |
| common-image-uploads | 3 | 218–224 |  |
| common-infinite-scroll | 1 | 226–230 |  |
| common-json-form | 1 | 232–236 |  |
| common-listingActionPopover | 2 | 238–243 |  |
| common-lite-no-data-modal | 1 | 245–249 | no compiled screen draws it |
| common-modals | 2 | 251–256 |  |
| common-nationalDayModal | 6 | 258–267 | no compiled screen draws it |
| common-range-inputs | 3 | 269–275 | not in the KSA build |
| common-rangeSlide | 3 | 277–283 |  |
| common-sectionIntroModal | 1 | 285–289 | no compiled screen draws it |
| common-unitRangeSlider | 3 | 291–297 |  |
| common-unitSelect | 1 | 299–303 |  |
| convert-to-agency | 5 | 305–313 |  |
| credits-info | 2 | 315–320 |  |
| credits-usage | 5 | 322–330 |  |
| delete-agency-user | 2 | 332–337 |  |
| discount-tag | 2 | 339–344 |  |
| feedback | 24 | 346–373 |  |
| image-upload | 6 | 375–384 |  |
| inbox | 1 | 386–390 | not in the KSA build |
| invite-user | 10 | 392–405 |  |
| leads-management | 124 | 407–534 |  |
| license-card | 15 | 536–554 |  |
| listing-card-container | 3 | 556–562 |  |
| listing-drawer | 24 | 564–591 |  |
| listing-health | 2 | 593–598 |  |
| locationFilter | 2 | 600–605 |  |
| manager-info | 3 | 607–613 | no compiled screen draws it |
| mobile-number-verification | 2 | 615–620 |  |
| nafath-verification-modal | 3 | 622–628 |  |
| notification-center | 2 | 630–635 |  |
| otp-verification-modal | 6 | 637–646 |  |
| page-ad-license | 2 | 648–653 |  |
| page-agancy-staff | 18 | 655–676 |  |
| page-agent-performance | 48 | 678–729 |  |
| page-authentication | 10 | 731–744 | no compiled screen draws it |
| page-auto-utilisation | 11 | 746–760 | no compiled screen draws it |
| page-credits-calculator | 14 | 762–779 | no compiled screen draws it |
| page-credits-usage | 9 | 781–793 |  |
| page-dashboard | 8 | 795–806 |  |
| page-email-leads | 3 | 808–814 | not in the KSA build |
| page-inbox | 12 | 816–831 | not in the KSA build |
| page-invite-user | 5 | 833–841 |  |
| page-lms | 40 | 843–886 |  |
| page-payment | 9 | 888–900 |  |
| page-post-listing | 1 | 902–906 |  |
| page-quota-credits | 4 | 908–915 | no compiled screen draws it |
| page-reports | 5 | 917–925 |  |
| page-user-settings | 47 | 927–977 |  |
| pitch-package-modal | 3 | 979–985 | no compiled screen draws it |
| post-listing-button | 1 | 987–991 |  |
| post-listing-menu | 12 | 993–1008 |  |
| post-listing | 47 | 1010–1060 |  |
| prop-shop | 20 | 1062–1085 |  |
| render-if-loggedIn | 2 | 1087–1092 | no compiled screen draws it |
| set-capping-limit | 4 | 1094–1101 |  |
| set-credit-limit | 12 | 1103–1118 |  |
| shell | 3 | 1120–1126 |  |
| table | 78 | 1128–1209 |  |
| tenant-ad-license | 27 | 1211–1241 |  |
| tenant-credit-info-drawer | 7 | 1243–1253 |  |
| tenant-downloadAppModal | 2 | 1255–1260 |  |
| tenant-email-leads | 4 | 1262–1269 | HIDE_INBOX=true — `tenant/common/routes/appRoutes.js:133` |
| tenant-header-component | 5 | 1271–1279 |  |
| tenant-headerLink | 1 | 1281–1285 |  |
| tenant-helpAndSupport | 5 | 1287–1295 |  |
| tenant-inbox | 12 | 1297–1312 | not in the KSA build |
| tenant-layout | 53 | 1314–1370 |  |
| tenant-listing | 121 | 1372–1496 |  |
| tenant-manage-quota | 7 | 1498–1508 | not in the KSA build |
| tenant-page-alerts | 2 | 1510–1515 | no compiled screen draws it |
| tenant-post-listing | 221 | 1517–1741 |  |
| tenant-preference | 16 | 1743–1762 |  |
| tenant-profile-completion | 24 | 1764–1791 |  |
| tenant-profile | 5 | 1793–1801 | no compiled screen draws it |
| tenant-prop-shop | 58 | 1803–1864 |  |
| tenant-report-unwanted-contact | 27 | 1866–1896 | no compiled screen draws it |
| tenant-reports | 12 | 1898–1913 |  |
| tenant-smart-credits-utilisation | 5 | 1915–1923 |  |
| tenant-upgrade-listing | 49 | 1925–1977 |  |
| tru-broker | 24 | 1979–2006 |  |
| trucheckmodal | 14 | 2008–2025 |  |
| utilities | 6 | 2027–2036 |  |
| widgets | 24 | 2038–2065 |  |

Rendered: `copy/rendered/ad-license.md` · `copy/rendered/agency-staff.md` · `copy/rendered/agent-performance.md` · `copy/rendered/checkout.md` · `copy/rendered/credits-usage.md` · `copy/rendered/dashboard.md` · `copy/rendered/invite.md` · `copy/rendered/listings.md` · `copy/rendered/listings-new.md` · `copy/rendered/lms-leads.md` · `copy/rendered/maintenance.md` · `copy/rendered/packages.md` · `copy/rendered/post-ad.md` · `copy/rendered/post-listing.md` · `copy/rendered/post-listing-edit.md` · `copy/rendered/post-listing-upgrade.md` · `copy/rendered/process-payment.md` · `copy/rendered/reports-leads-reports.md` · `copy/rendered/reports-listing-report.md` · `copy/rendered/reports-summary.md` · `copy/rendered/user-settings-agency-profile.md` · `copy/rendered/user-settings-change-password.md` · `copy/rendered/user-settings-licenses.md` · `copy/rendered/user-settings-preferences.md` · `copy/rendered/user-settings-user-profile.md`
