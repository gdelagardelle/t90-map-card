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
    const freshStart = cleaning && (
      ['idle', 'docked'].includes(old.state) && !old.continuing ||
      sample.minutes != null && old.minutes != null && sample.minutes + 1 < old.minutes ||
      old.job && sample.job && sample.job !== old.job && Date.parse(sample.job) <= Date.parse(sample.stateSince) ||
      !old.state && Date.parse(sample.mapTime) < Date.parse(sample.stateSince)
    );
    const record = {
      state: sample.state, route: sample.route,
      minutes: sample.minutes ?? old.minutes, job: sample.job || old.job,
      continuing: sample.state === 'paused' || (sample.state === 'returning' && old.state === 'paused'),
      baseline: freshStart ? old.route ?? sample.route : old.baseline,
    };
    this.record = record;
    if (Object.keys(record).some(k => old[k] !== record[k])) {
      try { this.storage.setItem(this.key, JSON.stringify(record)); } catch {}
    }
    return record.baseline || '';
  }
}
