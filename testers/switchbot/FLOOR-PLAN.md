# Show your own 3D floor plan

The official SwitchBot Cloud integration supplies vacuum controls. To display your own floor layout, add room outlines to the card YAML. Use the same unit and origin for every room. Coordinates run to the right and down, like graph paper. List each room’s outside corners in order around its perimeter. Use a shared edge for adjoining walls. This tester supports one floor and one simple polygon per room.

```yaml
type: custom:switchbot-vacuum-card
entity: vacuum.my_switchbot
floor_plan:
  rooms:
    - name: Living room
      color: "#bd9d80"
      points: [[0, 0], [5, 0], [5, 4], [0, 4]]
    - name: Kitchen
      color: "#9baea0"
      points: [[5, 0], [8, 0], [8, 4], [5, 4]]
```

The numbers above are an example. Replace them with your own layout. Use **Top view** to check the outlines, then **3D view** to see the walls. The plan stays fixed while the robot runs. It uses the geometry you entered and has no robot-position or trail data. You can also use an existing floor image with the card’s `map_entity` option instead of supplying polygons.

## Select a room on the drawing

On a compatible community S10 or EU K10+ setup, set `room_selection: true` and add the exact live room ID to the corresponding room entry, for example `room_id: "ROOM_0123"` on an S10. In Home Assistant, open **Developer tools → States**, select the community vacuum entity and copy the key from its `rooms` attribute. The example ID must be replaced. A matching label becomes a button. Tapping it selects the target; pressing **Clean selected rooms** sends the action. Labels without a verified ID remain informational.
