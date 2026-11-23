import './editor.js';
import { getRoborockFloor, readRoborockImage } from './roborock-map.js';
import palette from './appearance.css';
import cardStyles from './card.css';
import sceneDocument from 't90-scene';
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
  }
  static getConfigElement() { return document.createElement('t90-map-editor'); }
  static getStubConfig() { return {entity:'',map_entity:''}; }
  setConfig(config) {
    if (!/^vacuum\.[a-z0-9_]+$/.test(config.entity || '') || !/^image\.[a-z0-9_]+$/.test(config.map_entity || '')) {
      if (config.entity || config.map_entity) {
        if (config.entity && !/^vacuum\.[a-z0-9_]+$/.test(config.entity) ||
            config.map_entity && !/^image\.[a-z0-9_]+$/.test(config.map_entity)) throw Error('Invalid vacuum or map entity ID.');
      }
      this.generation++;
      this.cancelStartWatch();
      this.abort?.abort();
      this.config = null;
      this.ui = null;
      this.scope = this.mapStamp = this.roomsKey = this.readingsKey = this.alertKey = null;
      this.selectedRooms.clear();
      this.settingRows.clear();
      this.shadowRoot.replaceChildren(element('p','Choose your vacuum and its map image in the card editor.'));
      return;
    }
    if (config.map_source && !['ecovacs','roborock_qrevo'].includes(config.map_source)) throw Error('Unknown map source.');
    const roborock = config.map_source === 'roborock_qrevo';
    const changed = this.config && (this.vacuum !== config.entity || this.image !== config.map_entity || this.roborock !== roborock);
    if (changed) {
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
    this.roborock = roborock;
    if (!this.ui) { this.rrFloor = null; this.rrBlob = this.rrDisplayed = null; this.rrReadAt = 0; this.mapReady=false; }
    if (changed || !this.ui) {
      this.cancelStartWatch();
      this.needsTargetChoice = false;
    }
    this.config = config;
    this.vacuum = config.entity;
    this.image = config.map_entity;
    this.stem = this.vacuum.split('.')[1];
    if (!this.ui) this.build();
    if (this.h) this.refresh();
  }
  id(domain, suffix) {
    const device = this.h.entities?.[this.vacuum]?.device_id;
    const conventional = domain + '.' + this.stem + '_' + suffix;
    if (!device) return conventional;
    if (this.h.entities?.[conventional]?.device_id === device) return conventional;
    return Object.keys(this.h.entities).find(key => key.startsWith(domain + '.') &&
      this.h.entities[key].device_id === device && this.h.entities[key].translation_key === suffix);
  }
  getCardSize() { return 14; }
  set hass(value) {
    this.h = value;
    if (this.ui) this.refresh();
  }
  connectedCallback() {
    if (!this.timer) this.timer = setInterval(() => this.pullMap(), 5000);
    if (this.ui && this.h) this.refresh();
  }
  disconnectedCallback() {
    this.cancelStartWatch();
    if (this.ui && !this.roborock) this.commandStatus('');
    clearInterval(this.timer); this.timer = null;
    this.subscription?.then(fn => fn?.()).catch(()=>{});
    this.subscription = null;
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
    <ha-card><div class="cockpit"><div class="appearance"><span class="card-heading">Map appearance</span>
    <div class="picker" role="group" aria-label="Map appearance"><button type="button" data-look="daylight">Daylight</button><button type="button" data-look="night">Night</button></div></div>
    <div class="map-row"><iframe title="Live 3D Deebot map"></iframe>
    <aside class="robot-panel" aria-label="Deebot controls"><img alt="Deebot T90 robot preview" hidden>
    <div class="identity"><h2>Deebot T90</h2><span class="vitals"></span></div>
    <div class="targetbox"><span class="target-label">Cleaning target</span><p class="target" aria-live="polite">Whole home</p></div>
    <div class="actions main-actions"></div><p class="command-status" role="status" aria-live="polite"></p></aside></div></div><section class="panel">
    <details class="rooms"><summary>Choose rooms · Whole home</summary><div class="content"><div class="chips"></div><button class="reassign" type="button">Change a map room name</button></div></details>
    <details class="cleaning-settings" open><summary>Cleaning settings</summary><div class="content settings"></div></details>
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
    if (this.roborock) {
      this.frame.title='Live 3D Roborock map';
      this.q('.robot-panel img').alt='Illustrative Roborock Qrevo robot';
      this.q('.robot-panel').setAttribute('aria-label','Roborock controls');
      this.q('.reassign').hidden=true;
      this.q('.save-layout').closest('details').hidden=true;
    }
    if (!this.roborock) {
      const cockpit = this.q('.cockpit');
      cockpit.classList.add('deebot');
      this.q('.card-heading').textContent = 'Vacuum map';
      this.q('.cleaning-settings').open = false;
    }
    this.note('Waiting for the map image…');
    const dialog=this.q('dialog'), chooser=dialog.querySelector('select');
    chooser.onchange=()=>{this.q('.bind').disabled = chooser.value==='';};
    this.q('.bind').onclick=()=>this.bindRoom(Number(chooser.value));
    this.q('.cancel').onclick=()=>dialog.close();
    dialog.onclose=()=>{if (!dialog.open) {this.pendingRegion=null;this.syncMapRooms();}};
    this.q('.reassign').onclick=()=>{this.renaming=!this.renaming;this.refresh();};

    for (const [service,label] of [['start','Start'],['pause','Pause'],['stop','Stop'],['return_to_base','Go home']]) {
      const button = element('button',label,service === 'start' ? 'primary' : '');
      button.dataset.action = service;
      if (!this.roborock) {
        const icon = document.createElementNS('http://www.w3.org/2000/svg','svg');
        const glyph = document.createElementNS(icon.namespaceURI,'path');
        const glyphs = {start:'m8 4 12 8-12 8z',pause:'M8 5v14M16 5v14',stop:'M5 5h14v14H5z',return_to_base:'m2 11 10-8 10 8M5 10v11h14V10'};
        glyph.setAttribute('d',glyphs[service]);
        icon.setAttribute('viewBox','0 0 24 24');
        icon.setAttribute('aria-hidden','true');
        icon.append(glyph);
        button.replaceChildren(icon,element('span',label,'action-label'));
      }
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
    if (this.scope && this.selectedRooms.size) {
      this.selectedRooms.clear();
      this.needsTargetChoice = true;
    }
    this.scope = scope;
    this.layoutKeys = [scope + ':furniture', scope + ':walls'];
    this.pendingRegion = null;
    this.q('dialog').close();
    this.frame.t90Map = { scan: map.svg, scope, appearance: this.dataset.appearance,
      placementBounds: this.config.maps?.[scope]?.placement_bounds };
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
      if (obj.type === 'custom:t90-map-card' && obj.entity === this.vacuum && obj.map_entity === this.image) matches.push(obj);
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
  note(message) { this.q('.note').textContent = message; }
  commandStatus(message, level = '') {
    const area = this.q('.command-status');
    area.dataset.level = level;
    if (area.textContent !== message) area.textContent = message;
  }
  cancelStartWatch() {
    clearTimeout(this.startTimer);
    this.startRequest = null;
  }
  ecovacsStartProblem() {
    const vacuum = this.h.states[this.vacuum];
    if (!this.isConnected || this.h.connected === false || !known(vacuum?.state)) return 'Waiting for the Deebot to reconnect.';
    if (vacuum.state === 'paused') return '';
    if (this.needsTargetChoice) return 'The floor changed. Choose a room or Whole home before starting.';
    if (!this.selectedRooms.size) return '';
    const registry = this.h.entities;
    const device = registry?.[this.vacuum]?.device_id;
    const mapDevice = registry?.[this.image]?.device_id;
    if (device && mapDevice && device !== mapDevice) return 'Choose the map image that belongs to this Deebot.';
    if (!this.mapReady || this.mapStamp !== this.h.states[this.image]?.state) return 'Waiting for the current map to start the selected rooms.';
    if ([...this.selectedRooms].some(id => !this.roomLabels?.has(id))) return 'A selected room is unavailable. Choose Whole home or wait for the room list.';
    return '';
  }
  usesT90MaxCleanV2() {
    const entity = this.h.entities?.[this.vacuum];
    return entity?.platform === 'ecovacs' && this.h.devices?.[entity.device_id]?.model_id === 'b7vftn';
  }
  async startEcovacs() {
    if (this.busy || this.startRequest) return;
    const problem = this.ecovacsStartProblem();
    if (problem) { this.commandStatus(problem, 'error'); return; }
    const vacuum = this.h.states[this.vacuum];
    if (vacuum.state === 'cleaning') return;
    const rooms = [...this.selectedRooms];
    const roomClean = rooms.length > 0 && vacuum.state !== 'paused';
    const action = vacuum.state === 'paused' ? 'Resume' : 'Start';
    const target = roomClean ? rooms.map(id => this.roomLabels.get(id)).join(', ') : 'Whole home';
    const description = vacuum.state === 'paused' ? 'the paused job' : target;
    const cleanV2 = this.usesT90MaxCleanV2();
    const request = {};
    const epoch = this.generation;
    this.startRequest = request;
    this.commandStatus(action + ' requested · ' + description, 'pending');
    try {
      this.refresh();
      let service = 'start', data = {};
      if (cleanV2) {
        // This model rejects the legacy "clean" command in the Ecovacs profile.
        const params = vacuum.state === 'paused' ? {act:'resume'} : {act:'start',content:roomClean ?
          {type:'freeClean',value:rooms.map(id => '1,' + id).join(';')} : {type:'auto'}};
        service = 'send_command';
        data = {command:'clean_V2', params};
      } else if (roomClean) {
        service = 'send_command';
        data = {command:'spot_area',params:{rooms,cleanings:Number(this.h.states[this.id('number','clean_count')]?.state)||1}};
      }
      await this.h.callService('vacuum', service, data, {entity_id:this.vacuum});
      if (this.startRequest !== request) return;
      this.commandStatus('Waiting for the Deebot to report cleaning…', 'pending');
      const finishWaiting = () => {
        if (this.startRequest !== request) return;
        this.cancelStartWatch();
        this.commandStatus('Home Assistant accepted ' + action + ', but the Deebot hasn’t reported cleaning. Check its status in Ecovacs Home.', 'error');
        this.refresh();
      };
      this.startTimer = setTimeout(() => {
        // Allow a station's reported mop wash to finish before treating a docked robot as unconfirmed.
        if (cleanV2 && this.h.states[this.id('sensor','station_state')]?.state === 'washing_mop') {
          this.startTimer = setTimeout(finishWaiting, 210000);
        } else finishWaiting();
      }, 30000);
    } catch (err) {
      if (this.startRequest === request) {
        this.cancelStartWatch();
        const detail = err?.message || err?.error?.message || (typeof err === 'string' ? err : 'Home Assistant rejected the request.');
        this.commandStatus(action + ' failed · ' + detail, 'error');
      }
    } finally {
      if (epoch === this.generation) this.refresh();
    }
  }
  async send(domain, service, entity, data = {}) {
    if (this.busy || !entity) return;
    this.busy = true; this.refresh();
    try {
      await this.h.callService(domain,service,data,{entity_id:entity});
      this.note('Command sent · ' + title(service));
    } catch (err) { this.note('Command failed · ' + (err.message || 'Home Assistant rejected the request')); }
    finally { this.busy = false; this.refresh(); }
  }
  control(action) {
    if (!this.roborock) {
      if (action === 'start') return this.startEcovacs();
      this.cancelStartWatch();
      this.commandStatus('');
      if (this.usesT90MaxCleanV2() && (action === 'pause' || action === 'stop')) {
        return this.send('vacuum','send_command',this.vacuum,{command:'clean_V2',params:{act:action}});
      }
    }
    if (action === 'start' && this.selectedRooms.size && !this.mapReady && this.h.states[this.vacuum]?.state !== 'paused') {
      this.note('Wait for the current map before starting a room clean.');
      return;
    }
    if (action === 'start' && this.selectedRooms.size && this.h.states[this.vacuum]?.state !== 'paused') {
      return this.cleanRoborockRooms();
    }
    return this.send('vacuum',action,this.vacuum);
  }
  renderRooms(v) {
    const rooms = this.roborock ? this.rrFloor?.rooms || [] : v?.attributes.rooms || {};
    const signature = JSON.stringify(rooms);
    if (signature === this.roomsKey) return;
    this.roomsKey = signature;
    this.roomLabels = new Map();
    const list = this.q('.chips'); list.replaceChildren();
    const chip = (label, value) => {
      const b = element('button',label);
      b._room = value;
      if (value !== null) this.roomLabels.set(value,label);
      b.onclick = () => this.toggleRoom(value);
      list.append(b);
    };
    chip('Whole home', null);
    if (this.roborock) {
      for (const {id,name} of rooms) chip(rooms.filter(r=>r.name===name).length>1 ? name+' · '+id : name,id);
      // Preserve the explicit target through a metadata outage or floor change.
      // A stale selection must never fall through to a whole-home start.
      return;
    }
    for (const [name,ids] of Object.entries(rooms)) for (const value of [].concat(ids)) {
      if (!Number.isInteger(value)) continue;
      chip((title(name) || 'Room') + (!name || Array.isArray(ids) ? ' '+value : ''), value);
    }
  }
  toggleRoom(value) {
    if (!this.roborock && (value == null || this.roomLabels?.has(value))) {
      this.needsTargetChoice = false;
      if (!this.startRequest) this.commandStatus('');
    }
    if (value == null) this.selectedRooms.clear();
    else if (!this.roomLabels?.has(value)) return;
    else if (this.roborock && this.selectedRooms.size && !this.sameRoborockFloor()) {
      this.note('Room list changed. Choose Whole home to clear the old selection, then select rooms again.');
      return;
    }
    else if (this.selectedRooms.has(value)) this.selectedRooms.delete(value);
    else this.selectedRooms.add(value);
    if (this.roborock) this.rrSelectionFloor = this.selectedRooms.size ? this.rrFloor : null;
    this.refresh();
  }
  syncMapRooms() {
    if (this.roborock) {
      const host=this.frame.t90Map;
      if (host) {
        host.canEdit=!!this.rrFloor;
        host.blob=this.rrBlob;
        const vacuum=this.h?.states[this.vacuum];
        host.vacuumState=vacuum?.state;
        host.stateSince=vacuum?.last_changed;
        host.imageTime=this.mapStamp;
        host.rooms=this.rrFloor?.rooms || [];
        host.selected=[...this.selectedRooms];
        this.frame.contentWindow?.roborockUpdate?.(host);
      }
      return;
    }
    const setRooms=this.frame?.contentWindow?.deebotSetRooms;
    if (!setRooms) return;
    const regions=(this.livePaths || []).map(path=>{
      const id=this.config.maps?.[this.scope]?.room_bindings?.[path];
      const name=this.roomLabels?.get(id);
      return {path,id:name ? id : null,name:name || null};
    });
    setRooms(regions,[...this.selectedRooms],this.pendingRegion,path=>{
      const region=regions.find(r=>r.path===path);
      if (!region) return;
      if (region.id != null && !this.renaming) this.toggleRoom(region.id);
      else this.chooseRoom(path);
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
    const v = h.states[this.vacuum], active = known(v?.state);
    this.q('.identity h2').textContent = v?.attributes.friendly_name || (this.roborock ? 'Roborock' : 'Deebot T90');
    this.renderRooms(v);
    const count = this.selectedRooms.size;
    // While cleaning, Pause replaces Start. Map updates must not announce
    // readiness to start another job over the current job’s status.
    const startProblem = this.roborock || v?.state === 'cleaning' ? '' : this.ecovacsStartProblem();
    if (!this.roborock) {
      const status = this.q('.command-status');
      if (this.startRequest && v?.state === 'cleaning') {
        this.cancelStartWatch();
        this.commandStatus('Deebot reports cleaning.', 'ok');
      } else if (this.startRequest && v?.state === 'error') {
        this.cancelStartWatch();
        this.commandStatus('The Deebot reported an error. Check the robot and its station.', 'error');
      } else if (this.startRequest && this.usesT90MaxCleanV2() &&
                 h.states[this.id('sensor','station_state')]?.state === 'washing_mop') {
        this.commandStatus('The station is washing the mop. Waiting for the Deebot to leave the dock…', 'pending');
      } else if (!this.startRequest && startProblem) {
        this.commandStatus(startProblem, 'blocked');
      } else if (!startProblem && status.dataset.level === 'blocked') this.commandStatus('');
    }
    for (const b of this.q('.chips').children) b.setAttribute('aria-pressed',String(b._room == null ? count === 0 : this.selectedRooms.has(b._room)));
    this.q('.rooms summary').textContent = 'Choose rooms · ' + (count ? count+' selected' : 'Whole home');
    this.q('.reassign').setAttribute('aria-pressed',String(!!this.renaming));
    this.q('.target').textContent = this.roborock && !count && !this.rrFloor ? 'Whole home' : this.renaming ? 'Tap the room to rename' : count ? [...this.selectedRooms].map(id=>(this.roomLabels.get(id) || 'Room '+id)).join(' · ') : (this.roborock ? 'Whole home · Tap rooms on the map' : 'Whole home');
    this.syncMapRooms();
    for (const b of this.q('.main-actions').children) {
      const a = b.dataset.action;
      b.disabled = !active || this.busy || (a === 'start' && v.state === 'cleaning') || (a === 'pause' && v.state !== 'cleaning');
      if (a === 'start' && (startProblem || this.startRequest)) b.disabled = true;
      if (a === 'start' && count && (!this.mapReady || (this.roborock && !this.sameRoborockFloor())) && v?.state !== 'paused') b.disabled = true;
      if (a === 'start') {
        const paused = v?.state === 'paused';
        const target = count ? [...this.selectedRooms].map(id=>this.roomLabels.get(id) || 'Room '+id).join(' + ') : 'Whole home';
        const name = paused ? 'Resume' : 'Start · ' + target;
        if (this.roborock) b.textContent = name;
        else {
          b.setAttribute('aria-label',name);
          b.title = name;
          const label = b.querySelector('.action-label');
          if (label.textContent !== name) {
            label.replaceChildren(paused ? 'Resume' : 'Start');
            if (!paused) label.append(element('span',' · '+target,'action-target'));
          }
        }
      }
      if (!this.roborock) {
        const cleaning = v?.state === 'cleaning';
        b.hidden = a === 'start' && cleaning || a === 'pause' && !cleaning;
        b.classList.toggle('primary',a === (cleaning ? 'pause' : 'start'));
      }
    }
    const bat = h.states[this.id('sensor','battery')]?.state ?? v?.attributes.battery_level;
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
    const mapKey = [h.states[this.image]?.state,v?.state,h.states[this.id('event','last_job')]?.state].join('|');
    if (mapKey !== this.mapVersion) this.pullMap();
  }
  async loadHistory() {
    const box=this.q('.fault-history');
    box.textContent='Loading…';
    const since=new Date(Date.now()-86400000).toISOString();
    const errorEntity = this.id('sensor',this.roborock ? 'vacuum_error' : 'error');
    const jobEntity = this.roborock ? this.id('sensor','last_clean_end') : this.id('event','last_job');
    const entities = [errorEntity,jobEntity].filter(key => key && this.h.states[key]);
    if (!entities.length) { box.textContent = 'No history entities available.'; return; }
    try {
      const history=await this.h.callApi('GET','history/period/'+since+'?filter_entity_id='+entities.join(',')+'&skip_initial_state');
      const events=history.flat().filter(e=>known(e.state) && (e.entity_id===jobEntity || (e.state!=='none' && Number(e.state)!==0)));
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
    const error=h.states[this.id('sensor',this.roborock ? 'vacuum_error' : 'error')], job=h.states[this.id('event','last_job')];
    if (this.roborock && h.states[this.id('binary_sensor','water_shortage')]?.state==='on') messages.unshift('Water shortage');
    if (known(error?.state) && error.state!=='none' && Number(error.state)!==0) messages.unshift(error.attributes.description || 'Device error '+error.state);
    else if (h.states[this.vacuum]?.state==='error') messages.unshift('Vacuum reported a device error.');
    if (job?.attributes.event_type==='finished_with_warnings') messages.push('Last cleaning finished with warnings.');
    if (this.notificationUnavailable) messages.push('Home Assistant notifications unavailable.');
    const box=this.q('.alerts'), summary=messages.join('\n');
    if (summary!==this.alertKey) {
      box.textContent = summary; box.classList.toggle('alert',!!summary); box.hidden=!summary; this.alertKey=summary;
    }
  }
  sameRoborockFloor(floor=this.rrFloor) {
    return !!floor && !!this.rrSelectionFloor && JSON.stringify(floor)===JSON.stringify(this.rrSelectionFloor);
  }
  roborockDeviceMatches() {
    const vacuum=this.h.entities?.[this.vacuum], image=this.h.entities?.[this.image];
    return !!vacuum?.device_id && image?.device_id===vacuum.device_id &&
      (!vacuum.platform || vacuum.platform==='roborock') && (!image.platform || image.platform==='roborock');
  }
  async cleanRoborockRooms() {
    if (this.busy) return;
    const epoch=this.generation, target=[...this.selectedRooms], stamp=this.mapStamp;
    const stillCurrent=()=>epoch===this.generation && this.isConnected && this.h.connected!==false &&
      known(this.h.states[this.vacuum]?.state) && this.mapReady && stamp===this.h.states[this.image]?.state &&
      this.roborockDeviceMatches() && JSON.stringify(target)===JSON.stringify([...this.selectedRooms]);
    this.busy=true; this.refresh();
    try {
      if (!stillCurrent()) throw Error('Wait for the current Roborock map.');
      const floor=await getRoborockFloor(this.h,this.vacuum);
      if (!stillCurrent() || !this.sameRoborockFloor(floor) || !target.every(id=>floor.rooms.some(r=>r.id===id)))
        throw Error('Room list changed. Refresh the map and choose rooms again.');
      await this.h.callService('vacuum','send_command',{command:'app_segment_clean',params:[{segments:target}]},{entity_id:this.vacuum});
      this.note('Room cleaning command sent.');
    } catch(err) {if(epoch===this.generation) this.note(err.message || 'Room cleaning unavailable.');}
    finally {this.busy=false;this.refresh();}
  }
  async pullRoborock(h, stamp, epoch) {
    const current=()=>epoch===this.generation && this.isConnected && this.h.connected!==false &&
      this.h.states[this.image]?.state===stamp && known(this.h.states[this.vacuum]?.state);
    if (this.mapStamp!==stamp) {
      this.mapReady=false;
      this.abort=new AbortController();
      const cancel=setTimeout(()=>this.abort?.abort(),10000);
      try {
        const response=await h.fetchWithAuth('/api/image_proxy/'+this.image,{cache:'no-store',signal:this.abort.signal});
        if (!response.ok) throw Error('Map HTTP '+response.status);
        const blob=await readRoborockImage(response);
        if (!current()) return;
        this.rrBlob=blob;this.mapStamp=stamp;
      } finally {clearTimeout(cancel);}
    }
    if (!this.rrReadAt || Date.now()-this.rrReadAt>=60000) {
      let floor=null,problem='';
      try {
        if (!this.roborockDeviceMatches()) throw Error('Choose a vacuum and map from the same Roborock device.');
        floor=await getRoborockFloor(h,this.vacuum);
      } catch(err) {problem=err.message || 'Room list unavailable.';}
      if (!current()) return;
      this.rrFloor=floor;this.rrReadAt=Date.now();this.note(problem);
    }
    if (!current()) return;
    const scope=this.rrFloor ? 'qrevo:'+this.vacuum+':'+this.image+':'+this.rrFloor.flag : this.scope || 'unconfirmed';
    if (this.scope!==scope || !this.frame.t90Map) {
      this.scope=scope;
      const savedPlan=this.config.maps?.[scope]?.plan || null;
      let expected=savedPlan;
      this.frame.t90Map={scope, savedPlan, canEdit:!!this.rrFloor,
        savePlan:async(plan)=>{
          if(this.scope!==scope || !this.mapReady || !this.rrFloor) throw Error('Wait for this floor to reconnect.');
          await this.updateDashboardCard(record=>{
            if(JSON.stringify(record.plan || null)!==JSON.stringify(expected)) throw Error('Another dashboard saved this plan. Reload to review it.');
            record.plan=plan;
          });
          expected=structuredClone(plan);
        },roborock:true,onPortrait:src=>{
          if(this.scope!==scope || !this.roborock)return;
          const photo=this.q('.robot-panel img');photo.src=src;photo.hidden=false;
        },appearance:this.dataset.appearance,onRoom:id=>{if (this.mapReady && this.rrDisplayed===this.rrBlob) this.toggleRoom(id);},
        onDisplay:(blob,ok)=>{
          if (blob!==this.rrBlob || !this.isConnected) return;
          this.rrDisplayed=ok ? blob : null;
          this.mapReady=ok;
          this.refresh();
        }};
      this.syncMapRooms();
      this.frame.srcdoc=sceneDocument;
    }
    this.mapVersion=[stamp,h.states[this.vacuum].state,h.states[this.id('event','last_job')]?.state].join('|');
    this.mapReady=this.rrDisplayed===this.rrBlob;
    this.refresh();
  }
  async pullMap() {
    const h=this.h, win=this.frame?.contentWindow;
    if (!this.config || !this.ui || !h || !win || this.fetching || !this.isConnected || document.hidden) return;
    const v=h.states[this.vacuum], stamp=h.states[this.image]?.state;
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
    this.fetching=true;
    const epoch=this.generation;
    try {
      if (this.roborock) { await this.pullRoborock(h,stamp,epoch); return; }
      if (this.mapStamp!==stamp) {
        this.mapReady = false;
        this.abort = new AbortController();
        const cancel = setTimeout(()=>this.abort?.abort(),10000);
        let xml;
        try {
          const res=await h.fetchWithAuth('/api/image_proxy/'+this.image,{cache:'no-store',signal:this.abort.signal});
          if (!res.ok) throw Error('Map HTTP '+res.status);
          xml = await res.text();
        } finally {clearTimeout(cancel);}
        if (epoch !== this.generation || !this.isConnected) return;
        const map = parseT90Map(xml);
        this.livePaths = map.paths;
        this.activateMap(map);
        this.syncMapRooms();
        this.overlay = map.overlay;
        this.mapStamp=stamp;
      }
      if (epoch!==this.generation || !this.isConnected || this.h.connected===false) return;
      const job=h.states[this.id('event','last_job')]?.state, mins=h.states[this.id('sensor','cleaning_duration')]?.state;
      this.frame.contentWindow?.deebotTrackingUpdate?.({...this.overlay,state:v.state,stateSince:v.last_changed,job:known(job)?job:null,
        minutes:known(mins)?Number(mins):null,mapTime:stamp,received:Date.now()});
      this.mapVersion=[stamp,v.state,job].join('|');
      const becameReady = !this.mapReady;
      this.mapReady = true;
      if (becameReady) this.refresh();
      else if (this.frame.contentWindow?.deebotTrackingUpdate) this.syncMapRooms();
      if (this.q('.note').textContent.startsWith('Map update unavailable')) this.note('');
    } catch (err) {
      if (epoch !== this.generation || !this.isConnected) return;
      this.mapReady = false;
      if (this.selectedRooms.size) this.q('[data-action=start]').disabled = true;
      this.note('Map update unavailable · '+err.message);
      this.mapVersion=[stamp,v.state,h.states[this.id('event','last_job')]?.state].join('|');
    } finally {this.fetching=false;}
  }
}
if (!customElements.get('t90-map-card')) customElements.define('t90-map-card', T90MapCard);
window.customCards ||= [];
if (!window.customCards.some(card => card.type === 't90-map-card')) {
  window.customCards.push({type:'t90-map-card',name:'T90 3D Map',description:'3D maps and room cleaning for Ecovacs T90 and Roborock Qrevo.'});
}
