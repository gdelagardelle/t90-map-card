import { setupRoomPicking } from './ecovacs-room-picking.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { setupFurnishings } from './ecovacs-furnishings.js';
import { setupWallEditor } from './ecovacs-wall-editor.js';
import { RunTrail } from './ecovacs-run-trail.js';
import { scan, scope } from './scene-context.js';

const viewer = document.querySelector('.viewer');
const notice = document.querySelector('.notice');
const compare = new Image();
const cameraButtons = [...document.querySelectorAll('[data-camera]')];
const dockPin = document.querySelector('.dock-pin');
const sourceButton = document.querySelector('[data-view="source"]');
const routeButton = document.querySelector('[data-view="route"]');

const parsed = new SVGLoader().parse(scan);
const drawing = parsed.xml;
const [left, top, width, height] = drawing.getAttribute('viewBox').split(/\s+/).map(Number);
const centerX = left + width / 2;
const centerZ = top + height / 2;
const roomGroup = drawing.firstElementChild;
const walls = parsed.paths.filter(path => path.userData.node.parentElement.classList.contains('o'));
const floors = parsed.paths.filter(path => path.userData.node.parentElement === roomGroup);
const routePath = parsed.paths.find(path =>
  path.userData.node.parentElement === drawing && path.userData.node.hasAttribute('transform')
);

function makeMaterial(color, extra = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, ...extra });
}

function addMesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function makeSlab(shape, parent, material, thickness, lift = 0) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: false,
    curveSegments: 4,
  });
  geometry.rotateX(Math.PI / 2);
  return addMesh(parent, geometry, material, 0, lift);
}

function wallSegments(paths) {
  const lines = new Map();
  for (const path of paths) {
    for (const section of path.subPaths) {
      const points = section.getPoints(1);
      for (let i = 1; i < points.length; i++) {
        const start = points[i - 1];
        const end = points[i];
        const direction = end.clone().sub(start);
        if (direction.lengthSq() < 0.000001) continue;
        direction.normalize();
        if (direction.x < -0.000001 || (Math.abs(direction.x) < 0.000001 && direction.y < 0)) {
          direction.negate();
        }
        const perpendicular = new THREE.Vector2(-direction.y, direction.x);
        const offset = perpendicular.dot(start);
        const key = [direction.x, direction.y, offset].map(value => Math.round(value * 10000)).join(',');
        const line = lines.get(key) ?? { direction, perpendicular, offset, spans: [] };
        line.spans.push([direction.dot(start), direction.dot(end)].sort((a, b) => a - b));
        lines.set(key, line);
      }
    }
  }

  const segments = [];
  for (const { direction, perpendicular, offset, spans } of lines.values()) {
    const merged = [];
    for (const [start, end] of spans.sort((a, b) => a[0] - b[0])) {
      const prior = merged.at(-1);
      if (prior && start <= prior[1] + 0.0001) prior[1] = Math.max(prior[1], end);
      else merged.push([start, end]);
    }
    for (const span of merged) {
      segments.push(span.map(distance =>
        direction.clone().multiplyScalar(distance).addScaledVector(perpendicular, offset)
      ));
    }
  }
  return segments;
}

function positionOf(symbol) {
  const marker = [...drawing.children].find(child =>
    child.localName === 'use' && child.getAttribute('href') === symbol
  );
  if (!marker) return null;
  const point = new THREE.Vector2(Number(marker.getAttribute('x')), Number(marker.getAttribute('y')));
  return Number.isFinite(point.x) && Number.isFinite(point.y) ? point : null;
}

