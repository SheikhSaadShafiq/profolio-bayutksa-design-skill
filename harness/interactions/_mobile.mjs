/**
 * The RESPONSIVE shell's states — compiled on every page at mobile
 * (scripts/compile.mjs --device mobile), in place of the web shell's.
 *
 * On a phone the rail is not a rail: it is a drawer the header's menu button
 * opens (the real staff account's mobile screens: data/live/*--mobile.real-b).
 * The header's own popovers — the bell, the account — are found by
 * harness/explore.mjs --device mobile on the dashboard.
 *
 * Selectors are the LIVE product DOM's (antd class names).
 */
export default [
  {
    name: 'mobile-menu',
    note: 'the navigation drawer the header menu button opens on a phone',
    devices: ['mobile'],
    shot: 'viewport',
    trigger: '.ant-layout-header button.ant-btn-link >> nth=0',
    do: async (p) => {
      await p.locator('.ant-layout-header button.ant-btn-link').first().tap({ timeout: 6000 });   /* a phone is tapped */
      await p.waitForTimeout(900);
    },
  },
];
