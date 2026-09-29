/**
 * The states of /checkout (container/pages/payment/checkout.js) — the one
 * page every purchase ends on: the Payment Method cards, the chosen method's
 * form, the Order Summary with its Pay button, and the result.
 *
 * The page is compiled at /checkout?cart_id=4410231, the credit top-up's
 * cart: without a cart_id or order_id it renders an empty column
 * (checkout.js:450). Which cart /carts/current answers is the fixture MODE
 * (harness/fixtures/payments.mjs) — the top-up by default, MODE.PACKAGE and
 * MODE.AD_LICENSE the other two.
 *
 * THE GATEWAY. Credit/Debit Card is Checkout.com's Flow — card fields, Pay
 * and 3-D Secure are its own, loaded from its host (index.html:32), which
 * the harness blocks: the method shows the product's placeholder for it and
 * no Pay button (Ordersummary.js:261). The return is drawn with the
 * product's own screens, driven by update_payment's answer:
 *   top-up, package   back through /content/process-payment (the 3-D Secure
 *                     redirect) → this page with ?paymentType=success → the
 *                     "Credits Purchased" modal
 *   ad licence        Flow's in-page completion (no redirect), which keeps
 *                     ?ad_license=true → AdLicenseSuccessModal with the
 *                     request id; the redirect would drop that flag and say
 *                     "Credits Purchased" instead (payment-process.js:32)
 * Tabby is the product's own form (date of birth) up to its Pay, which opens
 * Tabby's hosted page (tabby.js:132): the steps stop before that.
 *
 * The flows' steps on this page (the others are on the pages named):
 *   flow-top-up-02-checkout, -04-success            (credits-usage.mjs has the map)
 *   flow-buy-package-02-checkout, -04-success       (packages.mjs)
 *   flow-ad-license-04-review-and-pay, -05-success  (ad-license.mjs)
 */
import { MODE, press, holdToast, quiet, returnFromGateway, completeInPage } from '../fixtures/payments.mjs';
import { topUpToCheckout } from './credits-usage.mjs';
import { packageToCheckout } from './packages.mjs';
import { adLicenseToCheckout } from './ad-license.mjs';

