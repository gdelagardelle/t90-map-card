// Fictional duplex, with an open passage between the kitchen and living room.
export const rooms = [
  ['Kitchen', 0, 'M8 8H87V62H8Z', 'M8 62V8H87V27 M87 42V62H52 M36 62H8'],
  ['Living room', 4, 'M8 62H124V138H8Z', 'M8 62V138H124V97 M124 82V62H87'],
  ['Bedroom', 7, 'M87 8H186V62H87Z', 'M87 8H186V62H156 M140 62H87'],
  ['Study', 9, 'M124 62H186V138H124Z', 'M186 62V138H124']
];
export function scan(route = 'M75 -90l140 0 0 -22 -125 0 0 -22 125 0') {
  const roomPaths = rooms.map(r => '<path d="'+r[2]+'"/>').join('');
  const wallPaths = rooms.map(r => '<path d="'+r[3]+'"/>').join('');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 194 146"><g>'+roomPaths+'</g><g class="o">'+wallPaths+
    '</g><path transform="scale(0.2-0.2)" d="'+route+'"/><use href="#c" x="16" y="18"/><use href="#d" x="47" y="27"/></svg>';
}
export const furniture = [
  ['cabinets',46,15,0], ['island',45,38,0], ['stool',38,49,0], ['stool',47,49,0],
  ['rug',55,101,0], ['sectional',51,118,0], ['coffee',54,98,0], ['media',48,69,0],
  ['queen',144,33,0], ['smallCabinet',119,21,0], ['smallCabinet',168,21,0],
  ['dining',155,91,0], ['tallCabinet',173,124,0],
  ['officeDesk',148,125,0], ['officeChair',148,112,0], ['plant',133,128,0],
  ['floorLamp',115,117,0], ['ledStrip',45,23,0]
].map(([kind,x,z,rotation],i) => ({id:i+1,kind,x,z,rotation,width:100,depth:100}));
