import assert from 'node:assert/strict';
import {alignPoints,recoverLayout} from '../src/layout-recovery-transform.js';

const t=alignPoints([[0,0],[8,0]],[[20,24],[20,32]]);
assert.deepEqual(t.point([4,12]),[8,28]);
assert.deepEqual(t.inverse([8,28]),[4,12]);
assert.throws(()=>alignPoints([[2,2],[2,2]],[[5,6],[8,9]]));
const old='before',current='after';
const item={id:1,kind:'chair',x:4,z:8,rotation:.25,width:105,depth:90,color:'#776655'};
const walls={version:1,walls:{'0.00,0.00,8.00,0.00':{start:{x:0,z:0},end:{x:9,z:0},hidden:true}},added:[
  {id:'added:1',kind:'floor',points:[{x:0,z:0},{x:8,z:0},{x:0,z:8}]},
  {id:'added:2',kind:'door',start:{x:0,z:0},end:{x:4,z:0},hidden:false}
]};
const source={layout:{'before:furniture':{version:1,items:[item]},'before:walls':walls},placement_bounds:[[0,0,8,4]],room_bindings:{old:10}};
const frozen=structuredClone(source);
const ref={segments:[[20,24,20,32]],box:[0,0,100,100]};
const result=recoverLayout(source,old,current,ref,t,false).record;
assert.deepEqual(result.layout['after:furniture'].items[0],{...item,x:12,z:28,rotation:3.25,height:100});
assert.ok(result.layout['after:walls'].walls['20.00,24.00,20.00,32.00'].hidden);
assert.deepEqual(result.layout['after:walls'].added[1].end,{x:20,z:28});
assert.deepEqual(result.placement_bounds,[[16,24,20,32]]);
assert.equal(result.room_bindings,undefined);
assert.deepEqual(source,frozen);
const plan={version:1,furniture:{version:1,items:[item]},finishes:{all:{material:'wood',color:'#aabbcc'},4:{material:'tile'}},
  anchor:{width:60,height:60,points:[1,10]},ops:[{kind:'wall',points:[0,0,8,0],room:4},
    {kind:'delete-floor',spans:[[1,2,2]]},{kind:'wall-edit',from:[4,8,12,8],to:[4,8,16,8],spans:[[1,2,2]],room:4}]};
const rasterRef={box:[0,0,60,60],anchor:{width:60,height:60,points:[2,11]}};
const recovered=recoverLayout({plan},old,current,rasterRef,t,true).record.plan;
assert.deepEqual(recovered.furniture.items[0],{...item,x:-3,z:10,rotation:3.25,height:100});
assert.deepEqual(recovered.ops[1].spans,[[2,7,1],[2,8,1]]);
assert.deepEqual(recovered.ops[2].to,[12,28,12,40]);assert.deepEqual(recovered.anchor,rasterRef.anchor);
assert.deepEqual(recovered.finishes,{all:plan.finishes.all});
const scale=alignPoints([[0,0],[10,0]],[[4,8],[24,8]]);
assert.equal(recoverLayout(source,old,current,ref,scale,false).record.layout['after:furniture'].items[0].width,210);
console.log('Passed layout recovery transforms, raster spans, furniture dimensions, wall identity and room binding isolation.');
