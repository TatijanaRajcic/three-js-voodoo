import * as THREE from "../node_modules/three/src/Three.js";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "../node_modules/three/examples/jsm/loaders/GLTFLoader.js";
import THREEx from "./threex/threex.keyboardstate.js";

// Three.js initialization
let container;
let scene;
let camera;
let renderer;
let controls;
let clock = new THREE.Clock();

// Keyboard related information
let keyboard = new THREEx.KeyboardState();
let touch = false;
let jumpInitiated = false;

// Models related information
let initialization = {
  basket: {
    url: "../models/gltf/basket/Basket.glb",
    initialStatus: {
      position: new THREE.Vector3(0, 0, 0),
    },
  },
  character: {
    url: "../models/newgltf/newattempt2.glb",
    initialStatus: {
      position: new THREE.Vector3(-0.3, 0, 8),
      //position: new THREE.Vector3(-0.3, 15, 8), // for diving board version
      rotation: new THREE.Vector3(0, Math.PI, 0),
    },
  },
  // trempoline: {
  //   url: "../models/gltf/trempoline/SM_Prop_Trampoline_01.glb",
  //   initialStatus: {
  //     position: new THREE.Vector3(0, 0, 10),
  //   },
  // },
  stadium: {
    url: "../models/gltf/cartoon stadiums/cartoon stadium.glb",
    initialStatus: {
      position: new THREE.Vector3(-47, 2, 40),
    },
  },
};

let models = {};
let mixers = {};

let levels = {
  1: {
    raising: 0.1,
    startFalling: 2 / 3,
    falling: 0.04,
    forward: 0.057,
    flip: 0.2,
  },
  2: {
    raising: 0.06,
    startFalling: 4 / 5,
    falling: 0.13,
    forward: 0.04,
    flip: 0.2,
  },
};

let currentLevel = 1;
// let currentLevel = 2

// Models representation on canvas
let hoopBox = new THREE.Box3();
let basketBall = createSphere();

// Action related information
let flying = false;
let falling = false;
let basketCollision = false;
let holdingBall = true;
let initialDistance;

// Lunching the whole page
function init() {
  container = document.querySelector("#scene-container");
  createScene();
  createCamera();
  createLights();

  loadModels();
  //createDivingBoard();

  createControls();
  createRenderer();

  setTouchListeners();
  setDesktopListeners();
}

// Setting up the event listeners for the beginning of the game
// Pressing space bar on desktop; touching the screen on mobile
function setTouchListeners() {
  var el = document.querySelector("#scene-container canvas");
  el.addEventListener("touchstart", handleJumpStart, false);
  el.addEventListener("touchend", handleJumpEnd, false);
}

function setDesktopListeners() {
  window.addEventListener("keydown", function (event) {
    if (event.code === "Space") {
      handleJumpStart();
    }
  });
  window.addEventListener("keyup", function (event) {
    if (event.code === "Space") {
      handleJumpEnd();
    }
  });
}

function handleJumpStart() {
  if (!jumpInitiated) {
    jump();
  }
  jumpInitiated = true;
  touch = true;
}

function handleJumpEnd() {
  touch = false;
}

// Setting up Three.js
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
  camera.position.set(4, 13, 28); // works for both big and small screens
  //camera.position.set(15, 40, 20); // for diving board version
}

function createLights() {
  const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 5);
  const mainLight = new THREE.DirectionalLight(0xffffff, 5);
  mainLight.position.set(10, 10, 10);
  scene.add(ambientLight, mainLight);
}

function createDivingBoard() {
  const materials = new THREE.MeshBasicMaterial();
  const geometries = new THREE.BoxBufferGeometry(2, 30, 1.5);

  let box = new THREE.Mesh(geometries, materials);
  box.position.set(0, 0, 8);
  scene.add(box);
}

function createSphere() {
  var geometry = new THREE.SphereGeometry(0.1, 32, 32);
  var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  var sphere = new THREE.Mesh(geometry, material);
  return sphere;
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

function render() {
  renderer.gammaFactor = 2.2;
  renderer.gammaOutput = true;
  renderer.render(scene, camera);
}

// Setting up models and animations
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
  mixers[modelName] = mixer;
  if (modelName === "character") {
    initialDistance = model.position.z;
    chooseAnimation(loadedObject, mixer, "Straight");
  }
  scene.add(model);
}

