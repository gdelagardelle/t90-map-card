// The stock PNG icon has a white shell, a black rim and one offset gray button.
// Recognize the complete icon before replacing it; custom artwork stays visible.
export function locateRobot({width,height,data}){
  const rgb=i=>(data[i]<<16)|(data[i+1]<<8)|data[i+2];
  let first=-1,count=0,sumX=0,sumY=0;
  for(let i=0;i<data.length;i+=4){
    if(data[i]!==127 || data[i+1]!==127 || data[i+2]!==127 || data[i+3]!==255)continue;
    const pixel=i/4;
    if(first<0)first=pixel;
    count++;sumX+=pixel%width;sumY+=Math.floor(pixel/width);
  }
  if(count<2 || count>500)return null;
  const seen=new Set([first]),queue=[first];
  let white=0,black=0,gray=0,x0=width,x1=0,y0=height,y1=0;
  for(let head=0;head<queue.length;head++){
    const p=queue[head],x=p%width,y=Math.floor(p/width),c=rgb(p*4);
    if(c===0xffffff)white++;else if(c===0)black++;else gray++;
    x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
    if(x1-x0>128 || y1-y0>128)return null;
    for(let v=Math.max(0,y-1);v<=Math.min(height-1,y+1);v++)for(let u=Math.max(0,x-1);u<=Math.min(width-1,x+1);u++){
      const next=v*width+u,i=4*next;
      if(seen.has(next) || data[i+3]!==255)continue;
      const ink=rgb(i);
      if(ink===0 || ink===0xffffff || ink===0x7f7f7f){seen.add(next);queue.push(next);}
    }
  }
  const diameter=x1-x0+1,radius=(diameter-1)/2,x=(x0+x1)/2,y=(y0+y1)/2;
  const dx=sumX/count-x,dy=sumY/count-y,offset=Math.hypot(dx,dy)/radius;
  if(diameter<11 || Math.abs(diameter-(y1-y0+1))>2 || gray!==count ||
    white<.48*seen.size || black<.045*seen.size || offset<.38 || offset>.83 ||
    Math.abs(seen.size/(Math.PI*radius*radius)-1)>.20)return null;
  return {x,y,radius,heading:Math.atan2(dx,dy),x0,x1,y0,y1};
}
