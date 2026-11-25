// Pirate Harbor: the end of a rain-dark wharf. Rope-slung bollards along the edge, crates and barrels under a skull flag,
// a stilt-town of lit warehouses running out along the pier, a cliff temple above, and a red-sailed junk at anchor
// under a blood moon.
import { T } from './diorama.js';
import { kit, rng, ctex, cvs, sky, moon, planks, rough, bannerTex, rail, ship, water, drift, pbr } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.2, -1.8], [-4.6, -2], [1.4, -2.8]], sum: [-5.6, .8] };

const jolly = (g, cx, cy) => { g.fillStyle = '#f0e8dc'; g.beginPath(); g.ellipse(cx, cy - 20, 50, 54, 0, 0, 7); g.fill(); g.fillRect(cx - 28, cy + 20, 56, 30);
  g.fillStyle = '#7a1420'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 20, cy - 16, 13, 15, 0, 0, 7); g.fill(); } g.fillRect(cx - 14, cy + 30, 4, 18); g.fillRect(cx - 2, cy + 30, 4, 18); g.fillRect(cx + 10, cy + 30, 4, 18);
  g.strokeStyle = '#f0e8dc'; g.lineWidth = 12; g.lineCap = 'round'; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx - s * 80, cy + 120); g.quadraticCurveTo(cx, cy + 50, cx + s * 86, cy + 70); g.stroke(); } };
const crateT = sd => { const R = rng(sd); return cvs(256, 256, (g, W, H) => { g.fillStyle = '#6a4a2e'; g.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 42) { g.fillStyle = `hsl(28,${R.r(28, 38)}%,${R.r(26, 34)}%)`; g.fillRect(0, y + 2, W, 38); }
  g.strokeStyle = '#3a2616'; g.lineWidth = 22; g.strokeRect(11, 11, W - 22, H - 22); g.beginPath(); g.moveTo(16, 16); g.lineTo(W - 16, H - 16); g.stroke(); g.fillStyle = '#9a9aa0'; for (const [x, y] of [[14, 14], [W - 14, 14], [14, H - 14], [W - 14, H - 14]]) { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); } }); };
const netT = () => cvs(256, 256, (g, W, H) => { g.clearRect(0, 0, W, H); g.strokeStyle = '#d8c8a0'; g.lineWidth = 3; for (let i = -W; i < W * 2; i += 22) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + H, H); g.stroke(); g.beginPath(); g.moveTo(i, 0); g.lineTo(i - H, H); g.stroke(); } });
const shojiT = (sd, glow) => { const R = rng(sd); return cvs(256, 128, (g, W, H) => { g.fillStyle = glow ? '#000' : '#3a2418'; g.fillRect(0, 0, W, H);
  for (let x = 6; x < W; x += 50) { const on = R() < .8; g.fillStyle = glow ? (on ? '#ffb060' : '#000') : on ? '#ffd090' : '#2a1810'; g.fillRect(x, 20, 40, 80); g.fillStyle = glow ? '#000' : '#3a2418'; g.fillRect(x + 19, 20, 3, 80); g.fillRect(x, 58, 40, 3); } }); };

