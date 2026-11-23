// Map coordinates increase down the plan. Furniture angles increase the opposite way.
export function alignPoints(before, after) {
  const [a,b]=before,[c,d]=after;
  const dx=b[0]-a[0],dy=b[1]-a[1],u=d[0]-c[0],v=d[1]-c[1],den=dx*dx+dy*dy;
  if(den<1 || Math.hypot(u,v)<1)throw Error('Choose two distinct, widely separated landmarks on each map.');
  const cos=(dx*u+dy*v)/den,sin=(dx*v-dy*u)/den;
  const scale=Math.hypot(cos,sin);
  return {scale,angle:Math.atan2(sin,cos),
    point:([x,y])=>[c[0]+cos*(x-a[0])-sin*(y-a[1]),c[1]+sin*(x-a[0])+cos*(y-a[1])],
    inverse:([x,y])=>[a[0]+(cos*(x-c[0])+sin*(y-c[1]))/(scale*scale),a[1]+(-sin*(x-c[0])+cos*(y-c[1]))/(scale*scale)]
  };
}
const asPoint=({x,z})=>[x,z];
const objectAt=(t,p)=>{const [x,z]=t.point(asPoint(p));return {x,z};};
const lineAt=(t,l)=>[...t.point(l.slice(0,2)),...t.point(l.slice(2))];
function transformItems(furniture,t,units){
  return (furniture?.items || []).map(item=>{
    const [x,z]=t.point([item.x*units,item.z*units]);
    const size=n=>Math.round(n*t.scale);
    const result={...item,x:x/units,z:z/units,rotation:((item.rotation-t.angle*2/Math.PI)%4+4)%4,
      width:size(item.width),depth:size(item.depth),height:size(item.height??100)};
    if([result.width,result.depth,result.height].some(n=>n<50 || n>400))throw Error('This alignment scales a furnishing beyond its supported size. Check your landmarks.');
    return result;
  });
}
const rectPoints=([x,y,u,v])=>[[x,y],[u,y],[u,v],[x,v]];
function segmentError(a,b) {
  const d=(i,j)=>Math.hypot(a[i]-b[j],a[i+1]-b[j+1]);
  return Math.min(Math.max(d(0,0),d(2,2)),Math.max(d(0,2),d(2,0)));
}
function transformEcovacs(record,source,target,targetRef,t,notes) {
  const old=record.layout || {}, out={};
  if(old[source+':furniture'])out[target+':furniture']={version:1,items:transformItems(old[source+':furniture'],t,1)};
  const wallData=old[source+':walls'];
  if(wallData){
    const wall=w=>w.kind==='floor'?{...w,points:w.points.map(p=>objectAt(t,p))}:{...w,start:objectAt(t,w.start),end:objectAt(t,w.end)};
    const added=(wallData.added || []).map(wall),walls={};
    let id=1+Math.max(0,...added.map(w=>Number(w.id.split(':')[1])||0));
    for(const [key,edit] of Object.entries(wallData.walls || {})){
      const expected=lineAt(t,key.split(',').map(Number));
      const matches=(targetRef.segments || []).map(seg=>[seg,segmentError(expected,seg)]).filter(([,error])=>error<=1.5).sort((a,b)=>a[1]-b[1]);
      const match=matches.length && (!matches[1] || matches[1][1]-matches[0][1]>.5) && matches[0][0];
      const editAt=wall(edit),newKey=match && match.map(v=>v.toFixed(2)).join(',');
      if(newKey && !walls[newKey]) walls[newKey]=editAt;
      else if(!edit.hidden){added.push({...editAt,id:'added:'+id++,kind:'wall'});notes.detached++;}
      else notes.unmatched++;
    }
    out[target+':walls']={...wallData,walls,added};
  }
  const zones=(record.placement_bounds || []).map(rect=>{
    const points=rectPoints(rect).map(t.point);
    return [Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];
  });
  return {layout:out,placement_bounds:zones};
}

// Recover each saved source span as a rotated pixel rectangle and sample target
// cell centers. Keep sparse rows so separate brush marks stay separate.
function spansAt(rectangles,t,box) {
  const maxX=Math.ceil(box[2]/4)-1,maxY=Math.ceil(box[3]/4)-1,rows=new Map();
  for(const rect of rectangles){
    const points=rectPoints(rect).map(t.point);
    const y0=Math.max(0,Math.ceil(Math.min(...points.map(p=>p[1]))/4-.5-1e-8));
    const y1=Math.min(maxY,Math.floor(Math.max(...points.map(p=>p[1]))/4-.5+1e-8));
    for(let y=y0;y<=y1;y++){
      const line=4*y+2,xs=[];
      for(let i=0;i<4;i++){
        const [a,b]=points[i],[c,d]=points[(i+1)%4];
        if((line>=b)!==(line>=d))xs.push(a+(line-b)*(c-a)/(d-b));
      }
      if(xs.length<2)continue;
      const x=Math.max(0,Math.ceil((Math.min(...xs)-2)/4)),end=Math.min(maxX+1,Math.ceil((Math.max(...xs)-2)/4));
      if(end<=x)continue;
      if(!rows.has(y))rows.set(y,[]);
      rows.get(y).push([x,end]);
    }
  }
  const spans=[];
  for(const [y,runs] of [...rows].sort((a,b)=>a[0]-b[0])){
    let previous;
    for(const [x,end] of runs.sort((a,b)=>a[0]-b[0])){
      if(previous && x<=previous[0]+previous[2])previous[2]=Math.max(previous[2],end-previous[0]);
      else {previous=[x,y,end-x];spans.push(previous);}
    }
  }
  return spans;
}
export function recoverLayout(record,source,target,ref,t,raster) {
  const notes={unmatched:0,detached:0};
  if(!raster)return {record:transformEcovacs(record,source,target,ref,t,notes),notes};
  const plan=record.plan;
  const ops=plan.ops.map(op=>{
    if(op.spans){
      const rectangles=op.spans.map(([x,y,n])=>[4*x,4*y,4*(x+n),4*(y+1)]);
      const next={...op,room:'all',spans:spansAt(rectangles,t,ref.box)};
      if(op.from)next.from=lineAt(t,op.from);
      if(op.to)next.to=lineAt(t,op.to);
      return next;
    }
    if(op.kind==='wall')return {...op,points:lineAt(t,op.points),room:'all'};
    return {kind:'wall-edit',room:'all',to:null,spans:spansAt([op.points],t,ref.box)};
  });
  return {record:{plan:{version:1,anchor:ref.anchor,ops,finishes:plan.finishes?.all?{all:plan.finishes.all}:{},
    furniture:{version:1,items:transformItems(plan.furniture,t,4)}}},notes};
}
