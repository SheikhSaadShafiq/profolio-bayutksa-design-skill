/**
 * /post-listing/:id — the listing form.
 *
 * The page itself (scripts/pages-list.mjs) is the fixture's first listing,
 * 88240117, as its owner edits it: a LIVE listing, so the form ends in
 * "Update" and has no Save Changes (post-listing.js:622, :637). The "post a
 * listing" flow's steps are the other form this route draws — the DRAFT the
 * licence step creates (88241126, harness/fixtures/listing-form.mjs) — and
 * each of them replays the flow from /post-listing to get there
 * (harness/interactions/post-listing.mjs reachForm).
 *
 *   flow-post-listing-03-details     the draft as REGA filled it in
 *   flow-post-listing-04-images      six photos uploaded
 *   flow-post-listing-05-specs       bathrooms, floor, built-up area, residence type
 *   flow-post-listing-06-amenities   the amenities modal, more of them ticked
 *   flow-post-listing-07-description title and description generated
 *   flow-post-listing-08-review      the whole form filled: Required Total, Post Listing
 *
 * The rest of the page's states are found by harness/explore.mjs
 * (data/states/post-listing-edit.json).
 *
 * The photos are drawn here (pngjs), so nothing is uploaded that is anybody's
 * picture; they go through the product's own upload — resize, the presigned
 * handshake, the PUT to the bucket — which forms.mjs answers on this machine.
 */
import { createRequire } from 'node:module';
import { answer } from '../fixtures.mjs';
import { failing, holdToast, press } from '../fixtures/forms.mjs';
import { reachForm, NEW_ID } from './post-listing.mjs';
import { scrollSettled } from './post-ad.mjs';

/* ── the photos ───────────────────────────────────────────────────────────── */
/* a room, flatly drawn: wall, floor, a window with sky, a door, a lamp —
   different colours per room, 1200×800 (the form wants at least 200×200) */
const ROOMS = [
  ['living-room.png', [236, 228, 214], [176, 140, 104], [150, 196, 226]],
  ['majlis.png', [226, 214, 196], [140, 98, 72], [168, 204, 228]],
  ['kitchen.png', [232, 236, 238], [160, 164, 170], [140, 190, 222]],
  ['bedroom.png', [220, 226, 236], [186, 160, 132], [158, 200, 230]],
  ['bathroom.png', [214, 230, 232], [200, 204, 206], [146, 192, 224]],
  ['facade.png', [214, 200, 176], [120, 124, 128], [128, 186, 230]],
];
const PHOTOS = new Map();
export function photo(i, { w = 1200, h = 800 } = {}) {
  const key = `${i}:${w}x${h}`;
  if (PHOTOS.has(key)) return PHOTOS.get(key);
  const { PNG } = createRequire(import.meta.url)('pngjs');
  const [name, wall, floor, sky] = ROOMS[i % ROOMS.length];
  const png = new PNG({ width: w, height: h });
  const put = (x, y, [r, g, b]) => { const k = (y * w + x) * 4; png.data[k] = r; png.data[k + 1] = g; png.data[k + 2] = b; png.data[k + 3] = 255; };
  const horizon = Math.round(h * 0.68);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const shade = (c, f) => c.map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
    let c = y < horizon ? shade(wall, 1 - (y / horizon) * 0.08) : shade(floor, 0.9 + ((y - horizon) / (h - horizon)) * 0.1);
    const win = x > w * 0.56 && x < w * 0.86 && y > h * 0.16 && y < h * 0.52;
    if (win) c = (Math.abs(x - w * 0.71) < 4 || Math.abs(y - h * 0.34) < 4) ? [250, 250, 250] : shade(sky, 1 - ((y - h * 0.16) / (h * 0.36)) * 0.15);
    const door = x > w * 0.12 && x < w * 0.26 && y > h * 0.26 && y < horizon;
    if (door) c = shade(floor, 0.8);
    const sofa = x > w * 0.3 && x < w * 0.52 && y > h * 0.56 && y < h * 0.74;
    if (sofa) c = [96, 112, 128];
    const lamp = (x - w * 0.9) ** 2 + (y - h * 0.12) ** 2 < (h * 0.04) ** 2;
    if (lamp) c = [252, 236, 180];
    put(x, y, c);
  }
  const file = { name: w < 200 ? `small-${name}` : name, mimeType: 'image/png', buffer: PNG.sync.write(png) };
  PHOTOS.set(key, file);
  return file;
}

