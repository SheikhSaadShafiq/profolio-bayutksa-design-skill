#!/usr/bin/env python3
"""
Build a draft context card from a project's code.

It reads the values the code names (CSS custom properties, design-token JSON,
a Tailwind theme, iOS colour sets, Android resources) and the values the code
uses most (font sizes, spacing, radii, durations, breakpoints), and writes
design/context.json (schema v1, schema/context.schema.json).

  python3 scripts/scan.py <path> [<path> ...] [--name "Product"]
                          [--out design/context.json] [--merge] [--html]

It reads code: stylesheets, theme and token files, and the styles of .vue and
.svelte components. HTML files are screens, not code, and are read only with
--html (for a product whose styles live in its pages): a design under review
must never become the product's standard.

A named value is `measured`. A value inferred from how often a literal is used
is `derived`. Nothing is `assumed` here: a family the code does not show goes
under `gaps`, so the gap is visible instead of being filled with a default.

--merge keeps every value an existing card already has and only fills what it
lacks, so a card built from a render or a design-system skill is never
overwritten by a weaker reading of the code.
"""
import argparse, collections, datetime, hashlib, json, os, pathlib, re, sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
try:
    from _version import skill_name, skill_version
except Exception:  # run from the source folder, before the build adds _version.py
    skill_name = lambda default="design-context": default
    skill_version = lambda default="0.0.0": default

SKIP_DIRS = {"node_modules", ".git", "dist", "build", ".next", "coverage", "vendor", "Pods",
             "__pycache__", ".venv", "venv", ".cache", "out", "DerivedData"}
STYLE_EXT = {".css", ".scss", ".sass", ".less"}
MARKUP_EXT = {".html", ".htm", ".vue", ".svelte"}
MAX_FILES, MAX_BYTES, MAX_MARKUP = 4000, 3_000_000, 200

COLOUR = re.compile(r"#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|(?:rgba?|hsla?)\([^)]*\)")
CUSTOM = re.compile(r"(--[A-Za-z0-9_-]+)\s*:\s*([^;{}]+)")
DECL = re.compile(r"([a-z-]+)\s*:\s*([^;{}]+)")
LEN = re.compile(r"(-?\d*\.?\d+)(px|rem|em)\b")
TIME = re.compile(r"(\d*\.?\d+)(ms|s)\b")
MEDIA = re.compile(r"@media[^{]*?\((?:min|max)-width\s*:\s*(\d+)px")
STYLE_BLOCK = re.compile(r"<style\b[^>]*>(.*?)</style>", re.S | re.I)
RTL = re.compile(r"dir\s*=\s*[\"']rtl|\[dir=\"?rtl|:lang\(ar\)|direction\s*:\s*rtl", re.I)


def sha1(p):
    h = hashlib.sha1()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 16), b""):
            h.update(chunk)
    return h.hexdigest()[:12]


def files_under(paths, html=False):
    out, markup = [], 0
    for root in paths:
        root = pathlib.Path(root)
        if root.is_file():
            out.append(root)
            continue
        for dirpath, dirnames, filenames in os.walk(root):
            dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS and not d.startswith("."))
            for n in sorted(filenames):
                p = pathlib.Path(dirpath) / n
                ext = p.suffix.lower()
                interesting = (ext in STYLE_EXT or ext in MARKUP_EXT or n.startswith("tailwind.config")
                               or (ext == ".json" and ("token" in n.lower() or p.parent.suffix == ".colorset"))
                               or (ext == ".xml" and n in ("colors.xml", "dimens.xml"))
                               or ext in (".woff2", ".woff", ".ttf", ".otf"))
                if not interesting:
                    continue
                if ext in (".html", ".htm") and not html:
                    continue
                if ext in MARKUP_EXT:
                    markup += 1
                    if markup > MAX_MARKUP:
                        continue
                out.append(p)
                if len(out) >= MAX_FILES:
                    return out
    return out


def px(value):
    """a length in px, or None (rem and em at 16px, as browsers default)"""
    m = LEN.search(value)
    if not m:
        return None
    n = float(m.group(1))
    return round(n * 16, 2) if m.group(2) in ("rem", "em") else n


