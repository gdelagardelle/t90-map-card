import { wallTransform } from './roborock-wall-selection.js';

export function setupWallTool({viewer,canvas,pick,locate,project,bounds,active,commit,removeButton,note}) {
  const ns='http://www.w3.org/2000/svg';
  const svg=document.createElementNS(ns,'svg'),shape=document.createElementNS(ns,'path');
  svg.setAttribute('aria-hidden','true');svg.classList.add('rr-wall-footprint');svg.append(shape);viewer.append(svg);
  const handles=['start','move','end'].map((part,i)=>{
    const b=document.createElement('button');b.type='button';b.className='rr-wall-handle';
    b.dataset.part=part;b.setAttribute('aria-label',['Drag first wall end','Drag wall to move','Drag second wall end'][i]);
    b.textContent=i===1?'✥':'';viewer.append(b);return b;
  });
  let selected=null,index=null,gesture=null;
  function draw() {
    const show=!!selected && active();
    svg.style.display=show?'block':'none';
    for(const h of handles)h.hidden=!show;
    removeButton.hidden=!show;
    if(!show)return;
    const {from,to}=selected;
    const [ox,oy]=project([0,0]),[ux,uy]=project([1,1]);
    const sx=ux-ox,sy=uy-oy;
    const pts=[to.slice(0,2),[(to[0]+to[2])/2,(to[1]+to[3])/2],to.slice(2)].map(project);
    shape.setAttribute('transform',`translate(${ox} ${oy}) scale(${sx} ${sy}) matrix(${wallTransform(from,to).join(' ')})`);
    // Separate end grips on short scan fragments so every action is tappable.
    let dx=pts[2][0]-pts[0][0],dy=pts[2][1]-pts[0][1];
    const len=Math.hypot(dx,dy)||1,offset=Math.max(0,(76-len)/2);
    dx=dx*offset/len;dy=dy*offset/len;
    pts[0][0]-=dx;pts[0][1]-=dy;pts[2][0]+=dx;pts[2][1]+=dy;
    handles.forEach((b,i)=>{b.style.left=pts[i][0]+'px';b.style.top=pts[i][1]+'px';});
  }
  function cancel() {
    if(gesture)selected.to=gesture.initial;
    gesture=null;draw();
  }
  function clear() {gesture=null;selected=null;index=null;draw();}
  function apply(to) {
    if(!selected)return;
    const result=commit({...selected,to},index);
    if(result==null){clear();return;}
    index=result;
    if(!to){clear();return;}
    selected.to=to;draw();
  }
  function start(e,part) {
    if(!active() || !e.isPrimary || e.button!==0 || gesture)return;
    const p=locate(e);
    if(!p && part==null)return;
    if(part==null) {
      selected=pick(p);index=null;
      if(!selected){clear();return;}
      shape.setAttribute('d',selected.spans.map(([x,y,n])=>`M${x*4} ${y*4}h${n*4}v4h-${n*4}Z`).join(''));
      part='move';
      note('Drag the middle to move this wall, or drag either end.');draw();
    }
    if(!selected)return;
    // Handles may extend beyond the image for short fragments.
    const a=project([0,0]),b=project([1,1]);
    gesture={id:e.pointerId,part,initial:[...selected.to],sx:b[0]-a[0],sy:b[1]-a[1],x:e.clientX,y:e.clientY};
    e.currentTarget.setPointerCapture(e.pointerId);e.preventDefault();e.currentTarget.focus({preventScroll:true});
  }
  function shiftEnds(start,part,dx,dy) {
    const [w,h]=bounds(),to=[...start];
    const ends=part==='start'?[0]:part==='end'?[2]:[0,2];
    const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
    dx=clamp(dx,-Math.min(...ends.map(i=>to[i])),w-Math.max(...ends.map(i=>to[i])));
    dy=clamp(dy,-Math.min(...ends.map(i=>to[i+1])),h-Math.max(...ends.map(i=>to[i+1])));
    for(const i of ends){to[i]+=dx;to[i+1]+=dy;}
    return to;
  }
  function move(e) {
    if(!gesture || gesture.id!==e.pointerId)return;
    const g=gesture,dx=(e.clientX-g.x)/g.sx,dy=(e.clientY-g.y)/g.sy;
    if(!g.moved && Math.hypot(e.clientX-g.x,e.clientY-g.y)<3)return;
    g.moved=true;
    const target=shiftEnds(g.initial,g.part,dx,dy);
    if(Math.hypot(target[0]-target[2],target[1]-target[3])<4)return;
    selected.to=target;draw();
  }
  function finish(e) {
    if(gesture?.id!==e.pointerId)return;
    move(e);
    const moved=gesture.moved;gesture=null;
    if(moved)apply([...selected.to]);
  }
  for(const el of [canvas,...handles]) {
    el.addEventListener('pointerdown',e=>start(e,el.dataset.part));
    el.addEventListener('pointermove',move);
    el.addEventListener('pointerup',finish);
    for(const type of ['pointercancel','lostpointercapture'])el.addEventListener(type,e=>{if(gesture?.id===e.pointerId)cancel();});
    el.addEventListener('keydown',e=>{
      if(!active() || !selected)return;
      if(['Delete','Backspace'].includes(e.key)){e.preventDefault();apply(null);}
      if(e.key==='Escape'){cancel();clear();}
      const delta={ArrowUp:[0,-4],ArrowDown:[0,4],ArrowLeft:[-4,0],ArrowRight:[4,0]}[e.key];
      if(!delta)return;
      e.preventDefault();const to=shiftEnds(selected.to,el.dataset.part,...delta);
      if(Math.hypot(to[0]-to[2],to[1]-to[3])>=4)apply(to);
    });
  }
  removeButton.onclick=()=>apply(null);
  new ResizeObserver(draw).observe(viewer);clear();
  return {clear,draw,cancel};
}
