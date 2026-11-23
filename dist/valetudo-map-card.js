var H=`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Deebot T90 | 3D vacuum map</title>
  <style>
    :root {
      color-scheme: dark;
      font: 15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #101112;
      color: #f3ebe1;
      --quiet: #bbb3ab;
      --line: #413932;
      --amber: #ffba73;
    }
    * { box-sizing: border-box; }
    [hidden] { display: none !important; }
    body {
      min-height: 100vh;
      min-height: 100dvh;
      margin: 0;
      padding: clamp(18px, 4vw, 58px);
      display: grid;
      align-items: center;
      background: radial-gradient(ellipse at 23% 0%, #251e1a, #101112 61%);
    }
    main { width: min(100%, 1460px); margin: auto; }
    header {
      display: flex;
      align-items: flex-end;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 18px 30px;
      margin: 0 0 19px;
    }
    h1 {
      margin: 0 0 4px;
      font-size: clamp(30px, 4vw, 55px);
      font-weight: 660;
      line-height: 1.07;
      letter-spacing: -0.04em;
    }
    header p { margin: 0; color: var(--quiet); }
    nav { display: flex; flex-wrap: wrap; gap: 6px; }
    button, select {
      min-height: 44px;
      padding: 9px 14px;
      border: 1px solid var(--line);
      border-radius: 9px;
      background: #1e1d1c;
      color: inherit;
      font: inherit;
    }
    button {
      cursor: pointer;
    }
    button[aria-pressed="true"] { color: #ffd7af; border-color: #8e6241; background: #39291e; }
    button:hover:enabled { background: #40312a; }
    button:disabled { opacity: 0.46; cursor: default; }
    button:focus-visible, canvas:focus-visible, select:focus-visible, input:focus-visible {
      outline: 2px solid var(--amber);
      outline-offset: 3px;
    }
    .stage {
      display: grid;
      grid-template: "device map" minmax(0, 1fr) / minmax(242px, 0.31fr) minmax(0, 1fr);
      gap: 15px;
    }
    .viewer {
      grid-area: map;
      position: relative;
      overflow: hidden;
      height: clamp(455px, 70dvh, 820px);
      border: 1px solid var(--line);
      border-radius: 16px;
      background: radial-gradient(ellipse at 42% 36%, #37302a 0%, #272523 48%, #171819 100%);
    }
    .viewer canvas { display: block; width: 100%; height: 100%; cursor: grab; touch-action: none; }
    .viewer[data-placing="true"] canvas { cursor: crosshair; }
    .viewer[data-dragging="true"] canvas { cursor: grabbing; }
    canvas:active { cursor: grabbing; }
    canvas:focus-visible { outline-offset: -5px; }
    .compare {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      padding: clamp(18px, 6vw, 90px);
      object-fit: contain;
      background: #2d2b2a;
    }
    .show-source canvas { visibility: hidden; }
    .notice {
      position: absolute;
      z-index: 1;
      top: 12px;
      inset-inline: 15px;
      text-align: center;
      color: #fff0db;
    }
    .dock-pin {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      min-height: 34px;
      padding: 5px 10px;
      border-color: #8a5f3f;
      background: #26201b;
      color: #ffdbb7;
      font-size: 13px;
      white-space: nowrap;
    }
    .dock-pin::before {
      position: absolute;
      content: "";
      top: 50%;
      left: -12px;
      width: 11px;
      height: 1px;
      background: #ffba73;
      pointer-events: none;
    }
    .device {
      grid-area: device;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-width: 0;
      padding: clamp(16px, 2vw, 26px);
      border: 1px solid var(--line);
      border-radius: 16px;
      background: radial-gradient(ellipse at 38% 32%, #302620 0%, #1a1918 65%);
    }
    .device h2 {
      color: #fff2e6;
      margin: 0;
      font-size: clamp(22px, 2.1vw, 31px);
      line-height: 1.15;
      letter-spacing: -0.035em;
    }
    .device p { margin: 7px 0 0; color: var(--quiet); }
    .device .furnishing-note { font-size: 13px; }
    .product { width: 100%; margin: auto; }
    .product img { display: block; width: 100%; }
    .stage[data-editing="true"] { grid-template: "map" auto / minmax(0, 1fr); }
    .stage[data-editing="true"] .device { display: none; }
    .tools { display: grid; gap: 8px; }
    .tools button { display: flex; align-items: center; justify-content: space-between; gap: 10px; text-align: left; }
    .tools .switch {
      position: relative;
      flex: 0 0 28px;
      height: 16px;
      border: 1px solid #776557;
      border-radius: 9px;
    }
    .tools .switch::before {
      content: "";
      position: absolute;
      top: 3px;
      left: 3px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #d0c1af;
    }
    .tools button[aria-pressed="true"] .switch { background: #ffbd81; border-color: #ffbd81; }
    .tools button[aria-pressed="true"] .switch::before { left: 15px; background: #38261c; }
    .map-editor {
      position: absolute;
      inset: 0;
      z-index: 2;
      pointer-events: none;
      font-size: 13px;
    }
    .editor-top, .editor-bottom { position: absolute; inset-inline: 14px; }
    .editor-top { top: 14px; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; }
    .editor-top button, .furnishing-palette, .edit-selection { pointer-events: auto; }
    .editor-top .edit-actions { display: flex; gap: 6px; margin-left: auto; }
    .wall-tools { display: flex; flex-wrap: wrap; gap: 6px; }
    .furnishing-palette {
      position: absolute;
      top: 52px;
      left: 0;
      display: grid;
      width: min(320px, 100%);
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
      max-height: min(65dvh, 367px);
      overflow-y: auto;
      padding: 9px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #211e1b;
    }
    .furnishing-palette button { padding-inline: 9px; text-align: left; }
    .editor-bottom { bottom: 14px; display: grid; justify-items: center; gap: 7px; }
    .edit-selection {
      display: grid;
      width: max-content;
      max-width: 100%;
      gap: 7px;
      padding: 8px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: #211e1b;
    }
    .furnishing-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .furnishing-actions strong { margin: 0 6px; }
    .furnishing-actions button { padding-inline: 10px; }
    .furnishing-size { display: grid; gap: 8px; padding: 6px 3px 3px; }
    .map-editor .size {
      display: grid;
      grid-template-columns: 44px minmax(0, 1fr) 32px;
      gap: 6px;
      align-items: center;
    }
    .size input { width: 100%; min-width: 0; margin: 0; accent-color: var(--amber); }
    .size output { text-align: right; color: var(--quiet); }
    .edit-status {
      max-width: min(100%, 44ch);
      margin: 0;
      padding: 6px 10px;
      border-radius: 8px;
      background: #211e1b;
      color: #e9dbcd;
      text-align: center;
    }
    .edit-status:empty { display: none; }
    .furniture-corner {
      position:absolute; width:30px; height:30px; touch-action:none; pointer-events:auto;
      --ox:-5px; --oy:-5px; transform:translate(var(--ox),var(--oy)); cursor:nwse-resize;
    }
    .furniture-corner.nw,.furniture-corner.sw { --ox:calc(5px - 100%); }
    .furniture-corner.nw,.furniture-corner.ne { --oy:calc(5px - 100%); }
    .furniture-corner.ne,.furniture-corner.sw { cursor:nesw-resize; }
    .furniture-corner::after {
      content:"";position:absolute;width:10px;height:10px;box-sizing:border-box;
      top:0;left:0;background:#ffcf9c;border:2px solid #493327;border-radius:3px;
    }
    .furniture-corner.nw::after,.furniture-corner.sw::after { left:auto;right:0; }
    .furniture-corner.nw::after,.furniture-corner.ne::after { top:auto;bottom:0; }
    .furniture-turn, .wall-turn {
      position:absolute; transform:translate(-50%,-50%); pointer-events:auto; touch-action:none;
      width:34px; height:34px; min-height:34px; padding:0; border-radius:50%;
      border:2px solid #493327; background:#ffcf9c; color:#332217; font-size:22px;
      line-height:1; cursor:grab;
    }
    .furniture-turn:hover:enabled, .wall-turn:hover:enabled { background:#ffe3bd; }
    .furniture-turn::before, .wall-turn::before {
      content:""; position:absolute; left:50%; top:50%; width:38px; height:1px;
      background:linear-gradient(to right,transparent 17px,#ffcf9c 17px);
      transform-origin:left center; transform:rotate(var(--stem-angle)); pointer-events:none;
    }
    .wall-handle {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1;
      width: 44px;
      padding: 0;
      border: 0;
      background: transparent;
      pointer-events: auto;
      touch-action: none;
      cursor: grab;
    }
    .wall-handle::after {
      content: "";
      position: absolute;
      inset: 14px;
      border: 2px solid #332217;
      border-radius: 50%;
      background: #ffc084;
      pointer-events: none;
    }
    .wall-handle:hover:enabled { background: transparent; }
    .wall-measure { align-self:center; padding:4px 8px; font-variant-numeric:tabular-nums; }
    #wall-editor .wall-selection { display: flex; flex-wrap: wrap; gap: 6px; }
    footer {
      display: flex;
      justify-content: space-between;
      gap: 10px 22px;
      flex-wrap: wrap;
      padding: 13px 2px 0;
      color: var(--quiet);
      font-size: 13px;
    }
    .legend { display: flex; gap: 16px; }
    .legend span { display: inline-flex; align-items: center; gap: 7px; }
    .legend i { display: block; }
    .line { width: 16px; height: 2px; border-radius: 2px; background: var(--amber); }
    .ring { width: 9px; height: 9px; border: 1px solid var(--amber); border-radius: 50%; }
    @media (max-width: 720px) {
      .stage { grid-template: "map" auto "device" auto / minmax(0, 1fr); gap: 10px; }
      .viewer { height: clamp(330px, 49dvh, 520px); }
      header { margin-bottom: 13px; }
      .device {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(80px, 30%);
        align-items: center;
        gap: 0 10px;
        padding: 14px;
      }
      .tools { grid-column: 1 / -1; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .stage[data-editing="true"] .viewer { height: clamp(410px, 65dvh, 630px); }
      .furnishing-actions strong { width: 100%; }
      .tools button { font-size: 14px; padding-inline: 10px; }
    }
  </style>
<style>
    :host, :root {
  color-scheme: light;
  --paper: #f9f6f0;
  --ink: #302d28;
  --dim: #59534b;
  --edge: #d9d1c4;
  --accent: #914124;
  --primary: #813d29;
  --on-primary: #fff9ee;
  --selected: #f4e6d7;
  --map-surface: radial-gradient(ellipse at 20% 0%, #fcf9f3, transparent 68%), linear-gradient(120deg, #eae1d2, #f1e9dd 67%, #e9dfd3);
}
:host([data-appearance="night"]), :root[data-appearance="night"] {
  color-scheme: dark;
  --paper: #202425;
  --ink: #f4eee5;
  --dim: #b6b3aa;
  --edge: #434747;
  --accent: #f6c584;
  --primary: #edbe7b;
  --on-primary: #251c13;
  --selected: #3b3024;
  --map-surface: radial-gradient(ellipse at 50% 53%, #3a3931, #282a29 50%, #1b2022 90%);
}

    :root { --quiet:var(--dim); --line:var(--edge); --amber:var(--accent); color:var(--ink); background:var(--paper) }
    body { padding:16px; display:block; min-height:100dvh; background:var(--map-surface) }
    main { display:grid; grid-template-rows:auto minmax(0,1fr); height:calc(100dvh - 32px) }
    h1 { font:normal clamp(28px,4vw,46px)/1.04 "Iowan Old Style",Georgia,serif; letter-spacing:-.045em }
    :root[data-appearance=night] h1 { font-family:inherit; font-weight:650 }
    header { align-items:center; gap:8px 14px; margin-bottom:10px }
    header nav button { min-height:36px; padding:6px 12px; border-radius:22px }
    button,select,.furnishing-palette,.edit-selection,.edit-status { background:var(--paper); color:var(--ink) }
    button[aria-pressed=true],button:hover:enabled { background:var(--selected); color:var(--accent); border-color:var(--accent) }
    .stage,.stage[data-editing=true] { display:grid; grid-template:"map" minmax(225px,1fr) "device" auto / minmax(0,1fr); gap:4px }
    .stage .viewer,.stage[data-editing=true] .viewer { min-height:0; height:100%; background:transparent; border:0 }
    .device { display:block; padding:8px 0; border:0; background:transparent }
    .device>div:not(.tools),footer { display:none }
    .notice { background:var(--paper); color:var(--ink); border-radius:8px; padding:8px }
    .dock-pin { background:var(--paper); color:var(--ink); border-color:var(--accent) }
    .tools { display:flex; gap:8px; flex-wrap:wrap }
    .tools button { display:inline-flex; justify-content:center; min-height:40px; padding:7px 12px; font-size:13px; white-space:nowrap }
    .tools .switch { width:28px; height:16px; margin:0 }
    .tools button[aria-pressed=true] .switch { background:var(--accent); border-color:var(--accent) }
    .tools button[aria-pressed=true] .switch::before { background:var(--paper) }
    @media(max-width:650px) {
      body { padding:12px }
      main { height:calc(100dvh - 24px) }
      header nav { gap:4px }
      header nav button { font-size:13px; padding:5px 8px }
    }
  </style><style>#layout-status,.tools>button:not([data-view]),.map-editor{display:none!important}</style></head>
<body>
  <main>
    <header>
      <div>
        <h1>Vacuum map</h1>
        <p class="feed-label">Valetudo map</p>
      </div>
      <nav aria-label="Camera views">
        <button type="button" data-camera="floor" aria-pressed="true">3D floor</button>
        <button type="button" data-camera="top" aria-pressed="false">Top view</button>
        <button type="button" data-camera="follow" aria-pressed="false" hidden>Follow robot</button>
        <button type="button" data-camera="dock" aria-pressed="false">Dock close-up</button>
      </nav>
    </header>
    <div class="stage">
      <section class="viewer" aria-label="Vacuum floor plan" aria-describedby="map-help">
        <p class="notice" role="status" hidden>3D is unavailable in this browser. Showing the original scan.</p>
        <button type="button" class="dock-pin" aria-label="Focus on the dock" hidden>Dock</button>
        <div class="map-editor" id="furnishing-editor" hidden>
          <div class="editor-top">
            <button type="button" data-furnishing="add" aria-expanded="false" aria-controls="furnishing-palette">Add furniture</button>
            <div class="edit-actions">
              <button type="button" data-furnishing="undo" hidden>Undo</button>
              <button type="button" data-furnishing="done">Done</button>
            </div>
            <div class="furnishing-palette" id="furnishing-palette" role="group" aria-label="Furniture choices" hidden></div>
          </div>
          <div class="editor-bottom">
            <p class="edit-status furnishing-status" role="status"></p>
            <div class="edit-selection" hidden>
              <div class="furnishing-actions">
                <strong class="selected-name"></strong>
                <button type="button" data-furnishing="rotate">Rotate</button>
                <button type="button" data-furnishing="flip-chaise" hidden>Flip chaise</button>
                <button type="button" data-furnishing="resize" aria-expanded="false" aria-controls="furnishing-size">Resize</button>
                <button type="button" data-furnishing="remove">Remove</button>
              </div>
              <div class="furnishing-size" id="furnishing-size" hidden>
                <label class="size">
                  Width<input type="range" min="50" max="400" step="5" value="100" aria-label="Width">
                  <output>100%</output>
                </label>
                <label class="size">
                  Depth<input type="range" min="50" max="400" step="5" value="100" aria-label="Depth">
                  <output>100%</output>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="map-editor" id="wall-editor" hidden>
          <button type="button" class="wall-turn" aria-label="Drag to rotate wall" title="Drag to rotate. Arrow keys turn by 1\xB0." hidden>\u21BB</button>
          <button type="button" class="wall-handle" data-wall-end="start" aria-label="Start of selected wall" hidden></button>
          <button type="button" class="wall-handle" data-wall-end="end" aria-label="End of selected wall" hidden></button>
          <div class="editor-top">
            <div class="wall-tools">
              <button type="button" data-wall="add" aria-pressed="false">Add wall</button>
              <button type="button" data-wall="gap" aria-pressed="false">Cover gap</button>
              <button type="button" data-wall="floor" aria-pressed="false">Add floor</button>
              <button type="button" data-wall="door" aria-pressed="false">Add door</button>
              <button type="button" data-wall="finish-floor" hidden>Finish floor</button>
              <button type="button" data-wall="reset" hidden>Reset walls</button>
            </div>
            <div class="edit-actions">
              <button type="button" data-wall="undo" hidden>Undo</button>
              <button type="button" data-wall="done">Done</button>
            </div>
          </div>
          <div class="editor-bottom">
            <p class="edit-status wall-status" role="status"></p>
            <div class="edit-selection wall-selection" hidden>
              <output class="wall-measure" aria-label="Wall measurement"></output>
              <button type="button" data-wall="rotate">Rotate 90\xB0</button>
              <button type="button" data-wall="remove">Remove wall</button>
            </div>
          </div>
        </div>
      </section>
      <aside class="device" aria-label="Deebot map options">
        <div>
          <h2>Deebot T90</h2>
          <p class="device-state">Saved Ecovacs map</p>
          <p class="furnishing-note">Your furnishings</p>
        </div>
        <div class="product"></div>
        <p id="layout-status" hidden></p>
        <div class="tools">
          <button type="button" data-view="route" aria-pressed="true">
            Cleaning path<span class="switch" aria-hidden="true"></span>
          </button>
          <button type="button" data-view="source" aria-pressed="false">Original scan</button>
          <button type="button" data-furnishing="visible" aria-pressed="true">
            Furnishings<span class="switch" aria-hidden="true"></span>
          </button>
          <button type="button" id="layout-lock" aria-pressed="false">Lock layout</button>
          <button type="button" data-furnishing="edit" aria-expanded="false" aria-controls="furnishing-editor">Edit furnishings</button>
          <button type="button" data-wall="edit" aria-expanded="false" aria-controls="wall-editor">Edit walls</button>
        </div>
      </aside>
    </div>
    <footer>
      <span id="map-help">Drag to rotate. Scroll or pinch to zoom. Keyboard: \u2190 \u2192 and + \u2212.</span>
      <button id="export-layout" type="button">Export room layout</button>
      <div class="legend" aria-label="Legend">
        <span><i class="line" aria-hidden="true"></i>Cleaning path</span>
        <span><i class="ring" aria-hidden="true"></i>Dock</span>
      </div>
    </footer>
  </main>
  <script>(()=>{/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */var Li={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},Di={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Dh=0,tc=1,Nh=2;var Ki=1,Uh=2,Vs=3,Ni=0,sn=1,Fe=2,qn=0,Hs=1,Dr=2,ec=3,nc=4,Fh=5;var $i=100,Oh=101,Bh=102,zh=103,kh=104,Vh=200,Hh=201,Gh=202,Wh=203,ic=204,sc=205,Xh=206,qh=207,Yh=208,Zh=209,Jh=210,Kh=211,$h=212,jh=213,Qh=214,Eo=0,wo=1,To=2,Ms=3,Ao=4,Ro=5,Co=6,Po=7,rc=0,tu=1,eu=2,Dn=0,oc=1,ac=2,lc=3,Nr=4,cc=5,hc=6,uc=7;var dc=300,Ui=301,ji=302,ra=303,oa=304,Ur=306,Hn=1e3,yn=1001,bs=1002,Ge=1003,nu=1004;var Fr=1005;var Pe=1006,aa=1007;var Sn=1008;var an=1009,fc=1010,pc=1011,Gs=1012,la=1013,Nn=1014,Un=1015,Fn=1016,ca=1017,ha=1018,Ws=1020,mc=35902,gc=35899,_c=1021,xc=1022,Mn=1023,Gn=1026,Fi=1027,yc=1028,ua=1029,Oi=1030,da=1031;var fa=1033,Or=33776,Br=33777,zr=33778,kr=33779,pa=35840,ma=35841,ga=35842,_a=35843,xa=36196,ya=37492,va=37496,Sa=37488,Ma=37489,Vr=37490,ba=37491,Ea=37808,wa=37809,Ta=37810,Aa=37811,Ra=37812,Ca=37813,Pa=37814,Ia=37815,La=37816,Da=37817,Na=37818,Ua=37819,Fa=37820,Oa=37821,Ba=36492,za=36494,ka=36495,Va=36283,Ha=36284,Hr=36285,Ga=36286;var ar=2300,Io=2301,Mo=2302,zl=2303,kl=2400,Vl=2401,Hl=2402;var iu=3200;var Wa=0,su=1,On="",Ue="srgb",lr="srgb-linear",cr="linear",xe="srgb";var bo=7680;var ru=519,ou=512,au=513,lu=514,Xa=515,cu=516,hu=517,qa=518,uu=519,du=35044;var vc="300 es",Rn=2e3,Es=2001;function yd(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function vd(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function hr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function fu(){let i=hr("canvas");return i.style.display="block",i}var Qc={},ws=null;function Sc(...i){let t="THREE."+i.shift();ws?ws("log",t,...i):console.log(t,...i)}function pu(i){let t=i[0];if(typeof t=="string"&&t.startsWith("TSL:")){let e=i[1];e&&e.isStackTrace?i[0]+=" "+e.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function te(...i){i=pu(i);let t="THREE."+i.shift();if(ws)ws("warn",t,...i);else{let e=i[0];e&&e.isStackTrace?console.warn(e.getError(t)):console.warn(t,...i)}}function ne(...i){i=pu(i);let t="THREE."+i.shift();if(ws)ws("error",t,...i);else{let e=i[0];e&&e.isStackTrace?console.error(e.getError(t)):console.error(t,...i)}}function Xi(...i){let t=i.join(" ");t in Qc||(Qc[t]=!0,te(...i))}function mu(i,t,e){return new Promise(function(n,s){function r(){switch(i.clientWaitSync(t,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:s();break;case i.TIMEOUT_EXPIRED:setTimeout(r,e);break;default:n()}}setTimeout(r,e)})}var gu={[Eo]:wo,[To]:Co,[Ao]:Po,[Ms]:Ro,[wo]:Eo,[Co]:To,[Po]:Ao,[Ro]:Ms},Cn=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){let n=this._listeners;return n===void 0?!1:n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){let n=this._listeners;if(n===void 0)return;let s=n[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){let e=this._listeners;if(e===void 0)return;let n=e[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,o=s.length;r<o;r++)s[r].call(this,t);t.target=null}}},Ke=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],th=1234567,ir=Math.PI/180,Ts=180/Math.PI;function Qi(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Ke[i&255]+Ke[i>>8&255]+Ke[i>>16&255]+Ke[i>>24&255]+"-"+Ke[t&255]+Ke[t>>8&255]+"-"+Ke[t>>16&15|64]+Ke[t>>24&255]+"-"+Ke[e&63|128]+Ke[e>>8&255]+"-"+Ke[e>>16&255]+Ke[e>>24&255]+Ke[n&255]+Ke[n>>8&255]+Ke[n>>16&255]+Ke[n>>24&255]).toLowerCase()}function oe(i,t,e){return Math.max(t,Math.min(e,i))}function Mc(i,t){return(i%t+t)%t}function Sd(i,t,e,n,s){return n+(i-t)*(s-n)/(e-t)}function Md(i,t,e){return i!==t?(e-i)/(t-i):0}function sr(i,t,e){return(1-e)*i+e*t}function bd(i,t,e,n){return sr(i,t,1-Math.exp(-e*n))}function Ed(i,t=1){return t-Math.abs(Mc(i,t*2)-t)}function wd(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*(3-2*i))}function Td(i,t,e){return i<=t?0:i>=e?1:(i=(i-t)/(e-t),i*i*i*(i*(i*6-15)+10))}function Ad(i,t){return i+Math.floor(Math.random()*(t-i+1))}function Rd(i,t){return i+Math.random()*(t-i)}function Cd(i){return i*(.5-Math.random())}function Pd(i){i!==void 0&&(th=i);let t=th+=1831565813;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),((t^t>>>14)>>>0)/4294967296}function Id(i){return i*ir}function Ld(i){return i*Ts}function Dd(i){return i>0&&Number.isInteger(i)&&2**Math.round(Math.log2(i))===i}function Nd(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function Ud(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Fd(i,t,e,n,s){let r=Math.cos,o=Math.sin,a=r(e/2),c=o(e/2),l=r((t+n)/2),h=o((t+n)/2),d=r((t-n)/2),u=o((t-n)/2),p=r((n-t)/2),g=o((n-t)/2);switch(s){case"XYX":i.set(a*h,c*d,c*u,a*l);break;case"YZY":i.set(c*u,a*h,c*d,a*l);break;case"ZXZ":i.set(c*d,c*u,a*h,a*l);break;case"XZX":i.set(a*h,c*g,c*p,a*l);break;case"YXY":i.set(c*p,a*h,c*g,a*l);break;case"ZYZ":i.set(c*g,c*p,a*h,a*l);break;default:te("MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+s)}}function vs(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:case Uint8ClampedArray:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("THREE.MathUtils: Invalid component type.")}}function en(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:case Uint8ClampedArray:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("THREE.MathUtils: Invalid component type.")}}var Oe={DEG2RAD:ir,RAD2DEG:Ts,generateUUID:Qi,clamp:oe,euclideanModulo:Mc,mapLinear:Sd,inverseLerp:Md,lerp:sr,damp:bd,pingpong:Ed,smoothstep:wd,smootherstep:Td,randInt:Ad,randFloat:Rd,randFloatSpread:Cd,seededRandom:Pd,degToRad:Id,radToDeg:Ld,isPowerOfTwo:Dd,ceilPowerOfTwo:Nd,floorPowerOfTwo:Ud,setQuaternionFromProperEuler:Fd,normalize:en,denormalize:vs},mt=class i{static{i.prototype.isVector2=!0}constructor(t=0,e=0){this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("THREE.Vector2: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=oe(this.x,t.x,e.x),this.y=oe(this.y,t.y,e.y),this}clampScalar(t,e){return this.x=oe(this.x,t,e),this.y=oe(this.y,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(oe(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(oe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,o=this.y-t.y;return this.x=r*n-o*s+t.x,this.y=r*s+o*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},dn=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,o,a){let c=n[s+0],l=n[s+1],h=n[s+2],d=n[s+3],u=r[o+0],p=r[o+1],g=r[o+2],v=r[o+3];if(d!==v||c!==u||l!==p||h!==g){let m=c*u+l*p+h*g+d*v;m<0&&(u=-u,p=-p,g=-g,v=-v,m=-m);let f=1-a;if(m<.9995){let w=Math.acos(m),I=Math.sin(w);f=Math.sin(f*w)/I,a=Math.sin(a*w)/I,c=c*f+u*a,l=l*f+p*a,h=h*f+g*a,d=d*f+v*a}else{c=c*f+u*a,l=l*f+p*a,h=h*f+g*a,d=d*f+v*a;let w=1/Math.sqrt(c*c+l*l+h*h+d*d);c*=w,l*=w,h*=w,d*=w}}t[e]=c,t[e+1]=l,t[e+2]=h,t[e+3]=d}static multiplyQuaternionsFlat(t,e,n,s,r,o){let a=n[s],c=n[s+1],l=n[s+2],h=n[s+3],d=r[o],u=r[o+1],p=r[o+2],g=r[o+3];return t[e]=a*g+h*d+c*p-l*u,t[e+1]=c*g+h*u+l*d-a*p,t[e+2]=l*g+h*p+a*u-c*d,t[e+3]=h*g-a*d-c*u-l*p,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,o=t._order,a=Math.cos,c=Math.sin,l=a(n/2),h=a(s/2),d=a(r/2),u=c(n/2),p=c(s/2),g=c(r/2);switch(o){case"XYZ":this._x=u*h*d+l*p*g,this._y=l*p*d-u*h*g,this._z=l*h*g+u*p*d,this._w=l*h*d-u*p*g;break;case"YXZ":this._x=u*h*d+l*p*g,this._y=l*p*d-u*h*g,this._z=l*h*g-u*p*d,this._w=l*h*d+u*p*g;break;case"ZXY":this._x=u*h*d-l*p*g,this._y=l*p*d+u*h*g,this._z=l*h*g+u*p*d,this._w=l*h*d-u*p*g;break;case"ZYX":this._x=u*h*d-l*p*g,this._y=l*p*d+u*h*g,this._z=l*h*g-u*p*d,this._w=l*h*d+u*p*g;break;case"YZX":this._x=u*h*d+l*p*g,this._y=l*p*d+u*h*g,this._z=l*h*g-u*p*d,this._w=l*h*d-u*p*g;break;case"XZY":this._x=u*h*d-l*p*g,this._y=l*p*d-u*h*g,this._z=l*h*g+u*p*d,this._w=l*h*d+u*p*g;break;default:te("Quaternion: .setFromEuler() encountered an unknown order: "+o)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],o=e[1],a=e[5],c=e[9],l=e[2],h=e[6],d=e[10],u=n+a+d;if(u>0){let p=.5/Math.sqrt(u+1);this._w=.25/p,this._x=(h-c)*p,this._y=(r-l)*p,this._z=(o-s)*p}else if(n>a&&n>d){let p=2*Math.sqrt(1+n-a-d);this._w=(h-c)/p,this._x=.25*p,this._y=(s+o)/p,this._z=(r+l)/p}else if(a>d){let p=2*Math.sqrt(1+a-n-d);this._w=(r-l)/p,this._x=(s+o)/p,this._y=.25*p,this._z=(c+h)/p}else{let p=2*Math.sqrt(1+d-n-a);this._w=(o-s)/p,this._x=(r+l)/p,this._y=(c+h)/p,this._z=.25*p}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<1e-8?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(oe(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,o=t._w,a=e._x,c=e._y,l=e._z,h=e._w;return this._x=n*h+o*a+s*l-r*c,this._y=s*h+o*c+r*a-n*l,this._z=r*h+o*l+n*c-s*a,this._w=o*h-n*a-s*c-r*l,this._onChangeCallback(),this}slerp(t,e){let n=t._x,s=t._y,r=t._z,o=t._w,a=this.dot(t);a<0&&(n=-n,s=-s,r=-r,o=-o,a=-a);let c=1-e;if(a<.9995){let l=Math.acos(a),h=Math.sin(l);c=Math.sin(c*l)/h,e=Math.sin(e*l)/h,this._x=this._x*c+n*e,this._y=this._y*c+s*e,this._z=this._z*c+r*e,this._w=this._w*c+o*e,this._onChangeCallback()}else this._x=this._x*c+n*e,this._y=this._y*c+s*e,this._z=this._z*c+r*e,this._w=this._w*c+o*e,this.normalize();return this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},V=class i{static{i.prototype.isVector3=!0}constructor(t=0,e=0,n=0){this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("THREE.Vector3: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(eh.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(eh.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,o=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*o,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*o,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*o,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,o=t.y,a=t.z,c=t.w,l=2*(o*s-a*n),h=2*(a*e-r*s),d=2*(r*n-o*e);return this.x=e+c*l+o*d-a*h,this.y=n+c*h+a*l-r*d,this.z=s+c*d+r*h-o*l,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=oe(this.x,t.x,e.x),this.y=oe(this.y,t.y,e.y),this.z=oe(this.z,t.z,e.z),this}clampScalar(t,e){return this.x=oe(this.x,t,e),this.y=oe(this.y,t,e),this.z=oe(this.z,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(oe(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,o=e.x,a=e.y,c=e.z;return this.x=s*c-r*a,this.y=r*o-n*c,this.z=n*a-s*o,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return pl.copy(this).projectOnVector(t),this.sub(pl)}reflect(t){return this.sub(pl.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(oe(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},pl=new V,eh=new dn,Qt=class i{static{i.prototype.isMatrix3=!0}constructor(t,e,n,s,r,o,a,c,l){this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,c,l)}set(t,e,n,s,r,o,a,c,l){let h=this.elements;return h[0]=t,h[1]=s,h[2]=a,h[3]=e,h[4]=r,h[5]=c,h[6]=n,h[7]=o,h[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[3],c=n[6],l=n[1],h=n[4],d=n[7],u=n[2],p=n[5],g=n[8],v=s[0],m=s[3],f=s[6],w=s[1],I=s[4],x=s[7],M=s[2],A=s[5],N=s[8];return r[0]=o*v+a*w+c*M,r[3]=o*m+a*I+c*A,r[6]=o*f+a*x+c*N,r[1]=l*v+h*w+d*M,r[4]=l*m+h*I+d*A,r[7]=l*f+h*x+d*N,r[2]=u*v+p*w+g*M,r[5]=u*m+p*I+g*A,r[8]=u*f+p*x+g*N,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8];return e*o*h-e*a*l-n*r*h+n*a*c+s*r*l-s*o*c}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8],d=h*o-a*l,u=a*c-h*r,p=l*r-o*c,g=e*d+n*u+s*p;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let v=1/g;return t[0]=d*v,t[1]=(s*l-h*n)*v,t[2]=(a*n-s*o)*v,t[3]=u*v,t[4]=(h*e-s*c)*v,t[5]=(s*r-a*e)*v,t[6]=p*v,t[7]=(n*c-l*e)*v,t[8]=(o*e-n*r)*v,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,o,a){let c=Math.cos(r),l=Math.sin(r);return this.set(n*c,n*l,-n*(c*o+l*a)+o+t,-s*l,s*c,-s*(-l*o+c*a)+a+e,0,0,1),this}scale(t,e){return Xi("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(ml.makeScale(t,e)),this}rotate(t){return Xi("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(ml.makeRotation(-t)),this}translate(t,e){return Xi("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(ml.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},ml=new Qt,nh=new Qt().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),ih=new Qt().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function Od(){let i={enabled:!0,workingColorSpace:lr,spaces:{},convert:function(s,r,o){return this.enabled===!1||r===o||!r||!o||(this.spaces[r].transfer===xe&&(s.r=ri(s.r),s.g=ri(s.g),s.b=ri(s.b)),this.spaces[r].primaries!==this.spaces[o].primaries&&(s.applyMatrix3(this.spaces[r].toXYZ),s.applyMatrix3(this.spaces[o].fromXYZ)),this.spaces[o].transfer===xe&&(s.r=Ss(s.r),s.g=Ss(s.g),s.b=Ss(s.b))),s},workingToColorSpace:function(s,r){return this.convert(s,this.workingColorSpace,r)},colorSpaceToWorking:function(s,r){return this.convert(s,r,this.workingColorSpace)},getPrimaries:function(s){return this.spaces[s].primaries},getTransfer:function(s){return s===On?cr:this.spaces[s].transfer},getToneMappingMode:function(s){return this.spaces[s].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(s,r=this.workingColorSpace){return s.fromArray(this.spaces[r].luminanceCoefficients)},define:function(s){Object.assign(this.spaces,s)},_getMatrix:function(s,r,o){return s.copy(this.spaces[r].toXYZ).multiply(this.spaces[o].fromXYZ)},_getDrawingBufferColorSpace:function(s){return this.spaces[s].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(s=this.workingColorSpace){return this.spaces[s].workingColorSpaceConfig.unpackColorSpace},fromWorkingColorSpace:function(s,r){return Xi("ColorManagement: .fromWorkingColorSpace() has been renamed to .workingToColorSpace()."),i.workingToColorSpace(s,r)},toWorkingColorSpace:function(s,r){return Xi("ColorManagement: .toWorkingColorSpace() has been renamed to .colorSpaceToWorking()."),i.colorSpaceToWorking(s,r)}},t=[.64,.33,.3,.6,.15,.06],e=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[lr]:{primaries:t,whitePoint:n,transfer:cr,toXYZ:nh,fromXYZ:ih,luminanceCoefficients:e,workingColorSpaceConfig:{unpackColorSpace:Ue},outputColorSpaceConfig:{drawingBufferColorSpace:Ue}},[Ue]:{primaries:t,whitePoint:n,transfer:xe,toXYZ:nh,fromXYZ:ih,luminanceCoefficients:e,outputColorSpaceConfig:{drawingBufferColorSpace:Ue}}}),i}var de=Od();function ri(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Ss(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var as,Lo=class{static getDataURL(t,e="image/png"){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement>"u")return t.src;let n;if(t instanceof HTMLCanvasElement)n=t;else{as===void 0&&(as=hr("canvas")),as.width=t.width,as.height=t.height;let s=as.getContext("2d");t instanceof ImageData?s.putImageData(t,0,0):s.drawImage(t,0,0,t.width,t.height),n=as}return n.toDataURL(e)}static sRGBToLinear(t){if(typeof HTMLImageElement<"u"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&t instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&t instanceof ImageBitmap){let e=hr("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let o=0;o<r.length;o++)r[o]=ri(r[o]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(ri(e[n]/255)*255):e[n]=ri(e[n]);return{data:e,width:t.width,height:t.height}}else return te("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},Bd=0,As=class{constructor(t=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:Bd++}),this.uuid=Qi(),this.data=t,this.dataReady=!0,this.version=0}getSize(t){let e=this.data;return typeof HTMLVideoElement<"u"&&e instanceof HTMLVideoElement?t.set(e.videoWidth,e.videoHeight,0):typeof VideoFrame<"u"&&e instanceof VideoFrame?t.set(e.displayWidth,e.displayHeight,0):e!==null?t.set(e.width,e.height,e.depth||0):t.set(0,0,0),t}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let o=0,a=s.length;o<a;o++)s[o].isDataTexture?r.push(gl(s[o].image)):r.push(gl(s[o]))}else r=gl(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function gl(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Lo.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(te("Texture: Unable to serialize Texture."),{})}var zd=0,_l=new V,nn=class i extends Cn{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=yn,s=yn,r=Pe,o=Sn,a=Mn,c=an,l=i.DEFAULT_ANISOTROPY,h=On){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:zd++}),this.uuid=Qi(),this.name="",this.source=new As(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=o,this.anisotropy=l,this.format=a,this.internalFormat=null,this.type=c,this.offset=new mt(0,0),this.repeat=new mt(1,1),this.center=new mt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Qt,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(t&&t.depth&&t.depth>1),this.pmremVersion=0,this.normalized=!1}get width(){return this.source.getSize(_l).x}get height(){return this.source.getSize(_l).y}get depth(){return this.source.getSize(_l).z}get image(){return this.source.data}set image(t){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.normalized=t.normalized,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.renderTarget=t.renderTarget,this.isRenderTargetTexture=t.isRenderTargetTexture,this.isArrayTexture=t.isArrayTexture,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}setValues(t){for(let e in t){let n=t[e];if(n===void 0){te(\`Texture.setValues(): parameter '\${e}' has value of undefined.\`);continue}let s=this[e];if(s===void 0){te(\`Texture.setValues(): property '\${e}' does not exist.\`);continue}s&&n&&s.isVector2&&n.isVector2||s&&n&&s.isVector3&&n.isVector3||s&&n&&s.isMatrix3&&n.isMatrix3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==dc)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Hn:t.x=t.x-Math.floor(t.x);break;case yn:t.x=t.x<0?0:1;break;case bs:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Hn:t.y=t.y-Math.floor(t.y);break;case yn:t.y=t.y<0?0:1;break;case bs:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(t){t===!0&&this.pmremVersion++}};nn.DEFAULT_IMAGE=null;nn.DEFAULT_MAPPING=dc;nn.DEFAULT_ANISOTROPY=1;var Re=class i{static{i.prototype.isVector4=!0}constructor(t=0,e=0,n=0,s=1){this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("THREE.Vector4: index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,o=t.elements;return this.x=o[0]*e+o[4]*n+o[8]*s+o[12]*r,this.y=o[1]*e+o[5]*n+o[9]*s+o[13]*r,this.z=o[2]*e+o[6]*n+o[10]*s+o[14]*r,this.w=o[3]*e+o[7]*n+o[11]*s+o[15]*r,this}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this.w/=t.w,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,c=t.elements,l=c[0],h=c[4],d=c[8],u=c[1],p=c[5],g=c[9],v=c[2],m=c[6],f=c[10];if(Math.abs(h-u)<.01&&Math.abs(d-v)<.01&&Math.abs(g-m)<.01){if(Math.abs(h+u)<.1&&Math.abs(d+v)<.1&&Math.abs(g+m)<.1&&Math.abs(l+p+f-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let I=(l+1)/2,x=(p+1)/2,M=(f+1)/2,A=(h+u)/4,N=(d+v)/4,y=(g+m)/4;return I>x&&I>M?I<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(I),s=A/n,r=N/n):x>M?x<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(x),n=A/s,r=y/s):M<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(M),n=N/r,s=y/r),this.set(n,s,r,e),this}let w=Math.sqrt((m-g)*(m-g)+(d-v)*(d-v)+(u-h)*(u-h));return Math.abs(w)<.001&&(w=1),this.x=(m-g)/w,this.y=(d-v)/w,this.z=(u-h)/w,this.w=Math.acos((l+p+f-1)/2),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this.w=e[15],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=oe(this.x,t.x,e.x),this.y=oe(this.y,t.y,e.y),this.z=oe(this.z,t.z,e.z),this.w=oe(this.w,t.w,e.w),this}clampScalar(t,e){return this.x=oe(this.x,t,e),this.y=oe(this.y,t,e),this.z=oe(this.z,t,e),this.w=oe(this.w,t,e),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(oe(n,t,e))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Do=class extends Cn{constructor(t=1,e=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Pe,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=n.depth,this.scissor=new Re(0,0,t,e),this.scissorTest=!1,this.viewport=new Re(0,0,t,e),this.textures=[];let s={width:t,height:e,depth:n.depth},r=new nn(s),o=n.count;for(let a=0;a<o;a++)this.textures[a]=r.clone(),this.textures[a].isRenderTargetTexture=!0,this.textures[a].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(t={}){let e={minFilter:Pe,generateMipmaps:!1,flipY:!1,internalFormat:null};t.mapping!==void 0&&(e.mapping=t.mapping),t.wrapS!==void 0&&(e.wrapS=t.wrapS),t.wrapT!==void 0&&(e.wrapT=t.wrapT),t.wrapR!==void 0&&(e.wrapR=t.wrapR),t.magFilter!==void 0&&(e.magFilter=t.magFilter),t.minFilter!==void 0&&(e.minFilter=t.minFilter),t.format!==void 0&&(e.format=t.format),t.type!==void 0&&(e.type=t.type),t.anisotropy!==void 0&&(e.anisotropy=t.anisotropy),t.colorSpace!==void 0&&(e.colorSpace=t.colorSpace),t.flipY!==void 0&&(e.flipY=t.flipY),t.generateMipmaps!==void 0&&(e.generateMipmaps=t.generateMipmaps),t.internalFormat!==void 0&&(e.internalFormat=t.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(e)}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}set depthTexture(t){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),t!==null&&t.renderTarget===null&&(t.renderTarget=this),this._depthTexture=t}get depthTexture(){return this._depthTexture}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n,this.textures[s].isData3DTexture!==!0&&(this.textures[s].isArrayTexture=this.textures[s].image.depth>1);this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let e=0,n=t.textures.length;e<n;e++){this.textures[e]=t.textures[e].clone(),this.textures[e].isRenderTargetTexture=!0,this.textures[e].renderTarget=this;let s=Object.assign({},t.textures[e].image);this.textures[e].source=new As(s)}if(this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,this.resolveColorBuffer=t.resolveColorBuffer,this.resolveDepthBuffer=t.resolveDepthBuffer,this.resolveStencilBuffer=t.resolveStencilBuffer,this.storeMultisampledColorBuffer=t.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=t.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=t.storeMultisampledStencilBuffer,t.depthTexture!==null)if(t.depthTexture.renderTarget===t){let e=t.depthTexture.clone();e.renderTarget=null,this.depthTexture=e}else this.depthTexture=t.depthTexture;return this.samples=t.samples,this.multiview=t.multiview,this.useArrayDepthTexture=t.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}},rn=class extends Do{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},ur=class extends nn{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Ge,this.minFilter=Ge,this.wrapR=yn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}addLayerUpdate(t){this.layerUpdates.add(t)}clearLayerUpdates(){this.layerUpdates.clear()}};var No=class extends nn{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=Ge,this.minFilter=Ge,this.wrapR=yn,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(t){return super.copy(t),this.wrapR=t.wrapR,this}};var we=class i{static{i.prototype.isMatrix4=!0}constructor(t,e,n,s,r,o,a,c,l,h,d,u,p,g,v,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,o,a,c,l,h,d,u,p,g,v,m)}set(t,e,n,s,r,o,a,c,l,h,d,u,p,g,v,m){let f=this.elements;return f[0]=t,f[4]=e,f[8]=n,f[12]=s,f[1]=r,f[5]=o,f[9]=a,f[13]=c,f[2]=l,f[6]=h,f[10]=d,f[14]=u,f[3]=p,f[7]=g,f[11]=v,f[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return this.determinantAffine()===0?(t.set(1,0,0),e.set(0,1,0),n.set(0,0,1),this):(t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){if(t.determinantAffine()===0)return this.identity();let e=this.elements,n=t.elements,s=1/ls.setFromMatrixColumn(t,0).length(),r=1/ls.setFromMatrixColumn(t,1).length(),o=1/ls.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*o,e[9]=n[9]*o,e[10]=n[10]*o,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,o=Math.cos(n),a=Math.sin(n),c=Math.cos(s),l=Math.sin(s),h=Math.cos(r),d=Math.sin(r);if(t.order==="XYZ"){let u=o*h,p=o*d,g=a*h,v=a*d;e[0]=c*h,e[4]=-c*d,e[8]=l,e[1]=p+g*l,e[5]=u-v*l,e[9]=-a*c,e[2]=v-u*l,e[6]=g+p*l,e[10]=o*c}else if(t.order==="YXZ"){let u=c*h,p=c*d,g=l*h,v=l*d;e[0]=u+v*a,e[4]=g*a-p,e[8]=o*l,e[1]=o*d,e[5]=o*h,e[9]=-a,e[2]=p*a-g,e[6]=v+u*a,e[10]=o*c}else if(t.order==="ZXY"){let u=c*h,p=c*d,g=l*h,v=l*d;e[0]=u-v*a,e[4]=-o*d,e[8]=g+p*a,e[1]=p+g*a,e[5]=o*h,e[9]=v-u*a,e[2]=-o*l,e[6]=a,e[10]=o*c}else if(t.order==="ZYX"){let u=o*h,p=o*d,g=a*h,v=a*d;e[0]=c*h,e[4]=g*l-p,e[8]=u*l+v,e[1]=c*d,e[5]=v*l+u,e[9]=p*l-g,e[2]=-l,e[6]=a*c,e[10]=o*c}else if(t.order==="YZX"){let u=o*c,p=o*l,g=a*c,v=a*l;e[0]=c*h,e[4]=v-u*d,e[8]=g*d+p,e[1]=d,e[5]=o*h,e[9]=-a*h,e[2]=-l*h,e[6]=p*d+g,e[10]=u-v*d}else if(t.order==="XZY"){let u=o*c,p=o*l,g=a*c,v=a*l;e[0]=c*h,e[4]=-d,e[8]=l*h,e[1]=u*d+v,e[5]=o*h,e[9]=p*d-g,e[2]=g*d-p,e[6]=a*h,e[10]=v*d+u}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(kd,t,Vd)}lookAt(t,e,n){let s=this.elements;return hn.subVectors(t,e),hn.lengthSq()===0&&(hn.z=1),hn.normalize(),gi.crossVectors(n,hn),gi.lengthSq()===0&&(Math.abs(n.z)===1?hn.x+=1e-4:hn.z+=1e-4,hn.normalize(),gi.crossVectors(n,hn)),gi.normalize(),jr.crossVectors(hn,gi),s[0]=gi.x,s[4]=jr.x,s[8]=hn.x,s[1]=gi.y,s[5]=jr.y,s[9]=hn.y,s[2]=gi.z,s[6]=jr.z,s[10]=hn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,o=n[0],a=n[4],c=n[8],l=n[12],h=n[1],d=n[5],u=n[9],p=n[13],g=n[2],v=n[6],m=n[10],f=n[14],w=n[3],I=n[7],x=n[11],M=n[15],A=s[0],N=s[4],y=s[8],R=s[12],k=s[1],Y=s[5],Z=s[9],it=s[13],G=s[2],et=s[6],nt=s[10],st=s[14],Q=s[3],at=s[7],ct=s[11],ft=s[15];return r[0]=o*A+a*k+c*G+l*Q,r[4]=o*N+a*Y+c*et+l*at,r[8]=o*y+a*Z+c*nt+l*ct,r[12]=o*R+a*it+c*st+l*ft,r[1]=h*A+d*k+u*G+p*Q,r[5]=h*N+d*Y+u*et+p*at,r[9]=h*y+d*Z+u*nt+p*ct,r[13]=h*R+d*it+u*st+p*ft,r[2]=g*A+v*k+m*G+f*Q,r[6]=g*N+v*Y+m*et+f*at,r[10]=g*y+v*Z+m*nt+f*ct,r[14]=g*R+v*it+m*st+f*ft,r[3]=w*A+I*k+x*G+M*Q,r[7]=w*N+I*Y+x*et+M*at,r[11]=w*y+I*Z+x*nt+M*ct,r[15]=w*R+I*it+x*st+M*ft,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],o=t[1],a=t[5],c=t[9],l=t[13],h=t[2],d=t[6],u=t[10],p=t[14],g=t[3],v=t[7],m=t[11],f=t[15],w=c*p-l*u,I=a*p-l*d,x=a*u-c*d,M=o*p-l*h,A=o*u-c*h,N=o*d-a*h;return e*(v*w-m*I+f*x)-n*(g*w-m*M+f*A)+s*(g*I-v*M+f*N)-r*(g*x-v*A+m*N)}determinantAffine(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[1],o=t[5],a=t[9],c=t[2],l=t[6],h=t[10];return e*(o*h-a*l)-n*(r*h-a*c)+s*(r*l-o*c)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],o=t[4],a=t[5],c=t[6],l=t[7],h=t[8],d=t[9],u=t[10],p=t[11],g=t[12],v=t[13],m=t[14],f=t[15],w=e*a-n*o,I=e*c-s*o,x=e*l-r*o,M=n*c-s*a,A=n*l-r*a,N=s*l-r*c,y=h*v-d*g,R=h*m-u*g,k=h*f-p*g,Y=d*m-u*v,Z=d*f-p*v,it=u*f-p*m,G=w*it-I*Z+x*Y+M*k-A*R+N*y;if(G===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let et=1/G;return t[0]=(a*it-c*Z+l*Y)*et,t[1]=(s*Z-n*it-r*Y)*et,t[2]=(v*N-m*A+f*M)*et,t[3]=(u*A-d*N-p*M)*et,t[4]=(c*k-o*it-l*R)*et,t[5]=(e*it-s*k+r*R)*et,t[6]=(m*x-g*N-f*I)*et,t[7]=(h*N-u*x+p*I)*et,t[8]=(o*Z-a*k+l*y)*et,t[9]=(n*k-e*Z-r*y)*et,t[10]=(g*A-v*x+f*w)*et,t[11]=(d*x-h*A-p*w)*et,t[12]=(a*R-o*Y-c*y)*et,t[13]=(e*Y-n*R+s*y)*et,t[14]=(v*I-g*M-m*w)*et,t[15]=(h*M-d*I+u*w)*et,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,o=t.x,a=t.y,c=t.z,l=r*o,h=r*a;return this.set(l*o+n,l*a-s*c,l*c+s*a,0,l*a+s*c,h*a+n,h*c-s*o,0,l*c-s*a,h*c+s*o,r*c*c+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,o){return this.set(1,n,r,0,t,1,o,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,o=e._y,a=e._z,c=e._w,l=r+r,h=o+o,d=a+a,u=r*l,p=r*h,g=r*d,v=o*h,m=o*d,f=a*d,w=c*l,I=c*h,x=c*d,M=n.x,A=n.y,N=n.z;return s[0]=(1-(v+f))*M,s[1]=(p+x)*M,s[2]=(g-I)*M,s[3]=0,s[4]=(p-x)*A,s[5]=(1-(u+f))*A,s[6]=(m+w)*A,s[7]=0,s[8]=(g+I)*N,s[9]=(m-w)*N,s[10]=(1-(u+v))*N,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements;t.x=s[12],t.y=s[13],t.z=s[14];let r=this.determinantAffine();if(r===0)return n.set(1,1,1),e.identity(),this;let o=ls.set(s[0],s[1],s[2]).length(),a=ls.set(s[4],s[5],s[6]).length(),c=ls.set(s[8],s[9],s[10]).length();r<0&&(o=-o),wn.copy(this);let l=1/o,h=1/a,d=1/c;return wn.elements[0]*=l,wn.elements[1]*=l,wn.elements[2]*=l,wn.elements[4]*=h,wn.elements[5]*=h,wn.elements[6]*=h,wn.elements[8]*=d,wn.elements[9]*=d,wn.elements[10]*=d,e.setFromRotationMatrix(wn),n.x=o,n.y=a,n.z=c,this}makePerspective(t,e,n,s,r,o,a=Rn,c=!1){let l=this.elements,h=2*r/(e-t),d=2*r/(n-s),u=(e+t)/(e-t),p=(n+s)/(n-s),g,v;if(c)g=r/(o-r),v=o*r/(o-r);else if(a===Rn)g=-(o+r)/(o-r),v=-2*o*r/(o-r);else if(a===Es)g=-o/(o-r),v=-o*r/(o-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return l[0]=h,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=d,l[9]=p,l[13]=0,l[2]=0,l[6]=0,l[10]=g,l[14]=v,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,o,a=Rn,c=!1){let l=this.elements,h=2/(e-t),d=2/(n-s),u=-(e+t)/(e-t),p=-(n+s)/(n-s),g,v;if(c)g=1/(o-r),v=o/(o-r);else if(a===Rn)g=-2/(o-r),v=-(o+r)/(o-r);else if(a===Es)g=-1/(o-r),v=-r/(o-r);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return l[0]=h,l[4]=0,l[8]=0,l[12]=u,l[1]=0,l[5]=d,l[9]=0,l[13]=p,l[2]=0,l[6]=0,l[10]=g,l[14]=v,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},ls=new V,wn=new we,kd=new V(0,0,0),Vd=new V(1,1,1),gi=new V,jr=new V,hn=new V,sh=new we,rh=new dn,oi=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],o=s[4],a=s[8],c=s[1],l=s[5],h=s[9],d=s[2],u=s[6],p=s[10];switch(e){case"XYZ":this._y=Math.asin(oe(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-h,p),this._z=Math.atan2(-o,r)):(this._x=Math.atan2(u,l),this._z=0);break;case"YXZ":this._x=Math.asin(-oe(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(a,p),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-d,r),this._z=0);break;case"ZXY":this._x=Math.asin(oe(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(-d,p),this._z=Math.atan2(-o,l)):(this._y=0,this._z=Math.atan2(c,r));break;case"ZYX":this._y=Math.asin(-oe(d,-1,1)),Math.abs(d)<.9999999?(this._x=Math.atan2(u,p),this._z=Math.atan2(c,r)):(this._x=0,this._z=Math.atan2(-o,l));break;case"YZX":this._z=Math.asin(oe(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-h,l),this._y=Math.atan2(-d,r)):(this._x=0,this._y=Math.atan2(a,p));break;case"XZY":this._z=Math.asin(-oe(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(u,l),this._y=Math.atan2(a,r)):(this._x=Math.atan2(-h,p),this._y=0);break;default:te("Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return sh.makeRotationFromQuaternion(t),this.setFromRotationMatrix(sh,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return rh.setFromEuler(this),this.setFromQuaternion(rh,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};oi.DEFAULT_ORDER="XYZ";var Rs=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Hd=0,oh=new V,cs=new dn,Qn=new we,Qr=new V,$s=new V,Gd=new V,Wd=new dn,ah=new V(1,0,0),lh=new V(0,1,0),ch=new V(0,0,1),hh={type:"added"},Xd={type:"removed"},hs={type:"childadded",child:null},xl={type:"childremoved",child:null},Ye=class i extends Cn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Hd++}),this.uuid=Qi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new V,e=new oi,n=new dn,s=new V(1,1,1);function r(){n.setFromEuler(e,!1)}function o(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new we},normalMatrix:{value:new Qt}}),this.matrix=new we,this.matrixWorld=new we,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Rs,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return cs.setFromAxisAngle(t,e),this.quaternion.multiply(cs),this}rotateOnWorldAxis(t,e){return cs.setFromAxisAngle(t,e),this.quaternion.premultiply(cs),this}rotateX(t){return this.rotateOnAxis(ah,t)}rotateY(t){return this.rotateOnAxis(lh,t)}rotateZ(t){return this.rotateOnAxis(ch,t)}translateOnAxis(t,e){return oh.copy(t).applyQuaternion(this.quaternion),this.position.add(oh.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(ah,t)}translateY(t){return this.translateOnAxis(lh,t)}translateZ(t){return this.translateOnAxis(ch,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Qn.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Qr.copy(t):Qr.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),$s.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Qn.lookAt($s,Qr,this.up):Qn.lookAt(Qr,$s,this.up),this.quaternion.setFromRotationMatrix(Qn),s&&(Qn.extractRotation(s.matrixWorld),cs.setFromRotationMatrix(Qn),this.quaternion.premultiply(cs.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(ne("Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.removeFromParent(),t.parent=this,this.children.push(t),t.dispatchEvent(hh),hs.child=t,this.dispatchEvent(hs),hs.child=null):ne("Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Xd),xl.child=t,this.dispatchEvent(xl),xl.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Qn.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Qn.multiply(t.parent.matrixWorld)),t.applyMatrix4(Qn),t.removeFromParent(),t.parent=this,this.children.push(t),t.updateWorldMatrix(!1,!0),t.dispatchEvent(hh),hs.child=t,this.dispatchEvent(hs),hs.child=null,this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let o=this.children[n].getObjectByProperty(t,e);if(o!==void 0)return o}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,o=s.length;r<o;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($s,t,Gd),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose($s,Wd,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}intersectsFrustum(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);let t=this.pivot;if(t!==null){let e=t.x,n=t.y,s=t.z,r=this.matrix.elements;r[12]+=e-r[0]*e-r[4]*n-r[8]*s,r[13]+=n-r[1]*e-r[5]*n-r[9]*s,r[14]+=s-r[2]*e-r[6]*n-r[10]*s}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].updateMatrixWorld(t)}updateWorldMatrix(t,e,n=!1){let s=this.parent;if(t===!0&&s!==null&&s.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),e===!0){let r=this.children;for(let o=0,a=r.length;o<a;o++)r[o].updateWorldMatrix(!1,!0,n)}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,s.name=this.name,s.castShadow=this.castShadow,s.receiveShadow=this.receiveShadow,s.visible=this.visible,s.frustumCulled=this.frustumCulled,s.renderOrder=this.renderOrder,s.static=this.static,s.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.pivot!==null&&(s.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(s.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(s.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.geometryInfo=this._geometryInfo.map(a=>({...a,boundingBox:a.boundingBox?a.boundingBox.toJSON():void 0,boundingSphere:a.boundingSphere?a.boundingSphere.toJSON():void 0})),s.instanceInfo=this._instanceInfo.map(a=>({...a})),s.availableInstanceIds=this._availableInstanceIds.slice(),s.availableGeometryIds=this._availableGeometryIds.slice(),s.nextIndexStart=this._nextIndexStart,s.nextVertexStart=this._nextVertexStart,s.geometryCount=this._geometryCount,s.maxInstanceCount=this._maxInstanceCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.matricesTexture=this._matricesTexture.toJSON(t),s.indirectTexture=this._indirectTexture.toJSON(t),this._colorsTexture!==null&&(s.colorsTexture=this._colorsTexture.toJSON(t)),this.boundingSphere!==null&&(s.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(s.boundingBox=this.boundingBox.toJSON()));function r(a,c){return a[c.uuid]===void 0&&(a[c.uuid]=c.toJSON(t)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){let c=a.shapes;if(Array.isArray(c))for(let l=0,h=c.length;l<h;l++){let d=c[l];r(t.shapes,d)}else r(t.shapes,c)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let a=[];for(let c=0,l=this.material.length;c<l;c++)a.push(r(t.materials,this.material[c]));s.material=a}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let a=0;a<this.children.length;a++)s.children.push(this.children[a].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let a=0;a<this.animations.length;a++){let c=this.animations[a];s.animations.push(r(t.animations,c))}}if(e){let a=o(t.geometries),c=o(t.materials),l=o(t.textures),h=o(t.images),d=o(t.shapes),u=o(t.skeletons),p=o(t.animations),g=o(t.nodes);a.length>0&&(n.geometries=a),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),h.length>0&&(n.images=h),d.length>0&&(n.shapes=d),u.length>0&&(n.skeletons=u),p.length>0&&(n.animations=p),g.length>0&&(n.nodes=g)}return n.object=s,n;function o(a){let c=[];for(let l in a){let h=a[l];delete h.metadata,c.push(h)}return c}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.pivot=t.pivot!==null?t.pivot.clone():null,this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.static=t.static,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}};Ye.DEFAULT_UP=new V(0,1,0);Ye.DEFAULT_MATRIX_AUTO_UPDATE=!0;Ye.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var qe=class extends Ye{constructor(){super(),this.isGroup=!0,this.type="Group"}},qd={type:"move"},Cs=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new qe,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new qe,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new V,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new V),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new qe,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new V,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new V,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,o=null,a=this._targetRay,c=this._grip,l=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(l&&t.hand){o=!0;for(let v of t.hand.values()){let m=e.getJointPose(v,n),f=this._getHandJoint(l,v);m!==null&&(f.matrix.fromArray(m.transform.matrix),f.matrix.decompose(f.position,f.rotation,f.scale),f.matrixWorldNeedsUpdate=!0,f.jointRadius=m.radius),f.visible=m!==null}let h=l.joints["index-finger-tip"],d=l.joints["thumb-tip"],u=h.position.distanceTo(d.position),p=.02,g=.005;l.inputState.pinching&&u>p+g?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!l.inputState.pinching&&u<=p-g&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else c!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(c.matrix.fromArray(r.transform.matrix),c.matrix.decompose(c.position,c.rotation,c.scale),c.matrixWorldNeedsUpdate=!0,r.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(r.linearVelocity)):c.hasLinearVelocity=!1,r.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(r.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:t,target:this})));a!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(a.matrix.fromArray(s.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,s.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(s.linearVelocity)):a.hasLinearVelocity=!1,s.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(s.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(qd)))}return a!==null&&(a.visible=s!==null),c!==null&&(c.visible=r!==null),l!==null&&(l.visible=o!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new qe;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},_u={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},_i={h:0,s:0,l:0},to={h:0,s:0,l:0};function yl(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var ie=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Ue){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,de.colorSpaceToWorking(this,e),this}setRGB(t,e,n,s=de.workingColorSpace){return this.r=t,this.g=e,this.b=n,de.colorSpaceToWorking(this,s),this}setHSL(t,e,n,s=de.workingColorSpace){if(t=Mc(t,1),e=oe(e,0,1),n=oe(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,o=2*n-r;this.r=yl(o,r,t+1/3),this.g=yl(o,r,t),this.b=yl(o,r,t-1/3)}return de.colorSpaceToWorking(this,s),this}setStyle(t,e=Ue){function n(r){r!==void 0&&parseFloat(r)<1&&te("Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\\w+)\\(([^\\)]*)\\)/.exec(t)){let r,o=s[1],a=s[2];switch(o){case"rgb":case"rgba":if(r=/^\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*(?:,\\s*(\\d*\\.?\\d+)\\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\\s*(\\d+)\\%\\s*,\\s*(\\d+)\\%\\s*,\\s*(\\d+)\\%\\s*(?:,\\s*(\\d*\\.?\\d+)\\s*)?$/.exec(a))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\\s*(\\d*\\.?\\d+)\\s*,\\s*(\\d*\\.?\\d+)\\%\\s*,\\s*(\\d*\\.?\\d+)\\%\\s*(?:,\\s*(\\d*\\.?\\d+)\\s*)?$/.exec(a))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:te("Color: Unknown color model "+t)}}else if(s=/^\\#([A-Fa-f\\d]+)$/.exec(t)){let r=s[1],o=r.length;if(o===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(o===6)return this.setHex(parseInt(r,16),e);te("Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Ue){let n=_u[t.toLowerCase()];return n!==void 0?this.setHex(n,e):te("Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=ri(t.r),this.g=ri(t.g),this.b=ri(t.b),this}copyLinearToSRGB(t){return this.r=Ss(t.r),this.g=Ss(t.g),this.b=Ss(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Ue){return de.workingToColorSpace($e.copy(this),t),Math.round(oe($e.r*255,0,255))*65536+Math.round(oe($e.g*255,0,255))*256+Math.round(oe($e.b*255,0,255))}getHexString(t=Ue){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=de.workingColorSpace){de.workingToColorSpace($e.copy(this),e);let n=$e.r,s=$e.g,r=$e.b,o=Math.max(n,s,r),a=Math.min(n,s,r),c,l,h=(a+o)/2;if(a===o)c=0,l=0;else{let d=o-a;switch(l=h<=.5?d/(o+a):d/(2-o-a),o){case n:c=(s-r)/d+(s<r?6:0);break;case s:c=(r-n)/d+2;break;case r:c=(n-s)/d+4;break}c/=6}return t.h=c,t.s=l,t.l=h,t}getRGB(t,e=de.workingColorSpace){return de.workingToColorSpace($e.copy(this),e),t.r=$e.r,t.g=$e.g,t.b=$e.b,t}getStyle(t=Ue){de.workingToColorSpace($e.copy(this),t);let e=$e.r,n=$e.g,s=$e.b;return t!==Ue?\`color(\${t} \${e.toFixed(3)} \${n.toFixed(3)} \${s.toFixed(3)})\`:\`rgb(\${Math.round(e*255)},\${Math.round(n*255)},\${Math.round(s*255)})\`}offsetHSL(t,e,n){return this.getHSL(_i),this.setHSL(_i.h+t,_i.s+e,_i.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(_i),t.getHSL(to);let n=sr(_i.h,to.h,e),s=sr(_i.s,to.s,e),r=sr(_i.l,to.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},$e=new ie;ie.NAMES=_u;var Ps=class extends Ye{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new oi,this.environmentIntensity=1,this.environmentRotation=new oi,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentIntensity=t.environmentIntensity,this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),e.object.backgroundBlurriness=this.backgroundBlurriness,e.object.backgroundIntensity=this.backgroundIntensity,e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentIntensity=this.environmentIntensity,e.object.environmentRotation=this.environmentRotation.toArray(),e}},Tn=new V,ti=new V,vl=new V,ei=new V,us=new V,ds=new V,uh=new V,Sl=new V,Ml=new V,bl=new V,El=new Re,wl=new Re,Tl=new Re,Si=class i{constructor(t=new V,e=new V,n=new V){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),Tn.subVectors(t,e),s.cross(Tn);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){Tn.subVectors(s,e),ti.subVectors(n,e),vl.subVectors(t,e);let o=Tn.dot(Tn),a=Tn.dot(ti),c=Tn.dot(vl),l=ti.dot(ti),h=ti.dot(vl),d=o*l-a*a;if(d===0)return r.set(0,0,0),null;let u=1/d,p=(l*c-a*h)*u,g=(o*h-a*c)*u;return r.set(1-p-g,g,p)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,ei)===null?!1:ei.x>=0&&ei.y>=0&&ei.x+ei.y<=1}static getInterpolation(t,e,n,s,r,o,a,c){return this.getBarycoord(t,e,n,s,ei)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(r,ei.x),c.addScaledVector(o,ei.y),c.addScaledVector(a,ei.z),c)}static getInterpolatedAttribute(t,e,n,s,r,o){return El.setScalar(0),wl.setScalar(0),Tl.setScalar(0),El.fromBufferAttribute(t,e),wl.fromBufferAttribute(t,n),Tl.fromBufferAttribute(t,s),o.setScalar(0),o.addScaledVector(El,r.x),o.addScaledVector(wl,r.y),o.addScaledVector(Tl,r.z),o}static isFrontFacing(t,e,n,s){return Tn.subVectors(n,e),ti.subVectors(t,e),Tn.cross(ti).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return Tn.subVectors(this.c,this.b),ti.subVectors(this.a,this.b),Tn.cross(ti).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,o,a;us.subVectors(s,n),ds.subVectors(r,n),Sl.subVectors(t,n);let c=us.dot(Sl),l=ds.dot(Sl);if(c<=0&&l<=0)return e.copy(n);Ml.subVectors(t,s);let h=us.dot(Ml),d=ds.dot(Ml);if(h>=0&&d<=h)return e.copy(s);let u=c*d-h*l;if(u<=0&&c>=0&&h<=0)return o=c/(c-h),e.copy(n).addScaledVector(us,o);bl.subVectors(t,r);let p=us.dot(bl),g=ds.dot(bl);if(g>=0&&p<=g)return e.copy(r);let v=p*l-c*g;if(v<=0&&l>=0&&g<=0)return a=l/(l-g),e.copy(n).addScaledVector(ds,a);let m=h*g-p*d;if(m<=0&&d-h>=0&&p-g>=0)return uh.subVectors(r,s),a=(d-h)/(d-h+(p-g)),e.copy(s).addScaledVector(uh,a);let f=1/(m+v+u);return o=v*f,a=u*f,e.copy(n).addScaledVector(us,o).addScaledVector(ds,a)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},Mi=class{constructor(t=new V(1/0,1/0,1/0),e=new V(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(An.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(An.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=An.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let o=0,a=r.count;o<a;o++)t.isMesh===!0?t.getVertexPosition(o,An):An.fromBufferAttribute(r,o),An.applyMatrix4(t.matrixWorld),this.expandByPoint(An);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),eo.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),eo.copy(n.boundingBox)),eo.applyMatrix4(t.matrixWorld),this.union(eo)}let s=t.children;for(let r=0,o=s.length;r<o;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y&&t.z>=this.min.z&&t.z<=this.max.z}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y&&t.max.z>=this.min.z&&t.min.z<=this.max.z}intersectsSphere(t){return this.clampPoint(t.center,An),An.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(js),no.subVectors(this.max,js),fs.subVectors(t.a,js),ps.subVectors(t.b,js),ms.subVectors(t.c,js),xi.subVectors(ps,fs),yi.subVectors(ms,ps),Vi.subVectors(fs,ms);let e=[0,-xi.z,xi.y,0,-yi.z,yi.y,0,-Vi.z,Vi.y,xi.z,0,-xi.x,yi.z,0,-yi.x,Vi.z,0,-Vi.x,-xi.y,xi.x,0,-yi.y,yi.x,0,-Vi.y,Vi.x,0];return!Al(e,fs,ps,ms,no)||(e=[1,0,0,0,1,0,0,0,1],!Al(e,fs,ps,ms,no))?!1:(io.crossVectors(xi,yi),e=[io.x,io.y,io.z],Al(e,fs,ps,ms,no))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,An).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(An).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(ni[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),ni[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),ni[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),ni[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),ni[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),ni[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),ni[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),ni[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(ni),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(t){return this.min.fromArray(t.min),this.max.fromArray(t.max),this}},ni=[new V,new V,new V,new V,new V,new V,new V,new V],An=new V,eo=new Mi,fs=new V,ps=new V,ms=new V,xi=new V,yi=new V,Vi=new V,js=new V,no=new V,io=new V,Hi=new V;function Al(i,t,e,n,s){for(let r=0,o=i.length-3;r<=o;r+=3){Hi.fromArray(i,r);let a=s.x*Math.abs(Hi.x)+s.y*Math.abs(Hi.y)+s.z*Math.abs(Hi.z),c=t.dot(Hi),l=e.dot(Hi),h=n.dot(Hi);if(Math.max(-Math.max(c,l,h),Math.min(c,l,h))>a)return!1}return!0}var Ne=new V,so=new mt,Yd=0,vn=class extends Cn{constructor(t,e,n=!1){if(super(),Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Yd++}),this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=du,this.updateRanges=[],this.gpuType=Un,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)so.fromBufferAttribute(this,e),so.applyMatrix3(t),this.setXY(e,so.x,so.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Ne.fromBufferAttribute(this,e),Ne.applyMatrix3(t),this.setXYZ(e,Ne.x,Ne.y,Ne.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Ne.fromBufferAttribute(this,e),Ne.applyMatrix4(t),this.setXYZ(e,Ne.x,Ne.y,Ne.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Ne.fromBufferAttribute(this,e),Ne.applyNormalMatrix(t),this.setXYZ(e,Ne.x,Ne.y,Ne.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Ne.fromBufferAttribute(this,e),Ne.transformDirection(t),this.setXYZ(e,Ne.x,Ne.y,Ne.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=vs(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=en(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=vs(e,this.array)),e}setX(t,e){return this.normalized&&(e=en(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=vs(e,this.array)),e}setY(t,e){return this.normalized&&(e=en(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=vs(e,this.array)),e}setZ(t,e){return this.normalized&&(e=en(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=vs(e,this.array)),e}setW(t,e){return this.normalized&&(e=en(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=en(e,this.array),n=en(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=en(e,this.array),n=en(n,this.array),s=en(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=en(e,this.array),n=en(n,this.array),s=en(s,this.array),r=en(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return t.name=this.name,t.usage=this.usage,t.gpuType=this.gpuType,t}dispose(){this.dispatchEvent({type:"dispose"})}};var dr=class extends vn{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var fr=class extends vn{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var fe=class extends vn{constructor(t,e,n){super(new Float32Array(t),e,n)}},Zd=new Mi,Qs=new V,Rl=new V,qi=class{constructor(t=new V,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):Zd.setFromPoints(t).getCenter(n);let s=0;for(let r=0,o=t.length;r<o;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;Qs.subVectors(t,this.center);let e=Qs.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(Qs,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Rl.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(Qs.copy(t.center).add(Rl)),this.expandByPoint(Qs.copy(t.center).sub(Rl))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(t){return this.radius=t.radius,this.center.fromArray(t.center),this}},Jd=0,xn=new we,Cl=new Ye,gs=new V,un=new Mi,tr=new Mi,He=new V,Le=class i extends Cn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Jd++}),this.uuid=Qi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new(yd(t)?fr:dr)(t,1):this.index=t,this}setIndirect(t,e=0){return this.indirect=t,this.indirectOffset=e,this}getIndirect(){return this.indirect}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new Qt().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(t){return xn.makeRotationFromQuaternion(t),this.applyMatrix4(xn),this}rotateX(t){return xn.makeRotationX(t),this.applyMatrix4(xn),this}rotateY(t){return xn.makeRotationY(t),this.applyMatrix4(xn),this}rotateZ(t){return xn.makeRotationZ(t),this.applyMatrix4(xn),this}translate(t,e,n){return xn.makeTranslation(t,e,n),this.applyMatrix4(xn),this}scale(t,e,n){return xn.makeScale(t,e,n),this.applyMatrix4(xn),this}lookAt(t){return Cl.lookAt(t),Cl.updateMatrix(),this.applyMatrix4(Cl.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(gs).negate(),this.translate(gs.x,gs.y,gs.z),this}setFromPoints(t){let e=this.getAttribute("position");if(e===void 0){let n=[];for(let s=0,r=t.length;s<r;s++){let o=t[s];n.push(o.x,o.y,o.z||0)}this.setAttribute("position",new fe(n,3))}else{let n=Math.min(t.length,e.count);for(let s=0;s<n;s++){let r=t[s];e.setXYZ(s,r.x,r.y,r.z||0)}t.length>e.count&&te("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),e.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Mi);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){ne("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new V(-1/0,-1/0,-1/0),new V(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];un.setFromBufferAttribute(r),this.morphTargetsRelative?(He.addVectors(this.boundingBox.min,un.min),this.boundingBox.expandByPoint(He),He.addVectors(this.boundingBox.max,un.max),this.boundingBox.expandByPoint(He)):(this.boundingBox.expandByPoint(un.min),this.boundingBox.expandByPoint(un.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&ne('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new qi);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){ne("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new V,1/0);return}if(t){let n=this.boundingSphere.center;if(un.setFromBufferAttribute(t),e)for(let r=0,o=e.length;r<o;r++){let a=e[r];tr.setFromBufferAttribute(a),this.morphTargetsRelative?(He.addVectors(un.min,tr.min),un.expandByPoint(He),He.addVectors(un.max,tr.max),un.expandByPoint(He)):(un.expandByPoint(tr.min),un.expandByPoint(tr.max))}un.getCenter(n);let s=0;for(let r=0,o=t.count;r<o;r++)He.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(He));if(e)for(let r=0,o=e.length;r<o;r++){let a=e[r],c=this.morphTargetsRelative;for(let l=0,h=a.count;l<h;l++)He.fromBufferAttribute(a,l),c&&(gs.fromBufferAttribute(t,l),He.add(gs)),s=Math.max(s,n.distanceToSquared(He))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&ne('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){ne("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv,o=this.getAttribute("tangent");(o===void 0||o.count!==n.count)&&(o=new vn(new Float32Array(4*n.count),4),this.setAttribute("tangent",o));let a=[],c=[];for(let y=0;y<n.count;y++)a[y]=new V,c[y]=new V;let l=new V,h=new V,d=new V,u=new mt,p=new mt,g=new mt,v=new V,m=new V;function f(y,R,k){l.fromBufferAttribute(n,y),h.fromBufferAttribute(n,R),d.fromBufferAttribute(n,k),u.fromBufferAttribute(r,y),p.fromBufferAttribute(r,R),g.fromBufferAttribute(r,k),h.sub(l),d.sub(l),p.sub(u),g.sub(u);let Y=1/(p.x*g.y-g.x*p.y);isFinite(Y)&&(v.copy(h).multiplyScalar(g.y).addScaledVector(d,-p.y).multiplyScalar(Y),m.copy(d).multiplyScalar(p.x).addScaledVector(h,-g.x).multiplyScalar(Y),a[y].add(v),a[R].add(v),a[k].add(v),c[y].add(m),c[R].add(m),c[k].add(m))}let w=this.groups;w.length===0&&(w=[{start:0,count:t.count}]);for(let y=0,R=w.length;y<R;++y){let k=w[y],Y=k.start,Z=k.count;for(let it=Y,G=Y+Z;it<G;it+=3)f(t.getX(it+0),t.getX(it+1),t.getX(it+2))}let I=new V,x=new V,M=new V,A=new V;function N(y){M.fromBufferAttribute(s,y),A.copy(M);let R=a[y];I.copy(R),I.sub(M.multiplyScalar(M.dot(R))).normalize(),x.crossVectors(A,R);let Y=x.dot(c[y])<0?-1:1;o.setXYZW(y,I.x,I.y,I.z,Y)}for(let y=0,R=w.length;y<R;++y){let k=w[y],Y=k.start,Z=k.count;for(let it=Y,G=Y+Z;it<G;it+=3)N(t.getX(it+0)),N(t.getX(it+1)),N(t.getX(it+2))}this._transformed=!0}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==e.count)n=new vn(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let u=0,p=n.count;u<p;u++)n.setXYZ(u,0,0,0);let s=new V,r=new V,o=new V,a=new V,c=new V,l=new V,h=new V,d=new V;if(t)for(let u=0,p=t.count;u<p;u+=3){let g=t.getX(u+0),v=t.getX(u+1),m=t.getX(u+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,v),o.fromBufferAttribute(e,m),h.subVectors(o,r),d.subVectors(s,r),h.cross(d),a.fromBufferAttribute(n,g),c.fromBufferAttribute(n,v),l.fromBufferAttribute(n,m),a.add(h),c.add(h),l.add(h),n.setXYZ(g,a.x,a.y,a.z),n.setXYZ(v,c.x,c.y,c.z),n.setXYZ(m,l.x,l.y,l.z)}else for(let u=0,p=e.count;u<p;u+=3)s.fromBufferAttribute(e,u+0),r.fromBufferAttribute(e,u+1),o.fromBufferAttribute(e,u+2),h.subVectors(o,r),d.subVectors(s,r),h.cross(d),n.setXYZ(u+0,h.x,h.y,h.z),n.setXYZ(u+1,h.x,h.y,h.z),n.setXYZ(u+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)He.fromBufferAttribute(t,e),He.normalize(),t.setXYZ(e,He.x,He.y,He.z)}toNonIndexed(){function t(a,c){let l=a.array,h=a.itemSize,d=a.normalized,u=new l.constructor(c.length*h),p=0,g=0;for(let v=0,m=c.length;v<m;v++){a.isInterleavedBufferAttribute?p=c[v]*a.data.stride+a.offset:p=c[v]*h;for(let f=0;f<h;f++)u[g++]=l[p++]}return new vn(u,h,d)}if(this.index===null)return te("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let a in s){let c=s[a],l=t(c,n);e.setAttribute(a,l)}let r=this.morphAttributes;for(let a in r){let c=[],l=r[a];for(let h=0,d=l.length;h<d;h++){let u=l[h],p=t(u,n);c.push(p)}e.morphAttributes[a]=c}e.morphTargetsRelative=this.morphTargetsRelative;let o=this.groups;for(let a=0,c=o.length;a<c;a++){let l=o[a];e.addGroup(l.start,l.count,l.materialIndex)}return e}toJSON(){let t={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,t.name=this.name,Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){let c=this.parameters;for(let l in c)c[l]!==void 0&&(t[l]=c[l]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let c in n){let l=n[c];t.data.attributes[c]=l.toJSON(t.data)}let s={},r=!1;for(let c in this.morphAttributes){let l=this.morphAttributes[c],h=[];for(let d=0,u=l.length;d<u;d++){let p=l[d];h.push(p.toJSON(t.data))}h.length>0&&(s[c]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let o=this.groups;o.length>0&&(t.data.groups=JSON.parse(JSON.stringify(o)));let a=this.boundingSphere;return a!==null&&(t.data.boundingSphere=a.toJSON()),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone());let s=t.attributes;for(let l in s){let h=s[l];this.setAttribute(l,h.clone(e))}let r=t.morphAttributes;for(let l in r){let h=[],d=r[l];for(let u=0,p=d.length;u<p;u++)h.push(d[u].clone(e));this.morphAttributes[l]=h}this.morphTargetsRelative=t.morphTargetsRelative;let o=t.groups;for(let l=0,h=o.length;l<h;l++){let d=o[l];this.addGroup(d.start,d.count,d.materialIndex)}let a=t.boundingBox;a!==null&&(this.boundingBox=a.clone());let c=t.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this._transformed=t._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}};var Pl=new V,Kd=new V,$d=new Qt,We=class{constructor(t=new V(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=Pl.subVectors(n,e).cross(Kd.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e,n=!0){let s=t.delta(Pl),r=this.normal.dot(s);if(r===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let o=-(t.start.dot(this.normal)+this.constant)/r;return n===!0&&(o<0||o>1)?null:e.copy(t.start).addScaledVector(s,o)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||$d.getNormalMatrix(t),s=this.coplanarPoint(Pl).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(t){return this.normal.fromArray(t.normal),this.constant=t.constant,this}},jd=0,Wn=class extends Cn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:jd++}),this.uuid=Qi(),this.name="",this.type="Material",this.blending=Hs,this.side=Ni,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=ic,this.blendDst=sc,this.blendEquation=$i,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new ie(0,0,0),this.blendAlpha=0,this.depthFunc=Ms,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=ru,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=bo,this.stencilZFail=bo,this.stencilZPass=bo,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){te(\`Material: parameter '\${e}' has value of undefined.\`);continue}let s=this[e];if(s===void 0){te(\`Material: '\${e}' is not a property of THREE.\${this.type}.\`);continue}s&&s.isColor?s.set(n):s&&s.isVector2&&n&&n.isVector2||s&&s.isEuler&&n&&n.isEuler||s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(t).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(t).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(r=>r.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let o=[];for(let a in r){let c=r[a];delete c.metadata,o.push(c)}return o}if(e){let r=s(t.textures),o=s(t.images);r.length>0&&(n.textures=r),o.length>0&&(n.images=o)}return n}fromJSON(t,e){if(t.uuid!==void 0&&(this.uuid=t.uuid),t.name!==void 0&&(this.name=t.name),t.color!==void 0&&this.color!==void 0&&this.color.setHex(t.color),t.roughness!==void 0&&(this.roughness=t.roughness),t.metalness!==void 0&&(this.metalness=t.metalness),t.sheen!==void 0&&(this.sheen=t.sheen),t.sheenColor!==void 0&&(this.sheenColor=new ie().setHex(t.sheenColor)),t.sheenRoughness!==void 0&&(this.sheenRoughness=t.sheenRoughness),t.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(t.emissive),t.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(t.specular),t.specularIntensity!==void 0&&(this.specularIntensity=t.specularIntensity),t.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(t.specularColor),t.shininess!==void 0&&(this.shininess=t.shininess),t.clearcoat!==void 0&&(this.clearcoat=t.clearcoat),t.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=t.clearcoatRoughness),t.dispersion!==void 0&&(this.dispersion=t.dispersion),t.retroreflectivity!==void 0&&(this.retroreflectivity=t.retroreflectivity),t.iridescence!==void 0&&(this.iridescence=t.iridescence),t.iridescenceIOR!==void 0&&(this.iridescenceIOR=t.iridescenceIOR),t.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessRange=t.iridescenceThicknessRange),t.transmission!==void 0&&(this.transmission=t.transmission),t.thickness!==void 0&&(this.thickness=t.thickness),t.attenuationDistance!==void 0&&(this.attenuationDistance=t.attenuationDistance),t.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(t.attenuationColor),t.anisotropy!==void 0&&(this.anisotropy=t.anisotropy),t.anisotropyRotation!==void 0&&(this.anisotropyRotation=t.anisotropyRotation),t.fog!==void 0&&(this.fog=t.fog),t.flatShading!==void 0&&(this.flatShading=t.flatShading),t.blending!==void 0&&(this.blending=t.blending),t.combine!==void 0&&(this.combine=t.combine),t.side!==void 0&&(this.side=t.side),t.shadowSide!==void 0&&(this.shadowSide=t.shadowSide),t.opacity!==void 0&&(this.opacity=t.opacity),t.transparent!==void 0&&(this.transparent=t.transparent),t.alphaTest!==void 0&&(this.alphaTest=t.alphaTest),t.alphaHash!==void 0&&(this.alphaHash=t.alphaHash),t.depthFunc!==void 0&&(this.depthFunc=t.depthFunc),t.depthTest!==void 0&&(this.depthTest=t.depthTest),t.depthWrite!==void 0&&(this.depthWrite=t.depthWrite),t.colorWrite!==void 0&&(this.colorWrite=t.colorWrite),t.clippingPlanes!==void 0&&(this.clippingPlanes=t.clippingPlanes.map(n=>new We().fromJSON(n))),t.clipIntersection!==void 0&&(this.clipIntersection=t.clipIntersection),t.clipShadows!==void 0&&(this.clipShadows=t.clipShadows),t.depthPacking!==void 0&&(this.depthPacking=t.depthPacking),t.blendSrc!==void 0&&(this.blendSrc=t.blendSrc),t.blendDst!==void 0&&(this.blendDst=t.blendDst),t.blendEquation!==void 0&&(this.blendEquation=t.blendEquation),t.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=t.blendSrcAlpha),t.blendDstAlpha!==void 0&&(this.blendDstAlpha=t.blendDstAlpha),t.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=t.blendEquationAlpha),t.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(t.blendColor),t.blendAlpha!==void 0&&(this.blendAlpha=t.blendAlpha),t.stencilWriteMask!==void 0&&(this.stencilWriteMask=t.stencilWriteMask),t.stencilFunc!==void 0&&(this.stencilFunc=t.stencilFunc),t.stencilRef!==void 0&&(this.stencilRef=t.stencilRef),t.stencilFuncMask!==void 0&&(this.stencilFuncMask=t.stencilFuncMask),t.stencilFail!==void 0&&(this.stencilFail=t.stencilFail),t.stencilZFail!==void 0&&(this.stencilZFail=t.stencilZFail),t.stencilZPass!==void 0&&(this.stencilZPass=t.stencilZPass),t.stencilWrite!==void 0&&(this.stencilWrite=t.stencilWrite),t.wireframe!==void 0&&(this.wireframe=t.wireframe),t.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=t.wireframeLinewidth),t.wireframeLinecap!==void 0&&(this.wireframeLinecap=t.wireframeLinecap),t.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=t.wireframeLinejoin),t.rotation!==void 0&&(this.rotation=t.rotation),t.linewidth!==void 0&&(this.linewidth=t.linewidth),t.linecap!==void 0&&(this.linecap=t.linecap),t.linejoin!==void 0&&(this.linejoin=t.linejoin),t.dashSize!==void 0&&(this.dashSize=t.dashSize),t.gapSize!==void 0&&(this.gapSize=t.gapSize),t.scale!==void 0&&(this.scale=t.scale),t.polygonOffset!==void 0&&(this.polygonOffset=t.polygonOffset),t.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=t.polygonOffsetFactor),t.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=t.polygonOffsetUnits),t.dithering!==void 0&&(this.dithering=t.dithering),t.alphaToCoverage!==void 0&&(this.alphaToCoverage=t.alphaToCoverage),t.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=t.premultipliedAlpha),t.forceSinglePass!==void 0&&(this.forceSinglePass=t.forceSinglePass),t.allowOverride!==void 0&&(this.allowOverride=t.allowOverride),t.visible!==void 0&&(this.visible=t.visible),t.toneMapped!==void 0&&(this.toneMapped=t.toneMapped),t.userData!==void 0&&(this.userData=t.userData),t.vertexColors!==void 0&&(typeof t.vertexColors=="number"?this.vertexColors=t.vertexColors>0:this.vertexColors=t.vertexColors),t.size!==void 0&&(this.size=t.size),t.sizeAttenuation!==void 0&&(this.sizeAttenuation=t.sizeAttenuation),t.map!==void 0&&(this.map=e[t.map]||null),t.matcap!==void 0&&(this.matcap=e[t.matcap]||null),t.alphaMap!==void 0&&(this.alphaMap=e[t.alphaMap]||null),t.bumpMap!==void 0&&(this.bumpMap=e[t.bumpMap]||null),t.bumpScale!==void 0&&(this.bumpScale=t.bumpScale),t.normalMap!==void 0&&(this.normalMap=e[t.normalMap]||null),t.normalMapType!==void 0&&(this.normalMapType=t.normalMapType),t.normalScale!==void 0){let n=t.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new mt().fromArray(n)}return t.displacementMap!==void 0&&(this.displacementMap=e[t.displacementMap]||null),t.displacementScale!==void 0&&(this.displacementScale=t.displacementScale),t.displacementBias!==void 0&&(this.displacementBias=t.displacementBias),t.roughnessMap!==void 0&&(this.roughnessMap=e[t.roughnessMap]||null),t.metalnessMap!==void 0&&(this.metalnessMap=e[t.metalnessMap]||null),t.emissiveMap!==void 0&&(this.emissiveMap=e[t.emissiveMap]||null),t.emissiveIntensity!==void 0&&(this.emissiveIntensity=t.emissiveIntensity),t.specularMap!==void 0&&(this.specularMap=e[t.specularMap]||null),t.specularIntensityMap!==void 0&&(this.specularIntensityMap=e[t.specularIntensityMap]||null),t.specularColorMap!==void 0&&(this.specularColorMap=e[t.specularColorMap]||null),t.envMap!==void 0&&(this.envMap=e[t.envMap]||null),t.envMapRotation!==void 0&&this.envMapRotation.fromArray(t.envMapRotation),t.envMapIntensity!==void 0&&(this.envMapIntensity=t.envMapIntensity),t.reflectivity!==void 0&&(this.reflectivity=t.reflectivity),t.refractionRatio!==void 0&&(this.refractionRatio=t.refractionRatio),t.lightMap!==void 0&&(this.lightMap=e[t.lightMap]||null),t.lightMapIntensity!==void 0&&(this.lightMapIntensity=t.lightMapIntensity),t.aoMap!==void 0&&(this.aoMap=e[t.aoMap]||null),t.aoMapIntensity!==void 0&&(this.aoMapIntensity=t.aoMapIntensity),t.gradientMap!==void 0&&(this.gradientMap=e[t.gradientMap]||null),t.clearcoatMap!==void 0&&(this.clearcoatMap=e[t.clearcoatMap]||null),t.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=e[t.clearcoatRoughnessMap]||null),t.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=e[t.clearcoatNormalMap]||null),t.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new mt().fromArray(t.clearcoatNormalScale)),t.iridescenceMap!==void 0&&(this.iridescenceMap=e[t.iridescenceMap]||null),t.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=e[t.iridescenceThicknessMap]||null),t.transmissionMap!==void 0&&(this.transmissionMap=e[t.transmissionMap]||null),t.thicknessMap!==void 0&&(this.thicknessMap=e[t.thicknessMap]||null),t.anisotropyMap!==void 0&&(this.anisotropyMap=e[t.anisotropyMap]||null),t.sheenColorMap!==void 0&&(this.sheenColorMap=e[t.sheenColorMap]||null),t.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=e[t.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.allowOverride=t.allowOverride,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}};var ii=new V,Il=new V,ro=new V,oo=new V,bi=class{constructor(t=new V,e=new V(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,ii)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=ii.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(ii.copy(this.origin).addScaledVector(this.direction,e),ii.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Il.copy(t).add(e).multiplyScalar(.5),ro.copy(e).sub(t).normalize(),oo.copy(this.origin).sub(Il);let r=t.distanceTo(e)*.5,o=-this.direction.dot(ro),a=oo.dot(this.direction),c=-oo.dot(ro),l=oo.lengthSq(),h=Math.abs(1-o*o),d,u,p,g;if(h>0)if(d=o*c-a,u=o*a-c,g=r*h,d>=0)if(u>=-g)if(u<=g){let v=1/h;d*=v,u*=v,p=d*(d+o*u+2*a)+u*(o*d+u+2*c)+l}else u=r,d=Math.max(0,-(o*u+a)),p=-d*d+u*(u+2*c)+l;else u=-r,d=Math.max(0,-(o*u+a)),p=-d*d+u*(u+2*c)+l;else u<=-g?(d=Math.max(0,-(-o*r+a)),u=d>0?-r:Math.min(Math.max(-r,-c),r),p=-d*d+u*(u+2*c)+l):u<=g?(d=0,u=Math.min(Math.max(-r,-c),r),p=u*(u+2*c)+l):(d=Math.max(0,-(o*r+a)),u=d>0?r:Math.min(Math.max(-r,-c),r),p=-d*d+u*(u+2*c)+l);else u=o>0?-r:r,d=Math.max(0,-(o*u+a)),p=-d*d+u*(u+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,d),s&&s.copy(Il).addScaledVector(ro,u),p}intersectSphere(t,e){if(t.radius<0)return null;ii.subVectors(t.center,this.origin);let n=ii.dot(this.direction),s=ii.dot(ii)-n*n,r=t.radius*t.radius;if(s>r)return null;let o=Math.sqrt(r-s),a=n-o,c=n+o;return c<0?null:a<0?this.at(c,e):this.at(a,e)}intersectsSphere(t){return t.radius<0?!1:this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,o,a,c,l=1/this.direction.x,h=1/this.direction.y,d=1/this.direction.z,u=this.origin;return l>=0?(n=(t.min.x-u.x)*l,s=(t.max.x-u.x)*l):(n=(t.max.x-u.x)*l,s=(t.min.x-u.x)*l),h>=0?(r=(t.min.y-u.y)*h,o=(t.max.y-u.y)*h):(r=(t.max.y-u.y)*h,o=(t.min.y-u.y)*h),n>o||r>s||((r>n||isNaN(n))&&(n=r),(o<s||isNaN(s))&&(s=o),d>=0?(a=(t.min.z-u.z)*d,c=(t.max.z-u.z)*d):(a=(t.max.z-u.z)*d,c=(t.min.z-u.z)*d),n>c||a>s)||((a>n||n!==n)&&(n=a),(c<s||s!==s)&&(s=c),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,ii)!==null}intersectTriangle(t,e,n,s,r){let o=this.origin,a=this.direction,c=a.x,l=a.y,h=a.z,d=t.x-o.x,u=t.y-o.y,p=t.z-o.z,g=e.x-o.x,v=e.y-o.y,m=e.z-o.z,f=n.x-o.x,w=n.y-o.y,I=n.z-o.z,x=Math.abs(c),M=Math.abs(l),A=Math.abs(h),N,y,R,k,Y,Z,it,G,et,nt,st,Q;if(x>=M&&x>=A?(R=c,Z=d,et=g,Q=f,c>=0?(N=l,y=h,k=u,Y=p,it=v,G=m,nt=w,st=I):(N=h,y=l,k=p,Y=u,it=m,G=v,nt=I,st=w)):M>=A?(R=l,Z=u,et=v,Q=w,l>=0?(N=h,y=c,k=p,Y=d,it=m,G=g,nt=I,st=f):(N=c,y=h,k=d,Y=p,it=g,G=m,nt=f,st=I)):(R=h,Z=p,et=m,Q=I,h>=0?(N=c,y=l,k=d,Y=u,it=g,G=v,nt=f,st=w):(N=l,y=c,k=u,Y=d,it=v,G=g,nt=w,st=f)),R===0)return null;let at=N/R,ct=y/R,ft=1/R,It=k-at*Z,Nt=Y-ct*Z,Xt=it-at*et,Wt=G-ct*et,qt=nt-at*Q,z=st-ct*Q,U=qt*Wt-z*Xt,C=It*z-Nt*qt,L=Xt*Nt-Wt*It;if(s){if(U<0||C<0||L<0)return null}else if((U<0||C<0||L<0)&&(U>0||C>0||L>0))return null;let B=U+C+L;if(B===0)return null;let tt=ft*(U*Z+C*et+L*Q);return(B>0?tt<0:tt>0)?null:this.at(tt/B,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},Ze=class extends Wn{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ie(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new oi,this.combine=rc,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}},dh=new we,Gi=new bi,ao=new qi,fh=new V,lo=new V,co=new V,ho=new V,Ll=new V,uo=new V,ph=new V,fo=new V,on=class extends Ye{constructor(t=new Le,e=new Ze){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,o=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let a=this.morphTargetInfluences;if(r&&a){uo.set(0,0,0);for(let c=0,l=r.length;c<l;c++){let h=a[c],d=r[c];h!==0&&(Ll.fromBufferAttribute(d,t),o?uo.addScaledVector(Ll,h):uo.addScaledVector(Ll.sub(e),h))}e.add(uo)}return e}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),ao.copy(n.boundingSphere),ao.applyMatrix4(r),Gi.copy(t.ray).recast(t.near),!(ao.containsPoint(Gi.origin)===!1&&(Gi.intersectSphere(ao,fh)===null||Gi.origin.distanceToSquared(fh)>(t.far-t.near)**2))&&(dh.copy(r).invert(),Gi.copy(t.ray).applyMatrix4(dh),!(n.boundingBox!==null&&Gi.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,Gi)))}_computeIntersections(t,e,n){let s,r=this.geometry,o=this.material,a=r.index,c=r.attributes.position,l=r.attributes.uv,h=r.attributes.uv1,d=r.attributes.normal,u=r.groups,p=r.drawRange;if(a!==null)if(Array.isArray(o))for(let g=0,v=u.length;g<v;g++){let m=u[g],f=o[m.materialIndex],w=Math.max(m.start,p.start),I=Math.min(a.count,Math.min(m.start+m.count,p.start+p.count));for(let x=w,M=I;x<M;x+=3){let A=a.getX(x),N=a.getX(x+1),y=a.getX(x+2);s=po(this,f,t,n,l,h,d,A,N,y),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{let g=Math.max(0,p.start),v=Math.min(a.count,p.start+p.count);for(let m=g,f=v;m<f;m+=3){let w=a.getX(m),I=a.getX(m+1),x=a.getX(m+2);s=po(this,o,t,n,l,h,d,w,I,x),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}else if(c!==void 0)if(Array.isArray(o))for(let g=0,v=u.length;g<v;g++){let m=u[g],f=o[m.materialIndex],w=Math.max(m.start,p.start),I=Math.min(c.count,Math.min(m.start+m.count,p.start+p.count));for(let x=w,M=I;x<M;x+=3){let A=x,N=x+1,y=x+2;s=po(this,f,t,n,l,h,d,A,N,y),s&&(s.faceIndex=Math.floor(x/3),s.face.materialIndex=m.materialIndex,e.push(s))}}else{let g=Math.max(0,p.start),v=Math.min(c.count,p.start+p.count);for(let m=g,f=v;m<f;m+=3){let w=m,I=m+1,x=m+2;s=po(this,o,t,n,l,h,d,w,I,x),s&&(s.faceIndex=Math.floor(m/3),e.push(s))}}}};function Qd(i,t,e,n,s,r,o,a){let c;if(t.side===sn?c=n.intersectTriangle(o,r,s,!0,a):c=n.intersectTriangle(s,r,o,t.side===Ni,a),c===null)return null;fo.copy(a),fo.applyMatrix4(i.matrixWorld);let l=e.ray.origin.distanceTo(fo);return l<e.near||l>e.far?null:{distance:l,point:fo.clone(),object:i}}function po(i,t,e,n,s,r,o,a,c,l){i.getVertexPosition(a,lo),i.getVertexPosition(c,co),i.getVertexPosition(l,ho);let h=Qd(i,t,e,n,lo,co,ho,ph);if(h){let d=new V;Si.getBarycoord(ph,lo,co,ho,d),s&&(h.uv=Si.getInterpolatedAttribute(s,a,c,l,d,new mt)),r&&(h.uv1=Si.getInterpolatedAttribute(r,a,c,l,d,new mt)),o&&(h.normal=Si.getInterpolatedAttribute(o,a,c,l,d,new V),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let u={a,b:c,c:l,normal:new V,materialIndex:0};Si.getNormal(lo,co,ho,u.normal),h.face=u,h.barycoord=d}return h}var ai=class extends nn{constructor(t=null,e=1,n=1,s,r,o,a,c,l=Ge,h=Ge,d,u){super(null,o,a,c,l,h,s,r,d,u),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Wi=new qi,tf=new mt(.5,.5),mo=new V,Is=class{constructor(t=new We,e=new We,n=new We,s=new We,r=new We,o=new We){this.planes=[t,e,n,s,r,o]}set(t,e,n,s,r,o){let a=this.planes;return a[0].copy(t),a[1].copy(e),a[2].copy(n),a[3].copy(s),a[4].copy(r),a[5].copy(o),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=Rn,n=!1){let s=this.planes,r=t.elements,o=r[0],a=r[1],c=r[2],l=r[3],h=r[4],d=r[5],u=r[6],p=r[7],g=r[8],v=r[9],m=r[10],f=r[11],w=r[12],I=r[13],x=r[14],M=r[15];if(s[0].setComponents(l-o,p-h,f-g,M-w).normalize(),s[1].setComponents(l+o,p+h,f+g,M+w).normalize(),s[2].setComponents(l+a,p+d,f+v,M+I).normalize(),s[3].setComponents(l-a,p-d,f-v,M-I).normalize(),n)s[4].setComponents(c,u,m,x).normalize(),s[5].setComponents(l-c,p-u,f-m,M-x).normalize();else if(s[4].setComponents(l-c,p-u,f-m,M-x).normalize(),e===Rn)s[5].setComponents(l+c,p+u,f+m,M+x).normalize();else if(e===Es)s[5].setComponents(c,u,m,x).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),Wi.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),Wi.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(Wi)}intersectsSprite(t){Wi.center.set(0,0,0);let e=tf.distanceTo(t.center);return Wi.radius=.7071067811865476+e,Wi.applyMatrix4(t.matrixWorld),this.intersectsSphere(Wi)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(mo.x=s.normal.x>0?t.max.x:t.min.x,mo.y=s.normal.y>0?t.max.y:t.min.y,mo.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(mo)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};var Ls=class extends Wn{constructor(t){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new ie(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.linewidth=t.linewidth,this.linecap=t.linecap,this.linejoin=t.linejoin,this.fog=t.fog,this}},Uo=new V,Fo=new V,mh=new we,er=new bi,go=new qi,Dl=new V,gh=new V,Oo=class extends Ye{constructor(t=new Le,e=new Ls){super(),this.isLine=!0,this.type="Line",this.geometry=t,this.material=e,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}computeLineDistances(){let t=this.geometry;if(t.index===null){let e=t.attributes.position,n=[0];for(let s=1,r=e.count;s<r;s++)Uo.fromBufferAttribute(e,s-1),Fo.fromBufferAttribute(e,s),n[s]=n[s-1],n[s]+=Uo.distanceTo(Fo);t.setAttribute("lineDistance",new fe(n,1))}else te("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(t){return t.intersectsObject(this)}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Line.threshold,o=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),go.copy(n.boundingSphere),go.applyMatrix4(s),go.radius+=r,t.ray.intersectsSphere(go)===!1)return;mh.copy(s).invert(),er.copy(t.ray).applyMatrix4(mh);let a=r/((this.scale.x+this.scale.y+this.scale.z)/3),c=a*a,l=this.isLineSegments?2:1,h=n.index,u=n.attributes.position;if(h!==null){let p=Math.max(0,o.start),g=Math.min(h.count,o.start+o.count);for(let v=p,m=g-1;v<m;v+=l){let f=h.getX(v),w=h.getX(v+1),I=_o(this,t,er,c,f,w,v);I&&e.push(I)}if(this.isLineLoop){let v=h.getX(g-1),m=h.getX(p),f=_o(this,t,er,c,v,m,g-1);f&&e.push(f)}}else{let p=Math.max(0,o.start),g=Math.min(u.count,o.start+o.count);for(let v=p,m=g-1;v<m;v+=l){let f=_o(this,t,er,c,v,v+1,v);f&&e.push(f)}if(this.isLineLoop){let v=_o(this,t,er,c,g-1,p,g-1);v&&e.push(v)}}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,o=s.length;r<o;r++){let a=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=r}}}}};function _o(i,t,e,n,s,r,o){let a=i.geometry.attributes.position;if(Uo.fromBufferAttribute(a,s),Fo.fromBufferAttribute(a,r),e.distanceSqToSegment(Uo,Fo,Dl,gh)>n)return;Dl.applyMatrix4(i.matrixWorld);let l=t.ray.origin.distanceTo(Dl);if(!(l<t.near||l>t.far))return{distance:l,point:gh.clone().applyMatrix4(i.matrixWorld),index:o,face:null,faceIndex:null,barycoord:null,object:i}}var pr=class extends Oo{constructor(t,e){super(t,e),this.isLineLoop=!0,this.type="LineLoop"}};var mr=class extends nn{constructor(t=[],e=Ui,n,s,r,o,a,c,l,h){super(t,e,n,s,r,o,a,c,l,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},Yi=class extends nn{constructor(t,e,n,s,r,o,a,c,l){super(t,e,n,s,r,o,a,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}};var Ei=class extends nn{constructor(t,e,n=Nn,s,r,o,a=Ge,c=Ge,l,h=Gn,d=1){if(h!==Gn&&h!==Fi)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");let u={width:t,height:e,depth:d};super(u,s,r,o,a,c,h,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.source=new As(Object.assign({},t.image)),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return e.compareFunction=this.compareFunction,e}},Bo=class extends Ei{constructor(t,e=Nn,n=Ui,s,r,o=Ge,a=Ge,c,l=Gn){let h={width:t,height:t,depth:1},d=[h,h,h,h,h,h];super(t,t,e,n,s,r,o,a,c,l),this.image=d,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(t){this.image=t}},gr=class extends nn{constructor(t=null){super(),this.sourceTexture=t,this.isExternalTexture=!0}copy(t){return super.copy(t),this.sourceTexture=t.sourceTexture,this}},Pn=class i extends Le{constructor(t=1,e=1,n=1,s=1,r=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:o};let a=this;s=Math.floor(s),r=Math.floor(r),o=Math.floor(o);let c=[],l=[],h=[],d=[],u=0,p=0;g("z","y","x",-1,-1,n,e,t,o,r,0),g("z","y","x",1,-1,n,e,-t,o,r,1),g("x","z","y",1,1,t,n,e,s,o,2),g("x","z","y",1,-1,t,n,-e,s,o,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(c),this.setAttribute("position",new fe(l,3)),this.setAttribute("normal",new fe(h,3)),this.setAttribute("uv",new fe(d,2));function g(v,m,f,w,I,x,M,A,N,y,R){let k=x/N,Y=M/y,Z=x/2,it=M/2,G=A/2,et=N+1,nt=y+1,st=0,Q=0,at=new V;for(let ct=0;ct<nt;ct++){let ft=ct*Y-it;for(let It=0;It<et;It++){let Nt=It*k-Z;at[v]=Nt*w,at[m]=ft*I,at[f]=G,l.push(at.x,at.y,at.z),at[v]=0,at[m]=0,at[f]=A>0?1:-1,h.push(at.x,at.y,at.z),d.push(It/N),d.push(1-ct/y),st+=1}}for(let ct=0;ct<y;ct++)for(let ft=0;ft<N;ft++){let It=u+ft+et*ct,Nt=u+ft+et*(ct+1),Xt=u+(ft+1)+et*(ct+1),Wt=u+(ft+1)+et*ct;c.push(It,Nt,Wt),c.push(Nt,Xt,Wt),Q+=6}a.addGroup(p,Q,R),p+=Q,u+=st}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};var ye=class i extends Le{constructor(t=1,e=1,n=1,s=32,r=1,o=!1,a=0,c=Math.PI*2){super(),this.type="CylinderGeometry",this.parameters={radiusTop:t,radiusBottom:e,height:n,radialSegments:s,heightSegments:r,openEnded:o,thetaStart:a,thetaLength:c};let l=this;s=Math.floor(s),r=Math.floor(r);let h=[],d=[],u=[],p=[],g=0,v=[],m=n/2,f=0;w(),o===!1&&(t>0&&I(!0),e>0&&I(!1)),this.setIndex(h),this.setAttribute("position",new fe(d,3)),this.setAttribute("normal",new fe(u,3)),this.setAttribute("uv",new fe(p,2));function w(){let x=new V,M=new V,A=0,N=(e-t)/n;for(let y=0;y<=r;y++){let R=[],k=y/r,Y=k*(e-t)+t;for(let Z=0;Z<=s;Z++){let it=Z/s,G=it*c+a,et=Math.sin(G),nt=Math.cos(G);M.x=Y*et,M.y=-k*n+m,M.z=Y*nt,d.push(M.x,M.y,M.z),x.set(et,N,nt).normalize(),u.push(x.x,x.y,x.z),p.push(it,1-k),R.push(g++)}v.push(R)}for(let y=0;y<s;y++)for(let R=0;R<r;R++){let k=v[R][y],Y=v[R+1][y],Z=v[R+1][y+1],it=v[R][y+1];(t>0||R!==0)&&(h.push(k,Y,it),A+=3),(e>0||R!==r-1)&&(h.push(Y,Z,it),A+=3)}l.addGroup(f,A,0),f+=A}function I(x){let M=g,A=new mt,N=new V,y=0,R=x===!0?t:e,k=x===!0?1:-1;for(let Z=1;Z<=s;Z++)d.push(0,m*k,0),u.push(0,k,0),p.push(.5,.5),g++;let Y=g;for(let Z=0;Z<=s;Z++){let G=Z/s*c+a,et=Math.cos(G),nt=Math.sin(G);N.x=R*nt,N.y=m*k,N.z=R*et,d.push(N.x,N.y,N.z),u.push(0,k,0),A.x=et*.5+.5,A.y=nt*.5*k+.5,p.push(A.x,A.y),g++}for(let Z=0;Z<s;Z++){let it=M+Z,G=Y+Z;x===!0?h.push(G,G+1,it):h.push(G+1,G,it),y+=3}l.addGroup(f,y,x===!0?1:2),f+=y}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radiusTop,t.radiusBottom,t.height,t.radialSegments,t.heightSegments,t.openEnded,t.thetaStart,t.thetaLength)}};var fn=class{constructor(){this.type="Curve",this.arcLengthDivisions=200,this.needsUpdate=!1,this.cacheArcLengths=null}getPoint(){te("Curve: .getPoint() not implemented.")}getPointAt(t,e){let n=this.getUtoTmapping(t);return this.getPoint(n,e)}getPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return e}getSpacedPoints(t=5){let e=[];for(let n=0;n<=t;n++)e.push(this.getPointAt(n/t));return e}getLength(){let t=this.getLengths();return t[t.length-1]}getLengths(t=this.arcLengthDivisions){if(this.cacheArcLengths&&this.cacheArcLengths.length===t+1&&!this.needsUpdate)return this.cacheArcLengths;this.needsUpdate=!1;let e=[],n,s=this.getPoint(0),r=0;e.push(0);for(let o=1;o<=t;o++)n=this.getPoint(o/t),r+=n.distanceTo(s),e.push(r),s=n;return this.cacheArcLengths=e,e}updateArcLengths(){this.needsUpdate=!0,this.getLengths()}getUtoTmapping(t,e=null){let n=this.getLengths(),s=0,r=n.length,o;e?o=e:o=t*n[r-1];let a=0,c=r-1,l;for(;a<=c;)if(s=Math.floor(a+(c-a)/2),l=n[s]-o,l<0)a=s+1;else if(l>0)c=s-1;else{c=s;break}if(s=c,n[s]===o)return s/(r-1);let h=n[s],u=n[s+1]-h,p=(o-h)/u;return(s+p)/(r-1)}getTangent(t,e){let s=t-1e-4,r=t+1e-4;s<0&&(s=0),r>1&&(r=1);let o=this.getPoint(s),a=this.getPoint(r),c=e||(o.isVector2?new mt:new V);return c.copy(a).sub(o).normalize(),c}getTangentAt(t,e){let n=this.getUtoTmapping(t);return this.getTangent(n,e)}computeFrenetFrames(t,e=!1){let n=new V,s=[],r=[],o=[],a=new V,c=new we;for(let p=0;p<=t;p++){let g=p/t;s[p]=this.getTangentAt(g,new V)}r[0]=new V,o[0]=new V;let l=Number.MAX_VALUE,h=Math.abs(s[0].x),d=Math.abs(s[0].y),u=Math.abs(s[0].z);h<=l&&(l=h,n.set(1,0,0)),d<=l&&(l=d,n.set(0,1,0)),u<=l&&n.set(0,0,1),a.crossVectors(s[0],n).normalize(),r[0].crossVectors(s[0],a),o[0].crossVectors(s[0],r[0]);for(let p=1;p<=t;p++){if(r[p]=r[p-1].clone(),o[p]=o[p-1].clone(),a.crossVectors(s[p-1],s[p]),a.length()>Number.EPSILON){a.normalize();let g=Math.acos(oe(s[p-1].dot(s[p]),-1,1));r[p].applyMatrix4(c.makeRotationAxis(a,g))}o[p].crossVectors(s[p],r[p])}if(e===!0){let p=Math.acos(oe(r[0].dot(r[t]),-1,1));p/=t,s[0].dot(a.crossVectors(r[0],r[t]))>0&&(p=-p);for(let g=1;g<=t;g++)r[g].applyMatrix4(c.makeRotationAxis(s[g],p*g)),o[g].crossVectors(s[g],r[g])}return{tangents:s,normals:r,binormals:o}}clone(){return new this.constructor().copy(this)}copy(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}toJSON(){let t={metadata:{version:4.7,type:"Curve",generator:"Curve.toJSON"}};return t.arcLengthDivisions=this.arcLengthDivisions,t.type=this.type,t}fromJSON(t){return this.arcLengthDivisions=t.arcLengthDivisions,this}},Ds=class extends fn{constructor(t=0,e=0,n=1,s=1,r=0,o=Math.PI*2,a=!1,c=0){super(),this.isEllipseCurve=!0,this.type="EllipseCurve",this.aX=t,this.aY=e,this.xRadius=n,this.yRadius=s,this.aStartAngle=r,this.aEndAngle=o,this.aClockwise=a,this.aRotation=c}getPoint(t,e=new mt){let n=e,s=Math.PI*2,r=this.aEndAngle-this.aStartAngle,o=Math.abs(r)<Number.EPSILON;for(;r<0;)r+=s;for(;r>s;)r-=s;r<Number.EPSILON&&(o?r=0:r=s),this.aClockwise===!0&&!o&&(r===s?r=-s:r=r-s);let a=this.aStartAngle+t*r,c=this.aX+this.xRadius*Math.cos(a),l=this.aY+this.yRadius*Math.sin(a);if(this.aRotation!==0){let h=Math.cos(this.aRotation),d=Math.sin(this.aRotation),u=c-this.aX,p=l-this.aY;c=u*h-p*d+this.aX,l=u*d+p*h+this.aY}return n.set(c,l)}copy(t){return super.copy(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}toJSON(){let t=super.toJSON();return t.aX=this.aX,t.aY=this.aY,t.xRadius=this.xRadius,t.yRadius=this.yRadius,t.aStartAngle=this.aStartAngle,t.aEndAngle=this.aEndAngle,t.aClockwise=this.aClockwise,t.aRotation=this.aRotation,t}fromJSON(t){return super.fromJSON(t),this.aX=t.aX,this.aY=t.aY,this.xRadius=t.xRadius,this.yRadius=t.yRadius,this.aStartAngle=t.aStartAngle,this.aEndAngle=t.aEndAngle,this.aClockwise=t.aClockwise,this.aRotation=t.aRotation,this}},zo=class extends Ds{constructor(t,e,n,s,r,o){super(t,e,n,n,s,r,o),this.isArcCurve=!0,this.type="ArcCurve"}};function bc(){let i=0,t=0,e=0,n=0;function s(r,o,a,c){i=r,t=a,e=-3*r+3*o-2*a-c,n=2*r-2*o+a+c}return{initCatmullRom:function(r,o,a,c,l){s(o,a,l*(a-r),l*(c-o))},initNonuniformCatmullRom:function(r,o,a,c,l,h,d){let u=(o-r)/l-(a-r)/(l+h)+(a-o)/h,p=(a-o)/h-(c-o)/(h+d)+(c-a)/d;u*=h,p*=h,s(o,a,u,p)},calc:function(r){let o=r*r,a=o*r;return i+t*r+e*o+n*a}}}var _h=new V,xh=new V,Nl=new bc,Ul=new bc,Fl=new bc,ko=class extends fn{constructor(t=[],e=!1,n="centripetal",s=.5){super(),this.isCatmullRomCurve3=!0,this.type="CatmullRomCurve3",this.points=t,this.closed=e,this.curveType=n,this.tension=s}getPoint(t,e=new V){let n=e,s=this.points,r=s.length,o=(r-(this.closed?0:1))*t,a=Math.floor(o),c=o-a;this.closed?a+=a>0?0:(Math.floor(Math.abs(a)/r)+1)*r:c===0&&a===r-1&&(a=r-2,c=1);let l,h;this.closed||a>0?l=s[(a-1)%r]:(xh.subVectors(s[0],s[1]).add(s[0]),l=xh);let d=s[a%r],u=s[(a+1)%r];if(this.closed||a+2<r?h=s[(a+2)%r]:(_h.subVectors(s[r-1],s[r-2]).add(s[r-1]),h=_h),this.curveType==="centripetal"||this.curveType==="chordal"){let p=this.curveType==="chordal"?.5:.25,g=Math.pow(l.distanceToSquared(d),p),v=Math.pow(d.distanceToSquared(u),p),m=Math.pow(u.distanceToSquared(h),p);v<1e-4&&(v=1),g<1e-4&&(g=v),m<1e-4&&(m=v),Nl.initNonuniformCatmullRom(l.x,d.x,u.x,h.x,g,v,m),Ul.initNonuniformCatmullRom(l.y,d.y,u.y,h.y,g,v,m),Fl.initNonuniformCatmullRom(l.z,d.z,u.z,h.z,g,v,m)}else this.curveType==="catmullrom"&&(Nl.initCatmullRom(l.x,d.x,u.x,h.x,this.tension),Ul.initCatmullRom(l.y,d.y,u.y,h.y,this.tension),Fl.initCatmullRom(l.z,d.z,u.z,h.z,this.tension));return n.set(Nl.calc(c),Ul.calc(c),Fl.calc(c)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(s.clone())}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let s=this.points[e];t.points.push(s.toArray())}return t.closed=this.closed,t.curveType=this.curveType,t.tension=this.tension,t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(new V().fromArray(s))}return this.closed=t.closed,this.curveType=t.curveType,this.tension=t.tension,this}};function yh(i,t,e,n,s){let r=(n-t)*.5,o=(s-e)*.5,a=i*i,c=i*a;return(2*e-2*n+r+o)*c+(-3*e+3*n-2*r-o)*a+r*i+e}function ef(i,t){let e=1-i;return e*e*t}function nf(i,t){return 2*(1-i)*i*t}function sf(i,t){return i*i*t}function rr(i,t,e,n){return ef(i,t)+nf(i,e)+sf(i,n)}function rf(i,t){let e=1-i;return e*e*e*t}function of(i,t){let e=1-i;return 3*e*e*i*t}function af(i,t){return 3*(1-i)*i*i*t}function lf(i,t){return i*i*i*t}function or(i,t,e,n,s){return rf(i,t)+of(i,e)+af(i,n)+lf(i,s)}var _r=class extends fn{constructor(t=new mt,e=new mt,n=new mt,s=new mt){super(),this.isCubicBezierCurve=!0,this.type="CubicBezierCurve",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new mt){let n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(or(t,s.x,r.x,o.x,a.x),or(t,s.y,r.y,o.y,a.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},Vo=class extends fn{constructor(t=new V,e=new V,n=new V,s=new V){super(),this.isCubicBezierCurve3=!0,this.type="CubicBezierCurve3",this.v0=t,this.v1=e,this.v2=n,this.v3=s}getPoint(t,e=new V){let n=e,s=this.v0,r=this.v1,o=this.v2,a=this.v3;return n.set(or(t,s.x,r.x,o.x,a.x),or(t,s.y,r.y,o.y,a.y),or(t,s.z,r.z,o.z,a.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this.v3.copy(t.v3),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t.v3=this.v3.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this.v3.fromArray(t.v3),this}},xr=class extends fn{constructor(t=new mt,e=new mt){super(),this.isLineCurve=!0,this.type="LineCurve",this.v1=t,this.v2=e}getPoint(t,e=new mt){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new mt){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Ho=class extends fn{constructor(t=new V,e=new V){super(),this.isLineCurve3=!0,this.type="LineCurve3",this.v1=t,this.v2=e}getPoint(t,e=new V){let n=e;return t===1?n.copy(this.v2):(n.copy(this.v2).sub(this.v1),n.multiplyScalar(t).add(this.v1)),n}getPointAt(t,e){return this.getPoint(t,e)}getTangent(t,e=new V){return e.subVectors(this.v2,this.v1).normalize()}getTangentAt(t,e){return this.getTangent(t,e)}copy(t){return super.copy(t),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},yr=class extends fn{constructor(t=new mt,e=new mt,n=new mt){super(),this.isQuadraticBezierCurve=!0,this.type="QuadraticBezierCurve",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new mt){let n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(rr(t,s.x,r.x,o.x),rr(t,s.y,r.y,o.y)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},Go=class extends fn{constructor(t=new V,e=new V,n=new V){super(),this.isQuadraticBezierCurve3=!0,this.type="QuadraticBezierCurve3",this.v0=t,this.v1=e,this.v2=n}getPoint(t,e=new V){let n=e,s=this.v0,r=this.v1,o=this.v2;return n.set(rr(t,s.x,r.x,o.x),rr(t,s.y,r.y,o.y),rr(t,s.z,r.z,o.z)),n}copy(t){return super.copy(t),this.v0.copy(t.v0),this.v1.copy(t.v1),this.v2.copy(t.v2),this}toJSON(){let t=super.toJSON();return t.v0=this.v0.toArray(),t.v1=this.v1.toArray(),t.v2=this.v2.toArray(),t}fromJSON(t){return super.fromJSON(t),this.v0.fromArray(t.v0),this.v1.fromArray(t.v1),this.v2.fromArray(t.v2),this}},vr=class extends fn{constructor(t=[]){super(),this.isSplineCurve=!0,this.type="SplineCurve",this.points=t}getPoint(t,e=new mt){let n=e,s=this.points,r=(s.length-1)*t,o=Math.floor(r),a=r-o,c=s[o===0?o:o-1],l=s[o],h=s[o>s.length-2?s.length-1:o+1],d=s[o>s.length-3?s.length-1:o+2];return n.set(yh(a,c.x,l.x,h.x,d.x),yh(a,c.y,l.y,h.y,d.y)),n}copy(t){super.copy(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(s.clone())}return this}toJSON(){let t=super.toJSON();t.points=[];for(let e=0,n=this.points.length;e<n;e++){let s=this.points[e];t.points.push(s.toArray())}return t}fromJSON(t){super.fromJSON(t),this.points=[];for(let e=0,n=t.points.length;e<n;e++){let s=t.points[e];this.points.push(new mt().fromArray(s))}return this}},Gl=Object.freeze({__proto__:null,ArcCurve:zo,CatmullRomCurve3:ko,CubicBezierCurve:_r,CubicBezierCurve3:Vo,EllipseCurve:Ds,LineCurve:xr,LineCurve3:Ho,QuadraticBezierCurve:yr,QuadraticBezierCurve3:Go,SplineCurve:vr}),Wo=class extends fn{constructor(){super(),this.type="CurvePath",this.curves=[],this.autoClose=!1}add(t){this.curves.push(t)}closePath(){let t=this.curves[0].getPoint(0),e=this.curves[this.curves.length-1].getPoint(1);if(!t.equals(e)){let n=t.isVector2===!0?"LineCurve":"LineCurve3";this.curves.push(new Gl[n](e,t))}return this}getPoint(t,e){let n=t*this.getLength(),s=this.getCurveLengths(),r=0;for(;r<s.length;){if(s[r]>=n){let o=s[r]-n,a=this.curves[r],c=a.getLength(),l=c===0?0:1-o/c;return a.getPointAt(l,e)}r++}return null}getLength(){let t=this.getCurveLengths();return t[t.length-1]}updateArcLengths(){this.needsUpdate=!0,this.cacheLengths=null,this.getCurveLengths()}getCurveLengths(){if(this.cacheLengths&&this.cacheLengths.length===this.curves.length)return this.cacheLengths;let t=[],e=0;for(let n=0,s=this.curves.length;n<s;n++)e+=this.curves[n].getLength(),t.push(e);return this.cacheLengths=t,t}getSpacedPoints(t=40){let e=[];for(let n=0;n<=t;n++)e.push(this.getPoint(n/t));return this.autoClose&&e.push(e[0]),e}getPoints(t=12){let e=[],n;for(let s=0,r=this.curves;s<r.length;s++){let o=r[s],a=o.isEllipseCurve?t*2:o.isLineCurve||o.isLineCurve3?1:o.isSplineCurve?t*o.points.length:t,c=o.getPoints(a);for(let l=0;l<c.length;l++){let h=c[l];n&&n.equals(h)||(e.push(h),n=h)}}return this.autoClose&&e.length>1&&!e[e.length-1].equals(e[0])&&e.push(e[0]),e}copy(t){super.copy(t),this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){let s=t.curves[e];this.curves.push(s.clone())}return this.autoClose=t.autoClose,this}toJSON(){let t=super.toJSON();t.autoClose=this.autoClose,t.curves=[];for(let e=0,n=this.curves.length;e<n;e++){let s=this.curves[e];t.curves.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.autoClose=t.autoClose,this.curves=[];for(let e=0,n=t.curves.length;e<n;e++){let s=t.curves[e];this.curves.push(new Gl[s.type]().fromJSON(s))}return this}},Xn=class extends Wo{constructor(t){super(),this.type="Path",this.currentPoint=new mt,t&&this.setFromPoints(t)}setFromPoints(t){this.moveTo(t[0].x,t[0].y);for(let e=1,n=t.length;e<n;e++)this.lineTo(t[e].x,t[e].y);return this}moveTo(t,e){return this.currentPoint.set(t,e),this}lineTo(t,e){let n=new xr(this.currentPoint.clone(),new mt(t,e));return this.curves.push(n),this.currentPoint.set(t,e),this}quadraticCurveTo(t,e,n,s){let r=new yr(this.currentPoint.clone(),new mt(t,e),new mt(n,s));return this.curves.push(r),this.currentPoint.set(n,s),this}bezierCurveTo(t,e,n,s,r,o){let a=new _r(this.currentPoint.clone(),new mt(t,e),new mt(n,s),new mt(r,o));return this.curves.push(a),this.currentPoint.set(r,o),this}splineThru(t){let e=[this.currentPoint.clone()].concat(t),n=new vr(e);return this.curves.push(n),this.currentPoint.copy(t[t.length-1]),this}arc(t,e,n,s,r,o){let a=this.currentPoint.x,c=this.currentPoint.y;return this.absarc(t+a,e+c,n,s,r,o),this}absarc(t,e,n,s,r,o){return this.absellipse(t,e,n,n,s,r,o),this}ellipse(t,e,n,s,r,o,a,c){let l=this.currentPoint.x,h=this.currentPoint.y;return this.absellipse(t+l,e+h,n,s,r,o,a,c),this}absellipse(t,e,n,s,r,o,a,c){let l=new Ds(t,e,n,s,r,o,a,c);if(this.curves.length>0){let d=l.getPoint(0);d.equals(this.currentPoint)||this.lineTo(d.x,d.y)}this.curves.push(l);let h=l.getPoint(1);return this.currentPoint.copy(h),this}copy(t){return super.copy(t),this.currentPoint.copy(t.currentPoint),this}toJSON(){let t=super.toJSON();return t.currentPoint=this.currentPoint.toArray(),t}fromJSON(t){return super.fromJSON(t),this.currentPoint.fromArray(t.currentPoint),this}},wi=class extends Xn{constructor(t){super(t),this.uuid=Qi(),this.type="Shape",this.holes=[]}getPointsHoles(t){let e=[];for(let n=0,s=this.holes.length;n<s;n++)e[n]=this.holes[n].getPoints(t);return e}extractPoints(t){return{shape:this.getPoints(t),holes:this.getPointsHoles(t)}}copy(t){super.copy(t),this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){let s=t.holes[e];this.holes.push(s.clone())}return this}toJSON(){let t=super.toJSON();t.uuid=this.uuid,t.holes=[];for(let e=0,n=this.holes.length;e<n;e++){let s=this.holes[e];t.holes.push(s.toJSON())}return t}fromJSON(t){super.fromJSON(t),this.uuid=t.uuid,this.holes=[];for(let e=0,n=t.holes.length;e<n;e++){let s=t.holes[e];this.holes.push(new Xn().fromJSON(s))}return this}};function cf(i,t,e=2){let n=t&&t.length,s=n?t[0]*e:i.length,r=xu(i,0,s,e,!0),o=[];if(!r||r.next===r.prev)return o;let a,c,l;if(n&&(r=pf(i,t,r,e)),i.length>80*e){a=i[0],c=i[1];let h=a,d=c;for(let u=e;u<s;u+=e){let p=i[u],g=i[u+1];p<a&&(a=p),g<c&&(c=g),p>h&&(h=p),g>d&&(d=g)}l=Math.max(h-a,d-c),l=l!==0?32767/l:0}return Sr(r,o,e,a,c,l,0),o}function xu(i,t,e,n,s){let r;if(s===wf(i,t,e,n)>0)for(let o=t;o<e;o+=n)r=vh(o/n|0,i[o],i[o+1],r);else for(let o=e-n;o>=t;o-=n)r=vh(o/n|0,i[o],i[o+1],r);return r&&Ns(r,r.next)&&(br(r),r=r.next),r}function Zi(i,t){if(!i)return i;t||(t=i);let e=i,n;do if(n=!1,!e.steiner&&(Ns(e,e.next)||Ce(e.prev,e,e.next)===0)){if(br(e),e=t=e.prev,e===e.next)break;n=!0}else e=e.next;while(n||e!==t);return t}function Sr(i,t,e,n,s,r,o){if(!i)return;!o&&r&&yf(i,n,s,r);let a=i;for(;i.prev!==i.next;){let c=i.prev,l=i.next;if(r?uf(i,n,s,r):hf(i)){t.push(c.i,i.i,l.i),br(i),i=l.next,a=l.next;continue}if(i=l,i===a){o?o===1?(i=df(Zi(i),t),Sr(i,t,e,n,s,r,2)):o===2&&ff(i,t,e,n,s,r):Sr(Zi(i),t,e,n,s,r,1);break}}}function hf(i){let t=i.prev,e=i,n=i.next;if(Ce(t,e,n)>=0)return!1;let s=t.x,r=e.x,o=n.x,a=t.y,c=e.y,l=n.y,h=Math.min(s,r,o),d=Math.min(a,c,l),u=Math.max(s,r,o),p=Math.max(a,c,l),g=n.next;for(;g!==t;){if(g.x>=h&&g.x<=u&&g.y>=d&&g.y<=p&&nr(s,a,r,c,o,l,g.x,g.y)&&Ce(g.prev,g,g.next)>=0)return!1;g=g.next}return!0}function uf(i,t,e,n){let s=i.prev,r=i,o=i.next;if(Ce(s,r,o)>=0)return!1;let a=s.x,c=r.x,l=o.x,h=s.y,d=r.y,u=o.y,p=Math.min(a,c,l),g=Math.min(h,d,u),v=Math.max(a,c,l),m=Math.max(h,d,u),f=Wl(p,g,t,e,n),w=Wl(v,m,t,e,n),I=i.prevZ,x=i.nextZ;for(;I&&I.z>=f&&x&&x.z<=w;){if(I.x>=p&&I.x<=v&&I.y>=g&&I.y<=m&&I!==s&&I!==o&&nr(a,h,c,d,l,u,I.x,I.y)&&Ce(I.prev,I,I.next)>=0||(I=I.prevZ,x.x>=p&&x.x<=v&&x.y>=g&&x.y<=m&&x!==s&&x!==o&&nr(a,h,c,d,l,u,x.x,x.y)&&Ce(x.prev,x,x.next)>=0))return!1;x=x.nextZ}for(;I&&I.z>=f;){if(I.x>=p&&I.x<=v&&I.y>=g&&I.y<=m&&I!==s&&I!==o&&nr(a,h,c,d,l,u,I.x,I.y)&&Ce(I.prev,I,I.next)>=0)return!1;I=I.prevZ}for(;x&&x.z<=w;){if(x.x>=p&&x.x<=v&&x.y>=g&&x.y<=m&&x!==s&&x!==o&&nr(a,h,c,d,l,u,x.x,x.y)&&Ce(x.prev,x,x.next)>=0)return!1;x=x.nextZ}return!0}function df(i,t){let e=i;do{let n=e.prev,s=e.next.next;!Ns(n,s)&&vu(n,e,e.next,s)&&Mr(n,s)&&Mr(s,n)&&(t.push(n.i,e.i,s.i),br(e),br(e.next),e=i=s),e=e.next}while(e!==i);return Zi(e)}function ff(i,t,e,n,s,r){let o=i;do{let a=o.next.next;for(;a!==o.prev;){if(o.i!==a.i&&Mf(o,a)){let c=Su(o,a);o=Zi(o,o.next),c=Zi(c,c.next),Sr(o,t,e,n,s,r,0),Sr(c,t,e,n,s,r,0);return}a=a.next}o=o.next}while(o!==i)}function pf(i,t,e,n){let s=[];for(let r=0,o=t.length;r<o;r++){let a=t[r]*n,c=r<o-1?t[r+1]*n:i.length,l=xu(i,a,c,n,!1);l===l.next&&(l.steiner=!0),s.push(Sf(l))}s.sort(mf);for(let r=0;r<s.length;r++)e=gf(s[r],e);return e}function mf(i,t){let e=i.x-t.x;if(e===0&&(e=i.y-t.y,e===0)){let n=(i.next.y-i.y)/(i.next.x-i.x),s=(t.next.y-t.y)/(t.next.x-t.x);e=n-s}return e}function gf(i,t){let e=_f(i,t);if(!e)return t;let n=Su(e,i);return Zi(n,n.next),Zi(e,e.next)}function _f(i,t){let e=t,n=i.x,s=i.y,r=-1/0,o;if(Ns(i,e))return e;do{if(Ns(i,e.next))return e.next;if(s<=e.y&&s>=e.next.y&&e.next.y!==e.y){let d=e.x+(s-e.y)*(e.next.x-e.x)/(e.next.y-e.y);if(d<=n&&d>r&&(r=d,o=e.x<e.next.x?e:e.next,d===n))return o}e=e.next}while(e!==t);if(!o)return null;let a=o,c=o.x,l=o.y,h=1/0;e=o;do{if(n>=e.x&&e.x>=c&&n!==e.x&&yu(s<l?n:r,s,c,l,s<l?r:n,s,e.x,e.y)){let d=Math.abs(s-e.y)/(n-e.x);Mr(e,i)&&(d<h||d===h&&(e.x>o.x||e.x===o.x&&xf(o,e)))&&(o=e,h=d)}e=e.next}while(e!==a);return o}function xf(i,t){return Ce(i.prev,i,t.prev)<0&&Ce(t.next,i,i.next)<0}function yf(i,t,e,n){let s=i;do s.z===0&&(s.z=Wl(s.x,s.y,t,e,n)),s.prevZ=s.prev,s.nextZ=s.next,s=s.next;while(s!==i);s.prevZ.nextZ=null,s.prevZ=null,vf(s)}function vf(i){let t,e=1;do{let n=i,s;i=null;let r=null;for(t=0;n;){t++;let o=n,a=0;for(let l=0;l<e&&(a++,o=o.nextZ,!!o);l++);let c=e;for(;a>0||c>0&&o;)a!==0&&(c===0||!o||n.z<=o.z)?(s=n,n=n.nextZ,a--):(s=o,o=o.nextZ,c--),r?r.nextZ=s:i=s,s.prevZ=r,r=s;n=o}r.nextZ=null,e*=2}while(t>1);return i}function Wl(i,t,e,n,s){return i=(i-e)*s|0,t=(t-n)*s|0,i=(i|i<<8)&16711935,i=(i|i<<4)&252645135,i=(i|i<<2)&858993459,i=(i|i<<1)&1431655765,t=(t|t<<8)&16711935,t=(t|t<<4)&252645135,t=(t|t<<2)&858993459,t=(t|t<<1)&1431655765,i|t<<1}function Sf(i){let t=i,e=i;do(t.x<e.x||t.x===e.x&&t.y<e.y)&&(e=t),t=t.next;while(t!==i);return e}function yu(i,t,e,n,s,r,o,a){return(s-o)*(t-a)>=(i-o)*(r-a)&&(i-o)*(n-a)>=(e-o)*(t-a)&&(e-o)*(r-a)>=(s-o)*(n-a)}function nr(i,t,e,n,s,r,o,a){return!(i===o&&t===a)&&yu(i,t,e,n,s,r,o,a)}function Mf(i,t){return i.next.i!==t.i&&i.prev.i!==t.i&&!bf(i,t)&&(Mr(i,t)&&Mr(t,i)&&Ef(i,t)&&(Ce(i.prev,i,t.prev)||Ce(i,t.prev,t))||Ns(i,t)&&Ce(i.prev,i,i.next)>0&&Ce(t.prev,t,t.next)>0)}function Ce(i,t,e){return(t.y-i.y)*(e.x-t.x)-(t.x-i.x)*(e.y-t.y)}function Ns(i,t){return i.x===t.x&&i.y===t.y}function vu(i,t,e,n){let s=yo(Ce(i,t,e)),r=yo(Ce(i,t,n)),o=yo(Ce(e,n,i)),a=yo(Ce(e,n,t));return!!(s!==r&&o!==a||s===0&&xo(i,e,t)||r===0&&xo(i,n,t)||o===0&&xo(e,i,n)||a===0&&xo(e,t,n))}function xo(i,t,e){return t.x<=Math.max(i.x,e.x)&&t.x>=Math.min(i.x,e.x)&&t.y<=Math.max(i.y,e.y)&&t.y>=Math.min(i.y,e.y)}function yo(i){return i>0?1:i<0?-1:0}function bf(i,t){let e=i;do{if(e.i!==i.i&&e.next.i!==i.i&&e.i!==t.i&&e.next.i!==t.i&&vu(e,e.next,i,t))return!0;e=e.next}while(e!==i);return!1}function Mr(i,t){return Ce(i.prev,i,i.next)<0?Ce(i,t,i.next)>=0&&Ce(i,i.prev,t)>=0:Ce(i,t,i.prev)<0||Ce(i,i.next,t)<0}function Ef(i,t){let e=i,n=!1,s=(i.x+t.x)/2,r=(i.y+t.y)/2;do e.y>r!=e.next.y>r&&e.next.y!==e.y&&s<(e.next.x-e.x)*(r-e.y)/(e.next.y-e.y)+e.x&&(n=!n),e=e.next;while(e!==i);return n}function Su(i,t){let e=Xl(i.i,i.x,i.y),n=Xl(t.i,t.x,t.y),s=i.next,r=t.prev;return i.next=t,t.prev=i,e.next=s,s.prev=e,n.next=e,e.prev=n,r.next=n,n.prev=r,n}function vh(i,t,e,n){let s=Xl(i,t,e);return n?(s.next=n.next,s.prev=n,n.next.prev=s,n.next=s):(s.prev=s,s.next=s),s}function br(i){i.next.prev=i.prev,i.prev.next=i.next,i.prevZ&&(i.prevZ.nextZ=i.nextZ),i.nextZ&&(i.nextZ.prevZ=i.prevZ)}function Xl(i,t,e){return{i,x:t,y:e,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function wf(i,t,e,n){let s=0;for(let r=t,o=e-n;r<e;r+=n)s+=(i[o]-i[r])*(i[r+1]+i[o+1]),o=r;return s}var ql=class{static triangulate(t,e,n=2){return cf(t,e,n)}},Vn=class i{static area(t){let e=t.length,n=0;for(let s=e-1,r=0;r<e;s=r++)n+=t[s].x*t[r].y-t[r].x*t[s].y;return n*.5}static isClockWise(t){return i.area(t)<0}static triangulateShape(t,e){let n=[],s=[],r=[];Sh(t),Mh(n,t);let o=t.length;e.forEach(Sh);for(let c=0;c<e.length;c++)s.push(o),o+=e[c].length,Mh(n,e[c]);let a=ql.triangulate(n,s);for(let c=0;c<a.length;c+=3)r.push(a.slice(c,c+3));return r}};function Sh(i){let t=i.length;t>2&&i[t-1].equals(i[0])&&i.pop()}function Mh(i,t){for(let e=0;e<t.length;e++)i.push(t[e].x),i.push(t[e].y)}var Us=class i extends Le{constructor(t=new wi([new mt(.5,.5),new mt(-.5,.5),new mt(-.5,-.5),new mt(.5,-.5)]),e={}){super(),this.type="ExtrudeGeometry",this.parameters={shapes:t,options:e},t=Array.isArray(t)?t:[t];let n=this,s=[],r=[];for(let a=0,c=t.length;a<c;a++){let l=t[a];o(l)}this.setAttribute("position",new fe(s,3)),this.setAttribute("uv",new fe(r,2)),this.computeVertexNormals();function o(a){let c=[],l=e.curveSegments!==void 0?e.curveSegments:12,h=e.steps!==void 0?e.steps:1,d=e.depth!==void 0?e.depth:1,u=e.bevelEnabled!==void 0?e.bevelEnabled:!0,p=e.bevelThickness!==void 0?e.bevelThickness:.2,g=e.bevelSize!==void 0?e.bevelSize:p-.1,v=e.bevelOffset!==void 0?e.bevelOffset:0,m=e.bevelSegments!==void 0?e.bevelSegments:3,f=e.extrudePath,w=e.UVGenerator!==void 0?e.UVGenerator:Tf,I,x=!1,M,A,N,y;if(f){I=f.getSpacedPoints(h),x=!0,u=!1;let T=f.isCatmullRomCurve3?f.closed:!1;M=f.computeFrenetFrames(h,T),A=new V,N=new V,y=new V}u||(m=0,p=0,g=0,v=0);let R=a.extractPoints(l),k=R.shape,Y=R.holes;if(!Vn.isClockWise(k)){k=k.reverse();for(let T=0,X=Y.length;T<X;T++){let F=Y[T];Vn.isClockWise(F)&&(Y[T]=F.reverse())}}function it(T){let F=10000000000000001e-36,K=T[0];for(let j=1;j<=T.length;j++){let gt=j%T.length,bt=T[gt],wt=bt.x-K.x,J=bt.y-K.y,S=wt*wt+J*J,Ut=Math.max(Math.abs(bt.x),Math.abs(bt.y),Math.abs(K.x),Math.abs(K.y)),Ot=F*Ut*Ut;if(S<=Ot){T.splice(gt,1),j--;continue}K=bt}}it(k),Y.forEach(it);let G=Y.length,et=k;for(let T=0;T<G;T++){let X=Y[T];k=k.concat(X)}function nt(T,X,F){return X||ne("ExtrudeGeometry: vec does not exist"),T.clone().addScaledVector(X,F)}let st=k.length;function Q(T,X,F){let K,j,gt,bt=T.x-X.x,wt=T.y-X.y,J=F.x-T.x,S=F.y-T.y,Ut=bt*bt+wt*wt,Ot=bt*S-wt*J;if(Math.abs(Ot)>Number.EPSILON){let b=Math.sqrt(Ut),_=Math.sqrt(J*J+S*S),W=X.x-wt/b,rt=X.y+bt/b,pt=F.x-S/_,Rt=F.y+J/_,P=((pt-W)*S-(Rt-rt)*J)/(bt*S-wt*J);K=W+bt*P-T.x,j=rt+wt*P-T.y;let D=K*K+j*j;if(D<=2)return new mt(K,j);gt=Math.sqrt(D/2)}else{let b=!1;bt>Number.EPSILON?J>Number.EPSILON&&(b=!0):bt<-Number.EPSILON?J<-Number.EPSILON&&(b=!0):Math.sign(wt)===Math.sign(S)&&(b=!0),b?(K=-wt,j=bt,gt=Math.sqrt(Ut)):(K=bt,j=wt,gt=Math.sqrt(Ut/2))}return new mt(K/gt,j/gt)}let at=[];for(let T=0,X=et.length,F=X-1,K=T+1;T<X;T++,F++,K++)F===X&&(F=0),K===X&&(K=0),at[T]=Q(et[T],et[F],et[K]);let ct=[],ft,It=at.concat();for(let T=0,X=G;T<X;T++){let F=Y[T];ft=[];for(let K=0,j=F.length,gt=j-1,bt=K+1;K<j;K++,gt++,bt++)gt===j&&(gt=0),bt===j&&(bt=0),ft[K]=Q(F[K],F[gt],F[bt]);ct.push(ft),It=It.concat(ft)}let Nt;if(m===0)Nt=Vn.triangulateShape(et,Y);else{let T=[],X=[];for(let F=0;F<m;F++){let K=F/m,j=p*Math.cos(K*Math.PI/2),gt=g*Math.sin(K*Math.PI/2)+v;for(let bt=0,wt=et.length;bt<wt;bt++){let J=nt(et[bt],at[bt],gt);C(J.x,J.y,-j),K===0&&T.push(J)}for(let bt=0,wt=G;bt<wt;bt++){let J=Y[bt];ft=ct[bt];let S=[];for(let Ut=0,Ot=J.length;Ut<Ot;Ut++){let b=nt(J[Ut],ft[Ut],gt);C(b.x,b.y,-j),K===0&&S.push(b)}K===0&&X.push(S)}}Nt=Vn.triangulateShape(T,X)}let Xt=Nt.length,Wt=g+v;for(let T=0;T<st;T++){let X=u?nt(k[T],It[T],Wt):k[T];x?(N.copy(M.normals[0]).multiplyScalar(X.x),A.copy(M.binormals[0]).multiplyScalar(X.y),y.copy(I[0]).add(N).add(A),C(y.x,y.y,y.z)):C(X.x,X.y,0)}for(let T=1;T<=h;T++)for(let X=0;X<st;X++){let F=u?nt(k[X],It[X],Wt):k[X];x?(N.copy(M.normals[T]).multiplyScalar(F.x),A.copy(M.binormals[T]).multiplyScalar(F.y),y.copy(I[T]).add(N).add(A),C(y.x,y.y,y.z)):C(F.x,F.y,d/h*T)}for(let T=m-1;T>=0;T--){let X=T/m,F=p*Math.cos(X*Math.PI/2),K=g*Math.sin(X*Math.PI/2)+v;for(let j=0,gt=et.length;j<gt;j++){let bt=nt(et[j],at[j],K);C(bt.x,bt.y,d+F)}for(let j=0,gt=Y.length;j<gt;j++){let bt=Y[j];ft=ct[j];for(let wt=0,J=bt.length;wt<J;wt++){let S=nt(bt[wt],ft[wt],K);x?C(S.x,S.y+I[h-1].y,I[h-1].x+F):C(S.x,S.y,d+F)}}}qt(),z();function qt(){let T=s.length/3;if(u){let X=0,F=st*X;for(let K=0;K<Xt;K++){let j=Nt[K];L(j[2]+F,j[1]+F,j[0]+F)}X=h+m*2,F=st*X;for(let K=0;K<Xt;K++){let j=Nt[K];L(j[0]+F,j[1]+F,j[2]+F)}}else{for(let X=0;X<Xt;X++){let F=Nt[X];L(F[2],F[1],F[0])}for(let X=0;X<Xt;X++){let F=Nt[X];L(F[0]+st*h,F[1]+st*h,F[2]+st*h)}}n.addGroup(T,s.length/3-T,0)}function z(){let T=s.length/3,X=0;U(et,X),X+=et.length;for(let F=0,K=Y.length;F<K;F++){let j=Y[F];U(j,X),X+=j.length}n.addGroup(T,s.length/3-T,1)}function U(T,X){let F=T.length;for(;--F>=0;){let K=F,j=F-1;j<0&&(j=T.length-1);for(let gt=0,bt=h+m*2;gt<bt;gt++){let wt=st*gt,J=st*(gt+1),S=X+K+wt,Ut=X+j+wt,Ot=X+j+J,b=X+K+J;B(S,Ut,Ot,b)}}}function C(T,X,F){c.push(T),c.push(X),c.push(F)}function L(T,X,F){tt(T),tt(X),tt(F);let K=s.length/3,j=w.generateTopUV(n,s,K-3,K-2,K-1);yt(j[0]),yt(j[1]),yt(j[2])}function B(T,X,F,K){tt(T),tt(X),tt(K),tt(X),tt(F),tt(K);let j=s.length/3,gt=w.generateSideWallUV(n,s,j-6,j-3,j-2,j-1);yt(gt[0]),yt(gt[1]),yt(gt[3]),yt(gt[1]),yt(gt[2]),yt(gt[3])}function tt(T){s.push(c[T*3+0]),s.push(c[T*3+1]),s.push(c[T*3+2])}function yt(T){r.push(T.x),r.push(T.y)}}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}toJSON(){let t=super.toJSON(),e=this.parameters.shapes,n=this.parameters.options;return Af(e,n,t)}static fromJSON(t,e){let n=[];for(let r=0,o=t.shapes.length;r<o;r++){let a=e[t.shapes[r]];n.push(a)}let s=t.options.extrudePath;return s!==void 0&&(t.options.extrudePath=new Gl[s.type]().fromJSON(s)),new i(n,t.options)}},Tf={generateTopUV:function(i,t,e,n,s){let r=t[e*3],o=t[e*3+1],a=t[n*3],c=t[n*3+1],l=t[s*3],h=t[s*3+1];return[new mt(r,o),new mt(a,c),new mt(l,h)]},generateSideWallUV:function(i,t,e,n,s,r){let o=t[e*3],a=t[e*3+1],c=t[e*3+2],l=t[n*3],h=t[n*3+1],d=t[n*3+2],u=t[s*3],p=t[s*3+1],g=t[s*3+2],v=t[r*3],m=t[r*3+1],f=t[r*3+2];return Math.abs(a-h)<Math.abs(o-l)?[new mt(o,1-c),new mt(l,1-d),new mt(u,1-g),new mt(v,1-f)]:[new mt(a,1-c),new mt(h,1-d),new mt(p,1-g),new mt(m,1-f)]}};function Af(i,t,e){if(e.shapes=[],Array.isArray(i))for(let n=0,s=i.length;n<s;n++){let r=i[n];e.shapes.push(r.uuid)}else e.shapes.push(i.uuid);return e.options=Object.assign({},t),t.extrudePath!==void 0&&(e.options.extrudePath=t.extrudePath.toJSON()),e}var Er=class i extends Le{constructor(t=[new mt(0,-.5),new mt(.5,0),new mt(0,.5)],e=12,n=0,s=Math.PI*2){super(),this.type="LatheGeometry",this.parameters={points:t,segments:e,phiStart:n,phiLength:s},e=Math.floor(e),s=oe(s,0,Math.PI*2);let r=[],o=[],a=[],c=[],l=[],h=1/e,d=new V,u=new mt,p=new V,g=new V,v=new V,m=0,f=0;for(let w=0;w<=t.length-1;w++)switch(w){case 0:m=t[w+1].x-t[w].x,f=t[w+1].y-t[w].y,p.x=f*1,p.y=-m,p.z=f*0,v.copy(p),p.normalize(),c.push(p.x,p.y,p.z);break;case t.length-1:c.push(v.x,v.y,v.z);break;default:m=t[w+1].x-t[w].x,f=t[w+1].y-t[w].y,p.x=f*1,p.y=-m,p.z=f*0,g.copy(p),p.x+=v.x,p.y+=v.y,p.z+=v.z,p.normalize(),c.push(p.x,p.y,p.z),v.copy(g)}for(let w=0;w<=e;w++){let I=n+w*h*s,x=Math.sin(I),M=Math.cos(I);for(let A=0;A<=t.length-1;A++){d.x=t[A].x*x,d.y=t[A].y,d.z=t[A].x*M,o.push(d.x,d.y,d.z),u.x=w/e,u.y=A/(t.length-1),a.push(u.x,u.y);let N=c[3*A+0]*x,y=c[3*A+1],R=c[3*A+0]*M;l.push(N,y,R)}}for(let w=0;w<e;w++)for(let I=0;I<t.length-1;I++){let x=I+w*t.length,M=x,A=x+t.length,N=x+t.length+1,y=x+1;r.push(M,A,y),r.push(N,y,A)}this.setIndex(r),this.setAttribute("position",new fe(o,3)),this.setAttribute("uv",new fe(a,2)),this.setAttribute("normal",new fe(l,3))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.points,t.segments,t.phiStart,t.phiLength)}};var In=class i extends Le{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,o=e/2,a=Math.floor(n),c=Math.floor(s),l=a+1,h=c+1,d=t/a,u=e/c,p=[],g=[],v=[],m=[];for(let f=0;f<h;f++){let w=f*u-o;for(let I=0;I<l;I++){let x=I*d-r;g.push(x,-w,0),v.push(0,0,1),m.push(I/a),m.push(1-f/c)}}for(let f=0;f<c;f++)for(let w=0;w<a;w++){let I=w+l*f,x=w+l*(f+1),M=w+1+l*(f+1),A=w+1+l*f;p.push(I,x,A),p.push(x,M,A)}this.setIndex(p),this.setAttribute("position",new fe(g,3)),this.setAttribute("normal",new fe(v,3)),this.setAttribute("uv",new fe(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}},wr=class i extends Le{constructor(t=.5,e=1,n=32,s=1,r=0,o=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:t,outerRadius:e,thetaSegments:n,phiSegments:s,thetaStart:r,thetaLength:o},n=Math.max(3,n),s=Math.max(1,s);let a=[],c=[],l=[],h=[],d=t,u=(e-t)/s,p=new V,g=new mt;for(let v=0;v<=s;v++){for(let m=0;m<=n;m++){let f=r+m/n*o;p.x=d*Math.cos(f),p.y=d*Math.sin(f),c.push(p.x,p.y,p.z),l.push(0,0,1),g.x=(p.x/e+1)/2,g.y=(p.y/e+1)/2,h.push(g.x,g.y)}d+=u}for(let v=0;v<s;v++){let m=v*(n+1);for(let f=0;f<n;f++){let w=f+m,I=w,x=w+n+1,M=w+n+2,A=w+1;a.push(I,x,A),a.push(x,M,A)}}this.setIndex(a),this.setAttribute("position",new fe(c,3)),this.setAttribute("normal",new fe(l,3)),this.setAttribute("uv",new fe(h,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.innerRadius,t.outerRadius,t.thetaSegments,t.phiSegments,t.thetaStart,t.thetaLength)}};var li=class i extends Le{constructor(t=1,e=32,n=16,s=0,r=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:t,widthSegments:e,heightSegments:n,phiStart:s,phiLength:r,thetaStart:o,thetaLength:a},e=Math.max(3,Math.floor(e)),n=Math.max(2,Math.floor(n));let c=Math.min(o+a,Math.PI),l=0,h=[],d=new V,u=new V,p=[],g=[],v=[],m=[];for(let f=0;f<=n;f++){let w=[],I=f/n,x=o+I*a,M=t*Math.cos(x),A=Math.sqrt(t*t-M*M),N=0;f===0&&o===0?N=.5/e:f===n&&c===Math.PI&&(N=-.5/e);for(let y=0;y<=e;y++){let R=y/e,k=s+R*r;d.x=-A*Math.cos(k),d.y=M,d.z=A*Math.sin(k),g.push(d.x,d.y,d.z),u.copy(d).normalize(),v.push(u.x,u.y,u.z),m.push(R+N,1-I),w.push(l++)}h.push(w)}for(let f=0;f<n;f++)for(let w=0;w<e;w++){let I=h[f][w+1],x=h[f][w],M=h[f+1][w],A=h[f+1][w+1];(f!==0||o>0)&&p.push(I,x,A),(f!==n-1||c<Math.PI)&&p.push(x,M,A)}this.setIndex(p),this.setAttribute("position",new fe(g,3)),this.setAttribute("normal",new fe(v,3)),this.setAttribute("uv",new fe(m,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.widthSegments,t.heightSegments,t.phiStart,t.phiLength,t.thetaStart,t.thetaLength)}};var ci=class i extends Le{constructor(t=1,e=.4,n=12,s=48,r=Math.PI*2,o=0,a=Math.PI*2){super(),this.type="TorusGeometry",this.parameters={radius:t,tube:e,radialSegments:n,tubularSegments:s,arc:r,thetaStart:o,thetaLength:a},n=Math.floor(n),s=Math.floor(s);let c=[],l=[],h=[],d=[],u=new V,p=new V,g=new V;for(let v=0;v<=n;v++){let m=o+v/n*a;for(let f=0;f<=s;f++){let w=f/s*r;p.x=(t+e*Math.cos(m))*Math.cos(w),p.y=(t+e*Math.cos(m))*Math.sin(w),p.z=e*Math.sin(m),l.push(p.x,p.y,p.z),u.x=t*Math.cos(w),u.y=t*Math.sin(w),g.subVectors(p,u).normalize(),h.push(g.x,g.y,g.z),d.push(f/s),d.push(v/n)}}for(let v=1;v<=n;v++)for(let m=1;m<=s;m++){let f=(s+1)*v+m-1,w=(s+1)*(v-1)+m-1,I=(s+1)*(v-1)+m,x=(s+1)*v+m;c.push(f,w,x),c.push(w,I,x)}this.setIndex(c),this.setAttribute("position",new fe(l,3)),this.setAttribute("normal",new fe(h,3)),this.setAttribute("uv",new fe(d,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.radius,t.tube,t.radialSegments,t.tubularSegments,t.arc,t.thetaStart,t.thetaLength)}};var Fs=class extends Wn{constructor(t){super(),this.isShadowMaterial=!0,this.type="ShadowMaterial",this.color=new ie(0),this.transparent=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.fog=t.fog,this}};function ts(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];if(bh(s))s.isRenderTargetTexture?(te("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone();else if(Array.isArray(s))if(bh(s[0])){let r=[];for(let o=0,a=s.length;o<a;o++)r[o]=s[o].clone();t[e][n]=r}else t[e][n]=s.slice();else t[e][n]=s}}return t}function je(i){let t={};for(let e=0;e<i.length;e++){let n=ts(i[e]);for(let s in n)t[s]=n[s]}return t}function bh(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function Rf(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function Ec(i){let t=i.getRenderTarget();return t===null?i.outputColorSpace:t.isXRRenderTarget===!0?t.texture.colorSpace:de.workingColorSpace}var Mu={clone:ts,merge:je},Cf=\`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}\`,Pf=\`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}\`,pn=class extends Wn{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Cf,this.fragmentShader=Pf,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=ts(t.uniforms),this.uniformsGroups=Rf(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this.defaultAttributeValues=Object.assign({},t.defaultAttributeValues),this.index0AttributeName=t.index0AttributeName,this.uniformsNeedUpdate=t.uniformsNeedUpdate,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let o=this.uniforms[s].value;o&&o.isTexture?e.uniforms[s]={type:"t",value:o.toJSON(t).uuid}:o&&o.isColor?e.uniforms[s]={type:"c",value:o.getHex()}:o&&o.isVector2?e.uniforms[s]={type:"v2",value:o.toArray()}:o&&o.isVector3?e.uniforms[s]={type:"v3",value:o.toArray()}:o&&o.isVector4?e.uniforms[s]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?e.uniforms[s]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?e.uniforms[s]={type:"m4",value:o.toArray()}:e.uniforms[s]={value:o}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}fromJSON(t,e){if(super.fromJSON(t,e),t.uniforms!==void 0)for(let n in t.uniforms){let s=t.uniforms[n];switch(this.uniforms[n]={},s.type){case"t":this.uniforms[n].value=e[s.value]||null;break;case"c":this.uniforms[n].value=new ie().setHex(s.value);break;case"v2":this.uniforms[n].value=new mt().fromArray(s.value);break;case"v3":this.uniforms[n].value=new V().fromArray(s.value);break;case"v4":this.uniforms[n].value=new Re().fromArray(s.value);break;case"m3":this.uniforms[n].value=new Qt().fromArray(s.value);break;case"m4":this.uniforms[n].value=new we().fromArray(s.value);break;default:this.uniforms[n].value=s.value}}if(t.defines!==void 0&&(this.defines=t.defines),t.vertexShader!==void 0&&(this.vertexShader=t.vertexShader),t.fragmentShader!==void 0&&(this.fragmentShader=t.fragmentShader),t.glslVersion!==void 0&&(this.glslVersion=t.glslVersion),t.extensions!==void 0)for(let n in t.extensions)this.extensions[n]=t.extensions[n];return t.lights!==void 0&&(this.lights=t.lights),t.clipping!==void 0&&(this.clipping=t.clipping),this}},Xo=class extends pn{constructor(t){super(t),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}},Os=class extends Wn{constructor(t){super(),this.isMeshStandardMaterial=!0,this.type="MeshStandardMaterial",this.defines={STANDARD:""},this.color=new ie(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ie(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=Wa,this.normalScale=new mt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new oi,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.defines={STANDARD:""},this.color.copy(t.color),this.roughness=t.roughness,this.metalness=t.metalness,this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.emissive.copy(t.emissive),this.emissiveMap=t.emissiveMap,this.emissiveIntensity=t.emissiveIntensity,this.bumpMap=t.bumpMap,this.bumpScale=t.bumpScale,this.normalMap=t.normalMap,this.normalMapType=t.normalMapType,this.normalScale.copy(t.normalScale),this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.roughnessMap=t.roughnessMap,this.metalnessMap=t.metalnessMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.envMapIntensity=t.envMapIntensity,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.flatShading=t.flatShading,this.fog=t.fog,this}},Tr=class extends Os{constructor(t){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new mt(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return oe(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(e){this.ior=(1+.4*e)/(1-.4*e)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new ie(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new ie(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new ie(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._dispersion=0,this._iridescence=0,this._retroreflectivity=0,this._sheen=0,this._transmission=0,this.setValues(t)}get anisotropy(){return this._anisotropy}set anisotropy(t){this._anisotropy>0!=t>0&&this.version++,this._anisotropy=t}get clearcoat(){return this._clearcoat}set clearcoat(t){this._clearcoat>0!=t>0&&this.version++,this._clearcoat=t}get iridescence(){return this._iridescence}set iridescence(t){this._iridescence>0!=t>0&&this.version++,this._iridescence=t}get dispersion(){return this._dispersion}set dispersion(t){this._dispersion>0!=t>0&&this.version++,this._dispersion=t}get retroreflectivity(){return this._retroreflectivity}set retroreflectivity(t){this._retroreflectivity>0!=t>0&&this.version++,this._retroreflectivity=t}get sheen(){return this._sheen}set sheen(t){this._sheen>0!=t>0&&this.version++,this._sheen=t}get transmission(){return this._transmission}set transmission(t){this._transmission>0!=t>0&&this.version++,this._transmission=t}copy(t){return super.copy(t),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=t.anisotropy,this.anisotropyRotation=t.anisotropyRotation,this.anisotropyMap=t.anisotropyMap,this.clearcoat=t.clearcoat,this.clearcoatMap=t.clearcoatMap,this.clearcoatRoughness=t.clearcoatRoughness,this.clearcoatRoughnessMap=t.clearcoatRoughnessMap,this.clearcoatNormalMap=t.clearcoatNormalMap,this.clearcoatNormalScale.copy(t.clearcoatNormalScale),this.dispersion=t.dispersion,this.ior=t.ior,this.iridescence=t.iridescence,this.iridescenceMap=t.iridescenceMap,this.iridescenceIOR=t.iridescenceIOR,this.iridescenceThicknessRange=[...t.iridescenceThicknessRange],this.iridescenceThicknessMap=t.iridescenceThicknessMap,this.retroreflectivity=t.retroreflectivity,this.sheen=t.sheen,this.sheenColor.copy(t.sheenColor),this.sheenColorMap=t.sheenColorMap,this.sheenRoughness=t.sheenRoughness,this.sheenRoughnessMap=t.sheenRoughnessMap,this.transmission=t.transmission,this.transmissionMap=t.transmissionMap,this.thickness=t.thickness,this.thicknessMap=t.thicknessMap,this.attenuationDistance=t.attenuationDistance,this.attenuationColor.copy(t.attenuationColor),this.specularIntensity=t.specularIntensity,this.specularIntensityMap=t.specularIntensityMap,this.specularColor.copy(t.specularColor),this.specularColorMap=t.specularColorMap,this}};var qo=class extends Wn{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=iu,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},Yo=class extends Wn{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}};function _s(i,t){return!i||i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}function Ol(i){return i!==void 0&&i.inTangents!==void 0&&i.outTangents!==void 0}var Ti=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let o;e:{i:if(!(t<s)){for(let a=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===a)break;if(r=s,s=e[++n],t<s)break t}o=e.length;break e}if(!(t>=r)){let a=e[1];t<a&&(n=2,r=a);for(let c=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===c)break;if(s=r,r=e[--n-1],t>=r)break t}o=n,n=0;break e}break n}for(;n<o;){let a=n+o>>>1;t<e[a]?o=a:n=a+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let o=0;o!==s;++o)e[o]=n[r+o];return e}interpolate_(){throw new Error("THREE.Interpolant: Call to abstract method.")}intervalChanged_(){}},Zo=class extends Ti{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:kl,endingEnd:kl}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,o=t+1,a=s[r],c=s[o];if(a===void 0)switch(this.getSettings_().endingStart){case Vl:r=t,a=2*e-n;break;case Hl:r=s.length-2,a=e+s[r]-s[r+1];break;default:r=t,a=n}if(c===void 0)switch(this.getSettings_().endingEnd){case Vl:o=t,c=2*n-e;break;case Hl:o=1,c=n+s[1]-s[0];break;default:o=t-1,c=e}let l=(n-e)*.5,h=this.valueSize;this._weightPrev=l/(e-a),this._weightNext=l/(c-n),this._offsetPrev=r*h,this._offsetNext=o*h}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=t*a,l=c-a,h=this._offsetPrev,d=this._offsetNext,u=this._weightPrev,p=this._weightNext,g=(n-e)/(s-e),v=g*g,m=v*g,f=-u*m+2*u*v-u*g,w=(1+u)*m+(-1.5-2*u)*v+(-.5+u)*g+1,I=(-1-p)*m+(1.5+p)*v+.5*g,x=p*m-p*v;for(let M=0;M!==a;++M)r[M]=f*o[h+M]+w*o[l+M]+I*o[c+M]+x*o[d+M];return r}},Jo=class extends Ti{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=t*a,l=c-a,h=(n-e)/(s-e),d=1-h;for(let u=0;u!==a;++u)r[u]=o[l+u]*d+o[c+u]*h;return r}},Ko=class extends Ti{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},$o=class extends Ti{interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=t*a,l=c-a,h=this.inTangents,d=this.outTangents;if(!h||!d){let g=(n-e)/(s-e),v=1-g;for(let m=0;m!==a;++m)r[m]=o[l+m]*v+o[c+m]*g;return r}let u=a*2,p=t-1;for(let g=0;g!==a;++g){let v=o[l+g],m=o[c+g],f=p*u+g*2,w=d[f],I=d[f+1],x=t*u+g*2,M=h[x],A=h[x+1],N=Lf(n,e,w,M,s);r[g]=bu(N,v,I,A,m)}return r}};function bu(i,t,e,n,s){let r=1-i;return r*r*r*t+3*r*r*i*e+3*r*i*i*n+i*i*i*s}function If(i,t,e,n,s){let r=1-i;return 3*r*r*(e-t)+6*r*i*(n-e)+3*i*i*(s-n)}function Lf(i,t,e,n,s){let r=(i-t)/(s-t);for(let o=0;o<8;o++){let a=bu(r,t,e,n,s)-i;if(Math.abs(a)<1e-10)break;let c=If(r,t,e,n,s);if(Math.abs(c)<1e-10)break;r=Math.max(0,Math.min(1,r-a/c))}return r}var mn=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=_s(e,this.TimeBufferType),this.values=_s(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:_s(t.times,Array),values:_s(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s),Ol(t.settings)&&(n.settings={inTangents:_s(t.settings.inTangents,Array),outTangents:_s(t.settings.outTangents,Array)})}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new Ko(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new Jo(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new Zo(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodBezier(t){let e=new $o(this.times,this.values,this.getValueSize(),t);return this.settings&&(e.inTangents=this.settings.inTangents,e.outTangents=this.settings.outTangents),e}setInterpolation(t){let e;switch(t){case ar:e=this.InterpolantFactoryMethodDiscrete;break;case Io:e=this.InterpolantFactoryMethodLinear;break;case Mo:e=this.InterpolantFactoryMethodSmooth;break;case zl:e=this.InterpolantFactoryMethodBezier;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return te("KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return ar;case this.InterpolantFactoryMethodLinear:return Io;case this.InterpolantFactoryMethodSmooth:return Mo;case this.InterpolantFactoryMethodBezier:return zl}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t;Ol(this.settings)&&(Eh(this.settings.inTangents,t),Eh(this.settings.outTangents,t))}return this}trim(t,e){let n=this.times,s=n.length,r=0,o=s-1;for(;r!==s&&n[r]<t;)++r;for(;o!==-1&&n[o]>e;)--o;if(++o,r!==0||o!==s){r>=o&&(o=Math.max(o,1),r=o-1);let a=this.getValueSize();this.times=n.slice(r,o),this.values=this.values.slice(r*a,o*a)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(ne("KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(ne("KeyframeTrack: Track is empty.",this),t=!1);let o=null;for(let a=0;a!==r;a++){let c=n[a];if(typeof c=="number"&&isNaN(c)){ne("KeyframeTrack: Time is not a valid number.",this,a,c),t=!1;break}if(o!==null&&o>c){ne("KeyframeTrack: Out of order keys.",this,a,c,o),t=!1;break}o=c}if(s!==void 0&&vd(s))for(let a=0,c=s.length;a!==c;++a){let l=s[a];if(isNaN(l)){ne("KeyframeTrack: Value is not a valid number.",this,a,l),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===Mo,r=t.length-1,o=1;for(let a=1;a<r;++a){let c=!1,l=t[a],h=t[a+1];if(l!==h&&(a!==1||l!==t[0]))if(s)c=!0;else{let d=a*n,u=d-n,p=d+n;for(let g=0;g!==n;++g){let v=e[d+g];if(v!==e[u+g]||v!==e[p+g]){c=!0;break}}}if(c){if(a!==o){t[o]=t[a];let d=a*n,u=o*n;for(let p=0;p!==n;++p)e[u+p]=e[d+p]}++o}}if(r>0){t[o]=t[r];for(let a=r*n,c=o*n,l=0;l!==n;++l)e[c+l]=e[a+l];++o}return o!==t.length?(this.times=t.slice(0,o),this.values=e.slice(0,o*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,Ol(this.settings)&&(s.settings={inTangents:this.settings.inTangents.slice(),outTangents:this.settings.outTangents.slice()}),s}};function Eh(i,t){for(let e=0,n=i.length;e!==n;e+=2)i[e]*=t}mn.prototype.ValueTypeName="";mn.prototype.TimeBufferType=Float32Array;mn.prototype.ValueBufferType=Float32Array;mn.prototype.DefaultInterpolation=Io;var Ai=class extends mn{constructor(t,e,n){super(t,e,n)}};Ai.prototype.ValueTypeName="bool";Ai.prototype.ValueBufferType=Array;Ai.prototype.DefaultInterpolation=ar;Ai.prototype.InterpolantFactoryMethodLinear=void 0;Ai.prototype.InterpolantFactoryMethodSmooth=void 0;var jo=class extends mn{constructor(t,e,n,s){super(t,e,n,s)}};jo.prototype.ValueTypeName="color";var Qo=class extends mn{constructor(t,e,n,s){super(t,e,n,s)}};Qo.prototype.ValueTypeName="number";var ta=class extends Ti{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,o=this.sampleValues,a=this.valueSize,c=(n-e)/(s-e),l=t*a;for(let h=l+a;l!==h;l+=4)dn.slerpFlat(r,0,o,l-a,o,l,c);return r}},Ar=class extends mn{constructor(t,e,n,s){super(t,e,n,s)}InterpolantFactoryMethodLinear(t){return new ta(this.times,this.values,this.getValueSize(),t)}};Ar.prototype.ValueTypeName="quaternion";Ar.prototype.InterpolantFactoryMethodSmooth=void 0;var Ri=class extends mn{constructor(t,e,n){super(t,e,n)}};Ri.prototype.ValueTypeName="string";Ri.prototype.ValueBufferType=Array;Ri.prototype.DefaultInterpolation=ar;Ri.prototype.InterpolantFactoryMethodLinear=void 0;Ri.prototype.InterpolantFactoryMethodSmooth=void 0;var ea=class extends mn{constructor(t,e,n,s){super(t,e,n,s)}};ea.prototype.ValueTypeName="vector";var Yl={enabled:!1,files:{},add:function(i,t){this.enabled!==!1&&(wh(i)||(this.files[i]=t))},get:function(i){if(this.enabled!==!1&&!wh(i))return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};function wh(i){try{let t=i.slice(i.indexOf(":")+1);return new URL(t).protocol==="blob:"}catch{return!1}}var na=class{constructor(t,e,n){let s=this,r=!1,o=0,a=0,c,l=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this._abortController=null,this.itemStart=function(h){a++,r===!1&&s.onStart!==void 0&&s.onStart(h,o,a),r=!0},this.itemEnd=function(h){o++,s.onProgress!==void 0&&s.onProgress(h,o,a),o===a&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return h=h.normalize("NFC"),c?c(h):h},this.setURLModifier=function(h){return c=h,this},this.addHandler=function(h,d){return l.push(h,d),this},this.removeHandler=function(h){let d=l.indexOf(h);return d!==-1&&l.splice(d,2),this},this.getHandler=function(h){for(let d=0,u=l.length;d<u;d+=2){let p=l[d],g=l[d+1];if(p.global&&(p.lastIndex=0),p.test(h))return g}return null},this.abort=function(){return this.abortController.abort(),this._abortController=null,this}}get abortController(){return this._abortController||(this._abortController=new AbortController),this._abortController}},Eu=new na,Ji=class{constructor(t){this.manager=t!==void 0?t:Eu,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}abort(){return this}};Ji.DEFAULT_MATERIAL_NAME="__DEFAULT";var si={},Zl=class extends Error{constructor(t,e){super(t),this.response=e}},Rr=class extends Ji{constructor(t){super(t),this.mimeType="",this.responseType="",this._abortController=new AbortController}load(t,e,n,s){t===void 0&&(t=""),this.path!==void 0&&(t=this.path+t),t=this.manager.resolveURL(t);let r=Yl.get(\`file:\${t}\`);if(r!==void 0){this.manager.itemStart(t),setTimeout(()=>{e&&e(r),this.manager.itemEnd(t)},0);return}if(si[t]!==void 0){si[t].push({onLoad:e,onProgress:n,onError:s});return}si[t]=[],si[t].push({onLoad:e,onProgress:n,onError:s});let o=new Request(t,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin",signal:typeof AbortSignal.any=="function"?AbortSignal.any([this._abortController.signal,this.manager.abortController.signal]):this._abortController.signal}),a=this.mimeType,c=this.responseType;fetch(o).then(l=>{if(l.status===200||l.status===0){if(l.status===0&&te("FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||l.body===void 0||l.body.getReader===void 0)return l;let h=si[t],d=l.body.getReader(),u=l.headers.get("X-File-Size")||l.headers.get("Content-Length"),p=u?parseInt(u):0,g=p!==0,v=0,m=new ReadableStream({start(f){w();function w(){d.read().then(({done:I,value:x})=>{if(I)f.close();else{v+=x.byteLength;let M=new ProgressEvent("progress",{lengthComputable:g,loaded:v,total:p});for(let A=0,N=h.length;A<N;A++){let y=h[A];y.onProgress&&y.onProgress(M)}f.enqueue(x),w()}},I=>{f.error(I)})}}});return new Response(m)}else throw new Zl(\`fetch for "\${l.url}" responded with \${l.status}: \${l.statusText}\`,l)}).then(l=>{switch(c){case"arraybuffer":return l.arrayBuffer();case"blob":return l.blob();case"document":return l.text().then(h=>new DOMParser().parseFromString(h,a));case"json":return l.json();default:if(a==="")return l.text();{let d=/charset="?([^;"\\s]*)"?/i.exec(a),u=d&&d[1]?d[1].toLowerCase():void 0,p=new TextDecoder(u);return l.arrayBuffer().then(g=>p.decode(g))}}}).then(l=>{Yl.add(\`file:\${t}\`,l);let h=si[t];delete si[t];for(let d=0,u=h.length;d<u;d++){let p=h[d];p.onLoad&&p.onLoad(l)}}).catch(l=>{let h=si[t];if(h===void 0)throw this.manager.itemError(t),l;delete si[t];for(let d=0,u=h.length;d<u;d++){let p=h[d];p.onError&&p.onError(l)}this.manager.itemError(t)}).finally(()=>{this.manager.itemEnd(t)}),this.manager.itemStart(t)}setResponseType(t){return this.responseType=t,this}setMimeType(t){return this.mimeType=t,this}abort(){return this._abortController.abort(),this._abortController=new AbortController,this}};var Bs=class extends Ye{constructor(t,e=1){super(),this.isLight=!0,this.type="Light",this.color=new ie(t),this.intensity=e}copy(t,e){return super.copy(t,e),this.color.copy(t.color),this.intensity=t.intensity,this}toJSON(t){let e=super.toJSON(t);return e.object.color=this.color.getHex(),e.object.intensity=this.intensity,e}},zs=class extends Bs{constructor(t,e,n){super(t,n),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Ye.DEFAULT_UP),this.updateMatrix(),this.groundColor=new ie(e)}copy(t,e){return super.copy(t,e),this.groundColor.copy(t.groundColor),this}toJSON(t){let e=super.toJSON(t);return e.object.groundColor=this.groundColor.getHex(),e}},Bl=new we,Th=new V,Ah=new V,Cr=class{constructor(t){this.camera=t,this.intensity=1,this.bias=0,this.biasNode=null,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new mt(512,512),this.mapType=an,this.map=null,this.mapPass=null,this.matrix=new we,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new Is,this._frameExtents=new mt(1,1),this._viewportCount=1,this._viewports=[new Re(0,0,1,1)]}getViewportCount(){return this._viewportCount}getCamera(){return this.camera}getFrustum(){return this._frustum}updateMatrices(t){let e=this.camera;Th.setFromMatrixPosition(t.matrixWorld),e.position.copy(Th),Ah.setFromMatrixPosition(t.target.matrixWorld),e.lookAt(Ah),e.updateMatrixWorld(),this._updateMatrix(e,this.matrix,this._frustum)}_updateMatrix(t,e,n,s){Bl.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),n.setFromProjectionMatrix(Bl,t.coordinateSystem,t.reversedDepth);let r=this._frameExtents,o=s?s.z/r.x:1,a=s?s.w/r.y:1,c=s?s.x/r.x:0,l=s?s.y/r.y:0;t.coordinateSystem===Es||t.reversedDepth?e.set(.5*o,0,0,.5*o+c,0,.5*a,0,.5*a+l,0,0,1,0,0,0,0,1):e.set(.5*o,0,0,.5*o+c,0,.5*a,0,.5*a+l,0,0,.5,.5,0,0,0,1),e.multiply(Bl)}getViewport(t){return this._viewports[t]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(t){return this.camera=t.camera.clone(),this.intensity=t.intensity,this.bias=t.bias,this.radius=t.radius,this.autoUpdate=t.autoUpdate,this.needsUpdate=t.needsUpdate,this.normalBias=t.normalBias,this.blurSamples=t.blurSamples,this.mapSize.copy(t.mapSize),this.biasNode=t.biasNode,this}clone(){return new this.constructor().copy(this)}toJSON(){let t={};return t.intensity=this.intensity,t.bias=this.bias,t.normalBias=this.normalBias,t.radius=this.radius,t.blurSamples=this.blurSamples,t.mapSize=this.mapSize.toArray(),t.camera=this.camera.toJSON(!1).object,delete t.camera.matrix,t}},vo=new V,So=new dn,kn=new V,Pr=class extends Ye{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new we,this.projectionMatrix=new we,this.projectionMatrixInverse=new we,this.coordinateSystem=Rn,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorld.decompose(vo,So,kn),kn.x===1&&kn.y===1&&kn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(vo,So,kn.set(1,1,1)).invert()}updateWorldMatrix(t,e,n=!1){super.updateWorldMatrix(t,e,n),this.matrixWorld.decompose(vo,So,kn),kn.x===1&&kn.y===1&&kn.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(vo,So,kn.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}},vi=new V,Rh=new mt,Ch=new mt,Xe=class extends Pr{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Ts*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(ir*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Ts*2*Math.atan(Math.tan(ir*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){vi.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(vi.x,vi.y).multiplyScalar(-t/vi.z),vi.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(vi.x,vi.y).multiplyScalar(-t/vi.z)}getViewSize(t,e){return this.getViewBounds(t,Rh,Ch),e.subVectors(Ch,Rh)}setViewOffset(t,e,n,s,r,o){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(ir*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,o=this.view;if(this.view!==null&&this.view.enabled){let c=o.fullWidth,l=o.fullHeight;r+=o.offsetX*s/c,e-=o.offsetY*n/l,s*=o.width/c,n*=o.height/l}let a=this.filmOffset;a!==0&&(r+=t*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}};var Jl=class extends Cr{constructor(){super(new Xe(90,1,.5,500)),this.isPointLightShadow=!0}},Ir=class extends Bs{constructor(t,e,n=0,s=2){super(t,e),this.isPointLight=!0,this.type="PointLight",this.distance=n,this.decay=s,this.shadow=new Jl}get power(){return this.intensity*4*Math.PI}set power(t){this.intensity=t/(4*Math.PI)}dispose(){super.dispose(),this.shadow.dispose()}copy(t,e){return super.copy(t,e),this.distance=t.distance,this.decay=t.decay,this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.distance=this.distance,e.object.decay=this.decay,e.object.shadow=this.shadow.toJSON(),e}},Ci=class extends Pr{constructor(t=-1,e=1,n=1,s=-1,r=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=o,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,o=n+t,a=s+e,c=s-e;if(this.view!==null&&this.view.enabled){let l=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=l*this.view.offsetX,o=r+l*this.view.width,a-=h*this.view.offsetY,c=a-h*this.view.height}this.projectionMatrix.makeOrthographic(r,o,a,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},Kl=class extends Cr{constructor(){super(new Ci(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}},Pi=class extends Bs{constructor(t,e){super(t,e),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Ye.DEFAULT_UP),this.updateMatrix(),this.target=new Ye,this.shadow=new Kl}dispose(){super.dispose(),this.shadow.dispose()}copy(t){return super.copy(t),this.target=t.target.clone(),this.shadow=t.shadow.clone(),this}toJSON(t){let e=super.toJSON(t);return e.object.shadow=this.shadow.toJSON(),e.object.target=this.target.uuid,e}};var xs=-90,ys=1,ia=class extends Ye{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new Xe(xs,ys,t,e);s.layers=this.layers,this.add(s);let r=new Xe(xs,ys,t,e);r.layers=this.layers,this.add(r);let o=new Xe(xs,ys,t,e);o.layers=this.layers,this.add(o);let a=new Xe(xs,ys,t,e);a.layers=this.layers,this.add(a);let c=new Xe(xs,ys,t,e);c.layers=this.layers,this.add(c);let l=new Xe(xs,ys,t,e);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,o,a,c]=e;for(let l of e)this.remove(l);if(t===Rn)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(t===Es)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let l of e)this.add(l),l.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,o,a,c,l,h]=this.children,d=t.getRenderTarget(),u=t.getActiveCubeFace(),p=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;let v=n.texture.generateMipmaps;n.texture.generateMipmaps=!1;let m=!1;t.isWebGLRenderer===!0?m=t.state.buffers.depth.getReversed():m=t.reversedDepthBuffer,t.setRenderTarget(n,0,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,r),t.setRenderTarget(n,1,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,o),t.setRenderTarget(n,2,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,a),t.setRenderTarget(n,3,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,c),t.setRenderTarget(n,4,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,l),n.texture.generateMipmaps=v,t.setRenderTarget(n,5,s),m&&t.autoClear===!1&&t.clearDepth(),t.render(e,h),t.setRenderTarget(d,u,p),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},sa=class extends Xe{constructor(t=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=t}};var wc="\\\\[\\\\]\\\\.:\\\\/",Df=new RegExp("["+wc+"]","g"),Tc="[^"+wc+"]",Nf="[^"+wc.replace("\\\\.","")+"]",Uf=/((?:WC+[\\/:])*)/.source.replace("WC",Tc),Ff=/(WCOD+)?/.source.replace("WCOD",Nf),Of=/(?:\\.(WC+)(?:\\[(.+)\\])?)?/.source.replace("WC",Tc),Bf=/\\.(WC+)(?:\\[(.+)\\])?/.source.replace("WC",Tc),zf=new RegExp("^"+Uf+Ff+Of+Bf+"$"),kf=["material","materials","bones","map"],$l=class{constructor(t,e,n){let s=n||Ae.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},Ae=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\\s/g,"_").replace(Df,"")}static parseTrackName(t){let e=zf.exec(t);if(e===null)throw new Error("THREE.PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);kf.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("THREE.PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let o=0;o<r.length;o++){let a=r[o];if(a.name===e||a.uuid===e)return a;let c=n(a.children);if(c)return c}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){te("PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let l=e.objectIndex;switch(n){case"materials":if(!t.material){ne("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){ne("PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){ne("PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===l){l=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){ne("PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){ne("PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){ne("PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(l!==void 0){if(t[l]===void 0){ne("PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[l]}}let o=t[s];if(o===void 0){let l=e.nodeName;ne("PropertyBinding: Trying to update property for track: "+l+"."+s+" but it wasn't found.",t);return}let a=this.Versioning.None;this.targetObject=t,t.isMaterial===!0?a=this.Versioning.NeedsUpdate:t.isObject3D===!0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let c=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){ne("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){ne("PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}c=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=r}else o.fromArray!==void 0&&o.toArray!==void 0?(c=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(c=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=s;this.getValue=this.GetterByBindingType[c],this.setValue=this.SetterByBindingTypeAndVersioning[c][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Ae.Composite=$l;Ae.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Ae.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Ae.prototype.GetterByBindingType=[Ae.prototype._getValue_direct,Ae.prototype._getValue_array,Ae.prototype._getValue_arrayElement,Ae.prototype._getValue_toArray];Ae.prototype.SetterByBindingTypeAndVersioning=[[Ae.prototype._setValue_direct,Ae.prototype._setValue_direct_setNeedsUpdate,Ae.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Ae.prototype._setValue_array,Ae.prototype._setValue_array_setNeedsUpdate,Ae.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Ae.prototype._setValue_arrayElement,Ae.prototype._setValue_arrayElement_setNeedsUpdate,Ae.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Ae.prototype._setValue_fromArray,Ae.prototype._setValue_fromArray_setNeedsUpdate,Ae.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var ax=new Float32Array(1);var Ph=new we,hi=class{constructor(t,e,n=0,s=1/0){this.ray=new bi(t,e),this.near=n,this.far=s,this.camera=null,this.layers=new Rs,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(t,e){this.ray.set(t,e)}setFromCamera(t,e){e.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(e.matrixWorld),this.ray.direction.set(t.x,t.y,.5).unproject(e).sub(this.ray.origin).normalize(),this.camera=e):e.isOrthographicCamera?(this.ray.origin.set(t.x,t.y,e.projectionMatrix.elements[14]).unproject(e),this.ray.direction.set(0,0,-1).transformDirection(e.matrixWorld),this.camera=e):ne("Raycaster: Unsupported camera type: "+e.type)}setFromXRController(t){return Ph.identity().extractRotation(t.matrixWorld),this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(0,0,-1).applyMatrix4(Ph),this}intersectObject(t,e=!0,n=[]){return jl(t,this,n,e),n.sort(Ih),n}intersectObjects(t,e=!0,n=[]){for(let s=0,r=t.length;s<r;s++)jl(t[s],this,n,e);return n.sort(Ih),n}};function Ih(i,t){return i.distance-t.distance}function jl(i,t,e,n){let s=!0;if(i.layers.test(t.layers)&&i.raycast(t,e)===!1&&(s=!1),s===!0&&n===!0){let r=i.children;for(let o=0,a=r.length;o<a;o++)jl(r[o],t,e,!0)}}var ks=class{constructor(t=1,e=0,n=0){this.radius=t,this.phi=e,this.theta=n}set(t,e,n){return this.radius=t,this.phi=e,this.theta=n,this}copy(t){return this.radius=t.radius,this.phi=t.phi,this.theta=t.theta,this}makeSafe(){return this.phi=oe(this.phi,1e-6,Math.PI-1e-6),this}setFromVector3(t){return this.setFromCartesianCoords(t.x,t.y,t.z)}setFromCartesianCoords(t,e,n){return this.radius=Math.sqrt(t*t+e*e+n*n),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(t,n),this.phi=Math.acos(oe(e/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}};var Ql=class i{static{i.prototype.isMatrix2=!0}constructor(t,e,n,s){this.elements=[1,0,0,1],t!==void 0&&this.set(t,e,n,s)}identity(){return this.set(1,0,0,1),this}fromArray(t,e=0){for(let n=0;n<4;n++)this.elements[n]=t[n+e];return this}set(t,e,n,s){let r=this.elements;return r[0]=t,r[2]=e,r[1]=n,r[3]=s,this}},Lh=new mt,Ii=class{constructor(t=new mt(1/0,1/0),e=new mt(-1/0,-1/0)){this.isBox2=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=Lh.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=1/0,this.max.x=this.max.y=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y}getCenter(t){return this.isEmpty()?t.set(0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}containsPoint(t){return t.x>=this.min.x&&t.x<=this.max.x&&t.y>=this.min.y&&t.y<=this.max.y}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y))}intersectsBox(t){return t.max.x>=this.min.x&&t.min.x<=this.max.x&&t.max.y>=this.min.y&&t.min.y<=this.max.y}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,Lh).distanceTo(t)}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}};var Ln=class{constructor(){this.type="ShapePath",this.color=new ie,this.subPaths=[],this.currentPath=null,this.userData={}}moveTo(t,e){return this.currentPath=new Xn,this.subPaths.push(this.currentPath),this.currentPath.moveTo(t,e),this}lineTo(t,e){return this.currentPath.lineTo(t,e),this}quadraticCurveTo(t,e,n,s){return this.currentPath.quadraticCurveTo(t,e,n,s),this}bezierCurveTo(t,e,n,s,r,o){return this.currentPath.bezierCurveTo(t,e,n,s,r,o),this}splineThru(t){return this.currentPath.splineThru(t),this}toShapes(){function t(c,l){let h=!1,d=l.length;for(let u=0,p=d-1;u<d;p=u++){let g=l[u],v=l[p];g.y>c.y!=v.y>c.y&&c.x<(v.x-g.x)*(c.y-g.y)/(v.y-g.y)+g.x&&(h=!h)}return h}function e(c,l){let h=l.getCenter(new mt);if(t(h,c))return h;let d=h.y,u=[],p=c.length;for(let g=0;g<p;g++){let v=c[g],m=c[(g+1)%p];if(v.y>d!=m.y>d){let f=v.x+(d-v.y)*(m.x-v.x)/(m.y-v.y);u.push(f)}}return u.length>1&&(u.sort((g,v)=>g-v),h.x=(u[0]+u[1])/2),h}let n=this.userData.style&&this.userData.style.fillRule||"nonzero";n!=="nonzero"&&n!=="evenodd"&&(te('Fill-rule "'+n+'" is not supported, falling back to "nonzero".'),n="nonzero");let s=n==="nonzero"?(c=>c!==0):(c=>(c&1)!==0),r=[];for(let c of this.subPaths){let l=c.getPoints();if(l.length<3)continue;let h=Vn.area(l);if(h===0)continue;let d=new Ii;for(let u=0;u<l.length;u++)d.expandByPoint(l[u]);r.push({subPath:c,points:l,boundingBox:d,interiorPoint:e(l,d),absArea:Math.abs(h),winding:h<0?-1:1,container:null,exclude:!1,role:null})}r.sort((c,l)=>l.absArea-c.absArea);for(let c=0;c<r.length;c++){let l=r[c],h=0;for(let d=c-1;d>=0;d--){let u=r[d];if(u.boundingBox.containsBox(l.boundingBox)&&t(l.interiorPoint,u.points)){l.container=u.exclude?u.container:u,h=u.winding,l.winding+=h;break}}s(l.winding)===s(h)&&(l.exclude=!0)}for(let c of r)c.exclude||(c.role=c.container===null||c.container.role==="hole"?"outer":"hole");let o=[],a=new Map;for(let c of r){if(c.exclude||c.role!=="outer")continue;let l=new wi;l.curves=c.subPath.curves,o.push(l),a.set(c,l)}for(let c of r){if(c.exclude||c.role!=="hole")continue;let l=a.get(c.container);if(!l)continue;let h=new Xn;h.curves=c.subPath.curves,l.holes.push(h)}return o}},Lr=class extends Cn{constructor(t,e=null){super(),this.object=t,this.domElement=e,this.enabled=!0,this.state=-1,this.keys={},this.mouseButtons={LEFT:null,MIDDLE:null,RIGHT:null},this.touches={ONE:null,TWO:null}}connect(t){this.domElement!==null&&this.disconnect(),this.domElement=t}disconnect(){}dispose(){}update(){}};function Ac(i,t,e,n){let s=Vf(n);switch(e){case _c:return i*t;case yc:return i*t/s.components*s.byteLength;case ua:return i*t/s.components*s.byteLength;case Oi:return i*t*2/s.components*s.byteLength;case da:return i*t*2/s.components*s.byteLength;case xc:return i*t*3/s.components*s.byteLength;case Mn:return i*t*4/s.components*s.byteLength;case fa:return i*t*4/s.components*s.byteLength;case Or:case Br:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case zr:case kr:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case ma:case _a:return Math.max(i,16)*Math.max(t,8)/4;case pa:case ga:return Math.max(i,8)*Math.max(t,8)/2;case xa:case ya:case Sa:case Ma:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*8;case va:case Vr:case ba:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case Ea:return Math.floor((i+3)/4)*Math.floor((t+3)/4)*16;case wa:return Math.floor((i+4)/5)*Math.floor((t+3)/4)*16;case Ta:return Math.floor((i+4)/5)*Math.floor((t+4)/5)*16;case Aa:return Math.floor((i+5)/6)*Math.floor((t+4)/5)*16;case Ra:return Math.floor((i+5)/6)*Math.floor((t+5)/6)*16;case Ca:return Math.floor((i+7)/8)*Math.floor((t+4)/5)*16;case Pa:return Math.floor((i+7)/8)*Math.floor((t+5)/6)*16;case Ia:return Math.floor((i+7)/8)*Math.floor((t+7)/8)*16;case La:return Math.floor((i+9)/10)*Math.floor((t+4)/5)*16;case Da:return Math.floor((i+9)/10)*Math.floor((t+5)/6)*16;case Na:return Math.floor((i+9)/10)*Math.floor((t+7)/8)*16;case Ua:return Math.floor((i+9)/10)*Math.floor((t+9)/10)*16;case Fa:return Math.floor((i+11)/12)*Math.floor((t+9)/10)*16;case Oa:return Math.floor((i+11)/12)*Math.floor((t+11)/12)*16;case Ba:case za:case ka:return Math.ceil(i/4)*Math.ceil(t/4)*16;case Va:case Ha:return Math.ceil(i/4)*Math.ceil(t/4)*8;case Hr:case Ga:return Math.ceil(i/4)*Math.ceil(t/4)*16}throw new Error(\`Unable to determine texture byte length for \${e} format.\`)}function Vf(i){switch(i){case an:case fc:return{byteLength:1,components:1};case Gs:case pc:case Fn:return{byteLength:2,components:1};case ca:case ha:return{byteLength:2,components:4};case Nn:case la:case Un:return{byteLength:4,components:1};case mc:case gc:return{byteLength:4,components:3}}throw new Error(\`THREE.TextureUtils: Unknown texture type \${i}.\`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:"186"}}));typeof window<"u"&&(window.__THREE__?te("WARNING: Multiple instances of Three.js being imported."):window.__THREE__="186");/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function qu(){let i=null,t=!1,e=null,n=null;function s(r,o){n=i.requestAnimationFrame(s),e(r,o)}return{start:function(){t!==!0&&e!==null&&i!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function Gf(i){let t=new WeakMap;function e(a,c){let l=a.array,h=a.usage,d=l.byteLength,u=i.createBuffer();i.bindBuffer(c,u),i.bufferData(c,l,h),a.onUploadCallback();let p;if(l instanceof Float32Array)p=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)p=i.HALF_FLOAT;else if(l instanceof Uint16Array)a.isFloat16BufferAttribute?p=i.HALF_FLOAT:p=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)p=i.SHORT;else if(l instanceof Uint32Array)p=i.UNSIGNED_INT;else if(l instanceof Int32Array)p=i.INT;else if(l instanceof Int8Array)p=i.BYTE;else if(l instanceof Uint8Array)p=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)p=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:u,type:p,bytesPerElement:l.BYTES_PER_ELEMENT,version:a.version,size:d}}function n(a,c,l){let h=c.array,d=c.updateRanges;if(i.bindBuffer(l,a),d.length===0)i.bufferSubData(l,0,h);else{d.sort((p,g)=>p.start-g.start);let u=0;for(let p=1;p<d.length;p++){let g=d[u],v=d[p];v.start<=g.start+g.count+1?g.count=Math.max(g.count,v.start+v.count-g.start):(++u,d[u]=v)}d.length=u+1;for(let p=0,g=d.length;p<g;p++){let v=d[p];i.bufferSubData(l,v.start*h.BYTES_PER_ELEMENT,h,v.start,v.count)}c.clearUpdateRanges()}c.onUploadCallback()}function s(a){return a.isInterleavedBufferAttribute&&(a=a.data),t.get(a)}function r(a){a.isInterleavedBufferAttribute&&(a=a.data);let c=t.get(a);c&&(i.deleteBuffer(c.buffer),t.delete(a))}function o(a,c){if(a.isInterleavedBufferAttribute&&(a=a.data),a.isGLBufferAttribute){let h=t.get(a);(!h||h.version<a.version)&&t.set(a,{buffer:a.buffer,type:a.type,bytesPerElement:a.elementSize,version:a.version});return}let l=t.get(a);if(l===void 0)t.set(a,e(a,c));else if(l.version<a.version){if(l.size!==a.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,a,c),l.version=a.version}}return{get:s,remove:r,update:o}}var Wf=\`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif\`,Xf=\`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif\`,qf=\`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif\`,Yf=\`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif\`,Zf=\`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif\`,Jf=\`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif\`,Kf=\`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif\`,$f=\`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif\`,jf=\`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif\`,Qf=\`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif\`,tp=\`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif\`,ep=\`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif\`,np=\`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated\`,ip=\`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif\`,sp=\`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif\`,rp=\`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif\`,op=\`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif\`,ap=\`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif\`,lp=\`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif\`,cp=\`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif\`,hp=\`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif\`,up=\`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif\`,dp=\`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif\`,fp=\`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated\`,pp=\`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif\`,mp=\`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif\`,gp=\`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif\`,_p=\`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif\`,xp=\`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif\`,yp=\`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif\`,vp="gl_FragColor = linearToOutputTexel( gl_FragColor );",Sp=\`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}\`,Mp=\`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif\`,bp=\`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
#endif\`,Ep=\`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif\`,wp=\`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif\`,Tp=\`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif\`,Ap=\`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif\`,Rp=\`#ifdef USE_FOG
	varying float vFogDepth;
#endif\`,Cp=\`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif\`,Pp=\`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif\`,Ip=\`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}\`,Lp=\`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif\`,Dp=\`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;\`,Np=\`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert\`,Up=\`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>\`,Fp=\`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureCubeUV( envMap, envMapRotation * retroVec, roughness );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_CUBE_UV
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif\`,Op=\`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;\`,Bp=\`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon\`,zp=\`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;\`,kp=\`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong\`,Vp=\`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif\`,Hp=\`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}\`,Gp=\`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#ifdef USE_LIGHT_PROBES_GRID
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		irradiance += getLightProbeGridIrradiance( probeWorldPos, probeWorldNormal );
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif\`,Wp=\`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_CUBE_UV )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif\`,Xp=\`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif\`,qp=\`#ifdef USE_LIGHT_PROBES_GRID
uniform highp sampler3D probesSH;
uniform vec3 probesMin;
uniform vec3 probesMax;
uniform vec3 probesResolution;
vec3 getLightProbeGridIrradiance( vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 resMinusOne = res - 1.0;
	vec3 probeSpacing = gridRange / resMinusOne;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.0, 1.0 );
	uvw = uvw * resMinusOne / res + 0.5 / res;
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif\`,Yp=\`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif\`,Zp=\`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif\`,Jp=\`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif\`,Kp=\`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif\`,$p=\`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif\`,jp=\`#ifdef USE_MAP
	uniform sampler2D map;
#endif\`,Qp=\`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif\`,tm=\`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif\`,em=\`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif\`,nm=\`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif\`,im=\`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif\`,sm=\`#if defined( USE_MORPHCOLORS )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif\`,rm=\`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif\`,om=\`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif\`,am=\`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif\`,lm=\`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;\`,cm=\`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif\`,hm=\`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif\`,um=\`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif\`,dm=\`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif\`,fm=\`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif\`,pm=\`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif\`,mm=\`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif\`,gm=\`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif\`,_m=\`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif\`,xm=\`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );\`,ym=\`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}\`,vm=\`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif\`,Sm=\`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;\`,Mm=\`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif\`,bm=\`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif\`,Em=\`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif\`,wm=\`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif\`,Tm=\`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			shadowCoord.z += shadowBias;
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				float radius = shadowRadius * texelSize.x;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float dp = ( shadowCameraNear * ( shadowCameraFar - viewSpaceZ ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp -= shadowBias;
			#else
				float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
				dp += shadowBias;
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			vec2 sample0 = vogelDiskSample( 0, 5, phi );
			vec2 sample1 = vogelDiskSample( 1, 5, phi );
			vec2 sample2 = vogelDiskSample( 2, 5, phi );
			vec2 sample3 = vogelDiskSample( 3, 5, phi );
			vec2 sample4 = vogelDiskSample( 4, 5, phi );
			shadow = (
				texture( shadowMap, vec4( bd3D + ( tangent * sample0.x + bitangent * sample0.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample1.x + bitangent * sample1.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample2.x + bitangent * sample2.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample3.x + bitangent * sample3.y ) * texelSize, dp ) ) +
				texture( shadowMap, vec4( bd3D + ( tangent * sample4.x + bitangent * sample4.y ) * texelSize, dp ) )
			) * 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif\`,Am=\`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif\`,Rm=\`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif\`,Cm=\`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}\`,Pm=\`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif\`,Im=\`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif\`,Lm=\`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif\`,Dm=\`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif\`,Nm=\`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif\`,Um=\`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif\`,Fm=\`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif\`,Om=\`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }\`,Bm=\`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif\`,zm=\`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif\`,km=\`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif\`,Vm=\`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif\`,Hm=\`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif\`,Gm=\`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif\`,Wm=\`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}\`,Xm=\`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}\`,qm=\`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}\`,Ym=\`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}\`,Zm=\`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}\`,Jm=\`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}\`,Km=\`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}\`,$m=\`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}\`,jm=\`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}\`,Qm=\`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}\`,tg=\`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}\`,eg=\`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}\`,ng=\`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}\`,ig=\`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}\`,sg=\`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}\`,rg=\`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}\`,og=\`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}\`,ag=\`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}\`,lg=\`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}\`,cg=\`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}\`,hg=\`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}\`,ug=\`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}\`,dg=\`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}\`,fg=\`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}\`,pg=\`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}\`,mg=\`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}\`,gg=\`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}\`,_g=\`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}\`,xg=\`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}\`,yg=\`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}\`,vg=\`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}\`,Sg=\`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}\`,Mg=\`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}\`,bg=\`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}\`,le={alphahash_fragment:Wf,alphahash_pars_fragment:Xf,alphamap_fragment:qf,alphamap_pars_fragment:Yf,alphatest_fragment:Zf,alphatest_pars_fragment:Jf,aomap_fragment:Kf,aomap_pars_fragment:$f,batching_pars_vertex:jf,batching_vertex:Qf,begin_vertex:tp,beginnormal_vertex:ep,bsdfs:np,iridescence_fragment:ip,bumpmap_pars_fragment:sp,clipping_planes_fragment:rp,clipping_planes_pars_fragment:op,clipping_planes_pars_vertex:ap,clipping_planes_vertex:lp,color_fragment:cp,color_pars_fragment:hp,color_pars_vertex:up,color_vertex:dp,common:fp,cube_uv_reflection_fragment:pp,defaultnormal_vertex:mp,displacementmap_pars_vertex:gp,displacementmap_vertex:_p,emissivemap_fragment:xp,emissivemap_pars_fragment:yp,colorspace_fragment:vp,colorspace_pars_fragment:Sp,envmap_fragment:Mp,envmap_common_pars_fragment:bp,envmap_pars_fragment:Ep,envmap_pars_vertex:wp,envmap_physical_pars_fragment:Fp,envmap_vertex:Tp,fog_vertex:Ap,fog_pars_vertex:Rp,fog_fragment:Cp,fog_pars_fragment:Pp,gradientmap_pars_fragment:Ip,lightmap_pars_fragment:Lp,lights_lambert_fragment:Dp,lights_lambert_pars_fragment:Np,lights_pars_begin:Up,lights_toon_fragment:Op,lights_toon_pars_fragment:Bp,lights_phong_fragment:zp,lights_phong_pars_fragment:kp,lights_physical_fragment:Vp,lights_physical_pars_fragment:Hp,lights_fragment_begin:Gp,lights_fragment_maps:Wp,lights_fragment_end:Xp,lightprobes_pars_fragment:qp,logdepthbuf_fragment:Yp,logdepthbuf_pars_fragment:Zp,logdepthbuf_pars_vertex:Jp,logdepthbuf_vertex:Kp,map_fragment:$p,map_pars_fragment:jp,map_particle_fragment:Qp,map_particle_pars_fragment:tm,metalnessmap_fragment:em,metalnessmap_pars_fragment:nm,morphinstance_vertex:im,morphcolor_vertex:sm,morphnormal_vertex:rm,morphtarget_pars_vertex:om,morphtarget_vertex:am,normal_fragment_begin:lm,normal_fragment_maps:cm,normal_pars_fragment:hm,normal_pars_vertex:um,normal_vertex:dm,normalmap_pars_fragment:fm,clearcoat_normal_fragment_begin:pm,clearcoat_normal_fragment_maps:mm,clearcoat_pars_fragment:gm,iridescence_pars_fragment:_m,opaque_fragment:xm,packing:ym,premultiplied_alpha_fragment:vm,project_vertex:Sm,dithering_fragment:Mm,dithering_pars_fragment:bm,roughnessmap_fragment:Em,roughnessmap_pars_fragment:wm,shadowmap_pars_fragment:Tm,shadowmap_pars_vertex:Am,shadowmap_vertex:Rm,shadowmask_pars_fragment:Cm,skinbase_vertex:Pm,skinning_pars_vertex:Im,skinning_vertex:Lm,skinnormal_vertex:Dm,specularmap_fragment:Nm,specularmap_pars_fragment:Um,tonemapping_fragment:Fm,tonemapping_pars_fragment:Om,transmission_fragment:Bm,transmission_pars_fragment:zm,uv_pars_fragment:km,uv_pars_vertex:Vm,uv_vertex:Hm,worldpos_vertex:Gm,background_vert:Wm,background_frag:Xm,backgroundCube_vert:qm,backgroundCube_frag:Ym,cube_vert:Zm,cube_frag:Jm,depth_vert:Km,depth_frag:$m,distance_vert:jm,distance_frag:Qm,equirect_vert:tg,equirect_frag:eg,linedashed_vert:ng,linedashed_frag:ig,meshbasic_vert:sg,meshbasic_frag:rg,meshlambert_vert:og,meshlambert_frag:ag,meshmatcap_vert:lg,meshmatcap_frag:cg,meshnormal_vert:hg,meshnormal_frag:ug,meshphong_vert:dg,meshphong_frag:fg,meshphysical_vert:pg,meshphysical_frag:mg,meshtoon_vert:gg,meshtoon_frag:_g,points_vert:xg,points_frag:yg,shadow_vert:vg,shadow_frag:Sg,sprite_vert:Mg,sprite_frag:bg},zt={common:{diffuse:{value:new ie(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Qt},alphaMap:{value:null},alphaMapTransform:{value:new Qt},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Qt}},envmap:{envMap:{value:null},envMapRotation:{value:new Qt},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Qt}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Qt}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Qt},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Qt},normalScale:{value:new mt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Qt},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Qt}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Qt}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Qt}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new ie(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:null},probesMin:{value:new V},probesMax:{value:new V},probesResolution:{value:new V}},points:{diffuse:{value:new ie(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Qt},alphaTest:{value:0},uvTransform:{value:new Qt}},sprite:{diffuse:{value:new ie(16777215)},opacity:{value:1},center:{value:new mt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Qt},alphaMap:{value:null},alphaMapTransform:{value:new Qt},alphaTest:{value:0}}},Zn={basic:{uniforms:je([zt.common,zt.specularmap,zt.envmap,zt.aomap,zt.lightmap,zt.fog]),vertexShader:le.meshbasic_vert,fragmentShader:le.meshbasic_frag},lambert:{uniforms:je([zt.common,zt.specularmap,zt.envmap,zt.aomap,zt.lightmap,zt.emissivemap,zt.bumpmap,zt.normalmap,zt.displacementmap,zt.fog,zt.lights,{emissive:{value:new ie(0)},envMapIntensity:{value:1}}]),vertexShader:le.meshlambert_vert,fragmentShader:le.meshlambert_frag},phong:{uniforms:je([zt.common,zt.specularmap,zt.envmap,zt.aomap,zt.lightmap,zt.emissivemap,zt.bumpmap,zt.normalmap,zt.displacementmap,zt.fog,zt.lights,{emissive:{value:new ie(0)},specular:{value:new ie(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:le.meshphong_vert,fragmentShader:le.meshphong_frag},standard:{uniforms:je([zt.common,zt.envmap,zt.aomap,zt.lightmap,zt.emissivemap,zt.bumpmap,zt.normalmap,zt.displacementmap,zt.roughnessmap,zt.metalnessmap,zt.fog,zt.lights,{emissive:{value:new ie(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:le.meshphysical_vert,fragmentShader:le.meshphysical_frag},toon:{uniforms:je([zt.common,zt.aomap,zt.lightmap,zt.emissivemap,zt.bumpmap,zt.normalmap,zt.displacementmap,zt.gradientmap,zt.fog,zt.lights,{emissive:{value:new ie(0)}}]),vertexShader:le.meshtoon_vert,fragmentShader:le.meshtoon_frag},matcap:{uniforms:je([zt.common,zt.bumpmap,zt.normalmap,zt.displacementmap,zt.fog,{matcap:{value:null}}]),vertexShader:le.meshmatcap_vert,fragmentShader:le.meshmatcap_frag},points:{uniforms:je([zt.points,zt.fog]),vertexShader:le.points_vert,fragmentShader:le.points_frag},dashed:{uniforms:je([zt.common,zt.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:le.linedashed_vert,fragmentShader:le.linedashed_frag},depth:{uniforms:je([zt.common,zt.displacementmap]),vertexShader:le.depth_vert,fragmentShader:le.depth_frag},normal:{uniforms:je([zt.common,zt.bumpmap,zt.normalmap,zt.displacementmap,{opacity:{value:1}}]),vertexShader:le.meshnormal_vert,fragmentShader:le.meshnormal_frag},sprite:{uniforms:je([zt.sprite,zt.fog]),vertexShader:le.sprite_vert,fragmentShader:le.sprite_frag},background:{uniforms:{uvTransform:{value:new Qt},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:le.background_vert,fragmentShader:le.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Qt}},vertexShader:le.backgroundCube_vert,fragmentShader:le.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:le.cube_vert,fragmentShader:le.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:le.equirect_vert,fragmentShader:le.equirect_frag},distance:{uniforms:je([zt.common,zt.displacementmap,{referencePosition:{value:new V},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:le.distance_vert,fragmentShader:le.distance_frag},shadow:{uniforms:je([zt.lights,zt.fog,{color:{value:new ie(0)},opacity:{value:1}}]),vertexShader:le.shadow_vert,fragmentShader:le.shadow_frag}};Zn.physical={uniforms:je([Zn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Qt},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Qt},clearcoatNormalScale:{value:new mt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Qt},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Qt},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Qt},sheen:{value:0},sheenColor:{value:new ie(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Qt},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Qt},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Qt},transmissionSamplerSize:{value:new mt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Qt},attenuationDistance:{value:0},attenuationColor:{value:new ie(0)},specularColor:{value:new ie(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Qt},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Qt},anisotropyVector:{value:new mt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Qt}}]),vertexShader:le.meshphysical_vert,fragmentShader:le.meshphysical_frag};var Ya={r:0,b:0,g:0},Eg=new we,Yu=new Qt;Yu.set(-1,0,0,0,1,0,0,0,1);function wg(i,t,e,n,s,r){let o=new ie(0),a=s===!0?0:1,c,l,h=null,d=0,u=null;function p(w){let I=w.isScene===!0?w.background:null;if(I&&I.isTexture){let x=w.backgroundBlurriness>0;I=t.get(I,x)}return I}function g(w){let I=!1,x=p(w);x===null?m(o,a):x&&x.isColor&&(m(x,1),I=!0);let M=i.xr.getEnvironmentBlendMode();M==="additive"?e.buffers.color.setClear(0,0,0,1,r):M==="alpha-blend"&&e.buffers.color.setClear(0,0,0,0,r),(i.autoClear||I)&&(e.buffers.depth.setTest(!0),e.buffers.depth.setMask(!0),e.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function v(w,I){let x=p(I);x&&(x.isCubeTexture||x.mapping===Ur)?(l===void 0&&(l=new on(new Pn(1,1,1),new pn({name:"BackgroundCubeMaterial",uniforms:ts(Zn.backgroundCube.uniforms),vertexShader:Zn.backgroundCube.vertexShader,fragmentShader:Zn.backgroundCube.fragmentShader,side:sn,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(M,A,N){this.matrixWorld.copyPosition(N.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(l)),l.material.uniforms.envMap.value=x,l.material.uniforms.backgroundBlurriness.value=I.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=I.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Eg.makeRotationFromEuler(I.backgroundRotation)).transpose(),x.isCubeTexture&&x.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Yu),l.material.toneMapped=de.getTransfer(x.colorSpace)!==xe,(h!==x||d!==x.version||u!==i.toneMapping)&&(l.material.needsUpdate=!0,h=x,d=x.version,u=i.toneMapping),l.layers.enableAll(),w.unshift(l,l.geometry,l.material,0,0,null)):x&&x.isTexture&&(c===void 0&&(c=new on(new In(2,2),new pn({name:"BackgroundMaterial",uniforms:ts(Zn.background.uniforms),vertexShader:Zn.background.vertexShader,fragmentShader:Zn.background.fragmentShader,side:Ni,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=x,c.material.uniforms.backgroundIntensity.value=I.backgroundIntensity,c.material.toneMapped=de.getTransfer(x.colorSpace)!==xe,x.matrixAutoUpdate===!0&&x.updateMatrix(),c.material.uniforms.uvTransform.value.copy(x.matrix),(h!==x||d!==x.version||u!==i.toneMapping)&&(c.material.needsUpdate=!0,h=x,d=x.version,u=i.toneMapping),c.layers.enableAll(),w.unshift(c,c.geometry,c.material,0,0,null))}function m(w,I){w.getRGB(Ya,Ec(i)),e.buffers.color.setClear(Ya.r,Ya.g,Ya.b,I,r)}function f(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return o},setClearColor:function(w,I=1){o.set(w),a=I,m(o,a)},getClearAlpha:function(){return a},setClearAlpha:function(w){a=w,m(o,a)},render:g,addToRenderList:v,dispose:f}}function Tg(i,t){let e=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},s=u(null),r=s,o=!1;function a(Y,Z,it,G,et){let nt=!1,st=d(Y,G,it,Z);r!==st&&(r=st,l(r.object)),nt=p(Y,G,it,et),nt&&g(Y,G,it,et),et!==null&&t.update(et,i.ELEMENT_ARRAY_BUFFER),(nt||o)&&(o=!1,x(Y,Z,it,G),et!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(et).buffer))}function c(){return i.createVertexArray()}function l(Y){return i.bindVertexArray(Y)}function h(Y){return i.deleteVertexArray(Y)}function d(Y,Z,it,G){let et=G.wireframe===!0,nt=n[Z.id];nt===void 0&&(nt={},n[Z.id]=nt);let st=Y.isInstancedMesh===!0?Y.id:0,Q=nt[st];Q===void 0&&(Q={},nt[st]=Q);let at=Q[it.id];at===void 0&&(at={},Q[it.id]=at);let ct=at[et];return ct===void 0&&(ct=u(c()),at[et]=ct),ct}function u(Y){let Z=[],it=[],G=[];for(let et=0;et<e;et++)Z[et]=0,it[et]=0,G[et]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:Z,enabledAttributes:it,attributeDivisors:G,object:Y,attributes:{},index:null}}function p(Y,Z,it,G){let et=r.attributes,nt=Z.attributes,st=0,Q=it.getAttributes();for(let at in Q)if(Q[at].location>=0){let ft=et[at],It=nt[at];if(It===void 0&&(at==="instanceMatrix"&&Y.instanceMatrix&&(It=Y.instanceMatrix),at==="instanceColor"&&Y.instanceColor&&(It=Y.instanceColor)),ft===void 0||ft.attribute!==It||It&&ft.data!==It.data)return!0;st++}return r.attributesNum!==st||r.index!==G}function g(Y,Z,it,G){let et={},nt=Z.attributes,st=0,Q=it.getAttributes();for(let at in Q)if(Q[at].location>=0){let ft=nt[at];ft===void 0&&(at==="instanceMatrix"&&Y.instanceMatrix&&(ft=Y.instanceMatrix),at==="instanceColor"&&Y.instanceColor&&(ft=Y.instanceColor));let It={};It.attribute=ft,ft&&ft.data&&(It.data=ft.data),et[at]=It,st++}r.attributes=et,r.attributesNum=st,r.index=G}function v(){let Y=r.newAttributes;for(let Z=0,it=Y.length;Z<it;Z++)Y[Z]=0}function m(Y){f(Y,0)}function f(Y,Z){let it=r.newAttributes,G=r.enabledAttributes,et=r.attributeDivisors;it[Y]=1,G[Y]===0&&(i.enableVertexAttribArray(Y),G[Y]=1),et[Y]!==Z&&(i.vertexAttribDivisor(Y,Z),et[Y]=Z)}function w(){let Y=r.newAttributes,Z=r.enabledAttributes;for(let it=0,G=Z.length;it<G;it++)Z[it]!==Y[it]&&(i.disableVertexAttribArray(it),Z[it]=0)}function I(Y,Z,it,G,et,nt,st){st===!0?i.vertexAttribIPointer(Y,Z,it,et,nt):i.vertexAttribPointer(Y,Z,it,G,et,nt)}function x(Y,Z,it,G){v();let et=G.attributes,nt=it.getAttributes(),st=Z.defaultAttributeValues;for(let Q in nt){let at=nt[Q];if(at.location>=0){let ct=et[Q];if(ct===void 0&&(Q==="instanceMatrix"&&Y.instanceMatrix&&(ct=Y.instanceMatrix),Q==="instanceColor"&&Y.instanceColor&&(ct=Y.instanceColor)),ct!==void 0){let ft=ct.normalized,It=ct.itemSize,Nt=t.get(ct);if(Nt===void 0)continue;let Xt=Nt.buffer,Wt=Nt.type,qt=Nt.bytesPerElement,z=Wt===i.INT||Wt===i.UNSIGNED_INT||ct.gpuType===la;if(ct.isInterleavedBufferAttribute){let U=ct.data,C=U.stride,L=ct.offset;if(U.isInstancedInterleavedBuffer){for(let B=0;B<at.locationSize;B++)f(at.location+B,U.meshPerAttribute);Y.isInstancedMesh!==!0&&G._maxInstanceCount===void 0&&(G._maxInstanceCount=U.meshPerAttribute*U.count)}else for(let B=0;B<at.locationSize;B++)m(at.location+B);i.bindBuffer(i.ARRAY_BUFFER,Xt);for(let B=0;B<at.locationSize;B++)I(at.location+B,It/at.locationSize,Wt,ft,C*qt,(L+It/at.locationSize*B)*qt,z)}else{if(ct.isInstancedBufferAttribute){for(let U=0;U<at.locationSize;U++)f(at.location+U,ct.meshPerAttribute);Y.isInstancedMesh!==!0&&G._maxInstanceCount===void 0&&(G._maxInstanceCount=ct.meshPerAttribute*ct.count)}else for(let U=0;U<at.locationSize;U++)m(at.location+U);i.bindBuffer(i.ARRAY_BUFFER,Xt);for(let U=0;U<at.locationSize;U++)I(at.location+U,It/at.locationSize,Wt,ft,It*qt,It/at.locationSize*U*qt,z)}}else if(st!==void 0){let ft=st[Q];if(ft!==void 0)switch(ft.length){case 2:i.vertexAttrib2fv(at.location,ft);break;case 3:i.vertexAttrib3fv(at.location,ft);break;case 4:i.vertexAttrib4fv(at.location,ft);break;default:i.vertexAttrib1fv(at.location,ft)}}}}w()}function M(){R();for(let Y in n){let Z=n[Y];for(let it in Z){let G=Z[it];for(let et in G){let nt=G[et];for(let st in nt)h(nt[st].object),delete nt[st];delete G[et]}}delete n[Y]}}function A(Y){if(n[Y.id]===void 0)return;let Z=n[Y.id];for(let it in Z){let G=Z[it];for(let et in G){let nt=G[et];for(let st in nt)h(nt[st].object),delete nt[st];delete G[et]}}delete n[Y.id]}function N(Y){for(let Z in n){let it=n[Z];for(let G in it){let et=it[G];if(et[Y.id]===void 0)continue;let nt=et[Y.id];for(let st in nt)h(nt[st].object),delete nt[st];delete et[Y.id]}}}function y(Y){for(let Z in n){let it=n[Z],G=Y.isInstancedMesh===!0?Y.id:0,et=it[G];if(et!==void 0){for(let nt in et){let st=et[nt];for(let Q in st)h(st[Q].object),delete st[Q];delete et[nt]}delete it[G],Object.keys(it).length===0&&delete n[Z]}}}function R(){k(),o=!0,r!==s&&(r=s,l(r.object))}function k(){s.geometry=null,s.program=null,s.wireframe=!1}return{setup:a,reset:R,resetDefaultState:k,dispose:M,releaseStatesOfGeometry:A,releaseStatesOfObject:y,releaseStatesOfProgram:N,initAttributes:v,enableAttribute:m,disableUnusedAttributes:w}}function Ag(i,t,e){let n;function s(c){n=c}function r(c,l){i.drawArrays(n,c,l),e.update(l,n,1)}function o(c,l,h){h!==0&&(i.drawArraysInstanced(n,c,l,h),e.update(l,n,h))}function a(c,l,h){if(h===0)return;t.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,l,0,h);let u=0;for(let p=0;p<h;p++)u+=l[p];e.update(u,n,1)}this.setMode=s,this.render=r,this.renderInstances=o,this.renderMultiDraw=a}function Rg(i,t,e,n){let s;function r(){if(s!==void 0)return s;if(t.has("EXT_texture_filter_anisotropic")===!0){let N=t.get("EXT_texture_filter_anisotropic");s=i.getParameter(N.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else s=0;return s}function o(N){return!(N!==Mn&&n.convert(N)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function a(N){let y=N===Fn&&(t.has("EXT_color_buffer_half_float")||t.has("EXT_color_buffer_float"));return!(N!==an&&N!==Un&&!y&&n.convert(N)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function c(N){if(N==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";N="mediump"}return N==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=e.precision!==void 0?e.precision:"highp",h=c(l);h!==l&&(te("WebGLRenderer:",l,"not supported, using",h,"instead."),l=h);let d=e.logarithmicDepthBuffer===!0,u=e.reversedDepthBuffer===!0&&t.has("EXT_clip_control");e.reversedDepthBuffer===!0&&u===!1&&te("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer.");let p=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),g=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),v=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),f=i.getParameter(i.MAX_VERTEX_ATTRIBS),w=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),I=i.getParameter(i.MAX_VARYING_VECTORS),x=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),M=i.getParameter(i.MAX_SAMPLES),A=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:r,getMaxPrecision:c,textureFormatReadable:o,textureTypeReadable:a,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:u,maxTextures:p,maxVertexTextures:g,maxTextureSize:v,maxCubemapSize:m,maxAttributes:f,maxVertexUniforms:w,maxVaryings:I,maxFragmentUniforms:x,maxSamples:M,samples:A}}function Cg(i){let t=this,e=null,n=0,s=!1,r=!1,o=new We,a=new Qt,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(d,u){let p=d.length!==0||u||n!==0||s;return s=u,n=d.length,p},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(d,u){e=h(d,u,0)},this.setState=function(d,u,p){let g=d.clippingPlanes,v=d.clipIntersection,m=d.clipShadows,f=i.get(d);if(!s||g===null||g.length===0||r&&!m)r?h(null):l();else{let w=r?0:n,I=w*4,x=f.clippingState||null;c.value=x,x=h(g,u,I,p);for(let M=0;M!==I;++M)x[M]=e[M];f.clippingState=x,this.numIntersection=v?this.numPlanes:0,this.numPlanes+=w}};function l(){c.value!==e&&(c.value=e,c.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(d,u,p,g){let v=d!==null?d.length:0,m=null;if(v!==0){if(m=c.value,g!==!0||m===null){let f=p+v*4,w=u.matrixWorldInverse;a.getNormalMatrix(w),(m===null||m.length<f)&&(m=new Float32Array(f));for(let I=0,x=p;I!==v;++I,x+=4)o.copy(d[I]).applyMatrix4(w,a),o.normal.toArray(m,x),m[x+3]=o.constant}c.value=m,c.needsUpdate=!0}return t.numPlanes=v,t.numIntersection=0,m}}var qs=4,Pg=6,Ig=20,Lg=256,Gr=new Ci,wu=new ie,Rc=null,Cc=0,Pc=0,Ic=!1,Dg=new V,es=new V,Ja=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._sizeLods=[],this._lodMeshes=[],this._backgroundBox=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null}fromScene(t,e=0,n=.1,s=100,r={}){let{size:o=256,position:a=Dg}=r;Rc=this._renderer.getRenderTarget(),Cc=this._renderer.getActiveCubeFace(),Pc=this._renderer.getActiveMipmapLevel(),Ic=this._renderer.xr.enabled,this._renderer.xr.enabled=!1,this._setSize(o);let c=this._allocateTargets();return c.depthBuffer=!0,this._sceneToCubeUV(t,n,s,c,a),e>0&&this._blur(c,0,0,e),this._applyPMREM(c),this._cleanup(c),c}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Ru(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Au(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._backgroundBox!==null&&(this._backgroundBox.geometry.dispose(),this._backgroundBox.material.dispose())}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodMeshes.length;t++)this._lodMeshes[t].geometry.dispose()}_cleanup(t){this._renderer.setRenderTarget(Rc,Cc,Pc),this._renderer.xr.enabled=Ic,t.scissorTest=!1,Xs(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===Ui||t.mapping===ji?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Rc=this._renderer.getRenderTarget(),Cc=this._renderer.getActiveCubeFace(),Pc=this._renderer.getActiveMipmapLevel(),Ic=this._renderer.xr.enabled,this._renderer.xr.enabled=!1;let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Pe,minFilter:Pe,generateMipmaps:!1,type:Fn,format:Mn,colorSpace:lr,depthBuffer:!1},s=Tu(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=Tu(t,e,n);let{_lodMax:r}=this;({lodMeshes:this._lodMeshes,sizeLods:this._sizeLods}=Ng(r)),this._blurMaterial=Fg(r,t,e),this._ggxMaterial=Ug(r,t,e)}return s}_compileMaterial(t){let e=new on(new Le,t);this._renderer.compile(e,Gr)}_sceneToCubeUV(t,e,n,s,r){let c=new Xe(90,1,e,n),l=[1,-1,1,1,1,1],h=[1,1,1,-1,-1,-1],d=this._renderer,u=d.autoClear,p=d.toneMapping;d.getClearColor(wu),d.toneMapping=Dn,d.autoClear=!1,d.state.buffers.depth.getReversed()&&(d.setRenderTarget(s),d.clearDepth(),d.setRenderTarget(null)),this._backgroundBox===null&&(this._backgroundBox=new on(new Pn,new Ze({name:"PMREM.Background",side:sn,depthWrite:!1,depthTest:!1})));let v=this._backgroundBox,m=v.material,f=!1,w=t.background;w?w.isColor&&(m.color.copy(w),t.background=null,f=!0):(m.color.copy(wu),f=!0);for(let I=0;I<6;I++){let x=I%3;x===0?(c.up.set(0,l[I],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x+h[I],r.y,r.z)):x===1?(c.up.set(0,0,l[I]),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y+h[I],r.z)):(c.up.set(0,l[I],0),c.position.set(r.x,r.y,r.z),c.lookAt(r.x,r.y,r.z+h[I]));let M=this._cubeSize;Xs(s,x*M,I>2?M:0,M,M),d.setRenderTarget(s),f&&d.render(v,c),d.render(t,c)}d.toneMapping=p,d.autoClear=u,t.background=w}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===Ui||t.mapping===ji;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=Ru()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=Au());let r=s?this._cubemapMaterial:this._equirectMaterial,o=this._lodMeshes[0];o.material=r;let a=r.uniforms;a.envMap.value=t;let c=this._cubeSize;Xs(e,0,0,3*c,2*c),n.setRenderTarget(e),n.render(o,Gr)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;let s=this._lodMeshes.length;for(let r=1;r<s;r++)this._applyGGXFilter(t,r-1,r);e.autoClear=n}_applyGGXFilter(t,e,n){let s=this._renderer,r=this._pingPongRenderTarget,o=this._ggxMaterial,a=this._lodMeshes[n];a.material=o;let c=o.uniforms,l=n/(this._lodMeshes.length-1),h=e/(this._lodMeshes.length-1),d=Math.sqrt(l*l-h*h),u=l*1.25,p=d*u,{_lodMax:g}=this,v=this._sizeLods[n],m=3*v*(n>g-qs?n-g+qs:0),f=4*(this._cubeSize-v);c.envMap.value=t.texture,c.roughness.value=p,c.mipInt.value=g-e,Xs(r,m,f,3*v,2*v),s.setRenderTarget(r),s.render(a,Gr),c.envMap.value=r.texture,c.roughness.value=0,c.mipInt.value=g-n,Xs(t,m,f,3*v,2*v),s.setRenderTarget(t),s.render(a,Gr)}_blur(t,e,n,s){let r=this._pingPongRenderTarget,o=Math.min(s,Math.PI)/Math.SQRT2;this._blurPass(t,r,e,n,o),this._blurPass(r,t,n,n,o)}_blurPass(t,e,n,s,r){let o=this._renderer,a=this._blurMaterial,c=this._lodMeshes[s];c.material=a;let l=a.uniforms;l.envMap.value=t.texture,l.sigma.value=r,l.mipInt.value=this._lodMax-n;let h=this._sizeLods[s],d=3*h*(s>this._lodMax-qs?s-this._lodMax+qs:0),u=4*(this._cubeSize-h);Xs(e,d,u,3*h,2*h),o.setRenderTarget(e),o.render(c,Gr)}};function Ng(i){let t=[],e=[],n=i,s=i-qs+1+Pg;for(let r=0;r<s;r++){let o=Math.pow(2,n);t.push(o);let a=1/(o-2),c=-a,l=1+a,h=[c,c,l,c,l,l,c,c,l,l,c,l],d=6,u=6,p=3,g=new Float32Array(p*u*d),v=new Float32Array(p*u*d);for(let f=0;f<d;f++){let w=f%3*2/3-1,I=f>2?0:-1,x=[w,I,0,w+2/3,I,0,w+2/3,I+1,0,w,I,0,w+2/3,I+1,0,w,I+1,0];g.set(x,p*u*f);for(let M=0;M<u;M++){let A=h[M*2]*2-1,N=h[M*2+1]*2-1;f===0?es.set(1,N,A):f===1?es.set(-A,1,-N):f===2?es.set(-A,N,1):f===3?es.set(-1,N,-A):f===4?es.set(-A,-1,N):es.set(A,N,-1),es.toArray(v,(f*u+M)*p)}}let m=new Le;m.setAttribute("position",new vn(g,p)),m.setAttribute("outputDirection",new vn(v,p)),e.push(new on(m,null)),n>qs&&n--}return{lodMeshes:e,sizeLods:t}}function Tu(i,t,e){let n=new rn(i,t,e);return n.texture.mapping=Ur,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function Xs(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function Ug(i,t,e){return new pn({name:"PMREMGGXConvolution",defines:{GGX_SAMPLES:Lg,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:\`\${i}.0\`},uniforms:{envMap:{value:null},roughness:{value:0},mipInt:{value:0}},vertexShader:ja(),fragmentShader:\`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float roughness;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359

			// Van der Corput radical inverse
			float radicalInverse_VdC(uint bits) {
				bits = (bits << 16u) | (bits >> 16u);
				bits = ((bits & 0x55555555u) << 1u) | ((bits & 0xAAAAAAAAu) >> 1u);
				bits = ((bits & 0x33333333u) << 2u) | ((bits & 0xCCCCCCCCu) >> 2u);
				bits = ((bits & 0x0F0F0F0Fu) << 4u) | ((bits & 0xF0F0F0F0u) >> 4u);
				bits = ((bits & 0x00FF00FFu) << 8u) | ((bits & 0xFF00FF00u) >> 8u);
				return float(bits) * 2.3283064365386963e-10; // / 0x100000000
			}

			// Hammersley sequence
			vec2 hammersley(uint i, uint N) {
				return vec2(float(i) / float(N), radicalInverse_VdC(i));
			}

			// GGX VNDF importance sampling (Eric Heitz 2018)
			// "Sampling the GGX Distribution of Visible Normals"
			// https://jcgt.org/published/0007/04/01/
			vec3 importanceSampleGGX_VNDF(vec2 Xi, vec3 V, float roughness) {
				float alpha = roughness * roughness;

				// Section 4.1: Orthonormal basis
				vec3 T1 = vec3(1.0, 0.0, 0.0);
				vec3 T2 = cross(V, T1);

				// Section 4.2: Parameterization of projected area
				float r = sqrt(Xi.x);
				float phi = 2.0 * PI * Xi.y;
				float t1 = r * cos(phi);
				float t2 = r * sin(phi);
				float s = 0.5 * (1.0 + V.z);
				t2 = (1.0 - s) * sqrt(1.0 - t1 * t1) + s * t2;

				// Section 4.3: Reprojection onto hemisphere
				vec3 Nh = t1 * T1 + t2 * T2 + sqrt(max(0.0, 1.0 - t1 * t1 - t2 * t2)) * V;

				// Section 3.4: Transform back to ellipsoid configuration
				return normalize(vec3(alpha * Nh.x, alpha * Nh.y, max(0.0, Nh.z)));
			}

			void main() {
				vec3 N = normalize(vOutputDirection);
				vec3 V = N; // Assume view direction equals normal for pre-filtering

				vec3 prefilteredColor = vec3(0.0);
				float totalWeight = 0.0;

				// For very low roughness, just sample the environment directly
				if (roughness < 0.001) {
					gl_FragColor = vec4(bilinearCubeUV(envMap, N, mipInt), 1.0);
					return;
				}

				// Tangent space basis for VNDF sampling
				vec3 up = abs(N.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
				vec3 tangent = normalize(cross(up, N));
				vec3 bitangent = cross(N, tangent);

				for(uint i = 0u; i < uint(GGX_SAMPLES); i++) {
					vec2 Xi = hammersley(i, uint(GGX_SAMPLES));

					// For PMREM, V = N, so in tangent space V is always (0, 0, 1)
					vec3 H_tangent = importanceSampleGGX_VNDF(Xi, vec3(0.0, 0.0, 1.0), roughness);

					// Transform H back to world space
					vec3 H = normalize(tangent * H_tangent.x + bitangent * H_tangent.y + N * H_tangent.z);
					vec3 L = normalize(2.0 * dot(V, H) * H - V);

					float NdotL = max(dot(N, L), 0.0);

					if(NdotL > 0.0) {
						// Sample environment at fixed mip level
						// VNDF importance sampling handles the distribution filtering
						vec3 sampleColor = bilinearCubeUV(envMap, L, mipInt);

						// Weight by NdotL for the split-sum approximation
						// VNDF PDF naturally accounts for the visible microfacet distribution
						prefilteredColor += sampleColor * NdotL;
						totalWeight += NdotL;
					}
				}

				if (totalWeight > 0.0) {
					prefilteredColor = prefilteredColor / totalWeight;
				}

				gl_FragColor = vec4(prefilteredColor, 1.0);
			}
		\`,blending:qn,depthTest:!1,depthWrite:!1})}function Fg(i,t,e){return new pn({name:"SphericalGaussianBlur",defines:{SAMPLES:Ig,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:\`\${i}.0\`},uniforms:{envMap:{value:null},sigma:{value:0},mipInt:{value:0}},vertexShader:ja(),fragmentShader:\`

			precision highp float;
			precision highp int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform float sigma;
			uniform float mipInt;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			#define PI 3.14159265359
			#define GOLDEN_ANGLE 2.39996322973

			void main() {

				if ( sigma == 0.0 ) {

					gl_FragColor = vec4( bilinearCubeUV( envMap, vOutputDirection, mipInt ), 1.0 );
					return;

				}

				vec3 outputDirection = normalize( vOutputDirection );

				vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
				vec3 tangent = normalize( cross( up, outputDirection ) );
				vec3 bitangent = cross( outputDirection, tangent );

				// Truncate the kernel at three standard deviations or at the antipode.
				float thetaMax = min( 3.0 * sigma, PI );
				float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

				vec3 accumColor = vec3( 0.0 );
				float accumWeight = 0.0;

				for ( int i = 0; i < SAMPLES; i ++ ) {

					// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
					float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
					float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
					float phi = float( i ) * GOLDEN_ANGLE;

					vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
					vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

					// Correct the planar sample density to solid angle.
					float weight = sin( theta ) / theta;

					accumColor += weight * bilinearCubeUV( envMap, sampleDirection, mipInt );
					accumWeight += weight;

				}

				gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

			}
		\`,blending:qn,depthTest:!1,depthWrite:!1})}function Au(){return new pn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:ja(),fragmentShader:\`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		\`,blending:qn,depthTest:!1,depthWrite:!1})}function Ru(){return new pn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:ja(),fragmentShader:\`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		\`,blending:qn,depthTest:!1,depthWrite:!1})}function ja(){return\`

		precision mediump float;
		precision mediump int;

		attribute vec3 outputDirection;

		varying vec3 vOutputDirection;

		void main() {

			vOutputDirection = outputDirection;
			gl_Position = vec4( position, 1.0 );

		}
	\`}var Ka=class extends rn{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new mr(s),this._setTextureOptions(e),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:\`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			\`,fragmentShader:\`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			\`},s=new Pn(5,5,5),r=new pn({name:"CubemapFromEquirect",uniforms:ts(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:sn,blending:qn});r.uniforms.tEquirect.value=e;let o=new on(s,r),a=e.minFilter;return e.minFilter===Sn&&(e.minFilter=Pe),new ia(1,10,this).update(t,o),e.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(t,e=!0,n=!0,s=!0){let r=t.getRenderTarget();for(let o=0;o<6;o++)t.setRenderTarget(this,o),t.clear(e,n,s);t.setRenderTarget(r)}};function Og(i){let t=new WeakMap,e=new WeakMap,n=null;function s(u,p=!1){return u==null?null:p?o(u):r(u)}function r(u){if(u&&u.isTexture){let p=u.mapping;if(p===ra||p===oa)if(t.has(u)){let g=t.get(u).texture;return a(g,u.mapping)}else{let g=u.image;if(g&&g.height>0){let v=new Ka(g.height);return v.fromEquirectangularTexture(i,u),t.set(u,v),u.addEventListener("dispose",l),a(v.texture,u.mapping)}else return null}}return u}function o(u){if(u&&u.isTexture){let p=u.mapping,g=p===ra||p===oa,v=p===Ui||p===ji;if(g||v){let m=e.get(u),f=m!==void 0?m.texture.pmremVersion:0;if(u.isRenderTargetTexture&&u.pmremVersion!==f)return n===null&&(n=new Ja(i)),m=g?n.fromEquirectangular(u,m):n.fromCubemap(u,m),m.texture.pmremVersion=u.pmremVersion,e.set(u,m),m.texture;if(m!==void 0)return m.texture;{let w=u.image;return g&&w&&w.height>0||v&&w&&c(w)?(n===null&&(n=new Ja(i)),m=g?n.fromEquirectangular(u):n.fromCubemap(u),m.texture.pmremVersion=u.pmremVersion,e.set(u,m),u.addEventListener("dispose",h),m.texture):null}}}return u}function a(u,p){return p===ra?u.mapping=Ui:p===oa&&(u.mapping=ji),u}function c(u){let p=0,g=6;for(let v=0;v<g;v++)u[v]!==void 0&&p++;return p===g}function l(u){let p=u.target;p.removeEventListener("dispose",l);let g=t.get(p);g!==void 0&&(t.delete(p),g.dispose())}function h(u){let p=u.target;p.removeEventListener("dispose",h);let g=e.get(p);g!==void 0&&(e.delete(p),g.dispose())}function d(){t=new WeakMap,e=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:s,dispose:d}}function Bg(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s=i.getExtension(n);return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(){e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance"),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture"),e("WEBGL_render_shared_exponent")},get:function(n){let s=e(n);return s===null&&Xi("WebGLRenderer: "+n+" extension not supported."),s}}}function zg(i,t,e,n){let s={},r=new WeakMap;function o(d){let u=d.target;u.index!==null&&t.remove(u.index);for(let g in u.attributes)t.remove(u.attributes[g]);u.removeEventListener("dispose",o),delete s[u.id];let p=r.get(u);p&&(t.remove(p),r.delete(u)),n.releaseStatesOfGeometry(u),u.isInstancedBufferGeometry===!0&&delete u._maxInstanceCount,e.memory.geometries--}function a(d,u){return s[u.id]===!0||(u.addEventListener("dispose",o),s[u.id]=!0,e.memory.geometries++),u}function c(d){let u=d.attributes;for(let p in u)t.update(u[p],i.ARRAY_BUFFER)}function l(d){let u=[],p=d.index,g=d.attributes.position,v=0;if(g===void 0)return;if(p!==null){let w=p.array;v=p.version;for(let I=0,x=w.length;I<x;I+=3){let M=w[I+0],A=w[I+1],N=w[I+2];u.push(M,A,A,N,N,M)}}else{let w=g.array;v=g.version;for(let I=0,x=w.length/3-1;I<x;I+=3){let M=I+0,A=I+1,N=I+2;u.push(M,A,A,N,N,M)}}let m=new(g.count>=65535?fr:dr)(u,1);m.version=v;let f=r.get(d);f&&t.remove(f),r.set(d,m)}function h(d){let u=r.get(d);if(u){let p=d.index;p!==null&&u.version<p.version&&l(d)}else l(d);return r.get(d)}return{get:a,update:c,getWireframeAttribute:h}}function kg(i,t,e){let n;function s(d){n=d}let r,o;function a(d){r=d.type,o=d.bytesPerElement}function c(d,u){i.drawElements(n,u,r,d*o),e.update(u,n,1)}function l(d,u,p){p!==0&&(i.drawElementsInstanced(n,u,r,d*o,p),e.update(u,n,p))}function h(d,u,p){if(p===0)return;t.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,u,0,r,d,0,p);let v=0;for(let m=0;m<p;m++)v+=u[m];e.update(v,n,1)}this.setMode=s,this.setIndex=a,this.render=c,this.renderInstances=l,this.renderMultiDraw=h}function Vg(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,o,a){switch(e.calls++,o){case i.TRIANGLES:e.triangles+=a*(r/3);break;case i.LINES:e.lines+=a*(r/2);break;case i.LINE_STRIP:e.lines+=a*(r-1);break;case i.LINE_LOOP:e.lines+=a*r;break;case i.POINTS:e.points+=a*r;break;default:ne("WebGLInfo: Unknown draw mode:",o);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function Hg(i,t,e){let n=new WeakMap,s=new Re;function r(o,a,c){let l=o.morphTargetInfluences,h=a.morphAttributes.position||a.morphAttributes.normal||a.morphAttributes.color,d=h!==void 0?h.length:0,u=n.get(a);if(u===void 0||u.count!==d){let R=function(){N.dispose(),n.delete(a),a.removeEventListener("dispose",R)};u!==void 0&&u.texture.dispose();let p=a.morphAttributes.position!==void 0,g=a.morphAttributes.normal!==void 0,v=a.morphAttributes.color!==void 0,m=a.morphAttributes.position||[],f=a.morphAttributes.normal||[],w=a.morphAttributes.color||[],I=0;p===!0&&(I=1),g===!0&&(I=2),v===!0&&(I=3);let x=a.attributes.position.count*I,M=1;x>t.maxTextureSize&&(M=Math.ceil(x/t.maxTextureSize),x=t.maxTextureSize);let A=new Float32Array(x*M*4*d),N=new ur(A,x,M,d);N.type=Un,N.needsUpdate=!0;let y=I*4;for(let k=0;k<d;k++){let Y=m[k],Z=f[k],it=w[k],G=x*M*4*k;for(let et=0;et<Y.count;et++){let nt=et*y;p===!0&&(s.fromBufferAttribute(Y,et),A[G+nt+0]=s.x,A[G+nt+1]=s.y,A[G+nt+2]=s.z,A[G+nt+3]=0),g===!0&&(s.fromBufferAttribute(Z,et),A[G+nt+4]=s.x,A[G+nt+5]=s.y,A[G+nt+6]=s.z,A[G+nt+7]=0),v===!0&&(s.fromBufferAttribute(it,et),A[G+nt+8]=s.x,A[G+nt+9]=s.y,A[G+nt+10]=s.z,A[G+nt+11]=it.itemSize===4?s.w:1)}}u={count:d,texture:N,size:new mt(x,M)},n.set(a,u),a.addEventListener("dispose",R)}if(o.isInstancedMesh===!0&&o.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",o.morphTexture,e);else{let p=0;for(let v=0;v<l.length;v++)p+=l[v];let g=a.morphTargetsRelative?1:1-p;c.getUniforms().setValue(i,"morphTargetBaseInfluence",g),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",u.texture,e),c.getUniforms().setValue(i,"morphTargetsTextureSize",u.size)}return{update:r}}function Gg(i,t,e,n,s){let r=new WeakMap;function o(l){let h=s.render.frame,d=l.geometry,u=t.get(l,d);if(r.get(u)!==h&&(t.update(u),r.set(u,h)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),r.get(l)!==h&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),r.set(l,h))),l.isSkinnedMesh){let p=l.skeleton;r.get(p)!==h&&(p.update(),r.set(p,h))}return u}function a(){r=new WeakMap}function c(l){let h=l.target;h.removeEventListener("dispose",c),n.releaseStatesOfObject(h),e.remove(h.instanceMatrix),h.instanceColor!==null&&e.remove(h.instanceColor)}return{update:o,dispose:a}}var Wg={[oc]:"LINEAR_TONE_MAPPING",[ac]:"REINHARD_TONE_MAPPING",[lc]:"CINEON_TONE_MAPPING",[Nr]:"ACES_FILMIC_TONE_MAPPING",[hc]:"AGX_TONE_MAPPING",[uc]:"NEUTRAL_TONE_MAPPING",[cc]:"CUSTOM_TONE_MAPPING"};function Xg(i,t,e,n,s,r){let o=new rn(t,e,{type:i,depthBuffer:s,stencilBuffer:r,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1}),a=null,c=null,l=new Le;l.setAttribute("position",new fe([-1,3,0,-1,-1,0,3,-1,0],3)),l.setAttribute("uv",new fe([0,2,0,0,2,0],2));let h=new Xo({uniforms:{tDiffuse:{value:null}},vertexShader:\`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}\`,fragmentShader:\`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}\`,depthTest:!1,depthWrite:!1}),d=new on(l,h),u=new Ci(-1,1,1,-1,0,1),p=null,g=null,v=!1,m,f=null,w=[],I=!1;this.setSize=function(x,M){o.setSize(x,M),a!==null&&a.setSize(x,M),c!==null&&c.setSize(x,M);for(let A=0;A<w.length;A++){let N=w[A];N.setSize&&N.setSize(x,M)}},this.setEffects=function(x){w=x,I=w.length>0&&w[0].isRenderPass===!0;let M=o.width,A=o.height;w.length>0&&a===null&&(a=new rn(M,A,{type:Fn,depthBuffer:!1,stencilBuffer:!1}),c=new rn(M,A,{type:Fn,depthBuffer:!1,stencilBuffer:!1}));for(let N=0;N<w.length;N++){let y=w[N];y.setSize&&y.setSize(M,A)}},this.begin=function(x,M){if(v||x.toneMapping===Dn&&w.length===0)return!1;if(f=M,M!==null){let A=M.width,N=M.height;(o.width!==A||o.height!==N)&&this.setSize(A,N)}return I===!1&&x.setRenderTarget(o),m=x.toneMapping,x.toneMapping=Dn,!0},this.hasRenderPass=function(){return I},this.end=function(x,M){x.toneMapping=m,v=!0;let A=o,N=a;for(let y=0;y<w.length;y++){let R=w[y];R.enabled!==!1&&(R.render(x,N,A,M),R.needsSwap!==!1&&(A=N,N=N===a?c:a))}if(p!==x.outputColorSpace||g!==x.toneMapping){p=x.outputColorSpace,g=x.toneMapping,h.defines={},de.getTransfer(p)===xe&&(h.defines.SRGB_TRANSFER="");let y=Wg[g];y&&(h.defines[y]=""),h.needsUpdate=!0}h.uniforms.tDiffuse.value=A.texture,x.setRenderTarget(f),x.render(d,u),f=null,v=!1},this.isCompositing=function(){return v},this.dispose=function(){o.dispose(),a!==null&&a.dispose(),c!==null&&c.dispose(),l.dispose(),h.dispose()}}var Zu=new nn,Nc=new Ei(1,1),Ju=new ur,Ku=new No,$u=new mr,Cu=[],Pu=[],Iu=new Float32Array(16),Lu=new Float32Array(9),Du=new Float32Array(4);function Zs(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=Cu[s];if(r===void 0&&(r=new Float32Array(s),Cu[s]=r),t!==0){n.toArray(r,0);for(let o=1,a=0;o!==t;++o)a+=e,i[o].toArray(r,a)}return r}function ze(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function ke(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function Qa(i,t){let e=Pu[t];e===void 0&&(e=new Int32Array(t),Pu[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function qg(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function Yg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ze(e,t))return;i.uniform2fv(this.addr,t),ke(e,t)}}function Zg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(ze(e,t))return;i.uniform3fv(this.addr,t),ke(e,t)}}function Jg(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ze(e,t))return;i.uniform4fv(this.addr,t),ke(e,t)}}function Kg(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(ze(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),ke(e,t)}else{if(ze(e,n))return;Du.set(n),i.uniformMatrix2fv(this.addr,!1,Du),ke(e,n)}}function $g(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(ze(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),ke(e,t)}else{if(ze(e,n))return;Lu.set(n),i.uniformMatrix3fv(this.addr,!1,Lu),ke(e,n)}}function jg(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(ze(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),ke(e,t)}else{if(ze(e,n))return;Iu.set(n),i.uniformMatrix4fv(this.addr,!1,Iu),ke(e,n)}}function Qg(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function t0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ze(e,t))return;i.uniform2iv(this.addr,t),ke(e,t)}}function e0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ze(e,t))return;i.uniform3iv(this.addr,t),ke(e,t)}}function n0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ze(e,t))return;i.uniform4iv(this.addr,t),ke(e,t)}}function i0(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function s0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(ze(e,t))return;i.uniform2uiv(this.addr,t),ke(e,t)}}function r0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(ze(e,t))return;i.uniform3uiv(this.addr,t),ke(e,t)}}function o0(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(ze(e,t))return;i.uniform4uiv(this.addr,t),ke(e,t)}}function a0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r;this.type===i.SAMPLER_2D_SHADOW?(Nc.compareFunction=e.isReversedDepthBuffer()?qa:Xa,r=Nc):r=Zu,e.setTexture2D(t||r,s)}function l0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||Ku,s)}function c0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||$u,s)}function h0(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||Ju,s)}function u0(i){switch(i){case 5126:return qg;case 35664:return Yg;case 35665:return Zg;case 35666:return Jg;case 35674:return Kg;case 35675:return $g;case 35676:return jg;case 5124:case 35670:return Qg;case 35667:case 35671:return t0;case 35668:case 35672:return e0;case 35669:case 35673:return n0;case 5125:return i0;case 36294:return s0;case 36295:return r0;case 36296:return o0;case 35678:case 36198:case 36298:case 36306:case 35682:return a0;case 35679:case 36299:case 36307:return l0;case 35680:case 36300:case 36308:case 36293:return c0;case 36289:case 36303:case 36311:case 36292:return h0}}function d0(i,t){i.uniform1fv(this.addr,t)}function f0(i,t){let e=Zs(t,this.size,2);i.uniform2fv(this.addr,e)}function p0(i,t){let e=Zs(t,this.size,3);i.uniform3fv(this.addr,e)}function m0(i,t){let e=Zs(t,this.size,4);i.uniform4fv(this.addr,e)}function g0(i,t){let e=Zs(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function _0(i,t){let e=Zs(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function x0(i,t){let e=Zs(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function y0(i,t){i.uniform1iv(this.addr,t)}function v0(i,t){i.uniform2iv(this.addr,t)}function S0(i,t){i.uniform3iv(this.addr,t)}function M0(i,t){i.uniform4iv(this.addr,t)}function b0(i,t){i.uniform1uiv(this.addr,t)}function E0(i,t){i.uniform2uiv(this.addr,t)}function w0(i,t){i.uniform3uiv(this.addr,t)}function T0(i,t){i.uniform4uiv(this.addr,t)}function A0(i,t,e){let n=this.cache,s=t.length,r=Qa(e,s);ze(n,r)||(i.uniform1iv(this.addr,r),ke(n,r));let o;this.type===i.SAMPLER_2D_SHADOW?o=Nc:o=Zu;for(let a=0;a!==s;++a)e.setTexture2D(t[a]||o,r[a])}function R0(i,t,e){let n=this.cache,s=t.length,r=Qa(e,s);ze(n,r)||(i.uniform1iv(this.addr,r),ke(n,r));for(let o=0;o!==s;++o)e.setTexture3D(t[o]||Ku,r[o])}function C0(i,t,e){let n=this.cache,s=t.length,r=Qa(e,s);ze(n,r)||(i.uniform1iv(this.addr,r),ke(n,r));for(let o=0;o!==s;++o)e.setTextureCube(t[o]||$u,r[o])}function P0(i,t,e){let n=this.cache,s=t.length,r=Qa(e,s);ze(n,r)||(i.uniform1iv(this.addr,r),ke(n,r));for(let o=0;o!==s;++o)e.setTexture2DArray(t[o]||Ju,r[o])}function I0(i){switch(i){case 5126:return d0;case 35664:return f0;case 35665:return p0;case 35666:return m0;case 35674:return g0;case 35675:return _0;case 35676:return x0;case 5124:case 35670:return y0;case 35667:case 35671:return v0;case 35668:case 35672:return S0;case 35669:case 35673:return M0;case 5125:return b0;case 36294:return E0;case 36295:return w0;case 36296:return T0;case 35678:case 36198:case 36298:case 36306:case 35682:return A0;case 35679:case 36299:case 36307:return R0;case 35680:case 36300:case 36308:case 36293:return C0;case 36289:case 36303:case 36311:case 36292:return P0}}var Uc=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=u0(e.type)}},Fc=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=I0(e.type)}},Oc=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,o=s.length;r!==o;++r){let a=s[r];a.setValue(t,e[a.id],n)}}},Lc=/(\\w+)(\\])?(\\[|\\.)?/g;function Nu(i,t){i.seq.push(t),i.map[t.id]=t}function L0(i,t,e){let n=i.name,s=n.length;for(Lc.lastIndex=0;;){let r=Lc.exec(n),o=Lc.lastIndex,a=r[1],c=r[2]==="]",l=r[3];if(c&&(a=a|0),l===void 0||l==="["&&o+2===s){Nu(e,l===void 0?new Uc(a,i,t):new Fc(a,i,t));break}else{let d=e.map[a];d===void 0&&(d=new Oc(a),Nu(e,d)),e=d}}}var Ys=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let o=0;o<n;++o){let a=t.getActiveUniform(e,o),c=t.getUniformLocation(e,a.name);L0(a,c,this)}let s=[],r=[];for(let o of this.seq)o.type===t.SAMPLER_2D_SHADOW||o.type===t.SAMPLER_CUBE_SHADOW||o.type===t.SAMPLER_2D_ARRAY_SHADOW?s.push(o):r.push(o);s.length>0&&(this.seq=s.concat(r))}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,o=e.length;r!==o;++r){let a=e[r],c=n[a.id];c.needsUpdate!==!1&&a.setValue(t,c.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let o=t[s];o.id in e&&n.push(o)}return n}};function Uu(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var D0=37297,N0=0;function U0(i,t){let e=i.split(\`
\`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let o=s;o<r;o++){let a=o+1;n.push(\`\${a===t?">":" "} \${a}: \${e[o]}\`)}return n.join(\`
\`)}var Fu=new Qt;function F0(i){de._getMatrix(Fu,de.workingColorSpace,i);let t=\`mat3( \${Fu.elements.map(e=>e.toFixed(4))} )\`;switch(de.getTransfer(i)){case cr:return[t,"LinearTransferOETF"];case xe:return[t,"sRGBTransferOETF"];default:return te("WebGLProgram: Unsupported color space: ",i),[t,"LinearTransferOETF"]}}function Ou(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),r=(i.getShaderInfoLog(t)||"").trim();if(n&&r==="")return"";let o=/ERROR: 0:(\\d+)/.exec(r);if(o){let a=parseInt(o[1]);return e.toUpperCase()+\`

\`+r+\`

\`+U0(i.getShaderSource(t),a)}else return r}function O0(i,t){let e=F0(t);return[\`vec4 \${i}( vec4 value ) {\`,\`	return \${e[1]}( vec4( value.rgb * \${e[0]}, value.a ) );\`,"}"].join(\`
\`)}var B0={[oc]:"Linear",[ac]:"Reinhard",[lc]:"Cineon",[Nr]:"ACESFilmic",[hc]:"AgX",[uc]:"Neutral",[cc]:"Custom"};function z0(i,t){let e=B0[t];return e===void 0?(te("WebGLProgram: Unsupported toneMapping:",t),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}var Za=new V;function k0(){de.getLuminanceCoefficients(Za);let i=Za.x.toFixed(4),t=Za.y.toFixed(4),e=Za.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",\`	const vec3 weights = vec3( \${i}, \${t}, \${e} );\`,"	return dot( weights, rgb );","}"].join(\`
\`)}function V0(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Xr).join(\`
\`)}function H0(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(\`
\`)}function G0(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),o=r.name,a=1;r.type===i.FLOAT_MAT2&&(a=2),r.type===i.FLOAT_MAT3&&(a=3),r.type===i.FLOAT_MAT4&&(a=4),e[o]={type:r.type,location:i.getAttribLocation(t,o),locationSize:a}}return e}function Xr(i){return i!==""}function Bu(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,t.numSunLights).replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,t.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function zu(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var W0=/^[ \\t]*#include +<([\\w\\d./]+)>/gm;function Bc(i){return i.replace(W0,q0)}var X0=new Map;function q0(i,t){let e=le[t];if(e===void 0){let n=X0.get(t);if(n!==void 0)e=le[n],te('WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("THREE.WebGLProgram: Can not resolve #include <"+t+">")}return Bc(e)}var Y0=/#pragma unroll_loop_start\\s+for\\s*\\(\\s*int\\s+i\\s*=\\s*(\\d+)\\s*;\\s*i\\s*<\\s*(\\d+)\\s*;\\s*i\\s*\\+\\+\\s*\\)\\s*{([\\s\\S]+?)}\\s+#pragma unroll_loop_end/g;function ku(i){return i.replace(Y0,Z0)}function Z0(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\\[\\s*i\\s*\\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function Vu(i){let t=\`precision \${i.precision} float;
	precision \${i.precision} int;
	precision \${i.precision} sampler2D;
	precision \${i.precision} samplerCube;
	precision \${i.precision} sampler3D;
	precision \${i.precision} sampler2DArray;
	precision \${i.precision} sampler2DShadow;
	precision \${i.precision} samplerCubeShadow;
	precision \${i.precision} sampler2DArrayShadow;
	precision \${i.precision} isampler2D;
	precision \${i.precision} isampler3D;
	precision \${i.precision} isamplerCube;
	precision \${i.precision} isampler2DArray;
	precision \${i.precision} usampler2D;
	precision \${i.precision} usampler3D;
	precision \${i.precision} usamplerCube;
	precision \${i.precision} usampler2DArray;
	\`;return i.precision==="highp"?t+=\`
#define HIGH_PRECISION\`:i.precision==="mediump"?t+=\`
#define MEDIUM_PRECISION\`:i.precision==="lowp"&&(t+=\`
#define LOW_PRECISION\`),t}var J0={[Ki]:"SHADOWMAP_TYPE_PCF",[Vs]:"SHADOWMAP_TYPE_VSM"};function K0(i){return J0[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}var $0={[Ui]:"ENVMAP_TYPE_CUBE",[ji]:"ENVMAP_TYPE_CUBE",[Ur]:"ENVMAP_TYPE_CUBE_UV"};function j0(i){return i.envMap===!1?"ENVMAP_TYPE_CUBE":$0[i.envMapMode]||"ENVMAP_TYPE_CUBE"}var Q0={[ji]:"ENVMAP_MODE_REFRACTION"};function t_(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":Q0[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}var e_={[rc]:"ENVMAP_BLENDING_MULTIPLY",[tu]:"ENVMAP_BLENDING_MIX",[eu]:"ENVMAP_BLENDING_ADD"};function n_(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":e_[i.combine]||"ENVMAP_BLENDING_NONE"}function i_(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),112)),texelHeight:n,maxMip:e}}function s_(i,t,e,n){let s=i.getContext(),r=e.defines,o=e.vertexShader,a=e.fragmentShader,c=K0(e),l=j0(e),h=t_(e),d=n_(e),u=i_(e),p=V0(e),g=H0(r),v=s.createProgram(),m,f,w=e.glslVersion?"#version "+e.glslVersion+\`
\`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Xr).join(\`
\`),m.length>0&&(m+=\`
\`),f=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g].filter(Xr).join(\`
\`),f.length>0&&(f+=\`
\`)):(m=[Vu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.batchingColor?"#define USE_BATCHING_COLOR":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexNormals?"#define HAS_NORMAL":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",\`
\`].filter(Xr).join(\`
\`),f=[Vu(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,g,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+l:"",e.envMap?"#define "+h:"",e.envMap?"#define "+d:"",u?"#define CUBEUV_TEXEL_WIDTH "+u.texelWidth:"",u?"#define CUBEUV_TEXEL_HEIGHT "+u.texelHeight:"",u?"#define CUBEUV_MAX_MIP "+u.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.dispersion?"#define USE_DISPERSION":"",e.retroreflection?"#define USE_RETROREFLECTION":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas||e.batchingColor?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+c:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.numLightProbeGrids>0?"#define USE_LIGHT_PROBES_GRID":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",e.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",e.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Dn?"#define TONE_MAPPING":"",e.toneMapping!==Dn?le.tonemapping_pars_fragment:"",e.toneMapping!==Dn?z0("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",le.colorspace_pars_fragment,O0("linearToOutputTexel",e.outputColorSpace),k0(),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",\`
\`].filter(Xr).join(\`
\`)),o=Bc(o),o=Bu(o,e),o=zu(o,e),a=Bc(a),a=Bu(a,e),a=zu(a,e),o=ku(o),a=ku(a),e.isRawShaderMaterial!==!0&&(w=\`#version 300 es
\`,m=[p,"#define attribute in","#define varying out","#define texture2D texture"].join(\`
\`)+\`
\`+m,f=["#define varying in",e.glslVersion===vc?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===vc?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(\`
\`)+\`
\`+f);let I=w+m+o,x=w+f+a,M=Uu(s,s.VERTEX_SHADER,I),A=Uu(s,s.FRAGMENT_SHADER,x);s.attachShader(v,M),s.attachShader(v,A),e.index0AttributeName!==void 0?s.bindAttribLocation(v,0,e.index0AttributeName):e.hasPositionAttribute===!0&&s.bindAttribLocation(v,0,"position"),s.linkProgram(v);function N(Y){if(i.debug.checkShaderErrors){let Z=s.getProgramInfoLog(v)||"",it=s.getShaderInfoLog(M)||"",G=s.getShaderInfoLog(A)||"",et=Z.trim(),nt=it.trim(),st=G.trim(),Q=!0,at=!0;if(s.getProgramParameter(v,s.LINK_STATUS)===!1)if(Q=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,v,M,A);else{let ct=Ou(s,M,"vertex"),ft=Ou(s,A,"fragment");ne("WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(v,s.VALIDATE_STATUS)+\`

Material Name: \`+Y.name+\`
Material Type: \`+Y.type+\`

Program Info Log: \`+et+\`
\`+ct+\`
\`+ft)}else et!==""?te("WebGLProgram: Program Info Log:",et):(nt===""||st==="")&&(at=!1);at&&(Y.diagnostics={runnable:Q,programLog:et,vertexShader:{log:nt,prefix:m},fragmentShader:{log:st,prefix:f}})}s.deleteShader(M),s.deleteShader(A),y=new Ys(s,v),R=G0(s,v)}let y;this.getUniforms=function(){return y===void 0&&N(this),y};let R;this.getAttributes=function(){return R===void 0&&N(this),R};let k=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return k===!1&&(k=s.getProgramParameter(v,D0)),k},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(v),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=N0++,this.cacheKey=t,this.usedTimes=1,this.program=v,this.vertexShader=M,this.fragmentShader=A,this}var r_=0,zc=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t,e,n){let s=this._getShaderCacheForMaterial(t);return s.has(e)===!1&&(s.add(e),e.usedTimes++),s.has(n)===!1&&(s.add(n),n.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderStage(t){return this._getShaderStage(t.vertexShader)}getFragmentShaderStage(t){return this._getShaderStage(t.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new kc(t),e.set(t,n)),n}},kc=class{constructor(t){this.id=r_++,this.code=t,this.usedTimes=0}};function o_(i){return i===Oi||i===Vr||i===Hr}function a_(i,t,e,n,s,r){let o=new Rs,a=new zc,c=new Set,l=[],h=new Map,d=n.logarithmicDepthBuffer,u=n.precision,p={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function g(y){return c.add(y),y===0?"uv":\`uv\${y}\`}function v(y,R,k,Y,Z,it){let G=Y.fog,et=Z.geometry,nt=y.isMeshStandardMaterial||y.isMeshLambertMaterial||y.isMeshPhongMaterial?Y.environment:null,st=y.isMeshStandardMaterial||y.isMeshLambertMaterial&&!y.envMap||y.isMeshPhongMaterial&&!y.envMap,Q=t.get(y.envMap||nt,st),at=Q&&Q.mapping===Ur?Q.image.height:null,ct=p[y.type];y.precision!==null&&(u=n.getMaxPrecision(y.precision),u!==y.precision&&te("WebGLProgram.getParameters:",y.precision,"not supported, using",u,"instead."));let ft=et.morphAttributes.position||et.morphAttributes.normal||et.morphAttributes.color,It=ft!==void 0?ft.length:0,Nt=0;et.morphAttributes.position!==void 0&&(Nt=1),et.morphAttributes.normal!==void 0&&(Nt=2),et.morphAttributes.color!==void 0&&(Nt=3);let Xt,Wt,qt,z;if(ct){let Dt=Zn[ct];Xt=Dt.vertexShader,Wt=Dt.fragmentShader}else{Xt=y.vertexShader,Wt=y.fragmentShader;let Dt=a.getVertexShaderStage(y),Ht=a.getFragmentShaderStage(y);a.update(y,Dt,Ht),qt=Dt.id,z=Ht.id}let U=i.getRenderTarget(),C=i.state.buffers.depth.getReversed(),L=Z.isInstancedMesh===!0,B=Z.isBatchedMesh===!0,tt=!!y.map,yt=!!y.matcap,T=!!Q,X=!!y.aoMap,F=!!y.lightMap,K=!!y.bumpMap&&y.wireframe===!1,j=!!y.normalMap,gt=!!y.displacementMap,bt=!!y.emissiveMap,wt=!!y.metalnessMap,J=!!y.roughnessMap,S=y.anisotropy>0,Ut=y.clearcoat>0,Ot=y.dispersion>0,b=y.retroreflectivity>0,_=y.iridescence>0,W=y.sheen>0,rt=y.transmission>0,pt=S&&!!y.anisotropyMap,Rt=Ut&&!!y.clearcoatMap,P=Ut&&!!y.clearcoatNormalMap,D=Ut&&!!y.clearcoatRoughnessMap,H=_&&!!y.iridescenceMap,lt=_&&!!y.iridescenceThicknessMap,Et=W&&!!y.sheenColorMap,vt=W&&!!y.sheenRoughnessMap,Mt=!!y.specularMap,Pt=!!y.specularColorMap,Bt=!!y.specularIntensityMap,$t=rt&&!!y.transmissionMap,q=rt&&!!y.thicknessMap,Ct=!!y.gradientMap,xt=!!y.alphaMap,Lt=y.alphaTest>0,Ft=!!y.alphaHash,At=!!y.extensions,ot=Dn;y.toneMapped&&(U===null||U.isXRRenderTarget===!0)&&(ot=i.toneMapping);let Tt={shaderID:ct,shaderType:y.type,shaderName:y.name,vertexShader:Xt,fragmentShader:Wt,defines:y.defines,customVertexShaderID:qt,customFragmentShaderID:z,isRawShaderMaterial:y.isRawShaderMaterial===!0,glslVersion:y.glslVersion,precision:u,batching:B,batchingColor:B&&Z._colorsTexture!==null,instancing:L,instancingColor:L&&Z.instanceColor!==null,instancingMorph:L&&Z.morphTexture!==null,outputColorSpace:U===null?i.outputColorSpace:U.isXRRenderTarget===!0?U.texture.colorSpace:de.workingColorSpace,alphaToCoverage:!!y.alphaToCoverage,map:tt,matcap:yt,envMap:T,envMapMode:T&&Q.mapping,envMapCubeUVHeight:at,aoMap:X,lightMap:F,bumpMap:K,normalMap:j,displacementMap:gt,emissiveMap:bt,normalMapObjectSpace:j&&y.normalMapType===su,normalMapTangentSpace:j&&y.normalMapType===Wa,packedNormalMap:j&&y.normalMapType===Wa&&o_(y.normalMap.format),metalnessMap:wt,roughnessMap:J,anisotropy:S,anisotropyMap:pt,clearcoat:Ut,clearcoatMap:Rt,clearcoatNormalMap:P,clearcoatRoughnessMap:D,dispersion:Ot,retroreflection:b,iridescence:_,iridescenceMap:H,iridescenceThicknessMap:lt,sheen:W,sheenColorMap:Et,sheenRoughnessMap:vt,specularMap:Mt,specularColorMap:Pt,specularIntensityMap:Bt,transmission:rt,transmissionMap:$t,thicknessMap:q,gradientMap:Ct,opaque:y.transparent===!1&&y.blending===Hs&&y.alphaToCoverage===!1,alphaMap:xt,alphaTest:Lt,alphaHash:Ft,combine:y.combine,mapUv:tt&&g(y.map.channel),aoMapUv:X&&g(y.aoMap.channel),lightMapUv:F&&g(y.lightMap.channel),bumpMapUv:K&&g(y.bumpMap.channel),normalMapUv:j&&g(y.normalMap.channel),displacementMapUv:gt&&g(y.displacementMap.channel),emissiveMapUv:bt&&g(y.emissiveMap.channel),metalnessMapUv:wt&&g(y.metalnessMap.channel),roughnessMapUv:J&&g(y.roughnessMap.channel),anisotropyMapUv:pt&&g(y.anisotropyMap.channel),clearcoatMapUv:Rt&&g(y.clearcoatMap.channel),clearcoatNormalMapUv:P&&g(y.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:D&&g(y.clearcoatRoughnessMap.channel),iridescenceMapUv:H&&g(y.iridescenceMap.channel),iridescenceThicknessMapUv:lt&&g(y.iridescenceThicknessMap.channel),sheenColorMapUv:Et&&g(y.sheenColorMap.channel),sheenRoughnessMapUv:vt&&g(y.sheenRoughnessMap.channel),specularMapUv:Mt&&g(y.specularMap.channel),specularColorMapUv:Pt&&g(y.specularColorMap.channel),specularIntensityMapUv:Bt&&g(y.specularIntensityMap.channel),transmissionMapUv:$t&&g(y.transmissionMap.channel),thicknessMapUv:q&&g(y.thicknessMap.channel),alphaMapUv:xt&&g(y.alphaMap.channel),vertexTangents:!!et.attributes.tangent&&(j||S),vertexNormals:!!et.attributes.normal,vertexColors:y.vertexColors,vertexAlphas:y.vertexColors===!0&&!!et.attributes.color&&et.attributes.color.itemSize===4,pointsUvs:Z.isPoints===!0&&!!et.attributes.uv&&(tt||xt),fog:!!G,useFog:y.fog===!0,fogExp2:!!G&&G.isFogExp2,flatShading:y.wireframe===!1&&(y.flatShading===!0||et.attributes.normal===void 0&&j===!1&&(y.isMeshLambertMaterial||y.isMeshPhongMaterial||y.isMeshStandardMaterial||y.isMeshPhysicalMaterial)),sizeAttenuation:y.sizeAttenuation===!0,logarithmicDepthBuffer:d,reversedDepthBuffer:C,skinning:Z.isSkinnedMesh===!0,hasPositionAttribute:et.attributes.position!==void 0,morphTargets:et.morphAttributes.position!==void 0,morphNormals:et.morphAttributes.normal!==void 0,morphColors:et.morphAttributes.color!==void 0,morphTargetsCount:It,morphTextureStride:Nt,numSunLights:R.sun.length,numDirLights:R.directional.length,numPointLights:R.point.length,numSpotLights:R.spot.length,numSpotLightMaps:R.spotLightMap.length,numRectAreaLights:R.rectArea.length,numHemiLights:R.hemi.length,numSunLightShadows:R.sunShadowMap.length,numDirLightShadows:R.directionalShadowMap.length,numPointLightShadows:R.pointShadowMap.length,numSpotLightShadows:R.spotShadowMap.length,numSpotLightShadowsWithMaps:R.numSpotLightShadowsWithMaps,numLightProbes:R.numLightProbes,numLightProbeGrids:it.length,numClippingPlanes:r.numPlanes,numClipIntersection:r.numIntersection,dithering:y.dithering,shadowMapEnabled:i.shadowMap.enabled&&k.length>0,shadowMapType:i.shadowMap.type,toneMapping:ot,decodeVideoTexture:tt&&y.map.isVideoTexture===!0&&de.getTransfer(y.map.colorSpace)===xe,decodeVideoTextureEmissive:bt&&y.emissiveMap.isVideoTexture===!0&&de.getTransfer(y.emissiveMap.colorSpace)===xe,premultipliedAlpha:y.premultipliedAlpha,doubleSided:y.side===Fe,flipSided:y.side===sn,useDepthPacking:y.depthPacking>=0,depthPacking:y.depthPacking||0,index0AttributeName:y.index0AttributeName,extensionClipCullDistance:At&&y.extensions.clipCullDistance===!0&&e.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(At&&y.extensions.multiDraw===!0||B)&&e.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:e.has("KHR_parallel_shader_compile"),customProgramCacheKey:y.customProgramCacheKey()};return Tt.vertexUv1s=c.has(1),Tt.vertexUv2s=c.has(2),Tt.vertexUv3s=c.has(3),c.clear(),Tt}function m(y){let R=[];if(y.shaderID?R.push(y.shaderID):(R.push(y.customVertexShaderID),R.push(y.customFragmentShaderID)),y.defines!==void 0)for(let k in y.defines)R.push(k),R.push(y.defines[k]);return y.isRawShaderMaterial===!1&&(f(R,y),w(R,y),R.push(i.outputColorSpace)),R.push(y.customProgramCacheKey),R.join()}function f(y,R){y.push(R.precision),y.push(R.outputColorSpace),y.push(R.envMapMode),y.push(R.envMapCubeUVHeight),y.push(R.mapUv),y.push(R.alphaMapUv),y.push(R.lightMapUv),y.push(R.aoMapUv),y.push(R.bumpMapUv),y.push(R.normalMapUv),y.push(R.displacementMapUv),y.push(R.emissiveMapUv),y.push(R.metalnessMapUv),y.push(R.roughnessMapUv),y.push(R.anisotropyMapUv),y.push(R.clearcoatMapUv),y.push(R.clearcoatNormalMapUv),y.push(R.clearcoatRoughnessMapUv),y.push(R.iridescenceMapUv),y.push(R.iridescenceThicknessMapUv),y.push(R.sheenColorMapUv),y.push(R.sheenRoughnessMapUv),y.push(R.specularMapUv),y.push(R.specularColorMapUv),y.push(R.specularIntensityMapUv),y.push(R.transmissionMapUv),y.push(R.thicknessMapUv),y.push(R.combine),y.push(R.fogExp2),y.push(R.sizeAttenuation),y.push(R.morphTargetsCount),y.push(R.morphAttributeCount),y.push(R.numSunLights),y.push(R.numDirLights),y.push(R.numPointLights),y.push(R.numSpotLights),y.push(R.numSpotLightMaps),y.push(R.numHemiLights),y.push(R.numRectAreaLights),y.push(R.numSunLightShadows),y.push(R.numDirLightShadows),y.push(R.numPointLightShadows),y.push(R.numSpotLightShadows),y.push(R.numSpotLightShadowsWithMaps),y.push(R.numLightProbes),y.push(R.shadowMapType),y.push(R.toneMapping),y.push(R.numClippingPlanes),y.push(R.numClipIntersection),y.push(R.depthPacking)}function w(y,R){o.disableAll(),R.instancing&&o.enable(0),R.instancingColor&&o.enable(1),R.instancingMorph&&o.enable(2),R.matcap&&o.enable(3),R.envMap&&o.enable(4),R.normalMapObjectSpace&&o.enable(5),R.normalMapTangentSpace&&o.enable(6),R.clearcoat&&o.enable(7),R.iridescence&&o.enable(8),R.alphaTest&&o.enable(9),R.vertexColors&&o.enable(10),R.vertexAlphas&&o.enable(11),R.vertexUv1s&&o.enable(12),R.vertexUv2s&&o.enable(13),R.vertexUv3s&&o.enable(14),R.vertexTangents&&o.enable(15),R.anisotropy&&o.enable(16),R.alphaHash&&o.enable(17),R.batching&&o.enable(18),R.dispersion&&o.enable(19),R.retroreflection&&o.enable(24),R.batchingColor&&o.enable(20),R.gradientMap&&o.enable(21),R.packedNormalMap&&o.enable(22),R.vertexNormals&&o.enable(23),y.push(o.mask),o.disableAll(),R.fog&&o.enable(0),R.useFog&&o.enable(1),R.flatShading&&o.enable(2),R.logarithmicDepthBuffer&&o.enable(3),R.reversedDepthBuffer&&o.enable(4),R.skinning&&o.enable(5),R.morphTargets&&o.enable(6),R.morphNormals&&o.enable(7),R.morphColors&&o.enable(8),R.premultipliedAlpha&&o.enable(9),R.shadowMapEnabled&&o.enable(10),R.doubleSided&&o.enable(11),R.flipSided&&o.enable(12),R.useDepthPacking&&o.enable(13),R.dithering&&o.enable(14),R.transmission&&o.enable(15),R.sheen&&o.enable(16),R.opaque&&o.enable(17),R.pointsUvs&&o.enable(18),R.decodeVideoTexture&&o.enable(19),R.decodeVideoTextureEmissive&&o.enable(20),R.alphaToCoverage&&o.enable(21),R.numLightProbeGrids>0&&o.enable(22),R.hasPositionAttribute&&o.enable(23),y.push(o.mask)}function I(y){let R=p[y.type],k;if(R){let Y=Zn[R];k=Mu.clone(Y.uniforms)}else k=y.uniforms;return k}function x(y,R){let k=h.get(R);return k!==void 0?++k.usedTimes:(k=new s_(i,R,y,s),l.push(k),h.set(R,k)),k}function M(y){if(--y.usedTimes===0){let R=l.indexOf(y);l[R]=l[l.length-1],l.pop(),h.delete(y.cacheKey),y.destroy()}}function A(y){a.remove(y)}function N(){a.dispose()}return{getParameters:v,getProgramCacheKey:m,getUniforms:I,acquireProgram:x,releaseProgram:M,releaseShaderCache:A,programs:l,dispose:N}}function l_(){let i=new WeakMap;function t(o){return i.has(o)}function e(o){let a=i.get(o);return a===void 0&&(a={},i.set(o,a)),a}function n(o){i.delete(o)}function s(o,a,c){i.get(o)[a]=c}function r(){i=new WeakMap}return{has:t,get:e,remove:n,update:s,dispose:r}}function c_(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.materialVariant!==t.materialVariant?i.materialVariant-t.materialVariant:i.z!==t.z?i.z-t.z:i.id-t.id}function Hu(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function Gu(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function o(u){let p=0;return u.isInstancedMesh&&(p+=2),u.isSkinnedMesh&&(p+=1),p}function a(u,p,g,v,m,f){let w=i[t];return w===void 0?(w={id:u.id,object:u,geometry:p,material:g,materialVariant:o(u),groupOrder:v,renderOrder:u.renderOrder,z:m,group:f},i[t]=w):(w.id=u.id,w.object=u,w.geometry=p,w.material=g,w.materialVariant=o(u),w.groupOrder=v,w.renderOrder=u.renderOrder,w.z=m,w.group=f),t++,w}function c(u,p,g,v,m,f,w){w.reversedDepth===!0&&(m=-m);let I=a(u,p,g,v,m,f);g.transmission>0?n.push(I):g.transparent===!0?s.push(I):e.push(I)}function l(u,p,g,v,m,f){let w=a(u,p,g,v,m,f);g.transmission>0?n.unshift(w):g.transparent===!0?s.unshift(w):e.unshift(w)}function h(u,p){e.length>1&&e.sort(u||c_),n.length>1&&n.sort(p||Hu),s.length>1&&s.sort(p||Hu)}function d(){for(let u=t,p=i.length;u<p;u++){let g=i[u];if(g.id===null)break;g.id=null,g.object=null,g.geometry=null,g.material=null,g.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:c,unshift:l,finish:d,sort:h}}function h_(){let i=new WeakMap;function t(n,s){let r=i.get(n),o;return r===void 0?(o=new Gu,i.set(n,[o])):s>=r.length?(o=new Gu,r.push(o)):o=r[s],o}function e(){i=new WeakMap}return{get:t,dispose:e}}function u_(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={direction:new V,color:new ie};break;case"SpotLight":e={position:new V,direction:new V,color:new ie,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new V,color:new ie,distance:0,decay:0};break;case"HemisphereLight":e={direction:new V,skyColor:new ie,groundColor:new ie};break;case"RectAreaLight":e={color:new ie,position:new V,halfWidth:new V,halfHeight:new V};break}return i[t.id]=e,e}}}function d_(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"SunLight":case"DirectionalLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new mt};break;case"SpotLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new mt};break;case"PointLight":e={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new mt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var f_=0;function p_(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function m_(i){let t=new u_,e=d_(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new V);let s=new V,r=new we,o=new we;function a(l){let h=0,d=0,u=0;for(let Z=0;Z<9;Z++)n.probe[Z].set(0,0,0);let p=0,g=0,v=0,m=0,f=0,w=0,I=0,x=0,M=0,A=0,N=0,y=0,R=0,k=0;l.sort(p_);for(let Z=0,it=l.length;Z<it;Z++){let G=l[Z],et=G.color,nt=G.intensity,st=G.distance,Q=null;if(G.shadow&&G.shadow.map&&(G.shadow.map.texture.format===Oi?Q=G.shadow.map.texture:Q=G.shadow.map.depthTexture||G.shadow.map.texture),G.isAmbientLight)h+=et.r*nt,d+=et.g*nt,u+=et.b*nt;else if(G.isLightProbe){for(let at=0;at<9;at++)n.probe[at].addScaledVector(G.sh.coefficients[at],nt);k++}else if(G.isSunLight){let at=t.get(G);if(at.color.copy(G.color).multiplyScalar(G.intensity),G.castShadow){let ct=G.shadow,ft=e.get(G);ft.shadowIntensity=ct.intensity,ft.shadowBias=ct.bias,ft.shadowNormalBias=ct.normalBias,ft.shadowRadius=ct.radius,ft.shadowMapSize.copy(ct.mapSize).multiply(ct.getFrameExtents()),n.sunShadow[g]=ft,n.sunShadowMap[g]=Q;let It=ct.getViewportCount();for(let Nt=0;Nt<It;Nt++)n.sunShadowMatrix[v+Nt]=ct.getMatrix(Nt),n.sunShadowCascade[v+Nt]=ct._cascadeData[Nt];v+=It,g++}n.sun[p]=at,p++}else if(G.isDirectionalLight){let at=t.get(G);if(at.color.copy(G.color).multiplyScalar(G.intensity),G.castShadow){let ct=G.shadow,ft=e.get(G);ft.shadowIntensity=ct.intensity,ft.shadowBias=ct.bias,ft.shadowNormalBias=ct.normalBias,ft.shadowRadius=ct.radius,ft.shadowMapSize=ct.mapSize,n.directionalShadow[m]=ft,n.directionalShadowMap[m]=Q,n.directionalShadowMatrix[m]=G.shadow.matrix,M++}n.directional[m]=at,m++}else if(G.isSpotLight){let at=t.get(G);at.position.setFromMatrixPosition(G.matrixWorld),at.color.copy(et).multiplyScalar(nt),at.distance=st,at.coneCos=Math.cos(G.angle),at.penumbraCos=Math.cos(G.angle*(1-G.penumbra)),at.decay=G.decay,n.spot[w]=at;let ct=G.shadow;if(G.map&&(n.spotLightMap[y]=G.map,y++,ct.updateMatrices(G),G.castShadow&&R++),n.spotLightMatrix[w]=ct.matrix,G.castShadow){let ft=e.get(G);ft.shadowIntensity=ct.intensity,ft.shadowBias=ct.bias,ft.shadowNormalBias=ct.normalBias,ft.shadowRadius=ct.radius,ft.shadowMapSize=ct.mapSize,n.spotShadow[w]=ft,n.spotShadowMap[w]=Q,N++}w++}else if(G.isRectAreaLight){let at=t.get(G);at.color.copy(et).multiplyScalar(nt),at.halfWidth.set(G.width*.5,0,0),at.halfHeight.set(0,G.height*.5,0),n.rectArea[I]=at,I++}else if(G.isPointLight){let at=t.get(G);if(at.color.copy(G.color).multiplyScalar(G.intensity),at.distance=G.distance,at.decay=G.decay,G.castShadow){let ct=G.shadow,ft=e.get(G);ft.shadowIntensity=ct.intensity,ft.shadowBias=ct.bias,ft.shadowNormalBias=ct.normalBias,ft.shadowRadius=ct.radius,ft.shadowMapSize=ct.mapSize,ft.shadowCameraNear=ct.camera.near,ft.shadowCameraFar=ct.camera.far,n.pointShadow[f]=ft,n.pointShadowMap[f]=Q,n.pointShadowMatrix[f]=G.shadow.matrix,A++}n.point[f]=at,f++}else if(G.isHemisphereLight){let at=t.get(G);at.skyColor.copy(G.color).multiplyScalar(nt),at.groundColor.copy(G.groundColor).multiplyScalar(nt),n.hemi[x]=at,x++}}I>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=zt.LTC_FLOAT_1,n.rectAreaLTC2=zt.LTC_FLOAT_2):(n.rectAreaLTC1=zt.LTC_HALF_1,n.rectAreaLTC2=zt.LTC_HALF_2)),n.ambient[0]=h,n.ambient[1]=d,n.ambient[2]=u;let Y=n.hash;(Y.sunLength!==p||Y.directionalLength!==m||Y.pointLength!==f||Y.spotLength!==w||Y.rectAreaLength!==I||Y.hemiLength!==x||Y.numSunShadows!==g||Y.numDirectionalShadows!==M||Y.numPointShadows!==A||Y.numSpotShadows!==N||Y.numSpotMaps!==y||Y.numLightProbes!==k)&&(n.sun.length=p,n.directional.length=m,n.spot.length=w,n.rectArea.length=I,n.point.length=f,n.hemi.length=x,n.sunShadow.length=g,n.sunShadowMap.length=g,n.sunShadowMatrix.length=v,n.sunShadowCascade.length=v,n.directionalShadow.length=M,n.directionalShadowMap.length=M,n.directionalShadowMatrix.length=M,n.pointShadow.length=A,n.pointShadowMap.length=A,n.pointShadowMatrix.length=A,n.spotShadow.length=N,n.spotShadowMap.length=N,n.spotLightMatrix.length=N+y-R,n.spotLightMap.length=y,n.numSpotLightShadowsWithMaps=R,n.numLightProbes=k,Y.sunLength=p,Y.directionalLength=m,Y.pointLength=f,Y.spotLength=w,Y.rectAreaLength=I,Y.hemiLength=x,Y.numSunShadows=g,Y.numDirectionalShadows=M,Y.numPointShadows=A,Y.numSpotShadows=N,Y.numSpotMaps=y,Y.numLightProbes=k,n.version=f_++)}function c(l,h){let d=0,u=0,p=0,g=0,v=0,m=0,f=h.matrixWorldInverse;for(let w=0,I=l.length;w<I;w++){let x=l[w];if(x.isSunLight){let M=n.sun[d];M.direction.setFromMatrixPosition(x.matrixWorld),M.direction.transformDirection(f),d++}else if(x.isDirectionalLight){let M=n.directional[u];M.direction.setFromMatrixPosition(x.matrixWorld),s.setFromMatrixPosition(x.target.matrixWorld),M.direction.sub(s),M.direction.transformDirection(f),u++}else if(x.isSpotLight){let M=n.spot[g];M.position.setFromMatrixPosition(x.matrixWorld),M.position.applyMatrix4(f),M.direction.setFromMatrixPosition(x.matrixWorld),s.setFromMatrixPosition(x.target.matrixWorld),M.direction.sub(s),M.direction.transformDirection(f),g++}else if(x.isRectAreaLight){let M=n.rectArea[v];M.position.setFromMatrixPosition(x.matrixWorld),M.position.applyMatrix4(f),o.identity(),r.copy(x.matrixWorld),r.premultiply(f),o.extractRotation(r),M.halfWidth.set(x.width*.5,0,0),M.halfHeight.set(0,x.height*.5,0),M.halfWidth.applyMatrix4(o),M.halfHeight.applyMatrix4(o),v++}else if(x.isPointLight){let M=n.point[p];M.position.setFromMatrixPosition(x.matrixWorld),M.position.applyMatrix4(f),p++}else if(x.isHemisphereLight){let M=n.hemi[m];M.direction.setFromMatrixPosition(x.matrixWorld),M.direction.transformDirection(f),m++}}}return{setup:a,setupView:c,state:n}}function Wu(i){let t=new m_(i),e=[],n=[],s=[];function r(u){d.camera=u,e.length=0,n.length=0,s.length=0}function o(u){e.push(u)}function a(u){n.push(u)}function c(u){s.push(u)}function l(){t.setup(e)}function h(u){t.setupView(e,u)}let d={lightsArray:e,shadowsArray:n,lightProbeGridArray:s,camera:null,lights:t,transmissionRenderTarget:{},textureUnits:0};return{init:r,state:d,setupLights:l,setupLightsView:h,pushLight:o,pushShadow:a,pushLightProbeGrid:c}}function g_(i){let t=new WeakMap;function e(s,r=0){let o=t.get(s),a;return o===void 0?(a=new Wu(i),t.set(s,[a])):r>=o.length?(a=new Wu(i),o.push(a)):a=o[r],a}function n(){t=new WeakMap}return{get:e,dispose:n}}var __=\`void main() {
	gl_Position = vec4( position, 1.0 );
}\`,x_=\`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}\`,y_=[new V(1,0,0),new V(-1,0,0),new V(0,1,0),new V(0,-1,0),new V(0,0,1),new V(0,0,-1)],v_=[new V(0,-1,0),new V(0,-1,0),new V(0,0,1),new V(0,0,-1),new V(0,-1,0),new V(0,-1,0)],Xu=new we,Wr=new V,Dc=new V;function S_(i,t,e){let n=new Is,s=new mt,r=new mt,o=new Re,a=new qo,c=new Yo,l={},h=e.maxTextureSize,d={[Ni]:sn,[sn]:Ni,[Fe]:Fe},u=new pn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new mt},radius:{value:4}},vertexShader:__,fragmentShader:x_}),p=u.clone();p.defines.HORIZONTAL_PASS=1;let g=new Le;g.setAttribute("position",new vn(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let v=new on(g,u),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Ki;let f=this.type;this.render=function(A,N,y){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||A.length===0)return;this.type===Uh&&(te("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Ki);let R=i.getRenderTarget(),k=i.getActiveCubeFace(),Y=i.getActiveMipmapLevel(),Z=i.state;Z.setBlending(qn),Z.buffers.depth.getReversed()===!0?Z.buffers.color.setClear(0,0,0,0):Z.buffers.color.setClear(1,1,1,1),Z.buffers.depth.setTest(!0),Z.setScissorTest(!1);let it=f!==this.type;it&&N.traverse(function(G){G.material&&(Array.isArray(G.material)?G.material.forEach(et=>et.needsUpdate=!0):G.material.needsUpdate=!0)});for(let G=0,et=A.length;G<et;G++){let nt=A[G],st=nt.shadow;if(st===void 0){te("WebGLShadowMap:",nt,"has no shadow.");continue}if(st.autoUpdate===!1&&st.needsUpdate===!1)continue;s.copy(st.mapSize);let Q=st.getFrameExtents();s.multiply(Q),r.copy(st.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/Q.x),s.x=r.x*Q.x,st.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/Q.y),s.y=r.y*Q.y,st.mapSize.y=r.y));let at=i.state.buffers.depth.getReversed();if(st.camera._reversedDepth=at,st.map===null||it===!0){if(st.map!==null&&(st.map.depthTexture!==null&&(st.map.depthTexture.dispose(),st.map.depthTexture=null),st.map.dispose()),this.type===Vs){if(nt.isPointLight){te("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}st.map=new rn(s.x,s.y,{format:Oi,type:Fn,minFilter:Pe,magFilter:Pe,generateMipmaps:!1}),st.map.texture.name=nt.name+".shadowMap",st.map.depthTexture=new Ei(s.x,s.y,Un),st.map.depthTexture.name=nt.name+".shadowMapDepth",st.map.depthTexture.format=Gn,st.map.depthTexture.compareFunction=null,st.map.depthTexture.minFilter=Ge,st.map.depthTexture.magFilter=Ge}else nt.isPointLight?(st.map=new Ka(s.x),st.map.depthTexture=new Bo(s.x,Nn)):(st.map=new rn(s.x,s.y),st.map.depthTexture=new Ei(s.x,s.y,Nn)),st.map.depthTexture.name=nt.name+".shadowMap",st.map.depthTexture.format=Gn,this.type===Ki?(st.map.depthTexture.compareFunction=at?qa:Xa,st.map.depthTexture.minFilter=Pe,st.map.depthTexture.magFilter=Pe):(st.map.depthTexture.compareFunction=null,st.map.depthTexture.minFilter=Ge,st.map.depthTexture.magFilter=Ge);st.camera.updateProjectionMatrix()}st.map.isWebGLCubeRenderTarget!==!0&&(st.map.width!==s.x||st.map.height!==s.y)&&st.map.setSize(s.x,s.y);let ct=st.map.isWebGLCubeRenderTarget?6:st.getViewportCount();nt.isPointLight!==!0&&st.updateMatrices(nt,y);for(let ft=0;ft<ct;ft++){let It=st.getCamera(ft);if(nt.isPointLight){let Nt=st.camera,Xt=st.matrix,Wt=nt.distance||Nt.far;Wt!==Nt.far&&(Nt.far=Wt,Nt.updateProjectionMatrix()),Wr.setFromMatrixPosition(nt.matrixWorld),Nt.position.copy(Wr),Dc.copy(Nt.position),Dc.add(y_[ft]),Nt.up.copy(v_[ft]),Nt.lookAt(Dc),Nt.updateMatrixWorld(),Xt.makeTranslation(-Wr.x,-Wr.y,-Wr.z),Xu.multiplyMatrices(Nt.projectionMatrix,Nt.matrixWorldInverse),st._frustum.setFromProjectionMatrix(Xu,Nt.coordinateSystem,Nt.reversedDepth)}if(st.map.isWebGLCubeRenderTarget)i.setRenderTarget(st.map,ft),i.clear();else{ft===0&&(i.setRenderTarget(st.map),i.clear());let Nt=st.getViewport(ft);o.set(r.x*Nt.x,r.y*Nt.y,r.x*Nt.z,r.y*Nt.w),Z.viewport(o)}n=st.getFrustum(ft),x(N,y,It,nt,this.type)}st.isPointLightShadow!==!0&&this.type===Vs&&w(st,y),st.needsUpdate=!1}f=this.type,m.needsUpdate=!1,i.setRenderTarget(R,k,Y)};function w(A,N){let y=t.update(v);u.defines.VSM_SAMPLES!==A.blurSamples&&(u.defines.VSM_SAMPLES=A.blurSamples,p.defines.VSM_SAMPLES=A.blurSamples,u.needsUpdate=!0,p.needsUpdate=!0),A.mapPass===null?A.mapPass=new rn(s.x,s.y,{format:Oi,type:Fn}):(A.mapPass.width!==A.map.width||A.mapPass.height!==A.map.height)&&A.mapPass.setSize(A.map.width,A.map.height),u.uniforms.shadow_pass.value=A.map.depthTexture,u.uniforms.resolution.value.set(A.map.width,A.map.height),u.uniforms.radius.value=A.radius,i.setRenderTarget(A.mapPass),i.clear(),i.renderBufferDirect(N,null,y,u,v,null),p.uniforms.shadow_pass.value=A.mapPass.texture,p.uniforms.resolution.value.set(A.map.width,A.map.height),p.uniforms.radius.value=A.radius,i.setRenderTarget(A.map),i.clear(),i.renderBufferDirect(N,null,y,p,v,null)}function I(A,N,y,R){let k=null,Y=y.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(Y!==void 0)k=Y;else if(k=y.isPointLight===!0?c:a,i.localClippingEnabled&&N.clipShadows===!0&&Array.isArray(N.clippingPlanes)&&N.clippingPlanes.length!==0||N.displacementMap&&N.displacementScale!==0||N.alphaMap&&N.alphaTest>0||N.map&&N.alphaTest>0||N.alphaToCoverage===!0){let Z=k.uuid,it=N.uuid,G=l[Z];G===void 0&&(G={},l[Z]=G);let et=G[it];et===void 0&&(et=k.clone(),G[it]=et,N.addEventListener("dispose",M)),k=et}if(k.visible=N.visible,k.wireframe=N.wireframe,R===Vs?k.side=N.shadowSide!==null?N.shadowSide:N.side:k.side=N.shadowSide!==null?N.shadowSide:d[N.side],k.alphaMap=N.alphaMap,k.alphaTest=N.alphaToCoverage===!0?.5:N.alphaTest,k.map=N.map,k.clipShadows=N.clipShadows,k.clippingPlanes=N.clippingPlanes,k.clipIntersection=N.clipIntersection,k.displacementMap=N.displacementMap,k.displacementScale=N.displacementScale,k.displacementBias=N.displacementBias,k.wireframeLinewidth=N.wireframeLinewidth,k.linewidth=N.linewidth,y.isPointLight===!0&&k.isMeshDistanceMaterial===!0){let Z=i.properties.get(k);Z.light=y}return k}function x(A,N,y,R,k){if(A.visible===!1)return;if(A.layers.test(N.layers)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&k===Vs)&&(!A.frustumCulled||A.intersectsFrustum(n))){A.modelViewMatrix.multiplyMatrices(y.matrixWorldInverse,A.matrixWorld);let it=t.update(A),G=A.material;if(Array.isArray(G)){let et=it.groups;for(let nt=0,st=et.length;nt<st;nt++){let Q=et[nt],at=G[Q.materialIndex];if(at&&at.visible){let ct=I(A,at,R,k);A.onBeforeShadow(i,A,N,y,it,ct,Q),i.renderBufferDirect(y,null,it,ct,A,Q),A.onAfterShadow(i,A,N,y,it,ct,Q)}}}else if(G.visible){let et=I(A,G,R,k);A.onBeforeShadow(i,A,N,y,it,et,null),i.renderBufferDirect(y,null,it,et,A,null),A.onAfterShadow(i,A,N,y,it,et,null)}}let Z=A.children;for(let it=0,G=Z.length;it<G;it++)x(Z[it],N,y,R,k)}function M(A){A.target.removeEventListener("dispose",M);for(let y in l){let R=l[y],k=A.target.uuid;k in R&&(R[k].dispose(),delete R[k])}}}function M_(i,t){function e(){let q=!1,Ct=new Re,xt=null,Lt=new Re(0,0,0,0);return{setMask:function(Ft){xt!==Ft&&!q&&(i.colorMask(Ft,Ft,Ft,Ft),xt=Ft)},setLocked:function(Ft){q=Ft},setClear:function(Ft,At,ot,Tt,Dt){Dt===!0&&(Ft*=Tt,At*=Tt,ot*=Tt),Ct.set(Ft,At,ot,Tt),Lt.equals(Ct)===!1&&(i.clearColor(Ft,At,ot,Tt),Lt.copy(Ct))},reset:function(){q=!1,xt=null,Lt.set(-1,0,0,0)}}}function n(){let q=!1,Ct=!1,xt=null,Lt=null,Ft=null;return{setReversed:function(At){if(Ct!==At){let ot=t.get("EXT_clip_control");At?ot.clipControlEXT(ot.LOWER_LEFT_EXT,ot.ZERO_TO_ONE_EXT):ot.clipControlEXT(ot.LOWER_LEFT_EXT,ot.NEGATIVE_ONE_TO_ONE_EXT),Ct=At;let Tt=Ft;Ft=null,this.setClear(Tt)}},getReversed:function(){return Ct},setTest:function(At){At?U(i.DEPTH_TEST):C(i.DEPTH_TEST)},setMask:function(At){xt!==At&&!q&&(i.depthMask(At),xt=At)},setFunc:function(At){if(Ct&&(At=gu[At]),Lt!==At){switch(At){case Eo:i.depthFunc(i.NEVER);break;case wo:i.depthFunc(i.ALWAYS);break;case To:i.depthFunc(i.LESS);break;case Ms:i.depthFunc(i.LEQUAL);break;case Ao:i.depthFunc(i.EQUAL);break;case Ro:i.depthFunc(i.GEQUAL);break;case Co:i.depthFunc(i.GREATER);break;case Po:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}Lt=At}},setLocked:function(At){q=At},setClear:function(At){Ft!==At&&(Ft=At,Ct&&(At=1-At),i.clearDepth(At))},reset:function(){q=!1,xt=null,Lt=null,Ft=null,Ct=!1}}}function s(){let q=!1,Ct=null,xt=null,Lt=null,Ft=null,At=null,ot=null,Tt=null,Dt=null;return{setTest:function(Ht){q||(Ht?U(i.STENCIL_TEST):C(i.STENCIL_TEST))},setMask:function(Ht){Ct!==Ht&&!q&&(i.stencilMask(Ht),Ct=Ht)},setFunc:function(Ht,O,ht){(xt!==Ht||Lt!==O||Ft!==ht)&&(i.stencilFunc(Ht,O,ht),xt=Ht,Lt=O,Ft=ht)},setOp:function(Ht,O,ht){(At!==Ht||ot!==O||Tt!==ht)&&(i.stencilOp(Ht,O,ht),At=Ht,ot=O,Tt=ht)},setLocked:function(Ht){q=Ht},setClear:function(Ht){Dt!==Ht&&(i.clearStencil(Ht),Dt=Ht)},reset:function(){q=!1,Ct=null,xt=null,Lt=null,Ft=null,At=null,ot=null,Tt=null,Dt=null}}}let r=new e,o=new n,a=new s,c=new WeakMap,l=new WeakMap,h={},d={},u={},p=new WeakMap,g=[],v=null,m=!1,f=null,w=null,I=null,x=null,M=null,A=null,N=null,y=new ie(0,0,0),R=0,k=!1,Y=null,Z=null,it=null,G=null,et=null,nt=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),st=!1,Q=0,at=i.getParameter(i.VERSION);at.indexOf("WebGL")!==-1?(Q=parseFloat(/^WebGL (\\d)/.exec(at)[1]),st=Q>=1):at.indexOf("OpenGL ES")!==-1&&(Q=parseFloat(/^OpenGL ES (\\d)/.exec(at)[1]),st=Q>=2);let ct=null,ft={},It=i.getParameter(i.SCISSOR_BOX),Nt=i.getParameter(i.VIEWPORT),Xt=new Re().fromArray(It),Wt=new Re().fromArray(Nt);function qt(q,Ct,xt,Lt){let Ft=new Uint8Array(4),At=i.createTexture();i.bindTexture(q,At),i.texParameteri(q,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(q,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let ot=0;ot<xt;ot++)q===i.TEXTURE_3D||q===i.TEXTURE_2D_ARRAY?i.texImage3D(Ct,0,i.RGBA,1,1,Lt,0,i.RGBA,i.UNSIGNED_BYTE,Ft):i.texImage2D(Ct+ot,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,Ft);return At}let z={};z[i.TEXTURE_2D]=qt(i.TEXTURE_2D,i.TEXTURE_2D,1),z[i.TEXTURE_CUBE_MAP]=qt(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),z[i.TEXTURE_2D_ARRAY]=qt(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),z[i.TEXTURE_3D]=qt(i.TEXTURE_3D,i.TEXTURE_3D,1,1),r.setClear(0,0,0,1),o.setClear(1),a.setClear(0),U(i.DEPTH_TEST),o.setFunc(Ms),K(!1),j(tc),U(i.CULL_FACE),X(qn);function U(q){h[q]!==!0&&(i.enable(q),h[q]=!0)}function C(q){h[q]!==!1&&(i.disable(q),h[q]=!1)}function L(q,Ct){return u[q]!==Ct?(i.bindFramebuffer(q,Ct),u[q]=Ct,q===i.DRAW_FRAMEBUFFER&&(u[i.FRAMEBUFFER]=Ct),q===i.FRAMEBUFFER&&(u[i.DRAW_FRAMEBUFFER]=Ct),!0):!1}function B(q,Ct){let xt=g,Lt=!1;if(q){xt=p.get(Ct),xt===void 0&&(xt=[],p.set(Ct,xt));let Ft=q.textures;if(xt.length!==Ft.length||xt[0]!==i.COLOR_ATTACHMENT0){for(let At=0,ot=Ft.length;At<ot;At++)xt[At]=i.COLOR_ATTACHMENT0+At;xt.length=Ft.length,Lt=!0}}else xt[0]!==i.BACK&&(xt[0]=i.BACK,Lt=!0);Lt&&i.drawBuffers(xt)}function tt(q){return v!==q?(i.useProgram(q),v=q,!0):!1}let yt={[$i]:i.FUNC_ADD,[Oh]:i.FUNC_SUBTRACT,[Bh]:i.FUNC_REVERSE_SUBTRACT};yt[zh]=i.MIN,yt[kh]=i.MAX;let T={[Vh]:i.ZERO,[Hh]:i.ONE,[Gh]:i.SRC_COLOR,[ic]:i.SRC_ALPHA,[Jh]:i.SRC_ALPHA_SATURATE,[Yh]:i.DST_COLOR,[Xh]:i.DST_ALPHA,[Wh]:i.ONE_MINUS_SRC_COLOR,[sc]:i.ONE_MINUS_SRC_ALPHA,[Zh]:i.ONE_MINUS_DST_COLOR,[qh]:i.ONE_MINUS_DST_ALPHA,[Kh]:i.CONSTANT_COLOR,[$h]:i.ONE_MINUS_CONSTANT_COLOR,[jh]:i.CONSTANT_ALPHA,[Qh]:i.ONE_MINUS_CONSTANT_ALPHA};function X(q,Ct,xt,Lt,Ft,At,ot,Tt,Dt,Ht){if(q===qn){m===!0&&(C(i.BLEND),m=!1);return}if(m===!1&&(U(i.BLEND),m=!0),q!==Fh){if(q!==f||Ht!==k){if((w!==$i||M!==$i)&&(i.blendEquation(i.FUNC_ADD),w=$i,M=$i),Ht)switch(q){case Hs:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Dr:i.blendFunc(i.ONE,i.ONE);break;case ec:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case nc:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:ne("WebGLState: Invalid blending: ",q);break}else switch(q){case Hs:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Dr:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case ec:ne("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case nc:ne("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:ne("WebGLState: Invalid blending: ",q);break}I=null,x=null,A=null,N=null,y.set(0,0,0),R=0,f=q,k=Ht}return}Ft=Ft||Ct,At=At||xt,ot=ot||Lt,(Ct!==w||Ft!==M)&&(i.blendEquationSeparate(yt[Ct],yt[Ft]),w=Ct,M=Ft),(xt!==I||Lt!==x||At!==A||ot!==N)&&(i.blendFuncSeparate(T[xt],T[Lt],T[At],T[ot]),I=xt,x=Lt,A=At,N=ot),(Tt.equals(y)===!1||Dt!==R)&&(i.blendColor(Tt.r,Tt.g,Tt.b,Dt),y.copy(Tt),R=Dt),f=q,k=!1}function F(q,Ct){q.side===Fe?C(i.CULL_FACE):U(i.CULL_FACE);let xt=q.side===sn;Ct&&(xt=!xt),K(xt),q.blending===Hs&&q.transparent===!1?X(qn):X(q.blending,q.blendEquation,q.blendSrc,q.blendDst,q.blendEquationAlpha,q.blendSrcAlpha,q.blendDstAlpha,q.blendColor,q.blendAlpha,q.premultipliedAlpha),o.setFunc(q.depthFunc),o.setTest(q.depthTest),o.setMask(q.depthWrite),r.setMask(q.colorWrite);let Lt=q.stencilWrite;a.setTest(Lt),Lt&&(a.setMask(q.stencilWriteMask),a.setFunc(q.stencilFunc,q.stencilRef,q.stencilFuncMask),a.setOp(q.stencilFail,q.stencilZFail,q.stencilZPass)),bt(q.polygonOffset,q.polygonOffsetFactor,q.polygonOffsetUnits),q.alphaToCoverage===!0?U(i.SAMPLE_ALPHA_TO_COVERAGE):C(i.SAMPLE_ALPHA_TO_COVERAGE)}function K(q){Y!==q&&(q?i.frontFace(i.CW):i.frontFace(i.CCW),Y=q)}function j(q){q!==Dh?(U(i.CULL_FACE),q!==Z&&(q===tc?i.cullFace(i.BACK):q===Nh?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):C(i.CULL_FACE),Z=q}function gt(q){q!==it&&(st&&i.lineWidth(q),it=q)}function bt(q,Ct,xt){q?(U(i.POLYGON_OFFSET_FILL),(G!==Ct||et!==xt)&&(G=Ct,et=xt,o.getReversed()&&(Ct=-Ct),i.polygonOffset(Ct,xt))):C(i.POLYGON_OFFSET_FILL)}function wt(q){q?U(i.SCISSOR_TEST):C(i.SCISSOR_TEST)}function J(q){q===void 0&&(q=i.TEXTURE0+nt-1),ct!==q&&(i.activeTexture(q),ct=q)}function S(q,Ct,xt){xt===void 0&&(ct===null?xt=i.TEXTURE0+nt-1:xt=ct);let Lt=ft[xt];Lt===void 0&&(Lt={type:void 0,texture:void 0},ft[xt]=Lt),(Lt.type!==q||Lt.texture!==Ct)&&(ct!==xt&&(i.activeTexture(xt),ct=xt),i.bindTexture(q,Ct||z[q]),Lt.type=q,Lt.texture=Ct)}function Ut(){let q=ft[ct];q!==void 0&&q.type!==void 0&&(i.bindTexture(q.type,null),q.type=void 0,q.texture=void 0)}function Ot(){try{i.compressedTexImage2D(...arguments)}catch(q){ne("WebGLState:",q)}}function b(){try{i.compressedTexImage3D(...arguments)}catch(q){ne("WebGLState:",q)}}function _(){try{i.texSubImage2D(...arguments)}catch(q){ne("WebGLState:",q)}}function W(){try{i.texSubImage3D(...arguments)}catch(q){ne("WebGLState:",q)}}function rt(){try{i.compressedTexSubImage2D(...arguments)}catch(q){ne("WebGLState:",q)}}function pt(){try{i.compressedTexSubImage3D(...arguments)}catch(q){ne("WebGLState:",q)}}function Rt(){try{i.texStorage2D(...arguments)}catch(q){ne("WebGLState:",q)}}function P(){try{i.texStorage3D(...arguments)}catch(q){ne("WebGLState:",q)}}function D(){try{i.texImage2D(...arguments)}catch(q){ne("WebGLState:",q)}}function H(){try{i.texImage3D(...arguments)}catch(q){ne("WebGLState:",q)}}function lt(q){return d[q]!==void 0?d[q]:i.getParameter(q)}function Et(q,Ct){d[q]!==Ct&&(i.pixelStorei(q,Ct),d[q]=Ct)}function vt(q){Xt.equals(q)===!1&&(i.scissor(q.x,q.y,q.z,q.w),Xt.copy(q))}function Mt(q){Wt.equals(q)===!1&&(i.viewport(q.x,q.y,q.z,q.w),Wt.copy(q))}function Pt(q,Ct){let xt=l.get(Ct);xt===void 0&&(xt=new WeakMap,l.set(Ct,xt));let Lt=xt.get(q);Lt===void 0&&(Lt=i.getUniformBlockIndex(Ct,q.name),xt.set(q,Lt))}function Bt(q,Ct){let Lt=l.get(Ct).get(q);c.get(Ct)!==Lt&&(i.uniformBlockBinding(Ct,Lt,q.__bindingPointIndex),c.set(Ct,Lt))}function $t(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),o.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),h={},d={},ct=null,ft={},u={},p=new WeakMap,g=[],v=null,m=!1,f=null,w=null,I=null,x=null,M=null,A=null,N=null,y=new ie(0,0,0),R=0,k=!1,Y=null,Z=null,it=null,G=null,et=null,Xt.set(0,0,i.canvas.width,i.canvas.height),Wt.set(0,0,i.canvas.width,i.canvas.height),r.reset(),o.reset(),a.reset()}return{buffers:{color:r,depth:o,stencil:a},enable:U,disable:C,bindFramebuffer:L,drawBuffers:B,useProgram:tt,setBlending:X,setMaterial:F,setFlipSided:K,setCullFace:j,setLineWidth:gt,setPolygonOffset:bt,setScissorTest:wt,activeTexture:J,bindTexture:S,unbindTexture:Ut,compressedTexImage2D:Ot,compressedTexImage3D:b,texImage2D:D,texImage3D:H,pixelStorei:Et,getParameter:lt,updateUBOMapping:Pt,uniformBlockBinding:Bt,texStorage2D:Rt,texStorage3D:P,texSubImage2D:_,texSubImage3D:W,compressedTexSubImage2D:rt,compressedTexSubImage3D:pt,scissor:vt,viewport:Mt,reset:$t}}function b_(i,t,e,n,s,r,o){let a=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new mt,h=new WeakMap,d=new Set,u,p=new WeakMap,g=!1;try{g=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function v(b,_){return g?new OffscreenCanvas(b,_):hr("canvas")}function m(b,_,W){let rt=1,pt=Ot(b);if((pt.width>W||pt.height>W)&&(rt=W/Math.max(pt.width,pt.height)),rt<1)if(typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&b instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&b instanceof ImageBitmap||typeof VideoFrame<"u"&&b instanceof VideoFrame){let Rt=Math.floor(rt*pt.width),P=Math.floor(rt*pt.height);u===void 0&&(u=v(Rt,P));let D=_?v(Rt,P):u;return D.width=Rt,D.height=P,D.getContext("2d").drawImage(b,0,0,Rt,P),te("WebGLRenderer: Texture has been resized from ("+pt.width+"x"+pt.height+") to ("+Rt+"x"+P+")."),D}else return"data"in b&&te("WebGLRenderer: Image in DataTexture is too big ("+pt.width+"x"+pt.height+")."),b;return b}function f(b){return b.generateMipmaps}function w(b){i.generateMipmap(b)}function I(b){return b.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:b.isWebGL3DRenderTarget?i.TEXTURE_3D:b.isWebGLArrayRenderTarget||b.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function x(b,_,W,rt,pt,Rt=!1){if(b!==null){if(i[b]!==void 0)return i[b];te("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+b+"'")}let P;rt&&(P=t.get("EXT_texture_norm16"),P||te("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let D=_;if(_===i.RED&&(W===i.FLOAT&&(D=i.R32F),W===i.HALF_FLOAT&&(D=i.R16F),W===i.UNSIGNED_BYTE&&(D=i.R8),W===i.UNSIGNED_SHORT&&P&&(D=P.R16_EXT),W===i.SHORT&&P&&(D=P.R16_SNORM_EXT)),_===i.RED_INTEGER&&(W===i.UNSIGNED_BYTE&&(D=i.R8UI),W===i.UNSIGNED_SHORT&&(D=i.R16UI),W===i.UNSIGNED_INT&&(D=i.R32UI),W===i.BYTE&&(D=i.R8I),W===i.SHORT&&(D=i.R16I),W===i.INT&&(D=i.R32I)),_===i.RG&&(W===i.FLOAT&&(D=i.RG32F),W===i.HALF_FLOAT&&(D=i.RG16F),W===i.UNSIGNED_BYTE&&(D=i.RG8),W===i.UNSIGNED_SHORT&&P&&(D=P.RG16_EXT),W===i.SHORT&&P&&(D=P.RG16_SNORM_EXT)),_===i.RG_INTEGER&&(W===i.UNSIGNED_BYTE&&(D=i.RG8UI),W===i.UNSIGNED_SHORT&&(D=i.RG16UI),W===i.UNSIGNED_INT&&(D=i.RG32UI),W===i.BYTE&&(D=i.RG8I),W===i.SHORT&&(D=i.RG16I),W===i.INT&&(D=i.RG32I)),_===i.RGB_INTEGER&&(W===i.UNSIGNED_BYTE&&(D=i.RGB8UI),W===i.UNSIGNED_SHORT&&(D=i.RGB16UI),W===i.UNSIGNED_INT&&(D=i.RGB32UI),W===i.BYTE&&(D=i.RGB8I),W===i.SHORT&&(D=i.RGB16I),W===i.INT&&(D=i.RGB32I)),_===i.RGBA_INTEGER&&(W===i.UNSIGNED_BYTE&&(D=i.RGBA8UI),W===i.UNSIGNED_SHORT&&(D=i.RGBA16UI),W===i.UNSIGNED_INT&&(D=i.RGBA32UI),W===i.BYTE&&(D=i.RGBA8I),W===i.SHORT&&(D=i.RGBA16I),W===i.INT&&(D=i.RGBA32I)),_===i.RGB&&(W===i.UNSIGNED_SHORT&&P&&(D=P.RGB16_EXT),W===i.SHORT&&P&&(D=P.RGB16_SNORM_EXT),W===i.UNSIGNED_INT_5_9_9_9_REV&&(D=i.RGB9_E5),W===i.UNSIGNED_INT_10F_11F_11F_REV&&(D=i.R11F_G11F_B10F)),_===i.RGBA){let H=Rt?cr:de.getTransfer(pt);W===i.FLOAT&&(D=i.RGBA32F),W===i.HALF_FLOAT&&(D=i.RGBA16F),W===i.UNSIGNED_BYTE&&(D=H===xe?i.SRGB8_ALPHA8:i.RGBA8),W===i.UNSIGNED_SHORT&&P&&(D=P.RGBA16_EXT),W===i.SHORT&&P&&(D=P.RGBA16_SNORM_EXT),W===i.UNSIGNED_SHORT_4_4_4_4&&(D=i.RGBA4),W===i.UNSIGNED_SHORT_5_5_5_1&&(D=i.RGB5_A1)}return(D===i.R16F||D===i.R32F||D===i.RG16F||D===i.RG32F||D===i.RGBA16F||D===i.RGBA32F)&&t.get("EXT_color_buffer_float"),D}function M(b,_){let W;return b?_===null||_===Nn||_===Ws?W=i.DEPTH24_STENCIL8:_===Un?W=i.DEPTH32F_STENCIL8:_===Gs&&(W=i.DEPTH24_STENCIL8,te("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):_===null||_===Nn||_===Ws?W=i.DEPTH_COMPONENT24:_===Un?W=i.DEPTH_COMPONENT32F:_===Gs&&(W=i.DEPTH_COMPONENT16),W}function A(b,_){return f(b)===!0||b.isFramebufferTexture&&b.minFilter!==Ge&&b.minFilter!==Pe?Math.log2(Math.max(_.width,_.height))+1:b.mipmaps!==void 0&&b.mipmaps.length>0?b.mipmaps.length:b.isCompressedTexture&&Array.isArray(b.image)?_.mipmaps.length:1}function N(b){let _=b.target;_.removeEventListener("dispose",N),R(_),_.isVideoTexture&&h.delete(_),_.isHTMLTexture&&d.delete(_)}function y(b){let _=b.target;_.removeEventListener("dispose",y),Y(_)}function R(b){let _=n.get(b);if(_.__webglInit===void 0)return;let W=b.source,rt=p.get(W);if(rt){let pt=rt[_.__cacheKey];pt.usedTimes--,pt.usedTimes===0&&k(b),Object.keys(rt).length===0&&p.delete(W)}n.remove(b)}function k(b){let _=n.get(b);i.deleteTexture(_.__webglTexture);let W=b.source,rt=p.get(W);delete rt[_.__cacheKey],o.memory.textures--}function Y(b){let _=n.get(b);if(b.depthTexture&&(b.depthTexture.dispose(),n.remove(b.depthTexture)),b.isWebGLCubeRenderTarget)for(let rt=0;rt<6;rt++){if(Array.isArray(_.__webglFramebuffer[rt]))for(let pt=0;pt<_.__webglFramebuffer[rt].length;pt++)i.deleteFramebuffer(_.__webglFramebuffer[rt][pt]);else i.deleteFramebuffer(_.__webglFramebuffer[rt]);_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer[rt])}else{if(Array.isArray(_.__webglFramebuffer))for(let rt=0;rt<_.__webglFramebuffer.length;rt++)i.deleteFramebuffer(_.__webglFramebuffer[rt]);else i.deleteFramebuffer(_.__webglFramebuffer);if(_.__webglDepthbuffer&&i.deleteRenderbuffer(_.__webglDepthbuffer),_.__webglMultisampledFramebuffer&&i.deleteFramebuffer(_.__webglMultisampledFramebuffer),_.__webglColorRenderbuffer)for(let rt=0;rt<_.__webglColorRenderbuffer.length;rt++)_.__webglColorRenderbuffer[rt]&&i.deleteRenderbuffer(_.__webglColorRenderbuffer[rt]);_.__webglDepthRenderbuffer&&i.deleteRenderbuffer(_.__webglDepthRenderbuffer)}let W=b.textures;for(let rt=0,pt=W.length;rt<pt;rt++){let Rt=n.get(W[rt]);Rt.__webglTexture&&(i.deleteTexture(Rt.__webglTexture),o.memory.textures--),n.remove(W[rt])}n.remove(b)}let Z=0;function it(){Z=0}function G(){return Z}function et(b){Z=b}function nt(){let b=Z;return b>=s.maxTextures&&te("WebGLTextures: Trying to use "+(b+1)+" texture units while this GPU supports only "+s.maxTextures),Z+=1,b}function st(b){let _=[];return _.push(b.wrapS),_.push(b.wrapT),_.push(b.wrapR||0),_.push(b.magFilter),_.push(b.minFilter),_.push(b.anisotropy),_.push(b.internalFormat),_.push(b.format),_.push(b.type),_.push(b.generateMipmaps),_.push(b.premultiplyAlpha),_.push(b.flipY),_.push(b.unpackAlignment),_.push(b.colorSpace),_.join()}function Q(b,_){let W=n.get(b);if(b.isVideoTexture&&S(b),b.isRenderTargetTexture===!1&&b.isExternalTexture!==!0&&b.version>0&&W.__version!==b.version){let rt=b.image;if(rt===null)te("WebGLRenderer: Texture marked for update but no image data found.");else if(rt.complete===!1)te("WebGLRenderer: Texture marked for update but image is incomplete");else{C(W,b,_);return}}else b.isExternalTexture&&(W.__webglTexture=b.sourceTexture?b.sourceTexture:null);e.bindTexture(i.TEXTURE_2D,W.__webglTexture,i.TEXTURE0+_)}function at(b,_){let W=n.get(b);if(b.isRenderTargetTexture===!1&&b.version>0&&W.__version!==b.version){C(W,b,_);return}else b.isExternalTexture&&(W.__webglTexture=b.sourceTexture?b.sourceTexture:null);e.bindTexture(i.TEXTURE_2D_ARRAY,W.__webglTexture,i.TEXTURE0+_)}function ct(b,_){let W=n.get(b);if(b.isRenderTargetTexture===!1&&b.version>0&&W.__version!==b.version){C(W,b,_);return}e.bindTexture(i.TEXTURE_3D,W.__webglTexture,i.TEXTURE0+_)}function ft(b,_){let W=n.get(b);if(b.isCubeDepthTexture!==!0&&b.version>0&&W.__version!==b.version){L(W,b,_);return}e.bindTexture(i.TEXTURE_CUBE_MAP,W.__webglTexture,i.TEXTURE0+_)}let It={[Hn]:i.REPEAT,[yn]:i.CLAMP_TO_EDGE,[bs]:i.MIRRORED_REPEAT},Nt={[Ge]:i.NEAREST,[nu]:i.NEAREST_MIPMAP_NEAREST,[Fr]:i.NEAREST_MIPMAP_LINEAR,[Pe]:i.LINEAR,[aa]:i.LINEAR_MIPMAP_NEAREST,[Sn]:i.LINEAR_MIPMAP_LINEAR},Xt={[ou]:i.NEVER,[uu]:i.ALWAYS,[au]:i.LESS,[Xa]:i.LEQUAL,[lu]:i.EQUAL,[qa]:i.GEQUAL,[cu]:i.GREATER,[hu]:i.NOTEQUAL};function Wt(b,_){if(_.type===Un&&t.has("OES_texture_float_linear")===!1&&(_.magFilter===Pe||_.magFilter===aa||_.magFilter===Fr||_.magFilter===Sn||_.minFilter===Pe||_.minFilter===aa||_.minFilter===Fr||_.minFilter===Sn)&&te("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(b,i.TEXTURE_WRAP_S,It[_.wrapS]),i.texParameteri(b,i.TEXTURE_WRAP_T,It[_.wrapT]),(b===i.TEXTURE_3D||b===i.TEXTURE_2D_ARRAY)&&i.texParameteri(b,i.TEXTURE_WRAP_R,It[_.wrapR]),i.texParameteri(b,i.TEXTURE_MAG_FILTER,Nt[_.magFilter]),i.texParameteri(b,i.TEXTURE_MIN_FILTER,Nt[_.minFilter]),_.compareFunction&&(i.texParameteri(b,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(b,i.TEXTURE_COMPARE_FUNC,Xt[_.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(_.magFilter===Ge||_.minFilter!==Fr&&_.minFilter!==Sn||_.type===Un&&t.has("OES_texture_float_linear")===!1)return;if(_.anisotropy>1||n.get(_).__currentAnisotropy){let W=t.get("EXT_texture_filter_anisotropic");i.texParameterf(b,W.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(_.anisotropy,s.getMaxAnisotropy())),n.get(_).__currentAnisotropy=_.anisotropy}}}function qt(b,_){let W=!1;b.__webglInit===void 0&&(b.__webglInit=!0,_.addEventListener("dispose",N));let rt=_.source,pt=p.get(rt);pt===void 0&&(pt={},p.set(rt,pt));let Rt=st(_);if(Rt!==b.__cacheKey){pt[Rt]===void 0&&(pt[Rt]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,W=!0),pt[Rt].usedTimes++;let P=pt[b.__cacheKey];P!==void 0&&(pt[b.__cacheKey].usedTimes--,P.usedTimes===0&&k(_)),b.__cacheKey=Rt,b.__webglTexture=pt[Rt].texture}return W}function z(b,_,W){return Math.floor(Math.floor(b/W)/_)}function U(b,_,W,rt){let Rt=b.updateRanges;if(Rt.length===0)e.texSubImage2D(i.TEXTURE_2D,0,0,0,_.width,_.height,W,rt,_.data);else{Rt.sort((Et,vt)=>Et.start-vt.start);let P=0;for(let Et=1;Et<Rt.length;Et++){let vt=Rt[P],Mt=Rt[Et],Pt=vt.start+vt.count,Bt=z(Mt.start,_.width,4),$t=z(vt.start,_.width,4);Mt.start<=Pt+1&&Bt===$t&&z(Mt.start+Mt.count-1,_.width,4)===Bt?vt.count=Math.max(vt.count,Mt.start+Mt.count-vt.start):(++P,Rt[P]=Mt)}Rt.length=P+1;let D=e.getParameter(i.UNPACK_ROW_LENGTH),H=e.getParameter(i.UNPACK_SKIP_PIXELS),lt=e.getParameter(i.UNPACK_SKIP_ROWS);e.pixelStorei(i.UNPACK_ROW_LENGTH,_.width);for(let Et=0,vt=Rt.length;Et<vt;Et++){let Mt=Rt[Et],Pt=Math.floor(Mt.start/4),Bt=Math.ceil(Mt.count/4),$t=Pt%_.width,q=Math.floor(Pt/_.width),Ct=Bt,xt=1;e.pixelStorei(i.UNPACK_SKIP_PIXELS,$t),e.pixelStorei(i.UNPACK_SKIP_ROWS,q),e.texSubImage2D(i.TEXTURE_2D,0,$t,q,Ct,xt,W,rt,_.data)}b.clearUpdateRanges(),e.pixelStorei(i.UNPACK_ROW_LENGTH,D),e.pixelStorei(i.UNPACK_SKIP_PIXELS,H),e.pixelStorei(i.UNPACK_SKIP_ROWS,lt)}}function C(b,_,W){let rt=i.TEXTURE_2D;(_.isDataArrayTexture||_.isCompressedArrayTexture)&&(rt=i.TEXTURE_2D_ARRAY),_.isData3DTexture&&(rt=i.TEXTURE_3D);let pt=qt(b,_),Rt=_.source;e.bindTexture(rt,b.__webglTexture,i.TEXTURE0+W);let P=n.get(Rt);if(Rt.version!==P.__version||pt===!0){if(e.activeTexture(i.TEXTURE0+W),(typeof ImageBitmap<"u"&&_.image instanceof ImageBitmap)===!1){let xt=de.getPrimaries(de.workingColorSpace),Lt=_.colorSpace===On?null:de.getPrimaries(_.colorSpace),Ft=_.colorSpace===On||xt===Lt?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,Ft)}e.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment);let H=m(_.image,!1,s.maxTextureSize);H=Ut(_,H);let lt=r.convert(_.format,_.colorSpace),Et=r.convert(_.type),vt=x(_.internalFormat,lt,Et,_.normalized,_.colorSpace,_.isVideoTexture);Wt(rt,_);let Mt,Pt=_.mipmaps,Bt=_.isVideoTexture!==!0,$t=P.__version===void 0||pt===!0,q=Rt.dataReady,Ct=A(_,H);if(_.isDepthTexture)vt=M(_.format===Fi,_.type),$t&&(Bt?e.texStorage2D(i.TEXTURE_2D,1,vt,H.width,H.height):e.texImage2D(i.TEXTURE_2D,0,vt,H.width,H.height,0,lt,Et,null));else if(_.isDataTexture)if(Pt.length>0){Bt&&$t&&e.texStorage2D(i.TEXTURE_2D,Ct,vt,Pt[0].width,Pt[0].height);for(let xt=0,Lt=Pt.length;xt<Lt;xt++)Mt=Pt[xt],Bt?q&&e.texSubImage2D(i.TEXTURE_2D,xt,0,0,Mt.width,Mt.height,lt,Et,Mt.data):e.texImage2D(i.TEXTURE_2D,xt,vt,Mt.width,Mt.height,0,lt,Et,Mt.data);_.generateMipmaps=!1}else Bt?($t&&e.texStorage2D(i.TEXTURE_2D,Ct,vt,H.width,H.height),q&&U(_,H,lt,Et)):e.texImage2D(i.TEXTURE_2D,0,vt,H.width,H.height,0,lt,Et,H.data);else if(_.isCompressedTexture)if(_.isCompressedArrayTexture){Bt&&$t&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Ct,vt,Pt[0].width,Pt[0].height,H.depth);for(let xt=0,Lt=Pt.length;xt<Lt;xt++)if(Mt=Pt[xt],_.format!==Mn)if(lt!==null)if(Bt){if(q)if(_.layerUpdates.size>0){let Ft=Ac(Mt.width,Mt.height,_.format,_.type);for(let At of _.layerUpdates){let ot=Mt.data.subarray(At*Ft/Mt.data.BYTES_PER_ELEMENT,(At+1)*Ft/Mt.data.BYTES_PER_ELEMENT);e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,xt,0,0,At,Mt.width,Mt.height,1,lt,ot)}}else e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,xt,0,0,0,Mt.width,Mt.height,H.depth,lt,Mt.data)}else e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,xt,vt,Mt.width,Mt.height,H.depth,0,Mt.data,0,0);else te("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else Bt?q&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,xt,0,0,0,Mt.width,Mt.height,H.depth,lt,Et,Mt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,xt,vt,Mt.width,Mt.height,H.depth,0,lt,Et,Mt.data);_.layerUpdates.size>0&&_.clearLayerUpdates()}else{Bt&&$t&&e.texStorage2D(i.TEXTURE_2D,Ct,vt,Pt[0].width,Pt[0].height);for(let xt=0,Lt=Pt.length;xt<Lt;xt++)Mt=Pt[xt],_.format!==Mn?lt!==null?Bt?q&&e.compressedTexSubImage2D(i.TEXTURE_2D,xt,0,0,Mt.width,Mt.height,lt,Mt.data):e.compressedTexImage2D(i.TEXTURE_2D,xt,vt,Mt.width,Mt.height,0,Mt.data):te("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):Bt?q&&e.texSubImage2D(i.TEXTURE_2D,xt,0,0,Mt.width,Mt.height,lt,Et,Mt.data):e.texImage2D(i.TEXTURE_2D,xt,vt,Mt.width,Mt.height,0,lt,Et,Mt.data)}else if(_.isDataArrayTexture)if(Bt){if($t&&e.texStorage3D(i.TEXTURE_2D_ARRAY,Ct,vt,H.width,H.height,H.depth),q)if(_.layerUpdates.size>0){let xt=Ac(H.width,H.height,_.format,_.type);for(let Lt of _.layerUpdates){let Ft=H.data.subarray(Lt*xt/H.data.BYTES_PER_ELEMENT,(Lt+1)*xt/H.data.BYTES_PER_ELEMENT);e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Lt,H.width,H.height,1,lt,Et,Ft)}_.clearLayerUpdates()}else e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,H.width,H.height,H.depth,lt,Et,H.data)}else e.texImage3D(i.TEXTURE_2D_ARRAY,0,vt,H.width,H.height,H.depth,0,lt,Et,H.data);else if(_.isData3DTexture)Bt?($t&&e.texStorage3D(i.TEXTURE_3D,Ct,vt,H.width,H.height,H.depth),q&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,H.width,H.height,H.depth,lt,Et,H.data)):e.texImage3D(i.TEXTURE_3D,0,vt,H.width,H.height,H.depth,0,lt,Et,H.data);else if(_.isFramebufferTexture){if($t)if(Bt)e.texStorage2D(i.TEXTURE_2D,Ct,vt,H.width,H.height);else{let xt=H.width,Lt=H.height;for(let Ft=0;Ft<Ct;Ft++)e.texImage2D(i.TEXTURE_2D,Ft,vt,xt,Lt,0,lt,Et,null),xt>>=1,Lt>>=1}}else if(_.isHTMLTexture){if("texElementImage2D"in i){let xt=i.canvas;if(xt.hasAttribute("layoutsubtree")||xt.setAttribute("layoutsubtree","true"),H.parentNode!==xt){xt.appendChild(H),d.add(_),xt.onpaint=Lt=>{let Ft=Lt.changedElements;for(let At of d)Ft.includes(At.image)&&(At.needsUpdate=!0)},xt.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,H);else{let Ft=i.RGBA,At=i.RGBA,ot=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,Ft,At,ot,H)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(Pt.length>0){if(Bt&&$t){let xt=Ot(Pt[0]);e.texStorage2D(i.TEXTURE_2D,Ct,vt,xt.width,xt.height)}for(let xt=0,Lt=Pt.length;xt<Lt;xt++)Mt=Pt[xt],Bt?q&&e.texSubImage2D(i.TEXTURE_2D,xt,0,0,lt,Et,Mt):e.texImage2D(i.TEXTURE_2D,xt,vt,lt,Et,Mt);_.generateMipmaps=!1}else if(Bt){if($t){let xt=Ot(H);e.texStorage2D(i.TEXTURE_2D,Ct,vt,xt.width,xt.height)}q&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,lt,Et,H)}else e.texImage2D(i.TEXTURE_2D,0,vt,lt,Et,H);f(_)&&w(rt),P.__version=Rt.version,_.onUpdate&&_.onUpdate(_)}b.__version=_.version}function L(b,_,W){if(_.image.length!==6)return;let rt=qt(b,_),pt=_.source;e.bindTexture(i.TEXTURE_CUBE_MAP,b.__webglTexture,i.TEXTURE0+W);let Rt=n.get(pt);if(pt.version!==Rt.__version||rt===!0){e.activeTexture(i.TEXTURE0+W);let P=de.getPrimaries(de.workingColorSpace),D=_.colorSpace===On?null:de.getPrimaries(_.colorSpace),H=_.colorSpace===On||P===D?i.NONE:i.BROWSER_DEFAULT_WEBGL;e.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,_.flipY),e.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,_.premultiplyAlpha),e.pixelStorei(i.UNPACK_ALIGNMENT,_.unpackAlignment),e.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,H);let lt=_.isCompressedTexture||_.image[0].isCompressedTexture,Et=_.image[0]&&_.image[0].isDataTexture,vt=[];for(let At=0;At<6;At++)!lt&&!Et?vt[At]=m(_.image[At],!0,s.maxCubemapSize):vt[At]=Et?_.image[At].image:_.image[At],vt[At]=Ut(_,vt[At]);let Mt=vt[0],Pt=r.convert(_.format,_.colorSpace),Bt=r.convert(_.type),$t=x(_.internalFormat,Pt,Bt,_.normalized,_.colorSpace),q=_.isVideoTexture!==!0,Ct=Rt.__version===void 0||rt===!0,xt=pt.dataReady,Lt=A(_,Mt);Wt(i.TEXTURE_CUBE_MAP,_);let Ft;if(lt){q&&Ct&&e.texStorage2D(i.TEXTURE_CUBE_MAP,Lt,$t,Mt.width,Mt.height);for(let At=0;At<6;At++){Ft=vt[At].mipmaps;for(let ot=0;ot<Ft.length;ot++){let Tt=Ft[ot];_.format!==Mn?Pt!==null?q?xt&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+At,ot,0,0,Tt.width,Tt.height,Pt,Tt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+At,ot,$t,Tt.width,Tt.height,0,Tt.data):te("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):q?xt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+At,ot,0,0,Tt.width,Tt.height,Pt,Bt,Tt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+At,ot,$t,Tt.width,Tt.height,0,Pt,Bt,Tt.data)}}}else{if(Ft=_.mipmaps,q&&Ct){Ft.length>0&&Lt++;let At=Ot(vt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,Lt,$t,At.width,At.height)}for(let At=0;At<6;At++)if(Et){q?xt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+At,0,0,0,vt[At].width,vt[At].height,Pt,Bt,vt[At].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+At,0,$t,vt[At].width,vt[At].height,0,Pt,Bt,vt[At].data);for(let ot=0;ot<Ft.length;ot++){let Dt=Ft[ot].image[At].image;q?xt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+At,ot+1,0,0,Dt.width,Dt.height,Pt,Bt,Dt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+At,ot+1,$t,Dt.width,Dt.height,0,Pt,Bt,Dt.data)}}else{q?xt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+At,0,0,0,Pt,Bt,vt[At]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+At,0,$t,Pt,Bt,vt[At]);for(let ot=0;ot<Ft.length;ot++){let Tt=Ft[ot];q?xt&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+At,ot+1,0,0,Pt,Bt,Tt.image[At]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+At,ot+1,$t,Pt,Bt,Tt.image[At])}}}f(_)&&w(i.TEXTURE_CUBE_MAP),Rt.__version=pt.version,_.onUpdate&&_.onUpdate(_)}b.__version=_.version}function B(b,_,W,rt,pt,Rt){let P=r.convert(W.format,W.colorSpace),D=r.convert(W.type),H=x(W.internalFormat,P,D,W.normalized,W.colorSpace),lt=n.get(_),Et=n.get(W);if(Et.__renderTarget=_,!lt.__hasExternalTextures){let vt=Math.max(1,_.width>>Rt),Mt=Math.max(1,_.height>>Rt);pt===i.TEXTURE_3D||pt===i.TEXTURE_2D_ARRAY?e.texImage3D(pt,Rt,H,vt,Mt,_.depth,0,P,D,null):e.texImage2D(pt,Rt,H,vt,Mt,0,P,D,null)}e.bindFramebuffer(i.FRAMEBUFFER,b),J(_)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,rt,pt,Et.__webglTexture,0,wt(_)):(pt===i.TEXTURE_2D||pt>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&pt<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,rt,pt,Et.__webglTexture,Rt),e.bindFramebuffer(i.FRAMEBUFFER,null)}function tt(b,_,W){if(i.bindRenderbuffer(i.RENDERBUFFER,b),_.depthBuffer){let rt=_.depthTexture,pt=rt&&rt.isDepthTexture?rt.type:null,Rt=M(_.stencilBuffer,pt),P=_.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;J(_)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,wt(_),Rt,_.width,_.height):W?i.renderbufferStorageMultisample(i.RENDERBUFFER,wt(_),Rt,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,Rt,_.width,_.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,P,i.RENDERBUFFER,b)}else{let rt=_.textures;for(let pt=0;pt<rt.length;pt++){let Rt=rt[pt],P=r.convert(Rt.format,Rt.colorSpace),D=r.convert(Rt.type),H=x(Rt.internalFormat,P,D,Rt.normalized,Rt.colorSpace);J(_)?a.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,wt(_),H,_.width,_.height):W?i.renderbufferStorageMultisample(i.RENDERBUFFER,wt(_),H,_.width,_.height):i.renderbufferStorage(i.RENDERBUFFER,H,_.width,_.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function yt(b,_,W){let rt=_.isWebGLCubeRenderTarget===!0;if(e.bindFramebuffer(i.FRAMEBUFFER,b),!(_.depthTexture&&_.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");let pt=n.get(_.depthTexture);if(pt.__renderTarget=_,(!pt.__webglTexture||_.depthTexture.image.width!==_.width||_.depthTexture.image.height!==_.height)&&(_.depthTexture.image.width=_.width,_.depthTexture.image.height=_.height,_.depthTexture.needsUpdate=!0),rt){if(pt.__webglInit===void 0&&(pt.__webglInit=!0,_.depthTexture.addEventListener("dispose",N)),pt.__webglTexture===void 0){pt.__webglTexture=i.createTexture(),e.bindTexture(i.TEXTURE_CUBE_MAP,pt.__webglTexture),Wt(i.TEXTURE_CUBE_MAP,_.depthTexture);let lt=r.convert(_.depthTexture.format),Et=r.convert(_.depthTexture.type),vt;_.depthTexture.format===Gn?vt=i.DEPTH_COMPONENT24:_.depthTexture.format===Fi&&(vt=i.DEPTH24_STENCIL8);for(let Mt=0;Mt<6;Mt++)i.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+Mt,0,vt,_.width,_.height,0,lt,Et,null)}}else Q(_.depthTexture,0);let Rt=pt.__webglTexture,P=wt(_),D=rt?i.TEXTURE_CUBE_MAP_POSITIVE_X+W:i.TEXTURE_2D,H=_.depthTexture.format===Fi?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(_.depthTexture.format===Gn)J(_)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,H,D,Rt,0,P):i.framebufferTexture2D(i.FRAMEBUFFER,H,D,Rt,0);else if(_.depthTexture.format===Fi)J(_)?a.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,H,D,Rt,0,P):i.framebufferTexture2D(i.FRAMEBUFFER,H,D,Rt,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function T(b){let _=n.get(b),W=b.isWebGLCubeRenderTarget===!0;if(_.__boundDepthTexture!==b.depthTexture){let rt=b.depthTexture;if(_.__depthDisposeCallback&&_.__depthDisposeCallback(),rt){let pt=()=>{delete _.__boundDepthTexture,delete _.__depthDisposeCallback,rt.removeEventListener("dispose",pt)};rt.addEventListener("dispose",pt),_.__depthDisposeCallback=pt}_.__boundDepthTexture=rt}if(b.depthTexture&&!_.__autoAllocateDepthBuffer)if(W)for(let rt=0;rt<6;rt++)yt(_.__webglFramebuffer[rt],b,rt);else{let rt=b.texture.mipmaps;rt&&rt.length>0?yt(_.__webglFramebuffer[0],b,0):yt(_.__webglFramebuffer,b,0)}else if(W){_.__webglDepthbuffer=[];for(let rt=0;rt<6;rt++)if(e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[rt]),_.__webglDepthbuffer[rt]===void 0)_.__webglDepthbuffer[rt]=i.createRenderbuffer(),tt(_.__webglDepthbuffer[rt],b,!1);else{let pt=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Rt=_.__webglDepthbuffer[rt];i.bindRenderbuffer(i.RENDERBUFFER,Rt),i.framebufferRenderbuffer(i.FRAMEBUFFER,pt,i.RENDERBUFFER,Rt)}}else{let rt=b.texture.mipmaps;if(rt&&rt.length>0?e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer[0]):e.bindFramebuffer(i.FRAMEBUFFER,_.__webglFramebuffer),_.__webglDepthbuffer===void 0)_.__webglDepthbuffer=i.createRenderbuffer(),tt(_.__webglDepthbuffer,b,!1);else{let pt=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Rt=_.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,Rt),i.framebufferRenderbuffer(i.FRAMEBUFFER,pt,i.RENDERBUFFER,Rt)}}e.bindFramebuffer(i.FRAMEBUFFER,null)}function X(b,_,W){let rt=n.get(b);_!==void 0&&B(rt.__webglFramebuffer,b,b.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),W!==void 0&&T(b)}function F(b){let _=b.texture,W=n.get(b),rt=n.get(_);b.addEventListener("dispose",y);let pt=b.textures,Rt=b.isWebGLCubeRenderTarget===!0,P=pt.length>1;if(P||(rt.__webglTexture===void 0&&(rt.__webglTexture=i.createTexture()),rt.__version=_.version,o.memory.textures++),Rt){W.__webglFramebuffer=[];for(let D=0;D<6;D++)if(_.mipmaps&&_.mipmaps.length>0){W.__webglFramebuffer[D]=[];for(let H=0;H<_.mipmaps.length;H++)W.__webglFramebuffer[D][H]=i.createFramebuffer()}else W.__webglFramebuffer[D]=i.createFramebuffer()}else{if(_.mipmaps&&_.mipmaps.length>0){W.__webglFramebuffer=[];for(let D=0;D<_.mipmaps.length;D++)W.__webglFramebuffer[D]=i.createFramebuffer()}else W.__webglFramebuffer=i.createFramebuffer();if(P)for(let D=0,H=pt.length;D<H;D++){let lt=n.get(pt[D]);lt.__webglTexture===void 0&&(lt.__webglTexture=i.createTexture(),o.memory.textures++)}if(b.samples>0&&J(b)===!1){W.__webglMultisampledFramebuffer=i.createFramebuffer(),W.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,W.__webglMultisampledFramebuffer);for(let D=0;D<pt.length;D++){let H=pt[D];W.__webglColorRenderbuffer[D]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,W.__webglColorRenderbuffer[D]);let lt=r.convert(H.format,H.colorSpace),Et=r.convert(H.type),vt=x(H.internalFormat,lt,Et,H.normalized,H.colorSpace,b.isXRRenderTarget===!0),Mt=wt(b);i.renderbufferStorageMultisample(i.RENDERBUFFER,Mt,vt,b.width,b.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+D,i.RENDERBUFFER,W.__webglColorRenderbuffer[D])}i.bindRenderbuffer(i.RENDERBUFFER,null),b.depthBuffer&&(W.__webglDepthRenderbuffer=i.createRenderbuffer(),tt(W.__webglDepthRenderbuffer,b,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(Rt){e.bindTexture(i.TEXTURE_CUBE_MAP,rt.__webglTexture),Wt(i.TEXTURE_CUBE_MAP,_);for(let D=0;D<6;D++)if(_.mipmaps&&_.mipmaps.length>0)for(let H=0;H<_.mipmaps.length;H++)B(W.__webglFramebuffer[D][H],b,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+D,H);else B(W.__webglFramebuffer[D],b,_,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+D,0);f(_)&&w(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(P){for(let D=0,H=pt.length;D<H;D++){let lt=pt[D],Et=n.get(lt),vt=i.TEXTURE_2D;(b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(vt=b.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(vt,Et.__webglTexture),Wt(vt,lt),B(W.__webglFramebuffer,b,lt,i.COLOR_ATTACHMENT0+D,vt,0),f(lt)&&w(vt)}e.unbindTexture()}else{let D=i.TEXTURE_2D;if((b.isWebGL3DRenderTarget||b.isWebGLArrayRenderTarget)&&(D=b.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),e.bindTexture(D,rt.__webglTexture),Wt(D,_),_.mipmaps&&_.mipmaps.length>0)for(let H=0;H<_.mipmaps.length;H++)B(W.__webglFramebuffer[H],b,_,i.COLOR_ATTACHMENT0,D,H);else B(W.__webglFramebuffer,b,_,i.COLOR_ATTACHMENT0,D,0);f(_)&&w(D),e.unbindTexture()}b.depthBuffer&&T(b)}function K(b){let _=b.textures;for(let W=0,rt=_.length;W<rt;W++){let pt=_[W];if(f(pt)){let Rt=I(b),P=n.get(pt).__webglTexture;e.bindTexture(Rt,P),w(Rt),e.unbindTexture()}}}let j=[],gt=[];function bt(b){if(b.samples>0){if(J(b)===!1){let _=b.textures,W=b.width,rt=b.height,pt=i.COLOR_BUFFER_BIT,Rt=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,P=n.get(b),D=_.length>1;if(D)for(let lt=0;lt<_.length;lt++)e.bindFramebuffer(i.FRAMEBUFFER,P.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+lt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,P.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+lt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,P.__webglMultisampledFramebuffer);let H=b.texture.mipmaps;H&&H.length>0?e.bindFramebuffer(i.DRAW_FRAMEBUFFER,P.__webglFramebuffer[0]):e.bindFramebuffer(i.DRAW_FRAMEBUFFER,P.__webglFramebuffer);for(let lt=0;lt<_.length;lt++){if(b.resolveDepthBuffer&&(b.depthBuffer&&(pt|=i.DEPTH_BUFFER_BIT),b.stencilBuffer&&b.resolveStencilBuffer&&(pt|=i.STENCIL_BUFFER_BIT)),D){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,P.__webglColorRenderbuffer[lt]);let Et=n.get(_[lt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,Et,0)}i.blitFramebuffer(0,0,W,rt,0,0,W,rt,pt,i.NEAREST),c===!0&&(j.length=0,gt.length=0,j.push(i.COLOR_ATTACHMENT0+lt),b.depthBuffer&&b.storeMultisampledDepthBuffer===!1&&(j.push(Rt),gt.push(Rt),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,gt)),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,j))}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),D)for(let lt=0;lt<_.length;lt++){e.bindFramebuffer(i.FRAMEBUFFER,P.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+lt,i.RENDERBUFFER,P.__webglColorRenderbuffer[lt]);let Et=n.get(_[lt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,P.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+lt,i.TEXTURE_2D,Et,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,P.__webglMultisampledFramebuffer)}else if(b.depthBuffer&&b.storeMultisampledDepthBuffer===!1&&c){let _=b.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[_])}}}function wt(b){return Math.min(s.maxSamples,b.samples)}function J(b){let _=n.get(b);return b.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&_.__useRenderToTexture!==!1}function S(b){let _=o.render.frame;h.get(b)!==_&&(h.set(b,_),b.update())}function Ut(b,_){let W=b.colorSpace,rt=b.format,pt=b.type;return b.isCompressedTexture===!0||b.isVideoTexture===!0||W!==lr&&W!==On&&(de.getTransfer(W)===xe?(rt!==Mn||pt!==an)&&te("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):ne("WebGLTextures: Unsupported texture color space:",W)),_}function Ot(b){return typeof HTMLImageElement<"u"&&b instanceof HTMLImageElement?(l.width=b.naturalWidth||b.width,l.height=b.naturalHeight||b.height):typeof VideoFrame<"u"&&b instanceof VideoFrame?(l.width=b.displayWidth,l.height=b.displayHeight):(l.width=b.width,l.height=b.height),l}this.allocateTextureUnit=nt,this.resetTextureUnits=it,this.getTextureUnits=G,this.setTextureUnits=et,this.setTexture2D=Q,this.setTexture2DArray=at,this.setTexture3D=ct,this.setTextureCube=ft,this.rebindTextures=X,this.setupRenderTarget=F,this.updateRenderTargetMipmap=K,this.updateMultisampleRenderTarget=bt,this.setupDepthRenderbuffer=T,this.setupFrameBufferTexture=B,this.useMultisampledRTT=J,this.isReversedDepthBuffer=function(){return e.buffers.depth.getReversed()}}function E_(i,t){function e(n,s=On){let r,o=de.getTransfer(s);if(n===an)return i.UNSIGNED_BYTE;if(n===ca)return i.UNSIGNED_SHORT_4_4_4_4;if(n===ha)return i.UNSIGNED_SHORT_5_5_5_1;if(n===mc)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===gc)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===fc)return i.BYTE;if(n===pc)return i.SHORT;if(n===Gs)return i.UNSIGNED_SHORT;if(n===la)return i.INT;if(n===Nn)return i.UNSIGNED_INT;if(n===Un)return i.FLOAT;if(n===Fn)return i.HALF_FLOAT;if(n===_c)return i.ALPHA;if(n===xc)return i.RGB;if(n===Mn)return i.RGBA;if(n===Gn)return i.DEPTH_COMPONENT;if(n===Fi)return i.DEPTH_STENCIL;if(n===yc)return i.RED;if(n===ua)return i.RED_INTEGER;if(n===Oi)return i.RG;if(n===da)return i.RG_INTEGER;if(n===fa)return i.RGBA_INTEGER;if(n===Or||n===Br||n===zr||n===kr)if(o===xe)if(r=t.get("WEBGL_compressed_texture_s3tc_srgb"),r!==null){if(n===Or)return r.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Br)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===zr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===kr)return r.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(r=t.get("WEBGL_compressed_texture_s3tc"),r!==null){if(n===Or)return r.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Br)return r.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===zr)return r.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===kr)return r.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===pa||n===ma||n===ga||n===_a)if(r=t.get("WEBGL_compressed_texture_pvrtc"),r!==null){if(n===pa)return r.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===ma)return r.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===ga)return r.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===_a)return r.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===xa||n===ya||n===va||n===Sa||n===Ma||n===Vr||n===ba)if(r=t.get("WEBGL_compressed_texture_etc"),r!==null){if(n===xa||n===ya)return o===xe?r.COMPRESSED_SRGB8_ETC2:r.COMPRESSED_RGB8_ETC2;if(n===va)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:r.COMPRESSED_RGBA8_ETC2_EAC;if(n===Sa)return r.COMPRESSED_R11_EAC;if(n===Ma)return r.COMPRESSED_SIGNED_R11_EAC;if(n===Vr)return r.COMPRESSED_RG11_EAC;if(n===ba)return r.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===Ea||n===wa||n===Ta||n===Aa||n===Ra||n===Ca||n===Pa||n===Ia||n===La||n===Da||n===Na||n===Ua||n===Fa||n===Oa)if(r=t.get("WEBGL_compressed_texture_astc"),r!==null){if(n===Ea)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:r.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===wa)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:r.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===Ta)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:r.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===Aa)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:r.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===Ra)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:r.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===Ca)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:r.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===Pa)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:r.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===Ia)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:r.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===La)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:r.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===Da)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:r.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===Na)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:r.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===Ua)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:r.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===Fa)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:r.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===Oa)return o===xe?r.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:r.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===Ba||n===za||n===ka)if(r=t.get("EXT_texture_compression_bptc"),r!==null){if(n===Ba)return o===xe?r.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:r.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===za)return r.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===ka)return r.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Va||n===Ha||n===Hr||n===Ga)if(r=t.get("EXT_texture_compression_rgtc"),r!==null){if(n===Va)return r.COMPRESSED_RED_RGTC1_EXT;if(n===Ha)return r.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===Hr)return r.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Ga)return r.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===Ws?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:e}}var w_=\`
void main() {

	gl_Position = vec4( position, 1.0 );

}\`,T_=\`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}\`,Vc=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e){if(this.texture===null){let n=new gr(t.texture);(t.depthNear!==e.depthNear||t.depthFar!==e.depthFar)&&(this.depthNear=t.depthNear,this.depthFar=t.depthFar),this.texture=n}}getMesh(t){if(this.texture!==null&&this.mesh===null){let e=t.cameras[0].viewport,n=new pn({vertexShader:w_,fragmentShader:T_,uniforms:{depthColor:{value:this.texture},depthWidth:{value:e.z},depthHeight:{value:e.w}}});this.mesh=new on(new In(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}},Hc=class extends Cn{constructor(t,e){super();let n=this,s=null,r=1,o=null,a="local-floor",c=1,l=null,h=null,d=null,u=null,p=null,g=null,v=typeof XRWebGLBinding<"u",m=new Vc,f={},w=e.getContextAttributes(),I=null,x=null,M=[],A=[],N=new mt,y=null,R=null,k=new Xe;k.viewport=new Re;let Y=new Xe;Y.viewport=new Re;let Z=[k,Y],it=new sa,G=null,et=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(z){let U=M[z];return U===void 0&&(U=new Cs,M[z]=U),U.getTargetRaySpace()},this.getControllerGrip=function(z){let U=M[z];return U===void 0&&(U=new Cs,M[z]=U),U.getGripSpace()},this.getHand=function(z){let U=M[z];return U===void 0&&(U=new Cs,M[z]=U),U.getHandSpace()};function nt(z){let U=A.indexOf(z.inputSource);if(U===-1)return;let C=M[U];C!==void 0&&(C.update(z.inputSource,z.frame,l||o),C.dispatchEvent({type:z.type,data:z.inputSource}))}function st(){s.removeEventListener("select",nt),s.removeEventListener("selectstart",nt),s.removeEventListener("selectend",nt),s.removeEventListener("squeeze",nt),s.removeEventListener("squeezestart",nt),s.removeEventListener("squeezeend",nt),s.removeEventListener("end",st),s.removeEventListener("inputsourceschange",Q);for(let z=0;z<M.length;z++){let U=A[z];U!==null&&(A[z]=null,M[z].disconnect(U))}G=null,et=null,m.reset();for(let z in f)delete f[z];if(t.setRenderTarget(I),p=null,u=null,d=null,s=null,x=null,qt.stop(),n.isPresenting=!1,t.setPixelRatio(y),t.setSize(N.width,N.height,!1),R!==null){let z=R.camera;z.fov=R.fov,z.zoom=R.zoom,z.updateProjectionMatrix(),R=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(z){r=z,n.isPresenting===!0&&te("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(z){a=z,n.isPresenting===!0&&te("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||o},this.setReferenceSpace=function(z){l=z},this.getBaseLayer=function(){return u!==null?u:p},this.getBinding=function(){return d===null&&v&&(d=new XRWebGLBinding(s,e)),d},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(z){if(s=z,s!==null){if(I=t.getRenderTarget(),s.addEventListener("select",nt),s.addEventListener("selectstart",nt),s.addEventListener("selectend",nt),s.addEventListener("squeeze",nt),s.addEventListener("squeezestart",nt),s.addEventListener("squeezeend",nt),s.addEventListener("end",st),s.addEventListener("inputsourceschange",Q),w.xrCompatible!==!0&&await e.makeXRCompatible(),y=t.getPixelRatio(),t.getSize(N),v&&"createProjectionLayer"in XRWebGLBinding.prototype){let C=null,L=null,B=null;w.depth&&(B=w.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,C=w.stencil?Fi:Gn,L=w.stencil?Ws:Nn);let tt={colorFormat:e.RGBA8,depthFormat:B,scaleFactor:r};d=this.getBinding(),u=d.createProjectionLayer(tt),s.updateRenderState({layers:[u]}),t.setPixelRatio(1),t.setSize(u.textureWidth,u.textureHeight,!1),x=new rn(u.textureWidth,u.textureHeight,{format:Mn,type:an,depthTexture:new Ei(u.textureWidth,u.textureHeight,L,void 0,void 0,void 0,void 0,void 0,void 0,C),stencilBuffer:w.stencil,colorSpace:t.outputColorSpace,samples:w.antialias?4:0,resolveDepthBuffer:u.ignoreDepthValues===!1,resolveStencilBuffer:u.ignoreDepthValues===!1,storeMultisampledDepthBuffer:u.ignoreDepthValues===!1,storeMultisampledStencilBuffer:u.ignoreDepthValues===!1})}else{let C={antialias:w.antialias,alpha:!0,depth:w.depth,stencil:w.stencil,framebufferScaleFactor:r};p=new XRWebGLLayer(s,e,C),s.updateRenderState({baseLayer:p}),t.setPixelRatio(1),t.setSize(p.framebufferWidth,p.framebufferHeight,!1),x=new rn(p.framebufferWidth,p.framebufferHeight,{format:Mn,type:an,colorSpace:t.outputColorSpace,stencilBuffer:w.stencil,resolveDepthBuffer:p.ignoreDepthValues===!1,resolveStencilBuffer:p.ignoreDepthValues===!1,storeMultisampledDepthBuffer:p.ignoreDepthValues===!1,storeMultisampledStencilBuffer:p.ignoreDepthValues===!1})}x.isXRRenderTarget=!0,this.setFoveation(c),l=null,o=await s.requestReferenceSpace(a),qt.setContext(s),qt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function Q(z){for(let U=0;U<z.removed.length;U++){let C=z.removed[U],L=A.indexOf(C);L>=0&&(A[L]=null,M[L].disconnect(C))}for(let U=0;U<z.added.length;U++){let C=z.added[U],L=A.indexOf(C);if(L===-1){for(let tt=0;tt<M.length;tt++)if(tt>=A.length){A.push(C),L=tt;break}else if(A[tt]===null){A[tt]=C,L=tt;break}if(L===-1)break}let B=M[L];B&&B.connect(C)}}let at=new V,ct=new V;function ft(z,U,C){at.setFromMatrixPosition(U.matrixWorld),ct.setFromMatrixPosition(C.matrixWorld);let L=at.distanceTo(ct),B=U.projectionMatrix.elements,tt=C.projectionMatrix.elements,yt=B[14]/(B[10]-1),T=B[14]/(B[10]+1),X=(B[9]+1)/B[5],F=(B[9]-1)/B[5],K=(B[8]-1)/B[0],j=(tt[8]+1)/tt[0],gt=yt*K,bt=yt*j,wt=L/(-K+j),J=wt*-K;if(U.matrixWorld.decompose(z.position,z.quaternion,z.scale),z.translateX(J),z.translateZ(wt),z.matrixWorld.compose(z.position,z.quaternion,z.scale),z.matrixWorldInverse.copy(z.matrixWorld).invert(),B[10]===-1)z.projectionMatrix.copy(U.projectionMatrix),z.projectionMatrixInverse.copy(U.projectionMatrixInverse);else{let S=yt+wt,Ut=T+wt,Ot=gt-J,b=bt+(L-J),_=X*T/Ut*S,W=F*T/Ut*S;z.projectionMatrix.makePerspective(Ot,b,_,W,S,Ut),z.projectionMatrixInverse.copy(z.projectionMatrix).invert()}}function It(z,U){U===null?z.matrixWorld.copy(z.matrix):z.matrixWorld.multiplyMatrices(U.matrixWorld,z.matrix),z.matrixWorldInverse.copy(z.matrixWorld).invert()}this.updateCamera=function(z){if(s===null)return;let U=z.near,C=z.far;m.texture!==null&&(m.depthNear>0&&(U=m.depthNear),m.depthFar>0&&(C=m.depthFar)),it.near=Y.near=k.near=U,it.far=Y.far=k.far=C,(G!==it.near||et!==it.far)&&(s.updateRenderState({depthNear:it.near,depthFar:it.far}),G=it.near,et=it.far),it.layers.mask=z.layers.mask|6,k.layers.mask=it.layers.mask&-5,Y.layers.mask=it.layers.mask&-3;let L=z.parent,B=it.cameras;It(it,L);for(let tt=0;tt<B.length;tt++)It(B[tt],L);B.length===2?ft(it,k,Y):it.projectionMatrix.copy(k.projectionMatrix),R===null&&z.isPerspectiveCamera&&(R={camera:z,fov:z.fov,zoom:z.zoom}),Nt(z,it,L)};function Nt(z,U,C){C===null?z.matrix.copy(U.matrixWorld):(z.matrix.copy(C.matrixWorld),z.matrix.invert(),z.matrix.multiply(U.matrixWorld)),z.matrix.decompose(z.position,z.quaternion,z.scale),z.updateMatrixWorld(!0),z.projectionMatrix.copy(U.projectionMatrix),z.projectionMatrixInverse.copy(U.projectionMatrixInverse),z.isPerspectiveCamera&&(z.fov=Ts*2*Math.atan(1/z.projectionMatrix.elements[5]),z.zoom=1)}this.getCamera=function(){return it},this.getFoveation=function(){if(!(u===null&&p===null))return c},this.setFoveation=function(z){c=z,u!==null&&(u.fixedFoveation=z),p!==null&&p.fixedFoveation!==void 0&&(p.fixedFoveation=z)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(it)},this.getCameraTexture=function(z){return f[z]};let Xt=null;function Wt(z,U){if(h=U.getViewerPose(l||o),g=U,h!==null){let C=h.views;p!==null&&(t.setRenderTargetFramebuffer(x,p.framebuffer),t.setRenderTarget(x));let L=!1;C.length!==it.cameras.length&&(it.cameras.length=0,L=!0);for(let T=0;T<C.length;T++){let X=C[T],F=null;if(p!==null)F=p.getViewport(X);else{let j=d.getViewSubImage(u,X);F=j.viewport,T===0&&(t.setRenderTargetTextures(x,j.colorTexture,j.depthStencilTexture),t.setRenderTarget(x))}let K=Z[T];K===void 0&&(K=new Xe,K.layers.enable(T),K.viewport=new Re,Z[T]=K),K.matrix.fromArray(X.transform.matrix),K.matrix.decompose(K.position,K.quaternion,K.scale),K.projectionMatrix.fromArray(X.projectionMatrix),K.projectionMatrixInverse.copy(K.projectionMatrix).invert(),K.viewport.set(F.x,F.y,F.width,F.height),T===0&&(it.matrix.copy(K.matrix),it.matrix.decompose(it.position,it.quaternion,it.scale)),L===!0&&it.cameras.push(K)}let B=s.enabledFeatures;if(B&&B.includes("depth-sensing")&&s.depthUsage=="gpu-optimized"&&v){d=n.getBinding();let T=d.getDepthInformation(C[0]);T&&T.isValid&&T.texture&&m.init(T,s.renderState)}if(B&&B.includes("camera-access")&&v){t.state.unbindTexture(),d=n.getBinding();for(let T=0;T<C.length;T++){let X=C[T].camera;if(X){let F=f[X];F||(F=new gr,f[X]=F);let K=d.getCameraImage(X);F.sourceTexture=K}}}}for(let C=0;C<M.length;C++){let L=A[C],B=M[C];L!==null&&B!==void 0&&B.update(L,U,l||o)}Xt&&Xt(z,U),U.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:U}),g=null}let qt=new qu;qt.setAnimationLoop(Wt),this.setAnimationLoop=function(z){Xt=z},this.dispose=function(){}}},A_=new we,ju=new Qt;ju.set(-1,0,0,0,1,0,0,0,1);function R_(i,t){function e(m,f){m.matrixAutoUpdate===!0&&m.updateMatrix(),f.value.copy(m.matrix)}function n(m,f){f.color.getRGB(m.fogColor.value,Ec(i)),f.isFog?(m.fogNear.value=f.near,m.fogFar.value=f.far):f.isFogExp2&&(m.fogDensity.value=f.density)}function s(m,f,w,I,x){f.isNodeMaterial?f.uniformsNeedUpdate=!1:f.isMeshBasicMaterial?r(m,f):f.isMeshLambertMaterial?(r(m,f),f.envMap&&(m.envMapIntensity.value=f.envMapIntensity)):f.isMeshToonMaterial?(r(m,f),d(m,f)):f.isMeshPhongMaterial?(r(m,f),h(m,f),f.envMap&&(m.envMapIntensity.value=f.envMapIntensity)):f.isMeshStandardMaterial?(r(m,f),u(m,f),f.isMeshPhysicalMaterial&&p(m,f,x)):f.isMeshMatcapMaterial?(r(m,f),g(m,f)):f.isMeshDepthMaterial?r(m,f):f.isMeshDistanceMaterial?(r(m,f),v(m,f)):f.isMeshNormalMaterial?r(m,f):f.isLineBasicMaterial?(o(m,f),f.isLineDashedMaterial&&a(m,f)):f.isPointsMaterial?c(m,f,w,I):f.isSpriteMaterial?l(m,f):f.isShadowMaterial?(m.color.value.copy(f.color),m.opacity.value=f.opacity):f.isShaderMaterial&&(f.uniformsNeedUpdate=!1)}function r(m,f){m.opacity.value=f.opacity,f.color&&m.diffuse.value.copy(f.color),f.emissive&&m.emissive.value.copy(f.emissive).multiplyScalar(f.emissiveIntensity),f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.bumpMap&&(m.bumpMap.value=f.bumpMap,e(f.bumpMap,m.bumpMapTransform),m.bumpScale.value=f.bumpScale,f.side===sn&&(m.bumpScale.value*=-1)),f.normalMap&&(m.normalMap.value=f.normalMap,e(f.normalMap,m.normalMapTransform),m.normalScale.value.copy(f.normalScale),f.side===sn&&m.normalScale.value.negate()),f.displacementMap&&(m.displacementMap.value=f.displacementMap,e(f.displacementMap,m.displacementMapTransform),m.displacementScale.value=f.displacementScale,m.displacementBias.value=f.displacementBias),f.emissiveMap&&(m.emissiveMap.value=f.emissiveMap,e(f.emissiveMap,m.emissiveMapTransform)),f.specularMap&&(m.specularMap.value=f.specularMap,e(f.specularMap,m.specularMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest);let w=t.get(f),I=w.envMap,x=w.envMapRotation;I&&(m.envMap.value=I,m.envMapRotation.value.setFromMatrix4(A_.makeRotationFromEuler(x)).transpose(),I.isCubeTexture&&I.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply(ju),m.reflectivity.value=f.reflectivity,m.ior.value=f.ior,m.refractionRatio.value=f.refractionRatio),f.lightMap&&(m.lightMap.value=f.lightMap,m.lightMapIntensity.value=f.lightMapIntensity,e(f.lightMap,m.lightMapTransform)),f.aoMap&&(m.aoMap.value=f.aoMap,m.aoMapIntensity.value=f.aoMapIntensity,e(f.aoMap,m.aoMapTransform))}function o(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform))}function a(m,f){m.dashSize.value=f.dashSize,m.totalSize.value=f.dashSize+f.gapSize,m.scale.value=f.scale}function c(m,f,w,I){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.size.value=f.size*w,m.scale.value=I*.5,f.map&&(m.map.value=f.map,e(f.map,m.uvTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function l(m,f){m.diffuse.value.copy(f.color),m.opacity.value=f.opacity,m.rotation.value=f.rotation,f.map&&(m.map.value=f.map,e(f.map,m.mapTransform)),f.alphaMap&&(m.alphaMap.value=f.alphaMap,e(f.alphaMap,m.alphaMapTransform)),f.alphaTest>0&&(m.alphaTest.value=f.alphaTest)}function h(m,f){m.specular.value.copy(f.specular),m.shininess.value=Math.max(f.shininess,1e-4)}function d(m,f){f.gradientMap&&(m.gradientMap.value=f.gradientMap)}function u(m,f){m.metalness.value=f.metalness,f.metalnessMap&&(m.metalnessMap.value=f.metalnessMap,e(f.metalnessMap,m.metalnessMapTransform)),m.roughness.value=f.roughness,f.roughnessMap&&(m.roughnessMap.value=f.roughnessMap,e(f.roughnessMap,m.roughnessMapTransform)),f.envMap&&(m.envMapIntensity.value=f.envMapIntensity)}function p(m,f,w){m.ior.value=f.ior,f.sheen>0&&(m.sheenColor.value.copy(f.sheenColor).multiplyScalar(f.sheen),m.sheenRoughness.value=f.sheenRoughness,f.sheenColorMap&&(m.sheenColorMap.value=f.sheenColorMap,e(f.sheenColorMap,m.sheenColorMapTransform)),f.sheenRoughnessMap&&(m.sheenRoughnessMap.value=f.sheenRoughnessMap,e(f.sheenRoughnessMap,m.sheenRoughnessMapTransform))),f.clearcoat>0&&(m.clearcoat.value=f.clearcoat,m.clearcoatRoughness.value=f.clearcoatRoughness,f.clearcoatMap&&(m.clearcoatMap.value=f.clearcoatMap,e(f.clearcoatMap,m.clearcoatMapTransform)),f.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=f.clearcoatRoughnessMap,e(f.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),f.clearcoatNormalMap&&(m.clearcoatNormalMap.value=f.clearcoatNormalMap,e(f.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(f.clearcoatNormalScale),f.side===sn&&m.clearcoatNormalScale.value.negate())),f.dispersion>0&&(m.dispersion.value=f.dispersion),f.retroreflectivity>0&&(m.retroreflectivity.value=f.retroreflectivity),f.iridescence>0&&(m.iridescence.value=f.iridescence,m.iridescenceIOR.value=f.iridescenceIOR,m.iridescenceThicknessMinimum.value=f.iridescenceThicknessRange[0],m.iridescenceThicknessMaximum.value=f.iridescenceThicknessRange[1],f.iridescenceMap&&(m.iridescenceMap.value=f.iridescenceMap,e(f.iridescenceMap,m.iridescenceMapTransform)),f.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=f.iridescenceThicknessMap,e(f.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),f.transmission>0&&(m.transmission.value=f.transmission,m.transmissionSamplerMap.value=w.texture,m.transmissionSamplerSize.value.set(w.width,w.height),f.transmissionMap&&(m.transmissionMap.value=f.transmissionMap,e(f.transmissionMap,m.transmissionMapTransform)),m.thickness.value=f.thickness,f.thicknessMap&&(m.thicknessMap.value=f.thicknessMap,e(f.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=f.attenuationDistance,m.attenuationColor.value.copy(f.attenuationColor)),f.anisotropy>0&&(m.anisotropyVector.value.set(f.anisotropy*Math.cos(f.anisotropyRotation),f.anisotropy*Math.sin(f.anisotropyRotation)),f.anisotropyMap&&(m.anisotropyMap.value=f.anisotropyMap,e(f.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=f.specularIntensity,m.specularColor.value.copy(f.specularColor),f.specularColorMap&&(m.specularColorMap.value=f.specularColorMap,e(f.specularColorMap,m.specularColorMapTransform)),f.specularIntensityMap&&(m.specularIntensityMap.value=f.specularIntensityMap,e(f.specularIntensityMap,m.specularIntensityMapTransform))}function g(m,f){f.matcap&&(m.matcap.value=f.matcap)}function v(m,f){let w=t.get(f).light;m.referencePosition.value.setFromMatrixPosition(w.matrixWorld),m.nearDistance.value=w.shadow.camera.near,m.farDistance.value=w.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function C_(i,t,e,n){let s={},r={},o=[],a=i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS);function c(x,M){let A=M.program;n.uniformBlockBinding(x,A)}function l(x,M){let A=s[x.id];A===void 0&&(m(x),A=h(x),s[x.id]=A,x.addEventListener("dispose",w));let N=M.program;n.updateUBOMapping(x,N);let y=t.render.frame;r[x.id]!==y&&(u(x),r[x.id]=y)}function h(x){let M=d();x.__bindingPointIndex=M;let A=i.createBuffer(),N=x.__size,y=x.usage;return i.bindBuffer(i.UNIFORM_BUFFER,A),i.bufferData(i.UNIFORM_BUFFER,N,y),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,M,A),A}function d(){for(let x=0;x<a;x++)if(o.indexOf(x)===-1)return o.push(x),x;return ne("WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function u(x){let M=s[x.id],A=x.uniforms,N=x.__cache;i.bindBuffer(i.UNIFORM_BUFFER,M);for(let y=0,R=A.length;y<R;y++){let k=A[y];if(Array.isArray(k))for(let Y=0,Z=k.length;Y<Z;Y++)p(k[Y],y,Y,N);else p(k,y,0,N)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function p(x,M,A,N){if(v(x,M,A,N)===!0){let y=x.__offset,R=x.value;if(Array.isArray(R)){let k=0;for(let Y=0;Y<R.length;Y++){let Z=R[Y],it=f(Z);g(Z,x.__data,k),typeof Z!="number"&&typeof Z!="boolean"&&!Z.isMatrix3&&!ArrayBuffer.isView(Z)&&(k+=it.storage/Float32Array.BYTES_PER_ELEMENT)}}else g(R,x.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,y,x.__data)}}function g(x,M,A){typeof x=="number"||typeof x=="boolean"?M[0]=x:x.isMatrix3?(M[0]=x.elements[0],M[1]=x.elements[1],M[2]=x.elements[2],M[3]=0,M[4]=x.elements[3],M[5]=x.elements[4],M[6]=x.elements[5],M[7]=0,M[8]=x.elements[6],M[9]=x.elements[7],M[10]=x.elements[8],M[11]=0):ArrayBuffer.isView(x)?M.set(new x.constructor(x.buffer,x.byteOffset,M.length)):x.toArray(M,A)}function v(x,M,A,N){let y=x.value,R=M+"_"+A;if(N[R]===void 0)return typeof y=="number"||typeof y=="boolean"?N[R]=y:ArrayBuffer.isView(y)?N[R]=y.slice():N[R]=y.clone(),!0;{let k=N[R];if(typeof y=="number"||typeof y=="boolean"){if(k!==y)return N[R]=y,!0}else{if(ArrayBuffer.isView(y))return!0;if(k.equals(y)===!1)return k.copy(y),!0}}return!1}function m(x){let M=x.uniforms,A=0,N=16;for(let R=0,k=M.length;R<k;R++){let Y=Array.isArray(M[R])?M[R]:[M[R]];for(let Z=0,it=Y.length;Z<it;Z++){let G=Y[Z],et=Array.isArray(G.value)?G.value:[G.value];for(let nt=0,st=et.length;nt<st;nt++){let Q=et[nt],at=f(Q),ct=A%N,ft=ct%at.boundary,It=ct+ft;A+=ft,It!==0&&N-It<at.storage&&(A+=N-It),G.__data=new Float32Array(at.storage/Float32Array.BYTES_PER_ELEMENT),G.__offset=A,A+=at.storage}}}let y=A%N;return y>0&&(A+=N-y),x.__size=A,x.__cache={},this}function f(x){let M={boundary:0,storage:0};return typeof x=="number"||typeof x=="boolean"?(M.boundary=4,M.storage=4):x.isVector2?(M.boundary=8,M.storage=8):x.isVector3||x.isColor?(M.boundary=16,M.storage=12):x.isVector4?(M.boundary=16,M.storage=16):x.isMatrix3?(M.boundary=48,M.storage=48):x.isMatrix4?(M.boundary=64,M.storage=64):x.isTexture?te("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(x)?(M.boundary=16,M.storage=x.byteLength):te("WebGLRenderer: Unsupported uniform value type.",x),M}function w(x){let M=x.target;M.removeEventListener("dispose",w);let A=o.indexOf(M.__bindingPointIndex);o.splice(A,1),i.deleteBuffer(s[M.id]),delete s[M.id],delete r[M.id]}function I(){for(let x in s)i.deleteBuffer(s[x]);o=[],s={},r={}}return{bind:c,update:l,dispose:I}}var P_=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]),Yn=null;function I_(){return Yn===null&&(Yn=new ai(P_,16,16,Oi,Fn),Yn.name="DFG_LUT",Yn.minFilter=Pe,Yn.magFilter=Pe,Yn.wrapS=yn,Yn.wrapT=yn,Yn.generateMipmaps=!1,Yn.needsUpdate=!0),Yn}var $a=class{constructor(t={}){let{canvas:e=fu(),context:n=null,depth:s=!0,stencil:r=!1,alpha:o=!1,antialias:a=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:d=!1,reversedDepthBuffer:u=!1,outputBufferType:p=an}=t;this.isWebGLRenderer=!0;let g;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");g=n.getContextAttributes().alpha}else g=o;let v=p,m=new Set([fa,da,ua]),f=new Set([an,Nn,Gs,Ws,ca,ha]),w=new Uint32Array(4),I=new Int32Array(4),x=new V,M=null,A=null,N=[],y=[],R=null;this.domElement=e,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=Dn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;let k=this,Y=!1,Z=null,it=null,G=null,et=null;this._outputColorSpace=Ue;let nt=0,st=0,Q=null,at=-1,ct=null,ft=new Re,It=new Re,Nt=null,Xt=new ie(0),Wt=0,qt=e.width,z=e.height,U=1,C=null,L=null,B=new Re(0,0,qt,z),tt=new Re(0,0,qt,z),yt=!1,T=new Is,X=!1,F=!1,K=new we,j=new V,gt=new Re,bt={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0},wt=!1;function J(){return Q===null?U:1}let S=n;function Ut(E,$){return e.getContext(E,$)}let Ot,b,_,W,rt,pt,Rt,P,D,H,lt,Et,vt,Mt,Pt,Bt,$t,q,Ct,xt,Lt,Ft,At;try{let E={alpha:!0,depth:s,stencil:r,antialias:a,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:h,failIfMajorPerformanceCaveat:d};if("setAttribute"in e&&e.setAttribute("data-engine",\`three.js r\${"186"}\`),e.addEventListener("webglcontextlost",Dt,!1),e.addEventListener("webglcontextrestored",Ht,!1),e.addEventListener("webglcontextcreationerror",O,!1),S===null){let $="webgl2";if(S=Ut($,E),S===null)throw Ut($)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}ot()}catch(E){throw e.removeEventListener("webglcontextlost",Dt,!1),e.removeEventListener("webglcontextrestored",Ht,!1),e.removeEventListener("webglcontextcreationerror",O,!1),ne("WebGLRenderer: "+E.message),E}function ot(){Ot=new Bg(S),Ot.init(),Lt=new E_(S,Ot),b=new Rg(S,Ot,t,Lt),_=new M_(S,Ot),b.reversedDepthBuffer&&u&&_.buffers.depth.setReversed(!0),it=S.createFramebuffer(),G=S.createFramebuffer(),et=S.createFramebuffer(),W=new Vg(S),rt=new l_,pt=new b_(S,Ot,_,rt,b,Lt,W),Rt=new Og(k),P=new Gf(S),Ft=new Tg(S,P),D=new zg(S,P,W,Ft),H=new Gg(S,D,P,Ft,W),q=new Hg(S,b,pt),Pt=new Cg(rt),lt=new a_(k,Rt,Ot,b,Ft,Pt),Et=new R_(k,rt),vt=new h_,Mt=new g_(Ot),$t=new wg(k,Rt,_,H,g,c),Bt=new S_(k,H,b),At=new C_(S,W,b,_),Ct=new Ag(S,Ot,W),xt=new kg(S,Ot,W),W.programs=lt.programs,k.capabilities=b,k.extensions=Ot,k.properties=rt,k.renderLists=vt,k.shadowMap=Bt,k.state=_,k.info=W}v!==an&&(R=new Xg(v,e.width,e.height,a,s,r));let Tt=new Hc(k,S);this.xr=Tt,this.getContext=function(){return S},this.getContextAttributes=function(){return S.getContextAttributes()},this.forceContextLoss=function(){let E=Ot.get("WEBGL_lose_context");E&&E.loseContext()},this.forceContextRestore=function(){let E=Ot.get("WEBGL_lose_context");E&&E.restoreContext()},this.getPixelRatio=function(){return U},this.setPixelRatio=function(E){E!==void 0&&(U=E,this.setSize(qt,z,!1))},this.getSize=function(E){return E.set(qt,z)},this.setSize=function(E,$,_t=!0){if(Tt.isPresenting){te("WebGLRenderer: Can't change size while VR device is presenting.");return}qt=E,z=$,e.width=Math.floor(E*U),e.height=Math.floor($*U),_t===!0&&(e.style.width=E+"px",e.style.height=$+"px"),R!==null&&R.setSize(e.width,e.height),this.setViewport(0,0,E,$)},this.getDrawingBufferSize=function(E){return E.set(qt*U,z*U).floor()},this.setDrawingBufferSize=function(E,$,_t){qt=E,z=$,U=_t,e.width=Math.floor(E*_t),e.height=Math.floor($*_t),this.setViewport(0,0,E,$)},this.setEffects=function(E){if(v===an){ne("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(E){for(let $=0;$<E.length;$++)if(E[$].isOutputPass===!0){te("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}R.setEffects(E||[])},this.getCurrentViewport=function(E){return E.copy(ft)},this.getViewport=function(E){return E.copy(B)},this.setViewport=function(E,$,_t,ut){E.isVector4?B.set(E.x,E.y,E.z,E.w):B.set(E,$,_t,ut),_.viewport(ft.copy(B).multiplyScalar(U).round())},this.getScissor=function(E){return E.copy(tt)},this.setScissor=function(E,$,_t,ut){E.isVector4?tt.set(E.x,E.y,E.z,E.w):tt.set(E,$,_t,ut),_.scissor(It.copy(tt).multiplyScalar(U).round())},this.getScissorTest=function(){return yt},this.setScissorTest=function(E){_.setScissorTest(yt=E)},this.setOpaqueSort=function(E){C=E},this.setTransparentSort=function(E){L=E},this.getClearColor=function(E){return E.copy($t.getClearColor())},this.setClearColor=function(){$t.setClearColor(...arguments)},this.getClearAlpha=function(){return $t.getClearAlpha()},this.setClearAlpha=function(){$t.setClearAlpha(...arguments)},this.clear=function(E=!0,$=!0,_t=!0){let ut=0;if(E){let dt=!1;if(Q!==null){let Gt=Q.texture.format;dt=m.has(Gt)}if(dt){let Gt=Q.texture.type,Zt=f.has(Gt),Vt=$t.getClearColor(),Jt=$t.getClearAlpha(),jt=Vt.r,ae=Vt.g,ue=Vt.b;Zt?(w[0]=jt,w[1]=ae,w[2]=ue,w[3]=Jt,S.clearBufferuiv(S.COLOR,0,w)):(I[0]=jt,I[1]=ae,I[2]=ue,I[3]=Jt,S.clearBufferiv(S.COLOR,0,I))}else ut|=S.COLOR_BUFFER_BIT}$&&(ut|=S.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),_t&&(ut|=S.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),ut!==0&&S.clear(ut)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(E){E.setRenderer(this),Z=E},this.dispose=function(){e.removeEventListener("webglcontextlost",Dt,!1),e.removeEventListener("webglcontextrestored",Ht,!1),e.removeEventListener("webglcontextcreationerror",O,!1),$t.dispose(),vt.dispose(),Mt.dispose(),rt.dispose(),Rt.dispose(),H.dispose(),Ft.dispose(),At.dispose(),lt.dispose(),Tt.dispose(),Tt.removeEventListener("sessionstart",he),Tt.removeEventListener("sessionend",ve),pe.stop()};function Dt(E){E.preventDefault(),Sc("WebGLRenderer: Context Lost."),Y=!0}function Ht(){Sc("WebGLRenderer: Context Restored."),Y=!1;let E=W.autoReset,$=Bt.enabled,_t=Bt.autoUpdate,ut=Bt.needsUpdate,dt=Bt.type;ot(),W.autoReset=E,Bt.enabled=$,Bt.autoUpdate=_t,Bt.needsUpdate=ut,Bt.type=dt}function O(E){ne("WebGLRenderer: A WebGL context could not be created. Reason: ",E.statusMessage)}function ht(E){let $=E.target;$.removeEventListener("dispose",ht),St($)}function St(E){kt(E),rt.remove(E)}function kt(E){let $=rt.get(E).programs;$!==void 0&&($.forEach(function(_t){lt.releaseProgram(_t)}),E.isShaderMaterial&&lt.releaseShaderCache(E))}this.renderBufferDirect=function(E,$,_t,ut,dt,Gt){$===null&&($=bt);let Zt=dt.isMesh&&dt.matrixWorld.determinantAffine()<0,Vt=gn(E,$,_t,ut,dt);_.setMaterial(ut,Zt);let Jt=_t.index,jt=1;if(ut.wireframe===!0){if(Jt=D.getWireframeAttribute(_t),Jt===void 0)return;jt=2}let ae=_t.drawRange,ue=_t.attributes.position,Kt=ae.start*jt,_e=(ae.start+ae.count)*jt;Gt!==null&&(Kt=Math.max(Kt,Gt.start*jt),_e=Math.min(_e,(Gt.start+Gt.count)*jt)),Jt!==null?(Kt=Math.max(Kt,0),_e=Math.min(_e,Jt.count)):ue!=null&&(Kt=Math.max(Kt,0),_e=Math.min(_e,ue.count));let De=_e-Kt;if(De<0||De===1/0)return;Ft.setup(dt,ut,Vt,_t,Jt);let Te,be=Ct;if(Jt!==null&&(Te=P.get(Jt),be=xt,be.setIndex(Te)),dt.isMesh)ut.wireframe===!0?(_.setLineWidth(ut.wireframeLinewidth*J()),be.setMode(S.LINES)):be.setMode(S.TRIANGLES);else if(dt.isLine){let Je=ut.linewidth;Je===void 0&&(Je=1),_.setLineWidth(Je*J()),dt.isLineSegments?be.setMode(S.LINES):dt.isLineLoop?be.setMode(S.LINE_LOOP):be.setMode(S.LINE_STRIP)}else dt.isPoints?be.setMode(S.POINTS):dt.isSprite&&be.setMode(S.TRIANGLES);if(dt.isBatchedMesh)if(Ot.get("WEBGL_multi_draw"))be.renderMultiDraw(dt._multiDrawStarts,dt._multiDrawCounts,dt._multiDrawCount);else{let Je=dt._multiDrawStarts,Yt=dt._multiDrawCounts,tn=dt._multiDrawCount,me=Jt?P.get(Jt).bytesPerElement:1,_n=rt.get(ut).currentProgram.getUniforms();for(let zn=0;zn<tn;zn++)_n.setValue(S,"_gl_DrawID",zn),be.render(Je[zn]/me,Yt[zn])}else if(dt.isInstancedMesh)be.renderInstances(Kt,De,dt.count);else if(_t.isInstancedBufferGeometry){let Je=_t._maxInstanceCount!==void 0?_t._maxInstanceCount:1/0,Yt=Math.min(_t.instanceCount,Je);be.renderInstances(Kt,De,Yt)}else be.render(Kt,De)};function ee(E,$,_t,ut){Z!==null&&E.isNodeMaterial&&Z.setObject(ut,E),X===!0&&Pt.setState(E,_t,!1),E.transparent===!0&&E.side===Fe&&E.forceSinglePass===!1?(E.side=sn,E.needsUpdate=!0,ki(E,$,ut),E.side=Ni,E.needsUpdate=!0,ki(E,$,ut),E.side=Fe):ki(E,$,ut)}this.compile=function(E,$,_t=null){_t===null&&(_t=E),Z!==null&&Z.renderStart(E,$,_t),A=Mt.get(_t),A.init($),y.push(A),_t.traverseVisible(function(dt){dt.isLight&&dt.layers.test($.layers)&&(A.pushLight(dt),dt.castShadow&&A.pushShadow(dt))}),E!==_t&&E.traverseVisible(function(dt){dt.isLight&&dt.layers.test($.layers)&&(A.pushLight(dt),dt.castShadow&&A.pushShadow(dt))}),A.setupLights(),Z!==null&&Z.updateLights(A.state.lightsArray),F=this.localClippingEnabled,X=Pt.init(this.clippingPlanes,F),X===!0&&Pt.setGlobalState(this.clippingPlanes,$),Z!==null&&Bt.render(A.state.shadowsArray,_t,$);let ut=new Set;return E.traverse(function(dt){if(!(dt.isMesh||dt.isPoints||dt.isLine||dt.isSprite))return;let Gt=dt.material;if(Gt)if(Array.isArray(Gt))for(let Zt=0;Zt<Gt.length;Zt++){let Vt=Gt[Zt];ee(Vt,_t,$,dt),ut.add(Vt)}else ee(Gt,_t,$,dt),ut.add(Gt)}),A=y.pop(),Z!==null&&Z.renderEnd(),ut},this.compileAsync=function(E,$,_t=null){let ut=this.compile(E,$,_t);return new Promise(dt=>{function Gt(){if(ut.forEach(function(Zt){let Jt=rt.get(Zt).currentProgram;(Jt===void 0||Jt.isReady())&&ut.delete(Zt)}),ut.size===0){dt(E);return}setTimeout(Gt,10)}Ot.get("KHR_parallel_shader_compile")!==null?Gt():setTimeout(Gt,10)})};let se=null;function re(E){se&&se(E)}function he(){pe.stop()}function ve(){pe.start()}let pe=new qu;pe.setAnimationLoop(re),typeof self<"u"&&pe.setContext(self),this.setAnimationLoop=function(E){se=E,Tt.setAnimationLoop(E),E===null?pe.stop():pe.start()},Tt.addEventListener("sessionstart",he),Tt.addEventListener("sessionend",ve),this.render=function(E,$){if($!==void 0&&$.isCamera!==!0){ne("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(Y===!0)return;Z!==null&&Z.renderStart(E,$);let _t=Tt.enabled===!0&&Tt.isPresenting===!0,ut=R!==null&&(Q===null||_t)&&R.begin(k,Q);if(E.matrixWorldAutoUpdate===!0&&E.updateMatrixWorld(),$.parent===null&&$.matrixWorldAutoUpdate===!0&&$.updateMatrixWorld(),Tt.enabled===!0&&Tt.isPresenting===!0&&(R===null||R.isCompositing()===!1)&&(Tt.cameraAutoUpdate===!0&&Tt.updateCamera($),$=Tt.getCamera()),E.isScene===!0&&E.onBeforeRender(k,E,$,Q),A=Mt.get(E,y.length),A.init($),A.state.textureUnits=pt.getTextureUnits(),y.push(A),K.multiplyMatrices($.projectionMatrix,$.matrixWorldInverse),T.setFromProjectionMatrix(K,Rn,$.reversedDepth),F=this.localClippingEnabled,X=Pt.init(this.clippingPlanes,F),M=vt.get(E,N.length),M.init(),N.push(M),Tt.enabled===!0&&Tt.isPresenting===!0){let Zt=k.xr.getDepthSensingMesh();Zt!==null&&ce(Zt,$,-1/0,k.sortObjects)}ce(E,$,0,k.sortObjects),M.finish(),Z!==null&&Z.updateLights(A.state.lightsArray),k.sortObjects===!0&&M.sort(C,L),wt=Tt.enabled===!1||Tt.isPresenting===!1||Tt.hasDepthSensing()===!1,wt&&$t.addToRenderList(M,E),this.info.render.frame++,this.info.autoReset===!0&&this.info.reset(),X===!0&&Pt.beginShadows();let dt=A.state.shadowsArray;if(Bt.render(dt,E,$),X===!0&&Pt.endShadows(),(ut&&R.hasRenderPass())===!1){let Zt=M.opaque,Vt=M.transmissive;if(A.setupLights(),$.isArrayCamera){let Jt=$.cameras;if(Vt.length>0)for(let jt=0,ae=Jt.length;jt<ae;jt++){let ue=Jt[jt];$n(Zt,Vt,E,ue)}wt&&$t.render(E);for(let jt=0,ae=Jt.length;jt<ae;jt++){let ue=Jt[jt];Qe(M,E,ue,ue.viewport)}}else Vt.length>0&&$n(Zt,Vt,E,$),wt&&$t.render(E),Qe(M,E,$)}Q!==null&&st===0&&(pt.updateMultisampleRenderTarget(Q),pt.updateRenderTargetMipmap(Q)),ut&&R.end(k),E.isScene===!0&&E.onAfterRender(k,E,$),Ft.resetDefaultState(),at=-1,ct=null,y.pop(),y.length>0?(A=y[y.length-1],pt.setTextureUnits(A.state.textureUnits),X===!0&&Pt.setGlobalState(k.clippingPlanes,A.state.camera)):A=null,N.pop(),N.length>0?M=N[N.length-1]:M=null,Z!==null&&Z.renderEnd()};function ce(E,$,_t,ut){if(E.visible===!1)return;if(E.layers.test($.layers)){if(E.isGroup)_t=E.renderOrder;else if(E.isLOD)E.autoUpdate===!0&&E.update($);else if(E.isLightProbeGrid)A.pushLightProbeGrid(E);else if(E.isLight)A.pushLight(E),E.castShadow&&A.pushShadow(E);else if(E.isSprite){if(!E.frustumCulled||E.intersectsFrustum(T)){ut&&gt.setFromMatrixPosition(E.matrixWorld).applyMatrix4(K);let Zt=H.update(E),Vt=E.material;Vt.visible&&M.push(E,Zt,Vt,_t,gt.z,null,$)}}else if((E.isMesh||E.isLine||E.isPoints)&&(!E.frustumCulled||E.intersectsFrustum(T))){let Zt=H.update(E),Vt=E.material;if(ut&&(E.boundingSphere!==void 0?(E.boundingSphere===null&&E.computeBoundingSphere(),gt.copy(E.boundingSphere.center)):(Zt.boundingSphere===null&&Zt.computeBoundingSphere(),gt.copy(Zt.boundingSphere.center)),gt.applyMatrix4(E.matrixWorld).applyMatrix4(K)),Array.isArray(Vt)){let Jt=Zt.groups;for(let jt=0,ae=Jt.length;jt<ae;jt++){let ue=Jt[jt],Kt=Vt[ue.materialIndex];Kt&&Kt.visible&&M.push(E,Zt,Kt,_t,gt.z,ue,$)}}else Vt.visible&&M.push(E,Zt,Vt,_t,gt.z,null,$)}}let Gt=E.children;for(let Zt=0,Vt=Gt.length;Zt<Vt;Zt++)ce(Gt[Zt],$,_t,ut)}function Qe(E,$,_t,ut){let{opaque:dt,transmissive:Gt,transparent:Zt}=E;A.setupLightsView(_t),X===!0&&Pt.setGlobalState(k.clippingPlanes,_t),ut&&_.viewport(ft.copy(ut)),dt.length>0&&jn(dt,$,_t),Gt.length>0&&jn(Gt,$,_t),Zt.length>0&&jn(Zt,$,_t),_.buffers.depth.setTest(!0),_.buffers.depth.setMask(!0),_.buffers.color.setMask(!0),_.setPolygonOffset(!1)}function $n(E,$,_t,ut){if((_t.isScene===!0?_t.overrideMaterial:null)!==null)return;if(A.state.transmissionRenderTarget[ut.id]===void 0){let Kt=Ot.has("EXT_color_buffer_half_float")||Ot.has("EXT_color_buffer_float");A.state.transmissionRenderTarget[ut.id]=new rn(1,1,{generateMipmaps:!0,type:Kt?Fn:an,minFilter:Sn,samples:Math.max(4,b.samples),stencilBuffer:r,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:de.workingColorSpace})}let Gt=A.state.transmissionRenderTarget[ut.id],Zt=ut.viewport||ft;Gt.setSize(Zt.z*k.transmissionResolutionScale,Zt.w*k.transmissionResolutionScale);let Vt=k.getRenderTarget(),Jt=k.getActiveCubeFace(),jt=k.getActiveMipmapLevel();k.setRenderTarget(Gt),k.getClearColor(Xt),Wt=k.getClearAlpha(),Wt<1&&k.setClearColor(16777215,.5),k.clear(),wt&&$t.render(_t);let ae=k.toneMapping;k.toneMapping=Dn;let ue=ut.viewport;if(ut.viewport!==void 0&&(ut.viewport=void 0),A.setupLightsView(ut),X===!0&&Pt.setGlobalState(k.clippingPlanes,ut),jn(E,_t,ut),pt.updateMultisampleRenderTarget(Gt),pt.updateRenderTargetMipmap(Gt),Ot.has("WEBGL_multisampled_render_to_texture")===!1){let Kt=!1;for(let _e=0,De=$.length;_e<De;_e++){let Te=$[_e],{object:be,geometry:Je,material:Yt,group:tn}=Te;if(Yt.side===Fe&&be.layers.test(ut.layers)){let me=Yt.side;Yt.side=sn,Yt.needsUpdate=!0,Ks(be,_t,ut,Je,Yt,tn),Yt.side=me,Yt.needsUpdate=!0,Kt=!0}}Kt===!0&&(pt.updateMultisampleRenderTarget(Gt),pt.updateRenderTargetMipmap(Gt))}k.setRenderTarget(Vt,Jt,jt),k.setClearColor(Xt,Wt),ue!==void 0&&(ut.viewport=ue),k.toneMapping=ae}function jn(E,$,_t){let ut=$.isScene===!0?$.overrideMaterial:null;for(let dt=0,Gt=E.length;dt<Gt;dt++){let Zt=E[dt],{object:Vt,geometry:Jt,group:jt}=Zt,ae=Zt.material;ae.allowOverride===!0&&ut!==null&&(ae=ut),Vt.layers.test(_t.layers)&&Ks(Vt,$,_t,Jt,ae,jt)}}function Ks(E,$,_t,ut,dt,Gt){Z!==null&&dt.isNodeMaterial&&Z.setObject(E,dt),E.onBeforeRender(k,$,_t,ut,dt,Gt),E.modelViewMatrix.multiplyMatrices(_t.matrixWorldInverse,E.matrixWorld),E.normalMatrix.getNormalMatrix(E.modelViewMatrix),dt.onBeforeRender(k,$,_t,ut,E,Gt),dt.transparent===!0&&dt.side===Fe&&dt.forceSinglePass===!1?(dt.side=sn,dt.needsUpdate=!0,k.renderBufferDirect(_t,$,ut,dt,E,Gt),dt.side=Ni,dt.needsUpdate=!0,k.renderBufferDirect(_t,$,ut,dt,E,Gt),dt.side=Fe):k.renderBufferDirect(_t,$,ut,dt,E,Gt),E.onAfterRender(k,$,_t,ut,dt,Gt)}function ki(E,$,_t){$.isScene!==!0&&($=bt);let ut=rt.get(E),dt=A.state.lights,Gt=A.state.shadowsArray,Zt=dt.state.version,Vt=lt.getParameters(E,dt.state,Gt,$,_t,A.state.lightProbeGridArray),Jt=lt.getProgramCacheKey(Vt),jt=ut.programs;ut.environment=E.isMeshStandardMaterial||E.isMeshLambertMaterial||E.isMeshPhongMaterial?$.environment:null,ut.fog=$.fog;let ae=E.isMeshStandardMaterial||E.isMeshLambertMaterial&&!E.envMap||E.isMeshPhongMaterial&&!E.envMap;ut.envMap=Rt.get(E.envMap||ut.environment,ae),ut.envMapRotation=ut.environment!==null&&E.envMap===null?$.environmentRotation:E.envMapRotation,jt===void 0&&(E.addEventListener("dispose",ht),jt=new Map,ut.programs=jt);let ue=jt.get(Jt);if(ue!==void 0){if(ut.currentProgram===ue&&ut.lightsStateVersion===Zt)return ss(E,Vt),ue}else Vt.uniforms=lt.getUniforms(E),Z!==null&&E.isNodeMaterial&&Z.build(E,_t,Vt),E.onBeforeCompile(Vt,k),ue=lt.acquireProgram(Vt,Jt),jt.set(Jt,ue),ut.uniforms=Vt.uniforms;let Kt=ut.uniforms;return(!E.isShaderMaterial&&!E.isRawShaderMaterial||E.clipping===!0)&&(Kt.clippingPlanes=Pt.uniform),ss(E,Vt),ut.needsLights=xd(E),ut.lightsStateVersion=Zt,ut.needsLights&&(Kt.ambientLightColor.value=dt.state.ambient,Kt.lightProbe.value=dt.state.probe,Kt.sunLights.value=dt.state.sun,Kt.sunLightShadows.value=dt.state.sunShadow,Kt.directionalLights.value=dt.state.directional,Kt.directionalLightShadows.value=dt.state.directionalShadow,Kt.spotLights.value=dt.state.spot,Kt.spotLightShadows.value=dt.state.spotShadow,Kt.rectAreaLights.value=dt.state.rectArea,Kt.ltc_1.value=dt.state.rectAreaLTC1,Kt.ltc_2.value=dt.state.rectAreaLTC2,Kt.pointLights.value=dt.state.point,Kt.pointLightShadows.value=dt.state.pointShadow,Kt.hemisphereLights.value=dt.state.hemi,Kt.sunShadowMatrix.value=dt.state.sunShadowMatrix,Kt.sunShadowCascade.value=dt.state.sunShadowCascade,Kt.directionalShadowMatrix.value=dt.state.directionalShadowMatrix,Kt.spotLightMatrix.value=dt.state.spotLightMatrix,Kt.spotLightMap.value=dt.state.spotLightMap,Kt.pointShadowMatrix.value=dt.state.pointShadowMatrix),ut.lightProbeGrid=A.state.lightProbeGridArray.length>0,ut.currentProgram=ue,ut.uniformsList=null,ue}function di(E){if(E.uniformsList===null){let $=E.currentProgram.getUniforms();E.uniformsList=Ys.seqWithValue($.seq,E.uniforms)}return E.uniformsList}function ss(E,$){let _t=rt.get(E);_t.outputColorSpace=$.outputColorSpace,_t.batching=$.batching,_t.batchingColor=$.batchingColor,_t.instancing=$.instancing,_t.instancingColor=$.instancingColor,_t.instancingMorph=$.instancingMorph,_t.skinning=$.skinning,_t.morphTargets=$.morphTargets,_t.morphNormals=$.morphNormals,_t.morphColors=$.morphColors,_t.morphTargetsCount=$.morphTargetsCount,_t.numClippingPlanes=$.numClippingPlanes,_t.numIntersection=$.numClipIntersection,_t.vertexAlphas=$.vertexAlphas,_t.vertexTangents=$.vertexTangents,_t.toneMapping=$.toneMapping}function En(E,$){if(E.length===0)return null;if(E.length===1)return E[0].texture!==null?E[0]:null;x.setFromMatrixPosition($.matrixWorld);for(let _t=0,ut=E.length;_t<ut;_t++){let dt=E[_t];if(dt.texture!==null&&dt.boundingBox.containsPoint(x))return dt}return null}function gn(E,$,_t,ut,dt){$.isScene!==!0&&($=bt),pt.resetTextureUnits();let Gt=$.fog,Zt=ut.isMeshStandardMaterial||ut.isMeshLambertMaterial||ut.isMeshPhongMaterial?$.environment:null,Vt=Q===null?k.outputColorSpace:Q.isXRRenderTarget===!0?Q.texture.colorSpace:de.workingColorSpace,Jt=ut.isMeshStandardMaterial||ut.isMeshLambertMaterial&&!ut.envMap||ut.isMeshPhongMaterial&&!ut.envMap,jt=Rt.get(ut.envMap||Zt,Jt),ae=ut.vertexColors===!0&&!!_t.attributes.color&&_t.attributes.color.itemSize===4,ue=!!_t.attributes.tangent&&(!!ut.normalMap||ut.anisotropy>0),Kt=!!_t.morphAttributes.position,_e=!!_t.morphAttributes.normal,De=!!_t.morphAttributes.color,Te=Dn;ut.toneMapped&&(Q===null||Q.isXRRenderTarget===!0)&&(Te=k.toneMapping);let be=_t.morphAttributes.position||_t.morphAttributes.normal||_t.morphAttributes.color,Je=be!==void 0?be.length:0,Yt=rt.get(ut),tn=A.state.lights;if(X===!0&&(F===!0||E!==ct)){let Ee=E===ct&&ut.id===at;Pt.setState(ut,E,Ee)}let me=!1;ut.version===Yt.__version?(Yt.needsLights&&Yt.lightsStateVersion!==tn.state.version||Yt.outputColorSpace!==Vt||dt.isBatchedMesh&&Yt.batching===!1||!dt.isBatchedMesh&&Yt.batching===!0||dt.isBatchedMesh&&Yt.batchingColor===!0&&dt._colorsTexture===null||dt.isBatchedMesh&&Yt.batchingColor===!1&&dt._colorsTexture!==null||dt.isInstancedMesh&&Yt.instancing===!1||!dt.isInstancedMesh&&Yt.instancing===!0||dt.isSkinnedMesh&&Yt.skinning===!1||!dt.isSkinnedMesh&&Yt.skinning===!0||dt.isInstancedMesh&&Yt.instancingColor===!0&&dt.instanceColor===null||dt.isInstancedMesh&&Yt.instancingColor===!1&&dt.instanceColor!==null||dt.isInstancedMesh&&Yt.instancingMorph===!0&&dt.morphTexture===null||dt.isInstancedMesh&&Yt.instancingMorph===!1&&dt.morphTexture!==null||Yt.envMap!==jt||ut.fog===!0&&Yt.fog!==Gt||Yt.numClippingPlanes!==void 0&&(Yt.numClippingPlanes!==Pt.numPlanes||Yt.numIntersection!==Pt.numIntersection)||Yt.vertexAlphas!==ae||Yt.vertexTangents!==ue||Yt.morphTargets!==Kt||Yt.morphNormals!==_e||Yt.morphColors!==De||Yt.toneMapping!==Te||Yt.morphTargetsCount!==Je||!!Yt.lightProbeGrid!=A.state.lightProbeGridArray.length>0)&&(me=!0):(me=!0,Yt.__version=ut.version);let _n=Yt.currentProgram;me===!0&&(_n=ki(ut,$,dt),Z&&ut.isNodeMaterial&&Z.onUpdateProgram(ut,_n,Yt));let zn=!1,fi=!1,rs=!1,Me=_n.getUniforms(),Ie=Yt.uniforms;if(_.useProgram(_n.program)&&(zn=!0,fi=!0,rs=!0),ut.id!==at&&(at=ut.id,fi=!0),Yt.needsLights){let Ee=En(A.state.lightProbeGridArray,dt);Yt.lightProbeGrid!==Ee&&(Yt.lightProbeGrid=Ee,fi=!0)}if(zn||ct!==E){_.buffers.depth.getReversed()&&E.reversedDepth!==!0&&(E._reversedDepth=!0,E.updateProjectionMatrix()),Me.setValue(S,"projectionMatrix",E.projectionMatrix),Me.setValue(S,"viewMatrix",E.matrixWorldInverse);let mi=Me.map.cameraPosition;mi!==void 0&&mi.setValue(S,j.setFromMatrixPosition(E.matrixWorld)),b.logarithmicDepthBuffer&&Me.setValue(S,"logDepthBufFC",2/(Math.log(E.far+1)/Math.LN2)),(ut.isMeshPhongMaterial||ut.isMeshToonMaterial||ut.isMeshLambertMaterial||ut.isMeshBasicMaterial||ut.isMeshStandardMaterial||ut.isShaderMaterial)&&Me.setValue(S,"isOrthographic",E.isOrthographicCamera===!0),ct!==E&&(ct=E,fi=!0,rs=!0)}if(Yt.needsLights&&(tn.state.sunShadowMap.length>0&&Me.setValue(S,"sunShadowMap",tn.state.sunShadowMap,pt),tn.state.directionalShadowMap.length>0&&Me.setValue(S,"directionalShadowMap",tn.state.directionalShadowMap,pt),tn.state.spotShadowMap.length>0&&Me.setValue(S,"spotShadowMap",tn.state.spotShadowMap,pt),tn.state.pointShadowMap.length>0&&Me.setValue(S,"pointShadowMap",tn.state.pointShadowMap,pt)),dt.isSkinnedMesh){Me.setOptional(S,dt,"bindMatrix"),Me.setOptional(S,dt,"bindMatrixInverse");let Ee=dt.skeleton;Ee&&(Ee.boneTexture===null&&Ee.computeBoneTexture(),Me.setValue(S,"boneTexture",Ee.boneTexture,pt))}dt.isBatchedMesh&&(Me.setOptional(S,dt,"batchingTexture"),Me.setValue(S,"batchingTexture",dt._matricesTexture,pt),Me.setOptional(S,dt,"batchingIdTexture"),Me.setValue(S,"batchingIdTexture",dt._indirectTexture,pt),Me.setOptional(S,dt,"batchingColorTexture"),dt._colorsTexture!==null&&Me.setValue(S,"batchingColorTexture",dt._colorsTexture,pt));let pi=_t.morphAttributes;if((pi.position!==void 0||pi.normal!==void 0||pi.color!==void 0)&&q.update(dt,_t,_n),(fi||Yt.receiveShadow!==dt.receiveShadow)&&(Yt.receiveShadow=dt.receiveShadow,Me.setValue(S,"receiveShadow",dt.receiveShadow)),(ut.isMeshStandardMaterial||ut.isMeshLambertMaterial||ut.isMeshPhongMaterial)&&ut.envMap===null&&$.environment!==null&&(Ie.envMapIntensity.value=$.environmentIntensity),Ie.dfgLUT!==void 0&&(Ie.dfgLUT.value=I_()),fi){if(Me.setValue(S,"toneMappingExposure",k.toneMappingExposure),Yt.needsLights&&$r(Ie,rs),Gt&&ut.fog===!0&&Et.refreshFogUniforms(Ie,Gt),Et.refreshMaterialUniforms(Ie,ut,U,z,A.state.transmissionRenderTarget[E.id]),Yt.needsLights&&Yt.lightProbeGrid){let Ee=Yt.lightProbeGrid;Ie.probesSH.value=Ee.texture,Ie.probesMin.value.copy(Ee.boundingBox.min),Ie.probesMax.value.copy(Ee.boundingBox.max),Ie.probesResolution.value.copy(Ee.resolution)}Ys.upload(S,di(Yt),Ie,pt)}if(ut.isShaderMaterial&&ut.uniformsNeedUpdate===!0&&(Ys.upload(S,di(Yt),Ie,pt),ut.uniformsNeedUpdate=!1),ut.isSpriteMaterial&&Me.setValue(S,"center",dt.center),Me.setValue(S,"modelViewMatrix",dt.modelViewMatrix),Me.setValue(S,"normalMatrix",dt.normalMatrix),Me.setValue(S,"modelMatrix",dt.matrixWorld),ut.uniformsGroups!==void 0){let Ee=ut.uniformsGroups;for(let mi=0,os=Ee.length;mi<os;mi++){let jc=Ee[mi];At.update(jc,_n),At.bind(jc,_n)}}return _n}function $r(E,$){E.ambientLightColor.needsUpdate=$,E.lightProbe.needsUpdate=$,E.sunLights.needsUpdate=$,E.sunLightShadows.needsUpdate=$,E.directionalLights.needsUpdate=$,E.directionalLightShadows.needsUpdate=$,E.pointLights.needsUpdate=$,E.pointLightShadows.needsUpdate=$,E.spotLights.needsUpdate=$,E.spotLightShadows.needsUpdate=$,E.rectAreaLights.needsUpdate=$,E.hemisphereLights.needsUpdate=$}function xd(E){return E.isMeshLambertMaterial||E.isMeshToonMaterial||E.isMeshPhongMaterial||E.isMeshStandardMaterial||E.isShadowMaterial||E.isShaderMaterial&&E.lights===!0}this.getActiveCubeFace=function(){return nt},this.getActiveMipmapLevel=function(){return st},this.getRenderTarget=function(){return Q},this.setRenderTargetTextures=function(E,$,_t){let ut=rt.get(E);ut.__autoAllocateDepthBuffer=E.resolveDepthBuffer===!1,ut.__autoAllocateDepthBuffer===!1&&(ut.__useRenderToTexture=!1),rt.get(E.texture).__webglTexture=$,rt.get(E.depthTexture).__webglTexture=ut.__autoAllocateDepthBuffer?void 0:_t,ut.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(E,$){let _t=rt.get(E);_t.__webglFramebuffer=$,_t.__useDefaultFramebuffer=$===void 0},this.setRenderTarget=function(E,$=0,_t=0){Q=E,nt=$,st=_t;let ut=null,dt=!1,Gt=!1;if(E){let Vt=rt.get(E);if(Vt.__useDefaultFramebuffer!==void 0){_.bindFramebuffer(S.FRAMEBUFFER,Vt.__webglFramebuffer),ft.copy(E.viewport),It.copy(E.scissor),Nt=E.scissorTest,_.viewport(ft),_.scissor(It),_.setScissorTest(Nt),at=-1;return}else if(Vt.__webglFramebuffer===void 0)pt.setupRenderTarget(E);else if(Vt.__hasExternalTextures)pt.rebindTextures(E,rt.get(E.texture).__webglTexture,rt.get(E.depthTexture).__webglTexture);else if(E.depthBuffer){let ae=E.depthTexture;if(Vt.__boundDepthTexture!==ae){if(ae!==null&&rt.has(ae)&&(E.width!==ae.image.width||E.height!==ae.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");pt.setupDepthRenderbuffer(E)}}let Jt=E.texture;(Jt.isData3DTexture||Jt.isDataArrayTexture||Jt.isCompressedArrayTexture)&&(Gt=!0);let jt=rt.get(E).__webglFramebuffer;E.isWebGLCubeRenderTarget?(Array.isArray(jt[$])?ut=jt[$][_t]:ut=jt[$],dt=!0):E.samples>0&&pt.useMultisampledRTT(E)===!1?ut=rt.get(E).__webglMultisampledFramebuffer:Array.isArray(jt)?ut=jt[_t]:ut=jt,ft.copy(E.viewport),It.copy(E.scissor),Nt=E.scissorTest}else ft.copy(B).multiplyScalar(U).floor(),It.copy(tt).multiplyScalar(U).floor(),Nt=yt;if(_t!==0&&(ut=it),_.bindFramebuffer(S.FRAMEBUFFER,ut)&&_.drawBuffers(E,ut),_.viewport(ft),_.scissor(It),_.setScissorTest(Nt),dt){let Vt=rt.get(E.texture);S.framebufferTexture2D(S.FRAMEBUFFER,S.COLOR_ATTACHMENT0,S.TEXTURE_CUBE_MAP_POSITIVE_X+$,Vt.__webglTexture,_t)}else if(Gt){let Vt=$;for(let Jt=0;Jt<E.textures.length;Jt++){let jt=rt.get(E.textures[Jt]);S.framebufferTextureLayer(S.FRAMEBUFFER,S.COLOR_ATTACHMENT0+Jt,jt.__webglTexture,_t,Vt)}}else if(E!==null&&_t!==0){let Vt=rt.get(E.texture);S.framebufferTexture2D(S.FRAMEBUFFER,S.COLOR_ATTACHMENT0,S.TEXTURE_2D,Vt.__webglTexture,_t)}at=-1};function $c(E){let $=rt.get(E);return($.__readFormat!==E.format||$.__readType!==E.type)&&($.__readFormat=E.format,$.__readType=E.type,$.__formatReadable=b.textureFormatReadable(E.format),$.__typeReadable=b.textureTypeReadable(E.type)),$}this.readRenderTargetPixels=function(E,$,_t,ut,dt,Gt,Zt,Vt=0){if(!(E&&E.isWebGLRenderTarget)){ne("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Jt=rt.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&Zt!==void 0&&(Jt=Jt[Zt]),Jt){_.bindFramebuffer(S.FRAMEBUFFER,Jt);try{let jt=E.textures[Vt],ae=jt.format,ue=jt.type;E.textures.length>1&&S.readBuffer(S.COLOR_ATTACHMENT0+Vt);let Kt=$c(jt);if(Kt.__formatReadable===!1){ne("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(Kt.__typeReadable===!1){ne("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}$>=0&&$<=E.width-ut&&_t>=0&&_t<=E.height-dt&&S.readPixels($,_t,ut,dt,Lt.convert(ae),Lt.convert(ue),Gt)}finally{let jt=Q!==null?rt.get(Q).__webglFramebuffer:null;_.bindFramebuffer(S.FRAMEBUFFER,jt)}}},this.readRenderTargetPixelsAsync=async function(E,$,_t,ut,dt,Gt,Zt,Vt=0){if(!(E&&E.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let Jt=rt.get(E).__webglFramebuffer;if(E.isWebGLCubeRenderTarget&&Zt!==void 0&&(Jt=Jt[Zt]),Jt)if($>=0&&$<=E.width-ut&&_t>=0&&_t<=E.height-dt){_.bindFramebuffer(S.FRAMEBUFFER,Jt);let jt=E.textures[Vt],ae=jt.format,ue=jt.type;E.textures.length>1&&S.readBuffer(S.COLOR_ATTACHMENT0+Vt);let Kt=$c(jt);if(Kt.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(Kt.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");let _e=S.createBuffer();S.bindBuffer(S.PIXEL_PACK_BUFFER,_e),S.bufferData(S.PIXEL_PACK_BUFFER,Gt.byteLength,S.STREAM_READ),S.readPixels($,_t,ut,dt,Lt.convert(ae),Lt.convert(ue),0),S.bindBuffer(S.PIXEL_PACK_BUFFER,null);let De=Q!==null?rt.get(Q).__webglFramebuffer:null;_.bindFramebuffer(S.FRAMEBUFFER,De);let Te=S.fenceSync(S.SYNC_GPU_COMMANDS_COMPLETE,0);return S.flush(),await mu(S,Te,4),S.bindBuffer(S.PIXEL_PACK_BUFFER,_e),S.getBufferSubData(S.PIXEL_PACK_BUFFER,0,Gt),S.bindBuffer(S.PIXEL_PACK_BUFFER,null),S.deleteBuffer(_e),S.deleteSync(Te),Gt}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(E,$=null,_t=0){let ut=Math.pow(2,-_t),dt=Math.floor(E.image.width*ut),Gt=Math.floor(E.image.height*ut),Zt=$!==null?$.x:0,Vt=$!==null?$.y:0;pt.setTexture2D(E,0),S.copyTexSubImage2D(S.TEXTURE_2D,_t,0,0,Zt,Vt,dt,Gt),_.unbindTexture()},this.copyTextureToTexture=function(E,$,_t=null,ut=null,dt=0,Gt=0){let Zt,Vt,Jt,jt,ae,ue,Kt,_e,De,Te=E.isCompressedTexture?E.mipmaps[Gt]:E.image;if(_t!==null)Zt=_t.max.x-_t.min.x,Vt=_t.max.y-_t.min.y,Jt=_t.isBox3?_t.max.z-_t.min.z:1,jt=_t.min.x,ae=_t.min.y,ue=_t.isBox3?_t.min.z:0;else{let Ie=Math.pow(2,-dt);Zt=Math.floor(Te.width*Ie),Vt=Math.floor(Te.height*Ie),E.isDataArrayTexture?Jt=Te.depth:E.isData3DTexture?Jt=Math.floor(Te.depth*Ie):Jt=1,jt=0,ae=0,ue=0}ut!==null?(Kt=ut.x,_e=ut.y,De=ut.z):(Kt=0,_e=0,De=0);let be=Lt.convert($.format),Je=Lt.convert($.type),Yt;$.isData3DTexture?(pt.setTexture3D($,0),Yt=S.TEXTURE_3D):$.isDataArrayTexture||$.isCompressedArrayTexture?(pt.setTexture2DArray($,0),Yt=S.TEXTURE_2D_ARRAY):(pt.setTexture2D($,0),Yt=S.TEXTURE_2D),_.activeTexture(S.TEXTURE0),_.pixelStorei(S.UNPACK_FLIP_Y_WEBGL,$.flipY),_.pixelStorei(S.UNPACK_PREMULTIPLY_ALPHA_WEBGL,$.premultiplyAlpha),_.pixelStorei(S.UNPACK_ALIGNMENT,$.unpackAlignment);let tn=_.getParameter(S.UNPACK_ROW_LENGTH),me=_.getParameter(S.UNPACK_IMAGE_HEIGHT),_n=_.getParameter(S.UNPACK_SKIP_PIXELS),zn=_.getParameter(S.UNPACK_SKIP_ROWS),fi=_.getParameter(S.UNPACK_SKIP_IMAGES);_.pixelStorei(S.UNPACK_ROW_LENGTH,Te.width),_.pixelStorei(S.UNPACK_IMAGE_HEIGHT,Te.height),_.pixelStorei(S.UNPACK_SKIP_PIXELS,jt),_.pixelStorei(S.UNPACK_SKIP_ROWS,ae),_.pixelStorei(S.UNPACK_SKIP_IMAGES,ue);let rs=E.isDataArrayTexture||E.isData3DTexture,Me=$.isDataArrayTexture||$.isData3DTexture;if(E.isDepthTexture){let Ie=rt.get(E),pi=rt.get($),Ee=rt.get(Ie.__renderTarget),mi=rt.get(pi.__renderTarget);_.bindFramebuffer(S.READ_FRAMEBUFFER,Ee.__webglFramebuffer),_.bindFramebuffer(S.DRAW_FRAMEBUFFER,mi.__webglFramebuffer);for(let os=0;os<Jt;os++)rs&&(S.framebufferTextureLayer(S.READ_FRAMEBUFFER,S.COLOR_ATTACHMENT0,rt.get(E).__webglTexture,dt,ue+os),S.framebufferTextureLayer(S.DRAW_FRAMEBUFFER,S.COLOR_ATTACHMENT0,rt.get($).__webglTexture,Gt,De+os)),S.blitFramebuffer(jt,ae,Zt,Vt,Kt,_e,Zt,Vt,S.DEPTH_BUFFER_BIT,S.NEAREST);_.bindFramebuffer(S.READ_FRAMEBUFFER,null),_.bindFramebuffer(S.DRAW_FRAMEBUFFER,null)}else if(dt!==0||E.isRenderTargetTexture||rt.has(E)){let Ie=rt.get(E),pi=rt.get($);_.bindFramebuffer(S.READ_FRAMEBUFFER,G),_.bindFramebuffer(S.DRAW_FRAMEBUFFER,et);for(let Ee=0;Ee<Jt;Ee++)rs?S.framebufferTextureLayer(S.READ_FRAMEBUFFER,S.COLOR_ATTACHMENT0,Ie.__webglTexture,dt,ue+Ee):S.framebufferTexture2D(S.READ_FRAMEBUFFER,S.COLOR_ATTACHMENT0,S.TEXTURE_2D,Ie.__webglTexture,dt),Me?S.framebufferTextureLayer(S.DRAW_FRAMEBUFFER,S.COLOR_ATTACHMENT0,pi.__webglTexture,Gt,De+Ee):S.framebufferTexture2D(S.DRAW_FRAMEBUFFER,S.COLOR_ATTACHMENT0,S.TEXTURE_2D,pi.__webglTexture,Gt),dt!==0?S.blitFramebuffer(jt,ae,Zt,Vt,Kt,_e,Zt,Vt,S.COLOR_BUFFER_BIT,S.NEAREST):Me?S.copyTexSubImage3D(Yt,Gt,Kt,_e,De+Ee,jt,ae,Zt,Vt):S.copyTexSubImage2D(Yt,Gt,Kt,_e,jt,ae,Zt,Vt);_.bindFramebuffer(S.READ_FRAMEBUFFER,null),_.bindFramebuffer(S.DRAW_FRAMEBUFFER,null)}else Me?E.isDataTexture||E.isData3DTexture?S.texSubImage3D(Yt,Gt,Kt,_e,De,Zt,Vt,Jt,be,Je,Te.data):$.isCompressedArrayTexture?S.compressedTexSubImage3D(Yt,Gt,Kt,_e,De,Zt,Vt,Jt,be,Te.data):S.texSubImage3D(Yt,Gt,Kt,_e,De,Zt,Vt,Jt,be,Je,Te):E.isDataTexture?S.texSubImage2D(S.TEXTURE_2D,Gt,Kt,_e,Zt,Vt,be,Je,Te.data):E.isCompressedTexture?S.compressedTexSubImage2D(S.TEXTURE_2D,Gt,Kt,_e,Te.width,Te.height,be,Te.data):S.texSubImage2D(S.TEXTURE_2D,Gt,Kt,_e,Zt,Vt,be,Je,Te);_.pixelStorei(S.UNPACK_ROW_LENGTH,tn),_.pixelStorei(S.UNPACK_IMAGE_HEIGHT,me),_.pixelStorei(S.UNPACK_SKIP_PIXELS,_n),_.pixelStorei(S.UNPACK_SKIP_ROWS,zn),_.pixelStorei(S.UNPACK_SKIP_IMAGES,fi),Gt===0&&$.generateMipmaps&&S.generateMipmap(Yt),_.unbindTexture()},this.initRenderTarget=function(E){rt.get(E).__webglFramebuffer===void 0&&pt.setupRenderTarget(E)},this.initTexture=function(E){E.isCubeTexture?pt.setTextureCube(E,0):E.isData3DTexture?pt.setTexture3D(E,0):E.isDataArrayTexture||E.isCompressedArrayTexture?pt.setTexture2DArray(E,0):pt.setTexture2D(E,0),_.unbindTexture()},this.resetState=function(){nt=0,st=0,Q=null,_.reset(),Ft.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Rn}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=de._getDrawingBufferColorSpace(t),e.unpackColorSpace=de._getUnpackColorSpace()}};function Qu({canvas:i,camera:t,floors:e,marble:n,side:s,viewer:r,draw:o}){let a=n.clone(),c=[a,s],l=new hi,h=new mt,d=new Map,u,p,g=new Set,v;function m(){return r.parentElement.dataset.editing==="true"||r.classList.contains("show-source")}return i.addEventListener("pointerdown",f=>{g.add(f.pointerId),v=g.size===1&&f.button===0&&!m()?{id:f.pointerId,x:f.clientX,y:f.clientY}:null}),i.addEventListener("pointermove",f=>{v&&Math.hypot(f.clientX-v.x,f.clientY-v.y)>6&&(v=null)}),i.addEventListener("pointercancel",f=>{g.delete(f.pointerId),v=null}),i.addEventListener("pointerup",f=>{g.delete(f.pointerId);let w=v;if(v=null,!w||w.id!==f.pointerId||m()||!u||Math.hypot(f.clientX-w.x,f.clientY-w.y)>6)return;let I=i.getBoundingClientRect();h.set(2*(f.clientX-I.left)/I.width-1,1-2*(f.clientY-I.top)/I.height),l.setFromCamera(h,t);let M=l.intersectObjects(e,!1)[0]?.object.userData.roomPath;d.has(M)&&u(M)}),window.deebotSetRooms=(f,w,I,x)=>{u=x;let M=JSON.stringify([f,w,I]);if(M===p)return;p=M,d=new Map(f.map(({path:N,id:y})=>[N,y]));let A=new Set(w);for(let N of e)N.material=N.userData.roomPath===I||A.has(d.get(N.userData.roomPath))?c:N.userData.baseMaterial;r.dataset.selectedRooms=w.join(","),o()},f=>{a.color.setHex(f?14267531:14793612),a.emissive.setHex(f?7293224:5125150),a.emissiveIntensity=f?.35:.12}}var td={type:"change"},Wc={type:"start"},nd={type:"end"},el=new bi,ed=new We,L_=Math.cos(70*Oe.DEG2RAD),Ve=new V,ln=2*Math.PI,Se={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6},Gc=1e-6,nl=class extends Lr{constructor(t,e=null){super(t,e),this.state=Se.NONE,this.target=new V,this.cursor=new V,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minTargetRadius=0,this.maxTargetRadius=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.keyRotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.zoomToCursor=!1,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:Li.ROTATE,MIDDLE:Li.DOLLY,RIGHT:Li.PAN},this.touches={ONE:Di.ROTATE,TWO:Di.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._cursorStyle="auto",this._domElementKeyEvents=null,this._lastPosition=new V,this._lastQuaternion=new dn,this._lastTargetPosition=new V,this._quat=new dn().setFromUnitVectors(t.up,new V(0,1,0)),this._quatInverse=this._quat.clone().invert(),this._spherical=new ks,this._sphericalDelta=new ks,this._scale=1,this._panOffset=new V,this._rotateStart=new mt,this._rotateEnd=new mt,this._rotateDelta=new mt,this._panStart=new mt,this._panEnd=new mt,this._panDelta=new mt,this._dollyStart=new mt,this._dollyEnd=new mt,this._dollyDelta=new mt,this._dollyDirection=new V,this._mouse=new mt,this._performCursorZoom=!1,this._pointers=[],this._pointerPositions={},this._controlActive=!1,this._onPointerMove=N_.bind(this),this._onPointerDown=D_.bind(this),this._onPointerUp=U_.bind(this),this._onContextMenu=H_.bind(this),this._onMouseWheel=B_.bind(this),this._onKeyDown=z_.bind(this),this._onTouchStart=k_.bind(this),this._onTouchMove=V_.bind(this),this._onMouseDown=F_.bind(this),this._onMouseMove=O_.bind(this),this._interceptControlDown=G_.bind(this),this._interceptControlUp=W_.bind(this),this.domElement!==null&&this.connect(this.domElement),this.update()}set cursorStyle(t){this._cursorStyle=t,t==="grab"?this.domElement.style.cursor="grab":this.domElement.style.cursor="auto"}get cursorStyle(){return this._cursorStyle}connect(t){super.connect(t),this.domElement.addEventListener("pointerdown",this._onPointerDown),this.domElement.addEventListener("pointercancel",this._onPointerUp),this.domElement.addEventListener("contextmenu",this._onContextMenu),this.domElement.addEventListener("wheel",this._onMouseWheel,{passive:!1}),this.domElement.getRootNode().addEventListener("keydown",this._interceptControlDown,{passive:!0,capture:!0}),this.domElement.style.touchAction="none"}disconnect(){this.state=Se.NONE,this.domElement.removeEventListener("pointerdown",this._onPointerDown),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.domElement.removeEventListener("pointercancel",this._onPointerUp),this.domElement.removeEventListener("wheel",this._onMouseWheel),this.domElement.removeEventListener("contextmenu",this._onContextMenu),this.stopListenToKeyEvents();let t=this.domElement.getRootNode();t.removeEventListener("keydown",this._interceptControlDown,{capture:!0}),t.removeEventListener("keyup",this._interceptControlUp,{capture:!0}),this._controlActive=!1,this._pointers.length=0,this._pointerPositions={},this.domElement.style.touchAction="",this.domElement.style.cursor="auto"}dispose(){this.disconnect()}getPolarAngle(){return this._spherical.phi}getAzimuthalAngle(){return this._spherical.theta}getDistance(){return this.object.position.distanceTo(this.target)}listenToKeyEvents(t){t.addEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=t}stopListenToKeyEvents(){this._domElementKeyEvents!==null&&(this._domElementKeyEvents.removeEventListener("keydown",this._onKeyDown),this._domElementKeyEvents=null)}saveState(){this.target0.copy(this.target),this.position0.copy(this.object.position),this.zoom0=this.object.zoom}reset(){this.target.copy(this.target0),this.object.position.copy(this.position0),this.object.zoom=this.zoom0,this.object.updateProjectionMatrix(),this.dispatchEvent(td),this.update(),this.state=Se.NONE}pan(t,e){this._pan(t,e),this.update()}dollyIn(t){this._dollyIn(t),this.update()}dollyOut(t){this._dollyOut(t),this.update()}rotateLeft(t){this._rotateLeft(t),this.update()}rotateUp(t){this._rotateUp(t),this.update()}update(t=null){let e=this.object.position;Ve.copy(e).sub(this.target),Ve.applyQuaternion(this._quat),this._spherical.setFromVector3(Ve),this.autoRotate&&this.state===Se.NONE&&this._rotateLeft(this._getAutoRotationAngle(t)),this.enableDamping?(this._spherical.theta+=this._sphericalDelta.theta*this.dampingFactor,this._spherical.phi+=this._sphericalDelta.phi*this.dampingFactor):(this._spherical.theta+=this._sphericalDelta.theta,this._spherical.phi+=this._sphericalDelta.phi);let n=this.minAzimuthAngle,s=this.maxAzimuthAngle;isFinite(n)&&isFinite(s)&&(n<-Math.PI?n+=ln:n>Math.PI&&(n-=ln),s<-Math.PI?s+=ln:s>Math.PI&&(s-=ln),n<=s?this._spherical.theta=Math.max(n,Math.min(s,this._spherical.theta)):this._spherical.theta=this._spherical.theta>(n+s)/2?Math.max(n,this._spherical.theta):Math.min(s,this._spherical.theta)),this._spherical.phi=Math.max(this.minPolarAngle,Math.min(this.maxPolarAngle,this._spherical.phi)),this._spherical.makeSafe(),this.enableDamping===!0?this.target.addScaledVector(this._panOffset,this.dampingFactor):this.target.add(this._panOffset),this.target.sub(this.cursor),this.target.clampLength(this.minTargetRadius,this.maxTargetRadius),this.target.add(this.cursor);let r=!1;if(this.zoomToCursor&&this._performCursorZoom||this.object.isOrthographicCamera)this._spherical.radius=this._clampDistance(this._spherical.radius);else{let o=this._spherical.radius;this._spherical.radius=this._clampDistance(this._spherical.radius*this._scale),r=o!=this._spherical.radius}if(Ve.setFromSpherical(this._spherical),Ve.applyQuaternion(this._quatInverse),e.copy(this.target).add(Ve),this.object.lookAt(this.target),this.enableDamping===!0?(this._sphericalDelta.theta*=1-this.dampingFactor,this._sphericalDelta.phi*=1-this.dampingFactor,this._panOffset.multiplyScalar(1-this.dampingFactor)):(this._sphericalDelta.set(0,0,0),this._panOffset.set(0,0,0)),this.zoomToCursor&&this._performCursorZoom){let o=null;if(this.object.isPerspectiveCamera){let a=Ve.length();o=this._clampDistance(a*this._scale);let c=a-o;this.object.position.addScaledVector(this._dollyDirection,c),this.object.updateMatrixWorld(),r=!!c}else if(this.object.isOrthographicCamera){let a=new V(this._mouse.x,this._mouse.y,0);a.unproject(this.object);let c=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),this.object.updateProjectionMatrix(),r=c!==this.object.zoom;let l=new V(this._mouse.x,this._mouse.y,0);l.unproject(this.object),this.object.position.sub(l).add(a),this.object.updateMatrixWorld(),o=Ve.length()}else console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."),this.zoomToCursor=!1;o!==null&&(this.screenSpacePanning?this.target.set(0,0,-1).transformDirection(this.object.matrix).multiplyScalar(o).add(this.object.position):(el.origin.copy(this.object.position),el.direction.set(0,0,-1).transformDirection(this.object.matrix),Math.abs(this.object.up.dot(el.direction))<L_?this.object.lookAt(this.target):(ed.setFromNormalAndCoplanarPoint(this.object.up,this.target),el.intersectPlane(ed,this.target))))}else if(this.object.isOrthographicCamera){let o=this.object.zoom;this.object.zoom=Math.max(this.minZoom,Math.min(this.maxZoom,this.object.zoom/this._scale)),o!==this.object.zoom&&(this.object.updateProjectionMatrix(),r=!0)}return this._scale=1,this._performCursorZoom=!1,r||this._lastPosition.distanceToSquared(this.object.position)>Gc||8*(1-this._lastQuaternion.dot(this.object.quaternion))>Gc||this._lastTargetPosition.distanceToSquared(this.target)>Gc?(this.dispatchEvent(td),this._lastPosition.copy(this.object.position),this._lastQuaternion.copy(this.object.quaternion),this._lastTargetPosition.copy(this.target),!0):!1}_getAutoRotationAngle(t){return t!==null?ln/60*this.autoRotateSpeed*t:ln/60/60*this.autoRotateSpeed}_getZoomScale(t){let e=Math.abs(t*.01);return Math.pow(.95,this.zoomSpeed*e)}_rotateLeft(t){this._sphericalDelta.theta-=t}_rotateUp(t){this._sphericalDelta.phi-=t}_panLeft(t,e){Ve.setFromMatrixColumn(e,0),Ve.multiplyScalar(-t),this._panOffset.add(Ve)}_panUp(t,e){this.screenSpacePanning===!0?Ve.setFromMatrixColumn(e,1):(Ve.setFromMatrixColumn(e,0),Ve.crossVectors(this.object.up,Ve)),Ve.multiplyScalar(t),this._panOffset.add(Ve)}_pan(t,e){let n=this.domElement;if(this.object.isPerspectiveCamera){let s=this.object.position;Ve.copy(s).sub(this.target);let r=Ve.length();r*=Math.tan(this.object.fov/2*Math.PI/180),this._panLeft(2*t*r/n.clientHeight,this.object.matrix),this._panUp(2*e*r/n.clientHeight,this.object.matrix)}else this.object.isOrthographicCamera?(this._panLeft(t*(this.object.right-this.object.left)/this.object.zoom/n.clientWidth,this.object.matrix),this._panUp(e*(this.object.top-this.object.bottom)/this.object.zoom/n.clientHeight,this.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),this.enablePan=!1)}_dollyOut(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale/=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_dollyIn(t){this.object.isPerspectiveCamera||this.object.isOrthographicCamera?this._scale*=t:(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),this.enableZoom=!1)}_updateZoomParameters(t,e){if(!this.zoomToCursor)return;this._performCursorZoom=!0;let n=this.domElement.getBoundingClientRect(),s=t-n.left,r=e-n.top,o=n.width,a=n.height;this._mouse.x=s/o*2-1,this._mouse.y=-(r/a)*2+1,this._dollyDirection.set(this._mouse.x,this._mouse.y,1).unproject(this.object).sub(this.object.position).normalize()}_clampDistance(t){return Math.max(this.minDistance,Math.min(this.maxDistance,t))}_handleMouseDownRotate(t){this._rotateStart.set(t.clientX,t.clientY)}_handleMouseDownDolly(t){this._updateZoomParameters(t.clientX,t.clientX),this._dollyStart.set(t.clientX,t.clientY)}_handleMouseDownPan(t){this._panStart.set(t.clientX,t.clientY)}_handleMouseMoveRotate(t){this._rotateEnd.set(t.clientX,t.clientY),this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(ln*this._rotateDelta.x/e.clientHeight),this._rotateUp(ln*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd),this.update()}_handleMouseMoveDolly(t){this._dollyEnd.set(t.clientX,t.clientY),this._dollyDelta.subVectors(this._dollyEnd,this._dollyStart),this._dollyDelta.y>0?this._dollyOut(this._getZoomScale(this._dollyDelta.y)):this._dollyDelta.y<0&&this._dollyIn(this._getZoomScale(this._dollyDelta.y)),this._dollyStart.copy(this._dollyEnd),this.update()}_handleMouseMovePan(t){this._panEnd.set(t.clientX,t.clientY),this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd),this.update()}_handleMouseWheel(t){this._updateZoomParameters(t.clientX,t.clientY),t.deltaY<0?this._dollyIn(this._getZoomScale(t.deltaY)):t.deltaY>0&&this._dollyOut(this._getZoomScale(t.deltaY)),this.update()}_handleKeyDown(t){let e=!1;switch(t.code){case this.keys.UP:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(ln*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,this.keyPanSpeed),e=!0;break;case this.keys.BOTTOM:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateUp(-ln*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(0,-this.keyPanSpeed),e=!0;break;case this.keys.LEFT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(ln*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(this.keyPanSpeed,0),e=!0;break;case this.keys.RIGHT:t.ctrlKey||t.metaKey||t.shiftKey?this.enableRotate&&this._rotateLeft(-ln*this.keyRotateSpeed/this.domElement.clientHeight):this.enablePan&&this._pan(-this.keyPanSpeed,0),e=!0;break}e&&(t.preventDefault(),this.update())}_handleTouchStartRotate(t){if(this._pointers.length===1)this._rotateStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._rotateStart.set(n,s)}}_handleTouchStartPan(t){if(this._pointers.length===1)this._panStart.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panStart.set(n,s)}}_handleTouchStartDolly(t){let e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyStart.set(0,r)}_handleTouchStartDollyPan(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enablePan&&this._handleTouchStartPan(t)}_handleTouchStartDollyRotate(t){this.enableZoom&&this._handleTouchStartDolly(t),this.enableRotate&&this._handleTouchStartRotate(t)}_handleTouchMoveRotate(t){if(this._pointers.length==1)this._rotateEnd.set(t.pageX,t.pageY);else{let n=this._getSecondPointerPosition(t),s=.5*(t.pageX+n.x),r=.5*(t.pageY+n.y);this._rotateEnd.set(s,r)}this._rotateDelta.subVectors(this._rotateEnd,this._rotateStart).multiplyScalar(this.rotateSpeed);let e=this.domElement;this._rotateLeft(ln*this._rotateDelta.x/e.clientHeight),this._rotateUp(ln*this._rotateDelta.y/e.clientHeight),this._rotateStart.copy(this._rotateEnd)}_handleTouchMovePan(t){if(this._pointers.length===1)this._panEnd.set(t.pageX,t.pageY);else{let e=this._getSecondPointerPosition(t),n=.5*(t.pageX+e.x),s=.5*(t.pageY+e.y);this._panEnd.set(n,s)}this._panDelta.subVectors(this._panEnd,this._panStart).multiplyScalar(this.panSpeed),this._pan(this._panDelta.x,this._panDelta.y),this._panStart.copy(this._panEnd)}_handleTouchMoveDolly(t){let e=this._getSecondPointerPosition(t),n=t.pageX-e.x,s=t.pageY-e.y,r=Math.sqrt(n*n+s*s);this._dollyEnd.set(0,r),this._dollyDelta.set(0,Math.pow(this._dollyEnd.y/this._dollyStart.y,this.zoomSpeed)),this._dollyOut(this._dollyDelta.y),this._dollyStart.copy(this._dollyEnd);let o=(t.pageX+e.x)*.5,a=(t.pageY+e.y)*.5;this._updateZoomParameters(o,a)}_handleTouchMoveDollyPan(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enablePan&&this._handleTouchMovePan(t)}_handleTouchMoveDollyRotate(t){this.enableZoom&&this._handleTouchMoveDolly(t),this.enableRotate&&this._handleTouchMoveRotate(t)}_addPointer(t){this._pointers.push(t.pointerId)}_removePointer(t){delete this._pointerPositions[t.pointerId];for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId){this._pointers.splice(e,1);return}}_isTrackingPointer(t){for(let e=0;e<this._pointers.length;e++)if(this._pointers[e]==t.pointerId)return!0;return!1}_trackPointer(t){let e=this._pointerPositions[t.pointerId];e===void 0&&(e=new mt,this._pointerPositions[t.pointerId]=e),e.set(t.pageX,t.pageY)}_getSecondPointerPosition(t){let e=t.pointerId===this._pointers[0]?this._pointers[1]:this._pointers[0];return this._pointerPositions[e]}_customWheelEvent(t){let e=t.deltaMode,n={clientX:t.clientX,clientY:t.clientY,deltaY:t.deltaY};switch(e){case 1:n.deltaY*=16;break;case 2:n.deltaY*=100;break}return t.ctrlKey&&!this._controlActive&&(n.deltaY*=10),n}};function D_(i){this.enabled!==!1&&(this._pointers.length===0&&(this.domElement.setPointerCapture(i.pointerId),this.domElement.ownerDocument.addEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.addEventListener("pointerup",this._onPointerUp)),!this._isTrackingPointer(i)&&(this._addPointer(i),i.pointerType==="touch"?this._onTouchStart(i):this._onMouseDown(i),this._cursorStyle==="grab"&&(this.domElement.style.cursor="grabbing")))}function N_(i){this.enabled!==!1&&(i.pointerType==="touch"?this._onTouchMove(i):this._onMouseMove(i))}function U_(i){switch(this._removePointer(i),this._pointers.length){case 0:this.domElement.releasePointerCapture(i.pointerId),this.domElement.ownerDocument.removeEventListener("pointermove",this._onPointerMove),this.domElement.ownerDocument.removeEventListener("pointerup",this._onPointerUp),this.dispatchEvent(nd),this.state=Se.NONE,this._cursorStyle==="grab"&&(this.domElement.style.cursor="grab");break;case 1:let t=this._pointers[0],e=this._pointerPositions[t];this._onTouchStart({pointerId:t,pageX:e.x,pageY:e.y});break}}function F_(i){let t;switch(i.button){case 0:t=this.mouseButtons.LEFT;break;case 1:t=this.mouseButtons.MIDDLE;break;case 2:t=this.mouseButtons.RIGHT;break;default:t=-1}switch(t){case Li.DOLLY:if(this.enableZoom===!1)return;this._handleMouseDownDolly(i),this.state=Se.DOLLY;break;case Li.ROTATE:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=Se.PAN}else{if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=Se.ROTATE}break;case Li.PAN:if(i.ctrlKey||i.metaKey||i.shiftKey){if(this.enableRotate===!1)return;this._handleMouseDownRotate(i),this.state=Se.ROTATE}else{if(this.enablePan===!1)return;this._handleMouseDownPan(i),this.state=Se.PAN}break;default:this.state=Se.NONE}this.state!==Se.NONE&&this.dispatchEvent(Wc)}function O_(i){switch(this.state){case Se.ROTATE:if(this.enableRotate===!1)return;this._handleMouseMoveRotate(i);break;case Se.DOLLY:if(this.enableZoom===!1)return;this._handleMouseMoveDolly(i);break;case Se.PAN:if(this.enablePan===!1)return;this._handleMouseMovePan(i);break}}function B_(i){this.enabled===!1||this.enableZoom===!1||this.state!==Se.NONE||(i.preventDefault(),this.dispatchEvent(Wc),this._handleMouseWheel(this._customWheelEvent(i)),this.dispatchEvent(nd))}function z_(i){this.enabled!==!1&&this._handleKeyDown(i)}function k_(i){switch(this._trackPointer(i),this._pointers.length){case 1:switch(this.touches.ONE){case Di.ROTATE:if(this.enableRotate===!1)return;this._handleTouchStartRotate(i),this.state=Se.TOUCH_ROTATE;break;case Di.PAN:if(this.enablePan===!1)return;this._handleTouchStartPan(i),this.state=Se.TOUCH_PAN;break;default:this.state=Se.NONE}break;case 2:switch(this.touches.TWO){case Di.DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchStartDollyPan(i),this.state=Se.TOUCH_DOLLY_PAN;break;case Di.DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchStartDollyRotate(i),this.state=Se.TOUCH_DOLLY_ROTATE;break;default:this.state=Se.NONE}break;default:this.state=Se.NONE}this.state!==Se.NONE&&this.dispatchEvent(Wc)}function V_(i){switch(this._trackPointer(i),this.state){case Se.TOUCH_ROTATE:if(this.enableRotate===!1)return;this._handleTouchMoveRotate(i),this.update();break;case Se.TOUCH_PAN:if(this.enablePan===!1)return;this._handleTouchMovePan(i),this.update();break;case Se.TOUCH_DOLLY_PAN:if(this.enableZoom===!1&&this.enablePan===!1)return;this._handleTouchMoveDollyPan(i),this.update();break;case Se.TOUCH_DOLLY_ROTATE:if(this.enableZoom===!1&&this.enableRotate===!1)return;this._handleTouchMoveDollyRotate(i),this.update();break;default:this.state=Se.NONE}}function H_(i){this.enabled!==!1&&i.preventDefault()}function G_(i){i.key==="Control"&&(this._controlActive=!0,this.domElement.getRootNode().addEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}function W_(i){i.key==="Control"&&(this._controlActive=!1,this.domElement.getRootNode().removeEventListener("keyup",this._interceptControlUp,{passive:!0,capture:!0}))}var qr=new V;function bn(i,t,e,n,s,r){let o=2*Math.PI*s/4,a=Math.max(r-2*s,0),c=Math.PI/4;qr.copy(t),qr[n]=0,qr.normalize();let l=.5*o/(o+a),h=1-qr.angleTo(i)/c;return Math.sign(qr[e])===1?h*l:a/(o+a)+l+l*(1-h)}var ui=class i extends Pn{constructor(t=1,e=1,n=1,s=2,r=.1){let o=s*2+1;if(r=Math.min(t/2,e/2,n/2,r),super(1,1,1,o,o,o),this.type="RoundedBoxGeometry",this.parameters={width:t,height:e,depth:n,segments:s,radius:r},o===1)return;let a=this.toNonIndexed();this.index=null,this.attributes.position=a.attributes.position,this.attributes.normal=a.attributes.normal,this.attributes.uv=a.attributes.uv;let c=new V,l=new V,h=new V(t,e,n).divideScalar(2).subScalar(r),d=this.attributes.position.array,u=this.attributes.normal.array,p=this.attributes.uv.array,g=d.length/6,v=new V,m=.5/o;for(let f=0,w=0;f<d.length;f+=3,w+=2)switch(c.fromArray(d,f),l.copy(c),l.x-=Math.sign(l.x)*m,l.y-=Math.sign(l.y)*m,l.z-=Math.sign(l.z)*m,l.normalize(),d[f+0]=h.x*Math.sign(c.x)+l.x*r,d[f+1]=h.y*Math.sign(c.y)+l.y*r,d[f+2]=h.z*Math.sign(c.z)+l.z*r,u[f+0]=l.x,u[f+1]=l.y,u[f+2]=l.z,Math.floor(f/g)){case 0:v.set(1,0,0),p[w+0]=bn(v,l,"z","y",r,n),p[w+1]=1-bn(v,l,"y","z",r,e);break;case 1:v.set(-1,0,0),p[w+0]=1-bn(v,l,"z","y",r,n),p[w+1]=1-bn(v,l,"y","z",r,e);break;case 2:v.set(0,1,0),p[w+0]=1-bn(v,l,"x","z",r,t),p[w+1]=bn(v,l,"z","x",r,n);break;case 3:v.set(0,-1,0),p[w+0]=1-bn(v,l,"x","z",r,t),p[w+1]=1-bn(v,l,"z","x",r,n);break;case 4:v.set(0,0,1),p[w+0]=1-bn(v,l,"x","y",r,t),p[w+1]=1-bn(v,l,"y","x",r,e);break;case 5:v.set(0,0,-1),p[w+0]=bn(v,l,"x","y",r,t),p[w+1]=1-bn(v,l,"y","x",r,e);break}}static fromJSON(t){return new i(t.width,t.height,t.depth,t.segments,t.radius)}};var Yr=Ue,ns=class i extends Ji{constructor(t){super(t),this.defaultDPI=90,this.defaultUnit="px"}load(t,e,n,s){let r=this,o=new Rr(r.manager);o.setPath(r.path),o.setRequestHeader(r.requestHeader),o.setWithCredentials(r.withCredentials),o.load(t,function(a){try{e(r.parse(a))}catch(c){s?s(c):console.error(c),r.manager.itemError(t)}},n,s)}parse(t){let e=this;function n(U,C){if(U.nodeType!==1)return;U.hasAttribute("filter")&&console.warn("THREE.SVGLoader: Filters are not supported.");let L=M(U),B=!1,tt=null;switch(U.nodeName){case"svg":C=v(U,C);break;case"style":r(U);break;case"g":C=v(U,C);break;case"path":C=v(U,C),U.hasAttribute("d")&&(tt=s(U));break;case"rect":C=v(U,C),tt=c(U);break;case"polygon":C=v(U,C),tt=l(U);break;case"polyline":C=v(U,C),tt=h(U);break;case"circle":C=v(U,C),tt=d(U);break;case"ellipse":C=v(U,C),tt=u(U);break;case"line":C=v(U,C),tt=p(U);break;case"defs":B=!0;break;case"use":C=v(U,C);let X=(U.getAttributeNS("http://www.w3.org/1999/xlink","href")||"").substring(1),F=U.viewportElement.getElementById(X);F?n(F,C):console.warn("SVGLoader: 'use node' references non-existent node id: "+X);break;default:}if(tt){C.fill!==void 0&&C.fill!=="none"&&!C.fill.startsWith("url")&&tt.color.setStyle(C.fill,Yr),y(tt,Wt),et.push(tt);let T=Object.assign({},C);T.strokeWidth=C.strokeWidth*it(Wt),tt.userData={node:U,style:T,transform:Wt.clone(),gradients:st}}let yt=U.childNodes;for(let T=0;T<yt.length;T++){let X=yt[T];B&&X.nodeName!=="style"&&X.nodeName!=="defs"||n(X,C)}L&&(Q.pop(),Q.length>0?Wt.copy(Q[Q.length-1]):Wt.identity())}function s(U){let C=new Ln,L=new mt,B=new mt,tt=new mt,yt=!0,T=!1,X=U.getAttribute("d");if(X===""||X==="none")return null;let F=X.match(/[a-df-z][^a-df-z]*/ig);for(let K=0,j=F.length;K<j;K++){let gt=F[K],bt=gt.charAt(0),wt=gt.slice(1).trim();yt===!0&&(T=!0,yt=!1);let J;switch(bt){case"M":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S+=2)L.x=J[S+0],L.y=J[S+1],B.x=L.x,B.y=L.y,S===0?C.moveTo(L.x,L.y):C.lineTo(L.x,L.y),S===0&&tt.copy(L);break;case"H":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S++)L.x=J[S],B.x=L.x,B.y=L.y,C.lineTo(L.x,L.y),S===0&&T===!0&&tt.copy(L);break;case"V":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S++)L.y=J[S],B.x=L.x,B.y=L.y,C.lineTo(L.x,L.y),S===0&&T===!0&&tt.copy(L);break;case"L":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S+=2)L.x=J[S+0],L.y=J[S+1],B.x=L.x,B.y=L.y,C.lineTo(L.x,L.y),S===0&&T===!0&&tt.copy(L);break;case"C":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S+=6)C.bezierCurveTo(J[S+0],J[S+1],J[S+2],J[S+3],J[S+4],J[S+5]),B.x=J[S+2],B.y=J[S+3],L.x=J[S+4],L.y=J[S+5],S===0&&T===!0&&tt.copy(L);break;case"S":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S+=4)C.bezierCurveTo(m(L.x,B.x),m(L.y,B.y),J[S+0],J[S+1],J[S+2],J[S+3]),B.x=J[S+0],B.y=J[S+1],L.x=J[S+2],L.y=J[S+3],S===0&&T===!0&&tt.copy(L);break;case"Q":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S+=4)C.quadraticCurveTo(J[S+0],J[S+1],J[S+2],J[S+3]),B.x=J[S+0],B.y=J[S+1],L.x=J[S+2],L.y=J[S+3],S===0&&T===!0&&tt.copy(L);break;case"T":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S+=2){let Ot=m(L.x,B.x),b=m(L.y,B.y);C.quadraticCurveTo(Ot,b,J[S+0],J[S+1]),B.x=Ot,B.y=b,L.x=J[S+0],L.y=J[S+1],S===0&&T===!0&&tt.copy(L)}break;case"A":J=f(wt,[3,4],7);for(let S=0,Ut=J.length;S<Ut;S+=7){if(J[S+5]==L.x&&J[S+6]==L.y)continue;let Ot=L.clone();L.x=J[S+5],L.y=J[S+6],B.x=L.x,B.y=L.y,o(C,J[S],J[S+1],J[S+2],J[S+3],J[S+4],Ot,L),S===0&&T===!0&&tt.copy(L)}break;case"m":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S+=2)L.x+=J[S+0],L.y+=J[S+1],B.x=L.x,B.y=L.y,S===0?C.moveTo(L.x,L.y):C.lineTo(L.x,L.y),S===0&&tt.copy(L);break;case"h":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S++)L.x+=J[S],B.x=L.x,B.y=L.y,C.lineTo(L.x,L.y),S===0&&T===!0&&tt.copy(L);break;case"v":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S++)L.y+=J[S],B.x=L.x,B.y=L.y,C.lineTo(L.x,L.y),S===0&&T===!0&&tt.copy(L);break;case"l":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S+=2)L.x+=J[S+0],L.y+=J[S+1],B.x=L.x,B.y=L.y,C.lineTo(L.x,L.y),S===0&&T===!0&&tt.copy(L);break;case"c":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S+=6)C.bezierCurveTo(L.x+J[S+0],L.y+J[S+1],L.x+J[S+2],L.y+J[S+3],L.x+J[S+4],L.y+J[S+5]),B.x=L.x+J[S+2],B.y=L.y+J[S+3],L.x+=J[S+4],L.y+=J[S+5],S===0&&T===!0&&tt.copy(L);break;case"s":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S+=4)C.bezierCurveTo(m(L.x,B.x),m(L.y,B.y),L.x+J[S+0],L.y+J[S+1],L.x+J[S+2],L.y+J[S+3]),B.x=L.x+J[S+0],B.y=L.y+J[S+1],L.x+=J[S+2],L.y+=J[S+3],S===0&&T===!0&&tt.copy(L);break;case"q":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S+=4)C.quadraticCurveTo(L.x+J[S+0],L.y+J[S+1],L.x+J[S+2],L.y+J[S+3]),B.x=L.x+J[S+0],B.y=L.y+J[S+1],L.x+=J[S+2],L.y+=J[S+3],S===0&&T===!0&&tt.copy(L);break;case"t":J=f(wt);for(let S=0,Ut=J.length;S<Ut;S+=2){let Ot=m(L.x,B.x),b=m(L.y,B.y);C.quadraticCurveTo(Ot,b,L.x+J[S+0],L.y+J[S+1]),B.x=Ot,B.y=b,L.x=L.x+J[S+0],L.y=L.y+J[S+1],S===0&&T===!0&&tt.copy(L)}break;case"a":J=f(wt,[3,4],7);for(let S=0,Ut=J.length;S<Ut;S+=7){if(J[S+5]==0&&J[S+6]==0)continue;let Ot=L.clone();L.x+=J[S+5],L.y+=J[S+6],B.x=L.x,B.y=L.y,o(C,J[S],J[S+1],J[S+2],J[S+3],J[S+4],Ot,L),S===0&&T===!0&&tt.copy(L)}break;case"Z":case"z":C.currentPath.autoClose=!0,C.currentPath.curves.length>0&&(L.copy(tt),C.currentPath.currentPoint.copy(L),yt=!0);break;default:console.warn(gt)}T=!1}return C}function r(U){if(!(!U.sheet||!U.sheet.cssRules||!U.sheet.cssRules.length))for(let C=0;C<U.sheet.cssRules.length;C++){let L=U.sheet.cssRules[C];if(L.type!==1)continue;let B=L.selectorText.split(/,/gm).filter(Boolean).map(tt=>tt.trim());for(let tt=0;tt<B.length;tt++){let yt=Object.fromEntries(Object.entries(L.style).filter(([,T])=>T!==""));nt[B[tt]]=Object.assign(nt[B[tt]]||{},yt)}}}function o(U,C,L,B,tt,yt,T,X){if(C==0||L==0){U.lineTo(X.x,X.y);return}B=B*Math.PI/180,C=Math.abs(C),L=Math.abs(L);let F=(T.x-X.x)/2,K=(T.y-X.y)/2,j=Math.cos(B)*F+Math.sin(B)*K,gt=-Math.sin(B)*F+Math.cos(B)*K,bt=C*C,wt=L*L,J=j*j,S=gt*gt,Ut=J/bt+S/wt;if(Ut>1){let H=Math.sqrt(Ut);C=H*C,L=H*L,bt=C*C,wt=L*L}let Ot=bt*S+wt*J,b=(bt*wt-Ot)/Ot,_=Math.sqrt(Math.max(0,b));tt===yt&&(_=-_);let W=_*C*gt/L,rt=-_*L*j/C,pt=Math.cos(B)*W-Math.sin(B)*rt+(T.x+X.x)/2,Rt=Math.sin(B)*W+Math.cos(B)*rt+(T.y+X.y)/2,P=a(1,0,(j-W)/C,(gt-rt)/L),D=a((j-W)/C,(gt-rt)/L,(-j-W)/C,(-gt-rt)/L)%(Math.PI*2);U.currentPath.absellipse(pt,Rt,C,L,P,P+D,yt===0,B)}function a(U,C,L,B){let tt=U*L+C*B,yt=Math.sqrt(U*U+C*C)*Math.sqrt(L*L+B*B),T=Math.acos(Math.max(-1,Math.min(1,tt/yt)));return U*B-C*L<0&&(T=-T),T}function c(U){let C=x(U.getAttribute("x")||0),L=x(U.getAttribute("y")||0),B=x(U.getAttribute("rx")||U.getAttribute("ry")||0),tt=x(U.getAttribute("ry")||U.getAttribute("rx")||0),yt=x(U.getAttribute("width")),T=x(U.getAttribute("height")),X=1-.551915024494,F=new Ln;return F.moveTo(C+B,L),F.lineTo(C+yt-B,L),(B!==0||tt!==0)&&F.bezierCurveTo(C+yt-B*X,L,C+yt,L+tt*X,C+yt,L+tt),F.lineTo(C+yt,L+T-tt),(B!==0||tt!==0)&&F.bezierCurveTo(C+yt,L+T-tt*X,C+yt-B*X,L+T,C+yt-B,L+T),F.lineTo(C+B,L+T),(B!==0||tt!==0)&&F.bezierCurveTo(C+B*X,L+T,C,L+T-tt*X,C,L+T-tt),F.lineTo(C,L+tt),(B!==0||tt!==0)&&F.bezierCurveTo(C,L+tt*X,C+B*X,L,C+B,L),F}function l(U){function C(yt,T,X){let F=x(T),K=x(X);tt===0?B.moveTo(F,K):B.lineTo(F,K),tt++}let L=/([+-]?\\d*\\.?\\d+(?:e[+-]?\\d+)?)(?:,|\\s)([+-]?\\d*\\.?\\d+(?:e[+-]?\\d+)?)/g,B=new Ln,tt=0;return U.getAttribute("points").replace(L,C),B.currentPath.autoClose=!0,B}function h(U){function C(yt,T,X){let F=x(T),K=x(X);tt===0?B.moveTo(F,K):B.lineTo(F,K),tt++}let L=/([+-]?\\d*\\.?\\d+(?:e[+-]?\\d+)?)(?:,|\\s)([+-]?\\d*\\.?\\d+(?:e[+-]?\\d+)?)/g,B=new Ln,tt=0;return U.getAttribute("points").replace(L,C),B.currentPath.autoClose=!1,B}function d(U){let C=x(U.getAttribute("cx")||0),L=x(U.getAttribute("cy")||0),B=x(U.getAttribute("r")||0),tt=new Xn;tt.absarc(C,L,B,0,Math.PI*2);let yt=new Ln;return yt.subPaths.push(tt),yt}function u(U){let C=x(U.getAttribute("cx")||0),L=x(U.getAttribute("cy")||0),B=x(U.getAttribute("rx")||0),tt=x(U.getAttribute("ry")||0),yt=new Xn;yt.absellipse(C,L,B,tt,0,Math.PI*2);let T=new Ln;return T.subPaths.push(yt),T}function p(U){let C=x(U.getAttribute("x1")||0),L=x(U.getAttribute("y1")||0),B=x(U.getAttribute("x2")||0),tt=x(U.getAttribute("y2")||0),yt=new Ln;return yt.moveTo(C,L),yt.lineTo(B,tt),yt.currentPath.autoClose=!1,yt}function g(U){let C="http://www.w3.org/1999/xlink",L=U.querySelectorAll("linearGradient, radialGradient"),B=["x1","y1","x2","y2","cx","cy","r","fx","fy","gradientUnits","gradientTransform","spreadMethod"],tt={};for(let T of L){let X=T.getAttribute("id");if(!X)continue;let F={type:T.nodeName==="radialGradient"?"radialGradient":"linearGradient",attrs:{},stops:null,href:null},K=T.getAttributeNS(C,"href")||T.getAttribute("href")||"";K.startsWith("#")&&(F.href=K.substring(1));for(let gt of B)T.hasAttribute(gt)&&(F.attrs[gt]=T.getAttribute(gt));let j=T.querySelectorAll("stop");if(j.length>0){F.stops=[];for(let gt of j){let bt=gt.getAttribute("stop-color");!bt&&gt.style&&(bt=gt.style["stop-color"]),bt||(bt="#000");let wt=gt.getAttribute("stop-opacity");(wt===null||wt==="")&&gt.style&&(wt=gt.style["stop-opacity"]),wt=wt===null||wt===""||wt===void 0?1:Math.max(0,Math.min(1,parseFloat(wt)));let J=Math.max(0,Math.min(1,parseFloat(gt.getAttribute("offset")||"0")));F.stops.push({offset:J,color:bt,opacity:wt})}}tt[X]=F}function yt(T,X){let F=tt[T];if(!F||X.has(T))return F;if(X.add(T),F.href&&tt[F.href]){let K=yt(F.href,X);if(K){F.stops||(F.stops=K.stops);for(let j in K.attrs)j in F.attrs||(F.attrs[j]=K.attrs[j])}}return F}for(let T in tt)yt(T,new Set);for(let T in tt){let gt=function(bt){return typeof bt!="string"?0:bt.endsWith("%")?parseFloat(bt)/100:x(bt)},X=tt[T],F=X.attrs,K=F.gradientUnits==="userSpaceOnUse"?"userSpaceOnUse":"objectBoundingBox",j={type:X.type,gradientUnits:K,spreadMethod:F.spreadMethod==="reflect"||F.spreadMethod==="repeat"?F.spreadMethod:"pad",gradientTransform:null,stops:(X.stops||[]).slice().sort((bt,wt)=>bt.offset-wt.offset)};if(F.gradientTransform&&(j.gradientTransform=new Qt,N(F.gradientTransform,j.gradientTransform)),X.type==="linearGradient")j.x1=F.x1!==void 0?gt(F.x1):0,j.y1=F.y1!==void 0?gt(F.y1):0,j.x2=F.x2!==void 0?gt(F.x2):K==="objectBoundingBox"?1:0,j.y2=F.y2!==void 0?gt(F.y2):0;else{let bt=K==="objectBoundingBox"?.5:0,wt=K==="objectBoundingBox"?.5:0;j.cx=F.cx!==void 0?gt(F.cx):bt,j.cy=F.cy!==void 0?gt(F.cy):bt,j.r=F.r!==void 0?gt(F.r):wt,j.fx=F.fx!==void 0?gt(F.fx):j.cx,j.fy=F.fy!==void 0?gt(F.fy):j.cy}st[T]=j}}function v(U,C){C=Object.assign({},C);let L={};if(U.hasAttribute("class")){let T=U.getAttribute("class").split(/\\s/).filter(Boolean).map(X=>X.trim());for(let X=0;X<T.length;X++)L=Object.assign(L,nt["."+T[X]])}U.hasAttribute("id")&&(L=Object.assign(L,nt["#"+U.getAttribute("id")]));function B(T,X,F){F===void 0&&(F=function(j){return j}),U.hasAttribute(T)&&(C[X]=F(U.getAttribute(T))),L[X]&&(C[X]=F(L[X])),U.style&&U.style[T]!==""&&(C[X]=F(U.style[T]))}function tt(T){return Math.max(0,Math.min(1,x(T)))}function yt(T){return Math.max(0,x(T))}return B("fill","fill"),B("fill-opacity","fillOpacity",tt),B("fill-rule","fillRule"),B("opacity","opacity",tt),B("stroke","stroke"),B("stroke-opacity","strokeOpacity",tt),B("stroke-width","strokeWidth",yt),B("stroke-linejoin","strokeLineJoin"),B("stroke-linecap","strokeLineCap"),B("stroke-miterlimit","strokeMiterLimit",yt),B("visibility","visibility"),C}function m(U,C){return U-(C-U)}function f(U,C,L){if(typeof U!="string")throw new TypeError("Invalid input: "+typeof U);let B={SEPARATOR:/[ \\t\\r\\n\\,.\\-+]/,WHITESPACE:/[ \\t\\r\\n]/,DIGIT:/[\\d]/,SIGN:/[-+]/,POINT:/\\./,COMMA:/,/,EXP:/e/i,FLAGS:/[01]/},tt=0,yt=1,T=2,X=3,F=tt,K=!0,j="",gt="",bt=[];function wt(Ot,b,_){let W=new SyntaxError('Unexpected character "'+Ot+'" at index '+b+".");throw W.partial=_,W}function J(){j!==""&&(gt===""?bt.push(Number(j)):bt.push(Number(j)*Math.pow(10,Number(gt)))),j="",gt=""}let S,Ut=U.length;for(let Ot=0;Ot<Ut;Ot++){if(S=U[Ot],Array.isArray(C)&&C.includes(bt.length%L)&&B.FLAGS.test(S)){F=yt,j=S,J();continue}if(F===tt){if(B.WHITESPACE.test(S))continue;if(B.DIGIT.test(S)||B.SIGN.test(S)){F=yt,j=S;continue}if(B.POINT.test(S)){F=T,j=S;continue}B.COMMA.test(S)&&(K&&wt(S,Ot,bt),K=!0)}if(F===yt){if(B.DIGIT.test(S)){j+=S;continue}if(B.POINT.test(S)){j+=S,F=T;continue}if(B.EXP.test(S)){F=X;continue}B.SIGN.test(S)&&j.length===1&&B.SIGN.test(j[0])&&wt(S,Ot,bt)}if(F===T){if(B.DIGIT.test(S)){j+=S;continue}if(B.EXP.test(S)){F=X;continue}B.POINT.test(S)&&j[j.length-1]==="."&&wt(S,Ot,bt)}if(F===X){if(B.DIGIT.test(S)){gt+=S;continue}if(B.SIGN.test(S)){if(gt===""){gt+=S;continue}gt.length===1&&B.SIGN.test(gt)&&wt(S,Ot,bt)}}B.WHITESPACE.test(S)?(J(),F=tt,K=!1):B.COMMA.test(S)?(J(),F=tt,K=!0):B.SIGN.test(S)?(J(),F=yt,j=S):B.POINT.test(S)?(J(),F=T,j=S):wt(S,Ot,bt)}return J(),bt}let w=["mm","cm","in","pt","pc","px"],I={mm:{mm:1,cm:.1,in:1/25.4,pt:72/25.4,pc:6/25.4,px:-1},cm:{mm:10,cm:1,in:1/2.54,pt:72/2.54,pc:6/2.54,px:-1},in:{mm:25.4,cm:2.54,in:1,pt:72,pc:6,px:-1},pt:{mm:25.4/72,cm:2.54/72,in:1/72,pt:1,pc:6/72,px:-1},pc:{mm:25.4/6,cm:2.54/6,in:1/6,pt:72/6,pc:1,px:-1},px:{px:1}};function x(U){let C="px";if(typeof U=="string"||U instanceof String)for(let B=0,tt=w.length;B<tt;B++){let yt=w[B];if(U.endsWith(yt)){C=yt,U=U.substring(0,U.length-yt.length);break}}let L;return C==="px"&&e.defaultUnit!=="px"?L=I.in[e.defaultUnit]/e.defaultDPI:(L=I[C][e.defaultUnit],L<0&&(L=I[C].in*e.defaultDPI)),L*parseFloat(U)}function M(U){if(!(U.hasAttribute("transform")||U.nodeName==="use"&&(U.hasAttribute("x")||U.hasAttribute("y"))))return null;let C=A(U);return Q.length>0&&C.premultiply(Q[Q.length-1]),Wt.copy(C),Q.push(C),C}function A(U){let C=new Qt;if(U.nodeName==="use"&&(U.hasAttribute("x")||U.hasAttribute("y"))){let L=x(U.getAttribute("x")||0),B=x(U.getAttribute("y")||0);C.makeTranslation(L,B)}return U.hasAttribute("transform")&&N(U.getAttribute("transform"),C),C}function N(U,C){let L=at,B=U.split(")");for(let tt=B.length-1;tt>=0;tt--){let yt=B[tt].trim();if(yt==="")continue;let T=yt.indexOf("("),X=yt.length;if(T>0&&T<X){let F=yt.slice(0,T),K=f(yt.slice(T+1));switch(L.identity(),F){case"translate":if(K.length>=1){let j=K[0],gt=0;K.length>=2&&(gt=K[1]),L.makeTranslation(j,gt)}break;case"rotate":if(K.length>=1){let j=0,gt=0,bt=0;j=K[0]*Math.PI/180,K.length>=3&&(gt=K[1],bt=K[2]),ct.makeTranslation(-gt,-bt),ft.makeRotation(j),It.multiplyMatrices(ft,ct),ct.makeTranslation(gt,bt),L.multiplyMatrices(ct,It)}break;case"scale":if(K.length>=1){let j=K[0],gt=j;K.length>=2&&(gt=K[1]),L.makeScale(j,gt)}break;case"skewX":K.length===1&&L.set(1,Math.tan(K[0]*Math.PI/180),0,0,1,0,0,0,1);break;case"skewY":K.length===1&&L.set(1,0,0,Math.tan(K[0]*Math.PI/180),1,0,0,0,1);break;case"matrix":K.length===6&&L.set(K[0],K[2],K[4],K[1],K[3],K[5],0,0,1);break}C.premultiply(L)}}return C}function y(U,C){function L(T){Xt.set(T.x,T.y,1).applyMatrix3(C),T.set(Xt.x,Xt.y)}function B(T){let X=T.xRadius,F=T.yRadius,K=Math.cos(T.aRotation),j=Math.sin(T.aRotation),gt=new V(X*K,X*j,0),bt=new V(-F*j,F*K,0),wt=gt.applyMatrix3(C),J=bt.applyMatrix3(C),S=at.set(wt.x,J.x,0,wt.y,J.y,0,0,0,1),Ut=ct.copy(S).invert(),_=ft.copy(Ut).transpose().multiply(Ut).elements,W=G(_[0],_[1],_[4]),rt=Math.sqrt(W.rt1),pt=Math.sqrt(W.rt2);if(T.xRadius=1/rt,T.yRadius=1/pt,T.aRotation=Math.atan2(W.sn,W.cs),!((T.aEndAngle-T.aStartAngle)%(2*Math.PI)<Number.EPSILON)){let P=ct.set(rt,0,0,0,pt,0,0,0,1),D=ft.set(W.cs,W.sn,0,-W.sn,W.cs,0,0,0,1),H=P.multiply(D).multiply(S),lt=Et=>{let{x:vt,y:Mt}=new V(Math.cos(Et),Math.sin(Et),0).applyMatrix3(H);return Math.atan2(Mt,vt)};T.aStartAngle=lt(T.aStartAngle),T.aEndAngle=lt(T.aEndAngle),R(C)&&(T.aClockwise=!T.aClockwise)}}function tt(T){let X=Y(C),F=Z(C);T.xRadius*=X,T.yRadius*=F;let K=X>Number.EPSILON?Math.atan2(C.elements[1],C.elements[0]):Math.atan2(-C.elements[3],C.elements[4]);T.aRotation+=K,R(C)&&(T.aStartAngle*=-1,T.aEndAngle*=-1,T.aClockwise=!T.aClockwise)}let yt=U.subPaths;for(let T=0,X=yt.length;T<X;T++){let K=yt[T].curves;for(let j=0;j<K.length;j++){let gt=K[j];gt.isLineCurve?(L(gt.v1),L(gt.v2)):gt.isCubicBezierCurve?(L(gt.v0),L(gt.v1),L(gt.v2),L(gt.v3)):gt.isQuadraticBezierCurve?(L(gt.v0),L(gt.v1),L(gt.v2)):gt.isEllipseCurve&&(Nt.set(gt.aX,gt.aY),L(Nt),gt.aX=Nt.x,gt.aY=Nt.y,k(C)?B(gt):tt(gt))}}}function R(U){let C=U.elements;return C[0]*C[4]-C[1]*C[3]<0}function k(U){let C=U.elements,L=C[0]*C[3]+C[1]*C[4];if(L===0)return!1;let B=Y(U),tt=Z(U);return Math.abs(L/(B*tt))>Number.EPSILON}function Y(U){let C=U.elements;return Math.sqrt(C[0]*C[0]+C[1]*C[1])}function Z(U){let C=U.elements;return Math.sqrt(C[3]*C[3]+C[4]*C[4])}function it(U){let C=U.elements,L=C[0]*C[4]-C[1]*C[3];return Math.sqrt(Math.abs(L))}function G(U,C,L){let B,tt,yt,T,X,F=U+L,K=U-L,j=Math.sqrt(K*K+4*C*C);return F>0?(B=.5*(F+j),X=1/B,tt=U*X*L-C*X*C):F<0?tt=.5*(F-j):(B=.5*j,tt=-.5*j),K>0?yt=K+j:yt=K-j,Math.abs(yt)>2*Math.abs(C)?(X=-2*C/yt,T=1/Math.sqrt(1+X*X),yt=X*T):Math.abs(C)===0?(yt=1,T=0):(X=-.5*yt/C,yt=1/Math.sqrt(1+X*X),T=X*yt),K>0&&(X=yt,yt=-T,T=X),{rt1:B,rt2:tt,cs:yt,sn:T}}let et=[],nt={},st={},Q=[],at=new Qt,ct=new Qt,ft=new Qt,It=new Qt,Nt=new mt,Xt=new V,Wt=new Qt,qt=new DOMParser().parseFromString(t,"image/svg+xml");return g(qt),n(qt.documentElement,{fill:"#000",fillOpacity:1,strokeOpacity:1,strokeWidth:1,strokeLineJoin:"miter",strokeLineCap:"butt",strokeMiterLimit:4}),{paths:et,gradients:st,xml:qt.documentElement}}static createFillMaterial(t){let e=t.userData.style;if(e.fill===void 0||e.fill==="none")return null;let n=t.color,s=null,r=id.exec(e.fill);if(r){let a=t.userData.gradients&&t.userData.gradients[r[1]];s=X_(a,t)}let o=new Ze({opacity:e.fillOpacity*(e.opacity||1),transparent:!0,side:Fe,depthWrite:!1});return s!==null?o.map=s:o.color=n,o}static createStrokeMaterial(t){let e=t.userData.style;return e.stroke===void 0||e.stroke==="none"?null:(id.test(e.stroke)&&console.warn("THREE.SVGLoader: Gradient strokes are not supported."),new Ze({color:new ie().setStyle(e.stroke,Yr),opacity:e.strokeOpacity*(e.opacity||1),transparent:!0,side:Fe,depthWrite:!1}))}static createShapes(t){return console.warn("SVGLoader: createShapes() is deprecated. Use shapePath.toShapes() instead."),t.toShapes()}static getStrokeStyle(t,e,n,s,r){return t=t!==void 0?t:1,e=e!==void 0?e:"#000",n=n!==void 0?n:"miter",s=s!==void 0?s:"butt",r=r!==void 0?r:4,{strokeColor:e,strokeWidth:t,strokeLineJoin:n,strokeLineCap:s,strokeMiterLimit:r}}static pointsToStroke(t,e,n,s){let r=[],o=[],a=[];if(i.pointsToStrokeWithBuffers(t,e,n,s,r,o,a)===0)return null;let c=new Le;return c.setAttribute("position",new fe(r,3)),c.setAttribute("normal",new fe(o,3)),c.setAttribute("uv",new fe(a,2)),c}static pointsToStrokeWithBuffers(t,e,n,s,r,o,a,c){let l=new mt,h=new mt,d=new mt,u=new mt,p=new mt,g=new mt,v=new mt,m=new mt,f=new mt,w=new mt,I=new mt,x=new mt,M=new mt,A=new mt,N=new mt,y=new mt,R=new mt;n=n!==void 0?n:12,s=s!==void 0?s:.001,c=c!==void 0?c:0,t=yt(t);let k=t.length;if(k<2)return 0;let Y=t[0].equals(t[k-1]),Z,it=t[0],G,et=e.strokeWidth/2,nt=1/(k-1),st=0,Q,at,ct,ft,It=!1,Nt=0,Xt=c*3,Wt=c*2;qt(t[0],t[1],l).multiplyScalar(et),m.copy(t[0]).sub(l),f.copy(t[0]).add(l),w.copy(m),I.copy(f);for(let T=1;T<k;T++){Z=t[T],T===k-1?Y?G=t[1]:G=void 0:G=t[T+1];let X=l;if(qt(it,Z,X),d.copy(X).multiplyScalar(et),x.copy(Z).sub(d),M.copy(Z).add(d),Q=st+nt,at=!1,G!==void 0){qt(Z,G,h),d.copy(h).multiplyScalar(et),A.copy(Z).sub(d),N.copy(Z).add(d),ct=!0,d.subVectors(G,it),X.dot(d)<0&&(ct=!1),T===1&&(It=ct),d.subVectors(G,Z),d.normalize();let F=Math.abs(X.dot(d));if(F>Number.EPSILON){let K=et/F;d.multiplyScalar(-K),u.subVectors(Z,it),p.copy(u).setLength(K).add(d),y.copy(p).negate();let j=p.length(),gt=u.length();u.divideScalar(gt),g.subVectors(G,Z);let bt=g.length();if(g.divideScalar(bt),u.dot(y)<gt&&g.dot(y)<bt&&(at=!0),R.copy(p).add(Z),y.add(Z),at){let wt=ct?f:m,J=(R.x-wt.x)*(y.y-wt.y)-(R.y-wt.y)*(y.x-wt.x);(ct&&J<0||!ct&&J>0)&&y.copy(wt)}switch(ft=!1,at?ct?(N.copy(y),M.copy(y)):(A.copy(y),x.copy(y)):C(),e.strokeLineJoin){case"bevel":L(ct,at,Q);break;case"round":B(ct,at),ct?U(Z,x,A,Q,0):U(Z,N,M,Q,1);break;case"miter":case"miter-clip":default:let wt=et*e.strokeMiterLimit/j;if(wt<1)if(e.strokeLineJoin!=="miter-clip"){L(ct,at,Q);break}else B(ct,at),ct?(g.subVectors(R,x).multiplyScalar(wt).add(x),v.subVectors(R,A).multiplyScalar(wt).add(A),z(x,Q,0),z(g,Q,0),z(Z,Q,.5),z(Z,Q,.5),z(g,Q,0),z(v,Q,0),z(Z,Q,.5),z(v,Q,0),z(A,Q,0)):(g.subVectors(R,M).multiplyScalar(wt).add(M),v.subVectors(R,N).multiplyScalar(wt).add(N),z(M,Q,1),z(g,Q,1),z(Z,Q,.5),z(Z,Q,.5),z(g,Q,1),z(v,Q,1),z(Z,Q,.5),z(v,Q,1),z(N,Q,1));else at?(ct?(z(f,st,1),z(m,st,0),z(R,Q,0),z(f,st,1),z(R,Q,0),z(y,Q,1)):(z(f,st,1),z(m,st,0),z(R,Q,1),z(m,st,0),z(y,Q,0),z(R,Q,1)),ct?A.copy(R):N.copy(R)):ct?(z(x,Q,0),z(R,Q,0),z(Z,Q,.5),z(Z,Q,.5),z(R,Q,0),z(A,Q,0)):(z(M,Q,1),z(R,Q,1),z(Z,Q,.5),z(Z,Q,.5),z(R,Q,1),z(N,Q,1)),ft=!0;break}}else C()}else C();!Y&&T===k-1&&tt(t[0],w,I,ct,!0,st),st=Q,it=Z,m.copy(A),f.copy(N)}if(!Y)tt(Z,x,M,ct,!1,Q);else if(at&&r){let T=R,X=y;It!==ct&&(T=y,X=R),ct?(ft||It)&&(X.toArray(r,0),X.toArray(r,9),ft&&T.toArray(r,3)):(ft||!It)&&(X.toArray(r,3),X.toArray(r,9),ft&&T.toArray(r,0))}if(r){let T=[new mt,new mt,new mt],X=c*3;for(let F=X;F<Xt;F+=9)T[0].set(r[F],r[F+1]),T[1].set(r[F+3],r[F+4]),T[2].set(r[F+6],r[F+7]),Vn.area(T)<0&&(r[F+3]=T[0].x,r[F+4]=T[0].y)}return Nt;function qt(T,X,F){return F.subVectors(X,T),F.set(-F.y,F.x).normalize()}function z(T,X,F){r&&(r[Xt]=T.x,r[Xt+1]=T.y,r[Xt+2]=0,o&&(o[Xt]=0,o[Xt+1]=0,o[Xt+2]=1),Xt+=3,a&&(a[Wt]=X,a[Wt+1]=F,Wt+=2)),Nt+=3}function U(T,X,F,K,j){l.copy(X).sub(T).normalize(),h.copy(F).sub(T).normalize();let gt=Math.PI,bt=l.dot(h);Math.abs(bt)<1&&(gt=Math.abs(Math.acos(bt))),gt/=n,d.copy(X);for(let wt=0,J=n-1;wt<J;wt++)u.copy(d).rotateAround(T,gt),z(d,K,j),z(u,K,j),z(T,K,.5),d.copy(u);z(d,K,j),z(F,K,j),z(T,K,.5)}function C(){z(f,st,1),z(m,st,0),z(x,Q,0),z(f,st,1),z(x,Q,0),z(M,Q,1)}function L(T,X,F){X?T?(z(f,st,1),z(m,st,0),z(x,Q,0),z(f,st,1),z(x,Q,0),z(y,Q,1),z(x,F,0),z(A,F,0),z(y,F,.5)):(z(f,st,1),z(m,st,0),z(M,Q,1),z(m,st,0),z(y,Q,0),z(M,Q,1),z(M,F,1),z(y,F,0),z(N,F,1)):T?(z(x,F,0),z(A,F,0),z(Z,F,.5)):(z(M,F,1),z(N,F,0),z(Z,F,.5))}function B(T,X){X&&(T?(z(f,st,1),z(m,st,0),z(x,Q,0),z(f,st,1),z(x,Q,0),z(y,Q,1),z(x,st,0),z(Z,Q,.5),z(y,Q,1),z(Z,Q,.5),z(A,st,0),z(y,Q,1)):(z(f,st,1),z(m,st,0),z(M,Q,1),z(m,st,0),z(y,Q,0),z(M,Q,1),z(M,st,1),z(y,Q,0),z(Z,Q,.5),z(Z,Q,.5),z(y,Q,0),z(N,st,1)))}function tt(T,X,F,K,j,gt){switch(e.strokeLineCap){case"round":j?U(T,F,X,gt,.5):U(T,X,F,gt,.5);break;case"square":if(j)l.subVectors(X,T),h.set(l.y,-l.x),d.addVectors(l,h).add(T),u.subVectors(h,l).add(T),K?(d.toArray(r,3),u.toArray(r,0),u.toArray(r,9)):(d.toArray(r,3),a[7]===1?u.toArray(r,9):d.toArray(r,9),u.toArray(r,0));else{l.subVectors(F,T),h.set(l.y,-l.x),d.addVectors(l,h).add(T),u.subVectors(h,l).add(T);let bt=r.length;K?(d.toArray(r,bt-3),u.toArray(r,bt-6),u.toArray(r,bt-12)):(u.toArray(r,bt-6),d.toArray(r,bt-3),u.toArray(r,bt-12))}break;case"butt":default:break}}function yt(T){let X=!1;for(let K=1,j=T.length-1;K<j;K++)if(T[K].distanceTo(T[K+1])<s){X=!0;break}if(!X)return T;let F=[];F.push(T[0]);for(let K=1,j=T.length-1;K<j;K++)T[K].distanceTo(T[K+1])>=s&&F.push(T[K]);return F.push(T[T.length-1]),F}}},id=/^\\s*url\\(\\s*(?:["']\\s*)?#([^)'"\\s]+)(?:\\s*["'])?\\s*\\)\\s*$/;function X_(i,t,e=256){if(!i||!Array.isArray(i.stops)||i.stops.length===0)return null;let n=t.userData.transform,s=i.gradientUnits==="objectBoundingBox",r=null;if(s&&(r=q_(t,n),r===null))return null;function o(d,u,p){p.set(d,u,1),i.gradientTransform&&p.applyMatrix3(i.gradientTransform),s&&p.set(r.minX+p.x*r.width,r.minY+p.y*r.height,1),n&&p.applyMatrix3(n)}let a=document.createElement("canvas"),c;if(i.type==="linearGradient"){a.width=e,a.height=1;let d=a.getContext("2d"),u=d.createLinearGradient(0,0,e,0);sd(u,i.stops),d.fillStyle=u,d.fillRect(0,0,e,1);let p=new V,g=new V;o(i.x1,i.y1,p),o(i.x2,i.y2,g);let v=g.x-p.x,m=g.y-p.y,f=v*v+m*m||1e-20,w=v/f,I=m/f,x=-(w*p.x+I*p.y);c=new Qt().set(w,I,x,0,0,.5,0,0,1)}else{let d=i.cx,u=i.cy,p=i.fx,g=i.fy,v=i.r;if(i.gradientTransform){let y=new V;y.set(d,u,1).applyMatrix3(i.gradientTransform),d=y.x,u=y.y,y.set(p,g,1).applyMatrix3(i.gradientTransform),p=y.x,g=y.y}if(s&&(d=r.minX+d*r.width,u=r.minY+u*r.height,p=r.minX+p*r.width,g=r.minY+g*r.height,v=v*Math.sqrt((r.width*r.width+r.height*r.height)/2)),v<=0)return null;a.width=e,a.height=e;let m=a.getContext("2d"),f=d-v,w=u-v,I=2*v,x=e/I;m.setTransform(x,0,0,x,-f*x,-w*x);let M=m.createRadialGradient(p,g,0,d,u,v);sd(M,i.stops),m.fillStyle=M,m.fillRect(f,w,I,I);let A=n?n.clone().invert():new Qt;c=new Qt().set(1/I,0,-f/I,0,1/I,-w/I,0,0,1).multiply(A)}let l=new Yi(a);l.colorSpace=Yr,l.flipY=!1,l.matrixAutoUpdate=!1,l.matrix=c;let h=i.spreadMethod==="reflect"?bs:i.spreadMethod==="repeat"?Hn:yn;return l.wrapS=h,l.wrapT=h,l}function q_(i,t){let e=t?t.clone().invert():null,n=new mt,s=new Ii;for(let r of i.subPaths)for(let o of r.getPoints())n.copy(o),e&&n.applyMatrix3(e),s.expandByPoint(n);return s.isEmpty()?null:{minX:s.min.x,minY:s.min.y,width:s.max.x-s.min.x,height:s.max.y-s.min.y}}function sd(i,t){let e=new ie;for(let n of t){let s=n.color;if(n.opacity<1){e.setStyle(n.color,Yr);let r=/rgb\\(([^)]+)\\)/.exec(e.getStyle(Yr));r&&(s=\`rgba(\${r[1]},\${n.opacity})\`)}i.addColorStop(Math.max(0,Math.min(1,n.offset)),s)}}var{scan:Xc,scope:Bn,dreame:rd}=window.frameElement.t90Map;var Jn={officeDesk:{label:"Office desk",width:28,depth:14},officeChair:{label:"Office chair",width:11,depth:11},floorLamp:{label:"Floor lamp",width:8,depth:8},ledStrip:{label:"LED strip",width:24,depth:1.6},plant:{label:"Potted plant",width:13,depth:13},rug:{label:"Area rug",width:42,depth:28},cabinets:{label:"Kitchen cabinets",width:48,depth:10},island:{label:"Kitchen island",width:29,depth:13},stool:{label:"Counter stool",width:6.2,depth:6.2},fridge:{label:"Refrigerator",width:12,depth:12},sofa:{label:"Sofa",width:43,depth:15},sectional:{label:"L-shaped sofa",width:58,depth:29},coffee:{label:"Coffee table",width:20,depth:20},media:{label:"TV and console",width:30,depth:7},dining:{label:"Dining set",width:32,depth:28},queen:{label:"Queen bed",width:54,depth:44},single:{label:"Single bed",width:39,depth:42},washer:{label:"Washing machine",width:12.6,depth:13},dryer:{label:"Dryer",width:12.6,depth:13},smallCabinet:{label:"Small cabinet",width:14,depth:8},tallCabinet:{label:"Storage cabinet",width:14,depth:8.8},toilet:{label:"Toilet",width:9,depth:12},bathSink:{label:"Bathroom sink",width:15,depth:8.6},bathtub:{label:"Bathtub",width:13,depth:31}},od=Bn+":furniture";function Y_(){let i=new Uint8Array(16384),t=2834;for(let n=0;n<64;n++)for(let s=0;s<64;s++){t=Math.imul(t,1664525)+1013904223>>>0;let r=173+(s+n)%2*23+(t>>>27);i.set([r,r,r,255],(n*64+s)*4)}let e=new ai(i,64,64);return e.colorSpace=Ue,e.wrapS=e.wrapT=Hn,e.magFilter=Pe,e.minFilter=Sn,e.generateMipmaps=!0,e.repeat.set(8,6),e.needsUpdate=!0,e}function Z_(i,t,e){let n=Y_(),s=t(6575946,{map:n}),r=t(13746083,{map:n}),o=t(6438956),a=t(10578759),c=t(13945271,{roughness:.48}),l=t(3222312,{roughness:.58}),h=t(7831168,{metalness:.46,roughness:.46}),d=t(13023657,{map:n}),u=t(10974035,{map:n}),p=t(15261392,{map:n}),g=t(8751734,{map:n}),v=t(6254711,{map:n}),m=t(15789543,{roughness:.58}),f=t(15065304,{roughness:.68}),w=e.clone();w.repeat.setScalar(1/8-.004),w.offset.set(.127,.002),w.needsUpdate=!0;let I=t(16052460,{map:w,roughness:.37}),x=Object.fromEntries(Object.keys(Jn).map(b=>[b,new qe]));function M(b,_,W,rt,pt,Rt,P,D,H=.17){return i(b,new ui(W,rt,pt,1,H),_,Rt,P,D)}let A=x.rug;M(A,s,42,.12,28,0,.065,0,.05),M(A,r,39.2,.095,25.2,0,.135,0,.04);for(let b of A.children)b.castShadow=!1;let N=x.cabinets;M(N,f,47.5,10,9.2,0,5.15,-.2);for(let b=-18;b<=18;b+=12)M(N,m,11.5,8.9,.45,b,5.2,4.46,.1),M(N,l,3.6,.32,.52,b,8.3,4.9,.09);M(N,c,48,.88,10,0,10.6,0),M(N,h,9,.13,5.45,-11,11.1,0,.05),M(N,l,7.5,.08,4,-11,11.21,0,.03),M(N,h,.55,2.2,.55,-11,12.05,-2.8),M(N,h,.55,.48,2.2,-11,13.12,-1.94),M(N,l,10.6,.14,6.2,13,11.15,0,.06);for(let b of[10.4,15.6])for(let _ of[-1.45,1.35])i(N,new ci(1.1,.075,4,20),h,b,11.26,_).rotateX(-Math.PI/2);let y=x.island;M(y,f,25.1,10,10.5,0,5.1,-.8),M(y,c,29,.92,13,0,10.58,0,.31);for(let b=-8;b<=8;b+=8)M(y,m,7.7,8.2,.42,b,5.25,4.57),M(y,l,2.6,.27,.45,b,8.1,4.92,.08);i(y,new ye(2.45,1.9,.53,28),l,5,11.32,.2);let R=x.stool;for(let b of[-1.86,1.86])for(let _ of[-1.86,1.86])M(R,l,.46,8,.46,b,4.02,_,.1);M(R,l,4.13,.3,.36,0,3.07,1.86,.07),i(R,new ye(3.03,2.9,.75,32),a,0,8.22,0),i(R,new ye(2.88,2.98,.72,32),d,0,8.75,0);let k=x.fridge;M(k,l,11.4,19.2,11,0,9.65,-.3,.4),M(k,h,5.43,12.65,.75,-2.79,12.36,5.26,.25),M(k,h,5.43,12.65,.75,2.79,12.36,5.26,.25),M(k,h,11.05,5.65,.75,0,3.05,5.26,.25);for(let b of[-.78,.78])M(k,l,.25,3.95,.53,b,11.3,5.72,.11);M(k,l,5.4,.35,.54,0,5.3,5.72,.11);let Y=x.sofa;M(Y,l,40.5,2,12.7,0,1.2,0),M(Y,d,43,2.3,15,0,2.8,0,.73),M(Y,d,43,6.2,3.1,0,6.3,-5.95,.75);for(let b of[-19.8,19.8])M(Y,d,3.2,4.75,14.8,b,5.3,0,.75);for(let b of[-12,0,12]){M(Y,d,11.73,1.65,10.8,b,4.6,1.55,.67);let _=M(Y,d,11.75,4.1,2.55,b,7.12,-4.28,.64);_.rotation.x=.15}let Z=M(Y,u,4.5,3.5,1.8,-13.5,6.9,-1.9,.66);Z.rotation.z=-.19;let it=x.sectional;M(it,l,56.2,1.8,15.3,0,1.04,-6,.4),M(it,d,58,2.55,17,0,2.8,-6,.72),M(it,d,58,6.25,3.15,0,6.3,-12.85,.85),M(it,d,3.25,4.7,16.7,27.35,5.15,-6,.72),M(it,d,3.25,4.7,16.7,-27.35,5.15,-6,.72),M(it,l,18.2,1.82,14.2,-19.5,1.05,6.8,.47),M(it,d,19,2.5,15.3,-19.5,2.8,6.85,.73),M(it,d,17.25,1.72,25.5,-18.95,4.65,1.47,.78);for(let b of[-1.15,16.7])M(it,d,17.25,1.72,12.5,b,4.65,-3.95,.75);for(let b of[-18.8,-1.05,16.7]){let _=M(it,d,17.3,4.05,2.58,b,7.13,-10.98,.72);_.rotation.x=.15}let G=M(it,u,4.8,3.62,1.88,-22.5,6.92,-8.6,.63);G.rotation.z=-.18;let et=M(it,g,4.9,3.65,1.85,22.7,6.8,-8.15,.64);et.rotation.z=.21;let nt=x.coffee;i(nt,new ye(5.9,6.6,3.25,40),l,0,1.65,0),i(nt,new ye(9.93,10,.92,64),I,0,3.72,0),M(nt,g,4.3,.42,3,-2.9,4.4,.21,.09),i(nt,new ye(1.5,1.13,.56,24),c,3.42,4.46,-.72);for(let b of["washer","dryer"]){let _=x[b];M(_,m,12.6,17.1,12.3,0,8.66,-.22,.47),M(_,l,4,1.25,.24,3.28,15.69,5.99,.12),i(_,new ye(.79,.79,.35,20),h,-2.73,15.6,6.1).rotateX(Math.PI/2),i(_,new ye(4.13,4.13,.31,44),b==="washer"?l:v,0,7.83,6.03).rotateX(Math.PI/2),i(_,new ci(4.27,.23,8,48),h,0,7.83,6.21)}let st=x.smallCabinet;M(st,f,13.6,8.4,7.3,0,4.29,-.24,.29),M(st,m,14,.75,8,0,8.56,0,.27);for(let b of[-3.38,3.38])M(st,m,6.46,7.12,.34,b,4.45,3.53,.14),M(st,l,1.5,.27,.3,b,7.31,3.83,.08);let Q=x.tallCabinet;M(Q,f,13.8,19.64,8.55,0,9.96,-.1,.32);for(let b of[-3.35,3.35])M(Q,m,6.58,18.68,.35,b,9.93,4.11,.13);for(let b of[-.82,.82])M(Q,l,.23,2.83,.46,b,10.1,4.42,.08);let at=t(15921387,{roughness:.33}),ct=t(12240584,{roughness:.44}),ft=x.toilet;M(ft,at,7.96,8.35,3.87,0,5.45,-3.83,.42),i(ft,new ye(1,.69,4.13,36),at,0,2.15,1.26).scale.set(4.08,1,4.34),i(ft,new ye(1,1,.31,36),at,0,4.35,1.27).scale.set(4.25,1,4.42),i(ft,new ye(1,1,.07,36),ct,0,4.52,1.33).scale.set(2.59,1,3.03),M(ft,h,1.18,.14,.73,0,9.69,-3.71,.06);let Wt=x.bathSink;M(Wt,f,14.5,9.3,7.9,0,4.79,-.08,.28),M(Wt,at,15,.9,8.6,0,9.6,0,.27),M(Wt,ct,7.5,.08,4.85,0,10.09,.16,.03),M(Wt,h,.48,2.04,.49,0,11,-2.69,.14),M(Wt,h,.48,.4,2.04,0,11.89,-1.91,.14);for(let b of[-3.53,3.53])M(Wt,a,6.75,7.87,.42,b,4.83,3.9,.22);let qt=x.bathtub;M(qt,at,13,6.25,31,0,3.19,0,1.7),M(qt,ct,10.75,.11,27.6,0,6.36,.19,.05),M(qt,at,8.75,.08,24.2,0,6.45,.65,.03);let z=i(qt,new ye(.55,.55,.09,18),h,0,6.53,9);z.castShadow=!1,M(qt,h,.58,1.8,.58,0,7.21,-13.35,.12),M(qt,h,.61,.42,2.8,0,8.06,-12.41,.15);let U=x.media;M(U,o,29.6,4.2,6.5,0,2.4,0,.22),M(U,a,29.9,.47,6.9,0,4.64,0,.18);for(let b of[-9.8,0,9.8])M(U,a,9.1,3.5,.31,b,2.4,3.26);M(U,l,9.3,.28,3.1,0,5,0,.13),M(U,l,2,1.1,.73,0,5.49,-.76),M(U,l,23.4,10.9,.67,0,10.95,-1.09,.21),M(U,v,22.4,10,.1,0,10.97,-.71,.04);let C=x.dining;i(C,new ye(1,1,1.15,64),a,0,8.8,0).scale.set(12.75,1,6.65);for(let b of[-10,10])for(let _ of[-4.7,4.7])M(C,o,1.4,8.2,1.4,b,4.09,_);for(let b of[-7.2,7.2])for(let _ of[-1,1])M(C,o,6.1,4.45,5.6,b,2.22,_*10.7,.25),M(C,d,5.9,.65,5.45,b,4.71,_*10.7,.27),M(C,o,6,4.35,1.06,b,6.78,_*12.73,.25);i(C,new ye(1.23,1.53,2.15,24),c,0,10.47,0);function B(b,_,W,rt,pt){let Rt=-W/2;M(b,o,_,2.6,W-.5,0,1.45,.22,.39),M(b,d,_,8.75,1.6,0,4.5,Rt+.82,.51),M(b,p,_-1.1,2.7,W-2.5,0,3.65,.57,.83),M(b,rt,_-.82,.76,W-9.3,0,5.15,4.18,.38),M(b,d,_-1.1,.67,5.75,0,5.51,W/2-4.1,.29);let P=pt.length===2?[-_/4,_/4]:[0];for(let D of P)M(b,p,12.6,1.42,6.3,D,5.6,Rt+6.25,.71);for(let D of pt){let H=Rt+4.8;M(b,a,7.9,4.7,7.5,D,2.48,H,.24),M(b,o,2.4,.35,.29,D,3.23,H+3.86,.08),i(b,new ye(.42,.84,1.42,16),l,D,5.54,H),i(b,new ye(1.23,1.85,1.62,20),c,D,6.76,H)}}B(x.queen,35.7,44,g,[-22.8,22.8]),B(x.single,22,42,v,[15.2]);let tt=x.officeDesk;M(tt,a,28,.85,14,0,9.3,0,.35);for(let b of[-12,12])for(let _ of[-5.5,5.5])M(tt,l,.7,9,.7,b,4.5,_);M(tt,h,5,.35,3,0,9.9,-3),M(tt,h,1,2.7,.65,0,11,-3),M(tt,l,12,6.5,.65,0,14.1,-3),M(tt,v,11.4,5.7,.12,0,14.2,-2.64),M(tt,l,7.8,.26,2.7,0,9.87,2.2);let yt=x.officeChair;for(let b=0;b<5;b++){let _=b*2*Math.PI/5,W=M(yt,h,.65,.52,4.2,2.1*Math.sin(_),1,2.1*Math.cos(_));W.rotation.y=_,i(yt,new li(.7,10,8),l,4.2*Math.sin(_),.72,4.2*Math.cos(_))}i(yt,new ye(.65,.8,4,12),h,0,3,0),M(yt,v,8.4,1.25,8,0,5.5,0,.55),M(yt,v,8.1,7.2,1.5,0,9.2,-3.7,.68).rotation.x=-.09;for(let b of[-4.5,4.5])M(yt,h,.4,2.4,.5,b,6.6,0),M(yt,l,1,.6,4.4,b,7.9,0);let T=x.floorLamp,X=t(10781781,{metalness:.6,roughness:.38});i(T,new ye(2.9,3.1,.65,32),X,0,.34,0),i(T,new ye(.27,.33,15,12),X,0,8,0);let F=t(16771268,{emissive:16760179,side:Fe});i(T,new ye(2.8,4,5.6,36,1,!0),F,0,15.6,0),i(T,new li(1.1,16,12),F,0,15,0);let K=x.ledStrip,j=t(16773325,{emissive:16762247});M(K,h,24,.56,1.6,0,.3,0),M(K,j,23.7,.32,1.28,0,.68,0);function gt(b,_,W,rt){let pt=_+2*W,Rt=2*W,P=64,D=Math.ceil(P*pt/Rt),H=new Uint8Array(D*P*4);for(let Mt=0;Mt<P;Mt++){let Pt=((Mt+.5)/P-.5)*Rt;for(let Bt=0;Bt<D;Bt++){let $t=Math.abs(((Bt+.5)/D-.5)*pt),q=Math.max(0,$t-_/2),Ct=Math.max(0,1-Math.hypot(q,Pt)/W);H.set([255,255,255,Math.round(255*Ct*Ct)],4*(Mt*D+Bt))}}let lt=new ai(H,D,P);lt.magFilter=lt.minFilter=Pe,lt.needsUpdate=!0;let Et=new Ze({map:lt,color:rt,transparent:!0,depthWrite:!1,toneMapped:!1,blending:Dr}),vt=i(b,new In(pt,Rt),Et,0,.23,0);return vt.rotation.x=-Math.PI/2,vt.castShadow=vt.receiveShadow=!1,vt.userData.lightPool=!0,Et}let bt=gt(T,0,13,16764049),wt=gt(K,23.7,6.4,16762744),J=x.plant;i(J,new ye(3.1,2.35,5,32),c,0,2.5,0),i(J,new ye(2.8,2.8,.2,24),o,0,5,0);let S=[t(4349504),t(7571027),t(5666384)],Ut=new li(1,14,10);for(let b=0;b<12;b++){let _=b*2.4,W=8+b%4*1.5,rt=new V(Math.sin(_),1.15+b%3*.3,Math.cos(_)).normalize(),pt=i(J,Ut,S[b%3],2.6*Math.sin(_),W,2.6*Math.cos(_));pt.scale.set(1.6,4.6,.64),pt.quaternion.setFromUnitVectors(new V(0,1,0),rt)}function Ot(b){F.emissiveIntensity=b?2.15:.3,j.emissiveIntensity=b?5:2.2,bt.opacity=b?.68:.22,wt.opacity=b?.96:.52}return{groups:x,setLighting:Ot}}function J_({x:i,y:t},e){let n=!1;for(let s=0,r=e.length-1;s<e.length;r=s++){let o=e[s],a=e[r];o.y>t!=a.y>t&&i<(a.x-o.x)*(t-o.y)/(a.y-o.y)+o.x&&(n=!n)}return n}function K_(i,t,e){return i.some((n,s)=>{let r=i[(s+1)%i.length],o=0,a=1;for(let c of["x","y"]){let l=r[c]-n[c];if(l===0){if(n[c]<t[c]||n[c]>e[c])return!1;continue}let h=(t[c]-n[c])/l,d=(e[c]-n[c])/l;if(o=Math.max(o,Math.min(h,d)),a=Math.min(a,Math.max(h,d)),o>a)return!1}return!0})}function il(i){let t=i.rotation*Math.PI/2,e=Math.cos(t),n=Math.sin(t);return{width:new mt(e,-n),depth:new mt(n,e)}}function qc(i,t=0){let e=Jn[i.kind],n=il(i),s=e.width*i.width/200+t,r=e.depth*i.depth/200+t,o=[[-s,-r],[s,-r],[s,r],[-s,r]].map(([c,l])=>new mt(i.x,i.z).addScaledVector(n.width,c).addScaledVector(n.depth,l)),a=Math.round(i.rotation);return o.map((c,l)=>o[(l+a)%4])}function ad({model:i,camera:t,canvas:e,floors:n,additionalFloors:s,addMesh:r,makeMaterial:o,marbleMap:a,render:c,onEditing:l}){let h=e.parentElement,d=h.closest(".stage"),u=document.querySelector("#furnishing-editor"),p=O=>document.querySelector('[data-furnishing="'+O+'"]'),g=p("edit"),v=p("visible"),m=p("add"),f=p("undo"),w=p("resize"),I=p("flip-chaise"),x=document.querySelector('[data-view="source"]'),M=document.querySelector("#furnishing-palette"),A=u.querySelector(".edit-selection"),N=u.querySelector(".selected-name"),y=u.querySelector("#furnishing-size"),[R,k]=[...y.querySelectorAll("input")];function Y(O,ht){return Number.isInteger(O)&&O>=Number(ht.min)&&O<=Number(ht.max)}let Z=u.querySelector(".furnishing-status"),it=document.querySelector(".furnishing-note"),G=new qe;i.add(G);let et=new Map,{groups:nt,setLighting:st}=Z_(r,o,a),Q=n.flatMap(O=>O.toShapes().map(ht=>ht.extractPoints(1))),at=new hi,ct=new mt,ft=new We(new V(0,1,0),0),It=new V,Nt=new Ls({color:16761740,depthTest:!1,toneMapped:!1}),Xt=new fe(12,3),Wt=new Le().setAttribute("position",Xt),qt=new pr(Wt,Nt);qt.renderOrder=5,qt.frustumCulled=!1,qt.visible=!1,i.add(qt);function z(O){let ht=qc(O,.75),St=il(O),kt=new mt(O.x,O.z),ee=new mt(Jn[O.kind].width*O.width/200+.75,Jn[O.kind].depth*O.depth/200+.75),se=ee.clone().negate(),re=he=>K_(he.map(ve=>{let pe=new mt(ve.x-kt.x,ve.y-kt.y);return new mt(pe.dot(St.width),pe.dot(St.depth))}),se,ee);return[...Q,...s()].some(({shape:he,holes:ve})=>ht.every(pe=>J_(pe,he))&&!re(he)&&ve.every(pe=>!re(pe)))}function U(){try{let O=JSON.parse(localStorage.getItem(od));if(O?.version===1&&Array.isArray(O.items)){let ht=new Set;return O.items.filter(St=>!St||!Object.hasOwn(Jn,St.kind)||!Number.isSafeInteger(St.id)||St.id<1||ht.has(St.id)||!Number.isFinite(St.x)||!Number.isFinite(St.z)||!Number.isFinite(St.rotation)||St.rotation<0||St.rotation>=4||!Y(St.width,R)||!Y(St.depth,k)||!z(St)&&St.kind!=="coffee"?!1:(ht.add(St.id),!0))}}catch{}return[]}let C=U(),L=Math.max(0,...C.map(O=>O.id))+1,B=null,tt=null,yt=null,T=null,X=null,F=0,K=!1,j=()=>C.find(O=>O.id===B),gt="Drag a piece to move it. Drag a selected corner to resize.";function bt(O=!1){K||=O,!F&&(F=requestAnimationFrame(()=>{F=0;let ht=K;K=!1,c(ht)}))}function wt(O){let ht=et.get(O.id);ht||(ht=nt[O.kind].clone(),ht.userData.furnishingId=O.id,et.set(O.id,ht),G.add(ht)),ht.position.set(O.x,0,O.z),ht.rotation.y=O.rotation*Math.PI/2;let St=O.kind==="sectional"&&O.chaise!=="left";ht.scale.set((St?-1:1)*O.width/100,1,O.depth/100)}function J(O){Z.textContent=O}function S(O){try{localStorage.setItem(od,JSON.stringify({version:1,items:C})),J(O)}catch{J(O+" Browser storage is unavailable.")}h.dataset.furnishings=String(C.length)}function Ut(){X={items:C.map(O=>({...O})),selectedId:B},f.hidden=!1}function Ot(O,ht=!0){qt.visible=!!(O&&!u.hidden&&G.visible),qt.visible&&(Nt.color.setHex(ht?16761740:16746092),qc(O,.7).forEach((St,kt)=>Xt.setXYZ(kt,St.x,.3,St.y)),Xt.needsUpdate=!0)}let b=new V,_=["nw","ne","se","sw"].map((O,ht)=>{let St=document.createElement("div");return St.className="furniture-corner "+O,St.dataset.corner=O,St.setAttribute("aria-hidden","true"),St.hidden=!0,u.prepend(St),St.addEventListener("pointerdown",kt=>{let ee=j();if(!ee||T||!kt.isPrimary||kt.button!==0)return;let se=Ct(kt);if(!se)return;kt.preventDefault(),e.focus({preventScroll:!0});let re=qc(ee);T={item:ee,pointerId:kt.pointerId,startX:kt.clientX,startY:kt.clientY,corner:ht,origin:new mt(se.x,se.z),anchor:re[(ht+2)%4],startCorner:re[ht],preview:ee,dragging:!1},e.setPointerCapture(kt.pointerId)}),St}),W=document.createElement("button");W.type="button",W.className="furniture-turn",W.setAttribute("aria-label","Drag to rotate furniture"),W.title="Drag to rotate. Use arrow keys for 1\\xB0 steps.",W.textContent="\\u21BB",W.hidden=!0,u.prepend(W);function rt(O,ht){return{...O,rotation:Oe.euclideanModulo(O.rotation+ht*2/Math.PI,4)}}W.addEventListener("pointerdown",O=>{let ht=j();if(!ht||T||!O.isPrimary||O.button!==0)return;let St=Ct(O);St&&(O.preventDefault(),e.focus({preventScroll:!0}),T={item:ht,pointerId:O.pointerId,startX:O.clientX,startY:O.clientY,startAngle:Math.atan2(St.z-ht.z,St.x-ht.x),preview:ht,dragging:!1},e.setPointerCapture(O.pointerId))}),W.addEventListener("keydown",O=>{if(!["ArrowLeft","ArrowRight"].includes(O.key)||!j())return;O.preventDefault();let ht=(O.key==="ArrowLeft"?1:-1)*(O.shiftKey?15:1);q(j(),rt(j(),Oe.degToRad(ht)),"Rotated.")});function pt(O,ht){let St=O.item;if(Math.hypot(ht.z-St.z,ht.x-St.x)<.01)return O.preview;let kt=Math.atan2(ht.z-St.z,ht.x-St.x),ee=rt(St,O.startAngle-kt);return z(ee)?ee:O.preview}function Rt(){let O=qt.visible&&!tt&&!!j();if(W.hidden=!O,O){let ht=T?.preview||j(),St=il(ht).depth,kt=Jn[ht.kind].depth*ht.depth/200+.7;b.set(ht.x-St.x*kt,.3,ht.z-St.y*kt),i.localToWorld(b).project(t);let ee=(b.x+1)*h.clientWidth/2,se=(1-b.y)*h.clientHeight/2;b.set(ht.x,.3,ht.z),i.localToWorld(b).project(t);let re=ee-(b.x+1)*h.clientWidth/2,he=se-(1-b.y)*h.clientHeight/2,ve=Math.hypot(re,he)||1;W.style.left=ee+38*re/ve+"px",W.style.top=se+38*he/ve+"px",W.style.setProperty("--stem-angle",Math.atan2(-he,-re)+"rad")}for(let[ht,St]of _.entries())St.hidden=!O,O&&(b.fromBufferAttribute(Xt,ht),i.localToWorld(b).project(t),St.style.left=(b.x+1)*50+"%",St.style.top=(1-b.y)*50+"%")}function P(O,ht){let{item:St,anchor:kt,startCorner:ee,origin:se}=O,re=il(St),he=ee.clone().sub(kt),ve=Math.sign(he.dot(re.width)),pe=Math.sign(he.dot(re.depth));he.x+=ht.x-se.x,he.y+=ht.z-se.y;let ce=Jn[St.kind],Qe=(En,gn)=>Oe.clamp(Math.round(En/Number(gn.step))*Number(gn.step),Number(gn.min),Number(gn.max)),$n=Qe(100*ve*he.dot(re.width)/ce.width,R),jn=Qe(100*pe*he.dot(re.depth)/ce.depth,k);function Ks(En,gn){let $r=kt.clone().addScaledVector(re.width,ve*ce.width*En/200).addScaledVector(re.depth,pe*ce.depth*gn/200);return{...St,width:En,depth:gn,x:$r.x,z:$r.y}}let ki=Ks($n,jn);if(z(ki))return ki;let di=O.preview,ss=Math.ceil(Math.max(Math.abs($n-di.width),Math.abs(jn-di.depth))/5);for(let En=1;En<ss;En++){let gn=Ks(Qe($n+(di.width-$n)*En/ss,R),Qe(jn+(di.depth-jn)*En/ss,k));if(z(gn))return gn}return di}function D(O){y.hidden=!O,w.setAttribute("aria-expanded",String(O))}function H(){let O=j();if(A.hidden=!O||u.hidden||!!tt,Ot(A.hidden?null:O),!A.hidden){N.textContent=Jn[O.kind].label,I.hidden=O.kind!=="sectional",R.value=O.width,k.value=O.depth;for(let ht of[R,k])ht.nextElementSibling.value=ht.value+"%"}}function lt(O){O!==B&&D(!1),B=O,H(),bt()}function Et(O){G.visible=O,it.hidden=!O,v.setAttribute("aria-pressed",String(O)),H(),bt(!0)}function vt(O){M.hidden=!O,m.setAttribute("aria-expanded",String(O))}function Mt(){tt=null,yt=null,h.dataset.placing="false"}function Pt(){let O=T;return T=null,h.dataset.dragging="false",O&&e.hasPointerCapture(O.pointerId)&&e.releasePointerCapture(O.pointerId),O}function Bt(){let O=Pt();O?.item&&O.dragging&&wt(O.item),H(),bt(!!O?.dragging)}function $t(O){Bt(),Mt(),vt(!1),D(!1),u.hidden=!O,g.setAttribute("aria-expanded",String(O)),d.dataset.editing=String(O),h.dataset.furnishingEditing=String(O),B=null,O&&!G.visible&&Et(!0),H(),l(O),O?(J(gt),m.focus()):x.disabled||g.focus()}function q(O,ht,St){let kt={...O,...ht};if(!z(kt)){wt(O),J("Too close to a wall. Try a spot inside the room."),H(),bt(!0);return}Object.keys(ht).some(ee=>O[ee]!==kt[ee])&&(Ut(),Object.assign(O,ht),S(St)),wt(O),H(),bt(!0)}function Ct(O){let ht=e.getBoundingClientRect();return ct.set((O.clientX-ht.left)/ht.width*2-1,1-(O.clientY-ht.top)/ht.height*2),at.setFromCamera(ct,t),at.ray.intersectPlane(ft,It)?i.worldToLocal(It):null}function xt(){let O=at.intersectObjects(G.children,!0).find(St=>!St.object.userData.lightPool)?.object;for(;O&&O.parent!==G;)O=O.parent;let ht=O?.userData.furnishingId;return C.find(St=>St.id===ht)}function Lt(O){return Math.round(O*2)/2}function Ft(O,ht,St){return{id:L,kind:O,x:Lt(ht),z:Lt(St),rotation:0,width:100,depth:100}}function At(O){for(let{shape:ht}of[...Q,...s()]){let St=new Ii().setFromPoints(ht).getCenter(new mt);if(z(Ft(O,St.x,St.y)))return new mt(St.x,St.y)}return null}function ot(O){yt=new mt(O.x,O.z);let ht=Ft(tt,yt.x,yt.y);Ot(ht,z(ht)),bt()}function Tt(){if(!yt)return;let O=Ft(tt,yt.x,yt.y);if(!z(O)){J("This piece needs more space. Try a larger room.");return}Ut(),L++,C.push(O),wt(O),Mt(),lt(O.id),S("Placed. Drag to fine-tune."),bt(!0)}function Dt(O,ht){return{x:Lt(ht.x+O.offsetX),z:Lt(ht.z+O.offsetZ)}}for(let[O,ht]of Object.entries(Jn)){let St=document.createElement("button");St.type="button",St.dataset.furnitureKind=O,St.textContent=ht.label,M.append(St),St.addEventListener("click",kt=>{if(vt(!1),tt=O,yt=null,h.dataset.placing="true",lt(null),J("Click or tap the floor to place the "+ht.label.toLowerCase()+"."),e.focus({preventScroll:!0}),kt.detail===0){let ee=At(O);ee&&ot({x:ee.x,z:ee.y})}})}v.addEventListener("click",()=>Et(!G.visible)),g.addEventListener("click",()=>$t(!0)),p("done").addEventListener("click",()=>$t(!1)),m.addEventListener("click",()=>{Bt(),Mt(),H(),vt(M.hidden),J(M.hidden?gt:"Choose a piece."),bt()}),x.addEventListener("click",()=>{let O=x.getAttribute("aria-pressed")==="true";O&&!u.hidden&&$t(!1),g.disabled=v.disabled=O}),p("rotate").addEventListener("click",()=>{let O=j();O&&q(O,{rotation:(O.rotation+1)%4},"Rotated.")}),I.addEventListener("click",()=>{let O=j();O?.kind==="sectional"&&q(O,{chaise:O.chaise==="left"?"right":"left"},"Chaise flipped.")}),w.addEventListener("click",()=>D(y.hidden)),p("remove").addEventListener("click",()=>{let O=C.findIndex(St=>St.id===B);if(O===-1)return;Ut();let[ht]=C.splice(O,1);G.remove(et.get(ht.id)),et.delete(ht.id),lt(null),S("Removed."),bt(!0),e.focus({preventScroll:!0})}),f.addEventListener("click",()=>{if(X){Bt(),Mt(),vt(!1),G.clear(),et.clear(),C.splice(0,C.length,...X.items);for(let O of C)wt(O);lt(X.selectedId),X=null,f.hidden=!0,S("Undo complete."),bt(!0),e.focus({preventScroll:!0})}});for(let[O,ht]of[["width",R],["depth",k]])ht.addEventListener("input",()=>{ht.nextElementSibling.value=ht.value+"%"}),ht.addEventListener("change",()=>{let St=j();St&&q(St,{[O]:Number(ht.value)},"Resized.")});e.addEventListener("pointerdown",O=>{if(u.hidden||!O.isPrimary||O.button!==0||T)return;let ht=Ct(O);if(!ht)return;O.preventDefault(),e.focus({preventScroll:!0}),vt(!1);let St=tt?null:xt();tt||(lt(St?.id??null),J(St?"Drag \\u21BB to rotate or a corner to resize.":gt)),!(!St&&!tt)&&(T={pointerId:O.pointerId,item:St,startX:O.clientX,startY:O.clientY,offsetX:St?St.x-ht.x:0,offsetZ:St?St.z-ht.z:0,dragging:!1},e.setPointerCapture(O.pointerId),tt&&ot(ht))}),e.addEventListener("pointermove",O=>{if(u.hidden||!O.isPrimary)return;if(tt){let ee=Ct(O);ee&&ot(ee);return}if(!T?.item||T.pointerId!==O.pointerId||!T.dragging&&Math.hypot(O.clientX-T.startX,O.clientY-T.startY)<4)return;let ht=Ct(O);if(!ht)return;if(T.dragging=!0,h.dataset.dragging="true",T.startAngle!==void 0){let ee=pt(T,ht);T.preview=ee,wt(ee),Ot(ee),J("Rotation "+Math.round(ee.rotation*90)%360+"\\xB0"),bt(!0);return}let St=T.corner!==void 0,kt=St?P(T,ht):{...T.item,...Dt(T,ht)};if(T.preview=kt,St){J(kt.width+"% wide \\xB7 "+kt.depth+"% deep");for(let[ee,se]of[[R,kt.width],[k,kt.depth]])ee.value=se,ee.nextElementSibling.value=se+"%"}wt(kt),Ot(kt,z(kt)),bt(!0)}),e.addEventListener("pointerup",O=>{if(T?.pointerId!==O.pointerId)return;let ht=Ct(O),St=Pt();tt&&ht?(ot(ht),Tt()):St.dragging&&ht?St.startAngle!==void 0?q(St.item,pt(St,ht),"Rotated."):St.corner!==void 0?q(St.item,P(St,ht),"Resized."):q(St.item,Dt(St,ht),"Moved."):St.dragging&&(wt(St.item),H(),bt(!0))});for(let O of["pointercancel","lostpointercapture"])e.addEventListener(O,ht=>{T?.pointerId===ht.pointerId&&Bt()});e.addEventListener("pointerleave",()=>{u.hidden||!tt||T||(yt=null,Ot(null),bt())});function Ht(){T?(Bt(),J("Edit cancelled.")):tt?(Mt(),H(),J(gt),bt()):M.hidden?y.hidden?$t(!1):(D(!1),w.focus()):(vt(!1),m.focus(),J(gt))}u.addEventListener("keydown",O=>{O.key==="Escape"&&(O.preventDefault(),Ht())});for(let O of C)wt(O);return h.dataset.furnishings=String(C.length),{setLighting:st,refreshHandles:Rt,handleKey(O){if(u.hidden)return!1;if(O.key==="Escape")return O.preventDefault(),Ht(),!0;if((O.ctrlKey||O.metaKey)&&O.key.toLowerCase()==="z"&&X)return O.preventDefault(),f.click(),!0;if(tt&&O.key==="Enter")return O.preventDefault(),yt??=At(tt),Tt(),!0;if(["PageUp","PageDown"].includes(O.key)&&C.length&&!tt){O.preventDefault();let kt=C.findIndex(se=>se.id===B),ee=O.key==="PageDown"?1:-1;return lt(C[(C.length+(kt===-1?ee===1?0:-1:kt+ee))%C.length].id),J("Selected "+Jn[j().kind].label.toLowerCase()+"."),!0}let St={ArrowLeft:[-1.5,0],ArrowRight:[1.5,0],ArrowUp:[0,-1.5],ArrowDown:[0,1.5]}[O.key];if(!St)return!1;if(O.preventDefault(),tt){let kt=yt??At(tt);kt&&ot({x:kt.x+St[0],z:kt.y+St[1]})}else{let kt=j();kt&&q(kt,{x:kt.x+St[0],z:kt.z+St[1]},"Moved.")}return!0}}}var ld=Bn+":walls",sl="Drag the wall to move it, either end to change its length, or \\u21BB to rotate.",cd={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]};function Zc(i,{start:t,end:e}){let n=e.x-t.x,s=e.z-t.z;return Oe.clamp(((i.x-t.x)*n+(i.z-t.z)*s)/(n*n+s*s),0,1)}function Kn(i,{start:t,end:e}){return{x:Oe.lerp(t.x,e.x,i),z:Oe.lerp(t.z,e.z,i)}}function ol(i,t){let e=Kn(Zc(i,t),t);return Math.hypot(i.x-e.x,i.z-e.z)}function rl({start:i,end:t}){let e=t.x-i.x,n=t.z-i.z,s=Math.hypot(e,n);return{x:-n/s,z:e/s}}function Yc(i,t){return!t||i.id!==t.id||i.kind!==t.kind||i.hidden!==t.hidden?!1:i.kind==="floor"?i.points.length===t.points.length&&i.points.every((e,n)=>e.x===t.points[n].x&&e.z===t.points[n].z):i.start.x===t.start.x&&i.start.z===t.start.z&&i.end.x===t.end.x&&i.end.z===t.end.z}function Zr(i){return i?.start&&i?.end&&[i.start.x,i.start.z,i.end.x,i.end.z].every(Number.isFinite)&&Math.hypot(i.end.x-i.start.x,i.end.z-i.start.z)>=.6}function Js(i){if(!Array.isArray(i)||i.length<3||i.length>24||!i.every(e=>Number.isFinite(e?.x)&&Number.isFinite(e?.z)))return!1;let t=0;for(let e=0;e<i.length;e++){let n=i[e],s=i[(e+1)%i.length];t+=n.x*s.z-s.x*n.z}return Math.abs(t)>=20}function Jc(i,t){let e=!1;for(let n=0,s=t.length-1;n<t.length;s=n++){let r=t[n],o=t[s];r.z>i.z!=o.z>i.z&&i.x<(o.x-r.x)*(i.z-r.z)/(o.z-r.z)+r.x&&(e=!e)}return e}function $_(i,t){let e=i.filter(c=>c.kind==="wall"&&c.id.startsWith("added:")&&!c.hidden),n=i.filter(c=>c.kind==="wall"&&!c.id.startsWith("added:")&&!c.hidden),s=new Set,r=[],o=(c,l)=>Math.hypot(c.x-l.x,c.z-l.z)<.1,a=c=>t.some(l=>Jc(c,l));for(let c of e){if(s.has(c.id))continue;let l=[c.start,c.end];s.add(c.id);for(let g of[!1,!0])for(g&&l.reverse();!o(l[0],l.at(-1));){let v=l.at(-1),m=e.filter(w=>!s.has(w.id)&&[w.start,w.end].some(I=>o(I,v)));if(m.length!==1)break;let f=m[0];s.add(f.id),l.push(o(f.start,v)?f.end:f.start)}let h=o(l[0],l.at(-1)),d=n.find(g=>ol(l[0],g)<=.85&&ol(l.at(-1),g)<=.85);if(!h&&(!d||l.length<4)||(h&&l.pop(),!Js(l)))continue;let u=l.reduce((g,v)=>({x:g.x+v.x/l.length,z:g.z+v.z/l.length}),{x:0,z:0});if(!Jc(u,l)||a(u))continue;let p=[];for(let g=0;g<l.length;g++){let v={start:l[g],end:l[(g+1)%l.length]},m=Math.hypot(v.end.x-v.start.x,v.end.z-v.start.z);if(m<14)continue;let f=Kn(.5,v),w=rl(v),I=[-3,3].map(N=>a({x:f.x+w.x*N,z:f.z+w.z*N}));if(I[0]===I[1])continue;let x=Math.min(7.5,(m-2.4)/2)/m,M=Kn(.5-x,v),A=Kn(.5+x,v);p.push(I[0]?{start:M,end:A}:{start:A,end:M})}r.push({perimeter:l,door:p.length===1?p[0]:null})}return r.length===1?r[0]:null}function hd({segments:i,scannedFloors:t,model:e,camera:n,canvas:s,positionWalls:r,render:o,onEditing:a}){let c=s.parentElement,l=c.closest(".stage"),h=document.querySelector("#wall-editor"),d=P=>document.querySelector('[data-wall="'+P+'"]'),u=d("edit"),p=d("reset"),g=d("undo"),v=d("remove"),m=d("finish-floor"),f=d("rotate"),w=[...h.querySelectorAll(".wall-handle")],I=h.querySelector(".wall-turn"),x=h.querySelector(".wall-selection"),M=document.querySelector('[data-view="source"]'),A=h.querySelector(".wall-status"),N=new hi,y=new mt,R=new We(new V(0,1,0),0),k=new V,Y=new V,Z=i.map(([P,D])=>({id:[...P.toArray(),...D.toArray()].map(H=>H.toFixed(2)).join(","),kind:"wall",start:{x:P.x,z:P.y},end:{x:D.x,z:D.y},hidden:!1})),it=new Map(Z.map(P=>[P.id,P])),G=!1;function et(){try{let P=JSON.parse(localStorage.getItem(ld));if(P?.version===1&&P.walls){let D=Z.map(Pt=>{let Bt=P.walls[Pt.id];return typeof Bt?.hidden!="boolean"||!Zr(Bt)?Pt:{...Pt,start:Bt.start,end:Bt.end,hidden:Bt.hidden}}),H=new Set,lt=Array.isArray(P.added)?P.added.filter(Pt=>!Pt||typeof Pt.id!="string"||!/^added:\\d+$/.test(Pt.id)||H.has(Pt.id)||!["wall","gap","floor","door"].includes(Pt.kind)||!(Pt.kind==="floor"?Js(Pt.points):Zr(Pt))?!1:(H.add(Pt.id),!0)).map(Pt=>({...Pt,hidden:!1})):[],Et=[...D,...lt];if(G=!!(P.roomFinished||lt.some(Pt=>Pt.kind==="floor")),G)return Et;let vt=$_(Et,t);if(!vt)return Et;G=!0;let Mt=Math.max(0,...lt.map(Pt=>Number(Pt.id.slice(6))))+1;return Et.push({id:"added:"+Mt,kind:"floor",points:vt.perimeter,hidden:!1}),vt.door&&!lt.some(Pt=>Pt.kind==="door")&&Et.push({id:"added:"+(Mt+1),kind:"door",...vt.door,hidden:!1}),Et}}catch{}return Z}let nt=et(),st=Math.max(0,...nt.filter(P=>!it.has(P.id)).map(P=>Number(P.id.slice(6))))+1,Q=nt,at=null,ct=null,ft=null,It=null,Nt=null,Xt=[],Wt=0,qt=()=>nt.find(P=>P.id===at&&!P.hidden);function z(){return nt.filter(P=>!Yc(P,it.get(P.id)))}function U(){let P=z().length;p.hidden=P===0,g.hidden=!ct,c.dataset.wallEdits=String(P),c.dataset.visibleWalls=String(nt.filter(D=>D.kind==="wall"&&!D.hidden).length),c.dataset.gapCovers=String(nt.filter(D=>D.kind==="gap").length),c.dataset.customFloors=String(nt.filter(D=>D.kind==="floor").length),c.dataset.doors=String(nt.filter(D=>D.kind==="door").length)}function C(P){try{let D=z(),H=D.filter(Et=>it.has(Et.id)).map(({id:Et,start:vt,end:Mt,hidden:Pt})=>[Et,{start:vt,end:Mt,hidden:Pt}]),lt=D.filter(Et=>!it.has(Et.id));G||=lt.some(Et=>Et.kind==="floor"),localStorage.setItem(ld,JSON.stringify({version:1,walls:Object.fromEntries(H),added:lt,roomFinished:G})),A.textContent=P}catch{A.textContent=P+" Browser storage is unavailable."}U()}function L(){let P=!h.hidden&&!It&&Q.find(q=>q.id===at&&!q.hidden&&q.kind!=="floor"),D=h.querySelector(".wall-measure");if(D.hidden=!P||P.kind!=="wall",!D.hidden){let q=P.end.x-P.start.x,Ct=P.end.z-P.start.z,xt=(Math.round(Oe.radToDeg(Math.atan2(Ct,q))*10)/10+360)%360;D.textContent=Math.hypot(q,Ct).toFixed(1)+" map units \\xB7 "+xt.toFixed(1)+"\\xB0"}I.hidden=!P||P.kind!=="wall";for(let q of w)q.hidden=!P;if(!P)return;let H=w.map(q=>{let Ct=P[q.dataset.wallEnd];e.localToWorld(Y.set(Ct.x,.35,Ct.z)).project(n);let xt=(Y.x+1)*c.clientWidth/2,Lt=(1-Y.y)*c.clientHeight/2;return q.hidden=Math.abs(Y.x)>1||Math.abs(Y.y)>1,q.style.transform="translate("+xt+"px,"+Lt+"px) translate(-50%,-50%)",new mt(xt,Lt)}),[lt,Et]=H,vt=lt.clone().lerp(Et,.5),Mt=Et.clone().sub(lt).normalize(),Pt=lt.distanceTo(Et)/2;if(w.forEach((q,Ct)=>{if(Pt>=32){q.style.clipPath="";return}let xt=Mt.clone().multiplyScalar(Ct?-1:1),Lt=new mt(22,22).addScaledVector(xt,Pt),Ft=new mt(-xt.y,xt.x).multiplyScalar(100),At=xt.clone().multiplyScalar(-100),ot=[Lt.clone().add(Ft),Lt.clone().sub(Ft),Lt.clone().sub(Ft).add(At),Lt.clone().add(Ft).add(At)];q.style.clipPath="polygon("+ot.map(Tt=>Tt.x+"px "+Tt.y+"px").join(",")+")"}),I.hidden)return;let Bt=new mt(Mt.y,-Mt.x),$t=vt.clone().addScaledVector(Bt,38);($t.x<17||$t.y<17||$t.x>c.clientWidth-17||$t.y>c.clientHeight-17)&&(Bt.negate(),$t.copy(vt).addScaledVector(Bt,38)),I.style.left=$t.x+"px",I.style.top=$t.y+"px",I.style.setProperty("--stem-angle",Math.atan2(-Bt.y,-Bt.x)+"rad")}function B(P=nt,D=!0){Q=P;let H=qt();if(x.hidden=!!(!H||It),H){let lt={gap:"cover",floor:"floor",door:"door",wall:"wall"}[H.kind];v.textContent="Remove "+lt,f.hidden=H.kind==="floor"}r(P,h.hidden?null:at),o(D)}function tt(){let P=ft;return ft=null,cancelAnimationFrame(Wt),Wt=0,c.dataset.dragging="false",P&&s.hasPointerCapture(P.pointerId)&&s.releasePointerCapture(P.pointerId),P}function yt(P){cancelAnimationFrame(Wt),Wt=0,It=P,Nt=null,Xt=[],m.hidden=!0,c.dataset.placing=String(!!It),d("add").setAttribute("aria-pressed",String(It==="wall")),d("gap").setAttribute("aria-pressed",String(It==="gap")),d("floor").setAttribute("aria-pressed",String(It==="floor")),d("door").setAttribute("aria-pressed",String(It==="door"))}function T(P){tt(),yt(null),at=null,h.hidden=!P,l.dataset.editing=String(P),c.dataset.wallEditing=String(P),u.setAttribute("aria-expanded",String(P)),A.textContent=sl,U(),a(P),B(),P?s.focus({preventScroll:!0}):u.disabled||u.focus()}function X(P,D){let H=(D==="touch"?15:10)*(n.right-n.left)/(s.clientWidth*n.zoom),lt=null;for(let Et of nt){if(Et.hidden||Et.kind==="floor")continue;let vt=ol(P,Et);(vt<H||Et.kind==="door"&&Math.abs(vt-H)<1e-4)&&(H=vt,lt=Et)}return lt??nt.findLast(Et=>Et.kind==="floor"&&Jc(P,Et.points))}function F(P){let D=s.getBoundingClientRect();return y.set((P.clientX-D.x)/D.width*2-1,1-(P.clientY-D.y)/D.height*2),N.setFromCamera(y,n),N.ray.intersectPlane(R,k)?e.worldToLocal(k):null}function K(P,D,H=null){if(D==="wall"||D==="door"||D==="floor"){let lt=null,Et=1.7;for(let vt of nt)if(!(vt.hidden||vt.kind!=="wall"||vt.id===H))for(let Mt of[vt.start,vt.end,Kn(Zc(P,vt),vt)]){let Pt=Math.hypot(P.x-Mt.x,P.z-Mt.z);Pt<Et&&(lt=Mt,Et=Pt)}if(lt)return{...lt}}return{x:Math.round(P.x*2)/2,z:Math.round(P.z*2)/2}}function j(P,D,H){let lt={...P,start:D,end:H};if(Yc(P,lt))return nt;let Et=Mt=>ol(Mt,P)<.05?Kn(Zc(Mt,P),lt):Mt,vt=nt.map(Mt=>Mt.id===P.id?lt:Mt.hidden||!["wall","door"].includes(Mt.kind)||P.kind!=="wall"?Mt:{...Mt,start:Et(Mt.start),end:Et(Mt.end)});return vt.every(Mt=>Mt.kind==="floor"?Js(Mt.points):Zr(Mt))?vt:null}function gt(P,D){let H=rl(P),lt=Et=>({x:Et.x+D*H.x,z:Et.z+D*H.z});return j(P,lt(P.start),lt(P.end))}function bt(P,D,H){return j(P,D==="start"?H:P.start,D==="end"?H:P.end)}function wt(P,D){let H=Kn(.5,P),lt=(P.end.x-P.start.x)/2,Et=(P.end.z-P.start.z)/2,vt=lt*Math.cos(D)-Et*Math.sin(D),Mt=lt*Math.sin(D)+Et*Math.cos(D);return j(P,{x:H.x-vt,z:H.z-Mt},{x:H.x+vt,z:H.z+Mt})}function J(P,D){if(P.startAngle!==void 0){let Et=Kn(.5,P.wall),vt=D.x-Et.x,Mt=D.z-Et.z;if(Math.hypot(vt,Mt)<.01)return P.draft;let Pt=Math.atan2(Mt,vt)-P.startAngle;return Math.abs(Pt)<1e-9?nt:wt(P.wall,Pt)??P.draft}if(P.end){let Et=K({x:D.x+P.offsetX,z:D.z+P.offsetZ},P.wall.kind,P.wall.id);return bt(P.wall,P.end,Et)}let H=rl(P.wall),lt=(D.x-P.x)*H.x+(D.z-P.z)*H.z;return gt(P.wall,Math.round(lt*2)/2)}function S(P,D){if(!P){A.textContent="Give the wall and its connected edges more space.",B();return}(P.length!==nt.length||P.some((H,lt)=>!Yc(H,nt[lt])))&&(ct={walls:nt,selectedId:at},nt=P,C(D)),B()}function Ut(){let P=qt();if(!P)return;let D=it.has(P.id)?nt.map(lt=>lt.id===P.id?{...lt,hidden:!0}:lt):nt.filter(lt=>lt.id!==P.id);at=null;let H={gap:"Cover",floor:"Floor",door:"Door",wall:"Wall"}[P.kind];S(D,H+" removed."),s.focus({preventScroll:!0})}function Ot(P){tt(),yt(It===P?null:P),at=null;let D={wall:"Click or tap the first end of the wall.",gap:"Click or tap one end of the dark gap.",floor:"Click around the room in order, then choose Finish floor.",door:"Click or tap both sides of the doorway."};A.textContent=D[It]??sl,B(),s.focus({preventScroll:!0})}function b(P){let D=K(P,It);if(It==="floor"){if(Xt.length>=3&&Math.hypot(D.x-Xt[0].x,D.z-Xt[0].z)<2){W();return}if(Xt.length===24)return;let Et=Xt.at(-1);if(Et&&Math.hypot(D.x-Et.x,D.z-Et.z)<.6)return;Xt.push(D),m.hidden=!Js(Xt),A.textContent="Corners added: "+Xt.length+".",_();return}if(!Nt){Nt=D,A.textContent="Now click or tap the other end.";return}let H={id:"added:"+st,kind:It,start:Nt,end:D,hidden:!1};if(!Zr(H)){A.textContent="Choose a point farther from the first end.";return}st++,yt(null),at=H.id;let lt={gap:"Gap covered.",door:"Door added.",wall:"Wall added."}[H.kind];S([...nt,H],lt)}function _(P=null){let D=P?[...Xt,P]:Xt;if(!Js(D)){B();return}B([...nt,{id:"draft",kind:"floor",points:D,hidden:!1}])}function W(){if(!Js(Xt))return;let P={id:"added:"+st++,kind:"floor",points:Xt,hidden:!1};yt(null),at=P.id,S([...nt,P],"Floor added.")}u.addEventListener("click",()=>T(!0)),d("done").addEventListener("click",()=>T(!1)),d("add").addEventListener("click",()=>Ot("wall")),d("gap").addEventListener("click",()=>Ot("gap")),d("floor").addEventListener("click",()=>Ot("floor")),d("door").addEventListener("click",()=>Ot("door")),m.addEventListener("click",W),d("remove").addEventListener("click",Ut),d("rotate").addEventListener("click",()=>{let P=qt();if(!P||P.kind==="floor")return;let D=Kn(.5,P),H=lt=>({x:D.x-(lt.z-D.z),z:D.z+(lt.x-D.x)});S(j(P,H(P.start),H(P.end)),"Turned 90 degrees."),s.focus({preventScroll:!0})}),p.addEventListener("click",()=>{tt(),yt(null),at=null,S(Z,"Wall edits reset."),s.focus({preventScroll:!0})}),g.addEventListener("click",()=>{ct&&(tt(),yt(null),nt=ct.walls,at=ct.selectedId,ct=null,C("Wall edit undone."),B(),s.focus({preventScroll:!0}))}),M.addEventListener("click",()=>{let P=M.getAttribute("aria-pressed")==="true";P&&!h.hidden&&T(!1),u.disabled=P});function rt(P,D,H,lt=null){ft={pointerId:P.pointerId,wall:D,x:H.x,z:H.z,end:lt,draft:nt},lt&&(ft.offsetX=D[lt].x-H.x,ft.offsetZ=D[lt].z-H.z),s.setPointerCapture(P.pointerId)}s.addEventListener("pointerdown",P=>{if(h.hidden||ft||!P.isPrimary||P.button!==0)return;let D=F(P);if(!D)return;if(P.preventDefault(),s.focus({preventScroll:!0}),It){b(D);return}let H=X(D,P.pointerType);at=H?.id??null,A.textContent=H?sl:"Choose a raised wall or a gap cover.",B(nt,!1),H&&H.kind!=="floor"&&rt(P,H,D)}),I.addEventListener("pointerdown",P=>{if(ft||!P.isPrimary||P.button!==0)return;let D=qt(),H=F(P);if(D?.kind!=="wall"||!H)return;P.preventDefault(),s.focus({preventScroll:!0}),rt(P,D,H);let lt=Kn(.5,D);ft.startAngle=Math.atan2(H.z-lt.z,H.x-lt.x)}),I.addEventListener("keydown",P=>{let D=qt();if(D?.kind!=="wall"||!["ArrowLeft","ArrowRight"].includes(P.key))return;P.preventDefault();let H=(P.key==="ArrowLeft"?-1:1)*(P.shiftKey?15:1);S(wt(D,Oe.degToRad(H)),"Wall rotated.")});for(let P of w)P.addEventListener("pointerdown",D=>{if(ft||!D.isPrimary||D.button!==0)return;let H=qt(),lt=F(D);!H||!lt||(D.preventDefault(),rt(D,H,lt,P.dataset.wallEnd))}),P.addEventListener("keydown",D=>{let H=cd[D.key],lt=qt();if(!H||!lt)return;D.preventDefault();let Et=P.dataset.wallEnd,vt=lt[Et];S(bt(lt,Et,{x:vt.x+H[0],z:vt.z+H[1]}),"Wall end moved.")});function pt(P){cancelAnimationFrame(Wt),Wt=requestAnimationFrame(()=>{Wt=0,B(P)})}s.addEventListener("pointermove",P=>{if(h.hidden||!P.isPrimary||!Nt&&!(It==="floor"&&Xt.length)&&ft?.pointerId!==P.pointerId)return;let D=F(P);if(D){if(It==="floor"){_(K(D,It));return}if(Nt){let H={id:"draft",kind:It,start:Nt,end:K(D,It),hidden:!1};pt(Zr(H)?[...nt,H]:nt);return}if(ft.draft=J(ft,D),c.dataset.dragging="true",ft.startAngle!==void 0){let H=ft.draft.find(Et=>Et.id===at),lt=Math.atan2(H.end.z-H.start.z,H.end.x-H.start.x);A.textContent="Wall angle "+(Math.round(Oe.radToDeg(lt))+360)%360+"\\xB0"}pt(ft.draft??nt)}}),s.addEventListener("pointerup",P=>{if(ft?.pointerId!==P.pointerId)return;let D=F(P),H=tt(),lt=H.startAngle!==void 0?"Wall rotated.":H.end?"Wall end moved.":"Wall moved.";S(D?J(H,D):H.draft,lt)});for(let P of["pointercancel","lostpointercapture"])s.addEventListener(P,D=>{ft?.pointerId===D.pointerId&&(tt(),B())});function Rt(){ft||It?(tt(),yt(null),A.textContent=sl,B()):T(!1)}return h.addEventListener("keydown",P=>{P.key==="Escape"&&(P.preventDefault(),Rt())}),U(),r(nt,null),{refreshHandles:L,floorRegions(){return nt.filter(P=>P.kind==="floor").map(P=>({shape:P.points.map(D=>new mt(D.x,D.z)),holes:[]}))},handleKey(P){if(h.hidden)return!1;if(P.key==="Escape")return P.preventDefault(),Rt(),!0;if((P.metaKey||P.ctrlKey)&&P.key.toLowerCase()==="z"&&ct)return P.preventDefault(),g.click(),!0;if(["PageUp","PageDown"].includes(P.key)){P.preventDefault(),yt(null);let lt=nt.filter(Mt=>!Mt.hidden),Et=P.key==="PageDown"?1:-1,vt=lt.findIndex(Mt=>Mt.id===at);return at=lt[(lt.length+(vt<0?Et>0?0:-1:vt+Et))%lt.length]?.id,B(nt,!1),!0}let D=qt(),H=cd[P.key];if(H){if(P.preventDefault(),D&&D.kind!=="floor"){let lt=rl(D);S(gt(D,lt.x*H[0]+lt.z*H[1]),"Wall moved.")}return!0}return P.key==="Delete"&&D?(P.preventDefault(),Ut(),!0):!1}}}var al=class{constructor(t,e){this.storage=t,this.key=e;try{this.record=JSON.parse(t.getItem(e))||{}}catch{this.record={}}}observe(t){let e=this.record,s=t.state==="cleaning"&&(["idle","docked"].includes(e.state)&&!e.continuing||t.minutes!=null&&e.minutes!=null&&t.minutes+1<e.minutes||e.job&&t.job&&t.job!==e.job&&Date.parse(t.job)<=Date.parse(t.stateSince)||!e.state&&Date.parse(t.mapTime)<Date.parse(t.stateSince)),r={state:t.state,route:t.route,minutes:t.minutes??e.minutes,job:t.job||e.job,continuing:t.state==="paused"||t.state==="returning"&&e.state==="paused",baseline:s?e.route??t.route:e.baseline};if(this.record=r,Object.keys(r).some(o=>e[o]!==r[o]))try{this.storage.setItem(this.key,JSON.stringify(r))}catch{}return r.baseline||""}};var fd;window.t90SetAppearance=i=>{let t=i==="night";document.documentElement.dataset.appearance=t?"night":"daylight",fd?.(t)};window.t90SetAppearance(window.frameElement.t90Map.appearance);var ge=document.querySelector(".viewer"),j_=document.querySelector(".notice"),zi=new Image,Bi=[...document.querySelectorAll("[data-camera]")],ll=document.querySelector(".dock-pin"),Kr=document.querySelector('[data-view="source"]'),ul=document.querySelector('[data-view="route"]');rd&&(document.title="Dreame 3D vacuum map",document.querySelector(".feed-label").textContent="Dreame map",document.querySelector('[data-camera="follow"]').textContent="Follow robot",document.querySelector(".device").setAttribute("aria-label","Vacuum map options"));var dl=new ns().parse(Xc),fl=dl.xml,[Q_,tx,pd,md]=fl.getAttribute("viewBox").split(/\\s+/).map(Number),cl=Q_+pd/2,hl=tx+md/2,ex=fl.firstElementChild,gd=dl.paths.filter(i=>i.userData.node.parentElement.classList.contains("o")),Jr=dl.paths.filter(i=>i.userData.node.parentElement===ex),nx=dl.paths.find(i=>i.userData.node.parentElement===fl&&i.userData.node.hasAttribute("transform"));function cn(i,t={}){return new Os({color:i,roughness:.82,...t})}function Be(i,t,e,n=0,s=0,r=0){let o=new on(t,e);return o.position.set(n,s,r),o.castShadow=!0,o.receiveShadow=!0,i.add(o),o}function ud(i,t,e,n,s=0){let r=new Us(i,{depth:n,bevelEnabled:!1,curveSegments:4});return r.rotateX(Math.PI/2),Be(t,r,e,0,s)}function ix(i){let t=new Map;for(let n of i)for(let s of n.subPaths){let r=s.getPoints(1);for(let o=1;o<r.length;o++){let a=r[o-1],c=r[o],l=c.clone().sub(a);if(l.lengthSq()<1e-6)continue;l.normalize(),(l.x<-1e-6||Math.abs(l.x)<1e-6&&l.y<0)&&l.negate();let h=new mt(-l.y,l.x),d=h.dot(a),u=[l.x,l.y,d].map(g=>Math.round(g*1e4)).join(","),p=t.get(u)??{direction:l,perpendicular:h,offset:d,spans:[]};p.spans.push([l.dot(a),l.dot(c)].sort((g,v)=>g-v)),t.set(u,p)}}let e=[];for(let{direction:n,perpendicular:s,offset:r,spans:o}of t.values()){let a=[];for(let[c,l]of o.sort((h,d)=>h[0]-d[0])){let h=a.at(-1);h&&c<=h[1]+1e-4?h[1]=Math.max(h[1],l):a.push([c,l])}for(let c of a)e.push(c.map(l=>n.clone().multiplyScalar(l).addScaledVector(s,r)))}return e}function dd(i){let t=[...fl.children].find(n=>n.localName==="use"&&n.getAttribute("href")===i);if(!t)return null;let e=new mt(Number(t.getAttribute("x")),Number(t.getAttribute("y")));return Number.isFinite(e.x)&&Number.isFinite(e.y)?e:null}function is(i,t){let e=Math.imul(i,374761393)+Math.imul(t,668265263);return e=Math.imul(e^e>>>13,1274126177),((e^e>>>16)>>>0)/4294967295}function Kc(i,t){let e=Math.floor(i),n=Math.floor(t),s=i-e,r=t-n,o=s*s*(3-2*s),a=r*r*(3-2*r),c=Oe.lerp(is(e,n),is(e+1,n),o),l=Oe.lerp(is(e,n+1),is(e+1,n+1),o);return Oe.lerp(c,l,a)}function sx(i){let r=new Uint8Array(4194304),o=new Uint8Array(r.length);for(let h=0;h<8;h++)for(let d=0;d<8;d++){let u=d*23+18,p=h*19+31,g=(is(u,p)-.5)*1.9+.66,v=Math.sin(g),m=Math.cos(g),f=(is(u+9,p)-.5)*12,w=is(u,p+9)*.84-.42;for(let I=0;I<128;I++)for(let x=0;x<128;x++){let M=((h*128+I)*1024+d*128+x)*4,A=Math.min(x,I,127-x,127-I);if(A===0){r.set([188,184,177,255],M),o.set([61,255,0,255],M);continue}let N=x/128-.5,y=I/128-.5,R=N*m+y*v,k=-N*v+y*m,Y=Kc(u+N*4,p+y*4)-.5,Z=Kc(u+N*15,p+y*15)-.5,it=Kc(u+R*9,p+k*7)-.5,G=k-w+Y*.37+Z*.042,et=Math.exp(-Math.abs(G)*12)*20,nt=Math.exp(-Math.abs(G+it*.017)*105)*22,st=Math.exp(-Math.abs(G+.07+it*.08)*53)*10,Q=244+f+Y*10+Z*3-et-nt-st-(A===1?12:0);r.set([Q,Q-1,Q-3,255],M),o.set([A===1?112:153,178+et*2,0,255],M)}}function a(h,d){let u=new ai(h,1024,1024);return u.colorSpace=d,u.wrapS=u.wrapT=Hn,u.repeat.setScalar(1/(13.5*8)),u.magFilter=Pe,u.minFilter=Sn,u.generateMipmaps=!0,u.anisotropy=Math.min(8,i.capabilities.getMaxAnisotropy()),u.needsUpdate=!0,u}let c=a(r,Ue),l=a(o,On);return new Tr({color:15724267,map:c,bumpMap:l,bumpScale:.105,roughnessMap:l,roughness:.67,clearcoat:.24,clearcoatRoughness:.29})}function _d(){let i=new qe,t=cn(2434087,{metalness:.2,roughness:.52}),e=cn(4012864,{metalness:.42,roughness:.32}),n=cn(7300704,{metalness:.38,roughness:.36}),s=cn(2368554,{metalness:.21,roughness:.4}),r=new Ze({color:16756065,toneMapped:!1});return Be(i,new ye(3.31,3.28,.36,64),t,0,.27),Be(i,new Er([[0,.38],[3.15,.38],[3.38,.49],[3.47,.62],[3.47,1.42],[3.39,1.64],[3.21,1.78],[0,1.78]].map(([a,c])=>new mt(a,c)),72),e),Be(i,new ye(3.2,3.2,.055,64),s,0,1.795),Be(i,new ci(3.07,.017,5,72),n,0,1.825).rotateX(Math.PI/2),Be(i,new ye(3.465,3.465,.035,72),n,0,.77),Be(i,new ui(1.38,.37,.21,2,.1),s,0,1.23,3.365),Be(i,new ui(.98,.04,.14,2,.02),r,0,1.84,2.16),i}function rx(i){let t=new Ps,e=new Xe(31,1.25,.1,80);e.position.set(3.6,5.2,10.9),e.lookAt(0,.93,0),t.add(_d(),new zs(13159124,5784372,2));let n=new Pi(16765865,3.6);n.position.set(-4,8,6),n.castShadow=!0,n.shadow.camera.left=n.shadow.camera.bottom=-6,n.shadow.camera.right=n.shadow.camera.top=6,n.shadow.mapSize.set(512,512),n.shadow.normalBias=.08,n.shadow.intensity=.65;let s=new Pi(13028060,2.4);s.position.set(4,3,-5);let r=Be(t,new In(200,200),new Fs({opacity:.44}));r.rotateX(-Math.PI/2),r.castShadow=!1,t.add(n,s),i.setPixelRatio(1),i.setSize(550,440,!1),i.render(t,e);let o=new Image;o.src=i.domElement.toDataURL(),o.alt="Illustrative 3D vacuum model",document.querySelector(".product").append(o);let a=new Set;t.traverse(c=>{c.isMesh&&(c.geometry.dispose(),a.add(c.material))});for(let c of a)c.dispose();n.shadow.dispose()}function ox(){let i=new Ps,t=new Ci(-1,1,1,-1,.1,1800),e=new $a({antialias:!0,alpha:!0});e.setClearColor(0,0),e.outputColorSpace=Ue,e.toneMapping=Nr,e.toneMappingExposure=1.18,e.shadowMap.enabled=!0,e.shadowMap.type=Ki,rx(e),e.setPixelRatio(Math.min(window.devicePixelRatio,2)),e.domElement.setAttribute("aria-label","Three-dimensional rendering of the vacuum floor map"),e.domElement.setAttribute("role","img"),e.domElement.tabIndex=0,ge.prepend(e.domElement);let n=new nl(t,e.domElement);n.enablePan=!1,n.minZoom=.65,n.maxZoom=5,n.maxPolarAngle=1.44;let s=dd("#c"),r=dd("#d"),o=s?new V(s.x-cl,10,s.y-hl):null,a=new V,c=()=>{},l=()=>{};function h(){if(e.render(i,t),c(),l(),!o||ge.classList.contains("show-source")||ge.parentElement.dataset.editing==="true"){ll.hidden=!0;return}a.copy(o).project(t);let ot=(a.x+1)*ge.clientWidth/2,Tt=(1-a.y)*ge.clientHeight/2;ll.hidden=ot<12||ot>ge.clientWidth-73||Tt<23||Tt>ge.clientHeight-23,ll.style.transform=\`translate(\${ot+13}px, \${Tt}px) translateY(-50%)\`}n.addEventListener("change",h);let d=new qe;d.position.set(-cl,0,-hl),i.add(d);let u=sx(e),p=cn(3156004),g=[u,p],v=ix(gd),m=[];for(let ot of Jr)for(let Tt of ot.toShapes()){let Dt=ud(Tt,d,g,6);Dt.userData.roomPath=ot.userData.node.getAttribute("d"),Dt.userData.baseMaterial=g,m.push(Dt)}let f=cn(9008995),w=cn(12955024),I=cn(14981720),x=cn(16762507,{emissive:7814163,emissiveIntensity:.18}),M=[f,f,w,f,f,f],A=[I,I,x,I,I,I],N=11.5,y=v,R=new Map,k=new Ze({color:13076818,transparent:!0,opacity:.63}),Y=cn(15065045),Z=cn(15788768),it=cn(12366759),G=cn(9206880,{metalness:.53});function et({kind:ot,start:Tt,end:Dt},Ht){if(ot==="wall")return new ui(Ht+.1,N,1.62,2,.24);let O=-(Dt.z-Tt.z)/Ht*2.2,ht=(Dt.x-Tt.x)/Ht*2.2,St=new wi([new mt(Tt.x+O,Tt.z+ht),new mt(Dt.x+O,Dt.z+ht),new mt(Dt.x-O,Dt.z-ht),new mt(Tt.x-O,Tt.z-ht)]);return new Us(St,{depth:6,bevelEnabled:!1}).rotateX(Math.PI/2)}function nt(ot){d.remove(ot),ot.traverse(Tt=>Tt.geometry?.dispose())}function st(ot){let Tt=ot.filter(Dt=>!Dt.hidden&&Dt.kind==="door");return ot.flatMap(Dt=>{if(Dt.hidden||Dt.kind!=="wall")return[Dt];let{start:Ht,end:O}=Dt,ht=O.x-Ht.x,St=O.z-Ht.z,kt=Math.hypot(ht,St),ee=ce=>((ce.x-Ht.x)*ht+(ce.z-Ht.z)*St)/kt,se=ce=>Math.abs((ce.x-Ht.x)*St-(ce.z-Ht.z)*ht)/kt,re=Tt.filter(ce=>se(ce.start)<=.42&&se(ce.end)<=.42).map(ce=>[ee(ce.start),ee(ce.end)].sort((Qe,$n)=>Qe-$n)).filter(([ce,Qe])=>ce<kt&&Qe>0).sort((ce,Qe)=>ce[0]-Qe[0]);if(!re.length)return[Dt];let he=ce=>({x:Ht.x+ht*ce/kt,z:Ht.z+St*ce/kt}),ve=[],pe=0;for(let[ce,Qe]of[...re,[kt,kt]])ce-pe>=.6&&ve.push({...Dt,id:Dt.id+":part:"+ve.length,sourceId:Dt.id,start:he(pe),end:he(ce)}),pe=Math.max(pe,Qe);return ve})}function Q(ot,Tt){let Dt=new Set,Ht=st(ot);ge.dataset.doorCutouts=String(new Set(Ht.map(O=>O.sourceId).filter(Boolean)).size);for(let O of Ht){if(O.hidden)continue;let{id:ht}=O;Dt.add(ht),at(O,ht===Tt||O.sourceId===Tt||ht==="draft")}for(let[O,ht]of R)Dt.has(O)||(nt(ht),R.delete(O))}function at(ot,Tt){let{id:Dt,kind:Ht,start:O,end:ht}=ot;if(Ht==="floor"){let re=ot.points.map(ce=>new mt(ce.x,ce.z)),he=re.map(ce=>ce.toArray().join(",")).join("|"),ve=R.get(Dt);if(ve?.userData.shape===he)return;ve&&nt(ve);let pe=ud(new wi(re),d,Dt==="draft"?k:g,6,Dt==="draft"?.08:-.082);pe.castShadow=!1,pe.userData.shape=he,R.set(Dt,pe);return}let St=Math.hypot(ht.x-O.x,ht.z-O.z);if(Ht==="door"){let re=R.get(Dt);if(!re||re.userData.shape!==St){re&&nt(re),re=new qe;let he=Math.min(.7,St/6);for(let ce of[-St/2+he/2,St/2-he/2])Be(re,new Pn(he,11.3,1.28),Z,ce,5.65,0);let ve=St-he*2,pe=new qe;pe.position.x=-St/2+he,pe.rotation.y=-1.03,re.add(pe),Be(pe,new Pn(ve,10.75,.51),Y,ve/2,5.6,0);for(let ce of[3.11,7.86])Be(pe,new ui(ve*.73,3.7,.095,1,.042),it,ve/2,ce,.283);Be(pe,new li(.3,12,8),G,ve*.86,5.65,.52),re.userData.shape=St,d.add(re),R.set(Dt,re)}re.position.set((O.x+ht.x)/2,0,(O.z+ht.z)/2),re.rotation.y=-Math.atan2(ht.z-O.z,ht.x-O.x);return}let kt=Ht==="gap"?[O.x,O.z,ht.x,ht.z].join(","):St,ee=Ht==="gap"?Dt==="draft"?k:g:Tt?A:M,se=R.get(Dt);if(se?se.userData.shape!==kt&&(se.geometry.dispose(),se.geometry=et(ot,St)):(se=Be(d,et(ot,St),ee),R.set(Dt,se)),se.userData.shape=kt,se.material=ee,Ht==="gap"){se.position.y=Dt==="draft"?.09:-.012,se.castShadow=!1;return}se.position.set((O.x+ht.x)/2,N/2-.1,(O.z+ht.z)/2),se.rotation.y=-Math.atan2(ht.z-O.z,ht.x-O.x)}let ct=new qe,ft=new Ze({color:12805412,toneMapped:!1,side:Fe}),It=new Ze({color:15242317,opacity:.24,transparent:!0,depthWrite:!1,toneMapped:!1,side:Fe}),Nt=0;function Xt(ot,Tt){for(let Ht of[...ct.children])ct.remove(Ht),Ht.geometry.dispose();Nt=0;let Dt=!!Tt;for(let[Ht,O]of(ot?.subPaths??[]).entries()){let ht=O.getPoints(1),St=Dt&&Tt.subPaths[Ht]?.getPoints(1);if(St){let kt=0;for(;kt<St.length&&kt<ht.length&&ht[kt].equals(St[kt]);)kt++;if(kt===ht.length)continue;Dt=!1,ht=ht.slice(Math.max(0,kt-1))}if(!(ht.length<2)){Nt+=ht.slice(1).filter((kt,ee)=>kt.distanceTo(ht[ee])>=.03).length;for(let[kt,ee,se]of[[1.95,It,.24],[.68,ft,.32]]){let re=ns.getStrokeStyle(kt,"#ffffff","round","round"),he=ns.pointsToStroke(ht,re,6,.03);if(!he)continue;he.rotateX(Math.PI/2);let ve=Be(ct,he,ee,0,se);ve.castShadow=!1}}}ge.dataset.traceSegments=String(Nt)}if(Xt(nx),d.add(ct),s){let ot=Be(d,new ci(4.25,.25,8,48),ft,s.x,.44,s.y);ot.rotateX(-Math.PI/2),ot.castShadow=!1;let Tt=new Ir(16756329,130,55,2);Tt.position.set(s.x-8,18,s.y-12),d.add(Tt)}let Wt=_d();d.add(Wt),Wt.visible=!!r,r&&Wt.position.set(r.x,0,r.y),s&&r&&s.distanceToSquared(r)<.25&&(document.querySelector(".device-state").textContent="At the dock in this scan");let qt=new Fs({opacity:.55}),z=Be(i,new In(1550,1550),qt,0,-7.1,0);z.rotation.x=-Math.PI/2,z.castShadow=!1;let U=new zs;i.add(U);let C=new Pi(16771800,2.5);C.position.set(-190,265,-142),C.castShadow=!0,C.shadow.camera.left=-262,C.shadow.camera.right=262,C.shadow.camera.top=218,C.shadow.camera.bottom=-218,C.shadow.camera.far=730,C.shadow.mapSize.set(2048,2048),C.shadow.normalBias=.32,C.shadow.bias=-5e-5,C.shadow.radius=2.7,C.shadow.autoUpdate=!1,C.shadow.needsUpdate=!0,i.add(C);let L=new Pi(12504037,.98);L.position.set(165,78,142),i.add(L);function B(){let ot=ge.clientWidth,Tt=ge.clientHeight,Dt=ot/Tt,Ht=Math.max(md*1.42,pd*1.15/Dt);t.left=-Ht*Dt/2,t.right=Ht*Dt/2,t.top=Ht/2,t.bottom=-Ht/2,t.updateProjectionMatrix(),e.setSize(ot,Tt,!1),h()}let tt=window.matchMedia("(prefers-reduced-motion: reduce)"),yt=s?new V(s.x-cl-10,0,s.y-hl+1):new V,T={floor:{offset:new V(106,282,243),target:new V(0,1,0),zoom:1},top:{offset:new V(0,430,.01),target:new V(0,1,0),zoom:1},follow:{offset:new V(76,205,155),target:new V,zoom:2.6},dock:{offset:new V(-122,205,196),target:yt,zoom:3.38}},X=0;function F(){cancelAnimationFrame(X),X=0,ge.dataset.cameraMotion="idle"}function K(){t.updateProjectionMatrix(),n.update()||h()}function j(ot,Tt=!1){F();let Dt=T[ot],Ht=Dt.offset.clone().add(Dt.target);for(let se of Bi)se.setAttribute("aria-pressed",String(se.dataset.camera===ot));if(ge.dataset.camera=ot,!Tt||tt.matches){t.position.copy(Ht),n.target.copy(Dt.target),t.zoom=Dt.zoom,K();return}let O=t.position.clone(),ht=n.target.clone(),St=t.zoom,kt=performance.now();ge.dataset.cameraMotion="moving";function ee(se){let re=Math.min((se-kt)/230,1),he=1-(1-re)**3;t.position.lerpVectors(O,Ht,he),n.target.lerpVectors(ht,Dt.target,he),t.zoom=Oe.lerp(St,Dt.zoom,he),K(),re<1?X=requestAnimationFrame(ee):F()}X=requestAnimationFrame(ee)}for(let ot of Bi)ot.addEventListener("click",Tt=>j(ot.dataset.camera,Tt.detail>0));ll.addEventListener("click",ot=>j("dock",ot.detail>0)),n.addEventListener("start",F);function gt(){X?j(ge.dataset.camera):h()}tt.addEventListener("change",gt),Kr.addEventListener("click",gt),ul.addEventListener("click",()=>{ct.visible=!ct.visible,ul.setAttribute("aria-pressed",String(ct.visible)),h()});let bt=document.querySelector("#map-help"),wt=bt.textContent,J=Bi[0].closest("nav"),S="floor";function Ut(ot){ot&&(C.shadow.needsUpdate=!0),h()}function Ot(ot,Tt){n.enabled=!ot,J.hidden=ot;for(let Dt of Bi)Dt.disabled=ot||ge.classList.contains("show-source");ot&&(S=ge.dataset.camera??"floor"),bt.textContent=ot?Tt:wt,B(),j(ot?"top":S)}let b=hd({segments:y,scannedFloors:Jr.flatMap(ot=>ot.toShapes().map(Tt=>Tt.getPoints(1).map(Dt=>({x:Dt.x,z:Dt.y})))),model:d,camera:t,canvas:e.domElement,positionWalls:Q,render:Ut,onEditing(ot){Ot(ot,"Edit walls, floors, and doorways over the saved Ecovacs scan.")}});c=b.refreshHandles;let _=ad({model:d,camera:t,canvas:e.domElement,floors:Jr,additionalFloors:b.floorRegions,addMesh:Be,makeMaterial:cn,marbleMap:u.map,render:Ut,onEditing(ot){Ot(ot,"Keyboard controls: Page Up or Page Down to select, arrow keys to move.")}}),W=document.getElementById("layout-lock"),rt=Bn+":locked",pt=document.querySelectorAll('[data-wall="edit"], [data-furnishing="edit"]');function Rt(ot){W.setAttribute("aria-pressed",String(ot)),W.textContent=ot?"Unlock layout":"Lock layout";for(let Tt of pt)Tt.hidden=ot;ge.dataset.layoutLocked=String(ot)}Rt(localStorage.getItem(rt)==="true"),W.onclick=()=>{let ot=ge.dataset.layoutLocked!=="true";localStorage.setItem(rt,String(ot)),Rt(ot)},l=_.refreshHandles,e.domElement.addEventListener("keydown",ot=>{if(_.handleKey(ot)||b.handleKey(ot))return;let Tt={ArrowLeft:-.12,ArrowRight:.12};ot.key in Tt&&(ot.preventDefault(),F(),t.position.sub(n.target).applyAxisAngle(new V(0,1,0),Tt[ot.key]).add(n.target),K());let Dt={"+":1.14,"=":1.14,"-":1/1.14};ot.key in Dt&&(ot.preventDefault(),F(),t.zoom=Oe.clamp(t.zoom*Dt[ot.key],n.minZoom,n.maxZoom),K())}),new ResizeObserver(B).observe(ge),B(),j("floor"),ge.dataset.rendered="true",ge.dataset.regions=String(Jr.length),ge.dataset.wallSegments=String(y.length),ge.dataset.traceSegments=String(Nt),ge.dataset.dock=String(!!s);let P=document.createElement("canvas");P.width=P.height=128;let D=P.getContext("2d"),H=D.createRadialGradient(64,64,12,64,64,64);H.addColorStop(0,"rgba(255,255,255,.88)"),H.addColorStop(.52,"rgba(255,255,255,.50)"),H.addColorStop(1,"rgba(255,255,255,0)"),D.fillStyle=H,D.fillRect(0,0,128,128);let lt=new qe;Wt.add(lt);let Et=Be(lt,new In(19,19),new Ze({map:new Yi(P),transparent:!0,depthWrite:!1,side:Fe,toneMapped:!1}),0,.53);Et.rotation.x=-Math.PI/2,Et.castShadow=!1;let vt=Be(lt,new wr(4.65,5.2,64),new Ze({color:6946802,side:Fe,toneMapped:!1,depthTest:!1}),0,.56);vt.rotation.x=-Math.PI/2,vt.renderOrder=3,vt.castShadow=!1,lt.visible=!1;let Mt=Qu({canvas:e.domElement,camera:t,floors:m,marble:u,side:p,viewer:ge,draw:h});fd=ot=>{U.color.setHex(ot?10267854:16773855),U.groundColor.setHex(ot?5917509:13020820),U.intensity=ot?.65:1.12,C.color.setHex(ot?13753594:16771532),C.intensity=ot?1.15:2.6,L.intensity=ot?.47:.72,f.color.setHex(ot?11116182:13811113),w.color.setHex(ot?14930620:15917514),u.color.setHex(ot?10989493:16183009),qt.opacity=ot?.32:.14,ft.color.setHex(ot?16760945:10831397),It.color.copy(ft.color),It.opacity=ot?.3:.11,vt.material.color.setHex(ot?16768929:13391143),Et.material.color.copy(vt.material.color),Et.material.opacity=ot?.94:.53,_.setLighting(ot),Mt(ot),h()},window.t90SetAppearance(window.frameElement.t90Map.appearance);let Pt=new al(localStorage,Bn+":trail"),Bt=ot=>ot&&/^[MmZzLlHhVvCcSsQqTtAaEe.,+\\s0-9-]+$/.test(ot)?new ns().parse('<svg xmlns="http://www.w3.org/2000/svg"><path transform="scale(0.2-0.2)" d="'+ot+'"/></svg>').paths[0]:null,$t,q=document.querySelector(".device-state"),Ct=document.querySelector(".feed-label"),xt,Lt;function Ft(){if(!xt)return;let ot=Date.now()-xt.received<25e3,Tt=new Date(xt.mapTime).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});Ct.textContent=ot?"Live tracking":"Tracking paused";let Dt=xt.state.replaceAll("_"," ");q.textContent=(ot?Dt[0].toUpperCase()+Dt.slice(1):"Last known position")+" \\xB7 Map "+Tt+(xt.xy?"":" \\xB7 Position unavailable"),ge.dataset.tracking=ot?"live":"paused"}if(window.deebotTrackingUpdate=ot=>{if(xt&&ot.received<=xt.received)return;let Tt=Pt.observe(ot);(ot.route!==Lt||Tt!==$t)&&(Xt(ot.route===Tt?null:Bt(ot.route),Bt(Tt)),Lt=ot.route,$t=Tt),Wt.visible=!!ot.xy,lt.visible=!0;let Dt=Bi.find(Ht=>Ht.dataset.camera==="follow");if(Dt.hidden=!ot.xy,ot.xy){Wt.position.set(ot.xy[0],0,ot.xy[1]);let Ht=T.follow.target.set(ot.xy[0]-cl,0,ot.xy[1]-hl);ge.dataset.camera==="follow"&&(F(),t.position.add(Ht.clone().sub(n.target)),n.target.copy(Ht),n.update())}else ge.dataset.camera==="follow"&&j("floor");ge.dataset.robotPosition=ot.xy?.join(",")??"",xt=ot,Ft(),h()},![Bn+":furniture",Bn+":walls"].some(ot=>localStorage.getItem(ot))){let ot=document.getElementById("layout-status");ot.textContent="Use Edit walls or Edit furnishings to customize your map.",ot.hidden=!1}Xt(null),Ct.textContent="Connecting",setInterval(Ft,3e3),s||(Bi.find(ot=>ot.dataset.camera==="dock").hidden=!0)}zi.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(Xc);zi.className="compare";zi.alt="Map with floor outlines, dock, and saved cleaning path";zi.hidden=!0;ge.prepend(zi);Kr.addEventListener("click",()=>{let i=zi.hidden;zi.hidden=!i,ge.classList.toggle("show-source",i),Kr.setAttribute("aria-pressed",String(i)),Kr.textContent=i?"Back to 3D":"Original scan";for(let t of Bi)t.disabled=i;ul.disabled=i});try{if(!Jr.length||!gd.length)throw new Error("Missing vector floor or wall paths");ox()}catch(i){console.error(i),j_.hidden=!1,zi.hidden=!1,ge.classList.add("show-source");for(let t of[...Bi,ul,Kr,...document.querySelectorAll("[data-furnishing], [data-wall]")])t.disabled=!0}document.getElementById("export-layout").onclick=()=>{let i=[Bn+":furniture",Bn+":walls"],t=Object.fromEntries(i.filter(s=>localStorage.getItem(s)).map(s=>[s,JSON.parse(localStorage.getItem(s))])),e=URL.createObjectURL(new Blob([JSON.stringify(t)],{type:"application/json"})),n=document.createElement("a");n.href=e,n.download="deebot-room-layout.json",n.click(),setTimeout(()=>URL.revokeObjectURL(e),2e3)};})();
<\/script>
</body>
</html>
`;var G=["#adc3ce","#e1caa6","#bed2ba","#dfbdb5","#cebfda","#b0cccb"];function et(r){let i=2166136261,e=5381;for(let n=0;n<r.length;n++)i=Math.imul(i^r.charCodeAt(n),16777619),e=Math.imul(e,33)^r.charCodeAt(n);return(i>>>0).toString(36)+"-"+(e>>>0).toString(36)}function F(r,i,e,n,s,t=""){let o=(a,u)=>u?'<use href="#'+a+'" x="'+u[0]+'" y="'+u[1]+'"/>':"";return{svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="'+r.join(" ")+'"><g>'+i.map((a,u)=>'<path fill="'+G[u%G.length]+'" d="'+a+'"/>').join("")+'</g><g class="o" stroke="#534b45" fill="none">'+e.map(a=>'<path d="'+a+'"/>').join("")+'</g><defs><circle id="c" r="2" fill="#5dd9ce"/><circle id="d" r="2" fill="#ea9853"/></defs>'+(t?'<path fill="none" stroke="white" transform="scale(0.2-0.2)" d="'+t+'"/>':"")+o("c",s)+o("d",n)+"</svg>",paths:i,overlay:{xy:n,route:t},geometryId:et(JSON.stringify([r,[...i].sort(),[...e].sort()]))}}function W(r,i,e){let n=[1,i,-1,-i],s=[];for(;r.size;){let t=r.values().next().value,o=Math.floor(t/4),l=o,a=t%4,u="M"+o%i*e+" "+Math.floor(o/i)*e;do{if(r.delete(l*4+a),l+=n[a],l===o)break;let _=[(a+1)%4,a,(a+3)%4].find(h=>r.has(l*4+h));if(_===void 0)throw Error("Incomplete Dreame room outline.");_!==a&&(u+=a%2?"V"+Math.floor(l/i)*e:"H"+l%i*e),a=_}while(l!==o);s.push(u+"Z")}return s.join("")}var it=[137,80,78,71,13,10,26,10],rt=new TextDecoder("utf-8",{fatal:!0}),nt=8*1024*1024,X=1e6;async function N(r,i=nt){if(!r)throw Error("The map camera returned no image.");let e=r.getReader(),n=[],s=0;try{for(;;){let{done:l,value:a}=await e.read();if(l)break;if(s+=a.length,s>i)throw await e.cancel(),Error("This floor exceeds the map size limit.");n.push(a)}}finally{e.releaseLock()}let t=new Uint8Array(s),o=0;for(let l of n)t.set(l,o),o+=l.length;return t}async function z(r){if(!it.every((n,s)=>r[s]===n))throw Error("Select the Valetudo MQTT Map data camera.");let i=new DataView(r.buffer,r.byteOffset,r.byteLength),e="ValetudoMap";for(let n=8;n+12<=r.length;){let s=i.getUint32(n),t=n+8,o=t+s;if(o+4>r.length)throw Error("Incomplete PNG from the map camera.");let l=String.fromCharCode(...r.subarray(n+4,t));if(l==="IEND")break;if(l==="zTXt"&&s>e.length+2&&e.split("").every((a,u)=>r[t+u]===a.charCodeAt(0))&&r[t+e.length]===0&&r[t+e.length+1]===0){let a=new Blob([r.subarray(t+e.length+2,o)]),u=await N(a.stream().pipeThrough(new DecompressionStream("deflate")));return JSON.parse(rt.decode(u))}n=o+4}throw Error("This camera image has no ValetudoMap field. Choose the MQTT Map data camera.")}function B(r){let i=r?.pixelSize;if(r?.metaData?.version!==2||!Number.isFinite(i)||i<=0||!Array.isArray(r.layers)||!Array.isArray(r.entities))throw Error("Expected a Valetudo v2 map.");let e=Math.ceil(r.size?.x/i),n=Math.ceil(r.size?.y/i);if(![e,n].every(d=>Number.isSafeInteger(d)&&d>0))throw Error("Invalid Valetudo map dimensions.");let s=r.layers.filter(d=>["floor","wall","segment"].includes(d?.type)),t={floor:0,segment:1,wall:2};s.sort((d,p)=>t[d.type]-t[p.type]);let o=1/0,l=1/0,a=0,u=0,_=0;for(let d of s){let p=d.compressedPixels;if(!Array.isArray(p)||p.length%3)throw Error("Invalid Valetudo pixel runs.");for(let y=0;y<p.length;y+=3){let v=p[y],M=p[y+1],w=p[y+2];if(![v,M,w].every(Number.isSafeInteger)||v<0||M<0||w<1||v+w>e||M>=n)throw Error("Pixel run outside the Valetudo map.");_+=w,o=Math.min(o,v),l=Math.min(l,M),a=Math.max(a,v+w),u=Math.max(u,M+1)}}let h=a-o,x=u-l,c=h+1;if(!Number.isFinite(h)||h*x>X||_>X*4||s.length>1e3)throw Error("The mapped area is empty or too large.");let f=new Uint16Array(h*x),g=65535;s.forEach((d,p)=>{let y=d.type==="wall"?g:d.type==="floor"?1:p+2,v=d.compressedPixels;for(let M=0;M<v.length;M+=3){let w=(v[M+1]-l)*h+v[M]-o;f.fill(y,w,w+v[M+2])}});let A=new Map;for(let d=0;d<x;d++)for(let p=0;p<h;p++){let y=d*h+p,v=f[y];if(!v)continue;A.has(v)||A.set(v,new Set);let M=A.get(v),w=d*c+p;(!d||f[y-h]!==v)&&M.add(w*4),(p===h-1||f[y+1]!==v)&&M.add((w+1)*4+1),(d===x-1||f[y+h]!==v)&&M.add((w+c+1)*4+2),(!p||f[y-1]!==v)&&M.add((w+c)*4+3)}let E=[],S=[],b=i/5;for(let[d,p]of A)(d===g?S:E).push(W(p,c,b));if(!E.length||!S.length)throw Error("Waiting for a mapped floor and wall layer.");let D=(d,p)=>[d/5-o*b,p/5-l*b],O=d=>{let p=r.entities.find(y=>y?.type===d)?.points;return Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)?D(...p):null},P=[];for(let d of r.entities)if(!(d?.type!=="path"||!Array.isArray(d.points)||d.points.length%2||d.points.length<4||!d.points.every(Number.isFinite)))for(let p=0;p<d.points.length;p+=2){let[y,v]=D(d.points[p],d.points[p+1]);P.push((p?"L":"M")+y*5+" "+-v*5)}let T=O("charger_location"),R=F([0,0,h*b,x*b],E,S,O("robot_position"),T,P.join(""));return R.geometryId+=":"+[o,l,i,T?.join(",")].join(":"),R}var U={dreame:{title:"Dreame 3D Map (beta)",map:"Current Dreame floor map camera",required:!0,platforms:["dreame_vacuum"],hint:"Choose the current floor camera registered to this Dreame vacuum. Saved maps and history cameras cannot provide a live floor."},switchbot:{title:"SwitchBot Vacuum",map:"Optional map image or camera",platforms:["switchbot_cloud","switchbot_vacuum"],hint:"Controls work without a map. Choose an existing image for a 2D view, or keep your hand-drawn floor plan in YAML."},controls:{title:"Vacuum Controls",map:"Optional map image or camera",hint:"Controls work without a map. A Roomba+ Rooms Map image can supply 3D outlines. Other images and cameras display in 2D."},valetudo:{title:"Valetudo 3D Map",map:"MQTT Map data camera",required:!0,platforms:["mqtt"],hint:"Choose the Map data camera on the same MQTT device as the vacuum. The 3D viewer needs a PNG with embedded Valetudo map data."}},at={vacuum:"Vacuum available",source:"Map source",rendered:"Map preview",room:"Room cleaning",controls:"Vacuum controls",suction:"Suction settings",position:"Robot position",trail:"Cleaning path"},j={dreame_vacuum:"Dreame Vacuum",mqtt:"MQTT",switchbot_cloud:"SwitchBot Cloud",switchbot_vacuum:"SwitchBot Vacuum",roomba:"Roomba",roomba_plus:"Roomba+",sharkiq:"Shark IQ",xiaomi_miio:"Xiaomi Miio",matter:"Matter"},st=new Set(["Floor Cleaning Robot S10","Mini Robot Vacuum K10+","Mini Robot Vacuum K10+ Pro","Dreame L40s Pro Ultra","L40s Pro Ultra","L10s Ultra","Roomba 980","Braava jet m6","Shark IQ RV1001AE","Mi Robot Vacuum","dreame.vacuum.r9419a","dreame.vacuum.r9419e","dreame.vacuum.r9419h","dreame.vacuum.r9419t"]),L=r=>r?"Detected":"Not detected",C=r=>!!(r&&!["unknown","unavailable",""].includes(r.state)),k="display:grid;gap:10px;font:inherit;color:var(--primary-text-color,inherit)",I="color:inherit;background:var(--card-background-color,transparent);border:1px solid var(--divider-color,#828282);border-radius:8px;padding:9px 12px;font:inherit;max-width:100%",ot=new WeakMap,q={start:"Start",pause:"Pause",stop:"Stop",return_to_base:"Go home",clean_spot:"Spot clean",locate:"Locate",set_fan_speed:"Suction setting",vacuum_clean_segment:"Clean rooms",clean_rooms:"Clean rooms",clean_room:"Clean rooms"},lt={start:"cleaning",clean_room:"cleaning",clean_rooms:"cleaning",vacuum_clean_segment:"cleaning",pause:"paused",return_to_base:"returning"};function Y(r,i){let e=ot.get(r);if(!e||e.entity!==i)return"None observed";let n=Object.hasOwn(q,e.action)?q[e.action]:"Setting or station action";if(e.result==="pending")return n+" \xB7 awaiting Home Assistant";if(e.result==="rejected")return n+" \xB7 request failed";let s=lt[e.action];return s&&r.h?.connected!==!1&&r.h?.connection?.connected!==!1&&s!==e.before&&r.h?.states?.[i]?.state===s&&(e.observed=!0),n+(e.observed?" \xB7 expected state reported by Home Assistant":" \xB7 accepted by Home Assistant")+" \xB7 physical result unconfirmed"}function Z(r,i,e,n={},s="None observed"){let t=U[r],o=e.entity,l=e.map_entity,a=i?.entities||{},u=i?.states||{},_=a[o]?.platform,h=i&&i.connected!==!1&&i.connection?.connected!==!1,x=a[o]?.device_id,c=x&&x===a[l]?.device_id,f=C(u[l])&&(!t.required||c),g="Optional \xB7 none selected";e.floor_plan?g="Custom floor plan":l?g=C(u[l])&&t.required&&!c?"Device pairing unconfirmed":L(f):t.required&&(g="Required \xB7 choose a camera");let A=r!=="valetudo"&&h&&C(u[o])&&(!t.platforms||!_||t.platforms.includes(_)),E=(T,R)=>A&&!!i.services?.vacuum?.[T]&&u[o].attributes?.supported_features&R,S=[["Start","start",8192],["Pause","pause",4],["Stop","stop",8],["Go home","return_to_base",16]];r==="controls"&&S.push(["Locate","locate",512],["Spot clean","clean_spot",1024]);let b=S.filter(([,T,R])=>E(T,R)).map(([T])=>T),D=i?.devices?.[x]?.model,O={vacuum:L(h&&C(u[o])),source:g,rendered:n.map3d?"3D floor available":n.map2d?"2D image view available":l||e.floor_plan?"Awaiting map in dashboard":"No map selected",controls:r==="valetudo"?"Map viewer only":b.join(", ")||"Not detected",suction:r==="valetudo"?"Map viewer only":L(E("set_fan_speed",32)&&u[o]?.attributes?.fan_speed_list?.length),room:r==="valetudo"?"Map viewer only":!t.required&&!e.room_selection?"Off in card":L(n.rooms),position:L(n.position),trail:L(n.trail)},P=i?.config?.version;return["Card: "+t.title,"Card version: 0.3.0-beta.7","Model: "+(st.has(D)?D:"Unconfirmed"),"Integration: "+(Object.hasOwn(j,_)?j[_]:"Unidentified"),"Home Assistant: "+(typeof P=="string"&&/^\d{4}\.\d{1,2}\.\d{1,3}(?:[ab]\d{1,2})?$/.test(P)?P:"Not reported"),...Object.entries(O).map(([T,R])=>at[T]+": "+R),"Last command: "+s].join(`
`)}function m(r,i){let e=document.createElement(r);return i&&(e.textContent=i),e}function K(r){let i=m("details");i.style.cssText="margin:8px 0;padding:12px;border-top:1px solid var(--divider-color,#8885);font:inherit";let e=m("summary","Test details");e.style.cssText="cursor:pointer;padding:5px 0";let n=m("div");n.style.cssText=k;let s=m("small","Review the details below before sharing. Copy includes only these capability checks."),t=m("textarea");t.readOnly=!0,t.rows=10,t.setAttribute("aria-label","Compatibility details"),t.style.cssText=I+";width:100%;box-sizing:border-box;resize:vertical";let o=m("button","Copy test details");o.type="button",o.style.cssText=I+";justify-self:start";let l=m("span");l.setAttribute("role","status");let a=!1,u=()=>{t.value=r(),a=!0,l.textContent=""},_=()=>{i.open&&!a&&u()};i.addEventListener("toggle",()=>{i.open?u():a=!1});let h=m("button","Refresh test details");return h.type="button",h.style.cssText=I+";justify-self:start",h.onclick=u,o.onclick=async()=>{_();let x=t.value;try{if(!navigator.clipboard?.writeText)throw Error();await navigator.clipboard.writeText(x),l.textContent="Copied."}catch{t.focus(),t.select();let c=!1;try{c=document.execCommand("copy")}catch{}l.textContent=c?"Copied.":"Details selected. Use your device\u2019s Copy command."}},n.append(s,t,o,h,l),i.append(e,n),i.update=_,i}function J(r,i,e,n,s){let t=K(()=>Z(e,r.h,n()||{},s?.(),Y(r,n()?.entity))),o=t.update;return t.update=()=>{Y(r,n()?.entity),o()},i.append(t),t}async function ht(r,i,e,n,s){let t=i.map_entity,o=e.entities?.[i.entity]?.device_id;if(!C(e.states?.[i.entity])||e.connected===!1||e.connection?.connected===!1||U[r].required&&(!o||o!==e.entities?.[t]?.device_id||r==="valetudo"&&[e.entities[i.entity],e.entities[t]].some(g=>g.platform!=="mqtt")))throw Error();let l=i.floor_plan||n?.floor?.(e,i.entity,t);if(l){let g=m("switchbot-floorplan-beta");return g.plan=l,{view:g,info:{map3d:!0}}}if(!/^(image|camera)\.[a-z0-9_]+$/.test(t)||!C(e.states[t]))throw Error();let a=r==="dreame"?"/api/camera_map_data_proxy/":t.startsWith("image.")?"/api/image_proxy/":"/api/camera_proxy/",u=await e.fetchWithAuth(a+t,{cache:"no-store",signal:s});if(!u.ok)throw Error();let _=await N(u.body,r==="dreame"?4e6:8*1024*1024),h=n?.parse?await n.parse(_,e.states[t]?.attributes):null,x;if(h)x=new Blob([h.svg],{type:"image/svg+xml"});else{let g=u.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();if(!["image/png","image/jpeg","image/webp","image/gif","image/svg+xml"].includes(g))throw Error();x=new Blob([_],{type:g})}let c=URL.createObjectURL(x),f=m("img");f.style.cssText="display:block;width:100%;height:155px;object-fit:contain",f.alt=h?"Floor outline from the selected map":"Preview of the selected map",f.src=c;try{await f.decode()}catch{throw URL.revokeObjectURL(c),Error()}return{view:f,url:c,info:{map3d:!!h,map2d:!h,position:!!h?.overlay?.xy,trail:!!h?.overlay?.route,rooms:r==="dreame"&&h?.labels?.size>0&&!!e.services?.dreame_vacuum?.vacuum_clean_segment}}}function ct(r,i){let e=U[r];return class extends HTMLElement{constructor(){super(),this.attachShadow({mode:"open"})}setConfig(n){this.config={...n},this.render()}set hass(n){this.h=n,this.render()}disconnectedCallback(){this.clearPreview(),this.signature=null}connectedCallback(){this.render()}clearPreview(){this.request?.abort(),this.request=null,this.previewURL&&URL.revokeObjectURL(this.previewURL),this.previewURL=null,this.info={}}async preview(n,s,t){this.clearPreview(),s.replaceChildren();let o=this.request=new AbortController,l=setTimeout(()=>o.abort(),1e4);n.disabled=!0,t.textContent="Reading the selected map\u2026";try{let a=await ht(r,this.config,this.h,i,o.signal);if(this.request!==o||o.signal.aborted){if(a.url&&URL.revokeObjectURL(a.url),this.request===o)throw Error();return}if(this.previewURL=a.url,s.replaceChildren(a.view),a.view.localName==="switchbot-floorplan-beta"&&!a.view.renderer)throw s.replaceChildren(),Error();this.info=a.info,t.textContent=a.info.map2d?"2D map image available.":"Floor layout available for 3D rendering."}catch{this.request===o&&(t.textContent="Map preview unavailable. Check the selected source and device in Home Assistant.")}finally{clearTimeout(l),this.request===o&&(this.request=null,n.disabled=!1,this.report?.update())}}change(n,s){let t={...this.config};s===""?delete t[n]:t[n]=s,n==="entity"&&s!==this.config.entity&&e.required&&delete t.map_entity,this.config=t,this.render(),this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:t},bubbles:!0,composed:!0}))}render(){if(!this.h||!this.config)return;let n=this.h.states||{},s=this.h.entities||{},t=this.config,o=Object.keys(n).sort(),l=s[t.entity]?.device_id,a=o.filter(c=>c.startsWith("vacuum.")&&(!e.platforms||!s[c]?.platform||e.platforms.includes(s[c].platform))),u=o.filter(c=>(e.required?c.startsWith("camera."):/^(image|camera)\./.test(c))&&(!e.required||!l||!s[c]?.device_id||l===s[c].device_id)),_=JSON.stringify([t.entity,t.map_entity,!!t.floor_plan,t.room_selection,l,s[t.map_entity]?.device_id,s[t.entity]?.platform,s[t.map_entity]?.platform,this.h.connected!==!1&&this.h.connection?.connected!==!1,C(n[t.entity]),C(n[t.map_entity]),[...new Set([...a,...u,t.entity,t.map_entity])].filter(Boolean).map(c=>[c,n[c]?.attributes?.friendly_name]),a,u]);if(_===this.signature){this.report?.update();return}this.signature=_,this.clearPreview();let h=m("div");h.style.cssText=k;let x=(c,f,g,A)=>{let E=m("label");E.style.cssText=k;let S=m("select");S.style.cssText=I,S.dataset.field=c,S.add(new Option(A,""));for(let b of new Set([...g,...t[c]?[t[c]]:[]]))S.add(new Option((n[b]?.attributes?.friendly_name||b)+(n[b]?.attributes?.friendly_name?" \xB7 "+b:""),b));S.value=t[c]||"",S.onchange=()=>this.change(c,S.value),E.append(m("span",f),S),h.append(E)};if(x("entity","1. Choose your vacuum",a,"Choose a vacuum"),h.append(m("small",e.hint)),t.floor_plan&&!e.required?h.append(m("p","Your YAML floor plan is active. Remove floor_plan in YAML to use a map entity.")):x("map_entity","2. "+e.map,u,e.required?"Choose a camera":"Continue without a map"),!e.required){let c=m("label"),f=m("input");f.type="checkbox",f.checked=t.room_selection===!0,f.onchange=()=>this.change("room_selection",f.checked),c.append(f,document.createTextNode(" Enable room selection when supported")),h.append(c)}if(t.entity&&(t.map_entity||t.floor_plan)){let c=m("button","Preview selected map");c.type="button",c.style.cssText=I+";justify-self:start";let f=m("div"),g=m("small");g.setAttribute("role","status"),c.onclick=()=>this.preview(c,f,g),h.append(c,g,f)}else!e.required&&t.entity?h.append(m("small","Ready to save as a controls-only card.")):h.append(m("small","Choose the vacuum and its map to preview the floor."));this.report=K(()=>Z(r,this.h,this.config,this.info)),h.append(this.report),this.shadowRoot.replaceChildren(h)}}}function $(r,i,e=i+"-editor",n){return customElements.get(e)||customElements.define(e,ct(r,n)),window.customCards??=[],window.customCards.some(s=>s.type===i)||window.customCards.push({type:i,name:U[r].title,description:U[r].hint}),e}var ut=$("valetudo","valetudo-map-card",void 0,{parse:async r=>B(await z(r))});function Q(r){return r&&!["unknown","unavailable"].includes(r.state)}var V=class extends HTMLElement{static getConfigElement(){return document.createElement(ut)}static getStubConfig(){return{}}constructor(){super();let i=this.attachShadow({mode:"open"});i.innerHTML='<style>:host{display:block}ha-card{display:block;overflow:hidden}.status{margin:0;padding:14px;color:var(--primary-text-color);font:inherit}.status:empty{display:none}iframe{display:block;border:0;width:100%;height:clamp(390px,58vh,620px)}[hidden]{display:none!important}</style><ha-card><p class="status" role="status"></p><div></div></ha-card>',this.message=i.querySelector(".status"),this.slotBox=i.querySelector("div"),this.report=J(this,i.querySelector("ha-card"),"valetudo",()=>({entity:this.config?.entity,map_entity:this.config?.camera}),()=>{let e=this.frame&&!this.frame.hidden;return{map3d:e,position:e&&this.sample?.xy,trail:e&&this.sample?.route}})}setConfig(i){if(i.entity&&!/^vacuum\.\w+$/.test(i.entity)||i.map_entity&&!/^camera\.\w+$/.test(i.map_entity))throw Error("Set entity to your MQTT vacuum and map_entity to its Map data camera.");let e={entity:i.entity,camera:i.map_entity,appearance:i.appearance==="night"?"night":"daylight"};(this.config?.entity!==e.entity||this.config?.camera!==e.camera)&&this.reset(),this.config=e,this.frame?.contentWindow?.t90SetAppearance?.(e.appearance),this.check(),this.report.update()}set hass(i){this.h=i,this.check(),this.report.update()}getCardSize(){return 8}connectedCallback(){this.timer=setInterval(()=>this.check(!0),5e3),this.check()}disconnectedCallback(){clearInterval(this.timer),this.reset()}reset(){this.request?.abort(),this.request=null,this.source=null,this.previous=null,this.frame=null,this.sample=null,this.shape=null,this.slotBox.replaceChildren()}check(i=!1){if(!this.config||!this.isConnected||!this.h)return;let{entity:e,camera:n}=this.config,s=this.h,t=s.entities?.[e],o=s.entities?.[n];if(s.connected===!1||!Q(s.states[e])||!Q(s.states[n])||!t?.device_id||t.device_id!==o?.device_id||t.platform!=="mqtt"||o.platform!=="mqtt"){(this.source||this.request)&&this.reset(),this.message.textContent=s.connected===!1?"Home Assistant is disconnected.":"Choose an available MQTT vacuum and Map data camera on the same device.";return}let l=t.device_id,a=this.source!==l;a&&(this.reset(),this.source=l,this.message.textContent="Loading the Valetudo map\u2026"),(a||i)&&!this.request&&!document.hidden&&this.load()}async load(){let i=this.request=new AbortController,e=setTimeout(()=>i.abort(),1e4);try{let n=await this.h.fetchWithAuth("/api/camera_proxy/"+this.config.camera,{cache:"no-store",signal:i.signal});if(!n.ok)throw Error("Map camera returned HTTP "+n.status+".");let s=await N(n.body);if(i!==this.request)return;if(this.previous?.length===s.length&&s.every((a,u)=>a===this.previous[u])){this.message.textContent="",this.frame&&(this.frame.hidden=!1);return}let t=B(await z(s));if(i!==this.request)return;this.previous=s;let o=this.h.states[this.config.entity],l=Date.now();if(this.sample={...t.overlay,state:o.state,stateSince:o.last_changed,mapTime:l,received:l},this.shape!==t.geometryId){this.shape=t.geometryId;let a=document.createElement("iframe");a.title="Valetudo 3D floor map",a.t90Map={scan:t.svg,scope:["valetudo",this.config.entity,this.config.camera,this.shape].join(":"),appearance:this.config.appearance},a.addEventListener("load",()=>{this.frame===a&&a.contentWindow?.deebotTrackingUpdate?.(this.sample)}),this.frame=a,a.srcdoc=H,this.slotBox.replaceChildren(a)}else this.frame.contentWindow?.deebotTrackingUpdate?.(this.sample);this.frame.hidden=!1,this.message.textContent=""}catch(n){if(i!==this.request)return;this.frame&&(this.frame.hidden=!0),this.message.textContent=i.signal.aborted?"Map camera timed out.":n.message||"Could not read the Valetudo map."}finally{this.report.update(),clearTimeout(e),this.request===i&&(this.request=null)}}};customElements.get("valetudo-map-card")||customElements.define("valetudo-map-card",V);
