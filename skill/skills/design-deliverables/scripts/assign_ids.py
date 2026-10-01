#!/usr/bin/env python3
"""
Assign stable numeric node ids to a screen, Figma-style: {screen}:{node}.

Ids are assigned ONCE and stored in ids.json. On regeneration, nodes are
matched to existing ids by role + path + fingerprint, so inserting a row does
not renumber everything below it. See references/ids.md for why that matters.

    python assign_ids.py --screen screens/web/my-listings.html \
        --name my-listings-web --ledger ids.json [--write] [--pair-with my-listings-mobile]

Without --write it reports what it would do and changes nothing.
"""
import argparse, json, pathlib, re, sys, datetime
from html.parser import HTMLParser
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from _version import skill_version, skill_name

LEDGER_VERSION = 1
SKILL_VERSION = skill_version()

# elements that get an id, and elements that never do
INTERACTIVE = {"button", "a", "input", "select", "textarea", "label", "summary"}
NEVER = {"html", "head", "body", "script", "style", "meta", "link", "title",
         "defs", "symbol", "template"}
DECORATIVE_HINT = re.compile(r"\b(spacer|wrapper|container|inner|row|col|grid|stack|flex)\b")


VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta",
        "source", "track", "wbr"}
ROWLIKE = re.compile(r"\b(row|item|card|entry|record)\b")


class NodeWalker(HTMLParser):
    """Collect candidate nodes with a structural path, their own text, the row they sit in,
    and where their start tag is in the source (so --annotate marks exactly them)."""

    def __init__(self, source):
        super().__init__(convert_charrefs=True)
        self.stack = []          # path segments of the open elements
        self.open = []           # per open element: [tag, node index or None, first text, rowlike]
        self.nodes = []
        self.counter = {}
        self.line_starts = [0]
        for m in re.finditer(r"\n", source):
            self.line_starts.append(m.end())

    def _path(self):
        return " > ".join(self.stack)

    def _offset(self):
        line, col = self.getpos()
        return self.line_starts[line - 1] + col

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = a.get("class", "") or ""
        role = (a.get("data-role") or a.get("data-component")
                or self._role_from_class(cls) or tag)
        key = f"{self._path()}|{role}"
        self.counter[key] = self.counter.get(key, 0) + 1
        idx = self.counter[key]
        seg = f"{role}[{idx}]" if idx > 1 else role
        node = None
        if self._include(tag, cls, a):
            # the row it sits in: the first text of the nearest open row-like ancestor,
            # so ten identical "View" buttons in ten rows are ten different nodes
            row = next((o for o in reversed(self.open) if o[3]), None)
            node = len(self.nodes)
            self.nodes.append({
                "kind": self._kind(tag, a), "role": role,
                "path": (self._path() + " > " + seg) if self.stack else seg,
                "tag": tag, "classes": cls, "_row": row, "context": "",
                "attrs": {k: v for k, v in a.items() if k.startswith("data-") or k in ("aria-label", "alt", "id")},
                "text": (a.get("aria-label") or a.get("alt") or "")[:80],
                "offset": self._offset(),
            })
        if tag in NEVER or tag in VOID:
            return
        rowlike = tag in ("tr", "li") or a.get("role") == "row" or bool(ROWLIKE.search(cls)) or "data-id" in a or "data-key" in a
        self.stack.append(seg)
        self.open.append([tag, node, "", rowlike])

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag in NEVER or tag in VOID:
            return
        for i in range(len(self.open) - 1, -1, -1):          # close up to the matching tag
            if self.open[i][0] == tag:
                del self.open[i:]
                del self.stack[i:]
                break

    def handle_data(self, data):
        t = data.strip()
        if not t:
            return
        for o in self.open:
            if not o[2]:
                o[2] = t[:40]                                 # each open element's first text
        for o in reversed(self.open):                         # the text belongs to the innermost open node
            if o[1] is not None:
                n = self.nodes[o[1]]
                n["text"] = (n["text"] + " " + t).strip()[:80]
                break

    @staticmethod
    def _role_from_class(cls):
        for c in cls.split():
            if "-" in c and not c.startswith(("i-", "is-", "has-")):
                return c.lstrip(".")
        return None

    @staticmethod
    def _kind(tag, a):
        if tag in INTERACTIVE:
            return "control"
        if tag in ("svg", "use", "img"):
            return "icon" if tag != "img" else "image"
        if tag in ("h1", "h2", "h3", "h4", "p", "span", "label", "td", "th"):
            return "text"
        return "component"

    @staticmethod
    def _include(tag, cls, a):
        if tag in NEVER:
            return False
        if tag in INTERACTIVE or tag in ("svg", "img"):
            return True
        if a.get("data-state") or a.get("data-role") or a.get("data-component"):
            return True
        if DECORATIVE_HINT.search(cls) and tag == "div":
            return False           # layout scaffolding gets no id
        if tag in ("h1", "h2", "h3", "h4", "p", "span", "td", "th", "li"):
            return True
        if cls:
            return True
        return False


