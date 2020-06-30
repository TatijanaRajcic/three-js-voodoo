import * as THREE from "../node_modules/three/src/Three.js";
import Stats from "../node_modules/three/examples/jsm/libs/stats.module.js";

import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "../node_modules/three/examples/jsm/loaders/FBXLoader.js";

let container;
let scene;
let camera;
let renderer;
let controls;

function init() {
  container = document.querySelector("#scene-container");
  createScene();
  createCamera();
  createLights();

  createControls();
  createRenderer();
  play();
}

function createScene() {
  scene = new THREE.Scene();
  var axesHelper = new THREE.AxesHelper(200);
  scene.add(axesHelper);
}

function createCamera() {
  const fov = 35;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 0.1;
  const far = 100;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(2.5, 5, 10); // no matter the position of the camera, it will always look at its target, which is (0,0,0) by default
}

function createLights() {
  const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 5);

  const mainLight = new THREE.DirectionalLight(0xffffff, 5);
  mainLight.position.set(10, 10, 10);

  scene.add(ambientLight, mainLight);
}

function loadModels() {
  var loader = new FBXLoader();
  loader.load("models/fbx/Samba Dancing.fbx", function (object) {
    mixer = new THREE.AnimationMixer(object);

    var action = mixer.clipAction(object.animations[0]);
    action.play();

    object.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(object);
  });
}

function createControls() {
  controls = new OrbitControls(camera, container);
}

function createRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.physicallyCorrectLights = true;
  container.appendChild(renderer.domElement);
}

function update() {}

function render() {
  renderer.gammaFactor = 2.2;
  renderer.gammaOutput = true;
  renderer.render(scene, camera);
}

function play() {
  renderer.setAnimationLoop(() => {
    update();
    render();
  });
}

// function stop() {
//   renderer.setAnimationLoop(null);
// }

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

window.addEventListener("resize", onWindowResize);

init();
