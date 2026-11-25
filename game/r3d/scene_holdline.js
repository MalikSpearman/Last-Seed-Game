// Hold Line Call Centre (holdline) and the endless hold (holdline2). A vast pink-lit open-plan office: glossy floor,
// row after row of cubicles with monitors, headsets and potted plants, light panels marching to a vanishing point.
// Phase two: a magenta vortex tears through the ceiling, desks and monitors float up into it, phone handsets dangle on
// spiralling cords, papers storm, the floor cracks with pink light, the hold-music waveform glows across the dark.
import { T } from './diorama.js';
import { kit, rng, pbr, ctex, cvs, scatter, flurry, vortex, drift } from './kit.js';

export const PRESET = { c: [0, 0, 0], gap: 3.4, pitch: .2, cover: 1.5, slots: [[4, -1.6], [-4, -1.8], [1.4, -2.4]], sum: [-5.2, .8], exposure: 1.45 };
const screen = glow => cvs(128, 96, (g, W, H) => { g.fillStyle = glow ? '#000' : '#1a1020'; g.fillRect(0, 0, W, H); g.fillStyle = glow ? '#ff70d0' : '#ff9ae0'; g.fillRect(8, 8, W - 16, H - 16); g.fillStyle = glow ? '#000' : '#ffffff'; for (let y = 18; y < H - 14; y += 10) g.fillRect(14, y, 40 + (y * 7 % 50), 4); });

