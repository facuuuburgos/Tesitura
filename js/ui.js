'use strict';
/* =========================================================
   Tesitura · interfaz: íconos, hojas, diálogos, navegación
   ========================================================= */
const IC = {
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.8.8 2.9 2.5 3.2 5.2"/>',
  cal: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
  chart: '<path d="M5 20V11M11.5 20V5M18 20v-6"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  chevR: '<path d="m9 6 6 6-6 6"/>',
  chevL: '<path d="m15 6-6 6 6 6"/>',
  chevD: '<path d="m6 9 6 6 6-6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  chat: '<path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 21l2.1-5.4A8.4 8.4 0 1 1 21 11.5z"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  file: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 21h16"/>',
  upload: '<path d="M12 21V9m-5 5 5-5 5 5M4 3h16"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/>',
  school: '<path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-5h6v5M10 10h4"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v4"/>',
  pin: '<path d="M12 17v5M9 3h6l-1 5 3 3v2H7v-2l3-3z"/>',
  cloud: '<path d="M17.5 19a4.5 4.5 0 1 0-1.4-8.8A6 6 0 0 0 4.5 13 3 3 0 0 0 6 19z"/>',
  wave: '<g fill="currentColor" stroke="none"><circle cx="4.5" cy="17" r="1.7"/><circle cx="8.5" cy="14.2" r="1.9"/><circle cx="12.5" cy="10.8" r="2.1"/><circle cx="16.3" cy="7.9" r="2.3"/><circle cx="20" cy="6.2" r="2.5"/></g>',
  ext: '<path d="M7 17 17 7M8 7h9v9"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  alert: '<path d="M12 9v4M12 17h.01"/><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
  undo: '<path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  more: '<circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M15 9.5c-.5-1-1.6-1.5-3-1.5-1.8 0-3 .9-3 2s1.2 1.7 3 2 3 .9 3 2-1.2 2-3 2c-1.4 0-2.5-.5-3-1.5M12 6v2M12 16v2"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
  userplus: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5M19 8v6M16 11h6"/>',
  table: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  shift: '<path d="M8 3 4 7l4 4M4 7h12a4 4 0 0 1 0 8h-1M16 21l4-4-4-4M20 17H8"/>',
  play: '<path d="M7 4v16l13-8z"/>',
  curtain: '<path d="M2 3h20M2 21h20"/><path d="M2 3v3.2c1.8 0 2.4-1.2 3.3-1.2s1.5 1.2 3.3 1.2S11 5 12 5s1.6 1.2 3.4 1.2S17.8 5 18.7 5 20.2 6.2 22 6.2V3"/><path d="M3.5 6v15H8c-.3-3-1.6-5.6-3.2-7.4C6 11.6 6.6 9 6.6 6.3"/><path d="M20.5 6v15H16c.3-3 1.6-5.6 3.2-7.4C18 11.6 17.4 9 17.4 6.3"/>',
};
const ic = (n, c = '') => `<svg class="i ${c}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ''}</svg>`;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- avisos ---------- */
let toastT = 0;
function toast(msg, type = '', action) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.className = 'toast' + (type ? ' ' + type : '');
  t.innerHTML = `<span>${esc(msg)}</span>` + (action ? `<button>${esc(action.label)}</button>` : '');
  if (action) t.querySelector('button').onclick = () => { t.classList.remove('show'); action.fn(); };
  requestAnimationFrame(() => t.classList.add('show'));
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), action ? 5000 : 2600);
}

/* ---------- diálogos ---------- */
function ask(title, text, buttons) {
  return new Promise(res => {
    const d = document.createElement('div');
    d.className = 'dialog';
    d.innerHTML = `<div class="scrim open"></div><div class="box" role="dialog" aria-modal="true"><h4>${esc(title)}</h4>${text ? `<p>${text}</p>` : ''}<div class="opts">${buttons.map((b, i) => `<button class="btn full ${b.cls || ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div></div>`;
    document.body.appendChild(d);
    const close = v => { d.remove(); res(v); };
    d.querySelector('.scrim').onclick = () => close(null);
    d.querySelectorAll('[data-i]').forEach(b => b.onclick = () => close(buttons[+b.dataset.i].val));
  });
}
const confirmDel = (title, text, label = 'Eliminar') => ask(title, text, [{ label, val: true, cls: 'danger' }, { label: 'Cancelar', val: false, cls: 'ghost' }]);

