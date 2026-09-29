/**
 * Area module: the SUBMISSIONS of every form (POST/PUT/PATCH/DELETE): the success and the failure answers.
 * Consulted BEFORE the other areas (harness/fixtures.mjs answer()), so it
 * must answer only endpoints no other area answers — or answer them only in
 * a mode of its own — or it changes pages it does not own.
 *
 *   export default (h) => [[RegExp, (search, mode, pathname, method) => body], …]
 *
 * ── a GET that lands here goes back to its own area ────────────────────────
 * answer() returns the FIRST route whose pattern matches the pathname, and a
 * pattern cannot see the method: a form that PUTs to /users/:id shares that
 * pathname with the settings page's GET, which profile.mjs answers. So every
 * pattern here is `own()`: while this module hands a GET back (pass()), its
 * own patterns stop matching and answer() walks on to the area that owns the
 * GET — exactly the answer it would have given if this module did not exist.
 * The few GETs answered HERE (a form's option list or upload handshake that
 * nobody answered) ask the rest of the chain first, so an area that starts
 * answering one takes it over without a change here.
 *
 * ── what a submission is answered with ─────────────────────────────────────
 * The body is what the product's success path READS (each route below names
 * the line), in the real API's envelope (`success: true` is added by
 * answer()). The request body is not visible here (answer() takes the method,
 * pathname and query only), so a saved record is the account's own record:
 * the screen shows the product's success message, and whatever the page
 * refetches afterwards is the fixture account as it was.
 *
 * ── the failure: mode 'form-fail', delivered with a status ─────────────────
 * In mode FAIL every submission here answers the way the real API refuses
 * one: `{ success: false, errors: [...] }` (the envelope extra.mjs's refusal
 * already uses). The product only takes a refusal from the STATUS — RTK
 * Query's fetchBaseQuery (store/parentApi.js:98, getErrorStringRtk reads
 * error / errors / message) and axios (services/networkService) both — and
 * harness/page.mjs answers every call 200. So a failed state's step wraps its
 * submit in failing(page, act): for the length of the act, a non-GET call
 * this module refuses is fulfilled with that body and 422. A GET is never
 * touched, and neither is a submission nobody here refuses.
 */
import { answer } from '../fixtures.mjs';
import { createRequire } from 'node:module';

export const FAIL = 'form-fail';
/* Add New Lead's other refusal: the phone belongs to a lead already in the
   system (add-lead-drawer.js:49 — an inline notice with a link, not a toast) */
export const LEAD_DUPLICATE = 'lead-duplicate';
/* the profile photo uploaded, then turned down by the image check */
export const PHOTO_REJECTED = 'photo-rejected';
/* a Preferences switch refused: the product's own words for it */
export const FAIL_PREFERENCE = 'form-fail-preference';

/* while true, this module's patterns do not match (see the note above) */
let passing = false;
const own = (re) => { re.test = function (s) { return !passing && RegExp.prototype.test.call(this, s); }; return re; };
const pass = (method, pathname, search = '', mode = null) => {
  const was = passing;
  passing = true;
  try { return answer(method, pathname, search, mode); } finally { passing = was; }
};
const refuse = (...errors) => ({ success: false, errors });

/* one submission route: a GET goes back to its area, FAIL refuses, anything
   else succeeds with `ok` */
const submit = (ok, fail) => (search, mode, pathname, method = 'GET') => {
  if (method === 'GET') return pass(method, pathname, search, mode);
  return mode === FAIL ? fail(pathname, method, search, mode) : ok(pathname, method, search, mode);
};
/* a GET nobody answered: the rest of the chain first, then this module */
const unless = (mine) => (search, mode, pathname, method = 'GET') =>
  pass(method, pathname, search, mode) ?? mine(search, mode, pathname, method);

/* ── the steps' side ──────────────────────────────────────────────────────── */

/** run `act` (the submit) with the refusals delivered as 422s: every non-GET
    call (and every GET whose path matches `gets`) is answered in `mode`, and
    a body that says success: false goes out with the status. */
