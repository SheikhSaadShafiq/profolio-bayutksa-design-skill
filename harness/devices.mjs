/**
 * The two devices this design system is compiled for — one list, used by
 * the harness (page.mjs), the compiler and every scripts/ds/ step, so a page
 * is verified in exactly the device it was compiled in.
 *
 * The product picks its mobile layout by USER AGENT (src/utility/general.js
 * isMobile), not by width alone, so a responsive render needs a phone's user
 * agent as well as a phone's viewport — and touch, which some controls check.
 */
/* The zone the product is rendered in: Riyadh, where its users are. The product
   formats a time of day in the browser's zone (its TIMEZONE constant is read
   nowhere), and a browser given no zone takes the compiling machine's: on the Mac
   these pages were first compiled on, UTC+5, so a lead task set at 12:30 Riyadh
   read "2:30 pm". */
export const ZONE = 'Asia/Riyadh';
export const DEVICES = {
  web: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, timezoneId: ZONE },
  mobile: {
    viewport: { width: 375, height: 812 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, timezoneId: ZONE,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
  },
};

/** a compiled file's device, from the meta compile.mjs writes */
export const deviceOf = (html) => ((html.slice(0, 12000).match(/<meta name="pf-device" content="(\w+)"/) || [])[1] || 'web');
