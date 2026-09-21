# Family test drive

Open http://localhost:4173/studio/. **Photo or words** opens the add menu; its example section contains **Try BFDI** and **New drawing**. Save each child's project under a different name; the browser keeps one recovery draft per vehicle.

## Eight-year-old clarity check

Without coaching, ask a child to draw a star, add their name, make another drawing layer, hide/show one layer, undo a mistake, zoom in and back out, and focus on a car part. Record where they hesitate instead of declaring the interface child-tested from desktop checks alone. Help explains layers as see-through sheets. The complete 2D template is the editing and export reference.

Draw, Erase, Pick and Move operate on the 2D template. No 3D controls or runtime renderer remain in the app. Existing projects, including drawing layers created in the old 3D view, must reopen unchanged.

Give each child a different job:

1. **The artist:** choose a panel, choose **Zoom here**, draw with a small brush, erase part of a stroke, then Undo and Redo. Pan while zoomed in. Save and reopen the project. Does drawing land exactly where their finger, mouse, or pencil points?
2. **The collage maker:** add a photo, fit it to a side panel, rotate and resize it, add a name, duplicate it, adjust color and brightness. Hide, lock, and reorder artwork. Can they make something without help?
3. **The car designer:** choose a side panel, zoom to it, draw upright, then reset the view to see the complete wrap. Export and have a parent load the PNG into Tesla. Are the important characters complete and the words upright?

Try a refresh, switching to another vehicle and back, and opening a saved project. Check that the chosen vehicle and layers return. Save a project file before clearing browser data or moving devices. Photos are not sent to a server by this app.

For each problem, note what they tried, what happened, the device/browser, and whether Undo recovered it. Tablet/Apple Pencil pressure and palm rejection need a real-device pass; desktop simulation does not verify them.

## Current boundaries

- The export uses Tesla's actual templates and checks dimensions, name, and the 1 MB limit. Cybertruck retains its rectangular aspect ratio.
- The inaccurate 3D preview has been removed. The product is standardized on 2D.
- Precise 3D vehicles with Tesla-compatible surface mapping remain a release gate. Generic panel names and provisional orientation suggestions on other models also need in-car validation.
- Use **+ Paint layer** for separate drawings. Strokes collect inside the selected paint layer; erasing affects only that layer. Paint layers can be renamed, reordered with photos/text, hidden, locked, duplicated and faded. Try Round pen, Fine pencil, Broad marker, opacity and Pick color. Photos support positioning, scaling, rotation, mirroring, brightness, saturation, and opacity; there is no photo retouching or crop tool yet.
- The AI workflow runs through the installed Codex skill. The web app can copy a design brief and load the result; it does not yet generate images itself or provide a native ChatGPT integration.

Nothing has been deployed publicly. Public release should follow device testing, verified 3D assets/mappings, template calibration, and accessibility/touch improvements based on these sessions.
