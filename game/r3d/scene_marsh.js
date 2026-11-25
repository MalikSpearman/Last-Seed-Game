// Lotus Marsh: a rain-slick boardwalk deck over a black pond, stilt houses with lit shoji, a boardwalk winding
// off to the sacred tree on its island (rope, paper streamers, a waterfall), blue will-o-wisps, under a blood moon.
import { T } from './diorama.js';
import { kit, rng, ctex, cvs, sky, moon, planks, rough, rail, stoneLantern, water, drift, pbr, farPainting, groundFill, scatter, cityBlocks, walkers, clutter, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.2, -1.6], [-4.4, -1.8], [7.2, -5.5]], sum: [-5.6, .8], exposure: 1.4 };

const shoji = (sd, glow) => { const R = rng(sd); return cvs(256, 256, (g, W, H) => { g.fillStyle = glow ? '#000' : '#3a2418'; g.fillRect(0, 0, W, H);
  for (let x = 8; x < W; x += 82) { const on = R() < .8; g.fillStyle = glow ? (on ? '#ffb060' : '#000') : on ? '#ffd090' : '#2a1810'; g.fillRect(x, 30, 72, 190);
    g.fillStyle = glow ? '#000' : '#3a2418'; for (let k = 1; k < 4; k++) g.fillRect(x + k * 18, 30, 3, 190); for (let k = 1; k < 6; k++) g.fillRect(x, 30 + k * 32, 72, 3); } }); };

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(41);
  S.fog = new T.Fog(0x4a3670, 26, 120); S.background = new T.Color(0x2e2050);
  D.moonlight({ color: 0xd8c8ff, intensity: 2.8, dir: [.4, 1, .25], ambient: 0x6a5aa0, ambientI: 2.6, sky: 0x9a88e0, ground: 0x4a5a48 });
  { const fill = new T.DirectionalLight(0xffc890, .9); fill.position.set(-10, 8, 20); S.add(fill); }   // warm front fill: the lantern glow the painting bathes the deck in
  sky(D, [[0, '#1a1440'], [.5, '#4a3478'], [1, '#7a4a8a']], { stars: 120 });
  moon(D, 14, 60, -140, 24, [230, 70, 60], [200, 40, 60]);

  const M = {
    deck: pbr('weathered_planks', [5, 2], { color: 0xf0d0d8, rough: .4, metal: .08, ns: 1.3 }),
    walk: pbr('worn_planks', [1, 4], { color: 0xe0c0c8, rough: .5, metal: .06 }),
    wood: pbr('japanese_cedar_planks', [.4, 1], { color: 0xb07a68 }),
    old: pbr('weathered_planks', [.4, 1], { color: 0xb08a88 }),
    roof: pbr('roof_tiles_14', [3, 3], { color: 0xb0a8c8 }),
    stone: pbr('mossy_rock', [.5, .5], { color: 0xd0d0c8 }),
    rock: pbr('mossy_rock', [3, 2], { color: 0x9a9aa8 }),
    bark: pbr('japanese_cedar_bark', [2, 3], { color: 0xb09090, ns: 1.5 }),
    moss: pbr('coast_sand_rocks_02', [4, 4], { color: 0x8aa888 }),
    rope: new T.MeshStandardMaterial({ color: 0xd8c8a0, roughness: 1 }),
    paper: new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0x8090ff, emissiveIntensity: .3, side: T.DoubleSide }),
    pad: new T.MeshStandardMaterial({ color: 0x2a5a30, roughness: .6, side: T.DoubleSide }),
    lotus: new T.MeshStandardMaterial({ color: 0xff70c0, emissive: 0xc02a90, emissiveIntensity: .7, roughness: .6 }),
    pine: new T.MeshStandardMaterial({ color: 0x2e3a50, roughness: 1 }),
    red: new T.MeshStandardMaterial({ color: 0xa82030, roughness: .7, side: T.DoubleSide }),
  };

  // ── the pond and the deck the fight is on ──
  water(D, 0, -30, 160, 70, 0x24306a, { y: -.4, sky: ['#6a4a9a', '#2a2a5a'], rings: 24 }).material.emissive = new T.Color(0x0a1030);
  { const o = new T.Mesh(new T.PlaneGeometry(200, 120), pbr('mud_forest', [30, 20], { color: 0x5a5a60 })); o.rotation.x = -Math.PI / 2; o.position.set(0, -.6, 40); S.add(o); }
  box(24, .3, 9, M.deck, 0, -.3, .9);
  for (let x = -11; x <= 11; x += 2.2) for (const z of [-3.3, 5]) box(.4, 1.6, .4, M.old, x, -1.6, z);
  // back rail with a gap where the boardwalk leaves (right), rope-bound posts with moss caps
  rail(K, [[-12, -3.3], [-1, -3.3]], { h: 1.1, step: 2.2, mat: M.wood, post: .34, rails: [.85, .45] });
  rail(K, [[3.6, -3.3], [5, -3.3]], { h: 1.1, step: 2.2, mat: M.wood, post: .34, rails: [.85, .45] });
  rail(K, [[8.6, -3.3], [12, -3.3]], { h: 1.1, step: 2.2, mat: M.wood, post: .34, rails: [.85, .45] });
  for (let x = -12; x <= 12; x += 2.2) if (Math.abs(x - 6.8) > 2) add(new T.TorusGeometry(.19, .04, 5, 10), M.rope, x, .7, -3.3, { rx: Math.PI / 2, cast: false });
  stoneLantern(D, K, -9.6, -2.7, 1.25, { mat: M.stone }); stoneLantern(D, K, 10.2, -2.6, 1.25, { mat: M.stone });
  D.lantern(-4, 2.6, 1.5, { intensity: 14, distance: 12, glow: 0 }); D.lantern(4, 2.6, 1.5, { intensity: 14, distance: 12, glow: 0 });

  // ── the boardwalk winding off to the right and back, lanterns on posts along it ──
  const walk = [[6.8, -3.3], [7.6, -9], [12, -14], [10.6, -22], [15, -30], [13, -40]];
  for (let i = 0; i < walk.length - 1; i++) { const [ax, az] = walk[i], [bx, bz] = walk[i + 1], L = Math.hypot(bx - ax, bz - az), ry = -Math.atan2(bz - az, bx - ax) + Math.PI / 2;
    box(2.4, .2, L + .4, M.walk, (ax + bx) / 2, -.2, (az + bz) / 2, { ry });
    for (const s of [-1, 1]) { const nx = Math.cos(ry) * 1.2 * s, nz = -Math.sin(ry) * 1.2 * s; rail(K, [[ax + nx, az + nz], [bx + nx, bz + nz]], { h: .9, step: 2, mat: M.old, post: .2, rails: [.85] }); }
    for (let k = 0; k < L; k += 2.4) box(.3, 1.4, .3, M.old, ax + (bx - ax) * k / L, -1.6, az + (bz - az) * k / L);
    if (i < 4) { const lx = bx + 1.4, lz = bz; box(.18, 1.6, .18, M.wood, lx, 0, lz); const l = box(.36, .44, .36, new T.MeshStandardMaterial({ color: 0xfff0c0, emissive: 0xff9a40, emissiveIntensity: 2 }), lx, 1.6, lz, { cast: false });
      add(new T.ConeGeometry(.36, .26, 4), M.roof, lx, 2.17, lz, { ry: Math.PI / 4 }); D.lantern(lx, 1.8, lz, { distance: 8, intensity: 10, glow: .8 }); } }

  // ── stilt houses on the left: the near one big, two more down the water ──
  const house = (x, z, w, d, h, sd) => { const wall = new T.MeshStandardMaterial({ map: ctex(shoji(sd)), emissiveMap: ctex(shoji(sd, 1)), emissive: 0xffa050, emissiveIntensity: 1.3, roughness: .8 });
    for (const dx of [-w / 2 + .2, 0, w / 2 - .2]) for (const dz of [-d / 2 + .2, d / 2 - .2]) box(.3, 3.2, .3, M.old, x + dx, -1.6, z + dz);
    box(w + 1.4, .2, d + 1.4, M.walk, x, 1.5, z); rail(K, [[x - w / 2 - .7, z + d / 2 + .7], [x + w / 2 + .7, z + d / 2 + .7]], { y: 1.7, h: .8, step: 1.4, mat: M.wood, post: .16, rails: [.8] });
    const b = box(w, h, d, wall, x, 1.7, z); b.material = [M.wood, M.wood, M.roof, M.roof, wall, M.wood];
    for (let k = 0; k < 2; k++) { const r = add(new T.ConeGeometry(Math.max(w, d) * .9 - k * 1.2, 1.6 - k * .3, 4), M.roof, x, 1.7 + h + .7 + k * 1.1, z, { ry: Math.PI / 4 }); r.scale.set(w / Math.max(w, d) * 1.15, 1, d / Math.max(w, d) * 1.15); }
    D.lantern(x, 1.7 + h * .5, z + d / 2 + .8, { distance: 10, intensity: 14, glow: 0 }); return [x, z]; };
  house(-9, -13, 7, 5, 3.4, 3);
  for (let k = 0; k < 3; k++) { const ban = new T.Mesh(new T.PlaneGeometry(.7, 1.4), M.red); ban.position.set(-9 + (k - 1) * 1.5, 4.1, -10.4); S.add(ban); }
  // stairs down from the near house toward the deck
  for (let i = 0; i < 7; i++) box(1.6, .14, .5, M.walk, -4.6 + i * .5, 1.5 - i * .26, -9.6 + i * .7, { ry: -.6 });
  house(-2, -27, 5, 4, 2.6, 7); house(4, -40, 4.4, 3.6, 2.4, 9);
  rail(K, [[-5.4, -27], [-1, -33], [3, -40]], { h: .8, step: 2, mat: M.old, rails: [.8] });

  // ── the sacred tree on its island: a giant trunk with roots, shimenawa rope and paper shide, waterfalls ──
  { const tx = 21, tz = -30;
    const isl = add(new T.CylinderGeometry(9, 11, 3.6, 18), M.rock, tx, -.8, tz, { cast: false }); isl.scale.z = .7;
    add(new T.CylinderGeometry(9.1, 9.1, .3, 18), M.moss, tx, 1.05, tz).scale.z = .7;
    add(new T.CylinderGeometry(1.8, 3, 9, 12), M.bark, tx, 5.6, tz);
    for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2, r = add(new T.CylinderGeometry(.25, .7, 4.5, 6), M.bark, tx + Math.cos(a) * 2.6, 1.8, tz + Math.sin(a) * 2, {}); r.rotation.set(Math.sin(a) * .9, 0, -Math.cos(a) * .9); }
    for (const [dx, dy, rz] of [[-3, 9, .9], [3.2, 9.5, -.8], [0, 10.5, 0], [-1.5, 10, .3]]) add(new T.CylinderGeometry(.5, 1.1, 6, 8), M.bark, tx + dx, dy, tz, { rz });
    const rope = add(new T.TorusGeometry(2.55, .32, 8, 24), M.rope, tx, 4.2, tz, { rx: Math.PI / 2 }); rope.scale.y = .8;
    for (let i = 0; i < 9; i++) { const a = Math.PI * .1 + i / 9 * Math.PI * .8, p = new T.Mesh(new T.PlaneGeometry(.3, .9), M.paper); p.position.set(tx + Math.cos(a) * 2.6, 3.5, tz + Math.sin(a) * 2.1); p.rotation.y = -a + Math.PI / 2; S.add(p);
      D.updaters.push(t => { p.rotation.z = Math.sin(t * 1.4 + i) * .15; }); }
    // the canopy: banks of blossom cut-outs, tinted to the painting's violet
    for (let i = 0; i < 16; i++) { const a = R() * Math.PI * 2, r = R.r(1, 6.5); await prop('sakura', tx + Math.cos(a) * r, tz + Math.sin(a) * r * .5 + 1, R.r(6, 9), { y: R.r(6, 9), tint: 0xd070ff, flip: R() < .5, sway: .008, blob: false, shadow: i % 3 === 0 }); }
    // blue spirit-lanterns hanging from the boughs
    for (let i = 0; i < 9; i++) { const x = tx + R.r(-7, 7), y = R.r(7.5, 11), z = tz + R.r(-1, 3); D.glow(x, y, z, 1.1, 0x60c8ff); const s = new T.Mesh(new T.CylinderGeometry(.01, .01, 1.2, 3), M.rope); s.position.set(x, y + .7, z); S.add(s); }
    D.lantern(tx, 8, tz + 4, { color: 0x70b0ff, intensity: 20, distance: 18, glow: 0 });
    // waterfalls off the island's lip
    const fallM = new T.MeshBasicMaterial({ color: 0xc8e0ff, transparent: true, opacity: .55, depthWrite: false }); const falls = [];
    for (const [dx, w] of [[-6, 1.4], [-3.6, 2]]) { const f = new T.Mesh(new T.PlaneGeometry(w, 2.4, 1, 6), fallM.clone()); f.position.set(tx + dx, .2, tz + 6.4); S.add(f); falls.push(f); D.glow(tx + dx, -.3, tz + 6.8, 2.4, 0xa0c8ff); }
    D.updaters.push(t => falls.forEach((f, i) => { f.material.opacity = .45 + Math.sin(t * 9 + i * 2) * .08; })); }

  // ── the pond: lily pads, glowing lotus, reeds, blue will-o-wisps ──
  for (let i = 0; i < 40; i++) { const x = R.r(-14, 6), z = R.r(-4.5, -24); if (x > 4 && z > -12) continue; const r = R.r(.35, .8);
    const pad = add(new T.CircleGeometry(r, 14, .3, Math.PI * 2 - .3), M.pad, x, -.37, z, { rx: -Math.PI / 2, cast: false });
    if (R() < .3) { const l = add(new T.ConeGeometry(.22, .3, 7, 1, true), M.lotus, x, -.2, z, { rx: Math.PI, cast: false }); D.glow(x, -.1, z, .7, 0xff70c0); } }
  for (let i = 0; i < 18; i++) await prop('ferns', R.r(-14, 8), R.r(-4, -22), R.r(.8, 1.4), { y: -.4, tint: 0x4a6a4a, flip: R() < .5, blob: false });
  drift(D, 26, -2, -12, 10, 8, 0x60d0ff, { y0: -.2, y1: 2.2, size: 30 });
  drift(D, 50, 8, -20, 16, 14, 0xa0ffd0, { y0: .2, y1: 5, size: 10 });

  // ── bamboo framing both sides, a dark pine forest behind ──
  for (const s of [-1, 1]) for (let i = 0; i < 10; i++) { const x = s * R.r(12.5, 17), z = R.r(5, -6); await prop(R() < .5 ? 'bamboo3' : 'rfg_bamboo', x, z, R.r(9, 13), { y: -.6, flip: R() < .5, sway: .012, blobW: .2, tint: 0xd8e080 }); }
  for (let i = 0; i < 40; i++) { const x = R.r(-60, 60), z = R.r(-48, -70), h = R.r(10, 22); add(new T.ConeGeometry(h * .28, h, 7), M.pine, x, h / 2 - .4, z, { cast: false }); }
  D.petals(90, 2, -4, 14, { color: 0xff8ad8 });
  // rain-wet: a light drizzle of falling glints
  { const n = 500, g = new T.BufferGeometry(), p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[i * 3] = R.r(-20, 20); p[i * 3 + 1] = R.r(0, 14); p[i * 3 + 2] = R.r(-20, 6); } g.setAttribute('position', new T.BufferAttribute(p, 3));
    const rain = new T.Points(g, new T.PointsMaterial({ color: 0xc8d0ff, size: .05, transparent: true, opacity: .5, depthWrite: false })); S.add(rain);
    D.updaters.push((t, dt) => { const a = g.attributes.position; for (let i = 0; i < n; i++) { let y = a.array[i * 3 + 1] - (dt || .016) * 9; if (y < 0) y += 14; a.array[i * 3 + 1] = y; } a.needsUpdate = true; }); }

  // ── detail wave 2: painted far backdrop, ground to the horizon, near scatter ──
  const R2 = rng(790);
  farPainting(D, 'marsh', { v1: .5, z: -145 });
  scatter(D, R2, { area: [-11, 11, -3, 5], puddles: 7, petals: 220, leaves: 50, leaf: 0x4a7a3a, avoid: 4 });
  decals(D, rng(642), { area: [-11, 11, -3, 5], list: [['moss', 6, [1.2, 2.6]]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  // background life and mid-ground clutter
  await clutter(D, K, R2, 'wild', { area: [-12, 12, 4.8, 5.6], n: 8, clear: 7 });
  await dress(D, rng(999), { area: [-16, 16, -9, 4], items: [['img:rg_willow', 1, [6, 7.5]], ['img:rg_boat', 1, [2.2, 2.6]], ['namaqualand_boulder_02', 2, [.6, 1.2]], ['tree_stump_01', 1, [.4, .55]]] });   // real CC0 models placed where they fit (kit.dress)
}
