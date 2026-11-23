import { locateRobot } from './roborock-marker.js';
import { qrevoModel,qrevoPortrait,addLocator } from './roborock-robot.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { floorPortrait } from './roborock-camera.js';
import { setupEditZoom } from './roborock-edit-zoom.js';
import { pickWall } from './roborock-wall-selection.js';
import { withoutScanOverlays } from './roborock-trail.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { setupFurnishings } from './ecovacs-furnishings.js';
import { setupPlanEditor } from './roborock-plan-editor.js';
import { defaultFinish, editMask, isWall, rgbAt, swatch, swatchSize } from './roborock-surfaces.js';
import { roomColors } from './roborock-map.js';

const host = window.frameElement.t90Map;
const viewer = document.querySelector('.viewer');
const tools=document.querySelector('.tools');
const furnishingButton=tools.querySelector('[data-furnishing=edit]');
for(const selector of ['[data-wall=edit]','#layout-lock','.dock-pin','.notice','#wall-editor']) document.querySelector(selector)?.remove();
const routeButton=tools.querySelector('[data-view=route]');
const carpetButton=document.createElement('button');
carpetButton.type='button';carpetButton.textContent='Carpet scan';routeButton.after(carpetButton);
let robot,marker;
let cleanPixels=null,wallCells,floorCells,slab;
let rebuildSlab=true;
let contact;
const stockPalette=roomColors(Array.from({length:32},(_,i)=>({id:i+1})));
function overlayControl(button,key) {
  let shown=false;
  try{shown=localStorage.getItem(host.scope+key)==='true';}catch{}
  button.setAttribute('aria-pressed',String(shown));
  button.onclick=()=>{
    shown=!shown;button.setAttribute('aria-pressed',String(shown));
    try{localStorage.setItem(host.scope+key,String(shown));}catch{}
    cleanPixels=null;rebuildSlab=true;recolor();
  };
  return ()=>shown;
}
const showTrail=overlayControl(routeButton,':show-cleaning-path');
const showCarpet=overlayControl(carpetButton,':show-carpet');

