/**
 * The settings page for an account whose profile is NOT complete.
 *
 * The default capture is the complete account, as the real one is; this is
 * the 90% account (harness/fixtures/profile.mjs, mode 'incomplete'), which
 * adds the Profile Completeness card under the settings nav and draws the
 * header ring part-filled.
 *
 * ── the Agency Settings form (container/pages/user-settings/agancy-settings.js) ─
 * One form and one Save Changes (fields: tenant/bayut/data/agencySettingsFields.js).
 * On this agency the phone is verified, so its field is read-only, and City
 * locks once it has a value: what can be wrong is Agency Name ("Please Enter
 * Agency Name") and Website ("Enter a valid website address").
 *
 * Saved (PUT /api/surge/agencies/:id, harness/fixtures/forms.mjs) the product
 * shows no toast: a modal, "Your request for update profile has been sent"
 * (agancy-settings.js:49) — so that state is a modal. Refused (422), the
 * API's reason in an error toast. Web and phone share the form: every step
 * runs on both.
 */
import { failing, holdToast, press, FAIL } from '../fixtures/forms.mjs';

const field = (p, name) => p.locator(`:is(input, textarea)[name="${name}"]`).first();
const save = (p) => press(p, p.getByRole('button', { name: 'Save Changes', exact: true }).first());
/* back to the top once the step is done, so the page is shot whole (see
   user-settings-user-profile.mjs) */
const top = async (p) => { await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(400); };
const blur = (p) => p.evaluate(() => document.activeElement && document.activeElement.blur());

/* invented edits. The website HAS to change: the fixture agency's own
   www.najdhorizon.example fails the product's website check (validations.js:90
   allows a top-level domain of at most 6 letters), so the untouched form does
   not save — the explorer's inline-save-changes is that message. .test is a
   reserved name, as .example is. */
const edit = async (p) => {
  await field(p, 'buisnessName').fill('Najd Horizon Real Estate Co.');
  await field(p, 'website').fill('www.najdhorizon.test');
  await field(p, 'nationalShortAddress').fill('RRKB3318');
  await field(p, 'address').fill('Office 22, Al Masar Tower, Olaya Street, Al Olaya, Riyadh');
  await field(p, 'description').fill('Residential brokerage serving Riyadh: apartments, floors and villas for sale and rent in the north and east of the city.');
  await blur(p);
  await p.waitForTimeout(600);
};

export default [
  { name: 'profile-incomplete', note: 'profile 90% complete: the completeness card and the part-filled header ring (profile-completion.js:59)', mode: 'incomplete' },
  {
    name: 'form-agency-errors',
    devices: ['web', 'mobile'],
    note: 'Save Changes with no agency name and a website that is not an address: "Please Enter Agency Name", "Enter a valid website address" (agencySettingsFields.js)',
    do: async (p) => {
      await field(p, 'buisnessName').fill('');
      await field(p, 'website').fill('najd horizon');
      await save(p);
      await p.waitForFunction(() => [...document.querySelectorAll('body *')].some((e) => e.children.length === 0 && /^Enter a valid website address$/.test(e.textContent.trim())), null, { timeout: 8000 });
      await p.waitForTimeout(700);
      await top(p);
    },
  },
  {
    name: 'form-agency-filled',
    devices: ['web', 'mobile'],
    note: 'edited and not yet saved: a new name, website, short address, address and description',
    do: async (p) => { await edit(p); await top(p); },
  },
  {
    name: 'modal-agency-saved',
    devices: ['web', 'mobile'],
    note: 'edited and saved: PUT /api/surge/agencies/:id → not a toast but the product\'s confirmation modal, "Your request for update profile has been sent"',
    do: async (p) => {
      await edit(p);
      await save(p);
      await p.waitForSelector('.ant-modal-wrap:not([style*="display: none"]) .ant-modal, .ant-drawer-open .ant-drawer-content', { timeout: 10000 });
      await p.waitForTimeout(900);
    },
  },
  {
    name: 'message-agency-failed',
    mode: FAIL,
    devices: ['web', 'mobile'],
    note: 'edited and saved, and the API refuses (forms.mjs, 422): its reason in an error toast, the edits still in the form',
    do: async (p) => failing(p, async () => { await edit(p); await save(p); await holdToast(p, 'error'); await top(p); }),
  },
];
