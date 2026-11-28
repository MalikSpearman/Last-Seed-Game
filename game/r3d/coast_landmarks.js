import { T } from './diorama.js';
import { pbr } from './kit.js';

export function dockFenders(K) {
  const cedar = pbr('weathered_planks', [.5, 1], {color:0x6b5552,rough:.92});
  const rope = new T.MeshStandardMaterial({color:0x8f775c,roughness:1});
  const loop = new T.TorusGeometry(.174,.032,6,12);
  for (const x of [-8.3,-3.9,4.8,9.25]) {
    K.box(.32,1.04,.35,cedar,x,-.94,-3.72);
    for (const y of [-.46,-.36]) K.add(loop,rope,x,y,-3.72,{rx:Math.PI/2,cast:false});
    K.box(.48,.065,.41,cedar,x,-.01,-3.72);
  }
}

export function dojoBanners(D,K) {
  const slat=pbr('weathered_planks',[.4,.8],{color:0x624b4f,rough:.9});
  const fabric=new T.MeshStandardMaterial({color:0x78494b,roughness:.98,side:T.DoubleSide});
  const hem=new T.MeshStandardMaterial({color:0xb68c6b,roughness:.89});
  for(const x of [-6.25,6.25]){
    K.box(.22,2.2,.25,slat,x,-.06,-4.37);
    K.box(.9,.075,.08,hem,x+.35,1.99,-4.33);
    const banner=K.add(new T.PlaneGeometry(.57,.92),fabric,x+.49,1.5,-4.31,{cast:false});
    D.updaters.push(t=>{banner.rotation.y=.11*Math.sin(t*1.8+x);});
  }
}

export function lookoutSteps(D,K) {
  const stone=pbr('castle_wall_slates',[1.2,.7],{color:0x77868a,rough:.91});
  const brass=new T.MeshStandardMaterial({color:0x937d56,roughness:.84});
  for(const s of [-1,1]){
    const x=s*6.45;
    K.box(2.8,.29,.68,stone,x,-.1,-4.25);
    K.box(.32,.55,.32,stone,x+s*1.1,-.02,-4.25);
    K.box(.39,.073,.38,brass,x+s*1.1,.51,-4.25,{cast:false});
  }
  D.fireflies(9,1.4,-7.1,4,2,{color:0xeec89a,y0:.16,y1:.86,size:5});
}

export function whaleboneRigging(D,K) {
  const cedar=pbr('weathered_planks',[.5,1],{color:0x867063,rough:.9});
  const rope=new T.LineBasicMaterial({color:0x9e8b73});
  for(const x of [-5.3,5.3])K.box(.22,1.43,.25,cedar,x,-.22,-4.28);
  const geometry=new T.BufferGeometry().setFromPoints([-5.3,-2.6,0,2.6,5.3]
    .map(x=>new T.Vector3(x,1.21-.31*(1-x*x/28.09),-4.28)));
  K.S.add(new T.Line(geometry,rope));
  const paper=new T.MeshBasicMaterial({color:0xc8a37e});
  for(const x of [-2.6,2.6]){
    const lamp=K.add(new T.CylinderGeometry(.09,.115,.22,8),paper,x,.83,-4.28,{cast:false});
    D.updaters.push(t=>{lamp.rotation.z=.12*Math.sin(t*1.3+x);});
  }
}

export function caveTide(D,K) {
  const shelf=pbr('rock_face',[.8,.5],{color:0x4d6b70,rough:.89});
  const salt=pbr('rock_face',[.65,.4],{color:0x8b9a84,rough:.95});
  for(const [x,z] of [[-6.4,-3.9],[7.35,-4.45]]){
    K.box(2.9,.26,.79,shelf,x,-.44,z,{ry:x*.046});
    K.box(2.4,.11,.64,salt,x,-.2,z,{ry:x*.046});
  }
  const ring=new T.RingGeometry(.51,.547,20);
  for(const [x,z] of [[-5,-6.7],[4.85,-7.3]]){
    const mat=new T.MeshBasicMaterial({color:0x5ab8bb,transparent:true,opacity:.20,side:T.DoubleSide,depthWrite:false});
    const foam=K.add(ring,mat,x,-.68,z,{rx:-Math.PI/2,cast:false});
    D.updaters.push(t=>{const p=(t*.36+(x>0?.5:0))%1;foam.scale.setScalar(.72+p*1.85);mat.opacity=.20*(1-p);});
  }
}
