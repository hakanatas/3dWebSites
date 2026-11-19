import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import gsap from 'gsap';
import {
  createBrushedMetalTexture,
  createCarbonFiberTextures,
  createHubScreenTexture,
  createRearSpecPlateTexture,
  createTeamPlateTexture
} from './ProceduralTextures.js';

export const ROBOT_THEMES = {
  ag24230: {
    id: 'ag24230',
    name: '#24230 AG Robotik',
    code: '#24230',
    subtitle: 'AG ROBOTİK · FTC',
    focus: 'Yarışmalar, Ulusal & Uluslararası İşbirlikleri',
    spec: 'Mecanum 4WD · Java Autonomous',
    accentHex: '#38bdf8',
    anodizedHex: '#1c3b57',
    lightHex: '#38bdf8',
    bgHex: '#0a0c0f'
  },
  jr28743: {
    id: 'jr28743',
    name: '#28743 Jr. AG Robotik',
    code: '#28743',
    subtitle: 'JR. AG ROBOTİK · FTC',
    focus: 'STEM Eğitimi, Genç Mühendisler & Takım Ruhu',
    spec: 'Compact Mecanum · Blockly & Java',
    accentHex: '#22c55e',
    anodizedHex: '#193d2b',
    lightHex: '#22c55e',
    bgHex: '#090e0b'
  },
  frcRebuilt: {
    id: 'frcRebuilt',
    name: 'FRC REBUILT',
    code: 'FRC',
    subtitle: 'REBUILT · HEAVY DRIVE',
    focus: 'Yüksek Torklu Sürüş & Endüstriyel Mekanik',
    spec: 'High-Torque Swerve · WPILib Java',
    accentHex: '#f59e0b',
    anodizedHex: '#4a3214',
    lightHex: '#f59e0b',
    bgHex: '#0e0c09'
  },
  ftcBiobuzz: {
    id: 'ftcBiobuzz',
    name: 'FTC BIOBUZZ',
    code: 'BIOBUZZ',
    subtitle: 'FTC · PRECISION INTAKE',
    focus: 'Otonom Görüntü İşleme & Hassas Tutucu',
    spec: 'Vision LiDAR · Dual-Stage Arm',
    accentHex: '#f43f5e',
    anodizedHex: '#4b1a25',
    lightHex: '#f43f5e',
    bgHex: '#0f0a0c'
  }
};

/**
 * Builds an articulated, PBR-shaded procedural FTC/FRC competition robot.
 * Also supports automatic loading of /assets/3d/robot.glb if present.
 */
export class RobotModel {
  constructor({ isMobile = false } = {}) {
    this.isMobile = isMobile;
    this.root = new THREE.Group();
    this.pivot = new THREE.Group();
    this.root.add(this.pivot);

    this.parts = [];
    this.wheels = [];
    this.hotspotAnchors = {};
    this.explodeFactor = 0;
    this.currentTheme = ROBOT_THEMES.ag24230;
    this.usesExternalGlb = false;

    this._initMaterials();
  }

