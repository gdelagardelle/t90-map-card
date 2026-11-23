import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import http from 'node:http';
import {chromium} from 'playwright-core';
import {scan} from './fixture.mjs';

const bytes=await readFile(process.env.CARD_BUNDLE || 'dist/t90-map-card.js');
const server=http.createServer((req,res)=>{
  if(req.url==='/card.js'){res.setHeader('Content-Type','text/javascript');res.end(bytes);}
  else res.end('<body><t90-map-card></t90-map-card><script type="module" src="/card.js"></script>');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  for(const raster of [false,true]){
    const page=await browser.newPage({viewport:{width:1120,height:930}});
    const errors=[];page.on('pageerror',err=>errors.push(err.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/demo/map');
    await page.evaluate(async({raster,xml})=>{
      await customElements.whenDefined('t90-map-card');
      window.card=document.querySelector('t90-map-card');
      window.scopeOld=(raster?'qrevo:':'t90:')+'vacuum.demo:image.map:old';
      const cv=document.createElement('canvas');cv.width=194;cv.height=146;
      const ctx=cv.getContext('2d');ctx.fillStyle='#5d6d7e';ctx.fillRect(0,0,194,146);
      ctx.fillStyle='#f0b27a';ctx.fillRect(6,6,182,134);
      const blob=await new Promise(r=>cv.toBlob(r));
      const item={id:1,kind:'stool',x:raster?18:45,z:raster?15:45,width:100,depth:100,rotation:0};
      const ref={box:[0,0,194,146],walls:['M0 0H194V146H0Z']};
      window.previous=raster?{recovery_reference:ref,plan:{version:1,anchor:{width:194,height:146,points:[0,2,6]},
        furniture:{version:1,items:[item]},ops:[],finishes:{}}}:{recovery_reference:ref,room_bindings:{'M1 1L2 2Z':3},
        layout:{[scopeOld+':furniture']:{version:1,items:[item]}}};
      const config={type:'custom:t90-map-card',entity:'vacuum.demo',map_entity:'image.map',maps:{[scopeOld]:previous}};
      const older=scopeOld.slice(0,-3)+'older';
      const legacy=structuredClone(previous);delete legacy.recovery_reference;
      if(!raster)legacy.layout={[older+':furniture']:legacy.layout[scopeOld+':furniture']};
      config.maps[older]=legacy;
      if(raster)config.map_source='roborock_qrevo';
      window.dashboard={views:[{cards:[config]}]};window.saves=0;window.commands=0;
      const hass={connected:true,states:{'vacuum.demo':{state:'docked',attributes:{rooms:{Office:1}}},'image.map':{state:'first',attributes:{}}},
        entities:{'vacuum.demo':{device_id:'demo'},'image.map':{device_id:'demo'}},
        fetchWithAuth:async()=>new Response(raster?blob:xml,{headers:{'Content-Type':raster?'image/png':'image/svg+xml'}}),
        callService:async()=>{window.commands++;},
        callWS:async req=>{
          if(req.type==='lovelace/config')return structuredClone(dashboard);
          if(req.type==='lovelace/config/save'){dashboard=structuredClone(req.config);saves++;return {};}
          if(req.service==='get_maps')return {response:{'vacuum.demo':{maps:[{flag:0,name:'Current',rooms:{1:'Office'}}]}}};
          throw Error('Unexpected call '+req.type);
        }};
      card.setConfig(structuredClone(config));card.hass=hass;
    },{raster,xml:scan()});
    await page.waitForFunction(()=>card.mapReady);
    if(raster)await page.evaluate(()=>{
      const draft={...previous.plan,furniture:{version:1,items:[]}};
      localStorage.setItem(card.scope+':plan-draft',JSON.stringify({base:'null',plan:draft}));
    });
    await page.getByText('Layout recovery',{exact:true}).click();
    const start=page.getByRole('button',{name:'Align a saved layout'});
    await start.click();
    const dialog=page.getByRole('dialog',{name:'Align a saved layout'});
    const save=dialog.getByRole('button',{name:'Save aligned layout'});
    assert.ok(await save.isDisabled());
    const which=dialog.getByRole('combobox');
    await which.selectOption('1');
    await dialog.getByText(raster?'Previous wall landmarks and edits':'Saved edits only · previous scan unavailable',{exact:true}).waitFor();
    await which.selectOption('0');
    for(const map of await dialog.locator('svg').all()){
      const coords=await map.evaluate(svg=>[[45,40],[110,80]].map(([x,y])=>{
        const pt=new DOMPoint(x,y).matrixTransform(svg.getScreenCTM());return [pt.x,pt.y];
      }));
      for(const [x,y] of coords)await page.mouse.click(x,y);
    }
    assert.ok(await save.isEnabled());
    assert.equal(await page.evaluate(()=>saves),0);
    await save.click();
    await dialog.waitFor({state:'detached'});
    await page.waitForFunction(()=>card.mapReady && card.scope);
    const result=await page.evaluate(()=>({
      previousRetained:JSON.stringify(dashboard.views[0].cards[0].maps[scopeOld])===JSON.stringify(previous),
      current:dashboard.views[0].cards[0].maps[card.scope],scope:card.scope,saves,commands
    }));
    assert.ok(await page.locator('[data-action=start]').isDisabled());
    await page.evaluate(()=>card.control('start'));
    assert.equal(await page.evaluate(()=>commands),0);
    await page.locator('.rooms summary').click();
    await page.locator('.chips').getByRole('button',{name:'Whole home',exact:true}).click();
    assert.ok(await page.locator('[data-action=start]').isEnabled());
    if(raster){
      assert.equal(await page.evaluate(()=>localStorage.getItem(card.scope+':plan-draft')),null);
      assert.ok(result.current.recovery_history.some(b=>b.record.plan.furniture.items.length===0));
      await page.locator('t90-map-card').frameLocator('iframe').locator('.viewer[data-furnishings="1"]').waitFor();
    }
    assert.equal(result.saves,1);assert.equal(result.commands,0);assert.equal(result.previousRetained,true);
    assert.equal(result.current.room_bindings,undefined);
    const items=raster?result.current.plan.furniture.items:result.current.layout[result.scope+':furniture'].items;
    assert.equal(items.length,1);assert.ok(Math.abs(items[0].x-(raster?18:45))<1);
    assert.deepEqual(errors,[]);
    await page.close();
  }
  console.log('Passed Ecovacs and Roborock alignment preview, explicit save and source-layout retention.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
