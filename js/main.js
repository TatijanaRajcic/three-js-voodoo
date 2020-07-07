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

// Models related information
let initialization = {
  basket: {
    url: "../models/gltf/basket/Basket.glb",
    initialStatus: {
      position: new THREE.Vector3(0, 0, 0),
    },
  },
  character: {
    url: "../models/newgltf/combined-character.glb",
    initialStatus: {
      position: new THREE.Vector3(-0.3, 0, 8),
      rotation: new THREE.Vector3(0, Math.PI, 0),
    },
  },
  stadium: {
    url: "../models/gltf/cartoon stadiums/cartoon stadium.glb",
    initialStatus: {
      position: new THREE.Vector3(-47, 2, 40),
    },
  },
};

let levels = [
  {
    characterInitialPosition: new THREE.Vector3(-0.3, 0, 8),
    cameraPosition: { x: 4, y: 13, z: 28 },
    raising: 0.1,
    startFalling: 2 / 3,
    falling: 0.04,
    forward: 0.057,
    flip: 0.2,
    minimumFlips: 1,
  },
  {
    characterInitialPosition: new THREE.Vector3(-0.3, 7.5, 8),
    cameraPosition: { x: 10, y: 15, z: 30 },
    raising: 0.07,
    startFalling: 3 / 4,
    falling: 0.12,
    forward: 0.07,
    flip: 0.2,
    minimumFlips: 1,
    action: () => createDivingBoard(15),
  },
  {
    characterInitialPosition: new THREE.Vector3(-0.3, 15, 8),
    cameraPosition: { x: 12, y: 25, z: 33 },
    raising: 0.06,
    startFalling: 4 / 5,
    falling: 0.13,
    forward: 0.04,
    flip: 0.2,
    minimumFlips: 2,
    action: () => createDivingBoard(30),
  },
];

// Empty variables we need to store uploaded models and mixers
let models = {};
let mixers = {};

// Models representation on canvas
let hoopBox = new THREE.Box3();
let basketBall = createSphere();
let characterBox = new THREE.Box3();

// Action related information
let currentLevel = 0;
let touch = false;
let jumpInitiated = false;
let flying = false;
let falling = false;
let basketCollision = false;
let holdingBall = true;
let initialDistance;
let enoughFlips = false;

// Lunching the whole page
function init() {
  container = document.querySelector("#scene-container");
  createScene();
  createCamera();
  createLights();

  loadModels();

  createControls();
  createRenderer();

  setTouchListeners();
  setDesktopListeners();
}

// Setting up the event listeners for the beginning of the game
// Pressing space bar on desktop; touching the screen on mobile
function setTouchListeners() {
  window.addEventListener("touchstart", handleJumpStart, false);
  window.addEventListener("touchend", handleJumpEnd, false);
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
}

function createCamera() {
  const fov = 35;
  const aspect = window.innerWidth / window.innerHeight;
  const near = 0.1;
  const far = 100;
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  let initialX = levels[currentLevel].cameraPosition.x;
  let initialY = levels[currentLevel].cameraPosition.y;
  let initialZ = levels[currentLevel].cameraPosition.z;
  camera.position.set(initialX, initialY, initialZ); // works for both big and small screens
}

function createLights() {
  const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 5);
  const mainLight = new THREE.DirectionalLight(0xffffff, 5);
  mainLight.position.set(10, 10, 10);
  scene.add(ambientLight, mainLight);
}

function createDivingBoard(height) {
  const materials = new THREE.MeshBasicMaterial();
  const geometries = new THREE.BoxBufferGeometry(2, height, 1.5);
  let box = new THREE.Mesh(geometries, materials);
  box.position.set(0, 0, 8);
  scene.add(box);
}

function createSphere() {
  let geometry = new THREE.SphereGeometry(0.1, 32, 32);
  let material = new THREE.MeshBasicMaterial({ color: 0xff8c00 });
  let sphere = new THREE.Mesh(geometry, material);
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

function chooseAnimation(loadedObject, mixer, name, clampWhenFinished) {
  const clips = loadedObject.animations;
  let clip = THREE.AnimationClip.findByName(clips, name);
  if (clip) {
    let action = mixer.clipAction(clip);
    if (clampWhenFinished) {
      action.clampWhenFinished = true;
      action.loop = THREE.LoopOnce;
    }
    action.play();
  }
}

function assignModel(modelName, globalScene) {
  models[modelName] = globalScene;
}

function onProgress() {}

function onError(error) {
  console.log(error);
}

// Handling main action
function moveCharacter(delta) {
  let moveDistance = 5 * delta;
  let rotateAngle = (Math.PI / 2) * delta;
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
        let twinGlobalPos = new THREE.Vector3();
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
    if (e.action._clip.name === "Jumping") flying = true;
  });
}

