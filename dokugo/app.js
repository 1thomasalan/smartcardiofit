/* Dokugo v2 — 読後, "after reading". Plain JS PWA, data on the device. */
'use strict';
const VERSION = '2.0.1';
const KEY = 'dokugo-v2';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const dkey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const fmtDate = iso => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const I = {
  camera: '<svg class="i" viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  type: '<svg class="i" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/></svg>',
  mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  share: '<svg class="i" viewBox="0 0 24 24"><path d="M12 15V3"/><path d="M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
  star: '<svg class="i" viewBox="0 0 24 24"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  starF: '<svg class="i" viewBox="0 0 24 24" style="fill:currentColor"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  edit: '<svg class="i" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>',
  gear: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  search: '<svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>',
  barcode: '<svg class="i" viewBox="0 0 24 24"><path d="M4 6v12M7 6v12M10 6v12M14 6v12M16 6v12M20 6v12"/></svg>',
  book: '<svg class="i" viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/></svg>',
  next: '<svg class="i" viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
  dl: '<svg class="i" viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
  back: '<svg class="i" viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>'
};
const THEMES = {
  dusk: ['#c98f6b', '#6d5a7a', '#2b3352', '#0e1420', '#f3d9a4'], dawn: ['#ffd3a5', '#f2a7a0', '#8f8bc6', '#34416e', '#fff1d6'],
  ocean: ['#6fd6d6', '#2b7a9e', '#173a5e', '#07142a', '#c8f6f2'], forest: ['#b9cc8c', '#55806a', '#1f3b33', '#0a1613', '#e6f2c4'],
  sakura: ['#ffd3de', '#e59ab5', '#7a5a85', '#1f1830', '#ffe3ec'], midnight: ['#1b2131', '#111521', '#090b11', '#000000', '#cfd8ec']
};
const SPINES = ['#4a3f63', '#38506b', '#6b4a4a', '#3f5e55', '#5b5470', '#6a5a3e', '#2f4660', '#5e3f58'];

/* ---------- store ---------- */
let S = load();
function load() {
  try { const d = JSON.parse(localStorage.getItem(KEY)); if (d && d.books) return Object.assign(blank(), d); } catch (e) {}
  return blank();
}
function blank() { return { books: [], passages: [], log: [], seen: {}, settings: { name: 'Alan', theme: 'dusk' } }; }
function save() { localStorage.setItem(KEY, JSON.stringify(S)); }
const book = id => S.books.find(b => b.id === id);
const passagesOf = id => S.passages.filter(p => p.bookId === id);
function logDay(bookId, page) { S.log.push({ d: dkey(), b: bookId, p: page || null }); if (S.log.length > 3000) S.log = S.log.slice(-3000); }

/* ---------- ui helpers ---------- */
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2200); }
let sheetOpen = false;
function openSheet(html, after) {
  $('#sheetBody').innerHTML = html; $('#sheet').scrollTop = 0;
  if (!sheetOpen) { history.pushState({ sheet: 1 }, ''); sheetOpen = true; }
  $('#sheet').classList.add('show'); $('#scrim').classList.add('show');
  after && after($('#sheetBody'));
}
function closeSheet(fromPop) {
  if (!sheetOpen) return; sheetOpen = false; stopVoice();
  $('#sheet').classList.remove('show'); $('#scrim').classList.remove('show');
  if (!fromPop) history.back();
}
$('#closeSheet').onclick = () => closeSheet();
$('#scrim').onclick = () => closeSheet();
window.addEventListener('popstate', () => { if (retOpen) closeReturn(true); else if (sheetOpen) closeSheet(true); });

function hashN(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
function coverHTML(b, extra = '') {
  const bg = `background:linear-gradient(160deg,${SPINES[hashN(b.title) % SPINES.length]},#1d2133)`;
  return `<div class="cover" style="${bg}"><span>${esc(b.title)}</span>${b.cover ? `<img src="${esc(b.cover)}" alt="" loading="lazy" onerror="this.remove()">` : ''}${extra}</div>`;
}
const pct = b => b.pages ? Math.min(100, Math.round((b.current || 0) / b.pages * 100)) : (b.status === 'finished' ? 100 : 0);

/* ---------- navigation ---------- */
let view = 'today';
$$('#nav button[data-v]').forEach(b => b.onclick = () => { if (b.dataset.v === 'return') return openReturn(); go(b.dataset.v); });
$('#navPlus').onclick = () => startCapture();
function go(v) { view = v; $$('#nav button[data-v]').forEach(b => b.classList.toggle('on', b.dataset.v === v)); render(); window.scrollTo(0, 0); }
function render() { document.body.dataset.theme = S.settings.theme; const el = $('#view'); el.innerHTML = ({ today: vToday, shelf: vShelf, passages: vPassages })[view](); el.classList.remove('fadein'); void el.offsetWidth; el.classList.add('fadein'); bind(el); }
function topbar() {
  return `<div class="top"><div class="brand"><b>DOKUGO</b><i>読後</i></div><button class="icon" data-act="settings" aria-label="Settings">${I.gear}</button></div>`;
}

/* ---------- Today ---------- */
function greet() { const h = new Date().getHours(); return h < 5 ? 'Up early' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; }
function vToday() {
  const reading = S.books.filter(b => b.status === 'reading');
  const daily = dailyPassage();
  const days = new Set([...S.log.map(l => l.d), ...S.passages.map(p => dkey(new Date(p.created)))]);
  const wk = []; const now = new Date();
  for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate() - i); wk.push(d); }
  let streak = 0; { const d = new Date(now); if (!days.has(dkey(d))) d.setDate(d.getDate() - 1); while (days.has(dkey(d))) { streak++; d.setDate(d.getDate() - 1); } }
  const yr = String(now.getFullYear());
  const finished = S.books.filter(b => b.status === 'finished' && (b.finished || '').startsWith(yr)).length;
  return `${topbar()}
  <div class="hero"><div class="kanji">${greet()}, ${esc(S.settings.name || 'reader')}</div>
    <h1>After reading, what stayed with you?</h1><p>Snap the page. Say what clicked. Keep it.</p></div>
  <div class="capture"><button class="go" data-act="capture" aria-label="Capture a passage">${I.camera.replace('class="i"', '')}</button><small>Capture a passage</small></div>
  ${reading.length ? `<h2>Currently reading <small>${reading.length}</small></h2><div class="reading">${reading.map(b => `
    <button class="card rcard" data-book="${b.id}">${coverHTML(b)}<div style="flex:1;min-width:0"><div class="t">${esc(b.title)}</div><div class="a">${esc(b.author || '')}</div>
      <div class="prog"><span style="width:${pct(b)}%"></span></div><div class="pmeta">${b.pages ? `Page ${b.current || 0} of ${b.pages} · ${pct(b)}%` : 'Tap to set your page'} · ${passagesOf(b.id).length} passages</div></div></button>`).join('')}</div>` : ''}
  ${daily ? `<h2>Return to this <small>${fmtDate(daily.created)}</small></h2>
    <div class="card pas"><p class="quote">“${esc(daily.text)}”</p><div class="qmeta">${esc(book(daily.bookId)?.title || '')}${daily.page ? ' · p. ' + esc(daily.page) : ''}</div>
    ${daily.reflection ? `<div class="refl">${esc(daily.reflection)}</div>` : ''}
    <div class="ft"><span class="sp"></span><button data-share="${daily.id}" aria-label="Share">${I.share}</button><button data-act="return" aria-label="More">${I.next}</button></div></div>` : ''}
  <h2>This week <small>${streak ? streak + '-day streak' : 'Read a page today'}</small></h2>
  <div class="card"><div class="week">${wk.map(d => `<div class="day ${days.has(dkey(d)) ? 'on' : ''} ${dkey(d) === dkey() ? 'today' : ''}"><i></i>${d.toLocaleDateString(undefined, { weekday: 'narrow' })}</div>`).join('')}</div>
    <div class="stats"><div><b>${S.books.length}</b><span>Books</span></div><div><b>${S.passages.length}</b><span>Passages</span></div><div><b>${finished}</b><span>Read in ${yr}</span></div></div></div>
  ${!S.books.length ? emptyIntro() : ''}`;
}
function emptyIntro() {
  return `<div class="empty"><p class="quote">“Capture passages. Add your reflection. Return to what changed you.”</p>
  <p>Dokugo keeps the lines that moved you, with the thought you had when you read them. Photograph a page, tell it what clicked, and it finds the exact words.</p>
  <p style="font-style:italic">Dokugo is Japanese and means “after reading.”</p>
  <p style="margin-top:22px"><button class="btn" data-act="addbook">${I.book} Add your first book</button></p></div>`;
}
function dailyPassage() {
  if (!S.passages.length) return null;
  const favs = S.passages.filter(p => p.fav); const pool = favs.length >= 3 ? favs : S.passages;
  return pool[hashN(dkey()) % pool.length];
}