function stoneNoise(x, y) {
  let value = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

function blendedStoneNoise(x, y) {
  const column = Math.floor(x);
  const row = Math.floor(y);
  const dx = x - column;
  const dy = y - row;
  const blendX = dx * dx * (3 - 2 * dx);
  const blendY = dy * dy * (3 - 2 * dy);
  const upper = THREE.MathUtils.lerp(stoneNoise(column, row), stoneNoise(column + 1, row), blendX);
  const lower = THREE.MathUtils.lerp(stoneNoise(column, row + 1), stoneNoise(column + 1, row + 1), blendX);
  return THREE.MathUtils.lerp(upper, lower, blendY);
}

function makeMarbleTileMaterial(renderer) {
  const tileCount = 8;
  const tileResolution = 128;
  const tileSpan = 13.5; // Scan units. The physical tile size can be calibrated later.
  const size = tileCount * tileResolution;
  const colorPixels = new Uint8Array(size * size * 4);
  const surfacePixels = new Uint8Array(colorPixels.length);

  for (let row = 0; row < tileCount; row++) {
    for (let column = 0; column < tileCount; column++) {
      const originX = column * 23 + 18;
      const originY = row * 19 + 31;
      const angle = (stoneNoise(originX, originY) - 0.5) * 1.9 + 0.66;
      const sine = Math.sin(angle);
      const cosine = Math.cos(angle);
      const tileTone = (stoneNoise(originX + 9, originY) - 0.5) * 12;
      const veinOffset = stoneNoise(originX, originY + 9) * 0.84 - 0.42;

      for (let y = 0; y < tileResolution; y++) {
        for (let x = 0; x < tileResolution; x++) {
          const index = ((row * tileResolution + y) * size + column * tileResolution + x) * 4;
          const edge = Math.min(x, y, tileResolution - 1 - x, tileResolution - 1 - y);
          if (edge === 0) {
            colorPixels.set([188, 184, 177, 255], index);
            surfacePixels.set([61, 255, 0, 255], index);
            continue;
          }

          const u = x / tileResolution - 0.5;
          const v = y / tileResolution - 0.5;
          const along = u * cosine + v * sine;
          const across = -u * sine + v * cosine;
          const cloud = blendedStoneNoise(originX + u * 4, originY + v * 4) - 0.5;
          const detail = blendedStoneNoise(originX + u * 15, originY + v * 15) - 0.5;
          const ripple = blendedStoneNoise(originX + along * 9, originY + across * 7) - 0.5;
          const veinDistance = across - veinOffset + cloud * 0.37 + detail * 0.042;
          const shadow = Math.exp(-Math.abs(veinDistance) * 12) * 20;
          const filament = Math.exp(-Math.abs(veinDistance + ripple * 0.017) * 105) * 22;
          const branch = Math.exp(-Math.abs(veinDistance + 0.07 + ripple * 0.08) * 53) * 10;
          const shade = 244 + tileTone + cloud * 10 + detail * 3 - shadow - filament - branch - (edge === 1 ? 12 : 0);
          colorPixels.set([shade, shade - 1, shade - 3, 255], index);
          surfacePixels.set([edge === 1 ? 112 : 153, 178 + shadow * 2, 0, 255], index);
        }
      }
    }
  }

  function tiledTexture(pixels, colorSpace) {
    const texture = new THREE.DataTexture(pixels, size, size);
    texture.colorSpace = colorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.setScalar(1 / (tileSpan * tileCount));
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    texture.needsUpdate = true;
    return texture;
  }

  const map = tiledTexture(colorPixels, THREE.SRGBColorSpace);
  const surface = tiledTexture(surfacePixels, THREE.NoColorSpace);
  return new THREE.MeshPhysicalMaterial({
    color: 0xefeeeb,
    map,
    bumpMap: surface,
    bumpScale: 0.105,
    roughnessMap: surface,
    roughness: 0.67,
    clearcoat: 0.24,
    clearcoatRoughness: 0.29,
  });
}

function makeRobot() {
  const robot = new THREE.Group();
  const bumper = makeMaterial(0x252427, { metalness: 0.2, roughness: 0.52 });
  const shell = makeMaterial(0x3d3b40, { metalness: 0.42, roughness: 0.32 });
  const trim = makeMaterial(0x6f6660, { metalness: 0.38, roughness: 0.36 });
  const top = makeMaterial(0x24242a, { metalness: 0.21, roughness: 0.4 });
  const light = new THREE.MeshBasicMaterial({ color: 0xffad61, toneMapped: false });
  addMesh(robot, new THREE.CylinderGeometry(3.31, 3.28, 0.36, 64), bumper, 0, 0.27);
  addMesh(robot, new THREE.LatheGeometry([
    [0, 0.38], [3.15, 0.38], [3.38, 0.49], [3.47, 0.62], [3.47, 1.42],
    [3.39, 1.64], [3.21, 1.78], [0, 1.78],
  ].map(([x, y]) => new THREE.Vector2(x, y)), 72), shell);
  addMesh(robot, new THREE.CylinderGeometry(3.2, 3.2, 0.055, 64), top, 0, 1.795);
  const seam = addMesh(robot, new THREE.TorusGeometry(3.07, 0.017, 5, 72), trim, 0, 1.825);
  seam.rotateX(Math.PI / 2);
  addMesh(robot, new THREE.CylinderGeometry(3.465, 3.465, 0.035, 72), trim, 0, 0.77);
  addMesh(robot, new RoundedBoxGeometry(1.38, 0.37, 0.21, 2, 0.1), top, 0, 1.23, 3.365);
  addMesh(robot, new RoundedBoxGeometry(0.98, 0.04, 0.14, 2, 0.02), light, 0, 1.84, 2.16);
  return robot;
}

function renderPortrait(renderer) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1.25, 0.1, 80);
  camera.position.set(3.6, 5.2, 10.9);
  camera.lookAt(0, 0.93, 0);
  scene.add(makeRobot(), new THREE.HemisphereLight(0xc8cad4, 0x584334, 2.0));
  const key = new THREE.DirectionalLight(0xffd3a9, 3.6);
  key.position.set(-4, 8, 6);
  key.castShadow = true;
  key.shadow.camera.left = key.shadow.camera.bottom = -6;
  key.shadow.camera.right = key.shadow.camera.top = 6;
  key.shadow.mapSize.set(512, 512);
  key.shadow.normalBias = 0.08;
  key.shadow.intensity = 0.65;
  const rim = new THREE.DirectionalLight(0xc6cadc, 2.4);
  rim.position.set(4, 3, -5);
  const ground = addMesh(scene, new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.44 }));
  ground.rotateX(-Math.PI / 2);
  ground.castShadow = false;
  scene.add(key, rim);
  renderer.setPixelRatio(1);
  renderer.setSize(550, 440, false);
  renderer.render(scene, camera);
  const portrait = new Image();
  portrait.src = renderer.domElement.toDataURL();
  portrait.alt = 'Illustrative 3D vacuum model';
  document.querySelector('.product').append(portrait);
  const materials = new Set();
  scene.traverse(object => {
    if (!object.isMesh) return;
    object.geometry.dispose();
    materials.add(object.material);
  });
  for (const material of materials) material.dispose();
  key.shadow.dispose();
}

