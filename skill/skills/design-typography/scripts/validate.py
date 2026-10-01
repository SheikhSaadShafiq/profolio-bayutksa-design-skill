#!/usr/bin/env python3
"""
Check a skill's JSON output against its schema, with no packages to install.

    python3 scripts/validate.py schema/<name>.schema.json <output>.json

It implements the parts of JSON Schema these skills use: type, const, enum, required,
properties, additionalProperties, items, minItems, maxItems, pattern, oneOf, anyOf, not,
and $ref to #/$defs/... Exit 0 when the output is valid, 1 with one line per problem.
"""
import json, re, sys

TYPES = {"object": dict, "array": list, "string": str, "boolean": bool, "null": type(None)}


def is_type(v, t):
    if t == "integer":
        return isinstance(v, int) and not isinstance(v, bool)
    if t == "number":
        return isinstance(v, (int, float)) and not isinstance(v, bool)
    return isinstance(v, TYPES[t])


def check(v, s, root, at, out):
    if "$ref" in s:
        ref = s["$ref"]
        if not ref.startswith("#/"):
            return
        node = root
        for part in ref[2:].split("/"):
            node = node[part]
        return check(v, node, root, at, out)
    if "const" in s and v != s["const"]:
        out.append(f"{at}: must be {s['const']!r}, is {v!r}")
    if "enum" in s and v not in s["enum"]:
        out.append(f"{at}: {v!r} is not one of {s['enum']}")
    if "type" in s:
        ts = s["type"] if isinstance(s["type"], list) else [s["type"]]
        if not any(is_type(v, t) for t in ts):
            out.append(f"{at}: should be {' or '.join(ts)}, is {type(v).__name__}")
            return
    if "not" in s:
        errs = []
        check(v, s["not"], root, at, errs)
        if not errs:
            out.append(f"{at}: {v!r} is not allowed here")
    for key in ("oneOf", "anyOf"):
        if key in s:
            fits = 0
            for sub in s[key]:
                errs = []
                check(v, sub, root, at, errs)
                fits += not errs
            if (key == "oneOf" and fits != 1) or (key == "anyOf" and not fits):
                out.append(f"{at}: matches {fits} of the {key} alternatives")
    if isinstance(v, dict):
        for r in s.get("required", []):
            if r not in v:
                out.append(f"{at}: missing required '{r}'")
        props = s.get("properties", {})
        for k, sub in props.items():
            if k in v:
                check(v[k], sub, root, f"{at}.{k}", out)
        extra = s.get("additionalProperties")
        if isinstance(extra, dict):
            for k, val in v.items():
                if k not in props:
                    check(val, extra, root, f"{at}.{k}", out)
        elif extra is False:
            for k in v:
                if k not in props:
                    out.append(f"{at}: unexpected '{k}'")
    if isinstance(v, list):
        if "minItems" in s and len(v) < s["minItems"]:
            out.append(f"{at}: needs at least {s['minItems']} items")
        if "maxItems" in s and len(v) > s["maxItems"]:
            out.append(f"{at}: takes at most {s['maxItems']} items")
        if isinstance(s.get("items"), dict):
            for i, item in enumerate(v):
                check(item, s["items"], root, f"{at}[{i}]", out)
    if isinstance(v, str) and "pattern" in s and not re.search(s["pattern"], v):
        out.append(f"{at}: {v!r} does not match {s['pattern']}")


def main(argv):
    if len(argv) != 2:
        print(__doc__.strip().split("\n\n")[1])
        return 2
    schema = json.load(open(argv[0], encoding="utf-8"))
    data = json.load(open(argv[1], encoding="utf-8"))
    out = []
    check(data, schema, schema, "$", out)
    for line in out[:50]:
        print("  " + line)
    print(f"{'valid' if not out else str(len(out)) + ' problem(s)'}: {argv[1]} against {schema.get('$id', argv[0])}")
    return 0 if not out else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
