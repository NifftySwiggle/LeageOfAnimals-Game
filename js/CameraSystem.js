import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class CameraSystem {
  constructor(camera) {
    this.camera = camera;
    this.idealLookAt = new THREE.Vector3(0, 0.45, 0);

    this.currentPosition = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();

    this.baseFov = 65;
    this.maxFov = 92;
    this.currentFov = 65;

    // View Mode & Dynamic Zoom Distance
    this.viewMode = 'third'; // 'third', 'fps', 'action'
    this.currentDistance = 5.5;
    this.targetDistance = 5.5;
    this.minDistance = 0.0;
    this.maxDistance = 14.0;

    // Camera Shake
    this.shakeIntensity = 0;
    this.shakeDecay = 4.0;
  }

  // Trigger camera shake impulse
  addShake(amount) {
    this.shakeIntensity = Math.min(1.0, this.shakeIntensity + amount);
  }

  // Mouse wheel zoom in & out of character (seamless transition to FPS!)
  zoom(deltaY) {
    const zoomStep = 0.9;
    if (deltaY < 0) {
      // Zoom IN towards character
      this.targetDistance = Math.max(this.minDistance, this.targetDistance - zoomStep);
    } else {
      // Zoom OUT away from character
      this.targetDistance = Math.min(this.maxDistance, this.targetDistance + zoomStep);
    }

    if (this.targetDistance <= 0.4) {
      this.viewMode = 'fps';
      this.targetDistance = 0.0;
    } else if (this.targetDistance > 8.5) {
      this.viewMode = 'action';
    } else {
      this.viewMode = 'third';
    }
  }

  // Cycle or set view perspective (3rd Person -> 1st Person FPS -> Action Cam)
  setViewMode(mode) {
    if (mode === 'fps') {
      this.viewMode = 'fps';
      this.targetDistance = 0.0;
    } else if (mode === 'action') {
      this.viewMode = 'action';
      this.targetDistance = 10.0;
    } else if (mode === 'third') {
      this.viewMode = 'third';
      this.targetDistance = 5.5;
    } else {
      // Toggle / Cycle
      if (this.viewMode === 'third') {
        this.setViewMode('fps');
      } else if (this.viewMode === 'fps') {
        this.setViewMode('action');
      } else {
        this.setViewMode('third');
      }
    }
    return this.viewMode;
  }

  update(player, input, dt) {
    const playerPos = player.position;
    const playerVel = player.velocity;
    const speed = playerVel.length();

    // 1. Mouse wheel zoom update
    if (input.wheelZoomDelta !== 0) {
      this.zoom(input.wheelZoomDelta);
      input.wheelZoomDelta = 0;
    }

    // Toggle view key
    if (input.viewModeToggle) {
      this.setViewMode();
      input.viewModeToggle = false;
    }

    // 2. Smoothly damp camera distance
    this.currentDistance = THREE.MathUtils.damp(this.currentDistance, this.targetDistance, 10.0, dt);

    // 3. Dynamic FOV based on speed
    const targetFov = THREE.MathUtils.lerp(this.baseFov, this.maxFov, Math.min(1.0, speed / 55.0));
    this.currentFov = THREE.MathUtils.damp(this.currentFov, targetFov, 5.0, dt);
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();

    // 4. Driving Vehicle Chase Camera
    if (player.isDriving && player.drivenCar && player.drivenCar.mesh) {
      const car = player.drivenCar;
      const carPos = car.mesh.position;
      const carRot = car.steerAngle !== undefined ? car.steerAngle : car.mesh.rotation.y;
      
      const camDist = 9.0;
      const camHeight = 3.6;

      const targetCamPos = new THREE.Vector3(
        carPos.x - Math.sin(carRot) * camDist,
        carPos.y + camHeight,
        carPos.z - Math.cos(carRot) * camDist
      );

      this.currentPosition.lerp(targetCamPos, Math.min(1.0, 14.0 * dt));
      this.currentLookAt.lerp(carPos.clone().add(new THREE.Vector3(0, 1.4, 0)), Math.min(1.0, 16.0 * dt));

      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.currentLookAt);

      if (this.shakeIntensity > 0) {
        this.shakeIntensity -= this.shakeDecay * dt;
        this.camera.position.add(new THREE.Vector3(
          (Math.random() - 0.5) * this.shakeIntensity * 0.35,
          (Math.random() - 0.5) * this.shakeIntensity * 0.35,
          (Math.random() - 0.5) * this.shakeIntensity * 0.35
        ));
      }
      return;
    }

    const isFPS = this.currentDistance < 0.6;
    const yaw = input.yaw;
    const pitch = input.pitch;

    const cosPitch = Math.cos(pitch);
    const sinPitch = Math.sin(pitch);
    const sinYaw = Math.sin(yaw);
    const cosYaw = Math.cos(yaw);

    // In FPS Mode, only show the arms/hands in camera view (hide head, chest, badge, waist, and legs!)
    if (player.limbs) {
      const showBody = !isFPS;
      if (player.limbs.head) player.limbs.head.visible = showBody;
      if (player.limbs.chest) player.limbs.chest.visible = showBody;
      if (player.limbs.spBadge) player.limbs.spBadge.visible = showBody;
      if (player.limbs.waist) player.limbs.waist.visible = showBody;
      if (player.limbs.leftLeg) player.limbs.leftLeg.visible = showBody;
      if (player.limbs.rightLeg) player.limbs.rightLeg.visible = showBody;

      // Arms stay visible in FPS view!
      if (player.limbs.leftArm) player.limbs.leftArm.visible = true;
      if (player.limbs.rightArm) player.limbs.rightArm.visible = true;
    }

    if (isFPS) {
      // --- 1ST PERSON FPS PERSPECTIVE (Eyes of Spider-Ram) ---
      const eyeHeight = 0.70;
      const eyeForward = 0.15;
      const fpsCamPos = new THREE.Vector3(
        playerPos.x - sinYaw * eyeForward,
        playerPos.y + eyeHeight,
        playerPos.z - cosYaw * eyeForward
      );

      this.currentPosition.copy(fpsCamPos);
      this.camera.position.copy(fpsCamPos);

      // Look direction in FPS
      const lookTarget = fpsCamPos.clone().add(new THREE.Vector3(
        -sinYaw * cosPitch,
        -sinPitch,
        -cosYaw * cosPitch
      ));
      this.camera.lookAt(lookTarget);

    } else {
      // --- 3RD PERSON OVER-SHOULDER / ACTION PERSPECTIVE ---
      const camDist = this.currentDistance;
      const camHeight = player.isSwinging ? 1.8 : 2.2;

      const offsetX = sinYaw * cosPitch * camDist;
      const offsetY = sinPitch * camDist + camHeight;
      const offsetZ = cosYaw * cosPitch * camDist;

      const targetCamPos = new THREE.Vector3(
        playerPos.x + offsetX,
        playerPos.y + offsetY,
        playerPos.z + offsetZ
      );

      // Prevent camera dipping below street floor
      targetCamPos.y = Math.max(1.2, targetCamPos.y);

      // Smooth cinematic camera lag
      const lerpSpeed = player.isSwinging ? 14.0 : 18.0;
      this.currentPosition.lerp(targetCamPos, Math.min(1.0, lerpSpeed * dt));

      const targetLookAt = playerPos.clone().add(this.idealLookAt);
      this.currentLookAt.lerp(targetLookAt, Math.min(1.0, lerpSpeed * dt));

      this.camera.position.copy(this.currentPosition);
      this.camera.lookAt(this.currentLookAt);

      // Swing Banking Roll (cinematic tilt into turns)
      if (player.isSwinging) {
        const bankAngle = (playerVel.x * cosYaw - playerVel.z * sinYaw) * 0.007;
        this.camera.rotation.z += THREE.MathUtils.clamp(bankAngle, -0.18, 0.18);
      }
    }

    // Screen Shake
    if (this.shakeIntensity > 0) {
      this.shakeIntensity -= this.shakeDecay * dt;
      const shakeOffset = new THREE.Vector3(
        (Math.random() - 0.5) * this.shakeIntensity * 0.35,
        (Math.random() - 0.5) * this.shakeIntensity * 0.35,
        (Math.random() - 0.5) * this.shakeIntensity * 0.35
      );
      this.camera.position.add(shakeOffset);
    }
  }

  // Get current camera forward look direction
  getLookDirection() {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    return dir;
  }
}