function chooseAnimation(
  loadedObject,
  mixer,
  name,
  clampWhenFinished,
  duration
) {
  const clips = loadedObject.animations;
  var clip = THREE.AnimationClip.findByName(clips, name);
  if (clip) {
    var action = mixer.clipAction(clip);
    if (clampWhenFinished) {
      action.clampWhenFinished = true;
      action.loop = THREE.LoopOnce;
    }
    //if (duration) action.warp(1, 10, duration);
    action.play();
  }
}

function assignModel(modelName, globalScene) {
  models[modelName] = globalScene;
  globalScene.scene.traverse(function (child) {
    if (child.name === "hand_r") {
      var helper = new THREE.SkeletonHelper(child);
      scene.add(helper);
    }
  });
}

function onProgress() {}

function onError(error) {
  console.log(error);
}

// Handling main action

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

function moveBall() {
  if (holdingBall) {
    models.character.scene.traverse(function (child) {
      if (child.name === "index_01_r") {
        var twinGlobalPos = new THREE.Vector3();
        twinGlobalPos.setFromMatrixPosition(child.matrixWorld);
        basketBall.position.x = twinGlobalPos.x;
        basketBall.position.y = twinGlobalPos.y;
        basketBall.position.z = twinGlobalPos.z;
        scene.add(basketBall);
      }
    });
  } else {
    if (basketBall.position.y > 0) {
      basketBall.position.y -= 0.1;
    }
    chooseAnimation(models.character, mixers.character, "Straight", true);
  }
}

function jump() {
  const mixer = new THREE.AnimationMixer(models.character.scene);
  mixers.character = mixer;
  chooseAnimation(models.character, mixer, "Jumping", true);
  mixer.addEventListener("finished", function (e) {
    flying = true;
    //tuck();
  });
}

// REWRITE IT WITH DISTANCES BETWEEN CHARACTER AND HOOP RATHER THAN HARD CODED VALUES
function fly() {
  let characterPosition = models.character.scene.position;
  let characterRotation = models.character.scene.rotation;

  if (flying && !basketCollision) {
    handlePositionY(characterPosition);
    handlePositionZ(characterPosition);
    handleRotationX(characterRotation); // initial rotation as the character is jumping
    handleFlip(characterRotation);
    if (checkCollision()) {
      basketCollision = true;
      holdingBall = false;
      console.log("DUNK");
    }
  }
}

function handlePositionY(characterPosition) {
  if (
    characterPosition.z >=
      levels[currentLevel].startFalling * initialDistance &&
    !falling
  ) {
    characterPosition.y += levels[currentLevel].raising; // rising phase
  } else {
    falling = true;
    characterPosition.y -= levels[currentLevel].falling; // falling phase
  }
}

function handlePositionZ(characterPosition) {
  characterPosition.z -= levels[currentLevel].forward;
}

function handleRotationX(characterRotation) {
  if (characterRotation.x > -4) {
    characterRotation.x -= 0.02;
  }
}

function handleFlip(characterRotation) {
  if (falling && touch) {
    characterRotation.x -= levels[currentLevel].flip;
  }
}

function checkCollision() {
  if (models.basket && models.character) {
    // adding a box around the hoop collider
    models.basket.scene.traverse(function (child) {
      if (child.name === "HoopCollider") {
        hoopBox.setFromObject(child);
      }
    });
    scene.add(new THREE.Box3Helper(hoopBox, 0xff0000));

    // checking for collision between basketball and the hoop collider
    var center = new THREE.Vector3();
    center.setFromMatrixPosition(basketBall.matrixWorld);
    var radius = basketBall.geometry.boundingSphere.radius;
    let myBall = new THREE.Sphere(center, radius);

    let intersection = hoopBox.intersectsSphere(myBall);

    return intersection;
  }
}

// Core functions

function update() {
  var delta = clock.getDelta();
  for (let mixer in mixers) {
    mixers[mixer].update(delta);
  }
  moveCharacter(delta);
  moveBall();
  fly();
}

function animate() {
  requestAnimationFrame(animate);
  update();
  render();
  checkCollision();
}

// function tuck() {
//   console.log("tuck!!!");
//   const mixer = new THREE.AnimationMixer(models.character.scene);
//   mixers["character"] = mixer;
//   chooseAnimation(models.character, mixer, "Tuck");
// }

function stop() {
  renderer.setAnimationLoop(null);
}

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
window.addEventListener("resize", onWindowResize);

init();
animate();
