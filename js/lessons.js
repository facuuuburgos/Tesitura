'use strict';
/* =========================================================
   Tesitura · clases: ficha de clase, registro, alta/edición, reposiciones
   ========================================================= */
const OFF = ['cancel_student', 'cancel_teacher', 'rescheduled', 'closed'];
function lessonRow(l, o = {}) {
  const m = isEvent(l) ? 'event' : lessonMode(l), sc = school(l.schoolId), st = STATUS[stOf(l)] || STATUS.scheduled;
  const c = !isEvent(l) && o.money ? charge(l) : null;
  return `<button class="li lesson ${m} ${OFF.includes(stOf(l)) ? 'is-off' : ''}" data-act="openLesson" data-id="${l.id}">
    <div class="time"><b>${l.start}</b><span>${lessonEnd(l)}</span></div><div class="bar"></div>
    <div class="bd"><div class="t ell">${esc(lessonTitle(l))}</div>
      <div class="meta">${o.date ? `<span>${fmtDate(l.date, { rel: 1, dow: 1 })}</span>·` : ''}${activeSchools().length > 1 && !isEvent(l) ? `${schoolDot(sc)}<span class="ell">${esc(sc.name)}</span>·` : ''}<span>${fmtDur(l.duration)}</span>${l.seriesId ? ic('repeat', 'sm') : ''}${l.makeupOf ? '<span>· reposición</span>' : ''}</div></div>
    ${isEvent(l) ? '<span class="pill event">Compromiso</span>' : (stOf(l) === 'scheduled' && !o.showSched ? (m === 'group' ? '<span class="pill group">Grupal</span>' : '') : `<span class="pill ${st.c}">${st.s}</span>`)}
    ${c && c.ok ? `<span class="pill money num">${money(c.amount, c.currency)}</span>` : ''}
  </button>`;
}
ACT.openLesson = el => lessonSheet(el.dataset.id);

