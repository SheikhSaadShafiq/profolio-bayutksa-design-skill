/**
 * The states of /reports/summary on a PHONE that the explorer does not
 * reach, named like their web counterparts so data/design-kb.json pairs them.
 *
 * The page's Performance card is the dashboard's (ReportsLeadsTrafficSection),
 * so its phone states are the dashboard's: on a phone Calls, WhatsApp, SMS
 * and Emails are child tabs under Leads rather than figures with popovers, and
 * the date presets are a bottom sheet (dashboard.mobile.mjs says why).
 */
import { leadsStates, leadsChild } from './dashboard.mobile.mjs';

export default [
  ...leadsStates,
  {
    name: 'inline-div',
    note: 'phone: Performance → Leads → the Calls child tab. The web explorer reached the Calls breakdown by clicking the chart area (the Calls legend, no popover); on a phone it is the Calls tab under Leads',
    do: leadsChild('Calls'),
  },
];
