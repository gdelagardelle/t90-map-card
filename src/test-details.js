import { version } from '../package.json';

export const downloadGuide = 'https://github.com/gdelagardelle/t90-map-card/blob/v'+version+'/README.md#which-download-fits-your-robot';
export const profileNames = {ecovacs:'Ecovacs T90', roborock_qrevo:'Roborock Qrevo'};
export const platformProfile = platform => ({ecovacs:'ecovacs',roborock:'roborock_qrevo'})[platform];
export const available = entry => !!entry && !['','unknown','unavailable'].includes(entry.state);

export function setupFeatures(h, config, evidence = {}) {
  const vacuum = h?.states[config.entity], entry = h?.entities?.[config.entity];
  const model = h?.devices?.[entry?.device_id];
  const roborock = config.map_source === 'roborock_qrevo';
  const rooms = roborock ? evidence.rooms : Object.values(vacuum?.attributes.rooms || {})
    .some(ids => [].concat(ids).some(Number.isInteger));
  const mop = Object.entries(h?.entities || {}).some(([id,entity]) =>
    entry?.device_id && entity.device_id === entry.device_id && /^(select|number|switch)\./.test(id) &&
    /mop|water_(level|amount|flow)/.test(entity.translation_key || id.split('.')[1]) && available(h.states[id]));
  const integration = entry?.platform === 'ecovacs' ? 'Ecovacs' : entry?.platform === 'roborock' ? 'Roborock' : 'Unconfirmed';
  // Only known product names may leave the dashboard. Device names, model
  // descriptions, entity IDs and service exception text can all be user-defined.
  let product = 'Unconfirmed';
  if (integration === 'Ecovacs' && model?.model_id === 'b7vftn') product = 'T90 MAX PLUS OMNI';
  else if (integration === 'Ecovacs' && /\bT90\b/i.test(model?.model || '')) product = 'T90 family';
  else if (integration === 'Roborock' && /q\s*revo/i.test(model?.model || '')) product = 'Qrevo family';
  const detection = value => value ? 'Detected' : 'Unconfirmed';
  return {
    'Integration':integration, 'Robot model':product,
    'Vacuum connection':available(vacuum) ? 'Available' : 'Unavailable',
    'Map preview': evidence.map === true ? 'Ready' : evidence.map === false ? 'Unavailable' : 'Unchecked',
    'Robot position':detection(evidence.position),
    'Room cleaning':detection(rooms && evidence.map), 'Mop settings':detection(mop)
  };
}

const actions = new Set(['Start','Room clean','Resume','Pause','Stop','Go home','Setting','Dock action']);
const outcomes = new Set(['Requested','Accepted by Home Assistant','Cleaning confirmed','Rejected','Unconfirmed','Blocked']);
export function testReport(h, config, evidence, command) {
  const ha = h?.config?.version;
  const fields = {'Card version':version,'Home Assistant':typeof ha === 'string' && /^\d{4}\.\d{1,2}\.\d{1,3}(?:b\d{1,2})?$/.test(ha) ? ha : 'Unconfirmed',
    'Card profile':profileNames[config.map_source || 'ecovacs'] || 'Unconfirmed', ...setupFeatures(h,config,evidence),
    'Last command':actions.has(command?.action) && outcomes.has(command?.result) ? command.action+' · '+command.result : 'None recorded this session'};
  return Object.entries(fields).map(([key,value])=>key+': '+value).join('\n');
}

// The user sees the exact immutable text before choosing to copy it.
export function reportPanel(getReport) {
  const group = document.createElement('details'), summary = document.createElement('summary');
  summary.textContent = 'Test details';
  const content = document.createElement('div'); content.className='content test-details';
  const label = document.createElement('label'); label.textContent='Report preview';
  const preview = document.createElement('textarea'); preview.readOnly=true; preview.rows=9;
  label.append(preview);
  const button = document.createElement('button'); button.type='button'; button.textContent='Copy test details';
  const feedback = document.createElement('span'); feedback.setAttribute('role','status');
  const refresh = document.createElement('button'); refresh.type='button'; refresh.textContent='Refresh test details';
  const capture=()=>{preview.value=getReport();feedback.textContent='';};
  refresh.onclick=capture;
  group.ontoggle=()=>{if(group.open)capture();};
  button.onclick=async()=>{
    const text=preview.value;
    try {
      if (!navigator.clipboard?.writeText) throw Error();
      await navigator.clipboard.writeText(text);
    } catch {
      preview.focus(); preview.select();
      try { if (!document.execCommand('copy')) throw Error(); }
      catch { feedback.textContent='Select and copy the preview using your device’s Copy command.'; return; }
    }
    feedback.textContent='Test details copied.';
  };
  content.append(label,button,refresh,feedback); group.append(summary,content); return group;
}
