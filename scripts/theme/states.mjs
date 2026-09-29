/**
 * The new My Listings' states, and how each is reached in the designer's
 * handover build — read by scripts/theme/capture.mjs.
 *
 *   via.card      a screen card of 03 (its letter), pressed with via.press
 *   via.section   a section by its heading — 02c, the state panel, whose
 *                 scenario chips drive the build with the props engineering reads
 *   via.build     a moment only the prototype reaches (a menu, the tour, a
 *                 confirmation): the build's own state, set as its clicks set it
 *   at            ms after which time stops — for a moment inside a motion
 *   full          the frame grows until nothing inside it scrolls — the whole
 *                 list, the whole drawer — instead of the designer's 1440 x 900
 *
 * Not here: 02c's nine case chips only select a row (the list is the same,
 * with that row tinted) — the nine cases are the rows of the full list, and
 * each case's drawer is its own state below. The Mark as Booked modal (03 · J,
 * 02c · Mark as Booked) is specified but not drawn by the web build — the
 * chip changes nothing; it is [TBC] until the designer builds it.
 *
 * The same picture reached two ways is kept once (the first listed) and the
 * other is recorded as the same state.
 */
const TITLES = { A: 'My Listings, Active tab', B: 'Draft tab', C: 'Pending tab', D: 'Removed tab', E: 'Ad License Requests tab', F: 'Listing Performance drawer', G: 'How to Earn Quality Score drawer', H: 'More Filters drawer', I: 'Share Listing modal', J: 'Mark as Booked modal', K: 'Request Services modal', L: 'Sorting and filtering skeleton' };
const card = (letter, toggle) => ({ card: letter, title: TITLES[letter], press: toggle ? [toggle] : [] });
const panel = (chip) => ({ section: '02c ·', press: [chip] });
const proto = (build, wait) => ({ section: '02c ·', press: ['Listing list'], build, wait });
/* a tour step, as the build's placeTour sets it — but measured in the
   captured screen: the build looks its target up with document.querySelector,
   which on the spec page finds the first of several live instances */
const TOUR = (i) => `(() => {
  const b = window.__pfBuild, st = b.tourSteps()[${i}];
  b.setState(Object.assign({ tourStep: ${i}, tourRect: null }, st.pre || {}));
  if (st.full) return;
  setTimeout(() => {
    const el = document.querySelector('[data-pf-theme-host] [data-tour="' + st.key + '"]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    b.setState({ tourStep: ${i}, tourRect: { top: r.top, left: r.left, width: r.width, height: r.height } });
  }, 500);
})()`;
/* the phone's Amenities chip opens the second fix, which is the amenities fix
   only for some listings; the picker belongs to the third on the one it opens */
const AMENITIES = `(() => { window.__pfBuild.setState({ exp: [false, false, true], amenOpen: true }); setTimeout(() => { const p = document.querySelector('[data-pf-scope] [data-phone="1"]'); const el = p && [...p.querySelectorAll('div,span')].find((e) => (e.textContent || '').trim() === 'Clear all'); if (el) el.scrollIntoView({ block: 'center' }); }, 700); })()`;
/* the build's nine cases, in the order the Active tab lists them, by the name 02c gives each */
const CASES = [['allBad', 'all-bad', 'All bad'], ['sixFixes', 'everything-unfinished', 'Everything unfinished'], ['highImp', 'high-impression-low-leads', 'High impression, low leads'], ['dailyRental', 'daily-rental', 'Daily rental'], ['rankPending', 'rank-pending', 'Rank pending'], ['offPlan', 'off-plan', 'Off-plan initial sale'], ['noData', 'just-posted', 'Just posted'], ['happy', 'happy', 'Happy case'], ['lowImp', 'low-impression-high-conversion', 'Low impression, high conversion']];

