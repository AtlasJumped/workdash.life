/* ELV8 dock v6.9.0 (Nov 27, Leo's Nov 26 asks): the default bar is the ELV8 button with four arrows and the mic, no browser back / forward buttons;
   "ELV8" on the centre button; arrows grey when they cannot move the page, with bigger tap areas centred on each tip; forward grey when nothing is ahead;
   React in the rainbow colours everywhere; thumb layouts (back, React, mic, forward next to a plain ELV8 button) with a "Shuffle buttons" label;
   ribbon: a yellow heart and "elevat.ing family of websites", linking to elevat.ing; no trackers of any kind (Microsoft Clarity removed);
   the dock mic asks for the spot to talk about and starts recording on that tap, a top notice while recording, recording carries on to the next page
   where the browser allows it, and a 2-minute cap without a login ("Sorry, we can't let you record anymore." with Send / Send and create a free login);
   field mics at the bottom right of each box in the rainbow colours; the dashboard opens above the ELV8 button on phones and stays open on outside taps.
   (was HMR dock v6.8.2: the HMR joystick (rainbow HMR button with four curved arrows, tap and hold, drags as one), rainbow mic at bottom right, button layouts with a shuffle, wider dashboard and studio.
   (was HMR dock v6.7.2: drag any bar button anywhere (saved per visitor), Funsies lives in the HMR dashboard only, a mic in every text box (v6.9: at its bottom right).
   (was HMR dock v6.6.1: one shared bottom bar for all HMR sites.
   v6.6.1: the demo cards now show (v6.6.0 skipped every spot because the page's html tag carries hmr- classes).
   v6.6.0 edit mode: small "Add a demo?" cards with Yes and No at spots that have no demo yet (see the block at the end of this file).
   (was v6.5.9: one shared bottom bar for all HMR sites.
   v6.5.9 (Leo's Speak feedback, Nov 24 and 25): the mic starts OFF when the card opens (status "Not recording yet", line "Press the record button and begin speaking");
     "Talk as long as you like."; the Speak button's label is "Do us a big favor, tell us what you think"; the Speak card can be dragged anywhere by its top line,
     with a one-time hint ("You can grab this and move it anywhere").
   v6.5 HMR dash: a round HMR button sits in the center of the bar. It opens the HMR family experience dashboard (hmr-dash.js, loaded from the same folder
     the first time it is pressed): quick actions, the UI/UX studio (colors, type, comfort, layouts), Improve this site, Funsies and Places.
     The Design button left the bar; its panel lives on inside the studio's Layouts tab (HMRDock.designPanel). The bar is one grid row:
     Back, Funsies, HMR (center), Speak, React, Forward.
   v6.4 Design: a seeded generator replaces the fixed list. A design is one integer (the seed): a mulberry32 PRNG picks family (3D or Clean), layout (9), palette (32, all checked to WCAG AA),
     type pairing (14), card style (6), background (5 animated canvas for 3D, 5 static for Clean), density (3), radius (5), accent usage (3). Chips pick 3D, Clean, or All; Shuffle, Back, Forward;
     Save as my view (localStorage per site, applied on the next visit), ?design=<seed> share links, and a per-site HMR default (native page; data-hmr-default overrides).
   One row along the bottom, left to right:
     far left: Back (round, browser back) then the dock's own Design button (round). v6.1: the dock's Design is the ONLY design feature on every site; a page's own
       Design button and panel (data-design / data-design-panel) are hidden, so there is never a second design control.
     center: Funsies (a menu: play three of our toys in an overlay, wreck the page, or pick more fun) with the round Speak here mic button to its right
       (say anything, it transcribes, it is sent as kind "speak").
     far right: React (round; pick a reaction, optionally aimed at a spot on the page) then Forward (round, browser forward) at the very edge.
   Back, Forward, Design and React are round 54px buttons (46px on phones, 42px on very small ones). The old Feedback and "I'm lost" pill buttons are gone;
   the sheet behind them still opens from the select-text menu (highlight, email, share, feedback) and from HMRDock.openFeedback / openLost.
   v6.1 Design panel: one compact bottom bar (Back, big Shuffle, Forward, a hate/neutral/love slider, Text only, Send ratings). The redesigned page sits above it;
     tap anywhere outside, press X, or press Escape to close. Speak here: a small floating recorder (not a sheet); starts on the tap, live text, Stop/Resume, Submit, X;
     the page stays scrollable underneath; mic help by platform if the microphone is blocked.
   Design studio (the themes behind it): 12 genres of whole-page designs (Professional, Salesy, Gimmicky, Retro, Artistic, Fantasy, Silly, Minimal,
     Futuristic, Cozy, Brutalist, Nature), 4 designs each. v6: a design is built fresh from the page's own text plus a design prompt (colors, type,
     layout, a full-screen 3D canvas background), inside a shadow-DOM overlay, never by restyling the original layout. The words never change.
     Pick a genre, then Back / Forward through its designs, Shuffle (with a Previous history), Original, or "Text only (proofread)" (the page text in reading order, chunked).
     Also: a hate / neutral / love slider per design, mouse pointer and trail, notes (with voice typing) and Submit (with my email, or anonymously).
     The chosen design is remembered per site (localStorage) and re-applied on load.
   v6 also: Speak here starts with the mic OFF; highlight tool (hover menu, several highlights at once); forward-button explainer; funsies dragons with riders;
     vertical full-height Play pop-ups with +/- zoom and no wheel zoom; dock self-repair on back/forward (pageshow / bfcache).
   Config comes from data attributes on the script tag:
     data-site="name"            site name
     data-design="#btn,.btn2"    CSS selector(s) of the site's own Design button (placed bottom left, round)
     data-design-panel="#panel"  CSS selector(s) of the site's Design panel (opens above the button, bottom left)
     data-sound="1"              the site already has sound, so bubbles may pop with a tiny sound
     data-tier="family|experiment"  adds a small ribbon at the end of the page: "Part of the HMR family" (default, gold star, links to hmrfamily.life)
                                 or "Part of the HMR experiment" (plain pill). Skipped if the page has an element with [data-hmr-tier-ribbon].
   Also here: HMRDock.send(payload) (web3forms, falling back to the visitor's email app), forms marked data-hmr-anon-form,
   and nothing else: no analytics or trackers of any kind (v6.9 removed the old click tracker).
   Storage is always inside try/catch. */
(function () {
  'use strict';
  var FREE_LINE = 'Always free forever. Nothing we make will ever ask you to pay. It will be your choice if you want to purchase any of the tools we recommend.';
  var FORM_KEY = '436d16c6-bfff-4931-aace-95f12a6726ad';   // web3forms access key; also read from window.HMR_FORM_KEY. Empty means Send falls back to the visitor's email app.
  if (window.HMRDock) {
    if ((window.HMRDock.version || 0) >= 6.1) return;
    try { ['hmr-dock', 'hmr-dock-css', 'hmr-rxp', 'hmr-fzm', 'hmr-fbp', 'hmr-spk'].forEach(function (id) { var n = document.getElementById(id); if (n && n.parentNode) n.parentNode.removeChild(n); }); } catch (e) { }
  }
  if (window.name === 'hmr-embed') {   // inside the Funsies play overlay: no dock in the dock, but the wheel only scrolls (no wheel zoom) and the page shows its own scrollbar
    try { window.addEventListener('wheel', function (e) { e.stopImmediatePropagation(); }, { capture: true, passive: true }); } catch (e) { }
    return;
  }
  var script = document.currentScript, D = (script && script.dataset) || {};
  var CFG = { site: D.site || location.hostname, design: D.design || '', panel: D.designPanel || '', sound: D.sound === '1', tier: D.tier === 'experiment' ? 'experiment' : 'family' };
  var doc = document, root = doc.documentElement;
  function rm() { return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function coarse() { return !!(window.matchMedia && matchMedia('(pointer: coarse)').matches); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  // ------------------------------------------------------------------ styles
  var BASE = 'calc(max(12px,env(safe-area-inset-bottom)) + var(--hmr-lift,0px))', LEFT = 'max(12px,env(safe-area-inset-left))', RIGHT = 'max(12px,env(safe-area-inset-right))';
  var ds = '.hmr-dsbtn', ps = '.hmr-dsp', HIDESEL = [CFG.design, CFG.panel].filter(Boolean).join(',');   // v6.1: a page's own design button and panel are hidden (HIDESEL)
  function each(list, f) { return list ? list.split(',').map(function (x) { return f(x.trim()); }).join(',') : ''; }
  var AIMOK = ['html.hmr-aim .hmr-dock *', 'html.hmr-aim .hmr-rxp', 'html.hmr-aim .hmr-rxp *'].concat(ds ? [each(ds, function (x) { return 'html.hmr-aim ' + x; })] : [], ps ? [each(ps, function (x) { return 'html.hmr-aim ' + x; }), each(ps, function (x) { return 'html.hmr-aim ' + x + ' *'; })] : []).join(',');
  var css =
    'html{--hmr-c:54px;--hmr-cg:8px}@media (max-width:480px){html{--hmr-c:46px;--hmr-cg:4px}}@media (max-width:374px){html{--hmr-c:42px;--hmr-cg:3px}}' +
    '.hmr-dock{position:fixed;left:0;right:0;bottom:0;height:0;z-index:99990;pointer-events:none;font:600 13px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;letter-spacing:0;text-transform:none}' +
    '.hmr-dock *{box-sizing:border-box;font-family:inherit}' +
    '.hmr-rxbtn,.hmr-fzbtn{pointer-events:auto;position:fixed;bottom:' + BASE + ';border:2px solid #fff;color:#fff;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.38);-webkit-tap-highlight-color:transparent;touch-action:manipulation;margin:0;transform:none}' +
    '.hmr-rxbtn{right:calc(' + RIGHT + ' + var(--hmr-c) + var(--hmr-cg));width:var(--hmr-c);height:var(--hmr-c);border-radius:50%;background:#111;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:11px;line-height:1;font-weight:700}' +
    '.hmr-rxbtn svg{width:22px;height:22px;display:block;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}' +
    '.hmr-rxbtn{background:conic-gradient(from 210deg,#e0307a,#f59e0b,#22c55e,#06b6d4,#8b5cf6,#e0307a)!important;text-shadow:0 1px 2px rgba(0,0,0,.6)}.hmr-rxbtn svg{filter:drop-shadow(0 1px 1.5px rgba(0,0,0,.55))}.hmr-rxbtn:hover{filter:brightness(1.1)}.hmr-rxbtn[aria-expanded="true"]{box-shadow:0 6px 20px rgba(0,0,0,.38),0 0 0 4px #fff}' +
    '.hmr-fzbtn{left:50%;margin-left:-58px;width:116px;height:46px;margin-bottom:calc((var(--hmr-c) - 46px) / 2);border-radius:999px;background:linear-gradient(135deg,#e0307a,#f59e0b);font-size:15px;font-weight:800;letter-spacing:.02em;display:flex;align-items:center;justify-content:center;padding:0;transition:transform .25s}' +
    '.hmr-fzbtn:hover{transform:rotate(-3deg) scale(1.06)}.hmr-fzbtn:active{transform:scale(.95)}' +
    '.hmr-dock button:focus-visible,.hmr-rxp button:focus-visible,.hmr-rxp input:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}' +
    // react panel
    '.hmr-rxp{position:fixed;right:' + RIGHT + ';bottom:calc(' + BASE + ' + var(--hmr-c) + 10px);z-index:99991;width:272px;max-width:calc(100vw - 24px);max-height:calc(100vh - 110px);overflow:auto;background:#fff;color:#111;border:2px solid #111;border-radius:14px;padding:10px;box-shadow:0 12px 36px rgba(0,0,0,.4);font:500 13px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;text-align:left;text-transform:none;letter-spacing:0}' +
    '.hmr-rxp[hidden]{display:none}.hmr-rxp *{box-sizing:border-box;font-family:inherit}' +
    '.hmr-rxp .hd{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:700;font-size:13px;margin:0 0 6px}' +
    '.hmr-rxp .x{min-width:32px;min-height:32px;border:1px solid #bbb;background:#f6f6f6;color:#111;border-radius:8px;font-size:18px;line-height:1;cursor:pointer}' +
    '.hmr-rxp .tip{background:#fff8dc;border:1px solid #e6c85a;border-radius:8px;padding:7px 9px;margin:0 0 7px;font-size:12px}' +
    '.hmr-rxp .tip p{margin:0 0 5px}.hmr-rxp .tip label{display:flex;gap:6px;align-items:center;cursor:pointer;font-weight:600}' +
    '.hmr-rxp .st{margin:0 0 7px;font-size:12px;color:#333;min-height:1.3em}' +
    '.hmr-rxp .hmr-deal{margin:0 0 7px;font-size:12px;line-height:1.3;color:#14532d;background:#ecfdf5;border:1px solid #86efac;border-radius:8px;padding:6px 8px}' +
    '.hmr-rxp .hmr-rxrate{margin:0 0 6px}.hmr-rxp .hmr-sendr{width:100%;min-height:34px;margin:0 0 8px;border:1px solid #1d4ed8;background:#1d4ed8;color:#fff;border-radius:8px;font-size:12.5px;font-weight:700;cursor:pointer}' +
    '.hmr-rxp .grid{display:grid;grid-template-columns:1fr 1fr;gap:5px}' +
    '.hmr-rxp .chip{min-height:34px;border:1px solid #cfd6e4;background:#f4f7fc;color:#111;border-radius:10px;font-size:12.5px;font-weight:600;cursor:pointer;padding:0 6px;text-align:center;white-space:normal;line-height:1.1}' +
    '.hmr-rxp .chip.neg{background:#fff1ef;border-color:#efc2bb}.hmr-rxp .chip.pos{background:#fff8e1;border-color:#ecd48a}' +
    '.hmr-rxp .chip:hover{filter:brightness(.95)}' +
    '.hmr-rxp .row2{display:flex;gap:6px;margin-top:7px}.hmr-rxp .row2 button{flex:1;min-height:32px;border:1px solid #999;background:#fff;color:#111;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer}' +
    '.hmr-rxp .row2 button[hidden]{display:none}' +
    // aiming
    'html.hmr-aim,html.hmr-aim *{cursor:CURSOR!important}' +
    AIMOK + '{cursor:pointer!important}' +
    '.hmr-mark{position:absolute;z-index:99989;width:40px;height:40px;margin:-20px 0 0 -20px;pointer-events:none}' +
    '.hmr-mark svg{width:40px;height:40px;display:block;animation:hmrpulse 1.4s ease-in-out infinite}' +
    '@keyframes hmrpulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.18);opacity:.8}}' +
    '@media (prefers-reduced-motion:reduce){.hmr-mark svg{animation:none}.hmr-fzbtn{transition:none}.hmr-fzbtn:hover{transform:none}}' +
    '.hmr-fzcanvas{position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:99980;pointer-events:none;touch-action:none}' +
    'html.hmr-fz-on{overflow-x:clip}' +
    '.hmr-spacer{height:74px;pointer-events:none}.hmr-dsbtn svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}' +
    // the site's own Design button and panel, placed by the dock
    (ds ? ds + '{position:fixed!important;left:calc(' + LEFT + ' + var(--hmr-c) + var(--hmr-cg))!important;right:auto!important;top:auto!important;bottom:' + BASE + '!important;width:var(--hmr-c)!important;height:var(--hmr-c)!important;min-width:0!important;min-height:0!important;max-width:none!important;padding:0!important;margin:0!important;border-radius:50%!important;background:#111!important;color:#fff!important;border:2px solid #fff!important;box-shadow:0 6px 20px rgba(0,0,0,.38)!important;font:700 11px/1 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif!important;letter-spacing:0!important;text-transform:none!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;z-index:99990!important;transform:none!important;cursor:pointer}' +
        ds.split(',').join(':hover,') + ':hover{background:#1d4ed8!important;transform:none!important}' +
        ds.split(',').join('[hidden],') + '[hidden]{display:none!important}' +
        ds.split(',').join(' svg,') + ' svg{width:20px!important;height:20px!important}' : '') +
    (ps ? ps + '{position:fixed!important;left:' + LEFT + '!important;right:auto!important;top:auto!important;bottom:calc(' + BASE + ' + var(--hmr-c) + 10px)!important;z-index:99991!important;max-width:calc(100vw - 24px)!important;max-height:calc(100vh - 110px)!important;overflow:auto!important;margin:0!important}' : '') +
    '@media (max-width:600px){.hmr-rxp{left:' + LEFT + ';right:' + RIGHT + ';width:auto;max-height:min(46vh,calc(100vh - 110px))}.hmr-rxp .grid{grid-template-columns:1fr 1fr 1fr}.hmr-rxp .chip{min-height:32px;font-size:12px}}' +
    '.rx-bar{position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important}';

  function cursorURL() {
    var ring = function (r) { return '<circle cx="13" cy="13" r="' + r + '"/>'; };
    var rings = ring(11) + ring(7) + ring(3);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none"><g stroke="#fff" stroke-width="3.6">' + rings + '</g><g stroke="#d4202a" stroke-width="1.6">' + rings + '</g></svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '") 13 13,crosshair';
  }
  var styleEl = el('style'); styleEl.id = 'hmr-dock-css'; styleEl.textContent = css.replace('CURSOR', cursorURL()); doc.head.appendChild(styleEl);

  styleEl.textContent += [
    '.hmr-again{pointer-events:auto;position:fixed;left:50%;transform:translateX(-50%);bottom:calc(' + BASE + ' + 66px);max-width:calc(100vw - 24px);background:#111;color:#fff;border:2px solid #fff;border-radius:999px;padding:7px 14px;font:700 13px/1.1 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:34px}',
    '.hmr-again[hidden]{display:none}.hmr-again:hover{background:#1d4ed8}',
    '.hmr-fzm{position:fixed;left:50%;bottom:calc(' + BASE + ' + 64px);transform:translateX(-50%);z-index:99992;width:min(680px,calc(100vw - 24px));max-height:min(80vh,calc(100vh - 110px));overflow:auto;overscroll-behavior:contain;background:#fff;color:#111;border:2px solid #111;border-radius:16px;padding:12px;box-shadow:0 14px 44px rgba(0,0,0,.45);font:500 13px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;text-align:left;text-transform:none;letter-spacing:0}',
    '.hmr-fzm[hidden]{display:none}.hmr-fzm *{box-sizing:border-box;font-family:inherit}',
    '.hmr-fzm .hd{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:800;font-size:17px;margin:0 0 2px}',
    '.hmr-fzm .x{min-width:34px;min-height:34px;border:1px solid #bbb;background:#f6f6f6;color:#111;border-radius:8px;font-size:20px;line-height:1;cursor:pointer;padding:0 8px}',
    '.hmr-fzm h3{display:block;position:relative;clear:both;float:none;margin:14px 0 6px;padding:0;font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#555;line-height:1.2}',
    '.hmr-fzm .hmr-fplay{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;position:relative;float:none;margin:0;padding:0;transform:none;height:auto;clear:both}',
    '.hmr-fzm .hmr-fcard{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-height:84px;height:auto;width:auto;position:static;float:none;margin:0;transform:none;padding:10px;border:2px solid #111;border-radius:12px;background:linear-gradient(135deg,#fff0f6,#fff4dc);color:#111;cursor:pointer;text-align:left;font-size:14px;font-weight:800;line-height:1.2}',
    '.hmr-fzm .hmr-fcard small{font-weight:500;font-size:12px;color:#444}',
    '.hmr-fzm .hmr-fcard svg{width:22px;height:22px;fill:none;stroke:#c2185b;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
    '.hmr-fzm .hmr-fgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;position:relative;float:none;margin:0;padding:0;transform:none;height:auto;clear:both}',
    '.hmr-fzm .hmr-ffb{display:flex;align-items:center;gap:8px;min-height:40px;height:auto;width:auto;position:static;float:none;margin:0;transform:none;padding:6px 8px;border:1px solid #cfd6e4;background:#f4f7fc;color:#111;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;text-align:left;line-height:1.15}',
    '.hmr-fzm .hmr-ffb svg{width:20px;height:20px;flex:none;fill:none;stroke:#1d4ed8;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
    '.hmr-fzm .hmr-ffb:hover,.hmr-fzm .hmr-fcard:hover{filter:brightness(.95)}',
    '.hmr-fzm button:focus-visible,.hmr-pov button:focus-visible,.hmr-pov a:focus-visible,.hmr-again:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}',
    '@media (max-width:600px){.hmr-fzm{left:' + LEFT + ';right:' + RIGHT + ';transform:none;width:auto;max-height:min(72vh,calc(100vh - 110px))}.hmr-fzm .hmr-fplay{grid-template-columns:1fr}.hmr-fzm .hmr-fcard{min-height:56px}.hmr-fzm .hmr-fgrid{grid-template-columns:1fr 1fr}}',
    '@media (pointer:coarse){.hmr-fzm .hmr-ffb{min-height:44px}}',
    '.hmr-pov{position:fixed;left:0;top:0;right:0;bottom:0;z-index:99996;background:rgba(4,4,10,.84);display:flex;align-items:center;justify-content:center;font:600 14px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}',
    '.hmr-pov .win{position:relative;display:flex;flex-direction:column;width:min(96vw,640px);height:96vh;height:96dvh;background:#0b0b10;border-radius:16px;overflow:hidden;box-shadow:0 20px 70px rgba(0,0,0,.6)}',
    '.hmr-pov .win>.x{position:absolute;top:6px;right:6px;z-index:3;width:42px;height:42px;min-width:42px;min-height:42px;border:2px solid #fff;border-radius:50%;background:#111;color:#fff;font-size:28px;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.5);transition:none;transform:none}.hmr-pov .win>.x:hover{background:#b91c1c;transform:none}',
    '.hmr-pov .bar{display:flex;align-items:center;gap:8px;padding:6px 56px 6px 12px;background:#111;color:#fff;min-height:54px;flex:none}.hmr-pov .bar a{font-size:12px;font-weight:600;text-decoration:underline;white-space:nowrap;transition:none;animation:none;transform:none}.hmr-pov .bar b{flex:1 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.hmr-pov .bar a,.hmr-pov .msg a{color:#9ec5ff;font-weight:700}',
    '.hmr-pov .zb{flex:none;width:36px;height:36px;min-width:36px;min-height:36px;padding:0;border:2px solid #fff;border-radius:50%;background:#222;color:#fff;font-size:22px;line-height:1;font-weight:700;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:none;transform:none}.hmr-pov .zb:hover{background:#1d4ed8;transform:none}',
    '.hmr-pov .zl{flex:none;min-width:38px;text-align:center;font-size:12px;font-weight:700;color:#cbd5e1}',
    '.hmr-pov .fw{position:relative;flex:1 1 auto;min-height:0;overflow:hidden;background:#fff}',
    '.hmr-pov .fw iframe{position:absolute;left:0;top:0;border:0;width:100%;height:100%;background:#fff;transform-origin:0 0}',
    '.hmr-pov .msg{padding:24px;color:#fff;text-align:center}',
    'html.hmr-pov-on{overflow:hidden}'
  ].join('');


  // ------------------------------------------------------------------ dock elements
  var dock = el('div', 'hmr-dock'); dock.setAttribute('data-hmr-dock', '');
  var fzBtn = el('button', 'hmr-fzbtn', 'Funsies'); fzBtn.type = 'button'; fzBtn.id = 'hmr-funsies'; fzBtn.setAttribute('aria-haspopup', 'dialog'); fzBtn.setAttribute('aria-expanded', 'false'); fzBtn.setAttribute('aria-controls', 'hmr-fzm');
  var again = el('button', 'hmr-again'); again.type = 'button'; again.hidden = true;
  var rxBtn = el('button', 'hmr-rxbtn'); rxBtn.type = 'button'; rxBtn.id = 'hmr-react';
  rxBtn.setAttribute('aria-haspopup', 'dialog'); rxBtn.setAttribute('aria-expanded', 'false'); rxBtn.setAttribute('aria-controls', 'hmr-rxp');
  rxBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><circle cx="8.8" cy="10" r=".6" fill="currentColor"/><circle cx="15.2" cy="10" r=".6" fill="currentColor"/><path d="M7.6 14.2c1.2 2 3 2.9 4.4 2.9s3.2-.9 4.4-2.9"/></svg><span>React</span>';
  dock.appendChild(fzBtn); dock.appendChild(rxBtn); dock.appendChild(again);

  // ------------------------------------------------------------------ React: log, target, panel
  var LOGKEY = 'hmr-react-log-v1', TIPKEY = 'hmr-react-tip-off';
  var NEG = { 'Dislike': 1, 'Mad': 1, 'Sad': 1, 'Worried': 1, 'Afraid': 1, 'Confused': 1, 'Skeptical': 1, 'Disappointed': 1, 'Frustrated': 1, 'Burn it all': 1, 'Dragons burn it all': 1 };
  var DEFAULT_EMOTIONS = ['Mad', 'Excited', 'Sad', 'Happy', 'Worried', 'Hopeful', 'Confused', 'Curious', 'Frustrated', 'Inspired', 'Disappointed', 'Grateful', 'Skeptical', 'Amazed', 'Dragons', 'Burn it all'];
  var EMOJI = { 'Like': '👍', 'Dislike': '👎', 'Mad': '😠', 'Excited': '🤩', 'Sad': '😢', 'Happy': '😊', 'Worried': '😟', 'Hopeful': '🤞', 'Confused': '😕', 'Curious': '🧐', 'Frustrated': '😤', 'Inspired': '💡', 'Disappointed': '😞', 'Grateful': '🙏', 'Skeptical': '🤨', 'Amazed': '😲', 'Afraid': '😨', 'Dragons': '🐉', 'Burn it all': '🔥', 'Dragons burn it all': '🐉' };
  var REACT_FX = { 'Dragons': 'dragons', 'Dragons burn it all': 'dragons', 'Burn it all': 'burn' };   // chips that run one of the Funsies page animations
  var panel = null, stEl = null, aim = false, target = null, markEl = null, tipShown = false, rxLastName = '';

  function selPath(e) {
    var parts = [], n = 0;
    while (e && e.nodeType === 1 && e !== doc.body && e !== root && n < 4) {
      var s = e.tagName.toLowerCase();
      if (e.id && /^[\w-]+$/.test(e.id)) { parts.unshift(s + '#' + e.id); break; }
      var cl = (e.getAttribute('class') || '').trim().split(/\s+/).filter(function (x) { return x && /^[\w-]+$/.test(x) && !/^(hmr|rx-)/.test(x); }).slice(0, 2);
      if (cl.length) s += '.' + cl.join('.');
      var p = e.parentElement;
      if (p) { var same = [].filter.call(p.children, function (x) { return x.tagName === e.tagName; }); if (same.length > 1) s += ':nth-of-type(' + (same.indexOf(e) + 1) + ')'; }
      parts.unshift(s); e = p; n++;
    }
    return parts.join(' > ');
  }
  function nearestHeading(e) {
    var best = null, hs = doc.querySelectorAll('h1,h2,h3,h4');
    for (var i = 0; i < hs.length; i++) {
      var h = hs[i];
      if (h === e || h.contains(e) || (e.compareDocumentPosition(h) & 2)) best = h; else break;
    }
    return best ? (best.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) : '';
  }
  function describe(e, px, py) {
    if (e && e.nodeType !== 1) e = e.parentElement;
    var W = Math.max(root.scrollWidth, innerWidth), H = Math.max(root.scrollHeight, innerHeight);
    return {
      selector: selPath(e), heading: nearestHeading(e),
      text: ((e.innerText || e.textContent || '') + '').replace(/\s+/g, ' ').trim().slice(0, 80),
      x: Math.round(px / W * 1000) / 10, y: Math.round(py / H * 1000) / 10, px: px, py: py
    };
  }
  function readLog() { try { var a = JSON.parse(lsGet(LOGKEY) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  function record(name, tg) {
    var rec = { reaction: name, path: location.pathname, t: new Date().toISOString(), target: tg ? { selector: tg.selector, heading: tg.heading, text: tg.text, x: tg.x, y: tg.y } : null };
    try { var a = readLog(); a.push(rec); lsSet(LOGKEY, JSON.stringify(a.slice(-200))); } catch (e) { }
    return rec;
  }

  function setStatus(t) { if (stEl) stEl.textContent = t; }
  function clearMark() { if (markEl) { markEl.remove(); markEl = null; } target = null; }
  function markAt(px, py) {
    if (!markEl) {
      markEl = el('div', 'hmr-mark'); markEl.setAttribute('aria-hidden', 'true');
      markEl.innerHTML = '<svg viewBox="0 0 26 26" fill="none"><g stroke="#fff" stroke-width="3.6"><circle cx="13" cy="13" r="11"/><circle cx="13" cy="13" r="7"/><circle cx="13" cy="13" r="3"/></g><g stroke="#d4202a" stroke-width="1.6"><circle cx="13" cy="13" r="11"/><circle cx="13" cy="13" r="7"/><circle cx="13" cy="13" r="3"/></g></svg>';
      root.appendChild(markEl);
    }
    markEl.style.left = px + 'px'; markEl.style.top = py + 'px';
  }
  function insideDock(t) {
    if (!t || !t.closest) return false;
    if (t.closest('[data-hmr-ui],.hmr-dock,.hmr-rxp,.hmr-mark,.hmr-fzm,.hmr-pov,.hmr-again,.hmr-fbp,.hmr-spk,.hmr-hlm,.hmr-dx,.hmr-toast')) return true;
    try { if (ds && t.closest(ds)) return true; if (ps && t.closest(ps)) return true; } catch (e) { }
    return false;
  }
  function onAimClick(e) {
    if (!aim || insideDock(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    var px = e.pageX, py = e.pageY;
    if (px == null) { px = e.clientX + scrollX; py = e.clientY + scrollY; }
    var tg0 = (e.composedPath && e.composedPath()[0]) || e.target; if (!tg0 || tg0.nodeType !== 1) tg0 = e.target;
    target = describe(tg0, px, py); markAt(px, py);
    setStatus('Spot marked' + (target.heading ? ' near "' + target.heading.slice(0, 40) + '"' : '') + '. Now pick a reaction.');
  }
  function startAim() {
    if (aim) return; aim = true; root.classList.add('hmr-aim');
    doc.addEventListener('click', onAimClick, true);
    setStatus(coarse() ? 'Tap the spot, then pick a reaction. Or just pick a reaction.' : 'Click the spot, then pick a reaction. Or just pick a reaction.');
  }
  function stopAim() { aim = false; root.classList.remove('hmr-aim'); doc.removeEventListener('click', onAimClick, true); }

  function emotions() { var a = (window.hmrReact && window.hmrReact.emotions && window.hmrReact.emotions.length) ? window.hmrReact.emotions.slice() : DEFAULT_EMOTIONS; return a.filter(function (n) { return n !== 'Like' && n !== 'Dislike'; }); }   // thumbs are replaced by the hate / neutral / love slider
  function rateWord(v) { v = +v || 0; return v <= -4 ? 'Hate it' : v < 0 ? 'Dislike it' : v === 0 ? 'Neutral' : v < 4 ? 'Like it' : 'Love it'; }
  // a hate to love slider, neutral in the middle; returns { el, input, set(v), get() }
  var rsN = 0;
  function rateSlider(label, onInput) {
    var id = 'hmr-rate' + (++rsN), w = el('div', 'hmr-rate'), lb = el('label', '', label), inp = el('input'), row = el('div', 'rl'), out = el('span', 'rv');
    lb.setAttribute('for', id); inp.type = 'range'; inp.id = id; inp.min = '-5'; inp.max = '5'; inp.step = '1'; inp.value = '0';
    ['Hate', 'Neutral', 'Love'].forEach(function (t) { row.appendChild(el('span', '', t)); });
    function sync() { out.textContent = rateWord(inp.value); inp.setAttribute('aria-valuetext', rateWord(inp.value)); }
    inp.addEventListener('input', function () { sync(); if (onInput) onInput(+inp.value); });
    w.appendChild(lb); w.appendChild(inp); w.appendChild(row); w.appendChild(out); sync();
    return { el: w, input: inp, get: function () { return +inp.value; }, set: function (v) { inp.value = String(clamp(+v || 0, -5, 5)); sync(); } };
  }
  function buildPanel() {
    panel = el('div', 'hmr-rxp'); panel.id = 'hmr-rxp'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'React');
    var hd = el('div', 'hd'); hd.appendChild(el('span', '', 'How does this make you feel?'));
    var x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close reactions'); x.addEventListener('click', function () { closeRx(true); });
    hd.appendChild(x); panel.appendChild(hd);
    hd.parentNode.insertBefore(el('p', 'hmr-deal', 'A two-way deal: your signal helps the builders improve sites for free, and you get better sites back.'), hd.nextSibling);
    var tip = el('div', 'tip'); tip.id = 'hmr-rxtip'; tip.hidden = true;
    tip.innerHTML = '<p>Click the spot you\'re reacting to, then pick a reaction. Or just pick a reaction.</p><label><input type="checkbox" id="hmr-rxtip-off"> Don\'t show this again</label>';
    tip.querySelector('input').addEventListener('change', function (ev) { if (ev.target.checked) lsSet(TIPKEY, '1'); else { try { localStorage.removeItem(TIPKEY); } catch (e) { } } });
    panel.appendChild(tip);
    stEl = el('p', 'st'); stEl.setAttribute('role', 'status'); stEl.setAttribute('aria-live', 'polite'); panel.appendChild(stEl);
    var rs0 = rateSlider('How much do you love or hate this?'); rs0.el.classList.add('hmr-rxrate'); panel.appendChild(rs0.el);
    var rsb = el('button', 'hmr-sendr', 'Send my rating'); rsb.type = 'button';
    rsb.addEventListener('click', function () { var v = rs0.get(); pick(v === 0 ? 'Neutral' : (v < 0 ? 'Hate ' : 'Love ') + Math.abs(v), { neg: v < 0, plain: true }); });
    panel.appendChild(rsb);
    var grid = el('div', 'grid'); grid.setAttribute('role', 'group'); grid.setAttribute('aria-label', 'Reactions');
    emotions().forEach(function (n) {
      var b = el('button', 'chip ' + (NEG[n] ? 'neg' : 'pos')); b.type = 'button'; b.setAttribute('data-e', n);
      if (EMOJI[n]) { var em = el('span', '', EMOJI[n]); em.setAttribute('aria-hidden', 'true'); b.appendChild(em); b.appendChild(doc.createTextNode(' ')); }
      b.appendChild(doc.createTextNode(n));
      b.addEventListener('click', function () { pick(n); });
      grid.appendChild(b);
    });
    panel.appendChild(grid);
    var r2 = el('div', 'row2');
    var clr = el('button', '', 'Clear spot'); clr.type = 'button'; clr.addEventListener('click', function () { clearMark(); setStatus('Spot cleared. Click another spot, or pick a reaction.'); });
    var rs = el('button', '', 'Reset page'); rs.type = 'button'; rs.hidden = !(window.hmrReact && window.hmrReact.resetNow);
    rs.addEventListener('click', function () { try { window.hmrReact.resetNow(); } catch (e) { } closeRx(true); });
    r2.appendChild(clr); r2.appendChild(rs); panel.appendChild(r2);
    doc.body.appendChild(panel);
  }
  function openRx() {
    if (!panel) buildPanel();
    try { if (window.HMRDash) window.HMRDash.closeQuiet(); } catch (e) { }
    stopFunsies(true); closeFz(false); closeSheet(false); closeSpeak(false); hideHlm();
    panel.hidden = false; rxBtn.setAttribute('aria-expanded', 'true');
    var tip = panel.querySelector('#hmr-rxtip');
    if (lsGet(TIPKEY) !== '1' && !tipShown) { tip.hidden = false; tipShown = true; } else tip.hidden = true;
    startAim();
    var f = panel.querySelector('.chip'); if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
  }
  function closeRx(focusBack) {
    stopAim(); clearMark();
    if (panel) panel.hidden = true;
    rxBtn.setAttribute('aria-expanded', 'false');
    if (focusBack) { try { rxBtn.focus({ preventScroll: true }); } catch (e) { rxBtn.focus(); } }
  }
  function pick(name, o) {
    o = o || {};
    if (window.hmrReact && window.hmrReact.phase && window.hmrReact.phase() !== 'idle') { setStatus('Still reacting. Try again in a moment.'); return; }
    var tg = target; record(name, tg);
    var pt = tg ? { x: tg.px - scrollX, y: tg.py - scrollY } : null;
    closeRx(true);
    requestAnimationFrame(function () {
      try {
        if (o.plain) { if (name !== 'Neutral') softFx(name, !!o.neg, pt); }
        else if (REACT_FX[name] && effByName(REACT_FX[name])) runEffect(REACT_FX[name]);
        else if (window.hmrReact && window.hmrReact.press && window.hmrReact.emotions.indexOf(name) >= 0) window.hmrReact.press(name);
        else softFx(name, !!NEG[name], pt);
      } catch (e) { try { console.warn('hmr-dock react', e); } catch (e2) { } }
    });
  }
  rxBtn.addEventListener('click', function () { if (panel && !panel.hidden) closeRx(true); else openRx(); });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (panel && !panel.hidden || aim) { closeRx(true); }
    if (FZ.cur) stopFunsies(true);
  });

  // ------------------------------------------------------------------ the reaction animation for sites without fx-react.js
  var softCv = null, softRaf = 0, softTimer = 0;
  function tintFor(name) { var h = 0; for (var i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360; return h; }
  function softFx(name, neg, pt) {
    stopSoft();
    var W = innerWidth, H = innerHeight;
    if (rm()) {
      var f = el('div'); f.style.cssText = 'position:fixed;inset:0;z-index:99980;pointer-events:none;transition:opacity .9s;opacity:.18;background:' + (neg ? '#c0392b' : '#f2b138'); doc.body.appendChild(f);
      requestAnimationFrame(function () { f.style.opacity = '0'; }); softTimer = setTimeout(function () { f.remove(); }, 1000); return;
    }
    var cv = el('canvas', 'hmr-fzcanvas'); cv.setAttribute('aria-hidden', 'true'); var DPR = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * DPR; cv.height = H * DPR; doc.body.appendChild(cv); softCv = cv;
    var cx = cv.getContext('2d'); cx.scale(DPR, DPR);
    var hue = tintFor(name), ps = [], n = neg ? 110 : 150, ox = pt ? pt.x : W / 2, oy = pt ? pt.y : H * .8;
    for (var i = 0; i < n; i++) {
      if (neg) ps.push({ x: rnd(0, W), y: rnd(-H * .5, 0), vx: rnd(-30, 30), vy: rnd(120, 380), s: rnd(2, 6), r: rnd(0, 6), vr: rnd(-6, 6), c: 'hsl(' + rnd(0, 25) + ',70%,' + rnd(18, 40) + '%)', sq: true });
      else if (i < n * .45) { var a = rnd(0, 6.283), sp = rnd(120, 560); ps.push({ x: ox, y: oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, g: 520, s: rnd(3, 7), r: rnd(0, 6), vr: rnd(-9, 9), c: 'hsl(' + ((hue + rnd(-40, 40) + 360) % 360) + ',90%,58%)', sq: Math.random() < .6 }); }
      else ps.push({ x: rnd(0, W), y: rnd(-H * .4, 0), vx: rnd(-40, 40), vy: rnd(100, 320), g: 60, s: rnd(3, 7), r: rnd(0, 6), vr: rnd(-8, 8), c: 'hsl(' + ((hue + rnd(-60, 60) + 360) % 360) + ',90%,60%)', sq: Math.random() < .6 });
    }
    var t0 = performance.now(), last = t0, DUR = neg ? 2600 : 2800;
    function frame(now) {
      var dt = Math.min(.04, (now - last) / 1000); last = now; var u = (now - t0) / DUR;
      cx.clearRect(0, 0, W, H);
      if (neg) { var a2 = Math.sin(Math.min(1, u) * Math.PI) * .32, g = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .75); g.addColorStop(0, 'rgba(120,0,0,0)'); g.addColorStop(1, 'rgba(120,0,0,' + a2 + ')'); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
      cx.globalAlpha = clamp(1.4 - u * 1.2, 0, 1);
      ps.forEach(function (p) { p.vy += (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.r); cx.fillStyle = p.c; if (p.sq) cx.fillRect(-p.s, -p.s / 2, p.s * 2, p.s); else { cx.beginPath(); cx.arc(0, 0, p.s / 1.6, 0, 6.283); cx.fill(); } cx.restore(); });
      cx.globalAlpha = 1;
      if (u < 1) softRaf = requestAnimationFrame(frame); else stopSoft();
    }
    softRaf = requestAnimationFrame(frame);
  }
  function stopSoft() { cancelAnimationFrame(softRaf); clearTimeout(softTimer); if (softCv) { softCv.remove(); softCv = null; } }

  // ------------------------------------------------------------------ Funsies
  var FZ = { cur: null, name: '', timer: 0 };
  var AC = null;
  function pop() {
    if (!CFG.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      var t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(rnd(650, 1050), t); o.frequency.exponentialRampToValueAtTime(160, t + .09);
      g.gain.setValueAtTime(.1, t); g.gain.exponentialRampToValueAtTime(.001, t + .11);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + .13);
    } catch (e) { }
  }
  function layer(pass) {
    var cv = el('canvas', 'hmr-fzcanvas'); cv.setAttribute('aria-hidden', 'true'); var DPR = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * DPR; cv.height = innerHeight * DPR; cv.style.pointerEvents = (!pass && coarse()) ? 'auto' : 'none';
    doc.body.appendChild(cv); var cx = cv.getContext('2d'); cx.setTransform(DPR, 0, 0, DPR, 0, 0);
    return { cv: cv, cx: cx, W: innerWidth, H: innerHeight };
  }
  // a loop that stops itself, plus a list of things to undo
  function Session() {
    var s = { undo: [], raf: 0, dead: false, t0: performance.now() };
    s.on = function (target, ev, fn, opt) { target.addEventListener(ev, fn, opt); s.undo.push(function () { target.removeEventListener(ev, fn, opt); }); };
    s.loop = function (fn) { var last = performance.now(); function f(now) { if (s.dead) return; var dt = Math.min(.034, (now - last) / 1000); last = now; var r = fn(dt, (now - s.t0) / 1000); if (r === false) { stopFunsies(); return; } s.raf = requestAnimationFrame(f); } s.raf = requestAnimationFrame(f); };
    s.stop = function () { s.dead = true; cancelAnimationFrame(s.raf); s.undo.reverse().forEach(function (u) { try { u(); } catch (e) { } }); s.undo = []; };
    s.on(window, 'resize', function () { stopFunsies(); });
    s.on(doc, 'visibilitychange', function () { if (doc.hidden) stopFunsies(); });
    return s;
  }

  // pick things on screen that can move without breaking the page
  var LEAFOK = /^(B|I|EM|STRONG|SPAN|A|CODE|BR|SUP|SUB|SMALL|MARK|ABBR|U|S)$/;
  function pickEls(max) {
    var W = root.clientWidth, H = innerHeight, out = [];
    var all = (genRoot() || doc.body).querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,img,svg,button,a,input,textarea,label,figure,td,th,summary,code,pre,blockquote,span,b,strong,em,canvas,video,small,dt,dd,div,select');
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.closest('[data-hmr-dock],[data-hmr-ui],.hmr-rxp,.hmr-fzcanvas,.hmr-mark,.hmr-fzm,.hmr-pov,.hmr-again,.hmr-fbp,.hmr-spk,.hmr-hlm,.hmr-dx,.hmr-toast,.hmr-sp') || (e.namespaceURI && e.namespaceURI.indexOf('svg') >= 0 && e.tagName.toLowerCase() !== 'svg')) continue;
      var tag = e.tagName, media = /^(IMG|svg|CANVAS|VIDEO|BUTTON|INPUT|TEXTAREA|SELECT)$/i.test(tag);
      if (!media) { var leaf = true; for (var k = 0; k < e.children.length; k++) if (!LEAFOK.test(e.children[k].tagName)) { leaf = false; break; } if (!leaf) continue; if (!(e.textContent || '').trim()) continue; }
      var r = e.getBoundingClientRect();
      if (r.width < 14 || r.height < 10 || r.width > W + 1 || r.height > H * .45 || r.top < 0 || r.bottom > H || r.left < 0 || r.right > W) continue;
      var bad = false; for (var j = 0; j < out.length; j++) if (out[j].contains(e) || e.contains(out[j])) { bad = true; break; }
      if (bad) continue;
      var cs = getComputedStyle(e); if (cs.visibility !== 'visible' || +cs.opacity === 0 || cs.display === 'none') continue;
      var a = e, fixed = false; while (a && a !== doc.body) { var p = getComputedStyle(a).position; if (p === 'fixed' || p === 'sticky') { fixed = true; break; } a = a.parentElement; }
      if (fixed) continue;
      out.push(e);
      if (out.length > 400) break;
    }
    for (var m = out.length - 1; m > 0; m--) { var q = (Math.random() * (m + 1)) | 0, t = out[m]; out[m] = out[q]; out[q] = t; }
    return out.slice(0, max);
  }
  // element physics: acc(t, item, ctx) returns [ax, ay] in px/s^2 (y down)
  function elemPhysics(S, o) {
    var els = pickEls(o.max || 60); if (!els.length && !o.draw) return false;
    var W = root.clientWidth, H = innerHeight, sy0 = scrollY, sx0 = scrollX, ptr = { x: W / 2, y: H / 2, down: false }, L = null;
    if (o.draw) { L = layer(true); S.undo.push(function () { L.cv.remove(); }); }
    root.classList.add('hmr-fz-on');
    var items = els.map(function (e) {
      var r = e.getBoundingClientRect(), iw = r.right - r.left, ih = r.bottom - r.top, ins = (ih * .4695 + iw * .1171) / 2 + 1;
      var it = { e: e, ins: (W - iw > 2 * ins + 2 && H - ih > 2 * ins + 2) ? ins : 0, l: r.left, t: r.top, r: r.right, b: r.bottom, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, sv: [e.style.getPropertyValue('translate'), e.style.getPropertyValue('rotate'), e.style.getPropertyValue('transition'), e.style.getPropertyValue('scale')] };
      if (o.init) o.init(it); if (!it.ins) it.va = 0; e.style.setProperty('transition', 'none'); return it;
    });
    S.undo.push(function () { items.forEach(function (it) { ['translate', 'rotate', 'transition', 'scale'].forEach(function (p, i) { if (it.sv[i]) it.e.style.setProperty(p, it.sv[i]); else it.e.style.removeProperty(p); }); }); root.classList.remove('hmr-fz-on'); });
    S.on(doc, 'pointermove', function (ev) { ptr.x = ev.clientX; ptr.y = ev.clientY; }, { passive: true });
    S.on(doc, 'pointerdown', function (ev) { ptr.x = ev.clientX; ptr.y = ev.clientY; ptr.down = true; }, { passive: true });
    S.on(window, 'pointerup', function () { ptr.down = false; }, { passive: true });
    var vis = 1, phase = 'play', rt = 0, back = .9;
    S.loop(function (dt, t) {
      var dy = scrollY - sy0, dx = scrollX - sx0;
      if (phase === 'play' && t > o.dur) { phase = 'back'; rt = 0; items.forEach(function (it) { it.x0 = it.x; it.y0 = it.y; it.a0 = it.a; }); }
      if (phase === 'play') {
        if (o.step) o.step(dt, t, ptr, W, H, items);
        var damp = Math.exp(-(o.damp || 0) * dt);
        items.forEach(function (it) {
          var ac = o.acc(t, it, ptr, W, H); it.vx = (it.vx + ac[0] * dt) * damp; it.vy = (it.vy + ac[1] * dt) * damp;
          it.x += it.vx * dt; it.y += it.vy * dt; it.a = it.ins ? clamp(it.a + it.va * dt, -28, 28) : 0;
          var mnx = -it.l - dx + it.ins, mxx = W - it.r - dx - it.ins, mny = -it.t - dy + it.ins, mxy = H - it.b - dy - it.ins, rs = o.rest == null ? .5 : o.rest;
          if (it.x < mnx) { it.x = mnx; it.vx = Math.abs(it.vx) * rs; } else if (it.x > mxx) { it.x = mxx; it.vx = -Math.abs(it.vx) * rs; }
          if (it.y < mny) { it.y = mny; it.vy = Math.abs(it.vy) * rs; } else if (it.y > mxy) { it.y = mxy; it.vy = -Math.abs(it.vy) * rs; it.va *= .7; if (o.spinOnHit) it.va += rnd(-60, 60) * (Math.abs(it.vy) > 80 ? 1 : 0); }
        });
      } else {
        rt += dt; var u = clamp(rt / back, 0, 1), k = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
        items.forEach(function (it) { it.x = it.x0 * (1 - k); it.y = it.y0 * (1 - k); it.a = it.a0 * (1 - k); if (it.sx != null) { it.sx = 1 + (it.sx - 1) * (1 - k); it.sy = 1 + (it.sy - 1) * (1 - k); } }); vis = 1 - k;
        if (u >= 1) { stopFunsies(); return false; }
      }
      items.forEach(function (it) { it.e.style.setProperty('translate', it.x.toFixed(1) + 'px ' + it.y.toFixed(1) + 'px'); it.e.style.setProperty('rotate', it.a.toFixed(1) + 'deg'); if (it.sx != null) it.e.style.setProperty('scale', it.sx.toFixed(3) + ' ' + it.sy.toFixed(3)); });
      if (L) { L.cx.setTransform(L.cv.width / L.W, 0, 0, L.cv.height / L.H, 0, 0); L.cx.clearRect(0, 0, L.W, L.H); L.cx.globalCompositeOperation = 'source-over'; L.cx.globalAlpha = 1; L.cv.style.opacity = vis; o.draw(L.cx, t, items, W, H, ptr, vis); }
    });
    return true;
  }

  var EFFECTS = [
    { name: 'float', run: function (S) {   // everything loses gravity, drifts, then settles back
      return elemPhysics(S, { dur: 6, damp: .25, rest: .6, max: 70, init: function (it) { it.vx = rnd(-40, 40); it.vy = rnd(-60, -10); it.va = rnd(-14, 14); }, acc: function (t, it) { return [Math.sin(t * .9 + it.l) * 10, -14]; } });
    } },
    { name: 'tilt', run: function (S) {    // the page tilts, things slide to one side, then the other
      return elemPhysics(S, { dur: 6.5, damp: .9, rest: .35, max: 70, init: function (it) { it.va = rnd(-4, 4); }, acc: function (t) { return [Math.sin(t * 1.15) * 1500, 260]; } });
    } },
    { name: 'drop', run: function (S) {    // everything falls to the bottom of the screen and piles up
      return elemPhysics(S, { dur: 4.2, damp: .05, rest: .38, max: 70, spinOnHit: true, init: function (it) { it.vy = rnd(-60, 0); it.va = rnd(-20, 20); }, acc: function () { return [0, 1500]; } });
    } },
    { name: 'magnet', run: function (S) {  // everything is drawn toward the pointer and orbits it
      return elemPhysics(S, { dur: 6.5, damp: 1.1, rest: .5, max: 60, init: function (it) { it.vx = rnd(-80, 80); it.vy = rnd(-80, 80); it.va = rnd(-30, 30); }, acc: function (t, it, p) { var cx = it.l + (it.r - it.l) / 2 + it.x, cy = it.t + (it.b - it.t) / 2 + it.y, dx = p.x - cx, dy = p.y - cy, d = Math.max(60, Math.sqrt(dx * dx + dy * dy)); return [dx / d * 900, dy / d * 900]; } });
    } },
    { name: 'balls', run: function (S) {    // a burst of bouncing balls you can flick
      var L = layer(); S.undo.push(function () { L.cv.remove(); });
      var W = L.W, H = L.H, cx = L.cx, balls = [], drag = null, hist = [];
      for (var i = 0; i < 30; i++) { var r = rnd(10, 22); balls.push({ x: W / 2 + rnd(-30, 30), y: H - 80, vx: rnd(-700, 700), vy: rnd(-1500, -700), r: r, h: (i * 47 + rnd(0, 30)) % 360 }); }
      function hit(x, y) { var best = null, bd = 1e9; balls.forEach(function (b) { var d = Math.hypot(b.x - x, b.y - y); if (d < b.r + 18 && d < bd) { bd = d; best = b; } }); return best; }
      S.on(doc, 'pointerdown', function (e) { var b = hit(e.clientX, e.clientY); if (b) { drag = b; hist = [[e.clientX, e.clientY, performance.now()]]; swallow(S); e.preventDefault(); } }, true);
      S.on(window, 'pointermove', function (e) { if (drag) { hist.push([e.clientX, e.clientY, performance.now()]); if (hist.length > 6) hist.shift(); drag.x = e.clientX; drag.y = e.clientY; drag.vx = drag.vy = 0; } });
      S.on(window, 'pointerup', function () { if (drag && hist.length > 1) { var a = hist[0], z = hist[hist.length - 1], dt = Math.max(.016, (z[2] - a[2]) / 1000); drag.vx = clamp((z[0] - a[0]) / dt, -2600, 2600); drag.vy = clamp((z[1] - a[1]) / dt, -2600, 2600); } drag = null; });
      var end = 10;
      S.loop(function (dt, t) {
        cx.clearRect(0, 0, W, H); var fade = t > end - 1 ? clamp(end - t, 0, 1) : 1; cx.globalAlpha = fade;
        balls.forEach(function (b) {
          if (b !== drag) { b.vy += 1700 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
            if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * .85; } if (b.x > W - b.r) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * .85; }
            if (b.y > H - b.r) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * .78; b.vx *= .985; if (Math.abs(b.vy) < 40) b.vy = 0; } if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * .8; } }
          var g = cx.createRadialGradient(b.x - b.r * .35, b.y - b.r * .4, b.r * .1, b.x, b.y, b.r);
          g.addColorStop(0, 'hsl(' + b.h + ',95%,80%)'); g.addColorStop(1, 'hsl(' + b.h + ',80%,45%)');
          cx.fillStyle = g; cx.beginPath(); cx.arc(b.x, b.y, b.r, 0, 6.283); cx.fill(); cx.strokeStyle = 'rgba(0,0,0,.25)'; cx.lineWidth = 1; cx.stroke();
        });
        cx.globalAlpha = 1; if (t > end) return false;
      });
      return true;
    } },
    { name: 'bubbles', run: function (S) {   // a field of bubbles to pop
      var L = layer(); S.undo.push(function () { L.cv.remove(); });
      var W = L.W, H = L.H, cx = L.cx, bs = [], drops = [], end = 10;
      function spawn(y) { bs.push({ x: rnd(20, W - 20), y: y, r: rnd(16, 46), vy: rnd(-70, -30), ph: rnd(0, 6.28), w: rnd(14, 40), h: rnd(170, 260) }); }
      for (var i = 0; i < 30; i++) spawn(rnd(H * .2, H + 40));
      S.on(doc, 'pointerdown', function (e) {
        for (var i = bs.length - 1; i >= 0; i--) { var b = bs[i], bx = b.x + Math.sin(b.ph) * b.w, d = Math.hypot(bx - e.clientX, b.y - e.clientY);
          if (d < b.r + 8) { for (var k = 0; k < 10; k++) { var a = rnd(0, 6.28), sp = rnd(60, 220); drops.push({ x: bx, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, l: 1, h: b.h }); } bs.splice(i, 1); pop(); swallow(S); e.preventDefault(); return; } }
      }, true);
      S.loop(function (dt, t) {
        cx.clearRect(0, 0, W, H);
        if (t < end - 3 && bs.length < 36 && Math.random() < dt * 5) spawn(H + 50);
        bs.forEach(function (b) { b.y += b.vy * dt; b.ph += dt * 1.6; });
        bs = bs.filter(function (b) { return b.y > -60; });
        bs.forEach(function (b) { var x = b.x + Math.sin(b.ph) * b.w, g = cx.createRadialGradient(x - b.r * .3, b.y - b.r * .35, b.r * .05, x, b.y, b.r);
          g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(.55, 'hsla(' + b.h + ',80%,70%,.14)'); g.addColorStop(1, 'hsla(' + b.h + ',80%,60%,.5)');
          cx.fillStyle = g; cx.beginPath(); cx.arc(x, b.y, b.r, 0, 6.283); cx.fill(); cx.strokeStyle = 'hsla(' + b.h + ',80%,45%,.65)'; cx.lineWidth = 1.5; cx.stroke(); });
        drops.forEach(function (d) { d.vy += 500 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.l -= dt * 2.2; if (d.l > 0) { cx.fillStyle = 'hsla(' + d.h + ',80%,55%,' + d.l + ')'; cx.beginPath(); cx.arc(d.x, d.y, 3 * d.l + 1, 0, 6.283); cx.fill(); } });
        drops = drops.filter(function (d) { return d.l > 0; });
        if (t > end && !bs.length) return false; if (t > end + 2) return false;
      });
      return true;
    } },
    { name: 'tensegrity', run: function (S) {   // a tensegrity toy: rigid struts, springy cables, pluck it
      var L = layer(); S.undo.push(function () { L.cv.remove(); });
      var W = L.W, H = L.H, cx = L.cx, R = clamp(Math.min(W, H) * .17, 55, 110), N = [], C = [], grab = null, end = 12;
      for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3 + .26; N.push({ x: W / 2 + Math.cos(a) * R, y: H * .28 + Math.sin(a) * R }); }
      N.forEach(function (n) { n.px = n.x + rnd(-8, 8); n.py = n.y + rnd(-8, 8); });
      function link(i, j, type, k) { var d = Math.hypot(N[i].x - N[j].x, N[i].y - N[j].y); C.push({ i: i, j: j, type: type, rest: type === 'strut' ? d : d * .94, k: k }); }
      link(0, 3, 'strut', 1); link(1, 4, 'strut', 1); link(2, 5, 'strut', 1);
      for (var q = 0; q < 6; q++) { link(q, (q + 1) % 6, 'cable', .3); link(q, (q + 2) % 6, 'cable', .22); }
      function near(x, y) { var best = null, bd = 44; N.forEach(function (n) { var d = Math.hypot(n.x - x, n.y - y); if (d < bd) { bd = d; best = n; } }); if (!best) { C.forEach(function (c) { var A = N[c.i], B = N[c.j], dx = B.x - A.x, dy = B.y - A.y, u = clamp(((x - A.x) * dx + (y - A.y) * dy) / (dx * dx + dy * dy), 0, 1), d = Math.hypot(A.x + dx * u - x, A.y + dy * u - y); if (d < 14) best = u < .5 ? A : B; }); } return best; }
      S.on(doc, 'pointerdown', function (e) { var n = near(e.clientX, e.clientY); if (n) { grab = n; swallow(S); e.preventDefault(); } }, true);
      S.on(window, 'pointermove', function (e) { if (grab) { grab.x = e.clientX; grab.y = e.clientY; } });
      S.on(window, 'pointerup', function () { grab = null; });
      S.loop(function (dt, t) {
        var g = 1500 * dt * dt;
        N.forEach(function (n) { if (n === grab) { n.px = n.x; n.py = n.y; return; } var vx = (n.x - n.px) * .992, vy = (n.y - n.py) * .992; n.px = n.x; n.py = n.y; n.x += vx; n.y += vy + g; });
        for (var it = 0; it < 8; it++) {
          C.forEach(function (c) { var A = N[c.i], B = N[c.j], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, diff = d - c.rest; if (c.type === 'cable' && diff < 0) return; var f = diff / d * .5 * c.k, wa = A === grab ? 0 : 1, wb = B === grab ? 0 : 1, ws = wa + wb || 1;
            A.x += dx * f * 2 * wa / ws; A.y += dy * f * 2 * wa / ws; B.x -= dx * f * 2 * wb / ws; B.y -= dy * f * 2 * wb / ws; });
          N.forEach(function (n) { if (n === grab) return; if (n.y > H - 14) { n.y = H - 14; n.px = n.x - (n.x - n.px) * .8; } if (n.x < 14) n.x = 14; if (n.x > W - 14) n.x = W - 14; if (n.y < 14) n.y = 14; });
        }
        cx.clearRect(0, 0, W, H); var fade = t > end - 1 ? clamp(end - t, 0, 1) : 1; cx.globalAlpha = fade; cx.lineCap = 'round';
        C.forEach(function (c) { if (c.type !== 'cable') return; var A = N[c.i], B = N[c.j], tens = clamp((Math.hypot(B.x - A.x, B.y - A.y) - c.rest) / (c.rest * .2), 0, 1); cx.strokeStyle = 'rgba(' + (200 + tens * 55 | 0) + ',50,40,' + (.55 + tens * .4) + ')'; cx.lineWidth = 1.5 + tens * 1.5; cx.beginPath(); cx.moveTo(A.x, A.y); cx.lineTo(B.x, B.y); cx.stroke(); });
        C.forEach(function (c) { if (c.type !== 'strut') return; var A = N[c.i], B = N[c.j]; cx.strokeStyle = '#fff'; cx.lineWidth = 9; cx.beginPath(); cx.moveTo(A.x, A.y); cx.lineTo(B.x, B.y); cx.stroke(); cx.strokeStyle = '#1b2a41'; cx.lineWidth = 6; cx.beginPath(); cx.moveTo(A.x, A.y); cx.lineTo(B.x, B.y); cx.stroke(); });
        N.forEach(function (n) { cx.fillStyle = '#f5b301'; cx.strokeStyle = '#1b2a41'; cx.lineWidth = 2; cx.beginPath(); cx.arc(n.x, n.y, 7, 0, 6.283); cx.fill(); cx.stroke(); });
        cx.globalAlpha = 1; if (t > end) return false;
      });
      return true;
    } }
  ];
  // ================================================================== new effects (canvas or CSS, self-contained)
  function ease(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
  function hsla(h, s, l, a) { return 'hsla(' + (((h % 360) + 360) % 360 | 0) + ',' + s + '%,' + l + '%,' + (a == null ? 1 : a) + ')'; }
  function ink() { try { return getComputedStyle(doc.body).color || '#111'; } catch (e) { return '#111'; } }
  function pageWords(n) {
    var t = ''; try { t = doc.body.innerText || ''; } catch (e) { }
    var w = t.match(/[A-Za-z]{3,12}/g) || []; if (w.length < 8) w = ['fun', 'wow', 'play', 'boom', 'splash', 'zoom', 'spark', 'giggle'];
    var out = []; for (var i = 0; i < n; i++) out.push(w[(Math.random() * w.length) | 0]); return out;
  }
  function snd(kind) {
    if (!CFG.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume();
      var t = AC.currentTime, g = AC.createGain(), len = kind === 'boom' ? .6 : kind === 'whoosh' ? .7 : .18, o; g.connect(AC.destination);
      if (kind === 'buzz' || kind === 'kick') {
        o = AC.createOscillator(); o.type = kind === 'buzz' ? 'sawtooth' : 'sine'; o.frequency.setValueAtTime(130, t); if (kind === 'kick') o.frequency.exponentialRampToValueAtTime(40, t + .15);
        g.gain.setValueAtTime(kind === 'buzz' ? .012 : .1, t); g.gain.exponentialRampToValueAtTime(.001, t + (kind === 'buzz' ? .5 : .18)); o.connect(g); o.start(t); o.stop(t + .55); return;
      }
      var n = Math.floor(AC.sampleRate * len), b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0); for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
      var s = AC.createBufferSource(), f = AC.createBiquadFilter(); s.buffer = b; f.type = kind === 'zap' ? 'highpass' : kind === 'whoosh' ? 'bandpass' : 'lowpass';
      f.frequency.setValueAtTime(kind === 'zap' ? 2500 : kind === 'whoosh' ? 400 : 260, t);
      if (kind === 'whoosh') f.frequency.exponentialRampToValueAtTime(2200, t + len); if (kind === 'boom') f.frequency.exponentialRampToValueAtTime(60, t + len);
      g.gain.setValueAtTime(kind === 'whoosh' ? .025 : .07, t); g.gain.exponentialRampToValueAtTime(.001, t + len); s.connect(f); f.connect(g); s.start(t);
    } catch (e) { }
  }
  // a pool of short-lived particles
  function Fx() {
    var a = [];
    return { add: function (p) { if (a.length < 2600) a.push(p); }, size: function () { return a.length; },
      step: function (dt, draw) { for (var i = a.length - 1; i >= 0; i--) { var p = a[i]; p.l -= dt; if (p.l <= 0) { a.splice(i, 1); continue; } if (p.g) p.vy += p.g * dt; if (p.d) { var k = Math.pow(p.d, dt * 60); p.vx *= k; p.vy *= k; } p.x += p.vx * dt; p.y += p.vy * dt; draw(p, 1 - p.l / p.L); } } };
  }
  function mk(x, y, vx, vy, l, o) { var p = { x: x, y: y, vx: vx, vy: vy, l: l, L: l }; if (o) for (var k in o) p[k] = o[k]; return p; }
  function drawP(cx, p, u) {
    var m = (p.k === 'f' || p.k === 'e' || p.k === 'sp') ? 'lighter' : 'source-over'; if (cx.globalCompositeOperation !== m) cx.globalCompositeOperation = m;
    if (p.k === 'f') { cx.fillStyle = hsla(p.h - u * 30, 100, 58 - u * 20, (1 - u) * .85); cx.beginPath(); cx.arc(p.x, p.y, Math.max(.5, p.s * (1 - u * .45)), 0, 6.283); cx.fill(); }
    else if (p.k === 's') { cx.fillStyle = 'rgba(70,70,76,' + (.4 * (1 - u)).toFixed(3) + ')'; cx.beginPath(); cx.arc(p.x, p.y, p.s * (1 + u * 1.6), 0, 6.283); cx.fill(); }
    else if (p.k === 'e') { cx.fillStyle = hsla(p.h || 35, 100, 62, 1 - u); cx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); }
    else if (p.k === 'r') { cx.strokeStyle = 'rgba(255,230,180,' + ((1 - u) * .8).toFixed(3) + ')'; cx.lineWidth = 4 * (1 - u) + 1; cx.beginPath(); cx.arc(p.x, p.y, p.s * u + 1, 0, 6.283); cx.stroke(); }
    else if (p.k === 'sp') { cx.strokeStyle = hsla(p.h, 100, 65, 1 - u); cx.lineWidth = p.w || 2; cx.beginPath(); cx.moveTo(p.x - p.vx * .035, p.y - p.vy * .035); cx.lineTo(p.x, p.y); cx.stroke(); }
    else if (p.k === 'd') { cx.fillStyle = p.c; cx.globalAlpha = 1 - u; cx.beginPath(); cx.arc(p.x, p.y, p.s, 0, 6.283); cx.fill(); cx.globalAlpha = 1; }
  }
  function boom(pool, x, y, k) {
    var i, a, sp;
    for (i = 0; i < 24 * k; i++) { a = rnd(0, 6.283); sp = rnd(40, 300) * k; pool.add(mk(x, y, Math.cos(a) * sp, Math.sin(a) * sp, rnd(.35, .85), { k: 'f', h: rnd(8, 50), s: rnd(7, 17) * k, d: .93 })); }
    for (i = 0; i < 8 * k; i++) { a = rnd(0, 6.283); pool.add(mk(x, y, Math.cos(a) * rnd(10, 90), Math.sin(a) * rnd(10, 90) - 30, rnd(1, 1.9), { k: 's', s: rnd(12, 24) * k, d: .96 })); }
    for (i = 0; i < 12 * k; i++) { a = rnd(0, 6.283); sp = rnd(140, 420); pool.add(mk(x, y, Math.cos(a) * sp, Math.sin(a) * sp - 80, rnd(.7, 1.3), { k: 'e', h: rnd(20, 50), g: 600, d: .98 })); }
    pool.add(mk(x, y, 0, 0, .5, { k: 'r', s: 110 * k }));
    snd('boom');
  }
  // a canvas effect: setup(L) returns draw(dt, t); fades out in the last 0.9 s
  function cfx(S, dur, setup) {
    var L = layer(true); S.undo.push(function () { L.cv.remove(); });
    var draw = setup(L);
    S.loop(function (dt, t) {
      L.cx.clearRect(0, 0, L.W, L.H); L.cx.globalCompositeOperation = 'source-over'; L.cx.globalAlpha = 1;
      L.cv.style.opacity = clamp((dur - t) / .9, 0, 1);
      draw(dt, t); if (t > dur) return false;
    });
    return true;
  }
  function night(cx, W, H, a) { cx.globalCompositeOperation = 'source-over'; cx.fillStyle = 'rgba(4,6,22,' + a.toFixed(3) + ')'; cx.fillRect(0, 0, W, H); }
  function addFx(name, label, group, ic, run) { EFFECTS.push({ name: name, label: label, group: group, ic: ic, run: run }); }

  // ---------------------------------------------------------------- Wreck the page
  addFx('lightning', 'Lightning strikes', 'wreck', 'M13 2 5 14h6l-1 8 8-12h-6z', function (S) {
    return cfx(S, 6.5, function (L) {
      var cx = L.cx, W = L.W, H = L.H, strikes = [], next = .25, flash = 0;
      function bolt(x1, y1, x2, y2, w, dep, out) {
        var pts = [[x1, y1]], n = 12;
        for (var i = 1; i < n; i++) { var u = i / n; pts.push([x1 + (x2 - x1) * u + rnd(-1, 1) * 34, y1 + (y2 - y1) * u + rnd(-6, 6)]); if (dep < 2 && Math.random() < .2) bolt(pts[i][0], pts[i][1], pts[i][0] + rnd(-170, 170), pts[i][1] + rnd(70, 220), w * .55, dep + 1, out); }
        pts.push([x2, y2]); out.push({ p: pts, w: w });
      }
      return function (dt, t) {
        if (t > next && t < 5) { var x = rnd(W * .1, W * .9), y = rnd(H * .45, H * .95), s = { b: [], x: x, y: y, l: .5 }; bolt(x + rnd(-80, 80), -10, x, y, 3.2, 0, s.b); strikes.push(s); flash = 1; snd('zap'); snd('boom'); next = t + rnd(.45, .95); }
        flash = Math.max(0, flash - dt * 3.2);
        night(cx, W, H, .3 * Math.min(1, t / .5));
        if (flash > 0) { cx.fillStyle = 'rgba(235,240,255,' + (flash * .55).toFixed(3) + ')'; cx.fillRect(0, 0, W, H); }
        cx.lineCap = 'round'; cx.lineJoin = 'round';
        strikes.forEach(function (s) {
          s.l -= dt; var a = clamp(s.l / .5, 0, 1); if (a <= 0) return;
          s.b.forEach(function (b) { cx.beginPath(); b.p.forEach(function (q, i) { if (i) cx.lineTo(q[0], q[1]); else cx.moveTo(q[0], q[1]); }); cx.strokeStyle = 'rgba(130,160,255,' + (a * .35).toFixed(3) + ')'; cx.lineWidth = b.w * 5; cx.stroke(); cx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')'; cx.lineWidth = b.w; cx.stroke(); });
          cx.fillStyle = 'rgba(255,255,255,' + (a * .6).toFixed(3) + ')'; cx.beginPath(); cx.arc(s.x, s.y, 26 * a + 6, 0, 6.283); cx.fill();
        });
        strikes = strikes.filter(function (s) { return s.l > 0; });
      };
    });
  });

  addFx('missiles', 'Missiles', 'wreck', 'M5 19 15 9M13 7l6-2-2 6zM4 13l3 3', function (S) {
    return cfx(S, 7, function (L) {
      var cx = L.cx, W = L.W, H = L.H, ms = [], pool = Fx(), nx = .2, flash = 0;
      return function (dt, t) {
        if (t > nx && t < 5) { nx = t + rnd(.22, .45); var left = Math.random() < .5, sx = left ? W * .08 : W * .92; ms.push({ sx: sx, sy: H + 10, tx: rnd(W * .08, W * .92), ty: rnd(H * .12, H * .75), u: 0, T: rnd(.8, 1.3), arc: rnd(.08, .2) * H, x: sx, y: H, a: -1.5 }); snd('whoosh'); }
        flash = Math.max(0, flash - dt * 3);
        for (var i = ms.length - 1; i >= 0; i--) {
          var m = ms[i]; m.u += dt / m.T; var u = m.u * m.u * .6 + m.u * .4, nxp = m.sx + (m.tx - m.sx) * u, nyp = m.sy + (m.ty - m.sy) * u - Math.sin(Math.PI * Math.min(1, u)) * m.arc;
          m.a = Math.atan2(nyp - m.y, nxp - m.x); m.x = nxp; m.y = nyp;
          pool.add(mk(m.x, m.y, rnd(-12, 12), rnd(-12, 12), rnd(.7, 1.2), { k: 's', s: rnd(4, 7), d: .97 })); pool.add(mk(m.x, m.y, rnd(-20, 20), rnd(-20, 20), .22, { k: 'f', h: 40, s: 4, d: .9 }));
          if (m.u >= 1) { boom(pool, m.tx, m.ty, 1); flash = .35; ms.splice(i, 1); }
        }
        if (flash > 0) { cx.fillStyle = 'rgba(255,240,200,' + (flash * .5).toFixed(3) + ')'; cx.fillRect(0, 0, W, H); }
        pool.step(dt, function (p, u) { drawP(cx, p, u); });
        cx.globalCompositeOperation = 'source-over';
        ms.forEach(function (m) { cx.save(); cx.translate(m.x, m.y); cx.rotate(m.a); cx.fillStyle = '#e9edf3'; cx.fillRect(-14, -3, 22, 6); cx.fillStyle = '#c0392b'; cx.beginPath(); cx.moveTo(8, -3); cx.lineTo(16, 0); cx.lineTo(8, 3); cx.fill(); cx.fillStyle = '#556'; cx.beginPath(); cx.moveTo(-14, -3); cx.lineTo(-19, -8); cx.lineTo(-9, -3); cx.moveTo(-14, 3); cx.lineTo(-19, 8); cx.lineTo(-9, 3); cx.fill(); cx.restore(); });
      };
    });
  });

  addFx('rocket', 'Rocket launch', 'wreck', 'M12 2c3 3 4 7 3 12H9c-1-5 0-9 3-12zM9 14l-3 4M15 14l3 4M12 17v4', function (S) {
    return cfx(S, 6.8, function (L) {
      var cx = L.cx, W = L.W, H = L.H, pool = Fx(), sc = clamp(Math.min(W, H) / 560, .6, 1.4);
      var R = [{ x: W * .5, d: 0, s: 1.25 }, { x: W * .2, d: 1.1, s: .75 }, { x: W * .8, d: 1.6, s: .75 }], A = (H + 260) / (2.1 * 2.1 * .5);
      function shape(x, y, s, t, fl) {
        var u = s * sc;
        if (fl) { cx.globalCompositeOperation = 'lighter'; var g = cx.createLinearGradient(x, y + 30 * u, x, y + (80 + 50 * fl + Math.random() * 14) * u); g.addColorStop(0, 'rgba(255,240,170,.95)'); g.addColorStop(.5, 'rgba(255,140,30,.8)'); g.addColorStop(1, 'rgba(255,60,0,0)'); cx.fillStyle = g; cx.beginPath(); cx.moveTo(x - 12 * u, y + 30 * u); cx.lineTo(x, y + (90 + 60 * fl) * u); cx.lineTo(x + 12 * u, y + 30 * u); cx.fill(); cx.globalCompositeOperation = 'source-over'; }
        cx.fillStyle = '#c0392b'; cx.beginPath(); cx.moveTo(x - 14 * u, y + 18 * u); cx.lineTo(x - 26 * u, y + 38 * u); cx.lineTo(x - 12 * u, y + 32 * u); cx.moveTo(x + 14 * u, y + 18 * u); cx.lineTo(x + 26 * u, y + 38 * u); cx.lineTo(x + 12 * u, y + 32 * u); cx.fill();
        cx.fillStyle = '#f2f4f8'; cx.strokeStyle = '#334'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(x, y - 52 * u); cx.quadraticCurveTo(x + 22 * u, y - 20 * u, x + 15 * u, y + 32 * u); cx.lineTo(x - 15 * u, y + 32 * u); cx.quadraticCurveTo(x - 22 * u, y - 20 * u, x, y - 52 * u); cx.fill(); cx.stroke();
        cx.fillStyle = '#c0392b'; cx.beginPath(); cx.moveTo(x, y - 52 * u); cx.quadraticCurveTo(x + 11 * u, y - 38 * u, x + 13 * u, y - 30 * u); cx.lineTo(x - 13 * u, y - 30 * u); cx.quadraticCurveTo(x - 11 * u, y - 38 * u, x, y - 52 * u); cx.fill();
        cx.fillStyle = '#6ab7ff'; cx.strokeStyle = '#334'; cx.beginPath(); cx.arc(x, y - 10 * u, 7 * u, 0, 6.283); cx.fill(); cx.stroke();
      }
      return function (dt, t) {
        R.forEach(function (r) {
          var tau = t - r.d, y = H - 80 * sc, shake = 0, fl = 0;
          if (tau < 0) { shape(r.x, y, r.s, t, 0); return; }
          if (tau < .9) { shake = (tau / .9) * 3; fl = tau / .9; if (Math.random() < .8) { var gx = r.x + rnd(-30, 30) * sc; pool.add(mk(gx, H - 20, rnd(-90, 90), rnd(-30, -5), rnd(1, 1.8), { k: 's', s: rnd(16, 30) * r.s, d: .95 })); } if (tau < .05) snd('whoosh'); }
          else { var q = tau - .9; y = y - .5 * A * q * q; fl = 1; r.vy = -A * q; pool.add(mk(r.x + rnd(-8, 8), y + 60 * r.s * sc, rnd(-30, 30), rnd(30, 120), rnd(1, 1.7), { k: 's', s: rnd(10, 18) * r.s * sc, d: .97 })); pool.add(mk(r.x, y + 50 * sc * r.s, rnd(-40, 40), rnd(60, 200), .3, { k: 'f', h: 35, s: rnd(5, 9), d: .92 })); }
          if (y > -140) shape(r.x + rnd(-shake, shake), y, r.s, t, fl);
        });
        pool.step(dt, function (p, u) { drawP(cx, p, u); });
        cx.globalCompositeOperation = 'source-over';
      };
    });
  });

  addFx('burn', 'Burn it down', 'wreck', 'M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-3 2-4 2-6 1 1 2 2 3 1z', function (S) {
    return cfx(S, 8, function (L) {
      var cx = L.cx, W = L.W, H = L.H, pool = Fx();
      return function (dt, t) {
        var front = H * clamp(t / 4.6, 0, 1) * .92 + 30, n = Math.min(26, (W / 16) | 0);
        if (t < 6.5) for (var i = 0; i < n; i++) {
          var x = rnd(-10, W + 10), y = H - rnd(0, front);
          pool.add(mk(x, y, rnd(-18, 18), -rnd(60, 190), rnd(.5, 1.1), { k: 'f', h: rnd(8, 48), s: rnd(10, 26), d: .97 }));
          if (Math.random() < .12) pool.add(mk(x, y, rnd(-40, 40), -rnd(100, 260), rnd(.8, 1.6), { k: 'e', h: 30, d: .98 }));
          if (Math.random() < .08) pool.add(mk(x, y - 20, rnd(-20, 20), -rnd(60, 130), rnd(1, 1.9), { k: 's', s: rnd(12, 24) }));
        }
        var g = cx.createLinearGradient(0, H, 0, H - front * 1.1); g.addColorStop(0, 'rgba(20,10,5,.7)'); g.addColorStop(1, 'rgba(20,10,5,0)'); cx.fillStyle = g; cx.fillRect(0, 0, W, H);
        pool.step(dt, function (p, u) { drawP(cx, p, u); });
        cx.globalCompositeOperation = 'source-over';
      };
    });
  });

  addFx('dragons', 'Dragons', 'wreck', 'M3 18c3-1 5-6 9-6s4 3 8 2M9 12 7 6l5 4M13 12l3-6 1 6', function (S) {
    // three original dragons, each with a rider, circling the screen and burning the page
    return cfx(S, 12, function (L) {
      var cx = L.cx, W = L.W, H = L.H, pool = Fx(), sc = clamp(Math.min(W, H) / 620, .6, 1.4), N = 22, scars = [], fires = [], DUR = 10.2;
      var D = [
        { f: [.31, .47], p: [0, 1.3], A: [.38, .28], c: '#1f7a4d', c2: '#0f3d28', bl: '#e2c56b', cape: '#c0392b', t0: .1, sx: -1, sy: .32, dir: 1, ph: 0 },
        { f: [.27, .39], p: [2.1, .2], A: [.40, .26], c: '#a3262f', c2: '#4e1016', bl: '#f0b765', cape: '#2563eb', t0: 1.0, sx: 2, sy: .6, dir: -1, ph: 2 },
        { f: [.36, .29], p: [4.0, 2.6], A: [.36, .30], c: '#4b3fa8', c2: '#221a5e', bl: '#c9b8ff', cape: '#eab308', t0: 1.9, sx: .5, sy: -.15, dir: 1, ph: 4 }
      ];
      function raw(d, tt) {
        var x = W * (.5 + d.A[0] * Math.sin(tt * d.f[0] * 3 + d.p[0])), y = H * (.5 + d.A[1] * Math.sin(tt * d.f[1] * 3 + d.p[1])) + Math.sin(tt * 2.3 + d.ph) * 28 * sc;
        var sx = d.sx < 0 ? -240 * sc : d.sx > 1 ? W + 240 * sc : W * d.sx, sy = d.sx < 0 || d.sx > 1 ? H * d.sy : (d.sy < 0 ? -240 * sc : H + 240 * sc);
        var e = ease(tt / 1.7); x = sx + (x - sx) * e; y = sy + (y - sy) * e;
        var o = ease((tt - (DUR - 1.4)) / 1.4); if (o > 0) { var ex = d.dir > 0 ? W + 280 * sc : -280 * sc; x = x + (ex - x) * o; y = y + (-160 * sc - y) * o * .6; }
        return [x, y];
      }
      function wing(d, b, fl, far, dir) {
        var s = sc * (far ? .8 : 1.1), bx = b[0], by = b[1];
        cx.fillStyle = far ? d.c2 : d.c; cx.strokeStyle = '#10241a'; cx.lineWidth = 1.4; cx.globalAlpha = .93;
        cx.beginPath(); cx.moveTo(bx, by); cx.lineTo(bx - dir * 12 * s, by - 100 * s * fl); cx.quadraticCurveTo(bx - dir * 48 * s, by - 58 * s * fl, bx - dir * 92 * s, by - 66 * s * fl + 14 * s); cx.quadraticCurveTo(bx - dir * 74 * s, by - 10 * s * fl, bx - dir * 68 * s, by + 8 * s); cx.quadraticCurveTo(bx - dir * 42 * s, by - 10 * s, bx - dir * 32 * s, by + 10 * s); cx.closePath(); cx.fill(); cx.stroke(); cx.globalAlpha = 1;
      }
      function rider(d, p, dir, tt) {
        var u = sc, x = p[0], y = p[1] - 11 * u, fl = Math.sin(tt * 9 + d.ph) * 4 * u;
        cx.fillStyle = d.cape; cx.beginPath(); cx.moveTo(x - dir * 2 * u, y - 12 * u); cx.lineTo(x - dir * 30 * u, y - 4 * u + fl); cx.lineTo(x - dir * 24 * u, y + 8 * u + fl * .5); cx.lineTo(x - dir * 2 * u, y + 2 * u); cx.fill();
        cx.fillStyle = '#2a2330'; cx.fillRect(x - 4 * u, y - 14 * u, 8 * u, 17 * u);
        cx.fillStyle = '#d7b08a'; cx.beginPath(); cx.arc(x, y - 18 * u, 4.4 * u, 0, 6.283); cx.fill();
        cx.fillStyle = d.c2; cx.beginPath(); cx.arc(x, y - 19 * u, 5 * u, Math.PI, 0); cx.fill(); cx.fillRect(x - 5 * u, y - 19 * u, 2 * u, 5 * u);
        cx.strokeStyle = '#6b4a2a'; cx.lineWidth = 2 * u; cx.beginPath(); cx.moveTo(x + dir * 3 * u, y - 8 * u); cx.lineTo(x + dir * 14 * u, y - 24 * u); cx.lineTo(x + dir * 12 * u, y - 46 * u); cx.stroke();
        cx.fillStyle = d.cape; cx.beginPath(); cx.moveTo(x + dir * 12 * u, y - 46 * u); cx.lineTo(x + dir * (12 + 18) * u, y - 42 * u + fl); cx.lineTo(x + dir * 12 * u, y - 36 * u); cx.fill();
      }
      return function (dt, t) {
        scars.forEach(function (s2) { s2.l -= dt; if (s2.l > 0) { cx.fillStyle = 'rgba(25,15,10,' + clamp(s2.l * .18, 0, .3).toFixed(3) + ')'; cx.beginPath(); cx.ellipse(s2.x, s2.y, s2.r, s2.r * .4, 0, 0, 6.283); cx.fill(); } });
        scars = scars.filter(function (s2) { return s2.l > 0; });
        for (var fi = fires.length - 1; fi >= 0; fi--) { var f = fires[fi]; f.l -= dt; if (f.l <= 0) { fires.splice(fi, 1); continue; } if (Math.random() < .4) pool.add(mk(f.x + rnd(-f.s, f.s), f.y + rnd(-f.s * .4, f.s * .4), rnd(-14, 14), -rnd(50, 150), rnd(.4, .9), { k: 'f', h: rnd(8, 48), s: rnd(7, 16), d: .97 })); }
        D.forEach(function (d) {
          var tt = t - d.t0; if (tt < 0 || tt > DUR) return;
          if (!d.on) { d.on = 1; snd('whoosh'); }
          var segs = [], i; for (i = 0; i < N; i++) segs.push(raw(d, Math.max(0, tt - i * .075)));
          var h = segs[0], pv = raw(d, tt + .03), pq = raw(d, Math.max(0, tt - .03)), vx = pv[0] - pq[0], vy = pv[1] - pq[1];
          if (Math.abs(vx) > .6) d.dir = vx > 0 ? 1 : -1; var dir = d.dir, ang = clamp(Math.atan2(vy, Math.max(.001, Math.abs(vx))), -.9, .9);
          var fl = Math.sin(tt * 8 + d.ph) * .55 + .35, fx = dir * Math.cos(ang), fy = Math.sin(ang);
          var firing = tt > 1.2 && tt < DUR - 1.2 && (((tt + d.ph * .4) % 2.6) < 1.7);
          var mx = h[0] + fx * 34 * sc, my = h[1] + fy * 34 * sc + 4 * sc;
          wing(d, segs[5], fl, true, dir);
          for (i = N - 1; i >= 0; i--) {
            var p = segs[i], r = Math.max(2.6, (13 - i * .5)) * sc; cx.fillStyle = d.c; cx.beginPath(); cx.arc(p[0], p[1], r, 0, 6.283); cx.fill();
            cx.fillStyle = d.bl; cx.beginPath(); cx.arc(p[0], p[1] + r * .35, r * .55, 0, 6.283); cx.fill();
            if (i % 2 === 0 && i > 0) { cx.fillStyle = d.c2; cx.beginPath(); cx.moveTo(p[0] - 3 * sc, p[1] - r + 1); cx.lineTo(p[0], p[1] - r - 8 * sc); cx.lineTo(p[0] + 3 * sc, p[1] - r + 1); cx.fill(); }
          }
          rider(d, segs[3], dir, tt);
          wing(d, segs[4], fl * .9 + .1, false, dir);
          cx.save(); cx.translate(h[0], h[1]); cx.scale(dir, 1); cx.rotate(ang);
          cx.fillStyle = d.c; cx.beginPath(); cx.ellipse(15 * sc, 0, 23 * sc, 11 * sc, 0, 0, 6.283); cx.fill();
          cx.fillStyle = d.c2; cx.beginPath(); cx.ellipse(firing ? 20 * sc : 17 * sc, (firing ? 10 : 6) * sc, 15 * sc, (firing ? 4.5 : 3) * sc, firing ? .35 : .1, 0, 6.283); cx.fill();
          cx.beginPath(); cx.moveTo(-2 * sc, -9 * sc); cx.lineTo(-26 * sc, -24 * sc); cx.lineTo(4 * sc, -6 * sc); cx.fill();
          cx.beginPath(); cx.moveTo(6 * sc, -10 * sc); cx.lineTo(-10 * sc, -26 * sc); cx.lineTo(12 * sc, -8 * sc); cx.fill();
          cx.fillStyle = '#ffdd33'; cx.beginPath(); cx.arc(17 * sc, -4 * sc, 3.4 * sc, 0, 6.283); cx.fill(); cx.fillStyle = '#111'; cx.beginPath(); cx.arc(18 * sc, -4 * sc, 1.5 * sc, 0, 6.283); cx.fill();
          cx.restore();
          if (firing) {
            for (i = 0; i < 6; i++) { var a = ang + rnd(-.17, .17), sp = rnd(320, 620) * sc; pool.add(mk(mx, my, dir * Math.cos(a) * sp + vx / .06 * .5, Math.sin(a) * sp, rnd(.35, .7), { k: 'f', h: rnd(6, 50), s: rnd(8, 18) * sc, d: .965 })); }
            if (Math.random() < .55 && fires.length < 70) { var L2 = rnd(110, 320) * sc, qx = mx + fx * L2, qy = my + fy * L2 + rnd(0, 60) * sc; fires.push({ x: qx, y: qy, l: rnd(1.3, 2.6), s: rnd(8, 24) * sc }); scars.push({ x: qx, y: qy + 6, r: rnd(16, 40) * sc, l: rnd(2.4, 4) }); }
          }
        });
        pool.step(dt, function (p, u) { drawP(cx, p, u); }); cx.globalCompositeOperation = 'source-over';
      };
    });
  });

  addFx('drones', 'Drone swarm', 'wreck', 'M7 7l10 10M17 7 7 17M4 5h5M15 5h5M4 19h5M15 19h5', function (S) {
    return cfx(S, 9, function (L) {
      var cx = L.cx, W = L.W, H = L.H, N = coarse() ? 26 : 44, ds = [], ptr = { x: W / 2, y: H / 2, m: 0 }, i;
      S.on(doc, 'pointermove', function (e) { ptr.x = e.clientX; ptr.y = e.clientY; ptr.m = 1; }, { passive: true });
      for (i = 0; i < N; i++) { var side = Math.random(); ds.push({ x: side < .5 ? -rnd(20, 200) : W + rnd(20, 200), y: rnd(-60, H * .9), vx: 0, vy: 0, ph: rnd(0, 6.28), r: rnd(30, 150), b: rnd(0, 6) }); }
      snd('buzz');
      return function (dt, t) {
        var tx = ptr.m ? ptr.x : W * (.5 + .3 * Math.sin(t * .9)), ty = ptr.m ? ptr.y : H * (.45 + .25 * Math.sin(t * 1.3)); if (t > 7.2) ty = -300;
        ds.forEach(function (d, k) {
          var gx = tx + Math.cos(d.ph + t * .8) * d.r, gy = ty + Math.sin(d.ph * 1.3 + t * .9) * d.r * .6, dx = (gx - d.x) * 2.6, dy = (gy - d.y) * 2.6, m = Math.hypot(dx, dy), cap = 300;
          if (m > cap) { dx = dx / m * cap; dy = dy / m * cap; }
          for (var j = 0; j < ds.length; j++) { if (j === k) continue; var ox = d.x - ds[j].x, oy = d.y - ds[j].y, dd = Math.hypot(ox, oy); if (dd > 0 && dd < 30) { dx += ox / dd * 120; dy += oy / dd * 120; } }
          d.vx += (dx - d.vx) * Math.min(1, dt * 2.5); d.vy += (dy - d.vy) * Math.min(1, dt * 2.5); d.x += d.vx * dt; d.y += d.vy * dt;
          cx.save(); cx.translate(d.x, d.y); cx.rotate(clamp(d.vx * .0012, -.4, .4));
          cx.strokeStyle = '#20242b'; cx.lineWidth = 2.2; cx.beginPath(); cx.moveTo(-9, -6); cx.lineTo(9, 6); cx.moveTo(-9, 6); cx.lineTo(9, -6); cx.stroke();
          [[-9, -6], [9, -6], [-9, 6], [9, 6]].forEach(function (q, n) { cx.fillStyle = 'rgba(80,90,110,.35)'; cx.beginPath(); cx.ellipse(q[0], q[1], 7, 2.6, 0, 0, 6.283); cx.fill(); cx.strokeStyle = '#555'; cx.lineWidth = 1; var a = t * 40 + n; cx.beginPath(); cx.moveTo(q[0] - Math.cos(a) * 7, q[1] - Math.sin(a) * 2.4); cx.lineTo(q[0] + Math.cos(a) * 7, q[1] + Math.sin(a) * 2.4); cx.stroke(); });
          cx.fillStyle = '#2b2f36'; cx.fillRect(-4.5, -3.5, 9, 7); cx.fillStyle = ((t * 3 + d.b) % 1) < .5 ? '#ff2d2d' : '#552'; cx.beginPath(); cx.arc(0, 0, 1.8, 0, 6.283); cx.fill(); cx.restore();
        });
      };
    });
  });

  addFx('meteors', 'Meteors', 'wreck', 'M20 4 9 15M20 4l-5 1M20 4l-1 5M6 13l-3 3M10 19l-2 2', function (S) {
    return cfx(S, 8, function (L) {
      var cx = L.cx, W = L.W, H = L.H, ms = [], pool = Fx(), nx = .15, flash = 0, scars = [];
      return function (dt, t) {
        if (t > nx && t < 5.4) { nx = t + rnd(.3, .7); var a = rnd(1.0, 1.3), sp = rnd(750, 1050), big = Math.random() < .25; ms.push({ x: rnd(W * .25, W * 1.15), y: -50, vx: -Math.cos(a) * sp, vy: Math.sin(a) * sp, iy: rnd(H * .5, H * .96), s: big ? 14 : rnd(5, 9), big: big, tr: [] }); snd('whoosh'); }
        flash = Math.max(0, flash - dt * 2.5);
        scars.forEach(function (s) { s.l -= dt; cx.fillStyle = 'rgba(30,20,15,' + clamp(s.l, 0, .5).toFixed(3) + ')'; cx.beginPath(); cx.ellipse(s.x, s.y, s.r, s.r * .35, 0, 0, 6.283); cx.fill(); });
        if (flash > 0) { cx.fillStyle = 'rgba(255,235,200,' + (flash * .45).toFixed(3) + ')'; cx.fillRect(0, 0, W, H); }
        pool.step(dt, function (p, u) { drawP(cx, p, u); });
        for (var i = ms.length - 1; i >= 0; i--) {
          var m = ms[i]; m.x += m.vx * dt; m.y += m.vy * dt; m.tr.push([m.x, m.y]); if (m.tr.length > 18) m.tr.shift();
          if (m.y >= m.iy) { boom(pool, m.x, m.y, m.big ? 2 : 1); flash = Math.max(flash, m.big ? .6 : .25); scars.push({ x: m.x, y: m.y + 4, r: m.big ? 40 : 18, l: 3 }); ms.splice(i, 1); continue; }
          cx.globalCompositeOperation = 'lighter';
          m.tr.forEach(function (q, k) { var f = k / m.tr.length; cx.fillStyle = hsla(15 + f * 30, 100, 55, f * .6); cx.beginPath(); cx.arc(q[0], q[1], m.s * f * 1.05, 0, 6.283); cx.fill(); });
          var g = cx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.s * 2); g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(.4, 'rgba(255,170,60,.9)'); g.addColorStop(1, 'rgba(255,60,0,0)'); cx.fillStyle = g; cx.beginPath(); cx.arc(m.x, m.y, m.s * 2, 0, 6.283); cx.fill();
        }
        cx.globalCompositeOperation = 'source-over';
      };
    });
  });

  addFx('ufo', 'UFO abduction', 'wreck', 'M4 14h16M7 14c0-4 2-6 5-6s5 2 5 6M8 18l-2 3M16 18l2 3M12 18v3', function (S) {
    var U = { x: -120, tx: -120, nt: 0, y: 80 }, al = [], i;
    for (i = 0; i < 7; i++) al.push({ ph: Math.random(), sw: rnd(0, 6) });
    return elemPhysics(S, {
      dur: 7.2, damp: 1.4, rest: .1, max: 40,
      step: function (dt, t, p, W, H, items) {
        U.y = H * .12 + Math.sin(t * 2) * 6;
        if (t >= U.nt) { var c = items.length ? items[(Math.random() * items.length) | 0] : null; U.tx = c ? (c.l + c.r) / 2 : rnd(W * .2, W * .8); U.nt = t + 1.3; }
        if (t > 5.7) U.tx = W + 220;
        U.x += (U.tx - U.x) * Math.min(1, dt * 2.6);
      },
      acc: function (t, it, p, W, H) {
        var cxI = (it.l + it.r) / 2 + it.x, cyI = (it.t + it.b) / 2 + it.y, on = t < 5.8 && U.x > 0 && U.x < W && Math.abs(cxI - U.x) < 54 + Math.max(0, cyI - U.y) * .1 && cyI > U.y;
        if (it.s0 == null) it.s0 = 1; it.s0 += ((on ? clamp((cyI - U.y) / (H * .55), .2, 1) : 1) - it.s0) * .12; it.sx = it.sy = it.s0;
        return on ? [(U.x - cxI) * 6, -1500] : [0, 380];
      },
      draw: function (cx, t, items, W, H, ptr, vis) {
        var beam = t < 5.8 && U.x > 0 && U.x < W, ux = U.x, uy = U.y;
        if (beam) { var g = cx.createLinearGradient(0, uy, 0, H); g.addColorStop(0, 'rgba(200,255,170,.55)'); g.addColorStop(1, 'rgba(200,255,170,.12)'); cx.fillStyle = g; cx.beginPath(); cx.moveTo(ux - 26, uy + 12); cx.lineTo(ux + 26, uy + 12); cx.lineTo(ux + 54 + (H - uy) * .1, H); cx.lineTo(ux - 54 - (H - uy) * .1, H); cx.fill();
          al.forEach(function (a) { var span = H - uy, y = H - ((t * 60 + a.ph * span) % span), x = ux + Math.sin(t * 2 + a.sw) * 14; cx.fillStyle = '#6fd04a'; cx.beginPath(); cx.ellipse(x, y, 5, 7, 0, 0, 6.283); cx.fill(); cx.fillRect(x - 1.2, y + 5, 2.4, 9); cx.fillStyle = '#111'; cx.beginPath(); cx.ellipse(x - 2, y - 1, 1.4, 2.4, .5, 0, 6.283); cx.ellipse(x + 2, y - 1, 1.4, 2.4, -.5, 0, 6.283); cx.fill(); }); }
        if (ux > -100 && ux < W + 100) {
          cx.fillStyle = 'rgba(150,210,255,.75)'; cx.beginPath(); cx.ellipse(ux, uy - 8, 20, 16, 0, Math.PI, 0); cx.fill();
          var sg = cx.createLinearGradient(0, uy - 6, 0, uy + 12); sg.addColorStop(0, '#d5dbe6'); sg.addColorStop(1, '#6e7788'); cx.fillStyle = sg; cx.beginPath(); cx.ellipse(ux, uy + 2, 46, 12, 0, 0, 6.283); cx.fill();
          for (var k = -2; k <= 2; k++) { cx.fillStyle = ((Math.floor(t * 6) + k) % 2) ? '#ffe66b' : '#ff7a6b'; cx.beginPath(); cx.arc(ux + k * 15, uy + 4 + Math.abs(k) * -.8, 2.6, 0, 6.283); cx.fill(); }
        }
      }
    });
  });

  addFx('sea', 'Sea monster', 'wreck', 'M3 20c2-2 2-4 4-4s2 2 4 2M7 16V9c0-3 4-3 4 0M15 20c0-5 1-9 3-11s3 0 2 2', function (S) {
    return cfx(S, 8.5, function (L) {
      var cx = L.cx, W = L.W, H = L.H, sc = clamp(Math.min(W, H) / 650, .6, 1.3), n = W < 520 ? 4 : 6, T = [], i;
      for (i = 0; i < n; i++) T.push({ x: W * (i + .5) / n + rnd(-30, 30), len: H * rnd(.42, .72), ph: rnd(0, 6.3), d: rnd(0, .7), a0: -Math.PI / 2 + rnd(-.3, .3) });
      return function (dt, t) {
        T.forEach(function (m) {
          var rise = ease((t - m.d) / 1.4) * ease((7.4 - t) / 1.2), len = m.len * rise; if (len < 4) return;
          var N = 26, seg = len / N, x = m.x, y = H + 10, a = m.a0, pts = [[x, y]];
          for (var k = 0; k < N; k++) { a += Math.sin(t * 2.1 + m.ph + k * .4) * .075 + (k > 16 ? .045 * Math.sin(t + m.ph) : 0); x += Math.cos(a) * seg; y += Math.sin(a) * seg; pts.push([x, y]); }
          cx.lineCap = 'round';
          for (k = 0; k < N; k++) { var r = (15 - 11 * k / N) * sc; cx.strokeStyle = hsla(175, 35, 22 + 12 * k / N, 1); cx.lineWidth = r * 2; cx.beginPath(); cx.moveTo(pts[k][0], pts[k][1]); cx.lineTo(pts[k + 1][0], pts[k + 1][1]); cx.stroke(); }
          for (k = 1; k < N - 2; k += 2) { var r2 = (15 - 11 * k / N) * sc, dx = pts[k + 1][0] - pts[k][0], dy = pts[k + 1][1] - pts[k][1], dl = Math.hypot(dx, dy) || 1; cx.fillStyle = 'rgba(255,190,190,.85)'; cx.beginPath(); cx.arc(pts[k][0] - dy / dl * r2 * .5, pts[k][1] + dx / dl * r2 * .5, r2 * .3, 0, 6.283); cx.fill(); }
        });
        var wv = ease(t / .8) * ease((8.2 - t) / .7), hh = 46 * sc * wv; if (hh > 1) { var g = cx.createLinearGradient(0, H - hh, 0, H); g.addColorStop(0, 'rgba(25,100,125,.9)'); g.addColorStop(1, 'rgba(10,45,70,.95)'); cx.fillStyle = g; cx.beginPath(); cx.moveTo(0, H); for (var x2 = 0; x2 <= W + 10; x2 += 10) cx.lineTo(x2, H - hh + Math.sin(x2 * .03 + t * 3) * 7 * sc); cx.lineTo(W, H); cx.fill(); }
      };
    });
  });

  addFx('bees', 'Bee swarm', 'wreck', 'M8 9h8v7a4 4 0 0 1-8 0zM8 12h8M8 15h8M9 9 6 5M15 9l3-4', function (S) {
    return cfx(S, 10, function (L) {
      var cx = L.cx, W = L.W, H = L.H, N = coarse() ? 45 : 75, bs = [], ptr = { x: W / 2, y: H / 2, m: 0 }, i;
      S.on(doc, 'pointermove', function (e) { ptr.x = e.clientX; ptr.y = e.clientY; ptr.m = 1; }, { passive: true });
      for (i = 0; i < N; i++) { var s = Math.random() < .5; bs.push({ x: s ? -rnd(10, 150) : W + rnd(10, 150), y: rnd(0, H), vx: 0, vy: 0, ph: rnd(0, 6.28), r: rnd(18, 110), w: rnd(.7, 1.4) }); }
      snd('buzz');
      return function (dt, t) {
        var tx = ptr.m ? ptr.x : W * (.5 + .28 * Math.sin(t * .8)), ty = ptr.m ? ptr.y : H * (.5 + .22 * Math.sin(t * 1.1)); if (t > 8.2) { tx = W + 300; ty = -200; }
        bs.forEach(function (b) {
          var gx = tx + Math.cos(b.ph + t * b.w * 2) * b.r, gy = ty + Math.sin(b.ph * 1.7 + t * b.w * 2.3) * b.r * .7, dx = (gx - b.x) * 3.2, dy = (gy - b.y) * 3.2, m = Math.hypot(dx, dy);
          if (m > 420) { dx = dx / m * 420; dy = dy / m * 420; }
          b.vx += (dx - b.vx) * Math.min(1, dt * 4) + rnd(-1, 1) * 700 * dt; b.vy += (dy - b.vy) * Math.min(1, dt * 4) + rnd(-1, 1) * 700 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
          var a = Math.atan2(b.vy, b.vx), fl = Math.sin(t * 70 + b.ph) * .7; cx.save(); cx.translate(b.x, b.y); cx.rotate(a);
          cx.fillStyle = 'rgba(255,255,255,.65)'; cx.strokeStyle = 'rgba(80,80,80,.4)'; cx.lineWidth = .8; cx.beginPath(); cx.ellipse(-1, -3, 5, 2, -.5 + fl, 0, 6.283); cx.fill(); cx.stroke(); cx.beginPath(); cx.ellipse(-1, 3, 5, 2, .5 - fl, 0, 6.283); cx.fill(); cx.stroke();
          cx.fillStyle = '#f2b705'; cx.beginPath(); cx.ellipse(0, 0, 6.5, 3.8, 0, 0, 6.283); cx.fill(); cx.strokeStyle = '#1a1200'; cx.lineWidth = 1.6; cx.beginPath(); cx.moveTo(-1.8, -3.4); cx.lineTo(-1.8, 3.4); cx.moveTo(1.6, -3.6); cx.lineTo(1.6, 3.6); cx.stroke();
          cx.fillStyle = '#1a1200'; cx.beginPath(); cx.arc(6.5, 0, 2.5, 0, 6.283); cx.fill(); cx.restore();
        });
      };
    });
  });

  addFx('melt', 'Melt the page', 'wreck', 'M5 6h14M8 6v10M12 6v13M16 6v7', function (S) {
    return elemPhysics(S, {
      dur: 6.3, damp: .9, rest: 0, max: 80,
      init: function (it) { it.va = 0; it.ins = 0; try { it.col = getComputedStyle(it.e).color; } catch (e) { it.col = '#222'; } it.dly = rnd(0, 1.6); it.dr = [rnd(.12, .35), rnd(.4, .65), rnd(.7, .92)]; it.ds = [rnd(.6, 1.3), rnd(.6, 1.3), rnd(.6, 1.3)]; },
      acc: function (t, it) { it.sy = 1 + clamp(it.y / 200, 0, 1.5); it.sx = 1 / Math.sqrt(it.sy); return t < it.dly ? [0, 0] : [0, 230]; },
      draw: function (cx, t, items, W, H, ptr, vis) {
        cx.lineCap = 'round';
        items.forEach(function (it) {
          if (t < it.dly) return; var w = it.r - it.l, y0 = it.b + it.y + (it.sy - 1) * (it.b - it.t) / 2 - 3; cx.strokeStyle = it.col; cx.fillStyle = it.col;
          for (var k = 0; k < 3; k++) { var len = Math.min(110, (t - it.dly) * it.ds[k] * 38) * vis, x = it.l + it.x + w * it.dr[k]; if (y0 + len > H) len = Math.max(0, H - y0); if (len < 2) continue; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(x, y0); cx.lineTo(x, y0 + len); cx.stroke(); cx.beginPath(); cx.ellipse(x, y0 + len, 3.6, 4.6, 0, 0, 6.283); cx.fill(); }
        });
      }
    });
  });

  addFx('spartans', 'Spartan army', 'wreck', 'M12 6a6 6 0 1 0 .1 0zM20 3 8 21', function (S) {
    return cfx(S, 10, function (L) {
      var cx = L.cx, W = L.W, H = L.H, sc = clamp(Math.min(W, H) / 650, .6, 1.2), K = Math.max(5, Math.ceil(W / (92 * sc))), sp = 84 * sc, pool = Fx();
      var rows = [{ y: H * .52, dir: 1, s: .8 }, { y: H * .7, dir: -1, s: .95 }, { y: H * .9, dir: 1, s: 1.1 }];
      function soldier(x, y, s, ph, dir) {
        cx.save(); cx.translate(x, y); cx.scale(dir * s * sc, s * sc); var sw = Math.sin(ph) * 7;
        cx.strokeStyle = '#3a2a22'; cx.lineWidth = 4; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(-2, -26); cx.lineTo(-2 + sw, 0); cx.moveTo(2, -26); cx.lineTo(2 - sw, 0); cx.stroke();
        cx.fillStyle = '#a3262a'; cx.beginPath(); cx.moveTo(-4, -52); cx.lineTo(-19, -20 + Math.sin(ph * 2) * 2); cx.lineTo(-3, -24); cx.closePath(); cx.fill();
        cx.fillStyle = '#b8863b'; cx.fillRect(-6, -54, 12, 30);
        cx.strokeStyle = '#6b4a2a'; cx.lineWidth = 2.4; cx.beginPath(); cx.moveTo(-8, -18); cx.lineTo(24, -82); cx.stroke(); cx.fillStyle = '#cfd6df'; cx.beginPath(); cx.moveTo(24, -82); cx.lineTo(19, -73); cx.lineTo(28, -75); cx.fill();
        cx.fillStyle = '#d9a77a'; cx.beginPath(); cx.arc(0, -60, 5.6, 0, 6.283); cx.fill();
        cx.fillStyle = '#b8863b'; cx.beginPath(); cx.arc(0, -61, 6.4, Math.PI, 0); cx.fill(); cx.fillRect(-6.4, -61, 2.4, 8);
        cx.fillStyle = '#b3262d'; cx.beginPath(); cx.moveTo(-5, -66); cx.quadraticCurveTo(0, -84, 8, -70); cx.quadraticCurveTo(2, -70, -5, -66); cx.fill();
        cx.fillStyle = '#c9a24a'; cx.strokeStyle = '#6b4a1a'; cx.lineWidth = 1.6; cx.beginPath(); cx.arc(8, -38, 15, 0, 6.283); cx.fill(); cx.stroke(); cx.beginPath(); cx.arc(8, -38, 10, 0, 6.283); cx.stroke(); cx.fillStyle = '#6b4a1a'; cx.beginPath(); cx.arc(8, -38, 3.2, 0, 6.283); cx.fill();
        cx.restore();
      }
      return function (dt, t) {
        rows.forEach(function (r, ri) {
          var v = (W + K * sp + 260) / 8.6, ph = t * 9 * (.9 + ri * .05);
          for (var i = 0; i < K; i++) {
            var x0 = r.dir > 0 ? -130 - i * sp : W + 130 + i * sp, x = x0 + r.dir * v * t, bob = Math.abs(Math.sin(ph + i * .5)) * 2.5;
            if (x < -90 || x > W + 90) continue; if (Math.random() < .06) pool.add(mk(x, r.y, rnd(-20, 20), rnd(-30, -8), rnd(.5, 1), { k: 's', s: rnd(5, 9), d: .96 }));
            soldier(x, r.y - bob, r.s, ph + i * 1.3, r.dir);
          }
        });
        pool.step(dt, function (p, u) { drawP(cx, p, u); }); cx.globalCompositeOperation = 'source-over';
      };
    });
  });

  addFx('ants', 'Ant army', 'wreck', 'M6 14a2 2 0 1 0 .1 0M10 14a2.5 2.5 0 1 0 .1 0M15 13a2 2 0 1 0 .1 0M5 18l-1 3M10 18v3M14 17l2 3M16 11l3-3', function (S) {
    return cfx(S, 9.8, function (L) {
      var cx = L.cx, W = L.W, H = L.H, nl = W < 520 ? 4 : 6, M = Math.ceil(W / 62) + 3, v = Math.max(130, W / 5), lanes = [], col = ink(), words = pageWords(nl * 3).join('').replace(/[^A-Za-z]/g, ''), li, i;
      for (li = 0; li < nl; li++) { var dir = li % 2 ? -1 : 1, ants = []; for (i = 0; i < M; i++) ants.push({ x: dir > 0 ? W * .4 - 62 * i + rnd(-8, 8) : W * .6 + 62 * i + rnd(-8, 8), ch: words.charAt((li * M + i) % words.length) || 'A', ph: rnd(0, 6.3), s: rnd(.9, 1.2) }); lanes.push({ y: H * (.12 + .74 * li / (nl - 1)), dir: dir, ants: ants }); }
      function ant(x, y, s, ph, dir, ch) {
        cx.save(); cx.translate(x, y); cx.scale(dir * s, s); cx.strokeStyle = '#2b1a12'; cx.lineWidth = 1.4; cx.lineCap = 'round';
        for (var k = 0; k < 3; k++) { var sw = Math.sin(ph + k * 2.1) * 3, x0 = -1 + k * 2.6; cx.beginPath(); cx.moveTo(x0, 1); cx.lineTo(x0 + sw - 1, 8); cx.moveTo(x0, 1); cx.lineTo(x0 - sw + 2, 8); cx.stroke(); }
        cx.beginPath(); cx.moveTo(8, -2); cx.lineTo(13, -8); cx.moveTo(8, -1); cx.lineTo(14, -4); cx.stroke();
        cx.fillStyle = '#2b1a12'; cx.beginPath(); cx.ellipse(-8, 0, 7, 5, 0, 0, 6.283); cx.ellipse(0, 0, 4.2, 3.4, 0, 0, 6.283); cx.arc(6.5, -1, 3.6, 0, 6.283); cx.fill(); cx.restore();
        cx.font = '800 ' + (20 * s | 0) + 'px system-ui,Arial,sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'alphabetic'; cx.lineWidth = 4; cx.strokeStyle = 'rgba(255,255,255,.9)'; cx.strokeText(ch, x, y - 12 * s); cx.fillStyle = col; cx.fillText(ch, x, y - 12 * s);
      }
      return function (dt, t) {
        lanes.forEach(function (ln) { ln.ants.forEach(function (a) { var x = a.x + ln.dir * v * t; if (x < -40 || x > W + 40) return; ant(x, ln.y + Math.sin(x * .02 + a.ph) * 6, a.s, t * 14 + a.ph, ln.dir, a.ch); }); });
      };
    });
  });

  // ---------------------------------------------------------------- More fun
  addFx('blackhole', 'Black hole', 'more', 'M12 3a9 9 0 1 0 .1 0zM12 9a3 3 0 1 1 .1 0z', function (S) {
    var hx = 0, hy = 0;
    return elemPhysics(S, {
      dur: 5.6, damp: .8, rest: .2, max: 70,
      step: function (dt, t, p, W, H) { hx = W / 2; hy = H * .46; },
      acc: function (t, it, p, W, H) {
        var x = (it.l + it.r) / 2 + it.x, y = (it.t + it.b) / 2 + it.y, dx = hx - x, dy = hy - y, d = Math.hypot(dx, dy) + 1, k = ease(t / 1.2); it.sx = it.sy = clamp(d / (Math.min(W, H) * .5), .12, 1);
        if (d < 60) return [dx * 30 * k, dy * 30 * k]; return [(dx / d * 900 + (-dy / d) * 600) * k, (dy / d * 900 + (dx / d) * 600) * k];
      },
      draw: function (cx, t, items, W, H, ptr, vis) {
        var r = Math.min(W, H) * .09 * ease(t / 1.2) * vis; if (r < 2) return; cx.save(); cx.translate(hx, hy); cx.rotate(.35);
        for (var i = 0; i < 6; i++) { var rx = r * (1.5 + i * .4); cx.strokeStyle = hsla(35 - i * 7, 100, 55 - i * 3, .55 - i * .07); cx.lineWidth = 5 - i * .6; cx.setLineDash([rx * .9, rx * .25]); cx.lineDashOffset = -t * (60 - i * 6); cx.beginPath(); cx.ellipse(0, 0, rx, rx * .3, 0, 0, 6.283); cx.stroke(); }
        cx.setLineDash([]); var g = cx.createRadialGradient(0, 0, r * .8, 0, 0, r * 1.8); g.addColorStop(0, 'rgba(255,200,120,.55)'); g.addColorStop(1, 'rgba(255,200,120,0)'); cx.fillStyle = g; cx.beginPath(); cx.arc(0, 0, r * 1.8, 0, 6.283); cx.fill();
        cx.fillStyle = '#000'; cx.beginPath(); cx.arc(0, 0, r, 0, 6.283); cx.fill(); cx.restore();
      }
    });
  });

  addFx('earthquake', 'Earthquake', 'more', 'M3 12l3-4 3 8 3-10 3 12 3-8 3 4', function (S) {
    var pool = Fx(), cracks = null;
    return elemPhysics(S, {
      dur: 5, damp: 3, rest: .3, max: 80,
      init: function (it) { it.ph = rnd(0, 6.3); it.va = rnd(-5, 5); },
      acc: function (t, it) { var env = ease(t / .6) * ease((5 - t) / .8); return [Math.sin(t * 17 + it.ph) * 4200 * env, Math.cos(t * 15 + it.ph * 1.7) * 3000 * env]; },
      draw: function (cx, t, items, W, H, ptr, vis) {
        if (!cracks) { cracks = []; for (var c = 0; c < 3; c++) { var pts = [[W * (.3 + c * .2) + rnd(-30, 30), H]], x = pts[0][0], y = H; for (var k = 0; k < 14; k++) { x += rnd(-30, 30); y -= rnd(20, 50); pts.push([x, y]); } cracks.push(pts); } }
        var gr = ease(t / 2);
        cx.strokeStyle = 'rgba(20,12,8,.85)'; cx.lineWidth = 4; cx.lineJoin = 'round'; cracks.forEach(function (pts) { var n = Math.max(2, Math.floor(pts.length * gr)); cx.beginPath(); for (var i = 0; i < n; i++) { if (i) cx.lineTo(pts[i][0], pts[i][1]); else cx.moveTo(pts[i][0], pts[i][1]); } cx.stroke(); });
        if (t < 4.2 && Math.random() < .8) pool.add(mk(rnd(0, W), H - 4, rnd(-20, 20), -rnd(30, 120), rnd(.8, 1.6), { k: 's', s: rnd(8, 18), d: .97 }));
        pool.step(1 / 60, function (p, u) { drawP(cx, p, u); }); cx.globalCompositeOperation = 'source-over';
      }
    });
  });

  addFx('tornado', 'Tornado', 'more', 'M4 5h16M6 9h12M8 13h8M10 17h5M12 21h2', function (S) {
    var tcx = 0;
    return elemPhysics(S, {
      dur: 6.6, damp: 1.1, rest: .3, max: 70,
      step: function (dt, t, p, W, H) { tcx = W * (.5 + .3 * Math.sin(t * .8)); },
      init: function (it) { it.va = rnd(-300, 300); },
      acc: function (t, it, p, W, H) { var dx = tcx - ((it.l + it.r) / 2 + it.x), in_ = Math.abs(dx) < W * .28; return [dx * 5 + Math.sin(t * 7 + it.l) * 600, in_ ? -800 + Math.cos(t * 6 + it.t) * 600 : 700]; },
      draw: function (cx, t, items, W, H, ptr, vis) {
        for (var i = 0; i < 18; i++) { var f = i / 17, y = H * .96 - f * H * .84, r = 14 + f * f * Math.min(W * .22, 220), x = tcx + Math.sin(t * 2 + f * 5) * 16 * (1 - f); cx.strokeStyle = 'rgba(70,75,85,' + (.45 * vis).toFixed(3) + ')'; cx.lineWidth = 6; cx.setLineDash([r * .7, r * .5]); cx.lineDashOffset = -t * (140 - f * 60); cx.beginPath(); cx.ellipse(x, y, r, r * .2, 0, 0, 6.283); cx.stroke(); }
        cx.setLineDash([]);
      }
    });
  });

  addFx('snow', 'Snowstorm', 'more', 'M12 3v18M4 7.5l16 9M20 7.5l-16 9', function (S) {
    return cfx(S, 10, function (L) {
      var cx = L.cx, W = L.W, H = L.H, fl = [], cols = Math.ceil(W / 4) + 2, pile = [], i, cap = H * .16;
      for (i = 0; i < cols; i++) pile.push(0);
      return function (dt, t) {
        var wind = Math.sin(t * .7) * 50, n = Math.min(300, (W / 4) | 0);
        if (t < 7.3) for (i = 0; i < Math.min(5, n / 40 + 2); i++) fl.push({ x: rnd(-60, W + 60), y: -8, vy: rnd(60, 150), r: rnd(1.6, 4.2), ph: rnd(0, 6.3) });
        for (i = fl.length - 1; i >= 0; i--) {
          var f = fl[i]; f.y += f.vy * dt; f.x += (wind + Math.sin(t * 2 + f.ph) * 22) * dt; var c = clamp((f.x / 4) | 0, 0, cols - 1);
          if (f.y >= H - pile[c] - 2) { var add = f.r * .22; for (var k = -2; k <= 2; k++) { var cc = c + k; if (cc >= 0 && cc < cols) pile[cc] = Math.min(cap, pile[cc] + add / (1 + Math.abs(k))); } fl.splice(i, 1); }
        }
        var melt = t > 8 ? clamp(1 - (t - 8) / 1.6, 0, 1) : 1;
        cx.fillStyle = '#f7fbff'; cx.strokeStyle = 'rgba(120,150,200,.75)'; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(0, H); for (i = 0; i < cols; i++) cx.lineTo(i * 4, H - pile[i] * melt); cx.lineTo(W + 8, H); cx.closePath(); cx.fill(); cx.stroke();
        fl.forEach(function (f) { cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(f.x, f.y, f.r, 0, 6.283); cx.fill(); cx.strokeStyle = 'rgba(120,150,200,.7)'; cx.stroke(); });
      };
    });
  });

  addFx('confetti', 'Confetti cannon', 'more', 'M5 20 9 9l6 6zM14 4l1 3M19 8l-3 1M18 14l2 1', function (S) {
    return cfx(S, 6.6, function (L) {
      var cx = L.cx, W = L.W, H = L.H, pool = Fx(), shots = [.1, 1.4, 2.7], sv = clamp(H / 800, .75, 1.4);
      return function (dt, t) {
        while (shots.length && t >= shots[0]) { shots.shift(); snd('boom'); [0, 1].forEach(function (side) { for (var i = 0; i < 80; i++) { var a = -Math.PI / 2 + (side ? -.55 : .55) + rnd(-.4, .4), sp = rnd(450, 1000) * sv; pool.add(mk(side ? W - 14 : 14, H - 14, Math.cos(a) * sp, Math.sin(a) * sp, rnd(3, 4.6), { k: 'c', g: 650, d: .985, w: rnd(5, 10), hh: rnd(3, 6), a: rnd(0, 6.3), va: rnd(-8, 8), c: hsla(rnd(0, 360), 90, 58, 1), ph: rnd(0, 6.3) })); } }); }
        pool.step(dt, function (p, u) { p.a += p.va * dt; cx.save(); cx.translate(p.x, p.y); cx.rotate(p.a); cx.scale(1, Math.cos(t * 9 + p.ph)); cx.fillStyle = p.c; cx.globalAlpha = u > .85 ? (1 - u) / .15 : 1; cx.fillRect(-p.w / 2, -p.hh / 2, p.w, p.hh); cx.restore(); });
        cx.globalAlpha = 1;
        [0, 1].forEach(function (side) { cx.save(); cx.translate(side ? W - 14 : 14, H - 14); cx.rotate((side ? -1 : 1) * .55); cx.fillStyle = '#444'; cx.fillRect(-9, -34, 18, 34); cx.fillStyle = '#c0392b'; cx.fillRect(-12, -38, 24, 8); cx.restore(); });
      };
    });
  });

  addFx('fireworks', 'Fireworks', 'more', 'M12 12V4M12 12l6-6M12 12h8M12 12l6 6M12 12v8M12 12l-6 6M12 12H4M12 12 6 6', function (S) {
    return cfx(S, 8, function (L) {
      var cx = L.cx, W = L.W, H = L.H, pool = Fx(), rk = [], nx = .2;
      return function (dt, t) {
        if (t > nx && t < 6) { nx = t + rnd(.35, .7); rk.push({ x: rnd(W * .1, W * .9), y: H, vy: -rnd(560, 780), ty: rnd(H * .14, H * .5), h: rnd(0, 360) }); snd('whoosh'); }
        night(cx, W, H, .55 * ease(t / .6));
        for (var i = rk.length - 1; i >= 0; i--) {
          var r = rk[i]; r.y += r.vy * dt; pool.add(mk(r.x, r.y, rnd(-10, 10), rnd(20, 60), .35, { k: 'sp', h: 40, w: 2 }));
          if (r.y <= r.ty) { var n = (60 + Math.random() * 40) | 0, big = rnd(.8, 1.2); for (var k = 0; k < n; k++) { var a = k / n * 6.283 + rnd(-.05, .05), sp = rnd(70, 260) * big * (Math.random() < .5 ? 1 : .6); pool.add(mk(r.x, r.y, Math.cos(a) * sp, Math.sin(a) * sp, rnd(1, 1.7), { k: 'sp', h: r.h + rnd(-15, 15), g: 90, d: .985, w: 2 })); } snd('boom'); rk.splice(i, 1); }
        }
        pool.step(dt, function (p, u) { drawP(cx, p, u); }); cx.globalCompositeOperation = 'source-over';
      };
    });
  });

  addFx('paint', 'Paint splatter', 'more', 'M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z', function (S) {
    return cfx(S, 8, function (L) {
      var cx = L.cx, W = L.W, H = L.H, sp = [], nx = .1, R = clamp(Math.min(W, H) * .12, 38, 110);
      return function (dt, t) {
        if (t > nx && t < 5.4) {
          nx = t + .5; var r = R * rnd(.7, 1.2), s = { x: rnd(r, W - r), y: rnd(r, H * .8), h: rnd(0, 360), r: r, t0: t, bl: [], dr: [], dp: [] }, i, a;
          for (i = 0; i < 8; i++) { a = rnd(0, 6.283); s.bl.push([Math.cos(a) * r * rnd(.5, 1), Math.sin(a) * r * rnd(.5, 1), r * rnd(.25, .5)]); }
          for (i = 0; i < 16; i++) { a = rnd(0, 6.283); var d = r * rnd(1.2, 2.4); s.dr.push([Math.cos(a) * d, Math.sin(a) * d, rnd(2, 7)]); }
          for (i = 0; i < 4; i++) s.dp.push({ dx: rnd(-r * .6, r * .6), max: rnd(60, 190), v: rnd(30, 70), w: rnd(4, 8) });
          sp.push(s); snd('whoosh');
        }
        sp.forEach(function (s) {
          var g = ease((t - s.t0) / .18), col = hsla(s.h, 85, 52, .93); cx.fillStyle = col; cx.strokeStyle = col; cx.lineCap = 'round';
          cx.beginPath(); cx.arc(s.x, s.y, s.r * g, 0, 6.283); cx.fill(); s.bl.forEach(function (b) { cx.beginPath(); cx.arc(s.x + b[0] * g, s.y + b[1] * g, b[2] * g, 0, 6.283); cx.fill(); });
          var dg = ease((t - s.t0 - .06) / .15); s.dr.forEach(function (d) { cx.beginPath(); cx.arc(s.x + d[0] * dg, s.y + d[1] * dg, d[2] * dg, 0, 6.283); cx.fill(); });
          s.dp.forEach(function (d) { var len = Math.min(d.max, Math.max(0, (t - s.t0 - .3) * d.v)); cx.lineWidth = d.w; cx.beginPath(); cx.moveTo(s.x + d.dx, s.y + s.r * .5); cx.lineTo(s.x + d.dx, s.y + s.r * .5 + len); cx.stroke(); cx.beginPath(); cx.arc(s.x + d.dx, s.y + s.r * .5 + len, d.w * .75, 0, 6.283); cx.fill(); });
          cx.fillStyle = 'rgba(255,255,255,.3)'; cx.beginPath(); cx.arc(s.x - s.r * .3, s.y - s.r * .3, s.r * .22 * g, 0, 6.283); cx.fill();
        });
      };
    });
  });

  addFx('flip', 'Gravity flip', 'more', 'M8 4v14M4 14l4 4 4-4M16 20V6M12 10l4-4 4 4', function (S) {
    return elemPhysics(S, { dur: 5, damp: .1, rest: .35, max: 80, spinOnHit: true, init: function (it) { it.vy = rnd(-40, 0); it.va = rnd(-25, 25); }, acc: function (t) { return [0, t < 2.4 ? -1500 : 1500]; } });
  });

  addFx('words', 'Word rain', 'more', 'M4 6h6M4 11h9M4 16h5M15 14l3 5M18 14l3 5', function (S) {
    return cfx(S, 8.5, function (L) {
      var cx = L.cx, W = L.W, H = L.H, ws = [], pool = Fx(), pw = pageWords(80), n = 0, nx = 0;
      return function (dt, t) {
        if (t < 6.2 && t > nx) { nx = t + .07; ws.push({ w: pw[n++ % pw.length], x: rnd(30, W - 30), y: -16, vy: rnd(190, 340), s: rnd(15, 28), h: rnd(190, 270), r: 0 }); }
        cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineJoin = 'round';
        for (var i = ws.length - 1; i >= 0; i--) {
          var w = ws[i]; if (!w.r) { w.y += w.vy * dt; if (w.y >= H - 14) { w.y = H - 14; w.r = .001; for (var k = 0; k < 6; k++) pool.add(mk(w.x + rnd(-20, 20), H - 14, rnd(-70, 70), -rnd(60, 200), .6, { k: 'd', g: 600, c: hsla(w.h, 80, 55, 1), s: rnd(1.5, 3) })); } } else { w.r += dt; if (w.r > .8) { ws.splice(i, 1); continue; } }
          cx.globalAlpha = w.r ? 1 - w.r / .8 : 1; cx.font = '700 ' + (w.s | 0) + 'px system-ui,Arial,sans-serif'; cx.lineWidth = 4; cx.strokeStyle = 'rgba(255,255,255,.92)'; cx.strokeText(w.w, w.x, w.y); cx.fillStyle = hsla(w.h, 80, 40, 1); cx.fillText(w.w, w.x, w.y);
        }
        cx.globalAlpha = 1; pool.step(dt, function (p, u) { drawP(cx, p, u); });
      };
    });
  });

  addFx('laser', 'Laser show', 'more', 'M3 20 21 4M3 20 21 10M3 20 21 16', function (S) {
    return cfx(S, 7.5, function (L) {
      var cx = L.cx, W = L.W, H = L.H, src = [[W * .1, H], [W * .5, H], [W * .9, H], [W * .3, 0], [W * .7, 0]];
      return function (dt, t) {
        night(cx, W, H, .6 * ease(t / .6)); cx.globalCompositeOperation = 'lighter'; cx.lineCap = 'round';
        src.forEach(function (s, si) { for (var k = 0; k < 4; k++) { var up = s[1] > 0, a = (up ? -Math.PI / 2 : Math.PI / 2) + Math.sin(t * (1.1 + si * .23) + k * .9 + si) * (.5 + k * .12), x2 = s[0] + Math.cos(a) * H * 1.6, y2 = s[1] + Math.sin(a) * H * 1.6, h = t * 90 + si * 70 + k * 40;
          cx.strokeStyle = hsla(h, 100, 60, .16); cx.lineWidth = 10; cx.beginPath(); cx.moveTo(s[0], s[1]); cx.lineTo(x2, y2); cx.stroke(); cx.strokeStyle = hsla(h, 100, 70, .95); cx.lineWidth = 2.2; cx.stroke(); } });
        cx.globalCompositeOperation = 'source-over';
      };
    });
  });

  addFx('rubber', 'Rubber page', 'more', 'M4 12c3-8 5-8 8 0s5 8 8 0', function (S) {
    return elemPhysics(S, {
      dur: 8, damp: 1.1, rest: .3, max: 80,
      init: function (it) { var W = root.clientWidth, H = innerHeight; it.vx = ((it.l + it.r) / 2 - W / 2) * 2.6; it.vy = ((it.t + it.b) / 2 - H / 2) * 2.6; it.va = rnd(-30, 30); },
      acc: function (t, it, p, W, H) {
        var ax = -38 * it.x, ay = -38 * it.y;
        if (p.down) { var cxI = (it.l + it.r) / 2 + it.x, cyI = (it.t + it.b) / 2 + it.y, dx = p.x - cxI, dy = p.y - cyI, f = clamp(1 - Math.hypot(dx, dy) / Math.max(W, H), 0, 1) * 34; ax += dx * f; ay += dy * f; }
        return [ax, ay];
      }
    });
  });

  addFx('wreck', 'Wrecking ball', 'more', 'M12 2v6M12 8a6 6 0 1 0 .1 0z', function (S) {
    var bx = 0, by = 0, R = 40, pv = 0, Lc = 0;
    return elemPhysics(S, {
      dur: 7, damp: .8, rest: .5, max: 80, spinOnHit: true,
      step: function (dt, t, p, W, H) { pv = W / 2; Lc = H * .9; R = clamp(Math.min(W, H) * .09, 28, 60); var a = 1.05 * Math.cos(t * 1.85); bx = pv + Math.sin(a) * Lc; by = -10 + Math.cos(a) * Lc; },
      init: function (it) { it.va = rnd(-10, 10); },
      acc: function (t, it) { var x = (it.l + it.r) / 2 + it.x, y = (it.t + it.b) / 2 + it.y, dx = x - bx, dy = y - by, d = Math.hypot(dx, dy) + 1; if (d < R + 70) return [dx / d * 7000, dy / d * 7000 - 600]; return [0, 800]; },
      draw: function (cx, t, items, W, H, ptr, vis) {
        cx.strokeStyle = '#333'; cx.lineWidth = 3; cx.setLineDash([8, 4]); cx.beginPath(); cx.moveTo(pv, -10); cx.lineTo(bx, by); cx.stroke(); cx.setLineDash([]);
        var g = cx.createRadialGradient(bx - R * .3, by - R * .3, R * .1, bx, by, R); g.addColorStop(0, '#9aa0aa'); g.addColorStop(1, '#262a31'); cx.fillStyle = g; cx.beginPath(); cx.arc(bx, by, R, 0, 6.283); cx.fill(); cx.strokeStyle = '#111'; cx.lineWidth = 2; cx.stroke();
        cx.fillStyle = '#555'; cx.beginPath(); cx.arc(pv, -10, 9, 0, 6.283); cx.fill();
      }
    });
  });

  addFx('slime', 'Slime', 'more', 'M4 4h16v6c0 2-2 2-2 4v4M10 10v8M14 10v4', function (S) {
    return cfx(S, 8.5, function (L) {
      var cx = L.cx, W = L.W, H = L.H, cols = Math.ceil(W / 20) + 1, dr = [], i, bub = [];
      for (i = 0; i < cols; i++) dr.push({ x: i * 20 + rnd(-4, 4), max: rnd(.05, .38) * H, v: rnd(.6, 1.4), w: rnd(14, 24) });
      return function (dt, t) {
        var k = ease((7.3 - t) / 1.3), base = ease(t / 2.4) * H * .06 * k;
        cx.lineCap = 'round'; var g = cx.createLinearGradient(0, 0, 0, H * .45); g.addColorStop(0, 'rgba(120,214,20,.93)'); g.addColorStop(1, 'rgba(60,160,10,.93)'); cx.fillStyle = g; cx.strokeStyle = g; cx.fillRect(0, 0, W, base + 6);
        dr.forEach(function (d) { var len = Math.min(d.max, Math.max(0, (t - .2) * H * .09 * d.v)) * k; cx.lineWidth = d.w; cx.beginPath(); cx.moveTo(d.x, 0); cx.lineTo(d.x, base + len); cx.stroke(); cx.fillStyle = 'rgba(255,255,255,.35)'; cx.fillRect(d.x - d.w * .28, base, 3, Math.max(0, len - 4)); cx.fillStyle = g; });
        if (t < 6 && Math.random() < .12) bub.push({ x: rnd(0, W), y: rnd(0, H * .12), r: rnd(3, 9), l: 1 });
        bub.forEach(function (b) { b.l -= dt * 1.2; if (b.l > 0) { cx.strokeStyle = 'rgba(230,255,200,' + b.l + ')'; cx.lineWidth = 1.5; cx.beginPath(); cx.arc(b.x, b.y, b.r * (1.3 - b.l * .3), 0, 6.283); cx.stroke(); } });
      };
    });
  });

  addFx('disco', 'Disco mode', 'more', 'M12 3a8 8 0 1 0 .1 0zM4 11h16M12 3c3 3 3 13 0 16M12 3c-3 3-3 13 0 16', function (S) {
    return cfx(S, 8.5, function (L) {
      var cx = L.cx, W = L.W, H = L.H, beat = -1, bR = clamp(Math.min(W, H) * .06, 22, 44), tw = W / Math.round(W / 70);
      return function (dt, t) {
        night(cx, W, H, .5 * ease(t / .6)); var b = Math.floor(t * 2); if (b !== beat) { beat = b; snd('kick'); } var pulse = 1 - ((t * 2) % 1);
        cx.globalCompositeOperation = 'lighter';
        for (var i = 0; i < 6; i++) { var ox = W * (i + .5) / 6, a = Math.sin(t * (1.1 + i * .17) + i) * .7, len = H * 1.2, x2 = ox + Math.sin(a) * len, y2 = Math.cos(a) * len, hw = len * .09, g = cx.createLinearGradient(ox, 0, x2, y2); g.addColorStop(0, hsla(i * 60 + t * 50, 100, 60, .55)); g.addColorStop(1, hsla(i * 60 + t * 50, 100, 60, 0));
          cx.fillStyle = g; cx.beginPath(); cx.moveTo(ox, -6); cx.lineTo(x2 - Math.cos(a) * hw, y2 + Math.sin(a) * hw); cx.lineTo(x2 + Math.cos(a) * hw, y2 - Math.sin(a) * hw); cx.fill(); }
        for (var c = 0; c * tw < W; c++) for (var r = 0; r < 2; r++) { cx.fillStyle = hsla(c * 26 + r * 90 + t * 120, 100, 55, .28 + .35 * pulse * (((c + r + b) % 2) ? 1 : .3)); cx.fillRect(c * tw + 1, H - 40 - r * 40 + 1, tw - 2, 38); }
        for (var k = 0; k < 26; k++) { var an = k * .2417 + t * .5, d = H * (.12 + (k % 6) * .11); cx.fillStyle = hsla(k * 40 + t * 60, 100, 75, .65); cx.beginPath(); cx.arc(W / 2 + Math.cos(an) * d * 1.5, H * .14 + Math.abs(Math.sin(an)) * d, 3 + (k % 3), 0, 6.283); cx.fill(); }
        cx.globalCompositeOperation = 'source-over'; var bx = W / 2, by = H * .14; cx.strokeStyle = '#999'; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(bx, 0); cx.lineTo(bx, by - bR); cx.stroke();
        var bg = cx.createRadialGradient(bx - bR * .3, by - bR * .3, bR * .1, bx, by, bR); bg.addColorStop(0, '#fff'); bg.addColorStop(1, '#7a8190'); cx.fillStyle = bg; cx.beginPath(); cx.arc(bx, by, bR, 0, 6.283); cx.fill();
        cx.strokeStyle = 'rgba(40,50,70,.45)'; cx.lineWidth = 1; for (var q = -3; q <= 3; q++) { cx.beginPath(); cx.ellipse(bx, by, Math.abs(Math.cos(q / 7 * Math.PI + t)) * bR, bR, 0, 0, 6.283); cx.stroke(); cx.beginPath(); cx.moveTo(bx - bR, by + q * bR / 3.5); cx.lineTo(bx + bR, by + q * bR / 3.5); cx.stroke(); }
      };
    });
  });

  // labels, icons and groups for the older physics toys
  var META = { float: ['Zero gravity', 'M12 3v14M7 8l5-5 5 5M6 20h12'], tilt: ['Tilt', 'M4 16 20 8M7 20h10'], drop: ['Everything drops', 'M12 3v14M7 12l5 5 5-5M5 21h14'], magnet: ['Magnet', 'M6 4v8a6 6 0 0 0 12 0V4M6 8h4M14 8h4'], balls: ['Bouncy balls', 'M8 8a3 3 0 1 0 .1 0zM16 14a4 4 0 1 0 .1 0zM5 21h14'], bubbles: ['Bubbles', 'M8 14a5 5 0 1 0 .1 0zM17 8a3 3 0 1 0 .1 0z'], tensegrity: ['Tensegrity toy', 'M5 5l14 14M19 5 5 19'] };
  EFFECTS.forEach(function (e) { var m = META[e.name]; if (m) { e.label = m[0]; e.ic = m[1]; e.group = e.name === 'tensegrity' ? 'hidden' : 'more'; } });

  // after a grab on a toy, swallow the click that follows so nothing underneath fires
  function swallow(S) {
    var h = function (e) { e.preventDefault(); e.stopPropagation(); doc.removeEventListener('click', h, true); }; doc.addEventListener('click', h, true);
    setTimeout(function () { doc.removeEventListener('click', h, true); }, 400);
  }
  function gentle() {   // reduced motion: a few things drift a few pixels and come back
    var S = Session(); FZ.cur = S; var els = pickEls(24), sv = [];
    els.forEach(function (e, i) { sv.push([e, e.style.getPropertyValue('translate'), e.style.getPropertyValue('transition')]); e.style.setProperty('transition', 'translate 1.4s ease-in-out'); e.style.setProperty('translate', '0 ' + (i % 2 ? -8 : 8) + 'px'); });
    var t1 = setTimeout(function () { sv.forEach(function (s) { s[0].style.setProperty('translate', '0 0'); }); }, 1500);
    var t2 = setTimeout(function () { stopFunsies(); }, 3100);
    S.undo.push(function () { clearTimeout(t1); clearTimeout(t2); sv.forEach(function (s) { if (s[1]) s[0].style.setProperty('translate', s[1]); else s[0].style.removeProperty('translate'); if (s[2]) s[0].style.setProperty('transition', s[2]); else s[0].style.removeProperty('transition'); }); });
  }
  function stopFunsies(silent) {
    var S = FZ.cur; FZ.cur = null; if (S) { try { S.stop(); } catch (e) { } if (!silent && FZ.name) showAgain(FZ.name); }
    if (doc.body) root.classList.remove('hmr-fz-on');
  }
  function effByName(n) { for (var i = 0; i < EFFECTS.length; i++) if (EFFECTS[i].name === n) return EFFECTS[i]; return null; }
  function loadRecents() { try { var a = JSON.parse(lsGet(RECKEY) || '[]'); return Array.isArray(a) ? a.filter(function (n) { return effByName(n) && effByName(n).group !== 'hidden'; }).slice(0, 3) : []; } catch (e) { return []; } }
  function pushRecent(n) { var a = loadRecents().filter(function (x) { return x !== n; }); a.unshift(n); lsSet(RECKEY, JSON.stringify(a.slice(0, 3))); }
  function showAgain(name) {
    var e = effByName(name); if (!e || e.group === 'hidden') return;
    again.textContent = 'Again: ' + (e.label || name); again.setAttribute('data-fx', name); again.hidden = false;
    clearTimeout(FZ.timer); FZ.timer = setTimeout(function () { again.hidden = true; }, 9000);
  }
  function hideAgain() { clearTimeout(FZ.timer); again.hidden = true; }
  function runEffect(name) {
    var e = effByName(name); if (!e) return;
    stopFunsies(true); stopSoft(); hideAgain();
    if (panel && !panel.hidden) closeRx(false);
    FZ.name = name; pushRecent(name);
    if (rm()) { gentle(); return; }
    var S = Session(); FZ.cur = S; var ok = false;
    try { ok = e.run(S); } catch (err) { ok = false; try { console.warn('hmr-dock funsies', err); } catch (e2) { } }
    if (!ok) stopFunsies(true);
  }
  again.addEventListener('click', function () { var n = again.getAttribute('data-fx'); if (n) runEffect(n); });

  // ------------------------------------------------------------------ Funsies menu
  var RECKEY = 'hmr-funsies-recent-v1', fzm = null, povEl = null, povT = 0;
  var PLAY = [
    { id: 'smash', title: 'Fennsmash', sub: 'The smash game', url: 'https://claudebomb.com/smash/', ic: 'M5 19 15 9M12 4l8 8M4 12l3 3' },
    { id: 'react', title: 'Reaction App', sub: 'Test your reactions', url: 'https://reactionapp.life/app/', ic: 'M12 3a9 9 0 1 0 .1 0zM8.5 10h.01M15.5 10h.01M8 15c2 2 6 2 8 0' }
  ];
  // v6.9: the tensegrity simulation (Leo's name for it: "HMR Human Tensegrity Simulation") is listed only on the HMR sites; HMR stays hidden on the other family sites
  var HMRHOST = /(^|\.)(universemodel\.ai|hmrfamily\.life|hmrfascia\.life|hmr\.family|chronomath\.ai)$/i.test(location.hostname);
  if (HMRHOST) PLAY.push({ id: 'tenseg', title: 'HMR Human Tensegrity Simulation', sub: 'Pluck a living structure', url: 'https://universemodel.ai/simulation.html', ic: 'M5 5l14 14M19 5 5 19M5 5h14v14H5z' });
  function icon(d) { var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); var p = doc.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); s.appendChild(p); return s; }
  function fxBtn(e) { var b = el('button', 'hmr-ffb'); b.type = 'button'; b.setAttribute('data-fx', e.name); b.appendChild(icon(e.ic || 'M12 3v18M3 12h18')); b.appendChild(el('span', '', e.label || e.name)); b.addEventListener('click', function () { choose(e.name); }); return b; }
  function section(title, nodes, cls) { var h = el('h3', '', title); fzm.appendChild(h); var g = el('div', cls || 'hmr-fgrid'); g.setAttribute('role', 'group'); g.setAttribute('aria-label', title); nodes.forEach(function (n) { g.appendChild(n); }); fzm.appendChild(g); }
  function buildMenu() {
    if (!fzm) {
      fzm = el('div', 'hmr-fzm'); fzm.id = 'hmr-fzm'; fzm.hidden = true; fzm.setAttribute('role', 'dialog'); fzm.setAttribute('aria-modal', 'true'); fzm.setAttribute('aria-label', 'Funsies');
      fzm.addEventListener('keydown', menuKey); doc.body.appendChild(fzm);
    }
    fzm.textContent = '';
    var hd = el('div', 'hd'); hd.appendChild(el('span', '', 'Funsies')); var x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close Funsies'); x.addEventListener('click', function () { closeFz(true); }); hd.appendChild(x); fzm.appendChild(hd);
    var rec = loadRecents().map(effByName).filter(Boolean); if (rec.length) section('Recent', rec.map(fxBtn));
    section('Wreck the page', EFFECTS.filter(function (e) { return e.group === 'wreck'; }).map(fxBtn));
    section('Play', PLAY.map(function (p) { var b = el('button', 'hmr-fcard'); b.type = 'button'; b.setAttribute('data-play', p.id); b.appendChild(icon(p.ic)); b.appendChild(el('span', '', p.title)); b.appendChild(el('small', '', p.sub)); b.addEventListener('click', function () { openPlay(p); }); return b; }), 'hmr-fplay');
    section('More fun', EFFECTS.filter(function (e) { return e.group === 'more'; }).map(fxBtn));
  }
  function focusables() { return fzm ? [].filter.call(fzm.querySelectorAll('button,a[href]'), function (b) { return !b.disabled && b.offsetParent !== null; }) : []; }
  function menuKey(e) {
    if (e.key === 'Tab') {
      var f = focusables(); if (!f.length) return; var i = f.indexOf(doc.activeElement);
      if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { f[0].focus(); e.preventDefault(); }
      return;
    }
    var dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }, d = dirs[e.key]; if (!d) return;
    var f2 = focusables(), cur = doc.activeElement, ci = f2.indexOf(cur); e.preventDefault(); if (ci < 0) { if (f2[0]) f2[0].focus(); return; }
    var r = cur.getBoundingClientRect(), best = null, bs = 1e9;
    f2.forEach(function (b) {
      if (b === cur) return; var q = b.getBoundingClientRect(), dx = q.left + q.width / 2 - (r.left + r.width / 2), dy = q.top + q.height / 2 - (r.top + r.height / 2);
      var okk = d[0] ? (dx * d[0] > 4 && Math.abs(dy) < r.height * .6) : (dy * d[1] > 4); if (!okk) return;
      var s = d[0] ? Math.abs(dx) + Math.abs(dy) * 3 : Math.abs(dy) + Math.abs(dx) * .6; if (s < bs) { bs = s; best = b; }
    });
    if (!best && d[0]) best = f2[(ci + d[0] + f2.length) % f2.length];
    if (best) { best.focus(); try { best.scrollIntoView({ block: 'nearest' }); } catch (e2) { } }
  }
  function openFz() {
    try { if (window.HMRDash) window.HMRDash.closeQuiet(); } catch (e) { }
    stopFunsies(true); hideAgain(); if (panel && !panel.hidden) closeRx(false); closePlay(false); closeSheet(false); closeSpeak(false); hideHlm();
    buildMenu(); fzm.hidden = false; fzBtn.setAttribute('aria-expanded', 'true');
    doc.addEventListener('pointerdown', outside, true);
    var f = fzm.querySelector('.hmr-ffb,.hmr-fcard'); if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
  }
  function closeFz(back) {
    if (fzm) fzm.hidden = true; fzBtn.setAttribute('aria-expanded', 'false'); doc.removeEventListener('pointerdown', outside, true);
    if (back) { try { fzBtn.focus({ preventScroll: true }); } catch (e) { fzBtn.focus(); } }
  }
  function outside(e) { if (!fzm || fzm.hidden) return; if (fzm.contains(e.target) || e.target === fzBtn || fzBtn.contains(e.target)) return; closeFz(false); }
  function choose(name) { closeFz(true); runEffect(name); }
  fzBtn.addEventListener('click', function () { if (fzm && !fzm.hidden) closeFz(true); else openFz(); });

  // ------------------------------------------------------------------ Play overlay: in-page, falls back to a new tab
  function openPlay(p) {
    closeFz(false);
    try { if (location.origin + location.pathname === p.url) return; } catch (e) { }
    closePlay(false); povEl = el('div', 'hmr-pov'); var win = el('div', 'win'); povEl._win = win; povEl.appendChild(win); povEl.addEventListener('click', function (ev) { if (ev.target === povEl) closePlay(true); }); povEl.setAttribute('role', 'dialog'); povEl.setAttribute('aria-modal', 'true'); povEl.setAttribute('aria-label', p.title);
    var bar = el('div', 'bar'); bar.appendChild(el('b', '', p.title));
    var zm = el('button', 'zb', '\u2212'), zl = el('span', 'zl', '100%'), zp = el('button', 'zb', '+');
    zm.type = zp.type = 'button'; zm.setAttribute('aria-label', 'Zoom out'); zp.setAttribute('aria-label', 'Zoom in'); zm.title = 'Zoom out'; zp.title = 'Zoom in';
    bar.appendChild(zm); bar.appendChild(zl); bar.appendChild(zp);
    var a = el('a', '', 'New tab'); a.href = p.url; a.target = '_blank'; a.rel = 'noopener'; bar.appendChild(a); win.appendChild(bar);
    var x = el('button', 'x', '\u00d7'); x.type = 'button'; x.setAttribute('aria-label', 'Close ' + p.title); x.addEventListener('click', function () { closePlay(true); }); win.appendChild(x);
    var fw = el('div', 'fw'); win.appendChild(fw);
    var fr = doc.createElement('iframe'), loaded = false, z = 1; fr.name = 'hmr-embed'; fr.title = p.title; fr.setAttribute('allow', 'fullscreen; autoplay; accelerometer; gyroscope'); fr.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    function setZ(v) { z = clamp(Math.round(v * 100) / 100, .5, 2.5); fr.style.width = (100 / z) + '%'; fr.style.height = (100 / z) + '%'; fr.style.transform = z === 1 ? 'none' : 'scale(' + z + ')'; zl.textContent = Math.round(z * 100) + '%'; }
    zm.addEventListener('click', function () { setZ(z - .15); }); zp.addEventListener('click', function () { setZ(z + .15); });
    fr.addEventListener('load', function () { loaded = true; clearTimeout(povT); try { fr.contentWindow.addEventListener('wheel', function (e) { e.stopImmediatePropagation(); }, { capture: true, passive: true }); } catch (e) { } });
    fr.src = p.url; fw.appendChild(fr); povEl._fr = fr; povEl.addEventListener('keydown', povKey); doc.body.appendChild(povEl); root.classList.add('hmr-pov-on');
    povT = setTimeout(function () { if (!loaded) fallback(p); }, 4000);
    try { x.focus({ preventScroll: true }); } catch (e) { x.focus(); }
  }
  function fallback(p) {
    if (!povEl) return; var w = null; try { w = window.open(p.url, '_blank'); if (w) w.opener = null; } catch (e) { }
    window.HMRDock && (window.HMRDock.lastFallback = p.url);
    if (w) { closePlay(true); return; }
    if (povEl._fr) { var fwr = povEl._fr.parentNode; povEl._fr.remove(); if (fwr) fwr.remove(); } var m = el('div', 'msg'); m.appendChild(el('p', '', 'This could not open here.')); var a = el('a', '', 'Open ' + p.title + ' in a new tab'); a.href = p.url; a.target = '_blank'; a.rel = 'noopener'; m.appendChild(a); povEl._win.appendChild(m);
  }
  function closePlay(back) {
    clearTimeout(povT); if (povEl) { povEl.remove(); povEl = null; } root.classList.remove('hmr-pov-on');
    if (back) { try { fzBtn.focus({ preventScroll: true }); } catch (e) { fzBtn.focus(); } }
  }
  function povKey(e) {
    if (e.key !== 'Tab' || !povEl) return; var f = [].filter.call(povEl.querySelectorAll('button,a[href]'), function (b) { return b.offsetParent !== null; }); if (!f.length) return; var i = f.indexOf(doc.activeElement);
    if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && (i === f.length - 1)) { f[0].focus(); e.preventDefault(); }
  }
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (povEl) { closePlay(true); return; }
    if (fzm && !fzm.hidden) { closeFz(true); return; }
  });


  // ================================================================== V3: nav, send, feedback, lost, highlight, design v2, tracking
  var TOADDR = 'leo@universemodel.ai';
  function jget(k, d) { try { var v = JSON.parse(lsGet(k)); return v == null ? d : v; } catch (e) { return d; } }
  function jset(k, v) { return lsSet(k, JSON.stringify(v)); }
  function ldel(k) { try { localStorage.removeItem(k); } catch (e) { } }
  function formKey() { return window.HMR_FORM_KEY || FORM_KEY || ''; }
  var BAD = '[data-hmr-dock],[data-hmr-ui],.hmr-rxp,.hmr-fzm,.hmr-fbp,.hmr-spk,.hmr-hlm,.hmr-pov,.hmr-dx,.hmr-toast,.hmr-gen,textarea,input,select,script,style,[contenteditable="true"]';
  function badNode(a) { try { if (a && a.closest) { if (a.closest(BAD)) return true; if (ps && a.closest(ps)) return true; if (ds && a.closest(ds)) return true; } } catch (e) { } return false; }

  // ---- send: web3forms, falling back to the visitor's own email app (text is always kept by the caller)
  function openMail(url) {
    try { window.HMRDock.lastMailto = url; } catch (e) { }
    try { window.open(url, '_self'); } catch (e) { try { var a = el('a'); a.href = url; doc.body.appendChild(a); a.click(); a.remove(); } catch (e2) { } }
  }
  function mailParts(p) {
    p = p || {}; var kind = p.kind || 'feedback', msg = String(p.message || '').trim(), details = p.details ? JSON.stringify(p.details) : '';
    var subject = kind === 'speak' ? 'HMR site, Speak here: ' + CFG.site : 'HMR site feedback: ' + CFG.site;
    var body = msg + '\n\n--\nSite: ' + CFG.site + '\nPage: ' + location.href + '\nKind: ' + kind + (p.email ? '\nReply to: ' + p.email : '') + (details ? '\nDetails: ' + details : '');
    return { subject: subject, kind: kind, msg: msg, details: details, body: body };
  }
  function mailSelf(p, to) {
    var m = mailParts(p);
    var url = 'mailto:' + (to == null ? TOADDR : to) + '?subject=' + encodeURIComponent(m.subject + ' [' + m.kind + ']') + '&body=' + encodeURIComponent(m.body.slice(0, 1800));
    openMail(url); return { ok: false, via: 'mailto', url: url };
  }
  function send(p) {
    p = p || {};
    var m = mailParts(p), fields = { subject: p.subject || m.subject, from_name: 'HMR site', site: CFG.site, page: location.href, kind: m.kind, message: m.body };
    if (p.email) { fields.email = p.email; fields.replyto = p.email; }
    if (m.details) fields.details = m.details;
    var key = formKey();
    if (p.noMailto && (!key || !window.fetch)) return Promise.resolve({ ok: false, via: 'none' });
    if (!key || !window.fetch) { var r0 = mailSelf(p); r0.reason = key ? 'no-fetch' : 'no-key'; return Promise.resolve(r0); }
    fields.access_key = key; fields.botcheck = '';
    var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { try { if (ctl) ctl.abort(); } catch (e) { } }, 15000);
    return fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(fields), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && !(j && j.success === false) }; }, function () { return { ok: r.ok }; }); })
      .then(function (res) { clearTimeout(t); if (res.ok) return { ok: true, via: 'web3forms' }; if (p.noMailto) return { ok: false, via: 'none' }; var r1 = mailSelf(p); r1.reason = 'http'; return r1; },
        function () { clearTimeout(t); if (p.noMailto) return { ok: false, via: 'none' }; var r2 = mailSelf(p); r2.reason = 'network'; return r2; });
  }
  var SENT_LINE = 'Sent. Thank you so much for your contribution.';
  var MAIL_LINE = 'Your email app should have opened with your message. Your text is still saved here.';

  // ---- toast
  var toastEl = null, toastT = 0;
  function toast(t, pt, ms) {
    if (!toastEl) { toastEl = el('div', 'hmr-toast'); toastEl.setAttribute('role', 'status'); toastEl.setAttribute('aria-live', 'polite'); doc.body.appendChild(toastEl); }
    toastEl.textContent = t; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('on'); }, ms || 2800);
    var st = toastEl.style;
    if (pt) {   // right next to where the visitor clicked
      st.bottom = 'auto'; st.transform = 'none'; var w = toastEl.offsetWidth, h = toastEl.offsetHeight;
      st.left = clamp(pt.x - w / 2, 8, Math.max(8, innerWidth - w - 8)) + 'px';
      st.top = clamp(pt.y - h - 14 < 8 ? pt.y + 22 : pt.y - h - 14, 8, Math.max(8, innerHeight - h - 8)) + 'px';
    } else { st.left = st.top = st.bottom = st.transform = ''; }
  }
  function copyText(t) {
    try { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(function () { return true; }, function () { return legacyCopy(t); }); } catch (e) { }
    return Promise.resolve(legacyCopy(t));
  }
  function legacyCopy(t) { try { var ta = el('textarea'); ta.value = t; ta.style.cssText = 'position:fixed;left:-9999px;top:0'; doc.body.appendChild(ta); ta.select(); var ok = doc.execCommand('copy'); ta.remove(); return !!ok; } catch (e) { return false; } }

  // ---- the one way anything is submitted to us: "Submit with my email" (shows the email field) or "Submit anonymously"
  // o: { text: fn -> string (trimmed, may be empty), kind, details: fn -> object, empty: message when no text, onSent: fn }
  var subN = 0;
  function submitPair(o) {
    var w = el('div', 'hmr-sub'), n = ++subN, emr = el('div', 'hs-emr'), lb = el('label', '', 'Your email, so we can reply'), em = el('input'), two = el('div', 'hs-two');
    var b1 = el('button', 'hs-btn m', 'Submit with my email'), b2 = el('button', 'hs-btn a', 'Submit anonymously'), st = el('p', 'hs-st');
    emr.hidden = true; lb.setAttribute('for', 'hmr-sub-em' + n); em.type = 'email'; em.id = 'hmr-sub-em' + n; em.setAttribute('autocomplete', 'email'); emr.appendChild(lb); emr.appendChild(em);
    b1.type = b2.type = 'button'; st.setAttribute('role', 'status'); st.setAttribute('aria-live', 'polite'); two.appendChild(b1); two.appendChild(b2);
    w.appendChild(emr); w.appendChild(two); w.appendChild(st);
    function go(email) {
      var t = String(o.text() || '').trim();
      if (!t && !o.empty) { st.textContent = 'Add a few words first, or tap the microphone and talk.'; return; }
      st.textContent = 'Sending...'; b1.disabled = b2.disabled = true;
      var p = { kind: typeof o.kind === 'function' ? o.kind() : o.kind, message: t || o.empty }; if (email) p.email = email; var d = o.details ? o.details() : null; if (d) p.details = d;
      send(p).then(function (r) {
        b1.disabled = b2.disabled = false;
        if (r.ok) { st.textContent = SENT_LINE; try { if (o.onSent) o.onSent(); } catch (e) { } } else st.textContent = MAIL_LINE;
      });
    }
    b1.addEventListener('click', function () {
      if (emr.hidden) { emr.hidden = false; st.textContent = 'Type your email, then press Submit with my email again.'; try { em.focus(); } catch (e) { } return; }
      var v = em.value.trim(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { st.textContent = 'That email does not look right. Check it and try again.'; try { em.focus(); } catch (e) { } return; }
      go(v);
    });
    b2.addEventListener('click', function () { go(''); });
    return { el: w, st: st, say: function (t) { st.textContent = t; }, anon: function () { go(''); } };
  }

  // ---- styles for the new parts
  var PILL = 'pointer-events:auto;position:fixed;bottom:' + BASE + ';margin:0 0 4px;height:46px;border:2px solid #fff;border-radius:999px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 14px;font-size:14px;font-weight:800;letter-spacing:.01em;white-space:nowrap;box-shadow:0 6px 20px rgba(0,0,0,.38);-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform .25s,opacity .2s;transform:none';
  styleEl.textContent += [
    // v6.5: one grid row. Back, Funsies, spacer, HMR, spacer, Speak, React, Forward. Each button keeps its own look; the grid places it.
    '.hmr-dock{display:grid!important;grid-template-columns:auto auto minmax(0,1fr) auto minmax(0,1fr) auto auto auto;align-items:center;column-gap:var(--hmr-g);height:auto!important;left:' + LEFT + '!important;right:' + RIGHT + '!important;bottom:' + BASE + '!important}',
    '.hmr-dock>#hmr-back,.hmr-dock>#hmr-fz,.hmr-dock>.hmr-fzbtn,.hmr-dock>#hmr-hmr,.hmr-dock>#hmr-speak,.hmr-dock>.hmr-rxbtn,.hmr-dock>#hmr-fwd{position:relative!important;left:auto!important;right:auto!important;bottom:auto!important;top:auto!important;margin:0!important}',
    '.hmr-dock>#hmr-back{grid-column:1}.hmr-dock>.hmr-fzbtn{grid-column:2}.hmr-dock>#hmr-hmr{grid-column:4}.hmr-dock>#hmr-speak{grid-column:6}.hmr-dock>.hmr-rxbtn{grid-column:7}.hmr-dock>#hmr-fwd{grid-column:8}',
    '.hmr-hmrbtn{pointer-events:auto;width:var(--hmr-hw);height:var(--hmr-hw);padding:0;border-radius:50%;border:2px solid #fff;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;background:conic-gradient(from 210deg,#e0307a,#f59e0b,#06b6d4,#8b5cf6,#e0307a);box-shadow:0 6px 22px rgba(0,0,0,.42),0 0 0 3px rgba(255,255,255,.18);-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform .25s}',
    '.hmr-hmrbtn .hmr-hmrt{display:flex;align-items:center;justify-content:center;width:calc(100% - 8px);height:calc(100% - 8px);border-radius:50%;background:rgba(10,12,24,.55);font:900 13px/1 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;letter-spacing:.02em;white-space:nowrap}',
    '@media (max-width:480px){.hmr-hmrbtn .hmr-hmrt{font-size:12px}}@media (max-width:374px){.hmr-hmrbtn .hmr-hmrt{font-size:11px;letter-spacing:0}}',
    '.hmr-hmrbtn:hover{transform:scale(1.07)}.hmr-hmrbtn:active{transform:scale(.94)}.hmr-hmrbtn[aria-expanded="true"]{box-shadow:0 6px 22px rgba(0,0,0,.42),0 0 0 4px #fff}',
    '.hmr-hmrbtn.ld .hmr-hmrt{animation:hmrld 1s linear infinite}@keyframes hmrld{50%{opacity:.45}}',
    '.hmr-hmrbtn:focus-visible{outline:3px solid #f59e0b;outline-offset:3px}',
    '@media (prefers-reduced-motion:reduce){.hmr-hmrbtn{transition:none}.hmr-hmrbtn:hover{transform:none}.hmr-hmrbtn.ld .hmr-hmrt{animation:none}}',
    '.hmr-dock{--hmr-hw:62px;--hmr-fw:116px;--hmr-nw:56px;--hmr-sw:46px;--hmr-g:6px;--hmr-sh:calc((var(--hmr-g) + var(--hmr-sw)) / -2)}',
    '@media (max-width:480px){.hmr-dock{--hmr-hw:56px;--hmr-fw:84px;--hmr-nw:44px;--hmr-sw:44px;--hmr-g:4px}}@media (max-width:374px){.hmr-dock{--hmr-hw:48px;--hmr-fw:66px;--hmr-nw:36px;--hmr-sw:36px;--hmr-g:3px}.hmr-fzbtn{font-size:13px!important}}',
    '.hmr-fzbtn{width:var(--hmr-fw)!important;margin-left:calc(var(--hmr-fw) / -2 + var(--hmr-sh))!important}.hmr-dock>.hmr-fzbtn{margin:0!important}',
    '.hmr-nv,.hmr-spbtn{' + PILL + '}',
    '.hmr-nv{width:var(--hmr-c);height:var(--hmr-c);padding:0;margin:0;border-radius:50%}.hmr-nv svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}',
    '.hmr-nv.back{left:' + LEFT + ';right:auto;background:linear-gradient(135deg,#06b6d4,#3b82f6)}',
    '.hmr-nv.fwd{right:' + RIGHT + ';left:auto;background:linear-gradient(135deg,#8b5cf6,#06b6d4)}',
    '.hmr-nv.off{opacity:.45;filter:grayscale(.7);cursor:default}',
    '.hmr-nv .ntip{position:absolute;right:0;bottom:calc(100% + 12px);width:236px;max-width:calc(100vw - 24px);background:#111;color:#fff;border:2px solid #fff;border-radius:10px;padding:8px 10px;font-size:12px;font-weight:600;line-height:1.35;text-align:left;white-space:normal;letter-spacing:0;text-transform:none;pointer-events:none;opacity:0;visibility:hidden;transition:opacity .15s;box-shadow:0 6px 18px rgba(0,0,0,.4)}',
    '.hmr-nv:hover .ntip,.hmr-nv:focus-visible .ntip{opacity:1;visibility:visible}',
    '.hmr-nv.hmr-nt0 .ntip{opacity:0!important;visibility:hidden!important}',
    '.hmr-spbtn{left:50%;width:var(--hmr-sw);height:var(--hmr-sw);padding:0;margin:0 0 calc((var(--hmr-c) - var(--hmr-sw)) / 2);margin-left:calc(var(--hmr-fw) / 2 + var(--hmr-g) + var(--hmr-sh));background:linear-gradient(135deg,#ec4899,#f59e0b 55%,#22c55e)}.hmr-spbtn svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.hmr-spbtn:hover{transform:rotate(-3deg) scale(1.08)}.hmr-spbtn:active{transform:scale(.94)}.hmr-spbtn[aria-expanded="true"]{background:linear-gradient(135deg,#dc2626,#7f1d1d)}',
    '.hmr-nv:not(.off):hover{transform:rotate(-3deg) scale(1.06)}.hmr-nv:not(.off):active{transform:scale(.95)}',
    '@media (prefers-reduced-motion:reduce){.hmr-nv,.hmr-spbtn{transition:none}.hmr-nv:hover,.hmr-spbtn:hover{transform:none!important}}',
    '.hmr-nv:focus-visible,.hmr-fbp button:focus-visible,.hmr-fbp textarea:focus-visible,.hmr-fbp input:focus-visible,.hmr-hlm button:focus-visible,.hmr-dx button:focus-visible,.hmr-dx textarea:focus-visible,.hmr-dx select:focus-visible,.hmr-dsp button:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}',
    // hate / neutral / love slider
    '.hmr-rate{display:block;margin:4px 0}.hmr-rate label{display:block;font-weight:700;margin:0 0 2px}',
    '.hmr-rate input[type=range]{display:block;width:100%;height:28px;margin:0;padding:0;background:transparent;cursor:pointer;-webkit-appearance:none;appearance:none;border:0}',
    '.hmr-rate input[type=range]::-webkit-slider-runnable-track{height:8px;border-radius:4px;background:linear-gradient(90deg,#dc2626,#d1d5db 50%,#16a34a)}',
    '.hmr-rate input[type=range]::-moz-range-track{height:8px;border-radius:4px;background:linear-gradient(90deg,#dc2626,#d1d5db 50%,#16a34a)}',
    '.hmr-rate input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;margin-top:-8px;border-radius:50%;background:#fff;border:3px solid #111;box-shadow:0 1px 4px rgba(0,0,0,.4)}',
    '.hmr-rate input[type=range]::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid #111}',
    '.hmr-rate input[type=range]:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}',
    '.hmr-rate .rl{display:flex;justify-content:space-between;font-size:11.5px;font-weight:700;color:#333;line-height:1.2}.hmr-rate .rv{display:block;text-align:center;font-weight:800;font-size:13px;min-height:1.3em;margin-top:2px;color:#111}',
    // submit pair (Submit with my email / Submit anonymously)
    '.hmr-sub{display:block;margin:8px 0 0}.hmr-sub *{box-sizing:border-box;font-family:inherit}.hmr-sub .hs-emr[hidden]{display:none}',
    '.hmr-sub label{display:block;font-weight:700;margin:6px 0 3px;color:#111;font-size:13px;text-transform:none;letter-spacing:0}',
    '.hmr-sub input[type=email]{display:block;width:100%;border:2px solid #9aa4b5;border-radius:10px;padding:8px 10px;font-size:15px;line-height:1.35;color:#111;background:#fff;margin:0}',
    '.hmr-sub .hs-two{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 0}',
    '.hmr-sub .hs-btn{display:block;width:100%;min-height:46px;margin:0;border:2px solid #fff;border-radius:12px;color:#fff;font-size:14px;font-weight:800;cursor:pointer;padding:6px 8px;line-height:1.15;box-shadow:0 3px 10px rgba(0,0,0,.25);text-transform:none;letter-spacing:0;transform:none}',
    '.hmr-sub .hs-btn.m{background:linear-gradient(135deg,#3b82f6,#8b5cf6)}.hmr-sub .hs-btn.a{background:linear-gradient(135deg,#10b981,#0ea5e9)}.hmr-sub .hs-btn[disabled]{opacity:.6;cursor:wait}',
    '.hmr-sub .hs-st{min-height:1.4em;font-size:12.5px;color:#333;margin:6px 0 0;line-height:1.35}.hmr-sub .hs-btn:focus-visible,.hmr-sub input:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}',
    '@media (max-width:420px){.hmr-sub .hs-two{grid-template-columns:1fr}}',
    // sheet
    '.hmr-fbp{position:fixed;left:50%;bottom:calc(' + BASE + ' + 64px);transform:translateX(-50%);z-index:99993;width:min(480px,calc(100vw - 24px));max-height:min(86vh,calc(100vh - 110px));overflow:auto;overscroll-behavior:contain;background:#fff;color:#111;border:2px solid #111;border-radius:16px;padding:12px;box-shadow:0 14px 44px rgba(0,0,0,.45);font:500 13px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;text-align:left;text-transform:none;letter-spacing:0}',
    '.hmr-fbp[hidden],.hmr-hlm[hidden]{display:none}.hmr-fbp *{box-sizing:border-box;font-family:inherit}',
    '.hmr-fbp .hd{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:800;font-size:18px;margin:0 0 4px}',
    '.hmr-fbp .x{min-width:34px;min-height:34px;border:1px solid #bbb;background:#f6f6f6;color:#111;border-radius:8px;font-size:20px;line-height:1;cursor:pointer;padding:0 8px}',
    '.hmr-fbp p{margin:0 0 8px}.hmr-fbp .sub{color:#333}.hmr-fbp .ctx{font-size:12px;background:#fff1e6;border:1px solid #f4c29b;border-radius:8px;padding:6px 8px}',
    '.hmr-fbp blockquote{margin:0 0 8px;padding:6px 10px;border-left:4px solid #f59e0b;background:#fff8dc;border-radius:0 8px 8px 0;font-style:italic;max-height:90px;overflow:auto}',
    '.hmr-fbp label{display:block;font-weight:700;margin:8px 0 3px}',
    '.hmr-fbp textarea,.hmr-fbp input[type=email]{width:100%;border:2px solid #9aa4b5;border-radius:10px;padding:8px 10px;font-size:15px;line-height:1.35;color:#111;background:#fff}',
    '.hmr-fbp textarea{min-height:130px;resize:vertical}',
    '.hmr-mic,.hmr-dx .hmr-mic{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:52px;border:2px solid #fff;border-radius:999px;background:linear-gradient(135deg,#e0307a,#f59e0b);color:#fff;font-size:16px;font-weight:800;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.25)}',
    '.hmr-mic .e{font-size:22px;line-height:1}.hmr-mic[disabled]{opacity:.5;cursor:not-allowed;filter:grayscale(.6)}',
    '.hmr-mic.rec{background:linear-gradient(135deg,#dc2626,#7f1d1d)}.hmr-mic.rec .e{animation:hmrpulse 1.1s ease-in-out infinite}',
    '@media (prefers-reduced-motion:reduce){.hmr-mic.rec .e{animation:none}}',
    '.hmr-fbp .st,.hmr-dx .st{min-height:1.4em;font-size:12.5px;color:#333;margin:4px 0}',
    '.hmr-fbp .two{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}',
    '.hmr-fbp .go,.hmr-dx .go{min-height:46px;border:2px solid #fff;border-radius:12px;color:#fff;font-size:14px;font-weight:800;cursor:pointer;padding:6px 8px;line-height:1.15;box-shadow:0 3px 10px rgba(0,0,0,.25)}',
    '.hmr-fbp .go.m{background:linear-gradient(135deg,#3b82f6,#8b5cf6)}.hmr-fbp .go.a{background:linear-gradient(135deg,#10b981,#0ea5e9)}',
    '@media (max-width:600px){.hmr-fbp{left:' + LEFT + ';right:' + RIGHT + ';transform:none;width:auto}.hmr-fbp .two{grid-template-columns:1fr}}',
    // speak popup
    '.hmr-spk{position:fixed;left:50%;bottom:calc(' + BASE + ' + 64px);transform:translateX(-50%);z-index:99993;width:min(430px,calc(100vw - 24px));max-height:min(88vh,calc(100vh - 110px));overflow:auto;overscroll-behavior:contain;background:#fff;color:#111;border:2px solid #111;border-radius:16px;padding:12px;box-shadow:0 14px 44px rgba(0,0,0,.45);font:500 13px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;text-align:left;text-transform:none;letter-spacing:0}',
    '.hmr-spk[hidden]{display:none}.hmr-spk *{box-sizing:border-box;font-family:inherit}',
    '.hmr-spk .hd{display:flex;align-items:center;justify-content:space-between;gap:6px;font-weight:800;font-size:clamp(10px,3.4vw,16px);line-height:1.2;margin:0 0 4px;white-space:nowrap}.hmr-spk .hd .hs-ttl{flex:1 1 auto;min-width:0;white-space:nowrap}',
    '.hmr-spk .x{flex:none;min-width:34px;min-height:34px;border:1px solid #bbb;background:#f6f6f6;color:#111;border-radius:8px;font-size:20px;line-height:1;cursor:pointer;padding:0 8px}',
    '.hmr-spk p{margin:0 0 6px}.hmr-spk .hs-sub{color:#222;font-weight:700;text-align:center}.hmr-spk .hs-why{font-size:12px;line-height:1.35;color:#333}.hmr-spk .hs-note{font-size:11.5px;color:#555;text-align:center;margin:0 0 2px}.hmr-spk .hs-free{font-size:11.5px;color:#14532d;text-align:center;margin:8px 0 0;font-weight:600}',
    '.hmr-spk .hmr-mic{width:84px;height:84px;min-height:0;margin:4px auto 4px;border-radius:50%;flex-direction:column;gap:2px;padding:0;background:linear-gradient(135deg,#ec4899,#f59e0b 55%,#22c55e)}',
    '.hmr-spk .hmr-mic svg{width:40px;height:40px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.hmr-spk .hmr-mic.rec{background:linear-gradient(135deg,#dc2626,#7f1d1d)}.hmr-spk .hmr-mic.rec svg{animation:hmrpulse 1.1s ease-in-out infinite}',
    '.hmr-spk .st{min-height:1.4em;font-size:13px;font-weight:600;color:#222;margin:2px 0 4px;text-align:center}',
    '.hmr-spk label{display:block;font-weight:700;margin:6px 0 3px}',
    '.hmr-spk textarea{width:100%;border:2px solid #9aa4b5;border-radius:10px;padding:8px 10px;font-size:15px;line-height:1.35;color:#111;background:#fff}',
    '.hmr-spk textarea{min-height:96px;resize:vertical}',
    '.hmr-spk button:focus-visible,.hmr-spk textarea:focus-visible,.hmr-spk input:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}',
    '@media (max-width:600px){.hmr-spk{left:' + LEFT + ';right:' + RIGHT + ';transform:none;width:auto}}',
    // highlight menu + marks
    'mark.hmr-hl{background:#ffe066;color:#111;border-radius:2px;padding:0;box-shadow:0 0 0 1px rgba(245,158,11,.5)}',
    '.hmr-hlm{position:fixed;z-index:99994;display:flex;flex-direction:column;gap:5px;width:max-content;max-width:calc(100vw - 16px);background:#111;border:2px solid #fff;border-radius:12px;padding:6px;box-shadow:0 8px 26px rgba(0,0,0,.45);font:700 13px/1.1 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#fff;text-align:left;text-transform:none;letter-spacing:0}',
    '.hmr-hlm *{box-sizing:border-box;font-family:inherit}.hmr-hlm .hh-cap{display:flex;align-items:flex-start;gap:8px;max-width:318px;font-size:11.5px;font-weight:600;line-height:1.3;color:#e5e7eb}.hmr-hlm .hh-cap .hh-tip{flex:1 1 auto}',
    '.hmr-hlm .hh-x{flex:none;width:26px;height:26px;min-height:0;border:1px solid #fff;border-radius:50%;background:#333;color:#fff;font-size:18px;line-height:1;padding:0;cursor:pointer;display:flex;align-items:center;justify-content:center}.hmr-hlm .hh-x:hover{background:#b91c1c}',
    '.hmr-hlm .hh-row{display:flex;flex-wrap:wrap;gap:4px}',
    '.hmr-hlm:after{content:"";position:absolute;left:var(--cx,50%);bottom:-9px;width:14px;height:14px;margin-left:-7px;background:#111;border-right:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(45deg)}',
    '.hmr-hlm.below:after{bottom:auto;top:-9px;transform:rotate(225deg)}',
    '.hmr-hlm .hh-b{flex:1 1 68px;min-height:46px;border:0;border-radius:8px;padding:4px 8px;color:#fff;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;line-height:1.1;text-align:center}.hmr-hlm .hh-b b{display:block;font-size:13px;font-weight:800}.hmr-hlm .hh-b i{display:block;font-style:normal;font-size:11px;font-weight:600;opacity:.92}',
    '.hmr-hlm .hh-b:nth-child(1){background:#b45309}.hmr-hlm .hh-b:nth-child(2){background:#1d4ed8}.hmr-hlm .hh-b:nth-child(3){background:#0f766e}.hmr-hlm .hh-b:nth-child(4){background:#a21caf}',
    '.hmr-toast{position:fixed;left:50%;bottom:calc(' + BASE + ' + 130px);transform:translateX(-50%);z-index:99995;max-width:calc(100vw - 24px);background:#111;color:#fff;border:2px solid #fff;border-radius:999px;padding:8px 16px;font:700 13px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;pointer-events:none;visibility:hidden;opacity:0;transition:opacity .2s;width:max-content}',
    '.hmr-toast.on{visibility:visible;opacity:1}',
    // design v2 section
    '.hmr-dx{margin:10px 0 0;padding:10px;background:#fff;color:#111;border:2px solid #111;border-radius:12px;font:500 13px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;text-align:left;text-transform:none;letter-spacing:0;filter:none}',
    '.hmr-dx *{box-sizing:border-box;font-family:inherit;color:inherit}',
    '.hmr-dx h4{margin:0 0 6px;font-size:14px;font-weight:800}.hmr-dx h5{margin:10px 0 4px;font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#555}',
    '.hmr-dx .chips{display:flex;flex-wrap:wrap;gap:5px}',
    '.hmr-dx .chip{min-height:34px;border:1px solid #cfd6e4;background:#f4f7fc;color:#111;border-radius:999px;padding:0 10px;font-size:12.5px;font-weight:600;cursor:pointer}',
    '.hmr-dx .chip[aria-pressed="true"]{background:#1d4ed8;color:#fff;border-color:#1d4ed8}.hmr-dx .chip[aria-pressed="true"] *{color:#fff}',
    '.hmr-dx .stars button{min-width:36px;min-height:36px;border:0;background:none;font-size:24px;line-height:1;cursor:pointer;color:#c4a000;padding:0}',
    '.hmr-dx textarea{width:100%;min-height:80px;border:2px solid #9aa4b5;border-radius:10px;padding:8px;font-size:14px;color:#111;background:#fff;resize:vertical}',
    '.hmr-tw{position:relative;display:block}.hmr-tw textarea{display:block;padding-bottom:44px!important}.hmr-tmic{position:absolute;right:22px;bottom:7px;width:32px;height:32px;min-width:0;min-height:0;padding:0;margin:0;border-radius:50%;border:2px solid #fff;background:conic-gradient(from 210deg,#e0307a,#f59e0b,#22c55e,#06b6d4,#8b5cf6,#e0307a);color:#fff!important;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)}.hmr-tmic[hidden]{display:none}.hmr-tmic svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;display:block}.hmr-tmic.rec{background:linear-gradient(135deg,#dc2626,#7f1d1d)}.hmr-tmic:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}',
    '.hmr-dx .go{width:100%;margin-top:8px;background:linear-gradient(135deg,#3b82f6,#8b5cf6)}',
    '.hmr-dx select{width:100%;min-height:38px;border:2px solid #9aa4b5;border-radius:8px;padding:0 8px;font-size:14px;background:#fff;color:#111}',
    '.hmr-dx .tnav{display:grid;grid-template-columns:auto 1fr auto;gap:6px;align-items:center;margin:8px 0 4px}.hmr-dx .tl{margin:0;text-align:center;font-weight:700;font-size:13px;line-height:1.25}',
    '.hmr-dx .trow{display:flex;flex-wrap:wrap;gap:5px;margin:4px 0}.hmr-dx .chip[disabled]{opacity:.45;cursor:default}',
    '.hmr-dx .chip.up[aria-pressed="true"]{background:#15803d;border-color:#15803d;color:#fff}.hmr-dx .chip.dn[aria-pressed="true"]{background:#b91c1c;border-color:#b91c1c;color:#fff}.hmr-dx .chip.tb-orig[aria-pressed="true"]{background:#1d4ed8;border-color:#1d4ed8;color:#fff}',
    '.hmr-dx .tnav .chip{border-radius:10px;font-weight:700}',
    '.hmr-dsp{background:#fff;color:#111;border:2px solid #111;border-radius:14px;padding:10px;width:min(360px,calc(100vw - 24px));box-shadow:0 12px 36px rgba(0,0,0,.4);font:500 13px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;text-align:left;text-transform:none;letter-spacing:0;overscroll-behavior:contain}',
    '.hmr-dsp[hidden]{display:none!important}.hmr-dsp *{box-sizing:border-box;font-family:inherit}.hmr-dsp .hd{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:800;font-size:17px;margin:0 0 2px}',
    '.hmr-dsp .x{min-width:34px;min-height:34px;border:1px solid #bbb;background:#f6f6f6;color:#111;border-radius:8px;font-size:20px;line-height:1;cursor:pointer;padding:0 8px}.hmr-dsp .hmr-dx{margin-top:4px;border-width:1px}',
    '.hmr-tier{display:block;text-align:center;margin:30px 12px 14px;font:600 13px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;letter-spacing:0;text-transform:none}',
    '.hmr-tier a.hmr-tl{display:inline-flex;align-items:center;gap:8px;padding:7px 16px 7px 10px;border-radius:999px;border:1px solid rgba(176,125,10,.6);background:linear-gradient(180deg,#fffbe8,#ffeeb0)!important;color:#2b1d00!important;text-decoration:none!important;box-shadow:0 1px 0 rgba(255,255,255,.9) inset,0 2px 8px rgba(120,80,0,.22);font-weight:700}',
    '.hmr-tier a.hmr-tl .st{font-size:16px;line-height:1}',
    '.hmr-tier a.hmr-tl:hover{filter:brightness(1.04);box-shadow:0 1px 0 rgba(255,255,255,.9) inset,0 3px 12px rgba(160,110,0,.35)}.hmr-tier a.hmr-tl:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}',
    '.hmr-tier .hmr-free{margin:8px 0 0;font-size:12px;font-weight:600;line-height:1.35;opacity:.85}',
    '.hmr-tier.ex a.hmr-tl{padding:4px 12px;font-size:11.5px;font-weight:600;border:1px solid #9aa0a8;background:#f1f3f5!important;color:#33383d!important;box-shadow:none}',
    // pointer styles, letter animations, genres
    '.hmr-sp{position:fixed;z-index:99979;pointer-events:none;font-size:16px;line-height:1;animation:hmrsp .7s ease-out forwards}',
    '@keyframes hmrsp{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx,0),22px) scale(.4) rotate(40deg)}}',
    '.hmr-ch{display:inline-block;white-space:pre}',
    '.hmr-ch-lift{animation:hmrlift .6s ease-out}@keyframes hmrlift{0%,100%{transform:translateY(0)}40%{transform:translateY(-.35em) scale(1.25)}}',
    '.hmr-ch-glow{animation:hmrglow .7s ease-out}@keyframes hmrglow{0%,100%{text-shadow:none}40%{text-shadow:0 0 .35em #fff,0 0 .7em #f59e0b,0 0 1.2em #e0307a}}',
    '.hmr-ch-wobble{animation:hmrwob .6s ease-in-out}@keyframes hmrwob{0%,100%{transform:rotate(0)}20%{transform:rotate(-18deg)}50%{transform:rotate(14deg)}80%{transform:rotate(-6deg)}}',
    '@media (prefers-reduced-motion:reduce){.hmr-ch,.hmr-sp{animation:none!important}}'
  ].join('');

  // ---- dock buttons
  function mkPill(cls, id, aria, html) { var b = el('button', cls); b.type = 'button'; b.id = id; b.setAttribute('aria-label', aria); b.innerHTML = html; return b; }
  var ARR = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>'; };
  var backBtn = mkPill('hmr-nv back', 'hmr-back', 'Go back', ARR('M15 5l-7 7 7 7'));
  var fwdBtn = mkPill('hmr-nv fwd', 'hmr-fwd', 'Go forward', ARR('M9 5l7 7-7 7'));
  var spBtn = mkPill('hmr-spbtn', 'hmr-speak', 'Do us a big favor, tell us what you think', '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/></svg>');
  spBtn.title = 'Do us a big favor, tell us what you think'; spBtn.setAttribute('aria-haspopup', 'dialog'); spBtn.setAttribute('aria-expanded', 'false'); spBtn.setAttribute('aria-controls', 'hmr-spk');
  // The Feedback and "I'm lost" pill buttons are no longer in the dock. fbBtn / lostBtn stay as detached stand-ins so the sheet code (and HMRDock.openFeedback / openLost) keeps working.
  var FWDTIP = 'Forward. Our bar has a forward button even on your first visit, because on many sites the next best step is forward.';
  fwdBtn.title = FWDTIP; fwdBtn.setAttribute('aria-description', FWDTIP);
  (function () { var t = el('span', 'ntip', FWDTIP); t.setAttribute('aria-hidden', 'true'); fwdBtn.appendChild(t); })();
  var fbBtn = mkPill('hmr-fbbtn', 'hmr-feedback', 'Feedback', ''), lostBtn = mkPill('hmr-lostbtn', 'hmr-lost', 'I\'m lost', '');
  backBtn.title = 'Back';
  // v6.5: the HMR button opens the HMR family experience dashboard (hmr-dash.js, same folder as this file, loaded on first press)
  var hmrBtn = mkPill('hmr-hmrbtn', 'hmr-hmr', 'ELV8: open your elevating family experience dashboard', '<span class="hmr-hmrt">ELV8</span>');
  hmrBtn.title = 'ELV8: your dashboard'; hmrBtn.setAttribute('aria-haspopup', 'dialog'); hmrBtn.setAttribute('aria-expanded', 'false'); hmrBtn.setAttribute('aria-controls', 'hmr-dash');
  var DASHSRC = (function () { try { var u = new URL((script && script.src) || '', location.href); u.pathname = u.pathname.replace(/[^\/]*$/, 'hmr-dash.js'); u.search = '?v=6.9.0'; u.hash = ''; return u.toString(); } catch (e) { return ''; } })();
  var dashState = 0, dashWait = [];   // 0 not loaded, 1 loading, 2 ready, 3 failed
  function loadDash(cb) {
    if (window.HMRDash) { dashState = 2; if (cb) cb(); return; }
    if (cb) dashWait.push(cb); if (dashState === 1) return;
    if (!DASHSRC) { dashState = 3; dashWait = []; return; }
    dashState = 1; hmrBtn.classList.add('ld');
    var sc = el('script'); sc.src = DASHSRC; sc.async = true;
    sc.onload = function () { hmrBtn.classList.remove('ld'); dashState = window.HMRDash ? 2 : 3; var w = dashWait.splice(0); if (dashState === 2) w.forEach(function (f) { try { f(); } catch (e) { } }); else toast('The dashboard did not load. Check your connection and try again.', null, 5000); };
    sc.onerror = function () { hmrBtn.classList.remove('ld'); dashState = 0; dashWait = []; toast('The dashboard did not load. Check your connection and try again.', null, 5000); };
    (doc.head || doc.body).appendChild(sc);
  }
  hmrBtn.addEventListener('click', function () { loadDash(function () { window.HMRDash.toggle(); }); });
  hmrBtn.addEventListener('pointerenter', function () { loadDash(); }, { once: true });
  // a Log in button in a site's own top bar (data-hmr-login) opens the dashboard's Log in view
  doc.addEventListener('click', function (e) { var t = e.target && e.target.closest ? e.target.closest('[data-hmr-login]') : null; if (!t) return; e.preventDefault(); loadDash(function () { window.HMRDash.open('login'); }); });
  // claudebomb.com/#login (linked from the other HMR sites' Log in buttons) opens the same Log in view
  // an account email link (confirm, new password) lands with tokens in the address: open Log in so it finishes there
  if (location.hash === '#login' || /(^#|&)(access_token|error_code)=/.test(location.hash)) loadDash(function () { window.HMRDash.open('login'); });
  try { if (localStorage.getItem('hmr-studio-v1') || /[?&]hmrlook=/.test(location.search)) { if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', function () { loadDash(); }); else loadDash(); } } catch (e) { }
  dock.textContent = '';
  [backBtn, fzBtn, hmrBtn, spBtn, rxBtn, fwdBtn, again].forEach(function (b) { dock.appendChild(b); });
  function navState() { var off = (history.length < 2); backBtn.classList.toggle('off', off); backBtn.setAttribute('aria-disabled', off ? 'true' : 'false'); fwdBtn.classList.remove('off'); fwdBtn.setAttribute('aria-disabled', 'false'); }   // forward is never greyed out: the browser will not say whether a page is ahead
  // v6.2: a page opened in a new tab keeps its entry referrer for the tab's life, so Back can return there when browser history cannot go back
  var ENTRY_REF = '';
  try { ENTRY_REF = sessionStorage.getItem('hmr-entry-ref') || ''; if (!ENTRY_REF && !sessionStorage.getItem('hmr-entry-seen')) { sessionStorage.setItem('hmr-entry-seen', '1'); var rf = doc.referrer || ''; if (rf && rf.split('/')[2] !== location.host) { ENTRY_REF = rf; sessionStorage.setItem('hmr-entry-ref', rf); } } } catch (e) { }
  function refTarget() { var r = ENTRY_REF || ''; if (!r) { try { r = doc.referrer || ''; } catch (e) { } } return /^https?:\/\//i.test(r) && r !== location.href ? r : ''; }
  // v6.9: forward is grey when nothing is ahead. The Navigation API says so where the browser has it; elsewhere this tab remembers whether it went back.
  var FWDKEY = 'hmr-fwd-ahead';
  try { var nt = (performance.getEntriesByType && performance.getEntriesByType('navigation')[0] || {}).type; if (nt === 'navigate') sessionStorage.setItem(FWDKEY, '0'); else if (nt === 'back_forward') sessionStorage.setItem(FWDKEY, '1'); } catch (e) { }
  function fwdAhead() { try { if (window.navigation && typeof navigation.canGoForward === 'boolean') return navigation.canGoForward; } catch (e) { } try { return sessionStorage.getItem(FWDKEY) === '1'; } catch (e) { return false; } }
  function navState() { var off = (history.length < 2 && !refTarget()); backBtn.classList.toggle('off', off); backBtn.setAttribute('aria-disabled', off ? 'true' : 'false'); var fo = !fwdAhead(); fwdBtn.classList.toggle('off', fo); fwdBtn.setAttribute('aria-disabled', fo ? 'true' : 'false'); }
  try { if (window.navigation && navigation.addEventListener) navigation.addEventListener('currententrychange', function () { setTimeout(navState, 0); }); } catch (e) { }   // forward is never greyed out: the browser will not say whether a page is ahead
  backBtn.addEventListener('click', function () {
    try { sessionStorage.setItem(FWDKEY, '1'); } catch (e) { }
    if (history.length >= 2) { try { history.back(); } catch (e) { } return; }
    var r = refTarget(); if (r) { try { location.href = r; } catch (e) { } }
  });
  // forward: one message only. The hover tooltip and title are hidden once the button is pressed, so only the toast shows; a guard also drops a second toast within 1.5s
  var fwdBusy = 0;
  function fwdQuiet(on) { fwdBtn.classList.toggle('hmr-nt0', on); if (on) { fwdBtn.removeAttribute('title'); } else { fwdBtn.title = FWDTIP; } }
  fwdBtn.addEventListener('mouseleave', function () { fwdQuiet(false); }); fwdBtn.addEventListener('blur', function () { fwdQuiet(false); });
  fwdBtn.addEventListener('click', function () {
    fwdQuiet(true);
    var h0 = location.href; try { history.forward(); } catch (e) { }
    setTimeout(function () {
      if (location.href === h0 && !doc.hidden && Date.now() - fwdBusy > 1500) { fwdBusy = Date.now(); toast('Nothing is ahead yet. Our bar always has a forward button, even on a first visit, because on many sites the next best step is forward.', null, 6000); }
    }, 500);
  });
  navState(); window.addEventListener('popstate', navState);
  // self-repair: coming back to a page (back / forward, bfcache) or a page script that rebuilds the body must never leave a half dock
  function ensureDock() {
    try {
      if (!doc.body) return;
      if (dock.parentNode !== doc.body) { dock.id = 'hmr-dock'; doc.body.appendChild(dock); }
      [backBtn, fzBtn, hmrBtn, spBtn, rxBtn, fwdBtn, again].forEach(function (b) { if (b.parentNode !== dock && !(b.parentNode && b.parentNode.parentNode === dock)) dock.appendChild(b); });
      if (!styleEl.parentNode) doc.head.appendChild(styleEl);
      navState();
    } catch (e) { }
  }
  window.addEventListener('pageshow', function (e) { ensureDock(); if (e.persisted) { try { stopFunsies(true); stopSoft(); startHighlights(); ensureDx(); } catch (e2) { } } });
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) ensureDock(); });
  window.addEventListener('focus', ensureDock);
  setInterval(ensureDock, 3000);

  // ---- speech to text: a transcript you can edit, never cleared by an error
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function makeMic(ta, btn, stat, onChange, idleText) {
    var rec = null, want = false, interim = '', fails = 0, api = {};
    var ICO = function (on_) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (on_ ? '<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/>' : '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>') + '</svg>'; };
    function label(on) { btn.classList.toggle('rec', on); btn.setAttribute('aria-pressed', on ? 'true' : 'false'); btn.innerHTML = ICO(on); var t = on ? 'Stop talking' : 'Talk instead of typing'; btn.setAttribute('aria-label', t); btn.title = t; }
    function say(t) { if (stat) stat.textContent = t; }
    function sep() { return ta.value && !/\s$/.test(ta.value) ? ' ' : ''; }
    function strip() { if (interim && ta.value.slice(-interim.length) === interim) ta.value = ta.value.slice(0, -interim.length); interim = ''; }
    function changed() { if (onChange) onChange(); }
    if (!SR) { btn.hidden = true; api.stop = function () { }; return api; }
    function begin() {
      try {
        rec = new SR(); rec.continuous = true; rec.interimResults = true; rec.lang = navigator.language || 'en-US';
        rec.onresult = function (ev) {
          fails = 0; strip(); var fin = '', itm = '';
          for (var i = ev.resultIndex; i < ev.results.length; i++) { var r = ev.results[i]; if (r.isFinal) fin += r[0].transcript; else itm += r[0].transcript; }
          if (fin.trim()) { ta.value += sep() + fin.trim(); }
          if (itm.trim()) { interim = sep() + itm.trim(); ta.value += interim; }
          changed(); try { ta.scrollTop = ta.scrollHeight; } catch (e) { }
        };
        rec.onerror = function (ev) {
          var er = ev && ev.error;
          if (er === 'not-allowed' || er === 'service-not-allowed') { want = false; say('The microphone is blocked. Allow it in your browser, or just type. Your words are saved.'); }
          else if (er === 'audio-capture') { want = false; say('No microphone found. You can type instead. Your words are saved.'); }
          else if (er === 'network') { fails++; if (fails >= 3) { want = false; say('Voice typing lost its connection. Your words are saved. Tap the microphone to try again.'); } }
        };
        rec.onend = function () {
          interim = ''; changed();   // whatever was heard stays as text
          if (want) setTimeout(function () { if (want) begin(); }, 250); else { label(false); if (!/blocked|found|connection/.test(stat ? stat.textContent : '')) say(ta.value ? 'Stopped. Your words are saved.' : (idleText || '')); }
        };
        rec.start(); label(true); say('Listening.');
      } catch (e) { want = false; label(false); say('Voice typing could not start. You can type instead.'); }
    }
    api.stop = function () { want = false; try { if (rec) rec.stop(); } catch (e) { } label(false); };
    api.on = function () { return want; };
    btn.addEventListener('click', function () { if (want) { api.stop(); } else { want = true; fails = 0; begin(); } });
    ta.addEventListener('input', function () { interim = ''; });
    window.addEventListener('pagehide', function () { api.stop(); });
    label(false);
    return api;
  }

  // a small round mic icon inside the bottom-right corner of a textarea; makeMic() wires it to speech-to-text
  function wrapMic(ta) {
    var w = el('div', 'hmr-tw'); ta.parentNode.insertBefore(w, ta); w.appendChild(ta);
    var b = el('button', 'hmr-tmic'); b.type = 'button'; b.setAttribute('aria-label', 'Talk instead of typing'); b.title = 'Talk instead of typing'; if (!SR) b.hidden = true; w.appendChild(b); return b;
  }
  // ---- feedback / I'm lost sheet
  var fb = null, fbMode = 'feedback', fbCtx = null, fbQuote = '';
  function lostCtx() {
    var H = Math.max(root.scrollHeight, innerHeight), pct = Math.round((scrollY + innerHeight / 2) / H * 100), e = null;
    try { e = doc.elementFromPoint(innerWidth / 2, innerHeight / 2); if (e && insideDock(e)) e = null; } catch (x) { }
    var head = '', sel = '';
    try { if (e) { head = nearestHeading(e); sel = selPath(e); } } catch (x) { }
    if (!head) { var h1 = doc.querySelector('h1'); head = h1 ? (h1.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80) : ''; }
    return { pct: clamp(pct, 0, 100), heading: head, selector: sel, scrollY: Math.round(scrollY) };
  }
  function ctxLine(c) { return c ? 'Where I am: ' + c.pct + '% down the page' + (c.heading ? ', near "' + c.heading + '"' : '') + (c.selector ? ' (' + c.selector + ')' : '') : ''; }
  function draftKey(m) { return 'hmr-draft-v1:' + m; }
  function sheetKey(e) {
    if (e.key === 'Tab' && fb && !fb.el.hidden) {
      var f = [].filter.call(fb.el.querySelectorAll('button,textarea,input,a[href]'), function (b) { return !b.disabled && b.offsetParent !== null; }); if (!f.length) return;
      var i = f.indexOf(doc.activeElement);
      if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { f[0].focus(); e.preventDefault(); }
    }
  }
  function saveDraft() { if (!fb) return; jset(draftKey(fbMode), { t: fb.ta.value, q: fbQuote }); }
  function buildSheet() {
    fb = {}; var s = el('div', 'hmr-fbp'); s.id = 'hmr-fbp'; s.hidden = true; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); fb.el = s;
    var hd = el('div', 'hd'); fb.title = el('span'); var x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.addEventListener('click', function () { closeSheet(true); }); hd.appendChild(fb.title); hd.appendChild(x); s.appendChild(hd);
    fb.sub = el('p', 'sub'); s.appendChild(fb.sub);
    fb.ctx = el('p', 'ctx'); s.appendChild(fb.ctx);
    fb.q = el('blockquote'); s.appendChild(fb.q);
    fb.mst = el('p', 'st'); fb.mst.setAttribute('role', 'status'); fb.mst.setAttribute('aria-live', 'polite'); s.appendChild(fb.mst);
    var l1 = el('label', '', 'Your words (you can edit them any time)'); l1.setAttribute('for', 'hmr-fb-text'); s.appendChild(l1);
    fb.ta = el('textarea'); fb.ta.id = 'hmr-fb-text'; fb.ta.rows = 6; fb.ta.setAttribute('autocomplete', 'off'); s.appendChild(fb.ta); fb.mic = wrapMic(fb.ta);
    fb.micApi = makeMic(fb.ta, fb.mic, fb.mst, saveDraft);
    fb.ta.addEventListener('input', saveDraft);
    s.addEventListener('keydown', sheetKey);
    function compose() {
      var txt = fb.ta.value.trim(), parts = [];
      if (fbQuote) parts.push('About this passage: "' + fbQuote + '"');
      if (txt) parts.push(txt);
      if (fbMode === 'lost' && fbCtx) parts.push(ctxLine(fbCtx));
      return { txt: txt, message: parts.join('\n\n'), kind: fbMode === 'lost' ? 'lost' : (fbQuote ? 'highlight' : 'feedback') };
    }
    fb.sub = submitPair({
      text: function () { saveDraft(); var c = compose(); if (!c.txt) { try { fb.ta.focus(); } catch (e) { } return ''; } return c.message; },
      kind: function () { return compose().kind; }, details: function () { return fbCtx || undefined; },
      onSent: function () { var hq = !!fbQuote; fb.ta.value = ''; fbQuote = ''; fb.q.hidden = true; ldel(draftKey(fbMode)); fb.micApi.stop(); if (hq) { try { clearHighlightsAfterSend(); } catch (e) { } } setTimeout(function () { if (fb && !fb.el.hidden) closeSheet(false); }, 1500); }
    });
    fb.st = fb.sub.st; s.appendChild(fb.sub.el);
    s.appendChild(el('p', 'sub', 'Anonymous means we do not get your email or name. Your words save on this device until they are sent.'));
    doc.body.appendChild(s);
  }
  function openSheet(mode, o) {
    o = o || {}; closeOthers('sheet');
    if (!fb) buildSheet();
    if (fb.micApi) fb.micApi.stop();
    fbMode = mode; fbCtx = mode === 'lost' ? lostCtx() : null;
    var d = jget(draftKey(mode), {});
    fb.ta.value = d.t || (o.prefill ? String(o.prefill) : ''); fbQuote = o.quote || (mode === 'feedback' ? (d.q || '') : '');
    fb.title.textContent = mode === 'lost' ? '🧭 I\'m lost' : '💛 Do us a big favor';
    fb.sub.textContent = mode === 'lost' ? 'Tell us where you got stuck and what you were hoping to find. We noted where you are on this page.' : 'Tell us what you think, what confused you, or what you wish was here. Talk or type. It saves as you go.';
    fb.ctx.hidden = mode !== 'lost'; fb.ctx.textContent = fbCtx ? ctxLine(fbCtx) : '';
    fb.q.hidden = !fbQuote; fb.q.textContent = fbQuote ? '“' + fbQuote + '”' : '';
    fb.st.textContent = d.t ? 'Your unsent words from last time are here.' : ''; fb.mst.textContent = SR ? '' : fb.mst.textContent;
    fb.el.hidden = false; (mode === 'lost' ? lostBtn : fbBtn).setAttribute('aria-expanded', 'true');
    var f = fb.ta; try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); }
  }
  function closeSheet(back) {
    if (!fb || fb.el.hidden) return; if (fb.micApi) fb.micApi.stop(); saveDraft(); fb.el.hidden = true;
    fbBtn.setAttribute('aria-expanded', 'false'); lostBtn.setAttribute('aria-expanded', 'false');
    if (back) { var b = fbMode === 'lost' ? lostBtn : fbBtn; try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); } }
  }
  fbBtn.addEventListener('click', function () { if (fb && !fb.el.hidden && fbMode === 'feedback') closeSheet(true); else openSheet('feedback'); });
  lostBtn.addEventListener('click', function () { if (fb && !fb.el.hidden && fbMode === 'lost') closeSheet(true); else openSheet('lost'); });
  function closeOthers(keep) {
    if (keep !== 'dash') { try { if (window.HMRDash) window.HMRDash.closeQuiet(); } catch (e) { } }
    if (keep !== 'ds') { try { closeOwn(false); } catch (e) { } }
    if (keep !== 'sheet') closeSheet(false);
    if (keep !== 'sp') closeSpeak(false, false);
    if (keep !== 'hl') hideHlm();
    if (keep !== 'fz') { try { closeFz(false); } catch (e) { } }
    if (keep !== 'rx') { try { if (panel && !panel.hidden) closeRx(false); } catch (e) { } }
  }

  // ---- Speak here (v6.1): a SMALL floating recorder, not a sheet. The tap that opens it also starts recording (a user gesture, which phones require).
  //      The page behind stays visible and scrollable (no backdrop, no scroll lock). Card: red dot + timer, live text, Stop/Resume, Submit (email or anonymous), X.
  //      Recognition restarts by itself when the phone ends a session. No speech recognition: a text box and a plain line. Blocked mic: step-by-step help for this device.
  var sp = null, SPKEY = 'hmr-draft-v1:speak';
  var SPNOSR = 'Your browser cannot turn speech into text here. Type instead, or use your keyboard\'s mic button.';
  function saveSpeak() { if (sp) jset(SPKEY, { t: sp.ta.value }); }
  var MICSVG = function (on_) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (on_ ? '<rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/>' : '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>') + '</svg>'; };
  var TOUCH = (function () { try { return (navigator.maxTouchPoints || 0) > 0 || (window.matchMedia && matchMedia('(pointer:coarse)').matches); } catch (e) { return false; } })();
  var SPWHY = 'hmr-spk-why-off', SPRESUME = 'hmr-spk-resume';
  function spRec() { return !!(sp && sp.want); }
  function spSay(t) { if (sp) sp.mst.textContent = t || ''; }
  function fmtT(ms) { var s = Math.floor(ms / 1000), m = Math.floor(s / 60); s = s % 60; return m + ':' + (s < 10 ? '0' : '') + s; }
  function spText() { var c = sp.committed || '', t = sp.sess || ''; return c + (c && t && !/\s$/.test(c) ? ' ' : '') + t; }
  function spPaint() { sp.ta.value = spText(); try { sp.ta.scrollTop = sp.ta.scrollHeight; } catch (e) { } saveSpeak(); }
  function spShow() {
    var on = !!sp.want;
    sp.dot.classList.toggle('on', on); sp.ctl.classList.toggle('rec', on); sp.ctl.setAttribute('aria-pressed', on ? 'true' : 'false'); sp.ctl.innerHTML = MICSVG(on); sp.ctl.setAttribute('aria-label', on ? 'Stop recording' : 'Start recording'); sp.ctl.title = on ? 'Stop recording' : 'Start recording';
    sp.state.textContent = on ? 'Recording' : (sp.el0 > 0 ? 'Paused' : 'Not recording yet');
    sp.state.classList.toggle('rec', on); sp.state.classList.toggle('pz', !on && sp.el0 > 0);
    spNotice(on);
    if (sp.go) sp.go.hidden = on || sp.el0 > 0 || !SR;
    sp.tm.textContent = fmtT(sp.el0);
    spBtn.classList.toggle('rec', on);
  }
  function spTick() { if (!sp) return; var n = Date.now(); if (sp.want) sp.el0 += n - sp.last; sp.last = n; sp.tm.textContent = fmtT(sp.el0); if (sp.want && spCapped()) spCap(); }
  // v6.9 (Leo, Nov 26): without a login, a recording can be up to 2 minutes. Then: "Sorry, we can't let you record anymore." with Send, or Send and create a free login.
  var CAP_MS = 120000;
  function loggedIn() {
    try { if (window.HMRAuth && window.HMRAuth.user) return true; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && /^sb-[a-z0-9]+-auth-token$/.test(k) && /"access_token"/.test(localStorage.getItem(k) || '')) return true; } } catch (e) { }
    return false;
  }
  function spCapped() { return sp && sp.el0 >= CAP_MS && !loggedIn(); }
  function spCap() {
    if (!sp) return; spPause();
    var c = sp.cap; c.textContent = ''; c.hidden = false;
    c.appendChild(el('p', 'hc-t', 'Sorry, we can\'t let you record anymore.'));
    c.appendChild(el('p', 'hc-p', 'Without a login, a recording can be up to 2 minutes. You can send what you have, or send it and create a free login: free forever, with full access to this and many more features.'));
    var r = el('div', 'hc-r'), b1 = el('button', 'hs-btn a', 'Send'), b2 = el('button', 'hs-btn m', 'Send and create a free login'); b1.type = b2.type = 'button';
    b1.addEventListener('click', function () { c.hidden = true; sp.sub.anon(); });
    b2.addEventListener('click', function () { c.hidden = true; sp.capLogin = true; sp.sub.anon(); });
    r.appendChild(b1); r.appendChild(b2); c.appendChild(r);
    try { c.scrollIntoView({ block: 'nearest' }); } catch (e) { }
  }
  // v6.9: a thin notice at the top of the screen while the mic is on
  var spNote = null;
  function spNotice(on) {
    if (!spNote) { spNote = el('div', 'hmr-spnote'); spNote.setAttribute('data-hmr-ui', ''); spNote.setAttribute('role', 'status'); spNote.hidden = true; doc.body.appendChild(spNote); }
    spNote.textContent = 'Recording. Your words are filling the box. You can leave this page and move around the site; the box keeps your words.';
    spNote.hidden = !on;
  }
  function micHelp() {
    var ua = navigator.userAgent || '', ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1), and = /Android/.test(ua);
    var edge = /Edg\//.test(ua), ff = /Firefox|FxiOS/.test(ua), chrome = /Chrome|CriOS/.test(ua) && !edge && !ff;
    if (ios && /CriOS/.test(ua)) return ['iPhone, Chrome', ['Open the Settings app.', 'Scroll down and tap Chrome.', 'Turn on Microphone.', 'Come back here and tap Try again.']];
    if (ios) return ['iPhone, Safari', ['Tap the aA button at the left of the address bar.', 'Tap Website Settings, then Microphone, then Allow.', 'Or open Settings, tap Safari, tap Microphone, and choose Ask or Allow.', 'Come back here and tap Try again.']];
    if (and && chrome) return ['Android, Chrome', ['Tap the lock icon at the left of the address bar.', 'Tap Permissions, then Microphone, then Allow.', 'Tap Try again.']];
    if (and) return ['Android', ['Tap the lock icon at the left of the address bar, or open the browser menu and tap Settings, then Site settings.', 'Find Microphone and choose Allow for this site.', 'Tap Try again.']];
    if (edge || chrome) return [edge ? 'Desktop, Edge' : 'Desktop, Chrome', ['Click the lock icon at the left of the address bar.', 'Turn on Microphone (Allow).', 'Click Try again, or reload the page if the browser asks.']];
    if (ff) return ['Desktop, Firefox', ['Click the permissions icon at the left of the address bar.', 'Remove the Blocked setting next to Microphone.', 'Click Try again.']];
    if (/Safari/.test(ua)) return ['Desktop, Safari', ['Open the Safari menu, then Settings for This Website.', 'Set Microphone to Allow.', 'Click Try again.']];
    return ['Your browser', ['Open this site\'s permissions (usually the icon at the left of the address bar).', 'Set Microphone to Allow.', 'Click Try again.']];
  }
  function spHelp() {
    var h = sp.help, m = micHelp(); h.textContent = '';
    h.appendChild(el('p', 'hh', 'The microphone is blocked'));
    h.appendChild(el('p', '', 'Browsers do not let a page open settings for you, so here is where to look (' + m[0] + ').'));
    var ol = el('ol'); m[1].forEach(function (t) { ol.appendChild(el('li', '', t)); }); h.appendChild(ol);
    var tb = el('button', 'hs-try', 'Try again'); tb.type = 'button'; tb.addEventListener('click', spRetry); h.appendChild(tb);
    h.appendChild(el('p', 'hn', 'Or tap the mic on your keyboard and talk into the box. Your words are saved.'));
    h.hidden = false; sp.el.classList.add('help'); sp.live.hidden = false;
  }
  function spRetry() {
    var md = navigator.mediaDevices; spSay('Asking for the microphone...');
    if (!md || !md.getUserMedia) { spStart(); return; }
    md.getUserMedia({ audio: true }).then(function (st) {
      try { st.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { }
      spStart();
    }, function () { spSay('Still blocked. Follow the steps above, then tap Try again.'); });
  }
  function spStart() {
    if (!sp || !SR) return;
    spPick(false);
    if (spCapped()) { spCap(); return; }
    sp.want = true; sp.fails = 0; sp.quick = 0; sp.last = Date.now(); sp.help.hidden = true; sp.el.classList.remove('help'); spSay('Listening. Keep scrolling and using the site while you talk.');
    spBegin(); spShow();
  }
  function spBegin() {
    if (!sp || !sp.want) return;
    var r;
    try {
      r = new SR(); r.continuous = true; r.interimResults = true; r.lang = navigator.language || 'en-US'; try { r.maxAlternatives = 1; } catch (e) { }
      r.onresult = function (ev) {
        if (sp.rec !== r) return; sp.fails = 0; var raw = '';
        for (var i = 0; i < ev.results.length; i++) { var t = ev.results[i][0].transcript; raw += (raw && !/^\s/.test(t) && !/\s$/.test(raw) ? ' ' : '') + t; }
        sp.raw = raw; sp.sess = (sp.ign && raw.indexOf(sp.ign) === 0 ? raw.slice(sp.ign.length) : raw).trim(); spPaint();
      };
      r.onerror = function (ev) {
        if (sp.rec !== r) return; var er = ev && ev.error;
        if ((er === 'not-allowed' || er === 'service-not-allowed') && sp.auto) { sp.auto = false; sp.want = false; spShow(); spSay('Welcome back. Your note from the last page is here. Press the mic in the box to keep talking.'); }
        else if (er === 'not-allowed' || er === 'service-not-allowed') { sp.want = false; spShow(); spSay(''); spHelp(); }
        else if (er === 'audio-capture') { sp.want = false; spShow(); spSay('No microphone found. You can type instead. Your words are saved.'); }
        else if (er === 'network') { sp.fails++; if (sp.fails >= 3) { sp.want = false; spShow(); spSay('Voice typing lost its connection. Your words are saved. Tap the mic in the box to try again.'); } }
      };
      r.onstart = function () { if (sp.rec === r) sp.auto = false; };
      r.onend = function () {
        if (sp.rec !== r) return; sp.rec = null; sp.committed = spText(); sp.sess = ''; sp.raw = ''; sp.ign = ''; spPaint();
        if (sp.want) {
          sp.quick = (Date.now() - sp.startedAt < 1200) ? sp.quick + 1 : 0;
          if (sp.quick >= 6) { sp.want = false; spShow(); spSay('Voice typing keeps stopping on this device. Your words are saved. Tap the mic in the box, or use your keyboard\'s mic button.'); return; }
          setTimeout(function () { if (sp && sp.want && !sp.rec) spBegin(); }, 250 + sp.quick * 300);
        } else { spShow(); if (!/blocked|found|connection|stopping/.test(sp.mst.textContent)) spSay(sp.ta.value ? 'Paused. Your words are saved.' : ''); }
      };
      sp.rec = r; sp.startedAt = Date.now(); r.start();
    } catch (e) {
      if (e && e.name === 'InvalidStateError') return;
      sp.rec = null; sp.want = false; spShow();
      if (sp.auto) { sp.auto = false; spSay('Welcome back. Your note from the last page is here. Press the mic in the box to keep talking.'); }
      else spSay('Voice typing could not start. You can type instead, or use your keyboard\'s mic button.');
    }
  }
  function spPause() { if (!sp) return; sp.want = false; var r = sp.rec; try { if (r) r.stop(); } catch (e) { } spShow(); }
  // v6.5.9: drag the Speak card anywhere by its top line (mouse or finger). The spot is kept for this page view.
  var SPDRAG = 'hmr-spk-drag-hint';
  function spDraggable(card, handle) {
    handle.classList.add('hs-grab'); handle.title = 'Drag to move';
    var st = null;
    handle.addEventListener('pointerdown', function (e) {
      if (e.button > 0 || (e.target.closest && e.target.closest('button'))) return;
      var r = card.getBoundingClientRect(); st = { x: e.clientX, y: e.clientY, l: r.left, t: r.top, w: r.width, on: false, id: e.pointerId };
    });
    handle.addEventListener('pointermove', function (e) {
      if (!st || e.pointerId !== st.id) return;
      var dx = e.clientX - st.x, dy = e.clientY - st.y;
      if (!st.on) { if (Math.abs(dx) + Math.abs(dy) < 5) return; st.on = true; try { handle.setPointerCapture(e.pointerId); } catch (er) { } card.classList.add('hs-moved'); lsSet(SPDRAG, '1'); var h = card.querySelector('.hs-dhint'); if (h) h.parentNode.removeChild(h); }
      var W = window.innerWidth, H = window.innerHeight, ch = card.offsetHeight;
      var l = Math.max(4, Math.min(W - st.w - 4, st.l + dx)), t = Math.max(4, Math.min(H - Math.min(ch, H - 8) - 4, st.t + dy));
      var cs = card.style; cs.setProperty('left', l + 'px', 'important'); cs.setProperty('top', t + 'px', 'important'); cs.setProperty('bottom', 'auto', 'important'); cs.setProperty('right', 'auto', 'important'); cs.setProperty('transform', 'none', 'important'); cs.setProperty('width', st.w + 'px', 'important');
      e.preventDefault();
    });
    function end(e) { if (st && st.on) { try { handle.releasePointerCapture(e.pointerId); } catch (er) { } } st = null; }
    handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
  }
  function spDragHint() {
    if (!sp || lsGet(SPDRAG) === '1' || sp.el.querySelector('.hs-dhint')) return;
    var h = el('p', 'hs-dhint', 'You can grab this and move it anywhere: drag the top line.'), hd = sp.el.querySelector('.hd');
    if (hd && hd.nextSibling) sp.el.insertBefore(h, hd.nextSibling); else sp.el.appendChild(h);
  }
  function buildSpeak() {
    sp = { want: false, committed: '', sess: '', raw: '', ign: '', rec: null, fails: 0, quick: 0, el0: 0, last: Date.now(), startedAt: 0 };
    var s = el('div', 'hmr-spk'); s.id = 'hmr-spk'; s.hidden = true; s.setAttribute('role', 'dialog'); s.setAttribute('aria-label', 'Speak here'); sp.el = s;
    var hd = el('div', 'hd');
    hd.appendChild(el('span', 'hs-heart', '\uD83D\uDC9B')); hd.appendChild(el('span', 'hs-ttl', 'Do us a big favor, tell us what you think')); hd.appendChild(el('span', 'hs-sp'));
    var x = el('button', 'x', '\u00d7'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.addEventListener('click', function () { closeSpeak(true, true); });
    hd.appendChild(x); s.appendChild(hd);
    // small status row: red dot, timer, state
    var rw = el('div', 'hs-row');
    sp.dot = el('span', 'hs-dot'); sp.dot.setAttribute('aria-hidden', 'true'); sp.tm = el('span', 'hs-tm', '0:00'); sp.state = el('span', 'hs-state', 'Not recording yet');
    rw.appendChild(sp.dot); rw.appendChild(sp.tm); rw.appendChild(sp.state); s.appendChild(rw);
    // the explainer, with its own small x ("Don't show again")
    if (lsGet(SPWHY) !== '1') {
      var why = el('div', 'hs-why2'); why.appendChild(el('p', '', 'We give real value for free, and we hope you will spend a couple of minutes sharing your thoughts. There is a community of cooperation that we believe exists, and so we are creating the platform for it. Two minutes of your talk is worth a lot to us. Tap the part of the page you want to talk about (or press the mic in the box), wait half a second, then begin. Your words appear in the text box, and you can keep scrolling and using the site while you talk.'));
      var wx = el('button', 'hs-wx', '\u00d7 Don\'t show again'); wx.type = 'button'; wx.setAttribute('aria-label', 'Hide this explanation and do not show it again');
      wx.addEventListener('click', function () { lsSet(SPWHY, '1'); if (why.parentNode) why.parentNode.removeChild(why); });
      why.appendChild(wx); s.appendChild(why);
    }
    sp.long = el('p', 'hs-long', 'Talk as long as you like.'); s.appendChild(sp.long);
    s.appendChild(el('p', 'hs-fc', 'Think we got something wrong? Fact-check us: say what is wrong, and give links to the places you are checking it from.'));
    s.appendChild(el('p', 'hs-fc', 'We especially want people to help us progress, whether that\'s telling us we\'re wrong or anything else. We\'re open to whatever that means.'));
    sp.help = el('div', 'hs-help'); sp.help.hidden = true; s.appendChild(sp.help);
    sp.cap = el('div', 'hs-cap'); sp.cap.hidden = true; sp.cap.setAttribute('role', 'alert'); s.appendChild(sp.cap);
    // v6.9 (Leo, Nov 26): press the mic at the bottom, then tap the part of the screen you want to talk about; recording starts on that tap
    sp.pick = el('div', 'hs-pick'); sp.pick.hidden = true;
    sp.pick.appendChild(el('p', '', 'Tap the part of the page you want to talk about. Recording starts on that tap.'));
    var wp = el('button', 'hs-btn a', 'Talk about the whole page'); wp.type = 'button'; wp.addEventListener('click', function () { sp.spot = null; spStart(); }); sp.pick.appendChild(wp);
    s.appendChild(sp.pick);
    sp.spotEl = el('p', 'hs-spot'); sp.spotEl.hidden = true; s.appendChild(sp.spotEl);
    sp.go = el('p', 'hs-go', 'Press the record button and begin speaking'); s.appendChild(sp.go);
    sp.live = el('div', 'hs-live'); sp.ta = el('textarea'); sp.ta.id = 'hmr-sp-text'; sp.ta.rows = 2; sp.ta.setAttribute('autocomplete', 'off'); sp.ta.setAttribute('aria-label', 'What we heard. You can edit it.'); sp.ta.placeholder = SR ? 'Your words show up here as you talk' : 'Type here';
    var tw = el('div', 'hmr-tw'); tw.appendChild(sp.ta);
    sp.ctl = el('button', 'hmr-tmic'); sp.ctl.type = 'button'; sp.ctl.innerHTML = MICSVG(false); sp.ctl.setAttribute('aria-label', 'Start recording'); sp.ctl.title = 'Start recording'; tw.appendChild(sp.ctl);
    sp.live.appendChild(tw); s.appendChild(sp.live);
    s.appendChild(el('p', 'hs-tip', 'Tip: our mic keeps listening while you scroll. Your keyboard\'s mic works too, but it stops when you leave the box.'));
    sp.mst = el('p', 'st'); sp.mst.setAttribute('role', 'status'); sp.mst.setAttribute('aria-live', 'polite'); s.appendChild(sp.mst);
    sp.ctl.addEventListener('click', function () { if (sp.want) spPause(); else spStart(); });
    sp.ta.addEventListener('input', function () { sp.committed = sp.ta.value; sp.ign = sp.raw; sp.sess = ''; saveSpeak(); });
    sp.sub = submitPair({
      text: function () { spPause(); saveSpeak(); var t = sp.ta.value.trim(); if (!t && !TOUCH) { try { sp.ta.focus({ preventScroll: true }); } catch (e) { } } return t; },
      kind: 'speak',
      details: function () { return sp.spot ? { spot: sp.spot } : undefined; },
      onSent: function () {
        sp.committed = ''; sp.sess = ''; sp.raw = ''; sp.ign = ''; sp.ta.value = ''; sp.el0 = 0; sp.spot = null; sp.spotEl.hidden = true; sp.cap.hidden = true; ldel(SPKEY); spShow();
        var lg = sp.capLogin; sp.capLogin = false;
        setTimeout(function () { if (sp && !sp.el.hidden) closeSpeak(true, true); if (lg) { try { window.HMRDock.openDash('login'); } catch (e) { } } }, 1500);
      }
    });
    s.appendChild(sp.sub.el);
    s.appendChild(el('p', 'hs-free', FREE_LINE));
    s.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); closeSpeak(true, true); } });
    if (!SR) { sp.dot.hidden = sp.tm.hidden = sp.ctl.hidden = true; sp.state.textContent = 'Speak here'; sp.state.hidden = false; }
    sp.timer = setInterval(spTick, 250);
    doc.body.appendChild(s);
    spDraggable(s, hd);
  }
  // fromTap is true only when the Speak button was pressed: recording starts inside that tap, because phones only allow the microphone after a user gesture
  function openSpeak(fromTap) {
    closeOthers('sp'); stopFunsies(true); closePlay(false);
    if (!sp) buildSpeak();
    var d = jget(SPKEY, {});
    if (sp.el.hidden) { sp.committed = d.t || ''; sp.sess = ''; sp.raw = ''; sp.ign = ''; sp.ta.value = sp.committed; sp.el0 = 0; sp.help.hidden = true; sp.el.classList.remove('help'); sp.last = Date.now(); }
    sp.sub.say(d.t && sp.el.hidden ? 'Your unsent words from last time are here.' : '');
    sp.el.hidden = false; spBtn.setAttribute('aria-expanded', 'true'); spShow();
    if (!SR) { spSay(SPNOSR); if (!TOUCH) { try { sp.ta.focus({ preventScroll: true }); } catch (e) { } } return; }
    // v6.9: a press of the dock mic asks for the spot to talk about; the tap on that spot starts recording (a user gesture, so phones allow it).
    //   The record button in the box and "Talk about the whole page" start it too.
    if (!sp.want) spSay('');
    sp.long.textContent = loggedIn() ? 'Talk as long as you like.' : 'Talk for up to 2 minutes, or as long as you like with a free login.';
    if (fromTap && !sp.want) spPick(true);
    spDragHint();
  }
  function spPick(on) {
    if (!sp) return; sp.picking = !!on; sp.pick.hidden = !on; sp.el.classList.toggle('picking', !!on); root.classList.toggle('hmr-picking', !!on);
    if (on) { doc.addEventListener('click', spPickClick, true); toast('Tap the part of the page you want to talk about.', null, 4000); }
    else doc.removeEventListener('click', spPickClick, true);
  }
  function spPickClick(e) {
    if (!sp || !sp.picking) return;
    if (insideDock(e.target) || (spNote && spNote.contains(e.target))) return;
    e.preventDefault(); e.stopPropagation();
    var px = e.pageX, py = e.pageY, d = null; try { d = describe(e.target, px, py); } catch (x) { }
    sp.spot = d ? { selector: d.selector, heading: d.heading, text: d.text, x: d.x, y: d.y, page: location.href } : { page: location.href };
    sp.spotEl.textContent = 'About: ' + (d && (d.heading || d.text) ? '"' + (d.heading || d.text).slice(0, 70) + '"' : 'this spot on the page');
    sp.spotEl.hidden = false;
    spStart();
  }
  // an outside tap never closes this: the page stays usable (scroll, tap) while it records. The X, Escape, or the Speak button itself (force) close it. Other dock buttons leave a recording alone.
  function closeSpeak(back, force) {
    if (!sp || sp.el.hidden) return; if (!force && spRec()) return;
    spPick(false); spPause(); saveSpeak(); sp.el.hidden = true; spBtn.setAttribute('aria-expanded', 'false'); spBtn.classList.remove('rec');
    if (back) { try { spBtn.focus({ preventScroll: true }); } catch (e) { spBtn.focus(); } }
  }
  spBtn.addEventListener('click', function () { if (sp && !sp.el.hidden) closeSpeak(true, true); else openSpeak(true); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sp && !sp.el.hidden) closeSpeak(true, true); });
  window.addEventListener('pagehide', function () {
    if (sp) {
      var live = !sp.el.hidden, was = !!sp.want, txt = sp.ta.value; spPause(); saveSpeak();
      try { if (live && (txt.trim() || was)) sessionStorage.setItem(SPRESUME, JSON.stringify({ t: txt, at: Date.now(), rec: was, el0: sp.el0, spot: sp.spot || null })); } catch (e) { }
    }
  });
  // coming back on another page of the site: the note is picked up where it was left. v6.9: if the mic was on, it tries to keep recording by itself;
  //   where the browser wants a new tap first, the box says so.
  (function () {
    var r = null; try { r = JSON.parse(sessionStorage.getItem(SPRESUME) || 'null'); sessionStorage.removeItem(SPRESUME); } catch (e) { }
    if (!r || (!r.t && !r.rec) || Date.now() - (r.at || 0) > 30 * 60 * 1000) return;
    setTimeout(function () {
      try {
        jset(SPKEY, { t: r.t || '' }); openSpeak(false);
        sp.el0 = +r.el0 || 0; sp.spot = r.spot || null; if (sp.spot) { sp.spotEl.textContent = 'About: "' + String(sp.spot.heading || sp.spot.text || 'a spot on the last page').slice(0, 70) + '"'; sp.spotEl.hidden = false; }
        if (r.rec && SR && !spCapped()) { sp.auto = true; spStart(); spSay('Still recording. Keep talking.'); }
        else spSay('Welcome back. Your note from the last page is here. Press the mic in the box to keep talking.');
      } catch (e) { }
    }, 700);
  })();
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden && sp && sp.want && !sp.rec) spBegin(); });

  // ---- highlight tool (v6): select text and it is marked right away (several at once); hover a mark to get the menu; the menu stays while anything is highlighted.
  //      The menu: Share with others, Feedback for us, Email myself, Remove highlight, and an X that clears every highlight in progress.
  var HLKEY = 'hmr-hl-v1:' + location.pathname, HLSEEN = 'hmr-hl-seen', hlm = null, hlActive = null, mouseDown = false, selT = 0, hlRaf = 0;
  function hlHash(t, n) { var h = 5381, s = t + '|' + n; for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function flatText() {
    var tw = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { var p = n.parentNode; if (!p || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(p.nodeName)) return NodeFilter.FILTER_REJECT; if (p.closest && p.closest('[data-hmr-dock],[data-hmr-ui],.hmr-rxp,.hmr-fzm,.hmr-fbp,.hmr-spk,.hmr-hlm,.hmr-pov,.hmr-dx,.hmr-toast,.hmr-gen')) return NodeFilter.FILTER_REJECT; return NodeFilter.FILTER_ACCEPT; } });
    var s = '', map = [], last = ' ', n;
    while ((n = tw.nextNode())) {
      var v = n.nodeValue;
      for (var i = 0; i < v.length; i++) {
        var c = v.charAt(i), ws = /\s/.test(c);
        if (ws) { if (last === ' ') continue; s += ' '; last = ' '; } else { s += c; last = c; }
        map.push([n, i]);
      }
    }
    return { s: s, map: map };
  }
  function occurrences(f, t) { var a = [], i = -1; while ((i = f.s.indexOf(t, i + 1)) >= 0) a.push(i); return a; }
  function cmpPt(n1, o1, n2, o2) { var a = doc.createRange(), b = doc.createRange(); a.setStart(n1, o1); a.collapse(true); b.setStart(n2, o2); b.collapse(true); return a.compareBoundaryPoints(Range.START_TO_START, b); }
  function wrapRange(r, id) {
    var rt = r.commonAncestorContainer; if (rt.nodeType === 3) rt = rt.parentNode;
    var tw = doc.createTreeWalker(rt, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    if (r.commonAncestorContainer.nodeType === 3) nodes.push(r.commonAncestorContainer);
    else while ((n = tw.nextNode())) { if (r.intersectsNode(n)) nodes.push(n); }
    var plan = nodes.map(function (nd) { return { nd: nd, s: nd === r.startContainer ? r.startOffset : 0, e: nd === r.endContainer ? r.endOffset : nd.nodeValue.length }; });   // offsets read before any split, so the last letter is never lost
    plan.forEach(function (q) {
      var nd = q.nd, s = q.s, e = q.e;
      if (nd.parentNode && nd.parentNode.closest && nd.parentNode.closest('[data-hmr-dock],[data-hmr-ui],.hmr-fbp,.hmr-spk,.hmr-hlm,.hmr-dx,.hmr-gen')) return;
      if (e <= s || !nd.nodeValue.slice(s, e).trim()) return;
      var mid = nd; if (s > 0) mid = nd.splitText(s); if (e - s < mid.nodeValue.length) mid.splitText(e - s);
      var m = el('mark', 'hmr-hl'); m.setAttribute('data-hl', id); mid.parentNode.insertBefore(m, mid); m.appendChild(mid);
    });
  }
  function hlList() { var a = jget(HLKEY, []); return Array.isArray(a) ? a : []; }
  function hlMarks(id) { return [].slice.call(doc.querySelectorAll('mark.hmr-hl' + (id ? '[data-hl="' + id + '"]' : ''))); }
  // mark a live Range. Everything comes from the page's flat text, so what is marked is exactly what was selected.
  function markRange(r) {
    var f = flatText(); if (!f.map.length) return null;
    var lo = 0, hi = f.map.length, m;
    while (lo < hi) { m = (lo + hi) >> 1; if (cmpPt(f.map[m][0], f.map[m][1], r.startContainer, r.startOffset) < 0) lo = m + 1; else hi = m; }
    var i0 = lo; hi = f.map.length;
    while (lo < hi) { m = (lo + hi) >> 1; if (cmpPt(f.map[m][0], f.map[m][1], r.endContainer, r.endOffset) < 0) lo = m + 1; else hi = m; }
    var i1 = lo;
    while (i0 < i1 && f.s.charAt(i0) === ' ') i0++; while (i1 > i0 && f.s.charAt(i1 - 1) === ' ') i1--;
    if (i1 - i0 < 2 || i1 - i0 > 1500) return null;
    var t = f.s.slice(i0, i1), nth = Math.max(0, occurrences(f, t).indexOf(i0)), id = hlHash(t, nth);
    if (hlList().some(function (h) { return h.id === id; })) return id;
    var rr = doc.createRange(); try { rr.setStart(f.map[i0][0], f.map[i0][1]); rr.setEnd(f.map[i1 - 1][0], f.map[i1 - 1][1] + 1); } catch (e) { return null; }
    var hit = false; hlMarks().forEach(function (mk) { try { if (rr.intersectsNode(mk)) hit = true; } catch (e) { } }); if (hit) return null;
    wrapRange(rr, id);
    var a = hlList(); a.push({ id: id, t: t, n: nth }); jset(HLKEY, a.slice(-100));
    return id;
  }
  function restoreHighlights() {
    var a = hlList(); if (!a.length) return;
    var todo = a.filter(function (h) { return !doc.querySelector('mark.hmr-hl[data-hl="' + h.id + '"]'); }); if (!todo.length) return;
    todo.forEach(function (h) {
      var f = flatText(), occ = occurrences(f, h.t), i0 = occ[h.n] != null ? occ[h.n] : occ[0]; if (i0 == null) return;
      var a0 = f.map[i0], a1 = f.map[i0 + h.t.length - 1]; if (!a0 || !a1) return;
      var r = doc.createRange(); try { r.setStart(a0[0], a0[1]); r.setEnd(a1[0], a1[1] + 1); wrapRange(r, h.id); } catch (e) { }
    });
  }
  function unmark(id) {
    hlMarks(id).forEach(function (m) { var p = m.parentNode; if (!p) return; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); p.normalize(); });
  }
  function removeHighlight(id) { unmark(id); jset(HLKEY, hlList().filter(function (h) { return h.id !== id; })); }
  function clearAllHighlights() { hlList().forEach(function (h) { unmark(h.id); }); hlMarks().forEach(function (m) { var p = m.parentNode; if (p) { while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); p.normalize(); } }); ldel(HLKEY); hideHlm(); }
  function clearHighlightsAfterSend() { clearAllHighlights(); }
  function hlTexts() { return hlList().map(function (h) { return h.t; }); }
  function pageLink(ts) {
    var u = location.href.split('#')[0]; if (!ts || !ts.length) return u;
    if (typeof ts === 'string') ts = [ts];
    return u + '#:~:text=' + ts.slice(0, 5).map(function (t) { return encodeURIComponent(t.slice(0, 300)).replace(/-/g, '%2D'); }).join('&text=');
  }
  function buildHlm() {
    hlm = el('div', 'hmr-hlm'); hlm.hidden = true; hlm.setAttribute('role', 'toolbar'); hlm.setAttribute('aria-label', 'Highlighted text');
    var cap = el('div', 'hh-cap'), tip = el('span', 'hh-tip', 'Tip: highlight a line, then hover over it to see this menu.'), hx = el('button', 'hh-x', '×'); hx.type = 'button'; hx.setAttribute('aria-label', 'Clear all highlights'); hx.title = 'Clear all highlights';
    hx.addEventListener('click', function () { clearAllHighlights(); toast('Highlights cleared.', null, 1800); });
    cap.appendChild(tip); cap.appendChild(hx); hlm.appendChild(cap);
    var row = el('div', 'hh-row'); hlm.appendChild(row);
    function b(l1, l2, aria, fn) { var x = el('button', 'hh-b'); x.type = 'button'; x.setAttribute('aria-label', aria); var p1 = el('b', '', l1), p2 = el('i', '', l2); x.appendChild(p1); x.appendChild(p2); x.addEventListener('click', fn); row.appendChild(x); return x; }
    b('Share', 'with others', 'Share with others', function (ev) {
      var pt = ev && ev.clientX != null ? { x: ev.clientX, y: ev.clientY } : null, ts = hlTexts(); if (!ts.length) return; var u = pageLink(ts);
      if (navigator.share) { navigator.share({ title: doc.title || CFG.site, text: '“' + ts[0].slice(0, 300) + '”', url: u }).catch(function () { }); }
      else copyText(u).then(function (ok) { toast(ok ? 'A link to this text has been copied. Anyone you share it with goes to this exact part.' : 'Could not copy. The link is ' + u, pt, 7000); });
    });
    b('Feedback', 'for us', 'Feedback for us', function () { var ts = hlTexts(); if (!ts.length) return; openSheet('feedback', { quote: ts.join(' ... ').slice(0, 400) }); });
    b('Email', 'myself', 'Email myself', function () { var ts = hlTexts(); if (!ts.length) return; openMail('mailto:?subject=' + encodeURIComponent('A note from ' + CFG.site) + '&body=' + encodeURIComponent(ts.map(function (t) { return '“' + t + '”'; }).join('\n\n') + '\n\n' + pageLink(ts))); });
    b('Remove', 'highlight', 'Remove this highlight', function () { var id = hlActive; if (id) removeHighlight(id); var rest = hlList(); if (!rest.length) hideHlm(); else { hlActive = rest[rest.length - 1].id; placeHlm(); } });
    hlm.addEventListener('mousedown', function (e) { e.preventDefault(); });
    hlm.addEventListener('keydown', function (e) { if (e.key === 'Escape') { hlm.hidden = true; } });
    doc.body.appendChild(hlm);
  }
  function hideHlm() { if (hlm) hlm.hidden = true; hlActive = null; }
  function showHlm(id) {
    if (!hlList().length) return;
    if (!hlm) buildHlm(); hlActive = id || hlActive || hlList()[hlList().length - 1].id;
    hlm.hidden = false; lsSet(HLSEEN, '1'); try { if (toastEl) toastEl.classList.remove('on'); } catch (e) { } placeHlm();
  }
  // keep the menu next to its highlight; if that is scrolled away it stays at the nearest edge of the screen
  function placeHlm() {
    if (!hlm || hlm.hidden) return;
    var ms = hlMarks(hlActive); if (!ms.length) ms = hlMarks(); if (!ms.length) { hideHlm(); return; }
    var r1 = ms[0].getClientRects(), r2 = ms[ms.length - 1].getClientRects(), first = r1.length ? r1[0] : ms[0].getBoundingClientRect(), last = r2.length ? r2[r2.length - 1] : ms[ms.length - 1].getBoundingClientRect();
    hlm.classList.remove('below');
    var w = hlm.offsetWidth, h = hlm.offsetHeight, cx = (first.left + last.right) / 2, left = clamp(cx - w / 2, 8, Math.max(8, innerWidth - w - 8));
    var maxTop = Math.max(8, innerHeight - h - 78), below = coarse() || first.top - h - 14 < 8, top = below ? last.bottom + 14 : first.top - h - 14;
    if (last.bottom < 0) { top = 8; below = true; } else if (first.top > innerHeight) { top = maxTop; below = false; }
    top = clamp(top, 8, maxTop); if (below) hlm.classList.add('below');
    hlm.style.left = left + 'px'; hlm.style.top = top + 'px'; hlm.style.setProperty('--cx', clamp(cx - left, 16, w - 16) + 'px');
  }
  function placeSoon() { if (hlRaf) return; hlRaf = requestAnimationFrame(function () { hlRaf = 0; placeHlm(); }); }
  function considerSelection() {
    if (mouseDown || (fb && !fb.el.hidden) || (sp && !sp.el.hidden) || (gen && gen.on)) return;
    var s = getSelection(); if (!s || s.rangeCount === 0 || s.isCollapsed) return;
    var r = s.getRangeAt(0), a = r.commonAncestorContainer; a = a.nodeType === 1 ? a : a.parentElement;
    if (!a || badNode(a) || !doc.body.contains(a) || (a.getRootNode && a.getRootNode() !== doc)) return;
    if (s.toString().trim().length < 2) return;
    var rc = r.cloneRange(), id = markRange(rc); try { s.removeAllRanges(); } catch (e) { }
    if (!id) return;
    var ms = hlMarks(id), rect = ms.length ? ms[ms.length - 1].getBoundingClientRect() : null;
    if (coarse() || lsGet(HLSEEN) === '1') showHlm(id);
    else toast('Highlighted. Now hover over it for share, feedback, and email options.', rect ? { x: rect.left + rect.width / 2, y: rect.top } : null, 6500);
  }
  doc.addEventListener('selectionchange', function () { clearTimeout(selT); if (mouseDown) return; selT = setTimeout(considerSelection, coarse() ? 900 : 700); });
  doc.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'touch') mouseDown = true; }, true);
  doc.addEventListener('pointerup', function (e) { if (!mouseDown) return; mouseDown = false; clearTimeout(selT); selT = setTimeout(considerSelection, 40); }, true);
  window.addEventListener('scroll', placeSoon, { passive: true }); window.addEventListener('resize', placeSoon);
  doc.addEventListener('pointerover', function (e) {
    if (e.pointerType === 'touch') return; var m = e.target && e.target.closest && e.target.closest('mark.hmr-hl'); if (!m) return;
    if ((fb && !fb.el.hidden) || (sp && !sp.el.hidden)) return; var id = m.getAttribute('data-hl'); if (hlm && !hlm.hidden && hlActive === id) return; showHlm(id);
  });
  doc.addEventListener('click', function (e) {
    var m = e.target && e.target.closest && e.target.closest('mark.hmr-hl'); if (!m || e.target.closest('a')) return;
    var s = getSelection(); if (s && !s.isCollapsed) return; showHlm(m.getAttribute('data-hl'));
  });
  function startHighlights() { restoreHighlights(); setTimeout(restoreHighlights, 700); setTimeout(restoreHighlights, 2500); }
  if (doc.readyState === 'complete') startHighlights(); else window.addEventListener('load', startHighlights);

  // ---- Design studio (v6): a design is built fresh from the page's own text plus a design prompt, inside a shadow-DOM overlay (full-screen canvas 3D behind it).
  //      The original layout is never restyled. The words never change. Settings live inside the site's own Design panel, or the dock's own Design panel when a site has none.
  var DXKEY = 'hmr-dx-v1', RTKEY = 'hmr-dx-rt-v2', dx = jget(DXKEY, {});
  if (!dx || typeof dx !== 'object') dx = {};
  dx = { pointer: dx.pointer || 'default', gi: dx.gi | 0, th: '' };   // v6.4: the design on screen is not remembered between visits; only a saved view (Save as my view) is
  var rt = jget(RTKEY, null);
  if (!rt || typeof rt !== 'object' || Array.isArray(rt)) { rt = {}; var oldRt = jget('hmr-dx-rt-v1', {}); if (oldRt && typeof oldRt === 'object') for (var ork in oldRt) if (oldRt.hasOwnProperty(ork)) rt[ork] = oldRt[ork] === 1 ? 4 : oldRt[ork] === -1 ? -4 : 0; }   // thumbs from v5 become +4 / -4 on the slider
  function dxSave() { jset(DXKEY, { pointer: dx.pointer, gi: dx.gi }); }
  function rtSave() { jset(RTKEY, rt); }
  var POINTERS = [['default', '🖱️', 'Default'], ['bullseye', '🎯', 'Bullseye'], ['large', '🔍', 'Large'], ['crosshair', '➕', 'Crosshair'], ['dot', '⚫', 'Dot'], ['star', '⭐', 'Star'], ['hand', '👆', 'Hand'], ['sparkle', '✨', 'Sparkle trail'], ['hearts', '💖', 'Hearts trail'], ['leaves', '🍃', 'Leaves trail'], ['snow', '❄️', 'Snow trail'], ['fire', '🔥', 'Fire trail'], ['music', '🎵', 'Music trail'], ['rainbow', '🌈', 'Rainbow trail']];
  var TRAILS = { sparkle: ['✨', '⭐', '✦', '💫'], hearts: ['💖', '💗', '💕'], leaves: ['🍃', '🍂', '🌿'], snow: ['❄️', '❅', '❆'], fire: ['🔥', '✨', '🧡'], music: ['🎵', '🎶', '♪'], rainbow: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣'] };

  // Themes: a theme is a set of design-prompt parameters (colors, type, shapes); genCSS() and buildPage() turn one, plus the page text, into a new page.
  // Text content is never touched. Every theme keeps text at 4.5:1 or better (fg/bg pair noted in a comment per theme).
  var SYS = 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif', GEO = 'Georgia,"Times New Roman",serif', TNR = '"Times New Roman",Times,serif', COUR = '"Courier New",Courier,monospace', IMP = 'Impact,"Arial Narrow Bold",Haettenschweiler,sans-serif', COMIC = '"Comic Sans MS","Comic Neue","Chalkboard SE",cursive,sans-serif', TREB = '"Trebuchet MS",Verdana,sans-serif', PAL = 'Palatino,"Palatino Linotype","Book Antiqua",Georgia,serif', GAR = 'Garamond,"Hoefler Text","Times New Roman",serif', VERD = 'Verdana,Geneva,sans-serif', BRUSH = '"Brush Script MT","Lucida Handwriting",cursive', ARB = '"Arial Black","Arial Bold",Gadget,sans-serif', HELV = 'Helvetica,Arial,sans-serif', MONO = 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';
  var TDEF = { b: '#ffffff', bi: '', f: '#222222', h: '#111111', l: '#0b5cad', c: '#ffffff', cd: '#dddddd', ff: SYS, hf: '', fs: 16, lh: 1.6, ls: '0', hs: '0', ht: 'none', ha: 'left', hw: 700, hz: 1, hst: 'normal', r: 8, bw: 1, bs: 'solid', sh: 'none', tl: 0, mw: 'none', gp: 24, an: 'fade', ad: '.7s', sp: '.25s', hv: 'lift', lk: 'ul', lt: 'underline', imf: 'none' };
  function TH(gid, id, name, o) { var t = {}, k; for (k in TDEF) t[k] = TDEF[k]; for (k in o) t[k] = o[k]; t.id = gid + '/' + id; t.name = name; if (!t.hf) t.hf = t.ff; return t; }
  var GENRES = [
    { id: 'professional', e: '💼', n: 'Professional', t: [
      TH('professional', 'boardroom', 'Boardroom', { b: '#ffffff', f: '#1f2933', h: '#0b3b66', l: '#0b5cad', c: '#f4f6f9', cd: '#d5dbe3', hf: GEO, r: 6, sh: '0 1px 3px rgba(0,0,0,.12)', mw: '980px', gp: 28, an: 'fade' }),   // fg #1f2933 on bg #ffffff
      TH('professional', 'executive', 'Executive', { b: '#0f1b2d', f: '#e6edf5', h: '#f2c46d', l: '#8cc4ff', c: '#172a45', cd: '#2d4467', ff: TREB, hf: GAR, hz: 1.15, ls: '.01em', r: 4, sh: '0 6px 18px rgba(0,0,0,.35)', mw: '900px', gp: 36, an: 'slide', lk: 'bg' }),   // fg #e6edf5 on bg #0f1b2d
      TH('professional', 'annual', 'Annual Report', { b: '#fbfaf6', f: '#222222', h: '#7a1f1f', l: '#7a1f1f', c: '#f3efe4', cd: '#7a1f1f', ff: GEO, hf: TNR, fs: 17, lh: 1.75, ht: 'uppercase', hs: '.12em', ha: 'center', hw: 600, r: 0, bw: 3, bs: 'double', mw: '760px', gp: 40, an: 'none' }),   // fg #222222 on bg #fbfaf6
      TH('professional', 'consulting', 'Consulting', { b: '#f1f5f9', bi: 'linear-gradient(180deg,#f1f5f9,#e2e8f0)', f: '#0f172a', h: '#0b5f58', l: '#0369a1', c: '#ffffff', cd: '#cbd5e1', ff: VERD, lh: 1.75, hw: 800, hs: '-.01em', r: 10, sh: '0 4px 14px rgba(15,23,42,.1)', mw: '1100px', gp: 22, an: 'rise', lk: 'wide' })   // fg #0f172a on bg #f1f5f9
    ] },
    { id: 'salesy', e: '🏷️', n: 'Salesy', t: [
      TH('salesy', 'bigsale', 'Big Sale', { b: '#fff8e1', bi: 'repeating-linear-gradient(45deg,#fff8e1 0 18px,#ffefb8 18px 36px)', f: '#1a1a1a', h: '#b71c1c', l: '#1565c0', c: '#ffffff', cd: '#c62828', ff: TREB, hf: IMP, ht: 'uppercase', hs: '.03em', ha: 'center', hz: 1.2, r: 8, bw: 3, sh: '5px 5px 0 #c62828', gp: 26, an: 'pop', hv: 'grow', lk: 'bg' }),   // fg #1a1a1a on bg #fff8e1
      TH('salesy', 'blackfriday', 'Black Friday', { b: '#111111', f: '#fafafa', h: '#ffeb3b', l: '#ff80ab', c: '#1e1e1e', cd: '#ffeb3b', ff: 'Arial,Helvetica,sans-serif', hf: ARB, ht: 'uppercase', hs: '.02em', hz: 1.15, r: 0, bw: 2, sh: '6px 6px 0 #e53935', gp: 30, an: 'slide', hv: 'shake', lk: 'bg' }),   // fg #fafafa on bg #111111
      TH('salesy', 'moneygreen', 'Money Green', { b: '#f0fff4', f: '#14301e', h: '#0a7a3b', l: '#0b6b9a', c: '#ffffff', cd: '#2e7d32', ff: VERD, hf: GEO, hst: 'italic', hw: 900, ha: 'center', r: 14, bw: 2, sh: '0 8px 0 #a5d6a7', gp: 30, an: 'rise' }),   // fg #14301e on bg #f0fff4
      TH('salesy', 'limited', 'Limited Offer', { b: '#fff1f2', bi: 'radial-gradient(circle at 20% 10%,#ffe4e6,#fff1f2 60%)', f: '#3b0a14', h: '#be123c', l: '#9f1239', c: '#ffffff', cd: '#fb7185', ff: TREB, hf: ARB, ht: 'uppercase', hs: '.04em', r: 20, bw: 3, bs: 'dashed', sh: '0 10px 24px rgba(190,18,60,.25)', tl: 1.2, gp: 26, an: 'pop', hv: 'grow', lk: 'dash' })   // fg #3b0a14 on bg #fff1f2
    ] },
    { id: 'gimmicky', e: '🎪', n: 'Gimmicky', t: [
      TH('gimmicky', 'confetti', 'Confetti', { b: '#fffbe6', bi: 'radial-gradient(#ffd1e3 3px,transparent 3.5px) 0 0/26px 26px,radial-gradient(#cfe8ff 3px,transparent 3.5px) 13px 13px/26px 26px', f: '#2b2b2b', h: '#c2255c', l: '#1864ab', c: '#ffffff', cd: '#fcc419', ff: COMIC, hz: 1.1, r: 24, bw: 4, bs: 'dotted', sh: '5px 5px 0 #ffa8c5', tl: 1.5, an: 'pop', hv: 'shake' }),   // fg #2b2b2b on bg #fffbe6
      TH('gimmicky', 'rainbow', 'Rainbow Road', { b: '#ffffff', bi: 'linear-gradient(90deg,#ffe0e0,#fff4d6,#e3ffe0,#d9f0ff,#ecdfff)', f: '#1b1b3a', h: '#5b21b6', l: '#be185d', c: '#ffffff', cd: '#8b5cf6', ff: TREB, hf: ARB, ht: 'uppercase', hs: '.03em', r: 18, bw: 3, sh: '0 0 0 4px #fde68a', tl: -1, an: 'slide', hv: 'grow' }),   // fg #1b1b3a on bg #ffffff
      TH('gimmicky', 'wobbly', 'Wobbly', { b: '#e8fff6', f: '#08312a', h: '#00695c', l: '#6a1b9a', c: '#ffffff', cd: '#26a69a', ff: VERD, hf: BRUSH, hz: 1.35, hw: 400, r: 30, bw: 3, sh: '0 6px 0 #a7e8da', tl: 2.4, an: 'swing', hv: 'shake' }),   // fg #08312a on bg #e8fff6
      TH('gimmicky', 'sticker', 'Sticker Book', { b: '#fff9db', f: '#2d2200', h: '#b5400a', l: '#0b7285', c: '#ffffff', cd: '#2d2200', ff: TREB, hf: IMP, ht: 'uppercase', hs: '.03em', r: 12, bw: 3, sh: '6px 6px 0 #2d2200', tl: -2, an: 'pop', hv: 'grow' })   // fg #2d2200 on bg #fff9db
    ] },
    { id: 'retro', e: '📼', n: 'Retro', t: [
      TH('retro', 'arcade', 'Arcade 1982', { b: '#12082b', f: '#f3eaff', h: '#39ff14', l: '#ffd23f', c: '#1d1040', cd: '#ff2e97', ff: COUR, ht: 'uppercase', hs: '.15em', r: 0, bw: 2, sh: '4px 4px 0 #ff2e97', an: 'slide', lk: 'bg' }),   // fg #f3eaff on bg #12082b
      TH('retro', 'diner', 'Diner 1955', { b: '#fff4e0', bi: 'repeating-linear-gradient(45deg,#fff4e0 0 20px,#ffe9c7 20px 40px)', f: '#3a1c0e', h: '#b3261e', l: '#0e6b7a', c: '#fffdf7', cd: '#c0392b', ff: TREB, hf: BRUSH, hz: 1.45, hw: 400, r: 16, bw: 4, bs: 'double', sh: '6px 6px 0 #19a7b5', tl: -.8, an: 'swing' }),   // fg #3a1c0e on bg #fff4e0
      TH('retro', 'terminal', 'Terminal 1985', { b: '#0a0f0a', f: '#7dff8c', h: '#b6ffbf', l: '#ffd166', c: '#0f1a0f', cd: '#3fbf4f', ff: COUR, hs: '.02em', r: 0, bw: 1, mw: '820px', an: 'none', lk: 'bg', hv: 'none' }),   // fg #7dff8c on bg #0a0f0a
      TH('retro', 'newsprint', 'Newsprint 1930', { b: '#efe6d2', bi: 'repeating-linear-gradient(0deg,#efe6d2 0 3px,#e9dfc8 3px 4px)', f: '#1c1a17', h: '#1c1a17', l: '#6b2d0f', c: '#f6efdd', cd: '#1c1a17', ff: GEO, hf: TNR, hs: '-.02em', hw: 900, ht: 'uppercase', ha: 'center', hz: 1.2, r: 0, bw: 2, mw: '880px', an: 'fade', imf: 'grayscale(1) contrast(1.1)' })   // fg #1c1a17 on bg #efe6d2
    ] },
    { id: 'artistic', e: '🎨', n: 'Artistic', t: [
      TH('artistic', 'gallery', 'Gallery White', { b: '#fafafa', f: '#222222', h: '#111111', l: '#111111', c: '#ffffff', cd: '#111111', ff: GAR, fs: 18, lh: 1.9, hs: '.04em', hst: 'italic', hw: 400, hz: 1.2, r: 0, mw: '700px', gp: 44, an: 'fade', ad: '1.2s', hv: 'none' }),   // fg #222222 on bg #fafafa
      TH('artistic', 'watercolor', 'Watercolor', { b: '#fdf6f8', bi: 'radial-gradient(circle at 15% 20%,#fadadd 0,transparent 45%),radial-gradient(circle at 85% 30%,#d6e8fa 0,transparent 45%),radial-gradient(circle at 50% 90%,#e8f5d6 0,transparent 50%)', f: '#2c2438', h: '#7b2d6e', l: '#3a3a9e', c: '#ffffff', cd: '#e0c3e8', ff: PAL, hst: 'italic', r: 26, sh: '0 10px 30px rgba(123,45,110,.15)', an: 'rise', ad: '.9s' }),   // fg #2c2438 on bg #fdf6f8
      TH('artistic', 'bauhaus', 'Bauhaus', { b: '#f5f0e1', f: '#111111', h: '#c42020', l: '#003049', c: '#ffffff', cd: '#111111', ff: TREB, hf: IMP, ht: 'uppercase', r: 0, bw: 3, sh: '8px 8px 0 #f7b801', mw: '1000px', an: 'slide', lk: 'bg' }),   // fg #111111 on bg #f5f0e1
      TH('artistic', 'ink', 'Ink and Charcoal', { b: '#e9e6e1', f: '#1a1a1a', h: '#000000', l: '#1a1a1a', c: '#f3f1ed', cd: '#1a1a1a', ff: GEO, hf: BRUSH, hz: 1.4, hw: 400, r: 2, bw: 2, bs: 'dashed', sh: '3px 3px 0 #1a1a1a', tl: -.6, an: 'fade', imf: 'grayscale(1) contrast(1.15)' })   // fg #1a1a1a on bg #e9e6e1
    ] },
    { id: 'fantasy', e: '🐉', n: 'Fantasy', t: [
      TH('fantasy', 'forest', 'Enchanted Forest', { b: '#10261c', bi: 'radial-gradient(circle at 50% 0,#1b4332,#10261c 70%)', f: '#e9f5e1', h: '#ffd27d', l: '#9be7c4', c: '#183a2b', cd: '#52b788', ff: PAL, hf: 'Papyrus,Palatino,Georgia,serif', ha: 'center', r: 18, bw: 2, sh: '0 0 22px rgba(82,183,136,.35)', an: 'rise', hv: 'glow' }),   // fg #e9f5e1 on bg #10261c
      TH('fantasy', 'dragon', 'Dragon Keep', { b: '#1a0d0a', f: '#f5e6d3', h: '#ff9f45', l: '#ffc27a', c: '#2a1410', cd: '#b5391f', ff: GAR, fs: 18, hf: PAL, ht: 'uppercase', hs: '.1em', r: 6, bw: 3, bs: 'double', sh: '0 0 0 2px #5a1a10', mw: '940px', an: 'swing', hv: 'glow' }),   // fg #f5e6d3 on bg #1a0d0a
      TH('fantasy', 'castle', 'Starlit Castle', { b: '#1b1340', bi: 'radial-gradient(#2a2060 6px,transparent 7px) 0 0/90px 90px', f: '#efe9ff', h: '#ffd6f6', l: '#b9a7ff', c: '#261c5c', cd: '#8b7cf6', ff: GEO, hf: BRUSH, hz: 1.35, hw: 400, ha: 'center', r: 22, sh: '0 0 26px rgba(139,124,246,.4)', an: 'fade', ad: '1.1s', hv: 'glow' }),   // fg #efe9ff on bg #1b1340
      TH('fantasy', 'glade', 'Fairy Glade', { b: '#fff7fb', bi: 'linear-gradient(180deg,#fff7fb,#f3e8ff)', f: '#3b1f4a', h: '#a21caf', l: '#6d28d9', c: '#ffffff', cd: '#f0abfc', ff: PAL, hf: BRUSH, hz: 1.3, hw: 400, r: 28, sh: '0 8px 24px rgba(162,28,175,.18)', tl: .8, an: 'rise' })   // fg #3b1f4a on bg #fff7fb
    ] },
    { id: 'silly', e: '🤪', n: 'Silly', t: [
      TH('silly', 'bubblegum', 'Bubblegum', { b: '#ffe4f2', f: '#3d0a2b', h: '#b4005a', l: '#5300d1', c: '#ffffff', cd: '#ff4fa3', ff: COMIC, hw: 800, r: 30, bw: 3, bs: 'dashed', sh: '0 6px 0 #ff9ccc', tl: 1.8, an: 'pop', hv: 'shake' }),   // fg #3d0a2b on bg #ffe4f2
      TH('silly', 'banana', 'Banana Peel', { b: '#fff176', f: '#2a1f00', h: '#7a2e00', l: '#0d47a1', c: '#fffde7', cd: '#2a1f00', ff: VERD, hf: COMIC, r: 22, bw: 3, sh: '4px 4px 0 #f9a825', tl: -2.5, an: 'swing', hv: 'grow' }),   // fg #2a1f00 on bg #fff176
      TH('silly', 'disco', 'Alien Disco', { b: '#1b0036', bi: 'repeating-linear-gradient(90deg,#1b0036 0 40px,#24004a 40px 80px)', f: '#f5e8ff', h: '#7cff6b', l: '#ffb3f0', c: '#2e0a52', cd: '#7cff6b', ff: COMIC, hf: IMP, ht: 'uppercase', hs: '.06em', r: 40, bw: 4, bs: 'dotted', sh: '0 0 18px rgba(124,255,107,.35)', tl: 2, an: 'pop', hv: 'glow' }),   // fg #f5e8ff on bg #1b0036
      TH('silly', 'jelly', 'Jelly Bean', { b: '#e0f7fa', f: '#002a33', h: '#00545a', l: '#ad1457', c: '#ffffff', cd: '#26c6da', ff: TREB, hf: COMIC, ha: 'center', r: 36, bw: 3, sh: '0 8px 0 #80deea', tl: -1.2, an: 'pop' })   // fg #002a33 on bg #e0f7fa
    ] },
    { id: 'minimal', e: '◻️', n: 'Minimal', t: [
      TH('minimal', 'barepaper', 'Bare Paper', { b: '#ffffff', f: '#222222', h: '#000000', l: '#000000', c: '#ffffff', cd: '#dddddd', fs: 17, lh: 1.8, hw: 500, hz: .85, r: 0, mw: '640px', gp: 32, an: 'none', hv: 'none' }),   // fg #222222 on bg #ffffff
      TH('minimal', 'swiss', 'Swiss Grid', { b: '#fafafa', f: '#111111', h: '#111111', l: '#c1121f', c: '#fafafa', cd: '#111111', ff: HELV, hw: 700, hs: '-.03em', hz: 1.2, r: 0, mw: '1100px', gp: 20, an: 'fade', hv: 'none', lk: 'bg' }),   // fg #111111 on bg #fafafa
      TH('minimal', 'sand', 'Soft Sand', { b: '#f6f1ea', f: '#3b3228', h: '#5c4a36', l: '#8a3b0f', c: '#fffaf3', cd: '#e7dccb', lh: 1.85, ls: '.01em', r: 12, sh: '0 2px 10px rgba(92,74,54,.08)', mw: '720px', gp: 34, an: 'fade' }),   // fg #3b3228 on bg #f6f1ea
      TH('minimal', 'monodark', 'Mono Dark', { b: '#121212', f: '#e0e0e0', h: '#ffffff', l: '#9ad1ff', c: '#1a1a1a', cd: '#333333', fs: 17, r: 2, mw: '700px', an: 'none', hv: 'none' })   // fg #e0e0e0 on bg #121212
    ] },
    { id: 'futuristic', e: '🚀', n: 'Futuristic', t: [
      TH('futuristic', 'neongrid', 'Neon Grid', { b: '#05060f', bi: 'repeating-linear-gradient(0deg,#05060f 0 39px,#0c1230 39px 40px),repeating-linear-gradient(90deg,#05060f 0 39px,#0c1230 39px 40px)', f: '#dff6ff', h: '#00f0ff', l: '#ff7df0', c: '#0a1030', cd: '#00f0ff', ff: VERD, hf: TREB, ht: 'uppercase', hs: '.2em', r: 4, sh: '0 0 14px rgba(0,240,255,.5)', an: 'slide', hv: 'glow', lk: 'glow' }),   // fg #dff6ff on bg #05060f
      TH('futuristic', 'hologram', 'Hologram', { b: '#eaf7ff', bi: 'linear-gradient(135deg,#eaf7ff,#f0e9ff 50%,#e6fff6)', f: '#0b1b33', h: '#0044cc', l: '#6a00cc', c: '#ffffff', cd: '#7fd3ff', ff: TREB, hf: VERD, ls: '.02em', ht: 'uppercase', hs: '.08em', r: 18, sh: '0 0 24px rgba(127,211,255,.55)', an: 'rise', hv: 'glow' }),   // fg #0b1b33 on bg #eaf7ff
      TH('futuristic', 'mission', 'Mission Control', { b: '#0d1117', f: '#c9d1d9', h: '#58a6ff', l: '#3fb950', c: '#161b22', cd: '#30363d', ff: MONO, fs: 15, lh: 1.65, ht: 'uppercase', hs: '.1em', r: 6, an: 'fade', lk: 'bg' }),   // fg #c9d1d9 on bg #0d1117
      TH('futuristic', 'chrome', 'Chrome Orbit', { b: '#e8ecf1', bi: 'linear-gradient(180deg,#f5f7fa,#d9dfe8)', f: '#151a22', h: '#2b3a55', l: '#0a58ca', c: '#f7f9fc', cd: '#aab4c4', hf: TREB, hw: 800, ls: '.01em', r: 24, sh: '0 6px 16px rgba(21,26,34,.18)', an: 'zoom' })   // fg #151a22 on bg #e8ecf1
    ] },
    { id: 'cozy', e: '🧸', n: 'Cozy', t: [
      TH('cozy', 'hearth', 'Hearth', { b: '#f7ead8', bi: 'linear-gradient(#f7ead8,#f2dcc0)', f: '#4a2c17', h: '#8c3a12', l: '#9a3412', c: '#fff6e8', cd: '#d9b38c', ff: GEO, fs: 18, lh: 1.85, r: 16, bw: 2, sh: '0 6px 16px rgba(74,44,23,.18)', mw: '760px', an: 'fade' }),   // fg #4a2c17 on bg #f7ead8
      TH('cozy', 'tea', 'Tea and Blanket', { b: '#eef0e4', f: '#33382a', h: '#4f5f26', l: '#7a3e2b', c: '#f8f9ef', cd: '#c4c9a8', ff: PAL, hst: 'italic', r: 22, bw: 2, bs: 'dashed', sh: '0 4px 12px rgba(51,56,42,.1)', tl: .6, mw: '720px', an: 'rise' }),   // fg #33382a on bg #eef0e4
      TH('cozy', 'candle', 'Candlelight', { b: '#2b1d14', f: '#f4e4cf', h: '#ffc277', l: '#ffb3a0', c: '#3a281b', cd: '#7a5638', ff: GEO, hf: GAR, fs: 18, lh: 1.9, ha: 'center', hz: 1.2, r: 14, sh: '0 0 24px rgba(255,194,119,.2)', mw: '760px', an: 'fade', ad: '1.2s', hv: 'glow' }),   // fg #f4e4cf on bg #2b1d14
      TH('cozy', 'quilt', 'Quilt', { b: '#fdf3f0', bi: 'repeating-linear-gradient(45deg,#fdf3f0 0 14px,#f9e4de 14px 28px)', f: '#432818', h: '#a34a38', l: '#2f5d62', c: '#fffaf8', cd: '#e8b4a8', ff: TREB, hf: GEO, r: 10, bw: 3, bs: 'dashed', sh: '3px 3px 0 #f2c4ba', tl: .8, an: 'swing' })   // fg #432818 on bg #fdf3f0
    ] },
    { id: 'brutalist', e: '🧱', n: 'Brutalist', t: [
      TH('brutalist', 'concrete', 'Concrete', { b: '#cfcfcf', f: '#000000', h: '#000000', l: '#0000ee', c: '#e6e6e6', cd: '#000000', ff: COUR, hf: IMP, ht: 'uppercase', hz: 1.3, r: 0, bw: 4, sh: '8px 8px 0 #000000', an: 'none', hv: 'shake', lk: 'bg' }),   // fg #000000 on bg #cfcfcf
      TH('brutalist', 'rawhtml', 'Raw HTML', { b: '#ffffff', f: '#000000', h: '#000000', l: '#0000ee', c: '#ffffff', cd: '#000000', ff: TNR, fs: 16, lh: 1.4, r: 0, bw: 2, an: 'none', hv: 'none' }),   // fg #000000 on bg #ffffff
      TH('brutalist', 'warning', 'Yellow Warning', { b: '#ffe600', f: '#000000', h: '#000000', l: '#000000', c: '#ffffff', cd: '#000000', ff: 'Arial,Helvetica,sans-serif', hf: ARB, ht: 'uppercase', hs: '-.02em', r: 0, bw: 5, sh: '10px 10px 0 #000000', an: 'slide', hv: 'shake', lk: 'bg' }),   // fg #000000 on bg #ffe600
      TH('brutalist', 'posterblue', 'Poster Blue', { b: '#0022ff', f: '#ffffff', h: '#ffffff', l: '#ffe600', c: '#0018c9', cd: '#ffffff', ff: VERD, hf: IMP, ht: 'uppercase', hz: 1.3, r: 0, bw: 4, sh: '8px 8px 0 #000000', an: 'pop', lk: 'bg' })   // fg #ffffff on bg #0022ff
    ] },
    { id: 'nature', e: '🌿', n: 'Nature', t: [
      TH('nature', 'meadow', 'Meadow', { b: '#f1f8e9', bi: 'linear-gradient(180deg,#f1f8e9,#dcedc8)', f: '#1b3a1a', h: '#1b5e20', l: '#01579b', c: '#ffffff', cd: '#9ccc65', ff: VERD, hf: GEO, r: 20, sh: '0 6px 16px rgba(46,125,50,.18)', an: 'rise' }),   // fg #1b3a1a on bg #f1f8e9
      TH('nature', 'ocean', 'Ocean Deep', { b: '#062a3a', bi: 'linear-gradient(180deg,#062a3a,#0a4a63)', f: '#e6f6fb', h: '#7fe0f5', l: '#ffd98a', c: '#0b3b52', cd: '#3aa3c2', hf: TREB, ha: 'center', r: 24, sh: '0 8px 22px rgba(0,0,0,.35)', an: 'slide' }),   // fg #e6f6fb on bg #062a3a
      TH('nature', 'dusk', 'Desert Dusk', { b: '#fbe8d3', bi: 'linear-gradient(180deg,#fbe8d3,#f6cfa6)', f: '#3d1f10', h: '#a3340f', l: '#7a2b00', c: '#fff3e3', cd: '#d9884b', ff: GEO, hf: TREB, ht: 'uppercase', hs: '.1em', r: 8, bw: 2, sh: '4px 4px 0 #e9a870', an: 'fade' }),   // fg #3d1f10 on bg #fbe8d3
      TH('nature', 'floor', 'Forest Floor', { b: '#2a2a1c', f: '#ecebd6', h: '#c9e265', l: '#ffd479', c: '#34341f', cd: '#7a8a3a', ff: PAL, hf: GAR, fs: 17, r: 12, bw: 2, an: 'rise' })   // fg #ecebd6 on bg #2a2a1c
    ] }
  ];
  var THEME_BY_ID = {}; GENRES.forEach(function (g, gi) { g.t.forEach(function (t, i) { t.gi = gi; t.i = i; THEME_BY_ID[t.id] = t; }); });

  // Each design also picks a layout and a full-screen 3D background (canvas, no libraries). [layout, background]
  var LB = {
    'professional/boardroom': ['stack', 'tens'], 'professional/executive': ['sidebar', 'none'], 'professional/annual': ['magazine', 'none'], 'professional/consulting': ['cards', 'cube'],
    'salesy/bigsale': ['poster', 'orbs'], 'salesy/blackfriday': ['cards', 'cube'], 'salesy/moneygreen': ['stack', 'orbs'], 'salesy/limited': ['cards', 'stars'],
    'gimmicky/confetti': ['cards', 'orbs'], 'gimmicky/rainbow': ['timeline', 'tunnel'], 'gimmicky/wobbly': ['stack', 'helix'], 'gimmicky/sticker': ['cards', 'cube'],
    'retro/arcade': ['terminal', 'terrain'], 'retro/diner': ['cards', 'none'], 'retro/terminal': ['terminal', 'none'], 'retro/newsprint': ['magazine', 'none'],
    'artistic/gallery': ['stack', 'none'], 'artistic/watercolor': ['magazine', 'orbs'], 'artistic/bauhaus': ['poster', 'cube'], 'artistic/ink': ['stack', 'waves'],
    'fantasy/forest': ['timeline', 'helix'], 'fantasy/dragon': ['deck', 'stars'], 'fantasy/castle': ['stack', 'stars'], 'fantasy/glade': ['cards', 'orbs'],
    'silly/bubblegum': ['cards', 'orbs'], 'silly/banana': ['timeline', 'none'], 'silly/disco': ['poster', 'tunnel'], 'silly/jelly': ['stack', 'orbs'],
    'minimal/barepaper': ['stack', 'none'], 'minimal/swiss': ['sidebar', 'none'], 'minimal/sand': ['stack', 'none'], 'minimal/monodark': ['terminal', 'none'],
    'futuristic/neongrid': ['deck', 'terrain'], 'futuristic/hologram': ['cards', 'tens'], 'futuristic/mission': ['sidebar', 'stars'], 'futuristic/chrome': ['poster', 'cube'],
    'cozy/hearth': ['magazine', 'none'], 'cozy/tea': ['stack', 'orbs'], 'cozy/candle': ['deck', 'stars'], 'cozy/quilt': ['cards', 'none'],
    'brutalist/concrete': ['poster', 'cube'], 'brutalist/rawhtml': ['stack', 'none'], 'brutalist/warning': ['cards', 'none'], 'brutalist/posterblue': ['deck', 'tunnel'],
    'nature/meadow': ['timeline', 'waves'], 'nature/ocean': ['stack', 'waves'], 'nature/dusk': ['magazine', 'terrain'], 'nature/floor': ['cards', 'helix']
  };
  var THEME_BY_ID = {}; GENRES.forEach(function (g, gi) { g.t.forEach(function (t, i) { t.gi = gi; t.i = i; var lb = LB[t.id] || ['stack', 'none']; t.lay = lb[0]; t.bg = lb[1]; THEME_BY_ID[t.id] = t; }); });
  var PROOF = TH('text', 'only', 'Text only (proofread)', { b: '#ffffff', f: '#111111', h: '#111111', l: '#0b4fa8', c: '#f4f5f7', cd: '#b8bec9', fs: 17, lh: 1.7, hw: 700, r: 6, bw: 1, mw: '780px', gp: 14, an: 'none' });
  PROOF.gi = -1; PROOF.i = 0; PROOF.lay = 'proof'; PROOF.bg = 'none'; THEME_BY_ID[PROOF.id] = PROOF;

  // Which elements the rebuild skips: the dock, its panels, the site's own Design button and panel, and the rebuilt page itself
  function okSel(s) { try { doc.createDocumentFragment().querySelector(s); return true; } catch (e) { return false; } }
  var EXLIST = ['[data-hmr-dock]', '[data-hmr-ui]', '.hmr-rxp', '.hmr-fzm', '.hmr-fbp', '.hmr-spk', '.hmr-hlm', '.hmr-pov', '.hmr-dx', '.hmr-dsp', '.hmr-toast', '.hmr-again', '.hmr-mark', '.hmr-fzcanvas', '.hmr-sp', '.hmr-spacer', '.hmr-gen', '[data-hmr-tier-ribbon]'];
  [ds, ps].forEach(function (l) { if (l) l.split(',').forEach(function (s) { s = s.trim(); if (s && okSel(s) && EXLIST.indexOf(s) < 0) EXLIST.push(s); }); });
  var XSEL = EXLIST.join(',');
  var ANIMKF = {
    fade: '0%{opacity:0}', slide: '0%{opacity:0;transform:translateX(-28px)}', pop: '0%{opacity:0;transform:scale(.88)}60%{transform:scale(1.03)}', rise: '0%{opacity:0;transform:translateY(22px)}',
    zoom: '0%{opacity:0;transform:scale(1.08)}', swing: '0%{opacity:0;transform:rotate(-3deg) translateY(10px)}', drop: '0%{opacity:0;transform:translateY(-26px)}'
  };

  // ------------------------------------------------ 1. read the page's words, in reading order, as chunks
  var T_HEAD = /^H[1-6]$/, T_BLK = /^(P|LI|BLOCKQUOTE|DD|DT|FIGCAPTION|SUMMARY|TD|TH|PRE|CAPTION|LEGEND)$/, T_SKIP = /^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|SVG|CANVAS|VIDEO|AUDIO|IFRAME|OBJECT|EMBED|IMG|PICTURE|INPUT|SELECT|TEXTAREA|OPTION|HEAD|LINK|META|MAP|DIALOG)$/i;
  var T_INL = /^(A|B|I|EM|STRONG|SPAN|BUTTON|CODE|SMALL|SUP|SUB|MARK|ABBR|U|S|BR|LABEL|TIME|CITE|Q|KBD|BDI|FONT|DEL|INS|VAR|WBR|NOBR)$/i, T_CARD = /(^|[\s_-])(card|tile|box|item|panel|idea|site|feature|post|entry|plan|tier|testimonial|step|stat)([\s_-]|$)/i;
  function escH(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  // v6.4.1: the rebuilt design carries only the page's real content. Skipped: navigation, menus, dialogs and pop-ups (role=dialog, aria-modal, fixed-position gates), progress widgets,
  // skip links, tables of contents, anything hidden, aria-hidden or zero-size, and button-only rows (buttons are dropped; links are kept).
  var JUNKSEL = 'nav,dialog,[role="navigation"],[role="dialog"],[role="alertdialog"],[role="menu"],[role="menubar"],[role="status"],[role="progressbar"],[role="tooltip"],[role="search"],[aria-modal="true"],[aria-live],[popover],[data-hmr]';
  var JUNKCLS = /(^|[\s_-])(skip|skiplink|skip-link|sr-only|screen-reader-text|visually-hidden|toc|breadcrumbs?|menubtn|hmr-track|hmr-pop|hmr-label|modal|popup|pop-up|cookie|cookies|consent)([\s_-]|$)/i;
  var SKIPTXT = /^\s*skip (to )?(the )?(main )?(content|navigation|nav)\s*$/i;
  function visNode(e) {
    try {
      if (e.hasAttribute('hidden') || e.getAttribute('aria-hidden') === 'true' || e.matches(XSEL)) return false;
      if (e !== doc.body && e.tagName.toUpperCase() !== 'MAIN') {
        if (e.matches(JUNKSEL)) return false;
        var kc = e.getAttribute('class'); if (kc && JUNKCLS.test(kc)) return false;
        if (e.tagName.toUpperCase() === 'A' && SKIPTXT.test(e.textContent || '')) return false;
      }
      var cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      if (e !== doc.body && cs.position === 'fixed') return false;
      if (e !== doc.body && cs.display !== 'contents') { var r = e.getBoundingClientRect(); if (r.width <= 1 && r.height <= 1) return false; }
      return true;
    } catch (x) { return true; }
  }
  // a table of contents: a block whose text is nearly all links, three or more, almost all of them to anchors on this page
  function isTocLike(c) {
    try {
      var as = c.querySelectorAll('a[href]'); if (as.length < 3) return false;
      var inpage = 0, atx = 0; for (var i = 0; i < as.length; i++) {
        var h = as[i].getAttribute('href') || ''; if (h.charAt(0) === '#' && h.length > 1) inpage++;
        else { try { var u = new URL(as[i].href, location.href); if (u.hash.length > 1 && u.origin === location.origin && u.pathname === location.pathname) inpage++; } catch (e) { } }
        atx += (as[i].textContent || '').replace(/\s+/g, ' ').trim().length;
      }
      if (inpage < as.length * .8) return false;
      var tot = (c.textContent || '').replace(/\s+/g, ' ').trim().length; return tot > 0 && atx >= tot * .75;
    } catch (e) { return false; }
  }
  function inlHTML(n) {
    if (n.nodeType === 3) return escH(n.nodeValue.replace(/\s+/g, ' '));
    if (n.nodeType !== 1 || !visNode(n)) return '';
    var t = n.tagName.toUpperCase(); if (t === 'BR') return '<br>'; if (T_SKIP.test(t) || t === 'BUTTON' || n.getAttribute('role') === 'button') return '';
    var inner = ''; for (var k = n.firstChild; k; k = k.nextSibling) inner += inlHTML(k);
    if (!inner.replace(/&nbsp;|\s/g, '')) return inner;
    var dsp = ''; try { dsp = getComputedStyle(n).display; } catch (e) { }
    if (dsp && dsp !== 'inline' && dsp !== 'contents') inner = ' ' + inner + ' ';   // cells and flex items that sit side by side keep a space between them
    if (t === 'A') {
      var h = n.getAttribute('href'); if (!h || /^\s*javascript:/i.test(h)) return inner;
      if (SKIPTXT.test(plainOf(inner))) return '';
      var u = h; try { u = n.href || h; } catch (e) { }
      return '<a href="' + escH(u) + '"' + (h.charAt(0) === '#' ? ' data-int="' + escH(h.slice(1)) + '"' : '') + (n.target === '_blank' ? ' target="_blank" rel="noopener"' : '') + '>' + inner + '</a>';
    }
    if (t === 'B' || t === 'STRONG') return '<strong>' + inner + '</strong>';
    if (t === 'I' || t === 'EM' || t === 'CITE') return '<em>' + inner + '</em>';
    if (t === 'CODE' || t === 'KBD' || t === 'PRE') return '<code>' + inner + '</code>';
    if (t === 'SUP' || t === 'SUB') return '<' + t.toLowerCase() + '>' + inner + '</' + t.toLowerCase() + '>';
    return inner;
  }
  function plainOf(html) { return html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim(); }
  function hasBlockKid(c) { for (var k = c.firstElementChild; k; k = k.nextElementSibling) if (!T_INL.test(k.tagName) && !T_SKIP.test(k.tagName)) return true; return false; }
  function extractPage() {
    var items = [], count = 0, root0 = doc.body, titleEl = null, titlePlain = '', titleSeen = false;
    function emit(b) { if (count >= 1600) return; if (b.t === 'p' && titlePlain && titleSeen && plainOf(b.h) === titlePlain) return; items.push(b); count++; }
    function isCardEl(c) {
      var tg = c.tagName.toUpperCase(); if (/^(ARTICLE|FIGURE|DETAILS)$/.test(tg)) return true;
      var cl = (c.getAttribute('class') || ''); if (c.hasAttribute('data-hmr-card') || (cl && T_CARD.test(cl))) return true; return false;
    }
    function walkKids(n, inCard) {
      var run = null;
      function flush() { if (run && run.length) { var h = run.map(inlHTML).join('').trim(); if (plainOf(h)) emit({ t: 'p', h: h }); } run = null; }
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) { if (c.nodeValue.trim() || run) (run = run || []).push(c); continue; }
        if (c.nodeType !== 1 || !visNode(c)) continue;
        var tag = c.tagName.toUpperCase();
        if (T_SKIP.test(tag) || tag === 'BUTTON' || c === titleEl || c.getAttribute('role') === 'button') continue;
        if (/^(UL|OL|DIV|SECTION|ASIDE|P|DL|HEADER|FOOTER)$/.test(tag) && isTocLike(c)) continue;
        if (T_HEAD.test(tag)) { flush(); var hh = inlHTML(c).trim(); if (plainOf(hh)) emit({ t: 'h', l: +tag.charAt(1), h: hh, id: c.id || '' }); continue; }
        if (T_BLK.test(tag) && !hasBlockKid(c)) { flush(); var ph = inlHTML(c).trim(); if (plainOf(ph)) emit({ t: tag === 'LI' ? 'li' : 'p', h: ph }); continue; }
        if (T_INL.test(tag) && !hasBlockKid(c)) { (run = run || []).push(c); continue; }
        flush(); container(c, inCard);
      }
      flush();
    }
    function container(c, inCard) {
      if (!inCard && isCardEl(c)) {
        var saved = items; items = []; walkKids(c, true); var inner = items; items = saved;
        if (inner.length > 1) emit({ t: 'card', b: inner, id: c.id || '' }); else if (inner.length) emit(inner[0]);
      } else walkKids(c, inCard);
    }
    (function findTitle() {
      var hd = doc.querySelector('header,[role="banner"]'); if (!hd) return;
      var cs = hd.querySelectorAll('a.logo,a.brand,.logo,.brand,.site-title,.site-name,[class*="logo"],[class*="brand"],a[href="/"],a[href="index.html"],a[href="./"],a[href="#top"]');
      for (var i = 0; i < cs.length; i++) {
        var e = cs[i]; if (!visNode(e)) continue; var tx = (e.textContent || '').replace(/\s+/g, ' ').trim(); if (!tx || tx.length > 60 || /^(menu|close|open)$/i.test(tx)) continue;
        var h = inlHTML(e).trim(); if (!plainOf(h)) continue;
        if (e.tagName.toUpperCase() !== 'A' && !e.querySelector('a')) { /* plain text logo */ }
        titleEl = e; titlePlain = plainOf(h); items.push({ t: 'p', h: h }); count++; titleSeen = true; return;
      }
    })();
    walkKids(root0, false);
    var words = 0; (function cnt(a) { a.forEach(function (b) { if (b.t === 'card') cnt(b.b); else words += plainOf(b.h).split(/\s+/).filter(Boolean).length; }); })(items);
    return { items: items, words: words };
  }

  // ------------------------------------------------ 2. build the new page from those chunks
  function sectionsOf(items) {
    var secs = [], cur = { h: null, b: [] };
    items.forEach(function (it) {
      if (it.t === 'h' && it.l <= 3) { if (cur.h || cur.b.length) { secs.push(cur); cur = { h: it, b: [] }; } else cur.h = it; } else cur.b.push(it);
    });
    if (cur.h || cur.b.length) secs.push(cur); return secs;
  }
  function blocksHTML(arr, wrapCards) {
    var o = [], i = 0, loose = [];
    function flushLoose() { if (loose.length) { o.push('<div class="cd">' + loose.join('') + '</div>'); loose = []; } }
    while (i < arr.length) {
      var b = arr[i], s = '';
      if (b.t === 'li') { var lis = []; while (i < arr.length && arr[i].t === 'li') { lis.push('<li>' + arr[i].h + '</li>'); i++; } s = '<ul>' + lis.join('') + '</ul>'; }
      else if (b.t === 'card') { s = '<div class="cd">' + blocksHTML(b.b, false) + '</div>'; i++; if (wrapCards) { flushLoose(); o.push(s); } else o.push(s); continue; }
      else if (b.t === 'h') { var l = Math.min(6, Math.max(3, b.l + 1)); s = '<h' + l + '>' + b.h + '</h' + l + '>'; i++; }
      else { s = '<p>' + b.h + '</p>'; i++; }
      if (wrapCards) loose.push(s); else o.push(s);
    }
    if (wrapCards) flushLoose();
    return o.join('');
  }
  function buildPage(t, data) {
    var items = data.items, lay = t.lay, secs = sectionsOf(items), o = [];
    if (lay === 'proof') {
      var n = 0, chunks = [];
      (function flat(a) {
        var i = 0; while (i < a.length) {
          var b = a[i];
          if (b.t === 'li') { var ls = []; while (i < a.length && a[i].t === 'li') { ls.push('<li>' + a[i].h + '</li>'); i++; } chunks.push(['List', '<ul>' + ls.join('') + '</ul>', 'k-l']); continue; }
          if (b.t === 'card') { chunks.push(['Card', blocksHTML(b.b, false), 'k-c']); i++; continue; }
          if (b.t === 'h') chunks.push(['Heading ' + b.l, '<h' + b.l + '>' + b.h + '</h' + b.l + '>', 'k-h']); else chunks.push(['Paragraph', '<p>' + b.h + '</p>', 'k-p']);
          i++;
        }
      })(items);
      o.push('<div class="pbar"><b>Text only (proofread)</b> ' + chunks.length + ' chunks, ' + data.words + ' words, in reading order. These are the page\'s own words, nothing added.</div>');
      chunks.forEach(function (c) { n++; o.push('<article class="ck ' + c[2] + '"><div class="lb">' + n + ' · ' + c[0] + '</div><div class="tx">' + c[1] + '</div></article>'); });
      return o.join('');
    }
    if (lay === 'sidebar') {
      o.push('<nav class="toc" aria-label="On this page"><b>On this page</b><ul>');
      secs.forEach(function (sc, i) { if (sc.h) o.push('<li><a href="#s' + i + '" data-int="s' + i + '">' + sc.h.h + '</a></li>'); });
      o.push('</ul></nav><div class="main">');
    }
    secs.forEach(function (sc, i) {
      var hero = i === 0 && sc.h && sc.h.l === 1, id = ' id="s' + i + '"' + (sc.h && sc.h.id ? ' data-g="' + escH(sc.h.id) + '"' : '');
      var head = sc.h ? '<div class="hd"><h' + (hero ? 1 : 2) + '>' + sc.h.h + '</h' + (hero ? 1 : 2) + '></div>' : '';
      o.push('<section class="sec' + (hero ? ' hero' : '') + '"' + id + ' style="--i:' + Math.min(i, 12) + '">' + head + '<div class="bd">' + blocksHTML(sc.b, lay === 'cards') + '</div></section>');
    });
    if (lay === 'sidebar') o.push('</div>');
    return o.join('');
  }
  function hx(c, a) { return /^#[0-9a-f]{6}$/i.test(c) ? c + ('0' + Math.round(a * 255).toString(16)).slice(-2) : c; }
  function lumOf(c) { var m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(c); if (!m) return .5; return (.299 * parseInt(m[1], 16) + .587 * parseInt(m[2], 16) + .114 * parseInt(m[3], 16)) / 255; }
  function genCSS(t, n) {
    var o = [], lay = t.lay, big = lay === 'poster' || lay === 'deck', mw = t.mw !== 'none' ? t.mw : (lay === 'cards' ? '1180px' : lay === 'sidebar' ? '1200px' : '860px');
    var panel = hx(t.c, big ? .86 : .93), mono = lay === 'terminal' || t.ff === COUR || t.ff === MONO;
    o.push(':host{all:initial;display:block}*{box-sizing:border-box}');
    o.push('.wrap{position:absolute;left:0;top:0;right:0;bottom:0;overflow:hidden;background:' + (t.bi ? t.bi + ',' : '') + t.b + ';color:' + t.f + ';font-family:' + t.ff + ';font-size:' + t.fs + 'px;line-height:' + t.lh + ';letter-spacing:' + t.ls + ';-webkit-text-size-adjust:100%;cursor:inherit}');
    o.push('canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block;pointer-events:none}');
    o.push('.scr{position:absolute;left:0;top:0;right:0;bottom:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;padding:28px 14px 150px;' + (lay === 'deck' ? 'scroll-snap-type:y proximity;' : '') + '}');
    o.push('.pg{max-width:' + mw + ';margin:0 auto;position:relative}');
    o.push('h1,h2,h3,h4,h5,h6{margin:0 0 .5em;font-family:' + t.hf + ';color:' + t.h + ';letter-spacing:' + t.hs + ';text-transform:' + t.ht + ';text-align:' + t.ha + ';font-weight:' + t.hw + ';font-style:' + t.hst + ';line-height:1.15;overflow-wrap:anywhere}');
    var hz = t.hz * (lay === 'poster' ? 1.5 : 1); o.push('h1{font-size:' + (2.3 * hz).toFixed(2) + 'em}h2{font-size:' + (1.65 * hz).toFixed(2) + 'em}h3{font-size:' + (1.3 * t.hz).toFixed(2) + 'em}h4,h5,h6{font-size:' + (1.08 * Math.max(t.hz, .95)).toFixed(2) + 'em}');
    o.push('@media (max-width:600px){h1{font-size:' + (1.8 * hz).toFixed(2) + 'em}h2{font-size:' + (1.4 * hz).toFixed(2) + 'em}.scr{padding:20px 10px 150px}}');
    o.push('p,ul{margin:0 0 .9em;max-width:70ch}li{margin:0 0 .35em}ul{padding-left:1.2em}p:last-child,ul:last-child{margin-bottom:0}code{font-family:' + COUR + ';font-size:.92em}');
    o.push('a{color:' + t.l + ';text-decoration:' + t.lt + ';text-underline-offset:.18em;cursor:pointer;transition:color ' + t.sp + ',background-color ' + t.sp + ',text-shadow ' + t.sp + '}');
    var lh = { ul: 'text-decoration:underline;text-decoration-thickness:3px', bg: 'background:' + t.l + ';color:' + t.b + ';text-decoration:none', glow: 'text-shadow:0 0 .55em ' + t.l + ',0 0 1.1em ' + t.l, wide: 'letter-spacing:.06em', dash: 'text-decoration:underline dashed', none: '' }[t.lk];
    if (lh) o.push('a:hover,a:focus-visible{' + lh + '}'); o.push('a:focus-visible{outline:3px solid ' + t.l + ';outline-offset:2px}');
    o.push('::selection{background:' + t.l + ';color:' + t.b + '}');
    if (mono) o.push('.wrap{font-family:' + (t.ff === MONO ? MONO : COUR) + '}');
    // panels
    var boxed = '{background:' + panel + ';border:' + t.bw + 'px ' + t.bs + ' ' + t.cd + ';border-radius:' + t.r + 'px;box-shadow:' + t.sh + '}';
    if (lay === 'proof') {
      o.push('.pg{padding:0}.pbar{position:sticky;top:0;z-index:2;background:#fff8dc;border:1px solid #e6c85a;border-radius:6px;padding:8px 12px;margin:0 0 14px;font-size:.88em;color:#3b2f00}');
      o.push('.ck{display:grid;grid-template-columns:130px minmax(0,1fr);gap:12px;padding:10px 12px;margin:0 0 8px;background:' + t.c + ';border:1px solid ' + t.cd + ';border-left:5px solid ' + t.l + ';border-radius:6px}.ck.k-h{border-left-color:#7c3aed}.ck.k-c{border-left-color:#0f766e}.ck.k-l{border-left-color:#b45309}');
      o.push('.lb{font:700 11.5px/1.3 ' + SYS + ';color:#4b5563;text-transform:uppercase;letter-spacing:.05em}.tx{min-width:0}.tx>*{max-width:none}.tx h1,.tx h2,.tx h3,.tx h4,.tx h5,.tx h6{margin:0}.tx .cd{border:1px dashed ' + t.cd + ';border-radius:6px;padding:8px 10px;margin:0 0 6px;background:#fff}');
      o.push('@media (max-width:600px){.ck{grid-template-columns:1fr;gap:4px}}');
    } else {
      o.push('.sec{margin:0 0 ' + t.gp + 'px;position:relative}');
      o.push('.hd{margin:0 0 .7em}');
      if (lay === 'cards') {
        o.push('.sec .hd{display:inline-block;max-width:100%;padding:.35em .9em;margin:0 0 14px}.sec .hd' + boxed.replace('}', ';padding:.35em .9em}'));
        o.push('.sec .hd h1,.sec .hd h2{margin:0}.bd{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px;align-items:start}');
        o.push('.cd' + boxed.replace('}', ';padding:16px 18px;transition:transform ' + t.sp + ',box-shadow ' + t.sp + '}'));
        if (t.tl) { o.push('.cd:nth-child(odd){transform:rotate(' + (-t.tl) + 'deg)}.cd:nth-child(even){transform:rotate(' + (t.tl * .7).toFixed(2) + 'deg)}'); }
        o.push('.cd:hover{transform:translateY(-4px) rotate(0)}');
      } else {
        o.push('.sec' + boxed.replace('}', ';padding:' + (t.gp + 4) + 'px ' + (t.gp + 8) + 'px}'));
        o.push('.cd{border:1px dashed ' + t.cd + ';border-radius:' + Math.min(t.r, 14) + 'px;padding:12px 14px;margin:0 0 12px;background:' + hx(t.b, .35) + '}');
      }
      if (lay === 'magazine') {
        o.push('.bd{column-count:2;column-gap:40px;column-rule:1px solid ' + t.cd + '}.bd p,.bd ul{max-width:none;break-inside:avoid-column}.bd h3,.bd h4,.bd h5,.bd h6{column-span:all;margin-top:.6em}.bd>p:first-child::first-letter{float:left;font-family:' + t.hf + ';font-size:3.4em;line-height:.85;padding:.06em .1em 0 0;color:' + t.h + '}.bd .cd{break-inside:avoid-column}');
        o.push('@media (max-width:760px){.bd{column-count:1}}');
      }
      if (lay === 'poster') {
        o.push('.sec{min-height:62vh;display:flex;flex-direction:column;justify-content:center}.sec h2{font-size:clamp(2.2em,8vw,5.4em)}.sec h1{font-size:clamp(2.6em,10vw,7em)}.bd p,.bd ul{font-size:1.18em;max-width:38em}.sec:nth-child(even){text-align:right;align-items:flex-end}.sec:nth-child(even) .hd h2{text-align:right}');
      }
      if (lay === 'deck') {
        o.push('.sec{min-height:calc(100vh - 90px);display:flex;flex-direction:column;justify-content:center;scroll-snap-align:start}.sec h2{font-size:clamp(2em,6vw,4em)}.bd p,.bd ul{font-size:1.14em}');
      }
      if (lay === 'timeline') {
        o.push('.pg:before{content:"";position:absolute;left:50%;top:0;bottom:0;width:4px;margin-left:-2px;background:' + t.cd + ';border-radius:2px}.sec{width:calc(50% - 30px)}.sec:nth-child(odd){margin-right:auto}.sec:nth-child(even){margin-left:auto}');
        o.push('.sec:before{content:"";position:absolute;top:26px;width:18px;height:18px;border-radius:50%;background:' + t.l + ';border:3px solid ' + t.b + '}.sec:nth-child(odd):before{right:-39px}.sec:nth-child(even):before{left:-39px}');
        o.push('@media (max-width:700px){.pg:before{left:14px}.sec{width:auto;margin-left:38px!important;margin-right:0!important}.sec:before{left:-34px!important;right:auto!important}}');
      }
      if (lay === 'sidebar') {
        o.push('.pg{display:grid;grid-template-columns:230px minmax(0,1fr);gap:24px;align-items:start}.toc{position:sticky;top:12px;max-height:calc(100vh - 150px);overflow:auto;padding:14px 16px;font-size:.92em}.toc' + boxed.replace('}', '}'));
        o.push('.toc b{display:block;margin:0 0 8px;font-family:' + t.hf + ';color:' + t.h + '}.toc ul{list-style:none;padding:0;margin:0}.toc li{margin:0 0 6px}.main{min-width:0}');
        o.push('@media (max-width:820px){.pg{display:block}.toc{position:static;max-height:none;margin:0 0 16px}}');
      }
      if (lay === 'terminal') {
        o.push('.sec{padding:16px 18px}.hd h1:before,.hd h2:before{content:"# ";opacity:.65}.bd p:before{content:"> ";opacity:.55}.bd p{max-width:none;margin-bottom:.7em}');
      }
    }
    if (t.an !== 'none' && ANIMKF[t.an] && !rm() && lay !== 'proof') {
      var nm = 'hg-' + t.an + '-' + n; o.push('.sec,.cd{animation:' + nm + ' ' + t.ad + ' ease-out backwards}.sec{animation-delay:calc(var(--i,0) * 70ms)}@keyframes ' + nm + '{' + ANIMKF[t.an] + '}');
    }
    o.push('@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}');
    return o.join('\n');
  }

  // ------------------------------------------------ 3. the full-screen 3D backgrounds (canvas 2D with a real perspective projection)
  function rgbaOf(c, a) { var m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(c); return m ? 'rgba(' + parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + parseInt(m[3], 16) + ',' + a.toFixed(3) + ')' : 'rgba(128,128,128,' + a.toFixed(3) + ')'; }
  function rot3(p, ax, ay, az) {
    var x = p[0], y = p[1], z = p[2], c = Math.cos(ax), s = Math.sin(ax), y1 = y * c - z * s, z1 = y * s + z * c; c = Math.cos(ay); s = Math.sin(ay); var x2 = x * c + z1 * s, z2 = -x * s + z1 * c; c = Math.cos(az); s = Math.sin(az);
    return [x2 * c - y1 * s, x2 * s + y1 * c, z2];
  }
  function mkScene(kind, t, W, H) {
    var A = t.h, B = t.l, dark = lumOf(t.b) < .5, K = dark ? t.f : t.h, F = Math.min(W, H) * 1.05, cx0 = W / 2, cy0 = H / 2, i;
    function pr(x, y, z) { var k = F / Math.max(.05, z); return [cx0 + x * k, cy0 + y * k, k]; }
    if (kind === 'tunnel') {
      var M = 22, D = 26;
      return function (cx, tm) {
        var z0 = (tm * 5.5) % 1, zz; cx.lineWidth = 1.6;
        for (i = M; i >= 0; i--) {
          zz = (i + 1 - z0) * (D / M) + .3; var a = clamp(1 - zz / D, 0, 1), r = 3.2, rot = tm * .2 + zz * .12, sides = 7, pts = [];
          for (var k = 0; k < sides; k++) { var an = rot + k / sides * 6.283; pts.push(pr(Math.cos(an) * r, Math.sin(an) * r * .72, zz)); }
          cx.strokeStyle = rgbaOf((i + (tm * 5.5 | 0)) % 2 ? A : B, a * .8); cx.beginPath(); pts.forEach(function (q, j) { if (j) cx.lineTo(q[0], q[1]); else cx.moveTo(q[0], q[1]); }); cx.closePath(); cx.stroke();
          if (i % 2 === 0) { cx.strokeStyle = rgbaOf(K, a * .22); cx.beginPath(); pts.forEach(function (q) { cx.moveTo(cx0, cy0); cx.lineTo(q[0], q[1]); }); cx.stroke(); }
        }
      };
    }
    if (kind === 'cube') {
      var cubes = []; for (i = 0; i < 20; i++) cubes.push({ x: rnd(-6, 6), y: rnd(-3.6, 3.6), z: rnd(2, 14), s: rnd(.35, .9), rx: rnd(0, 6), ry: rnd(0, 6), vx: rnd(-.5, .5), vy: rnd(-.6, .6), c: i % 2 ? A : B });
      var V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]], E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
      return function (cx, tm, dt) {
        cubes.sort(function (a, b) { return b.z - a.z; });
        cubes.forEach(function (q) {
          q.z -= dt * .9; if (q.z < 1.6) { q.z = 14; q.x = rnd(-6, 6); q.y = rnd(-3.6, 3.6); } q.rx += q.vx * dt; q.ry += q.vy * dt;
          var pts = V.map(function (v) { var p = rot3([v[0] * q.s, v[1] * q.s, v[2] * q.s], q.rx, q.ry, 0); return pr(p[0] + q.x, p[1] + q.y, p[2] + q.z); }), al = clamp(1.2 - q.z / 14, .12, .85);
          cx.fillStyle = rgbaOf(q.c, al * .08); cx.strokeStyle = rgbaOf(q.c, al); cx.lineWidth = 1.4; cx.beginPath(); E.forEach(function (e) { cx.moveTo(pts[e[0]][0], pts[e[0]][1]); cx.lineTo(pts[e[1]][0], pts[e[1]][1]); }); cx.stroke();
          cx.beginPath(); [0, 1, 2, 3].forEach(function (k, j) { if (j) cx.lineTo(pts[k][0], pts[k][1]); else cx.moveTo(pts[k][0], pts[k][1]); }); cx.closePath(); cx.fill();
        });
      };
    }
    if (kind === 'terrain') {
      var hz = H * .56, peaks = []; for (i = 0; i <= 40; i++) peaks.push(Math.abs(Math.sin(i * 1.7) * .6 + Math.sin(i * .63) * .8) * H * .09);
      return function (cx, tm) {
        var sg = cx.createRadialGradient(cx0, hz, 4, cx0, hz, Math.min(W, H) * .34); sg.addColorStop(0, rgbaOf(A, .9)); sg.addColorStop(.5, rgbaOf(B, .3)); sg.addColorStop(1, rgbaOf(B, 0)); cx.fillStyle = sg; cx.beginPath(); cx.arc(cx0, hz, Math.min(W, H) * .34, Math.PI, 0); cx.fill();
        cx.fillStyle = rgbaOf(dark ? '#000000' : t.cd, .55); cx.beginPath(); cx.moveTo(0, hz); for (i = 0; i <= 40; i++) cx.lineTo(i / 40 * W, hz - peaks[i]); cx.lineTo(W, hz); cx.closePath(); cx.fill();
        cx.strokeStyle = rgbaOf(A, .75); cx.lineWidth = 1.3;
        var f = (tm * .6) % 1; for (i = 0; i < 18; i++) { var zz = (i + 1 - f), y = hz + (H - hz) * Math.pow(zz / 18, 2.2) * 1.0; if (y > H) continue; cx.globalAlpha = clamp(zz / 18 * 1.4, .12, 1); cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke(); }
        cx.globalAlpha = 1; for (i = -14; i <= 14; i++) { cx.strokeStyle = rgbaOf(B, .55); cx.beginPath(); cx.moveTo(cx0 + i * 14, hz); cx.lineTo(cx0 + i * W * .16, H); cx.stroke(); }
      };
    }
    if (kind === 'stars') {
      var st = []; for (i = 0; i < 380; i++) st.push({ x: rnd(-9, 9), y: rnd(-6, 6), z: rnd(.5, 12), c: i % 7 === 0 ? A : (i % 11 === 0 ? B : K) });
      return function (cx, tm, dt) {
        st.forEach(function (s) {
          var z1 = s.z; s.z -= dt * 2.4; if (s.z < .3) { s.z = 12; s.x = rnd(-9, 9); s.y = rnd(-6, 6); z1 = s.z + .02; }
          var p = pr(s.x, s.y, s.z), q = pr(s.x, s.y, z1 + .05), al = clamp(1.1 - s.z / 12, .08, .95);
          cx.strokeStyle = rgbaOf(s.c, al); cx.lineWidth = clamp(2.2 - s.z / 6, .6, 2.2); cx.beginPath(); cx.moveTo(q[0], q[1]); cx.lineTo(p[0], p[1]); cx.stroke();
        });
      };
    }
    if (kind === 'orbs') {
      var orbs = []; for (i = 0; i < 20; i++) orbs.push({ a: rnd(0, 6.283), r: rnd(2, 6.5), y: rnd(-3, 3), s: rnd(.4, 1.2), w: rnd(.08, .22) * (i % 2 ? 1 : -1), c: [A, B, t.cd][i % 3], z0: rnd(5, 10) });
      return function (cx, tm) {
        var list = orbs.map(function (o) { var an = o.a + tm * o.w; return { x: Math.cos(an) * o.r, y: o.y + Math.sin(tm * .4 + o.a) * .4, z: o.z0 + Math.sin(an) * o.r * .8, s: o.s, c: o.c }; }).sort(function (a, b) { return b.z - a.z; });
        list.forEach(function (o) { var p = pr(o.x, o.y, o.z), rad = o.s * p[2], al = clamp(1.3 - o.z / 16, .25, .85); var g = cx.createRadialGradient(p[0] - rad * .35, p[1] - rad * .35, rad * .08, p[0], p[1], rad); g.addColorStop(0, rgbaOf('#ffffff', al * .85)); g.addColorStop(.35, rgbaOf(o.c, al * .7)); g.addColorStop(1, rgbaOf(o.c, al * .12)); cx.fillStyle = g; cx.beginPath(); cx.arc(p[0], p[1], rad, 0, 6.283); cx.fill(); });
      };
    }
    if (kind === 'helix') {
      return function (cx, tm) {
        var N = 46; for (i = 0; i < N; i++) {
          var u = i / N, y = (u - .5) * 9, an = u * 12 + tm * .7, r = 2.1;
          [0, 3.1416].forEach(function (ph, k) { var p = rot3([Math.cos(an + ph) * r, y, Math.sin(an + ph) * r], 0, 0, .35), q = pr(p[0] + 2.4, p[1], p[2] + 7.5), al = clamp(1 - (p[2] + 2.2) / 6, .15, .9); cx.fillStyle = rgbaOf(k ? B : A, al); cx.beginPath(); cx.arc(q[0], q[1], Math.max(2, q[2] * .11), 0, 6.283); cx.fill(); });
          if (i % 3 === 0) { var p1 = rot3([Math.cos(an) * r, y, Math.sin(an) * r], 0, 0, .35), p2 = rot3([Math.cos(an + 3.1416) * r, y, Math.sin(an + 3.1416) * r], 0, 0, .35), a = pr(p1[0] + 2.4, p1[1], p1[2] + 7.5), b = pr(p2[0] + 2.4, p2[1], p2[2] + 7.5); cx.strokeStyle = rgbaOf(K, .3); cx.lineWidth = 1.4; cx.beginPath(); cx.moveTo(a[0], a[1]); cx.lineTo(b[0], b[1]); cx.stroke(); }
        }
      };
    }
    if (kind === 'waves') {
      var NX = 30, NZ = 22;
      return function (cx, tm) {
        for (var zi = NZ - 1; zi >= 0; zi--) {
          var z = 3 + zi * .75, row = [], k; for (k = 0; k <= NX; k++) { var x = (k / NX - .5) * 16, y = 1.6 + Math.sin(x * .55 + tm * 1.1 + zi * .35) * .45 + Math.cos(z * .7 - tm * .8) * .35, p = pr(x, y, z); row.push(p); }
          var al = clamp(1.05 - zi / NZ, .12, .85); cx.strokeStyle = rgbaOf(zi % 2 ? A : B, al); cx.lineWidth = 1.3; cx.beginPath(); row.forEach(function (p, j) { if (j) cx.lineTo(p[0], p[1]); else cx.moveTo(p[0], p[1]); }); cx.stroke();
        }
      };
    }
    if (kind === 'tens') {
      var nodes = []; for (i = 0; i < 6; i++) { var an = i * 1.0472 + .26, hh = i % 2 ? 1 : -1; nodes.push([Math.cos(an) * 2, hh * 1.5, Math.sin(an) * 2]); }
      var struts = [[0, 3], [1, 4], [2, 5]], cables = []; for (i = 0; i < 6; i++) { cables.push([i, (i + 1) % 6]); cables.push([i, (i + 2) % 6]); }
      return function (cx, tm) {
        [[.42, .45, 1.9], [.82, .2, 1.1], [.12, .8, .9]].forEach(function (sc, si) {
          var pts = nodes.map(function (n) { var p = rot3([n[0] * sc[2], n[1] * sc[2], n[2] * sc[2]], tm * .27 + si, tm * .38 + si * 2, .3); return pr(p[0] + (sc[0] - .5) * 12, p[1] + (sc[1] - .5) * 7, p[2] + 7.5); });
          cx.lineCap = 'round'; cx.strokeStyle = rgbaOf(B, .6); cx.lineWidth = 1.5; cx.beginPath(); cables.forEach(function (e) { cx.moveTo(pts[e[0]][0], pts[e[0]][1]); cx.lineTo(pts[e[1]][0], pts[e[1]][1]); }); cx.stroke();
          cx.strokeStyle = rgbaOf(A, .9); cx.lineWidth = 5; cx.beginPath(); struts.forEach(function (e) { cx.moveTo(pts[e[0]][0], pts[e[0]][1]); cx.lineTo(pts[e[1]][0], pts[e[1]][1]); }); cx.stroke();
          pts.forEach(function (p) { cx.fillStyle = rgbaOf(K, .85); cx.beginPath(); cx.arc(p[0], p[1], 4, 0, 6.283); cx.fill(); });
        });
      };
    }
    return null;
  }

  // ------------------------------------------------ v6.4 generative design engine
  // A design is ONE integer (the seed). A small seeded PRNG (mulberry32) picks one value from each axis: family (3D or Clean), layout, palette, type pairing,
  // card style, background, density, radius, accent usage. Every palette is checked (and, if needed, nudged) to WCAG AA before use. Nothing here changes the page's words.
  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function h2r(c) { var m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(c); return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [128, 128, 128]; }
  function r2h(r) { return '#' + r.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function mixc(a, b, k) { var x = h2r(a), y = h2r(b); return r2h([x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k]); }
  function relLum(c) { var r = h2r(c).map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r[0] + .7152 * r[1] + .0722 * r[2]; }
  function contrastOf(a, b) { var x = relLum(a), y = relLum(b); if (x < y) { var t = x; x = y; y = t; } return (x + .05) / (y + .05); }
  function minContrast(fg, bgs) { var m = 99; bgs.forEach(function (b) { m = Math.min(m, contrastOf(fg, b)); }); return m; }
  // nudge a foreground toward white or black (whichever fits the dark or light surfaces) until it clears the minimum ratio on every surface
  function fixFg(fg, bgs, min, dark) {
    if (minContrast(fg, bgs) >= min) return fg;
    for (var k = .04; k <= 1.001; k += .04) { var c = mixc(fg, dark ? '#ffffff' : '#000000', Math.min(1, k)); if (minContrast(c, bgs) >= min) return c; }
    return dark ? '#ffffff' : '#000000';
  }
  // [name, bg, surface1, surface2, text, muted, accent]
  var PAL_RAW = [
    ['Midnight Orange', '#0a0a0a', '#1c1c1c', '#2c2c2c', '#f5f5f5', '#c8c8c8', '#ff6a1a'], ['Deep Ocean', '#07121f', '#0f2238', '#173250', '#eaf3ff', '#b4c9e2', '#4cc2ff'],
    ['Forest Night', '#0b140e', '#142319', '#1f3427', '#eef7f0', '#b7cfbc', '#6fdc8c'], ['Plum Dusk', '#14091c', '#211030', '#31184a', '#f6ecff', '#cdb8e3', '#d28cff'],
    ['Ember', '#170c08', '#261510', '#3a2018', '#fff1e8', '#e0c1b0', '#ff8a4c'], ['Slate', '#0f1419', '#1a2129', '#26303b', '#ecf1f6', '#b9c4d0', '#7cb7ff'],
    ['Synthwave', '#0d0221', '#1b0a3d', '#2b1160', '#fdeaff', '#cdb4f0', '#ff4fd8'], ['Graphite Mint', '#101213', '#1b1f20', '#292f31', '#f1f5f4', '#bfcac7', '#3ee0b4'],
    ['Crimson Noir', '#120708', '#221012', '#331a1d', '#fff0f0', '#e0b9bc', '#ff5a6a'], ['Aurora', '#081a1c', '#0f2b2e', '#17403f', '#e8fffb', '#aed6d0', '#5af0d0'],
    ['Gold Ink', '#0c0b08', '#1b1911', '#2b2819', '#fbf5e2', '#d6cfb2', '#f2c14e'], ['Indigo Night', '#0b0d24', '#151a3d', '#1f2858', '#eef0ff', '#bcc3ee', '#8ea2ff'],
    ['Cocoa', '#140e0a', '#231810', '#342418', '#f8ede3', '#d3bfae', '#e8a063'], ['Teal Steel', '#0a1416', '#132226', '#1d343a', '#e9f7f8', '#b0cdd1', '#38d0e0'],
    ['Rose Charcoal', '#151012', '#251a1e', '#36262c', '#fdeef3', '#dcc0cb', '#ff7fa8'], ['Violet Ink', '#0e0b1a', '#1a1530', '#272046', '#f1edff', '#c4bbe6', '#a78bfa'],
    ['Paper', '#fbf8f1', '#ffffff', '#f0eadc', '#1d1b16', '#5a5547', '#b4470b'], ['Sky Family', '#f2f8ff', '#ffffff', '#e1eefb', '#14263a', '#4a6078', '#1565c0'],
    ['Meadow', '#f3faf2', '#ffffff', '#e0f0de', '#15281a', '#46634c', '#1b7a3a'], ['Peach', '#fff6ef', '#ffffff', '#ffe8d8', '#3a1d10', '#7a4a35', '#c2410c'],
    ['Lavender', '#f7f4ff', '#ffffff', '#e9e2fb', '#241a3d', '#5e4f85', '#6d3fd6'], ['Lemon Sun', '#fffdf0', '#ffffff', '#fbf3c8', '#2a2508', '#6b6330', '#8a6a00'],
    ['Mint Cream', '#f1fbf8', '#ffffff', '#d9f1ea', '#0f2b25', '#3f6a60', '#0a7a63'], ['Blush', '#fff5f7', '#ffffff', '#fde1e8', '#3a1420', '#7d4a5a', '#c21f56'],
    ['Stone', '#f5f5f4', '#ffffff', '#e7e5e4', '#1c1917', '#57534e', '#0f6e8f'], ['Cloud', '#eef2f7', '#ffffff', '#dde5ee', '#101826', '#475569', '#2457d6'],
    ['Sand', '#f6efe3', '#fffaf0', '#e9dcc4', '#2a2117', '#66573f', '#a14a0e'], ['Coral Reef', '#fff3f0', '#ffffff', '#ffdcd3', '#3b1510', '#7d4338', '#d13f26'],
    ['Sage', '#f1f4ee', '#fbfdf9', '#dfe6d8', '#1f2a1b', '#526148', '#3f7a2a'], ['Ice', '#f0fafe', '#ffffff', '#d6eef8', '#0d2a38', '#3d6275', '#0b79b3'],
    ['Mono Ink', '#ffffff', '#f4f4f5', '#e4e4e7', '#111114', '#52525b', '#111114'], ['Apricot Sky', '#fffaf3', '#ffffff', '#fdebd3', '#2b1b0c', '#6c5338', '#bf5b04']
  ];
  var PALS = PAL_RAW.map(function (r) {
    var dark = relLum(r[1]) < .2, bg = r[1], s1 = r[2], s2 = r[3], ac0 = r[6];
    var surfs = [bg, s1, s2, mixc(bg, ac0, .2), mixc(s1, ac0, .22)];   // plain, card, nested card, behind a dot or grid pattern, hero gradient end
    var tx = fixFg(r[4], surfs, 7, dark), mu = fixFg(r[5], surfs, 4.5, dark), ac = fixFg(ac0, surfs, 4.5, dark);
    var onAc = contrastOf('#000000', ac) >= contrastOf('#ffffff', ac) ? '#000000' : '#ffffff';
    return { n: r[0], dark: dark, bg: bg, s1: s1, s2: s2, tx: tx, mu: mu, ac: ac, onAc: onAc, adj: tx !== r[4].toLowerCase() || mu !== r[5].toLowerCase() || ac !== r[6].toLowerCase(), surfs: surfs };
  });
  var SYSF = 'system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
  var FONTS = [
    ['Clean sans', SYSF, SYSF, 700, 'none', '0'], ['Georgia classic', 'Georgia,"Times New Roman",serif', SYSF, 700, 'none', '0'], ['All Georgia', 'Georgia,"Times New Roman",serif', 'Georgia,"Times New Roman",serif', 700, 'none', '0'],
    ['Palatino book', '"Palatino Linotype",Palatino,"Book Antiqua",serif', '"Palatino Linotype",Palatino,"Book Antiqua",serif', 700, 'none', '0'], ['Trebuchet friendly', '"Trebuchet MS","Lucida Grande",Verdana,sans-serif', 'Verdana,"DejaVu Sans",sans-serif', 700, 'none', '0'],
    ['Heavy impact', 'Impact,Haettenschweiler,"Arial Narrow Bold",sans-serif', SYSF, 400, 'uppercase', '.02em'], ['Typewriter', '"Courier New",Courier,monospace', '"Courier New",Courier,monospace', 700, 'none', '0'],
    ['Rounded', 'ui-rounded,"SF Pro Rounded","Hiragino Maru Gothic ProN","Arial Rounded MT Bold",' + SYSF, 'ui-rounded,"SF Pro Rounded","Hiragino Maru Gothic ProN",' + SYSF, 800, 'none', '0'],
    ['Charter serif', 'Charter,"Bitstream Charter","Iowan Old Style","Sitka Text",Cambria,Georgia,serif', 'Charter,"Bitstream Charter","Iowan Old Style","Sitka Text",Cambria,Georgia,serif', 700, 'none', '0'],
    ['Mono and sans', 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace', SYSF, 700, 'none', '0'], ['Humanist', 'Optima,Candara,"Gill Sans","Segoe UI",sans-serif', 'Candara,"Gill Sans","Segoe UI",sans-serif', 700, 'none', '0'],
    ['Didone contrast', 'Didot,"Bodoni MT","Playfair Display",Georgia,serif', SYSF, 700, 'none', '0'], ['Wide caps', '"Arial Black","Helvetica Neue",Arial,sans-serif', SYSF, 900, 'uppercase', '.04em'],
    ['Narrow modern', '"Avenir Next Condensed","Arial Narrow","Roboto Condensed",' + SYSF, SYSF, 800, 'none', '0']
  ].map(function (f) { return { n: f[0], h: f[1], b: f[2], hw: f[3], ht: f[4], hs: f[5] }; });
  var LAYS = ['grid', 'reading', 'magazine', 'bento', 'hero', 'timeline', 'split', 'stacked', 'sidebar'];
  var LAYNAME = { grid: 'Card grid', reading: 'Reading column', magazine: 'Magazine', bento: 'Bento', hero: 'Hero and cards', timeline: 'Timeline', split: 'Split screen', stacked: 'Stacked panels', sidebar: 'Sidebar' };
  var CARDS = ['flat', 'outline', 'elevated', 'glass', 'soft', 'sharp'];
  var BG3D = ['particles', 'waves', 'stars', 'orbs', 'terrain'], BGCLEAN = ['solid', 'gradient', 'paper', 'dots', 'grid'];
  var DENS = { airy: { gap: 28, pad: 26, fs: 17, lh: 1.75 }, regular: { gap: 18, pad: 18, fs: 16, lh: 1.6 }, compact: { gap: 12, pad: 12, fs: 15, lh: 1.5 } };
  var DENKEYS = ['airy', 'regular', 'compact'], RADII = [0, 6, 12, 18, 26], ACCS = ['link', 'bar', 'fill'];
  function famOfSeed(seed) { return mulberry32(seed >>> 0)() < .5 ? '3D' : 'Clean'; }
  var GENCACHE = {};
  function genTheme(seed) {
    seed = seed >>> 0; if (GENCACHE[seed]) return GENCACHE[seed];
    var R = mulberry32(seed), fam = R() < .5 ? '3D' : 'Clean', pick = function (n) { return Math.floor(R() * n); };
    var wantDark = fam === '3D' ? R() < .82 : R() < .34, pool = PALS.filter(function (p) { return p.dark === wantDark; }), pal = pool[pick(pool.length)];
    var lay = LAYS[pick(LAYS.length)], font = FONTS[pick(FONTS.length)], card = CARDS[pick(CARDS.length)], bg = (fam === '3D' ? BG3D : BGCLEAN)[pick(5)];
    var den = DENKEYS[pick(3)], rad = RADII[pick(RADII.length)], acu = ACCS[pick(3)];
    if (card === 'glass' && bg === 'solid') card = 'soft';   // taste rule: glass needs something behind it
    var t = { id: 'g:' + seed, gen: true, seed: seed, fam: fam, lay: lay, bg: bg, pal: pal, font: font, card: card, den: den, rad: rad, acu: acu, gi: -2, i: 0, name: pal.n + ', ' + LAYNAME[lay] };
    GENCACHE[seed] = t; return t;
  }
  function seedIn(fam) { for (var i = 0; i < 80; i++) { var s = 1 + Math.floor(Math.random() * 99999999); if (fam === 'All' || famOfSeed(s) === fam) return s; } return 1 + Math.floor(Math.random() * 99999999); }
  function genCSS2(t, n) {
    var P = t.pal, F = t.font, Dn = DENS[t.den], lay = t.lay, anim = t.fam === '3D', dark = P.dark, o = [], r = t.rad, gap = Dn.gap, pad = Dn.pad;
    if (t.card === 'soft') r = Math.max(r, 22); if (t.card === 'sharp') r = 0;
    var line = mixc(P.bg, P.tx, .22), line2 = mixc(P.bg, P.tx, .42), shd = dark ? '0,0,0,.55' : '20,24,40,.16', ink = dark ? '255,255,255' : '0,0,0';
    var A = anim ? (t.card === 'glass' ? .86 : .93) : (t.card === 'glass' ? .8 : 1);   // taste rule: cards in front of a moving background are never see-through enough to hurt the text
    function surf(fill) {
      switch (t.card) {
        case 'outline': return 'background:' + rgbaOf(P.bg, anim ? .92 : 1) + ';border:2px solid ' + line2 + ';border-radius:' + r + 'px';
        case 'elevated': return 'background:' + rgbaOf(fill, A) + ';border:1px solid ' + line + ';border-radius:' + r + 'px;box-shadow:0 12px 30px rgba(' + shd + '),0 2px 6px rgba(' + shd + ')';
        case 'glass': return 'background:' + rgbaOf(fill, A) + ';border:1px solid rgba(' + ink + ',.16);border-radius:' + r + 'px;-webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2)';
        case 'soft': return 'background:' + rgbaOf(fill, A) + ';border:0;border-radius:' + r + 'px;box-shadow:0 16px 46px rgba(' + shd + ')';
        case 'sharp': return 'background:' + rgbaOf(fill, A) + ';border:2px solid ' + P.tx + ';border-radius:0;box-shadow:5px 5px 0 ' + P.ac;
        default: return 'background:' + rgbaOf(fill, A) + ';border:1px solid transparent;border-radius:' + r + 'px';
      }
    }
    var bgcss, grain = encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 " + (dark ? 1 : 0) + " 0 0 0 0 " + (dark ? 1 : 0) + " 0 0 0 0 " + (dark ? 1 : 0) + " 0 0 0 .16 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>");
    if (anim) bgcss = 'radial-gradient(ellipse at 50% 0%,' + mixc(P.bg, P.ac, .16) + ',' + P.bg + ' 72%),' + P.bg;
    else if (t.bg === 'gradient') bgcss = 'linear-gradient(145deg,' + P.bg + ',' + mixc(P.bg, P.ac, .14) + '),' + P.bg;
    else if (t.bg === 'paper') bgcss = 'url("data:image/svg+xml,' + grain + '"),' + P.bg;
    else if (t.bg === 'dots') bgcss = 'radial-gradient(circle at 1px 1px,' + rgbaOf(P.ac, .22) + ' 1.4px,transparent 1.7px) 0 0/22px 22px,' + P.bg;
    else if (t.bg === 'grid') bgcss = 'linear-gradient(' + rgbaOf(P.ac, .1) + ' 1px,transparent 1px) 0 0/32px 32px,linear-gradient(90deg,' + rgbaOf(P.ac, .1) + ' 1px,transparent 1px) 0 0/32px 32px,' + P.bg;
    else bgcss = P.bg;
    var mw = { reading: '740px', magazine: '1100px', bento: '1180px', hero: '1120px', timeline: '1080px', split: '1240px', stacked: '980px', sidebar: '1180px', grid: '1180px' }[lay];
    o.push(':host{all:initial;display:block}*{box-sizing:border-box}');
    o.push('.wrap{position:absolute;left:0;top:0;right:0;bottom:0;overflow:hidden;background:' + bgcss + ';color:' + P.tx + ';font-family:' + F.b + ';font-size:' + Dn.fs + 'px;line-height:' + Dn.lh + ';-webkit-text-size-adjust:100%;cursor:inherit}');
    o.push('canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block;pointer-events:none}');
    o.push('.scr{position:absolute;left:0;top:0;right:0;bottom:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;padding:' + (pad + 10) + 'px 14px 150px}');
    o.push('.pg{max-width:' + mw + ';margin:0 auto;position:relative;min-width:0}.pg *{min-width:0}');
    o.push('h1,h2,h3,h4,h5,h6{margin:0 0 .5em;font-family:' + F.h + ';color:' + P.tx + ';letter-spacing:' + F.hs + ';text-transform:' + F.ht + ';font-weight:' + F.hw + ';line-height:1.18;overflow-wrap:anywhere}');
    o.push('h1{font-size:2.3em}h2{font-size:1.65em}h3{font-size:1.3em}h4,h5,h6{font-size:1.08em}@media (max-width:600px){h1{font-size:1.8em}h2{font-size:1.4em}.scr{padding:' + Math.max(10, pad - 4) + 'px 10px 150px}}');
    o.push('p,ul{margin:0 0 .9em;max-width:70ch;overflow-wrap:anywhere}li{margin:0 0 .35em}ul{padding-left:1.2em}p:last-child,ul:last-child{margin-bottom:0}code,pre{font-family:"Courier New",Courier,monospace;font-size:.92em;max-width:100%;overflow-wrap:anywhere}');
    o.push('a{color:' + P.ac + ';text-decoration:underline;text-underline-offset:.18em;cursor:pointer}a:hover{text-decoration-thickness:3px}a:focus-visible{outline:3px solid ' + P.ac + ';outline-offset:2px}::selection{background:' + P.ac + ';color:' + P.onAc + '}');
    o.push('.sec{margin:0 0 ' + (gap + 8) + 'px;position:relative}.hd{margin:0 0 .7em}.hd h1,.hd h2{margin:0}.bd{min-width:0}');
    var inner = 'background:' + P.s2 + ';border-radius:' + Math.round(r * .7) + 'px;border:1px solid ' + line + ';padding:' + Math.round(pad * .7) + 'px ' + pad + 'px;margin:0 0 10px';
    var cdTop = t.acu === 'bar' ? ';border-top:4px solid ' + P.ac : '';
    var primaryCd = '.cd{' + surf(P.s1) + ';padding:' + pad + 'px ' + (pad + 2) + 'px' + cdTop + ';transition:transform .25s}.cd:hover{transform:translateY(-3px)}';
    var chip = t.acu === 'fill' ? '.hd{display:inline-block;max-width:100%;background:' + P.ac + ';padding:.3em .85em;border-radius:' + Math.max(4, r) + 'px}.hd h1,.hd h2{color:' + P.onAc + '}' :
      (anim ? '.hd{display:inline-block;max-width:100%;padding:.35em .9em;' + surf(P.s1) + '}' : '');
    var bar = t.acu === 'bar' && t.acu !== 'fill' ? '.hd:after{content:"";display:block;width:56px;height:4px;border-radius:2px;background:' + P.ac + ';margin-top:.35em}' : '';
    var secPanel = '.sec{' + surf(P.s1) + ';padding:' + (pad + 4) + 'px ' + (pad + 8) + 'px' + (t.acu === 'bar' ? ';border-top:4px solid ' + P.ac : '') + '}.cd{' + inner + '}';
    if (lay === 'grid') {
      o.push(chip + bar + '.bd{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,250px),1fr));gap:' + gap + 'px;align-items:start}' + primaryCd);
    } else if (lay === 'reading') {
      o.push(secPanel + '.sec{margin-bottom:' + gap + 'px}' + bar + '.cd{padding:' + Math.round(pad * .6) + 'px ' + pad + 'px}.bd p,.bd ul{max-width:none}' + (t.acu === 'fill' ? chip : ''));
    } else if (lay === 'magazine') {
      o.push(secPanel + bar + (t.acu === 'fill' ? chip : '') + '.bd{column-count:2;column-gap:38px;column-rule:1px solid ' + line + '}.bd p,.bd ul{max-width:none}.cd{break-inside:avoid-column;background:none;border:0;border-bottom:1px solid ' + line + ';border-radius:0;padding:0 0 .6em;margin:0 0 .8em}.bd>.cd:first-child>p:first-child:first-letter{float:left;font-family:' + F.h + ';font-size:3.3em;line-height:.85;padding:.06em .1em 0 0;color:' + P.ac + '}@media (max-width:760px){.bd{column-count:1}}');
    } else if (lay === 'bento') {
      o.push(chip + bar + '.bd{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));grid-auto-flow:dense;gap:' + gap + 'px;align-items:stretch}' + primaryCd + '.cd{grid-column:span 2}.cd:nth-child(6n+1){grid-column:span 4}.cd:nth-child(6n){grid-column:span 6}.cd:only-child{grid-column:1/-1}@media (max-width:760px){.bd{grid-template-columns:minmax(0,1fr)}.cd,.cd:nth-child(6n+1),.cd:nth-child(6n){grid-column:auto}}');
    } else if (lay === 'hero') {
      o.push(chip + bar + '.sec.hero{' + surf(P.s1).replace(/background:[^;]+/, 'background:linear-gradient(135deg,' + rgbaOf(P.s1, A) + ',' + rgbaOf(mixc(P.s1, P.ac, .22), A) + ')') + ';padding:' + pad * 2 + 'px ' + (pad + 6) + 'px;text-align:center}.sec.hero .hd{display:block;background:none;border:0;box-shadow:none;padding:0;backdrop-filter:none}.sec.hero .hd h1{font-size:clamp(2em,7vw,3.3em);color:' + P.tx + '}.sec.hero .hd:after{margin-left:auto;margin-right:auto}.sec.hero .bd{display:block}.sec.hero p,.sec.hero ul{margin-left:auto;margin-right:auto;text-align:left}.sec.hero .cd{background:none;border:0;box-shadow:none;padding:0;backdrop-filter:none;transform:none}');
      o.push('.sec:not(.hero) .bd{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,250px),1fr));gap:' + gap + 'px;align-items:start}' + primaryCd);
    } else if (lay === 'timeline') {
      o.push(secPanel + bar + (t.acu === 'fill' ? chip : '') + '.pg:before{content:"";position:absolute;left:50%;top:0;bottom:0;width:4px;margin-left:-2px;background:' + line2 + ';border-radius:2px}.sec{width:calc(50% - 30px)}.sec:nth-child(odd){margin-right:auto}.sec:nth-child(even){margin-left:auto}');
      o.push('.sec:before{content:"";position:absolute;top:26px;width:18px;height:18px;border-radius:50%;background:' + P.ac + ';border:3px solid ' + P.bg + '}.sec:nth-child(odd):before{right:-39px}.sec:nth-child(even):before{left:-39px}');
      o.push('@media (max-width:700px){.pg:before{left:14px}.sec{width:auto;margin-left:38px!important;margin-right:0!important}.sec:before{left:-34px!important;right:auto!important}}');
    } else if (lay === 'split') {
      o.push(chip + bar + '.pg{display:grid;grid-template-columns:minmax(220px,34%) minmax(0,1fr);gap:' + gap * 1.5 + 'px;align-items:start}.side{position:sticky;top:6px;max-height:calc(100vh - 170px);overflow:auto;' + surf(P.s1).replace(/background:[^;]+/, 'background:linear-gradient(160deg,' + rgbaOf(P.s2, A) + ',' + rgbaOf(mixc(P.s2, P.ac, .24), A) + ')') + ';padding:' + pad * 1.4 + 'px}.side h1{font-size:2em;margin:0 0 .6em}.side b{display:block;margin:0 0 6px;color:' + P.mu + '}.side ul{list-style:none;padding:0;margin:0}.side li{margin:0 0 7px}.main{min-width:0}.bd{display:grid;gap:' + gap + 'px}' + primaryCd + '@media (max-width:820px){.pg{display:block}.side{position:static;max-height:none;margin:0 0 ' + gap + 'px}}');
    } else if (lay === 'stacked') {
      o.push(bar + (t.acu === 'fill' ? chip : '') + '.sec{' + surf(P.s1) + ';padding:' + pad * 1.5 + 'px ' + (pad + 10) + 'px;margin-bottom:' + Math.round(gap * .6) + 'px;border-radius:' + (anim ? r : Math.min(r, 14)) + 'px}.sec:nth-child(even){' + surf(P.s2).replace(/background:[^;]+/, 'background:' + rgbaOf(P.s2, A)) + ';padding:' + pad * 1.5 + 'px ' + (pad + 10) + 'px;margin-bottom:' + Math.round(gap * .6) + 'px}.cd{background:' + rgbaOf(P.bg, .5) + ';border:1px solid ' + line + ';border-radius:' + Math.round(r * .6) + 'px;padding:' + Math.round(pad * .6) + 'px ' + pad + 'px;margin:0 0 10px}.bd p,.bd ul{max-width:none}');
    } else {   // sidebar
      o.push(secPanel + bar + (t.acu === 'fill' ? chip : '') + '.pg{display:grid;grid-template-columns:230px minmax(0,1fr);gap:' + gap + 'px;align-items:start}.side{position:sticky;top:6px;max-height:calc(100vh - 170px);overflow:auto;' + surf(P.s1) + ';padding:14px 16px;font-size:.92em}.side b{display:block;margin:0 0 8px;color:' + P.mu + '}.side ul{list-style:none;padding:0;margin:0}.side li{margin:0 0 6px}.main{min-width:0}@media (max-width:820px){.pg{display:block}.side{position:static;max-height:none;margin:0 0 ' + gap + 'px}}');
    }
    if (!rm()) { var nm = 'hg2-' + n; o.push('.sec{animation:' + nm + ' .6s ease-out backwards;animation-delay:calc(var(--i,0) * 60ms)}@keyframes ' + nm + '{0%{opacity:0;transform:translateY(16px)}}'); }
    o.push('@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}');
    return o.join('\n');
  }
  function buildPage2(t, data) {
    var secs = sectionsOf(data.items), o = [], lay = t.lay, side = lay === 'split' || lay === 'sidebar', hero0 = secs.length && secs[0].h && secs[0].h.l === 1;
    if (side) {
      o.push('<aside class="side">' + (lay === 'split' && hero0 ? '<h1>' + secs[0].h.h + '</h1>' : '') + '<nav aria-label="On this page"><b>On this page</b><ul>');
      secs.forEach(function (sc, i) { if (sc.h && !(lay === 'split' && i === 0 && hero0)) o.push('<li><a href="#s' + i + '" data-int="s' + i + '">' + sc.h.h + '</a></li>'); });
      o.push('</ul></nav></aside><div class="main">');
    }
    secs.forEach(function (sc, i) {
      var hero = i === 0 && sc.h && sc.h.l === 1, id = ' id="s' + i + '"' + (sc.h && sc.h.id ? ' data-g="' + escH(sc.h.id) + '"' : ''), skip = lay === 'split' && hero;
      var head = sc.h && !skip ? '<div class="hd"><h' + (hero ? 1 : 2) + '>' + sc.h.h + '</h' + (hero ? 1 : 2) + '></div>' : '';
      var body = blocksHTML(sc.b, true);
      if (skip && !body) return;
      o.push('<section class="sec' + (hero ? ' hero' : '') + '"' + id + ' style="--i:' + Math.min(i, 12) + '">' + head + (body ? '<div class="bd">' + body + '</div>' : '') + '</section>');
    });
    if (side) o.push('</div>');
    return o.join('');
  }
  // the animated backgrounds: small canvas 2D scenes with a real perspective projection. Drawn behind opaque or translucent cards, about 30 frames a second, off under reduced motion.
  function mkScene2(kind, t, W, H) {
    var P = t.pal, AC = P.ac, TX = P.tx, MIX = mixc(P.ac, P.tx, .45), F = Math.min(W, H) * 1.15, cx0 = W / 2, cy0 = H * .46, Rn = mulberry32((t.seed ^ 0x9e3779b9) >>> 0);
    function rn(a, b) { return a + Rn() * (b - a); }
    function pr(x, y, z) { var k = F / Math.max(.15, z); return [cx0 + x * k, cy0 + y * k, k]; }
    var boost = P.dark ? 1 : .8, i, n;
    if (kind === 'particles') {
      n = Math.round(clamp(W * H / 10000, 38, 80)); var pts = []; for (i = 0; i < n; i++) pts.push({ x: rn(-5, 5), y: rn(-4, 4), z: rn(3, 9), vx: rn(-.12, .12), vy: rn(-.1, .1), s: rn(.7, 1.7) });
      return function (cx, tm, dt) {
        var cs = Math.cos(tm * .07), sn = Math.sin(tm * .07), q = [];
        pts.forEach(function (p) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.x > 5) p.x = -5; if (p.x < -5) p.x = 5; if (p.y > 4) p.y = -4; if (p.y < -4) p.y = 4; var zz = p.z - 6, x2 = p.x * cs + zz * sn, z2 = -p.x * sn + zz * cs + 6; q.push(pr(x2, p.y, z2).concat(p.s)); });
        cx.lineWidth = 1; var m = Math.min(W, H) * .22, m2 = m * m, a, b, dx_, dy_, d2;
        for (a = 0; a < q.length; a++) for (b = a + 1; b < q.length; b++) { dx_ = q[a][0] - q[b][0]; dy_ = q[a][1] - q[b][1]; d2 = dx_ * dx_ + dy_ * dy_; if (d2 < m2) { cx.strokeStyle = rgbaOf(AC, (1 - d2 / m2) * .4 * boost); cx.beginPath(); cx.moveTo(q[a][0], q[a][1]); cx.lineTo(q[b][0], q[b][1]); cx.stroke(); } }
        q.forEach(function (p) { cx.fillStyle = rgbaOf(MIX, .8 * boost); cx.beginPath(); cx.arc(p[0], p[1], Math.max(1, p[2] * .018 * p[3]), 0, 6.283); cx.fill(); });
      };
    }
    if (kind === 'waves') {
      var GX = 26, GZ = 15;
      return function (cx, tm) {
        var z, x, rows = [];
        for (z = 0; z < GZ; z++) { var zz = 1.6 + z * .62, row = []; for (x = 0; x < GX; x++) { var xx = -8 + x * 16 / (GX - 1); row.push(pr(xx, 1.35 - (Math.sin(xx * .8 + tm * .9 + z * .3) * .34 + Math.sin(zz * .9 - tm * .7) * .3 + Math.sin(xx * .35 + zz * .5 + tm * .4) * .25), zz)); } rows.push(row); }
        cx.lineWidth = 1.2;
        for (z = GZ - 1; z >= 0; z--) { cx.strokeStyle = rgbaOf(z % 2 ? AC : MIX, (1 - z / GZ) * .65 * boost + .06); cx.beginPath(); rows[z].forEach(function (p, j) { if (j) cx.lineTo(p[0], p[1]); else cx.moveTo(p[0], p[1]); }); cx.stroke(); }
        cx.strokeStyle = rgbaOf(AC, .22 * boost); cx.beginPath(); for (x = 0; x < GX; x += 2) for (z = 0; z < GZ - 1; z++) { cx.moveTo(rows[z][x][0], rows[z][x][1]); cx.lineTo(rows[z + 1][x][0], rows[z + 1][x][1]); } cx.stroke();
      };
    }
    if (kind === 'stars') {
      n = Math.round(clamp(W * H / 2600, 90, 190)); var st = []; for (i = 0; i < n; i++) st.push({ x: rn(-9, 9), y: rn(-9, 9), z: rn(.4, 12) });
      return function (cx, tm, dt) {
        cx.lineCap = 'round';
        st.forEach(function (s, ix) { s.z -= dt * 1.7; if (s.z < .4) { s.z = 12; s.x = rn(-9, 9); s.y = rn(-9, 9); } var a = pr(s.x, s.y, s.z), b = pr(s.x, s.y, s.z + .22), al = clamp(1.15 - s.z / 12, .12, 1) * boost; cx.strokeStyle = rgbaOf(ix % 5 === 0 ? AC : TX, al * .8); cx.lineWidth = Math.max(.8, a[2] * .012); cx.beginPath(); cx.moveTo(b[0], b[1]); cx.lineTo(a[0], a[1]); cx.stroke(); });
      };
    }
    if (kind === 'orbs') {
      n = 13; var ob = []; for (i = 0; i < n; i++) ob.push({ x: rn(-4, 4), y: rn(-3, 3), z: rn(3, 9), a: rn(0, 6.28), w: rn(.08, .22) * (Rn() < .5 ? -1 : 1), r: rn(.5, 1.5), c: i % 3 === 0 ? TX : (i % 3 === 1 ? AC : MIX) });
      return function (cx, tm) {
        ob.slice().sort(function (a, b) { return b.z - a.z; }).forEach(function (o_) { var an = o_.a + tm * o_.w, p = pr(o_.x + Math.cos(an) * .9, o_.y + Math.sin(an * 1.3) * .7, o_.z), rad = o_.r * p[2] * .55, al = clamp(1.25 - o_.z / 11, .18, .8) * (P.dark ? .5 : .38); var g = cx.createRadialGradient(p[0] - rad * .3, p[1] - rad * .3, rad * .05, p[0], p[1], rad); g.addColorStop(0, rgbaOf(o_.c, al)); g.addColorStop(1, rgbaOf(o_.c, 0)); cx.fillStyle = g; cx.beginPath(); cx.arc(p[0], p[1], rad, 0, 6.283); cx.fill(); });
      };
    }
    // low-poly terrain
    var TX_ = 13, TZ = 9, seedo = rn(0, 20), shades = []; for (i = 0; i < 17; i++) shades.push(rgbaOf(mixc(P.bg, AC, .06 + i / 16 * .3), .92));
    function hgt(x, z, tm) { return Math.sin(x * .7 + seedo) * .42 + Math.sin(z * .8 + tm * .5) * .36 + Math.sin(x * .3 - z * .5 + tm * .3) * .3; }
    return function (cx, tm) {
      var g = [], zi, xi, p0;
      for (zi = 0; zi < TZ; zi++) { var r_ = [], zz = 1.5 + zi * .8; for (xi = 0; xi < TX_; xi++) { var xx = -7.5 + xi * 15 / (TX_ - 1), hh = hgt(xx, zz, tm); r_.push(pr(xx, 1.4 - hh * .7, zz).concat(hh)); } g.push(r_); }
      cx.lineWidth = 1; cx.lineJoin = 'round';
      for (zi = TZ - 2; zi >= 0; zi--) for (xi = 0; xi < TX_ - 1; xi++) {
        var a = g[zi][xi], b = g[zi][xi + 1], c = g[zi + 1][xi], d = g[zi + 1][xi + 1];
        [[a, b, c], [b, d, c]].forEach(function (tr, k) { var sh = clamp(.5 + (tr[0][3] + tr[1][3] + tr[2][3]) / 3 * .9 + (k ? .06 : -.06), 0, 1); cx.fillStyle = shades[Math.round(sh * 16)]; cx.strokeStyle = rgbaOf(AC, .22 * boost + .05); cx.beginPath(); cx.moveTo(tr[0][0], tr[0][1]); cx.lineTo(tr[1][0], tr[1][1]); cx.lineTo(tr[2][0], tr[2][1]); cx.closePath(); cx.fill(); cx.stroke(); });
      }
    };
  }

  // ------------------------------------------------ 4. the overlay itself
  var gen = null, genN = 0, dxNote = '';
  function genRoot() { return gen && gen.on ? gen.sr : null; }
  function genStop() { if (gen) { cancelAnimationFrame(gen.raf); gen.raf = 0; } }
  function genSize() {
    if (!gen) return; var dpr = Math.min(1.5, window.devicePixelRatio || 1), W = innerWidth, H = innerHeight; if (W * H * dpr * dpr > 3.2e6) dpr = Math.max(1, Math.sqrt(3.2e6 / (W * H))); gen.W = W; gen.H = H; gen.cv.width = Math.round(W * dpr); gen.cv.height = Math.round(H * dpr); gen.dpr = dpr;
    gen.scene = gen.t && gen.t.gen ? (rm() ? null : mkScene2(gen.kind, gen.t, W, H)) : mkScene(gen.kind, gen.t, W, H);
  }
  function genFrame(now) {
    if (!gen || !gen.on) return; gen.raf = 0;
    if (doc.hidden) { gen.raf = requestAnimationFrame(genFrame); gen.last = now; return; }
    if (gen.t && gen.t.gen && gen.last && now - gen.last < 30) { gen.raf = requestAnimationFrame(genFrame); return; }   // about 30 frames a second
    var dt = Math.min(.05, (now - (gen.last || now)) / 1000); gen.last = now; gen.tm += dt;
    var cx = gen.cx; cx.setTransform(gen.dpr, 0, 0, gen.dpr, 0, 0); cx.clearRect(0, 0, gen.W, gen.H); cx.globalCompositeOperation = 'source-over'; cx.globalAlpha = 1; cx.lineCap = 'round';
    if (gen.scene) { var t0 = performance.now(); try { gen.scene(cx, gen.tm, dt); } catch (e) { gen.scene = null; } var ms = performance.now() - t0; gen.ms = (gen.ms || ms) * .9 + ms * .1; gen.frames = (gen.frames || 0) + 1; }
    if (!rm() && gen.scene) gen.raf = requestAnimationFrame(genFrame);
  }
  function genShow(t) {
    var data = extractPage();
    if (data.words < 12) { dxNote = 'This page has too little text to rebuild, so the original stays.'; genHide(); return false; }
    dxNote = '';
    var sy = gen && gen.on ? gen.scr.scrollTop : 0;
    if (!gen) {
      var host = el('div', 'hmr-gen'); host.setAttribute('data-hmr-gen', ''); host.setAttribute('role', 'document'); host.setAttribute('aria-label', 'Redesigned page');
      var sr = host.attachShadow ? host.attachShadow({ mode: 'open' }) : null; if (!sr) return false;
      var st = doc.createElement('style'), wrap = el('div', 'wrap'), cv = doc.createElement('canvas'), scr = el('div', 'scr'), pg = el('main', 'pg'); cv.setAttribute('aria-hidden', 'true');
      wrap.appendChild(cv); scr.appendChild(pg); wrap.appendChild(scr); sr.appendChild(st); sr.appendChild(wrap);
      gen = { host: host, sr: sr, st: st, wrap: wrap, cv: cv, cx: cv.getContext('2d'), scr: scr, pg: pg, on: false, raf: 0, tm: 0, kind: '', t: null, dpr: 1, W: 0, H: 0, scene: null };
      sr.addEventListener('click', function (e) {
        var a = e.target && e.target.closest ? e.target.closest('a[data-int]') : null; if (!a) return;
        e.preventDefault(); var id = a.getAttribute('data-int'), tg = sr.getElementById(id) || sr.querySelector('[data-g="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
        if (tg) { try { tg.scrollIntoView({ block: 'start', behavior: rm() ? 'auto' : 'smooth' }); } catch (x) { tg.scrollIntoView(); } }
      });
      window.addEventListener('resize', function () { if (gen && gen.on) { genSize(); if (rm()) genFrame(performance.now()); } });
    }
    gen.host.style.cssText = 'position:fixed!important;left:0!important;top:0!important;right:0!important;bottom:var(--hmr-dsinset,0px)!important;width:auto!important;height:auto!important;z-index:99970!important;display:block!important;margin:0!important;padding:0!important;border:0!important;transform:none!important;overflow:hidden!important';
    gen.t = t; gen.st.textContent = t.gen ? genCSS2(t, ++genN) : genCSS(t, ++genN); gen.pg.innerHTML = t.gen ? buildPage2(t, data) : buildPage(t, data);
    gen.scr.style.scrollSnapType = t.lay === 'deck' ? 'y proximity' : '';
    if (!gen.host.parentNode) doc.body.appendChild(gen.host);
    root.classList.add('hmr-gen-on'); var was = gen.on; gen.on = true;
    if (gen.kind !== t.bg || !was) { gen.kind = t.bg; }
    genSize(); gen.cv.style.display = gen.scene ? 'block' : 'none';
    gen.scr.scrollTop = sy;   // keep the reading position and the running 3D scene when the design changes
    if (!gen.raf) { gen.last = performance.now(); gen.raf = requestAnimationFrame(genFrame); }
    return true;
  }
  function genHide() {
    if (!gen) { root.classList.remove('hmr-gen-on'); return; }
    genStop(); gen.on = false; if (gen.host.parentNode) gen.host.parentNode.removeChild(gen.host); root.classList.remove('hmr-gen-on');
  }
  function themeById(id) { if (!id) return null; if (/^g:\d{1,10}$/.test(id)) { var sd = +id.slice(2); return sd > 0 && sd < 4294967296 ? genTheme(sd) : null; } return THEME_BY_ID[id] || null; }
  function applyTheme() {
    var t = themeById(dx.th);
    if (!t) { dxNote = ''; genHide(); root.removeAttribute('data-hmr-theme'); return; }
    if (!doc.body) return;
    if (genShow(t)) root.setAttribute('data-hmr-theme', t.id); else root.removeAttribute('data-hmr-theme');
  }
  styleEl.textContent += 'html.hmr-gen-on,html.hmr-gen-on body{overflow:hidden!important}';
  // (the starting design is chosen further down, once the saved view and the site default are defined)

  // pointers and trails
  (function () {
    var cb = cursorURL(), big = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M5 3v28l7-6 5 11 5-2-5-11h10z" fill="#fff" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/></svg>';
    var dot = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="6" fill="#d4202a" stroke="#fff" stroke-width="2.5"/></svg>';
    var star = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><path d="M15 2l3.8 8.6 9.2.9-7 6.2 2.1 9.1L15 21.8 6.9 26.8 9 17.7 2 11.5l9.2-.9z" fill="#ffd60a" stroke="#111" stroke-width="2" stroke-linejoin="round"/></svg>';
    function cur(svg, x, y, fb) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '") ' + x + ' ' + y + ',' + fb; }
    styleEl.textContent += 'html.hmr-p-bullseye,html.hmr-p-bullseye body{cursor:' + cb + '}html.hmr-p-large,html.hmr-p-large body{cursor:' + cur(big, 5, 3, 'auto') + '}html.hmr-p-crosshair,html.hmr-p-crosshair body{cursor:crosshair}html.hmr-p-dot,html.hmr-p-dot body{cursor:' + cur(dot, 10, 10, 'crosshair') + '}html.hmr-p-star,html.hmr-p-star body{cursor:' + cur(star, 15, 15, 'crosshair') + '}html.hmr-p-hand,html.hmr-p-hand body{cursor:pointer}';
  })();
  styleEl.textContent += 'html[class] .hmr-dx h4,html[class] .hmr-dx h5{color:#111!important;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif!important}';
  function applyPointer() { POINTERS.forEach(function (p) { root.classList.toggle('hmr-p-' + p[0], dx.pointer === p[0]); }); }
  applyPointer();
  var spT = 0, spN = 0;
  doc.addEventListener('pointermove', function (ev) {
    if (rm() || ev.pointerType === 'touch') return;
    var now = performance.now(), tr = TRAILS[dx.pointer];
    if (tr && now - spT > 38 && spN < 40) {
      spT = now; var s = el('span', 'hmr-sp', tr[(Math.random() * tr.length) | 0]); s.setAttribute('aria-hidden', 'true');
      s.style.left = (ev.clientX + rnd(-6, 6)) + 'px'; s.style.top = (ev.clientY + rnd(-6, 6)) + 'px'; s.style.setProperty('--dx', rnd(-18, 18) + 'px'); spN++;
      s.addEventListener('animationend', function () { s.remove(); spN--; }); setTimeout(function () { if (s.parentNode) { s.remove(); spN--; } }, 1200); doc.body.appendChild(s);
    }
  }, { passive: true });
  var mkN = 0;
  function mkGroup(title, emoji, items, cur, pick) {
    var g = el('div'), id = 'hmr-dx-sel' + (++mkN); var lb = el('label', '', emoji + ' ' + title); lb.setAttribute('for', id); lb.style.cssText = 'display:block;margin:10px 0 3px;font-weight:800;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:#555'; g.appendChild(lb);
    var sel = el('select'); sel.id = id; sel.setAttribute('data-dx', title);
    items.forEach(function (it) { var o = el('option', '', it[1] + ' ' + it[2]); o.value = it[0]; sel.appendChild(o); }); g.appendChild(sel);
    sel.addEventListener('change', function () { pick(sel.value); sync(); });
    function sync() { sel.value = cur(); }
    sync(); g.sync = sync; return g;
  }
  function siteDesignState() {
    var o = {};
    try { [root, doc.body].forEach(function (n, i) { var ds2 = n.dataset || {}; Object.keys(ds2).forEach(function (k) { if (!/^hmr/.test(k)) o[(i ? 'body.' : 'html.') + k] = String(ds2[k]).slice(0, 60); }); }); } catch (e) { }
    try { var cl = (root.className + ' ' + doc.body.className).split(/\s+/).filter(function (c) { return c && !/^hmr-/.test(c); }).slice(0, 12); if (cl.length) o.classes = cl.join(' '); } catch (e) { }
    try { var ks = []; for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (/design|theme|look|style/i.test(k) && !/^hmr-(dx|draft|hl)/.test(k)) ks.push(k + '=' + String(localStorage.getItem(k)).slice(0, 40)); } if (ks.length) o.stored = ks.slice(0, 6).join('; '); } catch (e) { }
    return o;
  }
  var dxUIs = [], dxHist = [], dxFwd = [], lastLook = '';
  var FAMKEY = 'hmr-dx-fam', VIEWKEY = 'hmr-view-v1:' + location.hostname;
  var dxFam = ['3D', 'Clean', 'All'].indexOf(lsGet(FAMKEY)) >= 0 ? lsGet(FAMKEY) : 'All';
  // The "HMR default" look per site: 'native' is the page's own CSS (what the site's builders designed). A site can instead name a seed. data-hmr-default="native|<seed>" on the script tag wins.
  var SITE_DEFAULTS = {
    'claudebomb.com': 'native', 'hmrfamily.life': 'native', 'universemodel.ai': 'native', 'hmrfascia.life': 'native', 'hmrfunsies.fun': 'native', 'funsies.fun': 'native', 'hmrlanguage.life': 'native',
    'hmrmath.life': 'native', 'hmrphysics.life': 'native', 'hmrscience.life': 'native', 'hmruniverse.life': 'native', 'personaldash.life': 'native', 'reactionapp.life': 'native',
    'workdash.life': 'native', 'chronomath.ai': 'native', 'endgame.life': 'native', 'alltx.life': 'native'
  };
  function defaultId() { var d = String(D.hmrDefault || SITE_DEFAULTS[location.hostname.replace(/^www\./, '')] || 'native'); if (/^\d{1,10}$/.test(d)) return 'g:' + d; if (/^g:\d{1,10}$/.test(d)) return d; return ''; }
  function myView() { var v = jget(VIEWKEY, null); return v && /^\d{1,10}$/.test(String(v.seed)) ? v : null; }
  function allThemes() { var a = []; GENRES.forEach(function (g) { g.t.forEach(function (t) { a.push(t); }); }); return a; }   // the old fixed list, kept only for HMRDock.themes() and old saved ids
  // every change of design goes through here so Back and Forward can walk the history
  function goTheme(id, noHist, keepFwd) {
    id = id || ''; if ((dx.th || '') === id) return;
    if (!keepFwd) dxFwd.length = 0;
    if (!noHist) { dxHist.push(dx.th || ''); if (dxHist.length > 80) dxHist.shift(); }
    if (dx.th && dx.th !== PROOF.id) lastLook = dx.th;
    dx.th = id; dxSave(); applyTheme(); dxUIs.forEach(function (u) { u(); });
  }
  function bootId() {
    try { var m = /(?:^|[?&])design=(\d{1,10})(?:&|#|$)/.exec(location.search || ''); if (m && +m[1] > 0 && +m[1] < 4294967296) return 'g:' + (+m[1]); } catch (e) { }
    var v = myView(); return v ? 'g:' + v.seed : defaultId();
  }
  // v6.4 Design panel: family chips (3D, Clean, All), Back, Shuffle, Forward, a hate / neutral / love slider per seed, Text only, Send ratings, Save as my view, share link, Switch to our look.
  function buildDx(xBtn) {
    var d = el('section', 'hmr-dx dxs'); d.setAttribute('aria-label', 'Design');
    var fam = el('div', 'dxs-fam'); fam.setAttribute('role', 'group'); fam.setAttribute('aria-label', 'Design family'); var famB = {};
    [['3D', '3D', 'A moving 3D background with cards in front'], ['Clean', 'Clean', 'A still background: friendly, clean, family oriented'], ['All', 'All', 'Both kinds']].forEach(function (f) {
      var b = el('button', 'dxs-chip', f[1]); b.type = 'button'; b.title = f[2]; b.setAttribute('aria-pressed', 'false'); fam.appendChild(b); famB[f[0]] = b;
      b.addEventListener('click', function () { dxFam = f[0]; lsSet(FAMKEY, dxFam); var t = themeById(dx.th); if (!(t && t.gen && (dxFam === 'All' || t.fam === dxFam))) goTheme('g:' + seedIn(dxFam)); else dxUIs.forEach(function (u) { u(); }); });
    });
    d.appendChild(fam);
    var nav = el('div', 'dxs-nav');
    var bb = el('button', 'dxs-b dxs-back'); bb.type = 'button'; bb.innerHTML = '<span aria-hidden="true">‹</span> Back'; bb.setAttribute('aria-label', 'Back to the design before');
    var sh = el('button', 'dxs-b dxs-shuf'); sh.type = 'button'; sh.innerHTML = '<span aria-hidden="true">🎲</span> Shuffle'; sh.setAttribute('aria-label', 'Shuffle: show this page in a new design');
    var fw = el('button', 'dxs-b dxs-fwd'); fw.type = 'button'; fw.innerHTML = 'Forward <span aria-hidden="true">›</span>'; fw.setAttribute('aria-label', 'Forward to the next design');
    nav.appendChild(bb); nav.appendChild(sh); nav.appendChild(fw); if (xBtn) { xBtn.classList.add('dxs-x'); nav.appendChild(xBtn); } d.appendChild(nav);
    var info = el('p', 'st dxs-info'); info.setAttribute('role', 'status'); d.appendChild(info);
    var curT = null, rs = rateSlider('Rate this design, hate to love', function (v) { if (!curT) return; rt[curT.id] = v; rtSave(); dxUIs.forEach(function (u) { u(); }); });
    d.appendChild(rs.el);
    var row = el('div', 'dxs-row');
    var tx = el('button', 'dxs-s dxs-text'); tx.type = 'button'; tx.textContent = 'Text only'; tx.setAttribute('aria-pressed', 'false');
    var sb = el('button', 'dxs-s dxs-send'); sb.type = 'button'; sb.textContent = 'Send ratings'; sb.setAttribute('aria-expanded', 'false');
    row.appendChild(tx); row.appendChild(sb); d.appendChild(row);
    var row2 = el('div', 'dxs-row');
    var sv = el('button', 'dxs-s dxs-save'); sv.type = 'button'; sv.textContent = 'Save as my view';
    var lk = el('button', 'dxs-s dxs-link'); lk.type = 'button'; lk.textContent = 'Copy share link';
    row2.appendChild(sv); row2.appendChild(lk); d.appendChild(row2);
    var row3 = el('div', 'dxs-row dxs-row3');
    var hd = el('button', 'dxs-s dxs-def'); hd.type = 'button'; hd.textContent = 'Switch to our look';
    var cl = el('button', 'dxs-s dxs-clear'); cl.type = 'button'; cl.textContent = 'Clear my saved view';
    row3.appendChild(hd); row3.appendChild(cl); d.appendChild(row3);
    var subw = el('div', 'dxs-sub'); subw.hidden = true;
    subw.appendChild(submitPair({
      text: function () { return ''; }, empty: 'Design ratings (no notes)', kind: 'design',
      details: function () {
        var t = themeById(dx.th), ratings = {}; for (var k in rt) if (rt.hasOwnProperty(k)) ratings[k] = rt[k];
        return { genre: t ? (t.gen ? 'Generated ' + t.fam : (t.gi >= 0 ? GENRES[t.gi].n : 'Text only')) : 'Our look', theme: t ? t.name : 'Our look', themeId: t ? t.id : '', seed: t && t.gen ? t.seed : 0, ratingScale: '-5 hate, 0 neutral, 5 love', ratings: ratings, page: location.href };
      }
    }).el);
    d.appendChild(subw);
    function sync() {
      var t = themeById(dx.th); curT = t; var def = defaultId(), saved = myView(), atDef = (dx.th || '') === def;
      Object.keys(famB).forEach(function (k) { famB[k].setAttribute('aria-pressed', dxFam === k ? 'true' : 'false'); });
      bb.disabled = !dxHist.length && atDef;
      tx.setAttribute('aria-pressed', t && t.lay === 'proof' ? 'true' : 'false');
      rs.input.disabled = !t; rs.set(t && rt[t.id] != null ? rt[t.id] : 0);
      var lb = rs.el.querySelector('label'); if (lb) lb.textContent = t ? 'Rate this design, hate to love' : 'Rate this design, hate to love (shuffle first)';
      info.textContent = dxNote || (t ? (t.gen ? 'Design ' + t.seed + ': ' + t.fam + ', ' + t.name : 'Text only: the page\'s words in reading order') : 'Our look: the page as we built it' + (saved ? '' : ''));
      sv.disabled = !(t && t.gen); lk.disabled = !(t && t.gen);
      var isSaved = !!(t && t.gen && saved && +saved.seed === t.seed); sv.textContent = isSaved ? 'Saved as my view' : 'Save as my view'; sv.setAttribute('aria-pressed', isSaved ? 'true' : 'false');
      hd.hidden = atDef; cl.hidden = !saved; row3.hidden = atDef && !saved;
    }
    dxUIs.push(sync);
    bb.addEventListener('click', function () {
      if (dxHist.length) { dxFwd.push(dx.th || ''); goTheme(dxHist.pop(), true, true); }
      else if ((dx.th || '') !== defaultId()) { dxFwd.push(dx.th || ''); goTheme(defaultId(), true, true); }
    });
    fw.addEventListener('click', function () { if (dxFwd.length) { dxHist.push(dx.th || ''); goTheme(dxFwd.pop(), true, true); } else goTheme('g:' + seedIn(dxFam)); });
    sh.addEventListener('click', function () { var id, k = 0; do { id = 'g:' + seedIn(dxFam); } while (id === dx.th && ++k < 5); goTheme(id); });
    tx.addEventListener('click', function () { goTheme(dx.th === PROOF.id ? (lastLook || defaultId()) : PROOF.id); });
    sb.addEventListener('click', function () { subw.hidden = !subw.hidden; sb.setAttribute('aria-expanded', subw.hidden ? 'false' : 'true'); dsInset(); });
    sv.addEventListener('click', function () { var t = themeById(dx.th); if (!(t && t.gen)) return; if (jset(VIEWKEY, { seed: t.seed, fam: t.fam, at: Date.now() })) toast('Saved. This is now your view on this site.'); else toast('This browser would not let us save. The share link still works.'); dxUIs.forEach(function (u) { u(); }); });
    lk.addEventListener('click', function () { var t = themeById(dx.th); if (!(t && t.gen)) return; var u = location.href.split('#')[0]; try { var uo = new URL(location.href); uo.searchParams.set('design', String(t.seed)); uo.hash = ''; u = uo.toString(); } catch (e) { } copyText(u).then(function (ok) { toast(ok ? 'Link copied. Anyone who opens it sees this design.' : 'Could not copy. The address is ' + u, null, 5000); }); });
    hd.addEventListener('click', function () { goTheme(defaultId()); });
    cl.addEventListener('click', function () { ldel(VIEWKEY); toast('Saved view cleared.'); dxUIs.forEach(function (u) { u(); }); });
    sync();
    return d;
  }

  // The dock's own Design button and panel: the only design feature on every site (a page's own are hidden by the HIDESEL rule below)
  var own = null;
  function dsInset() {
    if (root.classList.contains('hmr-studio-on') && (!own || own.panel.hidden)) return;   // v6.5: the HMR dash studio owns the inset while it is open
    var h = 0; try { if (own && !own.panel.hidden) { var r = own.panel.getBoundingClientRect(); h = Math.max(0, Math.ceil(innerHeight - r.top + 6)); } } catch (e) { }
    root.style.setProperty('--hmr-dsinset', h + 'px');
  }
  function dsOutside(e) {
    if (!own || own.panel.hidden) return;
    var path = e.composedPath ? e.composedPath() : [e.target];
    if (path.indexOf(own.panel) >= 0 || path.indexOf(own.btn) >= 0) return;
    closeOwn(false);
  }
  function closeOwn(back) {
    if (!own || own.panel.hidden) return; own.panel.hidden = true; own.btn.setAttribute('aria-expanded', 'false');
    doc.removeEventListener('pointerdown', dsOutside, true); try { if (own.ro) own.ro.disconnect(); } catch (e) { } window.removeEventListener('resize', dsInset); dsInset();
    if (back) { try { own.btn.focus({ preventScroll: true }); } catch (e) { own.btn.focus(); } }
  }
  function openOwn() {
    if (!own) return; closeOthers('ds'); closeSpeak(false, false); own.panel.hidden = false; own.btn.setAttribute('aria-expanded', 'true');
    dsInset(); doc.addEventListener('pointerdown', dsOutside, true); window.addEventListener('resize', dsInset);
    try { if (window.ResizeObserver) { own.ro = new ResizeObserver(dsInset); own.ro.observe(own.panel); } } catch (e) { }
  }
  function buildOwn() {
    var b = el('button', 'hmr-dsbtn'); b.type = 'button'; b.id = 'hmr-design'; b.title = 'Design'; b.setAttribute('aria-label', 'Design'); b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'hmr-dsp');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2s0-2 1.5-2h2a3 3 0 0 0 3-3c0-6-4-11-8-11z"/><circle cx="8" cy="11" r=".8" fill="currentColor"/><circle cx="11" cy="7.5" r=".8" fill="currentColor"/><circle cx="15.5" cy="8.5" r=".8" fill="currentColor"/></svg><span>Design</span>';
    var p = el('div', 'hmr-dsp'); p.id = 'hmr-dsp'; p.hidden = true; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Design');
    var x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close Design'); x.addEventListener('click', function () { closeOwn(true); });
    p.appendChild(buildDx(x));
    b.addEventListener('click', function () { if (own.panel.hidden) openOwn(); else closeOwn(true); });
    doc.body.appendChild(p); own = { btn: b, panel: p };   // v6.5: the Design button is not on the bar; design lives in the HMR dash studio (Layouts)
  }
  function ensureDx() {
    if (!doc.body) return;
    if (!own) { try { buildOwn(); } catch (e) { try { console.warn('hmr-dock design', e); } catch (e2) { } } }
    else { if (own.panel.parentNode !== doc.body) doc.body.appendChild(own.panel); }
  }
  function watchDx() { ensureDx(); }
  dx.th = bootId();
  if (dx.th) {
    if (doc.body) applyTheme(); else doc.addEventListener('DOMContentLoaded', applyTheme);
    window.addEventListener('load', function () { setTimeout(function () { if (dx.th) applyTheme(); }, 800); });   // pages that fill in their text late are read again
  }
  styleEl.textContent += (HIDESEL ? HIDESEL + '{display:none!important}' : '') +
    'html .hmr-dsp{left:50%!important;right:auto!important;transform:translateX(-50%)!important;bottom:max(8px,env(safe-area-inset-bottom))!important;width:min(560px,calc(100vw - 16px))!important;max-width:calc(100vw - 16px)!important;max-height:min(55vh,420px)!important;padding:8px!important;z-index:99996!important;overflow:auto!important;border-radius:14px}' +
    '.hmr-dx.dxs{margin:0;padding:0;border:0;background:transparent;font-size:13px}' +
    '.dxs .dxs-nav{display:grid;grid-template-columns:1fr 1.6fr 1.15fr 40px;gap:6px;align-items:stretch}' +
    '.dxs .dxs-b{min-height:46px;border:2px solid #111;border-radius:12px;background:#f4f7fc;color:#111;font-size:14px;font-weight:800;cursor:pointer;padding:0 4px;touch-action:manipulation;margin:0;white-space:nowrap;-webkit-tap-highlight-color:transparent}' +
    '.dxs .dxs-b[disabled]{opacity:.4;cursor:default}' +
    '.dxs .dxs-shuf{background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;border-color:#fff;box-shadow:0 0 0 2px #111;font-size:17px}' +
    '.dxs .dxs-x{min-width:0;min-height:46px;width:40px;padding:0;border:2px solid #111;border-radius:12px;background:#fff;color:#111;font-size:22px;line-height:1;cursor:pointer;margin:0}' +
    '.dxs .hmr-rate{margin:6px 0 2px}.dxs .hmr-rate label{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}.dxs .hmr-rate .rv{display:none}' +
    '.dxs .hmr-rate input[type=range]{height:26px}.dxs .hmr-rate .rl{margin-top:-2px}' +
    '.dxs .dxs-row{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px}.dxs .dxs-row[hidden],.dxs .dxs-row button[hidden]{display:none}.dxs .dxs-row3{display:flex;flex-wrap:wrap}.dxs .dxs-row3 .dxs-s{flex:1 1 140px}' +
    '.dxs .dxs-fam{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin:0 0 6px}.dxs .dxs-chip{min-height:34px;border:2px solid #111;border-radius:999px;background:#fff;color:#111;font-size:13px;font-weight:800;cursor:pointer;padding:0 6px;touch-action:manipulation;margin:0}.dxs .dxs-chip[aria-pressed="true"]{background:#111;color:#fff}' +
    '.dxs .dxs-info{margin:4px 0 0;font-size:12px;line-height:1.3;color:#333;text-align:left;overflow-wrap:anywhere}.dxs .dxs-s[disabled]{opacity:.45;cursor:default}' +
    '.dxs .dxs-s{min-height:36px;border:1px solid #9aa4b5;border-radius:10px;background:#fff;color:#111;font-size:13px;font-weight:700;cursor:pointer;padding:0 6px;touch-action:manipulation;margin:0}' +
    '.dxs .dxs-s[aria-pressed="true"]{background:#1d4ed8;color:#fff;border-color:#1d4ed8}' +
    '.dxs .dxs-note{margin:4px 0 0}.dxs .dxs-sub{margin-top:4px}.dxs .dxs-sub[hidden]{display:none}.dxs .hmr-sub{margin:2px 0 0}.dxs .hmr-sub .hs-two{grid-template-columns:1fr 1fr}' +
    '.dxs .hmr-sub .hs-btn{min-height:40px;font-size:13px}' +
    // Speak here card: small, floating, above the dock, never a sheet
    'html .hmr-spk{left:50%!important;right:auto!important;transform:translateX(-50%)!important;bottom:calc(' + BASE + ' + var(--hmr-c) + 10px)!important;width:min(460px,calc(100vw - 16px))!important;max-width:calc(100vw - 16px)!important;max-height:max(30vh,200px)!important;padding:8px 10px!important;border-radius:14px;overflow:auto;z-index:99996}' +
    'html .hmr-spk.help{max-height:min(60vh,420px)!important}' +
    'html .hmr-spk{max-height:min(66vh,480px)!important}' +
    '.hmr-spk .hd .hs-heart{flex:none;font-size:16px}.hmr-spk .hd .hs-ttl{flex:0 1 auto;white-space:normal;line-height:1.2;font-size:14px;font-weight:800}' +
    '.hmr-spk .hs-row{display:flex;align-items:center;gap:8px;margin:0 0 4px;font-size:12px}' +
    '.hmr-spk .hs-why2{position:relative;margin:2px 0 6px;padding:6px 8px;border-radius:8px;background:#f1f5ff;font-size:12.5px;line-height:1.35;color:#222}.hmr-spk .hs-why2 p{margin:0 0 4px}.hmr-spk .hs-wx{min-height:32px;padding:0 8px;border:1px solid #9aa4b5;border-radius:999px;background:#fff;color:#222;font-size:12px;font-weight:700;cursor:pointer;touch-action:manipulation}' +
    '.hmr-spk .hs-live .hmr-tw textarea{padding:6px 46px 6px 8px!important}.hmr-spk .hs-live .hmr-tmic{right:8px;bottom:8px;width:36px;height:36px}' +
    '.hmr-spk .hs-tip{margin:4px 0 0;font-size:11.5px;line-height:1.3;color:#444}' +
    '.hmr-spk .hs-fc{margin:2px 0 4px;font-size:12.5px;line-height:1.35;color:#444}' +
    '.hmr-spk .hs-pick{margin:6px 0;padding:8px 10px;border:2px dashed #f59e0b;border-radius:10px;background:#fff8e1}.hmr-spk .hs-pick p{margin:0 0 6px;font-size:13px;font-weight:700;color:#2a2508}.hmr-spk .hs-pick .hs-btn{width:100%}' +
    '.hmr-spk .hs-spot{margin:4px 0;font-size:12.5px;font-weight:600;color:#1d4ed8}' +
    '.hmr-spk .hs-cap{margin:6px 0;padding:10px;border:2px solid #dc2626;border-radius:10px;background:#fff1f1}.hmr-spk .hs-cap .hc-t{margin:0 0 4px;font-weight:800;color:#991b1b}.hmr-spk .hs-cap .hc-p{margin:0 0 8px;font-size:12.5px;line-height:1.35;color:#333}.hmr-spk .hs-cap .hc-r{display:flex;flex-wrap:wrap;gap:6px}.hmr-spk .hs-cap .hs-btn{flex:1 1 140px}' +
    '.hmr-spnote{position:fixed;top:0;left:0;right:0;z-index:2147483600;padding:8px 14px;background:#7f1d1d;color:#fff;font:600 13px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;text-align:center;box-shadow:0 2px 10px rgba(0,0,0,.35);pointer-events:none}.hmr-spnote[hidden]{display:none!important}' +
    'html.hmr-picking,html.hmr-picking *{cursor:crosshair}' +
    '.hmr-spk .hs-long{margin:2px 0 4px;font-size:13px;font-weight:700}.hmr-spk .hs-go{margin:2px 0 4px;font-size:13px;font-weight:700;color:#b91c1c}.hmr-spk .hs-go[hidden]{display:none}' +
    '.hmr-spk .hd.hs-grab{cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}.hmr-spk.hs-moved .hd.hs-grab:active{cursor:grabbing}' +
    '.hmr-spk .hs-dhint{margin:0 0 4px;padding:4px 8px;border-radius:8px;background:#fff7d6;border:1px solid #f0c94a;font-size:12px;color:#222}' +
    '.hmr-spk .hd{display:flex;align-items:center;gap:8px;margin:0 0 4px;white-space:nowrap;font-size:13px;font-weight:700}.hmr-spk .hs-sp{flex:1}' +
    '.hmr-spk .hs-dot{flex:none;width:12px;height:12px;border-radius:50%;background:#9ca3af}.hmr-spk .hs-dot.on{background:#dc2626;animation:hmr-spkpulse 1.1s ease-in-out infinite}' +
    '@keyframes hmr-spkpulse{50%{opacity:.35}}@media (prefers-reduced-motion:reduce){.hmr-spk .hs-dot.on{animation:none}}' +
    '.hmr-spk .hs-tm{font-variant-numeric:tabular-nums;font-weight:800;font-size:14px}.hmr-spk .hs-state{font-weight:600;color:#444}.hmr-spk .hs-state.rec{color:#dc2626}.hmr-spk .hs-state.pz{color:#6b7280}' +
    '.hmr-spk .hs-ctl{flex:none;min-height:36px;padding:0 12px;border:2px solid #111;border-radius:999px;background:#fff;color:#111;font-size:13px;font-weight:800;cursor:pointer;touch-action:manipulation}' +
    '.hmr-spk .x{min-width:36px;min-height:36px}' +
    '.hmr-spk .hs-live textarea{display:block;width:100%;min-height:54px;max-height:84px;margin:0;resize:none;font-size:16px;line-height:1.3;padding:6px 8px}' +
    '.hmr-spk .st{text-align:left;font-size:12px;min-height:0;margin:3px 0 0}.hmr-spk .st:empty{display:none}' +
    '.hmr-spk .hmr-sub{margin:4px 0 0}.hmr-spk .hmr-sub .hs-two{grid-template-columns:1fr 1fr;gap:6px;margin:4px 0 0}.hmr-spk .hmr-sub .hs-btn{min-height:40px;font-size:13px}' +
    '.hmr-spk .hs-free{margin:4px 0 0;font-size:11px;color:#555;text-align:center}@media (max-width:600px){.hmr-spk .hs-free{display:none}}' +
    '.hmr-spk .hs-help{font-size:13px;line-height:1.35}.hmr-spk .hs-help p{margin:0 0 4px}.hmr-spk .hs-help .hh{font-weight:800;font-size:14px}.hmr-spk .hs-help ol{margin:0 0 6px;padding-left:20px}.hmr-spk .hs-help .hn{font-size:12px;color:#444}' +
    '.hmr-spk .hs-try{min-height:42px;padding:0 18px;border:2px solid #fff;border-radius:12px;background:linear-gradient(135deg,#10b981,#0ea5e9);color:#fff;font-size:14px;font-weight:800;cursor:pointer;margin:2px 0 6px;box-shadow:0 0 0 2px #111}' +
    '.hmr-spbtn.rec{background:#dc2626!important}' +
    // phones: inputs at 16px so iOS never zooms, nothing wider than the screen
    '.hmr-sub input,.hmr-spk textarea,.hmr-fbp textarea,.hmr-dsp input,.hmr-dsp textarea,.hmr-dsp select{font-size:16px!important}.hmr-dsp,.hmr-spk{touch-action:manipulation}';
  if (doc.body) watchDx(); else doc.addEventListener('DOMContentLoaded', watchDx);

  // ---- forms other pages add: <form data-hmr-anon-form> goes through send()
  doc.addEventListener('submit', function (e) {
    var f = e.target; if (!f || !f.hasAttribute || !f.hasAttribute('data-hmr-anon-form')) return;
    e.preventDefault(); e.stopPropagation();
    var lines = [], msg = '', email = '', els = f.elements;
    for (var i = 0; i < els.length; i++) {
      var x = els[i], nm = x.name; if (!nm || x.disabled || /^(submit|button|reset|file|password|hidden)$/.test(x.type) || /botcheck|honey/i.test(nm)) continue;
      if ((x.type === 'checkbox' || x.type === 'radio') && !x.checked) continue;
      var v = String(x.value || '').trim(); if (!v) continue;
      if (nm === 'message') msg = v; else if (nm === 'email') email = v; else lines.push(nm + ': ' + v);
    }
    var message = (msg ? msg + (lines.length ? '\n\n' : '') : '') + lines.join('\n');
    var st = f.querySelector('[data-hmr-anon-status]');
    if (!st) { st = el('p'); st.setAttribute('data-hmr-anon-status', ''); st.setAttribute('role', 'status'); st.setAttribute('aria-live', 'polite'); f.appendChild(st); }
    if (!message.trim()) { st.textContent = 'Please add a few words first.'; return; }
    st.textContent = 'Sending...';
    send({ kind: 'anonymous form', message: message, email: email }).then(function (r) {
      if (r.ok) { try { f.reset(); } catch (x2) { } st.textContent = SENT_LINE; } else st.textContent = MAIL_LINE;
    });
  }, true);

  // ---- Escape closes everything the dock opened here
  doc.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (hlm && !hlm.hidden) { hideHlm(); }
    if (fb && !fb.el.hidden) { closeSheet(true); }
    if (own && !own.panel.hidden) { closeOwn(true); }
  });

  // ---- v6.4: keep your place when the phone turns. The topmost visible block and how far past its top we are (a fraction of its height) are remembered; after a resize
  //      the page scrolls so that block sits at the same fraction. Works on every site; skips the dock and the design overlay.
  (function () {
    var SELR = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,figure,img,pre,td,th,summary,.card,.btn', anchor = null, frac = 0, off = 0, lastW = innerWidth, busy = false, raf = 0;
    function inDock(n) { try { return !!(n.closest && n.closest('#hmr-dock,.hmr-gen,.hmr-dsp,.hmr-spk,.hmr-fzm,.hmr-rxp,.hmr-fbp,.hmr-toast,.hmr-tier')); } catch (e) { return true; } }
    function pickA() {
      if (busy || (doc.documentElement.classList.contains('hmr-gen-on'))) return;
      var els; try { els = doc.querySelectorAll(SELR); } catch (e) { return; }
      var vh = innerHeight, best = null, bt = 1e9;
      for (var i = 0; i < els.length && i < 4000; i++) {
        var r = els[i].getBoundingClientRect(); if (r.height < 4 || r.bottom <= 24 || r.top >= vh) continue;
        if (r.top < bt && els[i].offsetParent !== null && !inDock(els[i])) { bt = r.top; best = els[i]; if (r.top <= 0) { /* keep looking for a block that starts nearer the top but still straddles it */ } }
        if (r.top > vh * .5 && best) break;
      }
      if (best) { var rb = best.getBoundingClientRect(); anchor = best; off = rb.top; frac = rb.height > 0 ? clamp(-rb.top / rb.height, 0, 1) : 0; if (rb.top > 0) frac = 0; }
    }
    function q() { if (busy || raf) return; raf = requestAnimationFrame(function () { raf = 0; pickA(); }); }
    function restore() {
      if (!anchor || !doc.contains(anchor)) return; var r = anchor.getBoundingClientRect();
      var want = off > 0 ? off : -frac * r.height; window.scrollBy(0, r.top - want);
    }
    function turned() {
      if (innerWidth === lastW) return; lastW = innerWidth; busy = true;
      [50, 200, 500, 900].forEach(function (t) { setTimeout(restore, t); });
      setTimeout(function () { busy = false; pickA(); }, 1000);
    }
    window.addEventListener('scroll', q, { passive: true }); window.addEventListener('resize', turned); window.addEventListener('orientationchange', turned);
    if (doc.readyState === 'complete') setTimeout(pickA, 300); else window.addEventListener('load', function () { setTimeout(pickA, 300); });
  })();

  // ------------------------------------------------------------------ mount
  function mount() {
    if (doc.getElementById('hmr-dock')) return;
    try {   // tier ribbon, a small centered line at the end of the page
      if (!doc.querySelector('[data-hmr-tier-ribbon]')) {
        // v6.9 (Leo, Nov 26): a yellow heart and "elevat.ing family of websites" (all lowercase), linking to elevat.ing, on every site
        var rb = el('div', 'hmr-tier'); rb.setAttribute('data-hmr-tier-ribbon', 'family');
        var ra = el('a', 'hmr-tl'); ra.target = '_blank'; ra.rel = 'noopener'; ra.href = 'https://elevat.ing/';
        var rs = el('span', 'st', '\uD83D\uDC9B'); rs.setAttribute('aria-hidden', 'true'); ra.appendChild(rs); ra.appendChild(doc.createTextNode('elevat.ing family of websites'));
        rb.appendChild(ra); rb.appendChild(el('div', 'hmr-free', FREE_LINE)); doc.body.appendChild(rb);
      }
    } catch (e) { }
    dock.id = 'hmr-dock'; doc.body.appendChild(dock);
    try {   // leave room at the end of long pages so the dock never hides the last lines
      var scrollable = root.scrollHeight > innerHeight + 20, disp = getComputedStyle(doc.body).display;
      if (scrollable && (disp === 'block' || disp === 'flow-root')) { var sp = el('div', 'hmr-spacer'); sp.setAttribute('aria-hidden', 'true'); doc.body.appendChild(sp); }
    } catch (e) { }
  }
  if (doc.body) mount(); else doc.addEventListener('DOMContentLoaded', mount);


  // ------------------------------------------------------------------ v6.7 (Leo, Nov 26): drag every bar button, Funsies only in the main menu, a mic in every text box
  // Drag: press any bar button (Back, Forward, HMR, the feedback mic, React) and move it; a press that moves under 8px is still a normal tap.
  //   Where each button sits is saved per visitor in this browser (localStorage 'hmr-btnpos-v1', as fractions of the window) and comes back on every page.
  //   "Put the buttons back" sits in the dashboard's Your settings; "Reset everything on this site" also clears it.
  // Funsies: the bar button is hidden wherever the HMR button (and its dashboard, which holds Funsies) is on the bar.
  // Mic in every box: every text box (textarea; input of type text, search, email, url, tel) gets a round mic at its top right, inside the box.
  //   Speech goes only into that box. Skipped: password, number, date, color, range, checkboxes, dropdowns, read-only or disabled boxes,
  //   boxes that already have a mic, and anything marked data-hmr-nomic.
  (function () {
    var POSKEY = 'hmr-btnpos-v1', IDS = ['hmr-back', 'hmr-pad', 'hmr-speak', 'hmr-react', 'hmr-fwd'];
    function lsg() { try { return JSON.parse(localStorage.getItem(POSKEY) || '{}') || {}; } catch (e) { return {}; } }
    function lss(o) { try { if (Object.keys(o).length) localStorage.setItem(POSKEY, JSON.stringify(o)); else localStorage.removeItem(POSKEY); } catch (e) { } }
    var css = doc.createElement('style'); css.id = 'hmr-v67-css';
    css.textContent = [
      'html.hmr-has-hmr .hmr-dock>.hmr-fzbtn,html.hmr-has-hmr #hmr-funsies{display:none!important}',
      '.hmr-dock>#hmr-back,.hmr-dock>#hmr-pad,.hmr-dock>#hmr-pad #hmr-hmr,.hmr-dock>#hmr-speak,.hmr-dock>#hmr-react,.hmr-dock>#hmr-fwd{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}',
      '.hmr-dock>.hmr-moved{position:fixed!important;margin:0!important;right:auto!important;bottom:auto!important;z-index:99991}',
      '.hmr-dock>.hmr-dragging{cursor:grabbing!important;transition:none!important;transform:none!important;box-shadow:0 0 0 4px #fff,0 12px 34px rgba(0,0,0,.55)!important}',
      '.hmr-mw{position:relative!important;max-width:100%}',
      '.hmr-fmic{position:absolute;top:auto;bottom:6px;right:6px;z-index:2;width:30px;height:30px;min-width:0!important;min-height:0!important;padding:0!important;margin:0!important;border-radius:50%;border:2px solid #fff;background:conic-gradient(from 210deg,#e0307a,#f59e0b,#22c55e,#06b6d4,#8b5cf6,#e0307a);color:#fff!important;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3);-webkit-tap-highlight-color:transparent;touch-action:manipulation;line-height:1}',
      '.hmr-fmic.one{top:50%;bottom:auto;transform:translateY(-50%)}',
      '.hmr-fmic[hidden]{display:none!important}.hmr-fmic svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round;display:block}',
      '.hmr-fmic.rec{background:linear-gradient(135deg,#dc2626,#7f1d1d);animation:hmrfm 1.2s ease-in-out infinite}@keyframes hmrfm{50%{box-shadow:0 0 0 6px rgba(220,38,38,.25)}}',
      '.hmr-fmic:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}',
      '@media (pointer:coarse){.hmr-fmic{width:34px;height:34px}}',
      '@media (prefers-reduced-motion:reduce){.hmr-fmic.rec{animation:none}}'
    ].join('');
    function addCss() { if (!css.parentNode && doc.head) doc.head.appendChild(css); }

    // ---- drag
    function clampTo(b, x, y) {
      var w = b.offsetWidth || 50, h = b.offsetHeight || 50, vw = root.clientWidth || innerWidth, vh = innerHeight;
      return [Math.max(4, Math.min(vw - w - 4, x)), Math.max(4, Math.min(vh - h - 4, y))];
    }
    function place(b, x, y) {
      var p = clampTo(b, x, y);
      b.classList.add('hmr-moved');
      // inline !important beats the bar's own '#hmr-... {position:relative!important}' rules
      [['position', 'fixed'], ['right', 'auto'], ['bottom', 'auto'], ['margin', '0'], ['z-index', '99991']].forEach(function (kv) { b.style.setProperty(kv[0], kv[1], 'important'); });
      b.style.setProperty('left', p[0] + 'px', 'important'); b.style.setProperty('top', p[1] + 'px', 'important');
      try { var r = b.getBoundingClientRect(), ex = p[0] - r.left, ey = p[1] - r.top; if (Math.abs(ex) > .5 || Math.abs(ey) > .5) { b.style.setProperty('left', (p[0] + ex) + 'px', 'important'); b.style.setProperty('top', (p[1] + ey) + 'px', 'important'); } } catch (e) { }
      return p;
    }
    function unplace(b) { b.classList.remove('hmr-moved'); ['position', 'right', 'bottom', 'margin', 'z-index', 'left', 'top'].forEach(function (k) { b.style.removeProperty(k); }); }
    function applySaved() {
      var o = lsg(), vw = root.clientWidth || innerWidth, vh = innerHeight;
      IDS.forEach(function (id) {
        var b = doc.getElementById(id); if (!b) return;
        var s = o[id]; if (s && isFinite(s.x) && isFinite(s.y)) place(b, s.x * vw, s.y * vh); else if (b.classList.contains('hmr-moved')) unplace(b);
      });
    }
    var drag = null, swallow = 0;
    function wire(b) {
      if (!b || b.__hmrDrag) return; b.__hmrDrag = 1;
      b.addEventListener('pointerdown', function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        var r = b.getBoundingClientRect();
        drag = { b: b, id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, on: false };
      });
    }
    doc.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (!drag.on) {
        if (dx * dx + dy * dy < 64) return;
        drag.on = true; drag.b.classList.add('hmr-dragging');
        try { drag.b.setPointerCapture(drag.id); } catch (x) { }
      }
      e.preventDefault();
      place(drag.b, e.clientX - drag.ox, e.clientY - drag.oy);
    }, { passive: false });
    function endDrag(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var d = drag; drag = null;
      if (!d.on) return;
      d.b.classList.remove('hmr-dragging');
      swallow = Date.now();
      var r = d.b.getBoundingClientRect(), vw = root.clientWidth || innerWidth, vh = innerHeight, o = lsg();
      o[d.b.id] = { x: +(r.left / vw).toFixed(4), y: +(r.top / vh).toFixed(4) }; lss(o);
    }
    doc.addEventListener('pointerup', endDrag); doc.addEventListener('pointercancel', endDrag);
    // the click that ends a drag is not a tap
    window.addEventListener('click', function (e) {
      if (Date.now() - swallow > 400) return;
      var t = e.target && e.target.closest ? e.target.closest('.hmr-dock>button,.hmr-dock>a,.hmr-dock>.hmr-pad') : null;
      if (t) { swallow = 0; e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
    window.addEventListener('resize', function () { applySaved(); });
    function resetButtons() { lss({}); IDS.forEach(function (id) { var b = doc.getElementById(id); if (b) unplace(b); }); }

    // "Put the buttons back" in the dashboard's Your settings (any dash version that has "Reset everything on this site")
    function addResetItem() {
      var ra = doc.querySelector('[data-k="reset-all"]'); if (!ra || !ra.parentNode || ra.parentNode.querySelector('[data-k="btn-pos"]')) return;
      var it = ra.cloneNode(true); it.setAttribute('data-k', 'btn-pos');
      var bb = it.querySelector('b'), sm = it.querySelector('small');
      var moved = Object.keys(lsg()).length > 0;
      if (bb) bb.textContent = 'Put the buttons back'; if (sm) sm.textContent = moved ? 'Move the bottom buttons back to where they started' : 'Your bottom buttons are where they started. Drag any of them to move it.';
      it.addEventListener('click', function () { resetButtons(); if (sm) sm.textContent = 'Done. The bottom buttons are back where they started.'; });
      ra.parentNode.insertBefore(it, ra);
    }

    // ---- a mic in every text box
    var MICICO = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/></svg>';
    var TYPES = { text: 1, search: 1, email: 1, url: 1, tel: 1, '': 1 };
    var active = null;
    function hasMic(f) {
      if (f.closest('.hmr-tw,.hmr-mw,[data-hmr-nomic]')) return true;
      var p = f.parentNode; if (!p || !p.querySelectorAll) return false;
      var near = p.querySelectorAll('button,[role="button"]');
      for (var i = 0; i < near.length; i++) { var s = ((near[i].getAttribute('aria-label') || '') + ' ' + (near[i].title || '') + ' ' + (near[i].className || '') + ' ' + (near[i].id || '')).toLowerCase(); if (/\bmic|microphone|talk|speak|record|voice|dictat/.test(s)) return true; }
      return false;
    }
    function eligible(f) {
      if (f.__hmrMic) return false;
      var tag = f.tagName;
      if (tag === 'INPUT') { if (!TYPES[(f.getAttribute('type') || '').toLowerCase()]) return false; }
      else if (tag !== 'TEXTAREA') return false;
      if (f.readOnly || f.disabled || f.hidden || f.type === 'hidden') return false;
      if (f.closest('.hmr-dock,[aria-hidden="true"]')) return false;
      if (f.getAttribute('data-hmr-nomic') !== null) return false;
      return !hasMic(f);
    }
    function wrapField(f) {
      var cs = getComputedStyle(f), par = f.parentNode, pcs = getComputedStyle(par);
      if (cs.display === 'none' || cs.visibility === 'hidden') return null;
      var w = doc.createElement('span'); w.className = 'hmr-mw';
      var block = cs.display === 'block' || cs.display === 'flex' || cs.display === 'grid';
      var pflex = /flex|grid/.test(pcs.display);
      w.style.display = block ? 'block' : 'inline-block';
      ['marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'gridColumn', 'gridRow', 'gridArea', 'order'].forEach(function (k) { if (pflex || /^margin/.test(k)) w.style[k] = cs[k]; });
      var pw = par.clientWidth - parseFloat(pcs.paddingLeft || 0) - parseFloat(pcs.paddingRight || 0), fills = f.offsetWidth >= pw - 2;
      if (pflex) {
        w.style.width = (cs.flexGrow === '0' && cs.flexBasis === 'auto') ? f.offsetWidth + 'px' : 'auto';
      } else {
        if (fills) w.style.display = 'block';
        w.style.width = fills ? '100%' : f.offsetWidth + 'px';   // keep the field's own width, whatever its display type
      }
      f.style.setProperty('width', '100%');
      f.style.setProperty('margin', '0'); f.style.setProperty('box-sizing', 'border-box');
      par.insertBefore(w, f); w.appendChild(f);
      return w;
    }
    function addMic(f) {
      f.__hmrMic = 1;
      if (typeof makeMic !== 'function' || !SR) return;
      if (!f.offsetWidth || f.offsetWidth < 90) { f.__hmrMic = 0; return; }   // not laid out yet (hidden panel) or too narrow: try again later
      var w = wrapField(f); if (!w) { f.__hmrMic = 0; return; }
      var one = f.tagName === 'INPUT';
      var b = doc.createElement('button'); b.type = 'button'; b.className = 'hmr-fmic' + (one ? ' one' : ''); b.innerHTML = MICICO;
      b.setAttribute('aria-label', 'Talk instead of typing'); b.title = 'Talk instead of typing'; b.tabIndex = 0;
      w.appendChild(b);
      var pr = parseFloat(getComputedStyle(f).paddingRight || 0); if (pr < 42) f.style.setProperty('padding-right', '42px', 'important');
      if (!one) { var pt = parseFloat(getComputedStyle(f).paddingTop || 0); if (pt < 8) f.style.setProperty('padding-top', '8px'); }
      var api = makeMic(f, b, null, function () { try { f.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) { } });
      b.addEventListener('click', function () {
        if (api.on && api.on()) { if (active && active !== api) { try { active.stop(); } catch (e) { } } active = api; }
        else { try { f.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { } if (active === api) active = null; }
      });
      b.addEventListener('mousedown', function (e) { e.preventDefault(); });   // keep the box's focus and caret
    }
    var scanT = 0;
    function scan() {
      scanT = 0; addCss();
      if (doc.getElementById('hmr-hmr')) root.classList.add('hmr-has-hmr');
      IDS.forEach(function (id) { wire(doc.getElementById(id)); });
      addResetItem();
      var fs = doc.querySelectorAll('textarea,input');
      for (var i = 0; i < fs.length; i++) { try { if (eligible(fs[i])) addMic(fs[i]); } catch (e) { } }
    }
    function soon() { if (!scanT) scanT = setTimeout(scan, 150); }
    function boot() {
      scan(); applySaved();
      try { new MutationObserver(soon).observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'class', 'open'] }); } catch (e) { }
      doc.addEventListener('focusin', function (e) { var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') && eligible(t)) addMic(t); });
      window.addEventListener('pageshow', function () { scan(); applySaved(); });
    }
    if (doc.body) setTimeout(boot, 0); else doc.addEventListener('DOMContentLoaded', boot);
    window.__hmrResetButtons = resetButtons;
  })();


  // ------------------------------------------------------------------ v6.8 (Leo, Nov 26): the HMR joystick, a rainbow mic at bottom right, layouts with a shuffle, wider panels
  // HMR joystick: the round rainbow HMR button sits in the middle of four arrows. Each arrow is a triangle whose curved base hugs the HMR circle
  //   (the shape you get from four circles set around the HMR button: the space between them is the arrow).
  //   Up:    tap jumps to the top (with "Jump back" for a few seconds), hold scrolls up.
  //   Down:  tap jumps to the bottom (with "Jump back"), hold scrolls down.
  //   Left:  tap goes to the previous section of the page, hold keeps stepping back.
  //   Right: tap goes to the next section, hold keeps stepping forward.
  //   Tap HMR opens the dashboard, as before. Press HMR and move it to drag the whole joystick anywhere (saved like the other buttons).
  // Mic (feedback): bottom right, the same size as the forward button, rainbow like the HMR button.
  // Layouts (localStorage 'hmr-layout-v1'): Joystick (default), Right thumb, Left thumb, Reader, Classic.
  //   "Shuffle the buttons" (in the dashboard, Right now row and Your settings) moves to the next layout and puts any dragged buttons back.
  // Wider panels: the dashboard is up to 680px wide and the UI/UX studio up to 1040px on wide screens (phones already use the full width).
  (function () {
    if (typeof hmrBtn === 'undefined' || !hmrBtn) return;
    var LKEY = 'hmr-layout-v1';
    var LAYS = [
      { id: 'joy', name: 'Joystick', hint: 'ELV8 in the middle with up, down, left and right, and the mic' },
      { id: 'rt', name: 'Right thumb', hint: 'Everything near your right thumb: back, React, mic, forward, then ELV8' },
      { id: 'lt', name: 'Left thumb', hint: 'Everything near your left thumb: ELV8, then back, React, mic, forward' },
      { id: 'joyr', name: 'Joystick and React', hint: 'ELV8 with its four arrows, React on the left, the mic on the right' },
      { id: 'classic', name: 'Classic', hint: 'The old row: back, ELV8, mic, React, forward' }
    ];
    // v6.9 (Leo, Nov 26): the default is ELV8 with its four arrows and the mic, and no browser back or forward buttons.
    //   Where the four arrows are around ELV8 there are no back / forward buttons; the thumb layouts drop the four arrows and keep a simple back and forward,
    //   with React and the mic between them. The old Reader layout is the new default, so a saved 'read' becomes 'joy'.
    function lget() { try { var v = localStorage.getItem(LKEY) || 'joy'; if (v === 'read') v = 'joy'; for (var i = 0; i < LAYS.length; i++) if (LAYS[i].id === v) return v; } catch (e) { } return 'joy'; }
    function lset(v) { try { if (v === 'joy') localStorage.removeItem(LKEY); else localStorage.setItem(LKEY, v); } catch (e) { } }
    function lay(id) { for (var i = 0; i < LAYS.length; i++) if (LAYS[i].id === id) return LAYS[i]; return LAYS[0]; }
    var cur = lget();
    function setCls() { LAYS.forEach(function (l) { root.classList.toggle('hmr-lay-' + l.id, l.id === cur); }); }
    setCls();

    // ---- the arrow shape, in a 100 x 100 box centred on 0,0 (up arrow; the others are turned)
    var R1 = 31, RA = 50, RC = 44, S = Math.sin(40 * Math.PI / 180) * R1, C = Math.cos(40 * Math.PI / 180) * R1;
    var PATH = 'M' + (-S).toFixed(2) + ' ' + (-C).toFixed(2) + 'A' + R1 + ' ' + R1 + ' 0 0 1 ' + S.toFixed(2) + ' ' + (-C).toFixed(2) +
      'A' + RC + ' ' + RC + ' 0 0 1 0 ' + (-RA) + 'A' + RC + ' ' + RC + ' 0 0 1 ' + (-S).toFixed(2) + ' ' + (-C).toFixed(2) + 'Z';
    var DIRS = [
      { d: 'up', rot: 0, c: ['#e0307a', '#f59e0b'], label: 'Up: tap to jump to the top, hold to scroll up' },
      { d: 'right', rot: 90, c: ['#f59e0b', '#22c55e'], label: 'Right: tap for the next section, hold to keep going' },
      { d: 'down', rot: 180, c: ['#06b6d4', '#3b82f6'], label: 'Down: tap to jump to the bottom, hold to scroll down' },
      { d: 'left', rot: 270, c: ['#8b5cf6', '#e0307a'], label: 'Left: tap for the previous section, hold to keep going' }
    ];
    var pad = el('div', 'hmr-pad'); pad.id = 'hmr-pad'; pad.setAttribute('role', 'group'); pad.setAttribute('aria-label', 'HMR joystick');
    DIRS.forEach(function (o, i) {
      var b = el('button', 'hmr-pa'); b.type = 'button'; b.setAttribute('data-d', o.d); b.setAttribute('aria-label', o.label); b.title = o.label;
      b.innerHTML = '<svg viewBox="-50 -50 100 100" aria-hidden="true" focusable="false"><defs><linearGradient id="hmrpg' + i + '" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="' + o.c[0] + '"/><stop offset="1" stop-color="' + o.c[1] + '"/></linearGradient></defs>' +
        '<g transform="rotate(' + o.rot + ')"><circle class="hit" cx="0" cy="-49" r="20"/><path d="' + PATH + '" fill="url(#hmrpg' + i + ')"/></g></svg>';
      pad.appendChild(b); o.b = b;
    });
    var undo = el('button', 'hmr-padundo', 'Jump back'); undo.type = 'button'; undo.hidden = true; pad.appendChild(undo);

    var css = el('style'); css.id = 'hmr-v68-css';
    css.textContent = [
      '.hmr-dock{--hmr-pw:116px}@media (max-width:480px){.hmr-dock{--hmr-pw:104px}}@media (max-width:374px){.hmr-dock{--hmr-pw:90px}}',
      // joystick (default): [space] ELV8 with four arrows [space] Mic; no back, forward or React. Equal side columns keep ELV8 centred.
      'html.hmr-lay-joy .hmr-dock,html.hmr-lay-joyr .hmr-dock{grid-template-columns:var(--hmr-c) minmax(0,1fr) auto minmax(0,1fr) var(--hmr-c)!important}',
      'html.hmr-lay-joy .hmr-dock>#hmr-pad,html.hmr-lay-joyr .hmr-dock>#hmr-pad{grid-column:3}html.hmr-lay-joy .hmr-dock>#hmr-speak,html.hmr-lay-joyr .hmr-dock>#hmr-speak{grid-column:5}',
      'html.hmr-lay-joy .hmr-dock>#hmr-back,html.hmr-lay-joy .hmr-dock>.hmr-rxbtn,html.hmr-lay-joy .hmr-dock>#hmr-fwd,html.hmr-lay-joyr .hmr-dock>#hmr-back,html.hmr-lay-joyr .hmr-dock>#hmr-fwd{display:none!important}',
      'html.hmr-lay-joyr .hmr-dock>.hmr-rxbtn{grid-column:1}',
      // right thumb: [space] Back React Mic Forward ELV8 (no arrows around ELV8)
      'html.hmr-lay-rt .hmr-dock{grid-template-columns:minmax(0,1fr) auto auto auto auto auto!important}html.hmr-lay-rt .hmr-dock>#hmr-back{grid-column:2}html.hmr-lay-rt .hmr-dock>.hmr-rxbtn{grid-column:3}html.hmr-lay-rt .hmr-dock>#hmr-speak{grid-column:4}html.hmr-lay-rt .hmr-dock>#hmr-fwd{grid-column:5}html.hmr-lay-rt .hmr-dock>#hmr-pad{grid-column:6}',
      // left thumb: ELV8 Back React Mic Forward [space] (no arrows around ELV8)
      'html.hmr-lay-lt .hmr-dock{grid-template-columns:auto auto auto auto auto minmax(0,1fr)!important}html.hmr-lay-lt .hmr-dock>#hmr-pad{grid-column:1}html.hmr-lay-lt .hmr-dock>#hmr-back{grid-column:2}html.hmr-lay-lt .hmr-dock>.hmr-rxbtn{grid-column:3}html.hmr-lay-lt .hmr-dock>#hmr-speak{grid-column:4}html.hmr-lay-lt .hmr-dock>#hmr-fwd{grid-column:5}',
      // classic: the v6.5 row, plain ELV8 button
      'html.hmr-lay-classic .hmr-dock>#hmr-pad{grid-column:4}',
      'html:is(.hmr-lay-classic,.hmr-lay-rt,.hmr-lay-lt) .hmr-pa{display:none!important}html:is(.hmr-lay-classic,.hmr-lay-rt,.hmr-lay-lt) .hmr-dock{--hmr-pw:var(--hmr-hw)}',
      '.hmr-dock>#hmr-back,.hmr-dock>.hmr-fzbtn,.hmr-dock>#hmr-pad,.hmr-dock>#hmr-speak,.hmr-dock>.hmr-rxbtn,.hmr-dock>#hmr-fwd{grid-row:1}',
      '.hmr-dock>#hmr-pad{position:relative!important;left:auto;right:auto;bottom:auto;top:auto;margin:0!important}',
      '.hmr-pad{pointer-events:none;width:var(--hmr-pw);height:var(--hmr-pw);touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}',
      '.hmr-pad>#hmr-hmr{position:absolute!important;left:50%!important;top:50%!important;right:auto!important;bottom:auto!important;margin:calc(var(--hmr-hw) / -2) 0 0 calc(var(--hmr-hw) / -2)!important;z-index:2}',
      '.hmr-pa{position:absolute;inset:0;width:100%;height:100%;padding:0;margin:0;border:0;background:none!important;box-shadow:none;pointer-events:none;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:none;outline:none}',
      '.hmr-pa svg{display:block;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 3px 6px rgba(0,0,0,.35))}',
      '.hmr-pa path{pointer-events:visiblePainted;stroke:#fff;stroke-width:2.2;stroke-linejoin:round;transition:filter .15s}',
      '.hmr-pa:hover path{filter:brightness(1.15)}.hmr-pa.on path{filter:brightness(1.3);stroke-width:3}',
      // v6.9: a bigger tap area around each arrow, centred on its tip (where people aim), and grey when that way has nowhere to go
      '.hmr-pa .hit{fill:transparent;stroke:none;pointer-events:all}',
      '.hmr-pa.off svg{filter:grayscale(1) drop-shadow(0 3px 6px rgba(0,0,0,.3));opacity:.5}.hmr-pa.off:hover path{filter:none}',
      '.hmr-pa:focus-visible path{stroke:#f59e0b;stroke-width:4}',
      '.hmr-padundo{position:absolute;left:50%;bottom:calc(100% + 6px);transform:translateX(-50%);pointer-events:auto;white-space:nowrap;padding:6px 12px;border-radius:999px;border:2px solid #fff;background:#111;color:#fff;font:700 13px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.4)}.hmr-padundo[hidden]{display:none!important}',
      // mic: the forward button's size, rainbow like HMR
      '.hmr-dock>#hmr-speak{width:var(--hmr-c)!important;height:var(--hmr-c)!important;background:conic-gradient(from 210deg,#e0307a,#f59e0b,#22c55e,#06b6d4,#8b5cf6,#e0307a)!important}.hmr-dock>#hmr-speak svg{width:24px;height:24px}',
      '.hmr-dock>#hmr-speak[aria-expanded="true"]{background:linear-gradient(135deg,#dc2626,#7f1d1d)!important}',
      // panels open above the taller joystick
      'html:is(.hmr-lay-joy,.hmr-lay-joyr) .hmr-fbp,html:is(.hmr-lay-joy,.hmr-lay-joyr) .hmr-spk,html:is(.hmr-lay-joy,.hmr-lay-joyr) .hmr-fzm{bottom:calc(' + BASE + ' + var(--hmr-pw) + 8px)!important}',
      'html:is(.hmr-lay-joy,.hmr-lay-joyr) .hmr-spacer{height:130px!important}',
      // wider dashboard and studio on wide screens
      '@media (min-width:720px){.hmrd{width:min(680px,calc(100vw - 32px))!important}html:is(.hmr-lay-joy,.hmr-lay-joyr) .hmrd:not(.hmrd-moved){bottom:calc(' + BASE + ' + 132px)!important}html:is(.hmr-lay-joy,.hmr-lay-joyr) .hmrd-toast{bottom:calc(' + BASE + ' + 138px)!important}}',
      // v6.9 (Leo, Nov 26): on phones too, the dashboard opens above the ELV8 button, never over it
      'html{--hmr-dockh:62px}@media (max-width:480px){html{--hmr-dockh:56px}}@media (max-width:374px){html{--hmr-dockh:48px}}',
      'html:is(.hmr-lay-joy,.hmr-lay-joyr){--hmr-dockh:116px}@media (max-width:480px){html:is(.hmr-lay-joy,.hmr-lay-joyr){--hmr-dockh:104px}}@media (max-width:374px){html:is(.hmr-lay-joy,.hmr-lay-joyr){--hmr-dockh:90px}}',
      '@media (max-width:719px){html .hmrd:not(.hmrd-moved){bottom:calc(' + BASE + ' + var(--hmr-dockh) + 8px)!important;left:6px!important;right:6px!important;border-radius:22px!important;border-bottom:1px solid var(--d-line)!important;max-height:calc(100dvh - ' + BASE + ' - var(--hmr-dockh) - 24px)!important;padding-bottom:12px!important}html .hmrd-toast{bottom:calc(' + BASE + ' + var(--hmr-dockh) + 14px)!important}}',
      '@media (min-width:760px){.hmrs{width:min(1040px,calc(100vw - 32px))!important;margin-left:calc(min(1040px,calc(100vw - 32px)) / -2)!important}}',
      '.hmrd-row:has(>[data-k="btn-shuffle"]){grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}',
      '@media (prefers-reduced-motion:reduce){.hmr-pa path{transition:none}}'
    ].join('');
    function addCss() { if (!css.parentNode && doc.head) doc.head.appendChild(css); }

    function mountPad() {
      try {
        addCss();
        if (pad.parentNode !== dock) dock.insertBefore(pad, hmrBtn.parentNode === dock ? hmrBtn : null);
        if (hmrBtn.parentNode !== pad) pad.insertBefore(hmrBtn, pad.firstChild);
      } catch (e) { }
    }
    mountPad(); setInterval(mountPad, 3000);
    window.addEventListener('pageshow', mountPad);

    // ---- what the arrows do
    var rm = function () { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
    function maxY() { return Math.max(0, (root.scrollHeight || 0) - innerHeight); }
    var undoY = null, undoT = 0;
    function offerUndo(y) {
      undoY = y; undo.hidden = false; clearTimeout(undoT);
      undoT = setTimeout(function () { undo.hidden = true; undoY = null; }, 6000);
    }
    undo.addEventListener('pointerdown', function (e) { e.stopPropagation(); });
    undo.addEventListener('click', function (e) {
      e.stopPropagation(); if (undoY === null) return;
      try { scrollTo({ top: undoY, behavior: rm() ? 'auto' : 'smooth' }); } catch (x) { scrollTo(0, undoY); }
      undo.hidden = true; undoY = null;
    });
    function jump(to) {
      var y = scrollY;
      if (Math.abs(y - to) < 40) { toast(to === 0 ? 'You are already at the top.' : 'You are already at the bottom.'); return; }
      try { scrollTo({ top: to, behavior: rm() ? 'auto' : 'smooth' }); } catch (e) { scrollTo(0, to); }
      offerUndo(y);
    }
    var SECSEL = 'h1,h2,h3,section[id],article,[data-hmr-section]';
    function sections() {
      var out = [], seen = [], n = doc.querySelectorAll(SECSEL);
      for (var i = 0; i < n.length; i++) {
        var e = n[i];
        if (e.closest('[data-hmr-dock],[data-hmr-ui],[class^="hmr"],[aria-hidden="true"],nav,footer')) continue;
        var r = e.getBoundingClientRect(); if (!r.height && !r.width) continue;
        var y = Math.round(r.top + scrollY);
        var dup = false; for (var j = 0; j < seen.length; j++) if (Math.abs(seen[j] - y) < 60) { dup = true; break; }
        if (!dup) { seen.push(y); out.push(y); }
      }
      return out.sort(function (a, b) { return a - b; });
    }
    function step(dir) {
      var ys = sections(), y = scrollY, off = 12, t = null, i;
      if (dir > 0) { for (i = 0; i < ys.length; i++) if (ys[i] - off > y + 8) { t = ys[i] - off; break; } if (t === null) t = Math.min(maxY(), y + innerHeight * 0.85); }
      else { for (i = ys.length - 1; i >= 0; i--) if (ys[i] - off < y - 8) { t = ys[i] - off; break; } if (t === null) t = Math.max(0, y - innerHeight * 0.85); }
      t = Math.max(0, Math.min(maxY(), t));
      if (Math.abs(t - y) < 4) { toast(dir > 0 ? 'This is the end of the page.' : 'This is the start of the page.'); return; }
      try { scrollTo({ top: t, behavior: rm() ? 'auto' : 'smooth' }); } catch (e) { scrollTo(0, t); }
    }
    function tap(d) { if (d === 'up') jump(0); else if (d === 'down') jump(maxY()); else step(d === 'right' ? 1 : -1); }
    // v6.9: an arrow is grey when it cannot move the page (at the top: up and left; at the bottom: down and right), and in colour as soon as it can
    var greyT = 0;
    function greyNow() {
      greyT = 0; var y = scrollY || 0, top = y <= 2, bot = y >= maxY() - 2;
      DIRS.forEach(function (o) { var off = (o.d === 'up' || o.d === 'left') ? top : bot; o.b.classList.toggle('off', off); o.b.setAttribute('aria-disabled', off ? 'true' : 'false'); });
    }
    function grey() { if (!greyT) greyT = requestAnimationFrame(greyNow); }
    window.addEventListener('scroll', grey, { passive: true }); window.addEventListener('resize', grey); window.addEventListener('load', grey);
    try { new ResizeObserver(grey).observe(doc.body); } catch (e) { }
    grey(); setTimeout(grey, 600);
    var hold = null;
    function startHold(d) {
      if (d === 'left' || d === 'right') { step(d === 'right' ? 1 : -1); hold.iv = setInterval(function () { step(d === 'right' ? 1 : -1); }, 650); return; }
      var t0 = performance.now(), last = t0, sign = d === 'up' ? -1 : 1;
      function f(now) {
        if (!hold) return;
        var dt = Math.min(50, now - last); last = now;
        var v = Math.min(2400, 500 + (now - t0) * 1.1);   // px per second, speeding up the longer you hold
        scrollBy(0, sign * v * dt / 1000);
        hold.raf = requestAnimationFrame(f);
      }
      hold.raf = requestAnimationFrame(f);
    }
    function stopHold() {
      if (!hold) return; var h = hold; hold = null;
      clearTimeout(h.t); clearInterval(h.iv); if (h.raf) cancelAnimationFrame(h.raf);
      h.b.classList.remove('on');
      return h;
    }
    DIRS.forEach(function (o) {
      var b = o.b;
      b.addEventListener('pointerdown', function (e) {
        if (e.button !== undefined && e.button !== 0) return;
        e.stopPropagation(); e.preventDefault();
        stopHold();
        hold = { b: b, d: o.d, id: e.pointerId, held: false };
        b.classList.add('on');
        try { b.setPointerCapture(e.pointerId); } catch (x) { }
        hold.t = setTimeout(function () { if (hold && hold.b === b) { hold.held = true; startHold(o.d); } }, 350);
      });
      function end(e) {
        if (!hold || hold.b !== b || (e && e.pointerId !== hold.id)) return;
        var h = stopHold();
        if (h && !h.held && e && e.type === 'pointerup') tap(o.d);
      }
      b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end); b.addEventListener('lostpointercapture', end);
      b.addEventListener('click', function (e) { if (e.detail === 0) tap(o.d); });   // keyboard: Enter or Space
      b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });
    window.addEventListener('blur', stopHold);

    // ---- layouts and the shuffle
    function applyLayout(id, say) {
      cur = id; lset(id); setCls();
      try { if (window.__hmrResetButtons) window.__hmrResetButtons(); } catch (e) { }
      if (say) toast('Button layout: ' + lay(id).name + '. ' + lay(id).hint + '.', null, 4000);
    }
    function shuffle() { var i = 0; for (var k = 0; k < LAYS.length; k++) if (LAYS[k].id === cur) i = k; applyLayout(LAYS[(i + 1) % LAYS.length].id, true); }
    // dashboard: a "Shuffle buttons" action in the Right now row, and the layouts in Your settings
    function addDashItems() {
      try {
        var row = doc.querySelector('.hmrd-row');
        if (row && !row.querySelector('[data-k="btn-shuffle"]')) {
          var a = row.querySelector('[data-k="share"]') || row.firstElementChild;
          if (a) {
            var s = a.cloneNode(true); s.setAttribute('data-k', 'btn-shuffle'); s.classList.remove('on');
            var ic = s.querySelector('.ic'); if (ic) ic.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>';
            var lb = s.querySelector('span:not(.ic)'); if (lb) lb.textContent = 'Shuffle buttons'; else s.appendChild(doc.createTextNode('Shuffle buttons'));
            s.setAttribute('aria-label', 'Shuffle the button layout. Now: ' + lay(cur).name);
            s.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); shuffle(); s.setAttribute('aria-label', 'Shuffle the button layout. Now: ' + lay(cur).name); });
            row.appendChild(s);
          }
        }
        var ra = doc.querySelector('[data-k="reset-all"]');
        if (ra && ra.parentNode && !ra.parentNode.querySelector('[data-k="lay-joy"]')) {
          LAYS.forEach(function (l) {
            var it = ra.cloneNode(true); it.setAttribute('data-k', 'lay-' + l.id);
            var bb = it.querySelector('b'), sm = it.querySelector('small');
            if (bb) bb.textContent = 'Button layout: ' + l.name + (l.id === cur ? ' (on)' : '');
            if (sm) sm.textContent = l.hint;
            it.addEventListener('click', function () {
              applyLayout(l.id, true);
              var all = ra.parentNode.querySelectorAll('[data-k^="lay-"]');
              for (var i = 0; i < all.length; i++) { var x = all[i].querySelector('b'), L = lay(all[i].getAttribute('data-k').slice(4)); if (x) x.textContent = 'Button layout: ' + L.name + (L.id === cur ? ' (on)' : ''); }
            });
            ra.parentNode.insertBefore(it, ra);
          });
        }
      } catch (e) { }
    }
    var dT = 0;
    try { new MutationObserver(function () { if (!dT) dT = setTimeout(function () { dT = 0; addDashItems(); }, 120); }).observe(doc.documentElement, { childList: true, subtree: true }); } catch (e) { }
    window.__hmrLayout = { list: LAYS, get: function () { return cur; }, set: function (id) { applyLayout(lay(id).id, false); }, shuffle: shuffle };
  })();

  window.HMRDock = {
    site: CFG.site, effects: EFFECTS.map(function (e) { return e.name; }),
    funsies: function (name) { if (effByName(name)) runEffect(name); },
    openFunsies: openFz, closeFunsies: function () { closeFz(true); }, play: function (id) { PLAY.forEach(function (p) { if (p.id === id) openPlay(p); }); }, closePlay: function () { closePlay(true); },
    stopFunsies: function () { stopFunsies(true); }, log: readLog, openReact: openRx, closeReact: function () { closeRx(true); },
    send: send, mailto: mailSelf, openFeedback: function (o) { openSheet('feedback', o); }, openLost: function () { openSheet('lost'); }, closeFeedback: function () { closeSheet(true); }, openSpeak: openSpeak, closeSpeak: function () { closeSpeak(true, true); },
    submitBox: function (o) { o = o || {}; return submitPair({ text: function () { try { return String(o.text ? o.text() : ''); } catch (e) { return ''; } }, kind: o.kind || 'ratings', onSent: o.onSent }).el; },   // v6.9: Submit with my email / Submit anonymously, for any page part (the design pickers use it)
    highlights: hlList, clearHighlights: clearAllHighlights, version: 6.9, openDash: function (v) { loadDash(function () { window.HMRDash.open(v); }); }, openStudio: function (t) { loadDash(function () { window.HMRDash.studio(t); }); }, closeOthers: closeOthers, designPanel: function () { return buildDx(null); }, design: { theme: function (s) { return genTheme(s); }, palettes: function () { return PALS; }, famOf: famOfSeed, seedIn: seedIn, show: function (s) { goTheme('g:' + s); }, hide: function () { goTheme(defaultId()); }, stats: function () { return gen ? { ms: gen.ms || 0, frames: gen.frames || 0, id: gen.t && gen.t.id, layouts: LAYS.length, palettes: PALS.length, fonts: FONTS.length, cards: CARDS.length } : null; }, count: function (fam) { return LAYS.length * PALS.length * FONTS.length * CARDS.length * 5 * DENKEYS.length * RADII.length * ACCS.length; } }, themes: function () { return allThemes().map(function (t) { return { id: t.id, name: t.name, genre: GENRES[t.gi].n, b: t.b, bi: t.bi, f: t.f, h: t.h, l: t.l, c: t.c }; }); }
  };
})();

/* HMR dock v6.6.0 edit mode: "Add a demo?" cards (Leo, Nov 25: the HMR sites are in edit mode by him).
   On each page the dock finds spots where a demo could help (forms, tools, sections with controls) that have no demo yet, and puts a small square
   card at the spot's top right: "Add a demo?" with Yes and No. An answer is sent with the dock's send() (kind 'demo', page, spot name) and the card
   goes away on this device (localStorage 'hmr-demo-ans'). Turn off: EDIT_MODE = false below, ?edit=0 in the address, or localStorage 'hmr-edit-off' = '1'.
   A page can mark a spot with data-demo-spot="Name", or opt out with data-demo="none". */
(function () {
  'use strict';
  var EDIT_MODE = true, MAX = 8, KEY = 'hmr-demo-ans', doc = document;
  if (!EDIT_MODE || window.__hmrDemoSpots) return; window.__hmrDemoSpots = 1;
  function lg(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function ls(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  if (/[?&]edit=0\b/.test(location.search) || lg('hmr-edit-off') === '1') return;
  var answered = {}; try { answered = JSON.parse(lg(KEY) || '{}') || {}; } catch (e) { answered = {}; }
  var SKIPIN = '#hmr-dock,[class^="hmr-"],[class*=" hmr-"],[id^="hmr-"],nav,header,footer,[role="dialog"],dialog,[aria-hidden="true"]';
  var HASDEMO = '[data-demo="none"],.demo,[id*="demo" i],[class*="demo" i],video,iframe[src*="youtube"],iframe[src*="vimeo"]';
  var layer = null, cards = [];
  function css() {
    var s = doc.createElement('style'); s.id = 'hmr-demo-css';
    s.textContent = '.hmr-demo-layer{position:absolute;top:0;left:0;width:0;height:0;z-index:9990}' +
      '.hmr-demo{position:absolute;width:104px;min-height:96px;box-sizing:border-box;padding:8px;border:2px dashed #b8860b;border-radius:10px;background:#fff8d6;color:#2a2508;font:600 13px/1.25 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;text-align:center;box-shadow:0 3px 10px rgba(0,0,0,.18);display:flex;flex-direction:column;justify-content:space-between;gap:6px}' +
      '.hmr-demo .q{display:block}.hmr-demo .r{display:flex;gap:6px;justify-content:center}' +
      '.hmr-demo button{flex:1;min-height:30px;padding:4px 0;border:1px solid #6b5a10;border-radius:6px;background:#fff;color:#2a2508;font:600 13px system-ui,sans-serif;cursor:pointer}' +
      '.hmr-demo button:hover,.hmr-demo button:focus-visible{background:#f5c518;outline:2px solid #2a2508;outline-offset:1px}' +
      '.hmr-demo .ok{font-weight:500}@media print{.hmr-demo-layer{display:none}}';
    (doc.head || doc.documentElement).appendChild(s);
  }
  function txt(e) { return String((e && (e.textContent || '')) || '').replace(/\s+/g, ' ').trim(); }
  function nameOf(sp, i) {
    var n = sp.getAttribute('data-demo-spot') || sp.getAttribute('aria-label');
    if (!n) { var h = sp.querySelector('h1,h2,h3,h4,legend,label'); n = txt(h); }
    if (!n && sp.id) n = '#' + sp.id;
    if (!n) n = sp.tagName.toLowerCase() + ' ' + (i + 1);
    return n.length > 60 ? n.slice(0, 57) + '...' : n;
  }
  function skipped(e) { for (var n = e; n && n !== doc.body && n !== doc.documentElement; n = n.parentElement) if (n.matches(SKIPIN)) return true; return false; }   // v6.6.1: html and body carry hmr- classes (pointer prefs), so they are not tested
  function visible(e) { var r = e.getBoundingClientRect(); return r.width >= 220 && r.height >= 90; }
  function find() {
    var cand = [].slice.call(doc.querySelectorAll('[data-demo-spot],form,section,article')), out = [];
    cand.forEach(function (sp) {
      if (out.length >= MAX) return;
      if (skipped(sp)) return;
      if (!sp.hasAttribute('data-demo-spot') && !sp.querySelector('input:not([type=hidden]),textarea,select,canvas,button')) return;
      if (sp.matches(HASDEMO) || sp.querySelector(HASDEMO)) return;
      if (!visible(sp)) return;
      for (var i = 0; i < out.length; i++) if (out[i].contains(sp) || sp.contains(out[i])) return;   // one card per area
      out.push(sp);
    });
    return out;
  }
  function place(c) {
    var r = c.sp.getBoundingClientRect(), x = r.right + scrollX - 112, y = r.top + scrollY + 8;
    c.el.style.left = Math.max(8, x) + 'px'; c.el.style.top = Math.max(8, y) + 'px';
    c.el.style.display = (r.width || r.height) ? '' : 'none';
  }
  function answer(c, yes) {
    var site = (window.HMRDock && window.HMRDock.site) || location.hostname, ans = yes ? 'YES' : 'NO';
    c.el.innerHTML = '<span class="ok">Sending...</span>';
    var done = function (ok) {
      if (ok) { answered[c.key] = ans; ls(KEY, JSON.stringify(answered)); c.el.innerHTML = '<span class="ok">' + (yes ? 'Yes, noted. Thank you.' : 'No, noted. Thank you.') + '</span>'; setTimeout(function () { c.el.remove(); }, 1600); }
      else { build(c); var e = doc.createElement('span'); e.className = 'ok'; e.textContent = 'Not sent. Try again.'; c.el.insertBefore(e, c.el.firstChild); }
    };
    if (!window.HMRDock || !window.HMRDock.send) return done(false);
    window.HMRDock.send({ kind: 'demo', subject: 'HMR site, demo spot: ' + site, noMailto: true,
      message: 'Add a demo here? ' + ans + '\nSpot: ' + c.name + '\nPage: ' + location.pathname,
      details: { answer: ans, spot: c.name, path: location.pathname } }).then(function (r) { done(r && r.ok); }, function () { done(false); });
  }
  function build(c) {
    c.el.innerHTML = '';
    var q = doc.createElement('span'); q.className = 'q'; q.textContent = 'Add a demo?'; c.el.appendChild(q);
    var row = doc.createElement('span'); row.className = 'r';
    [['Yes', true], ['No', false]].forEach(function (b) {
      var bt = doc.createElement('button'); bt.type = 'button'; bt.textContent = b[0];
      bt.setAttribute('aria-label', b[0] + ', add a demo to ' + c.name);
      if (!b[1]) bt.setAttribute('aria-label', 'No demo needed for ' + c.name);
      bt.addEventListener('click', function () { answer(c, b[1]); }); row.appendChild(bt);
    });
    c.el.appendChild(row);
  }
  function run() {
    var spots = find(); if (!spots.length) return;
    css(); layer = doc.createElement('div'); layer.className = 'hmr-demo-layer'; doc.body.appendChild(layer);
    spots.forEach(function (sp, i) {
      var name = nameOf(sp, i), key = location.pathname + '|' + name;
      if (answered[key]) return;
      var e = doc.createElement('div'); e.className = 'hmr-demo'; e.setAttribute('role', 'group'); e.setAttribute('aria-label', 'Add a demo to ' + name + '?');
      var c = { sp: sp, el: e, name: name, key: key }; build(c); layer.appendChild(e); cards.push(c); place(c);
    });
    var re = function () { cards.forEach(function (c) { if (c.el.isConnected) place(c); }); };
    addEventListener('resize', re); setInterval(re, 2000);
    window.HMRDemoSpots = { list: function () { return cards.map(function (c) { return c.name; }); }, reset: function () { ls(KEY, '{}'); } };
  }
  if (doc.readyState === 'complete') setTimeout(run, 600); else addEventListener('load', function () { setTimeout(run, 600); });
})();
