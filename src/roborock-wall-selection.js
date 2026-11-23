// Wall picking uses the same 4-pixel cells as the instanced renderer.
export function pickWall(grid,width,height,point,radius) {
  const at=(x,y)=>x>=0 && y>=0 && x<width && y<height && grid[y*width+x];
  const cx=point[0]/4-.5,cy=point[1]/4-.5;
  let sx,sy,best=(radius/4+.7)**2;
  const r=Math.ceil(radius/4+1);
  for(let y=Math.floor(cy)-r;y<=Math.ceil(cy)+r;y++) for(let x=Math.floor(cx)-r;x<=Math.ceil(cx)+r;x++) {
    const distance=(x-cx)**2+(y-cy)**2;
    if(distance<best && at(x,y)){best=distance;sx=x;sy=y;}
  }
  if(sx===undefined)return null;
  let axis;
  function reach(dx,dy,sign) {
    let n=0;
    while(at(Math.round(sx+(n+1)*dx*sign),Math.round(sy+(n+1)*dy*sign)))n++;
    return n;
  }
  for(let degrees=0;degrees<180;degrees++) {
    const angle=degrees*Math.PI/180,dx=Math.cos(angle),dy=Math.sin(angle);
    const left=reach(dx,dy,-1),right=reach(dx,dy,1);
    const score=(left+right+1)*(degrees%45===0?1.025:1);
    if(!axis || score>axis.score)axis={dx,dy,left,right,score};
  }
  const {dx,dy}=axis;
  let {left,right}=axis;
  // Estimate normal thickness along the band. A single T-junction should
  // not turn a whole perpendicular arm into part of the selected wall.
  const widths=[[],[]];
  for(let n=-left;n<=right;n++) {
    for(let side=0;side<2;side++) {
      const sign=side?1:-1;
      let t=0;
      while(t<12 && at(Math.round(sx+n*dx-(t+1)*dy*sign),Math.round(sy+n*dy+(t+1)*dx*sign)))t++;
      widths[side].push(t);
    }
  }
  const [lo,hi]=widths.map(values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)]);
  // A perpendicular arm extending beyond the typical thickness is a joint.
  // Leave the shared cells in place when picking either side of that joint.
  const branches=n=>widthsAt(n,-1,lo) || widthsAt(n,1,hi);
  function widthsAt(n,sign,edge) {
    for(let k=edge+1;k<=edge+3;k++) {
      if(!at(Math.round(sx+n*dx-k*dy*sign),Math.round(sy+n*dy+k*dx*sign)))return false;
    }
    return true;
  }
  if(!branches(0)){
    for(let n=1;n<=left;n++) if(branches(-n)){left=n-1;break;}
    for(let n=1;n<=right;n++) if(branches(n)){right=n-1;break;}
  }
  const mx=sx-dy*(hi-lo)/2,my=sy+dx*(hi-lo)/2;
  const from=[mx-(left+.5)*dx,my-(left+.5)*dy,mx+(right+.5)*dx,my+(right+.5)*dy].map(v=>(v+.5)*4);
  const spans=[];
  const margin=Math.max(lo,hi)+2;
  const minX=Math.max(0,Math.floor(Math.min(sx-left*dx,sx+right*dx)-margin));
  const maxX=Math.min(width-1,Math.ceil(Math.max(sx-left*dx,sx+right*dx)+margin));
  const minY=Math.max(0,Math.floor(Math.min(sy-left*dy,sy+right*dy)-margin));
  const maxY=Math.min(height-1,Math.ceil(Math.max(sy-left*dy,sy+right*dy)+margin));
  for(let y=minY;y<=maxY;y++) {
    let start=-1;
    for(let x=minX;x<=maxX+1;x++) {
      const u=(x-sx)*dx+(y-sy)*dy,v=-(x-sx)*dy+(y-sy)*dx;
      const belongs=x<=maxX && at(x,y) && u>=-left-.49 && u<=right+.49 && v>=-lo-.49 && v<=hi+.49;
      if(belongs && start<0)start=x;
      if(!belongs && start>=0){spans.push([start,y,x-start]);start=-1;}
    }
  }
  return {spans,from,to:[...from]};
}

// Transform the original cell footprint, including irregular scan marks,
// around the fixed end. Only the wall length scales; its thickness is kept.
export function wallTransform(from,to) {
  const [x,y,u,v]=from,[a,b,c,d]=to;
  const len=Math.hypot(u-x,v-y),newLen=Math.hypot(c-a,d-b);
  const ox=(u-x)/len,oy=(v-y)/len,nx=(c-a)/newLen,ny=(d-b)/newLen,k=newLen/len;
  const A=k*nx*ox+ny*oy,B=k*ny*ox-nx*oy,C=k*nx*oy-ny*ox,D=k*ny*oy+nx*ox;
  return [A,B,C,D,a-A*x-C*y,b-B*x-D*y];
}

export function paintWallChange(ctx,op) {
  function spans(color) {
    ctx.fillStyle=color;ctx.beginPath();
    for(const [x,y,n] of op.spans)ctx.rect(x*4,y*4,n*4,4);
    ctx.fill();
  }
  spans('rgb(0,'+(Number(op.room)||0)+',255)');
  if(!op.to)return;
  ctx.save();ctx.transform(...wallTransform(op.from,op.to));spans('#ff0000');ctx.restore();
}
