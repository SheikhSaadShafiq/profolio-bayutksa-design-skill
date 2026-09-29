/**
 * The states of /listings on a PHONE — the click paths harness/interactions/
 * listings.mjs walks on the web, re-walked on the phone layout, under the
 * same names so data/design-kb.json pairs the two.
 *
 * On a phone the table is a column of cards (ListingCardContainer.js ->
 * tenant/bayut/components/listing/listingCard.js), and the controls move:
 *   - the six row actions are one ⋮ menu per card (table-actions.js
 *     renderMobileView: a Dropdown whose items carry the labels the web shows
 *     as tooltips, so they are found by text, not by position)
 *   - every modal is a bottom-sheet drawer (DrawerModal.js, ConfirmationModal.js)
 *   - every popover is a drawer too (DrawerPopover.js), the quality chip's
 *     and the date picker's included
 *   - the filter bar is gone: the filters icon opens the drawer, and on a
 *     phone EVERY filter is in it (filters.js INITIAL_FILTERS_TO_SHOW is 0)
 *   - the upgrade circles have no ActionPopOver (platformActions.js:121
 *     `!isMobile && …`); only the plain-string "not available" tooltip is left
 *
 * What the web has and a phone does not — so no state here, on purpose:
 *   popover-rega, popover-timeline, popover-1104-am-sep-26 — no info icons on
 *     a card: the REGA expiry and the posted-on date are printed on it
 *   popover-status-rejected, popover-images-do-not-match — a card shows no
 *     status at all, so no rejection reason either
 *   popover-leads — the card's Leads figure has no breakdown icon
 *   tooltip-action — the actions are a labelled menu, not icon buttons
 *   tooltip-upgrade, -service, -applied, -pending — the ActionPopOver is
 *     web-only (platformActions.js:121)
 *   date-posted-on — the field is there, but on a phone it cannot open:
 *     listings.js:75-80 gives every filter an analytics onClick, filters.js
 *     spreads it over DateFilter's own onClick (the one that sets isOpen),
 *     and on a phone drawerPopover.js's sheet follows open={isOpen} only
 *     (drawer.js: rest.open overrides the ref's state). Tapping it fires the
 *     analytics event and nothing else
 *
 * A phone is tapped, never clicked: a click leaves the pointer over the
 * control, and its :hover then shows in the product's shot but not in the copy.
 *
 * Cards by index (harness/fixtures/listings.mjs gives every row a job):
 *   0 plain, discountable · 1 rejected · 2 rega expiry · 3 applied + requested
 *   4 daily rental · 6 booked · 7 pending OTP · 8 services unavailable
 */

/* The card helpers are exported: the dashboard's Recent Listings on a phone
   are the same cards (dashboard.mobile.mjs imports them). compile.mjs and
   scripts/ds/design-kb.mjs read only the default export. */

/** the Nth listing card — ListingCardContainer.js wraps each in <div id={listing.id}> */
export const card = async (p, i) => {
  await p.waitForFunction(() => document.querySelector('main div[id] .ant-dropdown-trigger'), null, { timeout: 15000 });
  const id = await p.evaluate((n) => ([...document.querySelectorAll('main div[id]')].filter((d) => /^\d+$/.test(d.id))[n] || {}).id, i);
  if (!id) throw new Error(`no listing card ${i}`);
  return p.locator(`[id="${id}"]`);
};

/** scroll the window so `loc` sits at viewport height `y` before it is tapped.
    Not scrollIntoViewIfNeeded: that parks a control mid-screen, where the
    FEEDBACK tab (341-375 × 292-439) sits over the right edge of every card
    and takes the tap — and under 206 the sticky filter bar covers it */
export const bring = async (p, loc, y = 560) => {
  const h = await loc.elementHandle({ timeout: 8000 });
  await h.evaluate((el, at) => window.scrollTo(0, Math.max(0, el.getBoundingClientRect().top + window.scrollY - at)), y);
  await p.waitForTimeout(400);
};

/** the first visible overlay of a kind, once it has finished opening */
export const opened = async (p, sel, timeout = 10000) => {
  await p.locator(sel).first().waitFor({ state: 'visible', timeout });
  await p.waitForTimeout(700);
};

