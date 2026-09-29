# My Listings — new theme · phone spec (360)

> The designer's handover for the new My Listings (Profolio 2.0, not yet live), in the
> designer's own words — laid out by `scripts/theme/spec.mjs` from
> `authoring/themes/new/my-listings-mobile.handover.html`, nothing rewritten. Its screens and states, compiled:
> `pages/listings-new.html`, `pages/listings-new.mobile.html` and `pages/listings-new/`. Its tokens: `tokens.md` → *My Listings — new theme*.
> Where this spec and the compiled states disagree, the compiled states are the build as
> drawn; flag the difference [TBC].

## 00 · Summary

- MOBILE HANDOFF
- iOS · ANDROID · MWEB
- v2.0 · FINAL
- My Listings, Performance & Quality
- Bayut KSA Profolio 2.0 · mobile web and app · 360pt base
- Download tokens.json
- 00 · SUMMARY
The agent opens My Listings and sees, on every card, how that listing ranks against similar ones nearby and what its quality score is missing. Tapping the card opens a bottom sheet with the full performance trend, the peer comparison, and a fix list that can be worked through in one pass; every fix that is applied recalculates the score and the rank in place.

- RULE
Rank and quality are always shown together and always with the action that changes them. No number appears in this feature without a route to improving it.

- BASE WIDTH
- 360pt
- SCENARIOS
- 37
- TABS
- 5
- LISTING CASES
- 9
- DISPOSITIONS
- 25
- MOTION MOMENTS
- 10
- LOTTIE FILES
- 6

## 01 · Contents

- 00
- Summary
- 02
- Interactive prototype
- 02b
- Button states
- 02c
- State screens
- 03
- Screens, states and redlines
- 04
- Rules
- 05
- Interaction and motion
- 05b
- dotLottie
- 06
- Gestures and behaviours
- 07
- Edge cases and error states
- 08
- Assets
- 09
- Tokens
- 10
- Accessibility
- 11
- Performance budget
- 12
- Acceptance criteria
- 13
- Platform notes
- 14
- Open questions

## 02 · Interactive prototype

The real build, not a mock. Pick a scenario to jump straight into a state, then keep tapping.

- LIST
- Listing list
- NINE CASES
- Happy case
- High impression, low leads
- All bad
- Everything unfinished
- Low impression, high conversion
- Daily rental
- Off-plan initial sale
- Rank pending
- Just posted
- SHEETS
- Performance sheet
- Improve Quality
- Amenities picker
- How the score works
- Copy Bayut Link
- Mark as Booked
- Row menu
- Request Services
- Services requested
- TREND
- Trend: sudden drop
- Trend: one day spike
- Trend: down then back up
- Trend: no data yet
- FILTERING
- Filter sheet
- Sort sheet
- Filtering skeleton
- Location search
- Location: no match
- EMPTY STATES
- No active listings
- No drafts
- No pending listings
- No removed listings
- No filter results
- No internet
- Not a package user
- Not a package user, no listings
- TABS
- Draft tab
- Pending tab
- Removed tab
- Ad License Requests
- ONBOARDING
- Onboarding tour
- Tour with no listings
- CURRENT SCENARIO
- Listing list
The Active tab as an agent lands on it. Tap any card to open its performance sheet.


## 02b · Button states: applied and unapplied

The real components, lifted from the build. Every action has a resting state and an applied state: the applied state stays in place, reads grey, and says what happened.

- Upgrades
- Signature
- Card action row, first slot
- UNAPPLIED
- Apply Signature
Lilac #EFEFFE fill, gradient sparkle, dark label. Tapping applies it in session.

- APPLIED
- Signature Applied
Grey #F5F5F5 fill, muted #A9A9C4 sparkle, #626262 label, no action.

- Hot
- Icon tile beside Signature
- UNAPPLIED
Red tint tile, flame glyph at full opacity.

- APPLIED
On a Signature listing Hot is suppressed: 45% opacity, no tap. Signature is the senior badge.

- Verification, services and refresh
- TruCheck
- Icon tile only, the CTA lives in the sheet
- UNAPPLIED
White tile, green badge glyph. Opens the TruCheck sheet, which carries Apply for TruCheck.

- APPLIED
Verified: green tint tile. The sheet shows status and expiry instead of a CTA.

- Refresh
- Icon tile in the card action row
- UNAPPLIED
White tile, blue #479EEB glyph, tappable once a day.

- APPLIED
Already refreshed today: muted tile, and the drawer carries the Refreshed chip.

- Services
- Row 3-dot sheet item
- UNAPPLIED
- Request Services
Plain sheet row: green camera glyph and the label, no sub-line.

- APPLIED
- Services requested
- Photography scheduled
Label changes, a status sub-line appears, and one grey glyph per booked service stacks at 6px overlap with a 2px white ring.

- Fixes and saving
- Fix weight
- Fix card header, right side
- UNAPPLIED
- +12%
Green tint chip carrying the score weight. Card is expandable.

- APPLIED
- Fixed
Weight is replaced by Fixed, the card collapses and stops counting toward the save bar.

