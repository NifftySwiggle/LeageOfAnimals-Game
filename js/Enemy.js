import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { Shaders } from './Shaders.js';

export class Enemy {
  constructor(scene, type = 'demon', spawnPos, zoneCenter = null, zoneRadius = 65, audioSystem = null) {
    this.scene = scene;
    this.type = type; // 'demon' or 'brute'
    this.audio = audioSystem;

    this.position = spawnPos.clone();
    this.velocity = new THREE.Vector3();
    this.isAlive = true;
    this.isStunned = false;
    this.stunTimer = 0;
    this.isGrounded = false;

    // Strict Zone Boundary Containment
    this.zoneCenter = zoneCenter ? zoneCenter.clone() : spawnPos.clone();
    this.zoneRadius = zoneRadius;

    // Stats by Type
    if (this.type === 'brute') {
      this.maxHealth = 160;
      this.health = 160;
      this.speed = 7.5;
      this.attackRange = 3.2;
      this.damage = 22;
      this.attackCooldown = 2.4;
    } else {
      // Default: Vortex Demon
      this.maxHealth = 75;
      this.health = 75;
      this.speed = 11.5;
      this.attackRange = 2.4;
      this.damage = 14;
      this.attackCooldown = 1.6;
    }

    this.currentCooldown = Math.random() * 1.5;
    this.mesh = new THREE.Group();
    this.limbs = {};
    this.animTime = Math.random() * 10;
    this.flashTimer = 0;

    this.createMonsterMesh();
    this.createCocoonMesh();
    this.scene.add(this.mesh);
  }

