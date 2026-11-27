/* ELV8 dash v1.9 (Nov 27, Leo's Nov 26 asks): title "Your elevating family experience dashboard" with a line on what it is; the header mark reads ELV8
   and opens elevat.ing; only "Don't show this again" on the intro; "Your look is on" sits next to a "Switch to our look" button; Bigger text steps
   100, 125, 140, 160% and enlarges the page text behind the dashboard; "Go back" after Back to top reopens the dashboard; Places lists the
   elevat.ing family of websites (no HMR sites outside the HMR sites); "I'm having trouble" help; "Request a button"; a red "Are you sure?" reset;
   a tap outside never closes it; Log in is live on every site (hmr-auth.js sits next to this file on every site).
   HMR dash v1.7 (Nov 26): Log in is live. One HMR family account (email and password, Supabase via hmr-auth.js next to this file) works on every HMR site; the optional questions stay below it.
   HMR dash v1.6 (Nov 26, Leo): Log in asks a few optional questions (stored on this device); sharing enough and saying yes to new ideas about reality reveals a hidden invitation.
   HMR dash v1.5 (Nov 25, Leo's feedback): the dashboard can be dragged anywhere on the screen by its top bar, with a one-time hint.
   HMR dash v1.4: the HMR family experience dashboard, opened by the round HMR button in the center of the shared bottom bar (hmr-dock.js v6.5+).
   One file, copied next to hmr-dock.js on every HMR site, lazy-loaded the first time the HMR button is pressed (or at boot when a visitor has a saved look).
   Layers:
     Home      intro card (with "Don't show this again", explained), row "Right now" (Share, Top with a way back, Bigger text, Night),
               row "Go deeper" (UI/UX studio, Improve this site, Funsies, Places), footer link to Your settings. Showcase tile appears when the skin has media.
     Studio    the dashboard shrinks to a bar at the bottom of the screen so the page stays visible. Tabs: Colors (whole-palette recolor of the page as built),
               Type (font, size), Comfort (spacing, calm motion, underlined links, strong focus, extra contrast), Layouts (the dock's generated designs), Saved (share, keep, reset).
     Improve   Speak, Write feedback, React to a spot, Highlight tip, I'm lost, Rate a design.
     Funsies   the toy box plus each toy by name.
     Places    sections of this page, and the other HMR family sites.
     Settings  intro on/off, reset studio, reset everything saved on this site (with a confirm), privacy line, version.
    Log in    button at the top of the dashboard: log in, create an account, reset a password, log out (hmr-auth.js), then optional questions.
   Shared design assets: the skin manifest https://hmrfamily.life/hmr-kit/skin.json (palettes, fonts, media) is read by every site, so a new palette or a
   finished render added there shows up across the whole HMR ecosystem without touching each site. Built-in palettes work offline.
   Everything a visitor chooses is stored in this browser only (localStorage, per site), always inside try/catch.
   API: window.HMRDash = { open, close, studio, view, apply, palettes, state, version } and window.HMRKit = { skin, palettes, applyPalette, onSkin }. */
