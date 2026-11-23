// Core Roomba and Roomba+ expose a position tuple on pose-capable robots.
// Keep only samples observed by this open card. Coordinates are local to the robot.
export class RoombaTrail {
  clear() {
    this.points = [];
    this.stamp = this.minutes = this.state = undefined;
    this.gap = false;
  }
  constructor() { this.clear(); }

  observe(entity) {
    const stamp = Date.parse(entity.last_updated);
    if (Number.isFinite(stamp) && Number.isFinite(this.stamp) && stamp < this.stamp) return;
    const {state, attributes} = entity;
    const minutes = attributes.cleaning_time;
    if (state === 'cleaning' && (this.state && !['cleaning','paused'].includes(this.state) ||
        Number.isFinite(minutes) && Number.isFinite(this.minutes) && minutes < this.minutes)) this.clear();
    this.state = state;
    if (Number.isFinite(stamp)) this.stamp = stamp;
    if (Number.isFinite(minutes)) this.minutes = minutes;
    if (!['cleaning','returning'].includes(state)) { this.gap = true; return; }
    const match = typeof attributes.position === 'string' && /^\(\s*([^,]+),\s*([^,]+),\s*([^,)]+)\s*\)$/.exec(attributes.position);
    const values = match && match.slice(1).map(v => v.trim() ? Number(v) : NaN);
    if (!values || !values.every(Number.isFinite)) { this.gap = true; return; }
    const [x,y] = values, last = this.points.at(-1);
    if (!this.gap && last?.x === x && last?.y === y) return;
    this.points.push({x,y,move: !last || this.gap});
    if (this.points.length > 1500) this.points.shift();
    this.gap = false;
  }

  draw(canvas) {
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height || !this.points.length) return;
    const width = bounds.width, height = bounds.height, pixelRatio = Math.min(devicePixelRatio || 1,2);
    canvas.width = Math.round(width*pixelRatio); canvas.height = Math.round(height*pixelRatio);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const xs=this.points.map(p=>p.x), ys=this.points.map(p=>p.y);
    const minX=Math.min(...xs), minY=Math.min(...ys), dx=Math.max(...xs)-minX, dy=Math.max(...ys)-minY;
    const scale=Math.min((width-38)/Math.max(dx,1),(height-32)/Math.max(dy,1));
    const px=p=>(width-dx*scale)/2+(p.x-minX)*scale;
    const py=p=>(height+dy*scale)/2-(p.y-minY)*scale;
    ctx.scale(pixelRatio,pixelRatio);
    ctx.strokeStyle='#70ded7';ctx.lineWidth=2.8;ctx.lineCap='round';ctx.lineJoin='round';
    ctx.shadowColor='#39b7b7';ctx.shadowBlur=5;ctx.beginPath();
    this.points.forEach((point,i)=>{if(!i || point.move)ctx.moveTo(px(point),py(point));else ctx.lineTo(px(point),py(point));});
    ctx.stroke();
    if (!this.gap) {
      const last=this.points.at(-1);ctx.fillStyle='#fff';ctx.shadowBlur=9;ctx.beginPath();ctx.arc(px(last),py(last),4,0,Math.PI*2);ctx.fill();
    }
  }
}
