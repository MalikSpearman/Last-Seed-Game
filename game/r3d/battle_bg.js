// HD-2D battle backdrop: the Moonlit Bamboo Road set rendered behind the normal battle screen.
// Fighters, cards and HUD stay DOM. The camera fits itself so each fighter's feet land on the set's clearing,
// the moon casts each fighter's silhouette onto the 3D ground, and the sprites pick up the set's light and shade.
import { Diorama, T } from './diorama.js';
import { build } from './scene_bamboo.js';
import { ArenaFX } from './arena_fx.js';
let FX = null;

// c: the clearing's centre; gap: half the distance between the two fighters on it (kept clear of props)
// slots: where backup foes stand in a group fight (x, z on the enemy's side, all behind the main enemy and clear of props);
// sum: where a summon stands for the player's side (mirrored across the centre for a rival's summon)
const PRESETS = {
  road:   { c: [-1.5, 0, 2.4], gap: 3.4, pitch: .2,     // lantern string centred between them, stone lanterns framing each side
            slots: [[3.9, -.2], [-.7, -1.2], [2.5, -2.6]], sum: [-2.9, 3.4] },
  shrine: { c: [27, 3, -9.2], gap: 3.3, pitch: .2,      // the torii frames the shrine hall behind them, guardian lions flanking
            slots: [[32.3, -11.8], [27.7, -12.8], [30.9, -14.2]], sum: [25.2, -8.3] },
  bridge: { c: [-16, 0, 6.8], gap: 4.4, pitch: .18,     // one fighter on each bank, the red bridge and stream between them
            slots: [[-8.5, 4.1], [-13.9, 2.7, 1.38], [-10.8, 1.6]], sum: [-19.1, 8.6] },   // the second backup foe stands up on the bridge
};
let D = null, cv = null, built = null, P = PRESETS.road, key = 'road';
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
function solveFit(F) {
  // exact: with the camera's angle fixed, two marks at the same depth pin its position (depth from their spacing, offset from their midpoint)
  const [cx, cy, cz] = P.c, cam = D.camera, ph = P.pitch;
  const want = F && F.p && F.e ? [ndc(F.p.x, F.p.y), ndc(F.e.x, F.e.y)] : [[-.5, -.52], [.5, -.52]];
  const t = Math.tan(cam.fov * Math.PI / 360), asp = cam.aspect;
  const sep = Math.max(.15, want[1][0] - want[0][0]), xm = (want[0][0] + want[1][0]) / 2, ym = (want[0][1] + want[1][1]) / 2;
  const depth = 2 * P.gap / (sep * t * asp);
  const vx = xm * t * asp * depth, vy = ym * t * depth;
  const f = new T.Vector3(0, -Math.sin(ph), -Math.cos(ph)), u = new T.Vector3(0, Math.cos(ph), -Math.sin(ph)), r = new T.Vector3(1, 0, 0);
  const M = new T.Vector3(cx, cy, cz);
  const C = M.clone().sub(r.clone().multiplyScalar(vx)).sub(u.clone().multiplyScalar(vy)).sub(f.clone().multiplyScalar(depth));
  return { C, f, M, depth };
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
    const base = new T.Vector3(cx + (side === 'p' ? -P.gap : P.gap), cy, cz);
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
#app.hd3d .smn .smi{scale:var(--d3s,1);transform-origin:50% 100%}
.lit3d{position:absolute;pointer-events:none;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;-webkit-mask-size:100% 100%;mask-size:100% 100%;z-index:2;transition:opacity .4s}
.lit3d.shade{mix-blend-mode:multiply;background:
  radial-gradient(ellipse 34% 22% at var(--d1x,30%) var(--d1y,35%),rgba(40,52,110,.55),transparent 70%),
  radial-gradient(ellipse 26% 18% at var(--d2x,70%) var(--d2y,62%),rgba(40,52,110,.5),transparent 70%),
  linear-gradient(180deg,rgba(150,165,230,.9) 0%,rgba(205,212,245,.95) 45%,rgba(120,128,190,.95) 100%)}
.lit3d.warm{mix-blend-mode:screen;background:radial-gradient(ellipse 90% 70% at var(--wx,50%) 18%,rgba(255,150,70,.32),transparent 70%),linear-gradient(90deg,var(--rim,rgba(255,170,90,.0)) 0%,transparent 30%)}`;
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
function groupPlace() {
  const fld = document.querySelector('.scr.battle .field'); if (!fld || !P.slots) return;
  const fr = fld.getBoundingClientRect(), k = fld.offsetWidth ? fr.width / fld.offsetWidth : 1, cam = D.camera, gy = P.c[1];
  const ref = (side) => cam.position.distanceTo(new T.Vector3(P.c[0] + (side === 'e' ? P.gap : -P.gap), gy, P.c[2]));
  const put = (el, x, z, side, base, y) => {
    const w = new T.Vector3(x, y == null ? gy : gy + y, z), s = w.clone().project(cam); el.dataset.y3 = y == null ? 0 : y;
    el.style.left = (((s.x + 1) / 2 * innerWidth - fr.left) / k) + 'px'; el.style.top = (((1 - s.y) / 2 * innerHeight - fr.top) / k) + 'px';
    const dep = ref(side) / cam.position.distanceTo(w); el.style.setProperty('--d3s', (dep / base).toFixed(3)); return dep;
  };
  const gp = [...document.querySelectorAll('.scr.battle .gpack .gpk')];
  gp.forEach(c => { const i = +c.dataset.k || 0, sl = P.slots[i % P.slots.length], base = +(c.dataset.dep || .62);
    const dep = put(c, sl[0], sl[1], 'e', base, sl[2]); c.style.zIndex = Math.round(dep * 100); c.dataset.p3 = '1'; });
  document.querySelectorAll('.scr.battle .smn').forEach(el => { const side = el.classList.contains('e') ? 'e' : 'p', [sx, sz] = P.sum;
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
  D.camera.fov = 30; D.faceCam = 1; D.paused = true;
  D.post.uniforms.band.value = .32; D.post.uniforms.amt.value = .6;
  // full-screen cinematics (supers, ultimates, criticals, awakenings) cover the stage: stop drawing it so they get the GPU to themselves
  D.skip = () => { const a = document.getElementById('app'); return !!(a && a.classList.contains('cine')) || !!document.querySelector('.lsq-wrap,.lsq,.ultc'); };
  built = build(D); built.then(() => { FX = new ArenaFX(D); FX.life(P.c); FX.weather(pickWeather(), P.c); });
  let lastF = {}, fitT = 0;
  D.frame((dt, t) => {
    const [cx, cy, cz] = P.c;
    const F = fighters(); if (F.p || F.e) lastF = F;
    fitT -= dt; if (fitT <= 0 || !fit) { fitT = .25; const nf = solveFit(lastF); fit = fit ? { C: fit.C.lerp(nf.C, .5), f: nf.f, M: nf.M, depth: nf.depth } : nf; }
    hitK = Math.max(0, hitK - dt * 2.6); shake = Math.max(0, shake - dt * .45);
    let ang = Math.sin(t * .13) * .018, push = 0;
    if (supT >= 0) { supT += dt; const u = Math.min(1, supT / 1.8); ang = -.1 + ease(u) * .2; push = Math.sin(u * Math.PI) * .06; if (supT > 2.2) supT = -1; }
    const k = ease(Math.min(1, hitK)); push += k * .03;
    // drift, sweep and push-in all pivot on the clearing's centre, so the fighters stay planted on their marks
    const rel = fit.C.clone().sub(fit.M).applyAxisAngle(new T.Vector3(0, 1, 0), ang).multiplyScalar(1 - push);
    const dir = fit.f.clone().applyAxisAngle(new T.Vector3(0, 1, 0), ang);
    const sx = (Math.random() - .5) * shake, sy = (Math.random() - .5) * shake;
    D.camera.position.copy(fit.M).add(rel).add(new T.Vector3(sx + hitSide * .12 * k, sy + Math.sin(t * .17) * .03, 0));
    D.camera.lookAt(D.camera.position.clone().add(dir)); D.camera.updateProjectionMatrix(); D.camera.updateMatrixWorld();
    D.focus = { x: cx, z: cz }; D.followShadow(new T.Vector3(cx, cy, cz));
    placeCasters(lastF); lightSprites(lastF, t);
    groupPlace(); const X = extras(); zoomFor(lastF, X); placeExtraCasters(X); lightExtras(X, t);
  });
  return built;
}
const WEATHER = [['clear', .45], ['rain', .22], ['fog', .18], ['snow', .15]];
function pickWeather() { const w = window.__ls3dWeather; if (w) return w; let r = Math.random(); for (const [k, p] of WEATHER) { if ((r -= p) < 0) return k; } return 'clear'; }
export async function start(host, k) {
  ensure(); k = k || window.__ls3dKey; key = PRESETS[k] ? k : Object.keys(PRESETS)[Math.random() * 3 | 0]; P = PRESETS[key]; fit = null;
  if (cv.parentNode !== host) host.appendChild(cv);
  document.getElementById('app').classList.add('hd3d');
  D.restore(); D.resize(); D.paused = false; await built; if (FX) { FX.clear(); FX.life(P.c); FX.weather(pickWeather(), P.c); } requestAnimationFrame(() => { cv.style.opacity = 1; });
}
export function stop() { if (!D) return; cv.style.opacity = 0; document.getElementById('app').classList.remove('hd3d'); fz = 1; document.getElementById('app').style.removeProperty('--fz3d'); clearLights(); for (const k in lits) delete lits[k]; for (const s in casters) casters[s].m.visible = false; setTimeout(() => { if (cv.style.opacity === '0') D.release(); }, 900); }
export function hit(side, big) { hitK = big ? 1.3 : .8; hitSide = side === 'e' ? 1 : -1; shake = big ? .08 : .04; }
// a hit lands on 'p' or 'e': camera push + shake, then the arena reacts at their feet (light, dust, cracks, element marks)
export function impact(side, o = {}) {
  if (!D || D.paused) return; const big = !!(o.big || o.fin); hitK = o.fin ? 1.7 : big ? 1.3 : .7; hitSide = side === 'e' ? 1 : -1; shake = o.fin ? .14 : big ? .08 : .035;
  const c = casters[side]; const pos = c && c.m.visible ? c.m.position.clone() : new T.Vector3(P.c[0] + (side === 'e' ? P.gap : -P.gap), P.c[1], P.c[2]);
  if (FX) FX.impact(pos, Object.assign({}, o, { big }));
}
export function weather(kind) { if (FX) FX.weather(kind, P.c); }
// a still of the set as it looks right now (no fighters), for the Super Art cinematics to play in front of
export function snapshot() { if (!D || D.paused || !cv) return null; try { D.renderer.setRenderTarget(D.rt); D.renderer.render(D.scene, D.camera); D.renderer.setRenderTarget(null); D.renderer.render(D.postScene, D.postCam); return cv.toDataURL('image/jpeg', .9); } catch (_) { return null; } }
export function sweep() { supT = 0; }
export const _debug = () => ({ depth: fit && fit.depth, key, P, casters: Object.fromEntries(Object.entries(casters).map(([k, c]) => [k, { vis: c.m.visible, src: c.src.slice(-30), pos: c.m.position.toArray().map(v => +v.toFixed(2)), sc: c.m.scale.toArray().map(v => +v.toFixed(2)) }])), shadows: D && D.renderer.shadowMap.enabled });
