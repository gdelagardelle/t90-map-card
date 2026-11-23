import { makeMap } from './map.js';

// Trace only exposed cell edges. Keeping the occupied cells on the right
// preserves holes and concave outlines, including rooms that meet at a corner.
export function trace(edges, stride, unit) {
  const step = [1, stride, -1, -stride];
  const paths = [];
  while (edges.size) {
    const first = edges.values().next().value;
    const start = Math.floor(first / 4);
    let vertex = start, direction = first % 4;
    let path = 'M' + (start % stride) * unit + ' ' + Math.floor(start / stride) * unit;
    do {
      edges.delete(vertex * 4 + direction);
      vertex += step[direction];
      if (vertex === start) break;
      const next = [(direction+1)%4, direction, (direction+3)%4].find(d => edges.has(vertex*4+d));
      if (next === undefined) throw Error('Incomplete Dreame room outline.');
      if (next !== direction) {
        path += direction % 2 ? 'V' + Math.floor(vertex / stride) * unit : 'H' + (vertex % stride) * unit;
      }
      direction = next;
    } while (vertex !== start);
    paths.push(path + 'Z');
  }
  return paths.join('');
}

function roomName(segment, cameraRooms) {
  const localized = cameraRooms?.[segment[0]]?.name;
  if (typeof localized === 'string' && localized.trim()) return localized;
  if (typeof segment[4] === 'string') {
    try {
      const custom = new TextDecoder('utf-8', { fatal:true }).decode(Uint8Array.from(atob(segment[4]), c => c.charCodeAt(0)));
      if (custom.trim()) return custom;
    } catch { /* Use the native segment number when the name is unavailable. */ }
  }
  return 'Room ' + segment[0];
}

export function parseDreameMap(text, cameraRooms) {
  if (text.length > 4000000) throw Error('Dreame map exceeds the supported size.');
  const map = JSON.parse(text);
  if (!map || ['empty_map','saved_map','wifi_map','history_map','recovery_map','temporary_map','cleaning_map'].some(k => map[k])) {
    throw Error('Choose the current Dreame floor map camera.');
  }
  const [left, top, , , width, height, grid] = map.size || [];
  if (![left,top,grid].every(Number.isFinite) || grid <= 0 || ![width,height].every(n=>Number.isSafeInteger(n) && n>0)
      || width*height > 1000000 || !Array.isArray(map.segments) || !map.data) {
    throw Error('Expected structured Dreame map data with room segments.');
  }
  const hidden = new Set([...(map.hidden_segments || []), ...(map.unmapped_segments || [])]);
  const rooms = new Map();
  for (const segment of map.segments) {
    const id = segment?.[0];
    if (Number.isInteger(id) && id > 0 && id < 64 && !hidden.has(id) && !segment[11]) rooms.set(id,roomName(segment,cameraRooms));
  }
  const WALL = 255, FLOOR = 254;
  const cells = new Uint8Array(width * height);
  for (const [key,runs] of Object.entries(map.data)) {
    const type = Number(key);
    // Dreame also encodes room pixels bordering an obstacle as 100 + segment ID.
    const id = type > 100 && type < 164 ? type - 100 : type;
    const surface = rooms.has(id) ? id : [251,255].includes(type) ? WALL : [253,254].includes(type) ? FLOOR : 0;
    if (!surface) continue;
    if (!Array.isArray(runs) || runs.length % 3) throw Error('Invalid Dreame pixel runs.');
    for (let i=0; i<runs.length; i+=3) {
      const x=runs[i], y=runs[i+1], count=runs[i+2];
      if (![x,y,count].every(Number.isSafeInteger) || x<0 || y<0 || y>=height || count<1 || x+count>width) throw Error('Invalid Dreame pixel run.');
      const start=(height-1-y)*width+x;
      cells.fill(surface,start,start+count);
    }
  }
  let minX=width,minY=height,maxX=0,maxY=0;
  const stride = width+1, boundaries = new Map();
  for (let y=0; y<height; y++) for (let x=0; x<width; x++) {
    const i=y*width+x, id=cells[i];
    if (!id) continue;
    minX=Math.min(minX,x); maxX=Math.max(maxX,x+1);
    minY=Math.min(minY,y); maxY=Math.max(maxY,y+1);
    if (!boundaries.has(id)) boundaries.set(id,new Set());
    const edges=boundaries.get(id), v=y*stride+x;
    if (!y || cells[i-width]!==id) edges.add(v*4);
    if (x===width-1 || cells[i+1]!==id) edges.add((v+1)*4+1);
    if (y===height-1 || cells[i+width]!==id) edges.add((v+stride+1)*4+2);
    if (!x || cells[i-1]!==id) edges.add((v+stride)*4+3);
  }
  // The shared scene uses approximately 50 mm per map unit.
  const unit=grid/50, floors=[], walls=[], bindings=new Map(), labels=new Map();
  for (const [id,edges] of boundaries) {
    const path=trace(edges,stride,unit);
    if (id===WALL) walls.push(path);
    else {
      floors.push(path);
      if (rooms.has(id)) { bindings.set(path,id); labels.set(id,rooms.get(id)); }
    }
  }
  if (!labels.size || !walls.length) throw Error('No mapped Dreame rooms or walls yet.');
  const position = point => Array.isArray(point) && point.length >= 2 && point.slice(0,2).every(Number.isFinite)
    ? [(point[0]-left)/50, (height*grid-1-(point[1]-top))/50] : null;
  const box=[minX*unit,minY*unit,(maxX-minX)*unit,(maxY-minY)*unit];
  const trail = [];
  for (const section of map.path || []) {
    if (!Array.isArray(section) || section.length < 5 || section.length % 2 !== 1) continue;
    const commands = [];
    for (let i=1; i<section.length; i+=2) {
      const point = position([section[i],section[i+1]]);
      if (!point) break;
      // The viewer stores trail paths at five times scene scale with y pointing up.
      commands.push((i===1 ? 'M' : 'L') + point[0]*5 + ' ' + -point[1]*5);
    }
    if (commands.length > 1) trail.push(commands.join(''));
  }
  const parsed=makeMap(box,floors,walls,position(map.robot_position),position(map.charger_position),trail.join(''));
  // Two floors may have identical outlines yet use different IDs for cleaning.
  parsed.geometryId='dreame-'+JSON.stringify([map.saved_map_id ?? map.map_id, left, top, [...labels.keys()], parsed.geometryId]);
  let currentRoom = null;
  if (parsed.overlay.xy) {
    const [x,y] = parsed.overlay.xy.map(n=>Math.floor(n/unit));
    if (x>=0 && x<width && y>=0 && y<height) {
      const id = cells[y*width+x];
      if (labels.has(id)) currentRoom = id;
    }
  }
  const completed = Array.isArray(map.completed_segments)
    ? [...new Set(map.completed_segments.filter(id=>labels.has(id)))] : [];
  return {...parsed,bindings,labels,currentRoom,completed};
}
