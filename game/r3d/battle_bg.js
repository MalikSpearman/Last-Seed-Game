// HD-2D battle backdrop: the Moonlit Bamboo Road set rendered behind the normal battle screen.
// Fighters, cards and HUD stay DOM. The camera fits itself so each fighter's feet land on the set's clearing,
// the moon casts each fighter's silhouette onto the 3D ground, and the sprites pick up the set's light and shade.
import { Diorama, T } from './diorama.js';
import { build } from './scene_bamboo.js';
import { buildPainted, setsMeta, nameOf } from './scene_painted.js';
import { ArenaFX } from './arena_fx.js';
import { look } from './kit.js';
let FX = null;

// c: the clearing's centre; gap: half the distance between the two fighters on it (kept clear of props)
// slots: where backup foes stand in a group fight (x, z on the enemy's side, all behind the main enemy and clear of props);
// sum: where a summon stands for the player's side (mirrored across the centre for a rival's summon)
const PRESETS = {
  road:   { c: [-1.5, 0, 2.4], gap: 3.4, pitch: .2, cover: 1.5,     // lantern string centred between them, stone lanterns framing each side
            slots: [[3.9, -.2], [-.7, -1.2], [2.5, -2.6]], sum: [-2.9, 3.4] },
  shrine: { c: [27, 3, -9.2], gap: 3.3, pitch: .2, cover: 1.5,      // the torii frames the shrine hall behind them, guardian lions flanking
            slots: [[32.3, -11.8], [27.7, -12.8], [30.9, -14.2]], sum: [25.2, -8.3] },
  bridge: { c: [-16, 1, 2.6], gap: 3.3, sz: .48, pitch: .2, cover: 1.5,       // both fighters up on the flat span of the red bridge, the stream running below them
            slots: [[-11.4, 2.0], [-7.2, -.2, -1], [-5.6, 1.6, -1]], sum: [-20.4, 3.0] },   // the crew: one on the deck behind the boss, two waiting on the far bank
};
let D = null, cv = null, built = null, P = PRESETS.road, key = 'road';
// counter over-the-shoulder: on the 3D sets the camera swings behind the defender and looks down the line at the attacker (painted sets keep their framing)
const OTS = { on: false, def: 'p', k: 0, mode: 'tight', w: 0, F0: null, R0: null, own: false };
// every location is its own little world (scene, lights, lanterns, living scenery, effects); the bamboo road plus the
// last painted location stay in memory, the one before that is thrown away
const KEEP = ['scene', 'moon', 'spots', 'pool', 'billboards', 'updaters', 'backdropMesh'];
let cur = null, bamboo = null, painted = null, lock = Promise.resolve();
function use(cx) {
  if (cur === cx) return; if (cur) for (const k of KEEP) cur[k] = D[k];
  for (const k of KEEP) D[k] = cx[k]; cur = cx; FX = cx.fx; D.setFX(cx.look || {});
  for (const k in casters) cx.scene.add(casters[k].m);
  // a painted set already carries its painter's colour: show it as painted (no filmic curve) — the bamboo set keeps its grade
  const tm = cx.painted ? T.NoToneMapping : T.ACESFilmicToneMapping; if (D.renderer.toneMapping !== tm) { D.renderer.toneMapping = tm; D.post.needsUpdate = true; }
  // modelled sets are night scenes lit to read like their bright anime paintings, so they run a stronger exposure
  D.renderer.toneMappingExposure = cx.painted ? 1 : cx.modeled ? (cx.P && cx.P.exposure) || 1.75 : 1.15;
}
function blank(scene) { return { scene, moon: null, spots: undefined, pool: undefined, billboards: [], updaters: [], backdropMesh: null, fx: null }; }
function disposeCtx(cx) {
  for (const k in casters) if (casters[k].m.parent === cx.scene) casters[k].m.removeFromParent();
  cx.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const ms = o.material ? [].concat(o.material) : []; for (const m of ms) { for (const v of Object.values(m)) if (v && v.isTexture) v.dispose(); m.dispose(); } });
  if (cx.moon && cx.moon.shadow && cx.moon.shadow.map) cx.moon.shadow.map.dispose();
}
async function bambooCtx() {
  if (!bamboo) { bamboo = blank(D.scene0); bamboo.painted = false; use(bamboo); bamboo.ready = build(D).then(() => { deHaze(D.scene); bamboo.fx = FX = new ArenaFX(D); bamboo.look = {}; try { D.envLight(); } catch (_) {} }); }
  use(bamboo); await bamboo.ready; return bamboo;
}
async function paintedCtx(name, url) {
  if (painted && painted.name === name) { use(painted); await painted.ready; return painted; }
  const old = painted, cx = painted = blank(new T.Scene()); cx.name = name; cx.painted = true; cx.look = { bloom: .3, thr: 1.35, ao: 0, env: 0 };   /* the painting already has its light baked in: only its hottest spots bloom */
  use(cx); cx.ready = buildPainted(D, name, url, [0, 0, 0]).then(pp => { cx.P = pp; cx.fx = FX = new ArenaFX(D); cx.fx.flat = true; });
  if (old && old !== cx) { if (cur === old) use(cx); disposeCtx(old); }
  await cx.ready; return cx;
}
// modelled sets: real 3D dioramas built for a backdrop; they take over from that backdrop's painted relief
// a backdrop whose name a bamboo spot already uses (road / shrine / bridge) maps to its modelled set here
const BYBG = { shrine: 'fox_shrine' };
const MODELED = { festival: () => import('./scene_festival.js'), blight: () => import('./scene_blight.js'), marsh: () => import('./scene_marsh.js'),
  seacave: () => import('./scene_seacave.js'), harbor: () => import('./scene_harbor.js'), nw_street: () => import('./scene_nw_street.js'),
  sunken: () => import('./scene_sunken.js'), mountain_pass: () => import('./scene_mountain_pass.js'), rooftops: () => import('./scene_rooftops.js'),
  nw_express: () => import('./scene_nw_express.js'), w_village: () => import('./scene_w_village.js'), w_graves: () => import('./scene_w_graves.js'),
  sakebar: () => import('./scene_sakebar.js'), nw_teahouse: () => import('./scene_nw_teahouse.js'), nw_roof: () => import('./scene_nw_roof.js'),
  e_whale: () => import('./scene_e_whale.js'), e_light: () => import('./scene_e_light.js'), e_dojo: () => import('./scene_e_dojo.js'), w_mill: () => import('./scene_w_mill.js'),
  nw_snack: () => import('./scene_nw_snack.js'), nw_pachinko: () => import('./scene_nw_pachinko.js'), nw_casino: () => import('./scene_nw_casino.js'), nw_web: () => import('./scene_nw_web.js'), fox_shrine: () => import('./scene_shrine.js'), w_bamboo: () => import('./scene_w_bamboo.js'),
  tama: () => import('./scene_catroom.js'), zoomies: () => import('./scene_catroom.js'), landlord: () => import('./scene_landlord.js'), calamity: () => import('./scene_calamity.js'),
  weather: () => import('./scene_weather.js'), weather2: () => import('./scene_weather.js'), sun: () => import('./scene_sun.js'), sun2: () => import('./scene_sun.js'),
  rushhour: () => import('./scene_rushhour.js'), rushhour2: () => import('./scene_rushhour.js'),
  reno: () => import('./scene_reno.js'), proctor: () => import('./scene_proctor.js'), proctor2: () => import('./scene_proctor.js'), oba: () => import('./scene_oba.js'), oba2: () => import('./scene_oba.js'),
  kuzuryu: () => import('./scene_kuzuryu.js'), kuzuryu2: () => import('./scene_kuzuryu.js'), holdline: () => import('./scene_holdline.js'), holdline2: () => import('./scene_holdline.js'),
  golfdad: () => import('./scene_golfdad.js'), golfdad2: () => import('./scene_golfdad.js'), road: () => import('./scene_road.js'), ring: () => import('./scene_ring.js') };
// untextured puffs (steam, spray, smoke) draw as flat translucent squares, which read as white haze over the set:
// give them a soft round shape and a lighter touch
let PUFF = null;
function deHaze(S) {
  if (!PUFF) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.45, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); PUFF = new T.CanvasTexture(c); }
  const seen = new Set();
  S.traverse(o => { if (!o.isSprite) return; const m = o.material; if (!m || m.map || seen.has(m)) return; seen.add(m); m.map = PUFF; m.depthWrite = false; m.transparent = true;
    if (m.blending !== T.AdditiveBlending) { const L = .3 * m.color.r + .59 * m.color.g + .11 * m.color.b; if (L > .6) m.opacity *= .6; } m.needsUpdate = true; });
}
// Keep one spare modelled arena: either the prepared Rushdown neighbour or the arena we just left.
let modeled = null, spare = null;
async function modeledCtx(name) {
  if (modeled && modeled.name === name) { use(modeled); await modeled.ready; return modeled; }
  if (spare && spare.name === name) {
    const next = spare;
    await next.ready;
    spare = modeled;
    modeled = next;
    use(modeled);
    return modeled;
  }
  const old = modeled, cx = modeled = blank(new T.Scene()); cx.name = name; cx.painted = false; cx.modeled = true;
  use(cx); cx.ready = MODELED[name]().then(async mod => { await mod.build(D, /2$/.test(name) ? 2 : 1, name); /* boss arenas: a name ending in 2 is the second-phase look */ deHaze(D.scene); cx.P = mod.PRESET; cx.fx = FX = new ArenaFX(D); D.renderer.toneMappingExposure = cx.P.exposure || 1.75; cx.look = look(name, cx.P); D.setFX(cx.look); try { D.envLight({ env: cx.look.env }); } catch (_) {} });
  await cx.ready;
  if (old) {
    if (spare && spare.name === NEXT[name]) disposeCtx(old);
    else {
      if (spare) disposeCtx(spare);
      spare = old;
    }
  }
  return cx;
}
// is there a 3D set for this fight? (a roam fight names its bamboo spot; otherwise the fight's backdrop decides)
export async function covers(bgUrl, k) { if (k) return true; const n = nameOf(bgUrl); if (!n) return false; if (n === 'w_bamboo' || MODELED[n]) return true; return !!(await setsMeta())[n]; }
let hitK = 0, hitSide = 1, shake = 0, supT = -1, fit = null;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
const casters = {}, lits = {};

