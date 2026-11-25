// Shared kit for the modelled arena sets: code-painted textures, sky and moon, and the stock pieces
// (rails, dead trees, stone lanterns, hills, still water) that several sets share. Every set stays HD-2D:
// real geometry for what the fighters stand in, painted cut-outs (D.prop) for foliage and small props.
import { T } from './diorama.js';
import { GLTFLoader } from '../lib/GLTFLoader.js';
export const IMG = n => new URL('./img/', import.meta.url).href + n + '.webp';

// per-set finishing look for the renderer (bloom strength/threshold, ambient occlusion, image-based light): D.setFX(look(name))
const LOOKS = {
  neon:   { bloom: .42, thr: 1.1, env: .3 },           // signs, screens and lamps glow; wet floors pick them up
  fire:   { bloom: .36, thr: 1.15 },                    // lava seams, embers, burning stands
  golden: { bloom: .2, thr: 1.45, env: .3 },            // sunset sets: keep the bright sky from blooming over everything
  wet:    { bloom: .3, env: .32 },                      // rain and sea sets: a little more reflection off the wet stone and decks
  room:   { ao: .55, aoR: .7 },                          // small interiors: tighter contact shadows
  gloss:  { bloom: .36, thr: 1.15, env: .35 },
  bright: { bloom: .16, thr: 1.8, env: .12 },          // daylight-bright interiors (pale floors, white light): almost no glow, or it washes out          // glossy office/studio/station floors
};
const LOOK_OF = { nw_street: 'neon', nw_express: 'neon', nw_teahouse: 'neon', nw_roof: 'neon', nw_snack: 'neon', nw_pachinko: 'neon', nw_casino: 'neon', nw_web: 'neon', festival: 'neon', sakebar: 'neon',
  ring: 'fire', blight: 'fire', sun: 'fire', sun2: 'fire', calamity: 'fire', reno: 'fire',
  proctor: 'golden', proctor2: 'fire', oba: 'golden', oba2: 'neon', golfdad: 'golden', golfdad2: 'wet', mountain_pass: 'golden', road: 'golden',
  e_whale: 'wet', e_light: 'wet', e_dojo: 'wet', w_village: 'wet', w_graves: 'wet', w_mill: 'wet', harbor: 'wet', marsh: 'wet', sunken: 'wet', seacave: 'wet', kuzuryu: 'wet', kuzuryu2: 'wet', rooftops: 'wet',
  tama: 'room', zoomies: 'room', landlord: 'room',
  holdline: 'bright', holdline2: 'gloss', weather: 'bright', weather2: 'gloss', rushhour: 'gloss', rushhour2: 'gloss' };
export function look(name, P) { return Object.assign({}, LOOKS[LOOK_OF[name]] || {}, (P && P.fx) || {}); }

// ── real 3D props: CC0 Poly Haven models (r3d/mdl/*.glb, textures shrunk to webp, geometry quantized; credits in mdl/CREDITS.md)
// model(D, 'wooden_crate_02', x, y, z, { s, h, ry, to }) — feet on y; s scales, or h sets the height; resolves to the placed group
// (its userData.h is the placed height, for stacking). A model that fails to load leaves an empty group, never breaks the set.
const _gl = { L: null, c: {} };
export const MDL = n => new URL('./mdl/', import.meta.url).href + n + (globalThis.LS_MDL_EXT || '.glb');   // the web preview serves them as embedded .json
// the anime finish for real models: cel (toon) shading in three tones, softened surface detail, and a thin dark ink outline
// (an inverted hull pushed out along the normals, constant in screen width) so scanned props sit with the painted sets
let _ramp = null, _ink = null;
function toonRamp() { if (_ramp) return _ramp; const d = new Uint8Array([125, 125, 125, 255, 195, 195, 195, 255, 255, 255, 255, 255]); _ramp = new T.DataTexture(d, 3, 1); _ramp.minFilter = _ramp.magFilter = T.NearestFilter; _ramp.needsUpdate = true; return _ramp; }
function inkMat() { if (_ink) return _ink;
  _ink = new T.ShaderMaterial({ side: T.BackSide, fog: true, uniforms: T.UniformsUtils.merge([T.UniformsLib.fog, { col: { value: new T.Color(0x1a1020) }, w: { value: .0012 } }]),
    vertexShader: `uniform float w;
#include <fog_pars_vertex>
      void main(){ vec3 n=normalize(normalMatrix*normal); vec4 mvPosition=modelViewMatrix*vec4(position,1.); mvPosition.xyz+=n*w*max(1.,-mvPosition.z); gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`,
    fragmentShader: `uniform vec3 col;
#include <fog_pars_fragment>
      void main(){ gl_FragColor=vec4(col,1.);
#include <fog_fragment>
}` });
  return _ink; }
const _toonC = new Map();
function inkUp(sc) {
  if (sc.userData.inked) return; sc.userData.inked = true; const meshes = []; sc.traverse(c => { if (c.isMesh) meshes.push(c); });
  for (const c of meshes) {
    c.material = [].concat(c.material).map(m => { if (_toonC.has(m)) return _toonC.get(m);
      const t = new T.MeshToonMaterial({ color: m.color ? m.color.clone() : 0xffffff, map: m.map || null, normalMap: m.normalMap || null, alphaMap: m.alphaMap || null, transparent: m.transparent, alphaTest: m.alphaTest, side: m.side, gradientMap: toonRamp() });
      if (t.normalMap) t.normalScale.set(.45, .45); if (m.emissive) { t.emissive = m.emissive.clone(); t.emissiveMap = m.emissiveMap || null; t.emissiveIntensity = m.emissiveIntensity; }
      _toonC.set(m, t); return t; });
    if (c.material.length === 1) c.material = c.material[0];
    if (c.geometry && c.geometry.attributes.normal) { const ol = new T.Mesh(c.geometry, inkMat()); ol.castShadow = false; ol.receiveShadow = false; ol.userData.ink = true; c.add(ol); }
  }
}
export function model(D, name, x, y, z, o = {}) {
  if (!_gl.L) _gl.L = new GLTFLoader();
  const src = _gl.c[name] || (_gl.c[name] = new Promise(res => { try { _gl.L.load(MDL(name), g => res(g.scene), undefined, () => res(null)); } catch (_) { res(null); } }));
  const grp = new T.Group(); grp.position.set(x, y, z); if (o.ry) grp.rotation.y = o.ry; if (o.rx) grp.rotation.x = o.rx; if (o.rz) grp.rotation.z = o.rz; (o.to || D.scene).add(grp);
  return src.then(sc => { if (!sc) return grp; inkUp(sc); const m = sc.clone(true);
    const b = new T.Box3().setFromObject(m), sz = b.getSize(new T.Vector3());
    const k = o.h ? o.h / Math.max(1e-3, sz.y) : (o.s || 1); m.scale.setScalar(k); m.position.set(-(b.min.x + b.max.x) / 2 * k * (o.center === false ? 0 : 1), -b.min.y * k, -(b.min.z + b.max.z) / 2 * k * (o.center === false ? 0 : 1));
    const sh = !!(D.renderer && D.renderer.shadowMap && D.renderer.shadowMap.enabled);
    m.traverse(c => { if (!c.isMesh || c.userData.ink) return; c.castShadow = o.cast !== false && sh; c.receiveShadow = true;
      if (o.tint || o.rough != null || o.emissive) { c.material = c.material.clone(); if (o.tint) c.material.color.multiply(new T.Color(o.tint)); if (o.rough != null) c.material.roughness = o.rough; if (o.emissive) { c.material.emissive = new T.Color(o.emissive); c.material.emissiveIntensity = o.emissiveI || 1; } } });
    grp.add(m); grp.userData.h = sz.y * k; grp.userData.w = sz.x * k; grp.userData.d = sz.z * k; return grp; });
}

// ── walkable path through a set, for the connected roam regions: starting from the fight clearing, step outward along
// the lane each way while there's ground under foot and nothing solid in the way (wiggling forward/back in depth around
// obstacles); returns the path points {x, z, y, w} from the far left to the far right, plus each end for the exits
const shown = o => { for (let v = o; v; v = v.parent) if (v.visible === false) return false; return true; };
export function walkPath(D, { z0 = .6, max = 24, step = .5, half = .42, w = 1.3 } = {}) {
  const S = D.scene; S.updateMatrixWorld(true);
  const solid = []; S.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !shown(o) || !o.geometry || o.userData.ink) return; const b = new T.Box3().setFromObject(o), z = b.getSize(new T.Vector3());
    if (z.y < .25 || z.x > 40 || z.z > 40 || (o.material && o.material.transparent && !o.material.depthWrite)) return; solid.push(b); });
  const ray = new T.Raycaster(), down = new T.Vector3(0, -1, 0), grounds = []; S.traverse(o => { if (o.isMesh && !o.isInstancedMesh && shown(o) && !o.userData.ink) grounds.push(o); });
  const groundAt = (x, z, from = 0) => { ray.set(new T.Vector3(x, from + 1.4, z), down); ray.far = 4; const h = ray.intersectObjects(grounds, false).find(i => i.face && Math.abs(i.face.normal.clone().transformDirection(i.object.matrixWorld).y) > .7); return h ? h.point.y : null; };   // cast from just above the feet, so roofs and ceilings never count as floor
  const clear = (x, z, y) => { const b = new T.Box3(new T.Vector3(x - half, y + .3, z - half), new T.Vector3(x + half, y + 1.7, z + half)); return !solid.some(s => s.intersectsBox(b)); };
  const walk = dir => { const pts = []; let z = z0, y = groundAt(0, z0, 0) ?? 0;
    for (let x = dir * step; Math.abs(x) <= max; x += dir * step) {
      let ok = false;
      for (const dz of [0, .5, -.5, 1, -1, 1.6, -1.6]) { const zz = z + dz; if (zz < -2.6 || zz > 3.2) continue; const gy = groundAt(x, zz, y);
        if (gy == null || gy < -1 || Math.abs(gy - y) > .55 || !clear(x, zz, gy)) continue; z = zz; y = gy; ok = true; break; }
      if (!ok) break; pts.push({ x, z, y });
    }
    return pts; };
  const R = walk(1), L = walk(-1).reverse(), all = L.concat([{ x: 0, z: z0, y: groundAt(0, z0, 0) ?? 0 }], R);
  const out = all.filter((p, i) => i === 0 || i === all.length - 1 || i % 3 === 0).map(p => ({ x: p.x, z: p.z, y: p.y, w }));
  return out;
}

