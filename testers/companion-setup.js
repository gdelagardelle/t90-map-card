import {readBounded} from './valetudo/map.js';

// Only fixed capability labels and statuses enter the shareable report.
const profiles = {
  dreame: { title: 'Dreame 3D Map (beta)', map: 'Current Dreame floor map camera', required: true,
    platforms: ['dreame_vacuum'], hint: 'Choose the current floor camera registered to this Dreame vacuum. Saved maps and history cameras cannot provide a live floor.' },
  switchbot: { title: 'SwitchBot Vacuum', map: 'Optional map image or camera', platforms: ['switchbot_cloud', 'switchbot_vacuum'],
    hint: 'Controls work without a map. Choose an existing image for a 2D view, or keep your hand-drawn floor plan in YAML.' },
  controls: { title: 'Vacuum Controls', map: 'Optional map image or camera',
    hint: 'Controls work without a map. A Roomba+ Rooms Map image can supply 3D outlines. Other images and cameras display in 2D.' },
  valetudo: { title: 'Valetudo 3D Map', map: 'MQTT Map data camera', required: true, platforms: ['mqtt'],
    hint: 'Choose the Map data camera on the same MQTT device as the vacuum. The 3D viewer needs a PNG with embedded Valetudo map data.' }
};
const labels = {
  vacuum: 'Vacuum available', source: 'Map source', rendered: 'Map preview', room: 'Room cleaning',
  controls: 'Vacuum controls', suction:'Suction settings', position: 'Robot position', trail: 'Cleaning path'
};
const platformNames = {dreame_vacuum:'Dreame Vacuum',mqtt:'MQTT',switchbot_cloud:'SwitchBot Cloud',switchbot_vacuum:'SwitchBot Vacuum',
  roomba:'Roomba',roomba_plus:'Roomba+',sharkiq:'Shark IQ',xiaomi_miio:'Xiaomi Miio',matter:'Matter'};
const knownModels = new Set([
  'Floor Cleaning Robot S10','Mini Robot Vacuum K10+','Mini Robot Vacuum K10+ Pro',
  'Dreame L40s Pro Ultra','L40s Pro Ultra','L10s Ultra','Roomba 980','Braava jet m6','Shark IQ RV1001AE','Mi Robot Vacuum',
  'dreame.vacuum.r9419a','dreame.vacuum.r9419e','dreame.vacuum.r9419h','dreame.vacuum.r9419t'
]);
const yes = value => value ? 'Detected' : 'Not detected';
const active = state => Boolean(state && !['unknown','unavailable',''].includes(state.state));
const uiStyle = 'display:grid;gap:10px;font:inherit;color:var(--primary-text-color,inherit)';
const controlStyle = 'color:inherit;background:var(--card-background-color,transparent);border:1px solid var(--divider-color,#828282);border-radius:8px;padding:9px 12px;font:inherit;max-width:100%';

const latestCommand = new WeakMap();
const commandLabels = {start:'Start',pause:'Pause',stop:'Stop',return_to_base:'Go home',clean_spot:'Spot clean',locate:'Locate',
  set_fan_speed:'Suction setting',vacuum_clean_segment:'Clean rooms',clean_rooms:'Clean rooms',clean_room:'Clean rooms'};
const expectedStates = {start:'cleaning',clean_room:'cleaning',clean_rooms:'cleaning',vacuum_clean_segment:'cleaning',pause:'paused',return_to_base:'returning'};
export async function trackCommand(card,entity,action,dispatch) {
  const command={entity,action,result:'pending',before:card.h?.states?.[entity]?.state};
  latestCommand.set(card,command);
  try { const result=await dispatch();command.result='accepted';return result; }
  catch(error){command.result='rejected';throw error;}
}
function describeCommand(card,entity) {
  const command=latestCommand.get(card);
  if(!command || command.entity!==entity)return 'None observed';
  const label=Object.hasOwn(commandLabels,command.action) ? commandLabels[command.action] : 'Setting or station action';
  if(command.result==='pending')return label+' · awaiting Home Assistant';
  if(command.result==='rejected')return label+' · request failed';
  const expected=expectedStates[command.action];
  if(expected && card.h?.connected!==false && card.h?.connection?.connected!==false &&
      expected!==command.before && card.h?.states?.[entity]?.state===expected)command.observed=true;
  return label+(command.observed?' · expected state reported by Home Assistant':' · accepted by Home Assistant')+' · physical result unconfirmed';
}

