/* HMR family accounts: one account for every HMR family site (Supabase project "HMR Family").
   The key below is the publishable key, which is meant to be public in web pages. Row level security
   protects every table. Each site keeps its own session: log in on each site with the same email and password.
   Shared file: one identical copy sits next to hmr-dash.js on every site (dock v6.9 / dash v1.9); keep them all the same. */
(function () {
  if (window.HMRAuth) return;
  var URL_ = 'https://tudawxduevejltgmyrqm.supabase.co';
  var KEY = 'sb_publishable_B1u0-Wf5UbWPX6QstfVbGQ_VpmEDpkn';
  var LIB = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.110.9/dist/umd/supabase.js';
  var A = window.HMRAuth = { user: null, ready: false, failed: false, recovery: false, client: null };
  var waits = [], subs = [];
  function emit() {
    subs.slice().forEach(function (f) { try { f(A.user); } catch (e) { } });
    try { window.dispatchEvent(new CustomEvent('hmr-auth', { detail: { user: A.user } })); } catch (e) { }
  }
  A.whenReady = function (f) { if (A.client) f(A.client); else waits.push(f); };
  A.onChange = function (f) { subs.push(f); if (A.ready || A.failed) { try { f(A.user); } catch (e) { } } };
  function start() {
    try { A.client = window.supabase.createClient(URL_, KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }); }
    catch (e) { A.failed = true; emit(); return; }
    A.client.auth.onAuthStateChange(function (ev, s) {
      var u = (s && s.user) || null, changed = (u && u.id) !== (A.user && A.user.id);
      if (ev === 'PASSWORD_RECOVERY') A.recovery = true;
      A.user = u;
      if (!A.ready) { A.ready = true; emit(); } else if (changed || ev === 'PASSWORD_RECOVERY' || ev === 'USER_UPDATED') emit();
    });
    waits.splice(0).forEach(function (f) { try { f(A.client); } catch (e) { } });
  }
  if (window.supabase && window.supabase.createClient) start();
  else {
    var s = document.createElement('script'); s.src = LIB; s.async = true;
    s.onload = start; s.onerror = function () { A.failed = true; emit(); };
    (document.head || document.documentElement).appendChild(s);
  }
  function call(f) { return new Promise(function (res) { if (A.failed) return res({ error: { message: 'offline' } }); A.whenReady(function (c) { f(c).then(res, function (e) { res({ error: e || { message: 'failed' } }); }); }); }); }
  var HOME = location.origin + '/';
  A.signIn = function (email, pw) { return call(function (c) { return c.auth.signInWithPassword({ email: email, password: pw }); }); };
  A.signUp = function (email, pw) { return call(function (c) { return c.auth.signUp({ email: email, password: pw, options: { emailRedirectTo: HOME } }); }); };
  A.reset = function (email) { return call(function (c) { return c.auth.resetPasswordForEmail(email, { redirectTo: HOME }); }); };
  A.setPassword = function (pw) { return call(function (c) { return c.auth.updateUser({ password: pw }); }).then(function (r) { if (!r.error) A.recovery = false; return r; }); };
  A.signOut = function () { return call(function (c) { return c.auth.signOut(); }); };
  A.rpc = function (fn, args) { return call(function (c) { return c.rpc(fn, args || {}); }); };
  A.from = function (t) { return A.client ? A.client.from(t) : null; };
  // plain words for the errors people can hit
  A.say = function (err) {
    var m = String((err && (err.message || err.msg)) || '').toLowerCase();
    if (!m) return 'Something went wrong. Try again in a moment.';
    if (m.indexOf('invalid login') >= 0) return 'That email and password do not match an account. Check both and try again.';
    if (m.indexOf('not confirmed') >= 0) return 'Confirm your email first: open the link we sent you, then log in.';
    if (m.indexOf('already registered') >= 0 || m.indexOf('already been registered') >= 0) return 'That email already has an account. Log in instead.';
    if (m.indexOf('password') >= 0 && (m.indexOf('least') >= 0 || m.indexOf('weak') >= 0 || m.indexOf('short') >= 0)) return 'Use a longer password: at least 8 characters.';
    if (m.indexOf('rate limit') >= 0 || m.indexOf('too many') >= 0 || m.indexOf('security purposes') >= 0) return 'Too many tries for now. Wait a few minutes, then try again.';
    if (m.indexOf('email') >= 0 && (m.indexOf('send') >= 0 || m.indexOf('authorized') >= 0)) return 'We could not send the email right now. Try again later.';
    if (m.indexOf('offline') >= 0 || m.indexOf('fetch') >= 0 || m.indexOf('network') >= 0) return 'We could not reach the account service. Check your connection and try again.';
    return 'Something went wrong. Try again in a moment.';
  };
})();
