/**
 * /post-listing/:id on a phone — the states only the phone layout has.
 *
 * A phone has no preview rail: the REGA card sits above the form and the
 * preview is behind See Preview, in a bottom sheet (post-listing.js:707). The
 * sheet is a fixed box of the product's own, not an antd overlay, so it is
 * photographed at viewport size. harness/explore.mjs finds the same tap and,
 * seeing no antd overlay, calls it inline-see-preview; this state has that
 * name so it replaces the find with a viewport shot of it.
 */
import { press } from '../fixtures/forms.mjs';

export default [
  {
    name: 'inline-see-preview',
    devices: ['mobile'],
    shot: 'viewport',
    note: 'See Preview on a phone: "Listing Preview", the listing as buyers will see it, in a bottom sheet over the form (post-listing.js:707)',
    do: async (p) => {
      await p.getByText('Add Images of your Property').first().waitFor({ state: 'visible', timeout: 20000 });
      await press(p, p.getByRole('button', { name: 'See Preview' }).first());
      await p.getByText('Listing Preview').first().waitFor({ state: 'visible', timeout: 10000 });
      await p.waitForTimeout(800);
    },
  },
];
