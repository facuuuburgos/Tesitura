'use strict';
/* =========================================================
   Tesitura · configuración, escuelas, cuenta y datos
   ========================================================= */
const CURRENCIES = [['UYU', 'Pesos uruguayos (UYU)'], ['USD', 'Dólares (USD)'], ['ARS', 'Pesos argentinos (ARS)'], ['EUR', 'Euros (EUR)'], ['BRL', 'Reales (BRL)'], ['CLP', 'Pesos chilenos (CLP)'], ['MXN', 'Pesos mexicanos (MXN)']];
const COLORS = ['#E3A67A', '#A597FF', '#7FB2C8', '#6CC996', '#E8C46A', '#EF7A72', '#D98BC4', '#B9B8BE'];

VIEWS.settings = () => {
  const st = S.settings;
  const L = (label, sub, right, act, attrs = '') => `<button class="li tap" ${act ? `data-act="${act}"` : ''} ${attrs}><div class="grow"><div class="t">${label}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>${right || ic('chevR', 'sm chev')}</button>`;
  return `${topbar('Configuración', { back: '#/' })}
    <div class="group-t">Tus datos (aparecen en las facturas)</div>
    <div class="card"><div class="grid2">${field('Nombre y apellido', `<input class="inp" data-set="teacher" value="${esc(st.teacher)}" placeholder="Facundo Burgos">`)}${field('Email', `<input class="inp" type="email" data-set="email" value="${esc(st.email)}">`)}</div>
      ${field('Instagram', `<input class="inp" data-set="ig" value="${esc(st.ig)}" placeholder="@usuario">`)}</div>

    <div class="group-t">Escuelas y tarifas</div>
    <div class="list">${S.schools.map(sc => `<a class="li" href="#/school/${sc.id}"><span class="dot" style="background:${esc(sc.color)};width:12px;height:12px"></span><div class="grow"><div class="t">${esc(sc.name)}${sc.archived ? ' <span class="pill">Archivada</span>' : ''}</div><div class="s">${money(rateAt(sc, today(), 'ind'), sc.currency)}/h individual · ${money(rateAt(sc, today(), 'group'), sc.currency)}/h grupal · ${S.students.filter(s => s.schoolId === sc.id && s.status === 'active').length} alumnos</div></div>${ic('chevR', 'sm chev')}</a>`).join('')}
      ${L(`<span style="color:var(--acc)">Agregar escuela</span>`, '', ic('plus', 'sm'), 'newSchool')}</div>
    <div class="hint" style="margin-top:8px">Cada escuela tiene sus tarifas, su moneda, sus reglas de cobro (ausencias, cancelaciones, reposiciones) y su propia numeración de facturas.</div>

    <div class="group-t">Clases y calendario</div>
    <div class="card">
      <div class="grid2">${field('Duración habitual', `<select class="inp" data-set="defDur" data-num>${[30, 45, 60, 75, 90, 120].map(m => `<option value="${m}" ${+st.defDur === m ? 'selected' : ''}>${m} min</option>`).join('')}</select>`)}
      ${field('Vista inicial', `<select class="inp" data-set="defView">${[['day', 'Día'], ['week', 'Semana'], ['month', 'Mes']].map(o => `<option value="${o[0]}" ${st.defView === o[0] ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`)}</div>
      <div class="grid2">${field('El calendario empieza', `<input class="inp" type="time" data-set="dayStart" value="${st.dayStart}">`)}${field('y termina', `<input class="inp" type="time" data-set="dayEnd" value="${st.dayEnd}">`)}</div>
      ${field('La semana empieza el', `<select class="inp" data-set="weekStart" data-num><option value="1" ${+st.weekStart === 1 ? 'selected' : ''}>Lunes</option><option value="0" ${+st.weekStart === 0 ? 'selected' : ''}>Domingo</option></select>`)}
    </div>
    <div class="group-t">Horarios habituales</div>
    <div class="list">${(st.hours || []).sort((a, b) => (mod(a.d - 1, 7) - mod(b.d - 1, 7)) || a.start.localeCompare(b.start)).map((h, i) => `<div class="li"><div class="grow"><div class="t" style="text-transform:capitalize">${DOW_L[h.d]}</div><div class="s">${h.start} a ${h.end}</div></div><button class="iconbtn plain" data-act="delHour" data-i="${i}">${ic('trash', 'sm')}</button></div>`).join('')}
      ${L(`<span style="color:var(--acc)">Agregar horario</span>`, '', ic('plus', 'sm'), 'addHour')}</div>
    <div class="hint" style="margin-top:8px">Se marcan suavemente en el calendario para ver de un vistazo tus franjas de trabajo.</div>

    <div class="group-t">Notación</div>
    <div class="card">
      ${field('Nombres de notas (extensión vocal)', `<div class="seg"><button data-act="setOpt" data-k="notation" data-v="en" class="${st.notation === 'en' ? 'on' : ''}">C D E F G A B</button><button data-act="setOpt" data-k="notation" data-v="lat" class="${st.notation === 'lat' ? 'on' : ''}">Do Re Mi Fa Sol</button></div>`)}
    </div>

    <div class="group-t">Ingresos</div>
    <div class="list">${sw('projection', st.projection, 'Mostrar proyección', 'Estima lo que podés generar con las clases agendadas')}</div>
    <div class="list" style="margin-top:8px">${sw('fxConvert', st.fxConvert !== false, 'Convertir los totales a ' + (st.currency || 'UYU'), 'El total del mes y la proyección suman todas las escuelas con la cotización del día')}
      ${st.fxConvert !== false ? `<div class="li"><div class="grow"><div class="t">Cotización del dólar</div><div class="s">${fxRate('USD') != null ? fxNote() + (+st.fxManual > 0 ? '' : ' · se actualiza sola') : 'Todavía no se pudo obtener'}</div></div><button class="mini" data-act="fxRefresh">${ic('repeat', 'sm')}Actualizar</button></div>
      <div class="li"><div class="grow"><div class="t">Usar una cotización fija</div><div class="s">Opcional. Dejalo vacío para usar la del día</div></div><input class="inp" style="width:110px;min-height:38px;padding:6px 10px" type="number" step="0.01" min="0" inputmode="decimal" data-set="fxManual" value="${esc(st.fxManual || '')}" placeholder="Ej: 40,5"></div>` : ''}</div>
    <div class="card" style="margin-top:8px">${field('Moneda principal (y de escuelas nuevas)', `<select class="inp" data-set="currency">${CURRENCIES.map(c => `<option value="${c[0]}" ${st.currency === c[0] ? 'selected' : ''}>${c[1]}</option>`).join('')}</select>`)}</div>

    <div class="group-t">Recordatorios</div>
    <div class="list">${sw('remind', st.remind, 'Avisarme antes de cada clase', 'Funciona mientras la app está abierta')}
      ${st.remind ? `<div class="li"><div class="grow">Anticipación</div><select class="inp" style="width:130px;min-height:38px;padding:6px 30px 6px 10px" data-set="remindMin" data-num>${[5, 10, 15, 30, 60].map(m => `<option value="${m}" ${+st.remindMin === m ? 'selected' : ''}>${m} min</option>`).join('')}</select></div>` : ''}
      ${L('Agregar mis clases al Calendario del iPhone', 'Descarga las próximas 12 semanas con alarma. Repetilo si cambiás horarios.', ic('download', 'sm'), 'exportIcs')}</div>

    <div class="group-t">Cuenta y sincronización</div>
    <div class="list" data-sync="${syncState}">
      <div class="li"><span class="syncdot"></span><div class="grow"><div class="t">${AUTH ? esc(AUTH.user.email) : 'Sin cuenta'}</div><div class="s synctxt">${syncLabel()}</div></div></div>
      ${AUTH ? L('Sincronizar ahora', '', ic('repeat', 'sm'), 'syncNow') + L('<span style="color:var(--bad)">Cerrar sesión</span>', 'Tus datos quedan guardados en la nube', '', 'logout')
      : L('<span style="color:var(--acc)">Iniciar sesión o crear cuenta</span>', 'Para usar la app en el iPhone y la compu con los mismos datos. Podés usar la misma cuenta de Entreno.', ic('cloud', 'sm'), 'login')}
    </div>

    <div class="group-t">Datos</div>
    <div class="list">
      ${L('Exportar copia de seguridad', 'Archivo con todos tus datos', ic('download', 'sm'), 'backup')}
      ${L('Restaurar copia de seguridad', 'Reemplaza los datos de este dispositivo', ic('upload', 'sm'), 'restore')}
      ${L('Importar shows desde archivo', 'Crea los shows con tus alumnos registrados', ic('upload', 'sm'), 'importShows')}
      ${L('Exportar todo a Excel', 'Alumnos, clases, repertorio y registros', ic('table', 'sm'), 'exportAllXls')}
      ${L('<span style="color:var(--bad)">Borrar todos los datos</span>', '', '', 'wipe')}
    </div>
    <input type="file" id="restoreFile" accept="application/json,.json" hidden>
    <div class="center small dim" style="margin-top:22px">Versión <span class="num">${esc((document.querySelector('meta[name=app-version]') || {}).content || '')}</span> · <a href="#" data-act="checkUpdate">Buscar actualización</a></div>
    <div class="credit" style="margin-top:8px">Tesitura · hecha para ${esc(st.teacher || 'Facundo Burgos')} · <a href="https://instagram.com/facuuuburgos" target="_blank" rel="noopener">@facuuuburgos</a></div>`;
};
AFTER.settings = m => {
  m.querySelectorAll('[data-set]').forEach(el => el.addEventListener('change', () => {
    const k = el.dataset.set; let v = el.value.trim();
    if (el.hasAttribute('data-num')) v = +v;
    if (k === 'ig') v = v.replace(/^@/, '');
    if ((k === 'dayStart' || k === 'dayEnd') && toMin(S.settings.dayStart) >= toMin(S.settings.dayEnd) && false) return;
    S.settings[k] = v; S.settings.u = Date.now(); save();
    if (k === 'dayEnd' && toMin(S.settings.dayEnd) <= toMin(S.settings.dayStart)) { toast('El fin tiene que ser posterior al inicio', 'err'); S.settings.dayEnd = '22:00'; save(); render(); return; }
    if (['remindMin', 'fxManual', 'currency'].includes(k)) render();
    toast('Guardado');
  }));
  m.querySelectorAll('.switch input').forEach(el => el.addEventListener('change', async () => {
    const k = el.name;
    if (k === 'remind' && el.checked && 'Notification' in window && Notification.permission === 'default') { try { await Notification.requestPermission(); } catch (e) { } }
    S.settings[k] = el.checked; S.settings.u = Date.now(); save(); render();
  }));
  const rf = m.querySelector('#restoreFile');
  rf.onchange = async () => {
    const f = rf.files[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || !Array.isArray(d.students) || !Array.isArray(d.lessons)) throw new Error('El archivo no es una copia de Tesitura');
      if (!(await confirmDel('¿Restaurar esta copia?', `Contiene ${d.students.length} alumnos y ${d.lessons.length} clases. Reemplaza lo que hay en este dispositivo${AUTH ? ' y en tu cuenta' : ''}.`, 'Restaurar'))) return;
      const ls = S.lastSync; S = migrate(d); S.lastSync = ls; S.updatedAt = Date.now();
      // marca todo como recién editado para que gane al sincronizar
      COLLS.forEach(c => S[c].forEach(x => x.u = Date.now())); S.settings.u = Date.now();
      save(); render(); toast('Copia restaurada');
    } catch (e) { toast(e.message, 'err'); }
    rf.value = '';
  };
};
ACT.fxRefresh = () => loadFx(true);
ACT.setOpt = el => { S.settings[el.dataset.k] = el.dataset.v; S.settings.u = Date.now(); save(); render(); };
ACT.delHour = el => { const hs = S.settings.hours.sort((a, b) => (mod(a.d - 1, 7) - mod(b.d - 1, 7)) || a.start.localeCompare(b.start)); hs.splice(+el.dataset.i, 1); S.settings.u = Date.now(); save(); render(); };
ACT.addHour = () => openSheet({
  title: 'Horario habitual',
  body: () => `<label class="field"><span>Días</span><div class="chips" style="flex-wrap:wrap">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button type="button" class="chip acc" data-d="${d}">${DOW_S[d]}</button>`).join('')}</div></label>
    <div class="grid2">${field('Desde', inp('start', '15:00', { type: 'time' }))}${field('Hasta', inp('end', '20:00', { type: 'time' }))}</div>
    <button class="btn pri full" data-save>${ic('check', 'sm')}Agregar</button>`,
  mount: (el, sh) => {
    el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => b.classList.toggle('on'));
    el.querySelector('[data-save]').onclick = () => {
      const ds = $$('[data-d].on', el).map(b => +b.dataset.d), a = fval(el, 'start'), b = fval(el, 'end');
      if (!ds.length) return toast('Elegí al menos un día', 'err');
      if (!a || !b || toMin(b) <= toMin(a)) return ferr(el, 'end', 'El horario no es válido');
      S.settings.hours = [...(S.settings.hours || []), ...ds.map(d => ({ d, start: a, end: b }))]; S.settings.u = Date.now();
      save(); sh.close(); render();
    };
  }
});

