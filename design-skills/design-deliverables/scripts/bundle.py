#!/usr/bin/env python3
"""
Bundle a deliverable into ONE self-contained HTML file.

Everything is inlined: CSS, JS, fonts (base64 woff2), images (data URI),
Lottie (inline JSON), the node ledger, and the QA report. The output makes
zero network requests, which is the point — these documents get emailed,
opened offline, and opened again in two years.

    python bundle.py --src deliverable-src/ --out dist/my-listings-v3.html \
        --feature my-listings --version 3 --manifest manifest.json

Sources stay split in git. Never hand-edit the bundled output — rebuild it.
"""
import argparse, base64, json, mimetypes, pathlib, re, sys, datetime, hashlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _version import skill_version, skill_name

SKILL_VERSION = skill_version()
SKILL_NAME = skill_name()

SIZE_BUDGET_MB = 12.0        # warn past this
SIZE_HARD_MB = 25.0          # refuse past this

FONT_MIME = {
    ".woff2": "font/woff2", ".woff": "font/woff",
    ".ttf": "font/ttf", ".otf": "font/otf",
}


def data_uri(path: pathlib.Path) -> str:
    mime = FONT_MIME.get(path.suffix.lower()) \
        or mimetypes.guess_type(path.name)[0] \
        or "application/octet-stream"
    b64 = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{b64}"


def inline_css_assets(css: str, base: pathlib.Path, log: list) -> str:
    """Replace url(...) in CSS with data URIs."""
    def repl(m):
        raw = m.group(1).strip("'\"")
        if raw.startswith(("data:", "http://", "https://", "#")):
            if raw.startswith(("http://", "https://")):
                log.append(("external-css-url", raw))
            return m.group(0)
        p = (base / raw).resolve()
        if not p.exists():
            log.append(("missing-css-asset", raw))
            return m.group(0)
        log.append(("inlined", str(p.name)))
        return f"url('{data_uri(p)}')"
    return re.sub(r"url\(([^)]+)\)", repl, css)


def strip_font_imports(css: str, log: list) -> str:
    """Remove @import of remote font stylesheets — they cannot be inlined and
    would be a silent network dependency."""
    def repl(m):
        log.append(("dropped-import", m.group(0)[:80]))
        return ""
    return re.sub(r"@import\s+url\([^)]*(fonts\.googleapis|https?:)[^)]*\)\s*;", repl, css)


def inline_html(html: str, base: pathlib.Path, log: list) -> str:
    # <link rel=stylesheet href=local.css>
    def link_repl(m):
        href = m.group(1)
        if href.startswith(("http://", "https://")):
            log.append(("dropped-remote-stylesheet", href))
            return ""
        p = (base / href).resolve()
        if not p.exists():
            log.append(("missing-stylesheet", href))
            return ""
        css = p.read_text(encoding="utf-8")
        css = strip_font_imports(css, log)
        css = inline_css_assets(css, p.parent, log)
        return f"<style>\n{css}\n</style>"
    html = re.sub(r'<link[^>]+rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\'][^>]*>',
                  link_repl, html, flags=re.I)
    html = re.sub(r'<link[^>]+href=["\']([^"\']+)["\'][^>]*rel=["\']stylesheet["\'][^>]*>',
                  link_repl, html, flags=re.I)

    # <link rel=preconnect / dns-prefetch>  — pure network hints, no value here
    html = re.sub(r'<link[^>]+rel=["\'](preconnect|dns-prefetch)["\'][^>]*>', "", html, flags=re.I)

    # <script src=local.js>
    def script_repl(m):
        src = m.group(1)
        if src.startswith(("http://", "https://")):
            log.append(("dropped-remote-script", src))
            return ""
        p = (base / src).resolve()
        if not p.exists():
            log.append(("missing-script", src))
            return ""
        return f"<script>\n{p.read_text(encoding='utf-8')}\n</script>"
    html = re.sub(r'<script[^>]+src=["\']([^"\']+)["\'][^>]*>\s*</script>',
                  script_repl, html, flags=re.I)

    # <img src=local>
    def img_repl(m):
        pre, src, post = m.group(1), m.group(2), m.group(3)
        if src.startswith(("data:", "http://", "https://")):
            if src.startswith(("http://", "https://")):
                log.append(("external-img", src))
            return m.group(0)
        p = (base / src).resolve()
        if not p.exists():
            log.append(("missing-image", src))
            return m.group(0)
        log.append(("inlined", p.name))
        return f"<img{pre}src=\"{data_uri(p)}\"{post}>"
    html = re.sub(r'<img([^>]*?)src=["\']([^"\']+)["\']([^>]*?)>', img_repl, html, flags=re.I)

    return html


