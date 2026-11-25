// Sunken Shrine: a mossy stone terrace at the edge of a flooded shrine precinct. Toppled stone torii and rows of
// drowned pillars stand in glowing water, the old hall waits at the top of its submerged steps under a blood moon,
// wisteria hangs over the left and blue spirit-flames drift on the water.
import { T } from './diorama.js';
import { kit, rng, sky, moon, pbr, stoneLantern, water, drift, pagoda, bannerTex, ctex, farPainting, groundFill, scatter, cityBlocks, walkers, clutter } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -1.8], [-4.4, -2.2], [1.6, -2.8]], sum: [-5.6, .8], exposure: 1.6 };

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(101);
  S.fog = new T.Fog(0x2a2a5a, 22, 120); S.background = new T.Color(0x1e1a44);
  D.moonlight({ color: 0xc8b8ff, intensity: 2, dir: [.5, 1, -.2], ambient: 0x4a4a8a, ambientI: 2, sky: 0x7a6ad0, ground: 0x1a4a4a });
  sky(D, [[0, '#120c30'], [.55, '#3a2468'], [1, '#5a3a7a']], { stars: 100 });
  moon(D, 30, 52, -140, 26, [240, 70, 60], [220, 40, 70]);
  const M = {
    floor: pbr('rock_tile_floor', [4, 2], { color: 0xa890c0, rough: .35, metal: .15, ns: 1.4 }),
    stone: pbr('castle_wall_slates', [.5, 2], { color: 0xb0a8b8 }), moss: pbr('mossy_rock', [1, 1], { color: 0xb8c0b0 }),
    rock: pbr('mossy_rock', [2, 2], { color: 0x8a8aa0, ns: 1.6 }),
    wood: pbr('weathered_planks', [.5, 1], { color: 0xb05050 }), roof: pbr('roof_tiles_14', [3, 3], { color: 0x9a9ab0 }),
    ban: new T.MeshStandardMaterial({ map: ctex(bannerTex({ field: ['#c0283a', '#8a1426'], trim: '#e0b060', tatter: true, sd: 21, emblem: (g, cx, cy) => { g.fillStyle = '#f0d8c8'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(cx + Math.cos(i * 2.1) * 30, cy + Math.sin(i * 2.1) * 30, 26, 40, i * 2.1, 0, 7); g.fill(); } } })), side: T.DoubleSide, alphaTest: .4 }),
    pad: new T.MeshStandardMaterial({ color: 0x2a6a3a, roughness: .6, side: T.DoubleSide }), lotus: new T.MeshStandardMaterial({ color: 0xff80d0, emissive: 0xc03090, emissiveIntensity: .8 }),
    pine: new T.MeshStandardMaterial({ color: 0x2a3450, roughness: 1 }),
  };
  // ── the terrace they fight on, broken slabs stepping down into the water ──
  box(30, 1.2, 9, M.floor, 0, -1.2, 1.6);
  for (let i = 0; i < 9; i++) { const x = R.r(-13, 13), z = R.r(-3.4, -5.5); const b = box(R.r(1.2, 2.6), .5, R.r(.8, 1.4), M.floor, x, -.65, z, { ry: R.r(-.3, .3) }); b.rotation.z = R.r(-.1, .1); }
  const w = water(D, 0, -40, 200, 76, 0x1a4a6a, { y: -.5, sky: ['#5a3a8a', '#1a4a6a'], rings: 14 }); w.material.emissive = new T.Color(0x0a4a5a); w.material.emissiveIntensity = .22;

  // ── ruined stone torii: one leaning left, one standing right, a fallen lintel between ──
  const stoneGate = (x, z, h, tilt, ry) => { const g = new T.Group(); g.position.set(x, -.5, z); g.rotation.set(0, ry, tilt); S.add(g); const wd = h * .8;
    for (const s of [-1, 1]) K.add(new T.BoxGeometry(.8, h, .8), M.stone, s * wd / 2, h / 2, 0, { to: g });
    K.add(new T.BoxGeometry(wd + 2.2, .7, 1), M.moss, 0, h + .35, 0, { to: g }); K.add(new T.BoxGeometry(wd + .6, .5, .7), M.stone, 0, h * .78, 0, { to: g }); return g; };
  stoneGate(-9.5, -9, 8, .1, .3); stoneGate(11, -8, 7, -.03, -.25);
  { const b = box(.8, .8, 9, M.stone, -2.5, -.6, -12, { ry: 1.2 }); b.rotation.z = .35; const c = box(.9, .7, 7, M.moss, 5.5, -.8, -11, { ry: -1.4 }); c.rotation.x = .3; }
  // drowned pillars in rows, receding
  for (let i = 0; i < 30; i++) { const x = (R() < .5 ? -1 : 1) * R.r(6, 22), z = R.r(-12, -40), h = R.r(2, 4.5); box(.9, h, .9, M.stone, x, -.5, z, { ry: R.r(-.2, .2) }); box(1.2, .3, 1.2, M.moss, x, h - .5, z); }
  for (let i = 0; i < 12; i++) { const b = add(new T.DodecahedronGeometry(R.r(.6, 1.4), 0), M.rock, R.r(-10, 10), -.4, R.r(-5, -14), { ry: R() * 6 }); b.scale.y = .5; }

  // ── the hall on its sunken steps ──
  for (let i = 0; i < 6; i++) box(10 - i * .4, .4, 1, M.stone, 1, -.6 + i * .35, -16 - i * .9);
  box(12, 2, 8, M.stone, 1, 0, -24);
  pagoda(K, D, 1, -24, { w: 10, d: 6.4, h: 4.4, tiers: 2, y: 2, roof: M.roof, beam: M.wood, sd: 4 });
  for (const s of [-1, 1]) { const b = new T.Mesh(new T.PlaneGeometry(1.4, 3), M.ban); b.position.set(1 + s * 3, 4.4, -20.7); S.add(b); }
  D.glow(1, 3.4, -20.5, 3, 0x40f0e0); D.lantern(1, 3.4, -19, { color: 0x40e0e0, intensity: 16, distance: 12, glow: 0 });
  // moss and vines draping the eaves
  for (let i = 0; i < 18; i++) { const x = 1 + R.r(-5.5, 5.5), l = R.r(.6, 2.2); add(new T.CylinderGeometry(.04, .02, l, 4), M.moss, x, 7.6 - l / 2, -20.6, { cast: false }); }

  // ── stone lanterns on mossy rocks at the front corners ──
  for (const [x, z] of [[-11.5, 1.4], [11.8, 1.2]]) { const r = add(new T.DodecahedronGeometry(1.6, 1), M.rock, x, -.4, z); r.scale.set(1.2, .7, 1); stoneLantern(D, K, x, z, 1.2, { mat: M.moss, y: .6 }); }

  // ── water life: lily pads, glowing lotus, spirit flames ──
  for (let i = 0; i < 30; i++) { const x = R.r(-14, 14), z = R.r(-4.5, -20); add(new T.CircleGeometry(R.r(.35, .8), 14, .3, 5.9), M.pad, x, -.48, z, { rx: -Math.PI / 2, cast: false });
    if (R() < .3) { add(new T.ConeGeometry(.24, .32, 7, 1, true), M.lotus, x, -.3, z, { rx: Math.PI, cast: false }); D.glow(x, -.2, z, .8, 0xff70d0); } }
  for (const [x, z] of [[-7, -6], [-2, -9], [4, -7], [8.5, -12], [-5, -16], [10, -4.5], [-11, -3.8]]) { D.glow(x, .3, z, 1.3, 0x40f0e0); D.glow(x, .7, z, .7, 0xb0fff8); }
  drift(D, 50, 0, -10, 14, 8, 0x60fff0, { y0: -.2, y1: 3, size: 20 }); drift(D, 40, 0, -2, 14, 4, 0xff80d0, { y0: 0, y1: 4, size: 8 });

  // ── wisteria over the left, bamboo on the right, a dark forest behind ──
  for (let i = 0; i < 6; i++) await prop('sakura', R.r(-17, -11), R.r(-1, 3), R.r(7, 10), { y: 1, tint: 0xc070ff, flip: R() < .5, sway: .01, blob: false });
  for (let i = 0; i < 8; i++) await prop(R() < .5 ? 'bamboo3' : 'rfg_bamboo', R.r(13, 17), R.r(-1, 4), R.r(9, 12), { y: -.4, tint: 0xd8e090, sway: .012, blobW: .2 });
  for (let i = 0; i < 50; i++) { const x = R.r(-70, 70), z = R.r(-44, -70), h = R.r(12, 24); add(new T.ConeGeometry(h * .26, h, 7), M.pine, x, h / 2 - .5, z, { cast: false }); }
  D.petals(60, -6, -2, 10, { color: 0xd890ff });

  // ── detail wave 2: painted far backdrop, ground to the horizon, near scatter ──
  const R2 = rng(287);
  farPainting(D, 'sunken', { v1: .5, z: -145 });
  scatter(D, R2, { area: [-14, 14, -3, 6], puddles: 7, petals: 160, petal: 0xd090ff, tufts: 50, tuft: 0x5a8a3a, pebbles: 60, stone: 0x6a6080 });
  // background life and mid-ground clutter
  await clutter(D, K, R2, 'shrine', { area: [-16, 16, -5, -16], n: 16, clear: 4, y: -.5 });
}