// ── read where the DOM fighters stand ──
function fighters() {
  const out = {};
  document.querySelectorAll('.scr.battle .fighter').forEach(f => {
    const side = f.classList.contains('e') ? 'e' : f.classList.contains('p') ? 'p' : null; if (!side) return;
    const img = f.querySelector('.spr img'), sh = f.querySelector('.shadow'); if (!img) return;
    const r = img.getBoundingClientRect(), s = sh ? sh.getBoundingClientRect() : null;
    if (r.width < 4) return;
    out[side] = { f, img, x: s ? s.left + s.width / 2 : r.left + r.width / 2, y: s ? s.top + s.height * .5 : r.bottom, top: r.top, h: (s ? s.top + s.height * .5 : r.bottom) - r.top, w: r.width };
  });
  return out;
}
const ndc = (x, y) => [x / innerWidth * 2 - 1, -(y / innerHeight) * 2 + 1];
// ── everyone else on the field: backup foes in group fights (.gim) and summoned creatures (.smn) ──
let xid = 0;
function extras() {
  const out = [];
  document.querySelectorAll('.scr.battle .gpack .gim img, .scr.battle .smn .smi img').forEach(img => {
    if (!img.complete || !img.naturalWidth) return;
    const cs = getComputedStyle(img), op = +cs.opacity;
    const r = img.getBoundingClientRect(); if (r.width < 4 || r.height < 4) return;
    if (!img.dataset.l3) img.dataset.l3 = 'x' + (++xid);
    const host = img.closest('.gim,.smn'), mir = !!img.closest('.gim') || !!img.closest('.smn.e');
    const fop = host ? +getComputedStyle(host).opacity : 1;
    out.push({ key: img.dataset.l3, f: host, img, x: r.left + r.width / 2, y: r.bottom, top: r.top, h: r.height, w: r.width, mir, op: op * fop, dim: !!img.closest('.gim') });
  });
  return out;
}
// screen point -> the set's ground plane (y = clearing height)
function groundAt(x, y, gy) {
  const [nx, ny] = ndc(x, y), cam = D.camera, v = new T.Vector3(nx, ny, .5).unproject(cam).sub(cam.position).normalize();
  if (v.y > -1e-3) return null; const t = (gy - cam.position.y) / v.y; return cam.position.clone().add(v.multiplyScalar(t));
}

// ── camera fit: choose distance, lateral shift and aim so the clearing's two marks sit under the fighters' feet ──
// sz: how much of the set one fighter-gap spans; under 1 brings the camera in so the set reads at the fighters' true size (no giants on a tiny bridge)
// the comic look for the built sets: ink lines, soft cel bands, a little more colour, less photographic depth-of-field
const STY = { pitch: .08, ink: 1, inkW: 1.8, cel: .25, sat: .2, amt: .25 };
const SZ_DEF = .5;   // the built 3D sets are at real scale; .5 puts a fighter at about a person's height on them (painted sets keep their own framing)
const szOf = () => window.__ls3dSz || P.sz || (P.painted ? 1 : SZ_DEF);
const gapNow = () => szOf() * (P.cover ? P.gap * Math.min(1, D.camera.aspect / P.cover) * fz : P.gap);
function solveFit(F) {
  // exact: with the camera's angle fixed, two marks at the same depth pin its position (depth from their spacing, offset from their midpoint)
  const [cx, cy, cz] = P.c, cam = D.camera, ph = window.__ls3dPitch != null ? window.__ls3dPitch : (P.painted ? P.pitch : Math.min(P.pitch, STY.pitch));
  const want = F && F.p && F.e ? [ndc(F.p.x, F.p.y), ndc(F.e.x, F.e.y)] : [[-.5, -.52], [.5, -.52]];
  const t = Math.tan(cam.fov * Math.PI / 360), asp = cam.aspect;
  const sep = Math.max(.15, want[1][0] - want[0][0]), xm = (want[0][0] + want[1][0]) / 2, ym = (want[0][1] + want[1][1]) / 2;
  const depth = 2 * gapNow() / (sep * t * asp);
  const vx = xm * t * asp * depth, vy = ym * t * depth;
  const f = new T.Vector3(0, -Math.sin(ph), -Math.cos(ph)), u = new T.Vector3(0, Math.cos(ph), -Math.sin(ph)), r = new T.Vector3(1, 0, 0);
  const M = new T.Vector3(cx, cy, cz);
  const C = M.clone().sub(r.clone().multiplyScalar(vx)).sub(u.clone().multiplyScalar(vy)).sub(f.clone().multiplyScalar(depth));
  return { C, f, M, depth };
}

// over the shoulder: behind the defender's mark and a little toward the audience, aimed past them at the attacker.
// Sizes come from the fighters themselves (their measured height on screen at the fit camera's depth), so it frames the same on every set.
// 'tight' is the counter window; 'wide' swings round to a three-quarter view for the outcome, so lunges read along the ground.
const OTSP = { tight: { back: 1.25, lat: .95, up: .9, aim: .6, look: .5 }, wide: { back: 1.25, lat: 1.7, up: 1.0, aim: .5, look: .55 } };
const lerp = (a, b, t) => a + (b - a) * t;
function otsCam(u) {
  const [cx, cy, cz] = P.c, cam = D.camera, g = gapNow(), F0 = OTS.F0 || {}, sg = OTS.def === 'p' ? -1 : 1;
  const Dm = new T.Vector3(cx + sg * g, cy, cz), Am = new T.Vector3(cx - sg * g, cy, cz);
  // fighter height in world units, from the defender's size on screen at the fit camera
  const fd = F0[OTS.def], z0 = Math.max(1, -Dm.clone().applyMatrix4(cam.matrixWorldInverse).z), tanH = Math.tan(cam.fov * Math.PI / 360);
  const Hw = fd && fd.h > 4 ? fd.h / innerHeight * 2 * z0 * tanH : g * .9;
  const A = OTSP.tight, B = OTSP.wide, w = OTS.w, q = k => lerp(A[k], B[k], w);
  const dirH = Am.clone().sub(Dm).setY(0).normalize(), side = new T.Vector3(0, 0, 1);
  const pos = Dm.clone().sub(dirH.clone().multiplyScalar(Hw * q('back') * 1.6)).add(side.multiplyScalar(Hw * q('lat'))).add(new T.Vector3(0, Hw * q('up'), 0));
  const look = Dm.clone().lerp(Am, q('aim')).add(new T.Vector3(0, Hw * q('look'), 0));
  const p0 = cam.position.clone(), l0 = p0.clone().add(cam.getWorldDirection(new T.Vector3()).multiplyScalar(z0));
  cam.position.copy(p0.lerp(pos, u)); cam.lookAt(l0.lerp(look, u)); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
}
// the DOM fighters ride on their marks: same ground point, scaled by its depth, for whatever angle the set's camera holds
const MARK = sd => { const [cx, cy, cz] = P.c, g = gapNow(); return new T.Vector3(cx + (sd === 'e' ? g : -g), cy, cz); };
function markView(cam) { const o = {}; for (const sd of ['p', 'e']) { const m = MARK(sd), v = m.clone().applyMatrix4(cam.matrixWorldInverse), s = m.clone().project(cam); o[sd] = { x: (s.x + 1) / 2 * innerWidth, y: (1 - s.y) / 2 * innerHeight, z: Math.max(.05, -v.z) }; } return o; }
function rideMarks(V0, V1) {
  for (const sd of ['p', 'e']) { const f0 = OTS.F0 && OTS.F0[sd], r0 = OTS.R0 && OTS.R0[sd]; if (!f0 || !r0) continue; const el = f0.f;
    const kk = r0.k || 1, dx = (V1[sd].x - V0[sd].x) / kk, dy = (V1[sd].y - V0[sd].y) / kk, sc = Math.min(4, V0[sd].z / V1[sd].z);
    el.style.transition = 'none'; el.style.transformOrigin = `${((f0.x - r0.left) / kk).toFixed(1)}px ${((f0.y - r0.top) / kk).toFixed(1)}px`;
    el.style.transform = `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(${sc.toFixed(4)})`; el.style.zIndex = V1[sd].z < V1[sd === 'p' ? 'e' : 'p'].z ? 6 : 4; }
  OTS.own = true; }
function releaseMarks() { if (!OTS.own) return; OTS.own = false; for (const sd of ['p', 'e']) { const f0 = OTS.F0 && OTS.F0[sd]; if (!f0) continue; f0.f.style.transform = ''; f0.f.style.transformOrigin = ''; f0.f.style.zIndex = ''; f0.f.style.transition = ''; } OTS.F0 = null; OTS.R0 = null; }

