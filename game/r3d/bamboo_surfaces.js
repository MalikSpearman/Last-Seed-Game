// Shared walking and combat surfaces at the Red Bridge landings.
import { T, tex } from './diorama.js';
import { P, PE, PW } from './scene_bamboo.js';

const image = name => new URL('./img/' + name + '.webp', import.meta.url).href;
const repeat = { repeat: [1, 1] };
const roadY = .012;
const stoneTile = 3.1;
const threshold = .38;
const halfDeck = 1.3;
const centerZ = P[3].z;

function texture(name) {
  return tex(image(name), repeat);
}

function groundMesh(D, geometry, material) {
  const mesh = new T.Mesh(geometry, material);
  mesh.receiveShadow = true;
  D.scene.add(mesh);
  return mesh;
}

const earthProfile = [
  [1.24, -.028, 0x525344], [1.03, .004, 0x857458], [.72, .025, 0xaa916a],
  [.35, .018, 0x9d8058], [0, .043, 0xbe9b6b], [-.35, .018, 0x9b7d54],
  [-.72, .025, 0xae936a], [-1.03, .004, 0x7b7051], [-1.27, -.028, 0x515244],
];
const variation = seed => (Math.sin(seed * 87.31 + 3.2) * 43758.5453 % 1 + 1) % 1;

function makeSurface(D, positions, uv, colors, indices, material, name) {
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
  geometry.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = groundMesh(D, geometry, material);
  mesh.name = name;
  return mesh;
}

function roadPoint(points, x) {
  const next = points.findIndex(p => p.x >= x);
  const i = Math.max(1, next < 0 ? points.length - 1 : next);
  const a = points[i - 1], b = points[i];
  const u = T.MathUtils.clamp((x - a.x) / (b.x - a.x), 0, 1);
  return { z: T.MathUtils.lerp(a.z, b.z, u), w: T.MathUtils.lerp(a.w, b.w, u) };
}

function shoulderBed(D, points, landingAtStart) {
  const positions = [], uv = [], colors = [], indices = [];
  const first = points[0].x, last = points.at(-1).x;
  const length = Math.ceil((last - first) / .9);
  const count = earthProfile.length;
  const tint = new T.Color(), joint = new T.Color(0x77756b);
  for (let row = 0; row <= length; row++) {
    const x = T.MathUtils.lerp(first, last, row / length);
    const { z, w } = roadPoint(points, x);
    const distance = landingAtStart ? x - first : last - x;
    const approach = T.MathUtils.smoothstep(distance, 0, 1.8);
    for (const [i, [side, elevation, color]] of earthProfile.entries()) {
      const edge = Math.abs(side);
      const offset = T.MathUtils.lerp(T.MathUtils.clamp(side, -1, 1),
        side + (edge > .7 ? (variation(row * 13 + i * 5) - .5) * .16 : 0), approach);
      const crown = T.MathUtils.lerp(roadY - .011, elevation, approach);
      const pz = z + offset * w;
      positions.push(x, crown, pz);
      uv.push(x / 3.65, pz / 3.65);
      tint.set(color).lerp(joint, 1 - T.MathUtils.smoothstep(edge, .91, 1.17)).multiplyScalar(.91 + variation(row * 13 + i * 3) * .14);
      colors.push(tint.r, tint.g, tint.b);
      if (row && i) {
        const b = row * count + i, a = b - count;
        indices.push(a - 1, b - 1, a, a, b - 1, b);
      }
    }
  }
  return makeSurface(D, positions, uv, colors, indices,
    new T.MeshLambertMaterial({ map: texture('t_dirt'), vertexColors: true }), 'Shoulders and bed beneath stone');
}

let rockGrain;
function stoneGrain() {
  if (rockGrain) return rockGrain;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const g = canvas.getContext('2d');
  g.fillStyle = '#b1afb1';
  g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 2600; i++) {
    const x = variation(i * 7) * 128, y = variation(i * 11 + 1) * 128;
    g.fillStyle = i % 4 < 2 ? '#352c392c' : '#f2e9dd3a';
    g.fillRect(x, y, .6 + variation(i * 3) * 3, .5 + variation(i * 13) * 1.3);
  }
  rockGrain = new T.CanvasTexture(canvas);
  rockGrain.colorSpace = T.SRGBColorSpace;
  rockGrain.wrapS = rockGrain.wrapT = T.RepeatWrapping;
  rockGrain.anisotropy = 4;
  return rockGrain;
}

