'use strict';
/* Tesitura · arranque */
route();
if (AUTH) syncNow();
setInterval(() => { checkReminders(); if (!document.hidden && !SHEETS.length && (R.view === 'home' || R.view === 'calendar')) { const y = window.scrollY; render(); window.scrollTo(0, y); } }, 60000);
checkReminders();
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
window.addEventListener('error', e => { console.error(e.error || e.message); });