def ms(value):
    m = TIME.search(value)
    if not m:
        return None
    n = float(m.group(1))
    return n if m.group(2) == "ms" else n * 1000


def kind_of(name, value):
    """what a named value is, from its name first and its shape second"""
    n, v = name.lower(), value.strip().lower()
    if "shadow" in n:
        return "shadow"
    if "radius" in n or "rounded" in n:
        return "radius"
    if "ease" in n or "easing" in n or v.startswith("cubic-bezier"):
        return "easing"
    if "duration" in n or ("motion" in n and TIME.fullmatch(v or "x")):
        return "duration"
    if "font-family" in n or "family" in n or re.search(r"(sans-serif|serif|monospace|system-ui)\s*$", v):
        return "family"
    if "line-height" in n or "leading" in n:
        return "line"
    if "font-weight" in n or "weight" in n:
        return "weight"
    if ("font-size" in n or "text-size" in n or re.search(r"font-?size|fontsize|heading|text-(xs|sm|base|lg|xl)", n)) and px(v) is not None:
        return "size"
    if "breakpoint" in n or "screen" in n or re.search(r"\bbp-", n):
        return "breakpoint"
    if COLOUR.fullmatch(v) or (COLOUR.match(v) and len(v) < 40):
        return "color"
    if re.search(r"space|spacing|gap|padding|margin|inset|gutter", n) and px(v) is not None:
        return "space"
    if TIME.fullmatch(v):
        return "duration"
    return None