/* ---------- ficha de clase: contexto rápido + estado + registro ---------- */
function lessonSheet(id, o = {}) {
  let cur = findOcc(id);
  if (!cur) { toast('No se encontró la clase', 'err'); return; }
  const state = { tab: o.student || (cur.studentIds || [])[0] || null, section: o.section || 'ctx' };
  const refresh = () => { cur = findOcc(cur.id) || cur; };
  const sh = openSheet({
    wide: true,
    title: () => esc(lessonTitle(cur)),
    body: () => {
      refresh();
      if (isEvent(cur)) return eventBody(cur);
      const sc = school(cur.schoolId), c = charge(cur), m = lessonMode(cur);
      const makeups = S.lessons.filter(x => x.makeupOf && x.makeupOf === cur.id);
      const orig = cur.makeupOf ? lessonById(cur.makeupOf) : null;
      const sids = cur.studentIds || [];
      return `<div class="row wrap small muted" style="gap:6px;margin:-6px 0 14px">
          <span>${fmtLong(cur.date)}</span>·<span class="num">${cur.start}–${lessonEnd(cur)}</span>·
          <span class="pill ${m}">${m === 'group' ? 'Grupal' : 'Individual'}</span>
          ${activeSchools().length > 1 ? `<span class="row" style="gap:5px">${schoolDot(sc)}${esc(sc.name)}</span>` : ''}
          ${cur.seriesId ? `<span class="row" style="gap:4px">${ic('repeat', 'sm')}Recurrente</span>` : ''}
        </div>
        <div class="grid3" style="grid-template-columns:repeat(3,1fr)">
          ${[['done', 'Realizada', 'check'], ['absent', 'Ausente', 'x'], ['cancel_student', 'Canceló alumno', 'undo'], ['cancel_teacher', 'Cancelé yo', 'undo'], ['rescheduled', 'Reprogramar', 'shift'], ['scheduled', 'Programada', 'clock']]
          .map(([k, l, i]) => `<button class="btn sm ${cur.status === k ? (k === 'done' ? 'pri' : '') : 'ghost'}" style="${cur.status === k && k !== 'done' ? 'background:var(--card2);border-color:var(--line2)' : 'border:1px solid var(--line)'};height:44px;font-size:13px;padding:0 6px" data-st="${k}">${ic(i, 'sm')}${l}</button>`).join('')}
        </div>
        ${cur.status === 'done' ? `<div class="row" style="margin-top:12px"><div class="grow small muted">Duración dictada</div>
          <div class="stepper" style="width:180px;height:40px"><button data-dur="-5">−</button><div class="val small">${fmtDur(+cur.realDur || +cur.duration)}</div><button data-dur="5">+</button></div></div>` : ''}
        <div class="infobox" style="margin-top:12px">${ic('coin', 'sm')}<div class="grow">${c.ok ? `Genera <b style="color:var(--tx)">${money(c.amount, c.currency)}</b> · ${fmtDur(c.minutes)} a ${money(c.rate, c.currency)}/h` : (cur.status === 'scheduled' ? `Si se realiza genera ${money(rateAt(sc, cur.date, m) * cur.duration / 60, sc.currency)}` : esc(c.why || 'No genera ingresos'))}</div></div>
        ${(() => { const cl = closureOf(cur); return cl && cur.status === 'scheduled' ? `<div class="warnbox" style="margin-top:8px">${ic('school', 'sm')}<div class="grow">Día sin clases en ${esc(sc.name)}${cl.reason ? ' · ' + esc(cl.reason) : ''}. ${cl.charged ? 'Se cobra igual.' : 'No se cobra.'}</div><button class="mini" data-closure="${cl.id}">Ver</button></div>` : ''; })()}
        ${orig ? `<div class="infobox" style="margin-top:8px">${ic('shift', 'sm')}<div class="grow">Reposición de la clase del ${fmtDate(orig.date, { dow: 1 })} (${STATUS[orig.status].s.toLowerCase()})</div><button class="mini" data-open="${orig.id}">Ver</button></div>` : ''}
        ${makeups.map(x => `<div class="infobox" style="margin-top:8px">${ic('shift', 'sm')}<div class="grow">Reposición: ${fmtDate(x.date, { dow: 1 })} ${x.start} · ${STATUS[x.status].s}</div><button class="mini" data-open="${x.id}">Ver</button></div>`).join('')}
        ${['absent', 'cancel_student', 'cancel_teacher'].includes(cur.status) && !makeups.length ? `<button class="btn sm full" style="margin-top:8px" data-makeup>${ic('shift', 'sm')}Agendar reposición</button>` : ''}
        ${cur.notes ? `<div class="small muted" style="margin-top:12px;white-space:pre-wrap">${esc(cur.notes)}</div>` : ''}

        ${sids.length > 1 ? `<div class="chips" style="margin-top:20px">${sids.map(s => `<button class="chip ${state.tab === s ? 'on' : ''}" data-tab="${s}">${esc(sShort(student(s)))}</button>`).join('')}</div>` : ''}
        ${state.tab ? `<div class="seg" style="margin-top:${sids.length > 1 ? 10 : 20}px"><button class="${state.section === 'ctx' ? 'on' : ''}" data-sec="ctx">Antes de la clase</button><button class="${state.section === 'log' ? 'on' : ''}" data-sec="log">Registro${S.lessonNotes.some(n => n.lessonId === cur.id && n.studentId === state.tab) ? ' ✓' : ''}</button></div>
        <div style="margin-top:14px">${state.section === 'ctx' ? contextHtml(state.tab, cur) : logForm(state.tab, cur)}</div>` : ''}
        <div class="btns"><button class="btn sm" data-edit>${ic('edit', 'sm')}Editar</button><button class="btn sm danger" data-del>${ic('trash', 'sm')}Eliminar</button></div>`;
    },
    mount: (el, sh) => {
      el.querySelectorAll('[data-st]').forEach(b => b.onclick = () => {
        const k = b.dataset.st;
        if (k === 'rescheduled') { rescheduleSheet(cur, true); return; }
        const prev = cur.status;
        cur = setStatus(cur, k); save(); sh.render(); render();
        if (k !== prev && k === 'done' && !S.lessonNotes.some(n => n.lessonId === cur.id)) { state.section = 'log'; sh.render(); }
        toast(STATUS[k].l, '', prev !== k ? { label: 'Deshacer', fn: () => { cur = setStatus(cur, prev); save(); sh.render(); render(); } } : null);
      });
      el.querySelectorAll('[data-dur]').forEach(b => b.onclick = () => {
        const v = Math.max(5, (+cur.realDur || +cur.duration) + +b.dataset.dur);
        cur.realDur = v; upsert('lessons', cur); save(); sh.render(); render();
      });
      el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { state.tab = b.dataset.tab; sh.render(); });
      el.querySelectorAll('[data-sec]').forEach(b => b.onclick = () => { state.section = b.dataset.sec; sh.render(); });
      el.querySelectorAll('[data-open]').forEach(b => b.onclick = () => { sh.close(); setTimeout(() => lessonSheet(b.dataset.open), 200); });
      el.querySelectorAll('[data-closure]').forEach(b => b.onclick = () => closureForm(byId('closures', b.dataset.closure)));
      const mk = el.querySelector('[data-makeup]'); if (mk) mk.onclick = () => rescheduleSheet(cur, false);
      el.querySelector('[data-edit]').onclick = () => { sh.close(); setTimeout(() => lessonForm({ occ: cur }), 200); };
      el.querySelector('[data-del]').onclick = () => deleteLesson(cur, sh);
      el.querySelectorAll('[data-goprof]').forEach(b => b.onclick = () => { closeAll(); go('#/student/' + b.dataset.goprof); });
      const f = el.querySelector('form.logf');
      if (f) {
        f.querySelectorAll('[data-song]').forEach(b => b.onclick = e => { e.preventDefault(); b.classList.toggle('on'); });
        f.onsubmit = e => {
          e.preventDefault();
          const songs = $$('[data-song].on', f).map(b => b.dataset.song);
          const get = n => fval(f, n);
          const data = { exercises: get('exercises'), technique: get('technique'), difficulties: get('difficulties'), progress: get('progress'), nextGoals: get('nextGoals'), notes: get('notes') };
          if (!songs.length && !Object.values(data).some(Boolean)) return toast('Escribí algo antes de guardar', 'err');
          if (cur.virtual) cur = materialize(cur);
          const ex = S.lessonNotes.find(n => n.lessonId === cur.id && n.studentId === state.tab);
          upsert('lessonNotes', Object.assign(ex || { id: uid() }, { lessonId: cur.id, studentId: state.tab, date: cur.date, songs }, data));
          let msg = 'Registro guardado';
          if (cur.status === 'scheduled') { cur = setStatus(cur, 'done'); msg += ' · clase marcada como realizada'; }
          save(); toast(msg); sh.render(); render();
          // si es grupal, pasa al siguiente alumno sin registro
          const next = (cur.studentIds || []).find(s => !S.lessonNotes.some(n => n.lessonId === cur.id && n.studentId === s));
          if (next) { state.tab = next; sh.render(); }
        };
      }
    }
  });
  return sh;
}
function eventBody(l) {
  return `<div class="row wrap small muted" style="gap:6px;margin:-6px 0 14px"><span>${fmtLong(l.date)}</span>·<span class="num">${l.start}–${lessonEnd(l)}</span>·<span class="pill event">Compromiso</span>${l.seriesId ? ic('repeat', 'sm') : ''}</div>
    ${l.notes ? `<div class="card" style="white-space:pre-wrap">${esc(l.notes)}</div>` : '<div class="muted small">Sin notas</div>'}
    <div class="btns"><button class="btn sm" data-edit>${ic('edit', 'sm')}Editar</button><button class="btn sm danger" data-del>${ic('trash', 'sm')}Eliminar</button></div>`;
}
function contextHtml(sid, l, o = {}) {
  const cx = studentContext(sid, l && l.date), st = cx.st;
  if (!st) return '<div class="muted">Alumno eliminado</div>';
  const log = cx.lastLog;
  const blk = (lab, txt) => txt ? `<div class="blk"><div class="lab">${lab}</div><div class="txt">${esc(txt)}</div></div>` : '';
  const prevLogs = cx.logs.filter(n => !l || n.lessonId !== l.id);
  const last = prevLogs[0];
  return `<div class="ctx">
    ${o.noHead ? '' : `<div class="row">${avatar(st)}<div class="grow"><div style="font-weight:600">${esc(sName(st))}</div><div class="small muted">${cx.lastLesson ? 'Última clase: ' + fmtDate(cx.lastLesson.date, { rel: 1, dow: 1 }) : 'Sin clases anteriores'}${st.voiceType ? ' · ' + esc(st.voiceType) : ''}${rangeTxt(st) ? ' · ' + rangeTxt(st) : ''}</div></div><button class="mini" data-goprof="${st.id}">Perfil</button></div>`}
    ${cx.songs.length ? `<div class="blk"><div class="lab">Canciones en curso</div><div class="list">${cx.songs.map(ss => songRowMini(ss)).join('')}</div></div>` : ''}
    ${last ? `${blk('La clase pasada (' + fmtDate(last.date) + ')', [last.technique && 'Técnica: ' + last.technique, last.exercises && 'Ejercicios: ' + last.exercises, (last.songs || []).length && 'Canciones: ' + last.songs.map(id => { const ss = byId('studentSongs', id); const sg = ss && byId('songs', ss.songId); return sg ? sg.title : ''; }).filter(Boolean).join(', ')].filter(Boolean).join('\n'))}
      ${blk('Dificultades pendientes', last.difficulties)}${blk('Objetivos para esta clase', last.nextGoals)}${blk('Avances', last.progress)}${blk('Observaciones de esa clase', last.notes)}` : ''}
    ${!last && st.difficulties ? blk('Dificultades identificadas', st.difficulties) : ''}
    ${st.goals ? blk('Objetivos personales', st.goals) : ''}
    ${(() => { const gn = S.vocalNotes.filter(n => n.studentId === sid).sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date)).slice(0, 2); return gn.map(n => blk('Nota general' + (n.pinned ? ' · fijada' : '') + (n.title ? ' · ' + n.title : ''), n.text)).join(''); })()}
    ${st.observations ? blk('Observaciones', st.observations) : ''}
    ${!last && !cx.songs.length && !st.goals && !st.observations ? '<div class="muted small">Todavía no hay información pedagógica de este alumno. Después de la clase, registrá lo trabajado en la pestaña Registro.</div>' : ''}
  </div>`;
}
function songRowMini(ss) {
  const sg = byId('songs', ss.songId) || {}, wk = workKey(ss);
  return `<div class="li" style="min-height:48px;padding:8px 12px"><div class="keytag" style="min-width:42px;height:40px;font-size:15px">${keyName(wk)}</div><div class="grow"><div class="t ell">${esc(sg.title || '¿?')}</div><div class="s ell">${esc(sg.artist || '')}${sg.key ? ` · orig. ${keyName(sg.key)} (${fmtSemis(ss.manual && ss.workKey ? semisBetween(sg.key.pc, ss.workKey.pc) : (ss.transpose || 0))})` : ''}</div></div>${ss.link ? `<a class="mini" href="${esc(ss.link)}" target="_blank" rel="noopener">${ic('play', 'sm')}</a>` : ''}${ss.karaoke ? `<a class="mini" href="${esc(ss.karaoke)}" target="_blank" rel="noopener">${ic('mic', 'sm')}</a>` : ''}</div>`;
}
function logForm(sid, l) {
  const ex = S.lessonNotes.find(n => n.lessonId === l.id && n.studentId === sid) || {};
  const songs = S.studentSongs.filter(x => x.studentId === sid && (!x.endedAt || (ex.songs || []).includes(x.id)));
  return `<form class="logf">
    ${songs.length ? `<label class="field"><span>Canciones trabajadas</span><div class="chips" style="flex-wrap:wrap">${songs.map(ss => { const sg = byId('songs', ss.songId) || {}; return `<button type="button" class="chip acc ${(ex.songs || []).includes(ss.id) ? 'on' : ''}" data-song="${ss.id}">${esc(sg.title)} · ${keyName(workKey(ss))}</button>`; }).join('')}</div></label>` : ''}
    ${field('Ejercicios realizados', txa('exercises', ex.exercises, 'Ej: sirenas, lip trills, escalas en "u"…', 2))}
    ${field('Técnica vocal trabajada', txa('technique', ex.technique, 'Ej: apoyo, registro mixto, resonancia…', 2))}
    ${field('Dificultades observadas', txa('difficulties', ex.difficulties, '', 2))}
    ${field('Avances identificados', txa('progress', ex.progress, '', 2))}
    ${field('Objetivos para la próxima clase', txa('nextGoals', ex.nextGoals, '', 2))}
    ${field('Observaciones', txa('notes', ex.notes, '', 2))}
    <button class="btn pri full" type="submit">${ic('check', 'sm')}Guardar registro</button>
  </form>`;
}

