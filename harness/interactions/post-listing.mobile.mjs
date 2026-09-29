/**
 * /post-listing on a phone — the states only the phone layout has.
 *
 * A phone has no Post a Listing menu, so even a package user starts on the
 * chooser (post-listing-with-options.js:118, "Mobile has no menu") and picks
 * Sale/Rent before the licence step; the flow's phone steps do the same
 * (post-listing.mjs openLicenceStep).
 */
import { openLicenceStep } from './post-listing.mjs';

export default [
  {
    name: 'page-license-number',
    devices: ['mobile'],
    note: 'the Sale/Rent card tapped on the chooser: the licence step, empty — on the web this is the page itself (post-listing-with-options.js ?step=license-number)',
    do: async (p) => { await openLicenceStep(p); },
  },
];
