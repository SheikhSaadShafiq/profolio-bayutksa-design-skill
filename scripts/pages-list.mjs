/**
 * The pages the design system is compiled from — slug → product route.
 * One list, imported by scripts/compile.mjs, harness/explore.mjs and
 * scripts/ds/*, so a page added here is explored, compiled and scored
 * everywhere at once.
 *
 * PAGES are the eleven the pixel-perfect pass was about. EXTRA are the rest of
 * the screens the rail and the settings nav lead to, compiled so the
 * prototype has somewhere to land on every click. MORE, below, are the rest
 * of the KSA routes.
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
/* MORE are the KSA routes a PRD can land on that the first passes did not
   compile — each live for Bayut KSA by its own flags (routes whose flags
   switch them off for KSA — inbox, bank-detail, event-checkout — and the
   retired LMS dashboards, which redirect to /lms/leads, are not here).
   /user-settings/preferences crashes the product for an account without a
   photo (common/transformers/user.js:35 reads profile_image.sizes unguarded):
   on that route only, the fixture answers an image record whose sizes are
   empty (harness/fixtures/profile.mjs NO_PHOTO), which renders the same. */
export const MORE = {
  'post-listing-edit': '/post-listing/88240117',
  'post-listing-upgrade': '/post-listing/88241126/upgrade',
  'post-ad': '/post-ad/88241127',
  'checkout': '/checkout?cart_id=4410231',
  'process-payment': '/content/process-payment',
  'invite': '/invite?token=b6f1e2c4-7a39-4d85-9e0f-3c2a8d71f5b4',
  'maintenance': '/maintenance',
  'user-settings-preferences': '/user-settings/preferences',
};
export const ALL = { ...PAGES, ...EXTRA, ...MORE };
