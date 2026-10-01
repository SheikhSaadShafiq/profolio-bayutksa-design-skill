#!/usr/bin/env python3
"""
Design QA runner: the static checks, and the render pass's results folded in.

Runs every check that does not need a rendered page, then reads the render
pass (scripts/render.mjs) from --rendered-dir and adds its findings. Without a
render pass the render checks are reported as skipped, and the verdict cannot
be pass.

A registry and a token sheet make more checks possible (coverage, parity,
tokens); without them those checks are skipped with the reason, and the rest
still run, so the skill works on any product's screens.

    node scripts/render.mjs --screens screens/ --out qa/report
    python run.py --root . --screens screens/ --rendered-dir qa/report --out qa/report

--profile wireframe leaves out the visual checks (tokens, verbatim copy,
contrast, fonts, motion): a wireframe is checked for structure, coverage,
layout and what opens, and the hi-fi gets the rest.

Emits report.json against schema/report.schema.json v1.

Exit codes: 0 pass, 1 pass_with_warnings, 2 blocked.
"""
import argparse, html, html.parser, json, re, sys, datetime, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _version import skill_version, skill_name

SKILL_VERSION = skill_version()      # from SKILL.md frontmatter — never hardcode
SKILL_NAME = skill_name()
SCHEMA_VERSION = 1                   # the report contract; moves slower than the skill

RENDER_CHECKS = {
    "ovf.long", "ovf.longest_real", "ovf.empty_string", "ovf.single_char",
    "ovf.zero", "ovf.big_number", "ovf.negative", "ovf.no_image",
    "ovf.null_date", "ovf.arabic", "brk.render", "brk.gap",
    "mot.reduced", "mot.budget", "mot.infinite",
    "a11y.target", "a11y.gap", "a11y.small",
    "a11y.focus", "a11y.focusring",
    "lay.align", "lay.controls", "lay.rows", "lay.squashed", "lay.spacing",
    "lay.overlap", "lay.clip",
    "int.dead", "int.offscreen", "int.clip", "int.unstyled",
    "res.font", "res.image", "cpy.undefined",
    "a11y.contrast.ui", "a11y.zoom", "a11y.spacing", "a11y.orientation", "a11y.focusobscured", "rtl.layout",
}
# checks the render pass cannot run on static HTML, and why
RENDER_CANNOT = {
    "ovf.longest_real": "needs the product's real copy, which static screens do not carry",
    "ovf.null_date": "static HTML has no date logic to fail",
    "brk.gap": "needs the declared breakpoint ranges; brk.render covers each breakpoint",
}
# why a catalogue check did not run, when nothing ran it
NOT_RUN = {
    "cpy.verbatim": "needs the product's copy (product/copy.md) to compare against",
    "cpy.missing": "needs the product's copy in both languages",
    "cpy.prd_conflict": "needs the PRD and the product's copy",
    "flw": "needs prototype/flows.json (pass --flows)",
    "par": "needs a registry that pairs screens across platforms",
    "a11y.contrast.ui": "needs the render pass",
    "rtl.icon": "judged: check directional icons by hand",
    "rtl.number": "judged: check numerals and currency direction by hand",
    "brk.canonical": "needs the declared canonical breakpoints",
}
# checks a wireframe is not held to: they judge visual design, which a wireframe leaves open
WIREFRAME_SKIPS = ("tok.", "cpy.verbatim", "a11y.contrast", "mot.", "res.font")

SEV = {}  # check id -> default severity, filled below
def _sev(d):
    for k, v in d.items():
        SEV[k] = v