- Save bar
- Sticky footer inside the sheet
- UNAPPLIED
- Not rendered
Hidden until a fix is touched, so the sheet ends on content.

- APPLIED
- Discard
- Save changes
Sticky footer: "N changes ready to save" with the gain chip, Discard and the green CTA.

- Filters, tabs and publishing
- Filter chip
- Chip bar under the header
- UNAPPLIED
- Purpose
White fill, label, grey chevron. Tapping opens its value sheet.

- APPLIED
- For Sale
Green tint, the value replaces the label, chevron becomes an inline clear.

- Performance segment
- Beside the filter chips
- UNAPPLIED
- All
- Low
Unselected options sit on the track in #707070 500.

- APPLIED
- All
- Low
Selected option gets a white pill, soft shadow and #222222 700.

- Publish
- Draft row, beside the row actions
- UNAPPLIED
- Post Now
Green tint CTA. Reads Post Now for every draft disposition, blocked or not.

- APPLIED
- Posted
Once posted the row leaves Draft, so the applied state is the row moving to Pending.


## 02c · State screens

Every empty and error state as its own screen. One line mark, one sentence, one action, no animation. Open them live from the scenario chips above.

- No internet connection
Your listings could not load. Check your connection and try again.

- Try Again
- I am back online
- No internet
Suppresses the rows and any empty state. The back-online link is a review affordance.

- No active listings yet
Post your first listing to see its rank, quality score and daily performance here.

- Post a Listing
- See how scores work
- No active listings
First run. The only state that offers the explainer.

- No drafts saved
Listings you start but do not post are kept here for 30 days.

- Post a Listing
- No drafts
Draft tab, count drops to 0.

- Nothing waiting for approval
Listings sit here while they are in review, or while a license or payment is pending.

- View Active Listings
- No pending listings
Pending tab, count drops to 0.

- No removed listings
Listings you delete, and ones that expire or get rejected, are kept here for 90 days.

- View Active Listings
- No removed listings
Removed tab, count drops to 0.

- No listings match these filters
Nothing here with the filters you picked. Remove one, or search a different Bayut ID.

- Clear filters
- No filter results
The only state whose action clears the applied filters.


## 03 · Screens, states & redlines

Eight screens. Turn redlines on, then hover any element inside a frame to read its measured box.

### S1 · Listing card — Active tab · all performance and quality states

The unit the whole feature is built on. Thumbnail, badge row, price, subtype, location, then the two tiles that carry rank and quality side by side, then the action row. Every state below is the same skeleton with different tile content and tone.

| element | spec |
|---|---|
| Card | 360 wide minus 12 side inset · pad 12 · radius 8 · white on #F3F4F5 |
| Thumbnail | 80 x 80 · radius 6 · photo badge bottom-left, video badge beside it |
| Badge row | gap 4 · chip h 20 · pad 0 6 · radius 4 · 10/700 · order Live, Booked, Hot or Signature, discount |
| Price | 17/22/700 #222222 · Night suffix 12/400 #707070 with 4 gap |
| Subtype line | 12/16/600 #249F62 · directly under price · replaces the old chip |
| Location | 12/16/400 #707070 · single line, ellipsis |
| Stat strip | 3 columns equal · label 11/500 #9D9D9D over value 14/700 · delta 11/600 tinted by sign |
| Rank tile | 1fr · pad 10 · radius 6 · tint by backend tone · value 15/700 · CTA 12/600 green · red tone adds inset shadow 0 0 2 rgba(255,0,0,0.12) |
| Quality tile | 1fr · same box · bar h 6 radius 999 · track tint 100, fill tone strong · band: >70 good, 46-70 warn, <=45 bad |
| Action row | h 44 · gap 8 · primary fills, icon buttons 44 x 44 |
| Row menu | 44 x 44 tap target, glyph 24 · opens bottom sheet, not a popover |

**Rules**

Quality tone is a pure score band: above 70 green, 46 to 70 amber, 45 and below red. The bar fill, the value and the tile tint all take the same band.

Rank tone is NOT a percentile. It is set per listing from the peer comparison the listing is actually losing or winning on, which is why 52nd of 240 reads amber: it sits in the top quarter but the top listing still takes 1.6x its leads. Green means the listing beats the area average, amber means a named peer beats it, red means it is behind on both. The backend supplies the tone with the rank.

Hot and Signature never appear together. Signature is senior: when it is applied, the Hot action is disabled and the Signature upsell is hidden.

A tile never shows a number without the action that changes it. If there is no action, the tile shows the explanation instead.

- Good
- High imp, low leads
- All bad
- No data yet
- Rank pending
- Daily rental

### S2 · Filter and sort bar — Single scrolling chip bar above the list

One horizontally scrolling bar carries everything: More Filters with its applied count, Sort, the performance segment, then the individual filter chips. There is no second row of applied chips on mobile: each chip shows its own applied value.

