import { trace } from '../../src/dreame-map.js';
import { makeMap } from '../../src/map.js';

const png = [137,80,78,71,13,10,26,10];
const text = new TextDecoder('utf-8', { fatal:true });
const maxBytes = 8 * 1024 * 1024;
const maxCells = 1_000_000;

export async function readBounded(stream, limit = maxBytes) {
  if (!stream) throw Error('The map camera returned no image.');
  const reader = stream.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const {done,value} = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw Error('This floor exceeds the map size limit.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk,offset); offset += chunk.length; }
  return bytes;
}

export async function decodeMapCamera(bytes) {
  if (!png.every((value,i)=>bytes[i]===value)) throw Error('Select the Valetudo MQTT Map data camera.');
  const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const keyword = 'ValetudoMap';
  for (let offset=8; offset+12<=bytes.length;) {
    const len = view.getUint32(offset);
    const data = offset+8, end = data+len;
    if (end+4>bytes.length) throw Error('Incomplete PNG from the map camera.');
    const type = String.fromCharCode(...bytes.subarray(offset+4,data));
    if (type==='IEND') break;
    if (type==='zTXt' && len>keyword.length+2 &&
        keyword.split('').every((c,i)=>bytes[data+i]===c.charCodeAt(0)) &&
        bytes[data+keyword.length]===0 && bytes[data+keyword.length+1]===0) {
      const compressed = new Blob([bytes.subarray(data+keyword.length+2,end)]);
      const raw = await readBounded(compressed.stream().pipeThrough(new DecompressionStream('deflate')));
      return JSON.parse(text.decode(raw));
    }
    offset=end+4;
  }
  throw Error('This camera image has no ValetudoMap field. Choose the MQTT Map data camera.');
}

// Layers contain pixel runs. Entity points and map extents use centimetres.
export function convertMap(map) {
  const scale = map?.pixelSize;
  if (map?.metaData?.version!==2 || !Number.isFinite(scale) || scale<=0 ||
      !Array.isArray(map.layers) || !Array.isArray(map.entities)) throw Error('Expected a Valetudo v2 map.');
  const widthLimit=Math.ceil(map.size?.x/scale), heightLimit=Math.ceil(map.size?.y/scale);
  if (![widthLimit,heightLimit].every(n=>Number.isSafeInteger(n)&&n>0)) throw Error('Invalid Valetudo map dimensions.');
  const layers = map.layers.filter(l=>['floor','wall','segment'].includes(l?.type));
  const priority = {floor:0,segment:1,wall:2};
  layers.sort((a,b)=>priority[a.type]-priority[b.type]);
  let x0=Infinity,y0=Infinity,x1=0,y1=0,writes=0;
  for (const layer of layers) {
    const runs=layer.compressedPixels;
    if (!Array.isArray(runs) || runs.length%3) throw Error('Invalid Valetudo pixel runs.');
    for (let i=0;i<runs.length;i+=3) {
      const x=runs[i], y=runs[i+1], count=runs[i+2];
      if (![x,y,count].every(Number.isSafeInteger) || x<0 || y<0 || count<1 || x+count>widthLimit || y>=heightLimit) throw Error('Pixel run outside the Valetudo map.');
      writes+=count;
      x0=Math.min(x0,x); y0=Math.min(y0,y); x1=Math.max(x1,x+count); y1=Math.max(y1,y+1);
    }
  }
  const w=x1-x0, h=y1-y0, stride=w+1;
  if (!Number.isFinite(w) || w*h>maxCells || writes>maxCells*4 || layers.length>1000) throw Error('The mapped area is empty or too large.');
  const cells=new Uint16Array(w*h), WALL=65535;
  layers.forEach((layer,index)=>{
    const id=layer.type==='wall'?WALL:layer.type==='floor'?1:index+2;
    const runs=layer.compressedPixels;
    for(let i=0;i<runs.length;i+=3){
      const start=(runs[i+1]-y0)*w+runs[i]-x0;
      cells.fill(id,start,start+runs[i+2]);
    }
  });
  const boundaries=new Map();
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,id=cells[i]; if(!id)continue;
    if(!boundaries.has(id))boundaries.set(id,new Set());
    const edges=boundaries.get(id), v=y*stride+x;
    if(!y||cells[i-w]!==id) edges.add(v*4);
    if(x===w-1||cells[i+1]!==id) edges.add((v+1)*4+1);
    if(y===h-1||cells[i+w]!==id) edges.add((v+stride+1)*4+2);
    if(!x||cells[i-1]!==id) edges.add((v+stride)*4+3);
  }
  const floors=[],walls=[],unit=scale/5;
  for (const [id,edges] of boundaries) (id===WALL?walls:floors).push(trace(edges,stride,unit));
  if(!floors.length || !walls.length) throw Error('Waiting for a mapped floor and wall layer.');
  const xy=(x,y)=>[x/5-x0*unit,y/5-y0*unit];
  const position=type=>{
    const p=map.entities.find(e=>e?.type===type)?.points;
    return Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)?xy(...p):null;
  };
  const route=[];
  for(const e of map.entities){
    if(e?.type!=='path'||!Array.isArray(e.points)||e.points.length%2||e.points.length<4||!e.points.every(Number.isFinite))continue;
    for(let i=0;i<e.points.length;i+=2){
      const [x,y]=xy(e.points[i],e.points[i+1]);
      route.push((i?'L':'M')+x*5+' '+(-y*5));
    }
  }
  const dock=position('charger_location');
  const result=makeMap([0,0,w*unit,h*unit],floors,walls,position('robot_position'),dock,route.join(''));
  // Reframe when the occupied map boundary or dock moves, even on congruent floors.
  result.geometryId += ':'+[x0,y0,scale,dock?.join(',')].join(':');
  return result;
}
