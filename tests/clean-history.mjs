import assert from 'node:assert/strict';
import {CleanHistory} from '../src/clean-history.js';

class MemoryStorage {
  rows=new Map();
  get length(){return this.rows.size;}
  key(index){return [...this.rows.keys()][index]??null;}
  getItem(key){return this.rows.get(key)??null;}
  setItem(key,value){this.rows.set(key,value);}
  removeItem(key){this.rows.delete(key);}
}
const storage=new MemoryStorage(), scope='fictional-floor-A';
const base=Date.UTC(2026,0,1,13);
let time=base;
const tick=(ms=1000)=>(time+=ms);
const create=(options={})=>new CleanHistory({storage,source:'ecovacs',vacuum:'vacuum.test',scope,now:()=>time,...options});
const route=(lines,opts={})=>({scope,space:'ecovacs-map',anchor:null,segments:lines,...opts});
const a=[[0,0],[1,0]], b=[[7,2],[8,3]], c=[[3,7],[4,9]];
const observe=(model,state,since=time,opt={})=>model.observe({connected:true,state,stateSince:since,...opt});
const h=create();
observe(h,'docked');
const dispatch=tick();h.requestTarget(['Studio'],{at:dispatch,state:'docked'});
const start=tick();observe(h,'cleaning',start,{reportedRooms:['Hall'],durationMinutes:0,areaM2:0});
assert.equal(h.active.startedAt,start);assert.equal(h.active.partial,false);assert.equal(h.last,null);
assert.ok(h.acceptRoute(route([a,b])));
assert.equal(h.acceptRoute(route([a])),false);
assert.equal(h.acceptRoute(route([a,b])),false);
assert.equal(h.active.reportedRooms.includes('Studio'),false);
assert.deepEqual(h.active.requestedRooms,['Studio']);
const paused=tick();observe(h,'paused',paused);
observe(h,'cleaning',tick(),{durationMinutes:4,areaM2:8,reportedRooms:['Studio','Hall']});
observe(h,'returning',tick());observe(h,'docked',tick(),{continuing:true});
assert.equal(h.last,null);assert.deepEqual(h.active.reportedRooms,['Hall','Studio']);
observe(h,'cleaning',tick());
const ended=tick();observe(h,'docked',ended);
assert.equal(h.last.endedAt,ended);assert.equal(h.last.outcome,null);assert.equal(h.last.endState,'docked');
assert.equal(h.last.durationMinutes,4);assert.equal(h.last.areaM2,8);
assert.equal(h.acceptRoute(route([c])),false);
observe(h,'docked',ended,{jobAt:tick(),outcome:'finished_with_warnings'});
assert.equal(h.last.outcome,'finished_with_warnings');const snapshot=structuredClone(h.last);
h.observe({connected:false});assert.deepEqual(h.last,snapshot);
h.dispose();
const reload=create();assert.deepEqual(reload.last,snapshot);assert.equal(reload.active,null);
for(const other of [{source:'roborock'},{vacuum:'vacuum.other'},{scope:'other'},{storage:new MemoryStorage()}]){
  const m=create(other);assert.equal(m.last,null);m.dispose();
}
const externalAt=tick();observe(reload,'cleaning',externalAt);
assert.equal(reload.active.requestedRooms,null);
assert.equal(reload.active.route,null);
reload.acceptRoute(route([a]));reload.dispose();
const reopen=create();assert.equal(reopen.active.requestedRooms,null);
observe(reopen,'cleaning',externalAt);
reopen.observe({connected:false});
tick(150000);observe(reopen,'cleaning',externalAt);
assert.equal(reopen.active.firstSeenAt,externalAt);assert.equal(reopen.active.partial,true);
reopen.acceptRoute(route([c]));
assert.deepEqual(reopen.active.route.segments,[a,c]);
const gapEnd=reopen.active.lastSeenAt;
reopen.observe({connected:false});
tick(200000);const nextSince=time-2000;
observe(reopen,'cleaning',nextSince);
assert.equal(reopen.last.endedAt,gapEnd);assert.equal(reopen.last.endState,null);
assert.equal(reopen.active.startedAt,null);assert.equal(reopen.active.route,null);
assert.equal(reopen.active.partial,true);assert.equal(reopen.active.outcome,null);
const stopped=tick();observe(reopen,'idle',stopped,{jobAt:stopped,outcome:'manually_stopped'});
assert.equal(reopen.last.outcome,'manually_stopped');
const last=structuredClone(reopen.last);
observe(reopen,'docked',tick(),{jobAt:tick(180000),outcome:'finished'});
assert.deepEqual(reopen.last,last);
reopen.dispose();

const storeB=new MemoryStorage(),h2=create({storage:storeB});
observe(h2,'docked');tick();const allAt=time;
observe(h2,'cleaning',allAt);
h2.requestTarget([],{at:allAt,state:'cleaning'});
assert.deepEqual(h2.active.requestedRooms,[]);h2.dispose();
const tab2=create({storage:storeB});assert.deepEqual(tab2.active.requestedRooms,[]);
tab2.acceptRoute(route([a,b]));const end2=tick();observe(tab2,'idle',end2);tab2.dispose();
h2.restore();
assert.equal(h2.active,null);assert.deepEqual(h2.last.route.segments,[a,b]);
observe(h2,'cleaning',allAt);assert.equal(h2.active,null);
const original=structuredClone(h2.last);
h2.observe({connected:false});h2.dispose();assert.deepEqual(h2.last,original);
const h3=create({storage:storeB});observe(h3,'docked');h3.observe({connected:false});
const unseen=tick();observe(h3,'cleaning',unseen);
assert.equal(h3.active.startedAt,null);assert.equal(h3.active.partial,true);
h3.requestTarget(['Late edit'],{at:tick(3000),state:'cleaning'});assert.equal(h3.active.requestedRooms,null);
for(const invalid of [
  route([a],{scope:'other'}),route([a],{anchor:{width:1,height:1,points:[0]}}),
  route([[[0,0],[NaN,1]]]),route([[[0,0],[Infinity,1]]]),route([[[1e8,2],[0,1]]]),
  route(Array(1001).fill(a)),route([Array(6001).fill([0,0])]),route([[[0,1]]]),route([]),
])assert.equal(h3.acceptRoute(invalid),false);
assert.equal(h3.active.route,null);h3.acceptRoute(route([a],{partial:true}));
assert.equal(h3.active.partial,true);
h3.dispose();