// dress a set with real models without hand-placing each one: every item is tried at random spots in the area, sat on
// whatever ground is under it (raycast), and only kept where it clears the fighters' lane, the camera's foreground and
// everything already standing in the set (bounding boxes). items = [[name, count, [minH, maxH] | { s: [a, b] }, opts], ...]
export async function dress(D, R, { area = [-16, 16, -9, 4], items = [], lane = [-8.5, 8.5, -3.6, 2.6], front = 2.4, pad = .3 } = {}) {
  const S = D.scene; S.updateMatrixWorld(true);
  const solid = []; S.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !o.visible || !o.geometry) return; const b = new T.Box3().setFromObject(o), z = b.getSize(new T.Vector3());
    if (z.y < .18 || z.x > 30 || z.z > 30 || (o.material && o.material.transparent && !o.material.depthWrite)) return; solid.push(b); });
  const ray = new T.Raycaster(), down = new T.Vector3(0, -1, 0), grounds = []; S.traverse(o => { if (o.isMesh && !o.isInstancedMesh && o.visible) grounds.push(o); });
  const groundAt = (x, z) => { ray.set(new T.Vector3(x, 30, z), down); ray.far = 40; const h = ray.intersectObjects(grounds, false).find(i => i.face && i.face.normal && Math.abs(i.face.normal.clone().transformDirection(i.object.matrixWorld).y) > .7); return h ? h.point.y : null; };
  const [x0, x1, z0, z1] = area, out = [];
  const laneB = new T.Box3(new T.Vector3(lane[0], -5, lane[2]), new T.Vector3(lane[1], 30, lane[3])), frontB = new T.Box3(new T.Vector3(-16, -5, front), new T.Vector3(16, 30, 60));
  for (const [name, n, size, o = {}] of items) for (let i = 0; i < n; i++) {
    const want = Array.isArray(size) ? { h: R.r(size[0], size[1]) } : { s: R.r(size.s[0], size.s[1]) };
    let g;
    if (name.startsWith('img:')) {   // a painted 2D cut-out (r3d/img), standing upright like the other HD-2D props
      g = await D.prop(IMG(name.slice(4)), 0, 0, want.h || 2, Object.assign({ blob: false, flip: R() < .5 }, o)); g.position.y = -500;
    } else { g = await model(D, name, 0, -500, 0, Object.assign({}, o, want, { ry: R() * 6.28 })); if (!g.children.length) { g.removeFromParent(); continue; } }
    let ok = false;
    for (let k = 0; k < 40 && !ok; k++) {
      const x = R.r(x0, x1), z = R.r(z0, z1);
      const y = groundAt(x, z); if (y == null || y < -1.5) continue;
      g.position.set(x, y, z); g.updateMatrixWorld(true); const b = new T.Box3().setFromObject(g).expandByScalar(pad); b.min.y = y + .08;   // it may sit on a deck or step: only what stands above the ground counts
      if (b.intersectsBox(laneB) || b.intersectsBox(frontB) || solid.some(s => s.intersectsBox(b))) continue;   // the whole footprint clears the fighters' lane, the camera's foreground and the set
      ok = true; solid.push(b); out.push(g); if (name.startsWith('img:') && D.blob) { const bw = new T.Box3().setFromObject(g).getSize(new T.Vector3()).x; D.blob(x, z, bw * .4, y); }
    }
    if (!ok) { g.removeFromParent(); const bi = D.billboards ? D.billboards.indexOf(g) : -1; if (bi >= 0) D.billboards.splice(bi, 1); }
  }
  return out;
}

export function rng(sd) { let q = sd; const R = () => (q = (q * 9301 + 49297) % 233280) / 233280; R.r = (a, b) => a + R() * (b - a); return R; }
export function cvs(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
export function ctex(c, rep, srgb = true) { const t = new T.CanvasTexture(c); if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }

// a set-up helper bound to one diorama: meshes with shadows, boxes standing on their base, cut-out props
export function kit(D) {
  const S = D.scene;
  const add = (geo, mat, x, y, z, o = {}) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz; m.castShadow = o.cast !== false; m.receiveShadow = true; (o.to || S).add(m); return m; };
  const box = (w, h, d, mat, x, y, z, o) => add(new T.BoxGeometry(w, h, d), mat, x, y + h / 2, z, o);
  const prop = (n, x, z, h, o) => D.prop(n.startsWith('data:') ? n : IMG(n), x, z, h, o);
  return { S, add, box, prop };
}

// ── sky: a gradient wall with stars and an optional spiral (a storm eye), plus a moon sprite ──
export function sky(D, stops, { stars = 220, swirl = null, z = -150, y = 40, w = 420, h = 160 } = {}) {
  const c = cvs(512, 512, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); stops.forEach(([u, col]) => gr.addColorStop(u, col)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (swirl) { const [sx, sy, col] = swirl; g.globalCompositeOperation = 'lighter'; for (let a = 0; a < 40; a += .05) { const r = a * 5.5; g.fillStyle = col; g.globalAlpha = Math.max(0, .06 - a * .0012); g.beginPath(); g.arc(sx * W + Math.cos(a) * r * 1.6, sy * H + Math.sin(a) * r * .55, 10 + a * .6, 0, 7); g.fill(); } g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    const R = rng(7); for (let i = 0; i < 200; i++) { const cy = R() * H * .5; g.fillStyle = `rgba(20,8,30,${R.r(.08, .2)})`; g.beginPath(); g.ellipse(R() * W, cy + H * .1, R.r(30, 90), R.r(6, 16), 0, 0, 7); g.fill(); } });
  const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: ctex(c), fog: false })); m.position.set(0, y, z); D.scene.add(m);
  if (stars) { const R = rng(3), g = new T.BufferGeometry(), p = []; for (let i = 0; i < stars; i++) p.push(R.r(-w / 2, w / 2), R.r(y - 10, y + h / 2 - 5), z + 2); g.setAttribute('position', new T.Float32BufferAttribute(p, 3));
    D.scene.add(new T.Points(g, new T.PointsMaterial({ color: 0xffffff, size: .5, fog: false, transparent: true, opacity: .7 }))); }
  return m;
}
export function moon(D, x, y, z, size, tint = [255, 248, 238], halo = [170, 120, 255]) {
  const [r, g0, b] = tint, [hr, hg, hb] = halo;
  const c = cvs(256, 256, (g, W) => { const gr = g.createRadialGradient(128, 128, 40, 128, 128, 128); gr.addColorStop(0, `rgb(${r},${g0},${b})`); gr.addColorStop(.42, `rgb(${r},${g0 - 6},${b - 6})`); gr.addColorStop(.47, `rgba(${hr},${hg},${hb},.35)`); gr.addColorStop(1, `rgba(${hr},${hg},${hb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, W, W); g.fillStyle = 'rgba(0,0,0,.14)'; for (const [x0, y0, rr] of [[105, 100, 18], [150, 140, 22], [120, 160, 10], [160, 95, 9], [90, 140, 7]]) { g.beginPath(); g.arc(x0, y0, rr, 0, 7); g.fill(); } });
  const s = new T.Sprite(new T.SpriteMaterial({ map: ctex(c), fog: false, transparent: true, depthWrite: false })); s.position.set(x, y, z); s.scale.set(size, size, 1); D.scene.add(s); return s;
}

// ── textures ──
// stone flags; cracks: 'lava' glows through the seams (use the second canvas as an emissive map)
export function flags(sd, { hue = [255, 280], sat = [8, 18], lit = [30, 44], rows = 6, cracks = null } = {}) {
  const R = rng(sd), seams = [];
  const col = cvs(512, 512, (g, W, H) => { g.fillStyle = '#1c1624'; g.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) { const h = H / rows; let x = -R() * 120;
      while (x < W) { const w = R.r(90, 170); g.fillStyle = `hsl(${R.r(...hue)},${R.r(...sat)}%,${R.r(...lit)}%)`; g.fillRect(x + 3, r * h + 3, w - 6, h - 6);
        for (let k = 0; k < 30; k++) { g.fillStyle = `rgba(${R() < .5 ? '255,240,255' : '20,10,30'},${R.r(.03, .09)})`; g.fillRect(x + R.r(4, w - 10), r * h + R.r(4, h - 10), R.r(3, 16), R.r(2, 7)); }
        seams.push([x, r * h, w, h]); x += w; } }
    if (cracks) { g.strokeStyle = '#140a10'; g.lineWidth = 3; for (let i = 0; i < 14; i++) { g.beginPath(); let px = R() * W, py = R() * H; g.moveTo(px, py); for (let k = 0; k < 6; k++) { px += R.r(-40, 40); py += R.r(-40, 40); g.lineTo(px, py); } g.stroke(); } } });
  if (!cracks) return { col };
  const R2 = rng(sd + 1);
  const glow = cvs(512, 512, (g, W, H) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.strokeStyle = cracks; g.lineCap = 'round';
    for (const [x, y, w] of seams) if (R2() < .45) { g.lineWidth = R2.r(1.5, 4); g.beginPath(); g.moveTo(x, y + 1); g.lineTo(x + w, y + 1); g.stroke(); }
    for (let i = 0; i < 14; i++) { g.lineWidth = R2.r(1.5, 3.5); g.beginPath(); let px = R2() * W, py = R2() * H; g.moveTo(px, py); for (let k = 0; k < 6; k++) { px += R2.r(-40, 40); py += R2.r(-40, 40); g.lineTo(px, py); } g.stroke(); } });
  return { col, glow };
}
export function planks(sd, { hue = 22, lit = [22, 34], n = 8, moss = true } = {}) {
  const R = rng(sd);
  return cvs(512, 512, (g, W, H) => { const w = W / n; g.fillStyle = '#140c0c'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < n; i++) { let y = -R() * 200; while (y < H) { const L = R.r(140, 300); g.fillStyle = `hsl(${hue + R.r(-6, 6)},${R.r(20, 32)}%,${R.r(...lit)}%)`; g.fillRect(i * w + 2, y + 2, w - 4, L - 4);
        for (let k = 0; k < 10; k++) { g.strokeStyle = `rgba(20,10,6,${R.r(.12, .3)})`; g.lineWidth = 1; g.beginPath(); const gx = i * w + R.r(4, w - 4); g.moveTo(gx, y); g.lineTo(gx + R.r(-3, 3), y + L); g.stroke(); }
        g.fillStyle = 'rgba(10,6,4,.85)'; g.beginPath(); g.arc(i * w + w / 2, y + 12, 2.2, 0, 7); g.fill(); y += L; } }
    if (moss) for (let k = 0; k < 40; k++) { g.fillStyle = `rgba(90,${R.r(110, 150)},50,${R.r(.25, .5)})`; g.beginPath(); g.ellipse(R() * W, R() * H, R.r(4, 18), R.r(2, 6), 0, 0, 7); g.fill(); } });
}
export function rough(sd, base = '#888') { const R = rng(sd); return cvs(256, 256, (g, W, H) => { g.fillStyle = base; g.fillRect(0, 0, W, H); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${R() < .5 ? '255,255,255' : '0,0,0'},.06)`; g.fillRect(R() * W, R() * H, 6, 6); }
  for (let r = 0; r < 4; r++) { g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, r * 64, W, 3); for (let x = (r % 2) * 40; x < W; x += 80) g.fillRect(x, r * 64, 3, 64); } }); }
// a cloth banner: field colour, a border, an emblem drawn by fn(g,cx,cy), optional tatters
export function bannerTex({ field = ['#8c1424', '#6a0e1e'], trim = '#e3b552', emblem = null, tatter = false, sd = 5 } = {}) {
  const R = rng(sd);
  return cvs(256, 768, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, field[0]); gr.addColorStop(1, field[1]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    g.strokeStyle = trim; g.lineWidth = 8; g.strokeRect(14, 14, W - 28, H - 90); if (emblem) emblem(g, W / 2, 290);
    g.globalCompositeOperation = 'destination-out';
    if (tatter) { for (let i = 0; i < 9; i++) { g.beginPath(); g.ellipse(R() * W, R.r(120, H - 120), R.r(6, 20), R.r(10, 34), R(), 0, 7); g.fill(); }
      g.beginPath(); g.moveTo(0, H); for (let x = 0; x <= W; x += 24) g.lineTo(x, H - R.r(20, 150)); g.lineTo(W, H); g.fill(); }
    else { for (let x = 0; x < W; x += 64) { g.beginPath(); g.moveTo(x, H); g.lineTo(x + 32, H - 52); g.lineTo(x + 64, H); g.fill(); } }
    g.globalCompositeOperation = 'source-over'; });
}

