import { isWall, rgbAt } from './roborock-surfaces.js';

// Roborock composites its solid route into the PNG. Recover the nearest
// visible map surface under the route for display only; preserve native hits.
export function withoutScanOverlays(pixels,roomPalette,{hideTrail,hideCarpet,marker}) {
  const {width,height,data}=pixels, size=width*height;
  const copy=new Uint8ClampedArray(data);
  const state=new Uint8Array(size);
  const queue=new Uint32Array(size);
  const neighbors=[-1,1,-width,width];
  const path=0x93c2ee,carpet=0xa9f7a9;
  const hidden=rgb=>(hideTrail && rgb===path) || (hideCarpet && rgb===carpet);
  let tail=0;
  function inside(p,step) {
    if(step===-1)return p%width!==0;
    if(step===1)return p%width!==width-1;
    return p+step>=0 && p+step<size;
  }
  function seed(i,overlay) {
    const rgb=rgbAt(data,i);
    // Carpet ink covers room pixels. A neighboring wall must never spread
    // into that floor; the recorded route can also cross the map boundary.
    if(overlay===carpet)return data[i+3]===255 && roomPalette.has(rgb);
    return data[i+3]===0 || roomPalette.has(rgb) || isWall(rgb) || (!hideCarpet && rgb===carpet) ||
      rgb===0xdfdfdf || rgb===0x2073b9 || rgb===0x135794;
  }
  function restore(p,from) {
    const i=p*4,j=from*4;
    copy[i]=copy[j];copy[i+1]=copy[j+1];copy[i+2]=copy[j+2];copy[i+3]=copy[j+3];
    state[p]=2;queue[tail++]=p;
  }
  for(let p=0;p<size;p++) {
    const i=p*4;
    const overlay=rgbAt(data,i);
    if(data[i+3]!==255)continue;
    if(!hidden(overlay)){
      if(!marker || (overlay!==0xffffff && overlay!==0 && overlay!==0x7f7f7f))continue;
      const x=p%width,y=Math.floor(p/width);
      if(x<marker.x0 || x>marker.x1 || y<marker.y0 || y>marker.y1 ||
        Math.hypot(x-marker.x,y-marker.y)>marker.radius+1)continue;
    }
    state[p]=1;
    for(const step of neighbors) {
      if(inside(p,step) && seed((p+step)*4,overlay)){restore(p,p+step);break;}
    }
  }
  for(let head=0;head<tail;head++) {
    const p=queue[head];
    for(const step of neighbors) {
      if(inside(p,step) && state[p+step]===1)restore(p+step,p);
    }
  }
  // A route surrounded entirely by markers has no recoverable surface.
  for(let p=0;p<size;p++) if(state[p]===1)copy[4*p+3]=0;
  return {data:copy,width,height};
}
