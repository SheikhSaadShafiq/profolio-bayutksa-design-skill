/**
 * /post-listing — the licence step, and the start of the "post a listing" flow.
 *
 * A desktop package user lands on ?step=license-number
 * (post-listing-with-options.js:120-123, ENABLE_POST_LISTING_REVAMP); a phone
 * shows the chooser first (harness/interactions/post-listing.mobile.mjs).
 * The rest of the page's states are found by harness/explore.mjs
 * (data/states/post-listing.json — Learn More, the empty Continue).
 *
 * THE FLOW "post a listing" (flow-post-listing-NN-…), as the product walks a
 * KSA agent through it on the fixture account — a package user with a FAL
 * licence and 72,880 credits:
 *
 *   post-listing            01 license-number   the REGA ad licence typed in
 *                           02 otp              validated (new_listing_data →
 *                                               the agent's FAL licence), the
 *                                               draft created (listings/new),
 *                                               and the licence OTP sent to the
 *                                               licence holder's phone
 *   post-listing-edit       03 details          the new draft's form, as REGA
 *                           04 images           filled it — then the photos,
 *                           05 specs            the specs, the amenities, the
 *                           06 amenities        words, and the whole form with
 *                           07 description      its Required Total and Post
 *                           08 review           Listing
 *   post-listing-upgrade    09 posted           done: "Your Listing has been
 *                                               Posted Successfully!"
 *                           10 upgrade          the upsell, Hot Listing chosen
 *
 * (Upgrade then leaves for /listings with "Listing Updated Successfully" —
 * the listings page's screen, not one of these.)
 *
 * Each step replays every step before it from a fresh load, so a flow state
 * is the product's own render at that point — nothing is navigated to
 * directly that the agent would not have reached by clicking.
 *
 * The licences (harness/fixtures/listing-form.mjs ADS) are keyed the way the
 * API resolves them: 7201352264 is covered by the agent's FAL licence,
 * 7101352271 is an individual owner's (National ID step), 7201352289 a
 * company's (CR step); REGA does not know 7201359999.
 */
import { failing, holdToast, press } from '../fixtures/forms.mjs';

export const LICENCE = { fal: '7201352264', nationalId: '7101352271', cr: '7201352289', unknown: '7201359999' };
export const NEW_ID = 88241126;                 /* the draft 7201352264 creates (listing-form.mjs ADS) */

const origin = (p) => new URL(p.url()).origin;
const touch = (p) => p.evaluate(() => navigator.maxTouchPoints > 0).catch(() => false);

/** the licence step, from a fresh /post-listing: the desktop is redirected
    to it; a phone picks the Sale/Rent card on the chooser first */
