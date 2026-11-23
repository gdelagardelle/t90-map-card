// MIT. Home Assistant dashboard module.
import "./switchbot-floorplan.js";
import { getRoomTargets, isHassConnected, startRoomCleaning } from "./switchbot-rooms.js";

const feature = { start: 8192, pause: 4, stop: 8, return_to_base: 16, set_fan_speed: 32 };
const labels = { start: "Start", pause: "Pause", stop: "Stop", return_to_base: "Go home" };
const icons = { start: "play", pause: "pause", stop: "stop", return_to_base: "home-import-outline" };
const isAvailable = entity => entity && !["unknown", "unavailable"].includes(entity.state);

class SwitchBotVacuumCard extends HTMLElement {
  constructor() {
    super();
    this.selected = new Set();
    this.pendingEntities = new Set();
    this.attachShadow({ mode: "open" }).innerHTML = `
      <style>
        :host { display:block; color:var(--primary-text-color); }
        ha-card { display:grid; gap:16px; padding:20px; }
        h2 { margin:0; font:600 22px/1.2 var(--ha-font-family-body,system-ui); }
        header { display:flex; align-items:center; gap:12px; }
        header>ha-icon { --mdc-icon-size:28px; color:var(--primary-color); }
        p { margin:4px 0 0; color:var(--secondary-text-color); }
        .controls,.rooms { display:flex; gap:8px; flex-wrap:wrap; }
        button,select { font:inherit; color:inherit; background:var(--card-background-color); border:1px solid var(--divider-color,#888); border-radius:9px; padding:9px 13px; min-height:44px; }
        button { cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:6px; }
        button ha-icon { --mdc-icon-size:17px; }
        button[aria-pressed=true],button.primary { background:var(--primary-text-color); color:var(--card-background-color); }
        button:disabled, select:disabled { opacity:.5; cursor:default; }
        button:focus-visible,select:focus-visible { outline:2px solid var(--primary-color); outline-offset:2px; }
        fieldset { margin:0; padding:0; border:0; }
        legend { margin-bottom:6px; padding:0; }
        label { display:flex; gap:10px; align-items:center; justify-content:space-between; }
        [hidden],p:empty {display:none !important}
        @media(max-width:420px){ha-card{padding:14px;gap:12px}.controls button{flex:1}}
      </style>
      <ha-card><header><ha-icon icon="mdi:robot-vacuum"></ha-icon><div><h2></h2><p class="state"></p></div></header>
      <div class="map" hidden></div>
      <fieldset hidden><legend>Cleaning target</legend><div class="rooms"></div></fieldset>
      <div class="controls"></div><label hidden>Suction power <select></select></label>
      <p class="notice" role="status"></p></ha-card>`;
    this.$ = selector => this.shadowRoot.querySelector(selector);
    for (const [service, name] of Object.entries(labels)) {
      const b = document.createElement("button");
      b.type = "button";
      b.dataset.service = service;
      const icon = document.createElement("ha-icon");
      icon.setAttribute("icon", "mdi:" + icons[service]);
      icon.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.textContent = name;
      b.append(icon, text);
      b.onclick = () => this.run(service);
      this.$(".controls").append(b);
    }
    this.$("select").onchange = e => this.run("set_fan_speed", e.target.value);
  }

  setConfig(config) {
    if (!/^vacuum\.\w+$/.test(config.entity || "")) throw Error("Set entity to your SwitchBot vacuum entity ID.");
    if (config.map_entity && !/^(camera|image)\.\w+$/.test(config.map_entity)) throw Error("Select an image or camera for map_entity.");
    if (config.floor_plan && config.map_entity) throw Error("Choose either floor_plan or map_entity.");
    if (config.floor_plan && !Array.isArray(config.floor_plan.rooms)) throw Error("floor_plan requires a rooms list.");
    if (config.battery_entity && !/^sensor\.\w+$/.test(config.battery_entity)) throw Error("Select a sensor for battery_entity.");
    if (config.room_selection != null && typeof config.room_selection !== "boolean") throw Error("room_selection requires true or false.");
    if (config.entity !== this.config?.entity || config.room_selection !== this.config?.room_selection) this.selected.clear();
    this.config = { ...config };
    this.$(".notice").textContent = "";
    this.render();
  }

