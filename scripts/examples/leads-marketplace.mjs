#!/usr/bin/env node
/**
 * Compose the Leads Marketplace hi-fi (skill/examples/leads-marketplace/marketplace.html) — the
 * worked example of a new page in the 2.0 look, built the v2 way:
 *   - the compiled 2.0 page (pages/listings-new.html) keeps the product's shell, its page
 *     containers and their inline styles;
 *   - what the page draws inside them is new, from the pattern kit (kit/kit.css), with the
 *     build's own icons copied by their data-dc-tpl (every source named in pf-also);
 *   - it is wired by kit/runtime.js to the data, state and actions the wireframe agreed.
 *
 * The DOM work runs in a headless browser's DOMParser, so no page script runs and nothing is
 * laid out: the file is the compiled file, edited.
 *
 *   node scripts/examples/leads-marketplace.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SK = join(ROOT, 'skill');
const OUT = join(SK, 'examples', 'leads-marketplace');
const read = (p) => readFileSync(join(SK, p), 'utf8');
const BASE = 'pages/listings-new.html';
const ALSO = ['pages/listings-new/modal-request-services.html', 'pages/listings-new/empty-active.html', 'pages/listings-new/empty-filter.html', 'pages/listings-new/offline.html'];

const b = await chromium.launch();
const page = await b.newPage();
await page.setContent('<!doctype html><title>compose</title>');

/* the build's own icons, by data-dc-tpl, from the files pf-also names */
const icon = (file, tpl) => page.evaluate(([html, tpl]) => {
  const d = new DOMParser().parseFromString(html, 'text/html');
  const e = d.querySelector(`svg[data-dc-tpl="${tpl}"]`);
  if (!e) throw new Error('no svg ' + tpl);
  e.querySelectorAll('*').forEach((x) => ['data-pf-src', 'data-pf-i', 'data-pf-c'].forEach((a) => x.removeAttribute(a)));
  return e.outerHTML;
}, [read(file), tpl]);
const I = {
  chevron: await icon(BASE, '111'),
  sort: await icon(BASE, '207'),
  pin: await icon(BASE, '330'),
  close: await icon(ALSO[0], '2126'),
  coin: await icon(ALSO[0], '2177'),
  info: await icon(ALSO[0], '2194'),
  empty: await icon(ALSO[1], '993'),
  filter: await icon(ALSO[2], '1012'),
  offline: await icon(ALSO[3], '975'),
};
const svg = (s, cls) => s.replace('<svg ', `<svg class="${cls}" aria-hidden="true" `);

/* ── what the page draws: the wireframe's structure, in the kit's 2.0 patterns ─────────── */
const amount = (field) => `<span class="pfk-amount pfk-value--strong"><i class="pfk-riyal" aria-label="SAR"></i><span data-pf-text="$.${field}" data-pf-fmt="n"></span></span>`;
const contact = `
          <div class="pfk-stack pfk-stack--md">
            <div class="pfk-stack pfk-teaser" data-pf-show="$.status!=bought" aria-hidden="true"><span class="pfk-value" data-pf-data>Hidden Contact</span><span class="pfk-meta" data-pf-data>+966 5X XXX XXXX</span></div>
            <div class="pfk-stack" data-pf-show="$.status=bought"><span class="pfk-inline"><span class="pfk-value" data-pf-text="$.name"></span><span class="pfk-pill pfk-pill--good" data-pf-new-copy>Bought</span></span><span class="pfk-meta" data-pf-text="$.phone"></span></div>
            <span class="pfk-meta" data-pf-show="$.status!=bought" data-pf-text="$.addedLabel"></span>
            <span class="pfk-meta" data-pf-show="$.status=bought" data-pf-new-copy><span>Bought by <span data-pf-text="$.buyer"></span> · <span data-pf-text="$.when"></span></span></span>
          </div>`;
const action = (kind) => `
          <div class="pfk-td pfk-td--end">
            <button class="pfk-btn" type="button" data-pf-show="$.status=open" data-pf-set="lead=$.id; price=$.credits; leadKind=${kind}" data-pf-do="buy">${I.coin}<span>Buy for <span data-pf-text="$.credits"></span> Credits</span></button>
            <button class="pfk-btn pfk-btn--soft" type="button" data-pf-show="$.status=bought" data-pf-page="/lms/leads"><span data-pf-new-copy>View in TruLeads →</span></button>
            <span class="pfk-meta" data-pf-show="$.status=gone" data-pf-new-copy>No longer available</span>
          </div>`;