/* ---------- eliminar ---------- */
async function deleteLesson(l, sh) {
  if (l.seriesId && seriesById(l.seriesId)) {
    const v = await ask('Eliminar clase recurrente', 'Esta clase forma parte de una serie.', [
      { label: 'Solo esta clase', val: 'one', cls: 'danger' }, { label: 'Esta y las siguientes', val: 'next', cls: 'danger' }, { label: 'Cancelar', val: null, cls: 'ghost' }]);
    if (!v) return;
    const s = seriesById(l.seriesId), D = l.seriesDate || l.date;
    if (v === 'one') {
      s.skip = [...new Set([...(s.skip || []), D])]; upsert('series', s);
      if (!l.virtual) { removeRec('lessons', l.id); dropLogs(l.id); }
    } else endSeriesAt(s, D);
  } else {
    const logs = S.lessonNotes.filter(n => n.lessonId === l.id).length;
    if (!(await confirmDel('¿Eliminar esta ' + (isEvent(l) ? 'actividad' : 'clase') + '?', logs ? 'También se borrará su registro pedagógico. No se puede deshacer.' : 'No se puede deshacer.'))) return;
    removeRec('lessons', l.id); dropLogs(l.id);
    S.lessons.filter(x => x.makeupOf === l.id).forEach(x => { delete x.makeupOf; upsert('lessons', x); });
  }
  save(); if (sh) sh.close(); render(); toast('Eliminada');
}
const dropLogs = lid => S.lessonNotes.filter(n => n.lessonId === lid).forEach(n => removeRec('lessonNotes', n.id));
// corta una serie el día anterior a D; borra las clases futuras sin estado
function endSeriesAt(s, D) {
  S.lessons.filter(x => x.seriesId === s.id && x.seriesDate >= D && x.status === 'scheduled' && !S.lessonNotes.some(n => n.lessonId === x.id)).forEach(x => removeRec('lessons', x.id));
  const until = addDays(D, -1);
  if (until < s.from) removeRec('series', s.id);
  else { s.until = until; upsert('series', s); }
}