  get busy() { return this.pendingEntities.has(this.config?.entity); }
  set hass(hass) { this.h = hass; this.render(); }
  getCardSize() { return this.config?.map_entity || this.config?.floor_plan ? 6 : 3; }

  async updateMap() {
    const id = this.config.map_entity;
    const map = this.$(".map");
    if (id !== this.mapId) {
      this.mapId = id;
      this.mapCard = undefined;
      map.replaceChildren();
      this.mapRequest = {};
    }
    map.hidden = !id;
    if (!id) return;
    const source = this.h.states[id];
    if (!isAvailable(source)) {
      map.textContent = "Map source unavailable.";
      this.mapCard = undefined;
      this.mapRequest = {};
      return;
    }
    if (this.mapCard) { this.mapCard.hass = this.h; return; }
    if (this.mapRequest.pending) return;
    const request = this.mapRequest;
    request.pending = true;
    try {
      const helpers = await window.loadCardHelpers();
      if (this.mapRequest !== request) return;
      const card = helpers.createCardElement({
        type: "picture-entity", entity: id, show_state: false, show_name: false,
        ...(id.startsWith("camera.") ? {camera_image:id} : {}),
        tap_action: {action:"more-info"}, hold_action: {action:"none"}
      });
      card.hass = this.h;
      this.mapCard = card;
      map.replaceChildren(card);
    } catch {
      if (this.mapRequest === request) map.textContent = "Could not load the map source.";
    } finally { request.pending = false; }
  }

  render() {
    if (!this.h || !this.config) return;
    const v = this.h.states[this.config.entity];
    this.$("h2").textContent = this.config.name || v?.attributes.friendly_name || this.config.entity;
    const online = isHassConnected(this.h);
    const platform = this.h.entities?.[this.config.entity]?.platform;
    const wrongPlatform = platform && !["switchbot_cloud", "switchbot_vacuum"].includes(platform);
    const available = online && isAvailable(v) && !wrongPlatform;
    const parts = [!online ? "Home Assistant disconnected" : wrongPlatform ? "Choose a SwitchBot vacuum" :
      v ? this.h.formatEntityState?.(v) || v.state : "Entity unavailable"];
    const battery = this.config.battery_entity ? this.h.states[this.config.battery_entity]?.state : v?.attributes.battery_level;
    if (online && !wrongPlatform && battery != null && String(battery).trim() && Number.isFinite(Number(battery)) && Number(battery)>=0 && Number(battery)<=100) parts.push(battery + "% battery");
    this.$(".state").textContent = parts.join(" · ");
    const targets = getRoomTargets(this.h, this.config.entity, this.config.room_selection === true);
    const stale = [...this.selected].some(id => !targets.some(room => room.id === id));
    this.renderRooms(targets, available && stale);
    if (this.config.floor_plan) {
      const map = this.$(".map");
      if (this.planConfig !== this.config.floor_plan) {
        this.mapRequest = {};
        this.mapCard = this.mapId = undefined;
        this.planView = document.createElement("switchbot-floorplan-beta");
        this.planView.plan = this.config.floor_plan;
        this.planView.addEventListener("switchbot-room-tap", e => {
          const id = e.detail?.id;
          if (!this.busy && getRoomTargets(this.h, this.config.entity, this.config.room_selection === true).some(room => room.id === id)) this.toggleRoom(id);
        });
        this.planConfig = this.config.floor_plan;
        map.replaceChildren(this.planView);
      }
      map.hidden = false;
      this.planView.selectableRooms = targets.map(room => room.id);
      this.planView.selectedRooms = [...this.selected];
    } else {
      if (this.planView) { this.$(".map").replaceChildren(); this.planView = this.planConfig = undefined; }
      this.updateMap();
    }
    for (const b of this.$(".controls").children) {
      const service = b.dataset.service;
      const roomStart = service === "start" && this.selected.size > 0;
      b.hidden = !roomStart && (!((v?.attributes.supported_features || 0) & feature[service]) || !this.h.services?.vacuum?.[service]);
      if (service === "start" && v?.state === "cleaning") b.hidden = true;
      if (service === "pause" && v?.state !== "cleaning") b.hidden = true;
      b.disabled = !available || this.busy || (service === "start" && (stale || v.state === "error")) ||
        (service === "return_to_base" && ["docked","returning"].includes(v.state)) ||
        (service === "stop" && ["docked","idle"].includes(v.state));
      b.classList.toggle("primary", service === "start" || service === "pause");
      if (service === "start") {
        b.lastElementChild.textContent = v?.state === "paused" && !roomStart ? "Resume" : roomStart ? "Clean selected rooms" : "Start";
      }
    }
    const select = this.$("select");
    const speeds = Array.isArray(v?.attributes.fan_speed_list) ? v.attributes.fan_speed_list.filter(s=>typeof s==="string" && s.length) : [];
    if (JSON.stringify(speeds) !== this.speedKey) {
      select.replaceChildren(new Option("Choose power", ""), ...speeds.map(s => new Option(s,s)));
      select.options[0].disabled = true;
      this.speedKey = JSON.stringify(speeds);
    }
    select.value = speeds.includes(v?.attributes.fan_speed) ? v.attributes.fan_speed : "";
    select.disabled = !available || this.busy;
    this.$("label").hidden = !(v?.attributes.supported_features & feature.set_fan_speed) || !this.h.services?.vacuum?.set_fan_speed || !speeds.length;
  }

