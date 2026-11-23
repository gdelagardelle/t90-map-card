import {aligned,scanAnchor,isWall,rgbAt} from './roborock-surfaces.js';
import {alignPoints,recoverLayout} from './layout-recovery-transform.js';

const ns='http://www.w3.org/2000/svg';
function svg(tag,attrs,parent){
  const node=document.createElementNS(ns,tag);
  for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);
  parent.append(node);return node;
}
function compact(record){
  const copy={};
  for(const k of ['layout','layout_version','placement_bounds','plan','recovery_reference','room_bindings'])
    if(record?.[k]!=null)copy[k]=structuredClone(record[k]);
  return copy;
}
function hasEdits(r){return !!(r?.plan || r?.layout && Object.keys(r.layout).length);}
function localDraft(scope,raster){
  try{
    if(raster){const entry=JSON.parse(localStorage.getItem(scope+':plan-draft'));return entry?.plan && {plan:entry.plan};}
    const layout={};
    for(const name of ['furniture','walls']){
      const key=scope+':'+name,value=JSON.parse(localStorage.getItem(key));
      if(value?.version===1)layout[key]=value;
    }
    return Object.keys(layout).length?{layout}:null;
  }catch{return null;}
}
function listSources(card){
  const prefix=(card.roborock?'qrevo:':'t90:')+card.vacuum+':'+card.image+':';
  const sources=[],scopes=new Set(Object.keys(card.config.maps || {}).filter(k=>k.startsWith(prefix)));
  try{
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i);
      if(k?.startsWith(prefix) && /:(furniture|walls|plan-draft)$/.test(k))scopes.add(k.slice(0,k.lastIndexOf(':')));
    }
  }catch{}
  function add(scope,record,label){
    if(!hasEdits(record))return;
    sources.push({scope,record:compact(record),label:label+' · '+scope.slice(prefix.length)});
  }
  for(const scope of scopes){
    const saved=card.config.maps?.[scope];
    add(scope,saved,'Saved layout');
    const draft=localDraft(scope,card.roborock);
    if(draft && JSON.stringify(draft.layout??draft.plan)!==JSON.stringify(saved?.layout??saved?.plan))
      add(scope,{...saved,...draft},'Browser draft');
    for(const entry of saved?.recovery_history || [])add(scope,entry.record,'Backup '+new Date(entry.at).toLocaleString());
  }
  return sources.sort((a,b)=>Number(a.scope===card.scope)-Number(b.scope===card.scope));
}
export function vectorReference(scan){
  if(!scan)return null;
  const root=new DOMParser().parseFromString(scan,'image/svg+xml').documentElement;
  return {box:root.getAttribute('viewBox').trim().split(/[ ,]+/).map(Number),
    rooms:[...root.firstElementChild.querySelectorAll('path')].map(p=>p.getAttribute('d')),
    walls:[...root.querySelectorAll('g.o path')].map(p=>p.getAttribute('d'))};
}
async function rasterReference(blob){
  const bitmap=await createImageBitmap(blob),cv=document.createElement('canvas');
  cv.width=bitmap.width;cv.height=bitmap.height;
  const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);bitmap.close();
  const pixels=ctx.getImageData(0,0,cv.width,cv.height),anchor=scanAnchor(pixels);
  // A small reference of scan walls only. Live routes, markers and people are excluded.
  const preview=document.createElement('canvas'),scale=Math.min(1,320/Math.max(cv.width,cv.height));
  preview.width=Math.ceil(cv.width*scale);preview.height=Math.ceil(cv.height*scale);
  const ink=preview.getContext('2d');ink.fillStyle='#808b8c';
  for(let y=0;y<cv.height;y+=2)for(let x=0;x<cv.width;x+=2){
    const i=4*(y*cv.width+x);
    if(pixels.data[i+3]===255 && isWall(rgbAt(pixels.data,i)))ink.fillRect(x*scale,y*scale,Math.max(1,2*scale),Math.max(1,2*scale));
  }
  return {ref:{box:[0,0,cv.width,cv.height],anchor,image:preview.toDataURL('image/png')},pixels};
}
export async function currentReference(card){
  if(card.roborock)return (await rasterReference(card.rrBlob)).ref;
  return vectorReference(card.frame.t90Map?.scan);
}
function drawing(record,scope){
  const raster=!!record.plan,plan=record.plan,base=record.layout?.[scope+':walls'];
  const items=(raster?plan.furniture:record.layout?.[scope+':furniture'])?.items || [];
  const walls=[],marks=[];
  const point=p=>[p.x,p.z];
  for(const w of [...Object.values(base?.walls || {}),...(base?.added || [])]){
    if(w.kind==='floor')walls.push([...w.points,w.points[0]].map(point));
    else if(w.start && w.end)walls.push([point(w.start),point(w.end)]);
  }
  for(const op of plan?.ops || []){
    const l=op.to || op.points || op.from;
    if(l)walls.push([l.slice(0,2),l.slice(2)]);
    if(op.spans)for(const [x,y,n] of op.spans)marks.push('M'+4*x+' '+4*y+'h'+4*n+'v4h-'+4*n+'Z');
  }
  return {items:items.map(i=>({x:i.x*(raster?4:1),y:i.z*(raster?4:1),angle:-i.rotation*90})),walls,marks};
}
function referenceOf(entry,fallback){
  if(entry.record.recovery_reference?.box)return entry.record.recovery_reference;
  const a=entry.record.plan?.anchor;
  if(a)return {box:[0,0,a.width,a.height],anchor:a};
  const sketch=drawing(entry.record,entry.scope),pts=[...sketch.items.map(i=>[i.x,i.y]),...sketch.walls.flat()];
  if(!pts.length)return {box:fallback.box};
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(20,Math.max(...xs)-x),h=Math.max(20,Math.max(...ys)-y);
  return {box:[x-w*.12,y-h*.12,w*1.24,h*1.24]};
}
function paint(map,ref,sketch,points){
  const [x,y,w,h]=ref.box,unit=Math.max(w,h)/210;
  map.replaceChildren();map.setAttribute('viewBox',ref.box.join(' '));
  if(ref.image?.startsWith('data:image/png;base64,'))svg('image',{href:ref.image,x,y,width:w,height:h},map);
  else if(ref.anchor)for(const k of ref.anchor.points)svg('circle',{cx:k%ref.anchor.width,cy:Math.floor(k/ref.anchor.width),r:unit,fill:'var(--dim)'},map);
  for(const d of ref.rooms || [])svg('path',{d,fill:'var(--selected)',stroke:'var(--dim)','stroke-width':unit*.4},map);
  for(const d of ref.walls || [])svg('path',{d,fill:'none',stroke:'var(--dim)','stroke-width':unit},map);
  for(const line of sketch?.walls || [])svg('polyline',{points:line.map(p=>p.join(',')).join(' '),fill:'none',stroke:'var(--accent)','stroke-width':unit*1.2},map);
  if(sketch?.marks.length)svg('path',{d:sketch.marks.join(' '),fill:'var(--accent)',opacity:.48},map);
  for(const i of sketch?.items || [])svg('rect',{x:-unit*2.6,y:-unit*1.5,width:unit*5.2,height:unit*3,rx:unit*.4,
    transform:'translate('+i.x+','+i.y+') rotate('+i.angle+')',fill:'var(--accent)'},map);
  points.forEach(([cx,cy],i)=>{
    svg('circle',{cx,cy,r:unit*3.3,fill:i?'#db513a':'#176a98',stroke:'white','stroke-width':unit*.65},map);
    const n=svg('text',{x:cx,y:cy+unit*1.3,'text-anchor':'middle',fill:'white','font-size':unit*4},map);n.textContent=String(i+1);
  });
}
export function mountRecovery(card){
  const details=document.createElement('details');
  details.innerHTML='<summary>Layout recovery</summary><div class="content"><button type="button">Align a saved layout</button><span role="status"></span></div>';
  card.ui.append(details);
  const open=details.querySelector('button'),status=details.querySelector('span');
  open.onclick=async()=>{
    if(!card.scope || !card.mapReady){status.textContent='Wait for the current map to load.';return;}
    const sources=listSources(card);
    if(!sources.length){status.textContent='No saved layout or browser draft was found for this vacuum and map.';return;}
    const scope=card.scope,blob=card.rrBlob;
    open.disabled=true;status.textContent='';
    try{
      const target=await currentReference(card);
      if(card.scope!==scope || !card.mapReady || (card.roborock && card.rrBlob!==blob))throw Error('The map changed. Open recovery again.');
      if(!target)throw Error('The current scan is unavailable.');
      if(!card.roborock)target.segments=card.frame.contentWindow?.deebotRecoveryWalls?.() || [];
      await recoverDialog(card,sources,target);
    }catch(e){status.textContent=e.message;}
    finally{open.disabled=false;}
  };
}
async function recoverDialog(card,sources,target){
  const scope=card.scope,blob=card.rrBlob,raster=card.roborock,expected=JSON.stringify(compact(card.config.maps?.[scope]));
  const dialog=document.createElement('dialog');dialog.setAttribute('aria-label','Align a saved layout');
  dialog.style.cssText='width:min(880px,94vw);max-height:90vh;overflow:auto';
  dialog.innerHTML=`<h3>Align a saved layout</h3><label>Previous layout <select></select></label>
    <p>Choose the same two landmarks on each map, in the same order. Use points far apart, such as opposite corners. On a keyboard, use the arrow keys to position a marker and Enter to place it.</p>
    <div class="recovery-maps" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:12px">
    <section><h4>Previous layout</h4><svg aria-label="Previous layout landmarks"></svg></section>
    <section><h4>Current map and preview</h4><svg aria-label="Current map landmarks"></svg></section></div>
    <p role="status" aria-live="polite"></p><div class="actions"><button type="button" class="reset">Reset landmarks</button><button type="button" class="commit primary" disabled>Save aligned layout</button><button type="button" class="dismiss">Cancel</button></div>`;
  const select=dialog.querySelector('select'),message=dialog.querySelector('[role=status]'),save=dialog.querySelector('.commit');
  const maps=[...dialog.querySelectorAll('svg')],points=[[],[]],reset=dialog.querySelector('.reset'),dismiss=dialog.querySelector('.dismiss');
  let candidate,saving=false;
  sources.forEach((s,i)=>select.add(new Option(s.label,String(i))));
  function render(){
    const source=sources[Number(select.value)];candidate=null;save.disabled=true;
    try{
      const oldRef=referenceOf(source,target);
      dialog.querySelector('h4').textContent=source.record.recovery_reference?'Previous layout':oldRef.anchor?'Previous wall landmarks and edits':'Saved edits only · previous scan unavailable';
      paint(maps[0],oldRef,drawing(source.record,source.scope),points[0]);
      if(points.every(a=>a.length===2)){
        const t=alignPoints(...points);
        candidate=recoverLayout(source.record,source.scope,scope,target,t,raster);
        const n=candidate.notes;
        message.textContent='Preview aligned. Saving keeps the previous layout. Room targeting must be matched again.'+
          (n.unmatched?' '+n.unmatched+' hidden scan walls could not be matched.':'')+
          (n.detached?' '+n.detached+' moved walls will become manually added walls.':'')+
          (raster && Object.keys(source.record.plan.finishes || {}).some(k=>k!=='all')?' The whole-floor finish transfers. Choose finishes for individual rooms again.':'');
        save.disabled=false;
      }else message.textContent='Previous layout: '+points[0].length+' of 2 landmarks. Current map: '+points[1].length+' of 2.';
    }catch(e){message.textContent=e.message;}
    paint(maps[1],target,candidate?drawing(candidate.record,scope):null,points[1]);
  }
  maps.forEach((map,i)=>{
    map.style.cssText='display:block;width:100%;height:clamp(180px,34vh,330px);border:1px solid var(--edge);background:var(--paper);cursor:crosshair;touch-action:manipulation';
    map.setAttribute('tabindex','0');
    let cursor;
    const place=(x,y)=>{
      if(points[i].length===2)points[i].length=0;
      points[i].push([x,y]);render();
    };
    function crosshair(){
      const b=map.viewBox.baseVal,unit=Math.max(b.width,b.height)/65;
      if(!cursor)cursor=[b.x+b.width/2,b.y+b.height/2];
      const [x,y]=cursor;
      map.querySelector('.crosshair')?.remove();
      svg('path',{class:'crosshair',d:'M'+(x-unit)+' '+y+'h'+(2*unit)+'M'+x+' '+(y-unit)+'v'+(2*unit),stroke:'var(--ink)','stroke-width':unit/6},map);
    }
    map.onfocus=crosshair;
    map.onblur=()=>{map.querySelector('.crosshair')?.remove();cursor=null;};
    map.onkeydown=e=>{
      if(saving)return;
      if(['Enter',' '].includes(e.key)){e.preventDefault();crosshair();place(...cursor);crosshair();return;}
      const shift={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];
      if(!shift)return;
      e.preventDefault();const b=map.viewBox.baseVal,step=Math.max(b.width,b.height)/(e.shiftKey?25:200);
      crosshair();
      cursor=[Math.max(b.x,Math.min(b.x+b.width,cursor[0]+shift[0]*step)),Math.max(b.y,Math.min(b.y+b.height,cursor[1]+shift[1]*step))];crosshair();
    };
    map.onclick=e=>{
      if(saving)return;
      const spot=new DOMPoint(e.clientX,e.clientY).matrixTransform(map.getScreenCTM().inverse()),box=map.viewBox.baseVal;
      if(spot.x<box.x || spot.x>box.x+box.width || spot.y<box.y || spot.y>box.y+box.height)return;
      place(spot.x,spot.y);cursor=[spot.x,spot.y];
    };
  });
  reset.onclick=select.onchange=()=>{points[0].length=points[1].length=0;render();};
  dismiss.onclick=()=>dialog.close();
  dialog.addEventListener('cancel',e=>{if(saving)e.preventDefault();});
  save.onclick=async()=>{
    if(!candidate || saving)return;
    saving=true;save.disabled=reset.disabled=select.disabled=dismiss.disabled=true;
    try{
      if(scope!==card.scope || !card.mapReady)throw Error('The map changed. Close recovery and review it again.');
      if(raster && card.rrBlob!==blob){
        const {pixels}=await rasterReference(card.rrBlob);
        if(!aligned(target.anchor,pixels))throw Error('The scan changed. Close recovery and realign the layout.');
      }
      const ref={...target};delete ref.segments;
      const draft=localDraft(scope,raster);
      await card.updateDashboardCard(current=>{
        if(JSON.stringify(localDraft(scope,raster))!==JSON.stringify(draft))throw Error('The browser draft changed. Close recovery and review it again.');
        if(JSON.stringify(compact(current))!==expected)throw Error('The saved layout changed. Close recovery and review it again.');
        const backups=[...(current.recovery_history || [])];
        if(hasEdits(current))backups.push({at:Date.now(),record:compact(current)});
        if(draft && JSON.stringify(draft.plan??draft.layout)!==JSON.stringify(current.plan??current.layout))
          backups.push({at:Date.now(),record:compact({...current,...draft})});
        Object.assign(current,candidate.record,{recovery_reference:ref,recovery_history:backups,layout_version:Date.now()});
        delete current.room_bindings;
      });
      card.selectedRooms.clear();card.rrSelectionFloor=null;card.needsTargetChoice=true;card.pendingRegion=null;
      if(raster && JSON.stringify(localDraft(scope,true))===JSON.stringify(draft)){
        try{localStorage.removeItem(scope+':plan-draft');}catch{}
      }
      if(raster){card.scope=null;await card.pullMap();}
      else {card.frame.t90Map.placementBounds=candidate.record.placement_bounds;card.installSavedLayout();card.frame.srcdoc=card.frame.srcdoc;}
      card.refresh();card.note('Aligned layout saved to this dashboard.');dialog.close();
    }catch(e){message.textContent=e.message;select.disabled=reset.disabled=dismiss.disabled=false;save.disabled=false;}
    finally{saving=false;}
  };
  card.shadowRoot.querySelector('ha-card').append(dialog);dialog.showModal();render();
  await new Promise(resolve=>dialog.addEventListener('close',resolve,{once:true}));dialog.remove();
}
