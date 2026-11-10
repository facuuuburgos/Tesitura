'use strict';
/* =========================================================
   Tesitura · estadísticas, facturas y exportaciones
   ========================================================= */
function statRange() {
  const p = UI.statPer, d = UI.statDate;
  if (p === 'week') { const a = weekStart(d); return [a, addDays(a, 6)]; }
  if (p === 'year') return [d.slice(0, 4) + '-01-01', d.slice(0, 4) + '-12-31'];
  if (p === 'range') { const a = UI.statFrom || monthStart(today()), b = UI.statTo || today(); return a <= b ? [a, b] : [b, a]; }
  return [monthStart(d), monthEnd(d)];
}
function rangeLabel(a, b) {
  const p = UI.statPer;
  if (p === 'month') return `${MON_L[parseD(a).getMonth()]} ${a.slice(0, 4)}`;
  if (p === 'year') return a.slice(0, 4);
  return `${fmtDate(a, { year: a.slice(0, 4) !== b.slice(0, 4) })} – ${fmtDate(b, { year: 1 })}`;
}
const perHour = (inc, min) => { const o = {}; Object.keys(inc).forEach(c => { if (min) o[c] = inc[c] / (min / 60); }); return o; };

VIEWS.stats = () => {
  const [a, b] = statRange(), sid = UI.statSchool, s = summarize(a, b, sid), t = today();
  const proj = S.settings.projection && b >= t ? projection(b, sid) : {};
  const projTxt = Object.values(proj).some(Boolean) ? moneyTotal(proj) : '';
  const per = UI.statPer;
  const multi = activeSchools().length > 1;
  // evolución: 12 meses (o 10 semanas en vista semanal)
  const evo = [];
  if (per === 'week') for (let i = 9; i >= 0; i--) { const x = addDays(weekStart(UI.statDate), -7 * i); const y = summarize(x, addDays(x, 6), sid); evo.push({ l: parseD(x).getDate() + '/' + (parseD(x).getMonth() + 1), y, cur: i === 0 }); }
  else { const end = per === 'year' ? UI.statDate.slice(0, 4) + '-12-01' : monthStart(b); for (let i = 11; i >= 0; i--) { const x = addMonths(end, -i); const y = summarize(x, monthEnd(x), sid); evo.push({ l: MON_S[parseD(x).getMonth()], y, cur: x === monthStart(UI.statDate) && per === 'month' }); } }
  const curs = [...new Set(evo.flatMap(e => Object.keys(e.y.income)).concat(Object.keys(s.income)))];
  const top = Object.entries(s.byStudent).sort((x, y) => y[1] - x[1]).slice(0, 6);
  const topMax = top.length ? top[0][1] : 1;
  const avg = perHour(s.income, s.minutes);
  return `${topbar('Estadísticas', { right: `<button class="iconbtn" data-act="exportMenu" aria-label="Exportar">${ic('download')}</button>` })}
    <div class="seg" style="margin-bottom:12px"><button class="on">Resumen</button><button data-go="#/invoices">Facturas</button></div>
    <div class="chips" style="margin-bottom:10px">${[['week', 'Semana'], ['month', 'Mes'], ['year', 'Año'], ['range', 'Rango']].map(([k, l]) => `<button class="chip ${per === k ? 'on' : ''}" data-act="statPer" data-v="${k}">${l}</button>`).join('')}</div>
    ${per === 'range' ? `<div class="grid2">${field('Desde', `<input class="inp" type="date" id="sfrom" value="${a}">`)}${field('Hasta', `<input class="inp" type="date" id="sto" value="${b}">`)}</div>`
      : `<div class="calnav"><button class="iconbtn" data-act="statNav" data-n="-1">${ic('chevL', 'sm')}</button><div class="ttl center">${rangeLabel(a, b)}</div><button class="iconbtn" data-act="statNav" data-n="1">${ic('chevR', 'sm')}</button></div>`}
    ${multi ? `<div class="chips" style="margin-bottom:14px"><button class="chip ${!sid ? 'on' : ''}" data-act="statSchool" data-v="">Todas</button>${activeSchools().map(x => `<button class="chip ${sid === x.id ? 'on' : ''}" data-act="statSchool" data-v="${x.id}">${schoolDot(x)}${esc(x.name)}</button>`).join('')}</div>` : ''}
    <div class="stats">
      <div class="stat hero"><div class="k">${ic('coin', 'sm')}Ingresos generados</div><div class="v num">${moneyTotal(s.income)}</div>${moneyDetail(s.income) ? `<div class="h">${moneyDetail(s.income)}</div>` : ''}
        ${s.chargedNotDone ? `<div class="h">Incluye ${fmtMoneyMap(s.incOther)} de ${s.chargedNotDone} ausencia${s.chargedNotDone > 1 ? 's' : ''}/cancelación${s.chargedNotDone > 1 ? 'es' : ''} que se cobran según la escuela</div>` : ''}
        ${projTxt ? `<div class="proj">${ic('target', 'sm')}<span>Proyectado: <b class="num">+ ${projTxt}</b></span><span class="dim">(${s.scheduled} clase${s.scheduled === 1 ? '' : 's'} agendada${s.scheduled === 1 ? '' : 's'}, no es ingreso real)</span></div>` : ''}</div>
      <div class="stat"><div class="k">${ic('clock', 'sm')}Horas trabajadas</div><div class="v num">${fmtHours(s.minutes)}</div><div class="h">${s.done ? 'promedio ' + fmtDur(s.minutes / s.done) + ' por clase' : 'en clases realizadas'}</div></div>
      <div class="stat"><div class="k">${ic('check', 'sm')}Clases realizadas</div><div class="v num">${s.done}</div><div class="h">${s.absent} ausencias · ${s.cancelled} canceladas</div></div>
      <div class="stat"><div class="k">${ic('users', 'sm')}Individuales</div><div class="v num ${Object.keys(s.incInd).length > 1 ? 'multi' : ''}">${fmtMoneyMap(s.incInd)}</div><div class="h">${fmtHours(s.minInd)}</div></div>
      <div class="stat"><div class="k">${ic('users', 'sm')}Grupales</div><div class="v num ${Object.keys(s.incGrp).length > 1 ? 'multi' : ''}">${fmtMoneyMap(s.incGrp)}</div><div class="h">${fmtHours(s.minGrp)}</div></div>
      <div class="stat" style="grid-column:1/-1"><div class="k">${ic('coin', 'sm')}Promedio por hora dictada</div><div class="v num">${fmtMoneyMap(avg, '—')}</div></div>
    </div>
    ${curs.length ? curs.map(c => `<div class="sec"><h2>Evolución de ingresos${curs.length > 1 ? ' · ' + c : ''}</h2></div><div class="card">${barChart(evo.map(e => ({ l: e.l, v: e.y.income[c] || 0, cur: e.cur })), v => money(v, c), { short: v => shortNum(v) })}</div>`).join('')
      : `<div class="sec"><h2>Evolución de ingresos</h2></div><div class="card small muted">Todavía no hay ingresos registrados.</div>`}
    <div class="sec"><h2>Horas trabajadas</h2></div>
    <div class="card">${barChart(evo.map(e => ({ l: e.l, v: e.y.minutes / 60, cur: e.cur, v2: e.y.minGrp / 60 })), v => (Math.round(v * 10) / 10) + ' h', { stack: true, short: v => (Math.round(v * 10) / 10) + '' })}
      <div class="legend" style="margin-top:6px"><span><i class="dot" style="background:var(--acc)"></i>Individual</span><span><i class="dot" style="background:var(--grp)"></i>Grupal</span></div></div>
    <div class="sec"><h2>Distribución por modalidad</h2></div>
    <div class="card">${s.minutes ? `<div class="split"><div style="width:${s.minInd / s.minutes * 100}%;background:var(--acc)"></div><div style="width:${s.minGrp / s.minutes * 100}%;background:var(--grp)"></div></div>
      <div class="row small"><span class="grow"><i class="dot" style="background:var(--acc)"></i> Individual ${Math.round(s.minInd / s.minutes * 100)}% · ${fmtHours(s.minInd)}</span><span><i class="dot" style="background:var(--grp)"></i> Grupal ${Math.round(s.minGrp / s.minutes * 100)}% · ${fmtHours(s.minGrp)}</span></div>` : '<div class="small muted">Sin clases realizadas en este período.</div>'}</div>
    <div class="sec"><h2>Alumnos con más clases</h2></div>
    <div class="card">${top.length ? top.map(([id, n]) => { const st = student(id); return `<div class="rank">${avatar(st, 'sm')}<div class="grow"><div class="row"><span class="grow ell small" style="font-weight:550">${esc(sName(st))}</span><span class="small muted num">${n}</span></div><div class="b" style="width:${n / topMax * 100}%"></div></div></div>`; }).join('') : '<div class="small muted">Sin datos en este período.</div>'}</div>
    <div class="btns" style="margin-top:20px"><button class="btn" data-act="exportPdf">${ic('file', 'sm')}Reporte PDF</button><button class="btn" data-act="exportXls">${ic('table', 'sm')}Excel</button></div>`;
};
const shortNum = v => v >= 1e6 ? (Math.round(v / 1e5) / 10) + 'M' : v >= 1e4 ? Math.round(v / 1e3) + 'k' : v >= 1000 ? (Math.round(v / 100) / 10) + 'k' : String(Math.round(v));
AFTER.stats = m => {
  const f = m.querySelector('#sfrom'), t = m.querySelector('#sto');
  if (f) { f.onchange = () => { UI.statFrom = f.value; render(); }; t.onchange = () => { UI.statTo = t.value; render(); }; }
};
ACT.statPer = el => { UI.statPer = el.dataset.v; if (el.dataset.v === 'range' && !UI.statFrom) { const [a, b] = [monthStart(today()), today()]; UI.statFrom = a; UI.statTo = b; } render(); };
ACT.statNav = el => { const n = +el.dataset.n; UI.statDate = UI.statPer === 'week' ? addDays(UI.statDate, 7 * n) : UI.statPer === 'year' ? addMonths(UI.statDate, 12 * n) : addMonths(UI.statDate, n); render(); };
ACT.statSchool = el => { UI.statSchool = el.dataset.v; render(); };

