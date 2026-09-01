import * as Three from 'three';
import { OrbitControls} from 'three/addons/controls/OrbitControls.js';
import { A, CONTROL, D, DIRECTIONS, E, MOUSE1, Q, S, SHIFT, SPACE, W } from './utils';
import { debug, mix, sqrt } from 'three/tsl';
import RAPIER from '@dimforge/rapier3d-compat'
import { FirstPersonControls, TrackballControls } from 'three/examples/jsm/Addons.js';

export class Jet{

    world?: RAPIER.World;
    model?:  Three.Group;
    rigidBody?: RAPIER.RigidBody;  
    bulletMap?: Set<number>; //Set of currently active bullets as collider handles. used to identify in collision events 
    mixer?: Three.AnimationMixer;
    animationsMap?: Map<string, Three.AnimationAction>; //idle, jet on
    orbitControls?: OrbitControls;
    camera?: Three.Camera;

    //state
    currentAction?: string;
    cameraOffset = new Three.Vector3(0, 1, -5);
    cameraRotation = new Three.Quaternion();
    //data
    lookDir: Three.Vector3 = new Three.Vector3();
    shootCooldown: number = 0.05;
    currentCooldown: number = 0;
    //constants
    fadeDuration: number = 0.2;
    minVelocity = 10;
    maxVelocity = 200; 
    velocityToSet = 0;
    velocityIncrement = 0.5;
    orbitTarget = new Three.Vector3();
    yAxis = new Three.Vector3(0,1,0);
    xAxis = new Three.Vector3(1,0,0);
    zAxis = new Three.Vector3(0,0,1);

    static Builder = class {
            _world?: RAPIER.World;
            _model?:  Three.Group;
            _rigidBody?: RAPIER.RigidBody; 
            _mixer?: Three.AnimationMixer;
            _animationsMap?: Map<string, Three.AnimationAction>; //idle, jet on
            _orbitControls?: OrbitControls;
            _camera?: Three.Camera;
            _currentAction: string = "";

            public setWorld(world: RAPIER.World){
                this._world = world;
                return this;
            }
            
            public setModel(model: Three.Group){
                this._model = model;
                return this;
            }

            public setRigidBody(rb: RAPIER.RigidBody){
                this._rigidBody = rb;
                return this;
            }

            public setMixer(mixer: Three.AnimationMixer){
                this._mixer = mixer;
                return this;    
            }

            public setAnimationsMap(map: Map<string, Three.AnimationAction>){
                this._animationsMap = map;
                return this;
            }
            
            public setOrbitConrols(controls: OrbitControls){
                this._orbitControls = controls;
                return this;
            }

            public setCamera(camera: Three.Camera){
                this._camera = camera;
                return this;
            }

            public setCurrentAction(action: string)
            {
                this._currentAction = this._currentAction;
                return this;
            }

            build()
            {
                const jet: Jet = new Jet(
                    this._world,
                    this._model,
                    this._rigidBody,
                    this._mixer,
                    this._animationsMap,
                    this._orbitControls,
                    this._camera,
                    this._currentAction
                )
                return jet;
            }
    }

    constructor(world?: RAPIER.World ,model?: Three.Group,rigidBody?: RAPIER.RigidBody, mixer?: Three.AnimationMixer, 
        animationsMap?: Map<string, Three.AnimationAction>, orbitControls?: OrbitControls ,
        camera?: Three.Camera, currentAction?: string
    )
    {
        this.world = world;
        this.model = model;
        this.rigidBody = rigidBody;
        this.bulletMap = new Set<number>();
        this.mixer = mixer;
        this.animationsMap = animationsMap;
        this.orbitControls = orbitControls;
        this.camera = camera;
        this.currentAction = currentAction;
        this.animationsMap?.forEach((value, key) => {
            if (key == currentAction)
            {
                value.play();
            }
        });
    }