_sev({
    "cov.state": "blocker", "cov.empty": "blocker", "cov.role": "warning",
    "cov.flag": "blocker", "cov.platform": "blocker", "cov.locale": "warning",
    "tok.inline": "blocker", "tok.hex": "blocker", "tok.px": "warning",
    "tok.resolve": "blocker", "tok.orphan": "note", "tok.provenance": "warning",
    "tok.tbc": "note", "tok.class": "blocker",
    "cpy.verbatim": "blocker", "cpy.missing": "warning",
    "cpy.placeholder": "blocker", "cpy.prd_conflict": "warning",
    "flw.node": "blocker", "flw.reach": "blocker", "flw.back": "blocker",
    "flw.dismiss": "blocker", "flw.orphan": "warning", "flw.dead": "blocker",
    "par.states": "warning", "par.copy": "warning", "par.actions": "warning",
    "par.undeclared": "warning",
    "rtl.physical": "blocker", "rtl.dir": "blocker", "rtl.icon": "note",
    "rtl.number": "warning",
    "a11y.contrast.body": "blocker", "a11y.contrast.large": "blocker",
    "a11y.contrast.ui": "warning", "a11y.label": "blocker", "a11y.alt": "blocker",
    "a11y.heading": "warning",
})
for c in RENDER_CHECKS:
    SEV.setdefault(c, "warning")
RETIRED = {"a11y.target.mobile", "a11y.target.web"}        # references/checks.md: retired, never reported
SEV["ovf.long"] = SEV["ovf.longest_real"] = SEV["ovf.big_number"] = "blocker"
SEV["ovf.null_date"] = SEV["ovf.arabic"] = "blocker"
SEV["brk.render"] = SEV["mot.reduced"] = "blocker"
SEV["a11y.focusring"] = "blocker"
SEV["brk.canonical"] = "warning"
SEV["mot.infinite"] = "warning"
_sev({
    "a11y.target": "blocker", "a11y.gap": "warning", "a11y.small": "warning",
    "lay.align": "blocker", "lay.controls": "blocker", "lay.squashed": "blocker",
    "lay.spacing": "blocker", "lay.overlap": "blocker", "lay.clip": "blocker",
    "lay.rows": "warning",
    "int.dead": "warning", "int.offscreen": "blocker", "int.clip": "blocker",
    "int.unstyled": "blocker",
    "res.font": "blocker", "res.image": "blocker", "cpy.undefined": "blocker",
    "a11y.zoom": "blocker", "a11y.spacing": "blocker", "a11y.orientation": "blocker",
    "a11y.focusobscured": "blocker", "rtl.layout": "blocker", "qa.waiver": "warning",
    "ovf.zero": "warning", "ovf.empty_string": "warning", "ovf.no_image": "warning",
    "ovf.negative": "note", "ovf.single_char": "note",
})


# ── helpers ───────────────────────────────────────────────────────────────

class Report:
    def __init__(self):
        self.findings = []
        self.checks = {}

    def ran(self, check, cases=1):
        self.checks.setdefault(check, {"check": check, "status": "pass",
                                       "skipped_reason": None, "cases": 0})
        self.checks[check]["cases"] += cases

    def skip(self, check, reason):
        self.checks[check] = {"check": check, "status": "skipped",
                              "skipped_reason": reason, "cases": 0}

    def fail(self, check, screen, message, node=None, css_path=None,
             expected=None, actual=None, case=None, hint=None, role=None):
        self.ran(check, 0)
        self.checks[check]["status"] = "fail"
        self.findings.append({
            "check": check,
            "severity": SEV.get(check, "warning"),
            "screen": screen,
            "case": case,
            "node": node,
            "css_path": css_path,
            "role": role,
            "message": message,
            "expected": expected,
            "actual": actual,
            "evidence": None,
            "waived": False,
            "waiver": None,
            "section_hint": hint or _hint(check),
        })


def _hint(check):
    if check.startswith("ovf") or check.startswith("brk") or check == "cpy.undefined":
        return "edge-cases"
    if check.startswith("a11y") or check.startswith("rtl") or check.startswith("mot"):
        return "accessibility"
    if check.startswith(("lay", "int", "res")):
        return "acceptance"
    if check.startswith("cov"):
        return "state-screens"
    return "open-questions"


def strip_comments(css):
    return re.sub(r"/\*.*?\*/", "", css, flags=re.S)


def root_block(css):
    m = re.search(r":root\s*\{(.*?)\}", css, re.S)
    return m.group(1) if m else ""