function capabilities(kind, hass, config, live = {}, command='None observed') {
  const profile = profiles[kind], entity = config.entity, map = config.map_entity;
  const registry = hass?.entities || {}, states = hass?.states || {};
  const platform = registry[entity]?.platform;
  const connected = hass && hass.connected !== false && hass.connection?.connected !== false;
  const device = registry[entity]?.device_id;
  const paired = device && device === registry[map]?.device_id;
  const usable = active(states[map]) && (!profile.required || paired);
  let source = 'Optional · none selected';
  if (config.floor_plan) source = 'Custom floor plan';
  else if (map) source = active(states[map]) && profile.required && !paired ? 'Device pairing unconfirmed' : yes(usable);
  else if (profile.required) source = 'Required · choose a camera';
  const controlSource = kind !== 'valetudo' && connected && active(states[entity]) &&
    (!profile.platforms || !platform || profile.platforms.includes(platform));
  const supports=(name,mask)=>controlSource && Boolean(hass.services?.vacuum?.[name]) && (states[entity].attributes?.supported_features & mask);
  const actions=[['Start','start',8192],['Pause','pause',4],['Stop','stop',8],['Go home','return_to_base',16]];
  if(kind==='controls') actions.push(['Locate','locate',512],['Spot clean','clean_spot',1024]);
  const commands=actions.filter(([,name,mask])=>supports(name,mask)).map(([label])=>label);
  const model=hass?.devices?.[device]?.model;
  const details = {
    vacuum: yes(connected && active(states[entity])),
    source,
    rendered: live.map3d ? '3D floor available' : live.map2d ? '2D image view available' :
      (map || config.floor_plan ? 'Awaiting map in dashboard' : 'No map selected'),
    controls: kind === 'valetudo' ? 'Map viewer only' : commands.join(', ') || 'Not detected',
    suction: kind === 'valetudo' ? 'Map viewer only' : yes(supports('set_fan_speed',32) && states[entity]?.attributes?.fan_speed_list?.length),
    room: kind === 'valetudo' ? 'Map viewer only' : !profile.required && !config.room_selection ? 'Off in card' : yes(live.rooms),
    position: yes(live.position),
    trail: yes(live.trail)
  };
  const version = hass?.config?.version;
  return [
    'Card: ' + profile.title,
    'Card version: 0.3.0-beta.7',
    'Model: ' + (knownModels.has(model) ? model : 'Unconfirmed'),
    'Integration: ' + (Object.hasOwn(platformNames, platform) ? platformNames[platform] : 'Unidentified'),
    'Home Assistant: ' + (typeof version === 'string' && /^\d{4}\.\d{1,2}\.\d{1,3}(?:[ab]\d{1,2})?$/.test(version) ? version : 'Not reported'),
    ...Object.entries(details).map(([k,v])=>labels[k]+': '+v),
    'Last command: '+command
  ].join('\n');
}
function node(tag, text) {
  const el = document.createElement(tag);
  if (text) el.textContent = text;
  return el;
}

// A local preview remains selectable even when clipboard permission is denied.
export function reportPanel(getReport) {
  const panel = node('details');
  panel.style.cssText = 'margin:8px 0;padding:12px;border-top:1px solid var(--divider-color,#8885);font:inherit';
  const summary = node('summary','Test details');
  summary.style.cssText = 'cursor:pointer;padding:5px 0';
  const body = node('div'); body.style.cssText = uiStyle;
  const note = node('small','Review the details below before sharing. Copy includes only these capability checks.');
  const output = node('textarea'); output.readOnly = true; output.rows = 10;
  output.setAttribute('aria-label','Compatibility details'); output.style.cssText = controlStyle + ';width:100%;box-sizing:border-box;resize:vertical';
  const copy = node('button','Copy test details'); copy.type = 'button'; copy.style.cssText = controlStyle + ';justify-self:start';
  const status = node('span'); status.setAttribute('role','status');
  let captured=false;
  const capture=()=>{output.value=getReport();captured=true;status.textContent='';};
  const update=()=>{if(panel.open && !captured)capture();};
  panel.addEventListener('toggle',()=>{if(panel.open)capture();else captured=false;});
  const refresh=node('button','Refresh test details');refresh.type='button';refresh.style.cssText=controlStyle+';justify-self:start';refresh.onclick=capture;
  copy.onclick = async () => {
    update();
    const value=output.value;
    try {
      if (!navigator.clipboard?.writeText) throw Error();
      await navigator.clipboard.writeText(value);
      status.textContent='Copied.';
    } catch {
      output.focus(); output.select();
      let copied=false;
      try { copied=document.execCommand('copy'); } catch { /* Manual selection remains available. */ }
      status.textContent=copied?'Copied.':'Details selected. Use your device’s Copy command.';
    }
  };
  body.append(note,output,copy,refresh,status);panel.append(summary,body);panel.update=update;
  return panel;
}

