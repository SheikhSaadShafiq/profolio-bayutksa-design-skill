/**
 * The post-listing states no click reaches.
 *
 * A desktop package user lands on ?step=license-number
 * (post-listing-with-options.js:120-123); the rest of the flow is found by
 * harness/explore.mjs and listed in data/states/post-listing.json.
 */
export default [
  {
    name: 'modal-non-saudi',
    mode: 'non-saudi',
    devices: ['web', 'mobile'],
    note: 'a user who is not a Saudi national cannot post: the "Unable to Post Listing" modal opens over the first step (LimitNonSaudiNationalModal.js:21, is_saudi_national false)',
    do: async (p) => { await p.waitForSelector('.ant-modal, .ant-drawer-content', { timeout: 20000 });  /* a phone shows it as a drawer */ await p.waitForTimeout(800); },
  },
];
