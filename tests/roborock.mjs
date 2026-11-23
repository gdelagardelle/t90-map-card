import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import http from 'node:http';
import { chromium } from 'playwright-core';
import { roomColors } from '../src/roborock-map.js';

assert.equal(roomColors([{id:18},{id:28}]).get(0x85c1e9),null);
const bundle=await readFile(process.env.CARD_BUNDLE || 'dist/t90-map-card.js');
const server=http.createServer((req,res)=>{
  if(req.url==='/card.js') {res.setHeader('Content-Type','text/javascript');res.end(bundle);}
  else res.end('<body style="margin:0"><t90-map-card></t90-map-card><script type="module" src="/card.js"></script>');
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  // Private replay files can be supplied as image + get_maps JSON pairs.
  const args=process.argv.slice(2);
  const cases=[null];
  for(let i=0;i<args.length;i+=2) cases.push({image:(await readFile(args[i])).toString('base64'),
    maps:JSON.parse(await readFile(args[i+1],'utf8')).maps});
  for(const sample of cases) {
    const page=await browser.newPage({viewport:{width:1100,height:840}});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    page.on('console',msg=>{if(msg.type()==='error' && /shader|WebGLProgram/i.test(msg.text()))errors.push(msg.text());});
    await page.addInitScript(()=>{
      const put=CanvasRenderingContext2D.prototype.putImageData;
      CanvasRenderingContext2D.prototype.putImageData=function(image,...args){
        (window.paintedLayers ??= new Map()).set(image.width+'x'+image.height,image);
        return put.call(this,image,...args);
      };
    });
    await page.goto('http://127.0.0.1:'+server.address().port);
    await page.evaluate(async sample=>{
      await customElements.whenDefined('t90-map-card');
      window.card=document.querySelector('t90-map-card');
      const config={type:'custom:t90-map-card',entity:'vacuum.test',map_entity:'image.test_floor',map_source:'roborock_qrevo'};
      window.maps=sample?.maps || [{flag:0,name:'Demo floor',rooms:{1:'Office',2:'Hall'}}];
      let blob;
      if(sample) blob=await (await fetch('data:image/png;base64,'+sample.image)).blob();
      else {
        const cv=document.createElement('canvas');cv.width=240;cv.height=160;
        const cx=cv.getContext('2d');cx.fillStyle='#5d6d7e';cx.fillRect(0,0,240,160);
        cx.fillStyle='#f0b27a';cx.fillRect(4,4,112,152);
        cx.fillStyle='#85c1e9';cx.fillRect(120,4,116,152);
        cx.fillStyle='#5d6d7e';cx.fillRect(40,40,8,60);
        for(const x of [144,164,192])cx.fillRect(x,68,4,8);
        cx.fillStyle='#a9f7a9';cx.fillRect(24,16,16,8);
        cx.fillStyle='#fff';cx.fillRect(154,70,3,3);
        cx.fillStyle='#93c2ee';cx.fillRect(68,22,34,6);
        blob=await new Promise(r=>cv.toBlob(r));
      }
      window.dashboard={views:[{cards:[structuredClone(config)]}]};window.mapImage=blob;window.calls=[];
      window.hass={connected:true,states:{'vacuum.test':{state:'docked',attributes:{friendly_name:'Qrevo'}},
        'image.test_floor':{state:'first',attributes:{}}},
        entities:{'vacuum.test':{device_id:'robot',platform:'roborock'},'image.test_floor':{device_id:'robot',platform:'roborock'}},
        fetchWithAuth:async()=>new Response(mapImage,{headers:{'Content-Type':'image/jpeg'}}),
        callWS:async req=>{
          if(req.type==='lovelace/config')return structuredClone(dashboard);
          if(req.type==='lovelace/config/save'){window.dashboard=structuredClone(req.config);return {};}
          if(req.service!=='get_maps' || req.target.entity_id!=='vacuum.test') throw Error('Unexpected request');
          return {response:{'vacuum.test':{maps:structuredClone(maps)}}};},
        callService:async(...args)=>calls.push(args)};
      card.setConfig(config);card.hass=hass;
    },sample);
    const card=page.locator('t90-map-card'), frame=card.frameLocator('iframe');
    const viewer=frame.locator('.viewer[data-rendered=true]');
    await viewer.waitFor();
    await card.getByRole('img',{name:'Illustrative Roborock Qrevo robot'}).waitFor();
    const marker=await viewer.getAttribute('data-robot-marker');
    if(!sample) assert.equal(marker,'native');
    else assert.ok(['model','native'].includes(marker));
    assert.ok(Number(await viewer.getAttribute('data-wall-runs'))>0);
    await frame.getByRole('button',{name:'Top view'}).click();
    await card.getByRole('button',{name:'Night',exact:true}).click();
    assert.equal(await frame.locator('html').getAttribute('data-appearance'),'night');
    const rooms=await page.evaluate(()=>card.rrFloor.rooms);
    const canvas=frame.locator('canvas');
    const pathButton=frame.getByRole('button',{name:'Cleaning path',exact:true});
    assert.equal(await pathButton.getAttribute('aria-pressed'),'false');
    if(!sample){
      // Home Assistant can publish a state transition before the first new map.
      const state=async value=>page.evaluate(value=>{
        hass.states['vacuum.test'].state=value;card.refresh();
      },value);
      await page.evaluate(()=>{
        const host=card.frame.t90Map, capture=host.onHistoryRoute;
        host.onHistoryRoute=snapshot=>{capture?.(snapshot);window.historyRoute=structuredClone(snapshot);};
      });
      await state('cleaning');
      assert.equal(await pathButton.getAttribute('aria-pressed'),'true');
      await page.evaluate(async()=>{
        const bitmap=await createImageBitmap(mapImage),cv=document.createElement('canvas');
        cv.width=bitmap.width;cv.height=bitmap.height;
        const ctx=cv.getContext('2d');ctx.drawImage(bitmap,0,0);bitmap.close();
        ctx.fillStyle='#93c2ee';ctx.fillRect(15,105,92,5);ctx.fillRect(102,75,5,35);ctx.fillRect(155,122,19,3);
        card.rrBlob=await new Promise(resolve=>cv.toBlob(resolve));card.refresh();
      });
      await frame.locator('.viewer[data-route-pulse=moving]').waitFor();
      const firstPulse=await canvas.screenshot();
      await page.waitForTimeout(450);
      assert.ok(!firstPulse.equals(await canvas.screenshot()),'The sweep should change the rendered pixels');
      await page.emulateMedia({reducedMotion:'reduce'});
      await frame.locator('.viewer[data-route-pulse=still]').waitFor();
      await page.emulateMedia({reducedMotion:'no-preference'});
      await state('paused');assert.equal(await viewer.getAttribute('data-route-pulse'),'off');
      await state('cleaning');await frame.locator('.viewer[data-route-pulse=moving]').waitFor();
      await pathButton.click();assert.equal(await viewer.getAttribute('data-route-pulse'),'off');
      const capture=await page.evaluate(()=>{
        const {space,segments}=historyRoute;
        return {space,parts:segments.length,canStart:card.frame.contentWindow.t90ReplayHistory(historyRoute)};
      });
      assert.equal(capture.space,'roborock-image');assert.ok(capture.parts>=2);assert.equal(capture.canStart,false);
      await state('docked');
      await page.evaluate(()=>{card.rrBlob=mapImage;card.refresh();});
      await page.waitForFunction(()=>card.rrDisplayed===mapImage);
      const liveFloor=await canvas.screenshot();
      await page.emulateMedia({reducedMotion:'reduce'});
      assert.deepEqual(await page.evaluate(()=>{
        const scene=card.frame.contentWindow;
        return [scene.t90ReplayHistory({...historyRoute,scope:'other floor'}),
          scene.t90ReplayHistory({...historyRoute,anchor:{...historyRoute.anchor,width:8}}),
          scene.t90ReplayHistory(historyRoute)];
      }),[false,false,true]);
      await frame.locator('.viewer[data-history-replay=still]').waitFor();
      assert.ok(!liveFloor.equals(await canvas.screenshot()),'Historical native ink should remain visible after the live frame resets');
      await page.evaluate(()=>card.frame.contentWindow.t90StopHistoryReplay());
      assert.ok(liveFloor.equals(await canvas.screenshot()),'Stopping replay restores the original map');
      await page.emulateMedia({reducedMotion:'no-preference'});
    }
    const hidden=await canvas.screenshot();
    const carpetButton=frame.getByRole('button',{name:'Carpet scan',exact:true});
    assert.equal(await carpetButton.getAttribute('aria-pressed'),'false');
    await carpetButton.click();
    assert.ok(!hidden.equals(await canvas.screenshot()));
    assert.equal(await pathButton.getAttribute('aria-pressed'),'false');
    await carpetButton.click();
    assert.ok(hidden.equals(await canvas.screenshot()));
    await pathButton.click();
    assert.equal(await pathButton.getAttribute('aria-pressed'),'true');
    const shown=await canvas.screenshot();assert.ok(!hidden.equals(shown));
    await pathButton.click();
    assert.ok(hidden.equals(await canvas.screenshot()));
    if(!sample) {
      await pathButton.click();
      const navigated=page.waitForEvent('framenavigated',{predicate:f=>!!f.parentFrame()});
      await card.evaluate(c=>{c.frame.srcdoc=c.frame.srcdoc;});await navigated;
      await viewer.waitFor();assert.equal(await pathButton.getAttribute('aria-pressed'),'true');
      await pathButton.click();
      await frame.getByRole('button',{name:'Edit floor plan'}).click();
      await frame.getByRole('combobox',{name:'Surface',exact:true}).selectOption('1');
      await frame.getByRole('combobox',{name:'Finish',exact:true}).selectOption('wood');
      const tint=frame.getByLabel('Floor color');
      await tint.fill('#ba7944');await tint.dispatchEvent('change');
      const box=await canvas.boundingBox();
      // Cut the center partition, then undo, and restore the opening.
      const before=Number(await viewer.getAttribute('data-wall-runs'));
      const drag=async()=>{
        await page.mouse.move(box.x+box.width*.46,box.y+box.height*.43);
        await page.mouse.down();await page.mouse.move(box.x+box.width*.53,box.y+box.height*.55,{steps:4});await page.mouse.up();
      };
      await frame.getByRole('combobox',{name:'Tool',exact:true}).selectOption('door');
      await drag();assert.notEqual(Number(await viewer.getAttribute('data-wall-runs')),before);
      await frame.getByRole('button',{name:'Undo',exact:true}).click();
      assert.equal(Number(await viewer.getAttribute('data-wall-runs')),before);
      await drag();
      await frame.getByRole('combobox',{name:'Tool',exact:true}).selectOption('select');
      const top=await canvas.boundingBox(),scale=top.height/(1.28*Math.max(160,240*top.height/top.width));
      await canvas.click({position:{x:top.width/2+(44-120)*scale,y:top.height/2+(70-80)*scale}});
      const middle=frame.getByRole('button',{name:'Drag wall to move'});
      const grip=frame.getByRole('button',{name:'Drag second wall end'});
      const draft=()=>page.evaluate(()=>JSON.parse(localStorage.getItem(card.scope+':plan-draft')).plan.ops.at(-1));
      const dragGrip=async(node,x,y)=>{
        const r=await node.boundingBox();assert.ok(r);
        const a=r.x+r.width/2,b=r.y+r.height/2;
        await page.mouse.move(a,b);await page.mouse.down();
        await page.mouse.move(a+x*scale,b+y*scale,{steps:5});await page.mouse.up();
      };
      await dragGrip(middle,20,4);
      const moved=await draft();
      assert.equal(moved.kind,'wall-edit');assert.equal(moved.spans.length,15);
      assert.ok(Math.abs(moved.to[0]-moved.from[0]-20)<1);
      await dragGrip(grip,12,-8);
      const turned=await draft();assert.deepEqual(turned.to.slice(0,2),moved.to.slice(0,2));
      assert.ok(turned.to[2]>moved.to[2]+10);
      await frame.getByRole('button',{name:'Delete wall'}).click();
      assert.equal((await draft()).to,null);
      await frame.getByRole('button',{name:'Undo',exact:true}).click();
      assert.deepEqual((await draft()).to,turned.to);
      await frame.getByRole('button',{name:'Render 3D'}).click();
      await frame.getByRole('button',{name:'Edit furnishings'}).click();
      const zoomIn=frame.getByRole('button',{name:'Zoom in',exact:true});
      const zoomOut=frame.getByRole('button',{name:'Zoom out',exact:true});
      const fit=frame.getByRole('button',{name:'Fit map',exact:true});
      await zoomIn.click();assert.equal(await fit.textContent(),'135%');
      await zoomOut.click();assert.equal(await fit.textContent(),'100%');
      await frame.getByRole('button',{name:'Add furniture'}).click();
      await frame.locator('[data-furniture-kind=stool]').click();
      const fb=await canvas.boundingBox();
      await canvas.click({position:{x:fb.width*.43,y:fb.height*.50}});
      assert.equal(await viewer.getAttribute('data-furnishings'),'1');
      await frame.getByRole('button',{name:'Color',exact:true}).click();
      await frame.getByRole('button',{name:'Clay',exact:true}).click();
      await frame.locator('[data-furnishing=done]').click();
      await frame.getByRole('button',{name:'Save to dashboard'}).click();
      await frame.getByText('Floor plan saved to the dashboard.').waitFor();
      const plan=await page.evaluate(()=>dashboard.views[0].cards[0].maps[card.scope].plan);
      assert.deepEqual(plan.finishes[1],{material:'wood',color:'#ba7944'});
      assert.deepEqual(plan.ops[1],turned);assert.equal(plan.ops[0].kind,'door');assert.equal(plan.furniture.items[0].kind,'stool');assert.equal(plan.furniture.items[0].color,'#ac6654');
      assert.equal(await page.evaluate(()=>calls.length),0);
      await frame.getByRole('button',{name:'Erase brush',exact:true}).click();
      const brushSize=frame.getByRole('slider',{name:'Brush size'});
      await brushSize.fill('12');
      await zoomIn.click();
      assert.equal(await fit.textContent(),'135%');
      const eraseBox=await canvas.boundingBox();
      const sc=eraseBox.height*1.35/(1.28*Math.max(160,240*eraseBox.height/eraseBox.width));
      const at=(x,y)=>[eraseBox.x+eraseBox.width/2+(x-120)*sc,eraseBox.y+eraseBox.height/2+(y-80)*sc];
      const beforeErase=Number(await viewer.getAttribute('data-wall-runs'));
      const stroke=async()=>{
        await page.mouse.move(...at(146,72));await page.mouse.down();
        await page.mouse.move(...at(166,72),{steps:4});await page.mouse.up();
      };
      await stroke();
      assert.equal(Number(await viewer.getAttribute('data-wall-runs')),beforeErase-4);
      assert.deepEqual((await draft()).spans,[[36,17,1],[41,17,1],[36,18,1],[41,18,1]]);
      await frame.getByRole('button',{name:'Undo',exact:true}).click();
      assert.equal(Number(await viewer.getAttribute('data-wall-runs')),beforeErase);
      // A second touch takes ownership of navigation and cancels the first
      // finger's unfinished erase. Neither lifting finger may commit a stroke.
      const cdp=await page.context().newCDPSession(page);
      const [tx,ty]=at(146,72);
      const touch=(id,x,y)=>({id,x,y,radiusX:2,radiusY:2});
      const dispatch=(type,touchPoints)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints});
      await dispatch('touchStart',[touch(1,tx,ty)]);
      await dispatch('touchStart',[touch(1,tx,ty),touch(2,tx+40,ty)]);
      await dispatch('touchMove',[touch(1,tx-10,ty),touch(2,tx+70,ty)]);
      await dispatch('touchEnd',[]);await cdp.detach();
      assert.ok(parseInt(await fit.textContent())>170);
      assert.equal(Number(await viewer.getAttribute('data-wall-runs')),beforeErase);
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(card.scope+':plan-draft')).plan.ops.length),2);
      await fit.click();await zoomIn.click();
      await stroke();await frame.getByRole('button',{name:'Save to dashboard'}).click();
      await frame.getByText('Floor plan saved to the dashboard.').waitFor();
      assert.equal(await page.evaluate(()=>dashboard.views[0].cards[0].maps[card.scope].plan.ops.length),3);
      await canvas.hover();await page.mouse.wheel(0,-120);
      await page.waitForFunction(()=>parseInt(card.frame.contentDocument.querySelector('[aria-label="Fit map"]').textContent)>135);
      await fit.click();assert.equal(await fit.textContent(),'100%');
      // Mount a new instance from the saved Lovelace config, with no local draft.
      await page.evaluate(()=>{
        card.remove();localStorage.clear();window.card=document.createElement('t90-map-card');
        document.body.append(card);card.setConfig(structuredClone(dashboard.views[0].cards[0]));card.hass=hass;
      });
      await viewer.waitFor();assert.equal(await viewer.getAttribute('data-furnishings'),'1');
      assert.equal(Number(await viewer.getAttribute('data-wall-runs')),beforeErase-4);
      await frame.getByRole('button',{name:'Edit furnishings'}).click();
      await canvas.press('PageDown');
      await frame.getByRole('button',{name:'Color',exact:true}).click();
      assert.equal(await frame.getByLabel('Custom furniture color').inputValue(),'#ac6654');
      await frame.locator('[data-furnishing=done]').click();
      await frame.getByRole('button',{name:'Original scan'}).click();
      assert.equal(await frame.locator('.rr-native').isVisible(),true);
      await frame.getByRole('button',{name:'Back to 3D'}).click();
      await frame.getByRole('button',{name:'Edit floor plan'}).click();
      await frame.getByRole('combobox',{name:'Surface',exact:true}).selectOption('1');
      assert.equal(await frame.getByRole('combobox',{name:'Finish',exact:true}).inputValue(),'wood');
      assert.equal(await frame.getByLabel('Floor color').inputValue(),'#ba7944');
      await frame.getByRole('button',{name:'Render 3D'}).click();
      // Replace with another same-size scan. Saved edits must pause.
      await page.evaluate(async()=>{
        window.originalMap=mapImage;
        const cv=document.createElement('canvas');cv.width=240;cv.height=160;
        const ctx=cv.getContext('2d');ctx.fillStyle='#f0b27a';ctx.fillRect(0,0,240,160);
        ctx.fillStyle='#5d6d7e';ctx.fillRect(12,12,8,80);
        window.mapImage=await new Promise(r=>cv.toBlob(r));
        hass.states['image.test_floor'].state='remap';await card.pullMap();
      });
      await frame.getByText(/Scan alignment changed/).waitFor();
      assert.equal(await frame.getByRole('button',{name:'Edit floor plan'}).isDisabled(),true);
      await page.evaluate(async()=>{window.mapImage=originalMap;hass.states['image.test_floor'].state='restored';await card.pullMap();});
      await page.waitForFunction(()=>card.mapReady);
      await frame.getByRole('button',{name:'Top view'}).click();
    }
    if(sample) {
      await frame.getByRole('button',{name:'Edit floor plan'}).click();
      const wallPoint=await page.evaluate(async()=>{
        const bitmap=await createImageBitmap(card.rrBlob);
        const cv=document.createElement('canvas');cv.width=bitmap.width;cv.height=bitmap.height;
        const ctx=cv.getContext('2d');ctx.drawImage(bitmap,0,0);bitmap.close();
        const {data}=ctx.getImageData(0,0,cv.width,cv.height);
        let best=0,point;
        for(let y=2;y<cv.height;y+=4) {
          let length=0;
          for(let x=2;x<cv.width;x+=4) {
            const i=(y*cv.width+x)*4,rgb=(data[i]<<16)|(data[i+1]<<8)|data[i+2];
            length=data[i+3]===255 && [0x5d6d7e,0x64c4fe].includes(rgb)?length+4:0;
            if(length>best){best=length;point={x:x-length/2,y,width:cv.width,height:cv.height};}
          }
        }
        return point;
      });
      const cb=await canvas.boundingBox(),scale=cb.height/(1.28*Math.max(wallPoint.height,wallPoint.width*cb.height/cb.width));
      await canvas.click({position:{x:cb.width/2+(wallPoint.x-wallPoint.width/2)*scale,
        y:cb.height/2+(wallPoint.y-wallPoint.height/2)*scale}});
      await frame.getByRole('button',{name:'Delete wall'}).click();
      assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem(card.scope+':plan-draft')).plan.ops.at(-1).spans.length));
      await frame.getByRole('button',{name:'Undo',exact:true}).click();
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem(card.scope+':plan-draft')).plan.ops.length),0);
      await frame.getByRole('button',{name:'Erase brush',exact:true}).click();
      await frame.getByRole('slider',{name:'Brush size'}).fill('32');
      const b=await canvas.boundingBox(),s=b.height/(1.28*Math.max(wallPoint.height,wallPoint.width*b.height/b.width));
      const px=b.x+b.width/2+(wallPoint.x-wallPoint.width/2)*s,py=b.y+b.height/2+(wallPoint.y-wallPoint.height/2)*s;
      const beforeBrush=await canvas.screenshot();
      await page.mouse.move(px,py);await page.mouse.down();await page.mouse.move(px+10*s,py,{steps:3});await page.mouse.up();
      await page.mouse.move(0,0);
      const liveStroke=await page.evaluate(()=>JSON.parse(localStorage.getItem(card.scope+':plan-draft')).plan.ops.at(-1));
      assert.ok(liveStroke.spans.length>0);
      assert.ok(!beforeBrush.equals(await canvas.screenshot()));
      await frame.getByRole('button',{name:'Undo',exact:true}).click();
      assert.ok(beforeBrush.equals(await canvas.screenshot()));
      await frame.getByRole('button',{name:'Render 3D'}).click();
      await frame.getByRole('button',{name:'Top view'}).click();
      // Find interior pixels in the native scan, project the top view to screen,
      // and send real pointer events to the same canvas the user taps.
      const picks=await page.evaluate(async()=>{
        const bitmap=await createImageBitmap(card.rrBlob);
        const cv=document.createElement('canvas');cv.width=bitmap.width;cv.height=bitmap.height;
        const cx=cv.getContext('2d');cx.drawImage(bitmap,0,0);bitmap.close();
        const pixels=cx.getImageData(0,0,cv.width,cv.height).data;
        const rgb=(x,y)=>{const i=(y*cv.width+x)*4;return pixels[i+3]===255 ?
          (pixels[i]<<16)|(pixels[i+1]<<8)|pixels[i+2] : 0;};
        const palette=[0xf0b27a,0x85c1e9,0xd98880,0x3498db];
        return card.rrFloor.rooms.map(({id})=>{
          for(let y=12;y<cv.height-12;y+=3) for(let x=12;x<cv.width-12;x+=3) {
            if([[0,0],[-6,0],[6,0],[0,-6],[0,6]].every(([dx,dy])=>rgb(x+dx,y+dy)===palette[id-1]))
              return {id,x:x-cv.width/2,y:y-cv.height/2,width:cv.width,height:cv.height};
          }
          throw Error('No stock room interior found for test segment '+id);
        });
      });
      const box=await canvas.boundingBox();
      for(const pt of picks) {
        const span=Math.max(pt.height,pt.width*box.height/box.width)*.64;
        const scale=box.height/(2*span);
        const position={x:box.width/2+pt.x*scale,y:box.height/2+pt.y*scale};
        await canvas.click({position});
        assert.deepEqual(await page.evaluate(()=>[...card.selectedRooms]),[pt.id]);
        await canvas.click({position});
        assert.deepEqual(await page.evaluate(()=>[...card.selectedRooms]),[]);
      }
    }
    // Exercise a real mapped patch through the same viewer at every replay size.
    const patch=await page.evaluate(async()=>{
      const bmp=await createImageBitmap(card.rrBlob),cv=document.createElement('canvas');
      cv.width=bmp.width;cv.height=bmp.height;
      const cx=cv.getContext('2d');cx.drawImage(bmp,0,0);bmp.close();
      const data=cx.getImageData(0,0,cv.width,cv.height).data;
      const stock=(x,y)=>{const i=(y*cv.width+x)*4;
        return data[i]===240 && data[i+1]===178 && data[i+2]===122 && data[i+3]===255;};
      for(let y=20;y<cv.height-20;y+=4)for(let x=20;x<cv.width-20;x+=4)
        if([[0,0],[-12,0],[12,0],[0,-12],[0,12]].every(([u,v])=>stock(x+u,y+v)))
          return {x,y,w:cv.width,h:cv.height};
      throw Error('No floor patch found');
    });
    const patchPosition=async()=>{
      const b=await canvas.boundingBox(),scale=b.height/(1.28*Math.max(patch.h,patch.w*b.height/b.width));
      return {x:b.width/2+(patch.x-patch.w/2)*scale,y:b.height/2+(patch.y-patch.h/2)*scale};
    };
    const undoFloor=frame.getByRole('button',{name:'Undo',exact:true});
    await frame.getByRole('button',{name:'Edit floor plan'}).click();
    await frame.getByRole('combobox',{name:'Tool',exact:true}).selectOption('delete-floor');
    await frame.getByRole('slider',{name:'Brush size'}).fill('32');
    const floorAlpha=()=>frame.locator('canvas').evaluate((el,p)=>{
      const image=el.ownerDocument.defaultView.paintedLayers.get(p.w+'x'+p.h);
      return image.data[4*(image.width*p.y+p.x)+3];
    },patch);
    assert.equal(await floorAlpha(),255);
    await page.mouse.move(0,0);
    const intact=await canvas.screenshot();
    const eraseFloor=async()=>{await canvas.click({position:await patchPosition()});await page.mouse.move(0,0);};
    await eraseFloor();
    assert.equal(await floorAlpha(),0);assert.ok(!intact.equals(await canvas.screenshot()));
    await undoFloor.click();assert.ok(intact.equals(await canvas.screenshot()));
    await eraseFloor();
    await frame.getByRole('button',{name:'Save to dashboard'}).click();
    await frame.getByText('Floor plan saved to the dashboard.').waitFor();
    assert.equal(await page.evaluate(()=>dashboard.views[0].cards[0].maps[card.scope].plan.ops.at(-1).kind),'delete-floor');
    await page.evaluate(()=>{
      card.remove();localStorage.clear();window.card=document.createElement('t90-map-card');
      document.body.append(card);card.setConfig(structuredClone(dashboard.views[0].cards[0]));card.hass=hass;
    });
    await viewer.waitFor();
    await card.getByRole('button',{name:'Night',exact:true}).click();
    await frame.getByRole('button',{name:'Top view'}).click();
    assert.equal(await floorAlpha(),0);
    await canvas.click({position:await patchPosition()});
    assert.deepEqual(await page.evaluate(()=>[...card.selectedRooms]),[]);
    if(!sample) {
      const box=await canvas.boundingBox();
      // Top view fits the whole image. Choose the middle of the left room.
      const span=Math.max(160,240*box.height/box.width)*.64;
      await canvas.click({position:{x:box.width/2-60*box.height/(2*span),y:box.height/2}});
      assert.deepEqual(await page.evaluate(()=>[...card.selectedRooms]),[1]);
    } else {
      await card.locator('.rooms summary').click();
      await card.locator('.chips button').nth(1).click();
    }
    await card.locator('[data-action=start]').click();
    const expected=['vacuum','send_command',{command:'app_segment_clean',params:[{segments:[rooms[0].id]}]},{entity_id:'vacuum.test'}];
    assert.deepEqual(await page.evaluate(()=>calls),[expected]);
    // A changed floor or device cannot redirect a previously selected room clean.
    await page.evaluate(()=>maps.push({...maps[0],flag:1}));
    await card.locator('[data-action=start]').click();
    assert.deepEqual(await page.evaluate(()=>calls),[expected]);
    await page.evaluate(async()=>{card.rrReadAt=0;await card.pullMap();});
    assert.equal(await card.locator('[data-action=start]').isDisabled(),true);
    await page.evaluate(()=>{hass.entities['image.test_floor'].device_id='other';card.hass=hass;});
    await page.evaluate(()=>card.control('start'));
    assert.deepEqual(await page.evaluate(()=>calls),[expected]);
    if (!sample) {
      await page.evaluate(async()=>{
        maps.pop();hass.entities['image.test_floor'].device_id='robot';
        hass.states['image.test_floor'].state='updated';card.rrReadAt=0;
        mapImage=new Blob(['invalid']);
        await card.pullMap();
      });
      assert.equal(await card.locator('[data-action=start]').isDisabled(),true);
      assert.match(await card.locator('.note').textContent(),/map size|PNG map/);
      assert.deepEqual(await page.evaluate(()=>calls),[expected]);
      await page.evaluate(()=>{
        card.toggleRoom(null);
        hass.states['vacuum.test'].state='cleaning';card.hass=hass;
      });
      await card.locator('[data-action=pause]').click();
      await page.evaluate(()=>{hass.states['vacuum.test'].state='paused';card.hass=hass;});
      await card.locator('[data-action=start]').click();
      await card.locator('[data-action=stop]').click();
      await card.locator('[data-action=return_to_base]').click();
      assert.deepEqual(await page.evaluate(()=>calls.slice(1)),['pause','start','stop','return_to_base'].map(
        service=>['vacuum',service,{},{entity_id:'vacuum.test'}]));
    }
    assert.deepEqual(errors,[]);
    console.log('Passed '+(sample?'private replay':'fictional map')+': 3D walls, '+rooms.length+' rooms, theme, scoped room command and stale-floor guard.');
    await page.close();
  }
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
