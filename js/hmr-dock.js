/* HMR dock v5.1: one shared bottom bar for all HMR sites.
   One row along the bottom, left to right:
     far left: Back (round, browser back) then the site's Design button (round; each site keeps its own picker, the dock only places the button).
       If a site has no Design panel the dock makes its own round Design button and panel in that slot, so every site gets the Design studio.
     center: Funsies (a menu: play three of our toys in an overlay, wreck the page, or pick more fun) with the round Speak here mic button to its right
       (say anything, it transcribes, it is sent as kind "speak").
     far right: React (round; pick a reaction, optionally aimed at a spot on the page) then Forward (round, browser forward) at the very edge.
   Back, Forward, Design and React are round 54px buttons (46px on phones, 42px on very small ones). The old Feedback and "I'm lost" pill buttons are gone;
   the sheet behind them still opens from the select-text menu (highlight, email, share, feedback) and from HMRDock.openFeedback / openLost.
   Design studio (inside the Design panel): 12 genres of whole-page themes (Professional, Salesy, Gimmicky, Retro, Artistic, Fantasy, Silly, Minimal,
     Futuristic, Cozy, Brutalist, Nature), 4 themes each. Pick a genre, then Back / Forward to step through its themes, Shuffle, or Original.
     Themes change fonts, spacing, shapes, shadows, backgrounds, layout width and entrance animations, never the words; every theme keeps text at 4.5:1 contrast.
     Also: thumbs up / down per theme, text hover effect, mouse pointer and trail, letter animation, notes (with voice typing) and "Send to us".
     The chosen theme is remembered per site (localStorage) and re-applied on load.
   Config comes from data attributes on the script tag:
     data-site="name"            site name
     data-design="#btn,.btn2"    CSS selector(s) of the site's own Design button (placed bottom left, round)
     data-design-panel="#panel"  CSS selector(s) of the site's Design panel (opens above the button, bottom left)
     data-sound="1"              the site already has sound, so bubbles may pop with a tiny sound
     data-tier="family|experiment"  adds a small ribbon at the end of the page: "Part of the HMR family" (default, gold star, links to hmrfamily.life)
                                 or "Part of the HMR experiment" (plain pill). Skipped if the page has an element with [data-hmr-tier-ribbon].
   Also here: HMRDock.send(payload) (web3forms, falling back to the visitor's email app), forms marked data-hmr-anon-form,
   and Microsoft Clarity click tracking (project ziagxt1es9, loaded once if the page has not loaded it).
   Storage is always inside try/catch. Each reaction is also sent to Clarity as a custom event. */
