import {CleanHistory} from './clean-history.js';

const jobOutcomes = new Set(['finished','finished_with_warnings','manually_stopped']);
const timeUnits = {s:1/60,min:1,h:60};
const areaUnits = {'m²':1,'ft²':0.09290304};

function timestamp(value, now) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT/.test(value)) return null;
  const time = Date.parse(value);
  return Number.isFinite(time) && time > 0 && time <= now + 1000 ? time : null;
}

function measure(entity, factors, since, now) {
  if (!entity || !Number.isFinite(since)) return null;
  const updated = timestamp(entity.last_updated || entity.last_changed,now);
  const factor = factors[entity.attributes?.unit_of_measurement];
  const raw = entity.state;
  const number = Number(raw);
  if (updated === null || updated < since || typeof factor !== 'number' || raw == null ||
      String(raw).trim() === '' || !Number.isFinite(number) || number < 0) return null;
  return number * factor;
}

// The timestamp on a last-job event belongs to the device. The current map and
// cleaning-time sensors may already belong to a later job on another floor.
export function lastDeviceReport(roborock, read, now) {
  const job = roborock ? read('sensor','last_clean_end') : read('event','last_job');
  const endedAt = timestamp(job?.state,now);
  if (endedAt === null) return null;
  const outcome = roborock ? null : job?.attributes?.event_type;
  if (!roborock && !jobOutcomes.has(outcome)) return null;
  const begin = roborock ? timestamp(read('sensor','last_clean_start')?.state,now) : null;
  const startedAt = begin !== null && begin <= endedAt ? begin : null;
  return {deviceReportOnly:true, firstSeenAt:null, lastSeenAt:null, startedAt, endedAt,
    partial:true, endState:null, outcome, durationMinutes:startedAt===null ? null : (endedAt-startedAt)/60000,
    areaM2:null, requestedRooms:null, reportedRooms:[], route:null};
}

// Only build an interval from an observed transition into cleaning followed by
// an explicit terminal state. A gap in the recorder cannot join two jobs.
export function lastRecordedRun(groups, vacuum, now) {
  if (!Array.isArray(groups) || groups.length !== 1 || !Array.isArray(groups[0])) return null;
  const rows=groups[0];
  if (!rows.length || rows.length>10000 || rows[0].entity_id!==vacuum) return null;
  let active, last, previous, lastAt=0;
  for (const row of rows) {
    const at=timestamp(row?.last_changed,now), state=row?.state;
    if (row?.entity_id && row.entity_id!==vacuum || at===null || at<lastAt) return null;
    lastAt=at;
    if (state===previous) continue;
    if (state==='cleaning') {
      if (!active) active={startedAt:['docked','idle','charging'].includes(previous)?at:null};
    } else if (['idle','docked','charging','error'].includes(state)) {
      if (active) {
        last={deviceReportOnly:true,recorderOnly:true,firstSeenAt:null,lastSeenAt:null,
          ...active,endedAt:at,partial:true,endState:state,outcome:null,areaM2:null,
          durationMinutes:active.startedAt===null?null:(at-active.startedAt)/60000,
          requestedRooms:null,reportedRooms:[],route:null};
        active=null;
      }
    } else if (state!=='paused' && state!=='returning') active=null;
    previous=state;
  }
  return last ?? null;
}

export function newestClean(local, device) {
  if (!local) return device;
  if (!device || device.endedAt <= local.endedAt) return local;
  // The final event can arrive after docking. A second job with its own
  // later start is distinct even when the two runs are close together.
  const sameRun = local.jobAt === device.endedAt ||
    device.endedAt - local.endedAt <= 30000 &&
    (device.startedAt == null || device.startedAt <= local.endedAt);
  if (!sameRun) return device;
  return {...local, outcome:device.outcome ?? local.outcome};
}

