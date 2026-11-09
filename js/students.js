'use strict';
/* =========================================================
   Tesitura · alumnos, repertorio y notas
   ========================================================= */
const ST_STATUS = { active: 'Activo', paused: 'Pausado', inactive: 'Inactivo' };

VIEWS.students = () => {
  const q = norm(UI.stuQ);
  const list = S.students.filter(s => (UI.stuFilter === 'all' || s.status === UI.stuFilter) && (!UI.stuSchool || s.schoolId === UI.stuSchool) && (!q || norm(sName(s) + ' ' + (s.email || '') + ' ' + (s.phone || '')).includes(q)))
    .sort((a, b) => sName(a).localeCompare(sName(b)));
  const cnt = k => S.students.filter(s => s.status === k).length;
  const multi = activeSchools().length > 1;
  return `${topbar('Alumnos', { right: `<button class="iconbtn acc" data-act="newStudent" aria-label="Nuevo alumno">${ic('plus')}</button>` })}
    <div class="search" style="margin-bottom:10px">${ic('search', 'sm')}<input class="inp" id="stuq" value="${esc(UI.stuQ)}" placeholder="Buscar" autocomplete="off"></div>
    <div class="chips" style="margin-bottom:${multi ? 8 : 14}px">
      ${[['active', 'Activos'], ['paused', 'Pausados'], ['inactive', 'Inactivos'], ['all', 'Todos']].map(([k, l]) => `<button class="chip ${UI.stuFilter === k ? 'on' : ''}" data-act="stuFilter" data-v="${k}">${l}${k !== 'all' ? ` <span class="dim">${cnt(k)}</span>` : ''}</button>`).join('')}
    </div>
    ${multi ? `<div class="chips" style="margin-bottom:14px"><button class="chip ${!UI.stuSchool ? 'on' : ''}" data-act="stuSchool" data-v="">Todas las escuelas</button>${activeSchools().map(s => `<button class="chip ${UI.stuSchool === s.id ? 'on' : ''}" data-act="stuSchool" data-v="${s.id}">${schoolDot(s)}${esc(s.name)}</button>`).join('')}</div>` : ''}
    ${list.length ? `<div class="list">${list.map(s => {
    const nx = s.status === 'active' ? nextLessonOf(s.id) : null;
    const songs = S.studentSongs.filter(x => x.studentId === s.id && !x.endedAt).length;
    return `<a class="li av" href="#/student/${s.id}">${avatar(s)}<div class="grow"><div class="t ell">${esc(sName(s))}</div><div class="s ell">${multi ? esc(school(s.schoolId).name) + ' · ' : ''}${nx ? 'Próxima: ' + fmtDate(nx.date, { rel: 1, dow: 1 }) + ' ' + nx.start : (s.status !== 'active' ? ST_STATUS[s.status] : 'Sin clases agendadas')}${songs ? ` · ${songs} canción${songs > 1 ? 'es' : ''}` : ''}</div></div>${ic('chevR', 'sm chev')}</a>`;
  }).join('')}</div>`
      : `<div class="empty">${ic('users')}<div class="t">${S.students.length ? 'Sin resultados' : 'Todavía no hay alumnos'}</div>${S.students.length ? '' : `<div class="small">Agregá tu primer alumno para empezar.</div><div class="sp"></div><button class="btn pri" data-act="newStudent">${ic('plus', 'sm')}Nuevo alumno</button>`}</div>`}`;
};
AFTER.students = m => {
  const q = m.querySelector('#stuq'); let t;
  q.oninput = () => { clearTimeout(t); t = setTimeout(() => { UI.stuQ = q.value; render(); const n = $('#stuq'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 150); };
};
ACT.stuFilter = el => { UI.stuFilter = el.dataset.v; render(); };
ACT.stuSchool = el => { UI.stuSchool = el.dataset.v; render(); };
ACT.newStudent = () => studentForm(null, { onSave: s => go('#/student/' + s.id) });

/* ---------- perfil ---------- */
VIEWS.student = id => {
  const s = student(id);
  if (!s) return `${topbar('Alumno', { back: '#/students' })}<div class="empty">${ic('users')}<div class="t">No se encontró el alumno</div></div>`;
  const tab = UI.stTab[id] || 'sum';
  const sc = school(s.schoolId);
  const tel = (s.phone || '').replace(/[^\d+]/g, '');
  const tabs = [['sum', 'Resumen'], ['songs', 'Repertorio'], ['lessons', 'Clases'], ['notes', 'Notas'], ['info', 'Ficha']];
  return `${topbar('', { back: '#/students', right: `<button class="iconbtn" data-act="editStudent" data-id="${id}" aria-label="Editar">${ic('edit')}</button>` })}
    <div class="prof">${avatar(s, 'xl')}<div class="grow"><h1>${esc(sName(s))}</h1>
      <div class="row wrap small muted" style="gap:6px;margin-top:6px"><span class="pill ${s.status === 'active' ? 'st-done' : s.status === 'paused' ? 'st-absent' : 'st-sched'}">${ST_STATUS[s.status]}</span>
      ${activeSchools().length > 1 || S.schools.length > 1 ? `<span class="row" style="gap:5px">${schoolDot(sc)}${esc(sc.name)}</span>` : ''}${s.voiceType ? `<span>· ${esc(s.voiceType)}</span>` : ''}</div></div></div>
    ${tel || s.email ? `<div class="contact">${tel ? `<a href="https://wa.me/${tel.replace('+', '')}" target="_blank" rel="noopener">${ic('chat')}WhatsApp</a><a href="tel:${tel}">${ic('phone')}Llamar</a>` : ''}${s.email ? `<a href="mailto:${esc(s.email)}">${ic('mail')}Email</a>` : ''}<button data-act="newLessonFor" data-id="${id}">${ic('cal')}Agendar</button></div>` : `<div class="contact"><button data-act="newLessonFor" data-id="${id}">${ic('cal')}Agendar clase</button><button data-act="newSong" data-id="${id}">${ic('music')}Canción</button><button data-act="newNote" data-id="${id}">${ic('book')}Nota</button></div>`}
    <div class="tabs">${tabs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="stTab" data-id="${id}" data-v="${k}">${l}</button>`).join('')}</div>
    ${({ sum: stSummary, songs: stSongs, lessons: stLessons, notes: stNotes, info: stInfo })[tab](s)}`;
};
ACT.stTab = el => { UI.stTab[el.dataset.id] = el.dataset.v; render(); };
ACT.editStudent = el => studentForm(student(el.dataset.id));
ACT.newLessonFor = el => { const s = student(el.dataset.id); lessonForm({ studentIds: [s.id], schoolId: s.schoolId }); };

function stSummary(s) {
  const t = today();
  const up = occurrences(t, addDays(t, 45)).filter(l => (l.studentIds || []).includes(s.id) && l.status === 'scheduled' && (l.date > t || toMin(l.start) + l.duration > nowMin())).slice(0, 4);
  const series = S.series.filter(x => (x.studentIds || []).includes(s.id) && (!x.until || x.until >= t));
  const yr = S.lessons.filter(l => (l.studentIds || []).includes(s.id) && l.status === 'done');
  return `<div class="sec" style="margin-top:6px"><h2>Próximas clases</h2></div>
    ${series.length ? `<div class="small muted" style="margin:-4px 2px 10px">${ic('repeat', 'sm')} ${series.map(x => `${x.days.map(d => DOW_L[d]).join(' y ')} a las ${x.start}${+x.interval > 1 ? ' (cada ' + x.interval + ' semanas)' : ''}`).join(' · ')}</div>` : ''}
    ${up.length ? `<div class="list">${up.map(l => lessonRow(l, { date: 1 })).join('')}</div>` : `<div class="card small muted">No tiene clases agendadas. <a href="#" data-act="newLessonFor" data-id="${s.id}">Agendar</a></div>`}
    <div class="sec"><h2>Antes de la próxima clase</h2><span class="small muted">${yr.length} clase${yr.length === 1 ? '' : 's'} realizada${yr.length === 1 ? '' : 's'}</span></div>
    <div class="card">${contextHtml(s.id, null, { noHead: 1 })}</div>`;
}

/* ---------- repertorio ---------- */
function stSongs(s) {
  const all = S.studentSongs.filter(x => x.studentId === s.id);
  const cur = all.filter(x => !x.endedAt).sort((a, b) => (b.startedAt || '').localeCompare(a.startedAt || ''));
  const past = all.filter(x => x.endedAt).sort((a, b) => b.endedAt.localeCompare(a.endedAt));
  return `<div class="row" style="margin:4px 0 12px"><div class="grow small muted">${cur.length} en curso · ${past.length} anterior${past.length === 1 ? '' : 'es'}</div><button class="btn sm pri" data-act="newSong" data-id="${s.id}">${ic('plus', 'sm')}Canción</button></div>
    ${cur.length ? `<div class="list">${cur.map(ss => songRow(ss)).join('')}</div>` : `<div class="empty">${ic('music')}<div class="t">Sin canciones en curso</div><div class="small">Agregá lo que está trabajando, con su tonalidad.</div></div>`}
    ${past.length ? `<div class="sec"><h2>Anteriores</h2></div><div class="list">${past.map(ss => songRow(ss, true)).join('')}</div>` : ''}`;
}
function songRow(ss, past) {
  const sg = byId('songs', ss.songId) || {}, wk = workKey(ss);
  const t = ss.manual && ss.workKey && sg.key ? semisBetween(sg.key.pc, ss.workKey.pc) : (ss.transpose || 0);
  const logs = S.lessonNotes.filter(n => (n.songs || []).includes(ss.id)).length;
  return `<button class="li tap" data-act="openSong" data-id="${ss.id}" style="${past ? 'opacity:.7' : ''}">
    <div class="keytag">${keyName(wk)}${sg.key ? `<small>${fmtSemis(t)}</small>` : ''}</div>
    <div class="grow"><div class="t ell">${esc(sg.title || '¿?')}</div><div class="s ell">${esc(sg.artist || 'Artista desconocido')}${sg.key ? ' · original ' + keyName(sg.key) : ''}</div>
    <div class="xs dim">${past ? `${fmtDate(ss.startedAt)} → ${fmtDate(ss.endedAt)}` : (ss.startedAt ? 'Desde ' + fmtDate(ss.startedAt) : '')}${logs ? ` · trabajada en ${logs} clase${logs > 1 ? 's' : ''}` : ''}</div></div>${ic('chevR', 'sm chev')}</button>`;
}
ACT.newSong = el => songForm(null, el.dataset.id);
ACT.openSong = el => songSheet(el.dataset.id);
function songSheet(id) {
  const sh = openSheet({
    title: () => { const ss = byId('studentSongs', id); return esc((byId('songs', ss && ss.songId) || {}).title || 'Canción'); },
    body: () => {
      const ss = byId('studentSongs', id); if (!ss) return '<div class="muted">Eliminada</div>';
      const sg = byId('songs', ss.songId) || {}, wk = workKey(ss);
      const t = ss.manual && ss.workKey && sg.key ? semisBetween(sg.key.pc, ss.workKey.pc) : (ss.transpose || 0);
      const logs = S.lessonNotes.filter(n => (n.songs || []).includes(ss.id)).sort((a, b) => b.date.localeCompare(a.date));
      const other = S.studentSongs.filter(x => x.songId === ss.songId && x.studentId === ss.studentId && x.id !== ss.id);
      return `<div class="muted small" style="margin:-6px 0 12px">${esc(sg.artist || '')}</div>
        <div class="keybig"><div class="from"><div class="lab">Original</div><div class="kv">${keyName(sg.key)}</div><div class="eq">${enharm(sg.key) ? '= ' + enharm(sg.key) : '&nbsp;'}</div></div>
        <div class="arrow"><b>${fmtSemis(t)}</b>semitonos</div>
        <div class="to"><div class="lab">De trabajo</div><div class="kv">${keyName(wk)}</div><div class="eq">${enharm(wk) ? '= ' + enharm(wk) : '&nbsp;'}</div></div></div>
        <dl class="kv">${ss.startedAt ? `<dt>Comenzó</dt><dd>${fmtDate(ss.startedAt, { year: 1 })}</dd>` : ''}${ss.endedAt ? `<dt>Terminó</dt><dd>${fmtDate(ss.endedAt, { year: 1 })}</dd>` : ''}${ss.notes ? `<dt>Observaciones</dt><dd>${esc(ss.notes)}</dd>` : ''}</dl>
        <div class="links" style="margin-top:12px">${ss.link ? `<a href="${esc(ss.link)}" target="_blank" rel="noopener">${ic('play', 'sm')}Original</a>` : ''}${ss.karaoke ? `<a href="${esc(ss.karaoke)}" target="_blank" rel="noopener">${ic('mic', 'sm')}Instrumental</a>` : ''}${(ss.recordings || []).map(r => `<a href="${esc(r.url)}" target="_blank" rel="noopener">${ic('link', 'sm')}${esc(r.label || 'Grabación')}${r.date ? ' · ' + fmtDate(r.date) : ''}</a>`).join('')}</div>
        ${other.length ? `<div class="group-t">Otras veces que la trabajó</div><div class="small muted">${other.map(x => `${fmtDate(x.startedAt)}${x.endedAt ? '–' + fmtDate(x.endedAt) : ''} en ${keyName(workKey(x))}`).join(' · ')}</div>` : ''}
        ${logs.length ? `<div class="group-t">En las clases</div>${logs.slice(0, 8).map(n => `<div class="small" style="margin-bottom:6px"><b>${fmtDate(n.date)}</b> <span class="muted">${esc([n.technique, n.progress, n.difficulties].filter(Boolean).join(' · ').slice(0, 140))}</span></div>`).join('')}` : ''}
        <div class="btns"><button class="btn sm" data-ed>${ic('edit', 'sm')}Editar</button>${ss.endedAt ? `<button class="btn sm" data-again>${ic('repeat', 'sm')}Volver a trabajarla</button>` : `<button class="btn sm" data-end>${ic('check', 'sm')}Terminada</button>`}</div>
        <button class="btn sm ghost danger full" style="margin-top:6px" data-del>${ic('trash', 'sm')}Eliminar</button>`;
    },
    mount: (el, sh) => {
      const ss = byId('studentSongs', id); if (!ss) return;
      const q = s => el.querySelector(s);
      q('[data-ed]').onclick = () => songForm(ss, ss.studentId, () => sh.render());
      if (q('[data-end]')) q('[data-end]').onclick = () => { ss.endedAt = today(); upsert('studentSongs', ss); save(); sh.render(); render(); toast('Pasó a canciones anteriores'); };
      if (q('[data-again]')) q('[data-again]').onclick = () => {
        // vuelve a trabajarse: nuevo período, el anterior queda en el historial
        const n = upsert('studentSongs', Object.assign(clone(ss), { id: uid(), startedAt: today(), endedAt: '', recordings: [] }));
        save(); sh.close(); render(); setTimeout(() => songSheet(n.id), 250); toast('Canción en curso de nuevo (el período anterior queda guardado)');
      };
      q('[data-del]').onclick = async () => {
        if (!(await confirmDel('¿Eliminar esta canción del repertorio?', 'Se quita de este alumno. Los registros de clase se conservan.'))) return;
        removeRec('studentSongs', id); save(); sh.close(); render(); toast('Canción eliminada');
      };
    }
  });
}
// selector de tonalidad (12 notas + mayor/menor)
function keyPicker(name, k, allowEmpty) {
  const minor = k && k.minor;
  const sp = S.settings.accidentals === 'flat' ? 'f' : S.settings.accidentals === 'sharp' ? 's' : null;
  return `<div data-keypick="${name}" data-pc="${k && k.pc != null ? k.pc : ''}" data-minor="${minor ? 1 : 0}">
    <div class="keys ${S.settings.notation === 'lat' ? 'lat' : ''}">${[...Array(12)].map((_, pc) => { const kk = { pc, minor }; return `<button type="button" class="${BLACK.includes(pc) ? 'blk' : ''} ${k && +k.pc === pc ? 'on' : ''}" data-pc="${pc}">${keyName(kk, sp ? { spell: sp } : {}).replace(/m$/, '')}${BLACK.includes(pc) && !sp ? `<span class="dim" style="font-size:10px;display:block;margin-top:-3px">${keyName(kk, { spell: spellFor(kk) === 's' ? 'f' : 's' }).replace(/m$/, '')}</span>` : ''}</button>`; }).join('')}</div>
    <div class="seg" style="margin-top:8px"><button type="button" data-min="0" class="${!minor ? 'on' : ''}">Mayor</button><button type="button" data-min="1" class="${minor ? 'on' : ''}">Menor</button>${allowEmpty ? `<button type="button" data-clear class="${!k || k.pc == null ? 'on' : ''}">No sé</button>` : ''}</div></div>`;
}
const readKey = el => { if (!el || el.dataset.pc === '') return null; return { pc: +el.dataset.pc, minor: el.dataset.minor === '1' }; };

function songForm(ss, studentId, after) {
  const sg = ss ? byId('songs', ss.songId) || {} : {};
  const F = {
    title: sg.title || '', artist: sg.artist || '', key: sg.key || null, transpose: ss ? (ss.manual && ss.workKey && sg.key ? semisBetween(sg.key.pc, ss.workKey.pc) : (+ss.transpose || 0)) : 0,
    manual: ss ? !!ss.manual : false, workKey: ss ? workKey(ss) : null, startedAt: ss ? ss.startedAt || '' : today(), link: ss ? ss.link || '' : '', karaoke: ss ? ss.karaoke || '' : '',
    recordings: ss ? clone(ss.recordings || []) : [], notes: ss ? ss.notes || '' : '', songId: ss ? ss.songId : null
  };
  const sh = openSheet({
    title: ss ? 'Editar canción' : 'Nueva canción',
    body: () => {
      const wk = F.manual ? F.workKey : transposeKey(F.key, F.transpose);
      const q = norm(F.title);
      const sugg = !F.songId && q.length > 1 ? S.songs.filter(x => norm(x.title).includes(q)).slice(0, 4) : [];
      return `${field('Canción', inp('title', F.title, { ph: 'Nombre de la canción', attrs: 'autocomplete="off"' }))}
        ${sugg.length ? `<div class="chips" style="flex-wrap:wrap;margin:-4px 0 12px">${sugg.map(x => `<button type="button" class="chip" data-sugg="${x.id}">${esc(x.title)} · ${esc(x.artist || '')} ${x.key ? '(' + keyName(x.key) + ')' : ''}</button>`).join('')}</div>` : ''}
        ${F.songId ? `<div class="hint" style="margin-top:-8px">Canción de tu biblioteca. <a href="#" data-unlink>Usar como canción nueva</a></div>` : ''}
        ${field('Artista', inp('artist', F.artist, { ph: 'Intérprete original' }))}
        <label class="field"><span>Tonalidad original</span>${keyPicker('key', F.key, true)}</label>
        <div class="keybig"><div class="from"><div class="lab">Original</div><div class="kv">${keyName(F.key)}</div><div class="eq">${enharm(F.key) ? '= ' + enharm(F.key) : '&nbsp;'}</div></div>
          <div class="arrow"><div class="stepper" style="height:40px;margin:0 auto;max-width:150px"><button type="button" data-tr="-1">−</button><div class="val small">${fmtSemis(F.transpose)}</div><button type="button" data-tr="1">+</button></div><div class="xs" style="margin-top:4px">semitonos</div></div>
          <div class="to"><div class="lab">De trabajo</div><div class="kv">${keyName(wk)}</div><div class="eq">${enharm(wk) ? '= ' + enharm(wk) : '&nbsp;'}</div></div></div>
        <div class="list" style="margin-bottom:12px">${sw('manual', F.manual, 'Elegir la tonalidad de trabajo a mano', F.manual ? 'Los semitonos se calculan solos' : 'Se calcula con la transposición')}</div>
        ${F.manual ? `<label class="field"><span>Tonalidad de trabajo</span>${keyPicker('workKey', F.workKey, false)}</label>` : ''}
        ${field('Comenzó a trabajarla', inp('startedAt', F.startedAt, { type: 'date' }))}
        ${field('Enlace (YouTube, Spotify…)', inp('link', F.link, { type: 'url', ph: 'https://' }))}
        ${field('Instrumental o karaoke', inp('karaoke', F.karaoke, { type: 'url', ph: 'https://' }))}
        <label class="field"><span>Grabaciones del alumno</span>
          ${F.recordings.map((r, i) => `<div class="row" style="margin-bottom:6px"><input class="inp" data-rl="${i}" value="${esc(r.label)}" placeholder="Nombre" style="flex:1"><input class="inp" data-ru="${i}" value="${esc(r.url)}" placeholder="Enlace (Drive, WhatsApp…)" style="flex:2"><button type="button" class="iconbtn plain" data-rrm="${i}">${ic('x', 'sm')}</button></div>`).join('')}
          <button type="button" class="btn sm" data-radd>${ic('plus', 'sm')}Agregar grabación</button></label>
        ${field('Observaciones', txa('notes', F.notes, 'Ej: respirar antes del puente, cuidar el pasaje en el estribillo…', 3))}
        <button class="btn pri full" data-save>${ic('check', 'sm')}Guardar</button>`;
    },
    mount: (el, sh) => {
      const grab = () => {
        ['title', 'artist', 'startedAt', 'link', 'karaoke', 'notes'].forEach(n => { F[n] = fval(el, n); });
        F.recordings = F.recordings.map((r, i) => ({ id: r.id || uid(), label: (el.querySelector(`[data-rl="${i}"]`) || {}).value || '', url: (el.querySelector(`[data-ru="${i}"]`) || {}).value || '', date: r.date || today() }));
      };
      el.querySelectorAll('[data-keypick]').forEach(kp => {
        kp.querySelectorAll('[data-pc]').forEach(b => b.onclick = () => { grab(); const k = { pc: +b.dataset.pc, minor: kp.dataset.minor === '1' }; setK(kp.dataset.keypick, k); sh.render(); });
        kp.querySelectorAll('[data-min]').forEach(b => b.onclick = () => { grab(); const cur = readKey(kp) || { pc: 0 }; setK(kp.dataset.keypick, { pc: cur.pc, minor: b.dataset.min === '1' }); sh.render(); });
        const c = kp.querySelector('[data-clear]'); if (c) c.onclick = () => { grab(); F.key = null; sh.render(); };
      });
      function setK(name, k) {
        if (name === 'key') { F.key = k; if (F.manual && F.workKey) { F.workKey.minor = k.minor; F.transpose = semisBetween(k.pc, F.workKey.pc); } }
        else { F.workKey = k; if (F.key) { F.transpose = semisBetween(F.key.pc, k.pc); F.key.minor = k.minor; } }
      }
      el.querySelectorAll('[data-tr]').forEach(b => b.onclick = () => {
        grab(); F.transpose = Math.max(-11, Math.min(11, F.transpose + +b.dataset.tr));
        if (F.manual) { F.manual = false; } // cambiar semitonos vuelve al cálculo automático
        if (!F.key) toast('Elegí primero la tonalidad original', 'err');
        sh.render();
      });
      el.querySelector('[name=manual]').onchange = e => { grab(); F.manual = e.target.checked; F.workKey = transposeKey(F.key, F.transpose) || { pc: 0, minor: F.key ? F.key.minor : false }; sh.render(); };
      const ti = el.querySelector('[name=title]'); let t;
      if (!F.songId) ti.oninput = () => { clearTimeout(t); t = setTimeout(() => { grab(); const p = ti.selectionStart; sh.render(); const n = el.querySelector('[name=title]'); n.focus(); n.setSelectionRange(p, p); }, 250); };
      el.querySelectorAll('[data-sugg]').forEach(b => b.onclick = () => { grab(); const x = byId('songs', b.dataset.sugg); F.songId = x.id; F.title = x.title; F.artist = x.artist; F.key = x.key ? clone(x.key) : null; sh.render(); });
      const ul = el.querySelector('[data-unlink]'); if (ul) ul.onclick = e => { e.preventDefault(); grab(); F.songId = null; sh.render(); };
      el.querySelector('[data-radd]').onclick = () => { grab(); F.recordings.push({ id: uid(), label: '', url: '', date: today() }); sh.render(); };
      el.querySelectorAll('[data-rrm]').forEach(b => b.onclick = () => { grab(); F.recordings.splice(+b.dataset.rrm, 1); sh.render(); });
      el.querySelector('[data-save]').onclick = () => {
        grab();
        if (!F.title) return ferr(el, 'title', 'Escribí el nombre de la canción');
        for (const u of [F.link, F.karaoke, ...F.recordings.map(r => r.url)]) if (u && !/^https?:\/\//i.test(u)) return toast('Los enlaces tienen que empezar con https://', 'err');
        // biblioteca compartida: la misma canción puede usarse con varios alumnos
        let song = F.songId ? byId('songs', F.songId) : (ss ? byId('songs', ss.songId) : null);
        const shared = song && S.studentSongs.some(x => x.songId === song.id && (!ss || x.id !== ss.id));
        if (!song || (ss && !F.songId && shared && (norm(song.title) !== norm(F.title)))) song = S.songs.find(x => norm(x.title) === norm(F.title) && norm(x.artist) === norm(F.artist)) || { id: uid() };
        Object.assign(song, { title: F.title, artist: F.artist, key: F.key });
        upsert('songs', song);
        const rec = ss || { id: uid(), studentId, endedAt: '' };
        Object.assign(rec, {
          songId: song.id, transpose: F.transpose, manual: F.manual, workKey: F.manual ? F.workKey : null, startedAt: F.startedAt, link: F.link, karaoke: F.karaoke,
          recordings: F.recordings.filter(r => r.url), notes: F.notes
        });
        upsert('studentSongs', rec);
        save(); sh.close(); render(); if (after) after(); toast(ss ? 'Canción actualizada' : 'Canción agregada');
      };
    }
  });
}

/* ---------- historial de clases ---------- */
function stLessons(s) {
  const t = today();
  const ls = S.lessons.filter(l => (l.studentIds || []).includes(s.id) && (l.date <= t || l.status !== 'scheduled')).sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start));
  if (!ls.length) return `<div class="empty">${ic('cal')}<div class="t">Sin clases registradas</div><div class="small">Las clases realizadas y sus registros aparecen acá en orden cronológico.</div></div>`;
  const done = ls.filter(l => l.status === 'done');
  return `<div class="small muted" style="margin:0 2px 14px">${done.length} realizadas · ${fmtHours(done.reduce((a, l) => a + (+l.realDur || +l.duration), 0))} de clase</div>
    <div class="timeline">${ls.map(l => {
    const n = S.lessonNotes.find(x => x.lessonId === l.id && x.studentId === s.id);
    const st = STATUS[l.status];
    const songs = n ? (n.songs || []).map(id => { const ss = byId('studentSongs', id); const sg = ss && byId('songs', ss.songId); return sg ? `${sg.title} (${keyName(workKey(ss))})` : ''; }).filter(Boolean).join(', ') : '';
    const rows = n ? [['Canciones', songs], ['Ejercicios', n.exercises], ['Técnica', n.technique], ['Dificultades', n.difficulties], ['Avances', n.progress], ['Próxima', n.nextGoals], ['Notas', n.notes]].filter(r => r[1]) : [];
    return `<div class="tl ${l.status !== 'done' ? 'off' : ''}"><div class="hd"><b>${fmtDate(l.date, { dow: 1, year: l.date.slice(0, 4) !== t.slice(0, 4) })}</b><span class="small muted">${l.start} · ${fmtDur(+l.realDur || l.duration)}</span><span class="pill ${st.c}">${st.s}</span>${lessonMode(l) === 'group' ? '<span class="pill group">Grupal</span>' : ''}<button class="mini" style="margin-left:auto" data-act="openLesson" data-id="${l.id}">${n ? 'Ver' : (l.status === 'done' ? 'Registrar' : 'Ver')}</button></div>
      ${rows.length ? `<div class="logbox">${rows.map(r => `<div class="r"><span>${r[0]}</span><span>${esc(r[1])}</span></div>`).join('')}</div>` : ''}</div>`;
  }).join('')}</div>`;
}

/* ---------- notas independientes ---------- */
function stNotes(s) {
  const ns = S.vocalNotes.filter(n => n.studentId === s.id).sort((a, b) => (b.pinned - a.pinned) || b.date.localeCompare(a.date));
  return `<div class="row" style="margin:4px 0 12px"><div class="grow small muted">Notas libres, no ligadas a una clase. Las fijadas aparecen antes de cada clase.</div><button class="btn sm pri" data-act="newNote" data-id="${s.id}">${ic('plus', 'sm')}Nota</button></div>
    ${ns.length ? ns.map(n => `<div class="note ${n.pinned ? 'pin' : ''}"><div class="row small muted" style="margin-bottom:4px">${n.pinned ? ic('pin', 'sm') : ''}<span class="grow">${fmtDate(n.date, { year: 1 })}${n.title ? ' · <b style="color:var(--tx)">' + esc(n.title) + '</b>' : ''}</span><button class="iconbtn plain" style="width:30px;height:30px" data-act="editNote" data-id="${n.id}">${ic('more', 'sm')}</button></div><div class="txt">${esc(n.text)}</div></div>`).join('')
      : `<div class="empty">${ic('book')}<div class="t">Sin notas</div></div>`}`;
}
ACT.newNote = el => noteForm(null, el.dataset.id);
ACT.editNote = el => noteForm(byId('vocalNotes', el.dataset.id));
function noteForm(n, sid) {
  openSheet({
    title: n ? 'Editar nota' : 'Nueva nota',
    body: () => `${field('Título (opcional)', inp('title', n && n.title, { ph: 'Ej: Pasaje de registro' }))}
      ${field('Nota', txa('text', n && n.text, 'Lo que quieras recordar sobre su voz o su proceso…', 6))}
      <div class="list" style="margin-bottom:14px">${sw('pinned', n && n.pinned, 'Fijar', 'Se muestra en el resumen antes de cada clase')}</div>
      <button class="btn pri full" data-save>${ic('check', 'sm')}Guardar</button>${n ? `<button class="btn ghost danger full" style="margin-top:6px" data-del>${ic('trash', 'sm')}Eliminar</button>` : ''}`,
    mount: (el, sh) => {
      el.querySelector('[data-save]').onclick = () => {
        const text = fval(el, 'text');
        if (!text) return ferr(el, 'text', 'La nota está vacía');
        upsert('vocalNotes', Object.assign(n || { id: uid(), studentId: sid, date: today() }, { title: fval(el, 'title'), text, pinned: fval(el, 'pinned') }));
        save(); sh.close(); render(); toast('Nota guardada');
      };
      const d = el.querySelector('[data-del]');
      if (d) d.onclick = async () => { if (!(await confirmDel('¿Eliminar esta nota?', 'No se puede deshacer.'))) return; removeRec('vocalNotes', n.id); save(); sh.close(); render(); };
    }
  });
}

/* ---------- ficha ---------- */
function stInfo(s) {
  const row = (k, v) => v ? `<dt>${k}</dt><dd>${esc(v)}</dd>` : '';
  const sc = school(s.schoolId);
  return `<div class="group-t">Datos personales</div><div class="card"><dl class="kv">
      ${row('Teléfono', s.phone)}${row('Email', s.email)}${row('Ingreso', s.joined && fmtDate(s.joined, { year: 1 }))}${row('Escuela', sc.name)}${row('Estado', ST_STATUS[s.status])}${row('Información', s.info)}
    </dl></div>
    <div class="group-t">Información pedagógica</div><div class="card"><dl class="kv">
      ${row('Clasificación', s.voiceType)}${row('Extensión', rangeTxt(s))}${row('Objetivos', s.goals)}${row('Experiencia', s.experience)}${row('Fortalezas', s.strengths)}${row('Dificultades', s.difficulties)}${row('Observaciones', s.observations)}
    </dl>${!s.goals && !s.experience && !s.strengths && !s.difficulties && !s.voiceType && !rangeTxt(s) ? '<div class="small muted">Sin completar.</div>' : ''}</div>
    <div class="sp"></div><button class="btn full" data-act="editStudent" data-id="${s.id}">${ic('edit', 'sm')}Editar ficha</button>`;
}
function studentForm(s, o = {}) {
  const F = s ? clone(s) : { first: o.first || '', last: '', status: 'active', joined: today(), schoolId: UI.stuSchool || (activeSchools()[0] || {}).id, photo: '' };
  const notes = [...Array(61)].map((_, i) => [36 + i, midiName(36 + i)]);
  const sh = openSheet({
    title: s ? 'Editar alumno' : 'Nuevo alumno',
    body: () => `<div class="row" style="margin-bottom:16px">${avatar(F, 'xl')}<div class="grow"><label class="btn sm">${ic('camera', 'sm')}${F.photo ? 'Cambiar foto' : 'Agregar foto'}<input type="file" accept="image/*" data-photo hidden></label>${F.photo ? `<button class="btn sm ghost" data-nophoto>Quitar</button>` : ''}</div></div>
      <div class="grid2">${field('Nombre', inp('first', F.first, { attrs: 'autocomplete="off"' }))}${field('Apellido', inp('last', F.last, { attrs: 'autocomplete="off"' }))}</div>
      <div class="grid2">${field('Teléfono', inp('phone', F.phone, { type: 'tel', ph: '+598…' }))}${field('Email', inp('email', F.email, { type: 'email' }))}</div>
      <div class="grid2">${field('Fecha de ingreso', inp('joined', F.joined, { type: 'date' }))}${field('Estado', sel('status', F.status, Object.entries(ST_STATUS)))}</div>
      ${field('Escuela', sel('schoolId', F.schoolId, S.schools.filter(x => !x.archived || x.id === F.schoolId).map(x => [x.id, x.name])), activeSchools().length < 2 ? 'Podés agregar escuelas en Configuración.' : '')}
      ${field('Información adicional', txa('info', F.info, '', 2))}
      <div class="group-t">Información pedagógica</div>
      ${field('Objetivos personales', txa('goals', F.goals, '', 2))}
      ${field('Experiencia previa', txa('experience', F.experience, '', 2))}
      <div class="grid2">${field('Fortalezas vocales', txa('strengths', F.strengths, '', 2))}${field('Dificultades identificadas', txa('difficulties', F.difficulties, '', 2))}</div>
      <div class="grid2">${field('Nota más grave', sel('rangeLow', F.rangeLow ?? '', [['', '—'], ...notes]))}${field('Nota más aguda', sel('rangeHigh', F.rangeHigh ?? '', [['', '—'], ...notes]))}</div>
      ${field('Clasificación vocal orientativa', inp('voiceType', F.voiceType, { ph: 'Ej: mezzosoprano, tenor ligero…', attrs: 'list="vtypes"' }))}<datalist id="vtypes">${['Soprano', 'Mezzosoprano', 'Contralto', 'Contratenor', 'Tenor', 'Barítono', 'Bajo'].map(v => `<option value="${v}">`).join('')}</datalist>
      ${field('Observaciones generales', txa('observations', F.observations, '', 3))}
      <button class="btn pri full" data-save>${ic('check', 'sm')}Guardar</button>
      ${s ? `<button class="btn ghost danger full" style="margin-top:6px" data-del>${ic('trash', 'sm')}Eliminar alumno</button>` : ''}`,
    mount: (el, sh) => {
      const fields = ['first', 'last', 'phone', 'email', 'joined', 'status', 'schoolId', 'info', 'goals', 'experience', 'strengths', 'difficulties', 'rangeLow', 'rangeHigh', 'voiceType', 'observations'];
      const grab = () => fields.forEach(n => { F[n] = fval(el, n); });
      el.querySelector('[data-photo]').onchange = async e => {
        const f = e.target.files[0]; if (!f) return;
        try { grab(); F.photo = await readPhoto(f); sh.render(); } catch (er) { toast(er.message, 'err'); }
      };
      const np = el.querySelector('[data-nophoto]'); if (np) np.onclick = () => { grab(); F.photo = ''; sh.render(); };
      el.querySelector('[data-save]').onclick = () => {
        grab();
        if (!F.first) return ferr(el, 'first', 'Escribí el nombre');
        if (F.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(F.email)) return ferr(el, 'email', 'El email no parece válido');
        if (F.rangeLow !== '' && F.rangeHigh !== '' && +F.rangeLow > +F.rangeHigh) return ferr(el, 'rangeLow', 'La nota grave es más aguda que la aguda');
        const rec = upsert('students', F);
        save(); sh.close(); render(); toast(s ? 'Cambios guardados' : 'Alumno creado');
        if (o.onSave) o.onSave(rec);
      };
      const d = el.querySelector('[data-del]');
      if (d) d.onclick = async () => {
        const n = S.lessons.filter(l => (l.studentIds || []).includes(s.id) && l.status !== 'scheduled').length;
        const v = await ask('¿Eliminar a ' + sName(s) + '?', n ? `Tiene ${n} clases en el historial. Si lo eliminás, esas clases siguen contando en tus horas e ingresos pero pierden el nombre. <b>Te conviene marcarlo como inactivo.</b>` : 'Se borran su ficha, repertorio y notas.', [
          { label: 'Marcar como inactivo', val: 'inactive' }, { label: 'Eliminar definitivamente', val: 'del', cls: 'danger' }, { label: 'Cancelar', val: null, cls: 'ghost' }]);
        if (v === 'inactive') { s.status = 'inactive'; upsert('students', s); save(); sh.close(); render(); toast('Marcado como inactivo'); return; }
        if (v !== 'del') return;
        S.studentSongs.filter(x => x.studentId === s.id).forEach(x => removeRec('studentSongs', x.id));
        S.vocalNotes.filter(x => x.studentId === s.id).forEach(x => removeRec('vocalNotes', x.id));
        S.lessonNotes.filter(x => x.studentId === s.id).forEach(x => removeRec('lessonNotes', x.id));
        // series solo de este alumno: se cortan desde hoy
        S.series.filter(x => (x.studentIds || []).includes(s.id)).forEach(x => {
          if (x.studentIds.length === 1) endSeriesAt(x, today()); else { x.studentIds = x.studentIds.filter(i => i !== s.id); upsert('series', x); }
        });
        S.lessons.filter(l => (l.studentIds || []).includes(s.id) && l.status === 'scheduled' && l.date >= today()).forEach(l => {
          if (l.studentIds.length === 1) removeRec('lessons', l.id); else { l.studentIds = l.studentIds.filter(i => i !== s.id); upsert('lessons', l); }
        });
        removeRec('students', s.id);
        save(); sh.close(); go('#/students'); toast('Alumno eliminado');
      };
    }
  });
}
