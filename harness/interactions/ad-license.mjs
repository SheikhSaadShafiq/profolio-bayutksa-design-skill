/**
 * The states of /ad-license — "Get a New Ad License"
 * (bayut/components/ad-license/create-ad-license.js): one form in three
 * blocks, Property Information, Property Location and Contact Information,
 * a running Total and Continue. Continue validates (Formik + yup,
 * bayut/data/getValidationSchema.js:12), POSTs the request, then a cart
 * for the licence fee, and opens the checkout on it.
 *
 * The flow, one state per step (the prototype chains them by name):
 *   flow-ad-license-01-property-information   ad-license   Sell · Residential · Apartment, deed,
 *                                                          age, 3 bedrooms, 240 sq. m., ﷼1,250,000
 *   flow-ad-license-02-property-location      ad-license   Riyadh › Al Yasmin
 *   flow-ad-license-03-contact-information    ad-license   the account's name and number, Total ﷼600
 *   flow-ad-license-04-review-and-pay         checkout     "Ad License request submitted successfully!"
 *                                                          over the ﷼600 order
 *   flow-ad-license-05-success                checkout     AdLicenseSuccessModal, Request ID 22031
 *   flow-ad-license-06-failure                packages     "Payment failed due to an error."
 *
 * THE PLACES. City and Location/District search Algolia from the browser,
 * which harness/page.mjs blocks — every select would be empty and the form
 * could never be submitted (city and location are required). So a step that
 * needs them answers Algolia's host from harness/fixtures/payments.mjs
 * (searchLocations) for the length of its act, and loads the form again so
 * the cities the select fetches on mount arrive (location-select.js:113).
 * Nothing leaves the machine. The Map Pin is Google Maps, which harness/env
 * gives no key: the box says so in the product's own words ("Google Maps API
 * key is missing…", components/post-listing/google-map), on every state.
 *
 * The explorer already finds Continue on the empty form (inline-continue)
 * and the Property Age list (dropdown-select-property-age).
 */
import { MODE, press, holdToast, quiet, refusing, searchLocations } from '../fixtures/payments.mjs';

/* ── what the flow fills in ─────────────────────────────────────────────── */
export const AD = {
  purpose: '1',                        /* Sell — ﷼600 (ad_license_products, listings.mjs) */
  type: '1',                           /* Residential */
  subType: 'Apartment',                /* listing_categories, listing-form.mjs */
  deed: '310547829163',                /* 12 digits, like a MOJ e-deed */
  age: '5 years',                      /* listing_age, listings.mjs */
  bedrooms: '3',
  area: '240',
  price: '1250000',
  city: 'Riyadh',
  district: 'Al Yasmin',
};

