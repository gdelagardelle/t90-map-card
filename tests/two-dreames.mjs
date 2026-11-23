import assert from 'node:assert/strict';
import http from 'node:http';
import {gzipSync} from 'node:zlib';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {sampleMap} from './dreame.mjs';
const maps={a:sampleMap(),b:sampleMap()};
const statuses={a:200,b:200};
const serviceCalls=[],requests=[];
const bundle=await readFile(new URL('../dist/dreame-map-card-beta.js',import.meta.url));
const srv=http.createServer((req,res)=>{
  const key=/^\/api\/camera_map_data_proxy\/camera\.([ab])_map$/.exec(req.url)?.[1];
  if(key){
    requests.push([key,req.headers['x-fixture-device']]);
    if(req.headers['x-fixture-device']!==key)throw Error('Map requested for wrong fixture');
    res.writeHead(statuses[key],{'Content-Type':'application/json','Content-Encoding':'gzip','Cache-Control':'no-store'});
    res.end(gzipSync(JSON.stringify(statuses[key]===200?maps[key]:{error:statuses[key]})));return;
  }
  if(req.url==='/action'){let data='';req.on('data',s=>data+=s);req.on('end',()=>{serviceCalls.push(JSON.parse(data));res.end('{}');});return;}
  if(req.url==='/bundle.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(bundle);return;}
  res.writeHead(200,{'Content-Type':'text/html'});res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><style>dreame-map-card-beta{display:block}</style>');
});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const b=await chromium.launch({executablePath:process.env.CHROME_BIN,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const p=await b.newPage({viewport:{width:1010,height:760}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:'+srv.address().port);
  await p.evaluate(async()=>{
    await import('/bundle.js');window.devices={};const states={},entities={};
    for(const id of ['a','b']){
      for(const [key,state] of [['vacuum.'+id,'idle'],['camera.'+id+'_map','idle']]){
        states[key]={state,attributes:{friendly_name:key},last_changed:new Date().toISOString(),last_updated:new Date().toISOString()};entities[key]={device_id:id};
      }
      states['camera.'+id+'_map'].attributes.rooms={3:{name:'Office '+id},7:{name:'Kitchen '+id}};
    }
    for(const id of ['a','b']){
      const c=document.createElement('dreame-map-card-beta');devices[id]=c;c.id=id;
      c.setConfig({type:'custom:dreame-map-card-beta',entity:'vacuum.'+id,map_entity:'camera.'+id+'_map'});document.body.append(c);
      c.hass={connected:true,states,entities,fetchWithAuth:(url,options)=>fetch(url,{...options,headers:{'X-Fixture-Device':id}}),
        callService:(...args)=>fetch('/action',{method:'POST',body:JSON.stringify(args)})};
    }
  });
  const card=id=>p.locator('#'+id);
  for(const id of ['a','b'])await card(id).frameLocator('iframe').locator('[data-regions="2"][data-tracking="live"]').waitFor();
  for(const [id,room] of [['a','Office a'],['b','Kitchen b']]){
    await card(id).locator('.rooms summary').click();await card(id).getByRole('button',{name:room,exact:true}).click();await card(id).locator('.rooms summary').click();
  }
  assert.equal(serviceCalls.length,0);
  for(const code of [401,503]){
    statuses.a=code;
    await p.evaluate(()=>devices.a.pullMap(true));assert.ok(await card('a').locator('[data-action=start]').isDisabled());assert.match(await card('a').locator('.note').innerText(),new RegExp(String(code)));
    assert.ok(await card('b').getByRole('button',{name:'Start · Kitchen b'}).isEnabled());
  }
  await card('b').getByRole('button',{name:'Start · Kitchen b'}).click();
  await p.waitForFunction(()=>!devices.b.busy&&!devices.b.checkingTarget);
  assert.deepEqual(serviceCalls,[['dreame_vacuum','vacuum_clean_segment',{segments:[7]},{entity_id:'vacuum.b'}]]);
  statuses.a=200;await p.evaluate(()=>devices.a.pullMap(true));
  await card('a').getByRole('button',{name:'Start · Office a'}).click();
  await p.waitForFunction(()=>!devices.a.busy&&!devices.a.checkingTarget);
  assert.deepEqual(serviceCalls.at(-1),['dreame_vacuum','vacuum_clean_segment',{segments:[3]},{entity_id:'vacuum.a'}]);
  assert.equal(serviceCalls.length,2);
  const scopes=await p.evaluate(()=>[devices.a.scope,devices.b.scope]);assert.notEqual(scopes[0],scopes[1]);
  assert.ok(requests.every(([id,header])=>id===header));assert.deepEqual(errors,[]);
  // A room inside a hole in another room and an adjacent empty shaft.
  const nested=sampleMap();nested.data={};nested.size=[0,0,0,0,104,80,50];
  for(let y=0;y<80;y++){
    const cells=Array.from({length:104},(_,x)=>{
      if(!x||!y||x===103||y===79)return 255;
      if(x>=30&&x<=56&&y>=24&&y<=46)return 7;
      if(x>=63&&x<=75&&y>=26&&y<=39)return 0;
      return 3;
    });
    for(let x=0;x<104;){let end=x+1;while(end<104&&cells[end]===cells[x])end++;
      if(cells[x])(nested.data[cells[x]]??=[]).push(x,y,end-x);x=end;
    }
  }
  maps.a=nested;await p.evaluate(()=>devices.a.pullMap(true));
  const frame=card('a').frameLocator('iframe'),viewer=frame.locator('.viewer');
  await frame.locator('[data-regions="2"][data-tracking="live"]').waitFor();
  await frame.getByRole('button',{name:'Top view',exact:true}).click();
  await p.waitForFunction(()=>devices.a.frame.contentDocument.querySelector('.viewer').dataset.cameraMotion==='idle');
  const canvas=frame.locator('canvas');await canvas.scrollIntoViewIfNeeded();
  const bounds=await canvas.boundingBox();const scale=bounds.height/Math.max(80*1.42,104*1.15*bounds.height/bounds.width);
  const tap=(x,y)=>p.mouse.click(bounds.x+bounds.width/2+(x-52)*scale,bounds.y+bounds.height/2+(80-y-40)*scale);
  await tap(42,35);assert.equal(await viewer.getAttribute('data-selected-rooms'),'7');
  await tap(68,32);assert.equal(await viewer.getAttribute('data-selected-rooms'),'7');
  await tap(16,35);assert.equal(await viewer.getAttribute('data-selected-rooms'),'7,3');
  assert.equal(serviceCalls.length,2);assert.deepEqual(errors,[]);
  console.log('3D ray picking passed for a nested room, enclosing room and unselectable floor void.');
  console.log('Two simultaneous Dreame cards with identical floor geometry and distinct names/IDs. Gzip HTTP map reads, isolated selections, 401 and 503 failure/recovery and both exact command targets passed.');
}finally{await b.close();srv.close();}
