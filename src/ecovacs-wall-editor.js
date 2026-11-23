import { scope } from './scene-context.js';
import * as THREE from 'three';

const storageKey = scope + ':walls';
const instruction = 'Drag the wall to move it, either end to change its length, or ↻ to rotate.';
const offsets = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };

function segmentPosition(point, { start, end }) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  return THREE.MathUtils.clamp(((point.x - start.x) * dx + (point.z - start.z) * dz) / (dx * dx + dz * dz), 0, 1);
}

function positionAt(t, { start, end }) {
  return { x: THREE.MathUtils.lerp(start.x, end.x, t), z: THREE.MathUtils.lerp(start.z, end.z, t) };
}

function distanceToWall(point, wall) {
  const nearest = positionAt(segmentPosition(point, wall), wall);
  return Math.hypot(point.x - nearest.x, point.z - nearest.z);
}

function normalFor({ start, end }) {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.hypot(dx, dz);
  return { x: -dz / length, z: dx / length };
}

function sameWall(a, b) {
  if (!b || a.id !== b.id || a.kind !== b.kind || a.hidden !== b.hidden) return false;
  if (a.kind === 'floor') return a.points.length === b.points.length &&
    a.points.every((point, index) => point.x === b.points[index].x && point.z === b.points[index].z);
  return a.start.x === b.start.x && a.start.z === b.start.z &&
    a.end.x === b.end.x && a.end.z === b.end.z;
}

function validWall(record) {
  return record?.start && record?.end &&
    [record.start.x, record.start.z, record.end.x, record.end.z].every(Number.isFinite) &&
    Math.hypot(record.end.x - record.start.x, record.end.z - record.start.z) >= 0.6;
}

function validFloor(points) {
  if (!Array.isArray(points) || points.length < 3 || points.length > 24 ||
    !points.every(point => Number.isFinite(point?.x) && Number.isFinite(point?.z))) return false;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a.x * b.z - b.x * a.z;
  }
  return Math.abs(area) >= 20;
}

function contains(point, corners) {
  let inside = false;
  for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
    const a = corners[i];
    const b = corners[j];
    if ((a.z > point.z) !== (b.z > point.z) &&
      point.x < (b.x - a.x) * (point.z - a.z) / (b.z - a.z) + a.x) inside = !inside;
  }
  return inside;
}

function findRoomInAddedWalls(records, scannedFloors) {
  const drawn = records.filter(record => record.kind === 'wall' && record.id.startsWith('added:') && !record.hidden);
  const existing = records.filter(record => record.kind === 'wall' && !record.id.startsWith('added:') && !record.hidden);
  const visited = new Set();
  const rooms = [];
  const samePoint = (a, b) => Math.hypot(a.x - b.x, a.z - b.z) < 0.1;
  const onScannedFloor = point => scannedFloors.some(floor => contains(point, floor));

  for (const first of drawn) {
    if (visited.has(first.id)) continue;
    const perimeter = [first.start, first.end];
    visited.add(first.id);
    for (const reverse of [false, true]) {
      if (reverse) perimeter.reverse();
      while (!samePoint(perimeter[0], perimeter.at(-1))) {
        const edge = perimeter.at(-1);
        const matching = drawn.filter(wall => !visited.has(wall.id) && [wall.start, wall.end].some(end => samePoint(end, edge)));
        if (matching.length !== 1) break;
        const wall = matching[0];
        visited.add(wall.id);
        perimeter.push(samePoint(wall.start, edge) ? wall.end : wall.start);
      }
    }
    const closed = samePoint(perimeter[0], perimeter.at(-1));
    const sharedWall = existing.find(wall => distanceToWall(perimeter[0], wall) <= 0.85 &&
      distanceToWall(perimeter.at(-1), wall) <= 0.85);
    if (!closed && (!sharedWall || perimeter.length < 4)) continue;
    if (closed) perimeter.pop();
    if (!validFloor(perimeter)) continue;

    const center = perimeter.reduce((sum, point) => ({ x: sum.x + point.x / perimeter.length,
      z: sum.z + point.z / perimeter.length }), { x: 0, z: 0 });
    if (!contains(center, perimeter) || onScannedFloor(center)) continue;
    const connections = [];
    for (let i = 0; i < perimeter.length; i++) {
      const edge = { start: perimeter[i], end: perimeter[(i + 1) % perimeter.length] };
      const length = Math.hypot(edge.end.x - edge.start.x, edge.end.z - edge.start.z);
      if (length < 14) continue;
      const middle = positionAt(0.5, edge);
      const normal = normalFor(edge);
      const sides = [-3, 3].map(offset => onScannedFloor({ x: middle.x + normal.x * offset, z: middle.z + normal.z * offset }));
      if (sides[0] === sides[1]) continue;
      const halfWidth = Math.min(7.5, (length - 2.4) / 2) / length;
      const start = positionAt(0.5 - halfWidth, edge);
      const end = positionAt(0.5 + halfWidth, edge);
      connections.push(sides[0] ? { start, end } : { start: end, end: start });
    }
    rooms.push({ perimeter, door: connections.length === 1 ? connections[0] : null });
  }
  return rooms.length === 1 ? rooms[0] : null;
}

