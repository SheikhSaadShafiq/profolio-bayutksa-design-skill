/* Redline inspector — inlined into every bundled deliverable.
   Reads the node ledger from <script type="application/json" id="__ids">.
   Zero dependencies, zero network. Toggle with the R key. */
(function () {
  "use strict";
  var ledger = {};
  try {
    var el = document.getElementById("__ids");
    if (el) ledger = JSON.parse(el.textContent).nodes || {};
  } catch (e) { /* a missing ledger degrades to ids-only, not a broken page */ }

  var on = false, sel = null;
  var css = [
    "#rl-panel{position:fixed;right:0;top:0;width:300px;height:100%;background:#fff;",
    "border-left:1px solid #e0e0e0;font:12px/1.5 ui-monospace,monospace;padding:12px;",
    "overflow:auto;z-index:2147483646;display:none}",
    "#rl-panel.on{display:block}",
    "#rl-panel h4{margin:0 0 8px;font:600 13px system-ui}",
    "#rl-panel dt{color:#707070;margin-top:6px}",
    "#rl-panel dd{margin:0;word-break:break-all}",
    "[data-node-id].rl-hot{outline:1px solid #28B16D;outline-offset:1px}",
    "[data-node-id].rl-sel{outline:2px solid #006169;outline-offset:1px}",
    ".rl-badge{position:absolute;background:#006169;color:#fff;font:10px/1 monospace;",
    "padding:2px 4px;border-radius:2px;pointer-events:none;z-index:2147483647}",
    "#rl-hint{position:fixed;left:8px;bottom:8px;font:11px system-ui;color:#707070;",
    "background:#fff;border:1px solid #e0e0e0;border-radius:4px;padding:4px 8px;z-index:2147483646}"
  ].join("");

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  var panel = document.createElement("div");
  panel.id = "rl-panel";
  document.body.appendChild(panel);

  var hint = document.createElement("div");
  hint.id = "rl-hint";
  hint.textContent = "R — redlines";
  document.body.appendChild(hint);

  var badge = document.createElement("div");
  badge.className = "rl-badge";
  badge.style.display = "none";
  document.body.appendChild(badge);

  function meta(id) { return ledger[id] || {}; }

  function describe(node) {
    var id = node.getAttribute("data-node-id");
    var m = meta(id);
    var r = node.getBoundingClientRect();
    var cs = getComputedStyle(node);
    var rows = [
      ["id", id],
      ["role", m.role || "—"],
      ["kind", m.kind || "—"],
      ["pair", m.pair || "—"],
      ["box", Math.round(r.width) + " × " + Math.round(r.height)],
      ["padding", cs.padding],
      ["font", cs.fontWeight + " " + cs.fontSize + "/" + cs.lineHeight],
      ["color", cs.color],
      ["background", cs.backgroundColor],
      ["radius", cs.borderRadius],
      ["classes", node.className && node.className.baseVal !== undefined
        ? node.className.baseVal : node.className]
    ];
    var html = "<h4>" + id + "</h4><dl>";
    rows.forEach(function (row) {
      html += "<dt>" + row[0] + "</dt><dd>" + (row[1] || "—") + "</dd>";
    });
    html += "</dl><p><button id='rl-copy'>copy id</button></p>";
    panel.innerHTML = html;
    document.getElementById("rl-copy").onclick = function () {
      navigator.clipboard && navigator.clipboard.writeText(id);
      this.textContent = "copied";
    };
  }

  document.addEventListener("mouseover", function (e) {
    if (!on) return;
    var n = e.target.closest("[data-node-id]");
    document.querySelectorAll(".rl-hot").forEach(function (x) { x.classList.remove("rl-hot"); });
    if (!n) { badge.style.display = "none"; return; }
    n.classList.add("rl-hot");
    var r = n.getBoundingClientRect();
    badge.textContent = n.getAttribute("data-node-id");
    badge.style.display = "block";
    badge.style.left = (r.left + window.scrollX) + "px";
    badge.style.top = (r.top + window.scrollY - 14) + "px";
  });

  document.addEventListener("click", function (e) {
    if (!on) return;
    var n = e.target.closest("[data-node-id]");
    if (!n) return;
    e.preventDefault();
    if (sel) sel.classList.remove("rl-sel");
    sel = n; n.classList.add("rl-sel");
    describe(n);
  }, true);

  document.addEventListener("keydown", function (e) {
    if (e.key !== "r" && e.key !== "R") return;
    if (/input|textarea/i.test((e.target.tagName || ""))) return;
    on = !on;
    panel.classList.toggle("on", on);
    hint.textContent = on ? "R — redlines on · click a node" : "R — redlines";
    if (!on) {
      badge.style.display = "none";
      document.querySelectorAll(".rl-hot,.rl-sel").forEach(function (x) {
        x.classList.remove("rl-hot", "rl-sel");
      });
    }
  });
})();
