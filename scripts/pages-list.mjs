/**
 * The pages the design system is compiled from — slug → product route.
 * One list, imported by scripts/compile.mjs, harness/explore.mjs and
 * scripts/ds/*, so a page added here is explored, compiled and scored
 * everywhere at once.
 *
 * PAGES are the eleven the pixel-perfect pass was about. EXTRA are the rest of
 * the screens the rail and the settings nav lead to, compiled so the
 * prototype has somewhere to land on every click. /user-settings/preferences
 * is left out on purpose: the product crashes rendering it for an account
 * without a profile photo (common/transformers/user.js:35), so a compiled
 * copy would be a picture of a bug.
 */
export const PAGES = {
  'dashboard': '/dashboard',
  'listings': '/listings',
  'credits-usage': '/credits-usage',
  'ad-license': '/ad-license',
  'lms-leads': '/lms/leads',
  'reports-summary': '/reports/summary',
  'reports-listing-report': '/reports/listing-report',
  'reports-leads-reports': '/reports/leads-reports',
  'user-settings-user-profile': '/user-settings/user-profile',
  'user-settings-agency-profile': '/user-settings/agency-profile',
  'user-settings-change-password': '/user-settings/change-password',
};
export const EXTRA = {
  'agency-staff': '/agency-staff',
  'agent-performance': '/agent-performance',
  'packages': '/packages',
  'post-listing': '/post-listing',
  'user-settings-licenses': '/user-settings/licenses',
};
export const ALL = { ...PAGES, ...EXTRA };
