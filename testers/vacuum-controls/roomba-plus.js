import {ShapeUtils, Vector2} from "three";

// Rooms Map image attributes and clean_room contract from Roomba+ v4.6.5.
// Classic images expose region_id. Prime images use the native id as their key.
const cache = new WeakMap();
let floorSequence = 0;
const available = state => !!state && !["unknown", "unavailable"].includes(state.state);
const finitePair = p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);

// The image's three anchors define the display orientation in both Classic
// coordinate frames (including pending alignment), and in Prime's native frame.
function imageProjection(anchors) {
  if (!Array.isArray(anchors) || anchors.length !== 3) return null;
  const pairs = anchors.map(a => [a?.vacuum?.x, a?.vacuum?.y, a?.map?.x, a?.map?.y]);
  if (!pairs.every(row => row.every(Number.isFinite))) return null;
  const [origin, a, b] = pairs;
  const dx1=a[0]-origin[0], dy1=a[1]-origin[1], dx2=b[0]-origin[0], dy2=b[1]-origin[1];
  const det=dx1*dy2-dx2*dy1;
  if (!Number.isFinite(det) || Math.abs(det)<1e-10) return null;
  return ([x,y]) => {
    const dx=x-origin[0], dy=y-origin[1];
    const u=(dx*dy2-dy*dx2)/det, v=(dx1*dy-dy1*dx)/det;
    return [origin[2]+u*(a[2]-origin[2])+v*(b[2]-origin[2]),
      origin[3]+u*(a[3]-origin[3])+v*(b[3]-origin[3])];
  };
}

function nativeId(key, room) {
  if (typeof room.region_id === "string" && room.region_id.trim()) return room.region_id;
  // Classic room_id is just a display-name slug; never send it as a native ID.
  if (typeof room.room_id === "string" && key === room.room_id && key !== room.name) return key;
  return null;
}

function decode(attributes, previous) {
  if (!attributes?.rooms || Array.isArray(attributes.rooms) || typeof attributes.rooms !== "object") return null;
  const entries=Object.entries(attributes.rooms);
  if (!entries.length || entries.length>60) return null;
  const projection=imageProjection(attributes.calibration_points);
  const shapes=[];
  for (const [key, room] of entries) {
    if (typeof room?.name !== "string" || !room.name.trim() || !Array.isArray(room.outline)) return null;
    const ring=room.outline;
    if (ring.length<3 || ring.length>129 || !ring.every(finitePair)) return null;
    const points=ring.map(p=>projection?projection(p):[...p]);
    const first=points[0], last=points.at(-1);
    if (first[0]===last[0] && first[1]===last[1]) points.pop();
    if (points.length<3 || points.length>128 || !points.every(p=>p.every(n=>Number.isFinite(n) && Math.abs(n)<=1e6))) return null;
    const contour=points.map(([x,y])=>new Vector2(x,y));
    if (Math.abs(ShapeUtils.area(contour))<1e-8 || ShapeUtils.triangulateShape(contour,[]).length!==points.length-2) return null;
    shapes.push({name:room.name,points,source:nativeId(key,room),outline:ring});
  }
  // Every room selection is scoped to this complete native map. A floor
  // swap must invalidate it even if one room happens to have the same ID.
  const signature=JSON.stringify(shapes.map(({name,source,outline})=>[name,source,outline]));
  if (previous?.signature === signature && previous.calibration === JSON.stringify(attributes.calibration_points)) return previous;
  const token=previous?.signature===signature ? previous.token : ++floorSequence;
  const names=new Map(), ids=new Map();
  for (const room of shapes) {
    const name=room.name.trim().toLowerCase();
    names.set(name,(names.get(name)||0)+1);
    ids.set(room.source,(ids.get(room.source)||0)+1);
  }
  const targets=[];
  for (const room of shapes) {
    const name=room.name.trim().toLowerCase(), id=room.source?.toLowerCase();
    // The integration resolves names before IDs. An ambiguous name/ID must
    // stay presentation-only; the card cannot identify the backend target.
    if (room.source && ids.get(room.source)===1 && names.get(name)===1 && (!names.has(id)||id===name)) {
      room.room_id=JSON.stringify([token,room.source]);
      targets.push({id:room.room_id,name:room.name,source:room.source});
    } else {
      room.room_id=null;
    }
  }
  const rooms=shapes.map(({name,points,room_id})=>({name,points,room_id}));
  return {signature,token,calibration:JSON.stringify(attributes.calibration_points),floor:{rooms,sourceLabel:"Roomba+ Rooms Map"},targets};
}

function roomMap(hass, vacuumId, imageId, fresh = false) {
  if (!vacuumId?.startsWith("vacuum.") || !imageId?.startsWith("image.")) return null;
  const robot=hass?.entities?.[vacuumId], image=hass?.entities?.[imageId];
  if (robot?.platform!=="roomba_plus" || image?.platform!=="roomba_plus" || !robot.device_id ||
      image.device_id!==robot.device_id || image.translation_key!=="rooms_map") return null;
  const state=hass.states?.[imageId];
  if (!available(state)) {
    cache.delete(image);
    return null;
  }
  const cached=cache.get(image);
  if (!fresh && cached?.state===state) return cached.data;
  const data=decode(state.attributes,cached?.data);
  cache.set(image,{state,data});
  return data;
}

export function getRoombaFloor(hass,vacuumId,imageId) {
  return roomMap(hass,vacuumId,imageId)?.floor || null;
}

export function getRoombaRoomTargets(hass,vacuumId,imageId) {
  if (!available(hass?.states?.[vacuumId]) || hass.connected===false || hass.connection?.connected===false ||
      !hass.services?.roomba_plus?.clean_room) return [];
  return (roomMap(hass,vacuumId,imageId)?.targets || []).map(({id,name})=>({id,name}));
}

export async function startRoombaRooms(hass,vacuumId,imageId,selectedIds) {
  roomMap(hass,vacuumId,imageId,true);
  const availableIds=new Set(getRoombaRoomTargets(hass,vacuumId,imageId).map(room=>room.id));
  const selected=Array.isArray(selectedIds) || selectedIds instanceof Set ? [...new Set(selectedIds)] : [];
  if (!selected.length || !selected.every(id=>availableIds.has(id))) throw Error("The Roomba room selection changed. Select the current rooms again.");
  const targets=new Map(roomMap(hass,vacuumId,imageId).targets.map(room=>[room.id,room.source]));
  return hass.callService("roomba_plus","clean_room",{room_name:selected.map(id=>targets.get(id)),ordered:true},{entity_id:vacuumId});
}
