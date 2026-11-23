import './editor.js';
import palette from './appearance.css';
import cardStyles from './card.css';
import sceneDocument from 't90-scene';
import { parseDreameMap } from './dreame-map.js';
import { parseT90Map } from './map.js';
const title = s => String(s || '').replaceAll('_',' ').replace(/^./, c => c.toUpperCase());
const known = s => s !== undefined && s !== null && !['unknown','unavailable',''].includes(s);
const statesText = s => known(s) ? title(s) : 'Not reported';
const layoutValid = (layout, layoutKeys) => layout && typeof layout === 'object' && Object.keys(layout).length &&
  Object.keys(layout).every(k => (layoutKeys || []).includes(k) && layout[k]?.version === 1 &&
    (k === layoutKeys[0] ? Array.isArray(layout[k].items) : Array.isArray(layout[k].added) || typeof layout[k].walls === 'object'));
function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content != null) node.textContent = content;
  if (className) node.className = className;
  return node;
}
function option(value, label) { return new Option(label, value); }

class T90MapCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({mode:'open'});
    this.notifications = new Map();
    this.selectedRooms = new Set();
    this.settingRows = new Map();
    this.mapVersion = '';
    this.generation = 0;
    this.targetRevision = 0;
  }
  static getConfigElement() { return document.createElement(__EDITOR_TYPE__); }
  static getStubConfig() { return {entity:'',map_entity:''}; }
  setConfig(config) {
    if (!__DREAME_TESTER__ && config.map_entity && !/^image\.[a-z0-9_]+$/.test(config.map_entity)) throw Error('Choose an Ecovacs map image.');
    if (__DREAME_TESTER__ && config.map_entity && !config.map_entity.startsWith('camera.')) throw Error('Choose the current Dreame map camera.');
    if (!/^vacuum\.[a-z0-9_]+$/.test(config.entity || '') || !/^(image|camera)\.[a-z0-9_]+$/.test(config.map_entity || '')) {
      if (config.entity || config.map_entity) {
        if (config.entity && !/^vacuum\.[a-z0-9_]+$/.test(config.entity) ||
            config.map_entity && !/^(image|camera)\.[a-z0-9_]+$/.test(config.map_entity)) throw Error('Invalid vacuum or map entity ID.');
      }
      this.generation++;
      this.abort?.abort();
      this.config = null;
      this.ui = null;
      this.scope = this.mapStamp = this.roomsKey = this.readingsKey = this.alertKey = null;
      this.selectedRooms.clear();
      this.settingRows.clear();
      this.shadowRoot.replaceChildren(element('p','Choose a vacuum and its map in the card editor.'));
      return;
    }
    const changed = this.config && (this.vacuum !== config.entity || this.image !== config.map_entity);
    if (changed) {
      if (this.dreame && this.selectedRooms.size) this.targetInvalid = true;
      this.generation++;
      this.abort?.abort();
      this.frame.remove();
      this.shadowRoot.replaceChildren();
      this.ui = this.scope = this.roomsKey = this.readingsKey = this.alertKey = this.mapStamp = null;
      this.settingRows.clear();
      this.selectedRooms.clear();
      this.notifications.clear();
      this.livePaths = [];
      this.pendingRegion = null;
    }
    if (!this.ui || changed) {
      this.nativeRooms = null;
      this.mapReady = false;
    }
    this.config = config;
    this.vacuum = config.entity;
    this.image = config.map_entity;
    this.dreame = this.image.startsWith('camera.');
    this.stem = this.vacuum.split('.')[1];
    if (!this.ui) this.build();
    if (this.h) this.refresh();
  }
  entityIdFor(domain, suffix) {
    const device = this.h.entities?.[this.vacuum]?.device_id;
    const conventional = domain + '.' + this.stem + '_' + suffix;
    if (!device) return conventional;
    if (this.h.entities?.[conventional]?.device_id === device) return conventional;
    return Object.keys(this.h.entities).find(key => key.startsWith(domain + '.') &&
      this.h.entities[key].device_id === device && this.h.entities[key].translation_key === suffix);
  }
  getCardSize() { return 14; }
  set hass(value) {
    if (this.dreame) {
      const device = this.mapDevice(value);
      const available = this.mapAvailable(value);
      if (this.mapWasAvailable !== available || this.sourceDevice !== device) {
        this.generation++;
        this.abort?.abort();
        this.mapReady = false;
        this.mapVersion = this.mapStamp = null;
        if (this.sourceDevice && device && device !== this.sourceDevice && this.selectedRooms.size) {
          this.selectedRooms.clear();
          this.targetInvalid = true;
        }
      }
      this.mapWasAvailable = available;
      if (device) this.sourceDevice = device;
    }
    this.h = value;
    if (this.ui) this.refresh();
  }
  mapDevice(h) {
    const device = h?.entities?.[this.vacuum]?.device_id;
    return device && h.entities?.[this.image]?.device_id === device ? device : null;
  }
  mapAvailable(h) {
    return !!(h && h.connected !== false && this.mapDevice(h) &&
      known(h.states[this.vacuum]?.state) && known(h.states[this.image]?.state));
  }
  connectedCallback() {
    if (!this.timer) this.timer = setInterval(() => this.pullMap(true), 5000);
    if (this.ui && this.h) this.refresh();
  }
  disconnectedCallback() {
    clearInterval(this.timer); this.timer = null;
    this.subscription?.then(fn => fn?.()).catch(()=>{});
    this.subscription = null;
    this.mapReady = false;
    this.mapStamp = this.mapVersion = null;
    this.generation++;
    this.abort?.abort();
  }
  setAppearance(look) {
    this.dataset.appearance = look === 'night' ? 'night' : 'daylight';
    for (const button of this.shadowRoot.querySelectorAll('[data-look]')) {
      button.setAttribute('aria-pressed', String(button.dataset.look === this.dataset.appearance));
    }
    if (this.frame.t90Map) this.frame.t90Map.appearance = this.dataset.appearance;
    this.frame.contentWindow?.t90SetAppearance?.(this.dataset.appearance);
  }
  build() {
    this.shadowRoot.innerHTML = `<style>${palette}
${cardStyles}</style>
    <ha-card><div class="cockpit"><div class="appearance"><span>Map appearance</span>
    <div class="picker" role="group" aria-label="Map appearance"><button type="button" data-look="daylight">Daylight</button><button type="button" data-look="night">Night</button></div></div>
    <div class="map-row"><iframe title="Live 3D Deebot map"></iframe>
    <aside class="robot-panel" aria-label="Deebot controls"><img alt="Deebot T90 robot preview" hidden>
    <div class="identity"><h2>Deebot T90</h2><span class="vitals"></span><div class="room-activity" hidden></div></div>
    <div class="targetbox"><span class="target-label">Cleaning target</span><p class="target" aria-live="polite">Whole home</p></div>
    <div class="actions main-actions"></div></aside></div></div><section class="panel">
    <details class="rooms"><summary>Choose rooms · Whole home</summary><div class="content"><div class="chips"></div><button class="reassign" type="button">Change a map room name</button></div></details>
    <details open><summary>Cleaning settings</summary><div class="content settings"></div></details>
    <details><summary>Dock and maintenance</summary><div class="content"><div class="actions station"></div><div class="readings"></div></div></details>
    <div class="alerts" aria-live="polite"></div><details class="history"><summary>Recent alerts and cleaning jobs</summary><div class="content fault-history"></div></details>
    <details><summary>Room layout</summary><div class="content"><label>Import your edited map <input type="file" accept="application/json,.json"></label><button class="export-layout">Export layout file</button><button class="save-layout">Save this layout to the dashboard</button></div></details>
    <p class="note" role="status"></p></section>
    <dialog aria-labelledby="room-name-title"><h3 id="room-name-title">Which room is this?</h3><p class="muted">Match the highlighted floor to its Ecovacs name.</p>
    <select aria-label="Ecovacs room name"></select><div class="actions"><button class="bind primary" disabled>Save room</button><button class="cancel">Cancel</button></div>
    <p class="binding-error" aria-live="polite"></p></dialog></ha-card>`;
    this.ui = this.shadowRoot.querySelector('.panel');
    this.frame = this.shadowRoot.querySelector('iframe');
    this.q = sel => this.shadowRoot.querySelector(sel);
    const preferenceKey = 't90:' + this.vacuum + ':' + this.image + ':appearance';
    let look;
    try { look = localStorage.getItem(preferenceKey); } catch { /* Storage is optional. */ }
    this.setAppearance(look);
    for (const button of this.shadowRoot.querySelectorAll('[data-look]')) {
      button.onclick = () => {
        this.setAppearance(button.dataset.look);
        try { localStorage.setItem(preferenceKey, button.dataset.look); } catch { /* Session only. */ }
      };
    }
    this.frame.addEventListener('load', () => { this.mapVersion='';
      const portrait=this.frame.contentDocument?.querySelector('.product img');
      if(portrait?.src) {
        const photo=this.q('.robot-panel img'); photo.src=portrait.src; photo.hidden=false;
      }
      this.syncMapRooms(); this.pullMap(); });
    if (this.dreame) {
      this.frame.title = 'Live 3D vacuum map';
      this.q('.reassign').hidden = true;
      this.q('.robot-panel').setAttribute('aria-label','Vacuum controls');
      this.q('.robot-panel img').alt = 'Illustrative robot vacuum';
    }
    this.note('Waiting for the map…');
    const dialog=this.q('dialog'), chooser=dialog.querySelector('select');
    chooser.onchange=()=>{this.q('.bind').disabled = chooser.value==='';};
    this.q('.bind').onclick=()=>this.bindRoom(Number(chooser.value));
    this.q('.cancel').onclick=()=>dialog.close();
    dialog.onclose=()=>{if (!dialog.open) {this.pendingRegion=null;this.syncMapRooms();}};
    this.q('.reassign').onclick=()=>{this.renaming=!this.renaming;this.refresh();};

    for (const [service,label] of [['start','Start'],['pause','Pause'],['stop','Stop'],['return_to_base','Go home']]) {
      const button = element('button',label,service === 'start' ? 'primary' : '');
      button.dataset.action = service;
      button.onclick = () => this.control(service);
      this.q('.main-actions').append(button);
    }
    this.q('.history').ontoggle = () => { if (this.q('.history').open) this.loadHistory(); };
    this.q('input[type=file]').onchange = async e => {
      try {
        const file = e.currentTarget.files[0];
        e.currentTarget.value='';
        if (!file) return;
        if (file.size > 1500000) throw Error('Layout file is too large');
        const layout = JSON.parse(await file.text());
        if (!layoutValid(layout, this.layoutKeys)) throw Error('Choose a Deebot layout export');
        await this.saveLayout(layout);
      } catch (err) { this.note(err.message); }

    };
    this.q('.export-layout').onclick = () => {
      this.frame.contentDocument?.getElementById('export-layout')?.click();
    };
    this.q('.save-layout').onclick = async () => {
      try {
        const layout = Object.fromEntries((this.layoutKeys || []).filter(k=>localStorage.getItem(k)).map(k=>[k, JSON.parse(localStorage.getItem(k))]));
        if (!layoutValid(layout, this.layoutKeys)) throw Error('Edit the map or import a layout first.');
        await this.saveLayout(layout);
      } catch (err) { this.note(err.message); }
    };
  }
  activateMap(map) {
    const scope = 't90:' + this.vacuum + ':' + this.image + ':' + map.geometryId;
    if (scope === this.scope) return;
    if (this.dreame && this.selectedRooms.size) this.targetInvalid = true;
    this.scope = scope;
    this.layoutKeys = [scope + ':furniture', scope + ':walls'];
    this.selectedRooms.clear();
    this.pendingRegion = null;
    this.q('dialog').close();
    this.frame.t90Map = { scan: map.svg, scope, appearance: this.dataset.appearance, dreame:this.dreame };
    this.installSavedLayout();
    this.frame.srcdoc = sceneDocument;
    this.note('');
  }
  installSavedLayout() {
    const saved = this.scope && this.config.maps?.[this.scope];
    if (!saved || !layoutValid(saved.layout, this.layoutKeys)) return;
    const versionKey = this.scope + ':layout-version';
    if (localStorage.getItem(versionKey) === String(saved.layout_version)) return;
    for (const key of this.layoutKeys) {
      if (saved.layout[key]) localStorage.setItem(key, JSON.stringify(saved.layout[key]));
      else localStorage.removeItem(key);
    }
    localStorage.setItem(versionKey, String(saved.layout_version));
  }
  async updateDashboardCard(change) {
    const scope = this.scope;
    if (!scope) throw Error('Wait for the map to load.');
    const dashboard = location.pathname.split('/')[1];
    const request = { type: 'lovelace/config', url_path: dashboard === 'lovelace' ? null : dashboard };
    const config = await this.h.callWS(request);
    const before = JSON.stringify(config);
    const matches = [];
    const visit = obj => {
      if (!obj || typeof obj !== 'object') return;
      if (obj.type === 'custom:'+__CARD_TYPE__ && obj.entity === this.vacuum && obj.map_entity === this.image) matches.push(obj);
      else for (const child of Object.values(obj)) visit(child);
    };
    visit(config.views);
    if (matches.length !== 1) throw Error('Saving requires a storage dashboard with one card for this vacuum and map.');
    const card = matches[0];
    const saved = { ...card.maps?.[scope] };
    change(saved);
    card.maps = { ...card.maps, [scope]: saved };
    const latest = await this.h.callWS({...request, force:true});
    if (JSON.stringify(latest) !== before || this.scope !== scope) throw Error('Map or dashboard changed. Try saving again.');
    await this.h.callWS({ type:'lovelace/config/save', url_path:request.url_path, config });
    if (this.scope === scope) this.config = card;
  }
  async saveLayout(layout) {
    await this.updateDashboardCard(card=>{card.layout=layout;card.layout_version=Date.now();});
    this.installSavedLayout();
    this.frame.srcdoc = this.frame.srcdoc;
    this.note('Layout saved for this dashboard.');
  }
  note(message) {
    const note = this.ui && this.q('.note');
    if (note) note.textContent = message;
  }
  async send(domain, service, entity, data = {}) {
    if (this.busy || !entity || !this.isConnected || this.h?.connected === false) return;
    this.busy = true; this.refresh();
    try {
      await this.h.callService(domain,service,data,{entity_id:entity});
      this.note('Command sent · ' + title(service));
    } catch (err) { this.note('Command failed · ' + (err.message || 'Home Assistant rejected the request')); }
    finally { this.busy = false; this.refresh(); }
  }
  async control(action) {
    if (!this.isConnected || this.h?.connected === false || !known(this.h?.states[this.vacuum]?.state)) return;
    if (action === 'start' && (this.checkingTarget || this.busy)) return;
    if (action !== 'start') this.targetRevision++;
    if (this.dreame && action === 'start' && this.h.states[this.vacuum].state !== 'paused' &&
        (this.targetInvalid || !this.mapAvailable(this.h))) {
      this.note('Check the current map and choose a cleaning target.');
      return;
    }
    if (action === 'start' && (this.dreame || this.selectedRooms.size) && !this.mapReady && this.h.states[this.vacuum]?.state !== 'paused') {
      this.note('Wait for the current map before starting a room clean.');
      return;
    }
    if (action === 'start' && this.selectedRooms.size && this.h.states[this.vacuum]?.state !== 'paused') {
      if (this.dreame) {
        const scope = this.scope, generation = this.generation, segments = [...this.selectedRooms];
        const requestState = this.h.states[this.vacuum]?.state;
        const revision = this.targetRevision, device = this.mapDevice(this.h);
        this.checkingTarget = true;
        try {
          if (this.mapRequest) await this.mapRequest;
          const fresh = await this.pullMap(true);
          if (!fresh || !this.mapAvailable(this.h) || device !== this.mapDevice(this.h) ||
              revision !== this.targetRevision || generation !== this.generation || this.scope !== scope ||
              this.selectedRooms.size !== segments.length || !segments.every(id => this.selectedRooms.has(id))) {
            this.note('Room clean was not sent. Check the current map and select your rooms again.');
            return;
          }
          if (!known(requestState) || requestState !== this.h.states[this.vacuum]?.state) {
            this.note('Vacuum state changed. Review the current cleaning controls.');
            return;
          }
          return await this.send('dreame_vacuum','vacuum_clean_segment',this.vacuum,{segments});
        } finally { this.checkingTarget = false; }
      }
      return this.send('vacuum','send_command',this.vacuum,{command:'spot_area',params:{rooms:[...this.selectedRooms],cleanings:Number(this.h.states[this.entityIdFor('number','clean_count')]?.state)||1}});
    }
    return this.send('vacuum',action,this.vacuum);
  }
  renderRooms(v) {
    const rooms = v?.attributes.rooms || {};
    const entries = this.dreame ? [...(this.nativeRooms?.labels || [])] :
      Object.entries(rooms).flatMap(([name,ids]) => [].concat(ids).map(id=>[id,(title(name) || 'Room') + (!name || Array.isArray(ids) ? ' '+id : '')]));
    const signature = JSON.stringify(entries);
    if (signature === this.roomsKey) return;
    this.roomsKey = signature;
    this.roomLabels = new Map();
    const list = this.q('.chips'); list.replaceChildren();
    const valid = new Set();
    const chip = (label, value) => {
      const b = element('button',label);
      b._room = value;
      if (value !== null) this.roomLabels.set(value,label);
      b.onclick = () => this.toggleRoom(value);
      list.append(b);
    };
    chip('Whole home', null);
    for (const [value,label] of entries) {
      if (!Number.isInteger(value)) continue;
      valid.add(value);
      chip(label,value);
    }
    if (this.dreame && [...this.selectedRooms].some(id=>!valid.has(id))) {
      this.selectedRooms.clear();
      this.targetInvalid=true;
    } else this.selectedRooms = new Set([...this.selectedRooms].filter(v=>valid.has(v)));
  }
  toggleRoom(value) {
    if (value != null && !this.roomLabels?.has(value)) return;
    this.targetInvalid = false;
    this.targetRevision++;
    if (value == null) this.selectedRooms.clear();
    else if (this.selectedRooms.has(value)) this.selectedRooms.delete(value);
    else this.selectedRooms.add(value);
    this.refresh();
  }
  syncMapRooms() {
    const setRooms=this.frame?.contentWindow?.deebotSetRooms;
    if (!setRooms) return;
    const regions=(this.livePaths || []).map(path=>{
      const id=this.dreame ? this.nativeRooms?.bindings.get(path) : this.config.maps?.[this.scope]?.room_bindings?.[path];
      return {path,id:this.roomLabels?.has(id) ? id : null};
    });
    setRooms(regions,[...this.selectedRooms],this.pendingRegion,path=>{
      const region=regions.find(r=>r.path===path);
      if (!region) return;
      if (region.id != null && !this.renaming) this.toggleRoom(region.id);
      else if (!this.dreame) this.chooseRoom(path);
    });
  }
  chooseRoom(path) {
    this.pendingRegion=path;
    this.renaming=false;
    const chooser=this.q('dialog select');
    const bindings=this.config.maps?.[this.scope]?.room_bindings || {};
    const assigned=new Set((this.livePaths || []).filter(p=>p!==path).map(p=>bindings[p]));
    const options=[...this.roomLabels].map(([id,label])=>{
      const o=option(String(id),label); o.disabled=assigned.has(id); return o;
    });
    chooser.replaceChildren(option('','Choose a room'),...options);
    chooser.value=String(bindings[path] ?? '');
    this.q('.bind').disabled=chooser.value==='';
    this.q('.binding-error').textContent='';
    this.refresh();
    this.q('dialog').showModal();
  }
  async bindRoom(id) {
    const path=this.pendingRegion;
    if (!path || !this.livePaths?.includes(path) || !this.roomLabels.has(id)) return;
    this.q('.bind').disabled=true;
    try {
      const old=this.config.maps?.[this.scope]?.room_bindings?.[path];
      await this.updateDashboardCard(card=>{
        const bindings=card.room_bindings || {};
        if ((this.livePaths || []).some(p=>p!==path && bindings[p]===id)) throw Error('That room already has a map location.');
        card.room_bindings={...bindings,[path]:id};
      });
      if (old!==id) this.selectedRooms.delete(old);
      this.selectedRooms.add(id);
      this.q('dialog').close();
      this.refresh();
    } catch(err) {
      this.q('.binding-error').textContent=err.message || 'Could not save this room to the dashboard.';
      this.q('.bind').disabled=false;
    }
  }
  updateSetting(key, label, values, current, disabled, handler) {
    let row = this.settingRows.get(key);
    if (!row) {
      const parent = element('label', null, 'setting');
      const select = element('select');
      parent.append(element('span',label),select);
      this.q('.settings').append(parent);
      row = { select }; this.settingRows.set(key,row);
    }
    const sig = JSON.stringify(values);
    if (row.signature !== sig) {
      row.select.replaceChildren(option('','Not reported'),...values.map(v=>option(String(v),title(v))));
      row.select.options[0].disabled = true;
      row.signature = sig;
    }
    row.select.value = known(current) ? String(current) : '';
    row.select.disabled = disabled || !!this.busy;
    row.select.onchange = () => handler(row.select.value);
  }
  refresh() {
    const h = this.h;
    if (!this.config || !this.ui || !h || !this.isConnected) return;
    const v = h.states[this.vacuum], active = h.connected !== false && known(v?.state);
    this.q('.robot-panel h2').textContent = v?.attributes.friendly_name || (this.dreame ? 'Dreame vacuum' : 'Deebot T90');
    this.renderRooms(v);
    const count = this.selectedRooms.size;
    for (const b of this.q('.chips').children) b.setAttribute('aria-pressed',String(b._room == null ? !this.targetInvalid && count === 0 : this.selectedRooms.has(b._room)));
    this.q('.rooms summary').textContent = 'Choose rooms · ' + (this.targetInvalid ? 'Choose a new target' : count ? count+' selected' : 'Whole home');
    this.q('.reassign').setAttribute('aria-pressed',String(!!this.renaming));
    this.q('.target').textContent = this.renaming ? 'Tap the room to rename' : this.targetInvalid ? 'Map changed · Select a room or choose Whole home' : count ? [...this.selectedRooms].map(id=>this.roomLabels.get(id)).join(' · ') : 'Whole home · Tap rooms on the map';
    this.syncMapRooms();
    for (const b of this.q('.main-actions').children) {
      const a = b.dataset.action;
      b.disabled = !active || this.busy || (a === 'start' && v.state === 'cleaning') || (a === 'pause' && v.state !== 'cleaning');
      if (a === 'start' && (this.dreame || count) && (!this.mapReady || this.targetInvalid) && v?.state !== 'paused') b.disabled = true;
      if (a === 'start') b.textContent = v?.state === 'paused' ? 'Resume' : this.targetInvalid ? 'Choose target' : 'Start · ' + (count ? [...this.selectedRooms].map(room => this.roomLabels.get(room)).join(' + ') : 'Whole home');
    }
    const bat = h.states[this.entityIdFor('sensor','battery')]?.state;
    if (this.dreame) {
      const activity = this.q('.room-activity');
      const map = this.nativeRooms;
      const parts = [];
      if (this.mapReady && this.mapAvailable(h) && map && ['cleaning','paused'].includes(v?.state)) {
        if (map.currentRoom != null) parts.push('Robot in '+map.labels.get(map.currentRoom));
        if (map.completed.length) parts.push('Completed: '+map.completed.map(id=>map.labels.get(id)).join(', '));
      }
      activity.textContent = parts.join(' · ');
      activity.hidden = !parts.length;
    }
    this.q('.vitals').textContent = [statesText(v?.state),known(bat) && bat+'% battery'].filter(Boolean).join(' · ');
    this.updateSetting(this.vacuum,'Suction',v?.attributes.fan_speed_list || [],v?.attributes.fan_speed,!active, value=>this.send('vacuum','set_fan_speed',this.vacuum,{fan_speed:value}));
    const deviceId = h.entities?.[this.vacuum]?.device_id;
    const deviceEntities = Object.entries(h.states).filter(([key]) => deviceId ? h.entities?.[key]?.device_id === deviceId : key.split('.')[1].startsWith(this.stem+'_'));
    const readings = [], buttons = [];
    for (const [key,entry] of deviceEntities) {
      const domain = key.split('.')[0], atr = entry.attributes;
      const label = (atr.friendly_name || key).replace(/^Deebot T90\s*/i,'');
      const disabled = entry.state === 'unavailable' || !active;
      if (['select','number','switch'].includes(domain)) {
        let values, service, payload;
        if (domain === 'select') { values=atr.options || []; service='select_option'; payload=x=>({option:x}); }
        if (domain === 'number') {
          const n = Math.floor((atr.max-atr.min)/atr.step)+1;
          values = Number.isFinite(n) && n>0 && n<=200 ? Array.from({length:n},(_,i)=>atr.min+i*atr.step) : [];
          service='set_value'; payload=x=>({value:Number(x)});
        }
        if (domain === 'switch') { values=['on','off']; }
        this.updateSetting(key,label,values,entry.state,disabled,x=>this.send(domain,domain==='switch'?'turn_'+x:service,key,payload ? payload(x) : {}));
      }
      if (domain === 'button') buttons.push([key,label,disabled]);
      if (['sensor','binary_sensor','event'].includes(domain)) {
        const value = domain === 'event' ? statesText(atr.event_type) : h.formatEntityState?.(entry) || (statesText(entry.state) + (atr.unit_of_measurement ? ' '+atr.unit_of_measurement : ''));
        readings.push([key,label,value]);
      }
    }
    const sig = JSON.stringify([readings,buttons,!!this.busy,active]);
    if (sig !== this.readingsKey) {
      this.readingsKey = sig;
      const area = this.q('.station'); area.replaceChildren();
      const locate = element('button','Locate robot');
      locate.disabled = !active || !!this.busy; locate.onclick=()=>this.send('vacuum','locate',this.vacuum); area.append(locate);
      for (const [key,label,disabled] of buttons) {
        const b=element('button',label); b.disabled=disabled || !!this.busy; b.onclick=()=>this.send('button','press',key); area.append(b);
      }
      const list=this.q('.readings'); list.replaceChildren();
      for (const [key,label,value] of readings) {
        const b=element('button',null,'reading'); b.append(element('span',label),element('span',value));
        b.onclick=()=>this.dispatchEvent(new CustomEvent('hass-more-info',{detail:{entityId:key},bubbles:true,composed:true}));
        list.append(b);
      }
    }
    this.showAlerts();
    if (!this.subscription && h.connection) {
      this.subscription = h.connection.subscribeMessage(msg=>{
        if (msg.type==='current') this.notifications.clear();
        for (const [key,n] of Object.entries(msg.notifications || {})) {
          if (msg.type==='removed' || ![this.vacuum, this.stem, this.h.states[this.vacuum]?.attributes.friendly_name].filter(Boolean).some(name => [key,n.title,n.message].join(' ').toLowerCase().includes(name.toLowerCase()))) this.notifications.delete(key);
          else this.notifications.set(key,[n.title,n.message].filter(Boolean).join(' · '));
        }
        this.showAlerts();
      },{type:'persistent_notification/subscribe'}).catch(()=>{ this.notificationUnavailable=true; this.showAlerts(); });
    }
    const mapKey = [h.states[this.image]?.state,v?.state,h.states[this.entityIdFor('event','last_job')]?.state].join('|');
    if (mapKey !== this.mapVersion) this.pullMap();
  }
  async loadHistory() {
    const box=this.q('.fault-history');
    box.textContent='Loading…';
    const since=new Date(Date.now()-86400000).toISOString();
    const errorEntity = this.entityIdFor('sensor','error'), jobEntity = this.entityIdFor('event','last_job');
    const entities = [errorEntity,jobEntity].filter(key => key && this.h.states[key]);
    if (!entities.length) { box.textContent = 'No history entities available.'; return; }
    try {
      const history=await this.h.callApi('GET','history/period/'+since+'?filter_entity_id='+entities.join(',')+'&skip_initial_state');
      const events=history.flat().filter(e=>known(e.state) && (e.entity_id===jobEntity || Number(e.state)!==0));
      events.sort((a,b)=>Date.parse(b.last_changed)-Date.parse(a.last_changed));
      box.replaceChildren(...events.map(e=>{
        const message=e.entity_id===jobEntity ? title(e.attributes.event_type || 'Cleaning job') : e.attributes.description || 'Device error '+e.state;
        return element('p',new Date(e.last_changed).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})+' · '+message);
      }));
      if (!events.length) box.textContent='No recorded alerts or completed jobs in the last 24 hours.';
    } catch {box.textContent='Recorded history is unavailable.';}
  }
  showAlerts() {
    if (!this.h) return;
    const h=this.h, messages=[...this.notifications.values()];
    const error=h.states[this.entityIdFor('sensor','error')], job=h.states[this.entityIdFor('event','last_job')];
    if (known(error?.state) && Number(error.state)!==0) messages.unshift(error.attributes.description || 'Device error '+error.state);
    else if (h.states[this.vacuum]?.state==='error') messages.unshift('Vacuum reported a device error.');
    if (job?.attributes.event_type==='finished_with_warnings') messages.push('Last cleaning finished with warnings.');
    if (this.notificationUnavailable) messages.push('Home Assistant notifications unavailable.');
    const box=this.q('.alerts'), summary=messages.join('\n');
    if (summary!==this.alertKey) {
      box.textContent = summary; box.classList.toggle('alert',!!summary); box.hidden=!summary; this.alertKey=summary;
    }
  }
  pullMap(poll = false) {
    if (this.mapRequest) return this.mapRequest;
    this.mapRequest = this.fetchMap(poll).finally(()=>{this.mapRequest=null;});
    return this.mapRequest;
  }
  async fetchMap(poll) {
    const h=this.h, win=this.frame?.contentWindow;
    if (!this.config || !this.ui || !h || h.connected === false || !win || this.fetching || !this.isConnected || document.hidden) return;
    const v=h.states[this.vacuum], image=h.states[this.image], stamp=image?.state;
    if (!known(stamp) || !known(v?.state)) {
      this.mapReady = false;
      this.note('Waiting for the configured vacuum and map image. Check their entity IDs and availability.');
      return;
    }
    const registry = this.h.entities;
    if (registry?.[this.vacuum]?.device_id && registry?.[this.image]?.device_id &&
        registry[this.vacuum].device_id !== registry[this.image].device_id) {
      this.mapReady = false;
      this.note('The selected map belongs to another device. Choose this vacuum’s map image.');
      return;
    }
    if (this.dreame && (!registry?.[this.vacuum]?.device_id || !registry?.[this.image]?.device_id)) {
      this.mapReady = false;
      this.note('Dreame room cleaning requires a vacuum and camera registered to the same device.');
      return;
    }
    this.fetching=true;
    const epoch=this.generation;
    try {
      if (this.mapStamp!==stamp || (this.dreame && (poll || !this.mapReady))) {
        this.mapReady = false;
        this.abort = new AbortController();
        const cancel = setTimeout(()=>this.abort?.abort(),10000);
        let xml;
        try {
          const endpoint = this.dreame ? '/api/camera_map_data_proxy/' : '/api/image_proxy/';
          const res=await h.fetchWithAuth(endpoint+this.image,{cache:'no-store',signal:this.abort.signal});
          if (!res.ok) throw Error('Map HTTP '+res.status);
          xml = await res.text();
        } finally {clearTimeout(cancel);}
        if (epoch !== this.generation || !this.isConnected) return;
        if (this.dreame && (!this.mapAvailable(this.h) || this.mapDevice(this.h) !== this.mapDevice(h))) return;
        const map = this.dreame ? parseDreameMap(xml,image.attributes?.rooms) : parseT90Map(xml);
        this.nativeRooms = this.dreame ? map : null;
        this.livePaths = map.paths;
        this.activateMap(map);
        this.syncMapRooms();
        this.overlay = map.overlay;
        this.mapStamp=stamp;
      }
      if (epoch!==this.generation || !this.isConnected || this.h.connected===false) return;
      const latest=this.h, current=latest.states[this.vacuum];
      const job=latest.states[this.entityIdFor('event','last_job')]?.state, mins=latest.states[this.entityIdFor('sensor','cleaning_duration')]?.state;
      this.frame.contentWindow?.deebotTrackingUpdate?.({...this.overlay,state:current.state,stateSince:current.last_changed,job:known(job)?job:null,
        minutes:known(mins)?Number(mins):null,mapTime:this.dreame ? image.last_updated || Date.now() : stamp,received:Date.now()});
      this.mapVersion=[stamp,current.state,job].join('|');
      const becameReady = !this.mapReady;
      this.mapReady = true;
      if (becameReady || this.dreame) this.refresh();
      else if (this.frame.contentWindow?.deebotTrackingUpdate) this.syncMapRooms();
      if (this.q('.note').textContent.startsWith('Map update unavailable')) this.note('');
      return true;
    } catch (err) {
      if (epoch !== this.generation || !this.isConnected) return;
      this.mapReady = false;
      if (this.dreame || this.selectedRooms.size) this.q('[data-action=start]').disabled = true;
      this.note('Map update unavailable · '+err.message);
      this.mapVersion=[stamp,v.state,h.states[this.entityIdFor('event','last_job')]?.state].join('|');
    } finally {this.fetching=false;}
  }
}
if (!customElements.get(__CARD_TYPE__)) customElements.define(__CARD_TYPE__, T90MapCard);
window.customCards ||= [];
if (!window.customCards.some(card => card.type === __CARD_TYPE__)) {
  window.customCards.push({type:__CARD_TYPE__,name:__DREAME_TESTER__ ? 'Dreame 3D Map (beta)' : 'T90 3D Map',description:__DREAME_TESTER__ ? 'Live Dreame floor map and room cleaning.' : 'Editable Ecovacs floor map with live tracking and room cleaning.'});
}