// ── pieces ──
// a wooden rail along points [[x,z],..] at height y: posts every `step`, two rails, optional rope ties
export function rail(K, pts, { y = 0, h = 1, step = 1.6, mat, post = .16, rails = [.92, .5] } = {}) {
  const g = new T.Group(); K.S.add(g);
  for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], L = Math.hypot(bx - ax, bz - az), ry = -Math.atan2(bz - az, bx - ax), n = Math.max(1, Math.round(L / step));
    for (const f of rails) K.box(L, .09, .09, mat, (ax + bx) / 2, y + h * f, (az + bz) / 2, { ry, to: g });
    for (let k = 0; k < n; k++) { const u = k / n; K.box(post, h * 1.05, post, mat, ax + (bx - ax) * u, y, az + (bz - az) * u, { to: g }); } }
  const [lx, lz] = pts[pts.length - 1]; K.box(post, h * 1.05, post, mat, lx, y, lz, { to: g }); return g;
}
// a bare, twisted tree out of tapering branches (real geometry so it casts long shadows)
export function deadTree(K, x, z, h, mat, sd = 1, { glow = null } = {}) {
  const R = rng(sd), g = new T.Group(); g.position.set(x, 0, z); K.S.add(g);
  const branch = (p, dir, len, r, depth) => { const end = p.clone().add(dir.clone().multiplyScalar(len));
    const m = new T.Mesh(new T.CylinderGeometry(r * .62, r, len, 6), mat); m.position.copy(p).add(end).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.clone().normalize()); m.castShadow = true; g.add(m);
    if (depth <= 0 || r < .03) return; const k = depth > 2 ? 2 : 3;
    for (let i = 0; i < k; i++) { const d = dir.clone().add(new T.Vector3(R.r(-.9, .9), R.r(-.1, .5), R.r(-.5, .5))).normalize(); branch(end, d, len * R.r(.55, .75), r * .62, depth - 1); } };
  branch(new T.Vector3(0, 0, 0), new T.Vector3(R.r(-.15, .15), 1, 0).normalize(), h * .38, h * .05, 4);
  return g;
}
// a stone lantern (toro) of real blocks with a glowing fire box
export function stoneLantern(D, K, x, z, s = 1, { mat, color = 0xffa040, y = 0, light = true } = {}) {
  const box = (w, h, d, yy, m = mat) => K.box(w * s, h * s, d * s, m, x, y + yy * s, z);
  box(.7, .18, .7, 0); box(.22, .9, .22, .18); box(.55, .14, .55, 1.08);
  const fire = new T.MeshStandardMaterial({ color: 0xfff0c0, emissive: color, emissiveIntensity: 2, roughness: .6 });
  box(.4, .4, .4, 1.22, fire); for (const [dx, dz] of [[-.2, -.2], [.2, -.2], [-.2, .2], [.2, .2]]) K.box(.06 * s, .4 * s, .06 * s, mat, x + dx * s, y + 1.22 * s, z + dz * s);
  const roof = K.add(new T.ConeGeometry(.6 * s, .38 * s, 4), mat, x, y + 1.81 * s, z, { ry: Math.PI / 4 }); K.add(new T.SphereGeometry(.08 * s, 8, 6), mat, x, y + 2.05 * s, z);
  if (light) D.lantern(x, y + 1.42 * s, z + .1, { color, intensity: 14 * s, distance: 8 * s, glow: .8 * s }); else D.glow(x, y + 1.42 * s, z, 1.2 * s, color);
  return roof;
}
// low rolling hills on the horizon (smooth cones squashed flat)
export function hills(K, list, mat) { for (const [x, z, r, h] of list) { const m = K.add(new T.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, 0, z, { cast: false }); m.scale.set(r, h, r * .6); } }
// living water: two layers of ripple normals drifting against each other, a reflected sky (so it reads as a surface,
// not a flat sheet), glints off every light, and rain rings where it rains
export function water(D, x, z, w, d, color = 0x1a1438, { y = -.25, sky = ['#3a2a6a', '#120c2a'], rings = 0, flow = [.012, .008], scale = 6 } = {}) {
  const nt = TL.load(TEXB + 'water_n.webp'); nt.wrapS = nt.wrapT = T.RepeatWrapping; nt.repeat.set(w / scale, d / scale);
  const env = ctex(cvs(256, 128, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, sky[0]); gr.addColorStop(.5, sky[1]); gr.addColorStop(1, '#05040a'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    const R = rng(9); for (let i = 0; i < 50; i++) { g.fillStyle = `rgba(255,${R.r(170, 230) | 0},${R.r(120, 200) | 0},${R.r(.3, .9)})`; g.fillRect(R() * W, H * R.r(.38, .5), R.r(1, 4), R.r(1, 3)); } }));
  env.mapping = T.EquirectangularReflectionMapping;
  const m = new T.Mesh(new T.PlaneGeometry(w, d, 1, 1), new T.MeshStandardMaterial({ color, roughness: .06, metalness: .55, normalMap: nt, envMap: env, envMapIntensity: 1.4, transparent: true, opacity: .95 }));
  m.material.normalScale.set(.55, .55); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); m.receiveShadow = true; D.scene.add(m);
  // a second, larger ripple layer read through the same normal map at another scale (detail + swell)
  const n2 = nt.clone(); n2.needsUpdate = true; n2.repeat.set(w / (scale * 3.3), d / (scale * 3.3));
  const swell = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshStandardMaterial({ color, roughness: .1, metalness: .7, normalMap: n2, envMap: env, transparent: true, opacity: .35, depthWrite: false }));
  swell.rotation.x = -Math.PI / 2; swell.position.set(x, y + .01, z); D.scene.add(swell);
  D.updaters.push(t => { nt.offset.set(t * flow[0], t * flow[1]); n2.offset.set(-t * flow[1] * .6, t * flow[0] * .4); });
  if (rings) { const R = rng(rings), rm = new T.MeshBasicMaterial({ color: 0xd8e0ff, transparent: true, opacity: .5, depthWrite: false, blending: T.AdditiveBlending }), L = [];
    for (let i = 0; i < rings; i++) { const r = new T.Mesh(new T.RingGeometry(.86, 1, 20), rm.clone()); r.rotation.x = -Math.PI / 2; D.scene.add(r); L.push([r, R() * 2]); }
    D.updaters.push(t => { for (const e of L) { const r = e[0], u = ((t * .9 + e[1]) % 2) / 2; if (u < .02 || !r.userData.p) { r.userData.p = 1; r.position.set(x + (Math.random() - .5) * w * .5, y + .02, z + (Math.random() - .5) * Math.min(d, 30)); } r.scale.setScalar(.05 + u * .6); r.material.opacity = (1 - u) * .45; } }); }
  return m;
}
// a glowing particle drift: embers, will-o-wisps, sparks
export const drift = (D, n, cx, cz, rx, rz, color, o = {}) => D.fireflies(n, cx, cz, rx, rz, Object.assign({ color }, o));

// a torii of real beams: two pillars, the swept kasagi, the nuki tie, optional shimenawa rope with paper
export function torii(K, x, z, h, mat, { y = 0, ry = 0, dark = null, rope = null, tilt = 0 } = {}) {
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; g.rotation.z = tilt; K.S.add(g); const w = h * .82, r = h * .055;
  for (const s of [-1, 1]) { K.add(new T.CylinderGeometry(r, r * 1.15, h, 10), mat, s * w / 2, h / 2, 0, { to: g }); K.add(new T.CylinderGeometry(r * 1.4, r * 1.4, h * .08, 10), dark || mat, s * w / 2, h * .04, 0, { to: g }); }
  K.add(new T.BoxGeometry(w * 1.05, r * 1.3, r * 1.3), mat, 0, h * .74, 0, { to: g });
  const top = K.add(new T.BoxGeometry(w * 1.4, r * 1.5, r * 2.2), dark || mat, 0, h * .97, 0, { to: g });
  for (const s of [-1, 1]) K.add(new T.BoxGeometry(w * .18, r * 1.4, r * 2.1), dark || mat, s * w * .74, h * .99, 0, { to: g, rz: s * .18 });
  K.add(new T.BoxGeometry(w * 1.2, r * 1.1, r * 1.6), mat, 0, h * .9, 0, { to: g }); K.add(new T.BoxGeometry(r * 1.2, h * .16, r), dark || mat, 0, h * .82, 0, { to: g });
  if (rope) { const c = new T.CatmullRomCurve3([new T.Vector3(-w / 2, h * .66, r * 1.2), new T.Vector3(0, h * .55, r * 1.2), new T.Vector3(w / 2, h * .66, r * 1.2)]);
    K.add(new T.TubeGeometry(c, 20, r * .5, 6), rope, 0, 0, 0, { to: g });
    const pm = new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0x80a0ff, emissiveIntensity: .3, side: T.DoubleSide });
    for (let i = 1; i < 6; i++) { const p = c.getPoint(i / 6); const s = K.add(new T.PlaneGeometry(r * 1.4, r * 4), pm, p.x, p.y - r * 2.4, p.z + .02, { to: g, cast: false }); } }
  return g;
}
// a junk ship: a hull from stacked tapered boxes, a raised stern castle, masts with batten sails, lit portholes
export function ship(K, D, x, z, L, { y = 0, ry = 0, tilt = 0, sail = 0xb0202e, wreck = false, lights = true } = {}) {
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.set(0, ry, tilt); K.S.add(g);
  const hull = new T.MeshStandardMaterial({ color: wreck ? 0x2c2a2c : 0x3a2a22, roughness: .85 }), trim = new T.MeshStandardMaterial({ color: wreck ? 0x3a3a3e : 0x8a6a3a, roughness: .6 });
  const H = L * .16, B = L * .22;
  for (let i = 0; i < 5; i++) { const u = i / 5, w = L * (1 - u * .35), m = K.add(new T.BoxGeometry(w, H / 5, B * (1 - u * .4)), hull, 0, H - (i + .5) * H / 5, 0, { to: g }); }
  K.add(new T.BoxGeometry(L * .26, H * .7, B * .96), hull, -L * .36, H * 1.35, 0, { to: g }); K.add(new T.BoxGeometry(L * .12, H * .5, B * .8), hull, L * .44, H * 1.2, 0, { to: g });
  K.add(new T.BoxGeometry(L, .12, B + .1), trim, 0, H, 0, { to: g });
  if (lights && !wreck) { const pm = new T.MeshStandardMaterial({ color: 0xffe0a0, emissive: 0xffa040, emissiveIntensity: 2 });
    for (let i = 0; i < 9; i++) K.add(new T.BoxGeometry(L * .04, H * .16, .05), pm, -L * .4 + i * L * .09, H * .62, B / 2 + .02, { to: g, cast: false });
    D.glow(x, y + H * 1.6, z, L * .25, 0xffa050); }
  const sm = new T.MeshStandardMaterial({ color: sail, roughness: .8, side: T.DoubleSide, emissive: sail, emissiveIntensity: .15, transparent: wreck, opacity: wreck ? .6 : 1 });
  const mast = new T.MeshStandardMaterial({ color: 0x2a1c16, roughness: .8 });
  for (const [mx, mh] of [[-L * .12, L * .75], [L * .18, L * .62], [-L * .38, L * .45]]) { const hh = wreck ? mh * .7 : mh;
    K.add(new T.CylinderGeometry(.06 * L / 10, .09 * L / 10, hh, 6), mast, mx, H + hh / 2, 0, { to: g, rz: wreck ? .25 : 0 });
    if (!wreck || mx < 0) { const sw = mh * .48, sh = hh * .78, sg = new T.PlaneGeometry(sw, sh, 4, 6), p = sg.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin((p.getY(i) / sh + .5) * Math.PI) * sw * .08 * (wreck ? .3 : 1)); sg.computeVertexNormals();
      const s = K.add(sg, sm, mx - sw * .42, H + hh * .52, .12, { to: g });
      for (let k = 0; k < 6; k++) K.add(new T.BoxGeometry(sw, .05, .05), mast, mx - sw * .42, H + hh * .52 - sh / 2 + k * sh / 5, .2, { to: g, cast: false }); } }
  return g;
}