| element | spec |
|---|---|
| Bar | h 56 · pad 0 12 · gap 8 · horizontal scroll, no scrollbar, 12 lead and trail inset |
| More Filters chip | 44 x 32 · icon only · count badge 16 circle top-right, #F73131 on white ring |
| Sort chip | 44 x 32 · icon only · no label, the applied order lives in the sheet |
| Performance segment | 3 up · h 32 · radius 999 · selected white on #F0FAF5 with #D4EFE2 ring |
| Value chip | h 32 · pad 0 12 · label swaps to the applied value, truncated at 14 chars with ellipsis, inline x at 24 target |
| Clear filters | 12/600 #CE2929 · last item · only present when at least one filter is on |
| Value sheet | bottom sheet, max 70% viewport · single select radio or multi select check · Apply pinned |
| Filtering skeleton | 3 cards · 1800ms fixed · label "Filtering 65 listings..." 12/500 #707070 centred |

**Rules**

The badge on More Filters counts every applied filter including those set from the chips, so the two never disagree.

Entering or leaving the Ad License Requests tab clears listing filters and swaps the whole chip set. Nothing carries across.

Applying anything, from any surface, runs the same 1800ms skeleton. Sorting runs it too.

- Default
- Filter sheet
- Sort sheet
- Filtering

### S3 · Performance bottom sheet — Opens from the card · trend, peer comparison, quality

The sheet is the detail view. Header repeats the listing identity, then the date range pill, the trend chart with its compare selector, the rank block, and the quality block with the fix list. It is a sheet, not a page: the list stays behind it.

| element | spec |
|---|---|
| Sheet | full width · top radius 20 · max height 92% · shadow 0 -8 32 rgba(0,0,0,0.16) |
| Grabber | 36 x 4 · radius 999 · #DEDEDE · 8 from top, centred |
| Scrim | rgba(0,0,0,0.42) · fades with the sheet · tap dismisses |
| Header | pad 16 · 56 thumb · price, subtype, badge row repeated including the discount tag |
| Date pill | h 32 · pad 0 12 · radius 999 · opens the range sheet: 7, 14, 30, 90 days, this year, since posted |
| Trend chart | h 168 · pad 16 · 3 series · own line 2pt solid, peers 1.5pt dashed |
| Compare selector | 3 up segment · All / You vs Top / You vs Average |
| Tooltip | tap and hold on the plot · date, three series values, delta line · follows the finger, clamped to the plot |
| Rank block | pad 16 · tinted by tone · rank, peer sentence, CTA full width h 44 |
| Quality block | score 28/700 · bar h 8 · fix cards stacked, first expanded only |
| Fix card | pad 14 · radius 8 · numbered · collapsed h 52, expanded auto · action button right |

**Rules**

Only the first fix card is expanded on open. Opening another collapses the previous one.

Applying a fix updates the score, the bar and the rank in place. The sheet never closes to show a result.

Cases with no own data keep the axis and the dashed peer lines, and show "Your line starts tomorrow" over the plot instead of an empty state.

- Good listing
- Needs work
- No data yet
- Rank pending

### S4 · Quality and Improve Quality — Fix list, perfect score, explainer entry

The quality block is the actionable half of the sheet. It lists what is missing, in the order that moves the score most, and every item carries the control that fixes it. When the score is 100 the list is replaced by a single confirmation panel.

| element | spec |
|---|---|
| Score | 28/34/700 tone strong · percent sign 16/600 same colour |
| Bar | h 8 · radius 999 · track tone 100 · fill tone strong · grows once on first view |
| How it's calculated | 12/600 #249F62 · 44 tap height · opens the explainer sheet |
| Fix card header | index circle 20 · title 13/600 · chevron 20 right |
| Fix card body | 12/19/400 #4F4F4F · gap 10 · action button h 40 full width |
| Applied state | check icon replaces index · title strikes to #9D9D9D · card collapses after 420ms |
| Perfect panel | pad 16 · #F0FAF5 · title "Perfect Quality Score" 14/700 #10603A over the maintain sentence |
| Explainer sheet | full height sheet on white · back arrow left, title 18/700 Figtree, close right |

**Rules**

Fixes are ordered by score impact, never alphabetically or by how easy they are.

The explainer is generic for every user: no per-listing numbers, no agent-specific values.

The score shown on the card and the score in the sheet are always the same value. There is one quality number per listing.

- Fix list
- Perfect score
- Explainer

### S5 · Share sheet — From the row menu · every listing

A link preview of the listing, the copyable link, then the channel grid. Picking a channel raises a toast and records the channel in the footer line, so the agent can see where a listing has already been pushed.

| element | spec |
|---|---|
| Sheet | top radius 20 · pad 16 · content height, not full screen |
| Preview card | 64 thumb · price with Night suffix · green subtype line · location |
| Link field | h 44 · read only · mono 12 · bayut.sa/property/details-<bayutId>.html · Copy button inside, right |
| Copied state | button label flips to "Copied" on #E9F7F0 for 2000ms, then reverts |
| Channel grid | 3 across · gap 8 · tile h 76 · brand colour glyph over 12/500 label |
| Footer | "Last shared on ..." 12/400 #707070 · Done button h 44 green, full width |

