import RAPIER from '@dimforge/rapier3d-compat';
import * as Three from 'three';


export class RapierDebugRenderer 
{
    mesh;
    world;
    enabled = true;

    constructor(scene: Three.Scene, world: RAPIER.World)
    {
        this.world = world;
        this.mesh = new Three.LineSegments(new Three.BufferGeometry(), new Three.LineBasicMaterial({ color: 0xffffff, vertexColors: true }));
        this.mesh.frustumCulled = false
        scene.add(this.mesh);
    }

    update()
    {
        if (this.enabled)
        {
            const {vertices, colors} = this.world.debugRender();
            this.mesh.geometry.setAttribute('position', new Three.BufferAttribute(vertices, 3));
            this.mesh.geometry.setAttribute('color', new Three.BufferAttribute(colors, 4));
            this.mesh.visible = true;
        } else{
            this.mesh.visible = false;
        }
    }
}