export async function build(D, phase = 1) {
  const hold = phase === 2, K = kit(D), { S, add, box, prop } = K, R = rng(hold ? 702 : 701);
  S.fog = new T.Fog(hold ? 0x3a0a3a : 0xf0c0e0, hold ? 20 : 30, hold ? 110 : 140); S.background = new T.Color(hold ? 0x1a0420 : 0xf8d8ec);
  D.moonlight(hold ? { color: 0xff70d0, intensity: 1.4, dir: [.1, 1, .3], ambient: 0x5a1a5a, ambientI: 2, sky: 0xff60c0, ground: 0x3a0a3a } : { color: 0xffffff, intensity: 2, dir: [.1, 1, .3], ambient: 0xd0a0c8, ambientI: 2.6, sky: 0xffe0f4, ground: 0xd0a0c0 });
  const M = { floor: pbr('concrete_pavers', [10, 20], { nmap: 'asphalt_02', rmap: 'asphalt_02', color: hold ? 0x6a3a6a : 0xf0c8e0, rough: .06, metal: .3 }), panel: new T.MeshStandardMaterial({ color: hold ? 0x8a6a8a : 0xf4e8f0, roughness: .7 }),
    desk: new T.MeshStandardMaterial({ color: hold ? 0xa08aa0 : 0xfaf4f8, roughness: .4 }), black: new T.MeshStandardMaterial({ color: 0x2a2028, roughness: .5 }), light: new T.MeshBasicMaterial({ color: hold ? 0xff60c0 : 0xffe8f8 }),
    scr: new T.MeshStandardMaterial({ map: ctex(screen(0)), emissiveMap: ctex(screen(1)), emissive: 0xffffff, emissiveIntensity: 1 }), pot: new T.MeshStandardMaterial({ color: 0xd8d0d8 }), cord: new T.MeshStandardMaterial({ color: 0xff70d0, emissive: 0xc02090, emissiveIntensity: .6 }), ceil: new T.MeshStandardMaterial({ color: hold ? 0x2a0a2a : 0xfaf0f6 }) };
  { const f = new T.Mesh(new T.PlaneGeometry(50, 140), M.floor); f.rotation.x = -Math.PI / 2; f.position.set(0, 0, -60); f.receiveShadow = true; S.add(f); }
  if (!hold) box(50, .4, 140, M.ceil, 0, 8, -60, { cast: false });
  // ceiling light panels marching away (phase two: torn loose)
  const lights = []; for (let z = 0; z > -120; z -= 6) for (const x of [-10, -3.4, 3.4, 10]) { const l = box(4, .1, 1.4, M.light, x, 7.8, z, { cast: false }); lights.push([l, x, z, R() * 6]); }
  for (let z = 0; z > -60; z -= 12) D.lantern(0, 7, z, { color: hold ? 0xff60c0 : 0xfff0fa, intensity: 16, distance: 18, glow: 0 });
  // ── cubicle rows down both sides of the central aisle ──
  const units = []; for (const s of [-1, 1]) for (let z = -2, i = 0; z > -100; z -= 3.4, i++) for (const c of [0, 1]) { const x = s * (7.5 + c * 4), g = new T.Group(); g.position.set(x, 0, z); S.add(g);
    K.add(new T.BoxGeometry(3.6, 1.6, .1), M.panel, 0, .8, -1.6, { to: g }); K.add(new T.BoxGeometry(.1, 1.6, 3.2), M.panel, s * -1.8, .8, 0, { to: g });
    K.add(new T.BoxGeometry(3.2, .08, 1.4), M.desk, 0, 1.1, -.8, { to: g }); K.add(new T.BoxGeometry(.9, .6, .06), M.scr, 0, 1.6, -1.2, { to: g, cast: false }); K.add(new T.BoxGeometry(.1, .3, .1), M.black, 0, 1.25, -1.24, { to: g });
    const ch = K.add(new T.BoxGeometry(.7, .7, .7), M.black, 0, .7, .2, { to: g }); K.add(new T.BoxGeometry(.7, .8, .1), M.black, 0, 1.3, .55, { to: g });
    if ((i + c) % 3 === 0) { K.add(new T.CylinderGeometry(.18, .14, .3, 10), M.pot, 1.2, 1.3, -1.2, { to: g }); } units.push([g, x, z, R() * 6]); }
  for (let i = 0; i < 8; i++) await prop('ferns', (R() < .5 ? -1 : 1) * 6, -2 - i * 7, 1, { y: 1.3, blob: false });
  if (hold) { // the vortex above, floating desks and monitors, dangling handsets, the waveform, cracked glowing floor
    vortex(D, 0, 14, -30, 30, '#ff40c0', { speed: .3, opacity: .85 }).rotation.x = Math.PI / 2; vortex(D, 0, 13.8, -30, 16, '#ffffff', { speed: -.5, opacity: .4 }).rotation.x = Math.PI / 2;
    D.updaters.push(t => { units.forEach(([g, x, z, ph], i) => { if (i % 4 || z < -40) return; g.position.y = 2 + Math.sin(t * .5 + ph) * 1 + (i % 3) * 2; g.rotation.set(Math.sin(t * .3 + ph) * .4, ph + t * .1, Math.cos(t * .35 + ph) * .3); });
      lights.forEach(([l, x, z, ph], i) => { if (i % 3) return; l.position.y = 9 + Math.sin(t * .4 + ph) * 2; l.rotation.z = Math.sin(t * .5 + ph) * .6; }); });
    for (let i = 0; i < 10; i++) { const x = R.r(-14, 14), z = R.r(-6, -30), y = R.r(8, 13), pts = []; for (let k = 0; k <= 30; k++) pts.push(new T.Vector3(x + Math.cos(k * .9) * .15, y - k * .14, z + Math.sin(k * .9) * .15)); add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 60, .02, 4), M.cord, 0, 0, 0, { cast: false });
      const hs = add(new T.CapsuleGeometry(.12, .6, 4, 8), M.cord, x, y - 4.4, z, { rz: Math.PI / 2 }); D.updaters.push(t => { hs.rotation.x = Math.sin(t + i) * .4; }); }
    { const pts = []; for (let k = 0; k <= 120; k++) { const x = -40 + k * .66; pts.push(new T.Vector3(x, 6 + Math.sin(k * .6) * Math.sin(k * .05) * 2.4, -40)); } add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 240, .08, 4), new T.MeshBasicMaterial({ color: 0xff60d0 }), 0, 0, 0, { cast: false }); D.glow(0, 6, -39, 30, 0xff40c0); }
    for (let i = 0; i < 10; i++) { const pts = []; let x = R.r(-14, 14), z = R.r(-2, -24); for (let k = 0; k < 6; k++) { pts.push(new T.Vector3(x, .03, z)); x += R.r(-2, 2); z += R.r(-2, 2); } add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 20, .04, 4), new T.MeshBasicMaterial({ color: 0xff70e0 }), 0, 0, 0, { cast: false }); }
    flurry(D, R, 60, { area: [-16, 16, 2, -26], y0: 0, y1: 12, speed: 2.2 }); drift(D, 80, 0, -20, 16, 16, 0xff80e0, { y0: 1, y1: 14, size: 8 });
  } else { drift(D, 20, 0, -10, 14, 10, 0xffffff, { y0: 2, y1: 7, size: 4 }); flurry(D, R, 4, { area: [-12, 12, -2, -12], y0: 0, y1: 6, speed: .3 }); }
  scatter(D, rng(131), { area: [-14, 14, -3, 6], petals: hold ? 40 : 6, petal: 0xf4f0f0 });
}