// gráfico de barras minimalista (SVG)
function barChart(data, fmt, o = {}) {
  const W = window.innerWidth < 600 ? 360 : 640, H = window.innerWidth < 600 ? 170 : 190, pb = 22, pt = 20, n = data.length, max = Math.max(...data.map(d => d.v), 0) || 1;
  const bw = W / n, w = Math.min(bw * .58, 34);
  const y = v => pt + (H - pb - pt) * (1 - v / max);
  const grid = [0, .5, 1].map(f => `<line class="gl" x1="0" x2="${W}" y1="${y(max * f)}" y2="${y(max * f)}"/>`).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${grid}${data.map((d, i) => {
    const x = i * bw + (bw - w) / 2, h = Math.max(H - pb - y(d.v), d.v ? 2 : 0);
    const h2 = o.stack && d.v2 ? Math.max((H - pb - pt) * d.v2 / max, 2) : 0;
    const show = d.v && (d.cur || n <= 8 || d.v === max);
    return `<g><title>${esc(d.l)}: ${esc(fmt(d.v))}</title>
      <rect class="bar ${d.cur || o.stack ? '' : 'dim'}" x="${x}" y="${H - pb - h}" width="${w}" height="${h}" rx="4"/>
      ${h2 ? `<rect class="bar alt" x="${x}" y="${H - pb - h2}" width="${w}" height="${h2}" rx="4"/>` : ''}
      ${show ? `<text class="val" x="${x + w / 2}" y="${H - pb - h - 6}" text-anchor="middle">${esc(o.short ? o.short(d.v) : fmt(d.v))}</text>` : ''}
      <text x="${x + w / 2}" y="${H - 6}" text-anchor="middle" style="${d.cur ? 'fill:var(--tx)' : ''}">${esc(d.l)}</text></g>`;
  }).join('')}</svg>`;
}

/* ---------- facturas ---------- */
const T = {
  es: { inv: 'FACTURA', no: 'N°', date: 'Fecha', from: 'De', to: 'Para', period: 'Período', d: 'Fecha', st: 'Alumno', c: 'Concepto', dur: 'Duración', rate: 'Tarifa/h', amt: 'Importe', tot: 'TOTAL', hours: 'Horas', lessons: 'Clases', thanks: 'Gracias.' },
  en: { inv: 'INVOICE', no: 'No.', date: 'Date', from: 'From', to: 'Bill to', period: 'Period', d: 'Date', st: 'Student', c: 'Description', dur: 'Duration', rate: 'Rate/h', amt: 'Amount', tot: 'TOTAL', hours: 'Hours', lessons: 'Lessons', thanks: 'Thank you.' }
};
const CONCEPT_EN = { 'Clase individual': 'Private lesson', 'Clase grupal': 'Group lesson', 'Clase individual (reposición)': 'Private lesson (make-up)', 'Clase grupal (reposición)': 'Group lesson (make-up)', 'Ausencia (se cobra)': 'No-show (billable)', 'Cancelada por el alumno (se cobra)': 'Late cancellation (billable)', 'Cancelada por el profesor (se cobra)': 'Cancelled by teacher (billable)' };
const invNumber = (sc, n) => (sc.prefix || '') + String(n).padStart(4, '0');
function invoiceData(sc, a, b) {
  const ls = occurrences(a, b).filter(l => !isEvent(l) && l.schoolId === sc.id);
  const inc = [], exc = [];
  ls.forEach(l => { const c = charge(l); (c.ok ? inc : exc).push({ l, c }); });
  return { inc, exc, unconfirmed: ls.filter(l => l.status === 'scheduled' && (l.date < today() || (l.date === today() && toMin(l.start) + l.duration <= nowMin()))), total: inc.reduce((x, y) => x + y.c.amount, 0), minutes: inc.reduce((x, y) => x + y.c.minutes, 0) };
}
VIEWS.invoices = () => {
  const schools = activeSchools();
  if (!UI.invSchool || !byId('schools', UI.invSchool)) UI.invSchool = (schools[0] || S.schools[0]).id;
  const sc = school(UI.invSchool), a = UI.invMonth, b = monthEnd(a);
  const D = invoiceData(sc, a, b);
  const existing = S.invoices.filter(i => i.schoolId === sc.id && i.from === a);
  const past = S.invoices.filter(i => !UI.invAll ? i.schoolId === sc.id : true).sort((x, y) => (y.issued + y.number).localeCompare(x.issued + x.number));
  const R = sc.rules;
  const rule = (on, l) => `<span class="pill ${on ? 'st-done' : 'st-sched'}">${on ? '✓' : '✕'} ${l}</span>`;
  return `${topbar('Facturas', { right: `<button class="iconbtn" data-go="#/school/${sc.id}" aria-label="Configurar escuela">${ic('gear')}</button>` })}
    <div class="seg" style="margin-bottom:14px"><button data-go="#/stats">Resumen</button><button class="on">Facturas</button></div>
    ${schools.length > 1 ? `<div class="chips" style="margin-bottom:12px">${schools.map(x => `<button class="chip ${x.id === sc.id ? 'on' : ''}" data-act="invSchool" data-v="${x.id}">${schoolDot(x)}${esc(x.name)}</button>`).join('')}</div>` : ''}
    <div class="calnav"><button class="iconbtn" data-act="invNav" data-n="-1">${ic('chevL', 'sm')}</button><div class="ttl center">${MON_L[parseD(a).getMonth()]} ${a.slice(0, 4)}</div><button class="iconbtn" data-act="invNav" data-n="1">${ic('chevR', 'sm')}</button></div>
    <div class="card" style="padding:12px 14px"><div class="row wrap" style="gap:6px">${rule(true, 'Realizadas')}${rule(R.absent, 'Ausencias')}${rule(R.cancelStudent, 'Canc. alumno')}${rule(R.cancelTeacher, 'Canc. profesor')}${rule(R.makeupDouble, 'Reposición de clase ya cobrada')}</div>
      <div class="small muted" style="margin-top:8px">Reglas de ${esc(sc.name)} · <a href="#/school/${sc.id}">cambiar</a> · Tarifa actual ${money(rateAt(sc, today(), 'ind'), sc.currency)}/h ind. · ${money(rateAt(sc, today(), 'group'), sc.currency)}/h grupal${sc.billTo ? ' · Para: ' + esc(sc.billTo) : ''}</div></div>
    ${D.unconfirmed.length ? `<div class="warnbox" style="margin-top:12px">${ic('alert', 'sm')}<div class="grow">Hay ${D.unconfirmed.length} clase${D.unconfirmed.length > 1 ? 's' : ''} de este período sin confirmar. Marcalas como realizadas, ausentes o canceladas para que la factura sea exacta.<div class="chips" style="flex-wrap:wrap;margin-top:8px">${D.unconfirmed.slice(0, 6).map(l => `<button class="chip" style="color:var(--warn);border-color:rgba(232,196,106,.4)" data-act="openLesson" data-id="${l.id}">${fmtDate(l.date)} · ${esc(lessonTitle(l))}</button>`).join('')}</div></div></div>` : ''}
    <div class="sec"><h2>Se facturan</h2><span class="small muted">${D.inc.length} · ${fmtHours(D.minutes)}</span></div>
    ${D.inc.length ? `<div class="list">${D.inc.map(({ l, c }) => `<button class="inv-line" style="width:100%;text-align:left" data-act="openLesson" data-id="${l.id}"><span class="ell"><b style="font-weight:550">${fmtDate(l.date, { dow: 1 })}</b> · ${esc(lessonTitle(l))}</span><span class="num" style="font-weight:600">${money(c.amount, c.currency)}</span><span class="small muted">${esc(c.concept)} · ${fmtDur(c.minutes)} × ${money(c.rate, c.currency)}/h</span><span></span></button>`).join('')}
      <div class="inv-tot"><span>Total</span><span class="num">${money(D.total, sc.currency)}</span></div></div>` : `<div class="card small muted">No hay clases facturables en este período.</div>`}
    ${D.exc.length ? `<details style="margin-top:12px"><summary class="small muted" style="cursor:pointer;padding:6px 2px">No se facturan (${D.exc.length})</summary><div class="list" style="margin-top:8px">${D.exc.map(({ l, c }) => `<button class="inv-line off" style="width:100%;text-align:left" data-act="openLesson" data-id="${l.id}"><span class="ell">${fmtDate(l.date, { dow: 1 })} · ${esc(lessonTitle(l))}</span><span class="pill ${STATUS[l.status].c}">${STATUS[l.status].s}</span><span class="small muted">${esc(c.why)}</span><span></span></button>`).join('')}</div></details>` : ''}
    <div class="sp"></div>
    ${existing.length ? `<div class="infobox">${ic('file', 'sm')}<div class="grow">Ya generaste la factura ${existing.map(i => 'N° ' + esc(i.number)).join(', ')} para este mes${Math.abs(existing[0].total - D.total) > .005 ? ` por ${money(existing[0].total, existing[0].currency)}. <b style="color:var(--warn)">Los datos cambiaron desde entonces.</b>` : '.'}</div></div>
      <div class="btns"><button class="btn" data-act="dlInvoice" data-id="${existing[0].id}">${ic('download', 'sm')}Descargar</button><button class="btn" data-act="regenInvoice" data-id="${existing[0].id}">${ic('repeat', 'sm')}Actualizar</button></div>`
      : `<button class="btn pri full" data-act="genInvoice" ${D.inc.length ? '' : 'disabled'}>${ic('file', 'sm')}Generar factura N° ${esc(invNumber(sc, sc.nextNo || 1))}</button>`}
    <div class="sec"><h2>Facturas emitidas</h2>${S.schools.length > 1 ? `<button class="lnk small" data-act="invAll">${UI.invAll ? 'Solo esta escuela' : 'Ver todas'}</button>` : ''}</div>
    ${past.length ? `<div class="list">${past.map(i => `<div class="li">${ic('file')}<div class="grow"><div class="t">N° ${esc(i.number)} · ${MON_L[parseD(i.from).getMonth()]} ${i.from.slice(0, 4)}</div><div class="s">${esc(i.schoolName)} · ${money(i.total, i.currency)} · emitida ${fmtDate(i.issued)}</div></div><button class="iconbtn plain" data-act="dlInvoice" data-id="${i.id}" aria-label="Descargar">${ic('download', 'sm')}</button><button class="iconbtn plain" data-act="delInvoice" data-id="${i.id}" aria-label="Eliminar">${ic('trash', 'sm')}</button></div>`).join('')}</div>` : `<div class="card small muted">Todavía no generaste facturas.</div>`}`;
};
ACT.invSchool = el => { UI.invSchool = el.dataset.v; render(); };
ACT.invNav = el => { UI.invMonth = addMonths(UI.invMonth, +el.dataset.n); render(); };
ACT.invAll = () => { UI.invAll = !UI.invAll; render(); };
function buildInvoice(sc, a, b, number, id) {
  const D = invoiceData(sc, a, b), lang = sc.lang || 'es';
  return {
    id: id || uid(), schoolId: sc.id, schoolName: sc.name, number, from: a, to: b, issued: today(), currency: sc.currency, lang,
    teacher: S.settings.teacher, email: S.settings.email, ig: S.settings.ig, billTo: sc.billTo, billToEmail: sc.billToEmail, note: sc.invoiceNote || '',
    lines: D.inc.map(({ l, c }) => ({ date: l.date, student: (l.studentIds || []).map(i => sName(student(i))).join(', '), concept: lang === 'en' ? (CONCEPT_EN[c.concept] || c.concept) : c.concept, minutes: c.minutes, rate: c.rate, amount: c.amount, lessonId: l.id })),
    total: Math.round(D.total * 100) / 100, minutes: D.minutes
  };
}
ACT.genInvoice = async el => {
  const sc = school(UI.invSchool), a = UI.invMonth, b = monthEnd(a);
  if (!S.settings.teacher) {
    const v = await ask('Falta tu nombre', 'Agregalo en Configuración para que aparezca en la factura.', [{ label: 'Ir a Configuración', val: 'go' }, { label: 'Generar igual', val: 'ok', cls: 'ghost' }]);
    if (v === 'go') { go('#/settings'); return; } if (!v) return;
  }
  const inv = buildInvoice(sc, a, b, invNumber(sc, sc.nextNo || 1));
  sc.nextNo = (+sc.nextNo || 1) + 1; upsert('schools', sc);
  upsert('invoices', inv); save(); render();
  busy(el, true);
  await downloadInvoice(inv);
};
ACT.regenInvoice = async el => {
  const old = byId('invoices', el.dataset.id), sc = school(old.schoolId);
  if (!(await ask('¿Actualizar la factura N° ' + old.number + '?', 'Se recalcula con los datos actuales y conserva el mismo número.', [{ label: 'Actualizar', val: true }, { label: 'Cancelar', val: false, cls: 'ghost' }]))) return;
  const inv = buildInvoice(sc, old.from, old.to, old.number, old.id);
  upsert('invoices', inv); save(); render();
  await downloadInvoice(inv);
};
ACT.dlInvoice = el => downloadInvoice(byId('invoices', el.dataset.id));
ACT.delInvoice = async el => {
  const inv = byId('invoices', el.dataset.id), sc = byId('schools', inv.schoolId);
  if (!(await confirmDel('¿Eliminar la factura N° ' + inv.number + '?', 'Las clases no se modifican; solo se borra este registro.'))) return;
  removeRec('invoices', inv.id);
  // si era la última emitida, se libera su número
  if (sc && invNumber(sc, (+sc.nextNo || 1) - 1) === inv.number) { sc.nextNo = (+sc.nextNo || 1) - 1; upsert('schools', sc); }
  save(); render(); toast('Factura eliminada');
};

/* ---------- librerías externas (se cargan solo al exportar) ---------- */
const LIBS = { jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', xlsx: 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js' };
const libP = {};
function loadLib(k) {
  if (!libP[k]) libP[k] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = LIBS[k]; s.onload = res; s.onerror = () => { delete libP[k]; rej(new Error('Sin conexión para cargar el generador')); }; document.head.appendChild(s); });
  return libP[k];
}
async function deliver(blob, name) {
  const file = new File([blob], name, { type: blob.type });
  const touch = matchMedia('(pointer:coarse)').matches;
  if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}
const pdfMoney = (n, c) => money(n, c).replace(/ /g, ' ');

async function downloadInvoice(inv) {
  const tt = T[inv.lang] || T.es;
  try {
    await loadLib('jspdf');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297, H = 210, M = 16;
    const acc = [196, 128, 86], ink = [28, 27, 31], mute = [120, 118, 126], line = [228, 226, 230];
    const fd = s => { const d = parseD(s); return inv.lang === 'en' ? `${MON_EN[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}` : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
    const fdur = m => inv.lang === 'en' ? (m % 60 ? (m >= 60 ? Math.floor(m / 60) + ' h ' : '') + (m % 60) + ' min' : (m / 60) + ' h') : fmtDur(m);
    const per = inv.lang === 'en' ? `${MON_EN[parseD(inv.from).getMonth()]} ${inv.from.slice(0, 4)}` : `${MON_L[parseD(inv.from).getMonth()]} ${inv.from.slice(0, 4)}`;
    // encabezado
    doc.setFillColor(...acc); doc.rect(0, 0, W, 4, 'F');
    doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    doc.text(inv.teacher || 'Profesor/a de canto', M, 22);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...mute);
    doc.text([inv.email, inv.ig ? '@' + inv.ig.replace(/^@/, '') : ''].filter(Boolean).join('   ·   '), M, 29);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(26); doc.setTextColor(...acc);
    doc.text(tt.inv, W - M, 22, { align: 'right' });
    doc.setFontSize(10); doc.setTextColor(...ink);
    doc.text(`${tt.no} ${inv.number}`, W - M, 29, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...mute);
    doc.text(`${tt.date}: ${fd(inv.issued)}`, W - M, 34, { align: 'right' });
    // destinatario y período
    let y = 46;
    const box = (x, lab, lines) => { doc.setFontSize(8); doc.setTextColor(...mute); doc.text(lab.toUpperCase(), x, y); doc.setFontSize(11); doc.setTextColor(...ink); doc.setFont('helvetica', 'bold'); doc.text(lines[0] || '—', x, y + 6); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(...mute); if (lines[1]) doc.text(lines[1], x, y + 11); };
    box(M, tt.to, [inv.billTo || inv.schoolName, inv.billTo ? [inv.schoolName !== inv.billTo ? inv.schoolName : '', inv.billToEmail].filter(Boolean).join(' · ') : inv.billToEmail]);
    box(140, tt.period, [per.charAt(0).toUpperCase() + per.slice(1), `${fd(inv.from)} - ${fd(inv.to)}`]);
    box(210, tt.lessons + ' / ' + tt.hours, [`${inv.lines.length}  ·  ${(Math.round(inv.minutes / 6) / 10).toLocaleString(inv.lang === 'en' ? 'en-US' : 'es-UY')} h`]);
    // tabla
    y = 68;
    const cols = [{ k: 'd', x: M, w: 30 }, { k: 'st', x: M + 30, w: 72 }, { k: 'c', x: M + 102, w: 78 }, { k: 'dur', x: M + 180, w: 26, r: 1 }, { k: 'rate', x: M + 206, w: 30, r: 1 }, { k: 'amt', x: W - M, w: 29, r: 1 }];
    const head = () => {
      doc.setFillColor(246, 243, 240); doc.rect(M - 3, y - 5.5, W - 2 * M + 6, 9, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...mute);
      cols.forEach(c => doc.text(tt[c.k].toUpperCase(), c.r ? (c.k === 'amt' ? c.x : c.x + c.w - 3) : c.x, y, { align: c.r ? 'right' : 'left' }));
      y += 9; doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(...ink);
    };
    head();
    inv.lines.forEach((ln, i) => {
      if (y > H - 30) { doc.addPage(); y = 20; head(); }
      const st = doc.splitTextToSize(ln.student || '—', cols[1].w - 4)[0];
      const cc = doc.splitTextToSize(ln.concept, cols[2].w - 4)[0];
      doc.setTextColor(...ink);
      doc.text(fd(ln.date), cols[0].x, y); doc.text(st, cols[1].x, y); doc.setTextColor(...mute); doc.text(cc, cols[2].x, y); doc.setTextColor(...ink);
      doc.text(fdur(ln.minutes), cols[3].x + cols[3].w - 3, y, { align: 'right' });
      doc.text(pdfMoney(ln.rate, inv.currency), cols[4].x + cols[4].w - 3, y, { align: 'right' });
      doc.text(pdfMoney(ln.amount, inv.currency), cols[5].x, y, { align: 'right' });
      doc.setDrawColor(...line); doc.setLineWidth(.2); doc.line(M - 3, y + 3, W - M + 3, y + 3);
      y += 8;
    });
    if (y > H - 34) { doc.addPage(); y = 24; }
    y += 4;
    doc.setFillColor(...ink); doc.roundedRect(W - M - 90, y - 6, 93, 15, 2, 2, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(tt.tot, W - M - 84, y + 3.2);
    doc.setFontSize(15); doc.text(pdfMoney(inv.total, inv.currency), W - M, y + 3.5, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...mute);
    if (inv.note) doc.text(doc.splitTextToSize(inv.note, 160), M, y);
    doc.text(tt.thanks, M, H - 12);
    const blob = doc.output('blob');
    await deliver(blob, `${inv.lang === 'en' ? 'Invoice' : 'Factura'} ${inv.number} - ${inv.schoolName} - ${per}.pdf`.replace(/[\\/:*?"<>|]/g, ''));
  } catch (e) {
    console.error(e);
    toast(e.message + '. Se abre una versión para imprimir.', 'err');
    printInvoice(inv);
  } finally { render(); }
}
// versión HTML para imprimir (por si no hay conexión para el generador de PDF)
function printInvoice(inv) {
  const tt = T[inv.lang] || T.es;
  const html = `<!doctype html><meta charset="utf-8"><title>${tt.inv} ${esc(inv.number)}</title><style>@page{size:A4 landscape;margin:14mm}body{font:12px -apple-system,Helvetica,sans-serif;color:#1c1b1f}h1{margin:0;font-size:22px}table{width:100%;border-collapse:collapse;margin-top:20px}th{text-align:left;font-size:10px;color:#777;text-transform:uppercase;background:#f6f3f0;padding:7px}td{padding:7px;border-bottom:1px solid #e4e2e6}.r{text-align:right}.top{display:flex;justify-content:space-between}.inv{color:#c48056;font-size:26px;font-weight:700;text-align:right}.tot{margin-top:16px;text-align:right;font-size:18px;font-weight:700}</style>
  <div class="top"><div><h1>${esc(inv.teacher || '')}</h1><div>${esc(inv.email || '')}</div></div><div><div class="inv">${tt.inv}</div><div class="r">${tt.no} ${esc(inv.number)} · ${esc(inv.issued)}</div></div></div>
  <p><b>${tt.to}:</b> ${esc(inv.billTo || inv.schoolName)} &nbsp; <b>${tt.period}:</b> ${inv.from} – ${inv.to}</p>
  <table><tr><th>${tt.d}</th><th>${tt.st}</th><th>${tt.c}</th><th class="r">${tt.dur}</th><th class="r">${tt.rate}</th><th class="r">${tt.amt}</th></tr>
  ${inv.lines.map(l => `<tr><td>${l.date}</td><td>${esc(l.student)}</td><td>${esc(l.concept)}</td><td class="r">${l.minutes} min</td><td class="r">${money(l.rate, inv.currency)}</td><td class="r">${money(l.amount, inv.currency)}</td></tr>`).join('')}</table>
  <div class="tot">${tt.tot}: ${money(inv.total, inv.currency)}</div><script>print()<\/script>`;
  const w = window.open('', '_blank'); if (w) { w.document.write(html); w.document.close(); }
}

/* ---------- exportar estadísticas ---------- */
ACT.exportMenu = async () => {
  const v = await ask('Exportar', 'Período: ' + rangeLabel(...statRange()), [{ label: 'Reporte PDF', val: 'pdf' }, { label: 'Planilla Excel', val: 'xls' }, { label: 'Cancelar', val: null, cls: 'ghost' }]);
  if (v === 'pdf') ACT.exportPdf(); else if (v === 'xls') ACT.exportXls();
};
function lessonRows(a, b, sid) {
  return occurrences(a, b).filter(l => !isEvent(l) && (!sid || l.schoolId === sid) && l.status !== 'scheduled').map(l => {
    const c = charge(l), sc = school(l.schoolId);
    return { Fecha: l.date, Inicio: l.start, Alumnos: (l.studentIds || []).map(i => sName(student(i))).join(', '), Escuela: sc.name, Modalidad: lessonMode(l) === 'group' ? 'Grupal' : 'Individual', Estado: STATUS[l.status].l, Minutos: c.minutes, 'Tarifa/h': c.rate, Importe: c.amount, Moneda: c.currency, Facturable: c.ok ? 'Sí' : 'No', Motivo: c.ok ? '' : c.why };
  });
}
ACT.exportXls = async () => {
  const [a, b] = statRange(), sid = UI.statSchool, rows = lessonRows(a, b, sid), s = summarize(a, b, sid);
  const name = `Tesitura ${a} a ${b}`;
  try {
    toast('Generando planilla…');
    await loadLib('xlsx');
    const wb = XLSX.utils.book_new();
    const res = [['Período', `${a} a ${b}`], ['Escuela', sid ? school(sid).name : 'Todas'], ['Clases realizadas', s.done], ['Horas trabajadas', Math.round(s.minutes / 6) / 10], ['Horas individuales', Math.round(s.minInd / 6) / 10], ['Horas grupales', Math.round(s.minGrp / 6) / 10], ['Ausencias', s.absent], ['Canceladas', s.cancelled], ...Object.entries(s.income).map(([c, v]) => ['Ingresos ' + c, v])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(res), 'Resumen');
    const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Fecha: 'Sin clases en el período' }]);
    ws['!cols'] = [12, 7, 28, 18, 11, 22, 9, 10, 10, 8, 11, 34].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, ws, 'Clases');
    const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    await deliver(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), name + '.xlsx');
  } catch (e) {
    // sin conexión: CSV, que también abre Excel
    const keys = Object.keys(rows[0] || { Fecha: '' });
    const csv = '﻿' + [keys.join(';'), ...rows.map(r => keys.map(k => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(';'))].join('\n');
    await deliver(new Blob([csv], { type: 'text/csv' }), name + '.csv');
    toast('Sin conexión: se exportó como CSV (se abre con Excel)');
  }
};
ACT.exportPdf = async () => {
  const [a, b] = statRange(), sid = UI.statSchool, s = summarize(a, b, sid), rows = lessonRows(a, b, sid);
  try {
    toast('Generando reporte…');
    await loadLib('jspdf');
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, M = 16; let y = 22;
    doc.setFillColor(196, 128, 86); doc.rect(0, 0, W, 4, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(28, 27, 31); doc.text('Reporte de actividad', M, y);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(120, 118, 126);
    doc.text(`${S.settings.teacher || ''}  ·  ${rangeLabel(a, b)}  ·  ${sid ? school(sid).name : 'Todas las escuelas'}`, M, y + 7);
    y += 20;
    const kpi = [['Ingresos', fmtMoneyMap(s.income).replace(/ /g, ' ')], ['Horas', fmtHours(s.minutes)], ['Clases realizadas', String(s.done)], ['Por hora', fmtMoneyMap(perHour(s.income, s.minutes), '—').replace(/ /g, ' ')], ['Individual', fmtHours(s.minInd)], ['Grupal', fmtHours(s.minGrp)]];
    kpi.forEach((k, i) => { const x = M + (i % 3) * 60, yy = y + Math.floor(i / 3) * 18; doc.setFontSize(8); doc.setTextColor(120, 118, 126); doc.text(k[0].toUpperCase(), x, yy); doc.setFontSize(13); doc.setTextColor(28, 27, 31); doc.setFont('helvetica', 'bold'); doc.text(doc.splitTextToSize(k[1], 56)[0], x, yy + 6); doc.setFont('helvetica', 'normal'); });
    y += 44;
    doc.setFontSize(8.5); doc.setTextColor(120, 118, 126);
    const cx = [M, M + 22, M + 34, M + 90, M + 118, M + 150, W - M];
    const head = () => { ['FECHA', 'HORA', 'ALUMNOS', 'MODALIDAD', 'ESTADO', 'MIN', 'IMPORTE'].forEach((h, i) => doc.text(h, cx[i], y, { align: i >= 5 ? 'right' : 'left' })); y += 6; doc.setTextColor(28, 27, 31); doc.setFontSize(9); };
    head();
    rows.forEach(r => {
      if (y > 282) { doc.addPage(); y = 20; doc.setFontSize(8.5); doc.setTextColor(120, 118, 126); head(); }
      doc.text(r.Fecha, cx[0], y); doc.text(r.Inicio, cx[1], y); doc.text(doc.splitTextToSize(r.Alumnos || '—', 54)[0], cx[2], y); doc.text(r.Modalidad, cx[3], y);
      doc.text(doc.splitTextToSize(r.Estado, 30)[0], cx[4], y); doc.text(String(r.Minutos), cx[5], y, { align: 'right' });
      doc.text(r.Facturable === 'Sí' ? pdfMoney(r.Importe, r.Moneda) : '—', cx[6], y, { align: 'right' });
      doc.setDrawColor(230, 228, 232); doc.line(M, y + 2, W - M, y + 2); y += 6.5;
    });
    if (!rows.length) doc.text('Sin clases en el período.', M, y);
    await deliver(doc.output('blob'), `Reporte ${a} a ${b}.pdf`);
  } catch (e) { toast(e.message, 'err'); }
};