/** to another page of the app, fresh */
const visit = async (p, path) => {
  await p.goto(`${new URL(p.url()).origin}/en${path}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('.ant-layout', { timeout: 60000 });
  await quiet(p);
};
/** the result modal, entered and still */
const resultModal = async (p, text) => {
  await p.locator('.ant-modal-content, .ant-drawer-content').filter({ hasText: text }).first().waitFor({ state: 'visible', timeout: 30000 });
  await p.waitForTimeout(900);
};

/* ── Tabby ────────────────────────────────────────────────────────────────── */
/* the method card's title — the only "Tabby" on the page until it is chosen */
const chooseTabby = async (p) => {
  await press(p, p.getByText('Tabby', { exact: true }).first());
  await p.locator('text=Date of Birth').first().waitFor({ state: 'visible', timeout: 20000 });
  await p.waitForTimeout(600);
};
const dobField = (p) => p.locator('.date-picker input, .ant-picker input').first();
const openDob = async (p) => {
  await press(p, dobField(p));
  await p.locator('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)').first().waitFor({ state: 'visible', timeout: 8000 });
  await p.waitForTimeout(500);
};
/** 12 April 1988, through the picker's own panels — the field is read-only
    (DateSelect.js inputReadOnly): the year button, back to the 1980s, 1988,
    April (when the picker asks for a month), the 12th */
const pickDob = async (p) => {
  await openDob(p);
  const dd = p.locator('.ant-picker-dropdown:not(.ant-picker-dropdown-hidden)').first();
  await press(p, dd.locator('.ant-picker-year-btn').first());
  for (let i = 0; i < 8; i++) {
    if (await dd.locator('.ant-picker-cell-in-view', { hasText: /^1988$/ }).count()) break;
    await press(p, dd.locator('.ant-picker-header-super-prev-btn').first());
  }
  await press(p, dd.locator('.ant-picker-cell-in-view', { hasText: /^1988$/ }).first());
  if (await dd.locator('.ant-picker-month-panel').count()) await press(p, dd.locator('.ant-picker-cell-in-view', { hasText: /^Apr$/ }).first());
  await dd.locator('.ant-picker-date-panel').first().waitFor({ state: 'visible', timeout: 5000 });
  await press(p, dd.locator('.ant-picker-cell-in-view', { hasText: /^12$/ }).first());
  await p.waitForTimeout(600);
};
const pay = (p) => press(p, p.locator('button', { hasText: /^\s*Pay\s*$/ }).first());

export default [
  /* ── the flows' steps ───────────────────────────────────────────────── */
  {
    name: 'flow-top-up-02-checkout',
    devices: ['web', 'mobile'],
    note: 'credit top-up, step 2 of 5 (from credits-usage--flow-top-up-01-choose-amount; then process-payment--flow-top-up-03-processing): Get Top-up made the cart and opened it — Credit/Debit Card and Tabby, the card chosen and waiting on Checkout.com\'s form (its placeholder here: the gateway is not loaded), and the Order Summary: Credits (1,000) ﷼2,500.00, Discount -﷼250.00, Total Payable ﷼2,250.00',
    do: async (p) => { await visit(p, '/credits-usage'); await topUpToCheckout(p); },
  },
  {
    name: 'flow-top-up-04-success',
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'credit top-up, step 4 of 5 (after process-payment--flow-top-up-03-processing; the failure ending is packages--flow-top-up-05-failure): back from the card gateway, update_payment answers Captured and the product congratulates — "Credits Purchased", "Congratulations! You have purchased credits", Go to Dashboard (successfulPaymentModal.js)',
    do: async (p) => { await returnFromGateway(p, 'success'); await resultModal(p, 'Credits Purchased'); },
  },
  {
    name: 'flow-buy-package-02-checkout',
    mode: MODE.PACKAGE,
    devices: ['web', 'mobile'],
    note: 'package purchase, step 2 of 5 (from packages--flow-buy-package-01-choose-package; then process-payment--flow-buy-package-03-processing): Upgrade made the Titanium cart — ﷼250,000 is past Tabby\'s ﷼5,000, so the card is the only method and no Payment Method cards show; Order Summary: Titanium (150,000) ﷼270,000.00, Discount -﷼20,000.00, Total Payable ﷼250,000.00',
    do: async (p) => { await visit(p, '/packages'); await packageToCheckout(p); },
  },
  {
    name: 'flow-buy-package-04-success',
    mode: MODE.PACKAGE,
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'package purchase, step 4 of 5 (the failure ending is packages--flow-buy-package-05-failure): back from the card gateway, update_payment answers Captured — the same "Credits Purchased" modal a top-up gets; a package user is not sent anywhere else (checkout.js:280 refreshes only in the member area)',
    do: async (p) => { await returnFromGateway(p, 'success'); await resultModal(p, 'Credits Purchased'); },
  },
  {
    name: 'flow-ad-license-04-review-and-pay',
    mode: MODE.AD_LICENSE,
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'ad licence, step 4 of 5 (from ad-license--flow-ad-license-03-contact-information): Continue made request 22031 and its cart — "Ad License request submitted successfully!" over the checkout: Credit/Debit Card or Tabby, and Ad License Sell ﷼600.00, Total Payable ﷼600.00',
    do: (p) => adLicenseToCheckout(p, { holdSubmitted: true }),
  },
  {
    name: 'flow-ad-license-05-success',
    mode: MODE.AD_LICENSE,
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'ad licence, step 5 of 5 (the failure ending is packages--flow-ad-license-06-failure): the card form reports the payment complete without a redirect — the one call the step makes for the gateway (checkout.js:155) — update_payment answers Captured and the ad-licence modal opens: "Your request has been submitted successfully", Request ID 22031, Call · Email · WhatsApp, Go to Ad License Requests',
    do: async (p) => { await adLicenseToCheckout(p); await completeInPage(p); await resultModal(p, 'Request ID'); },
  },

  /* ── the form's own states ─────────────────────────────────────────── */
  {
    name: 'form-method-tabby',
    devices: ['web', 'mobile'],
    note: 'Tabby chosen instead of the card: its own form — Date of Birth, "Pay in 4. No interest, no fees." with Learn More, and the four instalments of ﷼562.5 (the total over four, tabby.js:57) — and the Order Summary\'s Pay button, which the card method hides',
    do: chooseTabby,
  },
  {
    name: 'form-tabby-date-of-birth-open',
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'Tabby\'s Date of Birth opened: the date picker, future days disabled (tabby.js:179)',
    do: async (p) => { await chooseTabby(p); await openDob(p); },
  },
  {
    name: 'form-tabby-date-of-birth-filled',
    devices: ['web', 'mobile'],
    note: 'Tabby with a date of birth picked (12 April 1988): the form is complete and Pay would open Tabby\'s own page — the hand-off the steps stop before',
    do: async (p) => { await chooseTabby(p); await pickDob(p); await p.evaluate(() => document.activeElement?.blur?.()); await p.waitForTimeout(500); },
  },
  {
    name: 'form-tabby-date-of-birth-required',
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'Pay with Tabby and no date of birth: the checkout\'s own check — "Please select date of birth before proceeding" (checkout.js:373)',
    do: async (p) => { await chooseTabby(p); await pay(p); await holdToast(p, 'date of birth'); },
  },
  {
    name: 'message-tabby-unable-to-approve',
    mode: MODE.TABBY_REJECTED,
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'Pay with Tabby, and Tabby offers no checkout for the order (its payment link has no page): "Sorry, Tabby is unable to approve this purchase. Please use an alternative payment method for your order" (tabby.js:134)',
    do: async (p) => { await chooseTabby(p); await pickDob(p); await pay(p); await holdToast(p, 'Tabby is unable'); },
  },
  {
    name: 'message-payment-could-not-process',
    mode: MODE.NO_SESSION,
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'the card method cannot start: request_payment answers without a Flow session and the product says so — "Your payment couldn\'t be processed. Please check with your bank or retry." (creditDebitWithCheckout.js:79, the en copy of "Your payment could not process"); the card form stays a placeholder',
    do: async (p) => {
      /* the session is asked for as the page loads, and the toast has gone
         by the time the page settles: load it again and catch it */
      await p.reload({ waitUntil: 'domcontentloaded' });
      await holdToast(p, "couldn't be processed");
      await p.locator('text=Order Summary').first().waitFor({ state: 'visible', timeout: 30000 });
      await p.waitForTimeout(800);
    },
  },
  {
    name: 'modal-purchase-not-permitted',
    mode: 'non-saudi',
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'the owner not a Saudi national (the profile area\'s mode non-saudi): "Credit Purchase not Permitted" — only licensed Saudi brokers may buy packages and credits (LimitNonSaudiNationalModal.js:27, LIMIT_CREDIT_PURCHASE); Pay would stay disabled',
    do: async (p) => { await resultModal(p, 'Credit Purchase not Permitted'); },
  },
  {
    name: 'modal-nafath-verification',
    mode: MODE.NAFATH_PENDING,
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'an account not yet verified through Nafath: "Verification Required Before Purchase" with Verify Nafath (nafath-verification-modal.js, ENABLE_NAFATH; its link is ksa_verifications/nafaz_auth)',
    do: async (p) => { await resultModal(p, 'Verification Required'); },
  },
];
