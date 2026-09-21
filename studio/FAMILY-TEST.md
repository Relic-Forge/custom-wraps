# Family test drive

Open http://localhost:4173/studio/. Start with **Open our BFDI design** or **Start a fresh design**. Save each child's project under a different name; the browser keeps one recovery draft per vehicle.

Give each child a different job:

1. **The artist:** choose a panel, choose **Zoom here**, draw with a small brush, erase part of a stroke, then Undo and Redo. Pan while zoomed in. Save and reopen the project. Does drawing land exactly where their finger, mouse, or pencil points?
2. **The collage maker:** add a photo, fit it to a side panel, rotate and resize it, add a name, duplicate it, adjust color and brightness. Hide, lock, and reorder artwork. Can they make something without help?
3. **The car designer:** switch between top-down and 3D, rotate the car, draw on the hood in 3D, and find that stroke in top-down. Export and have a parent load the PNG into Tesla. Are the important characters complete and the words upright?

Try a refresh, switching to another vehicle and back, and opening a saved project. Check that the chosen vehicle and layers return. Save a project file before clearing browser data or moving devices. Photos are not sent to a server by this app.

For each problem, note what they tried, what happened, the device/browser, and whether Undo recovered it. Tablet/Apple Pencil pressure and palm rejection need a real-device pass; desktop simulation does not verify them.

## Current boundaries

- The export uses Tesla's actual templates and checks dimensions, name, and the 1 MB limit. Cybertruck retains its rectangular aspect ratio.
- The 3D car is a simplified original shape with conservative hood, door and rear patches. It is useful for composition and orientation, but does not represent every curve, fender, or seam. Cybertruck currently has a shape-only preview.
- Precise 3D vehicles with Tesla-compatible surface mapping remain a release gate. Generic panel names and provisional orientation suggestions on other models also need in-car validation.
- Drawing strokes form an erasable stack above image/text layers. Photos support positioning, scaling, rotation, mirroring, brightness, saturation, and opacity; there is no photo retouching or crop tool yet.
- The AI workflow runs through the installed Codex skill. The web app can copy a design brief and load the result; it does not yet generate images itself or provide a native ChatGPT integration.

Nothing has been deployed publicly. Public release should follow device testing, verified 3D assets/mappings, template calibration, and accessibility/touch improvements based on these sessions.
