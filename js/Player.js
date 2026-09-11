import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Player {
  constructor(scene, audioSystem, characterType = 'spider_ram') {
    this.scene = scene;
    this.audio = audioSystem;
    this.characterType = characterType;

    // Movement & Physics state
    this.position = new THREE.Vector3(0, 30, 20); // Start on mid rooftop
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.isGrounded = false;
    this.isTouchingWall = false;
    this.isWallCrawling = false;
    this.wallNormal = new THREE.Vector3();
    this.isSwinging = false;
    this.swingAnchor = null;
    this.swingRopeLength = 0;

    // Iron-Ram Powered Flight & Abilities
    this.isFlying = false;
    this.repulsorBolts = [];
    this.thrusterParticles = [];
    this.uniBeamActive = false;
    this.uniBeamTimer = 0;
    this.isGroundSlamming = false;
    this.shockwaves = [];

    // Double Jump & Air Dash
    this.canDoubleJump = true;
    this.canAirDash = true;
    this.dashTimer = 0;
    this.dashDuration = 0.22;
    this.isDashing = false;

    // Combat & Stats
    this.maxHealth = this.characterType === 'iron_ram' ? 150 : 100;
    this.health = this.maxHealth;
    this.maxWebFluid = 100; // Functions as Arc Reactor Energy for Iron-Ram
    this.webFluid = 100;
    this.webFluidRechargeRate = this.characterType === 'iron_ram' ? 24 : 18; // per second
    this.comboCount = 0;
    this.comboTimer = 0;
    this.isAttacking = false;
    this.attackState = 'none';
    this.attackTimer = 0;
    this.invulnerableTimer = 0;

    // Animation & Mesh
    this.mesh = new THREE.Group();
    this.limbs = {};
    this.animTime = 0;
    this.state = 'IDLE';

    // Front flip jump & Tuck and Roll dash state
    this.isFrontFlipping = false;
    this.frontFlipProgress = 0;
    this.frontFlipDuration = 0.52;

    this.isTuckRolling = false;
    this.tuckRollProgress = 0;
    this.tuckRollDuration = 0.42;

    // Vehicle Driving State
    this.isDriving = false;
    this.drivenCar = null;

    this.buildCharacterMesh();
    this.scene.add(this.mesh);
  }

  // Switch character model and abilities on the fly
  setCharacterType(type) {
    this.characterType = type;
    this.maxHealth = this.characterType === 'iron_ram' ? 150 : 100;
    this.health = this.maxHealth;
    this.webFluid = 100;
    this.isFlying = false;
    this.isSwinging = false;
    this.isWallCrawling = false;
    this.buildCharacterMesh();
  }

  buildCharacterMesh() {
    // Clear previous mesh children
    while (this.mesh.children.length > 0) {
      this.mesh.remove(this.mesh.children[0]);
    }
    this.limbs = {};

    if (this.characterType === 'iron_ram') {
      this.createIronRamPlayerMesh();
    } else {
      this.createPixelSpiderMesh();
    }
  }

  // Create stylized Spider-Ram Hero with royal blue suit, curved horns, fleece accents, and "SR" emblem
  createPixelSpiderMesh() {
    const redMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.38 }); // Vibrant superhero red
    const blueMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.4 }); // Heroic royal blue
    const fleeceMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 }); // Ram fleece wool
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.2 }); // Dark slate ram horn
    const hornGoldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.45, metalness: 0.35 }); // Horn ridge gold
    const hoofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }); // Dark ram hooves
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.8 });

    // Clean "SR" (Spider-Ram) Chest Emblem Canvas Texture
    const srCanvas = document.createElement('canvas');
    srCanvas.width = 128;
    srCanvas.height = 128;
    const srCtx = srCanvas.getContext('2d');
    srCtx.clearRect(0, 0, 128, 128);

    // Bold Black "SR" letters with subtle white outline
    srCtx.lineWidth = 7;
    srCtx.strokeStyle = '#ffffff';
    srCtx.font = '900 82px "Impact", "Arial Black", sans-serif';
    srCtx.textAlign = 'center';
    srCtx.textBaseline = 'middle';
    srCtx.strokeText('SR', 64, 66);

    srCtx.fillStyle = '#000000';
    srCtx.fillText('SR', 64, 66);

    const srTex = new THREE.CanvasTexture(srCanvas);
    srTex.magFilter = THREE.LinearFilter;

    const srMat = new THREE.MeshBasicMaterial({
      map: srTex,
      transparent: true,
      depthWrite: false
    });

    // Root Group
    this.mesh.position.copy(this.position);

    // Torso (Upper Blue Hero Vest, Lower Red Superhero Shorts)
    const torsoGroup = new THREE.Group();
    const chestGeo = new THREE.BoxGeometry(0.72, 0.58, 0.48);
    const chest = new THREE.Mesh(chestGeo, blueMat); // BLUE Chest
    chest.position.set(0, 0.28, 0);
    torsoGroup.add(chest);

    // Clean Black "SR" Emblem on chest
    const srPlaneGeo = new THREE.PlaneGeometry(0.38, 0.38);
    const spBadge = new THREE.Mesh(srPlaneGeo, srMat);
    spBadge.position.set(0, 0.28, 0.245);
    torsoGroup.add(spBadge);

    const waistGeo = new THREE.BoxGeometry(0.62, 0.34, 0.44);
    const waist = new THREE.Mesh(waistGeo, redMat); // RED Waist / Shorts
    waist.position.set(0, -0.14, 0);
    torsoGroup.add(waist);

    torsoGroup.position.set(0, 0, 0);
    this.mesh.add(torsoGroup);
    this.limbs.torso = torsoGroup;
    this.limbs.chest = chest;
    this.limbs.spBadge = spBadge;
    this.limbs.waist = waist;

    // Head with Sleek Superhero Mask, White Glowing Eyes & Bighorn Ram Horns
    const headGroup = new THREE.Group();
    const headGeo = new THREE.BoxGeometry(0.48, 0.46, 0.48);
    const head = new THREE.Mesh(headGeo, blueMat); // BLUE Superhero Head
    headGroup.add(head);

    // Solid Stylized 3D Block Horns (One solid cube per side)
    [-1, 1].forEach(side => {
      // 1. One Solid Cube Horn
      const hornGeo = new THREE.BoxGeometry(0.18, 0.38, 0.18);
      const hornMesh = new THREE.Mesh(hornGeo, hornMat);
      hornMesh.position.set(side * 0.28, 0.24, 0.02);
      hornMesh.rotation.set(-0.35, side * 0.20, side * 0.38);
      hornMesh.castShadow = true;
      headGroup.add(hornMesh);

      // 2. Pointed Ram Ears
      const ear = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.14), blueMat);
      ear.position.set(side * 0.27, 0.05, -0.09);
      ear.rotation.y = side * 0.7;
      ear.rotation.z = side * -0.3;
      headGroup.add(ear);
    });

    // 3. Expressive Superhero Eye Lenses
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.05), eyeMat);
    leftEye.position.set(-0.13, 0.08, 0.25);
    leftEye.rotation.z = 0.22;
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.05), eyeMat);
    rightEye.position.set(0.13, 0.08, 0.25);
    rightEye.rotation.z = -0.22;
    headGroup.add(rightEye);

    headGroup.position.set(0, 0.6, 0);
    torsoGroup.add(headGroup);
    this.limbs.head = headGroup;

    // Left Arm (Blue upper arm sleeve, Fleece forearm & Dark Ram Hoof)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.5, 0.38, 0);
    const lUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.22), blueMat); // BLUE sleeve
    lUpperArm.position.set(0, -0.21, 0);
    const lForeArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.2), fleeceMat); // FLEECE forearm
    lForeArm.position.set(0, -0.50, 0);
    const lHoof = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.18), hoofMat); // RAM HOOF
    lHoof.position.set(0, -0.68, 0);
    // Left Hand / Web Shooter Node
    const leftHand = new THREE.Group();
    leftHand.position.set(0, -0.72, 0.05);

    leftArm.add(lUpperArm);
    leftArm.add(lForeArm);
    leftArm.add(lHoof);
    leftArm.add(leftHand);
    torsoGroup.add(leftArm);
    this.limbs.leftArm = leftArm;
    this.limbs.leftHand = leftHand;

    // Right Arm (Blue upper arm sleeve, Fleece forearm & Dark Ram Hoof - Symmetrical)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.5, 0.38, 0);
    const rUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.22), blueMat); // BLUE sleeve
    rUpperArm.position.set(0, -0.21, 0);
    const rForeArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.2), fleeceMat); // FLEECE forearm
    rForeArm.position.set(0, -0.50, 0);
    const rHoof = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.18), hoofMat); // RAM HOOF
    rHoof.position.set(0, -0.68, 0);

    // Right Hand / Web Shooter Node
    const rightHand = new THREE.Group();
    rightHand.position.set(0, -0.72, 0.05);

    rightArm.add(rUpperArm);
    rightArm.add(rForeArm);
    rightArm.add(rHoof);
    rightArm.add(rightHand);
    torsoGroup.add(rightArm);
    this.limbs.rightArm = rightArm;
    this.limbs.rightHand = rightHand;

    // Left Leg (Red thigh, Blue boot with Hoof Sole - Natural centered athletic stance)
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.15, -0.31, 0);
    const lThigh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.34, 0.26), redMat); // RED Thigh
    lThigh.position.set(0, -0.17, 0);
    const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.28), blueMat); // BLUE Boot
    lBoot.position.set(0, -0.46, 0);
    const lHoofSole = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.30), hoofMat);
    lHoofSole.position.set(0, -0.60, 0);
    leftLeg.add(lThigh);
    leftLeg.add(lBoot);
    leftLeg.add(lHoofSole);
    torsoGroup.add(leftLeg);
    this.limbs.leftLeg = leftLeg;

    // Right Leg (Red thigh, Blue boot with Hoof Sole - Natural centered athletic stance)
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.15, -0.31, 0);
    const rThigh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.34, 0.26), redMat); // RED Thigh
    rThigh.position.set(0, -0.17, 0);
    const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.28), blueMat); // BLUE Boot
    rBoot.position.set(0, -0.46, 0);
    const rHoofSole = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.30), hoofMat);
    rHoofSole.position.set(0, -0.60, 0);
    rightLeg.add(rThigh);
    rightLeg.add(rBoot);
    rightLeg.add(rHoofSole);
    torsoGroup.add(rightLeg);
    this.limbs.rightLeg = rightLeg;
  }

  // Create High-Tech Armored Iron-Ram Character Mesh with Arc Reactor, Gold Horns & Repulsor Ports
  createIronRamPlayerMesh() {
    const ironRedMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Deep Crimson Exo-Armor
      roughness: 0.28,
      metalness: 0.8
    });
    const ironGoldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Heavy Gold Plating
      roughness: 0.2,
      metalness: 0.9
    });
    const arcCoreMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 3.5,
      roughness: 0.1
    });
    const armorDarkMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.85
    });

    this.mesh.position.copy(this.position);

    // Torso Group
    const torsoGroup = new THREE.Group();
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.60, 0.52), ironRedMat);
    chest.position.set(0, 0.28, 0);
    torsoGroup.add(chest);

    // Glowing Cyan Arc Reactor Core
    const arcGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16);
    const arcCore = new THREE.Mesh(arcGeo, arcCoreMat);
    arcCore.rotation.x = Math.PI / 2;
    arcCore.position.set(0, 0.32, 0.28);
    torsoGroup.add(arcCore);

    // Gold Chest Collar Plate
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.54), ironGoldMat);
    collar.position.set(0, 0.52, 0);
    torsoGroup.add(collar);

    // Armored Waist
    const waist = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.34, 0.46), armorDarkMat);
    waist.position.set(0, -0.14, 0);
    torsoGroup.add(waist);

    torsoGroup.position.set(0, 0, 0);
    this.mesh.add(torsoGroup);
    this.limbs.torso = torsoGroup;
    this.limbs.chest = chest;
    this.limbs.arcCore = arcCore;
    this.limbs.waist = waist;

    // Head Group with Gold Block Horns & Cyan Visor
    const headGroup = new THREE.Group();
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.48, 0.50), ironRedMat);
    headGroup.add(head);

    // Gold Face Mask Plate
    const facePlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.06), ironGoldMat);
    facePlate.position.set(0, -0.02, 0.26);
    headGroup.add(facePlate);

    // Glowing Cyan Visor Eyes
    const eyeGeo = new THREE.BoxGeometry(0.12, 0.05, 0.05);
    const lEye = new THREE.Mesh(eyeGeo, arcCoreMat);
    lEye.position.set(-0.11, 0.06, 0.29);
    const rEye = new THREE.Mesh(eyeGeo, arcCoreMat);
    rEye.position.set(0.11, 0.06, 0.29);
    headGroup.add(lEye);
    headGroup.add(rEye);

    // Gold Armored Horns (One solid block cube per side)
    [-1, 1].forEach(side => {
      const hornGeo = new THREE.BoxGeometry(0.18, 0.42, 0.18);
      const horn = new THREE.Mesh(hornGeo, ironGoldMat);
      horn.position.set(side * 0.29, 0.26, 0.02);
      horn.rotation.set(-0.35, side * 0.20, side * 0.38);
      headGroup.add(horn);
    });

    headGroup.position.set(0, 0.6, 0);
    torsoGroup.add(headGroup);
    this.limbs.head = headGroup;

    // Left Arm with Palm Repulsor Node
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.52, 0.38, 0);
    const lArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.24), ironRedMat);
    lArmMesh.position.set(0, -0.34, 0);
    const lRepulsor = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 8), arcCoreMat);
    lRepulsor.rotation.x = Math.PI / 2;
    lRepulsor.position.set(0, -0.66, 0.12);
    leftArm.add(lArmMesh);
    leftArm.add(lRepulsor);
    torsoGroup.add(leftArm);
    this.limbs.leftArm = leftArm;
    this.limbs.leftHand = lRepulsor;

    // Right Arm with Palm Repulsor Node
    const rightArm = new THREE.Group();
    rightArm.position.set(0.52, 0.38, 0);
    const rArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.24), ironRedMat);
    rArmMesh.position.set(0, -0.34, 0);
    const rRepulsor = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 8), arcCoreMat);
    rRepulsor.rotation.x = Math.PI / 2;
    rRepulsor.position.set(0, -0.66, 0.12);
    rightArm.add(rArmMesh);
    rightArm.add(rRepulsor);
    torsoGroup.add(rightArm);
    this.limbs.rightArm = rightArm;
    this.limbs.rightHand = rRepulsor;

    // Left Leg with Boot Jet Thruster
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.16, -0.31, 0);
    const lLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.65, 0.28), ironGoldMat);
    lLegMesh.position.set(0, -0.32, 0);
    const lThruster = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 8), arcCoreMat);
    lThruster.position.set(0, -0.64, 0);
    leftLeg.add(lLegMesh);
    leftLeg.add(lThruster);
    torsoGroup.add(leftLeg);
    this.limbs.leftLeg = leftLeg;
    this.limbs.leftThruster = lThruster;

    // Right Leg with Boot Jet Thruster
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.16, -0.31, 0);
    const rLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.65, 0.28), ironGoldMat);
    rLegMesh.position.set(0, -0.32, 0);
    const rThruster = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 8), arcCoreMat);
    rThruster.position.set(0, -0.64, 0);
    rightLeg.add(rLegMesh);
    rightLeg.add(rThruster);
    torsoGroup.add(rightLeg);
    this.limbs.rightLeg = rightLeg;
    this.limbs.rightThruster = rThruster;
  }

  // --- IRON-RAM ABILITIES & WEAPONS ---

  // 1. Shoot High-Velocity Explosive Repulsor Plasma Bolt
  shootRepulsorBolt(direction) {
    if (this.webFluid < 6) return false;
    this.webFluid -= 6;

    const handPos = this.getHandWorldPosition();
    const boltGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const boltMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.95
    });
    const bolt = new THREE.Mesh(boltGeo, boltMat);
    bolt.position.copy(handPos);

    // Glowing halo
    const halo = new THREE.Mesh(new THREE.SphereGeometry(0.55, 6, 6), new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7
    }));
    bolt.add(halo);

    const light = new THREE.PointLight(0x00f0ff, 2.5, 12);
    bolt.add(light);

    this.scene.add(bolt);
    this.repulsorBolts.push({
      mesh: bolt,
      velocity: direction.clone().multiplyScalar(90.0),
      lifetime: 2.5,
      light: light
    });

    if (this.audio) this.audio.playRepulsorBlast();
    this.switchWebHand();
    return true;
  }

  // 2. Continuous Chest Arc Core Uni-Beam
  fireUniBeam(direction, dt) {
    if (this.webFluid < 12 * dt) return;
    this.webFluid = Math.max(0, this.webFluid - 18 * dt);

    if (!this.uniBeamMesh) {
      const beamGeo = new THREE.CylinderGeometry(0.35, 0.65, 80, 8, 1, true);
      beamGeo.translate(0, 40, 0);
      beamGeo.rotateX(Math.PI / 2);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide
      });
      this.uniBeamMesh = new THREE.Mesh(beamGeo, beamMat);
      this.scene.add(this.uniBeamMesh);
    }

    this.uniBeamMesh.visible = true;
    this.uniBeamActive = true;
    this.uniBeamTimer = 0.15;

    const chestPos = this.position.clone().add(new THREE.Vector3(0, 0.4, 0));
    this.uniBeamMesh.position.copy(chestPos);
    this.uniBeamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);

    if (this.audio) this.audio.playUniBeam();
  }

  // 3. Kinetic Ground Pound Armor Slam
  triggerGroundSlam() {
    this.isGroundSlamming = true;
    this.isFlying = false;
    this.velocity.set(0, -55.0, 0); // High-speed supersonic downward plunge
    if (this.audio) this.audio.playThrusterWhoosh();
  }

  // Create expanding explosive shockwave ring
  createShockwave(pos) {
    const ringGeo = new THREE.RingGeometry(0.5, 1.5, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos).add(new THREE.Vector3(0, 0.15, 0));
    this.scene.add(ring);

    this.shockwaves.push({
      mesh: ring,
      radius: 1.0,
      maxRadius: 16.0,
      lifetime: 0.5,
      maxLifetime: 0.5
    });

    if (this.audio) this.audio.playArmorSlam();
  }

  // Spawn Jet Thruster Plasma Flame Particles
  spawnThrusterParticles(dt) {
    if (!this.isFlying && !this.isGroundSlamming) return;

    for (let i = 0; i < 2; i++) {
      const pGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const isCyan = Math.random() > 0.3;
      const pMat = new THREE.MeshBasicMaterial({
        color: isCyan ? 0x00f0ff : 0xf59e0b,
        transparent: true,
        opacity: 0.9
      });
      const p = new THREE.Mesh(pGeo, pMat);
      // Spawn below boots
      const footX = (Math.random() > 0.5 ? -0.2 : 0.2);
      p.position.copy(this.position).add(new THREE.Vector3(footX, -0.7, 0));
      this.scene.add(p);

      const drift = new THREE.Vector3(
        (Math.random() - 0.5) * 4.0,
        -12.0 - Math.random() * 8.0,
        (Math.random() - 0.5) * 4.0
      );

      this.thrusterParticles.push({
        mesh: p,
        velocity: drift,
        lifetime: 0.25,
        maxLifetime: 0.25
      });
    }
  }

  // Update projectiles, shockwaves, particles, and damage logic
  updateProjectiles(dt, enemies = [], obstacles = [], cars = []) {
    // 1. Repulsor Bolts
    for (let i = this.repulsorBolts.length - 1; i >= 0; i--) {
      const bolt = this.repulsorBolts[i];
      bolt.lifetime -= dt;
      bolt.mesh.position.addScaledVector(bolt.velocity, dt);

      let collided = false;
      const bPos = bolt.mesh.position;

      // Check ground collision
      if (bPos.y <= 0.1) {
        collided = true;
      }

      // Check enemy collisions
      if (!collided) {
        for (let j = 0; j < enemies.length; j++) {
          const enemy = enemies[j];
          if (enemy && enemy.position && bPos.distanceTo(enemy.position) < 2.0) {
            collided = true;
            break;
          }
        }
      }

      // Check vehicle collisions
      if (!collided && cars) {
        for (let c = 0; c < cars.length; c++) {
          const car = cars[c];
          if (car && car.mesh && bPos.distanceTo(car.mesh.position) < 3.0) {
            collided = true;
            if (car.mesh.position) {
              car.currentSpeed = (car.currentSpeed || 0) + 15.0;
            }
            break;
          }
        }
      }

      if (collided || bolt.lifetime <= 0) {
        // Detonate Repulsor Blast!
        this.createShockwave(bPos);

        // Area Damage to all hostiles within 8m
        for (let j = 0; j < enemies.length; j++) {
          const enemy = enemies[j];
          if (enemy && enemy.position) {
            const dist = bPos.distanceTo(enemy.position);
            if (dist < 8.0) {
              const dmg = Math.floor(65 * (1.0 - dist / 8.0));
              if (typeof enemy.takeDamage === 'function') {
                const knockback = enemy.position.clone().sub(bPos).normalize();
                enemy.takeDamage(dmg, knockback);
              }
            }
          }
        }

        this.scene.remove(bolt.mesh);
        this.repulsorBolts.splice(i, 1);
      }
    }

    // 2. Uni-Beam Laser
    if (this.uniBeamMesh) {
      if (this.uniBeamTimer > 0) {
        this.uniBeamTimer -= dt;
        // Check continuous damage along beam line
        const origin = this.uniBeamMesh.position;
        const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.uniBeamMesh.quaternion);

        for (let j = 0; j < enemies.length; j++) {
          const enemy = enemies[j];
          if (enemy && enemy.position) {
            const toEnemy = enemy.position.clone().sub(origin);
            const proj = toEnemy.dot(forward);
            if (proj > 0 && proj < 80.0) {
              const perpDist = toEnemy.clone().sub(forward.clone().multiplyScalar(proj)).length();
              if (perpDist < 2.5) {
                if (typeof enemy.takeDamage === 'function') {
                  enemy.takeDamage(75 * dt, forward);
                }
              }
            }
          }
        }
      } else {
        this.uniBeamMesh.visible = false;
        this.uniBeamActive = false;
      }
    }

    // 3. Shockwave rings expansion
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.lifetime -= dt;
      const progress = 1.0 - (sw.lifetime / sw.maxLifetime);
      sw.radius = 1.0 + progress * sw.maxRadius;
      sw.mesh.scale.set(sw.radius, sw.radius, sw.radius);
      if (sw.mesh.material) {
        sw.mesh.material.opacity = Math.max(0, 1.0 - progress);
      }

      if (sw.lifetime <= 0) {
        this.scene.remove(sw.mesh);
        this.shockwaves.splice(i, 1);
      }
    }

    // 4. Thruster particles
    for (let i = this.thrusterParticles.length - 1; i >= 0; i--) {
      const tp = this.thrusterParticles[i];
      tp.lifetime -= dt;
      tp.mesh.position.addScaledVector(tp.velocity, dt);
      const prog = tp.lifetime / tp.maxLifetime;
      tp.mesh.scale.set(prog, prog, prog);

      if (tp.lifetime <= 0) {
        this.scene.remove(tp.mesh);
        this.thrusterParticles.splice(i, 1);
      }
    }
  }

  getForwardVector(out = new THREE.Vector3()) {
    return out.set(Math.sin(this.mesh.rotation.y), 0, Math.cos(this.mesh.rotation.y)).normalize();
  }

  // Switch between left and right web-shooting arm on each web hit
  switchWebHand() {
    this.currentWebHand = (this.currentWebHand === 'left') ? 'right' : 'left';
    return this.currentWebHand;
  }

  // Get exact world position of Spider-Ram's currently active hand (alternates left/right)
  getHandWorldPosition(out = new THREE.Vector3()) {
    const node = (this.currentWebHand === 'left' && this.limbs.leftHand) ? this.limbs.leftHand : this.limbs.rightHand;
    if (node) {
      this.mesh.updateMatrixWorld(true);
      return node.getWorldPosition(out);
    }
    return out.copy(this.position).add(new THREE.Vector3(0.4, 1.4, 0));
  }

  // Handle player input logic
  handleInput(input, cameraDir, dt) {
    const moveDir = new THREE.Vector3();
    const camYaw = input.yaw;

    // Convert WASD or analog joystick into world direction relative to camera angle
    if (input.moveX !== undefined && (Math.abs(input.moveX) > 0.05 || Math.abs(input.moveZ) > 0.05)) {
      moveDir.x = input.moveX;
      moveDir.z = input.moveZ;
    } else {
      if (input.moveForward) moveDir.z -= 1;
      if (input.moveBackward) moveDir.z += 1;
      if (input.moveLeft) moveDir.x -= 1;
      if (input.moveRight) moveDir.x += 1;
    }

    if (moveDir.lengthSq() > 0) {
      if (moveDir.lengthSq() > 1.0) moveDir.normalize();
      moveDir.applyEuler(new THREE.Euler(0, camYaw, 0));
    }

    // --- IRON-RAM POWERED FLIGHT & COMBAT SUITE ---
    if (this.characterType === 'iron_ram') {
      // Toggle Flight with Right Click (webSwing) or jumping in mid-air
      if (input.swingPressed || (input.jumpPressed && !this.isGrounded)) {
        if (!this.isFlying) {
          this.isFlying = true;
          this.isGrounded = false;
          if (this.audio) this.audio.playThrusterWhoosh();
        }
      }

      if (this.isFlying) {
        const flySpeed = input.isSprinting ? 44.0 : 24.0;
        const flightDir = new THREE.Vector3();

        const fwd = input.moveForward || (input.moveZ !== undefined && input.moveZ < -0.2);
        const bwd = input.moveBackward || (input.moveZ !== undefined && input.moveZ > 0.2);
        const left = input.moveLeft || (input.moveX !== undefined && input.moveX < -0.2);
        const right = input.moveRight || (input.moveX !== undefined && input.moveX > 0.2);

        if (fwd) flightDir.add(cameraDir);
        if (bwd) flightDir.sub(cameraDir);

        const rightDir = new THREE.Vector3(-cameraDir.z, 0, cameraDir.x).normalize();
        if (right) flightDir.add(rightDir);
        if (left) flightDir.sub(rightDir);

        if (input.isJumping) flightDir.y += 0.85;
        if (input.wallCrawlToggle) flightDir.y -= 0.85;

        if (flightDir.lengthSq() > 0) {
          flightDir.normalize();
          this.velocity.lerp(flightDir.multiplyScalar(flySpeed), 8.0 * dt);
          if (Math.hypot(this.velocity.x, this.velocity.z) > 0.5) {
            this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
          }
        } else {
          // Hover damping
          this.velocity.lerp(new THREE.Vector3(0, 0, 0), 4.0 * dt);
        }

        // Spawn glowing thruster particles
        this.spawnThrusterParticles(dt);

        // Repulsor shooting while flying
        if (input.webShootPressed || input.attackPressed) {
          this.shootRepulsorBolt(cameraDir);
        }

        // Uni-beam while flying
        if (input.wallCrawlToggle && input.isSprinting) {
          this.fireUniBeam(cameraDir, dt);
        }

        // Kinetic Ground Slam plunge
        if (input.dashPressed && cameraDir.y < -0.3) {
          this.triggerGroundSlam();
        }

        // Land on ground
        if (this.isGrounded && !input.isJumping) {
          this.isFlying = false;
        }
        return;
      }

      // Ground abilities for Iron-Ram
      if (input.webShootPressed) {
        this.shootRepulsorBolt(cameraDir);
      }

      if (input.wallCrawlToggle) {
        this.fireUniBeam(cameraDir, dt);
      }
    }

    // Toggle Wall Crawling (Spider-Ram only)
    if (this.characterType === 'spider_ram' && input.wallCrawlToggle && this.isTouchingWall) {
      this.isWallCrawling = !this.isWallCrawling;
      if (this.isWallCrawling) {
        this.velocity.set(0, 0, 0);
      }
    }

    // --- WALL CRAWLING MOVEMENT ---
    if (this.isWallCrawling && this.isTouchingWall) {
      const crawlSpeed = 11.0;
      this.velocity.set(0, 0, 0);

      // Up/Down crawling
      if (input.moveForward) this.velocity.y = crawlSpeed;
      if (input.moveBackward) this.velocity.y = -crawlSpeed;

      // Lateral crawl along wall tangent
      const wallTangent = new THREE.Vector3(-this.wallNormal.z, 0, this.wallNormal.x);
      if (input.moveRight) this.velocity.addScaledVector(wallTangent, crawlSpeed);
      if (input.moveLeft) this.velocity.addScaledVector(wallTangent, -crawlSpeed);

      // Wall leap / jump off
      if (input.jumpPressed) {
        this.isWallCrawling = false;
        this.velocity.copy(this.wallNormal).multiplyScalar(18.0);
        this.velocity.y = 16.0;
        if (this.audio) this.audio.playJump();
        return;
      }

      // Orient spider facing the wall surface cleanly
      const targetAngle = Math.atan2(-this.wallNormal.x, -this.wallNormal.z);
      this.mesh.rotation.y = targetAngle;
      return;
    } else {
      this.isWallCrawling = false;
    }

    // --- GROUND MOVEMENT ---
    if (this.isGrounded) {
      this.canDoubleJump = true;
      this.canAirDash = true;

      const speed = input.isSprinting ? 18.0 : 11.0;
      if (moveDir.lengthSq() > 0) {
        this.velocity.x = moveDir.x * speed;
        this.velocity.z = moveDir.z * speed;
        this.mesh.rotation.y = Math.atan2(moveDir.x, moveDir.z);
      }

      // Ground Tuck and Roll Somersault Dash (Shift key)
      if (input.dashPressed && !this.isTuckRolling) {
        this.isTuckRolling = true;
        this.tuckRollProgress = 0;
        const forward = this.getForwardVector();
        this.velocity.copy(forward).multiplyScalar(26.0);
        this.velocity.y = 3.5;
        if (this.audio) this.audio.playWebZip();
      }

      if (input.jumpPressed) {
        this.velocity.y = 18.0;
        this.isGrounded = false;
        if (this.audio) this.audio.playJump();
      }
    } else {
      // --- AIRBORNE MOVEMENT ---
      const airControl = this.isSwinging ? 10.0 : 14.0;
      if (moveDir.lengthSq() > 0) {
        this.velocity.x += moveDir.x * airControl * dt;
        this.velocity.z += moveDir.z * airControl * dt;
        if (!this.isSwinging) {
          this.mesh.rotation.y = Math.atan2(moveDir.x, moveDir.z);
        }
      }

      // Airborne Double Jump
      if (input.jumpPressed && !this.isSwinging) {
        if (this.canDoubleJump) {
          this.velocity.y = 18.0;
          const forward = this.getForwardVector();
          this.velocity.addScaledVector(forward, 8.0);
          this.canDoubleJump = false;
          this.isFrontFlipping = true;
          this.frontFlipProgress = 0;
          if (this.audio) this.audio.playJump();
        }
      }

      // Air Dash
      if (input.dashPressed && this.canAirDash && !this.isSwinging && !this.isDashing) {
        this.isDashing = true;
        this.isTuckRolling = true;
        this.tuckRollProgress = 0;
        this.canAirDash = false;
        this.dashTimer = this.dashDuration;
        this.velocity.y = 4.0;
        const forward = this.getForwardVector();
        this.velocity.addScaledVector(forward, 36.0);
        if (this.audio) this.audio.playWebZip();
      }
    }

    // --- COMBAT ATTACK INPUT ---
    if (input.attackPressed && !this.isAttacking) {
      this.performAttack();
    }
  }

  // Melee Trotter Strike & Dive Kick
  performAttack() {
    if (this.isAttacking) return;

    this.isAttacking = true;
    this.attackTimer = 0.35;
    this.attackTimer = 0.28;

    if (!this.isGrounded && !this.isWallCrawling) {
      // Powerful Air Dive Kick
      this.attackState = 'airKick';
      this.velocity.y = -22.0;
      const forward = this.getForwardVector();
      this.velocity.addScaledVector(forward, 16.0);
      if (this.audio) {
        if (typeof this.audio.playMeleePunch === 'function') this.audio.playMeleePunch(3);
        else if (typeof this.audio.playPunch === 'function') this.audio.playPunch(3);
      }
      return;
    }

    // 3-Hit Ground Melee Combo
    this.comboCount = (this.comboCount % 3) + 1;
    this.comboTimer = 1.4;

    if (this.comboCount === 1) {
      this.attackState = 'punch1';
    } else if (this.comboCount === 2) {
      this.attackState = 'punch2';
    } else {
      this.attackState = 'punch3';
    }

    if (this.audio) {
      if (typeof this.audio.playMeleePunch === 'function') this.audio.playMeleePunch(this.comboCount);
      else if (typeof this.audio.playPunch === 'function') this.audio.playPunch(this.comboCount);
    }

    // Lunge forward slightly on punch
    const forward = this.getForwardVector();
    this.velocity.addScaledVector(forward, 6.0);
  }

  // Take Damage
  takeDamage(amount, knockbackDir = null) {
    if (this.invulnerableTimer > 0) return;
    this.health = Math.max(0, this.health - amount);
    this.invulnerableTimer = 0.6; // 0.6s grace period

    if (knockbackDir) {
      this.velocity.copy(knockbackDir).multiplyScalar(22.0);
      this.velocity.y = 12.0;
    }
  }

  // Heal / Refill Fluid
  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  consumeWebFluid(cost) {
    if (this.webFluid >= cost) {
      this.webFluid -= cost;
      return true;
    }
    return false;
  }

  refillWebFluid(amount) {
    this.webFluid = Math.min(this.maxWebFluid, this.webFluid + amount);
  }

  // Update animations and timers
  update(dt) {
    this.animTime += dt;

    // Timers
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) this.isDashing = false;
    }

    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.comboCount = 0;
    }

    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      // Flashing visual when damaged
      this.mesh.visible = Math.floor(this.invulnerableTimer * 20) % 2 === 0;
    } else if (this.isDriving) {
      this.mesh.visible = false;
    } else {
      this.mesh.visible = true;
    }

    // Auto Web Fluid / Arc Energy Recharge
    if (this.webFluid < this.maxWebFluid) {
      this.webFluid = Math.min(this.maxWebFluid, this.webFluid + this.webFluidRechargeRate * dt);
    }

    // Kinetic Ground Slam Impact detection
    if (this.isGroundSlamming) {
      this.spawnThrusterParticles(dt);
      if (this.isGrounded) {
        this.isGroundSlamming = false;
        this.createShockwave(this.position);
      }
    }

    // Attack state timer
    if (this.isAttacking) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
        this.attackState = 'none';
      }
    }

    // Position sync
    this.mesh.position.copy(this.position);
    if (this.isWallCrawling) {
      // Offset slightly closer to wall surface so limbs grip the wall cleanly
      this.mesh.position.addScaledVector(this.wallNormal, -0.22);
    }

    // Dynamic procedural limb animations
    this.animateLimbs(dt);
  }

  // Animate character limbs based on locomotion & combat state
  animateLimbs(dt) {
    const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    const { torso, head, leftArm, rightArm, leftLeg, rightLeg } = this.limbs;
    if (!torso || !head || !leftArm || !rightArm || !leftLeg || !rightLeg) return;

    // Reset default transforms
    torso.position.set(0, 0, 0);
    leftArm.rotation.set(0, 0, 0);
    rightArm.rotation.set(0, 0, 0);
    leftLeg.rotation.set(0, 0, 0);
    rightLeg.rotation.set(0, 0, 0);
    const legX = this.characterType === 'iron_ram' ? 0.16 : 0.15;
    const armX = this.characterType === 'iron_ram' ? 0.52 : 0.50;
    leftLeg.position.set(-legX, -0.31, 0);
    rightLeg.position.set(legX, -0.31, 0);
    leftArm.position.set(-armX, 0.38, 0);
    rightArm.position.set(armX, 0.38, 0);
    torso.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);

    // Iron-Ram Powered Flight Pose
    if (this.isFlying) {
      const pitchAngle = Math.atan2(-this.velocity.y, horizontalSpeed + 0.1) * 0.7;
      torso.rotation.x = 0.5 + pitchAngle;
      head.rotation.x = -0.6; // Eyes fixed ahead on horizon
      leftArm.rotation.set(-0.25, 0.2, -0.45); // Arms angled back stabilizing flight
      rightArm.rotation.set(-0.25, -0.2, 0.45);
      leftLeg.rotation.set(-0.35, 0.1, 0); // Legs trailing in jet stream
      rightLeg.rotation.set(-0.35, -0.1, 0);
      return;
    }

    if (this.isGrounded) {
      this.isFrontFlipping = false;
      this.frontFlipProgress = 0;
    }

    if (this.isTuckRolling) {
      this.tuckRollProgress += dt / this.tuckRollDuration;
      const rollAngle = Math.min(1.0, this.tuckRollProgress) * Math.PI * 2;
      torso.rotation.x = rollAngle;
      // Dip down close to the asphalt in a compact dive roll
      torso.position.y = -Math.sin(Math.min(1.0, this.tuckRollProgress) * Math.PI) * 0.32;

      // Compact sphere somersault tuck pose
      head.rotation.x = 0.9;
      leftArm.rotation.set(1.4, 0.15, -0.3);
      rightArm.rotation.set(1.4, -0.15, 0.3);
      leftLeg.rotation.set(-1.4, 0.15, 0);
      rightLeg.rotation.set(-1.4, -0.15, 0);

      if (this.tuckRollProgress >= 1.0) {
        this.isTuckRolling = false;
        this.tuckRollProgress = 0;
      }
    } else if (this.isFrontFlipping) {
      this.frontFlipProgress += dt / this.frontFlipDuration;
      const flipAngle = Math.min(1.0, this.frontFlipProgress) * Math.PI * 2;
      torso.rotation.x = flipAngle;

      // Athletic parkour front flip tuck
      leftLeg.rotation.x = 1.1;
      rightLeg.rotation.x = 1.1;
      leftArm.rotation.x = -1.6;
      rightArm.rotation.x = -1.6;

      if (this.frontFlipProgress >= 1.0) {
        this.isFrontFlipping = false;
        this.frontFlipProgress = 0;
      }
    } else if (this.isAttacking) {
      // Combat animations
      if (this.attackState === 'punch1') {
        rightArm.rotation.x = -Math.PI / 2;
        rightArm.rotation.y = -0.3;
        leftArm.rotation.x = -0.4;
      } else if (this.attackState === 'punch2') {
        leftArm.rotation.x = -Math.PI / 2;
        leftArm.rotation.y = 0.3;
        rightArm.rotation.x = -0.4;
      } else if (this.attackState === 'punch3' || this.attackState === 'swingKick') {
        rightLeg.rotation.x = -Math.PI / 2.2;
        torso.rotation.z = -0.4;
        rightArm.rotation.x = -Math.PI / 2.5;
        leftArm.rotation.x = Math.PI / 3;
      } else if (this.attackState === 'airKick') {
        rightLeg.rotation.x = -Math.PI / 2.5;
        leftLeg.rotation.x = 0.3;
        torso.rotation.x = 0.6;
      }
    } else if (this.isSwinging) {
      // Dynamic Web-Swinging Arc Pose with Alternating Web Shooting Arm
      const swingAngle = Math.atan2(this.velocity.y, horizontalSpeed);
      torso.rotation.x = -swingAngle * 0.7;

      if (this.currentWebHand === 'left') {
        // Left arm reaches UP holding the web line
        leftArm.rotation.x = -Math.PI * 0.85;
        leftArm.rotation.z = -0.25;
        // Right arm trails behind
        rightArm.rotation.x = 0.5;
        rightArm.rotation.z = 0.3;
        leftLeg.rotation.x = 0.4;
        rightLeg.rotation.x = 0.8;
      } else {
        // Right arm reaches UP holding the web line
        rightArm.rotation.x = -Math.PI * 0.85;
        rightArm.rotation.z = 0.25;
        // Left arm trails behind
        leftArm.rotation.x = 0.5;
        leftArm.rotation.z = -0.3;
        leftLeg.rotation.x = 0.8;
        rightLeg.rotation.x = 0.4;
      }

      // Bank into turn
      this.mesh.rotation.y = Math.atan2(this.velocity.x, this.velocity.z);
    } else if (this.isWallCrawling) {
      // Natural Quadruped Wall Crawl & Cling Kinematics (All 4 trotters planted flush on wall)
      const isMovingOnWall = Math.abs(this.velocity.y) > 0.1 || Math.hypot(this.velocity.x, this.velocity.z) > 0.1;
      
      // Position limbs forward so trotters plant directly against building bricks
      leftArm.position.set(-0.52, 0.42, 0.14);
      rightArm.position.set(0.52, 0.42, 0.14);
      leftLeg.position.set(-0.18, -0.36, 0.1);
      rightLeg.position.set(0.18, -0.36, 0.1);

      if (isMovingOnWall) {
        const crawlCycle = Math.sin(this.animTime * 15);
        const crawlStride = 0.42;

        if (this.velocity.y > 0.1) {
          // Crawling UP building - Head tilted up looking at the rooftop, athletic forward arch
          head.rotation.x = -0.55;
          torso.rotation.x = -0.14;
        } else if (this.velocity.y < -0.1) {
          // Crawling DOWN building - Head tilted down looking at street
          head.rotation.x = 0.22;
          torso.rotation.x = 0.08;
        } else {
          // Lateral Crawling along wall
          head.rotation.x = -0.3;
          torso.rotation.x = -0.06;
        }

        // Alternating diagonal trotters stride (Left Arm + Right Leg vs Right Arm + Left Leg)
        leftArm.rotation.set(-0.85 + crawlCycle * crawlStride, 0.35, -0.55);
        rightArm.rotation.set(-0.85 - crawlCycle * crawlStride, -0.35, 0.55);
        leftLeg.rotation.set(0.6 - crawlCycle * crawlStride, 0.35, -0.6);
        rightLeg.rotation.set(0.6 + crawlCycle * crawlStride, -0.35, 0.6);

        // Organic spine and hip sway as Spider-Ram climbs
        torso.rotation.z = Math.sin(this.animTime * 7.5) * 0.1;
      } else {
        // Superhero idle wall cling pose - firmly gripping skyscraper facade
        const breathe = Math.sin(this.animTime * 3) * 0.02;
        head.rotation.x = -0.5; // Alertly looking upward
        torso.rotation.x = -0.1;
        torso.rotation.z = 0;

        leftArm.rotation.set(-0.8 + breathe, 0.4, -0.55);
        rightArm.rotation.set(-0.8 + breathe, -0.4, 0.55);
        leftLeg.rotation.set(0.58 - breathe, 0.35, -0.6);
        rightLeg.rotation.set(0.58 - breathe, -0.35, 0.6);
      }
    } else if (this.isGrounded) {
      if (horizontalSpeed > 0.8) {
        // Run / Sprint cycle
        const freq = horizontalSpeed > 16 ? 16 : 10;
        const cycle = Math.sin(this.animTime * freq);

        leftLeg.rotation.x = cycle * 0.85;
        rightLeg.rotation.x = -cycle * 0.85;
        leftArm.rotation.x = -cycle * 0.85;
        rightArm.rotation.x = cycle * 0.85;

        torso.rotation.y = cycle * 0.15;
        torso.rotation.x = 0.18; // Slight forward sprint lean
      } else {
        // Stable idle breathing
        const breathe = Math.sin(this.animTime * 3);
        torso.position.y = breathe * 0.012;
        leftArm.rotation.z = -0.15 + breathe * 0.03;
        rightArm.rotation.z = 0.15 - breathe * 0.03;
      }
    } else {
      // In Air / Falling Pose
      torso.rotation.x = 0.3;
      leftLeg.rotation.x = 0.5;
      rightLeg.rotation.x = -0.4;
      leftArm.rotation.x = -Math.PI / 3;
      rightArm.rotation.x = -Math.PI / 3;
    }
  }
}
