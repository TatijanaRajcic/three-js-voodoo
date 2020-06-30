import * as THREE from "../node_modules/three/src/Three.js";

let container;
let scene;
let camera;
let renderer;
let material;
let geometry;
let mesh;

function init() {
  container = document.querySelector("#scene-container");
  createScene(); // universe in which my 3D objects live
  createCamera(); // camera that enables me to see the scene
  createMaterials(); // Materials define the surface properties of objects - that is, which material that the object looks like it is made from
  createGeometries(); // the geometry of an object defines its shape
  createMesh();
  createLight();
  createRenderer(); // this is a machine that takes a Camera and a Scene as input and outputs beautiful drawings (or renderings) onto your <canvas>.
}

function createScene() {
  scene = new THREE.Scene();
  //scene.background = new THREE.Color("skyblue"); // the color of the scene (think about it as the walls)
}

function createCamera() {
  const fov = 35; // field of view - the .fov parameter defines how much bigger the far clipping plane will be than the near clipping plane. The valid range for the FOV is from 1 to 179 degrees.
  // Console games designed to be shown on screens far away from the viewer are usually between 40 - 60 degrees, while a PC game might use a higher FOV of around 90 since the screen is likely to be right in front of the player.
  const aspect = window.innerWidth / window.innerHeight;
  const near = 0.1; // the near clipping plane - le plan le + rapproché auquel la caméra a accès
  const far = 100; // the far clipping plane - le plan le + éloigné qui est encore dans le champs de la caméra
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  // every object is initially created at ( 0, 0, 0 ); we'll move the camera back a bit so that we can view the scene
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);
}

function createMaterials() {
  //material = new THREE.MeshBasicMaterial(); // // create a default (white) Basic material - always use this in doubt, because it will still appear on the screen, even tho we forget to light up the scene
  material = new THREE.MeshStandardMaterial({ color: 0x800080 }); // creates a Standard material that accepts light. But we have to add it to the scene!
}

function createLight() {
  // by default, a room is without light. If we use Basic Mesh, it will still appear even if we don't turn on lights, but for other Meshs to work, we need to add add light to the room (the room itself can have colors, but this is the background of the scene)
  const light = new THREE.DirectionalLight(0xffffff, 5.0);
  // move the light back and up a bit
  light.position.set(10, 10, 10);
  // remember to add the light to the scene
  scene.add(light);
}

function createGeometries() {
  geometry = new THREE.BoxBufferGeometry(2, 2, 2);
}

function createMesh() {
  mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh); // adding to the scene the object that we just created
}

function createRenderer() {
  renderer = new THREE.WebGLRenderer(); // creates the canvas in the html
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);
}

function animate() {
  requestAnimationFrame(animate); // 60 frames per second
  renderer.render(scene, camera); // renders a still image of the scene from the point of view of the camera and outputs that picture into the <canvas> element.
}

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

window.addEventListener("resize", onWindowResize);

init();
animate();
