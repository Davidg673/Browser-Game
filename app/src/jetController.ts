import * as Three from 'three';
import { OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { A, D, DIRECTIONS, S, W } from './utils';
import { debug } from 'three/tsl';


export class JetController{

    model:  Three.Group;
    mixer: Three.AnimationMixer;
    animationsMap: Map<string, Three.AnimationAction> = new Map(); //idle, jet on
    orbitControls: OrbitControls;
    camera: Three.Camera;

    //state
    currentAction: string;

    //data
    moveDirection = new Three.Vector3();
    rotateAngle = new Three.Vector3(0, 1, 0);
    rotateQuaternion: Three.Quaternion = new Three.Quaternion();
    cameraTarget = new Three.Vector3();

    //constants
    fadeDuration: number = 0.2;
    moveVelocity = 2;
    BoostVelocity = 5;

    //physics





    constructor(model: Three.Group, mixer: Three.AnimationMixer, 
        animationsMap: Map<string, Three.AnimationAction>, orbitControls: OrbitControls,
        camera: Three.Camera, currentAction: string
    )
    {
        this.model = model;
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

    public update(delta: number, keysPressed: any)
    {
        const directionPressed = DIRECTIONS.some(key => keysPressed[key] == true);

        var play = "";
        if (directionPressed && keysPressed["shift"] == true)
        {
            play = "boost";
        }else if (directionPressed)
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

        //Move
        if (this.currentAction == "boost" || this.currentAction == "move")
        { 
            var angleYCameraDirection = Math.atan2(
                (this.camera.position.x - this.model.position.x),
                (this.camera.position.z - this.model.position.z)
            );
            //diagonal movement from offset
            var directionOffset = this.directionOffset(keysPressed);

            //rotate model
            this.rotateQuaternion.setFromAxisAngle(this.rotateAngle, angleYCameraDirection + directionOffset);
            this.model.quaternion.rotateTowards(this.rotateQuaternion, 0.2);
        
            //calculate direction
            this.camera.getWorldDirection(this.moveDirection);
            this.moveDirection.y = 0;
            this.moveDirection.normalize();
            this.moveDirection.applyAxisAngle(this.rotateAngle, directionOffset);

            //move/boost
            const velocity = this.currentAction == "boost" ? this.BoostVelocity : this.moveVelocity;

            const moveX = this.moveDirection.x * velocity * delta;
            const moveZ = this.moveDirection.z * velocity * delta;
            this.model.position.x -= moveX;
            this.model.position.z -= moveZ;

            this.updateCameraTarget(moveX, moveZ);
        }

    }

    private updateCameraTarget(moveX: number, moveZ: number)
    {
        this.camera.position.x += moveX;
        this.camera.position.z += moveZ;

        this.cameraTarget.x = this.model.position.x;
        this.cameraTarget.y = this.model.position.y +1;
        this.cameraTarget.z = this.model.position.z;
        this.orbitControls.target = this.cameraTarget;
    }

    private directionOffset(keysPressed: any)
    {
        var directionOffset = 0; //w

        if (keysPressed[S])
        {
            if (keysPressed[D]) directionOffset = Math.PI / 4; //w + a
            else if (keysPressed[A]) directionOffset = - Math.PI / 4; // w + d
        }
        else if (keysPressed[W])
        {
            if (keysPressed[D]) directionOffset = Math.PI / 4 + Math.PI / 2 // s + a
            else if (keysPressed[A]) directionOffset = -Math.PI / 4 - Math.PI / 2 // s + d
            else directionOffset = Math.PI //s
        }
        else if (keysPressed[D]) directionOffset = Math.PI / 2 //a
        else if (keysPressed[A]) directionOffset = -Math.PI / 2 //d

        return directionOffset;
    }   
    
}