'use strict';
/* =========================================================
   Tesitura · inicio y calendario
   ========================================================= */
VIEWS.home = () => {
  const t = today(), ms = monthStart(t), me = monthEnd(t);
  const sum = summarize(ms, me);
  const proj = projection(me);
  const pend = pendingConfirm();
  const todays = occurrences(t, t);
  const up = occurrences(addDays(t, 1), addDays(t, 21)).filter(l => l.status === 'scheduled' && !isEvent(l)).slice(0, 6);
  const evs = occurrences(t, addDays(t, 60)).filter(l => isEvent(l) && (l.date > t || toMin(l.start) >= nowMin())).slice(0, 4);
  const active = S.students.filter(s => s.status === 'active').length;
  const h = new Date().getHours();
  const name = (S.settings.teacher || '').split(' ')[0];
  const nextL = todays.find(l => !isEvent(l) && l.status === 'scheduled' && toMin(l.start) >= nowMin() && toMin(l.start) - nowMin() <= 120);
  const projTxt = Object.values(proj).some(Boolean) ? moneyTotal(proj) : '';
  const multi = activeSchools().length > 1;
  // ¿hay un mes anterior sin facturar?
  const pm = monthStart(addMonths(t, -1));
  const toBill = multi || S.schools.some(s => s.billTo) ? activeSchools().filter(sc => !S.invoices.some(i => i.schoolId === sc.id && i.from === pm) && summarize(pm, monthEnd(pm), sc.id).lessons.some(l => charge(l).ok)) : [];
  return `${topbar((h < 12 ? 'Buen día' : h < 20 ? 'Buenas tardes' : 'Buenas noches') + (name ? ', ' + esc(name) : ''), {
    sub: fmtLong(t), right: `<button class="iconbtn" data-go="#/settings" aria-label="Configuración" data-sync="${syncState}" style="position:relative">${ic('gear')}${AUTH ? '<span class="syncdot" style="position:absolute;right:2px;top:2px"></span>' : ''}</button>`
  })}
    ${nextL ? `<button class="banner" style="width:100%;text-align:left" data-act="openLesson" data-id="${nextL.id}">${avatar(student(nextL.studentIds[0]))}<div class="grow"><div class="small" style="color:var(--acc);font-weight:600">En ${fmtDur(toMin(nextL.start) - nowMin())}</div><div style="font-weight:600" class="ell">${esc(lessonTitle(nextL))} · ${nextL.start}</div><div class="small muted">Tocá para ver el resumen antes de la clase</div></div>${ic('chevR', 'sm')}</button>` : ''}
    <div class="stats">
      <div class="stat hero"><div class="k">${ic('coin', 'sm')}Generado en ${MON_L[parseD(t).getMonth()]}</div><div class="v num">${moneyTotal(sum.income)}</div>${moneyDetail(sum.income) ? `<div class="h">${multi ? 'Convertido a pesos · ' + fxNote() : moneyDetail(sum.income)}</div>` : ''}
        ${multi ? `<div class="row wrap small muted" style="gap:4px 14px;margin-top:8px">${activeSchools().map(sc => { const x = summarize(ms, me, sc.id); return `<span class="row" style="gap:6px">${schoolDot(sc)}${esc(sc.name)} <b class="num" style="color:var(--tx);font-weight:600">${fmtMoneyMap(x.income, money(0, sc.currency))}</b></span>`; }).join('')}</div>` : ''}
        ${S.settings.projection && projTxt ? `<div class="proj">${ic('target', 'sm')}<span>Proyectado hasta fin de mes: <b class="num">+ ${projTxt}</b></span><span class="dim">(clases agendadas, aún no cuentan)</span></div>` : ''}</div>
      <div class="stat"><div class="k">${ic('clock', 'sm')}Horas dictadas</div><div class="v num">${fmtHours(sum.minutes)}</div><div class="h">${sum.minGrp ? fmtHours(sum.minInd) + ' ind. · ' + fmtHours(sum.minGrp) + ' grup.' : 'este mes'}</div></div>
      <div class="stat"><div class="k">${ic('check', 'sm')}Clases realizadas</div><div class="v num">${sum.done}</div><div class="h">${sum.absent + sum.cancelled ? `${sum.absent} aus. · ${sum.cancelled} canc.` : 'este mes'}</div></div>
      <div class="stat" style="grid-column:1/-1;display:flex;align-items:center;gap:12px;cursor:pointer" data-go="#/students"><div class="grow"><div class="k">${ic('users', 'sm')}Alumnos activos</div><div class="v num">${active}</div></div><div class="row" style="gap:0">${S.students.filter(s => s.status === 'active').slice(0, 5).map((s, i) => `<div style="margin-left:${i ? -10 : 0}px">${avatar(s, 'sm')}</div>`).join('')}</div>${ic('chevR', 'sm chev')}</div>
    </div>
    <div class="quick">
      <button data-act="newStudent">${ic('userplus', 'lg')}Alumno</button>
      <button data-act="newLesson">${ic('cal', 'lg')}Clase</button>
      <button data-act="quickRegister">${ic('edit', 'lg')}Registrar</button>
      <button data-act="newEvent">${ic('pin', 'lg')}Compromiso</button>
    </div>
    ${toBill.length ? `<div class="sec"><h2>Facturación</h2></div><div class="list">${toBill.map(sc => `<button class="li tap" data-act="goInvoice" data-id="${sc.id}" data-m="${pm}">${ic('file')}<div class="grow"><div class="t">Factura de ${MON_L[parseD(pm).getMonth()]} · ${esc(sc.name)}</div><div class="s">Lista para generar</div></div>${ic('chevR', 'sm chev')}</button>`).join('')}</div>` : ''}
    ${pend.length ? `<div class="sec"><h2>Por confirmar</h2><span class="small muted">${pend.length} clase${pend.length > 1 ? 's' : ''}</span></div>
      <div class="list">${pend.slice(-5).reverse().map(l => `<div class="li">${avatar(student(l.studentIds[0]), 'sm')}<button class="grow" style="text-align:left;min-width:0" data-act="openLesson" data-id="${l.id}"><div class="t ell">${esc(lessonTitle(l))}</div><div class="s">${fmtDate(l.date, { rel: 1, dow: 1 })} · ${l.start}</div></button>
        <div class="confirm-row"><button class="mini" data-act="quickSt" data-id="${l.id}" data-st="absent" aria-label="Ausente">Ausente</button><button class="mini ok" data-act="quickSt" data-id="${l.id}" data-st="done">${ic('check', 'sm')}Hecha</button></div></div>`).join('')}</div>
      ${pend.length > 5 ? `<div class="small muted" style="margin:8px 4px">Y ${pend.length - 5} más en el <a href="#/calendar">calendario</a>.</div>` : ''}` : ''}
    <div class="sec"><h2>Hoy</h2><a class="lnk" href="#/calendar" data-act="calToday">Ver agenda</a></div>
    ${todays.length ? `<div class="list">${todays.map(l => lessonRow(l, { showSched: false })).join('')}</div>` : `<div class="card small muted row">${ic('cal', 'sm')}No tenés clases hoy.</div>`}
    <div class="sec"><h2>Próximas clases</h2></div>
    ${up.length ? `<div class="list">${up.map(l => lessonRow(l, { date: 1 })).join('')}</div>` : `<div class="card small muted">No hay clases agendadas en las próximas semanas.</div>`}
    ${evs.length ? `<div class="sec"><h2>Próximos compromisos</h2></div><div class="list">${evs.map(l => lessonRow(l, { date: 1 })).join('')}</div>` : ''}
    ${!S.students.length ? `<div class="card" style="margin-top:20px"><div style="font-weight:600;margin-bottom:6px">Para empezar</div><div class="small muted" style="line-height:1.6">1. Revisá tus escuelas y tarifas en <a href="#/settings">Configuración</a>.<br>2. Agregá tus alumnos.<br>3. Agendá sus clases recurrentes (por ejemplo, todos los martes a las 16:00).<br>4. Después de cada clase, marcala como realizada y registrá lo trabajado.</div></div>` : ''}
    <div class="credit">Tesitura · ${esc(S.settings.teacher || 'Facundo Burgos')} · <a href="https://instagram.com/facuuuburgos" target="_blank" rel="noopener">@facuuuburgos</a></div>`;
};
ACT.newLesson = () => lessonForm();
ACT.newEvent = () => lessonForm({ kind: 'event' });
ACT.quickRegister = () => quickRegister();
ACT.quickSt = el => {
  const o = findOcc(el.dataset.id); if (!o) return;
  const l = setStatus(o, el.dataset.st); save(); render();
  toast(el.dataset.st === 'done' ? 'Marcada como realizada' : 'Marcada como ausente', '', el.dataset.st === 'done' ? { label: 'Registrar', fn: () => lessonSheet(l.id, { section: 'log' }) } : { label: 'Deshacer', fn: () => { setStatus(l, 'scheduled'); save(); render(); } });
};
ACT.calToday = () => { UI.calDate = today(); UI.calView = 'day'; go('#/calendar'); };
ACT.goInvoice = el => { UI.invSchool = el.dataset.id; UI.invMonth = el.dataset.m; go('#/invoices'); };

