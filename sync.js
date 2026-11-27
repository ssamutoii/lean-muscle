// Automatic backup to a private GitHub repository. The token stays on this device.
(function () {
  const REPO = 'ssamutoii/lean-muscle-data', FILE = 'backup.json';
  const KEY = 'lean-muscle-tracker:v2', SKEY = 'lmt-sync';
  const API = 'https://api.github.com/repos/' + REPO;
  let busy = false, retryAt = 0, ui = null, pill = null;

  const load = k => { try { return JSON.parse(localStorage.getItem(k)) || null; } catch (e) { return null; } };
  const st = () => load(SKEY) || {};
  const put = patch => localStorage.setItem(SKEY, JSON.stringify(Object.assign(st(), patch)));
  const hash = o => { const s = JSON.stringify(o); let h = 5381; for (let i = 0; i < s.length; i++) h = (h * 33 ^ s.charCodeAt(i)) >>> 0; return h + ':' + s.length; };
  const isEmpty = d => !d || (!(d.history || []).length && !(d.body || []).length);
  const b64 = s => { const b = new TextEncoder().encode(s); let o = ''; for (let i = 0; i < b.length; i += 8192) o += String.fromCharCode.apply(null, b.subarray(i, i + 8192)); return btoa(o); };

  async function call(token, url, opt, accept) {
    const r = await fetch(url, Object.assign({ cache: 'no-store' }, opt, { headers: { Authorization: 'Bearer ' + token, Accept: accept || 'application/vnd.github+json' } }));
    if (!r.ok) { const e = new Error('GitHub error ' + r.status); e.status = r.status; throw e; }
    return r;
  }
  const explain = e => e.status === 401 ? 'The token is wrong or has expired.' : e.status === 403 ? 'The token lacks Contents: Read and write.' : e.status === 404 ? 'The token cannot see ' + REPO + '.' : e.status ? e.message : 'No connection.';

  async function remote(token) {
    try {
      const meta = await (await call(token, API + '/contents/' + FILE, {}, 'application/vnd.github.object+json')).json();
      const doc = await (await call(token, API + '/contents/' + FILE, {}, 'application/vnd.github.raw+json')).json();
      if (!doc || !doc.data || !Array.isArray(doc.data.history)) throw new Error('The cloud backup is not readable.');
      return { sha: meta.sha, doc };
    } catch (e) { if (e.status === 404) return null; throw e; }
  }

  async function upload(token, local, sha) {
    const body = { message: 'Backup ' + new Date().toISOString(), content: b64(JSON.stringify(local)) };
    if (sha) body.sha = sha;
    const j = await (await call(token, API + '/contents/' + FILE, { method: 'PUT', body: JSON.stringify(body) })).json();
    put({ sha: j.content.sha, hash: hash(local.data), at: Date.now(), err: '', conflict: false });
  }

  async function push(force) {
    const s = st(), local = load(KEY);
    if (busy || !s.token || s.conflict || !local || !local.data) return;
    if (!force && (hash(local.data) === s.hash || Date.now() < retryAt || !navigator.onLine)) return;
    busy = true;
    try { await upload(s.token, local, s.sha); }
    catch (e) {
      retryAt = Date.now() + 60000;
      if (e.status === 409 || e.status === 422) put({ conflict: true, err: 'The cloud copy was changed from somewhere else.' });
      else if (e.status) put({ err: explain(e) });
    } finally { busy = false; refresh(); }
  }

  function useCloud(r) {
    localStorage.setItem(KEY, JSON.stringify({ data: r.doc.data, draft: null, savedAt: Date.now(), v3: true }));
    put({ sha: r.sha, hash: hash(r.doc.data), at: Date.now(), err: '', conflict: false });
    location.reload();
  }

  // Never overwrites differing data on either side without asking.
  async function reconcile(token) {
    busy = true;
    try { await match(token); } finally { busy = false; }
  }

  async function match(token) {
    const info = await (await call(token, API)).json();
    if (!info.private) throw new Error('That repository is public, so nothing was uploaded.');
    const r = await remote(token), local = load(KEY);
    put({ token, err: '', conflict: false });
    if (!r) { await upload(token, local, null); return; }
    if (!local || isEmpty(local.data)) return useCloud(r);
    if (hash(local.data) === hash(r.doc.data)) { put({ sha: r.sha, hash: hash(local.data), at: Date.now() }); return; }
    put({ conflict: true, err: 'This phone and the cloud have different logs.' });
    open(r);
  }

  const el = (tag, css, text) => { const n = document.createElement(tag); n.style.cssText = css || ''; if (text) n.textContent = text; return n; };
  const BTN = 'height:48px;border-radius:24px;font:700 14px Urbanist,system-ui,sans-serif;cursor:pointer;flex:none;';
  const button = (label, primary, fn) => { const b = el('button', BTN + (primary ? 'border:none;background:#c6f432;color:#0c110a' : 'border:1.5px solid #3a4236;background:none;color:#f1f4ec'), label); b.onclick = fn; return b; };
  const status = () => { const s = st(); if (!s.token) return 'Off. Your log is only on this device.'; if (s.err) return s.err; return s.at ? 'On. Last backed up ' + new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(s.at) + '.' : 'On.'; };

  function close() { if (ui) ui.remove(); ui = null; }
  function open(cloud) {
    close();
    ui = el('div', 'position:fixed;inset:0;z-index:100;background:rgba(0,0,0,.7);display:flex;align-items:flex-end;justify-content:center');
    const box = el('div', 'width:100%;max-width:440px;max-height:88vh;overflow-y:auto;background:#141813;color:#f1f4ec;border-radius:32px 32px 0 0;padding:26px 20px calc(26px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:12px;font-family:Urbanist,system-ui,sans-serif');
    const msg = el('div', 'font-size:14px;color:#cfd6c8;line-height:1.45', status());
    box.append(el('div', 'font-size:22px;font-weight:600;flex:none', 'Cloud backup'), msg);
    const run = async fn => { msg.textContent = 'Working…'; try { await fn(); msg.textContent = status(); } catch (e) { msg.textContent = e.status === undefined && !(e instanceof TypeError) ? e.message : explain(e); } refresh(); };
    const s = st();
    if (!s.token) {
      box.append(el('div', 'font-size:13px;color:#9aa296;line-height:1.45', 'Paste your GitHub token once. After that, backups happen on their own to the private repository ' + REPO + '.'));
      const input = el('input', 'height:48px;border-radius:16px;border:1.5px solid #3a4236;background:#0e110d;color:#f1f4ec;padding:0 14px;font-size:16px;flex:none');
      input.type = 'password'; input.placeholder = 'github_pat_…'; input.autocomplete = 'off'; input.setAttribute('aria-label', 'GitHub token');
      box.append(input, button('Turn on backup', true, () => run(async () => { const t = input.value.trim(); if (!t) throw new Error('Paste the token first.'); await reconcile(t); if (!st().conflict) open(); })));
    } else if (s.conflict) {
      box.append(el('div', 'font-size:13px;color:#9aa296;line-height:1.45', 'Choose which log to keep. Earlier cloud versions stay in the repository history.'));
      box.append(button('Use the cloud copy on this phone', true, () => run(async () => { const r = cloud || await remote(s.token); if (!r) throw new Error('No cloud copy found.'); useCloud(r); })));
      box.append(button('Keep this phone and overwrite cloud', false, () => run(async () => { const r = await remote(s.token); await upload(s.token, load(KEY), r && r.sha); open(); })));
    } else {
      box.append(button('Back up now', true, () => run(() => push(true))));
    }
    if (s.token) box.append(button('Disconnect this device', false, () => { localStorage.removeItem(SKEY); refresh(); open(); }));
    box.append(button('Close', false, close));
    ui.append(box); ui.onclick = e => { if (e.target === ui) close(); };
    document.body.append(ui);
  }

  function refresh() {
    const s = st();
    if (s.token && s.err) {
      if (!pill) { pill = el('button', 'position:fixed;top:calc(6px + env(safe-area-inset-top));left:50%;transform:translateX(-50%);z-index:90;border:none;border-radius:18px;padding:8px 14px;background:#ffb020;color:#141813;font:700 13px Urbanist,system-ui,sans-serif;white-space:nowrap', 'Backup needs attention'); pill.onclick = () => open(); document.body.append(pill); }
    } else if (pill) { pill.remove(); pill = null; }
  }

  window.LMTSync = { open: () => open(), status };
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  setInterval(() => push(), 4000);
  window.addEventListener('online', () => { retryAt = 0; push(); });
  document.addEventListener('visibilitychange', () => { retryAt = 0; push(); });
  window.addEventListener('load', refresh);
})();
