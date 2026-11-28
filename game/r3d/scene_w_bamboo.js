// Bamboo Grove: a rain-wet clearing of old flagstones deep in a bamboo forest under a red moon. Walls of bamboo on
// three sides, straw ropes of paper streamers and prayer tablets strung between the stalks, two lit stone lanterns,
// mossy jizo in red bibs, purple irises, a misty pond at the back with blue spirit flames drifting over it.
// Built at real-world scale (1 unit = 1 m): the fight camera puts the marks 1.7 m apart and a fighter stands ~1.75 m tall.
import { grovePond } from './marsh_landmarks.js';
import { T } from './diorama.js';
import { kit, rng, sky, moon, pbr, stoneLantern, water, scatter, decals, drift, dress, farPainting, IMG } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4.4, -1.8], [-4.4, -2], [1.6, -2.8]], sum: [-5.6, .8], exposure: 1.6 };   // gap/slots are scaled by the fight camera's SZ_DEF (.5)

// the flagstones fade into the forest floor instead of ending on a hard line: a soft-edged alpha mask (sx/sz = fade share of each side)
function softEdge(mat, sx, sz) { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'), d = g.createImageData(256, 256);
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const u = x / 255, v = y / 255, ex = Math.min(u, 1 - u) / sx, ey = Math.min(v, 1 - v) / sz, k = Math.max(0, Math.min(1, Math.min(ex, ey))), n = (Math.sin(x * .37) * Math.sin(y * .29) + Math.sin(x * .11 + y * .07)) * .08, a = Math.max(0, Math.min(1, k * k * (3 - 2 * k) + n * (1 - k) * 2)) * 255;
    const i = (y * 256 + x) * 4; d.data[i] = d.data[i + 1] = d.data[i + 2] = a; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); const t = new T.CanvasTexture(c); mat.alphaMap = t; mat.transparent = true; mat.depthWrite = false; mat.needsUpdate = true; }