  toggleRoom(id) {
    if (id === "") this.selected.clear();
    else if (this.selected.has(id)) this.selected.delete(id);
    else this.selected.add(id);
    this.$(".notice").textContent = "";
    this.render();
  }

  renderRooms(targets, stale) {
    const box = this.$(".rooms");
    this.$("fieldset").hidden = !targets.length && !this.selected.size;
    const key = JSON.stringify(targets);
    if (this.roomsKey !== key) {
      box.replaceChildren();
      for (const room of [{id:"",name:"Whole home"}, ...targets]) {
        const b = document.createElement("button");
        b.type = "button";
        b.textContent = targets.some(other => other.id !== room.id && other.name === room.name) ? room.name + " · " + room.id : room.name;
        b.dataset.id = room.id;
        b.onclick = () => this.toggleRoom(room.id);
        box.append(b);
      }
      this.roomsKey = key;
    }
    for (const b of box.children) {
      b.setAttribute("aria-pressed",String(b.dataset.id ? this.selected.has(b.dataset.id) : !this.selected.size));
      b.disabled = !!this.busy;
    }
    const staleNotice = "Room list changed. Choose Whole home to clear your previous selection.";
    const notice = this.$(".notice");
    if (stale) notice.textContent = staleNotice;
    else if (notice.textContent === staleNotice) notice.textContent = "";
  }

  async run(service, value) {
    if (!this.h || !this.config || this.busy) return;
    // Re-evaluate cached state, services, target IDs and capabilities at dispatch time.
    this.render();
    const b = this.shadowRoot.querySelector(`[data-service="${service}"]`);
    const select = this.$("select");
    if (b ? b.disabled || b.hidden : service !== "set_fan_speed" || select.disabled || this.$("label").hidden) return;
    const id = this.config.entity;
    if (service === "set_fan_speed" && !this.h.states[id]?.attributes.fan_speed_list?.includes(value)) return;
    const sentConfig = this.config;
    this.pendingEntities.add(id);
    this.$(".notice").textContent = "";
    this.render();
    try {
      if (service === "start" && this.selected.size) {
        await startRoomCleaning(this.h, id, this.config.room_selection === true, [...this.selected]);
      } else {
        await this.h.callService("vacuum",service,service==="set_fan_speed"?{fan_speed:value}:{},{entity_id:id});
      }
    } catch (e) {
      if (sentConfig === this.config) this.$(".notice").textContent = e?.message || "The vacuum action failed.";
    } finally {
      this.pendingEntities.delete(id);
      this.render();
    }
  }
}

if (!customElements.get("switchbot-vacuum-card")) customElements.define("switchbot-vacuum-card", SwitchBotVacuumCard);