    public update(delta: number, keysPressed: any, mouse: Three.Vector2)
    {
        if (!this.rigidBody || !this.orbitControls) return;

        this.animate(delta, keysPressed);


        let position = this.rigidBody.translation(); // get position from rigidbody
        
        this.model?.getWorldDirection(this.lookDir).normalize(); //Store facing direction of jet
        this.model?.position.set(position.x, position.y - 0.15, position.z); //update model with rigidbody

        //CAMERA
        this.model?.getWorldPosition(this.orbitTarget);
        this.orbitControls.target = this.orbitTarget.add(new Three.Vector3(0, this.lookDir.y + 1,0))

        //move 
        this.move(keysPressed, mouse);

        //shoot
        if (keysPressed[Q]) this.shoot(delta);
    }


    private move(keysPressed: any, mouse: Three.Vector2)
    {         
        if (!this.rigidBody || !this.model) return;


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
            this.model?.rotateOnAxis(this.xAxis, -0.01);
        } else{
            if (mouse.y >1 || mouse.y < -1)
            {
                this.model?.rotateOnAxis(this.xAxis, mouse.y * -0.0007);
            } 
        }
        //ROLL
        if (mouse.x >1 || mouse.x < -1)
        {
            this.model?.rotateOnAxis(this.zAxis,mouse.x * 0.0007);
        }
        //YAW
        if (keysPressed[A] == true)
        {
            this.model?.rotateOnAxis(this.yAxis, 0.007)
        } else if (keysPressed[D] == true)
        {
            this.model?.rotateOnAxis(this.yAxis, -0.007)
        }
    }

    private moveByKeyboard(keysPressed: any)
    {
        
        //PITCH
        if (keysPressed[S] || keysPressed[SPACE])
        {
            this.model?.rotateOnAxis(this.xAxis, -0.02);

        }
        if (keysPressed[W])
        {
            this.model?.rotateOnAxis(this.xAxis, 0.02);

        }
        //ROLL
        if (keysPressed[A])
        {
            this.model?.rotateOnAxis(this.zAxis, -0.04);

        }
        if (keysPressed[D])
        {
            this.model?.rotateOnAxis(this.zAxis, 0.04);

        }        
        //YAW
        if (keysPressed[Q] == true)
        {
            this.model?.rotateOnAxis(this.yAxis, 0.007)
        } else if (keysPressed[E] == true)
        {
            this.model?.rotateOnAxis(this.yAxis, -0.007)
        }
    }

    private magnitude(vec: RAPIER.Vector3)
    {
        return Math.sqrt(vec.x**2 + vec.y ** 2 + vec.z ** 2);
    }

    private animate(delta: number, keysPressed: any)
    {
        if (!this.animationsMap || !this.currentAction) return;

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

        this.mixer?.update(delta);
    }
    
    private shoot(delta: number)
    {       
        if (!this.model || !this.world) return;

        if (this.currentCooldown > 0) //shoot cooldown, counts down from "shootCooldown" and resets on 0
        {
            this.currentCooldown -= delta; //FPS independent. makes sure every player shoots at same speed
            return;
        } else
        {
            this.currentCooldown = this.shootCooldown;
        }

        const bulletColliderDesc = RAPIER.ColliderDesc
            .capsule(0.2,0.2)
            //Spawn bullet in front of model. uses current model look direction added on current pos, extended by 20 to avoid clipping
            .setTranslation(this.model.position.x + this.lookDir.x * 20, 
                this.model.position.y + this.lookDir.y * 20, 
                this.model.position.z + this.lookDir.z * 20)
                .setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.DEFAULT)
                .setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
        let bulletRb = this.world.createRigidBody(RAPIER.RigidBodyDesc.dynamic()); //create dynamic/physics rigidbody
        const collider: RAPIER.Collider = this.world.createCollider(bulletColliderDesc, bulletRb);
        let forceDir = this.lookDir; //copying avoids changing stored direction value
        bulletRb.addForce(forceDir.multiplyScalar(100), true);

        //add to active bullets
        this.bulletMap?.add(collider.handle);
    }



    //GETTERS/SETTERS

    public isActiveBullet(colliderHandle: number): boolean | undefined
    {
        return this.bulletMap?.has(colliderHandle);
    }

    public removeActiveBullet(colliderHandle: number)
    {
        this.bulletMap?.delete(colliderHandle);   
    }
}