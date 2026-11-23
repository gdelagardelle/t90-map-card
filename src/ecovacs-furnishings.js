import { proportionalSize,sizeEquipment } from './furniture-scale.js';
import { scope } from './scene-context.js';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const catalog = {
  nightstand:{label:'Bedside table',width:11,depth:9},
  shoeCabinet:{label:'Shoe cabinet',width:20,depth:7},
  sideTable:{label:'Round side table',width:11,depth:11},
  diningChair:{label:'Dining chair',width:8,depth:9},
  range:{label:'Oven and hob',width:13,depth:12},
  coatRack:{label:'Coat rack',width:9,depth:9},
  armchair: { label: 'Armchair', width: 16, depth: 16 },
  ottoman: { label: 'Round ottoman', width: 13, depth: 13 },
  bookcase: { label: 'Bookcase', width: 21, depth: 7 },
  dresser: { label: 'Dresser', width: 22, depth: 10 },
  console: { label: 'Low media console', width: 30, depth: 8 },
  bench: { label: 'Entry bench', width: 24, depth: 9 },
  compactFridge: { label: 'Retro refrigerator', width: 11, depth: 11 },
  dishwasher: { label: 'Dishwasher', width: 12, depth: 12 },
  officeDesk: { label: 'Office desk', width: 28, depth: 14 },
  officeChair: { label: 'Office chair', width: 11, depth: 11 },
  floorLamp: { label: 'Floor lamp', width: 8, depth: 8 },
  ledStrip: { label: 'LED strip', width: 24, depth: 1.6 },
  plant: { label: 'Potted plant', width: 13, depth: 13 },
  rug: { label: 'Area rug', width: 42, depth: 28 },
  cabinets: { label: 'Kitchen cabinets', width: 48, depth: 10 },
  island: { label: 'Kitchen island', width: 29, depth: 13 },
  stool: { label: 'Counter stool', width: 6.2, depth: 6.2 },
  fridge: { label: 'Refrigerator', width: 12, depth: 12 },
  sofa: { label: 'Sofa', width: 43, depth: 15 },
  sectional: { label: 'L-shaped sofa', width: 58, depth: 29 },
  coffee: { label: 'Coffee table', width: 20, depth: 20 },
  media: { label: 'TV and console', width: 30, depth: 7 },
  dining: { label: 'Dining set', width: 32, depth: 28 },
  queen: { label: 'Queen bed', width: 54, depth: 44 },
  single: { label: 'Single bed', width: 39, depth: 42 },
  washer: { label: 'Washing machine', width: 12.6, depth: 13 },
  dryer: { label: 'Dryer', width: 12.6, depth: 13 },
  smallCabinet: { label: 'Small cabinet', width: 14, depth: 8 },
  tallCabinet: { label: 'Storage cabinet', width: 14, depth: 8.8 },
  toilet: { label: 'Toilet', width: 9, depth: 12 },
  bathSink: { label: 'Bathroom sink', width: 15, depth: 8.6 },
  bathtub: { label: 'Bathtub', width: 13, depth: 31 },
};

const rooms = {
  'Living room': ['sofa','sectional','armchair','ottoman','sideTable','coffee','media','console','bookcase','rug'],
  'Kitchen & dining': ['cabinets','island','stool','dining','diningChair','range','fridge','compactFridge','dishwasher'],
  Bedroom: ['queen','single','nightstand','dresser'],
  'Entry & storage': ['bench','shoeCabinet','coatRack','smallCabinet','tallCabinet'],
  Office: ['officeDesk','officeChair'],
  'Bath & laundry': ['toilet','bathSink','bathtub','washer','dryer'],
  'Lighting & plants': ['floorLamp','ledStrip','plant'],
};
const swatches = { Chalk:'#e8e4db', Sand:'#c6ae91', Walnut:'#865a40', Clay:'#ac6654',
  Sage:'#768474', Navy:'#455e77', Charcoal:'#404448' };

const storageKey = scope + ':furniture';

function makeFabric() {
  const data = new Uint8Array(64 * 64 * 4);
  let seed = 2834;
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const tint = 173 + ((x + y) % 2) * 23 + (seed >>> 27);
      data.set([tint, tint, tint, 255], (y * 64 + x) * 4);
    }
  }
  const texture = new THREE.DataTexture(data, 64, 64);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.repeat.set(8, 6);
  texture.needsUpdate = true;
  return texture;
}