export function attachReport(card, container, kind, getConfig, getLive) {
  const panel=reportPanel(()=>capabilities(kind,card.h,getConfig() || {},getLive?.(),describeCommand(card,getConfig()?.entity)));
  container.append(panel);
  return panel;
}

async function mapPreview(kind, config, hass, adapter, signal) {
  const id=config.map_entity, device=hass.entities?.[config.entity]?.device_id;
  if (!active(hass.states?.[config.entity]) || hass.connected===false || hass.connection?.connected===false) throw Error();
  if (profiles[kind].required && (!device || device!==hass.entities?.[id]?.device_id ||
    (kind==='valetudo' && [hass.entities[config.entity],hass.entities[id]].some(entry=>entry.platform!=='mqtt')))) throw Error();
  const plan=config.floor_plan || adapter?.floor?.(hass,config.entity,id);
  if(plan) {
    const view=node('switchbot-floorplan-beta');view.plan=plan;
    return {view,info:{map3d:true}};
  }
  if(!/^(image|camera)\.[a-z0-9_]+$/.test(id) || !active(hass.states[id])) throw Error();
  const path=kind==='dreame'?'/api/camera_map_data_proxy/':id.startsWith('image.')?'/api/image_proxy/':'/api/camera_proxy/';
  const response=await hass.fetchWithAuth(path+id,{cache:'no-store',signal});
  if(!response.ok) throw Error();
  const bytes=await readBounded(response.body,kind==='dreame'?4000000:8*1024*1024);
  const parsed=adapter?.parse ? await adapter.parse(bytes,hass.states[id]?.attributes) : null;
  let blob;
  if(parsed) blob=new Blob([parsed.svg],{type:'image/svg+xml'});
  else {
    const type=response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    if(!['image/png','image/jpeg','image/webp','image/gif','image/svg+xml'].includes(type))throw Error();
    blob=new Blob([bytes],{type});
  }
  const url=URL.createObjectURL(blob),view=node('img');
  view.style.cssText='display:block;width:100%;height:155px;object-fit:contain';
  view.alt=parsed?'Floor outline from the selected map':'Preview of the selected map';
  view.src=url;
  try { await view.decode(); } catch { URL.revokeObjectURL(url);throw Error(); }
  return {view,url,info:{map3d:!!parsed,map2d:!parsed,position:!!parsed?.overlay?.xy,trail:!!parsed?.overlay?.route,
    rooms:kind==='dreame' && parsed?.labels?.size>0 && !!hass.services?.dreame_vacuum?.vacuum_clean_segment}};
}