import { BOOKING, BOOKING_SOURCE } from './derive.mjs';
export { TOUR };
export default {
  web: [
    /* 03 · the designer's twelve screens */
    { name: '', group: 'screens', via: card('A', 'Default'), how: '03 · A · Default', note: 'My Listings, Active tab — the nine seeded cases' },
    { name: 'sorting', group: 'screens', via: card('A', 'Sorting'), how: '03 · A · Sorting', note: 'While a sort is applied — the rows give way to the skeleton, "Sorting 65 listings..."' },
    { name: 'tab-draft', group: 'screens', via: card('B', 'Both rows'), how: '03 · B · Both rows', note: 'Draft tab — six drafts (Listing incomplete, Ready to publish, Not enough credits … the first three in frame)' },
    { name: 'tab-pending', group: 'screens', via: card('C', 'All three states'), how: '03 · C · All three states', note: 'Pending tab — seven listings waiting: in review, changes in review, a license or a payment (the first three in frame)' },
    { name: 'tab-removed', group: 'screens', via: card('D', 'All four reasons'), how: '03 · D · All four reasons', note: 'Removed tab — twelve removed listings: rejected, expired, sold, removed by Bayut … (the first three in frame)' },
    { name: 'tab-ad-license-requests', group: 'screens', via: card('E', 'All five statuses'), how: '03 · E · All five statuses', note: 'Ad License Requests tab — five statuses, its own filter bar' },
    { name: 'drawer-listing-performance', group: 'screens', via: card('F', 'Needs fixes'), how: '03 · F · Needs fixes', note: 'Listing Performance drawer, 780px, over the Active tab — a listing that needs fixes' },
    { name: 'drawer-listing-performance-perfect', group: 'screens', via: card('F', 'Perfect score'), how: '03 · F · Perfect score', note: 'Listing Performance drawer — a perfect score, no fix list' },
    { name: 'drawer-quality-score', group: 'screens', via: card('G', 'Default'), how: '03 · G', note: 'How to Earn Quality Score drawer, 680px — the second layer, over the Listing Performance drawer' },
    { name: 'drawer-more-filters', group: 'screens', via: card('H', 'Default'), how: '03 · H', note: 'More Filters drawer, 450px, over the Active tab' },
    { name: 'modal-share', group: 'screens', via: card('I', 'Default'), how: '03 · I', note: 'Share Listing modal, 520px — Copy Bayut Link' },
    { name: 'modal-request-services', group: 'screens', via: card('K', 'Default'), how: '03 · K', note: 'Request Services modal, 520px — Drone, Photography, Videography' },
    /* Mark as Booked — drawn by neither build: derived (derive.mjs), in the Request Services modal's chrome */
    ...[['', 'Booked by guest', null, null, 'Mark as Booked modal, 520px — daily rentals only: pick the check-in date'],
      ['-range', 'Booked by guest', '2026-09-11', '2026-09-14', 'Mark as Booked modal — a stay picked, 3 nights: Sep 11 to Sep 14'],
      ['-blocked', 'Blocked (unavailable)', '2026-09-11', '2026-09-14', 'Mark as Booked modal — the nights blocked instead: Block These Dates']].map(([suffix, kind, s0, e0, note]) => ({
      name: `modal-mark-as-booked${suffix}`, group: 'overlays', derived: BOOKING_SOURCE('web'),
      via: proto(`window.__pfBuild.setState({ servicesOpen: true, svcKey: 'dailyRental', menuKey: null, payment: null, service: 'photography', bookMon: 1, bookKind: ${JSON.stringify(kind)}, bookStart: ${JSON.stringify(s0)}, bookEnd: ${JSON.stringify(e0)} })`, 1500),
      derive: BOOKING('web'), how: 'derived · the daily rental row → Mark as Booked (the build has its logic, not its template)', note: `${note} [derived]` })),
    { name: 'toast-booked', group: 'overlays', via: proto(`(() => { const b = window.__pfBuild; b.setState({ bookKind: 'Booked by guest', bookStart: '2026-09-11', bookEnd: '2026-09-14' }); setTimeout(() => b.renderVals().confirmBooking({ stopPropagation() {} }), 300); })()`, 900), at: 200, how: 'prototype · Mark as Booked → confirm (the build\'s own toast)', note: 'After Mark as Booked: a green toast, centre-bottom, 3.2s — "3 nights marked as booked: Sep 11 to Sep 14"' },
    { name: 'skeleton-sorting', group: 'screens', via: card('L', 'Sorting'), how: '03 · L · Sorting', note: 'Sorting and filtering skeleton — replaces the row list' },
    ...[['B', 'Both rows', 'tab-draft', 'Draft tab — every draft'], ['C', 'All three states', 'tab-pending', 'Pending tab — every listing waiting'], ['D', 'All four reasons', 'tab-removed', 'Removed tab — every removed listing'], ['E', 'All five statuses', 'tab-ad-license-requests', 'Ad License Requests tab — every request']].map(([l, t, n, note]) => ({ name: `${n}-full`, group: 'screens', via: card(l, t), full: true, how: `03 · ${l} · ${t}, the whole list`, note })),
    { name: 'full', group: 'screens', via: card('A', 'Default'), full: true, how: '03 · A · Default, the whole list', note: 'My Listings, Active tab — the whole list: the nine cases, one row each' },
    { name: 'drawer-listing-performance-full', group: 'screens', via: card('F', 'Needs fixes'), full: true, how: '03 · F · Needs fixes, the whole drawer', note: 'Listing Performance drawer — the whole drawer, every section' },
    { name: 'drawer-quality-score-full', group: 'screens', via: card('G', 'Default'), full: true, how: '03 · G, the whole drawer', note: 'How to Earn Quality Score drawer — the whole explainer' },

    /* the Listing Performance drawer, for each of the nine cases */
    ...CASES.map(([key, name, label]) => ({ name: `drawer-case-${name}`, group: 'cases', via: proto(`window.__pfBuild.setState({ open: true, caseKey: '${key}', qualityOpen: false })`, 2000), how: `prototype · the ${label} row → its drawer`, note: `Listing Performance drawer — case: ${label.replace(/ case$/i, '').toLowerCase()}` })),
    ...CASES.map(([key, name, label]) => ({ name: `drawer-case-${name}-full`, group: 'cases', via: proto(`window.__pfBuild.setState({ open: true, caseKey: '${key}', qualityOpen: false })`, 2000), full: true, how: `prototype · the ${label} row → its drawer, whole`, note: `Listing Performance drawer, whole — case: ${label.replace(/ case$/i, '').toLowerCase()}` })),

    /* 02c · the state panel: every case and state, by the build's scenario props */
    { name: 'drawer-listing-performance-default', group: 'drawer', via: panel('Performance drawer'), how: '02c · Performance drawer', note: 'Listing Performance drawer, as the state panel opens it' },
    { name: 'drawer-amenities', group: 'drawer', via: panel('Amenities picker'), how: '02c · Amenities picker', note: 'Add Amenities picker, over the Listing Performance drawer' },
    { name: 'drawer-quality-score-panel', group: 'drawer', via: panel('Quality explainer'), how: '02c · Quality explainer', note: 'How to Earn Quality Score drawer, as the state panel opens it' },
    { name: 'drawer-trend-drop', group: 'drawer', via: panel('Trend: sudden drop'), how: '02c · Trend: sudden drop', note: 'Listing Performance drawer — the trend with a sudden drop' },
    { name: 'drawer-trend-spike', group: 'drawer', via: panel('Trend: one day spike'), how: '02c · Trend: one day spike', note: 'Listing Performance drawer — the trend with a one-day spike' },
    { name: 'drawer-trend-recover', group: 'drawer', via: panel('Trend: down then back up'), how: '02c · Trend: down then back up', note: 'Listing Performance drawer — the trend down, then back up' },
    { name: 'drawer-trend-no-data', group: 'drawer', via: panel('Trend: no data yet'), how: '02c · Trend: no data yet', note: 'Listing Performance drawer — no trend data yet' },
    { name: 'drawer-more-filters-panel', group: 'overlays', via: panel('More Filters'), how: '02c · More Filters', note: 'More Filters drawer, as the state panel opens it' },
    { name: 'modal-share-panel', group: 'overlays', via: panel('Copy Bayut Link'), how: '02c · Copy Bayut Link', note: 'Share Listing modal, as the state panel opens it' },
    { name: 'modal-request-services-panel', group: 'overlays', via: panel('Request Services'), how: '02c · Request Services', note: 'Request Services modal, as the state panel opens it' },
    { name: 'skeleton-filtering', group: 'overlays', via: proto(() => window.__pfBuild.runBusy('Filtering 65 listings...', 1800), 200), at: 300, how: 'prototype · apply a filter (the build runs its 1.8s busy state)', note: 'Filtering skeleton — replaces the row list for 1.8s, "Filtering 65 listings..." (02c’s Filtering skeleton chip shows the sort skeleton instead)' },
    { name: 'empty-active', group: 'empty', via: panel('No active listings'), how: '02c · No active listings', note: 'Empty: no active listings yet — Post a Listing, See how scores work' },
    { name: 'empty-draft', group: 'empty', via: panel('No drafts'), how: '02c · No drafts', note: 'Empty: no drafts saved' },
    { name: 'empty-pending', group: 'empty', via: panel('No pending listings'), how: '02c · No pending listings', note: 'Empty: nothing waiting for approval' },
    { name: 'empty-removed', group: 'empty', via: panel('No removed listings'), how: '02c · No removed listings', note: 'Empty: no removed listings' },
    { name: 'empty-filter', group: 'empty', via: panel('No filter results'), how: '02c · No filter results', note: 'Empty: no listings match these filters — the only action that clears the filters' },
    { name: 'offline', group: 'empty', via: panel('No internet'), how: '02c · No internet', note: 'Error: no internet — suppresses the rows and any empty state' },
    { name: 'non-package', group: 'empty', via: panel('Not a package user'), how: '02c · Not a package user', note: 'Not a package user — the package upsell banner' },
    { name: 'non-package-empty', group: 'empty', via: panel('Not a package user, no listings'), how: '02c · Not a package user, no listings', note: 'Not a package user, and no listings' },
    { name: 'tab-draft-panel', group: 'tabs', via: panel('Draft tab'), how: '02c · Draft tab', note: 'Draft tab, as the state panel opens it' },
    { name: 'tab-pending-panel', group: 'tabs', via: panel('Pending tab'), how: '02c · Pending tab', note: 'Pending tab, as the state panel opens it' },
    { name: 'tab-removed-panel', group: 'tabs', via: panel('Removed tab'), how: '02c · Removed tab', note: 'Removed tab, as the state panel opens it' },
    { name: 'tab-ad-license-requests-panel', group: 'tabs', via: panel('Ad License Requests'), how: '02c · Ad License Requests', note: 'Ad License Requests tab, as the state panel opens it' },

    /* the prototype: moments only a click reaches */
    { name: 'rank-updating', group: 'prototype', via: proto(() => window.__pfBuild.setState({ recalc: { allBad: 'Refresh' } }), 200), at: 500, how: 'prototype · Refresh on the first row', note: 'Rank updating — the rank tile while the new position is fetched (1.8s, then the new rank)' },
    { name: 'drawer-rank-updating', group: 'prototype', via: proto(() => window.__pfBuild.setState({ open: true, caseKey: 'highImp', recalc: { highImp: 'Refresh' } }), 900), at: 500, how: 'prototype · Refresh inside the Listing Performance drawer', note: 'Rank updating inside the Listing Performance drawer' },
    { name: 'menu-row', group: 'prototype', via: proto(() => window.__pfBuild.setState({ menuKey: 'allBad' })), how: 'prototype · ⋮ on the first row', note: "A row's ⋮ menu" },
    { name: 'menu-sort', group: 'prototype', via: proto(() => window.__pfBuild.setState({ sortOpen: true })), how: 'prototype · Newest First', note: 'The sort menu' },
    { name: 'drawer-menu-range', group: 'prototype', via: proto(() => window.__pfBuild.setState({ open: true, caseKey: 'highImp', rangeOpen: true })), how: 'prototype · Last 30 Days, in the drawer', note: "The Listing Performance drawer's date range menu" },
    { name: 'modal-delete', group: 'prototype', via: proto(() => window.__pfBuild.setState({ delKey: 'allBad', delReason: null, menuKey: null })), how: 'prototype · ⋮ → Delete', note: 'Delete listing — the reasons' },
    { name: 'modal-trucheck', group: 'prototype', via: proto(() => window.__pfBuild.setState({ truKey: 'allBad', menuKey: null })), how: 'prototype · TruCheck on the first row', note: 'TruCheck verification' },
    { name: 'modal-change-ownership', group: 'prototype', via: proto(() => window.__pfBuild.setState({ ownKey: 'allBad', menuKey: null })), how: 'prototype · ⋮ → Change Ownership', note: 'Change ownership' },
    ...[0, 1, 2, 3, 4].map((i) => ({ name: `tour-${i + 1}`, group: 'prototype', via: proto('true', 300), after: TOUR(i), how: `prototype · the onboarding tour, step ${i + 1} of 5`, note: ['Onboarding tour, the intro card — My Listings has a new look', 'Onboarding tour, spotlight 1 / 4 — Performance and improvements', 'Onboarding tour, spotlight 2 / 4 — Split the list by performance', 'Onboarding tour, spotlight 3 / 4 — Sort by what matters', 'Onboarding tour, spotlight 4 / 4 — See how the score works'][i] })),
  ],
  mobile: [
    /* 02 · the phone prototype's scenario chips — every state the build can be in */
    ...[
      ['', 'Listing list', 'list', 'My Listings, Active tab — as an agent lands on it'],
      ['full', 'Listing list', 'list', 'My Listings, Active tab — the whole list, every case', { full: true }],
      ...CASES.map(([, name, label]) => [`case-${name}`, label, 'cases', `The list with one case pinned first: ${label.replace(/ case$/i, '').toLowerCase()}`]),
      ['sheet-performance', 'Performance sheet', 'sheets', 'Listing Performance bottom sheet'],
      ['sheet-performance-full', 'Performance sheet', 'sheets', 'Listing Performance bottom sheet — the whole sheet', { full: true }],
      ['sheet-improve-quality', 'Improve Quality', 'sheets', 'Improve Quality — the all-bad listing’s sheet, its first fix expanded (the fix list is below the fold)'],
      ['sheet-improve-quality-full', 'Improve Quality', 'sheets', 'Improve Quality — the all-bad listing’s whole sheet, down to its fix list', { full: true }],
      ['sheet-amenities', 'Amenities picker', 'sheets', 'Add Amenities picker, open in the quality block', { build: AMENITIES, wait: 1500 }],
      ['sheet-amenities-full', 'Amenities picker', 'sheets', 'Add Amenities picker, open in the quality block — the whole sheet', { full: true, build: AMENITIES, wait: 1500 }],
      ['sheet-quality-score', 'How the score works', 'sheets', 'How to Earn Quality Score sheet'],
      ['sheet-quality-score-full', 'How the score works', 'sheets', 'How to Earn Quality Score sheet — the whole explainer', { full: true }],
      ['sheet-share', 'Copy Bayut Link', 'sheets', 'Share sheet — Copy Bayut Link'],
      ['sheet-row-menu', 'Row menu', 'sheets', "A card's row menu — a bottom sheet, not a popover"],
      ['sheet-request-services', 'Request Services', 'sheets', 'Request Services sheet'],
      ['sheet-services-requested', 'Services requested', 'sheets', 'Services requested'],
      ['sheet-trend-drop', 'Trend: sudden drop', 'trend', 'Performance sheet — the trend with a sudden drop'],
      ['sheet-trend-spike', 'Trend: one day spike', 'trend', 'Performance sheet — the trend with a one-day spike'],
      ['sheet-trend-recover', 'Trend: down then back up', 'trend', 'Performance sheet — the trend down, then back up'],
      ['sheet-trend-no-data', 'Trend: no data yet', 'trend', 'Performance sheet — no trend data yet'],
      ['sheet-filters', 'Filter sheet', 'filtering', 'Filter sheet'],
      ['sheet-filters-full', 'Filter sheet', 'filtering', 'Filter sheet — the whole sheet, down to the price and area ranges', { full: true }],
      ['sheet-sort', 'Sort sheet', 'filtering', 'Sort sheet'],
      ['skeleton-filtering', 'Listing list', 'filtering', 'Filtering skeleton — replaces the card list for 1.8s, "Filtering 65 listings..." (02’s Filtering skeleton chip shows the sort skeleton instead)', { build: 'window.__pfBuild.runFiltering()', wait: 200, at: 300 }],
      ['sheet-location-search', 'Location search', 'filtering', 'Location search'],
      ['sheet-location-no-match', 'Location: no match', 'filtering', 'Location search — no match'],
      ['empty-active', 'No active listings', 'empty', 'Empty: no active listings yet — Post a Listing, See how scores work'],
      ['empty-draft', 'No drafts', 'empty', 'Empty: no drafts saved'],
      ['empty-pending', 'No pending listings', 'empty', 'Empty: nothing waiting for approval'],
      ['empty-removed', 'No removed listings', 'empty', 'Empty: no removed listings'],
      ['empty-filter', 'No filter results', 'empty', 'Empty: no listings match these filters'],
      ['offline', 'No internet', 'empty', 'Error: no internet connection'],
      ['non-package', 'Not a package user', 'empty', 'Not a package user — the package upsell'],
      ['non-package-empty', 'Not a package user, no listings', 'empty', 'Not a package user, and no listings'],
      ['tab-draft', 'Draft tab', 'tabs', 'Draft tab — completion'],
      ['tab-pending', 'Pending tab', 'tabs', 'Pending tab — waiting'],
      ['tab-removed', 'Removed tab', 'tabs', 'Removed tab — recovery'],
      ...[['tab-draft', 'Draft tab', 'Draft tab — every draft'], ['tab-pending', 'Pending tab', 'Pending tab — every listing waiting'], ['tab-removed', 'Removed tab', 'Removed tab — every removed listing']].map(([n, chip, note]) => [`${n}-full`, chip, 'tabs', note, { full: true }]),
      ['tour', 'Onboarding tour', 'onboarding', 'Onboarding tour, the intro card — My Listings has a new look'],
      ['tour-no-listings', 'Tour with no listings', 'onboarding', 'Onboarding tour with no listings, the intro card — My Listings has a new look'],
    ].map(([name, chip, group, note, more = {}]) => ({ name, group, via: { section: '02 · INTERACTIVE', press: ['Reset', chip], ...(more.build ? { build: more.build, wait: more.wait } : {}), ...(more.settle != null ? { settle: more.settle } : {}) }, how: name === 'skeleton-filtering' ? 'prototype · apply a filter (the build runs its 1.8s filtering state)' : `02 · ${chip}${more.build ? ', then the build set as the note says' : ''}`, note, ...(more.full ? { full: true } : {}), ...(more.at != null ? { at: more.at } : {}) })),

    /* the Ad License tab: drawn by the build, but 02's chip asks for a tab it does not know ("license",
       not "adlicense"), so the tab is selected in the build itself */
    ...[['', false, 'Ad License tab — process: five requests, their status, Request ID and Deed'], ['-full', true, 'Ad License tab — every request']].map(([suffix, full, note]) => ({ name: `tab-ad-license-requests${suffix}`, group: 'tabs', via: { section: '02 · INTERACTIVE', press: ['Reset', 'Listing list'], build: "window.__pfBuild.setState({ tab: 'adlicense' })", wait: 1500 }, ...(full ? { full: true } : {}), how: 'prototype · the Ad License tab (02’s chip selects "license", a tab the build does not have)', note })),
    /* Mark as Booked — drawn by neither build: derived, in the Request Services sheet's chrome */
    ...[['', null, null, 'Mark as Booked sheet — daily rentals only: pick the check-in date'], ['-range', 11, 14, 'Mark as Booked sheet — a stay picked: Sep 11 to Sep 14']].map(([suffix, s0, e0, note]) => ({
      name: `sheet-mark-as-booked${suffix}`, group: 'sheets', derived: BOOKING_SOURCE('mobile'),
      via: { section: '02 · INTERACTIVE', press: ['Reset', 'Listing list'], build: `window.__pfBuild.setState({ svcOpen: true, caseKey: 'dailyRental', menuKey: null, bookMonth: 8, bookKind: 'Booked by guest', bookStart: ${JSON.stringify(s0)}, bookEnd: ${JSON.stringify(e0)} })`, wait: 1500 },
      derive: BOOKING('mobile'), how: 'derived · the daily rental card\'s row menu → Mark as Booked (the build has its logic, not its template)', note: `${note} [derived]` })),
    { name: 'toast-booked', group: 'sheets', via: { section: '02 · INTERACTIVE', press: ['Reset', 'Listing list'], build: `(() => { const b = window.__pfBuild; b.setState({ caseKey: 'dailyRental', bookMonth: 8, bookKind: 'Booked by guest', bookStart: 11, bookEnd: 14 }); setTimeout(() => { const v = b.renderVals(); v.confirmBooking && v.confirmBooking({ stopPropagation() {} }); }, 300); })()`, wait: 900 }, at: 200, how: 'prototype · Mark as Booked → confirm (the build\'s own toast)', note: 'After Mark as Booked: the build\'s toast' },

    /* each case's performance sheet — as tapping its card opens it */
    ...CASES.map(([key, name, label]) => ({ name: `sheet-case-${name}`, group: 'cases', via: { section: '02 · INTERACTIVE', press: ['Reset', 'Listing list'], build: `window.__pfBuild.setState({ open: true, caseKey: '${key}' })`, wait: 1800 }, how: `prototype · tap the ${label} card`, note: `Performance sheet — case: ${label.replace(/ case$/i, '').toLowerCase()}` })),

    /* the prototype: moments only a tap reaches */
    ...[
      ['sheet-delete', "window.__pfBuild.setState({ delKey: 'highImp', menuKey: null })", 'prototype · the first card’s row menu → Delete Listing', 'Delete listing — the reasons'],
      ['sheet-trucheck', "window.__pfBuild.setState({ truKey: 'highImp', menuKey: null })", 'prototype · TruCheck on the first card', 'TruCheck — the first card, not yet verified'],
      ['sheet-trucheck-rejected', "window.__pfBuild.setState({ truKey: 'allBad', menuKey: null })", 'prototype · TruCheck on the All bad card (the second)', 'TruCheck — a request that was rejected'],
      ['sheet-range', "window.__pfBuild.setState({ open: true, rangeOpen: true })", 'prototype · Last 30 Days, in the performance sheet', "The performance sheet's date range"],
      ...[1, 2, 3, 4].map((i) => [`tour-${i + 1}`, `window.__pfBuild.placeTour(${i})`, `prototype · the onboarding tour, step ${i + 1} of 5`, ['', 'Onboarding tour, spotlight 1 / 4 — Performance and improvements', 'Onboarding tour, spotlight 2 / 4 — Filter and sort from one bar', 'Onboarding tour, spotlight 3 / 4 — Sort by what matters', 'Onboarding tour, spotlight 4 / 4 — See how the score works'][i], 'Onboarding tour']),
      ...[1, 2, 3].map((i) => [`tour-no-listings-${i + 1}`, `window.__pfBuild.placeTour(${i})`, `prototype · the onboarding tour with no listings, step ${i + 1} of 4`, ['', 'Onboarding tour with no listings, spotlight 1 / 3 — Filter and sort from one bar', 'Onboarding tour with no listings, a full card — Post your first listing', 'Onboarding tour with no listings, a full card — See how the score works'][i], 'Tour with no listings']),
    ].map(([name, build, how, note, chip]) => ({ name, group: 'prototype', via: { section: '02 · INTERACTIVE', press: ['Reset', chip || 'Listing list'], build, wait: 2200 }, how, note,
      /* the product header replaces the artboard's top, so a spotlight is measured again once it has */
      ...(/placeTour/.test(build) ? { after: build, afterWait: 2000 } : {}) })),
  ],
};
