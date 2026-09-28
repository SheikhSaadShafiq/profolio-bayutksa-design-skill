/**
 * The settings page for an account whose profile is NOT complete.
 *
 * The default capture is the complete account, as the real one is; this is
 * the 90% account (harness/fixtures/profile.mjs, mode 'incomplete'), which
 * adds the Profile Completeness card under the settings nav and draws the
 * header ring part-filled.
 */
export default [
  { name: 'profile-incomplete', note: 'profile 90% complete: the completeness card and the part-filled header ring (profile-completion.js:59)', mode: 'incomplete' },
];