/** a drawer, open, with no skeleton or spinner left in it */
export const drawer = async (p, { rows } = {}) => {
  await opened(p, '.ant-drawer-content');
  if (rows) await p.locator(`.ant-drawer-content ${rows}`).first().waitFor({ state: 'visible', timeout: 10000 });
  await p.waitForFunction(() => ![...document.querySelectorAll('.ant-drawer-content .ant-skeleton-active, .ant-drawer-content .ant-spin-spinning')]
    .some((el) => el.getBoundingClientRect().width > 0), null, { timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(500);
};

/** tap card i's ⋮, then the menu item labelled `label`. The item's own
    onClick sits on the label inside it (dropdown.js renderLabel), so the
    label is what is tapped */
export const menuItem = (i, label) => async (p) => {
  const c = await card(p, i);
  const trig = c.locator('.ant-dropdown-trigger').first();
  await bring(p, trig);
  await trig.tap({ timeout: 8000 });
  const item = p.locator('.ant-dropdown:not(.ant-dropdown-hidden) .ant-dropdown-menu-item').filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) }).first();
  await item.waitFor({ state: 'visible', timeout: 8000 });
  await p.waitForTimeout(300);
  await item.getByText(label, { exact: true }).first().tap({ timeout: 8000 });
};

/** tap upgrade circle k of card i (the six in the card's bottom-right corner:
    Signature, Hot, Refresh, Photography, Videography, Drone) */
export const circle = async (p, i, k) => {
  const b = (await card(p, i)).locator('button.ant-btn-circle').nth(k);
  await bring(p, b);
  await b.tap({ timeout: 8000, force: true });   /* force: an applied or unavailable circle is disabled */
};

/** the filters drawer — the icon beside "All Listings" (filters.js renderFiltersMobile) */
const openFilters = async (p) => {
  await p.locator('.stickyFilter button.ant-btn-icon-only').first().tap({ timeout: 8000 });
  await drawer(p);
};

