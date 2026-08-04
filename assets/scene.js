// Procedural workspace vignette — no model files, geometry is built in code.
// Renders only while on screen; if WebGL is missing the section removes itself.
import * as THREE from './three.module.min.js';

const GREEN = 0x00693e;
const mount = document.getElementById('scene3d');

function mat(color, rough = 0.85, metal = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}
function box(w, h, d, m) { return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); }
function cyl(rt, rb, h, m, seg = 20) { return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); }
function ball(r, m, seg = 20) { return new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg / 2), m); }
function put(o, x, y, z) { o.position.set(x, y, z); return o; }

const M = {
  rug:    mat(GREEN, 0.95),
  wood:   mat(0xc9a986, 0.8),
  leg:    mat(0x59463a, 0.7),
  metal:  mat(0xb9bcc0, 0.35, 0.75),
  dark:   mat(0x3a3f44, 0.6),
  screen: new THREE.MeshStandardMaterial({ color: 0xeef4f0, roughness: 0.25, emissive: 0xd9e8e0, emissiveIntensity: 0.5 }),
  skin:   mat(0xe8c9a8, 0.85),
  hair:   mat(0x241d18, 0.9),
  shirt:  mat(0xf2f2f0, 0.9),
  pants:  mat(0x4a5560, 0.9),
  shoe:   mat(0x2c2f33, 0.7),
  pot:    mat(0xd8cfc4, 0.9),
  leaf:   mat(0x2f7d5a, 0.9),
  frame:  mat(0x6b625a, 0.4, 0.5),
  float:  mat(GREEN, 0.4, 0.1),
};

function desk() {
  const g = new THREE.Group();
  const top = box(1.9, 0.07, 0.82, M.wood);
  put(top, 0, 0.76, 0);
  g.add(top);
  // splayed tapered legs, mid-century style
  [[-0.82, -0.3], [0.82, -0.3], [-0.82, 0.3], [0.82, 0.3]].forEach(([x, z]) => {
    const l = cyl(0.022, 0.04, 0.76, M.leg, 10);
    put(l, x * 0.95, 0.38, z);
    l.rotation.z = x > 0 ? -0.07 : 0.07;
    l.rotation.x = z > 0 ? -0.06 : 0.06;
    g.add(l);
  });
  // monitor
  const stand = cyl(0.03, 0.03, 0.22, M.metal, 12); put(stand, -0.2, 0.9, -0.14); g.add(stand);
  const foot = cyl(0.13, 0.14, 0.02, M.metal, 16);  put(foot, -0.2, 0.8, -0.14); g.add(foot);
  const panel = box(0.82, 0.5, 0.035, M.dark);      put(panel, -0.2, 1.24, -0.15);
  panel.rotation.x = -0.06; g.add(panel);
  const glass = box(0.76, 0.44, 0.01, M.screen);    put(glass, -0.2, 1.24, -0.128);
  glass.rotation.x = -0.06; g.add(glass);
  // plant
  const pot = cyl(0.075, 0.06, 0.12, M.pot, 14);    put(pot, 0.62, 0.855, -0.02); g.add(pot);
  [[0, 0.1, 0, 0.085], [0.05, 0.06, 0.03, 0.062], [-0.05, 0.07, -0.02, 0.055]].forEach(([x, y, z, r]) => {
    const b = ball(r, M.leaf, 12); put(b, 0.62 + x, 0.95 + y, -0.02 + z); b.scale.y = 0.8; g.add(b);
  });
  // tower on the floor
  const t = box(0.2, 0.46, 0.44, M.dark); put(t, 0.72, 0.26, 0.06); g.add(t);
  const led = box(0.03, 0.03, 0.01, M.float); put(led, 0.63, 0.42, 0.29); g.add(led);
  return g;
}

function chair() {
  const g = new THREE.Group();
  const seat = box(0.46, 0.07, 0.44, M.dark); put(seat, 0, 0.46, 0); g.add(seat);
  const back = box(0.44, 0.5, 0.06, M.dark);  put(back, 0, 0.72, 0.2);
  back.rotation.x = 0.14; g.add(back);
  const post = cyl(0.035, 0.035, 0.34, M.metal, 12); put(post, 0, 0.28, 0); g.add(post);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const arm = box(0.05, 0.035, 0.3, M.metal);
    put(arm, Math.sin(a) * 0.14, 0.11, Math.cos(a) * 0.14);
    arm.rotation.y = a; g.add(arm);
    const w = cyl(0.035, 0.035, 0.03, M.dark, 10);
    put(w, Math.sin(a) * 0.28, 0.055, Math.cos(a) * 0.28);
    w.rotation.x = Math.PI / 2; g.add(w);
  }
  return g;
}

