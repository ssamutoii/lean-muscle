// Accounts: email sign-in and per-person sync. The copy on the phone is always the working copy,
// so the app keeps working offline and without signing in.
(function () {
  const KEY = 'lean-muscle-tracker:v2', SKEY = 'lmt-cloud', GKEY = 'lmt-sync';
  const fire = () => window.LMTFire;
  let user = null, ready = false, running = null, leaving = false, reloading = false, offline = false, retryAt = 0, ui = null, pill = null;

  const load = k => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch (e) { return null; } };
  const st = () => load(SKEY) || {};
  const put = patch => localStorage.setItem(SKEY, JSON.stringify(Object.assign(st(), patch)));
  const hash = o => { const s = JSON.stringify(o); let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 ^ s.charCodeAt(i)) >>> 0; return h + ':' + s.length; };
  const isEmpty = d => !d || (!(d.history || []).length && !(d.body || []).length);
  const training = l => !!(l && l.draft && l.draft.startedAt);

  async function pack(data) {
    const text = JSON.stringify(data);
    if (!window.CompressionStream) return { enc: 'none', body: new TextEncoder().encode(text) };
    const z = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
    return { enc: 'gzip', body: new Uint8Array(await new Response(z).arrayBuffer()) };
  }
  async function unpack(r) {
    let s = new Blob([r.body]).stream();
    if (r.enc === 'gzip') s = s.pipeThrough(new DecompressionStream('gzip'));
    const data = JSON.parse(await new Response(s).text());
    if (!data || !Array.isArray(data.history)) throw new Error('The saved copy is not readable.');
    return data;
  }

  const mark = (rev, h) => put({ uid: user.uid, rev, hash: h, at: Date.now(), conflict: false, err: '' });
  async function send(local, rev) {
    const h = hash(local.data);
    const next = await fire().write(user.uid, rev, Object.assign({ hash: h }, await pack(local.data)));
    mark(next, h);
  }
  async function adopt(r, force) {
    const data = await unpack(r), local = load(KEY);
    if (!force && training(local)) return; // never swap the log in the middle of a workout
    localStorage.setItem(KEY, JSON.stringify({ data, draft: null, savedAt: Date.now(), v3: true }));
    mark(r.rev, r.hash);
    reloading = true; location.reload();
  }
  // Removes this person's log from the phone. The GitHub backup link goes too, so it can't pick up someone else's log.
  function clearPhone(next) {
    localStorage.removeItem(KEY); localStorage.removeItem(GKEY);
    if (next) localStorage.setItem(SKEY, JSON.stringify(next)); else localStorage.removeItem(SKEY);
    reloading = true; location.reload();
  }

  async function step() {
    const s = st(), local = load(KEY);
    if (s.uid && s.uid !== user.uid) {
      // A different person signed in: set the old log aside, never mix the two.
      if (local && !isEmpty(local.data)) localStorage.setItem('lmt-stash:' + s.uid, JSON.stringify(local));
      return clearPhone({ uid: user.uid });
    }
    const r = await fire().read(user.uid);
    offline = false;
    if (!local || !local.data) { if (r) await adopt(r); return; }
    const h = hash(local.data);
    if (!r) {
      if (!isEmpty(local.data) || local.data.sex) await send(local, 0); else mark(0, h);
      return;
    }
    if (h === r.hash) return mark(r.rev, h);
    if (s.hash) {
      if (r.hash === s.hash) return send(local, r.rev);   // only this phone changed
      if (h === s.hash) return adopt(r);                  // only the account changed
    }
    if (isEmpty(local.data)) return adopt(r);
    put({ uid: user.uid, conflict: true, err: 'This phone and your account have different logs.' });
  }

  function sync() {
    if (running) return running;
    if (!user || leaving || st().conflict) return Promise.resolve();
    running = (async () => {
      try { await step(); }
      catch (e) {
        retryAt = Date.now() + 30000;
        const code = String(e.code || '');
        if (code === 'conflict') retryAt = 0;
        else if (/unavailable|network|deadline/.test(code) || !navigator.onLine || e instanceof TypeError) offline = true;
        else put({ err: /permission/.test(code) ? 'Your account was refused access.' : 'Could not save to your account.' });
      } finally { running = null; refresh(); }
    })();
    return running;
  }
  const changed = () => { const l = load(KEY); return !!(l && l.data && hash(l.data) !== st().hash); };
  const tick = () => { if (user && Date.now() >= retryAt && navigator.onLine && changed()) sync(); };
  const wake = () => { retryAt = 0; if (document.visibilityState === 'visible') sync(); };

  const when = t => new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(t);
  function status() {
    if (!ready) return '';
    if (!user) return 'Not signed in. Your log is only on this phone.';
    const s = st();
    if (s.err) return s.err;
    if (offline || !navigator.onLine) return 'Signed in as ' + user.email + '. Offline, so changes will sync later.';
    return 'Signed in as ' + user.email + (s.at ? '. Saved ' + when(s.at) + '.' : '.');
  }

  const WHY = {
    'auth/invalid-credential': 'Wrong email or password.', 'auth/wrong-password': 'Wrong email or password.', 'auth/user-not-found': 'Wrong email or password.',
    'auth/email-already-in-use': 'That email already has an account. Sign in instead.', 'auth/invalid-email': 'That email address doesn’t look right.',
    'auth/weak-password': 'Use at least 8 characters.', 'auth/password-does-not-meet-requirements': 'Choose a stronger password.',
    'auth/too-many-requests': 'Too many tries. Wait a few minutes.', 'auth/network-request-failed': 'No connection.', 'auth/user-disabled': 'This account has been disabled.'
  };

  const el = (tag, css, text) => { const n = document.createElement(tag); n.style.cssText = css || ''; if (text) n.textContent = text; return n; };
  const BTN = 'min-height:48px;border-radius:24px;font:700 14px Urbanist,system-ui,sans-serif;cursor:pointer;flex:none;';
  const button = (label, primary, fn) => { const b = el('button', BTN + (primary ? 'border:none;background:#c6f432;color:#0c110a' : 'border:1.5px solid #35486c;background:none;color:#f2f6fd'), label); b.type = 'button'; if (fn) b.onclick = fn; return b; };
  const link = (label, fn) => { const b = el('button', 'border:none;background:none;color:#7cc8ff;font:700 14px Urbanist,system-ui,sans-serif;min-height:40px;cursor:pointer;flex:none', label); b.type = 'button'; b.onclick = fn; return b; };
  const note = text => el('div', 'font-size:13px;color:#9ba9c0;line-height:1.45', text);
  const field = (type, label, auto) => {
    const i = el('input', 'height:48px;width:100%;box-sizing:border-box;border-radius:16px;border:1.5px solid #35486c;background:#0b111d;color:#f2f6fd;padding:0 14px;font:16px Urbanist,system-ui,sans-serif;flex:none');
    i.type = type; i.name = type; i.placeholder = label; i.autocomplete = auto; i.required = true; i.setAttribute('aria-label', label); return i;
  };

  function close() { if (ui) ui.remove(); ui = null; }
  function open() {
    if (!user && !ready && fire() && known()) return showSplash('Still connecting to your account.', [['Back to the app', hide]]);
    if (!user) { sessionStorage.removeItem('lmt-skip'); return showAuth(null, true); }
    close();
    ui = el('div', 'position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.7);display:flex;align-items:flex-end;justify-content:center');
    ui.className = 'lmt-back';
    ui.setAttribute('data-lmt-sheet', '');
    const box = el('div', 'width:100%;max-width:440px;max-height:92vh;overflow-y:auto;box-sizing:border-box;background:#121a29;color:#f2f6fd;border-radius:28px 28px 0 0;padding:26px 20px calc(26px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:12px;font-family:Urbanist,system-ui,sans-serif');
    box.setAttribute('role', 'dialog');
    const msg = el('div', 'font-size:14px;color:#ffb648;line-height:1.45;flex:none');
    msg.setAttribute('aria-live', 'polite');
    let busy = false;
    const run = async fn => {
      if (busy) return; busy = true; msg.textContent = 'Working…';
      try { await fn(); if (msg.textContent === 'Working…') msg.textContent = ''; }
      catch (e) { msg.textContent = why(e); }
      busy = false; refresh();
    };
    const s = st();
    box.append(el('div', 'font-size:22px;font-weight:600;flex:none', 'Your account'), note(status()), msg);
    if (s.conflict) {
      box.append(note('Choose which log to keep. The other one is replaced.'));
      box.append(button('Use my account’s log on this phone', true, () => run(async () => {
        const r = await fire().read(user.uid); if (!r) { put({ conflict: false, err: '', hash: '' }); await sync(); return open(); }
        const l = load(KEY); if (l) localStorage.setItem('lmt-before-sync', JSON.stringify(l));
        await adopt(r, true);
      })));
      box.append(button('Keep this phone’s log and save it to my account', false, () => run(async () => {
        const r = await fire().read(user.uid); await send(load(KEY), r ? r.rev : 0); open();
      })));
    } else {
      box.append(button('Sync now', true, () => run(async () => { retryAt = 0; await sync(); open(); })));
    }
    const confirmBox = el('div', 'display:none;flex-direction:column;gap:10px;flex:none');
    confirmBox.append(note('Signing out removes the log from this phone. It stays in your account.' + ((load(GKEY) || {}).token ? ' It also turns off GitHub backup on this phone.' : '')));
    confirmBox.append(button('Yes, sign out', false, () => run(async () => {
      retryAt = 0; if (running) await running; await sync();
      if (st().conflict) { msg.textContent = 'Choose which log to keep first.'; return; }
      if (offline || !navigator.onLine || changed() || st().err) { msg.textContent = 'Not everything is saved to your account yet. Get online, sync, then sign out.'; return; }
      leaving = true;
      try { await fire().signOut(); } catch (e) { leaving = false; throw e; }
      clearPhone(null);
    })));
    box.append(button('Sign out', false, ev => { confirmBox.style.display = 'flex'; ev.currentTarget.style.display = 'none'; }), confirmBox);
    box.append(button('Close', false, close));
    ui.append(box); ui.onclick = e => { if (e.target === ui) close(); };
    document.body.append(ui);
  }

  // ---- The screen in front of the app: sign in, create account, loading ----
  let gate = null, view = '', netFail = false;
  const why = e => WHY[e.code] || (navigator.onLine ? 'That didn’t work. Try again.' : 'No connection.');
  const node = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
  const btn = (cls, text, fn) => { const b = node('button', cls, text); b.type = 'button'; if (fn) b.onclick = fn; return b; };
  const lock = () => { document.documentElement.classList.toggle('lmt-gated', !!gate); if (document.body) document.body.inert = !!gate; };
  function mount(name) {
    if (!gate) { gate = node('div'); gate.id = 'lmt-gate'; document.documentElement.append(gate); }
    close(); view = name; gate.setAttribute('data-view', name); gate.textContent = '';
    const col = node('div', 'g-col'); gate.append(col); lock(); gate.scrollTop = 0;
    return col;
  }
  function hide() {
    if (!gate) return;
    const g = gate; gate = null; view = ''; lock();
    g.classList.add('g-out'); setTimeout(() => g.remove(), 260);
  }
  const skip = () => { sessionStorage.setItem('lmt-skip', '1'); hide(); refresh(); };
  const logo = () => { const m = node('div', 'g-mark'); m.append(node('i', 'ph-fill ph-barbell')); return m; };

  function showSplash(text, actions) {
    const col = mount('splash'); col.classList.add('g-middle');
    const m = logo(); if (!actions) m.classList.add('g-pulse');
    col.append(m);
    const t = node('p', 'g-sub', text || ''); t.setAttribute('role', 'status'); col.append(t);
    (actions || []).forEach(([label, fn], i) => col.append(btn(i ? 'g-link' : 'g-main', label, fn)));
  }

  function figure(stage) {
    if (!stage.isConnected) return;
    if (!window.LMTFig) return void setTimeout(() => figure(stage), 80);
    const d = load(KEY), sex = d && d.data && d.data.sex || 'male';
    stage.innerHTML = window.LMTFig.render('goblet', sex, true);
  }

  function showAuth(mode, canGoBack, email) {
    mode = mode || (localStorage.getItem('lmt-known') ? 'signin' : 'create');
    const creating = mode === 'create', forgot = mode === 'forgot';
    const col = mount('auth');
    const stage = node('div', 'g-stage'); stage.setAttribute('aria-hidden', 'true'); col.append(stage); figure(stage);
    const body = node('div', 'g-body'); col.append(body);
    body.append(node('h1', 'g-title', forgot ? 'Reset your password' : 'Lean Muscle'));
    body.append(node('p', 'g-sub', forgot ? 'We’ll email you a link to choose a new one.' : creating ? 'Create an account to start. Your training log is saved to it.' : 'Welcome back. Sign in to open your training log.'));
    const form = node('form', 'g-form');
    const mail = node('input', 'g-input');
    Object.assign(mail, { type: 'email', name: 'email', id: 'lmt-email', autocomplete: 'username', required: true, value: email || '' });
    if (!forgot) {
      const seg = node('div', 'g-seg' + (creating ? '' : ' g-right')); seg.setAttribute('role', 'tablist');
      [['create', 'Create account'], ['signin', 'Sign in']].forEach(([m, label]) => {
        const b = btn('', label, () => { if (m !== mode) showAuth(m, canGoBack, mail.value); });
        b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', String(m === mode)); seg.append(b);
      });
      body.append(seg);
    }
    const field = (label, input) => { const w = node('div', 'g-field'), l = node('label', '', label); l.htmlFor = input.id; w.append(l, input); return w; };
    form.append(field('Email', mail));
    let pass = null;
    if (!forgot) {
      pass = node('input', 'g-input');
      Object.assign(pass, { type: 'password', name: 'password', id: 'lmt-password', autocomplete: creating ? 'new-password' : 'current-password', required: true });
      if (creating) pass.minLength = 8;
      const f = field('Password', pass), wrap = node('div', 'g-pass');
      const eye = btn('g-eye', '', () => { const show = pass.type === 'password'; pass.type = show ? 'text' : 'password'; eye.firstChild.className = show ? 'ph ph-eye-slash' : 'ph ph-eye'; eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); });
      eye.append(node('i', 'ph ph-eye')); eye.setAttribute('aria-label', 'Show password');
      wrap.append(pass, eye); f.append(wrap);
      if (creating) f.append(node('small', '', 'At least 8 characters.'));
      else f.append(btn('g-link g-forgot', 'Forgot password?', () => showAuth('forgot', canGoBack, mail.value)));
      form.append(f);
    }
    const saved = load(KEY), count = saved && saved.data && (saved.data.history || []).length;
    if (creating && count) form.append(node('p', 'g-keep', 'The ' + (count === 1 ? 'session' : count + ' sessions') + ' already on this phone will be saved to your new account.'));
    const msg = node('p', 'g-msg'); msg.setAttribute('aria-live', 'polite'); form.append(msg);
    const label = forgot ? 'Email me a reset link' : creating ? 'Create account' : 'Sign in';
    const go = node('button', 'g-main', label); go.type = 'submit'; form.append(go);
    const offlineLink = btn('g-link', 'Use offline for now', skip);
    const offer = () => { offlineLink.hidden = !(netFail || !navigator.onLine || !fire()); };
    let busy = false;
    form.onsubmit = async ev => {
      ev.preventDefault();
      if (busy) return;
      if (!fire()) { msg.textContent = 'Accounts couldn’t load. Close the app and open it again with a connection.'; return; }
      busy = true; msg.textContent = ''; msg.classList.remove('g-ok'); go.disabled = true; go.textContent = forgot ? 'Sending…' : creating ? 'Creating account…' : 'Signing in…';
      const e = mail.value.trim();
      try {
        if (forgot) { await fire().reset(e); msg.classList.add('g-ok'); msg.textContent = 'If that email has an account, a reset link is on its way. Check spam too.'; }
        else await (creating ? fire().signUp(e, pass.value) : fire().signIn(e, pass.value));
      } catch (x) { netFail = netFail || x.code === 'auth/network-request-failed'; msg.textContent = why(x); offer(); }
      busy = false; go.disabled = false; go.textContent = label;
    };
    body.append(form);
    if (forgot) body.append(btn('g-link', 'Back to sign in', () => showAuth('signin', canGoBack, mail.value)));
    if (creating) body.append(node('p', 'g-small', 'Other users can’t see your log. The person who runs this app manages the database and could view it.'));
    body.append(offlineLink); offer();
    if (canGoBack) body.append(btn('g-link', 'Back to the app', skip));
  }

  // First sync for this person on this phone happens before the app is shown.
  async function arrive() {
    showSplash('Getting your log…');
    while (!load(KEY)) await new Promise(r => setTimeout(r, 150));
    retryAt = 0;
    await sync();
    if (reloading) return;
    if (offline || st().err) return showSplash(offline ? 'Couldn’t reach your account. Check your connection.' : st().err, [['Try again', arrive], ['Continue to the app', hide]]);
    hide();
    if (st().conflict) open();
  }

  function refresh() {
    document.querySelectorAll('[data-lmt-account]').forEach(n => { if (n.textContent !== status()) n.textContent = status(); });
    if (user && st().err && document.body) {
      if (!pill) { pill = el('button', 'position:fixed;top:calc(44px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:90;border:none;border-radius:18px;padding:8px 14px;background:#ffb020;color:#121a29;font:700 13px Urbanist,system-ui,sans-serif;white-space:nowrap', 'Account needs attention'); pill.onclick = () => open(); document.body.append(pill); }
    } else if (pill) { pill.remove(); pill = null; }
    window.dispatchEvent(new Event('lmt-account'));
  }

  window.LMTAccount = { open: () => open(), status, signedOut: () => ready && !user, signedIn: () => !!user, email: () => user ? user.email : '' };

  // Someone who has already synced on this phone goes straight in, even with a slow connection.
  const known = () => { const s = st(); return !!(s.uid && (s.hash || s.conflict)); };
  const skipped = () => !!sessionStorage.getItem('lmt-skip');
  if (!known() && !skipped()) {
    if (fire()) {
      showSplash('');
      setTimeout(() => { if (!ready && view === 'splash') showSplash('This is taking longer than usual.', [['Continue without signing in', skip]]); }, 7000);
    } else showAuth();
  }
  document.addEventListener('DOMContentLoaded', lock);

  if (fire()) fire().onUser(u => {
    if (leaving) return;
    user = u; ready = true; offline = false; refresh();
    if (!u) { if (skipped()) hide(); else if (view !== 'auth') showAuth(); return; }
    sessionStorage.removeItem('lmt-skip'); localStorage.setItem('lmt-known', '1'); close();
    if (!known() || st().uid !== u.uid) return void arrive();
    hide();
    const go = () => load(KEY) ? sync() : setTimeout(go, 200);
    go();
  });
  setInterval(tick, 4000);
  window.addEventListener('online', () => { netFail = false; wake(); });
  window.addEventListener('offline', () => { const l = gate && [...gate.querySelectorAll('.g-link')].find(b => b.textContent === 'Use offline for now'); if (l) l.hidden = false; refresh(); });
  document.addEventListener('visibilitychange', wake);
})();
