import * as Three from 'three';
import { OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { A, D, DIRECTIONS, S, SHIFT, W } from './utils';
import { debug, sqrt } from 'three/tsl';
import RAPIER from '@dimforge/rapier3d-compat'
import { TrackballControls } from 'three/examples/jsm/Addons.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';


export class Jet{

    model:  Three.Group;
    rigidBody: RAPIER.RigidBody; 
    mixer: Three.AnimationMixer;
    animationsMap: Map<string, Three.AnimationAction> = new Map(); //idle, jet on
    orbitControls: TrackballControls;
    camera: Three.Camera;

    //state
    currentAction: string;
    cameraOffset = new Three.Vector3(0, 1, -5);

    //data
    lookDir: Three.Vector3 = new Three.Vector3();
    //constants
    fadeDuration: number = 0.2;
    minVelocity = 10;
    maxVelocity = 20; 
    velocityToSet = 0;
    velocityIncrement = 0.5;
    currentRotation: Three.Quaternion = new Three.Quaternion();
    yAxis = new Three.Vector3(0,1,0);
    xAxis = new Three.Vector3(1,0,0);
    zAxis = new Three.Vector3(0,0,1);



    constructor(model: Three.Group,rigidBody: RAPIER.RigidBody , mixer: Three.AnimationMixer, 
        animationsMap: Map<string, Three.AnimationAction>, orbitControls: TrackballControls,
        camera: Three.Camera, currentAction: string, 
    )
    {
        this.model = model;
        this.rigidBody = rigidBody;
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        this.orbitControls = orbitControls;
        this.camera = camera;
        this.currentAction = currentAction;
        this.animationsMap.forEach((value, key) => {
            if (key == currentAction)
            {
                value.play();
            }
        });
    }

    public update(delta: number, keysPressed: any, mouse: Three.Vector2)
    {

        this.animate(delta, keysPressed);


        let position = this.rigidBody.translation();
        
        this.model.getWorldDirection(this.lookDir).normalize();
        this.model.position.set(position.x, position.y - 0.15, position.z);
        
        //move 
        this.move(keysPressed, mouse);
        //apply physics
        this.applyPhysics();

        this.updateCameraTarget(); 
    }

    private move(keysPressed: any, mouse: Three.Vector2)
    {         
        const currentVelocity: number = this.magnitude(this.rigidBody.linvel());
        this.velocityToSet = currentVelocity;

        if (keysPressed[W] == true)
        {
            if (currentVelocity < this.maxVelocity)
            {
                this.velocityToSet += this.velocityIncrement;
            }
        }
        else if (keysPressed[S] == true)
        {
            if (currentVelocity > this.minVelocity)                
            {
                this.velocityToSet -= this.velocityIncrement;
            }
        }

        //set velocity to look direction of model
        this.rigidBody
            .setLinvel({x: this.lookDir.x * this.velocityToSet,
                        y: this.lookDir.y * this.velocityToSet,
                        z: this.lookDir.z * this.velocityToSet}, 
                        true);
            

        //Mouse movements

        //PITCH
        this.model.rotateOnWorldAxis(this.xAxis, mouse.y * 0.0005);
        //ROLL
        this.model.rotateOnWorldAxis(this.zAxis, mouse.x * 0.0005);
        let cameraRotation = new Three.Quaternion();
        cameraRotation.setFromAxisAngle(this.zAxis, mouse.x * 0.0005);
        this.camera.quaternion.multiply(cameraRotation);
        
        this.rigidBody.setRotation({x: this.model.rotation.x,y:this.model.rotation.y,z:this.model.rotation.z, w:1}, true);



    }

    private applyPhysics()
    {
        
    }

    private magnitude(vec: RAPIER.Vector3)
    {
        return Math.sqrt(vec.x**2 + vec.y ** 2 + vec.z ** 2);
    }


    private animate(delta: number, keysPressed: any)
    {
        var play = "";

        if (keysPressed["w"] == true && keysPressed["shift"] == true)
        {
            play = "boost";
        }else if (keysPressed["w"] == true)
        {
            play = "move";
        } else
        {
            play = "idle";
        }


        if (this.currentAction != play)
        {
            const toPlay = this.animationsMap.get(play);
            const current = this.animationsMap.get(this.currentAction);

            current?.fadeOut(this.fadeDuration);
            toPlay?.reset().fadeIn(this.fadeDuration).play();

            this.currentAction = play;
        }

        this.mixer.update(delta);
    }


    public updateCameraTarget()
    {
        let currentPosition = new Three.Vector3();
        this.model.getWorldPosition(currentPosition);
        const targetCamPos = currentPosition.copy(currentPosition).add(this.cameraOffset);
        this.camera.position.lerp(targetCamPos, 0.5);
        this.camera.lookAt(currentPosition);
        this.orbitControls.target = this.model.getWorldPosition(new Three.Vector3());
    }

    
}