// Respect existing custom proportions and the editor's 50–400 percent range.
export function proportionalSize(item,factor){
  const height=item.height ?? 100;
  const dimensions=[item.width,item.depth,height];
  const bounded=Math.min(...dimensions.map(value=>400/value),
    Math.max(factor,...dimensions.map(value=>50/value)));
  return {width:Math.round(item.width*bounded),depth:Math.round(item.depth*bounded),height:Math.round(height*bounded)};
}

// Cancel the parent's nonuniform scale for equipment resting on a cabinet.
// Shrink it uniformly only if the supporting surface becomes too small.
export function sizeEquipment(group,width,height,depth){
  const fit=Math.min(1,width*group.userData.widthClearance,depth*group.userData.depthClearance);
  group.scale.set(fit/width,fit/height,fit/depth);
}