// ── 2D people in a 3D place: each fighter's CURRENT frame (base art, awakened art, kneel, attack/launch pose) is laid on the
//    ground as a dark silhouette, sheared away from the set's light. Rebuilt from whatever is on screen every frame, so the
//    shadow follows the pose; a fighter in the air leaves the shadow on the ground under them, fainter and further out. ──
const SHIMG = {};
let shadowWorker, nextMaskId = 0;
const pendingMasks = new Map();
function shadowMaskWorker() {
  if (shadowWorker !== undefined) return shadowWorker;
  try {
    const worker = new Worker(new URL('./shadow_mask_worker.js', import.meta.url));
    shadowWorker = worker;
    worker.onmessage = ({ data: { id, bytes } }) => {
      const finish = pendingMasks.get(id);
      pendingMasks.delete(id);
      finish?.(bytes);
    };
    worker.onerror = () => {
      worker.terminate();
      shadowWorker = null;
      for (const finish of pendingMasks.values()) finish();
      pendingMasks.clear();
    };
  } catch { shadowWorker = null; }
  return shadowWorker;
}
function poseFrame(f) {
  const pe = f && f.querySelector('.spr .pose');
  if (!pe || !pe._pf) return null;
  const r = pe.getBoundingClientRect();
  return r.width >= 4 ? { pf: pe._pf, r } : null;
}
function shadowPixels(tex, bytes, width, height) {
  // Three.js retains the original GPU allocation until the texture is disposed.
  if (tex.image.width !== width || tex.image.height !== height) tex.dispose();
  tex.image = { data: new Uint8Array(bytes), width, height };
  tex.needsUpdate = true;
}
function caster(side, fd) {
  let c = casters[side];
  const worker = shadowMaskWorker();
  if (!c) {
    const tex = new T.DataTexture();
    tex.colorSpace = T.SRGBColorSpace;
    tex.flipY = true;
    tex.generateMipmaps = true;
    tex.minFilter = T.LinearMipmapLinearFilter;
    tex.magFilter = T.LinearFilter;
    const m = new T.Mesh(new T.PlaneGeometry(1, 1).translate(0, .5, 0), new T.MeshBasicMaterial({ map: tex, color: 0x000000, transparent: true, opacity: .8, alphaTest: .02, depthWrite: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, fog: false }));
    m.matrixAutoUpdate = false; m.renderOrder = 2; m.castShadow = false; m.receiveShadow = false;
    D.scene.add(m); c = casters[side] = { m, tex, src: '', key: '' };
  }
  const pose = poseFrame(fd.f), im = fd.img;
  let src, crop, w, h;
  if (pose) {
    const q = pose.pf;
    src = new URL(q.src, document.baseURI).href;
    crop = [q.x, q.y, q.w, q.h];
    [w, h] = [q.w, q.h];
    c.rect = pose.r;
  } else if (im && im.style.visibility !== 'hidden' && im.complete && im.naturalWidth) {
    src = im.currentSrc || im.src;
    [w, h] = [im.naturalWidth, im.naturalHeight];
    c.rect = im.getBoundingClientRect();
  } else {
    c.rect = c.target = null;
    return c;
  }
  const key = crop ? src + '|' + crop.join(',') : src;
  c.target = key;
  if (key === c.key || c.pending) return c;
  const scale = Math.min(1, 128 / Math.max(w, h));
  const width = Math.max(4, Math.round(w * scale)), height = Math.max(4, Math.round(h * scale));
  if (worker && key !== c.failed) {
    const id = ++nextMaskId;
    c.pending = true;
    pendingMasks.set(id, bytes => {
      c.pending = false;
      if (!bytes) c.failed = key;
      else if (c.target === key && casters[side] === c) {
        shadowPixels(c.tex, bytes, width, height);
        c.src = c.key = key;
      }
    });
    worker.postMessage({ id, src, crop, width, height });
  } else {
    // Older browser engines can still build the same mask synchronously.
    if (pose) {
      let image = SHIMG[src];
      if (!image) { image = SHIMG[src] = new Image(); image.src = src; }
      if (!image.complete || !image.naturalWidth) return c;
    }
    const canvas = c.canvas ||= document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    canvas.width = width;
    canvas.height = height;
    if (crop) ctx.drawImage(SHIMG[src], ...crop, 0, 0, width, height);
    else ctx.drawImage(im, 0, 0, width, height);
    shadowPixels(c.tex, ctx.getImageData(0, 0, width, height).data.buffer, width, height);
    c.src = c.key = key;
  }
  return c;
}
// lay a silhouette on the ground: feet at base, sprite width along the camera's right, sprite height sheared along the shadow direction
const SHD = { dir: new T.Vector3(.8, 0, -.6), len: .78 };
const SHA = .8; // ground silhouette strength
function shadowDir() { const cam = D.camera, R = new T.Vector3(1, 0, 0).applyQuaternion(cam.quaternion); R.y = 0; R.normalize(); const Bk = new T.Vector3(0, 0, -1).applyQuaternion(cam.quaternion); Bk.y = 0; Bk.normalize();
  const L = cur && cur.moon ? cur.moon.position.clone().sub(cur.moon.target.position).normalize() : (D.moon ? D.moon.position.clone().normalize() : new T.Vector3(.35, 1, .3));
  const away = new T.Vector3(-L.x, 0, -L.z); const sx = away.lengthSq() > 1e-4 ? Math.sign(away.dot(R)) || 1 : 1;
  // always mostly sideways and a little into the set, so the shadow reads on the ground instead of hiding behind the 2D sprite
  SHD.dir.copy(R).multiplyScalar(.82 * sx).addScaledVector(Bk, .57).normalize(); const el = Math.asin(Math.min(1, Math.max(.05, L.y))); SHD.len = Math.min(.95, Math.max(.55, .35 / Math.tan(el) + .3)); SHD.R = R; }
function layShadow(c, base, hw, ww, mir, lift, vis) {
  const m = c.m; m.visible = vis; if (!vis) return; const R = SHD.R || new T.Vector3(1, 0, 0);
  const X = R.clone().multiplyScalar(ww * (mir ? -1 : 1)), Y = SHD.dir.clone().multiplyScalar(hw * SHD.len), Z = new T.Vector3(0, 1, 0);
  const at = base.clone().addScaledVector(SHD.dir, lift * SHD.len).add(new T.Vector3(0, .015, 0)); const o = at;
  m.matrix.makeBasis(X, Y, Z); m.matrix.setPosition(o); m.matrixWorldNeedsUpdate = true; m.position.copy(base);
  m.material.opacity = SHA * Math.max(.3, 1 - lift / Math.max(1e-3, hw) * 1.6); }
function placeExtraCasters(X) {
  const cam = D.camera, seen = new Set();
  for (const fd of X) {
    const c = caster(fd.key, fd); seen.add(fd.key);
    const base = groundAt(fd.x, fd.y, P.c[1] + (fd.f && +fd.f.closest('.gpk,.smn')?.dataset.y3 || 0)); if (!base) { c.m.visible = false; continue; }
    const dist = cam.position.distanceTo(base), k = 2 * dist * Math.tan(cam.fov * Math.PI / 360) / innerHeight;
    layShadow(c, base, fd.h * k, fd.w * k, fd.mir, 0, fd.op > .15 && !!c.rect && !!c.key);
  }
  for (const k in casters) if (k !== 'p' && k !== 'e' && !seen.has(k)) { casters[k].m.visible = false; if (!document.querySelector(`[data-l3="${k}"]`)) { D.scene.remove(casters[k].m); casters[k].tex.dispose(); delete casters[k]; } }
}
// ── the set's own shadows falling ON the fighters: rays from the fighter's feet, waist and head toward the set's main light;
//    whatever solid scenery is in the way (bamboo walls, stalls, buildings) shades the 2D sprite, eased so it never pops ──
const RAY = new T.Raycaster(), ENVS = { p: 0, e: 0, t: 0 };
function envShade(F, t) {
  if (t - ENVS.t < .12) return; ENVS.t = t; const L = cur && cur.moon ? cur.moon.position.clone().sub(cur.moon.target.position).normalize() : null;
  for (const side of ['p', 'e']) { const fd = F[side], c = casters[side]; if (!fd || !c || !c.m.visible || !L) { if (fd) fd.f.style.removeProperty('--envshd'); continue; }
    const base = c.m.position, hw = c.hw || 1.7; let hit = 0;
    for (const k of [.25, .6, .92]) { RAY.set(base.clone().add(new T.Vector3(0, hw * k, 0)), L); RAY.near = .3; RAY.far = 45; RAY.camera = D.camera;
      const h = RAY.intersectObjects(D.scene.children, true).find(i => { const o = i.object, m = o.material; if (!o.visible || o.isPoints || o.isSprite || o.isLine || o.matrixAutoUpdate === false) return false; const g = o.geometry; if (g) { if (!g.boundingSphere) g.computeBoundingSphere(); const sc = o.getWorldScale(new T.Vector3()); if (g.boundingSphere.radius * Math.max(sc.x, sc.y, sc.z) > 40) return false; }   /* the sky wall, ground and far painting never shade anyone */ if (m && (m.colorWrite === false || (m.transparent && !m.depthWrite) || m.blending === T.AdditiveBlending)) return false; return true; });
      if (h) hit++; }
    ENVS[side] += (hit / 3 - ENVS[side]) * .35; fd.f.style.setProperty('--envshd', ENVS[side].toFixed(3)); } }
function placeCasters(F) {
  const [cx, cy, cz] = P.c, cam = D.camera; shadowDir();
  for (const side of ['p', 'e']) {
    const fd = F[side], c = fd && caster(side, fd); if (!c) { if (casters[side]) casters[side].m.visible = false; continue; }
    const r = c.rect, hidden = !r || !c.key || +getComputedStyle(fd.f).opacity < .1;
    // world point under the feet: the clearing mark for that side, nudged to follow lunges/knockback on screen
    const base = new T.Vector3(cx + (side === 'p' ? -gapNow() : gapNow()), cy, cz);
    if (hidden) { c.m.visible = false; continue; }
    const sp = base.clone().project(cam), [nx] = ndc(r.left + r.width / 2, fd.y), dist = cam.position.distanceTo(base);
    const wPerNdc = dist * Math.tan(cam.fov * Math.PI / 360) * cam.aspect; base.x += (nx - sp.x) * wPerNdc;
    const k = 2 * dist * Math.tan(cam.fov * Math.PI / 360) / innerHeight, lift = Math.max(0, fd.y - r.bottom) * k;
    c.hw = r.height * k; layShadow(c, base, r.height * k, r.width * k, side === 'e', lift, true);
  }
}