class Scan:
    def __init__(self):
        self.named = collections.OrderedDict()     # --name -> (value, file)
        self.tokens_json = {}                      # token.path -> (value, file, type)
        self.native = {}                           # name -> (value, file, kind)
        self.tailwind = {}                         # name -> (value, file, kind)
        self.use = {k: collections.Counter() for k in ("size", "line", "weight", "radius", "space", "duration", "easing", "breakpoint", "family", "color")}
        self.fonts, self.sources, self.rtl, self.platforms = set(), {}, False, set()
        self.conflicts = []                        # (name, value, file, other value, other file)

    def source(self, p, root):
        try:
            rel = os.path.relpath(p, os.getcwd())          # from where the card is used: the project
        except ValueError:
            rel = str(p)
        if rel not in self.sources:
            self.sources[rel] = sha1(p)

    def css(self, text, p, root):
        hit = False
        for m in CUSTOM.finditer(text):
            name, value = m.group(1), m.group(2).strip()
            # first definition wins, except that a token sheet's definition beats a compiled one's
            if name in self.named and self.named[name][1] != p and self.named[name][0].strip() != value.strip():
                self.conflicts.append((name, self.named[name][0].strip(), self.named[name][1], value.strip(), p))
            if name not in self.named or ("token" in p.name.lower() and "token" not in self.named[name][1].name.lower()):
                self.named[name] = (value, p)
                hit = True
        for m in DECL.finditer(text):
            prop, value = m.group(1), m.group(2).strip()
            if prop == "font-size" and px(value) is not None:
                self.use["size"][px(value)] += 1
            elif prop == "line-height":
                self.use["line"][value] += 1
            elif prop == "font-weight" and value.isdigit():
                self.use["weight"][int(value)] += 1
            elif prop == "border-radius" and px(value) is not None:
                self.use["radius"][px(value)] += 1
            elif prop in ("padding", "margin", "gap", "row-gap", "column-gap") or prop.startswith(("padding-", "margin-")):
                for part in value.split():
                    v = px(part)
                    if v is not None and 0 < v <= 128:
                        self.use["space"][v] += 1
            elif prop in ("transition", "transition-duration", "animation", "animation-duration"):
                for t in TIME.finditer(value):
                    self.use["duration"][ms(t.group(0))] += 1
                for e in re.findall(r"cubic-bezier\([^)]*\)|ease-in-out|ease-out|ease-in|\bease\b|\blinear\b", value):
                    self.use["easing"][e] += 1
            elif prop == "font-family":
                self.use["family"][value.split(",")[0].strip().strip("'\"")] += 1
            elif prop == "font":                             # [style] [weight] size[/line] family, …
                m = re.search(r"(\d*\.?\d+(?:px|rem|em))(?:\s*/\s*([\d.]+(?:px|rem|em)?))?\s+(.+)$", value)
                if m:
                    if px(m.group(1)) is not None:
                        self.use["size"][px(m.group(1))] += 1
                    if m.group(2):
                        self.use["line"][m.group(2)] += 1
                    self.use["family"][m.group(3).split(",")[0].strip().strip("'\"")] += 1
            if prop in ("color", "background", "background-color", "border-color", "fill", "stroke"):
                for c in COLOUR.findall(value):
                    self.use["color"][c.lower()] += 1
            hit = True
        for b in MEDIA.findall(text):
            self.use["breakpoint"][int(b)] += 1
        if RTL.search(text):
            self.rtl = True
        if hit:
            self.source(p, root)
            self.platforms.add("web")

    def token_json(self, data, p, root, path=()):
        if isinstance(data, dict):
            if "$value" in data or ("value" in data and not isinstance(data.get("value"), dict)):
                v = data.get("$value", data.get("value"))
                self.tokens_json[".".join(path)] = (str(v), p, str(data.get("$type", data.get("type", ""))))
                self.source(p, root)
                return
            for k, v in data.items():
                if not k.startswith("$"):
                    self.token_json(v, p, root, path + (k,))

    def colorset(self, data, p, root):
        for c in data.get("colors", [])[:1]:
            comp = (c.get("color") or {}).get("components") or {}
            try:
                ch = [comp[k] for k in ("red", "green", "blue")]
                ch = [int(x, 16) if str(x).startswith("0x") else (round(float(x) * 255) if float(x) <= 1 else int(float(x))) for x in ch]
                self.native[p.parent.stem] = ("#%02x%02x%02x" % tuple(ch), p, "color")
                self.source(p, root)
                self.platforms.add("ios")
            except Exception:
                pass

    def android(self, text, p, root):
        for tag, name, value in re.findall(r"<(color|dimen)\s+name=\"([^\"]+)\"\s*>([^<]+)<", text):
            k = "color" if tag == "color" else (kind_of(name, value.replace("dp", "px").replace("sp", "px")) or "space")
            self.native[name] = (value.strip(), p, k)
        self.source(p, root)
        self.platforms.add("android")

    def tailwind_config(self, text, p, root):
        for name, value in re.findall(r"['\"]?([A-Za-z0-9_-]+)['\"]?\s*:\s*['\"](#[0-9a-fA-F]{3,8})['\"]", text):
            self.tailwind[name] = (value, p, "color")
        for name, fam in re.findall(r"['\"]?([A-Za-z0-9_-]+)['\"]?\s*:\s*\[\s*['\"]([^'\"]+)['\"]", text):
            if "font" in text[max(0, text.find(name) - 200):text.find(name)].lower():
                self.tailwind[name] = (fam, p, "family")
        if self.tailwind:
            self.source(p, root)
            self.platforms.add("web")


def run(paths, root, html=False):
    s = Scan()
    for p in files_under(paths, html):
        ext, n = p.suffix.lower(), p.name
        try:
            if ext in (".woff2", ".woff", ".ttf", ".otf"):
                s.fonts.add(re.sub(r"[-_ ]?(regular|bold|medium|light|semibold|italic|\d{3})$", "", p.stem, flags=re.I))
                continue
            if p.stat().st_size > MAX_BYTES:
                continue
            text = p.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        if ext in STYLE_EXT:
            s.css(text, p, root)
        elif ext in MARKUP_EXT:
            s.css("\n".join(STYLE_BLOCK.findall(text)), p, root)
            inline = re.findall(r'\sstyle="([^"]*)"', text)            # what the page draws inline counts too
            if inline:
                s.css("\n".join("x{%s}" % d.replace("&quot;", '"') for d in inline[:4000]), p, root)
            if RTL.search(text[:20000]):
                s.rtl = True
        elif n.startswith("tailwind.config"):
            s.tailwind_config(text, p, root)
        elif ext == ".json":
            try:
                data = json.loads(text)
            except ValueError:
                continue
            (s.colorset if p.parent.suffix == ".colorset" else s.token_json)(data, p, root)
        elif ext == ".xml":
            s.android(text, p, root)
    return s