function renderPreview() {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1800);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderPortrait(renderer);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.setAttribute('aria-label', 'Three-dimensional rendering of the saved Ecovacs floor map');
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.tabIndex = 0;
  viewer.prepend(renderer.domElement);

  const orbit = new OrbitControls(camera, renderer.domElement);
  orbit.enablePan = false;
  orbit.minZoom = 0.65;
  orbit.maxZoom = 5;
  orbit.maxPolarAngle = 1.44;
  const dock = positionOf('#c');
  const robot = positionOf('#d');
  const dockLabel = dock ? new THREE.Vector3(dock.x - centerX, 10, dock.y - centerZ) : null;
  const projected = new THREE.Vector3();
  let refreshWallHandles = () => {};
  let refreshFurnitureHandles = () => {};
  function draw() {
    renderer.render(scene, camera);
    refreshWallHandles();
    refreshFurnitureHandles();
    if (!dockLabel || viewer.classList.contains('show-source') || viewer.parentElement.dataset.editing === 'true') {
      dockPin.hidden = true;
      return;
    }
    projected.copy(dockLabel).project(camera);
    const x = (projected.x + 1) * viewer.clientWidth / 2;
    const y = (1 - projected.y) * viewer.clientHeight / 2;
    dockPin.hidden = x < 12 || x > viewer.clientWidth - 73 || y < 23 || y > viewer.clientHeight - 23;
    dockPin.style.transform = `translate(${x + 13}px, ${y}px) translateY(-50%)`;
  }
  orbit.addEventListener('change', draw);

  const model = new THREE.Group();
  model.position.set(-centerX, 0, -centerZ);
  scene.add(model);
  const marble = makeMarbleTileMaterial(renderer);
  const side = makeMaterial(0x302824);
  const floorMaterials = [marble, side];
  const scannedWalls = wallSegments(walls);

  const selectableFloors = [];
  for (const path of floors) {
    for (const shape of path.toShapes()) {
      const mesh = makeSlab(shape, model, floorMaterials, 6);
      mesh.userData.roomPath = path.userData.node.getAttribute('d');
      mesh.userData.baseMaterial = floorMaterials;
      selectableFloors.push(mesh);
    }
  }
  const wallMaterial = makeMaterial(0x897763);
  const wallCap = makeMaterial(0xc5ad90);
  const activeWallMaterial = makeMaterial(0xe49a58);
  const activeWallCap = makeMaterial(0xffc68b, { emissive: 0x773c13, emissiveIntensity: 0.18 });
  const wallFaces = [wallMaterial, wallMaterial, wallCap, wallMaterial, wallMaterial, wallMaterial];
  const activeWallFaces = [
    activeWallMaterial, activeWallMaterial, activeWallCap, activeWallMaterial, activeWallMaterial, activeWallMaterial,
  ];
  const wallHeight = 11.5;
  const segments = scannedWalls;
  const wallMeshes = new Map();
  const gapPreview = new THREE.MeshBasicMaterial({ color: 0xc78952, transparent: true, opacity: 0.63 });
  const doorPaint = makeMaterial(0xe5dfd5);
  const doorTrim = makeMaterial(0xf0eae0);
  const doorPanel = makeMaterial(0xbcb3a7);
  const hardware = makeMaterial(0x8c7c60, { metalness: 0.53 });

  function wallGeometry({ kind, start, end }, length) {
    if (kind === 'wall') return new RoundedBoxGeometry(length + 0.1, wallHeight, 1.62, 2, 0.24);
    const nx = -(end.z - start.z) / length * 2.2;
    const nz = (end.x - start.x) / length * 2.2;
    const shape = new THREE.Shape([
      new THREE.Vector2(start.x + nx, start.z + nz), new THREE.Vector2(end.x + nx, end.z + nz),
      new THREE.Vector2(end.x - nx, end.z - nz), new THREE.Vector2(start.x - nx, start.z - nz),
    ]);
    return new THREE.ExtrudeGeometry(shape, { depth: 6, bevelEnabled: false }).rotateX(Math.PI / 2);
  }

  function releaseGeometry(object) {
    model.remove(object);
    object.traverse(child => child.geometry?.dispose());
  }

  function renderedWalls(records) {
    const doors = records.filter(record => !record.hidden && record.kind === 'door');
    return records.flatMap(record => {
      if (record.hidden || record.kind !== 'wall') return [record];
      const { start, end } = record;
      const dx = end.x - start.x;
      const dz = end.z - start.z;
      const length = Math.hypot(dx, dz);
      const at = point => ((point.x - start.x) * dx + (point.z - start.z) * dz) / length;
      const distance = point => Math.abs((point.x - start.x) * dz - (point.z - start.z) * dx) / length;
      const openings = doors.filter(door => distance(door.start) <= 0.42 && distance(door.end) <= 0.42)
        .map(door => [at(door.start), at(door.end)].sort((a, b) => a - b))
        .filter(([a, b]) => a < length && b > 0)
        .sort((a, b) => a[0] - b[0]);
      if (!openings.length) return [record];
      const pointAt = distance => ({ x: start.x + dx * distance / length, z: start.z + dz * distance / length });
      const pieces = [];
      let previous = 0;
      for (const [a, b] of [...openings, [length, length]]) {
        if (a - previous >= 0.6) {
          pieces.push({
            ...record, id: record.id + ':part:' + pieces.length,
            sourceId: record.id, start: pointAt(previous), end: pointAt(a),
          });
        }
        previous = Math.max(previous, b);
      }
      return pieces;
    });
  }

  function positionWalls(records, selectedId) {
    const visible = new Set();
    const rendered = renderedWalls(records);
    viewer.dataset.doorCutouts = String(new Set(rendered.map(record => record.sourceId).filter(Boolean)).size);
    for (const record of rendered) {
      if (record.hidden) continue;
      const { id } = record;
      visible.add(id);
      positionWall(record, id === selectedId || record.sourceId === selectedId || id === 'draft');
    }
    for (const [id, mesh] of wallMeshes) {
      if (visible.has(id)) continue;
      releaseGeometry(mesh);
      wallMeshes.delete(id);
    }
  }

  function positionWall(record, selected) {
    const { id, kind, start, end } = record;
    if (kind === 'floor') {
      const shape = record.points.map(point => new THREE.Vector2(point.x, point.z));
      const key = shape.map(point => point.toArray().join(',')).join('|');
      const existing = wallMeshes.get(id);
      if (existing?.userData.shape === key) return;
      if (existing) releaseGeometry(existing);
      const floor = makeSlab(new THREE.Shape(shape), model, id === 'draft' ? gapPreview : floorMaterials,
        6, id === 'draft' ? 0.08 : -0.082);
      floor.castShadow = false;
      floor.userData.shape = key;
      wallMeshes.set(id, floor);
      return;
    }
    const length = Math.hypot(end.x - start.x, end.z - start.z);
    if (kind === 'door') {
      let door = wallMeshes.get(id);
      if (!door || door.userData.shape !== length) {
        if (door) releaseGeometry(door);
        door = new THREE.Group();
        const post = Math.min(0.7, length / 6);
        for (const x of [-length / 2 + post / 2, length / 2 - post / 2]) {
          addMesh(door, new THREE.BoxGeometry(post, 11.3, 1.28), doorTrim, x, 5.65, 0);
        }
        const leafWidth = length - post * 2;
        const hinge = new THREE.Group();
        hinge.position.x = -length / 2 + post;
        hinge.rotation.y = -1.03;
        door.add(hinge);
        addMesh(hinge, new THREE.BoxGeometry(leafWidth, 10.75, 0.51), doorPaint, leafWidth / 2, 5.6, 0);
        for (const y of [3.11, 7.86]) {
          addMesh(hinge, new RoundedBoxGeometry(leafWidth * 0.73, 3.7, 0.095, 1, 0.042),
            doorPanel, leafWidth / 2, y, 0.283);
        }
        addMesh(hinge, new THREE.SphereGeometry(0.3, 12, 8), hardware, leafWidth * 0.86, 5.65, 0.52);
        door.userData.shape = length;
        model.add(door);
        wallMeshes.set(id, door);
      }
      door.position.set((start.x + end.x) / 2, 0, (start.z + end.z) / 2);
      door.rotation.y = -Math.atan2(end.z - start.z, end.x - start.x);
      return;
    }
    const shape = kind === 'gap' ? [start.x, start.z, end.x, end.z].join(',') : length;
    const material = kind === 'gap'
      ? (id === 'draft' ? gapPreview : floorMaterials)
      : (selected ? activeWallFaces : wallFaces);
    let mesh = wallMeshes.get(id);
    if (!mesh) {
      mesh = addMesh(model, wallGeometry(record, length), material);
      wallMeshes.set(id, mesh);
    } else if (mesh.userData.shape !== shape) {
      mesh.geometry.dispose();
      mesh.geometry = wallGeometry(record, length);
    }
    mesh.userData.shape = shape;
    mesh.material = material;
    if (kind === 'gap') {
      mesh.position.y = id === 'draft' ? 0.09 : -0.012;
      mesh.castShadow = false;
      return;
    }
    mesh.position.set((start.x + end.x) / 2, wallHeight / 2 - 0.1, (start.z + end.z) / 2);
    mesh.rotation.y = -Math.atan2(end.z - start.z, end.x - start.x);
  }

  const route = new THREE.Group();
  const routeMaterial = new THREE.MeshBasicMaterial({
    color: 0xc36524, toneMapped: false, side: THREE.DoubleSide,
  });
  const routeHalo = new THREE.MeshBasicMaterial({
    color: 0xe8944d, opacity: 0.24, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide,
  });
  let traceSegments = 0;
  function replaceRoute(routePath, baselinePath) {
    for (const child of [...route.children]) {
      route.remove(child);
      child.geometry.dispose();
    }
    traceSegments = 0;
    let matching = Boolean(baselinePath);
    for (const [index, path] of (routePath?.subPaths ?? []).entries()) {
      let points = path.getPoints(1);
      const old = matching && baselinePath.subPaths[index]?.getPoints(1);
      if (old) {
        let count = 0;
        while (count < old.length && count < points.length && points[count].equals(old[count])) count++;
        if (count === points.length) continue;
        matching = false;
        points = points.slice(Math.max(0, count - 1));
      }
      if (points.length < 2) continue;
      traceSegments += points.slice(1).filter((point, index) => point.distanceTo(points[index]) >= 0.03).length;
      for (const [width, material, lift] of [[1.95, routeHalo, 0.24], [0.68, routeMaterial, 0.32]]) {
        const style = SVGLoader.getStrokeStyle(width, '#ffffff', 'round', 'round');
        const geometry = SVGLoader.pointsToStroke(points, style, 6, 0.03);
        if (!geometry) continue;
        geometry.rotateX(Math.PI / 2);
        const strip = addMesh(route, geometry, material, 0, lift);
        strip.castShadow = false;
      }
    }
    viewer.dataset.traceSegments = String(traceSegments);
  }
  replaceRoute(routePath);
  model.add(route);

  if (dock) {
    const ring = addMesh(model, new THREE.TorusGeometry(4.25, 0.25, 8, 48),
      routeMaterial, dock.x, 0.44, dock.y);
    ring.rotateX(-Math.PI / 2);
    ring.castShadow = false;
    const accent = new THREE.PointLight(0xffae69, 130, 55, 2);
    accent.position.set(dock.x - 8, 18, dock.y - 12);
    model.add(accent);
  }

  const vacuum = makeRobot();
  model.add(vacuum);
  vacuum.visible = Boolean(robot);
  if (robot) {
    vacuum.position.set(robot.x, 0, robot.y);
  }
  if (dock && robot && dock.distanceToSquared(robot) < 0.25) {
    document.querySelector('.device-state').textContent = 'At the dock in this scan';
  }

  const underlay = new THREE.ShadowMaterial({ opacity: 0.55 });
  const ground = addMesh(scene, new THREE.PlaneGeometry(1550, 1550), underlay, 0, -7.1, 0);
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;
  scene.add(new THREE.HemisphereLight(0xf6efea, 0x8b8188, 1.7));
  const key = new THREE.DirectionalLight(0xffead8, 2.5);
  key.position.set(-190, 265, -142);
  key.castShadow = true;
  key.shadow.camera.left = -262;
  key.shadow.camera.right = 262;
  key.shadow.camera.top = 218;
  key.shadow.camera.bottom = -218;
  key.shadow.camera.far = 730;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.normalBias = 0.32;
  key.shadow.bias = -0.00005;
  key.shadow.radius = 2.7;
  key.shadow.autoUpdate = false;
  key.shadow.needsUpdate = true;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xbecbe5, 0.98);
  fill.position.set(165, 78, 142);
  scene.add(fill);

  function resize() {
    const viewportWidth = viewer.clientWidth;
    const viewportHeight = viewer.clientHeight;
    const aspect = viewportWidth / viewportHeight;
    const frameHeight = Math.max(height * 1.42, width * 1.15 / aspect);
    camera.left = -frameHeight * aspect / 2;
    camera.right = frameHeight * aspect / 2;
    camera.top = frameHeight / 2;
    camera.bottom = -frameHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(viewportWidth, viewportHeight, false);
    draw();
  }

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const focus = dock ? new THREE.Vector3(dock.x - centerX - 10, 0, dock.y - centerZ + 1) : new THREE.Vector3();
  const cameraViews = {
    floor: { offset: new THREE.Vector3(106, 282, 243), target: new THREE.Vector3(0, 1, 0), zoom: 1 },
    top: { offset: new THREE.Vector3(0, 430, 0.01), target: new THREE.Vector3(0, 1, 0), zoom: 1 },
    follow: { offset: new THREE.Vector3(76, 205, 155), target: new THREE.Vector3(), zoom: 2.6 },
    dock: {
      offset: new THREE.Vector3(-122, 205, 196),
      target: focus,
      zoom: 3.38,
    },
  };
  let cameraFrame = 0;

  function stopCameraMotion() {
    cancelAnimationFrame(cameraFrame);
    cameraFrame = 0;
    viewer.dataset.cameraMotion = 'idle';
  }

  function refreshCamera() {
    camera.updateProjectionMatrix();
    if (!orbit.update()) draw();
  }

  function setCamera(name, animate = false) {
    stopCameraMotion();
    const destination = cameraViews[name];
    const end = destination.offset.clone().add(destination.target);
    for (const button of cameraButtons) {
      button.setAttribute('aria-pressed', String(button.dataset.camera === name));
    }
    viewer.dataset.camera = name;
    if (!animate || motionPreference.matches) {
      camera.position.copy(end);
      orbit.target.copy(destination.target);
      camera.zoom = destination.zoom;
      refreshCamera();
      return;
    }

    // Move from the present view so a new preset can interrupt a move.
    const start = camera.position.clone();
    const startTarget = orbit.target.clone();
    const startZoom = camera.zoom;
    const startTime = performance.now();
    viewer.dataset.cameraMotion = 'moving';
    function move(now) {
      const progress = Math.min((now - startTime) / 230, 1);
      const eased = 1 - (1 - progress) ** 3;
      camera.position.lerpVectors(start, end, eased);
      orbit.target.lerpVectors(startTarget, destination.target, eased);
      camera.zoom = THREE.MathUtils.lerp(startZoom, destination.zoom, eased);
      refreshCamera();
      if (progress < 1) cameraFrame = requestAnimationFrame(move);
      else stopCameraMotion();
    }
    cameraFrame = requestAnimationFrame(move);
  }

  for (const button of cameraButtons) {
    button.addEventListener('click', event => setCamera(button.dataset.camera, event.detail > 0));
  }
  dockPin.addEventListener('click', event => setCamera('dock', event.detail > 0));
  orbit.addEventListener('start', stopCameraMotion);
  function settleCamera() {
    if (cameraFrame) setCamera(viewer.dataset.camera);
    else draw();
  }
  motionPreference.addEventListener('change', settleCamera);
  sourceButton.addEventListener('click', settleCamera);
  routeButton.addEventListener('click', () => {
    route.visible = !route.visible;
    routeButton.setAttribute('aria-pressed', String(route.visible));
    draw();
  });

  const instructions = document.querySelector('#map-help');
  const mapInstructions = instructions.textContent;
  const cameraNav = cameraButtons[0].closest('nav');
  let viewBeforeEditing = 'floor';
  function renderEdit(relight) {
    if (relight) key.shadow.needsUpdate = true;
    draw();
  }

  function useEditView(editing, helpText) {
    orbit.enabled = !editing;
    cameraNav.hidden = editing;
    for (const button of cameraButtons) {
      button.disabled = editing || viewer.classList.contains('show-source');
    }
    if (editing) viewBeforeEditing = viewer.dataset.camera ?? 'floor';
    instructions.textContent = editing ? helpText : mapInstructions;
    resize();
    setCamera(editing ? 'top' : viewBeforeEditing);
  }

  const wallEditor = setupWallEditor({
    segments,
    scannedFloors: floors.flatMap(path => path.toShapes().map(shape =>
      shape.getPoints(1).map(point => ({ x: point.x, z: point.y })))),
    model,
    camera,
    canvas: renderer.domElement,
    positionWalls,
    render: renderEdit,
    onEditing(editing) {
      useEditView(editing, 'Edit walls, floors, and doorways over the saved Ecovacs scan.');
    },
  });
  refreshWallHandles = wallEditor.refreshHandles;
  const furnishings = setupFurnishings({
    model,
    camera,
    canvas: renderer.domElement,
    floors,
    additionalFloors: wallEditor.floorRegions,
    addMesh,
    makeMaterial,
    marbleMap: marble.map,
    render: renderEdit,
    onEditing(editing) {
      useEditView(editing, 'Keyboard controls: Page Up or Page Down to select, arrow keys to move.');
    },
  });

  const lockButton = document.getElementById('layout-lock');
  const lockKey = scope + ':locked';
  const editButtons = document.querySelectorAll('[data-wall="edit"], [data-furnishing="edit"]');
  function setLocked(locked) {
    lockButton.setAttribute('aria-pressed', String(locked));
    lockButton.textContent = locked ? 'Unlock layout' : 'Lock layout';
    for (const button of editButtons) button.hidden = locked;
    viewer.dataset.layoutLocked = String(locked);
  }
  setLocked(localStorage.getItem(lockKey) === 'true');
  lockButton.onclick = () => {
    const locked = viewer.dataset.layoutLocked !== 'true';
    localStorage.setItem(lockKey, String(locked));
    setLocked(locked);
  };
  refreshFurnitureHandles = furnishings.refreshHandles;
  renderer.domElement.addEventListener('keydown', event => {
    if (furnishings.handleKey(event) || wallEditor.handleKey(event)) return;
    const directions = { ArrowLeft: -0.12, ArrowRight: 0.12 };
    if (event.key in directions) {
      event.preventDefault();
      stopCameraMotion();
      camera.position.sub(orbit.target)
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), directions[event.key])
        .add(orbit.target);
      refreshCamera();
    }
    const zooms = { '+': 1.14, '=': 1.14, '-': 1 / 1.14 };
    if (event.key in zooms) {
      event.preventDefault();
      stopCameraMotion();
      camera.zoom = THREE.MathUtils.clamp(camera.zoom * zooms[event.key], orbit.minZoom, orbit.maxZoom);
      refreshCamera();
    }
  });

  new ResizeObserver(resize).observe(viewer);
  resize();
  setCamera('floor');
  viewer.dataset.rendered = 'true';
  viewer.dataset.regions = String(floors.length);
  viewer.dataset.wallSegments = String(segments.length);
  viewer.dataset.traceSegments = String(traceSegments);
  viewer.dataset.dock = String(Boolean(dock));
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const ctx = glowCanvas.getContext('2d');
  const glow = ctx.createRadialGradient(64,64,12,64,64,64);
  glow.addColorStop(0, 'rgba(80,255,240,.88)');
  glow.addColorStop(.52, 'rgba(69,243,238,.50)');
  glow.addColorStop(1, 'rgba(24,213,220,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0,0,128,128);
  const beacon = new THREE.Group();
  vacuum.add(beacon);
  const halo = addMesh(beacon, new THREE.PlaneGeometry(19, 19), new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(glowCanvas), transparent: true, depthWrite: false,
    side: THREE.DoubleSide, toneMapped: false
  }), 0, .53);
  halo.rotation.x = -Math.PI / 2;
  halo.castShadow = false;
  const ring = addMesh(beacon, new THREE.RingGeometry(4.65, 5.2, 64),
    new THREE.MeshBasicMaterial({ color: 0x69fff2, side: THREE.DoubleSide, toneMapped: false, depthTest: false }), 0, .56);
  ring.rotation.x = -Math.PI / 2;
  ring.renderOrder = 3;
  ring.castShadow = false;
  beacon.visible = false;
  const trail = new RunTrail(localStorage, scope + ':trail');
  const parseTrail = d => d && /^[MmZzLlHhVvCcSsQqTtAaEe.,+\s0-9-]+$/.test(d)
    ? new SVGLoader().parse('<svg xmlns="http://www.w3.org/2000/svg"><path transform="scale(0.2-0.2)" d="' + d + '"/></svg>').paths[0] : null;
  let previousBaseline;
  const status = document.querySelector('.device-state');
  const feedLabel = document.querySelector('.feed-label');
  let lastSample;
  let previousRoute;
  function updateStatus() {
    if (!lastSample) return;
    const fresh = Date.now() - lastSample.received < 25000;
    const stamp = new Date(lastSample.mapTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    feedLabel.textContent = fresh ? 'Live tracking' : 'Tracking paused';
    const state = lastSample.state.replaceAll('_', ' ');
    status.textContent = (fresh ? state[0].toUpperCase() + state.slice(1) : 'Last known position') +
      ' · Map ' + stamp + (lastSample.xy ? '' : ' · Position unavailable');
    viewer.dataset.tracking = fresh ? 'live' : 'paused';
  }
  window.deebotTrackingUpdate = sample => {
    if (lastSample && sample.received <= lastSample.received) return;
    const baseline = trail.observe(sample);
    if (sample.route !== previousRoute || baseline !== previousBaseline) {
      replaceRoute(sample.route === baseline ? null : parseTrail(sample.route), parseTrail(baseline));
      previousRoute = sample.route;
      previousBaseline = baseline;
    }
    vacuum.visible = Boolean(sample.xy);
    beacon.visible = true;
    const followButton = cameraButtons.find(button => button.dataset.camera === 'follow');
    followButton.hidden = !sample.xy;
    if (sample.xy) {
      vacuum.position.set(sample.xy[0], 0, sample.xy[1]);
      const target = cameraViews.follow.target.set(sample.xy[0] - centerX, 0, sample.xy[1] - centerZ);
      if (viewer.dataset.camera === 'follow') {
        stopCameraMotion();
        camera.position.add(target.clone().sub(orbit.target));
        orbit.target.copy(target);
        orbit.update();
      }
    } else if (viewer.dataset.camera === 'follow') {
      setCamera('floor');
    }
    viewer.dataset.robotPosition = sample.xy?.join(',') ?? '';
    lastSample = sample;
    updateStatus();
    draw();
  };
    setupRoomPicking({canvas: renderer.domElement, camera, floors: selectableFloors, marble, side, viewer, draw});

    const hasLayout = [scope + ':furniture',scope + ':walls'].some(key => localStorage.getItem(key));
    if (!hasLayout) {
      const hint = document.getElementById('layout-status');
      hint.textContent = 'Ecovacs scan · Use Edit walls or Edit furnishings to customize your map.';
      hint.hidden = false;
    }
    replaceRoute(null);
    feedLabel.textContent = 'Connecting';
    setInterval(updateStatus, 3000);
  if (!dock) cameraButtons.find(button => button.dataset.camera === 'dock').hidden = true;
}