// ── the set's light on the sprites: cool moonlight, warm lantern glow from the lantern side, dappled bamboo shade ──
const CSS = `/* 3D sets with cast shadows: the flat drop-shadow behind each sprite goes; the silhouette on the ground replaces it */
#app.hd3d.hd3dsh .scr.battle .fighter .spr img,#app.hd3d.hd3dsh .scr.battle .fighter.paper .spr img,#app.hd3d.hd3dsh .scr.battle .spr .pose{filter:none}
#app.hd3d.hd3dsh.paperon .scr.battle .fighter .spr img:not([src*="/pp_"]),#app.hd3d.hd3dsh.paperon .scr.battle .spr .pose{filter:drop-shadow(calc(var(--ppw)*.414) 0 0 #f7f2e6) drop-shadow(calc(var(--ppw)*-.414) 0 0 #f7f2e6) drop-shadow(0 calc(var(--ppw)*.414) 0 #f7f2e6) drop-shadow(0 calc(var(--ppw)*-.414) 0 #f7f2e6) drop-shadow(calc(var(--ppw)*.293) calc(var(--ppw)*.293) 0 #f7f2e6) drop-shadow(calc(var(--ppw)*-.293) calc(var(--ppw)*.293) 0 #f7f2e6) drop-shadow(calc(var(--ppw)*.293) calc(var(--ppw)*-.293) 0 #f7f2e6) drop-shadow(calc(var(--ppw)*-.293) calc(var(--ppw)*-.293) 0 #f7f2e6) drop-shadow(calc(var(--ppw)*.12) 0 0 #6e645a)}
#app.hd3d.hd3dsh .scr.battle .fighter .shadow{opacity:0}
#app.hd3d.hd3dsh .scr.battle .fighter.awk .spr img{filter:drop-shadow(0 0 .06rem var(--a2)) drop-shadow(0 0 .22rem var(--a1))}
#app.hd3d.hd3dsh.paperon .scr.battle .fighter.awk .spr img:not([src*="/pp_"]){filter:drop-shadow(calc(var(--ppw)*.414) 0 0 #f7f2e6) drop-shadow(calc(var(--ppw)*-.414) 0 0 #f7f2e6) drop-shadow(0 calc(var(--ppw)*.414) 0 #f7f2e6) drop-shadow(0 calc(var(--ppw)*-.414) 0 #f7f2e6) drop-shadow(calc(var(--ppw)*.293) calc(var(--ppw)*.293) 0 #f7f2e6) drop-shadow(calc(var(--ppw)*-.293) calc(var(--ppw)*.293) 0 #f7f2e6) drop-shadow(calc(var(--ppw)*.293) calc(var(--ppw)*-.293) 0 #f7f2e6) drop-shadow(calc(var(--ppw)*-.293) calc(var(--ppw)*-.293) 0 #f7f2e6) drop-shadow(0 0 .06rem var(--a2)) drop-shadow(0 0 .22rem var(--a1))}
#app.hd3d .fighter .aura{opacity:0!important}
#app.hd3d .scr.battle .fighter,#app.hd3d .scr.battle .gpk,#app.hd3d .scr.battle .smn{scale:var(--fz3d,1)}
#app.hd3d .scr.battle .fighter.p{left:calc(50% - var(--fxo,25%) * var(--fz3d,1))}
#app.hd3d .scr.battle .fighter.e{left:calc(50% + var(--fxo,25%) * var(--fz3d,1))}
.portrait .scr.battle,.portrait.scr.battle{--fxo:23%}
#app.hd3d .gpk .gim{scale:var(--d3s,1);transform-origin:50% 100%}
#app.hd3d .scr.battle .fighter{z-index:30}
#app.hd3d .scr.battle .fighter .spr .flip,#app.hd3d .scr.battle .fighter>canvas{filter:url(#ls3dlit) brightness(calc(1 - var(--envshd,0) * .42)) saturate(calc(1 - var(--envshd,0) * .15))}
#app.hd3d .smn .smi{scale:var(--d3s,1);transform-origin:50% 100%}
.lit3d{position:absolute;pointer-events:none;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-size:100% 100%;mask-size:100% 100%;z-index:2;transition:opacity .4s}
.lit3d.shade{mix-blend-mode:multiply;background:
  radial-gradient(ellipse 34% 22% at var(--d1x,30%) var(--d1y,35%),var(--l3d,rgba(40,52,110,.55)),transparent 70%),
  radial-gradient(ellipse 26% 18% at var(--d2x,70%) var(--d2y,62%),var(--l3d,rgba(40,52,110,.5)),transparent 70%),
  linear-gradient(180deg,var(--l3a,rgba(150,165,230,.9)) 0%,var(--l3b,rgba(205,212,245,.95)) 45%,var(--l3c,rgba(120,128,190,.95)) 100%)}
.lit3d.live.tint{mix-blend-mode:multiply;background:linear-gradient(180deg,rgba(255,255,255,0) 0%,var(--lvamb) 100%)}\n.lit3d.live.rim{mix-blend-mode:screen;background:linear-gradient(var(--lvrd,90deg),var(--lvrc,transparent) 0%,transparent 38%),radial-gradient(ellipse 80% 40% at 50% 0%,rgba(255,240,210,var(--lvtop,0)),transparent 70%),linear-gradient(var(--lvrd,90deg),transparent 62%,var(--lvaw,transparent) 100%),linear-gradient(0deg,var(--lvtc,transparent) 0%,var(--lvtc,transparent) 100%)}\n.lit3d.warm{mix-blend-mode:screen;background:radial-gradient(ellipse 90% 70% at var(--wx,50%) 18%,var(--l3w,rgba(255,150,70,.32)),transparent 70%),linear-gradient(90deg,var(--rim,rgba(255,170,90,.0)) 0%,transparent 30%)}`;
// write only the style properties that changed: rewriting a whole cssText (mask-image included) every frame made the browser
// rebuild each sprite's mask layer on every tick, which is what stuttered play and the counter swing in/out
function put(el, o) { const c = el._p || (el._p = {}); for (const k in o) { const v = o[k]; if (c[k] !== v) { c[k] = v; el.style.setProperty(k, v); } } }
function lit(side, fd) {
  let L = lits[side];
  if (L && L.img && L.img !== fd.img) { L.a.remove(); L.b.remove(); L = null; delete lits[side]; }
  if (!L) { const a = document.createElement('div'), b = document.createElement('div'); a.className = 'lit3d shade'; b.className = 'lit3d warm'; L = lits[side] = { a, b, src: '', mk: '', img: fd.img }; }
  const host = fd.img.parentElement; if (L.a.parentElement !== host) { host.appendChild(L.a); host.appendChild(L.b); }
  if (L.a.style.display) { L.a.style.display = ''; L.b.style.display = ''; }
  L.src = fd.img.currentSrc;
  if (L.mk !== L.src) { L.mk = L.src; const m = `url("${L.src}")`; for (const e of [L.a, L.b]) { e.style.webkitMaskImage = m; e.style.maskImage = m; } }
  // follow the sprite exactly: same box, same live transform (idle breathing, lunges, flinches) and opacity, or a faint ghost shows beside it
  const im = fd.img, cs = getComputedStyle(im), has = cs.transform && cs.transform !== 'none';
  const box = { left: im.offsetLeft + 'px', top: im.offsetTop + 'px', width: im.offsetWidth + 'px', height: im.offsetHeight + 'px', transform: has ? cs.transform : 'none', 'transform-origin': has ? cs.transformOrigin : '50% 50%' };
  const hid = cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .05 ? 0 : +cs.opacity;
  return { L, box, hid };
}
function lightSprites(F, t) {
  for (const side of ['p', 'e']) {
    const fd = F[side]; if (!fd) continue; const { L, box, hid } = lit(side, fd); L.a.className = 'lit3d shade'; L.b.className = 'lit3d warm';
    // shade blotches drift slowly like leaves moving over a lamp; the lantern is behind the middle, so its glow sits on the inner side
    const d1x = 30 + Math.sin(t * .23 + (side === 'e' ? 2 : 0)) * 14, d1y = 34 + Math.sin(t * .17) * 8, d2x = 66 + Math.sin(t * .19 + 1) * 12, d2y = 60 + Math.cos(t * .21) * 8;
    const flick = .85 + .1 * Math.sin(t * 7.1) + .05 * Math.sin(t * 13.3);
    put(L.a, Object.assign({ opacity: hid ? hid.toFixed(3) : '0', '--d1x': d1x.toFixed(1) + '%', '--d1y': d1y.toFixed(1) + '%', '--d2x': d2x.toFixed(1) + '%', '--d2y': d2y.toFixed(1) + '%' }, box));
    put(L.b, Object.assign({ opacity: hid ? (flick * hid).toFixed(3) : '0', '--wx': '78%' }, box));   // .flip mirrors the enemy, so 78% is the inner side for both
  }
}
// live sprite light (non-paper): the set's own lights fall on the fighters. Every point light near a fighter's mark (lanterns,
// lamps, impact flashes) tints them and rims the side it shines from; the hemisphere/ambient colour settles in their shade;
// an awakened fighter's aura adds its own rim. Rebuilt from the real scene lights each frame, so flicker and flashes carry over.
const LV = { lights: [], t: -9, k: { tint: .5, rim: 1, amb: .55 } };
function liveLights(t) { if (t - LV.t < 1) return LV.lights; LV.t = t; const out = [], amb = { c: new T.Color(0, 0, 0) };
  D.scene.traverse(o => { if (!o.visible) return; if (o.isPointLight || o.isSpotLight) out.push(o); else if (o.isHemisphereLight) amb.c.add(o.color.clone().multiplyScalar(o.intensity * .5).add(o.groundColor.clone().multiplyScalar(o.intensity * .5))); else if (o.isAmbientLight) amb.c.add(o.color.clone().multiplyScalar(o.intensity)); });
  LV.lights = out; LV.amb = amb.c; return out; }
