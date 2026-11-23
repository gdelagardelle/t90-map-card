const states = {cleaning:'Cleaning', returning:'Returning home', docked:'Docked', idle:'Idle',
  paused:'Paused', error:'Robot needs attention', charging:'Charging'};
const confirms = {Start:['cleaning'], 'Room clean':['cleaning'], Resume:['cleaning'], Pause:['paused'],
  'Go home':['returning','docked','charging'], Stop:['idle','docked','paused']};
const captions = {'Room clean':'Start',Start:'Start',Resume:'Resume',Pause:'Pause',Stop:'Stop','Go home':'Go home'};

export function mapTime(image) {
  for (const value of [image?.state,image?.last_changed]) {
    if (typeof value === 'string' && /^\d{4}-\d\d-\d\dT/.test(value)) {
      const time = Date.parse(value);
      if (Number.isFinite(time)) return time;
    }
  }
  return null;
}

export function mapAge(state, updated, now) {
  if (state !== 'cleaning' && state !== 'returning') return '';
  if (updated == null || updated > now + 60000) return 'Map time unavailable';
  const minutes = Math.floor((now-updated)/60000);
  if (minutes < 2) return '';
  if (minutes >= 1440) return 'Last map update '+Math.floor(minutes/1440)+' d ago';
  if (minutes >= 60) return 'Last map update '+Math.floor(minutes/60)+' h ago';
  return 'Last map update '+minutes+' min ago';
}

export function liveState(state, online, station, command, now, waiting) {
  if (!online || !state || state==='unavailable' || state==='unknown') return 'Robot offline';
  if (state==='error') return states.error;
  const washingStates = ['washing_mop','washing_the_mop','washing_the_mops','washing_mops','mop_washing'];
  const washing = [].concat(station).some(value=>washingStates.includes(value));
  if (washing && ['docked','idle','charging'].includes(state)) return 'Washing mop';
  const reported = states[state] || state.replaceAll('_',' ').replace(/^./,c=>c.toUpperCase());
  if (!command || !Object.hasOwn(confirms,command.action)) return reported;
  // Once an action has been observed, an old request must not reappear when
  // the robot moves to its next state (for example cleaning → docked).
  if (confirms[command.action].includes(state)) {command.observed=true;return reported;}
  if (command.observed || !['Requested','Accepted by Home Assistant','Unconfirmed'].includes(command.result)) return reported;
  const age=now-command.at;
  if (age>60000 && !waiting) return reported;
  const label=captions[command.action];
  if (command.result==='Unconfirmed' || (age>=30000 && !waiting)) return label+' unconfirmed · '+reported;
  return command.result==='Requested' ? 'Requesting '+label : label+' sent';
}
