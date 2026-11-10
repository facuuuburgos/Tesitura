'use strict';
/* =========================================================
   Tesitura · shows de alumnos: fechas, horarios, participantes, canciones y orden
   ========================================================= */
const showById = id => byId('shows', id);
const showBlocks = sh => [...(sh.blocks || [])].sort((a, b) => a.start.localeCompare(b.start));
function blockEnd(sh, b) {
  if (b.end) return b.end;
  const bl = showBlocks(sh), i = bl.findIndex(x => x.id === b.id);
  return bl[i + 1] ? bl[i + 1].start : fromMin(Math.min(toMin(b.start) + 90, 1439));
}
const actsOf = (sh, blockId) => (sh.acts || []).filter(a => (a.blockId || '') === (blockId || '')).sort((a, b) => (a.order || 0) - (b.order || 0));
const attendOf = (sh, sid) => ((sh.people || []).find(p => p.studentId === sid) || {}).attend || 'pending';
const ATT = { yes: { l: 'Confirmado', s: 'Va', c: 'st-done' }, pending: { l: 'Sin confirmar', s: '?', c: 'st-sched' }, no: { l: 'No va', s: 'No va', c: 'st-cancel' } };
const upcomingShows = () => { const t = today(); return S.shows.filter(s => s.date >= t).sort((a, b) => (a.date + (showBlocks(a)[0] || {}).start).localeCompare(b.date + (showBlocks(b)[0] || {}).start)); };
const showTimes = sh => { const bl = showBlocks(sh); return bl.length ? `${bl[0].start}–${blockEnd(sh, bl[bl.length - 1])}` : ''; };
// bloques de show que están sucediendo ahora
function liveShowBlocks() {
  const t = today(), nm = nowMin(), out = [];
  S.shows.filter(s => s.date === t).forEach(sh => showBlocks(sh).forEach(b => { if (toMin(b.start) <= nm && nm < toMin(blockEnd(sh, b))) out.push({ sh, b }); }));
  return out;
}
function songLabel(ssid, o = {}) {
  const ss = byId('studentSongs', ssid), sg = ss && byId('songs', ss.songId);
  if (!sg) return o.empty ?? 'Canción sin definir';
  const t = semisOf(ss);
  return sg.title + (t ? ` (${fmtSemis(t)})` : '');
}
function ensurePeople(sh) {
  sh.people = sh.people || [];
  (sh.acts || []).forEach(a => (a.studentIds || []).forEach(id => { if (!sh.people.some(p => p.studentId === id)) sh.people.push({ studentId: id, attend: 'pending' }); }));
}
const showsOfStudent = sid => upcomingShows().filter(sh => (sh.people || []).some(p => p.studentId === sid) || (sh.acts || []).some(a => (a.studentIds || []).includes(sid)));
const showsOfSong = ssid => S.shows.filter(sh => (sh.acts || []).some(a => a.ssId === ssid));
const daysTo = d => { const n = dayDiff(today(), d); return n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : n > 1 ? `En ${n} días` : `Hace ${-n} días`; };

// canciones en curso de un alumno, como chips que abren la canción
function songChips(sid, o = {}) {
  const list = S.studentSongs.filter(x => x.studentId === sid && !x.endedAt);
  if (!list.length) return o.empty || '';
  const t0 = today();
  return `<div class="songline" ${o.style ? `style="${o.style}"` : ''}>${list.map(ss => {
    const sg = byId('songs', ss.songId) || {}, t = semisOf(ss), inShow = showsOfSong(ss.id).some(sh => sh.date >= t0);
    return `<button class="songchip ${inShow ? 'show' : ''}" data-act="openSong" data-id="${ss.id}">${ic('music', 'sm')}<span>${esc(sg.title || '¿?')}</span>${t ? `<b>${fmtSemis(t)}</b>` : ''}${inShow ? `<i style="color:var(--grp);display:flex">${ic('mic', 'sm')}</i>` : ''}</button>`;
  }).join('')}</div>`;
}

