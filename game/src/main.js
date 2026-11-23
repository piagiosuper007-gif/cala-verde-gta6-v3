// CALA VERDE — main loop, states, saves, glue. Fresh build, 2026-11-23.
import * as THREE from 'three';
import { S, CFG, MISSIONS, CARS } from './config.js';
import { createScene, updateCamera } from './render.js';
import { buildWorld, collideCircle } from './world.js';
import { bindInput, keys, axis } from './input.js';
import { Car, spawnTraffic, updateTraffic, nearestCar } from './vehicles.js';
import { Police } from './police.js';
import { Enemies, WEAPONS } from './combat.js';
import { mission, missionTarget, startMission, makeBeacon, checkProgress, completeMission } from './missions.js';
import { updateHUD, showBanner, drawMinimap } from './hud.js';
import { ensureAudio, setEngine, playSiren, playShot, cycleRadio } from './audio.js';
import { useAbility, updateCrew, speedBoost } from './crew.js';
import { applyShot } from './shots.js';

const SAVE_KEY = 'calaverde-save-v3';
const canvas = document.getElementById('c');
const { renderer, scene, camera } = createScene(canvas);
const { colliders, buildingCount } = buildWorld(scene, S.seed);
const beacon = makeBeacon(scene);
const police = new Police(scene);
const enemies = new Enemies(scene);
const traffic = spawnTraffic(scene, S.seed);
const game = { scene, camera, colliders, traffic, police, camOrbit: false, playerMesh: null, startGame, enterCar };
window.__cvGame = game;

// Player on-foot mesh
const playerMesh = new THREE.Group();
const pBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 0.5), new THREE.MeshLambertMaterial({ color: 0x2e7fb8 }));
pBody.position.y = 1.05; playerMesh.add(pBody);
const pHead = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), new THREE.MeshLambertMaterial({ color: 0xd9a986 }));
pHead.position.y = 2.1; playerMesh.add(pHead);
playerMesh.position.set(S.player.x, 0, S.player.z); scene.add(playerMesh);
game.playerMesh = playerMesh;

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ cash: S.cash, missionIdx: S.missionIdx, carsOwned: S.carsOwned, health: S.health })); } catch (e) {}
}
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (d) { S.cash = d.cash ?? S.cash; S.missionIdx = d.missionIdx ?? 0; S.carsOwned = d.carsOwned ?? S.carsOwned; }
  } catch (e) {}
}

function startGame() {
  load();
  document.getElementById('title').style.display = 'none';
  document.getElementById('complete').style.display = 'none';
  S.mode = 'playing'; S.startedAt = performance.now();
  const m = mission();
  if (m) { startMission(m, beacon); if (m.type === 'escape') police.setWanted(3, S.player); if (m.type === 'combat') enemies.spawnRivals(4, CFG.docks.x, CFG.docks.z); }
  ensureAudio();
  showBanner(m ? `JOB ${m.id}/8 — ${m.title}` : 'CALA VERDE');
}
function enterCar(car) {
  if (!car) return false;
  if (Math.hypot(car.x - S.player.x, car.z - S.player.z) > 12) { car.x = S.player.x + 3; car.z = S.player.z + 3; car.mesh.position.set(car.x, 0, car.z); }
  S.player.inCar = car; playerMesh.visible = false;
  S.player.heading = car.heading;
  return true;
}
function exitCar() {
  const car = S.player.inCar; if (!car) return;
  S.player.inCar = null; playerMesh.visible = true;
  S.player.x = car.x + Math.sin(car.heading + Math.PI / 2) * 3;
  S.player.z = car.z + Math.cos(car.heading + Math.PI / 2) * 3;
  S.player.heading = car.heading;
  playerMesh.position.set(S.player.x, 0, S.player.z);
}
function fire() {
  if (S.mode !== 'playing') return;
  const now = performance.now() / 1000;
  const k = enemies.fire(S.player, S.player.heading, now);
  playShot();
  if (k > 0 && S.wanted < 2) police.setWanted(2, S.player);
}
function die(kind) {
  S.mode = kind; // 'busted' | 'wasted'
  showBanner(kind === 'busted' ? 'BUSTED — the CVPD got you. -$100' : 'WASTED — you got flattened. -$100', 3000);
  S.cash = Math.max(0, S.cash - 100); S.health = 100; police.setWanted(0, S.player);
  if (S.player.inCar) exitCar();
  S.player.x = 0; S.player.z = 24; S.player.heading = 0;
  playerMesh.position.set(0, 0, 24);
  setTimeout(() => { if (S.mode === kind) { S.mode = 'playing'; } }, 3000);
}

bindInput(canvas, fire, (k) => {
  if (k === 'enter') {
    ensureAudio();
    if (S.mode === 'title') startGame();
    else if (S.mode === 'complete') { document.getElementById('complete').style.display = 'none'; S.mode = 'playing'; const m = mission(); if (m) startMission(m, beacon); }
  }
  if (k === 'p' && S.mode === 'playing') { S.mode = 'paused'; showBanner('PAUSED — press P to resume'); }
  else if (k === 'p' && S.mode === 'paused') S.mode = 'playing';
  if (S.mode !== 'playing') return;
  if (k === 'e') {
    if (S.player.inCar) exitCar();
    else {
      const car = nearestCar(traffic, S.player.x, S.player.z, 5) || nearestCar(police.cars, S.player.x, S.player.z, 5);
      if (car) {
        const stolen = !traffic.includes(car) || traffic.indexOf(car) >= 0;
        enterCar(car);
        const m = mission();
        if (m && m.type === 'steal') { if (S.wanted < 1) police.setWanted(1, S.player); }
        else if (stolen && S.wanted < 1) police.setWanted(1, S.player);
        showBanner('Car taken — the CVPD noticed.');
      }
    }
  }
  if (k === 'f') fire();
  if (k === 'q') { const msg = useAbility(police, S.player); S.dialogue = msg; setTimeout(() => { if (S.dialogue === msg) S.dialogue = ''; }, 3500); }
  if (k === 'r') { const n = cycleRadio(); S.dialogue = '♪ ' + n; setTimeout(() => { if (S.dialogue.startsWith('♪')) S.dialogue = ''; }, 2500); }
  if (k === 'm') { S.muted = !S.muted; }
  if (k === '1' || k === '2' || k === '3') S.weapon = Number(k);
});

