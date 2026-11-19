import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import gsap from 'gsap';

/**
 * Manages the fixed transparent Three.js WebGL scene, PBR studio lighting,
 * mouse parallax, interactive 360° inspection offset, and mobile optimization.
 */
export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.isMobile = window.matchMedia('(max-width: 768px)').matches || navigator.hardwareConcurrency <= 4;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      this.isMobile ? 48 : 38,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    this.camera.position.set(0, 1.35, 6.2);
    this.cameraTarget = new THREE.Vector3(0, 0.2, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: !this.isMobile,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = !this.isMobile;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Studio environment map for realistic PBR aluminum & carbon reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRT.texture;
    this.scene.environmentIntensity = 0.62;
    pmremGenerator.dispose();

    // Pointer parallax & user inspection rotation
    this.pointer = { x: 0, y: 0, smoothX: 0, smoothY: 0 };
    this.userOrbit = { rotY: 0, rotX: 0, targetRotY: 0, targetRotX: 0 };
    this.scrollState = {
      robotX: this.isMobile ? 0 : 1.35,
      robotY: 0,
      robotZ: 0,
      rotY: -0.55,
      rotX: 0.08,
      scale: this.isMobile ? 0.82 : 1.0,
      parallaxWeight: 1.0
    };

    this.clock = new THREE.Clock();
    this.robot = null;

    this._setupLights();
    this._setupFloorShadow();
    this._setupAmbientParticles();
    this._bindEvents();
  }

  _setupLights() {
    this.ambientLight = new THREE.AmbientLight('#b8c7d9', 0.35);
    this.scene.add(this.ambientLight);

    // Key light (clean studio softbox feel)
    this.keyLight = new THREE.DirectionalLight('#f8fafc', 2.1);
    this.keyLight.position.set(4.5, 6.5, 5.2);
    if (!this.isMobile) {
      this.keyLight.castShadow = true;
      this.keyLight.shadow.mapSize.set(1024, 1024);
      this.keyLight.shadow.camera.near = 1;
      this.keyLight.shadow.camera.far = 20;
      this.keyLight.shadow.bias = -0.0005;
    }
    this.scene.add(this.keyLight);

    // Cool fill light from opposite side
    this.fillLight = new THREE.DirectionalLight('#93c5fd', 0.75);
    this.fillLight.position.set(-5.0, 2.5, 3.0);
    this.scene.add(this.fillLight);

    // Dynamic themed rim light
    this.rimLight = new THREE.SpotLight('#38bdf8', 5.5, 18, Math.PI / 4, 0.65, 1.2);
    this.rimLight.position.set(-2.5, 4.2, -4.5);
    this.scene.add(this.rimLight);

    // Moving sheen light for Hero specular sweep
    this.sweepLight = new THREE.PointLight('#ffffff', 1.8, 10, 1.6);
    this.sweepLight.position.set(2.0, 2.2, 2.6);
    this.scene.add(this.sweepLight);
  }

  _setupFloorShadow() {
    const shadowGeo = new THREE.PlaneGeometry(14, 14);
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.28 });
    this.shadowFloor = new THREE.Mesh(shadowGeo, shadowMat);
    this.shadowFloor.rotation.x = -Math.PI / 2;
    this.shadowFloor.position.y = -0.82;
    this.shadowFloor.receiveShadow = true;
    this.scene.add(this.shadowFloor);
  }

  _setupAmbientParticles() {
    // Subtle industrial dust motes — auto-scaled down on mobile for 60 FPS
    const count = this.isMobile ? 28 : 75;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 1.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: new THREE.Color('#94a3b8'),
      size: this.isMobile ? 0.03 : 0.024,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  setRobot(robotModel) {
    this.robot = robotModel;
    this.scene.add(this.robot.root);
  }

  updateAtmosphere(theme) {
    const lightColor = new THREE.Color(theme.lightHex);

    gsap.to(this.rimLight.color, {
      r: lightColor.r,
      g: lightColor.g,
      b: lightColor.b,
      duration: 0.9,
      ease: 'power2.out'
    });

    gsap.to(this.particles.material.color, {
      r: lightColor.r,
      g: lightColor.g,
      b: lightColor.b,
      duration: 0.9,
      ease: 'power2.out'
    });

    document.documentElement.style.setProperty('--accent', theme.accentHex);
    document.body.style.backgroundColor = theme.bgHex;
  }

  _bindEvents() {
    window.addEventListener('resize', () => this.onResize(), { passive: true });
    window.addEventListener(
      'pointermove',
      (e) => {
        this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
      },
      { passive: true }
    );
  }

  onResize() {
    this.isMobile = window.matchMedia('(max-width: 768px)').matches;
    this.camera.fov = this.isMobile ? 48 : 38;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start() {
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = Math.min(this.clock.getDelta(), 0.05);
      const elapsed = this.clock.getElapsedTime();

      // Smooth mouse parallax interpolation
      this.pointer.smoothX += (this.pointer.x - this.pointer.smoothX) * 0.05;
      this.pointer.smoothY += (this.pointer.y - this.pointer.smoothY) * 0.05;

      // Smooth interactive 360° orbit interpolation
      this.userOrbit.rotY += (this.userOrbit.targetRotY - this.userOrbit.rotY) * 0.09;
      this.userOrbit.rotX += (this.userOrbit.targetRotX - this.userOrbit.rotX) * 0.09;

      // Subtle specular light sweep across the chassis
      this.sweepLight.position.x = Math.sin(elapsed * 0.65) * 3.4 + this.pointer.smoothX * 1.2;
      this.sweepLight.position.y = 2.0 + Math.cos(elapsed * 0.45) * 0.6 + this.pointer.smoothY * 0.6;

      if (this.robot) {
        this.robot.update(elapsed, delta);

        const pw = this.scrollState.parallaxWeight;
        this.robot.root.position.x = this.scrollState.robotX;
        this.robot.root.position.z = this.scrollState.robotZ;
        this.robot.root.scale.setScalar(this.scrollState.scale);

        this.robot.pivot.rotation.y =
          this.scrollState.rotY + this.userOrbit.rotY + this.pointer.smoothX * 0.24 * pw;
        this.robot.pivot.rotation.x =
          this.scrollState.rotX + this.userOrbit.rotX - this.pointer.smoothY * 0.14 * pw;

        this.shadowFloor.position.x = this.scrollState.robotX;
      }

      if (this.particles) {
        this.particles.rotation.y = elapsed * 0.025;
      }

      this.camera.lookAt(this.cameraTarget);
      this.renderer.render(this.scene, this.camera);
      this._updateHotspots();
    };

    animate();
  }

  _updateHotspots() {
    if (!this.robot || this.isMobile) return;
    if (!this._hotspotNodes) {
      this._hotspotNodes = Array.from(document.querySelectorAll('.hotspot-pin'));
    }
    if (!this._hotspotNodes.length) return;

    const showWeight = THREE.MathUtils.smoothstep(this.robot.explodeFactor, 0.35, 0.72);
    if (showWeight <= 0.01) {
      this._hotspotNodes.forEach((node) => {
        if (node.style.opacity !== '0') node.style.opacity = '0';
      });
      return;
    }

    const worldPositions = this.robot.getHotspotWorldPositions();
    const width = window.innerWidth;
    const height = window.innerHeight;

    this._hotspotNodes.forEach((node) => {
      const key = node.dataset.hotspot;
      const worldPos = worldPositions[key];
      if (!worldPos) return;

      const projected = worldPos.project(this.camera);
      const isVisible = projected.z < 1 && projected.z > -1;
      if (!isVisible) {
        node.style.opacity = '0';
        return;
      }

      const x = (projected.x * 0.5 + 0.5) * width;
      const y = (-projected.y * 0.5 + 0.5) * height;

      node.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`;
      node.style.opacity = String(showWeight.toFixed(2));
    });
  }
}
