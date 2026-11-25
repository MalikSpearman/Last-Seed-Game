// HD-2D battle backdrop: the Moonlit Bamboo Road set rendered behind the normal battle screen.
// Fighters, cards and HUD stay DOM. The camera fits itself so each fighter's feet land on the set's clearing,
// the moon casts each fighter's silhouette onto the 3D ground, and the sprites pick up the set's light and shade.
import { Diorama, T } from './diorama.js';
import { build } from './scene_bamboo.js';
import { buildPainted, setsMeta, nameOf } from './scene_painted.js';
import { ArenaFX } from './arena_fx.js';
let FX = null;

// c: the clearing's centre; gap: half the distance between the two fighters on it (kept clear of props)
// slots: where backup foes stand in a group fight (x, z on the enemy's side, all behind the main enemy and clear of props);
// sum: where a summon stands for the player's side (mirrored across the centre for a rival's summon)
const PRESETS = {
  road:   { c: [-1.5, 0, 2.4], gap: 3.4, pitch: .2, cover: 1.5,     // lantern string centred between them, stone lanterns framing each side
            slots: [[3.9, -.2], [-.7, -1.2], [2.5, -2.6]], sum: [-2.9, 3.4] },
  shrine: { c: [27, 3, -9.2], gap: 3.3, pitch: .2, cover: 1.5,      // the torii frames the shrine hall behind them, guardian lions flanking
            slots: [[32.3, -11.8], [27.7, -12.8], [30.9, -14.2]], sum: [25.2, -8.3] },
  bridge: { c: [-16, 1, 2.6], gap: 3.3, pitch: .2, cover: 1.5,       // both fighters up on the flat span of the red bridge, the stream running below them
            slots: [[-11.4, 2.0], [-7.2, -.2, -1], [-5.6, 1.6, -1]], sum: [-20.4, 3.0] },   // the crew: one on the deck behind the boss, two waiting on the far bank
};
let D = null, cv = null, built = null, P = PRESETS.road, key = 'road';
// counter over-the-shoulder: on the 3D sets the camera swings behind the defender and looks down the line at the attacker (painted sets keep their framing)
const OTS = { on: false, def: 'p', k: 0 };
// every location is its own little world (scene, lights, lanterns, living scenery, effects); the bamboo road plus the
// last painted location stay in memory, the one before that is thrown away
const KEEP = ['scene', 'moon', 'spots', 'pool', 'billboards', 'updaters', 'backdropMesh'];
let cur = null, bamboo = null, painted = null, lock = Promise.resolve();
function use(cx) {
  if (cur === cx) return; if (cur) for (const k of KEEP) cur[k] = D[k];
  for (const k of KEEP) D[k] = cx[k]; cur = cx; FX = cx.fx;
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
  if (!bamboo) { bamboo = blank(D.scene0); bamboo.painted = false; use(bamboo); bamboo.ready = build(D).then(() => { bamboo.fx = FX = new ArenaFX(D); }); }
  use(bamboo); await bamboo.ready; return bamboo;
}
async function paintedCtx(name, url) {
  if (painted && painted.name === name) { use(painted); await painted.ready; return painted; }
  const old = painted, cx = painted = blank(new T.Scene()); cx.name = name; cx.painted = true;
  use(cx); cx.ready = buildPainted(D, name, url, [0, 0, 0]).then(pp => { cx.P = pp; cx.fx = FX = new ArenaFX(D); cx.fx.flat = true; });
  if (old && old !== cx) { if (cur === old) use(cx); disposeCtx(old); }
  await cx.ready; return cx;
}
// modelled sets: real 3D dioramas built for a backdrop; they take over from that backdrop's painted relief
const MODELED = { festival: () => import('./scene_festival.js'), blight: () => import('./scene_blight.js'), marsh: () => import('./scene_marsh.js'),
  seacave: () => import('./scene_seacave.js'), harbor: () => import('./scene_harbor.js'), nw_street: () => import('./scene_nw_street.js') };
