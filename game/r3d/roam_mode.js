// Free roam in 3D (HD-2D): the Moonlit Bamboo Road as the game's free-roam mode.
// The game supplies the hero atlas and callbacks (fights, loot, exit); this module owns the 3D world and controls.
import { Diorama, T } from './diorama.js';
import { build, nearest } from './scene_bamboo.js';

const BASE = new URL('./img/', import.meta.url).href, I = n => BASE + n + '.webp', GAMEIMG = new URL('../img/', import.meta.url).href;
const CSS = `.roam3d{position:fixed;inset:0;z-index:95;background:#05060d;overflow:hidden;touch-action:none;-webkit-user-select:none;user-select:none;font-family:'Barlow Condensed',system-ui,sans-serif;color:#fff}
.roam3d.away{visibility:hidden}
.roam3d canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.r3-hud{position:absolute;left:14px;top:12px;display:flex;align-items:center;gap:10px;pointer-events:none}
.r3-ava{width:54px;height:54px;border-radius:50%;background:#111 center/cover;border:2px solid #ffd27a;box-shadow:0 2px 10px rgba(0,0,0,.6)}
.r3-hud b{display:block;font:400 20px/1 Anton,Impact,sans-serif;letter-spacing:.04em;text-shadow:0 2px 6px #000}
.r3-hp{width:180px;height:10px;border-radius:6px;background:rgba(0,0,0,.6);overflow:hidden;margin:5px 0 3px;border:1px solid rgba(255,255,255,.25)}.r3-hp i{display:block;height:100%;background:linear-gradient(90deg,#3fe08a,#b5ff7a)}
.r3-hud small{font-size:15px;color:#ffd34d;text-shadow:0 1px 4px #000}
.r3-zone{position:absolute;left:50%;top:13%;transform:translateX(-50%);text-align:center;pointer-events:none;transition:opacity 1.2s;text-shadow:0 2px 12px #000}
.r3-zone b{display:block;font:400 clamp(26px,5vw,60px)/1 Anton,Impact,sans-serif;letter-spacing:.04em}.r3-zone i{display:block;font-style:normal;letter-spacing:.3em;font-size:clamp(11px,1.4vw,15px);color:#ffd27a;margin-top:6px;text-transform:uppercase}
.r3-prompt{position:absolute;left:50%;bottom:15%;transform:translateX(-50%);padding:10px 18px;border-radius:999px;background:rgba(8,6,18,.8);border:1px solid rgba(255,210,120,.6);font-size:18px;letter-spacing:.05em;display:none;pointer-events:none;white-space:nowrap}
.r3-prompt kbd{display:inline-grid;place-items:center;min-width:26px;height:26px;margin-right:8px;padding:0 6px;border-radius:6px;background:#ffd27a;color:#120c20;font:800 14px system-ui}
.r3-pop{position:absolute;transform:translate(-50%,-100%);font:400 24px Anton,Impact,sans-serif;color:#ffe28a;text-shadow:0 2px 6px #000;pointer-events:none;animation:r3pu 1.3s ease-out forwards;white-space:nowrap}
@keyframes r3pu{to{transform:translate(-50%,-230%);opacity:0}}
.r3-bang{position:absolute;transform:translate(-50%,-100%);font:400 46px Anton,Impact,sans-serif;color:#ffd34d;-webkit-text-stroke:2px #000;pointer-events:none}
.r3-banner{position:absolute;left:0;right:0;top:36%;text-align:center;pointer-events:none;opacity:0;transition:opacity .3s;text-shadow:0 3px 14px #000}
.r3-banner.on{opacity:1}.r3-banner b{display:block;font:400 clamp(40px,8vw,90px)/1 Anton,Impact,sans-serif;color:#ffd34d}.r3-banner span{font-size:clamp(15px,2vw,22px)}
.r3-menu{position:absolute;right:12px;top:12px;width:48px;height:48px;border-radius:14px;background:rgba(10,8,20,.78);border:1.5px solid rgba(255,210,120,.65);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;cursor:pointer;padding:0}
.r3-menu i{display:block;width:20px;height:2.5px;border-radius:2px;background:#ffe3a6}
.r3-stick{position:absolute;left:22px;bottom:22px;width:136px;height:136px;border-radius:50%;background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.18);display:none}
.r3-stick i{position:absolute;left:50%;top:50%;width:60px;height:60px;margin:-30px;border-radius:50%;background:rgba(255,220,150,.35);border:2px solid rgba(255,220,150,.7)}
.r3-btns{position:absolute;right:20px;bottom:24px;display:none;gap:14px;align-items:flex-end}
.r3-btns button{width:78px;height:78px;border-radius:50%;background:rgba(255,190,80,.2);border:2px solid rgba(255,210,120,.8);color:#fff;font:800 15px system-ui;letter-spacing:.04em}
.r3-btns button.atk{width:92px;height:92px;background:rgba(255,90,60,.25);border-color:rgba(255,140,110,.9)}
.roam3d.touch .r3-stick,.roam3d.touch .r3-btns{display:flex}.roam3d.touch .r3-stick{display:block}
.r3-pause{position:absolute;inset:0;background:rgba(4,3,10,.75);display:none;align-items:center;justify-content:center}
.r3-pause.on{display:flex}
.r3-card{width:min(440px,92vw);padding:18px;border-radius:18px;background:linear-gradient(170deg,#1c1638,#0d0a1c);border:1.5px solid rgba(255,210,120,.55);text-align:center}
.r3-card h2{margin:0 0 6px;font:400 30px/1 Anton,Impact,sans-serif;color:#ffd27a;letter-spacing:.04em}.r3-card p{margin:6px 0 14px;color:#cfc6e0;font-size:16px;line-height:1.35}
.r3-card button{display:block;width:100%;min-height:50px;margin-top:10px;border-radius:12px;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:#fff;font:700 17px 'Barlow Condensed',system-ui;letter-spacing:.04em;cursor:pointer}
.r3-card button:first-of-type{border-color:rgba(255,210,120,.7);background:rgba(255,190,80,.16)}
.r3-quality{opacity:.75}`;

