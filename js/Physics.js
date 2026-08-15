import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class Physics {
  constructor() {
    this.gravity = -34.0; // Snappy comic-book gravity
    this.airResistance = 0.985;
    this.groundFriction = 0.82;
    this.wallFriction = 0.90;
    this.maxVelocity = 55.0; // Balanced superhero velocity
    this.terminalFallVelocity = -55.0;

    // Scratch vector math helpers
    this._tempV1 = new THREE.Vector3();
    this._tempV2 = new THREE.Vector3();
    this._tempV3 = new THREE.Vector3();
  }

  // Update web swing constraint physics - Natural Pendulum Arc (Clamped to Anchor Height)
  applyWebSwingPhysics(player, anchorPoint, restLength, scrollDelta, dt) {
    if (!anchorPoint) return;

    const toAnchor = this._tempV1.copy(anchorPoint).sub(player.position);
    const currentDist = toAnchor.length();

    if (currentDist > 0.001) {
      const webDir = this._tempV2.copy(toAnchor).normalize();
      const heightDifference = anchorPoint.y - player.position.y;

      // 1. Mouse Scroll Wheel Reel-In (Only reel in if still below anchor)
      if (scrollDelta !== 0) {
        if (scrollDelta < 0 && heightDifference > 2.0) {
          player.swingRopeLength = Math.max(6.0, player.swingRopeLength - 12.0 * dt * 10.0);
        } else if (scrollDelta > 0) {
          player.swingRopeLength = Math.min(60.0, player.swingRopeLength + 12.0 * dt * 10.0);
        }
      }

      // 2. Controlled Upward Web Reel-In (Pulls up smoothly towards anchor)
      if (heightDifference > 0.5) {
        const heightRatio = Math.min(1.0, heightDifference / 16.0);
        const reelInSpeed = 16.0 * heightRatio;
        player.swingRopeLength = Math.max(5.0, player.swingRopeLength - reelInSpeed * dt);

        // 3. Upward Lift Force (Strong athletic upward pull)
        const liftForce = 26.0 * heightRatio;
        player.velocity.addScaledVector(webDir, liftForce * dt);
        player.velocity.y += 16.0 * heightRatio * dt;
      }

      const targetLength = player.swingRopeLength;

      // 4. Tension constraint & Tangential Redirection into forward speed
      if (currentDist >= targetLength) {
        // Positional correction
        const excess = currentDist - targetLength;
        player.position.addScaledVector(webDir, excess * 0.95);

        // Convert downward drop into smooth forward momentum and upward boost
        const radialVel = player.velocity.dot(webDir);
        if (radialVel < 0) {
          player.velocity.addScaledVector(webDir, -radialVel * 1.15);

          // Centripetal acceleration & upward swing arc lift
          const tangentialSpeed = player.velocity.length();
          const centripetal = Math.min(48.0, (tangentialSpeed * tangentialSpeed) / Math.max(targetLength, 5.0));
          player.velocity.addScaledVector(webDir, centripetal * dt * 0.45);
          player.velocity.y += 5.0 * dt; // Extra pull-up boost during swing arc
        }

        // Forward swing propulsion
        const forwardVel = player.getForwardVector(this._tempV3);
        player.velocity.addScaledVector(forwardVel, 24.0 * dt);
      }
    }
  }

  // Resolve player collision against building AABB obstacles
  resolveCollisions(player, obstacles, dt) {
    const playerRadius = 0.65;
    const playerHalfH = 0.95;
    const pos = player.position;

    player.isGrounded = false;
    player.isTouchingWall = false;
    player.wallNormal.set(0, 0, 0);

    // 1. Street ground level (0.08 asphalt surface) & Surrounding Ocean Water Check
    const islandHalfSpan = 580; // Metropolis Island Perimeter boundary
    const isOutsideIsland = Math.abs(pos.x) > islandHalfSpan || Math.abs(pos.z) > islandHalfSpan;

    // Ocean Water Contact Rescue (Cannot swim in ocean, immediately rescued back to land)
    if ((isOutsideIsland && pos.y <= 1.2) || pos.y < 0.2) {
      const safeX = THREE.MathUtils.clamp(pos.x, -islandHalfSpan + 30, islandHalfSpan - 30);
      const safeZ = THREE.MathUtils.clamp(pos.z, -islandHalfSpan + 30, islandHalfSpan - 30);
      pos.set(safeX, 4.5, safeZ);
      player.velocity.set(0, 12.0, 0);
      player.isGrounded = true;
      if (player.audio) player.audio.playWebZip();
      return;
    }

    const baseGroundY = 0.08; // Highest road/crosswalk elevation
    if (pos.y <= baseGroundY + playerHalfH) {
      pos.y = baseGroundY + playerHalfH;
      player.velocity.y = Math.max(0, player.velocity.y);
      player.isGrounded = true;
    }

    const minX = pos.x - playerRadius;
    const maxX = pos.x + playerRadius;
    const minY = pos.y - playerHalfH;
    const maxY = pos.y + playerHalfH;
    const minZ = pos.z - playerRadius;
    const maxZ = pos.z + playerRadius;

    // 2. Proactive Ground Floor Support Test (Checks if player is on top of ANY roof/floor/sidewalk)
    if (player.velocity.y <= 0.1) {
      let highestFloorY = -Infinity;
      for (let i = 0; i < obstacles.length; i++) {
        const box = obstacles[i];
        // Fast proximity cull
        if (box.max.x < minX || box.min.x > maxX || box.max.z < minZ || box.min.z > maxZ) {
          continue;
        }

        const feetY = pos.y - playerHalfH;
        if (feetY >= box.max.y - 0.55 && feetY <= box.max.y + 0.45) {
          if (box.max.y > highestFloorY) {
            highestFloorY = box.max.y;
          }
        }
      }

      if (highestFloorY > -Infinity) {
        pos.y = highestFloorY + playerHalfH;
        player.velocity.y = 0;
        player.isGrounded = true;
      }
    }

    // 3. Lateral Wall & Ceiling AABB Collision Resolution
    for (let i = 0; i < obstacles.length; i++) {
      const box = obstacles[i];

      // Fast proximity cull
      if (
        box.max.x < minX || box.min.x > maxX ||
        box.max.y < minY || box.min.y > maxY ||
        box.max.z < minZ || box.min.z > maxZ
      ) {
        continue;
      }

      // If already grounded on this box's roof, skip lateral resolution for this box
      if (player.isGrounded && Math.abs(pos.y - playerHalfH - box.max.y) < 0.05) {
        continue;
      }

      const overlapLeft = maxX - box.min.x;
      const overlapRight = box.max.x - minX;
      const overlapDown = maxY - box.min.y;
      const overlapUp = box.max.y - minY;
      const overlapBack = maxZ - box.min.z;
      const overlapFront = box.max.z - minZ;

      const minOverlapX = overlapLeft < overlapRight ? -overlapLeft : overlapRight;
      const minOverlapY = overlapDown < overlapUp ? -overlapDown : overlapUp;
      const minOverlapZ = overlapBack < overlapFront ? -overlapBack : overlapFront;

      const absX = Math.abs(minOverlapX);
      const absY = Math.abs(minOverlapY);
      const absZ = Math.abs(minOverlapZ);

      if (absY < absX && absY < absZ) {
        if (minOverlapY > 0) {
          pos.y = box.max.y + playerHalfH;
          player.velocity.y = 0;
          player.isGrounded = true;
        } else {
          pos.y = box.min.y - playerHalfH;
          if (player.velocity.y > 0) player.velocity.y = 0;
        }
      } else if (absX < absZ) {
        pos.x += minOverlapX;
        player.velocity.x = 0;
        player.isTouchingWall = true;
        player.wallNormal.set(Math.sign(minOverlapX), 0, 0);
      } else {
        pos.z += minOverlapZ;
        player.velocity.z = 0;
        player.isTouchingWall = true;
        player.wallNormal.set(0, 0, Math.sign(minOverlapZ));
      }
    }

    // 4. Proactive Wall Stick & Surface Normal (Ensures character faces building on all 4 adjacent sides)
    if (player.isWallCrawling) {
      let closestWallDist = Infinity;
      let bestNormal = null;
      let targetX = null;
      let targetZ = null;

      const probeSpan = 1.6;
      for (let i = 0; i < obstacles.length; i++) {
        const box = obstacles[i];
        if (
          box.max.x < pos.x - probeSpan || box.min.x > pos.x + probeSpan ||
          box.max.z < pos.z - probeSpan || box.min.z > pos.z + probeSpan ||
          pos.y < box.min.y || pos.y > box.max.y + 0.5
        ) {
          continue;
        }

        const distToMinX = Math.abs(pos.x - box.min.x);
        const distToMaxX = Math.abs(pos.x - box.max.x);
        const distToMinZ = Math.abs(pos.z - box.min.z);
        const distToMaxZ = Math.abs(pos.z - box.max.z);

        const minDist = Math.min(distToMinX, distToMaxX, distToMinZ, distToMaxZ);
        if (minDist < closestWallDist && minDist < probeSpan) {
          closestWallDist = minDist;
          if (minDist === distToMinX) {
            bestNormal = new THREE.Vector3(-1, 0, 0);
            targetX = box.min.x - playerRadius;
            targetZ = pos.z;
          } else if (minDist === distToMaxX) {
            bestNormal = new THREE.Vector3(1, 0, 0);
            targetX = box.max.x + playerRadius;
            targetZ = pos.z;
          } else if (minDist === distToMinZ) {
            bestNormal = new THREE.Vector3(0, 0, -1);
            targetX = pos.x;
            targetZ = box.min.z - playerRadius;
          } else {
            bestNormal = new THREE.Vector3(0, 0, 1);
            targetX = pos.x;
            targetZ = box.max.z + playerRadius;
          }
        }
      }

      if (bestNormal) {
        player.isTouchingWall = true;
        player.wallNormal.copy(bestNormal);
        if (targetX !== null && bestNormal.x !== 0) pos.x = targetX;
        if (targetZ !== null && bestNormal.z !== 0) pos.z = targetZ;
      }
    }
  }

  // Standard entity motion integration
  integrate(entity, dt) {
    // Gravity (Suppressed when grounded, flying in powered armor, or wall-crawling)
    if (entity.isGrounded || entity.isFlying) {
      if (entity.isGrounded) entity.velocity.y = Math.max(0, entity.velocity.y);
    } else if (!entity.isWallCrawling) {
      const gravFactor = entity.isSwinging ? 0.8 : 1.0;
      entity.velocity.y += this.gravity * gravFactor * dt;
      entity.velocity.y = Math.max(entity.velocity.y, this.terminalFallVelocity);
    }

    // Apply drag / friction
    if (entity.isGrounded) {
      entity.velocity.x *= this.groundFriction;
      entity.velocity.z *= this.groundFriction;
    } else if (entity.isFlying) {
      entity.velocity.multiplyScalar(0.96); // Smooth aerodynamic flight damping
    } else if (entity.isWallCrawling) {
      entity.velocity.multiplyScalar(this.wallFriction);
    } else {
      entity.velocity.x *= this.airResistance;
      entity.velocity.z *= this.airResistance;
    }

    // Clamp maximum speed (High ceiling for supersonic flight boost)
    const maxSpeed = entity.isFlying ? 65.0 : this.maxVelocity;
    const currentSpeed = entity.velocity.length();
    if (currentSpeed > maxSpeed) {
      entity.velocity.multiplyScalar(maxSpeed / currentSpeed);
    }

    // Position step
    entity.position.addScaledVector(entity.velocity, dt);
  }
}
