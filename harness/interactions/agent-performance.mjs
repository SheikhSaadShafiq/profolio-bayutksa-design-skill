/**
 * The agent-performance states no click reaches.
 *
 * The TruPoints drawer, the leaderboard and the "how to earn" modal are found
 * by harness/explore.mjs (data/states/agent-performance.json).
 */
export default [
  {
    name: 'modal-quality-lister',
    devices: ['web', 'mobile'],
    note: 'the once-only congratulations modal a Quality Lister sees the first time the badge is unlocked (localStorage qualityListerShown_<id>)',
    do: async (p) => {
      await p.evaluate(() => sessionStorage.setItem('pf-harness-quality', '1'));
      await p.reload({ waitUntil: 'domcontentloaded' });
      await p.waitForSelector('.ant-modal, .ant-drawer-content', { timeout: 20000 });  /* a phone shows it as a drawer */
      await p.waitForTimeout(1000);
      await p.evaluate(() => sessionStorage.removeItem('pf-harness-quality'));
    },
  },
];
