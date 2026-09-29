/**
 * /agency-staff — the agency admin's staff screen, its forms (web layout;
 * the phone's own click paths are agency-staff.mobile.mjs).
 *
 * Every submission is answered by harness/fixtures/forms.mjs (refused in its
 * mode FAIL, delivered as a 422 by failing()). What the product does with
 * each answer, and so which states exist:
 *
 *   Invite User      a phone number → POST /otps → the OTP modal → POST
 *                    /otps/verify → "Invitation Sent" (the invited agent's
 *                    name) → Done → a success toast (inviteUser.js). Refused
 *                    at the number: a toast, the modal stays; refused at the
 *                    code with 'Invalid OTP code': "Incorrect OTP" inline.
 *   Set Credits      one limit per agent (antd Form validators,
 *   Limit            set-capping-limit.js); Apply → PATCH update_staff_cap.
 *                    Saved, the modal just closes — no toast, nothing on
 *                    screen changes — so there is no "saved" state; refused,
 *                    a toast over the open modal.
 *   Edit User        the agent's profile (AgencyUserForm.js) → PUT
 *                    update_staff. Saved: the modal closes, no toast — no
 *                    "saved" state; refused: a 7-second error toast.
 *   Delete User      the confirmation modal → DELETE remove_staff. Saved on
 *                    the web: the modal closes, no toast — no state; refused:
 *                    the reason in a red Alert inside the modal.
 *
 * Rows: 0 is the owner (no actions), 1 is Noura Al-Qahtani — every row step
 * here acts on her. (users/:id answers the owner's record for any id —
 * harness/fixtures/profile.mjs — so Edit User opens prefilled with his.)
 */
import { failing, holdLottie, holdToast, press, FAIL } from '../fixtures/forms.mjs';

const OPEN = '.ant-modal-wrap:not([style*="display: none"]) .ant-modal';
const modal = (p, title) => p.locator(OPEN).filter({ has: p.locator('.ant-modal-title', { hasText: title }) }).last();
const opened = async (p, title) => { const m = modal(p, title); await m.waitFor({ state: 'visible', timeout: 10000 }); await p.waitForTimeout(700); return m; };
const button = (scope, name) => scope.getByRole('button', { name, exact: true }).first();
const row = (p, i) => p.locator('tbody tr:not(.ant-table-measure-row)').nth(i);
/* the row's actions: Edit, then Delete (agency-user-actions.js) */
const rowAction = (p, i, k) => row(p, i).locator('button').nth(k);

/* ── Invite User ─────────────────────────────────────────────────────────── */
const INVITEE = '+966 50 661 3927';          /* invented: Majed Al-Anazi, forms.mjs */
const openInvite = async (p) => { await press(p, p.getByRole('button', { name: 'Invite User' }).first()); return opened(p, 'Invite User'); };
const toOtp = async (p) => {
  const m = await openInvite(p);
  await m.locator('input[type=tel]').fill(INVITEE);
  await press(p, button(m, 'Confirm'));
  return opened(p, 'OTP Verification');
};
const typeOtp = async (m, code = '4827') => {
  const boxes = m.locator('input[type=tel]');
  for (let i = 0; i < 4; i++) await boxes.nth(i).fill(code[i]);
};

/* ── Set Credits Limit ───────────────────────────────────────────────────── */
const openCredits = async (p) => { await press(p, p.getByRole('button', { name: 'Set Credits Limit' }).first()); return opened(p, 'Set Credits Limit'); };
/* the three agents' limits, invented: Noura, Abdullah, Reem */
const LIMITS = { 88010241: '12000', 88010257: '6000', 88010263: '4000' };
const fillLimits = async (m) => { for (const [id, v] of Object.entries(LIMITS)) await m.locator(`#quantity_${id}`).fill(v); };

/* ── Edit User ───────────────────────────────────────────────────────────── */
const openEdit = async (p) => { await press(p, rowAction(p, 1, 0)); const m = await opened(p, 'Edit User'); await p.waitForTimeout(800); return m; };
const editUser = async (m) => {
  await m.locator('input[name="address"]').fill('Office 9, Najd Horizon Building, King Fahd Road, Al Olaya, Riyadh');
  await m.locator('input[name="nationalShortAddress"]').fill('RRKA7432');
  await m.locator('input[name="agentDescription"]').fill('Leasing specialist for apartments and floors in north Riyadh.');
};

