#!/usr/bin/env python3
"""
Assemble the deliverable's source: index.html, which scripts/bundle.py then inlines into one
file. Every section comes from a source that already exists; a section with none is marked
not applicable, with the reason, never filled in.

    python3 scripts/assemble.py --feature orders --version 1 --screens screens/ \
        --report qa/report/report.json --fragments fragments/ --out deliverable-src/ \
        [--written sections/] [--context design/context.json] [--ids ids.json] \
        [--prototype prototype.html] [--interaction interaction.json] [--motion motion.json]

Where each section comes from:
  summary, rules, gestures, assets,   --written <dir>/<section id>.html (or .md): written by the
  performance, dotlottie              session from the brief, the intake and the design
  state-screens, edge-cases,          --fragments: consume_report.py's output from design-qa's report
  accessibility, acceptance,
  open-questions
  screens-redlines                    --screens: each screen in its own frame (its CSS cannot reach
                                      the document's), with the redline inspector (assets/
                                      redline-panel.js) and the node ledger inside it; R toggles it
  prototype                           --prototype: a self-contained prototype, in a frame
  button-states                       --interaction: design-interaction's interaction.json
  motion                              --motion: design-motion's motion.json
  tokens                              --context: the tokens the screens use (var(--x)), with the
                                      card's values; never the whole token set
  platform-notes                      --context: its platforms, when there are two or more
"""
import argparse, html, json, pathlib, re, sys, datetime
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _version import skill_version, skill_name
from bundle import inline_html            # a screen's own assets are inlined before it goes into its frame

HERE = pathlib.Path(__file__).resolve().parent
SKILL = HERE.parent
esc = lambda s: html.escape(str(s if s is not None else ""))


def md(text):
    """the Markdown the fragments use: headings, lists, tables, paragraphs, code, bold"""
    out, table, items = [], [], []
    def inline(s):
        s = esc(s)
        s = re.sub(r"`([^`]+)`", r"<code>\1</code>", s)
        s = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", s)
        return re.sub(r"(?<![\w])_([^_]+)_(?![\w])", r"<em>\1</em>", s)
    def flush():
        if table:
            rows = [r for r in table if not re.fullmatch(r"\|?[\s:|-]+\|?", r)]
            cells = [[c.strip() for c in r.strip("|").split("|")] for r in rows]
            if cells:
                out.append("<table><thead><tr>" + "".join(f"<th>{inline(c)}</th>" for c in cells[0]) + "</tr></thead><tbody>"
                           + "".join("<tr>" + "".join(f"<td>{inline(c)}</td>" for c in r) + "</tr>" for r in cells[1:]) + "</tbody></table>")
            table.clear()
        if items:
            out.append("<ul>" + "".join(f"<li>{inline(i)}</li>" for i in items) + "</ul>")
            items.clear()
    for line in text.splitlines():
        if line.startswith("<!--"):
            continue
        if line.startswith("|"):
            table.append(line); continue
        if re.match(r"\s*[-*] ", line):
            items.append(re.sub(r"^\s*[-*] ", "", line)); continue
        flush()
        m = re.match(r"(#{1,4}) (.*)", line)
        if m:
            lvl = min(len(m.group(1)) + 2, 6)
            out.append(f"<h{lvl}>{inline(m.group(2))}</h{lvl}>")
        elif line.strip():
            out.append(f"<p>{inline(line)}</p>")
    flush()
    return "\n".join(out)


def read_written(d, sid):
    if not d:
        return None
    for ext in (".html", ".md"):
        p = pathlib.Path(d) / f"{sid}{ext}"
        if p.exists():
            t = p.read_text(encoding="utf-8")
            return t if ext == ".html" else md(t)
    return None


