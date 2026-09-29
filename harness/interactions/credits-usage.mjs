/**
 * The Credits Usage states no click reaches — the CREDIT TOP-UP flow starts
 * here, at the card header's "Top-Up your Credits" (credits-usage.js:331).
 *
 * The flow, one state per step, each on the page it renders on (the
 * prototype chains them by name):
 *   flow-top-up-01-choose-amount   credits-usage    1,000 credits typed, priced
 *   flow-top-up-02-checkout        checkout         the 1,000-credit cart
 *   flow-top-up-03-processing      process-payment  back from the card gateway
 *   flow-top-up-04-success         checkout         "Credits Purchased"
 *   flow-top-up-05-failure         packages         "Payment failed due to an error."
 * The top-up modal alone, empty, is found by harness/explore.mjs
 * (modal-top-up-your-credits; drawer-top-up-your-credits on a phone).
 *
 * Every answer is harness/fixtures/payments.mjs's: the price as it is typed
 * (packages/calculate_price — ﷼2.50 a credit, 10% off from 1,000) and the
 * cart the button makes (POST carts → /checkout?cart_id=4410231).
 */
import { press, quiet } from '../fixtures/payments.mjs';

/** what the flow tops up by — payments.mjs prices it at ﷼2,500, ﷼2,250 after 10% */
export const CREDITS = '1000';

/** the modal (a drawer on a phone) the card header's button opens */
export const openTopUp = async (p) => {
  await press(p, p.locator('button', { hasText: 'Top-Up your Credits' }).first());
  await p.locator('.ant-modal-content, .ant-drawer-content').locator('input[placeholder="Enter the number of credits"]').first()
    .waitFor({ state: 'visible', timeout: 20000 });
  await p.waitForTimeout(600);
};

/** type the credits; the price comes back from calculate_price after the
    input's 700 ms debounce (creditTopUps.js:199) and Get Top-up enables.
    `within` is the box the top-up card sits in: the modal (or drawer) here,
    the page itself on Credits & Packages */
export const chooseAmount = async (p, credits = CREDITS, within = null) => {
  const box = within || p.locator('.ant-modal-content, .ant-drawer-content').filter({ has: p.locator('input[placeholder="Enter the number of credits"]') }).first();
  const input = box.locator('input[placeholder="Enter the number of credits"]').first();
  await input.scrollIntoViewIfNeeded({ timeout: 8000 }).catch(() => {});
  await input.fill(credits);
  await box.locator('.creditCard .currency-Saudi_Riyal_Symbol').first().waitFor({ state: 'visible', timeout: 20000 });
  await box.locator('button:not([disabled])', { hasText: 'Get Top-up' }).first().waitFor({ state: 'visible', timeout: 20000 });
  await input.blur().catch(() => {});
  await p.waitForTimeout(500);
  return box;
};

/** credits-usage → the priced modal → Get Top-up → /checkout?cart_id=… */
export const topUpToCheckout = async (p) => {
  await openTopUp(p);
  const box = await chooseAmount(p);
  await press(p, box.locator('button', { hasText: 'Get Top-up' }));
  await p.waitForURL(/\/checkout\?cart_id=/, { timeout: 60000 });
  await p.waitForSelector('.ant-layout', { timeout: 60000 });
  await p.locator('text=Order Summary').first().waitFor({ state: 'visible', timeout: 30000 });
  await quiet(p);
};

export default [
  {
    name: 'flow-top-up-01-choose-amount',
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'credit top-up, step 1 of 5 (then checkout--flow-top-up-02-checkout): "Top-Up your Credits" opens the Credit Top-Up modal — a drawer on a phone — and 1,000 credits are typed; calculate_price answers ﷼2,500 with 10% off, so the Total reads ﷼2,250 beside the struck-through list price, valid for 12 months, and Get Top-up is enabled',
    do: async (p) => { await openTopUp(p); await chooseAmount(p); },
  },
];
