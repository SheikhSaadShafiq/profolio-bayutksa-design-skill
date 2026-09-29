/**
 * The Credits & Packages states no click reaches: the PACKAGE purchase starts
 * here, and every failed or abandoned payment ENDS here — the checkout sends
 * the customer back to /packages with the reason (checkout.js:339 and :224,
 * navigateToPackagesPreservingDevelopers), whatever was being bought.
 *
 * The package flow, one state per step (the prototype chains them by name):
 *   flow-buy-package-01-choose-package   packages         Get Titanium → "Upgrade to Titanium"
 *   flow-buy-package-02-checkout         checkout         the Titanium cart, card only
 *   flow-buy-package-03-processing       process-payment  back from the card gateway
 *   flow-buy-package-04-success          checkout         "Credits Purchased"
 *   flow-buy-package-05-failure          packages         "Payment failed due to an error."
 * and the other two flows' failure endings, which land here too:
 *   flow-top-up-05-failure, flow-ad-license-06-failure.
 *
 * A failed payment is decided by harness/fixtures/payments.mjs's
 * update_payment in a mode of its own (…-declined: status Declined;
 * pay-cancelled: status Cancelled, which the product calls aborted).
 */
import { MODE, press, holdToast, quiet, returnFromGateway, completeInPage } from '../fixtures/payments.mjs';
import { chooseAmount } from './credits-usage.mjs';
import { adLicenseToCheckout } from './ad-license.mjs';

/** Get Titanium on its card → the upgrade confirmation (a drawer on a phone) */
export const choosePackage = async (p) => {
  await press(p, p.locator('button', { hasText: /Get\s+Titanium/ }).first());
  await p.locator('.ant-modal-content, .ant-drawer-content').filter({ hasText: 'Upgrade to Titanium' }).first()
    .waitFor({ state: 'visible', timeout: 20000 });
  await p.waitForTimeout(700);
};

/** packages → Get Titanium → Upgrade → /checkout?cart_id=… (POST carts, item_type Package) */
export const packageToCheckout = async (p) => {
  await choosePackage(p);
  const box = p.locator('.ant-modal-content, .ant-drawer-content').filter({ hasText: 'Upgrade to Titanium' }).first();
  await press(p, box.locator('button', { hasText: /^\s*Upgrade\s*$/ }).first());
  await p.waitForURL(/\/checkout\?cart_id=/, { timeout: 60000 });
  await p.waitForSelector('.ant-layout', { timeout: 60000 });
  await p.locator('text=Order Summary').first().waitFor({ state: 'visible', timeout: 30000 });
  await quiet(p);
};

/** back from the gateway with a failed payment: /checkout asks
    update_payment, and the product returns to /packages with its toast */
const failedReturn = async (p) => {
  await returnFromGateway(p, 'failed');
  await p.waitForURL(/\/packages(\?|$)/, { timeout: 60000 });
  await quiet(p);
  await holdToast(p);
};

export default [
  {
    name: 'flow-buy-package-01-choose-package',
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'package purchase, step 1 of 5 (then checkout--flow-buy-package-02-checkout): "Get Titanium" on the first card — the only tier above the owner\'s Platinum Plus — opens "Upgrade to Titanium": 12,500 credits a month, Package Price ﷼250,000, Amount to Pay ﷼250,000 (package-upgrade-modal.js; a drawer on a phone)',
    do: choosePackage,
  },
  {
    name: 'flow-buy-package-05-failure',
    mode: MODE.PACKAGE_DECLINED,
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'package purchase, the failure ending (after checkout--flow-buy-package-02-checkout): the card gateway returns to /content/process-payment?status=failed, /checkout asks update_payment, which answers Declined; the product toasts "Payment failed due to an error." and sends the customer back to Credits & Packages (checkout.js:339)',
    do: failedReturn,
  },
  {
    name: 'flow-top-up-05-failure',
    mode: MODE.DECLINED,
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'credit top-up, the failure ending (after checkout--flow-top-up-02-checkout): back from the card gateway, update_payment answers Declined for the 1,000-credit order — "Payment failed due to an error." over Credits & Packages, where every failed payment lands (checkout.js:339)',
    do: failedReturn,
  },
  {
    name: 'flow-ad-license-06-failure',
    mode: MODE.AD_LICENSE_DECLINED,
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'ad licence, the failure ending (after checkout--flow-ad-license-04-review-and-pay): the request is made and its ﷼600 cart opened, the card form reports the payment done and update_payment answers Declined — the product toasts "Payment failed due to an error." and goes to Credits & Packages, not back to the licence (checkout.js:341)',
    do: async (p) => {
      await adLicenseToCheckout(p);
      await completeInPage(p);
      await p.waitForURL(/\/packages(\?|$)/, { timeout: 60000 });
      await quiet(p);
      await holdToast(p, 'Payment failed');
    },
  },
  {
    name: 'message-payment-cancelled',
    mode: MODE.CANCELLED,
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'a payment abandoned at the gateway: update_payment answers Cancelled, which the product treats as aborted (utility.js:395) — "You aborted the payment. Please retry or choose another payment method." over Credits & Packages (checkout.js:224)',
    do: failedReturn,
  },
  {
    name: 'form-credit-top-up-priced',
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'the Credit Top-up card at the foot of the page with 1,000 credits typed: calculate_price answers ﷼2,250 (10% off ﷼2,500), valid for 12 months, and Get Top-up enables — the same card the Credits Usage modal holds (creditTopUps.js)',
    do: async (p) => { await chooseAmount(p, undefined, p.locator('.topUpCard').first()); },
  },
];
