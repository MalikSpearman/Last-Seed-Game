// The Blight: a cracked flagstone crossroads with lava in the seams, gallows-banners of the horned skull,
// a red bridge over a poisoned violet river, burning fields, and the demon citadel under a storm eye.
import { T } from './diorama.js';
import { kit, rng, ctex, sky, flags, rough, bannerTex, rail, deadTree, hills, water, drift, pbr, farPainting, groundFill, scatter, cityBlocks, walkers, clutter } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4, -2.8], [-4.4, -3.4], [1.2, -5.2]], sum: [-5.4, .8] };

const skull = (g, cx, cy) => { g.fillStyle = '#e8d8c8'; g.beginPath(); g.ellipse(cx, cy, 58, 66, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(cx - 30, cy + 50); g.lineTo(cx + 30, cy + 50); g.lineTo(cx + 20, cy + 96); g.lineTo(cx - 20, cy + 96); g.fill();
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 46, cy - 36); g.quadraticCurveTo(cx + s * 110, cy - 70, cx + s * 96, cy - 140); g.quadraticCurveTo(cx + s * 86, cy - 80, cx + s * 30, cy - 52); g.fill(); }
  g.fillStyle = '#4a0a14'; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * 24, cy + 4, 15, 19, s * .3, 0, 7); g.fill(); } g.beginPath(); g.moveTo(cx, cy + 26); g.lineTo(cx - 8, cy + 42); g.lineTo(cx + 8, cy + 42); g.fill(); };