function buildPrototypes(addMesh, makeMaterial, marbleMap) {
  const fabric = makeFabric();
  const rugEdge = makeMaterial(0x64574a, { map: fabric });
  const rugInner = makeMaterial(0xd1bfa3, { map: fabric });
  const walnut = makeMaterial(0x62402c);
  const oak = makeMaterial(0xa16b47);
  const stone = makeMaterial(0xd4c9b7, { roughness: 0.48 });
  const dark = makeMaterial(0x312b28, { roughness: 0.58 });
  const steel = makeMaterial(0x777e80, { metalness: 0.46, roughness: 0.46 });
  const linen = makeMaterial(0xc6b9a9, { map: fabric });
  const cushion = makeMaterial(0xa77353, { map: fabric });
  const cotton = makeMaterial(0xe8ded0, { map: fabric });
  const sage = makeMaterial(0x858a76, { map: fabric });
  const slate = makeMaterial(0x5f7077, { map: fabric });
  const whiteCabinet = makeMaterial(0xf0ede7, { roughness: 0.58 });
  const whiteSide = makeMaterial(0xe5e0d8, { roughness: 0.68 });
  const tableTexture = marbleMap.clone();
  tableTexture.repeat.setScalar(1 / 8 - 0.004);
  tableTexture.offset.set(0.127, 0.002);
  tableTexture.needsUpdate = true;
  const tableMarble = makeMaterial(0xf4f0ec, { map: tableTexture, roughness: 0.37 });
  const groups = Object.fromEntries(Object.keys(catalog).map(kind => [kind, new THREE.Group()]));

  function block(group, material, width, height, depth, x, y, z, radius = 0.17) {
    return addMesh(group, new RoundedBoxGeometry(width, height, depth, 1, radius), material, x, y, z);
  }

  const rug = groups.rug;
  block(rug, rugEdge, 42, 0.12, 28, 0, 0.065, 0, 0.05);
  block(rug, rugInner, 39.2, 0.095, 25.2, 0, 0.135, 0, 0.04);
  for (const mat of rug.children) mat.castShadow = false;

  const cabinets = groups.cabinets;
  block(cabinets, whiteSide, 47.5, 10, 9.2, 0, 5.15, -0.2);
  for (let x = -18; x <= 18; x += 12) {
    block(cabinets, whiteCabinet, 11.5, 8.9, 0.45, x, 5.2, 4.46, 0.1);
    block(cabinets, dark, 3.6, 0.32, 0.52, x, 8.3, 4.9, 0.09);
  }
  block(cabinets, stone, 48, 0.88, 10, 0, 10.6, 0);
  block(cabinets, steel, 9, 0.13, 5.45, -11, 11.1, 0, 0.05);
  block(cabinets, dark, 7.5, 0.08, 4, -11, 11.21, 0, 0.03);
  block(cabinets, steel, 0.55, 2.2, 0.55, -11, 12.05, -2.8);
  block(cabinets, steel, 0.55, 0.48, 2.2, -11, 13.12, -1.94);
  block(cabinets, dark, 10.6, 0.14, 6.2, 13, 11.15, 0, 0.06);
  for (const x of [10.4, 15.6]) {
    for (const z of [-1.45, 1.35]) {
      const ring = addMesh(cabinets, new THREE.TorusGeometry(1.1, 0.075, 4, 20), steel, x, 11.26, z);
      ring.rotateX(-Math.PI / 2);
    }
  }

  const island = groups.island;
  block(island, whiteSide, 25.1, 10, 10.5, 0, 5.1, -0.8);
  block(island, stone, 29, 0.92, 13, 0, 10.58, 0, 0.31);
  for (let x = -8; x <= 8; x += 8) {
    block(island, whiteCabinet, 7.7, 8.2, 0.42, x, 5.25, 4.57);
    block(island, dark, 2.6, 0.27, 0.45, x, 8.1, 4.92, 0.08);
  }
  addMesh(island, new THREE.CylinderGeometry(2.45, 1.9, 0.53, 28), dark, 5, 11.32, 0.2);

  const stool = groups.stool;
  for (const x of [-1.86, 1.86]) {
    for (const z of [-1.86, 1.86]) block(stool, dark, 0.46, 8, 0.46, x, 4.02, z, 0.10);
  }
  block(stool, dark, 4.13, 0.3, 0.36, 0, 3.07, 1.86, 0.07);
  addMesh(stool, new THREE.CylinderGeometry(3.03, 2.9, 0.75, 32), oak, 0, 8.22, 0);
  addMesh(stool, new THREE.CylinderGeometry(2.88, 2.98, 0.72, 32), linen, 0, 8.75, 0);

  const fridge = groups.fridge;
  block(fridge, dark, 11.4, 19.2, 11, 0, 9.65, -0.3, 0.4);
  block(fridge, steel, 5.43, 12.65, 0.75, -2.79, 12.36, 5.26, 0.25);
  block(fridge, steel, 5.43, 12.65, 0.75, 2.79, 12.36, 5.26, 0.25);
  block(fridge, steel, 11.05, 5.65, 0.75, 0, 3.05, 5.26, 0.25);
  for (const x of [-0.78, 0.78]) block(fridge, dark, 0.25, 3.95, 0.53, x, 11.3, 5.72, 0.11);
  block(fridge, dark, 5.4, 0.35, 0.54, 0, 5.3, 5.72, 0.11);

  const sofa = groups.sofa;
  block(sofa, dark, 40.5, 2, 12.7, 0, 1.2, 0);
  block(sofa, linen, 43, 2.3, 15, 0, 2.8, 0, 0.73);
  block(sofa, linen, 43, 6.2, 3.1, 0, 6.3, -5.95, 0.75);
  for (const x of [-19.8, 19.8]) {
    block(sofa, linen, 3.2, 4.75, 14.8, x, 5.3, 0, 0.75);
  }
  for (const x of [-12, 0, 12]) {
    block(sofa, linen, 11.73, 1.65, 10.8, x, 4.6, 1.55, 0.67);
    const back = block(sofa, linen, 11.75, 4.1, 2.55, x, 7.12, -4.28, 0.64);
    back.rotation.x = 0.15;
  }
  const pillow = block(sofa, cushion, 4.5, 3.5, 1.8, -13.5, 6.9, -1.9, 0.66);
  pillow.rotation.z = -0.19;

  const sectional = groups.sectional;
  block(sectional, dark, 56.2, 1.8, 15.3, 0, 1.04, -6, 0.4);
  block(sectional, linen, 58, 2.55, 17, 0, 2.8, -6, 0.72);
  block(sectional, linen, 58, 6.25, 3.15, 0, 6.3, -12.85, 0.85);
  block(sectional, linen, 3.25, 4.7, 16.7, 27.35, 5.15, -6, 0.72);
  block(sectional, linen, 3.25, 4.7, 16.7, -27.35, 5.15, -6, 0.72);
  // The prototype has a left chaise. Mirroring it keeps the back and center fixed.
  block(sectional, dark, 18.2, 1.82, 14.2, -19.5, 1.05, 6.8, 0.47);
  block(sectional, linen, 19, 2.5, 15.3, -19.5, 2.8, 6.85, 0.73);
  block(sectional, linen, 17.25, 1.72, 25.5, -18.95, 4.65, 1.47, 0.78);
  for (const x of [-1.15, 16.7]) {
    block(sectional, linen, 17.25, 1.72, 12.5, x, 4.65, -3.95, 0.75);
  }
  for (const x of [-18.8, -1.05, 16.7]) {
    const back = block(sectional, linen, 17.3, 4.05, 2.58, x, 7.13, -10.98, 0.72);
    back.rotation.x = 0.15;
  }
  const chaisePillow = block(sectional, cushion, 4.8, 3.62, 1.88, -22.5, 6.92, -8.6, 0.63);
  chaisePillow.rotation.z = -0.18;
  const cornerPillow = block(sectional, sage, 4.9, 3.65, 1.85, 22.7, 6.8, -8.15, 0.64);
  cornerPillow.rotation.z = 0.21;

  const coffee = groups.coffee;
  addMesh(coffee, new THREE.CylinderGeometry(5.9, 6.6, 3.25, 40), dark, 0, 1.65, 0);
  addMesh(coffee, new THREE.CylinderGeometry(9.93, 10, 0.92, 64), tableMarble, 0, 3.72, 0);
  block(coffee, sage, 4.3, 0.42, 3, -2.9, 4.4, 0.21, 0.09);
  addMesh(coffee, new THREE.CylinderGeometry(1.5, 1.13, 0.56, 24), stone, 3.42, 4.46, -0.72);

  for (const kind of ['washer', 'dryer']) {
    const appliance = groups[kind];
    block(appliance, whiteCabinet, 12.6, 17.1, 12.3, 0, 8.66, -0.22, 0.47);
    block(appliance, dark, 4, 1.25, 0.24, 3.28, 15.69, 5.99, 0.12);
    const dial = addMesh(appliance, new THREE.CylinderGeometry(0.79, 0.79, 0.35, 20),
      steel, -2.73, 15.6, 6.1);
    dial.rotateX(Math.PI / 2);
    const glazedDoor = addMesh(appliance, new THREE.CylinderGeometry(4.13, 4.13, 0.31, 44),
      kind === 'washer' ? dark : slate, 0, 7.83, 6.03);
    glazedDoor.rotateX(Math.PI / 2);
    addMesh(appliance, new THREE.TorusGeometry(4.27, 0.23, 8, 48), steel, 0, 7.83, 6.21);
  }
  const smallCabinet = groups.smallCabinet;
  block(smallCabinet, whiteSide, 13.6, 8.4, 7.3, 0, 4.29, -0.24, 0.29);
  block(smallCabinet, whiteCabinet, 14, 0.75, 8, 0, 8.56, 0, 0.27);
  for (const x of [-3.38, 3.38]) {
    block(smallCabinet, whiteCabinet, 6.46, 7.12, 0.34, x, 4.45, 3.53, 0.14);
    block(smallCabinet, dark, 1.5, 0.27, 0.3, x, 7.31, 3.83, 0.08);
  }

  const tallCabinet = groups.tallCabinet;
  block(tallCabinet, whiteSide, 13.8, 19.64, 8.55, 0, 9.96, -0.1, 0.32);
  for (const x of [-3.35, 3.35]) {
    block(tallCabinet, whiteCabinet, 6.58, 18.68, 0.35, x, 9.93, 4.11, 0.13);
  }
  for (const x of [-0.82, 0.82]) block(tallCabinet, dark, 0.23, 2.83, 0.46, x, 10.1, 4.42, 0.08);

  const porcelain = makeMaterial(0xf2f0eb, { roughness: 0.33 });
  const basin = makeMaterial(0xbac6c8, { roughness: 0.44 });
  const toilet = groups.toilet;
  block(toilet, porcelain, 7.96, 8.35, 3.87, 0, 5.45, -3.83, 0.42);
  const bowl = addMesh(toilet, new THREE.CylinderGeometry(1, 0.69, 4.13, 36), porcelain, 0, 2.15, 1.26);
  bowl.scale.set(4.08, 1, 4.34);
  const seat = addMesh(toilet, new THREE.CylinderGeometry(1, 1, 0.31, 36), porcelain, 0, 4.35, 1.27);
  seat.scale.set(4.25, 1, 4.42);
  const opening = addMesh(toilet, new THREE.CylinderGeometry(1, 1, 0.07, 36), basin, 0, 4.52, 1.33);
  opening.scale.set(2.59, 1, 3.03);
  block(toilet, steel, 1.18, 0.14, 0.73, 0, 9.69, -3.71, 0.06);

  const bathSink = groups.bathSink;
  block(bathSink, whiteSide, 14.5, 9.3, 7.9, 0, 4.79, -0.08, 0.28);
  block(bathSink, porcelain, 15, 0.9, 8.6, 0, 9.6, 0, 0.27);
  block(bathSink, basin, 7.5, 0.08, 4.85, 0, 10.09, 0.16, 0.03);
  block(bathSink, steel, 0.48, 2.04, 0.49, 0, 11, -2.69, 0.14);
  block(bathSink, steel, 0.48, 0.4, 2.04, 0, 11.89, -1.91, 0.14);
  for (const x of [-3.53, 3.53]) block(bathSink, oak, 6.75, 7.87, 0.42, x, 4.83, 3.9, 0.22);

  const bathtub = groups.bathtub;
  block(bathtub, porcelain, 13, 6.25, 31, 0, 3.19, 0, 1.7);
  block(bathtub, basin, 10.75, 0.11, 27.6, 0, 6.36, 0.19, 0.05);
  block(bathtub, porcelain, 8.75, 0.08, 24.2, 0, 6.45, 0.65, 0.03);
  const drain = addMesh(bathtub, new THREE.CylinderGeometry(0.55, 0.55, 0.09, 18), steel, 0, 6.53, 9);
  drain.castShadow = false;
  block(bathtub, steel, 0.58, 1.8, 0.58, 0, 7.21, -13.35, 0.12);
  block(bathtub, steel, 0.61, 0.42, 2.8, 0, 8.06, -12.41, 0.15);

  function equipment(parent,top,widthClearance,depthClearance){
    const group=new THREE.Group();
    group.name='equipment';group.position.y=top;
    Object.assign(group.userData,{widthClearance,depthClearance});
    parent.add(group);return group;
  }
  const media = groups.media;
  block(media, walnut, 29.6, 4.2, 6.5, 0, 2.4, 0, 0.22);
  block(media, oak, 29.9, 0.47, 6.9, 0, 4.64, 0, 0.18);
  for (const x of [-9.8, 0, 9.8]) block(media, oak, 9.1, 3.5, 0.31, x, 2.4, 3.26);
  const tv=equipment(media,4.86,29.9/23.4,6.9/3.1);
  block(tv,dark,9.3,.28,3.1,0,.14,0,.13);
  block(tv,dark,2,1.1,.73,0,.63,-.76);
  block(tv,dark,23.4,10.9,.67,0,6.09,-1.09,.21);
  block(tv,slate,22.4,10,.1,0,6.11,-.71,.04);

  const dining = groups.dining;
  const diningTop = addMesh(dining, new THREE.CylinderGeometry(1, 1, 1.15, 64), oak, 0, 8.8, 0);
  diningTop.scale.set(12.75, 1, 6.65);
  for (const x of [-10, 10]) {
    for (const z of [-4.7, 4.7]) block(dining, walnut, 1.4, 8.2, 1.4, x, 4.09, z);
  }
  for (const x of [-7.2, 7.2]) {
    for (const side of [-1, 1]) {
      block(dining, walnut, 6.1, 4.45, 5.6, x, 2.22, side * 10.7, 0.25);
      block(dining, linen, 5.9, 0.65, 5.45, x, 4.71, side * 10.7, 0.27);
      block(dining, walnut, 6, 4.35, 1.06, x, 6.78, side * 12.73, 0.25);
    }
  }
  addMesh(dining, new THREE.CylinderGeometry(1.23, 1.53, 2.15, 24), stone, 0, 10.47, 0);

  function makeBed(group, width, depth, cover, nightstands) {
    const back = -depth / 2;
    block(group, walnut, width, 2.6, depth - 0.5, 0, 1.45, 0.22, 0.39);
    block(group, linen, width, 8.75, 1.6, 0, 4.5, back + 0.82, 0.51);
    block(group, cotton, width - 1.1, 2.7, depth - 2.5, 0, 3.65, 0.57, 0.83);
    block(group, cover, width - 0.82, 0.76, depth - 9.3, 0, 5.15, 4.18, 0.38);
    block(group, linen, width - 1.1, 0.67, 5.75, 0, 5.51, depth / 2 - 4.1, 0.29);
    const pillowCenters = nightstands.length === 2 ? [-width / 4, width / 4] : [0];
    for (const x of pillowCenters) {
      block(group, cotton, 12.6, 1.42, 6.3, x, 5.6, back + 6.25, 0.71);
    }
    for (const x of nightstands) {
      const z = back + 4.8;
      block(group, oak, 7.9, 4.7, 7.5, x, 2.48, z, 0.24);
      block(group, walnut, 2.4, 0.35, 0.29, x, 3.23, z + 3.86, 0.08);
      addMesh(group, new THREE.CylinderGeometry(0.42, 0.84, 1.42, 16), dark, x, 5.54, z);
      addMesh(group, new THREE.CylinderGeometry(1.23, 1.85, 1.62, 20), stone, x, 6.76, z);
    }
  }

  makeBed(groups.queen, 35.7, 44, sage, [-22.8, 22.8]);
  makeBed(groups.single, 22, 42, slate, [15.2]);
  const desk = groups.officeDesk;
  block(desk, oak, 28, 0.85, 14, 0, 9.3, 0, 0.35);
  for (const x of [-12, 12]) {
    for (const z of [-5.5, 5.5]) block(desk, dark, 0.7, 9, 0.7, x, 4.5, z);
  }
  const monitor=equipment(desk,9.725,28/12,14/9);
  block(monitor,steel,5,.35,3,0,.175,-3);
  block(monitor,steel,1,2.7,.65,0,1.275,-3);
  block(monitor,dark,12,6.5,.65,0,4.375,-3);
  block(monitor,slate,11.4,5.7,.12,0,4.475,-2.64);
  block(monitor,dark,7.8,.26,2.7,0,.145,2.2);

  const chair = groups.officeChair;
  for (let i = 0; i < 5; i++) {
    const angle = i * 2 * Math.PI / 5;
    const arm = block(chair, steel, 0.65, 0.52, 4.2,
      2.1 * Math.sin(angle), 1, 2.1 * Math.cos(angle));
    arm.rotation.y = angle;
    addMesh(chair, new THREE.SphereGeometry(0.7, 10, 8), dark,
      4.2 * Math.sin(angle), 0.72, 4.2 * Math.cos(angle));
  }
  addMesh(chair, new THREE.CylinderGeometry(0.65, 0.8, 4, 12), steel, 0, 3, 0);
  block(chair, slate, 8.4, 1.25, 8, 0, 5.5, 0, 0.55);
  block(chair, slate, 8.1, 7.2, 1.5, 0, 9.2, -3.7, 0.68).rotation.x = -0.09;
  for (const x of [-4.5, 4.5]) {
    block(chair, steel, 0.4, 2.4, 0.5, x, 6.6, 0);
    block(chair, dark, 1, 0.6, 4.4, x, 7.9, 0);
  }

  const lamp = groups.floorLamp;
  const brass = makeMaterial(0xa48455, { metalness: 0.6, roughness: 0.38 });
  addMesh(lamp, new THREE.CylinderGeometry(2.9, 3.1, 0.65, 32), brass, 0, 0.34, 0);
  addMesh(lamp, new THREE.CylinderGeometry(0.27, 0.33, 15, 12), brass, 0, 8, 0);
  const shade = makeMaterial(0xffe8c4, { emissive: 0xffbd73, side: THREE.DoubleSide });
  addMesh(lamp, new THREE.CylinderGeometry(2.8, 4, 5.6, 36, 1, true), shade, 0, 15.6, 0);
  addMesh(lamp, new THREE.SphereGeometry(1.1, 16, 12), shade, 0, 15, 0);

  const strip = groups.ledStrip;
  const diffuser = makeMaterial(0xfff0cd, { emissive: 0xffc587 });
  block(strip, steel, 24, 0.56, 1.6, 0, 0.3, 0);
  block(strip, diffuser, 23.7, 0.32, 1.28, 0, 0.68, 0);

  // Distance to a line segment gives the strip even spill with rounded ends.
  // A zero-length segment gives the lamp a circular pool. Clones share both textures.
  function addLightPool(group, length, radius, color) {
    const width = length + 2 * radius, depth = 2 * radius;
    const rows = 64, columns = Math.ceil(rows * width / depth);
    const pixels = new Uint8Array(columns * rows * 4);
    for (let y = 0; y < rows; y++) {
      const z = ((y + 0.5) / rows - 0.5) * depth;
      for (let x = 0; x < columns; x++) {
        const along = Math.abs(((x + 0.5) / columns - 0.5) * width);
        const beyondEnd = Math.max(0, along - length / 2);
        const fade = Math.max(0, 1 - Math.hypot(beyondEnd, z) / radius);
        pixels.set([255, 255, 255, Math.round(255 * fade * fade)], 4 * (y * columns + x));
      }
    }
    const map = new THREE.DataTexture(pixels, columns, rows);
    map.magFilter = map.minFilter = THREE.LinearFilter;
    map.needsUpdate = true;
    const material = new THREE.MeshBasicMaterial({
      map, color, transparent: true, depthWrite: false, toneMapped: false,
      blending: THREE.AdditiveBlending,
    });
    const glow = addMesh(group, new THREE.PlaneGeometry(width, depth), material, 0, 0.23, 0);
    glow.rotation.x = -Math.PI / 2;
    glow.castShadow = glow.receiveShadow = false;
    glow.userData.lightPool = true;
    return material;
  }
  const lampPool = addLightPool(lamp, 0, 13, 0xffcc91);
  const stripPool = addLightPool(strip, 23.7, 6.4, 0xffc778);

  const plant = groups.plant;
  addMesh(plant, new THREE.CylinderGeometry(3.1, 2.35, 5, 32), stone, 0, 2.5, 0);
  addMesh(plant, new THREE.CylinderGeometry(2.8, 2.8, 0.2, 24), walnut, 0, 5, 0);
  const leaves = [makeMaterial(0x425e40), makeMaterial(0x738653), makeMaterial(0x567650)];
  const leaf = new THREE.SphereGeometry(1, 14, 10);
  for (let i = 0; i < 12; i++) {
    const angle = i * 2.4, height = 8 + i % 4 * 1.5;
    const direction = new THREE.Vector3(Math.sin(angle), 1.15 + i % 3 * 0.3, Math.cos(angle)).normalize();
    const blade = addMesh(plant, leaf, leaves[i % 3], 2.6 * Math.sin(angle), height, 2.6 * Math.cos(angle));
    blade.scale.set(1.6, 4.6, 0.64);
    blade.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  }

  const armchair=groups.armchair;
  for(const x of [-5.4,5.4])for(const z of [-5.4,5.4])block(armchair,walnut,1.2,2.2,1.2,x,1.1,z);
  block(armchair,linen,15.6,2.8,15.2,0,3.2,0,.8);
  block(armchair,linen,15.8,7.3,3.3,0,7.2,-6,.85).rotation.x=.10;
  for(const x of [-6.6,6.6])block(armchair,linen,2.5,4.7,13.4,x,5.8,.6,.8);
  block(armchair,linen,11,2.2,10.6,0,5,1.4,.82);
  const ottoman=groups.ottoman;
  addMesh(ottoman,new THREE.CylinderGeometry(5.2,5.1,1,32),walnut,0,.5,0);
  addMesh(ottoman,new THREE.CylinderGeometry(6.25,5.9,4.1,40),sage,0,2.95,0);
  addMesh(ottoman,new THREE.CylinderGeometry(6.25,6.45,1.15,40),sage,0,5.55,0);
  const bookcase=groups.bookcase;
  block(bookcase,walnut,20,23,.65,0,11.6,-3.1);
  for(const x of [-10,10])block(bookcase,oak,.9,23.8,7,x,11.9,0);
  for(const y of [1,8.2,15.4,23.5])block(bookcase,oak,20.3,.8,7,0,y,0);
  for(const [x,y,h,mat] of [[-7.4,1.4,5,cushion],[-5.8,1.4,4.6,slate],[-3.9,1.4,5.6,sage],[3.2,8.6,5,slate],[5,8.6,4.5,cotton],[7,8.6,5.4,cushion]]){
    block(bookcase,mat,1.4,h,4.5,x,y+h/2,.2,.07);
  }
  const dresser=groups.dresser;
  block(dresser,walnut,19,1.2,8.1,0,.65,0);
  block(dresser,oak,22,11.4,9.2,0,6.9,-.3);
  for(const y of [3.2,6.9,10.6]){
    block(dresser,oak,21.3,3.35,.5,0,y,4.45);
    for(const x of [-6,6])block(dresser,brass,2,.3,.55,x,y+.35,4.79);
  }
  const consoleUnit=groups.console;
  for(const x of [-12.6,12.6])block(consoleUnit,steel,1.1,1.7,5.6,x,.85,0);
  block(consoleUnit,walnut,29.5,6.1,7.6,0,4.7,-.12);
  block(consoleUnit,oak,30,.64,8,0,8,0);
  for(const x of [-10,10]){
    block(consoleUnit,oak,9.1,5.5,.4,x,4.7,3.7);
    for(let dx=-3.3;dx<4;dx+=1.1)block(consoleUnit,oak,.45,5.2,.22,x+dx,4.7,3.92,.07);
  }
  block(consoleUnit,dark,9.6,4.8,.24,0,4.65,3.74);
  block(consoleUnit,oak,9.7,.46,.52,0,4.8,3.73);
  const bench=groups.bench;
  for(const x of [-9.6,9.6])for(const z of [-3.1,3.1])block(bench,walnut,1.2,5.9,1.2,x,2.95,z);
  for(const z of [-2.7,0,2.7])block(bench,oak,20.2,.65,1.3,0,2,z);
  block(bench,oak,24,.95,9,0,6,0,.32);
  block(bench,linen,23.5,1.45,8.6,0,7.05,0,.58);
  const enamel=makeMaterial(0x99b5a8,{roughness:.32});
  const retro=groups.compactFridge;
  block(retro,dark,9.4,.9,9.4,0,.48,0);
  block(retro,enamel,10.7,16.6,9.3,0,9.1,-.7,.9);
  for(const [y,h] of [[6.35,10.65],[14.6,5.15]]){
    block(retro,enamel,10.7,h,1.65,0,y,4.38,.56);
    block(retro,steel,.45,2.8,.46,-3.75,y,5.31,.17);
  }
  const dishwasher=groups.dishwasher;
  block(dishwasher,whiteSide,12,12.4,11.1,0,6.28,-.4,.26);
  block(dishwasher,whiteCabinet,11.7,10.5,.65,0,6.65,5.4,.19);
  block(dishwasher,dark,11.3,1.25,.45,0,11.65,5.62,.12);
  block(dishwasher,steel,8,.39,.58,0,10.3,5.68,.12);
  block(dishwasher,slate,2.1,.42,.12,3.4,11.66,5.86,.04);

  const bedside=groups.nightstand;
  block(bedside,walnut,9.7,1.1,7.8,0,.55,0);
  block(bedside,oak,10.8,6.7,8.4,0,4.45,-.12);
  block(bedside,oak,11,.65,9,0,8,0);
  block(bedside,dark,9.3,2.3,.2,0,2.8,4.1);
  block(bedside,oak,10.2,3,.45,0,5.95,4.1);
  block(bedside,brass,2.6,.27,.38,0,6,4.36);
  const shoes=groups.shoeCabinet;
  block(shoes,walnut,18.4,1.2,6,0,.6,0);
  block(shoes,whiteSide,20,14.6,6.5,0,8.45,-.15);
  for(const y of [5,12]){
    block(shoes,whiteCabinet,19.4,6.6,.44,0,y,3.13);
    block(shoes,oak,7,.42,.44,0,y+2.15,3.36);
  }
  const side=groups.sideTable;
  addMesh(side,new THREE.CylinderGeometry(3.3,4.4,.8,36),walnut,0,.4,0);
  addMesh(side,new THREE.CylinderGeometry(1,1.8,6.5,32),oak,0,3.9,0);
  addMesh(side,new THREE.CylinderGeometry(5.4,5.2,.65,40),tableMarble,0,7.4,0);
  const diningChair=groups.diningChair;
  for(const x of [-2.8,2.8])for(const z of [-3.1,3.1])block(diningChair,walnut,.65,5.5,.65,x,2.75,z);
  block(diningChair,oak,7.6,.7,8,0,5.6,0);
  block(diningChair,linen,7.5,.95,7.5,0,6.3,.1,.4);
  for(const x of [-3,3])block(diningChair,walnut,.55,5.9,.6,x,8.4,-3.6);
  block(diningChair,linen,7.8,3.8,1.1,0,10.35,-3.7,.48);
  const oven=groups.range;
  block(oven,steel,12.9,12,11.4,0,6.1,-.14,.28);
  block(oven,dark,11.4,7.8,.5,0,5.2,5.56);
  block(oven,slate,9.9,5.6,.17,0,5.2,5.85);
  block(oven,steel,9.2,.42,.65,0,9,5.62);
  block(oven,dark,12.9,.52,11.7,0,12.25,0);
  for(const x of [-3.1,3.1])for(const z of [-2.65,2.65])
    addMesh(oven,new THREE.TorusGeometry(1.75,.13,6,24),steel,x,12.57,z).rotation.x=Math.PI/2;
  const rack=groups.coatRack;
  addMesh(rack,new THREE.CylinderGeometry(3.5,4.4,.9,32),dark,0,.48,0);
  addMesh(rack,new THREE.CylinderGeometry(.55,.75,22,16),oak,0,11.6,0);
  for(let i=0;i<4;i++){
    const angle=i*Math.PI/2;
    const hook=block(rack,oak,.65,.65,4.2,Math.sin(angle)*1.9,17+i,Math.cos(angle)*1.9);
    hook.rotation.order='YXZ';hook.rotation.y=angle;hook.rotation.x=-.45;
  }

  // Only the named finish is editable. Hardware, upholstery textures,
  // light emitters and details continue to use their original materials.
  const editable={
    nightstand:[oak],shoeCabinet:[whiteCabinet,whiteSide],sideTable:[tableMarble],diningChair:[linen],range:[steel],coatRack:[oak],
    armchair:[linen],ottoman:[sage],bookcase:[oak,walnut],dresser:[oak],console:[oak],
    bench:[linen],compactFridge:[enamel],dishwasher:[whiteCabinet,whiteSide],
    officeDesk:[oak],officeChair:[slate],floorLamp:[brass],ledStrip:[steel],plant:[stone],
    rug:[rugInner],cabinets:[whiteCabinet,whiteSide],island:[whiteCabinet,whiteSide],stool:[linen],
    fridge:[steel],sofa:[linen],sectional:[linen],coffee:[tableMarble],media:[oak,walnut],dining:[oak],
    queen:[sage],single:[slate],washer:[whiteCabinet],dryer:[whiteCabinet],smallCabinet:[whiteCabinet,whiteSide],
    tallCabinet:[whiteCabinet,whiteSide],toilet:[porcelain],bathSink:[oak],bathtub:[porcelain],
  };
  for(const [kind,group] of Object.entries(groups)){
    group.traverse(mesh=>{if(editable[kind].includes(mesh.material))mesh.userData.tintable=true;});
  }

  function setLighting(night) {
    shade.emissiveIntensity = night ? 2.15 : 0.30;
    diffuser.emissiveIntensity = night ? 5 : 2.2;
    lampPool.opacity = night ? 0.68 : 0.22;
    stripPool.opacity = night ? 0.96 : 0.52;
  }
  return { groups, setLighting };
}

