import styles from './last-clean-panel.css';

const restful = new Set(['idle','docked','charging']);
const friendly = value => value?.replaceAll('_',' ').replace(/^./,ch=>ch.toUpperCase());
const numeric = value => typeof value==='number' && Number.isFinite(value);
const minutes = n => n>0 && n<1 ? '<1 min' : Math.round(n) + ' min';

export function mountLastClean(card) {
  const panel = document.createElement('section');
  panel.className='last-clean';
  panel.setAttribute('aria-label','Last clean');
  panel.innerHTML = `<style>${styles}</style><div class="lc-head"><details>
    <summary><span class="lc-heading">Last clean</span><span class="lc-summary"></span></summary>
    <dl></dl></details><button type="button" class="lc-replay" hidden>Replay route</button></div>
    <p class="lc-availability"></p></section>`;
  card.ui.prepend(panel);
  const banner = document.createElement('div');
  banner.className='lc-banner';
  banner.hidden=true;
  banner.innerHTML='<div><strong>Last clean replay</strong><span class="lc-replay-info"></span></div><button type="button">Return to live map</button>';
  card.q('.map-row').before(banner);

  const summary=panel.querySelector('.lc-summary'), details=panel.querySelector('details');
  const facts=panel.querySelector('dl'), replay=panel.querySelector('.lc-replay');
  const availability=panel.querySelector('.lc-availability'), back=banner.querySelector('button');
  const info=banner.querySelector('.lc-replay-info');
  let record=null, active=false, observedViewer, watch, observedButton, hookedHost, previousHandler, failure='', lastDetailsKey='';
  const frame=card.frame;
  const timestamp = ms => {
    if (!numeric(ms)) return '';
    const options={month:'short',day:'numeric',hour:'numeric',minute:'2-digit'};
    if(card.h?.config?.time_zone)options.timeZone=card.h.config.time_zone;
    try {return new Intl.DateTimeFormat(card.h?.locale?.language,options).format(ms);}
    catch {return new Date(ms).toLocaleString();}
  };
  function blockReason() {
    if (!record?.route || record.deviceReportOnly) return '';
    if (record.route.scope!==card.scope) return 'Open the recorded floor to replay its route.';
    if (!card.mapReady || !frame.contentWindow?.t90ReplayHistory) return 'Waiting for the 3D map.';
    if (!card.h || card.h.connected===false || card.h.connection?.connected===false || !restful.has(card.h.states?.[card.vacuum]?.state))
      return 'Replay is available when the robot is idle or docked.';
    const doc=frame.contentDocument, viewer=doc?.querySelector('.viewer');
    if (viewer?.classList.contains('show-source') || viewer?.dataset.camera==='scan') return 'Switch to the 3D map to replay.';
    if (viewer?.parentElement?.dataset.editing==='true' || viewer?.dataset.wallEditing==='true' ||
        viewer?.dataset.furnishingEditing==='true' || doc?.querySelector('.rr-edit[aria-expanded="true"]')) return 'Finish editing to replay.';
    return '';
  }
  function visibility() {
    if (active && blockReason()) {stop();return;}
    const hasRoute=!!record?.route && !record.deviceReportOnly;
    const reason=hasRoute ? blockReason() : '';
    replay.hidden=!hasRoute || active;
    replay.disabled=!!reason;
    banner.hidden=!active;
    info.textContent=active ? (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'Showing the recorded route' : 'Playing the recorded route') : '';
    const message = active ? '' : failure || reason;
    availability.textContent=message;
    availability.hidden=!message;
  }
  function hookScene() {
    const doc=frame.contentDocument, viewer=doc?.querySelector('.viewer'), edit=doc?.querySelector('.rr-edit');
    if(viewer!==observedViewer || edit!==observedButton){
      watch?.disconnect(); observedViewer=viewer; observedButton=edit;
      if(viewer){
        watch=new MutationObserver(visibility);
        watch.observe(viewer,{attributes:true,attributeFilter:['class','data-camera','data-wall-editing','data-furnishing-editing']});
        if(viewer.parentElement)watch.observe(viewer.parentElement,{attributes:true,attributeFilter:['data-editing']});
        if(edit)watch.observe(edit,{attributes:true,attributeFilter:['aria-expanded']});
      }
    }
  }
  function unhookPlayback(){
    if(hookedHost?.onHistoryPlayback===changed)hookedHost.onHistoryPlayback=previousHandler;
    hookedHost=null;previousHandler=undefined;
  }
  function changed(value) {
    previousHandler?.(value);
    if (!value) unhookPlayback();
    const restoreFocus=!value && banner.contains(banner.getRootNode().activeElement);
    active=!!value;
    visibility();
    if(restoreFocus&&!replay.hidden&&!replay.disabled)replay.focus({preventScroll:true});
  }
  function stop() {
    if(active){
      active=false;
      frame.contentWindow?.t90StopHistoryReplay?.();
    }
    unhookPlayback();visibility();
  }
  function update(next) {
    if(active && (!next || next.endedAt!==record?.endedAt || next.route?.scope!==record?.route?.scope))stop();
    if(next?.endedAt!==record?.endedAt || next?.route!==record?.route)failure='';
    record=next;
    hookScene();
    const ended=timestamp(record?.endedAt);
    const observed=record && !record.deviceReportOnly && numeric(record.firstSeenAt) && numeric(record.lastSeenAt) && record.lastSeenAt>=record.firstSeenAt ? (record.lastSeenAt-record.firstSeenAt)/60000 : null;
    const duration=numeric(record?.durationMinutes) ? minutes(record.durationMinutes) : numeric(observed) ? minutes(observed)+' observed' : '';
    const source=record?.recorderOnly ? 'Home Assistant history' : record?.deviceReportOnly ? 'Robot report' : '';
    const when=ended ? [source,ended,duration].filter(Boolean).join(' · ') : 'No clean recorded yet';
    if(summary.textContent!==when)summary.textContent=when;
    const rows=[];
    if(record) {
      if(record.deviceReportOnly)rows.push(['Source',source+' · floor unverified']);
      if(numeric(record.durationMinutes))rows.push([record.recorderOnly ? 'Elapsed time' : 'Robot duration',minutes(record.durationMinutes)]);
      else if(numeric(observed))rows.push(['Observed duration',minutes(observed)]);
      if(numeric(record.areaM2))rows.push(['Reported area',new Intl.NumberFormat(undefined,{maximumFractionDigits:1}).format(record.areaM2)+' m²']);
      rows.push(['Requested rooms',Array.isArray(record.requestedRooms) ? record.requestedRooms.join(', ') || 'Whole home' : 'Unknown']);
      rows.push(['Robot seen in',record.reportedRooms?.join(', ') || 'Not reported']);
      rows.push(['Outcome',friendly(record.outcome) || 'Not reported']);
      if(!record.outcome && record.endState)rows.push(['Last observed state',friendly(record.endState)]);
      rows.push(['Route',record.route ? (record.partial ? 'Partial route' : 'Recorded route') : 'No route recorded']);
    }
    const key=JSON.stringify(rows);
    if(key!==lastDetailsKey){
      lastDetailsKey=key; facts.replaceChildren();
      for(const [key,value] of rows){
        const row=document.createElement('div'), dt=document.createElement('dt'), dd=document.createElement('dd');
        dt.textContent=key;dd.textContent=value;row.append(dt,dd);facts.append(row);
      }
      if(!record){const empty=document.createElement('p');empty.textContent='A cleaning observed on this dashboard will appear here.';facts.after(empty);empty.className='lc-empty';}
      else panel.querySelector('.lc-empty')?.remove();
    }
    if(record?.route && record.partial)replay.textContent='Replay partial route';
    else replay.textContent='Replay route';
    visibility();
  }
  replay.onclick=()=>{
    if(active||!record?.route||blockReason())return;
    const host=frame.t90Map;
    if(!host)return;
    unhookPlayback();hookedHost=host;previousHandler=host.onHistoryPlayback;host.onHistoryPlayback=changed;
    if(frame.contentWindow?.t90ReplayHistory?.(record.route)!==true){
      failure='This route cannot be replayed on the current map.';
      unhookPlayback();visibility();return;
    }
    if(!active)changed(true);
    banner.scrollIntoView({block:'nearest',behavior:'instant'});back.focus({preventScroll:true});
  };
  back.onclick=()=>{stop();if(!replay.hidden && !replay.disabled)replay.focus({preventScroll:true});};
  const reload=()=>{stop();hookScene();visibility();};
  frame.addEventListener('load',reload);
  const live=card.q('.main-actions');
  live.addEventListener('click',stop,true);
  details.addEventListener('toggle',()=>{ if(!details.open&&active)stop(); });
  update(null);
  return {update,stop,destroy(){
    stop();watch?.disconnect();frame.removeEventListener('load',reload);live.removeEventListener('click',stop,true);
    panel.remove();banner.remove();
  }};
}
