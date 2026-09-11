/**
 * TouchControls.js - Ergonomic AAA Mobile Touch Controls for League of Animals
 * Provides a responsive virtual thumbstick, camera look drag zone, action button cluster,
 * and quick-action menu buttons for mobile/tablet gameplay.
 */

export class TouchControls {
  constructor(game, input) {
    this.game = game;
    this.input = input;
    this.container = null;
    this.activeTouches = new Map();

    // Preference: 'auto' (default: on touch devices only), 'enabled' (always on), 'disabled' (turned off)
    this.preference = localStorage.getItem('loa_touch_controls') || 'auto';
    this.isGameActive = false;
    this.isOrientationBlocked = false;

    // Virtual Joystick State
    this.joystickTouchId = null;
    this.joystickBasePos = { x: 0, y: 0 };
    this.joystickCurrentPos = { x: 0, y: 0 };
    this.joystickRadius = 55; // Max displacement in px

    // Camera Look Drag State
    this.lookTouchId = null;
    this.lookLastPos = { x: 0, y: 0 };
    this.touchLookSensitivity = 0.0035;

    // Elements
    this.joystickBase = null;
    this.joystickKnob = null;
    this.swingBtn = null;
    this.driveBtn = null;
    this.wallBtn = null;

    this.initDOM();
    this.bindEvents();
    this.setupOrientationPrompt();
    this.updateVisibility();
  }

  isTouchDevice() {
    const hasTouchEvents = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    return (hasTouchEvents && hasCoarsePointer) || (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024);
  }

  shouldShow() {
    if (!this.isGameActive) return false;
    if (this.preference === 'disabled') return false;
    if (this.preference === 'enabled') return true;
    // 'auto' mode: only appear if genuine touch device
    return this.isTouchDevice();
  }

  updateVisibility() {
    if (!this.container) return;
    if (this.shouldShow()) {
      this.container.classList.add('active');
    } else {
      this.container.classList.remove('active');
      this.resetInputs();
    }
  }

  setPreference(mode) {
    this.preference = mode;
    localStorage.setItem('loa_touch_controls', mode);
    this.updateVisibility();
  }

  getPreference() {
    return this.preference;
  }