/* ---------- lista de shows ---------- */
VIEWS.shows = () => {
  const t = today();
  const up = upcomingShows(), past = S.shows.filter(s => s.date < t).sort((a, b) => b.date.localeCompare(a.date));
  const row = sh => { ensurePeople(sh); const yes = sh.people.filter(p => p.attend === 'yes').length; return `<a class="li" href="#/show/${sh.id}"><div class="keytag" style="background:var(--grp-d);color:var(--grp)">${ic('mic')}</div><div class="grow"><div class="t ell">${esc(sh.title)}</div><div class="s ell">${fmtDate(sh.date, { dow: 1, year: 1 })}${showTimes(sh) ? ' · ' + showTimes(sh) : ''}${sh.venue ? ' · ' + esc(sh.venue) : ''}</div><div class="xs dim">${(sh.acts || []).length} canciones · ${yes}/${sh.people.length} confirmados</div></div>${sh.date >= t ? `<span class="pill group">${daysTo(sh.date)}</span>` : ''}${ic('chevR', 'sm chev')}</a>`; };
  return `${topbar('Shows', { back: '#/', right: `<button class="iconbtn acc" data-act="newShow" aria-label="Nuevo show">${ic('plus')}</button>` })}
    ${up.length ? `<div class="list">${up.map(row).join('')}</div>` : `<div class="empty">${ic('mic')}<div class="t">No hay shows agendados</div><div class="small">Creá un show con su fecha y horarios, sumá a los alumnos que participan y armá el programa.</div><div class="sp"></div><button class="btn pri" data-act="newShow">${ic('plus', 'sm')}Nuevo show</button></div>`}
    ${past.length ? `<div class="sec"><h2>Anteriores</h2></div><div class="list" style="opacity:.75">${past.map(row).join('')}</div>` : ''}`;
};
ACT.newShow = () => showForm(null);
ACT.openShow = el => go('#/show/' + el.dataset.id);

