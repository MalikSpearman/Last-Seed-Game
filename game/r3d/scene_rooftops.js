// Rooftop Terrace: a wooden balcony high over the capital at night. A lantern-lit rail, a pavilion with a laurel banner
// under cherry blossom, and below, a sea of lit pagoda roofs and pink trees rolling up to the tournament colosseum.
import { T } from './diorama.js';
import { kit, rng, sky, moon, pbr, shojiMat, pagoda, bannerTex, ctex, cvs, drift, farPainting, groundFill, scatter, cityBlocks, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -1.6], [-4.4, -1.8], [1.6, -2.4]], sum: [-5.6, .8], exposure: 1.7 };

const laurel = (g, cx, cy) => { g.strokeStyle = '#f0c766'; g.fillStyle = '#f0c766'; g.lineWidth = 6;
  for (const s of [-1, 1]) { g.beginPath(); g.arc(cx, cy, 64, Math.PI / 2 + s * .15, Math.PI / 2 + s * 2.9, s < 0); g.stroke();
    for (let k = 0; k < 7; k++) { const a = Math.PI / 2 + s * (.45 + k * .37); g.save(); g.translate(cx + Math.cos(a) * 64, cy + Math.sin(a) * 64); g.rotate(a + s * .9); g.beginPath(); g.ellipse(0, 0, 16, 6, 0, 0, 7); g.fill(); g.restore(); } } };