def resolve(value, named, depth=0):
    m = re.fullmatch(r"\s*var\(\s*(--[A-Za-z0-9_-]+)\s*(?:,\s*([^)]*))?\)\s*", value)
    if not m or depth > 4:
        return value
    hit = named.get(m.group(1))
    return resolve(hit[0], named, depth + 1) if hit else (m.group(2) or value)


def card(s, name, root):
    rel = lambda p: os.path.relpath(p, os.getcwd()) if p else ""
    t = {"color": {}, "type": {"families": {}, "scale": []}, "space": {}, "radius": {}, "shadow": {},
         "motion": {"durations": {}, "easings": {}}, "breakpoints": {}}
    sizes, lines, weights = {}, {}, {}

    def put(kind, key, value, p, prov):
        entry = {"value": value, "provenance": prov, "source": rel(p)}
        if kind == "color":
            t["color"].setdefault(key, entry)
        elif kind == "family":
            t["type"]["families"].setdefault(key, entry)
        elif kind in ("space", "radius", "shadow"):
            t[kind].setdefault(key, entry)
        elif kind == "duration":
            t["motion"]["durations"].setdefault(key, entry)
        elif kind == "easing":
            t["motion"]["easings"].setdefault(key, entry)
        elif kind == "breakpoint":
            t["breakpoints"].setdefault(key, entry)
        elif kind == "size":
            sizes.setdefault(key, (px(value), p))
        elif kind == "line":
            lines[key] = value
        elif kind == "weight":
            weights[key] = value

    # a token sheet names the product's values on purpose; a compiled stylesheet also names
    # every component's internals (hundreds of them). Where a token sheet exists, a family
    # is read from it, and from the other files only if the sheet has none of that family.
    sheet = lambda p: "token" in pathlib.Path(p).name.lower()
    picked = {}
    for nm, (value, p) in s.named.items():
        v = resolve(value, s.named)
        k = kind_of(nm, v)
        if k:
            picked.setdefault(k, []).append((nm, v, p))
    for k, rows in picked.items():
        own = [r for r in rows if sheet(r[2])]
        for nm, v, p in (own or rows):
            put(k, nm, v, p, "measured")
    for nm, (value, p, typ) in s.tokens_json.items():
        k = {"color": "color", "fontFamily": "family", "dimension": None, "duration": "duration", "cubicBezier": "easing", "shadow": "shadow"}.get(typ) or kind_of(nm, value)
        if k:
            put(k, nm, value, p, "measured")
    for nm, (value, p, k) in list(s.native.items()) + list(s.tailwind.items()):
        put(k, nm, value, p, "measured" if nm in s.native else "derived")

    if lines:
        t["type"]["line_heights"] = {k: {"value": v, "provenance": "measured"} for k, v in lines.items()}
    elif s.use["line"]:
        t["type"]["line_heights"] = {v: {"value": v, "provenance": "derived", "use": "used %d times" % n} for v, n in s.use["line"].most_common(6)}
    if not t["space"] and s.use["space"]:
        for v, n in sorted(s.use["space"].most_common(8)):
            t["space"]["%gpx" % v] = {"value": "%gpx" % v, "provenance": "derived", "use": "used %d times" % n}
    for key, (size, p) in sorted(sizes.items(), key=lambda kv: kv[1][0] or 0):
        if size:
            t["type"]["scale"].append({"name": key, "size": size, "provenance": "measured", "use": "named size"})
    if not t["type"]["scale"] and s.use["size"]:
        for size, n in sorted(s.use["size"].most_common(8)):
            t["type"]["scale"].append({"name": "%gpx" % size, "size": size, "provenance": "derived", "use": "used %d times" % n})
    if not t["type"]["families"] and s.use["family"]:
        for fam, n in s.use["family"].most_common(3):
            t["type"]["families"][fam] = {"value": fam, "provenance": "derived", "use": "used %d times" % n}
    if not t["radius"] and s.use["radius"]:
        for r, n in s.use["radius"].most_common(4):
            t["radius"]["%gpx" % r] = {"value": "%gpx" % r, "provenance": "derived", "use": "used %d times" % n}
    if not t["motion"]["durations"] and s.use["duration"]:
        for d, n in s.use["duration"].most_common(4):
            t["motion"]["durations"]["%gms" % d] = {"value": "%gms" % d, "provenance": "derived", "use": "used %d times" % n}
    if not t["motion"]["easings"] and s.use["easing"]:
        for e, n in s.use["easing"].most_common(3):
            t["motion"]["easings"][e] = {"value": e, "provenance": "derived", "use": "used %d times" % n}
    if not t["breakpoints"] and s.use["breakpoint"]:
        for b, n in s.use["breakpoint"].most_common(5):
            t["breakpoints"]["%dpx" % b] = {"value": "%dpx" % b, "provenance": "derived", "use": "used %d times" % n}
    if not t["color"] and s.use["color"]:
        for c, n in s.use["color"].most_common(12):
            t["color"][c] = {"value": c, "provenance": "derived", "use": "used %d times" % n}

    grid = {}
    space = [v for v, n in s.use["space"].items() for _ in range(n)]
    if space:
        for base in (8, 4):
            if sum(1 for v in space if v % base == 0) >= 0.8 * len(space):
                grid["web" if "web" in s.platforms else (sorted(s.platforms) or ["web"])[0]] = {"base": base, "provenance": "derived"}
                break

    gaps = []
    seen_v = {}
    for nm, (value, p) in s.named.items():
        seen_v.setdefault(nm.lstrip("-").lower(), []).append((resolve(value, s.named).strip().lower(), rel(p)))
    for nm, (value, p, k) in list(s.tailwind.items()) + list(s.native.items()):
        seen_v.setdefault(nm.lower(), []).append((str(value).strip().lower(), rel(p)))
    for nm, v1, f1, v2, f2 in s.conflicts:
        gaps.append("two values for '%s': %s in %s, %s in %s; ask which is current" % (nm, v1, rel(f1), v2, rel(f2)))
    for nm, vals in seen_v.items():
        distinct = sorted({v for v, _ in vals})
        if len(distinct) > 1 and len({f for _, f in vals}) > 1:
            gaps.append("two values for '%s': %s; ask which is current" % (nm, ", ".join("%s in %s" % (v, f) for v, f in vals)))
    if not t["color"]:
        gaps.append("no colours found in code")
    if not t["type"]["families"]:
        gaps.append("no font family found in code")
    if not t["type"]["scale"]:
        gaps.append("no type scale found in code")
    if not t["space"] and not grid:
        gaps.append("no spacing scale found in code")
    if not t["motion"]["durations"]:
        gaps.append("no motion durations found in code: the product may not animate, or animates from script")
    if not t["breakpoints"]:
        gaps.append("no breakpoints found in code")
    gaps.append("platform sizes, grid columns, components, voice and assets are not read from code by this script")

    return {
        "schema_version": 1,
        "context_skill_name": skill_name("design-context"),
        "context_skill_version": skill_version("0.0.0"),
        "built": datetime.date.today().isoformat(),
        "product": {"name": name},
        "sources": [{"kind": "code", "ref": r, "hash": h} for r, h in list(s.sources.items())[:60]],
        "platforms": [{"id": pl, "provenance": "derived"} for pl in sorted(s.platforms)],
        "locales": [{"id": "en", "dir": "ltr"}] + ([{"id": "ar", "dir": "rtl"}] if s.rtl else []),
        "tokens": t,
        "grid": grid,
        "assets": {"fonts": sorted(s.fonts)} if s.fonts else {},
        "rules": [],
        "gaps": gaps,
        # the literals the code uses most, beside the names it gives: what is drawn, counted
        "usage": {
            "font_sizes": [[v, n] for v, n in s.use["size"].most_common(12)],
            "colours": [[v, n] for v, n in s.use["color"].most_common(16)],
            "radii": [[v, n] for v, n in s.use["radius"].most_common(6)],
            "spacing": [[v, n] for v, n in s.use["space"].most_common(10)],
            "provenance": "derived",
        },
    } | ({"tokens": dict(t, file=sheet_file)} if (sheet_file := token_sheet(s)) else {})


