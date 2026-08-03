import * as Three from 'three';
import { OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { JetController } from './jetController';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { generateMap } from './map';

//SCENE
const scene = new Three.Scene();
scene.background = new Three.Color(0xa8def0);

//CAMERA
const camera = new Three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); 
const loader = new GLTFLoader();
camera.position.z = 5;
camera.position.y = 5;
camera.position.x = 0;

//RENDERER
const renderer = new Three.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

//LIGHTING
const ambientLight = new Three.AmbientLight(0x333333);
scene.add(ambientLight);

//CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 15;
orbitControls.enablePan = false;
orbitControls.maxPolarAngle = Math.PI /2 - 0.05; //Math.PI / 2  for equator
orbitControls.update();

//MAP
generateMap(scene);


//MODELS
var jetController: JetController;
loader.load('./app/public/model/jet/jet.gltf', (gltf) =>{
        const jetModel = gltf.scene;
        jetModel.scale.set(0.2,0.2,0.2);
        scene.add(jetModel);

        const gltfAnim: Three.AnimationClip[] = gltf.animations;
        const mixer = new Three.AnimationMixer(jetModel);
        const animationsMap: Map<string, Three.AnimationAction> = new Map();
        gltfAnim.forEach((value: Three.AnimationClip) => {animationsMap.set(value.name, mixer.clipAction(value))});

        jetController = new JetController(jetModel, mixer, animationsMap, orbitControls, camera, "Idle");
    }
);




//CONTROL KEYS
const keysPressed = {};
document.addEventListener('keydown', (event: KeyboardEvent) => {
    (keysPressed as any)[event.key.toLowerCase()] = true;  
}, false);

document.addEventListener('keyup', (event: KeyboardEvent) => {
    (keysPressed as any)[event.key.toLowerCase()] = false;  
}, false);

document.addEventListener("mousedown", (event: MouseEvent) => {
    (keysPressed as any)[event.button.toString()] = true;
});

document.addEventListener("mouseup", (event: MouseEvent) => {
    (keysPressed as any)[event.button.toString()] = false;
});



//FPS COUNTER
var stats = new Stats();
stats.showPanel(0); //FPS  
stats.dom.style.position = "absolute";
stats.dom.style.left = (window.screen.width - 97).toString() + "px";
stats.dom.style.top = "0px";


const clock = new Three.Timer();
clock.connect(document);
//MAIN LOOP
function animate(time: number)
{
    stats.begin();

    let mixerUpdateDelta = clock.getDelta();
    if (JetController)
    {
        jetController?.update(mixerUpdateDelta, keysPressed);
    }

    orbitControls.update();
    renderer.render(scene, camera);

    clock.update();
    stats.end();
}


document.body.appendChild(renderer.domElement);
document.body.appendChild(stats.dom);
renderer.setAnimationLoop(animate);
