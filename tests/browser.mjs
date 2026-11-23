import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { rooms, scan, furniture } from './fixture.mjs';
const bundle = await readFile('dist/t90-map-card.js');
const document = '<!DOCTYPE html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{background:#121313;color:#f4efe9;margin:18px;font:15px system-ui}t90-map-card{display:block;max-width:1460px;margin:auto}</style><t90-map-card></t90-map-card><script type="module" src="/card.js"></script>';
const server = http.createServer((req,res) => {
  const js=req.url==='/card.js';
  res.setHeader('Content-Type',js?'text/javascript':'text/html'); res.end(js?bundle:document);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser = await chromium.launch({executablePath:process.env.CHROME_BIN || undefined,
  args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page=await browser.newPage({viewport:{width:1410,height:935},deviceScaleFactor:1});
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/demo/robot');
  await page.evaluate(async ({rooms,svg}) => {
    await customElements.whenDefined('t90-map-card');
    window.card=document.querySelector('t90-map-card');
    window.config={type:'custom:t90-map-card',entity:'vacuum.demo_bot',map_entity:'image.floor_plan'};
    window.stamp=0;
    window.tick=()=>new Date(Date.UTC(2026,0,1)+1000*++stamp).toISOString();
    window.validScan=svg;window.maps={'image.floor_plan':svg};
    window.calls=[];
    const roomNames=Object.fromEntries(rooms.map(([name,id])=>[name,id]));
    const state=(state,attributes={})=>({state,attributes,last_changed:tick()});
    window.hass={connected:true,states:{
      'vacuum.demo_bot':state('idle',{friendly_name:'Deebot T90',fan_speed_list:['quiet','standard','strong'],fan_speed:'standard',rooms:roomNames}),
      'image.floor_plan':state(tick()),'sensor.demo_bot_battery':state('92',{friendly_name:'Battery',unit_of_measurement:'%'}),
      'select.demo_bot_work_mode':state('vacuum',{friendly_name:'Work mode',options:['vacuum','mop']})},
      entities:Object.fromEntries(['vacuum.demo_bot','image.floor_plan','sensor.demo_bot_battery','select.demo_bot_work_mode'].map(k=>[k,{device_id:'one'}])),
      fetchWithAuth:async url=>{const xml=maps[url.split('/').at(-1)];return new Response(xml,{status:xml?200:404});},
      callService:async(...args)=>calls.push(args)};
    let dashboard={views:[{sections:[{cards:[structuredClone(config)]}]}]};
    hass.callWS=async req=>{if(req.type==='lovelace/config/save') dashboard=structuredClone(req.config);return structuredClone(dashboard);};
    card.setConfig(config);card.hass=hass;
  },{rooms,svg:scan()});
  const card=page.locator('t90-map-card').first(), scene=card.frameLocator('iframe');
  const viewer=scene.locator('.viewer');
  await scene.locator('[data-tracking=live]').waitFor();
  assert.equal(await viewer.getAttribute('data-regions'),'4');
  assert.equal(await viewer.getAttribute('data-furnishings'),'0');
  assert.equal(await viewer.getAttribute('data-robot-position'),'47,27');
  const originalScope=await card.evaluate(c=>c.scope);
  await page.evaluate(({furniture,rooms})=>{
    localStorage.setItem(card.layoutKeys[0],JSON.stringify({version:1,items:furniture}));
    card.frame.srcdoc=card.frame.srcdoc;
  },{furniture,rooms});
  await scene.locator('[data-tracking=live]').waitFor();
  await page.waitForFunction(()=>Number(card.frame.contentDocument?.querySelector('.viewer')?.dataset.furnishings)>8);
  const open=()=>card.locator('.rooms summary').click();
  await open();
  await card.getByRole('button',{name:'Kitchen',exact:true}).click();
  await card.getByRole('button',{name:'Living room',exact:true}).click();
  await open();
  const start=card.getByRole('button',{name:'Start · Kitchen + Living room'});
  await start.click();
  assert.deepEqual(await page.evaluate(()=>calls[0]),['vacuum','send_command',{command:'spot_area',params:{rooms:[0,4],cleanings:1}},{entity_id:'vacuum.demo_bot'}]);
  await page.evaluate(({rooms})=>{
    card.config.maps={ [card.scope]:{room_bindings:Object.fromEntries(rooms.map(([name,id,d])=>[d,id]))} };
    card.refresh();
  },{rooms});
  const lookButton = name => card.getByRole('button',{name,exact:true});
  const layoutBounds = () => card.evaluate(c => {
    const map = c.frame.getBoundingClientRect(), robot = c.q('.robot-panel').getBoundingClientRect();
    return { below:robot.top >= map.bottom - 1, beside:robot.left >= map.right - 1 };
  });
  assert.equal(await lookButton('Daylight').getAttribute('aria-pressed'),'true');
  assert.equal((await layoutBounds()).below,true);
  assert.equal(await scene.locator('.tools').evaluate(el=>el.getBoundingClientRect().bottom <= window.innerHeight),true);
  if (process.argv.includes('--pictures')) {
    await mkdir('docs',{recursive:true});
    await card.locator('.cockpit').screenshot({path:'docs/dashboard.png'});
  }
  const originalCanvas = await scene.locator('canvas').elementHandle();
  await lookButton('Night').click();
  assert.equal(await scene.locator('html').getAttribute('data-appearance'),'night');
  assert.equal((await layoutBounds()).beside,true);
  assert.equal(await originalCanvas.evaluate(canvas => canvas.isConnected),true);
  assert.equal(await start.isEnabled(),true);
  if (process.argv.includes('--pictures')) await card.locator('.cockpit').screenshot({path:'docs/dashboard-night.png'});
  await page.setViewportSize({width:390,height:844});
  assert.equal((await layoutBounds()).below,true);
  assert.equal(await scene.locator('.tools').evaluate(el=>el.getBoundingClientRect().bottom <= window.innerHeight),true);
  assert.equal(await card.evaluate(c => c.scrollWidth <= c.clientWidth),true);
  await page.setViewportSize({width:1410,height:935});
  await scene.getByRole('button',{name:'Lock layout',exact:true}).click();
  assert.equal(await scene.getByRole('button',{name:'Edit walls'}).count(),0);
  await page.evaluate(()=>{card.frame.srcdoc=card.frame.srcdoc;});
  await scene.getByRole('button',{name:'Unlock layout'}).click();
  await scene.getByRole('button',{name:'Edit walls'}).click();
  await scene.locator('canvas').press('PageDown');
  assert.match(await scene.locator('.wall-measure').innerText(),/map units · .+°/);
  const knob=scene.getByRole('button',{name:'Drag to rotate wall'});
  await knob.press('Shift+ArrowRight');
  assert.match(await scene.locator('.wall-measure').innerText(),/15\.0°|105\.0°/);
  if (process.argv.includes('--pictures')) await viewer.screenshot({path:'docs/wall-editor.png'});
  await scene.getByRole('button',{name:'Undo',exact:true}).click();
  await scene.getByRole('button',{name:'Done',exact:true}).click();
  await scene.getByRole('button',{name:'Edit furnishings'}).click();
  await scene.locator('canvas').press('PageDown');
  await scene.getByRole('button',{name:'Drag to rotate furniture'}).waitFor();
  if(process.argv.includes('--pictures')) await viewer.screenshot({path:'docs/furniture-editor.png'});
  const readFurniture = () => page.evaluate(() => JSON.parse(localStorage.getItem(card.layoutKeys[0])).items);
  const oldItems = await readFurniture();
  const canvasKeys = scene.locator('canvas');
  for (const [kind,name] of Object.entries({
    ledStrip:'LED strip',floorLamp:'Floor lamp',plant:'Potted plant',officeDesk:'Office desk',officeChair:'Office chair'
  })) {
    await scene.getByRole('button',{name:'Add furniture',exact:true}).click();
    await scene.getByRole('button',{name,exact:true}).click();
    await canvasKeys.press('Enter');
    const placed = (await readFurniture()).at(-1);
    assert.equal(placed.kind,kind);
    await canvasKeys.press('ArrowRight');
    await scene.getByRole('button',{name:'Drag to rotate furniture'}).press('Shift+ArrowLeft');
    await scene.getByRole('button',{name:'Resize',exact:true}).click();
    await scene.getByRole('slider',{name:'Width',exact:true}).press('ArrowRight');
    const edited = (await readFurniture()).at(-1);
    assert.equal(edited.x,placed.x+1.5);
    assert.ok(Math.abs(edited.rotation - 15/90) < 1e-8);
    assert.equal(edited.width,105);
  }
  const editedItems = await readFurniture();
  assert.deepEqual(editedItems.slice(0,oldItems.length),oldItems);
  await lookButton('Daylight').click();
  assert.equal(await scene.locator('.selected-name').innerText(),'Office chair');
  assert.equal(await scene.locator('html').getAttribute('data-appearance'),'daylight');
  await lookButton('Night').click();
  await scene.getByRole('button',{name:'Done',exact:true}).click();
  await page.evaluate(() => { card.frame.srcdoc = card.frame.srcdoc; });
  await scene.locator('[data-tracking=live]').waitFor();
  assert.equal(await viewer.getAttribute('data-furnishings'),String(editedItems.length));
  assert.deepEqual(await readFurniture(),editedItems);
  assert.equal(await scene.locator('html').getAttribute('data-appearance'),'night');
  const f=page.frames().find(frame=>frame.parentFrame());
  await f.getByRole('button',{name:'Top view'}).click();await f.waitForFunction(()=>document.querySelector('.viewer').dataset.cameraMotion==='idle');
  await page.evaluate(()=>{card.selectedRooms.clear();card.config.maps={};card.refresh();});
  await scene.getByRole('button',{name:'Lock layout',exact:true}).click();
  const canvas=await scene.locator('canvas').boundingBox();
  const scale=canvas.height/Math.max(146*1.42,194*1.15/(canvas.width/canvas.height));
  await page.mouse.click(canvas.x+canvas.width/2+(45-97)*scale,canvas.y+canvas.height/2+(31-73)*scale);
  await card.getByLabel('Ecovacs room name').selectOption('0');
  await card.getByRole('button',{name:'Save room',exact:true}).click();
  await card.getByRole('button',{name:'Start · Kitchen',exact:true}).waitFor();
  assert.equal(await card.locator('[data-action=start]').innerText(),'Start · Kitchen');
  await card.getByText('Room layout',{exact:true}).click();
  await card.getByRole('button',{name:'Save this layout to the dashboard'}).click();
  await card.getByRole('status').filter({hasText:'Layout saved'}).waitFor();
  await scene.locator('[data-tracking=live]').waitFor();
  const download=page.waitForEvent('download');
  await card.getByRole('button',{name:'Export layout file'}).click();
  assert.equal((await download).suggestedFilename(),'deebot-room-layout.json');
  assert.equal(await page.evaluate(()=>calls.length),1);
  await page.evaluate(()=>{hass.states['vacuum.demo_bot'].state='paused';card.hass=hass;});
  await card.getByRole('button',{name:'Resume',exact:true}).click();
  assert.equal(await page.evaluate(()=>calls.at(-1)[1]),'start');
  await page.evaluate(()=>{maps['image.floor_plan']=maps['image.floor_plan'].replace('0 0 194 146','-40 -20 270 190');hass.states['image.floor_plan'].state=tick();card.hass=hass;});
  await page.waitForFunction(old=>card.scope!==old,originalScope);
  await scene.locator('[data-furnishings="0"][data-tracking="live"]').waitFor();
  assert.equal(await page.evaluate(()=>card.selectedRooms.size),0);
  await page.evaluate(()=>{maps['image.floor_plan']='<svg xmlns="http://www.w3.org/2000/svg"/>';hass.states['image.floor_plan'].state=tick();card.hass=hass;});
  await card.getByRole('status').filter({hasText:'Expected the Ecovacs SVG'}).waitFor();
  await page.evaluate(() => {
    const second = document.createElement('t90-map-card');
    document.body.append(second);
    maps['image.upstairs'] = maps['image.floor_plan'] = window.validScan;
    hass.states['vacuum.upstairs'] = { state:'idle',attributes:{friendly_name:'Upstairs',rooms:{Office:0}} };
    hass.states['image.upstairs'] = { state:tick(),attributes:{} };
    hass.entities['vacuum.upstairs'] = hass.entities['image.upstairs'] = {device_id:'two'};
    second.setConfig({type:'custom:t90-map-card',entity:'vacuum.upstairs',map_entity:'image.upstairs'});
    second.hass=hass;
  });
  const second=page.locator('t90-map-card').nth(1);
  await second.frameLocator('iframe').locator('[data-furnishings="0"][data-tracking="live"]').waitFor();
  assert.equal(await second.getAttribute('data-appearance'),'daylight');
  await second.locator('.rooms summary').click();
  await second.getByRole('button',{name:'Office',exact:true}).click();
  await second.getByRole('button',{name:'Start · Office',exact:true}).click();
  assert.equal(await page.evaluate(()=>calls.at(-1)[3].entity_id),'vacuum.upstairs');
  assert.equal(await second.locator('.settings').getByText('Work mode').count(),0);
  await second.evaluate(c=>{c.setConfig({...c.config,map_entity:'image.floor_plan'});});
  await second.getByRole('status').filter({hasText:'belongs to another device'}).waitFor();
  if (process.env.T90_TEST_SVG) {
    const xml=await readFile(process.env.T90_TEST_SVG,'utf8');
    await page.evaluate(xml=>{maps['image.floor_plan']=xml;hass.states['image.floor_plan'].state=tick();card.hass=hass;},xml);
    await page.waitForFunction(()=>Number(card.frame.contentDocument?.querySelector('.viewer')?.dataset.regions)>4);
    await scene.locator('[data-tracking=live]').waitFor();
    console.log('Additional local Ecovacs SVG rendered successfully.');
  }
  await page.evaluate(() => {
    const replacement = document.createElement('t90-map-card');
    card.replaceWith(replacement);
    window.card = replacement;
    card.setConfig(config);
    card.hass = hass;
  });
  assert.equal(await lookButton('Night').getAttribute('aria-pressed'),'true');
  await scene.locator('[data-tracking=live]').waitFor();
  assert.equal(await scene.locator('html').getAttribute('data-appearance'),'night');
  assert.deepEqual(errors,[]);
  console.log('Passed: dynamic maps, clean initial layout, floor switch, scoped edits, room 0, lock and room taps, wall angle, furniture handles, pause/resume, invalid map.');
} finally { await browser.close(); await new Promise(resolve=>server.close(resolve)); }
