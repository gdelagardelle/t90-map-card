// Work on the same four-pixel wall cells as the renderer. Each stroke
// remembers only the occupied cells it actually touched, including on a tap.
export function brushStroke({cells,width,height},diameter) {
  const erased=new Set(),radius=diameter/2;
  let previous=null;
  return {
    add(point) {
      if(!point){previous=null;return false;}
      const [x,y]=point,[u,v]=previous || point;
      previous=point;
      const dx=x-u,dy=y-v,length=dx*dx+dy*dy,old=erased.size;
      const x0=Math.max(0,Math.floor((Math.min(x,u)-radius)/4));
      const x1=Math.min(width-1,Math.floor((Math.max(x,u)+radius)/4));
      const y0=Math.max(0,Math.floor((Math.min(y,v)-radius)/4));
      const y1=Math.min(height-1,Math.floor((Math.max(y,v)+radius)/4));
      for(let row=y0;row<=y1;row++) for(let col=x0;col<=x1;col++) {
        const index=row*width+col;
        if(!cells[index] || erased.has(index))continue;
        const px=col*4+2-u,py=row*4+2-v;
        const t=length?Math.min(1,Math.max(0,(px*dx+py*dy)/length)):0;
        if((px-t*dx)**2+(py-t*dy)**2<=radius**2)erased.add(index);
      }
      return erased.size!==old;
    },
    spans() {
      const spans=[];
      for(const index of [...erased].sort((a,b)=>a-b)) {
        const y=Math.floor(index/width),x=index%width,last=spans.at(-1);
        if(last && last[1]===y && last[0]+last[2]===x)last[2]++;
        else spans.push([x,y,1]);
      }
      return spans;
    }
  };
}

export function setupEraseBrush({viewer,canvas,locate,project,grid,size,active,tool,room,preview,commit,note}) {
  const ring=document.createElement('div');
  ring.className='rr-brush-ring';ring.hidden=true;viewer.append(ring);
  let stroke=null,id=null,timer,last=null,previewed=false;
  function operation() {
    if(tool()==='delete-floor')return {kind:'delete-floor',spans:stroke.spans()};
    return {kind:'wall-edit',to:null,spans:stroke.spans(),room:room()};
  }
  function cursor(point) {
    last=point;
    ring.hidden=!point || !active();
    if(ring.hidden)return;
    const [x,y]=project(point),[edge]=project([point[0]+Number(size.value),point[1]]);
    const diameter=Math.abs(edge-x);
    Object.assign(ring.style,{left:x+'px',top:y+'px',width:diameter+'px',height:diameter+'px'});
  }
  function reset() {
    clearTimeout(timer);timer=null;stroke=null;id=null;previewed=false;cursor(null);
  }
  function cancel() {
    const restore=previewed;reset();if(restore)preview();
  }
  function sample(e) {
    const p=locate(e);cursor(p);
    if(!stroke.add(p) || timer!=null)return;
    timer=setTimeout(()=>{timer=null;previewed=true;preview(operation());},80);
  }
  canvas.addEventListener('pointerdown',e=>{
    if(!active() || !e.isPrimary || e.button!==0 || stroke || !locate(e))return;
    stroke=brushStroke(grid(tool()),Number(size.value));id=e.pointerId;
    canvas.setPointerCapture(id);sample(e);e.preventDefault();
  });
  canvas.addEventListener('pointermove',e=>{
    if(stroke && id===e.pointerId)sample(e);
    else if(active() && !stroke)cursor(locate(e));
  });
  canvas.addEventListener('pointerup',e=>{
    if(!stroke || id!==e.pointerId)return;
    sample(e);
    const op=operation();reset();
    if(op.spans.length)commit(op);
    else note(tool()==='delete-floor'?'No floor under this stroke.':'No raised scan marks under this stroke.');
    if(e.pointerType==='mouse')cursor(locate(e));
  });
  for(const type of ['lostpointercapture','pointercancel'])canvas.addEventListener(type,e=>{
    if(id===e.pointerId)cancel();
  });
  canvas.addEventListener('pointerleave',()=>cursor(null));
  size.addEventListener('input',()=>cursor(last));
  return {cancel,redraw:()=>cursor(last)};
}
