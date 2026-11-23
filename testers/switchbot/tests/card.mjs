import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import { chromium } from "playwright-core";

const bundle = await fs.readFile(process.env.SWITCHBOT_TEST_BUNDLE || new URL("../../../dist/switchbot-vacuum-card.js", import.meta.url));
const server = http.createServer(async (req,res) => {
  if(req.url==="/"){
    res.setHeader("content-type","text/html");
    res.end('<meta name="viewport" content="width=device-width,initial-scale=1"><style>html{--primary-text-color:#16292c;--primary-color:#005e6c;--secondary-text-color:#4b5555;--card-background-color:white;font:16px system-ui}body{max-width:660px;margin:20px auto;}ha-card{background:var(--card-background-color);border:1px solid #dde4e4;border-radius:12px}</style><switchbot-vacuum-card></switchbot-vacuum-card><script type="module" src="/switchbot-vacuum-card.js"></script>');
  }else if(req.url==="/switchbot-vacuum-card.js"){
    res.setHeader("content-type","application/javascript");
    res.end(bundle);
  }else{res.statusCode=404;res.end();}
});
await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
const browser=await chromium.launch({executablePath:process.env.CHROME_BIN || undefined,args:["--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
try {
  const page=await browser.newPage({viewport:{width:700,height:700}});
  const errors=[]; page.on("pageerror",e=>errors.push(e.message));
  await page.goto("http://127.0.0.1:"+server.address().port);
  await page.waitForFunction(()=>customElements.get("switchbot-vacuum-card")!==undefined);
  await page.evaluate(()=>{
    window.card=document.querySelector("switchbot-vacuum-card");
    window.calls=[];
    window.entityId="vacuum.robot_fixture";
    window.h={states:{[entityId]:{state:"docked",attributes:{friendly_name:"S10 fixture",supported_features:12340,fan_speed_list:["quiet","standard","max"],fan_speed:"standard"}}, "sensor.robot_fixture_battery":{state:"70"}},services:{vacuum:{start:{},pause:{},return_to_base:{},set_fan_speed:{}},switchbot_vacuum:{clean_rooms:{}}},entities:{[entityId]:{platform:"switchbot_cloud",device_id:"cloudunit"}},devices:{cloudunit:{model:"Floor Cleaning Robot S10"}},callService:async (...args)=>{calls.push(args);}};
    window.cfg={entity:entityId,battery_entity:"sensor.robot_fixture_battery"};
    card.setConfig(cfg);card.hass=h;
  });
  const card=page.locator("switchbot-vacuum-card");
  const button=(name)=>card.getByRole("button",{name,exact:true});
  assert.equal(await card.locator("p.state").textContent(),"docked · 70% battery");
  assert.equal(await button("Stop").count(),0);
  await button("Start").click();
  const recorded=()=>page.evaluate(()=>calls);
  const target={entity_id:"vacuum.robot_fixture"};
  assert.deepEqual((await recorded()).at(-1),["vacuum","start",{},target]);
  await page.evaluate(()=>{h.states[entityId].state="cleaning";card.hass=h;});
  await button("Pause").click();
  await button("Go home").click();
  await card.getByRole("combobox").selectOption("max");
  assert.deepEqual((await recorded()).slice(-3),[["vacuum","pause",{},target],["vacuum","return_to_base",{},target],["vacuum","set_fan_speed",{fan_speed:"max"},target]]);
  await page.evaluate(()=>{h.states[entityId].state="paused";card.hass=h;});
  await button("Resume").click();
  await page.evaluate(()=>{h.states[entityId].state="unavailable";card.hass=h;});
  assert.ok(await button("Start").isDisabled());
  await page.evaluate(()=>{const v=h.states[entityId];v.state="docked";v.attributes.rooms={ROOM_013:"Library",ROOM_014:"Kitchen"};card.setConfig({...cfg,room_selection:true});card.hass=h;});
  assert.equal(await button("Library").count(),0);
  await page.evaluate(()=>{h.entities[entityId].platform="switchbot_vacuum";card.hass=h;});
  await button("Library").click();await button("Clean selected rooms").click();
  assert.deepEqual((await recorded()).at(-1),["switchbot_vacuum","clean_rooms",{rooms:["ROOM_013"]},target]);
  await page.evaluate(()=>{delete h.states[entityId].attributes.rooms.ROOM_013;card.hass=h;});
  assert.ok(await button("Clean selected rooms").isDisabled());
  await button("Whole home").click();
  await button("Kitchen").click();
  await page.evaluate(()=>{h.callService=async()=>{throw Error("Test rejection");};});
  await button("Clean selected rooms").click();
  await card.getByText("Test rejection").waitFor();
  assert.ok(await button("Clean selected rooms").isEnabled());
  await page.evaluate(()=>{
    h.states["image.private_floor"]={state:"2026-01-01",attributes:{}};
    window.loadCardHelpers=async()=>({createCardElement:config=>{window.nativeConfig=config;return document.createElement("div");}});
    card.setConfig({...cfg,map_entity:"image.private_floor"});
  });
  await page.waitForFunction(()=>window.nativeConfig?.entity==="image.private_floor");
  assert.equal(await page.evaluate(()=>nativeConfig.type),"picture-entity");
  await page.evaluate(()=>{h.states["image.private_floor"].state="unavailable";card.hass=h;});
  await card.getByText("Map source unavailable.").waitFor();
  await page.evaluate(()=>{
    h.callService=async(...args)=>{calls.push(args);};
    card.setConfig({...cfg,room_selection:true,floor_plan:{rooms:[{name:"Kitchen plan",room_id:"ROOM_014",points:[[0,0],[4,0],[4,4],[0,4]]}]}});
    card.hass=h;
  });
  const plan=card.locator("switchbot-floorplan-beta");
  await plan.getByRole("button",{name:"Kitchen plan",exact:true}).click();
  assert.equal(await button("Kitchen").getAttribute("aria-pressed"),"true");
  await button("Clean selected rooms").click();
  assert.deepEqual((await recorded()).at(-1),["switchbot_vacuum","clean_rooms",{rooms:["ROOM_014"]},target]);
  await page.evaluate(()=>{h.entities[entityId].platform="switchbot_cloud";card.hass=h;});
  assert.ok(await button("Clean selected rooms").isDisabled());
  assert.equal(await plan.getByRole("button",{name:"Kitchen plan",exact:true}).count(),0);
  await button("Whole home").click();
  await page.setViewportSize({width:360,height:620});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);
  console.log("Passed SwitchBot dashboard tests: cloud controls, exact service targets, optional map source, absent capabilities, room cleaning, stale targets, error recovery, 3D plan tap targeting and mobile width.");
}finally{await browser.close();server.close();}