/* ── Algolia, answered here (see the note above) ──────────────────────────── */
const ALGOLIA = /algolia(net)?\.(net|com)\/1\/indexes\//;
const places = (route) => {
  const req = route.request();
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
  let params = {};
  try { params = JSON.parse(req.postData() || '{}'); } catch {}
  return route.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(searchLocations(params)) });
};
/** run `act` with the locations index answered, the form loaded afresh */
export const withPlaces = async (p, act) => {
  await p.route(ALGOLIA, places);
  try {
    await p.goto(`${new URL(p.url()).origin}/en/ad-license`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForSelector('form.form-post-listing', { timeout: 60000 });
    await quiet(p);
    return await act();
  } finally {
    await p.unroute(ALGOLIA, places);
  }
};

/* ── the form's controls, found by their labels ────────────────────────── */
const FORM = 'form.form-post-listing';
export const field = (p, label) => p.locator(`${FORM} label`, { hasText: label }).first().locator('xpath=..');
const radio = (p, name, value) => p.locator(`${FORM} label.ant-radio-wrapper:has(input[name="${name}"][value="${value}"])`).first();
const openSelect = async (p, label) => {
  await press(p, field(p, label).locator('.ant-select').first());
  await p.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option').first()
    .waitFor({ state: 'visible', timeout: 20000 });
  await p.waitForTimeout(500);
};
const pick = async (p, label, option) => {
  await openSelect(p, label);
  await press(p, p.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option', { hasText: option }).first());
  await p.waitForTimeout(500);
};
/** the form scrolls inside itself (create-ad-license.js:262, 80vh) */
const scrollForm = (p, where) => p.evaluate(([sel, w]) => {
  const f = document.querySelector(sel);
  if (!f) return;
  if (w === 'top') f.scrollTop = 0;
  else if (w === 'bottom') f.scrollTop = f.scrollHeight;
  else {
    const lab = [...f.querySelectorAll('label')].find((l) => l.textContent.trim().startsWith(w));
    if (lab) f.scrollTop += lab.getBoundingClientRect().top - f.getBoundingClientRect().top - 24;
  }
}, [FORM, where]);
/* nothing left focused or hovered (a field draws a ring for either — the
   pointer rests where the last option was), then a beat. The pointer goes
   to the page's heading, which has no hover of its own: the corner the
   listings steps use is the rail here, and the rail shows its expand
   button to a hovering pointer. */
const settleForm = async (p) => {
  await p.evaluate(() => document.activeElement?.blur?.()).catch(() => {});
  if (!(await p.evaluate(() => navigator.maxTouchPoints > 0).catch(() => false))) {
    await p.locator('h2', { hasText: 'Get a New Ad License' }).first().hover({ timeout: 3000 }).catch(() => {});
  }
  await p.waitForTimeout(700);
};

/* ── the blocks ─────────────────────────────────────────────────────────── */
export const fillPropertyInformation = async (p) => {
  await press(p, radio(p, 'purpose', AD.purpose));
  await press(p, radio(p, 'property_type', AD.type));
  await p.waitForTimeout(800);                                   /* listing_categories → the sub types */
  await pick(p, 'Property Sub Type', AD.subType);
  await field(p, 'Property Ownership Document Number').locator('input').fill(AD.deed);
  await pick(p, 'Property Age', AD.age);
  await press(p, radio(p, 'bedrooms', AD.bedrooms));
  await field(p, 'Area Size').locator('input').fill(AD.area);
  await field(p, 'Price of Property').locator('input').fill(AD.price);
  await field(p, 'Price of Property').locator('input').blur();
  await p.waitForTimeout(400);
};
export const fillPropertyLocation = async (p) => {
  await pick(p, 'City', AD.city);
  await p.waitForTimeout(800);                                   /* the city's districts */
  await pick(p, 'Location/District', AD.district);
};
const submit = (p) => press(p, p.locator(`${FORM} button`, { hasText: 'Continue' }).first());

/** the whole form, filled and submitted → the checkout on the licence's
    cart (mode MODE.AD_LICENSE, or its declined twin, answers that cart).
    The product toasts "Ad License request submitted successfully!" as it
    leaves the form (create-ad-license.js:160): `holdSubmitted` keeps it,
    otherwise the step waits for it to go, so what follows is not
    photographed under it. */
export const adLicenseToCheckout = async (p, { holdSubmitted = false } = {}) => withPlaces(p, async () => {
  await fillPropertyInformation(p);
  await fillPropertyLocation(p);
  await submit(p);
  if (holdSubmitted) await holdToast(p, 'Ad License request submitted');
  await p.waitForURL(/\/checkout\?cart_id=.*ad_license=true/, { timeout: 60000 });
  await p.waitForSelector('.ant-layout', { timeout: 60000 });
  await p.locator('text=Order Summary').first().waitFor({ state: 'visible', timeout: 30000 });
  await quiet(p);
  if (!holdSubmitted) await p.locator('.ant-message-notice').first().waitFor({ state: 'detached', timeout: 10000 }).catch(() => {});
});

export default [
  /* ── the flow ────────────────────────────────────────────────────────── */
  {
    name: 'flow-ad-license-01-property-information',
    devices: ['web', 'mobile'],
    note: 'ad licence, step 1 of 5: Property Information filled — Sell (﷼600) · Residential · Apartment, a 12-digit deed number, 5 years old, 3 bedrooms, 240 sq. m. and ﷼1,250,000, which the field repeats formatted under itself; the Total reads ﷼600',
    do: (p) => withPlaces(p, async () => { await fillPropertyInformation(p); await scrollForm(p, 'Purpose'); await settleForm(p); }),
  },
  {
    name: 'flow-ad-license-02-property-location',
    devices: ['web', 'mobile'],
    note: 'ad licence, step 2 of 5: Property Location — City Riyadh, locked once chosen (location-select.js:455), and Location/District Al Yasmin from its districts; the places are the locations index answered locally; the Map Pin box carries the product\'s missing-key notice (no Google Maps key in harness/env)',
    do: (p) => withPlaces(p, async () => {
      await fillPropertyInformation(p); await fillPropertyLocation(p);
      await scrollForm(p, 'City'); await settleForm(p);
    }),
  },
  {
    name: 'flow-ad-license-03-contact-information',
    devices: ['web', 'mobile'],
    note: 'ad licence, step 3 of 5 (then checkout--flow-ad-license-04-review-and-pay): the form complete, scrolled to Contact Information — the account\'s name and verified number, both locked — above Total ﷼600 and Continue',
    do: (p) => withPlaces(p, async () => {
      await fillPropertyInformation(p); await fillPropertyLocation(p);
      await scrollForm(p, 'bottom'); await settleForm(p);
    }),
  },

  /* ── the form's own states ───────────────────────────────────────────── */
  {
    name: 'form-purpose-and-type-selected',
    devices: ['web', 'mobile'],
    note: 'Sell and Residential chosen: the purpose pill shows its price selected, the Total reads ﷼600, and Property Sub Type unlocks',
    do: async (p) => {
      await press(p, radio(p, 'purpose', AD.purpose));
      await press(p, radio(p, 'property_type', AD.type));
      await p.waitForTimeout(800);
      await settleForm(p);
    },
  },
  {
    name: 'form-property-sub-type-options',
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'Property Sub Type open after Sell + Residential: the residential types for sale from listing_categories (create-ad-license.js:222 filters them by section and purpose)',
    do: async (p) => {
      await press(p, radio(p, 'purpose', AD.purpose));
      await press(p, radio(p, 'property_type', AD.type));
      await p.waitForTimeout(800);
      await openSelect(p, 'Property Sub Type');
    },
  },
  {
    name: 'form-deed-number-invalid',
    devices: ['web', 'mobile'],
    note: 'a deed number of five digits, left: "Property ownership document number must be 10-20 digits only" under the field (getValidationSchema.js:20)',
    do: async (p) => {
      const input = field(p, 'Property Ownership Document Number').locator('input');
      await input.fill('41027');
      await input.blur();
      await settleForm(p);
    },
  },
  {
    name: 'form-city-options',
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'City open: the kingdom\'s cities, Riyadh first, from the locations index (answered locally — location-select.js:113 fetches them on mount)',
    do: (p) => withPlaces(p, async () => { await scrollForm(p, 'City'); await openSelect(p, 'City'); }),
  },
  {
    name: 'form-district-options',
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'Riyadh chosen and Location/District open: its districts, fetched for the city (location-select.js:95, level > 2 under it); the City select is locked now',
    do: (p) => withPlaces(p, async () => {
      await scrollForm(p, 'City');
      await pick(p, 'City', AD.city);
      await p.waitForTimeout(800);
      await openSelect(p, 'Location/District');
    }),
  },
  {
    name: 'form-errors-on-submit',
    devices: ['web', 'mobile'],
    note: 'Continue on the empty form: each required field says so under itself — purpose, type, sub type, deed number, age, bedrooms, area, price, city and district (getValidationSchema.js)',
    do: async (p) => { await submit(p); await p.waitForTimeout(600); await scrollForm(p, 'top'); await settleForm(p); },
  },
  {
    name: 'message-submit-failed',
    mode: MODE.AD_LICENSE_REFUSED,
    devices: ['web', 'mobile'],
    shot: 'viewport',
    note: 'the complete form refused by the API (a 422 from POST ad_license_requests): the product toasts its own "Failed to create ad license request. Please try again." (create-ad-license.js:171) and stays on the form',
    do: (p) => withPlaces(p, async () => {
      await fillPropertyInformation(p);
      await fillPropertyLocation(p);
      await refusing(p, async () => { await submit(p); await holdToast(p, 'Failed to create'); });
    }),
  },
];