/* ---------- escuela ---------- */
ACT.newSchool = () => {
  const sc = upsert('schools', Object.assign(defaultSchool(), { id: uid(), name: 'Nueva escuela', color: COLORS[S.schools.length % COLORS.length], currency: S.settings.currency || 'UYU', rates: [{ id: uid(), from: '2000-01-01', ind: 0, grp: 0 }] }));
  save(); go('#/school/' + sc.id);
};
VIEWS.school = id => {
  const sc = byId('schools', id);
  if (!sc) return `${topbar('Escuela', { back: '#/settings' })}<div class="empty">No se encontró la escuela</div>`;
  const rates = [...sc.rates].sort((a, b) => b.from.localeCompare(a.from));
  const R = sc.rules;
  const n = S.lessons.filter(l => l.schoolId === sc.id).length + S.series.filter(s => s.schoolId === sc.id).length;
  return `${topbar(esc(sc.name), { back: '#/settings' })}
    <div class="card">
      ${field('Nombre', `<input class="inp" data-f="name" value="${esc(sc.name)}">`)}
      <label class="field"><span>Color</span><div class="chips">${COLORS.map(c => `<button class="chip" data-act="scColor" data-id="${sc.id}" data-v="${c}" style="width:34px;padding:0;justify-content:center;background:${c};border-color:${sc.color === c ? 'var(--tx)' : 'transparent'};${sc.color === c ? 'box-shadow:0 0 0 2px var(--bg) inset' : ''}" aria-label="${c}"></button>`).join('')}</div></label>
      <div class="grid2">${field('Moneda', `<select class="inp" data-f="currency">${CURRENCIES.map(c => `<option value="${c[0]}" ${sc.currency === c[0] ? 'selected' : ''}>${c[0]}</option>`).join('')}</select>`)}
      ${field('Idioma de la factura', `<select class="inp" data-f="lang"><option value="es" ${sc.lang === 'es' ? 'selected' : ''}>Español</option><option value="en" ${sc.lang === 'en' ? 'selected' : ''}>English</option></select>`)}</div>
    </div>

    <div class="group-t">Tarifas por hora</div>
    <div class="list">${rates.map((r, i) => `<div class="li"><div class="grow"><div class="t num">${money(+r.ind, sc.currency)} individual · ${money(+r.grp, sc.currency)} grupal</div><div class="s">${r.from <= '2000-01-01' ? 'Desde siempre' : 'Desde el ' + fmtDate(r.from, { year: 1 })}${i === 0 ? ' · vigente' : ''}</div></div>
      <button class="iconbtn plain" data-act="editRate" data-id="${sc.id}" data-r="${r.id}">${ic('edit', 'sm')}</button></div>`).join('')}
      <button class="li tap" data-act="editRate" data-id="${sc.id}"><div class="grow t" style="color:var(--acc)">Cambiar tarifa a partir de una fecha</div>${ic('plus', 'sm')}</button></div>
    <div class="hint" style="margin-top:8px">La tarifa grupal es por hora de clase, sin importar cuántos alumnos participen. Al cambiar la tarifa desde una fecha, las clases anteriores conservan la tarifa que tenían.</div>

    <div class="group-t">Qué se cobra y se factura</div>
    <div class="list">
      <div class="switch"><div class="grow"><div>Clases realizadas</div><div class="small muted">Siempre, proporcional a la duración dictada</div></div><input type="checkbox" checked disabled><span class="tg" style="opacity:.6"></span></div>
      ${sw('absent', R.absent, 'Ausencias del alumno', 'El alumno no vino y no avisó')}
      ${sw('cancelStudent', R.cancelStudent, 'Clases que canceló el alumno', '')}
      ${sw('cancelTeacher', R.cancelTeacher, 'Clases que cancelé yo', '')}
      ${sw('makeupDouble', R.makeupDouble, 'Cobrar la reposición aunque la clase original ya se haya cobrado', 'Si está apagado, nunca se cobra dos veces la misma clase')}
    </div>
    <div class="hint" style="margin-top:8px">Las clases <b>reprogramadas</b> nunca se cuentan: se cobra la reposición cuando efectivamente se realiza. Estas reglas definen tanto la factura como tus ingresos en estadísticas.</div>

    <div class="group-t">Días sin clases</div>
    <div class="list">${S.closures.filter(c => c.schoolId === sc.id).sort((a, b) => b.from.localeCompare(a.from)).slice(0, 12).map(c => `<button class="li tap" data-act="editClosure" data-id="${c.id}"><div class="grow"><div class="t">${closureTxt(c)}</div><div class="s">${c.reason ? esc(c.reason) + ' · ' : ''}${c.charged ? 'Se cobra' : 'No se cobra'}</div></div>${ic('chevR', 'sm chev')}</button>`).join('')}
      <button class="li tap" data-act="newClosure" data-school="${sc.id}"><div class="grow t" style="color:var(--acc)">Marcar día sin clases</div>${ic('plus', 'sm')}</button></div>
    <div class="hint" style="margin-top:8px">Las clases de esos días quedan como “sin clases” y vos elegís si se cobran o no.</div>

    <div class="group-t">Facturas</div>
    <div class="card">
      ${field('A nombre de', `<input class="inp" data-f="billTo" value="${esc(sc.billTo)}" placeholder="Ej: tu jefe o la escuela">`)}
      ${field('Email de facturación', `<input class="inp" type="email" data-f="billToEmail" value="${esc(sc.billToEmail)}">`)}
      <div class="grid2">${field('Prefijo', `<input class="inp" data-f="prefix" value="${esc(sc.prefix)}" placeholder="Ej: BW-">`)}${field('Próximo número', `<input class="inp" type="number" min="1" inputmode="numeric" data-f="nextNo" data-num value="${+sc.nextNo || 1}">`)}</div>
      <div class="hint">Próxima factura: N° ${esc(invNumber(sc, sc.nextNo || 1))}</div>
      ${field('Nota al pie (opcional)', `<textarea class="inp" data-f="invoiceNote" rows="2" placeholder="Ej: datos de pago">${esc(sc.invoiceNote || '')}</textarea>`)}
    </div>
    <div class="sp"></div>
    <div class="list">
      <button class="li tap" data-act="archiveSchool" data-id="${sc.id}"><div class="grow t">${sc.archived ? 'Reactivar escuela' : 'Archivar escuela'}</div><div class="s">${sc.archived ? '' : 'Deja de aparecer, conserva el historial'}</div></button>
      ${n ? '' : `<button class="li tap" data-act="delSchool" data-id="${sc.id}"><div class="grow t" style="color:var(--bad)">Eliminar escuela</div></button>`}
    </div>`;
};
AFTER.school = m => {
  const sc = byId('schools', R.params[0]); if (!sc) return;
  m.querySelectorAll('[data-f]').forEach(el => el.addEventListener('change', () => {
    let v = el.value.trim(); if (el.hasAttribute('data-num')) v = Math.max(1, Math.round(+v || 1));
    if (el.dataset.f === 'name' && !v) { toast('El nombre no puede quedar vacío', 'err'); el.value = sc.name; return; }
    sc[el.dataset.f] = v; upsert('schools', sc); save(); toast('Guardado');
    if (['name', 'nextNo', 'prefix', 'currency'].includes(el.dataset.f)) render();
  }));
  m.querySelectorAll('.switch input[name]').forEach(el => el.addEventListener('change', () => { sc.rules[el.name] = el.checked; upsert('schools', sc); save(); toast('Regla actualizada'); }));
};
ACT.scColor = el => { const sc = byId('schools', el.dataset.id); sc.color = el.dataset.v; upsert('schools', sc); save(); render(); };
ACT.archiveSchool = el => { const sc = byId('schools', el.dataset.id); if (!sc.archived && activeSchools().length < 2) return toast('Necesitás al menos una escuela activa', 'err'); sc.archived = !sc.archived; upsert('schools', sc); save(); render(); };
ACT.delSchool = async el => {
  const sc = byId('schools', el.dataset.id);
  if (S.schools.length < 2) return toast('Necesitás al menos una escuela', 'err');
  if (!(await confirmDel('¿Eliminar ' + sc.name + '?', 'No tiene clases asociadas.'))) return;
  const other = activeSchools().find(x => x.id !== sc.id) || S.schools.find(x => x.id !== sc.id);
  S.students.filter(s => s.schoolId === sc.id).forEach(s => { s.schoolId = other.id; upsert('students', s); });
  removeRec('schools', sc.id); save(); go('#/settings');
};
ACT.editRate = el => {
  const sc = byId('schools', el.dataset.id), r = el.dataset.r ? sc.rates.find(x => x.id === el.dataset.r) : null;
  const cur = r || { from: today(), ind: rateAt(sc, today(), 'ind'), grp: rateAt(sc, today(), 'group') };
  openSheet({
    title: r ? 'Editar tarifa' : 'Nueva tarifa',
    body: () => `${r && r.from <= '2000-01-01' ? '<div class="hint">Tarifa base (aplica a todas las clases anteriores a otros cambios).</div>' : field('Vigente desde', inp('from', cur.from, { type: 'date' }))}
      <div class="grid2">${field('Individual, por hora (' + sc.currency + ')', inp('ind', cur.ind, { type: 'number', attrs: 'min="0" step="any" inputmode="decimal"' }))}${field('Grupal, por hora (' + sc.currency + ')', inp('grp', cur.grp, { type: 'number', attrs: 'min="0" step="any" inputmode="decimal"' }))}</div>
      <div class="hint">Ejemplo: con ${money(+cur.ind || 0, sc.currency)}/h, una clase de 45 min genera ${money((+cur.ind || 0) * .75, sc.currency)}.</div>
      <button class="btn pri full" data-save>${ic('check', 'sm')}Guardar</button>
      ${r && sc.rates.length > 1 ? `<button class="btn ghost danger full" style="margin-top:6px" data-del>${ic('trash', 'sm')}Eliminar este cambio de tarifa</button>` : ''}`,
    mount: (e, sh) => {
      e.querySelector('[data-save]').onclick = () => {
        const ind = +fval(e, 'ind'), grp = +fval(e, 'grp'), from = fval(e, 'from') ?? cur.from;
        if (!(ind >= 0) || fval(e, 'ind') === '') return ferr(e, 'ind', 'Ingresá la tarifa individual');
        if (!(grp >= 0) || fval(e, 'grp') === '') return ferr(e, 'grp', 'Ingresá la tarifa grupal');
        if (!from) return ferr(e, 'from', 'Elegí la fecha');
        if (sc.rates.some(x => x.from === from && x !== r)) return ferr(e, 'from', 'Ya hay una tarifa que empieza ese día');
        if (r) Object.assign(r, { from, ind, grp }); else sc.rates.push({ id: uid(), from, ind, grp });
        upsert('schools', sc); save(); sh.close(); render();
        const locked = S.lessons.filter(l => l.schoolId === sc.id && l.rate != null && l.date >= from).length;
        toast(locked ? `Tarifa guardada. ${locked} clase(s) ya registrada(s) conservan su tarifa original.` : 'Tarifa guardada');
      };
      const d = e.querySelector('[data-del]');
      if (d) d.onclick = async () => { if (!(await confirmDel('¿Eliminar este cambio de tarifa?', ''))) return; sc.rates = sc.rates.filter(x => x !== r); upsert('schools', sc); save(); sh.close(); render(); };
    }
  });
};

