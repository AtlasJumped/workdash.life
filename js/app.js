(function () {
  "use strict";
  var HOST = "workdash.life";
  var DESIGNS = ["Warm", "Meadow", "Sky"];
  var LEVELS = [["strong like", "Strong like"], ["like", "Like"], ["dislike", "Dislike"], ["strong dislike", "Strong dislike"]];
  var KEY = HOST + ".ratings.v1", DKEY = HOST + ".design";
  function el(tag, attrs, kids) {
    var e = document.createElement(tag), k;
    for (k in (attrs || {})) { if (k === "text") e.textContent = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { e.appendChild(c); });
    return e;
  }
  function store(get, key, val) {
    try { if (get) return window.localStorage.getItem(key); window.localStorage.setItem(key, val); } catch (e) { return null; }
    return null;
  }
  var ratings = {};
  try { ratings = JSON.parse(store(true, KEY) || "{}") || {}; } catch (e) { ratings = {}; }
  var design = parseInt(new URLSearchParams(location.search).get("design"), 10);
  if (!(design >= 1 && design <= 3)) design = parseInt(store(true, DKEY), 10);
  if (!(design >= 1 && design <= 3)) design = 1;
  var pk = document.getElementById("picker");
  var openBtn = el("button", { type: "button", "class": "pk-open", "aria-expanded": "false", "aria-controls": "pk-panel", text: "Design" });
  var panel = el("div", { "class": "pk-panel", id: "pk-panel", role: "region", "aria-label": "Design picker", hidden: "" });
  pk.appendChild(panel); pk.appendChild(openBtn);
  function save() { store(false, KEY, JSON.stringify(ratings)); }
  function msg(t) { var m = document.getElementById("pk-msg"); if (m) m.textContent = t; }
  function render() {
    document.documentElement.setAttribute("data-design", String(design));
    store(false, DKEY, String(design));
    panel.textContent = "";
    var top = el("div", { "class": "pk-top" }, [el("b", { text: "Pick a design" }), el("button", { type: "button", "class": "btn", id: "pk-close", text: "Close" })]);
    panel.appendChild(top);
    top.lastChild.addEventListener("click", closePanel);
    var row = el("div", { "class": "pk-designs", role: "group", "aria-label": "Designs" });
    DESIGNS.forEach(function (n, i) {
      var b = el("button", { type: "button", "aria-pressed": String(design === i + 1), text: (i + 1) + " " + n });
      b.addEventListener("click", function () {
        design = i + 1;
        try { history.replaceState(null, "", "?design=" + design); } catch (e) {}
        render(); panel.querySelector(".pk-designs button[aria-pressed=true]").focus();
      });
      row.appendChild(b);
    });
    panel.appendChild(row);
    var r = ratings[design] || {};
    var fs = el("fieldset"); fs.appendChild(el("legend", { text: "Your rating of design " + design }));
    LEVELS.forEach(function (l) {
      var inp = el("input", { type: "radio", name: "rate", value: l[0] });
      if (r.level === l[0]) inp.checked = true;
      inp.addEventListener("change", function () { ratings[design] = ratings[design] || {}; ratings[design].level = l[0]; save(); msg("Saved."); });
      fs.appendChild(el("label", {}, [inp, document.createTextNode(" " + l[1])]));
    });
    panel.appendChild(fs);
    var tl = el("label", { "for": "pk-note", text: "Note (optional)" });
    var ta = el("textarea", { id: "pk-note", maxlength: "500" }); ta.value = r.note || "";
    ta.addEventListener("input", function () { ratings[design] = ratings[design] || {}; ratings[design].note = ta.value; save(); });
    panel.appendChild(tl); panel.appendChild(ta);
    var cp = el("button", { type: "button", "class": "btn primary", text: "Copy all ratings" });
    cp.addEventListener("click", copyAll);
    panel.appendChild(el("p", {}, [cp]));
    panel.appendChild(el("p", { "class": "pk-msg", id: "pk-msg", role: "status" }));
  }
  function summary() {
    var out = [HOST + " design ratings"];
    DESIGNS.forEach(function (n, i) {
      var r = ratings[i + 1] || {};
      out.push((i + 1) + " " + n + ": " + (r.level || "not rated") + (r.note ? " | note: " + r.note : ""));
    });
    return out.join("\n");
  }
  function copyAll() {
    var t = summary();
    function fallback() {
      var ta = el("textarea", { "aria-hidden": "true" }); ta.value = t; ta.style.cssText = "position:fixed;left:-999px";
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta); msg(ok ? "Copied." : "Could not copy. Select the text in the note box instead.");
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { msg("Copied."); }, fallback);
    else fallback();
  }
  function closePanel() { panel.setAttribute("hidden", ""); openBtn.setAttribute("aria-expanded", "false"); openBtn.focus(); }
  openBtn.addEventListener("click", function () {
    var open = panel.hasAttribute("hidden");
    if (open) { panel.removeAttribute("hidden"); openBtn.setAttribute("aria-expanded", "true"); panel.querySelector("button").focus(); }
    else closePanel();
  });
  panel.addEventListener("keydown", function (e) { if (e.key === "Escape") closePanel(); });
  render();
})();