/* ---------- reprogramar / reposición ---------- */
function rescheduleSheet(l, isResched) {
  const sh = openSheet({
    title: isResched ? 'Reprogramar clase' : 'Agendar reposición',
    body: () => `<div class="muted small" style="margin:-4px 0 14px">${esc(lessonTitle(l))} · original: ${fmtDate(l.date, { dow: 1 })} ${l.start}</div>
      <div class="grid2">${field('Nueva fecha', inp('date', l.date < today() ? today() : l.date, { type: 'date' }))}${field('Hora', inp('start', l.start, { type: 'time' }))}</div>
      ${field('Duración (min)', inp('duration', l.duration, { type: 'number', attrs: 'min="5" step="5" inputmode="numeric"' }))}
      <div class="hint">${isResched ? 'La clase original queda como “reprogramada” y no se cuenta. Se cobra la reposición cuando se realice.' : 'La reposición queda vinculada a la clase original. Si la original ya se cobró, la reposición no se cobra otra vez (salvo que lo configures en la escuela).'}</div>
      <button class="btn pri full" data-save>${ic('check', 'sm')}Guardar</button>`,
    mount: (el, sh) => {
      el.querySelector('[data-save]').onclick = () => {
        const date = fval(el, 'date'), start = fval(el, 'start'), duration = +fval(el, 'duration');
        if (!date) return ferr(el, 'date', 'Elegí la fecha');
        if (!start) return ferr(el, 'start', 'Elegí la hora');
        if (!(duration >= 5)) return ferr(el, 'duration', 'Duración inválida');
        let orig = materialize(l);
        const nl = upsert('lessons', { id: uid(), kind: 'lesson', date, start, duration, studentIds: [...orig.studentIds], schoolId: orig.schoolId, mode: orig.mode || '', status: 'scheduled', notes: '', makeupOf: orig.id });
        if (isResched) orig = setStatus(orig, 'rescheduled');
        save(); closeAll(); render();
        overlapWarn(nl);
        toast(isResched ? 'Clase reprogramada para el ' + fmtDate(date, { dow: 1 }) : 'Reposición agendada');
      };
    }
  });
}
// aviso suave si a esa hora ya hay otra clase (no bloquea nada)
function overlapWarn(l) {
  if (!l || OFF.includes(stOf(l))) return;
  const a = toMin(l.start), b = a + (+l.duration || 0);
  const same = x => x.id === l.id || (l.seriesId && x.seriesId === l.seriesId && x.seriesDate === (l.seriesDate || l.date)) || (l.makeupOf && x.id === l.makeupOf);
  const o = occurrences(l.date, l.date).find(x => !same(x) && !OFF.includes(stOf(x)) && toMin(x.start) < b && toMin(x.start) + (+x.duration || 0) > a);
  if (o) setTimeout(() => toast(`Ojo: a esa hora también tenés ${lessonTitle(o)} (${o.start})`), 2700);
}