def token_sheet(s):
    """the file that names the product's values: a token sheet if there is one, else the
    stylesheet that names the most custom properties"""
    counts = collections.Counter(os.path.relpath(p, os.getcwd()) for _, p in s.named.values())
    if not counts:
        return None
    sheets = [f for f in counts if "token" in os.path.basename(f).lower()]
    return max(sheets, key=lambda f: counts[f]) if sheets else None      # a plain stylesheet is not a token sheet


def merge(old, new):
    """Keep what the existing card has and take only what it lacks, except where a source
    changed: a value read from a file whose hash moved (or that is gone) is replaced by
    the fresh reading, so a stale value never survives a re-scan. Sources are the union."""
    fresh = {s["ref"]: s.get("hash") for s in new.get("sources", [])}
    stale = {s["ref"] for s in old.get("sources", []) if s.get("kind") == "code" and s["ref"] in fresh and fresh[s["ref"]] != s.get("hash")}

    def kept(v):
        """a value no code file gave: stated, assumed, or read from a render or a design-system skill"""
        return isinstance(v, dict) and (v.get("provenance") in ("stated", "assumed") or (v.get("source") and v.get("source") not in fresh))

    def walk(o, n):
        if isinstance(o, list) and isinstance(n, list) and stale:
            return n + [v for v in o if kept(v) and v not in n]       # a derived list is re-read whole
        if isinstance(o, dict) and isinstance(n, dict):
            out = {}
            for k, v in o.items():
                if stale and isinstance(v, dict) and v.get("provenance") == "derived" and not v.get("source"):
                    if k in n:
                        out[k] = n[k]              # counted across files: re-counted
                    continue
                if isinstance(v, dict) and v.get("source") in stale:
                    if k in n:
                        out[k] = n[k]              # re-read from the changed file
                    continue                       # gone from the changed file: dropped
                out[k] = walk(v, n[k]) if k in n else v
            for k, v in n.items():
                if k not in out and not (isinstance(v, dict) and k in o and isinstance(o[k], dict) and o[k].get("source") in stale and k not in n):
                    out.setdefault(k, v)
            return out
        if isinstance(o, list) and isinstance(n, list):
            return o if o else n
        return o

    out = walk(old, new)
    if stale and "usage" in new:
        out["usage"] = new["usage"]
    srcs = {s["ref"]: s for s in old.get("sources", [])}
    for s in new.get("sources", []):
        srcs[s["ref"]] = s                         # the new hash for a changed file; new files added
    out["sources"] = list(srcs.values())
    out["gaps"] = new.get("gaps", out.get("gaps", []))
    return out


