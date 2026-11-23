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
    game.enterCar(game.traffic[0]);
    S.player.heading = 0;
    game.police.setWanted(3, S.player);
    game.police.ensure(game.scene, S.player, game.colliders);
    // park a roadblock ahead
    return true;
  }
  if (shot === 'complete') {
    game.startGame();
    S.mode = 'complete';
    document.getElementById('title').style.display = 'none';
    const c = document.getElementById('complete'); c.style.display = 'flex';
    document.getElementById('completetext').textContent = 'First Light — finished in golden hour. Rico is impressed. +$150 · Job 2/8 unlocked: Borrowed Wheels.';
    return true;
  }
  return false;
}
