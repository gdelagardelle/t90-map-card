import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import http from 'node:http';
import {chromium} from 'playwright-core';

const root=new URL('./',import.meta.url);
const files=new Map([
  ['/dreame-map.js',new URL('../src/dreame-map.js',root)],
  ['/map.js',new URL('../src/map.js',root)],
  ['/switch.js',process.env.SWITCH_JS || new URL('../dist/switchbot-vacuum-card.js',root)]
]);
const httpd=http.createServer(async(req,res)=>{
  if(files.has(req.url)){res.setHeader('content-type','application/javascript');res.end(await readFile(files.get(req.url)));return;}
  res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0}switchbot-floorplan-beta{display:block}</style>');
});
await new Promise(r=>httpd.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
  const page=await browser.newPage({viewport:{width:320,height:700}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+httpd.address().port);
  const metrics=await page.evaluate(async()=>{
    const {parseDreameMap}=await import('/dreame-map.js');
    const ctx=document.createElement('canvas').getContext('2d');
    let seed=1917,checked=0; const random=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/2**32);
    for(let f=0;f<72;f++){
      const width=8+Math.floor(random()*17),height=8+Math.floor(random()*16);
      const grid=[25,50,100][f%3],left=-80*grid,top=-64*grid,data={};
      const raw=Array.from({length:height},(_,y)=>Array.from({length:width},(_,x)=>{
        if(!x||!y||x===width-1||y===height-1)return 255;
        if(x===1&&y===1)return 3;
        const k=(x<width/2?3:7);
        const v=random();return v<.11?0:v<.18?254:v<.24?255:v<.38?100+k:v<.58?10-k:k;
      }));
      for(const [y,row] of raw.entries())for(let x=0;x<width;){
        const cell=row[x];let end=x+1;while(end<width&&row[end]===cell)end++;
        if(cell)(data[cell]??=[]).push(x,y,end-x);
        x=end;
      }
      const px=1+Math.floor(random()*(width-2)),py=1+Math.floor(random()*(height-2));
      const map={map_id:1,saved_map_id:1,segments:[[3,0,0,0],[7,0,0,0]],size:[left,top,left,top,width,height,grid],data,robot_position:[left+(px+.5)*grid,top+(py+.5)*grid]};
      const parsed=parseDreameMap(JSON.stringify(map),{3:{name:'Séjour'}});
      if(parsed.labels.get(3)!=='Séjour')throw Error('Lost camera room name');
      const paths=[...parsed.bindings].map(([path,id])=>[new Path2D(path),id]);
      for(const [y,row] of raw.entries())for(const [x,cell] of row.entries()){
        const id=cell===103||cell===107?cell-100:cell;
        const found=paths.filter(([p])=>ctx.isPointInPath(p,(x+.5)*grid/50,(height-y-.5)*grid/50,'evenodd')).map(([,v])=>v);
        if(found.join(',')!==([3,7].includes(id)?String(id):''))throw Error('Raster mismatch on fixture '+f+' cell '+[x,y]);
        if(x===px&&y===py&&parsed.currentRoom!==(found[0]??null))throw Error('Pose resolved to wrong room');
        checked++;
      }
    }
    return{maps:72,cellChecks:checked};
  });
  console.log(metrics);
  await page.evaluate(async()=>{
    await import('/switch.js');window.plan=document.createElement('switchbot-floorplan-beta');
    window.room=(name,id,points)=>({name,room_id:id,points});
    window.installRooms=rooms=>{plan.plan={rooms};if(!plan.isConnected)document.body.append(plan);};
    installRooms([room('Office','room1',[[0,0],[5,0],[5,2],[2,2],[2,5],[0,5],[0,0]])]);plan.selectableRooms=['room1'];
    window.taps=[];plan.addEventListener('switchbot-room-tap',e=>taps.push(e.detail.id));
  });
  const plan=page.locator('switchbot-floorplan-beta'), office=plan.getByRole('button',{name:'Office'});
  await office.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');
  assert.deepEqual(await page.evaluate(()=>taps),['room1','room1']);
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:720});await plan.getByRole('button',{name:'Top view'}).click();await plan.getByRole('button',{name:'3D view'}).click();}
  await page.evaluate(()=>{plan.remove();document.body.append(plan);});await plan.locator('canvas').waitFor();assert.equal(await office.count(),1);
  await page.evaluate(()=>{installRooms([room('Invalid','room2',[[0,0],[3,3],[0,3],[3,0]])]);});
  assert.equal(await plan.locator('canvas').count(),0);assert.match(await plan.getByRole('status').textContent(),/outline/);
  await page.setViewportSize({width:320,height:620});
  const visibility=await page.evaluate(()=>{
    installRooms([room('Long room name which needs to fit on a narrow mobile dashboard','room1',[[0,0],[2,0],[2,3],[0,3]]),room('Kitchen','room2',[[2,0],[10,0],[10,3],[2,3]])]);
    const viewport=plan.view.getBoundingClientRect(),node=plan.labels.firstElementChild,label=node.getBoundingClientRect();
    return {fits:label.left>=viewport.left-1&&label.right<=viewport.right+1,viewportWidth:viewport.width,labelWidth:label.width,accessible:node.textContent};
  });
  assert.ok(visibility.fits,JSON.stringify(visibility));
  assert.deepEqual(errors,[]);
  console.log('SwitchBot concave and closed polygon, invalid/recovery, keyboard taps, resize, reconnection, mobile long name passed.');
}finally{await browser.close();httpd.close();}