export function setupWallEditor({ segments, scannedFloors, model, camera, canvas, positionWalls, render, onEditing }) {
  const viewer = canvas.parentElement;
  const stage = viewer.closest('.stage');
  const editor = document.querySelector('#wall-editor');
  const control = action => document.querySelector('[data-wall="' + action + '"]');
  const editButton = control('edit');
  const resetButton = control('reset');
  const undoButton = control('undo');
  const removeButton = control('remove');
  const finishFloorButton = control('finish-floor');
  const rotateButton = control('rotate');
  const handles = [...editor.querySelectorAll('.wall-handle')];
  const turnHandle = editor.querySelector('.wall-turn');
  const selection = editor.querySelector('.wall-selection');
  const sourceButton = document.querySelector('[data-view="source"]');
  const status = editor.querySelector('.wall-status');
  const ray = new THREE.Raycaster();
  const cursor = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  const projected = new THREE.Vector3();
  const base = segments.map(([start, end]) => ({
    id: [...start.toArray(), ...end.toArray()].map(value => value.toFixed(2)).join(','),
    kind: 'wall',
    start: { x: start.x, z: start.y },
    end: { x: end.x, z: end.y },
    hidden: false,
  }));
  const baseById = new Map(base.map(wall => [wall.id, wall]));
  let roomFinished = false;

  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved?.version === 1 && saved.walls) {
        const scanned = base.map(original => {
          const entry = saved.walls[original.id];
          if (typeof entry?.hidden !== 'boolean' || !validWall(entry)) return original;
          return { ...original, start: entry.start, end: entry.end, hidden: entry.hidden };
        });
        const ids = new Set();
        const added = Array.isArray(saved.added) ? saved.added.filter(record => {
          if (!record || typeof record.id !== 'string' || !/^added:\d+$/.test(record.id) ||
            ids.has(record.id) || !['wall', 'gap', 'floor', 'door'].includes(record.kind) ||
            !(record.kind === 'floor' ? validFloor(record.points) : validWall(record))) return false;
          ids.add(record.id);
          return true;
        }).map(record => ({ ...record, hidden: false })) : [];
        const restored = [...scanned, ...added];
        roomFinished = Boolean(saved.roomFinished || added.some(record => record.kind === 'floor'));
        if (roomFinished) return restored;
        const room = findRoomInAddedWalls(restored, scannedFloors);
        if (!room) return restored;
        roomFinished = true;
        const id = Math.max(0, ...added.map(wall => Number(wall.id.slice(6)))) + 1;
        restored.push({ id: 'added:' + id, kind: 'floor', points: room.perimeter, hidden: false });
        if (room.door && !added.some(record => record.kind === 'door')) {
          restored.push({ id: 'added:' + (id + 1), kind: 'door', ...room.door, hidden: false });
        }
        return restored;
      }
    } catch {
      // Storage is optional in the offline preview.
    }
    return base;
  }

  let walls = restore();
  let nextId = Math.max(0, ...walls.filter(wall => !baseById.has(wall.id)).map(wall => Number(wall.id.slice(6)))) + 1;
  let displayed = walls;
  let selectedId = null;
  let undo = null;
  let gesture = null;
  let tool = null;
  let anchor = null;
  let floorCorners = [];
  let frame = 0;
  const selected = () => walls.find(wall => wall.id === selectedId && !wall.hidden);

  function changedWalls() {
    return walls.filter(wall => !sameWall(wall, baseById.get(wall.id)));
  }

  function syncControls() {
    const count = changedWalls().length;
    resetButton.hidden = count === 0;
    undoButton.hidden = !undo;
    viewer.dataset.wallEdits = String(count);
    viewer.dataset.visibleWalls = String(walls.filter(wall => wall.kind === 'wall' && !wall.hidden).length);
    viewer.dataset.gapCovers = String(walls.filter(wall => wall.kind === 'gap').length);
    viewer.dataset.customFloors = String(walls.filter(wall => wall.kind === 'floor').length);
    viewer.dataset.doors = String(walls.filter(wall => wall.kind === 'door').length);
  }

  function persist(message) {
    try {
      const changed = changedWalls();
      const entries = changed.filter(wall => baseById.has(wall.id))
        .map(({ id, start, end, hidden }) => [id, { start, end, hidden }]);
      const added = changed.filter(wall => !baseById.has(wall.id));
      roomFinished ||= added.some(record => record.kind === 'floor');
      localStorage.setItem(storageKey, JSON.stringify({ version: 1, walls: Object.fromEntries(entries), added,
        roomFinished }));
      status.textContent = message;
    } catch {
      status.textContent = message + ' Browser storage is unavailable.';
    }
    syncControls();
  }

  function refreshHandles() {
    const wall = !editor.hidden && !tool &&
      displayed.find(record => record.id === selectedId && !record.hidden && record.kind !== 'floor');
    const measure = editor.querySelector('.wall-measure');
    measure.hidden = !wall || wall.kind !== 'wall';
    if (!measure.hidden) {
      const dx = wall.end.x - wall.start.x, dz = wall.end.z - wall.start.z;
      const angle = (Math.round(THREE.MathUtils.radToDeg(Math.atan2(dz, dx)) * 10) / 10 + 360) % 360;
      measure.textContent = Math.hypot(dx, dz).toFixed(1) + ' map units · ' + angle.toFixed(1) + '°';
    }
    turnHandle.hidden = !wall || wall.kind !== 'wall';
    for (const handle of handles) handle.hidden = !wall;
    if (!wall) return;

    const pixels = handles.map(handle => {
      const point = wall[handle.dataset.wallEnd];
      model.localToWorld(projected.set(point.x,0.35,point.z)).project(camera);
      const x = (projected.x+1)*viewer.clientWidth/2;
      const y = (1-projected.y)*viewer.clientHeight/2;
      handle.hidden = Math.abs(projected.x)>1 || Math.abs(projected.y)>1;
      handle.style.transform = 'translate('+x+'px,'+y+'px) translate(-50%,-50%)';
      return new THREE.Vector2(x,y);
    });
    const [start,end] = pixels;
    const center = start.clone().lerp(end,0.5);
    const direction = end.clone().sub(start).normalize();
    // Split overlapping touch targets at their midpoint, even on very short walls.
    const halfLength = start.distanceTo(end)/2;
    handles.forEach((handle,i) => {
      if (halfLength>=32) { handle.style.clipPath=''; return; }
      const d = direction.clone().multiplyScalar(i ? -1 : 1);
      const mid = new THREE.Vector2(22,22).addScaledVector(d,halfLength);
      const t = new THREE.Vector2(-d.y,d.x).multiplyScalar(100);
      const back = d.clone().multiplyScalar(-100);
      const polygon = [mid.clone().add(t),mid.clone().sub(t),mid.clone().sub(t).add(back),mid.clone().add(t).add(back)];
      handle.style.clipPath = 'polygon('+polygon.map(p=>p.x+'px '+p.y+'px').join(',')+')';
    });
    if (turnHandle.hidden) return;
    const normal = new THREE.Vector2(direction.y,-direction.x);
    const knob = center.clone().addScaledVector(normal,38);
    if (knob.x<17 || knob.y<17 || knob.x>viewer.clientWidth-17 || knob.y>viewer.clientHeight-17) {
      normal.negate();
      knob.copy(center).addScaledVector(normal,38);
    }
    turnHandle.style.left = knob.x+'px';
    turnHandle.style.top = knob.y+'px';
    turnHandle.style.setProperty('--stem-angle',Math.atan2(-normal.y,-normal.x)+'rad');
  }

  function draw(draft = walls, shadows = true) {
    displayed = draft;
    const wall = selected();
    selection.hidden = Boolean(!wall || tool);
    if (wall) {
      const label = { gap: 'cover', floor: 'floor', door: 'door', wall: 'wall' }[wall.kind];
      removeButton.textContent = 'Remove ' + label;
      rotateButton.hidden = wall.kind === 'floor';
    }
    positionWalls(draft, editor.hidden ? null : selectedId);
    render(shadows);
  }

  function detachPointer() {
    const active = gesture;
    gesture = null;
    cancelAnimationFrame(frame);
    frame = 0;
    viewer.dataset.dragging = 'false';
    if (active && canvas.hasPointerCapture(active.pointerId)) canvas.releasePointerCapture(active.pointerId);
    return active;
  }

  function setTool(nextTool) {
    cancelAnimationFrame(frame);
    frame = 0;
    tool = nextTool;
    anchor = null;
    floorCorners = [];
    finishFloorButton.hidden = true;
    viewer.dataset.placing = String(Boolean(tool));
    control('add').setAttribute('aria-pressed', String(tool === 'wall'));
    control('gap').setAttribute('aria-pressed', String(tool === 'gap'));
    control('floor').setAttribute('aria-pressed', String(tool === 'floor'));
    control('door').setAttribute('aria-pressed', String(tool === 'door'));
  }

  function toggleEditing(editing) {
    detachPointer();
    setTool(null);
    selectedId = null;
    editor.hidden = !editing;
    stage.dataset.editing = String(editing);
    viewer.dataset.wallEditing = String(editing);
    editButton.setAttribute('aria-expanded', String(editing));
    status.textContent = instruction;
    syncControls();
    onEditing(editing);
    draw();
    if (editing) canvas.focus({ preventScroll: true });
    else if (!editButton.disabled) editButton.focus();
  }

  function pick(point, pointerType) {
    let distance = (pointerType === 'touch' ? 15 : 10) *
      (camera.right - camera.left) / (canvas.clientWidth * camera.zoom);
    let chosen = null;
    for (const wall of walls) {
      if (wall.hidden || wall.kind === 'floor') continue;
      const candidate = distanceToWall(point, wall);
      if (candidate < distance || (wall.kind === 'door' && Math.abs(candidate - distance) < 0.0001)) {
        distance = candidate;
        chosen = wall;
      }
    }
    return chosen ?? walls.findLast(record => record.kind === 'floor' && contains(point, record.points));
  }

  function groundPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    cursor.set((event.clientX - bounds.x) / bounds.width * 2 - 1,
      1 - (event.clientY - bounds.y) / bounds.height * 2);
    ray.setFromCamera(cursor, camera);
    return ray.ray.intersectPlane(plane, hit) ? model.worldToLocal(hit) : null;
  }

  function snap(point, kind, ignore = null) {
    if (kind === 'wall' || kind === 'door' || kind === 'floor') {
      let nearest = null;
      let distance = 1.7;
      for (const wall of walls) {
        if (wall.hidden || wall.kind !== 'wall' || wall.id === ignore) continue;
        for (const candidate of [wall.start, wall.end, positionAt(segmentPosition(point, wall), wall)]) {
          const separation = Math.hypot(point.x - candidate.x, point.z - candidate.z);
          if (separation < distance) {
            nearest = candidate;
            distance = separation;
          }
        }
      }
      if (nearest) return { ...nearest };
    }
    return { x: Math.round(point.x * 2) / 2, z: Math.round(point.z * 2) / 2 };
  }

  function transformWall(target, start, end) {
    const next = { ...target, start, end };
    if (sameWall(target, next)) return walls;
    const follow = point => distanceToWall(point, target) < 0.05
      ? positionAt(segmentPosition(point, target), next)
      : point;
    const result = walls.map(wall => {
      if (wall.id === target.id) return next;
      if (wall.hidden || !['wall', 'door'].includes(wall.kind) || target.kind !== 'wall') return wall;
      return { ...wall, start: follow(wall.start), end: follow(wall.end) };
    });
    return result.every(wall => wall.kind === 'floor' ? validFloor(wall.points) : validWall(wall)) ? result : null;
  }

  function translate(target, distance) {
    const normal = normalFor(target);
    const offset = point => ({ x: point.x + distance * normal.x, z: point.z + distance * normal.z });
    return transformWall(target, offset(target.start), offset(target.end));
  }

  function changeEnd(target, end, point) {
    return transformWall(target, end === 'start' ? point : target.start, end === 'end' ? point : target.end);
  }

  function rotateWall(wall, angle) {
    const center = positionAt(0.5,wall);
    const dx = (wall.end.x-wall.start.x)/2, dz = (wall.end.z-wall.start.z)/2;
    const x = dx*Math.cos(angle)-dz*Math.sin(angle);
    const z = dx*Math.sin(angle)+dz*Math.cos(angle);
    return transformWall(wall,{x:center.x-x,z:center.z-z},{x:center.x+x,z:center.z+z});
  }

  function previewMove(active, point) {
    if (active.startAngle !== undefined) {
      const center = positionAt(0.5,active.wall);
      const dx = point.x-center.x, dz = point.z-center.z;
      if (Math.hypot(dx,dz)<0.01) return active.draft;
      const angle = Math.atan2(dz,dx)-active.startAngle;
      if (Math.abs(angle)<1e-9) return walls;
      return rotateWall(active.wall,angle) ?? active.draft;
    }
    if (active.end) {
      const next = snap({ x: point.x + active.offsetX, z: point.z + active.offsetZ }, active.wall.kind, active.wall.id);
      return changeEnd(active.wall, active.end, next);
    }
    const normal = normalFor(active.wall);
    const distance = (point.x - active.x) * normal.x + (point.z - active.z) * normal.z;
    return translate(active.wall, Math.round(distance * 2) / 2);
  }

  function commit(next, message) {
    if (!next) {
      status.textContent = 'Give the wall and its connected edges more space.';
      draw();
      return;
    }
    if (next.length !== walls.length || next.some((wall, index) => !sameWall(wall, walls[index]))) {
      undo = { walls, selectedId: selectedId };
      walls = next;
      persist(message);
    }
    draw();
  }

  function removeSelected() {
    const wall = selected();
    if (!wall) return;
    const next = baseById.has(wall.id)
      ? walls.map(record => record.id === wall.id ? { ...record, hidden: true } : record)
      : walls.filter(record => record.id !== wall.id);
    selectedId = null;
    const label = { gap: 'Cover', floor: 'Floor', door: 'Door', wall: 'Wall' }[wall.kind];
    commit(next, label + ' removed.');
    canvas.focus({ preventScroll: true });
  }

  function startDrawing(kind) {
    detachPointer();
    setTool(tool === kind ? null : kind);
    selectedId = null;
    const prompts = {
      wall: 'Click or tap the first end of the wall.',
      gap: 'Click or tap one end of the dark gap.',
      floor: 'Click around the room in order, then choose Finish floor.',
      door: 'Click or tap both sides of the doorway.',
    };
    status.textContent = prompts[tool] ?? instruction;
    draw();
    canvas.focus({ preventScroll: true });
  }

  function drawPoint(point) {
    const end = snap(point, tool);
    if (tool === 'floor') {
      if (floorCorners.length >= 3 && Math.hypot(end.x - floorCorners[0].x, end.z - floorCorners[0].z) < 2) {
        finishFloor();
        return;
      }
      if (floorCorners.length === 24) return;
      const last = floorCorners.at(-1);
      if (last && Math.hypot(end.x - last.x, end.z - last.z) < 0.6) return;
      floorCorners.push(end);
      finishFloorButton.hidden = !validFloor(floorCorners);
      status.textContent = 'Corners added: ' + floorCorners.length + '.';
      drawFloorPreview();
      return;
    }
    if (!anchor) {
      anchor = end;
      status.textContent = 'Now click or tap the other end.';
      return;
    }
    const record = { id: 'added:' + nextId, kind: tool, start: anchor, end, hidden: false };
    if (!validWall(record)) {
      status.textContent = 'Choose a point farther from the first end.';
      return;
    }
    nextId++;
    setTool(null);
    selectedId = record.id;
    const message = { gap: 'Gap covered.', door: 'Door added.', wall: 'Wall added.' }[record.kind];
    commit([...walls, record], message);
  }

  function drawFloorPreview(hover = null) {
    const points = hover ? [...floorCorners, hover] : floorCorners;
    if (!validFloor(points)) {
      draw();
      return;
    }
    draw([...walls, { id: 'draft', kind: 'floor', points, hidden: false }]);
  }

  function finishFloor() {
    if (!validFloor(floorCorners)) return;
    const record = { id: 'added:' + nextId++, kind: 'floor', points: floorCorners, hidden: false };
    setTool(null);
    selectedId = record.id;
    commit([...walls, record], 'Floor added.');
  }

  editButton.addEventListener('click', () => toggleEditing(true));
  control('done').addEventListener('click', () => toggleEditing(false));
  control('add').addEventListener('click', () => startDrawing('wall'));
  control('gap').addEventListener('click', () => startDrawing('gap'));
  control('floor').addEventListener('click', () => startDrawing('floor'));
  control('door').addEventListener('click', () => startDrawing('door'));
  finishFloorButton.addEventListener('click', finishFloor);
  control('remove').addEventListener('click', removeSelected);
  control('rotate').addEventListener('click', () => {
    const wall = selected();
    if (!wall || wall.kind === 'floor') return;
    const center = positionAt(0.5, wall);
    const rotate = point => ({ x: center.x - (point.z - center.z), z: center.z + (point.x - center.x) });
    commit(transformWall(wall, rotate(wall.start), rotate(wall.end)), 'Turned 90 degrees.');
    canvas.focus({ preventScroll: true });
  });
  resetButton.addEventListener('click', () => {
    detachPointer();
    setTool(null);
    selectedId = null;
    commit(base, 'Wall edits reset.');
    canvas.focus({ preventScroll: true });
  });
  undoButton.addEventListener('click', () => {
    if (!undo) return;
    detachPointer();
    setTool(null);
    walls = undo.walls;
    selectedId = undo.selectedId;
    undo = null;
    persist('Wall edit undone.');
    draw();
    canvas.focus({ preventScroll: true });
  });
  sourceButton.addEventListener('click', () => {
    const sourceOpen = sourceButton.getAttribute('aria-pressed') === 'true';
    if (sourceOpen && !editor.hidden) toggleEditing(false);
    editButton.disabled = sourceOpen;
  });

  function beginGesture(event, wall, point, end = null) {
    gesture = { pointerId: event.pointerId, wall, x: point.x, z: point.z, end, draft: walls };
    if (end) {
      gesture.offsetX = wall[end].x - point.x;
      gesture.offsetZ = wall[end].z - point.z;
    }
    canvas.setPointerCapture(event.pointerId);
  }

  canvas.addEventListener('pointerdown', event => {
    if (editor.hidden || gesture || !event.isPrimary || event.button !== 0) return;
    const point = groundPoint(event);
    if (!point) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    if (tool) {
      drawPoint(point);
      return;
    }
    const wall = pick(point, event.pointerType);
    selectedId = wall?.id ?? null;
    status.textContent = wall ? instruction : 'Choose a raised wall or a gap cover.';
    draw(walls, false);
    if (wall && wall.kind !== 'floor') beginGesture(event, wall, point);
  });

  turnHandle.addEventListener('pointerdown', event=>{
    if (gesture || !event.isPrimary || event.button!==0) return;
    const wall=selected(), point=groundPoint(event);
    if (wall?.kind!=='wall' || !point) return;
    event.preventDefault();
    canvas.focus({preventScroll:true});
    beginGesture(event,wall,point);
    const center=positionAt(0.5,wall);
    gesture.startAngle=Math.atan2(point.z-center.z,point.x-center.x);
  });
  turnHandle.addEventListener('keydown', event=>{
    const wall=selected();
    if (wall?.kind!=='wall' || !['ArrowLeft','ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const degrees=(event.key==='ArrowLeft'?-1:1)*(event.shiftKey?15:1);
    commit(rotateWall(wall,THREE.MathUtils.degToRad(degrees)),'Wall rotated.');
  });

  for (const handle of handles) {
    handle.addEventListener('pointerdown', event => {
      if (gesture || !event.isPrimary || event.button !== 0) return;
      const wall = selected();
      const point = groundPoint(event);
      if (!wall || !point) return;
      event.preventDefault();
      beginGesture(event, wall, point, handle.dataset.wallEnd);
    });
    handle.addEventListener('keydown', event => {
      const offset = offsets[event.key];
      const wall = selected();
      if (!offset || !wall) return;
      event.preventDefault();
      const end = handle.dataset.wallEnd;
      const vertex = wall[end];
      commit(changeEnd(wall, end, { x: vertex.x + offset[0], z: vertex.z + offset[1] }), 'Wall end moved.');
    });
  }

  function queueDraw(draft) {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = 0;
      draw(draft);
    });
  }

  canvas.addEventListener('pointermove', event => {
    if (editor.hidden || !event.isPrimary) return;
    if (!anchor && !(tool === 'floor' && floorCorners.length) && gesture?.pointerId !== event.pointerId) return;
    const point = groundPoint(event);
    if (!point) return;
    if (tool === 'floor') {
      drawFloorPreview(snap(point, tool));
      return;
    }
    if (anchor) {
      const draft = { id: 'draft', kind: tool, start: anchor, end: snap(point, tool), hidden: false };
      queueDraw(validWall(draft) ? [...walls, draft] : walls);
      return;
    }
    gesture.draft = previewMove(gesture, point);
    viewer.dataset.dragging = 'true';
    if (gesture.startAngle !== undefined) {
      const current=gesture.draft.find(record=>record.id===selectedId);
      const angle=Math.atan2(current.end.z-current.start.z,current.end.x-current.start.x);
      status.textContent='Wall angle '+(Math.round(THREE.MathUtils.radToDeg(angle))+360)%360+'°';
    }
    queueDraw(gesture.draft ?? walls);
  });
  canvas.addEventListener('pointerup', event => {
    if (gesture?.pointerId !== event.pointerId) return;
    const point = groundPoint(event);
    const active = detachPointer();
    const message = active.startAngle !== undefined ? 'Wall rotated.' : active.end ? 'Wall end moved.' : 'Wall moved.';
    commit(point ? previewMove(active, point) : active.draft, message);
  });
  for (const name of ['pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(name, event => {
      if (gesture?.pointerId !== event.pointerId) return;
      detachPointer();
      draw();
    });
  }

  function escape() {
    if (gesture || tool) {
      detachPointer();
      setTool(null);
      status.textContent = instruction;
      draw();
    } else {
      toggleEditing(false);
    }
  }
  editor.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      escape();
    }
  });

  syncControls();
  positionWalls(walls, null);
  return {
    refreshHandles,
    floorRegions() {
      return walls.filter(record => record.kind === 'floor').map(record => ({
        shape: record.points.map(point => new THREE.Vector2(point.x, point.z)), holes: [],
      }));
    },
    handleKey(event) {
      if (editor.hidden) return false;
      if (event.key === 'Escape') {
        event.preventDefault();
        escape();
        return true;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && undo) {
        event.preventDefault();
        undoButton.click();
        return true;
      }
      if (['PageUp', 'PageDown'].includes(event.key)) {
        event.preventDefault();
        setTool(null);
        const visible = walls.filter(wall => !wall.hidden);
        const step = event.key === 'PageDown' ? 1 : -1;
        const index = visible.findIndex(wall => wall.id === selectedId);
        selectedId = visible[(visible.length + (index < 0 ? (step > 0 ? 0 : -1) : index + step)) % visible.length]?.id;
        draw(walls, false);
        return true;
      }
      const wall = selected();
      const offset = offsets[event.key];
      if (offset) {
        event.preventDefault();
        if (wall && wall.kind !== 'floor') {
          const normal = normalFor(wall);
          commit(translate(wall, normal.x * offset[0] + normal.z * offset[1]), 'Wall moved.');
        }
        return true;
      }
      if (event.key === 'Delete' && wall) {
        event.preventDefault();
        removeSelected();
        return true;
      }
      return false;
    },
  };
}
