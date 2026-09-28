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
 */
export default [
  { name: 'as-staff', mode: 'staff', note: 'the page as an agency STAFF user sees it: role staff, not agency admin, titanium package, profile 50% complete, call and WhatsApp tracking off (recorded from a real staff account, data/qa/delta-b.json)' },
];