let slabMap;
function wornStone() {
  if (slabMap) return slabMap;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const g = canvas.getContext('2d');
  for (let tile = 0; tile < 12; tile++) {
    const left = (tile % 4) * 128, top = Math.floor(tile / 4) * 128;
    g.save();
    g.translate(left, top);
    g.fillStyle = '#b9b5ad';
    g.fillRect(0, 0, 128, 128);
    const stain = g.createRadialGradient(34 + variation(tile) * 62, 48, 5, 54, 57, 78);
    stain.addColorStop(0, '#e1d8c520');
    stain.addColorStop(.65, '#706b6620');
    stain.addColorStop(1, '#55524d56');
    g.fillStyle = stain;
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 170; i++) {
      const seed = tile * 193 + i * 23;
      const x = variation(seed) * 128, y = variation(seed + 7) * 128;
      g.fillStyle = i % 3 ? '#5047452b' : '#e8e0cc41';
      g.fillRect(x, y, .6 + variation(seed + 9) * 2.1, .65 + variation(seed + 11) * 1.3);
    }
    // Only a few atlas faces have a fine fracture or a chipped edge.
    if (tile === 3 || tile === 10) {
      const x = tile === 3 ? 17 : 91, side = tile === 3 ? 1 : -1;
      g.strokeStyle = '#4c433cc0';
      g.lineWidth = 1.35;
      g.beginPath();
      g.moveTo(x, 7);
      g.lineTo(x + 6 * side, 23);
      g.lineTo(x + 4 * side, 32);
      g.lineTo(x + 14 * side, 43);
      g.lineTo(x + 16 * side, 54);
      g.stroke();
      g.strokeStyle = '#e4dcc07a';
      g.lineWidth = .9;
      g.beginPath();
      g.moveTo(x + 2, 8);
      g.lineTo(x + 6 * side + 2, 23);
      g.lineTo(x + 4 * side + 2, 32);
      g.stroke();
    }
    if (tile % 5 === 1) {
      g.fillStyle = '#5f5a4b73';
      g.fillRect(6, 68 + tile * 2, 9 + tile, 3);
      g.fillStyle = '#dad1b676';
      g.fillRect(9, 71 + tile * 2, 7, 1.25);
    }
    g.restore();
  }
  slabMap = new T.CanvasTexture(canvas);
  slabMap.colorSpace = T.SRGBColorSpace;
  slabMap.anisotropy = 8;
  return slabMap;
}

function slabBatch(D, name) {
  const positions = [], uv = [], colors = [], indices = [];
  const tint = new T.Color();
  const material = new T.MeshLambertMaterial({ map: wornStone(), vertexColors: true });
  function add(sample, seed, color) {
    const atlas = Math.floor(variation(seed + 122) * 12);
    const chips = .018 + variation(seed + 8) * .07;
    const outline = [[0, chips], [chips, 0], [.965, 0], [1, .035],
      [1, .955], [.955, 1], [.033, 1], [0, .965]];
    const base = positions.length / 3;
    tint.set(color).multiplyScalar(.92 + variation(seed + 13) * .15);
    for (let ring = 0; ring < 2; ring++) {
      for (const [u, v] of outline) {
        const inset = ring ? .016 : 0;
        const [x, y, z] = sample(T.MathUtils.lerp(inset, 1 - inset, u), T.MathUtils.lerp(inset, 1 - inset, v));
        positions.push(x, y - (ring ? 0 : .022), z);
        const tx = (atlas % 4 * 128 + 5 + 118 * u) / 512;
        const ty = 1 - (Math.floor(atlas / 4) * 128 + 5 + 118 * v) / 384;
        uv.push(tx, ty);
        const shade = ring ? 1 : .59;
        colors.push(tint.r * shade, tint.g * shade, tint.b * shade);
      }
    }
    for (let i = 1; i < 7; i++) indices.push(base + 8, base + 8 + i, base + 9 + i);
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8;
      indices.push(base + i, base + j, base + 8 + i, base + j, base + 8 + j, base + 8 + i);
    }
  }
  return { add, finish: () => makeSurface(D, positions, uv, colors, indices, material, name) };
}