def fingerprint(n):
    return f"text:{n['text'][:40]}|row:{n.get('context', '')}|kind:{n['kind']}|cls:{' '.join(sorted(n['classes'].split()))[:60]}"


def load_ledger(p):
    """Load the ledger, refusing a version this script does not understand.

    Silently rewriting a future ledger with older rules would corrupt every id
    in it, and ids are the one thing in this system that must never break."""
    if p.exists():
        led = json.loads(p.read_text())
        got = led.get("ledger_version", 0)
        if got > LEDGER_VERSION:
            print(f"ledger_version {got} is newer than this script understands "
                  f"({LEDGER_VERSION}). Upgrade the skill rather than letting an "
                  f"older script rewrite it.", file=sys.stderr)
            sys.exit(4)
        if got < LEDGER_VERSION:
            print(f"migrating ledger v{got} -> v{LEDGER_VERSION}", file=sys.stderr)
            led["ledger_version"] = LEDGER_VERSION
        led.setdefault("history", [])
        return led
    return {"ledger_version": LEDGER_VERSION, "screens": {}, "nodes": {},
            "next_node": {}, "retired": [], "history": []}


def assign(existing, nodes, screen_name):
    """Match every node to an existing id, in passes from surest to least sure, so that a
    weak match (same path) never takes an id a sure one (same content) would claim:
      1 exact            same role, path and fingerprint
      2 moved            same role and fingerprint, the path changed (a row inserted above)
      3 content-changed  same role and path, the content changed
      4 role-only        the only active node of that role left
    Returns [(id or None, how)] in node order."""
    pool = {i: m for i, m in existing.items() if m.get("screen") == screen_name and m.get("status") == "active"}
    out, used = [None] * len(nodes), set()
    fps = [fingerprint(n) for n in nodes]
    def take(test, how):
        for k, n in enumerate(nodes):
            if out[k]:
                continue
            hits = [i for i, m in pool.items() if i not in used and m["role"] == n["role"] and test(m, n, fps[k])]
            if len(hits) == 1 or (hits and how == "exact"):
                out[k] = (hits[0], how); used.add(hits[0])
    take(lambda m, n, fp: m["path"] == n["path"] and m.get("fingerprint") == fp, "exact")
    take(lambda m, n, fp: m.get("fingerprint") == fp, "moved")
    take(lambda m, n, fp: m["path"] == n["path"], "content-changed")
    take(lambda m, n, fp: True, "role-only")
    return [o or (None, "new") for o in out]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--screen", required=True)
    ap.add_argument("--name", required=True, help="screen name as used in the ledger")
    ap.add_argument("--ledger", default="ids.json")
    ap.add_argument("--write", action="store_true")
    ap.add_argument("--annotate", default=None,
                    help="write a copy of the screen with data-node-id attributes")
    a = ap.parse_args()

    screen = pathlib.Path(a.screen)
    ledger_path = pathlib.Path(a.ledger)
    ledger = load_ledger(ledger_path)

    if a.name not in ledger["screens"]:
        nxt = max(ledger["screens"].values(), default=0) + 1
        ledger["screens"][a.name] = nxt
        ledger["next_node"][str(nxt)] = 1
    snum = ledger["screens"][a.name]
    skey = str(snum)
    ledger["next_node"].setdefault(skey, 1)

    source = screen.read_text(encoding="utf-8")
    w = NodeWalker(source)
    w.feed(source)
    w.close()
    for n in w.nodes:                       # the row's first text, known once the row is read
        row = n.pop("_row", None)
        n["context"] = (row[2] if row else "")[:30]

    today = datetime.date.today().isoformat()
    used, results = set(), []

    for n, (nid, how) in zip(w.nodes, assign(ledger["nodes"], w.nodes, a.name)):
        if nid is None:
            nid = f"{snum}:{ledger['next_node'][skey]}"
            ledger["next_node"][skey] += 1
        used.add(nid)
        prev = ledger["nodes"].get(nid, {})
        ledger["nodes"][nid] = {
            "kind": n["kind"], "role": n["role"], "screen": a.name,
            "path": n["path"], "fingerprint": fingerprint(n),
            "pair": prev.get("pair"),
            "first_seen": prev.get("first_seen", today),
            "last_seen": today, "status": "active",
        }
        results.append((nid, how, n["role"], n["path"][:60], n["offset"]))

    # retire nodes on this screen that were not seen this pass
    retired = []
    for nid, m in ledger["nodes"].items():
        if m.get("screen") == a.name and nid not in used and m.get("status") == "active":
            m["status"] = "retired"
            m["retired_on"] = today
            retired.append(nid)
            if nid not in ledger["retired"]:
                ledger["retired"].append(nid)

    by_how = {}
    for _, how, _, _, _ in results:
        by_how[how] = by_how.get(how, 0) + 1

    print(f"screen {a.name} -> {snum}   nodes {len(results)}")
    for k in ("exact", "moved", "content-changed", "role-only", "new"):
        if by_how.get(k):
            print(f"  {k:16} {by_how[k]}")
    if retired:
        print(f"  retired          {len(retired)}  ({', '.join(retired[:8])})")

    unsure = [r for r in results if r[1] in ("role-only", "new")]
    if unsure:
        print("\nreview these — they did not match cleanly:")
        for nid, how, role, path, _ in unsure[:30]:
            print(f"  {nid:>9}  {how:14} {role:24} {path}")
        if len(unsure) > 30:
            print(f"  ... {len(unsure)-30} more")

    if a.annotate:
        # mark exactly the nodes that got ids, at their start tags' offsets, last first
        annotated = source
        for nid, _, _, _, off in sorted(results, key=lambda r: -r[4]):
            m = re.compile(r"<[a-zA-Z][^>]*?(/?)>").match(annotated, off)
            if not m:
                continue
            end = m.end() - (2 if m.group(1) else 1)
            annotated = annotated[:end].rstrip() + f' data-node-id="{nid}"' + annotated[end:]
        pathlib.Path(a.annotate).write_text(annotated, encoding="utf-8")
        print(f"\nwrote annotated copy: {a.annotate}")

    if a.write:
        ledger["history"].append({
            "at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "screen": a.name, "skill_version": SKILL_VERSION,
            "nodes": len(results), "new": by_how.get("new", 0),
            "retired": len(retired),
        })
        ledger["history"] = ledger["history"][-50:]
        ledger_path.write_text(json.dumps(ledger, indent=2))
        print(f"\nledger updated: {ledger_path}")
    else:
        print("\ndry run — pass --write to update the ledger")


if __name__ == "__main__":
    main()