**Rules**

The link is never editable. Copy is the only interaction on that field.

Picking a channel does not close the sheet: the agent may share to more than one.

- Share
- Row menu

### S6 · Onboarding tour — First open · four steps · replayable

A spotlight tour that runs once on first open of the redesigned list. Step one is a full-screen card, steps two to four cut a hole around the real element and morph between them. It can be replayed from the state picker.

| element | spec |
|---|---|
| Scrim | rgba(0,0,0,0.62) · cutout radius matches the target plus 4 bleed |
| Card | pad 16 · radius 12 · white · max width 300 · flips above or below the target to stay on screen |
| Title | 16/22/700 Figtree #222222 |
| Body | 13/20/400 #4F4F4F · max 3 lines |
| Progress | dots 6 · gap 5 · active #28B16D, rest #DEDEDE |
| Buttons | Skip 12/600 #707070 left · Next h 36 green right · last step reads Got it |
| Morph | cutout and card animate together over 360ms cubic-bezier(.32,.72,0,1) |

**Rules**

Copy is positive and instructional. No step names a problem the user has.

Tapping the scrim advances, it does not dismiss. Only Skip dismisses.

Seen state persists per user, not per device. Replay lives in settings, not in the list.

- Run tour

### S7 · Empty, loading and error — Every non-happy list state

Four list-level states share one layout: an illustration slot, a title, a sentence, and at most one action. The skeleton is the only one that is not a message.

| element | spec |
|---|---|
| Skeleton card | 3 shown · h 148 · radius 8 · sweep 1400ms linear infinite · opacity steps 1, 0.84, 0.68 |
| Empty title | 15/700 #222222 · centred · 32 above the sentence |
| Empty body | 13/20/400 #707070 · max width 260 · centred |
| Empty action | h 44 · pad 0 20 · green · only when there is one obvious next step |
| Error state | same layout, #FFF2F2 icon chip · Retry button, secondary style |
| Offline | sticky strip above the bar · h 32 · #FEF8F0 · 12/500 #C88B37 |

**Rules**

Never show a spinner alone. Either a skeleton that matches the shape of what is coming, or a message.

An empty tab explains what puts a listing in that tab, it does not just say there is nothing here.

- Filtering
- Draft tab
- Pending tab
- Removed tab

### S8 · Header and tabs — Five tabs, each with its own card design

The header carries the page title and the count. Tabs scroll horizontally with the active one underlined. Each tab has a different card because each has a different job: Active is performance, Draft is completion, Pending is waiting, Removed is recovery, Ad License is process.

| element | spec |
|---|---|
| Header | h 56 · pad 0 16 · title 18/700 Figtree · count 12/400 #707070 beside it |
| Tab bar | h 44 · gap 20 · horizontal scroll · label 13/600 · active #222222, rest #9D9D9D |
| Indicator | h 2 · #28B16D · width of the label · slides 240ms ease-out |
| Status chip | grey #F5F5F5/#707070, green #E9F7F0/#249F62, amber #FEF8F0/#C88B37, orange #FCEDD9/#C88B37, blue #F0F7FC/#3B84C4, red #FFF2F2/#CE2929 |
| Removed thumbnail | grayscale(1) · stats shown muted #9D9D9D |
| Ad License card | no photo · price, Location line, green pill with the combined type title |

**Rules**

The count in the header is the count for the active tab, not the total.

Timeline labels follow the status: Active posted and expiring, Draft created and updated, Pending uploaded, Removed posted and removed.

On the Ad License tab the performance segment and the sort control are hidden, not disabled.

- Active
- Draft
- Pending
- Removed
- Ad License

## 04 · Rules

The decisions that are not visible in a frame. Break one and the feature stops making sense.

- Numbers and tone
- ✓
- DO
Show rank and quality together, always with the action that improves them.

Use one quality value per listing, identical on the card and in the sheet.

Colour by band, so the same number always reads the same way.

- ✕
- DON'T
Do not show a metric with no route to changing it.

Do not invent precision: if the data is a day old, say so on the date pill.

Do not colour a number red purely because it fell. A high performer that dipped is still green.

- Copy
- ✓
- DO
Name the improvement, not the failure. "Add 3 more interior images", never "Poor photos".

Keep explainer copy generic: no per-listing numbers, no agent names.

One sentence per idea. Peer comparisons state the multiple and the direction.

- ✕
- DON'T
Never use em dashes. Use a colon, comma or full stop.

Do not use a question as a heading.

Do not blame the agent, and do not congratulate for a default state.

- Sheets and navigation
- ✓
- DO
Use a bottom sheet for anything that returns the agent to the list.

Keep the list mounted behind every sheet, at its scroll position.

Let a second-layer sheet push the first back 28pt at 45% opacity, so depth is legible.

- ✕
- DON'T
Do not push a full page for detail. Detail is a sheet on this feature.

Do not stack more than two sheet layers.

Do not close a sheet to show the result of an action taken inside it.

