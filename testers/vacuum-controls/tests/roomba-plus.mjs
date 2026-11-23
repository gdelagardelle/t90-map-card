import assert from "node:assert/strict";
import {getRoombaFloor,getRoombaRoomTargets,startRoombaRooms} from "../roomba-plus.js";

const vacuum="vacuum.fixture", image="image.fixture_map";
const calls=[];
const rooms={
  Kitchen:{name:"Kitchen",room_id:"kitchen",region_id:"2",outline:[[0,0],[2000,0],[2000,1000],[0,1000],[0,0]]},
  Office:{name:"Office",room_id:"office",region_id:"4",outline:[[2000,0],[3000,0],[3000,1000],[2000,1000]]}
};
const calibration_points=[
  {vacuum:{x:0,y:0},map:{x:2,y:55}},
  {vacuum:{x:2000,y:0},map:{x:22,y:55}},
  {vacuum:{x:0,y:1000},map:{x:2,y:45}}
];
const hass={states:{[vacuum]:{state:"docked"},[image]:{state:"2026-11-01T12:00:00Z",attributes:{rooms,calibration_points}}},
  entities:{[vacuum]:{platform:"roomba_plus",device_id:"test"},[image]:{platform:"roomba_plus",device_id:"test",translation_key:"rooms_map"}},
  services:{roomba_plus:{clean_room:{}}},callService:async(...args)=>calls.push(args)};
const floor=()=>getRoombaFloor(hass,vacuum,image);
const targets=()=>getRoombaRoomTargets(hass,vacuum,image);
const start=selected=>startRoombaRooms(hass,vacuum,image,selected);
const change=rooms=>{hass.states[image]={...hass.states[image],attributes:{rooms,calibration_points}};};
const first=floor(), ids=targets().map(r=>r.id);
assert.deepEqual(first.rooms[0].points,[[2,55],[22,55],[22,45],[2,45]]);
assert.equal(first.rooms[0].room_id,ids[0]);
assert.equal(calls.length,0);
change(structuredClone(rooms));assert.equal(floor(),first);
await start([ids[1],ids[0],ids[1]]);
assert.deepEqual(calls.pop(),["roomba_plus","clean_room",{room_name:["4","2"],ordered:true},{entity_id:vacuum}]);

change({...rooms,Office:{...rooms.Office,name:"Guest room"}});
await assert.rejects(start([ids[0]])); // untouched Kitchen belongs to a different map revision.
assert.equal(calls.length,0);
const current=targets()[0].id;
hass.states[image].attributes.rooms.Office.name="Changed in place";
await assert.rejects(start([current]));
change({17:{name:"Café",room_id:"17",outline:rooms.Kitchen.outline}});
const prime=targets()[0];assert.equal(prime.name,"Café");
await start(new Set([prime.id]));
assert.deepEqual(calls.pop(),["roomba_plus","clean_room",{room_name:["17"],ordered:true},{entity_id:vacuum}]);
for(const disabled of [
  ()=>{hass.connected=false;return ()=>{hass.connected=true;};},
  ()=>{hass.services.roomba_plus={};return ()=>{hass.services.roomba_plus={clean_room:{}};};},
  ()=>{hass.entities[image].device_id="other";return ()=>{hass.entities[image].device_id="test";};},
  ()=>{hass.entities[image].translation_key="cleaning_map";return ()=>{hass.entities[image].translation_key="rooms_map";};},
  ()=>{hass.states[vacuum].state="unavailable";return ()=>{hass.states[vacuum].state="docked";};},
  ()=>{hass.entities[vacuum].platform="roomba";return ()=>{hass.entities[vacuum].platform="roomba_plus";};},
]){
  const restore=disabled();assert.deepEqual(targets(),[]);await assert.rejects(start([prime.id]));restore();
}
change({A:{name:"Shared",region_id:"3",outline:rooms.Kitchen.outline},B:{name:"Shared",region_id:"5",outline:rooms.Office.outline}});
assert.equal(floor().rooms.length,2);assert.deepEqual(targets(),[]);
change({A:{name:"One",region_id:"3",outline:rooms.Kitchen.outline},B:{name:"Two",region_id:"3",outline:rooms.Office.outline}});
assert.deepEqual(targets(),[]);
change({A:{name:"No native ID",room_id:"slug_only",outline:rooms.Kitchen.outline}});
assert.ok(floor());assert.deepEqual(targets(),[]);
change({A:{name:"Degenerate",region_id:"9",outline:[[0,0],[1,1],[2,2]]}});
assert.equal(floor(),null);assert.deepEqual(targets(),[]);
change({A:{name:"Broken",region_id:"2",outline:[[NaN,0],[1,1],[2,0]]}});
assert.equal(floor(),null);await assert.rejects(start([]));assert.equal(calls.length,0);
console.log("Roomba+ Classic/Prime native polygons, calibration, ordered action, stale map/ID and registry guards passed.");
