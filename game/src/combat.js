// On-foot combat: 3 weapon slots, hitscan shots, rival enemies.
import * as THREE from 'three';
import { S } from './config.js';

export const WEAPONS = {
  1: { name: 'Pistol', dmg: 34, rate: 0.28, spread: 0.01, auto: false },
  2: { name: 'SMG', dmg: 16, rate: 0.09, spread: 0.05, auto: true },
  3: { name: 'Shotgun', dmg: 22, rate: 0.8, spread: 0.12, auto: false, pellets: 5 },
};
export class Enemies {
  constructor(scene) { this.scene = scene; this.list = []; this.lastShot = 0; }
  spawnRivals(n, x, z) {
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.7, 0.5), new THREE.MeshLambertMaterial({ color: 0x8a2a2a }));
      body.position.y = 1.1; g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), new THREE.MeshLambertMaterial({ color: 0xd9a986 }));
      head.position.y = 2.2; g.add(head);
      const px = x + (Math.random() - 0.5) * 18, pz = z + (Math.random() - 0.5) * 18;
      g.position.set(px, 0, pz); this.scene.add(g);
      this.list.push({ mesh: g, x: px, z: pz, hp: 100, t: Math.random() * 10 });
    }
  }
  clear() { for (const e of this.list) this.scene.remove(e.mesh); this.list = []; }
  // player fires from camera direction; returns kills this shot
  fire(player, heading, now) {
    const w = WEAPONS[S.weapon];
    if (now - this.lastShot < w.rate) return 0;
    this.lastShot = now;
    let kills = 0;
    const pellets = w.pellets || 1;
    for (let p = 0; p < pellets; p++) {
      const a = heading + (Math.random() - 0.5) * w.spread * 4;
      let best = null, bd = 60;
      for (const e of this.list) {
        const dx = e.x - player.x, dz = e.z - player.z, d = Math.hypot(dx, dz);
        if (d > 60) continue;
        const ang = Math.atan2(dx, dz); let diff = ang - a; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
        if (Math.abs(diff) < 0.12 && d < bd) { bd = d; best = e; }
      }
      if (best) {
        best.hp -= w.dmg;
        if (best.hp <= 0) { this.scene.remove(best.mesh); this.list.splice(this.list.indexOf(best), 1); S.kills++; kills++; }
      }
    }
    return kills;
  }
  update(dt, player) {
    for (const e of this.list) {
      e.t += dt;
      const dx = player.x - e.x, dz = player.z - e.z, d = Math.hypot(dx, dz) || 1;
      if (d > 3) { e.x += (dx / d) * 2.2 * dt; e.z += (dz / d) * 2.2 * dt; }
      else { S.health = Math.max(0, S.health - 9 * dt); }
      e.mesh.position.set(e.x, 0, e.z);
      e.mesh.rotation.y = Math.atan2(dx, dz);
    }
  }
}
