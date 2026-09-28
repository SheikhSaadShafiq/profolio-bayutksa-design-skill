/**
 * The dashboard states no click reaches.
 *
 * The rest of the dashboard's states — the shell's menus and modals, the
 * performance tabs, the date picker — are found by harness/explore.mjs and
 * listed in data/states/dashboard.json.
 */
export default [
  {
    name: 'modal-profile-completed',
    note: 'the once-only "Profile Completed" congratulations modal, when the score first reaches 100 (withAdminLayout.js:106-126)',
    do: async (p) => {
      await p.evaluate(() => sessionStorage.setItem('pf-harness-congrats', '1'));
      await p.reload({ waitUntil: 'domcontentloaded' });
      await p.waitForSelector('.ant-modal', { timeout: 20000 });
      await p.waitForTimeout(1000);
      await p.evaluate(() => sessionStorage.removeItem('pf-harness-congrats'));
    },
  },
];
