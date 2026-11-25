// Painted sets: any fight backdrop becomes a 3D set. The painting is lifted into relief with its baked depth map,
// seen from the same camera the fight uses, so the arena matches the map location exactly; the camera can drift,
// push and sweep through it, and real lights, shadows, weather and ground marks sit in front of it.
import { T } from './diorama.js';
const DEP = new URL('./depth/', import.meta.url).href;
let META = null;
export async function setsMeta() { if (!META) META = await fetch(DEP + 'sets.json').then(r => r.json()).catch(() => ({})); return META; }
export function nameOf(url) { if (/(^|\/)arena\.webp/.test(url || '')) return 'ring';   // the main tournament ring
  const m = /bg_([a-z0-9_]+)\.webp/.exec(url || ''); return m ? m[1] : null; }

const FOV = 30, ASP = 1.5, GAP = 3.4, WANT = [[-.5, -.52], [.5, -.52]];
const loadImg = u => new Promise((res, rej) => { const i = new Image(); i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = u; });

// the camera the fight's default framing produces for this set (same math as the arena's solveFit)
function captureCam(c, pitch) {
  const t = Math.tan(FOV * Math.PI / 360), sep = WANT[1][0] - WANT[0][0], xm = 0, ym = WANT[0][1];
  const depth = 2 * GAP / (sep * t * ASP), vx = xm * t * ASP * depth, vy = ym * t * depth;
  const f = new T.Vector3(0, -Math.sin(pitch), -Math.cos(pitch)), u = new T.Vector3(0, Math.cos(pitch), -Math.sin(pitch)), r = new T.Vector3(1, 0, 0);
  const M = new T.Vector3(...c), C = M.clone().sub(r.clone().multiplyScalar(vx)).sub(u.clone().multiplyScalar(vy)).sub(f.clone().multiplyScalar(depth));
  const cam = new T.PerspectiveCamera(FOV, ASP, .1, 500); cam.position.copy(C); cam.lookAt(C.clone().add(f)); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  return { cam, f, C };
}

