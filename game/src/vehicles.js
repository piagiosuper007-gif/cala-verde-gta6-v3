// Arcade cars: player car, traffic AI, enter/exit.
import * as THREE from 'three';
import { CFG, S, CARS } from './config.js';
import { mulberry32, range } from './random.js';
import { collideCircle } from './world.js';

export function makeCarMesh(color, isPolice = false) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 4.4), new THREE.MeshLambertMaterial({ color }));
  body.position.y = 0.65; g.add(body);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.65, 2.2), new THREE.MeshLambertMaterial({ color: 0x22242e }));
  cab.position.set(0, 1.3, -0.2); g.add(cab);
  const wheelMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
  const wg = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10); wg.rotateZ(Math.PI / 2);
  for (const [x, z] of [[-1, 1.4], [1, 1.4], [-1, -1.4], [1, -1.4]]) {
    const w = new THREE.Mesh(wg, wheelMat); w.position.set(x, 0.42, z); g.add(w);
  }
  if (isPolice) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 0.5), new THREE.MeshBasicMaterial({ color: 0x2244ff }));
    bar.position.set(0, 1.75, -0.2); g.add(bar);
  }
  return g;
}

export class Car {
  constructor(scene, color, x, z, heading, top) {
    this.mesh = makeCarMesh(color); this.mesh.position.set(x, 0, z);
    this.mesh.rotation.y = heading; scene.add(this.mesh);
    this.x = x; this.z = z; this.heading = heading; this.speed = 0; this.top = top || CFG.carMax;
  }
  get pos() { return { x: this.x, z: this.z }; }
  drive(dt, throttle, steer, colliders) {
    this.speed += throttle * CFG.carAccel * dt;
    this.speed -= this.speed * 0.9 * dt;
    if (throttle === 0) this.speed -= Math.sign(this.speed) * 6 * dt;
    this.speed = Math.max(-10, Math.min(this.top, this.speed));
    this.heading += steer * dt * (1.6 + Math.abs(this.speed) * 0.02) * Math.sign(this.speed || 1);
    const nx = this.x + Math.sin(this.heading) * this.speed * dt;
    const nz = this.z + Math.cos(this.heading) * this.speed * dt;
    const hit = collideCircle(colliders, nx, nz, 1.8);
    if (!hit.hit) { this.x = nx; this.z = nz; } else { this.speed *= 0.4; }
    this.x = Math.max(-210, Math.min(210, this.x));
    this.z = Math.max(-210, Math.min(215, this.z));
    this.mesh.position.set(this.x, 0, this.z); this.mesh.rotation.y = this.heading;
  }
}

export function spawnTraffic(scene, seed) {
  const rng = mulberry32(seed + 77);
  const cars = [];
  const colors = [0xc0c0c8, 0x3a6ea5, 0x8a4a3a, 0xd8c84a, 0x4a7a5a, 0x7a5a8a];
  for (let i = 0; i < 10; i++) {
    const gx = (Math.floor(rng() * 9) - 4) * CFG.block;
    const gz = (Math.floor(rng() * 9) - 4) * CFG.block;
    const c = new Car(scene, colors[i % colors.length], gx + range(rng, -4, 4), gz + range(rng, -4, 4), rng() * Math.PI * 2, 14);
    c.wp = { x: gx, z: gz }; c.speed = 8 + rng() * 5;
    cars.push(c);
  }
  return cars;
}
export function updateTraffic(cars, dt, colliders) {
  for (const c of cars) {
    // waypoint cruise along the grid: steer toward waypoint, retarget on arrival
    const dx = c.wp.x - c.x, dz = c.wp.z - c.z;
    const d = Math.hypot(dx, dz);
    if (d < 8) { c.wp = { x: (Math.floor(Math.random() * 9) - 4) * CFG.block, z: (Math.floor(Math.random() * 9) - 4) * CFG.block }; continue; }
    const want = Math.atan2(dx, dz);
    let diff = want - c.heading; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
    c.drive(dt, 0.4, Math.max(-1, Math.min(1, diff * 2)), colliders);
    c.speed = Math.max(6, Math.min(12, c.speed));
  }
}
export function nearestCar(cars, x, z, maxD) {
  let best = null, bd = maxD;
  for (const c of cars) { const d = Math.hypot(c.x - x, c.z - z); if (d < bd) { bd = d; best = c; } }
  return best;
}
