// Last Seed · presentation layer for screen size and input (phone / tablet / desktop).
// Game logic never checks the platform; only this file and mobile.css do.
(function () {
  const D = document, B = D.body || D.documentElement;
  const coarse = () => matchMedia('(pointer:coarse)').matches && !matchMedia('(any-pointer:fine)').matches || (window.LS_ANDROID === true);
  // tier by the screen's shortest side (stable across rotation): Fold cover = phone, Fold inner = tablet
  function tier() {
    if (!coarse()) return 'desktop';
    const s = Math.min(screen.width || innerWidth, screen.height || innerHeight);
    return s < 600 ? 'phone' : 'tablet';
  }
  let T = '';
  function apply() {
    const t = tier(); if (t !== T) { T = t; ['phone', 'tablet', 'desktop'].forEach(k => B.classList.toggle('ui-' + k, k === t)); B.classList.toggle('ui-touch', t !== 'desktop'); }
    B.classList.toggle('ui-portrait-block', T !== 'desktop' && innerHeight > innerWidth * 1.05);
    place(); try { fitSheets(); } catch (_) {}
  }
  window.LS_UI = { tier: () => T };

  // ── landscape: lock where the browser allows it (Android app, installed/fullscreen web), otherwise ask ──
  const rot = D.createElement('div'); rot.id = 'lsRotate';
  rot.innerHTML = '<div><svg viewBox="0 0 64 64" width="72" height="72" fill="none" stroke="currentColor" stroke-width="3"><rect x="20" y="8" width="24" height="44" rx="4"/><path d="M50 40a18 18 0 0 1-18 18M28 54l4 4-4 4"/></svg><b>Turn your device sideways</b><small>Last Seed plays in landscape.</small></div>';
  function lock() { try { const o = screen.orientation; if (o && o.lock && T !== 'desktop') o.lock('landscape').catch(() => {}); } catch (_) {} }
  addEventListener('pointerdown', lock, { once: true, capture: true });

  // ── menu button: Settings (and the corner tools) reachable on every screen without a keyboard ──
  const gear = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.5 7.5 0 0 0-1.7-1L15 3h-4l-.4 2.9a7.5 7.5 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.5 7.5 0 0 0 1.7 1L11 21h4l.4-2.9a7.5 7.5 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5A3.5 3.5 0 1 1 13 8.5a3.5 3.5 0 0 1 0 7z" transform="translate(-1 0)"/></svg>';
  const menu = D.createElement('button'); menu.id = 'lsMenu'; menu.type = 'button'; menu.setAttribute('aria-label', 'Menu and settings');
  menu.innerHTML = '<i></i><i></i><i></i>';
  const sheet = D.createElement('div'); sheet.id = 'lsSheet'; sheet.hidden = true;
  function openSheet() {
    const u = D.getElementById('util'); const list = [];
    list.push(['Settings', 'Display, sound, controls', gear, () => { if (window.__lsSettings) window.__lsSettings(); }]);
    if (u) [...u.querySelectorAll('.ubtn')].forEach(b => {
      if (b.classList.contains('snd')) return;                                   // Settings is already first
      if (getComputedStyle(b).display === 'none') return;
      const tip = (b.dataset.tip || '').replace(/\s*\(.*?\)\s*/g, ' ').trim(); const [name, ...rest] = tip.split(/:\s|\s·\s/);
      list.push([name || 'Action', rest.join(' · '), b.innerHTML, () => b.click(), b.classList.contains('off')]);
    });
    const ef = D.querySelector('.efast'); if (ef) list.splice(1, 0, ['Rival turn ×2', ef.classList.contains('on') ? 'On: the rival plays at double speed' : 'Off: the rival plays at normal speed', '<b style="font:700 15px system-ui">⏩</b>', () => ef.click(), !ef.classList.contains('on')]);
    sheet.innerHTML = '<div class="lsS-in" role="dialog" aria-label="Menu"><div class="lsS-hd"><b>Menu</b><button type="button" class="lsS-x" aria-label="Close">✕</button></div><div class="lsS-g"></div></div>';
    const g = sheet.querySelector('.lsS-g');
    list.forEach(([n, d, ic, fn, off]) => { const b = D.createElement('button'); b.type = 'button'; b.className = 'lsS-b' + (off ? ' off' : ''); b.innerHTML = `<span class="ic">${ic}</span><span class="tx"><b></b><small></small></span>`; b.querySelector('b').textContent = n; b.querySelector('small').textContent = d || ''; b.onclick = e => { e.stopPropagation(); closeSheet(); setTimeout(fn, 30); }; g.appendChild(b); });
    sheet.querySelector('.lsS-x').onclick = closeSheet; sheet.onclick = e => { if (e.target === sheet) closeSheet(); };
    sheet.hidden = false; try { Snd && Snd.sfx && Snd.sfx('click'); } catch (_) {}
  }
  function closeSheet() { sheet.hidden = true; }
  menu.onclick = e => { e.stopPropagation(); sheet.hidden ? openSheet() : closeSheet(); };
  addEventListener('keydown', e => { if (e.key === 'Escape' && !sheet.hidden) { e.stopImmediatePropagation(); closeSheet(); } }, true);

  // keep the menu button where the corner tools live (top-right, or centred above the fight), and hidden in cinematics
  function place() {
    const app = D.getElementById('app'); if (!app) return;
    const busy = !!D.querySelector('.boot,.modal,.roam3d:not(.away),.roam:not(.away)') || B.classList.contains('fintro') || (app.classList.contains('cine') && !!D.querySelector('.ultc,.lsq,.awk,.crit,.spfin,.lsplash'));
    menu.classList.toggle('hide', busy);
    menu.classList.toggle('battle', app.classList.contains('inbattle'));
    menu.classList.toggle('alt', !!D.querySelector('.csel'));
    const u = D.getElementById('util'); let uv = false;
    if (u) { const cs = getComputedStyle(u), r = u.getBoundingClientRect(); uv = cs.visibility !== 'hidden' && +cs.opacity > .2 && r.width > 4; }
    menu.classList.toggle('need', T !== 'desktop' || !uv);
  }
  // desktop keeps its corner bar; the Settings coin there gets a gear so it reads as settings, not volume
  function gearIcon() { const s = D.querySelector('#util .ubtn.snd'); if (s && !s.dataset.gear) { s.dataset.gear = 1; s.innerHTML = gear; } }
  // dialogs: on small screens the whole sheet scales up so its text and controls are readable and tappable; it scrolls instead of shrinking
  const MZ = { phone: 1.55, tablet: 1.15 };
  function fitSheets() {
    const z = MZ[T] || 0;
    D.querySelectorAll('.modal > .sheet').forEach(sh => {
      if (!z) { if (sh.dataset.mz) { sh.style.zoom = ''; sh.style.maxHeight = ''; sh.style.overflowY = ''; delete sh.dataset.mz; } return; }
      if (sh.dataset.mz == z && sh.dataset.mh == innerHeight) return;
      sh.dataset.mz = z; sh.dataset.mh = innerHeight; sh.style.zoom = z;
      sh.style.maxHeight = Math.floor((innerHeight - 12) / z) + 'px'; sh.style.maxWidth = Math.floor((innerWidth - 16) / z) + 'px'; sh.style.overflowY = 'auto'; sh.style.overscrollBehavior = 'contain';
    });
  }
  // a swiped roster opens on the selected fighter
  function rosterHome() { if (T === 'desktop') return; D.querySelectorAll('.csel .cs-roster').forEach(r => { if (r.dataset.home) return; r.dataset.home = 1; const on = r.querySelector('.cs-tile.on') || r.firstElementChild; setTimeout(() => { r.scrollLeft = on ? Math.max(0, on.offsetLeft - 8) : 0; }, 60); }); }
  function init() {
    D.body.appendChild(rot); D.body.appendChild(sheet); (D.getElementById('app') || D.body).appendChild(menu);
    apply(); gearIcon();
    new MutationObserver(() => { gearIcon(); place(); fitSheets(); rosterHome(); }).observe(D.getElementById('app') || D.body, { attributes: true, attributeFilter: ['class'], childList: true, subtree: true });
    setInterval(place, 1000);
  }
  addEventListener('resize', apply); addEventListener('orientationchange', () => setTimeout(apply, 200));
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', init); else init();
})();
