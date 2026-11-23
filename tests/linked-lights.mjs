import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {rooms,scan} from './fixture.mjs';
import {fixtureLightState,createFixtureLights,validLightId} from '../src/fixture-lights.js';
import {fixtureLightMaterials} from '../src/fixture-light-materials.js';
import {Group,Mesh,MeshBasicMaterial,MeshStandardMaterial} from 'three';

const state=(value,attributes={})=>fixtureLightState({state:value,attributes});
assert.equal(state('on',{hs_color:[120,100],brightness:128}).color,'#00ff00');
assert.equal(state('on',{rgb_color:[30,94,240]}).color,'#1e5ef0');
assert.equal(state('on',{brightness:0}).level,0);
assert.equal(state('off',{brightness:255}).level,0);
assert.equal(state('unknown').state,'unavailable');
assert.equal(state('on',{color_mode:'color_temp',color_temp_kelvin:2700,rgb_color:[0,0,255]}).color,'#ffa757');
assert.equal(state('on',{color_temp:400}).color,state('on',{color_temp_kelvin:2500}).color);
assert.ok(!validLightId('switch.kitchen') && !validLightId('light.bad/id'));
const fake={states:{'light.a':{state:'off',attributes:{}},'light.b':{state:'off',attributes:{}}}};
const feed=createFixtureLights(()=>fake), changes=[];
feed.watch(['light.a'],ids=>changes.push([...ids]));
fake.states['light.b'].state='on';feed.refresh();
fake.states['light.a'].last_updated='now';feed.refresh();
fake.states['light.a'].state='on';feed.refresh();feed.refresh();
fake.connected=false;feed.refresh();feed.refresh();
assert.deepEqual(changes,[['light.a'],['light.a']]);
// Two copies of the same lamp share its artistic defaults. Linking one must
// leave the other alone. Clearing must reattach the identical material objects.
const prototype=new Group();
const emitter=new Mesh(undefined,new MeshStandardMaterial({color:0xffe8c4,emissive:0xffbd73,emissiveIntensity:2.15}));
emitter.userData.fixtureEmitter=true;
const pool=new Mesh(undefined,new MeshBasicMaterial({color:0xffcc91,opacity:.68,transparent:true}));
pool.userData.lightPool=true;prototype.add(emitter,pool);
const first=prototype.clone(),second=prototype.clone(),materials=fixtureLightMaterials();
materials.apply(first,state('on',{rgb_color:[0,120,255],brightness:128}));
assert.notEqual(first.children[0].material,emitter.material);
assert.equal(second.children[0].material,emitter.material);
assert.equal(first.children[1].material.opacity,.68*128/255);
materials.apply(first,null);
assert.equal(first.children[0].material,emitter.material);assert.equal(first.children[1].material,pool.material);
const captures=process.env.LIGHT_PICTURES;
if(captures)await mkdir(captures,{recursive:true});


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
      states['light.reading']={state:'off',attributes:{friendly_name:'Reading lamp'}};
      states['light.strip']={state:'off',attributes:{friendly_name:'Kitchen LED'}};
      for(let i=0;i<195;i++)states['light.room_'+i]={state:'off',attributes:{friendly_name:'Spare light '+i}};
      states['switch.private_test']={state:'off',attributes:{}};
      const pieces=window.pieces=[
        {id:1,kind:'floorLamp',x:roborock?12:64,z:roborock?20:37,width:100,depth:100,rotation:0},
        {id:2,kind:'ledStrip',x:roborock?42:44,z:roborock?22:86,width:100,depth:100,rotation:0}
      ];
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
      const config={type:'custom:t90-map-card',entity:entities[0],map_entity:entities[1],...(roborock?{map_source:'roborock_qrevo',maps:{'qrevo:vacuum.test:image.floor:0':{plan:{version:1,anchor:null,finishes:{},ops:[],furniture:{version:1,items:pieces}}}}}:{})};
      let dashboard={views:[{cards:[structuredClone(config)]}]};
      const service=hass.callWS;
      hass.callWS=async req=>{
        if(req.type==='lovelace/config')return structuredClone(dashboard);
        if(req.type==='lovelace/config/save'){dashboard=structuredClone(req.config);return {};}
        return service(req);
      };
      card.setConfig(config);window.hass=hass;
      window.updateLight=(id,value,attributes={})=>{
        if(value===null)delete states[id];
        else states[id]={state:value,attributes:{friendly_name:id==='light.strip'?'Kitchen LED':'Reading lamp',...attributes}};
        card.hass=hass;
      };
      card.hass=hass;
      window.setRobotState=value=>{states['vacuum.test'].state=value;card.hass=hass;};
    },{roborock,rooms,svg:scan()});
    const card=page.locator('t90-map-card'), frame=card.frameLocator('iframe');
    await frame.locator('.viewer[data-rendered=true]').waitFor();

    if(!roborock){
      await page.evaluate(()=>{
        localStorage.setItem(card.layoutKeys[0],JSON.stringify({version:1,items:pieces}));
        card.frame.srcdoc=card.frame.srcdoc;
      });
    }
    await frame.locator('.viewer[data-furnishings="2"]').waitFor();
    const canvas=frame.locator('canvas').first();
    const ui=frame.locator('#furnishing-editor');
    const picker=ui.getByRole('combobox',{name:'Home Assistant light'});
    async function openEditor(){
      if(!roborock) await frame.getByText('Edit map',{exact:true}).click();
      await frame.getByRole('button',{name:'Edit furnishings',exact:true}).click();
      await canvas.press('PageDown');
      await ui.locator('[data-furnishing=link]').click();
      await picker.waitFor();
    }
    async function done(){await ui.locator('[data-furnishing=done]').click();}
    async function maximumRGB(first,second){
      return page.evaluate(async([before,after])=>{
      async function decode(encoded){
        const bitmap=await createImageBitmap(await (await fetch('data:image/png;base64,'+encoded)).blob());
        const cv=document.createElement('canvas');cv.width=bitmap.width;cv.height=bitmap.height;
        const ctx=cv.getContext('2d');ctx.drawImage(bitmap,0,0);bitmap.close();
        return ctx.getImageData(0,0,cv.width,cv.height).data;
      }
      const [a,b]=await Promise.all([decode(before),decode(after)]);
      if(a.length!==b.length)return Infinity;
      let max=0;
      for(let i=0;i<a.length;i++)max=Math.max(max,Math.abs(a[i]-b[i]));
      return max;
    },[first.toString('base64'),second.toString('base64')]);
    }
    async function afterRender(){await canvas.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));}
    async function update(id,value,attributes){await page.evaluate(args=>updateLight(...args),[id,value,attributes]);await afterRender();}
    const filename=roborock?'roborock':'ecovacs';
    await card.locator('[data-look=night]').click();
    await afterRender();
    await openEditor();
    const search=ui.getByRole('searchbox',{name:'Find a light'});
    await search.fill('reading');
    assert.deepEqual(await picker.locator('option').evaluateAll(opts=>opts.map(o=>o.value)),['','light.reading']);
    assert.equal(await picker.inputValue(),'');
    await picker.selectOption('light.reading');
    await search.fill('nothing matches');
    assert.equal(await picker.inputValue(),'light.reading');
    await search.press('Escape');
    assert.equal(await picker.inputValue(),'light.reading');
    await canvas.press('PageDown');
    await ui.locator('[data-furnishing=link]').click();
    await search.fill('light.strip');
    await picker.selectOption('light.strip');
    await done();
    if(roborock){
      await frame.getByRole('button',{name:'Save to dashboard',exact:true}).click();
      await frame.getByText('Floor plan saved to the dashboard.').waitFor();
      assert.deepEqual(await page.evaluate(()=>card.config.maps[card.scope].plan.furniture.items.map(i=>i.lightEntity)),['light.reading','light.strip']);
    } else {
      assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem(card.layoutKeys[0])).items.map(i=>i.lightEntity)),['light.reading','light.strip']);
    }
    for(const look of ['daylight','night']){
      await card.locator('[data-look='+look+']').click();
      await update('light.reading','off');await update('light.strip','off');
      const off=await canvas.screenshot();
      await update('light.reading','on',{color_mode:'color_temp',color_temp_kelvin:2750,brightness:255});
      const lampOn=await canvas.screenshot();assert.ok(!lampOn.equals(off),'Lamp must illuminate its own floor area');
      await update('light.strip','on',{rgb_color:[21,191,255],brightness:250});
      const bothOn=await canvas.screenshot();assert.ok(!bothOn.equals(lampOn),'Independently bound LED must illuminate');
      if(captures)await card.locator('.cockpit').screenshot({path:captures+'/'+filename+'-'+look+'.png'});
      await update('light.strip','on',{hs_color:[304,92],brightness:255});
      const recolored=await canvas.screenshot();assert.ok(!recolored.equals(bothOn));
      await update('light.strip','on',{hs_color:[304,92],brightness:25});
      assert.ok(!(await canvas.screenshot()).equals(recolored),'Brightness change must redraw');
      await update('light.reading','off');
      await update('light.strip',null);
      const neutral=await maximumRGB(off,await canvas.screenshot());
      assert.ok(neutral<=4,'Neutral off/unavailable rendering differs by '+neutral+' RGB levels on '+filename+' '+look);
    }
    await page.setViewportSize({width:390,height:820});
    await openEditor();
    await picker.selectOption('');
    await canvas.press('PageDown');
    await ui.locator('[data-furnishing=link]').click();
    assert.equal(await picker.inputValue(),'light.strip');
    assert.equal(await ui.locator('.fixture-state').textContent(),'Unavailable');
    assert.ok(await picker.evaluate(el=>el.getBoundingClientRect().right<=window.innerWidth),'Phone picker must stay inside the map');
    await picker.selectOption('');
    await done();
    await page.setViewportSize({width:1100,height:820});
    await afterRender();
    await update('light.reading','off');
    const unlinked=await canvas.screenshot();
    await update('light.reading','on',{rgb_color:[255,0,0],brightness:255});
    await update('light.strip','on',{hs_color:[190,100],brightness:255});
    const difference=await maximumRGB(unlinked,await canvas.screenshot());
    assert.ok(difference<=4,'Cleared fixtures must keep their own lighting regardless of former HA state');
    await card.getByText('Test details',{exact:true}).click();
    const report=await card.getByRole('textbox',{name:'Report preview'}).inputValue();
    assert.doesNotMatch(report,/light\.(reading|strip|room_)/);
    assert.equal(await page.evaluate(()=>calls.length),0);
    assert.deepEqual(errors,[]);
    console.log('Passed '+filename+': selected both links, preserved saved IDs, rendered two independent fixtures in both themes, brightness and color updates, unavailable, clear and phone editor; zero device calls.');
    await page.close();
  }
} finally {await browser.close();server.close();}
