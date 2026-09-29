/**
 * Area module: /invite, /maintenance and the settings pages' own new endpoints.
 * Consulted BEFORE the other areas (harness/fixtures.mjs answer()), so it
 * must answer only endpoints no other area answers — or answer them only in
 * a mode of its own — or it changes pages it does not own.
 *
 *   export default (h) => [[RegExp, (search, mode, pathname, method) => body], …]
 *
 * ── /invite ─────────────────────────────────────────────────────────────────
 * The page an invited agent lands on from the invitation link. It lives in
 * the signed-in shell (appRoutes.js:123, invite_user) and reads ONE thing,
 * the `token` query (invite-user.js:99 → mapQueryStringToFilterObject), which
 * it sends as GET /api/surge/invitations?token=… (tenant/bayut/apis/agency.js:144).
 * Without an answer the modal read "You have been invited to join undefined
 * by undefined" (data/live/invite.png). What it reads is
 * invitation.invitor.name and invitation.invitor.agency.name (invite-user.js:155);
 * nothing checks a status or an expiry — an expired invitation is the API
 * refusing the GET (mode 'invite-expired' below, which a state delivers with a
 * 4xx status: harness/interactions/invite.mjs). The route is compiled as
 * /invite?token=… (scripts/pages-list.mjs); the token is invented.
 *
 * Accept and Reject are PUTs to the same path — submissions, answered in
 * harness/fixtures/forms.mjs, which hands this GET back here.
 *
 * The invitation comes from ANOTHER agency: the signed-in account is the
 * fixture's own (Faisal Al-Harbi, Najd Horizon Real Estate), and an agency
 * does not invite its own owner. Invented, like everything here.
 *
 * ── /maintenance ────────────────────────────────────────────────────────────
 * A bare public page (appRoutes.js:261 publicRoutes, Maintenance.js): logo,
 * the maintenance art, a heading and a line. It makes no API call of its own,
 * so it has nothing here.
 *
 * @param h  the shared invented account
 * @returns  [[RegExp over the pathname, (search, mode, pathname, method) => body], …]
 */
export const INVITE_EXPIRED = 'invite-expired';

export default (h) => {
  const { day } = h;
  const INVITOR = {
    id: 88020114,
    name: 'Sultan Al-Dosari',
    name_l1: 'سلطان الدوسري',
    agency: { id: 880077, name: 'Al Masar Real Estate', name_l1: 'المسار العقارية' },
  };
  const INVITATION = {
    id: 4417,
    status: 'pending',
    created_at: day(1).toISOString(),
    invitor: INVITOR,
  };
  return [
    /* GET only; the PUTs are forms.mjs's (it is consulted first and hands the
       GET back) */
    [/^\/api\/surge\/invitations$/, (search, mode) => (mode === INVITE_EXPIRED
      ? { success: false, errors: ['This invitation has expired'] }
      : { invitation: INVITATION })],
  ];
};
