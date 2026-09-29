/**
 * The states of /user-settings/preferences (tenant/common/components/
 * preference/preference.js): one card, three switches, each saving the
 * moment it is flipped.
 *
 *   Smart Credit Utilization   PATCH users/:id/toggle_auto_utilization; its
 *                              info circle opens the Smart Credits
 *                              Utilization modal (read-only: no footer)
 *   Push Notification          PUT users/:id { user: { user_settings_attributes } }
 *   Image and Details Usage    the same PUT
 *
 * Every switch reads loginUser (users/current), never the page's own
 * getProfileDetails query — which is why this page drew its switches even
 * while that query threw on the photo-less account (see profile.mjs
 * NO_PHOTO, now answered so it does not). A flip saves and then refetches
 * users/current, and the fixture account's settings are not stored, so a
 * switch comes back to where it was: the "saved" states are the product's
 * toast over the card as it was. The switches drawn the other way round are
 * their own state (switches-flipped, mode 'preferences-flipped').
 *
 * The saves are answered by harness/fixtures/forms.mjs (submissions), and
 * the toast says what that answer says: the push switch prints the body's
 * `message` (preference.js:69), the image switch the same or its own
 * "Preference updated successfully" (:88), the smart-credit switch the
 * body's `message` (:50). A failure is forms.mjs's refusal, delivered as a
 * 422 for the length of the flip (failing()).
 *
 * Web and phone share the one card, so every step runs on both.
 */
import { failing, holdToast, press, FAIL_PREFERENCE } from '../fixtures/forms.mjs';

/** the switch in the row whose label is `label` */
const switchOf = (p, label) => p.locator('.ant-card .ant-row', { hasText: label }).locator('button.ant-switch').first();
const SMART = 'Smart Credit Utilization';
const PUSH = 'Push Notification';
const IMAGES = 'Image and Details Usage';

/* the card is ready when its three switches are */
const ready = async (p) => {
  await p.waitForFunction(() => document.querySelectorAll('.ant-card button.ant-switch').length >= 3, null, { timeout: 10000 });
  await p.waitForTimeout(300);
};

/* flip one switch and keep the toast it raises on screen. `at` presses a
   point of the switch rather than its centre: on a phone the FEEDBACK tab
   (fixed at x 341–375, y 292–439 — design-qa FINDINGS) covers the right
   half of the Image and Details Usage switch, and takes a tap there, so a
   person taps the left half, the part they can see */
const flip = (label, kind = 'success', at = null) => async (p) => {
  await ready(p);
  await press(p, switchOf(p, label), at ? { position: at } : {});
  await holdToast(p, kind);
  await p.waitForTimeout(500);
};

export default [
  {
    name: 'switches-flipped',
    mode: 'preferences-flipped',
    note: 'every switch the other way round from the default account: Smart Credit Utilization on, Push Notification off, Image and Details Usage on (harness/fixtures/profile.mjs mode preferences-flipped) — and with push off the header has no bell at all (header-components.js:65 draws NotificationCentre only while push_notifications is enabled)',
  },
  {
    name: 'modal-smart-credits',
    devices: ['web', 'mobile'],
    note: 'the info circle beside Smart Credit Utilization → the read-only Smart Credits Utilization modal, three cards and no footer (smart-credits-utilisation.js, readOnly); a drawer on a phone',
    do: async (p) => {
      await ready(p);
      await press(p, p.locator('.ant-card .ant-row', { hasText: SMART }).locator('button.btn-icon-size').first());
      await p.waitForSelector('.ant-modal, .ant-drawer-content', { timeout: 8000 });
      await p.waitForTimeout(800);
    },
  },
  {
    name: 'saved-push-notification',
    devices: ['web', 'mobile'],
    note: 'Push Notification flipped → PUT users/:id → the success toast with the answer\'s message (preference.js:69); the switch comes back as users/current says',
    do: flip(PUSH),
  },
  {
    name: 'saved-image-details',
    devices: ['web', 'mobile'],
    note: 'Image and Details Usage flipped → PUT users/:id → the success toast, the answer\'s message or "Preference updated successfully" (preference.js:88); pressed at its left half, which the phone\'s FEEDBACK tab leaves uncovered',
    do: flip(IMAGES, 'success', { x: 6, y: 11 }),
  },
  {
    name: 'saved-smart-credit',
    devices: ['web', 'mobile'],
    note: 'Smart Credit Utilization flipped → PATCH users/:id/toggle_auto_utilization → the success toast with the answer\'s message (preference.js:50)',
    do: flip(SMART),
  },
  {
    name: 'message-push-notification-failed',
    devices: ['web', 'mobile'],
    note: 'Push Notification flipped and the save refused (harness/fixtures/forms.mjs FAIL_PREFERENCE, delivered as a 422) → the error toast with the refusal (preference.js:66); the switch stays',
    do: async (p) => {
      await ready(p);
      await failing(p, () => press(p, switchOf(p, PUSH)), { mode: FAIL_PREFERENCE });
      await holdToast(p, 'error');
      await p.waitForTimeout(500);
    },
  },
];
