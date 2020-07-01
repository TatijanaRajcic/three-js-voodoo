import * as THREE from "../node_modules/three/src/Three.js";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "../node_modules/three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js";

let container;
let scene;
let camera;
let renderer;
let controls;
let clock = new THREE.Clock();
let character = {
  url: "../models/gltf/character/Kira@Idle.glb",
  position: new THREE.Vector3(0, 0, 13),
};
let basket = {
  url: "../models/gltf/basket/Basket.glb",
  position: new THREE.Vector3(0, 0, 0),
};
let trempoline = {
  url: "../models/gltf/trempoline/SM_Prop_Trampoline_01.glb",
  position: new THREE.Vector3(0, 0, 7),
};
let box;

let mixers = []; // when we have several model, each with animations

function init() {
  container = document.querySelector("#scene-container");
  createScene();
  createCamera();
  createLights();

  loadModels();
  // createMeshes();

  createControls();
  createRenderer();
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
  //camera.position.set(2.5, 5, 10); // no matter the position of the camera, it will always look at its target, which is (0,0,0) by default
  camera.position.set(25, 20, 25);
}

function createLights() {
  const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 5);
  const mainLight = new THREE.DirectionalLight(0xffffff, 5);
  mainLight.position.set(10, 10, 10);
  scene.add(ambientLight, mainLight);
}

function loadModels() {
  // gltf models
  var characterLoader = new GLTFLoader();
  characterLoader.load(
    character.url,
    (characterGlft) => onLoad(characterGlft, character.position),
    onProgress,
    onError
  );

  var basketLoader = new GLTFLoader();
  basketLoader.load(
    basket.url,
    (basketGlft) => onLoad(basketGlft, basket.position),
    onProgress,
    onError
  );

  var trempolineLoader = new GLTFLoader();
  trempolineLoader.load(
    trempoline.url,
    (trempolineGlft) => onLoad(trempolineGlft, trempoline.position),
    onProgress,
    onError
  );
}

// function createMeshes() {
//   const materials = new THREE.MeshBasicMaterial();
//   const geometries = new THREE.BoxBufferGeometry(2, 2.25, 1.5);
//   box = new THREE.Mesh(geometries, materials);
//   box.position.set(5, 0, 0);
//   scene.add(box);
// }

function onLoad(loadedObject, position) {
  const model = loadedObject.scene;
  model.position.copy(position);
  const animation = loadedObject.animations[0];
  const mixer = new THREE.AnimationMixer(model);
  mixers.push(mixer);
  if (animation) {
    const action = mixer.clipAction(animation);
    action.play();
  }
  scene.add(model);
  return model;
}

function onProgress() {}

function onError(error) {
  console.log(error);
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

function update() {
  var delta = clock.getDelta();
  for (const mixer of mixers) {
    mixer.update(delta);
  }
}

function render() {
  renderer.gammaFactor = 2.2;
  renderer.gammaOutput = true;
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  update();
  render();
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
animate();
