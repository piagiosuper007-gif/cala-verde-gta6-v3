// HUD DOM + 2D minimap canvas.
import { S, MISSIONS, CFG } from './config.js';
import { WEAPONS } from './combat.js';
import { missionTarget } from './missions.js';
import { radioName } from './audio.js';

const $ = (id) => document.getElementById(id);
export function updateHUD(policeMsg) {
  $('stars').textContent = '★'.repeat(S.wanted) + '☆'.repeat(5 - S.wanted);
  $('healthfill').style.width = Math.max(0, S.health) + '%';
  $('healthfill').style.background = S.health > 50 ? '#58d68d' : S.health > 25 ? '#f5b041' : '#e74c3c';
  $('cash').textContent = S.cash;
  const h = Math.floor(S.time), m = Math.floor((S.time - h) * 60);
  $('clock').textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  $('weapon').textContent = `${WEAPONS[S.weapon].name} [${S.weapon}]`;
  $('objtext').textContent = S.objective;
  const cur = MISSIONS[S.missionIdx];
  $('missiontitle').textContent = cur ? `Job ${cur.id}/8: ${cur.title} — ${cur.giver} · +$${cur.reward}` : 'All jobs done — Cala Verde is yours.';
  const dlg = $('dialogue');
  if (S.dialogue) { dlg.style.display = 'block'; dlg.textContent = S.dialogue; } else dlg.style.display = 'none';
  $('radio').textContent = `♪ ${radioName()} [R]` + (policeMsg ? `  ·  ${policeMsg}` : '');
}
export function showBanner(text, ms = 2600) {
  const b = $('banner'); b.textContent = text; b.style.display = 'block';
  setTimeout(() => { b.style.display = 'none'; }, ms);
}
export function drawMinimap(player, cars, police, enemies, beaconPos) {
  const cv = $('minimap'); if (!cv) return;
  const g = cv.getContext('2d'); const W = 180, C = W / 2, scale = W / 480;
  g.clearRect(0, 0, W, W);
  g.fillStyle = '#20242e'; g.beginPath(); g.arc(C, C, C - 2, 0, 7); g.fill();
  g.save(); g.beginPath(); g.arc(C, C, C - 2, 0, 7); g.clip();
  const px = (x) => C + x * scale, pz = (z) => C + z * scale;
  g.fillStyle = '#3a6ea5'; g.fillRect(0, pz(185), W, 40); // sea
  g.fillStyle = '#e8c98a'; g.fillRect(0, pz(170), W, 15); // beach
  g.strokeStyle = '#555a66'; g.lineWidth = 3;
  for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(px(i * 40), 0); g.lineTo(px(i * 40), W); g.stroke(); g.beginPath(); g.moveTo(0, pz(i * 40)); g.lineTo(W, pz(i * 40)); g.stroke(); }
  g.fillStyle = '#ffd94a'; g.beginPath(); g.arc(px(beaconPos.x), pz(beaconPos.z), 5, 0, 7); g.fill();
  // Landmarks: garage (green), bank (gold), hideout (purple), marina (blue), plaza (white)
  const marks = [[80, 80, '#58d68d'], [-80, -80, '#f5b041'], [-120, 120, '#af7ac5'], [170, 40, '#5dade2'], [0, 0, '#ffffff']];
  for (const [mx, mz, col] of marks) { g.fillStyle = col; g.beginPath(); g.arc(px(mx), pz(mz), 4, 0, 7); g.fill(); }
  g.fillStyle = '#ff5533';
  for (const c of police.cars) { g.beginPath(); g.arc(px(c.x), pz(c.z), 3.5, 0, 7); g.fill(); }
  g.fillStyle = '#ff2222';
  for (const e of enemies.list) { g.fillRect(px(e.x) - 2, pz(e.z) - 2, 4, 4); }
  g.fillStyle = '#c0c0c8';
  for (const c of cars) { g.fillRect(px(c.x) - 2, pz(c.z) - 2, 4, 4); }
  g.fillStyle = '#58d68d'; g.beginPath(); g.arc(px(player.x), pz(player.z), 5, 0, 7); g.fill();
  g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(px(player.x), pz(player.z)); g.lineTo(px(player.x) + Math.sin(player.heading) * 10, pz(player.z) + Math.cos(player.heading) * 10); g.stroke();
  g.restore();
  g.fillStyle = '#fff'; g.font = 'bold 12px Verdana'; g.fillText('N', C - 4, 14);
}
