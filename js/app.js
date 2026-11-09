'use strict';
/* Tesitura · arranque */
// sin zoom: ni con dos dedos ni con doble toque, para que se sienta como una app
['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
document.addEventListener('touchmove', e => { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });
// el doble toque ya no hace zoom gracias a touch-action: manipulation (así los toques rápidos en + y − siguen funcionando)
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
route();
if (AUTH) syncNow();
setInterval(() => { checkReminders(); if (!document.hidden && !SHEETS.length && (R.view === 'home' || R.view === 'calendar')) { const y = window.scrollY; render(); window.scrollTo(0, y); } }, 60000);
checkReminders();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
window.addEventListener('error', e => { console.error(e.error || e.message); });
