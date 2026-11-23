# T90 3D Map Card

Turn your Ecovacs Deebot T90’s own map into an editable 3D floor plan in Home Assistant. Tap rooms to choose where to clean, see the target on the Start button, and follow the robot and its cleaning path. The screenshots below show a fictional four-room home running the actual card.

![T90 dashboard showing the robot, a furnished 3D floor plan, and Kitchen and Living room selected](docs/dashboard.png)

## Before installing

- Connect your T90 through the [Home Assistant Ecovacs integration](https://www.home-assistant.io/integrations/ecovacs/). Finish mapping at least one room in the Ecovacs app.
- Find the vacuum and its **map image** under **Settings → Devices & services → Ecovacs → your Deebot**. Enable the map image entity if it is disabled. You need a `vacuum.*` entity and an `image.*` entity that serves the Ecovacs SVG vector map.
- Use a dashboard managed through the Home Assistant UI to save room assignments or share a furnished layout across devices. Saving requires permission to edit that dashboard. Use a browser with WebGL 2 for the 3D view.

## Install with HACS

1. Open **HACS → ⋮ → Custom repositories**. Paste `https://github.com/gdelagardelle/t90-map-card` and choose **Dashboard** as the type.
2. Add the repository, open **T90 3D Map Card**, and download it. Reload your dashboard.
3. Edit your dashboard and select **Add card → T90 3D Map**. Pick your vacuum and its map image from the two dropdowns.

This repository can be added directly to HACS. [HACS custom repository instructions](https://www.hacs.xyz/docs/faq/custom_repositories/)

## Manual install

1. Download [the built JavaScript module](https://raw.githubusercontent.com/gdelagardelle/t90-map-card/main/dist/t90-map-card.js) and place it at `config/www/t90-map-card.js`.
2. In **Settings → Dashboards → ⋮ → Resources**, add `/local/t90-map-card.js` as a **JavaScript module**. Enable Advanced Mode in your user profile if Resources is hidden. Reload the page.
3. Use the visual editor or add a manual card with your own entity IDs.

```yaml
type: custom:t90-map-card
entity: vacuum.my_deebot
map_entity: image.my_deebot_map
```

| Option | What to select |
| --- | --- |
| `entity` | The T90 vacuum you want the buttons to control |
| `map_entity` | The Ecovacs map image for the same device |

Both fields are required. No token or external map URL is needed. For a second robot, add another card and select that device’s vacuum and image.

## Clean rooms

Tap a room on the floor. On the first tap, choose its Ecovacs room name and select **Save room**. Repeat for each room you want to target. Once a room is matched, tapping it toggles its highlight. You can also select rooms under **Choose rooms**.

Read the Start button before tapping it. **Start · Kitchen + Living room** sends those two room IDs. **Start · Whole home** starts a whole-home clean. Tapping the map alone never starts the robot. While paused, **Resume** continues the existing job. **Change a map room name** lets you correct an assignment.

The glowing marker follows the latest reported position. The card checks the map while the dashboard is visible. Update speed depends on how often the integration publishes a new image. A new observed cleaning run masks the previous run’s path. Settings, dock actions, and maintenance readings depend on which entities the integration exposes and enables for your device.

## Edit your floor plan

| Gesture | Result |
| --- | --- |
| **Edit walls**, then select a wall | Shows its length in map units and its angle |
| Drag the round ↻ handle | Rotates the wall around its midpoint |
| Drag either endpoint | Changes the wall’s length while anchoring its opposite end |
| Drag the wall itself | Moves the wall sideways, taking connected edges and attached doors with it |
| **Add wall**, **Add door**, or **Cover gap** | Tap the start and end points on the map |
| **Add floor** | Tap around the boundary, then choose **Finish floor** |
| **Edit furnishings → Add furniture** | Choose an item and tap its position |
| Drag a piece, its corner, or its ↻ handle | Moves, resizes, or rotates the furnishing |
| **Done → Lock layout** | Hides geometry editing on this browser and leaves room selection available |

Lengths use the map’s coordinate system. Physical calibration is deferred. Edits customize the dashboard drawing. The robot continues to navigate with its Ecovacs map. New installations start with an unfurnished floor.

![Wall editor with a selected wall, endpoint grips, a rotation handle, and a length and angle readout](docs/wall-editor.png)

![Furniture editor with corner grips and a rotation handle on a kitchen cabinet](docs/furniture-editor.png)

### Save and restore

Edits are saved in the current browser. To share them with other browsers on the same dashboard, open **Room layout → Save this layout to the dashboard**. **Export layout file** downloads your wall and furnishing edits. Import the file on the same vacuum and map configuration. Exported files contain layout information, so share them only with people you intend to give it to.

Saved edits and room assignments are scoped to the configured vacuum, map image and detected floor geometry. A remap that changes the floor geometry starts a separate layout and room matching session. Renaming the configured entity IDs also changes the storage scope. Use one card for each vacuum/map pair on a storage dashboard if you want the card to write its layout there.

## Compatibility

The first version targets the Deebot T90 map format from Home Assistant’s Ecovacs integration. The public module has browser tests with fictional devices and floor plans, and has rendered a real T90 SVG. A second physical household installation is still unverified.

Other robots can expose standard [Home Assistant vacuum actions](https://www.home-assistant.io/integrations/vacuum/). Bringing a different model into this card also requires compatible room outlines, coordinates, and room-cleaning commands. A raster map alone does not supply the wall geometry. Support for other brands has not been validated.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Custom element does not exist | Confirm the HACS download or manual resource URL, the JavaScript module type, and reload the dashboard |
| Waiting for the map | Open the configured map image in Home Assistant, check the vacuum is available, and confirm both selected entities belong to the same device |
| Unsupported map format | Check that you selected the Ecovacs SVG map entity. Camera snapshots, PNG and JPEG maps cannot be converted by this version |
| 2D outlines appear instead of 3D | Check that WebGL 2 and browser hardware acceleration are available |
| Tapping a room opens the name picker | Match it once with the Ecovacs room ID. Use a dashboard account with edit permission to save the match |
| Missing mop or dock controls | Inspect the device’s available and disabled entities in the Ecovacs integration |
| Layout differs on another device | Save the layout to the dashboard and reload it on the other device. The layout lock is local to each browser |
| The robot appears stationary | Check the timestamp and position in the source map. The card uses the position reported by Home Assistant |

## Development

Use Node.js 22 or later. The checked-in distribution contains the 3D renderer, editor, and card as one ES module. The card obtains its map from the signed-in Home Assistant session and uses Home Assistant’s service API for commands.

```sh
npm ci
npm run build
npx playwright-core install chromium
npm test
```

Set `CHROME_BIN` to use an installed Chromium or Chrome executable. Run `node tests/browser.mjs --pictures` to regenerate the README screenshots from the fictional fixture. The browser tests record commands in memory. They exercise map loading, room targeting, editing, lock persistence, floor changes, and two vacuum configurations.

When reporting an issue, include the card version, Home Assistant version, robot model, browser, and the message the card displayed. A fictional or redacted example is enough to start a map-format investigation.

The bundled Three.js renderer includes its [MIT license](licenses/three.txt).
