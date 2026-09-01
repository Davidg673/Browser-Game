import * as Three from 'three';
import { OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Jet } from './jetClass';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { generateMap } from './map';
import { RapierDebugRenderer } from './rapierDebugRenderer';
import RAPIER, { Collider, World } from '@dimforge/rapier3d-compat'
import { EffectComposer, OutputPass, PointerLockControls, RenderPass, TrackballControls } from 'three/examples/jsm/Addons.js';
import { MOUSE1, W } from './utils';
import { FirstPersonControls } from 'three/addons/controls/FirstPersonControls.js';
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';


//SCENE
const scene = new Three.Scene();
scene.background = new Three.Color(0xa8def0);
const loader = new GLTFLoader();

//CAMERA
const camera = new Three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000); 
const cameraPivot = new Three.Object3D();
cameraPivot.name = "camPivot";
camera.position.set(0, 1, -5);  
//RENDERER
const renderer = new Three.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

//POST-PROCCESSING 
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new RenderPixelatedPass(1, scene, camera));
composer.addPass(new OutputPass());
//LIGHTING
const ambientLight = new Three.AmbientLight(0xffffff, 1);
scene.add(ambientLight);

//CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.minDistance = 5;
orbitControls.maxDistance = 5;
orbitControls.minZoom = 1;
orbitControls.maxZoom = 2;
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

    const bodyBuilder = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Dynamic).setTranslation(0,300,0)
    let rigidBody = world.createRigidBody(bodyBuilder);
    let collider = RAPIER.ColliderDesc.cuboid(JETDIMENSIONS.x, JETDIMENSIONS.y, JETDIMENSIONS.z)
        .setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.DEFAULT | RAPIER.ActiveCollisionTypes.KINEMATIC_KINEMATIC);

    world.createCollider(collider, rigidBody);

    loader.load('./app/public/model/jet/jet.gltf', (gltf) =>{
            const jetModel = gltf.scene;
            jetModel.scale.set(0.2,0.2,0.2);
            scene.add(jetModel);

            const gltfAnim: Three.AnimationClip[] = gltf.animations;
            const mixer = new Three.AnimationMixer(jetModel);
            const animationsMap: Map<string, Three.AnimationAction> = new Map();
            gltfAnim.forEach((value: Three.AnimationClip) => {animationsMap.set(value.name, mixer.clipAction(value))});

            jet = new Jet.Builder()
                .setWorld(world)
                .setModel(jetModel)
                .setRigidBody(rigidBody)
                .setMixer(mixer)
                .setAnimationsMap(animationsMap)
                .setOrbitConrols(orbitControls)
                .setCamera(camera)
                .setCurrentAction("Idle")
                .build();
        }
    );

    //EVENTS
    let eventQueue = new RAPIER.EventQueue(true);

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

        world.forEachCollider((collider: RAPIER.Collider) =>{
            collider.activeCollisionTypes
        });

        orbitControls.update();
        controls.update(dt);
        clock.update();
        stats.end();
        rapierDebugger.update();

        //EVENTS
        world.step(eventQueue);
        eventQueue.drainCollisionEvents((handle1, handle2, started)=>{ 
            let isBullet1: boolean | undefined = jet.isActiveBullet(handle1);
            let isBullet2: boolean | undefined = jet.isActiveBullet(handle2);
            console.log("runs")
            //This part removes bullet collider/rb from world 
            if (!isBullet1 && !isBullet2) return; //environmental collision, not bullet and other

            if (isBullet1 && isBullet2) //bullet on bullet, rare but needs handling
            {
                const colliderToRemove1 = world.getCollider(handle1);
                const colliderToRemove2 = world.getCollider(handle2);


                world.removeCollider(colliderToRemove1,true)
                world.removeRigidBody(world.getRigidBody(colliderToRemove1.parent()?.handle ?? 0)); //0 = undefined

                world.removeCollider(colliderToRemove2,true)
                world.removeRigidBody(world.getRigidBody(colliderToRemove2.parent()?.handle ?? 0));

            }
            else if (isBullet1 && !isBullet2) //first collider bullet and second collider plane/other jet
            {
                const colliderToRemove = world.getCollider(handle1);
                world.removeCollider(colliderToRemove,true)
                world.removeRigidBody(world.getRigidBody(colliderToRemove.parent()?.handle ?? 0));
                
            }else
            {
                const colliderToRemove = world.getCollider(handle2);
                world.removeCollider(colliderToRemove,true)
                world.removeRigidBody(world.getRigidBody(colliderToRemove.parent()?.handle ?? 0));
            }

        });

        //renderer.render(scene, camera);
        composer.render();
        setTimeout(gameLoop, FPS);
    };

    gameLoop();

});




