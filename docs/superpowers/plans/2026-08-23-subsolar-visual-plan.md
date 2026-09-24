# Solar Subsolar Point Visual Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the solar subpoint and sunlight-ray visuals while preserving the existing astronomical coordinates.

**Architecture:** Keep all geometry in the existing scene/layer system. Add visual-only children to `subsolarGroup` and `rayGroup`, update their animation in `animate()`, and clarify the HUD legend.

**Tech Stack:** Single-file HTML, Three.js, CanvasTexture, Playwright.

---

### Task 1: Add a failing regression check

**Files:**
- Modify: `tasks/accuracy-tests.mjs`

- [ ] Assert that the source defines a distinct solar marker glow, pulse animation, ray arrow, and separate observation-point legend entry.
- [ ] Run `node tasks/accuracy-tests.mjs`; expected failure before implementation.

### Task 2: Implement the visual layers

**Files:**
- Modify: `index.html:761-765` for the HUD legend.
- Modify: `index.html:3166-3187` for marker and ray construction.
- Modify: `index.html:3524-3528` for animation state.
- Modify: `index.html:3808-3819` for per-frame updates.

- [ ] Add a gold subpoint glow sprite, bright core, two pulse rings, and a short local normal stem.
- [ ] Add a dynamic label showing the subsolar latitude and longitude.
- [ ] Add a soft ray line, core ray line, and directional cone at the Earth endpoint.
- [ ] Update pulse opacity/radius and arrow placement every frame without changing `dirToSun` or `earthPos`.
- [ ] Change the HUD legend to distinguish gold solar subpoint from red observation point.

### Task 3: Verify behavior and visuals

**Files:**
- Modify: `tasks/accuracy-tests.mjs` if needed for stable assertions.
- Create: `tasks/subsolar-visual-after.png` as a temporary verification artifact.

- [ ] Run `node tasks/accuracy-tests.mjs` and require exit code 0.
- [ ] Capture a desktop screenshot in Earth view with the ray and subpoint visible.
- [ ] Capture a mobile screenshot and verify no page errors or severe overlap.
- [ ] Confirm the subpoint label values match the data panel at a fixed date.
