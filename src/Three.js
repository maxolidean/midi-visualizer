import React, {Component} from 'react';
import WebMidi from 'webmidi'
import * as THREE from 'three';
import * as TWEEN from 'three-tween';

var canvasStyle ={
    width: "100px",
    height: "100px"
}

class Three extends Component {
    constructor(props) {
        super(props);
        this.animate = this.animate.bind(this);
        this.controlChange = this.controlChange.bind(this);
        this.configMidi = this.configMidi.bind(this);
    }
    
    componentDidMount(){
        WebMidi.enable(this.configMidi);

        this.context = {
            backgroundColor: new THREE.Color(119 / 255 , 0, 255 / 255),
            scaleRatio: 2.5,
            rotationVelocity: 0,
            rotationAngle: 0,
            rotationAngleX: 0,
            hatSize: 1,
            explosion: {
                movementSpeed: 10,
                totalObjects: 300,
                objectSize: 0,
                sizeRandomess: 100,
                colors: [0x002460, 0x356dce, 0xa0bef0, 0xd7e6ff, 0xFFFFFF],
                dirs: [],
                parts: []
            },
        }

        const width = this.mount.clientWidth
        const height = this.mount.clientHeight
        
        //ADD SCENE
        this.scene = new THREE.Scene()

        //ADD CAMERA
        this.camera = new THREE.PerspectiveCamera(
          35,
          width / height,
          0.1,
          1000
        )

        this.camera.position.z = 20;
        this.camera.position.x = 0;
        this.camera.position.y = 0;
        this.camera.zoomIn = false;

        //ADD RENDERER
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setClearColor(this.context.backgroundColor);
        this.renderer.setSize(width, height);
        this.mount.appendChild(this.renderer.domElement);

        // Materials:
        const normalMaterial = new THREE.MeshNormalMaterial({ opacity: 1, flatShading: 1, wireframe: false, morphTargets: true });
        const basicMaterial = new THREE.MeshBasicMaterial({ color: '#1ff4bc', wireframe: true });
        
        // ADD Plane
        const planeGeometry = new THREE.PlaneBufferGeometry(100, 100, 20, 20);
        this.plane = new THREE.Mesh(planeGeometry, basicMaterial);
        this.plane.position.set(0, 0, -20);
        this.scene.add(this.plane);

        // ADD Plane
        this.plane2 = new THREE.Mesh(planeGeometry, basicMaterial);
        this.plane2.position.set(0, 0, 20);
        this.scene.add(this.plane2);

        //ADD Sphere -> KICK
        const sphereGeometry = new THREE.SphereBufferGeometry(1.5, 20, 20);
        this.kick = new THREE.Mesh(sphereGeometry, normalMaterial);
        this.kick.position.set(0,0,0);
        this.scene.add(this.kick);
        
        //ADD Torus -> SNARE
        const torusGeometry = new THREE.TorusBufferGeometry(1.1,0.5, 20, 20, 6.3);
        this.snare = new THREE.Mesh(torusGeometry, normalMaterial);
        this.snare.position.set(-5,0,0);
        this.scene.add(this.snare);

        //ADD Cylinder -> OH
        const cylinderGeometry = new THREE.CylinderBufferGeometry(1.5, 1.5, 1, 22, 1, false, 1, 6.3);
        this.oh = new THREE.Mesh(cylinderGeometry, normalMaterial);
        this.oh.position.set(-10,0,0);
        this.scene.add(this.oh);

        //ADD Octa -> Hand Clap
        const octaGeometry = new THREE.OctahedronBufferGeometry(1.6, 0);
        this.hclap = new THREE.Mesh(octaGeometry, normalMaterial);
        this.hclap.position.set(5,0,0);
        this.scene.add(this.hclap);
        
        //ADD Knot -> Rim Shot
        const knotGeometry = new THREE.TorusKnotBufferGeometry(0.9, 0.20, 82, 14, 6, 5);
        this.rim = new THREE.Mesh(knotGeometry, normalMaterial);
        this.rim.position.set(10,0,0);
        this.scene.add(this.rim);

        //Init scales
        this.scaleObject(this.kick, 0);
        this.scaleObject(this.snare, 0);
        this.scaleObject(this.oh, 0);
        this.scaleObject(this.rim, 0);
        this.scaleObject(this.hclap, 0);

        this.mixer = {
            kick: 0,
            snare: 0,
            rim: 0,
            oh: 0,
            hclap: 0,
            htom: 0
        };
        
        this.start()        
        window.addEventListener("resize", this.handleResize);
    }

