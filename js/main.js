// global variables
var renderer;
var scene;
var camera;

var control;

//slabs
var velocity;
var density;
var pressure;
var temperature;
var diverge;

var drawTexture;

var plane;
var finalMaterial;
var quad;

//shaders
var advect;
var buoyancy;
var divergence;
var jacobi;
var externalVelocity;
var externalDensity;
var externalTemperature;
var subtractGradient;
var vorticity;
var draw;
var boundary;

var width;
var height;
var color = [0,0,0];
var res = new THREE.Vector2(512, 256);

var displaySettings = {
    Slab: "Density"
};

gui = new dat.GUI();
// gui.add(displaySettings, "Slab", [
//     "Density",
//     "Velocity",
//     "Temperature",
//     "Vorticity",
//     "Pressure",
//     "Divergence"
// ]);

var instruction = gui.addFolder("CLICK TO START FIRE");
    


var pressureSettings = {
      Iterations: 40
  };
var pressureFolder = gui.addFolder("Pressure");
    pressureFolder.add(pressureSettings, "Iterations", 0, 100);

var tempSettings = {
    Flame: 4.0
};
var tempFolder = gui.addFolder("Temperature");
    tempFolder.add(tempSettings, "Flame", 0, 4.0);

var vorticitySettings = {
    Curl: 0.2
};

var vorticityFolder = gui.addFolder("Vorticity");
    vorticityFolder.add(vorticitySettings, "Curl", 0, 2.5);


var colorSettings = {
    Color: "Constant",
    UserColor: [45, 65, 0]
};

var colorFolder = gui.addFolder("Color");
colorFolder.addColor(colorSettings, "UserColor");

var radiusSettings = {
    Radius: 18.0
};

var radiusFolder = gui.addFolder("Radius");
      radiusFolder.add(radiusSettings, "Radius", 0, 25);

var boundarySettings = {
    Boundaries: false
};


function buffer_texture_setup(){

    advect = new Advect(res);
    externalVelocity = new ExternalVelocity(res);
    externalDensity = new ExternalDensity(res);
    testSmoke = new ExternalDensity(res);
    externalTemperature = new ExternalTemperature(res);
    buoyancy = new Buoyancy(res);
    draw = new Draw(res);
    jacobi = new Jacobi(res);
    divergence = new Divergence(res);
    subtractGradient = new SubtractGradient(res);
    curl = new Curl(res);
    vorticityConf = new VorticityConf(res);
    boundary = new Boundary(res);

    // create slabs

    velocity = new Slab(res);
    density = new Slab(res);
    temperature = new Slab(res);
    pressure = new Slab(res);
    //why are there two temps
    temperature = new Slab(res);
    diverge = new Slab(res);
    vorticity = new Slab(res);

    //drawTexture is what is actually being drawn

    drawTexture = new THREE.WebGLRenderTarget( res.x, res.y, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType });

    plane = new THREE.PlaneBufferGeometry( 2, 2 );
    finalMaterial =  new THREE.MeshBasicMaterial({map: drawTexture});
    quad = new THREE.Mesh( plane, finalMaterial );
    scene.add(quad);
}

//Send position of smoke source with value
var mouseDown = false;
var timeStamp = null;
var lastX = null;
var lastY = null;
function UpdateMousePosition(X,Y){
    console.log(X);
    console.log();
    var currentTime = Date.now();
    var deltaTime = currentTime - timeStamp;


    externalVelocity.smokeSource.x = X * res.x / window.innerWidth;
    externalVelocity.smokeSource.y = Y * res.y / window.innerHeight;
    externalVelocity.smokeSource.x = X * res.x;
    externalVelocity.smokeSource.y = Y * res.y;
    externalDensity.smokeSource.x = X * res.x / window.innerWidth;
    externalDensity.smokeSource.y = Y * res.y / window.innerHeight;
    testSmoke.smokeSource.x = X * res.x / window.innerWidth; 
    testSmoke.smokeSource.y = Y * res.y / window.innerHeight;
    externalTemperature.smokeSource.x = X * res.x / window.innerWidth;
    externalTemperature.smokeSource.y = Y * res.y / window.innerHeight;

    if (Math.abs(Math.round((X-lastX) > 2))) {
        externalVelocity.sourceVelocity.x = Math.round((X-lastX) / deltaTime * 100);
    }
    if (Math.abs(Math.round((Y-lastY) > 2))) {
        externalVelocity.sourceVelocity.y = Math.round((Y-lastY) / deltaTime * 100);
    }

    timeStamp = currentTime;
    lastX = X;
    lastY = Y;

    if (timeStamp % 25 == 0) {
      color = [Math.cos(timeStamp)* 150, Math.cos(timeStamp) * Math.sin(timeStamp) * 150, 0];
    }
}
document.onmousemove = function(event){
    UpdateMousePosition(window.innerWidth/2, window.innerHeight/2);
}