/* ---------- hojas ---------- */
const SHEETS = [];
function openSheet(o) {
  const scrim = document.createElement('div'); scrim.className = 'scrim';
  const el = document.createElement('div'); el.className = 'sheet' + (o.wide ? ' wide' : ''); el.setAttribute('role', 'dialog');
  document.body.append(scrim, el);
  const sh = { el, scrim, o, close: () => closeSheet(sh), render: () => renderSheet(sh) };
  SHEETS.push(sh);
  renderSheet(sh);
  scrim.onclick = () => closeSheet(sh);
  scrim.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  // fuerza el cálculo de estilos para que la hoja siempre entre deslizándose (en iPhone a veces aparecía de golpe)
  void el.offsetHeight;
  requestAnimationFrame(() => requestAnimationFrame(() => { scrim.classList.add('open'); el.classList.add('open'); }));
  // deslizar hacia abajo para cerrar (desde la barra superior)
  let y0 = null;
  el.addEventListener('touchstart', e => { if (e.target.closest('.sh,.grab')) y0 = e.touches[0].clientY; }, { passive: true });
  el.addEventListener('touchmove', e => { if (!e.target.closest('.sb')) e.preventDefault(); if (y0 != null) { const dy = e.touches[0].clientY - y0; if (dy > 0) el.style.transform = `translateY(${dy}px)`; } }, { passive: false });
  el.addEventListener('touchend', e => { if (y0 == null) return; const dy = e.changedTouches[0].clientY - y0; y0 = null; el.style.transform = ''; if (dy > 90) closeSheet(sh); });
  lockBody(true);
  return sh;
}
// fija la página de fondo mientras hay una hoja abierta (en iPhone, si no, se mueve la barra de abajo)
let lockY = 0;
function lockBody(on) {
  const b = document.body;
  if (on && !b.classList.contains('locked')) { lockY = window.scrollY; b.style.top = -lockY + 'px'; b.classList.add('locked'); }
  else if (!on && b.classList.contains('locked')) { b.classList.remove('locked'); b.style.top = ''; window.scrollTo(0, lockY); }
}
function renderSheet(sh) {
  const o = sh.o, st = sh.el.querySelector('.sb') ? sh.el.querySelector('.sb').scrollTop : 0;
  const title = typeof o.title === 'function' ? o.title() : o.title;
  sh.el.innerHTML = `<div class="grab"></div><div class="sh"><h3>${title || ''}</h3>${o.head ? o.head() : ''}<button class="iconbtn plain" data-close aria-label="Cerrar">${ic('x')}</button></div><div class="sb">${o.body(sh)}</div>`;
  sh.el.querySelector('[data-close]').onclick = () => closeSheet(sh);
  sh.el.querySelector('.sb').scrollTop = st;
  if (o.mount) o.mount(sh.el, sh);
}
function closeSheet(sh) {
  sh = sh || SHEETS[SHEETS.length - 1]; if (!sh) return;
  const i = SHEETS.indexOf(sh); if (i >= 0) SHEETS.splice(i, 1);
  sh.el.classList.remove('open'); sh.scrim.classList.remove('open');
  setTimeout(() => { sh.el.remove(); sh.scrim.remove(); }, 300);
  if (!SHEETS.length) lockBody(false);
  if (sh.o.onClose) sh.o.onClose();
}
const closeAll = () => [...SHEETS].reverse().forEach(closeSheet);

