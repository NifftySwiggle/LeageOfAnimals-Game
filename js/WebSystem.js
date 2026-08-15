import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class WebSystem {
  constructor(scene, audioSystem) {
    this.scene = scene;
    this.audio = audioSystem;

    // 1. Volumetric 3D Glowing Web Strand Mesh (Visible from ALL camera angles & distances!)
    const strandGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.0, 8, 1, true);
    // Move pivot to center
    strandGeo.translate(0, 0.5, 0);
    strandGeo.rotateX(Math.PI / 2);

    const strandMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });

    this.webMesh = new THREE.Mesh(strandGeo, strandMat);
    this.webMesh.visible = false;
    this.webMesh.renderOrder = 999;
    this.scene.add(this.webMesh);

    // Glowing Inner Core
    const coreGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.0, 6, 1, true);
    coreGeo.translate(0, 0.5, 0);
    coreGeo.rotateX(Math.PI / 2);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });
    this.webCore = new THREE.Mesh(coreGeo, coreMat);
    this.webMesh.add(this.webCore);

    // 2. Distinct Web Attached Anchor Ring Decal (Stuck on the building surface!)
    const anchorRingGeo = new THREE.RingGeometry(0.25, 1.35, 16);
    const anchorRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      depthWrite: false
    });
    this.anchorRing = new THREE.Mesh(anchorRingGeo, anchorRingMat);
    this.anchorRing.visible = false;
    this.anchorRing.renderOrder = 998;
    this.scene.add(this.anchorRing);

    // Inner Web Hub
    const hubGeo = new THREE.CircleGeometry(0.35, 12);
    const hubMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    this.anchorHub = new THREE.Mesh(hubGeo, hubMat);
    this.anchorHub.position.z = 0.02;
    this.anchorRing.add(this.anchorHub);

    // 3. Prospective Aiming Reticle (Shows before shooting)
    const reticleGeo = new THREE.RingGeometry(0.5, 0.75, 8);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0xff0055,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    this.reticle = new THREE.Mesh(reticleGeo, reticleMat);
    this.reticle.visible = false;
    this.scene.add(this.reticle);

    // Active Web Projectiles
    this.projectiles = [];
    this.projectileGeo = new THREE.SphereGeometry(0.35, 8, 8);
    this.projectileMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Temp vectors for allocation-free updates
    this._handWorldPos = new THREE.Vector3();
    this._tempV = new THREE.Vector3();
  }

  // True Crosshair Raycast Targeting: Attaches to building surfaces AND dynamic moving vehicles in front!
  findBestAnchor(originPos, lookDir, buildingColliders, trafficCars = [], maxDist = 95.0, playerPos = null) {
    // Start ray from character center if provided, so clipping camera never hits the building behind
    const rayStart = playerPos ? playerPos.clone().add(new THREE.Vector3(0, 1.4, 0)) : originPos;
    const ray = new THREE.Ray(rayStart, lookDir);
    const hitPoint = new THREE.Vector3();
    let closestHit = null;
    let closestDist = maxDist;
    let hitCar = null;

    // 1. Test intersection against all building AABB colliders in FRONT of player
    for (let i = 0; i < buildingColliders.length; i++) {
      const box = buildingColliders[i];
      if (ray.intersectBox(box, hitPoint)) {
        const dist = rayStart.distanceTo(hitPoint);
        // Only accept hits in front of player
        if (dist > 1.2 && dist < closestDist) {
          closestDist = dist;
          closestHit = hitPoint.clone();
          hitCar = null;
        }
      }
    }

    // 2. Test intersection against dynamic traffic cars!
    for (let i = 0; i < trafficCars.length; i++) {
      const car = trafficCars[i];
      if (car.box && ray.intersectBox(car.box, hitPoint)) {
        const dist = rayStart.distanceTo(hitPoint);
        if (dist > 1.2 && dist < closestDist) {
          closestDist = dist;
          closestHit = hitPoint.clone();
          hitCar = car;
        }
      }
    }

    // Returns exact surface point and car reference if hit, or null if aiming at empty sky
    if (closestHit) {
      return { point: closestHit, car: hitCar };
    }
    return null;
  }

  // Update prospective anchor reticle and UI crosshair
  updateReticle(originPos, lookDir, buildingColliders, trafficCars = [], playerPos = null) {
    const target = this.findBestAnchor(originPos, lookDir, buildingColliders, trafficCars, 95.0, playerPos);
    const crosshair = document.getElementById('crosshair');

    if (target && target.point) {
      this.reticle.visible = true;
      this.reticle.position.copy(target.point);
      this.reticle.lookAt(originPos);

      // Color reticle cyan for buildings, bright yellow for cars
      this.reticle.material.color.setHex(target.car ? 0xffea00 : 0x00f0ff);

      if (crosshair) crosshair.classList.add('locked');
    } else {
      this.reticle.visible = false;
      if (crosshair) crosshair.classList.remove('locked');
    }
  }

  // Attach Web Line to exact targeted surface point or moving vehicle
  attachWeb(player, target) {
    // If aiming at empty sky or out of range, web does NOT stick to anything!
    if (!target || !target.point) {
      if (this.audio) this.audio.playWebShoot();
      return false;
    }

    // Alternates opposite arm shooting the next web line (one hand after the other!)
    player.switchWebHand();

    player.isSwinging = true;
    player.attachedCar = target.car || null;
    player.swingAnchor = target.point.clone();
    player.swingRopeLength = player.position.distanceTo(target.point);

    // If attached to a moving car, apply dynamic vehicle tow slingshot!
    if (player.attachedCar) {
      player.attachedCar.isWebbed = true;
      player.attachedCar.webTimer = 4.5;
      const carSpeed = player.attachedCar.speed;
      const carDir = new THREE.Vector3(
        player.attachedCar.isHorizontal ? Math.sign(carSpeed) : 0,
        0,
        player.attachedCar.isHorizontal ? 0 : Math.sign(carSpeed)
      );
      player.velocity.addScaledVector(carDir, 22.0);
      player.velocity.y = Math.max(player.velocity.y, 6.0);
    } else {
      // Strong Athletic Initial Upward Web Pull & Swing Hoist
      const toAnchor = target.point.clone().sub(player.position).normalize();
      player.velocity.addScaledVector(toAnchor, 18.0);
      player.velocity.y = Math.max(player.velocity.y + 10.0, 14.0);
    }

    // Show distinct attached anchor circle decal on the wall/car
    this.anchorRing.visible = true;
    this.anchorRing.position.copy(target.point);
    this.anchorRing.lookAt(player.position);

    this.webMesh.visible = true;
    player.canDoubleJump = true; // Every web connection replenishes airborne jump/flip!
    if (this.audio) {
      this.audio.playWebShoot();
      this.audio.playWebAttach();
    }
    return true;
  }

  // Release Web Line with momentum slingshot catapult
  releaseWeb(player, input) {
    if (!player.isSwinging) return;

    player.isSwinging = false;
    player.attachedCar = null;
    player.swingAnchor = null;
    player.canDoubleJump = true; // Every web release replenishes jump/flip!
    this.webMesh.visible = false;
    this.anchorRing.visible = false;

    // Catapult Slingshot velocity boost
    const forward = player.getForwardVector();
    player.velocity.addScaledVector(forward, 10.0);
    player.velocity.y = Math.max(6.0, Math.min(22.0, player.velocity.y * 1.2 + 5.0));
    player.velocity.x *= 1.15;
    player.velocity.z *= 1.15;

    if (this.audio) this.audio.playJump();
  }

  // Shoot Web Projectile (Stuns enemies in web cocoons or traps cars!)
  shootWebProjectile(player, lookDir) {
    if (!player.consumeWebFluid(15)) return;

    const projectile = new THREE.Mesh(this.projectileGeo, this.projectileMat);
    const handPos = player.getHandWorldPosition(this._handWorldPos);
    projectile.position.copy(handPos);
    const vel = lookDir.clone().normalize().multiplyScalar(65.0);

    this.scene.add(projectile);
    this.projectiles.push({
      mesh: projectile,
      velocity: vel,
      life: 1.8
    });

    if (this.audio) this.audio.playWebShoot();
  }

  // Update Web Line Rendering, Anchor Impact Ring, Projectiles, Vehicles & Collisions
  update(player, enemies, dt, trafficCars = []) {
    // 1. Render Active Web Mesh directly from Spider-Ram's hand to anchor point (or attached car)
    if (player.isSwinging && player.swingAnchor) {
      // If web is attached to a moving car, anchor follows the car dynamically!
      if (player.attachedCar && player.attachedCar.mesh) {
        player.swingAnchor.copy(player.attachedCar.mesh.position).add(new THREE.Vector3(0, 1.2, 0));

        // Tow pull force towards and along the car
        const toCar = player.swingAnchor.clone().sub(player.position);
        const carDist = toCar.length();
        if (carDist > 3.0) {
          player.velocity.addScaledVector(toCar.normalize(), 28.0 * dt);
        }
      }

      this.webMesh.visible = true;
      this.anchorRing.visible = true;

      // Exact world position of player's right hand / web-shooter
      const handPos = player.getHandWorldPosition(this._handWorldPos);
      const anchorPos = player.swingAnchor;
      const distance = handPos.distanceTo(anchorPos);

      // Position web cylinder at hand, point at anchor, scale to distance
      this.webMesh.position.copy(handPos);
      this.webMesh.lookAt(anchorPos);
      this.webMesh.scale.set(1, 1, distance);

      // Update anchor ring position & orientation towards player
      this.anchorRing.position.copy(anchorPos);
      this.anchorRing.lookAt(handPos);

      // Pulsing anchor energy ring
      const pulse = 1.0 + Math.sin(performance.now() * 0.01) * 0.15;
      this.anchorRing.scale.set(pulse, pulse, pulse);
    } else {
      this.webMesh.visible = false;
      this.anchorRing.visible = false;
    }

    // 2. Update Web Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.mesh.position.addScaledVector(proj.velocity, dt);
      proj.life -= dt;

      let hit = false;
      // Check collision against enemies
      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        if (enemy.isAlive && proj.mesh.position.distanceTo(enemy.position) < 2.0) {
          enemy.applyWebStun(4.5); // Stun for 4.5 seconds
          if (this.audio) this.audio.playEnemyStun();
          hit = true;
          break;
        }
      }

      // Check collision against traffic cars (webs & slows down car!)
      if (!hit && trafficCars) {
        for (let k = 0; k < trafficCars.length; k++) {
          const car = trafficCars[k];
          if (car.box && car.box.containsPoint(proj.mesh.position)) {
            car.isWebbed = true;
            car.webTimer = 5.0;
            if (this.audio) this.audio.playEnemyStun();
            hit = true;
            break;
          }
        }
      }

      if (hit || proj.life <= 0) {
        this.scene.remove(proj.mesh);
        this.projectiles.splice(i, 1);
      }
    }
  }
}
