/**
 * The states of /dashboard on a PHONE that the explorer does not reach,
 * named like their web counterparts so data/design-kb.json pairs the two.
 *
 * The phone dashboard is its own composition (dashboard.js mobileDashboard):
 * the listing breakdown, the credits, the Performance card and the Recent
 * Listings as cards — the same cards as /listings, so their helpers come from
 * listings.mobile.mjs. The Performance card changes the most:
 *   - the purpose Segmented is a Select (ReportsLeadsTrafficSection.js:168;
 *     the explorer's dropdown-all)
 *   - the date presets are a bottom sheet, “Search by Calendar” (DateFilter.js
 *     → drawerPopover.js), not the web's popover
 *   - Calls, WhatsApp, SMS and Emails are not figures beside the tabs: they are
 *     child tabs under Leads (LeadsStatsGraphWidget.js:347-372), plain labels
 *     with no count and no “Calls Clicked” hover popover
 * The performance helpers are exported for the two report pages that carry
 * the same card (reports-summary, reports-leads-reports).
 *
 * What the web has and a phone does not:
 *   popover-1104-am-sep-26 — a Recent Listings card prints its posted-on date;
 *     there is no timeline icon to open
 *   tooltip-mark-signature — the upgrade circles have no ActionPopOver on a
 *     phone (platformActions.js:121); tapping the circle opens the request
 *     sheet instead, which the explorer compiled as
 *     drawer-request-signature-upgrade-the
 */
import { card, bring, drawer, menuItem, opened } from './listings.mobile.mjs';
import { topUpStates, openTopUp } from './credits-usage.mjs';

/** the top-up sheet, opened with the Listings card — the card above Credits
    Balance — at the top of the screen, its button then in view without a
    scroll. Not from where press() leaves the page (the button scrolled to
    the middle): there the screen's top edge cuts through the Listings
    card's figures, which reflow when the compiled file's web fonts load (the
    card is 17px taller with them), and the browser's scroll anchoring moved
    the file 8px off the scroll it restores (654 → 662 as staff, 500 → 508 as
    the individual: 2.7% and 3.2% of the pixels, against the bar of 0.5%).
    The card's own top edge moves with nothing: the file opens where it was
    frozen. compile.mjs restores the window's scroll once, before the fonts —
    every other file frozen mid-scroll has the same drift until it restores it
    again once they are in, as it already does for data-pf-scroll */
const topUpFromListings = async (p) => {
  const listings = p.locator('.ant-card').filter({ hasText: 'View All Listings' }).first();
  await listings.evaluate((el) => window.scrollTo(0, Math.round(el.getBoundingClientRect().top + window.scrollY)));
  await p.waitForTimeout(300);
  await openTopUp(p);
};

/** wait out the chart's refetch: no spinner or skeleton on screen */
const still = async (p) => {
  await p.waitForFunction(() => ![...document.querySelectorAll('.ant-spin-spinning, .ant-skeleton-active')]
    .some((el) => el.getBoundingClientRect().width > 0), null, { timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(900);
};

/** the Performance card's Leads tab, then one of the child tabs a phone puts
    under it — All Leads, Calls, WhatsApp, SMS, Emails */
export const leadsChild = (label) => async (p) => {
  const leads = p.locator('.ant-card-head .ant-tabs-tab').filter({ hasText: /Leads/ }).first();
  await bring(p, leads, 300);
  await leads.tap({ timeout: 8000 });
  const child = p.locator('.performance-chart-tabs .ant-tabs-tab').filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) }).first();
  await child.waitFor({ state: 'visible', timeout: 8000 });
  await p.waitForTimeout(400);
  await child.tap({ timeout: 8000 });
  await p.waitForFunction((l) => [...document.querySelectorAll('.performance-chart-tabs .ant-tabs-tab-active')].some((t) => t.textContent.trim() === l), label, { timeout: 8000 });
  await still(p);
};

/** the Performance card's date field — on a phone a bottom sheet,
    “Search by Calendar”, with the presets and the range calendar */
