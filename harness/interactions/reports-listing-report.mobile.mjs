/**
 * The states of /reports/listing-report on a PHONE — none beyond what the
 * explorer finds (the Listing By Date tab, the feedback drawer) and the
 * shell's.
 *
 * What the web has and a phone does not: the quality popovers popover-31 …
 * popover-62. The web's Listing Performance table carries each listing's
 * quality chip; the phone's cards (CardListingPerformance.js, chosen at
 * ListingPerformanceTable.js:32) carry price, location, type, beds, area,
 * date and the traffic and lead counts, and no quality chip, so there is
 * nothing to open.
 *
 * Also on a phone: both lists' pagination is drawn but inert — the pages
 * are handed setPage={() => {}} (ListingPerformanceTable.js) and
 * setPageDate={() => {}} (ListingByDateTable.js), so tapping 2 changes
 * nothing. No state is compiled for a tap that changes nothing.
 */
export default [];
