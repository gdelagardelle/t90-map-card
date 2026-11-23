import * as THREE from 'three';

// The card supplies only region paths matched to this vacuum's live room data.
export function setupRoomPicking({ canvas, camera, floors, marble, side, viewer, draw }) {
  const selectedMarble = marble.clone();
  const selectionTint = new THREE.Color(0x54ae9e);
  const highlighted = [selectedMarble, side];
  const ray = new THREE.Raycaster();
  const hitPoint = new THREE.Vector2();
  let ids = new Map();
  let regionsByPath = new Map();
  let selectedIds = new Set();
  let currentPath;
  const pins = new Map();
  const anchors = new Map();
  const world = new THREE.Vector3();
  const downward = new THREE.Vector3(0,-1,0);
  const roomRay = new THREE.Raycaster();

  // Choose a point on a real floor triangle, including concave rooms and holes.
  for (const mesh of floors) {
    const path = mesh.userData.roomPath;
    const geom = mesh.geometry;
    geom.computeBoundingBox();
    const center = geom.boundingBox.getCenter(new THREE.Vector3());
    const size = geom.boundingBox.getSize(new THREE.Vector3());
    const area = size.x * size.z;
    if (anchors.has(path) && anchors.get(path).area >= area) continue;
    const v = geom.attributes.position;
    let nearest = Infinity;
    for (let i = 0; i + 2 < v.count; i += 3) {
      if (v.getY(i) < -.001 || v.getY(i+1) < -.001 || v.getY(i+2) < -.001) continue;
      const x = (v.getX(i)+v.getX(i+1)+v.getX(i+2))/3;
      const z = (v.getZ(i)+v.getZ(i+1)+v.getZ(i+2))/3;
      const distance = (x-center.x)**2 + (z-center.z)**2;
      if (distance >= nearest) continue;
      nearest = distance;
      anchors.set(path,{area,point:mesh.localToWorld(new THREE.Vector3(x,2,z))});
    }
  }
  function refreshPins() {
    for (const [path,pin] of pins) {
      world.copy(anchors.get(path).point).project(camera);
      const x=(world.x+1)*viewer.clientWidth/2, y=(1-world.y)*viewer.clientHeight/2;
      pin.hidden=editing() || world.z < -1 || world.z > 1 || x<0 || x>viewer.clientWidth || y<0 || y>viewer.clientHeight;
      if (!pin.hidden) {
        const margin=Math.min(pin.offsetWidth/2+4,viewer.clientWidth/2);
        pin.style.left=Math.max(margin,Math.min(viewer.clientWidth-margin,x))+'px';
        pin.style.top=Math.max(pin.offsetHeight+6,y)+'px';
      }
    }
  }
  function syncPins() {
    const visible = new Set();
    for (const [path] of anchors) {
      const region=regionsByPath.get(path);
      const current=path===currentPath;
      if (!current && (region?.id==null || !selectedIds.has(region.id))) continue;
      visible.add(path);
      let pin = pins.get(path);
      if (!pin) {
        pin=document.createElement('div'); pin.className='room-pin';
        pin.append(document.createElement('strong'),document.createElement('small'));
        viewer.append(pin); pins.set(path,pin);
      }
      pin.firstElementChild.textContent=region?.name || (region?.id!=null ? 'Room '+region.id : 'Current room');
      const progress=region?.progress;
      pin.lastElementChild.textContent=current && Number.isFinite(progress) && progress>=0 && progress<=100
        ? Math.round(progress)+'% cleaned' : current ? 'Cleaning here' : 'Selected';
      pin.dataset.current=String(current);
    }
    for (const [path,pin] of pins) if (!visible.has(path)) {pin.remove();pins.delete(path);}
    refreshPins();
  }
  function setActivePosition(xy,cleaning) {
    let path;
    if (cleaning && xy && floors.length) {
      world.set(xy[0],100,xy[1]);
      floors[0].parent.localToWorld(world);
      roomRay.set(world,downward);
      path=roomRay.intersectObjects(floors,false)[0]?.object.userData.roomPath;
    }
    if (path!==currentPath) {currentPath=path;syncPins();}
  }
  let toggle;
  let lastKey;
  const pointers = new Set();
  let gesture;

  function editing() {
    return viewer.parentElement.dataset.editing === 'true' || viewer.classList.contains('show-source');
  }
  canvas.addEventListener('pointerdown', e => {
    pointers.add(e.pointerId);
    gesture = pointers.size === 1 && e.button === 0 && !editing()
      ? {id:e.pointerId, x:e.clientX, y:e.clientY} : null;
  });
  canvas.addEventListener('pointermove', e => {
    if (gesture && Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>6) gesture=null;
  });
  canvas.addEventListener('pointercancel', e => { pointers.delete(e.pointerId); gesture=null; });
  canvas.addEventListener('pointerup', e => {
    pointers.delete(e.pointerId);
    const tap = gesture;
    gesture = null;
    if (!tap || tap.id!==e.pointerId || editing() || !toggle ||
        Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>6) return;
    const box = canvas.getBoundingClientRect();
    hitPoint.set(2*(e.clientX-box.left)/box.width-1, 1-2*(e.clientY-box.top)/box.height);
    ray.setFromCamera(hitPoint,camera);
    const hit=ray.intersectObjects(floors,false)[0];
    const path=hit?.object.userData.roomPath;
    if (ids.has(path)) toggle(path);
  });
  window.deebotSetRooms = (regions, selected, pending, onToggle) => {
    toggle = onToggle;
    const key = JSON.stringify([regions,selected,pending]);
    if (key===lastKey) return;
    lastKey=key;
    ids = new Map(regions.map(({path,id})=>[path,id]));
    regionsByPath = new Map(regions.map(region=>[region.path,region]));
    selectedIds = new Set(selected);
    syncPins();
    const active = selectedIds;
    for (const mesh of floors) {
      mesh.material = (mesh.userData.roomPath === pending || active.has(ids.get(mesh.userData.roomPath))) ? highlighted : mesh.userData.baseMaterial;
    }
    viewer.dataset.selectedRooms = selected.join(',');
    draw();
  };
  function setLighting(night) {
    selectedMarble.color.copy(marble.color).lerp(selectionTint, night ? 0.45 : 0.39);
    selectedMarble.emissive.setHex(0x2f675e);
    selectedMarble.emissiveIntensity = night ? 0.24 : 0.06;
  }
  return {setLighting,refreshPins,setActivePosition};
}
