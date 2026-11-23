import assert from 'node:assert/strict';
import * as THREE from 'three';
import { proportionalSize,sizeEquipment } from '../src/furniture-scale.js';
import { locateRobot } from '../src/roborock-marker.js';
import { floorPortrait } from '../src/roborock-camera.js';
import { pickWall,wallTransform } from '../src/roborock-wall-selection.js';
import { withoutScanOverlays } from '../src/roborock-trail.js';

const grid=new Uint8Array(50*40);
for(let y=5;y<=30;y++)for(let x=10;x<=11;x++)grid[y*50+x]=1;
for(let x=12;x<35;x++)grid[18*50+x]=1;
const wall=pickWall(grid,50,40,[42,38],4);
assert.ok(wall.spans.length>=10);
assert.ok(wall.spans.every(([x,y,n])=>x===10 && n===2 && y<18));
assert.equal(pickWall(grid,50,40,[168,108],4),null);
const from=[8,4,8,32],to=[8,4,32,48];
const [a,b,c,d,e,f]=wallTransform(from,to);
for(let i=0;i<4;i+=2){
  assert.ok(Math.abs(a*from[i]+c*from[i+1]+e-to[i])<1e-8);
  assert.ok(Math.abs(b*from[i]+d*from[i+1]+f-to[i+1])<1e-8);
}
const room=0xf0b27a,trail=0x93c2ee;
const row=[room,trail,trail,room,0xffffff,0,0x66feda,0xa9f7a9,0,trail,0];
const data=new Uint8ClampedArray(row.flatMap((color,i)=>[color>>16,(color>>8)&255,color&255,i===6?127:i===8 || i===10?0:255]));
const original=data.slice(),clean=withoutScanOverlays({data,width:row.length,height:1},new Map([[room,1]]),{hideTrail:true,hideCarpet:false}).data;
assert.deepEqual(data,original);
const result=i=>[...clean.slice(i*4,i*4+4)];
assert.deepEqual(result(1),result(0));assert.deepEqual(result(2),result(0));
for(const i of [4,5,6,7,8])assert.deepEqual(result(i),[...original.slice(i*4,i*4+4)]);
assert.equal(result(9)[3],0);
console.log('Passed wall junctions, endpoint transforms and trail removal with robot, dock, carpet and exterior preserved.');

const carpet=0xa9f7a9;
const stripe=[room,carpet,trail,carpet,room];
const image={width:5,height:1,data:new Uint8ClampedArray(stripe.flatMap(rgb=>[rgb>>16,(rgb>>8)&255,rgb&255,255]))};
for(const hideTrail of [true,false]) {
  const fixed=withoutScanOverlays(image,new Map([[room,1]]),{hideCarpet:true,hideTrail}).data;
  for(const i of [1,3])assert.deepEqual(fixed.slice(i*4,i*4+4),image.data.slice(0,4));
  assert.deepEqual(fixed.slice(8,12),image.data.slice(hideTrail?0:8,hideTrail?4:12));
}

// Transparent PNG padding cannot change the size of the framed model.
function rectangle(cols,rows,dx,dz){
  const cells=new Uint8Array(cols*rows);
  for(let z=dz;z<dz+12;z++)cells.fill(1,z*cols+dx,z*cols+dx+30);
  return floorPortrait(cells,new Uint8Array(cells.length),cols*4,rows*4);
}
const compact=rectangle(40,24,1,3),padded=rectangle(240,100,123,40);
assert.ok(Math.abs(compact.width-padded.width)<1e-8 && Math.abs(compact.height-padded.height)<1e-8);
assert.deepEqual(compact.direction,padded.direction);

const support=new THREE.Group(),screen=new THREE.Group();
support.add(screen);screen.userData={widthClearance:30/23.4,depthClearance:7/3.1};
for(const [w,h,d] of [[1,1,1],[4,1,.5],[2,2,2],[.5,1,1]]){
  support.scale.set(w,h,d);sizeEquipment(screen,w,h,d);
  const actual=screen.getWorldScale(new THREE.Vector3());
  assert.ok(Math.abs(actual.x-actual.y)<1e-9 && Math.abs(actual.y-actual.z)<1e-9);
  if(w>=1)assert.ok(Math.abs(actual.x-1)<1e-9);
  else assert.ok(actual.x*23.4<=30*w+1e-9);
}
assert.deepEqual(proportionalSize({width:80,depth:160},2),{width:160,depth:320,height:200});
const icon={width:160,height:80,data:new Uint8ClampedArray(160*80*4)};
function stamp(x,y){
  for(let v=-12;v<=12;v++)for(let u=-12;u<=12;u++){
    if(Math.hypot(u,v)>12)continue;
    const c=Math.hypot(u-7,v)<=2?127:Math.hypot(u,v)>10?0:255;
    icon.data.set([c,c,c,255],4*((y+v)*160+x+u));
  }
}
assert.equal(locateRobot(icon),null);
stamp(42,36);const pose=locateRobot(icon);
assert.deepEqual([pose.x,pose.y,pose.radius],[42,36,12]);assert.equal(pose.heading,Math.PI/2);
stamp(112,36);assert.equal(locateRobot(icon),null);