/* ---------- página del show ---------- */
VIEWS.show = id => {
  const sh = showById(id);
  if (!sh) return `${topbar('Show', { back: '#/shows' })}<div class="empty">${ic('mic')}<div class="t">No se encontró el show</div></div>`;
  ensurePeople(sh);
  const t = today(), live = sh.date === t ? showBlocks(sh).find(b => toMin(b.start) <= nowMin() && nowMin() < toMin(blockEnd(sh, b))) : null;
  const yes = sh.people.filter(p => p.attend === 'yes').length, no = sh.people.filter(p => p.attend === 'no').length;
  const loose = actsOf(sh, '');
  const blocks = showBlocks(sh);
  return `${topbar(esc(sh.title), { back: '#/shows', sub: `${fmtLong(sh.date)} · ${daysTo(sh.date)}`, right: `<button class="iconbtn" data-act="editShow" data-id="${sh.id}" aria-label="Editar">${ic('edit')}</button>` })}
    ${sh.venue || sh.notes ? `<div class="small muted" style="margin:-4px 2px 14px;white-space:pre-wrap">${sh.venue ? ic('pin', 'sm') + ' ' + esc(sh.venue) : ''}${sh.venue && sh.notes ? '\n' : ''}${esc(sh.notes || '')}</div>` : ''}
    ${live ? liveShowCard(sh, live, true) : ''}
    <div class="stats" style="grid-template-columns:repeat(3,1fr)">
      <div class="stat"><div class="k">Confirmados</div><div class="v num">${yes}<span class="dim" style="font-size:15px"> / ${sh.people.length}</span></div>${no ? `<div class="h">${no} no van</div>` : ''}</div>
      <div class="stat"><div class="k">Canciones</div><div class="v num">${(sh.acts || []).length}</div></div>
      <div class="stat"><div class="k">Horarios</div><div class="v num">${blocks.length}</div></div>
    </div>
    <div class="sec"><h2>Programa</h2><button class="lnk small" data-act="newAct" data-show="${sh.id}">+ Agregar canción</button></div>
    ${blocks.map(b => blockHtml(sh, b, live && live.id === b.id)).join('')}
    ${loose.length || !blocks.length ? `<div class="group-t">${blocks.length ? 'Sin horario asignado' : 'Canciones'}</div>${loose.length ? `<div class="list">${loose.map((a, i) => actRow(sh, a, i, loose.length)).join('')}</div>` : '<div class="card small muted">Todavía no hay canciones en el programa.</div>'}` : ''}
    <div class="sec"><h2>Participantes</h2><button class="lnk small" data-act="addPeople" data-show="${sh.id}">+ Agregar alumnos</button></div>
    ${sh.people.length ? `<div class="list">${sh.people.slice().sort((a, b) => sName(student(a.studentId)).localeCompare(sName(student(b.studentId)))).map(p => { const st = student(p.studentId), n = (sh.acts || []).filter(a => (a.studentIds || []).includes(p.studentId)); return `<div class="li av">${avatar(st)}<div class="grow" style="min-width:0"><div class="t ell">${esc(sName(st))}</div><div class="s ell">${n.length ? n.map(a => esc(songLabel(a.ssId, { empty: 'canción a definir' }))).join(' · ') : 'Sin canción asignada'}</div></div>
      <div class="seg att" style="flex:none">${['yes', 'pending', 'no'].map(k => `<button class="${p.attend === k ? 'on ' + k : ''}" data-act="setAttend" data-show="${sh.id}" data-s="${p.studentId}" data-v="${k}" aria-label="${ATT[k].l}">${k === 'yes' ? ic('check', 'sm') : k === 'no' ? ic('x', 'sm') : '?'}</button>`).join('')}</div></div>`; }).join('')}</div>
      <div class="hint" style="margin-top:8px">✓ va · ? sin confirmar · ✕ no va. Los que cantan se agregan solos al sumar sus canciones al programa.</div>` : `<div class="card small muted">Agregá a los alumnos que participan para ir confirmando asistencia.</div>`}`;
};
function blockHtml(sh, b, isLive) {
  const acts = actsOf(sh, b.id);
  return `<div class="group-t row" style="gap:8px">${isLive ? '<span class="livedot"></span>' : ''}<span class="grow">${b.start}–${blockEnd(sh, b)}${b.title ? ' · ' + esc(b.title) : ''}</span><button class="mini" data-act="newAct" data-show="${sh.id}" data-block="${b.id}">${ic('plus', 'sm')}</button></div>
    ${acts.length ? `<div class="list">${acts.map((a, i) => actRow(sh, a, i, acts.length, isLive)).join('')}</div>` : `<div class="card small muted">Sin canciones en este horario.</div>`}`;
}
function actRow(sh, a, i, n, isLive) {
  const ids = a.studentIds || [], absent = ids.some(id => attendOf(sh, id) === 'no'), pend = ids.some(id => attendOf(sh, id) === 'pending');
  const next = isLive && !a.done && actsOf(sh, a.blockId).find(x => !x.done) === a;
  return `<div class="li act ${a.done ? 'done' : ''} ${next ? 'now' : ''}">
    <div class="ord">${i + 1}</div>
    <div class="row" style="gap:0">${ids.slice(0, 2).map((s, k) => `<div style="margin-left:${k ? -12 : 0}px">${avatar(student(s), 'sm')}</div>`).join('')}</div>
    <button class="grow" style="text-align:left;min-width:0" data-act="editAct" data-show="${sh.id}" data-a="${a.id}"><div class="t ell">${esc(songLabel(a.ssId, { empty: a.title || 'Canción a definir' }))}</div><div class="s ell">${esc(ids.map(s => sName(student(s))).join(', ') || 'Sin alumnos')}${absent ? ' · <span style="color:var(--bad)">no va</span>' : pend ? ' · <span class="dim">sin confirmar</span>' : ''}${next ? ' · <b style="color:var(--acc)">ahora</b>' : ''}</div></button>
    ${isLive ? `<button class="mini ${a.done ? 'ok' : ''}" data-act="actDone" data-show="${sh.id}" data-a="${a.id}" aria-label="Ya cantó">${ic('check', 'sm')}</button>` : `<div class="ordbtns"><button data-act="moveAct" data-show="${sh.id}" data-a="${a.id}" data-d="-1" ${i ? '' : 'disabled'} aria-label="Subir">${ic('chevD', 'sm')}</button><button data-act="moveAct" data-show="${sh.id}" data-a="${a.id}" data-d="1" ${i < n - 1 ? '' : 'disabled'} aria-label="Bajar">${ic('chevD', 'sm')}</button></div>`}
  </div>`;
}
// tarjeta del show en curso (en Inicio y en la página del show)
function liveShowCard(sh, b, inPage) {
  const acts = actsOf(sh, b.id), nowA = acts.find(a => !a.done), after = nowA ? acts.slice(acts.indexOf(nowA) + 1).filter(a => !a.done) : [];
  const who = a => esc((a.studentIds || []).map(s => sName(student(s))).join(', '));
  return `<div class="nowcard group" ${inPage ? '' : `data-act="openShow" data-id="${sh.id}" role="button" tabindex="0"`} style="margin-bottom:${inPage ? 14 : 0}px">
    <div class="row"><span class="keytag" style="background:var(--grp-d);color:var(--grp);min-width:40px;height:40px">${ic('mic')}</span><div class="grow"><div class="t ell" style="font-weight:600;font-size:16px">${esc(sh.title)}</div><div class="small muted">${b.start}–${blockEnd(sh, b)}${b.title ? ' · ' + esc(b.title) : ''} · ${acts.filter(a => a.done).length}/${acts.length} cantaron</div></div>${inPage ? '' : ic('chevR', 'sm chev')}</div>
    ${nowA ? `<div style="margin-top:12px"><div class="xs" style="color:var(--grp);font-weight:600;text-transform:uppercase;letter-spacing:.06em">Ahora</div><div style="font-weight:600;font-size:17px">${who(nowA)}</div><div class="small muted">${esc(songLabel(nowA.ssId, { empty: nowA.title || 'Canción a definir' }))}</div></div>
      ${after.length ? `<div class="small muted" style="margin-top:10px">Después: ${after.slice(0, 4).map(a => who(a) + ' (' + esc(songLabel(a.ssId, { empty: a.title || '—' })) + ')').join(' → ')}${after.length > 4 ? ' …' : ''}</div>` : '<div class="small muted" style="margin-top:8px">Es la última de este horario.</div>'}
      ${inPage ? '' : `<button class="btn sm full" style="margin-top:12px" data-act="actDone" data-show="${sh.id}" data-a="${nowA.id}">${ic('check', 'sm')}Ya cantó · pasar a la siguiente</button>`}` : `<div class="small muted" style="margin-top:10px">${acts.length ? 'Ya cantaron todos los de este horario.' : 'No hay canciones cargadas en este horario.'}</div>`}
  </div>`;
}
ACT.editShow = el => showForm(showById(el.dataset.id));
ACT.setAttend = el => { const sh = showById(el.dataset.show); ensurePeople(sh); const p = sh.people.find(x => x.studentId === el.dataset.s); p.attend = el.dataset.v; upsert('shows', sh); save(); render(); };
ACT.actDone = (el, e) => {
  if (e) e.stopPropagation();
  const sh = showById(el.dataset.show), a = sh.acts.find(x => x.id === el.dataset.a);
  a.done = !a.done; upsert('shows', sh); save(); render();
  if (a.done) toast('Listo', '', { label: 'Deshacer', fn: () => { a.done = false; upsert('shows', sh); save(); render(); } });
};
ACT.moveAct = el => {
  const sh = showById(el.dataset.show), a = sh.acts.find(x => x.id === el.dataset.a), list = actsOf(sh, a.blockId), i = list.indexOf(a), j = i + +el.dataset.d;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  list.forEach((x, k) => { x.order = k + 1; });
  upsert('shows', sh); save(); render();
};
ACT.newAct = el => actForm(showById(el.dataset.show), null, { blockId: el.dataset.block });
ACT.editAct = el => { const sh = showById(el.dataset.show); actForm(sh, sh.acts.find(x => x.id === el.dataset.a)); };
ACT.addPeople = el => {
  const sh = showById(el.dataset.show); ensurePeople(sh);
  const sel = new Set();
  openSheet({
    title: 'Agregar participantes',
    body: () => { const pool = S.students.filter(s => s.status === 'active' && !sh.people.some(p => p.studentId === s.id)).sort((a, b) => sName(a).localeCompare(sName(b))); return pool.length ? `<div class="muted small" style="margin:-4px 0 12px">Tocá los alumnos que participan.</div><div class="chips" style="flex-wrap:wrap">${pool.map(s => `<button type="button" class="chip acc ${sel.has(s.id) ? 'on' : ''}" data-s="${s.id}">${esc(sName(s))}</button>`).join('')}</div><div class="sp"></div><button class="btn pri full" data-save>${ic('check', 'sm')}Agregar</button>` : '<div class="muted">Ya están todos tus alumnos activos.</div>'; },
    mount: (e, shh) => {
      e.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { sel.has(b.dataset.s) ? sel.delete(b.dataset.s) : sel.add(b.dataset.s); b.classList.toggle('on'); });
      const s = e.querySelector('[data-save]'); if (s) s.onclick = () => { if (!sel.size) return toast('Elegí al menos un alumno', 'err'); sel.forEach(id => sh.people.push({ studentId: id, attend: 'pending' })); upsert('shows', sh); save(); shh.close(); render(); toast(sel.size + ' agregado' + (sel.size > 1 ? 's' : '')); };
    }
  });
};

