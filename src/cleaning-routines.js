import favoriteCss from './routine-favorite.css';
import {getRoborockFloor} from './roborock-map.js';
import {aligned, scanAnchor} from './roborock-surfaces.js';

const available=s=>s!=null && !['','unavailable','unknown'].includes(s);
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const check=(condition,message)=>{if(!condition)throw Error(message);};
const label=value=>String(value).replaceAll('_',' ');
const modeKeys=new Set(['work_mode','clean_mode','cleaning_mode','cleaning_route','cleaning_passes','clean_count',
  'cleaning_count','fan_speed','suction','suction_level','suction_power','vacuum_power','vacuum_mode',
  'mop','mopping','mop_mode','mop_strength','mop_intensity','mop_wetness','mop_pressure','mop_route',
  'mop_water_flow','mop_water_flow_level','mopping_intensity','water_flow','water_flow_level','water_level','water_amount','water_volume']);
function settings(card){
  const h=card.h,device=h.entities?.[card.vacuum]?.device_id,out=new Map(),vac=h.states[card.vacuum];
  if(!device)return out;
  if(available(vac?.state) && vac.attributes.fan_speed_list?.length)
    out.set(card.vacuum,{label:'Suction',values:vac.attributes.fan_speed_list.map(String),current:vac.attributes.fan_speed});
  for(const [id,entry] of Object.entries(h.entities)){
    if(entry.device_id!==device)continue;
    const [domain,slug]=id.split('.'),state=h.states[id];
    if(!['select','number','switch'].includes(domain) || !available(state?.state))continue;
    const name=entry.translation_key || (slug.startsWith(card.stem+'_')?slug.slice(card.stem.length+1):slug);
    if(!modeKeys.has(name))continue;
    const attr=state.attributes;
    let values;
    if(domain==='number'){
      const count=Math.floor((attr.max-attr.min)/attr.step+1e-8)+1;
      if(!Number.isFinite(count) || count<1 || count>200 || attr.step<=0)continue;
      values=Array.from({length:count},(_,i)=>String(Number((attr.min+i*attr.step).toFixed(8))));
    }else values=domain==='switch'?['on','off']:attr.options?.map(String);
    if(values?.length)out.set(id,{label:attr.friendly_name || label(name),values,current:state.state});
  }
  return out;
}
function roomList(card){return Array.from(card.roomLabels || [],([id,name])=>({id,name}));}
function live(card,scope){
  const h=card.h,device=h?.entities?.[card.vacuum],image=h?.entities?.[card.image];
  check(card.isConnected && h?.connected!==false && available(h?.states[card.vacuum]?.state),'Reconnect the vacuum to Home Assistant.');
  check(scope && scope===card.scope && card.mapReady && available(h.states[card.image]?.state) &&
    card.mapStamp===h.states[card.image].state,'Wait for the current floor to load, then review again.');
  const platform=card.roborock?'roborock':'ecovacs';
  check(device?.device_id && device.device_id===image?.device_id && (!device.platform || device.platform===platform) &&
    (!image.platform || image.platform===platform),'Select the map and vacuum from the same integration device.');
  if(card.roborock)check(card.rrFloor && card.rrBlob && card.rrDisplayed===card.rrBlob,'Wait for the current Roborock floor.');
  return device.device_id;
}
function inspect(card,scope,routine){
  const device=live(card,scope);
  check(routine.device===device,'The vacuum device changed. Edit the routine and match its target again.');
  const rooms=roomList(card);
  check(routine.whole===true && routine.rooms?.length===0 || routine.whole===false && routine.rooms?.length>0,
    'Choose the cleaning target again.');
  check(routine.rooms.every(r=>rooms.some(room=>room.id===r.id && room.name===r.name)),
    'The room list changed. Edit the routine and match its rooms again.');
  const options=settings(card);
  for(const choice of routine.settings){
    check(options.get(choice.id)?.values.includes(choice.value),'Setting unavailable: '+choice.label+'. Edit the routine to choose a supported value.');
  }
}
async function rasterPixels(blob){
  const bitmap=await createImageBitmap(blob);
  try{
    const cv=document.createElement('canvas');cv.width=bitmap.width;cv.height=bitmap.height;
    const ctx=cv.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0);
    return ctx.getImageData(0,0,cv.width,cv.height);
  }finally{bitmap.close();}
}
function mapReady(card){
  return card.mapReady && card.mapStamp===card.h?.states[card.image]?.state &&
    (!card.roborock || card.rrBlob && card.rrDisplayed===card.rrBlob);
}
const frameKey=card=>card.roborock?card.rrBlob:card.mapStamp;
async function verifyFloor(card,scope,r){
  const deadline=Date.now()+10000;
  while(Date.now()<deadline){
    check(card.isConnected && card.h?.connected!==false && available(card.h.states[card.vacuum]?.state),'Reconnect the vacuum to Home Assistant.');
    check(scope===card.scope,'The floor changed. Edit the routine and match its rooms again.');
    if(!mapReady(card)){await new Promise(resolve=>setTimeout(resolve,120));continue;}
    inspect(card,scope,r);
    if(!card.roborock)return frameKey(card);
    const blob=card.rrBlob,floor=await getRoborockFloor(card.h,card.vacuum);
    const pixels=await rasterPixels(blob);
    if(card.rrBlob!==blob || !mapReady(card))continue;
    inspect(card,scope,r);
    check(same(floor,card.rrFloor),'The Roborock floor or rooms changed. Refresh and match the target again.');
    check(r.anchor && aligned(r.anchor,pixels),'The scanned floor changed. Edit the routine and match its target again.');
    return blob;
  }
  throw Error('The current scan is still loading. Wait for the floor to update and review again.');
}
function list(card){
  const prefix=(card.roborock?'qrevo:':'t90:')+card.vacuum+':'+card.image+':';
  const all=[];
  for(const [scope,record] of Object.entries(card.config?.maps || {})){
    if(scope.startsWith(prefix))for(const r of record.routines || [])all.push({scope,r});
  }
  return all.sort((a,b)=>Number(b.scope===card.scope)-Number(a.scope===card.scope) || a.r.name.localeCompare(b.r.name));
}
function service(id,value){
  const domain=id.split('.')[0];
  if(domain==='vacuum')return [domain,'set_fan_speed',{fan_speed:value}];
  if(domain==='select')return [domain,'select_option',{option:value}];
  if(domain==='number')return [domain,'set_value',{value:Number(value)}];
  return [domain,value==='on'?'turn_on':'turn_off',{}];
}
function picked(card,choice){
  const setting=settings(card).get(choice.id);
  if(!setting)return false;
  return choice.id.startsWith('number.')?Number(setting.current)===Number(choice.value):String(setting.current)===choice.value;
}
async function startRoutine(card,entry,say,endPreview){
  const {r,scope}=entry,epoch=card.generation;
  check(!card.busy && !card.startRequest,'Another command is pending.');
  const stillReady=()=>{
    check(card.generation===epoch && card.scope===scope && card.isConnected && card.h.connected!==false && ['idle','docked'].includes(card.h.states[card.vacuum]?.state),'A routine can start when the robot is idle or docked.');
    check(same(card.config.maps?.[scope]?.routines?.find(x=>x.id===r.id),r),'The saved routine changed. Open its latest review.');
    const device=card.h.entities?.[card.vacuum]?.device_id;
    check(device && device===r.device && card.h.entities?.[card.image]?.device_id===device,'Select the map and vacuum from the same integration device.');
  };
  let verifiedKey;
  const ready=async(force=false)=>{
    stillReady();
    if(force || verifiedKey!==frameKey(card) || !mapReady(card))verifiedKey=await verifyFloor(card,scope,r);
    stillReady();inspect(card,scope,r);
  };
  let requested=0,startSent=false;
  const lock={};card.routineLock=lock;
  card.busy=true;card.refresh();
  try{
    await ready(true);
    for(const choice of r.settings){
      await ready();
      if(picked(card,choice))continue;
      say('Applying '+choice.label+'…');
      await card.h.callService(...service(choice.id,choice.value),{entity_id:choice.id});
      requested++;
      const deadline=Date.now()+10000;
      while(!picked(card,choice)){
        stillReady();check(Date.now()<deadline,choice.label+' was not confirmed by Home Assistant.');
        await new Promise(resolve=>setTimeout(resolve,150));
      }
    }
    await ready(true);
    for(const choice of r.settings)check(picked(card,choice),'A setting changed during preparation. Review again.');
    endPreview();
    card.selectedRooms=new Set(r.rooms.map(room=>room.id));card.needsTargetChoice=false;
    if(card.roborock)card.rrSelectionFloor=r.whole?null:card.rrFloor;
    card.busy=false;card.refresh();stillReady();
    card.routineLock=null;
    say('Sending Start for '+r.name+'…');
    startSent=true;
    const previousCommand=card.liveCommand;
    const task=card.roborock && !r.whole?card.cleanRoborockRooms(async()=>{
      await ready();check(r.settings.every(choice=>picked(card,choice)),'A setting changed before Start.');
    }):card.control('start');
    const command=card.liveCommand;
    if(command && command!==previousCommand){
      command.routineName=r.name;
      command.routineId=r.id;
    }
    await task;
    check(command && command!==previousCommand && ['Accepted by Home Assistant','Cleaning confirmed'].includes(command.result),'Home Assistant did not confirm the Start request. Check the robot status.');
    say('Start sent for '+r.name+'.');
  }catch(err){
    throw Error((startSent?'':'Start was not sent. ')+(err.message || 'Home Assistant rejected the request.')+
      (requested?' '+requested+' setting request'+(requested===1?' was':'s were')+' already sent.':''));
  }finally{if(card.routineLock===lock){card.routineLock=null;card.busy=false;if(card.ui && card.h)card.refresh();}}
}
const el=(tag,text)=>{const node=document.createElement(tag);if(text!=null)node.textContent=text;return node;};
function btn(text,action){const b=el('button',text);b.type='button';b.onclick=action;return b;}
function field(name,control){const l=el('label');l.append(el('span',name),control);return l;}
function dialog(card,title){
  const d=el('dialog');d.setAttribute('aria-label',title);
  d.style.cssText='width:min(440px,94vw);max-height:88vh;overflow:auto';
  const heading=el('h3',title),content=el('div'),note=el('p'),actions=el('div');
  content.className='content';actions.className='actions';note.setAttribute('role','status');
  d.append(heading,content,note,actions);card.shadowRoot.querySelector('ha-card').append(d);
  d.addEventListener('close',()=>d.remove(),{once:true});d.showModal();
  return {d,content,note,actions,close:()=>d.close(),say:s=>{note.textContent=s;}};
}
function write(card,scope,original,replacement){
  return card.updateDashboardCard(record=>{
    const routines=[...(record.routines || [])];
    if(original){
      const i=routines.findIndex(r=>r.id===original.id);
      check(i>=0 && same(routines[i],original),'Another editor changed this routine. Reopen it before saving.');
      if(replacement)routines[i]=replacement;
      else{
        routines.splice(i,1);
        if(record.favorite_routine===original.id)delete record.favorite_routine;
      }
    }else{
      check(!routines.some(r=>r.id===replacement.id),'Choose a new routine again.');routines.push(replacement);
    }
    if(replacement)check(!routines.some(r=>r.id!==replacement.id && r.name.toLowerCase()===replacement.name.toLowerCase()),'Choose a different routine name for this floor.');
    record.routines=routines;
  },scope);
}
function edit(card,entry,refresh){
  const scope=card.scope,device=live(card,scope),r=entry?.r,existing=entry?.scope===scope?r:null;
  const ui=dialog(card,r?'Edit routine':'New routine'),name=el('input');
  name.type='text';name.maxLength=70;name.value=r?.name || '';ui.content.append(field('Routine name',name));
  const rooms=roomList(card),choices=el('fieldset'),targetMode=el('select');
  targetMode.add(new Option('Choose a target',''));targetMode.add(new Option('Selected rooms','rooms'));targetMode.add(new Option('Whole home','whole'));
  let validTarget=!!existing && existing.device===device && existing.rooms.every(room=>rooms.some(x=>same(x,room)));
  const selected=r?r.rooms:[...card.selectedRooms].map(id=>rooms.find(x=>x.id===id)).filter(Boolean);
  targetMode.value=r?(validTarget?(r.whole?'whole':'rooms'):''):(selected.length?'rooms':'');
  ui.content.append(field('Cleaning target',targetMode),choices);choices.append(el('legend','Rooms'));
  const checks=new Map();
  for(const room of rooms){const mark=el('input');mark.type='checkbox';mark.checked=(validTarget || !r) && selected.some(x=>x.id===room.id);
    checks.set(room.id,mark);choices.append(field(room.name,mark));}
  const drawRooms=()=>{choices.hidden=targetMode.value!=='rooms';};targetMode.onchange=drawRooms;drawRooms();
  const current=settings(card),inputs=[];
  for(const [id,opt] of current){
    const select=el('select');select.add(new Option('Leave unchanged',''));
    for(const value of opt.values)select.add(new Option(label(value),value));
    const saved=r?.settings.find(s=>s.id===id);
    select.value=saved && opt.values.includes(saved.value)?saved.value:'';
    ui.content.append(field(opt.label,select));inputs.push({id,opt,select});
  }
  const lost=r?.settings.filter(s=>!current.get(s.id)?.values.includes(s.value)) || [];
  if(lost.length)ui.content.append(el('p','Unavailable previous settings will be removed on save: '+lost.map(s=>s.label).join(', ')+'.'));
  if(r && !validTarget)ui.say('Match this routine to the current rooms or choose Whole home.');
  const editorBlob=card.rrBlob;
  let loading=!!(r && card.roborock && validTarget),saving=false;
  const cancel=btn('Cancel',ui.close);
  const save=btn('Save routine',async()=>{
    if(saving || loading)return;
    saving=true;save.disabled=cancel.disabled=true;
    try{
      check(name.value.trim(),'Enter a routine name.');check(targetMode.value,'Choose the cleaning target.');
      const whole=targetMode.value==='whole',pickedRooms=whole?[]:rooms.filter(room=>checks.get(room.id).checked);
      check(whole || pickedRooms.length,'Choose at least one room.');
      const copy={id:existing?.id || Array.from(crypto.getRandomValues(new Uint32Array(3)),n=>n.toString(36)).join('-'),
        name:name.value.trim(),device,whole,rooms:pickedRooms,
        settings:inputs.filter(f=>f.select.value).map(({id,opt,select})=>({id,label:opt.label,value:select.value}))};
      if(card.roborock){
        const blob=card.rrBlob,pixels=await rasterPixels(blob);
        if(blob!==editorBlob)check(aligned(scanAnchor(await rasterPixels(editorBlob)),pixels),'The floor changed while editing. Reopen the routine and match its current rooms.');
        copy.anchor=scanAnchor(pixels);
        check(card.rrBlob===blob && copy.anchor.points.length,'Wait for a stable map with visible walls.');
        await verifyFloor(card,scope,copy);
      }else inspect(card,scope,copy);
      await write(card,scope,existing,copy);
      refresh(copy.id,scope);ui.close();
    }catch(err){ui.say(err.message);}finally{saving=false;save.disabled=cancel.disabled=false;}
  });
  save.disabled=loading;
  if(loading){
    const blob=card.rrBlob;
    rasterPixels(blob).then(pixels=>{
      if(card.rrBlob!==blob || !r.anchor || !aligned(r.anchor,pixels)){
        targetMode.value='';checks.forEach(c=>c.checked=false);drawRooms();
        ui.say('This floor has been remapped. Choose the target on the current map before saving.');
      }
    }).catch(()=>{targetMode.value='';drawRooms();ui.say('The map could not be verified. Choose the target again.');})
    .finally(()=>{loading=false;save.disabled=false;});
  }
  save.className='primary';ui.actions.append(save,cancel);
  ui.d.addEventListener('cancel',e=>{if(saving)e.preventDefault();});
}
function review(card,entry,refresh,opener){
  card.routineReview?.close();
  const {r,scope}=entry,box=el('section'),summary=el('p'),message=el('p'),actions=el('div');
  box.setAttribute('role','region');box.setAttribute('aria-label','Review routine');
  box.className='routine-review';box.style.cssText='padding:12px clamp(14px,3%,28px);border-bottom:1px solid var(--edge);display:grid;gap:6px';
  summary.className='muted';message.setAttribute('role','status');actions.className='actions';
  const target=r.whole?'Whole home':r.rooms.map(room=>room.name).join(' · ');
  summary.textContent=[target,...r.settings.map(s=>s.label+' · '+label(s.value))].join('  /  ');
  const title=el('h3',r.name);box.append(title,summary,message,actions);
  card.q('.map-row').before(box);
  let pending=false,finished=false,dispatching=false,checking=false,verified=null;
  const say=text=>{if(message.textContent!==text)message.textContent=text;};
  const closeReview=()=>{
    if(pending)return;
    if(card.routineReview===controller)card.routineReview=null;
    box.remove();card.refresh();
    if(opener?.isConnected && !opener.hidden)opener.focus({preventScroll:true});
  };
  const start=btn('Start routine',async()=>{
    if(pending || start.disabled)return;
    pending=true;start.disabled=editButton.disabled=close.disabled=true;
    try{await startRoutine(card,entry,say,()=>{dispatching=true;});}
    catch(err){say(err.message);}
    finally{pending=false;dispatching=false;finished=true;start.disabled=true;close.disabled=editButton.disabled=false;card.refresh();}
  });start.className='primary';start.disabled=true;
  const editButton=btn('Edit routine',()=>{try{live(card,card.scope);closeReview();edit(card,entry,refresh);}catch(err){say(err.message);}});
  const close=btn('Close',closeReview);actions.append(start,editButton,close);
  const controller={
    close:closeReview,
    get blocked(){return !dispatching;},
    get pending(){return pending;},
    ids(){
      if(finished || dispatching)return null;
      if(scope!==card.scope){start.disabled=true;if(!pending)say('This routine belongs to a previous floor. Edit it to match the current rooms.');return null;}
      if(!mapReady(card)){start.disabled=true;if(!pending)say('Updating the floor preview…');return null;}
      let listKey;
      try{
        inspect(card,scope,r);
        check(same(card.config.maps?.[scope]?.routines?.find(rec=>rec.id===r.id),r),'The routine changed. Close and review again.');
        listKey=JSON.stringify(roomList(card));
      }catch(err){start.disabled=true;verified=null;if(!pending)say(err.message);return null;}
      const key=frameKey(card);
      if(!verified || verified.key!==key || verified.rooms!==listKey){
        start.disabled=true;
        if(!checking && !pending){
          checking=true;say('Checking the current floor…');
          verifyFloor(card,scope,r).then(latest=>{verified={key:latest,rooms:listKey};})
            .catch(err=>{verified={key,rooms:listKey,error:err.message};})
            .finally(()=>{checking=false;if(card.routineReview===controller)card.refresh();});
        }
        return null;
      }
      if(verified.error){start.disabled=true;if(!pending)say(verified.error);return null;}
      const ids=r.whole?roomList(card).map(room=>room.id):r.rooms.map(room=>room.id);
      if(!pending){
        const canStart=['idle','docked'].includes(card.h.states[card.vacuum]?.state);
        const unbound=!card.roborock && ids.some(id=>!Object.values(card.config.maps?.[scope]?.room_bindings || {}).includes(id));
        start.disabled=!canStart || !!card.busy || !!card.startRequest;
        say(!canStart?'The robot must be idle or docked to start a new routine.':unbound?'Match the room names on the map to show every highlight.':'');
      }
      return ids;
    }
  };
  card.routineReview=controller;card.refresh();
  box.scrollIntoView({block:'start'});close.focus({preventScroll:true});
}
async function saveFavorite(card,entry,expected){
  const {scope,r}=entry,epoch=card.generation;
  const removing=expected===r.id;
  if(!removing)await verifyFloor(card,scope,r);
  check(card.scope===scope && card.generation===epoch,'The active floor changed. Reopen its routines.');
  await card.updateDashboardCard(record=>{
    check((record.favorite_routine ?? null)===expected,'The favorite changed in another dashboard. Reload before choosing again.');
    check(same(record.routines?.find(item=>item.id===r.id),r),'The routine changed. Reload before choosing a favorite.');
    if(removing)delete record.favorite_routine;
    else record.favorite_routine=r.id;
  },scope);
}
export function mountRoutines(card){
  const styles=el('style',favoriteCss);card.shadowRoot.append(styles);
  const details=el('details'),summary=el('summary','Cleaning routines'),content=el('div'),select=el('select'),actions=el('div'),note=el('p');
  details.className='cleaning-routines';actions.className='actions';content.className='content';select.setAttribute('aria-label','Saved routine');note.setAttribute('role','status');
  const choice=()=>list(card).find(entry=>JSON.stringify([entry.scope,entry.r.id])===select.value);
  const safe=fn=>()=>{try{
    check(!card.routineReview?.pending,'Wait for the current routine request to finish.');
    note.textContent='';fn();
  }catch(err){note.textContent=err.message;}};
  let signature='',savingFavorite=false;
  const favorite=()=>card.config?.maps?.[card.scope]?.favorite_routine ?? null;
  const quick=btn('',()=>{
    if(card.routineReview?.pending)return;
    const entry=card.config?.maps?.[card.scope]?.routines?.find(r=>r.id===favorite());
    if(entry)review(card,{scope:card.scope,r:entry},refresh,quick);
  });
  quick.className='routine-favorite';quick.hidden=true;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'),star=document.createElementNS(svg.namespaceURI,'path');
  svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  star.setAttribute('d','m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z');
  svg.append(star);quick.append(svg);
  function refreshQuick(){
    if(!card.ui?.contains(details))return;
    const record=card.config?.maps?.[card.scope];
    const r=record?.favorite_routine && record.routines?.find(row=>row.id===record.favorite_routine);
    const device=card.h?.entities?.[card.vacuum]?.device_id;
    const visible=Boolean(r && device && r.device===device && card.h.entities?.[card.image]?.device_id===device);
    quick.hidden=!visible;
    if(visible){
      const title='Review favorite: '+r.name;
      if(quick.title!==title){quick.title=title;quick.setAttribute('aria-label',title);}
      quick.disabled=!!card.routineReview?.pending || card.h?.connected===false || !available(card.h.states?.[card.vacuum]?.state);
      if(!quick.parentNode)card.q('[data-action=start]')?.after(quick);
    }
  }
  function refresh(id,scope){
    if(!card.config || !card.ui?.contains(details))return;
    refreshQuick();
    const entries=list(card),sig=JSON.stringify(entries.map(e=>[e.scope,e.r.id,e.r.name,e.scope===card.scope]));
    if(sig!==signature){const last=select.value;select.replaceChildren(...entries.map(e=>new Option(e.r.name+(e.scope===card.scope?'':' · Previous floor'),JSON.stringify([e.scope,e.r.id]))));
      if([...select.options].some(o=>o.value===last))select.value=last;
      signature=sig;
    }
    if(id)select.value=JSON.stringify([scope,id]);
    select.hidden=reviewButton.hidden=editButton.hidden=remove.hidden=!entries.length;
    const chosen=choice();
    pin.hidden=!chosen || chosen.scope!==card.scope;
    pin.disabled=savingFavorite || !!card.routineReview?.pending || !mapReady(card);
    const isFavorite=Boolean(chosen && chosen.scope===card.scope && chosen.r.id===favorite());
    pin.textContent=isFavorite?'Unpin favorite':'Pin as favorite';
    add.disabled=!card.mapReady || !card.scope;
  }
  const add=btn('New routine',safe(()=>edit(card,null,refresh)));
  const reviewButton=btn('Review',safe(()=>{const entry=choice();if(entry)review(card,entry,refresh);}));
  const editButton=btn('Edit',safe(()=>{const entry=choice();if(entry)edit(card,entry,refresh);}));
  const pin=btn('Pin as favorite',async()=>{
    const entry=choice(),expected=favorite();
    if(!entry || entry.scope!==card.scope || savingFavorite || card.routineReview?.pending)return;
    savingFavorite=true;pin.disabled=true;note.textContent='';
    try{
      await saveFavorite(card,entry,expected);
      note.textContent=expected===entry.r.id?'Favorite removed.':'Favorite saved beside Start.';
    }catch(err){note.textContent=err.message;}
    finally{savingFavorite=false;refresh();}
  });
  const remove=btn('Remove',safe(()=>{
    const entry=choice();if(!entry)return;
    const ui=dialog(card,'Remove routine');ui.content.append(el('p','Remove “'+entry.r.name+'” from this dashboard?'));
    const commit=btn('Remove routine',async()=>{commit.disabled=true;try{await write(card,entry.scope,entry.r,null);refresh();ui.close();}catch(err){ui.say(err.message);commit.disabled=false;}});
    ui.actions.append(commit,btn('Cancel',ui.close));
  }));
  select.onchange=()=>{refresh();reviewButton.onclick();};
  actions.append(add,reviewButton,pin,editButton,remove);content.append(select,actions,note);details.append(summary,content);
  card.ui.querySelector('.rooms').after(details);
  details.ontoggle=()=>{if(details.open)refresh();};
  return ()=>{if(details.open)refresh();else refreshQuick();};
}
