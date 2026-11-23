import assert from 'node:assert/strict';
import {boundedSubpaths, ribbonGeometry} from '../src/history-route-scene.js';
import {RasterRoute} from '../src/roborock-route-order.js';

const separated=boundedSubpaths([[[0,0],[1,0],[2,0],[2,1]],[[10,0],[12,0]]]);
assert.deepEqual(separated,[[[0,0],[2,0],[2,1]],[[10,0],[12,0]]]);
const mesh=ribbonGeometry(separated,1);
assert.equal(mesh.attributes.position.count,18);
assert.ok(Math.abs(mesh.attributes.along.getX(12)-.6)<1e-6,'The jump between subpaths adds no distance');
assert.equal(ribbonGeometry([[[NaN,0],[0,1]]],1),null);
assert.equal(ribbonGeometry([Array.from({length:6001},(_,i)=>[i,i])],1),null);
assert.equal(ribbonGeometry([[[5,2],[5,2]]],1),null);
mesh.dispose();

const w=30,h=12,buffer=new Uint8Array(w*h*4);
function ink(x,y){buffer.set([147,194,238,255],4*(x+y*w));}
for(let x=0;x<4;x++)ink(x,2);
const order=new RasterRoute(w,h,buffer.slice());
for(let x=4;x<10;x++)ink(x,6);
for(let y=3;y<7;y++)ink(9,y);
for(let x=21;x<27;x++)ink(x,9);
order.update(buffer,{x:28,y:9});
assert.ok(order.segments.length>=2);
assert.ok(order.segments.every(line=>line.every(([x,z])=>x>=4 && z>=3)));
function verifyInk() {
  for(const line of order.segments){
    for(let i=1;i<line.length;i++){
      const [a,b]=line.slice(i-1,i+1),steps=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*3));
      for(let j=0;j<=steps;j++){
        const x=Math.floor(a[0]+(b[0]-a[0])*j/steps),z=Math.floor(a[1]+(b[1]-a[1])*j/steps);
        assert.equal(buffer[4*(x+w*z)+3],255,'Every rendered edge stays on observed ink');
      }
    }
  }
}
verifyInk();
const before=order.pointCount;
order.update(buffer,null);assert.equal(order.pointCount,before);
ink(27,9);order.update(buffer,{x:28,y:9});assert.ok(order.pointCount>before,'a one-pixel update is retained');verifyInk();
console.log('Passed separated SVG subpaths, immutable path distances, bounded ribbon geometry, and gap-safe native ink capture.');

const {RunTrail}=await import('../src/ecovacs-run-trail.js');
const storage=new Map();
const trail=new RunTrail({getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},'run');
const iso=t=>new Date(Date.UTC(2020,0,1,0,t)).toISOString();
const sample=(state,stateMinute,mapMinute,route)=>trail.observe({state,stateSince:iso(stateMinute),mapTime:iso(mapMinute),route});
sample('docked',0,0,'old-a');
assert.equal(sample('cleaning',5,1,'old-a-b'),'old-a-b');
assert.equal(sample('cleaning',5,3,'old-a-b-c'),'old-a-b-c','late frames before the start stay masked');
assert.equal(sample('cleaning',5,7,'new-q'),'old-a-b-c');
sample('paused',8,7,'new-q');
assert.equal(sample('cleaning',9,9,'new-q-r'),'old-a-b-c','resume keeps the run');
assert.equal(sample('cleaning',24,15,'last-unseen'),'last-unseen','do not join runs across an unseen phase change');
console.log('Passed stale frames, resume and missed cleaning phase boundaries.');
