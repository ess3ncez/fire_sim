ExternalTemperature = function(res) {
    var geometry = new THREE.PlaneBufferGeometry( 2 * (512 - 2) / 512, 2 * (256 - 2) / 256 );
    this.res = res;
    this.smokeSource = new THREE.Vector3(0,0,0);
    this.uniforms = {
        bufferTexture: { type: "t" }, //this is THREE.WebGLRenderTarget
        res : {type: 'v2' },
        smokeSource: {type:"v3" },
        temp: {type: 'f'},
        radius: {type: 'f'}
    };
    var material = new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        fragmentShader: document.getElementById( 'ExternalTemperature' ).innerHTML,
        depthWrite: false,
        depthTest: false,
        blending: THREE.NoBlending
    });
    this.quad = new THREE.Mesh(geometry, material);
    this.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
    //this.camera.position.z = 2;
    this.scene = new THREE.Scene();
    this.scene.add(this.quad);
}

// externalTemperature = new ExternalTemperature(res);
// temperature = new Slab(res);
// var radiusSettings = {
//     Radius: 20.0
// };
// renderer = new THREE.WebGLRenderer();
// renderer.setPixelRatio(window.devicePixelRatio);
// renderer.setSize( width, height );
// externalTemperature.compute(renderer, temperature.read, 0.01, radiusSettings.Radius, temperature.write);

ExternalTemperature.prototype.compute = function(renderer, input, temp, radius, output) {
    this.uniforms.bufferTexture.value = input;
    this.uniforms.res.value = this.res;
    this.uniforms.temp.value = temp;
    this.uniforms.smokeSource.value = this.smokeSource;
    this.uniforms.radius.value = radius;
    renderer.render(this.scene, this.camera, output, false);
}