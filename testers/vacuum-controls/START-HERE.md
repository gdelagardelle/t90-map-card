# Roomba, Braava, Shark IQ and Xiaomi Mi Robot

The companion card uses the vacuum entity already connected to Home Assistant. It reads that entity’s capabilities and the actions registered on your server. A compatible vacuum can show Start/Resume, Pause, Stop, Go home, Locate, Spot clean and the cleaning settings supplied by the integration.

## Choose your integration

| Robot and connection | What the card can show or send | Installation and evidence |
|---|---|---|
| **Roomba 980** and other compatible Wi-Fi Roombas with the built-in **iRobot Roomba and Braava** integration | Standard controls. A relative 2D trail appears during a run when the integration reports valid positions. The Roomba 980 control and pose contracts passed automated tests. HA also lists the s9+, 960, 890 and Combo Essential among its integration-tested devices. | In Settings → Devices & services, add **iRobot Roomba and Braava**. Follow its local pairing wizard. Core supplies the integration. Its docs exclude the newer x05 generation, including 105, 405 and 505, from this connection. [HA setup and model list](https://www.home-assistant.io/integrations/roomba/) · [Core vacuum and pose implementation](https://github.com/home-assistant/core/blob/2026.11.2/homeassistant/components/roomba/vacuum.py) |
| **Braava jet m6** with the same built-in integration | Start/resume, pause, stop, dock, locate and the mop settings reported by the entity. The m6 fixture exercised the mop-setting control. | Add **iRobot Roomba and Braava** in HA as above. Available mop behaviours depend on the device. [HA integration](https://www.home-assistant.io/integrations/roomba/) |
| **Roomba+** community integration, Classic Smart Map and Prime/V4 | Converts paired **Rooms Map** image attributes into a real 3D wall-and-floor layout. Room labels support cleaning when the integration supplies unambiguous native identifiers and a room-cleaning action. A standard map image can still be displayed while geometry is absent. Tested with synthetic Classic and Prime payloads, including a Plus 405 model-named fixture. | Install **Roomba+** through HACS/Marketplace and add it under Devices & services. The room adapter was checked against **v4.6.5**. Classic Smart Map geometry needs a finalized map plus the integration’s cloud/map setup. Prime needs a saved map, a compatible iRobot account and Internet access. [Roomba+ installation](https://github.com/johnnyh1975/ha_roomba_plus#installation) · [Checked integration release](https://github.com/johnnyh1975/ha_roomba_plus/releases/tag/v4.6.5) |
| **Shark IQ** with the built-in **Shark IQ** integration | Standard controls, suction settings and room names from the vacuum. Opt in to select rooms by name. Tested with a Shark IQ **RV1001AE** fixture modelled on HA’s test data. Some Shark vacuums expose Pause but only respond to Stop; both actions remain available according to entity capabilities. | Add **Shark IQ** in Devices & services and follow its setup wizard. The card uses the integration’s cloud connection. [HA setup and actions](https://www.home-assistant.io/integrations/sharkiq/) · [HA model fixture](https://github.com/home-assistant/core/blob/2026.11.2/tests/components/sharkiq/const.py) |
| **Xiaomi Mi Robot Vacuum** with the built-in **Xiaomi Home** integration (`xiaomi_miio`) | Standard controls, spot cleaning and the fan speeds exposed by the entity. Tested with a Mi Robot Vacuum fixture. Room selection and automatic map reconstruction are outside this adapter. | Pair the vacuum in the **Xiaomi Home app** and add **Xiaomi Home** in HA. Use a vacuum supported by that integration. [HA prerequisites and supported actions](https://www.home-assistant.io/integrations/xiaomi_miio/#xiaomi-mi-robot-vacuum) |

A robot connected as a Matter **Robotic Vacuum Cleaner** can use the standard controls its Matter entity exposes. See the [Matter setup and capability notes](MATTER.md).

Tests recorded the actual Home Assistant action and target in an isolated browser. They did not operate physical hardware. Connect the integration first and verify the selected `vacuum.*` entity is available in Home Assistant.

## Install the card

1. Download [vacuum-controls-card.js](../../dist/vacuum-controls-card.js) with GitHub’s **Download raw file** button. If you received the tester ZIP, extract the JS file instead.
2. Copy it into Home Assistant’s configuration directory as `www/vacuum-controls-card.js`. If this is the first time you created `www`, restart Home Assistant.
3. Go to **Settings → Dashboards → ⋮ → Resources**, then add `/local/vacuum-controls-card.js?v=beta7` as a **JavaScript module**. Enable Advanced Mode in your profile if Resources is hidden. On an upgrade, replace the file and change the version in the URL.
4. Reload the dashboard. Choose **Vacuum Controls** from the card picker, or use a **Manual** card with the entity ID of your own vacuum.

```yaml
type: custom:vacuum-controls-card
entity: vacuum.my_robot
```

In the visual editor, select the vacuum to save a controls-only card, or choose a map and **Preview selected map** to inspect your floor before saving. For an existing install, replace the module at its original path and change the version query on the existing dashboard resource to `?v=beta7`. Your saved card configuration carries over.

Open **Test details** on the card to review a snapshot of detected capabilities. **Refresh test details** takes a new snapshot. **Copy test details** copies exactly the displayed text for sharing. The report excludes entity IDs, room names, floor coordinates and images. Command results distinguish Home Assistant accepting a request from a later state change. Physical operation still needs an owner check.

The module includes its interface and 3D renderer. There is no separate SwitchBot component to install. Optional `name` overrides the card title. Set `battery_entity: sensor.my_robot_battery` if the integration provides battery as a separate sensor.

## Maps and rooms

**Roomba+ native 3D map.** Choose the static **Rooms Map** image from the same Roomba+ device as the vacuum. Map images named Cleaning Map or Last Mission can be displayed in 2D. The card renders 3D geometry from the room outlines when present. It keeps the Roomba’s relative pose trail in a separate panel because a shared coordinate frame with the static map isn’t guaranteed.

```yaml
type: custom:vacuum-controls-card
entity: vacuum.my_roomba_plus
map_entity: image.my_roomba_rooms_map
room_selection: true
```

Tap a room label or a chip, check the selected rooms, then press **Clean selected rooms**. A map tap only changes the selection. A changed map or room list can invalidate the target. Select a current room again or explicitly choose **Whole home**. A room without a verified identifier or with an ambiguous name remains display-only.

**Shark named rooms.** Add `room_selection: true` to the basic card. When the current vacuum reports room names and the Shark IQ room action is available, the card displays room chips. No extra map download is required. The Shark integration receives the current selected names. Shark normalizes names before matching; the card offers names that survive that conversion, so an underscored alias cannot silently select a different room.

**Optional external image.** Set `map_entity` to a real HA `image.*` or `camera.*` entity for an ordinary 2D preview. The core Roomba integration supplies position on some models but has no structured floor outline. Shark IQ and Xiaomi Miio use the same optional image fallback.

**Optional hand-drawn 3D plan.** Supply `floor_plan.rooms` with polygons instead of `map_entity`. This draws the coordinates you provide. It does not invent robot positions.

```yaml
type: custom:vacuum-controls-card
entity: vacuum.my_shark
room_selection: true
floor_plan:
  rooms:
    - name: Kitchen
      room_id: Kitchen
      points: [[0, 0], [4, 0], [4, 3], [0, 3]]
    - name: Hall
      points: [[4, 0], [7, 0], [7, 3], [4, 3]]
```

With Shark IQ, `room_id` must exactly match a currently reported room name for its label to be selectable. The other labels remain informational.

**Roomba position tracking.** The card starts collecting when it receives valid cleaning or returning positions. Repeated points are ignored. Missing samples start a separate path segment. The next cleaning run resets the previous trail. Refreshing or disconnecting clears the local buffer. Trail history is limited to the most recent 1,500 sampled points. Its scale fits the observed trip and it is independent of any floor plan.

## Verification

From the repository root, run `node testers/vacuum-controls/build.mjs` and `node testers/vacuum-controls/tests/browser.mjs` after installing the project dependencies and Playwright Chromium. To use an existing Chrome installation, set `CHROME_BIN` to its executable. For the native room adapter checks, run `node testers/vacuum-controls/tests/roomba-plus.mjs`.

The tests use fictional device IDs, outlines, pose samples and service recorders. No connection to your home or vacuum is required.