compare.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(scan);
compare.className = 'compare';
compare.alt = 'Original Ecovacs map with floor outlines, dock, and saved cleaning path';
compare.hidden = true;
viewer.prepend(compare);
sourceButton.addEventListener('click', () => {
  const show = compare.hidden;
  compare.hidden = !show;
  viewer.classList.toggle('show-source', show);
  sourceButton.setAttribute('aria-pressed', String(show));
  sourceButton.textContent = show ? 'Back to 3D' : 'Original scan';
  for (const button of cameraButtons) button.disabled = show;
  routeButton.disabled = show;
});

try {
  if (!floors.length || !walls.length) throw new Error('Missing vector floor or wall paths');
  renderPreview();
} catch (error) {
  console.error(error);
  notice.hidden = false;
  compare.hidden = false;
  viewer.classList.add('show-source');
  for (const button of [...cameraButtons, routeButton, sourceButton, ...document.querySelectorAll('[data-furnishing], [data-wall]')]) {
    button.disabled = true;
  }
}

document.getElementById('export-layout').onclick = () => {
  const keys = [scope + ':furniture',scope + ':walls'];
  const layout = Object.fromEntries(keys.filter(k => localStorage.getItem(k)).map(k => [k,JSON.parse(localStorage.getItem(k))]));
  const url = URL.createObjectURL(new Blob([JSON.stringify(layout)], {type:'application/json'}));
  const link = document.createElement('a');
  link.href = url; link.download = 'deebot-room-layout.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};
