/**
 * /maintenance — no states.
 *
 * A bare public page outside the signed-in shell (appRoutes.js:261
 * publicRoutes, container/pages/Maintenance.js): the Profolio KSA logo, the
 * maintenance art (/profolio-assets/images/maintenance.svg), "We are under
 * scheduled maintenance." and one line under it. No control, no API call, no
 * flag that turns it on or off in the product — the switch is the
 * infrastructure's. harness/explore.mjs finds nothing to try on it, web or
 * phone.
 *
 * Compile it WITHOUT --states: scripts/compile.mjs adds the shell's states
 * (_shell.mjs, _mobile.mjs, _accounts.mjs, …) to every page, and each waits
 * for the shell's .ant-layout, which this page does not have.
 */
export default [];
