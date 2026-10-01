# Changelog — design-qa

Skill version and report schema version move independently. Consumers pin to
the schema version; the schema changes far less often.

## [1.1.0] — 2026-10-01
Report schema: v1 (unchanged; adds the optional `scope.profile`, `render_coverage` and `render_browser`)

### Added
- The render pass, `scripts/render.mjs` with `scripts/page-checks.js`. It
  renders each screen at its platform's width and at every breakpoint, and
  measures layout, accessibility, resources and motion. It Tabs through for
  visible focus, puts content extremes into the first data row of every
  repeated structure, and clicks every control that opens something. The
  `ovf`, `brk`, `mot`, `a11y.target`, `a11y.gap`, `a11y.focus` and
  `a11y.focusring` checks, skipped since 1.0.0, now run.
- New families: `lay` (layout), `int` (interaction), `res` (resources), and
  the render checks `cpy.undefined` and `a11y.small`.
- `--profile wireframe`, so the QA runs on wireframes as well as hi-fi.
  Visual checks wait for the hi-fi.
- `scripts/browser.mjs`: takes Playwright, Puppeteer or a Chrome on the
  machine, and installs one into a shared cache when there is none.
- The context step (`references/context.md`): widths, the hit-target
  minimum and the motion budget come from the product's context card.
- WCAG passes in the render: text at 200% (`a11y.zoom`), WCAG text spacing
  (`a11y.spacing`), landscape on a phone (`a11y.orientation`), focus hidden
  behind sticky content (`a11y.focusobscured`), field edges
  (`a11y.contrast.ui`), and the layout mirrored (`rtl.layout`).
- WCAG 2.5.8's spacing exception for undersized targets on the web.
- A `phone` platform: a web product on a phone, at WCAG's 24px.
- Static `a11y.alt`, `a11y.label`, `a11y.heading` and `rtl.dir`.
- `--states` (a states list for a product with no registry, in `matrix.py`
  and `run.py`), `--manual` (manual-check findings), `report.html`.
- `report.schema.json` declares `render_coverage`, `render_browser` and
  `scope.profile`.

### Changed
- Works without a registry or a token sheet: the checks that need them are
  skipped with the reason, and the rest run. 1.0.x stopped. Without a
  registry or a states list, the report warns that the empty state was not
  checked.
- Every check in the catalogue appears in the report: run, failed or
  skipped with the reason.
- `run.py` takes the profile from the render pass when it is not given.
- Waivers are read from the output folder by default; a waiver that names
  only a check is ignored and reported (`qa.waiver`).
- `_version.py` strips the frontmatter's quotes from the name and version.
- The verdict line says what was checked (`render_coverage`).
- At most ten findings of one check per screen; the tenth says how many
  more there are.

### Retired
- `a11y.target.mobile` and `a11y.target.web`, which were only ever listed
  as skipped. The check is `a11y.target`.

## [1.0.1] — 2026-09-29
Report schema: v1 (unchanged)

### Changed
- Scripts read the skill version from `SKILL.md` frontmatter via
  `scripts/_version.py` instead of a hardcoded constant, which would drift the
  first time someone bumped one and not the other.
- Reports now record `qa_skill_name` alongside the version, so a consumer can
  tell a fork from the original.

### Added
- `schema/platforms.json` — per-platform minimums (hit target, gap,
  breakpoints, gestures, safe area) as configuration rather than hardcoded
  values. Ships with web, iOS, Android, tablet and desktop.
- `references/versioning.md` — what carries a version, what reads it, and the
  bump policy.

## [1.0.0] — 2026-09-29
Report schema: v1

### Added
- Case matrix with four classes (required, required-if-differs, sampled,
  excluded) so the combinatorial space stays reviewable.
- Check catalogue across ten families: cov, tok, cpy, flw, par, rtl, a11y,
  ovf, brk, mot.
- Static check runner (`scripts/run.py`) covering everything that does not
  need a rendered page.
- Versioned `report.json` contract (`schema/report.schema.json`).
- Severity policy with expiring waivers.
- Manual checklist for judgment calls that rules cannot express.

### Known gaps
- Render-dependent checks (ovf, brk, mot, hit targets, focus) need a
  Playwright pass that is not yet written. Until it exists the runner reports
  them as skipped and refuses to return `pass`.
- `cpy.verbatim` needs `product/copy.md` in a parseable shape; currently only
  `cpy.placeholder` runs.
- Contrast pairs must be supplied as config; deriving them from rendered
  output is the render pass's job.