function flagstones(D, points, landingAtStart) {
  const first = points[0].x, last = points.at(-1).x;
  const rows = 5, stagger = [.64, .97, .58, .9, .7];
  const batches = [];
  const tint = new T.Color(), warmStone = new T.Color(0xa39985);
  const palette = [0x8d9695, 0x858d90, 0x92958e, 0x929ba0, 0x858e92];
  for (let lane = 0; lane < rows; lane++) {
    let left = first;
    for (let n = 0; last - left > .002; n++) {
      const seed = lane * 163 + n * 17 + (landingAtStart ? 973 : 0);
      const size = n ? .78 + variation(seed + 1) * .5 : stagger[lane];
      const right = last - left < size + .24 ? last : left + size;
      const south = 1 - lane * 2 / rows - .008, north = south - (2 / rows - .016);
      const warm = T.MathUtils.smoothstep(left, 43, 70);
      tint.set(palette[Math.floor(variation(seed + 2) * palette.length)]).lerp(warmStone, warm * .58);
      const height = .048 + variation(seed + 4) * .011;
      const section = Math.floor((left - first) / 19);
      const batch = batches[section] ??= slabBatch(D, 'Continuous weathered paving');
      batch.add((u, v) => {
        const x = T.MathUtils.lerp(left, right, u);
        const road = roadPoint(points, x);
        const distance = landingAtStart ? x - first : last - x;
        const rise = height * T.MathUtils.smoothstep(distance, 0, .95);
        return [x, roadY + rise, road.z + road.w * T.MathUtils.lerp(south, north, v)];
      }, seed, tint);
      left = right + Math.min(.025, (last - right) * .14);
    }
  }
  for (const batch of batches) batch.finish();
}

export function buildBambooApproaches(D, fullRoad = false) {
  const west = [
    ...(fullRoad ? [{ ...PW[0], x: -112 }, ...PW.slice(0, -1)] : []),
    ...P.slice(0, 3), { x: -24.9, z: centerZ, w: 1.48 },
    { x: P[3].x - threshold, z: centerZ, w: halfDeck },
  ];
  const east = [
    { x: P[9].x + threshold, z: centerZ, w: halfDeck },
    { x: -7.1, z: centerZ, w: 1.55 }, ...P.slice(10, fullRoad ? 15 : 16),
    ...(fullRoad ? [...PE, { ...PE.at(-1), x: 94 }] : []),
  ];
  shoulderBed(D, west, false);
  shoulderBed(D, east, true);
  flagstones(D, west, false);
  flagstones(D, east, true);
}

