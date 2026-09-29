/**
 * /post-ad/:id — Magic Post Ad (ALLOW_MAGIC_POST_AD, appRoutes.js:263).
 *
 * A public route: no rail, no admin header — the lite Bayut header with the
 * language switch, and the listing form below it (container/pages/post-ad).
 * The link opens a draft already written for the agent (88241127,
 * harness/fixtures/listing-form.mjs — its photos, title and description came
 * with it). Keycloak is off on this path (utility/helpers.js
 * isKeycloakDisabledForPath), so the form has no Save Changes and no Required
 * Total; Post Listing sends it, and the page answers with its own success
 * modal titled by the API's message (post-ad/index.js SuccessModal).
 *
 * The rest of the page's states are found by harness/explore.mjs
 * (data/states/post-ad.json).
 */
import { failing, holdToast, press } from '../fixtures/forms.mjs';
import DATA from './_data.mjs';

const formReady = async (p) => {
  await p.getByText('Add Images of your Property').first().waitFor({ state: 'visible', timeout: 20000 });
  try { await p.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}
  await p.waitForTimeout(500);
};
const postButton = (p) => p.getByRole('button', { name: 'Post Listing' }).last();
/** the form scrolls itself to the first error (hooks useScrollToFieldForm),
    smoothly: a state is the screen once it has stopped */
export const scrollSettled = (p) => p.evaluate(() => new Promise((done) => {
  let last = `${scrollX},${scrollY}`, still = 0;
  const t = setInterval(() => {
    const now = `${scrollX},${scrollY}`;
    if (now === last) { if (++still >= 6) { clearInterval(t); done(); } } else { still = 0; last = now; }
  }, 100);
  setTimeout(() => { clearInterval(t); done(); }, 8000);
})).catch(() => {});

const both = ['web', 'mobile'];

export default [
  {
    name: 'modal-post-listing',
    devices: both,
    note: 'Post Listing on the magic ad: the listing is sent (PUT listings/:id) and the page\'s own success modal opens, titled with the API\'s message (post-ad/index.js:96)',
    do: async (p) => {
      await formReady(p);
      await press(p, postButton(p));
      await p.locator('.ant-modal-wrap:not([style*="display: none"]) .ant-modal, .ant-drawer-open .ant-drawer-content').last().waitFor({ state: 'visible', timeout: 15000 });
      await p.waitForTimeout(900);
    },
  },
  {
    name: 'form-errors-empty',
    devices: both,
    note: 'Post Listing with the magic ad\'s title and description cleared: the form\'s own errors under both (the fields\' is_required / min_length)',
    do: async (p) => {
      await formReady(p);
      for (const ph of ['Enter title e.g Beautiful new house...', 'Describe your property in detail']) {
        const f = p.getByPlaceholder(ph).first();
        await f.scrollIntoViewIfNeeded(); await f.click(); await f.fill(''); await f.blur();
      }
      await press(p, postButton(p));
      await p.waitForTimeout(600);
      await scrollSettled(p);
    },
  },
  {
    name: 'message-post-failed',
    devices: both,
    note: 'Post Listing refused by the API (422): the reason as a toast, the form as it was (post-listing.js:292)',
    do: async (p) => {
      await formReady(p);
      await failing(p, async () => { await press(p, postButton(p)); await holdToast(p, 'error'); });
    },
  },

  /* a public page gets none of the shared states (scripts/compile.mjs
     PUBLIC): there is no rail or header menu to open, and no account to
     vary — as-staff, as-individual and empty drew this page exactly as it
     is. What it does have is the draft's own request: its skeleton while
     that is held open, and its Error — Retry when it fails */
  ...DATA.filter((s) => s.name === 'loading' || s.name === 'error'),
];