document.onmouseup = function(event){
    mouseDown = true;
    timeStamp = Date.now();
    lastX = window.innerWidth/2;
    lastY = window.innerHeight/2;
    externalVelocity.smokeSource.z = 1.0;
    externalDensity.smokeSource.z = 1.0;

    externalTemperature.smokeSource.z = tempSettings.Flame;
}

function init() {

    // create a scene, that will hold all our elements such as objects, cameras and lights.
    scene = new THREE.Scene();

    //add fire texture
    buffer_texture_setup();

    // create a camera, which defines where we're looking at.
    // camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );

    camera.updateProjectionMatrix();

    // create a render, sets the background color and the size
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0x000000, 1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);


    // position and point the camera to the center of the scene
    camera.position.x = -0.5;
    camera.position.y = 0.2;
    camera.position.z = 0.3;
    camera.lookAt(scene.position);

    var dirLight = new THREE.DirectionalLight(new THREE.Color('hsl(30, 100%, 75%)'), 1.0);
    scene.add(dirLight);
    dirLight.position.set(-0.5, 0.0, 0.5);

    var fillLight = new THREE.DirectionalLight(new THREE.Color('hsl(240, 100%, 75%)'), 0.75);
    scene.add(fillLight);
    fillLight.position.set(.5, 0, .5);
    
    var backLight = new THREE.DirectionalLight(0xffffff, 1.0);
    scene.add(backLight);
    backLight.position.set(.5, 0, -.5);

    // add the output of the renderer to the html element
    document.body.appendChild(renderer.domElement);




    control = new function () {
        this.left = camera.left;
        this.right = camera.right;
        this.top = camera.top;
        this.bottom = camera.bottom;
        this.far = camera.far;
        this.near = camera.near;

        this.updateCamera = function () {
            camera.left = control.left;
            camera.right = control.right;
            camera.top = control.top;
            camera.bottom = control.bottom;
            camera.far = control.far;
            camera.near = control.near;

            camera.updateProjectionMatrix();
        };
    };
    //var cameraFolder = gui.addFolder('Camera');
    //cameraFolder.add(control, 'left', -1, 0).onChange(control.updateCamera);
    //cameraFolder.add(control, 'right', 0, 1).onChange(control.updateCamera);
    //cameraFolder.add(control, 'top', 0, 1).onChange(control.updateCamera);
    //cameraFolder.add(control, 'bottom', -1, 0).onChange(control.updateCamera);
    //cameraFolder.add(control, 'far', 0, 1).onChange(control.updateCamera);
    //cameraFolder.add(control, 'near', 0, 1).onChange(control.updateCamera);


    //addControls(control);


    var mtlLoader = new THREE.MTLLoader();
    mtlLoader.setTexturePath('https://hoangcto.github.io/cs184-firesimulation/fire_sim/obj/');
    mtlLoader.setPath('https://hoangcto.github.io/cs184-firesimulation/fire_sim/obj/');
    mtlLoader.load('CandleStick2.mtl', function (materials) {
        materials.preload();

        var objLoader = new THREE.OBJLoader();
        objLoader.setPath('https://hoangcto.github.io/cs184-firesimulation/fire_sim/obj/');
        objLoader.load('CandleStick2.obj', function (object) {

        scene.add(object);
        object.position.set(0, -0.4, 0);
        });
    });

    // call the render function
    render();
}

function addCube(x, y) {
    // create a cube and add to scene
    var cubeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    var cubeMaterial = new THREE.MeshLambertMaterial();
    cubeMaterial.color = new THREE.Color(0xffffff * Math.random())
    cubeMaterial.transparent = true;
    var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.name = 'cube';
    cube.position.x = 0.1 * x - .5;
    cube.position.y = 0;
    cube.position.z = 0.1 * y - .5;
    scene.add(cube);

}


function addControls(controlObject) {
    var gui = new dat.GUI();
    const cameraFolder = gui.addFolder('Camera')
    cameraFolder.add(controlObject, 'left', -1, 0).onChange(controlObject.updateCamera);
    cameraFolder.add(controlObject, 'right', 0, 1).onChange(controlObject.updateCamera);
    cameraFolder.add(controlObject, 'top', 0, 1).onChange(controlObject.updateCamera);
    cameraFolder.add(controlObject, 'bottom', -1, 0).onChange(controlObject.updateCamera);
    gui.add(controlObject, 'far', 0, 1).onChange(controlObject.updateCamera);
    gui.add(controlObject, 'near', 0, 1).onChange(controlObject.updateCamera);
}

