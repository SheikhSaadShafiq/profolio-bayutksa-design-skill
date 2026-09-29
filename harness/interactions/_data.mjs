/**
 * The DATA states every page has, compiled on every page — web and phone.
 * Each is a fixture mode, so the product renders it rather than anyone
 * drawing it:
 *
 *   loading  mode 'slow'   harness/page.mjs holds the page's content calls
 *                          open and answers the shell (the session, the
 *                          header, the rail): the product's own skeletons
 *                          and spinners
 *   empty    mode 'empty'  a brand-new account (harness/fixtures/*.mjs):
 *                          no listings, leads, traffic, credit spend,
 *                          licences, staff or TruPoints yet — the product's
 *                          own empty states
 *   error    mode 'error'  harness/page.mjs answers the page's content calls
 *                          500 in the API's refusal envelope, the shell as
 *                          usual: the product's own error states
 *
 * "Content" is every call but the shell's; on User Settings, Preferences,
 * Agency Settings and Agency Staff the page's content IS a shell call
 * (users/:id, agencies/:id), and there it is held or failed too (page.mjs
 * OWN_CONTENT). A page whose own file already has a state of the same name
 * (listings: loading, error) keeps its own — scripts/compile.mjs adds these
 * only under names the page does not use.
 *
 * `loading` and `error` wait on the page rather than on the network (a
 * held-open call never settles, so compile.mjs does not settle these modes):
 * each step waits for what the mode produces, then shoots. `devices` keeps
 * them on the phone as well, as a mode-only state would be.
 */

/* a skeleton or spinner with area — the product is visibly waiting */
const waiting = () => [...document.querySelectorAll('.ant-skeleton, .ant-spin-spinning, .ant-spin-dot')]
  .some((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });

export default [
  {
    name: 'loading',
    mode: 'slow',
    devices: ['web', 'mobile'],
    note: 'the page while its content is still loading — every content call held open, the shell answered (harness/page.mjs dataMode): the product\'s own skeletons and spinners',
    do: async (p) => {
      /* the page mounts its skeletons as soon as the session answers; a page
         with nothing to wait for (a form with no data call) has none, and is
         shot as it is */
      await p.waitForFunction(waiting, null, { timeout: 8000 }).catch(() => {});
      await p.waitForTimeout(800);
    },
  },
  {
    name: 'empty',
    mode: 'empty',
    note: 'a brand-new account with nothing yet — 0 listings, 0 leads, no traffic, no credits used, no licences, no staff beyond the owner, no TruPoints, no notifications (harness/fixtures/*.mjs mode empty): the product\'s own empty states',
  },
  {
    name: 'error',
    mode: 'error',
    devices: ['web', 'mobile'],
    note: 'the page when its data request fails — every content call answers 500 { success: false, errors: ["Something went wrong, please try again"] }, the shell answered (harness/page.mjs dataMode): the product\'s own error states',
    do: async (p) => {
      /* every call has an answer, so the network does settle; the toasts a
         failed call raises (antd message, 4.5 s) are let go first, so the
         shot is the page's own error state rather than a toast half-way out */
      await p.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await p.waitForFunction(() => !document.querySelector('.ant-message-notice'), null, { timeout: 8000 }).catch(() => {});
      await p.waitForTimeout(800);
    },
  },
];
