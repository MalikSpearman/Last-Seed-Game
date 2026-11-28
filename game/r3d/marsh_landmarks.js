import { T } from './diorama.js';
import { ctex, cvs, pbr, rng } from './kit.js';

export function ferryLanding(D, K, M) {
  const { box, add } = K;
  box(5.1, .24, 1.18, M.wood, 0, -.61, -4.4);
  for (const x of [-2.45, 2.45]) {
    box(.31, 2.66, .31, M.old, x, -.64, -4.53);
    box(.41, .12, .41, M.stone, x, 1.95, -4.53);
    add(new T.TorusGeometry(.17,.026,5,12), M.rope, x, .61, -4.36, { cast:false });
  }
  box(5.45,.16,.25,M.old,0,2.02,-4.53);
  const paper = new T.MeshStandardMaterial({ color:0xcbcec0, emissive:0x687d52, emissiveIntensity:.62 });
  const g = new T.CylinderGeometry(.16,.19,.38,10);
  for (const x of [-1.25, 1.25]) {
    const lantern = add(g,paper,x,1.55,-4.43,{cast:false});
    D.updaters.push(t => { lantern.rotation.z = .09*Math.sin(t*1.08+x); });
  }
}

export function templeWaterline(D, K, M) {
  const { box, add } = K;
  // Four water marks carved into the same bands as the stone at the waterline.
  const ink = ctex(cvs(256,64,(g,w,h)=>{
    g.fillStyle='#264653';g.fillRect(0,0,w,h);
    for (let i=0;i<3;i++) {
      g.strokeStyle=['#557674','#365b62','#8a8d74'][i];
      g.lineWidth=1.4+i;g.beginPath();
      for(let x=0;x<=w;x+=8)g.lineTo(x,17+i*14+Math.sin(x*.066+i)*3);
      g.stroke();
    }
  }));
  const relief = new T.MeshLambertMaterial({map:ink,color:0xb5c6bb});
  for(const side of [-1,1]) {
    const x=side*7.5;
    box(4.15,.38,1.45,M.moss,x,-.61,-4.55);
    box(3.75,.32,1.22,M.stone,x,-.24,-4.72);
    add(new T.PlaneGeometry(3.73,.28),relief,x,-.065,-4.10,{cast:false});
  }
  const glow = new T.MeshBasicMaterial({ color:0x7db2a7, transparent:true, depthWrite:false, opacity:.21, side:T.DoubleSide });
  const g = new T.RingGeometry(.73,.79,24);
  const r = add(g,glow,0,-.475,-6.9,{rx:-Math.PI/2,cast:false});
  D.updaters.push(t=>{const p=(t*.39)%1;r.scale.setScalar(1+p*1.9);glow.opacity=.22*(1-p);});
}

export function grovePond(D, K, M) {
  const { box }=K;
  const tile=pbr('castle_wall_slates',[.45,.5],{color:0x777f76,rough:.91});
  const R=rng(95);
  // The old bathing pond is held by a broken masonry sill outside the fight floor.
  for(let i=0;i<8;i++){
    const x=-2.7+i*1.15;
    const b=box(1.13,R.r(.18,.38),.69,i%3===0?M.moss:tile,x,-.14,-6.35+R.r(-.13,.12),{cast:false});
    b.rotation.y=R.r(-.065,.065);
  }
  const swatch=new T.MeshBasicMaterial({color:0xc7ae73,transparent:true,opacity:.42,depthWrite:false});
  const a=K.add(new T.BoxGeometry(.115,.017,.27),swatch,2.2,-.035,-7.05,{cast:false});
  D.updaters.push(t=>{a.position.x=2.2+Math.sin(t*.49)*.33;a.position.z=-7.05+Math.cos(t*.41)*.13;a.rotation.y=t*.21;});
}
