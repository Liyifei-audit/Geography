import { createRequire } from 'module';
import fs from 'node:fs';
const { chromium } = createRequire(import.meta.url)('C:/Users/lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
const source = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
if (!source.includes('var omega = 125.04 - 1934.136 * T;')) throw new Error('Solar apparent longitude must use Julian centuries T for omega');
if (!source.includes('scene.add(rayGroup);')) throw new Error('Solar ray must be attached to the world scene');
if (!source.includes('scene.add(subsolarGroup);')) throw new Error('Subsolar marker must be attached to the world scene');
if (!source.includes('function makeLatitudeLine(')) throw new Error('Latitude bands must use a shared geographic latitude-line builder');
if (!source.includes('function syncObliquityToSimDate(')) throw new Error('Obliquity bands must follow the simulation date');
if (!source.includes('subsolarGlow')) throw new Error('Solar subpoint must have a dedicated glow layer');
if (!source.includes('subsolarPulseTime')) throw new Error('Solar subpoint pulse animation state is missing');
if (!source.includes('rayArrow')) throw new Error('Solar ray direction arrow is missing');
if (!source.includes('legend-dot observation')) throw new Error('Observation-point legend entry is missing');
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const pageErrors = [];
page.on('pageerror', (error) => pageErrors.push(error.message));
await page.goto('http://127.0.0.1:8000/index.html');
await page.waitForTimeout(1600);
const rotationControl = page.locator('#quick-rotation');
const timeLockControl = page.locator('#quick-time-lock');
if (await rotationControl.isDisabled()) throw new Error('Quick rotation control must remain available while real-time lock is on');
if (!(await rotationControl.textContent()).includes('自动')) throw new Error('Locked rotation control must explain that it follows simulation time');
if (!(await page.locator('#btn-rot-play').isDisabled())) throw new Error('Main rotation control must be disabled while real-time lock is on');
if (await page.locator('[data-proxy="btn-rot-play"]').evaluateAll((buttons) => buttons.some((button) => !button.disabled))) {
  throw new Error('Dock rotation controls must be disabled while real-time lock is on');
}
if (!(await page.evaluate(() => window.__orbitMotionState?.visible))) throw new Error('Orbital motion cue must be visible in heliocentric view');
await page.evaluate(() => document.querySelector('#btn-view-earth').click());
await page.waitForTimeout(180);
if (await page.evaluate(() => window.__orbitMotionState?.visible)) throw new Error('Orbital motion cue must hide in Earth view');
if (!(await page.evaluate(() => window.__rotationGuideVisible))) throw new Error('Rotation direction guide must show in Earth view');
await page.evaluate(() => document.querySelector('#btn-view-sun').click());
await page.waitForTimeout(180);
if (!(await page.evaluate(() => window.__orbitMotionState?.visible))) throw new Error('Orbital motion cue did not return in heliocentric view');
await page.evaluate(() => document.querySelector('#quick-rotation').click());
if ((await timeLockControl.textContent()).includes('开')) throw new Error('Quick rotation should leave real-time lock before independent playback');
if (await rotationControl.isDisabled()) throw new Error('Rotation control must enable after the quick demo switches modes');
if (!(await rotationControl.textContent()).includes('开')) throw new Error('Quick rotation did not start independent playback');
await page.evaluate(() => document.querySelector('#quick-rotation').click());
if (!(await rotationControl.textContent()).includes('关')) throw new Error('Quick rotation did not pause independent playback');
await page.evaluate(() => document.querySelector('#quick-time-lock').click());
if (!(await timeLockControl.textContent()).includes('开')) throw new Error('Time lock did not restore');
await page.evaluate(() => document.querySelector('#quick-time-lock').click());
if ((await timeLockControl.textContent()).includes('开')) throw new Error('Time lock did not turn off');
await page.evaluate(() => document.querySelector('#quick-time-lock').click());
if (!(await timeLockControl.textContent()).includes('开')) throw new Error('Time lock did not restore after the independent demo');
const requiredRows = ['d-sunrise', 'd-sunset', 'd-solar-noon', 'd-local-solar-time', 'd-day-geometric'];
for (const id of requiredRows) {
  if (await page.locator(`#${id}`).count() !== 1) throw new Error(`Missing science output: ${id}`);
}
const scienceData = page.locator('#science-data');
if (await scienceData.count() !== 1) throw new Error('Missing science data card');
const scienceLayout = await scienceData.evaluate((el) => {
  const style = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  return { position: style.position, width: rect.width, height: rect.height };
});
if (scienceLayout.position !== 'absolute' || scienceLayout.width < 240 || scienceLayout.height < 80) {
  throw new Error(`Science data card is not laid out: ${JSON.stringify(scienceLayout)}`);
}
if (await page.locator('#time-zone-select').count() !== 1) throw new Error('Missing time display selector');
if (await page.locator('#science-model-limits').count() !== 1) throw new Error('Missing model limits disclosure');
await page.locator('button[data-panel-tab="advanced"]').click();
const beltCheckbox = page.locator('#ck-belts');
if (await beltCheckbox.count() !== 1 || !(await beltCheckbox.isVisible())) {
  throw new Error('Advanced panel must expose the five-zone layer option');
}
const beltInitialState = await page.evaluate(() => ({
  belts: layers.belts?.visible,
  boundaries: ['equator', 'tropic-cancer', 'tropic-capricorn', 'arctic', 'antarctic'].map((key) => layers[key]?.visible)
}));
if (beltInitialState.belts || await beltCheckbox.isChecked()) {
  throw new Error('Five-zone layer must start disabled');
}
await page.locator('#quick-belt').click();
await page.waitForTimeout(120);
const beltEnabledState = await page.evaluate(() => ({
  belts: layers.belts?.visible,
  boundaries: ['equator', 'tropic-cancer', 'tropic-capricorn', 'arctic', 'antarctic'].map((key) => layers[key]?.visible),
  bands: beltBandMeshes.map((mesh) => mesh.geometry.parameters.thetaLength),
  labels: beltBandLabels.map((label) => label.userData?.text || '')
}));
if (!beltEnabledState.belts || !(await beltCheckbox.isChecked())) {
  throw new Error('Five-zone controls did not enable the five-zone layer together');
}
if (JSON.stringify(beltEnabledState.boundaries) !== JSON.stringify(beltInitialState.boundaries)) {
  throw new Error('Five-zone controls must not alter existing latitude-boundary layers');
}
if (beltEnabledState.bands.length !== 5 || !beltEnabledState.bands.every((length) => Number.isFinite(length) && length > 0)) {
  throw new Error('Five-zone layer must contain five non-empty latitude bands');
}
if (beltEnabledState.labels.join('|') !== '北寒带|北温带|热带|南温带|南寒带') {
  throw new Error(`Unexpected five-zone labels: ${beltEnabledState.labels.join('|')}`);
}
const obliquityRangeForBelts = page.locator('#quick-obliquity-range');
await obliquityRangeForBelts.fill('20');
await obliquityRangeForBelts.dispatchEvent('input');
await page.waitForTimeout(120);
const tropicalBandSpan = await page.evaluate(() => beltBandMeshes[2]?.geometry.parameters.thetaLength / (Math.PI / 180));
if (!Number.isFinite(tropicalBandSpan) || Math.abs(tropicalBandSpan - 40) > 0.02) {
  throw new Error(`Tropical band must track the current obliquity, got ${tropicalBandSpan}°`);
}
await beltCheckbox.uncheck();
await page.waitForTimeout(80);
if (await page.evaluate(() => layers.belts?.visible) || (await page.locator('#quick-belt').textContent()).includes('开')) {
  throw new Error('Advanced five-zone checkbox did not disable the shared layer state');
}
await page.locator('#btn-param-reset').click();
await page.locator('#sim-date-input').fill('2024-06-21');
await page.locator('#sim-time-input').fill('12:00:00');
await page.locator('#sim-time-input').dispatchEvent('change');
await page.waitForTimeout(250);
const solarNoon = await page.locator('#d-solar-noon').textContent();
if (!solarNoon || solarNoon.includes('--')) throw new Error('Solar noon was not calculated');
if (!solarNoon.includes('04:16')) throw new Error(`Unexpected Beijing summer-solstice solar noon: ${solarNoon}`);
await page.locator('button[data-panel-tab="basic"]').click();
await page.locator('#inp-lat').fill('39.90');
await page.locator('#inp-lat').dispatchEvent('input');
await page.locator('#inp-lon').fill('116.40');
await page.locator('#inp-lon').dispatchEvent('input');
const listedNoonAltitudeText = await page.locator('#d-noon-alt').textContent();
const listedNoonAltitude = Number.parseFloat(listedNoonAltitudeText);
if (!Number.isFinite(listedNoonAltitude) || Math.abs(listedNoonAltitude - 73.5) > 0.6) {
  throw new Error(`Expected listed Beijing noon altitude near 73.5°, got ${listedNoonAltitudeText}`);
}
const currentAltitudeAtUtcNoon = Number.parseFloat(await page.locator('#d-alt').textContent());
if (!Number.isFinite(currentAltitudeAtUtcNoon) || Math.abs(currentAltitudeAtUtcNoon - listedNoonAltitude) < 5) {
  throw new Error(`Current altitude must differ from noon altitude at 12:00 UTC: ${currentAltitudeAtUtcNoon} / ${listedNoonAltitude}`);
}
const noonDemoBefore = await page.evaluate(() => ({
  visible: !!document.querySelector('#noon-demo-hud') && document.querySelector('#noon-demo-hud').classList.contains('show'),
  groupVisible: !!window.__noonDemoVisible
}));
if (noonDemoBefore.visible || noonDemoBefore.groupVisible) throw new Error('Noon demo must start hidden');
await page.evaluate(() => document.querySelector('#quick-noon').click());
await page.waitForTimeout(350);
const noonDemoAfter = await page.evaluate(() => ({
  visible: !!document.querySelector('#noon-demo-hud') && document.querySelector('#noon-demo-hud').classList.contains('show'),
  groupVisible: window.__noonDemoVisible,
  label: document.querySelector('#noon-demo-value')?.textContent || ''
}));
if (!noonDemoAfter.visible || noonDemoAfter.groupVisible !== true) throw new Error('Noon demo did not activate');
if (!/°/.test(noonDemoAfter.label)) throw new Error(`Noon demo label missing angle: ${noonDemoAfter.label}`);
const noonAltitudeText = await page.locator('#d-alt').textContent();
const noonAltitude = Number.parseFloat(noonAltitudeText);
if (!Number.isFinite(noonAltitude) || Math.abs(noonAltitude - 73.5) > 0.6) {
  throw new Error(`Expected Beijing summer-solstice noon altitude near 73.5°, got ${noonAltitudeText}`);
}
await page.evaluate(() => document.querySelector('#btn-view-sun').click());
await page.waitForTimeout(260);
const noonAfterSunView = await page.evaluate(() => ({
  visible: document.querySelector('#noon-demo-hud')?.classList.contains('show'),
  groupVisible: window.__noonDemoVisible
}));
if (noonAfterSunView.visible || noonAfterSunView.groupVisible) throw new Error('Noon demo must close when leaving Earth view');
await page.evaluate(() => document.querySelector('#quick-noon').click());
await page.waitForTimeout(350);
if (!(await page.evaluate(() => window.__noonDemoVisible))) throw new Error('Noon demo did not reopen from heliocentric view');
await page.evaluate(() => document.querySelector('#quick-noon').click());
await page.waitForTimeout(120);
const noonDemoClosed = await page.evaluate(() => ({
  visible: document.querySelector('#noon-demo-hud')?.classList.contains('show'),
  groupVisible: window.__noonDemoVisible
}));
if (noonDemoClosed.visible || noonDemoClosed.groupVisible !== false) throw new Error('Noon demo did not close');
await page.locator('button[data-panel-tab="advanced"]').click();
await page.locator('#sim-date-input').fill('2024-06-21');
await page.locator('#sim-time-input').fill('12:00:00');
await page.locator('#sim-time-input').dispatchEvent('change');
await page.locator('button[data-panel-tab="basic"]').click();
await page.locator('#inp-lat').fill('90');
await page.locator('#inp-lat').dispatchEvent('input');
await page.waitForTimeout(250);
const polarDay = await page.locator('#d-sunrise').textContent();
if (!polarDay.includes('极昼')) throw new Error(`Expected polar day, got ${polarDay}`);
await page.locator('#inp-lat').fill('66');
await page.locator('#inp-lat').dispatchEvent('input');
await page.waitForTimeout(250);
const nearPolarStatus = await page.locator('#d-status').textContent();
if (!nearPolarStatus.includes('极昼')) throw new Error(`Expected standard polar-day status near Arctic Circle, got ${nearPolarStatus}`);
await page.evaluate(() => {
  const date = document.querySelector('#sim-date-input');
  const time = document.querySelector('#sim-time-input');
  const lat = document.querySelector('#inp-lat');
  date.value = '2024-12-21';
  time.value = '12:00:00';
  lat.value = '90';
  date.dispatchEvent(new Event('change', { bubbles: true }));
  time.dispatchEvent(new Event('change', { bubbles: true }));
  lat.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(250);
const polarNight = await page.locator('#d-sunrise').textContent();
const polarNightStatus = await page.locator('#d-status').textContent();
if (!polarNight.includes('极夜') || !polarNightStatus.includes('极夜')) throw new Error(`Expected polar night, got ${polarNight} / ${polarNightStatus}`);

// Solar azimuth is undefined at the geographic poles (and at the zenith).
await page.evaluate(() => {
  const date = document.querySelector('#sim-date-input');
  const time = document.querySelector('#sim-time-input');
  const lat = document.querySelector('#inp-lat');
  const lon = document.querySelector('#inp-lon');
  date.value = '2024-03-20';
  time.value = '12:00:00';
  lat.value = '90';
  lon.value = '0';
  date.dispatchEvent(new Event('change', { bubbles: true }));
  time.dispatchEvent(new Event('change', { bubbles: true }));
  lat.dispatchEvent(new Event('input', { bubbles: true }));
  lon.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(250);
const polarAzimuth = await page.locator('#d-az').textContent();
if (!polarAzimuth.includes('无定义')) throw new Error(`Expected undefined polar azimuth, got ${polarAzimuth}`);

// Southern hemisphere seasons must use the local hemisphere, not a fixed label.
await page.evaluate(() => {
  const date = document.querySelector('#sim-date-input');
  const time = document.querySelector('#sim-time-input');
  const lat = document.querySelector('#inp-lat');
  date.value = '2024-06-21';
  time.value = '12:00:00';
  lat.value = '-33.90';
  date.dispatchEvent(new Event('change', { bubbles: true }));
  time.dispatchEvent(new Event('change', { bubbles: true }));
  lat.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(250);
const southernSeason = await page.locator('#d-season').textContent();
if (!southernSeason.includes('冬季（南半球）')) throw new Error(`Expected southern-winter label, got ${southernSeason}`);

await page.locator('button[data-panel-tab="advanced"]').click();
await page.evaluate(() => {
  const date = document.querySelector('#sim-date-input');
  const time = document.querySelector('#sim-time-input');
  const lat = document.querySelector('#inp-lat');
  const lon = document.querySelector('#inp-lon');
  date.value = '2024-06-21';
  time.value = '12:00:00';
  lat.value = '66';
  lon.value = '0';
  date.dispatchEvent(new Event('change', { bubbles: true }));
  time.dispatchEvent(new Event('change', { bubbles: true }));
  lat.dispatchEvent(new Event('input', { bubbles: true }));
  lon.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(250);
const obliquityRange = page.locator('#quick-obliquity-range');
await obliquityRange.fill('0');
await obliquityRange.dispatchEvent('input');
await page.waitForTimeout(250);
const zeroObliquity = await page.evaluate(() => ({
  altitude: document.querySelector('#d-alt')?.textContent,
  standardDay: document.querySelector('#d-day-standard')?.textContent
}));
if (!zeroObliquity.altitude || !zeroObliquity.standardDay || zeroObliquity.standardDay === '--') {
  throw new Error(`Obliquity recalculation did not produce data: ${JSON.stringify(zeroObliquity)}`);
}
const zeroAltitude = Number.parseFloat(zeroObliquity.altitude);
if (!Number.isFinite(zeroAltitude) || zeroAltitude < 20 || zeroAltitude > 28) {
  throw new Error(`Solar altitude still uses stale obliquity: ${zeroObliquity.altitude}`);
}
if (await page.locator('#inquiry-select').count() !== 1 || await page.locator('#comparison-table').count() !== 1) {
  throw new Error('Teaching inquiry controls are missing');
}
if (await page.locator('#comparison-body tr').count() !== 4) throw new Error('Latitude comparison table is incomplete');
await page.locator('#time-zone-select').selectOption('beijing');
await page.waitForTimeout(100);
const beijingEvent = await page.locator('#d-solar-noon').textContent();
if (!beijingEvent.includes('UTC+8')) throw new Error(`Timezone selector did not change event basis: ${beijingEvent}`);
await page.locator('#time-zone-select').selectOption('true-solar');
await page.waitForTimeout(100);
const trueSolarNoon = await page.locator('#d-solar-noon').textContent();
if (!trueSolarNoon.includes('12:00 真太阳时')) throw new Error(`True solar noon did not normalize to 12:00: ${trueSolarNoon}`);

// At 2024-06-21 12:00 UTC the subsolar longitude is near Greenwich.
await page.evaluate(() => {
  const date = document.querySelector('#sim-date-input');
  const time = document.querySelector('#sim-time-input');
  const lat = document.querySelector('#inp-lat');
  const lon = document.querySelector('#inp-lon');
  date.value = '2024-06-21';
  time.value = '12:00:00';
  lat.value = '0';
  lon.value = '0';
  date.dispatchEvent(new Event('change', { bubbles: true }));
  time.dispatchEvent(new Event('change', { bubbles: true }));
  lat.dispatchEvent(new Event('input', { bubbles: true }));
  lon.dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(250);
const subsolarLongitude = await page.locator('#d-sublon').textContent();
const subsolarDegrees = Number.parseFloat(subsolarLongitude);
if (!Number.isFinite(subsolarDegrees) || Math.abs(subsolarDegrees) > 2) {
  throw new Error(`Subsolar longitude is not aligned with Greenwich at 12:00 UTC: ${subsolarLongitude}; date=${await page.locator('#d-date').textContent()}; time=${await page.locator('#d-time').textContent()}; lat=${await page.locator('#d-sublat').textContent()}`);
}

// Latitude bands and the displayed obliquity must follow the simulation epoch.
await page.locator('#btn-param-reset').click();
await page.evaluate(() => {
  const date = document.querySelector('#sim-date-input');
  const time = document.querySelector('#sim-time-input');
  date.value = '2035-12-31';
  time.value = '12:00:00';
  date.dispatchEvent(new Event('change', { bubbles: true }));
  time.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.waitForTimeout(250);
const futureObliquity = Number.parseFloat(await page.locator('#d-eps').textContent());
if (!Number.isFinite(futureObliquity) || futureObliquity >= 23.44) {
  throw new Error(`Obliquity bands did not follow the 2035 epoch: ${futureObliquity}`);
}
await obliquityRange.fill('23.44');
await obliquityRange.dispatchEvent('input');
await page.waitForTimeout(250);
const solsticeSubsolarLatitude = await page.locator('#d-sublat').textContent();
const solsticeLatitudeDegrees = Number.parseFloat(solsticeSubsolarLatitude);
if (!Number.isFinite(solsticeLatitudeDegrees) || solsticeLatitudeDegrees < 22 || solsticeLatitudeDegrees > 24.5) {
  throw new Error(`Expected June-solstice subsolar latitude near 23.4°N, got ${solsticeSubsolarLatitude}`);
}

// Automatic revolution must respect the documented 2000-2035 simulation range.
await page.evaluate(() => {
  const date = document.querySelector('#sim-date-input');
  const time = document.querySelector('#sim-time-input');
  date.value = '2035-12-31';
  time.value = '23:59:00';
  date.dispatchEvent(new Event('change', { bubbles: true }));
  time.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.waitForTimeout(100);
const revolutionButton = page.locator('#btn-rev-play');
if ((await revolutionButton.textContent()).includes('播放')) {
  await page.evaluate(() => document.querySelector('#btn-rev-play').click());
}
await page.waitForTimeout(900);
const boundedDate = await page.locator('#d-date').textContent();
if (boundedDate > '2035-12-31') throw new Error(`Simulation exceeded documented end date: ${boundedDate}`);
await page.locator('#inquiry-select').selectOption('beijing-summer');
await page.locator('#inquiry-load').click();
await page.locator('#inquiry-prediction').fill('0');
await page.locator('#inquiry-check').click();
const inquiryResult = await page.locator('#inquiry-result').textContent();
if (!inquiryResult.includes('需要修正')) throw new Error(`Inquiry validation did not explain an incorrect prediction: ${inquiryResult}`);
const lock = page.locator('#quick-time-lock');
if ((await lock.textContent()).includes('开')) await lock.click();
const beforeRotation = await page.locator('#d-sublon').textContent();
await page.waitForTimeout(500);
const afterRotation = await page.locator('#d-sublon').textContent();
if (beforeRotation === afterRotation) throw new Error(`Independent rotation did not advance: ${beforeRotation}`);
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto('http://127.0.0.1:8000/index.html');
await mobile.waitForTimeout(900);
const mobileLayout = await mobile.evaluate(() => {
  const science = document.querySelector('#science-data').getBoundingClientRect();
  const dock = document.querySelector('#studio-dock').getBoundingClientRect();
  return { scienceBottom: science.bottom, dockTop: dock.top, scienceWidth: science.width };
});
if (mobileLayout.scienceBottom >= mobileLayout.dockTop - 4 || mobileLayout.scienceWidth < 300) {
  throw new Error(`Mobile science card overlaps the dock: ${JSON.stringify(mobileLayout)}`);
}
await mobile.close();
if (pageErrors.length) throw new Error(`Unexpected page errors: ${pageErrors.join(' | ')}`);
console.log(JSON.stringify({ solarNoon, polarDay, beforeRotation, afterRotation }));
await browser.close();
process.exit(0);