- Actions
- ✓
- DO
Put the destructive item last in the row menu, separated and tinted red.

Disable, do not hide, an action that is unavailable for a known reason, and say why on tap.

Confirm every write with a toast that names what happened.

- ✕
- DON'T
Do not show Mark as Booked on anything but a daily rental.

Do not offer both Hot and Signature at once.

Do not use a popover on mobile. The row menu is a sheet.

- Loading and change
- ✓
- DO
Match the skeleton to the shape of the content that is coming.

Recalculate in place: the number that changed is the thing that animates.

Hold the filtering state for a fixed 1800ms so the change is perceivable.

- ✕
- DON'T
Do not use a bare spinner for list-level loading.

Do not reorder the list under the agent's finger while they are reading it.

Do not animate a value the agent did not cause to change.


## 05 · Interaction & motion

Every row replays the real timing. Six of them ship as finished .lottie files, in 05b below.

- Download all .json
- 05.1
- Card tap
Performance sheet rises from the bottom over a fading scrim. The card behind stays put.

- 340ms
- cubic-bezier(.32,.72,0,1)
- sheet enters, scrim 0 to 0.42
- 05.2
- Sheet dismiss
Drag down past 25% of sheet height or tap the scrim. Below the threshold it springs back.

- 260ms
- cubic-bezier(.32,.72,0,1)
- velocity over 0.5pt/ms also dismisses
- 05.3
- Quality bar fill
The score bar grows from 0 to its value once, when the Quality section first becomes visible.

- 640ms
- cubic-bezier(.22,1,.36,1)
- transform-origin left, never replays on scroll
- 05.4
- Fix applied
Check mark pops in, the fix row collapses, the score number counts up and the bar re-grows to the new value.

- 420ms
- cubic-bezier(.22,1,.36,1)
- number counts in 16 steps
- ✓
- 05.5
- Rank recalculating
Rank value is replaced by a shimmering pill while the new position is fetched.

- 1200ms
- ease-in-out infinite
- loops until the value lands
- 52nd
- 05.6
- Filtering
List is replaced by three skeleton cards with a sweeping highlight and the count label.

- 1800ms
- linear
- fixed hold, not tied to the request
- 05.7
- Chip press
Chip scales down and back on touch down, then the value sheet opens.

- 120ms
- ease-out
- no ripple on iOS, ripple on Android
- Purpose
- 05.8
- Toast
Confirmation slides up from the bottom, holds, and fades out.

- 3200ms
- ease
- in 200 / hold 2800 / out 200
- Fix applied
- 05.9
- Tour spotlight
The cutout morphs from one target to the next while the card slides to the opposite side.

- 360ms
- cubic-bezier(.32,.72,0,1)
- position, size and radius interpolate together
- 05.10
- Explainer reveal
Each block rises 12pt into place as it enters the viewport, staggered 60ms.

- 420ms
- cubic-bezier(.22,1,.36,1)
- re-arms every time the sheet opens
- Block
- TIMING
The per-row .json is a timing stub: correct frame rate, in and out points and easing, one placeholder shape, so the pipeline can be wired before the art lands. Six of these moments are already finished animations, in 05b below. The rest are one or two properties moving and should be implemented natively.

- 05b · DOTLOTTIE
Finished files, shared with web so both surfaces animate identically. Each tile plays the real animation data.

- Rank updating
- LOOPS
- Rank tile, drawer and row, while the new position is fetched
- 1200ms
- 200x120
- rank_updating.lottie
- Quality score fill
- ONCE
- Quality section, once when it first scrolls into view
- 640ms
- 200x120
- quality_fill.lottie
- Fix applied
- ONCE
- Fix card, on confirm, before the row collapses
- 900ms
- 200x120
- fix_applied.lottie
- Rank explainer bars
- ONCE
- Mobile explainer banner tile, grows once on mount
- 800ms
- 200x120
- rank_bars.lottie
- No internet
- LOOPS
- List area, both surfaces, while offline
- 2000ms
- 240x140
- no_internet.lottie
- No listings yet
- LOOPS
- Empty state on every tab, and after a filter returns nothing
- 2400ms
- 240x140
- empty_listings.lottie
- USE
60fps, brand palette baked in, no text layers, so the same file works in EN and AR. iOS takes them through dotlottie-ios, Android through dotlottie-android, mweb through dotlottie-web. Loop files run until their state ends; one-shot files play once on the trigger and hold the last frame. Under Reduce Motion do not mount the player: render the last frame as a still.


## 06 · Gestures & behaviours

Touch only. Where two gestures compete, the winner is named.

- GESTURE
- BEHAVIOUR
- CONFLICT / RESOLUTION
- PLATFORM
- Tap card
Opens the performance sheet for that listing. The whole card is the target, minus the row menu and the action buttons.

Action buttons and the menu stop propagation.

- all
- Tap row menu
Opens the action sheet from the bottom.

Never a popover on mobile.

- all
- Drag sheet down
Sheet follows the finger. Release past 25% of its height, or over 0.5pt/ms, dismisses. Below that it springs back.