/* ---------- calendario ---------- */
VIEWS.calendar = () => {
  const v = UI.calView || S.settings.defView || 'week', d = UI.calDate;
  UI.calView = v;
  let ttl;
  if (v === 'day') ttl = fmtLong(d);
  else if (v === 'week') { const a = weekStart(d), b = addDays(a, 6); ttl = parseD(a).getMonth() === parseD(b).getMonth() ? `${parseD(a).getDate()}–${parseD(b).getDate()} ${MON_L[parseD(b).getMonth()]}` : `${fmtDate(a)} – ${fmtDate(b)}`; }
  else ttl = `${MON_L[parseD(d).getMonth()]} ${parseD(d).getFullYear()}`;
  return `${topbar('Calendario', { right: `<button class="iconbtn acc" data-act="newLesson" aria-label="Nueva clase">${ic('plus')}</button>` })}
    <div class="calbar"><div class="seg">${[['day', 'Día'], ['week', 'Semana'], ['month', 'Mes']].map(([k, l]) => `<button class="${v === k ? 'on' : ''}" data-act="calView" data-v="${k}">${l}</button>`).join('')}</div></div>
    <div class="calnav"><button class="iconbtn" data-act="calNav" data-n="-1" aria-label="Anterior">${ic('chevL', 'sm')}</button><div class="ttl center">${ttl}</div><button class="iconbtn" data-act="calNav" data-n="1" aria-label="Siguiente">${ic('chevR', 'sm')}</button>${d !== today() ? `<button class="btn sm" data-act="calNow">Hoy</button>` : ''}</div>
    <div id="calbody">${v === 'month' ? monthGrid(d) : timeGrid(v === 'day' ? [d] : [...Array(7)].map((_, i) => addDays(weekStart(d), i)))}</div>
    <div class="legend"><span><i class="dot" style="background:var(--acc)"></i>Individual</span><span><i class="dot" style="background:var(--grp)"></i>Grupal</span><span><i class="dot" style="background:var(--ev)"></i>Compromiso</span><span>✓ Realizada</span><span style="text-decoration:line-through">Cancelada</span></div>
    ${v === 'day' ? dayList(d) : ''}`;
};
function dayList(d) {
  const ls = occurrences(d, d);
  if (!ls.length) return '';
  const s = summarize(d, d);
  return `<div class="sec"><h2>Resumen del día</h2><span class="small muted">${ls.filter(l => !isEvent(l)).length} clases · ${fmtHours(ls.filter(l => !isEvent(l) && !OFF.includes(l.status)).reduce((a, l) => a + (+l.duration), 0))}${s.done ? ' · ' + fmtMoneyMap(s.income) : ''}</span></div><div class="list">${ls.map(l => lessonRow(l, { money: 1, showSched: true })).join('')}</div>`;
}
ACT.calView = el => { UI.calView = el.dataset.v; render(); };
ACT.calNav = el => {
  const n = +el.dataset.n, v = UI.calView;
  UI.calDate = v === 'day' ? addDays(UI.calDate, n) : v === 'week' ? addDays(UI.calDate, 7 * n) : addMonths(UI.calDate, n);
  render();
};
ACT.calNow = () => { UI.calDate = today(); render(); };
ACT.calDay = el => { UI.calDate = el.dataset.d; UI.calView = 'day'; render(); };

