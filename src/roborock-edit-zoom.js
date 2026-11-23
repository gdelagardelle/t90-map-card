// Edit gestures belong to the tools; the editor camera accepts wheel, buttons
// and deliberate two-finger navigation without orbiting the plan.
export function setupEditZoom({viewer,nav,canvas,zoom,cancelEdits}) {
  const bar=document.createElement('div');bar.className='rr-edit-zoom';bar.hidden=true;
  bar.setAttribute('role','group');bar.setAttribute('aria-label','Edit zoom');
  const touches=new Map();
  let pinch=false,level=1;
  function apply(factor,from,to=from) {
    level=zoom(factor,from,to);
    out.disabled=level<=.5;plus.disabled=level>=10;
    fit.textContent=Math.round(level*100)+'%';
  }
  function button(text,label,action) {
    const b=document.createElement('button');b.type='button';b.textContent=text;
    b.setAttribute('aria-label',label);b.title=label;b.onclick=action;bar.append(b);return b;
  }
  const out=button('−','Zoom out',()=>apply(1/1.35));
  const fit=button('100%','Fit map',()=>apply(null));
  const plus=button('+','Zoom in',()=>apply(1.35));
  nav.after(bar);
  viewer.addEventListener('wheel',e=>{
    if(bar.hidden || !(e.target===canvas || e.target.closest('.rr-wall-handle')))return;
    e.preventDefault();
    if(e.buttons || pinch)return;
    const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?viewer.clientHeight:1);
    apply(Math.exp(-Math.max(-400,Math.min(400,delta))*.002),[e.clientX,e.clientY]);
  },{passive:false,capture:true});
  function geometry() {
    const [a,b]=touches.values();
    return {center:[(a[0]+b[0])/2,(a[1]+b[1])/2],distance:Math.hypot(a[0]-b[0],a[1]-b[1])};
  }
  function block(e){e.preventDefault();e.stopImmediatePropagation();}
  viewer.addEventListener('pointerdown',e=>{
    if(bar.hidden || e.pointerType!=='touch' || e.target.closest('button,select,input') && !e.target.classList.contains('rr-wall-handle'))return;
    touches.set(e.pointerId,[e.clientX,e.clientY]);
    if(touches.size<2 && !pinch)return;
    pinch=true;cancelEdits();
    for(const id of touches.keys())viewer.setPointerCapture(id);
    block(e);
  },true);
  viewer.addEventListener('pointermove',e=>{
    if(!touches.has(e.pointerId))return;
    const before=touches.size===2?geometry():null;
    touches.set(e.pointerId,[e.clientX,e.clientY]);
    if(!pinch)return;
    if(before && before.distance>1) {
      const after=geometry();
      apply(after.distance/before.distance,before.center,after.center);
    }
    block(e);
  },true);
  for(const type of ['pointerup','pointercancel'])viewer.addEventListener(type,e=>{
    if(!touches.delete(e.pointerId))return;
    if(pinch){block(e);if(!touches.size)pinch=false;}
  },true);
  return {visible(active){touches.clear();pinch=false;bar.hidden=!active;if(active)apply(1);}};
}
