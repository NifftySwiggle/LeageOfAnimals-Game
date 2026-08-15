import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { Shaders } from './Shaders.js';
import { Enemy, PickupDrop } from './Enemy.js';

export class VortexPortal {
  constructor(scene, position, zoneCenter, zoneRadius = 65, audioSystem = null) {
    this.scene = scene;
    this.position = position.clone();
    this.zoneCenter = zoneCenter ? zoneCenter.clone() : position.clone();
    this.zoneRadius = zoneRadius;
    this.audio = audioSystem;

    this.isActive = true;
    this.waveRemaining = 6;
    this.totalWave = 6;
    this.defeatedCount = 0;
    this.spawnTimer = 0.5;
    this.spawnInterval = 2.0;
    this.enemies = [];
    this.pickups = [];

    this.mesh = new THREE.Group();
    this.mesh.position.copy(this.position);

    // 1. Swirling Vortex Disk with Custom Shader
    this.portalMaterial = Shaders.createPortalMaterial();
    const diskGeo = new THREE.PlaneGeometry(12, 12);
    this.portalDisk = new THREE.Mesh(diskGeo, this.portalMaterial);
    this.mesh.add(this.portalDisk);

    // 2. Swirling Particle Ring
    this.createParticleRing();

    // 3. Glowing Threat Zone Perimeter Ring & Sky Waypoint Beacon Beam
    this.createPerimeterAndBeacon();

    this.scene.add(this.mesh);
    if (this.audio) this.audio.playVortexAlert();
  }