const PXM = () => UI.calView === 'day' ? 1.15 : 0.95; // píxeles por minuto
function gridRange(days, ls) {
  let a = toMin(S.settings.dayStart || '08:00'), b = toMin(S.settings.dayEnd || '22:00');
  (S.settings.hours || []).forEach(h => { if (days.some(d => dow(d) === +h.d)) { a = Math.min(a, toMin(h.start)); b = Math.max(b, toMin(h.end)); } });
  ls.forEach(l => { a = Math.min(a, toMin(l.start)); b = Math.max(b, toMin(l.start) + (+l.duration || 0)); });
  return [Math.floor(a / 60) * 60, Math.min(24 * 60, Math.ceil(b / 60) * 60)];
}
// ubica clases superpuestas en carriles para que no se tapen
function lanes(ls) {
  const items = ls.map(l => ({ l, a: toMin(l.start), b: toMin(l.start) + Math.max(+l.duration || 0, 20) })).sort((x, y) => x.a - y.a);
  let cluster = [], end = -1;
  const flush = () => { const ln = []; cluster.forEach(it => { let i = ln.findIndex(e => e <= it.a); if (i < 0) { i = ln.length; ln.push(0); } ln[i] = it.b; it.lane = i; }); cluster.forEach(it => it.n = ln.length); cluster = []; };
  items.forEach(it => { if (it.a >= end && cluster.length) flush(); cluster.push(it); end = Math.max(end, it.b); });
  if (cluster.length) flush();
  return items;
}
function weekLabel(l) {
  const narrow = window.innerWidth < 640;
  if (isEvent(l)) return narrow ? (l.title || '•').slice(0, 4) : l.title;
  const ids = l.studentIds || [], st = student(ids[0]);
  const base = narrow ? initials(st) : sShort(st);
  return base + (ids.length > 1 ? '+' + (ids.length - 1) : '');
}
function timeGrid(days) {
  const t = today(), all = occurrences(days[0], days[days.length - 1]);
  const [a, b] = gridRange(days, all), px = PXM(), H = (b - a) * px;
  const week = days.length > 1;
  const head = week ? `<div class="whead">${days.map(d => `<button class="${d === t ? 'today' : ''}" data-act="calDay" data-d="${d}">${DOW_S[dow(d)]}<b>${parseD(d).getDate()}</b></button>`).join('')}</div>` : '';
  const hours = [];
  for (let m = a; m < b; m += 60) hours.push(m);
  return `${head}<div class="tgrid" style="height:${H + 8}px" id="tgrid">
    <div class="hours">${hours.map(m => `<div style="top:${(m - a) * px + 4}px">${pad(m / 60)}${week ? '' : ':00'}</div>`).join('')}</div>
    <div class="cols">${days.map(d => {
    const ls = lanes(all.filter(l => l.date === d));
    const habit = (S.settings.hours || []).filter(h => +h.d === dow(d)).map(h => `<div class="habit" style="top:${(toMin(h.start) - a) * px + 4}px;height:${(toMin(h.end) - toMin(h.start)) * px}px"></div>`).join('');
    const nm = nowMin();
    return `<div class="col ${d === t ? 'today' : ''}" data-col="${d}">${habit}${hours.map(m => `<div class="hl" style="top:${(m - a) * px + 4}px"></div>`).join('')}
        ${d === t && nm >= a && nm <= b ? `<div class="nowl" style="top:${(nm - a) * px + 4}px"></div>` : ''}
        ${ls.map(({ l, a: s, b: e, lane, n }) => {
      const m = isEvent(l) ? 'event' : lessonMode(l), w = 100 / n;
      const cls = [m, OFF.includes(l.status) ? 'off' : '', l.status === 'done' ? 'done' : '', l.status === 'absent' ? 'absent off' : ''].join(' ');
      const hgt = Math.max((+l.duration || 0) * px - 2, 20);
      return `<button class="ev ${cls}" data-act="openLesson" data-id="${l.id}" style="top:${(s - a) * px + 5}px;height:${hgt}px;left:calc(${lane * w}% + 2px);width:calc(${w}% - 4px);right:auto">
            <b>${esc(week ? weekLabel(l) : lessonTitle(l))}</b>${hgt > 34 ? `<span>${l.start}${week ? '' : '–' + lessonEnd(l)}</span>` : ''}${!week && hgt > 50 && l.notes ? `<span style="display:block" class="ell">${esc(l.notes)}</span>` : ''}</button>`;
    }).join('')}</div>`;
  }).join('')}</div></div>`;
}
function monthGrid(d) {
  const t = today(), ms = monthStart(d), me = monthEnd(d);
  const a = weekStart(ms); let b = addDays(weekStart(me), 6);
  const all = occurrences(a, b);
  const cells = [];
  for (let x = a; x <= b; x = addDays(x, 1)) cells.push(x);
  const ws = S.settings.weekStart ?? 1;
  return `<div class="mgrid">${[...Array(7)].map((_, i) => `<div class="dh">${DOW_S[(i + ws) % 7]}</div>`).join('')}
    ${cells.map(x => {
    const ls = all.filter(l => l.date === x);
    return `<button class="md ${x.slice(0, 7) !== ms.slice(0, 7) ? 'out' : ''} ${x === t ? 'today' : ''}" data-act="calDay" data-d="${x}"><span class="n">${parseD(x).getDate()}</span>
        ${ls.slice(0, 3).map(l => `<span class="e ${isEvent(l) ? 'event' : lessonMode(l)} ${OFF.includes(l.status) || l.status === 'absent' ? 'off' : ''}">${l.status === 'done' ? '✓' : ''}${esc(lessonTitle(l).split(' ')[0])}</span>`).join('')}
        ${ls.length > 3 ? `<span class="more">+${ls.length - 3}</span>` : ''}</button>`;
  }).join('')}</div>
  ${(() => { const s = summarize(ms, me); return `<div class="small muted" style="margin:10px 4px 0">En ${MON_L[parseD(d).getMonth()]}: ${s.done} realizadas · ${fmtHours(s.minutes)} · ${fmtMoneyMap(s.income)}${s.scheduled ? ` · ${s.scheduled} programadas` : ''}</div>`; })()}`;
}
AFTER.calendar = m => {
  // tocar un espacio libre crea una clase en ese horario
  m.querySelectorAll('[data-col]').forEach(col => col.addEventListener('click', e => {
    if (e.target.closest('.ev')) return;
    const days = [col.dataset.col], all = occurrences(days[0], days[0]);
    const r = col.getBoundingClientRect();
    const grid = $('#tgrid'), cols = $$('[data-col]', grid);
    const allDays = cols.map(c => c.dataset.col);
    const [a] = gridRange(allDays, occurrences(allDays[0], allDays[allDays.length - 1]));
    const min = Math.round(((e.clientY - r.top - 4) / PXM() + a) / 15) * 15;
    lessonForm({ date: col.dataset.col, start: fromMin(Math.max(0, Math.min(min, 23 * 60))) });
  }));
  // deslizar para cambiar de día/semana/mes
  const body = m.querySelector('#calbody'); let x0 = null, y0 = 0;
  body.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
  body.addEventListener('touchend', e => {
    if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) ACT.calNav({ dataset: { n: dx < 0 ? 1 : -1 } });
  });
  // en vista día/semana, arranca mostrando la hora actual
  if (UI.calView !== 'month' && !UI._scrolled) {
    UI._scrolled = true;
    const nl = m.querySelector('.nowl'); if (nl) setTimeout(() => nl.scrollIntoView({ block: 'center' }), 50);
  }
};