const empties = (list, source) => `
        <div class="pfk-empty" data-pf-show="net=ready && total.${list}=0">
          <div class="pfk-empty__art">${I.empty}</div>
          <p class="pfk-empty__title" data-pf-new-copy>No ${list} leads right now</p>
          <p class="pfk-empty__text" data-pf-new-copy>New ${source} arrive through the day. Check back soon — new leads show here first.</p>
          <div class="pfk-empty__actions"><button class="pfk-btn pfk-btn--secondary" type="button" data-pf-do="retry" data-pf-new-copy>Refresh</button></div>
        </div>
        <div class="pfk-empty" data-pf-show="net=ready && total.${list}>0 && count.${list}=0">
          <div class="pfk-empty__art">${I.filter}</div>
          <p class="pfk-empty__title" data-pf-new-copy>No leads match these filters</p>
          <p class="pfk-empty__text" data-pf-new-copy>Try another city or price range, or clear the filters to see every open lead.</p>
          <div class="pfk-empty__actions"><button class="pfk-btn" type="button" data-pf-do="clear-filters">Clear filters</button></div>
        </div>
        <div class="pfk-empty" data-pf-show="net=error">
          <div class="pfk-empty__art pfk-empty__art--grey">${I.offline}</div>
          <p class="pfk-empty__title">No internet connection</p>
          <p class="pfk-empty__text" data-pf-new-copy>The leads could not load. Check your connection and try again.</p>
          <div class="pfk-empty__actions"><button class="pfk-btn" type="button" data-pf-do="retry">Try Again</button></div>
        </div>`;
const beds = `<span class="pfk-value"><span data-pf-text="$.beds"></span> <span data-pf-show="$.beds=1">Bed</span><span data-pf-show="$.beds!=1">Beds</span> · <span data-pf-text="$.baths"></span> <span data-pf-show="$.baths=1">Bath</span><span data-pf-show="$.baths!=1">Baths</span></span>`;

const TABLES = `
      <div class="pfk-table" data-pf-show="tab=owner" style="--pfk-cols: minmax(0, 1.35fr) minmax(0, 1.25fr) minmax(0, 1fr) minmax(0, 0.85fr) minmax(0, 1.1fr) 216px">
        <div class="pfk-thead" role="row"><div class="pfk-th" role="columnheader">Contact</div><div class="pfk-th" role="columnheader">Property</div><div class="pfk-th" role="columnheader">Price</div><div class="pfk-th" role="columnheader">Beds &amp; Baths</div><div class="pfk-th" role="columnheader">Location</div><div class="pfk-th pfk-th--end" role="columnheader">Actions</div></div>
        <div data-pf-show="net=loading" data-pf-skeleton="owner" data-pf-rows="6"></div>
        <div data-pf-list="owner" data-pf-show="net=ready" data-pf-filter="purpose=@filter.purpose; city=@filter.city; band=@filter.band" data-pf-sort="@sort">
          <template>
            <div class="pfk-tr" role="row" data-pf-class="pfk-tr--good: $.status=bought; pfk-tr--muted: $.status=gone">
              <div class="pfk-td">${contact}</div>
              <div class="pfk-td"><div class="pfk-stack pfk-stack--md"><span><span class="pfk-pill pfk-pill--neutral" data-pf-text="$.purposeLabel"></span></span><span class="pfk-value" data-pf-text="$.intent"></span></div></div>
              <div class="pfk-td"><div class="pfk-stack"><span class="pfk-label" data-pf-text="$.priceLabel"></span>${amount('price')}</div></div>
              <div class="pfk-td">${beds}</div>
              <div class="pfk-td"><span class="pfk-inline">${svg(I.pin, 'pfk-icon')}<span class="pfk-value"><span data-pf-text="$.district"></span>, <span data-pf-text="$.city"></span></span></span></div>${action('owner')}
            </div>
          </template>
        </div>${empties('owner', 'owners from Sell with Bayut')}
      </div>
      <div class="pfk-table" data-pf-show="tab=seeker" style="--pfk-cols: minmax(0, 1.35fr) minmax(0, 1.25fr) minmax(0, 1.15fr) minmax(0, 0.85fr) minmax(0, 0.8fr) 216px">
        <div class="pfk-thead" role="row"><div class="pfk-th" role="columnheader">Contact</div><div class="pfk-th" role="columnheader" data-pf-new-copy>Looking For</div><div class="pfk-th" role="columnheader" data-pf-new-copy>Budget</div><div class="pfk-th" role="columnheader">Beds &amp; Baths</div><div class="pfk-th" role="columnheader">Location</div><div class="pfk-th pfk-th--end" role="columnheader">Actions</div></div>
        <div data-pf-show="net=loading" data-pf-skeleton="seeker" data-pf-rows="6"></div>
        <div data-pf-list="seeker" data-pf-show="net=ready" data-pf-filter="purpose=@filter.purpose; city=@filter.city; band=@filter.band; types~@filter.type" data-pf-sort="@sort">
          <template>
            <div class="pfk-tr" role="row" data-pf-class="pfk-tr--good: $.status=bought; pfk-tr--muted: $.status=gone">
              <div class="pfk-td">${contact}</div>
              <div class="pfk-td"><div class="pfk-stack pfk-stack--md"><span><span class="pfk-pill pfk-pill--neutral" data-pf-text="$.purposeLabel"></span></span><span class="pfk-value" data-pf-text="$.types"></span></div></div>
              <div class="pfk-td"><div class="pfk-stack"><span class="pfk-label" data-pf-text="$.priceLabel"></span><span class="pfk-amount pfk-value--strong"><i class="pfk-riyal" aria-label="SAR"></i><span><span data-pf-text="$.min" data-pf-fmt="n"></span> – <span data-pf-text="$.max" data-pf-fmt="n"></span></span></span></div></div>
              <div class="pfk-td"><span class="pfk-value"><span data-pf-text="$.beds"></span> Beds · <span data-pf-text="$.baths"></span> Baths</span></div>
              <div class="pfk-td"><span class="pfk-inline">${svg(I.pin, 'pfk-icon')}<span class="pfk-value" data-pf-text="$.city"></span></span></div>${action('seeker')}
            </div>
          </template>
        </div>${empties('seeker', 'buyers and tenants from Find My Property')}
      </div>`;

