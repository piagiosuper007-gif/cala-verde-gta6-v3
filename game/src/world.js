// Procedural Cala Verde: street grid, ~120 buildings, palms, lamps, beach + sea, marina, plaza.
import * as THREE from 'three';
import { CFG } from './config.js';
import { mulberry32, range, irange, pick } from './random.js';

function buildingTexture(rng, base) {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128;
  const g = cv.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, 64, 128);
  for (let y = 8; y < 120; y += 14) for (let x = 6; x < 58; x += 12) {
    g.fillStyle = rng() < 0.5 ? '#ffe9a8' : '#2c2c38';
    g.fillRect(x, y, 8, 9);
  }
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function buildWorld(scene, seed) {
  const rng = mulberry32(seed);
  const colliders = []; // {x0,z0,x1,z1}
  const palette = ['#e8a06a', '#d98a5f', '#c97e6b', '#e5c07a', '#b8a88e', '#a86f5c', '#d9b48a', '#8fa3b8'];
  // Ground + roads
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(560, 560), new THREE.MeshLambertMaterial({ color: 0x6b7a52 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -0.05, 20); scene.add(ground);
  const roadMat = new THREE.MeshLambertMaterial({ color: CFG.colors.road });
  for (let i = -4; i <= 4; i++) {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(CFG.roadW, 420), roadMat);
    v.rotation.x = -Math.PI / 2; v.position.set(i * CFG.block, 0, 0); scene.add(v);
    const h = new THREE.Mesh(new THREE.PlaneGeometry(420, CFG.roadW), roadMat);
    h.rotation.x = -Math.PI / 2; h.position.set(0, 0, i * CFG.block); scene.add(h);
  }
  // Beach + sea (south, +z)
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(560, 46), new THREE.MeshLambertMaterial({ color: CFG.colors.sand }));
  sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0.02, CFG.beachZ); scene.add(sand);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(560, 160), new THREE.MeshLambertMaterial({ color: CFG.colors.sea }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.01, 290); scene.add(sea);
  // Marina piers (east)
  const pierMat = new THREE.MeshLambertMaterial({ color: 0x8a6b4a });
  for (let i = 0; i < 3; i++) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(8, 1, 40), pierMat);
    pier.position.set(185 + i * 14, 0.5, 20 + i * 30); scene.add(pier);
    for (let j = 0; j < 3; j++) {
      const boat = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 10), new THREE.MeshLambertMaterial({ color: 0xf5f0e6 }));
      boat.position.set(185 + i * 14, 1.2, 8 + j * 14 + i * 30); scene.add(boat);
    }
  }
  // Buildings sit INSIDE blocks (centres offset +20 from road centrelines), never on roads.
  const geoBox = new THREE.BoxGeometry(1, 1, 1);
  let count = 0;
  for (let gx = -4; gx <= 3; gx++) for (let gz = -4; gz <= 3; gz++) {
    const cx = gx * CFG.block + 20, cz = gz * CFG.block + 20;
    if (Math.abs(cx) < 25 && Math.abs(cz) < 25) continue; // plaza
    if (cz > 170) continue;
    const n = 2;
    for (let k = 0; k < n; k++) {
      const ox = range(rng, -6, 6), oz = range(rng, -6, 6);
      if (Math.abs(ox) < 2 && Math.abs(oz) < 2) continue; // keep a gap between the pair
      const w = range(rng, 10, 14), d = range(rng, 10, 14), h = range(rng, 8, 34);
      const mat = new THREE.MeshLambertMaterial({ map: buildingTexture(rng, pick(rng, palette)) });
      const b = new THREE.Mesh(geoBox, mat);
      b.scale.set(w, h, d); b.position.set(cx + ox, h / 2, cz + oz); scene.add(b);
      // rooftop prop
      if (rng() < 0.5) { const p = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 3), new THREE.MeshLambertMaterial({ color: 0x555560 })); p.position.set(cx + ox, h + 1, cz + oz); scene.add(p); }
      colliders.push({ x0: cx + ox - w / 2, x1: cx + ox + w / 2, z0: cz + oz - d / 2, z1: cz + oz + d / 2 });
      count++;
    }
  }
  // Palms along beach + plaza
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x7a5a38 });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x3f7a3a });
  function palm(x, z) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 7, 6), trunkMat);
    t.position.set(x, 3.5, z); scene.add(t);
    const l = new THREE.Mesh(new THREE.ConeGeometry(3.2, 3.5, 6), leafMat);
    l.position.set(x, 8.2, z); scene.add(l);
  }
  for (let x = -180; x <= 180; x += 22) palm(x, 176);
  for (let i = 0; i < 8; i++) palm(Math.cos(i * 0.8) * 20, Math.sin(i * 0.8) * 20);
  // Street lamps
  const lampMat = new THREE.MeshLambertMaterial({ color: 0x333338 });
  const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe9a8 });
  for (let gx = -4; gx <= 4; gx++) for (let gz = -4; gz <= 4; gz++) {
    if ((gx + gz) % 2) continue;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 6, 6), lampMat);
    pole.position.set(gx * CFG.block + 6, 3, gz * CFG.block + 6); scene.add(pole);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), bulbMat);
    bulb.position.set(gx * CFG.block + 6, 6.2, gz * CFG.block + 6); scene.add(bulb);
  }
  // Plaza fountain
  const f = new THREE.Mesh(new THREE.CylinderGeometry(6, 7, 1.2, 16), new THREE.MeshLambertMaterial({ color: 0x9ab8c8 }));
  f.position.set(0, 0.6, 0); scene.add(f);
  colliders.push({ x0: -7, x1: 7, z0: -7, z1: 7 });
  return { colliders, buildingCount: count };
}
export function collideCircle(colliders, x, z, r) {
  for (const c of colliders) {
    const nx = Math.max(c.x0, Math.min(x, c.x1)), nz = Math.max(c.z0, Math.min(z, c.z1));
    const dx = x - nx, dz = z - nz;
    if (dx * dx + dz * dz < r * r) return { hit: true, nx, nz, dx, dz };
  }
  return { hit: false };
}
