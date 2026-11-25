// Fox Shrine Stairs: a stone landing at the foot of a long flight of steps climbing a wooded hill at sunset. A tunnel of
// vermilion torii runs up the steps (and a second line of small gates winds off along the hillside), lit stone lanterns
// flank the stairs, two white fox guardians in red bibs sit on pedestals at the foot, autumn maples blaze red and orange
// on both slopes, a rope of paper streamers hangs across, and the shrine hall glows at the top.
import { T } from './diorama.js';
import { kit, rng, sky, pbr, stoneLantern, torii, pagoda, hills, scatter, decals, drift, dress, farPainting, IMG } from './kit.js';
// Built at real-world scale (1 unit = 1 m): the fight camera puts the marks 1.7 m apart and a fighter stands about 1.75 m tall.

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -1.8], [-4.4, -2], [1.6, -2.8]], sum: [-5.6, .8], exposure: 1.6 };

// the flagstones fade into the forest floor instead of ending on a hard line: a soft-edged alpha mask (sx/sz = fade share of each side)
function softEdge(mat, sx, sz) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const u = x / 255, v = y / 255, ex = Math.min(u, 1 - u) / sx, ey = Math.min(v, 1 - v) / sz, k = Math.max(0, Math.min(1, Math.min(ex, ey))), n = (Math.sin(x * .37) * Math.sin(y * .29) + Math.sin(x * .11 + y * .07)) * .08, a = Math.max(0, Math.min(1, k * k * (3 - 2 * k) + n * (1 - k) * 2)) * 255;
    const i = (y * 256 + x) * 4; d.data[i] = d.data[i + 1] = d.data[i + 2] = a; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); const t = new T.CanvasTexture(c); mat.alphaMap = t; mat.transparent = true; mat.depthWrite = false; mat.needsUpdate = true; }

