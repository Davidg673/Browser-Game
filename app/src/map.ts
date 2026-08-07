import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three'


export function generateMap(scene: THREE.Scene, world: RAPIER.World)
{
    const textureLoader = new THREE.TextureLoader();    
    const floorTexture = textureLoader.load("./app/public/map/floor/tex/grid.png");

    const WIDTH = 100000;

    const geometry = new THREE.PlaneGeometry(WIDTH, WIDTH, 512, 512);
    const material = new THREE.MeshStandardMaterial({map: floorTexture});

    wrapAndRepeatTexture(material.map);


    const floor = new THREE.Mesh(geometry, material);
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -5, 0);
    
    scene.add(floor);


    let floorBodyBuilder = new RAPIER.RigidBodyDesc(RAPIER.RigidBodyType.Fixed).setTranslation(0,-5,0).setRotation(new THREE.Quaternion(0, 0, 0));
    let floorRigidBody = world.createRigidBody(floorBodyBuilder);
    let floorCollider = RAPIER.ColliderDesc.cuboid(WIDTH/2, 0.1, WIDTH/2);
    world.createCollider(floorCollider, floorRigidBody);
}

function wrapAndRepeatTexture (map: THREE.Texture | null) {
    if (!map) return;
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.x = map.repeat.y = 10000
}