export async function build(D) {
  const K = kit(D), { S, add, box, prop } = K, R = rng(23);
  S.fog = new T.Fog(0x3a1c4c, 22, 120); S.background = new T.Color(0x24123a);
  D.moonlight({ color: 0xe0a8ff, intensity: 2, dir: [-.4, 1, .35], ambient: 0x5a3070, ambientI: 1.9, sky: 0xa060c8, ground: 0x4a2028 });
  sky(D, [[0, '#120824'], [.45, '#3a1650'], [.75, '#8a3a6a'], [1, '#c8605a']], { swirl: [.62, .2, '#d070ff'], stars: 60 });

  const M = {
    wood: pbr('weathered_planks', [.6, 1], { color: 0x8a6a6a }),
    deckW: pbr('worn_planks', [1, 1], { color: 0x9a7a7a }),
    char: pbr('japanese_cedar_bark', [1, 2], { color: 0x4a3a40 }),
    lac: new T.MeshStandardMaterial({ color: 0x8a1e26, roughness: .55 }),
    stone: pbr('castle_wall_slates', [1, 1], { color: 0x9a8aa0 }),
    grave: pbr('rock_face', [1, 2], { color: 0xd8ccc8 }),
    iron: pbr('rusty_metal_02', [1, 1], { color: 0x3a3038, metal: .7, rough: .7 }),
    ban: new T.MeshStandardMaterial({ map: ctex(bannerTex({ field: ['#7a1420', '#4a0a16'], trim: '#3a0a10', emblem: skull, tatter: true, sd: 7 })), roughness: .9, side: T.DoubleSide, alphaTest: .4 }),
    ember: new T.MeshStandardMaterial({ color: 0x401010, emissive: 0xff5a18, emissiveIntensity: 2.2 }),
    field: pbr('burned_ground_01', [50, 50], { color: 0x8a6a7a }),
    hill: new T.MeshStandardMaterial({ color: 0x3a2448, roughness: 1 }),
  };

  // ── ground: lava-seamed flags where they fight, scorched earth around ──
  { const m = new T.Mesh(new T.PlaneGeometry(30, 22), pbr('lava_flags', [3.2, 2.4], { rmap: 'monastery_stone_floor', color: 0xc8a8b8, rough: .6, ns: 1.5, glow: 'lava_flags', ei: 1.6 }));
    m.rotation.x = -Math.PI / 2; m.position.set(-2, .01, -2); m.receiveShadow = true; S.add(m);
    D.updaters.push(t => { m.material.emissiveIntensity = 1.5 + Math.sin(t * 1.3) * .35 + Math.sin(t * 3.7) * .1; });
    const o = new T.Mesh(new T.PlaneGeometry(300, 300), M.field); o.rotation.x = -Math.PI / 2; o.receiveShadow = true; S.add(o);
    // the road on toward the citadel
    const rd = new T.Mesh(new T.PlaneGeometry(6, 40), pbr('volcanic_rock_tiles', [1.5, 10], { color: 0x9a8090 })); rd.rotation.x = -Math.PI / 2; rd.rotation.z = .35; rd.position.set(-4, .02, -30); rd.receiveShadow = true; S.add(rd); }

  // ── the violet river and its red bridge ──
  { const w = water(D, 12, -14, 9, 80, 0x2a1048, { y: -.3, sky: ['#a04a8a', '#3a1048'], flow: [.0, .03], scale: 4 }); w.rotation.z = -.12; w.material.emissive = new T.Color(0x5a1a8a); w.material.emissiveIntensity = .35;
    for (const s of [-1, 1]) { const b = box(1.2, .5, 80, M.stone, 12 + s * 4, -.45, -14, { ry: .12 }); b.castShadow = false; }
    // arched deck across the river
    const x0 = 7.4, x1 = 16.8, z = -7, half = 1.1, N = 18, yAt = u => Math.sin(Math.PI * u) * 1.3;
    for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N, a = x0 + (x1 - x0) * u0, b = x0 + (x1 - x0) * u1, ya = yAt(u0), yb = yAt(u1), L = Math.hypot(b - a, yb - ya), rz = Math.atan2(yb - ya, b - a);
      add(new T.BoxGeometry(L * 1.05, .14, half * 2), M.deckW, (a + b) / 2, (ya + yb) / 2, z, { rz });
      for (const s of [-1, 1]) { add(new T.BoxGeometry(L * 1.05, .08, .1), M.lac, (a + b) / 2, (ya + yb) / 2 + .9, z + s * half, { rz }); add(new T.BoxGeometry(L * 1.05, .06, .08), M.lac, (a + b) / 2, (ya + yb) / 2 + .5, z + s * half, { rz }); }
      if (i % 3 === 0) for (const s of [-1, 1]) box(.14, 1, .14, M.lac, a, ya, z + s * half); }
    for (const x of [x0 + .3, x1 - .3]) for (const s of [-1, 1]) box(.5, 1.4, .5, M.stone, x, -1, z + s * (half - .2));
    // a torn banner hung over the rail
    const rag = new T.Mesh(new T.PlaneGeometry(1.1, 1.6), M.ban); rag.position.set(12.4, 1.1, z + half + .05); S.add(rag);
    // the near bank fence
    rail(K, [[6.8, 3], [7.4, -2], [8, -14], [8.8, -26]], { h: .8, step: 2, mat: M.wood, rails: [.7] }); }

  // ── gallows banners marching off down the road ──
  const gallows = (x, z, h, s) => { box(.24, h, .24, M.wood, x, 0, z); const arm = box(1.8, .2, .2, M.wood, x + s * .8, h - .5, z);
    const b = new T.Mesh(new T.PlaneGeometry(1.3, 3.2, 1, 6), M.ban); b.geometry.translate(0, -1.6, 0); b.position.set(x + s * 1.1, h - .6, z + .05); b.castShadow = true; S.add(b);
    D.updaters.push(t => { b.rotation.y = Math.sin(t * .7 + z) * .14 * (D.wind || 1); }); };
  gallows(-7.4, -3.2, 5.4, 1); gallows(-6.2, -9.5, 4.6, 1); gallows(-4.6, -17, 4.2, 1); gallows(-2.8, -26, 3.8, 1); gallows(-1, -36, 3.4, 1);
  gallows(9.4, -16, 4.4, -1); gallows(15.5, -24, 4, -1);

  // ── the near-left corner: a chained grave marker, a cage brazier, broken stakes, rocks ──
  { const g = box(1.3, 2.4, .5, M.grave, -9.2, 0, -.6, { ry: .25 }); add(new T.SphereGeometry(.65, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.grave, -9.2, 2.4, -.6, { ry: .25 }).scale.set(1, .5, .38);
    for (const dx of [-.5, .5]) add(new T.TorusGeometry(.12, .03, 6, 10), M.iron, -9.2 + dx, 1.4, -.3, { ry: 1.2 });
    // cage brazier: iron hoops around coals
    const bx = -6.2, bz = -2.4; box(.12, 1.1, .12, M.iron, bx, 0, bz); for (const y of [1.1, 1.5, 1.9]) add(new T.TorusGeometry(.42, .03, 6, 18), M.iron, bx, y, bz, { rx: Math.PI / 2 });
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; add(new T.CylinderGeometry(.02, .02, .9, 4), M.iron, bx + Math.cos(a) * .42, 1.5, bz + Math.sin(a) * .42); }
    add(new T.SphereGeometry(.34, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.ember, bx, 1.12, bz); D.lantern(bx, 1.7, bz, { color: 0xff6a20, intensity: 22, distance: 10, glow: 1.6 }); drift(D, 30, bx, bz, .5, .5, 0xffa040, { y0: 1.6, y1: 4.5, size: 12 });
    for (const [x, z, r] of [[-8, 1.8, .7], [-10.4, -2.6, 1], [-5.4, 2.6, .5], [7.6, 2.2, .6], [6.4, -1, .45]]) { const m = add(new T.DodecahedronGeometry(r, 0), M.stone, x, r * .4, z, { ry: x }); m.scale.y = .6; }
    for (const [x, z, rz] of [[-7.8, -.8, .4], [-7.2, -1.6, -.3], [-8.6, -2.2, .7]]) box(.12, 1.3, .12, M.wood, x, 0, z, { rz }); }

  // ── dead trees, ember-lit ──
  deadTree(K, -11.5, -3.5, 9, M.char, 3); deadTree(K, -9.5, -12, 7, M.char, 8); deadTree(K, 14.5, -11, 7.5, M.char, 5); deadTree(K, 17.5, -2, 6, M.char, 12); deadTree(K, -14, -20, 8, M.char, 21);
  for (let i = 0; i < 8; i++) await prop('ferns', R.r(-13, -5), R.r(-6, 3), R.r(.5, .8), { tint: 0x6a4a5a, flip: R() < .5 });

  // ── burning fields beyond: rows of fire, smoke columns, and the hills ──
  for (let i = 0; i < 26; i++) { const x = R.r(-40, 40), z = R.r(-30, -64); if (Math.abs(x - 12 + z * .12) < 5) continue;
    const L = R.r(2, 6); box(L, .3, .3, M.ember, x, 0, z, { cast: false, ry: R.r(-.3, .3) }); D.glow(x, .6, z, L * 1.2, 0xff6a20); if (i % 4 === 0) D.lantern(x, .8, z, { color: 0xff6a20, intensity: 18, distance: 14, glow: 0 }); }
  drift(D, 160, 0, -46, 40, 18, 0xff8a30, { y0: .5, y1: 9, size: 9 });
  { const smokeM = new T.SpriteMaterial({ color: 0x24141e, transparent: true, opacity: .4, depthWrite: false }); const sm = [];
    for (let i = 0; i < 6; i++) { const x = R.r(-30, 30), z = R.r(-40, -70); for (let k = 0; k < 8; k++) { const s = new T.Sprite(smokeM); s.position.set(x + k * .9, 2 + k * 2.4, z); s.scale.set(3 + k, 3 + k, 1); S.add(s); sm.push([s, x, k]); } }
    D.updaters.push(t => { for (const [s, x, k] of sm) s.position.x = x + k * .9 + Math.sin(t * .3 + k) * .6; }); }
  hills(K, [[-50, -80, 40, 12], [-10, -88, 36, 9], [30, -84, 30, 10], [70, -86, 40, 14]], M.hill);

  // ── the citadel on its crag: spires, horns, a violet rift down its face, ruined aqueducts ──
  { const cx = 30, cz = -112, cm = new T.MeshStandardMaterial({ color: 0x2a1838, roughness: .9, emissive: 0x3a1050, emissiveIntensity: .4 });
    const crag = add(new T.ConeGeometry(26, 26, 7), M.hill, cx, 13, cz, { cast: false }); crag.scale.z = .5;
    box(18, 14, 8, cm, cx, 20, cz, { cast: false }); box(9, 10, 6, cm, cx, 34, cz, { cast: false });
    for (const [dx, h, r] of [[0, 18, 1.8], [-6, 12, 1.2], [6, 12, 1.2], [-10, 8, 1], [10, 8, 1], [-3, 10, .8], [3, 10, .8]]) { box(r * 1.6, h * .5, r * 1.6, cm, cx + dx, dx ? 30 : 44, cz + 1, { cast: false }); add(new T.ConeGeometry(r * 1.2, h, 6), cm, cx + dx, (dx ? 30 : 44) + h * .5 + h * .5, cz + 1, { cast: false }); }
    for (const s of [-1, 1]) { const horn = add(new T.TorusGeometry(5, .6, 6, 16, Math.PI * .7), cm, cx + s * 3, 54, cz + 1, { cast: false }); horn.rotation.z = -.4; horn.scale.x = s; }
    const rift = new T.Mesh(new T.PlaneGeometry(1.4, 30), new T.MeshBasicMaterial({ color: 0xff4ad0, fog: false, transparent: true, opacity: .9, blending: T.AdditiveBlending })); rift.position.set(cx, 22, cz + 4.2); S.add(rift);
    D.glow(cx, 44, cz + 4, 18, 0xd060ff); D.glow(cx, 20, cz + 6, 12, 0xff40c0);
    for (const [x0, n] of [[cx - 40, 6], [cx + 14, 5]]) for (let i = 0; i < n; i++) { const x = x0 + i * 4.6; box(1, 12, 1.6, cm, x, 10, cz + 8, { cast: false }); if (i < n - 1) add(new T.TorusGeometry(1.8, .5, 4, 10, Math.PI), cm, x + 2.3, 20, cz + 8, { cast: false }); box(4.6, 1, 1.6, cm, x + 2.3, 21.6, cz + 8, { cast: false }); } }
  drift(D, 60, 0, -2, 14, 8, 0xff9a40, { y0: .2, y1: 5, size: 10 });   // embers on the wind over the plaza

  // ── detail wave 2: painted far backdrop, ground to the horizon, near scatter ──
  const R2 = rng(652);
  farPainting(D, 'blight', { v1: .52, z: -145 });
  scatter(D, R2, { area: [-16, 12, -6, 8], puddles: 3, pebbles: 160, stone: 0x4a3a44, tufts: 50, tuft: 0x4a3024, leaves: 160, leaf: 0x2a1a1e });
  { const steel = new T.MeshStandardMaterial({ color: 0x8a8a96, metalness: .9, roughness: .3 }), hilt = new T.MeshStandardMaterial({ color: 0x2a1a14 });
    for (const [x, z, rz, rx] of [[-5.2, -4.4, .25, -.2], [6.4, -4.8, -.3, .15], [-10.4, 3.6, .15, .3], [9.6, 4.2, -.2, -.25]]) { const g = new T.Group(); g.position.set(x, 0, z); g.rotation.set(rx, R2() * 3, rz); D.scene.add(g);
      const b = new T.Mesh(new T.BoxGeometry(.12, 1.6, .03), steel); b.position.y = .5; b.castShadow = true; g.add(b); const c = new T.Mesh(new T.BoxGeometry(.5, .07, .1), hilt); c.position.y = 1.32; g.add(c); const h = new T.Mesh(new T.CylinderGeometry(.04, .04, .45, 6), hilt); h.position.y = 1.58; g.add(h); } }
  // background life and mid-ground clutter
  await clutter(D, K, R2, 'wild', { area: [-24, 6, -6, -30], n: 30, clear: 4 });
}