const ITEMS = [
  { img: 'rp_pot', x: -36, z: 3.6, h: .75, kind: 'pot', label: 'Break the pot' },
  { img: 'rp_barrel', x: -5, z: 5.6, h: .9, kind: 'pot', label: 'Smash the barrel' },
  { img: 'rp_chest', x: 2.5, z: -.6, h: .75, kind: 'chest', label: 'Open the chest' },
  { img: 'rp_food', x: 11, z: 3.8, h: .5, kind: 'food', label: 'Eat the onigiri' },
  { img: 'rp_crates', x: 19.5, z: .2, h: .9, kind: 'pot', label: 'Break the crates' },
  { img: 'rp_elixir', x: -27, z: 5.2, h: .6, kind: 'elixir', label: 'Drink the elixir' },
  { img: 'rp_scroll', x: 31, z: -10, h: .7, y: 3, kind: 'scroll', label: 'Read the technique scroll' },
  { img: 'rp_rchest', x: 23.6, z: -16.5, h: .85, y: 3, kind: 'rchest', label: 'Open the sealed offering', lock: 'nue' },
  // the western stretch
  { img: 'rp_pot', x: -90, z: 3.4, h: .75, kind: 'pot', label: 'Break the pot' },
  { img: 'rp_food', x: -78, z: 4.0, h: .5, kind: 'food', label: 'Eat the onigiri' },
  { img: 'rp_chest', x: -66, z: -.2, h: .75, kind: 'chest', label: 'Open the chest' },
  { img: 'rp_crates', x: -54, z: 3.9, h: .9, kind: 'pot', label: 'Break the crates' },
  { img: 'rp_barrel', x: -45, z: 3.6, h: .9, kind: 'pot', label: 'Smash the barrel' },
  // the eastern road
  { img: 'rp_pot', x: 38, z: 3.6, h: .75, kind: 'pot', label: 'Break the pot' },
  { img: 'rp_elixir', x: 50, z: -.2, h: .6, kind: 'elixir', label: 'Drink the elixir' },
  { img: 'rp_chest', x: 62, z: 4.0, h: .75, kind: 'chest', label: 'Open the chest' },
  { img: 'rp_food', x: 70, z: 3.4, h: .5, kind: 'food', label: 'Eat the onigiri' },
  { img: 'rp_rchest', x: 79, z: 3.2, h: .85, kind: 'rchest', label: 'Open the bandit hoard', lock: 'gasha' },
];
const FOES = [
  { id: 'tanuki', x: -2, z: 2.2, h: 1.7, stage: 'road' },
  { id: 'tengu', x: 14, z: 2.4, h: 2.1, stage: 'road' },
  { id: 'nue', x: 27, z: -14, h: 2.6, y: 3, stage: 'shrine', boss: 1 },
  // the western stretch: the old festival road's brawlers (src: the game's own free-roam art)
  { id: 'bruiser', src: 'battle', _r: 'roam_bruiser', x: -84, z: 2.4, h: 2.2, stage: 'road' },
  { id: 'ronin', src: 'battle', _r: 'roam_ronin', x: -71, z: 1.6, h: 2.1, stage: 'road' },
  { id: 'kappa', src: 'battle', _r: 'roam_kappa', x: -60, z: 3.0, h: 1.6, stage: 'bridge' },
  { id: 'bandit', src: 'battle', _r: 'roam_bandit', x: -49, z: 1.8, h: 2.0, stage: 'road' },
  // the eastern road, with a miniboss guarding the hoard at the end
  { id: 'komainu', src: 'battle', _r: 'roam_komainu', x: 36, z: 2.2, h: 1.8, stage: 'road' },
  { id: 'yuki', src: 'battle', _r: 'roam_yuki', x: 47, z: 1.6, h: 2.1, stage: 'road' },
  { id: 'spider', src: 'battle', _r: 'roam_spider', x: 58, z: 2.6, h: 1.9, stage: 'road' },
  { id: 'gasha', src: 'battle', _r: 'roam_gasha', x: 73, z: 1.8, h: 3.4, stage: 'road', boss: 1 },
];
const START = { x: -94, z: 1.8 };