export async function failing(page, act, { mode = FAIL, gets = null } = {}) {
  const handler = async (route) => {
    const req = route.request();
    const u = new URL(req.url());
    const get = req.method() === 'GET';
    if (!u.pathname.startsWith('/api/') || (get && !(gets && gets.test(u.pathname)))) return route.fallback();
    const body = answer(req.method(), u.pathname, u.search, mode);
    if (!body || body.success !== false) return route.fallback();
    return route.fulfill({ status: 422, contentType: 'application/json', body: JSON.stringify(body) });
  };
  await page.route('**/api/**', handler);
  try { return await act(); } finally { await page.unroute('**/api/**', handler); }
}

/** a few screens leave on a timer after their toast — invite-user.js:79 and
    :110 navigate away and reload the page 3 s after "rejected" or a refused
    invitation. A capture of the toast has to outlive that, so the step
    drops the page's 3-second timers from here on (this load only). */
export const holdTimers = (page, ms = 3000) => page.evaluate((t) => {
  const set = window.setTimeout;
  window.setTimeout = function (fn, delay, ...rest) { return delay === t ? 0 : set.call(window, fn, delay, ...rest); };
}, ms);

/** a Lottie that loops (components/common/lottie/lottie.js: loop: true) is
    never the same picture twice, so the frozen copy and the shot it is held
    to disagree — "Invitation Sent" came out 1% off on its animation alone.
    The step stops every Lottie on the page at its last frame (react-lottie
    keeps the lottie-web animation as `anim` on its component). */
export const holdLottie = (page) => page.evaluate(() => {
  let held = 0;
  for (const el of document.querySelectorAll('div')) {
    const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$'));
    if (!key) continue;
    for (let f = el[key]; f; f = f.return) {
      const anim = f.stateNode && f.stateNode.anim;
      if (anim && typeof anim.goToAndStop === 'function') {
        if (!anim.__pfHeld) { anim.goToAndStop(Math.max(0, anim.totalFrames - 1), true); anim.__pfHeld = true; held++; }
        break;
      }
    }
  }
  return held;
});

/** a phone is tapped, a desktop clicked: a click on a phone leaves the
    pointer over the control, and its :hover then shows in the shot */
export async function press(page, locator, opts = {}) {
  const touch = await page.evaluate(() => navigator.maxTouchPoints > 0).catch(() => false);
  await locator.scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
  return touch ? locator.tap({ timeout: 8000, ...opts }) : locator.click({ timeout: 8000, ...opts });
}

/** the product's toast (antd message) stays for 3 s (success) or 4.5 s
    (error, notifications.js) — less than a compile takes to freeze it. A
    notice pauses its timer while the pointer is over it (rc-notification
    pauseOnHover), so the step rests the pointer there. */
export async function holdToast(page, kind = null) {
  const sel = kind ? `.ant-message-notice .ant-message-${kind}` : '.ant-message-notice';
  const n = page.locator(sel).last();
  await n.waitFor({ state: 'visible', timeout: 10000 });
  await n.hover({ timeout: 3000 }).catch(() => {});
  return n;
}

/** the picture a form's upload is given: an invented headshot — a figure on
    a plain light ground, the kind the profile guidelines ask for — drawn
    here so the harness carries no photograph of anybody. 480×480 PNG. */
let HEADSHOT = null;
export function headshot() {
  if (HEADSHOT) return HEADSHOT;
  const { PNG } = createRequire(import.meta.url)('pngjs');
  const S = 480, png = new PNG({ width: S, height: S });
  const put = (x, y, [r, g, b]) => { const i = (y * S + x) * 4; png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b; png.data[i + 3] = 255; };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const head = (x - 240) ** 2 + (y - 190) ** 2 < 92 ** 2;
    const body = y > 300 && ((x - 240) / 170) ** 2 + ((y - 480) / 175) ** 2 < 1;
    const collar = body && y < 350 && Math.abs(x - 240) < 36 - (y - 300) * 0.5;
    put(x, y, collar ? [238, 240, 242] : head ? [196, 160, 128] : body ? [40, 78, 96] : [224, 232, 238]);
  }
  HEADSHOT = PNG.sync.write(png);
  return HEADSHOT;
}