  createParticleRing() {
    const pCount = 120;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(pCount * 3);
    this.particleAngles = new Float32Array(pCount);
    this.particleRadii = new Float32Array(pCount);
    this.particleSpeeds = new Float32Array(pCount);

    for (let i = 0; i < pCount; i++) {
      this.particleAngles[i] = Math.random() * Math.PI * 2;
      this.particleRadii[i] = 3.5 + Math.random() * 3.5;
      this.particleSpeeds[i] = 1.5 + Math.random() * 2.5;

      pos[i * 3] = Math.cos(this.particleAngles[i]) * this.particleRadii[i];
      pos[i * 3 + 1] = Math.sin(this.particleAngles[i]) * this.particleRadii[i];
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.35,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    this.particles = new THREE.Points(geo, mat);
    this.mesh.add(this.particles);
  }

  // Glowing boundary ring & vertical beacon beam shooting into sky
  createPerimeterAndBeacon() {
    // 1. Vertical Waypoint Beam
    const beamGeo = new THREE.CylinderGeometry(1.2, 1.2, 350, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x9900ff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.beaconBeam = new THREE.Mesh(beamGeo, beamMat);
    this.beaconBeam.position.set(0, 175, 0);
    this.mesh.add(this.beaconBeam);

    // 2. Ground Zone Perimeter Ring
    const ringGeo = new THREE.RingGeometry(this.zoneRadius - 1.5, this.zoneRadius, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const zoneRing = new THREE.Mesh(ringGeo, ringMat);
    zoneRing.rotation.x = -Math.PI / 2;
    zoneRing.position.set(0, 0.4, 0);
    this.mesh.add(zoneRing);
  }

  // Spawn monster from rift ensuring it never spawns inside buildings
  spawnWaveEnemy(obstacles) {
    if (this.waveRemaining <= 0) return;

    const isBrute = this.waveRemaining % 3 === 0;
    const type = isBrute ? 'brute' : 'demon';

    const spawnOffset = new THREE.Vector3((Math.random() - 0.5) * 16, 0, (Math.random() - 0.5) * 16);
    const spawnPos = this.zoneCenter.clone().add(spawnOffset);
    spawnPos.y = 1.0;

    // Check against building obstacle colliders and push out of walls
    if (obstacles && obstacles.length > 0) {
      for (let i = 0; i < obstacles.length; i++) {
        const box = obstacles[i];
        if (
          spawnPos.x >= box.min.x - 2.0 &&
          spawnPos.x <= box.max.x + 2.0 &&
          spawnPos.z >= box.min.z - 2.0 &&
          spawnPos.z <= box.max.z + 2.0
        ) {
          // Push out towards the nearest boundary of the building into the street
          const distToMinX = Math.abs(spawnPos.x - box.min.x);
          const distToMaxX = Math.abs(spawnPos.x - box.max.x);
          const distToMinZ = Math.abs(spawnPos.z - box.min.z);
          const distToMaxZ = Math.abs(spawnPos.z - box.max.z);
          const minDist = Math.min(distToMinX, distToMaxX, distToMinZ, distToMaxZ);

          if (minDist === distToMinX) spawnPos.x = box.min.x - 3.5;
          else if (minDist === distToMaxX) spawnPos.x = box.max.x + 3.5;
          else if (minDist === distToMinZ) spawnPos.z = box.min.z - 3.5;
          else spawnPos.z = box.max.z + 3.5;
        }
      }
    }

    const enemy = new Enemy(this.scene, type, spawnPos, this.zoneCenter, this.zoneRadius, this.audio);
    this.enemies.push(enemy);

    this.waveRemaining--;
  }

  update(player, obstacles, time, dt) {
    if (!this.isActive) return;

    // Update Shader Uniforms
    this.portalMaterial.uniforms.uTime.value = time;
    this.portalDisk.rotation.z += dt * 0.5;

    // Pulse Waypoint Beam
    if (this.beaconBeam) {
      this.beaconBeam.rotation.y += dt * 0.8;
      this.beaconBeam.material.opacity = 0.35 + Math.sin(time * 3) * 0.15;
    }

    // Animate Swirling Particles
    if (this.particles) {
      const pos = this.particles.geometry.attributes.position.array;
      for (let i = 0; i < this.particleAngles.length; i++) {
        this.particleAngles[i] += this.particleSpeeds[i] * dt;
        this.particleRadii[i] -= dt * 1.2;

        if (this.particleRadii[i] < 0.5) {
          this.particleRadii[i] = 5.5 + Math.random() * 2.0;
        }

        pos[i * 3] = Math.cos(this.particleAngles[i]) * this.particleRadii[i];
        pos[i * 3 + 1] = Math.sin(this.particleAngles[i]) * this.particleRadii[i];
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Spawning Logic
    if (this.waveRemaining > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.spawnWaveEnemy(obstacles);
        this.spawnTimer = this.spawnInterval;
      }
    }

    // Update Active Enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(player, obstacles, dt);

      // Check player melee attack collision
      if (player.isAttacking && enemy.isAlive) {
        const attackDist = player.attackState === 'swingKick' || player.attackState === 'airKick' ? 3.8 : 2.8;
        if (player.position.distanceTo(enemy.position) < attackDist) {
          const dmg = player.attackState === 'swingKick' ? 75 : (player.attackState === 'punch3' ? 55 : 35);
          const knockback = enemy.position.clone().sub(player.position).normalize();
          enemy.takeDamage(dmg, knockback);

          // Spawn guaranteed drop on death
          if (!enemy.isAlive) {
            this.defeatedCount++;
            const types = ['health', 'fluid', 'core'];
            const drop1 = types[Math.floor(Math.random() * types.length)];
            this.pickups.push(new PickupDrop(this.scene, enemy.position, drop1, this.audio));

            if (Math.random() > 0.35) {
              const drop2 = (drop1 === 'health') ? 'fluid' : 'health';
              this.pickups.push(new PickupDrop(this.scene, enemy.position, drop2, this.audio));
            }
          }
        }
      }

      if (!enemy.isAlive) {
        this.enemies.splice(i, 1);
      }
    }

    // Update Drops
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const drop = this.pickups[i];
      drop.update(player, dt);
      if (drop.isCollected) {
        this.pickups.splice(i, 1);
      }
    }

    // Collapse portal when entire wave is defeated
    if (this.waveRemaining === 0 && this.enemies.length === 0) {
      this.close();
    }
  }

  close() {
    this.isActive = false;
    this.scene.remove(this.mesh);
    if (this.audio) this.audio.playPickup();
  }
}

// Portal & Procedural Mission System Manager - Endless Dynamic Incursions
export class PortalManager {
  constructor(scene, audioSystem) {
    this.scene = scene;
    this.audio = audioSystem;
    this.portals = [];
    this.zoneCount = 1;
    this.currentZoneTitle = 'Zone #1: Harbor Crime Syndicate Incursion';
    this.currentZoneCenter = new THREE.Vector3(-220, 2, -180);
    this.zoneRadius = 65;

    // Mission names generator
    this.missionPrefixes = [
      'Midtown Rooftop Syndicate',
      'Downtown Alleyway Strike Force',
      'Central Plaza Threat Outpost',
      'Financial District Gangsters',
      'Skyscraper Terrace Incursion',
      'Industrial Depot Crime Ring',
      'Avenue Crossroads Ambush Squad'
    ];

    // Initialize first mission
    this.spawnNewMissionZone(this.currentZoneCenter, this.currentZoneTitle);
  }

  spawnNewMissionZone(centerPos, title) {
    this.currentZoneCenter = centerPos.clone();
    this.currentZoneTitle = title || `Zone #${this.zoneCount}: ${this.missionPrefixes[(this.zoneCount - 1) % this.missionPrefixes.length]}`;

    // Create new portal at target zone
    const portalY = centerPos.y + 14.0;
    const portalPos = new THREE.Vector3(centerPos.x, portalY, centerPos.z);
    this.missionPortal = new VortexPortal(this.scene, portalPos, this.currentZoneCenter, this.zoneRadius, this.audio);
    this.portals.push(this.missionPortal);
  }

  getAllEnemies() {
    const list = [];
    for (let i = 0; i < this.portals.length; i++) {
      list.push(...this.portals[i].enemies);
    }
    return list;
  }

  getMissionProgress() {
    if (!this.missionPortal) {
      return {
        defeated: 6,
        total: 6,
        isComplete: true,
        zoneTitle: this.currentZoneTitle,
        zoneCenter: this.currentZoneCenter
      };
    }
    return {
      defeated: this.missionPortal.defeatedCount,
      total: this.missionPortal.totalWave,
      isComplete: !this.missionPortal.isActive,
      zoneTitle: this.currentZoneTitle,
      zoneCenter: this.currentZoneCenter
    };
  }

  update(player, obstacles, time, dt) {
    for (let i = this.portals.length - 1; i >= 0; i--) {
      const p = this.portals[i];
      p.update(player, obstacles, time, dt);
      if (!p.isActive) {
        this.portals.splice(i, 1);

        // When current mission zone is cleared, automatically generate a new random crime hotspot!
        if (p === this.missionPortal) {
          this.zoneCount++;
          // Pick a new random spot in the metropolis (between -450 and 450)
          const rx = (Math.random() - 0.5) * 800;
          const rz = (Math.random() - 0.5) * 800;
          const newPos = new THREE.Vector3(rx, 2, rz);
          const nextTitle = `Zone #${this.zoneCount}: ${this.missionPrefixes[(this.zoneCount - 1) % this.missionPrefixes.length]}`;

          // Spawn next zone after a brief interval
          setTimeout(() => {
            this.spawnNewMissionZone(newPos, nextTitle);
          }, 1200);
        }
      }
    }
  }
}
