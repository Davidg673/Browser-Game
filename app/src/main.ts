import * as Three from 'three';
import { OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Jet } from './jetClass';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { generateMap } from './map';
import { RapierDebugRenderer } from './rapierDebugRenderer';
import RAPIER from '@dimforge/rapier3d-compat'
import { PointerLockControls, TrackballControls } from 'three/examples/jsm/Addons.js';
import { MOUSE1, W } from './utils';

//SCENE
const scene = new Three.Scene();
scene.background = new Three.Color(0xa8def0);

//CAMERA
const camera = new Three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); 
const loader = new GLTFLoader();
camera.position.z = 5;
camera.position.y = 5;
camera.position.x = 0;
scene.add(camera);
//RENDERER
const renderer = new Three.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

//LIGHTING
const ambientLight = new Three.AmbientLight(0x333333);
scene.add(ambientLight);

//CONTROLS
const orbitControls = new TrackballControls(camera, renderer.domElement);
orbitControls.minDistance = 5;
orbitControls.maxDistance = 5;
orbitControls.minZoom = 1;
orbitControls.maxZoom = 2;
//orbitControls.maxPolarAngle = Math.PI /2 - 0.05; //Math.PI / 2  for equator
orbitControls.update();


//CONTROL KEYS
const keysPressed: any = {};
let mouse = new Three.Vector2;
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

//MOUSE CONTROLS
document.addEventListener("mousemove", (event: MouseEvent) =>{
    mouse.x = event.movementX;
    mouse.y = event.movementY;

});

//MOUSE LOCK CONTROLS
const controls = new PointerLockControls(camera, renderer.domElement);
document.addEventListener("click", () => {
    controls.lock();
});
document.addEventListener("cancel", () => {
    controls.unlock();
});


//WINDOW RESIZER
function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", onWindowResize);


//FPS COUNTER
var stats = new Stats();
stats.showPanel(0); //FPS  
stats.dom.style.position = "absolute";
stats.dom.style.left = (window.screen.width - 97).toString() + "px";
stats.dom.style.top = "0px";


document.body.appendChild(renderer.domElement);
document.body.appendChild(stats.dom);

///DEBUG
await RAPIER.init();


import("@dimforge/rapier3d-compat").then(RAPIER => {
    
    let gravity = {x: 0, y: -9.81, z: 0};
    let world = new RAPIER.World(gravity);

    const clock = new Three.Timer();
    clock.connect(document);
    const FPS = 1000 / 120; //1000 / FPS target

    //MAP
    generateMap(scene, world);

    //Rapier debug
    const rapierDebugger = new RapierDebugRenderer(scene, world);




    //MODELS
    let jet: Jet;

    const JETDIMENSIONS = {x: 1.1, y:0.2, z:1.6};

    const bodyBuilder = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.KinematicVelocityBased).setTranslation(0,0,0)
    let rigidBody = world.createRigidBody(bodyBuilder);
    let collider = RAPIER.ColliderDesc.cuboid(JETDIMENSIONS.x, JETDIMENSIONS.y, JETDIMENSIONS.z).setDensity(0);

    world.createCollider(collider, rigidBody);

    loader.load('./app/public/model/jet/jet.gltf', (gltf) =>{
            const jetModel = gltf.scene;
            jetModel.scale.set(0.2,0.2,0.2);
            scene.add(jetModel);

            const gltfAnim: Three.AnimationClip[] = gltf.animations;
            const mixer = new Three.AnimationMixer(jetModel);
            const animationsMap: Map<string, Three.AnimationAction> = new Map();
            gltfAnim.forEach((value: Three.AnimationClip) => {animationsMap.set(value.name, mixer.clipAction(value))});

            jet = new Jet(jetModel ,rigidBody , mixer, animationsMap, orbitControls, camera, "Idle");
        }
    );




    //MAIN GAME LOOP
    let gameLoop = () =>
    {
        stats.begin();
        world.step();
        let dt = clock.getDelta();

        if (jet != undefined) 
        {
            jet.update(dt, keysPressed, mouse);
        }

        

        orbitControls.update();
        renderer.render(scene, camera);

        controls.update(dt);
        clock.update();
        stats.end();
        rapierDebugger.update();
        setTimeout(gameLoop, FPS);
    };

    gameLoop();

});




