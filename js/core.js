'use strict';
/* =========================================================
   Tesitura · núcleo: datos, fechas, música, cobros, sincronización
   ========================================================= */
const KEY = 'tesitura.data', AKEY = 'tesitura.auth';
const COLLS = ['closures', 'schools', 'students', 'songs', 'studentSongs', 'series', 'lessons', 'lessonNotes', 'vocalNotes', 'invoices'];

/* ---------- utilidades ---------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clone = o => JSON.parse(JSON.stringify(o));
const mod = (n, m) => ((n % m) + m) % m;
const pad = n => String(n).padStart(2, '0');
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

/* ---------- fechas (siempre locales, 'YYYY-MM-DD' y 'HH:MM') ---------- */
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseD = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parseD(s); d.setDate(d.getDate() + n); return ymd(d); };
const addMonths = (s, n) => { const d = parseD(s); d.setDate(1); d.setMonth(d.getMonth() + n); return ymd(d); };
const today = () => ymd(new Date());
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const toMin = t => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + (m || 0); };
const fromMin = m => `${pad(Math.floor(m / 60) % 24)}:${pad(mod(m, 60))}`;
const dow = s => parseD(s).getDay();
const dayDiff = (a, b) => Math.round((parseD(b) - parseD(a)) / 864e5);
const monthStart = s => s.slice(0, 8) + '01';
const monthEnd = s => addDays(addMonths(monthStart(s), 1), -1);
const weekStart = s => { const ws = (S.settings.weekStart ?? 1); return addDays(s, -mod(dow(s) - ws, 7)); };
const DOW_S = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DOW_L = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MON_L = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const MON_S = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MON_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const fmtDate = (s, o = {}) => {
  if (!s) return '—';
  const d = parseD(s), t = today();
  if (o.rel) { const n = dayDiff(t, s); if (n === 0) return 'Hoy'; if (n === 1) return 'Mañana'; if (n === -1) return 'Ayer'; }
  const base = `${d.getDate()} ${MON_S[d.getMonth()]}`;
  const y = d.getFullYear() !== new Date().getFullYear() || o.year ? ' ' + d.getFullYear() : '';
  return (o.dow ? DOW_S[d.getDay()] + ' ' : '') + base + y;
};
const fmtLong = s => { const d = parseD(s); const t = `${DOW_L[d.getDay()]} ${d.getDate()} de ${MON_L[d.getMonth()]}`; return t[0].toUpperCase() + t.slice(1); };
const fmtDur = m => { m = Math.round(m); const h = Math.floor(m / 60), r = m % 60; return h ? (r ? `${h} h ${r} min` : `${h} h`) : `${r} min`; };
const fmtHours = m => { const h = m / 60; return (Math.round(h * 10) / 10).toLocaleString('es-UY') + ' h'; };
const fmtTime = ts => { const d = new Date(ts); return `${fmtDate(ymd(d))} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/* ---------- dinero (puede haber varias monedas, una por escuela) ---------- */
function money(n, cur = 'UYU') {
  try {
    return new Intl.NumberFormat('es-UY', { style: 'currency', currency: cur, minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n || 0);
  } catch (e) { return cur + ' ' + (Math.round((n || 0) * 100) / 100).toLocaleString('es-UY'); }
}
const addMoney = (acc, cur, n) => { acc[cur] = (acc[cur] || 0) + n; return acc; };
const fmtMoneyMap = (m, empty) => { const k = Object.keys(m).filter(c => m[c]); return k.length ? k.map(c => money(m[c], c)).join(' · ') : (empty ?? money(0, S.settings.currency || 'UYU')); };

/* ---------- cotización del dólar (se guarda en este dispositivo y se renueva cada 6 horas) ---------- */
const FXKEY = 'tesitura.fx';
let FX = null;
try { FX = JSON.parse(localStorage.getItem(FXKEY) || 'null'); } catch (e) { }
let fxLoading = false;
async function loadFx(force) {
  if (fxLoading || (!force && FX && Date.now() - FX.at < 6 * 3600e3)) return;
  fxLoading = true;
  let next = null;
  try {
    const j = await (await fetch('https://open.er-api.com/v6/latest/USD')).json();
    if (j.result !== 'success' || !j.rates || !j.rates.UYU) throw new Error('sin datos');
    next = { rates: j.rates, date: ymd(new Date(j.time_last_update_unix * 1000)), at: Date.now() };
  } catch (e) {
    try { // respaldo
      const j = await (await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json')).json();
      const rates = {}; Object.keys(j.usd || {}).forEach(k => { rates[k.toUpperCase()] = j.usd[k]; });
      if (!rates.UYU) throw new Error('sin datos');
      next = { rates, date: j.date, at: Date.now() };
    } catch (e2) { }
  }
  fxLoading = false;
  if (!next) { if (force) toast('No se pudo obtener la cotización (¿sin conexión?)', 'err'); return; }
  FX = next; localStorage.setItem(FXKEY, JSON.stringify(FX));
  if (typeof render === 'function' && !document.querySelector('.sheet.open')) { const y = window.scrollY; render(); window.scrollTo(0, y); }
  if (force) toast('Cotización actualizada');
}
const baseCur = () => S.settings.currency || 'UYU';
// cuántos pesos (moneda principal) vale 1 unidad de la moneda c
function fxRate(c) {
  const b = baseCur();
  if (c === b) return 1;
  if (c === 'USD' && b === 'UYU' && +S.settings.fxManual > 0) return +S.settings.fxManual;
  if (!FX || !FX.rates || !FX.rates[c] || !FX.rates[b]) return null;
  return FX.rates[b] / FX.rates[c];
}
function toBase(m) {
  let t = 0;
  for (const c of Object.keys(m)) { if (!m[c]) continue; const r = fxRate(c); if (r == null) return null; t += m[c] * r; }
  return t;
}
const needsConv = m => S.settings.fxConvert !== false && Object.keys(m).some(c => m[c] && c !== baseCur());
// texto de la cotización usada, ej: "dólar a $ 40,12 · 9 nov"
function fxNote() {
  const r = fxRate('USD');
  if (r == null || baseCur() === 'USD') return '';
  const manual = baseCur() === 'UYU' && +S.settings.fxManual > 0;
  return `dólar a ${money(Math.round(r * 100) / 100, baseCur())}${manual ? ' (fija)' : FX && FX.date ? ' · ' + fmtDate(FX.date) : ''}`;
}
// total convertido a pesos; si no hay cotización, muestra cada moneda por separado
function moneyTotal(m, empty) {
  if (needsConv(m)) { const t = toBase(m); if (t != null) return money(Math.round(t), baseCur()); }
  return fmtMoneyMap(m, empty);
}
function moneyDetail(m) {
  if (!needsConv(m) || toBase(m) == null) return '';
  return `${fmtMoneyMap(m)} · ${fxNote()}`;
}

/* ---------- estado ---------- */
function blank() {
  return {
    v: 1, updatedAt: 0, lastSync: 0, deleted: [],
    settings: {
      u: 0, teacher: '', email: '', ig: '', notation: 'en', accidentals: 'auto', currency: 'UYU', weekStart: 1,
      dayStart: '08:00', dayEnd: '22:00', defDur: 60, defView: 'week', projection: true, fxConvert: true, fxManual: '', remind: false, remindMin: 15,
      hours: [], // horarios habituales [{d:2,start:'16:00',end:'20:00'}]
    },
    schools: [defaultSchool()],
    closures: [], students: [], songs: [], studentSongs: [], series: [], lessons: [], lessonNotes: [], vocalNotes: [], invoices: []
  };
}
function defaultSchool() {
  return {
    id: 'default', u: 0, name: 'Particulares', color: '#E3A67A', currency: 'UYU', lang: 'es', billTo: '', billToEmail: '',
    prefix: '', nextNo: 1, rates: [{ id: 'r0', from: '2000-01-01', ind: 1200, grp: 1800 }],
    rules: { absent: false, cancelStudent: false, cancelTeacher: false, makeupDouble: false }, notes: '', archived: false
  };
}
function migrate(d) {
  const b = blank();
  if (!d || typeof d !== 'object') return b;
  d.settings = Object.assign({}, b.settings, d.settings || {});
  COLLS.forEach(c => { if (!Array.isArray(d[c])) d[c] = []; });
  if (!d.schools.length) d.schools = [defaultSchool()];
  d.schools.forEach(s => { s.rules = Object.assign({}, defaultSchool().rules, s.rules || {}); if (!s.rates || !s.rates.length) s.rates = clone(defaultSchool().rates); });
  if (!Array.isArray(d.deleted)) d.deleted = [];
  d.v = 1;
  return d;
}
function load() { try { return migrate(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return blank(); } }
let S = load();
function save(touch = true) {
  if (touch) S.updatedAt = Date.now();
  try { localStorage.setItem(KEY, JSON.stringify(S)); }
  catch (e) { toast('No se pudo guardar en el teléfono: ' + e.message, 'err'); }
  if (touch) schedulePush();
}
// alta o modificación de un registro: queda marcada su hora de edición (para unir dispositivos)
function upsert(coll, obj) {
  obj.u = Date.now();
  if (!obj.id) obj.id = uid();
  const a = S[coll], i = a.findIndex(x => x.id === obj.id);
  if (i < 0) a.push(obj); else a[i] = obj;
  return obj;
}
function removeRec(coll, id) {
  const i = S[coll].findIndex(x => x.id === id);
  if (i >= 0) S[coll].splice(i, 1);
  S.deleted.push(id);
}
const byId = (coll, id) => S[coll].find(x => x.id === id);
const school = id => byId('schools', id) || S.schools.find(s => !s.archived) || S.schools[0];
const student = id => byId('students', id);
const sName = st => st ? (st.first + (st.last ? ' ' + st.last : '')) : 'Alumno eliminado';
const sShort = st => st ? st.first + (st.last ? ' ' + st.last[0] + '.' : '') : '¿?';
const initials = st => st ? ((st.first || '?')[0] + (st.last ? st.last[0] : '')).toUpperCase() : '?';
const activeSchools = () => S.schools.filter(s => !s.archived);

/* =========================================================
   Música: tonalidades y transposición
   ========================================================= */
const EN_S = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const EN_F = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const LAT = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };
const MAJ_PREF = ['s', 'f', 's', 'f', 's', 'f', 's', 's', 'f', 's', 'f', 's'];   // C Db D Eb E F F# G Ab A Bb B
const MIN_PREF = ['s', 's', 's', 'f', 's', 'f', 's', 's', 's', 's', 'f', 's'];   // Cm C#m Dm Ebm Em Fm F#m Gm G#m Am Bbm Bm
const BLACK = [1, 3, 6, 8, 10];
function noteName(pc, spell, notation) {
  const n = (spell === 'f' ? EN_F : EN_S)[mod(pc, 12)];
  const acc = n.slice(1).replace('#', '♯').replace('b', '♭');
  return ((notation || S.settings.notation) === 'lat' ? LAT[n[0]] : n[0]) + acc;
}
function spellFor(k) {
  const a = S.settings.accidentals;
  if (a === 'sharp') return 's';
  if (a === 'flat') return 'f';
  return (k.minor ? MIN_PREF : MAJ_PREF)[mod(k.pc, 12)];
}
function keyName(k, o = {}) {
  if (!k || k.pc == null || k.pc === '') return '—';
  const sp = o.spell || spellFor(k);
  return noteName(k.pc, sp, o.notation) + (k.minor ? 'm' : '');
}
// equivalente enarmónico (solo teclas negras): F♯ = G♭
function enharm(k) {
  if (!k || k.pc == null || !BLACK.includes(mod(k.pc, 12))) return '';
  const sp = spellFor(k) === 's' ? 'f' : 's';
  return keyName(k, { spell: sp });
}
const transposeKey = (k, t) => (k && k.pc != null && k.pc !== '') ? { pc: mod(+k.pc + (+t || 0), 12), minor: !!k.minor } : null;
// semitonos entre dos tonalidades, eligiendo el camino más corto (-5…+6)
const semisBetween = (a, b) => { let d = mod(b - a, 12); if (d > 6) d -= 12; return d; };
const fmtSemis = t => t > 0 ? '+' + t : (t < 0 ? '−' + Math.abs(t) : '0');
function workKey(ss) {
  if (ss.manual && ss.workKey) return ss.workKey;
  const song = byId('songs', ss.songId);
  return transposeKey(song && song.key, ss.transpose || 0);
}
function semisOf(ss) {
  if (!ss) return 0;
  const sg = byId('songs', ss.songId);
  if (ss.manual && ss.workKey && sg && sg.key) return semisBetween(sg.key.pc, ss.workKey.pc);
  return +ss.transpose || 0;
}
const semisTxt = t => t ? `${fmtSemis(t)} ${Math.abs(t) === 1 ? 'semitono' : 'semitonos'}` : 'Tono original';
const semisTag = (t, small) => `<div class="keytag" style="${small ? 'min-width:42px;height:40px;font-size:15px;' : ''}${t ? '' : 'background:var(--card2);color:var(--tx2);font-size:' + (small ? 11 : 12) + 'px'}">${t ? fmtSemis(t) : 'Orig.'}${t && !small ? '<small>st</small>' : ''}</div>`;
// nombre de nota con octava para la extensión vocal (MIDI 60 = C4)
const midiName = m => m == null || m === '' ? '—' : noteName(mod(m, 12), 's') + (Math.floor(m / 12) - 1);
const rangeTxt = st => st && st.rangeLow != null && st.rangeHigh != null && st.rangeLow !== '' ? `${midiName(+st.rangeLow)} – ${midiName(+st.rangeHigh)}` : '';

/* =========================================================
   Clases: recurrencias, estados y cobros
   ========================================================= */
const STATUS = {
  scheduled: { l: 'Programada', s: 'Programada', c: 'st-sched' },
  done: { l: 'Realizada', s: 'Realizada', c: 'st-done' },
  absent: { l: 'Ausente', s: 'Ausente', c: 'st-absent' },
  cancel_student: { l: 'Cancelada por el alumno', s: 'Canceló alumno', c: 'st-cancel' },
  cancel_teacher: { l: 'Cancelada por mí', s: 'Cancelé yo', c: 'st-cancel' },
  rescheduled: { l: 'Reprogramada', s: 'Reprogramada', c: 'st-resched' },
  closed: { l: 'Sin clases en la escuela', s: 'Sin clases', c: 'st-cancel' },
};
// días sin clases de una escuela (feriados, vacaciones, eventos de la escuela)
function closureOf(l) {
  if (!l || l.kind === 'event' || !S.closures.length) return null;
  return S.closures.find(c => c.schoolId === l.schoolId && l.date >= c.from && l.date <= (c.to || c.from)) || null;
}
// estado efectivo: una clase programada en un día sin clases figura como "sin clases"
const stOf = l => l.status === 'scheduled' && closureOf(l) ? 'closed' : l.status;
const lessonMode = l => l.mode || ((l.studentIds || []).length > 1 ? 'group' : 'ind');
const lessonEnd = l => fromMin(toMin(l.start) + (+l.duration || 0));
const isEvent = l => l.kind === 'event';
const lessonTitle = l => isEvent(l) ? (l.title || 'Compromiso') : ((l.studentIds || []).map(id => sShort(student(id))).join(', ') || 'Sin alumnos');
const lessonById = id => S.lessons.find(l => l.id === id);
const seriesById = id => S.series.find(s => s.id === id);

// ¿esta fecha toca en la serie? (semanal o cada N semanas)
function seriesHits(s, d) {
  if (d < s.from || (s.until && d > s.until)) return false;
  if (!(s.days || []).includes(dow(d))) return false;
  if ((s.skip || []).includes(d)) return false;
  const iv = +s.interval || 1;
  if (iv > 1) {
    const w = Math.floor(dayDiff(weekStartOf(s.from), weekStartOf(d)) / 7);
    if (w % iv) return false;
  }
  return true;
}
const weekStartOf = s => addDays(s, -mod(dow(s) - 1, 7)); // semana fija lunes, para el cálculo de intervalos
function virtualOcc(s, d) {
  return {
    id: 'v:' + s.id + ':' + d, virtual: true, seriesId: s.id, seriesDate: d, date: d, start: s.start, duration: s.duration,
    studentIds: [...(s.studentIds || [])], schoolId: s.schoolId, mode: s.mode || '', kind: s.kind || 'lesson', title: s.title || '',
    status: 'scheduled', notes: s.notes || ''
  };
}
// todas las clases (reales + generadas por series) entre dos fechas, ordenadas
function occurrences(a, b) {
  const out = S.lessons.filter(l => l.date >= a && l.date <= b);
  const mat = new Set(S.lessons.filter(l => l.seriesId).map(l => l.seriesId + '|' + l.seriesDate));
  for (const s of S.series) {
    const from = s.from > a ? s.from : a, to = s.until && s.until < b ? s.until : b;
    if (from > to) continue;
    for (let d = from; d <= to; d = addDays(d, 1)) {
      if (!seriesHits(s, d) || mat.has(s.id + '|' + d)) continue;
      out.push(virtualOcc(s, d));
    }
  }
  return out.sort((x, y) => x.date < y.date ? -1 : x.date > y.date ? 1 : toMin(x.start) - toMin(y.start));
}
// convierte una clase generada por una serie en un registro real (para cambiarle el estado, etc.)
function materialize(o) {
  if (!o.virtual) return o;
  const l = clone(o); delete l.virtual; l.id = uid();
  return upsert('lessons', l);
}
function findOcc(id) {
  if (!id) return null;
  if (id.startsWith('v:')) {
    const [, sid, d] = id.split(':');
    const s = seriesById(sid); if (!s) return null;
    const m = S.lessons.find(l => l.seriesId === sid && l.seriesDate === d);
    return m || virtualOcc(s, d);
  }
  return lessonById(id);
}

// tarifa por hora vigente en una fecha
function rateAt(sc, date, mode) {
  const rs = [...(sc.rates || [])].sort((a, b) => a.from < b.from ? -1 : 1);
  let r = rs[0] || { ind: 0, grp: 0 };
  for (const x of rs) if (x.from <= date) r = x;
  return mode === 'group' ? +r.grp || 0 : +r.ind || 0;
}
// cuánto genera una clase según su estado y las reglas de su escuela
function charge(l, depth = 0) {
  const sc = school(l.schoolId), R = sc.rules || {};
  const res = { ok: false, minutes: 0, rate: 0, amount: 0, currency: sc.currency || 'UYU', why: '', concept: '' };
  if (isEvent(l)) { res.why = 'Compromiso, no es una clase'; return res; }
  const mode = lessonMode(l);
  res.rate = l.rate != null && l.rate !== '' ? +l.rate : rateAt(sc, l.date, mode);
  res.minutes = l.status === 'done' ? (+l.realDur || +l.duration || 0) : (+l.duration || 0);
  switch (l.status) {
    case 'done': res.ok = true; res.concept = mode === 'group' ? 'Clase grupal' : 'Clase individual'; break;
    case 'absent': res.ok = !!R.absent; res.concept = 'Ausencia (se cobra)'; res.why = res.ok ? '' : 'Ausencias no se cobran en ' + sc.name; break;
    case 'cancel_student': res.ok = !!R.cancelStudent; res.concept = 'Cancelada por el alumno (se cobra)'; res.why = res.ok ? '' : 'Cancelaciones del alumno no se cobran en ' + sc.name; break;
    case 'cancel_teacher': res.ok = !!R.cancelTeacher; res.concept = 'Cancelada por el profesor (se cobra)'; res.why = res.ok ? '' : 'Cancelaciones tuyas no se cobran en ' + sc.name; break;
    case 'rescheduled': res.why = 'Reprogramada: se cuenta la reposición, no esta'; break;
    default: {
      const cl = closureOf(l);
      if (cl) {
        if (cl.charged && l.date <= today()) { res.ok = true; res.concept = 'Día sin clases (se cobra)'; }
        else res.why = cl.charged ? 'Día sin clases: se cobrará ese día' : 'Día sin clases en ' + sc.name + (cl.reason ? ' (' + cl.reason + ')' : '') + ': no se cobra';
      } else res.why = 'Todavía no se realizó';
    }
  }
  // una reposición de una clase que ya se cobró no se cobra dos veces (salvo que la escuela lo indique)
  if (res.ok && l.makeupOf && !R.makeupDouble && depth < 5) {
    const o = lessonById(l.makeupOf);
    if (o && o.status !== 'rescheduled' && charge(o, depth + 1).ok) { res.ok = false; res.why = 'Reposición de una clase que ya se cobró'; }
    else if (res.ok && l.status === 'done') res.concept = (mode === 'group' ? 'Clase grupal' : 'Clase individual') + ' (reposición)';
  }
  res.amount = res.ok ? Math.round(res.rate * res.minutes / 60 * 100) / 100 : 0;
  return res;
}
// cambia el estado de una clase guardando la tarifa vigente en ese momento
function setStatus(o, status, extra = {}) {
  const l = materialize(o);
  l.status = status;
  if (status === 'scheduled') { delete l.rate; delete l.realDur; }
  else if (l.rate == null || l.rate === '') l.rate = rateAt(school(l.schoolId), l.date, lessonMode(l));
  Object.assign(l, extra);
  upsert('lessons', l);
  return l;
}
// clases del pasado que siguen sin confirmar
function pendingConfirm(days = 45) {
  const t = today(), nm = nowMin();
  return occurrences(addDays(t, -days), t).filter(l => !isEvent(l) && stOf(l) === 'scheduled' && (l.date < t || toMin(l.start) + (+l.duration || 0) <= nm));
}

/* ---------- resúmenes para estadísticas ---------- */
function summarize(a, b, schoolId) {
  const ls = occurrences(a, b).filter(l => !isEvent(l) && (!schoolId || l.schoolId === schoolId));
  const r = { lessons: ls, done: 0, minutes: 0, minInd: 0, minGrp: 0, income: {}, incInd: {}, incGrp: {}, incOther: {}, chargedNotDone: 0, byStudent: {}, cancelled: 0, absent: 0, scheduled: 0, closed: 0 };
  for (const l of ls) {
    const c = charge(l);
    if (l.status === 'done') {
      r.done++; r.minutes += c.minutes;
      if (lessonMode(l) === 'group') r.minGrp += c.minutes; else r.minInd += c.minutes;
      (l.studentIds || []).forEach(id => { r.byStudent[id] = (r.byStudent[id] || 0) + 1; });
    }
    if (l.status === 'absent') r.absent++;
    if (l.status === 'cancel_student' || l.status === 'cancel_teacher') r.cancelled++;
    if (stOf(l) === 'scheduled') r.scheduled++;
    if (stOf(l) === 'closed') r.closed++;
    if (c.ok) {
      addMoney(r.income, c.currency, c.amount);
      if (l.status !== 'done') { addMoney(r.incOther, c.currency, c.amount); r.chargedNotDone++; }
      else if (lessonMode(l) === 'group') addMoney(r.incGrp, c.currency, c.amount);
      else addMoney(r.incInd, c.currency, c.amount);
    }
  }
  return r;
}
// lo que podrías generar de acá a fin de mes con las clases ya agendadas
function projection(endDate, schoolId) {
  const t = today(), nm = nowMin(), acc = {};
  occurrences(t, endDate).forEach(l => {
    const es = stOf(l);
    if (isEvent(l) || (es !== 'scheduled' && !(es === 'closed' && closureOf(l).charged)) || (schoolId && l.schoolId !== schoolId)) return;
    if (l.date === t && toMin(l.start) + (+l.duration || 0) <= nm) return;
    const sc = school(l.schoolId);
    addMoney(acc, sc.currency, rateAt(sc, l.date, lessonMode(l)) * (+l.duration || 0) / 60);
  });
  return acc;
}

/* ---------- contexto de un alumno antes de la clase ---------- */
function studentContext(sid, beforeDate) {
  const logs = S.lessonNotes.filter(n => n.studentId === sid).sort((a, b) => a.date < b.date ? 1 : -1);
  const done = S.lessons.filter(l => (l.studentIds || []).includes(sid) && l.status === 'done' && (!beforeDate || l.date <= beforeDate)).sort((a, b) => a.date < b.date ? 1 : -1);
  const songs = S.studentSongs.filter(x => x.studentId === sid && !x.endedAt);
  const pinned = S.vocalNotes.filter(n => n.studentId === sid && n.pinned);
  return { lastLesson: done[0] || null, lastLog: logs[0] || null, logs, songs, pinned, st: student(sid) };
}
function nextLessonOf(sid) {
  const t = today(), nm = nowMin();
  return occurrences(t, addDays(t, 60)).find(l => (l.studentIds || []).includes(sid) && stOf(l) === 'scheduled' && (l.date > t || toMin(l.start) >= nm - 30)) || null;
}

/* =========================================================
   Cuenta y nube (Supabase, el mismo proyecto que Entreno)
   ========================================================= */
const SUPA_URL = 'https://jkshavrhpoqtkuwxpktp.supabase.co';
const SUPA_KEY = 'sb_publishable_xufseXK5syhEFZJBw4hKTw_JMdKG_4h';
const TABLE = 'tesitura_data';
const cloudOn = () => !!(SUPA_URL && SUPA_KEY);
let AUTH = null;
try { AUTH = JSON.parse(localStorage.getItem(AKEY) || 'null'); } catch (e) { }
let syncState = 'off', syncErr = '', syncing = false, pushT = 0;
function authFromLink() {
  try {
    const h = new URLSearchParams(location.hash.slice(1));
    const at = h.get('access_token'), rt = h.get('refresh_token');
    if (!at || !rt) return null;
    const pl = JSON.parse(atob(at.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    history.replaceState(null, '', location.pathname);
    return { access_token: at, refresh_token: rt, expires_in: +h.get('expires_in') || 3600, user: { id: pl.sub, email: pl.email } };
  } catch (e) { return null; }
}
function setAuth(j) {
  AUTH = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + (j.expires_in || 3600) * 1000, user: { id: j.user.id, email: j.user.email } };
  localStorage.setItem(AKEY, JSON.stringify(AUTH));
}
const linkAuth = authFromLink();
if (linkAuth) setAuth(linkAuth);
function clearAuth() { AUTH = null; localStorage.removeItem(AKEY); setSync('off'); }
function setSync(st) {
  syncState = st;
  document.querySelectorAll('[data-sync]').forEach(el => { el.dataset.sync = st; });
  document.querySelectorAll('.synctxt').forEach(el => { el.textContent = syncLabel(); });
}
function syncLabel() {
  if (!cloudOn()) return 'Servidor sin configurar';
  if (!AUTH) return 'Sin cuenta: los datos están solo en este dispositivo';
  return {
    ok: 'Sincronizado' + (S.lastSync ? ' · ' + fmtTime(S.lastSync) : ''), syncing: 'Sincronizando…', pending: 'Cambios pendientes de subir',
    error: 'Error al sincronizar' + (syncErr ? ' (' + syncErr + ')' : ''), off: 'Sin sincronizar'
  }[syncState] || '';
}
async function authCall(path, body) {
  const r = await fetch(SUPA_URL + '/auth/v1/' + path, { method: 'POST', headers: { apikey: SUPA_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.msg || j.error_description || j.message || j.error || ('Error ' + r.status));
  return j;
}
const authMsg = m => /invalid login/i.test(m) ? 'Email o contraseña incorrectos'
  : /already registered|already exists/i.test(m) ? 'Ya existe una cuenta con ese email: iniciá sesión'
  : /at least 6|password should/i.test(m) ? 'La contraseña tiene que tener al menos 6 caracteres'
  : /not confirmed/i.test(m) ? 'Confirmá tu email antes de iniciar sesión'
  : /failed to fetch|network/i.test(m) ? 'Sin conexión' : m;
async function refreshAuth() { setAuth(await authCall('token?grant_type=refresh_token', { refresh_token: AUTH.refresh_token })); }
async function api(path, opts = {}, retry = true) {
  if (AUTH && Date.now() > AUTH.expires_at - 60000) await refreshAuth();
  const r = await fetch(SUPA_URL + path, Object.assign({}, opts, { headers: Object.assign({ apikey: SUPA_KEY, Authorization: 'Bearer ' + AUTH.access_token, 'Content-Type': 'application/json' }, opts.headers || {}) }));
  if (r.status === 401 && retry) { await refreshAuth(); return api(path, opts, false); }
  return r;
}
function schedulePush() {
  if (!cloudOn() || !AUTH) return;
  setSync('pending'); clearTimeout(pushT); pushT = setTimeout(syncNow, 1500);
}
const hasContent = d => d.students.length || d.lessons.length || d.series.length || d.invoices.length;
// une este dispositivo con la nube: cada registro conserva su versión más reciente
function mergeData(L, Rm) {
  Rm = migrate(clone(Rm));
  if (!L.lastSync && !hasContent(L)) { Rm.lastSync = 0; return Rm; }
  const del = new Set([...(L.deleted || []), ...(Rm.deleted || [])]);
  const pick = (a, b) => (b && (b.u || 0) > ((a && a.u) || 0)) ? b : a;
  const union = (a = [], b = []) => { const m = new Map(); a.forEach(x => m.set(x.id, x)); b.forEach(x => { const y = m.get(x.id); m.set(x.id, y ? pick(y, x) : x); }); return [...m.values()].filter(x => !del.has(x.id)); };
  const out = clone(L);
  COLLS.forEach(c => { out[c] = union(L[c], Rm[c]); });
  out.settings = pick(L.settings, Rm.settings);
  out.deleted = [...del].slice(-5000);
  out.updatedAt = Math.max(L.updatedAt || 0, Rm.updatedAt || 0);
  out.lastSync = L.lastSync;
  return out;
}
async function syncNow(manual) {
  if (!cloudOn() || !AUTH || syncing) return;
  if (!navigator.onLine) { setSync('pending'); return; }
  syncing = true; setSync('syncing');
  try {
    const before = JSON.stringify(S);
    const r = await api(`/rest/v1/${TABLE}?select=data&user_id=eq.${AUTH.user.id}`);
    if (r.status === 404) throw new Error('falta crear la tabla en Supabase');
    if (!r.ok) throw new Error('lectura ' + r.status);
    const rows = await r.json();
    if (rows[0] && rows[0].data) S = mergeData(S, rows[0].data);
    S.lastSync = Date.now();
    localStorage.setItem(KEY, JSON.stringify(S));
    const w = await api('/rest/v1/' + TABLE, {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ user_id: AUTH.user.id, data: S, updated_at: new Date().toISOString() })
    });
    if (!w.ok) throw new Error('escritura ' + w.status);
    syncErr = ''; setSync('ok');
    const strip = s => { const o = JSON.parse(s); o.lastSync = 0; return JSON.stringify(o); };
    if (strip(before) !== strip(JSON.stringify(S)) && !document.querySelector('.sheet.open')) { const y = window.scrollY; render(); window.scrollTo(0, y); }
    if (manual) toast('Sincronizado');
  } catch (e) {
    syncErr = e.message; setSync(navigator.onLine ? 'error' : 'pending');
    if (/refresh|token|jwt/i.test(e.message)) { clearAuth(); toast('Tu sesión venció: volvé a iniciar sesión', 'err'); }
    else if (manual) toast('No se pudo sincronizar: ' + e.message, 'err');
  } finally { syncing = false; }
}
window.addEventListener('online', () => syncNow());
document.addEventListener('visibilitychange', () => { if (!document.hidden && AUTH && Date.now() - (S.lastSync || 0) > 20000) syncNow(); });