function fly() {
  if (flying && !basketCollision) {
    handlePositionY();
    handlePositionZ();
    handleRotationX(); // initial rotation as the character is jumping
    handleFlip();

    // checking for successful dunks
    if (checkDunk() && enoughFlips) {
      basketCollision = true;
      holdingBall = false;
      nextLevel();
    } else if (checkDunk() && !enoughFlips) {
      displayFlipMessage();
      replay();
    }

    // checking for unsuccessful jumps
    if (checkFailure()) {
      displayLoserMessage();
      replay();
    }
  }
}

function handlePositionY() {
  let characterPosition = models.character.scene.position;
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

function handlePositionZ() {
  let characterPosition = models.character.scene.position;
  characterPosition.z -= levels[currentLevel].forward;
}

function handleRotationX() {
  let characterRotation = models.character.scene.rotation;
  if (characterRotation.x > -4) {
    characterRotation.x -= 0.02;
  }
}

function handleFlip() {
  let characterRotation = models.character.scene.rotation;
  // handling character's flip
  if (falling && touch) {
    characterRotation.x -= levels[currentLevel].flip;
  }
  // checking if the character has done enough flips
  let flipLimit = -180 * (levels[currentLevel].minimumFlips + 2);
  if (THREE.MathUtils.radToDeg(characterRotation.x) < flipLimit) {
    enoughFlips = true;
  }
}

function checkDunk() {
  if (models.basket && models.character) {
    // adding a box around the hoop collider for colision detection
    models.basket.scene.traverse(function (child) {
      if (child.name === "HoopCollider") {
        hoopBox.setFromObject(child);
      }
    });
    // checking for collision between basketball and the hoop collider
    let center = new THREE.Vector3();
    center.setFromMatrixPosition(basketBall.matrixWorld);
    let radius = basketBall.geometry.boundingSphere.radius;
    let myBall = new THREE.Sphere(center, radius);

    let intersection = hoopBox.intersectsSphere(myBall);
    return intersection;
  }
}

function checkFailure() {
  characterBox.setFromObject(models.character.scene);
  return characterBox.min.y < 0;
}

// Restarting the game
function nextLevel() {
  enoughFlips = false;
  if (currentLevel < levels.length - 1) {
    currentLevel += 1;
    displayNextMessage();
    replay();
  } else {
    console.log("end of game!!");
    displayEndMessage();
    stop();
  }
}

function replay() {
  let characterPosition = models.character.scene.position;
  let characterRotation = models.character.scene.rotation;
  // creating new elements on the scene, if they are needed for on specific level
  if (levels[currentLevel].action) levels[currentLevel].action();
  // reposition the camera
  let initialX = levels[currentLevel].cameraPosition.x;
  let initialY = levels[currentLevel].cameraPosition.y;
  let initialZ = levels[currentLevel].cameraPosition.z;
  camera.position.set(initialX, initialY, initialZ);
  // choose another animation
  chooseAnimation(models.character, mixers.character, "Idle", true);
  // reposition the main character at this specific level
  characterPosition.x = levels[currentLevel].characterInitialPosition.x;
  characterPosition.y = levels[currentLevel].characterInitialPosition.y;
  characterPosition.z = levels[currentLevel].characterInitialPosition.z;
  characterRotation.x = THREE.MathUtils.degToRad(-180);
  // resetting the whole logic
  falling = false;
  basketCollision = false;
  holdingBall = true;
  jumpInitiated = false;
  flying = false;
  initialDistance = characterPosition.z;
}

// Core functions

function update() {
  let delta = clock.getDelta();
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
}

function stop() {
  renderer.setAnimationLoop(null);
}

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
window.addEventListener("resize", onWindowResize);

function displayLoserMessage() {
  let looserMessage = document.getElementById("loose");
  looserMessage.style.display = "flex";
  setTimeout(() => {
    looserMessage.style.display = "none";
  }, 3000);
}

function displayNextMessage() {
  let nextMessage = document.getElementById("next");
  nextMessage.style.display = "flex";
  setTimeout(() => {
    nextMessage.style.display = "none";
  }, 3000);
}

function displayEndMessage() {
  let endMessage = document.getElementById("end");
  endMessage.style.display = "flex";
}

function displayFlipMessage() {
  let flipMessage = document.getElementById("flip");
  flipMessage.querySelector("span").innerHTML =
    levels[currentLevel].minimumFlips;
  flipMessage.style.display = "flex";
  setTimeout(() => {
    flipMessage.style.display = "none";
  }, 3000);
}

function displayInstructions() {
  let instructions = document.getElementById("instructions");
  instructions.style.display = "flex";
}

document.getElementById("play").onclick = function () {
  let instructions = document.getElementById("instructions");
  instructions.style.display = "none";
  init();
  animate();
};

displayInstructions();
