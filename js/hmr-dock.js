/* HMR dock: one shared bottom bar for all HMR sites.
   Bottom left: Design (each site keeps its own picker; the dock only places that button).
   Bottom center: Funsies (a menu: play three of our toys in an overlay, wreck the page, or pick more fun).
   Bottom right: React (pick a reaction, optionally aimed at a spot on the page).
   Config comes from data attributes on the script tag:
     data-site="name"            site name
     data-design="#btn,.btn2"    CSS selector(s) of the site's own Design button (placed bottom left, round)
     data-design-panel="#panel"  CSS selector(s) of the site's Design panel (opens above the button, bottom left)
     data-sound="1"              the site already has sound, so bubbles may pop with a tiny sound
   Storage is always inside try/catch. Nothing here talks to a server, except that if Microsoft Clarity is
   already on the page, each reaction is sent to it as a custom event. */
(function () {
  'use strict';
  if (window.HMRDock) return;
  if (window.name === 'hmr-embed') return;   // inside the Funsies play overlay: no dock in the dock
  var script = document.currentScript, D = (script && script.dataset) || {};
  var CFG = { site: D.site || location.hostname, design: D.design || '', panel: D.designPanel || '', sound: D.sound === '1' };
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
  var ds = CFG.design, ps = CFG.panel;
  function each(list, f) { return list ? list.split(',').map(function (x) { return f(x.trim()); }).join(',') : ''; }
  var AIMOK = ['html.hmr-aim .hmr-dock *', 'html.hmr-aim .hmr-rxp', 'html.hmr-aim .hmr-rxp *'].concat(ds ? [each(ds, function (x) { return 'html.hmr-aim ' + x; })] : [], ps ? [each(ps, function (x) { return 'html.hmr-aim ' + x; }), each(ps, function (x) { return 'html.hmr-aim ' + x + ' *'; })] : []).join(',');
  var css =
    '.hmr-dock{position:fixed;left:0;right:0;bottom:0;height:0;z-index:99990;pointer-events:none;font:600 13px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;letter-spacing:0;text-transform:none}' +
    '.hmr-dock *{box-sizing:border-box;font-family:inherit}' +
    '.hmr-rxbtn,.hmr-fzbtn{pointer-events:auto;position:fixed;bottom:' + BASE + ';border:2px solid #fff;color:#fff;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.38);-webkit-tap-highlight-color:transparent;touch-action:manipulation;margin:0;transform:none}' +
    '.hmr-rxbtn{right:' + RIGHT + ';width:54px;height:54px;border-radius:50%;background:#111;padding:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:11px;line-height:1;font-weight:700}' +
    '.hmr-rxbtn svg{width:22px;height:22px;display:block;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round}' +
    '.hmr-rxbtn:hover,.hmr-rxbtn[aria-expanded="true"]{background:#1d4ed8}' +
    '.hmr-fzbtn{left:50%;margin-left:-58px;width:116px;height:46px;margin-bottom:4px;border-radius:999px;background:linear-gradient(135deg,#e0307a,#f59e0b);font-size:15px;font-weight:800;letter-spacing:.02em;display:flex;align-items:center;justify-content:center;padding:0;transition:transform .25s}' +
    '.hmr-fzbtn:hover{transform:rotate(-3deg) scale(1.06)}.hmr-fzbtn:active{transform:scale(.95)}' +
    '.hmr-dock button:focus-visible,.hmr-rxp button:focus-visible,.hmr-rxp input:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}' +
    // react panel
    '.hmr-rxp{position:fixed;right:' + RIGHT + ';bottom:calc(' + BASE + ' + 64px);z-index:99991;width:272px;max-width:calc(100vw - 24px);max-height:calc(100vh - 110px);overflow:auto;background:#fff;color:#111;border:2px solid #111;border-radius:14px;padding:10px;box-shadow:0 12px 36px rgba(0,0,0,.4);font:500 13px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;text-align:left;text-transform:none;letter-spacing:0}' +
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
    '.hmr-spacer{height:74px;pointer-events:none}' +
    // the site's own Design button and panel, placed by the dock
    (ds ? ds + '{position:fixed!important;left:' + LEFT + '!important;right:auto!important;top:auto!important;bottom:' + BASE + '!important;width:54px!important;height:54px!important;min-width:0!important;min-height:0!important;max-width:none!important;padding:0!important;margin:0!important;border-radius:50%!important;background:#111!important;color:#fff!important;border:2px solid #fff!important;box-shadow:0 6px 20px rgba(0,0,0,.38)!important;font:700 11px/1 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif!important;letter-spacing:0!important;text-transform:none!important;display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:2px!important;z-index:99990!important;transform:none!important;cursor:pointer}' +
        ds.split(',').join(':hover,') + ':hover{background:#1d4ed8!important;transform:none!important}' +
        ds.split(',').join('[hidden],') + '[hidden]{display:none!important}' +
        ds.split(',').join(' svg,') + ' svg{width:20px!important;height:20px!important}' : '') +
    (ps ? ps + '{position:fixed!important;left:' + LEFT + '!important;right:auto!important;top:auto!important;bottom:calc(' + BASE + ' + 64px)!important;z-index:99991!important;max-width:calc(100vw - 24px)!important;max-height:calc(100vh - 110px)!important;overflow:auto!important;margin:0!important}' : '') +
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
    '.hmr-fzm .x,.hmr-pov .x{min-width:34px;min-height:34px;border:1px solid #bbb;background:#f6f6f6;color:#111;border-radius:8px;font-size:20px;line-height:1;cursor:pointer;padding:0 8px}',
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
    '.hmr-pov{position:fixed;left:0;top:0;right:0;bottom:0;z-index:99996;background:#0b0b10;display:flex;flex-direction:column;font:600 14px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}',
    '.hmr-pov .bar{display:flex;align-items:center;gap:10px;padding:6px 10px;background:#111;color:#fff;min-height:46px}.hmr-pov .bar b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
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
  var DEFAULT_EMOTIONS = ['Dislike', 'Like', 'Mad', 'Excited', 'Sad', 'Happy', 'Worried', 'Hopeful', 'Confused', 'Curious', 'Frustrated', 'Inspired', 'Disappointed', 'Grateful', 'Skeptical', 'Amazed'];
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
    if (t.closest('.hmr-dock,.hmr-rxp,.hmr-mark,.hmr-fzm,.hmr-pov,.hmr-again')) return true;
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
      var b = el('button', 'chip ' + (NEG[n] ? 'neg' : 'pos'), n); b.type = 'button'; b.setAttribute('data-e', n);
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
    stopFunsies(true); closeFz(false);
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
        if (window.hmrReact && window.hmrReact.press && window.hmrReact.emotions.indexOf(name) >= 0) window.hmrReact.press(name);
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
      if (e.closest('[data-hmr-dock],.hmr-rxp,.hmr-fzcanvas,.hmr-mark,.hmr-fzm,.hmr-pov,.hmr-again') || (e.namespaceURI && e.namespaceURI.indexOf('svg') >= 0 && e.tagName.toLowerCase() !== 'svg')) continue;
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
    { id: 'smash', title: 'Fen Smash', sub: 'The smash game', url: 'https://claudebomb.com/smash/', ic: 'M5 19 15 9M12 4l8 8M4 12l3 3' },
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
    stopFunsies(true); hideAgain(); if (panel && !panel.hidden) closeRx(false); closePlay(false);
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
    closePlay(false); povEl = el('div', 'hmr-pov'); povEl.setAttribute('role', 'dialog'); povEl.setAttribute('aria-modal', 'true'); povEl.setAttribute('aria-label', p.title);
    var bar = el('div', 'bar'); bar.appendChild(el('b', '', p.title));
    var a = el('a', '', 'Open in new tab'); a.href = p.url; a.target = '_blank'; a.rel = 'noopener'; bar.appendChild(a);
    var x = el('button', 'x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close ' + p.title); x.addEventListener('click', function () { closePlay(true); }); bar.appendChild(x); povEl.appendChild(bar);
    var fr = doc.createElement('iframe'), loaded = false; fr.name = 'hmr-embed'; fr.title = p.title; fr.setAttribute('allow', 'fullscreen; autoplay; accelerometer; gyroscope'); fr.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    fr.addEventListener('load', function () { loaded = true; clearTimeout(povT); });
    fr.src = p.url; povEl.appendChild(fr); povEl._fr = fr; povEl.addEventListener('keydown', povKey); doc.body.appendChild(povEl); root.classList.add('hmr-pov-on');
    povT = setTimeout(function () { if (!loaded) fallback(p); }, 4000);
    try { x.focus({ preventScroll: true }); } catch (e) { x.focus(); }
  }
  function fallback(p) {
    if (!povEl) return; var w = null; try { w = window.open(p.url, '_blank'); if (w) w.opener = null; } catch (e) { }
    window.HMRDock && (window.HMRDock.lastFallback = p.url);
    if (w) { closePlay(true); return; }
    if (povEl._fr) povEl._fr.remove(); var m = el('div', 'msg'); m.appendChild(el('p', '', 'This could not open here.')); var a = el('a', '', 'Open ' + p.title + ' in a new tab'); a.href = p.url; a.target = '_blank'; a.rel = 'noopener'; m.appendChild(a); povEl.appendChild(m);
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

  // ------------------------------------------------------------------ mount
  function mount() {
    if (doc.getElementById('hmr-dock')) return;
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
    stopFunsies: function () { stopFunsies(true); }, log: readLog, openReact: openRx, closeReact: function () { closeRx(true); }
  };
})();