export async function openLicenceStep(p) {
  /* a state of another page (the form, the upgrade page) starts the flow
     from its beginning */
  if (new URL(p.url()).pathname !== '/en/post-listing') {
    await p.goto(`${origin(p)}/en/post-listing`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  }
  if (await touch(p)) {
    const card = p.locator('button', { hasText: 'Sale/Rent Listing' }).first();
    await card.waitFor({ state: 'visible', timeout: 20000 });
    await press(p, card);
  }
  const input = p.getByPlaceholder('e.g 7200000001');
  await input.waitFor({ state: 'visible', timeout: 20000 });
  await p.waitForTimeout(400);
  return input;
}

/** type a licence number the way an agent does — key by key */
export async function typeLicence(p, number) {
  const input = await openLicenceStep(p);
  await input.click();
  await input.pressSequentially(number, { delay: 30 });
  await p.waitForTimeout(300);
  return input;
}

export const continueButton = (p) => p.locator('main button.ant-btn-primary', { hasText: 'Continue' }).first();

/** Continue on the licence card, and wait for what the product does next */
export async function submitLicence(p) {
  await press(p, continueButton(p));
}

/** the licence OTP: the modal (a drawer on a phone) that opens once the draft
    exists (post-listing-with-options.js:186) */
export const otpDialog = (p) => p.locator('.ant-modal-wrap:not([style*="display: none"]) .ant-modal, .ant-drawer-open .ant-drawer-content', { hasText: 'OTP Verification' }).last();

export async function reachOtp(p) {
  await typeLicence(p, LICENCE.fal);
  await submitLicence(p);
  const dialog = otpDialog(p);
  await dialog.waitFor({ state: 'visible', timeout: 20000 });
  await p.waitForTimeout(700);
  return dialog;
}

/** the four boxes of the code, typed in */
export async function typeOtp(p, code = '4827') {
  const dialog = otpDialog(p);
  const first = dialog.locator('input').first();
  await first.click();
  await p.keyboard.type(code, { delay: 60 });
  await p.waitForTimeout(300);
  return dialog;
}

/** licence → OTP → the new draft's form, loaded and settled */
export async function reachForm(p) {
  await reachOtp(p);
  const dialog = await typeOtp(p);
  await press(p, dialog.getByRole('button', { name: 'Verify' }));
  await p.waitForURL(new RegExp(`/post-listing/${NEW_ID}$`), { timeout: 20000 });
  await p.locator('.form-post-listing').first().waitFor({ state: 'visible', timeout: 20000 });
  await p.getByText('Add Images of your Property').first().waitFor({ state: 'visible', timeout: 20000 });
  try { await p.waitForLoadState('networkidle', { timeout: 10000 }); } catch {}
  await p.waitForTimeout(900);
}

const both = ['web', 'mobile'];

export default [
  {
    name: 'modal-non-saudi',
    mode: 'non-saudi',
    devices: both,
    note: 'a user who is not a Saudi national cannot post: the "Unable to Post Listing" modal opens over the first step (LimitNonSaudiNationalModal.js:21, is_saudi_national false)',
    do: async (p) => { await p.waitForSelector('.ant-modal, .ant-drawer-content', { timeout: 20000 });  /* a phone shows it as a drawer */ await p.waitForTimeout(800); },
  },

  /* ── the flow ─────────────────────────────────────────────────────────── */
  {
    name: 'flow-post-listing-01-license-number',
    devices: both,
    note: 'post a listing, step 1: the REGA advertising licence number typed into the licence step, ready to Continue (ad-license-form.js)',
    do: async (p) => { await typeLicence(p, LICENCE.fal); },
  },
  {
    name: 'flow-post-listing-02-otp',
    devices: both,
    note: 'post a listing, step 2: the licence is valid and covered by the agent\'s FAL licence (listings/new_listing_data → license_number), the draft is created (listings/new → is_otp_required) and the code sent to the licence holder\'s phone: the OTP Verification modal, a drawer on a phone (otp-verification-modal.js), with the code typed in',
    do: async (p) => { await reachOtp(p); await typeOtp(p); },
  },

  /* ── the licence step's other states ──────────────────────────────────── */
  {
    /* harness/explore.mjs finds the same click on the web under this name;
       written here it is the phone's too, and says what it shows */
    name: 'inline-continue',
    devices: both,
    note: 'Continue with the licence field empty: "Please enter AD License to continue" under it (license-validation.js:29)',
    do: async (p) => { await openLicenceStep(p); await submitLicence(p); await p.waitForTimeout(600); },
  },
  {
    name: 'form-license-invalid',
    devices: both,
    note: 'Continue with a number that is not an ad licence (not 10 digits starting 71/72): "Please enter a valid advertisement license number" under the field (license-validation.js:31)',
    do: async (p) => { await typeLicence(p, '6204118'); await submitLicence(p); await p.waitForTimeout(600); },
  },
  {
    name: 'message-license-not-found',
    devices: both,
    note: 'a well-formed licence REGA does not know: new_listing_data refuses it (422) and the product toasts the reason (license-validation.js:103)',
    do: async (p) => {
      await typeLicence(p, LICENCE.unknown);
      await failing(p, async () => { await submitLicence(p); await holdToast(p, 'error'); }, { gets: /\/listings\/new_listing_data$/ });
    },
  },
  {
    name: 'form-national-id',
    devices: both,
    note: 'an individual owner\'s licence (new_listing_data → show_nafaz_id true): the step that asks for the advertiser\'s National ID before the listing is created (national-cr-form.js)',
    do: async (p) => {
      await typeLicence(p, LICENCE.nationalId); await submitLicence(p);
      await p.getByText('Provide Your National ID Number').first().waitFor({ state: 'visible', timeout: 15000 });
      await p.waitForTimeout(500);
    },
  },
  {
    name: 'form-national-id-invalid',
    devices: both,
    note: 'the National ID step with an ID that is not 10 digits: "Please enter a valid national ID number" (license-validation.js:46)',
    do: async (p) => {
      await typeLicence(p, LICENCE.nationalId); await submitLicence(p);
      const input = p.getByPlaceholder('e.g 1100000000');
      await input.waitFor({ state: 'visible', timeout: 15000 });
      await input.click(); await input.pressSequentially('10765', { delay: 30 });
      await press(p, continueButton(p));
      await p.waitForTimeout(600);
    },
  },
  {
    name: 'form-cr-number',
    devices: both,
    note: 'a company\'s licence (new_listing_data → show_nafaz_id false): the step that asks for its Commercial Registration number, with the way to skip it for good by verifying a FAL licence (national-cr-form.js)',
    do: async (p) => {
      await typeLicence(p, LICENCE.cr); await submitLicence(p);
      await p.getByText('Provide Your Commercial Registry Number').first().waitFor({ state: 'visible', timeout: 15000 });
      await p.waitForTimeout(500);
    },
  },
  {
    name: 'message-otp-incorrect',
    devices: both,
    note: 'the licence OTP refused (otps/verify 422): the product toasts the reason and keeps the modal open (otp-verification-modal.js:197)',
    do: async (p) => {
      const dialog = await reachOtp(p);
      await typeOtp(p, '1111');
      await failing(p, async () => { await press(p, dialog.getByRole('button', { name: 'Verify' })); await holdToast(p, 'error'); });
    },
  },
];