/* ---------- días sin clases ---------- */
function closureForm(c, o = {}) {
  const F = c ? clone(c) : { schoolId: o.schoolId || (activeSchools().length === 1 ? activeSchools()[0].id : (activeSchools()[0] || {}).id), from: o.date || today(), to: '', reason: '', charged: false };
  const affected = () => occurrences(F.from, F.to && F.to >= F.from ? F.to : F.from).filter(l => !isEvent(l) && l.schoolId === F.schoolId && l.status === 'scheduled');
  openSheet({
    title: c ? 'Día sin clases' : 'Marcar día sin clases',
    body: () => { const n = affected().length; return `<div class="muted small" style="margin:-4px 0 14px">Feriados, vacaciones, eventos de la escuela… Las clases de ese día quedan marcadas como “sin clases” y no hace falta cancelarlas una por una.</div>
      ${activeSchools().length > 1 ? field('Escuela', sel('schoolId', F.schoolId, activeSchools().map(s => [s.id, s.name]))) : ''}
      <div class="grid2">${field('Día', inp('from', F.from, { type: 'date' }))}${field('Hasta (opcional)', inp('to', F.to, { type: 'date' }))}</div>
      ${field('Motivo (opcional)', inp('reason', F.reason, { ph: 'Ej: feriado, vacaciones de invierno' }))}
      <div class="list" style="margin-bottom:12px">${sw('charged', F.charged, 'Se cobran las clases de ese día', 'Si está apagado, no generan ingresos ni van en la factura')}</div>
      <div class="infobox" style="margin-bottom:14px">${ic('cal', 'sm')}<div class="grow" data-aff>${n ? `Afecta ${n} clase${n > 1 ? 's' : ''} agendada${n > 1 ? 's' : ''}.` : 'No hay clases agendadas en esa fecha.'}</div></div>
      <button class="btn pri full" data-save>${ic('check', 'sm')}Guardar</button>
      ${c ? `<button class="btn ghost danger full" style="margin-top:6px" data-del>${ic('trash', 'sm')}Quitar (vuelve a haber clases)</button>` : ''}`; },
    mount: (el, sh) => {
      const grab = () => { ['from', 'to', 'reason'].forEach(n => { F[n] = fval(el, n); }); const s = fval(el, 'schoolId'); if (s !== undefined) F.schoolId = s; F.charged = fval(el, 'charged'); };
      el.querySelectorAll('[name=from],[name=to],[name=schoolId]').forEach(i => i.addEventListener('change', () => { grab(); const n = affected().length; el.querySelector('[data-aff]').textContent = n ? `Afecta ${n} clase${n > 1 ? 's' : ''} agendada${n > 1 ? 's' : ''}.` : 'No hay clases agendadas en esa fecha.'; }));
      el.querySelector('[data-save]').onclick = () => {
        grab();
        if (!F.from) return ferr(el, 'from', 'Elegí el día');
        if (F.to && F.to < F.from) return ferr(el, 'to', 'La fecha final es anterior a la inicial');
        if (F.to === F.from) F.to = '';
        upsert('closures', Object.assign(c || { id: uid() }, F));
        save(); closeAll(); render(); toast('Día sin clases guardado · ' + (F.charged ? 'se cobra' : 'no se cobra'));
      };
      const d = el.querySelector('[data-del]');
      if (d) d.onclick = async () => { if (!(await confirmDel('¿Quitar este día sin clases?', 'Las clases de ese día vuelven a quedar como programadas.', 'Quitar'))) return; removeRec('closures', c.id); save(); closeAll(); render(); };
    }
  });
}
const closureTxt = c => fmtDate(c.from, { dow: 1 }) + (c.to ? ' – ' + fmtDate(c.to, { dow: 1 }) : '');
ACT.newClosure = el => closureForm(null, { schoolId: el.dataset.school, date: el.dataset.date });
ACT.editClosure = el => closureForm(byId('closures', el.dataset.id));

