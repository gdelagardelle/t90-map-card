import * as THREE from 'three';

// Keep the original coordinate system and every pen lift. Only consecutive
// duplicate points and points exactly on the same straight run are redundant.
export const MAX_ROUTE_POINTS=6000, MAX_ROUTE_SEGMENTS=1000;
export function compactSubpath(points) {
  const result=[];
  for(const point of points) {
    const [x,z]=point, b=result.at(-1), a=result.at(-2);
    if(!Number.isFinite(x)||!Number.isFinite(z))throw Error('Invalid path coordinate');
    if(b && x===b[0] && z===b[1])continue;
    if(a && (b[0]-a[0])*(z-b[1])===(b[1]-a[1])*(x-b[0]) &&
      (b[0]-a[0])*(x-b[0])+(b[1]-a[1])*(z-b[1])>0)result.pop();
    result.push([x,z]);
  }
  return result;
}
export function boundedSubpaths(paths) {
  let remaining=MAX_ROUTE_POINTS;
  const result=[];
  for(const path of paths){
    if(remaining<2 || result.length>=MAX_ROUTE_SEGMENTS)break;
    const line=compactSubpath(path).slice(0,remaining);
    if(line.length>=2){result.push(line);remaining-=line.length;}
  }
  return result;
}

// A pair of triangles per original edge. Disconnected strokes never share
// vertices. 'travel' accumulates only distance actually present on the map.
export function ribbonGeometry(segments, width) {
  if(!Array.isArray(segments)||segments.length>MAX_ROUTE_SEGMENTS)return null;
  const positions=[],side=[],travel=[];
  let length=0, count=0;
  for(const line of segments) {
    if(!Array.isArray(line)||line.length<2||(count+=line.length)>MAX_ROUTE_POINTS)return null;
    let prev=null;
    for(const point of line) {
      if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite))return null;
      if(prev){
        const [x,z]=prev, [u,v]=point, dx=u-x,dz=v-z, distance=Math.hypot(dx,dz);
        if(distance>0){
          const ox=-dz*width/(2*distance),oz=dx*width/(2*distance);
          for(const [atEnd,sign] of [[false,-1],[false,1],[true,1],[false,-1],[true,1],[true,-1]]) {
            positions.push((atEnd?u:x)+sign*ox,0,(atEnd?v:z)+sign*oz);
            side.push(sign);travel.push(atEnd?length+distance:length);
          }
          length+=distance;
        }
      }
      prev=point;
    }
  }
  if(!length || !Number.isFinite(length))return null;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('edge',new THREE.Float32BufferAttribute(side,1));
  geometry.setAttribute('along',new THREE.Float32BufferAttribute(travel.map(t=>t/length),1));
  return geometry;
}

export function installHistoryReplay({host,viewer,parent,width,lift,compatible,available,offset,draw,changed}) {
  const progress={value:0},reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,
    side:THREE.DoubleSide,toneMapped:false,uniforms:{progress},
    vertexShader:`attribute float along,edge;varying float t,e;
      void main(){t=along;e=edge;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform float progress;varying float t,e;
      void main(){
        if(t>progress)discard;
        float ribbon=1.-smoothstep(.08,1.,abs(e));
        float core=1.-smoothstep(.03,.33,abs(e));
        float head=1.-smoothstep(0.,.12,progress-t);
        vec3 color=mix(vec3(.015,.53,.57),vec3(.86,1.,1.),core*(.32+.68*head));
        gl_FragColor=vec4(color,ribbon*(.43+.44*core+.13*head));
        #include <colorspace_fragment>
      }`});
  let mesh=null, timer=null, elapsed=0, last=0, visible=true, selected=null;
  const duration=6500;
  function stop(){
    if(!mesh)return;
    clearTimeout(timer);parent.remove(mesh);mesh.geometry.dispose();mesh=null;selected=null;
    document.documentElement.classList.remove('history-replay');
    viewer.dataset.historyReplay='off';changed(false);draw();
    host.onHistoryPlayback?.(false);
  }
  function frame(){
    clearTimeout(timer);
    if(!mesh)return;
    if(!available()){stop();return;}
    if(!visible||document.hidden){last=0;return;}
    const now=performance.now();
    if(last)elapsed+=Math.max(0,now-last);
    last=now;
    progress.value=reduced.matches?1:Math.min(1,elapsed/(duration-750));
    viewer.dataset.historyReplay=reduced.matches?'still':'playing';
    draw();
    if(elapsed>=duration){stop();return;}
    timer=setTimeout(frame,reduced.matches?Math.max(20,duration-elapsed):40);
  }
  const observe=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;frame();});
  observe.observe(viewer);
  reduced.addEventListener('change',frame);
  document.addEventListener('visibilitychange',frame);
  window.t90StopHistoryReplay=stop;
  window.t90ReplayHistory=snapshot=>{
    if(!snapshot || snapshot.scope!==host.scope || !available() || !compatible(snapshot))return false;
    const geometry=ribbonGeometry(snapshot.segments,width);
    if(!geometry)return false;
    stop();
    mesh=new THREE.Mesh(geometry,material);mesh.renderOrder=4;
    const [x,z]=offset();mesh.position.set(x,lift,z);parent.add(mesh);
    selected=snapshot;elapsed=last=0;progress.value=reduced.matches?1:0;
    document.documentElement.classList.add('history-replay');
    changed(true);host.onHistoryPlayback?.(true);frame();
    return true;
  };
  window.addEventListener('pagehide',()=>{stop();observe.disconnect();material.dispose();},{once:true});
  return { stop, get active(){return !!mesh;}, validate(){
    if(selected && (!available() || !compatible(selected)))stop();
  }};
}
