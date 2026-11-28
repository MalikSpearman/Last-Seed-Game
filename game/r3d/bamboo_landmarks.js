// Near architecture and rooted planting masses for the walk through Bamboo Road.
import { T, tex } from './diorama.js';

const asset = name => new URL('./img/' + name, import.meta.url).href;
const stoneGrain = () => tex(asset('t_stone.webp'), { repeat: [1.8, .7] });

export function dressBambooLandmarks(D, { box, place, lacquer, paper, iron, lantern, canopy }) {
  const timber = new T.MeshStandardMaterial({ color: 0x5a3934, roughness: .96 });
  const blueTimber = new T.MeshStandardMaterial({ color: 0x293a49, roughness: .91 });
  const wall = new T.MeshLambertMaterial({ map: stoneGrain(), color: 0x536066 });
  const stone = new T.MeshStandardMaterial({ color: 0x667277, roughness: .98 });
  const copper = new T.MeshStandardMaterial({ color: 0xa77854, roughness: .74, metalness: .18 });
  const shell = new T.CylinderGeometry(.105, .116, .25, 10);
  function retaining(x, z, length, y, height) {
    box(length, height, .77, wall, x, y + height / 2, z, true);
    const count = Math.ceil(length / 1.02), step = length / count;
    for (let i = 0; i < count; i++) {
      const cap = box(step - .023, .10, .89, stone, x - length / 2 + step * (i + .5),
        y + height + .05, z + .03 * Math.sin(x + i));
      cap.rotation.y = .027 * Math.cos(i * 2.4 + x);
    }
  }
  function toriiDetail(x, z, y, width, style) {
    const dark = style === 'west' ? blueTimber : lacquer;
    for (const side of [-1, 1]) {
      const px = x + side * width / 2;
      box(.34, 2.72, .41, dark, px, y + 1.36, z, true);
      box(.55, .21, .58, stone, px, y + .105, z);
      box(.41, .105, .47, copper, px, y + .3, z);
    }
    box(width + .44, .17, .33, timber, x, y + 2.27, z);
    box(width + .83, .19, .48, blueTimber, x, y + 2.79, z, true);
    for (const side of [-1, 1]) {
      const end = box(.48, .14, .49, blueTimber, x + side * (width / 2 + .55), y + 2.83, z);
      end.rotation.z = side * .17;
    }
  }
  function lanternLine(x, z, y, width, count) {
    const rope = new T.MeshLambertMaterial({ color: 0x57453b });
    const points = [-1, -.5, 0, .5, 1].map(s => new T.Vector3(x + s * width / 2, y - .43 * (1 - s * s), z));
    place(new T.TubeGeometry(new T.CatmullRomCurve3(points), 12, .021, 4, false), rope, 0, 0, 0);
    for (let i = 0; i < count; i++) {
      const s = (i + 1) / (count + 1) * 2 - 1;
      const lampY = y - .43 * (1 - s * s) - .24, px = x + s * width / 2;
      const body = place(shell, paper, px, lampY, z);
      const crown = place(canopy, iron, px, lampY + .16, z);
      crown.scale.setScalar(.55);
      D.updaters.push(t => { body.rotation.z = crown.rotation.z = .045 * Math.sin(t * 1.6 + i * 1.7 + x); });
    }
  }
  function awning(x, z, y, width) {
    for (const side of [-1, 1]) box(.13, 2.30, .18, timber, x + side * width / 2, y + 1.15, z, true);
    const roof = box(width + .37, .14, .94, blueTimber, x, y + 2.33, z - .20, true);
    roof.rotation.x = -.17;
    box(width + .42, .09, .145, copper, x, y + 2.28, z + .24);
  }

  // The shelter steps and veranda project out from the painted ink frontage.
  for (const [z, w, h] of [[-7.7, 8.1, .22], [-7.10, 3.15, .11]]) {
    box(w, h, .91, wall, -87.1, h / 2, z, true);
  }
  retaining(-91.1, -3.65, 2.4, 0, .21);
  D.lantern(-87.7, 1.28, -7.13, {color:0xf4ad73,intensity:7,distance:7,glow:.29});

  // An older pine-blue gate and irregular retaining caps frame the pilgrimage precinct.
  toriiDetail(-53, -5.25, .25, 3.8, 'west');
  retaining(-58.1, -2.94, 3.2, 0, .32);
  retaining(-47.25, -3.05, 2.95, 0, .25);
  place(lantern, paper, -53, 2.69, -4.97).scale.setScalar(.7);

  // Low mooring stones frame the crossing mouth below the silhouettes.
  for (const [x,z] of [[-22.1,4.5],[-9.9,4.55],[-22.35,-.2],[-9.7,-.18]]) {
    box(.37, .52, .38, wall, x, .22, z);
    box(.45, .11, .47, stone, x, .53, z);
  }

  // The lantern workshop and festival eaves are genuinely dimensional in the walking camera.
  awning(8.5, -4.3, 0, 5.85);
  lanternLine(8.5, -3.98, 2.23, 5.6, 6);
  retaining(11.1, -2.25, 2.1, 0, .22);
  D.lantern(8.3, 1.28, -3.9, {color:0xffa877,intensity:6,distance:5.7,glow:.18});
  retaining(49.2, -2.3, 3.7, 0, .25);
  awning(73.7, -4.75, 0, 7.6);
  lanternLine(73.7, -4.33, 2.81, 7.5, 7);
  D.lantern(74.0, 1.76, -3.9, {color:0xffb385,intensity:8,distance:7.3,glow:.28});

  // The central façade is backed by a narrow stage at the far edge of the shrine court.
  box(10.36, .22, 1.08, wall, 27, 3.08, -22, true);
  box(3.65, .11, .38, stone, 27, 3.052, -21.35, true);
  for (const side of [-1, 1]) {
    retaining(27 + side * 6.58, -17.2, 1.65, 3, .17);
    const x = 27 + side * 4.05;
    D.lantern(x, 4.58, -21.1, {color:0xffbc8e,intensity:7.5,distance:6.3,glow:.2});
  }
}