/** a task's attachment: an invented receipt — a white slip with a heading
    bar and grey lines on a light ground, no text anybody could read. 480×480 PNG. */
let RECEIPT = null;
export function receipt() {
  if (RECEIPT) return RECEIPT;
  const { PNG } = createRequire(import.meta.url)('pngjs');
  const S = 480, png = new PNG({ width: S, height: S });
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const slip = x > 110 && x < 370 && y > 40 && y < 440;
    const head = slip && y > 70 && y < 100 && x > 140 && x < 300;
    const line = slip && y > 130 && y < 400 && (y - 130) % 34 < 8 && x > 140 && x < (y > 360 ? 250 : 340);
    const c = head ? [0, 98, 102] : line ? [200, 205, 212] : slip ? [255, 255, 255] : [228, 234, 238];
    const i = (y * S + x) * 4; png.data[i] = c[0]; png.data[i + 1] = c[1]; png.data[i + 2] = c[2]; png.data[i + 3] = 255;
  }
  RECEIPT = PNG.sync.write(png);
  return RECEIPT;
}

/** choose the headshot (or another picture) in an antd Upload and get
    through the crop modal (antd-img-crop's "Edit Image" → OK) the product
    puts in front of it */
export async function uploadHeadshot(page, input, { crop = true, name = 'headshot.png', buffer = null } = {}) {
  await input.setInputFiles({ name, mimeType: 'image/png', buffer: buffer || headshot() });
  if (!crop) return;
  const modal = page.locator('.ant-modal-wrap:not([style*="display: none"]) .ant-modal', { hasText: 'Edit Image' }).last();
  await modal.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(500);
  await press(page, modal.getByRole('button', { name: 'OK', exact: true }).first());
  await modal.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
}

/* ── the answers ──────────────────────────────────────────────────────────── */