export function mountCardHistory(card) {
  let history, scope, attachment, sensorIds, registry, recorder, lastLookup=0, readToken;
  function read(domain,key) {
    if (registry !== card.h.entities || !sensorIds) {
      registry = card.h.entities;
      sensorIds = new Map();
    }
    const lookup = domain + '.' + key;
    if (!sensorIds.has(lookup)) sensorIds.set(lookup,card.id(domain,key));
    const id = sensorIds.get(lookup);
    return id ? card.h.states[id] : undefined;
  }
  function suspend() {
    history?.observe({connected:false});
    card.lastCleanPanel?.stop();
  }
  function detach() {
    suspend();
    history?.dispose();
    history = null;
    readToken = null;
    lastLookup = 0;
  }
  function resume() {
    if (history || !scope || scope === 'unconfirmed') return;
    let storage;
    try { storage = window.localStorage; } catch { /* Storage can be disabled. */ }
    history = new CleanHistory({storage, source:card.roborock?'roborock':'ecovacs', vacuum:card.vacuum, scope});
  }
  function attach(floor) {
    detach();
    scope = floor;
    resume();
    const owner = attachment = {};
    return {onHistoryRoute(snapshot) {
      if (owner === attachment && floor === card.scope && card.isConnected && !document.hidden &&
          card.h?.connected !== false && card.h?.connection?.connected !== false) history?.acceptRoute(snapshot);
    }};
  }
  function refreshRecorder(device,now) {
    if (!history || !card.h.callApi || readToken || document.hidden ||
        card.h.connected===false || card.h.connection?.connected===false ||
        now-lastLookup < 30*60000) return;
    lastLookup=now;
    if (Math.max(history.last?.endedAt || 0,device?.endedAt || 0)>now-30*60000) return;
    const token=readToken={}, vacuum=card.vacuum;
    const begin=new Date(now-48*3600000).toISOString();
    // HA defaults to one day after the start if the end of the period is omitted.
    const query=new URLSearchParams({filter_entity_id:vacuum,end_time:new Date(now).toISOString(),
      minimal_response:'',no_attributes:''});
    const path='history/period/'+begin+'?'+query;
    Promise.resolve().then(()=>card.h.callApi('GET',path)).then(rows=>{
      if (token!==readToken || !card.isConnected) return;
      recorder=lastRecordedRun(rows,vacuum,now);
      if (recorder) refresh();
    }).catch(()=>{/* Recorder is optional and may exclude the vacuum. */})
      .finally(()=>{if (readToken===token) readToken=null;});
  }
  function refresh() {
    if (!card.h || !card.isConnected) return;
    const now = Date.now(), robot = card.h.states[card.vacuum];
    const connected = card.h.connected !== false && card.h.connection?.connected !== false;
    const device = lastDeviceReport(card.roborock,read,now);
    if (history && scope === card.scope) {
      const stateSince = timestamp(robot?.last_changed,now);
      const since = robot?.state === 'cleaning' ? stateSince : null;
      const room = card.roborock && since !== null ? read('sensor','current_room')?.state : null;
      history.observe({connected: connected && !document.hidden, state:robot?.state, stateSince,
        jobAt:device?.endedAt, outcome:device?.outcome,
        durationMinutes:measure(read('sensor',card.roborock?'cleaning_time':'stats_time'),timeUnits,since,now),
        areaM2:measure(read('sensor',card.roborock?'cleaning_area':'stats_area'),areaUnits,since,now),
        reportedRooms:room && !['unknown','unavailable','none'].includes(room) ? [room] : []});
    }
    refreshRecorder(device,now);
    // Prefer explicit device results inside the same recorded cleaning interval.
    const deviceIsLatest = device && (!recorder || device.endedAt>=recorder.endedAt ||
      (recorder.startedAt!=null && device.endedAt>=recorder.startedAt));
    const remote = deviceIsLatest ? device : recorder;
    card.lastCleanPanel?.update(newestClean(history?.last,remote));
  }
  // Capture the selection at dispatch. A later room tap, card reconfiguration
  // or rejected service must not attribute rooms to a different cleaning run.
  function target(ids, at) {
    const owner = history, floor = scope;
    const labels = ids.map(id => card.roomLabels?.get(id));
    return () => {
      if (owner && owner === history && floor === card.scope && labels.every(Boolean))
        owner.requestTarget(labels,{at,state:card.h.states[card.vacuum]?.state});
    };
  }
  return {attach,refresh,detach,resume,target};
}