export default [
  /* Invite User */
  {
    name: 'form-invite-user-errors',
    note: 'Invite User confirmed with no number: "Please enter your number" (inviteUserToAgencyFormFields.js, phoneValidationYup)',
    do: async (p) => {
      const m = await openInvite(p);
      await press(p, button(m, 'Confirm'));
      await m.getByText('Please enter your number').waitFor({ timeout: 8000 });
      await p.waitForTimeout(500);
    },
  },
  {
    name: 'form-invite-user-filled',
    note: 'Invite User with a Saudi mobile number typed in, not yet confirmed',
    do: async (p) => { const m = await openInvite(p); await m.locator('input[type=tel]').fill(INVITEE); await p.waitForTimeout(500); },
  },
  {
    name: 'modal-invite-user-otp',
    note: 'the number confirmed (POST /api/surge/otps): the OTP Verification modal — four boxes, the 60-second resend timer, Continue',
    do: async (p) => { await toOtp(p); },
  },
  {
    name: 'form-invite-user-otp-errors',
    note: 'a wrong code: POST /otps/verify refused with "Invalid OTP code" → "Incorrect OTP" under the boxes (inviteUser.js:84)',
    do: async (p) => {
      const m = await toOtp(p);
      await typeOtp(m, '1111');
      await failing(p, async () => { await press(p, button(m, 'Continue')); await m.getByText('Incorrect OTP').waitFor({ timeout: 8000 }); });
      await p.waitForTimeout(500);
    },
  },
  {
    name: 'modal-invite-user-sent',
    note: 'the right code: POST /otps/verify → "Invitation Sent", naming the invited agent (inviteUser.js:229)',
    do: async (p) => {
      const m = await toOtp(p);
      await typeOtp(m);
      await press(p, button(m, 'Continue'));
      await p.locator(OPEN, { hasText: 'Invitation has been sent to' }).last().waitFor({ timeout: 10000 });
      await p.waitForTimeout(1200);
      await holdLottie(p);   /* its animation loops: stopped on its last frame */
      await p.waitForTimeout(300);
    },
  },
  {
    name: 'message-invite-user-saved',
    note: 'Done on "Invitation Sent": the success toast, "Invitation has been sent to … to join your agency. We will notify you once they accept it."',
    do: async (p) => {
      const m = await toOtp(p);
      await typeOtp(m);
      await press(p, button(m, 'Continue'));
      const sent = p.locator(OPEN, { hasText: 'Invitation has been sent to' }).last();
      await sent.waitFor({ timeout: 10000 });
      await press(p, button(sent, 'Done'));
      await holdToast(p, 'success');
    },
  },
  {
    name: 'message-invite-user-failed',
    mode: FAIL,
    note: 'the number refused by the API (POST /otps, 422): its reason in an error toast over the Invite User modal',
    do: async (p) => failing(p, async () => {
      const m = await openInvite(p);
      await m.locator('input[type=tel]').fill(INVITEE);
      await press(p, button(m, 'Confirm'));
      await holdToast(p, 'error');
    }),
  },

  /* Set Credits Limit */
  {
    name: 'form-credits-limit-errors',
    note: 'Apply with one limit above the agency\'s 75,000 credits and one left empty: "Quantity cannot exceed 75000 credits", "Please enter value" (set-capping-limit.js)',
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
    note: 'new limits typed for the three agents, not yet applied',
    do: async (p) => { const m = await openCredits(p); await fillLimits(m); await p.evaluate(() => document.activeElement?.blur()); await p.waitForTimeout(600); },
  },
  {
    name: 'message-credits-limit-failed',
    mode: FAIL,
    note: 'Apply refused (PATCH update_staff_cap, 422): the reason in an error toast, the modal still open',
    do: async (p) => failing(p, async () => { const m = await openCredits(p); await fillLimits(m); await press(p, button(m, 'Apply')); await holdToast(p, 'error'); }),
  },

  /* Edit User */
  {
    name: 'form-edit-user-errors',
    note: 'Edit User confirmed with no English title and a WhatsApp number too short: "Please enter name", "Invalid format" (agencyStaffUserFields.js)',
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
    note: 'Edit User with a new address, short address and description, not yet confirmed',
    do: async (p) => { const m = await openEdit(p); await editUser(m); await p.evaluate(() => document.activeElement?.blur()); await p.waitForTimeout(600); },
  },
  {
    name: 'message-edit-user-failed',
    mode: FAIL,
    note: 'Edit User confirmed and refused (PUT update_staff, 422): the reason in an error toast (7 s), the modal still open',
    do: async (p) => failing(p, async () => { const m = await openEdit(p); await editUser(m); await press(p, button(m, 'Confirm')); await holdToast(p, 'error'); }),
  },

  /* Delete User */
  {
    name: 'modal-delete-user',
    note: 'the row\'s delete: "Delete User — The following User will be deleted", with the agent\'s name and email (deleteAgencyUserModal.js)',
    do: async (p) => { await press(p, rowAction(p, 1, 1)); await opened(p, 'Delete User'); },
  },
  {
    name: 'message-delete-user-failed',
    mode: FAIL,
    note: 'Delete confirmed and refused (DELETE remove_staff, 422): the reason in a red Alert inside the still-open modal',
    do: async (p) => failing(p, async () => {
      await press(p, rowAction(p, 1, 1));
      const m = await opened(p, 'Delete User');
      await press(p, button(m, 'Confirm'));
      await m.locator('.ant-alert').waitFor({ timeout: 8000 });
      await p.waitForTimeout(600);
    }),
  },
];