def relative_luminance(rgb):
    def ch(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (ch(x) for x in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(rgb1, rgb2):
    l1, l2 = relative_luminance(rgb1), relative_luminance(rgb2)
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def hex_to_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    if len(h) not in (6, 8):
        return None
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# ── checks ────────────────────────────────────────────────────────────────

def check_tokens(rep, css_path, screens):
    css = css_path.read_text(encoding="utf-8")
    bare = strip_comments(css)
    root = root_block(bare)
    outside = bare.replace(root, "", 1)

    defined = set(re.findall(r"(--[\w-]+)\s*:", root))
    used = set(re.findall(r"var\(\s*(--[\w-]+)", bare))
    classes = set(re.findall(r"\.([a-zA-Z][\w-]*)", bare))

    rep.ran("tok.resolve")
    for t in sorted(used - defined):
        rep.fail("tok.resolve", str(css_path.name),
                 f"token {t} is referenced but never defined")

    rep.ran("tok.orphan")
    for t in sorted(defined - used):
        rep.fail("tok.orphan", str(css_path.name),
                 f"token {t} is defined but never used")

    rep.ran("tok.hex")
    for m in re.finditer(r"#[0-9a-fA-F]{3,8}\b|rgba?\(", outside):
        line = outside[:m.start()].count("\n") + 1
        rep.fail("tok.hex", str(css_path.name),
                 f"raw colour value outside :root at ~line {line}",
                 actual=m.group(0))

    rep.ran("tok.px")
    decls = re.sub(r"@media[^{]*\{", "", outside)
    for m in re.finditer(r":\s*[^;{}]*?\b\d+(\.\d+)?px", decls):
        rep.fail("tok.px", str(css_path.name),
                 "px literal in a declaration outside :root",
                 actual=m.group(0).strip()[:60])

    # Provenance lives in comments, so this one check reads the RAW css.
    raw_root = root_block(css)
    rep.ran("tok.provenance")
    for m in re.finditer(r"(--[\w-]+)\s*:", raw_root):
        line_start = raw_root.rfind("\n", 0, m.start()) + 1
        line_end = raw_root.find("\n", m.start())
        line = raw_root[line_start:line_end if line_end > 0 else len(raw_root)]
        # a tag on the declaration's own line, or on the nearest preceding
        # comment line, covers both per-token and per-group tagging
        preceding = raw_root[max(0, line_start - 300):line_start]
        group_tag = re.findall(r"\[(src|live|px|TBC)\]", preceding)
        if not re.search(r"\[(src|live|px|TBC)\]", line) and not group_tag:
            rep.fail("tok.provenance", str(css_path.name),
                     f"token {m.group(1)} has no provenance tag")

    rep.ran("tok.tbc")
    n = len(re.findall(r"\[TBC\]", css))
    if n:
        rep.fail("tok.tbc", str(css_path.name),
                 f"{n} tokens still marked [TBC]", actual=n)

    for s in screens:
        html = s.read_text(encoding="utf-8")
        rep.ran("tok.inline")
        for m in re.finditer(r'\sstyle="', html):
            line = html[:m.start()].count("\n") + 1
            rep.fail("tok.inline", s.name,
                     f"inline style attribute at line {line}")
        rep.ran("tok.class")
        body = html[html.find("<body"):] if "<body" in html else html
        for cls in set(re.findall(r'class="([^"]+)"', body)):
            for c in cls.split():
                if c and c not in classes and not c.startswith("i-"):
                    rep.fail("tok.class", s.name,
                             f"class .{c} is used but not defined in the token sheet")
    return defined, root


def check_contrast(rep, root, pairs):
    """pairs: list of (name, fg_token, bg_token, kind) from the config."""
    vals = dict(re.findall(r"(--[\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})", root))
    for name, fg, bg, kind in pairs:
        f, b = vals.get(fg), vals.get(bg)
        if not (f and b):
            continue
        rf, rb = hex_to_rgb(f), hex_to_rgb(b)
        if not (rf and rb):
            continue
        ratio = contrast(rf, rb)
        check = {"body": "a11y.contrast.body", "large": "a11y.contrast.large",
                 "ui": "a11y.contrast.ui"}[kind]
        floor = {"body": 4.5, "large": 3.0, "ui": 3.0}[kind]
        rep.ran(check)
        if ratio < floor:
            rep.fail(check, "tokens",
                     f"{name}: {fg} on {bg} is {ratio:.2f}:1",
                     expected=f">= {floor}:1", actual=f"{ratio:.2f}:1",
                     hint="accessibility")


def check_coverage(rep, registry, screens_by_name):
    for page, meta in registry.get("pages", {}).items():
        states = meta.get("states", [])
        rep.ran("cov.state", len(states))
        html = screens_by_name.get(page)
        if html is None:
            rep.fail("cov.platform", page, "screen file declared in registry does not exist")
            continue
        rendered = set(re.findall(r'data-state="([^"]+)"', html))
        for st in states:
            if st not in rendered:
                rep.fail("cov.state", page, f"state '{st}' is declared but not rendered")
        rep.ran("cov.empty")
        if "empty" not in rendered:
            rep.fail("cov.empty", page,
                     "no empty state — a screen that can show a list can show an empty list")
        roles = meta.get("roles", [])
        rep.ran("cov.role", len(roles))
        rendered_roles = set(re.findall(r'data-role="([^"]+)"', html))
        for r in roles:
            if r not in rendered_roles and len(roles) > 1:
                rep.fail("cov.role", page, f"role '{r}' declared but not represented")


class _Markup(html.parser.HTMLParser):
    """the parts of a screen the static accessibility checks read"""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.imgs, self.controls, self.labels, self.headings, self.dirs = [], [], set(), [], []
        self._open = []          # (tag, attrs, text) of buttons and links being read
        self._h = None
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "html" and d.get("dir"):
            self.dirs.append(d["dir"])
        if tag == "img":
            self.imgs.append(d)
        if tag == "label" and d.get("for"):
            self.labels.add(d["for"])
        if tag in ("input", "select", "textarea") and d.get("type") not in ("hidden", "submit", "button", "reset"):
            self.controls.append((tag, d, None))
        if tag in ("button", "a") and (tag == "button" or "href" in d):
            self._open.append([tag, d, ""])
        if re.fullmatch(r"h[1-6]", tag):
            self._h = [int(tag[1]), ""]
        if self._open and tag in ("img", "svg") and (d.get("alt") or d.get("aria-label")):
            self._open[-1][2] += " " + (d.get("alt") or d.get("aria-label"))
    def handle_endtag(self, tag):
        if self._open and self._open[-1][0] == tag:
            t, d, text = self._open.pop()
            self.controls.append((t, d, text.strip()))
            if self._open:
                self._open[-1][2] += " " + text
        if self._h and tag == f"h{self._h[0]}":
            self.headings.append(tuple(self._h)); self._h = None
    def handle_data(self, data):
        if self._open:
            self._open[-1][2] += data
        if self._h:
            self._h[1] += data


def check_markup(rep, screens_by_name, locales):
    """a11y.alt, a11y.label, a11y.heading and rtl.dir, read from each screen's markup"""
    any_rtl = False
    for name, page in screens_by_name.items():
        m = _Markup()
        try:
            m.feed(page)
        except Exception:
            continue
        any_rtl = any_rtl or "rtl" in m.dirs or 'dir="rtl"' in page
        rep.ran("a11y.alt", len(m.imgs))
        for d in m.imgs:
            if "alt" not in d and d.get("role") not in ("presentation", "none") and d.get("aria-hidden") != "true":
                rep.fail("a11y.alt", name, f"An image has no alt: {str(d.get('src', ''))[:60]} (use alt=\"\" if it is decorative)")
        rep.ran("a11y.label", len(m.controls))
        for tag, d, text in m.controls:
            named = text or d.get("aria-label") or d.get("aria-labelledby") or d.get("title") or (d.get("id") and d["id"] in m.labels)
            if not named:
                rep.fail("a11y.label", name, f"A {tag} has no accessible name ({' '.join(f'{k}={v}' for k, v in list(d.items())[:3])})")
        rep.ran("a11y.heading", len(m.headings))
        last = 0
        for level, text in m.headings:
            if last and level > last + 1:
                rep.fail("a11y.heading", name, f"The heading “{text.strip()[:40]}” is h{level} after an h{last}: a level is skipped")
            last = level
    if any(l.startswith("ar") or l in ("he", "fa", "ur") for l in locales):
        rep.ran("rtl.dir")
        if not any_rtl:
            rep.fail("rtl.dir", "(all)", "A right-to-left locale is in scope, but no screen sets dir=\"rtl\"")


def write_html(report, path):
    """report.html: the same report, for people"""
    esc = lambda x: html.escape(str(x if x is not None else ""))
    rows = "".join(f"<tr class='{esc(f['severity'])}{' waived' if f.get('waived') else ''}'><td>{esc(f['severity'])}</td><td><code>{esc(f['check'])}</code></td><td>{esc(f['screen'])}</td><td>{esc(f.get('case'))}</td><td>{esc(f['message'])}</td></tr>" for f in sorted(report["findings"], key=lambda f: ["blocker", "warning", "note"].index(f["severity"])))
    skipped = "".join(f"<li><code>{esc(c['check'])}</code>: {esc(c['skipped_reason'])}</li>" for c in report.get("checks_run", []) if c["status"] == "skipped")
    c = report["counts"]
    path.write_text(f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Design QA — {esc(report['verdict'])}</title>
<style>body{{font:14px/1.5 system-ui,sans-serif;margin:24px;color:#1f2328}}table{{border-collapse:collapse;width:100%}}td,th{{border-bottom:1px solid #d0d7de;padding:6px 8px;text-align:left;vertical-align:top}}
.blocker td:first-child{{color:#b42318;font-weight:600}}.warning td:first-child{{color:#9a5b00}}.waived{{opacity:.55}}code{{font-size:12px}}</style></head><body>
<h1>Design QA: {esc(report['verdict'].replace('_', ' '))}</h1>
<p>{c['blocker']} blocker(s), {c['warning']} warning(s), {c['note']} note(s), {c['waived']} waived · profile {esc(report['scope'].get('profile'))} · {esc(report['qa_skill_name'])} {esc(report['qa_skill_version'])}</p>
<p>Checked: {esc(report.get('render_coverage') or 'not rendered: the render checks were skipped')}</p>
<table><tr><th>severity</th><th>check</th><th>screen</th><th>case</th><th>finding</th></tr>{rows}</table>
<h2>Not checked</h2><ul>{skipped or '<li>nothing</li>'}</ul></body></html>""", encoding="utf-8")


def check_copy(rep, screens_by_name):
    bad = re.compile(r"\b(lorem ipsum|TODO|TBC|FIXME|xxx+|placeholder)\b", re.I)
    for name, html in screens_by_name.items():
        body = html[html.find("<body"):] if "<body" in html else html
        text = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", body, flags=re.S)
        text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
        text = re.sub(r"<[^>]+>", " ", text)
        rep.ran("cpy.placeholder")
        for m in bad.finditer(text):
            rep.fail("cpy.placeholder", name,
                     f"placeholder text in a user-visible string: {m.group(0)!r}")


def check_rtl(rep, css_path, locales):
    if "ar" not in locales:
        rep.skip("rtl.physical", "Arabic not in scope")
        rep.skip("rtl.dir", "Arabic not in scope")
        return
    css = strip_comments(css_path.read_text(encoding="utf-8"))
    rep.ran("rtl.physical")
    physical = re.compile(
        r"\b(margin|padding|border)-(left|right)\b|(?<![\w-])\b(left|right)\s*:")
    for m in physical.finditer(css):
        line = css[:m.start()].count("\n") + 1
        rep.fail("rtl.physical", css_path.name,
                 f"physical property at ~line {line}; use the logical equivalent",
                 actual=m.group(0).strip())


def check_flows(rep, flows, registry, ids):
    if not flows:
        rep.skip("flw.node", "no flows.json in scope")
        return
    node_ids = set(ids.get("nodes", {}).keys()) if ids else set()
    for feature, f in flows.items():
        screens = set(f.get("screens", []))
        entry = f.get("entry")
        trans = f.get("transitions", [])

        rep.ran("flw.node", len(trans))
        for t in trans:
            if node_ids and t.get("node") not in node_ids:
                rep.fail("flw.node", t.get("from", feature),
                         f"transition references node {t.get('node')} which does not exist")

        rep.ran("flw.dead", len(trans))
        for t in trans:
            if t.get("to") not in screens:
                rep.fail("flw.dead", t.get("from", feature),
                         f"transition targets unknown screen {t.get('to')}")

        rep.ran("flw.reach")
        reachable, frontier = {entry}, [entry]
        while frontier:
            cur = frontier.pop()
            for t in trans:
                if t.get("from") == cur and t.get("to") not in reachable:
                    reachable.add(t["to"]); frontier.append(t["to"])
        for s in screens - reachable:
            rep.fail("flw.reach", s, "screen is not reachable from the entry screen")

        rep.ran("flw.back")
        for s in screens - {entry}:
            if not any(t.get("from") == s for t in trans):
                rep.fail("flw.back", s, "screen has no route back")


def check_parity(rep, registry):
    for feature, meta in registry.get("features", {}).items():
        pairs = meta.get("pairs", [])
        declared = {x for p in meta.get("unpaired", {}).values() for x in p}
        all_screens = {f"{plat}/{s}"
                       for plat, lst in meta.get("screens", {}).items() for s in lst}
        paired = {x for p in pairs for x in p}
        rep.ran("par.undeclared")
        for s in sorted(all_screens - paired - declared):
            rep.fail("par.undeclared", s,
                     "screen has no counterpart on the other platform and is not listed in unpaired")


# ── main ──────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True, help="design system directory")
    ap.add_argument("--out", default="qa/report")
    ap.add_argument("--css", default="tokens.css")
    ap.add_argument("--registry", default="registry.json")
    ap.add_argument("--flows", default="prototype/flows.json")
    ap.add_argument("--ids", default="ids.json")
    ap.add_argument("--waivers", default=None)
    ap.add_argument("--locales", default="en")
    ap.add_argument("--platforms", default="web")
    ap.add_argument("--rendered-dir", default=None,
                    help="directory of render-pass output; without it render checks are skipped")
    ap.add_argument("--contrast-pairs", default=None,
                    help="JSON list of [name, fg_token, bg_token, kind]")
    ap.add_argument("--screens", default=None,
                    help="folder of screen HTML; default: <root>/screens and <root>/pages")
    ap.add_argument("--context", default=None,
                    help="the context card (design/context.json); its token sheet is used when --css is not found")
    ap.add_argument("--profile", default=None, choices=["hifi", "wireframe"],
                    help="default: the render pass's profile, else hifi")
    ap.add_argument("--states", default=None,
                    help='a states list for a product with no registry: {"pages": {"<screen>": {"states": [...]}}}')
    ap.add_argument("--manual", default=None,
                    help="manual-check findings (assets/checklist.md), as a JSON list of findings")
    a = ap.parse_args()

    root = pathlib.Path(a.root)
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    rep = Report()

    card = {}
    ctx_path = pathlib.Path(a.context) if a.context else root / "design" / "context.json"
    if ctx_path.exists():
        card = json.loads(ctx_path.read_text(encoding="utf-8"))

    css_path = root / a.css
    if not css_path.exists() and card.get("tokens", {}).get("file"):
        css_path = root / card["tokens"]["file"]
    has_css = css_path.exists()

    reg_path = root / a.registry
    registry = json.loads(reg_path.read_text()) if reg_path.exists() else None
    if registry is None and a.states and pathlib.Path(a.states).exists():
        registry = json.loads(pathlib.Path(a.states).read_text())        # the person's list stands in

    if a.screens:
        sp = pathlib.Path(a.screens)
        screens = sorted(sp.rglob("*.html")) if sp.is_dir() else [sp]
    else:
        screens = sorted((root / "screens").rglob("*.html")) if (root / "screens").exists() else []
        screens += sorted((root / "pages").glob("*.html")) if (root / "pages").exists() else []
    screens = [p for p in screens if "/qa/" not in str(p).replace("\\", "/")]
    by_name = {p.stem: p.read_text(encoding="utf-8") for p in screens}

    locales = a.locales.split(",")
    flows = json.loads((root / a.flows).read_text()) if (root / a.flows).exists() else None
    ids = json.loads((root / a.ids).read_text()) if (root / a.ids).exists() else None

    rootblk = ""
    if has_css:
        defined, rootblk = check_tokens(rep, css_path, screens)
        check_rtl(rep, css_path, locales)
    else:
        for c in ("tok.inline", "tok.hex", "tok.px", "tok.resolve", "tok.orphan", "tok.provenance", "tok.tbc", "tok.class", "rtl.physical"):
            rep.skip(c, "no token sheet: pass --css, or a context card with tokens.file")
    if registry is not None:
        check_coverage(rep, registry, by_name)
        check_flows(rep, flows, registry, ids)
        check_parity(rep, registry)
    else:
        for c in ("cov.state", "cov.role", "cov.flag", "cov.platform", "cov.locale", "flw.node", "flw.orphan", "par.states", "par.copy", "par.actions", "par.undeclared"):
            rep.skip(c, "no registry.json and no --states list: ask the person for the states, and run again with --states")
        rep.ran("cov.empty")
        rep.fail("cov.empty", "(all)", "The empty state was not checked: there is no registry and no states list. "
                 "Every list needs one; ask the person, and run again with --states", hint="state-screens")
        rep.findings[-1]["severity"] = "warning"
    check_copy(rep, by_name)
    check_markup(rep, by_name, locales)

    if a.contrast_pairs:
        check_contrast(rep, rootblk, json.loads(pathlib.Path(a.contrast_pairs).read_text()))
    elif not a.rendered_dir:
        rep.skip("a11y.contrast.body", "no contrast pair config supplied, and no render pass")

    # the render pass: its findings, its checks, its coverage
    render = None
    if a.rendered_dir and (pathlib.Path(a.rendered_dir) / "render.json").exists():
        render = json.loads((pathlib.Path(a.rendered_dir) / "render.json").read_text(encoding="utf-8"))
    render_available = bool(render and render.get("ok"))
    if a.profile is None:
        a.profile = (render or {}).get("profile") or "hifi"
    elif a.profile == "hifi" and (render or {}).get("profile") == "wireframe":
        print("The render pass ran as a wireframe: this report is a wireframe's. Render the hi-fi for a hi-fi report.", file=sys.stderr)
        a.profile = "wireframe"
    if render_available:
        for c in render.get("checks_run", []):
            rep.ran(c["check"], c.get("cases", 1))
        for f in render.get("findings", []):
            where = f"{f.get('platform', '')} {f.get('width', '')}px".strip()
            rep.fail(f["check"], f["screen"], f["message"], node=f.get("node"), css_path=f.get("css_path"),
                     expected=f.get("expected"), actual=f.get("actual"), case=f"{where} · {f.get('case', '')}")
            if f.get("box"):
                rep.findings[-1]["evidence"] = "box " + ",".join(str(v) for v in f["box"]) + " @ " + where
        for c in sorted(RENDER_CHECKS):
            if c not in rep.checks:
                rep.skip(c, RENDER_CANNOT.get(c, "the render pass found nothing to run it on in these screens"))
    else:
        why = (render or {}).get("error") or "no render pass: run scripts/render.mjs and pass --rendered-dir"
        for c in sorted(RENDER_CHECKS):
            rep.skip(c, why)

    if a.profile == "wireframe":
        for c in set(rep.checks) | set(SEV):
            if c.startswith(WIREFRAME_SKIPS):
                rep.skip(c, "wireframe: visual checks wait for the hi-fi")
        rep.findings = [f for f in rep.findings if not f["check"].startswith(WIREFRAME_SKIPS)]

    # waivers
    waived = 0
    wpath = pathlib.Path(a.waivers) if a.waivers else out / "waivers.json"
    if wpath.exists():
        wl = json.loads(wpath.read_text()).get("waivers", [])
        today = datetime.date.today().isoformat()
        def valid(w):
            """references/severity.md: a waiver names the check and the element, says why, who, and until when"""
            missing = [k for k in ("check", "reason", "who", "expires_on") if not w.get(k)]
            if not (w.get("node") or w.get("css_path") or w.get("screen")):
                missing.append("node, css_path or screen")
            return missing
        for w in wl:
            missing = valid(w)
            if missing:
                rep.fail("qa.waiver", "(waivers)", f"A waiver for {w.get('check')} is ignored: it lacks {', '.join(missing)} (references/severity.md)")
                rep.findings[-1]["severity"] = "warning"
        wl = [w for w in wl if not valid(w)]
        for f in rep.findings:
            for w in wl:
                if w.get("check") != f["check"] or not (w.get("node") or w.get("css_path") or w.get("screen")):
                    continue
                if (w.get("node") and w["node"] != f.get("node")) or (w.get("css_path") and w["css_path"] != f.get("css_path")) or (w.get("screen") and w["screen"] != f.get("screen")):
                    continue
                if f["severity"] == "blocker" and not (w.get("node") or w.get("css_path")):
                    continue                                     # a blocker is waived element by element, never a whole screen
                if w.get("expires_on", "9999") >= today:
                    f["waived"] = True; f["waiver"] = w; waived += 1
    # manual checks (assets/checklist.md): recorded the same way, so the gate reads one file
    if a.manual and pathlib.Path(a.manual).exists():
        for m in json.loads(pathlib.Path(a.manual).read_text()):
            rep.fail(m.get("check", "manual"), m.get("screen", "(all)"), m["message"], node=m.get("node"), css_path=m.get("css_path"), hint="open-questions")
            rep.findings[-1]["severity"] = m.get("severity", "warning")
    # every check in the catalogue is reported: run, failed, or skipped with the reason
    for c in sorted(SEV):
        if c in RETIRED:
            continue
        if c not in rep.checks:
            rep.skip(c, NOT_RUN.get(c) or NOT_RUN.get(c.split(".")[0]) or "not run: check it by hand (assets/checklist.md)")

    counts = {"blocker": 0, "warning": 0, "note": 0}
    for f in rep.findings:
        if not f["waived"]:
            counts[f["severity"]] += 1

    if counts["blocker"] or not render_available:
        verdict = "blocked"
    elif counts["warning"]:
        verdict = "pass_with_warnings"
    else:
        verdict = "pass"

    report = {
        "schema_version": SCHEMA_VERSION,
        "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "qa_skill_version": SKILL_VERSION,
        "qa_skill_name": SKILL_NAME,
        "ids_available": bool(ids),
        "render_available": render_available,
        "scope": {
            "pages": sorted(by_name.keys()),
            "platforms": [p["id"] for p in render.get("platforms", [])] if render_available else a.platforms.split(","),
            "locales": locales,
            "profile": a.profile,
        },
        "render_coverage": render.get("coverage") if render_available else None,
        "render_browser": render.get("browser") if render_available else None,
        "verdict": verdict,
        "counts": {**counts, "waived": waived,
                   "skipped_checks": sum(1 for c in rep.checks.values()
                                         if c["status"] == "skipped")},
        "findings": rep.findings,
        "checks_run": sorted(rep.checks.values(), key=lambda c: c["check"]),
    }

    (out / "report.json").write_text(json.dumps(report, indent=2))
    write_html(report, out / "report.html")
    print(f"{verdict.upper()} — {counts['blocker']} blockers, "
          f"{counts['warning']} warnings, {counts['note']} notes, {waived} waived")
    if render_available:
        print(f"checked: {render.get('coverage')}")
    else:
        print("not rendered: the render checks were skipped, so this cannot pass")
    print(f"wrote {out/'report.json'}")
    sys.exit({"pass": 0, "pass_with_warnings": 1, "blocked": 2}[verdict])


if __name__ == "__main__":
    main()
