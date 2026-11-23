import assert from 'node:assert/strict';
import {lastRecordedRun,lastDeviceReport,newestClean} from '../src/card-clean-history.js';

const now=Date.now(), vacuum='vacuum.fictional';
const iso=t=>new Date(t).toISOString();
function rows(states){
  return [states.map((state,i)=>({entity_id:vacuum,state,last_changed:iso(now-60000*(states.length-i))}))];
}
const history=lastRecordedRun(rows(['docked','cleaning','paused','cleaning','returning','docked']),vacuum,now);
assert.equal(history.durationMinutes,4);
assert.equal(history.endState,'docked');
assert.equal(history.outcome,null);
assert.equal(history.route,null);
assert.equal(history.requestedRooms,null);
assert.equal(lastRecordedRun(rows(['docked','cleaning','unavailable','docked']),vacuum,now),null);
assert.equal(lastRecordedRun(rows(['cleaning','docked']),vacuum,now).durationMinutes,null);
assert.equal(lastRecordedRun(rows(['cleaning','returning']),vacuum,now),null);
assert.equal(lastRecordedRun(rows(['docked','cleaning','docked']),'vacuum.other',now),null);
const rr=lastDeviceReport(true,(_,k)=>({state:iso(now-(k==='last_clean_start'?300000:1000))}),now);
assert.ok(rr.durationMinutes>4.9 && rr.durationMinutes<5);
assert.equal(rr.route,null);
assert.equal(lastDeviceReport(false,()=>({state:'unknown',attributes:{event_type:'finished'}}),now),null);
assert.equal(lastDeviceReport(false,()=>({state:iso(now),attributes:{event_type:'cleaning'}}),now),null);
assert.equal(lastDeviceReport(false,()=>({state:iso(now),attributes:{event_type:'manually_stopped'}}),now).outcome,'manually_stopped');
const local={firstSeenAt:now-350000,endedAt:now-5000,route:{},requestedRooms:['Kitchen']};
assert.equal(newestClean(local,rr).route,local.route);
assert.equal(newestClean(local,{...rr,startedAt:now-4000}).route,null);
console.log('Passed device and recorder last-job timestamps, gaps, elapsed time, and separate room/route attribution.');