/* ---------- Shelf ---------- */
let shelfFilter = 'all';
function vShelf() {
  const f = shelfFilter;
  const list = S.books.filter(b => f === 'all' || b.status === f).sort((a, b) => (b.updated || b.added).localeCompare(a.updated || a.added));
  const n = s => S.books.filter(b => b.status === s).length;
  return `${topbar()}<h2 style="margin-top:22px;font-size:30px">Your shelf <button data-act="addbook">+ Add book</button></h2>
  <div class="chips scroll">${[['all', 'All ' + S.books.length], ['reading', 'Reading ' + n('reading')], ['finished', 'Finished ' + n('finished')], ['want', 'Want to read ' + n('want')]].map(([k, l]) => `<button class="chip ${f === k ? 'on' : ''}" data-shelf="${k}">${l}</button>`).join('')}</div>
  ${list.length ? `<div class="shelf">${list.map(b => { const c = passagesOf(b.id).length; return `<button class="bk" data-book="${b.id}">${coverHTML(b, c ? `<em class="badge">${c}</em>` : '')}<div class="t">${esc(b.title)}</div><div class="a">${esc(b.author || '')}</div>${b.status === 'reading' ? `<div class="prog"><span style="width:${pct(b)}%"></span></div>` : ''}</button>`; }).join('')}</div>`
    : (S.books.length ? `<div class="empty"><p>Nothing here yet.</p></div>` : emptyIntro())}`;
}