export async function buildPainted(D, name, imgUrl, c) {
  const meta = (await setsMeta())[name]; if (!meta) throw new Error('no set ' + name);
  const [dimg] = await Promise.all([loadImg(DEP + name + '.webp')]);
  const cv = document.createElement('canvas'); cv.width = dimg.width; cv.height = dimg.height; const g = cv.getContext('2d', { willReadFrequently: true }); g.drawImage(dimg, 0, 0);
  const px = g.getImageData(0, 0, cv.width, cv.height).data, DW = cv.width, DH = cv.height;
  const dAt = (u, v) => { // bilinear inverse depth at uv (0..1, v down), clamped
    u = Math.min(1, Math.max(0, u)) * (DW - 1); v = Math.min(1, Math.max(0, v)) * (DH - 1);
    const x0 = Math.floor(u), y0 = Math.floor(v), x1 = Math.min(DW - 1, x0 + 1), y1 = Math.min(DH - 1, y0 + 1), fx = u - x0, fy = v - y0, s = (x, y) => px[(y * DW + x) * 4] / 255;
    return (s(x0, y0) * (1 - fx) + s(x1, y0) * fx) * (1 - fy) + (s(x0, y1) * (1 - fx) + s(x1, y1) * fx) * fy;
  };
  // the floor sits where the painting's horizon puts it
  const hz = Math.min(.2, Math.max(-.2, meta.hz)), pitch = Math.atan(hz * Math.tan(FOV * Math.PI / 360));
  const { cam, f, C } = captureCam(c, pitch), gy = c[1];
  const ray = (nx, ny) => new T.Vector3(nx, ny, .5).unproject(cam).sub(C).normalize();
  // scale: on the floor rows, view depth = s / inverse-depth
  const ks = [];
  for (let v = .7; v <= .97; v += .02) for (let u = .3; u <= .7; u += .04) {
    const dir = ray(u * 2 - 1, 1 - v * 2); if (dir.y > -.01) continue; const tr = (C.y - gy) / -dir.y, z = tr * dir.dot(f), d = dAt(u, v); if (d > .02) ks.push(z * d);
  }
  ks.sort((a, b) => a - b); const s = ks.length ? ks[ks.length >> 1] : 20, ZF = 150;
  // relief grid with a skirt past the frame so drift and shake never show an edge
  const GW = 260, GH = 176, X0 = -1.45, X1 = 1.45, Y0 = -1.5, Y1 = 1.4;
  const mir = q => q < 0 ? Math.min(1, -q) : q > 1 ? Math.max(0, 2 - q) : q;   // past the frame the painting continues as its own reflection, never a smear
  const pos = new Float32Array((GW + 1) * (GH + 1) * 3), uv = new Float32Array((GW + 1) * (GH + 1) * 2), zs = new Float32Array((GW + 1) * (GH + 1));
  let k = 0;
  for (let j = 0; j <= GH; j++) for (let i = 0; i <= GW; i++, k++) {
    const nx = X0 + (X1 - X0) * i / GW, ny = Y0 + (Y1 - Y0) * j / GH, u = mir((nx + 1) / 2), v = mir((1 - ny) / 2), vr = (1 - ny) / 2, dir = ray(nx, ny);
    let z = Math.min(ZF, s / Math.max(dAt(u, v), s / ZF));
    if (vr > .97 && dir.y < -.01) z = Math.min(z, (C.y - gy) / -dir.y * dir.dot(f));   // below the frame: keep laying floor toward the camera
    zs[k] = z; const p = C.clone().addScaledVector(dir, z / dir.dot(f));
    pos.set([p.x, p.y, p.z], k * 3); uv.set([u, 1 - v], k * 2);
  }
  const idx = [];
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
    const a = j * (GW + 1) + i, b = a + 1, cc = a + GW + 1, d = cc + 1;
    // tear the sheet where depth jumps hard (a lantern in front of a far wall) so nothing smears when the camera moves
    const za = zs[a], zb = zs[b], zc = zs[cc], zd = zs[d], mx = Math.max(za, zb, zc, zd), mn = Math.min(za, zb, zc, zd);
    if (mx / mn > 3.2 && mx - mn > 25) continue;
    idx.push(a, b, cc, b, d, cc);
  }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const map = new T.Texture(); map.colorSpace = T.SRGBColorSpace; map.anisotropy = 4;
  const img = await loadImg(imgUrl); map.image = img; map.needsUpdate = true;
  // the painting carries its own light: it shows as painted (emissive) and real lights add on top of it
  const mat = new T.MeshLambertMaterial({ map, color: 0x4a4a4a, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 1, fog: true });
  // the ground answers the weather: rain rings in the puddles, snow settling over the fight
  const surf = { t: { value: 0 }, rain: { value: 0 }, snow: { value: 0 }, gy: { value: gy }, rainK: 0, snowK: 0 };
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, { uT: surf.t, uRain: surf.rain, uSnow: surf.snow, uGy: surf.gy });
    sh.vertexShader = 'varying vec3 vWp; varying vec3 vWn;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWp=(modelMatrix*vec4(transformed,1.)).xyz; vWn=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader = 'uniform float uT,uRain,uSnow,uGy; varying vec3 vWp; varying vec3 vWn;\nfloat h21(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }\nfloat vn(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+1.),f.x),f.y); }\n' +
      sh.fragmentShader.replace('#include <fog_fragment>', `
  float fl = smoothstep(.72,.93,vWn.y) * smoothstep(1.2,.2,abs(vWp.y-uGy)) * smoothstep(60.,20.,-vWp.z);
  if (uRain > .01 && fl > .01) { vec2 q = vWp.xz*vec2(1.5,2.4); float rr=0.; for(int k=0;k<2;k++){ vec2 c=floor(q+float(k)*.5), f=q+float(k)*.5-c; float ph=h21(c+float(k)*7.); float a=fract(uT*.85+ph); vec2 o=vec2(h21(c+3.),h21(c+9.))*.6+.2; float d=length((f-o)*vec2(1.,.62)); rr+=smoothstep(.035,0.,abs(d-a*.42))*(1.-a); }
    gl_FragColor.rgb += rr*.38*uRain*fl*vec3(.82,.88,1.); }
  if (uSnow > .01 && fl > .01) { float n=vn(vWp.xz*1.7)*.6+vn(vWp.xz*5.3)*.4; float cov=smoothstep(.62-uSnow*.55,.75-uSnow*.5,n)*uSnow*fl; gl_FragColor.rgb=mix(gl_FragColor.rgb,vec3(.82,.86,.96)*(.75+.25*n),cov*.85); }
#include <fog_fragment>`);
  };
  const mesh = new T.Mesh(geo, mat); mesh.receiveShadow = true; mesh.renderOrder = -1; D.scene.add(mesh);
  D.updaters.push((t, dt) => { surf.t.value = t; surf.rain.value += (surf.rainK - surf.rain.value) * Math.min(1, dt * .8); surf.snow.value += (surf.snowK - surf.snow.value) * Math.min(1, dt * .025); });
  // the painting's own lamps come alive: lanterns and fires flicker, neon buzzes and stutters, the moon breathes
  const gtex = (() => { const q = document.createElement('canvas'); q.width = q.height = 128; const x = q.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return new T.CanvasTexture(q); })();
  const glows = [];
  for (const [u, v, sz, r, g2, b, kind] of meta.lights || []) {
    const nx = u * 2 - 1, ny = 1 - v * 2, dir = ray(nx, ny), z = Math.min(ZF * .9, s / Math.max(dAt(u, v), s / ZF)) * .97, p = C.clone().addScaledVector(dir, z / dir.dot(f));
    const wpx = 2 * z * Math.tan(FOV * Math.PI / 360) * ASP, size = Math.max(.25, sz * wpx * (kind === 'moon' ? 3.2 : 2.6));
    const m = new T.Sprite(new T.SpriteMaterial({ map: gtex, color: new T.Color(r / 255, g2 / 255, b / 255), blending: T.AdditiveBlending, transparent: true, depthWrite: false, fog: false, opacity: 0 }));
    m.position.copy(p); m.scale.set(size, size, 1); m.renderOrder = 3; D.scene.add(m); glows.push({ m, kind, ph: Math.random() * 40, base: kind === 'moon' ? .32 : kind === 'neon' ? .3 : .26, buzz: 0 });
  }
  D.updaters.push((t, dt) => { for (const o of glows) { let a;
    if (o.kind === 'fire') a = o.base * (.75 + .18 * Math.sin(t * 9.1 + o.ph) + .12 * Math.sin(t * 23.7 + o.ph * 2));
    else if (o.kind === 'neon') { if (o.buzz > 0) o.buzz -= dt; else if (Math.random() < dt * .06) o.buzz = .25 + Math.random() * .5; a = o.base * (o.buzz > 0 ? (Math.sin(t * 90 + o.ph) > 0 ? .15 : 1) : .95 + .05 * Math.sin(t * 50)); }
    else if (o.kind === 'moon') a = o.base * (.85 + .15 * Math.sin(t * .4 + o.ph));
    else a = o.base * (.7 + .3 * Math.sin(t * 1.3 + o.ph));
    o.m.material.opacity = a; } });
  // back plate: the painting itself, flat and far, behind the relief, so a torn edge shows painted colour instead of a hole
  { const bp = [], bu = [], bi = [], N = 24, zb = ZF * .97;
    for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) { const nx = X0 + (X1 - X0) * i / N, ny = Y0 + (Y1 - Y0) * j / N, dir = ray(nx, ny), p = C.clone().addScaledVector(dir, zb / dir.dot(f));
      bp.push(p.x, p.y, p.z); bu.push(mir((nx + 1) / 2), 1 - mir((1 - ny) / 2)); }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i; bi.push(a, a + 1, a + N + 1, a + 1, a + N + 2, a + N + 1); }
    const bg2 = new T.BufferGeometry(); bg2.setAttribute('position', new T.Float32BufferAttribute(bp, 3)); bg2.setAttribute('uv', new T.Float32BufferAttribute(bu, 2)); bg2.setIndex(bi);
    const pm = new T.Mesh(bg2, new T.MeshBasicMaterial({ map, fog: false, color: 0xb0b0b0 })); pm.renderOrder = -2; D.scene.add(pm); }
  // a back plate in the painting's sky colour behind the torn edges
  const bg = new T.Color(`rgb(${meta.fog.join(',')})`);
  D.scene.background = bg.clone(); D.scene.fog = new T.Fog(bg.clone(), 60, 400);
  // shadows land on an invisible catcher at the fighters' floor
  const sh = new T.Mesh(new T.PlaneGeometry(46, 26), new T.ShadowMaterial({ opacity: .42 })); sh.rotation.x = -Math.PI / 2; sh.position.set(c[0], gy + .012, c[2] - 3); sh.receiveShadow = true; D.scene.add(sh);
  // light: a soft key for shadows only; the painting already has its own lighting
  D.scene.add(new T.AmbientLight(0xffffff, .15));
  const d = D.moon = new T.DirectionalLight(0xc8d0ff, .55); d.position.set(c[0] - 18, gy + 34, c[2] + 14); d.target.position.set(c[0], gy, c[2]);
  d.castShadow = D.renderer.shadowMap.enabled; d.shadow.mapSize.set(2048, 2048); d.shadow.bias = -.0008; d.shadow.normalBias = .02;
  const sc = d.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 120; D.scene.add(d); D.scene.add(d.target);
  const g3 = GAP;
  return {
    c, gap: g3, pitch, cover: ASP, painted: true, surf, indoor: !!meta.indoor, warm: meta.warm, fog: meta.fog, name,
    // relative marks (x as a multiple of the live fighter gap, z as depth behind the clearing): the crew lines up behind its boss
    rel: true, slots: [[1.5, -3.4], [.75, -5.8], [1.95, -7.6]], sum: [-.55, 1.0],
  };
}
