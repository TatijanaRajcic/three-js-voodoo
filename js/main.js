import * as THREE from "../node_modules/three/src/Three.js";
import { OrbitControls } from "../node_modules/three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "../node_modules/three/examples/jsm/loaders/FBXLoader.js";

let container;
let scene;
let camera;
let renderer;
let controls;
let clock = new THREE.Clock();
let mixer; // holds the animation of one model
// let mixers = [] // when we have several model, each with animations

function init() {
  container = document.querySelector("#scene-container");
  createScene();
  console.log(scene);
  
  createCamera();
  createLights();
  loadModels();

  createControls();
  createRenderer();
}

function createScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color("skyblue"); // the color of the scene (think about it as the walls)
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
  var loader = new FBXLoader();
  loader.load(
    "../models/fbx/character/Kira@Straight.fbx",
    // "../models/fbx/basket/Basket.fbx",
    onLoad,
    onProgress,
    onError
  );
}

function onLoad(loadedObject) {
  console.log(loadedObject);
  mixer = new THREE.AnimationMixer(loadedObject); // the loaded model becomes a three.js object while loaded
  // if we have several models, then we should have initialize an array mixers at the top of the script, and push every mixer inside of it
  // const mixer = new THREE.AnimationMixer( model );
  // mixers.push( mixer );

  // var action = mixer.clipAction(loadedObject.animations[0]);
  // action.play();

  loadedObject.traverse(function (child) {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  loadedObject.position.set(0, 0, 0);

  scene.add(loadedObject);
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
  if (mixer) mixer.update(delta);
  // If we have several models so several mixers:
  // for ( const mixer of mixers ) {
  //   mixer.update( delta );
  // }
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