/* ---------- cuenta ---------- */
ACT.login = () => openSheet({
  title: 'Tu cuenta',
  body: () => `<div class="muted small" style="margin:-4px 0 14px">Tus datos se guardan en la nube y se sincronizan entre el iPhone y la computadora. Si ya tenés cuenta en Entreno, usá el mismo email y contraseña.</div>
    ${field('Email', inp('email', '', { type: 'email', attrs: 'autocomplete="email" autocapitalize="off"' }))}
    ${field('Contraseña', inp('pass', '', { type: 'password', attrs: 'autocomplete="current-password"' }))}
    <button class="btn pri full" data-in>Iniciar sesión</button><div class="sp"></div><button class="btn full" data-up>Crear cuenta nueva</button>`,
  mount: (el, sh) => {
    const go2 = async (up, btn) => {
      const email = fval(el, 'email'), pass = el.querySelector('[name=pass]').value;
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return ferr(el, 'email', 'Revisá el email');
      if (pass.length < 6) return ferr(el, 'pass', 'La contraseña tiene que tener al menos 6 caracteres');
      busy(btn, true);
      try {
        if (up) {
          const j = await authCall('signup', { email, password: pass, options: { emailRedirectTo: location.origin + location.pathname } });
          if (!j.access_token) { busy(btn, false); toast('Te mandamos un email: confirmalo y después iniciá sesión'); return; }
          setAuth(j);
        } else setAuth(await authCall('token?grant_type=password', { email, password: pass }));
        sh.close(); toast('Sesión iniciada'); await syncNow(true); render();
      } catch (e) { busy(btn, false); toast(authMsg(e.message), 'err'); }
    };
    el.querySelector('[data-in]').onclick = e => go2(false, e.currentTarget);
    el.querySelector('[data-up]').onclick = e => go2(true, e.currentTarget);
  }
});
ACT.logout = async () => {
  if (!(await ask('¿Cerrar sesión?', 'Tus datos siguen en la nube. En este dispositivo quedan guardados hasta que los borres.', [{ label: 'Cerrar sesión', val: true, cls: 'danger' }, { label: 'Cancelar', val: false, cls: 'ghost' }]))) return;
  clearAuth(); render();
};
ACT.syncNow = () => syncNow(true);

