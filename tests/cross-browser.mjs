import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {sampleMap,mountDreame} from './dreame.mjs';
const {webkit,firefox}=await import('playwright-core');
const sources=new Map([
 ['/d.js',new URL('../dist/dreame-map-card-beta.js',import.meta.url)],
 ['/s.js',new URL('../dist/switchbot-vacuum-card.js',import.meta.url)],
 ['/t.js',new URL('../dist/t90-map-card.js',import.meta.url)]
]);
const server=http.createServer(async(req,res)=>{
 const asset=sources.get(req.url);
 if(asset){res.setHeader('Content-Type','text/javascript');res.end(await readFile(asset));return;}
 res.setHeader('Content-Type','text/html');
 res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:8px}dreame-map-card-beta,switchbot-vacuum-card{display:block}:root{--primary-text-color:#203030;--card-background-color:#fff}</style>');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const home='http://127.0.0.1:'+server.address().port;
async function modules(page){await page.evaluate(async()=>{
 await import('/d.js');await import('/s.js');await import('/t.js');
 window.dreameTesterTag='dreame-map-card-beta';window.dreameModel={stem:'l40s_pro_ultra',name:'Dreame L40s Pro Ultra'};
});}
async function dreame(page){
 await page.evaluate(mountDreame,sampleMap());
 const card=page.locator('dreame-map-card-beta'),fr=card.frameLocator('iframe');
 await fr.locator('[data-regions="2"][data-tracking="live"]').waitFor();
 await fr.getByRole('button',{name:'Top view',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('dreame-map-card-beta').frame.contentDocument.querySelector('.viewer').dataset.cameraMotion==='idle');
 const canvas=fr.locator('canvas');await canvas.scrollIntoViewIfNeeded();
 const rect=await canvas.boundingBox();
 const [l,t,w,h]=await card.evaluate(c=>new DOMParser().parseFromString(c.frame.t90Map.scan,'image/svg+xml').documentElement.getAttribute('viewBox').split(' ').map(Number));
 const scale=rect.height/Math.max(h*1.42,w*1.15*rect.height/rect.width);
 await page.mouse.click(rect.x+rect.width/2+(52-l-w/2)*scale,rect.y+rect.height/2+(62-t-h/2)*scale);
 assert.equal(await fr.locator('.viewer').getAttribute('data-selected-rooms'),'3');
 assert.deepEqual(await page.evaluate(()=>dreameDemo.calls),[]);
 await card.getByRole('button',{name:'Start · Office',exact:true}).click();
 await page.waitForFunction(()=>dreameDemo.calls.length);
 assert.deepEqual(await page.evaluate(()=>dreameDemo.calls),[['dreame_vacuum','vacuum_clean_segment',{segments:[3]},{entity_id:'vacuum.l40s_pro_ultra'}]]);
 await fr.getByRole('button',{name:'Top view',exact:true}).click();
 await card.evaluate(async c=>{dreameDemo.map.robot_position=[-500,-100,90];await c.pullMap(true);});
 assert.equal(await fr.locator('.viewer').getAttribute('data-robot-position'),'42,41.98');
 assert.equal(await fr.locator('.viewer').getAttribute('data-trace-segments'),'2');
}
async function switchbot(page){
 await page.evaluate(()=>{
  const c=document.createElement('switchbot-vacuum-card');
  document.body.replaceChildren(c);window.calls=[];
  const id='vacuum.s10';
  c.setConfig({entity:id,room_selection:true,floor_plan:{rooms:[{name:'Office',room_id:'ROOM_12',points:[[0,0],[4,0],[4,3],[0,3]]},{name:'Kitchen',room_id:'ROOM_34',points:[[4,0],[7,0],[7,3],[4,3]]}]}});
  c.hass={connected:true,entities:{[id]:{platform:'switchbot_vacuum',device_id:'d'}},devices:{d:{model:'Floor Cleaning Robot S10'}},services:{switchbot_vacuum:{clean_rooms:{}}},states:{[id]:{state:'idle',attributes:{rooms:{ROOM_12:'Office',ROOM_34:'Kitchen'},supported_features:8192+4+16}}},callService:async(...args)=>calls.push(args)};
 });
 const c=page.locator('switchbot-vacuum-card'),map=c.locator('switchbot-floorplan-beta');
 await map.locator('canvas').waitFor();
 await map.getByRole('button',{name:'Kitchen',exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>calls),[]);
 await map.getByRole('button',{name:'Top view'}).click(); await map.getByRole('button',{name:'3D view'}).click();
 await c.getByRole('button',{name:'Clean selected rooms'}).click();
 assert.deepEqual(await page.evaluate(()=>calls),[['switchbot_vacuum','clean_rooms',{rooms:['ROOM_34']},{entity_id:'vacuum.s10'}]]);
}
const requested=process.argv.slice(2);
try{
 await Promise.all(Object.entries({webkit,firefox}).filter(([name])=>!requested.length||requested.includes(name)).map(async([name,engine])=>{
  const browser=await engine.launch({headless:process.env.CROSS_HEADED!=='1'});
  try{
   const errors=[];
   const page=await browser.newPage();page.setDefaultTimeout(12000);page.on('pageerror',e=>errors.push(e.message));
   await page.goto(home);
   const gl=await page.evaluate(()=>{const gl=document.createElement('canvas').getContext('webgl2');return gl?.getParameter(gl.VERSION)??'unavailable'});
   console.log(name,browser.version(),'WebGL2:',gl);
   for(const width of [1120,390]){
    await page.setViewportSize({width,height:850});await page.reload();await modules(page);
    for(const run of [dreame,switchbot]){
     try{
      await run(page);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Horizontal page overflow');
      console.log('PASS',name,width,run.name);
     }catch(e){process.exitCode=1;console.error('FAIL',name,width,run.name,e.message.slice(0,500),errors);}
    }
   }
   assert.deepEqual(errors,[]);
  }finally{await browser.close();}
 }));
}finally{server.close();}
