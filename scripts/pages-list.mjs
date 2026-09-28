/**
 * The eleven pages the design system is compiled from — slug → product route.
 * One list, imported by scripts/compile.mjs and harness/explore.mjs, so a page
 * added here is explored, compiled and scored everywhere at once.
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