// seated figure, ~7 heads, facing -Z toward the desk
function person() {
  const g = new THREE.Group();
  const head = ball(0.135, M.skin, 24);  put(head, 0, 1.31, -0.03); head.scale.set(0.94, 1.06, 1); g.add(head);
  const hair = ball(0.142, M.hair, 24);  put(hair, 0, 1.335, 0.005);
  hair.scale.set(0.96, 0.92, 1.0); g.add(hair);
  const neck = cyl(0.045, 0.05, 0.09, M.skin, 12); put(neck, 0, 1.185, -0.01); g.add(neck);

  // round glasses + eyes: the one identity cue that survives at this scale
  [-1, 1].forEach((s) => {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.038, 0.006, 8, 20), M.frame);
    put(rim, s * 0.052, 1.322, -0.152); g.add(rim);
    const eye = ball(0.016, M.hair, 10); put(eye, s * 0.052, 1.322, -0.145); g.add(eye);
  });
  const bridge = box(0.032, 0.006, 0.006, M.frame); put(bridge, 0, 1.322, -0.152); g.add(bridge);

  // wide at the shoulders, narrow at the waist — the reverse reads as a bottle
  const torso = cyl(0.195, 0.15, 0.5, M.shirt, 18); put(torso, 0, 0.9, 0.01);
  torso.rotation.x = -0.06; g.add(torso);
  [-1, 1].forEach((s) => {
    const sh = ball(0.075, M.shirt, 14); put(sh, s * 0.175, 1.10, 0.01); g.add(sh);
  });
  const hip = box(0.34, 0.14, 0.3, M.pants); put(hip, 0, 0.57, 0.03); g.add(hip);

  // arms reach forward onto the desk
  [-1, 1].forEach((s) => {
    // upper arm hangs, forearm rests on the thigh — no angle where it points into empty air
    const up = cyl(0.05, 0.045, 0.30, M.shirt, 12);
    put(up, s * 0.22, 0.92, 0.01); up.rotation.z = -s * 0.09; g.add(up);
    const fore = cyl(0.042, 0.038, 0.30, M.skin, 12);
    put(fore, s * 0.215, 0.69, -0.11); fore.rotation.x = 0.885; g.add(fore);
    const hand = ball(0.05, M.skin, 12);
    put(hand, s * 0.20, 0.60, -0.24); hand.scale.set(1, 0.7, 1.1); g.add(hand);
    // thigh forward, shin down
    const th = cyl(0.075, 0.07, 0.42, M.pants, 12);
    put(th, s * 0.11, 0.5, -0.19); th.rotation.x = Math.PI / 2; g.add(th);
    const sh = cyl(0.06, 0.052, 0.42, M.pants, 12);
    put(sh, s * 0.11, 0.25, -0.38); g.add(sh);
    const foot = box(0.11, 0.06, 0.2, M.shoe);
    put(foot, s * 0.11, 0.05, -0.43); g.add(foot);
  });
  return g;
}

function start(el) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) { el.closest('.stage')?.remove(); return; }

  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d2c8, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3.2, 5.2, 3.0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -3; key.shadow.camera.right = 3;
  key.shadow.camera.top = 3; key.shadow.camera.bottom = -3;
  key.shadow.bias = -0.0012;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-3, 2, -2);
  scene.add(fill);

  const world = new THREE.Group();
  const rug = cyl(1.72, 1.72, 0.05, M.rug, 56);
  put(rug, 0, 0.025, 0); rug.receiveShadow = true;
  world.add(rug);

  const d = desk(); put(d, -0.62, 0, -0.28); d.rotation.y = 0.30; world.add(d);
  const seat = new THREE.Group();
  put(seat, 0.58, 0, 0.22); seat.rotation.y = -0.62;
  seat.add(chair()); seat.add(person());
  world.add(seat);

  const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 2), M.float);
  put(orb, -0.35, 1.92, 0.35);
  world.add(orb);

  world.traverse((o) => { if (o.isMesh && o !== rug) { o.castShadow = true; o.receiveShadow = true; } });
  scene.add(world);

  function resize() {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // pull back on narrow screens so the vignette never crops
    const dist = 6.3 * Math.max(1, 1.5 / camera.aspect);
    camera.position.set(dist * 0.60, dist * 0.44, dist * 0.68);
    camera.lookAt(0, 0.60, 0);
    camera.updateProjectionMatrix();
  }
  resize();
  addEventListener('resize', resize);

  let raf = 0;
  const t0 = performance.now();

  // On-screen test is read inside the loop from the element's own rect.
  // An IntersectionObserver callback that never arrives used to wedge this
  // permanently: one `isIntersecting:false` stopped the loop and only another
  // callback could restart it. rAF here is never cancelled, so it cannot wedge.
  function onScreen() {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < (innerHeight || 800) && r.width > 0;
  }

  function loop() {
    raf = requestAnimationFrame(loop);
    // no document.hidden check: the browser already throttles rAF in a background
    // tab, and some embedded/automated contexts report hidden:true while visible
    if (!onScreen()) return;                      // skip the draw, keep the clock
    const t = (performance.now() - t0) / 1000;
    world.rotation.y = t * 0.19;                  // one turn ~ 33 s
    orb.position.y = 1.92 + Math.sin(t * 1.1) * 0.14;
    orb.rotation.set(t * 0.4, t * 0.6, 0);
    renderer.render(scene, camera);
  }
  loop();
}

// call last: the material table above is a const, so it must be initialised first
if (mount) start(mount);
