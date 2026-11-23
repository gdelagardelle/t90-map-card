import scene from 'valetudo-scene';
import { convertMap, decodeMapCamera, readBounded } from './map.js';

function available(state) {
  return state && !['unknown','unavailable'].includes(state.state);
}

class ValetudoMapCard extends HTMLElement {
  constructor(){
    super();
    const root=this.attachShadow({mode:'open'});
    root.innerHTML='<style>:host{display:block}ha-card{display:block;overflow:hidden}.status{margin:0;padding:14px;color:var(--primary-text-color);font:inherit}.status:empty{display:none}iframe{display:block;border:0;width:100%;height:clamp(390px,58vh,620px)}[hidden]{display:none!important}</style><ha-card><p class="status" role="status"></p><div></div></ha-card>';
    this.message=root.querySelector('.status');
    this.slotBox=root.querySelector('div');
  }

  setConfig(config){
    if(!/^vacuum\.\w+$/.test(config.entity)||!/^camera\.\w+$/.test(config.map_entity)){
      throw Error('Set entity to your MQTT vacuum and map_entity to its Map data camera.');
    }
    const next={entity:config.entity,camera:config.map_entity,appearance:config.appearance==='night'?'night':'daylight'};
    if(this.config?.entity!==next.entity||this.config.camera!==next.camera)this.reset();
    this.config=next;
    this.frame?.contentWindow?.t90SetAppearance?.(next.appearance);
    this.check();
  }

  set hass(value){this.h=value;this.check();}
  getCardSize(){return 8;}
  connectedCallback(){
    this.timer=setInterval(()=>this.check(true),5000);
    this.check();
  }
  disconnectedCallback(){clearInterval(this.timer);this.reset();}

  reset(){
    this.request?.abort();
    this.request=null;this.source=null;this.previous=null;this.frame=null;this.sample=null;this.shape=null;
    this.slotBox.replaceChildren();
  }
  check(poll=false){
    if(!this.config||!this.isConnected||!this.h)return;
    const {entity,camera}=this.config,h=this.h;
    const v=h.entities?.[entity],c=h.entities?.[camera];
    if(h.connected===false || !available(h.states[entity]) || !available(h.states[camera]) ||
       !v?.device_id || v.device_id!==c?.device_id || v.platform!=='mqtt' || c.platform!=='mqtt'){
      if(this.source || this.request)this.reset();
      this.message.textContent=h.connected===false?'Home Assistant is disconnected.':'Choose an available MQTT vacuum and Map data camera on the same device.';
      return;
    }
    const source=v.device_id;
    const changed=this.source!==source;
    if(changed){this.reset();this.source=source;this.message.textContent='Loading the Valetudo map…';}
    if((changed||poll) && !this.request && !document.hidden)void this.load();
  }

  async load(){
    const controller=this.request=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),10000);
    try{
      const res=await this.h.fetchWithAuth('/api/camera_proxy/'+this.config.camera,{cache:'no-store',signal:controller.signal});
      if(!res.ok)throw Error('Map camera returned HTTP '+res.status+'.');
      const bytes=await readBounded(res.body);
      if(controller!==this.request)return;
      if(this.previous?.length===bytes.length&&bytes.every((v,i)=>v===this.previous[i])){
        this.message.textContent='';
        if(this.frame)this.frame.hidden=false;
        return;
      }
      const map=convertMap(await decodeMapCamera(bytes));
      if(controller!==this.request)return;
      this.previous=bytes;
      const v=this.h.states[this.config.entity];
      const received=Date.now();
      this.sample={...map.overlay,state:v.state,stateSince:v.last_changed,mapTime:received,received};
      if(this.shape!==map.geometryId){
        this.shape=map.geometryId;
        const frame=document.createElement('iframe');
        frame.title='Valetudo 3D floor map';
        frame.t90Map={scan:map.svg,scope:['valetudo',this.config.entity,this.config.camera,this.shape].join(':'),appearance:this.config.appearance};
        frame.addEventListener('load',()=>{
          if(this.frame===frame)frame.contentWindow?.deebotTrackingUpdate?.(this.sample);
        });
        this.frame=frame;frame.srcdoc=scene;this.slotBox.replaceChildren(frame);
      }else this.frame.contentWindow?.deebotTrackingUpdate?.(this.sample);
      this.frame.hidden=false;this.message.textContent='';
    }catch(error){
      if(controller!==this.request)return;
      if(this.frame)this.frame.hidden=true;
      this.message.textContent=controller.signal.aborted?'Map camera timed out.':(error.message || 'Could not read the Valetudo map.');
    }finally{
      clearTimeout(timeout);
      if(this.request===controller)this.request=null;
    }
  }
}
if(!customElements.get('valetudo-map-card'))customElements.define('valetudo-map-card',ValetudoMapCard);