function lightLive(F, t) {
  const Ls = liveLights(t), [cx, cy, cz] = P.c, cam = D.camera, right = new T.Vector3(1, 0, 0).applyQuaternion(cam.quaternion), K = Object.assign({}, LV.k, window.__ls3dLK || {});
  const amb = (LV.amb || new T.Color(.5, .5, .6)).clone(); const am = Math.max(amb.r, amb.g, amb.b) || 1; amb.multiplyScalar(1 / am);   // the mood colour, not its strength
  for (const side of ['p', 'e']) {
    const fd = F[side]; if (!fd) continue; const { L, box, hid } = lit(side, fd);
    L.a.className = 'lit3d live tint'; L.b.className = 'lit3d live rim';
    const nowT = performance.now(); if (L.cv && nowT - L.cvT < 60) { const fl = .92 + .05 * Math.sin(t * 7.1 + (side === 'e' ? 1 : 0)) + .03 * Math.sin(t * 13.3); put(L.a, Object.assign({ opacity: hid ? hid.toFixed(3) : '0' }, L.cv.a, box)); put(L.b, Object.assign({ opacity: hid ? (fl * hid).toFixed(3) : '0' }, L.cv.b, box)); continue; }   // the light colours change slowly: recompute ~16x a second, follow the sprite every frame
    const g = gapNow(), m = new T.Vector3(cx + (side === 'e' ? g : -g), cy + 1.1, cz);
    let sum = new T.Color(0, 0, 0), sl = 0, sr = 0, top = 0, tot = 0;
    for (const l of Ls) { if (!(l.intensity > 0)) continue; const wp = l.getWorldPosition(new T.Vector3()); if (Math.hypot(wp.x - m.x, wp.z - m.z) < 1.6) continue;   // a fighter's own aura/boss light shouldn't paint them
      const d = Math.max(1.2, wp.distanceTo(m));
      const fall = l.distance > 0 ? Math.pow(Math.max(0, 1 - Math.pow(d / l.distance, 4)), 2) : 1, w = l.intensity * fall / Math.pow(d, l.decay || 2);
      if (w <= 1e-4) continue; sum.add(l.color.clone().multiplyScalar(w)); tot += w; const sx = wp.clone().sub(m).dot(right); if (sx < 0) sl += w; else sr += w; if (wp.y - m.y > 1.2) top += w; }
    (LV.dbg = LV.dbg || {})[side] = { tot: +tot.toFixed(3), sl: +sl.toFixed(3), sr: +sr.toFixed(3), n: Ls.length };
    const fe = fd.f; let aw = null; if (fe.classList.contains('awk')) { aw = getComputedStyle(fe).getPropertyValue('--a1').trim() || null; }
    const n = Math.min(.85, 1 - Math.exp(-tot * .7)) * K.rim, hue = tot > 0 ? sum.multiplyScalar(1 / Math.max(sum.r, sum.g, sum.b, 1e-4)) : new T.Color(1, .8, .6);
    // the enemy's sprite box is mirrored (.flip), so its inner/outer sides swap
    let fromLeft = sl >= sr; if (side === 'e') fromLeft = !fromLeft;
    const rc = `rgba(${hue.r * 255 | 0},${hue.g * 255 | 0},${hue.b * 255 | 0},${(.08 + .5 * n).toFixed(3)})`, tc = `rgba(${hue.r * 255 | 0},${hue.g * 255 | 0},${hue.b * 255 | 0},${(.04 + .16 * n * K.tint).toFixed(3)})`;
    const ac = `rgba(${amb.r * 255 | 0},${amb.g * 255 | 0},${amb.b * 255 | 0},${(K.amb * .45).toFixed(3)})`;
    const flick = .92 + .05 * Math.sin(t * 7.1 + (side === 'e' ? 1 : 0)) + .03 * Math.sin(t * 13.3);
    L.cv = { a: { '--lvamb': ac }, b: { '--lvtc': tc, '--lvrc': rc, '--lvrd': fromLeft ? '90deg' : '270deg', '--lvtop': Math.min(.35, top / Math.max(tot, 1e-4) * .35 * n).toFixed(3), '--lvaw': aw || 'transparent' } }; L.cvT = nowT;
    put(L.a, Object.assign({ opacity: hid ? hid.toFixed(3) : '0' }, L.cv.a, box));
    put(L.b, Object.assign({ opacity: hid ? (flick * hid).toFixed(3) : '0' }, L.cv.b, box));
  }
}
function lightExtras(X, t) {
  const seen = new Set();
  for (const fd of X) {
    seen.add(fd.key); const { L, box } = lit(fd.key, fd);
    const o = fd.op < .05 ? 0 : fd.op, d1x = 32 + Math.sin(t * .2 + fd.x * .01) * 14, d1y = 36 + Math.sin(t * .15 + 1) * 8;
    // backup foes are already dimmed by the game (brightness .62), so their shade is lighter to keep them readable
    put(L.a, Object.assign({ opacity: (o * (fd.dim ? .7 : 1)).toFixed(3), '--d1x': d1x.toFixed(1) + '%', '--d1y': d1y.toFixed(1) + '%', '--d2x': '68%', '--d2y': '62%' }, box));
    put(L.b, Object.assign({ '--wx': '78%', opacity: (o * (.85 + .1 * Math.sin(t * 7.1 + fd.x))).toFixed(3) }, box));
  }
  for (const k in lits) if (k !== 'p' && k !== 'e' && !seen.has(k)) { lits[k].a.remove(); lits[k].b.remove(); delete lits[k]; }
}
// ── group fights on the set: backup foes and summons stand on the stage's own marks, sized by their real depth ──
let fz = 1;
function zoomFor(F, X) {
  // group fights pull back a little so the whole crew fits; tall enemies pull back until their head clears the HUD band
  const n = X.filter(x => x.dim).length, gz = n >= 2 ? .72 : n === 1 ? .82 : 1;
  // both sides: Kaiko's KAIJU MODE towers on the player's side, giants on the rival's
  let tz = 1; for (const sd of ['p', 'e']) { const f = F[sd]; if (f && f.h > 4) { const raw = f.h / fz, room = innerHeight * (innerWidth < innerHeight ? .5 : .6); if (raw > room) tz = Math.min(tz, Math.max(.45, room / raw)); } }
  // heads must stay clear of the status chips / next-move bar under each HP bar: measure the real sprite against the real HUD and pull back to fit
  const appE = document.getElementById('app'), stg = document.getElementById('stage');
  const nowZ = performance.now();
  // measure only when something that affects framing changed (screen size, who is on the field, status rows), a few passes to settle, then hold: re-measuring a camera that just moved is a feedback loop that never stops adjusting
  const zsig = innerWidth + 'x' + innerHeight + '|' + ['p', 'e'].map(sd => (F[sd] ? (F[sd].h || 0) + ':' + (F[sd].id || F[sd].key || F[sd].name || F[sd].nm || '') : '')).join('|') + '|' + document.querySelectorAll('.scr.battle .fighter').length + '|' + document.querySelectorAll('.scr.battle .hp .sts .st').length;
  if (zoomFor.sig !== zsig) { zoomFor.sig = zsig; zoomFor.cnt = 0; }
  if ((zoomFor.cnt | 0) < 4 && nowZ - (zoomFor.t || 0) > 400 && appE && !appE.classList.contains('cine') && !appE.classList.contains('airtime') && !(stg && /ots/.test(stg.className))) {
    let hzN = 1;
    // a sprite mid-flourish (lunge, launch, tumble, KO spin) is not standing: measuring it would pull the camera far out and shrink everyone
    const moving = [...document.querySelectorAll('.scr.battle .fighter .spr,.scr.battle .fighter')].some(e => e.getAnimations().some(q => !(typeof CSSAnimation !== 'undefined' && q instanceof CSSAnimation)));
    if (moving) { zoomFor.t = nowZ - 160; } else
    for (const sd of ['p', 'e']) {
      const img = document.querySelector('.scr.battle .fighter.' + sd + ' .spr img'); if (!img) continue; const r = img.getBoundingClientRect(); if (r.height < 40) continue;
      let hb = 0; document.querySelectorAll('.scr.battle .hp.' + sd + ' .bar,.scr.battle .hp.' + sd + ' .sts,.scr.battle .intent.dock').forEach(el => { if (sd === 'p' && el.classList.contains('intent')) return; const b = el.getBoundingClientRect(); if (b.width && b.height) hb = Math.max(hb, b.bottom); });
      if (!hb) continue; hb += innerHeight * .02; const need = fz * (r.bottom - hb) / r.height; if (need < 1) hzN = Math.min(hzN, Math.max(.8, need));
    }
    if (!moving) { if (hzN < (zoomFor.hz || 1) && Math.abs(hzN - (zoomFor.hc || 9)) > .03) { zoomFor.hc = hzN; } else { zoomFor.hz = hzN; zoomFor.hc = 9; } zoomFor.t = nowZ; zoomFor.cnt = (zoomFor.cnt | 0) + 1; }
  }
  tz = Math.min(tz, zoomFor.hz || 1);
  const want = Math.min(gz, tz); fz += (want - fz) * .08; if (Math.abs(want - fz) < .002) fz = want;
  document.getElementById('app').style.setProperty('--fz3d', fz.toFixed(3));
}
function groupPlace(F) {
  const fld = document.querySelector('.scr.battle .field'); if (!fld || !P.slots) return;
  const fr = fld.getBoundingClientRect(), k = fld.offsetWidth ? fr.width / fld.offsetWidth : 1, cam = D.camera, gy = P.c[1];
  const ref = (side) => cam.position.distanceTo(new T.Vector3(P.c[0] + (side === 'e' ? gapNow() : -gapNow()), gy, P.c[2]));
  const put = (el, x, z, side, base, y) => {
    const w = new T.Vector3(x, y == null ? gy : gy + y, z), s = w.clone().project(cam); el.dataset.y3 = y == null ? 0 : y;
    el.style.left = (((s.x + 1) / 2 * innerWidth - fr.left) / k) + 'px'; el.style.top = (((1 - s.y) / 2 * innerHeight - fr.top) / k) + 'px';
    const dep = ref(side) / cam.position.distanceTo(w); el.style.setProperty('--d3s', (dep / base).toFixed(3)); return dep;
  };
  const gp = [...document.querySelectorAll('.scr.battle .gpack .gpk')];
  const at = (sl) => P.rel ? [P.c[0] + gapNow() * sl[0], P.c[2] + sl[1]] : szOf() !== 1 ? [P.c[0] + (sl[0] - P.c[0]) * szOf(), P.c[2] + (sl[1] - P.c[2]) * szOf()] : sl;   // a tighter set (sz) draws its crew in toward the fighters too
  // the crew is laid out around the main enemy as seen on screen (behind-right, behind-left, further back), then dropped onto
  // the set's ground there, so it always frames its boss and takes the depth and size of the spot it lands on, on any stage and screen
  const E = F && F.e, LAY = [[.62, .2], [-.66, .28], [.12, .38]];
  gp.forEach(c => { const i = +c.dataset.k || 0, base = +(c.dataset.dep || .62);
    let w = null;
    if (E) { const L = LAY[i % LAY.length], mid = F.p ? (F.p.x + E.x) / 2 + innerWidth * .04 : innerWidth * .5, sx = Math.min(innerWidth * .965, Math.max(mid, E.x + L[0] * E.w)), sy = E.y - L[1] * E.h; w = groundAt(sx, sy, gy); }   // never on the player's side of the clearing
    if (!w) { const sl = P.slots[i % P.slots.length], [sx0, sz0] = at(sl); w = new T.Vector3(sx0, gy, sz0); }
    const dep = put(c, w.x, w.z, 'e', base, w.y - gy); c.style.zIndex = Math.max(1, Math.round(dep * 20)); c.dataset.p3 = '1'; });
  document.querySelectorAll('.scr.battle .smn').forEach(el => { const side = el.classList.contains('e') ? 'e' : 'p', [sx, sz] = at(P.sum);
    put(el, side === 'e' ? 2 * P.c[0] - sx : sx, sz, side, 1); el.dataset.p3 = '1'; });
}
function clearLights() { for (const k in lits) { lits[k].a.remove(); lits[k].b.remove(); } }

