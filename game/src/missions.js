// 8 story jobs: markers, objectives, dialogue, rewards.
import * as THREE from 'three';
import { S, MISSIONS, CFG } from './config.js';

export function mission() { return MISSIONS[S.missionIdx] || null; }
export function missionTarget(m) {
  if (!m) return null;
  if (m.type === 'race') return raceGate(S.raceCp);
  if (m.type === 'pickup' && S.missionStage === 1) return CFG.hideout;
  if (m.type === 'deliver' && S.missionStage === 1) return CFG.marina;
  if (m.type === 'heist' && S.missionStage === 1) return CFG.hideout;
  if (m.type === 'escape') return CFG.hideout;
  return m.target;
}
export function raceGate(i) {
  const gates = [{ x: 40, z: -40 }, { x: -40, z: -80 }, { x: -120, z: 0 }, { x: 0, z: 80 }, { x: 80, z: -40 }];
  return gates[Math.min(i, gates.length - 1)];
}
export function startMission(m, beacon) {
  S.missionStage = 0; S.raceCp = 0; S.kills = 0; S.evadeT = 0;
  S.objective = m.text; S.dialogue = m.lines[0] || '';
  if (m.type === 'escape') { /* wanted set by main when mission starts */ }
  if (beacon) beacon.position.set(missionTarget(m).x, 2, missionTarget(m).z);
}
export function makeBeacon(scene) {
  const g = new THREE.Group();
  const cyl = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 14, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd94a, transparent: true, opacity: 0.35, side: THREE.DoubleSide }));
  cyl.position.y = 7; g.add(cyl);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.25, 8, 24), new THREE.MeshBasicMaterial({ color: 0xffd94a }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.3; g.add(ring);
  scene.add(g); return g;
}
export function checkProgress(m, player, enemies, police) {
  if (!m) return null;
  const t = missionTarget(m);
  const d = Math.hypot(player.x - t.x, player.z - t.z);
  const near = d < 6;
  if (m.type === 'goto' && near) return 'done';
  if (m.type === 'steal' && player.inCar && near) return 'done';
  if (m.type === 'pickup') { if (S.missionStage === 0 && near) { S.missionStage = 1; S.objective = 'Deliver the parcel to the hideout (north-west).'; S.dialogue = 'Parcel secured. Now the hideout.'; return 'stage'; } if (S.missionStage === 1 && near) return 'done'; }
  if (m.type === 'race') { if (near) { S.raceCp++; if (S.raceCp >= 5) return 'done'; S.objective = `Race checkpoint ${S.raceCp + 1}/5 — follow the gold beacon.`; return 'stage'; } }
  if (m.type === 'combat' && S.kills >= 4) return 'done';
  if (m.type === 'deliver') { if (S.missionStage === 0 && near) { S.missionStage = 1; S.objective = 'Mara is riding with you — drive her to the marina.'; S.dialogue = 'Mara: "Finally. Marina, driver."'; return 'stage'; } if (S.missionStage === 1 && near && player.inCar) return 'done'; }
  if (m.type === 'escape') { if (near && S.wanted === 0) return 'done'; if (near && S.wanted > 0) { S.evadeT += 1 / 60; if (S.evadeT > 0) S.objective = 'Hide at the hideout until the heat dies — stay out of sight.'; } }
  if (m.type === 'heist') { if (S.missionStage === 0 && near) { S.missionStage = 1; S.cash += 0; S.objective = 'Vault cash grabbed! Escape to the hideout — CONDOR-2 is overhead.'; S.dialogue = 'Mara: "GO GO GO! The vault is open!"'; if (police) police.setWanted(4, player); return 'stage'; } if (S.missionStage === 1 && near) return 'done'; }
  return null;
}
export function completeMission(m) {
  S.cash += m.reward; S.missionDone.push(m.id);
  S.missionIdx++; S.missionStage = 0; S.raceCp = 0; S.kills = 0;
  const next = mission();
  S.banner = `MISSION COMPLETE — ${m.title}  +$${m.reward}`;
  return next;
}
