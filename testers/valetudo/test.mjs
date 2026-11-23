import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import http from 'node:http';
import {deflateSync} from 'node:zlib';
import {launchBrowser} from '../../tests/browser-engine.mjs';
import {convertMap,decodeMapCamera} from './map.js';

const rows=(x,y,w,h)=>Array.from({length:h},(_,i)=>[x,y+i,w]).flat();
function fixture(){
  return {__class:'ValetudoMap',metaData:{version:2,nonce:'fictional-one'},size:{x:1000,y:1000},pixelSize:5,
    layers:[
      {type:'floor',compressedPixels:rows(30,20,60,30)},
      {type:'segment',metaData:{segmentId:'16',name:'Kitchen'},compressedPixels:rows(30,20,30,30)},
      {type:'segment',metaData:{segmentId:'18',name:'Office'},compressedPixels:rows(60,20,30,30)},
      {type:'wall',compressedPixels:[30,19,60,30,50,60,...rows(29,19,1,32),...rows(90,19,1,32)]}
    ],entities:[
      {type:'robot_position',points:[200,150]}, {type:'charger_location',points:[170,130]},
      {type:'path',points:[170,130,190,130,190,150,200,150]}, {type:'predicted_path',points:[200,150,230,150]}
    ]};
}
const base=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD/8AAAAASUVORK5CYII=','base64');
function encode(map){
  const body=Buffer.concat([Buffer.from('zTXtValetudoMap\0\0'),deflateSync(JSON.stringify(map))]);
  let crc=-1;for(const n of body){crc^=n;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  const size=Buffer.alloc(4),checksum=Buffer.alloc(4);
  size.writeUInt32BE(body.length-4);checksum.writeUInt32BE((crc^-1)>>>0);
  return Buffer.concat([base.subarray(0,-12),size,body,checksum,base.subarray(-12)]);
}
const source=fixture();
const first=convertMap(await decodeMapCamera(encode(source)));
assert.equal(first.paths.length,2);
assert.deepEqual(first.overlay.xy,[11,11]);
assert.equal(first.overlay.route,'M25 -35L45 -35L45 -55L55 -55');
assert.match(first.svg,/<use href="#c" x="5" y="7"/);
const moved=fixture();moved.entities[0].points=[215,155];
assert.equal(convertMap(moved).geometryId,first.geometryId);
const reordered=fixture();reordered.layers.reverse();
assert.equal(convertMap(reordered).geometryId,first.geometryId);
const missing=fixture();missing.entities=[];assert.equal(convertMap(missing).overlay.xy,null);
const bad=fixture();bad.layers[0].compressedPixels=[999,1,2];assert.throws(()=>convertMap(bad),/outside/);
await assert.rejects(decodeMapCamera(base),/no ValetudoMap/);
await assert.rejects(decodeMapCamera(encode(source).subarray(0,90)),/Incomplete/);

let reply=encode(source),reads=0;
const bundle=await readFile(process.env.VALETUDO_TEST_BUNDLE||new URL('../../dist/valetudo-map-card.js',import.meta.url));
const server=http.createServer((req,res)=>{
  if(req.url==='/card.js'){res.writeHead(200,{'Content-Type':'application/javascript'});res.end(bundle);return;}
  if(req.url==='/api/camera_proxy/camera.robot_map'){reads++;res.writeHead(200,{'Content-Type':'image/png'});res.end(reply);return;}
  res.writeHead(200,{'Content-Type':'text/html'});res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><valetudo-map-card></valetudo-map-card><script type="module" src="/card.js"></script>');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser;
try{
 browser=await launchBrowser();
 const page=await browser.newPage({viewport:{width:920,height:660}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);
 await page.evaluate(async()=>{
   await customElements.whenDefined('valetudo-map-card');
   window.c=document.querySelector('valetudo-map-card');window.calls=[];
   const state={state:'idle',last_changed:new Date().toISOString()};
   window.h={connected:true,states:{'vacuum.robot':state,'camera.robot_map':state},entities:{
     'vacuum.robot':{platform:'mqtt',device_id:'one'},'camera.robot_map':{platform:'mqtt',device_id:'other'}},
     fetchWithAuth:(...args)=>fetch(...args),callService:(...args)=>calls.push(args)};
   c.setConfig({entity:'vacuum.robot',map_entity:'camera.robot_map',appearance:'night'});c.hass=h;
 });
 assert.equal(reads,0);
 await page.evaluate(()=>{h.entities['camera.robot_map'].device_id='one';c.hass=h;});
 const card=page.locator('valetudo-map-card'),frame=card.frameLocator('iframe');
 const viewer=frame.locator('.viewer');
 await frame.locator('[data-regions="2"][data-tracking="live"]').waitFor();
 await page.evaluate(()=>{
   const editor=customElements.get('valetudo-map-card').getConfigElement();
   document.body.append(editor);editor.setConfig({entity:'vacuum.robot',map_entity:'camera.robot_map'});editor.hass=h;
 });
 const editor=page.locator('valetudo-map-card-editor');
 await editor.getByRole('button',{name:'Preview selected map'}).click();
 await editor.getByAltText('Floor outline from the selected map').waitFor();
 await editor.getByText('Test details',{exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('valetudo-map-card-editor').shadowRoot.querySelector('textarea').value);
 assert.match(await editor.getByRole('textbox').inputValue(),/3D floor available/);
 await editor.evaluate(el=>el.remove());
 assert.equal(await viewer.getAttribute('data-robot-position'),'11,11');
 assert.equal(await viewer.getAttribute('data-dock'),'true');
 assert.equal(await viewer.getAttribute('data-trace-segments'),'3');
 await frame.getByRole('button',{name:'Follow robot'}).click();
 reply=encode(moved);await page.evaluate(()=>c.check(true));
 await frame.locator('[data-camera="follow"][data-robot-position="14,12"]').waitFor();
 reply=base;await page.evaluate(()=>c.check(true));
 await card.getByText(/no ValetudoMap/).waitFor();assert.equal(await card.locator('iframe').isHidden(),true);
 reply=encode(moved);await page.evaluate(()=>c.check(true));await card.locator('iframe').waitFor();
 await page.evaluate(()=>{h.connected=false;c.hass=h;});assert.equal(await card.locator('iframe').count(),0);
 await page.setViewportSize({width:390,height:780});
 await page.evaluate(()=>{h.connected=true;c.hass=h;});await frame.locator('[data-regions="2"][data-tracking="live"]').waitFor();
 await frame.getByRole('button',{name:'Top view'}).click();
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(await page.evaluate(()=>calls),[]);assert.deepEqual(errors,[]);
 console.log('Valetudo native camera: PNG and v2 geometry, 2 rooms, live pose, dock, path, Follow, same-device pairing, invalid camera/recovery and mobile top view passed. Zero commands.');
}finally{await browser?.close();server.close();}
