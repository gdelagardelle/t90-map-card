import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Fictional 5.2 × 4 m floor, including a recess and a doorway between segments.
export function sampleMap() {
  const data={3:[],7:[],255:[]};
  for (let y=0; y<80; y++) {
    const split = y < 35 ? 60 : 45;
    const doorway = y >= 48 && y < 65;
    if (y===0 || y===79) data[255].push(0,y,104);
    else {
      data[255].push(0,y,1,103,y,1);
      if (!doorway) data[255].push(split,y,1);
      data[3].push(1,y,split-1);
      const right = split + (doorway ? 0 : 1);
      data[7].push(right,y,103-right);
    }
  }
  return {
    map_id:14,saved_map_id:14,size:[-2600,-2000,-2600,-2000,104,80,50,0,[0,0,0,0]],
    data, segments:[[3,0,0,0,'T2ZmaWNl'],[7,0,0,0,'S2l0Y2hlbg==']],
    robot_position:[-1100,-500,90],charger_position:[-2000,1000,0],
    path:[[1,-2000,1000,-2000,-500,-1100,-500]]
  };
}

// Used by the browser test and local demo. Service calls only enter this recorder.
export async function mountDreame(map) {
  const tag=window.dreameTesterTag || 't90-map-card';
  await customElements.whenDefined(tag);
  const c=document.createElement(tag);
  document.body.replaceChildren(c);
  const model=window.dreameModel || {stem:'l10s_ultra',name:'Dreame L10s Ultra'};
  const entity='vacuum.'+model.stem, camera='camera.'+model.stem+'_map';
  const now=new Date().toISOString();
  const mock=window.dreameDemo={map,calls:[]};
  const hass={
    connected:true,
    states:{
      [entity]:{state:'idle',attributes:{friendly_name:model.name},last_changed:now},
      [camera]:{state:'idle',attributes:{},last_updated:now}
    },
    entities:{[entity]:{device_id:'demo'},[camera]:{device_id:'demo'}},
    fetchWithAuth:async path=>{
      if (path!=='/api/camera_map_data_proxy/'+camera) throw Error('Unexpected demo map URL');
      return new Response(JSON.stringify(mock.map),{headers:{'Content-Type':'application/json'}});
    },
    callService:async(...args)=>mock.calls.push(args)
  };
  c.setConfig({type:'custom:t90-map-card',entity,map_entity:camera});
  c.hass=hass;
}

async function tapCell(page,card,x,y) {
  const frame=card.frameLocator('iframe');
  await frame.getByRole('button',{name:'Top view',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector(window.dreameTesterTag || 't90-map-card').frame.contentDocument.querySelector('.viewer').dataset.cameraMotion==='idle');
  const bounds=await frame.locator('canvas').boundingBox();
  const [left,top,width,height]=await card.evaluate(c=>new DOMParser().parseFromString(c.frame.t90Map.scan,'image/svg+xml').documentElement.getAttribute('viewBox').split(' ').map(Number));
  const scale=bounds.height/Math.max(height*1.42,width*1.15*bounds.height/bounds.width);
  await page.mouse.click(bounds.x+bounds.width/2+(x-left-width/2)*scale,
    bounds.y+bounds.height/2+(y-top-height/2)*scale);
}

export async function checkDreame(page) {
  await page.evaluate(mountDreame,sampleMap());
  const card=page.locator(await page.evaluate(()=>window.dreameTesterTag || 't90-map-card')), frame=card.frameLocator('iframe'), viewer=frame.locator('.viewer');
  await frame.locator('[data-regions="2"][data-tracking="live"]').waitFor();
  assert.equal(await viewer.getAttribute('data-robot-position'),'30,49.98');
  assert.equal(await viewer.getAttribute('data-dock'),'true');
  assert.equal(await viewer.getAttribute('data-trace-segments'),'2');
  await tapCell(page,card,52,62); // Lower arm of the L belongs to Office.
  assert.equal(await viewer.getAttribute('data-selected-rooms'),'3');
  assert.equal(await page.evaluate(()=>dreameDemo.calls.length),0);
  await tapCell(page,card,52,20); // Above the recess the same x belongs to Kitchen.
  await card.getByRole('button',{name:'Start · Office + Kitchen'}).click();
  await page.waitForFunction(()=>!document.querySelector(window.dreameTesterTag || 't90-map-card').checkingTarget);
  assert.deepEqual(await page.evaluate(()=>dreameDemo.calls),[
    ['dreame_vacuum','vacuum_clean_segment',{segments:[3,7]},{entity_id:'vacuum.l10s_ultra'}]
  ]);
  await card.evaluate(async c=>{dreameDemo.map.robot_position=[-500,-100,90];await c.pullMap(true);});
  assert.equal(await viewer.getAttribute('data-robot-position'),'42,41.98');
  assert.equal(await viewer.getAttribute('data-selected-rooms'),'3,7');
  await card.evaluate(async c=>{dreameDemo.map.saved_map=true;await c.pullMap(true);});
  assert.equal(await card.locator('[data-action=start]').isEnabled(),false);
  await card.evaluate(c=>c.control('start'));
  assert.equal(await page.evaluate(()=>dreameDemo.calls.length),1);
  if (process.env.DREAME_SAMPLE_JSON) {
    const recorded=JSON.parse(await readFile(process.env.DREAME_SAMPLE_JSON,'utf8'));
    await page.evaluate(mountDreame,recorded);
    await frame.locator('[data-tracking="live"]').waitFor();
    assert.equal(Number(await viewer.getAttribute('data-regions')),recorded.segments.length);
    const [left,top,,,,height,grid]=recorded.size;
    const [rx,ry]=recorded.robot_position;
    assert.equal(await viewer.getAttribute('data-robot-position'),[(rx-left)/50,(height*grid-1-(ry-top))/50].join(','));
    const id=recorded.segments[0][0], runs=recorded.data[id];
    let best=0;
    for (let i=3;i<runs.length;i+=3) if(runs[i+2]>runs[best+2]) best=i;
    await tapCell(page,card,(runs[best]+runs[best+2]/2)*grid/50,(height-runs[best+1]-.5)*grid/50);
    assert.equal(await viewer.getAttribute('data-selected-rooms'),String(id));
    await card.locator('[data-action=start]').click();
    await page.waitForFunction(()=>!document.querySelector(window.dreameTesterTag || 't90-map-card').checkingTarget);
    assert.deepEqual(await page.evaluate(()=>dreameDemo.calls[0]),['dreame_vacuum','vacuum_clean_segment',{segments:[id]},{entity_id:'vacuum.l10s_ultra'}]);
    assert.equal(await viewer.getAttribute('data-dock'),'true');
    assert.ok(Number(await viewer.getAttribute('data-trace-segments'))>0);
    console.log('Recorded L10s Ultra payload rendered and a segment tap matched its native service ID.');
  }
  console.log('Dreame prototype passed room boundaries, robot updates, multi-room commands and saved-map rejection.');
}
