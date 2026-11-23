# SwitchBot Vacuum Card · Home Assistant tester

The card controls a SwitchBot vacuum already connected to Home Assistant. SwitchBot Cloud supplies its cleaning state, supported commands and suction options. Start, Pause and Go home appear when the vacuum supports them. A separate Stop button requires the entity's Stop capability. State and controls follow the Home Assistant entity.

SwitchBot Cloud lists K10+, K10+ Pro, K10+ Pro Combo, K11+, K20+ Pro, S10, S20, S1 and S1 Plus. The card has been tested with simulated Home Assistant entities. Physical-device testing is pending. [Supported devices and Cloud setup](https://www.home-assistant.io/integrations/switchbot_cloud/#vacuums) · [Home Assistant 2026.11.2 vacuum implementation](https://github.com/home-assistant/core/blob/2026.11.2/homeassistant/components/switchbot_cloud/vacuum.py)

## Install

1. For a new SwitchBot Cloud setup, Home Assistant lists a SwitchBot Hub and a SwitchBot account as prerequisites. Enter the token and secret from the SwitchBot app into the Home Assistant integration setup. If the vacuum already appears in Home Assistant, open **Settings → Devices & services → SwitchBot Cloud**. Look up your robot's actual `vacuum.*` entity under its device. Confirm that it reports a state.
2. Download the [bundled JavaScript module](../../dist/switchbot-vacuum-card.js) using GitHub’s **Download raw file** button, or use the module included in the tester ZIP. Copy `switchbot-vacuum-card.js` to `/config/www/switchbot-vacuum/` on Home Assistant. Add `/local/switchbot-vacuum/switchbot-vacuum-card.js?v=beta7` under **Settings → Dashboards → Resources** as a JavaScript module. The Resources menu requires Advanced Mode in your Home Assistant profile. Reload the dashboard after saving.
3. In the dashboard editor, choose **SwitchBot Vacuum** from the card picker. For manual YAML, replace the example entity ID with yours.

```yaml
type: custom:switchbot-vacuum-card
entity: vacuum.your_switchbot
```

In the visual editor, select the vacuum to save a controls-only card, or choose a map and **Preview selected map** to inspect your floor before saving. For an existing install, replace the module at its original path and change the version query on the existing dashboard resource to `?v=beta7`. Your saved card configuration carries over.

Open **Test details** on the card to review a snapshot of detected capabilities. **Refresh test details** takes a new snapshot. **Copy test details** copies exactly the displayed text for sharing. The report excludes entity IDs, room names, floor coordinates and images. Command results distinguish Home Assistant accepting a request from a later state change. Physical operation still needs an owner check.

To update a previous tester build, replace the file and change the resource URL's query string (use `?v=beta7` for this build) so existing browsers load the new version.

## Maps and battery

SwitchBot Cloud's vacuum integration exposes neither room geometry nor robot coordinates. It cannot supply an automatic 3D reconstruction, moving robot, cleaning trail or per-room coverage. Its image integration is for the AI Art Frame. [Vacuum and image support](https://www.home-assistant.io/integrations/switchbot_cloud/#supported-functionality)

For a 3D plan you draw using your own room outlines, see [Floor plan setup](FLOOR-PLAN.md). The optional floor plan is a reference view. Room cleaning on it requires the separate room-capable setup below.

If another integration already supplies a real map as an `image.*` or `camera.*` entity, add `map_entity` to display it using Home Assistant's picture card. Choose either a `map_entity` or a `floor_plan`. To show a separate battery reading, supply its sensor. Both options are independent.

```yaml
type: custom:switchbot-vacuum-card
entity: vacuum.your_switchbot
map_entity: image.your_actual_map
battery_entity: sensor.your_robot_battery
```

## Optional room cleaning

The [community SwitchBot Vacuum integration](https://github.com/jaco/switchbot-vacuum) can supply a room list and a room-specific action. This is a different integration from SwitchBot Cloud. If it already runs on your Home Assistant instance, point the card at its vacuum entity and opt in:

```yaml
type: custom:switchbot-vacuum-card
entity: vacuum.your_room_capable_switchbot
room_selection: true
```

Select one or more room chips and press **Clean selected rooms**. **Whole home** clears the selection. The card keeps the integration's room IDs, including when two rooms share a name. If the room list changes, the card blocks Start until you select again or explicitly clear your target.

Room commands are enabled only for the S10 or the community integration's identified EU K10+ implementation with room cleaning support. K10+ Pro and older K10+ implementations can turn a room request into whole-home cleaning. The card keeps room actions disabled for those variants. Home Assistant must expose the vacuum's integration and device model, a valid room list and the room-cleaning action. [Checked community adapter implementation](https://github.com/jaco/switchbot-vacuum/blob/0f8e4d476fac1e83858576fdcd9868476515a404/custom_components/switchbot_vacuum/vacuum.py#L306-L361)

If state updates lag, first check the vacuum's entity in Home Assistant. SwitchBot Cloud uses webhooks for vacuum updates. [Webhook setup](https://www.home-assistant.io/integrations/switchbot_cloud/#webhook-support)

## Build and test from a checkout

Use a current Node.js LTS release. Open a terminal at the repository root. Install the locked dependencies, rebuild the module, and install Playwright’s matching Chromium version:

```sh
npm ci
node testers/switchbot/build.mjs
npx playwright-core install chromium
```

Run all three checks from the same directory:

```sh
node testers/switchbot/tests/rooms.mjs
node testers/switchbot/tests/card.mjs
node testers/switchbot/tests/resilience.mjs
```

The browser tests load the newly built [distributable module](../../dist/switchbot-vacuum-card.js), use fictional vacuum entities and record service calls locally. Set `CHROME_BIN` to the path of an installed Chrome or Chromium executable to use it in place of the Playwright browser.
