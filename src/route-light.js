// One low-frequency render loop per visible, actively cleaning map.
export function routeLight(viewer, draw) {
  const phase={value:-1};
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  let enabled=false, inView=false, timer, started=0;
  function refresh() {
    clearTimeout(timer);
    const moving=enabled && inView && !document.hidden && !preference.matches;
    phase.value=moving ? ((performance.now()-started)%5000)/5000 : -1;
    viewer.dataset.routePulse=moving?'moving':enabled?'still':'off';
    draw();
    if(moving) timer=setTimeout(refresh,50);
  }
  const observer=new IntersectionObserver(([entry])=>{
    inView=entry.isIntersecting;refresh();
  });
  observer.observe(viewer);
  preference.addEventListener('change',refresh);
  document.addEventListener('visibilitychange',refresh);
  window.addEventListener('pagehide',()=>clearTimeout(timer));
  return { phase, enable(value){
    if(enabled===value)return;
    enabled=value;if(value)started=performance.now();refresh();
  }};
}

// The head travels once from zero to one, followed by a longer, fading tail.
export const lightWave=`
float routeWave(float along,float phase) {
  if(phase<0.)return 0.;
  float behind=phase*1.27-.035-along;
  return smoothstep(-.022,0.,behind)*(1.-smoothstep(0.,.19,behind));
}`;