/* ── the form's controls ──────────────────────────────────────────────────── */
export const imagesInput = (p) => p.locator('input[type=file][accept*="image"]').first();
/** a chip in one of the form's radio rows, by the row's field name and the
    chip's value (the inputs carry both: bathrooms=3, residence_type=Family) */
export async function chip(p, name, value) {
  await press(p, p.locator(`label.ant-radio-wrapper:has(input[type=radio][name="${name}"][value="${value}"])`).first());
  await p.waitForTimeout(250);
}
/** a number/text field, by its name */
export async function typeInto(p, name, text) {
  const input = p.locator(`.form-post-listing input[name="${name}"]`).first();
  await input.scrollIntoViewIfNeeded();
  await input.click();
  await input.fill('');
  await input.pressSequentially(text, { delay: 20 });
  await input.blur();
  await p.waitForTimeout(250);
}

/** the six photos, through the product's upload; resolves when every tile has finished */
export async function uploadPhotos(p, n = 6) {
  await imagesInput(p).setInputFiles(Array.from({ length: n }, (_, i) => photo(i)));
  await p.waitForFunction((k) => document.querySelectorAll('[data-image-id]').length >= k, n, { timeout: 20000 }).catch(() => {});
  /* uploading tiles carry a spinner; done when none is left */
  await p.waitForFunction(() => ![...document.querySelectorAll('.form-post-listing .ant-spin-spinning, .form-post-listing [class*="uploading"]')]
    .some((el) => el.getBoundingClientRect().width > 0), null, { timeout: 30000 }).catch(() => {});
  await p.waitForTimeout(800);
}

/** Generate Title / Description, answered by what they ask for: the field
    and the listing are in the POST body, which a fixture is not shown
    (harness/page.mjs), so for the length of `act` the call is answered here
    with the body's content_type and listing_id put in the query that
    listing-form.mjs reads */
export async function generating(p, act) {
  const handler = async (route) => {
    const req = route.request();
    let body = {};
    try { body = JSON.parse(req.postData() || '{}'); } catch {}
    const u = new URL(req.url());
    const q = `?content_type=${encodeURIComponent(body.content_type || '')}&listing_id=${encodeURIComponent(body.listing_id || '')}`;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(answer(req.method(), u.pathname, q, null) ?? {}) });
  };
  await p.route('**/api/surge/listings/generate_content', handler);
  try { return await act(); } finally { await p.unroute('**/api/surge/listings/generate_content', handler); }
}
export async function generate(p, what) {
  const btn = p.getByRole('button', { name: `Generate ${what}` }).first();
  await btn.scrollIntoViewIfNeeded();
  await press(p, btn);
  await p.waitForTimeout(900);
}

