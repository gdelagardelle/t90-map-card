import * as THREE from 'three';

// The card supplies only region paths matched to this vacuum's live room data.
export function setupRoomPicking({ canvas, camera, floors, marble, side, viewer, draw }) {
  const selectedMarble = marble.clone();
  const highlighted = [selectedMarble, side];
  const ray = new THREE.Raycaster();
  const hitPoint = new THREE.Vector2();
  let ids = new Map();
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
    const active = new Set(selected);
    for (const mesh of floors) {
      mesh.material = (mesh.userData.roomPath === pending || active.has(ids.get(mesh.userData.roomPath))) ? highlighted : mesh.userData.baseMaterial;
    }
    viewer.dataset.selectedRooms = selected.join(',');
    draw();
  };
  return night => {
    selectedMarble.color.setHex(night ? 0xd9b48b : 0xe1bb8c);
    selectedMarble.emissive.setHex(night ? 0x6f4928 : 0x4e341e);
    selectedMarble.emissiveIntensity = night ? 0.35 : 0.12;
  };
}