def main(argv):
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("paths", nargs="+")
    ap.add_argument("--name", default=None)
    ap.add_argument("--out", default="design/context.json")
    ap.add_argument("--merge", action="store_true")
    ap.add_argument("--html", action="store_true", help="also read <style> in .html files (screens): only for a product whose styles live there")
    a = ap.parse_args(argv)
    root = os.path.commonpath([os.path.abspath(p) for p in a.paths])
    root = root if os.path.isdir(root) else os.path.dirname(root)
    s = run(a.paths, root, a.html)
    c = card(s, a.name or pathlib.Path(root).name, root)
    out = pathlib.Path(a.out)
    if a.merge and out.exists():
        c = merge(json.loads(out.read_text(encoding="utf-8")), c)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(c, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    t = c["tokens"]
    count = lambda m: len(m or {})
    print("context: %s · %d colours · %d type sizes · %d families · %d spacing · %d radii · %d durations · %d breakpoints · %d source files"
          % (c["product"]["name"], count(t.get("color")), len(t.get("type", {}).get("scale", [])), count(t.get("type", {}).get("families")),
             count(t.get("space")), count(t.get("radius")), count(t.get("motion", {}).get("durations")), count(t.get("breakpoints")), len(c["sources"])))
    for g in c["gaps"]:
        print("  gap: " + g)
    print("  wrote " + str(out))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
