# Matter robot vacuums

Use this companion card if Home Assistant’s **Matter** integration already shows your robot as a `vacuum.*` entity. The card reads the capabilities of that specific entity. The minimum controls are Start and Stop. Pause, Go home and Locate appear when the device and integration advertise them. Browser fixtures exercised both the minimum and optional controls. Physical models still need owner testing. [Home Assistant’s Matter vacuum implementation](https://github.com/home-assistant/core/blob/2026.11.2/homeassistant/components/matter/vacuum.py)

## Connect the robot

1. Confirm that the exact robot and firmware support Matter and that the manufacturer supplies a Matter pairing code or sharing flow.
2. Set up the **Matter** integration and Matter Server in Home Assistant. On Home Assistant OS the guided installation can set up the server. Use the current Home Assistant Companion app on your phone for commissioning. [Matter setup](https://www.home-assistant.io/integrations/matter/)
3. **Matter over Wi-Fi** uses your existing Wi-Fi access point. **Matter over Thread** requires a Thread border router on your home network and the Thread credentials on your phone. Matter requires local IPv6 and multicast DNS. [Network and setup requirements](https://www.home-assistant.io/integrations/matter/)
4. For a new robot, enable pairing, keep the phone nearby with Bluetooth enabled and scan the robot’s Matter QR code. If it already belongs to another Matter controller, use that controller’s **share** option and enter its new pairing code in Home Assistant. Open the robot in **Settings → Devices & services → Matter** and copy its vacuum entity ID. [Pairing and sharing](https://www.home-assistant.io/integrations/matter/)

## Add the dashboard card

Install the **Vacuum Controls** companion resource using the [card installation steps](START-HERE.md#install-the-card), then add a Manual card. Replace the example entity with yours.

```yaml
type: custom:vacuum-controls-card
entity: vacuum.my_matter_robot
```

The built-in Matter vacuum integration does not expose room geometry or robot coordinates for automatic 3D mapping or a live trail. Some devices support Home Assistant’s separate **Clean area** action. The companion currently offers whole-home cleaning through Matter. [Home Assistant’s Matter vacuum capabilities](https://github.com/home-assistant/core/blob/2026.11.2/homeassistant/components/matter/vacuum.py)
