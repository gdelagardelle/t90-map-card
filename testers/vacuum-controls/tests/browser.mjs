import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import {launchBrowser} from '../../../tests/browser-engine.mjs';

const js=await fs.readFile(process.env.CONTROLS_TEST_BUNDLE || new URL('../../../dist/vacuum-controls-card.js',import.meta.url));
const server=http.createServer((req,res)=>{
  if(req.url==='/card.js'){res.setHeader('Content-Type','text/javascript');res.end(js);return;}
  res.setHeader('Content-Type','text/html');res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><style>:root{--primary-text-color:#193433;--secondary-text-color:#45625d;--card-background-color:#fbfcfa;--divider-color:#adbcaf;font:16px system-ui}body{max-width:750px;margin:14px auto;padding:6px;background:#e3e9e4}ha-card{box-shadow:0 4px 20px #19343318}button{font:inherit}</style><vacuum-controls-card></vacuum-controls-card><script type="module" src="/card.js"></script>');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await launchBrowser();
try{
  const page=await browser.newPage({viewport:{width:850,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.waitForFunction(()=>!!customElements.get('vacuum-controls-card'));
  await page.evaluate(()=>{
    window.card=document.querySelector('vacuum-controls-card');window.calls=[];window.tick=0;
    window.make=(platform,name,features,attr={},extra={})=>{
      window.id='vacuum.'+name.toLowerCase().replace(/[^a-z0-9]+/g,'_')+'_fixture';window.cfg={entity:id,...extra};
      window.h={connected:true,states:{[id]:{state:'docked',attributes:{friendly_name:name,supported_features:features,...attr}}},
        entities:{[id]:{platform,device_id:platform}},services:{vacuum:Object.fromEntries(['start','stop','pause','return_to_base','locate','clean_spot','set_fan_speed'].map(k=>[k,{}])),sharkiq:{clean_room:{}},roomba_plus:{clean_room:{}}},
        callService:async(...args)=>{calls.push(args);}};
      card.setConfig(cfg);card.hass=h;
    };
    window.update=(state,attrs={})=>{h.states[id]={...h.states[id],state,last_updated:new Date(1700000000000+(++tick)*1000).toISOString(),attributes:{...h.states[id].attributes,...attrs}};card.hass=h;};
    window.getExpected=()=>({entity_id:id});
    make('roomba','Roomba 980',8192|4096|2048|512|32|16|8|4,{fan_speed:'Automatic',fan_speed_list:['Automatic','Eco','Performance']});
  });
  const card=page.locator('vacuum-controls-card'),btn=name=>card.getByRole('button',{name,exact:true}), recorded=()=>page.evaluate(()=>calls);
  const expected=async(domain,service,data={})=>assert.deepEqual((await recorded()).at(-1),[domain,service,data,await page.evaluate(()=>getExpected())]);
  await btn('Start').click();await expected('vacuum','start');
  await page.evaluate(()=>update('cleaning',{position:'(0, 0, 90)',cleaning_time:0}));
  await btn('Pause').click();await expected('vacuum','pause');
  await page.evaluate(()=>update('paused'));await btn('Resume').click();await expected('vacuum','start');
  await page.evaluate(()=>update('cleaning',{position:'(6, 8, 90)',cleaning_time:1}));
  await btn('Stop').click();await expected('vacuum','stop');
  await btn('Go home').click();await expected('vacuum','return_to_base');
  await btn('Locate').click();await expected('vacuum','locate');
  await card.getByRole('combobox').selectOption('Eco');await expected('vacuum','set_fan_speed',{fan_speed:'Eco'});
  assert.equal(await card.locator('.trail').isVisible(),true);
  await page.evaluate(()=>{update('cleaning',{position:null});update('cleaning',{position:'(-4, 8, 180)'});});
  assert.equal(await card.evaluate(c=>c.trail.points.at(-1).move),true);
  await page.evaluate(()=>{update('docked');update('cleaning',{position:'(12, 12, 0)',cleaning_time:0});});
  assert.equal(await card.evaluate(c=>c.trail.points.length),1);
  await page.evaluate(()=>make('roomba','Braava jet m6',8192|4096|2048|512|32|16|8|4,{fan_speed_list:['Standard','Deep','Extended']}));
  await card.getByRole('combobox').selectOption('Deep');await expected('vacuum','set_fan_speed',{fan_speed:'Deep'});
  assert.equal(await card.locator('.trail').isVisible(),false);
  // Mandatory Matter RVC capabilities, even on a server advertising optional actions.
  await page.evaluate(()=>make('matter','Matter RVC',8192|4096|8,
    {rooms:['Kitchen']},{room_selection:true}));
  await btn('Start').click();await expected('vacuum','start');
  await page.evaluate(()=>update('cleaning'));
  for(const name of ['Pause','Go home','Locate','Spot clean','Kitchen','Clean selected rooms']){
    assert.equal(await btn(name).count(),0);
  }
  assert.equal(await card.getByRole('combobox').count(),0);
  for(const selector of ['.map','.trail'])assert.equal(await card.locator(selector).isVisible(),false);
  await btn('Stop').click();await expected('vacuum','stop');
  await page.evaluate(()=>update('cleaning',{supported_features:8192|4096|8|4|16|512}));
  await btn('Pause').click();await expected('vacuum','pause');
  await btn('Go home').click();await expected('vacuum','return_to_base');
  await btn('Locate').click();await expected('vacuum','locate');
  console.log('PASS – Matter RVC minimum controls and optional pause, dock and locate; room and map features stay hidden.');
  await page.evaluate(()=>make('xiaomi_miio','Mi Robot Vacuum',8192|4096|2048|1024|512|32|16|8|4,{fan_speed_list:['Silent','Standard','Turbo']}));
  await btn('Spot clean').click();await expected('vacuum','clean_spot');
  await card.getByRole('combobox').selectOption('Turbo');await expected('vacuum','set_fan_speed',{fan_speed:'Turbo'});
  await page.evaluate(()=>make('sharkiq','Shark IQ RV1001AE',8192|4096|512|32|16|8|4,{rooms:['Living Room','Kitchen','living_room','kitchen'],fan_speed_list:['Eco','Normal','Max']},{room_selection:true}));
  const before=(await recorded()).length;
  assert.equal(await btn('living_room').count(),0);assert.equal(await btn('kitchen').count(),0);
  await btn('Kitchen').click();await btn('Living Room').click();assert.equal((await recorded()).length,before);
  await btn('Clean selected rooms').click();await expected('sharkiq','clean_room',{rooms:['Kitchen','Living Room']});
  await page.evaluate(()=>update('docked',{rooms:['Kitchen']}));
  assert.equal(await btn('Clean selected rooms').isDisabled(),true);await page.evaluate(()=>card.run('start'));assert.equal((await recorded()).length,before+1);
  await btn('Whole home').click();await btn('Start').click();await expected('vacuum','start');
  await page.evaluate(()=>{h.connected=false;card.hass=h;});
  assert.equal(await btn('Start').isDisabled(),true);await page.evaluate(()=>card.run('start'));assert.equal((await recorded()).length,before+2);
  await page.evaluate(()=>{h.connected=true;card.hass=h;delete h.services.vacuum.start;});
  await page.evaluate(()=>card.run('start'));assert.equal((await recorded()).length,before+2);
  await page.evaluate(()=>{h.services.vacuum.start={};h.callService=(...args)=>{calls.push(args);return new Promise(r=>window.finish=r);};card.hass=h;card.run('start');card.run('start');});
  assert.equal((await recorded()).length,before+3);
  await page.evaluate(()=>{make('xiaomi_miio','Mi Robot Vacuum',8192);finish();});
  await btn('Start').click();await expected('vacuum','start');
  // Roomba+ native room outlines from a paired static Rooms Map.
  await page.evaluate(()=>{
    make('roomba_plus','Roomba Plus 405',8192|512|16|8|4,{}, {room_selection:true,map_entity:'image.rooms_fixture'});
    const img=cfg.map_entity;h.entities[img]={platform:'roomba_plus',device_id:'roomba_plus',translation_key:'rooms_map'};
    h.states[img]={state:'2026-01-01T00:00:00Z',attributes:{rooms:{
      'r1':{room_id:'r1',name:'Kitchen',outline:[[0,0],[6,0],[6,4],[0,4]]},
      'r2':{room_id:'r2',name:'Dining room',outline:[[6,0],[11,0],[11,7],[6,7]]},
      'r3':{room_id:'r3',name:'Hall',outline:[[0,4],[6,4],[6,7],[0,7]]}
    }}};
    update('idle');window.loadCardHelpers=async()=>({createCardElement:cfg=>{const el=document.createElement('div');el.dataset.image=cfg.entity;el.textContent='Fixture image';return el;}});
  });
  const floor=card.locator('switchbot-floorplan-beta');
  await floor.locator('canvas').waitFor();
  await floor.getByRole('button',{name:'Kitchen'}).click();await btn('Clean selected rooms').click();
  await expected('roomba_plus','clean_room',{room_name:['r1'],ordered:true});
  if(process.env.CONTROLS_SCREENSHOT)await card.screenshot({path:process.env.CONTROLS_SCREENSHOT});
  const previous=(await recorded()).length;
  await page.evaluate(()=>{
    const img=cfg.map_entity;const old=h.states[img].attributes.rooms;
    h.states[img]={state:'2026-01-01T00:05:00Z',attributes:{rooms:{...old,r1:{...old.r1,name:'Bedroom'}}}};card.hass=h;
  });
  await page.evaluate(()=>card.run('start'));assert.equal((await recorded()).length,previous);
  await page.evaluate(()=>{delete h.entities[cfg.map_entity].device_id;card.hass=h;});
  await card.locator('[data-image="image.rooms_fixture"]').waitFor();assert.equal(await floor.count(),0);
  await page.setViewportSize({width:390,height:800});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  console.log('PASS – Roomba 980 and Braava m6 controls, relative pose trail/reset, Mi Robot Vacuum, Shark IQ RV1001AE rooms, Roomba+ Prime room polygons and actions, device/room/service changes, offline, repeat taps, 2D fallback and mobile width.');
}finally{await browser.close();server.close();}