def frame(doc, title, height=900):
    return f'<iframe class="screen" title="{esc(title)}" style="height:{height}px" srcdoc="{esc(doc)}"></iframe>'


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--feature", required=True)
    ap.add_argument("--version", required=True)
    ap.add_argument("--screens", required=True, help="folder of screen HTML (annotated copies from assign_ids.py --annotate)")
    ap.add_argument("--out", required=True)
    ap.add_argument("--report", required=True, help="design-qa's report.json for the hi-fi: the gate")
    ap.add_argument("--fragments", default=None)
    ap.add_argument("--written", default=None)
    ap.add_argument("--context", default=None)
    ap.add_argument("--ids", default=None)
    ap.add_argument("--prototype", default=None)
    ap.add_argument("--interaction", default=None)
    ap.add_argument("--motion", default=None)
    a = ap.parse_args()

    sections = json.loads((SKILL / "schema" / "sections.json").read_text())["sections"]
    order = sorted(sections, key=lambda k: sections[k].get("order", 999))
    load = lambda p: json.loads(pathlib.Path(p).read_text(encoding="utf-8")) if p and pathlib.Path(p).exists() else None
    report, card, ids = load(a.report), load(a.context) or {}, load(a.ids)
    inter, motion = load(a.interaction), load(a.motion)
    if not report:
        print(f"No QA report at {a.report}: run design-qa on the hi-fi first. Not assembling.", file=sys.stderr)
        sys.exit(3)
    if (report.get("scope") or {}).get("profile") == "wireframe":
        print("The QA report is a wireframe's: a hand-over needs the hi-fi's report. Not assembling.", file=sys.stderr)
        sys.exit(3)
    if report.get("verdict") == "blocked":
        n = sum(1 for f in report.get("findings", []) if f.get("severity") == "blocker" and not f.get("waived"))
        print(f"The QA report is BLOCKED ({n} unwaived blocker(s)): fix them, or waive each one, first. Not assembling.", file=sys.stderr)
        sys.exit(3)
    sp = pathlib.Path(a.screens)
    screens = sorted(sp.glob("*.html")) if sp.is_dir() else [sp]
    redline = (SKILL / "assets" / "redline-panel.js").read_text(encoding="utf-8")
    ledger = json.dumps(ids or {"nodes": {}})

    body, toc, na = [], [], []
    def section(sid, content, reason=None):
        n = len(toc) + 1
        title = sections[sid]["title"]
        if content:
            toc.append(f'<li><a href="#{sid}">{esc(title)}</a></li>')
            body.append(f'<section id="{sid}"><h2>{n}. {esc(title)}</h2>{content}</section>')
        else:
            na.append((title, reason or "no source for it"))

    for sid in order:
        written = read_written(a.written, sid)
        frag = None
        if a.fragments and (pathlib.Path(a.fragments) / f"{sid}.md").exists():
            frag = md((pathlib.Path(a.fragments) / f"{sid}.md").read_text(encoding="utf-8"))
        if sid == "screens-redlines":
            parts, log = [], []
            dock = '<style>#rl-panel{top:auto!important;bottom:0!important;width:100%!important;height:42%!important;border-left:0!important;border-top:1px solid #e0e0e0!important}</style>'
            for s in screens:
                doc = inline_html(s.read_text(encoding="utf-8"), s.parent, log)        # its stylesheets and images, inlined
                inject = f'<script type="application/json" id="__ids">{ledger}</script>{dock}<script>{redline}</script>'
                doc = doc.replace("</body>", inject + "</body>") if "</body>" in doc else doc + inject
                parts.append(f"<h3>{esc(s.stem)}</h3>{frame(doc, s.stem)}")
            remote = [x for x in log if x[0] in ("dropped-remote-stylesheet", "dropped-remote-script", "external-img")]
            for kind, what in remote:
                print(f"  {kind}: {what} (embed it locally: the document makes no network requests)", file=sys.stderr)
            if any(k == "external-img" for k, _ in remote):
                print("A screen loads an image from the network: download it beside the screen first. Not assembling.", file=sys.stderr)
                sys.exit(4)
            section(sid, "<p>Each screen in its own frame. Press R inside a screen for redlines: node ids, boxes and styles.</p>" + "".join(parts) if parts else None, "no screens")
        elif sid == "prototype":
            p = pathlib.Path(a.prototype) if a.prototype else None
            section(sid, frame(p.read_text(encoding="utf-8"), "prototype", 960) if p and p.exists() else written, "no prototype given (--prototype)")
        elif sid == "button-states":
            if inter and inter.get("controls"):
                rows = "".join(f"<tr><td>{esc(c.get('screen'))}</td><td>{esc(c.get('kind'))}: {esc(c.get('action'))}</td><td>{'<br>'.join(esc(k) + ': ' + esc(v) for k, v in (c.get('states') or {}).items())}</td></tr>" for c in inter["controls"])
                section(sid, f"<table><thead><tr><th>screen</th><th>control</th><th>states</th></tr></thead><tbody>{rows}</tbody></table>")
            else:
                section(sid, written, "no interaction spec (design-interaction's interaction.json)")
        elif sid == "motion":
            if motion and motion.get("motions"):
                rows = "".join(f"<tr><td>{esc(m.get('trigger'))}</td><td>{esc(m.get('purpose'))}</td><td>{esc(', '.join(m.get('elements', [])))}</td><td>{esc((m.get('enter') or {}).get('duration'))} {esc((m.get('enter') or {}).get('easing'))}</td><td>{esc(m.get('reduced'))}</td></tr>" for m in motion["motions"])
                section(sid, f"<table><thead><tr><th>trigger</th><th>purpose</th><th>moves</th><th>enter</th><th>reduced motion</th></tr></thead><tbody>{rows}</tbody></table>")
            else:
                section(sid, written, "no motion spec (design-motion's motion.json)")
        elif sid == "tokens":
            texts = {s: s.read_text(encoding="utf-8") for s in screens}
            used = sorted({m for t in texts.values() for m in re.findall(r"var\(\s*(--[\w-]+)", t)})
            key = lambda n: n.lstrip("-").lower()
            flat = {}
            for fam, vals in (card.get("tokens") or {}).items():
                if isinstance(vals, dict):
                    for k, v in vals.items():
                        if isinstance(v, dict) and "value" in v:
                            flat[key(k)] = (fam, str(v["value"]))
            own = {}                                           # a value a screen sets for itself
            for t in texts.values():
                for n, v in re.findall(r"(--[\w-]+)\s*:\s*([^;}{]+)", t):
                    own.setdefault(key(n), v.strip())
            def row(t):
                fam, val = flat.get(key(t), ("", ""))
                mine = own.get(key(t))
                note = "" if not mine or not val or mine.lower() == val.lower() else f" <strong>the screen sets {esc(mine)}</strong>"
                return f"<tr><td><code>{esc(t)}</code></td><td>{esc(fam)}</td><td>{esc(val or mine or 'not in the card')}{note}</td></tr>"
            rows = "".join(row(t) for t in used)
            src = (card.get("tokens") or {}).get("file") or "the design system's token sheet"
            section(sid, f"<p>The tokens these screens use, with their values; the full set lives in {esc(src)}.</p><table><thead><tr><th>token</th><th>family</th><th>value</th></tr></thead><tbody>{rows}</tbody></table>" if used else written, "the screens use no tokens (var(--…)): their values are literal")
        elif sid == "platform-notes":
            plats = card.get("platforms") or []
            if len(plats) > 1:
                rows = "".join(f"<tr><td>{esc(p.get('id'))}</td><td>{esc(p.get('width'))}</td><td>{esc(p.get('min_target'))}</td><td>{esc(p.get('notes'))}</td></tr>" for p in plats)
                section(sid, (written or "") + f"<table><thead><tr><th>platform</th><th>width</th><th>smallest target</th><th>notes</th></tr></thead><tbody>{rows}</tbody></table>")
            else:
                section(sid, written, "one platform")
        else:
            section(sid, frag or written, f"nothing written for it ({a.written or 'no --written folder'}/{sid}.html)" if sid not in ("state-screens", "edge-cases", "accessibility", "acceptance", "open-questions") else "no QA fragments (consume_report.py)")

    verdict = (report or {}).get("verdict", "no QA report")
    coverage = (report or {}).get("render_coverage") or ""
    na_html = "".join(f"<li>{esc(t)}: {esc(r)}</li>" for t, r in na)
    doc = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(a.feature)} — design deliverable v{esc(a.version)}</title>
