# FabLens

An open-source, educational simulator for maskless semiconductor lithography, inspired by HackerFab IIT Bombay's documented stage-control projects.

FabLens is a teaching tool, not calibrated equipment software. It shows a stylised lithography machine, a virtual XYZ stage, a deterministic binary-pattern experiment, and a conceptual positive-photoresist exposure/development sequence. It never connects to real hardware.

## Run it

```sh
npm install
npm run dev
```

Open the local URL printed by Vite.

```sh
npm test        # deterministic domain tests
npm run check   # Svelte + TypeScript diagnostics
npm run build   # production build
npm run lint    # Prettier + ESLint
```

## What works

- Interactive, orbitable 3D machine built with Svelte 5, Threlte and Three.js.
- Clickable projector, optics, camera, XYZ stage, sample holder, wafer and stage controller with beginner explanations.
- Labelled "documented" versus "illustrative" machine facts.
- Guided camera views and explicit `+`/`−` zoom buttons. Wheel and pinch gestures do not zoom the 3D scene.
- Three deterministic, layer-inspired patterns: interconnect wires, contact vias and gate lines.
- Shared authoritative stage state across the 3D scene, 2D wafer view, controls and serial emulator.
- Guided sequence: `uncoated → prepared → aligned → exposed → developed`, including an explicit photoresist coating action, with validation and reset.
- Multi-layer stack: after developing a layer, add another layer, align it to the previous one, and keep building a small virtual wafer stack.
- Conceptual positive-resist model: exposure records illuminated cells; development removes them.
- Top-down canvas wafer view with resist, exposed, removed and reference-layer legend.
- Alignment exercise comparing the live or recorded projection with the previous layer (or the centred marks for layer 1), with an on/off reference overlay.
- Qualitative Z/focus blur on the live projection, explicitly labelled as an illustrative display effect.
- Plain-language “Start here” overview explaining the big picture: a chip is a stack of printed patterns. Scene labels and the machine-part details panel are hidden by default and can be shown with the `?` toggle.
- Source-informed developer console emulating `P`, `A`, `R`, `J` and `L` over a virtual serial log.
- No backend, database, Web Serial connection or motor control.

## Scientific scope

This prototype deliberately does **not** model diffraction, chemical kinetics, dose, minimum feature size or real exposure recipes. The Z control produces a qualitative visual blur only; it is not an optical model and does not change the recorded binary exposure. Stage coordinates in the experiment are virtual units, not millimetres. The protocol emulator uses an illustrative `0–10000` step range; real firmware derives limits during calibration.

All machine geometry and optical arrangement are illustrative unless explicitly marked documented. No affiliation with HackerFab IIT Bombay is implied, and the simulator has not been validated on their equipment.

## Source references

- [HackerFab IIT Bombay `litho-ui`](https://github.com/hackerfabiitb/litho-ui) — stage UI, Arduino firmware and serial protocol. The emulator's behaviours were checked against the README and `xyz1/xyz1.ino` at the time of writing.
- [HackerFab IIT Bombay GitHub](https://github.com/hackerfabiitb)
- [Hacker Fab documentation](https://docs.hackerfab.org/home) — general process context, not the exact IITB build.
- [Junction](https://junction.lagrangepoint.org/)

Specific honesty notes:

- Upstream `litho-ui` reports `POS` then `DONE` after a move, moves axes sequentially, clamps targets to limits, and uses calibrated limits (or `0 0` when uncalibrated). The emulator uses a fixed illustrative range and models only the documented subset it implements.
- The actual IITB machine geometry, camera arrangement, installed firmware version and whether this teaching tool is useful to the team are unverified. Ask maintainers before making equipment-specific claims.
- Clear documentation of the projects' licensing is required before reusing their CAD, images or source beyond protocol reference.

## Structure

```text
src/
  app.css
  routes/
    +layout.svelte
    +page.svelte
  lib/
    components/
      scene/          # Threlte machine, stage, wafer, labels
      experiment/     # big picture, layer stack, guided steps, controls, previews, console
    constants/        # machine explanations and process copy
    simulation/       # pure transitions, patterns, exposure, focus, alignment, controller
    types/            # shared domain types
    utils/            # shared 2D wafer rendering
    ui.svelte.ts      # UI-only view preferences (reference layer, labels, camera presets)
```

The simulation and emulator are plain TypeScript and are tested without rendering a canvas. Svelte components consume a single shared reactive state module.
