import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const HERO_DEFAULT_CUSTOMIZATION = {
  spider_ram: {
    primaryColor: '#e11d48',    // Vibrant superhero red
    secondaryColor: '#1d4ed8',  // Heroic royal blue
    energyColor: '#00f0ff',     // Glowing cyan eye slits
    symbol: 'sr',               // 'sr', 'arc', 'star', 'lightning', 'skull', 'biohazard', 'clean'
    headgear: 'classic_horns',  // 'classic_horns', 'cyber_horns', 'visor', 'samurai', 'headset', 'cowl'
    accessory: 'none'           // 'none', 'jetpack', 'cape', 'pauldrons', 'bandolier', 'holo_wings'
  },
  iron_ram: {
    primaryColor: '#991b1b',    // Deep Crimson Exo-Armor
    secondaryColor: '#f59e0b',  // Heavy Gold Plating
    energyColor: '#00f0ff',     // Arc Reactor Cyan
    symbol: 'arc',              // Arc Reactor
    headgear: 'cyber_horns',    // Chiseled Gold Block Horns
    accessory: 'jetpack'        // Twin back thruster pods
  }
};

export function generateEmblemTexture(symbolType, primaryColor = '#e11d48', secondaryColor = '#1d4ed8', energyColor = '#00f0ff') {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 128, 128);

  const cx = 64;
  const cy = 64;

  if (symbolType === 'sr') {
    // Bold Black/Secondary "SR" letters with energy outline
    ctx.lineWidth = 9;
    ctx.strokeStyle = energyColor;
    ctx.font = '900 80px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('SR', cx, cy + 2);

    ctx.fillStyle = '#0f172a';
    ctx.fillText('SR', cx, cy + 2);
  } else if (symbolType === 'arc') {
    // Arc Reactor: Outer glow circle, inner turbine segments, glowing core
    ctx.strokeStyle = energyColor;
    ctx.lineWidth = 6;
    ctx.shadowColor = energyColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    for (let i = 0; i < 8; i++) {
      const ang = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * 24, cy + Math.sin(ang) * 24);
      ctx.lineTo(cx + Math.cos(ang) * 44, cy + Math.sin(ang) * 44);
      ctx.stroke();
    }

    ctx.fillStyle = energyColor;
    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
  } else if (symbolType === 'star') {
    // 5-pointed military commander star
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = secondaryColor;
    ctx.strokeStyle = energyColor;
    ctx.lineWidth = 6;
    ctx.shadowColor = energyColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a1 = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x1 = Math.cos(a1) * 46;
      const y1 = Math.sin(a1) * 46;
      if (i === 0) ctx.moveTo(x1, y1);
      else ctx.lineTo(x1, y1);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a1 = (i * 4 * Math.PI) / 5 - Math.PI / 2;
      const x1 = Math.cos(a1) * 20;
      const y1 = Math.sin(a1) * 20;
      if (i === 0) ctx.moveTo(x1, y1);
      else ctx.lineTo(x1, y1);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (symbolType === 'lightning') {
    // Lightning bolt
    ctx.fillStyle = energyColor;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.shadowColor = energyColor;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(cx + 8, cy - 48);
    ctx.lineTo(cx - 24, cy - 6);
    ctx.lineTo(cx + 2, cy - 6);
    ctx.lineTo(cx - 10, cy + 48);
    ctx.lineTo(cx + 24, cy + 4);
    ctx.lineTo(cx - 2, cy + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (symbolType === 'skull') {
    // Stylized cyber skull
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = energyColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = energyColor;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 36, Math.PI * 0.8, Math.PI * 0.2);
    ctx.lineTo(cx + 18, cy + 34);
    ctx.lineTo(cx - 18, cy + 34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = energyColor;
    ctx.beginPath();
    ctx.ellipse(cx - 14, cy - 10, 8, 12, 0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + 14, cy - 10, 8, 12, -0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(cx, cy + 6);
    ctx.lineTo(cx - 5, cy + 18);
    ctx.lineTo(cx + 5, cy + 18);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - 12, cy + 26, 8, 6);
    ctx.strokeRect(cx + 4, cy + 26, 8, 6);
  } else if (symbolType === 'biohazard') {
    // 3-ring biohazard
    ctx.strokeStyle = energyColor;
    ctx.lineWidth = 6;
    ctx.shadowColor = energyColor;
    ctx.shadowBlur = 10;
    for (let i = 0; i < 3; i++) {
      const ang = (i * 2 * Math.PI) / 3 - Math.PI / 2;
      const bx = cx + Math.cos(ang) * 22;
      const by = cy + Math.sin(ang) * 22;
      ctx.beginPath();
      ctx.arc(bx, by, 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Clean / Minimalist: Cyber faceted shield plate
    ctx.strokeStyle = energyColor;
    ctx.lineWidth = 5;
    ctx.fillStyle = secondaryColor;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 40);
    ctx.lineTo(cx + 36, cy - 20);
    ctx.lineTo(cx + 28, cy + 24);
    ctx.lineTo(cx, cy + 44);
    ctx.lineTo(cx - 28, cy + 24);
    ctx.lineTo(cx - 36, cy - 20);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

export class Player {
  constructor(scene, audioSystem, characterType = 'spider_ram') {
    this.scene = scene;
    this.audio = audioSystem;
    this.characterType = characterType;

    // Customization state
    this.customization = this.loadCustomization();

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

  // Load custom hero appearance from localStorage or hero defaults
  loadCustomization() {
    try {
      const saved = localStorage.getItem(`loa_customization_${this.characterType}`);
      if (saved) {
        return Object.assign({}, HERO_DEFAULT_CUSTOMIZATION[this.characterType], JSON.parse(saved));
      }
    } catch (e) {}
    return Object.assign({}, HERO_DEFAULT_CUSTOMIZATION[this.characterType] || HERO_DEFAULT_CUSTOMIZATION.spider_ram);
  }

  saveCustomization() {
    try {
      localStorage.setItem(`loa_customization_${this.characterType}`, JSON.stringify(this.customization));
    } catch (e) {}
  }

  applyCustomization(customData) {
    if (!customData) return;
    this.customization = Object.assign(this.customization, customData);
    this.saveCustomization();
    this.buildCharacterMesh();
  }

  // Switch character model and abilities on the fly
  setCharacterType(type) {
    this.characterType = type;
    this.customization = this.loadCustomization();
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

  // Helper to build modular headgear attachments
  buildHeadgear(headGroup, headgearType, primaryMat, secondaryMat, energyMat) {
    if (!headgearType || headgearType === 'classic_horns') {
      // Classic curved organic ram horns + ears
      [-1, 1].forEach(side => {
        const hornGeo = new THREE.BoxGeometry(0.18, 0.38, 0.18);
        const hornMesh = new THREE.Mesh(hornGeo, secondaryMat);
        hornMesh.position.set(side * 0.28, 0.24, 0.02);
        hornMesh.rotation.set(-0.35, side * 0.20, side * 0.38);
        hornMesh.castShadow = true;
        headGroup.add(hornMesh);

        const ear = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.07, 0.14), primaryMat);
        ear.position.set(side * 0.27, 0.05, -0.09);
        ear.rotation.y = side * 0.7;
        ear.rotation.z = side * -0.3;
        headGroup.add(ear);
      });
    } else if (headgearType === 'cyber_horns') {
      // Heavy Chiseled Block Horns with Glowing Energy Vents
      [-1, 1].forEach(side => {
        const hBase = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.36, 0.18), secondaryMat);
        hBase.position.set(side * 0.29, 0.26, 0.02);
        hBase.rotation.set(-0.35, side * 0.20, side * 0.38);
        headGroup.add(hBase);

        const hTip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.12), energyMat);
        hTip.position.set(side * 0.38, 0.44, -0.04);
        hTip.rotation.set(-0.35, side * 0.20, side * 0.38);
        headGroup.add(hTip);
      });
    } else if (headgearType === 'visor') {
      // High-Tech Holographic Cyclops Visor
      const visorGeo = new THREE.BoxGeometry(0.44, 0.12, 0.10);
      const visorMesh = new THREE.Mesh(visorGeo, energyMat);
      visorMesh.position.set(0, 0.08, 0.26);
      headGroup.add(visorMesh);

      [-1, 1].forEach(side => {
        const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.04, 8), secondaryMat);
        mount.rotation.z = Math.PI / 2;
        mount.position.set(side * 0.26, 0.08, 0.15);
        headGroup.add(mount);
      });
    } else if (headgearType === 'samurai') {
      // Dual Upward Sweeping Oni Horns & Forehead Diamond Crest
      [-1, 1].forEach(side => {
        const hornGeo = new THREE.ConeGeometry(0.09, 0.52, 5);
        const horn = new THREE.Mesh(hornGeo, secondaryMat);
        horn.position.set(side * 0.20, 0.42, 0.08);
        horn.rotation.set(0.2, side * -0.15, side * 0.35);
        headGroup.add(horn);
      });
      const crest = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.06), energyMat);
      crest.position.set(0, 0.24, 0.26);
      crest.rotation.z = Math.PI / 4;
      headGroup.add(crest);
    } else if (headgearType === 'headset') {
      // Tactical Comms Headset with Glowing Antenna
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.05, 0.12), secondaryMat);
      band.position.set(0, 0.25, 0);
      headGroup.add(band);

      [-1, 1].forEach(side => {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 12), secondaryMat);
        cup.rotation.z = Math.PI / 2;
        cup.position.set(side * 0.26, 0.04, 0);
        headGroup.add(cup);
      });

      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.38, 6), secondaryMat);
      ant.position.set(0.28, 0.22, -0.05);
      ant.rotation.z = -0.3;
      headGroup.add(ant);
      const antTip = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), energyMat);
      antTip.position.set(0.34, 0.42, -0.05);
      headGroup.add(antTip);
    } else if (headgearType === 'cowl') {
      // Sleek Stealth Mask / Ninja Fin (Hornless)
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.36), secondaryMat);
      fin.position.set(0, 0.26, -0.04);
      fin.rotation.x = -0.15;
      headGroup.add(fin);
    }
  }

  // Helper to build modular back & shoulder accessories
  buildAccessory(torsoGroup, accessoryType, primaryMat, secondaryMat, energyMat) {
    if (!accessoryType || accessoryType === 'none') return;

    if (accessoryType === 'jetpack') {
      // Twin Chrome Thruster Pods with Glowing Energy Nozzles
      [-1, 1].forEach(side => {
        const jetPod = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.10, 0.50, 12), secondaryMat);
        jetPod.position.set(side * 0.22, 0.32, -0.32);
        torsoGroup.add(jetPod);

        const cone = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 12), energyMat);
        cone.position.set(side * 0.22, 0.03, -0.32);
        cone.rotation.x = Math.PI;
        torsoGroup.add(cone);
      });
      const jBracket = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.10), primaryMat);
      jBracket.position.set(0, 0.32, -0.28);
      torsoGroup.add(jBracket);
    } else if (accessoryType === 'cape') {
      // Classic Superhero Cape draped from shoulders
      const capeGeo = new THREE.BoxGeometry(0.68, 0.85, 0.04);
      const cape = new THREE.Mesh(capeGeo, primaryMat);
      cape.position.set(0, -0.05, -0.28);
      cape.rotation.x = 0.12;
      torsoGroup.add(cape);

      [-1, 1].forEach(side => {
        const clip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), secondaryMat);
        clip.position.set(side * 0.26, 0.52, -0.24);
        torsoGroup.add(clip);
      });
    } else if (accessoryType === 'pauldrons') {
      // Heavy Armored Shoulder Guard Plates with Neon Strip
      [-1, 1].forEach(side => {
        const pauldGeo = new THREE.BoxGeometry(0.28, 0.16, 0.28);
        const pauld = new THREE.Mesh(pauldGeo, secondaryMat);
        pauld.position.set(side * 0.52, 0.54, 0);
        pauld.rotation.z = side * -0.25;
        torsoGroup.add(pauld);

        const strip = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.26), energyMat);
        strip.position.set(side * 0.52, 0.60, 0);
        strip.rotation.z = side * -0.25;
        torsoGroup.add(strip);
      });
    } else if (accessoryType === 'bandolier') {
      // Diagonal Tactical Ammo/Gadget Strap across chest
      const strapGeo = new THREE.BoxGeometry(0.12, 0.85, 0.52);
      const strap = new THREE.Mesh(strapGeo, secondaryMat);
      strap.position.set(0, 0.28, 0);
      strap.rotation.z = 0.58;
      torsoGroup.add(strap);

      [-0.18, 0, 0.18].forEach(offset => {
        const pouch = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8), energyMat);
        pouch.rotation.z = Math.PI / 2;
        pouch.position.set(offset * 0.9, 0.28 - offset * 0.5, 0.26);
        torsoGroup.add(pouch);
      });
    } else if (accessoryType === 'holo_wings') {
      // Translucent Glowing Holographic Wings
      [-1, 1].forEach(side => {
        const wingGeo = new THREE.BoxGeometry(0.55, 0.25, 0.02);
        const wingMat = new THREE.MeshStandardMaterial({
          color: energyMat.color,
          emissive: energyMat.color,
          emissiveIntensity: 2.8,
          transparent: true,
          opacity: 0.85
        });
        const wing = new THREE.Mesh(wingGeo, wingMat);
        wing.position.set(side * 0.44, 0.40, -0.30);
        wing.rotation.set(0.15, side * 0.35, side * 0.42);
        torsoGroup.add(wing);
      });
    }
  }

  // Create stylized Spider-Ram Hero with custom suit colors, horns, and emblem
  createPixelSpiderMesh() {
    const pColor = this.customization.primaryColor || '#e11d48';
    const sColor = this.customization.secondaryColor || '#1d4ed8';
    const eColor = this.customization.energyColor || '#00f0ff';

    const primaryMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(pColor), roughness: 0.38 }); // Primary suit color
    const secondaryMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(sColor), roughness: 0.4 }); // Accent/vest color
    const fleeceMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 }); // Ram fleece wool
    const hoofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 }); // Dark ram hooves
    const eyeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(eColor),
      emissive: new THREE.Color(eColor),
      emissiveIntensity: 2.2
    });

    // Dynamic Emblem Texture for Chest
    const emblemTex = generateEmblemTexture(this.customization.symbol || 'sr', pColor, sColor, eColor);
    const emblemMat = new THREE.MeshBasicMaterial({
      map: emblemTex,
      transparent: true,
      depthWrite: false
    });

    // Root Group
    this.mesh.position.copy(this.position);

    // Torso (Upper Hero Vest, Lower Superhero Shorts)
    const torsoGroup = new THREE.Group();
    const chestGeo = new THREE.BoxGeometry(0.72, 0.58, 0.48);
    const chest = new THREE.Mesh(chestGeo, secondaryMat);
    chest.position.set(0, 0.28, 0);
    torsoGroup.add(chest);

    // Dynamic Emblem Badge on chest
    const srPlaneGeo = new THREE.PlaneGeometry(0.38, 0.38);
    const spBadge = new THREE.Mesh(srPlaneGeo, emblemMat);
    spBadge.position.set(0, 0.28, 0.245);
    torsoGroup.add(spBadge);

    const waistGeo = new THREE.BoxGeometry(0.62, 0.34, 0.44);
    const waist = new THREE.Mesh(waistGeo, primaryMat);
    waist.position.set(0, -0.14, 0);
    torsoGroup.add(waist);

    // Modular Back & Shoulder Accessory Attachment
    this.buildAccessory(torsoGroup, this.customization.accessory, primaryMat, secondaryMat, eyeMat);

    torsoGroup.position.set(0, 0, 0);
    this.mesh.add(torsoGroup);
    this.limbs.torso = torsoGroup;
    this.limbs.chest = chest;
    this.limbs.spBadge = spBadge;
    this.limbs.waist = waist;

    // Head with Sleek Superhero Mask
    const headGroup = new THREE.Group();
    const headGeo = new THREE.BoxGeometry(0.48, 0.46, 0.48);
    const head = new THREE.Mesh(headGeo, secondaryMat);
    headGroup.add(head);

    // Modular Headgear Attachment
    this.buildHeadgear(headGroup, this.customization.headgear, primaryMat, secondaryMat, eyeMat);

    // Standard eye lenses if not overridden by full visor headgear
    if (this.customization.headgear !== 'visor') {
      const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.05), eyeMat);
      leftEye.position.set(-0.13, 0.08, 0.25);
      leftEye.rotation.z = 0.22;
      headGroup.add(leftEye);

      const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.05), eyeMat);
      rightEye.position.set(0.13, 0.08, 0.25);
      rightEye.rotation.z = -0.22;
      headGroup.add(rightEye);
    }

    headGroup.position.set(0, 0.6, 0);
    torsoGroup.add(headGroup);
    this.limbs.head = headGroup;

    // Left Arm (Secondary upper arm sleeve, Fleece forearm & Dark Ram Hoof)
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.5, 0.38, 0);
    const lUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.22), secondaryMat);
    lUpperArm.position.set(0, -0.21, 0);
    const lForeArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.2), fleeceMat);
    lForeArm.position.set(0, -0.50, 0);
    const lHoof = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.18), hoofMat);
    lHoof.position.set(0, -0.68, 0);
    const leftHand = new THREE.Group();
    leftHand.position.set(0, -0.72, 0.05);

    leftArm.add(lUpperArm);
    leftArm.add(lForeArm);
    leftArm.add(lHoof);
    leftArm.add(leftHand);
    torsoGroup.add(leftArm);
    this.limbs.leftArm = leftArm;
    this.limbs.leftHand = leftHand;

    // Right Arm (Symmetrical)
    const rightArm = new THREE.Group();
    rightArm.position.set(0.5, 0.38, 0);
    const rUpperArm = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.42, 0.22), secondaryMat);
    rUpperArm.position.set(0, -0.21, 0);
    const rForeArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.32, 0.2), fleeceMat);
    rForeArm.position.set(0, -0.50, 0);
    const rHoof = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.16, 0.18), hoofMat);
    rHoof.position.set(0, -0.68, 0);
    const rightHand = new THREE.Group();
    rightHand.position.set(0, -0.72, 0.05);

    rightArm.add(rUpperArm);
    rightArm.add(rForeArm);
    rightArm.add(rHoof);
    rightArm.add(rightHand);
    torsoGroup.add(rightArm);
    this.limbs.rightArm = rightArm;
    this.limbs.rightHand = rightHand;

    // Left Leg (Primary thigh, Secondary boot with Hoof Sole)
    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.15, -0.31, 0);
    const lThigh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.34, 0.26), primaryMat);
    lThigh.position.set(0, -0.17, 0);
    const lBoot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.28), secondaryMat);
    lBoot.position.set(0, -0.46, 0);
    const lHoofSole = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.30), hoofMat);
    lHoofSole.position.set(0, -0.60, 0);
    leftLeg.add(lThigh);
    leftLeg.add(lBoot);
    leftLeg.add(lHoofSole);
    torsoGroup.add(leftLeg);
    this.limbs.leftLeg = leftLeg;

    // Right Leg (Primary thigh, Secondary boot with Hoof Sole)
    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.15, -0.31, 0);
    const rThigh = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.34, 0.26), primaryMat);
    rThigh.position.set(0, -0.17, 0);
    const rBoot = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.28), secondaryMat);
    rBoot.position.set(0, -0.46, 0);
    const rHoofSole = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.08, 0.30), hoofMat);
    rHoofSole.position.set(0, -0.60, 0);
    rightLeg.add(rThigh);
    rightLeg.add(rBoot);
    rightLeg.add(rHoofSole);
    torsoGroup.add(rightLeg);
    this.limbs.rightLeg = rightLeg;
  }

  // Create High-Tech Armored Iron-Ram Character Mesh with Custom Armor & Repulsor Ports
  createIronRamPlayerMesh() {
    const pColor = this.customization.primaryColor || '#991b1b';
    const sColor = this.customization.secondaryColor || '#f59e0b';
    const eColor = this.customization.energyColor || '#00f0ff';

    const ironPrimaryMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(pColor),
      roughness: 0.28,
      metalness: 0.8
    });
    const ironSecondaryMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(sColor),
      roughness: 0.2,
      metalness: 0.9
    });
    const arcCoreMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(eColor),
      emissive: new THREE.Color(eColor),
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
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.60, 0.52), ironPrimaryMat);
    chest.position.set(0, 0.28, 0);
    torsoGroup.add(chest);

    // Chest Symbol: 3D Arc Reactor Cylinder or 2D Dynamic Emblem Badge
    let arcCore;
    if (!this.customization.symbol || this.customization.symbol === 'arc') {
      const arcGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16);
      arcCore = new THREE.Mesh(arcGeo, arcCoreMat);
      arcCore.rotation.x = Math.PI / 2;
      arcCore.position.set(0, 0.32, 0.28);
      torsoGroup.add(arcCore);
    } else {
      const emblemTex = generateEmblemTexture(this.customization.symbol, pColor, sColor, eColor);
      const emblemMat = new THREE.MeshBasicMaterial({ map: emblemTex, transparent: true, depthWrite: false });
      arcCore = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.38), emblemMat);
      arcCore.position.set(0, 0.30, 0.27);
      torsoGroup.add(arcCore);
    }

    // Collar Plate
    const collar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.14, 0.54), ironSecondaryMat);
    collar.position.set(0, 0.52, 0);
    torsoGroup.add(collar);

    // Armored Waist
    const waist = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.34, 0.46), armorDarkMat);
    waist.position.set(0, -0.14, 0);
    torsoGroup.add(waist);

    // Modular Back & Shoulder Accessory
    this.buildAccessory(torsoGroup, this.customization.accessory, ironPrimaryMat, ironSecondaryMat, arcCoreMat);

    torsoGroup.position.set(0, 0, 0);
    this.mesh.add(torsoGroup);
    this.limbs.torso = torsoGroup;
    this.limbs.chest = chest;
    this.limbs.arcCore = arcCore;
    this.limbs.waist = waist;

    // Head Group with Face Mask Plate
    const headGroup = new THREE.Group();
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.50, 0.48, 0.50), ironPrimaryMat);
    headGroup.add(head);

    // Face Mask Plate
    const facePlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.36, 0.06), ironSecondaryMat);
    facePlate.position.set(0, -0.02, 0.26);
    headGroup.add(facePlate);

    // Modular Headgear
    this.buildHeadgear(headGroup, this.customization.headgear, ironPrimaryMat, ironSecondaryMat, arcCoreMat);

    // Glowing Visor Eyes (if not full cyclops visor)
    if (this.customization.headgear !== 'visor') {
      const eyeGeo = new THREE.BoxGeometry(0.12, 0.05, 0.05);
      const lEye = new THREE.Mesh(eyeGeo, arcCoreMat);
      lEye.position.set(-0.11, 0.06, 0.29);
      const rEye = new THREE.Mesh(eyeGeo, arcCoreMat);
      rEye.position.set(0.11, 0.06, 0.29);
      headGroup.add(lEye);
      headGroup.add(rEye);
    }

    headGroup.position.set(0, 0.6, 0);
    torsoGroup.add(headGroup);
    this.limbs.head = headGroup;

    // Left Arm with Palm Repulsor Node
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.52, 0.38, 0);
    const lArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.24), ironPrimaryMat);
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
    const rArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.68, 0.24), ironPrimaryMat);
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
    const lLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.65, 0.28), ironSecondaryMat);
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
    const rLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.65, 0.28), ironSecondaryMat);
    rLegMesh.position.set(0, -0.32, 0);
    const rThruster = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 8), arcCoreMat);
    rThruster.position.set(0, -0.64, 0);
    rightLeg.add(rLegMesh);
    rightLeg.add(rThruster);
    torsoGroup.add(rightLeg);
    this.limbs.rightLeg = rightLeg;
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