When the sheet content is scrolled away from the top, the scroll wins until it reaches the top.

- all
- Tap scrim
Dismisses the sheet. During the tour it advances instead.

Tour overrides. Only Skip dismisses the tour.

- all
- Horizontal swipe on chip bar
Scrolls the bar. No snapping, 12pt lead and trail inset.

Vertical intent above 10pt hands the gesture to the list.

- all
- Horizontal swipe on tabs
Scrolls the tab strip only. It does not change tab.

Deliberately not a pager: the cards differ per tab.

- all
- Tap and hold on chart
Shows the tooltip and tracks the finger, clamped to the plot. Release hides it.

Suppresses sheet drag while active.

- all
- Pull to refresh
Refetches the active tab. Threshold 64pt.

Disabled while a sheet is open.

- iOS, Android
- Back gesture / button
Closes the top sheet layer. From the list, leaves My Listings.

Second-layer sheet closes first, revealing the one beneath.

- Android, iOS edge swipe
- Long press card
No behaviour. Reserved.

Do not add a context menu here without revisiting the row menu.

- all

## 07 · Edge cases & error states

Unresolved rows are flagged, never dropped.

- Hide unresolved
- #
- CASE
- EXPECTED BEHAVIOUR
- COPY
- 01
- Listing has fewer than 24 hours of data
Stats show a dash, not a zero. Rank tile explains that the position is still being calculated.

Your rank against similar listings will be available within 1 hour.

- 02
- Fewer than 10 similar listings in the area
Rank is hidden entirely. The quality block takes the full width.

Not enough similar listings nearby to rank this one yet.

- 03
- Quality score is exactly 100
Fix list is replaced by the perfect panel. No Improve Quality CTA anywhere on the card.

Perfect Quality Score. Keep it fresh to maintain the rank.

- 04
- Fix applied but score does not move
Score stays, the fix still marks as done, and a line explains why the impact was zero.

Applied. This one does not change the score on its own.

- 05
- Rank fetch fails
Tile keeps its shape and shows a retry link. The rest of the card is unaffected.

- Rank unavailable. Retry
- 06
- Trend request fails
Chart area shows the axis with an inline retry. The rest of the sheet stays usable.

- Could not load the trend. Retry
- 07
- Offline on open
Cached list renders with a sticky offline strip. Sheets open, but every write action is disabled.

You are offline. Showing your last loaded listings.

- 08
- Write action while offline
Action button shows the disabled reason on tap. Nothing is queued.

You need a connection to do that.

- 09
- Listing removed while the sheet is open
Sheet stays, content greys, and a strip appears above the actions.

This listing was removed while you were viewing it.

- 10
- Price discount removed by another user
Discount tag disappears on the next fetch. No animation, no toast.

- —
- 11
- Daily rental with overlapping booking request
Overlapping nights are rejected inline in the calendar, existing ranges are kept.

Those nights overlap an existing booking.

- 12
- Zero listings in a tab
Empty state naming what puts a listing in that tab, with the one action that applies.

Nothing here yet. Listings appear once moderation approves them.

- 13
- Filter combination returns nothing
Empty state with a clear-filters action, filters stay applied.

No listings match these filters.

- 14
- Very long location string
Single line, ellipsis. The full value is in the sheet header, which wraps to two lines.

- —
- 15
- Arabic locale
Full mirror. Chart direction, chip bar order, and delta arrows all flip.

- —
- 17
- Listing with no photos
Not designed yet, documented only. A zero-photo listing renders the striped placeholder with a count badge reading 0, indistinguishable from one that has photos. Proposed: #F5F5F5 box, centred camera-slash glyph #9D9D9D, no count badge, the words No photos below it. Most common on Draft cards. A photo that fails to load falls back to the same box.

- No photos
- 16
- REGA license expires while listing is live
Listing moves to Removed on the next fetch, with the renew action.

Your REGA ad license expired. Renew it to bring this listing back.


## 08 · Assets

Real files, generated in the browser. SVG is the source. PNG and JPEG are rasterised from it at the density you pick.