  // Build Stylized High-Quality Grounded Pixel Voxel Monsters
  createMonsterMesh() {
    this.mesh.position.copy(this.position);

    if (this.type === 'brute') {
      // --- VORTEX BEHEMOTH (BRUTE) ---
      const armorMat = new THREE.MeshStandardMaterial({ color: 0x1a0f2e, roughness: 0.4, metalness: 0.5 });
      const skinMat = new THREE.MeshStandardMaterial({ color: 0x2d124d, roughness: 0.6 });
      const glowMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, emissiveIntensity: 2.2 });
      const hornMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 1.8 });

      // Torso & Heavy Plate
      const chest = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.0, 1.6), armorMat);
      chest.position.y = 2.2;
      this.mesh.add(chest);

      const coreGlow = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.2), glowMat);
      coreGlow.position.set(0, 2.2, 0.82);
      this.mesh.add(coreGlow);

      // Head with Visor
      const head = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), armorMat);
      head.position.set(0, 3.6, 0.2);
      this.mesh.add(head);

      const visor = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.22, 0.2), glowMat);
      visor.position.set(0, 3.6, 0.76);
      this.mesh.add(visor);

      // Spiked Pauldrons
      const lPauldron = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 1.2), hornMat);
      lPauldron.position.set(-1.6, 3.1, 0);
      const rPauldron = lPauldron.clone();
      rPauldron.position.set(1.6, 3.1, 0);
      this.mesh.add(lPauldron);
      this.mesh.add(rPauldron);

      // Heavy Arms
      const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 0.7), skinMat);
      lArm.position.set(-1.5, 1.8, 0);
      const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 0.7), skinMat);
      rArm.position.set(1.5, 1.8, 0);
      this.mesh.add(lArm);
      this.mesh.add(rArm);
      this.limbs.lArm = lArm;
      this.limbs.rArm = rArm;

      // Heavy Legs
      const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.8), armorMat);
      lLeg.position.set(-0.7, 0.8, 0);
      const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.6, 0.8), armorMat);
      rLeg.position.set(0.7, 0.8, 0);
      this.mesh.add(lLeg);
      this.mesh.add(rLeg);
      this.limbs.lLeg = lLeg;
      this.limbs.rLeg = rLeg;

    } else {
      // --- VORTEX VOID DEMON (STALKER) ---
      const demonSkin = new THREE.MeshStandardMaterial({ color: 0x14052b, roughness: 0.3 });
      const demonArmor = new THREE.MeshStandardMaterial({ color: 0x4a0e78, roughness: 0.4, metalness: 0.4 });
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 2.5 });
      const runeMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, emissiveIntensity: 2.0 });

      // Torso
      const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 0.8), demonSkin);
      torso.position.y = 1.7;
      this.mesh.add(torso);

      const rune = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.6, 0.1), runeMat);
      rune.position.set(0, 1.7, 0.42);
      this.mesh.add(rune);

      // Horned Head
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), demonSkin);
      head.position.set(0, 2.7, 0);
      this.mesh.add(head);

      const eyes = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.15, 0.1), eyeMat);
      eyes.position.set(0, 2.75, 0.42);
      this.mesh.add(eyes);

      // Horns
      const lHorn = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.6, 0.18), demonArmor);
      lHorn.position.set(-0.35, 3.2, 0);
      lHorn.rotation.z = -0.3;
      const rHorn = lHorn.clone();
      rHorn.position.set(0.35, 3.2, 0);
      rHorn.rotation.z = 0.3;
      this.mesh.add(lHorn);
      this.mesh.add(rHorn);

      // Claw Arms
      const lArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), demonSkin);
      lArm.position.set(-0.9, 1.6, 0);
      const rArm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.4), demonSkin);
      rArm.position.set(0.9, 1.6, 0);
      this.mesh.add(lArm);
      this.mesh.add(rArm);
      this.limbs.lArm = lArm;
      this.limbs.rArm = rArm;

      // Legs
      const lLeg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.2, 0.45), demonArmor);
      lLeg.position.set(-0.4, 0.6, 0);
      const rLeg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.2, 0.45), demonArmor);
      rLeg.position.set(0.4, 0.6, 0);
      this.mesh.add(lLeg);
      this.mesh.add(rLeg);
      this.limbs.lLeg = lLeg;
      this.limbs.rLeg = rLeg;
    }
  }

  // Web Stun Cocoon Mesh overlay
  createCocoonMesh() {
    this.cocoonMat = Shaders.createWebCocoonMaterial();
    const cocoonGeo = new THREE.SphereGeometry(this.type === 'brute' ? 2.8 : 1.8, 8, 8);
    this.cocoon = new THREE.Mesh(cocoonGeo, this.cocoonMat);
    this.cocoon.position.y = this.type === 'brute' ? 2.5 : 1.2;
    this.cocoon.visible = false;
    this.mesh.add(this.cocoon);
  }

  // Apply Web Stun
  applyWebStun(duration) {
    this.isStunned = true;
    this.stunTimer = duration;
    this.cocoon.visible = true;
    this.velocity.set(0, 0, 0);
  }

  // Take Damage & Knockback
  takeDamage(amount, knockbackDir = null) {
    this.health -= amount;
    this.flashTimer = 0.15;

    if (knockbackDir) {
      this.velocity.copy(knockbackDir).multiplyScalar(this.type === 'brute' ? 8.0 : 18.0);
      this.velocity.y = 8.0;
    }

    if (this.health <= 0) {
      this.die();
    }
  }

  die() {
    this.isAlive = false;
    this.audio.playEnemyDeath();
    this.scene.remove(this.mesh);
  }

  // Update AI behavior & strict zone containment
  update(player, obstacles, dt) {
    if (!this.isAlive) return;

    this.animTime += dt;

    // Flashing when hit
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
    }

    // Web Stun state
    if (this.isStunned) {
      this.stunTimer -= dt;
      this.cocoonMat.uniforms.uTime.value = this.animTime;
      if (this.stunTimer <= 0) {
        this.isStunned = false;
        this.cocoon.visible = false;
      }
      this.mesh.position.copy(this.position);
      return;
    }

    // Distance to player and zone center
    const toPlayer = player.position.clone().sub(this.position);
    const distToPlayer = toPlayer.length();
    const distToZoneCenter = Math.hypot(this.position.x - this.zoneCenter.x, this.position.z - this.zoneCenter.z);

    // Look at player if in range, otherwise look at zone center
    if (distToPlayer > 0.5) {
      this.mesh.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);
    }

    if (this.currentCooldown > 0) this.currentCooldown -= dt;

    // --- GROUND AI MOVEMENT ---
    let targetMoveDir = new THREE.Vector3();

    // If enemy reaches perimeter of the zone, force them back toward zone center
    if (distToZoneCenter > this.zoneRadius) {
      targetMoveDir.set(this.zoneCenter.x - this.position.x, 0, this.zoneCenter.z - this.position.z).normalize();
    } else if (distToPlayer < 75.0 && distToPlayer > this.attackRange) {
      // Chase player within the zone
      targetMoveDir.copy(toPlayer).setY(0).normalize();
    } else if (distToPlayer <= this.attackRange) {
      // Melee Attack Player
      this.velocity.x *= 0.5;
      this.velocity.z *= 0.5;

      if (this.currentCooldown <= 0) {
        const knockback = toPlayer.clone().setY(0).normalize().negate();
        player.takeDamage(this.damage, knockback);
        this.currentCooldown = this.attackCooldown;
        if (this.audio) this.audio.playPunch(2);

        // Attack arm slash animation
        if (this.limbs.rArm) {
          this.limbs.rArm.rotation.x = -Math.PI / 2.0;
        }
      }
    } else {
      // Idle patrol around zone center
      targetMoveDir.set(Math.sin(this.animTime * 0.5), 0, Math.cos(this.animTime * 0.5));
    }

    if (targetMoveDir.lengthSq() > 0) {
      this.velocity.x = targetMoveDir.x * this.speed;
      this.velocity.z = targetMoveDir.z * this.speed;

      // Animate limb walk cycles
      const walkCycle = Math.sin(this.animTime * 10);
      if (this.limbs.lLeg && this.limbs.rLeg) {
        this.limbs.lLeg.rotation.x = walkCycle * 0.5;
        this.limbs.rLeg.rotation.x = -walkCycle * 0.5;
      }
      if (this.limbs.lArm && this.limbs.rArm && this.currentCooldown > 0.4) {
        this.limbs.lArm.rotation.x = -walkCycle * 0.5;
        this.limbs.rArm.rotation.x = walkCycle * 0.5;
      }
    }

    // Apply gravity
    this.velocity.y -= 35.0 * dt;
    this.position.addScaledVector(this.velocity, dt);

    // Hard zone boundary clamp
    const currentDist = Math.hypot(this.position.x - this.zoneCenter.x, this.position.z - this.zoneCenter.z);
    if (currentDist > this.zoneRadius) {
      const angle = Math.atan2(this.position.z - this.zoneCenter.z, this.position.x - this.zoneCenter.x);
      this.position.x = this.zoneCenter.x + Math.cos(angle) * this.zoneRadius;
      this.position.z = this.zoneCenter.z + Math.sin(angle) * this.zoneRadius;
      this.velocity.x = 0;
      this.velocity.z = 0;
    }

    // Floor contact clamp
    if (this.position.y <= 0) {
      this.position.y = 0;
      this.velocity.y = 0;
    }

    // Resolve collision against building obstacles (Enemies cannot walk through buildings!)
    if (obstacles && obstacles.length > 0) {
      const eRadius = this.type === 'brute' ? 1.4 : 0.8;
      const minX = this.position.x - 14.0;
      const maxX = this.position.x + 14.0;
      const minZ = this.position.z - 14.0;
      const maxZ = this.position.z + 14.0;

      for (let i = 0; i < obstacles.length; i++) {
        const box = obstacles[i];
        if (box.max.x < minX || box.min.x > maxX || box.max.z < minZ || box.min.z > maxZ) continue;

        if (this.position.y < box.max.y && this.position.y + 2.5 > box.min.y) {
          if (
            this.position.x + eRadius > box.min.x &&
            this.position.x - eRadius < box.max.x &&
            this.position.z + eRadius > box.min.z &&
            this.position.z - eRadius < box.max.z
          ) {
            const overlapLeft = (this.position.x + eRadius) - box.min.x;
            const overlapRight = box.max.x - (this.position.x - eRadius);
            const overlapFront = (this.position.z + eRadius) - box.min.z;
            const overlapBack = box.max.z - (this.position.z - eRadius);

            const minOverlap = Math.min(overlapLeft, overlapRight, overlapFront, overlapBack);
            if (minOverlap === overlapLeft) {
              this.position.x = box.min.x - eRadius;
              this.velocity.x = 0;
            } else if (minOverlap === overlapRight) {
              this.position.x = box.max.x + eRadius;
              this.velocity.x = 0;
            } else if (minOverlap === overlapFront) {
              this.position.z = box.min.z - eRadius;
              this.velocity.z = 0;
            } else if (minOverlap === overlapBack) {
              this.position.z = box.max.z + eRadius;
              this.velocity.z = 0;
            }
          }
        }
      }
    }

    this.mesh.position.copy(this.position);
  }
}

