// Flat-earth dome — model authored in Blender (flat_earth.blend), exported as a
// meshopt-compressed GLB. Things glTF cannot carry are rebuilt here: the sun's
// spotlight, the moon's glow, and the dome's Fresnel transparency.
import * as THREE from 'three';
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from './jsm/libs/meshopt_decoder.module.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';

const R = 5;                                   // disc radius in the Blender file
const el = document.getElementById('scene3d') || document.getElementById('app');
const embedded = el.id === 'scene3d';      // on the main page: no zoom, skip draw off-screen
const light = embedded;                    // main page is white; flat.html stays dark

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });   // panel colour comes from CSS
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;    // matches Blender's "Standard" view transform
el.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// Blender camera (x, y, z) Z-up  →  glTF Y-up (x, z, -y)
const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 300);
camera.position.set(R * 1.55, R * 0.9, R * 1.8);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, R * 0.22, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = R * 0.8;
controls.maxDistance = R * 6;
controls.maxPolarAngle = Math.PI * 0.62;       // don't dive under the slab
controls.enablePan = false;
controls.enableZoom = !embedded;               // never steal the page's scroll wheel
if (matchMedia('(pointer: coarse)').matches) controls.enabled = false;   // touch: let the page scroll
renderer.domElement.style.cursor = controls.enabled ? 'grab' : 'default';

scene.add(light ? new THREE.AmbientLight(0xe4e9ef, 2.0)      // on white the map must read at near-albedo
                : new THREE.AmbientLight(0x7482ad, 1.1));    // faint "night" fill, like Blender's world

// Glass dome: nearly clear in the middle, a soft rim at grazing angles
function domeMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { color: { value: light ? new THREE.Color(0.36, 0.50, 0.62) : new THREE.Color(0.55, 0.72, 1.0) },
                aMin: { value: light ? 0.025 : 0.015 }, aMax: { value: light ? 0.34 : 0.30 } },
    vertexShader: `
      varying vec3 vN; varying vec3 vV;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      uniform vec3 color; uniform float aMin; uniform float aMax; varying vec3 vN; varying vec3 vV;
      void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2);
        gl_FragColor = vec4(color, mix(aMin, aMax, f)); }`,
    transparent: true, depthWrite: false, side: THREE.FrontSide,
  });
}

let mixer = null;
const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);
loader.load('./assets/flat-earth.glb', (gltf) => {
  const root = gltf.scene;
  scene.add(root);
  // gltf-transform turns some objects into an empty node whose mesh is an unnamed child, and
  // SunBeam is itself a child of Sun — so "the mesh under Sun" must exclude the beam's subtree.
  const meshesUnder = (name, exclude) => {
    const o = root.getObjectByName(name), out = [];
    if (o) o.traverse((c) => { if (c.isMesh && !(exclude && (c === exclude || exclude.getObjectById(c.id)))) out.push(c); });
    return out;
  };
  const meshOf = (name, exclude) => meshesUnder(name, exclude)[0] || null;

  root.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material;
    if (m && m.transparent) m.depthWrite = false;   // beam cone etc. must not punch holes
  });
  // The exported beam material carries Blender's 0.035 alpha inside a palette texture, so any
  // opacity we set gets multiplied by it. Replace it with a plain unlit cone instead.
  const beamNode = root.getObjectByName('SunBeam');
  const beam = meshOf('SunBeam');
  if (beam) beam.material = new THREE.MeshBasicMaterial({
    color: 0xffd36b, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });

  const dome = meshOf('Firmament');
  if (dome) { dome.material = domeMaterial(); dome.renderOrder = 10; }

  // the sun is a lamp: a spotlight pointing straight down, riding on the animated Sun node
  const sun = root.getObjectByName('Sun');
  const sunMesh = meshOf('Sun', beamNode);            // the sphere, not the beam
  if (sun) {
    const spot = new THREE.SpotLight(0xfff0c8, 56, 0, THREE.MathUtils.degToRad(57.5), 0.75, 1.15);
    const tgt = new THREE.Object3D();
    tgt.position.set(0, -1, 0);
    sun.add(tgt); sun.add(spot); spot.target = tgt;
  }
  const moon = root.getObjectByName('Moon');
  if (moon) moon.add(new THREE.PointLight(0xb8ccff, 2.5, 0, 1.6));

  if (light) {
    // white page: emissive-white stars, a pale moon and a washed-out sun vanish, so tint them
    const stars = meshOf('Stars');
    if (stars) stars.material = new THREE.MeshBasicMaterial({ color: 0x8b96a4 });
    const moonMesh = meshOf('Moon');
    if (moonMesh) moonMesh.material = new THREE.MeshStandardMaterial({ color: 0x8f96a3, roughness: 0.8 });
    if (sunMesh) sunMesh.material = new THREE.MeshStandardMaterial({ color: 0xf6b21b, emissive: 0xf6b21b, emissiveIntensity: 0.9, roughness: 0.5 });
  }

  // day / year spiral / star rotation — all baked in the file
  mixer = new THREE.AnimationMixer(root);
  gltf.animations.forEach((clip) => mixer.clipAction(clip).play());
}, undefined, (err) => console.error('GLB load failed', err));

let placed = false;
function resize() {
  const w = el.clientWidth, h = el.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  if (!placed) {                               // once: pull back on narrow panels so the dome never crops
    camera.position.multiplyScalar(Math.max(1, 1.45 / camera.aspect));
    placed = true;
  }
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
function onScreen() {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < (innerHeight || 800);
}
(function loop() {
  requestAnimationFrame(loop);                 // never cancelled — only the draw is skipped
  const dt = Math.min(clock.getDelta(), 0.1);
  if (embedded && !onScreen()) return;
  if (mixer) mixer.update(dt);
  controls.update();
  renderer.render(scene, camera);
})();
