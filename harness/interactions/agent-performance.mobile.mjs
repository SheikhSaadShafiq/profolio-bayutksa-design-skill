/**
 * The states of /agent-performance on a PHONE that the explorer does not
 * reach under the web's name, so data/design-kb.json can pair them.
 *
 * The web's drawer-feedback is the FEEDBACK tab at the right edge
 * (feedback/FeedbackTab.js, role=button, aria-label FEEDBACK). The explorer's
 * phone drawer-send-us-feedback-the is the same drawer reached by accident:
 * it tapped the “Filter by Badges” select's arrow (x 335-352), and scrolled
 * mid-screen that arrow lies under the FEEDBACK tab (341-375 × 292-439),
 * which took the tap.
 */
export default [
  {
    name: 'drawer-feedback',
    note: 'phone: the FEEDBACK tab at the right edge — “Send us feedback” (feedback/FeedbackDrawer.js), full-screen on a phone',
    do: async (p) => {
      await p.getByRole('button', { name: 'FEEDBACK' }).first().tap({ timeout: 8000 });
      await p.locator('.ant-drawer-content').first().waitFor({ state: 'visible', timeout: 10000 });
      await p.waitForTimeout(900);
    },
  },
];
