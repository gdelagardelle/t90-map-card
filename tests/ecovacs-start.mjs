import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {chromium} from 'playwright-core';
import {scan} from './fixture.mjs';

const js = await readFile(process.env.CARD_BUNDLE || 'dist/t90-map-card.js');
const server = createServer((req, res) => {
  const script = req.url === '/card.js';
  res.setHeader('Content-Type', script ? 'text/javascript' : 'text/html');
  res.end(script ? js : '<t90-map-card></t90-map-card><script type="module" src="/card.js"></script>');
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({executablePath:process.env.CHROME_BIN, args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try {
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:' + server.address().port);
  await page.evaluate(async svg => {
    await customElements.whenDefined('t90-map-card');
    const vacuum = 'vacuum.demo_robot', image = 'image.demo_floor';
    const original = {kitchen:0, living_room:4};
    const card = document.querySelector('t90-map-card');
    const h = {connected:true, states:{[vacuum]:{state:'docked',attributes:{rooms:original}}, [image]:{state:'map-one',attributes:{}}},
      fetchWithAuth:async () => new Response(svg), callService:async (...args) => window.calls.push(args)};
    Object.assign(window, {card,h,vacuum,image,original,calls:[]});
    card.setConfig({entity:vacuum,map_entity:image});
    card.hass = h;
  }, scan());
  await page.waitForFunction(() => window.card?.mapReady && !!card.frame.contentWindow?.deebotTrackingUpdate);
  const start = page.locator('[data-action=start]'), status = page.locator('.command-status');
  await page.evaluate(() => {
    card.toggleRoom(0);
    h.states[vacuum].attributes.rooms = {};
    card.hass = h;
  });
  assert.equal(await page.evaluate(() => card.selectedRooms.has(0)), true, 'A temporary room metadata outage must preserve the room selection');
  assert(await start.isDisabled());
  assert.match(await status.textContent(), /room is unavailable/);
  await page.evaluate(() => card.control('start'));
  assert.equal(await page.evaluate(() => calls.length), 0);
  await page.evaluate(() => {h.states[vacuum].attributes.rooms = original; card.hass = h;});
  await page.evaluate(() => {h.states[image].state = 'unavailable'; card.hass = h;});
  assert(await start.isDisabled());
  assert.match(await status.textContent(), /current map/);
  await page.evaluate(() => {h.states[image].state = 'map-two'; card.hass = h;});
  await page.waitForFunction(() => !card.q('[data-action=start]').disabled);
  await start.click();
  const target = {entity_id:'vacuum.demo_robot'};
  assert.deepEqual(await page.evaluate(() => calls.at(-1)), ['vacuum','send_command',{command:'spot_area',params:{rooms:[0],cleanings:1}},target]);
  assert.match(await status.textContent(), /Waiting for the Deebot/);
  assert(await start.isDisabled());
  await page.evaluate(() => card.control('start'));
  assert.equal(await page.evaluate(() => calls.length), 1, 'Repeated Start must issue one physical command');
  assert(await page.locator('[data-action=stop]').isEnabled());
  assert(await page.locator('[data-action=return_to_base]').isEnabled());
  await page.evaluate(() => {h.states[vacuum].state = 'cleaning'; card.hass = h;});
  assert.match(await status.textContent(), /reports cleaning/);
  await page.evaluate(() => {h.states[vacuum].state = 'paused'; card.mapReady = false; card.hass = h;});
  await start.click();
  assert.deepEqual(await page.evaluate(() => calls.at(-1)), ['vacuum','start',{},target]);
  await page.locator('[data-action=return_to_base]').click();
  assert.deepEqual(await page.evaluate(() => calls.at(-1)), ['vacuum','return_to_base',{},target]);
  await page.evaluate(() => {
    h.states[vacuum].state = 'docked'; h.states[image].state = 'unavailable'; card.hass = h;
    card.toggleRoom(null);
    h.callService = async () => { throw {error:{message:'Robot is busy at the station'}}; };
  });
  await start.click();
  assert.match(await status.textContent(), /Start failed.*Robot is busy at the station/);
  await page.evaluate(() => {
    h.callService = async (...args) => calls.push(args);
    h.connected = false; card.hass = h;
  });
  assert(await start.isDisabled());
  const count = await page.evaluate(() => calls.length);
  await page.evaluate(() => card.control('start'));
  assert.equal(await page.evaluate(() => calls.length), count);
  await page.evaluate(() => {h.connected = true; card.hass = h;});
  // Use a controlled browser clock to exercise the no-acknowledgment path.
  await page.clock.install();
  await start.click();
  assert.deepEqual(await page.evaluate(() => calls.at(-1)), ['vacuum','start',{},target]);
  await page.clock.fastForward(31000);
  assert.match(await status.textContent(), /hasn’t reported cleaning/);
  assert(await start.isEnabled());
  assert.equal(await page.evaluate(() => calls.length), count + 1, 'The timeout must not retry a physical command');
  await page.evaluate(() => {
    h.devices = {bot:{model_id:'b7vftn'}};
    h.entities = {[vacuum]:{platform:'ecovacs',device_id:'bot'},[image]:{platform:'ecovacs',device_id:'bot'},
      'sensor.demo_robot_station_state':{device_id:'bot'}};
    h.states[image].state = 'map-three';
    h.states['sensor.demo_robot_station_state'] = {state:'idle',attributes:{}};
    card.hass = h;
  });
  await page.waitForFunction(() => card.mapReady);
  const v2 = params => ['vacuum','send_command',{command:'clean_V2',params},target];
  await start.click();
  assert.deepEqual(await page.evaluate(() => calls.at(-1)), v2({act:'start',content:{type:'auto'}}));
  await page.evaluate(() => {h.states['sensor.demo_robot_station_state'].state = 'washing_mop'; card.hass = h;});
  await page.clock.fastForward(31000);
  assert(await start.isDisabled());
  assert.match(await status.textContent(), /washing the mop/);
  await page.evaluate(() => {h.states[vacuum].state = 'cleaning'; card.hass = h;});
  await page.locator('[data-action=pause]').click();
  assert.deepEqual(await page.evaluate(() => calls.at(-1)), v2({act:'pause'}));
  await page.evaluate(() => {h.states[vacuum].state = 'paused'; card.hass = h;});
  await start.click();
  assert.deepEqual(await page.evaluate(() => calls.at(-1)), v2({act:'resume'}));
  await page.locator('[data-action=stop]').click();
  assert.deepEqual(await page.evaluate(() => calls.at(-1)), v2({act:'stop'}));
  await page.evaluate(() => {
    h.states[vacuum].state = 'docked'; card.hass = h; card.toggleRoom(0); card.toggleRoom(4);
  });
  await start.click();
  assert.deepEqual(await page.evaluate(() => calls.at(-1)), v2({act:'start',content:{type:'freeClean',value:'1,0;1,4'}}));
  await page.locator('[data-action=return_to_base]').click();
  assert.deepEqual(await page.evaluate(() => calls.at(-1)), ['vacuum','return_to_base',{},target]);
  await page.evaluate(() => {h.entities[vacuum].platform = 'matter'; card.toggleRoom(null);});
  await start.click();
  assert.deepEqual(await page.evaluate(() => calls.at(-1)), ['vacuum','start',{},target]);
  console.log('T90 MAX PLUS b7vftn: gated clean_V2 auto, rooms 0+4, pause, resume, stop, standard dock and mop preparation passed.');
  console.log('Ecovacs Start passed: room 0, metadata outage/recovery, ordinary Start, paused resume, detached map, disconnect, rejection, cleaning acknowledgment and timeout.');
} finally {
  await browser.close();
  await new Promise(resolve => server.close(resolve));
}