<style>
:root{{--ink:#1f2328;--muted:#57606a;--line:#d0d7de;--bg:#fff;--soft:#f6f8fa}}
@media (prefers-color-scheme: dark){{:root{{--ink:#e6edf3;--muted:#9198a1;--line:#30363d;--bg:#0d1117;--soft:#161b22}}}}
body{{margin:0;font:15px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg)}}
header,main{{max-width:1180px;margin:0 auto;padding:24px}}header p{{color:var(--muted);margin:4px 0}}
nav ol{{columns:2;padding-left:20px}}section{{border-top:1px solid var(--line);padding:24px 0}}
table{{border-collapse:collapse;width:100%;margin:8px 0}}td,th{{border-bottom:1px solid var(--line);padding:6px 8px;text-align:left;vertical-align:top}}
code{{font-size:13px;background:var(--soft);padding:1px 4px;border-radius:4px}}
iframe.screen{{width:100%;border:1px solid var(--line);border-radius:8px;background:#fff;margin:8px 0}}
</style></head><body>
<header><h1>{esc(a.feature)}</h1>
<p>Design deliverable v{esc(a.version)} · built {datetime.date.today().isoformat()} by {esc(skill_name())} {esc(skill_version())}</p>
<p>Design QA: {esc(verdict.replace('_', ' '))}{' · ' + esc(coverage) if coverage else ''}</p>
<nav><ol>{''.join(toc)}</ol></nav>
{('<details><summary>Not applicable here</summary><ul>' + na_html + '</ul></details>') if na else ''}
</header><main>{''.join(body)}</main></body></html>
"""
    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(doc, encoding="utf-8")
    print(f"assembled {len(toc)} section(s), {len(na)} not applicable → {out / 'index.html'}")
    for t, r in na:
        print(f"  n/a {t}: {r}")


if __name__ == "__main__":
    main()
