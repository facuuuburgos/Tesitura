'use strict';
/* Tesitura · arranque */
// sin zoom: ni con dos dedos ni con doble toque, para que se sienta como una app
['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', e => { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });
// el doble toque ya no hace zoom gracias a touch-action: manipulation (así los toques rápidos en + y − siguen funcionando)
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
lastRouted = location.hash;
route();
loadFx();
window.addEventListener('online', () => loadFx());
if (AUTH) syncNow();
setInterval(liveTick, 15000);
setInterval(() => { checkReminders(); loadFx(); if (!document.hidden && !SHEETS.length && (R.view === 'calendar' || R.view === 'show')) { const y = window.scrollY; render(); window.scrollTo(0, y); } }, 60000);
checkReminders();
/* ---------- actualizaciones automáticas ----------
   Al abrir la app y cada vez que vuelve desde otra app, busca si hay una versión nueva en GitHub.
   Si la hay, recarga sola (esperando a que no estés editando nada) y avisa que se actualizó. */
const APP_VERSION = (document.querySelector('meta[name=app-version]') || {}).content || '';
const VKEY = 'tesitura.version';
let updPending = false, lastCheck = 0;
function applyUpdate() {
  if (!updPending) return;
  if (SHEETS.length || document.querySelector('.dialog')) return; // no interrumpe si estás editando
  try { localStorage.setItem('tesitura.updating', '1'); } catch (e) { }
  location.reload();
}
async function checkNewVersion(force) {
  if (!location.protocol.startsWith('http') || !navigator.onLine) return false;
  if (!force && Date.now() - lastCheck < 30000) return false;
  lastCheck = Date.now();
  try {
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    if (reg) reg.update().catch(() => { });
    const html = await (await fetch(location.pathname, { cache: 'no-store' })).text();
    const m = html.match(/name="app-version" content="([^"]+)"/);
    if (m && m[1] !== APP_VERSION) { updPending = true; applyUpdate(); return true; }
  } catch (e) { }
  return false;
}
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  const hadCtrl = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => { });
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadCtrl) { updPending = true; applyUpdate(); } });
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkNewVersion(); });
window.addEventListener('focus', () => checkNewVersion());
setInterval(() => checkNewVersion(), 30 * 60000);
// si había una actualización pendiente, se aplica al cerrar el menú que estaba abierto
document.addEventListener('click', () => setTimeout(applyUpdate, 400), true);
checkNewVersion(true);
// aviso después de actualizarse
(() => {
  let prev = null; try { prev = localStorage.getItem(VKEY); localStorage.setItem(VKEY, APP_VERSION); } catch (e) { }
  if (prev && prev !== APP_VERSION) setTimeout(() => toast(`Tesitura se actualizó a la versión ${APP_VERSION}`), 600);
  try { localStorage.removeItem('tesitura.updating'); } catch (e) { }
})();
ACT.checkUpdate = async () => { toast('Buscando actualización…'); const found = await checkNewVersion(true); if (!found) setTimeout(() => toast('Ya tenés la última versión (' + APP_VERSION + ')'), 900); };
window.addEventListener('error', e => { console.error(e.error || e.message); });
