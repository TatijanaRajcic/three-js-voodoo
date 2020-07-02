import * as THREE from "../node_modules/three/src/Three.js";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "../node_modules/three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import THREEx from "./threex/threex.keyboardstate.js";

let container;
let scene;
let camera;
let renderer;
let controls;
let clock = new THREE.Clock();

let models = {
  basket: {
    url: "../models/gltf/basket/Basket.glb",
    initialStatus: {
      position: new THREE.Vector3(0, 0, 0),
    },
  },
  character: {
    url: "../models/gltf/character/Kira combined.glb",
    initialStatus: {
      position: new THREE.Vector3(0, 0, 16),
      rotation: new THREE.Vector3(0, Math.PI, 0),
    },
  },
  trempoline: {
    url: "../models/gltf/trempoline/SM_Prop_Trampoline_01.glb",
    initialStatus: {
      position: new THREE.Vector3(0, 0, 10),
    },
  },
};

let globalVertices = { character: [], basket: [] };

var keyboard = new THREEx.KeyboardState();

let buttonMoveCharacter = document.getElementById("move-character");

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
  camera.position.set(20, 15, 20);
}

function createLights() {
  const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 5);
  const mainLight = new THREE.DirectionalLight(0xffffff, 5);
  mainLight.position.set(10, 10, 10);
  scene.add(ambientLight, mainLight);
}

function loadModels() {
  // gltf models
  for (const model in models) {
    const currentModel = models[model];
    const loader = new GLTFLoader();
    loader.load(
      currentModel.url,
      (currentGlft) =>
        onLoad(currentGlft, currentModel.initialStatus, model, assignModel), // function that gets executed when the currentModel has finished loading
      onProgress,
      onError
    );
  }
}

function assignModel(modelName, model) {
  models[modelName] = model;
}

// function createMeshes() {
//   const materials = new THREE.MeshBasicMaterial();
//   const geometries = new THREE.BoxBufferGeometry(2, 2.25, 1.5);
//   box = new THREE.Mesh(geometries, materials);
//   box.position.set(5, 0, 0);
//   scene.add(box);
// }

function onLoad(loadedObject, initialStatus, modelName, callback) {
  const model = loadedObject.scene;
  callback(modelName, model);
  model.position.copy(initialStatus.position);
  if (initialStatus.rotation) {
    model.rotateX(initialStatus.rotation.x);
    model.rotateY(initialStatus.rotation.y);
    model.rotateZ(initialStatus.rotation.z);
  }
  const mixer = new THREE.AnimationMixer(model);
  mixers.push(mixer);
  if (modelName === "character") {
    chooseAnimation(loadedObject, mixer, "Straight");
  }
  scene.add(model);
}

function chooseAnimation(loadedObject, mixer, name) {
  const clips = loadedObject.animations;
  var clip = THREE.AnimationClip.findByName(clips, name);
  if (clip) {
    var action = mixer.clipAction(clip);
    action.play();
  }
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
  moveCharacter(delta);
}

function moveCharacter(delta) {
  var moveDistance = 10 * delta; // 200 pixels per second
  var rotateAngle = (Math.PI / 2) * delta; // pi/2 radians (90 degrees) per second
  if (keyboard.pressed("A")) models.character.rotation.y += rotateAngle;
  if (keyboard.pressed("D")) models.character.rotation.y -= rotateAngle;
  if (keyboard.pressed("left")) models.character.position.x -= moveDistance;
  if (keyboard.pressed("right")) models.character.position.x += moveDistance;
  if (keyboard.pressed("up")) models.character.position.z -= moveDistance;
  if (keyboard.pressed("down")) models.character.position.z += moveDistance;
}

function checkCollision() {
  var basketBox = new THREE.Box3();
  basketBox.setFromObject(models.basket);
  var characterBox = new THREE.Box3();
  characterBox.setFromObject(models.character);

  let result = basketBox.intersectsBox(characterBox);
 // console.log(result);

  if (result) console.log("collision!");
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
  checkCollision();
}

function move(model) {
  model.position.x += 0.2;
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

buttonMoveCharacter.onclick = () => move(models.character);
