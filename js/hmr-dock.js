/* HMR dock: one shared bottom bar for all HMR sites.
   Bottom left: Design (each site keeps its own picker; the dock only places that button).
   Bottom center: Funsies (a surprise from a rotating set of playful physics effects).
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
    '.hmr-hint{position:fixed;left:50%;bottom:calc(' + BASE + ' + 58px);transform:translateX(-50%);background:#111;color:#fff;border-radius:999px;padding:5px 11px;font-size:12px;font-weight:600;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .3s}' +
    '.hmr-hint.on{opacity:.92}' +
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

  // ------------------------------------------------------------------ dock elements
  var dock = el('div', 'hmr-dock'); dock.setAttribute('data-hmr-dock', '');
  var fzBtn = el('button', 'hmr-fzbtn', 'Funsies'); fzBtn.type = 'button'; fzBtn.id = 'hmr-funsies';
  var hint = el('div', 'hmr-hint', 'Click again for another'); hint.setAttribute('role', 'status');
  var rxBtn = el('button', 'hmr-rxbtn'); rxBtn.type = 'button'; rxBtn.id = 'hmr-react';
  rxBtn.setAttribute('aria-haspopup', 'dialog'); rxBtn.setAttribute('aria-expanded', 'false'); rxBtn.setAttribute('aria-controls', 'hmr-rxp');
  rxBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><circle cx="8.8" cy="10" r=".6" fill="currentColor"/><circle cx="15.2" cy="10" r=".6" fill="currentColor"/><path d="M7.6 14.2c1.2 2 3 2.9 4.4 2.9s3.2-.9 4.4-2.9"/></svg><span>React</span>';
  dock.appendChild(fzBtn); dock.appendChild(rxBtn); dock.appendChild(hint);

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
    if (t.closest('.hmr-dock,.hmr-rxp,.hmr-mark')) return true;
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
    stopFunsies();
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
    if (FZ.cur) stopFunsies();
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
  var FZ = { cur: null, last: -1, order: [], timer: 0 };
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
  function layer() {
    var cv = el('canvas', 'hmr-fzcanvas'); cv.setAttribute('aria-hidden', 'true'); var DPR = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * DPR; cv.height = innerHeight * DPR; cv.style.pointerEvents = coarse() ? 'auto' : 'none';
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
      if (e.closest('[data-hmr-dock],.hmr-rxp,.hmr-fzcanvas,.hmr-mark,.hmr-hint') || (e.namespaceURI && e.namespaceURI.indexOf('svg') >= 0 && e.tagName.toLowerCase() !== 'svg')) continue;
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
    var els = pickEls(o.max || 60); if (!els.length) return false;
    var W = root.clientWidth, H = innerHeight, sy0 = scrollY, sx0 = scrollX, ptr = { x: W / 2, y: H / 2 };
    root.classList.add('hmr-fz-on');
    var items = els.map(function (e) {
      var r = e.getBoundingClientRect(), iw = r.right - r.left, ih = r.bottom - r.top, ins = (ih * .4695 + iw * .1171) / 2 + 1;
      var it = { e: e, ins: (W - iw > 2 * ins + 2 && H - ih > 2 * ins + 2) ? ins : 0, l: r.left, t: r.top, r: r.right, b: r.bottom, x: 0, y: 0, vx: 0, vy: 0, a: 0, va: 0, sv: [e.style.getPropertyValue('translate'), e.style.getPropertyValue('rotate'), e.style.getPropertyValue('transition')] };
      if (o.init) o.init(it); if (!it.ins) it.va = 0; e.style.setProperty('transition', 'none'); return it;
    });
    S.undo.push(function () { items.forEach(function (it) { ['translate', 'rotate', 'transition'].forEach(function (p, i) { if (it.sv[i]) it.e.style.setProperty(p, it.sv[i]); else it.e.style.removeProperty(p); }); }); root.classList.remove('hmr-fz-on'); });
    S.on(doc, 'pointermove', function (ev) { ptr.x = ev.clientX; ptr.y = ev.clientY; }, { passive: true });
    var phase = 'play', rt = 0, back = .9;
    S.loop(function (dt, t) {
      var dy = scrollY - sy0, dx = scrollX - sx0;
      if (phase === 'play' && t > o.dur) { phase = 'back'; rt = 0; items.forEach(function (it) { it.x0 = it.x; it.y0 = it.y; it.a0 = it.a; }); }
      if (phase === 'play') {
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
        items.forEach(function (it) { it.x = it.x0 * (1 - k); it.y = it.y0 * (1 - k); it.a = it.a0 * (1 - k); });
        if (u >= 1) { stopFunsies(); return false; }
      }
      items.forEach(function (it) { it.e.style.setProperty('translate', it.x.toFixed(1) + 'px ' + it.y.toFixed(1) + 'px'); it.e.style.setProperty('rotate', it.a.toFixed(1) + 'deg'); });
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
      var end = 15;
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
      var W = L.W, H = L.H, cx = L.cx, bs = [], drops = [], end = 18;
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
        if (t > end && !bs.length) return false; if (t > end + 6) return false;
      });
      return true;
    } },
    { name: 'tensegrity', run: function (S) {   // a tensegrity toy: rigid struts, springy cables, pluck it
      var L = layer(); S.undo.push(function () { L.cv.remove(); });
      var W = L.W, H = L.H, cx = L.cx, R = clamp(Math.min(W, H) * .17, 55, 110), N = [], C = [], grab = null, end = 28;
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
  function stopFunsies() {
    var S = FZ.cur; FZ.cur = null; if (S) { try { S.stop(); } catch (e) { } }
    if (doc.body) root.classList.remove('hmr-fz-on');
  }
  function nextIndex() {
    if (!FZ.order.length) { FZ.order = EFFECTS.map(function (_, i) { return i; }); for (var m = FZ.order.length - 1; m > 0; m--) { var q = (Math.random() * (m + 1)) | 0, t = FZ.order[m]; FZ.order[m] = FZ.order[q]; FZ.order[q] = t; } if (FZ.order[FZ.order.length - 1] === FZ.last && FZ.order.length > 1) FZ.order.unshift(FZ.order.pop()); }
    return FZ.order.pop();
  }
  function showHint() { hint.classList.add('on'); clearTimeout(FZ.timer); FZ.timer = setTimeout(function () { hint.classList.remove('on'); }, 3200); }
  function runEffect(i) {
    stopFunsies(); stopSoft();
    if (panel && !panel.hidden) closeRx(false);
    FZ.last = i;
    if (rm()) { gentle(); showHint(); return; }
    var S = Session(); FZ.cur = S;
    var ok = false;
    try { ok = EFFECTS[i].run(S); } catch (e) { ok = false; try { console.warn('hmr-dock funsies', e); } catch (e2) { } }
    if (!ok) { stopFunsies(); var j = (i + 1) % EFFECTS.length; if (j !== i && !runEffect._depth) { runEffect._depth = 1; try { runEffect(j); } finally { runEffect._depth = 0; } } return; }
    showHint();
  }
  fzBtn.addEventListener('click', function () { runEffect(nextIndex()); });

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
    funsies: function (name) { var i = EFFECTS.map(function (e) { return e.name; }).indexOf(name); runEffect(i >= 0 ? i : nextIndex()); },
    stopFunsies: stopFunsies, log: readLog, openReact: openRx, closeReact: function () { closeRx(true); }
  };
})();
