// HD-2D battle backdrop (test): the Moonlit Bamboo Road set rendered behind the normal battle screen.
// Fighters, cards and HUD stay exactly as they are; the set drifts, shakes on hits and sweeps on ultimates.
import { Diorama, T } from './diorama.js';
import { build } from './scene_bamboo.js';

const PRESETS = {
  road:   { c: [-0.6, 0, 2.0], off: [0, 2.2, 8.4], lookY: .45 },
  shrine: { c: [27, 3, -17.2], off: [0, 2.0, 6.9], lookY: .45 },
  bridge: { c: [-16, 1.5, 2.6], off: [0, 2.0, 8.0], lookY: .5 },
};
let D = null, cv = null, built = null, P = PRESETS.road, hitK = 0, hitSide = 1, shake = 0, supT = -1;
const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

function ensure() {
  if (D) return built;
  cv = document.createElement('canvas'); cv.className = 'ls3d';
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;opacity:0;transition:opacity .8s;pointer-events:none';
  const lowEnd = matchMedia('(pointer:coarse)').matches;
  D = new Diorama(cv, { quality: lowEnd ? 'low' : 'high', fogNear: 14, fogFar: 60, fogColor: 0x0c1430 });
  D.camera.fov = 38; D.faceCam = 1; D.paused = true;
  D.post.uniforms.band.value = .3; D.post.uniforms.amt.value = .7;
  built = build(D);
  D.frame((dt, t) => {
    const [cx, cy, cz] = P.c;
    hitK = Math.max(0, hitK - dt * 2.6); shake = Math.max(0, shake - dt * .45);
    let ang = Math.sin(t * .13) * .045, dist = 1;
    if (supT >= 0) { supT += dt; const u = Math.min(1, supT / 1.8); ang = -.22 + ease(u) * .4; dist = 1 - Math.sin(u * Math.PI) * .12; if (supT > 2.2) supT = -1; }
    const k = ease(Math.min(1, hitK));
    const off = new T.Vector3(P.off[0] + Math.sin(t * .21) * .3, P.off[1] + Math.sin(t * .17) * .08, P.off[2] * dist - k * .45);
    off.applyAxisAngle(new T.Vector3(0, 1, 0), ang);
    const fx = cx + hitSide * .35 * k;
    D.camera.position.set(fx + off.x + (Math.random() - .5) * shake, cy + off.y + (Math.random() - .5) * shake, cz + off.z);
    D.camera.lookAt(fx, cy + P.lookY, cz); D.camera.fov = 38 - k * 1.5; D.camera.updateProjectionMatrix();
    D.focus = { x: cx, z: cz }; D.followShadow(new T.Vector3(cx, cy, cz));
  });
  return built;
}
export async function start(host, key) {
  ensure(); P = PRESETS[key] || PRESETS[Object.keys(PRESETS)[Math.random() * 3 | 0]];
  if (cv.parentNode !== host) host.appendChild(cv);
  D.resize(); D.paused = false; await built; requestAnimationFrame(() => { cv.style.opacity = 1; });
}
export function stop() { if (!D) return; cv.style.opacity = 0; setTimeout(() => { if (cv.style.opacity === '0') D.paused = true; }, 900); }
export function hit(side, big) { hitK = big ? 1.3 : .8; hitSide = side === 'e' ? 1 : -1; shake = big ? .1 : .05; }
export function sweep() { supT = 0; }