function ensure() {
  if (D) return built;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  cv = document.createElement('canvas'); cv.className = 'ls3d';
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .8s;pointer-events:none';
  const lowEnd = matchMedia('(pointer:coarse)').matches;
  D = new Diorama(cv, { quality: lowEnd ? 'low' : 'high', fogNear: 14, fogFar: 60, fogColor: 0x0c1430 });
  D.camera.fov = 30; D.faceCam = 1; D.paused = true; D.scene0 = D.scene;
  D.post.uniforms.band.value = .32; D.post.uniforms.amt.value = .6;
  // full-screen cinematics (supers, ultimates, criticals, awakenings) cover the stage: stop drawing it so they get the GPU to themselves
  // counter: once the over-the-shoulder camera has swung in and settled, the view holds still while the player answers,
  // so the set stops redrawing (a full 3D + comic-shading frame every tick was what dropped counters to ~11 fps); it resumes the moment the counter ends or the camera moves
  const otsHeld = () => { const hold = OTS.on && OTS.F0 && OTS.k >= 1 && OTS.w === (OTS.mode === 'wide' ? 1 : 0) && shake <= 0 && hitK <= 0; if (!hold) { OTS.hs = 0; return false; } const n = performance.now(); if (!OTS.hs) OTS.hs = n; return n - OTS.hs > 120; };
  D.skip = () => { const a = document.getElementById('app'); return !!(a && a.classList.contains('cine')) || !!document.querySelector('.lsq-wrap,.lsq,.ultc') || otsHeld(); };
  built = Promise.resolve();
  let lastF = {};
  D.frame((dt, t) => {
    fieldTick(t, dt);
    // a painted set is framed like its 2D painting: wide screens zoom the lens (never dolly in, which would bare the painting's edges)
    { const tq = Math.tan(Math.PI / 12) * (P.cover ? Math.min(1, P.cover / D.camera.aspect) : 1), fv = Math.atan(tq) * 360 / Math.PI; if (Math.abs(D.camera.fov - fv) > 1e-3) { D.camera.fov = fv; D.camera.updateProjectionMatrix(); } }
    const [cx, cy, cz] = P.c;
    window.__ls3dSet = !P.painted;
    { const U = D.post.uniforms, S_ = Object.assign({}, STY, window.__ls3dSty || {}), on = !P.painted && window.__ls3dSty !== false; U.ink.value = on ? S_.ink : 0; U.inkW.value = S_.inkW; U.cel.value = on ? S_.cel : 0; U.sat.value = on ? S_.sat : 0; U.amt.value = on ? S_.amt : .6; }
    const F = fighters(); const live = OTS.on && !P.painted;
    if (live && !OTS.F0 && OTS.k === 0 && F.p && F.e) { OTS.F0 = F; OTS.R0 = {}; for (const sd of ['p', 'e']) { const el = F[sd].f, r = el.getBoundingClientRect(); OTS.R0[sd] = { left: r.left, top: r.top, k: el.offsetWidth ? r.width / el.offsetWidth : 1 }; } }
    if (OTS.F0) lastF = OTS.F0; else if (F.p || F.e) lastF = F;
    // re-aim every frame, eased: the stage's talk/counter camera swings the fighters around and the set has to glide with them (a 4 Hz step here read as choppy)
    { const nf = solveFit(lastF), a = fit ? 1 - Math.exp(-Math.min(dt, .1) * 14) : 1; fit = fit ? { C: fit.C.lerp(nf.C, a), f: nf.f, M: nf.M, depth: fit.depth + (nf.depth - fit.depth) * a } : nf; }
    hitK = Math.max(0, hitK - dt * 2.6); shake = Math.max(0, shake - dt * .45);
    const am = P.painted ? .4 : 1; let ang = 0, push = 0;   // idle camera holds perfectly still (the slow orbit made the whole set creep when nothing was happening)
    if (supT >= 0) { supT += dt; const u = Math.min(1, supT / 1.8); ang = (-.1 + ease(u) * .2) * am; push = Math.sin(u * Math.PI) * .06; if (supT > 2.2) supT = -1; }
    const k = ease(Math.min(1, hitK)); push += k * .03;
    // drift, sweep and push-in all pivot on the clearing's centre, so the fighters stay planted on their marks
    const rel = fit.C.clone().sub(fit.M).applyAxisAngle(new T.Vector3(0, 1, 0), ang).multiplyScalar(1 - push);
    const dir = fit.f.clone().applyAxisAngle(new T.Vector3(0, 1, 0), ang);
    const sx = (Math.random() - .5) * shake, sy = (Math.random() - .5) * shake;
    D.camera.position.copy(fit.M).add(rel).add(new T.Vector3(sx + hitSide * .12 * k, sy, 0));
    D.camera.lookAt(D.camera.position.clone().add(dir)); D.camera.clearViewOffset();
    { const dk = dt / (window.__tScale || 1); OTS.k = Math.max(0, Math.min(1, OTS.k + (live && OTS.F0 ? dk / .42 : -dk / .45))); OTS.w = Math.max(0, Math.min(1, OTS.w + (OTS.mode === 'wide' ? dk / .5 : -dk / .5))); }
    D.camera.updateProjectionMatrix(); D.camera.updateMatrixWorld();
    if (OTS.k > 0 && OTS.F0) { const V0 = markView(D.camera); otsCam(ease(OTS.k)); rideMarks(V0, markView(D.camera)); }
    else releaseMarks();
    D.camera.updateProjectionMatrix(); D.camera.updateMatrixWorld();
    // while the counter camera is swinging in or out, draw a light frame (no AO, bloom or shadow refresh): the move is brief and the full-quality frame lands as it settles
    D.lite = !!(live ? OTS.k < 1 || OTS.w !== (OTS.mode === 'wide' ? 1 : 0) : OTS.k > 0);
    // the whole counter (window opening, the camera push, the strike, the pull-back and a beat after) skips the ambient-occlusion pass and shadow re-bakes: the biggest per-frame GPU costs, and invisible under the counter's own lighting
    { const nowT = performance.now(); if (OTS.on || OTS.k > 0 || live) OTS.tAfter = nowT + 900; D.noAO = nowT < (OTS.tAfter || 0); }
    D.focus = { x: cx, z: cz }; D.followShadow(new T.Vector3(cx, cy, cz));
    if (OTS.k > 0) { for (const sd in casters) casters[sd].m.visible = false; } else { placeCasters(lastF); envShade(lastF, t); }
    litTick(t);
    groupPlace(lastF); const X = extras(); zoomFor(lastF, X); placeExtraCasters(X); lightExtras(X, t);
    // paper sprites: the set's light also falls over the paper cut-outs (dappled shade + warm lantern rim, masked to whatever image the fighter shows: idle, counter pose, kneel, awakened)
    if (window.__lsLiteOn) { for (const sd of ['p', 'e']) if (lits[sd]) { lits[sd].a.remove(); lits[sd].b.remove(); delete lits[sd]; } } else if (document.getElementById('app').classList.contains('paperon') && OTS.k <= 0) lightSprites(lastF, t); else if (OTS.k <= 0 && !P.painted && window.__ls3dLive !== false) lightLive(lastF, t); else for (const sd of ['p', 'e']) if (lits[sd]) { if (OTS.k > 0 && !P.painted) { lits[sd].a.style.display = 'none'; lits[sd].b.style.display = 'none'; } else { lits[sd].a.remove(); lits[sd].b.remove(); delete lits[sd]; } }
  });
  return built;
}
const WEATHER = [['clear', .45], ['rain', .22], ['fog', .18], ['snow', .15]];
function pickWeather() { const w = window.__ls3dWeather; if (w) return w; let r = Math.random(); for (const [k, p] of WEATHER) { if ((r -= p) < 0) return k; } return 'clear'; }
// a set's light on the sprites: the bamboo road's cool moon and dappled shade, or the painted location's own palette
function spriteLight(cx) {
  const a = document.getElementById('app'), V = ['--l3a', '--l3b', '--l3c', '--l3d', '--l3w'];
  if (!cx.painted) { V.forEach(v => a.style.removeProperty(v)); return; }
  const [wr, wg, wb] = cx.P.warm, [fr, fg, fb] = cx.P.fog, mix = (x, y, k) => Math.round(x + (y - x) * k);
  const top = `rgba(${mix(255, wr, .3)},${mix(255, wg, .3)},${mix(255, wb, .3)},.92)`, mid = 'rgba(250,246,240,.97)', bot = `rgba(${mix(255, fr * 1.7, .45)},${mix(255, fg * 1.7, .45)},${mix(255, fb * 1.7, .45)},.94)`;
  a.style.setProperty('--l3a', top); a.style.setProperty('--l3b', mid); a.style.setProperty('--l3c', bot); a.style.setProperty('--l3d', 'transparent');
  a.style.setProperty('--l3w', `rgba(${wr},${wg},${wb},${cx.P.indoor ? .3 : .24})`);
}
// the set's light on the fighters is a colour filter (SVG colour matrix) on their whole sprite layer, so it holds for every sprite,
// pose, attack frame, awakened form and attack canvas, not just the idle image: a cool or palette shade, plus warm light from the lamps
let litM = null, litK = { s: [.8, .83, .96], w: [1, .59, .27], wk: .32 };
function litSvg() {
  if (litM) return; const ns = 'http://www.w3.org/2000/svg', sv = document.createElementNS(ns, 'svg'); sv.setAttribute('width', 0); sv.setAttribute('height', 0); sv.style.cssText = 'position:absolute;width:0;height:0;pointer-events:none';
  sv.innerHTML = '<filter id="ls3dlit" color-interpolation-filters="sRGB" x="-150%" y="-150%" width="400%" height="400%"><feColorMatrix type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0"/></filter>';
  document.body.appendChild(sv); litM = sv.querySelector('feColorMatrix');
}
function litSet(cx) {
  if (!cx.painted) { litK = { s: [.8, .83, .96], w: [1, .59, .27], wk: .3 }; return; }
  const [wr, wg, wb] = cx.P.warm, [fr, fg, fb] = cx.P.fog, mix = (x, y, k) => x + (y - x) * k, c = v => Math.min(255, v) / 255;
  const top = [mix(255, wr, .3), mix(255, wg, .3), mix(255, wb, .3)], bot = [mix(255, fr * 1.7, .45), mix(255, fg * 1.7, .45), mix(255, fb * 1.7, .45)];
  litK = { s: [0, 1, 2].map(i => c((top[i] + 250 + bot[i]) / 3) * .97), w: [wr / 255, wg / 255, wb / 255], wk: cx.P.indoor ? .26 : .2 };
}
let litLast = 0;
function litTick(t) {
  if (!litM) return; const nw = performance.now(); if (nw - litLast < 140) return; litLast = nw;   /* an SVG filter re-render on both sprites: ~14 Hz is plenty for a lantern flicker */ const f = .88 + .08 * Math.sin(t * 7.1) + .04 * Math.sin(t * 13.3), k = litK.wk * f, [sr, sg, sb] = litK.s, [wr, wg, wb] = litK.w, row = (s0, w0, i) => [0, 1, 2].map(j => ((j === i ? s0 : 0) + [.3, .59, .11][j] * w0 * k).toFixed(4)).join(' ') + ' 0 0';
  { const v = `${row(sr, wr, 0)} ${row(sg, wg, 1)} ${row(sb, wb, 2)} 0 0 0 1 0`; if (v !== litM._v) { litM._v = v; litM.setAttribute('values', v); } }
}
function weatherFor(cx) {
  if (window.__ls3dWeather) return window.__ls3dWeather;
  if (!cx.painted) return pickWeather(); if (cx.P.indoor) return 'clear';
  const n = cx.P.name, W = /mountain|frost|kuzuryu/.test(n) ? [['snow', .55], ['clear', .3], ['fog', .15]] : /^nw_|rushhour|express|street|roof|web/.test(n) ? [['rain', .45], ['clear', .4], ['fog', .15]] : [['clear', .55], ['rain', .2], ['fog', .15], ['snow', .1]];
  let r = Math.random(); for (const [w, p] of W) { if ((r -= p) < 0) return w; } return 'clear';
}
function setWeather(cx, kind) {
  if (!cx.fx) return; cx.fx.weather(kind, cx.P.c);
  if (cx.painted && cx.P.surf) { cx.P.surf.rainK = kind === 'rain' ? 1 : 0; cx.P.surf.snowK = kind === 'snow' ? 1 : 0; if (kind !== 'snow') cx.P.surf.snow.value = 0; }
  if (cx.painted) { const f = D.scene.fog, base = new T.Color(`rgb(${cx.P.fog.join(',')})`); f.color.copy(base); f.near = kind === 'fog' ? 40 : 60; f.far = kind === 'fog' ? 190 : kind === 'rain' ? 260 : 400; D.scene.background.copy(base); }
}
// k: a roam fight's bamboo spot (road / shrine / bridge); bgUrl: the fight's backdrop, matched to its painted 3D set
let gen = 0;
export function start(host, k, bgUrl) {
  const g0 = gen;
  const go = async () => {
    if (g0 !== gen) return; ensure(); k = k || window.__ls3dKey; const n = nameOf(bgUrl);
    let cx;
    if (k && MODELED[k]) { cx = await modeledCtx(k); P = cx.P; key = k; }   // a roam fight in one of the connected areas: fight right there
    else if (!k && n && MODELED[BYBG[n] || n] && !window.__lsPainted) { const mk = BYBG[n] || n; cx = await modeledCtx(mk); P = cx.P; key = mk; }
    else if (!k && n && n !== 'w_bamboo' && (await setsMeta())[n]) { cx = await paintedCtx(n, bgUrl); P = cx.P; key = n; }
    else { cx = await bambooCtx(); key = PRESETS[k] ? k : Object.keys(PRESETS)[Math.random() * 3 | 0]; P = PRESETS[key]; cx.P = P; }
    if (g0 !== gen) return; fit = null;
    if (cv.parentNode !== host) host.appendChild(cv); cv.style.display = '';
    document.getElementById('app').classList.add('hd3d', 'hd3dsh'); spriteLight(cx); litSvg(); litSet(cx);
    D.restore(); D.resize(); D.paused = false;
    if (FX) { FX.clear(); FX.life(P.c, cx.painted ? P : null); setWeather(cx, weatherFor(cx)); }
    requestAnimationFrame(() => { cv.style.opacity = 1; });
  };
  return (lock = lock.then(go, go));
}
// RUSHDOWN stage transition: the rival is blasted out of the arena and the chase ends in the neighbouring set
// (the connected world's west-to-east order, plus a few natural neighbours). Boss and special arenas keep their set.
const NEXT = { w_graves: 'w_mill', w_mill: 'w_village', w_village: 'road', road: 'festival', festival: 'sakebar', sakebar: 'nw_street', nw_street: 'nw_teahouse',
  nw_teahouse: 'nw_snack', nw_snack: 'nw_roof', nw_roof: 'nw_express', nw_express: 'harbor', harbor: 'e_dojo', e_dojo: 'e_light', e_light: 'e_whale', e_whale: 'e_light',
  nw_pachinko: 'nw_casino', nw_casino: 'nw_street', nw_web: 'nw_roof', marsh: 'sunken', sunken: 'seacave', seacave: 'harbor', blight: 'mountain_pass',
  mountain_pass: 'rooftops', rooftops: 'nw_roof', ring: 'festival', fox_shrine: 'festival', w_bamboo: 'w_graves' };
