// Golden-hour renderer: scene, sun, fog, chase camera.
import * as THREE from 'three';
import { CFG, S } from './config.js';

export function createScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(1280, 720); renderer.setPixelRatio(1);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(CFG.colors.sky);
  scene.fog = new THREE.Fog(CFG.colors.fog, 120, 420);
  const camera = new THREE.PerspectiveCamera(62, 1280 / 720, 0.1, 900);
  const sun = new THREE.DirectionalLight(CFG.colors.sun, 2.4);
  sun.position.set(-120, 90, 180); scene.add(sun);
  scene.add(new THREE.AmbientLight(0xffc890, 0.85));
  const hemi = new THREE.HemisphereLight(0xffd9a0, 0x4a3a2c, 0.5); scene.add(hemi);
  // Big low sun disc on the horizon (south-west over the sea)
  const disc = new THREE.Mesh(new THREE.CircleGeometry(26, 32), new THREE.MeshBasicMaterial({ color: 0xffd27a, fog: false }));
  disc.position.set(-160, 42, 420); disc.lookAt(0, 20, 0); scene.add(disc);
  return { renderer, scene, camera };
}

export function updateCamera(camera, focus, inCar, dt) {
  // focus: {x,z,heading}
  const back = inCar ? 13 : 10, up = inCar ? 5.5 : 6.5;
  const tx = focus.x - Math.sin(focus.heading) * back;
  const tz = focus.z - Math.cos(focus.heading) * back;
  camera.position.x += (tx - camera.position.x) * Math.min(1, dt * 5);
  camera.position.y += (up - camera.position.y) * Math.min(1, dt * 5);
  camera.position.z += (tz - camera.position.z) * Math.min(1, dt * 5);
  camera.lookAt(focus.x + Math.sin(focus.heading) * 6, 2.2, focus.z + Math.cos(focus.heading) * 6);
}
