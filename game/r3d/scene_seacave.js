// Sea Cave: a drowned stone shrine floor at the mouth of a sea cave. Crystal stalactites drip overhead, cyan spirit-lamps
// float on black water, a moss-eaten torii stands in the shallows, a wreck lists against the rocks, and a blood moon
// pours red light through the far opening.
import { T } from './diorama.js';
import { kit, rng, ctex, sky, moon, flags, torii, ship, water, drift, pbr } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -2.4], [-4.2, -2.8], [1.4, -4]], sum: [-5.4, .8] };

export async function build(D) {
  const K = kit(D), { S, add, box } = K, R = rng(57);
  S.fog = new T.Fog(0x1a0e26, 18, 110); S.background = new T.Color(0x0c0816);
  D.moonlight({ color: 0xff8090, intensity: 2, dir: [.3, 1, -.6], ambient: 0x3a4a70, ambientI: 2, sky: 0x6a50a0, ground: 0x1a4a4a });
  sky(D, [[0, '#200818'], [.5, '#6a1424'], [1, '#c02a2a']], { stars: 40, z: -150 });
  moon(D, 6, 46, -140, 26, [255, 90, 80], [255, 40, 60]);

  const M = {
    rock: pbr('rock_face', [2, 2], { color: 0x5a4a6a, ns: 2 }),
    rockL: pbr('mossy_rock', [1, 1], { color: 0x7a6a8a, ns: 2, rough: .5 }),
    crys: new T.MeshStandardMaterial({ color: 0x9a7ab8, emissive: 0x6a3aa0, emissiveIntensity: .6, roughness: .2, metalness: .3, flatShading: true }),
    crysR: new T.MeshStandardMaterial({ color: 0xd06a8a, emissive: 0xa02040, emissiveIntensity: .8, roughness: .2, metalness: .3, flatShading: true }),
    gate: pbr('weathered_planks', [.5, 2], { color: 0xd04040 }), gateD: pbr('mossy_rock', [.5, .5], { color: 0x6a7070 }),
    rope: new T.MeshStandardMaterial({ color: 0xc8b890, roughness: 1 }),
    lamp: new T.MeshStandardMaterial({ color: 0xa0fff0, emissive: 0x30e0d0, emissiveIntensity: 2.2, roughness: .4 }),
    frame: new T.MeshStandardMaterial({ color: 0x1a2028, roughness: .7 }),
  };
  // ── the floor: wet, cracked shrine flags on a raised slab, cyan water in the gaps ──
  { box(30, 1.2, 12, pbr('cyan_flags', [4, 1.6], { rmap: 'seaworn_stone_tiles', color: 0x9a80b8, rough: .3, metal: .2, ns: 1.4, glow: 'cyan_flags', ei: 1.3 }), 0, -1.2, 1);
    const pools = new T.MeshStandardMaterial({ color: 0x0a3a40, emissive: 0x1ab0b0, emissiveIntensity: .5, roughness: .05, metalness: .5 });
    for (const [x, z, w, d] of [[-9, 5, 5, 2.2], [8, 5.6, 4, 1.8], [-3, 5.8, 2.4, 1]]) add(new T.PlaneGeometry(w, d), pools, x, .02, z, { rx: -Math.PI / 2, cast: false }); }
  water(D, 0, -40, 200, 74, 0x0a1a2a, { y: -.7 }).material.emissive = new T.Color(0x05303a);

  // ── cave walls: heaped faceted boulders both sides, a ceiling arch, crystal stalactites dripping ──
  const boulder = (x, y, z, r, m = M.rock) => { const b = add(new T.DodecahedronGeometry(r, 1), m, x, y, z, { ry: R() * 6 }); b.scale.set(R.r(.8, 1.3), R.r(.6, 1.1), R.r(.8, 1.2)); return b; };
  for (const s of [-1, 1]) {
    for (let i = 0; i < 16; i++) { const z = R.r(4, -40), x = s * R.r(13, 20) + s * (-z) * .05; boulder(x, R.r(-1, 6), z, R.r(3, 6)); }
    for (let i = 0; i < 9; i++) boulder(s * R.r(10, 14), R.r(-.5, 1), R.r(3, -8), R.r(1, 2.4), M.rockL);
    for (let i = 0; i < 12; i++) { const z = R.r(2, -36); boulder(s * R.r(8, 16), R.r(11, 15), z, R.r(4, 7)); }
  }
  for (let i = 0; i < 14; i++) boulder(R.r(-14, 14), R.r(15, 18), R.r(4, -22), R.r(4, 7));
  // stalactites: crystal-tipped, hung from the ceiling and the upper walls, with drips
  const drips = [];
  for (let i = 0; i < 46; i++) { const x = R.r(-16, 16), z = R.r(4, -26), top = R.r(11.5, 14) - Math.abs(x) * .05, h = R.r(2, 6);
    const st = add(new T.ConeGeometry(R.r(.3, .9), h, 5), R() < .35 ? M.crysR : R() < .6 ? M.crys : M.rockL, x, top - h / 2, z, { rx: Math.PI, cast: false });
    if (i % 3 === 0) drips.push([x, top - h, z]); }
  { const n = drips.length * 4, g = new T.BufferGeometry(), p = new Float32Array(n * 3), base = [];
    for (let i = 0; i < n; i++) { const d = drips[i % drips.length]; base.push(d, R() * 20); p.set(d, i * 3); } g.setAttribute('position', new T.BufferAttribute(p, 3));
    S.add(new T.Points(g, new T.PointsMaterial({ color: 0xc0a0ff, size: .12, transparent: true, opacity: .8 })));
    D.updaters.push(t => { const a = g.attributes.position.array; for (let i = 0; i < n; i++) { const d = drips[i % drips.length], ph = (t * .9 + base[i * 2 + 1]) % 3; a[i * 3 + 1] = d[1] - ph * ph * 3; if (a[i * 3 + 1] < -.6) a[i * 3 + 1] = d[1]; } g.attributes.position.needsUpdate = true; }); }

  // ── the far opening: cliffs silhouetted against red, light shafts falling in ──
  for (let i = 0; i < 9; i++) { const x = R.r(-24, 24), h = R.r(10, 24); const c = add(new T.ConeGeometry(R.r(4, 8), h, 6), M.rock, x, h / 2 - .7, R.r(-60, -80), { cast: false }); c.scale.z = .5; }
  { const shaftM = new T.MeshBasicMaterial({ color: 0xff3a4a, transparent: true, opacity: .07, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, fog: false });
    for (let i = 0; i < 6; i++) { const s = add(new T.PlaneGeometry(R.r(2, 4), 46), shaftM, R.r(-2, 14), 22, -40 + i * 2, { cast: false, rz: .35 + R.r(-.08, .08) }); D.updaters.push(t => { s.material.opacity = .06 + Math.sin(t * .4 + i) * .02; }); } }
  D.glow(4, 2, -62, 30, 0xff3040);

  // ── the drowned torii (left) and the wreck (right) ──
  torii(K, -9, -12, 7.5, M.gate, { y: -.7, dark: M.gateD, rope: M.rope, ry: .35, tilt: -.06 });
  for (const s of [-1, 1]) boulder(-9 + s * 3, -.4, -12 + s * .8, 1.3, M.rockL);
  ship(K, D, 14, -20, 16, { y: -1.6, ry: -.5, tilt: .14, sail: 0x5a3a4a, wreck: true });
  for (let i = 0; i < 5; i++) boulder(R.r(9, 18), -.3, R.r(-14, -24), R.r(1, 2.2), M.rockL);
  for (let i = 0; i < 8; i++) boulder(R.r(-10, 10), -.5, R.r(-6, -22), R.r(.6, 1.5), M.rockL);

  // ── spirit lamps: cyan cage lanterns bobbing on the water and set on the rocks ──
  const lamp = (x, y, z, s = 1, bob = true) => { const g = new T.Group(); g.position.set(x, y, z); S.add(g);
    K.add(new T.BoxGeometry(.5 * s, .6 * s, .5 * s), M.lamp, 0, .3 * s, 0, { to: g, cast: false });
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) K.add(new T.BoxGeometry(.06 * s, .7 * s, .06 * s), M.frame, dx * .27 * s, .32 * s, dz * .27 * s, { to: g, cast: false });
    K.add(new T.ConeGeometry(.45 * s, .25 * s, 4), M.frame, 0, .78 * s, 0, { to: g, ry: Math.PI / 4, cast: false });
    D.glow(x, y + .3 * s, z, 1.6 * s, 0x40f0e0);
    if (bob) D.updaters.push(t => { g.position.y = y + Math.sin(t * 1.2 + x) * .06; g.rotation.z = Math.sin(t * .9 + z) * .05; }); return g; };
  for (const [x, z] of [[-4, -7], [3, -9], [-1, -16], [8, -12], [-12, -20], [4, -26]]) lamp(x, -.75, z, 1.1);
  for (const [x, y, z] of [[-11.5, 1.4, 1.5], [11.5, 1.2, 1], [-14, 5, -6], [15, 4.4, -8]]) { lamp(x, y, z, 1, false); D.lantern(x, y + .5, z, { color: 0x40f0e0, intensity: 14, distance: 9, glow: 0 }); }
  D.lantern(0, 2, 2, { color: 0x30c0c0, intensity: 8, distance: 12, glow: 0 });
  drift(D, 40, -10, 1, 4, 4, 0x60fff0, { y0: 0, y1: 2.4, size: 22 }); drift(D, 40, 10, 1, 4, 4, 0x60fff0, { y0: 0, y1: 2.4, size: 22 });
  drift(D, 80, 0, -14, 16, 14, 0xff90a0, { y0: 0, y1: 12, size: 8 });
}
