/**
 * The states of /lms/leads that no click reaches.
 *
 * The walkthrough is the product's own antd Tour over the leads table — a
 * returning user never sees it, so harness/page.mjs dismisses every tour by
 * default, and this state asks for the management one back (see the
 * tapTargets note there). The real account's screen with it open is
 * data/live/lms-leads--tour.real.capture.json.
 */
import { failing, holdToast, press, uploadHeadshot, receipt, FAIL, LEAD_DUPLICATE } from '../fixtures/forms.mjs';

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


/* ── the forms (harness/fixtures/forms.mjs answers every submission) ─────────
   (the helpers are exported for the phone's paths, lms-leads.mobile.mjs)
   Add New Lead   the filter bar's button → a drawer (add-lead-drawer.js):
                  Name and Phone Number required, WhatsApp and Email optional
                  but checked; Add Lead → POST lms/leads → the API's message as
                  a toast, the drawer closes. Refused: a toast; a phone that
                  already belongs to a lead: the drawer's own inline notice.
   Add Task       row 1's Add Task → a drawer (leads-add-task-drawer.js): the
                  completed step (type, sub-type, date, attachment, interest)
                  and the planned one (type, sub-type, due date), notes.
                  Add Task → POST lms/tasks → the API's message as a toast.
   Add Name       the unnamed lead (row 3)'s drawer: an input and a tick in
                  its header (lead-name.js) → PUT lms/leads/:id →
                  "Name Updated Successfully!".
   Add Interest   the lead drawer's "Add Interest Manually" → a listing picker
                  (add-interest-drawer.js) → POST lms/interests →
                  "Interest added successfully".
   The lead drawer has no notes of its own and nothing else to submit: notes
   and the one attachment belong to Add Task. */
export const DRAWER = '.ant-drawer-open .ant-drawer-content';
export const drawer = (p, title) => p.locator(DRAWER).filter({ has: p.locator('.ant-drawer-title', { hasText: title }) }).last();
export const openedDrawer = async (p, title) => { const d = drawer(p, title); await d.waitFor({ state: 'visible', timeout: 10000 }); await p.waitForTimeout(800); return d; };
export const btn = (scope, name) => scope.getByRole('button', { name, exact: true }).first();
export const blur = (p) => p.evaluate(() => document.activeElement && document.activeElement.blur());
export const errorsAtLeast = (p, n) => p.waitForFunction((k) => [...document.querySelectorAll('.ant-drawer-open .ant-drawer-content *')]
  .filter((e) => e.children.length === 0 && /(required|Please enter|Invalid format|valid email)/.test(e.textContent)).length >= k, n, { timeout: 8000 });

/* Add New Lead — invented person */
export const openAddLead = async (p) => { await press(p, p.getByRole('button', { name: 'Add New Lead' }).first()); return openedDrawer(p, 'Add New Lead'); };
export const fillLead = async (d) => {
  await d.locator('input[name="name"]').fill('Turki Al-Mutairi');
  await d.locator('input[type=tel]').nth(0).fill('+966 55 804 2716');
  await d.locator('input[type=tel]').nth(1).fill('+966 55 804 2716');
  await d.locator('input[name="email"]').fill('turki.mutairi@mail.example');
};

