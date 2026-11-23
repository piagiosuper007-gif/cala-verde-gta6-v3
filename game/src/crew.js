// Crew: Rico (Scramble) + Mara (Slipstream), Q ability with cooldown.
import { S, CREW } from './config.js';
export const crewState = { cooldown: 0, slipT: 0 };
export function useAbility(police, player) {
  if (crewState.cooldown > 0) return 'Ability recharging…';
  if (S.crew.mara && S.missionIdx >= 5) {
    crewState.slipT = 8; crewState.cooldown = 30;
    return 'Mara — SLIPSTREAM! +40% speed for 8s.';
  }
  crewState.cooldown = 45;
  if (police) police.setWanted(Math.max(0, S.wanted - 2), player);
  return 'Rico — SCRAMBLE! CVPD radios jammed, heat drops.';
}
export function updateCrew(dt) {
  if (crewState.cooldown > 0) crewState.cooldown -= dt;
  if (crewState.slipT > 0) crewState.slipT -= dt;
}
export function speedBoost() { return crewState.slipT > 0 ? 1.4 : 1; }