/* ---------- formularios ---------- */
const fval = (root, name) => { const el = root.querySelector(`[name="${name}"]`); if (!el) return undefined; if (el.type === 'checkbox') return el.checked; return el.value.trim(); };
function ferr(root, name, msg) {
  const el = root.querySelector(`[name="${name}"]`);
  if (el) { el.classList.add('err'); el.focus(); el.addEventListener('input', () => el.classList.remove('err'), { once: true }); }
  toast(msg, 'err');
  return false;
}
const field = (label, input, hint) => `<label class="field"><span>${label}</span>${input}</label>${hint ? `<div class="hint">${hint}</div>` : ''}`;
const inp = (name, val, o = {}) => `<input class="inp" name="${name}" value="${esc(val ?? '')}" type="${o.type || 'text'}" ${o.ph ? `placeholder="${esc(o.ph)}"` : ''} ${o.attrs || ''}>`;
const txa = (name, val, ph = '', rows = 3) => `<textarea class="inp" name="${name}" rows="${rows}" placeholder="${esc(ph)}">${esc(val ?? '')}</textarea>`;
const sel = (name, val, opts, attrs = '') => `<select class="inp" name="${name}" ${attrs}>${opts.map(o => `<option value="${esc(o[0])}" ${String(o[0]) === String(val ?? '') ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
const sw = (name, on, label, sub) => `<label class="switch"><div class="grow"><div>${label}</div>${sub ? `<div class="small muted">${sub}</div>` : ''}</div><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><span class="tg"></span></label>`;
function busy(btn, on) {
  if (!btn) return;
  if (on) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span>'; }
  else { btn.disabled = false; if (btn.dataset.html) btn.innerHTML = btn.dataset.html; }
}

/* ---------- foto del alumno: se achica antes de guardarla ---------- */
function readPhoto(file) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = 240, c = document.createElement('canvas'); c.width = c.height = s;
      const m = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', .82));
    };
    img.onerror = () => rej(new Error('No se pudo leer la imagen'));
    img.src = url;
  });
}
const hexA = (h, a) => /^#[0-9a-f]{6}$/i.test(h || '') ? h + Math.round(a * 255).toString(16).padStart(2, '0') : 'transparent';
const avatarStyle = st => { if (!st || st.photo) return st && st.photo ? `border-color:${school(st.schoolId).color}` : ''; const c = school(st.schoolId).color; return `background:${hexA(c, .16)};color:${c};border-color:${hexA(c, .45)}`; };
const avatar = (st, cls = '') => `<div class="avatar ${cls}" style="${avatarStyle(st)}">${st && st.photo ? `<img src="${st.photo}" alt="">` : esc(initials(st))}</div>`;
const schoolDot = sc => `<span class="dot" style="background:${esc(sc.color || '#888')}"></span>`;

/* ---------- navegación ---------- */
const R = { view: 'home', params: [] };
const UI = {
  calView: null, calDate: today(), stuFilter: 'active', stuSchool: '', stuQ: '',
  stTab: {}, statPer: 'month', statDate: today(), statFrom: '', statTo: '', statSchool: '', statTab: 'sum',
  invSchool: '', invMonth: monthStart(addMonths(today(), -1)),
};
/* Historial: las 4 secciones principales (y Facturas) son la "raíz": ir a ellas no agrega pasos atrás.
   Así, deslizar desde el borde para volver nunca da vueltas en círculo: desde una sección principal no hay "atrás". */
