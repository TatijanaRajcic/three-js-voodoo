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
let fbxModels = ["../models/fbx/character/Kira@Straight.fbx"];
let gltfModels = ["../models/gltf/basket/Basket.glb"];
//let mixer; // holds the animation of one model
let mixers = []; // when we have several model, each with animations

function init() {
  container = document.querySelector("#scene-container");
  createScene();
  createCamera();
  createLights();

  loadModels();
  createMeshes();
  console.log("MY SCENE", scene);

  createControls();
  createRenderer();
}

function createScene() {
  scene = new THREE.Scene();
  //scene.background = new THREE.Color("skyblue"); // the color of the scene (think about it as the walls)
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
  camera.position.set(0, 10, 20);
}

function createLights() {
  const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 5);
  const mainLight = new THREE.DirectionalLight(0xffffff, 5);
  mainLight.position.set(10, 10, 10);
  scene.add(ambientLight, mainLight);
}

function loadModels() {
  // fbx models
  fbxModels.forEach((model) => {
    var loader = new FBXLoader();
    loader.load(model, (model) => onLoad(model, "fbx"), onProgress, onError);
  });
  // gltf models
  gltfModels.forEach((model) => {
    var loader = new GLTFLoader();
    loader.load(model, (model) => onLoad(model, "gltf"), onProgress, onError);
  });
}

function createMeshes() {
  const materials = new THREE.MeshBasicMaterial();
  const geometries = new THREE.BoxBufferGeometry(2, 2.25, 1.5);
  const box = new THREE.Mesh(geometries, materials);
  box.position.set(5, 0, 0);
  scene.add(box);
}

function onLoad(loadedObject, format) {
  if (format === "fbx") {
    const animation = loadedObject.animations[0];
    const mixer = new THREE.AnimationMixer(loadedObject);
    mixers.push(mixer);
    const action = mixer.clipAction(animation);
    action.play();
    loadedObject.traverse(function (child) {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    loadedObject.position.set(0, 0, 0);
    scene.add(loadedObject);
  } else if (format === "gltf") {
    const model = loadedObject.scene;
    console.log(model);
    // const animation = loadedObject.animations[0];
    const mixer = new THREE.AnimationMixer(model);
    mixers.push(mixer);
    // const action = mixer.clipAction(animation);
    // action.play();
    scene.add(model);
  }

  // //Second method
  // var box = new THREE.Box3().setFromObject(loadedObject);
  // var center = new THREE.Vector3();
  // box.getCenter(center);
  // loadedObject.position.sub(center);

  // //add to scene
  // scene.add(loadedObject);
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