// Glowing Magnetic Pickup Drops (Health Nano-Orb / Web Fluid Cell / Incursion Shard)
export class PickupDrop {
  constructor(scene, pos, type = 'health', audioSystem) {
    this.scene = scene;
    this.type = type; // 'health', 'fluid', 'core'
    this.audio = audioSystem;
    this.position = pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.8, (Math.random() - 0.5) * 1.2));
    this.isCollected = false;
    this.animTime = Math.random() * 5;
    this.velocity = new THREE.Vector3((Math.random() - 0.5) * 2, 4 + Math.random() * 3, (Math.random() - 0.5) * 2);

    this.group = new THREE.Group();
    this.group.position.copy(this.position);

    let color = 0x00ff66;
    if (type === 'fluid') color = 0x00f0ff;
    if (type === 'core') color = 0xffb703;

    // Central Floating Crystal Gem
    const geo = (type === 'core') ? new THREE.IcosahedronGeometry(0.42, 0) : new THREE.OctahedronGeometry(0.48, 0);
    const mat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 2.5,
      roughness: 0.1,
      metalness: 0.8
    });
    this.gem = new THREE.Mesh(geo, mat);
    this.group.add(this.gem);

    // Outer Orbiting Energy Ring
    const ringGeo = new THREE.TorusGeometry(0.62, 0.04, 6, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
    this.ring = new THREE.Mesh(ringGeo, ringMat);
    this.group.add(this.ring);

    this.scene.add(this.group);
  }

  update(player, dt) {
    if (this.isCollected || !player) return;

    this.animTime += dt;

    // Initial scatter arc physics
    if (this.velocity.lengthSq() > 0.1) {
      this.position.addScaledVector(this.velocity, dt);
      this.velocity.y -= 9.8 * dt;
      this.velocity.multiplyScalar(Math.pow(0.85, dt * 60));
      if (this.position.y < 0.6) {
        this.position.y = 0.6;
        this.velocity.set(0, 0, 0);
      }
    }

    // Floating idle oscillation
    this.gem.rotation.y += dt * 3.2;
    this.gem.rotation.x += dt * 1.8;
    this.ring.rotation.x += dt * 2.5;
    this.ring.rotation.y += dt * 2.0;

    const hoverY = this.position.y + Math.sin(this.animTime * 4.5) * 0.22;
    this.group.position.set(this.position.x, hoverY, this.position.z);

    const playerTarget = player.position.clone().add(new THREE.Vector3(0, 1.2, 0));
    const dist = this.group.position.distanceTo(playerTarget);

    // Magnetic Vacuum Attraction (Loot gets pulled into Spider-Ram from 8.5m away!)
    if (dist < 8.5) {
      const pullSpeed = Math.min(28.0, 14.0 + (8.5 - dist) * 3.5);
      const pullDir = playerTarget.clone().sub(this.group.position).normalize();
      this.position.addScaledVector(pullDir, pullSpeed * dt);
    }

    // Collection Trigger
    if (dist < 2.6) {
      this.isCollected = true;

      if (this.type === 'health') {
        if (typeof player.heal === 'function') player.heal(40);
        else player.health = Math.min(player.maxHealth, player.health + 40);
      } else if (this.type === 'fluid') {
        if (typeof player.refillWebFluid === 'function') player.refillWebFluid(50);
        else player.webFluid = Math.min(player.maxWebFluid, player.webFluid + 50);
      } else {
        if (typeof player.heal === 'function') player.heal(25);
        if (typeof player.refillWebFluid === 'function') player.refillWebFluid(30);
      }

      if (this.audio && typeof this.audio.playPickup === 'function') {
        this.audio.playPickup();
      }

      this.scene.remove(this.group);
    }
  }
}
