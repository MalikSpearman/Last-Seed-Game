import { Diorama, T } from './diorama.js';
import { KAEDE } from './kaede_frames.js';

const Q = new URLSearchParams(location.search);
const quality = Q.get('q') || (matchMedia('(pointer:coarse)').matches ? 'low' : 'high');
const D = new Diorama(document.getElementById('c'), { quality, fogNear: 20, fogFar: 70, fogColor: 0x0c1430 });
const I = n => 'img/' + n + '.webp';
if (matchMedia('(pointer:coarse)').matches) document.body.classList.add('touch');

import { P, nearest, build } from './scene_bamboo.js';
const fill = new T.PointLight(0xffe2c0, 9, 7, 1.4); D.scene.add(fill);
(async () => {
  await build(D);
  const A = (n, x, z, h, o) => D.prop(I(n), x, z, h, o);
  for (const it of ITEMS) it.mesh = await A(it.img, it.x, it.z, it.h, { y: it.y || 0 });
  for (const f of FOES) { f.mesh = await A('foe_' + f.id, f.x, f.z, f.h, { y: f.y || 0, flip: 1 }); f.base = f.mesh.scale.y; }
  ready = true;
})();

const ITEMS = [
  { img: 'rp_pot', x: -36, z: 3.6, h: .75, kind: 'pot', label: 'Break the pot' },
  { img: 'rp_barrel', x: -5, z: 5.6, h: .9, kind: 'pot', label: 'Smash the barrel' },
  { img: 'rp_chest', x: 2.5, z: -.6, h: .75, kind: 'chest', label: 'Open the chest' },
  { img: 'rp_food', x: 11, z: 3.8, h: .5, kind: 'food', label: 'Eat the onigiri' },
  { img: 'rp_crates', x: 19.5, z: .2, h: .9, kind: 'pot', label: 'Break the crates' },
  { img: 'rp_scroll', x: 31, z: -10, h: .7, y: 3, kind: 'scroll', label: 'Read the technique scroll' },
  { img: 'rp_rchest', x: 23.6, z: -16.5, h: .85, y: 3, kind: 'chest', label: 'Open the sealed offering' },
];
const FOES = [
  { id: 'tanuki', x: -2, z: 2.2, h: 1.7, name: 'Tanuki' },
  { id: 'tengu', x: 14, z: 2.4, h: 2.1, name: 'Tengu' },
  { id: 'nue', x: 27, z: -14, h: 2.6, y: 3, name: 'Nue' },
];
let ready = false;

// ── Kaede ──
const hero = D.actor('../img/roam_kaede.webp', KAEDE, 230, { fps: 11 });
const pos = new T.Vector3(-38, 0, 1.6), vel = new T.Vector2();
hero.root.position.copy(pos);