/* ---------- alta y edición ---------- */
function lessonForm(o = {}) {
  const occ = o.occ ? findOcc(o.occ.id) || o.occ : null;
  const ser = occ && occ.seriesId ? seriesById(occ.seriesId) : null;
  const t = today();
  const dflt = () => { const m = Math.ceil(nowMin() / 30) * 30; return fromMin(Math.min(m, 22 * 60)); };
  const F = {
    kind: occ ? (occ.kind || 'lesson') : (o.kind || 'lesson'), title: occ ? occ.title || '' : '',
    studentIds: occ ? [...(occ.studentIds || [])] : (o.studentIds || []),
    schoolId: occ ? occ.schoolId : (o.schoolId || (o.studentIds && student(o.studentIds[0]) ? student(o.studentIds[0]).schoolId : (activeSchools()[0] || {}).id)),
    mode: occ ? occ.mode || '' : '', date: occ ? occ.date : (o.date || t), start: occ ? occ.start : (o.start || dflt()),
    duration: occ ? +occ.duration : (+S.settings.defDur || 60), notes: occ ? occ.notes || '' : '',
    repeat: ser ? (+ser.interval || 1) : 0, days: ser ? [...ser.days] : null, until: ser ? ser.until || '' : '', markDone: !!o.markDone, q: ''
  };
  const poolHtml = () => {
    const q = norm(F.q);
    const pool = S.students.filter(s => s.status !== 'inactive' && !F.studentIds.includes(s.id) && (!q || norm(sName(s)).includes(q))).sort((a, b) => sName(a).localeCompare(sName(b))).slice(0, q ? 20 : 8);
    return pool.map(s => `<button type="button" class="chip" data-add="${s.id}">${ic('plus', 'sm')}${esc(sName(s))}</button>`).join('')
      + (!S.students.length ? '<span class="small muted">Todavía no tenés alumnos. <a href="#" data-newstu>Crear uno</a></span>' : '')
      + (q && !pool.length ? `<button type="button" class="chip" data-newstu>${ic('userplus', 'sm')}Crear “${esc(F.q.trim())}”</button>` : '');
  };
  const sh = openSheet({
    wide: true,
    title: occ ? (isEvent(occ) ? 'Editar compromiso' : 'Editar clase') : 'Nueva',
    body: () => {
      const days = F.days || [dow(F.date)];
      const selected = F.studentIds.map(id => student(id)).filter(Boolean);
      const autoMode = F.studentIds.length > 1 ? 'group' : 'ind';
      return `${occ ? '' : `<div class="seg" style="margin-bottom:16px"><button data-kind="lesson" class="${F.kind === 'lesson' ? 'on' : ''}">Clase</button><button data-kind="event" class="${F.kind === 'event' ? 'on' : ''}">Compromiso</button></div>`}
      ${F.kind === 'event' ? field('Título', inp('title', F.title, { ph: 'Ej: Recital, reunión, ensayo…' })) : `
        <label class="field"><span>Alumno${F.studentIds.length > 1 ? 's' : ''}</span>
          ${selected.length ? `<div class="chips" style="flex-wrap:wrap;margin-bottom:8px">${selected.map(s => `<button type="button" class="chip on" data-rm="${s.id}">${esc(sName(s))} ${ic('x', 'sm')}</button>`).join('')}</div>` : ''}
          <div class="search">${ic('search', 'sm')}<input class="inp" name="q" type="search" value="${esc(F.q)}" placeholder="${selected.length ? 'Agregar otro alumno (clase grupal)' : 'Buscar alumno'}" autocomplete="off" autocorrect="off"></div>
          <div class="chips" style="flex-wrap:wrap;margin-top:8px" data-pool>${poolHtml()}</div>
        </label>
        <div class="grid2">
          ${activeSchools().length > 1 || (F.schoolId && school(F.schoolId).archived) ? field('Escuela', sel('schoolId', F.schoolId, S.schools.filter(s => !s.archived || s.id === F.schoolId).map(s => [s.id, s.name]))) : ''}
          ${field('Modalidad', sel('mode', F.mode, [['', 'Automática (' + (autoMode === 'group' ? 'grupal' : 'individual') + ')'], ['ind', 'Individual'], ['group', 'Grupal']]))}
        </div>`}
      <div class="grid2">${field('Fecha', inp('date', F.date, { type: 'date' }))}${field('Inicio', inp('start', F.start, { type: 'time' }))}</div>
      <div class="grid2">${field('Fin', inp('end', fromMin(toMin(F.start) + F.duration), { type: 'time' }))}${field('Duración (min)', inp('duration', F.duration, { type: 'number', attrs: 'min="5" step="5" inputmode="numeric"' }))}</div>
      <div class="chips" style="margin:-4px 0 14px">${[30, 45, 60, 90].map(m => `<button type="button" class="chip ${F.duration === m ? 'on' : ''}" data-dur="${m}">${m} min</button>`).join('')}</div>
      ${field('Repetir', sel('repeat', F.repeat, [[0, 'No se repite'], [1, 'Cada semana'], [2, 'Cada 2 semanas'], [4, 'Cada 4 semanas']]))}
      ${F.repeat ? `<label class="field"><span>Días</span><div class="chips">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button type="button" class="chip acc ${days.includes(d) ? 'on' : ''}" data-day="${d}">${DOW_S[d]}</button>`).join('')}</div></label>
        ${field('Hasta (opcional)', inp('until', F.until, { type: 'date' }), 'Si lo dejás vacío, se repite sin fecha de fin.')}` : ''}
      ${!occ && !F.repeat && F.kind === 'lesson' ? `<div class="list" style="margin-bottom:12px">${sw('markDone', F.markDone, 'Ya se realizó', 'Marcarla como realizada al guardar')}</div>` : ''}
      ${field('Observaciones', txa('notes', F.notes, '', 2))}
      <button class="btn pri full" data-save>${ic('check', 'sm')}${occ ? 'Guardar cambios' : 'Crear'}</button>`;
    },
    mount: (el, sh) => {
      const grab = () => { // conserva lo escrito antes de redibujar
        ['title', 'date', 'start', 'notes', 'until'].forEach(n => { const v = fval(el, n); if (v !== undefined) F[n] = v; });
        const qi = el.querySelector('[name=q]'); if (qi) F.q = qi.value;
        const sc = fval(el, 'schoolId'); if (sc !== undefined) F.schoolId = sc;
        const m = fval(el, 'mode'); if (m !== undefined) F.mode = m;
        const d = +fval(el, 'duration'); if (d) F.duration = d;
        const r = fval(el, 'repeat'); if (r !== undefined) F.repeat = +r;
        const md = fval(el, 'markDone'); if (md !== undefined) F.markDone = md;
      };
      const rr = () => { grab(); sh.render(); };
      el.querySelectorAll('[data-kind]').forEach(b => b.onclick = () => { grab(); F.kind = b.dataset.kind; sh.render(); });
      const bindPool = () => {
        el.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
          grab(); F.studentIds.push(b.dataset.add); F.q = '';
          if (F.studentIds.length === 1) { const s = student(b.dataset.add); if (s && s.schoolId && byId('schools', s.schoolId)) F.schoolId = s.schoolId; }
          sh.render();
        });
        el.querySelectorAll('[data-newstu]').forEach(b => b.onclick = e => { e.preventDefault(); grab(); studentForm(null, { first: F.q.trim(), onSave: s => { F.studentIds.push(s.id); F.q = ''; if (F.studentIds.length === 1) F.schoolId = s.schoolId; sh.render(); } }); });
      };
      bindPool();
      el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { grab(); F.studentIds = F.studentIds.filter(x => x !== b.dataset.rm); sh.render(); });
      const q = el.querySelector('[name=q]');
      if (q) q.oninput = () => { F.q = q.value; el.querySelector('[data-pool]').innerHTML = poolHtml(); bindPool(); };
      el.querySelectorAll('[data-dur]').forEach(b => b.onclick = () => { grab(); F.duration = +b.dataset.dur; sh.render(); });
      el.querySelectorAll('[data-day]').forEach(b => b.onclick = () => { grab(); const d = +b.dataset.day; const ds = F.days || [dow(F.date)]; F.days = ds.includes(d) ? ds.filter(x => x !== d) : [...ds, d]; sh.render(); });
      const st = el.querySelector('[name=start]'), en = el.querySelector('[name=end]'), du = el.querySelector('[name=duration]');
      st.onchange = () => { en.value = fromMin(toMin(st.value) + (+du.value || 0)); };
      en.onchange = () => { let d = toMin(en.value) - toMin(st.value); if (d <= 0) d += 1440; du.value = d; };
      du.oninput = () => { if (+du.value > 0) en.value = fromMin(toMin(st.value) + +du.value); };
      el.querySelector('[name=repeat]').onchange = rr;
      el.querySelector('[name=date]').onchange = () => { grab(); if (!occ || !ser) F.days = null; if (F.repeat) sh.render(); };
      const ms = el.querySelector('[name=mode]'); if (ms) ms.onchange = () => grab();
      el.querySelector('[data-save]').onclick = async () => {
        grab();
        const days = F.days || [dow(F.date)];
        if (F.kind === 'lesson' && !F.studentIds.length) return toast('Elegí al menos un alumno', 'err');
        if (F.kind === 'event' && !F.title) return ferr(el, 'title', 'Poné un título');
        if (!F.date) return ferr(el, 'date', 'Elegí la fecha');
        if (!F.start) return ferr(el, 'start', 'Elegí la hora de inicio');
        if (!(F.duration >= 5 && F.duration <= 720)) return ferr(el, 'duration', 'La duración tiene que estar entre 5 y 720 minutos');
        if (F.repeat && !days.length) return toast('Elegí al menos un día de la semana', 'err');
        if (F.repeat && F.until && F.until < F.date) return ferr(el, 'until', 'La fecha de fin es anterior al inicio');
        const base = { kind: F.kind, title: F.kind === 'event' ? F.title : '', studentIds: F.kind === 'event' ? [] : F.studentIds, schoolId: F.schoolId || (activeSchools()[0] || {}).id, mode: F.kind === 'event' ? '' : F.mode, start: F.start, duration: F.duration, notes: F.notes };
        let saved;
        if (!occ) {
          if (F.repeat) {
            const s = upsert('series', Object.assign({ id: uid(), days, interval: F.repeat, from: F.date, until: F.until || '', skip: [] }, base));
            saved = virtualOcc(s, F.date);
            toast('Clase recurrente creada');
          } else {
            // ¿ya existe esa clase en el calendario? (mismo día, algún alumno en común, horario que se cruza)
            if (F.kind === 'lesson') {
              const a = toMin(F.start), b = a + F.duration;
              const dup = occurrences(F.date, F.date).find(x => !isEvent(x) && !OFF.includes(stOf(x)) && (x.studentIds || []).some(i => F.studentIds.includes(i)) && toMin(x.start) < b + 30 && toMin(x.start) + (+x.duration || 0) > a - 30);
              if (dup) {
                const already = dup.status === 'done';
                const v = await ask(already ? 'Esa clase ya está registrada' : 'Esa clase ya está en el calendario',
                  `${esc(lessonTitle(dup))} · ${fmtDate(dup.date, { dow: 1 })} ${dup.start}–${lessonEnd(dup)} (${STATUS[stOf(dup)].s.toLowerCase()}).`,
                  [...(already ? [] : [{ label: F.markDone ? 'Marcar esa como realizada' : 'Abrir la del calendario', val: 'use' }]), { label: 'Es otra clase: crearla igual', val: 'new', cls: 'ghost' }, { label: 'Cancelar', val: null, cls: 'ghost' }]);
                if (!v) return;
                if (v === 'use') {
                  let l = dup;
                  if (F.markDone) {
                    l = materialize(dup);
                    if (l.start !== F.start || +l.duration !== F.duration) { l.realDur = F.duration; }
                    if (F.notes) l.notes = [l.notes, F.notes].filter(Boolean).join('\n');
                    l = setStatus(l, 'done');
                    toast('Clase del calendario marcada como realizada');
                  }
                  save(); sh.close(); render();
                  setTimeout(() => lessonSheet(l.id, { section: F.markDone ? 'log' : 'ctx' }), 250);
                  return;
                }
              }
            }
            saved = upsert('lessons', Object.assign({ id: uid(), date: F.date, status: 'scheduled' }, base));
            if (F.markDone) saved = setStatus(saved, 'done');
            toast(F.kind === 'event' ? 'Compromiso creado' : (F.markDone ? 'Clase registrada como realizada' : 'Clase creada'));
          }
        } else if (ser) {
          const v = await ask('¿Qué querés modificar?', 'Esta clase es parte de una serie recurrente.', [
            { label: 'Solo esta clase', val: 'one' }, { label: 'Esta y las siguientes', val: 'next' }, { label: 'Cancelar', val: null, cls: 'ghost' }]);
          if (!v) return;
          if (v === 'one') {
            const l = materialize(occ);
            saved = upsert('lessons', Object.assign(l, base, { date: F.date }));
          } else {
            const D = occ.seriesDate || occ.date;
            const keepStatus = !occ.virtual && occ.status !== 'scheduled' ? occ : null;
            const later = S.lessons.filter(x => x.seriesId === ser.id && x.seriesDate > D && x.id !== occ.id && (x.status !== 'scheduled' || S.lessonNotes.some(n => n.lessonId === x.id)));
            endSeriesAt(ser, D);
            const from = F.date < D ? F.date : D;
            const ns = upsert('series', Object.assign({ id: uid(), days: F.repeat ? days : [dow(F.date)], interval: F.repeat || 1, from, until: F.repeat ? (F.until || '') : '', skip: [] }, base));
            if (keepStatus) { keepStatus.seriesId = ns.id; keepStatus.seriesDate = F.date; Object.assign(keepStatus, base, { date: F.date }); upsert('lessons', keepStatus); }
            later.forEach(x => { x.seriesId = ns.id; upsert('lessons', x); });
            saved = virtualOcc(ns, F.date);
          }
          toast('Cambios guardados');
        } else {
          const l = lessonById(occ.id);
          Object.assign(l, base, { date: F.date });
          if (F.repeat) { // convierte una clase suelta en recurrente
            const s = upsert('series', Object.assign({ id: uid(), days, interval: F.repeat, from: F.date, until: F.until || '', skip: [] }, base));
            l.seriesId = s.id; l.seriesDate = F.date;
          }
          saved = upsert('lessons', l);
          toast('Cambios guardados');
        }
        save(); sh.close(); render();
        if (saved) overlapWarn(saved);
        if (o.onSave) o.onSave(saved);
      };
    }
  });
}

/* ---------- registrar una clase rápido (desde el inicio) ---------- */
function quickRegister() {
  const t = today();
  const list = occurrences(addDays(t, -7), t).filter(l => !isEvent(l) && stOf(l) === 'scheduled' && (l.date < t || toMin(l.start) <= nowMin() + 30)).reverse();
  if (!list.length) { lessonForm({ markDone: true }); return; }
  openSheet({
    title: 'Registrar clase',
    body: () => `<div class="muted small" style="margin:-4px 0 12px">Elegí la clase para registrar lo trabajado y marcarla como realizada.</div>
      <div class="list">${list.map(l => lessonRow(l, { date: 1 })).join('')}</div>
      <div class="sp"></div><button class="btn full" data-new>${ic('plus', 'sm')}Registrar una clase que no estaba agendada</button>`,
    mount: (el, sh) => {
      el.querySelectorAll('[data-act=openLesson]').forEach(b => b.onclick = e => { e.stopPropagation(); sh.close(); setTimeout(() => lessonSheet(b.dataset.id, { section: 'log' }), 200); });
      el.querySelector('[data-new]').onclick = () => { sh.close(); setTimeout(() => lessonForm({ markDone: true }), 200); };
    }
  });
}