// Rushdown chase: the camera tears through the set along its longest open run (a street, a path, a bridge), looking across at the
// nearer wall of stalls/trees so it streams past; fighters are composited by the cutscene on the ground line this returns.
// While a cutscene covers the screen the set's own loop is paused (D.skip), so chaseDraw() ticks the set, moves the camera and
// renders; the caller copies the canvas in the same frame.
const CH = { on: false };
function vis(m) { for (let o = m; o; o = o.parent) if (!o.visible) return false; return true; }
function freeDist(o, d, skip) {
  const rc = new T.Raycaster(o, d, .2, 70); rc.camera = D.camera; let hs = []; try { hs = rc.intersectObjects(D.scene.children, true); } catch (_) { }
  for (const h of hs) { const m = h.object; if (!m.isMesh || !vis(m) || skip.has(m) || !m.geometry || h.distance < .3) continue; const mt = Array.isArray(m.material) ? m.material[0] : m.material; if (!mt || mt.side === T.BackSide || (mt.transparent && mt.opacity < .5) || mt.colorWrite === false || mt.isShadowMaterial) continue; (CH.hits = CH.hits || []).push((m.name || m.type) + ':' + h.distance.toFixed(1)); return h.distance; }
  return 70;
}
export function chase(on, o = {}) {
  if (!on) { CH.on = false; if (CH.hid) { for (const m of CH.hid) m.visible = true; CH.hid = null; } return true; }
  if (!D || D.paused || !P || P.painted) { CH.on = false; return false; }
  const [cx, cy, cz] = P.c, cam = D.camera, skip = new Set(D.billboards || []); CH.hits = [];
  for (const sd in casters) skip.add(casters[sd].m);
  const up = new T.Vector3(0, 1, 0), c = new T.Vector3(cx, cy + 1.0, cz);
  // the run follows the set's own depth (the street/path the battle camera looks down); the camera turns side-on to it
  const ax = cam.getWorldDirection(new T.Vector3()).setY(0).normalize(), rt = new T.Vector3().crossVectors(ax, up).normalize();
  const fwd = Math.min(32, freeDist(c, ax, skip) - 4), bck = Math.min(5, Math.max(0, freeDist(c, ax.clone().negate(), skip) - 1.5));
  const x0 = -bck, x1 = Math.max(4, fwd);
  // which side has a wall to stream past: sample both sides along the run
  const L = [], R = []; for (let i = 0; i < 7; i++) { const p = c.clone().addScaledVector(ax, x0 + (x1 - x0) * i / 6); L.push(freeDist(p, rt.clone().negate(), skip)); R.push(freeDist(p, rt, skip)); }
  const med = v => v.slice().sort((a, b) => a - b)[v.length >> 1], ml = med(L), mr = med(R);
  let n = ml <= mr ? rt.clone().negate() : rt.clone(), wall = Math.min(ml, mr), back = Math.max(ml, mr);
  if (wall > 30) wall = 14;   // open both sides: frame a middle distance and let the far scenery stream
  const tanH = Math.tan(cam.fov * Math.PI / 360), hf = o.hf || .5, Df0 = 1.75 / (hf * 2 * tanH);
  let Df = Df0, a = Math.max(0, Math.min(wall - 2.2, wall * .35)); if (Df - a > back - .6) Df = Math.max(2.5, back - .6 + a);
  // u>0 must read as screen-right
  const sr = new T.Vector3().crossVectors(n, up).normalize(), sg = sr.dot(ax) >= 0 ? 1 : -1;
  CH.ax = ax.clone().multiplyScalar(sg); CH.n = n; CH.x0 = sg > 0 ? x0 : -x1; CH.x1 = sg > 0 ? x1 : -x0;
  CH.mid = new T.Vector3(cx, cy, cz).addScaledVector(n, a); CH.Df = Df; CH.camH = 1.15;
  // crowd cut-outs standing between the camera and the fighters would fill the frame: step them aside for the chase
  CH.hid = []; for (const m of D.billboards || []) { if (m.visible && m.position.clone().sub(CH.mid).dot(n) < -.4) { m.visible = false; CH.hid.push(m); } }
  CH.on = true; CH.dbg = { hits: (CH.hits || []).slice(0, 8), ml, mr, wall, back, a, Df, Df0, x0, x1, sg };
  place(0); const g = CH.mid.clone().project(cam);
  return { gy: (1 - g.y) / 2, scale: Df0 / Df, dbg: CH.dbg };
}
function place(x) { const cam = D.camera, f = CH.mid.clone().addScaledVector(CH.ax, x);
  cam.position.copy(f).addScaledVector(CH.n, -CH.Df).add(new T.Vector3(0, CH.camH, 0));
  cam.lookAt(f.clone().add(new T.Vector3(0, CH.camH * .82, 0))); cam.updateProjectionMatrix(); cam.updateMatrixWorld(); return f; }
// u: -1..1 along the run (sign follows the attacker's direction), dt: seconds for the set's own animation
export function chaseDraw(u, dt) {
  if (!CH.on || !D || D.paused) return null;
  dt = Math.min(dt || 0, .05); D.time += dt; for (const up of D.updaters) up(D.time, dt);
  const cam = D.camera, f = place(u < 0 ? -u * CH.x0 : u * CH.x1);
  D._lights(f); D.focus = { x: f.x, z: f.z }; D.followShadow(f);
  for (const sd in casters) casters[sd].m.visible = false;
  if (D.faceCam) { const c = cam.position; for (const m of D.billboards) m.rotation.y = Math.atan2(c.x - m.position.x, c.z - m.position.z) * D.faceCam; }
  if (D.backdropMesh) { const b = D.backdropMesh; b.position.x = b.userData.x0 + cam.position.x * b.userData.parallax; }
  D._render(); return cv;
}
// build the set a Rushdown would carry this fight into, while the VS / loading screen still covers the arena:
// the spare is built as its own world (its scene, lights, effects, shaders compiled), then the current set is put back
// on the VS / loading screen: build this fight's own 3D set (so the arena comes up already built) and then its Rushdown neighbour
export function prewarm(bgUrl, k) {
  const go = async () => {
    ensure(); const n = nameOf(bgUrl), mk = k && MODELED[k] ? k : (!k && n && MODELED[BYBG[n] || n] && !window.__lsPainted ? (BYBG[n] || n) : null);
    if (!mk) return null; const wasPaused = D.paused; D.paused = true;
    try { await modeledCtx(mk); P = modeled.P; key = mk; } catch (e) { console.warn('ls3d prewarm', mk, e); D.paused = wasPaused; return null; }
    D.paused = wasPaused; return mk;
  };
  return (lock = lock.then(go, go)).then(r => r ? prepare() : null);
}
export function prepare() {
  const go = async () => {
    const n = D && NEXT[key]; if (!n || !MODELED[n] || (modeled && modeled.name === n)) return null;
    if (spare && spare.name === n) { await spare.ready; return n; }
    if (spare) { disposeCtx(spare); spare = null; }
    const back = cur, wasPaused = D.paused; D.paused = true;
    const cx = spare = blank(new T.Scene()); cx.name = n; cx.painted = false; cx.modeled = true; let ok = false;
    use(cx);
    try { const mod = await MODELED[n](); await mod.build(D, /2$/.test(n) ? 2 : 1, n); deHaze(D.scene); cx.P = mod.PRESET; cx.fx = new ArenaFX(D); cx.look = look(n, cx.P); D.setFX(cx.look);
      try { D.envLight({ env: cx.look.env }); } catch (_) {} try { D.renderer.compile(cx.scene, D.camera); } catch (_) {} ok = true; }
    catch (e) { console.warn('ls3d prepare', n, e); }
    cx.ready = Promise.resolve();
    if (back) use(back); FX = back ? back.fx : FX; D.paused = wasPaused;
    if (!ok) { if (spare === cx) spare = null; disposeCtx(cx); return null; }
    return n;
  };
  return (lock = lock.then(go, go));
}
export function nextStage() { return (D && !D.paused && NEXT[key]) || null; }
export function transition(host) { const n = nextStage(); if (!n || !host) return Promise.resolve(null); return start(host, n, null).then(() => n, () => null); }
// ── FIELD EFFECTS on the 3D ground (Rime Field first): frost creeping out over the floor around both fighters, a few
//    ice crystals breaking through at the edges, light snow drifting down. Grows in, breathes softly, melts away. ──
const FLD = { k: null, g: null, a: 0, want: 0, t0: 0, parts: [] };
function frostTex() { const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const rg = g.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2); rg.addColorStop(0, 'rgba(225,245,255,.55)'); rg.addColorStop(.55, 'rgba(190,230,255,.32)'); rg.addColorStop(1, 'rgba(190,230,255,0)');
  g.fillStyle = rg; g.fillRect(0, 0, W, H);
  // ferns of frost: branching hairlines, densest near the edges of the patch
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.strokeStyle = 'rgba(245,252,255,.55)'; g.lineCap = 'round';
  const fern = (x, y, a, len, w, d) => { if (d > 4 || len < 6) return; const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len * .5; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    for (let i = 1; i <= 3; i++) { const t = i / 4, bx = x + (x2 - x) * t, by = y + (y2 - y) * t; fern(bx, by, a + (rnd() < .5 ? -1 : 1) * (.6 + rnd() * .5), len * .45, w * .7, d + 1); } fern(x2, y2, a + (rnd() - .5) * .5, len * .6, w * .8, d + 1); };
  for (let i = 0; i < 46; i++) { const a = rnd() * Math.PI * 2, r = .25 + rnd() * .55, x = W / 2 + Math.cos(a) * W / 2 * r, y = H / 2 + Math.sin(a) * H / 2 * r; fern(x, y, a + (rnd() - .5) * 1.2, 40 + rnd() * 70, 1.6, 0); }
  // soft mask so nothing ends in a hard edge
  g.globalCompositeOperation = 'destination-in'; const m = g.createRadialGradient(W / 2, H / 2, W * .08, W / 2, H / 2, W / 2); m.addColorStop(0, 'rgba(0,0,0,.75)'); m.addColorStop(.7, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = m; g.fillRect(0, 0, W, H);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; return t; }