function pointInPolygon({ x, y }, polygon) {
  let inside = false;
  for (let i = 0, previous = polygon.length - 1; i < polygon.length; previous = i++) {
    const a = polygon[i];
    const b = polygon[previous];
    if ((a.y > y) !== (b.y > y) && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

function outlineMeetsBox(polygon, min, max) {
  return polygon.some((start, index) => {
    const end = polygon[(index + 1) % polygon.length];
    let first = 0;
    let last = 1;
    for (const axis of ['x', 'y']) {
      const delta = end[axis] - start[axis];
      if (delta === 0) {
        if (start[axis] < min[axis] || start[axis] > max[axis]) return false;
        continue;
      }
      const a = (min[axis] - start[axis]) / delta;
      const b = (max[axis] - start[axis]) / delta;
      first = Math.max(first, Math.min(a, b));
      last = Math.min(last, Math.max(a, b));
      if (first > last) return false;
    }
    return true;
  });
}

// Saved rotations are measured in quarter turns. Fractional turns keep old layouts compatible.
function footprintAxes(item) {
  const radians = item.rotation * Math.PI / 2;
  const c = Math.cos(radians), s = Math.sin(radians);
  return {width: new THREE.Vector2(c,-s), depth: new THREE.Vector2(s,c)};
}

function limits(item, margin = 0) {
  const spec = catalog[item.kind], axes = footprintAxes(item);
  const w = spec.width * item.width / 200 + margin;
  const d = spec.depth * item.depth / 200 + margin;
  const corners = [[-w,-d],[w,-d],[w,d],[-w,d]].map(([x,z]) =>
    new THREE.Vector2(item.x,item.z).addScaledVector(axes.width,x).addScaledVector(axes.depth,z));
  // Keep the screen-facing corner hit targets in their respective quadrants.
  const quadrant = Math.round(item.rotation);
  return corners.map((_,i)=>corners[(i+quadrant)%4]);
}

export function setupFurnishings({ model, camera, canvas, floors, additionalFloors, addMesh, makeMaterial, marbleMap, render, onEditing, storage=localStorage, checkFootprint }) {
  const viewer = canvas.parentElement;
  const stage = viewer.closest('.stage');
  const editor = document.querySelector('#furnishing-editor');
  const controls = (action) => document.querySelector('[data-furnishing="' + action + '"]');
  const editorButton = controls('edit');
  const visibleButton = controls('visible');
  const addButton = controls('add');
  const undoButton = controls('undo');
  const resizeButton = controls('resize');
  const flipChaiseButton = controls('flip-chaise');
  const sourceButton = document.querySelector('[data-view="source"]');
  const palette = document.querySelector('#furnishing-palette');
  const colorPanel=editor.querySelector('#furniture-colors'),colorButton=controls('color');
  const customColor=colorPanel.querySelector('input');
  for(const [name,color] of Object.entries(swatches)){
    const button=document.createElement('button');
    button.type='button';button.className='swatch';button.title=name;button.setAttribute('aria-label',name);
    button.dataset.color=color;button.style.setProperty('--finish',color);button.append(document.createElement('span'));
    colorPanel.insertBefore(button,customColor.parentElement);
    button.onclick=()=>changeColor(color);
  }
  customColor.onchange=()=>changeColor(customColor.value);
  controls('original').onclick=()=>changeColor(null);
  colorButton.onclick=()=>{showSize(false);showColor(colorPanel.hidden);};
  const colorBindings=new WeakMap();
  const selection = editor.querySelector('.edit-selection');
  const selectionName = editor.querySelector('.selected-name');
  const size = editor.querySelector('#furnishing-size');
  const [widthInput, depthInput] = [...size.querySelectorAll('input[type=range]')];
  const lockRatio=size.querySelector('[data-lock-ratio]');
  function isDimension(value, input) {
    return Number.isInteger(value) && value >= Number(input.min) && value <= Number(input.max);
  }
  const status = editor.querySelector('.furnishing-status');
  const note = document.querySelector('.furnishing-note');
  const layer = new THREE.Group();
  model.add(layer);
  const objects = new Map();
  const { groups: prototypes, setLighting } = buildPrototypes(addMesh, makeMaterial, marbleMap);
  const boundary = floors.flatMap(path => path.toShapes().map(shape => shape.extractPoints(1)));
  const ray = new THREE.Raycaster();
  const cursor = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  const guideMaterial = new THREE.LineBasicMaterial({ color: 0xffc38c, depthTest: false, toneMapped: false });
  const guidePoints = new THREE.Float32BufferAttribute(12, 3);
  const guideGeometry = new THREE.BufferGeometry().setAttribute('position', guidePoints);
  const guide = new THREE.LineLoop(guideGeometry, guideMaterial);
  guide.renderOrder = 5;
  guide.frustumCulled = false;
  guide.visible = false;
  model.add(guide);

  function fits(item) {
    const corners = limits(item, 0.75);
    if (checkFootprint) return checkFootprint([...corners,{x:item.x,y:item.z}]);
    const axes = footprintAxes(item);
    const center = new THREE.Vector2(item.x,item.z);
    const half = new THREE.Vector2(catalog[item.kind].width*item.width/200+.75,
      catalog[item.kind].depth*item.depth/200+.75);
    const min = half.clone().negate();
    const meetsFootprint = polygon => outlineMeetsBox(polygon.map(vertex=>{
      const delta = new THREE.Vector2(vertex.x-center.x,vertex.y-center.y);
      return new THREE.Vector2(delta.dot(axes.width),delta.dot(axes.depth));
    }),min,half);
    return [...boundary, ...additionalFloors()].some(({ shape, holes }) =>
      corners.every(point => pointInPolygon(point, shape)) &&
      !meetsFootprint(shape) && holes.every(hole => !meetsFootprint(hole))
    );
  }

  function restore() {
    try {
      const saved = JSON.parse(storage.getItem(storageKey));
      if (saved?.version === 1 && Array.isArray(saved.items)) {
        const ids = new Set();
        return saved.items.filter(item => {
          if (!item || !Object.hasOwn(catalog, item.kind) ||
            !Number.isSafeInteger(item.id) || item.id < 1 || ids.has(item.id) ||
            !Number.isFinite(item.x) || !Number.isFinite(item.z) ||
            !Number.isFinite(item.rotation) || item.rotation < 0 || item.rotation >= 4 ||
            !isDimension(item.width, widthInput) || !isDimension(item.depth, depthInput) || (!fits(item) && item.kind !== 'coffee')) return false;
          if(typeof item.color!=='string' || !/^#[0-9a-f]{6}$/i.test(item.color))delete item.color;
          if(!isDimension(item.height,widthInput))delete item.height;
          ids.add(item.id);
          return true;
        });
      }
    } catch {
      // The layout is still usable when browser storage is unavailable.
    }
    return [];
  }

  const items = restore();
  let nextId = Math.max(0, ...items.map(item => item.id)) + 1;
  let selectedId = null;
  let pendingKind = null;
  let pendingPoint = null;
  let gesture = null;
  let undoState = null;
  let drawFrame = 0;
  let updateShadows = false;
  const current = () => items.find(item => item.id === selectedId);
  const instruction = 'Drag a piece to move it. Drag a selected corner to resize.';

  function redraw(relight = false) {
    updateShadows ||= relight;
    if (drawFrame) return;
    drawFrame = requestAnimationFrame(() => {
      drawFrame = 0;
      const dirty = updateShadows;
      updateShadows = false;
      render(dirty);
    });
  }

  // Three.js clones share their prototype materials. Clone only the finish
  // of a customized piece, retaining the original material for an exact reset.
  function releaseColor(object){
    const binding=colorBindings.get(object);
    if(!binding)return;
    for(const [mesh,original] of binding.meshes)mesh.material=original;
    for(const material of binding.materials.values())material.dispose();
    colorBindings.delete(object);
  }
  function applyColor(object,color){
    if(!color){releaseColor(object);return;}
    let binding=colorBindings.get(object);
    if(!binding){
      binding={meshes:[],materials:new Map()};colorBindings.set(object,binding);
      object.traverse(mesh=>{
        if(!mesh.userData.tintable)return;
        const original=mesh.material;
        if(!binding.materials.has(original))binding.materials.set(original,original.clone());
        binding.meshes.push([mesh,original]);mesh.material=binding.materials.get(original);
      });
    }
    if(binding.color===color)return;
    for(const material of binding.materials.values())material.color.set(color);
    binding.color=color;
  }
  function changeColor(color){
    const item=current();
    if(!item || (item.color || null)===color)return;
    remember();
    if(color)item.color=color;else delete item.color;
    applyItem(item);updateSelection();save(color?'Color updated.':'Original color restored.');redraw();
  }
  function showColor(visible){
    colorPanel.hidden=!visible;colorButton.setAttribute('aria-expanded',String(visible));
  }
  function applyItem(item) {
    let object = objects.get(item.id);
    if (!object) {
      object = prototypes[item.kind].clone();
      object.userData.furnishingId = item.id;
      objects.set(item.id, object);
      layer.add(object);
    }
    applyColor(object,item.color);
    object.position.set(item.x, 0, item.z);
    object.rotation.y = item.rotation * Math.PI / 2;
    const mirrored = item.kind === 'sectional' && item.chaise !== 'left';
    const width=item.width/100,depth=item.depth/100,height=(item.height ?? 100)/100;
    object.scale.set(mirrored?-width:width,height,depth);
    const attached=object.getObjectByName('equipment');
    if(attached)sizeEquipment(attached,width,height,depth);
  }

  function message(text) {
    status.textContent = text;
  }

  function save(text) {
    try {
      storage.setItem(storageKey, JSON.stringify({ version: 1, items }));
      message(text);
    } catch {
      message(text + ' Browser storage is unavailable.');
    }
    viewer.dataset.furnishings = String(items.length);
  }

  function remember() {
    undoState = { items: items.map(item => ({ ...item })), selectedId };
    undoButton.hidden = false;
  }

  function showGuide(item, valid = true) {
    guide.visible = Boolean(item && !editor.hidden && layer.visible);
    if (!guide.visible) return;
    guideMaterial.color.setHex(valid ? 0xffc38c : 0xff866c);
    limits(item, 0.7).forEach((point, index) => guidePoints.setXYZ(index, point.x, 0.3, point.y));
    guidePoints.needsUpdate = true;
  }

  const projectedCorner = new THREE.Vector3();
  const cornerHandles = ['nw','ne','se','sw'].map((name,index) => {
    const handle = document.createElement('div');
    handle.className = 'furniture-corner ' + name;
    handle.dataset.corner = name;
    handle.setAttribute('aria-hidden','true');
    handle.hidden = true;
    editor.prepend(handle);
    handle.addEventListener('pointerdown', event => {
      const item = current();
      if (!item || gesture || !event.isPrimary || event.button !== 0) return;
      const point = locate(event);
      if (!point) return;
      event.preventDefault();
      canvas.focus({preventScroll:true});
      const corners = limits(item);
      gesture = {
        item, pointerId:event.pointerId, startX:event.clientX, startY:event.clientY,
        corner:index, origin:new THREE.Vector2(point.x,point.z), anchor:corners[(index+2)%4],
        startCorner:corners[index], preview:item, dragging:false,
      };
      canvas.setPointerCapture(event.pointerId);
    });
    return handle;
  });

  const rotateHandle = document.createElement('button');
  rotateHandle.type = 'button';
  rotateHandle.className = 'furniture-turn';
  rotateHandle.setAttribute('aria-label','Drag to rotate furniture');
  rotateHandle.title = 'Drag to rotate. Use arrow keys for 1° steps.';
  rotateHandle.textContent = '↻';
  rotateHandle.hidden = true;
  editor.prepend(rotateHandle);

  function turned(item, radians) {
    return {...item, rotation:THREE.MathUtils.euclideanModulo(item.rotation+radians*2/Math.PI,4)};
  }

  rotateHandle.addEventListener('pointerdown', event=>{
    const item=current();
    if (!item || gesture || !event.isPrimary || event.button!==0) return;
    const point=locate(event);
    if (!point) return;
    event.preventDefault();
    canvas.focus({preventScroll:true});
    gesture={item,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,
      startAngle:Math.atan2(point.z-item.z,point.x-item.x),preview:item,dragging:false};
    canvas.setPointerCapture(event.pointerId);
  });

  rotateHandle.addEventListener('keydown',event=>{
    if (!['ArrowLeft','ArrowRight'].includes(event.key) || !current()) return;
    event.preventDefault();
    const step=(event.key==='ArrowLeft'?1:-1)*(event.shiftKey?15:1);
    revise(current(),turned(current(),THREE.MathUtils.degToRad(step)),'Rotated.');
  });

  function rotationPreview(active,point) {
    const item=active.item;
    if (Math.hypot(point.z-item.z,point.x-item.x)<0.01) return active.preview;
    const angle=Math.atan2(point.z-item.z,point.x-item.x);
    const candidate=turned(item,active.startAngle-angle);
    return fits(candidate) ? candidate : active.preview;
  }

  function refreshHandles() {
    const visible = guide.visible && !pendingKind && Boolean(current());
    rotateHandle.hidden = !visible;
    if (visible) {
      const item = gesture?.preview || current();
      const axis = footprintAxes(item).depth;
      const offset = catalog[item.kind].depth*item.depth/200+.7;
      projectedCorner.set(item.x-axis.x*offset,0.3,item.z-axis.y*offset);
      model.localToWorld(projectedCorner).project(camera);
      const edgeX=(projectedCorner.x+1)*viewer.clientWidth/2;
      const edgeY=(1-projectedCorner.y)*viewer.clientHeight/2;
      projectedCorner.set(item.x,0.3,item.z);
      model.localToWorld(projectedCorner).project(camera);
      const dx=edgeX-(projectedCorner.x+1)*viewer.clientWidth/2;
      const dy=edgeY-(1-projectedCorner.y)*viewer.clientHeight/2;
      const length=Math.hypot(dx,dy)||1;
      rotateHandle.style.left=(edgeX+38*dx/length)+'px';
      rotateHandle.style.top=(edgeY+38*dy/length)+'px';
      rotateHandle.style.setProperty('--stem-angle',Math.atan2(-dy,-dx)+'rad');
    }
    for (const [i,handle] of cornerHandles.entries()) {
      handle.hidden = !visible;
      if (!visible) continue;
      projectedCorner.fromBufferAttribute(guidePoints,i);
      model.localToWorld(projectedCorner).project(camera);
      handle.style.left = ((projectedCorner.x+1)*50)+'%';
      handle.style.top = ((1-projectedCorner.y)*50)+'%';
    }
  }

  function resizeFromCorner(active, point) {
    const {item, anchor, startCorner, origin} = active;
    const axes = footprintAxes(item);
    const diagonal = startCorner.clone().sub(anchor);
    const sx = Math.sign(diagonal.dot(axes.width));
    const sz = Math.sign(diagonal.dot(axes.depth));
    diagonal.x += point.x-origin.x;
    diagonal.y += point.z-origin.y;
    const spec = catalog[item.kind];
    const snapPercent = (v,input) => THREE.MathUtils.clamp(Math.round(v/Number(input.step))*Number(input.step),Number(input.min),Number(input.max));
    const width = snapPercent(100*sx*diagonal.dot(axes.width)/spec.width,widthInput);
    const depth = snapPercent(100*sz*diagonal.dot(axes.depth)/spec.depth,depthInput);
    function candidate(w,d) {
      const center = anchor.clone().addScaledVector(axes.width,sx*spec.width*w/200)
        .addScaledVector(axes.depth,sz*spec.depth*d/200);
      return {...item,width:w,depth:d,x:center.x,z:center.y};
    }
    if(lockRatio.checked){
      const w0=spec.width*item.width/100,d0=spec.depth*item.depth/100;
      const scale=(sx*diagonal.dot(axes.width)*w0+sz*diagonal.dot(axes.depth)*d0)/(w0*w0+d0*d0);
      const size=proportionalSize(item,Math.round(scale*100)/100);
      const result={...candidate(size.width,size.depth),height:size.height};
      return fits(result)?result:active.preview;
    }
    const target = candidate(width,depth);
    if (fits(target)) return target;
    // Walk back to the nearest fitting increment, keeping the far corner anchored.
    const last = active.preview;
    const steps = Math.ceil(Math.max(Math.abs(width-last.width),Math.abs(depth-last.depth))/5);
    for (let i=1; i<steps; i++) {
      const smaller = candidate(snapPercent(width+(last.width-width)*i/steps,widthInput),
        snapPercent(depth+(last.depth-depth)*i/steps,depthInput));
      if (fits(smaller)) return smaller;
    }
    return last;
  }

  function showSize(visible) {
    size.hidden = !visible;
    resizeButton.setAttribute('aria-expanded', String(visible));
  }

  function updateSelection() {
    const item = current();
    selection.hidden = !item || editor.hidden || Boolean(pendingKind);
    showGuide(selection.hidden ? null : item);
    if (selection.hidden) return;
    selectionName.textContent = catalog[item.kind].label;
    const original=prototypes[item.kind].children.find(mesh=>mesh.userData.tintable).material.color;
    customColor.value=item.color || '#'+original.getHexString();
    colorButton.style.setProperty('--finish',customColor.value);
    for(const swatch of colorPanel.querySelectorAll('[data-color]')){
      swatch.setAttribute('aria-pressed',String(swatch.dataset.color===item.color?.toLowerCase()));
    }
    controls('original').disabled=!item.color;
    flipChaiseButton.hidden = item.kind !== 'sectional';
    widthInput.value = item.width;
    depthInput.value = item.depth;
    for (const input of [widthInput, depthInput]) input.nextElementSibling.value = input.value + '%';
  }

  function select(id) {
    if (id !== selectedId) {showSize(false);showColor(false);}
    selectedId = id;
    updateSelection();
    redraw();
  }

  function setVisible(visible) {
    layer.visible = visible;
    note.hidden = !visible;
    visibleButton.setAttribute('aria-pressed', String(visible));
    updateSelection();
    redraw(true);
  }

  function showPalette(visible) {
    palette.hidden = !visible;
    addButton.setAttribute('aria-expanded', String(visible));
  }

  function clearPlacement() {
    pendingKind = null;
    pendingPoint = null;
    viewer.dataset.placing = 'false';
  }

  function releaseGesture() {
    const previous = gesture;
    gesture = null;
    viewer.dataset.dragging = 'false';
    if (previous && canvas.hasPointerCapture(previous.pointerId)) {
      canvas.releasePointerCapture(previous.pointerId);
    }
    return previous;
  }

  function cancelGesture() {
    const previous = releaseGesture();
    if (previous?.item && previous.dragging) applyItem(previous.item);
    updateSelection();
    redraw(Boolean(previous?.dragging));
  }

  function setEditing(editing) {
    cancelGesture();
    clearPlacement();
    showPalette(false);
    showSize(false);
    showColor(false);
    editor.hidden = !editing;
    editorButton.setAttribute('aria-expanded', String(editing));
    stage.dataset.editing = String(editing);
    viewer.dataset.furnishingEditing = String(editing);
    selectedId = null;
    if (editing && !layer.visible) setVisible(true);
    updateSelection();
    onEditing(editing);
    if (editing) {
      message(instruction);
      addButton.focus();
    } else if (!sourceButton.disabled) {
      editorButton.focus();
    }
  }

  function revise(item, changes, text) {
    const candidate = { ...item, ...changes };
    if (!fits(candidate)) {
      applyItem(item);
      message('Too close to a wall. Try a spot inside the room.');
      updateSelection();
      redraw(true);
      return;
    }
    if (Object.keys(changes).some(key => item[key] !== candidate[key])) {
      remember();
      Object.assign(item, changes);
      save(text);
    }
    applyItem(item);
    updateSelection();
    redraw(true);
  }

  function locate(event) {
    const bounds = canvas.getBoundingClientRect();
    cursor.set(
      (event.clientX - bounds.left) / bounds.width * 2 - 1,
      1 - (event.clientY - bounds.top) / bounds.height * 2,
    );
    ray.setFromCamera(cursor, camera);
    return ray.ray.intersectPlane(plane, hit) ? model.worldToLocal(hit) : null;
  }

  function pickItem() {
    let object = ray.intersectObjects(layer.children, true).find(hit => !hit.object.userData.lightPool)?.object;
    while (object && object.parent !== layer) object = object.parent;
    const id = object?.userData.furnishingId;
    return items.find(item => item.id === id);
  }

  function snap(value) {
    return Math.round(value * 2) / 2;
  }

  function sample(kind, x, z) {
    return { id: nextId, kind, x: snap(x), z: snap(z), rotation: 0, width: 100, depth: 100 };
  }

  function firstSpot(kind) {
    for (const { shape } of [...boundary, ...additionalFloors()]) {
      const center = new THREE.Box2().setFromPoints(shape).getCenter(new THREE.Vector2());
      if (fits(sample(kind, center.x, center.y))) return new THREE.Vector2(center.x, center.y);
    }
    return null;
  }

  function previewPlace(position) {
    pendingPoint = new THREE.Vector2(position.x, position.z);
    const item = sample(pendingKind, pendingPoint.x, pendingPoint.y);
    showGuide(item, fits(item));
    redraw();
  }

  function place() {
    if (!pendingPoint) return;
    const item = sample(pendingKind, pendingPoint.x, pendingPoint.y);
    if (!fits(item)) {
      message('This piece needs more space. Try a larger room.');
      return;
    }
    remember();
    nextId++;
    items.push(item);
    applyItem(item);
    clearPlacement();
    select(item.id);
    save('Placed. Drag to fine-tune.');
    redraw(true);
  }

  function movePosition(active, point) {
    return { x: snap(point.x + active.offsetX), z: snap(point.z + active.offsetZ) };
  }

  for (const [room,kinds] of Object.entries(rooms)) {
    const section=document.createElement('section'),title=document.createElement('h3');
    title.textContent=room;section.className='furniture-room';section.setAttribute('aria-label',room);
    section.append(title);palette.append(section);
    for(const kind of kinds)addChoice(kind,section);
  }
  function addChoice(kind,section) {
    const info=catalog[kind];
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.furnitureKind = kind;
    button.textContent = info.label;
    section.append(button);
    button.addEventListener('click', event => {
      showPalette(false);
      pendingKind = kind;
      pendingPoint = null;
      viewer.dataset.placing = 'true';
      select(null);
      message('Click or tap the floor to place the ' + info.label.toLowerCase() + '.');
      canvas.focus({ preventScroll: true });
      if (event.detail === 0) {
        const first = firstSpot(kind);
        if (first) previewPlace({ x: first.x, z: first.y });
      }
    });
  }

  visibleButton.addEventListener('click', () => setVisible(!layer.visible));
  editorButton.addEventListener('click', () => setEditing(true));
  controls('done').addEventListener('click', () => setEditing(false));
  addButton.addEventListener('click', () => {
    cancelGesture();
    clearPlacement();
    updateSelection();
    showPalette(palette.hidden);
    message(palette.hidden ? instruction : 'Choose a piece.');
    redraw();
  });
  sourceButton.addEventListener('click', () => {
    const sourceOpen = sourceButton.getAttribute('aria-pressed') === 'true';
    if (sourceOpen && !editor.hidden) setEditing(false);
    editorButton.disabled = visibleButton.disabled = sourceOpen;
  });
  controls('rotate').addEventListener('click', () => {
    const item = current();
    if (item) revise(item, { rotation: (item.rotation + 1) % 4 }, 'Rotated.');
  });
  flipChaiseButton.addEventListener('click', () => {
    const item = current();
    if (item?.kind === 'sectional') revise(item, { chaise: item.chaise === 'left' ? 'right' : 'left' }, 'Chaise flipped.');
  });
  resizeButton.addEventListener('click', () => {showColor(false);showSize(size.hidden);});
  controls('remove').addEventListener('click', () => {
    const index = items.findIndex(item => item.id === selectedId);
    if (index === -1) return;
    remember();
    const [removed] = items.splice(index, 1);
    releaseColor(objects.get(removed.id));
    layer.remove(objects.get(removed.id));
    objects.delete(removed.id);
    select(null);
    save('Removed.');
    redraw(true);
    canvas.focus({ preventScroll: true });
  });
  undoButton.addEventListener('click', () => {
    if (!undoState) return;
    cancelGesture();
    clearPlacement();
    showPalette(false);
    for(const object of objects.values())releaseColor(object);
    layer.clear();
    objects.clear();
    items.splice(0, items.length, ...undoState.items);
    for (const item of items) applyItem(item);
    select(undoState.selectedId);
    undoState = null;
    undoButton.hidden = true;
    save('Undo complete.');
    redraw(true);
    canvas.focus({ preventScroll: true });
  });
  for (const [dimension, input] of [['width', widthInput], ['depth', depthInput]]) {
    input.addEventListener('input', () => { input.nextElementSibling.value = input.value + '%'; });
    input.addEventListener('change', () => {
      const item = current();
      if (item) revise(item, lockRatio.checked ? proportionalSize(item,Number(input.value)/item[dimension]) : { [dimension]: Number(input.value) }, 'Resized.');
    });
  }

  canvas.addEventListener('pointerdown', event => {
    if (editor.hidden || !event.isPrimary || event.button !== 0 || gesture) return;
    const point = locate(event);
    if (!point) return;
    event.preventDefault();
    canvas.focus({ preventScroll: true });
    showPalette(false);
    const item = pendingKind ? null : pickItem();
    if (!pendingKind) {
      select(item?.id ?? null);
      message(item ? 'Drag ↻ to rotate or a corner to resize.' : instruction);
    }
    if (!item && !pendingKind) return;
    gesture = {
      pointerId: event.pointerId,
      item,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: item ? item.x - point.x : 0,
      offsetZ: item ? item.z - point.z : 0,
      dragging: false,
    };
    canvas.setPointerCapture(event.pointerId);
    if (pendingKind) previewPlace(point);
  });

  canvas.addEventListener('pointermove', event => {
    if (editor.hidden || !event.isPrimary) return;
    if (pendingKind) {
      const point = locate(event);
      if (point) previewPlace(point);
      return;
    }
    if (!gesture?.item || gesture.pointerId !== event.pointerId) return;
    if (!gesture.dragging && Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) < 4) return;
    const point = locate(event);
    if (!point) return;
    gesture.dragging = true;
    viewer.dataset.dragging = 'true';
    if (gesture.startAngle !== undefined) {
      const candidate = rotationPreview(gesture,point);
      gesture.preview = candidate;
      applyItem(candidate);
      showGuide(candidate);
      message('Rotation ' + Math.round(candidate.rotation*90)%360 + '°');
      redraw(true);
      return;
    }
    const resizing = gesture.corner !== undefined;
    const candidate = resizing ? resizeFromCorner(gesture,point) : { ...gesture.item, ...movePosition(gesture, point) };
    gesture.preview = candidate;
    if (resizing) {
      message(candidate.width + '% wide · ' + candidate.depth + '% deep');
      for (const [input,value] of [[widthInput,candidate.width],[depthInput,candidate.depth]]) {
        input.value = value;
        input.nextElementSibling.value = value + '%';
      }
    }
    applyItem(candidate);
    showGuide(candidate, fits(candidate));
    redraw(true);
  });

  canvas.addEventListener('pointerup', event => {
    if (gesture?.pointerId !== event.pointerId) return;
    const point = locate(event);
    const completed = releaseGesture();
    if (pendingKind && point) {
      previewPlace(point);
      place();
    } else if (completed.dragging && point) {
      if (completed.startAngle !== undefined) revise(completed.item,rotationPreview(completed,point),'Rotated.');
      else if (completed.corner !== undefined) revise(completed.item,resizeFromCorner(completed,point),'Resized.');
      else revise(completed.item, movePosition(completed, point), 'Moved.');
    } else if (completed.dragging) {
      applyItem(completed.item);
      updateSelection();
      redraw(true);
    }
  });
  for (const name of ['pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(name, event => {
      if (gesture?.pointerId === event.pointerId) cancelGesture();
    });
  }
  canvas.addEventListener('pointerleave', () => {
    if (editor.hidden || !pendingKind || gesture) return;
    pendingPoint = null;
    showGuide(null);
    redraw();
  });

  function cancelEditingStep() {
    if (gesture) {
      cancelGesture();
      message('Edit cancelled.');
    } else if (pendingKind) {
      clearPlacement();
      updateSelection();
      message(instruction);
      redraw();
    } else if (!palette.hidden) {
      showPalette(false);
      addButton.focus();
      message(instruction);
    } else if (!colorPanel.hidden) {
      showColor(false);colorButton.focus();
    } else if (!size.hidden) {
      showSize(false);
      resizeButton.focus();
    } else {
      setEditing(false);
    }
  }

  editor.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    cancelEditingStep();
  });

  for (const item of items) applyItem(item);
  viewer.dataset.furnishings = String(items.length);
  return {
    setLighting,
    visitLightFixtures(visit){
      if(!layer.visible)return;
      for(const item of items)if(item.kind==='floorLamp' || item.kind==='ledStrip')visit(item.kind,objects.get(item.id));
    },
    refreshHandles,cancelGesture,
    handleKey(event) {
      if (editor.hidden) return false;
      if (event.key === 'Escape') {
        event.preventDefault();
        cancelEditingStep();
        return true;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z' && undoState) {
        event.preventDefault();
        undoButton.click();
        return true;
      }
      if (pendingKind && event.key === 'Enter') {
        event.preventDefault();
        pendingPoint ??= firstSpot(pendingKind);
        place();
        return true;
      }
      if (['PageUp', 'PageDown'].includes(event.key) && items.length && !pendingKind) {
        event.preventDefault();
        const index = items.findIndex(item => item.id === selectedId);
        const offset = event.key === 'PageDown' ? 1 : -1;
        select(items[(items.length + (index === -1 ? (offset === 1 ? 0 : -1) : index + offset)) % items.length].id);
        message('Selected ' + catalog[current().kind].label.toLowerCase() + '.');
        return true;
      }
      const offsets = { ArrowLeft: [-1.5, 0], ArrowRight: [1.5, 0], ArrowUp: [0, -1.5], ArrowDown: [0, 1.5] };
      const offset = offsets[event.key];
      if (!offset) return false;
      event.preventDefault();
      if (pendingKind) {
        const point = pendingPoint ?? firstSpot(pendingKind);
        if (point) previewPlace({ x: point.x + offset[0], z: point.y + offset[1] });
      } else {
        const item = current();
        if (item) revise(item, { x: item.x + offset[0], z: item.z + offset[1] }, 'Moved.');
      }
      return true;
    },
  };
}
