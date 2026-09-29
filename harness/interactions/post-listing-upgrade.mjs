/**
 * /post-listing/:id/upgrade — the upgrade page.
 *
 * The page itself (scripts/pages-list.mjs) is the upgrade page of the draft
 * the licence step creates (88241126, harness/fixtures/listing-form.mjs) while
 * it is NOT yet posted: "Almost There — Choose the type of listing you want to
 * publish", Signature preselected (upgrade-listing.js handleInitialSelection),
 * the services below, and Post Listing. It is the page an agent reaches with
 * Continue instead of Post Listing, or from a draft's Post Now.
 *
 * The flow reaches it POSTED (post-listing-edit.mjs toPosted): the form's Post
 * Listing applied the basic listing, so the page congratulates and upsells —
 *
 *   flow-post-listing-09-posted    "Your Listing has been Posted Successfully!"
 *   flow-post-listing-10-upgrade   Hot Listing chosen: the total, Upgrade
 *
 * — and Upgrade then leaves for /listings with "Listing Updated Successfully"
 * (upgrade-listing.js:212), which is the listings page's screen, not this one.
 *
 * The rest of the page's states (a product or a service picked, the service's
 * date and notes) are found by harness/explore.mjs
 * (data/states/post-listing-upgrade.json).
 */
import { failing, holdToast, press } from '../fixtures/forms.mjs';
import { toPosted, posting } from './post-listing-edit.mjs';

/** a product's row: the collapse header that selects it (upgrade-listing.js:470) */
export const productRow = (p, title) => p.locator('.ant-collapse-header', { has: p.locator('strong', { hasText: new RegExp(`^${title}$`) }) }).first();
export const actionButton = (p, name) => p.getByRole('button', { name, exact: true }).last();

/** the upsell picture at the top of the card is a looping Lottie
    (upgrade-listing.js:386, bayutUpsellDesktop.json): the compiled copy is
    frozen a moment before its reference is photographed, and a moving picture
    differs between the two — every differing pixel of this page's first
    compile sat inside it. Time is stopped where it is (requestAnimationFrame
    no longer runs), after the state has settled. */
export const still = (p) => p.evaluate(() => { window.requestAnimationFrame = () => 0; }).catch(() => {});
/* …and on every state of the page, not only these: the shell's menus and
   modals and the explorer's finds open over the same moving picture.
   scripts/compile.mjs runs a page's `hold` before each freeze. */
export const hold = still;

async function loaded(p) {
  await p.getByText(/Almost There|Posted Successfully/).first().waitFor({ state: 'visible', timeout: 20000 });
  try { await p.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}
  await p.waitForTimeout(500);
}

const both = ['web', 'mobile'];

