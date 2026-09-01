import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three'
const MAP_WIDTH = 50000;
let materialArray: Array<THREE.MeshBasicMaterial> = [];


export function generateMap(scene: THREE.Scene, world: RAPIER.World)
{
    //TEXTURES
    const textureLoader = new THREE.TextureLoader();  
    loadTextures(textureLoader);  

    //SKYBOX
    let skyboxGeo = new THREE.BoxGeometry(MAP_WIDTH, MAP_WIDTH, MAP_WIDTH);
    let skybox = new THREE.Mesh(skyboxGeo, materialArray);
    materialArray.forEach(element => {
        element.side = THREE.BackSide;
    });
    scene.add(skybox);


    //GROUND
    let groundGEO = new THREE.PlaneGeometry(MAP_WIDTH, MAP_WIDTH, 512, 512);
    let disMap = textureLoader.load("./app/public/map/ground/map.png");
    const groundTextureMat = textureLoader.load("./app/public/map/skybox/trance_dn.jpg");
    wrapAndRepeatTexture(disMap);
    const groundMat = new THREE.MeshBasicMaterial({
        map: groundTextureMat,
    });
    const groundMesh = new THREE.Mesh(groundGEO, groundMat);
    scene.add(groundMesh);
    groundMesh.rotation.x = -Math.PI /2;


    let floorCollider = RAPIER.ColliderDesc.cuboid(MAP_WIDTH/2, 5, MAP_WIDTH/2)
        .setTranslation(0, -5, 0).setRotation(new THREE.Quaternion(0, 0, 0));
    world.createCollider(floorCollider);


    //BORDER
    createBorder(scene, world, new THREE.Vector3(0,0,MAP_WIDTH * 0.5), new THREE.Vector3(MAP_WIDTH, MAP_WIDTH, 5 ));
    createBorder(scene, world, new THREE.Vector3(0,0,-MAP_WIDTH * 0.5), new THREE.Vector3(MAP_WIDTH, MAP_WIDTH, 5 ));
    createBorder(scene, world, new THREE.Vector3(MAP_WIDTH * 0.5,0,0), new THREE.Vector3(5, MAP_WIDTH, MAP_WIDTH ));
    createBorder(scene, world, new THREE.Vector3( -MAP_WIDTH * 0.5,0,0), new THREE.Vector3(5, MAP_WIDTH, MAP_WIDTH ));
    createBorder(scene, world, new THREE.Vector3( 0,MAP_WIDTH * 0.8,0), new THREE.Vector3(MAP_WIDTH, 5, MAP_WIDTH ));

}

function createBorder(scene: THREE.Scene, world: RAPIER.World, translation: THREE.Vector3, dimensions: THREE.Vector3)
{
    let colliderBlueprint = RAPIER.ColliderDesc.cuboid(dimensions.x, dimensions.y, dimensions.z)
    .setTranslation(translation.x, translation.y, translation.z)
    .setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.DEFAULT)
    .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
    world.createCollider(colliderBlueprint);
}

function loadTextures(textureLoader: THREE.TextureLoader)
{
    const texture_ft = textureLoader.load("./app/public/map/skybox/trance_ft.jpg");
    const texture_bk = textureLoader.load("./app/public/map/skybox/trance_bk.jpg");
    const texture_dn = textureLoader.load("./app/public/map/skybox/trance_dn.jpg");
    const texture_lf = textureLoader.load("./app/public/map/skybox/trance_lf.jpg");
    const texture_rt = textureLoader.load("./app/public/map/skybox/trance_rt.jpg");
    const texture_up = textureLoader.load("./app/public/map/skybox/trance_up.jpg");

    materialArray.push(new THREE.MeshBasicMaterial({map: texture_ft}));
    materialArray.push(new THREE.MeshBasicMaterial({map: texture_bk}));
    materialArray.push(new THREE.MeshBasicMaterial({map: texture_up}));
    materialArray.push(new THREE.MeshBasicMaterial({map: texture_dn}));
    materialArray.push(new THREE.MeshBasicMaterial({map: texture_rt}));
    materialArray.push(new THREE.MeshBasicMaterial({map: texture_lf}));
}

function wrapAndRepeatTexture (map: THREE.Texture | null) {
    if (!map) return;
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.x = map.repeat.y = MAP_WIDTH
}
