/**
 * The shell's states — compiled on EVERY page, not only the one the shell was
 * explored on. The rail, the header and its menus are the same on every
 * screen, and a prototype whose bell only rings on the dashboard is not a
 * prototype of the product.
 *
 * These are the shell states nothing else finds: the rail's expand button
 * (the rail ships collapsed at 60px — withAdminLayout.js opens with
 * useState(true)) and the Post a Listing menu. The ones harness/explore.mjs
 * found on the dashboard with shell: true (Download App, the notification
 * centre, the account menu, Help & Support) are added by scripts/compile.mjs
 * from data/states/dashboard.json.
 *
 * Selectors are by what the product names, not by position, so one list
 * works on every page.
 */
/* in the LIVE product DOM — classes are still antd's there */
const HEADER = '.ant-layout-header';

export default [
  {
    name: 'rail-expanded',
    note: 'the rail opened to its full width by its expand button (withAdminLayout.js:394, .sidebar-expand-btn)',
    /* photographed at viewport size: a full-page screenshot resizes the
       window, and the product collapses the rail on every resize
       (withAdminLayout.js updateDimensions → setCollapsed(true)) */
    shot: 'viewport',
    trigger: 'button.sidebar-expand-btn',
    do: async (p) => {
      await p.locator('button.sidebar-expand-btn').first().click({ timeout: 6000 });
      await p.waitForTimeout(900);
    },
  },
  {
    name: 'menu-post-a-listing',
    note: 'the Post a Listing menu in the header (post-listing-menu.js)',
    trigger: `${HEADER} button:has-text("Post a Listing")`,
    do: async (p) => {
      await p.locator('.ant-layout-header button', { hasText: 'Post a Listing' }).first().click({ timeout: 6000 });
      await p.waitForTimeout(900);
    },
  },
];