/* ── the flow, one step on the other ──────────────────────────────────────── */
export async function toDetails(p) {
  await reachForm(p);
  /* the verification's own toast goes first: a step is the screen it leaves */
  await p.locator('.ant-message-notice').first().waitFor({ state: 'hidden', timeout: 6000 }).catch(() => {});
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(400);
}
export async function toImages(p) {
  await toDetails(p);
  await uploadPhotos(p);
}
export async function toSpecs(p) {
  await toImages(p);
  await chip(p, 'bathrooms', '3');
  await typeInto(p, 'floor_number', '2');
  await typeInto(p, 'built_up_area', '150');
  await chip(p, 'residence_type', 'Family');
}
export const amenitiesDialog = (p) => p.locator('.ant-modal-wrap:not([style*="display: none"]) .ant-modal, .ant-drawer-open .ant-drawer-content', { hasText: 'Features and Amenities' }).last();
export async function openAmenities(p) {
  const btn = p.getByRole('button', { name: 'Add Amenities' }).first();
  await btn.scrollIntoViewIfNeeded();
  await press(p, btn);
  const dialog = amenitiesDialog(p);
  await dialog.waitFor({ state: 'visible', timeout: 10000 });
  await p.waitForTimeout(600);
  return dialog;
}
/** an amenity's checkbox in the modal: its card is the name, then the row holding the box */
export const amenity = (dialog, name) => dialog.locator(`xpath=.//div[contains(@class,"amenities-data")][normalize-space(.)="${name}"]/following-sibling::div[1]//label[contains(@class,"ant-checkbox-wrapper")]`).first();
export async function toAmenities(p) {
  await toSpecs(p);
  const dialog = await openAmenities(p);
  for (const [tab, names] of [['Main Features', ['Central Air Conditioning', 'Fitted Kitchen']], ['Rooms', ['Maid Room', 'Majlis']], ['Building and Services', ['Private Parking', 'Elevator']]]) {
    const t = dialog.getByRole('tab', { name: tab }).first();
    if (await t.count()) { await press(p, t); await p.waitForTimeout(350); }
    for (const name of names) await press(p, amenity(dialog, name));
  }
  await p.waitForTimeout(400);
  return dialog;
}
export async function toDescription(p) {
  const dialog = await toAmenities(p);
  await press(p, dialog.getByRole('button', { name: 'Add Amenities' }).last());
  await dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
  await generating(p, async () => { await generate(p, 'Title'); await generate(p, 'Description'); });
  await p.waitForTimeout(600);
}
export async function toReview(p) {
  await toDescription(p);
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(500);
}

/** Post Listing, as the backend then has it: the PUT posts the draft (pending
    review, the basic listing applied), so from here on its edit and its
    products answer as posted — the product re-reads both on the upgrade
    page (bayut/apis/listings.js:220). For the rest of this load only. */
export async function posting(p, act, mode = 'lf-posted') {
  const re = new RegExp(`/api/surge/(listings/${NEW_ID}/edit|products/applicable_products)$`);
  const handler = async (route) => {
    const u = new URL(route.request().url());
    if (route.request().method() !== 'GET' || !re.test(u.pathname)) return route.fallback();
    if (u.pathname.includes('applicable_products') && new URLSearchParams(u.search).get('listing_id') !== String(NEW_ID)) return route.fallback();
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(answer('GET', u.pathname, u.search, mode) ?? {}) });
  };
  await p.route('**/api/surge/**', handler);
  try { return await act(); } finally { await p.unroute('**/api/surge/**', handler); }
}
export const postButton = (p) => p.getByRole('button', { name: 'Post Listing' }).last();
export async function toPosted(p) {
  await toReview(p);
  await posting(p, async () => {
    await press(p, postButton(p));
    await p.waitForURL(new RegExp(`/post-listing/${NEW_ID}/upgrade`), { timeout: 20000 });
    await p.getByText('Your Listing has been Posted Successfully!').first().waitFor({ state: 'visible', timeout: 20000 });
    try { await p.waitForLoadState('networkidle', { timeout: 8000 }); } catch {}
    /* the account's own toast on arrival ("Your TruBroker status will be
       updated shortly!", upgrade-listing.js:97) goes first: a step is the
       screen it leaves */
    await p.locator('.ant-message-notice').first().waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    await p.waitForTimeout(500);
  });
  /* the product navigated here WITH state (listingDispositionSlug); a later
     load of this same URL would inherit it (a same-URL navigation keeps
     history.state) and toast again on a page that was not just posted. The
     screen has already read it — the entry forgets it. */
  await p.evaluate(() => history.replaceState({ ...(history.state || {}), usr: null }, '')).catch(() => {});
}