const arches = glow => cvs(512, 256, (g, W, H) => { g.fillStyle = glow ? '#000' : '#5a4a60'; g.fillRect(0, 0, W, H);
  for (const [y0, h] of [[30, 96], [150, 86]]) for (let x = 8; x < W; x += 64) { g.fillStyle = glow ? '#ffbe6a' : '#ffcf80'; g.beginPath(); g.moveTo(x + 8, y0 + h); g.lineTo(x + 8, y0 + 22); g.arc(x + 32, y0 + 22, 24, Math.PI, 0); g.lineTo(x + 56, y0 + h); g.fill();
    if (!glow && (x / 64 | 0) % 2) { g.fillStyle = '#a0202e'; g.fillRect(x + 14, y0 + 30, 36, h - 34); } } });

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(151);
  S.fog = new T.Fog(0x3a2e6a, 30, 170); S.background = new T.Color(0x201a48);
  D.moonlight({ color: 0xd0c8ff, intensity: 2.2, dir: [.4, 1, -.3], ambient: 0x5a5098, ambientI: 2.1, sky: 0x9080e0, ground: 0x4a3040 });
  sky(D, [[0, '#0e0c30'], [.55, '#2c2260'], [1, '#5a3a80']], { stars: 220 });
  moon(D, 30, 46, -140, 22);
  const M = {
    deck: pbr('weathered_planks', [6, 2], { color: 0xd0b0b8, rough: .35, metal: .1, ns: 1.3 }),
    wood: pbr('japanese_cedar_planks', [.4, 1], { color: 0x8a5a4a }), dark: pbr('weathered_planks', [.4, 1], { color: 0x7a5a5a }),
    roof: pbr('roof_tiles_14', [3, 3], { color: 0x8a88b0 }), roofC: pbr('grey_roof_tiles', [2, 2], { color: 0x6a68a0 }),
    stone: pbr('castle_wall_slates', [6, 1], { color: 0x9a90b0 }), lamp: new T.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffa040, emissiveIntensity: 2.2 }),
    ban: new T.MeshStandardMaterial({ map: ctex(bannerTex({ field: ['#8c1424', '#6a0e1e'], trim: '#e3b552', emblem: laurel, sd: 41 })), side: T.DoubleSide, alphaTest: .4 }),
    hill: new T.MeshStandardMaterial({ color: 0x3a3060, roughness: 1 }), gold: new T.MeshStandardMaterial({ color: 0xd9a441, metalness: .6, roughness: .35 }),
  };
  // ── the balcony: deck on beams, a rail with lantern boxes on the posts ──
  box(30, .4, 9, M.deck, 0, -.4, 1.4); box(30, 2, .5, M.dark, 0, -2.4, -3.1);
  const rx = [-13.5, -9, -4.5, 0, 4.5, 9, 13.5];
  for (const x of rx) { box(.5, 1.4, .5, M.wood, x, 0, -3.1); box(.62, .14, .62, M.dark, x, 1.4, -3.1); }
  for (const y of [1.1, .45]) box(27.5, .12, .14, M.wood, 0, y, -3.1, { cast: false });
  for (let x = -13; x < 13.5; x += .75) if (!rx.some(r => Math.abs(r - x) < .3)) box(.08, .6, .08, M.wood, x, .45, -3.1, { cast: false });
  for (const s of [-1, 1]) for (let z = -3; z < 5; z += 1.6) box(.4, 1.3, .4, M.wood, s * 14.8, 0, z);
  const lantern = (x, z, y = 0, s = 1) => { box(.7 * s, .9 * s, .7 * s, M.lamp, x, y, z, { cast: false }); for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(.08, .95 * s, .08, M.dark, x + dx * .35 * s, y, z + dz * .35 * s, { cast: false });
    box(.86 * s, .1, .86 * s, M.dark, x, y + .9 * s, z); D.lantern(x, y + .5 * s, z + .2, { intensity: 14, distance: 9, glow: 1.2 * s }); };
  lantern(-3.4, -2.6, 1.54, .8); lantern(4.6, -2.6, 1.54, .8); lantern(-11.4, 1.6, 0, 1.1); lantern(11.6, 2.8, 0, 1.2);
  // ── the pavilion on the left: posts, beams, a swept roof, its banner and lantern ──
  { const px = -12.2, pz = -1; for (const [dx, dz] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) box(.36, 5, .36, M.wood, px + dx, 0, pz + dz);
    box(4.8, .3, 4.8, M.dark, px, 5, pz); const r = add(new T.ConeGeometry(4.4, 1.6, 4), M.roof, px, 6.1, pz, { ry: Math.PI / 4 }); r.scale.set(1.15, 1, 1.15);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) add(new T.ConeGeometry(.2, .9, 4), M.gold, px + dx * 3.5, 5.5, pz + dz * 3.5, { rz: dx * .6, rx: -dz * .6 });
    const b = new T.Mesh(new T.PlaneGeometry(1.5, 3.6, 1, 6), M.ban); b.geometry.translate(0, -1.8, 0); b.position.set(px + 2.2, 4.8, pz + 2.1); b.castShadow = true; S.add(b); D.updaters.push(t => { b.rotation.y = Math.sin(t * .8) * .12; });
    box(.5, .6, .5, M.lamp, px + .2, 4.2, pz + 2, { cast: false }); D.lantern(px + .2, 4.4, pz + 2.2, { intensity: 12, distance: 9, glow: 1 });
    for (let i = 0; i < 5; i++) await prop('sakura', px + R.r(-4, 1), pz + R.r(-3, 1), R.r(6, 8), { y: R.r(2, 4), flip: R() < .5, sway: .01, blob: false }); }
  // a neighbouring roof on the right edge, close by
  pagoda(K, D, 18, -6, { w: 7, d: 8, h: 3, tiers: 1, y: -3, roof: M.roof, beam: M.wood, sd: 3 });

  // ── the city below: rows of lit halls and pagodas, cherry trees between, rising toward the colosseum hill ──
  const base = -14;
  { const g = new T.Mesh(new T.PlaneGeometry(260, 200), new T.MeshStandardMaterial({ color: 0x2a2048, roughness: 1 })); g.rotation.x = -Math.PI / 2; g.position.set(0, base, -90); S.add(g); }
  for (let i = 0; i < 55; i++) { const z = R.r(-14, -95), x = R.r(-70, 70) * (1 + (-z) / 120), up = Math.max(0, (-z - 40) * .12 * (x > 10 ? 1.6 : 1)), w = R.r(4, 9);
    pagoda(K, D, x, z, { w, d: w * R.r(.7, 1), h: R.r(2.4, 4), tiers: R() < .3 ? 3 : R() < .6 ? 2 : 1, y: base + up, roof: R() < .5 ? M.roof : M.roofC, sd: i * 3 + 1, lamp: i % 6 === 0 }); }
  for (let i = 0; i < 70; i++) { const z = R.r(-12, -80), x = R.r(-60, 60) * (1 + (-z) / 120), up = Math.max(0, (-z - 40) * .12 * (x > 10 ? 1.6 : 1));
    await prop('sakura', x, z, R.r(5, 9), { y: base + up, flip: R() < .5, blob: false, shadow: false }); }
  for (let i = 0; i < 40; i++) D.glow(R.r(-60, 60), base + R.r(.5, 6), R.r(-14, -80), R.r(1.4, 3), 0xffb060);
  // ── the colosseum on its hill, searchlights fanning up ──
  { const cx = 42, cz = -110, cy = base + 14, r = 22; const hill = add(new T.SphereGeometry(1, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.hill, cx, base, cz, { cast: false }); hill.scale.set(48, 15, 30);
    const wall = new T.Mesh(new T.CylinderGeometry(r, r, 12, 48, 1, true), new T.MeshStandardMaterial({ map: ctex(arches(false), [10, 1]), emissiveMap: ctex(arches(true), [10, 1]), emissive: 0xffa040, emissiveIntensity: 1.2 })); wall.position.set(cx, cy + 6, cz); S.add(wall);
    add(new T.CylinderGeometry(r + .5, r + .5, 1, 48, 1, true), M.stone, cx, cy + 12.4, cz, { cast: false });
    const beamM = new T.MeshBasicMaterial({ color: 0xffd68a, transparent: true, opacity: .08, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false });
    for (let i = 0; i < 8; i++) { const b = new T.Mesh(new T.ConeGeometry(3, 70, 12, 1, true), beamM); const a = -.6 + i * .17; b.position.set(cx + Math.sin(a) * 18, cy + 40, cz); b.rotation.z = -a; S.add(b); D.updaters.push(t => { b.rotation.z = -a + Math.sin(t * .3 + i) * .06; }); }
    D.glow(cx, cy + 8, cz + r, 30, 0xffa050); }
  for (let i = 0; i < 6; i++) { const h = R.r(12, 22); add(new T.ConeGeometry(R.r(20, 34), h, 5), M.hill, R.r(-120, 60), base + h / 2 - 2, R.r(-130, -160), { cast: false }); }
  D.petals(140, 0, -2, 14); drift(D, 60, 0, -30, 50, 30, 0xffc070, { y0: base + 2, y1: base + 12, size: 8 });

  // ── detail wave 2: painted far backdrop, ground to the horizon, near scatter ──
  const R2 = rng(143);
  farPainting(D, 'rooftops', { v1: .48, z: -144, yb: -14 });
  scatter(D, R2, { area: [-14, 14, -3, 6], puddles: 4, petals: 360 });
  decals(D, rng(824), { area: [-14, 14, -3, 6], list: [['stain', 3, [1.2, 2.2]], ['moss', 2, [1.4, 2.4]]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  await dress(D, rng(1263), { area: [-16, 16, -9, 4], items: [['wooden_stool_01', 2, [.5, .6]], ['wine_barrel_01', 1, [1, 1.2]], ['chinese_stool', 2, [.6, .7]]] });   // real CC0 models placed where they fit (kit.dress)
}
