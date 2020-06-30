import * as THREE from "../node_modules/three/src/Three.js";

let container;
let scene;
let camera;
let renderer;
let material;

function init() {
  container = document.querySelector("#scene-container");
  createScene();
  createCamera();
  createRenderer();
  createMaterials();
  createGeometries();

  // renderer.setAnimationLoop(() => {
  //   render();
  // });

  render();
}

function createScene() {
  scene = new THREE.Scene();
}

function createCamera() {
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    500
  );
  camera.position.set(0, 0, 100);
  camera.lookAt(0, 0, 0);
}

function createRenderer() {
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
}

function createMaterials() {
  material = new THREE.LineBasicMaterial({ color: 0x0000ff });
}

function createGeometries() {
  var points = [];
  points.push(new THREE.Vector3(-10, 0, 0));
  points.push(new THREE.Vector3(0, 10, 0));
  points.push(new THREE.Vector3(10, 0, 0));

  var geometry = new THREE.BufferGeometry().setFromPoints(points);
  var line = new THREE.Line(geometry, material);
  scene.add(line);
}

function loadFont() {
  var loader = new THREE.FontLoader();
  console.log("heyhey");

  loader.load(
    "../node_modules/three/examples/fonts/helvetiker_regular.typeface.json",
    function (responseFont) {
      var geometry = new THREE.TextGeometry("Hello three.js!", {
        font: responseFont,
        size: 80,
        height: 5,
        curveSegments: 12,
        bevelEnabled: true,
        bevelThickness: 10,
        bevelSize: 8,
        bevelOffset: 0,
        bevelSegments: 5,
      });
    }
  );
}

function render() {
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

window.addEventListener("resize", onWindowResize);

document.getElementById("load-font").addEventListener("click", loadFont);

init();