(function () {
  'use strict';
  var FORM_KEY = '436d16c6-bfff-4931-aace-95f12a6726ad';   // web3forms access key; also read from window.HMR_FORM_KEY. Empty means Send falls back to the visitor's email app.
  if (window.HMRDock) return;
  if (window.name === 'hmr-embed') return;   // inside the Funsies play overlay: no dock in the dock
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
  var ds = (CFG.design ? CFG.design + ',' : '') + '.hmr-dsbtn', ps = (CFG.panel ? CFG.panel + ',' : '') + '.hmr-dsp';
  function each(list, f) { return list ? list.split(',').map(function (x) { return f(x.trim()); }).join(',') : ''; }
  var AIMOK = ['html.hmr-aim .hmr-dock *', 'html.hmr-aim .hmr-rxp', 'html.hmr-aim .hmr-rxp *'].concat(ds ? [each(ds, function (x) { return 'html.hmr-aim ' + x; })] : [], ps ? [each(ps, function (x) { return 'html.hmr-aim ' + x; }), each(ps, function (x) { return 'html.hmr-aim ' + x + ' *'; })] : []).join(',');
  var css =
    'html{--hmr-c:54px;--hmr-cg:8px}@media (max-width:480px){html{--hmr-c:46px;--hmr-cg:4px}}@media (max-width:340px){html{--hmr-c:42px;--hmr-cg:3px}}' +
    '.hmr-dock{position:fixed;left:0;right:0;bottom:0;height:0;z-index:99990;pointer-events:none;font:600 13px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;letter-spacing:0;text-transform:none}' +
    '.hmr-dock *{box-sizing:border-box;font-family:inherit}' +
    '.hmr-rxbtn,.hmr-fzbtn{pointer-events:auto;position:fixed;bottom:' + BASE + ';border:2px solid #fff;color:#fff;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.38);-webkit-tap-highlight-color:transparent;touch-action:manipulation;margin:0;transform:none}' +
    '.hmr-rxbtn{right:calc(' + RIGHT + ' + var(--hmr-c) + var(--hmr-cg));width:var(--hmr-c);height:var(--hmr-c);border-radius:50%;background:#111;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:11px;line-height:1;font-weight:700}' +
    '.hmr-rxbtn svg{width:22px;height:22px;display:block;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}' +
    '.hmr-rxbtn:hover,.hmr-rxbtn[aria-expanded="true"]{background:#1d4ed8}' +
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
    '.hmr-again{pointer-events:auto;position:fixed;left:50%;transform:translateX(-50%);bottom:calc(' + BASE + ' + 58px);max-width:calc(100vw - 24px);background:#111;color:#fff;border:2px solid #fff;border-radius:999px;padding:7px 14px;font:700 13px/1.1 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-height:34px}',
    '.hmr-again[hidden]{display:none}.hmr-again:hover{background:#1d4ed8}',
    '.hmr-fzm{position:fixed;left:50%;bottom:calc(' + BASE + ' + 64px);transform:translateX(-50%);z-index:99992;width:min(680px,calc(100vw - 24px));max-height:min(80vh,calc(100vh - 110px));overflow:auto;overscroll-behavior:contain;background:#fff;color:#111;border:2px solid #111;border-radius:16px;padding:12px;box-shadow:0 14px 44px rgba(0,0,0,.45);font:500 13px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;text-align:left;text-transform:none;letter-spacing:0}',
    '.hmr-fzm[hidden]{display:none}.hmr-fzm *{box-sizing:border-box;font-family:inherit}',
    '.hmr-fzm .hd{display:flex;align-items:center;justify-content:space-between;gap:8px;font-weight:800;font-size:17px;margin:0 0 2px}',
    '.hmr-fzm .x{min-width:34px;min-height:34px;border:1px solid #bbb;background:#f6f6f6;color:#111;border-radius:8px;font-size:20px;line-height:1;cursor:pointer;padding:0 8px}',
    '.hmr-fzm h3{margin:12px 0 6px;font-size:11.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#555;line-height:1.2}',
    '.hmr-fzm .play{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}',
    '.hmr-fzm .card{display:flex;flex-direction:column;align-items:flex-start;gap:3px;min-height:84px;padding:10px;border:2px solid #111;border-radius:12px;background:linear-gradient(135deg,#fff0f6,#fff4dc);color:#111;cursor:pointer;text-align:left;font-size:14px;font-weight:800;line-height:1.2}',
    '.hmr-fzm .card small{font-weight:500;font-size:12px;color:#444}',
    '.hmr-fzm .card svg{width:22px;height:22px;fill:none;stroke:#c2185b;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
    '.hmr-fzm .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px}',
    '.hmr-fzm .fb{display:flex;align-items:center;gap:8px;min-height:40px;padding:6px 8px;border:1px solid #cfd6e4;background:#f4f7fc;color:#111;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;text-align:left;line-height:1.15}',
    '.hmr-fzm .fb svg{width:20px;height:20px;flex:none;fill:none;stroke:#1d4ed8;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
    '.hmr-fzm .fb:hover,.hmr-fzm .card:hover{filter:brightness(.95)}',
    '.hmr-fzm button:focus-visible,.hmr-pov button:focus-visible,.hmr-pov a:focus-visible,.hmr-again:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}',
    '@media (max-width:600px){.hmr-fzm{left:' + LEFT + ';right:' + RIGHT + ';transform:none;width:auto;max-height:min(72vh,calc(100vh - 110px))}.hmr-fzm .play{grid-template-columns:1fr}.hmr-fzm .card{min-height:56px}.hmr-fzm .grid{grid-template-columns:1fr 1fr}}',
    '@media (pointer:coarse){.hmr-fzm .fb{min-height:44px}}',
    '.hmr-pov{position:fixed;left:0;top:0;right:0;bottom:0;z-index:99996;background:rgba(4,4,10,.84);display:flex;align-items:center;justify-content:center;font:600 14px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}',
    '.hmr-pov .win{position:relative;display:flex;flex-direction:column;width:min(94vw,1400px);height:min(90vh,950px);height:min(90dvh,950px);background:#0b0b10;border-radius:16px;overflow:hidden;box-shadow:0 20px 70px rgba(0,0,0,.6)}',
    '.hmr-pov .win>.x{position:absolute;top:8px;right:8px;z-index:3;width:46px;height:46px;min-width:46px;min-height:46px;border:2px solid #fff;border-radius:50%;background:#111;color:#fff;font-size:30px;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 10px rgba(0,0,0,.5);transition:none;transform:none}.hmr-pov .win>.x:hover{background:#b91c1c;transform:none}',
    '.hmr-pov .bar{display:flex;align-items:center;gap:14px;padding:6px 66px 6px 14px;background:#111;color:#fff;min-height:62px}.hmr-pov .bar a{font-size:12.5px;font-weight:600;text-decoration:underline;white-space:nowrap;transition:none;animation:none;transform:none}.hmr-pov .bar b{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.hmr-pov .bar a,.hmr-pov .msg a{color:#9ec5ff;font-weight:700}',
    '.hmr-pov iframe{flex:1;border:0;width:100%;background:#fff;min-height:0}',
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
  var DEFAULT_EMOTIONS = ['Dislike', 'Like', 'Mad', 'Excited', 'Sad', 'Happy', 'Worried', 'Hopeful', 'Confused', 'Curious', 'Frustrated', 'Inspired', 'Disappointed', 'Grateful', 'Skeptical', 'Amazed', 'Dragons', 'Burn it all'];
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
    try {
      if (typeof window.clarity === 'function') {
        window.clarity('event', 'react_' + name.toLowerCase().replace(/[^a-z0-9]+/g, '_'));
        window.clarity('set', 'react_target', tg && tg.selector ? tg.selector : 'none');
      }
    } catch (e) { }
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
    if (t.closest('.hmr-dock,.hmr-rxp,.hmr-mark,.hmr-fzm,.hmr-pov,.hmr-again,.hmr-fbp,.hmr-spk,.hmr-hlm,.hmr-dx,.hmr-toast')) return true;
    try { if (ds && t.closest(ds)) return true; if (ps && t.closest(ps)) return true; } catch (e) { }
    return false;
  }
  function onAimClick(e) {
    if (!aim || insideDock(e.target)) return;
    e.preventDefault(); e.stopPropagation();
    var px = e.pageX, py = e.pageY;
    if (px == null) { px = e.clientX + scrollX; py = e.clientY + scrollY; }
    target = describe(e.target, px, py); markAt(px, py);
    setStatus('Spot marked' + (target.heading ? ' near "' + target.heading.slice(0, 40) + '"' : '') + '. Now pick a reaction.');
  }
  function startAim() {
    if (aim) return; aim = true; root.classList.add('hmr-aim');
    doc.addEventListener('click', onAimClick, true);
    setStatus(coarse() ? 'Tap the spot, then pick a reaction. Or just pick a reaction.' : 'Click the spot, then pick a reaction. Or just pick a reaction.');
  }
  function stopAim() { aim = false; root.classList.remove('hmr-aim'); doc.removeEventListener('click', onAimClick, true); }

  function emotions() { return (window.hmrReact && window.hmrReact.emotions && window.hmrReact.emotions.length) ? window.hmrReact.emotions.slice() : DEFAULT_EMOTIONS; }
  function buildPanel() {
    panel = el('div', 'hmr-rxp'); panel.id = 'hmr-rxp'; panel.hidden = true; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'React');
    var hd = el('div', 'hd'); hd.appendChild(el('span', '', 'How does this make you feel?'));
    var x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close reactions'); x.addEventListener('click', function () { closeRx(true); });
    hd.appendChild(x); panel.appendChild(hd);
    var tip = el('div', 'tip'); tip.id = 'hmr-rxtip'; tip.hidden = true;
    tip.innerHTML = '<p>Click the spot you\'re reacting to, then pick a reaction. Or just pick a reaction.</p><label><input type="checkbox" id="hmr-rxtip-off"> Don\'t show this again</label>';
    tip.querySelector('input').addEventListener('change', function (ev) { if (ev.target.checked) lsSet(TIPKEY, '1'); else { try { localStorage.removeItem(TIPKEY); } catch (e) { } } });
    panel.appendChild(tip);
    stEl = el('p', 'st'); stEl.setAttribute('role', 'status'); stEl.setAttribute('aria-live', 'polite'); panel.appendChild(stEl);
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
  function pick(name) {
    if (window.hmrReact && window.hmrReact.phase && window.hmrReact.phase() !== 'idle') { setStatus('Still reacting. Try again in a moment.'); return; }
    var tg = target; record(name, tg);
    var pt = tg ? { x: tg.px - scrollX, y: tg.py - scrollY } : null;
    closeRx(true);
    requestAnimationFrame(function () {
      try {
        if (REACT_FX[name] && effByName(REACT_FX[name])) runEffect(REACT_FX[name]);
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
    var all = doc.body.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,img,svg,button,a,input,textarea,label,figure,td,th,summary,code,pre,blockquote,span,b,strong,em,canvas,video,small,dt,dd,div,select');
    for (var i = 0; i < all.length; i++) {
      var e = all[i];
      if (e.closest('[data-hmr-dock],.hmr-rxp,.hmr-fzcanvas,.hmr-mark,.hmr-fzm,.hmr-pov,.hmr-again,.hmr-fbp,.hmr-spk,.hmr-hlm,.hmr-dx,.hmr-toast,.hmr-sp') || (e.namespaceURI && e.namespaceURI.indexOf('svg') >= 0 && e.tagName.toLowerCase() !== 'svg')) continue;
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
    return cfx(S, 9.5, function (L) {
      var cx = L.cx, W = L.W, H = L.H, pool = Fx(), sc = clamp(Math.min(W, H) / 700, .55, 1.3), N = 20;
      var D = [{ dir: 1, y: H * .3, t0: .1, ph: 0, c: '#1f6b43', c2: '#143f2a' }, { dir: -1, y: H * .62, t0: 1.9, ph: 2, c: '#8a2b34', c2: '#531a20' }];
      function hp(d, tt) { var sp = (W + 700 * sc) / 5.6; return [d.dir > 0 ? -250 * sc + sp * tt : W + 250 * sc - sp * tt, d.y + Math.sin(tt * 2.3 + d.ph) * 70 * sc + Math.sin(tt * .7) * 30 * sc]; }
      function wing(d, b, fl, far) {
        var dir = d.dir, bx = b[0], by = b[1], s = sc * (far ? .8 : 1);
        cx.fillStyle = far ? d.c2 : d.c; cx.strokeStyle = '#10241a'; cx.lineWidth = 1.5; cx.globalAlpha = .92;
        cx.beginPath(); cx.moveTo(bx, by); cx.lineTo(bx - dir * 10 * s, by - 95 * s * fl); cx.quadraticCurveTo(bx - dir * 45 * s, by - 55 * s * fl, bx - dir * 85 * s, by - 62 * s * fl + 14 * s); cx.quadraticCurveTo(bx - dir * 70 * s, by - 10 * s * fl, bx - dir * 66 * s, by + 8 * s); cx.quadraticCurveTo(bx - dir * 40 * s, by - 10 * s, bx - dir * 30 * s, by + 10 * s); cx.closePath(); cx.fill(); cx.stroke(); cx.globalAlpha = 1;
      }
      return function (dt, t) {
        D.forEach(function (d) {
          var tt = t - d.t0; if (tt < 0 || tt > 6.6) return;
          var segs = [], i; for (i = 0; i < N; i++) segs.push(hp(d, tt - i * .06));
          var h = segs[0], fl = Math.sin(tt * 9) * .6 + .25;
          if (h[0] > -40 && h[0] < W + 40) for (i = 0; i < 4; i++) { var a = (d.dir > 0 ? .2 : Math.PI - .2) + rnd(-.16, .16), sp = rnd(280, 560); pool.add(mk(h[0] + d.dir * 34 * sc, h[1] + 8 * sc, Math.cos(a) * sp, Math.sin(a) * sp, rnd(.35, .75), { k: 'f', h: rnd(8, 50), s: rnd(8, 16) * sc, d: .97 })); }
          wing(d, segs[5], fl, true);
          for (i = N - 1; i >= 0; i--) {
            var p = segs[i], r = Math.max(2.5, (12 - i * .46)) * sc; cx.fillStyle = d.c; cx.beginPath(); cx.arc(p[0], p[1], r, 0, 6.283); cx.fill();
            cx.fillStyle = '#e2c56b'; cx.beginPath(); cx.arc(p[0], p[1] + r * .35, r * .55, 0, 6.283); cx.fill();
            if (i % 2 === 0 && i > 0) { cx.fillStyle = d.c2; cx.beginPath(); cx.moveTo(p[0] - 3 * sc, p[1] - r + 1); cx.lineTo(p[0], p[1] - r - 7 * sc); cx.lineTo(p[0] + 3 * sc, p[1] - r + 1); cx.fill(); }
          }
          wing(d, segs[4], fl * .9 + .1, false);
          var dir = d.dir; cx.fillStyle = d.c; cx.beginPath(); cx.ellipse(h[0] + dir * 14 * sc, h[1], 21 * sc, 11 * sc, 0, 0, 6.283); cx.fill();
          cx.fillStyle = d.c2; cx.beginPath(); cx.moveTo(h[0] - dir * 2 * sc, h[1] - 9 * sc); cx.lineTo(h[0] - dir * 24 * sc, h[1] - 22 * sc); cx.lineTo(h[0] + dir * 4 * sc, h[1] - 6 * sc); cx.fill();
          cx.fillStyle = '#ffdd33'; cx.beginPath(); cx.arc(h[0] + dir * 16 * sc, h[1] - 4 * sc, 3.2 * sc, 0, 6.283); cx.fill(); cx.fillStyle = '#111'; cx.beginPath(); cx.arc(h[0] + dir * 17 * sc, h[1] - 4 * sc, 1.4 * sc, 0, 6.283); cx.fill();
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
    { id: 'react', title: 'Reaction App', sub: 'Test your reactions', url: 'https://reactionapp.life/app/', ic: 'M12 3a9 9 0 1 0 .1 0zM8.5 10h.01M15.5 10h.01M8 15c2 2 6 2 8 0' },
    { id: 'tenseg', title: 'Tensegrity physics sim', sub: 'Pluck a living structure', url: 'https://universemodel.ai/simulation.html', ic: 'M5 5l14 14M19 5 5 19M5 5h14v14H5z' }
  ];
  function icon(d) { var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('aria-hidden', 'true'); var p = doc.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d', d); s.appendChild(p); return s; }
  function fxBtn(e) { var b = el('button', 'fb'); b.type = 'button'; b.setAttribute('data-fx', e.name); b.appendChild(icon(e.ic || 'M12 3v18M3 12h18')); b.appendChild(el('span', '', e.label || e.name)); b.addEventListener('click', function () { choose(e.name); }); return b; }
  function section(title, nodes, cls) { var h = el('h3', '', title); fzm.appendChild(h); var g = el('div', cls || 'grid'); g.setAttribute('role', 'group'); g.setAttribute('aria-label', title); nodes.forEach(function (n) { g.appendChild(n); }); fzm.appendChild(g); }
  function buildMenu() {
    if (!fzm) {
      fzm = el('div', 'hmr-fzm'); fzm.id = 'hmr-fzm'; fzm.hidden = true; fzm.setAttribute('role', 'dialog'); fzm.setAttribute('aria-modal', 'true'); fzm.setAttribute('aria-label', 'Funsies');
      fzm.addEventListener('keydown', menuKey); doc.body.appendChild(fzm);
    }
    fzm.textContent = '';
    var hd = el('div', 'hd'); hd.appendChild(el('span', '', 'Funsies')); var x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close Funsies'); x.addEventListener('click', function () { closeFz(true); }); hd.appendChild(x); fzm.appendChild(hd);
    var rec = loadRecents().map(effByName).filter(Boolean); if (rec.length) section('Recent', rec.map(fxBtn));
    section('Play', PLAY.map(function (p) { var b = el('button', 'card'); b.type = 'button'; b.setAttribute('data-play', p.id); b.appendChild(icon(p.ic)); b.appendChild(el('span', '', p.title)); b.appendChild(el('small', '', p.sub)); b.addEventListener('click', function () { openPlay(p); }); return b; }), 'play');
    section('Wreck the page', EFFECTS.filter(function (e) { return e.group === 'wreck'; }).map(fxBtn));
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
    stopFunsies(true); hideAgain(); if (panel && !panel.hidden) closeRx(false); closePlay(false); closeSheet(false); closeSpeak(false); hideHlm();
    buildMenu(); fzm.hidden = false; fzBtn.setAttribute('aria-expanded', 'true');
    doc.addEventListener('pointerdown', outside, true);
    var f = fzm.querySelector('.fb,.card'); if (f) { try { f.focus({ preventScroll: true }); } catch (e) { f.focus(); } }
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
    var a = el('a', '', 'Open in new tab'); a.href = p.url; a.target = '_blank'; a.rel = 'noopener'; bar.appendChild(a); win.appendChild(bar);
    var x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close ' + p.title); x.addEventListener('click', function () { closePlay(true); }); win.appendChild(x);
    var fr = doc.createElement('iframe'), loaded = false; fr.name = 'hmr-embed'; fr.title = p.title; fr.setAttribute('allow', 'fullscreen; autoplay; accelerometer; gyroscope'); fr.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    fr.addEventListener('load', function () { loaded = true; clearTimeout(povT); });
    fr.src = p.url; win.appendChild(fr); povEl._fr = fr; povEl.addEventListener('keydown', povKey); doc.body.appendChild(povEl); root.classList.add('hmr-pov-on');
    povT = setTimeout(function () { if (!loaded) fallback(p); }, 4000);
    try { x.focus({ preventScroll: true }); } catch (e) { x.focus(); }
  }
  function fallback(p) {
    if (!povEl) return; var w = null; try { w = window.open(p.url, '_blank'); if (w) w.opener = null; } catch (e) { }
    window.HMRDock && (window.HMRDock.lastFallback = p.url);
    if (w) { closePlay(true); return; }
    if (povEl._fr) povEl._fr.remove(); var m = el('div', 'msg'); m.appendChild(el('p', '', 'This could not open here.')); var a = el('a', '', 'Open ' + p.title + ' in a new tab'); a.href = p.url; a.target = '_blank'; a.rel = 'noopener'; m.appendChild(a); povEl._win.appendChild(m);
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
  var BAD = '[data-hmr-dock],.hmr-rxp,.hmr-fzm,.hmr-fbp,.hmr-spk,.hmr-hlm,.hmr-pov,.hmr-dx,.hmr-toast,textarea,input,select,script,style,[contenteditable="true"]';
  function badNode(a) { try { if (a && a.closest) { if (a.closest(BAD)) return true; if (ps && a.closest(ps)) return true; if (ds && a.closest(ds)) return true; } } catch (e) { } return false; }

  // ---- Microsoft Clarity (click tracking), once
  (function () {
    try {
      if (window.clarity || window.__hmrClarity) return;
      if (doc.querySelector('script[src*="clarity.ms/tag"]')) return;
      window.__hmrClarity = 1;
      (function (c, l, a, r, i, t, y) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
        t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
        y = l.getElementsByTagName(r)[0]; if (y && y.parentNode) y.parentNode.insertBefore(t, y); else (l.head || l.documentElement).appendChild(t);
      })(window, doc, 'clarity', 'script', 'ziagxt1es9');
    } catch (e) { }
  })();

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
    if (!key || !window.fetch) { var r0 = mailSelf(p); r0.reason = key ? 'no-fetch' : 'no-key'; return Promise.resolve(r0); }
    fields.access_key = key; fields.botcheck = '';
    var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { try { if (ctl) ctl.abort(); } catch (e) { } }, 15000);
    return fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(fields), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && !(j && j.success === false) }; }, function () { return { ok: r.ok }; }); })
      .then(function (res) { clearTimeout(t); if (res.ok) return { ok: true, via: 'web3forms' }; var r1 = mailSelf(p); r1.reason = 'http'; return r1; },
        function () { clearTimeout(t); var r2 = mailSelf(p); r2.reason = 'network'; return r2; });
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

  // ---- styles for the new parts
  var PILL = 'pointer-events:auto;position:fixed;bottom:' + BASE + ';margin:0 0 4px;height:46px;border:2px solid #fff;border-radius:999px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;padding:0 14px;font-size:14px;font-weight:800;letter-spacing:.01em;white-space:nowrap;box-shadow:0 6px 20px rgba(0,0,0,.38);-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform .25s,opacity .2s;transform:none';
  styleEl.textContent += [
    '.hmr-dock{--hmr-fw:116px;--hmr-nw:56px;--hmr-sw:46px;--hmr-g:6px;--hmr-sh:calc((var(--hmr-g) + var(--hmr-sw)) / -2)}',
    '@media (max-width:480px){.hmr-dock{--hmr-fw:84px;--hmr-nw:44px;--hmr-sw:44px;--hmr-g:4px}}@media (max-width:340px){.hmr-dock{--hmr-fw:66px;--hmr-nw:36px;--hmr-sw:36px;--hmr-g:3px}.hmr-fzbtn{font-size:13px!important}}',
    '.hmr-fzbtn{width:var(--hmr-fw)!important;margin-left:calc(var(--hmr-fw) / -2 + var(--hmr-sh))!important}',
    '.hmr-nv,.hmr-spbtn{' + PILL + '}',
    '.hmr-nv{width:var(--hmr-c);height:var(--hmr-c);padding:0;margin:0;border-radius:50%}.hmr-nv svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}',
    '.hmr-nv.back{left:' + LEFT + ';right:auto;background:linear-gradient(135deg,#06b6d4,#3b82f6)}',
    '.hmr-nv.fwd{right:' + RIGHT + ';left:auto;background:linear-gradient(135deg,#8b5cf6,#06b6d4)}',
    '.hmr-nv.off{opacity:.45;filter:grayscale(.7);cursor:default}',
    '.hmr-spbtn{left:50%;width:var(--hmr-sw);height:var(--hmr-sw);padding:0;margin:0 0 calc((var(--hmr-c) - var(--hmr-sw)) / 2);margin-left:calc(var(--hmr-fw) / 2 + var(--hmr-g) + var(--hmr-sh));background:linear-gradient(135deg,#ec4899,#f59e0b 55%,#22c55e)}.hmr-spbtn svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
    '.hmr-spbtn:hover{transform:rotate(-3deg) scale(1.08)}.hmr-spbtn:active{transform:scale(.94)}.hmr-spbtn[aria-expanded="true"]{background:linear-gradient(135deg,#dc2626,#7f1d1d)}',
    '.hmr-nv:not(.off):hover{transform:rotate(-3deg) scale(1.06)}.hmr-nv:not(.off):active{transform:scale(.95)}',
    '@media (prefers-reduced-motion:reduce){.hmr-nv,.hmr-spbtn{transition:none}.hmr-nv:hover,.hmr-spbtn:hover{transform:none!important}}',
    '.hmr-nv:focus-visible,.hmr-fbp button:focus-visible,.hmr-fbp textarea:focus-visible,.hmr-fbp input:focus-visible,.hmr-hlm button:focus-visible,.hmr-dx button:focus-visible,.hmr-dx textarea:focus-visible,.hmr-dx select:focus-visible,.hmr-dsp button:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}',
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
    '.hmr-spk{position:fixed;left:50%;bottom:calc(' + BASE + ' + 64px);transform:translateX(-50%);z-index:99993;width:min(400px,calc(100vw - 24px));max-height:min(88vh,calc(100vh - 110px));overflow:auto;overscroll-behavior:contain;background:#fff;color:#111;border:2px solid #111;border-radius:16px;padding:12px;box-shadow:0 14px 44px rgba(0,0,0,.45);font:500 13px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;text-align:left;text-transform:none;letter-spacing:0}',
    '.hmr-spk[hidden]{display:none}.hmr-spk *{box-sizing:border-box;font-family:inherit}',
    '.hmr-spk .hd{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;font-weight:800;font-size:17px;line-height:1.25;margin:0 0 4px}',
    '.hmr-spk .x{min-width:34px;min-height:34px;border:1px solid #bbb;background:#f6f6f6;color:#111;border-radius:8px;font-size:20px;line-height:1;cursor:pointer;padding:0 8px}',
    '.hmr-spk p{margin:0 0 6px}.hmr-spk .sub{color:#222;font-weight:600;text-align:center}',
    '.hmr-spk .hmr-mic{width:92px;height:92px;min-height:0;margin:4px auto 6px;border-radius:50%;flex-direction:column;gap:2px;font-size:12px;padding:0;background:linear-gradient(135deg,#ec4899,#f59e0b 55%,#22c55e)}',
    '.hmr-spk .hmr-mic .e{font-size:34px}.hmr-spk .hmr-mic.rec{background:linear-gradient(135deg,#dc2626,#7f1d1d)}',
    '.hmr-spk .st{min-height:1.4em;font-size:12.5px;color:#333;margin:2px 0 4px;text-align:center}',
    '.hmr-spk label{display:block;font-weight:700;margin:6px 0 3px}',
    '.hmr-spk textarea,.hmr-spk input[type=email]{width:100%;border:2px solid #9aa4b5;border-radius:10px;padding:8px 10px;font-size:15px;line-height:1.35;color:#111;background:#fff}',
    '.hmr-spk textarea{min-height:96px;resize:vertical}',
    '.hmr-spk .go{width:100%;min-height:46px;margin-top:8px;border:2px solid #fff;border-radius:12px;color:#fff;font-size:15px;font-weight:800;cursor:pointer;background:linear-gradient(135deg,#3b82f6,#8b5cf6);box-shadow:0 3px 10px rgba(0,0,0,.25)}',
    '.hmr-spk .go[disabled]{opacity:.6;cursor:wait}',
    '.hmr-spk button:focus-visible,.hmr-spk textarea:focus-visible,.hmr-spk input:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}',
    '@media (max-width:600px){.hmr-spk{left:' + LEFT + ';right:' + RIGHT + ';transform:none;width:auto}}',
    // highlight menu + marks
    'mark.hmr-hl{background:#ffe066;color:#111;border-radius:2px;padding:0;box-shadow:0 0 0 1px rgba(245,158,11,.5)}',
    '.hmr-hlm{position:fixed;z-index:99994;display:flex;flex-wrap:wrap;gap:4px;max-width:calc(100vw - 16px);background:#111;border:2px solid #fff;border-radius:12px;padding:5px;box-shadow:0 8px 26px rgba(0,0,0,.45);font:700 13px/1 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}',
    '.hmr-hlm:after{content:"";position:absolute;left:var(--cx,50%);bottom:-9px;width:14px;height:14px;margin-left:-7px;background:#111;border-right:2px solid #fff;border-bottom:2px solid #fff;transform:rotate(45deg)}',
    '.hmr-hlm.below:after{bottom:auto;top:-9px;transform:rotate(225deg)}',
    '.hmr-hlm button{min-height:38px;border:0;border-radius:8px;padding:0 10px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:5px}',
    '.hmr-hlm button:nth-child(1){background:#b45309}.hmr-hlm button:nth-child(2){background:#1d4ed8}.hmr-hlm button:nth-child(3){background:#0f766e}.hmr-hlm button:nth-child(4){background:#a21caf}',
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
    '.hmr-tw{position:relative;display:block}.hmr-tw textarea{display:block;padding-bottom:44px!important}.hmr-tmic{position:absolute;right:22px;bottom:7px;width:32px;height:32px;min-width:0;min-height:0;padding:0;margin:0;border-radius:50%;border:2px solid #fff;background:linear-gradient(135deg,#ec4899,#f59e0b 55%,#22c55e);color:#fff!important;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.3)}.hmr-tmic[hidden]{display:none}.hmr-tmic svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;display:block}.hmr-tmic.rec{background:linear-gradient(135deg,#dc2626,#7f1d1d)}.hmr-tmic:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}',
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
    '.hmr-tier a.hmr-tl .st{font-size:17px;line-height:1;background:linear-gradient(135deg,#fff1a8,#f5c518 45%,#b8860b);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;filter:drop-shadow(0 0 .6px rgba(110,70,0,.9))}',
    '.hmr-tier a.hmr-tl:hover{filter:brightness(1.04);box-shadow:0 1px 0 rgba(255,255,255,.9) inset,0 3px 12px rgba(160,110,0,.35)}.hmr-tier a.hmr-tl:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}',
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
  var spBtn = mkPill('hmr-spbtn', 'hmr-speak', 'Speak here: say anything and someone will listen', '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/></svg>');
  spBtn.title = 'Speak here'; spBtn.setAttribute('aria-haspopup', 'dialog'); spBtn.setAttribute('aria-expanded', 'false'); spBtn.setAttribute('aria-controls', 'hmr-spk');
  // The Feedback and "I'm lost" pill buttons are no longer in the dock. fbBtn / lostBtn stay as detached stand-ins so the sheet code (and HMRDock.openFeedback / openLost) keeps working.
  var fbBtn = mkPill('hmr-fbbtn', 'hmr-feedback', 'Feedback', ''), lostBtn = mkPill('hmr-lostbtn', 'hmr-lost', 'I\'m lost', '');
  backBtn.title = 'Back'; fwdBtn.title = 'Forward';
  dock.textContent = '';
  [backBtn, fzBtn, spBtn, rxBtn, fwdBtn, again].forEach(function (b) { dock.appendChild(b); });
  function navState() { var off = (history.length < 2); [backBtn, fwdBtn].forEach(function (b) { b.classList.toggle('off', off); b.setAttribute('aria-disabled', off ? 'true' : 'false'); }); }
  backBtn.addEventListener('click', function () { if (history.length < 2) return; try { history.back(); } catch (e) { } });
  fwdBtn.addEventListener('click', function () { if (history.length < 2) return; try { history.forward(); } catch (e) { } });
  navState(); window.addEventListener('pageshow', navState); window.addEventListener('popstate', navState);

  // ---- speech to text: a transcript you can edit, never cleared by an error
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function makeMic(ta, btn, stat, onChange) {
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
          if (want) setTimeout(function () { if (want) begin(); }, 250); else { label(false); if (!/blocked|found|connection/.test(stat ? stat.textContent : '')) say(ta.value ? 'Stopped. Your words are saved. Edit them if you like.' : ''); }
        };
        rec.start(); label(true); say('Listening. Talk as long as you like. You can fix words any time.');
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
  function saveDraft() { if (!fb) return; jset(draftKey(fbMode), { t: fb.ta.value, e: fb.em.value, q: fbQuote }); }
  function buildSheet() {
    fb = {}; var s = el('div', 'hmr-fbp'); s.id = 'hmr-fbp'; s.hidden = true; s.setAttribute('role', 'dialog'); s.setAttribute('aria-modal', 'true'); fb.el = s;
    var hd = el('div', 'hd'); fb.title = el('span'); var x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.addEventListener('click', function () { closeSheet(true); }); hd.appendChild(fb.title); hd.appendChild(x); s.appendChild(hd);
    fb.sub = el('p', 'sub'); s.appendChild(fb.sub);
    fb.ctx = el('p', 'ctx'); s.appendChild(fb.ctx);
    fb.q = el('blockquote'); s.appendChild(fb.q);
    fb.mst = el('p', 'st'); fb.mst.setAttribute('role', 'status'); fb.mst.setAttribute('aria-live', 'polite'); s.appendChild(fb.mst);
    var l1 = el('label', '', 'Your words (you can edit them any time)'); l1.setAttribute('for', 'hmr-fb-text'); s.appendChild(l1);
    fb.ta = el('textarea'); fb.ta.id = 'hmr-fb-text'; fb.ta.rows = 6; fb.ta.setAttribute('autocomplete', 'off'); s.appendChild(fb.ta); fb.mic = wrapMic(fb.ta);
    var l2 = el('label', '', 'Your email, if you want a reply (optional)'); l2.setAttribute('for', 'hmr-fb-email'); s.appendChild(l2);
    fb.em = el('input'); fb.em.type = 'email'; fb.em.id = 'hmr-fb-email'; fb.em.setAttribute('autocomplete', 'email'); s.appendChild(fb.em);
    var two = el('div', 'two');
    fb.bm = el('button', 'go m', '✉️ Send from my email'); fb.bm.type = 'button';
    fb.ba = el('button', 'go a', '🕶️ Submit anonymously'); fb.ba.type = 'button';
    two.appendChild(fb.bm); two.appendChild(fb.ba); s.appendChild(two);
    fb.st = el('p', 'st'); fb.st.setAttribute('role', 'status'); fb.st.setAttribute('aria-live', 'polite'); s.appendChild(fb.st);
    s.appendChild(el('p', 'sub', 'Anonymous means we do not get your email or name. Your words save on this device until they are sent.'));
    fb.micApi = makeMic(fb.ta, fb.mic, fb.mst, saveDraft);
    fb.ta.addEventListener('input', saveDraft); fb.em.addEventListener('input', saveDraft);
    s.addEventListener('keydown', sheetKey);
    function compose() {
      var txt = fb.ta.value.trim(), parts = [];
      if (fbQuote) parts.push('About this passage: "' + fbQuote + '"');
      if (txt) parts.push(txt);
      if (fbMode === 'lost' && fbCtx) parts.push(ctxLine(fbCtx));
      return { txt: txt, message: parts.join('\n\n'), kind: fbMode === 'lost' ? 'lost' : (fbQuote ? 'highlight' : 'feedback') };
    }
    function need(c) { if (c.txt) return true; fb.st.textContent = 'Add a few words first, or tap the microphone and talk.'; try { fb.ta.focus(); } catch (e) { } return false; }
    fb.bm.addEventListener('click', function () {
      var c = compose(); if (!need(c)) return; saveDraft();
      mailSelf({ kind: c.kind, message: c.message, email: fb.em.value.trim(), details: fbCtx || undefined });
      fb.st.textContent = MAIL_LINE;
    });
    fb.ba.addEventListener('click', function () {
      var c = compose(); if (!need(c)) return; saveDraft(); fb.st.textContent = 'Sending...'; fb.ba.disabled = true;
      send({ kind: c.kind, message: c.message, details: fbCtx || undefined }).then(function (r) {
        fb.ba.disabled = false;
        if (r.ok) { fb.ta.value = ''; fbQuote = ''; fb.q.hidden = true; ldel(draftKey(fbMode)); fb.st.textContent = SENT_LINE; fb.micApi.stop(); }
        else fb.st.textContent = MAIL_LINE;
      });
    });
    doc.body.appendChild(s);
  }
  function openSheet(mode, o) {
    o = o || {}; closeOthers('sheet');
    if (!fb) buildSheet();
    if (fb.micApi) fb.micApi.stop();
    fbMode = mode; fbCtx = mode === 'lost' ? lostCtx() : null;
    var d = jget(draftKey(mode), {});
    fb.ta.value = d.t || ''; fb.em.value = d.e || ''; fbQuote = o.quote || (mode === 'feedback' ? (d.q || '') : '');
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
    if (keep !== 'ds') { try { closeOwn(false); } catch (e) { } }
    if (keep !== 'sheet') closeSheet(false);
    if (keep !== 'sp') closeSpeak(false);
    if (keep !== 'hl') hideHlm();
    if (keep !== 'fz') { try { closeFz(false); } catch (e) { } }
    if (keep !== 'rx') { try { if (panel && !panel.hidden) closeRx(false); } catch (e) { } }
  }

  // ---- Speak here: a mic popup. Say anything; it transcribes; Send mails it as kind "speak" (anonymous unless an email is added).
  var sp = null, SPKEY = 'hmr-draft-v1:speak';
  function saveSpeak() { if (sp) jset(SPKEY, { t: sp.ta.value, e: sp.em.value }); }
  function spKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); closeSpeak(true); return; }
    if (e.key === 'Tab' && sp && !sp.el.hidden) {
      var f = [].filter.call(sp.el.querySelectorAll('button,textarea,input'), function (b) { return !b.disabled && b.offsetParent !== null; }); if (!f.length) return;
      var i = f.indexOf(doc.activeElement);
      if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && (i === f.length - 1 || i < 0)) { f[0].focus(); e.preventDefault(); }
    }
  }
  function buildSpeak() {
    sp = {}; var s = el('div', 'hmr-spk'); s.id = 'hmr-spk'; s.hidden = true; s.setAttribute('role', 'dialog'); s.setAttribute('aria-label', 'Do us a big favor. Tell us what you think.'); sp.el = s;
    var hd = el('div', 'hd'); hd.appendChild(el('span', '', '💛 Do us a big favor. Tell us what you think.')); var x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.addEventListener('click', function () { closeSpeak(true); }); hd.appendChild(x); s.appendChild(hd);
    s.appendChild(el('p', 'sub', 'Speak here and someone will listen.'));
    sp.mst = el('p', 'st'); sp.mst.setAttribute('role', 'status'); sp.mst.setAttribute('aria-live', 'polite'); s.appendChild(sp.mst);
    var l1 = el('label', '', SR ? 'Your words (you can edit them)' : 'Type here'); l1.setAttribute('for', 'hmr-sp-text'); s.appendChild(l1);
    sp.ta = el('textarea'); sp.ta.id = 'hmr-sp-text'; sp.ta.rows = 4; sp.ta.setAttribute('autocomplete', 'off'); if (!SR) sp.ta.placeholder = 'type here'; s.appendChild(sp.ta); sp.mic = wrapMic(sp.ta);
    var l2 = el('label', '', 'Your email, only if you want a reply (optional)'); l2.setAttribute('for', 'hmr-sp-email'); s.appendChild(l2);
    sp.em = el('input'); sp.em.type = 'email'; sp.em.id = 'hmr-sp-email'; sp.em.setAttribute('autocomplete', 'email'); s.appendChild(sp.em);
    sp.go = el('button', 'go', 'Send'); sp.go.type = 'button'; s.appendChild(sp.go);
    sp.st = el('p', 'st'); sp.st.setAttribute('role', 'status'); sp.st.setAttribute('aria-live', 'polite'); s.appendChild(sp.st);
    if (SR) sp.micApi = makeMic(sp.ta, sp.mic, sp.mst, saveSpeak);
    else { sp.mic.hidden = true; sp.mst.textContent = 'Voice typing is not available in this browser. Type here instead.'; sp.micApi = { stop: function () { } }; }
    sp.ta.addEventListener('input', saveSpeak); sp.em.addEventListener('input', saveSpeak); s.addEventListener('keydown', spKey);
    sp.go.addEventListener('click', function () {
      var txt = sp.ta.value.trim();
      if (!txt) { sp.st.textContent = 'Say or type a few words first.'; try { sp.ta.focus(); } catch (e) { } return; }
      saveSpeak(); sp.micApi.stop(); sp.st.textContent = 'Sending...'; sp.go.disabled = true;
      send({ kind: 'speak', message: txt, email: sp.em.value.trim() }).then(function (r) {
        sp.go.disabled = false;
        if (r.ok) { sp.ta.value = ''; ldel(SPKEY); sp.st.textContent = SENT_LINE; setTimeout(function () { if (sp && !sp.el.hidden) closeSpeak(true); }, 1500); }
        else sp.st.textContent = MAIL_LINE;
      });
    });
    doc.body.appendChild(s);
  }
  function openSpeak() {
    closeOthers('sp'); stopFunsies(true); closePlay(false);
    if (!sp) buildSpeak();
    var d = jget(SPKEY, {}); sp.ta.value = d.t || ''; sp.em.value = d.e || ''; sp.st.textContent = d.t ? 'Your unsent words from last time are here.' : '';
    sp.el.hidden = false; spBtn.setAttribute('aria-expanded', 'true');
    if (SR) { sp.mic.click(); } else { try { sp.ta.focus({ preventScroll: true }); } catch (e) { sp.ta.focus(); } }
  }
  function closeSpeak(back) {
    if (!sp || sp.el.hidden) return; if (sp.micApi) sp.micApi.stop(); saveSpeak(); sp.el.hidden = true; spBtn.setAttribute('aria-expanded', 'false');
    if (back) { try { spBtn.focus({ preventScroll: true }); } catch (e) { spBtn.focus(); } }
  }
  spBtn.addEventListener('click', function () { if (sp && !sp.el.hidden) closeSpeak(true); else openSpeak(); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sp && !sp.el.hidden) closeSpeak(true); });

  // ---- highlight + caret menu
  var HLKEY = 'hmr-hl-v1:' + location.pathname, hlm = null, hlData = null, mouseDown = false, selT = 0;
  function hlHash(t, n) { var h = 5381, s = t + '|' + n; for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function flatText() {
    var tw = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, { acceptNode: function (n) { var p = n.parentNode; if (!p || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/.test(p.nodeName)) return NodeFilter.FILTER_REJECT; if (p.closest && p.closest('[data-hmr-dock],.hmr-rxp,.hmr-fzm,.hmr-fbp,.hmr-spk,.hmr-hlm,.hmr-pov,.hmr-dx,.hmr-toast')) return NodeFilter.FILTER_REJECT; return NodeFilter.FILTER_ACCEPT; } });
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
  function wrapRange(r, id) {
    var rt = r.commonAncestorContainer; if (rt.nodeType === 3) rt = rt.parentNode;
    var tw = doc.createTreeWalker(rt, NodeFilter.SHOW_TEXT, null), nodes = [], n;
    if (r.commonAncestorContainer.nodeType === 3) nodes.push(r.commonAncestorContainer);
    else while ((n = tw.nextNode())) { if (r.intersectsNode(n)) nodes.push(n); }
    nodes.forEach(function (nd) {
      if (nd.parentNode && nd.parentNode.closest && nd.parentNode.closest('[data-hmr-dock],.hmr-fbp,.hmr-spk,.hmr-hlm,.hmr-dx')) return;
      var s = nd === r.startContainer ? r.startOffset : 0, e = nd === r.endContainer ? r.endOffset : nd.nodeValue.length;
      if (e <= s || !nd.nodeValue.slice(s, e).trim()) return;
      var mid = nd; if (s > 0) mid = nd.splitText(s); if (e - s < mid.nodeValue.length) mid.splitText(e - s);
      var m = el('mark', 'hmr-hl'); m.setAttribute('data-hl', id); mid.parentNode.insertBefore(m, mid); m.appendChild(mid);
    });
  }
  function hlList() { var a = jget(HLKEY, []); return Array.isArray(a) ? a : []; }
  function addHighlight(info) {
    var t = info.t, f = flatText(), occ = occurrences(f, t), nth = 0;
    var sc = info.r.startContainer, so = info.r.startOffset;
    for (var i = 0; i < occ.length; i++) { var mp = f.map[occ[i]]; if (mp && mp[0] === sc && mp[1] >= so - 1 && mp[1] <= so + 1) { nth = i; break; } }
    var id = hlHash(t, nth); if (hlList().some(function (h) { return h.id === id; })) return;
    wrapRange(info.r, id);
    var a = hlList(); a.push({ id: id, t: t, n: nth }); jset(HLKEY, a.slice(-100));
    try { getSelection().removeAllRanges(); } catch (e) { }
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
  function removeHighlight(id) {
    [].slice.call(doc.querySelectorAll('mark.hmr-hl[data-hl="' + id + '"]')).forEach(function (m) { var p = m.parentNode; if (!p) return; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); p.normalize(); });
    jset(HLKEY, hlList().filter(function (h) { return h.id !== id; }));
  }
  function selInfo() {
    var s = getSelection(); if (!s || s.rangeCount === 0 || s.isCollapsed) return null;
    var r = s.getRangeAt(0), t = s.toString().replace(/\s+/g, ' ').trim(); if (t.length < 2 || t.length > 1500) return null;
    var a = r.commonAncestorContainer; a = a.nodeType === 1 ? a : a.parentElement; if (!a || badNode(a) || !doc.body.contains(a)) return null;
    return { r: r.cloneRange(), t: t };
  }
  function pageLink(t) { var u = location.href.split('#')[0]; return t ? u + '#:~:text=' + encodeURIComponent(t.slice(0, 300)).replace(/-/g, '%2D') : u; }
  function buildHlm() {
    hlm = el('div', 'hmr-hlm'); hlm.hidden = true; hlm.setAttribute('role', 'toolbar'); hlm.setAttribute('aria-label', 'Selected text');
    function b(txt, em, fn) { var x = el('button'); x.type = 'button'; x.innerHTML = '<span aria-hidden="true">' + em + '</span><span></span>'; x.lastChild.textContent = txt; x.addEventListener('click', fn); hlm.appendChild(x); return x; }
    hlm._h = b('Highlight', '🖍️', function () { var d = hlData; hideHlm(); if (!d) return; if (d.id) removeHighlight(d.id); else addHighlight(d); });
    b('Email me', '✉️', function () { var d = hlData; hideHlm(); if (d) openMail('mailto:?subject=' + encodeURIComponent('A note from ' + CFG.site) + '&body=' + encodeURIComponent('“' + d.t + '”\n\n' + pageLink(d.t))); });
    b('Share', '🔗', function (ev) {
      var pt = ev && ev.clientX != null ? { x: ev.clientX, y: ev.clientY } : null, d = hlData; hideHlm(); if (!d) return; var u = pageLink(d.t);
      if (navigator.share) { navigator.share({ title: doc.title || CFG.site, text: '“' + d.t.slice(0, 300) + '”', url: u }).catch(function () { }); }
      else copyText(u).then(function (ok) { toast(ok ? 'Link copied. Anyone who opens it lands on this exact text.' : 'Could not copy. The link is ' + u, pt, 5000); });
    });
    b('Feedback', '💬', function () { var d = hlData; hideHlm(); clearTimeout(selT); if (!d) return; try { getSelection().removeAllRanges(); } catch (e) { } openSheet('feedback', { quote: d.t.slice(0, 400) }); });
    hlm.addEventListener('mousedown', function (e) { e.preventDefault(); });
    hlm.addEventListener('keydown', function (e) { if (e.key === 'Escape') { hideHlm(); } });
    doc.body.appendChild(hlm);
  }
  function hideHlm() { if (hlm) hlm.hidden = true; hlData = null; }
  function showHlm(d, rect) {
    if (!hlm) buildHlm(); hlData = d; closeSheetQuiet();
    hlm._h.lastChild.textContent = d.id ? 'Remove highlight' : 'Highlight'; hlm._h.firstChild.textContent = d.id ? '🧽' : '🖍️';
    hlm.hidden = false; hlm.classList.remove('below');
    var w = hlm.offsetWidth, h = hlm.offsetHeight, cx = rect.left + rect.width / 2, left = clamp(cx - w / 2, 8, Math.max(8, innerWidth - w - 8));
    var below = coarse() || rect.top - h - 14 < 8, top = below ? rect.bottom + 14 : rect.top - h - 14;
    top = clamp(top, 8, Math.max(8, innerHeight - h - 8)); if (below) hlm.classList.add('below');
    hlm.style.left = left + 'px'; hlm.style.top = top + 'px'; hlm.style.setProperty('--cx', clamp(cx - left, 16, w - 16) + 'px');
  }
  function closeSheetQuiet() { if (fb && !fb.el.hidden) closeSheet(false); }
  function considerSelection() {
    if (mouseDown || (fb && !fb.el.hidden) || (sp && !sp.el.hidden)) return; var i = selInfo();
    if (!i) { if (hlm && !hlm.hidden && !hlData.id) hideHlm(); return; }
    var rs = i.r.getClientRects(), rect = rs.length ? rs[rs.length - 1] : i.r.getBoundingClientRect();
    if (!rect || (!rect.width && !rect.height)) return;
    var first = rs.length ? rs[0] : rect, box = { left: Math.min(first.left, rect.left), width: Math.max(rect.right, first.right) - Math.min(first.left, rect.left), top: first.top, bottom: rect.bottom };
    i.id = null; showHlm(i, box);
  }
  doc.addEventListener('selectionchange', function () { clearTimeout(selT); if ((fb && !fb.el.hidden) || (sp && !sp.el.hidden)) return; if (hlm && !hlm.hidden && hlData && !hlData.id) hlm.hidden = true; selT = setTimeout(considerSelection, coarse() ? 450 : 250); });
  doc.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'touch') mouseDown = true; if (hlm && !hlm.hidden && !hlm.contains(e.target)) hideHlm(); }, true);
  doc.addEventListener('pointerup', function () { mouseDown = false; clearTimeout(selT); selT = setTimeout(considerSelection, 60); }, true);
  window.addEventListener('scroll', function () { if (hlm && !hlm.hidden) hideHlm(); }, { passive: true });
  doc.addEventListener('click', function (e) {
    var m = e.target && e.target.closest && e.target.closest('mark.hmr-hl'); if (!m || e.target.closest('a')) return;
    var s = getSelection(); if (s && !s.isCollapsed) return;
    var id = m.getAttribute('data-hl'), rect = m.getBoundingClientRect(), t = (m.textContent || '').trim(), item = hlList().filter(function (h) { return h.id === id; })[0];
    showHlm({ id: id, t: item ? item.t : t, r: null }, { left: rect.left, width: rect.width, top: rect.top, bottom: rect.bottom });
  });
  function startHighlights() { restoreHighlights(); setTimeout(restoreHighlights, 700); setTimeout(restoreHighlights, 2500); }
  if (doc.readyState === 'complete') startHighlights(); else window.addEventListener('load', startHighlights);

  // ---- Design studio (v5): global options placed inside the site's own Design panel, or the dock's own Design panel when a site has none
  var DXKEY = 'hmr-dx-v1', RTKEY = 'hmr-dx-rt-v1', dx = jget(DXKEY, {});
  if (!dx || typeof dx !== 'object') dx = {};
  dx = { pointer: dx.pointer || 'default', anim: dx.anim || 'none', hover: dx.hover || 'none', gi: dx.gi | 0, th: dx.th || '' };
  var rt = jget(RTKEY, {}); if (!rt || typeof rt !== 'object' || Array.isArray(rt)) rt = {};
  function dxSave() { jset(DXKEY, dx); }
  function rtSave() { jset(RTKEY, rt); }
  var POINTERS = [['default', '🖱️', 'Default'], ['bullseye', '🎯', 'Bullseye'], ['large', '🔍', 'Large'], ['crosshair', '➕', 'Crosshair'], ['dot', '⚫', 'Dot'], ['star', '⭐', 'Star'], ['hand', '👆', 'Hand'], ['sparkle', '✨', 'Sparkle trail'], ['hearts', '💖', 'Hearts trail'], ['leaves', '🍃', 'Leaves trail'], ['snow', '❄️', 'Snow trail'], ['fire', '🔥', 'Fire trail'], ['music', '🎵', 'Music trail'], ['rainbow', '🌈', 'Rainbow trail']];
  var TRAILS = { sparkle: ['✨', '⭐', '✦', '💫'], hearts: ['💖', '💗', '💕'], leaves: ['🍃', '🍂', '🌿'], snow: ['❄️', '❅', '❆'], fire: ['🔥', '✨', '🧡'], music: ['🎵', '🎶', '♪'], rainbow: ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣'] };
  var ANIMS = [['none', '➖', 'None'], ['lift', '⬆️', 'Lift'], ['glow', '💡', 'Glow'], ['wobble', '🌊', 'Wobble']];
  var HOVERS = [['none', '➖', 'None'], ['underline', '〰️', 'Underline grow'], ['glow', '💡', 'Glow'], ['wiggle', '🌀', 'Wiggle'], ['marker', '🖍️', 'Highlight marker'], ['spacing', '↔️', 'Letter spacing']];

  // Themes: a theme is a set of look parameters; themeCSS() turns one into a single stylesheet for the whole host page.
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

  // Which elements a theme may touch: everything except the dock, its panels, the site's Design button and panel, and highlights.
  function okSel(s) { try { doc.createDocumentFragment().querySelector(s); return true; } catch (e) { return false; } }
  var EXLIST = ['[data-hmr-dock]', '.hmr-rxp', '.hmr-fzm', '.hmr-fbp', '.hmr-spk', '.hmr-hlm', '.hmr-pov', '.hmr-dx', '.hmr-dsp', '.hmr-toast', '.hmr-again', '.hmr-mark', '.hmr-fzcanvas', '.hmr-sp', '.hmr-spacer', '[data-hmr-tier-ribbon]', 'mark.hmr-hl', 'script', 'style', 'noscript'];
  [ds, ps].forEach(function (l) { if (l) l.split(',').forEach(function (s) { s = s.trim(); if (s && okSel(s) && EXLIST.indexOf(s) < 0) EXLIST.push(s); }); });
  var EXSEL = EXLIST.join(','), TX = ':not(' + EXSEL + '):not(' + EXLIST.map(function (s) { return s + ' *'; }).join(',') + ')';
  var ANIMKF = {
    fade: '0%{opacity:0}', slide: '0%{opacity:0;transform:translateX(-28px)}', pop: '0%{opacity:0;transform:scale(.88)}60%{transform:scale(1.03)}', rise: '0%{opacity:0;transform:translateY(22px)}',
    zoom: '0%{opacity:0;transform:scale(1.08)}', swing: '0%{opacity:0;transform:rotate(-3deg) translateY(10px)}', drop: '0%{opacity:0;transform:translateY(-26px)}'
  };
  function themeCSS(t, n) {
    function S(list) { return (typeof list === 'string' ? list.split('|') : list).map(function (s) { return 'body ' + s + TX; }).join(','); }
    var C = ['.card', '.site', '.idea', '[data-hmr-card]'], H = 'h1|h2|h3|h4|h5|h6', o = [], mob = '@media (max-width:600px){';
    function sizes(k) { return S('h1') + '{font-size:' + (2.2 * t.hz * k).toFixed(2) + 'rem!important}' + S('h2') + '{font-size:' + (1.6 * t.hz * k).toFixed(2) + 'rem!important}' + S('h3') + '{font-size:' + (1.25 * t.hz * k).toFixed(2) + 'rem!important}' + S('h4|h5|h6') + '{font-size:' + (1.05 * Math.max(t.hz, .95) * k).toFixed(2) + 'rem!important}'; }
    o.push('html{background:' + (t.bi ? t.bi + ',' : '') + t.b + '!important;font-size:' + t.fs + 'px!important;overflow-x:hidden}');
    o.push('body{background:transparent!important;color:' + t.f + '!important;font-family:' + t.ff + '!important;line-height:' + t.lh + '!important;letter-spacing:' + t.ls + '!important}');
    o.push(S('*') + '{color:' + t.f + '!important;background-color:transparent!important;background-image:none!important;border-color:' + t.cd + '!important}');
    o.push(S('*:not(code):not(pre):not(kbd):not(samp)') + '{font-family:' + t.ff + '!important;letter-spacing:' + t.ls + '}');
    o.push(S('p|li|dd|dt|blockquote|td|th|figcaption') + '{line-height:' + t.lh + '!important}');
    o.push(S(H) + '{color:' + t.h + '!important;font-family:' + t.hf + '!important;letter-spacing:' + t.hs + '!important;text-transform:' + t.ht + '!important;text-align:' + t.ha + '!important;font-weight:' + t.hw + '!important;font-style:' + t.hst + '!important;line-height:1.15!important;overflow-wrap:break-word}');
    o.push(sizes(1)); o.push(mob + sizes(.78) + '}');
    o.push(S('a') + '{color:' + t.l + '!important;text-decoration:' + t.lt + '!important;text-underline-offset:.18em;transition:color ' + t.sp + ',background-color ' + t.sp + ',text-shadow ' + t.sp + ',letter-spacing ' + t.sp + '}');
    var lh = { ul: 'text-decoration:underline!important;text-decoration-thickness:3px', bg: 'background-color:' + t.l + '!important;color:' + t.b + '!important;text-decoration:none!important', glow: 'text-shadow:0 0 .55em ' + t.l + ',0 0 1.1em ' + t.l, wide: 'letter-spacing:.06em', dash: 'text-decoration:underline dashed!important', none: '' }[t.lk];
    if (lh) o.push(S('a:hover|a:focus-visible') + '{' + lh + '}');
    o.push(S('button|input:not([type=checkbox]):not([type=radio])|select|textarea') + '{background-color:' + t.c + '!important;color:' + t.f + '!important;border:' + Math.max(t.bw, 1) + 'px ' + t.bs + ' ' + t.cd + '!important;border-radius:' + Math.min(t.r, 18) + 'px!important;font-family:' + t.ff + '!important;transition:transform ' + t.sp + ',box-shadow ' + t.sp + '}');
    o.push(S(C) + '{background-color:' + t.c + '!important;border:' + t.bw + 'px ' + t.bs + ' ' + t.cd + '!important;border-radius:' + t.r + 'px!important;box-shadow:' + t.sh + '!important;transition:transform ' + t.sp + ' ease,box-shadow ' + t.sp + ' ease}');
    o.push(S('[data-hmr-fix]') + '{background-color:' + t.b + '!important}');
    if (t.tl) {
      o.push(S(C.map(function (c) { return c + ':nth-child(odd)'; })) + '{transform:rotate(' + (-t.tl) + 'deg)}');
      o.push(S(C.map(function (c) { return c + ':nth-child(even)'; })) + '{transform:rotate(' + (t.tl * .7).toFixed(2) + 'deg)}');
    }
    var hv = { lift: 'transform:translateY(-5px) rotate(0deg)', grow: 'transform:scale(1.03) rotate(0deg)', glow: 'box-shadow:0 0 28px ' + t.h, shake: 'animation:hmrt-shake .45s', none: '' }[t.hv];
    if (hv && !(t.hv === 'shake' && rm())) o.push(S(C.map(function (c) { return c + ':hover'; })) + '{' + hv + '!important}');
    if (t.mw !== 'none') {
      o.push(S(['>header', '>main', '>section', '>footer', '>nav', '>article', '>.wrap', '>.container', '>.page', '>main>section', '>main>article', '>main>header', '>.wrap>section', '>.wrap>header', '>.wrap>footer', '>.wrap>article', '>.container>section', '>.container>header', '>.container>footer', '>.container>article']) + '{max-width:' + t.mw + '!important;margin-left:auto!important;margin-right:auto!important;box-sizing:border-box}');
    }
    o.push(S('section|article') + '{padding-top:' + t.gp + 'px!important;padding-bottom:' + t.gp + 'px!important}');
    o.push(S('img') + '{border-radius:' + t.r + 'px;box-shadow:' + t.sh + ';filter:' + t.imf + '}');
    o.push('::selection{background:' + t.l + ';color:' + t.b + '}');
    if (t.an !== 'none' && ANIMKF[t.an] && !rm()) {
      var nm = 'hmrt-' + t.an + '-' + n;
      o.push(S(['section', 'article', 'header', 'footer'].concat(C)) + '{animation:' + nm + ' ' + t.ad + ' ease-out backwards}');
      o.push('@keyframes ' + nm + '{' + ANIMKF[t.an] + '}');
    }
    o.push('@keyframes hmrt-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px) rotate(-1deg)}40%{transform:translateX(5px) rotate(1deg)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}');
    o.push('@media (prefers-reduced-motion:reduce){' + S('*') + '{animation:none!important;transition:none!important}}');
    return o.join('\n');
  }

  // Cards: before a theme is first applied, note which of the page's own elements have a border, fill, shadow, or are fixed/sticky.
  var themeEl = null, thN = 0;
  function markCards() {
    if (!doc.body) return;
    var sheet = themeEl && themeEl.parentNode ? themeEl.sheet : null; if (sheet) sheet.disabled = true;
    try {
      var all = doc.body.querySelectorAll('*'), cnt = 0, SK = /^(HTML|BODY|HEAD|SCRIPT|STYLE|HEADER|FOOTER|NAV|MAIN|A|BUTTON|INPUT|SELECT|TEXTAREA|SPAN|IMG|SVG|PATH|HR|BR|TR|TD|TH|THEAD|TBODY|TABLE|MARK|CODE|LABEL|B|I|EM|STRONG|SMALL|OPTION|CANVAS|VIDEO|IFRAME)$/i;
      for (var i = 0; i < all.length && i < 2500 && cnt < 400; i++) {
        var e = all[i]; if (e.hasAttribute('data-hmr-card') || e.hasAttribute('data-hmr-fix')) continue;
        try { if (e.closest(EXSEL)) continue; } catch (x) { }
        var cs = getComputedStyle(e);
        if (cs.position === 'fixed' || cs.position === 'sticky') { e.setAttribute('data-hmr-fix', ''); continue; }
        if (SK.test(e.nodeName)) continue;
        var r = e.getBoundingClientRect(); if (r.width < 80 || r.height < 30 || r.width > innerWidth * .92) continue;
        var bgc = cs.backgroundColor, m = /rgba?\(([^)]+)\)/.exec(bgc), a = m ? (m[1].split(',').length > 3 ? parseFloat(m[1].split(',')[3]) : 1) : 0;
        var bd = ['Top', 'Right', 'Bottom', 'Left'].some(function (s) { return parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none'; });
        if (a > .05 || bd || (cs.boxShadow && cs.boxShadow !== 'none')) { e.setAttribute('data-hmr-card', ''); cnt++; }
      }
    } catch (e) { }
    if (sheet) sheet.disabled = false;
  }
  function themeById(id) { return id ? THEME_BY_ID[id] || null : null; }
  function applyTheme() {
    var t = themeById(dx.th);
    if (!t) { if (themeEl && themeEl.parentNode) themeEl.parentNode.removeChild(themeEl); root.removeAttribute('data-hmr-theme'); return; }
    if (!doc.body) return;
    if (!themeEl) { themeEl = el('style'); themeEl.id = 'hmr-theme'; }
    markCards();
    themeEl.textContent = themeCSS(t, ++thN);
    if (!themeEl.parentNode) doc.head.appendChild(themeEl);
    root.setAttribute('data-hmr-theme', t.id);
  }

  // text hover effects (any page, theme or not) and pointers
  (function () {
    var tags = ['p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a', 'td', 'dd', 'blockquote', 'figcaption', 'summary'];
    function L(cls, pseudo, tl) { return (tl || tags).map(function (t) { return 'html.' + cls + ' body ' + t + TX + (pseudo || ''); }).join(','); }
    var c = 'hmr-th-underline';
    styleEl.textContent += L(c) + '{background-image:linear-gradient(currentColor,currentColor)!important;background-repeat:no-repeat!important;background-position:0 100%!important;background-size:0 2px!important;transition:background-size .3s ease!important}' + L(c, ':hover') + '{background-size:100% 2px!important}';
    c = 'hmr-th-glow'; styleEl.textContent += L(c) + '{transition:text-shadow .25s ease!important}' + L(c, ':hover') + '{text-shadow:0 0 .5em currentColor,0 0 1.1em currentColor!important}';
    c = 'hmr-th-wiggle'; styleEl.textContent += L(c, ':hover', tags.filter(function (t) { return t !== 'a'; })) + '{animation:hmrwig .5s ease-in-out!important}' + L(c, ':hover', ['a']) + '{text-decoration:underline wavy!important}@keyframes hmrwig{0%,100%{transform:rotate(0)}25%{transform:rotate(-1.2deg) translateX(-2px)}50%{transform:rotate(1.2deg) translateX(2px)}75%{transform:rotate(-.6deg)}}@media (prefers-reduced-motion:reduce){' + L(c, ':hover') + '{animation:none!important}}';
    c = 'hmr-th-marker'; styleEl.textContent += L(c, ':hover') + '{background-color:#ffe066!important;background-image:none!important;color:#111!important}' + L(c, ':hover *') + '{color:#111!important}';
    c = 'hmr-th-spacing'; styleEl.textContent += L(c) + '{transition:letter-spacing .25s ease!important}' + L(c, ':hover') + '{letter-spacing:.08em!important}';
    var cb = cursorURL(), big = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40"><path d="M5 3v28l7-6 5 11 5-2-5-11h10z" fill="#fff" stroke="#111" stroke-width="2.5" stroke-linejoin="round"/></svg>';
    var dot = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="6" fill="#d4202a" stroke="#fff" stroke-width="2.5"/></svg>';
    var star = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><path d="M15 2l3.8 8.6 9.2.9-7 6.2 2.1 9.1L15 21.8 6.9 26.8 9 17.7 2 11.5l9.2-.9z" fill="#ffd60a" stroke="#111" stroke-width="2" stroke-linejoin="round"/></svg>';
    function cur(svg, x, y, fb) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '") ' + x + ' ' + y + ',' + fb; }
    styleEl.textContent += 'html.hmr-p-bullseye,html.hmr-p-bullseye body{cursor:' + cb + '}html.hmr-p-large,html.hmr-p-large body{cursor:' + cur(big, 5, 3, 'auto') + '}html.hmr-p-crosshair,html.hmr-p-crosshair body{cursor:crosshair}html.hmr-p-dot,html.hmr-p-dot body{cursor:' + cur(dot, 10, 10, 'crosshair') + '}html.hmr-p-star,html.hmr-p-star body{cursor:' + cur(star, 15, 15, 'crosshair') + '}html.hmr-p-hand,html.hmr-p-hand body{cursor:pointer}';
  })();
  styleEl.textContent += 'html[class] .hmr-dx h4,html[class] .hmr-dx h5{color:#111!important;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif!important}';
  function applyPointer() { POINTERS.forEach(function (p) { root.classList.toggle('hmr-p-' + p[0], dx.pointer === p[0]); }); }
  function applyHover() { HOVERS.forEach(function (h) { root.classList.toggle('hmr-th-' + h[0], dx.hover === h[0]); }); }
  applyPointer(); applyHover();
  if (dx.th) { if (doc.body) applyTheme(); else doc.addEventListener('DOMContentLoaded', applyTheme); }
  if (dx.th) { doc.addEventListener('DOMContentLoaded', function () { markCards(); }); window.addEventListener('load', function () { markCards(); }); }
  var spT = 0, spN = 0;
  doc.addEventListener('pointermove', function (ev) {
    if (rm() || ev.pointerType === 'touch') return;
    var now = performance.now(), tr = TRAILS[dx.pointer];
    if (tr && now - spT > 38 && spN < 40) {
      spT = now; var s = el('span', 'hmr-sp', tr[(Math.random() * tr.length) | 0]); s.setAttribute('aria-hidden', 'true');
      s.style.left = (ev.clientX + rnd(-6, 6)) + 'px'; s.style.top = (ev.clientY + rnd(-6, 6)) + 'px'; s.style.setProperty('--dx', rnd(-18, 18) + 'px'); spN++;
      s.addEventListener('animationend', function () { s.remove(); spN--; }); setTimeout(function () { if (s.parentNode) { s.remove(); spN--; } }, 1200); doc.body.appendChild(s);
    }
    if (dx.anim !== 'none') letterMove(ev, now);
  }, { passive: true });
  var chT = 0, LBAD = BAD + ',button,canvas,svg,.hmr-ch,mark.hmr-hl';
  function unwrapCh(span) { var p = span.parentNode; if (!p) return; while (span.firstChild) p.insertBefore(span.firstChild, span); p.removeChild(span); try { p.normalize(); } catch (e) { } }
  function letterMove(ev, now) {
    if (now - chT < 45) return; chT = now;
    var t = ev.target; if (!t || !t.closest || t.closest(LBAD) || badNode(t)) return;
    var pos = null;
    try {
      if (doc.caretPositionFromPoint) { var cp = doc.caretPositionFromPoint(ev.clientX, ev.clientY); if (cp) pos = { n: cp.offsetNode, o: cp.offset }; }
      else if (doc.caretRangeFromPoint) { var cr = doc.caretRangeFromPoint(ev.clientX, ev.clientY); if (cr) pos = { n: cr.startContainer, o: cr.startOffset }; }
    } catch (e) { }
    if (!pos || !pos.n || pos.n.nodeType !== 3 || !pos.n.parentNode) return;
    var n = pos.n, v = n.nodeValue, o = pos.o, r = doc.createRange(), hit = -1, b;
    for (var k = 0; k < 2; k++) {
      var q = o - k; if (q < 0 || q >= v.length || !v.charAt(q).trim()) continue;
      r.setStart(n, q); r.setEnd(n, q + 1); b = r.getBoundingClientRect();
      if (ev.clientX >= b.left - 1 && ev.clientX <= b.right + 1 && ev.clientY >= b.top - 1 && ev.clientY <= b.bottom + 1) { hit = q; break; }
    }
    if (hit < 0) return;
    var p = n.parentNode; if (p.closest && p.closest(LBAD)) return;
    var span = el('span', 'hmr-ch hmr-ch-' + dx.anim);
    try { r.setStart(n, hit); r.setEnd(n, hit + 1); r.surroundContents(span); } catch (e) { return; }
    setTimeout(function () { unwrapCh(span); }, 750);
  }
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
  var dxUIs = [];
  function allThemes() { var a = []; GENRES.forEach(function (g) { g.t.forEach(function (t) { a.push(t); }); }); return a; }
  function setTheme(gi, i) {
    var g = GENRES[gi] || GENRES[0], n = g.t.length; i = ((i % n) + n) % n;
    dx.gi = GENRES.indexOf(g); dx.th = g.t[i].id; dxSave(); applyTheme(); dxUIs.forEach(function (u) { u(); });
  }
  function themeIdx() { var t = themeById(dx.th); return t ? t.i : -1; }
  function stepTheme(dir) { var i = themeIdx(), g = GENRES[dx.gi] || GENRES[0]; if (i < 0 || themeById(dx.th).gi !== dx.gi) i = dir > 0 ? 0 : g.t.length - 1; else i += dir; setTheme(dx.gi, i); }
  function buildDx() {
    var d = el('section', 'hmr-dx'); d.setAttribute('aria-label', 'More ways to make this yours');
    d.appendChild(el('h4', '', '✨ More ways to make this yours'));
    // --- style studio
    d.appendChild(el('h5', '', '🎭 Page style (the words never change)'));
    var gl = el('label', '', 'Genre'); gl.setAttribute('for', 'hmr-dx-genre'); gl.style.cssText = 'display:block;margin:0 0 3px;font-weight:700'; d.appendChild(gl);
    var gsel = el('select'); gsel.id = 'hmr-dx-genre'; GENRES.forEach(function (g, i) { var o = el('option', '', g.e + ' ' + g.n + ' (' + g.t.length + ')'); o.value = String(i); gsel.appendChild(o); }); d.appendChild(gsel);
    var nav = el('div', 'tnav');
    var bb = el('button', 'chip tb-back', '‹ Back'); bb.type = 'button'; bb.setAttribute('aria-label', 'Previous theme in this genre');
    var tl = el('p', 'tl'); tl.setAttribute('role', 'status'); tl.setAttribute('aria-live', 'polite');
    var fw = el('button', 'chip tb-fwd', 'Forward ›'); fw.type = 'button'; fw.setAttribute('aria-label', 'Next theme in this genre');
    nav.appendChild(bb); nav.appendChild(tl); nav.appendChild(fw); d.appendChild(nav);
    var tr = el('div', 'trow');
    var sh = el('button', 'chip tb-shuffle'); sh.type = 'button'; sh.innerHTML = '<span aria-hidden="true">🎲</span> Shuffle';
    var og = el('button', 'chip tb-orig'); og.type = 'button'; og.innerHTML = '<span aria-hidden="true">↩️</span> Original';
    var up = el('button', 'chip up tb-up'); up.type = 'button'; up.innerHTML = '<span aria-hidden="true">👍</span> Like this theme'; up.setAttribute('aria-label', 'Thumbs up for this theme');
    var dn = el('button', 'chip dn tb-down'); dn.type = 'button'; dn.innerHTML = '<span aria-hidden="true">👎</span> Not for me'; dn.setAttribute('aria-label', 'Thumbs down for this theme');
    tr.appendChild(sh); tr.appendChild(og); tr.appendChild(up); tr.appendChild(dn); d.appendChild(tr);
    var rc = el('p', 'st'); d.appendChild(rc);
    function rcount() { var n = 0; for (var k in rt) if (rt.hasOwnProperty(k)) n++; return n; }
    function sync() {
      var t = themeById(dx.th); gsel.value = String(dx.gi);
      if (t) { var g = GENRES[t.gi]; tl.textContent = g.n + ' ' + (t.i + 1) + ' of ' + g.t.length + ': ' + t.name; }
      else { var g0 = GENRES[dx.gi] || GENRES[0]; tl.textContent = 'Original look. Pick a genre, then press Forward.'; }
      up.disabled = dn.disabled = !t; up.setAttribute('aria-pressed', t && rt[t.id] === 1 ? 'true' : 'false'); dn.setAttribute('aria-pressed', t && rt[t.id] === -1 ? 'true' : 'false');
      og.setAttribute('aria-pressed', t ? 'false' : 'true');
      var n = rcount(); rc.textContent = n ? n + (n === 1 ? ' theme rated so far.' : ' themes rated so far.') : 'Rate the themes you see. It helps us a lot.';
    }
    dxUIs.push(sync);
    gsel.addEventListener('change', function () { setTheme(+gsel.value, 0); });
    bb.addEventListener('click', function () { stepTheme(-1); }); fw.addEventListener('click', function () { stepTheme(1); });
    sh.addEventListener('click', function () { var a = allThemes().filter(function (t) { return t.id !== dx.th; }); var t = a[(Math.random() * a.length) | 0]; setTheme(t.gi, t.i); });
    og.addEventListener('click', function () { dx.th = ''; dxSave(); applyTheme(); dxUIs.forEach(function (u) { u(); }); });
    function rate(v) { var t = themeById(dx.th); if (!t) return; if (rt[t.id] === v) delete rt[t.id]; else rt[t.id] = v; rtSave(); dxUIs.forEach(function (u) { u(); }); }
    up.addEventListener('click', function () { rate(1); }); dn.addEventListener('click', function () { rate(-1); });
    sync();
    d.appendChild(mkGroup('Text hover effect', '👆', HOVERS, function () { return dx.hover; }, function (v) { dx.hover = v; applyHover(); dxSave(); }));
    d.appendChild(mkGroup('Mouse pointer', '🖱️', POINTERS, function () { return dx.pointer; }, function (v) { dx.pointer = v; applyPointer(); dxSave(); }));
    d.appendChild(mkGroup('Letter animation', '🔤', ANIMS, function () { return dx.anim; }, function (v) { dx.anim = v; dxSave(); }));
    d.appendChild(el('h5', '', '📝 Notes'));
    var lab = el('label', '', 'Tell us what you like or want changed.' + (SR ? ' Type or talk.' : '')); lab.setAttribute('for', 'hmr-dx-notes'); lab.style.cssText = 'display:block;margin:0 0 4px'; d.appendChild(lab);
    var ta = el('textarea'); ta.id = 'hmr-dx-notes'; ta.rows = 3; ta.value = (jget(draftKey('design'), {}).t) || ''; d.appendChild(ta);
    function saveN() { jset(draftKey('design'), { t: ta.value }); }
    if (SR) { var mic = wrapMic(ta); var mst = el('p', 'st'); mst.setAttribute('role', 'status'); mst.setAttribute('aria-live', 'polite'); d.appendChild(mst); makeMic(ta, mic, mst, saveN); }
    ta.addEventListener('input', saveN);
    var go = el('button', 'go', '📨 Send to us'); go.type = 'button'; d.appendChild(go);
    var st = el('p', 'st'); st.setAttribute('role', 'status'); st.setAttribute('aria-live', 'polite'); d.appendChild(st);
    go.addEventListener('click', function () {
      saveN(); st.textContent = 'Sending...'; go.disabled = true;
      var notes = ta.value.trim(), t = themeById(dx.th), ratings = {};
      for (var k in rt) if (rt.hasOwnProperty(k)) ratings[k] = rt[k] === 1 ? 'up' : 'down';
      send({ kind: 'design', message: notes || 'Design choices (no notes)', details: { genre: t ? GENRES[t.gi].n : 'Original look', theme: t ? t.name : 'Original', themeId: t ? t.id : '', ratings: ratings, hoverEffect: dx.hover, pointer: dx.pointer, letterAnimation: dx.anim, notes: notes, page: location.href, siteDesign: siteDesignState() } }).then(function (r) {
        go.disabled = false;
        if (r.ok) { ta.value = ''; ldel(draftKey('design')); st.textContent = SENT_LINE; } else st.textContent = MAIL_LINE;
      });
    });
    return d;
  }
  // The dock's own Design button and panel, for pages that have no Design panel of their own
  var own = null, ownSettled = false;
  function closeOwn(back) { if (!own || own.panel.hidden) return; own.panel.hidden = true; own.btn.setAttribute('aria-expanded', 'false'); if (back) { try { own.btn.focus({ preventScroll: true }); } catch (e) { own.btn.focus(); } } }
  function openOwn() { if (!own) return; closeOthers('ds'); own.panel.hidden = false; own.btn.setAttribute('aria-expanded', 'true'); }
  function buildOwn() {
    var b = el('button', 'hmr-dsbtn'); b.type = 'button'; b.id = 'hmr-design'; b.title = 'Design'; b.setAttribute('aria-label', 'Design'); b.setAttribute('aria-haspopup', 'dialog'); b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'hmr-dsp');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 1.5-2s0-2 1.5-2h2a3 3 0 0 0 3-3c0-6-4-11-8-11z"/><circle cx="8" cy="11" r=".8" fill="currentColor"/><circle cx="11" cy="7.5" r=".8" fill="currentColor"/><circle cx="15.5" cy="8.5" r=".8" fill="currentColor"/></svg><span>Design</span>';
    var p = el('div', 'hmr-dsp'); p.id = 'hmr-dsp'; p.hidden = true; p.setAttribute('role', 'dialog'); p.setAttribute('aria-label', 'Design');
    var hd = el('div', 'hd'); hd.appendChild(el('span', '', 'Design')); var x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close Design'); x.addEventListener('click', function () { closeOwn(true); }); hd.appendChild(x); p.appendChild(hd);
    p.appendChild(buildDx());
    b.addEventListener('click', function () { if (own.panel.hidden) openOwn(); else closeOwn(true); });
    doc.body.appendChild(b); doc.body.appendChild(p); own = { btn: b, panel: p };
  }
  function siteHasDesign() { if (!CFG.design || !CFG.panel) return false; try { return !!(doc.querySelector(CFG.design) && doc.querySelector(CFG.panel)); } catch (e) { return false; } }
  var dxRaf = 0;
  function ensureDx() {
    dxRaf = 0; if (!doc.body) return;
    var has = siteHasDesign();
    if (has && own) { try { own.btn.remove(); own.panel.remove(); } catch (e) { } own = null; }
    if (!has && !own && ownSettled) { try { buildOwn(); } catch (e) { try { console.warn('hmr-dock design', e); } catch (e2) { } } }
    if (has && CFG.panel) {
      var p = null; try { p = doc.querySelector(CFG.panel); } catch (e) { }
      if (p && !p.querySelector('.hmr-dx')) { try { var _dx = buildDx(); var _h = p.querySelector('h2,h3,.pk-head,.dlg-top'); if (_h && _h.parentNode === p && _h.nextSibling) p.insertBefore(_dx, _h.nextSibling); else p.insertBefore(_dx, p.firstChild); } catch (e) { try { console.warn('hmr-dock design', e); } catch (e2) { } } }
    }
  }
  function watchDx() {
    ensureDx();
    try { new MutationObserver(function () { if (!dxRaf) dxRaf = requestAnimationFrame(ensureDx); }).observe(doc.body, { childList: true, subtree: true }); } catch (e) { }
    var settle = function () { setTimeout(function () { ownSettled = true; ensureDx(); }, 700); };
    if (doc.readyState === 'complete') settle(); else window.addEventListener('load', settle);
  }
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

  // ------------------------------------------------------------------ mount
  function mount() {
    if (doc.getElementById('hmr-dock')) return;
    try {   // tier ribbon, a small centered line at the end of the page
      if (!doc.querySelector('[data-hmr-tier-ribbon]')) {
        var rb = el('div', 'hmr-tier' + (CFG.tier === 'experiment' ? ' ex' : '')); rb.setAttribute('data-hmr-tier-ribbon', CFG.tier);
        var ra = el('a', 'hmr-tl'); ra.target = '_blank'; ra.rel = 'noopener';
        if (CFG.tier === 'experiment') { ra.href = 'https://hmrfamily.life/#experiment'; ra.textContent = 'Part of the HMR experiment'; }
        else { ra.href = 'https://hmrfamily.life/'; var rs = el('span', 'st', '\u2605'); rs.setAttribute('aria-hidden', 'true'); ra.appendChild(rs); ra.appendChild(doc.createTextNode('Part of the HMR family')); }
        rb.appendChild(ra); doc.body.appendChild(rb);
      }
    } catch (e) { }
    dock.id = 'hmr-dock'; doc.body.appendChild(dock);
    try {   // leave room at the end of long pages so the dock never hides the last lines
      var scrollable = root.scrollHeight > innerHeight + 20, disp = getComputedStyle(doc.body).display;
      if (scrollable && (disp === 'block' || disp === 'flow-root')) { var sp = el('div', 'hmr-spacer'); sp.setAttribute('aria-hidden', 'true'); doc.body.appendChild(sp); }
    } catch (e) { }
  }
  if (doc.body) mount(); else doc.addEventListener('DOMContentLoaded', mount);

  window.HMRDock = {
    site: CFG.site, effects: EFFECTS.map(function (e) { return e.name; }),
    funsies: function (name) { if (effByName(name)) runEffect(name); },
    openFunsies: openFz, closeFunsies: function () { closeFz(true); }, play: function (id) { PLAY.forEach(function (p) { if (p.id === id) openPlay(p); }); }, closePlay: function () { closePlay(true); },
    stopFunsies: function () { stopFunsies(true); }, log: readLog, openReact: openRx, closeReact: function () { closeRx(true); },
    send: send, mailto: mailSelf, openFeedback: function (o) { openSheet('feedback', o); }, openLost: function () { openSheet('lost'); }, closeFeedback: function () { closeSheet(true); }, openSpeak: openSpeak, closeSpeak: function () { closeSpeak(true); },
    highlights: hlList, clearHighlights: function () { hlList().forEach(function (h) { removeHighlight(h.id); }); }, design: function () { return JSON.parse(JSON.stringify(dx)); }, version: 5, themes: function () { return allThemes().map(function (t) { return { id: t.id, name: t.name, genre: GENRES[t.gi].n, b: t.b, bi: t.bi, f: t.f, h: t.h, l: t.l, c: t.c }; }); }
  };
})();
