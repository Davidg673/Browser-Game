import * as Three from 'three';
import { OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { A, CONTROL, D, DIRECTIONS, E, MOUSE1, Q, S, SHIFT, SPACE, W } from './utils';
import { debug, sqrt } from 'three/tsl';
import RAPIER from '@dimforge/rapier3d-compat'
import { FirstPersonControls, TrackballControls } from 'three/examples/jsm/Addons.js';

export class Jet{

    model:  Three.Group;
    rigidBody: RAPIER.RigidBody; 
    mixer: Three.AnimationMixer;
    animationsMap: Map<string, Three.AnimationAction> = new Map(); //idle, jet on
    orbitControls: OrbitControls;
    camera: Three.Camera;
    cameraPivot: Three.Object3D | null;

    //state
    currentAction: string;
    cameraOffset = new Three.Vector3(0, 1, -5);
    cameraRotation = new Three.Quaternion();
    //data
    lookDir: Three.Vector3 = new Three.Vector3();
    //constants
    fadeDuration: number = 0.2;
    minVelocity = 10;
    maxVelocity = 20; 
    velocityToSet = 0;
    velocityIncrement = 0.5;
    orbitTarget = new Three.Vector3();
    yAxis = new Three.Vector3(0,1,0);
    xAxis = new Three.Vector3(1,0,0);
    zAxis = new Three.Vector3(0,0,1);


    constructor(model: Three.Group,rigidBody: RAPIER.RigidBody , mixer: Three.AnimationMixer, 
        animationsMap: Map<string, Three.AnimationAction>, orbitControls: OrbitControls ,
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
        this.cameraPivot = camera.parent;
    }

    public update(delta: number, keysPressed: any, mouse: Three.Vector2)
    {

        this.animate(delta, keysPressed);


        let position = this.rigidBody.translation();
        
        this.model.getWorldDirection(this.lookDir).normalize();
        this.model.position.set(position.x, position.y - 0.15, position.z);

        //CAMERA
        this.model.getWorldPosition(this.orbitTarget);
        this.orbitControls.target = this.orbitTarget.add(new Three.Vector3(0, this.lookDir.y + 1,0))

        //move 
        this.move(keysPressed, mouse);

        //shot
        if (keysPressed[MOUSE1]) this.shoot;
    }


    private move(keysPressed: any, mouse: Three.Vector2)
    {         
        const currentVelocity: number = this.magnitude(this.rigidBody.linvel());
        this.velocityToSet = currentVelocity;

        if (keysPressed[SHIFT] == true)
        {
            if (currentVelocity < this.maxVelocity)
            {
                this.velocityToSet += this.velocityIncrement;
            }
        }
        else if (keysPressed[CONTROL] == true)
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
            
        
        
        //this.moveByKeyboard(keysPressed);
        this.moveByMouse(keysPressed, mouse);
        //Mouse movements
        //PITCH
        
        this.rigidBody.setRotation({x: this.model.rotation.x,y:this.model.rotation.y,z:this.model.rotation.z, w:1}, true);
    }

    private moveByMouse(keysPressed: any, mouse: Three.Vector2)
    {
      if (keysPressed[SPACE] == true)
        {
            this.model.rotateOnAxis(this.xAxis, -0.01);
        } else{
            if (mouse.y >1 || mouse.y < -1)
            {
                this.model.rotateOnAxis(this.xAxis, mouse.y * -0.0007);
                //this.cameraPivot?.rotateOnAxis(this.xAxis, mouse.y * -0.0007);
            } 
        }
        //ROLL
        if (mouse.x >1 || mouse.x < -1)
        {
            this.model.rotateOnAxis(this.zAxis,mouse.x * 0.0007);
            //this.cameraPivot?.rotateOnAxis(this.zAxis,-mouse.x * 0.0007);
        }
        //YAW
        if (keysPressed[A] == true)
        {
            this.model.rotateOnAxis(this.yAxis, 0.007)
            //this.cameraPivot?.rotateOnAxis(this.yAxis, 0.007);
        } else if (keysPressed[D] == true)
        {
            this.model.rotateOnAxis(this.yAxis, -0.007)
            //this.cameraPivot?.rotateOnAxis(this.yAxis, -0.007);
        }
    }

    private moveByKeyboard(keysPressed: any)
    {
        
        //PITCH
        if (keysPressed[S] || keysPressed[SPACE])
        {
            this.model.rotateOnAxis(this.xAxis, -0.02);

        }
        if (keysPressed[W])
        {
            this.model.rotateOnAxis(this.xAxis, 0.02);

        }
        //ROLL
        if (keysPressed[A])
        {
            this.model.rotateOnAxis(this.zAxis, -0.04);

        }
        if (keysPressed[D])
        {
            this.model.rotateOnAxis(this.zAxis, 0.04);

        }        
        //YAW
        if (keysPressed[Q] == true)
        {
            this.model.rotateOnAxis(this.yAxis, 0.007)
        } else if (keysPressed[E] == true)
        {
            this.model.rotateOnAxis(this.yAxis, -0.007)
        }
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
    
    private shoot()
    {
        
    }


}