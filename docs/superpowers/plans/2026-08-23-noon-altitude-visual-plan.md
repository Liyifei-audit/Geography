# 正午太阳高度演示效果实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 点击“正午太阳高度”后，让地心视角明确呈现观测点天顶、太阳入射方向与正午高度角之间的几何关系。

**Architecture:** 在现有 Three.js 场景中增加一个独立的正午演示组，使用世界坐标动态连接观测点、局部天顶和太阳方向；按钮负责定位当地太阳正午并打开演示组，动画循环负责更新几何与角度标签。现有数据面板继续显示当前高度和正午高度两个独立指标。

**Tech Stack:** 单页 HTML、内嵌 Three.js r152、Playwright 回归测试。

---

### Task 1: Add a failing visual-state regression test

**Files:**
- Modify: `tasks/accuracy-tests.mjs`

- [ ] **Step 1: Assert the noon demo is hidden initially and visible after the quick action**

```js
const noonDemoBefore = await page.evaluate(() => ({
  visible: !!document.querySelector('#noon-demo-hud') && !document.querySelector('#noon-demo-hud').hidden,
  groupVisible: !!window.__noonDemoVisible
}));
if (noonDemoBefore.visible || noonDemoBefore.groupVisible) throw new Error('Noon demo must start hidden');
await page.evaluate(() => document.querySelector('#quick-noon').click());
await page.waitForTimeout(350);
const noonDemoAfter = await page.evaluate(() => ({
  visible: !document.querySelector('#noon-demo-hud').hidden,
  groupVisible: window.__noonDemoVisible,
  label: document.querySelector('#noon-demo-value').textContent
}));
if (!noonDemoAfter.visible || noonDemoAfter.groupVisible !== true) throw new Error('Noon demo did not activate');
if (!/°/.test(noonDemoAfter.label)) throw new Error(`Noon demo label missing angle: ${noonDemoAfter.label}`);
```

- [ ] **Step 2: Run the regression test and confirm it fails because the demo HUD does not exist**

Run: `node tasks/accuracy-tests.mjs`

Expected: FAIL while locating `#noon-demo-hud` or `window.__noonDemoVisible`.

### Task 2: Build and wire the noon geometry overlay

**Files:**
- Modify: `index.html:300-560` (visual styles), `index.html:790-810` (HUD markup), `index.html:3565-3575` (state), `index.html:3095-3235` (scene construction), `index.html:3880-3925` (animation updates).

- [ ] **Step 1: Add the hidden HUD and compact responsive styles**

Create `#noon-demo-hud` with `#noon-demo-value` and `#noon-demo-detail`; keep it pointer-events none, place it below the existing canvas legend, and reduce its width on screens below 680px.

- [ ] **Step 2: Create `noonDemoGroup` with three line geometries and a dynamic text sprite**

Use a gold line for the observer-to-Sun direction, a cyan line for local zenith, and an orange arc between them. Add the group at scene level and start it hidden.

- [ ] **Step 3: Add `updateNoonDemo()`**

Transform the observer latitude/longitude from Earth-local coordinates to world coordinates, derive the local zenith and Sun direction, generate the angle arc with `acos(dot(zenith, sunDirection))`, position the label between the two rays, and update the HUD with the computed altitude and complement angle.

- [ ] **Step 4: Activate and deactivate the group from the quick button**

The first click sets simulation time to local solar noon, focuses Earth, shows the 3D group and HUD, and updates the button active state. A second click hides the group and HUD without changing the simulation time.

- [ ] **Step 5: Expose read-only visual state for the browser test**

Set `window.__noonDemoVisible` whenever the group visibility changes; do not expose mutable internals.

### Task 3: Verify behavior and responsive layout

**Files:**
- Modify: `tasks/accuracy-tests.mjs` only if the final selector or assertion needs alignment.

- [ ] **Step 1: Run the full browser regression suite**

Run: `node tasks/accuracy-tests.mjs`

Expected: exit code `0`, no `pageerror`, and the existing Beijing solar-noon, polar-day, rotation, and mobile layout assertions remain green.

- [ ] **Step 2: Capture desktop and mobile screenshots after activating the demo**

Verify the two rays and angle arc remain visible around the observer, the label does not overlap the Earth legend or science card, and the mobile HUD stays within the viewport.

- [ ] **Step 3: Run a final source check**

Confirm `#noon-demo-hud`, `updateNoonDemo`, `noonDemoGroup`, and `window.__noonDemoVisible` each have one owning implementation and no stale selectors remain.