const seg = (opts) => opts.map(([v, l]) => `<button class="pfk-seg__opt" type="button" data-pf-set="filter.purpose=${v || "''"}; filter.band=''; filter.bandLabel=''" data-pf-class="pfk-seg__opt--on: ${v ? 'filter.purpose=' + v : '!filter.purpose'}">${l}</button>`).join('');
const menuItems = (key, items, labelKey) => items.map(([v, l]) => `<button class="pfk-menu__item" type="button" data-pf-set="${key}=${v}${labelKey ? `; ${labelKey}='${l}'` : ''}; menu=''" data-pf-class="pfk-menu__item--on: ${key}=${v}">${l}</button>`).join('');
const field = (menu, key, label, dflt, extra = '') => `
          <div class="pfk-anchor"${extra}>
            <button class="pfk-select" type="button" data-pf-menu="${menu}" data-pf-class="pfk-select--set: ${key}"><span class="pfk-select__label" data-pf-text="${label}" data-pf-default="${dflt}"></span>${svg(I.chevron, 'pfk-select__chevron')}</button>
            <div class="pfk-menu" data-pf-menu-panel="${menu}">MENU_${menu}</div>
          </div>`;
const FILTERS = `
        <div class="pfk-row">
          <div class="pfk-seg" role="group" aria-label="Purpose" data-pf-show="tab=owner">${seg([['', 'All'], ['sale', 'For Sale'], ['rent', 'For Rent']])}</div>
          <div class="pfk-seg" role="group" aria-label="Purpose" data-pf-show="tab=seeker">${seg([['', 'All'], ['buy', 'Buy'], ['rent', 'Rent']])}</div>
          ${field('city', 'filter.city', 'filter.city', 'Select City')}
          ${field('band', 'filter.band', 'filter.bandLabel', 'Select Price')}
          ${field('type', 'filter.type', 'filter.type', 'Select Property Types', ' data-pf-show="tab=seeker"')}
        </div>`
  .replace('MENU_city', `<button class="pfk-menu__item" type="button" data-pf-set="filter.city=''; menu=''" data-pf-class="pfk-menu__item--on: !filter.city">Any city</button><div data-pf-list="cities" data-pf-count="cities"><template><button class="pfk-menu__item" type="button" data-pf-set="filter.city=$.value; menu=''" data-pf-class="pfk-menu__item--on: filter.city=$.value" data-pf-text="$.label"></button></template></div>`)
  .replace('MENU_band', `<button class="pfk-menu__item" type="button" data-pf-set="filter.band=''; filter.bandLabel=''; menu=''">Any price</button><div data-pf-show="filter.purpose!=rent">${menuItems('filter.band', [['u1m', 'Under 1M'], ['1-3m', '1M – 3M'], ['o3m', 'Over 3M']], 'filter.bandLabel')}</div><div data-pf-show="filter.purpose=rent">${menuItems('filter.band', [['u50k', 'Under 50K a year'], ['50-100k', '50K – 100K a year'], ['o100k', 'Over 100K a year']], 'filter.bandLabel')}</div>`)
  .replace('MENU_type', `<button class="pfk-menu__item" type="button" data-pf-set="filter.type=''; menu=''">Any type</button>${menuItems('filter.type', [['Apartment', 'Apartment'], ['Villa', 'Villa'], ['Duplex', 'Duplex'], ['Townhouse', 'Townhouse'], ['Land', 'Land']])}`);
const chip = (show, name, value, clear) => `<button class="pfk-chip" type="button" data-pf-show="${show}" data-pf-set="${clear}"><span class="pfk-chip__name">${name}:</span> <span data-pf-text="${value}"></span>${svg(I.close, 'pfk-chip__x')}</button>`;
const CHIPS = `<div class="pfk-chips">
          ${chip('filter.purpose', 'Purpose', 'filter.purpose', "filter.purpose=''; filter.band=''; filter.bandLabel=''")}
          ${chip('filter.city', 'City', 'filter.city', "filter.city=''")}
          ${chip('filter.band', 'Price', 'filter.bandLabel', "filter.band=''; filter.bandLabel=''")}
          ${chip('filter.type', 'Type', 'filter.type', "filter.type=''")}
          <button class="pfk-clear" type="button" data-pf-do="clear-filters">Clear All</button>
        </div>`;
const TABS = `
        <div class="pfk-tabs" role="tablist">
          <button class="pfk-tab" type="button" role="tab" data-pf-do="tab-owner" data-pf-class="pfk-tab--on: tab=owner" data-pf-attr="aria-selected: tab=owner"><span data-pf-new-copy>Owner Leads</span><span class="pfk-tab__count" data-pf-text="total.owner"></span></button>
          <button class="pfk-tab" type="button" role="tab" data-pf-do="tab-seeker" data-pf-class="pfk-tab--on: tab=seeker" data-pf-attr="aria-selected: tab=seeker"><span data-pf-new-copy>Seeker Leads</span><span class="pfk-tab__count" data-pf-text="total.seeker"></span></button>
        </div>`;
