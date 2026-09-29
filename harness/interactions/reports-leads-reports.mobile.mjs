/**
 * The states of /reports/leads-reports on a PHONE that the explorer does not
 * reach, named like their web counterparts so data/design-kb.json pairs them.
 *
 * The Performance card is the dashboard's (ReportsLeadsTrafficSection), so
 * its phone states are the dashboard's (dashboard.mobile.mjs says why).
 *
 * What the web has and a phone does not: the filter bar over “Traffic and
 * Leads by date” — dropdown-select-purpose, popover-close-circle (the date
 * range's clear icon) and inline-search. On a phone the list is
 * ListingContainerMobile, which is handed filtersList and never renders it
 * (ListingStatsByDateTable.js:55-77, ListingContainerMobile.js): the phone
 * list cannot be filtered by purpose, date or agent at all.
 */
import { leadsStates } from './dashboard.mobile.mjs';

export default [...leadsStates];
