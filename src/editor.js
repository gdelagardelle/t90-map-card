export class T90ConfigEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({mode:'open'}); }
  setConfig(value) { this.config = {...value}; this.render(); }
  set hass(value) { this.h = value; this.render(); }
  render() {
    if (!this.h || !this.config) return;
    const keys = Object.keys(this.h.states).filter(key => /^(vacuum|image|camera)\./.test(key)).sort();
    const signature = JSON.stringify([keys,this.config.entity,this.config.map_entity]);
    if (signature === this.signature) return;
    this.signature = signature;
    this.shadowRoot.replaceChildren();
    for (const [field,domain,label] of [['entity','vacuum','Vacuum'],['map_entity','map',__DREAME_TESTER__ ? 'Dreame live map camera' : 'Ecovacs map image']]) {
      const row = document.createElement('label'), select = document.createElement('select');
      row.style.cssText = 'display:grid;gap:6px;margin:12px 0';
      select.style.cssText = 'font:inherit;padding:10px;color:inherit;background:var(--card-background-color);';
      row.append(label,select);
      select.add(new Option('Choose an entity',''));
      for (const id of keys.filter(id => domain === 'map' ? (__DREAME_TESTER__ ? id.startsWith('camera.') : id.startsWith('image.')) : id.startsWith(domain+'.'))) {
        select.add(new Option((this.h.states[id].attributes.friendly_name || id)+' · '+id,id));
      }
      select.value = this.config[field] || '';
      select.onchange = () => {
        this.config = {...this.config,[field]:select.value};
        this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this.config},bubbles:true,composed:true}));
      };
      this.shadowRoot.append(row);
    }
  }
}
if (!customElements.get(__EDITOR_TYPE__)) customElements.define(__EDITOR_TYPE__,T90ConfigEditor);