/* ---------- alta / edición del show ---------- */
function showForm(sh) {
  const F = sh ? clone(sh) : { title: '', date: addDays(today(), 14), venue: '', notes: '', blocks: [{ id: uid(), start: '19:00', end: '', title: '' }], acts: [], people: [] };
  openSheet({
    title: sh ? 'Editar show' : 'Nuevo show',
    body: () => `${field('Nombre', inp('title', F.title, { ph: 'Ej: Muestra de fin de año' }))}
      ${field('Fecha', inp('date', F.date, { type: 'date' }))}
      ${field('Lugar (opcional)', inp('venue', F.venue, { ph: 'Ej: Sala Zitarrosa' }))}
      <label class="field"><span>Horarios</span>
        ${F.blocks.map((b, i) => `<div class="row" style="margin-bottom:8px;align-items:flex-end"><input class="inp" type="time" data-bs="${i}" value="${b.start}" style="flex:1"><span class="dim">a</span><input class="inp" type="time" data-be="${i}" value="${b.end || ''}" style="flex:1"><input class="inp" data-bt="${i}" value="${esc(b.title || '')}" placeholder="Nombre (opc.)" style="flex:1.4"><button type="button" class="iconbtn plain" data-brm="${i}" aria-label="Quitar">${ic('x', 'sm')}</button></div>`).join('')}
        <button type="button" class="btn sm" data-badd>${ic('plus', 'sm')}Agregar horario</button></label>
      <div class="hint">Por ejemplo, un bloque de 18:00 a 19:30 y otro de 20:00 a 21:30. El horario de fin es opcional.</div>
      ${field('Notas (opcional)', txa('notes', F.notes, 'Ensayo general, vestuario, qué llevar…', 2))}
      <button class="btn pri full" data-save>${ic('check', 'sm')}Guardar</button>
      ${sh ? `<button class="btn ghost danger full" style="margin-top:6px" data-del>${ic('trash', 'sm')}Eliminar show</button>` : ''}`,
    mount: (el, s2) => {
      const grab = () => { ['title', 'date', 'venue', 'notes'].forEach(n => { F[n] = fval(el, n); }); F.blocks.forEach((b, i) => { b.start = el.querySelector(`[data-bs="${i}"]`).value; b.end = el.querySelector(`[data-be="${i}"]`).value; b.title = el.querySelector(`[data-bt="${i}"]`).value.trim(); }); };
      el.querySelector('[data-badd]').onclick = () => { grab(); const last = F.blocks[F.blocks.length - 1]; F.blocks.push({ id: uid(), start: last ? fromMin(Math.min(toMin(last.end || last.start) + 30, 23 * 60)) : '19:00', end: '', title: '' }); s2.render(); };
      el.querySelectorAll('[data-brm]').forEach(b => b.onclick = () => { grab(); F.blocks.splice(+b.dataset.brm, 1); s2.render(); });
      el.querySelector('[data-save]').onclick = () => {
        grab();
        if (!F.title) return ferr(el, 'title', 'Poné un nombre al show');
        if (!F.date) return ferr(el, 'date', 'Elegí la fecha');
        if (!F.blocks.length) return toast('Agregá al menos un horario', 'err');
        for (const b of F.blocks) { if (!b.start) return toast('Completá la hora de inicio de cada horario', 'err'); if (b.end && toMin(b.end) <= toMin(b.start)) return toast('Un horario termina antes de empezar', 'err'); }
        // canciones de horarios borrados quedan "sin horario"
        F.acts.forEach(a => { if (a.blockId && !F.blocks.some(b => b.id === a.blockId)) a.blockId = ''; });
        const rec = upsert('shows', Object.assign(sh || { id: uid() }, F));
        save(); s2.close(); if (!sh) go('#/show/' + rec.id); else render(); toast(sh ? 'Show actualizado' : 'Show creado');
      };
      const d = el.querySelector('[data-del]');
      if (d) d.onclick = async () => { if (!(await confirmDel('¿Eliminar ' + sh.title + '?', 'Se borran su programa y la lista de participantes. El repertorio de los alumnos no se toca.'))) return; removeRec('shows', sh.id); save(); s2.close(); go('#/shows'); };
    }
  });
}