function render() {
  advect.compute(renderer, velocity.read, velocity.read, 0.9, velocity.write);
  velocity.swap();

  advect.compute(renderer, velocity.read, density.read, 0.8, density.write);
  density.swap();

  advect.compute(renderer, velocity.read, temperature.read, 0.7, temperature.write);

  temperature.swap();

  buoyancy.compute(renderer, velocity.read, temperature.read, density.read, 0.1, velocity.write);
  velocity.swap();

  if (boundarySettings.Boundaries) {
    boundary.density();
    boundary.compute(renderer, density.read, density.write);
    density.swap();
    boundary.velocity();
    boundary.compute(renderer, velocity.read, velocity.write);
    velocity.swap();
  }

  externalVelocity.compute(renderer, velocity.read, radiusSettings.Radius, velocity.write);
  velocity.swap();

  let currColor = colorSettings.Color;

  if (currColor == "Constant") {
      externalDensity.compute(renderer, density.read, colorSettings.UserColor, radiusSettings.Radius, density.write);
  } else if (currColor == "Cos-Function") {
      color = [1.56, 2.88, 0];
      externalDensity.compute(renderer, density.read, color, radiusSettings.Radius, density.write);
  } else if (currColor == "Velocity-Based") {
      externalVelocity.compute(renderer, density.read, radiusSettings.Radius, density.write);
  }
  density.swap();

  if (boundarySettings.Boundaries) {
    boundary.density();
    boundary.compute(renderer, density.read, density.write);
    density.swap();
    boundary.velocity();
    boundary.compute(renderer, velocity.read, velocity.write);
    velocity.swap();
  }

  externalTemperature.compute(renderer, temperature.read, 0.01, radiusSettings.Radius, temperature.write);
  temperature.swap();

  curl.compute(renderer, velocity.read, vorticity.write);
  vorticity.swap();

  if (boundarySettings.Boundary) {
    vorticityConf.compute(renderer, velocity.read, vorticity.read, vorticitySettings.Curl, 1.0, velocity.write);
  } else {
    vorticityConf.compute(renderer, velocity.read, vorticity.read, vorticitySettings.Curl, 0.0, velocity.write);
  }
  velocity.swap();

  divergence.compute(renderer, velocity.read, 1.0, 1.0, diverge.write);
  diverge.swap();

  renderer.clearTarget(pressure.read, true, false, false);
  for (var i = 0; i < pressureSettings.Iterations; i++) {
    jacobi.compute(renderer, pressure.read, diverge.read, -1.0, 4.0, pressure.write);
    pressure.swap();
    if (boundarySettings.Boundaries) {
      boundary.pressure();
      boundary.compute(renderer, pressure.read, pressure.write);
      pressure.swap();
    }
  }

  if (boundarySettings.Boundaries) {
    boundary.pressure();
    boundary.compute(renderer, pressure.read, pressure.write);
    pressure.swap();
  }

  subtractGradient.compute(renderer, velocity.read, pressure.read, 1.0, 1.0, velocity.write);
  velocity.swap()

  if (boundarySettings.Boundaries) {
    boundary.velocity();
    boundary.compute(renderer, velocity.read, velocity.write);
    velocity.swap();
  }

  var read;
  let currSlab = displaySettings.Slab;
  if (currSlab == "Density") {
      if (currColor == "Constant") {
        draw.setDisplay(new THREE.Vector3(0.0,0.0,0.0), new THREE.Vector3(1.0,0.2,0.8));
      } else {
        draw.displayNeg();
      }
      read = density.read;
  } else if (currSlab == "Velocity") {
      draw.displayNeg();
      read = velocity.read;
  } else if (currSlab == "Temperature") {
      draw.setDisplay(new THREE.Vector3(0.5,0.5,0.5), new THREE.Vector3(1.0,1.0,1.0));
      read = temperature.read;
  } else if (currSlab == "Vorticity") {
      draw.displayNeg();
      read = vorticity.read;
  } else if (currSlab == "Pressure") {
      draw.displayNeg();
      read = pressure.read;
  } else if (currSlab == "Divergence") {
      draw.displayNeg();
      read = diverge.read;
  }

  draw.compute(renderer, read, drawTexture);
  
  renderer.render( scene, camera );

  requestAnimationFrame( render );
}

// calls the init function when the window is done loading.
window.onload = init;