function flakeTex() { const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.4, 'rgba(235,248,255,.7)'); r.addColorStop(1, 'rgba(235,248,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 32, 32); return new T.CanvasTexture(c); }
function buildRime() {
  const [cx, cy, cz] = P.c, gap = gapNow(), grp = new T.Group(); grp.position.set(cx, cy, cz);
  // the frost patch: a wide oval reaching past both fighters
  const fr = new T.Mesh(new T.PlaneGeometry(gap * 4.2, gap * 2.1), new T.MeshBasicMaterial({ map: frostTex(), transparent: true, depthWrite: false, opacity: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: true }));
  fr.rotation.x = -Math.PI / 2; fr.position.y = .02; fr.renderOrder = 1; grp.add(fr);
  // ice crystals: small clusters at the edges of the patch and just behind each fighter, never between them
  const ice = new T.MeshStandardMaterial({ color: 0xcdeeff, emissive: 0x2f7fc0, emissiveIntensity: .45, roughness: .12, metalness: .05, transparent: true, opacity: .82, flatShading: true });
  const crystals = []; let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const spots = [[-1.55, -.35], [-1.25, .55], [-.75, -.62], [1.6, -.3], [1.2, .6], [.8, -.6], [0, -.85], [-2, .1], [2.05, .15]];
  for (const [sx, sz] of spots) { const cl = new T.Group(); cl.position.set(sx * gap, 0, sz * gap); const n = 2 + (rnd() * 3 | 0);
    for (let i = 0; i < n; i++) { const h = gap * (.08 + rnd() * .16), m = new T.Mesh(new T.ConeGeometry(h * .16, h, 5), ice); m.position.set((rnd() - .5) * gap * .12, h * .45, (rnd() - .5) * gap * .1); m.rotation.set((rnd() - .5) * .7, rnd() * 6, (rnd() - .5) * .7); cl.add(m); }
    cl.scale.setScalar(.001); grp.add(cl); crystals.push({ cl, d: rnd() * .5 }); }
  // light snow drifting through the space around the fighters
  const N = 260, pos = new Float32Array(N * 3), vel = []; for (let i = 0; i < N; i++) { pos[i * 3] = (rnd() - .5) * gap * 5; pos[i * 3 + 1] = rnd() * gap * 2.4; pos[i * 3 + 2] = (rnd() - .5) * gap * 2.6; vel.push(.08 + rnd() * .1, rnd() * 6); }
  const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pos, 3));
  const snow = new T.Points(pg, new T.PointsMaterial({ map: flakeTex(), size: gap * .035, transparent: true, opacity: 0, depthWrite: false, color: 0xeaf6ff, fog: true }));
  grp.add(snow);
  const lt = new T.PointLight(0x8fd8ff, 0, gap * 3, 2); lt.position.set(0, gap * .35, 0); grp.add(lt);
  return { grp, fr, crystals, snow, vel, lt, gap }; }
function fieldTick(t, dt) {
  if (!FLD.k && !FLD.g) return; FLD.a += (FLD.want - FLD.a) * Math.min(1, dt * (FLD.want ? 1.6 : 2.4));
  let F = FLD.g; if (!F) return; if (F.P !== P && FLD.k === 'rime') { F.grp.removeFromParent(); F = FLD.g = buildRime(); }   // the stage changed under it (Rushdown chase): rebuild at the new clearing
  F.P = P; if (F.grp.parent !== D.scene) D.scene.add(F.grp);
  const a = FLD.a, br = 1 + .06 * Math.sin(t * 1.3);
  F.fr.material.opacity = .9 * a; F.fr.scale.setScalar(.55 + .45 * Math.min(1, a * 1.15));
  for (const c of F.crystals) { const k = Math.max(0, Math.min(1, (a - c.d * .6) / .5)); c.cl.scale.setScalar(Math.max(.001, k * k * (3 - 2 * k))); }
  F.snow.material.opacity = .75 * a; const p = F.snow.geometry.attributes.position, top = F.gap * 2.4;
  for (let i = 0; i < p.count; i++) { let y = p.getY(i) - F.vel[i * 2] * F.gap * dt * .45; if (y < 0) y += top; p.setY(i, y); p.setX(i, p.getX(i) + Math.sin(t * .8 + F.vel[i * 2 + 1]) * F.gap * dt * .02); } p.needsUpdate = true;
  F.lt.intensity = 2.2 * a * br;
  if (!FLD.want && a < .01) { F.grp.removeFromParent(); F.fr.material.map.dispose(); F.grp.traverse(o => { if (o.geometry) o.geometry.dispose(); }); FLD.g = null; FLD.k = null; } }
// kind: a field's key ('rime', ...) or null to clear. Only Rime Field is built in 3D so far; others keep the 2D overlay.
export function field(kind) {
  if (!D || D.paused) return false; const has = false && kind === 'rime';   // the 3D Rime Field look was rejected; fields stay 2D until a new direction is chosen
  if (!has) { FLD.want = 0; return false; }
  if (FLD.k === kind && FLD.g) { FLD.want = 1; return true; }
  if (FLD.g) { FLD.g.grp.removeFromParent(); FLD.g = null; }
  FLD.k = kind; FLD.g = buildRime(); FLD.a = 0; FLD.want = 1; D.scene.add(FLD.g.grp); return true; }
export function fieldKinds() { return ['rime']; }
export function stop() { if (FLD.g) { FLD.g.grp.removeFromParent(); FLD.g = null; FLD.k = null; FLD.a = 0; FLD.want = 0; } window.__ls3dSet = false; releaseMarks(); OTS.on = false; OTS.k = 0; gen++; if (!D) return; cv.style.opacity = 0; document.getElementById('app').classList.remove('hd3d', 'hd3dsh'); fz = 1; document.getElementById('app').style.removeProperty('--fz3d'); clearLights(); for (const k in lits) delete lits[k]; for (const s in casters) casters[s].m.visible = false; setTimeout(() => { if (cv.style.opacity === '0') { D.release(); cv.style.display = 'none'; } }, 900); }
export function hit(side, big) { hitK = big ? 1.3 : .8; hitSide = side === 'e' ? 1 : -1; shake = big ? .08 : .04; }
// a hit lands on 'p' or 'e': camera push + shake, then the arena reacts at their feet (light, dust, cracks, element marks)
export function impact(side, o = {}) {
  if (!D || D.paused) return; const big = !!(o.big || o.fin); hitK = o.fin ? 1.7 : big ? 1.3 : .7; hitSide = side === 'e' ? 1 : -1; shake = o.fin ? .14 : big ? .08 : .035;
  const c = casters[side]; const pos = c && c.m.visible ? c.m.position.clone() : new T.Vector3(P.c[0] + (side === 'e' ? gapNow() : -gapNow()), P.c[1], P.c[2]);
  if (FX) FX.impact(pos, Object.assign({}, o, { big }));
}
export function weather(kind) { if (cur) setWeather(cur, kind); }
// a still of the set as it looks right now (no fighters), for the Super Art cinematics to play in front of
export function snapshot() { if (!D || D.paused || !cv) return null; try { D._render(); return cv.toDataURL('image/jpeg', .9); } catch (_) { return null; } }
export function sweep() { supT = 0; }
export function ots(on, def, mode) { OTS.on = !!on; if (def) OTS.def = def; OTS.mode = on && mode === 'wide' ? 'wide' : 'tight'; if (!on) OTS.mode = 'tight'; }
// the game asks whether the 3D set is steering the fighters through a counter (then it leaves their transforms alone)
export function otsLive() { return !!(D && !D.paused && P && !P.painted); }
export const _debug = () => ({ depth: fit && fit.depth, key, P, casters: Object.fromEntries(Object.entries(casters).map(([k, c]) => [k, { vis: c.m.visible, src: c.src.slice(-30), pos: c.m.position.toArray().map(v => +v.toFixed(2)), sc: c.m.scale.toArray().map(v => +v.toFixed(2)) }])), shadows: D && D.renderer.shadowMap.enabled });
export const _dbg2 = () => ({ cur: cur && (cur.name || 'bamboo'), kids: D.scene.children.map(o => o.type + (o.geometry ? ':' + (o.geometry.index ? o.geometry.index.count : 0) : '')).slice(0, 12), cam: D.camera.position.toArray().map(v => +v.toFixed(2)), dir: D.camera.getWorldDirection(new T.Vector3()).toArray().map(v => +v.toFixed(2)), box: (() => { const m = D.scene.children.find(o => o.isMesh && o.geometry.index && o.geometry.index.count > 1000); if (!m) return null; m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox; return [b.min.toArray().map(v => +v.toFixed(1)), b.max.toArray().map(v => +v.toFixed(1)), !!(m.material.map && m.material.map.image)]; })(), P: P && { c: P.c, gap: P.gap, pitch: P.pitch } });
export const _surf = () => P && P.surf;
export const _D = () => D;
export const _lv = () => LV.dbg;
