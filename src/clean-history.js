// Private, browser-local records. Each tab writes its own snapshot so a stale
// tab cannot overwrite the only copy of another tab's last clean.
const PREFIX='t90:clean-history:v1:';
const MAX_POINTS=6000, MAX_PARTS=1000, MAX_BYTES=360000;
const MAX_SLOTS=8, GAP=90_000, REQUEST_WINDOW=10*60_000, CHECKPOINT=30_000;
const activeStates=new Set(['cleaning','paused','returning']);
const terminalStates=new Set(['docked','idle','charging','error']);
const outcomes=new Set(['finished','finished_with_warnings','manually_stopped']);
const date=value=>{
  const n=typeof value==='string' && /^\d{4}-\d\d-\d\dT/.test(value) && value.length<=40 ? Date.parse(value) : value;
  return Number.isSafeInteger(n) && n>0 ? n : null;
};
const metric=(value,max)=>Number.isFinite(value) && value>=0 && value<=max ? value : null;
const rooms=value=>Array.isArray(value) ? [...new Set(value.slice(0,32)
  .filter(x=>typeof x==='string' && x.trim()).map(x=>x.trim().slice(0,96)))]:[];
function targetNames(names){
  if(!Array.isArray(names) || names.length>32 || names.some(name=>typeof name!=='string'||!name.trim()))return null;
  return rooms(names);
}
const routeSize=r=>r?.segments.reduce((sum,p)=>sum+p.length,0) || 0;
const samePoint=(a,b)=>a[0]===b[0] && a[1]===b[1];

function rasterAnchor(a){
  if(!a || ![a.width,a.height].every(n=>Number.isInteger(n)&&n>0&&n<=4096) ||
    !Array.isArray(a.points)||!a.points.length||a.points.length>256 ||
    !a.points.every(i=>Number.isInteger(i)&&i>=0&&i<a.width*a.height))return null;
  return {width:a.width,height:a.height,points:[...a.points]};
}
function checkedRoute(value,scope,raster){
  if(!value || value.scope!==scope || value.space!==(raster?'roborock-image':'ecovacs-map') ||
      !Array.isArray(value.segments) || !value.segments.length || value.segments.length>MAX_PARTS)return null;
  const anchor=raster?rasterAnchor(value.anchor):null;
  if(raster ? !anchor : value.anchor!=null)return null;
  const segments=[];
  let count=0;
  for(const line of value.segments){
    if(!Array.isArray(line)||line.length<2||(count+=line.length)>MAX_POINTS)return null;
    const points=[];
    for(const p of line){
      if(!Array.isArray(p)||p.length!==2||!p.every(n=>Number.isFinite(n)&&Math.abs(n)<=1e7))return null;
      if(anchor && (p[0]<0||p[1]<0||p[0]>anchor.width||p[1]>anchor.height))return null;
      points.push(p.map(n=>Math.round(n*1000)/1000));
    }
    segments.push(points);
  }
  return {space:value.space,scope,anchor,segments};
}

function roomRecord(raw,scope,raster){
  const firstSeenAt=date(raw?.firstSeenAt),lastSeenAt=date(raw?.lastSeenAt);
  if(!firstSeenAt || !lastSeenAt || lastSeenAt<firstSeenAt)return null;
  const endedAt=date(raw.endedAt),started=date(raw.startedAt),job=date(raw.jobAt);
  if(endedAt && endedAt<lastSeenAt)return null;
  return {firstSeenAt,lastSeenAt,
    startedAt:started && started<=firstSeenAt?started:null,endedAt,endState:terminalStates.has(raw.endState)?raw.endState:null,
    partial:raster || raw.partial!==false,outcome:job && outcomes.has(raw.outcome)?raw.outcome:null,jobAt:job,
    durationMinutes:metric(raw.durationMinutes,10080),areaM2:metric(raw.areaM2,1e6),
    requestedRooms:date(raw.requestAt)?targetNames(raw.requestedRooms):null,requestAt:date(raw.requestAt),reportedRooms:rooms(raw.reportedRooms),
    route:checkedRoute(raw.route,scope,raster)};
}
function preferEnded(a,b){
  if(!a)return b;if(!b)return a;
  if(a.endedAt!==b.endedAt)return a.endedAt>b.endedAt?a:b;
  const routeOwner=routeSize(a.route)>=routeSize(b.route)?a:b;
  const requested=(a.requestAt??0)>=(b.requestAt??0)?a:b;
  return {...routeOwner, firstSeenAt:Math.min(a.firstSeenAt,b.firstSeenAt),
    lastSeenAt:Math.max(a.lastSeenAt,b.lastSeenAt),startedAt:a.startedAt??b.startedAt,
    outcome:a.outcome??b.outcome,jobAt:a.jobAt??b.jobAt,
    durationMinutes:a.durationMinutes??b.durationMinutes,areaM2:a.areaM2??b.areaM2,
    reportedRooms:rooms([...a.reportedRooms,...b.reportedRooms]),
    requestedRooms:requested.requestedRooms,requestAt:requested.requestAt};
}

