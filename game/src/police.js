// 5-star CVPD dispatch: pursuit cars, roadblocks, CONDOR-2 helicopter.
import * as THREE from 'three';
import { S } from './config.js';
import { Car, makeCarMesh } from './vehicles.js';

export class Police {
  constructor(scene) {
    this.scene = scene; this.cars = []; this.blocks = []; this.heli = null; this.heliMesh = null;
    this.spawnT = 0; this.dispatchMsg = '';
  }
  setWanted(n, player, colliders) {
    S.wanted = Math.max(0, Math.min(5, n));
    if (S.wanted === 0) this.clear();
    else this.dispatchMsg = ['CVPD: all clear.', 'CVPD: suspect spotted, one unit responding.', 'CVPD: pursuit in progress.', 'CVPD: roadblocks up — CONDOR-2 airborne, three stars.', 'CONDOR-2 overhead. Four stars, do not lose him.', 'CVPD: maximum alert. All units converge.'][S.wanted];
  }
  clear() { for (const c of this.cars) this.scene.remove(c.mesh); this.cars = []; for (const b of this.blocks) this.scene.remove(b); this.blocks = []; if (this.heliMesh) { this.scene.remove(this.heliMesh); this.heliMesh = null; this.heli = null; } }
  ensure(scene, player, colliders) {
    const want = S.wanted;
    const targetCars = want >= 1 ? Math.min(want, 4) : 0;
    while (this.cars.length < targetCars) {
      const a = Math.random() * Math.PI * 2;
      const c = new Car(scene, 0x1a1a22, player.x + Math.sin(a) * 30, player.z + Math.cos(a) * 30, a, 30 + want * 2);
      c.mesh.children[0].material = new THREE.MeshLambertMaterial({ color: 0x1a1a22 });
      // police light bar
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.22, 0.5), new THREE.MeshBasicMaterial({ color: 0xff2222 }));
      bar.position.set(0, 1.75, -0.2); c.mesh.add(bar);
      this.cars.push(c);
    }
    while (this.cars.length > targetCars) { const c = this.cars.pop(); scene.remove(c.mesh); }
    // Roadblocks at 3+ stars: two parked cars across the road ahead of the player
    if (want >= 3 && this.blocks.length === 0) {
      for (const off of [-4, 4]) {
        const m = makeCarMesh(0xe8e8e8, true); // white roadblock car: reads against dark asphalt
        m.position.set(player.x + Math.sin(player.heading) * 26 + off, 0, player.z + Math.cos(player.heading) * 26);
        m.rotation.y = player.heading + Math.PI / 2; scene.add(m); this.blocks.push(m);
      }
    }
    if (want < 3 && this.blocks.length) { for (const b of this.blocks) scene.remove(b); this.blocks = []; }
    // CONDOR-2 helicopter at 3+ stars, hovering ahead of the player so it reads on screen
    if (want >= 3 && !this.heliMesh) {
      const g = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6, 6), new THREE.MeshLambertMaterial({ color: 0x5a7a9a }));
      g.add(body);
      const rotor = new THREE.Mesh(new THREE.BoxGeometry(9, 0.12, 0.5), new THREE.MeshLambertMaterial({ color: 0x111111 }));
      rotor.position.y = 1.1; rotor.name = 'rotor'; g.add(rotor);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(5, 30, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2b0, transparent: true, opacity: 0.22, side: THREE.DoubleSide }));
      cone.rotation.x = Math.PI; cone.position.y = -16; g.add(cone);
      g.position.set(player.x + Math.sin(player.heading) * 34, 22, player.z + Math.cos(player.heading) * 34); scene.add(g); this.heliMesh = g; this.heli = { x: player.x, z: player.z };
    }
    if (want < 3 && this.heliMesh) { scene.remove(this.heliMesh); this.heliMesh = null; this.heli = null; }
  }
  update(dt, player, colliders) {
    this.ensure(this.scene, player, colliders);
    for (const c of this.cars) {
      const dx = player.x - c.x, dz = player.z - c.z, d = Math.hypot(dx, dz) || 1;
      const want = Math.atan2(dx, dz);
      let diff = want - c.heading; while (diff > Math.PI) diff -= 2 * Math.PI; while (diff < -Math.PI) diff += 2 * Math.PI;
      c.drive(dt, 0.9, Math.max(-1, Math.min(1, diff * 2.5)), colliders);
      if (d < 3.2) { S.health = Math.max(0, S.health - 12 * dt); } // ram damage
    }
    if (this.heliMesh) {
      const hx = player.x + Math.sin(player.heading) * 34, hz = player.z + Math.cos(player.heading) * 34;
      this.heliMesh.position.x += (hx - this.heliMesh.position.x) * dt * 1.2;
      this.heliMesh.position.z += (hz - this.heliMesh.position.z) * dt * 1.2;
      this.heliMesh.position.y = 22 + Math.sin(performance.now() / 700) * 2;
      const r = this.heliMesh.getObjectByName('rotor'); if (r) r.rotation.y += dt * 20;
    }
    // heat decay when far from police and not committing crimes
    if (S.wanted > 0) { S.wantedHeat += dt; if (S.wantedHeat > 25) { S.wantedHeat = 0; this.setWanted(S.wanted - 1, player, colliders); } }
  }
}