// ── input ──
const keys = {}; addEventListener('keydown', e => { keys[e.code] = 1; if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') act(); }); addEventListener('keyup', e => keys[e.code] = 0);
const joy = document.getElementById('joy'), knob = joy.firstElementChild; let jv = { x: 0, y: 0 }, jid = null;
joy.addEventListener('pointerdown', e => { jid = e.pointerId; joy.setPointerCapture(jid); jmove(e); });
joy.addEventListener('pointermove', e => { if (e.pointerId === jid) jmove(e); });
const jend = () => { jid = null; jv = { x: 0, y: 0 }; knob.style.transform = ''; }; joy.addEventListener('pointerup', jend); joy.addEventListener('pointercancel', jend);
function jmove(e) { const r = joy.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), L = Math.hypot(dx, dy), m = r.width * .38; const k = Math.min(1, L / m); jv = { x: dx / (L || 1) * k, y: dy / (L || 1) * k }; knob.style.transform = `translate(${jv.x * m}px,${jv.y * m}px)`; }
document.getElementById('act').onclick = () => act();
document.getElementById('q').onclick = () => { location.search = '?q=' + (quality === 'high' ? 'low' : 'high'); };
document.getElementById('q').textContent = 'Quality: ' + (quality === 'high' ? 'High' : 'Low');

// ── interaction ──
const prompt = document.getElementById('prompt'), flash = document.getElementById('flash'); let near = null, busy = false;
function pop(txt, wp) { const v = wp.clone().project(D.camera); const el = document.createElement('div'); el.className = 'pop'; el.textContent = txt; el.style.left = (v.x * .5 + .5) * innerWidth + 'px'; el.style.top = (-v.y * .5 + .5) * innerHeight + 'px'; document.body.appendChild(el); setTimeout(() => el.remove(), 1300); }
function act() {
  if (!near || busy) return; const n = near;
  if (n.foe) { busy = true; flash.style.transition = 'none'; flash.style.opacity = .9; requestAnimationFrame(() => { flash.style.transition = 'opacity .6s'; flash.style.opacity = 0; }); pop('FIGHT!', n.mesh.position.clone().add(new T.Vector3(0, n.h + .3, 0))); setTimeout(() => { n.done = 1; n.mesh.visible = false; busy = false; pop(n.name + ' defeated', pos.clone().add(new T.Vector3(0, 2.2, 0))); }, 900); hero.set('jab'); setTimeout(() => hero.set('idle'), 500); return; }
  n.done = 1; const at = n.mesh.position.clone().add(new T.Vector3(0, n.h + .2, 0));
  if (n.kind === 'pot') { n.mesh.visible = false; pop('+' + (3 + (Math.random() * 5 | 0)) + ' Mon', at); }
  if (n.kind === 'chest') { n.mesh.material.map = D.constructor && n.mesh.material.map; pop(n.img === 'rp_rchest' ? 'Relic found!' : '+12 Mon', at); n.mesh.material.color.set(0x777777); }
  if (n.kind === 'food') { n.mesh.visible = false; pop('+8 HP', at); }
  if (n.kind === 'scroll') { n.mesh.visible = false; pop('New technique!', at); }
}

// ── loop ──
const small = Math.min(innerWidth, innerHeight) < 520; const camOff = small ? new T.Vector3(0, 6.2, 11) : new T.Vector3(0, 7.6, 13.5), camPos = new T.Vector3(), look = new T.Vector3(); let first = true, fpsT = 0, fpsN = 0;
const fpsEl = document.getElementById('fps'); setTimeout(() => document.getElementById('card').style.opacity = 0, 3200);
D.frame((dt, t) => {
  let ix = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0) + jv.x;
  let iz = (keys.KeyS || keys.ArrowDown ? 1 : 0) - (keys.KeyW || keys.ArrowUp ? 1 : 0) + jv.y;
  const L = Math.hypot(ix, iz); if (L > 1) { ix /= L; iz /= L; }
  const sp = 5.2; vel.x += (ix * sp - vel.x) * Math.min(1, dt * 12); vel.y += (iz * sp - vel.y) * Math.min(1, dt * 12);
  let nx = pos.x + vel.x * dt, nz = pos.z + vel.y * dt; let n = nearest(nx, nz);
  if (n.over > 0) { const k = n.w / n.d; nx = n.px + (nx - n.px) * k; nz = n.pz + (nz - n.pz) * k; n = nearest(nx, nz); }
  pos.x = nx; pos.z = nz; pos.y += (n.y - pos.y) * Math.min(1, dt * 14);
  hero.root.position.copy(pos); fill.position.set(pos.x - .6, pos.y + 2.2, pos.z + 2.4);
  const moving = Math.hypot(vel.x, vel.y) > .6; if (!busy) hero.set(moving ? 'run' : 'idle'); if (Math.abs(vel.x) > .3) hero.face = vel.x > 0 ? 1 : -1;
  hero.fps = moving ? 6 + Math.hypot(vel.x, vel.y) * 1.2 : 2;
  // camera: tilted follow with a little lead in the walking direction
  const tgt = new T.Vector3(pos.x + vel.x * .35, pos.y, pos.z + vel.y * .2);
  const want = tgt.clone().add(camOff); if (first) { camPos.copy(want); look.copy(tgt); first = false; }
  camPos.lerp(want, Math.min(1, dt * 3.2)); look.lerp(tgt.clone().add(new T.Vector3(0, 1.1, -1.4)), Math.min(1, dt * 4));
  D.camera.position.copy(camPos); D.camera.lookAt(look);
  D.focus = pos; D.followShadow(pos); D.fadeFor(pos);
  // nearby things
  near = null; let best = 1.9;
  if (ready) { for (const it of ITEMS) { if (it.done) continue; const d = Math.hypot(it.x - pos.x, it.z - pos.z); if (d < best && Math.abs((it.y || 0) - pos.y) < 1) { best = d; near = it; } }
    for (const f of FOES) { if (f.done) continue; f.mesh.scale.y = f.base * (1 + Math.sin(t * 2.4 + f.x) * .018); const d = Math.hypot(f.x - pos.x, f.z - pos.z); if (d < 2.6 && Math.abs((f.y || 0) - pos.y) < 1 && d < best + .7) { best = d; near = Object.assign(f, { foe: 1 }); } } }
  if (near) { prompt.style.display = 'block'; prompt.lastChild.textContent = near.foe ? 'Fight the ' + near.name : near.label; prompt.firstChild.textContent = matchMedia('(pointer:coarse)').matches ? '●' : 'E'; } else prompt.style.display = 'none';
  fpsN++; fpsT += dt; if (fpsT > .5) { fpsEl.textContent = Math.round(fpsN / fpsT) + ' fps · ' + quality; fpsN = 0; fpsT = 0; }
});
window.__r3d = { D, pos, hero, nearest };
