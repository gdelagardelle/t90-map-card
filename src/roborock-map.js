// Stock V1 renderer colors, indexed by native segment number. Some repeat.
const palette = [0xf0b27a,0x85c1e9,0xd98880,0x3498db,0xcd6155,0xf39c12,0x58d68d,0xf5b041,
  0xfcd451,0x48c9b0,0x5499c7,0x85c1e9,0xf5b041,0x52be80,0x48c9b0,0xa569bd];

export function roomColors(rooms) {
  const matches = new Map();
  for (const {id} of rooms) {
    // Unknown segment numbering makes palette-based selection ambiguous.
    if (id < 1 || id > 32) return new Map();
    const color = palette[(id-1)%16];
    matches.set(color, matches.has(color) ? null : id);
  }
  return matches;
}

export async function getRoborockFloor(hass, entity) {
  const result = await hass.callWS({type:'call_service',domain:'roborock',service:'get_maps',
    target:{entity_id:entity},service_data:{},return_response:true});
  const maps = result?.response?.[entity]?.maps;
  if (!Array.isArray(maps) || maps.length !== 1) throw Error('Room cleaning requires one saved Roborock floor.');
  const {flag,rooms} = maps[0];
  if (!Number.isSafeInteger(flag) || !rooms || typeof rooms !== 'object' || Array.isArray(rooms))
    throw Error('Roborock did not report room IDs for this floor.');
  const entries = Object.entries(rooms).map(([key,name]) => {
    const id = Number(key);
    if (!Number.isSafeInteger(id) || id <= 0 || String(id) !== key) throw Error('Invalid Roborock room ID.');
    return {id,name:typeof name === 'string' && name.trim() ? name : 'Room '+id};
  });
  if (!entries.length) throw Error('Roborock has not named any rooms on this floor.');
  return {flag, rooms:entries};
}

export async function readRoborockImage(response) {
  const blob = await response.blob();
  if (blob.size > 12000000 || blob.size < 33) throw Error('Unsupported Roborock map size.');
  // Some HA versions serve a PNG with an image/jpeg content type.
  const header = new DataView(await blob.slice(0,24).arrayBuffer());
  if (header.getUint32(0) !== 0x89504e47 || header.getUint32(4) !== 0x0d0a1a0a ||
      header.getUint32(12) !== 0x49484452) throw Error('Expected the native Roborock PNG map.');
  const width = header.getUint32(16), height = header.getUint32(20);
  if (!width || !height || width > 4096 || height > 4096 || width*height > 8000000)
    throw Error('Roborock map dimensions exceed the viewer limit.');
  return blob.slice(0,blob.size,'image/png');
}