export default (h) => {
  const { U, day } = h;
  /* the fixture's own records, as their areas answer them */
  const leadsNow = () => pass('GET', '/api/surge/lms/leads', '')?.leads || [];

  /* option lists and handshakes nobody answered ─────────────────────────── */

  /* Add Task's sub-types: GET task_purposes?q[task_type_id_eq]=<type>&q[category_eq]=0|1
     (apis/lms.js:256, transformResponse → task_purposes; the options are
     {id, name, name_l1}, leads-add-task-drawer.js:217). Unanswered, both
     Task Sub Type selects stayed empty and no task could be filled in. The
     three the fixture's tasks already carry (lms.mjs PURPOSE_OF_TASK: 11, 12,
     21) keep their ids; the rest are invented. The same list serves the
     completed (0) and the planned (1) step. */
  const PURPOSES = {
    1: [[11, 'Introductory Call', 'مكالمة تعريفية'], [12, 'Follow-up Call', 'مكالمة متابعة'], [13, 'Price Negotiation', 'التفاوض على السعر']],
    2: [[21, 'Property Viewing', 'معاينة العقار'], [22, 'Office Meeting', 'اجتماع في المكتب']],
    3: [[31, 'Token Received', 'استلام العربون'], [32, 'Documents Collected', 'استلام المستندات']],
    4: [[41, 'Photoshoot Scheduled', 'جدولة التصوير'], [42, 'Listing Posted', 'نشر الإعلان']],
    5: [[51, 'Deal Closed', 'إتمام الصفقة']],
    6: [[61, 'Not Interested', 'غير مهتم'], [62, 'Unreachable', 'تعذر التواصل']],
  };

  /* the Add Interest drawer opened outside a task: the agent's listings
     (apis/lms.js:337, GET lms/listings?q[user_id_eq]=…) — the listings the
     account's leads asked about, in the lms area's own card shape */
  const lmsListings = () => {
    const seen = new Map();
    for (const l of leadsNow()) {
      const card = l?.interest?.listing;
      if (card && !seen.has(card.id)) seen.set(card.id, card);
      for (const x of pass('GET', `/api/surge/lms/leads/${l.id}/listings`, '')?.listings || []) if (!seen.has(x.id)) seen.set(x.id, x);
    }
    return [...seen.values()];
  };

  /* an upload: GET assets/presigned_urls?key=<user_profile|agency_logo|image>&no_of_urls=1
     (apis/common.js:35) → presigned_urls[0].{upload_url, uuid, base_url}
     (fileUploadHelper.js:23), then an XHR PUT of the file to upload_url that
     must come back exactly 200 (…:50). The real upload_url is the bucket's,
     which the harness does not reach; this one is on the app's own origin
     and answered below. base_url + /<uuid>/large.jpg is only the enlarge
     preview's source — /harness-img is served by harness/page.mjs. */
  let uploads = 0;
  const presigned = (search) => {
    const key = new URLSearchParams(search || '').get('key') || 'image';
    const uuid = `5c0e7a1d-2b9f-4c3e-8a61-${String(9000 + (uploads++ % 1000)).padStart(12, '0')}`;
    return { presigned_urls: [{ uuid, key, upload_url: `/api/surge/harness-uploads/${key}/${uuid}`, base_url: '/harness-img/uploads' }] };
  };

  return [
    [own(/^\/api\/surge\/task_purposes$/), unless((search) => {
      const q = new URLSearchParams(search || '');
      const type = Number(q.get('q[task_type_id_eq]'));
      return { task_purposes: (PURPOSES[type] || []).map(([id, name, name_l1]) => ({ id, name, name_l1, task_type_id: type })) };
    })],
    [own(/^\/api\/surge\/lms\/listings$/), unless(() => ({ listings: lmsListings() }))],
    [own(/^\/api\/surge\/(assets|attachments)\/presigned_urls$/), unless((search) => presigned(search))],
    /* the bucket's side of the upload: 200 and nothing else */
    [own(/^\/api\/surge\/harness-uploads\//), () => ({})],
    /* the profile photo's check, a second after the upload
       (imageUploadHelper.js:210, IMAGE_ANALYSER is on for Bayut):
       data.messages empty = accepted; the first message is drawn in red on
       the tile and Save is held (json-form.js:94) */
    [own(/^\/api\/surge\/users\/analyse_profile_image$/), unless((search, mode) => ({
      messages: mode === PHOTO_REJECTED ? ['The picture is not clear. Please upload a clear headshot with a solid background.'] : [],
    }))],

    /* ── User Settings: Save Changes (container/pages/user-settings/profile.js) ─
       PUT users/:id { user: {...} } — tenant/bayut/apis/user.js:54 with
       common/payloads/user.js:2. The transformer keeps only a message, and the
       page says "Profile has been updated" itself (profile.js:196) and then
       refetches users/:id — so the body is the record, as the GET has it. */
    /* The same PUT saves a Preferences switch (tenant/bayut/apis/user.js
       updatePushNotifications), whose toast prints the body's message
       (preference.js) — so the record carries the product's own words for
       it; a refused switch says what the product says when it cannot. */
    [own(/^\/api\/surge\/users\/\d+$/), (search, mode, pathname, method = 'GET') => {
      if (method === 'GET') return pass(method, pathname, search, mode);
      if (mode === FAIL) return refuse('Whatsapp number is invalid');
      if (mode === FAIL_PREFERENCE) return refuse('Unable to update preference. Please refresh and try again.');
      return { ...pass('GET', pathname, search, mode), message: 'Preference updated successfully' };
    }],
    /* Smart Credit Utilization: PATCH users/:id/toggle_auto_utilization
       (tenant/bayut/apis/user.js updateUserPreferences); the toast prints the
       body's message */
    [own(/^\/api\/surge\/users\/\d+\/toggle_auto_utilization$/), (search, mode, pathname, method = 'GET') => {
      if (method === 'GET') return pass(method, pathname, search, mode);
      return mode === FAIL_PREFERENCE || mode === FAIL ? refuse('Unable to update preference. Please refresh and try again.') : { message: 'Preference updated successfully' };
    }],

    /* ── Change Password (container/pages/user-settings/password.js) ───────
       tenant/bayut/apis/user.js:150 — POST users/:id/change_password with
       { user: { current_password, new_password, new_password_confirmation } }.
       The transformer keeps `res.data` or a fixed message (…:163), so nothing
       the screen shows comes from the body: "Password Updated Successfully" and
       the form resets. A refusal is read by getErrorStringRtk and shown in the
       form's own Alert (password.js:39, setStatus), not as a toast. */
    [own(/^\/api\/surge\/users\/\d+\/change_password$/), submit(
      () => ({}),
      () => refuse('Current password is incorrect'),
    )],

    /* ── Agency Settings: Save Changes (container/pages/user-settings/agancy-settings.js)
       PUT agencies/:id { agency: {...} } — tenant/bayut/apis/agency.js:38; the
       transformer reads response.agency, so the body is the agency as the GET
       has it. Success is not a toast: a modal, "Your request for update
       profile has been sent" (agancy-settings.js:49). */
    [own(/^\/api\/surge\/agencies\/\d+$/), submit(
      (pathname, method, search, mode) => pass('GET', pathname, search, mode),
      () => refuse('Website is invalid'),
    )],

    /* ── Licenses: "Share with agency staff" (components/license-card/license-card.js:210)
       PATCH licenses/:id { license: { is_shareable } } — tenant/bayut/apis/user.js:122.
       Nothing is read from the body: "License sharing status changed" and the
       list refetches. The licence is answered as the list has it. */
    [own(/^\/api\/surge\/licenses\/\d+$/), submit(
      (pathname) => {
        const id = Number(pathname.split('/').pop());
        const list = pass('GET', `/api/surge/agencies/${U.agency?.id}/licenses`, '')?.licenses || [];
        return { license: list.find((l) => l.id === id) || { id } };
      },
      () => refuse('License sharing could not be changed. Please try again.'),
    )],

    /* ── Agency Staff (container/pages/agancy-staff) ────────────────────────
       Every write is RTK Query (tenant/bayut/apis/agency.js). None of the
       three below is read on success: Set Credits Limit and Edit User just
       close their modal and refetch agencies/:id — the product says nothing
       (no toast) — and Delete says nothing on the web either; the phone
       page toasts "User Deleted Successfully" (agency-staff-mobile.js:93).
       Refused: Set Credits Limit and Edit User toast the reason
       (set-credit-limit.js:180, AgencyUserForm.js:121 — 7 s), Delete puts
       it in a red Alert inside its modal (deleteAgencyUserModal.js). */
    /* PATCH agencies/:id/update_staff_cap { agencyId, users: [{user_id, cap_value}] } (:196) */
    [own(/^\/api\/surge\/agencies\/\d+\/update_staff_cap$/), submit(
      () => ({}),
      () => refuse('Credit limit can not be more than the available credits'),
    )],
    /* PUT agencies/:id/update_staff?user_id=:uid { user: {...} } (:98) — the
       member, as users/:id answers */
    [own(/^\/api\/surge\/agencies\/\d+\/update_staff$/), submit(
      (pathname, method, search, mode) => {
        const uid = new URLSearchParams(search || '').get('user_id');
        return (uid && pass('GET', `/api/surge/users/${uid}`, '', mode)) || {};
      },
      () => refuse('Whatsapp is invalid'),
    )],
    /* DELETE agencies/:id/remove_staff { user_id } (:88) */
    [own(/^\/api\/surge\/agencies\/\d+\/remove_staff$/), submit(
      () => ({}),
      () => refuse('User has active listings. Please move them to another agent first.'),
    )],
    /* Invite User, step 1: POST otps { channel: 'phone', purpose:
       'create_invitation', identifier } (:170). listings.mjs already answers
       this path (the listing OTP), so success is ITS answer — this route
       only adds the refusal: the number cannot be invited, a toast, the
       invite modal still open (inviteUser.js:131). */
    [own(/^\/api\/surge\/otps$/), submit(
      (pathname, method, search, mode) => pass(method, pathname, search, mode),
      () => refuse('No Bayut account is registered with this number'),
    )],
    /* step 2: POST otps/verify { code, reference_number, purpose } (:184).
       Success reads data.user — its name goes into "Invitation has been sent
       to "<name>" to join your agency." (inviteUser.js:80); the invited
       agent is invented. Refused with exactly 'Invalid OTP code', the boxes
       say "Incorrect OTP" inline (inviteUser.js:84); any other reason is a
       toast. */
    [own(/^\/api\/surge\/otps\/verify$/), submit(
      () => ({ user: { id: 88010288, name: 'Majed Al-Anazi', name_l1: 'ماجد العنزي', mobile: '+966506613927' } }),
      () => refuse('Invalid OTP code'),
    )],

    /* ── /invite: Accept and Reject (invite-user.js:51, :72) ──────────────
       PUT /api/surge/invitations { invitation: { status: accepted|rejected,
       token } } — tenant/bayut/apis/agency.js:160. The body is never read,
       only whether it failed: "Invite Accepted Successfully" / "Invite Rejected
       Successfully" (neither key is in the locale files, so the key shows), a
       refusal as the API's reason in an error toast. The GET on the same path
       goes back to settings.mjs. */
    [own(/^\/api\/surge\/invitations$/), submit(
      () => ({}),
      () => refuse('This invitation has already been used'),
    )],

    /* ── TruLeads (components/leads-management) ─────────────────────────────
       Add New Lead: POST lms/leads (apis/lms.js:404, payloads/leads.js:51).
       The drawer acts only on a truthy body and toasts ITS message — there
       is no text of the product's own (add-lead-drawer.js:55-60) — then
       closes and refetches the table. Refused: the reason in a toast, the
       drawer still open. LEAD_DUPLICATE is the other refusal: a body that
       names the lead the phone already belongs to (`lead_id`, and nothing
       getErrorStringRtk would turn into text) → the drawer's own inline
       notice with a link to that lead (add-lead-drawer.js:49, :84). */
    [own(/^\/api\/surge\/lms\/leads$/), (search, mode, pathname, method = 'GET') => {
      if (method === 'GET') return pass(method, pathname, search, mode);
      if (mode === LEAD_DUPLICATE) return { success: false, lead_id: leadsNow()[0]?.id ?? null };
      if (mode === FAIL) return refuse('Lead phone number is invalid');
      return { message: 'Lead added successfully' };
    }],
    /* Add Name, in the lead drawer: PUT lms/leads/:id { lead: { name } }
       (apis/lms.js:390). The toast is the product's own ("Name Updated
       Successfully!", lead-name.js:24); the drawer refetches the lead. */
    [own(/^\/api\/surge\/lms\/leads\/\d+$/), submit(
      (pathname, method, search, mode) => {
        const got = pass('GET', pathname, search, mode)?.leads;
        return got ? { lead: got } : {};
      },
      () => refuse('Name is too long (maximum is 100 characters)'),
    )],
    /* Add Task: POST lms/tasks (apis/lms.js:383, payloads/leads.js:23) — the
       drawer toasts the body's message (leads-add-task-drawer.js:94), closes,
       and refetches the table or the lead's tasks. */
    [own(/^\/api\/surge\/lms\/tasks$/), submit(
      () => ({ message: 'Task added successfully' }),
      () => refuse('Completed at can not be in the future'),
    )],
    /* Add Interest Manually: POST lms/interests { interests: [{lead_id,
       listing_id}] } or, for an interaction without one, PUT
       lms/interests/:id { interest: { listing_id } } (apis/lms.js:369, :376).
       The toast is the product's own, "Interest added successfully". */
    [own(/^\/api\/surge\/lms\/interests(\/\d+)?$/), submit(
      () => ({ message: 'Interest added successfully' }),
      () => refuse('Listing has already been added to this lead'),
    )],
  ];
};
