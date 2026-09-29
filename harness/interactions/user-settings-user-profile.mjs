/**
 * The settings page for an account whose profile is NOT complete.
 *
 * The default capture is the complete account, as the real one is; this is
 * the 90% account (harness/fixtures/profile.mjs, mode 'incomplete'), which
 * adds the Profile Completeness card under the settings nav and draws the
 * header ring part-filled.
 *
 * ── the User Settings form (container/pages/user-settings/profile.js) ──────
 * One form, "Additional Information", with one Save Changes for all of it
 * (fields: tenant/bayut/data/profileFields.js). On this account the name and
 * email fields are read-only (name_editable false, the email set) and City
 * locks once it has a value (location-select.js:452), so what can be wrong
 * is: Phone Number ("Please enter your number" / "Invalid format"), Whatsapp
 * ("Please enter whatsapp number" / "Invalid format"), Service Area ("Please
 * select a Service Area"), User Languages ("Please select a Language to
 * Continue"). Years of Experience has no way to be emptied.
 *
 * The photo is the same form's last field: antd Upload inside antd-img-crop,
 * so choosing a file opens the "Edit Image" crop modal first; OK uploads it
 * (presigned URL → PUT → the image check a second later, all answered by
 * harness/fixtures/forms.mjs) and the tile shows the local preview.
 *
 * Save is PUT /api/surge/users/:id → the "Profile has been updated" toast;
 * refused (forms.mjs, 422) → the API's reason as an error toast. Saved, the
 * page refetches the fixture account, so the form shows its values again.
 * The phone lays the same form out in one column: every step runs on both.
 */
import { failing, holdToast, press, uploadHeadshot, FAIL, PHOTO_REJECTED } from '../fixtures/forms.mjs';

const FORM = '.ant-layout-content';
const tel = (p, i) => p.locator(`${FORM} input[type=tel]`).nth(i);
const field = (p, name) => p.locator(`${FORM} [name="${name}"]`).first();
/* the select a label names: the first one after it in the document */
const select = (p, label) => p.locator(`xpath=//label[normalize-space()="${label}"]/following::div[contains(concat(" ", @class, " "), " ant-select ")][1]`);
const save = (p) => press(p, p.locator(FORM).getByRole('button', { name: 'Save Changes', exact: true }).first());
const settled = (p) => p.waitForTimeout(900);
/* back to the top once the step is done: the page is then shot whole, not
   from wherever the submit left it scrolled (the header and rail are fixed,
   and a whole-page shot taken mid-scroll draws them mid-page) */
const top = async (p) => { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400); };

