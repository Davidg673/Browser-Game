import * as THREE from 'three'


export function generateMap(scene: THREE.Scene)
{
    const textureLoader = new THREE.TextureLoader();    
    const floorTexture = textureLoader.load("./app/public/map/floor/tex/grid.png");

    const WIDTH = 100;

    const geometry = new THREE.PlaneGeometry(WIDTH, WIDTH, 512, 512);
    const material = new THREE.MeshStandardMaterial({map: floorTexture});

    wrapAndRepeatTexture(material.map);


    const floor = new THREE.Mesh(geometry, material);
    floor.receiveShadow = true;
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -5, 0);
    
    scene.add(floor);
}

function wrapAndRepeatTexture (map: THREE.Texture | null) {
    if (!map) return;
    map.wrapS = map.wrapT = THREE.RepeatWrapping
    map.repeat.x = map.repeat.y = 10
}
