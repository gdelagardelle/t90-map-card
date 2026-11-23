import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright-core';
import {scan} from './fixture.mjs';
const bundle=await readFile(process.env.CARD_BUNDLE || 'dist/t90-map-card.js');
const server=http.createServer((req,res)=>{
  if(req.url==='/card.js'){res.setHeader('Content-Type','text/javascript');res.end(bundle);}
  else res.end('<body><t90-map-card></t90-map-card><script type="module" src="/card.js"></script>');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  for(const raster of [false,true]){
    const page=await browser.newPage({viewport:{width:1200,height:900}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto('http://127.0.0.1:'+server.address().port+'/vacuum-demo/floor');
    await page.evaluate(async({xml,raster})=>{
      await customElements.whenDefined('t90-map-card');
      window.card=document.querySelector('t90-map-card');window.calls=[];
      const cv=document.createElement('canvas');cv.width=194;cv.height=146;const ctx=cv.getContext('2d');
      ctx.fillStyle='#5d6d7e';ctx.fillRect(0,0,194,146);ctx.fillStyle='#f0b27a';ctx.fillRect(6,6,182,134);
      const blob=await new Promise(res=>cv.toBlob(res));
      const config={type:'custom:t90-map-card',entity:'vacuum.synthetic',map_entity:'image.floor',maps:{another:{favorite_routine:'kept'}},...(raster?{map_source:'roborock_qrevo'}:{})};
      window.dashboard={views:[{cards:[structuredClone(config)]}]};window.dbCard=()=>dashboard.views[0].cards[0];
      window.otherFloor=false;window.rooms={1:'Office',2:'Kitchen'};window.hass={connected:true,states:{
        'vacuum.synthetic':{state:'docked',attributes:{rooms:{office:1,kitchen:2}}},'image.floor':{state:'first',attributes:{}}},
        entities:{'vacuum.synthetic':{device_id:'test',platform:raster?'roborock':'ecovacs'},'image.floor':{device_id:'test'}},
        fetchWithAuth:async()=>new Response(raster?blob:otherFloor?xml.replace('0 0 194 146','0 0 202 146'):xml,{headers:{'Content-Type':raster?'image/png':'image/svg+xml'}}),
        callWS:async req=>{
          if(req.type==='lovelace/config')return structuredClone(dashboard);
          if(req.type==='lovelace/config/save'){dashboard=structuredClone(req.config);return {};}
          if(req.service==='get_maps')return {response:{'vacuum.synthetic':{maps:[{flag:otherFloor?1:0,name:'Floor',rooms}]}}};
          throw Error('Unexpected request '+req.type);
        },
        callService:async(domain,service,data,target)=>{calls.push({domain,service,data,target});}};
      card.setConfig(config);card.hass=hass;
    },{xml:scan(),raster});
    await page.waitForFunction(()=>card.mapReady);
    const panel=page.locator('.cleaning-routines'),quick=page.locator('.routine-favorite'),review=page.getByRole('region',{name:'Review routine'});
    await panel.locator('summary').click();
    async function create(name,room){
      await panel.getByRole('button',{name:'New routine'}).click();
      const dialog=page.getByRole('dialog',{name:'New routine'});
      await dialog.getByLabel('Routine name').fill(name);await dialog.getByLabel('Cleaning target').selectOption('rooms');
      await dialog.getByLabel(room,{exact:true}).check();await dialog.getByRole('button',{name:'Save routine'}).click();
      await dialog.waitFor({state:'detached'});
    }
    await create('Kitchen after lunch','Kitchen');await create('Office evenings','Office');
    await page.evaluate(()=>{dbCard().maps[card.scope].decorations={keep:true};});
    await panel.getByRole('button',{name:'Pin as favorite'}).click();
    await quick.waitFor();const officeId=await page.evaluate(()=>dbCard().maps[card.scope].favorite_routine);
    assert.ok(officeId);assert.equal(await quick.getAttribute('aria-label'),'Review favorite: Office evenings');
    await panel.locator('summary').click();
    for(const width of [1200,680,360]){
      await page.setViewportSize({width,height:900});
      const [a,b]=await Promise.all([page.locator('[data-action=start]').boundingBox(),quick.boundingBox()]);
      assert.ok(a && b && b.width>=44 && b.height>=44 && Math.abs(a.y-b.y)<2 && b.x>=a.x+a.width-1 && b.x+b.width<=width,'Start and favorite must fit side by side at '+width+' '+JSON.stringify({a,b}));
    }
    await quick.focus();await page.keyboard.press('Enter');
    await review.getByRole('heading',{name:'Office evenings'}).waitFor();
    await page.waitForFunction(()=>!card.q('.routine-review .primary').disabled);
    assert.deepEqual(await page.evaluate(()=>calls),[]);
    await review.getByRole('button',{name:'Close'}).click();
    assert.ok(await quick.evaluate(b=>b.getRootNode().activeElement===b));
    await panel.locator('summary').click();const selector=panel.getByLabel('Saved routine');
    await selector.selectOption({label:'Kitchen after lunch'});await review.getByRole('button',{name:'Close'}).click();
    await panel.getByRole('button',{name:'Pin as favorite'}).click();
    await page.getByRole('button',{name:'Review favorite: Kitchen after lunch'}).waitFor();
    // Reload the custom element just as another dashboard browser would.
    await page.evaluate(()=>{
      const next=document.createElement('t90-map-card');card.replaceWith(next);window.card=next;
      card.setConfig(structuredClone(dbCard()));card.hass=hass;
    });
    await page.waitForFunction(()=>card.mapReady);
    await page.getByRole('button',{name:'Review favorite: Kitchen after lunch'}).waitFor();
    const originalScope=await page.evaluate(()=>card.scope);
    async function changeFloor(other){
      await page.evaluate(other=>{
        window.otherFloor=other;hass.states['image.floor'].state=other?'upstairs':'downstairs';
        card.rrReadAt=0;card.hass=hass;
      },other);
      await page.waitForFunction(([scope,other])=>card.mapReady && card.mapStamp===(other?'upstairs':'downstairs') && (card.scope!==scope)===other,[originalScope,other]);
    }
    await changeFloor(true);await quick.waitFor({state:'hidden'});await changeFloor(false);
    await page.getByRole('button',{name:'Review favorite: Kitchen after lunch'}).waitFor();
    assert.deepEqual(await page.evaluate(()=>calls),[]);
    await panel.locator('summary').click();
    const kitchenId=await page.evaluate(()=>dbCard().maps[card.scope].favorite_routine);
    assert.notEqual(kitchenId,officeId);
    await panel.getByRole('button',{name:'Unpin favorite'}).click();await quick.waitFor({state:'hidden'});
    await selector.selectOption({label:'Office evenings'});await review.getByRole('button',{name:'Close'}).click();
    await page.evaluate(id=>{dbCard().maps[card.scope].favorite_routine=id;},kitchenId);
    await panel.getByRole('button',{name:'Pin as favorite'}).click();
    await panel.getByText(/favorite changed in another dashboard/).waitFor();
    assert.equal(await page.evaluate(()=>dbCard().maps[card.scope].favorite_routine),kitchenId);
    await page.evaluate(()=>{card.setConfig(structuredClone(dbCard()));});await quick.waitFor();
    await panel.getByRole('button',{name:'Pin as favorite'}).click();
    await page.getByRole('button',{name:'Review favorite: Office evenings'}).waitFor();
    await panel.getByRole('button',{name:'Edit',exact:true}).click();
    const edit=page.getByRole('dialog',{name:'Edit routine'});await edit.getByLabel('Routine name').fill('Office only');
    await edit.getByRole('button',{name:'Save routine'}).click();await edit.waitFor({state:'detached'});
    await page.getByRole('button',{name:'Review favorite: Office only'}).waitFor();
    assert.equal(await page.evaluate(()=>dbCard().maps[card.scope].favorite_routine),officeId);
    await page.evaluate(()=>{card.setConfig(structuredClone(dbCard()));hass.connected=false;card.hass=hass;});
    assert.ok(await quick.isDisabled());await page.evaluate(()=>{hass.connected=true;card.hass=hass;});
    assert.ok(await quick.isEnabled());await quick.click();
    await review.getByRole('button',{name:'Start routine'}).click();await review.getByText('Start sent for Office only.').waitFor();
    assert.equal(await page.evaluate(()=>calls.length),1);assert.equal(await page.evaluate(()=>card.liveCommand.routineId),officeId);
    assert.equal(await page.evaluate(()=>card.liveCommand.routineName),'Office only');await review.getByRole('button',{name:'Close'}).click();
    await page.evaluate(async raster=>{
      card.cancelStartWatch();calls.length=0;
      if(raster){rooms={1:'Changed',2:'Kitchen'};card.rrReadAt=0;await card.pullMap();}
      else{hass.states['vacuum.synthetic'].attributes.rooms={changed:1,kitchen:2};card.refresh();}
    },raster);
    if(await quick.isVisible()){
      await quick.click();await review.getByText(/room.*changed/i).waitFor();
      assert.ok(await review.getByRole('button',{name:'Start routine'}).isDisabled());await review.getByRole('button',{name:'Close'}).click();
    }
    assert.deepEqual(await page.evaluate(()=>calls),[]);
    await panel.getByRole('button',{name:'Remove',exact:true}).click();
    const remove=page.getByRole('dialog',{name:'Remove routine'});await remove.getByRole('button',{name:'Remove routine'}).click();await remove.waitFor({state:'detached'});
    await quick.waitFor({state:'hidden'});
    assert.equal(await page.evaluate(id=>Object.values(dbCard().maps).some(rec=>rec.favorite_routine===id),officeId),false);
    assert.deepEqual(await page.evaluate(()=>dbCard().maps.another),{favorite_routine:'kept'});
    assert.deepEqual(await page.evaluate(()=>Object.values(dbCard().maps).find(rec=>rec.decorations)?.decorations),{keep:true});
    assert.deepEqual(errors,[]);await page.close();
    console.log('Passed '+(raster?'Roborock':'Ecovacs')+' favorites at desktop, tablet and phone widths.');
  }
}finally{await browser.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