    handleResize = () => {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    componentWillUnmount(){
        this.stop()
        this.mount.removeChild(this.renderer.domElement)
        window.removeEventListener("resize", this.handleResize().bind(this));
    }
    
    configMidi = (err) => {
        console.log("WebMidi could not be enabled.", err);
            if (err) {
                console.log(err);
          } 
          else {            
            console.log("WebMidi enabled!");
            console.log(WebMidi.inputs);
            console.log(WebMidi.outputs);
            
            //UltraLite MIDI Port
            var input = WebMidi.getInputByName("UltraLite MIDI Port");
            if (input) {
                input.addListener('noteon', "all", this.noteOn);
                input.addListener('noteoff', 'all', this.noteOff);
                input.addListener('controlchange', 'all', this.controlChange)
            }
          }
    }

    makeExplosion = (x,y,z, intensity = 1) => {
        this.context.explosion.parts.push(new this.explodeAnimation(x,y,z, this.scene, this.context.explosion, intensity))
    }

    explodeAnimation =  function (x, y, z, scene, context, intensity) {
        var geometry = new THREE.Geometry();
        var totalObjects = Math.round(context.totalObjects * intensity);

        for (var i = 0; i < totalObjects; i ++) 
        { 
          var vertex = new THREE.Vector3();
          vertex.x = x;
          vertex.y = y;
          vertex.z = z;
        
          geometry.vertices.push( vertex );
          context.dirs.push({
              x:(Math.random() * context.movementSpeed)-(context.movementSpeed/2),
              y:(Math.random() * context.movementSpeed)-(context.movementSpeed/2),
              z:(Math.random() * context.movementSpeed)-(context.movementSpeed/2)});
        }

        var material = new THREE.ParticleBasicMaterial({ 
            size: context.objectSize * intensity,  
            color: context.colors[Math.round(Math.random() * context.colors.length)] 
        });

        var particles = new THREE.ParticleSystem(geometry, material);

        scene.add(particles); 

        this.update = () => {
            var pCount = totalObjects;
            while(pCount--) {
              var particle =  particles.geometry.vertices[pCount]
              particle.y += context.dirs[pCount].y;
              particle.x += context.dirs[pCount].x;
              particle.z += context.dirs[pCount].z;
            }
            particles.geometry.verticesNeedUpdate = true;
        }
    }

    scaleObject = (o, value) => {
        o.scale.x = value / 127;
        o.scale.y = value / 127;
        o.scale.z = value / 127;
    }

    controlChange = (e) => {
        if (e.channel == 10) {
            var controller = e.controller.number;
            switch(controller) {
                case 12: // External-In Level
                    this.context.explosion.objectSize = e.value * 30 / 127;
                    break;
                case 16: // Delay level
                    break;
                case 17: // Delay time
                    break;
                case 18: // Delay feedback
                    if (e.value > 63)
                        this.context.rotationVelocity = 0.2 * (e.value - 63) / 127;
                    else
                        this.context.rotationVelocity = -0.2 * (63 - e.value) / 63;
                    break;
                case 24: // Kick level
                    this.mixer.kick = e.value;
                    this.scaleObject(this.kick, e.value);
                    break;
                case 29: // Snrae level
                    this.mixer.snare = e.value;
                    this.scaleObject(this.snare, e.value);
                    break;
                case 60: // HClap level
                    this.mixer.hclap = e.value;
                    this.scaleObject(this.hclap, e.value);
                    break;
                case 54: // Hi Tom Level
                    this.mixer.htom = e.value;
                    this.context.rotationAngleX = e.value * 6.28319 / 127;
                    break;
                case 57: // Rim level
                    this.mixer.rim = e.value;
                    this.scaleObject(this.rim, e.value);
                    break;
                case 81: // Ohat level
                    this.oh.scale.y = e.value * 4 / 127;
                    break;
                case 82: // Ohat level
                    this.mixer.oh = e.value;
                    this.scaleObject(this.oh, e.value);
                    break;
                case 89: // Reverb time
                    this.context.explosion.totalObjects = e.value * 1000 / 127;
                    break;
                case 90: // Reverb gate        
                    var r = Math.round(e.value * 119 / 127);
                    //var g = this.context.backgroundColor.g;
                    var b = Math.round(e.value * 255 / 127)
                    this.context.backgroundColor = new THREE.Color(r / 255, 0, b / 255);
                    break;
                case 91: // Reverb level
                    var r = Math.round(255 * ((127 - e.value) / 127) + 119) ;
                    var g = Math.round(255 * ((127 - e.value) / 127)) ;
                    var b = 255;
                    this.context.backgroundColor = new THREE.Color(r / 255, g / 255, b / 255);
                    break;
            }
        }
    }

    noteOn = (e) => {
        if (e.channel == 10) {
            var note = e.note.name + e.note.octave;
            switch(note) {
                case "C2":
                    this.scaleObject(this.kick, this.mixer.kick * this.context.scaleRatio);
                    var color = new THREE.Color(Math.round(50, 0, 255));
                    this.renderer.setClearColor(color);
                    break;
                case "D2":
                    this.scaleObject(this.snare, this.mixer.snare * this.context.scaleRatio);
                    this.makeExplosion(this.snare.position.x,this.snare.position.y, this.snare.position.z, this.mixer.snare / 127);
                    break;
                case "A#2":
                    this.scaleObject(this.oh, this.mixer.oh * this.context.scaleRatio);
                    break;
                case "D#2":
                    this.scaleObject(this.hclap, this.mixer.hclap * this.context.scaleRatio);
                    break;
                case "C#2":
                    this.scaleObject(this.rim, this.mixer.rim * this.context.scaleRatio);
                    break;
            }
        }
    }

    scaleDown = (o, to, msecs = 100 ) => {
        var from = to * this.context.scaleRatio;
        var tween = new TWEEN.Tween({scale: from, o: o})
        .to({scale: to}, msecs)
        .onUpdate( function() {
            this.o.scale.x = this.scale / 127;
            this.o.scale.y = this.scale / 127;
            this.o.scale.z = this.scale / 127;
        });
        tween.start();
    }    

    noteOff = (e) => {
        if (e.channel == 10) {
            var note = e.note.name + e.note.octave;
            switch(note)
            {
                case "C2":
                    this.scaleDown(this.kick, this.mixer.kick);
                    break;
                case "D2":
                    this.scaleDown(this.snare, this.mixer.snare); 
                    break;
                case "A#2":
                    this.scaleDown(this.oh, this.mixer.oh); 
                    break;
                case "D#2":
                    this.scaleDown(this.hclap, this.mixer.hclap); 
                    break;
                case "C#2":
                    this.scaleDown(this.rim, this.mixer.rim); 
                    break;
            }
        }
    }

    start = () => {
        if (!this.frameId) {
          this.frameId = requestAnimationFrame(this.animate)
        }
    }
    
    stop = () => {
        cancelAnimationFrame(this.frameId)
    }
    
    animate = () => {

       this.scene.background = this.context.backgroundColor;

       // Update rotation
       this.kick.rotation.y += 0.01;
       this.snare.rotation.y  += 0.08;
       this.oh.rotation.x  += 0.04;
       this.hclap.rotation.y  += 0.08;
       this.rim.rotation.z  += 0.04;
       
       // Rotate camera
       if (this.context.rotationVelocity != 0){
            this.context.rotationAngle += this.context.rotationVelocity;
       }


       var x = 20 * Math.sin(this.context.rotationAngleX);
       var y = 20 * Math.cos(this.context.rotationAngle);
       var z = 20 * Math.sin(this.context.rotationAngle);
       this.camera.position.x = x;
       this.camera.position.y = y;
       this.camera.position.z = z;
       this.camera.lookAt(this.scene.position);
        
       if (z < 0) {
            this.camera.rotation.z = 0;
       }

       if (x < 0) {
        this.camera.rotation.x = 0;
       }

       console.log(this.camera.rotation.z);

       TWEEN.update();

       // Update particles
       var pCount = this.context.explosion.parts.length;
       while(pCount--) {
         this.context.explosion.parts[pCount].update();
       }


       this.renderScene()
       this.frameId = window.requestAnimationFrame(this.animate)
    }
    
    renderScene = () => {
      this.renderer.render(this.scene, this.camera)
    }
    

    render(){
        return(
          <div
            className='threeContainer'
            ref={(mount) => { this.mount = mount }}
          />
        )
    }
}

export default Three;