let modeled = null;
async function modeledCtx(name) {
  if (modeled && modeled.name === name) { use(modeled); await modeled.ready; return modeled; }
  const old = modeled, cx = modeled = blank(new T.Scene()); cx.name = name; cx.painted = false; cx.modeled = true;
  use(cx); cx.ready = MODELED[name]().then(async mod => { await mod.build(D); cx.P = mod.PRESET; cx.fx = FX = new ArenaFX(D); D.renderer.toneMappingExposure = cx.P.exposure || 1.75; });
  if (old && old !== cx) disposeCtx(old);
  await cx.ready; return cx;
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
const gapNow = () => P.cover ? P.gap * Math.min(1, D.camera.aspect / P.cover) * fz : P.gap;
function solveFit(F) {
  // exact: with the camera's angle fixed, two marks at the same depth pin its position (depth from their spacing, offset from their midpoint)
  const [cx, cy, cz] = P.c, cam = D.camera, ph = P.pitch;
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

// behind the defender's mark, a little toward the audience and above head height, aimed at the attacker's mark;
// a view offset slides the attacker's mark under the attacker's (camera-moved) DOM sprite so they stay planted
function otsCam(F, u) {
  const [cx, cy, cz] = P.c, sg = OTS.def === 'p' ? -1 : 1, cam = D.camera, g = gapNow();
  const Dm = new T.Vector3(cx + sg * g, cy, cz), Am = new T.Vector3(cx - sg * g, cy, cz);
  const dirH = Am.clone().sub(Dm).setY(0).normalize();
  const pos = Dm.clone().sub(dirH.clone().multiplyScalar(2.4)).add(new T.Vector3(0, 1.75, 1.5));
  const look = Am.clone().add(new T.Vector3(0, .9, 0));
  const p0 = cam.position.clone(), l0 = p0.clone().add(cam.getWorldDirection(new T.Vector3()).multiplyScalar(8));
  cam.position.copy(p0.lerp(pos, u)); cam.lookAt(l0.lerp(look, u)); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const fa = F[OTS.def === 'p' ? 'e' : 'p'], r = cv.getBoundingClientRect(); if (!fa || !r.width) return;
  const tx = (fa.x - r.left) / r.width * 2 - 1, ty = -((fa.y - r.top) / r.height) * 2 + 1, sp = Am.clone().project(cam);
  cam.setViewOffset(r.width, r.height, -(tx - sp.x) * r.width / 2 * u, (ty - sp.y) * r.height / 2 * u, r.width, r.height);
}

// ── silhouettes in 3D that only cast shadows ──
function caster(side, fd) {
  let c = casters[side];
  if (!c) {
    const tex = new T.Texture(); tex.colorSpace = T.SRGBColorSpace;
    const m = new T.Mesh(new T.PlaneGeometry(1, 1).translate(0, .5, 0), new T.MeshBasicMaterial({ map: tex, alphaTest: .5, colorWrite: false, depthWrite: false, side: T.DoubleSide }));
    m.castShadow = true; m.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: tex, alphaTest: .5, side: T.DoubleSide });
    D.scene.add(m); c = casters[side] = { m, tex, src: '' };
  }
  if (fd.img.complete && fd.img.naturalWidth && c.src !== fd.img.currentSrc) { c.src = fd.img.currentSrc; c.tex.image = fd.img; c.tex.needsUpdate = true; }
  return c;
}
function placeExtraCasters(X) {
  const cam = D.camera, seen = new Set();
  for (const fd of X) {
    const c = caster(fd.key, fd); seen.add(fd.key);
    const base = groundAt(fd.x, fd.y, P.c[1] + (fd.f && +fd.f.closest('.gpk,.smn')?.dataset.y3 || 0)); if (!base) { c.m.visible = false; continue; }
    const dist = cam.position.distanceTo(base), hw = fd.h / innerHeight * 2 * dist * Math.tan(cam.fov * Math.PI / 360);
    c.m.visible = fd.op > .15 && !!c.src;
    c.m.position.copy(base); c.m.scale.set(hw * fd.w / fd.h * (fd.mir ? -1 : 1), hw, 1);
    c.m.rotation.y = Math.atan2(cam.position.x - base.x, cam.position.z - base.z);
  }
  for (const k in casters) if (k !== 'p' && k !== 'e' && !seen.has(k)) { casters[k].m.visible = false; if (!document.querySelector(`[data-l3="${k}"]`)) { D.scene.remove(casters[k].m); casters[k].tex.dispose(); delete casters[k]; } }
}
function placeCasters(F) {
  const [cx, cy, cz] = P.c, cam = D.camera;
  for (const side of ['p', 'e']) {
    const fd = F[side], c = fd && caster(side, fd); if (!c) { if (casters[side]) casters[side].m.visible = false; continue; }
    const hidden = getComputedStyle(fd.img).visibility === 'hidden' || +getComputedStyle(fd.f).opacity < .1;
    c.m.visible = !hidden && !!c.src;
    // world point under the feet: the clearing mark for that side, nudged to follow lunges/knockback on screen
    const base = new T.Vector3(cx + (side === 'p' ? -gapNow() : gapNow()), cy, cz);
    const sp = base.clone().project(cam), [nx] = ndc(fd.x, fd.y), dist = cam.position.distanceTo(base);
    const wPerNdc = dist * Math.tan(cam.fov * Math.PI / 360) * cam.aspect;
    base.x += (nx - sp.x) * wPerNdc;
    const hw = fd.h / innerHeight * 2 * dist * Math.tan(cam.fov * Math.PI / 360);
    c.m.position.copy(base); c.m.scale.set(hw * fd.w / fd.h * (side === 'e' ? -1 : 1), hw, 1);
    c.m.rotation.y = Math.atan2(cam.position.x - base.x, cam.position.z - base.z);
  }
}

