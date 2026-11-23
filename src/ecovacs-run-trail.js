// Keep the last observed trace so a delayed map from the preceding job can be masked.
export class RunTrail {
  constructor(storage, key) {
    this.storage = storage;
    this.key = key;
    try { this.record = JSON.parse(storage.getItem(key)) || {}; }
    catch { this.record = {}; }
  }

  observe(sample) {
    const old = this.record;
    const cleaning = sample.state === 'cleaning';
    const phaseStart=Date.parse(sample.stateSince);
    const finished=['idle','docked','charging','error'].includes(old.state);
    // A changed cleaning phase with no observed pause can follow an entire
    // missed job while the browser was away. Do not reuse the previous trace.
    const missedPhase=old.state==='cleaning' && old.phaseStart && phaseStart>old.phaseStart;
    const freshStart = cleaning && (
      finished && !old.continuing || missedPhase ||
      sample.minutes != null && old.minutes != null && sample.minutes + 1 < old.minutes ||
      old.job && sample.job && sample.job !== old.job && Date.parse(sample.job) <= Date.parse(sample.stateSince) ||
      !old.state && Date.parse(sample.mapTime) < Date.parse(sample.stateSince)
    );
    const runStart=cleaning && (freshStart || !old.runStart)?phaseStart:old.runStart;
    const stale=['cleaning','paused','returning'].includes(sample.state) && Date.parse(sample.mapTime)<runStart;
    const record = {
      phaseStart:Number.isFinite(phaseStart)?phaseStart:null,
      runStart:Number.isFinite(runStart)?runStart:null,
      state: sample.state, route: sample.route,
      minutes: sample.minutes ?? old.minutes, job: sample.job || old.job,
      continuing: sample.state === 'paused' || (sample.state === 'returning' && old.state === 'paused'),
      baseline: stale ? sample.route : freshStart ? old.route ?? sample.route : old.baseline,
    };
    this.record = record;
    if (Object.keys(record).some(k => old[k] !== record[k])) {
      try { this.storage.setItem(this.key, JSON.stringify(record)); } catch {}
    }
    return record.baseline || '';
  }
}