export class CleanHistory {
  constructor({storage,source,vacuum,scope,now=Date.now}){
    this.now=now;this.storage=storage;this.scope=scope;this.raster=source==='roborock_qrevo'||source==='roborock';
    this.prefix=PREFIX+JSON.stringify([source,vacuum,scope])+':';
    this.key=this.prefix+(globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2));
    this.last=null;this.active=null;this.intent=null;this.previous=null;this.stamp=0;this.lastWrite=0;
    this.valid=typeof scope==='string' && !!scope && scope!=='unconfirmed' && scope.length<=500 &&
      /^vacuum\.[a-z0-9_]+$/.test(vacuum) && (source==='ecovacs'||this.raster);
    if(!this.valid)return;
    this.restore();
    // Restored records can span a period when no dashboard was observing.
    if(this.previous)this.previous={...this.previous,state:'offline'};
    if(this.active)this.active.partial=true;
    this.storageHandler=e=>{
      if(e.storageArea===this.storage && e.key?.startsWith(this.prefix) && e.key!==this.key && e.newValue)this.merge(e.newValue);
    };
    globalThis.addEventListener?.('storage',this.storageHandler);
  }
  dispose(){
    if(this.dirty)this.persist();
    if(this.storageHandler)globalThis.removeEventListener?.('storage',this.storageHandler);
  }
  restore(){
    try{
      for(let i=0;i<this.storage.length;i++){
        const k=this.storage.key(i);if(k?.startsWith(this.prefix))this.merge(this.storage.getItem(k));
      }
    }catch{/* Storage can be disabled. An in-memory capture still works. */}
  }
  merge(json){
    if(typeof json!=='string'||json.length>MAX_BYTES)return;
    let s;
    try{s=JSON.parse(json);}catch{return;}
    const stamp=date(s?.stamp);
    if(s?.v!==1 || !stamp || stamp>this.now()+3000)return;
    const last=roomRecord(s.last,this.scope,this.raster);
    if(last?.endedAt && last.endedAt<=stamp+3000)this.last=preferEnded(this.last,last);
    if(this.active && this.last && this.active.firstSeenAt<=this.last.endedAt)this.active=null;
    if(stamp<this.stamp)return;
    const candidate=roomRecord(s.active,this.scope,this.raster);
    const same=this.active && candidate && (candidate.firstSeenAt===this.active.firstSeenAt ||
      (candidate.startedAt && candidate.startedAt===this.active.startedAt));
    if(same && this.active.route && JSON.stringify(candidate.route?.anchor??null)===JSON.stringify(this.active.route.anchor) &&
       routeSize(this.active.route)>routeSize(candidate.route))candidate.route=this.active.route;
    if(same && this.active.requestAt && !candidate.requestAt){candidate.requestAt=this.active.requestAt;candidate.requestedRooms=this.active.requestedRooms;}
    if(candidate && !candidate.endedAt && candidate.lastSeenAt<=stamp+3000 &&
       candidate.firstSeenAt>(this.last?.endedAt??0))this.active=candidate;
    const p=s.previous;
    this.previous=p && date(p.at) && date(p.at)<=stamp+3000 && (activeStates.has(p.state)||terminalStates.has(p.state)||p.state==='offline')
      ?{at:date(p.at),state:p.state,since:date(p.since)}:null;
    const at=date(s.intent?.at);
    this.intent=at && at<=stamp+1000 && this.now()-at<REQUEST_WINDOW && targetNames(s.intent.rooms)
      ? {at,rooms:targetNames(s.intent.rooms)}:null;
    this.stamp=stamp;
  }
  prune(){
    const keys=[];
    for(let i=0;i<this.storage.length;i++){
      const k=this.storage.key(i);if(!k?.startsWith(PREFIX)||k===this.key)continue;
      let t=0;
      try{const raw=this.storage.getItem(k);if(raw?.length<=MAX_BYTES)t=date(JSON.parse(raw).stamp)||0;}catch{}
      keys.push({t,k,group:k.slice(0,k.lastIndexOf(':')+1)});
    }
    keys.sort((a,b)=>b.t-a.t);
    const seen=new Set([this.prefix]), distinct=[], redundant=[];
    for(const entry of keys){
      (seen.has(entry.group)?redundant:distinct).push(entry);seen.add(entry.group);
    }
    for(const {k} of [...distinct,...redundant].slice(MAX_SLOTS-1))this.storage.removeItem(k);
  }
  persist(){
    if(!this.valid)return;
    this.dirty=false;
    const t=this.now();this.stamp=t;
    try{
      const data={v:1,stamp:t,previous:this.previous,intent:this.intent,last:this.last,active:this.active};
      let raw=JSON.stringify(data);
      if(raw.length>MAX_BYTES && data.active){
        data.active={...data.active,partial:true,route:null};raw=JSON.stringify(data);
      }
      if(raw.length>MAX_BYTES && data.last){
        data.last={...data.last,partial:true,route:null};raw=JSON.stringify(data);
      }
      const newSlot=!this.lastWrite || this.storage.getItem(this.key)===null;
      this.storage.setItem(this.key,raw);this.lastWrite=t;
      if(newSlot)this.prune();
    }catch{/* Incognito, quota or blocked storage: keep the in-memory result. */}
  }
  requestTarget(names,{at=this.now(),state}={}){
    const t=this.now();at=date(at);
    if(!this.valid||!at||at>t+1000||t-at>REQUEST_WINDOW||!Array.isArray(names))return;
    if((this.intent?.at??0)>=at||(this.last?.requestAt??0)>=at||(this.active?.requestAt??0)>=at)return;
    const labels=targetNames(names),run=this.active;
    if(!labels)return;
    const ended=this.last;
    if(!run && ended && at<=ended.firstSeenAt+1500 && ended.firstSeenAt-at<=REQUEST_WINDOW && at<ended.endedAt){
      ended.requestedRooms=labels;ended.requestAt=at;this.persist();return;
    }
    if(run && at<=run.firstSeenAt+1500 && run.firstSeenAt-at<=REQUEST_WINDOW){
      run.requestedRooms=labels;run.requestAt=at;this.intent=null;
    } else if(!run || !activeStates.has(state)){
      this.intent={at,rooms:labels};
    } else return;
    this.persist();
  }
  acceptRoute(value){
    if(!this.active || !this.valid)return false;
    if(this.raster && this.active.route && value?.scope===this.scope && value.space==='roborock-image' &&
        Array.isArray(value.segments) && !value.segments.length){
      const anchor=rasterAnchor(value.anchor);
      if(anchor && JSON.stringify(anchor)!==JSON.stringify(this.active.route.anchor)){
        this.active.route=null;this.active.partial=true;this.persist();return true;
      }
    }
    const next=checkedRoute(value,this.scope,this.raster);
    if(!next)return false;
    const run=this.active,old=run.route;
    if(value.partial===true)run.partial=true;
    if(old && JSON.stringify(old.anchor)===JSON.stringify(next.anchor)){
      const parts=old.segments;
      // The renderer replaces its current trace. A new first point following
      // a reload or observation gap starts a distinct subpath.
      const first=next.segments[0][0];
      let at=0;
      if(!samePoint(parts[0][0],first)){
        at=parts.findIndex(p=>samePoint(p[0],first));if(at<0)at=parts.length;
      }
      if(at<parts.length && next.segments.length<=parts.length-at){
        // Ignore a delayed shorter publication when every incoming point is
        // already captured. Do not compare length alone: a route can turn.
        const prefix=next.segments.every((line,i)=>line.length<=parts[at+i].length &&
          line.every((point,j)=>samePoint(point,parts[at+i][j])));
        if(prefix)return false;
      }
      if(at){
        const merged=[...parts.slice(0,at),...next.segments];
        const size=merged.reduce((n,line)=>n+line.length,0);
        if(size<=MAX_POINTS && merged.length<=MAX_PARTS)next.segments=merged;
        else run.partial=true;
      }
    } else if(old)run.partial=true;
    run.route=next;this.dirty=true;
    if(this.now()-this.lastWrite>=CHECKPOINT)this.persist();
    return true;
  }
  metrics(run,sample){
    const mins=metric(sample.durationMinutes,10080),area=metric(sample.areaM2,1e6);
    if(mins!==null)run.durationMinutes=mins;
    if(area!==null)run.areaM2=area;
    if(Array.isArray(sample.reportedRooms))run.reportedRooms=rooms([...run.reportedRooms,...rooms(sample.reportedRooms)]);
  }
  job(run,sample,t){
    const at=date(sample.jobAt);
    if(!run||!at||at<(run.startedAt??run.firstSeenAt)||at>t+3000 || at<(run.jobAt??0))return false;
    // A later unrelated job must not be attached to a record that was already closed.
    if(run.endedAt && (at>run.endedAt+GAP || (run.jobAt && at!==run.jobAt)))return false;
    run.jobAt=at;
    if(outcomes.has(sample.outcome))run.outcome=sample.outcome;
    return true;
  }
  finish(at,endState){
    const run=this.active;
    run.endedAt=Math.max(run.firstSeenAt,at);run.endState=endState;
    this.last=preferEnded(this.last,run);this.active=null;
  }
  observe(sample={}){
    if(!this.valid || !sample)return this.last;
    const t=this.now(),state=sample.connected===false?'offline':sample.state;
    if(Array.isArray(sample.requestedRooms)&&date(sample.requestAt))this.requestTarget(sample.requestedRooms,{at:sample.requestAt,state});
    if(this.intent && t-this.intent.at>REQUEST_WINDOW)this.intent=null;
    const since=date(sample.stateSince),p=this.previous;
    if(p && (t<p.at || (state!==p.state && since && p.since && since<p.since)))return this.last;
    if(state==='offline'||(!activeStates.has(state)&&!terminalStates.has(state))){
      if(!this.active){
        this.previous={state:'offline',at:t,since:p?.since??null};return this.last;
      }
      this.active.partial=true;this.previous={state:'offline',at:t,since:p?.since??null};
      if(p?.state!=='offline')this.persist();
      return this.last;
    }
    const gap=!p || t-p.at>GAP || p.state==='offline';
    const changed=state!==p?.state;
    let important=changed;
    if(this.active && gap)this.active.partial=true;
    // Across a blind interval only an unchanged, dated active phase ties the
    // two observations together. A later unrelated job can already have ended.
    const longBlind=this.active && gap && t-this.active.lastSeenAt>GAP;
    if(this.active && gap && activeStates.has(state) &&
       ((since && p?.since && since!==p.since) || (longBlind && (!since || !p?.since)))){
      this.finish(this.active.lastSeenAt,null);important=true;
    }
    if(longBlind && this.active && terminalStates.has(state) && !sample.continuing &&
       (!since || since<this.active.lastSeenAt || since>this.active.lastSeenAt+GAP)){
      this.finish(this.active.lastSeenAt,null);important=true;
    }
    if(state==='cleaning'){
      if(!this.active){
        if(this.last && since && since<this.last.endedAt)return this.last;
        const observedStart=!gap && terminalStates.has(p.state) && since && since>=p.at-1000 && since<=t+1000;
        this.active=roomRecord({firstSeenAt:t,lastSeenAt:t,startedAt:observedStart?since:null,partial:!observedStart},this.scope,this.raster);
        if(this.intent && this.intent.at<=t && t-this.intent.at<=REQUEST_WINDOW){
          this.active.requestedRooms=this.intent.rooms;this.active.requestAt=this.intent.at;this.intent=null;
        }
        important=true;
      }
    }
    const run=this.active;
    if(run){
      if(sample.route)this.acceptRoute(sample.route);
      const report=this.job(run,sample,t);
      if(activeStates.has(state)||sample.continuing===true){
        run.lastSeenAt=t;this.metrics(run,sample);
      }else{
        if(report)this.metrics(run,sample);
        const ended=since && since>=run.lastSeenAt && since<=t?since:gap?run.lastSeenAt:t;
        this.finish(ended,state);important=true;
      }
    }else if(terminalStates.has(state) && this.last){
      const before=this.last.jobAt,oldOutcome=this.last.outcome;
      if(this.job(this.last,sample,t)){
        this.metrics(this.last,sample);important ||= this.last.jobAt!==before || oldOutcome!==this.last.outcome;
      }
    }
    this.previous={state,at:t,since};this.dirty=true;
    if(important || (this.active && t-this.lastWrite>=CHECKPOINT))this.persist();
    return this.last;
  }
}
