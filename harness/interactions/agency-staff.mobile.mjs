/**
 * /agency-staff on a phone (agency-staff-mobile.js): the same forms as
 * agency-staff.mjs, reached the phone's way — each agent is a card whose
 * kebab opens Edit / Delete, Invite User is the fixed bar at the bottom and
 * opens a bottom sheet, and Delete asks in a bottom sheet too. Set Credits
 * Limit and Edit User are the same antd modals as on the web.
 *
 * One difference in what the product does: on a phone a delete ALWAYS says
 * "User Deleted Successfully" (agency-staff-mobile.js:93 does not await the
 * request, so a refusal is never seen) — so the phone has the saved toast
 * and no failed state, the opposite of the web.
 */
import { failing, holdLottie, holdToast, press, FAIL } from '../fixtures/forms.mjs';

const OPEN = '.ant-modal-wrap:not([style*="display: none"]) .ant-modal, .ant-drawer-open .ant-drawer-content';
const sheet = (p, text) => p.locator(OPEN, { hasText: text }).last();
const opened = async (p, text) => { const m = sheet(p, text); await m.waitFor({ state: 'visible', timeout: 10000 }); await p.waitForTimeout(800); return m; };
const button = (scope, name) => scope.getByRole('button', { name, exact: true }).first();
/* card 0 is Noura Al-Qahtani (the owner's card has no kebab) */
const cardAction = async (p, what) => {
  await press(p, p.locator('.ant-card .ant-dropdown-trigger').first());
  await press(p, p.locator('.ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu-item', { hasText: what }).first());
};

const INVITEE = '+966 50 661 3927';
const openInvite = async (p) => { await press(p, p.getByRole('button', { name: 'Invite User' }).last()); return opened(p, 'Enter the user number'); };
const toOtp = async (p) => {
  const m = await openInvite(p);
  await m.locator('input[type=tel]').fill(INVITEE);
  await press(p, button(m, 'Confirm'));
  return opened(p, 'OTP Verification');
};
const typeOtp = async (m, code = '4827') => { const b = m.locator('input[type=tel]'); for (let i = 0; i < 4; i++) await b.nth(i).fill(code[i]); };

const openCredits = async (p) => { await press(p, p.getByRole('button', { name: 'Set Credits Limit' }).first()); return opened(p, 'Set Credits Limit'); };
const LIMITS = { 88010241: '12000', 88010257: '6000', 88010263: '4000' };

const openEdit = async (p) => { await cardAction(p, 'Edit'); const m = await opened(p, 'Edit User'); await p.waitForTimeout(800); return m; };
const editUser = async (m) => {
  await m.locator('input[name="address"]').fill('Office 9, Najd Horizon Building, King Fahd Road, Al Olaya, Riyadh');
  await m.locator('input[name="nationalShortAddress"]').fill('RRKA7432');
  await m.locator('input[name="agentDescription"]').fill('Leasing specialist for apartments and floors in north Riyadh.');
};