/* ---------- datos ---------- */
ACT.backup = () => deliver(new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }), `tesitura-copia-${today()}.json`);
ACT.restore = () => $('#restoreFile').click();
ACT.wipe = async () => {
  if (!(await confirmDel('¿Borrar todos los datos?', `Se borran alumnos, clases, repertorio y facturas de este dispositivo${AUTH ? ' <b>y de tu cuenta en la nube</b>' : ''}. Te recomendamos exportar una copia antes. No se puede deshacer.`, 'Borrar todo'))) return;
  if (!(await confirmDel('¿Seguro?', 'Última confirmación.', 'Sí, borrar todo'))) return;
  const del = [...S.deleted, ...COLLS.flatMap(c => S[c].map(x => x.id))];
  S = blank(); S.deleted = del.slice(-5000); S.lastSync = Date.now(); S.schools[0].u = Date.now();
  save(); render(); toast('Datos borrados');
};
ACT.exportAllXls = async () => {
  try {
    toast('Generando planilla…');
    await loadLib('xlsx');
    const wb = XLSX.utils.book_new(), add = (name, rows) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows.length ? rows : [{ '': 'Sin datos' }]), name);
    add('Alumnos', S.students.map(s => ({ Nombre: s.first, Apellido: s.last, Estado: ST_STATUS[s.status], Escuela: school(s.schoolId).name, Teléfono: s.phone, Email: s.email, Clasificación: s.voiceType, Extensión: rangeTxt(s), Objetivos: s.goals, Experiencia: s.experience, Fortalezas: s.strengths, Dificultades: s.difficulties, Observaciones: s.observations })));
    add('Clases', lessonRows('2000-01-01', addDays(today(), 0)));
    add('Repertorio', S.studentSongs.map(x => { const sg = byId('songs', x.songId) || {}; return { Alumno: sName(student(x.studentId)), Canción: sg.title, Artista: sg.artist, Semitonos: semisOf(x), Enlace: x.link, Instrumental: x.karaoke, Observaciones: x.notes }; }));
    add('Registros', S.lessonNotes.map(n => ({ Fecha: n.date, Alumno: sName(student(n.studentId)), Ejercicios: n.exercises, Técnica: n.technique, Dificultades: n.difficulties, Avances: n.progress, Próxima: n.nextGoals, Notas: n.notes })));
    add('Facturas', S.invoices.map(i => ({ Número: i.number, Escuela: i.schoolName, Desde: i.from, Hasta: i.to, Emitida: i.issued, Total: i.total, Moneda: i.currency })));
    await deliver(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Tesitura ${today()}.xlsx`);
  } catch (e) { toast(e.message, 'err'); }
};
// archivo de calendario (.ics) con alarma, para el Calendario del iPhone
ACT.exportIcs = () => {
  const t = today(), ls = occurrences(t, addDays(t, 84)).filter(l => stOf(l) === 'scheduled');
  if (!ls.length) return toast('No hay clases agendadas', 'err');
  const dt = (d, m) => d.replace(/-/g, '') + 'T' + fromMin(m).replace(':', '') + '00';
  const icsEsc = s => String(s || '').replace(/[\\,;]/g, c => '\\' + c).replace(/\n/g, '\\n');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const ev = ls.map(l => ['BEGIN:VEVENT', `UID:${(l.seriesId ? l.seriesId + '-' + (l.seriesDate || l.date) : l.id).replace(/:/g, '-')}@tesitura`, `DTSTAMP:${stamp}`, `DTSTART:${dt(l.date, toMin(l.start))}`, `DTEND:${dt(l.date, toMin(l.start) + (+l.duration || 0))}`,
    `SUMMARY:${icsEsc((isEvent(l) ? '' : '🎤 ') + lessonTitle(l))}`, `DESCRIPTION:${icsEsc((activeSchools().length > 1 ? school(l.schoolId).name + '\n' : '') + (l.notes || ''))}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Clase', `TRIGGER:-PT${+S.settings.remindMin || 15}M`, 'END:VALARM', 'END:VEVENT'].join('\r\n'));
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tesitura//ES', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Clases', ...ev, 'END:VCALENDAR'].join('\r\n');
  deliver(new Blob([ics], { type: 'text/calendar' }), 'clases.ics');
};

/* ---------- recordatorios con la app abierta ---------- */
const notified = new Set();
function checkReminders() {
  if (!S.settings.remind) return;
  const t = today(), nm = nowMin(), ahead = +S.settings.remindMin || 15;
  occurrences(t, t).forEach(l => {
    const diff = toMin(l.start) - nm;
    if (stOf(l) !== 'scheduled' || diff < 0 || diff > ahead || notified.has(l.id + t)) return;
    notified.add(l.id + t);
    const msg = `${lessonTitle(l)} a las ${l.start}`;
    if ('Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker) {
      navigator.serviceWorker.ready.then(r => r.showNotification('Clase en ' + diff + ' min', { body: msg, icon: 'icon-192.png', tag: l.id })).catch(() => toast('Clase en ' + diff + ' min: ' + msg));
    } else toast('Clase en ' + diff + ' min: ' + msg);
  });
}
