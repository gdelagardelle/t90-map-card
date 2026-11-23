import assert from 'node:assert/strict';
import {getRoomTargets, startRoomCleaning} from '../switchbot-rooms.js';

const entity = 'vacuum.test';
const calls = [];
const vacuum = {state:'docked',attributes:{rooms:{ROOM_013:'Kitchen', ROOM_002:'Kitchen',invalid:'Spare'}}};
const hass = {
  entities:{[entity]:{device_id:'robot',platform:'switchbot_vacuum'}},
  devices:{robot:{model:'Floor Cleaning Robot S10'}},
  states:{[entity]:vacuum},
  services:{switchbot_vacuum:{clean_rooms:{}}},
  callService:async (...args)=>calls.push(args)
};
const targets = () => getRoomTargets(hass,entity,true);
const clean = (...ids) => startRoomCleaning(hass,entity,true,ids);
assert.deepEqual(getRoomTargets(hass,entity,false),[]);
assert.deepEqual(targets(),[{id:'ROOM_013',name:'Kitchen'},{id:'ROOM_002',name:'Kitchen'}]);
hass.connected=false;
assert.deepEqual(targets(),[]);
await assert.rejects(clean('ROOM_013'));
hass.connected=true;
hass.connection={connected:false};
assert.deepEqual(targets(),[]);
await assert.rejects(clean('ROOM_013'));
hass.connection.connected=true;
await clean('ROOM_002','ROOM_013','ROOM_002');
assert.deepEqual(calls.pop(),['switchbot_vacuum','clean_rooms',{rooms:['ROOM_002','ROOM_013']},{entity_id:entity}]);
delete vacuum.attributes.rooms.ROOM_002;
await assert.rejects(clean('ROOM_013','ROOM_002'));
await assert.rejects(clean());
await assert.rejects(clean('Kitchen'));
hass.entities[entity].platform='switchbot_cloud';
assert.deepEqual(targets(),[]);
hass.entities[entity].platform='switchbot_vacuum';
hass.devices.robot.model='Mini Robot Vacuum K10+';
vacuum.attributes.rooms={room3:'Kitchen',room13:'Office'};
assert.deepEqual(targets(),[]);
await assert.rejects(clean('room3'));
vacuum.attributes.mopping_pad_installed=false;
await clean('room13');
assert.deepEqual(calls.pop(),['switchbot_vacuum','clean_rooms',{rooms:['room13']},{entity_id:entity}]);
for(const state of ['unknown','unavailable']) {vacuum.state=state;await assert.rejects(clean('room3'));}
vacuum.state='idle';
hass.devices.robot.model='Mini Robot Vacuum K10+ Pro';
await assert.rejects(clean('room13'));
hass.devices.robot.model='Floor Cleaning Robot S10';
hass.services={};
assert.deepEqual(targets(),[]);
assert.equal(calls.length,0);
console.log('Room adapter passed S10 and K10+ selection, stale IDs, model/platform/service guards and availability checks.');
