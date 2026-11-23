import assert from 'node:assert/strict';
import { mountDreame, sampleMap } from './dreame.mjs';

export async function checkCommandRaces(page) {
  const errors=[];
  await page.evaluate(()=>{window.dreameModel={stem:'l40s_pro_ultra',name:'Dreame L40s Pro Ultra'};});
  async function run(name,test) {
    try {
      await page.evaluate(mountDreame,sampleMap());
      await page.locator('dreame-map-card-beta').frameLocator('iframe').locator('[data-regions="2"][data-tracking="live"]').waitFor();
      await page.evaluate(()=>{
        const card=window.trial=document.querySelector('dreame-map-card-beta');
        card.id='l40s-test-card';
        window.action=name=>card.q('[data-action="'+name+'"]').click();
        window.choose=room=>[...card.q('.chips').children].find(chip=>chip._room===room).click();
        window.waitIdle=async()=>{
          const deadline=performance.now()+15000;
          while(card.mapRequest || card.checkingTarget || card.busy) {
            if (performance.now()>deadline) throw Error('Card did not finish handling the test event');
            await new Promise(r=>setTimeout(r,10));
          }
        };
        window.holdRead=()=>{
          const normal=card.h.fetchWithAuth;
          const gate=new Promise(resolve=>{window.finishRead=resolve;});
          let started;window.readStarted=new Promise(r=>{started=r;});
          card.h.fetchWithAuth=async(...args)=>{started();await gate;return normal(...args);};
        };
      });
      await test();
      console.log('Passed:',name);
    }catch(err){errors.push(name+': '+err.message);console.error('Failed:',name,err.message);}
  }
  await run('Polling changed floors before Start',async()=>{
    await page.evaluate(()=>{choose(3);window.oldFloor=trial.scope;dreameDemo.map.saved_map_id++;});
    await page.waitForFunction(()=>trial.scope!==oldFloor);
    const info=await page.evaluate(async()=>{action('start');await waitIdle();return {calls:dreameDemo.calls,disabled:trial.q('[data-action=start]').disabled,target:trial.q('.target').textContent};});
    assert.equal(info.calls.length,0,JSON.stringify(info));assert.equal(info.disabled,true);
    await page.evaluate(async()=>{choose(null);action('start');await waitIdle();});
    assert.equal(await page.evaluate(()=>dreameDemo.calls[0]?.[1]),'start');
  });
  await run('Disconnected idle dashboard and reconnect',async()=>{
    const res=await page.evaluate(async()=>{
      trial.hass={...trial.h,connected:false};action('start');action('return_to_base');await waitIdle();
      return {calls:dreameDemo.calls.length,disabled:trial.q('[data-action=start]').disabled};
    });
    assert.deepEqual(res,{calls:0,disabled:true});
    await page.evaluate(async()=>{trial.hass={...trial.h,connected:true};await waitIdle();choose(3);action('start');await waitIdle();});
    assert.equal(await page.evaluate(()=>dreameDemo.calls[0]?.[1]),'vacuum_clean_segment');
  });
  for(const change of ['wrong camera device','camera offline','connection cycled','Stop','Go home','HA state became cleaning']){
    await run(change+' during pending room command',async()=>{
      const calls=await page.evaluate(async change=>{
        choose(3);holdRead();action('start');await readStarted;
        if(change==='Stop')action('stop');
        if(change==='Go home')action('return_to_base');
        if(change==='connection cycled'){trial.hass={...trial.h,connected:false};trial.hass={...trial.h,connected:true};}
        if(change==='wrong camera device')trial.hass={...trial.h,entities:{...trial.h.entities,[trial.image]:{device_id:'second-vacuum'}}};
        if(change==='camera offline')trial.hass={...trial.h,states:{...trial.h.states,[trial.image]:{...trial.h.states[trial.image],state:'unavailable'}}};
        if(change==='HA state became cleaning')trial.hass={...trial.h,states:{...trial.h.states,[trial.vacuum]:{...trial.h.states[trial.vacuum],state:'cleaning'}}};
        finishRead();await waitIdle();return dreameDemo.calls.map(c=>c[1]);
      },change);
      assert.deepEqual(calls, change==='Stop'?['stop']:change==='Go home'?['return_to_base']:[]);
    });
  }
  await run('HTTP failure persists until successful map read',async()=>{
    const info=await page.evaluate(async()=>{
      const normal=trial.h.fetchWithAuth;
      trial.h.fetchWithAuth=async()=>new Response(null,{status:503});
      await trial.pullMap(true);
      trial.hass={...trial.h,states:{...trial.h.states,[trial.vacuum]:{...trial.h.states[trial.vacuum],state:'docked'}}};
      await waitIdle();action('start');await waitIdle();
      const result={ready:trial.mapReady,calls:dreameDemo.calls.length};
      trial.h.fetchWithAuth=normal;await trial.pullMap(true);choose(3);action('start');await waitIdle();
      return {...result,recovery:dreameDemo.calls.at(-1)?.[1]};
    });
    assert.deepEqual(info,{ready:false,calls:0,recovery:'vacuum_clean_segment'});
  });
  await run('In-flight selection cancelled by reconfiguration',async()=>{
    await page.evaluate(async()=>{
      choose(3);holdRead();action('start');await readStarted;
      trial.setConfig({entity:'',map_entity:''});finishRead();await waitIdle();
    });
    assert.deepEqual(await page.evaluate(()=>dreameDemo.calls),[]);
  });
  await run('Temporarily unmounted and reattached during Start',async()=>{
    await page.evaluate(async()=>{
      choose(3);holdRead();action('start');await readStarted;
      trial.remove();document.body.append(trial);finishRead();await waitIdle();
    });
    assert.deepEqual(await page.evaluate(()=>dreameDemo.calls),[]);
    await page.evaluate(async()=>{await trial.pullMap(true);action('start');await waitIdle();});
    assert.equal(await page.evaluate(()=>dreameDemo.calls[0]?.[1]),'vacuum_clean_segment');
  });
  assert.deepEqual(errors,[]);
}
