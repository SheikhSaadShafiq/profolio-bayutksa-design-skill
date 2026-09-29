/**
 * /user-settings/licenses — the account's FAL licences.
 *
 * The one thing this page submits is "Share with agency staff", the switch on
 * each licence the viewer owns (components/license-card/license-card.js:210):
 * it asks first — "Share License" or "Unshare", a modal (a bottom sheet on a
 * phone) — then PATCH /api/surge/licenses/:id { license: { is_shareable } },
 * answered by harness/fixtures/forms.mjs: the "License sharing status
 * changed" toast and the list refetched; refused (422), the reason in an
 * error toast. The owner has two such licences in the fixture
 * (harness/fixtures/extra.mjs): 7201000001 shared, 7201004417 not. The
 * confirmation itself is found by harness/explore.mjs
 * (modal-share-license-by-enabling).
 *
 * There is no "Unshare" state, because the product never shows one on top:
 * every owned licence's card mounts its own confirmation but they share ONE
 * visible flag (license-card.js), so either switch opens both, and the last
 * card's — "Share License", for 7201004417 — is the one in front. Pressing
 * the SHARED licence's switch therefore asks "Share License … Share" while
 * the PATCH it sends is that licence's unshare (license-card.js:44, the
 * pressed id and value): a product bug, reported, not drawn here. The steps
 * below press the unshared licence's own switch, where the words in front
 * and the request agree.
 *
 * "Add FAL license" has NO form in this product: it is a link to the
 * classified site's /verification/rega (add-license.js:26, license-card.js:57
 * — getClassifiedBaseURL()), which this repository does not contain, so
 * there is nothing to fill in or submit here.
 */
import { failing, holdToast, press } from '../fixtures/forms.mjs';

const OPEN = '.ant-modal-wrap:not([style*="display: none"]) .ant-modal, .ant-drawer-open .ant-drawer-content';
/* the owner's two switches, in list order: shared, then not shared */
const toggle = (p, shared) => p.locator(`button[role="switch"][aria-checked="${shared}"]`).first();
const confirm = async (p, name) => {
  const box = p.locator(OPEN).filter({ has: p.getByRole('button', { name, exact: true }) }).last();
  await box.waitFor({ state: 'visible', timeout: 10000 });
  await p.waitForTimeout(500);
  return box;
};

export default [
  {
    name: 'message-share-license-saved',
    devices: ['web', 'mobile'],
    note: 'Share confirmed: PATCH /api/surge/licenses/:id → the "License sharing status changed" toast, the list refetched',
    do: async (p) => {
      await press(p, toggle(p, false));
      const box = await confirm(p, 'Share');
      await press(p, box.getByRole('button', { name: 'Share', exact: true }).first());
      await holdToast(p, 'success');
    },
  },
  {
    name: 'message-share-license-failed',
    devices: ['web', 'mobile'],
    note: 'Share confirmed and refused by the API (forms.mjs, 422): its reason in an error toast',
    do: async (p) => failing(p, async () => {
      await press(p, toggle(p, false));
      const box = await confirm(p, 'Share');
      await press(p, box.getByRole('button', { name: 'Share', exact: true }).first());
      await holdToast(p, 'error');
    }),
  },
];
