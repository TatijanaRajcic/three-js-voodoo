import * as THREE from "../node_modules/three/src/Three.js";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "../node_modules/three/examples/jsm/loaders/FBXLoader.js";
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
let jumpDone = false;
let durationJump = 0;

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

// Models representation on canvas
var basketBox = new THREE.Box3();
var characterBox = new THREE.Box3();
let basketBall = createSphere();

// Action related information
let flying = false;
let falling = false;
let basketCollision = false;
let holdingBall = true;

function init() {
  container = document.querySelector("#scene-container");
  createScene();
  createCamera();
  createLights();

  loadModels();
  createMeshes();

  createControls();
  createRenderer();

  setTouchListeners();
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
  //camera.position.set(12, 8, 25); // on bigger screens
  camera.position.set(4, 13, 28);
}

function createLights() {
  const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 5);
  const mainLight = new THREE.DirectionalLight(0xffffff, 5);
  mainLight.position.set(10, 10, 10);
  scene.add(ambientLight, mainLight);
}

function createMeshes() {
  const materials = new THREE.MeshBasicMaterial();
  const geometries = new THREE.BoxBufferGeometry(2, 2.25, 1.5);
  let box = new THREE.Mesh(geometries, materials);
  box.position.set(0, 0, 20);
  scene.add(box);
}

function createSphere() {
  var geometry = new THREE.SphereGeometry(0.1, 32, 32);
  var material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  var sphere = new THREE.Mesh(geometry, material);
  return sphere;
}

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
  for (let mixer in mixers) {
    mixers[mixer].update(delta);
  }
  moveCharacter(delta);
  moveBall();
  fly();
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
    // if (models.character.scene.position.y > 0) {
    //   models.character.scene.position.y -= 0.5
    // }
  }
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
  if (models.basket && models.character) {
    basketBox.setFromObject(models.basket.scene);
    scene.add(new THREE.Box3Helper(basketBox, 0xff0000));

    characterBox.setFromObject(models.character.scene);
    scene.add(new THREE.Box3Helper(characterBox, 0xff0000));

    let result = basketBox.intersectsBox(characterBox);
    return result;
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
  checkCollision();
  checkTouch();
}

function jump() {
  //console.log("JUMP!!!");
  const mixer = new THREE.AnimationMixer(models.character.scene);
  mixers.character = mixer;
  chooseAnimation(models.character, mixer, "Jumping", true);
  mixer.addEventListener("finished", function (e) {
    flying = true;
    //tuck();
  });
}

function fly() {
  let characterPosition = models.character.scene.position;
  let characterRotation = models.character.scene.rotation;

  // handling the main character's top/bottom movements until colision with basketball hoop
  if (flying && !basketCollision) {
    if (
      characterPosition.y <= basketBox.max.y + basketBox.max.y / 5 &&
      !falling
    ) {
      characterPosition.y += 0.1; // rising phase
    } else {
      falling = true;
      characterPosition.y -= 0.04; // falling phase
    }

    // handling the main's character position across z axis
    characterPosition.z -= 0.05;

    // handling initial slight rotation of main character
    if (characterRotation.x > -4) {
      characterRotation.x -= 0.02;
    }

    // handling the main's character rotation during flip
    if (
      characterPosition.y >= 3 &&
      characterPosition.y <= basketBox.max.y + basketBox.max.y / 5 &&
      !falling
    ) {
      characterRotation.x -= 0.3;
    }

    if (checkCollision()) {
      basketCollision = true;
      holdingBall = false;
    }
  }
}

function tuck() {
  console.log("tuck!!!");
  const mixer = new THREE.AnimationMixer(models.character.scene);
  mixers["character"] = mixer;
  chooseAnimation(models.character, mixer, "Tuck");
}

function stop() {
  renderer.setAnimationLoop(null);
}

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

function setTouchListeners() {
  var el = document.querySelector("#scene-container canvas");
  el.addEventListener("touchstart", handleStartTouch, false);
  el.addEventListener("touchend", handleEndTouch, false);
}

function handleStartTouch() {
  touch = true;
}

function checkTouch() {
  if (touch || keyboard.pressed("space")) {
    //console.log("i'm holding");
    if (!jumpDone) {
      jump();
    }
    jumpDone = true;
    durationJump += 1;
    // console.log(durationJump);
  }
}

function handleEndTouch() {
  touch = false;
  console.log("total jump duration", durationJump);
}

window.addEventListener("resize", onWindowResize);
init();
animate();
