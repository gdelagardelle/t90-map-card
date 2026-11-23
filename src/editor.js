import { parseT90Map } from './map.js';
import { locateRobot } from './roborock-marker.js';
import { readRoborockImage, getRoborockFloor } from './roborock-map.js';
import { available, downloadGuide, platformProfile, profileNames, setupFeatures, reportPanel, testReport } from './test-details.js';

const css = `
:host{display:block;color:var(--primary-text-color);font:inherit}
label{display:grid;gap:6px;margin:12px 0}select,button,textarea{font:inherit;color:inherit;background:var(--card-background-color);border:1px solid var(--divider-color,#888);border-radius:8px;padding:10px;max-width:100%}
select,textarea{width:100%;box-sizing:border-box}button,summary{cursor:pointer}summary{padding:12px 0}
img{display:block;width:100%;height:155px;object-fit:contain;background:var(--secondary-background-color);border-radius:8px}
[hidden]{display:none}ul{padding-left:20px}li{margin:4px 0}p{line-height:1.45}button{min-height:42px}.test-details{display:grid;gap:8px}
`;
function choose(label,name,options,value,change) {
  const row=document.createElement('label'), select=document.createElement('select');
  row.append(label,select); select.name=name;select.setAttribute('aria-label',label);
  for(const [id,text] of options) select.add(new Option(text,id));
  select.value=value || ''; select.onchange=()=>change(select.value); return row;
}
function registryMatch(h,vacuum,image) {
  const device=h.entities?.[vacuum]?.device_id, candidate=h.entities?.[image]?.device_id;
  if(!device || !candidate) return 'unknown';
  return device===candidate ? 'same' : 'other';
}
export class T90ConfigEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({mode:'open'}); }
  setConfig(value) { this.config={...value}; this.render(); }
  set hass(value) { this.h=value; this.render(); }
  connectedCallback() { this.signature=null; this.render(); }
  disconnectedCallback() { this.clearPreview(); }
  clearPreview() {
    this.request?.abort(); this.request=null;
    if(this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl=null; this.evidence={};
  }
  update(patch) {
    this.config={...this.config,...patch}; this.render();
    this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:{...this.config}},bubbles:true,composed:true}));
  }
  render() {
    const h=this.h, c=this.config;
    if(!this.isConnected || !h || !c) return;
    const keys=Object.keys(h.states).filter(k=>/^(vacuum|image)\./.test(k)).sort();
    const profiles=Object.entries(profileNames);
    const registry=h.entities || {};
    const selected=h.states[c.entity];
    const platform=registry[c.entity]?.platform, detected=platformProfile(platform);
    const unsupported=!!(platform && !detected);
    const same=id=>registryMatch(h,c.entity,id);
    const candidates=keys.filter(id=>id.startsWith('image.') && same(id)!=='other');
    if(c.map_entity && !candidates.includes(c.map_entity)) candidates.push(c.map_entity);
    const signature=JSON.stringify([c.entity,c.map_entity,c.map_source,platform,keys.map(k=>[k,registry[k]?.device_id,h.states[k]?.attributes.friendly_name,available(h.states[k])]),setupFeatures(h,c,this.evidence).Integration,
      Object.keys(selected?.attributes.rooms || {}).length]);
    if(this.signature===signature) return;
    this.signature=signature; this.clearPreview();
    const root=this.shadowRoot; root.replaceChildren(); const style=document.createElement('style');style.textContent=css;root.append(style);
    const choices=ids=>[['','Choose…'],...ids.map(id=>[id,h.states[id]?.attributes.friendly_name || id])];
    root.append(choose('Vacuum','entity',choices(keys.filter(id=>id.startsWith('vacuum.'))),c.entity,id=>{
      const deviceProfile=platformProfile(registry[id]?.platform);
      const images=keys.filter(k=>k.startsWith('image.') && registryMatch(h,id,k)==='same' && available(h.states[k]));
      this.update({entity:id,map_entity:images.length===1 && (!registry[id]?.platform || deviceProfile) ? images[0] : '',map_source:deviceProfile || 'ecovacs'});
    }));
    if(c.entity && !unsupported) {
      root.append(choose('Map format','map_source',profiles,c.map_source || 'ecovacs',value=>this.update({map_source:value})));
      root.append(choose('Map image','map_entity',choices(candidates),c.map_entity,id=>this.update({map_entity:id})));
    }
    const message=document.createElement('p');message.setAttribute('role','status');root.append(message);
    const img=document.createElement('img'); img.alt='Preview of the selected map image';img.hidden=true;root.append(img);
    const features=document.createElement('ul');root.append(features);
    const describe=()=>{
      const values=setupFeatures(this.h,this.config,this.evidence);
      features.replaceChildren(...['Robot position','Room cleaning','Mop settings'].map(key=>{
        const li=document.createElement('li'); li.textContent=key+' · '+values[key];return li;
      }));
    };
    if(!c.entity) message.textContent='Choose the vacuum you want to control.';
    else if(unsupported) {
      message.textContent='This integration uses a different tester module.';
      const link=document.createElement('a');link.textContent='Choose your robot’s download';link.href=downloadGuide;
      root.append(link);
    } else if(!c.map_entity || !available(h.states[c.map_entity])) {
      message.textContent=candidates.some(id=>same(id)==='same' && available(h.states[id])) && !c.map_entity ?
        'Choose the image for the floor you want to show.' :
        'In Settings → Devices & services, open your vacuum’s device and enable its map image. Then choose that image here.';
    } else if(same(c.map_entity)==='other') message.textContent='This map belongs to a different device. Choose a map from this vacuum.';
    else if(detected && detected!==(c.map_source || 'ecovacs')) message.textContent='Select the map format that matches this vacuum.';
    else {
      const retry=document.createElement('button');retry.type='button';retry.textContent='Check map again';root.append(retry);
      const check=async()=>{
        this.clearPreview(); const request=this.request=new AbortController();retry.disabled=true;img.hidden=true;img.removeAttribute('src');
        message.textContent='Checking the map…'; describe();
        const timer=setTimeout(()=>request.abort(),12000);
        try {
          const response=await h.fetchWithAuth('/api/image_proxy/'+c.map_entity,{signal:request.signal,cache:'no-store'});
          if(!response.ok) throw Error();
          let blob;
          if(c.map_source==='roborock_qrevo') blob=await readRoborockImage(response);
          else {
            const map=parseT90Map(await response.text());
            blob=new Blob([map.svg],{type:'image/svg+xml'});
            if(this.request===request) this.evidence.position=!!map.overlay.xy;
          }
          if(request.signal.aborted || this.request!==request) return;
          this.previewUrl=URL.createObjectURL(blob);img.src=this.previewUrl;await img.decode();
          if(request.signal.aborted || this.request!==request) return;
          img.hidden=false;this.evidence.map=true;
          message.textContent=same(c.map_entity)==='same' ? 'Map verified for this vacuum.' : 'Map format verified. Confirm this floor belongs to your vacuum.';
          if(c.map_source==='roborock_qrevo') {
            const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
            const context=canvas.getContext('2d');
            if(context) {context.drawImage(img,0,0); this.evidence.position=!!locateRobot(context.getImageData(0,0,canvas.width,canvas.height));}
          }
          if(c.map_source==='roborock_qrevo' && same(c.map_entity)==='same') {
            const floor=await getRoborockFloor(h,c.entity).catch(()=>null);
            if(this.request===request) this.evidence.rooms=!!floor?.rooms?.length;
          }
        } catch {
          if(this.request===request){this.evidence.map=false;message.textContent='Could not preview this map. Check the format and availability, then try again.';}
        } finally {
          clearTimeout(timer);
          if(this.request===request){retry.disabled=false;describe();}
        }
      };
      retry.onclick=check;void check();
    }
    if(c.entity && !unsupported) describe();
    root.append(reportPanel(()=>testReport(this.h,this.config,this.evidence,null)));
  }
}
if (!customElements.get('t90-map-editor')) customElements.define('t90-map-editor',T90ConfigEditor);