/* ---------- canción del programa ---------- */
function actForm(sh, a, o = {}) {
  const F = a ? clone(a) : { id: uid(), blockId: o.blockId ?? ((showBlocks(sh)[0] || {}).id || ''), studentIds: o.studentIds || [], ssId: o.ssId || '', title: '', notes: '' };
  let q = '', newSong = '';
  openSheet({
    title: a ? 'Canción del show' : 'Agregar al programa',
    body: () => {
      const nq = norm(q);
      const pool = S.students.filter(s => s.status === 'active' && !F.studentIds.includes(s.id) && (!nq || norm(sName(s)).includes(nq))).sort((x, y) => sName(x).localeCompare(sName(y))).slice(0, nq ? 20 : 10);
      const songs = S.studentSongs.filter(x => F.studentIds.includes(x.studentId) && (!x.endedAt || x.id === F.ssId));
      return `<label class="field"><span>Quién canta</span>
          ${F.studentIds.length ? `<div class="chips" style="flex-wrap:wrap;margin-bottom:8px">${F.studentIds.map(id => `<button type="button" class="chip on" data-rm="${id}">${esc(sName(student(id)))} ${ic('x', 'sm')}</button>`).join('')}</div>` : ''}
          <div class="search">${ic('search', 'sm')}<input class="inp" name="q" type="search" value="${esc(q)}" placeholder="${F.studentIds.length ? 'Agregar otro (dúo, grupo…)' : 'Buscar alumno'}" autocomplete="off"></div>
          <div class="chips" style="flex-wrap:wrap;margin-top:8px" data-pool>${pool.map(s => `<button type="button" class="chip" data-add="${s.id}">${ic('plus', 'sm')}${esc(sName(s))}</button>`).join('')}</div></label>
        ${F.studentIds.length ? `<label class="field"><span>Canción</span>
          ${songs.length ? `<div class="chips" style="flex-wrap:wrap">${songs.map(ss => `<button type="button" class="chip acc ${F.ssId === ss.id ? 'on' : ''}" data-ss="${ss.id}">${esc(songLabel(ss.id))}${F.studentIds.length > 1 ? ' · ' + esc(sShort(student(ss.studentId))) : ''}</button>`).join('')}</div>` : '<div class="small muted">No tiene canciones en curso.</div>'}
          <div class="row" style="margin-top:8px"><input class="inp" name="newsong" value="${esc(newSong)}" placeholder="Otra canción (se agrega a su repertorio)" autocomplete="off"></div></label>` : ''}
        ${showBlocks(sh).length ? field('Horario', sel('blockId', F.blockId, [['', 'Sin horario asignado'], ...showBlocks(sh).map(b => [b.id, `${b.start}–${blockEnd(sh, b)}${b.title ? ' · ' + b.title : ''}`])])) : ''}
        ${field('Notas (opcional)', txa('notes', F.notes, 'Ej: entra con micrófono de mano, pista en pendrive', 2))}
        <button class="btn pri full" data-save>${ic('check', 'sm')}Guardar</button>
        ${a ? `<button class="btn ghost danger full" style="margin-top:6px" data-del>${ic('trash', 'sm')}Quitar del programa</button>` : ''}`;
    },
    mount: (el, s2) => {
      const grab = () => { const b = fval(el, 'blockId'); if (b !== undefined) F.blockId = b; F.notes = fval(el, 'notes'); const n = el.querySelector('[name=newsong]'); if (n) newSong = n.value; const qi = el.querySelector('[name=q]'); if (qi) q = qi.value; };
      const bindPool = () => el.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { grab(); F.studentIds.push(b.dataset.add); q = ''; s2.render(); });
      bindPool();
      const qi = el.querySelector('[name=q]');
      qi.oninput = () => { q = qi.value; const nq = norm(q); el.querySelector('[data-pool]').innerHTML = S.students.filter(s => s.status === 'active' && !F.studentIds.includes(s.id) && (!nq || norm(sName(s)).includes(nq))).sort((x, y) => sName(x).localeCompare(sName(y))).slice(0, nq ? 20 : 10).map(s => `<button type="button" class="chip" data-add="${s.id}">${ic('plus', 'sm')}${esc(sName(s))}</button>`).join(''); bindPool(); };
      el.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { grab(); F.studentIds = F.studentIds.filter(x => x !== b.dataset.rm); const ss = byId('studentSongs', F.ssId); if (ss && !F.studentIds.includes(ss.studentId)) F.ssId = ''; s2.render(); });
      el.querySelectorAll('[data-ss]').forEach(b => b.onclick = () => { grab(); F.ssId = F.ssId === b.dataset.ss ? '' : b.dataset.ss; newSong = ''; s2.render(); });
      el.querySelector('[data-save]').onclick = () => {
        grab();
        if (!F.studentIds.length) return toast('Elegí quién canta', 'err');
        if (newSong.trim()) { // canción nueva: se suma al repertorio del primer alumno
          const title = newSong.trim();
          const song = S.songs.find(x => norm(x.title) === norm(title)) || upsert('songs', { id: uid(), title, artist: '' });
          const ss = upsert('studentSongs', { id: uid(), studentId: F.studentIds[0], songId: song.id, transpose: 0, startedAt: today(), endedAt: '', recordings: [], notes: '' });
          F.ssId = ss.id;
        }
        sh.acts = sh.acts || [];
        const i = sh.acts.findIndex(x => x.id === F.id);
        if (i < 0) { F.order = actsOf(sh, F.blockId).length + 1; sh.acts.push(F); }
        else { if ((sh.acts[i].blockId || '') !== (F.blockId || '')) F.order = actsOf(sh, F.blockId).length + 1; sh.acts[i] = F; }
        ensurePeople(sh);
        upsert('shows', sh); save(); s2.close(); render(); if (o.after) o.after(); toast(a ? 'Guardado' : 'Agregada al programa de ' + sh.title);
      };
      const d = el.querySelector('[data-del]');
      if (d) d.onclick = async () => { if (!(await confirmDel('¿Quitar esta canción del programa?', 'El alumno sigue en la lista de participantes.', 'Quitar'))) return; sh.acts = sh.acts.filter(x => x.id !== a.id); actsOf(sh, a.blockId).forEach((x, k) => { x.order = k + 1; }); upsert('shows', sh); save(); s2.close(); render(); };
    }
  });
}
// desde una canción del repertorio: "Para el show"
async function addSongToShow(ss, after) {
  const up = upcomingShows();
  if (!up.length) { const v = await ask('No hay shows agendados', 'Creá primero el show con su fecha y horarios.', [{ label: 'Crear show', val: true }, { label: 'Cancelar', val: false, cls: 'ghost' }]); if (v) { closeAll(); showForm(null); } return; }
  let sh = up[0];
  if (up.length > 1) { const v = await ask('¿Para qué show?', '', [...up.slice(0, 4).map(x => ({ label: `${x.title} · ${fmtDate(x.date)}`, val: x.id })), { label: 'Cancelar', val: null, cls: 'ghost' }]); if (!v) return; sh = showById(v); }
  if ((sh.acts || []).some(a => a.ssId === ss.id)) return toast('Ya está en el programa de ' + sh.title);
  actForm(sh, null, { studentIds: [ss.studentId], ssId: ss.id, after });
}

/* ---------- en el calendario ---------- */
// bloques de shows como elementos del calendario
function showItems(a, b) {
  const out = [];
  S.shows.filter(s => s.date >= a && s.date <= b).forEach(sh => showBlocks(sh).forEach(bl => out.push({ id: 'show:' + sh.id + ':' + bl.id, showId: sh.id, date: sh.date, start: bl.start, duration: Math.max(15, toMin(blockEnd(sh, bl)) - toMin(bl.start)), title: sh.title + (bl.title ? ' · ' + bl.title : ''), isShow: true })));
  return out;
}