/** open one of the filters drawer's selects by its placeholder */
const openSelect = (placeholder) => async (p) => {
  await openFilters(p);
  const sel = p.locator('.ant-drawer-content .ant-select').filter({ hasText: placeholder }).first();
  await sel.scrollIntoViewIfNeeded();
  await sel.tap({ timeout: 8000 });
  await opened(p, '.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
};

/** a status tab. The strip is wider than the phone (593 of 343px) and antd
    moves it by touch (Tabs useTouchMove), so a tab past the edge is swiped
    into view first, the way a thumb does it */
const tab = (re) => async (p) => {
  const t = p.locator('.ant-tabs-tab').filter({ hasText: re }).first();
  const wrap = await p.locator('.ant-tabs-nav-wrap').first().boundingBox();
  for (let n = 0; n < 4; n++) {
    const b = await t.boundingBox();
    if (b && b.x + b.width <= wrap.x + wrap.width) break;
    const cdp = await p.context().newCDPSession(p);
    const y = wrap.y + wrap.height / 2, x0 = wrap.x + wrap.width - 20;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] });
    for (let s = 1; s <= 8; s++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 - s * 28, y }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
    await p.waitForTimeout(500);
  }
  await t.tap({ timeout: 8000 });
  await p.waitForTimeout(1500);
  await p.waitForFunction(() => ![...document.querySelectorAll('.ant-spin-spinning, .ant-skeleton-active')]
    .some((el) => el.getBoundingClientRect().width > 0), null, { timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(500);
};

export default [
  /* ── the card's ⋮ menu → bottom sheets ─────────────────────────────── */
  {
    name: 'modal-trucheck',
    note: 'phone: card 0 ⋮ → “TruCheck Eligible” — TruCheckModal is a DrawerModal, so a bottom sheet, not a modal',
    do: async (p) => { await menuItem(0, 'TruCheck Eligible')(p); await drawer(p); },
  },
  {
    name: 'modal-trucheck-eligible-trucheck-is',
    note: 'phone: the same TruCheck bottom sheet the web explorer reached from the actions column (card 0 ⋮ → “TruCheck Eligible”)',
    do: async (p) => { await menuItem(0, 'TruCheck Eligible')(p); await drawer(p); },
  },
  {
    name: 'modal-delete',
    note: 'phone: card 0 ⋮ → “Delete” — ConfirmationModal renders a bottom sheet (“Delete Listing / Why are you deleting your listing?”) with the reasons as radios',
    do: async (p) => { await menuItem(0, 'Delete')(p); await drawer(p, { rows: '.ant-radio-wrapper' }); },
  },
  {
    name: 'modal-booking',
    note: 'phone: card 4 (the daily rental) ⋮ → “Mark as Booked” — BookingModal as a bottom sheet; the item renders only on a daily rental (listingUtilities.js booking)',
    do: async (p) => { await menuItem(4, 'Mark as Booked')(p); await drawer(p); },
  },
  {
    name: 'action-detail-drawer',
    note: 'phone: card 0 ⋮ → “Preview” — ListingDrawer from the bottom at 100vh (listingDrawer.js:268-273), filled from /api/surge/listings/:id/edit. Tapping the thumbnail opens the same drawer',
    do: async (p) => { await menuItem(0, 'Preview')(p); await drawer(p); await p.waitForTimeout(600); },
  },
  {
    name: 'action-discount',
    note: 'phone: card 0 ⋮ → “Apply Discount” — it NAVIGATES to the edit page (listingUtilities.js sell_rent_listing → showEditListingPage), which scrolls itself to the Discounted Price field (openDiscountListingsSession.js scrollIntoView, block center): the page it lands on, at the scroll it lands at',
    /* a viewport shot: the state IS that scroll, and a full-page shot resizes
       the window, which drops it (the compile then saw the page move after
       every freeze) */
    shot: 'viewport',
    do: async (p) => {
      await menuItem(0, 'Apply Discount')(p);
      await p.waitForURL(/post-listing/, { timeout: 15000 });
      await p.waitForSelector('.ant-layout', { timeout: 20000 });
      await p.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      await p.waitForFunction(() => ![...document.querySelectorAll('.ant-spin-spinning, .ant-skeleton-active')]
        .some((el) => el.getBoundingClientRect().width > 0), null, { timeout: 15000 }).catch(() => {});
      /* the smooth scroll to the field has landed: the field is on screen
         and the window has stopped moving */
      await p.waitForFunction(() => { const f = document.getElementById('post-listing-discounted-price') || document.querySelector("input[name='discounted_price']"); if (!f) return false; const r = f.getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight; }, null, { timeout: 10000 }).catch(() => {});
      let y = -1;
      for (let n = 0; n < 20 && y !== (y = await p.evaluate(() => scrollY)); n++) await p.waitForTimeout(250);
      await p.waitForTimeout(600);
    },
  },
  {
    name: 'modal-otp',
    note: 'phone: card 7 (pending OTP verification) → “Publish Now” — OtpVerificationModal as a bottom sheet, after POST /api/surge/otps answers (platformActions.js:46-63)',
    do: async (p) => {
      const b = (await card(p, 7)).getByRole('button', { name: /Publish/i }).first();
      await bring(p, b);
      await b.tap({ timeout: 8000 });
      await drawer(p);
    },
  },

  /* ── the upgrade circles → request bottom sheets ─────────────────────── */
  { name: 'upgrade-signature', note: 'phone: card 0, upgrade circle 0 — Signature: the request bottom sheet (QuotaCreditModal)', do: async (p) => { await circle(p, 0, 0); await drawer(p); } },
  { name: 'upgrade-hot', note: 'phone: card 0, upgrade circle 1 — Hot', do: async (p) => { await circle(p, 0, 1); await drawer(p); } },
  { name: 'upgrade-refresh', note: 'phone: card 0, upgrade circle 2 — Refresh', do: async (p) => { await circle(p, 0, 2); await drawer(p); } },
  { name: 'upgrade-photography', note: 'phone: card 0, upgrade circle 3 — Photography service', do: async (p) => { await circle(p, 0, 3); await drawer(p); } },
  {
    name: 'tooltip-upgrade-unavailable',
    note: 'phone: card 8, circle 3 tapped — the one upgrade tooltip a phone keeps, because it is a plain string and not the ActionPopOver: “This service is not available in your region yet.” (platformActions.js:117-121)',
    shot: 'viewport',
    do: async (p) => { await circle(p, 8, 3); await opened(p, '.ant-tooltip:not(.ant-tooltip-hidden) .ant-tooltip-inner', 8000); },
  },
  {
    name: 'tooltip-upgrade-none',
    note: 'phone: card 8, circle 2 (Refresh, not applicable) tapped — nothing opens, exactly as on the web: a disabled circle with no explanation',
    shot: 'viewport',
    do: async (p) => { await circle(p, 8, 2); await p.waitForTimeout(900); },
  },

  /* ── the card's popovers, which a phone opens as drawers ─────────────── */
  {
    name: 'popover-health',
    note: 'phone: card 0’s quality chip (62%) tapped — the “Overall Quality” panel as a bottom sheet (health.js isMobile)',
    do: async (p) => {
      const chip = (await card(p, 0)).locator('.ant-tag').filter({ hasText: '%' }).first();
      await bring(p, chip);
      await chip.tap({ timeout: 8000 });
      await drawer(p);
    },
  },

  /* ── the filters: one drawer holding every filter ───────────────────── */
  {
    name: 'drawer-filters',
    note: 'phone: the filters icon beside “All Listings” — the Filters drawer from the bottom at 100vh, holding every filter (the web’s filter-bar selects included)',
    do: openFilters,
  },
  {
    name: 'drawer-show-more',
    note: 'phone: there is no Show More — the filters icon opens the same Filters drawer (filters.js renderFiltersMobile)',
    do: openFilters,
  },
  {
    name: 'select-purpose',
    note: 'phone: filters drawer → Purpose — the select the web has in its filter bar, open inside the drawer',
    do: openSelect('Select Purpose'),
  },
  {
    name: 'dropdown-select-purpose',
    note: 'phone: filters drawer → Purpose, open (the web explorer’s name for select-purpose)',
    do: openSelect('Select Purpose'),
  },
  {
    name: 'select-property-type',
    note: 'phone: filters drawer → Property Type — the grouped multi-select, open inside the drawer',
    do: openSelect('Select Property Types'),
  },
  {
    name: 'dropdown-select-property-types',
    note: 'phone: filters drawer → Property Type, open (the web explorer’s name for select-property-type)',
    do: openSelect('Select Property Types'),
  },
  {
    name: 'inline-search',
    note: 'phone: filters drawer → Search — the filters are applied and the drawer closes (filters.js searchButton), the list re-queried in place',
    do: async (p) => {
      await openFilters(p);
      await p.locator('.ant-drawer-footer button').filter({ hasText: /^\s*Search\s*$/ }).first().tap({ timeout: 8000 });
      await p.locator('.ant-drawer-content').first().waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
      await p.waitForTimeout(1200);
    },
  },

  /* ── the status tabs — antd Tabs on a phone too, in a strip wider than it ── */
  { name: 'tab-draft', note: 'phone: the Draft tab — draft cards (no stats row, Publish in place of the circles)', do: tab(/^Draft/) },
  { name: 'tab-pending', note: 'phone: the Pending tab', do: tab(/^Pending/) },
  { name: 'tab-removed', note: 'phone: the Removed tab (swiped into view first)', do: tab(/^Removed/) },
  { name: 'tab-ad-license-requests', note: 'phone: the Ad License Requests tab (swiped into view first) — the requests as cards', do: tab(/^Ad License/) },

  /* ── the header, whose popovers are drawers on a phone ───────────────── */
  {
    name: 'popover-notifications',
    note: 'phone: the header bell — the notification centre as a drawer, not the web’s 590×330 popover',
    do: async (p) => { await p.locator('.ant-layout-header button.ant-btn-default').first().tap({ timeout: 8000 }); await drawer(p); },
  },
  {
    name: 'drawer-notifications-empty',
    mode: 'empty',
    note: 'phone: the header bell on a brand-new account (mode empty: no notifications, no badge, no listings under the sheet) — the notification centre\'s bottom sheet in its own empty state: “No notifications found”, “Your notifications will appear here”, no Retry (notification-center.js:103-114). The web\'s is popover-notifications-empty',
    do: async (p) => {
      await p.locator('.ant-layout-header button.ant-btn-default').first().tap({ timeout: 8000 });
      await p.locator('.ant-drawer-content', { hasText: 'No notifications found' }).first().waitFor({ state: 'visible', timeout: 10000 });
      await drawer(p);
    },
  },
  {
    name: 'popover-account',
    note: 'phone: the header avatar — the account panel (profile information, Account Settings, Sign Out) as a drawer, not the web’s 400×233 popover',
    do: async (p) => { await p.locator('.ant-layout-header button.ant-btn-round').first().tap({ timeout: 8000 }); await drawer(p); },
  },

  /* ── the phone's own ─────────────────────────────────────────────────── */
  {
    name: 'sticky-filters',
    note: 'phone only: scrolled into the list — “All Listings”, the filters icon and the status tabs stay stuck under the header (style.less .stickyFilter, position: sticky; top: 74px). The shadow its .sticky class would add never comes: ListingCardContainer.js handleScroll compares scrollY with the bar’s offsetTop, and a stuck bar’s offsetTop is scrollY + 74',
    shot: 'viewport',
    do: async (p) => {
      await (await card(p, 0)).waitFor({ state: 'visible' });
      await p.evaluate(() => window.scrollTo(0, 1000));
      await p.waitForFunction(() => { const b = document.querySelector('.stickyFilter'); return b && Math.round(b.getBoundingClientRect().top) === 74 && scrollY >= 900; }, null, { timeout: 8000 });
      await p.waitForTimeout(800);
    },
  },
];