// ── PBR materials from the baked texture library (r3d/tex: CC0 Poly Haven sets, see tools/arena_tex.py) ──
const TEXB = new URL('./tex/', import.meta.url).href, TL = new T.TextureLoader(), TC = {};
function ltex(file, rep, srgb) { const k = file + rep; if (TC[k]) return TC[k];
  const t = TL.load(TEXB + file + '.webp'); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); t.anisotropy = 8; if (srgb) t.colorSpace = T.SRGBColorSpace; return (TC[k] = t); }
// pbr('rock_tile_floor', [6, 6], { color, rough, metal, ns, glow: 'lava_flags', emissive, ei, rmap, side })
export function pbr(name, rep = [1, 1], o = {}) {
  const m = new T.MeshStandardMaterial({ map: ltex(name + '_c', rep, true), normalMap: ltex((o.nmap || name) + '_n', rep), roughnessMap: ltex((o.rmap || name) + '_r', rep),
    roughness: o.rough ?? 1, metalness: o.metal ?? 0, color: o.color ?? 0xffffff, side: o.side ?? T.FrontSide });
  m.normalScale.set(o.ns ?? 1, o.ns ?? 1);
  if (o.glow) { m.emissiveMap = ltex(o.glow + '_e', rep, true); m.emissive = new T.Color(o.emissive ?? 0xffffff); m.emissiveIntensity = o.ei ?? 1; }
  return m;
}

// lit shoji walls: a paper-window grid whose lit panes glow (colour + matching emissive map from one seed)
const SHOJI = {};
export function shojiMat(sd, rep = [1, 1], o = {}) {
  sd = sd % 8 + 1; rep = rep.map(v => Math.max(.5, Math.round(v * 2) / 2)); const key = sd + '|' + rep + '|' + JSON.stringify(o); if (SHOJI[key]) return SHOJI[key];
  const draw = glow => { const R = rng(sd); return cvs(256, 128, (g, W, H) => { g.fillStyle = glow ? '#000' : (o.frame || '#3a2418'); g.fillRect(0, 0, W, H);
    for (let x = 6; x < W; x += 50) { const on = R() < (o.lit ?? .8); g.fillStyle = glow ? (on ? '#ffb060' : '#000') : on ? '#ffd090' : '#2a1810'; g.fillRect(x, 20, 40, 80);
      g.fillStyle = glow ? '#000' : (o.frame || '#3a2418'); g.fillRect(x + 19, 20, 3, 80); g.fillRect(x, 58, 40, 3); } }); };
  return (SHOJI[key] = new T.MeshStandardMaterial({ map: ctex(draw(0), rep), emissiveMap: ctex(draw(1), rep), emissive: 0xffa050, emissiveIntensity: o.ei ?? 1.3, roughness: .8 }));
}
// a pagoda-roofed hall: lit walls, tiers of hipped roofs with flared eaves; returns its top height
export function pagoda(K, D, x, z, { w = 6, d = 5, h = 3, tiers = 2, y = 0, wall, roof, beam, sd = 1, lamp = true, ry = 0 } = {}) {
  const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry; K.S.add(g); let yy = 0;
  for (let t = 0; t < tiers; t++) { const s = 1 - t * .22, ww = w * s, dd = d * s, hh = t ? h * .6 : h, wm = wall || shojiMat(sd + t, [ww / 4, 1]);
    const b = K.add(new T.BoxGeometry(ww, hh, dd), [wm, wm, roof, roof, wm, wm], 0, yy + hh / 2, 0, { to: g });
    if (beam) { K.add(new T.BoxGeometry(ww + .2, .18, dd + .2), beam, 0, yy + hh - .05, 0, { to: g }); for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.add(new T.BoxGeometry(.22, hh, .22), beam, sx * ww / 2, yy + hh / 2, sz * dd / 2, { to: g }); }
    yy += hh; const r = K.add(new T.ConeGeometry(Math.max(ww, dd) * .86, 1.3 * s + .4, 4, 1), roof, 0, yy + .55 * s, 0, { to: g, ry: Math.PI / 4 }); r.scale.set(ww / Math.max(ww, dd) * 1.25, 1, dd / Math.max(ww, dd) * 1.25);
    yy += .9 * s; }
  K.add(new T.ConeGeometry(.12, 1, 6), beam || roof, 0, yy + .6, 0, { to: g });
  if (lamp) D.lantern(x, y + h * .55, z + d / 2 + 1, { intensity: 12, distance: 10, glow: 0 });
  return y + yy;
}

// ── Neon Ward pieces: rain, window-grid towers with neon bands, giant curved screens ──
export function rain(D, n, [x0, x1], [y0, y1], [z0, z1], { speed = 14, color = 0xc8d0ff, size = .06 } = {}) {
  const R = rng(n), g = new T.BufferGeometry(), p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[i * 3] = R.r(x0, x1); p[i * 3 + 1] = R.r(y0, y1); p[i * 3 + 2] = R.r(z0, z1); }
  g.setAttribute('position', new T.BufferAttribute(p, 3)); D.scene.add(new T.Points(g, new T.PointsMaterial({ color, size, transparent: true, opacity: .55, depthWrite: false })));
  D.updaters.push((t, dt) => { const a = g.attributes.position.array; for (let i = 0; i < n; i++) { let y = a[i * 3 + 1] - (dt || .016) * speed; if (y < y0) y += y1 - y0; a[i * 3 + 1] = y; } g.attributes.position.needsUpdate = true; });
}
const TOWER = {};
function towerMat(sd, rep) { const k = sd % 6 + '|' + rep; if (TOWER[k]) return TOWER[k];
  const draw = glow => { const R = rng(sd % 6 + 1); return cvs(128, 512, (g, W, H) => { g.fillStyle = glow ? '#000' : '#1a1428'; g.fillRect(0, 0, W, H);
    for (let y = 6; y < H; y += 14) for (let x = 6; x < W; x += 14) { if (R() > .35) continue; const warm = R() < .5; g.fillStyle = glow ? (warm ? '#ffc070' : '#80d0ff') : warm ? '#ffd090' : '#a0e0ff'; g.fillRect(x, y, 8, 8); } }); };
  return (TOWER[k] = new T.MeshStandardMaterial({ map: ctex(draw(0), rep), emissiveMap: ctex(draw(1), rep), emissive: 0xffffff, emissiveIntensity: .9, roughness: .5 })); }
export function neonTower(K, x, z, w, d, h, sd, { y = 0, bands = true } = {}) {
  const R = rng(sd + 3); K.box(w, h, d, towerMat(sd, [Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(h / 24))]), x, y, z, { cast: false });
  if (bands) { const nc = [0xff40c0, 0x40e0ff, 0xb060ff][sd % 3], nm = new T.MeshBasicMaterial({ color: nc, fog: false }); for (let yy = 6; yy < h; yy += R.r(6, 12)) K.box(w + .1, .25, d + .1, nm, x, y + yy, z, { cast: false }); }
}
export function screenTex(kind) { return cvs(256, 512, (g, W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); const R = rng(kind.length * 7);
  if (kind === 'koi') { gr.addColorStop(0, '#2a1a7a'); gr.addColorStop(1, '#5a20a0'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.strokeStyle = 'rgba(120,200,255,.35)'; g.lineWidth = 3; for (let y = 0; y < H; y += 30) { g.beginPath(); for (let x = 0; x <= W; x += 16) g.lineTo(x, y + Math.sin(x * .05 + y) * 6); g.stroke(); }
    g.fillStyle = '#ff9ad8'; g.beginPath(); g.ellipse(128, 220, 46, 110, .35, 0, 7); g.fill(); g.beginPath(); g.moveTo(150, 320); g.quadraticCurveTo(210, 420, 150, 470); g.quadraticCurveTo(120, 400, 120, 330); g.fill();
    g.fillStyle = '#fff'; for (const [x, y] of [[100, 170], [140, 260], [110, 300]]) { g.beginPath(); g.ellipse(x, y, 18, 12, .4, 0, 7); g.fill(); } }
  else if (kind === 'face') { gr.addColorStop(0, '#6a2a8a'); gr.addColorStop(1, '#c04aa0'); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#ffd8f0'; g.beginPath(); g.ellipse(140, 250, 70, 96, -.1, 0, 7); g.fill();
    g.fillStyle = '#2a0a3a'; g.beginPath(); g.ellipse(120, 180, 96, 120, -.3, Math.PI, 0); g.fill(); g.fillRect(40, 170, 40, 260); g.strokeStyle = '#6a2a5a'; g.lineWidth = 4; for (const x of [112, 162]) { g.beginPath(); g.arc(x, 246, 14, .2, Math.PI - .2); g.stroke(); } g.fillStyle = '#e04a8a'; g.beginPath(); g.ellipse(140, 300, 14, 6, 0, 0, 7); g.fill();
    for (let i = 0; i < 60; i++) { g.fillStyle = `hsla(${R.r(300, 340)},90%,80%,.8)`; g.beginPath(); g.arc(R() * W, R() * H * .4, R.r(4, 12), 0, 7); g.fill(); } }
  else { gr.addColorStop(0, '#5a1060'); gr.addColorStop(1, '#a02a8a'); g.fillStyle = gr; g.fillRect(0, 0, W, H); for (let i = 0; i < 140; i++) { g.fillStyle = `hsla(${R.r(300, 340)},90%,${R.r(70, 90)}%,${R.r(.5, .9)})`; g.beginPath(); g.arc(R() * W, R() * H, R.r(4, 14), 0, 7); g.fill(); } }
  g.fillStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < H; y += 4) g.fillRect(0, y, W, 1); }); }
// a flat billboard screen in a steel frame (w x h), facing +z after ry
export function billboard(K, D, x, y, z, w, h, kind, { ry = 0, frame } = {}) {
  const t = ctex(screenTex(kind)); t.center.set(.5, .5); t.rotation = w > h ? Math.PI / 2 : 0;
  const m = K.add(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, fog: false }), x, y, z, { ry, cast: false });
  if (frame) { K.add(new T.BoxGeometry(w + .4, .3, .3), frame, x, y + h / 2 + .1, z - .1, { ry }); K.add(new T.BoxGeometry(w + .4, .3, .3), frame, x, y - h / 2 - .1, z - .1, { ry }); }
  D.glow(x, y, z + 1, Math.max(w, h) * 1.1, kind === 'koi' ? 0x8060ff : 0xff60c0); return m;
}
export function skyline(K, D, R, { zNear = -40, zFar = -140, n = 40, spread = 90, spire = true, y = 0 } = {}) {
  for (let i = 0; i < n; i++) neonTower(K, R.r(-spread, spread), R.r(zNear, zFar), R.r(6, 14), R.r(6, 12), R.r(20, 80) - y, i + 7, { y });
  if (spire) { const sp = new T.MeshStandardMaterial({ color: 0x2a1a40, emissive: 0xa040ff, emissiveIntensity: .5 }); K.box(6, 70, 6, sp, 4, 0, zFar - 10, { cast: false }); K.add(new T.ConeGeometry(3, 40, 6), sp, 4, 90, zFar - 10, { cast: false }); D.glow(4, 110, zFar - 10, 10, 0xff60ff); }
}

