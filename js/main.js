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

let initialization = {
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
  stadium: {
    url: "../models/gltf/cartoon stadiums/cartoon stadium.glb",
    initialStatus: {
      position: new THREE.Vector3(-47, 2, 40),
    },
  },
};

let models = {};

let globalVertices = { character: [], basket: [] };

var keyboard = new THREEx.KeyboardState();

let characterJump = document.getElementById("jump");
characterJump.onclick = jump;

let characterTuck = document.getElementById("tuck");
characterTuck.onclick = tuck;

let mixers = []; // when we have several model, each with animations

function init() {
  container = document.querySelector("#scene-container");
  createScene();
  createCamera();
  createLights();
  //createSphere();

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
  camera.position.set(12, 8, 25);
}

function createLights() {
  const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 5);
  const mainLight = new THREE.DirectionalLight(0xffffff, 5);
  mainLight.position.set(10, 10, 10);
  scene.add(ambientLight, mainLight);
}

// function createMeshes() {
//   const materials = new THREE.MeshBasicMaterial();
//   const geometries = new THREE.BoxBufferGeometry(2, 2.25, 1.5);
//   box = new THREE.Mesh(geometries, materials);
//   box.position.set(5, 0, 0);
//   scene.add(box);
// }

// function createSphere() {
//   var geometry = new THREE.SphereGeometry(0.3, 32, 32);
//   var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
//   var sphere = new THREE.Mesh(geometry, material);
//   // scene.add(sphere);
//   return sphere;
//   // group sphere and body part hand
// }

function loadModels() {
  // gltf models
  for (const oneElementInfo in initialization) {
    const infoModel = initialization[oneElementInfo];
    loadOneModel(oneElementInfo, infoModel);
  }
}

function loadOneModel(oneElementInfo, infoModel) {
  const loader = new GLTFLoader();
  loader.load(
    infoModel.url,
    (currentGlft) =>
      onLoad(currentGlft, infoModel.initialStatus, oneElementInfo, assignModel), // function that gets executed when the currentModel has finished loading
    onProgress,
    onError
  );
}

function onLoad(loadedObject, initialStatus, modelName, callback) {
  callback(modelName, loadedObject);

  const model = loadedObject.scene;
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

function assignModel(modelName, globalScene) {
  //console.log(model);

  models[modelName] = globalScene;
  globalScene.scene.traverse(function (child) {
    if (child.name === "hand_r") {
      //console.log(child);
      //console.log("hand right!");

      var helper = new THREE.SkeletonHelper(child);
      //console.log("HELPER", helper);
      scene.add(helper);

      // is there a way to use skeleton helper and get bounding box?
      // the following does not work

      var geometry = helper.geometry;
      var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      var mesh = new THREE.Mesh(geometry, material);

      var box = new THREE.Box3();
      box.setFromObject(mesh);
      //console.log("BOX3 FROM HELPER", box);
      scene.add(new THREE.Box3Helper(box, 0xff0000));

      // let basketBall = createSphere();
      // basketBall.position.x = child.position.x;
      // basketBall.position.y = child.position.y;
      // basketBall.position.z = child.position.z;
      // console.log("basket ball position", basketBall.position);

      // scene.add(basketBall);
    }
  });
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
  if (keyboard.pressed("A")) models.character.scene.rotation.y += rotateAngle;
  if (keyboard.pressed("D")) models.character.scene.rotation.y -= rotateAngle;
  if (keyboard.pressed("left"))
    models.character.scene.position.x -= moveDistance;
  if (keyboard.pressed("right"))
    models.character.scene.position.x += moveDistance;
  if (keyboard.pressed("up")) models.character.scene.position.z -= moveDistance;
  if (keyboard.pressed("down"))
    models.character.scene.position.z += moveDistance;
}

function checkCollision() {
  var basketBox = new THREE.Box3();
  basketBox.setFromObject(models.basket.scene);
  scene.add(new THREE.Box3Helper(basketBox, 0xff0000));

  var characterBox = new THREE.Box3();
  characterBox.setFromObject(models.character.scene);
  scene.add(new THREE.Box3Helper(characterBox, 0xff0000));

  let result = basketBox.intersectsBox(characterBox);
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

function jump() {
  console.log("JUMP!!!");
  const mixer = new THREE.AnimationMixer(models.character.scene);
  mixers.push(mixer);
  chooseAnimation(models.character, mixer, "Jumping");
}

function tuck() {
  console.log("tuck!!!");
  const mixer = new THREE.AnimationMixer(models.character.scene);
  mixers.push(mixer);
  chooseAnimation(models.character, mixer, "Tuck");
}

// function stop() {
//   renderer.setAnimationLoop(null);
// }

function onWindowResize() {
  console.log(models);
  console.log(mixers);

  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

window.addEventListener("resize", onWindowResize);

init();
animate();

// buttonMoveCharacter.onclick = () => {
//   console.log("heyhey");
// };
