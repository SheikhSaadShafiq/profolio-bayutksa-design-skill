/**
 * The states of /content/process-payment (container/pages/payment/payment-process.js).
 *
 * The page is where a payment gateway sends the customer back: Checkout.com
 * to the success_url or failure_url request_payment registered
 * (bayut/apis/cart.js:71 — ?status=success|failed plus its cko-payment-id),
 * Tabby with its payment_id. It draws a full-page spinner and, as soon as it
 * has a payment id, replaces itself with /checkout?paymentChannel=…
 * &paymentType=…&cko-payment-id=… (payment-process.js:53), where the result
 * is asked for and shown. The spinner is all the customer sees of it — the
 * compiled page is that spinner, and so is each flow's processing step:
 *
 *   flow-top-up-03-processing       between checkout--flow-top-up-02-checkout
 *                                   and checkout--flow-top-up-04-success
 *   flow-buy-package-03-processing  between checkout--flow-buy-package-02-checkout
 *                                   and checkout--flow-buy-package-04-success
 *
 * A step cannot land here WITH the gateway's query and stay: the page
 * forwards at once. So these steps are the page as it is drawn while it
 * does — nothing to click, the same on a phone.
 */
export default [
  {
    name: 'flow-top-up-03-processing',
    note: 'credit top-up, step 3 of 5: back from the card gateway (3-D Secure), the processing screen — a full-page spinner while the return is forwarded to the checkout (payment-process.js:53); next checkout--flow-top-up-04-success, or packages--flow-top-up-05-failure',
  },
  {
    name: 'flow-buy-package-03-processing',
    note: 'package purchase, step 3 of 5: back from the card gateway, the same processing spinner; next checkout--flow-buy-package-04-success, or packages--flow-buy-package-05-failure',
  },
];