export default [
  /* ── the flow ─────────────────────────────────────────────────────────── */
  {
    name: 'flow-post-listing-09-posted',
    devices: both,
    note: 'post a listing, step 9 — done: Post Listing sent the form (PUT listings/:id with the basic listing), the listing is posted and in review, and the upgrade page congratulates: "Your Listing has been Posted Successfully!", with Hot, Signature and the services on offer (upgrade-listing.js)',
    do: async (p) => { await toPosted(p); await still(p); },
  },
  {
    name: 'flow-post-listing-10-upgrade',
    devices: both,
    note: 'post a listing, step 10: Hot Listing chosen on the upsell — its credits in the Total, Upgrade enabled',
    do: async (p) => {
      await toPosted(p);
      await press(p, productRow(p, 'Hot Listing'));
      await p.waitForTimeout(600);
      await still(p);
    },
  },

  /* ── the page's states ────────────────────────────────────────────────── */
  {
    name: 'message-post-listing',
    devices: both,
    note: 'Post Listing on the draft\'s upgrade page (Signature, paid in credits): the products are applied (PUT listings/:id/apply_products) — the toast "Listing Posted Successfully" over the product\'s "Listing Submitted!" modal, Go to Listings (successfulPaymentModal.js). Named as harness/explore.mjs names the same click, so this deterministic version replaces its find',
    do: async (p) => {
      await loaded(p);
      /* from the PUT on, the listing is posted and written (listing-form.mjs lf-posted) */
      await posting(p, async () => {
        await press(p, actionButton(p, 'Post Listing'));
        await p.getByText('Listing Submitted!').first().waitFor({ state: 'visible', timeout: 15000 });
        try { await p.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}
        await p.waitForTimeout(900);
      });
      await still(p);
    },
  },
  {
    name: 'inline-service-options',
    devices: both,
    note: 'a service ticked on the draft\'s upgrade page (Photography Service): its credits join the Total and the product asks when the photographer should come — Date & Time and Comments (ServiceOptions.js)',
    do: async (p) => {
      await loaded(p);
      /* the service's own checkbox: the nearest block around its title that holds one */
      await press(p, p.locator('xpath=//strong[normalize-space(.)="Photography Service"]/ancestor::*[.//label[contains(@class,"ant-checkbox-wrapper")]][1]//label[contains(@class,"ant-checkbox-wrapper")]').first());
      await p.getByText('Date & Time').first().waitFor({ state: 'visible', timeout: 10000 });
      await p.waitForTimeout(600);
      await still(p);
    },
  },
  {
    name: 'inline-insufficient-credits',
    mode: 'lf-low-credits',
    devices: both,
    note: 'the agency OWNER has fewer credits than the chosen product needs (listing-form.mjs lf-low-credits: 1 credit, and users/current says 1 too — profile.mjs lowCredits — so the Available Credits card and the alert agree): Signature preselected, 10 credits, "Insufficient Credits. Pay … for the additional 9 credits at checkout" (upgrade-listing.js renderAlert)',
    do: async (p) => { await loaded(p); await still(p); },
  },
  /* ── the same alert for the other two accounts ──────────────────────────
     The page is the same for every account: upgrade_listing has no permission
     and is a member-area route too (tenant/common/routes/appRoutes.js:105),
     and upgrade-listing.js reads no role — the alert is
     `availableCredits && total > availableCredits` (:349) for whoever is
     signed in, and Post Listing past it goes to checkout for everyone
     (handleCheckout :307 → createUpsellCart → /checkout, a route with no
     permission, appRoutes.js:210). What differs is the account around it:
     the rail, the bell and the Available Credits card's package
     (credits-info.js: user.package, user.credits). Compound modes
     (harness/fixtures.mjs overlay): the account's answers with 1 credit laid
     over them. Whether Surge accepts a staff member's checkout is the API's
     answer and is not recorded. */
  {
    name: 'inline-insufficient-credits-as-staff',
    mode: 'lf-low-credits+staff',
    devices: both,
    note: 'Insufficient Credits as an agency STAFF user sees it (mode staff: Abdullah Al-Otaibi, Titanium, 9 rail items) with 1 credit left (lf-low-credits laid over the staff account — harness/fixtures.mjs overlay): Available Credits 1, Signature 10 credits, "Pay … for the additional 9 credits at checkout" — the alert reads no role (upgrade-listing.js:349)',
    do: async (p) => { await loaded(p); await still(p); },
  },
  {
    name: 'inline-insufficient-credits-as-individual',
    mode: 'lf-low-credits+individual',
    devices: both,
    note: 'Insufficient Credits as an INDIVIDUAL broker sees it (mode individual: no agency, no Agency Staff in the rail) with 1 credit left (lf-low-credits laid over the individual account — harness/fixtures.mjs overlay): Available Credits 1, Signature 10 credits, "Pay … for the additional 9 credits at checkout" — the alert reads no role (upgrade-listing.js:349)',
    do: async (p) => { await loaded(p); await still(p); },
  },
  {
    name: 'message-upgrade-failed',
    devices: both,
    note: 'Post Listing refused by the API (PUT apply_products 422): the reason as a toast, the page as it was (upgrade-listing.js:203)',
    do: async (p) => {
      await loaded(p);
      await failing(p, async () => { await press(p, actionButton(p, 'Post Listing')); await holdToast(p, 'error'); });
      await still(p);
    },
  },
];