/* the edits a user makes before saving — invented values */
const edit = async (p) => {
  await tel(p, 1).fill('+966 55 214 7730');
  await field(p, 'nationalShortAddress').fill('RRKB3318');
  await field(p, 'address').fill('Office 22, Al Masar Tower, Olaya Street, Al Olaya, Riyadh');
  const years = select(p, 'Years of Experience');
  await press(p, years);
  await press(p, p.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option', { hasText: '6-10 Years' }).first());
  await p.locator(`${FORM}`).first().evaluate(() => document.activeElement && document.activeElement.blur());
  await settled(p);
};

/* choose the headshot, through the crop modal, and wait for the tile to be
   uploaded and checked (its "Uploading..." / "Checking..." overlays gone) */
const photo = async (p, { crop = true } = {}) => {
  await uploadHeadshot(p, p.locator(`${FORM} .ant-upload input[type=file]`).first(), { crop });
  if (!crop) return;
  await p.waitForFunction((f) => {
    const root = document.querySelector(f);
    return root && !/Uploading\.\.\.|Checking\.\.\./.test(root.innerText);
  }, FORM, { timeout: 15000 });
  await p.waitForTimeout(1600);
  await top(p);
};

export default [
  { name: 'profile-incomplete', note: 'profile 90% complete: the completeness card and the part-filled header ring (profile-completion.js:59)', mode: 'incomplete' },
  {
    name: 'form-profile-errors',
    devices: ['web', 'mobile'],
    note: 'Save Changes with the phone emptied, a WhatsApp number too short, and no service area or language: each field\'s own message (profileFields.js, validations.js)',
    do: async (p) => {
      await tel(p, 0).fill('');
      await tel(p, 1).fill('+966 12');
      /* Service Area clears with its clear icon; User Languages has none,
         so its tags are closed one by one */
      const areas = select(p, 'Service Area');
      await areas.hover().catch(() => {});
      await areas.locator('.ant-select-clear').first().click({ force: true });
      const langs = select(p, 'User Languages');
      for (let i = 0; i < 6 && await langs.locator('.ant-select-selection-item-remove').count(); i++) {
        await langs.locator('.ant-select-selection-item-remove').first().click({ force: true });
        await p.waitForTimeout(150);
      }
      await p.keyboard.press('Escape').catch(() => {});
      await save(p);
      await p.waitForFunction(() => [...document.querySelectorAll('.ant-layout-content *')].filter((e) => /^(Please enter your number|Invalid format)$/.test(e.textContent.trim())).length >= 2, null, { timeout: 8000 });
      await settled(p);
      await top(p);
    },
  },
  {
    name: 'form-profile-filled',
    devices: ['web', 'mobile'],
    note: 'edited and not yet saved: a new WhatsApp number, short address and address, and 6-10 years of experience',
    do: async (p) => { await edit(p); await top(p); },
  },
  {
    name: 'modal-profile-photo-crop',
    devices: ['web', 'mobile'],
    note: 'a picture chosen for "Upload a picture": the "Edit Image" crop modal antd-img-crop opens before anything is uploaded',
    do: async (p) => {
      await uploadHeadshot(p, p.locator(`${FORM} .ant-upload input[type=file]`).first(), { crop: false });
      await p.waitForSelector('.ant-modal-wrap:not([style*="display: none"]) .ant-modal', { timeout: 10000 });
      await p.waitForTimeout(900);
    },
  },
  {
    name: 'form-profile-photo',
    devices: ['web', 'mobile'],
    note: 'the picture cropped and uploaded: the tile with its preview in place of "Browse and Upload" (presigned URL, upload and image check answered by forms.mjs)',
    do: (p) => photo(p),
  },
  {
    name: 'form-profile-photo-rejected',
    mode: PHOTO_REJECTED,
    devices: ['web', 'mobile'],
    note: 'the picture uploaded and turned down by the image check (users/analyse_profile_image answers a message): the tile in its error state with the reason, and Save held (json-form.js:94)',
    do: (p) => photo(p),
  },
  {
    name: 'message-profile-saved',
    devices: ['web', 'mobile'],
    note: 'edited and saved: PUT /api/surge/users/:id → the "Profile has been updated" toast (profile.js:196); the page then refetches the account',
    do: async (p) => { await edit(p); await save(p); await holdToast(p, 'success'); await top(p); },
  },
  {
    name: 'message-profile-failed',
    mode: FAIL,
    devices: ['web', 'mobile'],
    note: 'edited and saved, and the API refuses (forms.mjs, 422): its reason in an error toast, the edits still in the form',
    do: async (p) => failing(p, async () => { await edit(p); await save(p); await holdToast(p, 'error'); await top(p); }),
  },
  {
    name: 'modal-convert-to-agency',
    mode: 'individual',
    devices: ['web', 'mobile'],
    note: 'an individual broker (no agency) → Convert to Agency (profile.js:274, CONVERT_TO_AGENCY is on for KSA): the agency form, prefilled from his record — a drawer on a phone',
    do: async (p) => {
      await press(p, p.getByRole('button', { name: 'Convert to Agency' }).first());
      await p.waitForSelector('.ant-modal, .ant-drawer-content', { timeout: 10000 });
      await p.waitForTimeout(1000);
    },
  },
];
