// Fox Shrine Stairs: a stone landing at the foot of a long flight of steps climbing a wooded hill at sunset. A tunnel of
// vermilion torii runs up the steps (and a second line of small gates winds off along the hillside), lit stone lanterns
// flank the stairs, two white fox guardians in red bibs sit on pedestals at the foot, autumn maples blaze red and orange
// on both slopes, a rope of paper streamers hangs across, and the shrine hall glows at the top.
import { T } from './diorama.js';
import { kit, rng, sky, pbr, stoneLantern, torii, pagoda, hills, scatter, decals, drift, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -1.8], [-4.4, -2], [1.6, -2.8]], sum: [-5.6, .8], exposure: 1.6 };

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
    const f = new T.Mesh(new T.PlaneGeometry(26, 11), M.flag); f.rotation.x = -Math.PI / 2; f.position.set(0, .01, 1); f.receiveShadow = true; S.add(f); }
  // ── the stairs: a long flight straight up the hill behind the fighters, with mossy curbs and the hill rising either side ──
  const N = 18, SH = .34, SD = .8, W = 6.4, z0 = -4.6;
  for (let i = 0; i < N; i++) { box(W, SH * (i + 1), SD, M.step, 0, 0, z0 - i * SD); }
  for (const s of [-1, 1]) for (let i = 0; i < N; i += 2) box(.6, SH * (i + 1) + .45, SD * 2, M.curb, s * (W / 2 + .3), 0, z0 - i * SD - SD / 2);
  const topY = SH * N, topZ = z0 - N * SD;
  box(16, topY, 12, M.rock, 0, 0, topZ - 6);   // the hilltop the shrine stands on
  for (const s of [-1, 1]) for (let i = 0; i < 10; i++) { const d = add(new T.DodecahedronGeometry(R.r(1.6, 3.4), 1), M.rock, s * R.r(5.8, 11), R.r(0, topY * .7) * (i / 10), z0 - R.r(1, N * SD + 2), { ry: R() * 6 }); d.scale.y = R.r(.6, 1.1); }
  hills(K, [[-11.5, -15, 8, 6.5], [11.5, -15, 8, 7], [-9.5, -23, 10, 9], [10.5, -24, 10, 9.5], [-20, -12, 9, 5], [21, -13, 9, 5.5]], M.rock);   // the wooded hill either side of the flight
  // ── the torii tunnel up the steps ──
  for (let i = 0; i < 5; i++) { const k = 1 + i * 3.6, y = SH * Math.min(N, Math.round(k)); torii(K, 0, z0 - k * SD, 6.2 - i * .15, M.gate, { y, dark: M.black, rope: i === 0 ? M.rope : null }); }
  // a second line of small gates winding off along the left slope, like the painting
  for (let i = 0; i < 9; i++) { const u = i / 8; torii(K, -7 - u * 9, -9 - u * 10, 3.6 - u * .9, M.gate, { y: 2 + u * 4.5, ry: .9 + u * .2, dark: M.black }); }
  // ── stone lanterns at the foot and up the flight ──
  stoneLantern(D, K, -4.4, -3.6, 1.7, { mat: M.moss }); stoneLantern(D, K, 4.4, -3.6, 1.7, { mat: M.moss });
  for (let i = 4; i < N; i += 5) for (const s of [-1, 1]) stoneLantern(D, K, s * (W / 2 + .9), z0 - i * SD, 1.1, { mat: M.moss, y: SH * (i + 1) + .4, light: i < 10 });
  // ── the shrine hall at the top ──
  pagoda(K, D, 2.4, topZ - 5, { w: 8, d: 5.4, h: 3.2, tiers: 2, y: topY, roof: M.roof, beam: M.beam, sd: 6 });
  // ── the fox guardians: white kitsune on stone pedestals, red bibs, tails curled up ──
  const fox = (x, z, flip) => { const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = flip ? -.5 : .5; S.add(g);
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
  fox(-5.8, -3.2, false); fox(5.8, -3.2, true);
  // ── autumn maples on both slopes and framing the foreground corners ──
  const maple = (x, y, z, s) => { const tr = add(new T.CylinderGeometry(.18 * s, .32 * s, 4.2 * s, 8), M.bark, x, y + 2.1 * s, z);
    for (const [dx, rz] of [[-.9, .7], [.9, -.6], [.2, .1]]) add(new T.CylinderGeometry(.06 * s, .13 * s, 2.2 * s, 6), M.bark, x + dx * s * .6, y + 4 * s, z, { rz });
    for (let k = 0; k < 9; k++) { const m = add(new T.IcosahedronGeometry(1, 0), leafM[(R() * leafM.length) | 0], x + R.r(-2, 2) * s, y + R.r(3.8, 6) * s, z + R.r(-1.2, 1.2) * s, { cast: true }); m.scale.set(R.r(1, 1.7) * s, R.r(.6, .95) * s, R.r(.9, 1.4) * s); m.rotation.set(R() * 3, R() * 3, R() * 3); } };
  maple(-11, 0, -2, 1.25); maple(12, 0, -3, 1.3); maple(-8.6, 2, -9, 1); maple(8.8, 2.2, -10, 1.05); maple(-6, topY * .7, -16, .9); maple(7, topY * .75, -17, .95);
  maple(-17, 0, -6, 1.4); maple(18, 0, -7, 1.4); maple(-4.2, topY, -25, 1.1); maple(9, topY, -24, 1.2);
  // red spider lilies and low red shrubs along the curbs
  for (let i = 0; i < 70; i++) { const s = R() < .5 ? -1 : 1, x = s * R.r(W / 2 + .8, 6.4), z = R.r(-3, z0 - N * SD + 2), stepI = Math.max(0, Math.min(N - 1, Math.round((z0 - z) / SD))), y = z < z0 ? SH * (stepI + 1) * .8 : 0;
    const b = add(new T.IcosahedronGeometry(.28, 0), leafM[(R() * 3) | 0], x, y + .2, z, { cast: false }); b.scale.set(R.r(.8, 1.6), R.r(.5, .9), R.r(.8, 1.4)); }
  // ── a rope of paper streamers strung between the front maples, over the landing's back edge ──
  { const c = new T.CatmullRomCurve3([new T.Vector3(-10, 6.2, -2.4), new T.Vector3(-4, 5.2, -3.2), new T.Vector3(0, 5.6, -4.2), new T.Vector3(4, 5.2, -3.2), new T.Vector3(10.5, 6.4, -2.6)]);
    add(new T.TubeGeometry(c, 40, .04, 5), M.rope, 0, 0, 0, { cast: false });
    for (let i = 1; i < 14; i++) { const p = c.getPoint(i / 14), s = add(new T.PlaneGeometry(.32, .7), M.paper, p.x, p.y - .42, p.z, { cast: false }); D.updaters.push(t => { s.rotation.y = Math.sin(t * 1.1 + i) * .3; }); } }
  // ── far hills and the sunset haze ──
  hills(K, [[-60, -90, 40, 16], [-10, -110, 50, 22], [50, -95, 45, 18], [90, -120, 60, 26]], new T.MeshStandardMaterial({ color: 0x5a3a6a, roughness: 1 }));
  D.glow(-60, 14, -130, 40, 0xff9a5a);
  // ── falling maple leaves and petals, floor dressing ──
  scatter(D, rng(61), { area: [-13, 13, -3, 5.4], leaves: 70, leaf: 0xd8401e, petals: 30, petal: 0xff8aa8, pebbles: 12 });
  decals(D, rng(612), { area: [-13, 13, -3, 5.4], list: [['moss', 3, [1.4, 2.6]], ['stain', 2, [1.2, 2]], ['crack', 2, [1, 1.8]]] });
  drift(D, 50, 0, -2, 16, 8, 0xff7a3a, { y0: .5, y1: 8, size: 6 });
  await dress(D, rng(733), { area: [-14, 14, -6, 4], items: [['wooden_bucket_01', 1, [.55, .7]], ['rock_moss_set_01', 2, [.6, .9]]] });
}
