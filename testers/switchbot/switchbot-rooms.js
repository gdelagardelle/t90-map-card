// Room-capable Home Assistant entity contracts from jaco/switchbot-vacuum.
// The official switchbot_cloud platform provides no equivalent room action.
export function isHassConnected(hass) {
  return !!hass && hass.connected !== false && hass.connection?.connected !== false;
}

export function getRoomTargets(hass, entityId, enabled) {
  if (!isHassConnected(hass) || enabled !== true || !entityId?.startsWith('vacuum.') || !hass?.services?.switchbot_vacuum?.clean_rooms) return [];
  const entry = hass.entities?.[entityId];
  if (entry?.platform !== 'switchbot_vacuum' || !entry.device_id) return [];
  const vacuum = hass.states?.[entityId];
  const attributes = vacuum?.attributes;
  if (!attributes || ['unknown', 'unavailable'].includes(vacuum.state)) return [];
  const model = hass.devices?.[entry.device_id]?.model;
  // Older K10+ releases and K10+ Pro can translate clean_rooms into a
  // whole-home clean. Only the K10+ room-aware implementation supplies
  // the mopping_pad_installed attribute (including null when unknown).
  const s10 = model === 'Floor Cleaning Robot S10';
  const k10 = model === 'Mini Robot Vacuum K10+' && Object.hasOwn(attributes, 'mopping_pad_installed');
  if (!s10 && !k10) return [];
  const rooms = attributes.rooms;
  if (!rooms || typeof rooms !== 'object' || Array.isArray(rooms)) return [];
  const validId = s10 ? /^ROOM_\S+$/ : /^room\d+$/;
  return Object.entries(rooms)
    .filter(([id, name]) => validId.test(id) && typeof name === 'string')
    .map(([id, name]) => ({id, name: name.trim() || id}));
}

export async function startRoomCleaning(hass, entityId, enabled, selectedIds) {
  const available = new Set(getRoomTargets(hass, entityId, enabled).map(room => room.id));
  if (!Array.isArray(selectedIds) && !(selectedIds instanceof Set)) throw Error('Select a room to clean.');
  const rooms = [...new Set(selectedIds)];
  if (!rooms.length || !rooms.every(id => available.has(id))) {
    throw Error('The selected rooms are unavailable. Check the current room list and select again.');
  }
  return hass.callService('switchbot_vacuum', 'clean_rooms', {rooms}, {entity_id: entityId});
}
