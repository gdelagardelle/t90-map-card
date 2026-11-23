import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { launchBrowser } from './browser-engine.mjs';
import { sampleMap } from './dreame.mjs';

const types=['dreame-map-card-beta','switchbot-vacuum-card','vacuum-controls-card','valetudo-map-card'];
const server=http.createServer(async(req,res)=>{
  const type=types.find(type=>req.url==='/'+type+'.js');
  if(type){res.setHeader('content-type','application/javascript');res.end(await readFile(new URL('../dist/'+type+'.js',import.meta.url)));return;}
  res.setHeader('content-type','text/html');res.end('<!doctype html><meta name="viewport" content="width=device-width">');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
  browser=await launchBrowser();const page=await browser.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:'+server.address().port);
  for(const [index,type] of types.entries()){
    const result=await page.evaluate(async ({type,index,fixture})=>{
      await import('/'+type+'.js');
      const Card=customElements.get(type),editor=Card.getConfigElement(),vacuum='vacuum.private_fixture',map='camera.private_fixture';
      document.body.replaceChildren(editor);
      const platform=['dreame_vacuum','switchbot_cloud','sharkiq','mqtt'][index];
      const makeState=(attrs={})=>({state:'idle',attributes:{friendly_name:'PRIVATE_FRIENDLY',...attrs}});
      const hass={connected:true,config:{version:'2026.11.3'},services:{vacuum:{start:{}}},states:{
        [vacuum]:makeState({supported_features:8192,rooms:['PRIVATE_ROOM'],battery_level:75}),
        [map]:makeState(), 'camera.other':makeState()},entities:{
          [vacuum]:{platform,device_id:'PRIVATE_DEVICE'},[map]:{platform,device_id:'PRIVATE_DEVICE'},
          'camera.other':{platform,device_id:'OTHER_DEVICE'}},devices:{PRIVATE_DEVICE:{model:'PRIVATE_MODEL'}},
          fetchWithAuth:async()=>{calls++;if(index===0)return new Response(JSON.stringify(fixture));
            if(index===3)return new Response('PRIVATE_ERROR',{status:500});
            return new Response('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 4"><rect width="4" height="4"/></svg>',{headers:{'Content-Type':'image/svg+xml'}});
          },callService:()=>{throw Error('Setup dispatched a service');}};
      let calls=0,config;
      editor.addEventListener('config-changed',event=>{config=event.detail.config;});
      editor.setConfig({...Card.getStubConfig(),name:'PRIVATE_CONFIG',custom:{kept:true}});
      editor.hass=hass;
      const field=key=>editor.shadowRoot.querySelector('[data-field="'+key+'"]');
      const select=(key,value)=>{const el=field(key);el.value=value;el.dispatchEvent(new Event('change'));};
      select('entity',vacuum);
      const optional=editor.shadowRoot.textContent.includes('Ready to save as a controls-only card.');
      const crossDeviceOffered=[...field('map_entity').options].some(o=>o.value==='camera.other');
      select('map_entity',map);
      const preview=editor.shadowRoot.querySelector('button');preview.click();
      while(preview.disabled) await new Promise(r=>setTimeout(r,20));
      const hasImage=!!editor.shadowRoot.querySelector('img');
      const failed=editor.shadowRoot.textContent.includes('Map preview unavailable.');
      const panel=editor.shadowRoot.querySelector('details');panel.open=true;panel.update();
      const text=panel.querySelector('textarea').value;
      const previous=Object.getOwnPropertyDescriptor(navigator,'clipboard');
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});
      const previousCopy=document.execCommand;document.execCommand=()=>false;
      panel.querySelector('button').click();await Promise.resolve();
      const fallback=panel.querySelector('[role=status]').textContent;
      document.execCommand=previousCopy;
      if(previous)Object.defineProperty(navigator,'clipboard',previous);else delete navigator.clipboard;
      const original=config;
      editor.setConfig({...config,floor_plan:{rooms:[]},map_entity:undefined});editor.hass=hass;
      const locked=editor.shadowRoot.textContent.includes('Your YAML floor plan is active.');
      if(locked){
        const check=editor.shadowRoot.querySelector('button');check.click();
        while(check.disabled)await new Promise(resolve=>setTimeout(resolve,15));
        if(!editor.shadowRoot.textContent.includes('Map preview unavailable'))throw Error('Invalid plan reported as renderable');
      }
      const card=new Card();
      card.setConfig({});card.hass=hass;
      const cardReport=[...card.shadowRoot.querySelectorAll('details')].find(p=>p.querySelector('summary')?.textContent==='Test details');
      cardReport.open=true;cardReport.update();
      let accepted,observed,rejected,copied,snapshotStable;
      if(index===1||index===2){
        document.body.append(card);card.setConfig({entity:vacuum});card.hass=hass;
        const output=cardReport.querySelector('textarea');
        cardReport.querySelectorAll('button')[1].click();
        const before=output.value;
        let sent=0;hass.callService=async()=>{sent++;};
        await card.run('start');
        snapshotStable=output.value===before && sent===1;
        cardReport.querySelectorAll('button')[1].click();
        accepted=output.value;
        Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{copied=text;}}});
        cardReport.querySelector('button').click();await Promise.resolve();
        delete navigator.clipboard;
        hass.states[vacuum].state='cleaning';card.hass=hass;cardReport.querySelectorAll('button')[1].click();observed=output.value;
        hass.states[vacuum].state='idle';card.hass=hass;
        hass.callService=async()=>{throw Error('PRIVATE_ERROR');};await card.run('start');
        cardReport.querySelectorAll('button')[1].click();rejected=output.value;
      }
      return {accepted,observed,rejected,copied,snapshotStable,registered:window.customCards.filter(item=>item.type===type).length,optional,crossDeviceOffered,
        hasImage,failed,calls,report:text,cardReport:cardReport.querySelector('textarea').value,
        fallback,locked,kept:original.custom.kept && original.name==='PRIVATE_CONFIG'};
    },{type,index,fixture:sampleMap()});
    assert.equal(result.registered,1);assert.equal(result.kept,true);
    if(index===1||index===2){assert.equal(result.snapshotStable,true);assert.match(result.accepted,/accepted by Home Assistant.*physical result unconfirmed/);assert.equal(result.copied,result.accepted);assert.match(result.observed,/expected state reported/);assert.match(result.rejected,/Start · request failed/);assert.doesNotMatch(result.rejected,/PRIVATE_ERROR/);}
    const optional=index===1||index===2;
    assert.equal(result.optional,optional);assert.equal(result.crossDeviceOffered,optional);
    assert.equal(result.locked,optional);assert.equal(result.calls,1);
    assert.equal(result.hasImage,index!==3);assert.equal(result.failed,index===3);
    assert.match(result.report,/Home Assistant: 2026.11.3/);
    for(const report of [result.report,result.cardReport])assert.doesNotMatch(report,/PRIVATE|private_fixture|camera\.|vacuum\.|coordinates|192\.168/);
    assert.match(result.fallback,/Details selected/);
  }
  assert.deepEqual(errors,[]);console.log('All four companion setups passed guided selection, preview, partial configuration, redaction, YAML preservation and manual-copy checks.');
}finally{await browser?.close();server.close();}