// ── detail wave: far painted backdrop, ground fill, near scatter, mid-distance city blocks ──
const IMGB = new URL('../img/', import.meta.url).href;
// the location's own painting as the far backdrop: its upper band (sky + distance, v0..v1 from the top), mirrored
// sideways so it never ends; sits behind every 3D layer so the horizon is always painted, never empty colour
// a painted view through a window: a slice (u0..u1, v0..v1 from the top) of a bg_ panorama on an unlit pane
export function viewMat(name, { u0 = 0, u1 = 1, v0 = 0, v1 = 1, tint = 0xffffff } = {}) {
  const t = TL.load(IMGB + 'bg_' + name + '.webp'); t.colorSpace = T.SRGBColorSpace; t.repeat.set(u1 - u0, v1 - v0); t.offset.set(u0, 1 - v1);
  return new T.MeshBasicMaterial({ map: t, color: tint, fog: false });
}
export function farPainting(D, name, { v0 = 0, v1 = .55, z = -120, yb = -6, h = 120, w = 420, tint = 0xd8d0e8, x = 0 } = {}) {
  z = Math.max(z, -146);   // always in front of the sky wall (z -150), which writes depth
  const t = TL.load(IMGB + 'bg_' + name + '.webp'); t.colorSpace = T.SRGBColorSpace; t.wrapS = T.MirroredRepeatWrapping;
  const tileW = h * 1.5 / (v1 - v0); t.repeat.set(w / tileW, v1 - v0); t.offset.set(.5 - w / tileW / 2, 1 - v1);
  const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, color: tint, fog: false, depthWrite: false })); m.position.set(x, yb + h / 2, z); m.renderOrder = -1; D.scene.add(m);
  // a soft fog skirt where the painting meets the 3D ground
  const sk = cvs(4, 64, (g) => { const gr = g.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.fillRect(0, 0, 4, 64); });
  const fc = D.scene.fog ? D.scene.fog.color : new T.Color(0x201838);
  const s = new T.Mesh(new T.PlaneGeometry(w, h * .16), new T.MeshBasicMaterial({ color: fc, alphaMap: ctex(sk, null, false), transparent: true, fog: false, depthWrite: false })); s.position.set(x, yb + h * .08, z + .5); s.renderOrder = -1; D.scene.add(s);
  return m;
}
// a big ground plane that runs out to the backdrop, so nothing floats over empty colour
export function groundFill(D, mat, { y = -.05, z0 = 20, z1 = -130, w = 320 } = {}) {
  const m = new T.Mesh(new T.PlaneGeometry(w, z0 - z1), mat); m.rotation.x = -Math.PI / 2; m.position.set(0, y, (z0 + z1) / 2); m.receiveShadow = true; D.scene.add(m); return m;
}
const inst = (D, geo, mat, list, shadow = false) => { const m = new T.InstancedMesh(geo, mat, list.length), o = new T.Object3D();
  list.forEach((p, i) => { o.position.set(p[0], p[1], p[2]); o.rotation.set(p[3] || 0, p[4] || 0, p[5] || 0); o.scale.setScalar(p[6] || 1); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
  m.castShadow = shadow; m.receiveShadow = true; D.scene.add(m); return m; };
// near scatter: puddles that mirror the lights, pebbles and debris, grass tufts, fallen petals/leaves lying on the floor
// puddle edge: an irregular, soft-rimmed blob (alpha), so puddles read as wet patches instead of flat hard-edged discs
let _pa = null;
export function puddleAlpha() { if (_pa) return _pa; const R = rng(77); _pa = ctex(cvs(256, 256, (g, W) => { g.fillStyle = '#000'; g.fillRect(0, 0, W, W);
  for (let i = 0; i < 16; i++) { const a = R() * 6.28, d = R() * W * .16, r = W * R.r(.14, .3), x = W / 2 + Math.cos(a) * d, y = W / 2 + Math.sin(a) * d; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(.55, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); } }), null, false); return _pa; }
export function scatter(D, R, { area = [-14, 14, -3, 6], y = 0, puddles = 0, pebbles = 0, tufts = 0, petals = 0, leaves = 0, petal = 0xff9ad0, leaf = 0xc04020, tuft = 0x5a7a3a, stone = 0x6a6070, avoid = 3.6 } = {}) {
  const [x0, x1, z0, z1] = area, pick = (keep = true) => { for (let k = 0; k < 20; k++) { const x = R.r(x0, x1), z = R.r(z0, z1); if (!keep || Math.abs(z) > 1.4 || Math.abs(Math.abs(x) - 3.4) > avoid * .5) return [x, z]; } return [R.r(x0, x1), R.r(z0, z1)]; };
  if (puddles) { const pm = new T.MeshStandardMaterial({ color: 0x0c0a18, roughness: .06, metalness: .8, transparent: true, opacity: .8, depthWrite: false, alphaMap: puddleAlpha(), envMapIntensity: .25, polygonOffset: true, polygonOffsetFactor: -2 });
    for (let i = 0; i < puddles; i++) { const [x, z] = pick(false), p = new T.Mesh(new T.CircleGeometry(1, 20), pm); p.rotation.x = -Math.PI / 2; p.position.set(x, y + .012, z); p.scale.set(R.r(.6, 2.2), R.r(.4, 1.2), 1); p.rotation.z = R() * 3; p.receiveShadow = true; D.scene.add(p); } }
  if (pebbles) { const L = []; for (let i = 0; i < pebbles; i++) { const [x, z] = pick(false); L.push([x, y + .03, z, R() * 3, R() * 3, R() * 3, R.r(.04, .16)]); }
    inst(D, new T.DodecahedronGeometry(1, 0), new T.MeshStandardMaterial({ color: stone, roughness: .9, flatShading: true }), L, true); }
  if (tufts) { const L = []; for (let i = 0; i < tufts; i++) { const [x, z] = pick(); for (let k = 0; k < 5; k++) L.push([x + R.r(-.15, .15), y + .12, z + R.r(-.15, .15), R.r(-.4, .4), R() * 3, R.r(-.4, .4), R.r(.5, 1)]); }
    inst(D, new T.ConeGeometry(.03, .3, 3), new T.MeshStandardMaterial({ color: tuft, roughness: 1 }), L); }
  for (const [n, col, sz] of [[petals, petal, .07], [leaves, leaf, .1]]) if (n) { const L = []; for (let i = 0; i < n; i++) { const [x, z] = pick(false); L.push([x, y + .015, z, -Math.PI / 2, 0, R() * 6, R.r(.7, 1.3)]); }
    const g = new T.CircleGeometry(sz, 5); g.scale(1, .6, 1); inst(D, g, new T.MeshStandardMaterial({ color: col, roughness: .8, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 }), L); }
}
// ── decals: flat patches laid on floors (or walls) that break up tiling and tell a story — scorch, cracks, moss, oil, water
// stains, litter, plus photo decals (CC0 ambientCG: asphalt damage, manhole covers, gum, leak streaks, road arrow) in r3d/tex/dcl_*
const DCLP = { asphalt_dmg: 1, manhole_jp: 1, manhole: 1, gum: 1, leak: 1, leak_streak: 1, arrow: 1 };
const blot = (g, R, x, y, r, col, n = 14) => { for (let i = 0; i < n; i++) { const a = R() * 6.28, d = R() * r * .7, rr = r * R.r(.25, .6); const gr = g.createRadialGradient(x + Math.cos(a) * d, y + Math.sin(a) * d, 0, x + Math.cos(a) * d, y + Math.sin(a) * d, rr); gr.addColorStop(0, col(1)); gr.addColorStop(1, col(0)); g.fillStyle = gr; g.beginPath(); g.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rr, 0, 7); g.fill(); } };
const DCLC = {
  scorch: (g, W, R) => { blot(g, R, W / 2, W / 2, W * .42, a => `rgba(8,4,2,${a * .55})`, 22); blot(g, R, W / 2, W / 2, W * .22, a => `rgba(0,0,0,${a * .5})`, 10); for (let i = 0; i < 60; i++) { g.fillStyle = `rgba(255,${R.r(80, 160) | 0},40,${R.r(.05, .25)})`; g.fillRect(W / 2 + R.r(-W * .3, W * .3), W / 2 + R.r(-W * .3, W * .3), 2, 2); } },
  crack: (g, W, R) => { g.strokeStyle = 'rgba(10,8,8,.85)'; g.lineCap = 'round'; const br = (x, y, a, L, w) => { if (L < 6 || w < .4) return; const x2 = x + Math.cos(a) * L, y2 = y + Math.sin(a) * L; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke(); br(x2, y2, a + R.r(-.5, .5), L * R.r(.7, .9), w * .85); if (R() < .35) br(x2, y2, a + R.r(-1.4, 1.4), L * .6, w * .6); }; for (let k = 0; k < 3; k++) br(W / 2, W / 2, R() * 6.28, W * .09, 3.2); },
  moss: (g, W, R) => { blot(g, R, W / 2, W / 2, W * .45, a => `rgba(${R.r(50, 80) | 0},${R.r(90, 120) | 0},40,${a * .5})`, 30); for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${R.r(60, 110) | 0},${R.r(110, 160) | 0},50,${R.r(.2, .5)})`; const a = R() * 6.28, d = Math.sqrt(R()) * W * .4; g.fillRect(W / 2 + Math.cos(a) * d, W / 2 + Math.sin(a) * d, 2, 2); } },
  oil: (g, W, R) => { blot(g, R, W / 2, W / 2, W * .36, a => `rgba(6,6,10,${a * .7})`, 16); blot(g, R, W / 2, W / 2, W * .2, a => `rgba(40,20,60,${a * .25})`, 6); },
  stain: (g, W, R) => { blot(g, R, W / 2, W / 2, W * .4, a => `rgba(60,40,20,${a * .28})`, 18); g.strokeStyle = 'rgba(70,45,20,.35)'; g.lineWidth = 3; g.beginPath(); g.ellipse(W / 2, W / 2, W * .36, W * .3, R(), 0, 7); g.stroke(); },
  paper: (g, W, R) => { for (let i = 0; i < 9; i++) { g.save(); g.translate(R.r(W * .15, W * .85), R.r(W * .15, W * .85)); g.rotate(R() * 6.28); const w = R.r(30, 70), h = w * R.r(.6, 1.4); g.fillStyle = `rgba(${R.r(220, 245) | 0},${R.r(215, 240) | 0},${R.r(200, 230) | 0},.95)`; g.fillRect(-w / 2, -h / 2, w, h); g.fillStyle = 'rgba(40,40,60,.35)'; for (let k = 0; k < 5; k++) g.fillRect(-w / 2 + 5, -h / 2 + 6 + k * h / 6, w * R.r(.4, .8), 2); g.restore(); } },
};
const DCLM = {};
function dclMat(kind, o = {}) {
  const key = kind + (o.tint || '') + (o.op || 1) + (o.rough ?? '');
  if (DCLM[key]) return DCLM[key];
  let m;
  if (DCLP[kind]) m = new T.MeshStandardMaterial({ map: ltex('dcl_' + kind + '_c', [1, 1], true), normalMap: ltex('dcl_' + kind + '_n', [1, 1]), roughness: o.rough ?? .8 });
  else { const R = rng(kind.length * 31 + 7); m = new T.MeshStandardMaterial({ map: ctex(cvs(256, 256, (g, W) => DCLC[kind](g, W, R))), roughness: o.rough ?? (kind === 'oil' ? .08 : .9), metalness: kind === 'oil' ? .4 : 0 }); }
  Object.assign(m, { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, opacity: o.op || 1 });
  if (o.tint) m.color = new T.Color(o.tint);
  return (DCLM[key] = m);
}
export function decal(D, kind, x, z, w, d = w, { y = 0, ry = 0, wall = false, op = 1, tint, rough } = {}) {
  const m = new T.Mesh(new T.PlaneGeometry(w, d), dclMat(kind, { op, tint, rough }));
  if (wall) { m.position.set(x, y, z); m.rotation.y = ry; } else { m.rotation.set(-Math.PI / 2, 0, ry); m.position.set(x, y + .016, z); }
  m.receiveShadow = true; m.renderOrder = 1; D.scene.add(m); return m;
}
// a batch of floor decals across an area, kept out of the fighters' marks: list = [[kind, count, [minSize, maxSize]], ...]
export function decals(D, R, { area = [-14, 14, -6, 5], y = 0, list = [], keep = 3.6 } = {}) {
  const [x0, x1, z0, z1] = area;
  for (const [kind, n, [a, b] = [1, 2.5], o = {}] of list) for (let i = 0; i < n; i++) {
    let x = 0, z = 0; for (let k = 0; k < 20; k++) { x = R.r(x0, x1); z = R.r(z0, z1); if (Math.abs(z) > 1.6 || Math.abs(Math.abs(x) - 3.4) > keep * .5) break; }
    const s = R.r(a, b); decal(D, kind, x, z, s, s * R.r(.75, 1.25), Object.assign({ y, ry: R() * 6.28 }, o)); }
}
// vertical neon shop signs with glyph-like strokes
const SIGN = {};
function signMat(sd) { const k = sd % 10; if (SIGN[k]) return SIGN[k]; const R = rng(k + 3), col = ['#ff4ac0', '#40e0ff', '#ffd040', '#b070ff', '#ff6a40'][k % 5];
  const c = cvs(64, 256, (g, W, H) => { g.fillStyle = '#140a1c'; g.fillRect(0, 0, W, H); g.strokeStyle = col; g.lineWidth = 5; g.strokeRect(4, 4, W - 8, H - 8); g.lineWidth = 4; g.lineCap = 'round';
    for (let y = 22; y < H - 20; y += 46) { for (let s = 0; s < 4; s++) { g.beginPath(); const x0 = R.r(14, 50), y0 = y + R.r(-10, 10); g.moveTo(x0, y0); g.lineTo(x0 + R.r(-14, 14), y0 + R.r(-14, 14)); g.stroke(); } } });
  return (SIGN[k] = new T.MeshBasicMaterial({ map: ctex(c), fog: true })); }
// a block of low-rise city: lit storefronts, upper windows, vertical neon signs, roof clutter; fills the middle distance
export function cityBlocks(K, D, R, { x0 = -40, x1 = 40, z0 = -16, z1 = -40, n = 14, hMin = 5, hMax = 16, skipX = null, y = 0 } = {}) {
  const wall = new T.MeshStandardMaterial({ color: 0x2a2236, roughness: .8 }), roof = new T.MeshStandardMaterial({ color: 0x1a1624, roughness: .9 }), ac = new T.MeshStandardMaterial({ color: 0x8a8a94, metalness: .3, roughness: .5 });
  for (let i = 0; i < n; i++) { const x = R.r(x0, x1); if (skipX && Math.abs(x - skipX[0]) < skipX[1]) continue; const z = R.r(z0, z1), w = R.r(5, 9), d = R.r(5, 8), h = R.r(hMin, hMax);
    const win = towerMat(i * 5 + 1, [Math.max(1, Math.round(w / 5)), Math.max(1, Math.round(h / 10))]);
    K.add(new T.BoxGeometry(w, h, d), [win, win, roof, roof, win, win], x, y + h / 2, z, { cast: false });
    const shop = shojiMat(i, [Math.max(1, Math.round(w / 3)), 1], { lit: .95, frame: '#20141c' }); K.add(new T.PlaneGeometry(w * .92, 2.4), shop, x, y + 1.3, z + d / 2 + .02, { cast: false });
    if (R() < .6) K.add(new T.BoxGeometry(w * R.r(.4, .8), .16, 1.1), new T.MeshStandardMaterial({ color: [0x7a2030, 0x203a6a, 0x2a2a30, 0x2a4a3a, 0x6a4a20][i % 5], roughness: .8 }), x + R.r(-w / 5, w / 5), y + 2.7, z + d / 2 + .5, { cast: false, rx: .3 });
    const sh = R.r(3, 6); K.add(new T.PlaneGeometry(1, sh), signMat(i), x + R.r(-w / 3, w / 3), y + Math.min(h - 1, 3.4 + sh / 2 + R.r(0, 3)), z + d / 2 + .6, { cast: false });
    if (R() < .6) K.box(1.2, .9, .8, ac, x + R.r(-w / 3, w / 3), y + h, z + R.r(-d / 3, d / 3), { cast: false });
    if (R() < .35) { K.add(new T.CylinderGeometry(.9, .9, 1.6, 12), ac, x + R.r(-w / 4, w / 4), y + h + 1.6, z, { cast: false }); for (const dx of [-.6, .6]) K.box(.1, .8, .1, ac, x + dx, y + h, z, { cast: false }); }
    if (R() < .3) K.box(.08, R.r(2, 5), .08, ac, x + R.r(-w / 3, w / 3), y + h, z + R.r(-d / 3, d / 3), { cast: false });
    if (i % 3 === 0) D.glow(x, y + 2, z + d / 2 + 1, 3, 0xffb060); }
}

// ── background life: animated silhouette pedestrians (several builds, 8-frame walk cycles drawn once) ──
// types: proportions + props; heights in metres
const SIL_T = {
  suit:    { h: 1.82, sh: 24, hip: 15, head: 16, arm: 1, lw: 15, briefcase: 1 },
  coat:    { h: 1.86, sh: 25, hip: 17, head: 16, arm: 1, lw: 16, coat: 1, hat: 1 },
  woman:   { h: 1.66, sh: 19, hip: 18, head: 16, arm: .95, lw: 12, skirt: 1, hair: 1, bag: 1 },
  student: { h: 1.70, sh: 21, hip: 15, head: 17, arm: 1, lw: 14, hood: 1, phone: 1, backpack: 1 },
  kid:     { h: 1.15, sh: 17, hip: 14, head: 22, arm: .9, lw: 13, backpack: 1, bounce: 1.6, kid: 1 },
  elder:   { h: 1.58, sh: 21, hip: 17, head: 16, arm: .95, lw: 14, hunch: .25, cane: 1, slow: 1 },
  big:     { h: 1.80, sh: 31, hip: 27, head: 17, arm: 1, lw: 19, belly: 1 } };
const SIL = {};
function silSheet(type, rim) {
  const k = type + rim; if (SIL[k]) return SIL[k]; const o = SIL_T[type], FW = 128, FH = 256, N = 8;
  const c = cvs(FW * N, FH, (g) => {
    for (let f = 0; f < N; f++) { g.save(); g.translate(f * FW + FW / 2, 0);
      const p = f / N * Math.PI * 2, H = 236, ground = FH - 8, kid = !!o.kid;
      // proportions: heads are ~1/7 of height (kids ~1/5); legs ~0.47 H
      const legL = H * (kid ? .42 : .47), thL = legL * .52, shL = legL * .48, bob = (1 - Math.abs(Math.cos(p))) * 5 * (o.bounce || 1);
      const hipY = ground - legL + 6 - bob, torso = H * (kid ? .27 : .3), shY = hipY - torso, lean = (o.hunch || 0) * 34;
      const seg = (x0, y0, a, l, w0, w1) => { const x1 = x0 + Math.sin(a) * l, y1 = y0 + Math.cos(a) * l, nx = Math.cos(a), ny = -Math.sin(a);
        g.beginPath(); g.moveTo(x0 + nx * w0 / 2, y0 + ny * w0 / 2); g.lineTo(x1 + nx * w1 / 2, y1 + ny * w1 / 2); g.arc(x1, y1, w1 / 2, Math.atan2(ny, nx), Math.atan2(-ny, -nx)); g.lineTo(x0 - nx * w0 / 2, y0 - ny * w0 / 2); g.arc(x0, y0, w0 / 2, Math.atan2(-ny, -nx), Math.atan2(ny, nx)); g.fill(); return [x1, y1]; };
      const leg = (s) => { const q = p + (s < 0 ? Math.PI : 0), th = .42 * Math.sin(q), knee = .62 * Math.max(0, Math.sin(q + 2.3)) ** 1.3;
        const kn = seg(s * 2, hipY, th, thL, o.lw * 1.25, o.lw), an = seg(kn[0], kn[1], th - knee, shL, o.lw, o.lw * .7);
        g.beginPath(); g.moveTo(an[0] - 4, an[1] - 3); g.lineTo(an[0] + o.lw * 1.3, an[1] + 3); g.lineTo(an[0] - 4, an[1] + 5); g.fill(); };
      const arm = (s, front) => { const q = p + (s > 0 ? Math.PI : 0), sw = .38 * Math.sin(q) * (o.arm || 1), ax = lean + s * o.sh * .55, aL = H * .17;
        if (front && o.phone) { const el = seg(ax, shY + 6, .2, aL, o.lw * .8, o.lw * .65); return seg(el[0], el[1], Math.PI - .7, aL * .9, o.lw * .65, o.lw * .55); }
        const el = seg(ax, shY + 6, sw, aL, o.lw * .85, o.lw * .65); return seg(el[0], el[1], sw + .25 + Math.max(0, sw) * .5, aL * .92, o.lw * .65, o.lw * .55); };
      const draw = (fill) => { g.fillStyle = fill; g.strokeStyle = fill; g.lineCap = 'round'; g.lineJoin = 'round';
        leg(-1); const back = arm(-1); if (o.briefcase) { g.beginPath(); g.roundRect(back[0] - 15, back[1] - 2, 30, 22, 3); g.fill(); }
        if (o.backpack) { g.beginPath(); g.roundRect(-o.sh - 14 + lean, shY + 8, 20, torso * .72, 7); g.fill(); }
        // torso: rounded shoulders down to the hips
        g.beginPath(); g.moveTo(-o.hip, hipY + 6); g.lineTo(-o.sh + lean, shY + 10); g.quadraticCurveTo(-o.sh + lean, shY, -o.sh + 10 + lean, shY); g.lineTo(o.sh - 10 + lean, shY); g.quadraticCurveTo(o.sh + lean, shY, o.sh + lean, shY + 10); g.lineTo(o.hip, hipY + 6); g.closePath(); g.fill();
        if (o.belly) { g.beginPath(); g.ellipse(8 + lean * .5, (shY + hipY) / 2 + 8, o.sh * .95, torso * .48, 0, 0, 7); g.fill(); }
        if (o.coat) { const sw = Math.sin(p) * 6; g.beginPath(); g.moveTo(-o.hip - 3, hipY - 6); g.lineTo(o.hip + 3, hipY - 6); g.lineTo(o.hip + 10 + sw, hipY + thL * 1.25); g.lineTo(-o.hip - 10 + sw, hipY + thL * 1.25); g.closePath(); g.fill(); }
        if (o.skirt) { const sw = Math.sin(p) * 5; g.beginPath(); g.moveTo(-o.hip, hipY - 8); g.lineTo(o.hip, hipY - 8); g.lineTo(o.hip + 13 + sw, hipY + thL * 1.05); g.lineTo(-o.hip - 13 + sw, hipY + thL * 1.05); g.closePath(); g.fill(); }
        leg(1); const front = arm(1, true);
        if (o.bag) { g.beginPath(); g.ellipse(-o.sh + 4 + lean, hipY - 4, 12, 14, 0, 0, 7); g.fill(); g.lineWidth = 3; g.beginPath(); g.moveTo(-o.sh + 4 + lean, hipY - 16); g.lineTo(o.sh * .4 + lean, shY + 2); g.stroke(); }
        if (o.cane) { g.lineWidth = 5; g.beginPath(); g.moveTo(front[0], front[1]); g.lineTo(front[0] + 12 + Math.sin(p) * 10, ground); g.stroke(); }
        if (o.phone) { g.beginPath(); g.roundRect(front[0] - 5, front[1] - 16, 10, 18, 2); g.fill(); }
        // neck and head (with hair, hat or hood)
        const hx = lean * 1.35 + (o.hunch ? 10 : 2), hy = shY - o.head * .95 - 4;
        g.beginPath(); g.roundRect(lean - o.head * .35 + 1, hy + o.head * .5, o.head * .7, o.head, 4); g.fill();
        g.beginPath(); g.ellipse(hx, hy, o.head * .88, o.head, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(hx + o.head * .7, hy + o.head * .25, o.head * .28, o.head * .22, 0, 0, 7); g.fill();
        if (o.hair) { g.beginPath(); g.moveTo(hx - o.head * .7, hy - o.head * .6); g.quadraticCurveTo(hx - o.head * 1.6, hy + o.head * 1.8, hx - o.head * .4, hy + o.head * 2.4); g.lineTo(hx + o.head * .1, hy + o.head * .4); g.closePath(); g.fill(); }
        if (o.hat) { g.beginPath(); g.ellipse(hx, hy - o.head * .55, o.head * 1.5, o.head * .22, 0, 0, 7); g.fill(); g.beginPath(); g.roundRect(hx - o.head * .85, hy - o.head * 1.45, o.head * 1.7, o.head * .95, 4); g.fill(); }
        if (o.hood) { g.beginPath(); g.ellipse(hx - 4, hy - 1, o.head * 1.12, o.head * 1.18, 0, 0, 7); g.fill(); } };
      // a thin coloured rim behind (light catching the edge), then the dark figure
      g.save(); g.translate(-2.5, -1); draw(rim); g.restore(); draw('#0b0912');
      g.restore(); } });
  const t = ctex(c); t.repeat.set(1 / N, 1); return (SIL[k] = { tex: t, N, h: o.h, slow: o.slow }); }
export const PEDS = Object.keys(SIL_T);
export async function walkers(D, R, { z = -6, x0 = -16, x1 = 16, every = [4, 9], group = 3, umbrellas = 0, speed = [1.2, 1.7], y = 0, types = PEDS, zJit = .9, rim = '#7a5ac8', scale = 1 } = {}) {
  const pool = [];
  const umbM = [0x1a1424, 0x2a1a2a, 0x141a2a, 0x3a1a24].map(c => new T.MeshStandardMaterial({ color: c, roughness: .4, side: T.DoubleSide }));
  for (let i = 0; i < 9; i++) { const type = types[i % types.length], sh = silSheet(type, rim), tex = sh.tex.clone(); tex.needsUpdate = true;
    const hh = sh.h * scale, ww = hh * .5, geo = new T.PlaneGeometry(ww, hh); geo.translate(0, hh / 2, 0);
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .4, depthWrite: true })); m.visible = false; D.scene.add(m); D.billboards.push(m);
    const blob = D.blob(0, 0, .4 * scale, y); blob.visible = false; let umb = null;
    if (umbrellas && type !== 'kid') { umb = new T.Group(); const c2 = new T.Mesh(new T.ConeGeometry(.72 * scale, .36 * scale, 12, 1, true), umbM[i % umbM.length]); c2.position.y = hh + .2; umb.add(c2); const st = new T.Mesh(new T.CylinderGeometry(.012, .012, .8), umbM[0]); st.position.y = hh - .2; umb.add(st); umb.visible = false; D.scene.add(umb); }
    pool.push({ m, tex, sh, blob, umb, on: false, d: 0 }); }
  let next = R.r(.5, 2);
  D.updaters.push((t, dt) => { dt = dt || .016;
    if (t > next) { const n = 1 + (R() * group | 0), dir = R() < .5 ? 1 : -1; let k = 0;
      for (const p of shuffleIn(pool, R)) { if (p.on || k >= n) continue; k++; p.on = true; p.dir = dir; p.v = R.r(...speed) * (p.sh.slow ? .6 : 1); p.x = (dir > 0 ? x0 : x1) - dir * k * R.r(.7, 1.5); p.z = z + R.r(-zJit, zJit); p.d = R() * 3;
        p.m.visible = p.blob.visible = true; p.m.scale.x = dir > 0 ? 1 : -1; if (p.umb) p.umb.visible = R() < umbrellas; }
      next = t + R.r(...every); }
    for (const p of pool) { if (!p.on) continue; const step = p.dir * p.v * dt; p.x += step; p.d += Math.abs(step);
      const stride = p.sh.h * scale * .78, f = Math.floor(p.d / stride * p.sh.N) % p.sh.N; p.tex.offset.x = f / p.sh.N;
      p.m.position.set(p.x, y, p.z); p.blob.position.set(p.x, y + .02, p.z); if (p.umb) p.umb.position.set(p.x + p.dir * .08, y, p.z);
      if ((p.dir > 0 && p.x > x1 + 1) || (p.dir < 0 && p.x < x0 - 1)) { p.on = false; p.m.visible = p.blob.visible = false; if (p.umb) p.umb.visible = false; } } });
}
const shuffleIn = (a, R) => a.slice().sort(() => R() - .5);

// ── mid-ground clutter by theme, scattered through a band behind the fighters (keeps the centre lane clear) ──
export async function clutter(D, K, R, theme, { area = [-16, 16, -6, -22], n = 24, clear = 5, y = 0 } = {}) {
  const [x0, x1, z0, z1] = area, pos = () => { for (let k = 0; k < 30; k++) { const x = R.r(x0, x1), z = R.r(z1, z0); if (Math.abs(x) > clear || z < z0 - 6) return [x, z]; } return [R.r(x0, x1), R.r(z1, z0)]; };
  const M = { metal: pbr('metal_plate', [1, 1], { color: 0x6a6878, metal: .6, rough: .6 }), wood: pbr('weathered_planks', [.5, .5], { color: 0x9a7a6a }), stone: pbr('mossy_rock', [.5, .5], { color: 0xb0b0b0 }),
    rock: pbr('rock_face', [1, 1], { color: 0x8a8090, ns: 1.6 }), bag: new T.MeshStandardMaterial({ color: 0x14141a, roughness: .35, metalness: .2 }), red: new T.MeshStandardMaterial({ color: 0xb02a30, roughness: .6 }),
    lamp: new T.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffa040, emissiveIntensity: 1.8 }), rope: new T.MeshStandardMaterial({ color: 0xc0a070 }) };
  for (let i = 0; i < n; i++) { const [x, z] = pos(), ry = R.r(-.6, .6), pick = R();
    if (theme === 'city') {
      if (pick < .2) { const hue = [200, 340, 30, 120][i % 4], vm = new T.MeshStandardMaterial({ color: `hsl(${hue},60%,45%)`, emissive: `hsl(${hue},80%,55%)`, emissiveIntensity: .5 }); K.box(1, 2, .8, vm, x, y, z, { ry }); D.glow(x, y + 1.2, z + .5, 1.6, 0x80c0ff); }
      else if (pick < .38) { for (let k = 0; k < 3; k++) { const b = K.add(new T.SphereGeometry(.4, 8, 6), M.bag, x + k * .5 - .5, y + .3, z + R.r(-.2, .2)); b.scale.y = .8; } }
      else if (pick < .52) { const g = new T.Group(); g.position.set(x, y, z); g.rotation.y = ry + Math.PI / 2 * (R() < .5 ? 1 : 0); D.scene.add(g);   // a bicycle
        for (const dx of [-.55, .55]) K.add(new T.TorusGeometry(.33, .03, 6, 18), M.metal, dx, .35, 0, { to: g }); K.add(new T.BoxGeometry(1.1, .04, .04), M.red, 0, .55, 0, { to: g, rz: .2 }); K.add(new T.BoxGeometry(.04, .5, .04), M.metal, .3, .65, 0, { to: g }); }
      else if (pick < .66) { K.box(.6, 1.6, .06, new T.MeshBasicMaterial({ color: [0xff4ac0, 0x40e0ff, 0xffd040][i % 3] }), x, y + .4, z, { ry, cast: false }); K.box(.08, .4, .08, M.metal, x, y, z); }   // A-board sign
      else if (pick < .8) { K.box(.8, .9, .8, M.wood, x, y, z, { ry }); K.box(.7, .7, .7, M.wood, x + .2, y + .9, z, { ry: ry + .4 }); }
      else { K.add(new T.CylinderGeometry(.35, .3, .9, 12), M.metal, x, y + .45, z); }   // bin
    } else if (theme === 'shrine') {
      if (pick < .3) { K.box(.5, 1.2, .5, M.stone, x, y, z); K.add(new T.ConeGeometry(.45, .35, 4), M.stone, x, y + 1.35, z, { ry: Math.PI / 4 }); D.glow(x, y + 1, z, .8, 0xffa040); }
      else if (pick < .5) { K.box(1.6, .9, .1, M.wood, x, y + .6, z, { ry }); for (let k = 0; k < 6; k++) K.box(.22, .16, .02, new T.MeshStandardMaterial({ color: 0xe8d8b8 }), x - .6 + k * .24, y + 1.1, z + .06, { ry, cast: false }); K.box(.08, .6, .08, M.wood, x - .7, y, z, { ry }); K.box(.08, .6, .08, M.wood, x + .7, y, z, { ry }); }   // ema board
      else if (pick < .75) { const b = K.add(new T.DodecahedronGeometry(R.r(.4, .9), 1), M.rock, x, y + .2, z, { ry }); b.scale.y = .6; }
      else await D.prop(IMG('ferns'), x, z, R.r(.8, 1.4), { y, tint: 0x6a8a6a, flip: R() < .5 });
    } else if (theme === 'wild') {
      if (pick < .35) await D.prop(IMG('ferns'), x, z, R.r(.9, 1.8), { y, tint: R() < .5 ? 0x7a9a6a : 0x5a7a5a, flip: R() < .5 });
      else if (pick < .6) { const b = K.add(new T.DodecahedronGeometry(R.r(.4, 1.2), 1), M.rock, x, y + .2, z, { ry }); b.scale.y = .55; }
      else if (pick < .75) K.add(new T.CylinderGeometry(.22, .28, R.r(1.6, 3), 8), M.wood, x, y + .25, z, { rz: Math.PI / 2 - .1, ry });   // fallen log
      else { for (let k = 0; k < 7; k++) K.add(new T.ConeGeometry(.05, R.r(.6, 1.2), 3), new T.MeshStandardMaterial({ color: 0x6a8a4a }), x + R.r(-.3, .3), y + .4, z + R.r(-.3, .3), { rz: R.r(-.3, .3), cast: false }); }   // reeds
    } else if (theme === 'dock') {
      if (pick < .3) K.box(R.r(.7, 1.1), R.r(.7, 1.1), R.r(.7, 1.1), M.wood, x, y, z, { ry });
      else if (pick < .5) { K.add(new T.CylinderGeometry(.42, .42, 1.1, 14), M.wood, x, y + .55, z); for (const yy of [.2, .9]) K.add(new T.TorusGeometry(.43, .03, 5, 16), M.metal, x, y + yy, z, { rx: Math.PI / 2, cast: false }); }
      else if (pick < .7) for (let k = 0; k < 3; k++) K.add(new T.TorusGeometry(.5 - k * .1, .07, 5, 16), M.rope, x, y + .05 + k * .07, z, { rx: Math.PI / 2 });
      else { K.box(.4, .9, .4, M.wood, x, y, z); K.add(new T.TorusGeometry(.22, .05, 5, 10), M.rope, x, y + .7, z, { rx: Math.PI / 2 }); }
    } }
}

// ── a browsing crowd: silhouettes that drift between stall spots, linger, wander along their side, and only now and
// then cross over. spots: [[x, z, face]] where face is the way they look while they stand there (-1 left / 1 right)
export function crowd(D, R, { spots = [], n = 12, types = PEDS, rim = '#ffb060', cross = .12, speed = [.9, 1.5], linger = [2.5, 11], y = 0, jitter = .6 } = {}) {
  if (!spots.length) return; const side = s => Math.sign(s[0]) || 1;
  for (let i = 0; i < n; i++) { const type = types[(i * 3 + (R() * types.length | 0)) % types.length], sh = silSheet(type, rim), tex = sh.tex.clone(); tex.needsUpdate = true;
    const hh = sh.h, geo = new T.PlaneGeometry(hh * .5, hh); geo.translate(0, hh / 2, 0);
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .4 })); D.scene.add(m); D.billboards.push(m); const blob = D.blob(0, 0, .38, y);
    const at = spots[R() * spots.length | 0], a = { m, tex, sh, blob, x: at[0] + R.r(-jitter, jitter), z: at[1] + R.r(-jitter, jitter), spot: at, wait: R.r(0, linger[1]), d: R() * 3, v: R.r(...speed) * (sh.slow ? .6 : 1), face: at[2] || -side(at), sway: R() * 6, tx: 0, tz: 0, moving: false };
    const pickNext = () => { const same = spots.filter(s => side(s) === side(a.spot) && s !== a.spot), other = spots.filter(s => side(s) !== side(a.spot));
      // mostly the next stall or two along the same side; rarely across the avenue
      let to; if (other.length && R() < cross) to = other[R() * other.length | 0]; else { const near = same.sort((p, q) => Math.abs(p[1] - a.spot[1]) - Math.abs(q[1] - a.spot[1])).slice(0, 3); to = near.length ? near[R() * near.length | 0] : a.spot; }
      a.spot = to; a.tx = to[0] + R.r(-jitter, jitter); a.tz = to[1] + R.r(-jitter, jitter); a.moving = true; };
    D.updaters.push((t, dt) => { dt = dt || .016;
      if (!a.moving) { a.wait -= dt; a.tex.offset.x = 0; a.m.scale.x = a.face; // standing: a small idle sway, now and then a glance the other way
        a.m.rotation.z = Math.sin(t * .8 + a.sway) * .015; if (R() < dt * .08) a.m.scale.x = -a.face; if (a.wait <= 0) pickNext(); }
      else { const dx = a.tx - a.x, dz = a.tz - a.z, L = Math.hypot(dx, dz); if (L < .08) { a.moving = false; a.wait = R.r(...linger); a.face = a.spot[2] || -side(a.spot); a.m.rotation.z = 0; }
        else { const st = Math.min(L, a.v * dt); a.x += dx / L * st; a.z += dz / L * st; a.d += st; if (Math.abs(dx) > .05) a.m.scale.x = Math.sign(dx);
          a.tex.offset.x = (Math.floor(a.d / (a.sh.h * .78) * a.sh.N) % a.sh.N) / a.sh.N; } }
      a.m.position.set(a.x, y, a.z); a.blob.position.set(a.x, y + .02, a.z); });
  }
}

// ── coast pieces: open sea with drifting foam lines, waves breaking on rocks ──
export function sea(D, R, { z = -60, w = 300, d = 110, y = -.9, color = 0x1a1238, sky = ['#8a2a4a', '#2a1440'], shore = -8, foam = 6 } = {}) {
  const m = water(D, 0, z, w, d, color, { y, sky, flow: [.02, .016], scale: 8 }); m.material.emissive = new T.Color(0x120820);
  const fm = new T.MeshBasicMaterial({ color: 0xe8e0f0, transparent: true, opacity: .5, depthWrite: false }), L = [];
  for (let i = 0; i < foam; i++) { const f = new T.Mesh(new T.PlaneGeometry(R.r(20, 60), R.r(.4, 1)), fm.clone()); f.rotation.x = -Math.PI / 2; f.position.set(R.r(-40, 40), y + .03, shore - i * 3); D.scene.add(f); L.push([f, R() * 6, shore - i * 3]); }
  D.updaters.push(t => { for (const [f, ph, z0] of L) { const u = (Math.sin(t * .5 + ph) + 1) / 2; f.position.z = z0 + u * 2.2; f.material.opacity = .15 + u * .45; f.scale.y = .6 + u; } });
  return m;
}
export function breakers(D, R, spots, { y = -.6 } = {}) {   // white spray bursting off rocks on a cycle
  const sm = new T.SpriteMaterial({ color: 0xf0f0ff, transparent: true, opacity: .6, depthWrite: false }), L = [];
  for (const [x, z, s] of spots) for (let k = 0; k < 5; k++) { const p = new T.Sprite(sm.clone()); D.scene.add(p); L.push([p, x + R.r(-1, 1) * s, z, s, R() * 6]); }
  D.updaters.push(t => { for (const [p, x, z, s, ph] of L) { const u = ((t * .35 + ph) % 1.6) / 1.6, burst = Math.sin(Math.min(1, u * 1.4) * Math.PI);
    p.position.set(x, y + burst * 2.2 * s, z); p.scale.setScalar((.6 + u * 2.4) * s); p.material.opacity = Math.max(0, burst * .55); } });
}
// a wet wooden deck the fight stands on, with its posts, front rope and stone lanterns at the back corners
export function deck(D, K, R, { w = 30, d = 9, z = 1.2, mat, post, stone, lanterns = true, rope = true } = {}) {
  K.box(w, .4, d, mat, 0, -.4, z); for (let x = -w / 2 + 1; x <= w / 2 - 1; x += 2.6) for (const zz of [z - d / 2 + .3, z + d / 2 - .3]) K.box(.5, 1.6, .5, post, x, -1.8, zz);
  if (lanterns) { stoneLantern(D, K, -w / 2 + 2.6, z - d / 2 + .6, 1.4, { mat: stone }); stoneLantern(D, K, w / 2 - 2.6, z - d / 2 + .6, 1.4, { mat: stone }); }
  if (rope) for (const s of [-1, 1]) { const x = s * (w / 2 - 1.2); K.box(.6, 1.1, .6, post, x, 0, z + d / 2 - .8); for (let k = 0; k < 3; k++) K.add(new T.TorusGeometry(.42 - k * .08, .07, 5, 14), new T.MeshStandardMaterial({ color: 0xb89a60 }), x, .9 + k * .08, z + d / 2 - .8, { rx: Math.PI / 2 }); }
}

// ── boss-phase effects ──
// lightning: jagged additive bolts that strike at random, with a flash of light across the set
export function lightning(D, R, { color = 0xb0c0ff, area = [-40, 40, -40, -90], every = [2, 6], top = 60 } = {}) {
  const bm = new T.LineBasicMaterial({ color, transparent: true, opacity: 0, fog: false }), flash = new T.PointLight(color, 0, 200, 1); flash.position.set(0, 40, -30); D.scene.add(flash);
  let line = null, next = R.r(...every), life = 0, given = 0;
  D.updaters.push((t, dt) => { dt = dt || .016;
    if (t > next) { if (line) { line.removeFromParent(); line.geometry.dispose(); } const x = R.r(area[0], area[1]), z = R.r(area[3], area[2]), pts = []; let px = x, py = top;
      while (py > -2) { pts.push(new T.Vector3(px, py, z)); py -= R.r(2, 6); px += R.r(-3, 3); } pts.push(new T.Vector3(px, -2, z));
      line = new T.Line(new T.BufferGeometry().setFromPoints(pts), bm); D.scene.add(line); life = .35; next = t + R.r(...every); flash.position.set(x, 30, z + 20); }
    life = Math.max(0, life - dt); const f = life > 0 ? (Math.sin(life * 60) > 0 ? 1 : .4) * life / .35 : 0; bm.opacity = f; flash.intensity = f * 400;
    // add only this bolt's own share of the screen flash and take it back as it fades, so nothing is left behind
    if (D.post) { const u = D.post.uniforms.flash, mine = f * .1; u.value = Math.max(0, u.value - given + mine); given = mine; } });
}
// a turning vortex in the sky (storm eye, curse swirl): a spiral painted on a disc that slowly rotates
export function vortex(D, x, y, z, r, color = '#d070ff', { speed = .08, opacity = .8 } = {}) {
  const c = cvs(512, 512, (g, W) => { g.translate(W / 2, W / 2); for (let a = 0; a < 26; a += .02) { const rr = a * 9; g.fillStyle = color; g.globalAlpha = Math.max(0, .09 - a * .003); g.beginPath(); g.arc(Math.cos(a) * rr, Math.sin(a) * rr, 6 + a * 1.2, 0, 7); g.fill(); } });
  const m = new T.Mesh(new T.CircleGeometry(r, 48), new T.MeshBasicMaterial({ map: ctex(c), transparent: true, opacity, blending: T.AdditiveBlending, depthWrite: false, fog: false })); m.position.set(x, y, z); D.scene.add(m);
  D.updaters.push(t => { m.rotation.z = t * speed; }); return m;
}
// paper / leaves / debris tumbling through the air
export function flurry(D, R, n, { area = [-14, 14, -2, -16], y0 = 0, y1 = 9, color = 0xf4f0e8, size = [.25, .45], speed = 1 } = {}) {
  const mat = new T.MeshStandardMaterial({ color, side: T.DoubleSide, roughness: .8 }), L = [];
  for (let i = 0; i < n; i++) { const s = R.r(...size), m = new T.Mesh(new T.PlaneGeometry(s, s * 1.3), mat); D.scene.add(m); L.push([m, R.r(area[0], area[1]), R.r(area[3], area[2]), R() * 20, R.r(.5, 1.2)]); }
  D.updaters.push(t => { for (const [m, x, z, ph, v] of L) { const u = ((t * .08 * v * speed + ph) % 1); m.position.set(x + Math.sin(t * .7 * v + ph) * 2, y1 - u * (y1 - y0), z + Math.cos(t * .5 + ph) * 1.5); m.rotation.set(t * v + ph, t * .7 * v, ph); } });
}
// fire: flickering additive flames standing on the ground
export function flames(D, R, spots, { color = 0xff6a20 } = {}) {
  const tex = ctex(cvs(64, 128, (g, W, H) => { const gr = g.createRadialGradient(32, 96, 2, 32, 80, 64); gr.addColorStop(0, 'rgba(255,250,200,1)'); gr.addColorStop(.35, 'rgba(255,170,60,.9)'); gr.addColorStop(1, 'rgba(255,60,0,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(32, 0); g.quadraticCurveTo(64, 70, 48, 128); g.lineTo(16, 128); g.quadraticCurveTo(0, 70, 32, 0); g.fill(); }));
  const L = []; for (const [x, z, s] of spots) for (let k = 0; k < 3; k++) { const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, color, blending: T.AdditiveBlending, transparent: true, depthWrite: false })); D.scene.add(sp); L.push([sp, x + R.r(-.4, .4) * s, z, s * R.r(.7, 1.2), R() * 6]); D.glow(x, .6 * s, z, 3 * s, color); }
  D.updaters.push(t => { for (const [sp, x, z, s, ph] of L) { const f = .85 + Math.sin(t * 11 + ph) * .1 + Math.sin(t * 23 + ph * 2) * .06; sp.scale.set(s * 1.1, s * 2.2 * f, 1); sp.position.set(x + Math.sin(t * 3 + ph) * .05, s * 1.05 * f, z); } });
  D.fireflies(spots.length * 10, spots[0][0], spots[0][1], 20, 10, { y0: .5, y1: 8, color: 0xffa040, size: 8 });
}
// a phase-2 restyle: retint fog, sky and moonlight, and optionally pulse the hemisphere light
export function restyle(D, { fog, bg, moon, moonI, amb, ambI, hemiSky, hemiGround } = {}) {
  if (fog != null) D.scene.fog.color.set(fog); if (bg != null) D.scene.background.set(bg);
  D.scene.traverse(o => { if (o.isDirectionalLight && moon != null) { o.color.set(moon); if (moonI != null) o.intensity = moonI; } if (o.isAmbientLight && amb != null) { o.color.set(amb); if (ambI != null) o.intensity = ambI; } if (o.isHemisphereLight) { if (hemiSky != null) o.color.set(hemiSky); if (hemiGround != null) o.groundColor.set(hemiGround); } });
}