export async function build(D) {
  const K = kit(D), { S, add, box } = K, R = rng(517);
  S.fog = new T.Fog(0x4a2a52, 26, 120); S.background = new T.Color(0x3a2048);
  // a low sunset sun from the left: long warm light raking across the steps
  D.moonlight({ color: 0xffb27a, intensity: 2.3, dir: [-.75, .55, -.25], ambient: 0x6a3a7a, ambientI: 2, sky: 0xc08ac8, ground: 0x4a2a30 });
  sky(D, [[0, '#2a1446'], [.45, '#6a2e6a'], [.75, '#c0566a'], [1, '#ffa064']], { stars: 20 });
  const M = { flag: pbr('rock_tile_floor', [5, 3], { color: 0xb8a8b0, rough: .5, metal: .05, ns: 1.3 }), step: pbr('castle_wall_slates', [2, .3], { color: 0xc0b4b0, ns: 1.2 }),
    curb: pbr('mossy_rock', [.6, .4], { color: 0xb8b4a8 }), rock: pbr('rock_face', [2, 2], { color: 0x7a6a70, ns: 1.6 }), moss: pbr('mossy_rock', [.5, .5], { color: 0xc8c4b8 }),
    gate: new T.MeshStandardMaterial({ color: 0xd8301e, roughness: .55, emissive: 0x3a0800, emissiveIntensity: .25 }), black: new T.MeshStandardMaterial({ color: 0x1a1214, roughness: .7 }),
    roof: pbr('roof_tiles_14', [3, 3], { color: 0x5a4a6a }), beam: pbr('japanese_cedar_planks', [.4, 1], { color: 0x9a3a2a, rough: .5 }),
    bark: pbr('japanese_cedar_bark', [1, 2], { color: 0x6a5050 }), ground: pbr('mud_forest', [18, 18], { color: 0x5a4a48 }),
    fox: new T.MeshStandardMaterial({ color: 0xf2eee8, roughness: .55 }), bib: new T.MeshStandardMaterial({ color: 0xc01a1a, roughness: .7, side: T.DoubleSide }),
    rope: new T.MeshStandardMaterial({ color: 0xd8c89a, roughness: .9 }), paper: new T.MeshStandardMaterial({ color: 0xfff8ee, emissive: 0xffd8a0, emissiveIntensity: .25, side: T.DoubleSide }) };
  const leafM = [0xd8341e, 0xff5a22, 0xff8a2a, 0xc01a3a, 0xe8602a].map(c => new T.MeshStandardMaterial({ color: c, roughness: .85, flatShading: true }));

  // ── the ground and the landing the fight happens on ──
  { const g = new T.Mesh(new T.PlaneGeometry(220, 160), M.ground); g.rotation.x = -Math.PI / 2; g.position.set(0, -.03, -40); g.receiveShadow = true; S.add(g);
    const f = new T.Mesh(new T.PlaneGeometry(17, 9), M.flag); f.rotation.x = -Math.PI / 2; f.position.set(0, .01, 0); f.receiveShadow = true; softEdge(f.material, .24, .3); f.renderOrder = -1; S.add(f); }
  // ── the stairs: a long flight straight up the hill behind the fighters, with mossy curbs and the hill rising either side ──
  const N = 30, SH = .17, SD = .36, W = 3.4, z0 = -2.6;   // real steps: 17 cm rise, 36 cm tread, 3.4 m wide
  for (let i = 0; i < N; i++) { box(W, SH * (i + 1), SD, M.step, 0, 0, z0 - i * SD); }
  for (const s of [-1, 1]) for (let i = 0; i < N; i += 2) box(.32, SH * (i + 1) + .3, SD * 2, M.curb, s * (W / 2 + .16), 0, z0 - i * SD - SD / 2);
  const topY = SH * N, topZ = z0 - N * SD;
  box(12, topY, 9, M.rock, 0, 0, topZ - 4.5);   // the hilltop the shrine stands on
  for (const s of [-1, 1]) for (let i = 0; i < 10; i++) { const d = add(new T.DodecahedronGeometry(R.r(.8, 1.8), 1), M.rock, s * R.r(3, 7), R.r(0, topY * .7) * (i / 10), z0 - R.r(1, N * SD + 1), { ry: R() * 6 }); d.scale.y = R.r(.6, 1.1); }
  hills(K, [[-7, -9, 5, 3.6], [7, -9, 5, 3.9], [-6.5, -15, 6.5, 5.6], [7, -15.5, 6.5, 5.9], [-13, -8, 6, 3], [13.5, -8.5, 6, 3.2]], M.rock);   // the wooded hill either side of the flight
  // ── the torii tunnel up the steps ──
  for (let i = 0; i < 6; i++) { const k = 1 + i * 5, y = SH * Math.min(N, Math.round(k)); torii(K, 0, z0 - k * SD, 4.3 - i * .08, M.gate, { y, dark: M.black, rope: null }); }   // torii ~4.3 m (the painted shimenawa hangs on the first one)
  // a second line of small gates winding off along the left slope, like the painting
  for (let i = 0; i < 9; i++) { const u = i / 8; torii(K, -4.2 - u * 5, -5.5 - u * 6.5, 2.6 - u * .5, M.gate, { y: 1.2 + u * 3, ry: .9 + u * .2, dark: M.black }); }
  // ── stone lanterns at the foot and up the flight ──
  stoneLantern(D, K, -2.5, -2.2, 1, { mat: M.moss }); stoneLantern(D, K, 2.5, -2.2, 1, { mat: M.moss });   // ~2.1 m tall
  for (let i = 7; i < N; i += 8) for (const s of [-1, 1]) stoneLantern(D, K, s * (W / 2 + .55), z0 - i * SD, .75, { mat: M.moss, y: SH * (i + 1) + .3, light: i < 16 });
  // ── the shrine hall at the top ──
  pagoda(K, D, 1.2, topZ - 3.6, { w: 6, d: 4.2, h: 2.8, tiers: 2, y: topY, roof: M.roof, beam: M.beam, sd: 6 });
  // ── the fox guardians: white kitsune on stone pedestals, red bibs, tails curled up ──
  const fox = (x, z, flip) => { const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = flip ? -.5 : .5; g.scale.setScalar(.62); S.add(g);   // pedestal ~.8 m, fox ~1 m
    const ped = new T.Mesh(new T.BoxGeometry(1.5, 1.3, 1.3), M.moss); ped.position.y = .65; ped.castShadow = ped.receiveShadow = true; g.add(ped);
    const cap = new T.Mesh(new T.BoxGeometry(1.7, .16, 1.5), M.moss); cap.position.y = 1.38; g.add(cap);
    const part = (geo, mat, px, py, pz, o = {}) => { const m = new T.Mesh(geo, mat); m.position.set(px, 1.46 + py, pz); if (o.s) m.scale.set(...o.s); if (o.r) m.rotation.set(...o.r); m.castShadow = true; g.add(m); return m; };
    part(new T.SphereGeometry(.42, 14, 10), M.fox, 0, .5, -.05, { s: [1, 1.25, .95] });            // seated body
    part(new T.SphereGeometry(.36, 14, 10), M.fox, 0, .25, .12, { s: [1.05, .7, 1.1] });           // haunches
    part(new T.CylinderGeometry(.16, .2, .55, 10), M.fox, 0, .98, .14, { r: [.35, 0, 0] });       // neck
    part(new T.SphereGeometry(.24, 14, 10), M.fox, 0, 1.28, .26, { s: [1, .95, 1.1] });            // head
    part(new T.ConeGeometry(.12, .36, 10), M.fox, 0, 1.22, .52, { r: [Math.PI / 2, 0, 0] });      // snout
    for (const sx of [-1, 1]) part(new T.ConeGeometry(.09, .32, 6), M.fox, sx * .13, 1.55, .2, { r: [-.15, 0, sx * -.2] });   // ears
    for (const sx of [-1, 1]) part(new T.CylinderGeometry(.07, .08, .62, 8), M.fox, sx * .16, .3, .34, { r: [-.1, 0, 0] });   // forelegs
    const tail = new T.CatmullRomCurve3([new T.Vector3(0, .15, -.4), new T.Vector3(0, .5, -.75), new T.Vector3(0, 1.05, -.62), new T.Vector3(0, 1.3, -.35)]);
    const t = new T.Mesh(new T.TubeGeometry(tail, 16, .17, 10), M.fox); t.position.y = 1.46; t.castShadow = true; g.add(t);
    part(new T.ConeGeometry(.42, .42, 14, 1, true), M.bib, 0, .72, .1, { r: [-.25, 0, 0] });        // red bib
    return g; };
  void fox;   // painted guardians instead of the blockout
  await D.prop(IMG('rg_kitsune'), -3.4, -2.3, 1.95, { flip: true, blobW: .3 }); await D.prop(IMG('rg_kitsune'), 3.4, -2.3, 1.95, { blobW: .3 });
  // ── autumn maples on both slopes and framing the foreground corners ──
  const maple = (x, y, z, s) => D.prop(IMG('rg_maple'), x, z, 5.6 * s, { y, flip: R() < .5, sway: .012, blob: false });
  for (const [x, y, z, sc] of [[-6.2, 0, -1.6, 1], [6.6, 0, -2.2, 1.05], [-5, 1.6, -6.5, .85], [5.2, 1.8, -7, .9], [-3.6, topY * .7, -10.5, .8], [4.2, topY * .75, -11, .8],
    [-10, 0, -4, 1.15], [10.5, 0, -4.5, 1.15], [-3.2, topY, -16.5, .9], [5.5, topY, -16, 1], [-8, .8, -8.5, .9], [8.6, 1, -9, .95]]) await maple(x, y, z, sc);
  // red spider lilies and red-orange bushes along both sides of the flight and at the landing's back corners
  for (let i = 0; i < 26; i++) { const sd = R() < .5 ? -1 : 1, z = R.r(-2.2, z0 - N * SD + 1), st = Math.max(0, Math.min(N - 1, Math.round((z0 - z) / SD))), y = z < z0 ? SH * (st + 1) * .82 : 0, x = sd * R.r(W / 2 + .5, 4.2);
    if (R() < .55) await D.prop(IMG('rg_mbush'), x, z, R.r(.7, 1.2), { y, flip: R() < .5, blob: false }); else await D.prop(IMG('rg_lily'), x, z, R.r(.45, .7), { y, flip: R() < .5, blob: false, sway: .02 }); }
  for (const [x, z] of [[-4.6, -1.4], [4.8, -1.6], [-5.6, .4], [5.8, .2]]) await D.prop(IMG('rg_mbush'), x, z, R.r(.8, 1.1), { flip: R() < .5, blob: false });
  // the shimenawa rope on the first gate and a few fallen-leaf drifts at the landing's edges
  await D.prop(IMG('rg_shimenawa'), 0, z0 - SD - .05, 1.15, { y: SH * 1 + 2.55, blob: false, shadow: false });
  for (const [x, z] of [[-4.2, 1.6], [3.9, 2.2], [-2.8, -1.6], [2.6, -1.4]]) await D.prop(IMG('rg_leaves'), x, z, R.r(.22, .3), { flip: R() < .5, blob: false, shadow: false });
  // ── a rope of paper streamers strung between the front maples, over the landing's back edge ──
  { const c = new T.CatmullRomCurve3([new T.Vector3(-6, 3.9, -1.8), new T.Vector3(-2.6, 3.3, -2.3), new T.Vector3(0, 3.5, -2.9), new T.Vector3(2.6, 3.3, -2.3), new T.Vector3(6.4, 4, -2)]);
    add(new T.TubeGeometry(c, 40, .025, 5), M.rope, 0, 0, 0, { cast: false });
    for (let i = 1; i < 14; i++) { const p = c.getPoint(i / 14), s = add(new T.PlaneGeometry(.2, .42), M.paper, p.x, p.y - .26, p.z, { cast: false }); D.updaters.push(t => { s.rotation.y = Math.sin(t * 1.1 + i) * .3; }); } }
  // ── far hills and the sunset haze ──
  hills(K, [[-60, -90, 40, 16], [-10, -110, 50, 22], [50, -95, 45, 18], [90, -120, 60, 26]], new T.MeshStandardMaterial({ color: 0x5a3a6a, roughness: 1 }));
  farPainting(D, 'shrine', { v0: 0, v1: .5, z: -70, yb: -4, h: 56, w: 200, tint: 0xf0e0f0 });   // the stage's own painting as the far backdrop
  D.glow(-40, 10, -66, 24, 0xff9a5a);
  // ── falling maple leaves and petals, floor dressing ──
  scatter(D, rng(61), { area: [-7, 7, -2, 3.8], leaves: 70, leaf: 0xd8401e, petals: 30, petal: 0xff8aa8, pebbles: 12 });
  decals(D, rng(612), { area: [-7, 7, -2, 3.8], list: [['moss', 3, [1.4, 2.6]], ['stain', 2, [1.2, 2]], ['crack', 2, [1, 1.8]]] });
  drift(D, 40, 0, -2, 9, 5, 0xff7a3a, { y0: .3, y1: 4.5, size: 5 });
  await dress(D, rng(733), { area: [-7, 7, -3, 3], lane: [-4.3, 4.3, -1.8, 1.4], front: 1.4, items: [['wooden_bucket_01', 1, [.55, .7]], ['rock_moss_set_01', 2, [.6, .9]]] });
}
