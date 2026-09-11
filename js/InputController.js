export const DEFAULT_KEYBINDS = {
  moveForward: 'KeyW',
  moveBackward: 'KeyS',
  moveLeft: 'KeyA',
  moveRight: 'KeyD',
  jump: 'Space',
  dash: 'ShiftLeft',
  webShoot: 'KeyE',
  wallClimb: 'KeyQ',
  driveVehicle: 'KeyF',
  toggleCam: 'KeyV',
  showMap: 'KeyM',
  webSwing: 'Mouse2',
  attack: 'Mouse0'
};

export const KEYBIND_LABELS = {
  moveForward: 'Move Forward',
  moveBackward: 'Move Backward',
  moveLeft: 'Move Left',
  moveRight: 'Move Right',
  jump: 'Jump / Double Jump Flip',
  dash: 'Tuck & Roll Somersault Dash',
  webShoot: 'Web Stun Shooter',
  wallClimb: 'Wall Climb & Cling',
  driveVehicle: 'Enter / Drive Vehicles',
  toggleCam: 'Toggle Camera (1st/3rd View)',
  showMap: 'Hold Tactical Satellite Map',
  webSwing: 'Hold Web Swing / Flight',
  attack: '3-Hit Ram Combo Strike'
};

export class InputController {
  constructor(domElement) {
    this.domElement = domElement || document.body;

    // Movement axes
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.moveUp = false;
    this.moveDown = false;
    this.moveX = 0; // Analog X axis (-1 to 1)
    this.moveZ = 0; // Analog Z axis (-1 to 1)

    // Actions
    this.isSprinting = false;
    this.isJumping = false;
    this.jumpPressed = false;
    this.isAttacking = false;
    this.attackPressed = false;
    this.isSwinging = false;
    this.swingPressed = false;
    this.swingReleased = false;
    this.webShootPressed = false;
    this.wallCrawlToggle = false;
    this.dashPressed = false;
    this.enterVehiclePressed = false;
    this.viewModeToggle = false;
    this.showMap = false;

    // Keybindings & Remapping
    this.storageKey = 'loa_custom_keybinds';
    this.keybinds = Object.assign({}, DEFAULT_KEYBINDS);
    this.loadKeybinds();

    // Mouse look
    this.isPointerLocked = false;
    this.baseSensitivity = 0.0022;
    this.mouseSensitivity = 0.0022;
    this.invertY = false;
    this.yaw = 0;
    this.pitch = 0;
    this.pitchMin = -Math.PI / 2.3;
    this.pitchMax = Math.PI / 2.3;

    // Right-click hold detection
    this.rightMouseDownTime = 0;
    this.rightMouseHeld = false;

    this.initListeners();
  }