- @1x
- @2x
- @3x
- Download all PNG @2x
- ic-rank
- Rank position · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-quality
- Quality score · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-views
- Views · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-clicks
- Clicks · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-leads
- Leads · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-filter
- Filters · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-sort
- Sort · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-share
- Share · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-calendar
- Calendar · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-camera
- Add photos · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-edit
- Edit listing · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-eye
- Preview · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-delete
- Delete · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-info
- Info · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-photo
- Photo count · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-video
- Video count · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-chevron
- Chevron · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-close
- Close · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-back
- Back · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-check
- Fix applied · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-arrow-up
- Delta up · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-arrow-down
- Delta down · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-tag
- Discount tag · 24pt
- SVG
- PNG
- JPG
- Copy markup
- ic-more
- Row menu · 24pt
- SVG
- PNG
- JPG
- Copy markup
- Naming and folders
- ios/  ic_rank.imageset/ic_rank@1x.png @2x @3x
- android/  res/drawable-mdpi..xxxhdpi/ic_rank.png
- android/  res/drawable/ic_rank.xml (vector, preferred)
- mweb/  icons/ic-rank.svg (inline, currentColor)
- No production imagery in this delivery
Every thumbnail is a striped CSS placeholder: repeating-linear-gradient(135deg, #EDEDED 0 6px, #F6F6F6 6px 12px). Real listing photography comes from the listings API and must be requested at 2x the rendered box, 80x80pt on the card and 56x56pt in the sheet header. A listing with no photos, and a photo that fails to load, both fall back to a #F5F5F5 box with a camera-slash glyph and the words No photos: specified in edge case 17, not drawn in the build yet.


## 09 · Tokens

One JSON file. Click any swatch to copy its hex.

- Download tokens.json
- CONSUMER PRIMARY (BAYUT SCALE)
Every green in both surfaces now comes from this ramp. Steps 10 and 11 extend it for pressed states and ink on tints.

- -1
- #F0FAF5
- Tinted strips, banners, empty state tile
- 0
- #E9F7F0
- Green status chip fill
- 1
- #D4EFE2
- Outline on tinted surfaces, Live chip
- 2
- #BEE8D3
- Selected chip border
- 3
- #A9E0C5
- Icon on tint
- 4
- #93D8B6
- Chart grid, muted fill
- 5
- #7ED0A7
- Chart area fill
- 6
- #69C899
- Secondary series
- 7
- #53C18A
- Progress fill
- 8 (Main)
- #28B16D
- Primary button, progress, active
- 9
- #249F62
- Subtype line, stat up, tab underline
- 10
- #208E57
- Pressed and hover on primary
- 11
- #10603A
- Ink on green tints
- BRAND
- color.brand.green
- #28B16D
- color.brand.greenPressed
- #208E57
- color.brand.greenInk
- #249F62
- color.brand.greenDeep
- #10603A
- STATUS
- color.status.good
- #249F62
- color.status.warn
- #C88B37
- color.status.bad
- #CE2929
- color.status.info
- #3B84C4
- color.status.neutral
- #707070
- TINTS
- tint.green050
- #F0FAF5
- tint.green100
- #E9F7F0
- tint.green200
- #D4EFE2
- tint.teal050
- #F7FCFC
- tint.blue050
- #F0F7FC
- tint.amber050
- #FEF8F0
- tint.amber100
- #FCEDD9
- tint.red050
- #FFF2F2
- tint.red100
- #FFE0E0
- TEXT AND SURFACE
- text.primary
- #222222
- text.secondary
- #4F4F4F
- text.tertiary
- #626262
- text.muted
- #707070
- text.faint
- #9D9D9D
- border.base
- #E6E6E6
- border.soft
- #F0F0F0
- surface.page
- #F3F4F5
- RADIUS
- xs
- 4
- sm
- 6
- md
- 8
- lg
- 12
- sheet
- 20 top only
- pill
- 999
- SPACING
- xxs
- 2
- xs
- 4
- sm
- 6
- md
- 8
- lg
- 12
- xl
- 16
- xxl
- 20
- section
- 24
- TYPE
- price
- 17/22/700
- subtype
- 12/16/600
- stat value
- 14/18/700
- label
- 11/14/500
- sheet title
- 18/24/700 Figtree
- body
- 13/20/400
- TARGETS
- minimum
- 44
- icon button
- 44
- chip
- 32 visual, 44 hit
- card row
- 88 min

## 10 · Accessibility

Touch targets, contrast, and what a screen reader announces.

- ELEMENT
- TARGET
- CONTRAST
- ANNOUNCES
- Card
- full card, 88 min
- AA
"Apartment for Sale, SAR 960,000, Al Hazm. Ranked 52nd of 240. Quality 55 percent. Opens performance details."

- Rank CTA
- 44
- AA
- "Improve listing rank, button."
- Quality bar
- n/a
- AA
Exposed as a progress indicator with value, min 0, max 100.

- Row menu
- 44
- AA
- "More actions for this listing, button. Opens a menu."
- Filter chip
- 32 visual, 44 hit
- AA
- "Purpose, For Sale, filter. Double tap to change."
- Chip clear x
- 24 visual, 44 hit
- AA
- "Clear purpose filter, button."
- Sheet
- n/a
- AA
Focus moves to the sheet title on open, returns to the card on close. Announced as a modal dialog.

- Sheet grabber
- 44 band
- AA
Focusable and labelled "Close, button". Sheets carry no X, so the grabber, the scrim and the back gesture are the three ways out.

- Delta arrows
- n/a
- AA
Direction is in the label, not only the colour: "up 19 percent".

- Status chip
- n/a
- AA
Read as text. Colour is never the only carrier of status.

- Toast
- n/a
- AA
Announced politely, not assertively. Never steals focus.

- Tour card
- 44 buttons
- AA
Announced on appear. Skip is the first focusable element.

- RM
Under Reduce Motion the sheet appears at its final position with a 120ms opacity fade, the score bar jumps to its value, and the tour spotlight moves without the morph. Nothing is removed, only the travel.


## 11 · Performance budget

Timings the design assumes. If the real numbers differ, the design changes, not the timing.

- MOMENT
- BUDGET
- IF IT OVERRUNS
- List first paint
- under 400ms
Show the skeleton instead of an empty page. Never a white screen.

- Card thumbnail
- 80pt at 2x
Request 160px. Fade in over 160ms. Placeholder is the striped gradient, never a grey box.

- Sheet open to content
- under 200ms
The sheet still opens at 340ms with its skeleton inside. The sheet never waits for data.

- Trend data
- under 800ms
Axis renders immediately, the lines draw when the data lands.

- Filtering hold
- 1800ms fixed
This is a design hold, not a request timeout. If the request is slower, extend the skeleton, do not flash.

- Fix apply round trip
- under 1200ms
Optimistic: the check and the collapse happen immediately, the score animates when the value returns. Revert with a toast on failure.

- Rank recalculation
- under 3000ms
Shimmer pill holds. After 3s, show the previous rank with a quiet retry.

- Images per screen
- max 6 decoded
Recycle off-screen thumbnails. Do not decode the whole tab.


## 12 · Acceptance criteria

0 of 18 checked. State is local to this page, for your own walkthrough.

- Clear
- Listing card
Rank tile tone comes from the backend peer comparison, not from the position: green beats the area average, amber loses to a named peer, red is behind on both.

Quality tile tone matches the score bands: above 70 green, 46 to 70 amber, 45 and below red.

Hot and Signature never render together, and the Hot action is disabled on Signature listings.

Every tile with a number also renders its CTA, or the explanation when no action exists.

- Filter bar
More Filters badge equals the total number of applied filters from every surface.

A chip with a value shows that value truncated at 14 characters, with an inline clear.

Switching to or from Ad License Requests clears listing filters and swaps the chip set.

Any apply, from any surface, runs the 1800ms skeleton with the count label.

- Performance sheet
Sheet dismisses on a drag past 25% of its height or on a flick over 0.5pt/ms.

Only the first fix card is expanded on open.

Applying a fix updates score, bar and rank without closing the sheet.

A listing with no own data keeps the axis and dashed peer lines with the pre-data overlay.

- Onboarding
Tour runs once per user, not per device.

Scrim tap advances, only Skip dismisses.

Replay is reachable after the first run.

- Accessibility
Every interactive element has a 44pt minimum target, including inline chip clears.

All body text meets 4.5:1 against its background, and headline text meets 3:1.

Reduce Motion removes travel but keeps every state change visible.


## 13 · Platform notes

Where the three targets are allowed to differ.

- CONCERN
- iOS
- ANDROID
- MOBILE WEB
- Sheet
UISheetPresentationController, large detent, grabber visible.

BottomSheetDialogFragment, Material 3, drag handle visible.

Fixed position layer, body scroll locked, safe-area padding at the bottom.

- Sheet corner
20pt top, system default is acceptable.

20dp top.

20px top.

- Back
Edge swipe closes the top layer.

System back closes the top layer, then the screen.

Browser back closes the top layer. Push a history entry per sheet.

- Press feedback
Opacity 0.6 on press, no ripple.

Ripple, bounded to the target shape.

Background darkens one step on :active.

- Typeface
Lato, the app face.

Lato, the app face.

Geist.

- Icons
PDF vector in an imageset, or the supplied @1x/@2x/@3x PNGs.

Vector drawable XML preferred, PNG densities as fallback.

Inline SVG with currentColor.

- Haptics
Light impact on fix applied and on booking confirmed. Nothing else.

Same two moments, HapticFeedbackConstants.CONFIRM.

None.

- Pull to refresh
Native refresh control.

SwipeRefreshLayout.

Not implemented. Refresh is the browser's.

- Reduce motion
UIAccessibility.isReduceMotionEnabled.

Settings.Global.ANIMATOR_DURATION_SCALE and the a11y flag.

prefers-reduced-motion.

- Safe area
Bottom inset on the sheet footer and the toast.

Gesture inset on the sheet footer.

env(safe-area-inset-bottom).


## 14 · Open questions

- DATA
- How often does rank actually recalculate on the server?
The design says once a day, after day one. If it is more frequent, the shimmer state needs a different trigger.

- DATA
Is the peer set the same for rank and for the trend comparison?

The sheet implies it is. If they differ, the two blocks need separate labels.

- PRODUCT
Does the tour run again after a major release, or only once ever?

Currently once per user. A version key on the seen flag would allow re-running it.

- PRODUCT
Should fixes be applicable from the card, or only from the sheet?

Today the card only routes to the sheet. Inline fixes would shorten the path but crowd the card.

- ENG
- Is the fix apply idempotent?
The design applies optimistically and reverts on failure. That needs a safe retry.

- DESIGN
Arabic mirror has not been visually reviewed.

Chart direction and delta arrows are specified, but the layout has not been walked through in RTL.

