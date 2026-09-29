/**
 * Account variants — compiled on EVERY page, like the shell.
 *
 * A page renders differently for a different kind of account, and a second
 * real account showed how (scripts/delta-accounts.mjs, data/qa/delta-b.json):
 * an agency STAFF user sees nine rail items, no Users filter, a half-filled
 * profile ring, a restricted Agency Staff page, a Post Listing that opens on
 * the licence number, and Agency Settings redirects to User Settings. Each
 * variant is a fixture MODE (harness/fixtures/*.mjs answer it), so it is
 * rendered by the product itself rather than drawn.
 *
 * The third kind is the INDIVIDUAL broker — no agency at all
 * (harness/fixtures/profile.mjs, mode 'individual': users/current with
 * agency null, agency_admin false). It is the owner's own record with the
 * agency taken away, so what moves is the role and nothing else: no Agency
 * Staff in the rail and no route to it, no Agency Settings (it redirects to
 * User Settings), Licenses lists his own licence (users/:id/licenses), the
 * dashboard has no agency/user selector row, Agent Performance shows the
 * leaderboard and TruPoints cards instead of the team table, "Individual"
 * on User Settings and in the account popover — and User Settings gains the
 * Convert to Agency button, whose modal is that page's own state
 * (harness/interactions/user-settings-user-profile.mjs).
 */
export default [
  { name: 'as-staff', mode: 'staff', note: 'the page as an agency STAFF user sees it: role staff, not agency admin, titanium package, profile 50% complete, call and WhatsApp tracking off (recorded from a real staff account, data/qa/delta-b.json)' },
  { name: 'as-individual', mode: 'individual', note: 'the page as an INDIVIDUAL broker sees it — no agency (users/current agency null, agency_admin false, role null), the owner\'s own listings, leads, credits and package: no Agency Staff in the rail, no Agency Settings, his own FAL licence, no agency selector on the dashboard, the leaderboard instead of the team table, "Individual" instead of "Agency", and Convert to Agency on User Settings (harness/fixtures/profile.mjs mode individual)' },
];
