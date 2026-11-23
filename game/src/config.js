// CALA VERDE — shared config + mutable game state (fresh, written 2026-11-23).
export const CFG = {
  cityHalf: 170, block: 40, roadW: 10,
  plaza: { x: 0, z: 0 },
  garage: { x: 80, z: 80 }, bank: { x: -80, z: -80 },
  hideout: { x: -120, z: 120 }, docks: { x: 120, z: -120 },
  marina: { x: 170, z: 40 }, beachZ: 185, seaZ: 205,
  playerSpeed: 7, runSpeed: 11, carAccel: 26, carMax: 34, carBrake: 40,
  colors: { sky: 0xff9e5e, fog: 0xf2a35e, sun: 0xffb347, sea: 0x2e6f8e, sand: 0xe8c98a, road: 0x3a3a42, grass: 0x5d7a4a },
};
// Mutable session state. Every module imports S from here.
export const S = {
  mode: 'title', // title | playing | paused | complete | busted | wasted
  time: 17.6, cash: 250, health: 100, wanted: 0, wantedHeat: 0,
  missionIdx: 0, missionStage: 0, missionDone: [], objective: 'Press Enter to start',
  dialogue: '', banner: '', radio: 0, muted: false,
  weapon: 1, ammo: { 1: Infinity, 2: 240, 3: 24 },
  crew: { rico: true, mara: false },
  carsOwned: ['Comet'],
  raceCp: 0, kills: 0, deliveries: 0, evadeT: 0, heistCash: 0,
  frames: 0, startedAt: 0, seed: 1,
  player: { x: 0, z: 24, heading: 0, inCar: null, speed: 0 },
  camYaw: 0,
};
export const CARS = [
  { name: 'Comet', price: 0, top: 34, color: 0xd94f3d },
  { name: 'Brisa GT', price: 1200, top: 38, color: 0x2e7fb8 },
  { name: 'Solmar S', price: 3200, top: 44, color: 0xe8b93a },
  { name: 'Verde V12', price: 8000, top: 52, color: 0x222226 },
];
export const MISSIONS = [
  { id: 1, title: 'First Light', giver: 'Rico', type: 'goto', target: { x: 0, z: 0 }, reward: 150,
    text: 'Meet Rico in the plaza. Cala Verde wakes up golden — time to work.',
    lines: ['Rico: "You made it. The city is ours if we move smart."', 'Rico: "Start small. Get to the plaza marker."'] },
  { id: 2, title: 'Borrowed Wheels', giver: 'Rico', type: 'steal', target: { x: 80, z: 80 }, reward: 400,
    text: 'Steal a car (press E near one) and bring it to the garage.',
    lines: ['Rico: "We need wheels. Any car on the street will do."', 'Rico: "Drive it to the garage — no scratches, yeah right."'] },
  { id: 3, title: 'Parcel Run', giver: 'Mara', type: 'pickup', target: { x: -80, z: -80 }, reward: 350,
    text: 'Pick up the parcel at the bank steps, then deliver it to the hideout.',
    lines: ['Mara: "A parcel is waiting by the bank. Don\'t open it."', 'Mara: "Hideout, north-west. Move."'] },
  { id: 4, title: 'Street Heat', giver: 'Rico', type: 'race', target: { x: 40, z: -40 }, reward: 900,
    text: 'Street race: hit all 5 checkpoints in order. Fastest line wins.',
    lines: ['Rico: "The sunset crew races at golden hour. Beat them."', 'Rico: "Five gates. No shortcuts through the plaza."'] },
  { id: 5, title: 'Loud Message', giver: 'Mara', type: 'combat', target: { x: 120, z: -120 }, reward: 700,
    text: 'Clear the rivals at the docks. Click or press F to fire. 1/2/3 switch weapons.',
    lines: ['Mara: "The dock crew talks too much. Make them quiet."', 'Mara: "Four of them. Watch your health."'] },
  { id: 6, title: 'Golden Hour', giver: 'Mara', type: 'deliver', target: { x: 170, z: 40 }, reward: 600,
    text: 'Pick Mara up at the plaza, then drive her to the marina.',
    lines: ['Mara: "I\'m at the plaza. Drive — the marina, before dark."', 'Mara: "Nice car. Don\'t wreck it before we arrive."'] },
  { id: 7, title: 'Smoke Screen', giver: 'Rico', type: 'escape', target: { x: -120, z: 120 }, reward: 1000,
    text: 'The CVPD is on you. Reach the hideout and stay out of sight until the heat dies.',
    lines: ['Rico: "You\'re hot. Three stars and climbing."', 'Rico: "Get to the hideout and lay low."'] },
  { id: 8, title: 'The Verde Vault', giver: 'Mara', type: 'heist', target: { x: -80, z: -80 }, reward: 2500,
    text: 'Final job: hit the bank, grab the cash, escape to the hideout with CONDOR-2 overhead.',
    lines: ['Mara: "The vault. One shot. We walk out rich or not at all."', 'Rico: "Q scrambles their radios. Use it when the heli shows."'] },
];
export const CREW = {
  rico: { name: 'Rico', ability: 'Scramble', key: 'Q', desc: 'Scrambles CVPD radios: wanted drops 2 stars, 45s cooldown.' },
  mara: { name: 'Mara', ability: 'Slipstream', key: 'Q', desc: 'Slipstream: +40% top speed for 8s, 30s cooldown.' },
};
export const RADIO = ['VERDE FM — sunset pop', 'MARINA 88 — smooth grooves', 'CALA ROCK — golden-hour rock'];
