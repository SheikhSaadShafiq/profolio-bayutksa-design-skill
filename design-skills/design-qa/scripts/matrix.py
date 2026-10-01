#!/usr/bin/env python3
"""
Build the QA case matrix from registry.json, or, for a product without one, from a
states list the person confirms (--states states.json, the same shape:
{"pages": {"orders": {"states": ["default", "loading", "empty", "error"]}}}).

Classifies rather than enumerates — see references/matrix.md for why.
Prints a summary and writes matrix.json.

    python matrix.py --root DESIGN_SYSTEM_DIR --out qa/report \
        --platforms web,mobile --locales en --breakpoints 480,768,992,1440
"""
import argparse, json, pathlib, itertools

EXCLUSIONS = [
    (("no-permission", "empty"), "list is not visible to this role"),
    (("flag-off", "loading"), "nothing loads when the flag is off"),
    (("flag-off", "empty"), "the surface is absent, not empty"),
    (("loading", "overflow"), "no content rendered yet to overflow"),
]


def excluded(state, other):
    for (a, b), reason in EXCLUSIONS:
        if {state, other} == {a, b}:
            return reason
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True)
    ap.add_argument("--out", default="qa/report")
    ap.add_argument("--registry", default="registry.json")
    ap.add_argument("--platforms", default="web")
    ap.add_argument("--locales", default="en")
    ap.add_argument("--breakpoints", default="1440")
    ap.add_argument("--scope", default=None, help="feature or page to limit to")
    ap.add_argument("--states", default=None, help="a states list, for a product with no registry")
    a = ap.parse_args()

    root = pathlib.Path(a.root)
    src = pathlib.Path(a.states) if a.states else root / a.registry
    if not src.exists():
        print("No registry.json and no --states list. Ask the person which screens and states "
              "the design covers, write them to states.json as "
              '{"pages": {"<screen>": {"states": ["default", "loading", "empty", "error"]}}}, '
              "and run again with --states states.json.")
        raise SystemExit(2)
    registry = json.loads(src.read_text())
    platforms = a.platforms.split(",")
    locales = a.locales.split(",")
    widths = [int(x) for x in a.breakpoints.split(",")]

    pages = registry.get("pages", {})
    if a.scope:
        pages = {k: v for k, v in pages.items() if a.scope in (k, v.get("feature"))}

    cases, excl = [], []
    for page, meta in pages.items():
        states = meta.get("states", []) or ["default"]
        if "empty" not in states:
            states = states + ["empty"]          # required regardless
        roles = meta.get("roles", []) or ["default"]
        flags = meta.get("flags", []) or []
        differs = set(meta.get("role_differs", roles if len(roles) > 1 else []))

        # required: every state x platform, default role, primary locale, widest
        for st, plat in itertools.product(states, platforms):
            cases.append({
                "id": f"{page}/{plat}/{st}/{locales[0]}/default/{widths[-1]}",
                "class": "required", "screen": f"{plat}/{page}", "state": st,
                "role": "default", "flags": {}, "locale": locales[0],
                "width": widths[-1], "promoted_by": None,
            })

        # required-if-differs: roles and flags the registry says change the surface
        for r in sorted(differs):
            for plat in platforms:
                cases.append({
                    "id": f"{page}/{plat}/default/{locales[0]}/{r}/{widths[-1]}",
                    "class": "required_if_differs", "screen": f"{plat}/{page}",
                    "state": "default", "role": r, "flags": {},
                    "locale": locales[0], "width": widths[-1], "promoted_by": "role_differs",
                })
        for fl in flags:
            for plat in platforms:
                cases.append({
                    "id": f"{page}/{plat}/flag-off:{fl}/{locales[0]}/default/{widths[-1]}",
                    "class": "required_if_differs", "screen": f"{plat}/{page}",
                    "state": "flag-off", "role": "default", "flags": {fl: False},
                    "locale": locales[0], "width": widths[-1], "promoted_by": "flag",
                })

        # sampled: remaining locales and widths, deterministic first-of-family
        for loc in locales[1:]:
            cases.append({
                "id": f"{page}/{platforms[0]}/default/{loc}/default/{widths[-1]}",
                "class": "sampled", "screen": f"{platforms[0]}/{page}",
                "state": "default", "role": "default", "flags": {},
                "locale": loc, "width": widths[-1], "promoted_by": None,
            })
        for w in widths[:-1]:
            cases.append({
                "id": f"{page}/{platforms[0]}/default/{locales[0]}/default/{w}",
                "class": "sampled", "screen": f"{platforms[0]}/{page}",
                "state": "default", "role": "default", "flags": {},
                "locale": locales[0], "width": w, "promoted_by": None,
            })

        for st, other in itertools.combinations(states, 2):
            r = excluded(st, other)
            if r:
                excl.append({"pattern": f"{st} x {other}", "screen": page, "reason": r})

    counts = {}
    for c in cases:
        counts[c["class"]] = counts.get(c["class"], 0) + 1
    counts["excluded"] = len(excl)

    out = pathlib.Path(a.out); out.mkdir(parents=True, exist_ok=True)
    matrix = {"scope": {"feature": a.scope, "platforms": platforms,
                        "locales": locales, "breakpoints": widths},
              "counts": counts, "cases": cases, "excluded": excl}
    (out / "matrix.json").write_text(json.dumps(matrix, indent=2))

    print("case matrix")
    for k in ("required", "required_if_differs", "sampled", "excluded"):
        print(f"  {k:22} {counts.get(k,0)}")
    print(f"\nrequired cases ({counts.get('required',0)}):")
    for c in cases:
        if c["class"] == "required":
            print("  " + c["id"])
    print(f"\nwrote {out/'matrix.json'}")


if __name__ == "__main__":
    main()
