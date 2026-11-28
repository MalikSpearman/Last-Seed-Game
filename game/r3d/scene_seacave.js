// Sea Cave: a drowned stone shrine floor at the mouth of a sea cave. Crystal stalactites drip overhead, cyan spirit-lamps
// float on black water, a moss-eaten torii stands in the shallows, a wreck lists against the rocks, and a blood moon
// pours red light through the far opening.
import { caveTide } from './coast_landmarks.js';
import { T } from './diorama.js';
import { kit, rng, ctex, sky, moon, torii, ship, water, drift, pbr, farPainting, puddleAlpha, scatter, clutter, decals, dress } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -2.4], [-4.2, -2.8], [1.4, -4]], sum: [-5.4, .8] };

export async function build(D) {
  const K = kit(D), { S, add, box } = K, R = rng(57);
  S.fog = new T.Fog(0x241929, 18, 112); S.background = new T.Color(0x0c0816);
  D.moonlight({ color: 0xff8090, intensity: 2, dir: [.3, 1, -.6], ambient: 0x3a4a70, ambientI: 2, sky: 0x6a50a0, ground: 0x1a4a4a });
  sky(D, [[0, '#241321'], [.5, '#39212e'], [1, '#241929']], { stars: 0, z: -150 });
  moon(D, 21, 13, -142, 19, [220, 150, 137], [173, 76, 69]);

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
    // Shallow wet patches follow the stone at deck height, with irregular feathered rims.
    const pools = new T.MeshStandardMaterial({
      color: 0x122c3b, roughness: .2, metalness: .4, alphaMap: puddleAlpha(),
      transparent: true, opacity: .72, depthWrite: false
    });
    for (const [x, z, w, d, turn] of [[-9, 5, 5, 2.2, .26], [8, 5.6, 4, 1.8, -.5], [-3, 5.8, 2.4, 1, .64]]) {
      add(new T.PlaneGeometry(w, d), pools, x, -.584, z, { rx: -Math.PI / 2, rz: turn, cast: false });
    }
  }
  // Carry both ripple layers behind the painting. Fog converges on the painted tide haze before the mesh ends.
  water(D, 0, -76, 200, 150, 0x101d2a, {
    y: -.7, sky: ['#50313f', '#0e303b'], flow: [.02, .012]
  }).material.emissive.setHex(0x062128);

  caveTide(D, K);
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

  // Layer low tidal ledges at the mouth, leaving a channel through to the moonlit inlet.
  const reef = new T.MeshStandardMaterial({ color: 0x392c42, roughness: .95, flatShading: true });
  for (const [x, z, w, h, d, turn] of [
    [-28, -48, 15, 4.2, 8, .16], [-16, -58, 11, 3.4, 5, -.28],
    [-11, -71, 9, 2.4, 6, .4], [32, -52, 15, 5.4, 7, -.19],
    [23, -65, 13, 4.1, 7, .28], [36, -79, 18, 6.6, 9, -.36],
  ]) {
    const ledge = add(new T.DodecahedronGeometry(1, 0), reef, x, -.9, z, { ry: turn, cast: false });
    ledge.scale.set(w, h, d);
  }

  // A painted veil of salt haze meets the fogged water at tide height.
  const haze = document.createElement('canvas');
  haze.width = 32;
  haze.height = 64;
  const paint = haze.getContext('2d');
  const wash = paint.createLinearGradient(0, 0, 0, haze.height);
  wash.addColorStop(0, 'rgba(36,25,41,0)');
  wash.addColorStop(.44, 'rgba(36,25,41,.7)');
  wash.addColorStop(.73, 'rgb(36,25,41)');
  wash.addColorStop(1, 'rgba(36,25,41,0)');
  paint.fillStyle = wash;
  paint.fillRect(0, 0, haze.width, haze.height);
  const veil = add(new T.PlaneGeometry(250, 20), new T.MeshBasicMaterial({
    map: ctex(haze), transparent: true, depthWrite: false, fog: false
  }), 0, 5, -115, { cast: false });
  veil.renderOrder = 1;

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

  // ── detail wave 2: painted far backdrop, ground to the horizon, near scatter ──
  const R2 = rng(158);
  farPainting(D, 'seacave', { v1: .72, z: -145, tint: 0x929fae });
  scatter(D, R2, { area: [-14, 14, -4, 6], puddles: 7, pebbles: 140, stone: 0x4a4060, tufts: 40, tuft: 0x2a6a5a, petals: 70, petal: 0xf0e8e0 });
  decals(D, rng(705), { area: [-14, 14, -4, 6], list: [['moss', 6, [1.4, 3]]] });   // floor decals: stains, cracks, moss, litter (see kit.decals)
  // background life and mid-ground clutter
  await clutter(D, K, R2, 'wild', { area: [-14, 14, -4.5, -6.5], n: 10, clear: 4, y: -.1 });
  await dress(D, rng(1010), { area: [-16, 16, -9, 4], items: [['namaqualand_boulder_02', 4, [.7, 1.4], { tint: 0x8a90a8 }], ['rock_moss_set_01', 1, { s: [.22, .38] }], ['rock_moss_set_02', 1, { s: [.22, .38] }]] });   // real CC0 models placed where they fit (kit.dress)
}
