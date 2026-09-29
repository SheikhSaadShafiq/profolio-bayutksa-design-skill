/**
 * /lms/leads on a phone (lead-listings-mobile.js): the forms of
 * lms-leads.mjs, reached the phone's way. The leads are cards; "Add New
 * Lead" sits beside the title; a lead's drawer opens from its card's "View
 * Detail" (or "Add Name" on the unnamed one); there is no Add Task on the
 * list — it is the lead drawer's full-width footer button — and every drawer
 * is a full-screen sheet. What each submission does is the web's.
 */
import { failing, holdToast, press, FAIL, LEAD_DUPLICATE } from '../fixtures/forms.mjs';
import { DRAWER, openedDrawer, btn, blur, errorsAtLeast, openAddLead, fillLead, fillTask, nameIt, tick } from './lms-leads.mjs';

/* card i's "View Detail" → the lead drawer */
const openLead = async (p, i) => {
  await press(p, p.getByText('View Detail', { exact: true }).nth(i));
  await p.waitForSelector(DRAWER, { timeout: 10000 });
  await p.waitForFunction(() => !document.querySelector('.ant-drawer-open .ant-spin-spinning, .ant-drawer-open .ant-skeleton-active'), null, { timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(800);
  return p.locator(DRAWER).last();
};
/* lead 1's drawer → its footer's Add Task */
const openAddTask = async (p) => {
  const lead = await openLead(p, 1);
  await press(p, btn(lead, 'Add Task'));
  const d = await openedDrawer(p, 'Add Task');
  await p.waitForFunction(() => !document.querySelector('.ant-drawer-open .ant-select-loading'), null, { timeout: 8000 }).catch(() => {});
  return d;
};
/* the unnamed lead's card offers "Add Name", which opens its drawer */
const openUnnamed = async (p) => {
  await press(p, p.getByText('Add Name', { exact: true }).first());
  await p.waitForSelector(`${DRAWER} input[placeholder="Add Name"]`, { timeout: 10000 });
  await p.waitForTimeout(700);
  return p.locator(DRAWER).last();
};
const openAddInterest = async (p) => {
  const lead = await openLead(p, 0);
  await press(p, lead.getByText('Add Interest Manually').first());
  return openedDrawer(p, 'Add Interest Manually');
};

export default [
  {
    name: 'form-add-lead-errors',
    note: 'Add Lead on the empty sheet, with an email that is not one: the fields\' own messages',
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
    note: 'Add New Lead with a name, mobile, WhatsApp and email typed in',
    do: async (p) => { const d = await openAddLead(p); await fillLead(d); await blur(p); await p.waitForTimeout(500); },
  },
  {
    name: 'message-add-lead-saved',
    note: 'Add Lead: the API\'s message as a toast, the sheet closed',
    do: async (p) => { const d = await openAddLead(p); await fillLead(d); await press(p, btn(d, 'Add Lead')); await holdToast(p, 'success'); },
  },
  {
    name: 'message-add-lead-failed',
    mode: FAIL,
    note: 'Add Lead refused: the reason in an error toast, the sheet still open',
    do: async (p) => failing(p, async () => { const d = await openAddLead(p); await fillLead(d); await press(p, btn(d, 'Add Lead')); await holdToast(p, 'error'); }),
  },
  {
    name: 'form-add-lead-duplicate',
    mode: LEAD_DUPLICATE,
    note: 'a phone that already belongs to a lead: the sheet\'s own "This lead already exists…" notice',
    do: async (p) => failing(p, async () => {
      const d = await openAddLead(p);
      await fillLead(d);
      await press(p, btn(d, 'Add Lead'));
      await d.getByText('already exists', { exact: false }).first().waitFor({ timeout: 8000 });
      await p.waitForTimeout(600);
    }, { mode: LEAD_DUPLICATE }),
  },
  {
    name: 'form-add-task-errors',
    note: 'lead 1 → Add Task on the empty sheet: each field says it is required',
    do: async (p) => { const d = await openAddTask(p); await press(p, btn(d, 'Add Task')); await errorsAtLeast(p, 4); await p.waitForTimeout(600); },
  },
  {
    name: 'form-add-task-filled',
    note: 'Add Task filled in: a viewing done today with a receipt, its listing, a follow-up call planned, a note',
    do: async (p) => { const d = await openAddTask(p); await fillTask(p, d); },
  },
  {
    name: 'message-add-task-saved',
    note: 'Add Task: the API\'s message as a toast',
    do: async (p) => { const d = await openAddTask(p); await fillTask(p, d, { attach: false }); await press(p, btn(d, 'Add Task')); await holdToast(p, 'success'); },
  },
  {
    name: 'message-add-task-failed',
    mode: FAIL,
    note: 'Add Task refused: the reason in an error toast',
    do: async (p) => failing(p, async () => { const d = await openAddTask(p); await fillTask(p, d, { attach: false }); await press(p, btn(d, 'Add Task')); await holdToast(p, 'error'); }),
  },
  {
    name: 'form-lead-name-filled',
    note: 'the unnamed lead\'s sheet with a name typed into "Add Name"',
    do: async (p) => { const d = await openUnnamed(p); await nameIt(p, d); },
  },
  {
    name: 'message-lead-name-saved',
    note: 'the tick: "Name Updated Successfully!"',
    do: async (p) => { const d = await openUnnamed(p); await nameIt(p, d); await press(p, tick(d)); await holdToast(p, 'success'); },
  },
  {
    name: 'message-lead-name-failed',
    mode: FAIL,
    note: 'the tick, refused: the reason in an error toast',
    do: async (p) => failing(p, async () => { const d = await openUnnamed(p); await nameIt(p, d); await press(p, tick(d)); await holdToast(p, 'error'); }),
  },
  {
    name: 'drawer-add-interest',
    note: 'lead 0\'s sheet → "Add Interest Manually": the listing picker, one listing ticked',
    do: async (p) => { const d = await openAddInterest(p); await press(p, d.locator('.ant-checkbox-wrapper').first()); await p.waitForTimeout(500); },
  },
  {
    name: 'message-add-interest-saved',
    note: 'Add Interest: "Interest added successfully"',
    do: async (p) => { const d = await openAddInterest(p); await press(p, d.locator('.ant-checkbox-wrapper').first()); await press(p, btn(d, 'Add Interest')); await holdToast(p, 'success'); },
  },
  {
    name: 'message-add-interest-failed',
    mode: FAIL,
    note: 'Add Interest refused: the reason in an error toast',
    do: async (p) => failing(p, async () => { const d = await openAddInterest(p); await press(p, d.locator('.ant-checkbox-wrapper').first()); await press(p, btn(d, 'Add Interest')); await holdToast(p, 'error'); }),
  },
];