  loadKeybinds() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.keybinds = Object.assign({}, DEFAULT_KEYBINDS, JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load keybinds:', e);
    }
  }

  saveKeybinds() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.keybinds));
    } catch (e) {
      console.warn('Failed to save keybinds:', e);
    }
  }

  resetKeybinds() {
    this.keybinds = Object.assign({}, DEFAULT_KEYBINDS);
    this.saveKeybinds();
  }

  formatKeyName(code) {
    if (!code) return 'NONE';
    if (code === 'Mouse0') return 'LEFT CLICK';
    if (code === 'Mouse1') return 'MIDDLE CLICK';
    if (code === 'Mouse2') return 'RIGHT CLICK';
    if (code === 'Space') return 'SPACE';
    if (code === 'ShiftLeft') return 'LEFT SHIFT';
    if (code === 'ShiftRight') return 'RIGHT SHIFT';
    if (code === 'ControlLeft') return 'LEFT CTRL';
    if (code === 'ControlRight') return 'RIGHT CTRL';
    if (code === 'AltLeft') return 'LEFT ALT';
    if (code.startsWith('Key')) return code.replace('Key', '');
    if (code.startsWith('Digit')) return code.replace('Digit', '');
    if (code.startsWith('Arrow')) return code.replace('Arrow', '').toUpperCase() + ' ARROW';
    return code.toUpperCase();
  }

  initListeners() {
    // Keyboard down with dynamic remapping
    window.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const code = e.code;

      if (code === this.keybinds.moveForward || code === 'ArrowUp') this.moveForward = true;
      if (code === this.keybinds.moveBackward || code === 'ArrowDown') this.moveBackward = true;
      if (code === this.keybinds.moveLeft || code === 'ArrowLeft') this.moveLeft = true;
      if (code === this.keybinds.moveRight || code === 'ArrowRight') this.moveRight = true;

      if (code === this.keybinds.jump) {
        this.isJumping = true;
        this.jumpPressed = true;
        e.preventDefault();
      }

      if (code === this.keybinds.dash) {
        this.isSprinting = true;
        this.dashPressed = true;
      }

      if (code === this.keybinds.wallClimb || code === 'KeyC') {
        this.wallCrawlToggle = true;
      }

      if (code === this.keybinds.webShoot) {
        this.webShootPressed = true;
      }

      if (code === this.keybinds.driveVehicle) {
        this.enterVehiclePressed = true;
      }

      if (code === this.keybinds.toggleCam) {
        this.viewModeToggle = true;
      }

      if (code === this.keybinds.showMap) {
        this.showMap = true;
      }

      // Keyboard swing/attack fallback if bound to keys
      if (code === this.keybinds.webSwing) {
        this.isSwinging = true;
        this.swingPressed = true;
      }
      if (code === this.keybinds.attack) {
        this.isAttacking = true;
        this.attackPressed = true;
      }
    });

    // Keyboard up
    window.addEventListener('keyup', (e) => {
      const code = e.code;
      if (code === this.keybinds.moveForward || code === 'ArrowUp') this.moveForward = false;
      if (code === this.keybinds.moveBackward || code === 'ArrowDown') this.moveBackward = false;
      if (code === this.keybinds.moveLeft || code === 'ArrowLeft') this.moveLeft = false;
      if (code === this.keybinds.moveRight || code === 'ArrowRight') this.moveRight = false;
      if (code === this.keybinds.jump) this.isJumping = false;
      if (code === this.keybinds.dash) this.isSprinting = false;

      if (code === this.keybinds.showMap) {
        this.showMap = false;
      }

      if (code === this.keybinds.webSwing) {
        this.isSwinging = false;
        this.swingReleased = true;
      }
      if (code === this.keybinds.attack) {
        this.isAttacking = false;
      }
    });

    // Pointer Lock
    this.domElement.addEventListener('click', () => {
      this.requestPointerLockSafe();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.domElement);
    });

    // Mouse Movement - Standard Natural FPS Look with Invert Y support
    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;

      const pitchFactor = this.invertY ? -1 : 1;
      this.yaw -= e.movementX * this.mouseSensitivity;
      this.pitch += e.movementY * this.mouseSensitivity * pitchFactor;

      // Clamp pitch to prevent camera flipping
      const maxPitch = 1.45; // ~83 degrees
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    });

    // Mouse Wheel Scroll (Zooms camera in/out smoothly and reels in webs!)
    this.scrollDelta = 0;
    this.wheelZoomDelta = 0;
    window.addEventListener('wheel', (e) => {
      this.scrollDelta += e.deltaY;
      this.wheelZoomDelta += e.deltaY;
    }, { passive: true });

    // Mouse Buttons - Dynamically mapped
    window.addEventListener('mousedown', (e) => {
      if (!this.isPointerLocked) return;
      const mouseCode = `Mouse${e.button}`;

      if (mouseCode === this.keybinds.attack || (e.button === 0 && this.keybinds.attack === 'Mouse0')) {
        this.isAttacking = true;
        this.attackPressed = true;
      }
      if (mouseCode === this.keybinds.webSwing || (e.button === 2 && this.keybinds.webSwing === 'Mouse2')) {
        this.rightMouseHeld = true;
        this.swingPressed = true;
        this.isSwinging = true;
      }
      if (mouseCode === this.keybinds.webShoot) {
        this.webShootPressed = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      const mouseCode = `Mouse${e.button}`;
      if (mouseCode === this.keybinds.attack || (e.button === 0 && this.keybinds.attack === 'Mouse0')) {
        this.isAttacking = false;
      }
      if (mouseCode === this.keybinds.webSwing || (e.button === 2 && this.keybinds.webSwing === 'Mouse2')) {
        this.rightMouseHeld = false;
        this.isSwinging = false;
        this.swingReleased = true;
      }
    });

    // Prevent default context menu
    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  requestPointerLockSafe() {
    if (this.isPointerLocked || document.pointerLockElement === this.domElement) return;
    try {
      const p = this.domElement.requestPointerLock();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Browser security throttle, safely handled
        });
      }
    } catch (e) {
      // Safe fallback
    }
  }

  // Reset single-frame pulse flags at end of frame
  endFrame() {
    this.jumpPressed = false;
    this.attackPressed = false;
    this.swingPressed = false;
    this.swingReleased = false;
    this.webShootPressed = false;
    this.wallCrawlToggle = false;
    this.dashPressed = false;
    this.enterVehiclePressed = false;
    this.scrollDelta = 0;
  }
}
