# Valetudo native 3D map tester

Use this card with a compatible robot **already running Valetudo**. The card reads Valetudo's structured map embedded in the MQTT Map data camera. It displays reported floor and segment outlines, walls, the robot and dock positions, and the actual cleaning path when present. Use **3D floor**, **Top view** or **Follow robot**. The map card is view-only. Use your normal Home Assistant vacuum controls to clean.

## Requirements

- A robot on the [Valetudo supported robots list](https://valetudo.cloud/pages/general/supported-robots/) already running Valetudo, an MQTT broker, and Home Assistant's [MQTT integration](https://www.home-assistant.io/integrations/mqtt/).
- In the robot's Valetudo interface, enable MQTT connectivity and Home Assistant discovery for the broker connected to Home Assistant. Confirm the same MQTT device has a `vacuum.*` entity and a `camera.*` labeled **Map data**. The camera may show an instructional image in a normal picture card. That PNG carries the structured floor data. [Valetudo MQTT documentation](https://valetudo.cloud/pages/integrations/mqtt/) · [Home Assistant map format](https://hass.valetudo.cloud/)
- A browser with WebGL 2 and DecompressionStream support. The full 3D view requires a map with floor and wall layers. The robot maker's normal cloud map camera has a different format.

## Install

1. Open [valetudo-map-card.js](../../dist/valetudo-map-card.js) on GitHub and select **Download raw file**. Copy the module into `config/www/`.
2. Add `/local/valetudo-map-card.js` under **Settings → Dashboards → Resources** as a **JavaScript module**, then reload. Enable Advanced Mode in your profile if needed.
3. Choose **Valetudo 3D Map** in the dashboard card picker, or use the following Manual card with your MQTT entities.

```yaml
type: custom:valetudo-map-card
entity: vacuum.my_robot
map_entity: camera.my_robot_map_data
appearance: daylight
```

In the visual editor, select the vacuum and map, then choose **Preview selected map** to see your floor before saving. For an existing install, replace the module at its original path and change the version query on the existing dashboard resource to `?v=beta7`. Your saved card configuration carries over.

Open **Test details** on the card to review a snapshot of detected capabilities. **Refresh test details** takes a new snapshot. **Copy test details** copies exactly the displayed text for sharing. The report excludes entity IDs, room names, floor coordinates and images. This map viewer sends no robot commands.

Use `appearance: night` for the dark view. The card polls Home Assistant every five seconds while visible. MQTT can retain the last map, so an idle robot may show its last recorded route. If the camera disconnects or returns an ordinary image, the card reports the problem and waits for a valid map.

**Test evidence.** Browser tests use a fictional Valetudo v2 map with native compressed pixel runs inside a deflated PNG text chunk. They verify 3D map rendering, pose updates, path, device pairing and error recovery. The converter also accepted all 30 version 2 maps in the [upstream robot parser fixtures](https://github.com/Hypfer/Valetudo/tree/08162e53081682d56c9e1b053a2df6e579851f9e/backend/test/lib/robots), covering 3irobotix, Dreame and Roborock. It rejected the one legacy version 1 map. Physical Valetudo hardware has not been verified.

### Put cleaning controls under the map

Home Assistant's built-in Tile card can put the MQTT vacuum's supported controls directly below the 3D viewer. This layout needs only the Valetudo map module above. Replace both example entity IDs with your own.

```yaml
type: vertical-stack
cards:
  - type: custom:valetudo-map-card
    entity: vacuum.my_robot
    map_entity: camera.my_robot_map_data
  - type: tile
    entity: vacuum.my_robot
    features:
      - type: vacuum-commands
        commands:
          - start_pause
          - stop
          - return_home
```
