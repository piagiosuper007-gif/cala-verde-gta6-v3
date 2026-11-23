// Deterministic ?shot= states for the 4 screenshots.
import { S, CFG } from './config.js';
export function shotName() { return new URLSearchParams(location.search).get('shot') || ''; }
export function applyShot(game) {
  const shot = shotName();
  if (!shot) return false;
  if (shot === 'start') {
    S.mode = 'title';
    game.camOrbit = true;
    return true;
  }
  if (shot === 'onfoot') {
    game.startGame();
    S.player.x = 12; S.player.z = 14; S.player.heading = Math.PI;
    game.playerMesh.position.set(12, 0, 14);
    return true;
  }
  if (shot === 'chase') {
    game.startGame();
    document.getElementById('banner').style.display = 'none'; // no transient banner in the shot
    S.player.x = 0; S.player.z = 40; S.player.heading = 0; // open crossroads: clear run ahead
    game.playerMesh.position.set(0, 0, 40);
    game.enterCar(game.traffic[0]);
    const car = S.player.inCar; car.heading = 0; car.speed = 12; S.player.heading = 0; // deterministic: drive south toward the beach, roadblocks ahead
    game.police.setWanted(3, S.player);
    game.police.ensure(game.scene, S.player, game.colliders);
    return true;
  }
  if (shot === 'complete') {
    game.startGame();
    S.mode = 'complete';
    // High golden-hour vista behind the overlay (camera exposed on game)
    game.camera.position.set(70, 55, 130);
    game.camera.lookAt(0, 12, 0);
    document.getElementById('title').style.display = 'none';
    const c = document.getElementById('complete'); c.style.display = 'flex';
    document.getElementById('completetext').textContent = 'First Light — finished in golden hour. Rico is impressed. +$150 · Job 2/8 unlocked: Borrowed Wheels.';
    return true;
  }
  return false;
}