const raster=create({storage:new MemoryStorage(),source:'roborock'});
observe(raster,'docked');observe(raster,'cleaning',tick());
assert.equal(raster.active.partial,true);
const anchor={width:24,height:24,points:[1,20,44,88]}, rasterRoute=(segments,opts={})=>route(segments,{space:'roborock-image',anchor,...opts});
for(const invalid of [rasterRoute([a],{anchor:null}),rasterRoute([a],{anchor:{...anchor,points:[600]}}),
  rasterRoute([[[0,0],[25,24]]]),rasterRoute([a],{anchor:{width:10000,height:10,points:[1]}}),
  rasterRoute([a],{anchor:{...anchor,points:Array(257).fill(0)}}),route([a])])assert.equal(raster.acceptRoute(invalid),false);
assert.ok(raster.acceptRoute(rasterRoute([a,b])));
raster.acceptRoute(rasterRoute([]));assert.deepEqual(raster.active.route.segments,[a,b]);
raster.acceptRoute(rasterRoute([],{anchor:{...anchor,width:26}}));assert.equal(raster.active.route,null);
assert.ok(raster.acceptRoute(rasterRoute([c],{anchor:{...anchor,width:26}})));
observe(raster,'error',tick());assert.equal(raster.last.endState,'error');assert.equal(raster.last.outcome,null);
raster.dispose();

const unavailable={get length(){throw Error('disabled');},setItem(){throw Error('quota');}};
const manual=create({storage:unavailable});
observe(manual,'docked');manual.requestTarget(['Old'],{at:time,state:'docked'});tick(601000);
observe(manual,'cleaning',time);assert.equal(manual.active.requestedRooms,null);assert.equal(manual.active.startedAt,null);
manual.acceptRoute(route([a]));observe(manual,'idle',tick());
assert.deepEqual(manual.last.route.segments,[a]);manual.dispose();
const malformed=create({storage:new MemoryStorage()});
for(const raw of ['{','a'.repeat(365000),null,'{}',JSON.stringify({v:1,stamp:time+999999})])malformed.merge(raw);
assert.equal(malformed.last,null);
malformed.merge(JSON.stringify({v:1,stamp:time,last:{firstSeenAt:time,lastSeenAt:time-1,endedAt:time}}));
assert.equal(malformed.last,null);malformed.dispose();

const slots=new MemoryStorage();slots.setItem('unrelated','untouched');
for(let i=0;i<12;i++){const m=create({storage:slots,scope:'floor-'+i});observe(m,'docked',tick());observe(m,'cleaning',tick());observe(m,'idle',tick());m.dispose();}
assert.equal(slots.length,9);assert.equal(slots.getItem('unrelated'),'untouched');
for(let i=0;i<12;i++){const m=create({storage:slots,scope:'floor-11'});observe(m,'docked',tick());m.dispose();}
assert.equal(slots.length,9);
assert.ok(create({storage:slots,scope:'floor-10'}).last);
for(const options of [{scope:'unconfirmed'},{source:'other'},{vacuum:'switch.clean'}]){
  const invalid=create(options);observe(invalid,'docked');observe(invalid,'cleaning',tick());assert.equal(invalid.active,null);invalid.dispose();
}
// A dashboard reopened the next day cannot attach its old route to the job
// that ended while the page was closed, even with a fresh device report.
const blind=create({storage:new MemoryStorage()});
observe(blind,'idle');observe(blind,'cleaning',tick());
blind.acceptRoute(route([a]));
assert.equal(blind.active.partial,false);
assert.ok(blind.acceptRoute(route([a,b],{partial:true})));assert.equal(blind.active.partial,true);
const observed=blind.active.lastSeenAt;
blind.observe({connected:false});
const later=tick(86400000);
observe(blind,'docked',later,{jobAt:later,outcome:'finished',reportedRooms:['Other']});
assert.equal(blind.last.endedAt,observed);
assert.equal(blind.last.endState,null);
assert.equal(blind.last.jobAt,null);
assert.equal(blind.last.outcome,null);
assert.deepEqual(blind.last.route.segments,[a,b]);
assert.deepEqual(blind.last.reportedRooms,[]);
blind.dispose();

// A service can acknowledge after the telemetry for a very short clean has arrived.
const late=create({storage:new MemoryStorage()});observe(late,'idle');
const sent=tick();observe(late,'cleaning',tick());observe(late,'idle',tick());
late.requestTarget(['Dining room'],{at:sent,state:'idle'});
assert.deepEqual(late.last.requestedRooms,['Dining room']);assert.equal(late.intent,null);
observe(late,'cleaning',tick());
assert.equal(late.active.requestedRooms,null);
late.requestTarget([null],{at:time,state:'cleaning'});
assert.equal(late.active.requestedRooms,null);
late.dispose();
console.log('Cleaning history passed: state transitions, telemetry evidence, target provenance, route gaps, reloads, multiple tabs, limits and storage failures.');
