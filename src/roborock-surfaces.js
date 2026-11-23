import { paintWallChange } from './roborock-wall-selection.js';
// Scan pixels and all editable coordinates share the native image origin.
export const finishes={marble:'#e8e4dc',wood:'#c39362',tile:'#d3cac0',solid:'#b8b4ab'};
export const defaultFinish={material:'marble',color:finishes.marble};
export const isWall = rgb => rgb===0x5d6d7e || rgb===0x64c4fe;
export const rgbAt = (data,i) => (data[i]<<16)|(data[i+1]<<8)|data[i+2];
// A four-by-four set of independently cut stone slabs avoids a repeating
// diagonal across the whole room. All materials share the same UV scale.
export const swatchSize=256;
const cache=new Map();
function stoneNoise(x,y) {
  function hash(a,b) {
    let n=Math.imul(a,374761393)+Math.imul(b,668265263);
    n=Math.imul(n^(n>>>13),1274126177);
    return ((n^(n>>>16))>>>0)/4294967296;
  }
  const ix=Math.floor(x),iy=Math.floor(y);
  let u=x-ix,v=y-iy;
  u=u*u*(3-2*u);v=v*v*(3-2*v);
  const top=hash(ix,iy)*(1-u)+hash(ix+1,iy)*u;
  const bottom=hash(ix,iy+1)*(1-u)+hash(ix+1,iy+1)*u;
  return top*(1-v)+bottom*v;
}
function stoneShade(x,y) {
  const slab=(x>>6)+4*(y>>6),u=x%64,v=y%64;
  const a=(slab%3===0?63-u:u)+slab*71,b=v+slab*39;
  const cloud=stoneNoise(a/29,b/29),fine=stoneNoise(a/7,b/7);
  const axis=a*.029+b*.041+cloud*1.65+fine*.19;
  const ridge=Math.abs(axis-Math.round(axis));
  const vein=Math.exp(-ridge*34)*(.045+.095*cloud);
  const grout=u===0 || v===0 ? .087 : 0;
  return .98+.046*(cloud-.5)+.014*(fine-.5)-vein-grout;
}
export function swatch({material,color}) {
  if (!Object.hasOwn(finishes,material) || !/^#[a-f0-9]{6}$/i.test(color)) return swatch(defaultFinish);
  const key=material+color;
  if(cache.has(key)) return cache.get(key);
  const base=parseInt(color.slice(1),16), out=new Uint8ClampedArray(swatchSize*swatchSize*4);
  for(let y=0;y<swatchSize;y++) for(let x=0;x<swatchSize;x++) {
    let shade=1;
    if(material==='wood') {
      const row=Math.floor(y/16),u=(x+row*37)%128,v=y%16;
      const grain=Math.sin(y*3.1+.85*Math.sin(x*Math.PI/64)+.33*Math.cos(x*Math.PI/16));
      shade=.94+.035*Math.sin(row*3.3)+.035*grain+.028*Math.sin(grain*6+v);
      if(!v || !u) shade*=.76;
    } else if(material==='marble') {
      shade=stoneShade(x,y);
    } else if(material==='tile') {
      shade=(x%32===0 || y%32===0) ? .75 : .98+.012*Math.cos((x+y)*Math.PI/8);
    }
    const i=4*(swatchSize*y+x);
    out[i]=(base>>16)*shade; out[i+1]=((base>>8)&255)*shade; out[i+2]=(base&255)*shade; out[i+3]=255;
  }
  if(cache.size>=24)cache.clear();
  cache.set(key,out);return out;
}

export function scanAnchor(pixels) {
  const {width,height,data}=pixels;
  const points=[];
  for(let y=2;y<height;y+=4) for(let x=2;x<width;x+=4) {
    const i=4*(width*y+x);
    if(data[i+3]===255 && isWall(rgbAt(data,i))) points.push(y*width+x);
  }
  const count=Math.min(256,points.length);
  return {width,height,points:Array.from({length:count},(_,i)=>points[Math.floor(i*points.length/count)])};
}

export function aligned(anchor,pixels) {
  if(!anchor || anchor.width!==pixels.width || anchor.height!==pixels.height || !anchor.points?.length) return false;
  let hits=0;
  for(const p of anchor.points) {
    const i=p*4;
    if(pixels.data[i+3]===255 && isWall(rgbAt(pixels.data,i))) hits++;
  }
  return hits/anchor.points.length>=.90;
}

export function editMask(ops,width,height) {
  const cv=document.createElement('canvas');
  cv.width=Math.ceil(width/4);cv.height=Math.ceil(height/4);
  const ctx=cv.getContext('2d',{willReadFrequently:true});
  ctx.scale(.25,.25); ctx.lineWidth=6;ctx.lineCap='round';
  for(const op of ops) {
    if(op.kind==='delete-floor'){
      ctx.fillStyle='#00ff00';
      for(const [col,row,length] of op.spans)ctx.fillRect(col*4,row*4,length*4,4);
      continue;
    }
    if(op.kind==='wall-edit'){paintWallChange(ctx,op);continue;}
    const [x,y,u,v]=op.points;
    if(op.kind==='wall') {
      ctx.strokeStyle='#ff0000';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(u,v);ctx.stroke();
    } else {
      ctx.fillStyle='rgb(0,'+(Number(op.room)||0)+',255)';
      ctx.fillRect(Math.min(x,u),Math.min(y,v),Math.max(4,Math.abs(u-x)),Math.max(4,Math.abs(v-y)));
    }
  }
  return ctx.getImageData(0,0,cv.width,cv.height);
}
