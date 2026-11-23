# Dreame L40s Pro Ultra tester

This Home Assistant dashboard card turns the live map from Tasshack’s Dreame Vacuum integration into a 3D floor plan. Tap a room to select it, or tap several rooms for one cleaning job. **Start** shows the target and sends the native segment IDs to Dreame. Choosing **Whole home** clears the selection.

The integration lists four L40s Pro Ultra variants, with model codes `dreame.vacuum.r9419a`, `r9419e`, `r9419h` and `r9419t`. The tester uses the structured map endpoint from integration v2.0.3. Browser tests cover fictional floors and a separate L10s Ultra map replay. Physical cleaning on an L40s Pro Ultra still needs owner verification. [Supported devices](https://dv.tasshack.com/guide/more/supported-devices) · [Integration release tested](https://github.com/Tasshack/dreame-vacuum/releases/tag/v2.0.3)

## Install

1. In Home Assistant, confirm the Dreame integration shows your vacuum and that its **current floor map camera** displays the correct floor. Both entities must be registered to the same device. Choose the regular map camera, rather than its history, saved, Wi-Fi, recovery or Map Data variants.
2. [Download the Dreame JavaScript module](../dist/dreame-map-card-beta.js) using the **Download raw file** button on GitHub. Copy `dreame-map-card-beta.js` into your Home Assistant config directory under `www/`. If this is the first time you have created the `www` directory, restart Home Assistant.
3. Under **Settings → Dashboards → ⋮ → Resources**, add `/local/dreame-map-card-beta.js` as a **JavaScript module**. Enable Advanced Mode in your user profile if Resources is hidden. If you already installed an earlier Dreame tester at this path, replace the file, update the existing resource URL to `/local/dreame-map-card-beta.js?v=2` and reload the dashboard.
4. Add **Dreame 3D Map (beta)** from the dashboard card picker, or add a Manual card with the following configuration. Substitute the vacuum and camera IDs from step 1.

```yaml
type: custom:dreame-map-card-beta
entity: vacuum.my_dreame
map_entity: camera.my_dreame_map
```

The Dreame tester has its own module, card type and editor. It can share a dashboard with the stable T90 card. [Home Assistant dashboard resources](https://developers.home-assistant.io/docs/frontend/custom-ui/registering-resources/)

## Check the map and controls

- Compare the rooms, robot, dock and trail with the live Dreame camera. The card uses the map’s native coordinates. The camera image can display the same floor at a different rotation.
- Tap one room and check the name on **Start**. Tap it again to deselect it. Selection alone sends no cleaning command.
- To run a physical test, choose a single identifiable room and press **Start**. Confirm the robot goes to that room. The card reads the current map again before sending the request. If the floor changes while rooms are selected, choose a fresh target.
- **Follow robot** appears when the map supplies a robot position. Position updates come from the integration on the card’s five-second polling interval. During a cleaning job the card can show the room under the reported robot position and the rooms marked complete by the integration.
- **Pause**, **Resume**, **Stop** and **Go home** use Home Assistant’s vacuum actions. Available cleaning settings and station controls depend on the entities your integration exposes.

If the map fails to load, first check the ordinary Dreame camera and the vacuum’s availability. A useful tester report includes your model code, Home Assistant and integration versions, the card’s message, and whether the selected room matched the physical result. To uninstall, remove the dashboard card and its Dreame module resource, then remove the downloaded file from `www/`.
