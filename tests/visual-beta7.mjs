import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {rooms,scan} from './fixture.mjs';

const bundle = await readFile(process.env.CARD_BUNDLE || 'dist/t90-map-card.js');
const html = '<!DOCTYPE html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}t90-map-card{display:block}</style><t90-map-card></t90-map-card><script type="module" src="/card.js"></script>';
const server = createServer((req,res) => {
  const script = req.url === '/card.js';
  res.setHeader('Content-Type', script ? 'application/javascript' : 'text/html');
  res.end(script ? bundle : html);
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser = await chromium.launch({executablePath:process.env.CHROME_BIN,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  for (const roborock of [false,true]) {
    const page = await browser.newPage({viewport:{width:1100,height:820},reducedMotion:'reduce'});
    const errors = [];
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port);
    await page.evaluate(async({roborock,rooms,svg})=>{
      await customElements.whenDefined('t90-map-card');
      const names=Object.fromEntries(rooms.map(([name,id])=>[name,id]));
      const entities=['vacuum.test','image.floor','select.test_mop_strength'];
      const states={
        'vacuum.test':{state:'docked',attributes:{friendly_name:'Robot',rooms:names,fan_speed_list:['normal','strong'],fan_speed:'normal'}},
        'image.floor':{state:new Date().toISOString(),attributes:{}},
        'select.test_mop_strength':{state:'medium',attributes:{friendly_name:'Mop strength',options:['low','medium','high']}}
      };
      const cv=document.createElement('canvas');cv.width=240;cv.height=160;
      const ctx=cv.getContext('2d');
      ctx.fillStyle='#5d6d7e';ctx.fillRect(0,0,240,160);
      ctx.fillStyle='#f0b27a';ctx.fillRect(4,4,112,152);
      ctx.fillStyle='#85c1e9';ctx.fillRect(120,4,116,152);
      const image=await new Promise(resolve=>cv.toBlob(resolve));
      window.calls=[];
      const hass={states,connected:true,entities:Object.fromEntries(entities.map(id=>[id,{device_id:'fictional',platform:roborock?'roborock':'ecovacs'}])),
        fetchWithAuth:async()=>new Response(roborock?image:svg),
        callService:async(...args)=>calls.push(args),
        callWS:async()=>({response:{'vacuum.test':{maps:[{flag:0,name:'Demo',rooms:{1:'Kitchen',2:'Hall'}}]}}})};
      window.card=document.querySelector('t90-map-card');
      card.setConfig({type:'custom:t90-map-card',entity:entities[0],map_entity:entities[1],...(roborock?{map_source:'roborock_qrevo'}:{})});
      card.hass=hass;
      window.setRobotState=value=>{states['vacuum.test'].state=value;card.hass=hass;};
    },{roborock,rooms,svg:scan()});
    const card=page.locator('t90-map-card'), frame=card.frameLocator('iframe');
    await frame.locator('.viewer[data-rendered=true]').waitFor();
    if (roborock) await frame.getByRole('button',{name:'Top view'}).click();
    else {
      await page.evaluate(rooms=>{
        card.config.maps={[card.scope]:{room_bindings:Object.fromEntries(rooms.map(([,id,d])=>[d,id]))}};
        card.refresh();
      },rooms);
      await frame.getByRole('combobox',{name:'Camera view'}).selectOption('top');
    }
    const canvas=frame.locator('canvas').first();
    const panel=card.locator('.robot-panel'), more=panel.locator('.more-controls');
    const start=panel.locator('[data-action=start]'),pause=panel.locator('[data-action=pause]');
    const home=panel.locator('[data-action=return_to_base]'),picker=card.locator('.rooms summary');
    assert.equal(await more.isVisible(),false);
    const selectRoom=async()=>{
      await picker.click();
      await card.getByRole('button',{name:'Kitchen',exact:true}).click();
      await picker.click();
    };
    for (const look of ['daylight','night']) {
      await card.locator('[data-look='+look+']').click();
      const before=await canvas.screenshot();
      await selectRoom();
      const after=await canvas.screenshot();
      const count=await page.evaluate(async({a,b})=>{
        async function pixels(base64) {
          const blob=await (await fetch('data:image/png;base64,'+base64)).blob();
          const im=await createImageBitmap(blob), cv=document.createElement('canvas');
          cv.width=im.width;cv.height=im.height;
          const ctx=cv.getContext('2d');ctx.drawImage(im,0,0);im.close();
          return ctx.getImageData(0,0,cv.width,cv.height).data;
        }
        const [original,selected]=await Promise.all([pixels(a),pixels(b)]);
        let softenedTeal=0;
        for(let i=0;i<original.length;i+=4) {
          const dr=selected[i]-original[i], dg=selected[i+1]-original[i+1], db=selected[i+2]-original[i+2];
          if(dg-dr>3 && db-dr>3 && Math.abs(dr)<85) softenedTeal++;
        }
        return softenedTeal;
      },{a:before.toString('base64'),b:after.toString('base64')});
      assert.ok(count>600,'Selected room should have visible, restrained teal floor pixels. Got '+count);
      assert.deepEqual(await canvas.screenshot(),after,'Selection tint should stay still');
      await selectRoom();
      assert.deepEqual(await canvas.screenshot(),before,'Deselecting should restore the original room');
    }
    await selectRoom();
    for(const width of [390,320]) {
      await page.setViewportSize({width,height:800});
      await more.waitFor();
      assert.equal(await more.getAttribute('aria-expanded'),'false');
      assert.equal(await home.isVisible(),false);
      assert.equal(await start.isVisible(),true);
      assert.equal(await pause.isVisible(),false);
      assert.equal(await panel.locator('.target').textContent(),'Kitchen');
      assert.ok((await panel.boundingBox()).height<106,'Collapsed bar must stay compact');
      await more.focus();await more.press('Enter');
      assert.equal(await more.getAttribute('aria-expanded'),'true');
      const strength=panel.getByRole('combobox',{name:'Mop strength'});
      await strength.selectOption('high');
      assert.deepEqual(await page.evaluate(()=>calls.at(-1)),['select','select_option',{option:'high'},{entity_id:'select.test_mop_strength'}]);
      assert.ok(await home.isVisible());
      assert.ok(await card.evaluate(c=>c.scrollWidth<=c.clientWidth));
      await page.setViewportSize({width:1100,height:820});
      await card.locator('.cleaning-settings .settings select').first().waitFor({state:'attached'});
      assert.ok(await home.isVisible());
      await page.setViewportSize({width,height:800});
      await strength.waitFor();
      await more.focus();await more.press('Space');
      await page.evaluate(()=>setRobotState('cleaning'));
      assert.equal(await pause.isVisible(),true);assert.equal(await start.isVisible(),false);
      assert.ok(await panel.locator('.target').isVisible());
      await page.evaluate(()=>setRobotState('paused'));
      assert.equal(await start.getAttribute('aria-label'),'Resume');
      await page.evaluate(()=>setRobotState('docked'));
    }
    assert.deepEqual(errors,[]);
    await page.close();
    console.log('Passed '+(roborock?'Roborock':'Ecovacs')+' selection tint in both themes, phone toolbar at 320/390 px, live mop options, controls and resize to desktop.');
  }
} finally {await browser.close();server.close();}