def _ledger_version(path):
    try:
        return json.loads(pathlib.Path(path).read_text()).get("ledger_version")
    except Exception:
        return None


def _qa_schema(path):
    try:
        return json.loads(pathlib.Path(path).read_text()).get("schema_version")
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--src", required=True, help="deliverable source dir; must contain index.html")
    ap.add_argument("--out", required=True)
    ap.add_argument("--feature", required=True)
    ap.add_argument("--version", required=True)
    ap.add_argument("--ids", default=None, help="ids.json to embed")
    ap.add_argument("--qa-report", default=None, help="report.json to embed")
    ap.add_argument("--lottie-dir", default=None)
    ap.add_argument("--manifest", default=None, help="write a build manifest here")
    ap.add_argument("--allow-external", action="store_true",
                    help="do not fail when a remote reference survives")
    a = ap.parse_args()

    src = pathlib.Path(a.src)
    entry = src / "index.html"
    if not entry.exists():
        print(f"no index.html in {src}", file=sys.stderr); sys.exit(2)

    log = []
    html = entry.read_text(encoding="utf-8")
    html = inline_html(html, src, log)

    # embed lottie files as inline JSON, addressable by name
    if a.lottie_dir and pathlib.Path(a.lottie_dir).exists():
        lot = {}
        for p in pathlib.Path(a.lottie_dir).glob("*.json"):
            lot[p.stem] = json.loads(p.read_text())
            log.append(("inlined-lottie", p.name))
        if lot:
            html = html.replace("</head>",
                f'<script type="application/json" id="__lottie">{json.dumps(lot)}</script>\n</head>')

    # embed the ledger and the QA report as data, not as rendered prose
    for flag, el_id, label in ((a.ids, "__ids", "ids"),
                               (a.qa_report, "__qa", "qa-report")):
        if flag and pathlib.Path(flag).exists():
            payload = pathlib.Path(flag).read_text(encoding="utf-8")
            html = html.replace("</body>",
                f'<script type="application/json" id="{el_id}">{payload}</script>\n</body>')
            log.append(("embedded", label))

    built = datetime.datetime.now(datetime.timezone.utc).isoformat()
    meta = (f'<meta name="deliverable-feature" content="{a.feature}">\n'
            f'<meta name="deliverable-version" content="{a.version}">\n'
            f'<meta name="deliverable-built" content="{built}">\n'
            f'<meta name="built-by" content="{SKILL_NAME} {SKILL_VERSION}">\n'
            f'<meta name="qa-schema-accepted" content="1">\n')
    html = html.replace("</head>", meta + "</head>", 1)

    # verify nothing remote survived
    remote = re.findall(r'(?:src|href)=["\'](https?://[^"\']+)["\']', html)
    remote = [r for r in remote if not r.startswith("https://www.w3.org")]
    if remote and not a.allow_external:
        print("external references survived — the bundle would need the network:",
              file=sys.stderr)
        for r in sorted(set(remote))[:10]:
            print("  " + r, file=sys.stderr)
        print("fix the source or pass --allow-external if this is deliberate",
              file=sys.stderr)
        sys.exit(3)

    out = pathlib.Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding="utf-8")

    size_mb = out.stat().st_size / 1_048_576
    digest = hashlib.sha256(out.read_bytes()).hexdigest()[:16]

    if a.manifest:
        pathlib.Path(a.manifest).write_text(json.dumps({
            "feature": a.feature, "version": a.version, "built": built,
            "built_by": {"skill": SKILL_NAME, "version": SKILL_VERSION},
            "ledger_version": _ledger_version(a.ids),
            "qa_schema": _qa_schema(a.qa_report),
            "file": str(out), "size_bytes": out.stat().st_size,
            "sha256_16": digest,
            "inlined": sum(1 for k, _ in log if k.startswith("inlined")),
            "warnings": [f"{k}: {v}" for k, v in log if k.startswith(("missing", "dropped", "external"))],
        }, indent=2))

    print(f"wrote {out}  {size_mb:.2f} MB  sha {digest}")
    inlined = sum(1 for k, _ in log if k.startswith("inlined"))
    print(f"inlined {inlined} assets, 0 network requests")

    warns = [(k, v) for k, v in log if k.startswith(("missing", "dropped", "external"))]
    for k, v in warns:
        print(f"  ! {k}: {v}")

    if size_mb > SIZE_HARD_MB:
        print(f"OVER HARD LIMIT ({SIZE_HARD_MB} MB) — split the deliverable or "
              f"compress assets", file=sys.stderr)
        sys.exit(4)
    if size_mb > SIZE_BUDGET_MB:
        print(f"  ! over soft budget ({SIZE_BUDGET_MB} MB) — check font subsetting "
              f"and image compression")


if __name__ == "__main__":
    main()
