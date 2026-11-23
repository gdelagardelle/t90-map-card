import { aligned, defaultFinish, finishes, scanAnchor } from './roborock-surfaces.js';

import { setupEraseBrush } from './roborock-erase-brush.js';
import { setupWallTool } from './roborock-wall-tool.js';

export function setupPlanEditor({host,viewer,tools,canvas,locate,pick,project,grid,change,topView,originalView,editFurniture}) {
  const edit=document.createElement('button'), original=document.querySelector('[data-view=source]');
  edit.textContent='Edit floor plan';edit.type='button';edit.disabled=true;
  const erase=document.createElement('button');erase.type='button';erase.textContent='Erase brush';erase.className='rr-erase';
  tools.prepend(edit,erase);
  const panel=document.createElement('div');
  panel.className='rr-plan';panel.hidden=true;
  tools.after(panel);
  panel.innerHTML=`<label>Surface <select class="room"><option value="all">Whole floor</option></select></label>
    <label>Finish <select class="finish"></select></label><label>Color <input type="color" aria-label="Floor color"></label>
    <label>Tool <select class="tool"><option value="select">Select wall</option><option value="erase">Erase brush</option><option value="delete-floor">Delete floor</option><option value="floor">Make floor</option><option value="wall">Draw wall</option><option value="door">Cut doorway</option></select></label>
    <label class="brush-size" hidden>Brush size <input type="range" min="8" max="120" step="4" value="40"></label>
    <button class="delete-wall" hidden>Delete wall</button><button class="undo">Undo</button><button class="render">Render 3D</button>`;
  const q=s=>panel.querySelector(s);
  const save=document.createElement('button');save.textContent='Save to dashboard';save.hidden=true;tools.append(save);
  const message=document.createElement('p');message.setAttribute('role','status');message.className='rr-status';tools.after(message);
  const guide=document.createElement('div');guide.className='rr-guide';guide.hidden=true;viewer.append(guide);
  for(const [k,v] of [['marble','Marble'],['wood','Wood planks'],['tile','Tile'],['solid','Solid color']]) q('.finish').add(new Option(v,k));
  const blank=()=>({version:1,anchor:null,finishes:{},ops:[],furniture:{version:1,items:[]}});
  let data=structuredClone(host.savedPlan || blank()), expected=JSON.stringify(host.savedPlan || null);
  const key=host.scope+':plan-draft';
  let hasChanges=false;
  try {
    const draft=JSON.parse(localStorage.getItem(key));
    if(draft?.base===expected && draft.plan?.version===1) {data=draft.plan;hasChanges=true;}
  } catch { /* Browser drafts are optional. */ }
  let pixels, locked=false, editing=false, comparing=false, busy=false, gesture, roomsKey='',undo=[];
  const brushActive=()=>['erase','delete-floor'].includes(q('.tool').value);
  function refreshEditors() {
    const available=!!pixels && !!host.canEdit && !locked && !busy && !comparing;
    edit.disabled=!available;edit.setAttribute('aria-expanded',String(editing));
    editFurniture.disabled=!available || editing;
    save.hidden=!editing && !hasChanges;
    save.disabled=!available || !hasChanges;
    erase.disabled=!available;
    erase.setAttribute('aria-pressed',String(editing && q('.tool').value==='erase'));
    q('.brush-size').hidden=!brushActive();
    q('.undo').disabled=!undo.length;
  }
  function note(text){message.textContent=text;}
  function dirty() {
    hasChanges=true;
    if(!data.anchor && pixels)data.anchor=scanAnchor(pixels);
    try{localStorage.setItem(key,JSON.stringify({base:expected,plan:data}));}
    catch{note('Browser draft unavailable. Save to dashboard to keep your changes.');}
    refreshEditors();
  }
  function mutate(fn) {
    if(locked || !pixels || busy)return;
    undo.push({finishes:structuredClone(data.finishes),ops:structuredClone(data.ops)});
    if(undo.length>32)undo.shift();
    fn();dirty();change();
  }
  function showFinish() {
    const f=data.finishes[q('.room').value] || data.finishes.all || defaultFinish;
    q('.finish').value=f.material;q('input').value=f.color;
  }
  function updateRooms(rooms) {
    const sig=JSON.stringify(rooms);
    if(sig===roomsKey)return;
    roomsKey=sig;refreshEditors();
    const select=q('.room'),last=select.value;
    select.replaceChildren(new Option('Whole floor','all'),...rooms.map(r=>new Option(r.name,String(r.id))));
    select.value=[...select.options].some(o=>o.value===last)?last:'all';showFinish();
  }
  const wallTool=setupWallTool({viewer,canvas,locate,pick,project,bounds:()=>[pixels.width,pixels.height],note,removeButton:q('.delete-wall'),
    active:()=>editing && !busy && !locked && q('.tool').value==='select',
    commit:(wall,index)=>{
      if(locked || busy || !editing)return null;
      if(index==null && data.ops.length>=500){note('Undo an edit before adding another.');return null;}
      const at=index ?? data.ops.length;
      mutate(()=>{data.ops[at]={kind:'wall-edit',room:q('.room').value,...structuredClone(wall)};});
      return at;
    }
  });
  const brush=setupEraseBrush({viewer,canvas,grid,project,locate,note,size:q('.brush-size input'),
    active:()=>editing && !locked && !busy && brushActive(),tool:()=>q('.tool').value,
    room:()=>q('.room').value,preview:change,
    commit:op=>{
      if(data.ops.length>=500){change();note('Undo an edit before adding another.');return;}
      mutate(()=>data.ops.push(op));note('Stroke erased. Undo restores it.');
    }
  });
  function cancelGesture(){
    brush.cancel();wallTool.cancel();gesture=null;guide.hidden=true;
  }
  function toolChanged() {
    cancelGesture();wallTool.clear();refreshEditors();
    const help={'delete-floor':'Brush over unwanted floor. Undo restores the last stroke.',select:'Tap a wall to select it.',erase:'Drag over scan marks to erase them. Undo restores the last stroke.'};
    note(help[q('.tool').value] || 'Drag on the map with the selected tool.');
  }
  q('.tool').onchange=toolChanged;
  erase.onclick=()=>{
    if(editing && q('.tool').value==='erase'){end();return;}
    q('.tool').value='erase';
    if(!editing)edit.click();
    toolChanged();
  };
  function end() {
    cancelGesture();wallTool.clear();
    editing=false;gesture=null;guide.hidden=true;panel.hidden=true;
    topView(false);refreshEditors();
  }
  edit.onclick=()=>{
    if(editing){end();return;}
    editing=true;panel.hidden=false;topView(true);showFinish();refreshEditors();
    toolChanged();
  };
  q('.render').onclick=end;
  q('.room').onchange=showFinish;
  q('.finish').onchange=()=>mutate(()=>{
    const material=q('.finish').value;
    data.finishes[q('.room').value]={material,color:finishes[material]};showFinish();
  });
  q('input').onchange=()=>mutate(()=>{
    data.finishes[q('.room').value]={material:q('.finish').value,color:q('input').value};
  });
  q('.undo').onclick=()=>{
    const last=undo.pop();if(!last)return;
    wallTool.clear();Object.assign(data,last);showFinish();dirty();change();
  };
  original.onclick=()=>{
    comparing=!comparing;
    if(editing)end();
    original.setAttribute('aria-pressed',String(comparing));
    original.textContent=comparing?'Back to 3D':'Original scan';originalView(comparing);refreshEditors();
  };
  save.onclick=async()=>{
    if(locked || busy)return;
    busy=true;refreshEditors();panel.inert=true;
    const snapshot=structuredClone(data);
    try {
      await host.savePlan(snapshot);
      expected=JSON.stringify(snapshot);
      if(JSON.stringify(data)===expected) {
        hasChanges=false;try{localStorage.removeItem(key);}catch{}
      } else dirty();
      note('Floor plan saved to the dashboard.');
    } catch(err){note(err.message || 'Could not save this floor plan.');}
    finally{busy=false;panel.inert=false;refreshEditors();}
  };
  function screenPoint(e) {
    const box=viewer.getBoundingClientRect();return [e.clientX-box.left,e.clientY-box.top];
  }
  function drag(e){
    const [x,y]=screenPoint(e),[a,b]=gesture.screen,wall=q('.tool').value==='wall';
    guide.style.left=(wall?a:Math.min(a,x))+'px';guide.style.top=(wall?b:Math.min(b,y))+'px';
    guide.style.width=(wall?Math.hypot(x-a,y-b):Math.abs(x-a))+'px';guide.style.height=(wall?4:Math.abs(y-b))+'px';
    guide.style.transform=wall?'rotate('+Math.atan2(y-b,x-a)+'rad)':'none';guide.hidden=false;
  }
  canvas.addEventListener('pointerdown',e=>{
    if((q('.tool').value==='select' || brushActive()) || !editing || !e.isPrimary || e.button!==0 || busy)return;
    const point=locate(e);if(!point)return;
    gesture={id:e.pointerId,point,screen:screenPoint(e)};canvas.setPointerCapture(e.pointerId);drag(e);
  });
  canvas.addEventListener('pointermove',e=>{if(gesture?.id===e.pointerId)drag(e);});
  canvas.addEventListener('pointercancel',()=>{gesture=null;guide.hidden=true;});
  canvas.addEventListener('pointerup',e=>{
    if(gesture?.id!==e.pointerId)return;
    const end=locate(e),start=gesture.point;gesture=null;guide.hidden=true;
    if(!end || Math.hypot(start[0]-end[0],start[1]-end[1])<4)return;
    if(data.ops.length>=500){note('The plan has reached 500 edits. Undo an edit before adding another.');return;}
    mutate(()=>data.ops.push({kind:q('.tool').value,points:[...start,...end],room:q('.room').value}));
  });
  return {
    get data(){return locked?null:data;},
    get editing(){return editing;},
    get comparing(){return comparing;},
    updateRooms,cancelGesture,refreshHandles:()=>{wallTool.draw();brush.redraw();},
    update(p) {
      cancelGesture();wallTool.clear();pixels=p;
      locked=!!data.anchor && !aligned(data.anchor,pixels);
      if(locked) {
        if(viewer.dataset.furnishingEditing==='true')document.querySelector('[data-furnishing=done]').click();
        if(editing)end();
        note('Scan alignment changed. Your edits are paused until the original floor aligns again.');
      } else if(message.textContent.startsWith('Scan alignment changed')) note('');
      refreshEditors();
    },
    furnitureStorage:{
      getItem:()=>JSON.stringify(data.furniture),
      setItem:(_key,value)=>{if(!locked){data.furniture=JSON.parse(value);dirty();}}
    }
  };
}