const MAIN = ['home', 'students', 'calendar', 'stats', 'invoices'];
const viewOf = h => (h.replace(/^#\/?/, '').split('/')[0] || 'home');
const depth = () => (history.state && history.state.d) || 0;
let pendingMain = null, lastRouted = null;
function go(h) {
  if (!h.startsWith('#')) h = '#' + h;
  if (location.hash === h || (h === '#/' && !location.hash)) { render(); return; }
  if (MAIN.includes(viewOf(h))) {
    if (depth() > 0) { pendingMain = h; history.go(-depth()); return; } // vuelve a la raíz y reemplaza
    history.replaceState({ d: 0 }, '', h);
  } else history.pushState({ d: depth() + 1 }, '', h);
  onRoute();
}
function onRoute() {
  if (location.hash === lastRouted && !pendingMain) return;
  closeAll(); $$('.dialog').forEach(d => d.remove());
  lastRouted = location.hash;
  route(); window.scrollTo(0, 0);
}
window.addEventListener('popstate', () => {
  if (pendingMain) { const h = pendingMain; pendingMain = null; history.replaceState({ d: 0 }, '', h); lastRouted = null; onRoute(); return; }
  lastRouted = null; onRoute();
});
window.addEventListener('hashchange', () => { if (location.hash !== lastRouted) { if (!history.state) history.replaceState({ d: MAIN.includes(viewOf(location.hash)) ? 0 : 1 }, '', location.hash); onRoute(); } });
if (!history.state) history.replaceState({ d: 0 }, '', location.hash || '#/');
// "volver": si hay a dónde volver usa el historial; si no, va directo a la sección indicada
function goBack(fallback) { if (depth() > 0) history.back(); else go(fallback || '#/'); }
function route() {
  const h = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  R.view = h[0] || 'home'; R.params = h.slice(1);
  if (!VIEWS[R.view]) R.view = 'home';
  render();
}
const NAV = [
  ['home', 'Inicio', 'home', '#/'], ['students', 'Alumnos', 'users', '#/students'],
  ['calendar', 'Calendario', 'cal', '#/calendar'], ['stats', 'Estadísticas', 'chart', '#/stats'],
];
const navOn = k => R.view === k || (k === 'home' && (R.view === 'shows' || R.view === 'show')) || (k === 'students' && R.view === 'student') || (k === 'stats' && R.view === 'invoices');
function shell() {
  return `<nav class="side"><div class="brand"><span class="logo">${ic('wave')}</span>Tesitura</div>
    ${NAV.map(n => `<a href="${n[3]}" class="${navOn(n[0]) ? 'on' : ''}">${ic(n[2])}${n[1]}</a>`).join('')}
    <a href="#/shows" class="${R.view === 'shows' || R.view === 'show' ? 'on' : ''}">${ic('curtain')}Shows</a>
    <a href="#/invoices" class="${R.view === 'invoices' ? 'on' : ''}">${ic('file')}Facturas</a>
    <div class="gap"></div>
    <a href="#/settings" class="${R.view === 'settings' || R.view === 'school' ? 'on' : ''}">${ic('gear')}Configuración</a>
  </nav>
  <main id="main"></main>
  <nav class="tabbar">${NAV.map(n => `<a href="${n[3]}" class="${navOn(n[0]) ? 'on' : ''}">${ic(n[2])}<span>${n[1]}</span></a>`).join('')}</nav>`;
}
function render() {
  const app = $('#app');
  app.innerHTML = shell();
  const main = $('#main');
  try {
    // la animación de entrada solo corre al cambiar de pantalla, no en cada actualización
    const key = R.view + '/' + R.params.join('/'), anim = key !== UI._lastKey; UI._lastKey = key;
    main.innerHTML = `<div class="view${anim ? ' enter' : ''}">${VIEWS[R.view](...R.params)}</div>`;
    if (AFTER[R.view]) AFTER[R.view](main);
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="empty">${ic('alert')}<div class="t">Algo salió mal</div><div class="small">${esc(e.message)}</div><div class="sp"></div><a class="btn" href="#/">Volver al inicio</a></div>`;
  }
  setSync(syncState);
}
const VIEWS = {}, AFTER = {}, ACT = {};
document.addEventListener('click', e => {
  const a = e.target.closest('[data-act]');
  if (a && ACT[a.dataset.act]) { e.preventDefault(); ACT[a.dataset.act](a, e); return; }
  // los enlaces internos pasan por go() para manejar bien el historial
  const ln = e.target.closest('a[href^="#/"], a[href="#"]');
  if (ln && !ln.target) {
    e.preventDefault();
    if (ln.classList.contains('back')) goBack(ln.getAttribute('href'));
    else if (ln.getAttribute('href') !== '#') go(ln.getAttribute('href'));
    return;
  }
  const g = e.target.closest('[data-go]');
  if (g) { e.preventDefault(); go(g.dataset.go); }
});
const topbar = (title, o = {}) => `<div class="top">${o.back ? `<a class="iconbtn plain back" href="${o.back}" aria-label="Volver">${ic('chevL', 'lg')}</a>` : ''}<div class="grow">${o.sub ? `<div class="sub">${o.sub}</div>` : ''}<h1>${title}</h1></div>${o.right || ''}</div>`;
