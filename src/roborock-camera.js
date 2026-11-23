// Fit the rendered footprint; native images may include large transparent corners.
export function floorPortrait(floor,walls,width,height) {
  const cols=Math.ceil(width/4);
  let count=0,xSum=0,zSum=0,xx=0,zz=0,xz=0;
  for(let i=0;i<floor.length;i++){
    if(!floor[i] && !walls[i])continue;
    const x=i%cols*4+2-width/2,z=Math.floor(i/cols)*4+2-height/2;
    count++;xSum+=x;zSum+=z;xx+=x*x;zz+=z*z;xz+=x*z;
  }
  const n=Math.max(1,count);
  const angle=.5*Math.atan2(2*(xz-xSum*zSum/n),xx-zz-(xSum*xSum-zSum*zSum)/n);
  const heading=-angle+.36,axis=Math.round(heading/(Math.PI/2))*Math.PI/2;
  const yaw=axis+(Math.sign(heading-axis)||1)*Math.max(.38,Math.abs(heading-axis));
  const cos=Math.cos(yaw),sin=Math.sin(yaw);
  const elevation=Math.PI*32/180,tilt=Math.sin(elevation),rise=Math.cos(elevation);
  let u0=Infinity,u1=-Infinity,v0=Infinity,v1=-Infinity;
  for(let i=0;i<floor.length;i++){
    if(!floor[i] && !walls[i])continue;
    const x=i%cols*4+2-width/2,z=Math.floor(i/cols)*4+2-height/2;
    const u=x*cos-z*sin,v=-(x*sin+z*cos)*tilt;
    u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,v);v1=Math.max(v1,v);
  }
  if(!count){u0=-width/2;u1=width/2;v0=-height/2;v1=height/2;}
  // Include the slab, modeled walls and furniture above the floor perimeter.
  v0-=9;v1+=65*rise;
  const u=(u0+u1)/2,depth=-(v0+v1)/(2*tilt);
  return {target:[u*cos+depth*sin,0,depth*cos-u*sin],direction:[sin*rise,tilt,cos*rise],
    width:u1-u0+8,height:v1-v0+8};
}