/* ---------- Passages ---------- */
let pq = '', ptag = '', psort = 'new';
function allTags() { const m = {}; S.passages.forEach(p => (p.tags || []).forEach(t => m[t] = (m[t] || 0) + 1)); return Object.entries(m).sort((a, b) => b[1] - a[1]).map(x => x[0]); }
function filteredPassages() {
  const q = pq.toLowerCase().trim();
  let l = S.passages.filter(p => (!ptag || (ptag === '★' ? p.fav : (p.tags || []).includes(ptag))) && (!q || [p.text, p.reflection, (p.tags || []).join(' '), book(p.bookId)?.title, book(p.bookId)?.author].join(' ').toLowerCase().includes(q)));
  if (psort === 'new') l.sort((a, b) => b.created.localeCompare(a.created));
  if (psort === 'old') l.sort((a, b) => a.created.localeCompare(b.created));
  if (psort === 'book') l.sort((a, b) => (book(a.bookId)?.title || '').localeCompare(book(b.bookId)?.title || '') || (parseInt(a.page) || 0) - (parseInt(b.page) || 0));
  return l;
}
function pasCard(p, showBook = true) {
  const b = book(p.bookId);
  return `<div class="card pas"><p class="quote">“${esc(p.text)}”</p>
  <div class="qmeta">${showBook ? esc(b?.title || '') : ''}${p.page ? (showBook ? ' · ' : '') + 'p. ' + esc(p.page) : ''}</div>
  ${p.reflection ? `<div class="refl">${esc(p.reflection)}</div>` : ''}
  ${(p.tags || []).length ? `<div>${p.tags.map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div>` : ''}
  <div class="ft"><span>${fmtDate(p.created)}</span><span class="sp"></span>
  <button class="${p.fav ? 'fav' : ''}" data-fav="${p.id}" aria-label="Favorite">${p.fav ? I.starF : I.star}</button>
  <button data-share="${p.id}" aria-label="Share">${I.share}</button><button data-editp="${p.id}" aria-label="Edit">${I.edit}</button></div></div>`;
}
function vPassages() {
  const tags = allTags(); const l = filteredPassages();
  return `${topbar()}<h2 style="margin-top:22px;font-size:30px">Passages <small>${S.passages.length} kept</small></h2>
  <div class="search">${I.search}<input id="pq" placeholder="Search words, thoughts, books" value="${esc(pq)}"></div>
  <div class="chips scroll" style="margin-top:12px"><button class="chip ${!ptag ? 'on' : ''}" data-tag="">All</button><button class="chip ${ptag === '★' ? 'on' : ''}" data-tag="★">★ Favorites</button>${tags.map(t => `<button class="chip ${ptag === t ? 'on' : ''}" data-tag="${esc(t)}">#${esc(t)}</button>`).join('')}</div>
  <div class="row" style="margin-top:12px"><span class="lbl">${l.length} shown</span><span class="sp"></span>${[['new', 'Newest'], ['old', 'Oldest'], ['book', 'By book']].map(([k, n]) => `<button class="chip ${psort === k ? 'on' : ''}" data-sort="${k}" style="padding:6px 12px;font-size:12px">${n}</button>`).join('')}</div>
  <div class="plist" id="plist">${l.map(p => pasCard(p)).join('') || `<div class="empty"><p>${S.passages.length ? 'No passages match.' : 'Your first passage is one photo away.'}</p></div>`}</div>
  ${S.passages.length ? `<p class="center" style="margin-top:24px"><button class="btn ghost sm" data-act="exportall">${I.dl} Export all to Markdown</button></p>` : ''}`;
}

/* ---------- bindings ---------- */
function bind(root) {
  $$('[data-book]', root).forEach(b => b.onclick = () => openBook(b.dataset.book));
  $$('[data-shelf]', root).forEach(b => b.onclick = () => { shelfFilter = b.dataset.shelf; render(); });
  $$('[data-tag]', root).forEach(b => b.onclick = () => { ptag = b.dataset.tag; render(); });
  $$('[data-sort]', root).forEach(b => b.onclick = () => { psort = b.dataset.sort; render(); });
  $$('[data-fav]', root).forEach(b => b.onclick = () => { const p = S.passages.find(x => x.id === b.dataset.fav); p.fav = !p.fav; save(); refresh(); });
  $$('[data-share]', root).forEach(b => b.onclick = () => sharePassage(b.dataset.share));
  $$('[data-editp]', root).forEach(b => b.onclick = () => editPassage(b.dataset.editp));
  $$('[data-act]', root).forEach(b => b.onclick = () => ACT[b.dataset.act](b));
  const q = $('#pq', root); if (q) q.oninput = () => { pq = q.value; const l = filteredPassages(); $('#plist').innerHTML = l.map(p => pasCard(p)).join('') || '<div class="empty"><p>No passages match.</p></div>'; bind($('#plist')); };
}
function refresh() { if (sheetOpen && curBook) openBook(curBook, true); render(); }
const ACT = {
  settings: openSettings, capture: () => startCapture(), addbook: () => addBook(), return: () => openReturn(),
  exportall: () => exportMD(), backup: backupJSON, import: () => $('#importPick').click()
};

/* ---------- Book sheet ---------- */
let curBook = null;
function openBook(id, keep) {
  const b = book(id); if (!b) return; curBook = id;
  const ps = passagesOf(id).sort((a, c) => (parseInt(a.page) || 9e9) - (parseInt(c.page) || 9e9) || a.created.localeCompare(c.created));
  const html = `<div class="bookhead">${coverHTML(b)}<div style="flex:1;min-width:0"><h3>${esc(b.title)}</h3><div class="sub" style="margin:0">${esc(b.author || '')}</div></div></div>
  <div class="seg" style="margin:16px 0">${[['reading', 'Reading'], ['finished', 'Finished'], ['want', 'Want to read']].map(([k, l]) => `<button class="chip ${b.status === k ? 'on' : ''}" data-st="${k}">${l}</button>`).join('')}</div>
  ${b.status !== 'want' ? `<div class="card" style="padding:16px"><div class="row"><span class="lbl">Progress</span><span class="sp"></span><span class="pmeta" style="margin:0" id="pg">${b.pages ? `Page ${b.current || 0} of ${b.pages} · ${pct(b)}%` : 'Add the page count'}</span></div>
    ${b.pages ? `<input type="range" class="slider" id="pslide" min="0" max="${b.pages}" value="${b.current || 0}" style="margin-top:12px">` : ''}
    <div class="two" style="margin-top:10px"><div class="field" style="margin:0"><label>I'm on page</label><input id="pcur" inputmode="numeric" value="${b.current || ''}"></div><div class="field" style="margin:0"><label>Total pages</label><input id="ptot" inputmode="numeric" value="${b.pages || ''}"></div></div></div>` : ''}
  <div class="row" style="margin-top:18px;gap:8px;flex-wrap:wrap"><button class="btn sm" data-cap>${I.camera} Capture</button><button class="btn ghost sm" data-md>${I.dl} Markdown</button><button class="btn ghost sm" data-eb>${I.edit} Edit</button></div>
  <h2>Passages <small>${ps.length}</small></h2>
  <div class="plist" style="grid-template-columns:1fr">${ps.map(p => pasCard(p, false)).join('') || `<div class="empty" style="padding:20px"><p>Capture passages. Add your reflection. Return to what changed you.</p></div>`}</div>`;
  openSheet(html, el => {
    bind(el);
    $$('[data-st]', el).forEach(x => x.onclick = () => { b.status = x.dataset.st; if (b.status === 'finished') { b.finished = b.finished || dkey(); if (b.pages) b.current = b.pages; } if (b.status === 'reading') b.started = b.started || dkey(); touch(b); refresh(); });
    const setCur = v => { v = Math.max(0, Math.min(b.pages || 99999, parseInt(v) || 0)); if (v !== (b.current || 0)) { b.current = v; logDay(b.id, v); if (b.pages && v >= b.pages && b.status === 'reading') toast('Last page. Mark it finished?'); touch(b); } $('#pg', el) && ($('#pg', el).textContent = b.pages ? `Page ${b.current || 0} of ${b.pages} · ${pct(b)}%` : ''); };
    const sl = $('#pslide', el); if (sl) { sl.oninput = () => { $('#pcur', el).value = sl.value; $('#pg', el).textContent = `Page ${sl.value} of ${b.pages} · ${Math.round(sl.value / b.pages * 100)}%`; }; sl.onchange = () => { setCur(sl.value); render(); }; }
    const pc = $('#pcur', el); if (pc) pc.onchange = () => { setCur(pc.value); if (sl) sl.value = b.current; render(); };
    const pt = $('#ptot', el); if (pt) pt.onchange = () => { b.pages = parseInt(pt.value) || null; touch(b); openBook(id, true); render(); };
    $('[data-cap]', el).onclick = () => startCapture(id);
    $('[data-md]', el).onclick = () => exportMD(id);
    $('[data-eb]', el).onclick = () => bookForm(b);
  });
}
function touch(b) { b.updated = new Date().toISOString(); save(); }

/* ---------- Add / edit book ---------- */
function addBook(then) {
  openSheet(`<h3>Add a book</h3><div class="sub">Search by title, scan the barcode, or type it in.</div>
  <div class="search">${I.search}<input id="bq" placeholder="Title, author, or ISBN" autocomplete="off"></div>
  <div class="row" style="margin-top:12px;gap:8px"><button class="btn ghost sm" id="scanB">${I.barcode} Scan barcode</button><button class="btn ghost sm" id="manB">${I.type} Type it in</button></div>
  <div class="results" id="bres"></div>`, el => {
    let t; const q = $('#bq', el);
    q.oninput = () => { clearTimeout(t); t = setTimeout(() => lookup(q.value, el, then), 450); };
    q.onkeydown = e => { if (e.key === 'Enter') { clearTimeout(t); lookup(q.value, el, then); } };
    $('#manB', el).onclick = () => bookForm({ title: q.value }, then);
    $('#scanB', el).onclick = () => pickImage(async img => {
      $('#bres', el).innerHTML = '<p class="note center">Reading the barcode…</p>';
      const isbn = await readBarcode(img);
      if (isbn) { q.value = isbn; lookup(isbn, el, then); }
      else $('#bres', el).innerHTML = '<p class="note center">I couldn\'t read a barcode in that photo. Try closer and flatter, or type the ISBN printed above it.</p>';
    });
    setTimeout(() => q.focus(), 350);
  });
}
async function readBarcode(img) {
  if (!('BarcodeDetector' in window)) return null;
  try { const d = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] }); const r = await d.detect(img); const c = r.find(x => /^(97[89])?\d{9}[\dX]$/.test(x.rawValue)) || r[0]; return c ? c.rawValue : null; } catch (e) { return null; }
}
async function lookup(q, el, then) {
  q = q.trim(); const box = $('#bres', el); if (q.length < 2) { box.innerHTML = ''; return; }
  box.innerHTML = '<p class="note center">Searching…</p>';
  const isbn = q.replace(/[-\s]/g, ''); const isI = /^(\d{9}[\dX]|\d{13})$/i.test(isbn);
  let out = [];
  try {
    const r = await fetch('https://www.googleapis.com/books/v1/volumes?maxResults=8&printType=books&q=' + encodeURIComponent(isI ? 'isbn:' + isbn : q)).then(r => r.json());
    out = (r.items || []).map(i => { const v = i.volumeInfo || {}; return { title: v.title + (v.subtitle && v.subtitle.length < 40 ? ': ' + v.subtitle : ''), author: (v.authors || []).join(', '), pages: v.pageCount || null, cover: v.imageLinks ? (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail).replace('http:', 'https:').replace('&edge=curl', '') : '', isbn: ((v.industryIdentifiers || []).find(x => x.type === 'ISBN_13') || {}).identifier || '' }; });
  } catch (e) {}
  try {
    const r = await fetch('https://openlibrary.org/search.json?limit=8&fields=title,author_name,cover_i,number_of_pages_median,isbn&q=' + encodeURIComponent(q)).then(r => r.json());
    const ol = (r.docs || []).map(d => ({ title: d.title, author: (d.author_name || []).slice(0, 2).join(', '), pages: d.number_of_pages_median || null, cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : '', isbn: (d.isbn || [])[0] || '' }));
    // upgrade Google covers with Open Library's larger art when titles match
    out.forEach(o => { const m = ol.find(x => x.cover && x.title && o.title && x.title.toLowerCase().slice(0, 18) === o.title.toLowerCase().slice(0, 18)); if (m) o.cover = m.cover; if (!o.pages && m) o.pages = m.pages; });
    if (out.length < 4) out = out.concat(ol.filter(x => !out.some(o => o.title.toLowerCase() === x.title.toLowerCase())));
  } catch (e) {}
  out = out.filter(o => o.title).slice(0, 8);
  if (!out.length) { box.innerHTML = `<p class="note center">No match. <button class="chip" id="manual2">Type it in</button></p>`; $('#manual2', el).onclick = () => bookForm({ title: q }, then); return; }
  box.innerHTML = out.map((o, i) => `<button class="res" data-i="${i}">${coverHTML(o)}<div><div class="t">${esc(o.title)}</div><div class="a">${esc(o.author)}${o.pages ? ' · ' + o.pages + ' pages' : ''}</div></div></button>`).join('');
  $$('.res', box).forEach(b => b.onclick = () => bookForm(out[b.dataset.i], then));
}
function bookForm(b, then) {
  const isNew = !b.id;
  openSheet(`<h3>${isNew ? 'Add to your shelf' : 'Edit book'}</h3>
  <div class="row" style="align-items:flex-start;gap:16px;margin-top:10px">${coverHTML(b.title ? b : { title: 'Your book' })}<div style="flex:1">
  <div class="field" style="margin-top:0"><label>Title</label><input id="ft" value="${esc(b.title || '')}"></div>
  <div class="field"><label>Author</label><input id="fa" value="${esc(b.author || '')}"></div></div></div>
  <div class="two"><div class="field"><label>Total pages</label><input id="fp" inputmode="numeric" value="${b.pages || ''}"></div><div class="field"><label>On page</label><input id="fc" inputmode="numeric" value="${b.current || ''}"></div></div>
  <div class="field"><label>Cover image link</label><input id="fcv" value="${esc(b.cover || '')}" placeholder="Optional"></div>
  <div class="field"><label>Status</label><div class="seg" id="fst">${[['reading', 'Reading'], ['finished', 'Finished'], ['want', 'Want to read']].map(([k, l]) => `<button class="chip ${(b.status || 'reading') === k ? 'on' : ''}" data-k="${k}">${l}</button>`).join('')}</div></div>
  <button class="btn full" id="fsave" style="margin-top:10px">${isNew ? 'Add book' : 'Save'}</button>
  ${isNew ? '' : '<p class="center"><button class="chip" id="fdel" style="margin-top:16px;color:#ffb0a8">Delete book and its passages</button></p>'}`, el => {
    let st = b.status || 'reading';
    $$('#fst button', el).forEach(x => x.onclick = () => { st = x.dataset.k; $$('#fst button', el).forEach(y => y.classList.toggle('on', y === x)); });
    $('#fsave', el).onclick = () => {
      const title = $('#ft', el).value.trim(); if (!title) return toast('Give it a title');
      const o = isNew ? { id: uid(), added: new Date().toISOString() } : book(b.id);
      Object.assign(o, { title, author: $('#fa', el).value.trim(), pages: parseInt($('#fp', el).value) || null, current: parseInt($('#fc', el).value) || 0, cover: $('#fcv', el).value.trim(), status: st, isbn: b.isbn || o.isbn || '' });
      if (st === 'reading') o.started = o.started || dkey(); if (st === 'finished') o.finished = o.finished || dkey();
      if (isNew) S.books.push(o); touch(o);
      toast(isNew ? 'On your shelf' : 'Saved');
      if (then) return then(o.id);
      render(); openBook(o.id, true);
    };
    const del = $('#fdel', el); if (del) del.onclick = () => { if (!confirm(`Delete “${b.title}” and its ${passagesOf(b.id).length} passages?`)) return; S.books = S.books.filter(x => x.id !== b.id); S.passages = S.passages.filter(x => x.bookId !== b.id); save(); closeSheet(); render(); };
  });
}

/* ---------- Capture flow ---------- */
const CAP = {};
function steps(n) { return `<div class="steps">${[1, 2, 3, 4].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`; }
function startCapture(bookId) {
  Object.keys(CAP).forEach(k => delete CAP[k]);
  if (!S.books.length) { toast('First, the book'); return addBook(id => startCapture(id)); }
  const pick = bookId || (S.books.filter(b => b.status === 'reading').sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))[0] || S.books[0]).id;
  CAP.bookId = pick;
  const opts = S.books.filter(b => b.status !== 'want' || b.id === pick).sort((a, b) => (a.status === 'reading' ? 0 : 1) - (b.status === 'reading' ? 0 : 1) || a.title.localeCompare(b.title));
  openSheet(`${steps(1)}<h3>What are you reading?</h3><div class="sub">Then show me the page.</div>
  <div class="field"><select id="cb">${opts.map(b => `<option value="${b.id}" ${b.id === pick ? 'selected' : ''}>${esc(b.title)}</option>`).join('')}<option value="__new">+ Add another book</option></select></div>
  <div class="bigopt">
    <button class="opt" id="cphoto"><span class="icon">${I.camera}</span><div><b>Photograph the page</b><span>Dokugo reads it on your phone and finds the lines you mean.</span></div></button>
    <button class="opt" id="ctype"><span class="icon">${I.type}</span><div><b>Type or paste it</b><span>For e-books, or a line you already know by heart.</span></div></button>
  </div>`, el => {
    $('#cb', el).onchange = e => { if (e.target.value === '__new') addBook(id => startCapture(id)); else CAP.bookId = e.target.value; };
    $('#cphoto', el).onclick = () => pickImage(img => runOCR(img));
    $('#ctype', el).onclick = () => { CAP.pageText = ''; CAP.sents = []; capReview(''); };
    preloadOCR();
  });
}
function pickImage(cb) {
  const f = $('#filePick'); f.value = '';
  f.onchange = async () => { const file = f.files[0]; if (!file) return; try { const bmp = await createImageBitmap(file); cb(bmp, file); } catch (e) { const im = new Image(); im.onload = () => cb(im, file); im.src = URL.createObjectURL(file); } };
  f.click();
}
let ocrLoading = null;
function preloadOCR() {
  if (window.Tesseract) return Promise.resolve();
  if (!ocrLoading) ocrLoading = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js'; s.onload = res; s.onerror = () => { ocrLoading = null; rej(new Error('offline')); }; document.head.appendChild(s); });
  return ocrLoading;
}
function prepCanvas(img) {
  const max = 2200, w = img.width, h = img.height, k = Math.min(1, max / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k);
  const x = c.getContext('2d'); x.filter = 'grayscale(1) contrast(1.35)'; x.drawImage(img, 0, 0, c.width, c.height); return c;
}
async function runOCR(img) {
  openSheet(`${steps(2)}<h3>Reading the page…</h3><div class="sub">This stays on your phone.</div><div class="orb"><span id="ostat">Opening<br>the book</span></div><p class="note center" id="onote">The first time takes a little longer while the reader downloads.</p>`);
  try {
    await preloadOCR();
    const c = prepCanvas(img);
    const r = await Tesseract.recognize(c, 'eng', { logger: m => { const s = $('#ostat'); if (s && m.status === 'recognizing text') s.innerHTML = 'Reading<br>' + Math.round(m.progress * 100) + '%'; } });
    const raw = r.data.text || '';
    CAP.page = detectPage(raw);
    CAP.pageText = cleanText(raw);
    CAP.sents = splitSents(CAP.pageText);
    if (CAP.sents.length < 1) throw new Error('empty');
    capThought();
  } catch (e) {
    openSheet(`${steps(2)}<h3>I couldn't read that page</h3><div class="sub">${e.message === 'offline' ? 'The page reader needs a connection the first time.' : 'Try a flatter, brighter photo, with the page filling the frame.'}</div>
    <div class="bigopt"><button class="opt" id="again"><span class="icon">${I.camera}</span><div><b>Try another photo</b></div></button><button class="opt" id="typ"><span class="icon">${I.type}</span><div><b>Type it instead</b></div></button></div>`, el => {
      $('#again', el).onclick = () => pickImage(i => runOCR(i)); $('#typ', el).onclick = () => capReview('');
    });
  }
}
function cleanText(t) {
  return t.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/(\w)[-\u00ad]\n(\w)/g, '$1$2').replace(/\n{2,}/g, '¶').replace(/\n/g, ' ').replace(/¶/g, '\n\n').replace(/[|~_]{2,}/g, '').replace(/ +/g, ' ').trim();
}
function detectPage(raw) {
  const lines = raw.split('\n').map(s => s.trim()).filter(Boolean); if (!lines.length) return '';
  const cand = [...lines.slice(0, 2), ...lines.slice(-3)];
  for (const l of cand) { const m = l.match(/^[^\w]{0,3}(\d{1,4})[^\w]{0,3}$/); if (m && +m[1] > 0) return m[1]; }
  for (const l of cand) { if (l.length > 50) continue; const m = l.match(/^(\d{1,4})\s+[A-Z]/) || l.match(/[A-Za-z]\s+(\d{1,4})$/); if (m && +m[1] > 0) return m[1]; }
  return '';
}
function splitSents(t) {
  const out = []; t.split('\n\n').forEach((para, pi) => { (para.match(/[^.!?…]+(?:[.!?…]+["'”’)\]]*|$)/g) || []).forEach(s => { s = s.trim(); if (s.length > 1) out.push({ s, para: pi }); }); });
  return out.filter(x => !/^\d{1,4}$/.test(x.s));
}
const STOP = new Set('a an the and or but of to in on at for with is was were be been it its this that these those i me my we you your he she they them his her their as by from so not no do does did have has had just really about like what which who how when where there here then than very can could would should will into out up down over more most some any all one thing things think thought part line lines bit kind sort said say says page book'.split(' '));
const toks = s => (s.toLowerCase().match(/[a-z']{2,}/g) || []).map(w => w.replace(/'s$|'/g, '')).filter(w => w.length > 2 && !STOP.has(w));
const stem = w => w.length > 5 ? w.slice(0, 5) : w;
function matchPassage(thought) {
  const T = [...new Set(toks(thought).map(stem))]; const n = CAP.sents.length; if (!T.length || !n) return [];
  const st = CAP.sents.map(x => new Set(toks(x.s).map(stem)));
  const df = {}; st.forEach(s => s.forEach(w => df[w] = (df[w] || 0) + 1));
  let best = { sc: 0, a: 0, b: -1 };
  for (let a = 0; a < n; a++) for (let len = 1; len <= 3 && a + len <= n; len++) {
    const u = new Set(); for (let i = a; i < a + len; i++) st[i].forEach(w => u.add(w));
    let sc = 0; T.forEach(w => { if (u.has(w)) sc += 1 / Math.sqrt(df[w]); });
    sc -= (len - 1) * 0.35; if (sc > best.sc + 0.01) best = { sc, a, b: a + len - 1 };
  }
  if (best.b < 0) return [];
  const out = []; for (let i = best.a; i <= best.b; i++) out.push(i); return out;
}

let rec = null;
function stopVoice() { if (rec) { try { rec.onend = null; rec.stop(); } catch (e) {} rec = null; } }
function voiceInto(btn, ta, onDone) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { btn.classList.add('hidden'); return; }
  let downAt = 0;
  const start = () => {
    rec = new SR(); rec.lang = navigator.language || 'en-US'; rec.continuous = true; rec.interimResults = true;
    const base = ta.value ? ta.value.trim() + ' ' : '';
    rec.onresult = e => { let s = ''; for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript; ta.value = base + s.trim(); ta.dispatchEvent(new Event('input')); };
    rec.onend = () => { rec = null; btn.classList.remove('live'); onDone && onDone(); };
    rec.onerror = () => toast('Mic unavailable. Type it instead.');
    try { rec.start(); btn.classList.add('live'); navigator.vibrate && navigator.vibrate(15); } catch (e) {}
  };
  const stop = () => { stopVoice(); btn.classList.remove('live'); onDone && onDone(); };
  // tap to toggle, or hold to talk and let go when done
  btn.onpointerdown = e => { e.preventDefault(); downAt = Date.now(); if (rec) { stop(); downAt = 0; } else start(); };
  btn.onpointerup = () => { if (downAt && Date.now() - downAt > 450 && rec) stop(); };
  btn.oncontextmenu = e => e.preventDefault();
}
const THEMES_KW = { mindset: 'mind think thought attitude perspective choose opinion perceive judgment', death: 'death die dying mortal grave life short time years', health: 'body health eat food strength exercise heart sleep', habits: 'habit system routine daily practice small repeat', work: 'work job career labor business craft', family: 'father mother son daughter wife husband family child children', nature: 'woods nature tree river sea mountain earth sky', peace: 'peace calm still quiet tranquil rest silence', purpose: 'purpose meaning deliberately essential virtue good duty', courage: 'courage fear brave afraid bold' };
function suggestTags(text) {
  const w = new Set(toks(text).map(stem)); const out = [];
  for (const [tag, kws] of Object.entries(THEMES_KW)) { const n = kws.split(' ').filter(k => w.has(stem(k))).length; if (n) out.push([tag, n]); }
  return out.sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
}
function capThought() {
  openSheet(`${steps(3)}<h3>What clicked?</h3><div class="sub">Say or type a few words about the line that stayed with you. I'll find it on the page.</div>
  <button class="mic" id="mic" aria-label="Speak">${I.mic}</button><p class="note center" id="mnote">Hold to talk, or tap to start and stop</p>
  <div class="field"><textarea id="thought" placeholder="The part about not waiting for the perfect moment…">${esc(CAP.thought || '')}</textarea></div>
  <button class="btn full" id="find">Find the passage</button>
  <p class="center"><button class="chip" id="skip" style="margin-top:14px">I'll pick the lines myself</button></p>`, el => {
    const ta = $('#thought', el);
    voiceInto($('#mic', el), ta, () => { if (ta.value.trim()) $('#mnote', el).textContent = 'Got it. Tap Find, or keep talking.'; });
    if (!(window.SpeechRecognition || window.webkitSpeechRecognition)) $('#mnote', el).textContent = 'Type a few words about it';
    $('#find', el).onclick = () => { stopVoice(); CAP.thought = ta.value.trim(); CAP.sel = new Set(matchPassage(CAP.thought)); if (!CAP.sel.size) toast('Tap the lines you meant'); capReview(); };
    $('#skip', el).onclick = () => { stopVoice(); CAP.thought = ta.value.trim(); CAP.sel = new Set(); capReview(); };
  });
}
function selText() { return [...CAP.sel].sort((a, b) => a - b).map(i => CAP.sents[i].s).join(' '); }
function capReview(text) {
  const hasPage = CAP.sents && CAP.sents.length;
  if (!CAP.sel) CAP.sel = new Set();
  openSheet(`${steps(3)}<h3>${hasPage ? (CAP.sel.size ? 'Is this the one?' : 'Tap the lines you meant') : 'The passage'}</h3>
  <div class="sub">${hasPage ? 'Tap any sentence to add or remove it.' : 'Type or paste the words exactly as written.'}</div>
  ${hasPage ? `<div class="pagetext" id="ptxt">${CAP.sents.map((x, i) => (i && x.para !== CAP.sents[i - 1].para ? '<br><br>' : '') + `<s data-i="${i}" class="${CAP.sel.has(i) ? 'sel' : ''}">${esc(x.s)}</s> `).join('')}</div>` : ''}
  <div class="field"><label>Passage</label><textarea id="ptext" style="font-family:var(--serif);font-size:17px;min-height:110px">${esc(hasPage ? selText() : (text || ''))}</textarea></div>
  <div class="two"><div class="field"><label>Page</label><input id="ppage" inputmode="numeric" value="${esc(CAP.page || '')}" placeholder="${hasPage ? 'Not found' : ''}"></div><div></div></div>
  <button class="btn full" id="next4">Add your reflection</button>`, el => {
    const ta = $('#ptext', el);
    $$('#ptxt s', el).forEach(s => s.onclick = () => { const i = +s.dataset.i; CAP.sel.has(i) ? CAP.sel.delete(i) : CAP.sel.add(i); s.classList.toggle('sel'); ta.value = selText(); });
    const first = $('#ptxt s.sel', el); if (first) setTimeout(() => first.scrollIntoView({ block: 'center', behavior: 'smooth' }), 400);
    $('#next4', el).onclick = () => { CAP.text = ta.value.trim(); CAP.page = $('#ppage', el).value.trim(); if (!CAP.text) return toast('Pick or type the passage first'); capReflect(); };
  });
}
function capReflect() {
  const sug = suggestTags(CAP.text + ' ' + (CAP.thought || ''));
  const tags = [...new Set([...sug, ...allTags()])].slice(0, 12);
  CAP.tags = CAP.tags || [];
  openSheet(`${steps(4)}<h3>What did it mean to you?</h3><div class="sub">Your thought, in your words. Future you will thank you.</div>
  <div class="card" style="padding:14px 16px;margin-bottom:6px"><p class="quote" style="font-size:16px">“${esc(CAP.text.length > 260 ? CAP.text.slice(0, 260) + '…' : CAP.text)}”</p></div>
  <button class="mic" id="mic2" aria-label="Speak">${I.mic}</button>
  <div class="field"><label>Reflection</label><textarea id="rf">${esc(CAP.reflection ?? CAP.thought ?? '')}</textarea></div>
  <div class="field"><label>Tags</label><input id="tg" placeholder="mindset, health, onetobetter" value="${esc(CAP.tags.join(', '))}">
  ${tags.length ? `<div class="chips" style="margin-top:10px">${tags.map(t => `<button class="chip" data-t="${esc(t)}">${sug.includes(t) ? '✦ ' : ''}#${esc(t)}</button>`).join('')}</div>${sug.length ? '<p class="note" style="margin:8px 0 0">✦ suggested from the passage</p>' : ''}` : ''}</div>
  <button class="btn full" id="savep">Keep this passage</button>`, el => {
    voiceInto($('#mic2', el), $('#rf', el));
    $$('[data-t]', el).forEach(b => b.onclick = () => { const i = $('#tg', el); const cur = i.value.split(',').map(s => s.trim()).filter(Boolean); if (!cur.includes(b.dataset.t)) cur.push(b.dataset.t); i.value = cur.join(', '); b.classList.add('on'); });
    $('#savep', el).onclick = () => {
      stopVoice();
      const p = { id: uid(), bookId: CAP.bookId, text: CAP.text, reflection: $('#rf', el).value.trim(), page: CAP.page || '', tags: $('#tg', el).value.split(',').map(s => s.trim().replace(/^#/, '').toLowerCase()).filter(Boolean), fav: false, created: new Date().toISOString() };
      S.passages.push(p); const b = book(p.bookId);
      if (b) { const pg = parseInt(p.page); if (pg && b.status === 'reading' && pg > (b.current || 0) && (!b.pages || pg <= b.pages)) b.current = pg; touch(b); }
      logDay(p.bookId, parseInt(p.page) || null); save();
      openSheet(`<div class="center" style="padding:20px 0 10px"><div class="orb" style="width:110px;height:110px"><span>Kept</span></div><h3 style="padding:0">It's yours now.</h3><div class="sub">${esc(b?.title || '')}${p.page ? ' · p. ' + esc(p.page) : ''}</div>
      <div class="row" style="justify-content:center;gap:10px;flex-wrap:wrap"><button class="btn sm" id="sh">${I.share} Share it</button><button class="btn ghost sm" id="another">${I.camera} Another</button><button class="btn ghost sm" id="done">Done</button></div></div>`, e2 => {
        $('#sh', e2).onclick = () => sharePassage(p.id); $('#another', e2).onclick = () => startCapture(p.bookId); $('#done', e2).onclick = () => closeSheet();
      });
      render();
    };
  });
}

/* ---------- Edit passage ---------- */
function editPassage(id) {
  const p = S.passages.find(x => x.id === id); if (!p) return;
  openSheet(`<h3>Edit passage</h3><div class="sub">${esc(book(p.bookId)?.title || '')}</div>
  <div class="field"><label>Passage</label><textarea id="et" style="font-family:var(--serif);font-size:17px">${esc(p.text)}</textarea></div>
  <div class="field"><label>Reflection</label><textarea id="er">${esc(p.reflection)}</textarea></div>
  <div class="two"><div class="field"><label>Page</label><input id="ep" value="${esc(p.page)}"></div><div class="field"><label>Book</label><select id="eb">${S.books.map(b => `<option value="${b.id}" ${b.id === p.bookId ? 'selected' : ''}>${esc(b.title)}</option>`).join('')}</select></div></div>
  <div class="field"><label>Tags</label><input id="eg" value="${esc((p.tags || []).join(', '))}"></div>
  <button class="btn full" id="es">Save</button><p class="center"><button class="chip" id="ed" style="margin-top:16px;color:#ffb0a8">Delete passage</button></p>`, el => {
    $('#es', el).onclick = () => { Object.assign(p, { text: $('#et', el).value.trim(), reflection: $('#er', el).value.trim(), page: $('#ep', el).value.trim(), bookId: $('#eb', el).value, tags: $('#eg', el).value.split(',').map(s => s.trim().replace(/^#/, '').toLowerCase()).filter(Boolean) }); save(); toast('Saved'); closeSheet(); render(); };
    $('#ed', el).onclick = () => { if (!confirm('Delete this passage?')) return; S.passages = S.passages.filter(x => x.id !== id); save(); closeSheet(); render(); };
  });
}

/* ---------- Return (memory mode) ---------- */
let retOpen = false, retCur = null;
function pickReturn() {
  const now = Date.now(); const pool = S.passages.filter(p => p.id !== retCur);
  if (!pool.length) return S.passages[0];
  const w = pool.map(p => { const seen = S.seen[p.id] || 0; const days = (now - seen) / 864e5; return (p.fav ? 2.2 : 1) * Math.min(30, 1 + days); });
  let r = Math.random() * w.reduce((a, b) => a + b, 0); for (let i = 0; i < pool.length; i++) { r -= w[i]; if (r <= 0) return pool[i]; } return pool[0];
}
function openReturn() {
  if (!S.passages.length) { toast('Keep a passage first'); return startCapture(); }
  if (sheetOpen) { sheetOpen = false; stopVoice(); $('#sheet').classList.remove('show'); $('#scrim').classList.remove('show'); retOpen = true; }
  if (!retOpen) { history.pushState({ ret: 1 }, ''); retOpen = true; }
  showReturn(pickReturn());
}
function showReturn(p) {
  retCur = p.id; S.seen[p.id] = Date.now(); save(); const b = book(p.bookId); const r = $('#ret');
  r.innerHTML = `<div class="sky"></div><div class="glowbg"></div>
  <div class="rtop"><span>Return</span><button class="icon" id="rx" aria-label="Close"><svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>
  <div class="in fadein"><p class="quote">“${esc(p.text)}”</p><div class="qmeta" style="margin-top:18px">${esc(b?.title || '')}${b?.author ? ' · ' + esc(b.author) : ''}${p.page ? ' · p. ' + esc(p.page) : ''}</div>
  ${p.reflection ? `<p style="margin:26px auto 0;max-width:460px;color:var(--mut);font-size:15px;line-height:1.55">You wrote: ${esc(p.reflection)}</p>` : ''}</div>
  <div class="rbot"><button class="icon" id="rfav" style="width:52px;height:52px;${p.fav ? 'color:var(--glow)' : ''}" aria-label="Favorite">${p.fav ? I.starF : I.star}</button><button class="go" id="rnext" style="width:64px;height:64px" aria-label="Next">${I.next}</button><button class="icon" id="rsh" style="width:52px;height:52px" aria-label="Share">${I.share}</button></div>`;
  r.classList.add('show');
  $('#rx').onclick = () => closeReturn(); $('#rnext').onclick = () => showReturn(pickReturn());
  $('#rfav').onclick = () => { p.fav = !p.fav; save(); showReturn(p); };
  $('#rsh').onclick = () => sharePassage(p.id);
}
function closeReturn(fromPop) { if (!retOpen) return; retOpen = false; $('#ret').classList.remove('show'); if (!fromPop) history.back(); render(); }

/* ---------- Share card ---------- */
function wrapLines(ctx, text, maxW) {
  const words = text.split(/\s+/); const lines = []; let line = '';
  words.forEach(w => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
  if (line) lines.push(line); return lines;
}
async function cardBlob(p) {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const th = THEMES[S.settings.theme] || THEMES.dusk;
  x.fillStyle = th[3]; x.fillRect(0, 0, W, H);
  const g = x.createRadialGradient(W / 2, H * 1.12, 0, W / 2, H * 1.12, H * 1.05);
  g.addColorStop(0, th[0]); g.addColorStop(.28, th[1]); g.addColorStop(.56, th[2]); g.addColorStop(.88, th[3]); x.fillStyle = g; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { x.fillStyle = `rgba(255,255,255,${(hashN('s' + i) % 50) / 600 + .03})`; x.beginPath(); x.arc(hashN('x' + i) % W, hashN('y' + i) % (H * .7), (hashN('r' + i) % 3) / 2 + .6, 0, 7); x.fill(); }
  const og = x.createRadialGradient(W / 2, H * .44, 0, W / 2, H * .44, 470); og.addColorStop(0, th[4] + '30'); og.addColorStop(1, th[4] + '00'); x.fillStyle = og; x.fillRect(0, 0, W, H);
  const serif = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif';
  let fs = 64, lines; const txt = '“' + p.text + '”';
  do { x.font = `italic ${fs}px ${serif}`; lines = wrapLines(x, txt, W - 200); fs -= 3; } while (lines.length * fs * 1.45 > H * .58 && fs > 30);
  fs += 3; const lh = fs * 1.45; const top = H * .45 - lines.length * lh / 2;
  x.fillStyle = '#eef1f6'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.shadowColor = th[4] + '55'; x.shadowBlur = 30;
  lines.forEach((l, i) => x.fillText(l, W / 2, top + i * lh + lh / 2)); x.shadowBlur = 0;
  const b = book(p.bookId);
  x.font = `500 28px system-ui,sans-serif`; x.fillStyle = 'rgba(238,241,246,.7)';
  const meta = [(b?.title || ''), b?.author || ''].filter(Boolean).join('  ·  ').toUpperCase();
  x.letterSpacing = '4px'; x.fillText(meta.length > 60 ? meta.slice(0, 58) + '…' : meta, W / 2, top + lines.length * lh + 70);
  x.font = `400 30px ${serif}`; x.fillStyle = 'rgba(238,241,246,.55)'; x.letterSpacing = '8px'; x.fillText('DOKUGO  読後', W / 2, H - 92);
  x.font = `400 22px system-ui,sans-serif`; x.letterSpacing = '3px'; x.fillText('AFTER READING', W / 2, H - 52);
  return new Promise(r => c.toBlob(r, 'image/png'));
}
async function sharePassage(id) {
  const p = S.passages.find(x => x.id === id); if (!p) return;
  const blob = await cardBlob(p); const file = new File([blob], 'dokugo-passage.png', { type: 'image/png' });
  const b = book(p.bookId); const text = `“${p.text}”\n— ${b?.title || ''}${b?.author ? ', ' + b.author : ''}`;
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], text }); return; } catch (e) { if (e.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'dokugo-passage.png'; a.click(); toast('Card saved');
}

/* ---------- Export / import ---------- */
function mdFor(b) {
  const ps = passagesOf(b.id).sort((a, c) => (parseInt(a.page) || 9e9) - (parseInt(c.page) || 9e9));
  return `---\ntitle: "${b.title.replace(/"/g, '\\"')}"\nauthor: "${(b.author || '').replace(/"/g, '\\"')}"\nstatus: ${b.status}\n${b.isbn ? 'isbn: ' + b.isbn + '\n' : ''}${b.finished ? 'finished: ' + b.finished + '\n' : ''}tags: [dokugo, books]\n---\n\n# ${b.title}\n${b.author ? '*' + b.author + '*\n' : ''}\n` +
    ps.map(p => `> ${p.text.replace(/\n/g, '\n> ')}\n\n${p.page ? '— p. ' + p.page : '—'} · ${fmtDate(p.created)}${p.fav ? ' · ★' : ''}${(p.tags || []).length ? ' · ' + p.tags.map(t => '#' + t).join(' ') : ''}\n${p.reflection ? '\n' + p.reflection + '\n' : ''}\n---\n`).join('\n');
}
function download(name, text, type = 'text/markdown') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); }
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'book';
async function exportMD(bookId) {
  if (bookId) { const b = book(bookId); const md = mdFor(b); const f = new File([md], slug(b.title) + '.md', { type: 'text/markdown' }); if (navigator.canShare && navigator.canShare({ files: [f] })) { try { await navigator.share({ files: [f], title: b.title }); return; } catch (e) { if (e.name === 'AbortError') return; } } download(slug(b.title) + '.md', md); return toast('Markdown saved'); }
  const md = S.books.filter(b => passagesOf(b.id).length).map(mdFor).join('\n\n'); download('dokugo-journal-' + dkey() + '.md', md); toast('Journal exported');
}
function backupJSON() { download('dokugo-backup-' + dkey() + '.json', JSON.stringify(S, null, 1), 'application/json'); toast('Backup saved'); }
$('#importPick').onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try { const d = JSON.parse(await f.text()); if (!d.books) throw 0; if (!confirm(`Import ${d.books.length} books and ${(d.passages || []).length} passages? This merges with what's here.`)) return;
    d.books.forEach(b => { if (!book(b.id)) S.books.push(b); }); (d.passages || []).forEach(p => { if (!S.passages.some(x => x.id === p.id)) S.passages.push(p); }); S.log = S.log.concat(d.log || []); save(); closeSheet(); render(); toast('Imported');
  } catch (err) { toast('That file isn\'t a Dokugo backup'); }
};

/* ---------- Settings ---------- */
function openSettings() {
  openSheet(`<h3>Settings</h3><div class="sub">Dokugo ${VERSION} · everything stays on this phone</div>
  <div class="lbl" style="margin-top:6px">Sky</div>
  <div class="swatches">${Object.entries(THEMES).map(([k, c]) => `<button class="sw ${S.settings.theme === k ? 'on' : ''}" data-th="${k}" style="background:radial-gradient(circle at 50% 110%,${c[0]},${c[1]} 40%,${c[2]} 70%,${c[3]})"><small>${k[0].toUpperCase() + k.slice(1)}</small></button>`).join('')}</div>
  <div class="field"><label>Your name</label><input id="sn" value="${esc(S.settings.name || '')}"></div>
  <div class="setrow"><span>Export journal<small>Markdown for Obsidian, Notion or Apple Notes</small></span><button class="btn ghost sm" data-act="exportall">${I.dl}</button></div>
  <div class="setrow"><span>Back up<small>A file with every book and passage</small></span><button class="btn ghost sm" data-act="backup">${I.dl}</button></div>
  <div class="setrow"><span>Restore<small>Merge a Dokugo backup file</small></span><button class="btn ghost sm" data-act="import">Import</button></div>
  <div class="card" style="margin-top:22px"><p class="quote" style="font-size:18px">“Dokugo is Japanese and means after reading.”</p><p class="note" style="margin:10px 0 0">A quiet place for the lines that changed you, and what you thought when you read them. Page reading happens on the device with Tesseract. Book details come from Google Books and Open Library.</p>
  <p class="note" style="margin:10px 0 0">Made by Thomas Alan Smilie · <a href="https://onetobetter.com" target="_blank" rel="noopener">onetobetter.com</a></p></div>`, el => {
    bind(el);
    $$('[data-th]', el).forEach(b => b.onclick = () => { S.settings.theme = b.dataset.th; save(); document.body.dataset.theme = b.dataset.th; $$('[data-th]', el).forEach(x => x.classList.toggle('on', x === b)); });
    $('#sn', el).onchange = e => { S.settings.name = e.target.value.trim(); save(); render(); };
  });
}

/* ---------- boot ---------- */
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