const css=document.createElement('style');
css.textContent=`
.device > .rr-plan:not([hidden]) {display:flex;flex-wrap:wrap;align-items:end;gap:8px 12px;padding:10px 0}
.rr-plan label{display:grid;gap:4px;color:var(--dim);font-size:12px}
.rr-plan input,.rr-plan select{height:36px;min-width:56px}
.rr-status{font-size:13px;margin:4px 0;color:var(--dim)}
.rr-status:empty{display:none}
.rr-guide{position:absolute;z-index:3;pointer-events:none;border:2px solid var(--accent);background:color-mix(in srgb,var(--accent) 25%,transparent);transform-origin:0 50%}
.rr-plan[hidden],.rr-guide[hidden],.viewer img[hidden]{display:none!important}
.rr-wall-footprint{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:4;fill:#ffba58;stroke:#613615;stroke-width:1px}
button.rr-wall-handle{position:absolute;z-index:5;transform:translate(-50%,-50%);touch-action:none;min-width:28px;min-height:28px;width:28px;height:28px;padding:0;border:2px solid #77431a;border-radius:50%;background:#ffe2a9;color:#31200e;cursor:grab}
.rr-wall-handle[hidden]{display:none!important}
.rr-brush-ring{position:absolute;z-index:5;pointer-events:none;transform:translate(-50%,-50%);border:2px solid white;box-shadow:0 0 0 1px #593b22,inset 0 0 0 1px #593b22;border-radius:50%;background:#f2983826;box-sizing:border-box}
.rr-edit-zoom{display:flex;align-items:center;gap:4px}.rr-edit-zoom button{min-width:40px;min-height:36px}
.rr-brush-ring[hidden],.rr-edit-zoom[hidden],.brush-size[hidden],.rr-erase[hidden]{display:none!important}
.stage .viewer[data-camera=floor]{background:radial-gradient(ellipse at 24% 12%,#b8ada1 0%,#8b8884 48%,#53585d 100%);border-radius:14px}
:root[data-appearance=night] .stage .viewer[data-camera=floor]{background:radial-gradient(ellipse at 68% 20%,#303b4c 0%,#161f2c 56%,#0b1018 100%)}
.rr-native{position:absolute;inset:0;z-index:2}
`;document.head.append(css);
document.querySelector('footer').remove();
const nav = document.querySelector('nav');
nav.querySelector('[data-camera=follow]').remove();
nav.querySelector('[data-camera=dock]').remove();
const native = document.createElement('img');
native.alt = 'Native Roborock map with the robot and its recorded path';
native.style.cssText='width:100%;height:100%;object-fit:contain';
native.className='rr-native';native.hidden=true;
viewer.append(native);
const status = document.querySelector('.feed-label');
let renderer,camera,orbit,scene,surface,walls,light,sky,rim,windowLight,ground,portrait;
const practicals=[];
const studioLevel={value:0},studioScale={value:1};
function polishFloor(shader){
  shader.uniforms.studioLevel=studioLevel;shader.uniforms.studioScale=studioScale;
  shader.vertexShader='varying vec2 studioFloor;\n'+shader.vertexShader.replace('#include <project_vertex>',
    '#include <project_vertex>\n studioFloor=(modelMatrix*vec4(transformed,1.)).xz;');
  shader.fragmentShader='varying vec2 studioFloor;uniform float studioLevel,studioScale;\n'+
    shader.fragmentShader.replace('#include <lights_fragment_end>',`#include <lights_fragment_end>
      // A broad studio panel reflected by the polished stone. Evaluate its
      // footprint in world space, so the highlight moves as the user orbits.
      vec3 eye=transformDirectionByInverseViewMatrix(geometryViewDir,viewMatrix);
      vec2 reflected=studioFloor/studioScale-eye.xz*.42/max(.12,eye.y);
      vec2 panel=abs(reflected-vec2(-.32,-.55))-vec2(.67,.16);
      float edge=max(panel.x,panel.y);
      float sheen=(1.-smoothstep(-.12,.23+roughnessFactor*.32,edge))*pow(1.-roughnessFactor,3.);
      reflectedLight.indirectSpecular+=studioLevel*sheen*vec3(1.,.88,.72);`);
}
let pixels, texture, colors = new Map(), selection = new Set(), topView=false;
let planner, editZoom, furniture, model, mask, originalURL, nativeBlob, editingFurniture=false;
let currentBlob, pendingBlob, generation=0, bitmap;
const paint = document.createElement('canvas');
const ctx = paint.getContext('2d',{willReadFrequently:true});
const wallMaterial = new THREE.MeshStandardMaterial({vertexColors:true,roughness:.79});
const wallShape = new THREE.BoxGeometry(1,1,1);
const wallTints=[];
for(let i=0;i<wallShape.attributes.normal.count;i++){
  const tint=new THREE.Color(wallShape.attributes.normal.getY(i)>.5?0xfff2dd:0xb6a99c);
  if(wallShape.attributes.position.getY(i)<0)tint.multiplyScalar(.47);
  wallTints.push(tint.r,tint.g,tint.b);
}
wallShape.setAttribute('color',new THREE.Float32BufferAttribute(wallTints,3));
const transform = new THREE.Object3D();
const ray = new THREE.Raycaster();
const draw = () => { if (renderer && surface) renderer.render(scene,camera); };
function frame() {
  if (!surface) return;
  const extent=Math.max(paint.width,paint.height), ratio=viewer.clientWidth/Math.max(1,viewer.clientHeight);
  const span=topView || !portrait ? Math.max(paint.height,paint.width/ratio)*.64 :
    Math.max(portrait.height,portrait.width/ratio)*.56;
  camera.left=-span*ratio; camera.right=span*ratio; camera.top=span; camera.bottom=-span;
  camera.far=extent*8; camera.updateProjectionMatrix();
  renderer.setSize(viewer.clientWidth,viewer.clientHeight,false);
  planner?.refreshHandles();furniture?.refreshHandles();draw();
}
function view(top) {
  topView=top;
  if (!surface) return;
  const extent=Math.max(paint.width,paint.height);
  viewer.dataset.camera=top?'top':'floor';
  if(top){
    orbit.target.set(0,0,0);camera.position.set(0,extent*2,.01);
  }else{
    portrait=floorPortrait(floorCells,wallCells,paint.width,paint.height);
    orbit.target.fromArray(portrait.target);
    camera.position.fromArray(portrait.direction).multiplyScalar(extent*2).add(orbit.target);
  }
  camera.zoom=1;orbit.update();setSceneLight();frame();
  for (const b of nav.querySelectorAll('[data-camera]')) b.setAttribute('aria-pressed',String((b.dataset.camera==='top')===top));
}
function deletedAt(x,y) {
  if(!mask)return false;
  const i=4*((y>>2)*mask.width+(x>>2)),d=mask.data;
  return d[i+3]>90 && d[i+1]>d[i] && d[i+1]>d[i+2];
}
function recolor() {
  if (!pixels || !texture) return;
  if(!cleanPixels){
    const hideTrail=!showTrail(),hideCarpet=!showCarpet();
    cleanPixels=(hideTrail || hideCarpet || marker) ? withoutScanOverlays(pixels,stockPalette,{hideTrail,hideCarpet,marker}) : pixels;
  }
  const source=cleanPixels;
  const copy=new ImageData(new Uint8ClampedArray(source.data),pixels.width,pixels.height);
  const plan=planner?.data;
  const whole=swatch(plan?.finishes.all || defaultFinish);
  const byColor=new Map();
  for(const [rgb,id] of colors) byColor.set(rgb,swatch(plan?.finishes[id] || plan?.finishes.all || defaultFinish));
  const roughness={marble:70,wood:167,tile:119,solid:221};
  const roughByColor=new Map();
  for(const [rgb,id] of colors)roughByColor.set(rgb,roughness[(plan?.finishes[id] || plan?.finishes.all || defaultFinish).material]);
  const fills=new Map();
  for(const [id,finish] of Object.entries(plan?.finishes || {})) fills.set(Number(id),swatch(finish));
  const w=pixels.width,d=copy.data;
  const cols=Math.ceil(w/4);
  floorCells=new Uint8Array(cols*Math.ceil(pixels.height/4));
  for(let y=0;y<pixels.height;y++) for(let x=0;x<w;x++) {
    const i=4*(y*w+x),rgb=rgbAt(d,i);
    const m=mask?4*((y>>2)*mask.width+(x>>2)):0;
    const cut=mask && mask.data[m+2]>mask.data[m] && mask.data[m+3]>90;
    if(deletedAt(x,y)){d[i+3]=0;continue;}
    const cell=(y>>2)*cols+(x>>2);
    if((d[i+3] || cut) && !wallCells?.[cell])floorCells[cell]=1;
    const floor=byColor.get(rgb);
    // Keep the dock, robot and trail from the current native frame above edits.
    if(d[i+3] && rgb===0x93c2ee) {d[i]=183;d[i+1]=134;d[i+2]=83;continue;}
    const patch=cut && (d[i+3]===0 || isWall(rgb));
    if(!floor && !patch)continue;
    let tile=floor || fills.get(mask.data[m+1]);
    // At a removed wall the room color is occluded. Match the nearest visible
    // finish when the brush applied to the whole floor crosses a styled room.
    if(!tile && fills.size && !mask.data[m+1]){
      for(const gap of [4,8,16,32,64]) {
        for(const [dx,dy] of [[gap,0],[0,gap],[-gap,0],[0,-gap]]){
          const u=x+dx,v=y+dy;
          if(u<0 || v<0 || u>=w || v>=pixels.height)continue;
          tile=byColor.get(rgbAt(source.data,4*(v*w+u)));
          if(tile)break;
        }
        if(tile)break;
      }
    }
    tile ||= whole;
    const t=4*((y%swatchSize)*swatchSize+x%swatchSize);
    if(rebuildSlab && x%4===2 && y%4===2){
      const finish=plan?.finishes[mask?.data[m+1]] || plan?.finishes.all || defaultFinish;
      surface.material.roughnessMap.image.data[4*cell+1]=roughByColor.get(rgb) ?? roughness[finish.material] ?? 210;
    }
    const highlight=floor && selection.has(colors.get(rgb));
    d[i]=highlight?(tile[t]+255)/2:tile[t];
    d[i+1]=highlight?(tile[t+1]+168)/2:tile[t+1];
    d[i+2]=highlight?(tile[t+2]+64)/2:tile[t+2];d[i+3]=255;
  }
  ctx.putImageData(copy,0,0); texture.needsUpdate=true;
  if(rebuildSlab){
    updateContact();
    surface.material.roughnessMap.needsUpdate=true;
    updateSlab();
  }
  draw();
}
// A softened silhouette grounds the slab, and a blurred wall mask shades
// indirect light at the floor-wall joint. Both follow saved edits and holes.
function updateContact(){
  const map=surface.material.aoMap,{width,height,data}=map.image;
  const ink=document.createElement('canvas');
  ink.width=width;ink.height=height;
  const inkCtx=ink.getContext('2d'),cells=inkCtx.createImageData(width,height);
  for(let i=0;i<wallCells.length;i++)cells.data[4*i+3]=wallCells[i]?255:0;
  inkCtx.putImageData(cells,0,0);
  const blurred=document.createElement('canvas');
  blurred.width=width;blurred.height=height;
  const blur=blurred.getContext('2d',{willReadFrequently:true});
  blur.filter='blur(2px)';blur.drawImage(ink,0,0);
  const alpha=blur.getImageData(0,0,width,height).data;
  for(let i=0;i<wallCells.length;i++){
    data[4*i]=Math.max(65,255-alpha[4*i+3]*2);
    cells.data[4*i+3]=(wallCells[i] || floorCells[i])?255:0;
  }
  inkCtx.putImageData(cells,0,0);
  const pad=22,canvas=contact.material.map.image;
  canvas.width=width+pad*2;canvas.height=height+pad*2;
  const ctx=canvas.getContext('2d');
  ctx.filter='blur(5px)';ctx.drawImage(ink,pad,pad);
  contact.material.map.needsUpdate=true;
  contact.scale.set(canvas.width*4,canvas.height*4,1);
}
// Extrude just the exposed perimeter. Runs share a draw call, including
// interior holes and any new boundary made by the floor brush.
function updateSlab() {
  const w=pixels.width,h=pixels.height,cols=Math.ceil(w/4),rows=Math.ceil(h/4);
  const vertices=[],indices=[];
  const occupied=(x,y)=>x>=0 && y>=0 && x<cols && y<rows &&
    (floorCells[y*cols+x] || wallCells[y*cols+x]);
  function edge(x,y,u,v) {
    const index=vertices.length/3;
    const a=Math.min(w,x*4)-w/2,b=Math.min(h,y*4)-h/2;
    const c=Math.min(w,u*4)-w/2,d=Math.min(h,v*4)-h/2;
    vertices.push(a,0,b,c,0,d,c,-6,d,a,-6,b);
    indices.push(index,index+1,index+2,index,index+2,index+3);
  }
  // Walk both axes and merge consecutive edges that face the same direction.
  for(const vertical of [false,true]){
    const lines=vertical?cols:rows,length=vertical?rows:cols;
    for(let line=0;line<=lines;line++){
      let start=0,previous=0;
      for(let n=0;n<=length;n++){
        const left=vertical?occupied(line-1,n):occupied(n,line-1);
        const right=vertical?occupied(line,n):occupied(n,line);
        const direction=n===length?0:Number(!!right)-Number(!!left);
        if(direction===previous)continue;
        if(previous){
          const forward=vertical?previous<0:previous>0;
          const a=forward?start:n,b=forward?n:start;
          if(vertical)edge(line,a,line,b);else edge(a,line,b,line);
        }
        previous=direction;start=n;
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex(indices);geometry.computeVertexNormals();
  if(slab){slab.geometry.dispose();slab.geometry=geometry;}
  else{
    slab=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:0xa8a099,side:THREE.DoubleSide,roughness:.94}));
    slab.receiveShadow=true;scene.add(slab);
  }
  rebuildSlab=false;
}
function buildWalls() {
  // The stock Qrevo renderer draws a map cell four pixels wide. Merge adjacent
  // wall cells into runs so each scan needs just one instanced draw call.
  const runs=[], step=4, w=paint.width,h=paint.height,d=pixels.data;
  wallCells=new Uint8Array(Math.ceil(w/4)*Math.ceil(h/4));
  for(let y=2;y<h;y+=step) {
    let start=null;
    for(let x=2;x<w+step;x+=step) {
      const i=(w*y+x)*4, color=(d[i]<<16)|(d[i+1]<<8)|d[i+2];
      const m=mask ? 4*((y>>2)*mask.width+(x>>2)) : 0;
      const override=mask && mask.data[m+3]>90;
      const wall=x<w && (override ? mask.data[m]>mask.data[m+2] : d[i+3]===255 && isWall(color));
      if(wall)wallCells[(y>>2)*Math.ceil(w/4)+(x>>2)]=1;
      if(wall && start===null) start=x-2;
      if(!wall && start!==null) {runs.push([start,x-2,y]);start=null;}
    }
  }
  if(walls) { scene.remove(walls); walls.dispose(); }
  walls = new THREE.InstancedMesh(wallShape,wallMaterial,runs.length);
  runs.forEach(([a,b,y],i)=>{
    transform.position.set((a+b-w)/2,15,y-h/2);
    transform.scale.set(b-a,30,step);
    transform.updateMatrix(); walls.setMatrixAt(i,transform.matrix);
  });
  walls.castShadow=true;walls.receiveShadow=true;scene.add(walls);
  viewer.dataset.wallRuns=String(runs.length);
}
function updateDesign(preview) {
  if(!pixels || !surface)return;
  const plan=planner?.data;
  const ops=preview?[...(plan?.ops || []),preview]:plan?.ops;
  mask=ops?.length ? editMask(ops,pixels.width,pixels.height) : null;
  if(model)model.visible=!!plan;
  buildWalls();rebuildSlab=true;placeLights();recolor();
}
function displayNative(blob) {
  if(!blob || blob===nativeBlob)return;
  const next=URL.createObjectURL(blob);
  native.src=next;if(originalURL)URL.revokeObjectURL(originalURL);
  originalURL=next;nativeBlob=blob;
}
function imagePoint(event) {
  const rect=renderer.domElement.getBoundingClientRect();
  ray.setFromCamera(new THREE.Vector2(2*(event.clientX-rect.left)/rect.width-1,1-2*(event.clientY-rect.top)/rect.height),camera);
  const at=ray.intersectObject(surface)[0]?.uv;
  return at ? [Math.min(pixels.width-1,Math.round(at.x*pixels.width)),Math.min(pixels.height-1,Math.round((1-at.y)*pixels.height))] : null;
}
function setupFurniture() {
  model=new THREE.Group();scene.add(model);
  model.position.set(-pixels.width/2,.1,-pixels.height/2);model.scale.setScalar(4);
  model.updateMatrixWorld(true);
  const tile=document.createElement('canvas');tile.width=tile.height=swatchSize;
  tile.getContext('2d').putImageData(new ImageData(swatch(defaultFinish),swatchSize,swatchSize),0,0);
  const marbleMap=new THREE.CanvasTexture(tile);marbleMap.colorSpace=THREE.SRGBColorSpace;
  marbleMap.wrapS=marbleMap.wrapT=THREE.RepeatWrapping;
  const canvas=renderer.domElement;
  function addMesh(group,geometry,material,x=0,y=0,z=0) {
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);
    mesh.castShadow=mesh.receiveShadow=true;group.add(mesh);return mesh;
  }
  furniture=setupFurnishings({model,camera,canvas,floors:[],marbleMap,addMesh,
    makeMaterial:(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.78,...extra}),
    additionalFloors:()=>[{shape:[[0,0],[pixels.width/4,0],[pixels.width/4,pixels.height/4],[0,pixels.height/4]].map(([x,y])=>new THREE.Vector2(x,y)),holes:[]}],
    checkFootprint:corners=>corners.every(({x,y})=>{
      const u=Math.floor(x*4),v=Math.floor(y*4);
      if(u<0 || v<0 || u>=pixels.width || v>=pixels.height || deletedAt(u,v))return false;
      const m=mask?4*((v>>2)*mask.width+(u>>2)):0;
      return pixels.data[(v*pixels.width+u)*4+3]>0 || (mask && mask.data[m+2]>90);
    }),
    storage:planner.furnitureStorage,render:()=>{furniture?.refreshHandles();placeLights();draw();},
    onEditing:active=>{
      editingFurniture=active;orbit.enabled=!active;nav.hidden=active;
      document.querySelector('.rr-edit').hidden=active;document.querySelector('.rr-erase').hidden=active;
      document.querySelector('[data-view=source]').disabled=active;
      view(active);editZoom.visible(active);
    }
  });
  canvas.tabIndex=0;
  canvas.addEventListener('keydown',event=>furniture.handleKey(event));
  furniture.setLighting(!topView && host.appearance==='night');
}
async function present(blob) {
  if (!blob || blob===currentBlob || blob===pendingBlob) return;
  const epoch=++generation;
  pendingBlob=blob;
  try {
    const next=await createImageBitmap(blob);
    if (epoch!==generation) {next.close();return;}
    bitmap?.close(); bitmap=next;
    const resize=paint.width!==bitmap.width || paint.height!==bitmap.height || !surface;
    paint.width=bitmap.width; paint.height=bitmap.height; ctx.drawImage(bitmap,0,0);
    cleanPixels=null;pixels=ctx.getImageData(0,0,paint.width,paint.height);
    if(renderer) {
      marker=locateRobot(pixels);robot.visible=!!marker;
      viewer.dataset.robotMarker=marker?'model':'native';
      if(marker){
        robot.scale.setScalar(marker.radius);
        robot.position.set(marker.x+.5-pixels.width/2,.3,marker.y+.5-pixels.height/2);
        robot.rotation.y=marker.heading;
      }
      if(resize) {
        if(surface) {scene.remove(surface);surface.geometry.dispose();surface.material.roughnessMap.dispose();surface.material.dispose();texture.dispose();}
        texture=new THREE.CanvasTexture(paint); texture.colorSpace=THREE.SRGBColorSpace;
        surface=new THREE.Mesh(new THREE.PlaneGeometry(paint.width,paint.height),new THREE.MeshStandardMaterial({map:texture,roughness:1,alphaTest:.03}));
        const cols=Math.ceil(paint.width/4),rows=Math.ceil(paint.height/4);
        const channels=new Uint8Array(cols*rows*4).fill(255);
        const finishMap=new THREE.DataTexture(channels,cols,rows);
        finishMap.flipY=true;finishMap.magFilter=THREE.LinearFilter;finishMap.needsUpdate=true;
        surface.material.aoMap=surface.material.roughnessMap=finishMap;
        surface.material.onBeforeCompile=polishFloor;
        texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
        const extent=Math.hypot(paint.width,paint.height)*.54+60;

        Object.assign(light.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,far:extent*4});
        light.shadow.camera.updateProjectionMatrix();
        surface.castShadow=surface.receiveShadow=true;surface.rotation.x=-Math.PI/2; scene.add(surface);
      }
      planner.update(pixels);updateDesign();
      if(!furniture && planner.data)setupFurniture();
      if(model){model.position.set(-pixels.width/2,.1,-pixels.height/2);model.visible=!!planner.data;}
      if(resize) view(topView);
      if(planner.comparing)displayNative(blob);
    } else {
      displayNative(blob);
    }
    currentBlob=blob;
    host.onDisplay(blob,true);
    viewer.dataset.rendered='true';
    status.textContent=renderer ? 'Roborock · Live map' : 'Roborock · Original map';
  } catch {
    if(epoch===generation) {
      host.onDisplay(blob,false);
      status.textContent='Could not display the latest Roborock image.';
    }
  }
  finally {if(epoch===generation) pendingBlob=null;}
}
// A small fixed set of unshadowed practical lights keeps GPU cost bounded.
function placeLights(){
  for(const source of practicals)source.visible=false;
  if(!furniture || !model?.visible || topView || host.appearance!=='night')return;
  let index=0;
  furniture.visitLightFixtures((kind,object)=>{
    if(index>=practicals.length)return;
    const source=practicals[index++],lamp=kind==='floorLamp';
    source.visible=true;source.position.set(0,lamp?14:2.6,0);
    object.localToWorld(source.position);
    source.color.setHex(lamp?0xffbc80:0xffa958);
    source.distance=lamp?235:155;source.intensity=lamp?12500:4200;
  });
}
function setSceneLight(){
  if(!light)return;
  const night=host.appearance==='night' && !topView;
  const extent=Math.hypot(paint.width,paint.height)*.54+60;
  studioLevel.value=topView?0:night?.39:.74;studioScale.value=extent;
  sky.intensity=topView?1.25:night?.19:.38;
  sky.color.setHex(night?0x9bbdff:0xe4efff);
  light.color.setHex(night?0x91baff:0xffddad);
  light.intensity=topView?1.75:night?.53:2.2;
  light.position.set(-1.06,topView?1.8:.76,-.54).multiplyScalar(extent);
  rim.color.setHex(night?0x81aaff:0xdbeaff);rim.intensity=topView?0:night?.72:.68;
  windowLight.color.setHex(night?0xffbd89:0xffe9cd);
  windowLight.position.set(-.38,.44,.28).multiplyScalar(extent);
  windowLight.intensity=(topView?0:night?.34:.26)*extent*extent;
  windowLight.distance=extent*2.2;
  scene.environmentIntensity=topView?.16:night?.085:.29;
  contact.visible=!topView;
  contact.material.opacity=night?.86:.51;
  ground.material.opacity=topView?.18:night?.26:.25;
  renderer.toneMappingExposure=topView?1.18:night?.84:.91;
  furniture?.setLighting(night);placeLights();
}
window.t90SetAppearance=look=>{
  host.appearance=look;document.documentElement.dataset.appearance=look;
  setSceneLight();draw();
};
window.roborockUpdate = ({blob,rooms,selected})=>{
  const next=new Set(selected);
  const changed=next.size!==selection.size || [...next].some(v=>!selection.has(v)) || rooms!==host.drawnRooms;
  planner?.updateRooms(rooms);host.drawnRooms=rooms; selection=next; if (changed) colors=roomColors(rooms);
  if(changed) recolor();
  present(blob);
};
try {
  renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  robot=qrevoModel();host.onPortrait(qrevoPortrait(renderer,robot));addLocator(robot);robot.visible=false;
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  viewer.append(renderer.domElement);
  scene=new THREE.Scene();scene.add(robot); camera=new THREE.OrthographicCamera(-1,1,1,-1,1,10000);
  orbit=new OrbitControls(camera,renderer.domElement);
  orbit.maxPolarAngle=Math.PI*.46; orbit.minZoom=.5; orbit.maxZoom=10;
  orbit.addEventListener('change',draw);
  const studio=new RoomEnvironment(),filter=new THREE.PMREMGenerator(renderer);
  scene.environment=filter.fromScene(studio,.035,.1,100,{size:64}).texture;
  studio.dispose();filter.dispose();
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  sky=new THREE.HemisphereLight(0xe4efff,0x8d7165);scene.add(sky);
  rim=new THREE.DirectionalLight();rim.position.set(1,.55,-.85);scene.add(rim);
  windowLight=new THREE.PointLight();scene.add(windowLight);
  for(let i=0;i<4;i++){const source=new THREE.PointLight(0xffc68c,0);practicals.push(source);scene.add(source);}
  ground=new THREE.Mesh(new THREE.PlaneGeometry(18000,18000),
    new THREE.ShadowMaterial({color:0x372d24,opacity:.22,depthWrite:false}));
  ground.rotation.x=-Math.PI/2;ground.position.y=-7;ground.receiveShadow=true;scene.add(ground);
  const contactTexture=new THREE.CanvasTexture(document.createElement('canvas'));
  contactTexture.generateMipmaps=false;contactTexture.minFilter=THREE.LinearFilter;
  contact=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({
    map:contactTexture,transparent:true,depthWrite:false,toneMapped:false}));
  contact.rotation.x=-Math.PI/2;contact.position.y=-6.8;contact.renderOrder=-1;scene.add(contact);
  light=new THREE.DirectionalLight(0xffebcf,2.4);scene.add(light);
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
  light.castShadow=true;light.shadow.radius=5;light.shadow.intensity=.83;
  light.shadow.mapSize.set(2048,2048);light.shadow.bias=-.00016;
  light.shadow.normalBias=.35;
  const floorPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  editZoom=setupEditZoom({viewer,nav,canvas:renderer.domElement,cancelEdits:()=>{
    planner?.cancelGesture();furniture?.cancelGesture();
  },zoom:(factor,from,to)=>{
    if(factor===null){view(true);return camera.zoom;}
    const rect=renderer.domElement.getBoundingClientRect();
    const center=[rect.left+rect.width/2,rect.top+rect.height/2];
    const onPlane=([x,y])=>{
      ray.setFromCamera(new THREE.Vector2(2*(x-rect.left)/rect.width-1,1-2*(y-rect.top)/rect.height),camera);
      return ray.ray.intersectPlane(floorPlane,new THREE.Vector3());
    };
    camera.updateMatrixWorld();
    const before=onPlane(from || center);
    camera.zoom=THREE.MathUtils.clamp(camera.zoom*factor,orbit.minZoom,orbit.maxZoom);
    camera.updateProjectionMatrix();
    const after=onPlane(to || center);
    if(before && after){
      const delta=before.sub(after);
      camera.position.add(delta);orbit.target.add(delta);camera.updateMatrixWorld();
    }
    frame();return camera.zoom;
  }});
  planner=setupPlanEditor({host,viewer,tools,canvas:renderer.domElement,locate:imagePoint,
    project:([x,y])=>{
      const p=new THREE.Vector3(x-pixels.width/2,0,y-pixels.height/2).project(camera);
      return [(p.x+1)*viewer.clientWidth/2,(1-p.y)*viewer.clientHeight/2];
    },
    grid:tool=>({cells:tool==='delete-floor'?floorCells:wallCells,width:Math.ceil(pixels.width/4),height:Math.ceil(pixels.height/4)}),
    pick:point=>pickWall(wallCells,Math.ceil(pixels.width/4),Math.ceil(pixels.height/4),point,
      Math.min(24,Math.max(4,8*(camera.right-camera.left)/camera.zoom/viewer.clientWidth))),editFurniture:furnishingButton,change:updateDesign,
    topView:active=>{orbit.enabled=!active;nav.hidden=active;view(active);editZoom.visible(active);},
    originalView:active=>{viewer.dataset.camera=active?'scan':topView?'top':'floor';carpetButton.disabled=routeButton.disabled=active;if(active)displayNative(currentBlob);native.hidden=!active;nav.hidden=active;}
  });
  tools.firstElementChild.classList.add('rr-edit');
  let tap;
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{tap=e.isPrimary && e.button===0 ? [e.pointerId,e.clientX,e.clientY] : null;});
  canvas.addEventListener('pointermove',e=>{if(tap && Math.hypot(e.clientX-tap[1],e.clientY-tap[2])>6) tap=null;});
  canvas.addEventListener('pointercancel',()=>{tap=null;});
  canvas.addEventListener('pointerup',e=>{
    const t=tap;tap=null;
    if(planner.editing || planner.comparing || editingFurniture || !surface || !t || t[0]!==e.pointerId || Math.hypot(e.clientX-t[1],e.clientY-t[2])>6) return;
    const rect=canvas.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(2*(e.clientX-rect.left)/rect.width-1,1-2*(e.clientY-rect.top)/rect.height),camera);
    const hit=ray.intersectObjects([walls,surface])[0];
    if(hit?.object!==surface) return;
    const x=Math.min(paint.width-1,Math.floor(hit.uv.x*paint.width));
    const y=Math.min(paint.height-1,Math.floor((1-hit.uv.y)*paint.height));
    if(deletedAt(x,y))return;
    const i=(y*paint.width+x)*4,d=pixels.data;
    const id=d[i+3]===255 ? colors.get((d[i]<<16)|(d[i+1]<<8)|d[i+2]) : null;
    if(id!=null) host.onRoom(id);
  });
  new ResizeObserver(frame).observe(viewer);
  nav.querySelector('[data-camera=top]').onclick=()=>view(true);
  nav.querySelector('[data-camera=floor]').onclick=()=>view(false);
} catch { renderer=null;native.hidden=false;nav.hidden=true;tools.hidden=true;}
window.t90SetAppearance(host.appearance);
window.roborockUpdate(host);