// Test / shot hooks (headless playtest uses these)
window.__cv = {
  S, start: startGame, fire, enterCar, exitCar,
  setWanted: (n) => police.setWanted(n, S.player),
  teleport: (x, z) => { if (S.player.inCar) { S.player.inCar.x = x; S.player.inCar.z = z; S.player.inCar.mesh.position.set(x, 0, z); } S.player.x = x; S.player.z = z; playerMesh.position.set(x, 0, z); },
  police, enemies, traffic, mission, buildingCount,
  completeNow: () => { const m = mission(); if (m) { const nx = completeMission(m); S.mode = 'complete'; return nx; } return null; },
};

const clock = new THREE.Clock();
let sirenT = 0;
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.1, clock.getDelta());
  S.frames++;
  if (S.mode === 'title' && game.camOrbit) {
    const a = performance.now() / 9000;
    camera.position.set(Math.sin(a) * 160, 55, Math.cos(a) * 160);
    camera.lookAt(0, 10, 40);
    renderer.render(scene, camera);
    if (S.frames >= 5) window.__shotReady = true;
    return;
  }
  if (S.mode !== 'playing') {
    if (S.mode === 'complete') { renderer.render(scene, camera); if (S.frames >= 5) window.__shotReady = true; }
    else { renderer.render(scene, camera); if (S.frames >= 5) window.__shotReady = true; }
    return;
  }
  S.time += dt * 0.02; if (S.time >= 24) S.time = 0;
  updateCrew(dt);
  const ax = axis();
  if (S.player.inCar) {
    const car = S.player.inCar;
    car.top = (CARS.find((c) => c.name === (S.carsOwned[0] || 'Comet'))?.top || CFG.carMax) * speedBoost();
    car.drive(dt, ax.f, -ax.s, colliders);
    S.player.x = car.x; S.player.z = car.z; S.player.heading = car.heading; S.player.speed = car.speed;
    setEngine(car.speed, true);
  } else {
    const sp = (ax.run ? CFG.runSpeed : CFG.playerSpeed);
    let mx = 0, mz = 0;
    if (ax.f) { mx += Math.sin(S.player.heading) * ax.f; mz += Math.cos(S.player.heading) * ax.f; }
    if (ax.s) { mx += Math.sin(S.player.heading + Math.PI / 2) * ax.s; mz += Math.cos(S.player.heading + Math.PI / 2) * ax.s; }
    const len = Math.hypot(mx, mz) || 1;
    const nx = S.player.x + (mx / len) * sp * dt * (mx || mz ? 1 : 0);
    const nz = S.player.z + (mz / len) * sp * dt * (mx || mz ? 1 : 0);
    const hit = collideCircle(colliders, nx, nz, 0.7);
    if (!hit.hit) { S.player.x = nx; S.player.z = nz; }
    if (ax.s) S.player.heading += ax.s * dt * 2.2;
    S.player.speed = (mx || mz) ? sp : 0;
    playerMesh.position.set(S.player.x, 0, S.player.z);
    playerMesh.rotation.y = S.player.heading;
    setEngine(0, false);
  }
  updateTraffic(traffic, dt, colliders);
  police.update(dt, S.player, colliders);
  enemies.update(dt, S.player);
  if (S.wanted >= 1) { sirenT += dt; if (sirenT > 3) { sirenT = 0; playSiren(); } }
  // Mission progress
  const m = mission();
  if (m) {
    const res = checkProgress(m, S.player, enemies, police);
    const t = missionTarget(m);
    beacon.position.set(t.x, 2, t.z);
    beacon.rotation.y += dt;
    if (res === 'stage') { const nt = missionTarget(m); beacon.position.set(nt.x, 2, nt.z); save(); }
    if (res === 'done') {
      const nx = completeMission(m);
      save();
      if (!nx) {
        S.mode = 'complete';
        document.getElementById('completetext').textContent = `All 8 jobs done. Cala Verde is yours — $${S.cash} in the pocket, the sun still golden. Thanks for playing.`;
        document.getElementById('complete').style.display = 'flex';
      } else {
        showBanner(`MISSION COMPLETE — ${m.title}  +$${m.reward}`);
        startMission(nx, beacon);
        if (nx.type === 'escape') police.setWanted(3, S.player);
        if (nx.type === 'combat') enemies.spawnRivals(4, CFG.docks.x, CFG.docks.z);
      }
    }
  }
  if (S.health <= 0) { die('wasted'); return; }
  // Busted: police car rams player on foot at 3+ stars
  if (!S.player.inCar && S.wanted >= 3) {
    for (const c of police.cars) if (Math.hypot(c.x - S.player.x, c.z - S.player.z) < 2.5) { die('busted'); return; }
  }
  updateCamera(camera, S.player, !!S.player.inCar, dt);
  const t2 = missionTarget(m);
  updateHUD(police.dispatchMsg);
  if (t2) drawMinimap(S.player, traffic, police, enemies, t2);
  renderer.render(scene, camera);
  if (S.frames >= 5) window.__shotReady = true;
}
const isShot = applyShot(game);
if (!isShot) { /* normal title screen */ }
animate();