  onGameStart() {
    this.isGameActive = true;
    this.updateVisibility();
    this.checkOrientation();

    // Lock to landscape where API allows
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
      }
    } catch (e) {}
  }

  onGameEnd() {
    this.isGameActive = false;
    this.updateVisibility();
    this.resetInputs();
  }

  resetInputs() {
    this.joystickTouchId = null;
    this.lookTouchId = null;
    if (this.joystickKnob) {
      this.joystickKnob.style.transform = 'translate(0px, 0px)';
    }
    this.input.moveX = 0;
    this.input.moveZ = 0;
    this.input.moveForward = false;
    this.input.moveBackward = false;
    this.input.moveLeft = false;
    this.input.moveRight = false;
    this.input.isSprinting = false;
    this.input.isAttacking = false;
    this.input.isJumping = false;
    this.input.isSwinging = false;
  }

  initDOM() {
    // Master Mobile Overlay
    this.container = document.createElement('div');
    this.container.id = 'loa-mobile-controls';
    this.container.className = 'loa-touch-overlay';

    this.container.innerHTML = `
      <!-- Top Mobile Quick Action Bar -->
      <div class="mobile-top-bar">
        <button id="m-btn-pause" class="mobile-action-pill" title="Pause Menu">
          <span class="m-btn-icon">⏸️</span>
          <span class="m-btn-lbl">MENU</span>
        </button>
        <button id="m-btn-cam" class="mobile-action-pill" title="Toggle 1st/3rd Camera">
          <span class="m-btn-icon">🎥</span>
          <span id="m-cam-text" class="m-btn-lbl">3RD</span>
        </button>
        <button id="m-btn-map" class="mobile-action-pill" title="Hold GPS Map">
          <span class="m-btn-icon">🗺️</span>
          <span class="m-btn-lbl">GPS</span>
        </button>
        <button id="m-btn-sound" class="mobile-action-pill" title="Toggle Sound">
          <span id="m-sound-icon" class="m-btn-icon">🔊</span>
        </button>
        <button id="m-btn-fs" class="mobile-action-pill" title="Toggle Fullscreen">
          <span class="m-btn-icon">⛶</span>
        </button>
      </div>

      <!-- Left: Dynamic Virtual Analog Thumbstick Zone -->
      <div id="m-joystick-zone" class="joystick-touch-zone">
        <div id="m-joystick-base" class="joystick-base">
          <div class="joystick-crosshair-ring"></div>
          <div id="m-joystick-knob" class="joystick-knob">
            <div class="knob-dot"></div>
          </div>
        </div>
      </div>

      <!-- Right: Touch Camera Look Drag Surface -->
      <div id="m-look-zone" class="camera-look-zone"></div>

      <!-- Bottom Right: Ergonomic Superhero Action Buttons Cluster -->
      <div class="mobile-action-deck">
        <!-- Enter Vehicle Context Button (Appears when near car) -->
        <button id="m-btn-drive" class="m-action-btn drive-btn" style="display: none;">
          <span class="m-action-icon">🚗</span>
          <span class="m-action-title">DRIVE</span>
        </button>

        <!-- Secondary Action Row (Top Arc) -->
        <div class="action-arc-row">
          <button id="m-btn-wall" class="m-action-btn secondary-action" title="Wall Climb / Uni-Beam">
            <span class="m-action-icon" id="m-wall-icon">🧗</span>
            <span class="m-action-title" id="m-wall-title">WALL</span>
          </button>

          <button id="m-btn-shoot" class="m-action-btn secondary-action" title="Web Stun / Repulsor Shooter">
            <span class="m-action-icon">🕸️</span>
            <span class="m-action-title">SHOOT</span>
          </button>

          <button id="m-btn-dash" class="m-action-btn secondary-action" title="Dodge Somersault Dash">
            <span class="m-action-icon">⚡</span>
            <span class="m-action-title">DASH</span>
          </button>
        </div>

        <!-- Primary Action Cluster (Bottom Arc) -->
        <div class="action-primary-cluster">
          <button id="m-btn-attack" class="m-action-btn attack-btn" title="Combo Attack / Blast">
            <span class="m-action-icon">💥</span>
            <span class="m-action-title">ATTACK</span>
          </button>

          <button id="m-btn-jump" class="m-action-btn jump-btn" title="Jump / Double Jump Flip">
            <span class="m-action-icon">🦘</span>
            <span class="m-action-title">JUMP</span>
          </button>

          <!-- Grand Primary Web Swing / Powered Flight Button -->
          <button id="m-btn-swing" class="m-action-btn swing-btn" title="Hold to Web Swing or Fly">
            <span class="m-action-icon" id="m-swing-icon">🕸️</span>
            <span class="m-action-title" id="m-swing-title">HOLD SWING</span>
            <span class="m-action-sub">FLIGHT</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(this.container);

    // Cache elements
    this.joystickBase = document.getElementById('m-joystick-base');
    this.joystickKnob = document.getElementById('m-joystick-knob');
    this.swingBtn = document.getElementById('m-btn-swing');
    this.driveBtn = document.getElementById('m-btn-drive');
    this.wallBtn = document.getElementById('m-btn-wall');
  }

  setupOrientationPrompt() {
    let overlay = document.getElementById('orientation-prompt');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'orientation-prompt';
      overlay.className = 'orientation-prompt';
      overlay.innerHTML = `
        <div class="orientation-card">
          <div class="phone-rotate-anim">
            <svg class="phone-svg" viewBox="0 0 100 100" width="90" height="90">
              <rect class="phone-rect" x="30" y="15" width="40" height="70" rx="6" ry="6" fill="none" stroke="#00f0ff" stroke-width="3.5" />
              <line x1="44" y1="22" x2="56" y2="22" stroke="#00f0ff" stroke-width="2" stroke-linecap="round" />
              <circle cx="50" cy="76" r="3" fill="#00f0ff" />
              <!-- Rotation Arrow -->
              <path class="rotate-arrow" d="M 68 28 A 38 38 0 0 1 76 60" fill="none" stroke="#ff0055" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="4 3" />
              <polygon points="76,64 71,55 81,56" fill="#ff0055" />
            </svg>
          </div>
          <div class="orientation-badge">ORIENTATION ENFORCED • LANDSCAPE</div>
          <h2 class="orientation-title">PLEASE TURN PHONE SIDEWAYS</h2>
          <p class="orientation-desc">League of Animals requires landscape orientation for the full open-world perspective and tactical touch controls.</p>
          <div class="orientation-lock-pill">
            <span>🔒</span>
            <span>ROTATE DEVICE TO PLAY</span>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    this.checkOrientation();
  }

  checkOrientation() {
    const overlay = document.getElementById('orientation-prompt');
    if (!overlay) return;

    const isPortrait = window.innerHeight > window.innerWidth;
    const isMobileDevice = this.isTouchDevice() || (window.innerWidth <= 860 && ('ontouchstart' in window || navigator.maxTouchPoints > 0));

    if (isPortrait && isMobileDevice) {
      overlay.classList.add('visible');
      this.isOrientationBlocked = true;
      this.resetInputs();
    } else {
      overlay.classList.remove('visible');
      this.isOrientationBlocked = false;
    }
  }

  bindEvents() {
    // 1. Virtual Joystick Zone
    const joystickZone = document.getElementById('m-joystick-zone');
    if (joystickZone) {
      joystickZone.addEventListener('touchstart', (e) => this.onJoystickStart(e), { passive: false });
      joystickZone.addEventListener('touchmove', (e) => this.onJoystickMove(e), { passive: false });
      joystickZone.addEventListener('touchend', (e) => this.onJoystickEnd(e), { passive: false });
      joystickZone.addEventListener('touchcancel', (e) => this.onJoystickEnd(e), { passive: false });
    }

    // 2. Camera Look Drag Zone
    const lookZone = document.getElementById('m-look-zone');
    if (lookZone) {
      lookZone.addEventListener('touchstart', (e) => this.onLookStart(e), { passive: false });
      lookZone.addEventListener('touchmove', (e) => this.onLookMove(e), { passive: false });
      lookZone.addEventListener('touchend', (e) => this.onLookEnd(e), { passive: false });
      lookZone.addEventListener('touchcancel', (e) => this.onLookEnd(e), { passive: false });
    }

    // 3. Action Buttons
    this.bindActionButton('m-btn-attack', () => {
      this.input.attackPressed = true;
      this.input.isAttacking = true;
      this.vibrate(20);
    }, () => {
      this.input.isAttacking = false;
    });

    this.bindActionButton('m-btn-jump', () => {
      this.input.jumpPressed = true;
      this.input.isJumping = true;
      this.vibrate(25);
    }, () => {
      this.input.isJumping = false;
    });

    this.bindActionButton('m-btn-dash', () => {
      this.input.dashPressed = true;
      this.input.isSprinting = true;
      this.vibrate(30);
    }, () => {
      this.input.isSprinting = false;
    });

    this.bindActionButton('m-btn-shoot', () => {
      this.input.webShootPressed = true;
      this.vibrate(20);
    }, null);

    this.bindActionButton('m-btn-wall', () => {
      this.input.wallCrawlToggle = true;
      this.vibrate(20);
    }, null);

    this.bindActionButton('m-btn-drive', () => {
      this.input.enterVehiclePressed = true;
      this.vibrate(40);
    }, null);

    // Swing / Flight Button: Hold to swing/fly, release to let go
    if (this.swingBtn) {
      const startSwing = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.input.swingPressed = true;
        this.input.isSwinging = true;
        this.swingBtn.classList.add('holding');
        this.vibrate(35);
      };

      const endSwing = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.input.isSwinging) {
          this.input.isSwinging = false;
          this.input.swingReleased = true;
        }
        this.swingBtn.classList.remove('holding');
      };

      this.swingBtn.addEventListener('touchstart', startSwing, { passive: false });
      this.swingBtn.addEventListener('touchend', endSwing, { passive: false });
      this.swingBtn.addEventListener('touchcancel', endSwing, { passive: false });
      this.swingBtn.addEventListener('mousedown', startSwing);
      window.addEventListener('mouseup', endSwing);
    }

    // 4. Mobile Top Action Bar Buttons
    const pauseBtn = document.getElementById('m-btn-pause');
    if (pauseBtn) {
      pauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.game.togglePause();
        this.vibrate(20);
      });
    }

    const camBtn = document.getElementById('m-btn-cam');
    const camText = document.getElementById('m-cam-text');
    if (camBtn) {
      camBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newMode = this.game.cameraSystem.setViewMode();
        if (this.game.updateCamBtnText) this.game.updateCamBtnText(newMode);
        if (camText) camText.textContent = newMode === 'fps' ? '1ST' : (newMode === 'action' ? 'ACT' : '3RD');
        this.vibrate(20);
      });
    }

    const mapBtn = document.getElementById('m-btn-map');
    if (mapBtn) {
      // Tap toggle or hold GPS map
      mapBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.input.showMap = !this.input.showMap;
        mapBtn.classList.toggle('active', this.input.showMap);
        this.vibrate(25);
      }, { passive: false });
      mapBtn.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    const soundBtn = document.getElementById('m-btn-sound');
    const soundIcon = document.getElementById('m-sound-icon');
    if (soundBtn) {
      soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const muted = this.game.audio.toggleMute();
        if (soundIcon) soundIcon.textContent = muted ? '🔇' : '🔊';
        this.vibrate(20);
      });
    }

    const fsBtn = document.getElementById('m-btn-fs');
    if (fsBtn) {
      fsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFullscreen();
        this.vibrate(25);
      });
    }

    // Orientation change listener
    window.addEventListener('resize', () => this.checkOrientation());
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.checkOrientation(), 150);
    });
    if (window.screen && window.screen.orientation && window.screen.orientation.addEventListener) {
      window.screen.orientation.addEventListener('change', () => {
        setTimeout(() => this.checkOrientation(), 100);
      });
    }
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.checkOrientation());
    }
  }

  bindActionButton(id, onPress, onRelease) {
    const btn = document.getElementById(id);
    if (!btn) return;

    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.add('pressed');
      if (onPress) onPress();
    }, { passive: false });

    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.remove('pressed');
      if (onRelease) onRelease();
    }, { passive: false });

    btn.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      e.stopPropagation();
      btn.classList.remove('pressed');
      if (onRelease) onRelease();
    }, { passive: false });
  }

  // --- Virtual Joystick Touch Event Handlers ---
  onJoystickStart(e) {
    e.preventDefault();
    if (this.joystickTouchId !== null) return;

    const touch = e.changedTouches[0];
    this.joystickTouchId = touch.identifier;

    const rect = this.joystickBase.getBoundingClientRect();
    this.joystickBasePos = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };

    this.processJoystickTouch(touch.clientX, touch.clientY);
  }

  onJoystickMove(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystickTouchId) {
        this.processJoystickTouch(touch.clientX, touch.clientY);
        break;
      }
    }
  }

  processJoystickTouch(clientX, clientY) {
    const dx = clientX - this.joystickBasePos.x;
    const dy = clientY - this.joystickBasePos.y;
    const dist = Math.hypot(dx, dy);

    const clampedDist = Math.min(dist, this.joystickRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    if (this.joystickKnob) {
      this.joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;
    }

    // Normalized axis values: -1 to 1
    const normX = clampedDist > 6 ? (knobX / this.joystickRadius) : 0;
    const normY = clampedDist > 6 ? (knobY / this.joystickRadius) : 0;

    this.input.moveX = normX;
    this.input.moveZ = normY;

    // Digital WASD equivalents for components expecting booleans
    this.input.moveForward = normY < -0.22;
    this.input.moveBackward = normY > 0.22;
    this.input.moveLeft = normX < -0.22;
    this.input.moveRight = normX > 0.22;

    // Sprint when joystick pushed far (near outer ring)
    if (clampedDist > this.joystickRadius * 0.88) {
      this.input.isSprinting = true;
    }
  }

  onJoystickEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.joystickTouchId) {
        this.joystickTouchId = null;
        if (this.joystickKnob) {
          this.joystickKnob.style.transform = 'translate(0px, 0px)';
        }
        this.input.moveX = 0;
        this.input.moveZ = 0;
        this.input.moveForward = false;
        this.input.moveBackward = false;
        this.input.moveLeft = false;
        this.input.moveRight = false;
        this.input.isSprinting = false;
        break;
      }
    }
  }

  // --- Touch Look Drag Event Handlers ---
  onLookStart(e) {
    e.preventDefault();
    if (this.lookTouchId !== null) return;

    const touch = e.changedTouches[0];
    this.lookTouchId = touch.identifier;
    this.lookLastPos = { x: touch.clientX, y: touch.clientY };
  }

  onLookMove(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.lookTouchId) {
        const deltaX = touch.clientX - this.lookLastPos.x;
        const deltaY = touch.clientY - this.lookLastPos.y;

        const pitchFactor = this.input.invertY ? -1 : 1;
        this.input.yaw -= deltaX * this.touchLookSensitivity;
        this.input.pitch += deltaY * this.touchLookSensitivity * pitchFactor;

        // Clamp camera pitch
        const maxPitch = 1.45;
        this.input.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.input.pitch));

        this.lookLastPos = { x: touch.clientX, y: touch.clientY };
        break;
      }
    }
  }

  onLookEnd(e) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.lookTouchId) {
        this.lookTouchId = null;
        break;
      }
    }
  }

  // Update button labels depending on active hero (Spider-Ram vs Iron-Ram)
  updateHeroDisplay(characterType) {
    const swingIcon = document.getElementById('m-swing-icon');
    const swingTitle = document.getElementById('m-swing-title');
    const wallIcon = document.getElementById('m-wall-icon');
    const wallTitle = document.getElementById('m-wall-title');

    if (characterType === 'iron_ram') {
      if (swingIcon) swingIcon.textContent = '🚀';
      if (swingTitle) swingTitle.textContent = 'HOLD FLIGHT';
      if (wallIcon) wallIcon.textContent = '⚡';
      if (wallTitle) wallTitle.textContent = 'UNIBEAM';
    } else {
      if (swingIcon) swingIcon.textContent = '🕸️';
      if (swingTitle) swingTitle.textContent = 'HOLD SWING';
      if (wallIcon) wallIcon.textContent = '🧗';
      if (wallTitle) wallTitle.textContent = 'WALL';
    }
  }

  // Toggle or update vehicle drive button prompt
  setDriveVisible(visible, isDriving = false) {
    if (!this.driveBtn) return;
    this.driveBtn.style.display = visible ? 'flex' : 'none';
    const driveTitle = this.driveBtn.querySelector('.m-action-title');
    if (driveTitle) {
      driveTitle.textContent = isDriving ? 'EXIT CAR' : 'DRIVE';
    }
    this.driveBtn.classList.toggle('active-car', isDriving);
  }

  vibrate(ms = 20) {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(ms);
      } catch (e) {
        // Safe ignore
      }
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }
}