(function () {
  'use strict';
  if (window.HMRDash && window.HMRDash.version >= 1) return;
  var doc = document, root = doc.documentElement, VERSION = 1.9;
  // v1.9 (Leo, Nov 26): the family name on every site is "the elevat.ing family of websites". HMR is not named on claudebomb.com or elevat.ing,
  //   so there the account is the elevat.ing family account; the HMR sites keep their account name until he picks one.
  var HIDEHMR = /(^|\.)(claudebomb\.com|elevat\.ing)$/i.test(location.hostname), HMRHOST = /(^|\.)(universemodel\.ai|hmrfamily\.life|hmrfascia\.life|hmr\.family|chronomath\.ai)$/i.test(location.hostname);
  var FAM = 'elevat.ing family', ACCT = HIDEHMR ? 'elevat.ing family account' : 'HMR family account', ACSITES = HIDEHMR ? 'elevat.ing family site' : 'HMR family site';
  var SKIN_URL = 'https://hmrfamily.life/hmr-kit/skin.json';
  var AUTHSRC = (function () { try { var u = new URL(doc.currentScript.src, location.href); u.pathname = u.pathname.replace(/[^\/]*$/, 'hmr-auth.js'); u.search = '?v=1'; u.hash = ''; return u.toString(); } catch (e) { return 'https://hmrfamily.life/x/hmr-auth.js?v=1'; } })();
  var DRAG_KEY = 'hmr-dash-drag-hint', KEY = 'hmr-studio-v1', INTRO_KEY = 'hmr-dash-intro-off', SKIN_CACHE = 'hmr-skin-v1';
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } }
  function jget(k, d) { try { var v = JSON.parse(lsGet(k)); return v == null ? d : v; } catch (e) { return d; } }
  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function btn(cls, text, aria) { var b = el('button', cls, text); b.type = 'button'; if (aria) b.setAttribute('aria-label', aria); return b; }
  function rm() { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
  function dock() { return window.HMRDock || {}; }
  function host() { return location.hostname.replace(/^www\./, ''); }
  var TOUCHY = (function () { try { return matchMedia('(hover: none)').matches; } catch (e) { return false; } })();

  // ------------------------------------------------------------------ palettes (designed sets; each maps every color on a page to a role)
  var PALETTES = /*PALETTES*/[{"id":"midnight-tide","name":"Midnight Tide","mood":"Deep navy water with lantern light on the waves","dark":true,"bg":"#08152b","surface":"#0f2039","surface2":"#172c4a","line":"#2f476b","text":"#e8f1fb","muted":"#9db3cf","accent":"#4fd6c8","accent2":"#ffb36b","accent3":"#a9b8ff","onAccent":"#06121f","link":"#74dcd2","band":"#f3e6cc","onBand":"#0e1d33","grad":["#0b2a52","#0e4a5e","#2a2f78"],"onGrad":"#f2fbff","select":"#1f4f7a"},{"id":"nebula-nursery","name":"Nebula Nursery","mood":"Violet star clouds where new suns are born","dark":true,"bg":"#150f2b","surface":"#1e1640","surface2":"#2a1f55","line":"#4a3c80","text":"#efe9ff","muted":"#b5a9dc","accent":"#ff8ac2","accent2":"#7fd8ff","accent3":"#ffd670","onAccent":"#1a0f2e","link":"#c9a8ff","band":"#ffd9ec","onBand":"#2a1238","grad":["#2b1466","#6a1f7a","#143a7a"],"onGrad":"#ffffff","select":"#4a2f8a"},{"id":"forest-floor","name":"Forest Floor","mood":"Moss, lichen and mushrooms after rain","dark":true,"bg":"#121a12","surface":"#1a2519","surface2":"#233223","line":"#3d5239","text":"#ebf0df","muted":"#a9b79a","accent":"#c9e265","accent2":"#e89a5b","accent3":"#7fd1a8","onAccent":"#131a0c","link":"#b8dd7a","band":"#e9dfc3","onBand":"#1c2414","grad":["#1d3a22","#3a4a1c","#5a3b1c"],"onGrad":"#fbfbe9","select":"#3b5a2a"},{"id":"ink-and-gold","name":"Ink and Gold","mood":"Old manuscripts lit by gold leaf","dark":true,"bg":"#0d0e16","surface":"#161722","surface2":"#20222f","line":"#3b3d4f","text":"#f3ecd9","muted":"#b5ab94","accent":"#e3b34a","accent2":"#d98a7a","accent3":"#a9bfd6","onAccent":"#14110a","link":"#f0c868","band":"#e3b34a","onBand":"#14110a","grad":["#1c1a2b","#3a2c10","#5b4313"],"onGrad":"#fff6dc","select":"#4a3b12"},{"id":"oxblood-library","name":"Oxblood Library","mood":"Leather chairs, brass lamps, quiet reading","dark":true,"bg":"#240c10","surface":"#301218","surface2":"#3e1a21","line":"#683039","text":"#fbe9e4","muted":"#d0a9a6","accent":"#f08f84","accent2":"#a8cfa4","accent3":"#e8b96a","onAccent":"#260c0e","link":"#f2c488","band":"#efe0c4","onBand":"#33100f","grad":["#5a1420","#7a2a1a","#4a1838"],"onGrad":"#fff1ea","select":"#70242e"},{"id":"verdigris-copper","name":"Verdigris Copper","mood":"Aged copper roofs turning sea green","dark":true,"bg":"#0c2422","surface":"#12302d","surface2":"#1a3d39","line":"#33605a","text":"#e6f5ef","muted":"#9cc2b8","accent":"#e99a62","accent2":"#7fe0c4","accent3":"#f0d27a","onAccent":"#0d1f1c","link":"#f0b089","band":"#f1c9a5","onBand":"#2a1509","grad":["#0f4a44","#1c5a3c","#6a3a1c"],"onGrad":"#f5fff9","select":"#2a5f58"},{"id":"basalt-citrus","name":"Basalt Citrus","mood":"Volcanic stone with a squeeze of lime","dark":true,"bg":"#22252a","surface":"#2b2f35","surface2":"#363b42","line":"#555c66","text":"#f2f4ee","muted":"#b4bac0","accent":"#e4ee5a","accent2":"#ff8a73","accent3":"#6fd6ea","onAccent":"#1a1d10","link":"#dfe96a","band":"#e4ee5a","onBand":"#1c2008","grad":["#2f3a1a","#1e3f47","#4a2a2a"],"onGrad":"#fbffe8","select":"#4a5320"},{"id":"aurora-harbor","name":"Aurora Harbor","mood":"Northern lights over a still slate harbor","dark":true,"bg":"#18222f","surface":"#212d3c","surface2":"#2b394a","line":"#48596c","text":"#eaf3f7","muted":"#a9bac8","accent":"#7cf0b0","accent2":"#d7a2ff","accent3":"#7cc8ff","onAccent":"#0c1a18","link":"#8fe6c0","band":"#d8f5e6","onBand":"#12241f","grad":["#12443c","#1f3a6b","#4a2a70"],"onGrad":"#f4fffa","select":"#2f5a55"},{"id":"museum-paper","name":"Museum Paper","mood":"Quiet gallery walls and careful ink labels","dark":false,"bg":"#f4f2ec","surface":"#eae7de","surface2":"#dfdace","line":"#bfb8a8","text":"#23211c","muted":"#5f5a50","accent":"#1f4e79","accent2":"#9c3d2a","accent3":"#666515","onAccent":"#fffdf6","link":"#1c4a73","band":"#23201b","onBand":"#f4f2ec","grad":["#e9e2d0","#dcd6c6","#d3d9d6"],"onGrad":"#22201a","select":"#c9dcea"},{"id":"dawn-porch","name":"Dawn Porch","mood":"First light, warm tea, the house still asleep","dark":false,"bg":"#fff4ee","surface":"#ffe8dd","surface2":"#fad9cb","line":"#e0b5a3","text":"#3a1f2b","muted":"#74505b","accent":"#c23f3a","accent2":"#8a4fa8","accent3":"#ab560d","onAccent":"#ffffff","link":"#b0352f","band":"#3a1f4a","onBand":"#ffeedd","grad":["#ffd9b8","#ffc2c0","#e6c6f2"],"onGrad":"#3a1730","select":"#ffd0a8"},{"id":"citrus-grove","name":"Citrus Grove","mood":"Lemon rind, blood orange and green leaves","dark":false,"bg":"#fbfbe6","surface":"#f3f5d0","surface2":"#e8edb8","line":"#c0c986","text":"#1f2a12","muted":"#525f38","accent":"#3b7818","accent2":"#bf4409","accent3":"#a8166a","onAccent":"#ffffff","link":"#9a3a00","band":"#24400f","onBand":"#f6fbd0","grad":["#fff2a0","#ffd98a","#d6ef9a"],"onGrad":"#2a2a08","select":"#ffe27a"},{"id":"glasshouse","name":"Glasshouse","mood":"Ferns and orchids behind misted glass","dark":false,"bg":"#eef5ee","surface":"#e1eee3","surface2":"#d2e5d7","line":"#a6c4af","text":"#14291f","muted":"#476153","accent":"#1f6f52","accent2":"#a23b6a","accent3":"#85560f","onAccent":"#ffffff","link":"#17634a","band":"#123326","onBand":"#e8f7ec","grad":["#cfeedd","#bfe3e6","#e6ecc0"],"onGrad":"#10291f","select":"#b6e3c3"},{"id":"mesa-noon","name":"Mesa Noon","mood":"Red rock, turquoise and sun-baked sand","dark":false,"bg":"#f3dfc6","surface":"#ebd2b5","surface2":"#e2c4a2","line":"#c49d74","text":"#3b2416","muted":"#644532","accent":"#a53f23","accent2":"#1b6770","accent3":"#5b6619","onAccent":"#fff8ee","link":"#8f351c","band":"#1f5560","onBand":"#fdf1e0","grad":["#f5c99a","#eeaa88","#e3b7b0"],"onGrad":"#3a1a10","select":"#f3c88e"},{"id":"kite-weather","name":"Kite Weather","mood":"Big blue sky with bright paper kites","dark":false,"bg":"#eef5fc","surface":"#e0ecf9","surface2":"#d0e1f4","line":"#a3bddb","text":"#10233b","muted":"#465e7a","accent":"#1d5fd1","accent2":"#c2371f","accent3":"#856000","onAccent":"#ffffff","link":"#1a4fb5","band":"#12305e","onBand":"#eaf3ff","grad":["#cfe4ff","#dcd6ff","#ffe0d0"],"onGrad":"#142544","select":"#bcd8ff"},{"id":"lilac-letter","name":"Lilac Letter","mood":"A handwritten note pressed with flowers","dark":false,"bg":"#f6f1fb","surface":"#ebe3f6","surface2":"#dfd4ef","line":"#bfaedb","text":"#261a3d","muted":"#594b76","accent":"#6a3fc0","accent2":"#b5326e","accent3":"#1c6e7d","onAccent":"#ffffff","link":"#5a32ad","band":"#2a1b4d","onBand":"#f1e9ff","grad":["#e3d4ff","#ffd6ea","#d0e6ff"],"onGrad":"#24163f","select":"#dcc8ff"},{"id":"river-stone","name":"River Stone","mood":"Smooth gray pebbles and one bright koi","dark":false,"bg":"#e9ebe6","surface":"#dee1da","surface2":"#d0d5cc","line":"#a9b1a6","text":"#1d2422","muted":"#48524e","accent":"#b8451d","accent2":"#0f5f66","accent3":"#5a4a9a","onAccent":"#ffffff","link":"#0d565c","band":"#1d2a2a","onBand":"#eef3f0","grad":["#dfe5e0","#cfe0de","#e6dccf"],"onGrad":"#1a2422","select":"#bfe0dc"},{"id":"lighthouse","name":"Lighthouse","mood":"Maximum contrast with bold beacons on black","dark":true,"bg":"#000000","surface":"#121212","surface2":"#1d1d1d","line":"#4d4d4d","text":"#ffffff","muted":"#e0dfd0","accent":"#ffd60a","accent2":"#5ce1ff","accent3":"#ff9ecb","onAccent":"#000000","link":"#8fd6ff","band":"#ffffff","onBand":"#000000","grad":["#000000","#1a1040","#3a0a3a"],"onGrad":"#ffffff","select":"#0b4bb3"},{"id":"candle-hour","name":"Candle Hour","mood":"Low blue light, soft amber glow for late nights","dark":true,"bg":"#1a0f06","surface":"#251609","surface2":"#311d0c","line":"#5a391b","text":"#ffd9a0","muted":"#c9995c","accent":"#e8734a","accent2":"#ffc857","accent3":"#ff9a3c","onAccent":"#1a0d02","link":"#ffb866","band":"#f2c078","onBand":"#241203","grad":["#3a1c08","#5c2a0a","#6b1f10"],"onGrad":"#ffe2b0","select":"#5a3410"}]/*END*/;
  var COPY = /*COPY*/{"introTitle":"Your elevating family experience dashboard","introBody":"The elevat.ing family is a group of free, ad-free websites that share this bottom bar. This dashboard lets you shape how this site looks for you (only you see your changes), tell us what you think, play a little, and find the other sites in the family.","dontShowLabel":"Don't show this again","dontShowExplain":"Tap this and next time the dashboard opens straight to its buttons; your choice is saved only in this browser on this site, and you can bring this intro back under \"Your settings\".","tiles":{"share":{"label":"Share","hint":"Send this page to someone you care about"},"top":{"label":"Back to top","hint":"Jump up, then hop back where you were"},"bigger":{"label":"Bigger text","hint":"Make the words easier to read"},"night":{"label":"Night colors","hint":"Switch to soft night colors and back"},"studio":{"label":"UI/UX studio","hint":"Pick colors, type, comfort and layout"},"improve":{"label":"Help us improve","hint":"Tell us what works and what does not"},"funsies":{"label":"Funsies","hint":"Little toys to play with"},"places":{"label":"Places","hint":"Parts of this page and our other sites"},"settings":{"label":"Your settings","hint":"See or reset the choices you saved"}},"studioIntro":"Every change you make here shows up right away and is saved in this browser."}/*END*/;
  function C(k, d) { return COPY[k] || d; }
  function T(k, f) { var t = (COPY.tiles || {})[k] || {}; return t[f] || ''; }
  var HEX = /^#[0-9a-f]{6}$/;
  var ROLES = ['bg', 'surface', 'surface2', 'line', 'text', 'muted', 'accent', 'accent2', 'accent3', 'onAccent', 'link', 'band', 'onBand', 'onGrad', 'select'];
  function hexRgb(h) { return { r: parseInt(h.substr(1, 2), 16), g: parseInt(h.substr(3, 2), 16), b: parseInt(h.substr(5, 2), 16), a: 1 }; }
  function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lum(o) { return 0.2126 * lin(o.r) + 0.7152 * lin(o.g) + 0.0722 * lin(o.b); }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function validPalette(p) {   // used for palettes that arrive from the skin manifest; built-ins were checked when designed
    if (!p || typeof p.id !== 'string' || !/^[a-z0-9-]{2,40}$/.test(p.id) || typeof p.name !== 'string') return false;
    for (var i = 0; i < ROLES.length; i++) if (!HEX.test(String(p[ROLES[i]] || '').toLowerCase())) return false;
    if (!p.grad || p.grad.length !== 3 || !p.grad.every(function (g) { return HEX.test(String(g).toLowerCase()); })) return false;
    var R = function (a, b) { return ratio(hexRgb(String(a).toLowerCase()), hexRgb(String(b).toLowerCase())); };
    return R(p.text, p.bg) >= 7 && R(p.text, p.surface) >= 7 && R(p.muted, p.bg) >= 4.5 && R(p.link, p.bg) >= 4.5 && R(p.onAccent, p.accent) >= 4.5 && R(p.onBand, p.band) >= 4.5 && p.grad.every(function (g) { return R(p.onGrad, g) >= 4.5; });
  }
  function allPalettes() { return PALETTES.concat(SKIN.palettes || []); }
  function palById(id) { var a = allPalettes(); for (var i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }

  // ------------------------------------------------------------------ color engine: read every color on the page, give it a role, paint the role
  function parse(s) {
    var m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/.exec(String(s || '').trim());
    if (!m) return null; var a = m[4] == null ? 1 : (/%$/.test(m[4]) ? parseFloat(m[4]) / 100 : parseFloat(m[4]));
    return { r: +m[1], g: +m[2], b: +m[3], a: a };
  }
  function oklab(o) {   // perceptual lightness and colorfulness
    var r = lin(o.r), g = lin(o.g), b = lin(o.b);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s, A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s, B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
    return { L: L, C: Math.sqrt(A * A + B * B) };
  }
  function key(o) { return (o.r >> 3) + ',' + (o.g >> 3) + ',' + (o.b >> 3); }
  var SKIPTAG = { IMG: 1, VIDEO: 1, CANVAS: 1, IFRAME: 1, PICTURE: 1, SOURCE: 1, SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, OBJECT: 1, EMBED: 1, svg: 1, SVG: 1, BR: 1, WBR: 1, META: 1, LINK: 1 };
  function ours(n) {
    if (!n || n.nodeType !== 1) return false;
    if (n.hasAttribute && n.hasAttribute('data-hmr-ui')) return true;
    var c = typeof n.className === 'string' ? n.className : '', id = n.id || '';
    return /(^|\s)hmr-/.test(c) || /^hmr-/.test(id) || n.hasAttribute('data-hmr-dock');
  }
  var painted = null, paintedKey = '', mo = null, moT = 0, pending = [];
  // colors go in through classes and one stylesheet, never the style attribute: some pages' own scripts reset an element's style attribute after their animations, which would wipe inline colors
  var cls = {}, clsN = 0, clsCss = [], clsEls = [], clsDirty = false;
  function setP(n, prop, v) {
    var k = prop + ':' + v, c = cls[k];
    if (!c) { c = cls[k] = 'hmrp' + (++clsN); clsCss.push('html.hmr-pal .' + c + '.' + c + '.' + c + ',html.hmr-pal.' + c + '.' + c + '.' + c + '{' + prop + ':' + v + '!important}'); clsDirty = true; }
    if (!n.classList.contains(c)) { n.classList.add(c); clsEls.push([n, c]); }
  }
  function flushCls() { if (clsDirty) { cssVar('palc', clsCss.join('\n')); clsDirty = false; } }
  function restoreColors() {
    for (var i = 0; i < clsEls.length; i++) { try { clsEls[i][0].classList.remove(clsEls[i][1]); } catch (e) { } }
    clsEls = []; cls = {}; clsCss = []; clsDirty = false; cssVar('palc', ''); painted = null; paintedKey = ''; pending = []; clearTimeout(moT); moT = 0; if (mo) { try { mo.disconnect(); } catch (e) { } mo = null; }
    root.classList.remove('hmr-pal'); root.removeAttribute('data-hmr-pal'); cssVar('pal', '');
  }
  var EXCL = '[data-hmr-ui],#hmr-dock,.hmr-dock,svg,[class^="hmr-"],[class*=" hmr-"]';
  // an element is ours (or inside our UI) only up to <body>: <html> and <body> carry hmr- state classes (hmr-pal and the dock's), which must not mark the whole page as ours
  var skipC = new WeakMap();
  function uiUp(n) {
    if (!n || n === doc.body || n === root || n.nodeType !== 1) return false;
    var v = skipC.get(n); if (v !== undefined) return v;
    v = !!(ours(n) || (n.matches && n.matches(EXCL)) || uiUp(n.parentElement)); skipC.set(n, v); return v;
  }
  function skip(e) { return SKIPTAG[e.tagName] || uiUp(e); }
  function opaqueGrad(g) {   // a gradient made only of solid colors; see-through overlays (on photos) are left alone
    if (!/gradient\(/.test(g) || /url\(|transparent/.test(g)) return false;
    var m = g.match(/rgba?\([^)]*\)/g) || []; if (!m.length) return false;
    return m.every(function (c) { var o = parse(c); return o && o.a >= 0.95; });
  }
  // P: the palette in use; ctx: computed once per paint
  var PX = null;
  function makeCtx(p, hi) {
    var csR = getComputedStyle(root), csB = getComputedStyle(doc.body);
    var pb = parse(csR.backgroundColor); if (!pb || pb.a < 0.1) pb = parse(csB.backgroundColor); if (!pb || pb.a < 0.1) pb = { r: 255, g: 255, b: 255, a: 1 };
    var P = {}; ROLES.forEach(function (r) { P[r] = hexRgb(p[r]); });
    return { p: p, hi: hi, pb: pb, L0: oklab(pb).L, P: P, accents: {}, n: 0,
      newBg: { bg: p.bg, surface: p.surface, surface2: p.surface2, band: p.band, accent: p.accent, accent2: p.accent2, accent3: p.accent3, grad: p.grad[1] },
      onRole: { band: p.onBand, accent: p.onAccent, accent2: p.onAccent, accent3: p.onAccent, grad: p.onGrad } };
  }
  function bgRole(X, c) {
    var o = oklab(c);
    if (o.C < 0.04) { var d = Math.abs(o.L - X.L0); return d < 0.025 ? 'bg' : d < 0.12 ? 'surface' : d < 0.35 ? 'surface2' : 'band'; }
    var k = key(c); if (!X.accents[k]) { X.accents[k] = ['accent', 'accent2', 'accent3'][X.n++ % 3]; } return X.accents[k];
  }
  function bestOn(X, bgHex, list) { var b = hexRgb(bgHex), top = list[0], tr = 0; list.forEach(function (h) { var r = ratio(hexRgb(h), b); if (r > tr) { tr = r; top = h; } }); return top; }
  function textFor(X, c, isLink, role, origBg) {
    var p = X.p; if (X.onRole[role]) return X.onRole[role];
    var bgHex = X.newBg[role] || p.bg, pick = p.text;
    if (c && c.a > 0.05) {
      var o = oklab(c);
      if (o.C >= 0.06) pick = isLink ? p.link : (ratio(X.P.accent, hexRgb(bgHex)) >= 4.5 ? p.accent : p.link);
      else pick = (X.hi || ratio(c, origBg) >= 7) ? p.text : p.muted;
    }
    if (ratio(hexRgb(pick), hexRgb(bgHex)) < 4.5) pick = bestOn(X, bgHex, [p.text, p.onBand, p.onAccent, p.muted]);
    return pick;
  }
  // one batch: read every value first (no writes in between, so the browser computes styles once), then decide roles in document order, then write
  function paintBatch(list) {
    var X = PX; if (!X || !painted) return;
    var R = [], i, e;
    for (i = 0; i < list.length; i++) {
      e = list[i]; if (!e || e.nodeType !== 1 || painted.has(e) || skip(e)) continue;
      var cs = getComputedStyle(e), par = e.parentElement, pcs = par ? getComputedStyle(par) : null;
      R.push({ e: e, par: par, color: cs.color, inh: !!pcs && pcs.color === cs.color, bg: cs.backgroundColor, bgi: cs.backgroundImage || 'none',
        bw: parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth) + parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth),
        bc: cs.borderTopColor, bc2: cs.borderLeftColor, os: cs.outlineStyle, ow: parseFloat(cs.outlineWidth), oc: cs.outlineColor, td: cs.textDecorationLine,
        link: e.tagName === 'A' || !!(e.closest && e.closest('a')), field: /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName) });
    }
    var W = [], p = X.p;
    for (i = 0; i < R.length; i++) {
      var r = R[i], pi = (r.par && painted.get(r.par)) || { role: 'bg', orig: X.pb, color: p.text, photo: false };
      var role = pi.role, orig = pi.orig, photo = pi.photo, c = parse(r.bg), set = [];
      if (/url\(/.test(r.bgi)) photo = true;
      else if (opaqueGrad(r.bgi)) {
        var gs = (r.bgi.match(/rgba?\([^)]*\)/g) || []).map(parse), g0 = gs[0], g1 = gs[gs.length - 1];
        if (gs.every(function (q) { return oklab(q).C < 0.04 && Math.abs(oklab(q).L - X.L0) < 0.12; })) {   // a pale tint (page wash): keep its shape in the palette's own surfaces
          var r0 = bgRole(X, g0), r1 = bgRole(X, g1);
          set.push(['background-image', 'linear-gradient(180deg,' + X.newBg[r0] + ',' + X.newBg[r1] + ')']); role = r0 === 'bg' ? r1 : r0; orig = g0; photo = false;
        } else { set.push(['background-image', 'linear-gradient(135deg,' + p.grad.join(',') + ')']); role = 'grad'; orig = c && c.a > 0.1 ? c : orig; photo = false; }
      }
      var tinted = set.length > 0;
      if (!/url\(/.test(r.bgi) && c && c.a >= 0.1 && role !== 'grad' && !tinted) {
        var br = bgRole(X, c), nb = hexRgb(X.newBg[br]);
        set.push(['background-color', c.a >= 0.98 ? X.newBg[br] : 'rgba(' + nb.r + ',' + nb.g + ',' + nb.b + ',' + c.a + ')']);
        if (c.a >= 0.5) { role = br; orig = c; photo = false; }
      }
      var col = pi.color;
      if (!photo) {
        // every element gets its color set outright: an element whose own CSS color merely equals its parent's (h1 navy on ink body) would otherwise keep that CSS color
        col = (r.inh && role === pi.role && !pi.photo) ? pi.color : textFor(X, parse(r.color), r.link, role, orig);
        set.push(['color', col]);
      }
      if (r.bw > 0) { var bc = parse(r.bc) || parse(r.bc2); if (bc && bc.a > 0.05) set.push(['border-color', oklab(bc).C >= 0.06 ? p.accent : (X.hi ? p.muted : p.line)]); }
      var oc = parse(r.oc); if (r.os !== 'none' && oc && oc.a > 0.05 && r.ow > 0) set.push(['outline-color', p.accent]);
      if (!photo && r.td && r.td !== 'none') set.push(['text-decoration-color', col]);
      if (!photo && r.field) set.push(['caret-color', col]);
      painted.set(r.e, { role: role, orig: orig, color: col, photo: photo });
      if (set.length) W.push([r.e, set]);
    }
    for (i = 0; i < W.length; i++) for (var j = 0; j < W[i][1].length; j++) setP(W[i][0], W[i][1][j][0], W[i][1][j][1]);
    flushCls();
  }
  function paint(p, hi) {
    var k = p ? p.id + '|' + (hi ? 1 : 0) : '';
    if (k === paintedKey && (painted || !p)) return;
    restoreColors(); if (!p || !doc.body) return;
    painted = new WeakMap(); PX = makeCtx(p, hi); paintedKey = k;
    setP(root, 'background-color', p.bg); setP(doc.body, 'background-color', p.bg); setP(doc.body, 'color', p.text); setP(root, 'color-scheme', p.dark ? 'dark' : 'light');
    painted.set(doc.body, { role: 'bg', orig: PX.pb, color: p.text, photo: false });
    var all = doc.body.getElementsByTagName('*'), list = [];
    for (var i = 0; i < all.length && i < 20000; i++) list.push(all[i]);
    paintBatch(list);
    root.classList.add('hmr-pal'); root.setAttribute('data-hmr-pal', p.id);
    cssVar('pal', '::selection{background:' + p.select + ';color:' + p.text + '}html.hmr-pal{accent-color:' + p.accent + ';scrollbar-color:' + p.line + ' ' + p.bg + '}');
    // content a page adds later (menus, cards built by script) is painted as it arrives: one shared queue, flushed at most every 200 ms
    try {
      mo = new MutationObserver(function (ms) {
        ms.forEach(function (m) { [].forEach.call(m.addedNodes || [], function (x) { if (x.nodeType === 1 && !ours(x)) pending.push(x); }); });
        if (!pending.length || moT) return;
        moT = setTimeout(function () {
          moT = 0; if (!painted) { pending = []; return; }
          var q = pending.splice(0, pending.length), l = [];
          q.forEach(function (x) { if (!doc.contains(x)) return; l.push(x); var d = x.getElementsByTagName('*'); for (var j = 0; j < d.length && l.length < 20000; j++) l.push(d[j]); });
          paintBatch(l);
        }, 200);
      });
      mo.observe(doc.body, { childList: true, subtree: true });
    } catch (e) { }
  }

  // ------------------------------------------------------------------ studio state: one object, saved per site
  var FONTS = [
    { id: '', name: 'As built', fam: '' },
    { id: 'clean', name: 'Clean', fam: '"Inter",system-ui,sans-serif', g: 'Inter:wght@400;600;800' },
    { id: 'easy', name: 'Easy read', fam: '"Atkinson Hyperlegible",system-ui,sans-serif', g: 'Atkinson+Hyperlegible:wght@400;700' },
    { id: 'book', name: 'Book', fam: '"Source Serif 4",Georgia,serif', g: 'Source+Serif+4:opsz,wght@8..60,400;8..60,700' },
    { id: 'friendly', name: 'Friendly', fam: '"Nunito",system-ui,sans-serif', g: 'Nunito:wght@400;700;800' },
    { id: 'modern', name: 'Modern', fam: '"Space Grotesk",system-ui,sans-serif', g: 'Space+Grotesk:wght@400;600;700' },
    { id: 'code', name: 'Typewriter', fam: '"JetBrains Mono",ui-monospace,monospace', g: 'JetBrains+Mono:wght@400;700' }
  ];
  var SIZES = [90, 100, 112, 125, 140, 160];
  var BIGSTEPS = [100, 125, 140, 160];   // v1.9: the Bigger text button steps 100, 125, 140, 160, then back to 100
  var TOGGLES = [
    { id: 'comfort', c: 'cf', name: 'Roomy lines', hint: 'More space between lines and words' },
    { id: 'calm', c: 'ca', name: 'Calm motion', hint: 'Stops page animations' },
    { id: 'links', c: 'ln', name: 'Underline links', hint: 'Links are always underlined' },
    { id: 'focus', c: 'fo', name: 'Strong focus', hint: 'A bold ring shows where you are' },
    { id: 'contrast', c: 'ct', name: 'Extra contrast', hint: 'With a palette on, grey text turns full strength' }
  ];
  var st = { pal: '', font: '', size: 100, comfort: false, calm: false, links: false, focus: false, contrast: false, prevPal: '' };
  var shared = false;
  (function load() {
    var m = null; try { m = /[?&]hmrlook=([a-z0-9.~-]{1,200})/i.exec(location.search); } catch (e) { }
    if (m) { decodeLook(m[1]); shared = true; } else { var s = jget(KEY, null); if (s && typeof s === 'object') take(s); }
    clean();
  })();
  function take(s) { for (var k in st) if (Object.prototype.hasOwnProperty.call(s, k) && typeof s[k] === typeof st[k]) st[k] = s[k]; }
  function clean() { if (SIZES.indexOf(st.size) < 0) st.size = 100; if (typeof st.pal !== 'string' || !/^[a-z0-9-]{0,40}$/.test(st.pal)) st.pal = ''; if (typeof st.font !== 'string' || !/^[a-z0-9-]{0,40}$/.test(st.font)) st.font = ''; }
  function save() { clean(); if (!shared) { if (isDefault()) lsDel(KEY); else lsSet(KEY, JSON.stringify(st)); } renderAll(); }
  function isDefault() { return !st.pal && !st.font && st.size === 100 && !st.comfort && !st.calm && !st.links && !st.focus && !st.contrast; }
  function encodeLook() { var a = []; if (st.pal) a.push('p.' + st.pal); if (st.font) a.push('f.' + st.font); if (st.size !== 100) a.push('s.' + st.size); TOGGLES.forEach(function (t) { if (st[t.id]) a.push(t.c + '.1'); }); return a.join('~'); }
  function decodeLook(s) {
    String(s).split('~').forEach(function (x) {
      var k = x.split('.')[0], v = x.slice(k.length + 1);
      if (k === 'p') st.pal = v; else if (k === 'f') st.font = v; else if (k === 's' && SIZES.indexOf(+v) >= 0) st.size = +v;
      else TOGGLES.forEach(function (t) { if (t.c === k) st[t.id] = v === '1'; });
    });
  }

  var styles = {};
  function cssVar(name, text) {
    var s = styles[name]; if (!s) { s = styles[name] = el('style'); s.id = 'hmr-dash-' + name; s.setAttribute('data-hmr-ui', ''); }
    s.textContent = text || ''; if (!s.parentNode && doc.head) doc.head.appendChild(s);
  }
  var ZOOMOK = (function () { try { return !!(window.CSS && CSS.supports && CSS.supports('zoom', '1.25')); } catch (e) { return false; } })();
  var NOTUI = ':not([data-hmr-ui]):not([data-hmr-ui] *):not(.hmr-dock):not(.hmr-dock *):not([class^="hmr-"]):not([class^="hmr-"] *)';
  var fontLinks = {};
  function loadFont(f) {
    if (!f || !f.g || fontLinks[f.id]) return; var l = el('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=' + f.g + '&display=swap'; l.setAttribute('data-hmr-ui', ''); doc.head.appendChild(l); fontLinks[f.id] = l;
  }
  function apply() {
    var p = st.pal ? palById(st.pal) : null; if (st.pal && !p && SKIN_LOADING) { /* a skin palette: painted when the skin arrives */ } else if (st.pal && !p) st.pal = '';
    if (p) paint(p, st.contrast); else restoreColors();
    var f = null; FONTS.concat(SKIN.fonts || []).forEach(function (x) { if (x.id === st.font) f = x; }); if (f) loadFont(f);
    var z = st.size / 100, B = 'body>*' + NOTUI;
    cssVar('type', (f && f.fam ? 'body :is(p,li,h1,h2,h3,h4,h5,h6,a,span,button,label,td,th,blockquote,input,textarea,select,summary,dt,dd,figcaption,small,strong,em,b,i,div,section,article,header,footer,nav,main,aside)' + NOTUI + ':not([class*="icon"]):not([class*="fa-"]):not([class*="material"]):not([class*="symbol"]):not([class*="glyph"]):not(i:empty):not(code):not(pre):not(kbd){font-family:' + f.fam + '!important}' : '') +
      (z !== 1 ? (ZOOMOK ? B + '{zoom:' + z + '!important}' : 'html{font-size:' + (z * 100) + '%!important}body :is(p,li,dd,dt,blockquote,td,th,figcaption,label,a,span,small,h1,h2,h3,h4,h5,h6,button,summary)' + NOTUI + '{font-size:' + z + 'em!important}') : ''));
    cssVar('comfort',
      (st.comfort ? 'body :is(p,li,dd,blockquote,td,figcaption)' + NOTUI + '{line-height:1.75!important;letter-spacing:.012em!important;word-spacing:.05em!important}' : '') +
      (st.calm ? 'body *' + NOTUI + ',body *' + NOTUI + '::before,body *' + NOTUI + '::after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}html{scroll-behavior:auto!important}' : '') +
      (st.links ? 'body a' + NOTUI + '{text-decoration:underline!important;text-underline-offset:.18em!important;text-decoration-thickness:max(1px,.08em)!important}' : '') +
      (st.focus ? 'body :focus-visible' + NOTUI + '{outline:3px solid ' + (p ? p.accent : '#f59e0b') + '!important;outline-offset:3px!important;border-radius:4px}' : ''));
    root.toggleAttribute ? root.toggleAttribute('data-hmr-calm', !!st.calm) : null;
  }
  function renderAll() { apply(); UIS.forEach(function (f) { try { f(); } catch (e) { } }); }
  var UIS = [];

  // ------------------------------------------------------------------ skin manifest (shared design assets for the whole ecosystem)
  var SKIN = { palettes: [], fonts: [], media: [] }, SKIN_LOADING = true, skinCbs = [];
  function takeSkin(j) {
    if (!j || typeof j !== 'object') return;
    SKIN.version = j.version || '';
    SKIN.palettes = (Array.isArray(j.palettes) ? j.palettes : []).filter(function (p) { return validPalette(p) && !PALETTES.some(function (b) { return b.id === p.id; }); }).slice(0, 40).map(function (p) { var o = { id: p.id, name: String(p.name).slice(0, 30), mood: String(p.mood || '').slice(0, 80), dark: p.dark === true, fromSkin: true, grad: p.grad.map(function (g) { return String(g).toLowerCase(); }) }; ROLES.forEach(function (r) { o[r] = String(p[r]).toLowerCase(); }); return o; });
    SKIN.fonts = (Array.isArray(j.fonts) ? j.fonts : []).filter(function (f) { return f && /^[a-z0-9-]{2,30}$/.test(f.id) && /^[A-Za-z0-9+:;@.,]{2,120}$/.test(f.g || '') && typeof f.family === 'string' && /^[A-Za-z0-9 ]{2,60}$/.test(f.family) && /^(serif|sans-serif|monospace|cursive|system-ui)$/.test(f.fallback || 'sans-serif'); }).slice(0, 20).map(function (f) { return { id: 'k-' + f.id, name: String(f.name || f.family).slice(0, 24), fam: '"' + f.family + '",' + (f.fallback || 'sans-serif'), g: f.g }; });
    SKIN.media = (Array.isArray(j.media) ? j.media : []).filter(function (m) { return m && /^(video|image)$/.test(m.type) && /^https:\/\/[^\s"'<>]+$/.test(m.src || '') && (!m.poster || /^https:\/\/[^\s"'<>]+$/.test(m.poster)); }).slice(0, 24).map(function (m) { return { type: m.type, src: m.src, poster: m.poster || '', title: String(m.title || '').slice(0, 60), note: String(m.note || '').slice(0, 140) }; });
  }
  function loadSkin() {
    var c = null; try { c = JSON.parse(sessionStorage.getItem(SKIN_CACHE)); } catch (e) { }
    if (c && c.at && Date.now() - c.at < 3600e3) { takeSkin(c.j); skinDone(); return; }
    var done = false, to = setTimeout(function () { if (!done) { done = true; skinDone(); } }, 6000);
    try {
      fetch(SKIN_URL, { mode: 'cors', credentials: 'omit', cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (done) { takeSkin(j); renderAll(); return; } done = true; clearTimeout(to); takeSkin(j); try { sessionStorage.setItem(SKIN_CACHE, JSON.stringify({ at: Date.now(), j: j })); } catch (e) { } skinDone();
      }).catch(function () { if (!done) { done = true; clearTimeout(to); skinDone(); } });
    } catch (e) { done = true; clearTimeout(to); skinDone(); }
  }
  function skinDone() { SKIN_LOADING = false; if ((st.pal && !painted) || /^k-/.test(st.font)) apply(); UIS.forEach(function (f) { try { f(); } catch (e) { } }); skinCbs.splice(0).forEach(function (f) { try { f(SKIN); } catch (e) { } }); }

  // ------------------------------------------------------------------ UI
  var ICON = {
    share: '<path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>',
    top: '<path d="M6 11l6-6 6 6M12 5v14"/><path d="M5 3h14"/>',
    bigger: '<path d="M3 19l5-14 5 14M4.8 14h6.4"/><path d="M15 12h6M18 9v6"/>',
    night: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    studio: '<circle cx="13.5" cy="6.5" r="1.4"/><circle cx="17.5" cy="10.5" r="1.4"/><circle cx="8.5" cy="7.5" r="1.4"/><circle cx="6.5" cy="12.5" r="1.4"/><path d="M12 22a10 10 0 1 1 10-10c0 2.5-2 3.5-4 3.5h-2a2 2 0 0 0-1.5 3.3c.6.8.4 3.2-2.5 3.2z"/>',
    improve: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/><path d="M9 11h6M9 14.5h4"/>',
    funsies: '<path d="M12 2l2.4 5.6L20 8l-4.3 4 1.2 6L12 15l-4.9 3 1.2-6L4 8l5.6-.4z"/>',
    places: '<path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    show: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.5v5l4.5-2.5z"/>',
    back: '<path d="M15 5l-7 7 7 7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>', min: '<path d="M5 12h14"/>',
    speak: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    write: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    react: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14.5s1.3 2 3.5 2 3.5-2 3.5-2M9 9.5h.01M15 9.5h.01"/>',
    mark: '<path d="M4 20h4L20 8l-4-4L4 16z" opacity=".5"/><path d="M3 21h18"/>',
    plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M12 16v.01M12 13a2 2 0 1 0-2-2"/>',
    lost: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.3 2.4c-.5.2-.8.6-.8 1.1V14M12 17h.01"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h.01M15 15h.01M15 9h.01M9 15h.01M12 12h.01"/>',
    box: '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
    page: '<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7M9 7h3"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/>'
  };
  function svg(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICON[k] || '') + '</svg>'; }

  var CSS = [
    '[data-hmr-ui]{--d-bg:rgba(13,16,30,.94);--d-fg:#f4f5fb;--d-mut:#b9bdd3;--d-line:rgba(255,255,255,.13);--d-tile:rgba(255,255,255,.065);--d-tile2:rgba(255,255,255,.11);--d-acc:#f59e0b;--d-grad:linear-gradient(135deg,#e0307a,#f59e0b 50%,#06b6d4)}',
    '[data-hmr-ui][hidden],[data-hmr-ui] [hidden]{display:none!important}',
    '[data-hmr-ui],[data-hmr-ui] *{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;letter-spacing:0;text-transform:none;line-height:1.3}',
    '[data-hmr-ui] svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;display:block;flex:none}',
    '[data-hmr-ui] button{font:inherit;color:inherit;margin:0;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}',
    '[data-hmr-ui] button:focus-visible,[data-hmr-ui] a:focus-visible,[data-hmr-ui] input:focus-visible{outline:3px solid var(--d-acc);outline-offset:2px}',
    '.hmrd-veil{display:none!important}',
    '.hmrd{position:fixed;z-index:99994;left:0;right:0;bottom:0;max-height:min(86vh,720px);max-height:min(86dvh,calc(100dvh - 96px),720px);display:flex;flex-direction:column;background:var(--d-bg);color:var(--d-fg);border:1px solid var(--d-line);border-bottom:0;border-radius:24px 24px 0 0;box-shadow:0 -18px 60px rgba(0,0,0,.45);-webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4);padding:6px 14px calc(14px + env(safe-area-inset-bottom));transform:translateY(105%);transition:transform .28s cubic-bezier(.2,.8,.2,1);font-size:15px;text-align:left}',
    '.hmrd.on{transform:none}',
    '.hmrd-drag{cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}.hmrd.hmrd-moved{border-radius:24px;border-bottom:1px solid var(--d-line);transform:none!important;opacity:1!important}.hmrd.hmrd-moved .hmrd-grab{display:block}',
    '.hmrd-dhint{margin:0 0 6px;padding:6px 10px;border-radius:10px;background:rgba(245,158,11,.18);border:1px solid rgba(245,158,11,.55);color:var(--d-fg);font-size:13px}',
    '@media (min-width:720px){.hmrd{left:50%;right:auto;width:460px;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 70px);border-radius:24px;border-bottom:1px solid var(--d-line);transform:translate(-50%,24px);opacity:0;transition:transform .24s cubic-bezier(.2,.8,.2,1),opacity .2s}.hmrd.on{transform:translate(-50%,0);opacity:1}}',
    '.hmrd-grab{width:42px;height:5px;border-radius:9px;background:rgba(255,255,255,.28);margin:4px auto 6px}@media (min-width:720px){.hmrd-grab{display:none}}',
    '.hmrd-hd{display:flex;align-items:center;gap:8px;min-height:44px}',
    '.hmrd-hd h2{flex:1;min-width:0;max-width:none;margin:0;font-size:16px;font-weight:800;line-height:1.2;color:var(--d-fg);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
    '.hmrd-hd .crumb{font-weight:600;color:var(--d-mut)}',
    '.hmrd-login{flex:none;min-height:44px;padding:0 14px;border-radius:999px;border:1px solid var(--d-line);background:var(--d-tile);font-weight:800;font-size:13.5px;color:var(--d-fg)}.hmrd-login:hover{background:var(--d-tile2)}',
    '.hmrd-soon{display:inline-block;margin:4px 2px 10px;padding:4px 10px;border-radius:99px;background:rgba(245,158,11,.2);border:1px solid rgba(245,158,11,.55);color:#ffd28a;font-size:12px;font-weight:800;letter-spacing:.04em}',
    '.hmrd-confirm{padding:12px;border-radius:16px;border:1px solid rgba(239,68,68,.55);background:rgba(239,68,68,.12)}.hmrd-confirm p{margin:0 0 10px;font-size:14px;line-height:1.45;color:var(--d-fg)}.hmrd-confirm .row{display:flex;gap:8px;flex-wrap:wrap}',
    '.hmrd-pill.danger{background:#ef4444;border-color:#ef4444;color:#fff}',
    '.hmrd-ib{flex:none;width:44px;height:44px;border-radius:14px;border:1px solid var(--d-line);background:var(--d-tile);display:flex;align-items:center;justify-content:center;padding:0}.hmrd-ib:hover{background:var(--d-tile2)}',
    '.hmrd-logo{flex:none;width:38px;height:38px;border-radius:50%;background:conic-gradient(from 210deg,#e0307a,#f59e0b,#06b6d4,#8b5cf6,#e0307a);display:flex;align-items:center;justify-content:center;font-weight:900;font-size:10px;color:#fff!important;letter-spacing:0;text-decoration:none!important;text-shadow:0 1px 2px rgba(0,0,0,.6);box-shadow:0 0 0 2px rgba(255,255,255,.18);cursor:pointer}.hmrd-logo:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}',
    '.hmrd-trouble{display:block;margin:0 0 6px auto;min-height:36px!important;font-size:13px}',
    '.hmrd-help{margin-top:14px}.hmrd-faq{border:1px solid var(--d-line);border-radius:12px;padding:0 12px;margin:0 0 6px}.hmrd-faq summary{min-height:44px;display:flex;align-items:center;font-weight:700;cursor:pointer;color:var(--d-fg)}.hmrd-faq p{margin:0 0 10px;font-size:13.5px;line-height:1.45;color:var(--d-fg)}',
    '.hmrd-sure{font-size:16px!important;font-weight:900;color:#ef4444!important}',
    '.hmrd-foot{flex-wrap:wrap}.hmrd-foot>span:last-child{display:inline-flex;gap:6px}.hmrd-lk{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}.hmrd-our{min-height:36px!important;padding:0 12px!important;font-size:12.5px!important;font-weight:800}',
    '.hmrd-body{overflow:auto;overscroll-behavior:contain;padding:2px 2px 4px;margin:0 -2px}',
    '.hmrd-intro{position:relative;margin:4px 0 12px;padding:14px;border-radius:18px;background:linear-gradient(135deg,rgba(224,48,122,.22),rgba(245,158,11,.14) 50%,rgba(6,182,212,.18));border:1px solid var(--d-line)}',
    '.hmrd-intro h3{margin:0 0 6px;font-size:17px;font-weight:800;color:#fff}.hmrd-intro p{margin:0 0 10px;color:#e7e8f2;font-size:14.5px;line-height:1.45}',
    '.hmrd-intro .row{display:flex;gap:8px;flex-wrap:wrap}.hmrd-intro .why{margin:8px 0 0;font-size:12.5px;color:var(--d-mut);line-height:1.4}',
    '.hmrd-pill{min-height:44px;padding:0 14px;border-radius:999px;border:1px solid var(--d-line);background:rgba(255,255,255,.12);font-weight:700;font-size:14px}',
    '.hmrd-pill.pri{background:#fff;color:#111;border-color:#fff}',
    '.hmrd-sec{margin:10px 2px 6px;font-size:11.5px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--d-mut)}',
    '.hmrd-row{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}',
    '.hmrd-act{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;min-height:78px;padding:8px 4px;border-radius:18px;border:1px solid var(--d-line);background:var(--d-tile);font-size:12.5px;font-weight:700;text-align:center}',
    '.hmrd-act:hover{background:var(--d-tile2)}.hmrd-act[aria-pressed="true"]{background:rgba(245,158,11,.2);border-color:rgba(245,158,11,.6)}',
    '.hmrd-act .ic{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.09)}',
    '.hmrd-go{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}@media (min-width:520px){.hmrd-go{grid-template-columns:repeat(4,minmax(0,1fr))}}',
    '.hmrd-tile{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:8px;min-height:104px;padding:12px;border-radius:20px;border:1px solid var(--d-line);background:var(--d-tile);text-align:left;overflow:hidden}',
    '.hmrd-tile:hover{background:var(--d-tile2)}',
    '.hmrd-tile .ic{width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;color:#fff}',
    '.hmrd-tile b{font-size:15px;font-weight:800;color:var(--d-fg)}.hmrd-tile small{font-size:12px;color:var(--d-mut);line-height:1.35}',
    '.hmrd-tile .chev{position:absolute;right:12px;top:14px;opacity:.5}.hmrd-tile .chev svg{width:18px;height:18px}',
    '.hmrd-g1{background:linear-gradient(135deg,#8b5cf6,#e0307a)}.hmrd-g2{background:linear-gradient(135deg,#06b6d4,#3b82f6)}.hmrd-g3{background:linear-gradient(135deg,#e0307a,#f59e0b)}.hmrd-g4{background:linear-gradient(135deg,#10b981,#06b6d4)}.hmrd-g5{background:linear-gradient(135deg,#f59e0b,#ef4444)}',
    '.hmrd-foot{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:12px 2px 0;font-size:12.5px;color:var(--d-mut)}',
    '.hmrd-link{background:none;border:0;padding:8px 4px;color:var(--d-fg);font-weight:700;text-decoration:underline;text-underline-offset:3px;font-size:13px;min-height:44px}',
    '.hmrd-list{display:flex;flex-direction:column;gap:8px}',
    '.hmrd-item{display:flex;align-items:center;gap:12px;width:100%;min-height:60px;padding:10px 12px;border-radius:16px;border:1px solid var(--d-line);background:var(--d-tile);text-align:left;text-decoration:none;color:var(--d-fg)}',
    '.hmrd-item:hover{background:var(--d-tile2)}.hmrd-item .ic{width:38px;height:38px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.09);flex:none}',
    '.hmrd-item b{display:block;font-size:14.5px;font-weight:800}.hmrd-item small{display:block;font-size:12.5px;color:var(--d-mut);margin-top:2px}.hmrd-item .tx{flex:1;min-width:0}',
    '.hmrd-item .here{flex:none;font-size:11px;font-weight:800;padding:3px 8px;border-radius:99px;background:rgba(255,255,255,.14)}',
    '.hmrd-chips{display:flex;flex-wrap:wrap;gap:8px}.hmrd-chip{min-height:44px;padding:0 14px;border-radius:999px;border:1px solid var(--d-line);background:var(--d-tile);font-weight:700;font-size:13.5px}.hmrd-chip:hover{background:var(--d-tile2)}',
    '.hmrd-p{margin:0 2px 10px;color:var(--d-mut);font-size:13.5px;line-height:1.45}',
    '.hmrd-sw{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:52px;padding:8px 12px;border-radius:14px;border:1px solid var(--d-line);background:var(--d-tile)}',
    '.hmrd-sw input{width:46px;height:28px;accent-color:#f59e0b;flex:none}',
    // studio: the dashboard shrinks to a bar at the bottom of the screen
    'html.hmr-studio-on .hmr-dock{visibility:hidden}',
    '.hmrs{position:fixed;z-index:99994;left:0;right:0;bottom:0;background:var(--d-bg);color:var(--d-fg);border-top:1px solid var(--d-line);border-radius:18px 18px 0 0;box-shadow:0 -12px 40px rgba(0,0,0,.4);-webkit-backdrop-filter:blur(18px) saturate(1.4);backdrop-filter:blur(18px) saturate(1.4);padding:4px 10px calc(8px + env(safe-area-inset-bottom));transform:translateY(105%);transition:transform .26s cubic-bezier(.2,.8,.2,1);font-size:14px}',
    '.hmrs.on{transform:none}@media (min-width:760px){.hmrs{left:50%;right:auto;width:720px;margin-left:-360px;bottom:10px;border-radius:20px;border:1px solid var(--d-line)}}',
    '.hmrs-hd{display:flex;align-items:center;gap:6px;min-height:46px}',
    '.hmrs-hd h2{flex:1;min-width:0;max-width:none;margin:0;font-size:15px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--d-fg)}',
    '.hmrs-hd .hmrd-ib{width:44px;height:44px;border-radius:12px}',
    '.hmrs-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px 0 6px}.hmrs-tabs::-webkit-scrollbar{display:none}',
    '.hmrs-tab{flex:none;min-height:44px;padding:0 14px;border-radius:999px;border:1px solid var(--d-line);background:transparent;font-weight:700;font-size:13.5px;color:var(--d-mut)}',
    '.hmrs-tab[aria-selected="true"]{background:#fff;color:#111;border-color:#fff}',
    '.hmrs-pane{max-height:min(34vh,300px);overflow:auto;overscroll-behavior:contain;padding:2px 0 2px}',
    '.hmrs-pane[hidden]{display:none}',
    '.hmrs-scroll{display:flex;gap:8px;overflow-x:auto;scroll-snap-type:x proximity;padding:2px 2px 8px;scrollbar-width:thin}',
    '.hmrs-pal{flex:none;scroll-snap-align:start;width:118px;padding:6px;border-radius:14px;border:2px solid transparent;background:var(--d-tile);text-align:left}',
    '.hmrs-pal[aria-pressed="true"]{border-color:#fff;background:var(--d-tile2)}',
    '.hmrs-pal .sw{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;height:46px;border-radius:9px;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.12)}',
    '.hmrs-pal .sw i{display:flex;align-items:flex-end;padding:4px 5px;font-style:normal;font-size:12px;font-weight:800}',
    '.hmrs-pal b{display:block;margin:6px 2px 0;font-size:12.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.hmrs-pal small{display:block;margin:1px 2px 0;font-size:11px;color:var(--d-mut);line-height:1.25;height:2.5em;overflow:hidden}',
    '.hmrs-orig .sw{background:repeating-linear-gradient(135deg,rgba(255,255,255,.08) 0 6px,transparent 6px 12px);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800}',
    '.hmrs-grp{margin:2px 2px 8px}.hmrs-grp>span{display:block;margin:0 0 6px;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;color:var(--d-mut)}',
    '.hmrs-seg{display:flex;flex-wrap:wrap;gap:6px}.hmrs-seg button{min-height:44px;padding:0 13px;border-radius:12px;border:1px solid var(--d-line);background:var(--d-tile);font-weight:700;font-size:13.5px}',
    '.hmrs-seg button[aria-pressed="true"]{background:#fff;color:#111;border-color:#fff}',
    '.hmrs-tg{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}',
    '.hmrs-tg button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-height:54px;padding:8px 10px;border-radius:12px;border:1px solid var(--d-line);background:var(--d-tile);text-align:left}',
    '.hmrs-tg button b{font-size:13.5px;font-weight:800}.hmrs-tg button small{font-size:11.5px;color:var(--d-mut)}',
    '.hmrs-tg button[aria-pressed="true"]{background:rgba(245,158,11,.22);border-color:#f59e0b}',
    '.hmrs-note{margin:0 2px 8px;font-size:12.5px;color:var(--d-mut);line-height:1.4}',
    '.hmrs-dx{background:#fff;color:#111;border-radius:14px;padding:8px}.hmrs-dx .hmr-dx{font-size:13px}.hmrs-dx *{font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}',
    '.hmrd-toast{position:fixed;z-index:99998;left:50%;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 76px);transform:translateX(-50%);display:flex;align-items:center;gap:10px;max-width:calc(100vw - 24px);padding:10px 12px 10px 16px;border-radius:14px;background:#111;color:#fff;border:1px solid rgba(255,255,255,.2);box-shadow:0 10px 30px rgba(0,0,0,.45);font-size:14px;font-weight:600}',
    '.hmrd-toast button{min-height:44px;padding:0 12px;border-radius:999px;border:0;background:#fff;color:#111;font-weight:800;font-size:13px;flex:none}',
    '.hmrd-media{display:grid;gap:10px}.hmrd-media figure{margin:0;border-radius:16px;overflow:hidden;border:1px solid var(--d-line);background:#000}.hmrd-media video,.hmrd-media img{display:block;width:100%;height:auto;max-height:46vh;object-fit:contain;background:#000}.hmrd-media figcaption{padding:8px 10px;background:var(--d-bg);font-size:13px}',
    '.hmrd-about{display:grid;gap:10px;margin:4px 0 14px}.hmrd-f{display:grid;gap:6px;margin:0;padding:0;border:0;color:var(--d-fg);font-size:14px;font-weight:700}.hmrd-f legend{padding:0;margin-bottom:6px}',
    '.hmrd-f input[type=text],.hmrd-f input[type=number],.hmrd-f input[type=email],.hmrd-f input[type=password]{min-height:44px;padding:0 12px;border-radius:12px;border:1px solid var(--d-line);background:var(--d-tile);color:var(--d-fg);font:inherit;font-weight:500}',
    '.hmrd-opts{display:flex;flex-wrap:wrap;gap:8px}.hmrd-opts label{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 12px;border-radius:999px;border:1px solid var(--d-line);background:var(--d-tile);font-weight:600;cursor:pointer}',
    '.hmrd-err:empty{display:none}.hmrd-err{color:#ffb4b4}',
    '.hmrd-acct{margin:0 0 18px;padding:14px;border-radius:16px;border:1px solid var(--d-line);background:var(--d-tile)}.hmrd-acct .hmrd-about{margin-bottom:6px}.hmrd-msg:empty{display:none}.hmrd-msg{margin:0;font-size:14px;color:var(--d-fg)}',
    '.hmrd-link{justify-self:start;min-height:44px;padding:0 4px;border:0;background:none;color:var(--d-fg);font:inherit;font-size:14px;font-weight:700;text-decoration:underline;text-underline-offset:3px}.hmrd-sub{margin:4px 0 6px;font-size:16px;font-weight:800;color:var(--d-fg)}',
    '.hmrd-seg{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:0 0 12px;padding:4px;border-radius:999px;background:var(--d-line)}.hmrd-segb{min-height:44px;padding:0 10px;border:0;border-radius:999px;background:transparent;color:var(--d-fg);font:inherit;font-size:14px;font-weight:800;cursor:pointer}.hmrd-segb.on{background:var(--d-acc);color:#111;box-shadow:0 2px 8px rgba(0,0,0,.18)}.hmrd-segb:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}' +
    '.hmrd-save{justify-self:start;min-height:44px;padding:0 18px;border-radius:999px;border:0;background:var(--d-acc);color:#111;font-weight:800;font-size:14px}',
    '.hmrd-egg{margin:6px 0 14px}.hmrd-eggbtn{display:block;width:100%;min-height:52px;padding:12px 14px;border-radius:16px;border:0;background:var(--d-grad);color:#fff;font-weight:800;font-size:14px;line-height:1.35;text-align:center;text-decoration:none}',
    '.hmrd-inv{padding:14px;border-radius:16px;border:1px solid var(--d-line);background:var(--d-tile)}.hmrd-inv .hmrd-p{color:var(--d-fg)}.hmrd-enter{margin-top:6px}',
    '@media (prefers-reduced-motion:reduce){.hmrd,.hmrs,.hmrd-veil{transition:none}}',
    '@media (max-width:360px){.hmrd-act{font-size:11.5px;min-height:72px}.hmrd-act .ic{width:36px;height:36px}.hmrd-tile{min-height:96px;padding:10px}}'
  ].join('');

  var dash = null, studio = null, veil = null, lastFocus = null, view = 'home', toastEl = null, toastT = 0;
  function ui(node) { node.setAttribute('data-hmr-ui', ''); return node; }
  function toast(msg, action, fn, ms) {
    if (toastEl) toastEl.remove(); clearTimeout(toastT);
    toastEl = ui(el('div', 'hmrd-toast')); toastEl.setAttribute('role', 'status'); toastEl.appendChild(el('span', '', msg));
    if (action) { var b = btn('', action); b.addEventListener('click', function () { if (toastEl) toastEl.remove(); fn(); }); toastEl.appendChild(b); }
    if (studio && !studio.hidden) toastEl.style.bottom = 'calc(' + (innerHeight - studio.offsetTop + 10) + 'px)';
    doc.body.appendChild(toastEl); toastT = setTimeout(function () { if (toastEl) toastEl.remove(); toastEl = null; }, ms || 3500);
  }
  function copyText(t) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return legacy(); }); } catch (e) { }
    return Promise.resolve(legacy());
    function legacy() { try { var a = el('textarea'); a.value = t; a.setAttribute('readonly', ''); a.style.cssText = 'position:fixed;left:-9999px'; doc.body.appendChild(a); a.select(); var ok = doc.execCommand('copy'); a.remove(); return ok; } catch (e) { return false; } }
  }

  function build() {
    if (dash) return;
    cssVar('ui', CSS);
    veil = ui(el('div', 'hmrd-veil')); veil.hidden = true; veil.addEventListener('click', function () { close(true); });
    dash = ui(el('section', 'hmrd')); dash.id = 'hmr-dash'; dash.setAttribute('role', 'dialog'); dash.setAttribute('aria-modal', 'false');   // v1.9: the page behind stays usable; only the ELV8 button, X, Escape or a swipe down close it
    dash.setAttribute('aria-labelledby', 'hmrd-title'); dash.hidden = true;
    dash.appendChild(el('div', 'hmrd-grab'));
    var hd = el('div', 'hmrd-hd');
    var bk = btn('hmrd-ib hmrd-bk', '', 'Back to the dashboard'); bk.innerHTML = svg('back');
    var logo = el('a', 'hmrd-logo', 'ELV8'); logo.href = 'https://elevat.ing/'; logo.target = '_blank'; logo.rel = 'noopener'; logo.setAttribute('aria-label', 'ELV8: open elevat.ing, the home of the elevat.ing family of websites'); logo.title = 'elevat.ing family of websites';
    var h = el('h2'); h.id = 'hmrd-title';
    var x = btn('hmrd-ib', '', 'Close the dashboard'); x.innerHTML = svg('x'); x.addEventListener('click', function () { close(true); });
    var li = btn('hmrd-login', 'Log in', 'Log in or create your ' + ACCT); li.addEventListener('click', function () { show('login'); });
    bk.addEventListener('click', function () { show('home'); });
    hd.appendChild(bk); hd.appendChild(logo); hd.appendChild(h); hd.appendChild(li); hd.appendChild(x); dash.appendChild(hd);
    var body = el('div', 'hmrd-body'); dash.appendChild(body);
    dash._h = h; dash._li = li; dash._bk = bk; dash._logo = logo; dash._body = body;
    dash.addEventListener('keydown', trap);
    // swipe the grab bar down to close on phones
    var y0 = null; dash.addEventListener('touchstart', function (e) { if (body.scrollTop <= 0 && e.touches.length === 1) y0 = e.touches[0].clientY; else y0 = null; }, { passive: true });
    dash.addEventListener('touchend', function (e) { if (y0 != null && e.changedTouches[0].clientY - y0 > 90) close(true); y0 = null; }, { passive: true });
    // v1.5: drag the dashboard anywhere by its top bar (mouse or finger); the spot is kept for this page view
    (function () {
      var g = null, grab = dash.querySelector('.hmrd-grab');
      [hd, grab].forEach(function (hnd) {
        if (!hnd) return; hnd.classList.add('hmrd-drag'); hnd.title = 'Drag to move';
        hnd.addEventListener('pointerdown', function (e) {
          if (e.button > 0 || (e.target.closest && e.target.closest('button,a'))) return;
          var r = dash.getBoundingClientRect(); g = { x: e.clientX, y: e.clientY, l: r.left, t: r.top, w: r.width, on: false, id: e.pointerId, h: hnd };
        });
        hnd.addEventListener('pointermove', function (e) {
          if (!g || e.pointerId !== g.id) return;
          var dx = e.clientX - g.x, dy = e.clientY - g.y;
          if (!g.on) { if (Math.abs(dx) + Math.abs(dy) < 6) return; g.on = true; y0 = null; try { hnd.setPointerCapture(e.pointerId); } catch (er) { } dash.classList.add('hmrd-moved'); lsSet(DRAG_KEY, '1'); var t0 = dash.querySelector('.hmrd-dhint'); if (t0) t0.parentNode.removeChild(t0); }
          var W = window.innerWidth, H = window.innerHeight, w = Math.min(g.w, W - 8);
          var l = Math.max(4, Math.min(W - w - 4, g.l + dx)), t = Math.max(4, Math.min(H - 60, g.t + dy));
          var cs = dash.style; cs.left = l + 'px'; cs.top = t + 'px'; cs.width = w + 'px'; cs.right = 'auto'; cs.bottom = 'auto';
          cs.maxHeight = Math.max(160, H - t - 8) + 'px'; e.preventDefault();
        });
        function end(e) { if (g && g.on) { try { hnd.releasePointerCapture(e.pointerId); } catch (er) { } } g = null; }
        hnd.addEventListener('pointerup', end); hnd.addEventListener('pointercancel', end);
      });
    })();
    doc.body.appendChild(veil); doc.body.appendChild(dash);
    doc.addEventListener('keydown', function (e) { if (e.key !== 'Escape') return; if (dash && !dash.hidden) { close(true); e.stopPropagation(); } else if (studio && !studio.hidden) { closeStudio(true); e.stopPropagation(); } }, true);
  }
  function trap(e) {
    if (e.key !== 'Tab') return;
    var f = [].filter.call(dash.querySelectorAll('button,a[href],input,select,textarea,video[controls]'), function (b) { return !b.disabled && b.offsetParent !== null; }); if (!f.length) return;
    var i = f.indexOf(doc.activeElement);
    if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault(); }
  }
  var TITLES = { home: 'Your elevating family experience dashboard', improve: 'Improve this site', funsies: 'Funsies', places: 'Places', settings: 'Your settings', showcase: 'New from our studio', login: 'Log in' };
  function show(v) {
    var VIEWS = { home: home, improve: improve, funsies: funsies, places: places, settings: settings, showcase: showcase, login: login };
    if (!VIEWS[v] || (v === 'showcase' && !SKIN.media.length)) v = 'home';
    view = v; var b = dash._body; b.textContent = ''; b.scrollTop = 0;
    dash._bk.hidden = v === 'home'; dash._logo.hidden = v !== 'home'; dash._li.hidden = v === 'login';
    dash._h.textContent = ''; if (v === 'home') dash._h.textContent = TITLES.home; else { dash._h.appendChild(el('span', 'crumb', 'Dash › ')); dash._h.appendChild(doc.createTextNode(TITLES[v] || '')); }
    VIEWS[v](b);
    if (v !== 'home') { try { dash._bk.focus({ preventScroll: true }); } catch (e) { } }
  }
  function sec(b, t) { b.appendChild(el('div', 'hmrd-sec', t)); }
  function act(k, label, fn, pressed) {
    var a = btn('hmrd-act'); a.setAttribute('data-k', k); var ic = el('span', 'ic'); ic.innerHTML = svg(k); a.appendChild(ic); a.appendChild(el('span', '', label));
    if (pressed != null) a.setAttribute('aria-pressed', pressed ? 'true' : 'false'); a.addEventListener('click', fn); return a;
  }
  function tile(k, g, label, hint, fn) {
    var t = btn('hmrd-tile'); var ic = el('span', 'ic ' + g); ic.innerHTML = svg(k); t.appendChild(ic);
    var w = el('span'); w.appendChild(el('b', '', label)); t.appendChild(w); t.appendChild(el('small', '', hint));
    var ch = el('span', 'chev'); ch.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>'; t.appendChild(ch);
    t.addEventListener('click', fn); return t;
  }
  function item(k, label, hint, fn, href) {
    var a = href ? el('a', 'hmrd-item') : btn('hmrd-item'); if (href) a.href = href;
    var ic = el('span', 'ic'); ic.innerHTML = svg(k); a.appendChild(ic);
    var tx = el('span', 'tx'); tx.appendChild(el('b', '', label)); if (hint) tx.appendChild(el('small', '', hint)); a.appendChild(tx);
    if (fn) a.addEventListener('click', fn); return a;
  }
  function then(fn, back) { return function () { close(!!back); setTimeout(fn, 60); }; }
  function refocus(k) { var b = dash && dash.querySelector(k ? '[data-k="' + k + '"]' : '.hmrd-act'); try { if (b) b.focus({ preventScroll: true }); } catch (e) { } }

  function home(b) {
    // v1.9 (Leo, Nov 25): "I'm having trouble" at the top jumps to a short help list at the bottom
    var tr = btn('hmrd-link hmrd-trouble', 'I\'m having trouble'); tr.addEventListener('click', function () { var h = b.querySelector('.hmrd-help'); if (h) { try { h.scrollIntoView({ behavior: rm() ? 'auto' : 'smooth', block: 'start' }); } catch (e) { h.scrollIntoView(); } var f = h.querySelector('button,a'); try { if (f) f.focus({ preventScroll: true }); } catch (e) { } } });
    b.appendChild(tr);
    if (lsGet(INTRO_KEY) !== '1' && !introHidden) {
      var it = el('div', 'hmrd-intro'); it.appendChild(el('h3', '', C('introTitle', 'Your elevating family experience dashboard')));
      it.appendChild(el('p', '', C('introBody', 'The elevat.ing family is a group of free, ad-free websites that share this bottom bar. This dashboard lets you shape how this site looks for you, tell us what you think, play a little, and find the other sites in the family.')));
      // v1.9 (Leo, Nov 26): only "Don't show this again" (no "Got it")
      var r = el('div', 'row'), no = btn('hmrd-pill pri', C('dontShowLabel', 'Don\'t show this again'));
      no.addEventListener('click', function () { lsSet(INTRO_KEY, '1'); it.remove(); refocus(); toast('Done. You can bring the intro back in Your settings.'); });
      r.appendChild(no); it.appendChild(r);
      it.appendChild(el('p', 'why', C('dontShowExplain', 'Don\'t show this again means the dashboard opens straight to its buttons next time. It is saved only in this browser, on this site, and you can bring the intro back in Your settings.')));
      b.appendChild(it);
    }
    var r1 = el('div', 'hmrd-row');
    r1.appendChild(act('share', T('share', 'label') || 'Share', sharePage));
    r1.appendChild(act('top', T('top', 'label') || 'Top', then(goTop, true)));
    r1.appendChild(act('bigger', (st.size > 100 ? 'Text ' + st.size + '%' : (T('bigger', 'label') || 'Bigger text')), function () { var i = BIGSTEPS.indexOf(st.size); st.size = BIGSTEPS[(i + 1) % BIGSTEPS.length]; save(); show('home'); refocus('bigger'); toast('Text size ' + st.size + '%. Tap again for bigger, or set it in the studio.'); }, st.size > 100));
    var np = nightPal(), on = !!(st.pal && palById(st.pal) && palById(st.pal).dark);
    r1.appendChild(act('night', on ? 'Day' : (T('night', 'label') || 'Night'), function () { if (on) { st.pal = st.prevPal && palById(st.prevPal) && !palById(st.prevPal).dark ? st.prevPal : ''; } else { st.prevPal = st.pal; st.pal = np ? np.id : ''; } save(); show('home'); refocus('night'); }, on));
    b.appendChild(r1);
    sec(b, 'Go deeper');
    var r2 = el('div', 'hmrd-go');
    r2.appendChild(tile('studio', 'hmrd-g1', T('studio', 'label') || 'UI/UX studio', T('studio', 'hint') || 'Colors, type, comfort and layouts', function () { openStudio('colors'); }));
    r2.appendChild(tile('improve', 'hmrd-g2', T('improve', 'label') || 'Improve this site', T('improve', 'hint') || 'Tell us what works and what does not', function () { show('improve'); }));
    r2.appendChild(tile('funsies', 'hmrd-g3', T('funsies', 'label') || 'Funsies', T('funsies', 'hint') || 'Toys and things to play with', function () { show('funsies'); }));
    r2.appendChild(tile('places', 'hmrd-g4', T('places', 'label') || 'Places', T('places', 'hint') || 'This page and our other sites', function () { show('places'); }));
    if (SKIN.media.length) r2.appendChild(tile('show', 'hmrd-g5', 'New from our studio', SKIN.media.length + (SKIN.media.length === 1 ? ' new piece' : ' new pieces') + ' to watch', function () { show('showcase'); }));
    b.appendChild(r2);
    // v1.9: "Your settings" is a clear button (not underlined text), and Reset is a red button that asks "Are you sure?" first
    var ft = el('div', 'hmrd-foot'); var sb = btn('hmrd-pill hmrd-our', T('settings', 'label') || 'Your settings'); sb.addEventListener('click', function () { show('settings'); });
    var rb = btn('hmrd-pill danger hmrd-our', 'Reset'); rb.setAttribute('aria-label', 'Reset everything saved on this site'); rb.addEventListener('click', function () { show('settings'); askReset(); });
    // v1.9 (Leo, Nov 26): a visitor's look changes only their own view. "Your look is on" sits next to a "Switch to our look" button (the site as built).
    var fl = el('span', 'hmrd-lk');
    if (isDefault()) fl.appendChild(doc.createTextNode('You are seeing our look'));
    else { fl.appendChild(doc.createTextNode('Your look is on ')); var ol = btn('hmrd-pill hmrd-our', 'Switch to our look'); ol.addEventListener('click', function () { resetLook(); show('home'); toast('Switched to our look. Your changes only ever showed for you.'); refocus(); }); fl.appendChild(ol); }
    ft.appendChild(fl); var fr = el('span'); fr.appendChild(rb); fr.appendChild(sb); ft.appendChild(fr); b.appendChild(ft);
    var hp = el('div', 'hmrd-help'); hp.appendChild(el('div', 'hmrd-sec', 'If something is not working'));
    var D = dock(), hl = el('div', 'hmrd-list');
    [['The microphone does nothing', 'When the mic is on, the box says Recording and your words appear as you talk. No words means it did not start: allow the microphone for this site in your browser settings, then press the mic again. Your keyboard\'s mic button works too.'],
     ['My note did not send', 'If sending fails, we open your own email app with your note in it, so nothing is lost. Your words also stay in the box on this device.'],
     ['The site looks strange after I changed it', 'Press Switch to our look at the bottom of this dashboard. Your changes only ever showed for you.'],
     ['The text is too small', 'Press Bigger text above. Each press makes the page text bigger, up to 160%, then back to normal.']
    ].forEach(function (q) { var d = el('details', 'hmrd-faq'); d.appendChild(el('summary', '', q[0])); d.appendChild(el('p', '', q[1])); hl.appendChild(d); });
    if (D.openFeedback) hl.appendChild(item('help', 'Something else is broken', 'Tell us what happened. Talk or type.', then(function () { D.openFeedback({ prefill: 'Something is not working: ' }); })));
    hp.appendChild(hl); b.appendChild(hp);
  }
  var introHidden = false;
  function nightPal() { var a = allPalettes(), n = palById('candle-hour'); if (n) return n; a.forEach(function (p) { if (!n && p.dark && /night|ember|hearth|candle|low/.test(p.id + ' ' + (p.mood || '').toLowerCase())) n = p; }); if (!n) a.forEach(function (p) { if (!n && p.dark) n = p; }); return n; }
  function sharePage() {
    var u = location.href.split('#')[0], t = doc.title || host();
    if (navigator.share) { navigator.share({ title: t, url: u }).catch(function () { }); return; }
    copyText(u).then(function (ok) { toast(ok ? 'Link copied. Send it to anyone.' : 'The address is ' + u, null, null, 5000); });
  }
  function goTop() {
    var y = scrollY; if (y < 40) { toast('You are already at the top.'); return; }
    try { scrollTo({ top: 0, behavior: rm() ? 'auto' : 'smooth' }); } catch (e) { scrollTo(0, 0); }
    toast('Jumped to the top.', 'Go back', function () { try { scrollTo({ top: y, behavior: rm() ? 'auto' : 'smooth' }); } catch (e) { scrollTo(0, y); } setTimeout(function () { open('home'); }, rm() ? 0 : 350); }, 7000);   // v1.9: Go back also reopens the dashboard, where you were
  }
  function improve(b) {
    b.appendChild(el('p', 'hmrd-p', 'Every note reaches the people who build this site. Send it with your email or anonymously, your choice. We especially want people to help us progress, whether that\'s telling us we\'re wrong or anything else. We\'re open to whatever that means.'));
    var l = el('div', 'hmrd-list'), D = dock();
    if (D.openSpeak) l.appendChild(item('speak', 'Speak to us', 'Say anything out loud. We turn it into text.', then(function () { D.openSpeak(true); })));
    if (D.openFeedback) l.appendChild(item('write', 'Write feedback', 'Type a note about this page', then(function () { D.openFeedback(); })));
    if (D.openReact) l.appendChild(item('react', 'React to a spot', 'Point at any part of the page and react', then(function () { D.openReact(); })));
    l.appendChild(item('studio', 'Rate a design', 'Shuffle new designs for this page and rate them', function () { openStudio('layouts'); }));
    l.appendChild(item('mark', 'Highlight text', 'Select any words on the page to share, email or send them to us', then(function () { toast(TOUCHY ? 'Try it now by highlighting some text on the page and then tapping the highlighted text.' : 'Try it now by highlighting this text and then hovering over the highlighted text.', null, null, 7000); }, true)));
    if (D.openFeedback) l.appendChild(item('plus', 'Request a button', 'Want a button or option that is not here? Tell us, by talking or typing', then(function () { D.openFeedback({ prefill: 'Button request: ' }); })));
    if (D.openLost) l.appendChild(item('lost', 'I\'m lost', 'Tell us where you got stuck', then(function () { D.openLost(); })));
    b.appendChild(l);
  }
  function funsies(b) {
    var D = dock(), l = el('div', 'hmrd-list');
    if (D.openFunsies) l.appendChild(item('box', 'Open the toy box', 'Play toys, wreck the page, and more', then(function () { D.openFunsies(); })));
    b.appendChild(l);
    var names = (D.effects || []).slice(0, 16);
    if (names.length && D.funsies) {
      sec(b, 'Play one now'); var ch = el('div', 'hmrd-chips');
      names.forEach(function (n) { var c = btn('hmrd-chip', n); c.addEventListener('click', then(function () { D.funsies(n); })); ch.appendChild(c); });
      b.appendChild(ch);
    }
    sec(b, 'More places to play'); var l2 = el('div', 'hmrd-list'); l2.appendChild(item('places', 'Places', 'Jump around this page or visit the other ' + FAM + ' sites', function () { show('places'); })); b.appendChild(l2);
  }
  // v1.9 (Leo, Nov 26): the list is the elevat.ing family of websites. HMR sites and universemodel.ai are left out of it for now; on the HMR sites
  //   themselves the HMR sites are listed after the others.
  var SITES = [
    { h: 'elevat.ing', n: 'elevat.ing', d: 'The home of the elevat.ing family of websites' },
    { h: 'claudebomb.com', n: 'claudebomb.com', d: 'Set up your free personal AI dashboard' },
    { h: 'endgame.life', n: 'endgame.life', d: 'A look at life in 2036' },
    { h: 'reactionapp.life', n: 'reactionapp.life', d: 'Watch anything, keep your best reactions' },
    { h: 'funsies.fun', n: 'funsies.fun', d: 'Games, toys, and a page you can wreck' },
    { h: 'ilovedogs.dog', n: 'ilovedogs.dog', d: 'Collars that say whether a dog is friendly' }
  ];
  if (HMRHOST) SITES = SITES.concat([
    { h: 'universemodel.ai', n: 'universemodel.ai', d: 'The Holistic Model of Reality' },
    { h: 'hmrfamily.life', n: 'hmrfamily.life', d: 'The HMR family' },
    { h: 'hmrfascia.life', n: 'hmrfascia.life', d: 'Connective tissue (often called fascia)' },
    { h: 'chronomath.ai', n: 'chronomath.ai', d: 'The math and mechanics of universal intelligence' }
  ]);
  function places(b) {
    var hs = [].filter.call(doc.querySelectorAll('main h2, article h2, body h2, body h1'), function (h) { return !(h.closest && h.closest('[data-hmr-ui],.hmr-dock,[class^="hmr-"]')) && h.offsetParent !== null && (h.textContent || '').trim().length > 1; });
    if (hs.length < 3) hs = [].filter.call(doc.querySelectorAll('h1,h2,h3'), function (h) { return !(h.closest && h.closest('[data-hmr-ui],.hmr-dock,[class^="hmr-"]')) && h.offsetParent !== null && (h.textContent || '').trim().length > 1; });
    var seen = {}; hs = hs.filter(function (h) { var t = h.textContent.replace(/\s+/g, ' ').trim(); if (seen[t]) return false; seen[t] = 1; return true; }).slice(0, 24);
    if (hs.length) {
      sec(b, 'On this page'); var l = el('div', 'hmrd-list');
      hs.forEach(function (h) { l.appendChild(item('page', h.textContent.replace(/\s+/g, ' ').trim().slice(0, 70), '', then(function () { try { h.scrollIntoView({ behavior: rm() ? 'auto' : 'smooth', block: 'start' }); } catch (e) { h.scrollIntoView(); } }))); });
      b.appendChild(l);
    }
    sec(b, 'elevat.ing family of websites'); var l2 = el('div', 'hmrd-list');
    SITES.forEach(function (s) { var a = item('globe', s.n, s.d, null, 'https://' + s.h + '/'); if (host() === s.h) { var hr = el('span', 'here', 'You\'re here'); a.appendChild(hr); a.setAttribute('aria-current', 'page'); } l2.appendChild(a); });
    b.appendChild(l2);
  }
  function settings(b) {
    var l = el('div', 'hmrd-list');
    var sw = el('label', 'hmrd-sw'); var cb = el('input'); cb.type = 'checkbox'; cb.checked = lsGet(INTRO_KEY) !== '1';
    var tx = el('span'); tx.appendChild(el('b', '', 'Show the intro')); tx.appendChild(el('small', '', 'The short welcome at the top of the dashboard')); tx.querySelector('small').style.cssText = 'display:block;color:var(--d-mut);font-size:12.5px';
    sw.appendChild(tx); sw.appendChild(cb); cb.addEventListener('change', function () { if (cb.checked) { lsDel(INTRO_KEY); introHidden = false; } else lsSet(INTRO_KEY, '1'); });
    l.appendChild(sw);
    l.appendChild(item('studio', 'Open the studio', 'Colors, type, comfort, layouts', function () { openStudio('colors'); }));
    l.appendChild(item('x', 'Switch to our look', isDefault() ? 'You are seeing our look, the site as built' : 'Go back to the site as built (only you saw your look)', function () { resetLook(); show('settings'); try { dash._bk.focus({ preventScroll: true }); } catch (e) { } }));
    var ra = item('x', 'Reset everything on this site', 'Clear every choice saved here and start fresh', function () { askReset(); }); ra.setAttribute('data-k', 'reset-all'); l.appendChild(ra);
    var cf = el('div', 'hmrd-confirm'); cf.hidden = true; cf.id = 'hmrd-reset-confirm'; l.appendChild(cf);
    b.appendChild(l);
    b.appendChild(el('p', 'hmrd-p', 'Everything you choose here stays in this browser, on this site. We only hear from you when you choose to send us something. Fonts you pick load from Google Fonts.'));
    b.appendChild(el('p', 'hmrd-p', 'Dashboard v' + VERSION.toFixed(1) + (SKIN.version ? ', studio kit ' + SKIN.version : '')));
  }
  function showcase(b) {
    var w = el('div', 'hmrd-media');
    SKIN.media.forEach(function (m) {
      var f = el('figure');
      if (m.type === 'video') { var v = el('video'); v.controls = true; v.playsInline = true; v.preload = 'none'; v.src = m.src; if (m.poster) v.poster = m.poster; f.appendChild(v); }
      else { var i = el('img'); i.src = m.src; i.alt = m.title || ''; i.loading = 'lazy'; f.appendChild(i); }
      if (m.title || m.note) { var c = el('figcaption'); if (m.title) c.appendChild(el('b', '', m.title)); if (m.note) c.appendChild(el('div', '', m.note)); f.appendChild(c); }
      w.appendChild(f);
    });
    b.appendChild(w);
  }
  function askReset() {
    var cf = dash && dash.querySelector('#hmrd-reset-confirm'); if (!cf) return;
    cf.textContent = ''; cf.hidden = false;
    cf.appendChild(el('p', 'hmrd-sure', 'Are you sure?'));
    cf.appendChild(el('p', '', 'This resets everything on this site in this browser: your look, the intro choice, toys, highlights and drafts. Everyone else always sees our look.'));
    var r = el('div', 'row'), yes = btn('hmrd-pill danger', 'Yes, reset everything'), no = btn('hmrd-pill', 'Cancel');
    yes.addEventListener('click', resetAll); no.addEventListener('click', function () { cf.hidden = true; var a = dash.querySelector('[data-k="reset-all"]'); try { if (a) a.focus({ preventScroll: true }); } catch (e) { } });
    r.appendChild(yes); r.appendChild(no); cf.appendChild(r);
    try { cf.scrollIntoView({ block: 'nearest' }); no.focus({ preventScroll: true }); } catch (e) { }
  }
  function resetAll() {
    [function () { return localStorage; }, function () { return sessionStorage; }].forEach(function (g) {
      try { var S = g(), ks = []; for (var i = 0; i < S.length; i++) { var k = S.key(i); if (k && /^hmr[-_]/.test(k)) ks.push(k); } ks.forEach(function (k) { S.removeItem(k); }); } catch (e) { }
    });
    var u = location.href; try { var U = new URL(u); U.searchParams.delete('hmrlook'); U.searchParams.delete('design'); u = U.toString(); } catch (e) { }
    try { if (u === location.href) location.reload(); else location.replace(u); } catch (e) { location.reload(); }
  }
  // ---- Log in: a few questions about you (stored on this device only). A visitor who shares enough and says they are
  // open to new ideas about reality earns a hidden invitation to universemodel.ai. Nobody else ever sees it.
  var ABOUT_KEY = 'hmr-about-v1', EGG_URL = 'https://universemodel.ai/', EGG_MIN = 3;
  function aboutGet() { var o = jget(ABOUT_KEY, null); return (o && typeof o === 'object') ? o : {}; }
  function aboutCount(o) {
    var n = 0;
    if (o.name && String(o.name).trim()) n++;
    if (o.why && String(o.why).trim().length >= 3) n++;
    if (o.ai) n++;
    if (o.family) n++;
    if (o.by) n++;
    // personaldash.life / claudebomb.com first-visit panel answers on this same site also count
    var p = jget('cbProfile', null);
    if (p && typeof p === 'object') { if (!o.ai && p.tier) n++; if (!o.family && p.parent && p.parent !== 'skip') n++; if (!o.by && p.by) n++; if (p.ai && p.ai.length) n++; if (p.plan) n++; }
    // claudebomb.com welcome pop-up answers (assets/cb-gate.js) also count
    var c = jget('cb-ctx-v1', null);
    if (c && typeof c === 'object') { if (!o.name && c.name && String(c.name).trim()) n++; if (!(o.why && String(o.why).trim().length >= 3) && c.intent) n++; if (!o.ai && c.level) n++; if (c.ai) n++; }
    return n;
  }
  function eggEarned() { var o = aboutGet(); return o.reality === 'yes' && aboutCount(o) >= EGG_MIN && !/(^|\.)universemodel\.ai$/i.test(location.hostname); }
  // ---- HMR family account (hmr-auth.js, loaded from the same folder as this file the first time Log in opens)
  function loadAuth(cb) {
    if (window.HMRAuth) { cb(window.HMRAuth); return; }
    var s = doc.querySelector('script[data-hmr-auth]');
    if (!s) { s = el('script'); s.src = AUTHSRC; s.async = true; s.setAttribute('data-hmr-auth', ''); (doc.head || root).appendChild(s); }
    s.addEventListener('load', function () { cb(window.HMRAuth || null); });
    s.addEventListener('error', function () { cb(null); });
  }
  var acctMode = 'in';
  function acctBox(box) {
    box.appendChild(el('p', 'hmrd-p', 'Loading your account...'));
    loadAuth(function (A) {
      if (!A) { box.textContent = ''; box.appendChild(el('p', 'hmrd-p hmrd-err', 'Logging in could not load. Check your connection and try again.')); return; }
      A.onChange(function () { if (box.isConnected) draw(); });
      function field(f, name, label, type, auto) { var w = el('label', 'hmrd-f'); w.appendChild(el('span', '', label)); var i = el('input'); i.type = type; i.name = name; i.autocomplete = auto; if (type === 'email') { i.inputMode = 'email'; i.autocapitalize = 'off'; i.spellcheck = false; } w.appendChild(i); f.appendChild(w); return i; }
      function okEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
      function draw() {
        box.textContent = '';
        if (A.failed) { box.appendChild(el('p', 'hmrd-p hmrd-err', 'We could not reach the account service. Check your connection and try again.')); return; }
        if (!A.ready) { box.appendChild(el('p', 'hmrd-p', 'Loading your account...')); return; }
        var f = el('form', 'hmrd-about'); f.noValidate = true;
        var msg = el('p', 'hmrd-msg'); msg.setAttribute('role', 'status');
        if (A.user && A.recovery) {
          box.appendChild(el('p', 'hmrd-p', 'Choose a new password for ' + A.user.email + '.'));
          var np = field(f, 'password', 'New password (at least 8 characters)', 'password', 'new-password');
          f.appendChild(msg); var sv = btn('hmrd-save', 'Save new password'); sv.type = 'submit'; f.appendChild(sv); box.appendChild(f);
          f.addEventListener('submit', function (ev) { ev.preventDefault(); if (np.value.length < 8) { msg.textContent = 'Use at least 8 characters.'; return; } msg.textContent = 'Saving...'; A.setPassword(np.value).then(function (r) { if (r.error) msg.textContent = A.say(r.error); else { toast('Password changed.'); draw(); } }); });
          return;
        }
        if (A.user) {
          box.appendChild(el('p', 'hmrd-p', 'You are logged in as ' + A.user.email + '.'));
          box.appendChild(el('p', 'hmrd-p', 'This one free account works on every ' + ACSITES + '. On another of our sites, log in there with the same email and password.'));
          var out = btn('hmrd-save', 'Log out'); out.addEventListener('click', function () { out.disabled = true; A.signOut().then(function () { toast('Logged out on this site.'); }); });
          box.appendChild(out); return;
        }
        var up = acctMode === 'up';
        // v1.8 (Leo, Nov 26): Log in and Create account sit side by side at the top, so a new visitor sees how to sign up right away
        var seg = el('div', 'hmrd-seg'); seg.setAttribute('role', 'group'); seg.setAttribute('aria-label', 'Log in or create an account');
        [['in', 'Log in'], ['up', 'Create a free account']].forEach(function (m) {
          var sb = btn('hmrd-segb' + (acctMode === m[0] ? ' on' : ''), m[1]); sb.setAttribute('aria-pressed', acctMode === m[0] ? 'true' : 'false');
          sb.addEventListener('click', function () { if (acctMode === m[0]) return; acctMode = m[0]; draw(); var i = box.querySelector('input'); if (i) i.focus(); });
          seg.appendChild(sb);
        });
        box.appendChild(seg);
        box.appendChild(el('p', 'hmrd-p', up ? 'Create one free account for every ' + ACSITES + '. No ads, ever.' : 'Log in with your ' + ACCT + '. The same email and password work on every ' + ACSITES + '.'));
        var em = field(f, 'email', 'Email', 'email', 'email');
        var pw = field(f, 'password', up ? 'Password (at least 8 characters)' : 'Password', 'password', up ? 'new-password' : 'current-password');
        f.appendChild(msg);
        var go = btn('hmrd-save', up ? 'Create account' : 'Log in'); go.type = 'submit'; f.appendChild(go);
        box.appendChild(f);
        f.addEventListener('submit', function (ev) {
          ev.preventDefault(); var e = em.value.trim();
          if (!okEmail(e)) { msg.textContent = 'That email does not look right. Check it and try again.'; em.focus(); return; }
          if (pw.value.length < (up ? 8 : 1)) { msg.textContent = up ? 'Use a password with at least 8 characters.' : 'Enter your password.'; pw.focus(); return; }
          go.disabled = true; msg.textContent = up ? 'Creating your account...' : 'Logging in...';
          (up ? A.signUp(e, pw.value) : A.signIn(e, pw.value)).then(function (r) {
            go.disabled = false;
            if (r.error) { msg.textContent = A.say(r.error); return; }
            if (up && !(r.data && r.data.session)) { acctMode = 'in'; draw(); box.querySelector('.hmrd-msg').textContent = 'Almost done. Open the link we emailed to ' + e + ', then log in here.'; return; }
            toast(up ? 'Account created. You are logged in.' : 'Logged in.');
          });
        });
        if (!up) {
          var fg = btn('hmrd-link', 'Forgot your password?');
          fg.addEventListener('click', function () {
            var e = em.value.trim(); if (!okEmail(e)) { msg.textContent = 'Type your email above first, then tap Forgot your password again.'; em.focus(); return; }
            msg.textContent = 'Sending...';
            A.reset(e).then(function (r) { msg.textContent = r.error ? A.say(r.error) : 'If ' + e + ' has an account, we sent it a link to choose a new password.'; });
          });
          box.appendChild(fg);
        }
      }
      draw();
    });
  }
  function login(b) {
    var acct = el('div', 'hmrd-acct'); b.appendChild(acct); acctBox(acct);
    b.appendChild(el('h3', 'hmrd-sub', 'About you (optional)'));
    b.appendChild(el('p', 'hmrd-p', 'Tell us a little about you. Every question is optional. Your answers stay in this browser, on this site, and are never sent to us.'));
    var o = aboutGet(), f = el('form', 'hmrd-about'); f.noValidate = true;
    function txt(id, label, val, ph, type) { var w = el('label', 'hmrd-f'); w.appendChild(el('span', '', label)); var i = el('input'); i.type = type || 'text'; i.name = id; i.value = val || ''; if (ph) i.placeholder = ph; if (type === 'number') { i.inputMode = 'numeric'; i.min = '1900'; } w.appendChild(i); f.appendChild(w); return i; }
    function pick(id, label, opts, val) { var fs = el('fieldset', 'hmrd-f'); fs.appendChild(el('legend', '', label)); var r = el('div', 'hmrd-opts'); opts.forEach(function (x) { var l = el('label'); var i = el('input'); i.type = 'radio'; i.name = id; i.value = x[0]; i.checked = val === x[0]; l.appendChild(i); l.appendChild(doc.createTextNode(' ' + x[1])); r.appendChild(l); }); fs.appendChild(r); f.appendChild(fs); }
    txt('name', 'Your first name', o.name, 'First name');
    txt('why', 'What brings you here?', o.why, 'A few words');
    pick('ai', 'How much do you use AI?', [['new', 'New to it'], ['some', 'Some'], ['lots', 'A lot']], o.ai);
    pick('family', 'Are you a parent or grandparent?', [['parent', 'Parent'], ['grandparent', 'Grandparent'], ['both', 'Both'], ['no', 'No']], o.family);
    txt('by', 'Birth year', o.by || '', '1984', 'number');
    pick('reality', 'Are you open to new ideas about reality?', [['yes', 'Yes'], ['no', 'No']], o.reality);
    var err = el('p', 'hmrd-p hmrd-err'); err.setAttribute('role', 'alert'); f.appendChild(err);
    var go = btn('hmrd-save', 'Save my answers'); go.type = 'submit'; f.appendChild(go);
    b.appendChild(f);
    var egg = el('div', 'hmrd-egg'); b.appendChild(egg);
    function drawEgg() {
      egg.textContent = ''; if (!eggEarned()) return;
      var e = btn('hmrd-eggbtn', "Feeling dangerous? Enter a world you didn't expect when you woke up this morning.");
      e.addEventListener('click', function () {
        egg.textContent = '';
        var c = el('div', 'hmrd-inv');
        c.appendChild(el('p', 'hmrd-p', 'Not everybody gets this link.'));
        c.appendChild(el('p', 'hmrd-p', 'You said you are open to new ideas about reality, and you freely shared something about yourself. To us, that means you are not entirely a stranger.'));
        c.appendChild(el('p', 'hmrd-p', 'So we would like to invite you to experience an idea that can change the world in ways no artificial intelligence can: a vision of a sensible world where humans experience a shared reality for the first time.'));
        c.appendChild(el('p', 'hmrd-p', 'It is centered on community, sharing, openness, and a shared mission to elevate humanity together, as a team. It comes with a promise not to corrupt progress by hoarding money or resources, like information that can elevate others, or by forcing people to watch ads.'));
        c.appendChild(el('p', 'hmrd-p', 'We are forging the path to this world now. The site you are about to enter is the basis for our system of values.'));
        var a = el('a', 'hmrd-eggbtn hmrd-enter', 'Enter'); a.href = EGG_URL; c.appendChild(a);
        egg.appendChild(c); try { a.focus({ preventScroll: true }); } catch (x) { }
      });
      egg.appendChild(e);
    }
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); err.textContent = '';
      var g = function (n) { var x = f.querySelector('input[name="' + n + '"]:checked'); return x ? x.value : ''; };
      var by = String(f.elements.by.value || '').trim(), yr = 0;
      if (by) { yr = /^\d{4}$/.test(by) ? +by : 0; if (!yr || yr < 1900 || yr > new Date().getFullYear()) { err.textContent = 'Birth year should be four digits, like 1984. You can also leave it blank.'; return; } }
      var n = { name: String(f.elements.name.value || '').trim().slice(0, 60), why: String(f.elements.why.value || '').trim().slice(0, 300), ai: g('ai'), family: g('family'), by: yr, reality: g('reality'), t: Date.now() };
      lsSet(ABOUT_KEY, JSON.stringify(n));
      var was = !!egg.firstChild; drawEgg();
      if (egg.firstChild && !was) { try { egg.firstChild.focus({ preventScroll: true }); } catch (x) { } }
      toast('Saved in this browser. Thank you.');
    });
    drawEgg();
    var l = el('div', 'hmrd-list'), D = dock();
    if (D.openFeedback) l.appendChild(item('write', 'Tell us what you want from your account', 'Your ideas shape what accounts do next', then(function () { D.openFeedback(); })));
    l.appendChild(item('settings', 'Your settings', 'See or reset what is saved here', function () { show('settings'); }));
    b.appendChild(l);
  }
  function resetLook() { st = { pal: '', font: '', size: 100, comfort: false, calm: false, links: false, focus: false, contrast: false, prevPal: '' }; shared = false; lsDel(KEY); renderAll(); toast('Back to the site as built.'); }

  // ---- studio
  var stTab = 'colors', panes = {}, tabs = {};
  function buildStudio() {
    if (studio) return; build();
    studio = ui(el('section', 'hmrs')); studio.id = 'hmr-studio'; studio.setAttribute('role', 'dialog'); studio.setAttribute('aria-label', 'UI/UX studio'); studio.hidden = true;
    var hd = el('div', 'hmrs-hd'); var bk = btn('hmrd-ib', '', 'Back to the dashboard'); bk.innerHTML = svg('back'); bk.addEventListener('click', function () { closeStudio(false); open(); });
    var h = el('h2', '', T('studio', 'label') || 'UI/UX studio'); var x = btn('hmrd-ib', '', 'Close the studio'); x.innerHTML = svg('x'); x.addEventListener('click', function () { closeStudio(true); });
    hd.appendChild(bk); hd.appendChild(h); hd.appendChild(x); studio.appendChild(hd);
    var tb = el('div', 'hmrs-tabs'); tb.setAttribute('role', 'tablist'); tb.setAttribute('aria-label', 'Studio sections'); studio.appendChild(tb);
    [['colors', 'Colors'], ['type', 'Type'], ['comfort', 'Comfort'], ['layouts', 'Layouts'], ['saved', 'Saved']].forEach(function (t) {
      var b = btn('hmrs-tab', t[1]); b.setAttribute('role', 'tab'); b.id = 'hmrs-tab-' + t[0]; b.setAttribute('aria-controls', 'hmrs-pane-' + t[0]); tb.appendChild(b); tabs[t[0]] = b;
      var p = el('div', 'hmrs-pane'); p.id = 'hmrs-pane-' + t[0]; p.setAttribute('role', 'tabpanel'); p.setAttribute('aria-labelledby', b.id); p.hidden = true; studio.appendChild(p); panes[t[0]] = p;
      b.addEventListener('click', function () { tab(t[0]); });
    });
    tb.addEventListener('keydown', function (e) { var k = Object.keys(tabs), i = k.indexOf(stTab); if (e.key === 'ArrowRight') { tab(k[(i + 1) % k.length]); tabs[stTab].focus(); e.preventDefault(); } else if (e.key === 'ArrowLeft') { tab(k[(i + k.length - 1) % k.length]); tabs[stTab].focus(); e.preventDefault(); } });
    colorsPane(panes.colors); typePane(panes.type); comfortPane(panes.comfort); layoutsPane(panes.layouts); savedPane(panes.saved);
    doc.body.appendChild(studio);
  }
  function tab(k) { stTab = k; Object.keys(tabs).forEach(function (t) { var on = t === k; tabs[t].setAttribute('aria-selected', on ? 'true' : 'false'); tabs[t].tabIndex = on ? 0 : -1; panes[t].hidden = !on; }); }
  function colorsPane(p) {
    p.appendChild(el('p', 'hmrs-note', C('studioIntro', 'Tap anything below. Your page changes right away, and your choice is saved in this browser.')));
    var sc = el('div', 'hmrs-scroll'); sc.setAttribute('role', 'group'); sc.setAttribute('aria-label', 'Color palettes'); p.appendChild(sc);
    function draw() {
      sc.textContent = '';
      var o = btn('hmrs-pal hmrs-orig'); o.setAttribute('aria-pressed', st.pal ? 'false' : 'true'); var osw = el('div', 'sw', 'As built'); o.appendChild(osw); o.appendChild(el('b', '', 'Original')); o.appendChild(el('small', '', 'The colors this site was built with'));
      o.addEventListener('click', function () { st.pal = ''; save(); }); sc.appendChild(o);
      allPalettes().forEach(function (pl) {
        var b = btn('hmrs-pal'); b.setAttribute('aria-pressed', st.pal === pl.id ? 'true' : 'false'); b.setAttribute('aria-label', pl.name + (pl.mood ? ': ' + pl.mood : ''));
        var sw = el('div', 'sw'); [[pl.bg, pl.text, 'Aa'], [pl.accent, pl.onAccent, ''], [pl.accent2, pl.onAccent, ''], [pl.accent3, pl.onAccent, '']].forEach(function (c) { var i = el('i', '', c[2]); i.style.background = c[0]; i.style.color = c[1]; sw.appendChild(i); });
        b.appendChild(sw); b.appendChild(el('b', '', pl.name)); b.appendChild(el('small', '', pl.mood || ''));
        b.addEventListener('click', function () { st.pal = pl.id; save(); }); sc.appendChild(b);
      });
    }
    UIS.push(draw); draw();
    var row = el('div', 'hmrs-tg'); row.style.marginTop = '4px'; p.appendChild(row); toggleBtn(row, TOGGLES[4]);
  }
  function seg(p, title, items, get, set) {
    var g = el('div', 'hmrs-grp'); g.appendChild(el('span', '', title)); var s = el('div', 'hmrs-seg'); s.setAttribute('role', 'group'); s.setAttribute('aria-label', title); g.appendChild(s); p.appendChild(g);
    var bs = items.map(function (it) { var b = btn('', it[1]); if (it[2]) b.style.fontFamily = it[2]; b.addEventListener('click', function () { set(it[0]); save(); }); s.appendChild(b); return [it[0], b]; });
    UIS.push(function () { bs.forEach(function (x) { x[1].setAttribute('aria-pressed', String(get()) === String(x[0]) ? 'true' : 'false'); }); });
  }
  function typePane(p) {
    seg(p, 'Font', FONTS.map(function (f) { return [f.id, f.name, f.fam]; }), function () { return st.font; }, function (v) { st.font = v; });
    UIS.push(function () { /* skin fonts join the list when the kit arrives */ if (SKIN.fonts.length && !p._kit) { p._kit = 1; seg(p, 'From our studio', SKIN.fonts.map(function (f) { return [f.id, f.name, f.fam]; }), function () { return st.font; }, function (v) { st.font = v; }); } });
    seg(p, 'Size', SIZES.map(function (s) { return [s, s + '%']; }), function () { return st.size; }, function (v) { st.size = +v; });
  }
  function toggleBtn(row, t) {
    var b = btn(''); b.appendChild(el('b', '', t.name)); b.appendChild(el('small', '', t.hint)); b.addEventListener('click', function () { st[t.id] = !st[t.id]; save(); }); row.appendChild(b);
    UIS.push(function () { b.setAttribute('aria-pressed', st[t.id] ? 'true' : 'false'); });
  }
  function comfortPane(p) { var row = el('div', 'hmrs-tg'); p.appendChild(row); TOGGLES.forEach(function (t) { toggleBtn(row, t); }); }
  function layoutsPane(p) {
    p.appendChild(el('p', 'hmrs-note', 'Layouts rebuild this page in a brand new design with the same words. Colors above work on the page as built.'));
    var D = dock(), w = el('div', 'hmrs-dx'); p.appendChild(w);
    try { var dx = D.designPanel && D.designPanel(); if (dx) w.appendChild(dx); else w.appendChild(el('p', '', 'Layouts are not available on this page.')); } catch (e) { w.appendChild(el('p', '', 'Layouts are not available on this page.')); }
  }
  function savedPane(p) {
    var note = el('p', 'hmrs-note'); p.appendChild(note);
    var row = el('div', 'hmrs-seg'); p.appendChild(row);
    var keep = btn('', 'Keep this look'); keep.addEventListener('click', function () { shared = false; save(); history.replaceState && history.replaceState(null, '', location.href.replace(/([?&])hmrlook=[^&#]*&?/, '$1').replace(/[?&](#|$)/, '$1')); toast('Kept. This is now your look on this site.'); });
    var sh = btn('', 'Share my look'); sh.addEventListener('click', function () { var u; try { var o = new URL(location.href); o.searchParams.set('hmrlook', encodeLook()); o.hash = ''; u = o.toString(); } catch (e) { u = location.href; } copyText(u).then(function (ok) { toast(ok ? 'Link copied. Anyone who opens it sees your look.' : 'The link is ' + u, null, null, 5000); }); });
    var rs = btn('', 'Reset my look'); rs.addEventListener('click', resetLook);
    row.appendChild(keep); row.appendChild(sh); row.appendChild(rs);
    UIS.push(function () {
      var p2 = st.pal && palById(st.pal), f = null; FONTS.concat(SKIN.fonts).forEach(function (x) { if (x.id === st.font) f = x; });
      var on = TOGGLES.filter(function (t) { return st[t.id]; }).map(function (t) { return t.name.toLowerCase(); });
      note.textContent = isDefault() ? 'You are seeing this site as built. Anything you change in the studio is saved here, in this browser.' :
        (shared ? 'You are seeing a look someone shared with you. ' : 'Your look: ') + [p2 ? p2.name + ' colors' : 'original colors', f && f.id ? f.name + ' font' : '', st.size !== 100 ? st.size + '% size' : ''].concat(on).filter(Boolean).join(', ') + '.';
      keep.hidden = !shared; sh.disabled = isDefault();
    });
  }
  function openStudio(t) {
    buildStudio(); close(false); dock().closeOthers && dock().closeOthers('dash');
    tab(t || stTab); studio.hidden = false; root.classList.add('hmr-studio-on'); renderAll();
    requestAnimationFrame(function () { studio.classList.add('on'); inset(); try { tabs[stTab].focus({ preventScroll: true }); } catch (e) { } });
  }
  var insRO = null;
  function inset() {
    var h = 0; try { if (studio && !studio.hidden) h = Math.max(0, Math.ceil(innerHeight - studio.offsetTop + 4)); } catch (e) { }
    root.style.setProperty('--hmr-dsinset', h + 'px');
    try { if (!insRO && window.ResizeObserver && studio) { insRO = new ResizeObserver(function () { if (!studio.hidden) inset(); }); insRO.observe(studio); } } catch (e) { }
  }
  function closeStudio(back) {
    if (!studio || studio.hidden) return; studio.classList.remove('on'); root.classList.remove('hmr-studio-on'); root.style.setProperty('--hmr-dsinset', '0px');
    setTimeout(function () { if (!studio.classList.contains('on')) studio.hidden = true; }, rm() ? 0 : 280);
    if (back) focusBack();
  }
  function focusBack() { var b = doc.getElementById('hmr-hmr') || lastFocus; try { if (b) b.focus({ preventScroll: true }); } catch (e) { } }
  function dragHint() {
    if (lsGet(DRAG_KEY) === '1' || dash.querySelector('.hmrd-dhint')) return;
    var h = el('p', 'hmrd-dhint', 'You can grab this and move it anywhere: drag the top bar.');
    dash.insertBefore(h, dash._body);
  }
  function open(v) {
    build(); dragHint(); closeStudio(false); var D = dock(); if (D.closeOthers) D.closeOthers('dash');
    if (doc.activeElement && !(dash.contains(doc.activeElement))) lastFocus = doc.activeElement;
    show(v || 'home'); dash.hidden = false; veil.hidden = false;
    var b = doc.getElementById('hmr-hmr'); if (b) b.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(function () { dash.classList.add('on'); veil.classList.add('on'); try { (dash.querySelector('.hmrd-intro .pri') || dash.querySelector('.hmrd-act') || dash.querySelector('button')).focus({ preventScroll: true }); } catch (e) { } });
  }
  function close(back) {
    if (!dash || dash.hidden) return; dash.classList.remove('on'); veil.classList.remove('on');
    var b = doc.getElementById('hmr-hmr'); if (b) b.setAttribute('aria-expanded', 'false');
    setTimeout(function () { if (!dash.classList.contains('on')) { dash.hidden = true; veil.hidden = true; } }, rm() ? 0 : 300);
    if (back) focusBack();
  }
  function isOpen() { return !!((dash && !dash.hidden) || (studio && !studio.hidden)); }

  // ------------------------------------------------------------------ boot: re-apply a saved look, then fetch the shared kit
  function boot() { if (!isDefault()) apply(); loadSkin(); }
  if (doc.body) boot(); else doc.addEventListener('DOMContentLoaded', boot);
  window.addEventListener('pageshow', function (e) { if (e.persisted && !isDefault()) apply(); });

  window.HMRDash = {
    version: VERSION, open: open, close: function () { close(true); closeStudio(true); }, closeQuiet: function () { close(false); closeStudio(false); }, isOpen: isOpen,
    toggle: function () { if (dash && !dash.hidden) close(true); else if (studio && !studio.hidden) closeStudio(true); else open(); },
    studio: openStudio, view: function (v) { open(v); }, apply: function (s) { if (s && typeof s === 'object') { take(s); save(); } },
    state: function () { return JSON.parse(JSON.stringify(st)); }, palettes: function () { return allPalettes().slice(); }, look: encodeLook
  };
  window.HMRKit = { skin: SKIN, palettes: allPalettes, applyPalette: function (id) { st.pal = palById(id) ? id : ''; save(); }, onSkin: function (f) { if (SKIN_LOADING) skinCbs.push(f); else f(SKIN); }, skinUrl: SKIN_URL };
})();