export async function build(D) {
  const K = kit(D), { S, add, box } = K, R = rng(73);
  S.fog = new T.Fog(0x2a1438, 24, 130); S.background = new T.Color(0x1c0e2c);
  D.moonlight({ color: 0xffa0a8, intensity: 2, dir: [.6, 1, -.3], ambient: 0x5a3068, ambientI: 2, sky: 0x9a5aa8, ground: 0x3a2028 });
  sky(D, [[0, '#140a24'], [.5, '#3a1648'], [1, '#7a2a4a']], { stars: 80 });
  moon(D, 40, 50, -140, 30, [240, 80, 70], [220, 40, 70]);

  const M = {
    deck: pbr('weathered_planks', [6, 2], { color: 0xd0b0b8, rough: .38, metal: .1, ns: 1.3 }),
    walk: pbr('worn_planks', [1, 4], { color: 0xb8a0a0, rough: .6 }),
    wood: pbr('japanese_cedar_planks', [.4, 1], { color: 0x8a6050 }), old: pbr('weathered_planks', [.4, 1], { color: 0x8a6a6a }),
    roof: pbr('roof_tiles_14', [3, 3], { color: 0x8a80a0 }), rope: new T.MeshStandardMaterial({ color: 0xb89a60, roughness: 1 }),
    iron: pbr('rusty_metal_02', [1, 1], { color: 0x5a5058, metal: .6, rough: .7 }), cliff: pbr('rock_face', [4, 4], { color: 0x5a4a68, ns: 2 }),
    flag: new T.MeshStandardMaterial({ map: ctex(bannerTex({ field: ['#a01a28', '#7a1020'], trim: '#5a0a14', emblem: jolly, tatter: true, sd: 4 })), side: T.DoubleSide, alphaTest: .4, roughness: .9 }),
    pen: new T.MeshStandardMaterial({ color: 0xc01a2a, side: T.DoubleSide, roughness: .8 }),
    net: new T.MeshStandardMaterial({ map: ctex(netT()), transparent: true, alphaTest: .3, side: T.DoubleSide }),
    lamp: new T.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xffa040, emissiveIntensity: 2, roughness: .6 }),
  };
  water(D, 0, -50, 260, 100, 0x120a24, { y: -.8 });

  // ── the wharf: wet planks on piles, rope-slung bollards along the water edge ──
  box(34, .4, 10, M.deck, 0, -.4, 1.2);
  for (let x = -16; x <= 16; x += 2.4) for (const z of [-3.6, 5.8]) box(.5, 1.4, .5, M.old, x, -1.8, z);
  const bol = []; for (let x = -9.6; x <= 9.6; x += 3.2) { box(.55, 1.15, .55, M.old, x, 0, -3.4); add(new T.TorusGeometry(.3, .07, 6, 14), M.rope, x, .95, -3.4, { rx: Math.PI / 2 }); bol.push(x); }
  for (let i = 0; i < bol.length - 1; i++) { const a = new T.Vector3(bol[i], .95, -3.4), b = new T.Vector3(bol[i + 1], .95, -3.4), m = a.clone().lerp(b, .5); m.y -= .4;
    add(new T.TubeGeometry(new T.QuadraticBezierCurve3(a, m, b), 16, .05, 5), M.rope, 0, 0, 0); }
  for (const x of [-12, -7.8, -4.6, 4.6, 7.8, 12]) box(.4, .35, .4, M.old, x + .8, 0, -3.1);
  // a rail with a cross brace at the right corner
  rail(K, [[11.2, -3.4], [16, -3.4]], { h: 1.2, step: 2.4, mat: M.wood, post: .34, rails: [.95, .5] }); box(3.2, .14, .14, M.wood, 13.6, .5, -3.4, { rz: .3 });
  // rope coil at the near left
  for (let i = 0; i < 4; i++) add(new T.TorusGeometry(.9 - i * .14, .1, 6, 20), M.rope, -8.6, .1 + i * .08, 3.4, { rx: Math.PI / 2 });

  // ── cargo: crates and barrels stacked on the left, a cargo net strung from the flag gallows ──
  const crate = (x, y, z, s, ry = 0) => box(s, s, s, new T.MeshStandardMaterial({ map: ctex(crateT(x * 10 + z | 0)), roughness: .85 }), x, y, z, { ry });
  crate(-12.6, 0, -1.4, 1.6, .1); crate(-11, 0, -2.4, 1.3, -.2); crate(-12.4, 1.6, -1.6, 1.2, .3); crate(-10.6, 0, -.2, 1.1, .5); crate(6.2, 0, -2.6, .9, .3);
  const barrel = (x, z, h = 1.7) => { add(new T.CylinderGeometry(.6, .6, h, 16), M.wood, x, h / 2, z); add(new T.SphereGeometry(.68, 16, 8), M.wood, x, h / 2, z).scale.set(1, h * .5, 1);
    for (const y of [.25, h - .25]) add(new T.TorusGeometry(.66, .04, 6, 20), M.iron, x, y, z, { rx: Math.PI / 2 }); };
  barrel(-14.2, .6); barrel(-13.2, 2.2, 1.4);
  { box(.3, 7, .3, M.old, -10.8, 0, -3.6); box(3.2, .3, .3, M.old, -9.4, 6.4, -3.6); add(new T.TorusGeometry(.2, .05, 6, 10), M.rope, -10.8, 6.1, -3.6, {});
    const f = new T.Mesh(new T.PlaneGeometry(1.6, 3.6, 1, 6), M.flag); f.geometry.translate(0, -1.8, 0); f.position.set(-9.2, 6.2, -3.5); f.castShadow = true; S.add(f);
    D.updaters.push(t => { f.rotation.y = Math.sin(t * .9) * .16 * (D.wind || 1); });
    const n = add(new T.PlaneGeometry(3.4, 3), M.net, -12.4, 3.6, -3.2, { cast: false, ry: .2 }); n.rotation.z = .08;
    // hanging lantern off the gallows arm
    box(.04, .6, .04, M.iron, -8.2, 5.8, -3.6); box(.5, .7, .5, M.lamp, -8.2, 5.1, -3.6, { cast: false }); D.lantern(-8.2, 5.4, -3.4, { intensity: 16, distance: 11, glow: 1.1 }); }
  // the box lantern on the right corner
  { box(1, .3, 1, M.wood, 11.6, 0, -2.2); box(.8, 1.1, .8, M.lamp, 11.6, .3, -2.2, { cast: false }); for (const [dx, dz] of [[-.4, -.4], [.4, -.4], [-.4, .4], [.4, .4]]) box(.1, 1.2, .1, M.wood, 11.6 + dx, .3, -2.2 + dz);
    add(new T.ConeGeometry(.85, .5, 4), M.roof, 11.6, 1.75, -2.2, { ry: Math.PI / 4 }); D.lantern(11.6, 1, -2, { intensity: 20, distance: 10, glow: 1.4 }); }

  // ── the stilt-town on the left: warehouses with lit shoji on a long pier, pennants overhead ──
  const shed = (x, z, w, d, h, floors, sd) => { const wall = new T.MeshStandardMaterial({ map: ctex(shojiT(sd), [w / 4, floors]), emissiveMap: ctex(shojiT(sd, 1), [w / 4, floors]), emissive: 0xffa050, emissiveIntensity: 1.3, roughness: .8 });
    for (let dx = -w / 2; dx <= w / 2; dx += 2) box(.3, 2, .3, M.old, x + dx, -1.6, z + d / 2);
    const b = box(w, h, d, wall, x, .2, z); b.material = [wall, M.wood, M.roof, M.roof, wall, M.wood];
    for (let f = 1; f < floors; f++) { box(w + .8, .14, .9, M.walk, x, .2 + h * f / floors, z + d / 2 + .4); }
    for (let k = 0; k < 2; k++) { const r = add(new T.ConeGeometry(Math.max(w, d) * .82 - k * 1.4, 1.8 - k * .4, 4), M.roof, x, .2 + h + .8 + k * 1.2, z, { ry: Math.PI / 4 }); r.scale.set(w / Math.max(w, d) * 1.2, 1, d / Math.max(w, d) * 1.2); }
    D.lantern(x, h * .5, z + d / 2 + 1, { intensity: 14, distance: 10, glow: 0 }); };
  shed(-16, -12, 9, 6, 6.4, 2, 2); shed(-8, -22, 8, 5, 5.2, 2, 5); shed(-2, -32, 7, 5, 4, 1, 8);
  box(26, .3, 3, M.walk, -6, -.3, -17, { ry: -.75 }); rail(K, [[-13, -9.8], [3.4, -26.6]], { h: .9, step: 2, mat: M.wood, rails: [.85] });
  for (let i = 0; i < 6; i++) { const x = -13 + i * 3.3, z = -9.8 - i * 3.4; box(.16, 1.5, .16, M.wood, x + .6, 0, z + .4); box(.36, .42, .36, M.lamp, x + .6, 1.5, z + .4, { cast: false }); D.glow(x + .6, 1.7, z + .4, 1, 0xffb060); }
  { const pts = [[-20, 9, -9], [-12, 8.2, -16], [-4, 7.2, -26]]; for (let i = 0; i < pts.length - 1; i++) { const a = new T.Vector3(...pts[i]), b = new T.Vector3(...pts[i + 1]), m = a.clone().lerp(b, .5); m.y -= .8; const c = new T.QuadraticBezierCurve3(a, m, b);
      add(new T.TubeGeometry(c, 12, .02, 4), M.rope, 0, 0, 0, { cast: false });
      for (let k = 1; k < 7; k++) { const p = c.getPoint(k / 7), pn = add(new T.PlaneGeometry(.5, .8), M.pen, p.x, p.y - .45, p.z, { cast: false, ry: .7 }); D.updaters.push(t => { pn.rotation.z = Math.sin(t * 2 + k) * .12; }); } } }
  // the cliff and its temple
  { const c = add(new T.ConeGeometry(16, 40, 7), M.cliff, -26, 14, -36, { cast: false }); c.scale.z = .6; add(new T.ConeGeometry(10, 30, 6), M.cliff, -14, 10, -48, { cast: false });
    for (const [x, y, z, w] of [[-22, 22, -30, 5], [-16, 26, -38, 4], [-12, 18, -42, 3.4]]) { box(w, w * .6, w * .7, new T.MeshStandardMaterial({ color: 0x3a2a26, emissive: 0xffa050, emissiveIntensity: .5 }), x, y, z, { cast: false });
      add(new T.ConeGeometry(w * .82, w * .4, 4), M.roof, x, y + w * .8, z, { ry: Math.PI / 4, cast: false }); D.glow(x, y + w * .3, z + w * .4, w * .8, 0xffa050); }
    for (let i = 0; i < 5; i++) await K.prop('sakura', -20 + i * 2.4, -30 - i * 3, 3.4, { y: 14 + i, tint: 0xff50c0, blob: false, shadow: false }); }

  // ── the junk at anchor, another out to sea ──
  ship(K, D, 9, -19, 20, { y: -.8, ry: .05 }); ship(K, D, 46, -70, 14, { y: -.8, ry: -.1 });
  drift(D, 60, 0, -8, 14, 8, 0xffb070, { y0: .3, y1: 6, size: 8 }); D.petals(40, -4, 0, 10, { color: 0xff6aa8 });
}
