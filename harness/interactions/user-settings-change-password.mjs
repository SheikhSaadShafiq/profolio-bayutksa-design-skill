/**
 * The settings page for an account whose profile is NOT complete.
 *
 * The default capture is the complete account, as the real one is; this is
 * the 90% account (harness/fixtures/profile.mjs, mode 'incomplete'), which
 * adds the Profile Completeness card under the settings nav and draws the
 * header ring part-filled.
 *
 * ── the Change Password form (container/pages/user-settings/password.js) ──
 * Three password fields and Confirm, validated by the form's own yup schema
 * on submit: each field required ("Please Enter your Password", "Please
 * Enter Your New Password", "Please Confirm Your Password"), the new one and
 * its confirmation at least 8 characters, the confirmation equal to the new
 * one ("Passwords don't match!"). KC_ENABLED is off for this tenant, so there
 * is no strength pattern: "weak" is the length rule. The submission is
 * answered by harness/fixtures/forms.mjs — "Password Updated Successfully"
 * and the form clears; refused, the API's reason shows in the form's Alert.
 * Web and phone share the one layout, so every step runs on both.
 */
import { failing, holdToast, press, FAIL } from '../fixtures/forms.mjs';

const OLD = 'input[placeholder="Enter Old Password"]';
const NEW = 'input[placeholder="Enter New Password"]';
const CONFIRM = 'input[placeholder="Confirm Password"]';
/* invented passwords for an invented account */
const fill = async (p, { old = 'Najd@Horizon21', next = 'Riyadh#Olaya2026', again = next } = {}) => {
  await p.locator(OLD).fill(old);
  await p.locator(NEW).fill(next);
  await p.locator(CONFIRM).fill(again);
};
const confirm = (p) => press(p, p.getByRole('button', { name: 'Confirm', exact: true }).first());
/* the page's TextInput draws its message beside the field (ErrorMessage),
   not in an antd Form.Item; the field itself takes antd's error status */
const errorsShown = async (p, n) => {
  await p.waitForFunction((k) => document.querySelectorAll('[class*="-status-error"]').length >= k, n, { timeout: 8000 });
  await p.waitForTimeout(700);
};

export default [
  { name: 'profile-incomplete', note: 'profile 90% complete: the completeness card and the part-filled header ring (profile-completion.js:59)', mode: 'incomplete' },
  {
    name: 'form-password-errors',
    devices: ['web', 'mobile'],
    note: 'Confirm on the empty form: each field says it is required (password.js yup schema)',
    do: async (p) => { await confirm(p); await errorsShown(p, 3); },
  },
  {
    name: 'form-password-weak',
    devices: ['web', 'mobile'],
    note: 'a new password shorter than 8 characters: "Password must be at least 8 characters" under the new password and its confirmation',
    do: async (p) => { await fill(p, { next: 'najd26' }); await confirm(p); await errorsShown(p, 2); },
  },
  {
    name: 'form-password-mismatch',
    devices: ['web', 'mobile'],
    note: 'the confirmation differs from the new password: "Passwords don\'t match!"',
    do: async (p) => { await fill(p, { again: 'Riyadh#Olaya2025' }); await confirm(p); await errorsShown(p, 1); },
  },
  {
    name: 'form-password-filled',
    devices: ['web', 'mobile'],
    note: 'all three fields filled and valid, not yet confirmed',
    do: async (p) => { await fill(p); await p.locator(CONFIRM).blur(); await p.waitForTimeout(400); },
  },
  {
    name: 'message-password-saved',
    devices: ['web', 'mobile'],
    note: 'confirmed: the "Password Updated Successfully" toast, and the form cleared (password.js:41-43)',
    do: async (p) => { await fill(p); await confirm(p); await holdToast(p, 'success'); },
  },
  {
    name: 'message-password-failed',
    mode: FAIL,
    devices: ['web', 'mobile'],
    note: 'confirmed and refused (harness/fixtures/forms.mjs, 422): the API\'s reason in the form\'s Alert — password.js:39 setStatus, no toast',
    do: async (p) => failing(p, async () => {
      await fill(p);
      await confirm(p);
      await p.waitForSelector('.ant-alert', { timeout: 8000 });
      await p.waitForTimeout(700);
    }),
  },
];
