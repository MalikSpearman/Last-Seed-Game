// Last Seed · HD-2D diorama engine (shared by free roam and fight stages)
// 3D ground + painted cut-out props as upright billboards, lantern lights, moon shadows,
// fog, fireflies, water, and a tilt-shift pass so it reads like a miniature diorama.
import * as THREE from '../lib/three.module.min.js';

export const T = THREE;
const loader = new THREE.TextureLoader();
const texCache = {};
export function tex(url, o = {}) {
  const k = url + JSON.stringify(o);
  if (texCache[k]) return texCache[k];
  const t = loader.load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (o.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(o.repeat[0], o.repeat[1]); }
  return (texCache[k] = t);
}
const _sz = {};
const imgSize = url => _sz[url] || (_sz[url] = new Promise(r => { const i = new Image(); i.onload = () => r([i.naturalWidth, i.naturalHeight]); i.onerror = () => r([1, 1]); i.src = url; }));

export class Diorama {
  constructor(canvas, opt = {}) {
    this.opt = Object.assign({ quality: 'high', tilt: 1, fogNear: 18, fogFar: 62, fogColor: 0x0d1530 }, opt);
    const hi = this.opt.quality === 'high';
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this._prMax = hi ? 1.25 : 1; r.setPixelRatio(Math.min(devicePixelRatio || 1, this._prMax));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
    r.shadowMap.enabled = hi; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(this.opt.fogColor, this.opt.fogNear, this.opt.fogFar);
    this.scene.background = new THREE.Color(this.opt.fogColor);
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.5, 260);
    this.clock = new THREE.Clock(); this.time = 0;
    this.billboards = []; this.updaters = []; this.lights = [];
    this._post();
    this.resize(); addEventListener('resize', () => this.resize()); try { new ResizeObserver(() => this.resize()).observe(canvas); } catch (_) {}
  }
  resize() {
    if (this.released) return;
    const c = this.renderer.domElement, w = c.clientWidth || innerWidth, h = c.clientHeight || innerHeight;
    // cap the render size (about 2.4 megapixels): the tilt-shift softens it anyway, and a full Retina buffer starves the
    // browser of graphics memory, which shows up as the rest of the page flickering or layers vanishing
    const pr = Math.max(.5, Math.min(devicePixelRatio || 1, this._prMax, Math.sqrt(2.4e6 / Math.max(1, w * h)))); this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this._sizePost(Math.round(w * pr), Math.round(h * pr));
  }
  // ── lighting ──
  moonlight({ color = 0x9fb6ff, intensity = 1.6, dir = [-0.6, 1, 0.45], ambient = 0x2a3466, ambientI = 1.1, sky = 0x5a6cc0, ground = 0x1a2418 } = {}) {
    this.scene.add(new THREE.HemisphereLight(sky, ground, ambientI));
    this.scene.add(new THREE.AmbientLight(ambient, 0.35));
    const d = this.moon = new THREE.DirectionalLight(color, intensity);
    d.position.set(dir[0] * 40, dir[1] * 40, dir[2] * 40);
    d.castShadow = this.renderer.shadowMap.enabled;
    d.shadow.mapSize.set(2048, 2048); d.shadow.bias = -0.0008; d.shadow.normalBias = 0.02;
    const sc = d.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 120;
    this.scene.add(d); this.scene.add(d.target);
  }
  followShadow(p) { if (!this.moon) return; const o = this.moon.position.clone().sub(this.moon.target.position); this.moon.target.position.set(p.x, 0, p.z); this.moon.position.copy(this.moon.target.position).add(o); }
  // lanterns: every lantern registers a light spot; a small fixed pool of real lights follows the
  // nearest ones, so phones never pay for 25 lights and nothing recompiles as you walk
  lantern(x, y, z, { color = 0xffa040, intensity = 22, distance = 9, glow = 1, flicker = true } = {}) {
    this.spots = this.spots || []; this.spots.push({ x, y, z, color: new THREE.Color(color), intensity, distance, ph: x * 1.7 + z });
    if (!this.pool) { const n = this.opt.quality === 'high' ? 8 : 4; this.pool = []; for (let i = 0; i < n; i++) { const L = new THREE.PointLight(0xffa040, 0, 9, 1.6); this.scene.add(L); this.pool.push(L); } }
    if (glow) this.glow(x, y, z, glow * 1.6, color);
  }
  _lights(f) {
    if (!this.pool || !this.spots) return; const t = this.time;
    const near = this.spots.map(s => [s, (s.x - f.x) ** 2 + (s.z - f.z) ** 2]).sort((a, b) => a[1] - b[1]);
    this.pool.forEach((L, i) => { const e = near[i]; if (!e) { L.intensity = 0; return; } const s = e[0];
      L.position.set(s.x, s.y, s.z); L.color.copy(s.color); L.distance = s.distance;
      const fade = Math.max(0, Math.min(1, (26 - Math.sqrt(e[1])) / 8));     // far pool slots fade instead of popping
      L.intensity = s.intensity * fade * (1 + (s.boost || 0)) * (0.9 + 0.06 * Math.sin(t * 7.3 + s.ph) + 0.04 * Math.sin(t * 13.1 + s.ph * 2)); });
  }
  glow(x, y, z, size = 1.5, color = 0xffb060) {
    if (!Diorama._glowTex) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); Diorama._glowTex = new THREE.CanvasTexture(c); }
    const m = new THREE.SpriteMaterial({ map: Diorama._glowTex, color, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: .8, fog: false });
    const s = new THREE.Sprite(m); s.position.set(x, y, z); s.scale.set(size, size, 1); this.scene.add(s);
    this.updaters.push(t => { m.opacity = .7 + .1 * Math.sin(t * 5 + x * 3); }); return s;
  }
  // ── billboards: painted cut-outs standing upright, feet at (x,y,z) ──
  async prop(url, x, z, h, o = {}) {
    const [W, H] = await imgSize(url); const w = h * W / H;
    const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2 - (o.sink || 0) * h, 0);
    const map = tex(url);
    const mat = new THREE.MeshLambertMaterial({ map, alphaTest: 0.45, side: THREE.DoubleSide, emissive: o.emissive || 0x000000, emissiveIntensity: o.emissiveI || 0 });
    if (o.tint) mat.color = new THREE.Color(o.tint);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x, o.y || 0, z); if (o.flip) m.scale.x = -1;
    m.castShadow = o.shadow !== false && this.renderer.shadowMap.enabled; m.receiveShadow = false;
    m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.45 });
    m.userData = { h, w, fadeNear: !!o.fadeNear };
    if (o.fadeNear) { mat.transparent = true; mat.alphaTest = 0.05; mat.depthWrite = false; }
    this.scene.add(m); this.billboards.push(m);
    if (o.sway) { const ph = x * .7 + z; this.updaters.push(t => { const w = this.wind || 1; m.rotation.z = Math.sin(t * (0.9 + (w - 1) * .5) + ph) * o.sway * w; }); }
    if (o.blob !== false) this.blob(x, z, w * (o.blobW || .45), o.y || 0);
    return m;
  }
  blob(x, z, r, y = 0) {
    if (!Diorama._blobTex) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); Diorama._blobTex = new THREE.CanvasTexture(c); }
    const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 1.1), new THREE.MeshBasicMaterial({ map: Diorama._blobTex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, y + 0.02, z); this.scene.add(m); return m;
  }
  // ── animated sprite from an atlas (frames: [x,y,w,h,ax,ay]) ──
  actor(url, frames, pxPerUnit, o = {}) {
    const map = loader.load(url); map.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshLambertMaterial({ map, alphaTest: 0.4, side: THREE.DoubleSide });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.castShadow = this.renderer.shadowMap.enabled;
    m.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map, alphaTest: 0.4 });
    const root = new THREE.Group(); root.add(m); this.scene.add(root);
    const shadow = this.blob(0, 0, 0.55); root.add(shadow); shadow.position.set(0, 0.03, 0);
    const A = { root, mesh: m, map, frames, k: 1 / pxPerUnit, face: 1, anim: 'idle', t: 0, fps: o.fps || 10, glide: o.glide || null, gb: 0, gt: 0,
      set(anim) { if (this.anim !== anim) { this.anim = anim; this.t = 0; } },
      draw() {
        const img = map.image; if (!img || !img.naturalWidth) return;
        const F = this.frames[this.anim] || this.frames.idle; const f = F[Math.floor(this.t * this.fps) % F.length];
        const [x, y, w, h, ax, ay] = f, W = img.naturalWidth, H = img.naturalHeight, k = this.k;
        m.scale.set(w * k, h * k, 1);
        m.position.set((w / 2 - ax) * k * this.face, h * k / 2 - (h - ay) * k, 0); // feet (frame row ay) at y=0
        // hovering glide (e.g. Ito drifting on her strings): lift off the ground, bob, lean into the move, dress sway; the shadow stays down
        if (this.glide) { const G = this.glide[this.anim], dt = 1 / 60; this.gt += dt; if (G) this.cur = G; this.gb += ((G ? 1 : 0) - this.gb) * .1; const g = this.gb, C = this.cur;
          if (C && g > .002) { const s = Math.sin(this.gt * 4.2); m.position.y += g * (C.lift + C.bob * s); m.rotation.z = -this.face * g * (C.lean + C.sway * Math.sin(this.gt * 2.1)); m.scale.x *= 1 + .03 * g * Math.sin(this.gt * 5.3); shadow.scale.setScalar(1 - .25 * g); shadow.material.opacity = 1 - .35 * g; }
          else { m.rotation.z = 0; shadow.scale.setScalar(1); shadow.material.opacity = 1; } }
        if (this.face < 0) { map.offset.set((x + w) / W, 1 - (y + h) / H); map.repeat.set(-w / W, h / H); }
        else { map.offset.set(x / W, 1 - (y + h) / H); map.repeat.set(w / W, h / H); }
      } };
    this.updaters.push((t, dt) => { A.t += dt; A.draw(); });
    return A;
  }
  // ── ground pieces ──
  ground(size = 220, url, rep = 40, color = 0xffffff) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshLambertMaterial({ map: tex(url, { repeat: [rep, rep] }), color }));
    m.rotation.x = -Math.PI / 2; m.receiveShadow = true; this.scene.add(m); return m;
  }
  // a ribbon along a path (array of {x,z,y,w}), textured, with soft edges
  ribbon(pts, url, { texLen = 4, yOff = 0.015, soft = 0.35, color = 0xffffff, widthMul = 1.25 } = {}) {
    const pos = [], uv = [], idx = []; let acc = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let dx = b.x - a.x, dz = b.z - a.z; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
      const nx = -dz, nz = dx, w = p.w * widthMul;
      if (i) acc += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z);
      pos.push(p.x + nx * w, (p.y || 0) + yOff, p.z + nz * w, p.x - nx * w, (p.y || 0) + yOff, p.z - nz * w);
      uv.push(0, acc / texLen, 1, acc / texLen);
      if (i) { const o = i * 2; idx.push(o - 2, o, o - 1, o - 1, o, o + 1); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const map = tex(url, { repeat: [1, 1] });
    const mat = new THREE.MeshLambertMaterial({ map, color, transparent: true, depthWrite: false });
    mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>\n float e = min(vMapUv.x, 1.0 - vMapUv.x); diffuseColor.a *= smoothstep(0.0, ${soft.toFixed(3)}, e);`); };
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.renderOrder = 1; this.scene.add(m); return m;
  }
  water(x, z, w, d, { color = 0x16294f, flow = [0, 1] } = {}) {
    const mat = new THREE.ShaderMaterial({ transparent: true, fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { t: { value: 0 }, col: { value: new THREE.Color(color) }, flow: { value: new THREE.Vector2(...flow) } }]),
      vertexShader: `varying vec2 vUv; varying vec3 vW;
#include <fog_pars_vertex>
        void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; vec4 mvPosition=viewMatrix*w; gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`,
      fragmentShader: `uniform float t; uniform vec3 col; uniform vec2 flow; varying vec2 vUv; varying vec3 vW;
#include <fog_pars_fragment>
        float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
        float n(vec2 p){ vec2 i=floor(p),f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y); }
        void main(){ vec2 p=vW.xz*vec2(1.6,.9)-flow*t*1.3; float a=n(p*1.3)+.5*n(p*3.1+7.)+.25*n(p*7.+3.);
          float streak=smoothstep(1.2,1.5,a); vec3 c=mix(col*.45,col*.85,a*.45)+vec3(.5,.62,.9)*streak*.22;
          float edge=smoothstep(0.,.12,vUv.x)*smoothstep(0.,.12,1.-vUv.x)*smoothstep(0.,.06,vUv.y)*smoothstep(0.,.06,1.-vUv.y);
          gl_FragColor=vec4(c,.88*edge+.04);
#include <fog_fragment>
}` });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 1, 1), mat); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.03, z); mat.depthWrite = false; m.renderOrder = 2; this.scene.add(m);
    this.updaters.push(t => { mat.uniforms.t.value = t; }); return m;
  }
  steps(x0, z0, x1, z1, y0, y1, n, width, url) {
    const grp = new THREE.Group(); const mat = new THREE.MeshLambertMaterial({ map: tex(url, { repeat: [width / 2, .5] }) });
    const mat2 = new THREE.MeshLambertMaterial({ map: tex(url, { repeat: [width / 2, 1] }), color: 0x9a9aa6 });
    for (let i = 0; i < n; i++) {
      const f = i / n, f2 = (i + 1) / n, za = z0 + (z1 - z0) * f, zb = z1, ya = y0 + (y1 - y0) * f2;
      const d = Math.abs(zb - za) + 0.01, b = new THREE.Mesh(new THREE.BoxGeometry(width, ya - y0 + 0.001, d), [mat2, mat2, mat, mat2, mat2, mat2]);
      b.position.set(x0 + (x1 - x0) * f, y0 + (ya - y0) / 2, (za + zb) / 2); b.castShadow = b.receiveShadow = true; grp.add(b);
    }
    this.scene.add(grp); return grp;
  }
  box(x, y, z, w, h, d, url, rep = [4, 4], color = 0xffffff) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ map: tex(url, { repeat: rep }), color }));
    m.position.set(x, y - h / 2, z); m.receiveShadow = true; m.castShadow = true; this.scene.add(m); return m;
  }
  backdrop(url, { z = -70, y = -2, w = 220, h = 70, parallax = .75, x = 0 } = {}) {
    const map = tex(url); map.wrapS = THREE.MirroredRepeatWrapping; map.repeat.x = 3;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map, fog: false, color: 0xb8c2e8 }));
    m.position.set(x, y + h / 2, z); this.scene.add(m); m.userData.parallax = parallax; m.userData.x0 = x; this.backdropMesh = m; return m;
  }
  fireflies(n, cx, cz, rx, rz, { y0 = .3, y1 = 3.5, color = 0xd8ff7a, size = 18 } = {}) {
    const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), s = new Float32Array(n);
    for (let i = 0; i < n; i++) { p[i * 3] = cx + (Math.random() * 2 - 1) * rx; p[i * 3 + 1] = y0 + Math.random() * (y1 - y0); p[i * 3 + 2] = cz + (Math.random() * 2 - 1) * rz; s[i] = Math.random() * 100; }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('seed', new THREE.BufferAttribute(s, 1));
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { t: { value: 0 }, col: { value: new THREE.Color(color) }, sz: { value: size * this.renderer.getPixelRatio() } },
      vertexShader: `uniform float t; uniform float sz; attribute float seed; varying float a;
        void main(){ vec3 q=position+vec3(sin(t*.4+seed)*.9,sin(t*.7+seed*1.3)*.5,cos(t*.35+seed*.7)*.9);
          a=.35+.65*pow(.5+.5*sin(t*2.2+seed*3.),3.); vec4 mv=modelViewMatrix*vec4(q,1.); gl_PointSize=sz*a/(-mv.z)*8.; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 col; varying float a; void main(){ float d=length(gl_PointCoord-.5); float g=smoothstep(.5,0.,d); gl_FragColor=vec4(col*(g*g*1.6),g*a); }` });
    const pts = new THREE.Points(g, mat); this.scene.add(pts); this.updaters.push(t => { mat.uniforms.t.value = t; }); return pts;
  }
  petals(n, cx, cz, r, { color = 0xffb6d5 } = {}) {
    const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3), s = new Float32Array(n);
    for (let i = 0; i < n; i++) { p[i * 3] = cx + (Math.random() * 2 - 1) * r; p[i * 3 + 1] = Math.random() * 6; p[i * 3 + 2] = cz + (Math.random() * 2 - 1) * r; s[i] = Math.random() * 100; }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('seed', new THREE.BufferAttribute(s, 1));
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { t: { value: 0 }, col: { value: new THREE.Color(color) }, sz: { value: 10 * this.renderer.getPixelRatio() } },
      vertexShader: `uniform float t; uniform float sz; attribute float seed; varying float r;
        void main(){ float f=mod(t*.35+seed,6.); vec3 q=position; q.y=6.-f; q.x+=sin(t*.8+seed)*.8+f*.6; q.z+=cos(t*.6+seed)*.5; r=seed;
          vec4 mv=modelViewMatrix*vec4(q,1.); gl_PointSize=sz/(-mv.z)*8.; gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `uniform vec3 col; varying float r; void main(){ vec2 c=gl_PointCoord-.5; c=mat2(cos(r),-sin(r),sin(r),cos(r))*c; float d=length(c*vec2(1.,2.2)); if(d>.5) discard; gl_FragColor=vec4(col,smoothstep(.5,.2,d)); }` });
    const pts = new THREE.Points(g, mat); this.scene.add(pts); this.updaters.push(t => { mat.uniforms.t.value = t; }); return pts;
  }
  // ── post: HDR render → ambient occlusion (from depth) → bloom (mip chain) → tilt-shift + vignette + grade ──
  // the scene renders into a half-float target with a depth texture, so lanterns, neon and fire keep their real
  // brightness and bloom off it; AO reads only the depth buffer, so the painted cut-outs (alpha-tested) shade correctly
  _post() {
    const hi = this.opt.quality === 'high', HF = THREE.HalfFloatType;
    this.fx = Object.assign({ bloom: .28, thr: 1.25, knee: .6, ao: hi ? .45 : 0, aoR: .9, env: .25 }, this.opt.fx || {});
    try { if (/[?&#]fx=0/.test(location.href) || localStorage.getItem('ls_fx') === '0') this.fxOff = true; } catch (_) {}
    const dt = new THREE.DepthTexture(4, 4); dt.type = THREE.UnsignedIntType;
    this.rt = new THREE.WebGLRenderTarget(4, 4, { samples: hi ? 2 : 0, type: HF, depthTexture: dt });
    const mk = (o = {}) => new THREE.WebGLRenderTarget(4, 4, Object.assign({ type: HF, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter }, o));
    this.aoRT = mk(); this.bl = []; for (let i = 0; i < (hi ? 6 : 4); i++) this.bl.push(mk());
    const V = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`;
    const SM = (u, f) => new THREE.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: u, vertexShader: V, fragmentShader: f });
    // ambient occlusion: scalable AO from the depth buffer (normals rebuilt from neighbouring depths), 12 spiral taps, fades out with distance
    this.aoMat = SM({ tDepth: { value: dt }, projInv: { value: new THREE.Matrix4() }, proj: { value: new THREE.Matrix4() }, res: { value: new THREE.Vector2(4, 4) }, R: { value: 1.1 }, far: { value: 40 } },
      `uniform sampler2D tDepth; uniform mat4 projInv, proj; uniform vec2 res; uniform float R, far; varying vec2 vUv;
      vec3 vp(vec2 uv){ float d=texture2D(tDepth,uv).x; vec4 p=projInv*vec4(uv*2.-1.,d*2.-1.,1.); return p.xyz/p.w; }
      void main(){ float d0=texture2D(tDepth,vUv).x; if(d0>.99999){ gl_FragColor=vec4(1.,1e4,0.,1.); return; }
        vec3 P=vp(vUv); vec2 px=1./res;
        vec3 r=vp(vUv+vec2(px.x,0.))-P, l=P-vp(vUv-vec2(px.x,0.)), u=vp(vUv+vec2(0.,px.y))-P, dn=P-vp(vUv-vec2(0.,px.y));
        vec3 N=normalize(cross(abs(r.z)<abs(l.z)?r:l, abs(u.z)<abs(dn.z)?u:dn));
        float rad=R*proj[1][1]*.5/max(.1,-P.z); float ang=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))*6.2832;
        float occ=0.; const int K=12;
        for(int i=0;i<K;i++){ float f=(float(i)+.5)/float(K); float a=ang+float(i)*2.4; vec2 o=vec2(cos(a),sin(a)*res.x/res.y)*rad*f;
          vec3 v=vp(vUv+o)-P; float vv=dot(v,v); occ+=max(0.,dot(N,v)-.02*-P.z)/(vv+.01)*max(0.,1.-vv/(R*R*4.)); }
        float ao=clamp(1.-occ*1.1/float(K),0.,1.); ao=mix(.55,1.,ao); ao=mix(ao,1.,smoothstep(far*.5,far,-P.z));
        gl_FragColor=vec4(ao,-P.z,0.,1.); }`);
    // bloom: soft-threshold bright pass, then down (4 taps) and back up (tent) through the mip chain
    this.brMat = SM({ tD: { value: this.rt.texture }, px: { value: new THREE.Vector2() }, thr: { value: 1 }, knee: { value: .5 }, ex: { value: 1 } },
      `uniform sampler2D tD; uniform vec2 px; uniform float thr,knee,ex; varying vec2 vUv;
      void main(){ vec3 c=(texture2D(tD,vUv+px*vec2(-1,-1)).rgb+texture2D(tD,vUv+px*vec2(1,-1)).rgb+texture2D(tD,vUv+px*vec2(-1,1)).rgb+texture2D(tD,vUv+px*vec2(1,1)).rgb)*.25*ex;
        c=min(c,vec3(24.)); float b=max(c.r,max(c.g,c.b)); float s=clamp(b-thr+knee,0.,2.*knee); s=s*s/(4.*knee+1e-4); float w=max(s,b-thr)/max(b,1e-4);
        gl_FragColor=vec4(c*w,1.); }`);
    this.dnMat = SM({ tD: { value: null }, px: { value: new THREE.Vector2() } },
      `uniform sampler2D tD; uniform vec2 px; varying vec2 vUv;
      void main(){ vec3 c=texture2D(tD,vUv).rgb*4.+texture2D(tD,vUv+px*vec2(-1,-1)).rgb+texture2D(tD,vUv+px*vec2(1,-1)).rgb+texture2D(tD,vUv+px*vec2(-1,1)).rgb+texture2D(tD,vUv+px*vec2(1,1)).rgb; gl_FragColor=vec4(c/8.,1.); }`);
    this.upMat = SM({ tD: { value: null }, px: { value: new THREE.Vector2() } },
      `uniform sampler2D tD; uniform vec2 px; varying vec2 vUv;
      void main(){ vec3 c=texture2D(tD,vUv).rgb*4.; c+=(texture2D(tD,vUv+px*vec2(-1,0)).rgb+texture2D(tD,vUv+px*vec2(1,0)).rgb+texture2D(tD,vUv+px*vec2(0,-1)).rgb+texture2D(tD,vUv+px*vec2(0,1)).rgb)*2.;
        c+=texture2D(tD,vUv+px*vec2(-1,-1)).rgb+texture2D(tD,vUv+px*vec2(1,-1)).rgb+texture2D(tD,vUv+px*vec2(-1,1)).rgb+texture2D(tD,vUv+px*vec2(1,1)).rgb; gl_FragColor=vec4(c/16.,1.); }`);
    this.upMat.blending = THREE.AdditiveBlending; this.upMat.transparent = true;
    this.post = new THREE.ShaderMaterial({ depthTest: false, depthWrite: false,
      uniforms: { tD: { value: this.rt.texture }, tAO: { value: this.aoRT.texture }, tB: { value: this.bl[0].texture }, tDepth: { value: dt }, nf: { value: new THREE.Vector2(.5, 260) },
        aoAmt: { value: 0 }, bAmt: { value: 0 }, bex: { value: 1 }, aoPx: { value: new THREE.Vector2() }, res: { value: new THREE.Vector2(4, 4) }, focus: { value: 0.52 }, band: { value: 0.2 }, amt: { value: 1 }, vig: { value: .42 }, flash: { value: 0 } },
      vertexShader: V,
      fragmentShader: `uniform sampler2D tD,tAO,tB,tDepth; uniform vec2 res,nf,aoPx; uniform float focus,band,amt,vig,flash,aoAmt,bAmt,bex; varying vec2 vUv;
        float lin(float d){ float z=d*2.-1.; return 2.*nf.x*nf.y/(nf.y+nf.x-z*(nf.y-nf.x)); }
        void main(){ float d=abs(vUv.y-focus); float b=smoothstep(band,band+.32,d)*amt; vec2 px=1./res; vec4 c=texture2D(tD,vUv);
          if(b>.01){ vec4 s=c; float w=1.; const int N=12; for(int i=0;i<N;i++){ float a=float(i)*2.39996; float r=sqrt(float(i)+.5)/sqrt(float(N)); vec2 o=vec2(cos(a),sin(a))*r*b*7.*px*res.y/720.; s+=texture2D(tD,vUv+o*vec2(1.,1.)*1.6); w+=1.; } c=mix(c,s/w,clamp(b*1.4,0.,1.)); }
          if(aoAmt>0.){ float z0=lin(texture2D(tDepth,vUv).x), a=0., wt=0.;
            for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec4 q=texture2D(tAO,vUv+vec2(x,y)*aoPx); float k=1./(1.+abs(q.g-z0)*8./max(z0,.5)); a+=q.r*k; wt+=k; }
            c.rgb*=mix(1.,a/max(wt,1e-4),aoAmt); }
          if(bAmt>0.) c.rgb+=texture2D(tB,vUv).rgb*bAmt/max(bex,.01);
          vec2 q=vUv-.5; c.rgb*=1.-vig*dot(q,q)*1.6; c.rgb=mix(c.rgb,c.rgb*vec3(1.04,1.,1.08),.5); c.rgb+=flash; gl_FragColor=vec4(c.rgb,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}` });
    this.postScene = new THREE.Scene(); this.postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this._quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.post); this.postScene.add(this._quad);
  }
  _sizePost(W, H) {
    this.rt.setSize(W, H); this.post.uniforms.res.value.set(W, H);
    const aw = Math.max(1, W >> 1), ah = Math.max(1, H >> 1); this.aoRT.setSize(aw, ah); this.aoMat.uniforms.res.value.set(aw, ah); this.post.uniforms.aoPx.value.set(1 / aw, 1 / ah);
    let w = aw, h = ah; for (const t of this.bl) { t.setSize(Math.max(1, w), Math.max(1, h)); w >>= 1; h >>= 1; }
  }
  // per-set look: { bloom, thr, knee, ao, aoR, env } (a set's PRESET.fx); anything left out keeps the default
  setFX(o = {}) { const hi = this.opt.quality === 'high'; this.fx = Object.assign({ bloom: .28, thr: 1.25, knee: .6, ao: hi ? .45 : 0, aoR: .9, env: .25 }, o); if (!hi) this.fx.ao = 0; if (this.scene.environment) this.scene.environmentIntensity = this.fxOff ? 0 : this.fx.env; }
  // image-based light: a small sky dome painted from the set's own colours (hemisphere sky/ground, fog at the horizon, a hot
  // spot where the moon or sun is) so metal, lacquer, wet stone and glass reflect the set instead of a black void
  envLight(o = {}) {
    const S = this.scene; let sky = null, gnd = null, dir = null, dcol = null;
    S.traverse(x => { if (x.isHemisphereLight && !sky) { sky = x.color.clone().multiplyScalar(Math.min(2, x.intensity)); gnd = x.groundColor.clone().multiplyScalar(Math.min(2, x.intensity)); }
      if (x.isDirectionalLight && !dir) { dir = x.position.clone().sub(x.target.position).normalize(); dcol = x.color.clone().multiplyScalar(Math.min(4, x.intensity)); } });
    const fog = S.fog ? S.fog.color.clone() : new THREE.Color(0x101828);
    sky = o.sky ? new THREE.Color(o.sky) : sky || fog.clone().multiplyScalar(1.6); gnd = o.ground ? new THREE.Color(o.ground) : gnd || fog.clone().multiplyScalar(.5);
    dir = dir || new THREE.Vector3(-.5, .8, .3); dcol = dcol || sky.clone();
    const es = new THREE.Scene();
    es.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
      uniforms: { sky: { value: sky }, gnd: { value: gnd }, hz: { value: fog.clone().lerp(sky, .4) }, sd: { value: dir }, sc: { value: dcol } },
      vertexShader: `varying vec3 vD; void main(){ vD=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
      fragmentShader: `uniform vec3 sky,gnd,hz,sd,sc; varying vec3 vD; void main(){ float y=vD.y; vec3 c=y>0.?mix(hz,sky,pow(y,.6)):mix(hz,gnd,pow(-y,.5));
        c+=sc*pow(max(0.,dot(vD,sd)),24.)*2.5; c+=sc*pow(max(0.,dot(vD,sd)),3.)*.25; gl_FragColor=vec4(c,1.); }` })));
    // a few soft light cards in the lanterns' colours so glossy floors catch warm streaks
    (this.spots || []).slice(0, 6).forEach((s, i) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.2), new THREE.MeshBasicMaterial({ color: s.color.clone().multiplyScalar(.9), side: THREE.DoubleSide }));
      const a = i * 1.05 + .4; m.position.set(Math.cos(a) * 8, 1.5 + (i % 3), Math.sin(a) * 8); m.lookAt(0, 0, 0); es.add(m); });
    const pm = new THREE.PMREMGenerator(this.renderer), rt = pm.fromScene(es, .03); pm.dispose();
    es.traverse(x => { if (x.geometry) x.geometry.dispose(); if (x.material) x.material.dispose(); });
    if (S.environment && S.environment.dispose) S.environment.dispose();
    S.environment = rt.texture; S.environmentIntensity = this.fxOff ? 0 : (o.env != null ? o.env : this.fx.env); return rt.texture;
  }
  _render() {
    const r = this.renderer, fx = this.fx, off = this.fxOff, q = this._quad, U = this.post.uniforms;
    r.setRenderTarget(this.rt); r.render(this.scene, this.camera);
    const blit = (mat, tgt) => { q.material = mat; r.setRenderTarget(tgt); r.render(this.postScene, this.postCam); };
    const ao = !off && fx.ao > 0, bl = !off && fx.bloom > 0;
    if (ao) { const A = this.aoMat.uniforms, cam = this.camera; A.proj.value.copy(cam.projectionMatrix); A.projInv.value.copy(cam.projectionMatrixInverse); A.R.value = fx.aoR;
      A.far.value = this.scene.fog ? this.scene.fog.far : 60; blit(this.aoMat, this.aoRT); }
    if (bl) { const B = this.brMat.uniforms; B.thr.value = fx.thr; B.knee.value = fx.knee; B.ex.value = r.toneMapping === THREE.NoToneMapping ? 1 : r.toneMappingExposure; B.px.value.set(.5 / this.rt.width, .5 / this.rt.height); blit(this.brMat, this.bl[0]);
      for (let i = 1; i < this.bl.length; i++) { this.dnMat.uniforms.tD.value = this.bl[i - 1].texture; this.dnMat.uniforms.px.value.set(1 / this.bl[i - 1].width, 1 / this.bl[i - 1].height); blit(this.dnMat, this.bl[i]); }
      r.autoClear = false; for (let i = this.bl.length - 1; i > 0; i--) { this.upMat.uniforms.tD.value = this.bl[i].texture; this.upMat.uniforms.px.value.set(1 / this.bl[i].width, 1 / this.bl[i].height); blit(this.upMat, this.bl[i - 1]); } r.autoClear = true; }
    U.aoAmt.value = ao ? fx.ao : 0; U.bAmt.value = bl ? fx.bloom : 0; U.bex.value = r.toneMapping === THREE.NoToneMapping ? 1 : r.toneMappingExposure; U.nf.value.set(this.camera.near, this.camera.far);
    q.material = this.post; r.setRenderTarget(null); r.render(this.postScene, this.postCam);
  }
  // give the graphics memory back while the set isn't on screen (between fights), and take it again when it is
  release() { if (this.released) return; this.released = true; this.paused = true; this._sizePost(1, 1); this.renderer.setSize(1, 1, false); if (this.moon) { this.moon.shadow.map && this.moon.shadow.map.dispose(); this.moon.shadow.map = null; } this.renderer.renderLists.dispose(); }
  restore() { if (!this.released) return; this.released = false; this.resize(); }
  // fade foreground props that stand between the camera and a point (HD-2D "see-through")
  fadeFor(p) {
    for (const m of this.billboards) {
      if (!m.userData.fadeNear) continue;
      const dz = m.position.z - p.z, dx = Math.abs(m.position.x - p.x);
      const cover = dz > 0.3 && dz < 9 && dx < m.userData.w * .55 + .6;
      const tgt = cover ? .28 : 1; m.material.opacity += (tgt - m.material.opacity) * .15;
    }
  }
  frame(cb) {
    const loop = () => {
      if (this.dead) return;
      requestAnimationFrame(loop);
      if (this.paused || (this.skip && this.skip())) { this.clock.getDelta(); return; }
      const dt = Math.min(this.clock.getDelta(), 1 / 20); this.time += dt;
      cb && cb(dt, this.time);
      if (this.dead) return;
      for (const u of this.updaters) u(this.time, dt);
      this._lights(this.focus || this.camera.position);
      if (this.faceCam) { const c = this.camera.position; for (const m of this.billboards) m.rotation.y = Math.atan2(c.x - m.position.x, c.z - m.position.z) * this.faceCam; }
      if (this.backdropMesh) { const b = this.backdropMesh; b.position.x = b.userData.x0 + this.camera.position.x * b.userData.parallax; }
      this._render();
    };
    loop();
  }
}