  _initMaterials() {
    const brushedMap = createBrushedMetalTexture();
    const carbon = createCarbonFiberTextures();

    this.materials = {
      aluminum: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#c8d1dc'),
        metalness: 0.88,
        roughness: 0.28,
        roughnessMap: brushedMap,
        bumpMap: brushedMap,
        bumpScale: 0.008
      }),
      darkMetal: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#202630'),
        metalness: 0.78,
        roughness: 0.36,
        roughnessMap: brushedMap
      }),
      anodized: new THREE.MeshStandardMaterial({
        color: new THREE.Color(this.currentTheme.anodizedHex),
        metalness: 0.72,
        roughness: 0.3,
        roughnessMap: brushedMap
      }),
      carbon: new THREE.MeshStandardMaterial({
        map: carbon.map,
        bumpMap: carbon.bumpMap,
        bumpScale: 0.012,
        metalness: 0.25,
        roughness: 0.42
      }),
      rubber: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#16181c'),
        metalness: 0.05,
        roughness: 0.88
      }),
      led: new THREE.MeshStandardMaterial({
        color: new THREE.Color(this.currentTheme.accentHex),
        emissive: new THREE.Color(this.currentTheme.accentHex),
        emissiveIntensity: 1.85,
        roughness: 0.2,
        metalness: 0.1
      }),
      glass: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#0c1722'),
        metalness: 0.1,
        roughness: 0.08,
        transmission: 0.35,
        clearcoat: 1.0,
        clearcoatRoughness: 0.06
      }),
      sidePlate: new THREE.MeshStandardMaterial({
        map: createTeamPlateTexture(
          this.currentTheme.code,
          this.currentTheme.subtitle,
          this.currentTheme.accentHex
        ),
        metalness: 0.45,
        roughness: 0.35
      }),
      rearPlate: new THREE.MeshStandardMaterial({
        map: createRearSpecPlateTexture(
          this.currentTheme.name,
          this.currentTheme.spec.toUpperCase(),
          this.currentTheme.accentHex
        ),
        metalness: 0.35,
        roughness: 0.38
      }),
      hubScreen: new THREE.MeshStandardMaterial({
        map: createHubScreenTexture(this.currentTheme.accentHex),
        emissive: new THREE.Color('#ffffff'),
        emissiveMap: createHubScreenTexture(this.currentTheme.accentHex),
        emissiveIntensity: 0.65,
        roughness: 0.2,
        metalness: 0.1
      })
    };
  }

  /**
   * Attempts to load /assets/3d/robot.glb first; falls back to procedural PBR robot.
   */
  async load(onProgress = () => {}) {
    onProgress(20, '3D Model Kaynağı Kontrol Ediliyor');

    const glbExists = await this._checkGlbExists('/assets/3d/robot.glb');
    if (glbExists) {
      try {
        await this._loadExternalGlb('/assets/3d/robot.glb', onProgress);
        this.usesExternalGlb = true;
        onProgress(100, 'Hazır');
        return;
      } catch {
        // Fallback to procedural robot cleanly
      }
    }

    onProgress(55, 'PBR Yarışma Robotu Oluşturuluyor');
    this._buildProceduralRobot();
    onProgress(90, 'Stüdyo Işıkları ve Gölgeler Hazırlanıyor');
  }

  async _checkGlbExists(url) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      const contentType = res.headers.get('content-type') || '';
      return res.ok && !contentType.includes('text/html');
    } catch {
      return false;
    }
  }

  _loadExternalGlb(url, onProgress) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = 2.4 / maxDim;
          model.scale.setScalar(scale);

          const center = box.getCenter(new THREE.Vector3());
          model.position.sub(center.multiplyScalar(scale));

          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          this.pivot.add(model);
          resolve();
        },
        (evt) => {
          if (evt.total) {
            const pct = 20 + Math.round((evt.loaded / evt.total) * 70);
            onProgress(pct, '3D Model Yükleniyor');
          }
        },
        reject
      );
    });
  }

  _registerPart(meshOrGroup, explodedOffset, explodedRotation = new THREE.Vector3(0, 0, 0)) {
    this.parts.push({
      object: meshOrGroup,
      basePos: meshOrGroup.position.clone(),
      baseRot: meshOrGroup.rotation.clone(),
      explodedOffset,
      explodedRotation
    });
    this.pivot.add(meshOrGroup);
  }

  _buildProceduralRobot() {
    const rollerCount = this.isMobile ? 8 : 12;
    const cylSegments = this.isMobile ? 16 : 28;

    // 1. CHASSIS FRAME (Aluminum perimeter rails + anodized side plates)
    const chassis = new THREE.Group();

    const railGeomLong = new THREE.BoxGeometry(0.14, 0.24, 1.92);
    const leftRail = new THREE.Mesh(railGeomLong, this.materials.aluminum);
    leftRail.position.set(-0.78, 0, 0);
    const rightRail = new THREE.Mesh(railGeomLong, this.materials.aluminum);
    rightRail.position.set(0.78, 0, 0);

    const railGeomCross = new THREE.BoxGeometry(1.7, 0.22, 0.14);
    const frontRail = new THREE.Mesh(railGeomCross, this.materials.darkMetal);
    frontRail.position.set(0, 0, 0.9);
    const rearRail = new THREE.Mesh(railGeomCross, this.materials.darkMetal);
    rearRail.position.set(0, 0, -0.9);

    const midCross = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.12, 0.14), this.materials.aluminum);
    midCross.position.set(0, -0.02, 0);

    // Lower belly pan
    const bellyPan = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.04, 1.72), this.materials.carbon);
    bellyPan.position.set(0, -0.1, 0);

    // Side anodized team plates
    const sidePlateGeom = new THREE.PlaneGeometry(1.44, 0.26);
    const leftPlate = new THREE.Mesh(sidePlateGeom, this.materials.sidePlate);
    leftPlate.position.set(-0.855, 0.02, 0);
    leftPlate.rotation.y = -Math.PI / 2;

    const rightPlate = new THREE.Mesh(sidePlateGeom, this.materials.sidePlate);
    rightPlate.position.set(0.855, 0.02, 0);
    rightPlate.rotation.y = Math.PI / 2;

    // Underglow & perimeter telemetry LED strips
    const ledStripGeom = new THREE.BoxGeometry(0.03, 0.035, 1.52);
    const leftLed = new THREE.Mesh(ledStripGeom, this.materials.led);
    leftLed.position.set(-0.85, -0.11, 0);
    const rightLed = new THREE.Mesh(ledStripGeom, this.materials.led);
    rightLed.position.set(0.85, -0.11, 0);

    const frontLed = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.035, 0.03), this.materials.led);
    frontLed.position.set(0, 0.08, 0.98);

    chassis.add(
      leftRail,
      rightRail,
      frontRail,
      rearRail,
      midCross,
      bellyPan,
      leftPlate,
      rightPlate,
      leftLed,
      rightLed,
      frontLed
    );
    chassis.position.set(0, -0.22, 0);
    this._registerPart(chassis, new THREE.Vector3(0, -0.25, 0));

    // 2. FOUR MECANUM WHEELS (Explode outward along X/Z axes)
    const wheelPositions = [
      { x: -1.0, z: 0.62, dir: -1, zDir: 1 },
      { x: 1.0, z: 0.62, dir: 1, zDir: 1 },
      { x: -1.0, z: -0.62, dir: -1, zDir: -1 },
      { x: 1.0, z: -0.62, dir: 1, zDir: -1 }
    ];

    wheelPositions.forEach((wp) => {
      const wheelGroup = new THREE.Group();

      // Inner & outer aluminum flanges
      const flangeGeom = new THREE.CylinderGeometry(0.32, 0.32, 0.04, cylSegments);
      flangeGeom.rotateZ(Math.PI / 2);

      const innerFlange = new THREE.Mesh(flangeGeom, this.materials.aluminum);
      innerFlange.position.x = -0.11;
      const outerFlange = new THREE.Mesh(flangeGeom, this.materials.anodized);
      outerFlange.position.x = 0.11;

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.3, cylSegments).rotateZ(Math.PI / 2),
        this.materials.darkMetal
      );

      // Angled rubber mecanum rollers
      const rollerGeom = new THREE.CylinderGeometry(0.055, 0.045, 0.24, 10);
      for (let i = 0; i < rollerCount; i++) {
        const angle = (i / rollerCount) * Math.PI * 2;
        const roller = new THREE.Mesh(rollerGeom, this.materials.rubber);
        const radius = 0.31;
        roller.position.set(0, Math.cos(angle) * radius, Math.sin(angle) * radius);
        roller.rotation.x = angle + Math.PI / 2;
        roller.rotation.z = wp.dir * wp.zDir * 0.55;
        wheelGroup.add(roller);
      }

      // Axle shaft connecting into chassis
      const axle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.36, 12).rotateZ(Math.PI / 2),
        this.materials.aluminum
      );
      axle.position.x = -wp.dir * 0.18;

      wheelGroup.add(innerFlange, outerFlange, hub, axle);
      wheelGroup.position.set(wp.x, -0.28, wp.z);
      this.wheels.push(wheelGroup);

      this._registerPart(wheelGroup, new THREE.Vector3(wp.dir * 0.65, -0.18, wp.zDir * 0.22));
    });

    // 3. ELECTRONICS BAY: REV CONTROL HUB + 12V BATTERY
    const electronics = new THREE.Group();

    const hubBody = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.18, 0.54), this.materials.darkMetal);
    hubBody.position.set(-0.22, 0.09, -0.15);

    const hubTrim = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.03, 0.56), this.materials.anodized);
    hubTrim.position.set(-0.22, 0.185, -0.15);

    const hubScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.24), this.materials.hubScreen);
    hubScreen.rotation.x = -Math.PI / 2;
    hubScreen.position.set(-0.22, 0.205, -0.15);

    const battery = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.62), this.materials.anodized);
    battery.position.set(0.42, 0.1, -0.15);

    const batteryStrap = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.22, 0.12), this.materials.rubber);
    batteryStrap.position.set(0.42, 0.1, -0.15);

    electronics.add(hubBody, hubTrim, hubScreen, battery, batteryStrap);
    electronics.position.set(0, -0.05, 0);
    this._registerPart(electronics, new THREE.Vector3(0, 0.48, -0.15));

    // 4. CARBON FIBER TOP DECK
    const topDeck = new THREE.Group();
    const deckPlate = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.05, 1.56), this.materials.carbon);
    const deckFrameFront = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.06, 0.08), this.materials.aluminum);
    deckFrameFront.position.set(0, 0, 0.76);
    const deckFrameRear = new THREE.Mesh(new THREE.BoxGeometry(1.54, 0.06, 0.08), this.materials.aluminum);
    deckFrameRear.position.set(0, 0, -0.76);

    topDeck.add(deckPlate, deckFrameFront, deckFrameRear);
    topDeck.position.set(0, 0.22, -0.02);
    this._registerPart(topDeck, new THREE.Vector3(0, 0.88, 0));

    // 5. LINEAR SLIDE MAST & ARTICULATED ROBOTIC ARM + INTAKE CLAW
    const armAssembly = new THREE.Group();

    // Twin vertical aluminum extrusions
    const mastGeom = new THREE.BoxGeometry(0.09, 1.38, 0.09);
    const mastL = new THREE.Mesh(mastGeom, this.materials.aluminum);
    mastL.position.set(-0.26, 0.68, 0);
    const mastR = new THREE.Mesh(mastGeom, this.materials.aluminum);
    mastR.position.set(0.26, 0.68, 0);

    const mastBraceTop = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.1, 0.12), this.materials.anodized);
    mastBraceTop.position.set(0, 1.34, 0);
    const mastBraceMid = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.11), this.materials.darkMetal);
    mastBraceMid.position.set(0, 0.65, 0);

    // Pivoting arm carriage
    this.armPivot = new THREE.Group();
    this.armPivot.position.set(0, 1.12, 0.08);

    const armBoom = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.92), this.materials.carbon);
    armBoom.position.set(0, 0, 0.44);

    const wristHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.24, 16).rotateZ(Math.PI / 2),
      this.materials.anodized
    );
    wristHub.position.set(0, 0, 0.9);

    // Dual precision intake fingers
    const fingerGeom = new THREE.BoxGeometry(0.06, 0.08, 0.42);
    const fingerL = new THREE.Mesh(fingerGeom, this.materials.aluminum);
    fingerL.position.set(-0.18, -0.02, 1.1);
    fingerL.rotation.y = 0.16;

    const fingerR = new THREE.Mesh(fingerGeom, this.materials.aluminum);
    fingerR.position.set(0.18, -0.02, 1.1);
    fingerR.rotation.y = -0.16;

    const intakeLed = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.025, 0.04), this.materials.led);
    intakeLed.position.set(0, 0.08, 0.9);

    this.armPivot.add(armBoom, wristHub, fingerL, fingerR, intakeLed);
    this.armPivot.rotation.x = 0.22;

    armAssembly.add(mastL, mastR, mastBraceTop, mastBraceMid, this.armPivot);
    armAssembly.position.set(0, 0.25, -0.25);
    this._registerPart(armAssembly, new THREE.Vector3(0, 1.35, -0.12));

    // 6. FRONT AUTONOMOUS VISION / LIDAR SENSOR POD
    const sensorPod = new THREE.Group();
    const podHousing = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.22, 0.26), this.materials.darkMetal);
    const podAccent = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.28), this.materials.anodized);
    podAccent.position.y = 0.11;

    const lensLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.08, 20).rotateX(Math.PI / 2),
      this.materials.glass
    );
    lensLeft.position.set(-0.18, 0, 0.12);

    const lensRight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.08, 20).rotateX(Math.PI / 2),
      this.materials.glass
    );
    lensRight.position.set(0.18, 0, 0.12);

    const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.012, 10, 24), this.materials.led);
    lensRing.position.set(-0.18, 0, 0.16);
    const lensRing2 = lensRing.clone();
    lensRing2.position.set(0.18, 0, 0.16);

    sensorPod.add(podHousing, podAccent, lensLeft, lensRight, lensRing, lensRing2);
    sensorPod.position.set(0, 0.36, 0.72);
    this._registerPart(sensorPod, new THREE.Vector3(0, 0.42, 0.68));

    // 7. REAR TECHNICAL SPECIFICATION PLATE (Crisp & legible in Section 4)
    const rearPanel = new THREE.Group();

    const backing = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.86, 0.07), this.materials.darkMetal);
    const specFace = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 0.8), this.materials.rearPlate);
    specFace.position.set(0, 0, -0.04);
    specFace.rotation.y = Math.PI;

    const rearLedBar = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.026, 0.03), this.materials.led);
    rearLedBar.position.set(0, 0.45, -0.03);

    rearPanel.add(backing, specFace, rearLedBar);
    rearPanel.position.set(0, 0.64, -0.82);
    this._registerPart(rearPanel, new THREE.Vector3(0, 0.52, -0.78));

    // Enable shadows on all meshes
    this.pivot.traverse((obj) => {
      if (obj.isMesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });

    // Center vertical offset nicely in viewport
    this.pivot.position.y = -0.15;

    // Register 3D hotspot anchors for exploded-view labels
    this.hotspotAnchors = {
      wheel: this.wheels[1],
      electronics,
      arm: armAssembly,
      sensor: sensorPod
    };
  }

  getHotspotWorldPositions() {
    const positions = {};
    const temp = new THREE.Vector3();
    for (const [key, obj] of Object.entries(this.hotspotAnchors)) {
      if (!obj) continue;
      obj.getWorldPosition(temp);
      if (key === 'arm') temp.y += 0.95;
      positions[key] = temp.clone();
    }
    return positions;
  }

  setExplode(value) {
    this.explodeFactor = THREE.MathUtils.clamp(value, 0, 1);
    if (this.usesExternalGlb) return;

    this.parts.forEach((part) => {
      part.object.position.lerpVectors(
        part.basePos,
        part.basePos.clone().add(part.explodedOffset),
        this.explodeFactor
      );
    });

    if (this.armPivot) {
      this.armPivot.rotation.x = THREE.MathUtils.lerp(0.22, -0.25, this.explodeFactor);
    }
  }

  setTheme(themeKey) {
    const theme = ROBOT_THEMES[themeKey] || ROBOT_THEMES.ag24230;
    this.currentTheme = theme;

    const targetAnodized = new THREE.Color(theme.anodizedHex);
    const targetAccent = new THREE.Color(theme.accentHex);

    gsap.to(this.materials.anodized.color, {
      r: targetAnodized.r,
      g: targetAnodized.g,
      b: targetAnodized.b,
      duration: 0.85,
      ease: 'power2.out'
    });

    gsap.to(this.materials.led.color, {
      r: targetAccent.r,
      g: targetAccent.g,
      b: targetAccent.b,
      duration: 0.75,
      ease: 'power2.out'
    });

    gsap.to(this.materials.led.emissive, {
      r: targetAccent.r,
      g: targetAccent.g,
      b: targetAccent.b,
      duration: 0.75,
      ease: 'power2.out'
    });

    // Update dynamic team & rear specification textures
    const oldSideMap = this.materials.sidePlate.map;
    this.materials.sidePlate.map = createTeamPlateTexture(theme.code, theme.subtitle, theme.accentHex);
    this.materials.sidePlate.needsUpdate = true;
    if (oldSideMap) oldSideMap.dispose();

    const oldRearMap = this.materials.rearPlate.map;
    this.materials.rearPlate.map = createRearSpecPlateTexture(
      theme.name,
      theme.spec.toUpperCase(),
      theme.accentHex
    );
    this.materials.rearPlate.needsUpdate = true;
    if (oldRearMap) oldRearMap.dispose();

    const oldHubMap = this.materials.hubScreen.map;
    const newHubMap = createHubScreenTexture(theme.accentHex);
    this.materials.hubScreen.map = newHubMap;
    this.materials.hubScreen.emissiveMap = newHubMap;
    this.materials.hubScreen.needsUpdate = true;
    if (oldHubMap) oldHubMap.dispose();

    return theme;
  }

  update(elapsedTime, delta) {
    // Subtle idle float on the root group
    this.root.position.y = Math.sin(elapsedTime * 1.35) * 0.055;

    // Gentle wheel idle pulse when exploded
    if (this.explodeFactor > 0.05) {
      const spin = delta * 0.45 * this.explodeFactor;
      this.wheels.forEach((w) => {
        w.rotation.x += spin;
      });
    }
  }
}
