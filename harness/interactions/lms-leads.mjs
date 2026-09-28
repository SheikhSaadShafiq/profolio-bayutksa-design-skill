/**
 * The states of /lms/leads that no click reaches.
 *
 * The walkthrough is the product's own antd Tour over the leads table — a
 * returning user never sees it, so harness/page.mjs dismisses every tour by
 * default, and this state asks for the management one back (see the
 * tapTargets note there). The real account's screen with it open is
 * data/live/lms-leads--tour.real.capture.json.
 */
/** click row 0 — the row's own onClick opens LeadDetailDrawer (lead-listings.js,
    onRow). The first cell is clicked at its centre, which is empty cell space,
    not the name's hover popover. Waits for the drawer AND for its
    Interactions table to have rows, so the capture is not the skeleton. */
const openLeadDrawer = async (p) => {
  await p.locator('tbody tr:not(.ant-table-measure-row) td').first().click({ timeout: 8000 });
  await p.waitForSelector('.ant-drawer-content', { timeout: 8000 });
  await p.waitForSelector('.ant-drawer-content .ant-table-row', { timeout: 8000 });
  await p.waitForTimeout(600);
};

export default [
  {
    name: 'tour',
    note: 'first visit: the antd Tour over the leads table (useGetTourStepsForLms.js, section "management")',
    do: async (p) => {
      await p.evaluate(() => sessionStorage.setItem('pf-harness-tour', 'management'));
      await p.reload({ waitUntil: 'domcontentloaded' });
      await p.waitForSelector('.ant-tour', { timeout: 20000 });
      await p.waitForTimeout(1200);
      await p.evaluate(() => sessionStorage.removeItem('pf-harness-tour'));
    },
  },
  {
    name: 'drawer-lead-detail',
    note: 'row 0 clicked → LeadDetailDrawer on its Interactions tab (/lms/leads/:id + /lms/interests)',
    do: openLeadDrawer,
  },
  {
    name: 'drawer-lead-tasks',
    note: 'the same drawer on its second tab, All Tasks (/lms/tasks) — lead 0 carries one pending and one done task',
    do: async (p) => {
      await openLeadDrawer(p);
      await p.locator('.ant-drawer-content .ant-tabs-tab').nth(1).click({ timeout: 8000 });
      /* the Interactions rows are still mounted while /lms/tasks is in flight,
         so wait for the tab to be active, the spinner gone and a row again */
      await p.waitForSelector('.ant-drawer-content .ant-tabs-tab:nth-child(2).ant-tabs-tab-active', { timeout: 8000 }).catch(() => {});
      await p.waitForFunction(() => !document.querySelector('.ant-drawer-content .ant-spin-spinning'), null, { timeout: 8000 }).catch(() => {});
      await p.waitForSelector('.ant-drawer-content .ant-table-row', { timeout: 8000 });
      await p.waitForTimeout(600);
    },
  },
];
