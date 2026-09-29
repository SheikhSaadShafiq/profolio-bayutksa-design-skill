/**
 * The states of /credits-usage on a PHONE that the explorer does not reach,
 * named like their web counterparts (a modal on the web is a bottom sheet
 * here, so data/design-kb.json pairs them by stem).
 *
 * The owner's empty top-up sheet is the explorer's (drawer-top-up-your-
 * credits); the same sheet as the agency STAFF user and the INDIVIDUAL broker
 * is here — see credits-usage.mjs topUpStates for why both reach it.
 */
import { topUpStates } from './credits-usage.mjs';

export default [
  ...topUpStates('drawer-top-up-your-credits', 'in the Credits Usage card header'),
];