export async function build(D) {
  const K = kit(D), { S, add } = K, R = rng(733);
  S.fog = new T.Fog(0x2a1a48, 10, 70); S.background = new T.Color(0x1a1030);
  // violet moonlight from the upper right; the lanterns and spirit flames do the rest
  D.moonlight({ color: 0xc8a8ff, intensity: 1.9, dir: [.55, 1, -.35], ambient: 0x3a2a6a, ambientI: 1.9, sky: 0x6a4aa8, ground: 0x1a2a24 });
  sky(D, [[0, '#0e0820'], [.55, '#2a1448'], [1, '#4a1a4a']], { stars: 40 }); moon(D, 14, 30, -120, 16, [255, 60, 60], [220, 30, 60]);
  const M = { flag: pbr('rock_tile_floor', [4, 2.4], { color: 0x8a9294, rough: .51, metal: .035, ns: 1.4 }), moss: pbr('mossy_rock', [.6, .6], { color: 0xa8b0a0 }),
    ground: pbr('mud_forest', [20, 20], { color: 0x3a4038 }) };
  // ── the forest floor, the wet flagstone clearing and the misty pond behind it ──
  { const g = new T.Mesh(new T.PlaneGeometry(200, 140), M.ground); g.rotation.x = -Math.PI / 2; g.position.set(0, -.03, -40); g.receiveShadow = true; S.add(g);
    const f = new T.Mesh(new T.PlaneGeometry(17, 11), M.flag); f.rotation.x = -Math.PI / 2; f.position.set(0, .01, -.6); f.receiveShadow = true; softEdge(f.material, .26, .34); f.renderOrder = -1; S.add(f); }
  water(D, 1.5, -9, 9, 5, 0x1a1438, { y: -.06, sky: ['#5a2a5a', '#120a24'], rings: 6, scale: 3 });
  grovePond(D, K, M);
  // ── the painting far behind: its red moon and the deep forest ──
  farPainting(D, 'w_bamboo', { v0: 0, v1: .45, z: -60, yb: -3, h: 42, w: 160, tint: 0xadb5cf });
  // ── walls of bamboo: dense rows left, right and behind, thinning toward the pond ──
  const bam = (x, z, h, o = {}) => D.prop(IMG(R() < .3 ? 'bamboo3' : R() < .45 ? 'rg_bamclump' : R() < .6 ? 'rfg_bamboo' : 'bamboo1'), x, z, h, Object.assign({ flip: R() < .5, sway: .01, blob: false }, o));
  for (const sd of [-1, 1]) for (let z = 1.5; z > -16; z -= R.r(.7, 1.2)) { const x = sd * R.r(7.35, 9.1) + sd * Math.max(0, -z) * .15; await bam(x, z, R.r(7, 10), { tint: z < -6 ? 0xa8b0d0 : 0xffffff }); if (R() < .6) await bam(x + sd * R.r(1, 2.2), z - .4, R.r(8, 11), { tint: 0x9aa4c8 }); }
  for (let x = -6; x < 6.5; x += R.r(.8, 1.4)) { if (x > -3 && x < 4.5) { if (R() < .5) continue; await bam(x, -13 - R() * 2, R.r(8, 11), { tint: 0x8a94bc }); continue; } await bam(x, -9 - R() * 3, R.r(8, 10.5), { tint: 0x9aa4c8 }); }
  // ── lanterns, jizo, irises, rocks: the painting's dressing at real size ──
  stoneLantern(D, K, -4.1, -1.5, 1, { mat: M.moss }); stoneLantern(D, K, 4.3, -1.8, 1, { mat: M.moss });
  // light back there: two smaller lanterns by the pond, paper lanterns hung in the stalls of bamboo, warm pools on the water
  stoneLantern(D, K, -2.9, -7.4, .8, { mat: M.moss }); stoneLantern(D, K, 4.6, -8.6, .8, { mat: M.moss });
  for (const [x, y, z] of [[-4.6, 2.6, -10.5], [1.2, 3.1, -12.6], [5.6, 2.4, -11.2]]) { const pl = add(new T.SphereGeometry(.22, 12, 10), new T.MeshStandardMaterial({ color: 0xffd8a0, emissive: 0xff8a30, emissiveIntensity: 2.2 }), x, y, z, { cast: false }); pl.scale.y = 1.3; D.lantern(x, y, z + .2, { color: 0xff9a40, intensity: 7, distance: 6, glow: .9 }); }
  D.glow(-2.9, .2, -7, 1.6, 0xff9a40); D.glow(4.6, .2, -8.2, 1.6, 0xff9a40);
  const P = async (n, x, z, h, o = {}) => D.prop(IMG(n), x, z, h, Object.assign({ blob: false }, o));
  await P('rg_jizo', -3.1, -2.6, .95, { flip: false }); await P('rg_jizo', 3.4, -3.1, .8, { flip: true });
  await P('rg_mossrock', -5.2, -2.4, .9); await P('rg_mossrock', 5.4, -3.4, .8, { flip: true }); await P('rg_mossrock', .4, -6.8, .7);
  for (const [x, z, h] of [[-4.6, -.6, .55], [4.9, -.9, .6], [-5.6, 1.6, .5], [5.8, 1.9, .55], [-2.4, -4.4, .45], [2.8, -4.8, .45], [-6.2, 3.2, .5], [6.4, 3, .5]]) await P('rg_iris', x, z, h, { flip: R() < .5, sway: .02 });
  await P('ferns', -6.2, -.4, .8, { flip: true }); await P('ferns', 6.4, -1, .8);
  // ── the streamer ropes strung between the stalks, front and back ──
  await P('rg_shimrope', 0, -3.4, 1.1, { y: 3.1, shadow: false });
  await P('rg_shimrope', -3.4, -7.2, .9, { y: 3.4, shadow: false, flip: true }); await P('rg_shimrope', 3.6, -7.8, .9, { y: 3.2, shadow: false });
  // ── blue spirit flames over the pond and among the stalks ──
  for (const [x, y, z] of [[-1.8, 1.4, -8.4], [2.6, 1.8, -9.6], [-4.8, 2.6, -5.2], [5.2, 2.2, -6], [.6, 2.8, -11.5]]) { const m = await P('rg_hitodama', x, z, .38, { y, shadow: false, emissive: 0x4a8aff, emissiveI: .8 });
    const y0 = y, ph = x * 1.7; D.updaters.push(t => { m.position.y = y0 + Math.sin(t * 1.3 + ph) * .14; m.material.opacity = .85 + Math.sin(t * 3 + ph) * .1; }); D.glow(x, y, z, .9, 0x4a8aff); }
  drift(D, 26, 0, -8, 6, 4, 0x6aa8ff, { y0: .4, y1: 3, size: 4 });
  // ── wet floor: puddles, fallen bamboo leaves, moss in the cracks ──
  scatter(D, rng(77), { area: [-6.5, 6.5, -2, 3.6], puddles: 5, leaves: 40, leaf: 0xa08a4a, pebbles: 10 });
  decals(D, rng(778), { area: [-6.5, 6.5, -2, 3.6], list: [['moss', 3, [1.2, 2.2]], ['stain', 2, [1, 1.8]], ['crack', 2, [.9, 1.6]]] });
  await dress(D, rng(779), { area: [-6, 6, -3, 2.6], lane: [-4.3, 4.3, -1.8, 1.4], front: 1.4, items: [['rock_moss_set_02', 2, [.4, .6]]] });
}
