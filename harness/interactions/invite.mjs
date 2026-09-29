/**
 * /invite — an agency invitation, from the invited agent's side.
 *
 * The page is the Invitation modal (a bottom sheet on a phone) over the
 * signed-in shell: "You have been invited to join <agency> by <name>", Reject
 * and Accept (container/pages/invite-user/invite-user.js). It is compiled as
 * /invite?token=… (scripts/pages-list.mjs), the invitation is answered by
 * harness/fixtures/settings.mjs and the two answers to it by
 * harness/fixtures/forms.mjs. There are no fields: the JSON form the page
 * once had is commented out (invite-user.js:144).
 *
 * What each answer does, in the product:
 *   accepted   toast "Invite Accepted Successfully"; the token refresh that
 *              would leave the page does nothing without Keycloak, so the
 *              modal stays (invite-user.js:56-60)
 *   rejected   toast "Invite Rejected Successfully", then after 3 s the page
 *              navigates to /dashboard and reloads (:77-82) — the step holds
 *              that timer so the toast can be captured
 *   refused    the API's reason in an error toast; the modal stays for a retry
 *   expired    the GET itself refused: no modal at all, the reason in an
 *              error toast, and the same 3-second redirect (:109-114)
 */
import { answer } from '../fixtures.mjs';
import { failing, holdToast, holdTimers, press } from '../fixtures/forms.mjs';
import { INVITE_EXPIRED } from '../fixtures/settings.mjs';

const OPEN = '.ant-modal-wrap:not([style*="display: none"]) .ant-modal, .ant-drawer-open .ant-drawer-content';
const button = (p, name) => p.locator(OPEN).getByRole('button', { name, exact: true }).first();
const ready = (p) => p.waitForSelector(OPEN, { timeout: 15000 });

export default [
  {
    name: 'message-accept',
    devices: ['web', 'mobile'],
    note: 'Accept: PUT /api/surge/invitations {status: accepted} → the "Invite Accepted Successfully" toast over the invitation',
    do: async (p) => { await ready(p); await press(p, button(p, 'Accept')); await holdToast(p, 'success'); },
  },
  {
    name: 'message-reject',
    devices: ['web', 'mobile'],
    note: 'Reject: PUT /api/surge/invitations {status: rejected} → the "Invite Rejected Successfully" toast (the product leaves for /dashboard 3 s later; held)',
    do: async (p) => { await ready(p); await holdTimers(p); await press(p, button(p, 'Reject')); await holdToast(p, 'success'); },
  },
  {
    name: 'message-accept-failed',
    devices: ['web', 'mobile'],
    note: 'Accept refused by the API (harness/fixtures/forms.mjs, 422): its reason in an error toast, the invitation still open for a retry',
    do: async (p) => failing(p, async () => { await ready(p); await press(p, button(p, 'Accept')); await holdToast(p, 'error'); }),
  },
  {
    name: 'message-invite-expired',
    devices: ['web', 'mobile'],
    note: 'the invitation itself refused (an expired or used link: GET /api/surge/invitations answers 422) — no modal, the reason in an error toast (the product leaves 3 s later; held)',
    do: async (p) => {
      /* the GET is made on load: answer it refused, and hold its reply until
         the page's 3-second timers are held too */
      let open;
      const gate = new Promise((r) => { open = r; });
      const re = '**/api/surge/invitations*';
      const handler = async (route) => {
        const req = route.request();
        if (req.method() !== 'GET') return route.fallback();
        await gate;
        const u = new URL(req.url());
        return route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify(answer('GET', u.pathname, u.search, INVITE_EXPIRED)) });
      };
      await p.route(re, handler);
      try {
        await p.reload({ waitUntil: 'domcontentloaded' });
        await holdTimers(p);
        open();
        await p.waitForSelector('.ant-layout', { timeout: 30000 });
        await holdToast(p, 'error');
      } finally { open(); await p.unroute(re, handler); }
    },
  },
];
