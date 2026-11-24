// HD-2D fight stage test: the Moonlit Bamboo Road set behind a battle, with a living camera.
// In the game the fighters and HUD stay as they are; this page fakes a fight so the camera work can be judged.
import { Diorama, T } from './diorama.js';
import { build } from './scene_bamboo.js';
import { KAEDE } from './kaede_frames.js';

const Q = new URLSearchParams(location.search);
const quality = Q.get('q') || (matchMedia('(pointer:coarse)').matches ? 'low' : 'high');
const D = new Diorama(document.getElementById('c'), { quality, fogNear: 14, fogFar: 60, fogColor: 0x0c1430 });
D.camera.fov = 38; D.camera.updateProjectionMatrix(); D.faceCam = 1;
D.post.uniforms.band.value = .26; D.post.uniforms.focus.value = .5;

const STAGES = {
  road:   { name: 'Lantern Road', c: [-0.6, 0, 2.0], off: [0, 2.3, 7.6], gap: 2.3 },
  shrine: { name: 'Shrine Steps', c: [27, 3, -17.2], off: [0, 2.0, 6.3], gap: 2.1 },
  bridge: { name: 'Red Bridge',   c: [-16, 1.5, 2.6], off: [0, 2.0, 7.2], gap: 1.9 },
};
let S = STAGES[Q.get('s')] || STAGES.road;

const hero = D.actor('../img/roam_kaede.webp', KAEDE, 230, { fps: 3 });
let foe = null;
const fill = new T.PointLight(0xffe2c0, 10, 9, 1.4); D.scene.add(fill);
(async () => {
  await build(D);
  foe = await D.prop('img/foe_nue.webp', 0, 0, 2.6, { flip: 1, blob: false }); foe.userData.blob = D.blob(0, 0, 1.1);
  place(S);
})();

function place(s) {
  S = s; const [x, y, z] = s.c;
  hero.root.position.set(x - s.gap, y, z); hero.face = 1;
  if (foe) { foe.position.set(x + s.gap, y, z); foe.userData.base = foe.position.clone(); foe.userData.blob.position.set(x + s.gap, y + .02, z); }
  fill.position.set(x, y + 2.6, z + 3);
  document.getElementById('lbl').textContent = s.name;
  document.querySelectorAll('[data-s]').forEach(b => b.classList.toggle('on', STAGES[b.dataset.s] === s));
}
document.querySelectorAll('[data-s]').forEach(b => b.onclick = () => place(STAGES[b.dataset.s]));

// ── camera rig: idle drift, push-in on hits, orbit sweep on supers ──
let hitK = 0, hitSide = 1, supT = -1, shake = 0;
function hit(side = 1, big = false) {
  hitK = big ? 1.4 : 1; hitSide = side; shake = big ? .14 : .08; D.post.uniforms.flash.value = big ? .35 : .18;
  const tgt = side > 0 ? foe : hero.root; if (!tgt) return;
  const v = tgt.position.clone().add(new T.Vector3(0, 1.6, 0)).project(D.camera);
  const n = document.createElement('div'); n.className = 'num'; n.textContent = big ? 24 : 6 + (Math.random() * 6 | 0);
  n.style.left = (v.x * .5 + .5) * innerWidth + 'px'; n.style.top = (-v.y * .5 + .5) * innerHeight + 'px'; document.body.appendChild(n); setTimeout(() => n.remove(), 900);
  if (side > 0 && foe) { foe.material.emissive.set(0xffffff); foe.material.emissiveIntensity = 1.2; foe.userData.kb = .45; }
}
let lunge = 0;
function attack(big) {
  lunge = 1; hero.set('jab');
  setTimeout(() => hit(1, big), 170); setTimeout(() => hero.set('idle'), 420);
}
function superArt() { supT = 0; hero.set('win'); setTimeout(() => { attack(true); }, 1100); }
document.getElementById('hit').onclick = () => attack(false);
document.getElementById('sup').onclick = () => superArt();
let auto = true; const autoB = document.getElementById('auto'); autoB.onclick = () => { auto = !auto; autoB.classList.toggle('on', auto); };
let nextAuto = 2.2, autoN = 0;

const fpsEl = document.getElementById('fps'); let fT = 0, fN = 0;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
D.frame((dt, t) => {
  if (auto && t > nextAuto) { autoN++; if (autoN % 4 === 0) superArt(); else attack(false); nextAuto = t + (autoN % 4 === 0 ? 4.2 : 2.4); }
  const [cx, cy, cz] = S.c;
  // fighters
  lunge = Math.max(0, lunge - dt * 3.2); const lx = Math.sin(Math.min(1, lunge) * Math.PI) * 1.1;
  hero.root.position.x = cx - S.gap + lx; hero.root.rotation.y = Math.atan2(D.camera.position.x - hero.root.position.x, D.camera.position.z - hero.root.position.z);
  if (foe && foe.userData.base) { const u = foe.userData; u.kb = Math.max(0, (u.kb || 0) - dt * 1.6); foe.position.x = u.base.x + u.kb * .9; foe.scale.y = 1 + Math.sin(t * 2.3) * .018;
    foe.material.emissiveIntensity = Math.max(0, foe.material.emissiveIntensity - dt * 6); }
  // camera
  hitK = Math.max(0, hitK - dt * 2.4); shake = Math.max(0, shake - dt * .5); D.post.uniforms.flash.value = Math.max(0, D.post.uniforms.flash.value - dt * 1.6);
  let ang = Math.sin(t * .13) * .05, dist = 1, lift = 0;
  if (supT >= 0) { supT += dt; const u = Math.min(1, supT / 1.6); ang = -.32 + ease(u) * .58; dist = 1 - Math.sin(u * Math.PI) * .22; lift = Math.sin(u * Math.PI) * -.4; if (supT > 2.4) supT = -1; }
  const k = ease(Math.min(1, hitK));
  const off = new T.Vector3(S.off[0] + Math.sin(t * .21) * .35, S.off[1] + Math.sin(t * .17) * .1 + lift, S.off[2] * dist - k * 1.3);
  off.applyAxisAngle(new T.Vector3(0, 1, 0), ang);
  const focusX = cx + hitSide * S.gap * .45 * k;
  D.camera.position.set(focusX + off.x + (Math.random() - .5) * shake, cy + off.y + (Math.random() - .5) * shake, cz + off.z);
  D.camera.lookAt(focusX, cy + 1.25, cz);
  D.focus = { x: cx, z: cz }; D.followShadow(new T.Vector3(cx, cy, cz)); D.camera.fov = 38 - k * 5; D.camera.updateProjectionMatrix();
  fN++; fT += dt; if (fT > .5) { fpsEl.textContent = Math.round(fN / fT) + ' fps · ' + quality; fN = 0; fT = 0; }
});
window.__stage = { D, place, STAGES, hit, superArt };