function editorClass(kind, adapter) {
  const profile = profiles[kind];
  return class extends HTMLElement {
    constructor(){super();this.attachShadow({mode:'open'});}
    setConfig(value){this.config={...value};this.render();}
    set hass(value){this.h=value;this.render();}
    disconnectedCallback(){this.clearPreview();this.signature=null;}
    connectedCallback(){this.render();}
    clearPreview(){
      this.request?.abort();this.request=null;
      if(this.previewURL)URL.revokeObjectURL(this.previewURL);
      this.previewURL=null;this.info={};
    }
    async preview(button,box,status){
      this.clearPreview();box.replaceChildren();
      const request=this.request=new AbortController();
      const timeout=setTimeout(()=>request.abort(),10000);
      button.disabled=true;status.textContent='Reading the selected map…';
      try{
        const result=await mapPreview(kind,this.config,this.h,adapter,request.signal);
        if(this.request!==request || request.signal.aborted){
          if(result.url)URL.revokeObjectURL(result.url);
          if(this.request===request)throw Error();
          return;
        }
        this.previewURL=result.url;this.info=result.info;box.replaceChildren(result.view);
        status.textContent=result.info.map2d?'2D map image available.':'Floor layout available for 3D rendering.';
      }catch{
        if(this.request===request)status.textContent='Map preview unavailable. Check the selected source and device in Home Assistant.';
      }finally{
        clearTimeout(timeout);
        if(this.request===request){this.request=null;button.disabled=false;this.report?.update();}
      }
    }
    change(field,value){
      const next={...this.config};
      if(value === '') delete next[field]; else next[field]=value;
      if(field==='entity' && value!==this.config.entity && profile.required) delete next.map_entity;
      this.config=next;
      this.render();
      this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:next},bubbles:true,composed:true}));
    }
    render(){
      if(!this.h||!this.config)return;
      const states=this.h.states || {}, registry=this.h.entities || {}, config=this.config;
      const ids=Object.keys(states).sort();
      const owner=registry[config.entity]?.device_id;
      const vacuums=ids.filter(id=>id.startsWith('vacuum.') &&
        (!profile.platforms || !registry[id]?.platform || profile.platforms.includes(registry[id].platform)));
      const maps=ids.filter(id=>(profile.required?id.startsWith('camera.'):/^(image|camera)\./.test(id)) &&
        (!profile.required || !owner || !registry[id]?.device_id || owner===registry[id].device_id));
      const signature=JSON.stringify([config.entity,config.map_entity,Boolean(config.floor_plan),config.room_selection,
        owner,registry[config.map_entity]?.device_id,registry[config.entity]?.platform,registry[config.map_entity]?.platform,
        this.h.connected!==false && this.h.connection?.connected!==false,active(states[config.entity]),active(states[config.map_entity]),
        [...new Set([...vacuums,...maps,config.entity,config.map_entity])].filter(Boolean).map(id=>[id,states[id]?.attributes?.friendly_name]),vacuums,maps]);
      if(signature===this.signature){this.report?.update();return;}
      this.signature=signature;this.clearPreview();
      const box=node('div');box.style.cssText=uiStyle;
      const selectField=(key,label,choices,placeholder)=>{
        const wrap=node('label'); wrap.style.cssText=uiStyle;
        const select=node('select'); select.style.cssText=controlStyle;select.dataset.field=key;
        select.add(new Option(placeholder,''));
        for(const id of new Set([...choices,...(config[key]?[config[key]]:[])])){
          select.add(new Option((states[id]?.attributes?.friendly_name || id)+(states[id]?.attributes?.friendly_name?' · '+id:''),id));
        }
        select.value=config[key] || '';select.onchange=()=>this.change(key,select.value);
        wrap.append(node('span',label),select);box.append(wrap);
      };
      selectField('entity','1. Choose your vacuum',vacuums,'Choose a vacuum');
      box.append(node('small',profile.hint));
      if(config.floor_plan && !profile.required) box.append(node('p','Your YAML floor plan is active. Remove floor_plan in YAML to use a map entity.'));
      else selectField('map_entity','2. '+profile.map,maps,profile.required?'Choose a camera':'Continue without a map');
      if(!profile.required){
        const row=node('label'); const room=node('input');room.type='checkbox';room.checked=config.room_selection===true;
        room.onchange=()=>this.change('room_selection',room.checked);row.append(room,document.createTextNode(' Enable room selection when supported'));box.append(row);
      }
      if(config.entity && (config.map_entity || config.floor_plan)){
        const button=node('button','Preview selected map');button.type='button';button.style.cssText=controlStyle+';justify-self:start';
        const previewBox=node('div'),status=node('small');status.setAttribute('role','status');
        button.onclick=()=>this.preview(button,previewBox,status);
        box.append(button,status,previewBox);
      }else if(!profile.required && config.entity) box.append(node('small','Ready to save as a controls-only card.'));
      else box.append(node('small','Choose the vacuum and its map to preview the floor.'));
      this.report=reportPanel(()=>capabilities(kind,this.h,this.config,this.info));
      box.append(this.report);this.shadowRoot.replaceChildren(box);
    }
  };
}
export function registerEditor(kind, type, editorType=type+'-editor',adapter){
  if(!customElements.get(editorType))customElements.define(editorType,editorClass(kind,adapter));
  window.customCards ??= [];
  if(!window.customCards.some(item=>item.type===type))window.customCards.push({type,name:profiles[kind].title,description:profiles[kind].hint});
  return editorType;
}
