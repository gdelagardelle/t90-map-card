// The label uses the last displayed map's timestamp. It never predicts position.
export function mapAgePin(viewer, projectRobot) {
  const label=document.createElement('span');
  label.className='map-age-pin';label.hidden=true;viewer.append(label);
  let showing=false;
  const update=()=>{
    if(!showing) return;
    const point=projectRobot();
    const w=viewer.clientWidth,h=viewer.clientHeight;
    if(!point || !Number.isFinite(point.x+point.y) || point.z < -1 || point.z > 1) {
      label.style.left='10px';label.style.top='10px';return;
    }
    const x=(point.x+1)*w/2, y=(1-point.y)*h/2;
    label.style.left=Math.max(6,Math.min(w-label.offsetWidth-6,x+12))+'px';
    label.style.top=Math.max(6,Math.min(h-label.offsetHeight-6,y+8))+'px';
  };
  window.t90SetMapAge=text=>{
    if(text===label.textContent)return;
    label.textContent=text;showing=!!text;label.hidden=!showing;
    viewer.toggleAttribute('data-map-delayed',showing);update();
  };
  return update;
}
