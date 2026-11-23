// WebAudio synth: engine, sirens, gunshots, 3 radio stations. No audio files.
import { S, RADIO } from './config.js';
let ctx = null, engineOsc = null, engineGain = null, radioTimer = null, radioStep = 0;
const SCALES = [
  [262, 294, 330, 392, 440, 523], // pop
  [220, 262, 294, 330, 392, 440], // grooves
  [110, 131, 165, 220, 262, 330], // rock
];
export function ensureAudio() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    engineOsc = ctx.createOscillator(); engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 60;
    engineGain = ctx.createGain(); engineGain.gain.value = 0;
    engineOsc.connect(engineGain); engineGain.connect(ctx.destination); engineOsc.start();
    startRadio();
  } catch (e) { /* audio unavailable headless */ }
}
export function setEngine(speed, inCar) {
  if (!ctx || !engineOsc) return;
  engineOsc.frequency.value = 50 + Math.abs(speed) * 4;
  engineGain.gain.value = S.muted ? 0 : (inCar ? 0.05 : 0.015);
}
export function playSiren() {
  if (!ctx || S.muted) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.connect(g); g.connect(ctx.destination);
  g.gain.value = 0.04; o.frequency.setValueAtTime(700, ctx.currentTime);
  o.frequency.linearRampToValueAtTime(950, ctx.currentTime + 0.4);
  o.frequency.linearRampToValueAtTime(700, ctx.currentTime + 0.8);
  o.start(); o.stop(ctx.currentTime + 0.85);
}
export function playShot() {
  if (!ctx || S.muted) return;
  const len = ctx.sampleRate * 0.12, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const g = ctx.createGain(); g.gain.value = 0.25; src.connect(g); g.connect(ctx.destination); src.start();
}
function startRadio() {
  if (radioTimer) return;
  radioTimer = setInterval(() => {
    if (!ctx || S.muted || S.mode !== 'playing') return;
    const scale = SCALES[S.radio % 3];
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = S.radio === 2 ? 'square' : 'triangle';
    o.frequency.value = scale[radioStep % scale.length] * (radioStep % 8 === 7 ? 2 : 1);
    g.gain.value = 0.035; o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + 0.22); radioStep++;
  }, 240);
}
export function cycleRadio() { S.radio = (S.radio + 1) % 3; return RADIO[S.radio]; }
export function radioName() { return RADIO[S.radio % 3]; }