const SORT = `
        <div class="pfk-row">
          <span class="pfk-meta" data-pf-show="role=owner" data-pf-new-copy><span><b class="pfk-value" data-pf-text="balance" data-pf-fmt="n"></b> credits available</span></span>
          <span class="pfk-meta" data-pf-show="role=staff" data-pf-new-copy><span>Your limit: <b class="pfk-value" data-pf-text="cap"></b> credits</span></span>
          <button class="pfk-btn pfk-btn--link" type="button" data-pf-page="/credits-usage" data-pf-new-copy>Top up</button>
          <div class="pfk-anchor">
            <button class="pfk-outline" type="button" data-pf-menu="sort">${I.sort}<span data-pf-show="sort=added">Newest First</span><span data-pf-show="sort=-price">Highest Price</span><span data-pf-show="sort=price">Lowest Price</span></button>
            <div class="pfk-menu pfk-menu--end" data-pf-menu-panel="sort">${menuItems('sort', [['added', 'Newest First'], ['-price', 'Highest Price'], ['price', 'Lowest Price']])}</div>
          </div>
        </div>`;
const INTRO = `
      <div class="pfk-callout" data-pf-show="intro">
        ${I.info}
        <div class="pfk-grow"><b class="pfk-value" data-pf-new-copy>Buy leads straight from Bayut</b><br><span data-pf-new-copy>Owners from Sell with Bayut want an agent; seekers from Find My Property say what they want. Each lead costs credits — once your agency buys it, the contact unlocks and the lead is yours in TruLeads.</span></div>
        <button class="pfk-btn pfk-btn--secondary" type="button" data-pf-do="dismiss-intro" data-pf-new-copy>Got it</button>
      </div>`;
const summary = (list) => `
          <div data-pf-list="${list}" data-pf-filter="id=@lead" data-pf-count="dialog" data-pf-show="leadKind=${list}"><template>
            <div class="pfk-summary">
              <span class="pfk-inline"><span class="pfk-pill pfk-pill--neutral" data-pf-text="$.purposeLabel"></span><span class="pfk-meta" data-pf-text="$.expires"></span></span>
              ${list === 'owner' ? amount('price') : `<span class="pfk-value" data-pf-text="$.types"></span><span class="pfk-amount pfk-value--strong"><i class="pfk-riyal" aria-label="SAR"></i><span><span data-pf-text="$.min" data-pf-fmt="n"></span> – <span data-pf-text="$.max" data-pf-fmt="n"></span></span></span>`}
              <span class="pfk-meta">${list === 'owner' ? '<span><span data-pf-text="$.beds"></span> Beds · <span data-pf-text="$.baths"></span> Baths · <span data-pf-text="$.district"></span>, <span data-pf-text="$.city"></span></span>' : '<span><span data-pf-text="$.beds"></span> Beds · <span data-pf-text="$.city"></span></span>'}</span>
            </div>
          </template></div>`;
const dialog = (id, title, body, foot) => `
  <div class="pfk-mask" data-pf-overlay="${id}" data-pf-scrim>
    <div class="pfk-dialog" role="dialog" aria-modal="true" aria-label="${title.replace(/<[^>]+>/g, '')}">
      <div class="pfk-dialog__head"><p class="pfk-dialog__title">${title}</p><button class="pfk-dialog__close" type="button" data-pf-close aria-label="Close">${I.close}</button></div>
      <div class="pfk-dialog__body">${body}</div>
      <div class="pfk-dialog__foot">${foot}</div>
    </div>
  </div>`;
const DIALOGS = [
  dialog('buy', '<span data-pf-show="leadKind=owner" data-pf-new-copy>Buy Owner Lead</span><span data-pf-show="leadKind=seeker" data-pf-new-copy>Buy Seeker Lead</span>',
    `${summary('owner')}${summary('seeker')}
        <div class="pfk-stack pfk-stack--md">
          <div class="pfk-kv"><span data-pf-new-copy>Lead price</span><b><span><span data-pf-text="price"></span> Credits</span></b></div>
          <div class="pfk-kv" data-pf-show="role=owner"><span>Available credits</span><b data-pf-text="balance" data-pf-fmt="n"></b></div>
          <div class="pfk-kv" data-pf-show="role=staff"><span data-pf-new-copy>Your credit limit</span><b data-pf-text="cap"></b></div>
        </div>
        <p class="pfk-dialog__note" data-pf-new-copy>The contact's name and phone unlock right after purchase, and the lead is added to your TruLeads. Purchased leads can't be refunded.</p>`,
    `<button class="pfk-btn pfk-btn--secondary" type="button" data-pf-close>Cancel</button><button class="pfk-btn" type="button" data-pf-do="confirm" data-pf-busy="600"><span>Buy for <span data-pf-text="price"></span> Credits</span></button>`),
  dialog('insufficient', '<span data-pf-new-copy>Not Enough Credits</span>',
    `<div class="pfk-callout pfk-callout--warn">${I.info}<span data-pf-new-copy><span>You need <b data-pf-text="{@price-@balance}"></b> more credits to buy this lead. Top up, then come back to buy it.</span></span></div>
        <div class="pfk-kv"><span>Available credits</span><b data-pf-text="balance" data-pf-fmt="n"></b></div>`,
    `<button class="pfk-btn pfk-btn--secondary" type="button" data-pf-close>Cancel</button><button class="pfk-btn" type="button" data-pf-page="/credits-usage">Top-Up your Credits</button>`),
  dialog('cap', '<span data-pf-new-copy>Over Your Credit Limit</span>',
    `<div class="pfk-callout pfk-callout--warn">${I.info}<span data-pf-new-copy><span>This lead costs <b data-pf-text="price"></b> credits and your agency set your limit to <b data-pf-text="cap"></b>. Ask your agency owner to raise it.</span></span></div>`,
    `<button class="pfk-btn" type="button" data-pf-close>OK</button>`),
].join('');
const TOASTS = `
  <template data-pf-toast="bought"><div class="pfk-toast" data-pf-new-copy>Lead added to TruLeads — the contact's name and phone are unlocked.</div></template>
  <template data-pf-toast="gone"><div class="pfk-toast" data-pf-new-copy>This lead is no longer available. You weren't charged.</div></template>`;

