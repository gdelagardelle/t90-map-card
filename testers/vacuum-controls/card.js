import '../switchbot/switchbot-floorplan.js';
import {getRoombaFloor,getRoombaRoomTargets,startRoombaRooms} from './roomba-plus.js';
import {RoombaTrail} from './roomba-trail.js';

import {attachReport,registerEditor,trackCommand} from '../companion-setup.js';
const editor=registerEditor('controls','vacuum-controls-card',undefined,{floor:getRoombaFloor});
const actions = [
  ['start',8192,'Start'],['pause',4,'Pause'],['stop',8,'Stop'],
  ['return_to_base',16,'Go home'],['locate',512,'Locate'],['clean_spot',1024,'Spot clean']
];
const available = state => !!state && !['unknown','unavailable'].includes(state.state);
const online = hass => !!hass && hass.connected !== false && hass.connection?.connected !== false;

class VacuumControlsCard extends HTMLElement {
  static getConfigElement(){return document.createElement(editor);}
  static getStubConfig(){return {};}
  constructor() {
    super();
    this.selected=new Set();this.pending=new Set();this.trail=new RoombaTrail();
    const root=this.attachShadow({mode:'open'});
    root.innerHTML=`<style>
      :host{display:block;font:inherit;color:var(--primary-text-color,#202a29)}
      ha-card{display:grid;gap:15px;padding:18px;background:var(--ha-card-background,var(--card-background-color,#fafbf8));border-radius:var(--ha-card-border-radius,16px)}
      header{display:flex;align-items:center;gap:10px}header ha-icon{--mdc-icon-size:28px}
      h2,p,fieldset{margin:0}h2{font:600 20px/1.3 var(--ha-font-family-body,system-ui)}p,small{color:var(--secondary-text-color,#54615d)}
      button,select{font:inherit;background:transparent;color:inherit;border:1px solid var(--divider-color,#8c9994);border-radius:9px;padding:9px 12px;min-height:44px;cursor:pointer}
      button:focus-visible,select:focus-visible{outline:3px solid var(--primary-color,#18857d);outline-offset:2px}
      button:disabled,select:disabled{opacity:.45;cursor:default}button.primary,button[aria-pressed=true]{background:var(--primary-text-color,#253633);color:var(--card-background-color,#fafbf8)}
      .actions,.rooms{display:flex;flex-wrap:wrap;gap:8px}.actions button{flex:auto}
      fieldset{border:0;padding:0;min-width:0}legend{padding:0 0 7px}
      label,.trail-head{display:flex;align-items:center;justify-content:space-between;gap:10px}
      .trail{background:#172d30;color:#e4f2ef;border-radius:12px;padding:14px 15px 8px}.trail-head{font-size:14px}.trail small{color:#b7ccc9}canvas{width:100%;height:155px;display:block}
      [hidden],p:empty{display:none!important}
    </style><ha-card><header><ha-icon icon="mdi:robot-vacuum"></ha-icon><div><h2></h2><p class="state"></p></div></header>
    <div class="map" hidden></div><section class="trail" hidden><div class="trail-head"><strong>Roomba trail</strong><small>Relative position</small></div><canvas role="img" aria-label="Reported Roomba path during this session"></canvas></section>
    <fieldset hidden><legend>Cleaning target</legend><div class="rooms"></div></fieldset>
    <div class="actions"></div><label hidden><span>Cleaning setting</span><select></select></label><p role="status" class="notice"></p></ha-card>`;
    this.q=s=>root.querySelector(s);
    for(const [key,,name] of actions){
      const b=document.createElement('button');b.type='button';b.textContent=name;b.dataset.action=key;b.onclick=()=>this.run(key);
      this.q('.actions').append(b);
    }
    this.report=attachReport(this,this.q('ha-card'),'controls',()=>this.config,()=>({
      map3d:!!this.q('.map').firstElementChild?.renderer,map2d:!!this.picture,rooms:this.config && this.h && this.targets().length>0,
      position:this.trail.points.length>0,trail:this.trail.points.length>1
    }));
    this.q('select').onchange=e=>this.run('set_fan_speed',e.target.value);
    this.resize=new ResizeObserver(()=>this.trail.draw(this.q('canvas')));
  }
  connectedCallback(){this.resize.observe(this.q('canvas'));}
  disconnectedCallback(){this.resize.disconnect();this.trail.clear();this.mapRequest=null;}
  setConfig(config) {
    if(config.entity && !/^vacuum\.\w+$/.test(config.entity || '')) throw Error('Set entity to a Home Assistant vacuum.');
    if(config.map_entity && !/^(image|camera)\.\w+$/.test(config.map_entity)) throw Error('map_entity requires an image or camera.');
    if(config.battery_entity && !/^sensor\.\w+$/.test(config.battery_entity)) throw Error('battery_entity requires a sensor.');
    if(config.map_entity && config.floor_plan) throw Error('Choose a map_entity or a floor_plan.');
    if(config.floor_plan && !Array.isArray(config.floor_plan.rooms)) throw Error('floor_plan requires rooms.');
    if(config.room_selection!=null && typeof config.room_selection!=='boolean') throw Error('room_selection requires true or false.');
    if(this.config?.entity!==config.entity)this.trail.clear();
    this.config={...config};this.q('.notice').textContent='';this.render();
  }
  set hass(value){this.h=value;this.render();}
  getCardSize(){return this.config?.map_entity || this.config?.floor_plan ? 6 : 4;}
  get platform(){return this.h?.entities?.[this.config?.entity]?.platform;}
  get vacuum(){return this.h?.states?.[this.config?.entity];}
  get ready(){return this.isConnected && online(this.h) && available(this.vacuum) && !this.pending.has(this.config.entity);}
  targets(){
    const {entity,map_entity,room_selection}=this.config;
    if(!room_selection || !online(this.h) || !available(this.vacuum))return [];
    if(this.platform==='roomba_plus')return getRoombaRoomTargets(this.h,entity,map_entity);
    if(this.platform!=='sharkiq'||!this.h.entities?.[entity]?.device_id||!this.h.services?.sharkiq?.clean_room)return [];
    const names=this.vacuum.attributes.rooms;
    if(!Array.isArray(names))return [];
    // sharkiq.clean_room replaces underscores with spaces and title-cases each
    // name before matching. Expose only names that survive that round trip.
    return [...new Set(names)].filter(name=>{
      if(typeof name!=='string'||!name.trim()||name.includes('_'))return false;
      const canonical=name.replace(/\p{Cased}+/gu,word=>{
        const [first,...rest]=Array.from(word);
        return first.toUpperCase()+rest.join('').toLowerCase();
      });
      // An uncased name is also valid (e.g. Japanese room names).
      return name===canonical;
    }).map(name=>({id:name,name}));
  }
  targetScope(){
    const {entity,map_entity}=this.config,entries=this.h.entities || {};
    const floor=this.platform==='roomba_plus' && map_entity ? this.h.states[map_entity]?.attributes : null;
    return JSON.stringify([entity,entries[entity]?.device_id,this.platform,map_entity,entries[map_entity]?.device_id,floor?.pmap_id,floor?.map_id]);
  }
  stale(targets){return this.selected.size>0 && (this.scope!==this.targetScope() || [...this.selected].some(id=>!targets.some(r=>r.id===id)));}
  select(id){
    if(!this.ready)return;
    const targets=this.targets();
    if(id!==null && !targets.some(r=>r.id===id))return;
    if(this.stale(targets)||id===null)this.selected.clear();
    if(id!==null){if(this.selected.has(id))this.selected.delete(id);else this.selected.add(id);}
    this.scope=this.targetScope();this.q('.notice').textContent='';this.render();
  }
  supports(key,flag){return !!(this.vacuum?.attributes?.supported_features & flag) && !!this.h?.services?.vacuum?.[key];}
  allowed(key){
    if(!this.ready)return false;
    const s=this.vacuum.state;
    if(key==='start') return !['cleaning','error','returning'].includes(s) &&
      (this.selected.size ? !this.stale(this.targets()) : this.supports(key,8192));
    if(key==='set_fan_speed')return this.supports(key,32);
    const entry=actions.find(([k])=>k===key);
    if(!entry||!this.supports(key,entry[1]))return false;
    if(key==='pause')return s==='cleaning';
    if(key==='stop')return !['docked','idle'].includes(s);
    if(key==='return_to_base')return !['docked','returning'].includes(s);
    if(key==='clean_spot')return !this.selected.size && ['idle','docked'].includes(s);
    return true;
  }
  async run(key,value){
    if(!this.config || !this.allowed(key))return;
    const {entity,map_entity}=this.config,config=this.config;
    if(key==='set_fan_speed'&&!this.vacuum.attributes.fan_speed_list?.includes(value))return;
    this.pending.add(entity);this.q('.notice').textContent='';
    try{
      const targets=[...this.selected];
      let sent;
      if(key==='start'&&targets.length){
        if(this.platform==='roomba_plus')sent=trackCommand(this,entity,'clean_room',()=>startRoombaRooms(this.h,entity,map_entity,targets));
        else if(this.platform==='sharkiq')sent=trackCommand(this,entity,'clean_room',()=>this.h.callService('sharkiq','clean_room',{rooms:targets},{entity_id:entity}));
      }else sent=trackCommand(this,entity,key,()=>this.h.callService('vacuum',key,key==='set_fan_speed'?{fan_speed:value}:{},{entity_id:entity}));
      this.render();await sent;
    }catch(e){if(this.config===config)this.q('.notice').textContent=e?.message || 'Robot command failed.';}
    finally{this.pending.delete(entity);this.render();}
  }
  renderMap(targets){
    const box=this.q('.map'),{floor_plan,map_entity,entity}=this.config;
    const autoFloor=this.platform==='roomba_plus' && map_entity ? getRoombaFloor(this.h,entity,map_entity):null;
    const plan=autoFloor || floor_plan,source=this.h.states[map_entity];
    if(plan){
      this.mapRequest=null;this.picture=null;box.hidden=false;
      if(this.planShown!==plan){
        const view=document.createElement('switchbot-floorplan-beta');view.plan=plan;box.replaceChildren(view);
        if(autoFloor)view.shadowRoot.querySelector('.head small').textContent='Roomba+ room outlines';
        view.addEventListener('switchbot-room-tap',event=>this.select(event.detail?.id));this.planShown=plan;
      }
      box.firstElementChild.selectableRooms=targets.map(t=>t.id);box.firstElementChild.selectedRooms=this.selected;return;
    }
    this.planShown=null;
    if(!map_entity || !available(source)){
      this.mapRequest=null;this.picture=null;box.hidden=!map_entity;box.textContent=map_entity?'Map entity unavailable.':'';return;
    }
    box.hidden=false;
    if(this.picture?.id===map_entity){this.picture.el.hass=this.h;return;}
    if(this.mapRequest?.id===map_entity)return;
    this.picture=null;box.replaceChildren();const req=this.mapRequest={id:map_entity};
    Promise.resolve().then(()=>window.loadCardHelpers()).then(helpers=>{
      if(this.mapRequest!==req)return;
      const el=helpers.createCardElement({type:'picture-entity',entity:map_entity,show_state:false,show_name:false,
        ...(map_entity.startsWith('camera.')?{camera_image:map_entity}:{}),tap_action:{action:'more-info'}});
      el.hass=this.h;this.picture={id:map_entity,el};box.replaceChildren(el);this.report.update();
    }).catch(()=>{if(this.mapRequest===req){box.textContent='Could not load the map entity.';this.mapRequest=null;}});
  }
  render(){
    if(!this.config||!this.h)return;
    const v=this.vacuum,h=this.h,active=online(h);
    this.q('h2').textContent=this.config.name || v?.attributes.friendly_name || this.config.entity || 'Choose your vacuum in the card editor.';
    let status=active ? v ? h.formatEntityState?.(v)||v.state : 'Entity unavailable' : 'Home Assistant disconnected';
    const battery=this.config.battery_entity?h.states[this.config.battery_entity]?.state:v?.attributes.battery_level;
    if(active&&available(v)&&battery!=null&&String(battery).trim()&&Number.isFinite(Number(battery))&&Number(battery)>=0&&Number(battery)<=100)status+=' · '+battery+'% battery';
    this.q('.state').textContent=status;
    const targets=this.targets(),stale=this.stale(targets);
    this.renderMap(targets);
    const roomKey=JSON.stringify(targets);
    if(this.roomKey!==roomKey){this.roomKey=roomKey;const buttons=[{id:null,name:'Whole home'},...targets].map(room=>{
      const b=document.createElement('button');b.type='button';b.dataset.id=room.id??'';b.textContent=room.name;b.onclick=()=>this.select(room.id);return b;
    });this.q('.rooms').replaceChildren(...buttons);}
    this.q('fieldset').hidden=!targets.length&&!this.selected.size;
    for(const b of this.q('.rooms').children){b.disabled=!this.ready;b.setAttribute('aria-pressed',String(b.dataset.id?this.selected.has(b.dataset.id):!this.selected.size));}
    const staleText='Target changed. Select a current room or Whole home.';
    if(stale)this.q('.notice').textContent=staleText;else if(this.q('.notice').textContent===staleText)this.q('.notice').textContent='';
    for(const [key,flag,name] of actions){
      const b=this.q('[data-action="'+key+'"]'),roomStart=key==='start'&&this.selected.size>0;
      b.hidden=!(roomStart||this.supports(key,flag)) || (key==='start'&&v?.state==='cleaning') || (key==='pause'&&v?.state!=='cleaning');
      b.disabled=!this.allowed(key);b.classList.toggle('primary',key==='start'||key==='pause');
      b.textContent=key==='start'?(roomStart?'Clean selected rooms':v?.state==='paused'?'Resume':'Start'):name;
    }
    const modes=Array.isArray(v?.attributes.fan_speed_list)?v.attributes.fan_speed_list.filter(x=>typeof x==='string'&&x.length):[];
    const select=this.q('select'),modeKey=JSON.stringify(modes);
    if(this.modeKey!==modeKey){select.replaceChildren(new Option('Choose a setting',''),...modes.map(x=>new Option(x,x)));select.options[0].disabled=true;this.modeKey=modeKey;}
    select.value=modes.includes(v?.attributes.fan_speed)?v.attributes.fan_speed:'';
    select.disabled=!this.allowed('set_fan_speed');this.q('label').hidden=!modes.length||!this.supports('set_fan_speed',32);
    const trailSource=JSON.stringify([this.config.entity,this.platform,h.entities?.[this.config.entity]?.device_id]);
    if(this.trailSource!==trailSource){this.trail.clear();this.trailSource=trailSource;}
    if(active && available(v) && ['roomba','roomba_plus'].includes(this.platform))this.trail.observe(v);
    else this.trail.clear();
    this.q('.trail').hidden=!this.trail.points.length;this.trail.draw(this.q('canvas'));this.report.update();
  }
}
if(!customElements.get('vacuum-controls-card'))customElements.define('vacuum-controls-card',VacuumControlsCard);