// ── the set's light on the sprites: cool moonlight, warm lantern glow from the lantern side, dappled bamboo shade ──
const CSS = `#app.hd3d .fighter .aura{opacity:0!important}
#app.hd3d .scr.battle .fighter,#app.hd3d .scr.battle .gpk,#app.hd3d .scr.battle .smn{scale:var(--fz3d,1)}
#app.hd3d .scr.battle .fighter.p{left:calc(50% - var(--fxo,25%) * var(--fz3d,1))}
#app.hd3d .scr.battle .fighter.e{left:calc(50% + var(--fxo,25%) * var(--fz3d,1))}
.portrait .scr.battle,.portrait.scr.battle{--fxo:23%}
#app.hd3d .gpk .gim{scale:var(--d3s,1);transform-origin:50% 100%}
#app.hd3d .scr.battle .fighter{z-index:30}
#app.hd3d .scr.battle .fighter .spr .flip,#app.hd3d .scr.battle .fighter>canvas{filter:url(#ls3dlit)}
#app.hd3d .smn .smi{scale:var(--d3s,1);transform-origin:50% 100%}
.lit3d{position:absolute;pointer-events:none;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-size:100% 100%;mask-size:100% 100%;z-index:2;transition:opacity .4s}
.lit3d.shade{mix-blend-mode:multiply;background:
  radial-gradient(ellipse 34% 22% at var(--d1x,30%) var(--d1y,35%),var(--l3d,rgba(40,52,110,.55)),transparent 70%),
  radial-gradient(ellipse 26% 18% at var(--d2x,70%) var(--d2y,62%),var(--l3d,rgba(40,52,110,.5)),transparent 70%),
  linear-gradient(180deg,var(--l3a,rgba(150,165,230,.9)) 0%,var(--l3b,rgba(205,212,245,.95)) 45%,var(--l3c,rgba(120,128,190,.95)) 100%)}
.lit3d.warm{mix-blend-mode:screen;background:radial-gradient(ellipse 90% 70% at var(--wx,50%) 18%,var(--l3w,rgba(255,150,70,.32)),transparent 70%),linear-gradient(90deg,var(--rim,rgba(255,170,90,.0)) 0%,transparent 30%)}`;
function lit(side, fd) {
  let L = lits[side];
  if (L && L.img && L.img !== fd.img) { L.a.remove(); L.b.remove(); L = null; delete lits[side]; }
  if (!L) { const a = document.createElement('div'), b = document.createElement('div'); a.className = 'lit3d shade'; b.className = 'lit3d warm'; L = lits[side] = { a, b, src: '', img: fd.img }; }
  const host = fd.img.parentElement; if (L.a.parentElement !== host) { host.appendChild(L.a); host.appendChild(L.b); }
  L.src = fd.img.currentSrc;
  // follow the sprite exactly: same box, same live transform (idle breathing, lunges, flinches) and opacity, or a faint ghost shows beside it
  const im = fd.img, cs = getComputedStyle(im), tf = cs.transform && cs.transform !== 'none' ? `transform:${cs.transform};transform-origin:${cs.transformOrigin};` : '';
  const box = `left:${im.offsetLeft}px;top:${im.offsetTop}px;width:${im.offsetWidth}px;height:${im.offsetHeight}px;${tf}`;
  const hid = cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .05 ? 'opacity:0;' : `opacity:${cs.opacity};`, mk = `-webkit-mask-image:url("${L.src}");mask-image:url("${L.src}");`;
  return { L, box: box + ';' + mk, hid };
}
function lightSprites(F, t) {
  for (const side of ['p', 'e']) {
    const fd = F[side]; if (!fd) continue; const { L, box, hid } = lit(side, fd);
    // shade blotches drift slowly like leaves moving over a lamp; the lantern is behind the middle, so its glow sits on the inner side
    const d1x = 30 + Math.sin(t * .23 + (side === 'e' ? 2 : 0)) * 14, d1y = 34 + Math.sin(t * .17) * 8, d2x = 66 + Math.sin(t * .19 + 1) * 12, d2y = 60 + Math.cos(t * .21) * 8;
    const flick = .85 + .1 * Math.sin(t * 7.1) + .05 * Math.sin(t * 13.3);
    L.a.style.cssText = `${box};${hid}--d1x:${d1x}%;--d1y:${d1y}%;--d2x:${d2x}%;--d2y:${d2y}%`;
    L.b.style.cssText = `${box};${hid}--wx:78%;${hid === 'opacity:0;' ? '' : `opacity:${flick * (+getComputedStyle(fd.img).opacity || 1)};`}`;   // .flip mirrors the enemy, so 78% is the inner side for both
  }
}
function lightExtras(X, t) {
  const seen = new Set();
  for (const fd of X) {
    seen.add(fd.key); const { L, box } = lit(fd.key, fd);
    const o = fd.op < .05 ? 0 : fd.op, d1x = 32 + Math.sin(t * .2 + fd.x * .01) * 14, d1y = 36 + Math.sin(t * .15 + 1) * 8;
    // backup foes are already dimmed by the game (brightness .62), so their shade is lighter to keep them readable
    L.a.style.cssText = `${box};opacity:${o * (fd.dim ? .7 : 1)};--d1x:${d1x}%;--d1y:${d1y}%;--d2x:68%;--d2y:62%`;
    L.b.style.cssText = `${box};--wx:78%;opacity:${o * (.85 + .1 * Math.sin(t * 7.1 + fd.x))}`;
  }
  for (const k in lits) if (k !== 'p' && k !== 'e' && !seen.has(k)) { lits[k].a.remove(); lits[k].b.remove(); delete lits[k]; }
}
// ── group fights on the set: backup foes and summons stand on the stage's own marks, sized by their real depth ──
let fz = 1;
function zoomFor(F, X) {
  // group fights pull back a little so the whole crew fits; tall enemies pull back until their head clears the HUD band
  const n = X.filter(x => x.dim).length, gz = n >= 2 ? .72 : n === 1 ? .82 : 1;
  let tz = 1; const e = F.e; if (e && e.h > 4) { const raw = e.h / fz, room = innerHeight * (innerWidth < innerHeight ? .5 : .6); if (raw > room) tz = Math.max(.6, room / raw); }
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
  const at = (sl) => P.rel ? [P.c[0] + gapNow() * sl[0], P.c[2] + sl[1]] : sl;
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
  D.skip = () => { const a = document.getElementById('app'); return !!(a && a.classList.contains('cine')) || !!document.querySelector('.lsq-wrap,.lsq,.ultc'); };
  built = Promise.resolve();
  let lastF = {};
  D.frame((dt, t) => {
    // a painted set is framed like its 2D painting: wide screens zoom the lens (never dolly in, which would bare the painting's edges)
    { const tq = Math.tan(Math.PI / 12) * (P.cover ? Math.min(1, P.cover / D.camera.aspect) : 1), fv = Math.atan(tq) * 360 / Math.PI; if (Math.abs(D.camera.fov - fv) > 1e-3) { D.camera.fov = fv; D.camera.updateProjectionMatrix(); } }
    const [cx, cy, cz] = P.c;
    const F = fighters(); if (F.p || F.e) lastF = F;
    // re-aim every frame, eased: the stage's talk/counter camera swings the fighters around and the set has to glide with them (a 4 Hz step here read as choppy)
    { const nf = solveFit(lastF), a = fit ? 1 - Math.exp(-Math.min(dt, .1) * 14) : 1; fit = fit ? { C: fit.C.lerp(nf.C, a), f: nf.f, M: nf.M, depth: fit.depth + (nf.depth - fit.depth) * a } : nf; }
    hitK = Math.max(0, hitK - dt * 2.6); shake = Math.max(0, shake - dt * .45);
    const am = P.painted ? .4 : 1; let ang = Math.sin(t * .13) * .018 * am, push = 0;
    if (supT >= 0) { supT += dt; const u = Math.min(1, supT / 1.8); ang = (-.1 + ease(u) * .2) * am; push = Math.sin(u * Math.PI) * .06; if (supT > 2.2) supT = -1; }
    const k = ease(Math.min(1, hitK)); push += k * .03;
    // drift, sweep and push-in all pivot on the clearing's centre, so the fighters stay planted on their marks
    const rel = fit.C.clone().sub(fit.M).applyAxisAngle(new T.Vector3(0, 1, 0), ang).multiplyScalar(1 - push);
    const dir = fit.f.clone().applyAxisAngle(new T.Vector3(0, 1, 0), ang);
    const sx = (Math.random() - .5) * shake, sy = (Math.random() - .5) * shake;
    D.camera.position.copy(fit.M).add(rel).add(new T.Vector3(sx + hitSide * .12 * k, sy + Math.sin(t * .17) * .03, 0));
    D.camera.lookAt(D.camera.position.clone().add(dir)); D.camera.clearViewOffset();
    { const dk = dt / (window.__tScale || 1); OTS.k = Math.max(0, Math.min(1, OTS.k + (OTS.on && !P.painted ? dk / .34 : -dk / .4))); }
    if (OTS.k > 0) otsCam(lastF, ease(OTS.k));
    D.camera.updateProjectionMatrix(); D.camera.updateMatrixWorld();
    D.focus = { x: cx, z: cz }; D.followShadow(new T.Vector3(cx, cy, cz));
    if (OTS.k > 0) { for (const sd in casters) casters[sd].m.visible = false; } else placeCasters(lastF);
    litTick(t);
    groupPlace(lastF); const X = extras(); zoomFor(lastF, X); placeExtraCasters(X); lightExtras(X, t);
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
function litTick(t) {
  if (!litM) return; const f = .88 + .08 * Math.sin(t * 7.1) + .04 * Math.sin(t * 13.3), k = litK.wk * f, [sr, sg, sb] = litK.s, [wr, wg, wb] = litK.w, row = (s0, w0, i) => [0, 1, 2].map(j => ((j === i ? s0 : 0) + [.3, .59, .11][j] * w0 * k).toFixed(4)).join(' ') + ' 0 0';
  litM.setAttribute('values', `${row(sr, wr, 0)} ${row(sg, wg, 1)} ${row(sb, wb, 2)} 0 0 0 1 0`);
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
  if (cx.painted) { const f = D.scene.fog, base = new T.Color(`rgb(${cx.P.fog.join(',')})`); f.color.copy(base); f.near = kind === 'fog' ? 16 : 60; f.far = kind === 'fog' ? 110 : kind === 'rain' ? 260 : 400; D.scene.background.copy(base); }
}
// k: a roam fight's bamboo spot (road / shrine / bridge); bgUrl: the fight's backdrop, matched to its painted 3D set
let gen = 0;
export function start(host, k, bgUrl) {
  const g0 = gen;
  const go = async () => {
    if (g0 !== gen) return; ensure(); k = k || window.__ls3dKey; const n = nameOf(bgUrl);
    let cx;
    if (!k && n && MODELED[n] && !window.__lsPainted) { cx = await modeledCtx(n); P = cx.P; key = n; }
    else if (!k && n && n !== 'w_bamboo' && (await setsMeta())[n]) { cx = await paintedCtx(n, bgUrl); P = cx.P; key = n; }
    else { cx = await bambooCtx(); key = PRESETS[k] ? k : Object.keys(PRESETS)[Math.random() * 3 | 0]; P = PRESETS[key]; cx.P = P; }
    if (g0 !== gen) return; fit = null;
    if (cv.parentNode !== host) host.appendChild(cv); cv.style.display = '';
    document.getElementById('app').classList.add('hd3d'); spriteLight(cx); litSvg(); litSet(cx);
    D.restore(); D.resize(); D.paused = false;
    if (FX) { FX.clear(); FX.life(P.c, cx.painted ? P : null); setWeather(cx, weatherFor(cx)); }
    requestAnimationFrame(() => { cv.style.opacity = 1; });
  };
  return (lock = lock.then(go, go));
}
export function stop() { gen++; if (!D) return; cv.style.opacity = 0; document.getElementById('app').classList.remove('hd3d'); fz = 1; document.getElementById('app').style.removeProperty('--fz3d'); clearLights(); for (const k in lits) delete lits[k]; for (const s in casters) casters[s].m.visible = false; setTimeout(() => { if (cv.style.opacity === '0') { D.release(); cv.style.display = 'none'; } }, 900); }
export function hit(side, big) { hitK = big ? 1.3 : .8; hitSide = side === 'e' ? 1 : -1; shake = big ? .08 : .04; }
// a hit lands on 'p' or 'e': camera push + shake, then the arena reacts at their feet (light, dust, cracks, element marks)
export function impact(side, o = {}) {
  if (!D || D.paused) return; const big = !!(o.big || o.fin); hitK = o.fin ? 1.7 : big ? 1.3 : .7; hitSide = side === 'e' ? 1 : -1; shake = o.fin ? .14 : big ? .08 : .035;
  const c = casters[side]; const pos = c && c.m.visible ? c.m.position.clone() : new T.Vector3(P.c[0] + (side === 'e' ? gapNow() : -gapNow()), P.c[1], P.c[2]);
  if (FX) FX.impact(pos, Object.assign({}, o, { big }));
}
export function weather(kind) { if (cur) setWeather(cur, kind); }
// a still of the set as it looks right now (no fighters), for the Super Art cinematics to play in front of
export function snapshot() { if (!D || D.paused || !cv) return null; try { D.renderer.setRenderTarget(D.rt); D.renderer.render(D.scene, D.camera); D.renderer.setRenderTarget(null); D.renderer.render(D.postScene, D.postCam); return cv.toDataURL('image/jpeg', .9); } catch (_) { return null; } }
export function sweep() { supT = 0; }
export function ots(on, def) { OTS.on = !!on; if (def) OTS.def = def; }
export const _debug = () => ({ depth: fit && fit.depth, key, P, casters: Object.fromEntries(Object.entries(casters).map(([k, c]) => [k, { vis: c.m.visible, src: c.src.slice(-30), pos: c.m.position.toArray().map(v => +v.toFixed(2)), sc: c.m.scale.toArray().map(v => +v.toFixed(2)) }])), shadows: D && D.renderer.shadowMap.enabled });
export const _dbg2 = () => ({ cur: cur && (cur.name || 'bamboo'), kids: D.scene.children.map(o => o.type + (o.geometry ? ':' + (o.geometry.index ? o.geometry.index.count : 0) : '')).slice(0, 12), cam: D.camera.position.toArray().map(v => +v.toFixed(2)), dir: D.camera.getWorldDirection(new T.Vector3()).toArray().map(v => +v.toFixed(2)), box: (() => { const m = D.scene.children.find(o => o.isMesh && o.geometry.index && o.geometry.index.count > 1000); if (!m) return null; m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox; return [b.min.toArray().map(v => +v.toFixed(1)), b.max.toArray().map(v => +v.toFixed(1)), !!(m.material.map && m.material.map.image)]; })(), P: P && { c: P.c, gap: P.gap, pitch: P.pitch } });
export const _surf = () => P && P.surf;
