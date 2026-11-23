export class T90ConfigEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({mode:'open'}); }
  setConfig(value) { this.config = {...value}; this.render(); }
  set hass(value) { this.h = value; this.render(); }
  render() {
    if (!this.h || !this.config) return;
    const keys = Object.keys(this.h.states).filter(key => /^(vacuum|image)\./.test(key)).sort();
    const signature = JSON.stringify([keys,this.config.map_source,this.config.entity,this.config.map_entity]);
    if (signature === this.signature) return;
    this.signature = signature;
    this.shadowRoot.replaceChildren();
    const profile=document.createElement('label'), chooser=document.createElement('select');
    profile.style.cssText='display:grid;gap:6px;margin:12px 0';
    chooser.style.cssText='font:inherit;padding:10px;color:inherit;background:var(--card-background-color)';
    chooser.add(new Option('Ecovacs T90','ecovacs'));
    chooser.add(new Option('Roborock Qrevo (stock map colors)','roborock_qrevo'));
    chooser.value=this.config.map_source || 'ecovacs';
    chooser.onchange=()=>{
      this.config={...this.config,map_source:chooser.value};
      this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this.config},bubbles:true,composed:true}));
    };
    profile.append('Map source',chooser);this.shadowRoot.append(profile);
    for (const [field,domain,label] of [['entity','vacuum','Vacuum'],['map_entity','image','Map image']]) {
      const row = document.createElement('label'), select = document.createElement('select');
      row.style.cssText = 'display:grid;gap:6px;margin:12px 0';
      select.style.cssText = 'font:inherit;padding:10px;color:inherit;background:var(--card-background-color);';
      row.append(label,select);
      select.add(new Option('Choose an entity',''));
      for (const id of keys.filter(id => id.startsWith(domain+'.'))) {
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
if (!customElements.get('t90-map-editor')) customElements.define('t90-map-editor',T90ConfigEditor);
