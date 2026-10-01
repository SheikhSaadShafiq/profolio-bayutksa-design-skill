#!/usr/bin/env python3
"""
Turn a QA report.json into deliverable section fragments.

Five sections are generated rather than authored: state-screens, edge-cases,
accessibility, acceptance, open-questions. This is the practical argument for
gating on QA first.

    python consume_report.py --report qa/report/report.json --out deliverable-src/sections
"""
import argparse, json, pathlib, sys, collections
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _version import skill_version, skill_name

SKILL_VERSION = skill_version()
ACCEPTED_SCHEMA = {1}          # report schemas this skill can read

HINT_TO_SECTION = {
    "state-screens": "state-screens",
    "edge-cases": "edge-cases",
    "accessibility": "accessibility",
    "acceptance": "acceptance",
    "open-questions": "open-questions",
}


def md_table(rows, headers):
    out = ["| " + " | ".join(headers) + " |",
           "|" + "|".join("---" for _ in headers) + "|"]
    for r in rows:
        out.append("| " + " | ".join(str(c).replace("|", "\\|") for c in r) + " |")
    return "\n".join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", required=True)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    rep = json.loads(pathlib.Path(a.report).read_text())
    sv = rep.get("schema_version")
    if sv not in ACCEPTED_SCHEMA:
        print(f"report schema_version {sv} is not accepted by this skill "
              f"(accepts {sorted(ACCEPTED_SCHEMA)}). Stopping rather than guessing "
              f"at the shape.", file=sys.stderr)
        sys.exit(2)

    if (rep.get("scope") or {}).get("profile") == "wireframe":
        print("This is a wireframe's QA report. A hand-over is built on the hi-fi's: run design-qa on the hi-fi.",
              file=sys.stderr)
        sys.exit(3)
    if rep["verdict"] == "blocked":
        blockers = [f for f in rep["findings"]
                    if f["severity"] == "blocker" and not f.get("waived")]
        print(f"BLOCKED — {len(blockers)} unwaived blockers. Not building.",
              file=sys.stderr)
        for f in blockers[:15]:
            print(f"  {f['check']:24} {f['screen']:22} {f['message'][:70]}",
                  file=sys.stderr)
        sys.exit(3)

    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    buckets = collections.defaultdict(list)
    for f in rep["findings"]:
        buckets[HINT_TO_SECTION.get(f.get("section_hint"), "open-questions")].append(f)

    # ── edge cases + accessibility: findings as a table ────────────────────
    for sec in ("edge-cases", "accessibility", "state-screens"):
        rows = [(f["check"], f["screen"], f.get("node") or f.get("css_path") or "—",
                 f["severity"], f["message"][:110])
                for f in buckets.get(sec, [])]
        body = (md_table(rows, ["check", "screen", "node", "severity", "finding"])
                if rows else "_No findings in this category._")
        (out / f"{sec}.md").write_text(f"<!-- generated from QA report -->\n\n{body}\n")

    # ── acceptance: every check that PASSED becomes a criterion ────────────
    passed = [c for c in rep.get("checks_run", []) if c["status"] == "pass"]
    rows = [(c["check"], c.get("cases", 0), "verified") for c in passed]
    skipped = [c for c in rep.get("checks_run", []) if c["status"] == "skipped"]
    acc = ["<!-- generated from QA report -->", "",
           "These are verified by the design QA run that gated this deliverable. "
           "Each is objectively checkable; re-running QA re-verifies them.", "",
           md_table(rows, ["criterion", "cases", "status"]) if rows
           else "_No checks passed — this deliverable should not have been built._"]
    if skipped:
        acc += ["", "### Not verified", "",
                "These checks did not run. Nothing here is claimed either way.", "",
                md_table([(c["check"], c.get("skipped_reason") or "—") for c in skipped],
                         ["check", "why it did not run"])]
    (out / "acceptance.md").write_text("\n".join(acc) + "\n")

    # ── open questions: warnings, waived blockers, everything unrouted ─────
    oq = []
    for f in rep["findings"]:
        if f.get("waived"):
            w = f.get("waiver") or {}
            oq.append((f["check"], f["screen"], "waived blocker",
                       f"{w.get('reason','no reason recorded')} "
                       f"(granted by {w.get('granted_by','?')}, expires {w.get('expires_on','?')})"))
        elif f["severity"] == "warning":
            oq.append((f["check"], f["screen"], "warning", f["message"][:100]))
    body = (md_table(oq, ["source", "screen", "kind", "question / note"])
            if oq else "_None._")
    (out / "open-questions.md").write_text(
        "<!-- generated from QA report; add authored questions below the table -->\n\n"
        + body + "\n\n### Authored questions\n\n_Add here._\n")

    print(f"{skill_name()} {SKILL_VERSION}  |  report schema v{sv} "
          f"from {rep.get('qa_skill_name','?')} {rep.get('qa_skill_version','?')}")
    print(f"verdict {rep['verdict']}  —  wrote 5 section fragments to {out}")
    for sec in ("state-screens", "edge-cases", "accessibility", "acceptance", "open-questions"):
        n = len(buckets.get(sec, [])) if sec != "acceptance" else len(passed)
        print(f"  {sec:18} {n} entries")


if __name__ == "__main__":
    main()
