import {Color} from 'three';

// Mesh clones ordinarily share artistic defaults. A bound fixture owns only its
// light-emitting materials, leaving other fixtures and their finish untouched.
export function fixtureLightMaterials(){
  const bindings=new WeakMap();
  const neutral=new Color(0xbcbab3), tint=new Color();
  function release(object) {
    const binding=bindings.get(object);
    if(!binding)return;
    for(const [mesh,base] of binding.meshes)mesh.material=base;
    for(const owned of binding.copies.values())owned.dispose();
    bindings.delete(object);
  }
  function apply(object,state) {
    if(!state){release(object);return;}
    let binding=bindings.get(object);
    if(!binding){
      binding={meshes:[],copies:new Map()};bindings.set(object,binding);
      object.traverse(mesh=>{
        if(!mesh.userData.fixtureEmitter && !mesh.userData.lightPool)return;
        const base=mesh.material;
        if(!binding.copies.has(base))binding.copies.set(base,base.clone());
        binding.meshes.push([mesh,base]);mesh.material=binding.copies.get(base);
      });
    }
    tint.set(state.color);
    for(const [base,owned] of binding.copies){
      if(base.emissive){
        owned.color.copy(neutral).lerp(tint,Math.min(1,state.level*0.75));
        owned.emissive.copy(tint);
        owned.emissiveIntensity=base.emissiveIntensity*state.level;
      } else {
        owned.color.copy(tint);
        owned.opacity=base.opacity*state.level;
      }
    }
  }
  return {apply,release};
}