export function buildBridgeChannel(D, depth, width, groundColor, waterColor) {
  const center = -16, channel = 7.4, edge = channel / 2;
  const bank = new T.MeshLambertMaterial({ map: stoneGrain(), color: 0x4c6570 });
  for (const direction of [-1, 1]) {
    const span = width / 2 - edge;
    const ground = groundMesh(D, new T.PlaneGeometry(span, depth),
      new T.MeshLambertMaterial({ map: tex(image('t_moss'), { repeat: [span / 4.35, depth / 4.35] }), color: groundColor }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.x = center + direction * (edge + span / 2);
    const bankGeometry = new T.PlaneGeometry(1.1, depth, 1, 14);
    bankGeometry.rotateX(-Math.PI / 2);
    const positions = bankGeometry.attributes.position, uv = bankGeometry.attributes.uv;
    for (let i = 0; i < positions.count; i++) {
      const outer = direction * positions.getX(i) > 0;
      const z = positions.getZ(i);
      positions.setXYZ(i, center + direction * (outer ? edge : edge - .95 + Math.sin(z * .42 + direction) * .13),
        outer ? 0 : -.58, z);
      uv.setXY(i, outer ? 0 : .75, z * .5);
    }
    bankGeometry.computeVertexNormals();
    groundMesh(D, bankGeometry, bank);
  }
  const bed = groundMesh(D, new T.PlaneGeometry(channel - 1.5, depth), bank);
  bed.rotation.x = -Math.PI / 2;
  bed.position.set(center, -.6, 0);
  const water = D.water(center, -4, channel - .8, Math.min(depth, 77), { color: waterColor, flow: [0, .55] });
  water.position.y = -.33;
  // Exposed shale shelves break the straight channel into alternating pools and banks.
  const count = 34;
  const rock = new T.IcosahedronGeometry(1, 1);
  const rockPoints = rock.attributes.position, rockUV = rock.attributes.uv;
  const strata = [];
  for (let i = 0; i < rockPoints.count; i++) {
    const x = rockPoints.getX(i), y = rockPoints.getY(i), z = rockPoints.getZ(i);
    const surface = 1 + .14 * Math.sin(x * 11 + z * 4) + .08 * Math.sin(y * 13 + z * 9);
    const layer = .75 + .20 * Math.sin(y * 14 + x * 2) + .05 * Math.cos(z * 13);
    rockPoints.setXYZ(i, x * surface + .19 * y, Math.min(.76, y * surface), z * surface);
    rockUV.setXY(i, (x + z) * .88, (y + z * .35) * .93);
    strata.push(layer * .87, layer, layer * .96);
  }
  rock.setAttribute('color', new T.Float32BufferAttribute(strata, 3));
  const outcrops = new T.InstancedMesh(rock,
    new T.MeshLambertMaterial({ map: stoneGrain(), vertexColors: true }), count);
  const transform = new T.Object3D(), tint = new T.Color();
  for (let i = 0; i < count; i++) {
    const side = i < count / 2 ? -1 : 1, row = i % (count / 2);
    const z = -22 + row * 2.45 + variation(i + 90) * 1.67;
    const openCrossing = Math.abs(z - centerZ) < 2.4;
    const height = openCrossing ? .26 : .38 + variation(i * 13) * .75;
    transform.position.set(center + side * (edge - .22 + variation(i + 8) * .47), height * .22 - .42, z);
    transform.rotation.set(.08 + variation(i + 15) * .16, variation(i * 11) * 3, (variation(i + 6) - .5) * .23);
    transform.scale.set(.54 + variation(i * 3) * .4, height, .68 + variation(i * 19) * 1.23);
    transform.updateMatrix();
    outcrops.setMatrixAt(i, transform.matrix);
    outcrops.setColorAt(i, tint.set([0x6c7969, 0x69797a, 0x7e827c, 0x506b5d][i % 4]));
  }
  rock.addEventListener('dispose', () => outcrops.dispose());
  outcrops.receiveShadow = true;
  D.scene.add(outcrops);
}

export function addBridgeSills(D) {
  const masonry = new T.MeshLambertMaterial({ map: stoneGrain(), color: 0x71828b });
  const capstone = new T.MeshLambertMaterial({ map: stoneGrain(), color: 0x858981 });
  const ashlar = [0x5d7074, 0x75848a, 0x647378].map(color =>
    new T.MeshLambertMaterial({ map: stoneGrain(), color }));
  function laidBlock(x, y, z, w, h, d, material) {
    const mesh = groundMesh(D, new T.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    return mesh;
  }
  for (const [edge, side] of [[P[3].x, -1], [P[9].x, 1]]) {
    // Staggered stone courses carry the timber ramps into the bank on either shoulder.
    for (const shoulder of [-1, 1]) {
      const z = centerZ + shoulder * 1.42;
      for (let i = 0; i < 3; i++) {
        const x = edge - side * (.5 + i * .58);
        const rise = .17 + i * .22;
        laidBlock(x, rise / 2 - .10, z, .57, rise + .11, .43, ashlar[(i + (shoulder > 0 ? 1 : 0)) % 3]);
        laidBlock(x, rise - .055, z, .575, .092, .48, capstone);
      }
      // The buttress ends low so the walking and counter cameras retain the side profile.
      laidBlock(edge - side * 1.95, .12, z, .27, .42, .5, masonry);
    }
    for (const i of [0, 1]) {
      laidBlock(edge - side * (1.3 + i * .56), .03 + i * .09, centerZ,
        .54, .19 + i * .18, 2.5, ashlar[i]);
    }
    const geometry = new T.BoxGeometry(threshold, .18, halfDeck * 2);
    const pos = geometry.attributes.position, uv = geometry.attributes.uv;
    // Masonry meets the same world-scaled grain as the road at the cap.
    for (let i = 8; i < 12; i++) {
      uv.setXY(i, (pos.getX(i) + edge + side * threshold / 2) / stoneTile, (pos.getZ(i) + centerZ) / stoneTile);
    }
    const sill = groundMesh(D, geometry, masonry);
    sill.name = 'Bridge stone sill';
    sill.position.set(edge + side * threshold / 2, roadY - .09, centerZ);
  }
}

export function buildShrineStairs(D) {
  const foot = P[16], top = P[17], steps = 12;
  const material = new T.MeshLambertMaterial({ map: texture('t_stone'), color: 0x99958c });
  const earth = new T.MeshLambertMaterial({ map: tex(image('t_dirt'), { repeat: [.9, 5.2] }), color: 0x736f58 });
  const paving = slabBatch(D, 'Shrine stair and court paving');
  function course(x, front, back, elevation, width) {
    const height = elevation + .035;
    const geometry = new T.BoxGeometry(width, height, front - back);
    const position = geometry.attributes.position, uv = geometry.attributes.uv;
    const center = (front + back) / 2;
    for (let i = 0; i < position.count; i++) {
      const px = position.getX(i), py = position.getY(i), pz = position.getZ(i);
      uv.setXY(i, (i < 8 ? pz + center : px + x) / stoneTile,
        (i >= 8 && i < 16 ? pz + center : py + elevation - height / 2) / stoneTile);
    }
    const mesh = groundMesh(D, geometry, material);
    mesh.position.set(x, elevation - height / 2, center);
    mesh.castShadow = true;
  }
  function cover(x, width, front, back, elevation, row) {
    const left = x - width / 2, right = x + width / 2;
    const first = .53 + variation(row + 33) * .54;
    for (let column = 0, a = left; right - a > .01; column++) {
      const seed = row * 223 + column * 29;
      const block = column ? .87 + variation(seed + 19) * .32 : first;
      const b = right - a < block + .31 ? right : a + block;
      paving.add((u, v) => [T.MathUtils.lerp(a, b, u), elevation,
        T.MathUtils.lerp(front - .008, back + .009, v)], seed,
      [0x8e9696, 0x92988e, 0x9b9e95, 0x939797][Math.floor(variation(seed + 28) * 4)]);
      a = b + .016;
    }
  }
  const stride = (foot.z - top.z) / steps;
  for (let i = 0; i < steps; i++) {
    const front = foot.z - i * stride;
    const elevation = top.y * (i + 1) / steps;
    course(foot.x, front, front - stride, elevation - .021, foot.w * 2);
    cover(foot.x, foot.w * 2, front, front - stride, elevation, i);
  }
  // The outer wings are raised planting beds, with continuous masonry beneath the court.
  const courtWidth = 11.2, courtBack = -24, courtRows = 19;
  course(top.x, top.z, courtBack, top.y - .021, 16);
  for (let i = 0; i < courtRows; i++) {
    const front = T.MathUtils.lerp(top.z, courtBack, i / courtRows);
    const back = T.MathUtils.lerp(top.z, courtBack, (i + 1) / courtRows);
    cover(top.x, courtWidth, front, back, top.y, steps + i);
  }
  paving.finish();
  const bedDepth = top.z - courtBack;
  for (const side of [-1, 1]) {
    const bed = groundMesh(D, new T.PlaneGeometry((16 - courtWidth) / 2, bedDepth), earth);
    bed.rotation.x = -Math.PI / 2;
    bed.position.set(top.x + side * (16 + courtWidth) / 4, top.y - .006, (top.z + courtBack) / 2);
    const edging = groundMesh(D, new T.BoxGeometry(.12, .085, bedDepth), material);
    edging.position.set(top.x + side * (courtWidth / 2 + .06), top.y - .007, bed.position.z);
  }
}
