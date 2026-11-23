import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {furniture,rooms,scan} from './fixture.mjs';

const bundle=await readFile(process.env.CARD_BUNDLE || 'dist/t90-map-card.js');
const doc='<!doctype html><meta name="viewport" content="width=device-width"><style>body{margin:16px;background:#181d1f;font:15px system-ui}t90-map-card{display:block;max-width:1300px;margin:auto}</style><t90-map-card></t90-map-card><script type="module" src="/card.js"></script>';
const server=http.createServer((req,res)=>{
  const js=req.url==='/card.js';res.writeHead(200,{'Content-Type':js?'text/javascript':'text/html'});res.end(js?bundle:doc);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const p=await browser.newPage({viewport:{width:1300,height:920},reducedMotion:'reduce'}), errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  p.on('console',m=>{if(m.type()==='error'&&/WebGL|shader/i.test(m.text()))errors.push(m.text());});
  const vacuum='vacuum.fixture_robot',image='image.fixture_map';
  const old=scan('M75 -90l5 0');
  const route=scan('M75 -90l300 0 0 -27 -300 0 0 -27 300 0 0 -27 -300 0 0 -27 300 0 0 -27 -300 0');
  const origin='http://127.0.0.1:'+server.address().port;
  async function open(svg){
    await p.goto(origin+'/dashboard-demo/map');
    await p.evaluate(async ({svg,vacuum,image,rooms})=>{
      await customElements.whenDefined('t90-map-card');
      const c=window.card=document.querySelector('t90-map-card');
      const now=new Date().toISOString();
      Object.assign(window,{fixtureScan:svg,fixtureCalls:[],vacuum,image});
      const h=window.hass={connected:true,states:{
        [vacuum]:{state:'docked',last_changed:now,attributes:{friendly_name:'Demo Deebot',rooms:Object.fromEntries(rooms.map(([label,id])=>[label,id]))}},
        [image]:{state:now,last_changed:now,attributes:{}}},
        fetchWithAuth:async()=>new Response(window.fixtureScan),
        callService:async(...args)=>window.fixtureCalls.push(args)
      };
      c.setConfig({entity:vacuum,map_entity:image});
      c.hass=h;
    },{svg,vacuum,image,rooms});
    await p.waitForFunction(()=>card.mapReady&&card.frame.contentWindow?.t90ReplayHistory&&card.frame.contentDocument?.querySelector('[data-tracking=live]'));
  }
  const scene=p.frameLocator('iframe');
  await open(old);
  await p.evaluate(({furniture,rooms})=>{
    localStorage.setItem(card.layoutKeys[0],JSON.stringify({version:1,items:furniture}));
    card.config.maps={ [card.scope]:{room_bindings:Object.fromEntries(rooms.map(([,id,path])=>[path,id]))} };
    card.refresh();
    card.frame.srcdoc=card.frame.srcdoc;
  },{rooms,furniture});
  await scene.locator('[data-furnishings="18"][data-tracking=live]').waitFor();
  await p.getByRole('button',{name:'Night',exact:true}).click();
  await p.locator('.rooms summary').click();
  await p.getByRole('button',{name:'Kitchen',exact:true}).click();
  await p.locator('.rooms summary').click();
  await p.locator('[data-action=start]').click();
  assert.deepEqual(await p.evaluate(()=>fixtureCalls),[['vacuum','send_command',{command:'spot_area',params:{rooms:[0],cleanings:1}},{entity_id:vacuum}]]);
  const notify=async(state,newMap)=>{
    const stamp=await p.evaluate(({state,newMap})=>{
      const now=new Date().toISOString();
      if(hass.states[vacuum].state!==state)hass.states[vacuum]={...hass.states[vacuum],state,last_changed:now};
      if(newMap){window.fixtureScan=newMap;hass.states[image].state=now;}
      if(state==='docked')hass.states['event.fixture_robot_last_job']={state:now,attributes:{event_type:'finished'}};
      card.hass=hass;
      return hass.states[image].state;
    },{state,newMap});
    await p.waitForFunction(stamp=>card.mapReady && card.mapStamp===stamp && !card.fetching,stamp);
  };
  await notify('cleaning',old);
  await notify('cleaning',route);
  await notify('docked',null);
  const replay=p.getByRole('button',{name:/Replay( partial)? route/});
  await replay.waitFor({timeout:10000});
  await p.locator('.last-clean summary').click();
  const facts=await p.locator('.last-clean dl').innerText();
  assert.match(facts,/Requested rooms\s+Kitchen/);
  assert.match(facts,/Robot seen in\s+Not reported/);
  assert.match(facts,/Outcome\s+Finished/);
  await replay.click();
  await scene.locator('[data-history-replay=still]').waitFor();
  await p.getByText('Showing the recorded route').waitFor();
  assert.equal(await scene.locator('.feed-label').isVisible(),false);
  if(process.argv.includes('--pictures')){
    await p.evaluate(()=>window.scrollTo(0,0));
    const clip=await p.evaluate(()=>{
      const card=document.querySelector('t90-map-card');
      const top=card.q('.cockpit').getBoundingClientRect();
      const last=card.q('.last-clean').getBoundingClientRect();
      return {x:Math.ceil(top.x),y:Math.ceil(top.y),width:Math.floor(top.width),height:Math.floor(last.bottom-top.y)};
    });
    await p.screenshot({path:'docs/last-clean-replay.png',clip,fullPage:true});
  }
  await p.getByRole('button',{name:'Return to live map'}).click();
  await scene.locator('[data-history-replay=off]').waitFor();
  assert.equal(await scene.locator('.feed-label').isVisible(),true);
  assert.equal(await p.evaluate(()=>fixtureCalls.length),1);
  await open(route);
  await replay.waitFor();
  await p.locator('.last-clean summary').click();
  assert.match(await p.locator('.last-clean dl').innerText(),/Requested rooms\s+Kitchen/);
  await p.emulateMedia({reducedMotion:'no-preference'});
  await replay.click();
  await scene.locator('[data-history-replay=playing]').waitFor();
  await p.getByText('Playing the recorded route').waitFor();
  await scene.locator('[data-history-replay=off]').waitFor({timeout:13500});
  assert.equal(await p.getByRole('button',{name:'Return to live map'}).isHidden(),true);
  assert.equal(await p.evaluate(()=>fixtureCalls.length),0);
  assert.deepEqual(errors,[]);
  console.log('Dist + fictional HA/Ecovacs map: room Start recorded, route captured from actual scan updates, outcome and requested rooms persisted, static/animated 3D replay and manual/natural return passed. Replaying issued zero services.');
}finally{await browser.close();server.close();}
