/**
 * The dashboard states no click reaches.
 *
 * The rest of the dashboard's states — the shell's menus and modals, the
 * performance tabs, the date picker — are found by harness/explore.mjs and
 * listed in data/states/dashboard.json.
 */
import { ACCOUNTS, topUpStates } from './credits-usage.mjs';

/* ── the Credits Balance card, as the other two accounts ──────────────────
   The explorer found the card's two overlays on the owner's dashboard
   (drawer-credits-balance; modal-top-up-your-credits, drawer-top-up-your-
   credits on a phone) by a position path that fits the owner's layout only
   (an individual has no agency selector row above the card). Neither reads a
   role: the title and its ⓘ open the drawer for any credit user
   (components/widgets/credits-quota/credits-quota.js:129, 136) and its content
   is the same for everyone (tenant/bayut/components/credit-info-drawer/
   creditInfoDrawer.js reads isMobile, isMemberArea and locale only); the
   top-up is credits-usage.mjs topUpStates'. So the STAFF user and the
   INDIVIDUAL broker reach both — their compiled dashboards draw the card and
   its Top-Up button — and what differs is the account around them: the rail,
   the bell, the figures under the mask. Found by what they say, so one step
   fits every account's layout and both devices. */
const touch = (p) => p.evaluate(() => navigator.maxTouchPoints > 0).catch(() => false);
const openCreditsDrawer = async (p) => {
  const title = p.getByText('Credits Balance', { exact: true }).first();
  await title.waitFor({ state: 'visible', timeout: 20000 });
  await title.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
  if (await touch(p)) await title.tap({ timeout: 8000 }); else await title.click({ timeout: 8000 });
  await p.locator('.ant-drawer-content', { hasText: 'Bayut Credits' }).first().waitFor({ state: 'visible', timeout: 10000 });
  await p.waitForTimeout(700);
};
/** the drawer on both devices, under the one name the explorer gave it on both */
export const creditsDrawerStates = ACCOUNTS.map(([mode, who]) => ({
  name: `drawer-credits-balance-as-${mode}`,
  mode,
  devices: ['web', 'mobile'],
  note: `the Credits Balance card's title opens its info drawer — "Bayut Credits", What are Bayut Credits?, then Available Credits, Using Credits and Publishing and Expiry of Listings (creditInfoDrawer.js:24-105) — as ${who}. The drawer reads no role (creditInfoDrawer.js); the card opens it for any credit user (credits-quota.js:129)`,
  do: openCreditsDrawer,
}));

export default [
  {
    name: 'modal-profile-completed',
    devices: ['web', 'mobile'],
    note: 'the once-only "Profile Completed" congratulations modal, when the score first reaches 100 (withAdminLayout.js:106-126)',
    do: async (p) => {
      await p.evaluate(() => sessionStorage.setItem('pf-harness-congrats', '1'));
      await p.reload({ waitUntil: 'domcontentloaded' });
      await p.waitForSelector('.ant-modal, .ant-drawer-content', { timeout: 20000 });  /* a phone shows it as a drawer */
      await p.waitForTimeout(1000);
      await p.evaluate(() => sessionStorage.removeItem('pf-harness-congrats'));
    },
  },
  ...creditsDrawerStates,
  ...topUpStates('modal-top-up-your-credits', 'on the Credits Balance card'),
];
