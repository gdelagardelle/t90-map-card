import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// Illustrative Qrevo family model, shared by the control panel and map marker.
export function qrevoModel(){
  const group=new THREE.Group();
  const ceramic=new THREE.MeshStandardMaterial({color:0xf4f3ed,roughness:.32});
  const trim=new THREE.MeshStandardMaterial({color:0xb9babb,metalness:.55,roughness:.3});
  const glass=new THREE.MeshStandardMaterial({color:0x151c22,metalness:.26,roughness:.19});
  const accent=new THREE.MeshStandardMaterial({color:0xa93b38,roughness:.35});
  function mesh(geometry,material,x,y,z){
    const part=new THREE.Mesh(geometry,material);
    part.position.set(x,y,z);part.castShadow=true;group.add(part);return part;
  }
  function disc(radius,h,material,x,y,z){
    return mesh(new THREE.CylinderGeometry(radius,radius*.992,h,64),material,x,y,z);
  }
  disc(.92,.11,glass,0,.075,0);
  disc(1,.32,ceramic,0,.255,0);
  disc(.997,.024,trim,0,.405,0);
  disc(.974,.036,ceramic,0,.434,0);
  disc(.315,.045,trim,0,.469,-.22);
  disc(.267,.115,glass,0,.54,-.22);
  disc(.275,.024,accent,0,.567,-.22);
  disc(.292,.062,ceramic,0,.615,-.22);
  mesh(new RoundedBoxGeometry(.51,.148,.066,3,.045),glass,0,.27,.979);
  for(const x of [-.145,.145])mesh(new THREE.SphereGeometry(.036,16,12),trim,x,.276,1.014);
  for(const x of [-.077,.077])disc(.038,.013,trim,x,.459,.47);
  return group;
}
export function qrevoPortrait(renderer,robot){
  const stage=new THREE.Scene(),camera=new THREE.PerspectiveCamera(29,1.5,.1,20);
  camera.position.set(1.75,1.9,3.55);camera.lookAt(0,.25,0);
  stage.add(robot.clone(),new THREE.HemisphereLight(0xffffff,0x716965,1.8));
  const key=new THREE.DirectionalLight(0xffedd5,2.45);
  key.position.set(-3,5,4);stage.add(key);
  const rim=new THREE.DirectionalLight(0xd6ebff,1.8);rim.position.set(2,3,-4);stage.add(rim);
  renderer.setSize(360,240,false);renderer.render(stage,camera);
  return renderer.domElement.toDataURL('image/png');
}
export function addLocator(robot){
  const glow=new THREE.Mesh(new THREE.RingGeometry(1.06,1.3,64),
    new THREE.MeshBasicMaterial({color:0x61e2de,opacity:.36,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
  glow.rotation.x=-Math.PI/2;glow.position.y=.035;robot.add(glow);
}