export default [
  {
    name: 'form-invite-user-errors',
    note: 'the Invite User sheet confirmed with no number: "Please enter your number"',
    do: async (p) => { const m = await openInvite(p); await press(p, button(m, 'Confirm')); await m.getByText('Please enter your number').waitFor({ timeout: 8000 }); await p.waitForTimeout(500); },
  },
  {
    name: 'form-invite-user-filled',
    note: 'the Invite User sheet with a Saudi mobile number typed in',
    do: async (p) => { const m = await openInvite(p); await m.locator('input[type=tel]').fill(INVITEE); await p.evaluate(() => document.activeElement?.blur()); await p.waitForTimeout(500); },
  },
  {
    name: 'modal-invite-user-otp',
    note: 'the number confirmed: the OTP Verification sheet',
    do: async (p) => { await toOtp(p); },
  },
  {
    name: 'form-invite-user-otp-errors',
    note: 'a wrong code: "Incorrect OTP" under the boxes',
    do: async (p) => {
      const m = await toOtp(p);
      await typeOtp(m, '1111');
      await failing(p, async () => { await press(p, button(m, 'Continue')); await m.getByText('Incorrect OTP').waitFor({ timeout: 8000 }); });
      await p.waitForTimeout(500);
    },
  },
  {
    name: 'modal-invite-user-sent',
    note: 'the right code: "Invitation Sent", naming the invited agent',
    do: async (p) => {
      const m = await toOtp(p);
      await typeOtp(m);
      await press(p, button(m, 'Continue'));
      await opened(p, 'Invitation has been sent to');
      await p.waitForTimeout(400);
      await holdLottie(p);   /* its animation loops: stopped on its last frame */
      await p.waitForTimeout(300);
    },
  },
  {
    name: 'message-invite-user-saved',
    note: 'Done: the success toast',
    do: async (p) => {
      const m = await toOtp(p);
      await typeOtp(m);
      await press(p, button(m, 'Continue'));
      const sent = await opened(p, 'Invitation has been sent to');
      await press(p, button(sent, 'Done'));
      await holdToast(p, 'success');
    },
  },
  {
    name: 'message-invite-user-failed',
    mode: FAIL,
    note: 'the number refused by the API: its reason in an error toast over the sheet',
    do: async (p) => failing(p, async () => { const m = await openInvite(p); await m.locator('input[type=tel]').fill(INVITEE); await press(p, button(m, 'Confirm')); await holdToast(p, 'error'); }),
  },
  {
    name: 'form-credits-limit-errors',
    note: 'Apply with one limit above the agency\'s credits and one empty',
    do: async (p) => {
      const m = await openCredits(p);
      await m.locator('#quantity_88010241').fill('80000');
      await m.locator('#quantity_88010257').fill('');
      await press(p, button(m, 'Apply'));
      await m.locator('.ant-form-item-explain-error').nth(1).waitFor({ timeout: 8000 });
      await p.waitForTimeout(600);
    },
  },
  {
    name: 'form-credits-limit-filled',
    note: 'new limits typed for the three agents',
    do: async (p) => { const m = await openCredits(p); for (const [id, v] of Object.entries(LIMITS)) await m.locator(`#quantity_${id}`).fill(v); await p.evaluate(() => document.activeElement?.blur()); await p.waitForTimeout(600); },
  },
  {
    name: 'message-credits-limit-failed',
    mode: FAIL,
    note: 'Apply refused: the reason in an error toast, the modal still open',
    do: async (p) => failing(p, async () => { const m = await openCredits(p); for (const [id, v] of Object.entries(LIMITS)) await m.locator(`#quantity_${id}`).fill(v); await press(p, button(m, 'Apply')); await holdToast(p, 'error'); }),
  },
  {
    name: 'form-edit-user-errors',
    note: 'Edit User (the card\'s kebab → Edit) confirmed with no English title and a WhatsApp number too short',
    do: async (p) => {
      const m = await openEdit(p);
      await m.locator('input[name="name"]').fill('');
      await m.locator('input[type=tel]').nth(1).fill('+966 55 1');
      await press(p, button(m, 'Confirm'));
      await m.getByText('Please enter name').waitFor({ timeout: 8000 });
      await p.waitForTimeout(600);
    },
  },
  {
    name: 'form-edit-user-filled',
    note: 'Edit User with a new address, short address and description',
    do: async (p) => { const m = await openEdit(p); await editUser(m); await p.evaluate(() => document.activeElement?.blur()); await p.waitForTimeout(600); },
  },
  {
    name: 'message-edit-user-failed',
    mode: FAIL,
    note: 'Edit User confirmed and refused: the reason in an error toast, the modal still open',
    do: async (p) => failing(p, async () => { const m = await openEdit(p); await editUser(m); await press(p, button(m, 'Confirm')); await holdToast(p, 'error'); }),
  },
  {
    name: 'drawer-delete-user',
    note: 'the card\'s kebab → Delete: the "Delete User" bottom sheet',
    do: async (p) => { await cardAction(p, 'Delete'); await opened(p, 'The following User will be deleted'); },
  },
  {
    name: 'message-delete-user-saved',
    note: 'Delete confirmed: "User Deleted Successfully" (agency-staff-mobile.js:93)',
    do: async (p) => {
      await cardAction(p, 'Delete');
      const m = await opened(p, 'The following User will be deleted');
      await press(p, button(m, 'Confirm'));
      await holdToast(p, 'success');
    },
  },
];
