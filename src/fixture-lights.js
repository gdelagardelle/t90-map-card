// Only light entity names are offered to the picker. Only bound states are observed.
const lightId = /^light\.[a-z0-9_]+$/;
export const validLightId = id => typeof id === 'string' && lightId.test(id);
const clamp = (n,min,max) => Math.min(max,Math.max(min,n));
const hex = rgb => '#'+rgb.map(n=>Math.round(clamp(n,0,255)).toString(16).padStart(2,'0')).join('');

function temperature(kelvin) {
  const t=clamp(kelvin,1000,40000)/100;
  return hex([
    t<=66 ? 255 : 329.699*Math.pow(t-60,-0.1332),
    t<=66 ? 99.471*Math.log(t)-161.12 : 288.122*Math.pow(t-60,-0.07551),
    t>=66 ? 255 : t<=19 ? 0 : 138.518*Math.log(t-10)-305.045
  ]);
}

function color(attributes) {
  const {rgb_color:rgb,hs_color:hs,color_mode:mode}=attributes;
  const kelvin=Number.isFinite(attributes.color_temp_kelvin) ? attributes.color_temp_kelvin :
    Number.isFinite(attributes.color_temp) && attributes.color_temp>0 ? 1e6/attributes.color_temp : null;
  if(mode==='color_temp' && kelvin>0)return temperature(kelvin);
  if(Array.isArray(rgb) && rgb.length===3 && rgb.every(v=>Number.isFinite(v) && v>=0 && v<=255))return hex(rgb);
  if(Array.isArray(hs) && hs.length===2 && hs.every(Number.isFinite)){
    const h=((hs[0]%360)+360)%360/60,s=clamp(hs[1]/100,0,1);
    const channel=k=>255*(1-s*clamp(Math.min((k+h)%6,4-(k+h)%6),0,1));
    return hex([channel(5),channel(3),channel(1)]);
  }
  return kelvin>0 ? temperature(kelvin) : '#fff4df';
}

export function fixtureLightState(entity) {
  if(entity?.state!=='on')return {state:entity?.state==='off'?'off':'unavailable',level:0,color:'#b9bbba'};
  const a=entity.attributes || {};
  return {state:'on',level:Number.isFinite(a.brightness)?clamp(a.brightness,0,255)/255:1,color:color(a)};
}

export function createFixtureLights(getHass) {
  let previous=new Map(), notify;
  function read(id) {
    const hass=getHass();
    return fixtureLightState(hass?.connected===false?null:hass?.states?.[id]);
  }
  return {
    choices(){
      return Object.entries(getHass()?.states || {}).filter(([id])=>validLightId(id))
        .map(([id,entity])=>({id,name:entity.attributes?.friendly_name || id}))
        .sort((a,b)=>a.name.localeCompare(b.name)||a.id.localeCompare(b.id));
    },
    read,
    watch(ids,callback){
      const next=new Map();
      for(const id of ids)if(validLightId(id)&&!next.has(id))next.set(id,previous.get(id)||read(id));
      previous=next;notify=callback;
    },
    refresh(){
      const changes=new Set();
      for(const [id,old] of previous){
        const value=read(id);
        if(value.state===old.state && value.color===old.color && value.level===old.level)continue;
        previous.set(id,value);changes.add(id);
      }
      if(changes.size)notify?.(changes);
    }
  };
}