export async function createRoam(host, cfg) {
  if (!document.getElementById('r3css')) { const st = document.createElement('style'); st.id = 'r3css'; st.textContent = CSS; document.head.appendChild(st); }
  const touch = matchMedia('(pointer:coarse)').matches;
  let quality = (() => { try { return localStorage.getItem('ls_r3q') || (touch ? 'low' : 'high'); } catch (_) { return touch ? 'low' : 'high'; } })();
  host.classList.add('roam3d'); if (touch) host.classList.add('touch');
  host.innerHTML = `<canvas></canvas>
    <div class="r3-hud"><i class="r3-ava" style="background-image:url(${cfg.ava})"></i><div><b></b><div class="r3-hp"><i></i></div><small></small></div></div>
    <div class="r3-zone"><b>MOONLIT BAMBOO ROAD</b><i>Walk the long road · cross the stream · climb to the shrine</i></div>
    <div class="r3-prompt"><kbd>E</kbd><span></span></div><div class="r3-banner"><b></b><span></span></div>
    <button class="r3-menu" aria-label="Pause menu"><i></i><i></i><i></i></button>
    <div class="r3-stick"><i></i></div><div class="r3-btns"><button class="act" type="button">ACT</button><button class="atk" type="button">STRIKE</button></div>
    <div class="r3-pause"><div class="r3-card"><h2>Paused</h2><p>Walk with WASD or the arrow keys (the stick on a phone). Strike an enemy first with J or Space for an Ambush: they start hurt and Exposed. If they reach you first, you're Ambushed and they start with Guard. E opens chests and picks things up.</p>
      <button data-m="resume" type="button">Resume</button><button data-m="settings" type="button">Settings</button><button data-m="quality" class="r3-quality" type="button"></button><button data-m="exit" type="button">Exit to title</button></div></div>`;
  const $ = q => host.querySelector(q);
  const D = new Diorama($('canvas'), { quality, fogNear: 20, fogFar: 70, fogColor: 0x0c1430 });
  const small = Math.min(innerWidth, innerHeight) < 520;
  await build(D);
  const A = (n, x, z, h, o) => D.prop(I(n), x, z, h, o);
  const fill = new T.PointLight(0xffe2c0, 9, 7, 1.4); D.scene.add(fill);

  // ── things in the world ──
  for (const it of ITEMS) { it.done = false; it.mesh = await A(it.img, it.x, it.z, it.h, { y: it.y || 0 }); }
  for (const f of FOES) {
    Object.assign(f, { st: 'idle', t: 0, beaten: false, x0: f.x, z0: f.z });
    const url = f.src ? (cfg.foeArt ? await cfg.foeArt(f.id) : GAMEIMG + 'foe_' + f.id + '.webp') : I('foe_' + f.id);
    f.mesh = await D.prop(url, f.x, f.z, f.h, { y: f.y || 0, flip: 1, blob: false }); f.base = f.mesh.scale.y; f.blob = D.blob(f.x, f.z, f.boss ? 1 : .7, f.y || 0);
  }
  // ── hero ──
  const idleH = (cfg.frames.idle && cfg.frames.idle[0][3]) || 400;
  const hero = D.actor(cfg.atlas, cfg.frames, idleH / 1.75, { fps: 10, glide: cfg.glide });
  const pos = new T.Vector3(START.x, 0, START.z), vel = new T.Vector2(); let face = 1, atkT = 0, busy = false, paused = false, gone = false;

  // ── HUD ──
  $('.r3-hud b').textContent = cfg.name.toUpperCase();
  function hud() { const s = cfg.stats(); $('.r3-hp i').style.width = Math.max(0, Math.min(100, s.hp / s.max * 100)) + '%'; $('.r3-hud small').textContent = `${s.hp} / ${s.max} HP · ${s.mon} Mon`; }
  hud(); setTimeout(() => { $('.r3-zone').style.opacity = 0; }, 3200);
  function pop(txt, wp, col) { const v = wp.clone().project(D.camera); const el = document.createElement('div'); el.className = 'r3-pop'; el.textContent = txt; if (col) el.style.color = col; el.style.left = (v.x * .5 + .5) * host.clientWidth + 'px'; el.style.top = (-v.y * .5 + .5) * host.clientHeight + 'px'; host.appendChild(el); setTimeout(() => el.remove(), 1400); }
  let bT = 0; function banner(t, sub, ms = 1600) { const b = $('.r3-banner'); b.querySelector('b').textContent = t; b.querySelector('span').textContent = sub || ''; b.classList.add('on'); clearTimeout(bT); if (ms) bT = setTimeout(() => b.classList.remove('on'), ms); }

  // ── input ──
  const keys = {};
  const kd = e => { if (paused || busy || gone) { if (e.code === 'Escape' && paused) { e.preventDefault(); e.stopImmediatePropagation(); setPause(false); } return; }
    keys[e.code] = 1; if (e.code === 'KeyE' || e.code === 'Enter') act(); if (e.code === 'KeyJ' || e.code === 'Space' || e.code === 'KeyK') { e.preventDefault(); strike(); }
    if (e.code === 'Escape' || e.code === 'KeyP') { e.preventDefault(); e.stopImmediatePropagation(); setPause(true); } };
  const ku = e => { keys[e.code] = 0; };
  addEventListener('keydown', kd, true); addEventListener('keyup', ku, true);
  const stick = $('.r3-stick'), knob = stick.firstElementChild; let jv = { x: 0, y: 0 }, jid = null;
  const jmove = e => { const r = stick.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), L = Math.hypot(dx, dy), m = r.width * .38, k = Math.min(1, L / m); jv = { x: dx / (L || 1) * k, y: dy / (L || 1) * k }; knob.style.transform = `translate(${jv.x * m}px,${jv.y * m}px)`; };
  stick.addEventListener('pointerdown', e => { jid = e.pointerId; stick.setPointerCapture(jid); jmove(e); });
  stick.addEventListener('pointermove', e => { if (e.pointerId === jid) jmove(e); });
  const jend = () => { jid = null; jv = { x: 0, y: 0 }; knob.style.transform = ''; }; stick.addEventListener('pointerup', jend); stick.addEventListener('pointercancel', jend);
  $('.r3-btns .act').onclick = () => act(); $('.r3-btns .atk').onclick = () => strike();
  $('.r3-menu').onclick = () => setPause(true);
  const qb = $('[data-m=quality]'); qb.textContent = 'Graphics: ' + (quality === 'high' ? 'High' : 'Low') + ' (restarts free roam)';
  host.querySelector('.r3-pause').onclick = e => { const m = e.target.dataset && e.target.dataset.m; if (!m) return;
    if (m === 'resume') setPause(false);
    if (m === 'settings') cfg.settings && cfg.settings();
    if (m === 'quality') { try { localStorage.setItem('ls_r3q', quality === 'high' ? 'low' : 'high'); } catch (_) {} destroy(); cfg.restart && cfg.restart(); }
    if (m === 'exit') { destroy(); cfg.exit(); } };
  function setPause(on) { paused = on; $('.r3-pause').classList.toggle('on', on); D.paused = on; for (const k in keys) keys[k] = 0; }

  // ── actions ──
  let near = null;
  function nearestFoe(r) { let best = null, bd = r; for (const f of FOES) { if (f.beaten || Math.abs((f.y || 0) - pos.y) > 1.2) continue; const d = Math.hypot(f.x - pos.x, f.z - pos.z); if (d < bd) { bd = d; best = f; } } return best; }
  function strike() {
    if (busy || paused || atkT > 0) return; atkT = .38; hero.set(cfg.frames.jab ? 'jab' : 'idle'); cfg.sfx && cfg.sfx('swing');
    const f = nearestFoe(2.4); if (f && Math.sign(f.x - pos.x || face) === face) { engage(f, 'ambush'); return; }
    for (const it of ITEMS) if (!it.done && it.kind === 'pot' && Math.hypot(it.x - pos.x, it.z - pos.z) < 1.9) use(it);
  }
  function act() { if (busy || paused || !near) return; if (near.foe) { engage(near, 'ambush'); return; } use(near); }
  function use(it) {
    if (it.kind === 'rchest' && FOES.some(f => f.id === it.lock && !f.beaten)) { banner('Sealed', it.lock === 'nue' ? 'Beat the shrine guardian first' : 'Beat the Gashadokuro first'); return; }
    it.done = true; const at = it.mesh.position.clone().add(new T.Vector3(0, it.h + .3, 0));
    const r = cfg.loot(it.kind) || {}; if (r.text) pop(r.text, at, r.col);
    if (it.kind === 'chest' || it.kind === 'rchest') { it.mesh.material = it.mesh.material.clone(); it.mesh.material.color.set(0x8a8a8a); } else it.mesh.visible = false;
    hud();
  }
  async function engage(f, how) {
    if (busy) return; busy = true; f.st = 'caught'; for (const k in keys) keys[k] = 0; jv = { x: 0, y: 0 };
    if (how === 'ambush') { D.post.uniforms.flash.value = .5; f.kb = .6; banner('Ambush!', 'You struck first: the rival starts hurt and Exposed', 900); }
    else banner('Ambushed!', 'They caught you: the rival starts with Guard', 900);
    await new Promise(r => setTimeout(r, 900));
    host.classList.add('away'); D.paused = true;
    const win = await cfg.engage(f.id, how, f.stage);
    if (gone) return;
    host.classList.remove('away'); D.paused = false; hud();
    if (win) { f.beaten = true; f.st = 'down'; f.t = 0; const r = cfg.loot('win') || {}; if (r.text) pop(r.text, pos.clone().add(new T.Vector3(0, 2.3, 0)), r.col); if (f.boss) banner('Clear!', f.id === 'nue' ? 'The sealed offering opens' : 'The hoard is yours to open', 1800); }
    else { f.st = 'idle'; f.x = f.x0; f.z = f.z0; f.mesh.position.set(f.x, f.y || 0, f.z); pos.set(START.x, 0, START.z); banner('K.O.', 'You wake up at the start of the road', 2200); }
    busy = false;
  }

  // ── loop ──
  const camOff = small ? new T.Vector3(0, 6.2, 11) : new T.Vector3(0, 7.6, 13.5), camPos = new T.Vector3(), look = new T.Vector3(); let first = true;
  D.frame((dt, t) => {
    if (gone) return;
    let ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + jv.x;
    let iz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0) + jv.y;
    if (busy) ix = iz = 0;
    const L = Math.hypot(ix, iz); if (L > 1) { ix /= L; iz /= L; }
    const sp = 5.2; vel.x += (ix * sp - vel.x) * Math.min(1, dt * 12); vel.y += (iz * sp - vel.y) * Math.min(1, dt * 12);
    let nx = pos.x + vel.x * dt, nz = pos.z + vel.y * dt; let n = nearest(nx, nz);
    if (n.over > 0) { const k = n.w / n.d; nx = n.px + (nx - n.px) * k; nz = n.pz + (nz - n.pz) * k; n = nearest(nx, nz); }
    pos.x = nx; pos.z = nz; pos.y += (n.y - pos.y) * Math.min(1, dt * 14);
    hero.root.position.copy(pos); fill.position.set(pos.x - .6, pos.y + 2.2, pos.z + 2.4);
    atkT = Math.max(0, atkT - dt);
    const moving = Math.hypot(vel.x, vel.y) > .6; if (atkT <= 0) hero.set(moving ? 'run' : 'idle');
    if (Math.abs(vel.x) > .3) face = vel.x > 0 ? 1 : -1; hero.face = face; hero.fps = atkT > 0 ? 8 : moving ? 6 + Math.hypot(vel.x, vel.y) * 1.2 : 2;
    const tgt = new T.Vector3(pos.x + vel.x * .35, pos.y, pos.z + vel.y * .2), want = tgt.clone().add(camOff);
    if (first) { camPos.copy(want); look.copy(tgt); first = false; }
    camPos.lerp(want, Math.min(1, dt * 3.2)); look.lerp(tgt.clone().add(new T.Vector3(0, 1.1, -1.4)), Math.min(1, dt * 4));
    D.camera.position.copy(camPos); D.camera.lookAt(look); D.focus = pos; D.followShadow(pos); D.fadeFor(pos);
    D.post.uniforms.flash.value = Math.max(0, D.post.uniforms.flash.value - dt * 1.8);
    // foes: idle breath → notice (!) → close in; touching you = Ambushed
    for (const f of FOES) {
      f.t += dt; const fy = f.y || 0;
      if (f.st === 'down') { f.mesh.rotation.z = Math.min(1.3, f.t * 3); f.mesh.material.opacity = Math.max(0, 1 - f.t); f.mesh.material.transparent = true; if (f.t > 1.1) { f.mesh.visible = false; f.blob.visible = false; } continue; }
      if (f.beaten) continue;
      f.mesh.scale.y = f.base * (1 + Math.sin(t * 2.4 + f.x) * .018);
      if (f.kb) { f.kb = Math.max(0, f.kb - dt * 2); f.mesh.material.emissive.set(0xffffff); f.mesh.material.emissiveIntensity = f.kb * 2; }
      if (busy || paused || Math.abs(fy - pos.y) > 1.2) continue;
      const dx = pos.x - f.x, dz = pos.z - f.z, d = Math.hypot(dx, dz);
      if (f.st === 'idle' && d < 6.5) { f.st = 'alert'; f.t = 0; cfg.sfx && cfg.sfx('alert'); }
      if (f.st === 'alert') { if (d > 9) f.st = 'idle'; else if (f.t > .7) { const v = f.boss ? 1.6 : 2.3; f.x += dx / d * v * dt; f.z += dz / d * v * dt; const m = nearest(f.x, f.z); if (m.over > 0) { f.x = m.px; f.z = m.pz; } f.mesh.position.set(f.x, fy, f.z); f.blob.position.set(f.x, fy + .02, f.z); f.mesh.scale.x = dx > 0 ? -Math.abs(f.mesh.scale.x) : Math.abs(f.mesh.scale.x); }
        if (d < 1.15 && atkT <= 0) engage(f, 'ambushed'); }
    }
    // "!" over alert foes
    host.querySelectorAll('.r3-bang').forEach(e => e.remove());
    for (const f of FOES) if (f.st === 'alert' && !f.beaten && !busy) { const v = f.mesh.position.clone().add(new T.Vector3(0, f.h + .25, 0)).project(D.camera); const b = document.createElement('div'); b.className = 'r3-bang'; b.textContent = '!'; b.style.left = (v.x * .5 + .5) * host.clientWidth + 'px'; b.style.top = (-v.y * .5 + .5) * host.clientHeight + 'px'; host.appendChild(b); }
    // prompts
    near = null; let best = 1.9;
    for (const it of ITEMS) { if (it.done) continue; const d = Math.hypot(it.x - pos.x, it.z - pos.z); if (d < best && Math.abs((it.y || 0) - pos.y) < 1) { best = d; near = it; } }
    const pr = $('.r3-prompt');
    if (near && !busy) { pr.style.display = 'block'; pr.lastChild.textContent = near.label; pr.firstChild.textContent = touch ? 'ACT' : 'E'; } else pr.style.display = 'none';
  });
  function destroy() { gone = true; D.paused = true; D.dead = true; removeEventListener('keydown', kd, true); removeEventListener('keyup', ku, true); try { D.renderer.dispose(); D.renderer.forceContextLoss(); } catch (_) {} host.innerHTML = ''; }
  banner('', '', 1);
  window.__R3 = { pos, FOES, ITEMS };
  return { destroy, pause: setPause };
}
