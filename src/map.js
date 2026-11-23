// Copy just the vector geometry the editor understands. Device SVG is data.
const outline = /^[MmZzLlHhVvCcSsQqTtAaEe.,+\s0-9-]+$/;
const colors = ['#adc3ce','#e1caa6','#bed2ba','#dfbdb5','#cebfda','#b0cccb'];
function pathsIn(group) {
  const paths = [...(group?.children || [])].filter(n => n.localName === 'path');
  return paths.map(node => {
    const d = node.getAttribute('d') || '';
    if (!outline.test(d) || node.hasAttribute('transform') || group.hasAttribute('transform')) {
      throw Error('Unsupported Ecovacs room or wall geometry.');
    }
    return d;
  });
}
function fingerprint(value) {
  let a = 2166136261, b = 5381;
  for (let i = 0; i < value.length; i++) {
    a = Math.imul(a ^ value.charCodeAt(i), 16777619);
    b = Math.imul(b, 33) ^ value.charCodeAt(i);
  }
  return (a >>> 0).toString(36) + '-' + (b >>> 0).toString(36);
}
export function parseT90Map(xml) {
  if (xml.length > 4000000) throw Error('Map exceeds the supported size.');
  const root = new DOMParser().parseFromString(xml,'image/svg+xml').documentElement;
  const box = (root.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
  const layers = [...root.children];
  const walls = layers.find(n => n.localName === 'g' && n.classList.contains('o'));
  if (root.localName !== 'svg' || box.length !== 4 || !box.every(Number.isFinite) ||
      box[2] <= 0 || box[3] <= 0 || layers[0]?.localName !== 'g' || !walls) {
    throw Error('Expected the Ecovacs SVG map image with room and wall layers.');
  }
  const floors = pathsIn(layers[0]), edges = pathsIn(walls);
  if (!floors.length || !edges.length) throw Error('No mapped rooms or walls yet.');
  const routeNode = layers.find(n => n.localName === 'path');
  const route = routeNode?.getAttribute('d') || '';
  if (route && (!outline.test(route) || routeNode.getAttribute('transform') !== 'scale(0.2-0.2)')) {
    throw Error('Unsupported Ecovacs cleaning path format.');
  }
  const marker = id => {
    const n = layers.find(n => n.localName === 'use' && n.getAttribute('href') === '#' + id);
    if (!n || !['x','y'].every(k => n.hasAttribute(k))) return null;
    const xy = ['x','y'].map(k => Number(n.getAttribute(k)));
    return xy.every(Number.isFinite) ? xy : null;
  };
  const robot = marker('d'), dock = marker('c');
  return makeMap(box, floors, edges, robot, dock, route);
}

export function makeMap(box, floors, edges, robot, dock, route = '') {
  const use = (id,xy) => xy ? '<use href="#'+id+'" x="'+xy[0]+'" y="'+xy[1]+'"/>' : '';
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+box.join(' ')+'"><g>' +
    floors.map((d,i) => '<path fill="'+colors[i % colors.length]+'" d="'+d+'"/>').join('') +
    '</g><g class="o" stroke="#534b45" fill="none">' + edges.map(d => '<path d="'+d+'"/>').join('') +
    '</g><defs><circle id="c" r="2" fill="#5dd9ce"/><circle id="d" r="2" fill="#ea9853"/></defs>' +
    (route ? '<path fill="none" stroke="white" transform="scale(0.2-0.2)" d="'+route+'"/>' : '') +
    use('c',dock) + use('d',robot) + '</svg>';
  return { svg, paths:floors, overlay:{xy:robot,route},
    geometryId:fingerprint(JSON.stringify([box,[...floors].sort(),[...edges].sort()])) };
}
