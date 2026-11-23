// Stock PNGs contain ink but no timestamps. Preserve first appearance across
// frames. Within one arrival, estimate travel order along connected ink toward
// the robot. Never connect separated marks through a wall or unscanned floor.
const isInk=(d,i)=>d[i+3]===255 && d[i]===147 && d[i+1]===194 && d[i+2]===238;
export class RasterRoute {
  constructor(width,height,baseline) {
    this.width=width;this.height=height;this.end=0;this.count=0;
    const n=width*height;
    this.ranks=new Uint32Array(n);
    this.rgba=new Uint8Array(n*4);
    if(baseline)for(let p=0;p<n;p++)if(isInk(baseline,4*p))this.ranks[p]=0xffffffff;
  }
  update(data,robot) {
    const {width:w,height:h,ranks,rgba}=this,n=w*h;
    const fresh=new Uint8Array(n),pending=[];
    this.count=0;
    for(let p=0;p<n;p++){
      if(!isInk(data,p*4)){ranks[p]=0;rgba[4*p+3]=0;continue;}
      if(ranks[p]===0xffffffff)continue;
      this.count++;
      if(!ranks[p]){fresh[p]=1;pending.push(p);}
    }
    if(!pending.length)return;
    const neighbors=(p,visit)=>{
      const x=p%w,y=Math.floor(p/w);
      for(let v=Math.max(0,y-1);v<=Math.min(h-1,y+1);v++)
        for(let u=Math.max(0,x-1);u<=Math.min(w-1,x+1);u++){
          const k=v*w+u;if(fresh[k])visit(k);
        }
    };
    // Partition new ink. In a snapshot, the nearest visible end to the
    // current robot position is the best available estimate of the latest end.
    const groups=[];
    for(const p of pending){
      if(fresh[p]!==1)continue;
      const cells=[p];fresh[p]=2;
      let tip=p,near=Infinity;
      for(let i=0;i<cells.length;i++){
        const k=cells[i],dist=robot?(k%w-robot.x)**2+(Math.floor(k/w)-robot.y)**2:0;
        if(dist<near){tip=k;near=dist;}
        neighbors(k,j=>{if(fresh[j]===1){fresh[j]=2;cells.push(j);}});
      }
      groups.push({tip,near});
    }
    groups.sort((a,b)=>b.near-a.near);
    for(const {tip} of groups){
      const cells=[tip],levels=[0];fresh[tip]=0;
      for(let i=0;i<cells.length;i++)neighbors(cells[i],k=>{
        fresh[k]=0;cells.push(k);levels.push(levels[i]+1);
      });
      const last=this.end+1+levels.at(-1);
      for(let i=0;i<cells.length;i++){
        const p=cells[i],k=4*p,rank=last-levels[i];
        ranks[p]=rank;rgba[k]=rank>>>16;rgba[k+1]=rank>>>8;rgba[k+2]=rank;rgba[k+3]=255;
      }
      this.end=last;
    }
  }
}
