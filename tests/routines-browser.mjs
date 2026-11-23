import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
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
    const page=await browser.newPage({viewport:{width:1200,height:920}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/vacuum-demo/floor');
    await page.evaluate(async({raster,xml})=>{
      await customElements.whenDefined('t90-map-card');window.card=document.querySelector('t90-map-card');
      const cv=document.createElement('canvas');cv.width=194;cv.height=146;
      const ctx=cv.getContext('2d');ctx.fillStyle='#5d6d7e';ctx.fillRect(0,0,194,146);ctx.fillStyle='#f0b27a';ctx.fillRect(6,6,182,134);
      window.currentXml=xml;window.blob=await new Promise(r=>cv.toBlob(r));window.initialBlob=blob;window.mapReads=0;window.rooms={1:'Office',2:'Kitchen'};
      window.config={type:'custom:t90-map-card',entity:'vacuum.demo',map_entity:'image.map',name:'Floor',maps:{'different-map':{note:'another floor'}}};
      if(raster)config.map_source='roborock_qrevo';
      window.dashboard={views:[{cards:[structuredClone(config),{type:'clock'}]}]};window.calls=[];window.saves=0;
      const select=(state,friendly_name,options)=>({state,attributes:{friendly_name,options}});
      window.hass={connected:true,states:{
        'vacuum.demo':{state:'docked',attributes:{rooms:{office:1,kitchen:2},fan_speed:'quiet',fan_speed_list:['quiet','turbo']}},
        'image.map':{state:'first',attributes:{}},
        'select.demo_mop_mode':select('low','Mop intensity',['low','high']),
        'select.other_mop_mode':select('low','Other vacuum mop',['low','high']),
        'select.demo_child_lock':select('low','Child lock',['low','high'])},
        entities:{'vacuum.demo':{device_id:'test',platform:raster?'roborock':'ecovacs'},'image.map':{device_id:'test'},
          'select.demo_mop_mode':{device_id:'test',translation_key:'mop_mode'},'select.other_mop_mode':{device_id:'other',translation_key:'mop_mode'},
          'select.demo_child_lock':{device_id:'test',translation_key:'child_lock'}},
        fetchWithAuth:async()=>new Response(raster?blob:currentXml,{headers:{'Content-Type':raster?'image/png':'image/svg+xml'}}),
        callWS:async req=>{
          if(req.type==='lovelace/config')return structuredClone(dashboard);
          if(req.type==='lovelace/config/save'){dashboard=structuredClone(req.config);saves++;return {};}
          if(req.service==='get_maps'){mapReads++;return {response:{'vacuum.demo':{maps:[{flag:0,name:'Office',rooms}]}}};}
          throw Error('Unexpected WS '+req.type);
        },
        callService:async(domain,service,data,target)=>{
          calls.push([domain,service,data,target]);
          if(service==='select_option'){
            if(window.failSetting)throw Error('Fixture rejected setting');
            if(window.disconnectOnMop)hass.connected=false;
            hass.states[target.entity_id].state=data.option;
          }
          if(service==='set_fan_speed')hass.states[target.entity_id].attributes.fan_speed=data.fan_speed;
        }};
      card.setConfig(structuredClone(config));card.hass=hass;
    },{raster,xml:scan()});
    await page.waitForFunction(()=>card.mapReady);
    const panel=page.locator('.cleaning-routines');await panel.locator('summary').click();
    await panel.getByRole('button',{name:'New routine'}).click();
    let modal=page.getByRole('dialog',{name:'New routine'});
    assert.equal(await modal.getByText('Other vacuum mop').count(),0);assert.equal(await modal.getByText('Child lock').count(),0);
    await modal.getByLabel('Routine name').fill('Evening');
    await modal.getByLabel('Cleaning target').selectOption('rooms');
    await modal.getByLabel('Office',{exact:true}).check();
    await modal.getByLabel('Mop intensity').selectOption('high');await modal.getByLabel('Suction').selectOption('turbo');
    await modal.getByRole('button',{name:'Save routine'}).click();
    await modal.waitFor({state:'detached'});
    const saved=await page.evaluate(()=>({routine:dashboard.views[0].cards[0].maps[card.scope].routines[0],calls,saves,other:dashboard.views[0].cards[0].maps['different-map']}));
    assert.equal(saved.routine.name,'Evening');assert.deepEqual(saved.routine.rooms,[{id:1,name:'Office'}]);
    assert.equal(saved.saves,1);assert.deepEqual(saved.calls,[]);assert.deepEqual(saved.other,{note:'another floor'});
    const review=async()=>{
      await panel.getByRole('button',{name:'Review',exact:true}).click();
      return page.getByRole('region',{name:'Review routine'});
    };
    await page.evaluate(raster=>{
      if(!raster){card.config.maps[card.scope].room_bindings=Object.fromEntries(card.livePaths.slice(0,2).map((path,i)=>[path,i+1]));}
      card.toggleRoom(2);
    },raster);
    modal=await review();const start=modal.getByRole('button',{name:'Start routine'});
    await start.waitFor();await page.waitForFunction(()=>!card.q('.routine-review .primary')?.disabled);
    assert.deepEqual(await page.evaluate(()=>calls),[]);
    const shown=()=>page.evaluate(raster=>raster?card.frame.t90Map.selected:card.frame.contentDocument.querySelector('.viewer').dataset.selectedRooms.split(',').filter(Boolean).map(Number),raster);
    assert.deepEqual(await shown(),[1]);assert.deepEqual(await page.evaluate(()=>[...card.selectedRooms]),[2]);
    const priorReads=await page.evaluate(()=>{
      const old=mapReads;hass.states['image.map'].state='second';card.hass=hass;
      for(let i=0;i<12;i++)card.refresh();return old;
    });
    await page.waitForFunction(()=>card.mapStamp==='second' && card.mapReady && !card.q('.routine-review .primary')?.disabled);
    assert.deepEqual(await shown(),[1]);assert.deepEqual(await page.evaluate(()=>calls),[]);
    assert.ok(await page.evaluate(()=>mapReads)-priorReads<=2,'Repeated state refresh should share verification');
    await page.evaluate(async raster=>{
      if(raster){
        const cv=document.createElement('canvas');cv.width=194;cv.height=146;const ctx=cv.getContext('2d');
        ctx.fillStyle='#f0b27a';ctx.fillRect(0,0,194,146);ctx.fillStyle='#5d6d7e';ctx.fillRect(42,20,6,100);
        blob=await new Promise(r=>cv.toBlob(r));
      }else currentXml=currentXml.replace('0 0 194 146','0 0 202 146');
      hass.states['image.map'].state='remap';card.hass=hass;
    },raster);
    await modal.getByText(/scanned floor changed|previous floor/i).waitFor();
    assert.ok(await start.isDisabled());assert.deepEqual(await page.evaluate(()=>calls),[]);
    await page.evaluate(async raster=>{
      if(raster)blob=initialBlob;else currentXml=currentXml.replace('0 0 202 146','0 0 194 146');
      hass.states['image.map'].state='restored';card.hass=hass;
    },raster);
    await page.waitForFunction(()=>card.mapReady && card.mapStamp==='restored' && !card.q('.routine-review .primary')?.disabled);
    assert.deepEqual(await shown(),[1]);
    if(!raster)await page.evaluate(()=>{card.selectedRooms.add(2);card.refresh();});

    assert.ok(await page.locator('[data-action=start]').isDisabled());
    await page.evaluate(()=>card.control('start'));assert.deepEqual(await page.evaluate(()=>calls),[]);
    await modal.getByRole('button',{name:'Close'}).click();
    assert.deepEqual(await shown(),[2]);
    modal=await review();
    await start.click();await modal.getByText('Start sent for Evening.').waitFor();
    const calls=await page.evaluate(()=>window.calls);
    assert.deepEqual(calls.slice(0,2),[['vacuum','set_fan_speed',{fan_speed:'turbo'},{entity_id:'vacuum.demo'}],
      ['select','select_option',{option:'high'},{entity_id:'select.demo_mop_mode'}]]);
    assert.equal(calls.length,3);assert.equal(calls[2][2].command,raster?'app_segment_clean':'spot_area');
    assert.deepEqual(raster?calls[2][2].params[0].segments:calls[2][2].params.rooms,[1]);
    await modal.getByRole('button',{name:'Close'}).click();
    await page.evaluate(()=>{card.cancelStartWatch();calls.length=0;hass.states['select.demo_mop_mode'].state='low';window.failSetting=true;card.refresh();});
    modal=await review();await modal.getByRole('button',{name:'Start routine'}).click();await modal.getByText(/Start was not sent.*Fixture rejected/).waitFor();
    assert.deepEqual(await page.evaluate(()=>calls.map(c=>c[1])),['select_option']);
    await modal.getByRole('button',{name:'Close'}).click();
    await page.evaluate(()=>{window.failSetting=false;window.disconnectOnMop=true;calls.length=0;});
    modal=await review();await modal.getByRole('button',{name:'Start routine'}).click();await modal.getByText(/Start was not sent/).waitFor();
    assert.deepEqual(await page.evaluate(()=>calls.map(c=>c[1])),['select_option']);await modal.getByRole('button',{name:'Close'}).click();
    await page.evaluate(()=>{window.disconnectOnMop=false;hass.connected=true;calls.length=0;card.refresh();});
    modal=await review();await page.waitForFunction(()=>!card.q('.routine-review .primary')?.disabled);
    await page.evaluate(()=>{hass.entities['image.map'].device_id='other';});await modal.getByRole('button',{name:'Start routine'}).click();
    await modal.getByText(/Start was not sent/).waitFor();assert.deepEqual(await page.evaluate(()=>calls),[]);
    await modal.getByRole('button',{name:'Close'}).click();
    await page.evaluate(raster=>{
      hass.entities['image.map'].device_id='test';
      if(raster)rooms={'1':'Bedroom','2':'Kitchen'};else hass.states['vacuum.demo'].attributes.rooms={bedroom:1,kitchen:2};
      card.refresh();
    },raster);
    modal=await review();await modal.getByText(/room.*changed/i).waitFor();assert.ok(await modal.getByRole('button',{name:'Start routine'}).isDisabled());
    await modal.getByRole('button',{name:'Close'}).click();assert.deepEqual(await page.evaluate(()=>calls),[]);
    await page.evaluate(async raster=>{
      if(raster){card.rrReadAt=0;await card.pullMap();}else card.refresh();
    },raster);
    await panel.getByRole('button',{name:'Edit',exact:true}).click();modal=page.getByRole('dialog',{name:'Edit routine'});
    await modal.getByLabel('Routine name').fill('Upstairs');
    assert.equal(await modal.getByLabel('Cleaning target').inputValue(),'');
    await modal.getByLabel('Cleaning target').selectOption('whole');await modal.getByRole('button',{name:'Save routine'}).click();
    await modal.waitFor({state:'detached'});
    assert.equal(await panel.getByRole('combobox').locator('option:checked').innerText(),'Upstairs');
    assert.equal(await page.evaluate(()=>dashboard.views[0].cards[0].maps[card.scope].routines.length),1);
    modal=await review();await modal.getByText(/^Whole home/).waitFor();
    await modal.getByRole('button',{name:'Start routine'}).click();await modal.getByText('Start sent for Upstairs.').waitFor();
    assert.deepEqual(await page.evaluate(()=>calls.map(c=>[c[0],c[1]])),[['vacuum','start']]);
    await modal.getByRole('button',{name:'Close'}).click();
    await panel.getByRole('button',{name:'Remove',exact:true}).click();modal=page.getByRole('dialog',{name:'Remove routine'});
    await modal.getByRole('button',{name:'Cancel'}).click();
    assert.equal(await page.evaluate(()=>dashboard.views[0].cards[0].maps[card.scope].routines.length),1);
    await panel.getByRole('button',{name:'Remove',exact:true}).click();await modal.getByRole('button',{name:'Remove routine'}).click();
    await modal.waitFor({state:'detached'});assert.equal(await page.evaluate(()=>dashboard.views[0].cards[0].maps[card.scope].routines.length),0);
    assert.deepEqual(await page.evaluate(()=>dashboard.views[0].cards[1]),{type:'clock'});assert.deepEqual(errors,[]);
    await page.close();console.log('Passed '+(raster?'Roborock':'Ecovacs')+' routines, room/whole-home start, settings, failure handling, rematch, rename and remove.');
  }
}finally{await browser.close();await new Promise(r=>server.close(r));}