export const openDate = async (p) => {
  const input = p.locator('input[value="Last 30 Days"]').first();
  await bring(p, input, 300);
  await input.tap({ timeout: 8000 });
  await p.waitForFunction(() => [...document.querySelectorAll('.ant-drawer-open .ant-drawer-title')].some((t) => /Search by Calendar/.test(t.textContent)), null, { timeout: 8000 });
  await p.waitForTimeout(900);
};

/** the leads child-tab states, shared with the report pages */
export const leadsStates = [
  {
    name: 'popover-calls-3',
    note: 'phone: Performance → Leads → the Calls child tab — the chart switched to calls. A phone has no “Calls Clicked 3” popover: Calls is a plain tab label under Leads, with no count (LeadsStatsGraphWidget.js:366-372)',
    do: leadsChild('Calls'),
  },
  {
    name: 'popover-whatsapp-7',
    note: 'phone: Performance → Leads → the WhatsApp child tab — the chart switched to WhatsApp. No hover popover on a phone',
    do: leadsChild('WhatsApp'),
  },
  {
    name: 'inline-sms-1',
    note: 'phone: Performance → Leads → the SMS child tab — the chart switched to SMS',
    do: leadsChild('SMS'),
  },
  {
    name: 'inline-emails-2',
    note: 'phone: Performance → Leads → the Emails child tab — the chart switched to emails',
    do: leadsChild('Emails'),
  },
  {
    name: 'popover-today-yesterday-last-7',
    note: 'phone: the Performance date field (“Last 30 Days”) — the presets and the range calendar in a bottom sheet, “Search by Calendar”, not the web’s popover',
    do: openDate,
  },
];

export default [
  ...leadsStates,
  /* the Credits Balance card's top-up as the other two accounts — a bottom
     sheet on a phone, named as the explorer named the owner's
     (drawer-top-up-your-credits); the info drawer's -as-* are dashboard.mjs's,
     one name on both devices */
  ...topUpStates('drawer-top-up-your-credits', 'on the Credits Balance card').map((s) => ({ ...s, do: topUpFromListings })),
  {
    name: 'modal-trucheck-eligible-trucheck-is',
    note: 'phone: Recent Listings, card 0 ⋮ → “TruCheck Eligible” — TruCheckModal as a bottom sheet',
    do: async (p) => { await menuItem(0, 'TruCheck Eligible')(p); await drawer(p); },
  },

  /* ── the phone's own ─────────────────────────────────────────────────── */
  {
    name: 'dropdown-trucheck-eligible-view-on',
    note: 'phone only: Recent Listings, card 0’s ⋮ — the card’s own menu (table-actions.js renderMobileView): TruCheck Eligible, View on Bayut, Preview, Edit, Apply Discount, Delete. Named as the explorer named the same menu on /listings',
    do: async (p) => {
      const trig = (await card(p, 0)).locator('.ant-dropdown-trigger').first();
      await bring(p, trig);
      await trig.tap({ timeout: 8000 });
      await opened(p, '.ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu');
    },
  },
  {
    name: 'app-banner-closed',
    note: 'phone only: the app banner closed by its × (appBanner.js) — the page moves up by the 72px it held (withAdminLayout.js:161-164, 361). It lasts until the next load: every /users/current sets showBanner back to true (common/transformers/user.js:86)',
    do: async (p) => {
      await p.locator('div.p-8[style*="position: fixed"] > span.anticon').first().tap({ timeout: 8000 });
      await p.waitForFunction(() => ![...document.querySelectorAll('div')].some((d) => d.style.position === 'fixed' && d.style.top === '0px' && /Install/.test(d.innerText || '')), null, { timeout: 8000 });
      /* the × wrote showBanner=false; put back what the product itself writes
         on the next load, so no later state in this browser context can start
         without the banner (withAdminLayout.js reads it once, on mount) */
      await p.evaluate(() => localStorage.setItem('showBanner', 'true'));
      await p.waitForTimeout(900);
    },
  },
];