/* Add Task — row 1 (Khalid Al-Shammari, no task yet) */
const openAddTask = async (p) => {
  await press(p, p.locator('tbody tr:not(.ant-table-measure-row)').nth(1).locator('button', { hasText: 'Add Task' }).first());
  const d = await openedDrawer(p, 'Add Task');
  await p.waitForFunction(() => !document.querySelector('.ant-drawer-open .ant-select-loading, .ant-drawer-open .ant-spin-spinning'), null, { timeout: 8000 }).catch(() => {});
  return d;
};
export const choose = async (p, d, i, text) => {
  await press(p, d.locator('.ant-select').nth(i));
  await press(p, p.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option', { hasText: text }).first());
  await p.waitForTimeout(500);
};
/* a date in the picker's panel: today, or the next day that can be picked */
export const pickDate = async (p, d, i, { later = false } = {}) => {
  await press(p, d.locator('.ant-picker').nth(i));
  const panel = p.locator('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)').last();
  await panel.waitFor({ state: 'visible', timeout: 8000 });
  const open = panel.locator('td.ant-picker-cell-in-view:not(.ant-picker-cell-disabled)');
  const today = panel.locator('td.ant-picker-cell-today');
  const target = later && (await open.count()) > 1 ? open.nth(1) : today;
  await press(p, target);
  await press(p, panel.locator('.ant-picker-ok button').first());
  await p.waitForTimeout(400);
};
export const fillTask = async (p, d, { attach = true } = {}) => {
  await choose(p, d, 0, 'Meeting');
  await choose(p, d, 1, 'Property Viewing');
  await pickDate(p, d, 0);
  if (attach) {
    await uploadHeadshot(p, d.locator('.ant-upload input[type=file]').first(), { name: 'token-receipt.png', buffer: receipt() });
    await p.waitForFunction(() => !/Uploading\.\.\./.test(document.querySelector('.ant-drawer-open .ant-drawer-content')?.innerText || ''), null, { timeout: 15000 }).catch(() => {});
  }
  await press(p, btn(d, 'Add Interest'));
  const pick = await openedDrawer(p, 'Add Interest');
  await press(p, pick.locator('.ant-checkbox-wrapper').first());
  await pick.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
  await p.waitForTimeout(500);
  await choose(p, d, 2, 'Contact');
  await choose(p, d, 3, 'Follow-up Call');
  await pickDate(p, d, 1, { later: true });
  await d.locator('textarea[name="notes"]').fill('Viewed the floor with his family; token to be paid after the follow-up call.');
  await blur(p);
  await p.waitForTimeout(500);
};

/* Add Name — row 3 is the lead without one */
const openUnnamed = async (p) => {
  await p.locator('tbody tr:not(.ant-table-measure-row)').nth(3).locator('td').first().click({ timeout: 8000 });
  await p.waitForSelector(DRAWER, { timeout: 8000 });
  await p.waitForSelector(`${DRAWER} input[placeholder="Add Name"]`, { timeout: 8000 });
  await p.waitForTimeout(600);
  return p.locator(DRAWER).last();
};
export const nameIt = async (p, d) => { await d.locator('input[placeholder="Add Name"]').fill('Sara Al-Ghamdi'); await p.waitForTimeout(300); };
export const tick = (d) => d.locator('input[placeholder="Add Name"]').locator('xpath=ancestor::*[.//button][1]').locator('button').last();

/* Add Interest Manually — from lead 0's drawer */
const openAddInterest = async (p) => {
  await openLeadDrawer(p);
  await press(p, p.locator(DRAWER).last().getByText('Add Interest Manually').first());
  return openedDrawer(p, 'Add Interest Manually');
};

export default [
  {
    name: 'tour',
    devices: ['web', 'mobile'],
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
  /* ── Add New Lead ── */
  {
    name: 'form-add-lead-errors',
    note: 'Add Lead on the empty drawer, with an email that is not one: "Please enter name", "Please enter phone number", "Please enter a valid email" (add-lead-form-data.js)',
    do: async (p) => {
      const d = await openAddLead(p);
      await d.locator('input[name="email"]').fill('turki.mutairi@mail');
      await press(p, btn(d, 'Add Lead'));
      await errorsAtLeast(p, 3);
      await p.waitForTimeout(600);
    },
  },
  {
    name: 'form-add-lead-filled',
    note: 'Add New Lead with a name, mobile, WhatsApp and email typed in, not yet added',
    do: async (p) => { const d = await openAddLead(p); await fillLead(d); await blur(p); await p.waitForTimeout(500); },
  },
  {
    name: 'message-add-lead-saved',
    note: 'Add Lead: POST /api/surge/lms/leads → the API\'s message as a toast ("Lead added successfully"), the drawer closed and the table refetched',
    do: async (p) => { const d = await openAddLead(p); await fillLead(d); await press(p, btn(d, 'Add Lead')); await holdToast(p, 'success'); },
  },
  {
    name: 'message-add-lead-failed',
    mode: FAIL,
    note: 'Add Lead refused (422): the reason in an error toast, the drawer still open',
    do: async (p) => failing(p, async () => { const d = await openAddLead(p); await fillLead(d); await press(p, btn(d, 'Add Lead')); await holdToast(p, 'error'); }),
  },
  {
    name: 'form-add-lead-duplicate',
    mode: LEAD_DUPLICATE,
    note: 'Add Lead with a phone that already belongs to a lead: the drawer\'s own notice, "This lead already exists in your Lead Management System with ID … Please check the details here" (add-lead-drawer.js:84)',
    do: async (p) => failing(p, async () => {
      const d = await openAddLead(p);
      await fillLead(d);
      await press(p, btn(d, 'Add Lead'));
      await d.getByText('already exists', { exact: false }).first().waitFor({ timeout: 8000 });
      await p.waitForTimeout(600);
    }, { mode: LEAD_DUPLICATE }),
  },

  /* ── Add Task ── */
  {
    name: 'form-add-task-errors',
    note: 'Add Task on the empty drawer: each field of the completed and the planned step says it is required (leads-add-task-form-data.js)',
    do: async (p) => {
      const d = await openAddTask(p);
      await press(p, btn(d, 'Add Task'));
      await errorsAtLeast(p, 4);
      await p.waitForTimeout(600);
    },
  },
  {
    name: 'form-add-task-filled',
    note: 'Add Task filled in: a viewing done today with a receipt attached and the listing it was about, a follow-up call planned, and a note',
    do: async (p) => { const d = await openAddTask(p); await fillTask(p, d); },
  },
  {
    name: 'message-add-task-saved',
    note: 'Add Task: POST /api/surge/lms/tasks → the API\'s message as a toast ("Task added successfully"), the drawer closed',
    do: async (p) => { const d = await openAddTask(p); await fillTask(p, d, { attach: false }); await press(p, btn(d, 'Add Task')); await holdToast(p, 'success'); },
  },
  {
    name: 'message-add-task-failed',
    mode: FAIL,
    note: 'Add Task refused (422): the reason in an error toast, the drawer still open',
    do: async (p) => failing(p, async () => { const d = await openAddTask(p); await fillTask(p, d, { attach: false }); await press(p, btn(d, 'Add Task')); await holdToast(p, 'error'); }),
  },

  /* ── Add Name, in the lead drawer ── */
  {
    name: 'form-lead-name-filled',
    note: 'the unnamed lead\'s drawer with a name typed into its "Add Name" field',
    do: async (p) => { const d = await openUnnamed(p); await nameIt(p, d); },
  },
  {
    name: 'message-lead-name-saved',
    note: 'the tick: PUT /api/surge/lms/leads/:id → "Name Updated Successfully!" (lead-name.js)',
    do: async (p) => { const d = await openUnnamed(p); await nameIt(p, d); await press(p, tick(d)); await holdToast(p, 'success'); },
  },
  {
    name: 'message-lead-name-failed',
    mode: FAIL,
    note: 'the tick, refused (422): the reason in an error toast',
    do: async (p) => failing(p, async () => { const d = await openUnnamed(p); await nameIt(p, d); await press(p, tick(d)); await holdToast(p, 'error'); }),
  },

  /* ── Add Interest Manually, in the lead drawer ── */
  {
    name: 'drawer-add-interest',
    note: 'lead 0\'s drawer → "Add Interest Manually": the listing picker, one listing ticked',
    do: async (p) => { const d = await openAddInterest(p); await press(p, d.locator('.ant-checkbox-wrapper').first()); await p.waitForTimeout(500); },
  },
  {
    name: 'message-add-interest-saved',
    note: 'Add Interest: POST /api/surge/lms/interests → "Interest added successfully"',
    do: async (p) => { const d = await openAddInterest(p); await press(p, d.locator('.ant-checkbox-wrapper').first()); await press(p, btn(d, 'Add Interest')); await holdToast(p, 'success'); },
  },
  {
    name: 'message-add-interest-failed',
    mode: FAIL,
    note: 'Add Interest refused (422): the reason in an error toast',
    do: async (p) => failing(p, async () => { const d = await openAddInterest(p); await press(p, d.locator('.ant-checkbox-wrapper').first()); await press(p, btn(d, 'Add Interest')); await holdToast(p, 'error'); }),
  },
];
