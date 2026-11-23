import * as THREE from 'three';

const caption = 'Your floor plan';
const make = (tag, text) => Object.assign(document.createElement(tag), { textContent: text || '' });

function readRooms(plan) {
  if (!Array.isArray(plan?.rooms) || !plan.rooms.length || plan.rooms.length > 60) {
    throw Error('Add 1–60 rooms under floor_plan.rooms.');
  }
  return plan.rooms.map((room, i) => {
    if (!room || typeof room.name !== 'string' || !room.name.trim()) throw Error('Give each room a name.');
    if (!Array.isArray(room.points) || room.points.length < 3 || room.points.length > 128 ||
        !room.points.every(p => Array.isArray(p) && p.length === 2 && p.every(n => Number.isFinite(n) && Math.abs(n) <= 1e6))) {
      throw Error('Use 3–128 [x, y] coordinates for ' + room.name + '.');
    }
    const points = room.points.map(([x,y]) => new THREE.Vector2(x,y));
    if (points[0].equals(points.at(-1))) points.pop();
    const faces = THREE.ShapeUtils.triangulateShape(points, []);
    if (points.length < 3 || Math.abs(THREE.ShapeUtils.area(points)) < 1e-8 || faces.length !== points.length-2) {
      throw Error('Check the outline of ' + room.name + ' for crossing edges or repeated points.');
    }
    const colors = ['#c6a585','#97b4aa','#bbc1cd','#d0bb99'];
    return {name:room.name.trim(), id:typeof room.room_id === 'string' ? room.room_id : null, points, faces,
      color:typeof room.color === 'string' && /^#[0-9a-f]{6}$/i.test(room.color) ? room.color : colors[i%colors.length]};
  });
}

class SwitchBotFloorPlan extends HTMLElement {
  constructor() {
    super();
    const root=this.attachShadow({mode:'open'});
    root.innerHTML='<style>:host{display:block;color:var(--primary-text-color,#283430);font:inherit}.head{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;gap:10px}.head strong{font-size:14px}.head small{display:block;font-size:11px;opacity:.75;margin-top:2px}.viewport{position:relative;height:clamp(210px,37vw,350px);background:radial-gradient(ellipse,#344342,#202b2b);overflow:hidden;border-radius:12px}.viewport canvas{display:block;width:100%;height:100%}.labels{position:absolute;inset:0;pointer-events:none}.labels>*{position:absolute;transform:translate(-50%,-50%);white-space:nowrap;box-sizing:border-box;max-width:min(190px,calc(100% - 12px));overflow:hidden;text-overflow:ellipsis;border:1px solid #eee8;background:#23302eea;color:white;border-radius:7px;padding:6px 9px;font:500 12px system-ui}.labels button{pointer-events:auto;cursor:pointer}.labels button[aria-pressed=true]{background:#ffdf99;color:#2b210c}.labels button:focus-visible,button.view:focus-visible{outline:3px solid #37baca}.view{padding:6px 10px;border-radius:7px;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer;font:inherit;font-size:12px}.status{padding:12px 16px;margin:0;font-size:13px}.status:empty{display:none}</style><div class="head"><div><strong></strong><small>Manually mapped</small></div><button class="view" type="button">Top view</button></div><div class="viewport"><div class="labels"></div></div><p class="status" role="status"></p>';
    this.view=root.querySelector('.viewport');this.labels=root.querySelector('.labels');this.status=root.querySelector('.status');
    root.querySelector('strong').textContent=caption;
    root.querySelector('.view').onclick=()=>{this.top=!this.top;this.render();};
    this.resize=new ResizeObserver(()=>this.render());
  }
  set plan(v){if(this._plan!==v){this._plan=v;if(this.isConnected)this.build();}}
  set selectableRooms(v){const next=Array.from(v||[],String);if(JSON.stringify(next)!==JSON.stringify(this.allowed||[])){this.allowed=next;this.updateLabels();}}
  set selectedRooms(v){this.selected=new Set(Array.from(v||[],String));for(const [i,node] of [...this.labels.children].entries())if(node.tagName==='BUTTON')node.setAttribute('aria-pressed',String(this.selected.has(this.rooms[i].id)));}
  connectedCallback(){this.resize.observe(this.view);if(this._plan)this.build();}
  disconnectedCallback(){this.resize.disconnect();this.clear();}
  clear(){
    this.scene?.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
    this.renderer?.dispose();this.renderer?.forceContextLoss();this.renderer?.domElement.remove();this.scene=null;this.renderer=null;this.rooms=null;this.labels.replaceChildren();
  }
  build(){
    this.clear();
    try{
      const rooms=readRooms(this._plan);
      const bounds=new THREE.Box2().setFromPoints(rooms.flatMap(r=>r.points));
      const center=bounds.getCenter(new THREE.Vector2()),size=bounds.getSize(new THREE.Vector2()), unit=14/Math.max(size.x,size.y);
      this.rooms=rooms;this.view.hidden=false;this.shadowRoot.querySelector('.view').hidden=false;this.status.textContent='';
      this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
      this.view.prepend(this.renderer.domElement);this.renderer.domElement.setAttribute('aria-hidden','true');
      this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-1,1,1,-1,.01,200);
      this.scene.add(new THREE.HemisphereLight(0xfff3dc,0x586b79,2.0));const light=new THREE.DirectionalLight(0xffedcf,2.4);light.position.set(-4,10,6);this.scene.add(light);
      this.extents=[];const edges=new Set();
      for(const room of rooms){
        const pts=room.points.map(p=>p.clone().sub(center).multiplyScalar(unit));
        const vertices=[];
        let bestArea=-1,anchor;
        for(const [a,b,c] of room.faces){
          const signedArea=THREE.ShapeUtils.area([pts[a],pts[b],pts[c]]);
          for(const j of signedArea>0?[a,c,b]:[a,b,c])vertices.push(pts[j].x,0,pts[j].y);
          const area=Math.abs(signedArea);
          if(area>bestArea){bestArea=area;anchor=pts[a].clone().add(pts[b]).add(pts[c]).multiplyScalar(1/3);}
        }
        room.anchor=new THREE.Vector3(anchor.x,.09,anchor.y);
        const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
        geo.computeVertexNormals();
        this.scene.add(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:room.color,side:THREE.DoubleSide,roughness:.84})));
        for(let i=0;i<pts.length;i++){
          const a=pts[i],b=pts[(i+1)%pts.length], edge=[a.toArray().join(','),b.toArray().join(',')].sort().join(':');
          this.extents.push(new THREE.Vector3(a.x,0,a.y),new THREE.Vector3(a.x,.43,a.y));
          if(edges.has(edge))continue;
          edges.add(edge);const wall=new THREE.Mesh(new THREE.BoxGeometry(a.distanceTo(b),.43,.095),new THREE.MeshStandardMaterial({color:0xd6d4c6,roughness:.85}));
          wall.rotation.y=-Math.atan2(b.y-a.y,b.x-a.x);wall.position.set((a.x+b.x)/2,.215,(a.y+b.y)/2);this.scene.add(wall);
        }
      }
      this.updateLabels();
    }catch(e){this.clear();this.view.hidden=true;this.shadowRoot.querySelector('.view').hidden=true;this.status.textContent=e instanceof Error && /room|outline|coordinate/i.test(e.message) ? e.message : 'The 3D view is unavailable on this browser.';}
  }
  updateLabels(){
    if(!this.rooms)return;
    this.labels.replaceChildren(...this.rooms.map(room=>{
      const selectable=(this.allowed||[]).includes(room.id);
      const node=make(selectable?'button':'span',room.name);
      node.title=room.name;
      if(selectable){node.type='button';node.setAttribute('aria-pressed',String(this.selected?.has(room.id)??false));
        node.onclick=()=>this.dispatchEvent(new CustomEvent('switchbot-room-tap',{detail:{id:room.id},bubbles:true,composed:true}));}
      return node;
    }));
    this.render();
  }
  render(){
    if(!this.renderer||!this.extents?.length)return;
    const w=this.view.clientWidth,h=this.view.clientHeight;if(!w||!h)return;
    this.renderer.setSize(w,h,false);
    const cam=this.camera;cam.up.set(0,1,0);cam.position.set(this.top?0:13,this.top?28:19,this.top ? .001 : 16);cam.lookAt(0,0,0);cam.updateMatrixWorld(true);
    const box=new THREE.Box3().setFromPoints(this.extents.map(p=>p.clone().applyMatrix4(cam.matrixWorldInverse)));
    const size=box.getSize(new THREE.Vector3()),mid=box.getCenter(new THREE.Vector3()),span=Math.max(size.y,size.x*h/w)*.575;
    cam.left=mid.x-span*w/h;cam.right=mid.x+span*w/h;cam.top=mid.y+span;cam.bottom=mid.y-span;cam.updateProjectionMatrix();
    this.renderer.render(this.scene,cam);
    this.rooms.forEach((room,i)=>{
      const label=this.labels.children[i];
      if(!label)return;
      const point=room.anchor.clone().project(cam);
      const inset=label.offsetWidth/2+3;
      label.style.left=Math.max(inset, Math.min(w-inset,(point.x+1)*w/2))+'px';
      label.style.top=(1-point.y)*50+'%';
    });
    this.shadowRoot.querySelector('.view').textContent=this.top?'3D view':'Top view';
  }
}
if(!customElements.get('switchbot-floorplan-beta'))customElements.define('switchbot-floorplan-beta',SwitchBotFloorPlan);