/* ── the compiled page, edited ────────────────────────────────────────────── */
const html = await page.evaluate(({ html, parts, base, also }) => {
  const d = new DOMParser().parseFromString(html, 'text/html');
  const q = (s) => d.querySelector(s), tpl = (t) => q(`[data-dc-tpl="${t}"]`);
  const frag = (s) => { const t = d.createElement('template'); t.innerHTML = s; return t.content; };
  /* what it is, where it came from */
  q('title').textContent = 'Leads Marketplace — Profolio 2.0 (extended)';
  q('meta[name="pf-compiled"]')?.remove();
  const head = q('head');
  head.insertBefore(frag(`<meta name="pf-base" content="${base}">\n<meta name="pf-also" content="${also.join(', ')}">\n<meta name="pf-theme" content="2.0 extended to a new page — borrowed tokens, [TBC] designer sign-off">`), head.firstChild.nextSibling);
  d.querySelectorAll('link[rel="stylesheet"]').forEach((l) => l.setAttribute('href', l.getAttribute('href').replace(/^\.\.\/css\//, '../../css/')));
  head.appendChild(frag('<link rel="stylesheet" href="../../kit/kit.css">'));
  d.querySelectorAll('script').forEach((s) => s.remove());
  /* the shell: its title, and a new rail item under TruLeads (the Credits & Packages icon, [TBC]) */
  const title = q('.navbar-page-title');
  title.replaceChildren(frag('<span data-pf-new-copy>Leads Marketplace</span>'));
  const leads = q('li[data-menu-id$="-leads"]'), shop = q('li[data-menu-id$="-prop-shop"]');
  const item = leads.cloneNode(true);
  item.setAttribute('data-menu-id', leads.getAttribute('data-menu-id').replace(/-leads$/, '-leads-marketplace'));
  item.setAttribute('title', 'Leads Marketplace');
  item.setAttribute('data-pf-page', 'marketplace');
  const walker = d.createTreeWalker(item, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.textContent.trim() === 'TruLeads') { const sp = d.createElement('span'); sp.setAttribute('data-pf-new-copy', ''); sp.textContent = 'Leads Marketplace'; n.replaceWith(sp); break; }
  const icon = item.querySelector('.anticon'), shopIcon = shop && shop.querySelector('.anticon');
  if (icon && shopIcon) icon.replaceWith(shopIcon.cloneNode(true));
  d.querySelectorAll('.pf-menu-item-selected').forEach((e) => e.classList.remove('pf-menu-item-selected'));
  item.classList.add('pf-menu-item-selected');
  leads.after(item);
  /* My Listings' own drawers and their scrims: not this page */
  ['1021', '1491', '1492', '1745', '1746'].forEach((t) => tpl(t)?.remove());
  /* the rail's language switch: the product turns Arabic here, which is not compiled */
  d.querySelectorAll('.sidebar-bottom-actions button:not([data-pf-go])').forEach((btn) => btn.setAttribute('data-pf-toast', 'Switches Profolio to Arabic — this prototype is English only (Arabic is not compiled yet)'));
  /* the filter card: its row and its applied-filter chips */
  const row = tpl('84');
  row.replaceChildren(frag(parts.filters));
  const chips = tpl('182');
  chips.replaceChildren(frag(parts.chips));
  tpl('179').setAttribute('data-pf-show', 'filter.purpose || filter.city || filter.band || filter.type');
  /* the list card: first-visit note above it, tabs and sort in its header, the tables below */
  tpl('83').before(frag(parts.intro));
  tpl('193').replaceWith(frag(parts.tabs));
  tpl('201').replaceWith(frag(parts.sort));
  tpl('225').remove();
  tpl('281').replaceWith(frag(parts.tables));
  /* the dialogs and the toasts, in the page's root (a transform makes it the viewport) */
  tpl('4').appendChild(frag(parts.dialogs + parts.toasts));
  d.body.appendChild(frag('<script type="application/json" id="pf-state" data-src="state.json"></script>\n<script type="application/json" id="pf-data" data-src="data.json"></script>\n<script type="application/json" id="pf-actions" data-src="actions.json"></script>\n<script src="../../kit/runtime.js"></script>'));
  return '<!doctype html>\n' + d.documentElement.outerHTML;
}, { html: read(BASE), parts: { filters: FILTERS, chips: CHIPS, tabs: TABS, sort: SORT, intro: INTRO, tables: TABLES, dialogs: DIALOGS, toasts: TOASTS }, base: BASE, also: ALSO });

writeFileSync(join(OUT, 'marketplace.html'), html);
console.log(`  examples/leads-marketplace/marketplace.html — ${(html.length / 1024).toFixed(0)} KB`);

/* ── the phone (360, the 2.0 phone): cards, a filter strip, sheets ───────────────────────── */
const MBASE = 'pages/listings-new.mobile.html';
const MI = { chevron: await icon(MBASE, '53'), filter: await icon(MBASE, '31') };
const card = (list, kind) => `
        <div class="pfk-list" data-pf-list="${list}" data-pf-show="net=ready" data-pf-filter="purpose=@filter.purpose; city=@filter.city; band=@filter.band${list === 'seeker' ? '; types~@filter.type' : ''}" data-pf-sort="@sort">
          <template>
            <article class="pfk-lead" data-pf-class="pfk-lead--good: $.status=bought; pfk-lead--muted: $.status=gone">
              <div class="pfk-row pfk-between">
                <div class="pfk-stack pfk-teaser" data-pf-show="$.status!=bought" aria-hidden="true"><span class="pfk-value" data-pf-data>Hidden Contact</span><span class="pfk-meta" data-pf-data>+966 5X XXX XXXX</span></div>
                <div class="pfk-stack" data-pf-show="$.status=bought"><span class="pfk-inline"><span class="pfk-value" data-pf-text="$.name"></span><span class="pfk-pill pfk-pill--good" data-pf-new-copy>Bought</span></span><span class="pfk-meta" data-pf-text="$.phone"></span></div>
                <span class="pfk-pill pfk-pill--neutral" data-pf-text="$.purposeLabel"></span>
              </div>
              ${list === 'owner' ? `<div class="pfk-stack"><span class="pfk-label" data-pf-text="$.priceLabel"></span>${amount('price')}</div>` : `<div class="pfk-stack"><span class="pfk-value" data-pf-text="$.types"></span><span class="pfk-label" data-pf-text="$.priceLabel"></span><span class="pfk-amount pfk-value--strong"><i class="pfk-riyal" aria-label="SAR"></i><span><span data-pf-text="$.min" data-pf-fmt="n"></span> – <span data-pf-text="$.max" data-pf-fmt="n"></span></span></span></div>`}
              <span class="pfk-inline">${svg(I.pin, 'pfk-icon')}<span class="pfk-meta">${list === 'owner' ? '<span data-pf-text="$.beds"></span> Beds · <span data-pf-text="$.baths"></span> Baths · <span data-pf-text="$.district"></span>, <span data-pf-text="$.city"></span>' : '<span data-pf-text="$.beds"></span> Beds · <span data-pf-text="$.city"></span>'}</span></span>
              <span class="pfk-meta" data-pf-show="$.status!=bought" data-pf-text="$.addedLabel"></span>
              <span class="pfk-meta" data-pf-show="$.status=bought" data-pf-new-copy><span>Bought by <span data-pf-text="$.buyer"></span> · <span data-pf-text="$.when"></span></span></span>
              <button class="pfk-btn pfk-btn--block" type="button" data-pf-show="$.status=open" data-pf-set="lead=$.id; price=$.credits; leadKind=${kind}" data-pf-do="buy">${I.coin}<span>Buy for <span data-pf-text="$.credits"></span> Credits</span></button>
              <button class="pfk-btn pfk-btn--soft pfk-btn--block" type="button" data-pf-show="$.status=bought" data-pf-page="/lms/leads"><span data-pf-new-copy>View in TruLeads →</span></button>
              <span class="pfk-meta" data-pf-show="$.status=gone" data-pf-new-copy>No longer available</span>
            </article>
          </template>
        </div>`;
const MLISTS = `
      <div class="pfk-callout" data-pf-show="intro">${I.info}<div class="pfk-grow"><b class="pfk-value" data-pf-new-copy>Buy leads straight from Bayut</b><br><span data-pf-new-copy>Each lead costs credits. Once your agency buys it, the contact unlocks and it's yours in TruLeads.</span><br><button class="pfk-btn pfk-btn--link" type="button" data-pf-do="dismiss-intro" data-pf-new-copy>Got it</button></div></div>
      <div class="pfk-row pfk-between pfk-bar">
        <span class="pfk-meta" data-pf-show="role=owner" data-pf-new-copy><span><b class="pfk-value" data-pf-text="balance" data-pf-fmt="n"></b> credits available</span></span>
        <span class="pfk-meta" data-pf-show="role=staff" data-pf-new-copy><span>Your limit: <b class="pfk-value" data-pf-text="cap"></b> credits</span></span>
        <button class="pfk-btn pfk-btn--link" type="button" data-pf-page="/credits-usage" data-pf-new-copy>Top up</button>
      </div>
      <div data-pf-show="tab=owner">
        <div class="pfk-list" data-pf-show="net=loading" data-pf-skeleton="owner" data-pf-rows="3"></div>${card('owner', 'owner')}${empties('owner', 'owners from Sell with Bayut')}
      </div>
      <div data-pf-show="tab=seeker">
        <div class="pfk-list" data-pf-show="net=loading" data-pf-skeleton="seeker" data-pf-rows="3"></div>${card('seeker', 'seeker')}${empties('seeker', 'buyers and tenants from Find My Property')}
      </div>`;
const fchip = (sheet, key, label, dflt, extra = '') => `<button class="pfk-fchip" type="button" data-pf-open="${sheet}" data-pf-class="pfk-fchip--set: ${key}"${extra}><span data-pf-text="${label}" data-pf-default="${dflt}"></span>${MI.chevron}</button>`;
const MSTRIP = `
        <div class="pfk-strip">
          <div class="pfk-seg pfk-seg--sm" role="group" aria-label="Purpose" data-pf-show="tab=owner">${seg([['', 'All'], ['sale', 'Sale'], ['rent', 'Rent']])}</div>
          <div class="pfk-seg pfk-seg--sm" role="group" aria-label="Purpose" data-pf-show="tab=seeker">${seg([['', 'All'], ['buy', 'Buy'], ['rent', 'Rent']])}</div>
          ${fchip('sheet-city', 'filter.city', 'filter.city', 'City')}
          ${fchip('sheet-band', 'filter.band', 'filter.bandLabel', 'Price')}
          ${fchip('sheet-type', 'filter.type', 'filter.type', 'Property Type', ' data-pf-show="tab=seeker"')}
          <button class="pfk-fchip" type="button" data-pf-open="sheet-sort"><span data-pf-show="sort=added">Newest First</span><span data-pf-show="sort=-price">Highest Price</span><span data-pf-show="sort=price">Lowest Price</span>${MI.chevron}</button>
          <button class="pfk-clear" type="button" data-pf-do="clear-filters" data-pf-show="filter.purpose || filter.city || filter.band || filter.type">Clear All</button>
        </div>`;
const MTABS = TABS.replace('class="pfk-tabs"', 'class="pfk-tabs pfk-tabs--sm"');
const sheet = (id, title, body) => `
  <div class="pfk-mask pfk-mask--sheet" data-pf-overlay="${id}" data-pf-scrim>
    <div class="pfk-sheet" role="dialog" aria-modal="true" aria-label="${title.replace(/<[^>]+>/g, '')}"><span class="pfk-sheet__handle"></span><p class="pfk-sheet__title">${title}</p>${body}</div>
  </div>`;
const sitems = (key, items, labelKey) => items.map(([v, l]) => `<button class="pfk-menu__item" type="button" data-pf-set="${key}=${v}${labelKey ? `; ${labelKey}='${l}'` : ''}; overlay=''" data-pf-class="pfk-menu__item--on: ${key}=${v}">${l}</button>`).join('');
const MSHEETS = [
  sheet('sheet-city', 'City', `<div class="pfk-stack"><button class="pfk-menu__item" type="button" data-pf-set="filter.city=''; overlay=''" data-pf-class="pfk-menu__item--on: !filter.city">Any city</button><div data-pf-list="cities" data-pf-count="cities-m"><template><button class="pfk-menu__item" type="button" data-pf-set="filter.city=$.value; overlay=''" data-pf-class="pfk-menu__item--on: filter.city=$.value" data-pf-text="$.label"></button></template></div></div>`),
  sheet('sheet-band', 'Price', `<div class="pfk-stack"><button class="pfk-menu__item" type="button" data-pf-set="filter.band=''; filter.bandLabel=''; overlay=''">Any price</button><div data-pf-show="filter.purpose!=rent">${sitems('filter.band', [['u1m', 'Under 1M'], ['1-3m', '1M – 3M'], ['o3m', 'Over 3M']], 'filter.bandLabel')}</div><div data-pf-show="filter.purpose=rent">${sitems('filter.band', [['u50k', 'Under 50K a year'], ['50-100k', '50K – 100K a year'], ['o100k', 'Over 100K a year']], 'filter.bandLabel')}</div></div>`),
  sheet('sheet-type', 'Property Type', `<div class="pfk-stack"><button class="pfk-menu__item" type="button" data-pf-set="filter.type=''; overlay=''">Any type</button>${sitems('filter.type', [['Apartment', 'Apartment'], ['Villa', 'Villa'], ['Duplex', 'Duplex'], ['Townhouse', 'Townhouse'], ['Land', 'Land']])}</div>`),
  sheet('sheet-sort', 'Sort By', `<div class="pfk-stack">${sitems('sort', [['added', 'Newest First'], ['-price', 'Highest Price'], ['price', 'Lowest Price']])}</div>`),
  sheet('buy', '<span data-pf-show="leadKind=owner" data-pf-new-copy>Buy Owner Lead</span><span data-pf-show="leadKind=seeker" data-pf-new-copy>Buy Seeker Lead</span>',
    `${summary('owner')}${summary('seeker')}
      <div class="pfk-stack pfk-stack--md"><div class="pfk-kv"><span data-pf-new-copy>Lead price</span><b><span><span data-pf-text="price"></span> Credits</span></b></div><div class="pfk-kv" data-pf-show="role=owner"><span>Available credits</span><b data-pf-text="balance" data-pf-fmt="n"></b></div><div class="pfk-kv" data-pf-show="role=staff"><span data-pf-new-copy>Your credit limit</span><b data-pf-text="cap"></b></div></div>
      <p class="pfk-dialog__note" data-pf-new-copy>The contact unlocks right after purchase and the lead is added to your TruLeads. Purchased leads can't be refunded.</p>
      <button class="pfk-btn pfk-btn--block" type="button" data-pf-do="confirm" data-pf-busy="600"><span>Buy for <span data-pf-text="price"></span> Credits</span></button>
      <button class="pfk-btn pfk-btn--secondary pfk-btn--block" type="button" data-pf-close>Cancel</button>`),
  sheet('insufficient', '<span data-pf-new-copy>Not Enough Credits</span>',
    `<div class="pfk-callout pfk-callout--warn">${I.info}<span data-pf-new-copy><span>You need <b data-pf-text="{@price-@balance}"></b> more credits to buy this lead.</span></span></div>
      <button class="pfk-btn pfk-btn--block" type="button" data-pf-page="/credits-usage">Top-Up your Credits</button>
      <button class="pfk-btn pfk-btn--secondary pfk-btn--block" type="button" data-pf-close>Cancel</button>`),
  sheet('cap', '<span data-pf-new-copy>Over Your Credit Limit</span>',
    `<div class="pfk-callout pfk-callout--warn">${I.info}<span data-pf-new-copy><span>This lead costs <b data-pf-text="price"></b> credits and your limit is <b data-pf-text="cap"></b>. Ask your agency owner to raise it.</span></span></div>
      <button class="pfk-btn pfk-btn--block" type="button" data-pf-close>OK</button>`),
].join('');

const mhtml = await page.evaluate(({ html, parts, base, also }) => {
  const d = new DOMParser().parseFromString(html, 'text/html');
  const q = (s) => d.querySelector(s), tpl = (t) => q(`[data-dc-tpl="${t}"]`);
  const frag = (s) => { const t = d.createElement('template'); t.innerHTML = s; return t.content; };
  q('title').textContent = 'Leads Marketplace — Profolio 2.0 (extended), phone';
  q('meta[name="pf-compiled"]')?.remove();
  const head = q('head');
  head.insertBefore(frag(`<meta name="pf-base" content="${base}">\n<meta name="pf-also" content="${also.join(', ')}">\n<meta name="pf-theme" content="2.0 extended to a new page — borrowed tokens, [TBC] designer sign-off">`), head.firstChild.nextSibling);
  d.querySelectorAll('link[rel="stylesheet"]').forEach((l) => l.setAttribute('href', l.getAttribute('href').replace(/^\.\.\/css\//, '../../css/')));
  head.appendChild(frag('<link rel="stylesheet" href="../../kit/kit.css">'));
  d.querySelectorAll('script').forEach((s) => s.remove());
  /* the header's page title */
  const walker = d.createTreeWalker(tpl('9'), NodeFilter.SHOW_TEXT);
  const hits = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.textContent.trim() === 'My Listings') hits.push(n);
  hits.forEach((n) => { const sp = d.createElement('span'); sp.setAttribute('data-pf-new-copy', ''); sp.textContent = 'Leads Marketplace'; n.replaceWith(sp); });
  /* the header's bell opens the product's notifications drawer (the phone draws it as a drawer) */
  d.querySelectorAll('.pf-badge button:not([data-pf-go])').forEach((btn) => btn.setAttribute('data-pf-go', 'states/listings--drawer-notifications-mark-all-as.html'));
  tpl('27').replaceChildren(frag(parts.strip));
  tpl('65').replaceChildren(frag(parts.tabs));
  tpl('65').removeAttribute('class');
  tpl('72').replaceChildren(frag(parts.lists));
  /* My Listings' own sheets and scrims after the list: not this page */
  const root = tpl('8');
  [...root.children].slice(3).forEach((e) => e.remove());
  [...d.querySelector('[data-pf-theme-root]').children].filter((e) => e !== root).forEach((e) => e.remove());
  d.querySelector('[data-pf-theme-root]').appendChild(frag(parts.sheets + parts.toasts));
  d.body.appendChild(frag('<script type="application/json" id="pf-state" data-src="state.json"></script>\n<script type="application/json" id="pf-data" data-src="data.json"></script>\n<script type="application/json" id="pf-actions" data-src="actions.json"></script>\n<script src="../../kit/runtime.js"></script>'));
  return '<!doctype html>\n' + d.documentElement.outerHTML;
}, { html: read(MBASE), parts: { strip: MSTRIP, tabs: MTABS, lists: MLISTS, sheets: MSHEETS, toasts: TOASTS }, base: MBASE, also: ALSO });
writeFileSync(join(OUT, 'marketplace.mobile.html'), mhtml);
console.log(`  examples/leads-marketplace/marketplace.mobile.html — ${(mhtml.length / 1024).toFixed(0)} KB`);
await b.close();