/* ── the live listing's own controls (the page's base: 88240117) ─────────── */
export const updateButton = (p) => p.getByRole('button', { name: 'Update' }).last();

const both = ['web', 'mobile'];

export default [
  /* ── the flow ─────────────────────────────────────────────────────────── */
  {
    name: 'flow-post-listing-03-details',
    devices: both,
    note: 'post a listing, step 3: the draft the licence created, as REGA filled it — type, price, area, rooms, location and the REGA card are fixed by the licence; photos, bathrooms, title and description are the agent\'s to add (bayut/components/post-listing/post-listing.js)',
    do: toDetails,
  },
  {
    name: 'flow-post-listing-04-images',
    devices: both,
    note: 'post a listing, step 4: six photos uploaded through the product\'s own upload (resize → presigned URL → PUT), the first one the cover (image-select.js)',
    do: toImages,
  },
  {
    name: 'flow-post-listing-05-specs',
    devices: both,
    note: 'post a listing, step 5: bathrooms, floor number, built-up area and residence type chosen',
    do: toSpecs,
  },
  {
    name: 'flow-post-listing-06-amenities',
    devices: both,
    note: 'post a listing, step 6: the Features and Amenities modal (a full-height drawer on a phone), grouped by section, with more of them ticked (add-amenities.js)',
    do: toAmenities,
  },
  {
    name: 'flow-post-listing-07-description',
    devices: both,
    note: 'post a listing, step 7: the amenities added, and the title and description written by Generate Title / Generate Description (GenerateContentField.js — POST listings/generate_content)',
    do: toDescription,
  },
  {
    name: 'flow-post-listing-08-review',
    devices: both,
    note: 'post a listing, step 8: the whole form filled, the preview beside it, and the footer that posts it: Required Total 2 Credits · Save Changes · Post Listing',
    do: toReview,
  },

  /* ── the form's states ────────────────────────────────────────────────── */
  {
    name: 'form-errors-empty',
    devices: both,
    note: 'Post Listing on the new draft before anything is added: the product\'s validation under every field still missing (helpers/post-listing/form-submit.js)',
    do: async (p) => {
      await toDetails(p);
      await press(p, postButton(p));
      await p.waitForTimeout(600);
      await scrollSettled(p);
    },
  },
  {
    name: 'form-errors-invalid',
    devices: both,
    note: 'Update with values the form refuses: a title under 20 characters and a built-up area larger than the area size (post-listing-form.js:676, the field\'s min_length)',
    do: async (p) => {
      await p.getByText('Built-up Area').first().waitFor({ state: 'visible', timeout: 15000 });
      await typeInto(p, 'built_up_area', '640');
      const title = p.getByPlaceholder('Enter title e.g Beautiful new house...').first();
      await title.scrollIntoViewIfNeeded(); await title.click(); await title.fill(''); await title.pressSequentially('Floor for sale', { delay: 20 });
      await press(p, updateButton(p));
      await p.waitForTimeout(600);
      await scrollSettled(p);
    },
  },
  {
    name: 'message-saved',
    devices: both,
    note: 'Save Changes on the draft: "Changes saved successfully" — the product then reloads the page (post-listing.js:268); the reload is answered 204 No Content, which leaves the page as it is, so the toast can be seen',
    do: async (p) => {
      await toImages(p);
      /* the product reloads the page right after the toast. The reload is
         answered 204 No Content — a navigation that gets no content is
         abandoned and the page stays as the toast left it (HTML: a 204
         response does not replace the document) */
      const reload = (url) => url.pathname === `/en/post-listing/${NEW_ID}`;
      const stay = (route) => (route.request().isNavigationRequest() ? route.fulfill({ status: 204, body: '' }) : route.fallback());
      await p.route(reload, stay);
      try {
        await press(p, p.getByRole('button', { name: 'Save Changes' }).last());
        await holdToast(p, 'success');
        await p.waitForTimeout(600);
      } finally { await p.unroute(reload, stay); }
    },
  },
  {
    name: 'message-save-failed',
    devices: both,
    note: 'Save Changes refused by the API (422): the product toasts the reason and keeps the form as it was (post-listing.js:264)',
    do: async (p) => {
      await toImages(p);
      await failing(p, async () => { await press(p, p.getByRole('button', { name: 'Save Changes' }).last()); await holdToast(p, 'error'); });
    },
  },
  {
    name: 'message-update-failed',
    devices: both,
    note: 'Update on the live listing refused by the API (422): the reason as a toast, the form unchanged (post-listing.js:292)',
    do: async (p) => {
      await p.getByText('Add Images of your Property').first().waitFor({ state: 'visible', timeout: 15000 });
      await failing(p, async () => { await press(p, updateButton(p)); await holdToast(p, 'error'); });
    },
  },
  {
    name: 'inline-images-uploading',
    devices: both,
    note: 'photos on their way up: the tiles the product draws while each file is sent to the bucket (image-upload-item.js) — the upload is held open',
    do: async (p) => {
      await toDetails(p);
      /* the bucket never answers, so every tile stays uploading */
      const hold = () => {};
      await p.route('**/api/surge/harness-uploads/**', hold);
      try {
        await imagesInput(p).setInputFiles([0, 1, 2, 3].map((i) => photo(i)));
        await p.waitForFunction(() => document.querySelectorAll('[data-image-id]').length >= 4, null, { timeout: 15000 }).catch(() => {});
        await p.waitForTimeout(1500);
      } finally { await p.unroute('**/api/surge/harness-uploads/**', hold); }
    },
  },
  {
    name: 'inline-images-failed',
    mode: 'lf-upload-fail',
    devices: both,
    note: 'photos that could not be uploaded: the bucket is unreachable (listing-form.mjs lf-upload-fail) and every tile is marked failed, with its retry (imageUploadHelper.js → inError)',
    do: async (p) => {
      await toDetails(p);
      await imagesInput(p).setInputFiles([0, 1, 2].map((i) => photo(i)));
      await p.waitForTimeout(3500);
    },
  },
  {
    name: 'message-image-too-small',
    devices: both,
    note: 'a photo under 200×200 is turned away before upload: "<file> size should be greater than 200 * 200" (imageUploadHelper.js onFilesAdded)',
    do: async (p) => {
      await toDetails(p);
      await imagesInput(p).setInputFiles([photo(2, { w: 160, h: 120 })]);
      await holdToast(p, 'error');
    },
  },
  {
    name: 'modal-nafath',
    mode: 'lf-nafath',
    devices: both,
    note: 'Post Listing when the listing still waits on the agent\'s Nafath verification: the API answers pending-nafaz-verification and the product opens its Nafath modal instead of the upgrade page (post-listing.js:305)',
    do: async (p) => {
      await toReview(p);
      await press(p, postButton(p));
      await p.locator('.ant-modal-wrap:not([style*="display: none"]) .ant-modal, .ant-drawer-open .ant-drawer-content').last().waitFor({ state: 'visible', timeout: 15000 });
      await p.waitForTimeout(800);
    },
  },
  {
    name: 'modal-non-saudi',
    mode: 'non-saudi',
    devices: both,
    note: 'Update by a Nafath-verified user who is not a Saudi national: the "Unable to Post Listing" modal instead of the save (post-listing.js:157, LimitNonSaudiNationalModal)',
    do: async (p) => {
      await p.getByText('Add Images of your Property').first().waitFor({ state: 'visible', timeout: 15000 });
      await press(p, updateButton(p));
      await p.locator('.ant-modal-wrap:not([style*="display: none"]) .ant-modal, .ant-drawer-open .ant-drawer-content').last().waitFor({ state: 'visible', timeout: 15000 });
      await p.waitForTimeout(800);
    },
  },
];
