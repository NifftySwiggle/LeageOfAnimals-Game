import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { Shaders } from './Shaders.js';
import { AudioSystem } from './AudioSystem.js';
import { Physics } from './Physics.js';
import { InputController, KEYBIND_LABELS } from './InputController.js';
import { CityGenerator } from './CityGenerator.js';
import { Player, HERO_DEFAULT_CUSTOMIZATION } from './Player.js';
import { WebSystem } from './WebSystem.js';
import { PortalManager } from './Portals.js';
import { CameraSystem } from './CameraSystem.js';
import { HUD } from './HUD.js';
import { AchievementsSystem } from './AchievementsSystem.js';
import { CollectiblesManager } from './CollectiblesManager.js';
import { TouchControls } from './TouchControls.js';

class Game {
  constructor() {
    this.container = document.getElementById('game-container');
    this.isPaused = false;

    // Clock & Timing
    this.clock = new THREE.Clock();
    this.dayTime = 0.28; // Daytime bright sun
    this.daySpeed = 0.002; // Smooth gentle day cycle

    // Three.js Core
    this.initThree();

    // Game Systems
    this.audio = new AudioSystem();
    this.physics = new Physics();
    this.input = new InputController(this.container);
    this.cameraSystem = new CameraSystem(this.camera);
    this.hud = new HUD();

    // Mobile & Tablet Touch Controls
    this.touch = new TouchControls(this, this.input);

    // City & Environment
    this.city = new CityGenerator(this.scene);
    this.city.generateCity();

    // Sunny Open-World Sky Dome & Glowing Sun
    this.initSky();

    // Rain & Weather Particles
    this.initRain();

    // Player & Web System (Spawn safely on top of Central Skyscraper Rooftop)
    this.player = new Player(this.scene, this.audio);
    this.player.position.set(0, 111.73, 0); // Central skyscraper launch deck pad (110.78 + 0.95)
    this.webSystem = new WebSystem(this.scene, this.audio);
    this.portalManager = new PortalManager(this.scene, this.audio);

    // Achievements & Tiered Collectibles Systems
    this.achievements = new AchievementsSystem(this.audio);
    this.collectibles = new CollectiblesManager(this.scene, this.audio, this.achievements);

    // 3D Hero Preview Stage for Main Menu
    this.initHeroPreview();

    // Audio, UI & Pause Menu Controls
    this.setupUI();

    // Window & Viewport Resize / Orientation Change Listeners
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.onResize(), 150));
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.onResize());
    }
    document.addEventListener('fullscreenchange', () => this.onResize());

    // Start Game Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  initThree() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0xa0c4e8, 0.0018); // Bright atmospheric horizon haze

    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.35, 1800);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    // Bright Natural Hemisphere Ambient Light
    this.hemiLight = new THREE.HemisphereLight(0xe0f0ff, 0x4a5568, 1.6);
    this.scene.add(this.hemiLight);

    // Sun Directional Light with Soft Shadows
    this.sunLight = new THREE.DirectionalLight(0xfff8e7, 2.8);
    this.sunLight.position.set(120, 220, 100);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 500;
    const shadowD = 150;
    this.sunLight.shadow.camera.left = -shadowD;
    this.sunLight.shadow.camera.right = shadowD;
    this.sunLight.shadow.camera.top = shadowD;
    this.sunLight.shadow.camera.bottom = -shadowD;
    this.scene.add(this.sunLight);

    // Glowing Visible Sun Mesh in the Sky
    const sunGeo = new THREE.SphereGeometry(24, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(200, 380, 150);
    this.scene.add(this.sunMesh);
  }

  initSky() {
    this.skyMat = Shaders.createHeroSkyMaterial();
    const skyGeo = new THREE.SphereGeometry(900, 32, 16);
    this.skyMesh = new THREE.Mesh(skyGeo, this.skyMat);
    this.scene.add(this.skyMesh);
  }

  initRain() {
    const rainCount = 1500;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 200;
      rainPositions[i * 3 + 1] = Math.random() * 80;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 200;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.25,
      transparent: true,
      opacity: 0.0
    });

    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainParticles);
  }

  // Set up all HTML / DOM / Audio UI Bindings
  setupUI() {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-progress-bar');
    const loadingPct = document.getElementById('loading-pct');
    const loadingQuote = document.getElementById('loading-quote');

    const mainMenu = document.getElementById('main-menu');
    const startBtn = document.getElementById('start-btn');
    const controlsBtn = document.getElementById('controls-btn');
    const controlsModal = document.getElementById('controls-modal');
    const closeControlsBtn = document.getElementById('close-controls-btn');

    const pauseScreen = document.getElementById('pause-screen');
    const resumeBtn = document.getElementById('resume-btn');
    const restartBtn = document.getElementById('restart-btn');

    const gameOverScreen = document.getElementById('game-over-screen');
    const respawnBtn = document.getElementById('respawn-btn');
    const audioBtn = document.getElementById('toggle-audio-btn');

    // 1. Loading Screen Progression Animation
    const quotes = [
      'Polishing Spider-Ram Horns & Hooves...',
      'Synthesizing High-Tensile Web Fluid...',
      'Building 3D Metropolis with Elevated Sidewalks...',
      'Calibrating NifftySwiggle Creator Billboards...',
      'Ready to Ram and Swing!'
    ];

    let progress = 0;
    const loadInterval = setInterval(() => {
      progress += Math.floor(Math.random() * 18) + 12;
      if (progress > 100) progress = 100;

      if (loadingBar) loadingBar.style.width = `${progress}%`;
      if (loadingPct) loadingPct.textContent = `${progress}%`;

      const quoteIdx = Math.min(quotes.length - 1, Math.floor((progress / 100) * quotes.length));
      if (loadingQuote) loadingQuote.textContent = quotes[quoteIdx];

      if (progress >= 100) {
        clearInterval(loadInterval);
        setTimeout(() => {
          if (loadingScreen) loadingScreen.style.display = 'none';
          if (mainMenu) {
            mainMenu.classList.remove('hidden');
            mainMenu.style.display = 'flex';
          }
        }, 300);
      }
    }, 120);

    // 2. Main Menu Actions
    const achievementsBtn = document.getElementById('achievements-btn');
    const achievementsModal = document.getElementById('achievements-modal');
    const closeAchievementsBtn = document.getElementById('close-achievements-btn');

    const collectiblesBtn = document.getElementById('collectibles-btn');
    const collectiblesModal = document.getElementById('collectibles-modal');
    const closeCollectiblesBtn = document.getElementById('close-collectibles-btn');

    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeSettingsBtn = document.getElementById('close-settings-btn');

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.dayTime = 0.25; // Always launch in bright vibrant daytime
        const chosenHero = this.selectedHero || 'spider_ram';
        this.player.setCharacterType(chosenHero);
        // Ensure latest customization from preview or storage is applied
        const savedCust = this.previewHeroes?.[chosenHero]?.player?.customization;
        if (savedCust) {
          this.player.applyCustomization(savedCust);
        }
        this.hud.updateHeroDisplay(chosenHero);
        if (this.touch) {
          this.touch.updateHeroDisplay(chosenHero);
          this.touch.onGameStart();
        }
        if (mainMenu) {
          mainMenu.classList.add('hidden');
          mainMenu.style.display = 'none';
        }
        const suitDrawer = document.getElementById('suit-lab-drawer');
        if (suitDrawer) suitDrawer.style.display = 'none';

        this.requestPointerLockSafe();
      });
    }

    if (achievementsBtn) {
      achievementsBtn.addEventListener('click', () => {
        this.renderAchievementsUI();
        if (achievementsModal) achievementsModal.style.display = 'flex';
      });
    }

    if (closeAchievementsBtn) {
      closeAchievementsBtn.addEventListener('click', () => {
        if (achievementsModal) achievementsModal.style.display = 'none';
      });
    }

    if (collectiblesBtn) {
      collectiblesBtn.addEventListener('click', () => {
        this.renderCollectiblesUI();
        if (collectiblesModal) collectiblesModal.style.display = 'flex';
      });
    }

    if (closeCollectiblesBtn) {
      closeCollectiblesBtn.addEventListener('click', () => {
        if (collectiblesModal) collectiblesModal.style.display = 'none';
      });
    }

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        if (settingsModal) settingsModal.style.display = 'flex';
      });
    }

    if (closeSettingsBtn) {
      closeSettingsBtn.addEventListener('click', () => {
        if (settingsModal) settingsModal.style.display = 'none';
      });
    }

    if (controlsBtn) {
      controlsBtn.addEventListener('click', () => {
        this.renderKeybindsUI();
        if (controlsModal) controlsModal.style.display = 'flex';
      });
    }

    if (closeControlsBtn) {
      closeControlsBtn.addEventListener('click', () => {
        if (controlsModal) controlsModal.style.display = 'none';
      });
    }

    // Keybind Reset Handlers
    const resetControlsBtn = document.getElementById('reset-controls-btn');
    if (resetControlsBtn) {
      resetControlsBtn.addEventListener('click', () => {
        this.input.resetKeybinds();
        this.renderKeybindsUI();
      });
    }

    const pauseResetControlsBtn = document.getElementById('pause-reset-controls-btn');
    if (pauseResetControlsBtn) {
      pauseResetControlsBtn.addEventListener('click', () => {
        this.input.resetKeybinds();
        this.renderKeybindsUI();
      });
    }

    // Settings Toggle Handlers
    const setAudioToggle = document.getElementById('settings-audio-toggle');
    if (setAudioToggle) {
      setAudioToggle.addEventListener('click', () => {
        const muted = this.audio.toggleMute();
        setAudioToggle.textContent = muted ? 'DISABLED (MUTED)' : 'ENABLED (ON)';
      });
    }

    const setCamToggle = document.getElementById('settings-cam-toggle');
    if (setCamToggle) {
      setCamToggle.addEventListener('click', () => {
        const newMode = this.cameraSystem.setViewMode();
        setCamToggle.textContent = newMode === 'fps' ? '1ST PERSON (FPS)' : '3RD PERSON (CINEMATIC)';
      });
    }

    const setTodToggle = document.getElementById('settings-tod-toggle');
    if (setTodToggle) {
      setTodToggle.addEventListener('click', () => {
        this.dayTime = (this.dayTime + 0.25) % 1.0;
        const todName = this.dayTime < 0.25 ? 'NIGHT' : (this.dayTime < 0.5 ? 'DAYTIME (SUNNY)' : (this.dayTime < 0.75 ? 'SUNSET' : 'MIDNIGHT'));
        setTodToggle.textContent = todName;
      });
    }

    // Touch Controls Setting Handlers
    const setTouchToggle = document.getElementById('settings-touch-toggle');
    const updateTouchToggleUI = () => {
      if (!this.touch) return;
      const pref = this.touch.getPreference();
      let label = 'AUTO (TOUCH DETECTED)';
      if (pref === 'enabled') label = 'ENABLED (ALWAYS ON)';
      else if (pref === 'disabled') label = 'DISABLED (OFF)';
      if (setTouchToggle) setTouchToggle.textContent = label;

      const touchViewDisplay = document.getElementById('touch-view-display');
      if (touchViewDisplay) touchViewDisplay.textContent = pref.toUpperCase();

      document.querySelectorAll('[data-touch]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-touch') === pref);
      });
    };

    if (setTouchToggle) {
      updateTouchToggleUI();
      setTouchToggle.addEventListener('click', () => {
        if (!this.touch) return;
        const current = this.touch.getPreference();
        const next = current === 'auto' ? 'enabled' : (current === 'enabled' ? 'disabled' : 'auto');
        this.touch.setPreference(next);
        updateTouchToggleUI();
      });
    }

    document.querySelectorAll('[data-touch]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-touch');
        if (this.touch && mode) {
          this.touch.setPreference(mode);
          updateTouchToggleUI();
        }
      });
    });

    // 3. Resume Game from Pause
    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        this.togglePause(false);
      });
    }

    // Return to Main Menu from Pause
    const returnToMainMenu = () => {
      this.togglePause(false);
      if (this.touch) this.touch.onGameEnd();
      if (pauseScreen) pauseScreen.style.display = 'none';
      if (mainMenu) {
        mainMenu.classList.remove('hidden');
        mainMenu.style.display = 'flex';
      }
      document.exitPointerLock();
      this.player.health = this.player.maxHealth;
      this.player.webFluid = this.player.maxWebFluid;
      this.player.position.set(0, 111.73, 0);
      this.player.velocity.set(0, 0, 0);
    };

    const pauseMainMenuBtn = document.getElementById('pause-main-menu-btn');
    if (pauseMainMenuBtn) {
      pauseMainMenuBtn.addEventListener('click', returnToMainMenu);
    }

    const pauseHeaderMenuBtn = document.getElementById('pause-header-menu-btn');
    if (pauseHeaderMenuBtn) {
      pauseHeaderMenuBtn.addEventListener('click', returnToMainMenu);
    }

    // 4. Restart Game at Spawn
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.togglePause(false);
        this.dayTime = 0.25; // Reset to daytime
        this.player.health = this.player.maxHealth;
        this.player.webFluid = this.player.maxWebFluid;
        this.player.position.set(0, 111.73, 0);
        this.player.velocity.set(0, 0, 0);
      });
    }

    // 5. Game Over Respawn
    if (respawnBtn) {
      respawnBtn.addEventListener('click', () => {
        if (gameOverScreen) gameOverScreen.style.display = 'none';
        this.dayTime = 0.25; // Reset to daytime
        this.player.health = this.player.maxHealth;
        this.player.webFluid = this.player.maxWebFluid;
        this.player.position.set(0, 111.73, 0);
        this.player.velocity.set(0, 0, 0);
        this.requestPointerLockSafe();
      });
    }

    // 6. Reliable 1-Click Escape Key Pause Handler
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        const loadingActive = loadingScreen && loadingScreen.style.display !== 'none';
        const menuActive = mainMenu && mainMenu.style.display !== 'none';
        const gameOverActive = gameOverScreen && gameOverScreen.style.display !== 'none';

        if (!loadingActive && !menuActive && !gameOverActive) {
          e.preventDefault();
          this.togglePause(!this.isPaused);
        }
      }
    });

    // 7. Pause Menu Tab Switching & Tactical Map Rendering
    const tabButtons = document.querySelectorAll('.pause-tab-btn');
    const tabContents = document.querySelectorAll('.pause-tab-content');
    const tacticalCanvas = document.getElementById('tactical-map-canvas');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        tabButtons.forEach(b => b.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        const content = document.getElementById(targetTab);
        if (content) content.classList.add('active');

        // If Map tab selected, render tactical city map
        if (targetTab === 'tab-map' && tacticalCanvas) {
          this.hud.renderTacticalMap(tacticalCanvas, this.player, this.portalManager, this.city);
        }
      });
    });

    // 8. Settings Controls Handlers
    const sensSlider = document.getElementById('mouse-sens-slider');
    const sensDisplay = document.getElementById('sens-val-display');
    if (sensSlider) {
      sensSlider.addEventListener('input', (e) => {
        const mult = parseFloat(e.target.value);
        this.input.mouseSensitivity = this.input.baseSensitivity * mult;
        if (sensDisplay) sensDisplay.textContent = `${mult.toFixed(1)}x`;
      });
    }

    const invertCheck = document.getElementById('invert-y-check');
    if (invertCheck) {
      invertCheck.addEventListener('change', (e) => {
        this.input.invertY = e.target.checked;
      });
    }

    // Time of Day selector buttons
    const timeBtns = document.querySelectorAll('[data-time]');
    timeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        timeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-time');
        if (mode === 'day') {
          this.dayTime = 0.25;
        } else if (mode === 'sunset') {
          this.dayTime = 0.02;
        } else if (mode === 'night') {
          this.dayTime = 0.75;
        }
      });
    });

    // Web lift strength selector
    const liftBtns = document.querySelectorAll('[data-lift]');
    const liftDisplay = document.getElementById('lift-val-display');
    liftBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        liftBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-lift');
        if (liftDisplay) liftDisplay.textContent = mode.toUpperCase();
      });
    });

    // 9. Camera View Mode Button & Pause Settings
    const camBtn = document.getElementById('toggle-cam-btn');
    const camDisplay = document.getElementById('cam-view-display');
    const radarCamText = document.getElementById('radar-cam-text');
    const updateCamBtnText = (mode) => {
      const label = mode === 'fps' ? '1ST VIEW' : (mode === 'action' ? 'ACTION' : '3RD VIEW');
      if (radarCamText) radarCamText.textContent = label;
      else if (camBtn) camBtn.textContent = `🎥 ${label}`;
      if (camDisplay) camDisplay.textContent = mode === 'fps' ? '1ST PERSON (FPS)' : (mode === 'action' ? 'ACTION CAM' : '3RD PERSON');
      const camBtns = document.querySelectorAll('[data-cam]');
      camBtns.forEach(b => {
        if (b.getAttribute('data-cam') === mode) b.classList.add('active');
        else b.classList.remove('active');
      });
    };

    if (camBtn) {
      camBtn.addEventListener('click', () => {
        const newMode = this.cameraSystem.setViewMode();
        updateCamBtnText(newMode);
      });
    }

    const camPresetBtns = document.querySelectorAll('[data-cam]');
    camPresetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-cam');
        this.cameraSystem.setViewMode(mode);
        updateCamBtnText(mode);
      });
    });
    this.updateCamBtnText = updateCamBtnText;

    // 10. Audio Toggle
    const radarAudioText = document.getElementById('radar-audio-text');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => {
        const muted = this.audio.toggleMute();
        if (radarAudioText) radarAudioText.textContent = muted ? 'SOUND: OFF' : 'SOUND: ON';
        else audioBtn.textContent = muted ? '🔇 UNMUTE' : '🔊 MUTE';
      });
    }

    // 11. HUD Radar Quick Deck Actions
    const hudPauseBtn = document.getElementById('hud-pause-btn');
    if (hudPauseBtn) {
      hudPauseBtn.addEventListener('click', () => {
        this.togglePause();
      });
    }

    const hudControlsBtn = document.getElementById('hud-controls-btn');
    if (hudControlsBtn) {
      hudControlsBtn.addEventListener('click', () => {
        this.renderKeybindsUI();
        const cm = document.getElementById('controls-modal');
        if (cm) cm.style.display = 'flex';
      });
    }

    // 12. Hero Suit Customizer Lab
    this.setupSuitLab();
  }

  initHeroPreview() {
    const canvas = document.getElementById('hero-preview-canvas');
    if (!canvas) return;

    this.previewScene = new THREE.Scene();
    this.previewCamera = new THREE.PerspectiveCamera(36, canvas.width / canvas.height, 0.1, 50);
    this.previewCamera.position.set(0, 0.05, 5.15);
    this.previewCamera.lookAt(0, 0.02, 0);

    this.previewRenderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true
    });
    this.previewRenderer.setSize(canvas.width, canvas.height);
    this.previewRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Studio Lighting
    const hemi = new THREE.HemisphereLight(0xe0f0ff, 0x1e1b4b, 1.8);
    this.previewScene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
    keyLight.position.set(2, 4, 3);
    this.previewScene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00f0ff, 3.0);
    rimLight.position.set(-2, 2, -2);
    this.previewScene.add(rimLight);

    // Glowing Pedestal Disc
    const pedGeo = new THREE.CylinderGeometry(0.85, 0.90, 0.08, 32);
    const pedMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.8
    });
    const pedestal = new THREE.Mesh(pedGeo, pedMat);
    pedestal.position.set(0, -0.92, 0);
    this.previewScene.add(pedestal);

    const ringGeo = new THREE.TorusGeometry(0.88, 0.02, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const pedRing = new THREE.Mesh(ringGeo, ringMat);
    pedRing.rotation.x = Math.PI / 2;
    pedRing.position.set(0, -0.88, 0);
    this.previewScene.add(pedRing);

    // 1. Spider-Ram Preview Model
    const previewSpiderPlayer = new Player(this.previewScene, null, 'spider_ram');
    previewSpiderPlayer.position.set(0, 0, 0);
    previewSpiderPlayer.mesh.position.set(0, 0, 0);
    this.previewScene.add(previewSpiderPlayer.mesh);

    // 2. Iron-Ram Armored Exo-Suit Preview Model
    const previewIronPlayer = new Player(this.previewScene, null, 'iron_ram');
    previewIronPlayer.position.set(0, 0, 0);
    previewIronPlayer.mesh.position.set(0, 0, 0);
    previewIronPlayer.mesh.visible = false; // Initially hidden
    this.previewScene.add(previewIronPlayer.mesh);

    this.previewHeroes = {
      spider_ram: { player: previewSpiderPlayer, mesh: previewSpiderPlayer.mesh, isLocked: false },
      iron_ram: { player: previewIronPlayer, mesh: previewIronPlayer.mesh, isLocked: false }
    };
    this.selectedHero = 'spider_ram';

    // 3. Tab Switching Handlers
    const heroTabs = document.querySelectorAll('.hero-tab');
    const heroTag = document.querySelector('.preview-tag');
    const heroName = document.querySelector('.hero-name');
    const heroRole = document.querySelector('.hero-role');
    const heroStats = document.querySelector('.hero-stats-row');
    const startBtn = document.getElementById('start-btn');

    heroTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const heroKey = tab.getAttribute('data-hero');
        if (!heroKey || !this.previewHeroes[heroKey]) return;

        heroTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        this.selectedHero = heroKey;

        // Toggle 3D model visibility
        Object.keys(this.previewHeroes).forEach(k => {
          if (this.previewHeroes[k].mesh) {
            this.previewHeroes[k].mesh.visible = (k === heroKey);
          }
        });

        // Update UI details
        if (heroKey === 'iron_ram') {
          if (heroTag) heroTag.textContent = '★ LEAGUE HERO ★';
          if (heroName) heroName.textContent = 'IRON-RAM';
          if (heroRole) heroRole.textContent = 'HEAVY EXO-SUIT & REPULSOR FLIGHT';
          if (heroStats) {
            heroStats.innerHTML = `
              <div class="stat-pill"><span class="stat-lbl">ARMOR</span> <span class="stat-val">10/10</span></div>
              <div class="stat-pill"><span class="stat-lbl">FIREPOWER</span> <span class="stat-val">10/10</span></div>
              <div class="stat-pill"><span class="stat-lbl">BRAWL</span> <span class="stat-val">10/10</span></div>
            `;
          }
          if (startBtn) startBtn.textContent = '▶ PLAY';
        } else {
          if (heroTag) heroTag.textContent = '★ LEAGUE HERO ★';
          if (heroName) heroName.textContent = 'SPIDER-RAM';
          if (heroRole) heroRole.textContent = 'VANGUARD INFILTRATOR & WEB SLINGER';
          if (heroStats) {
            heroStats.innerHTML = `
              <div class="stat-pill"><span class="stat-lbl">SPEED</span> <span class="stat-val">10/10</span></div>
              <div class="stat-pill"><span class="stat-lbl">AGILITY</span> <span class="stat-val">10/10</span></div>
              <div class="stat-pill"><span class="stat-lbl">BRAWL</span> <span class="stat-val">9/10</span></div>
            `;
          }
          if (startBtn) startBtn.textContent = '▶ PLAY';
        }

        if (this.touch) this.touch.updateHeroDisplay(heroKey);
        this.updateSuitLabUI();
      });
    });

    // Interactive Drag Rotation
    this.previewRotY = 0;
    this.isDraggingPreview = false;
    this.prevMouseX = 0;

    canvas.addEventListener('mousedown', (e) => {
      this.isDraggingPreview = true;
      this.prevMouseX = e.clientX;
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingPreview = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDraggingPreview) {
        const deltaX = e.clientX - this.prevMouseX;
        this.previewRotY += deltaX * 0.015;
        this.prevMouseX = e.clientX;
      }
    });

    // Touch support for 3D Hero Preview
    canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        e.preventDefault();
        this.isDraggingPreview = true;
        this.prevMouseX = e.touches[0].clientX;
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      this.isDraggingPreview = false;
    });

    window.addEventListener('touchmove', (e) => {
      if (this.isDraggingPreview && e.touches.length > 0) {
        e.preventDefault();
        const deltaX = e.touches[0].clientX - this.prevMouseX;
        this.previewRotY += deltaX * 0.015;
        this.prevMouseX = e.touches[0].clientX;
      }
    }, { passive: false });

    // Quick Rotate Buttons
    const rotLeft = document.getElementById('btn-rot-left');
    const rotRight = document.getElementById('btn-rot-right');
    if (rotLeft) {
      rotLeft.addEventListener('click', (e) => {
        e.stopPropagation();
        this.previewRotY -= 0.6;
      });
    }
    if (rotRight) {
      rotRight.addEventListener('click', (e) => {
        e.stopPropagation();
        this.previewRotY += 0.6;
      });
    }
  }

  setupSuitLab() {
    const suitDrawer = document.getElementById('suit-lab-drawer');
    if (!suitDrawer) return;

    const btnOpenMain = document.getElementById('btn-open-suit-lab');
    const btnOpenAlt = document.getElementById('btn-open-suit-lab-alt');
    const btnOpenHud = document.getElementById('hud-suit-lab-btn');
    const btnClose = document.getElementById('btn-close-suit-lab');
    const btnDone = document.getElementById('btn-suit-done');
    const btnRandom = document.getElementById('btn-suit-random');
    const btnReset = document.getElementById('btn-suit-reset');

    const openDrawer = () => {
      suitDrawer.style.display = 'flex';
      this.updateSuitLabUI();
    };

    const closeDrawer = () => {
      suitDrawer.style.display = 'none';
    };

    if (btnOpenMain) btnOpenMain.addEventListener('click', openDrawer);
    if (btnOpenAlt) btnOpenAlt.addEventListener('click', openDrawer);
    if (btnOpenHud) {
      btnOpenHud.addEventListener('click', () => {
        openDrawer();
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      });
    }
    if (btnClose) btnClose.addEventListener('click', closeDrawer);
    if (btnDone) btnDone.addEventListener('click', closeDrawer);

    // Nav Category Tabs (Colors, Symbol, Headgear, Accessories/Gear)
    const suitTabs = document.querySelectorAll('.suit-nav-btn');
    const suitPanels = document.querySelectorAll('.suit-tab-pane');

    suitTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const targetTab = tab.getAttribute('data-tab');
        suitTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        suitPanels.forEach(panel => {
          panel.classList.toggle('active', panel.id === targetTab);
        });
      });
    });

    // Helper to get active character targets
    const getActiveTargets = () => {
      const mainMenu = document.getElementById('main-menu');
      const isMenuVisible = mainMenu && mainMenu.style.display !== 'none';
      const activeHeroKey = isMenuVisible ? (this.selectedHero || 'spider_ram') : this.player.characterType;
      const previewPlayer = this.previewHeroes ? this.previewHeroes[activeHeroKey]?.player : null;
      return { activeHeroKey, previewPlayer, inGamePlayer: this.player };
    };

    const applyToActiveHero = (changes) => {
      const { activeHeroKey, previewPlayer, inGamePlayer } = getActiveTargets();
      if (previewPlayer) {
        previewPlayer.applyCustomization(changes);
      }
      if (inGamePlayer && inGamePlayer.characterType === activeHeroKey) {
        inGamePlayer.applyCustomization(changes);
      }
      this.updateSuitLabUI();
    };

    // Color Swatches (Primary, Secondary, Energy)
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const target = swatch.getAttribute('data-type') || swatch.getAttribute('data-color-target');
        const color = swatch.getAttribute('data-color');
        if (!target || !color) return;

        const changes = {};
        if (target === 'primary') changes.primaryColor = color;
        else if (target === 'secondary') changes.secondaryColor = color;
        else if (target === 'energy') changes.energyColor = color;

        applyToActiveHero(changes);
      });
    });

    // Option Cards (Symbols, Headgear, Accessories)
    const customCards = document.querySelectorAll('.custom-card');
    customCards.forEach(card => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const sym = card.getAttribute('data-symbol');
        const gear = card.getAttribute('data-headgear');
        const acc = card.getAttribute('data-accessory');

        if (sym) applyToActiveHero({ symbol: sym });
        if (gear) applyToActiveHero({ headgear: gear });
        if (acc) applyToActiveHero({ accessory: acc });
      });
    });

    // Randomize Button
    if (btnRandom) {
      btnRandom.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const palettePrimary = ['#e11d48', '#1d4ed8', '#00f0ff', '#0f172a', '#f8fafc', '#10b981', '#f59e0b', '#8b5cf6', '#ea580c'];
        const paletteSecondary = ['#1d4ed8', '#e11d48', '#f59e0b', '#94a3b8', '#00f0ff', '#334155', '#84cc16', '#0f172a'];
        const paletteEnergy = ['#00f0ff', '#ff0055', '#00ff88', '#ffe600', '#c084fc', '#ffffff'];
        const symbols = ['sr', 'arc', 'star', 'lightning', 'skull', 'biohazard', 'clean'];
        const headgears = ['classic_horns', 'cyber_horns', 'visor', 'samurai', 'headset', 'cowl'];
        const accessories = ['none', 'jetpack', 'cape', 'pauldrons', 'bandolier', 'holo_wings'];

        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

        applyToActiveHero({
          primaryColor: pick(palettePrimary),
          secondaryColor: pick(paletteSecondary),
          energyColor: pick(paletteEnergy),
          symbol: pick(symbols),
          headgear: pick(headgears),
          accessory: pick(accessories)
        });
      });
    }

    // Default Reset Button
    if (btnReset) {
      btnReset.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const { activeHeroKey } = getActiveTargets();
        const def = HERO_DEFAULT_CUSTOMIZATION[activeHeroKey] || HERO_DEFAULT_CUSTOMIZATION.spider_ram;
        applyToActiveHero(Object.assign({}, def));
      });
    }
  }

  updateSuitLabUI() {
    const mainMenu = document.getElementById('main-menu');
    const isMenuVisible = mainMenu && mainMenu.style.display !== 'none';
    const activeHeroKey = isMenuVisible ? (this.selectedHero || 'spider_ram') : this.player.characterType;
    const previewPlayer = this.previewHeroes ? this.previewHeroes[activeHeroKey]?.player : null;
    const cust = (previewPlayer && previewPlayer.customization) || this.player.customization || HERO_DEFAULT_CUSTOMIZATION[activeHeroKey] || HERO_DEFAULT_CUSTOMIZATION.spider_ram;

    // Subtitle badge
    const badge = document.querySelector('.suit-lab-badge');
    if (badge) {
      badge.textContent = `★ ${activeHeroKey === 'iron_ram' ? 'IRON-RAM EXO-ARMOR' : 'SPIDER-RAM SUIT'} ★`;
    }

    // Update color swatches
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(swatch => {
      const target = swatch.getAttribute('data-type') || swatch.getAttribute('data-color-target');
      const color = swatch.getAttribute('data-color');
      if (!target || !color) return;

      let isMatch = false;
      if (target === 'primary') isMatch = (color.toLowerCase() === (cust.primaryColor || '').toLowerCase());
      else if (target === 'secondary') isMatch = (color.toLowerCase() === (cust.secondaryColor || '').toLowerCase());
      else if (target === 'energy') isMatch = (color.toLowerCase() === (cust.energyColor || '').toLowerCase());

      swatch.classList.toggle('active', isMatch);
      if (isMatch) {
        const title = swatch.getAttribute('title');
        if (title) {
          const lbl = document.getElementById(`label-${target}-color`);
          if (lbl) lbl.textContent = title.toUpperCase();
        }
      }
    });

    // Update option cards (Symbols, Headgear, Accessories)
    const customCards = document.querySelectorAll('.custom-card');
    customCards.forEach(card => {
      const sym = card.getAttribute('data-symbol');
      const gear = card.getAttribute('data-headgear');
      const acc = card.getAttribute('data-accessory');

      if (sym) {
        card.classList.toggle('active', sym === (cust.symbol || cust.emblem));
      } else if (gear) {
        card.classList.toggle('active', gear === cust.headgear);
      } else if (acc) {
        card.classList.toggle('active', acc === cust.accessory);
      }
    });
  }

  updateHeroPreview(dt) {
    if (!this.previewRenderer || !this.previewScene || !this.previewCamera) return;
    const mainMenu = document.getElementById('main-menu');
    if (!mainMenu || mainMenu.style.display === 'none') return;

    // Dynamically resize preview buffer and fit entire character for all mobile screens
    const canvas = document.getElementById('hero-preview-canvas');
    if (canvas) {
      const displayW = canvas.clientWidth;
      const displayH = canvas.clientHeight;
      if (displayW > 0 && displayH > 0 && (canvas.width !== displayW || canvas.height !== displayH)) {
        this.previewRenderer.setSize(displayW, displayH, false);
        this.previewCamera.aspect = displayW / displayH;

        // Auto-frame camera: ensure the hero is framed in the center,
        // displaying the entire character (horns, suit, legs, hooves, and glowing pedestal disc)
        const aspect = displayW / displayH;
        const vFovRad = (this.previewCamera.fov * Math.PI) / 180;
        const halfTan = Math.tan(vFovRad / 2); // ~0.3249 at 36 deg FOV
        // Character + pedestal (-0.96 to 1.08) is ~2.04 units tall.
        // On full-screen canvas, frame with ~3.2 units vertical space (~64% vertical fill)
        const distForHeight = 3.22 / (2 * halfTan); // ~4.95 units
        // Character horizontal span clearance
        const distForWidth = 2.45 / (2 * halfTan * Math.min(1.2, aspect));
        const camDist = Math.max(4.95, distForWidth);

        this.previewCamera.position.set(0, 0.04, camDist);
        this.previewCamera.lookAt(0, 0.04, 0);
        this.previewCamera.updateProjectionMatrix();
      }
    }

    if (!this.isDraggingPreview) {
      this.previewRotY += dt * 0.7; // Gentle auto-rotation
    }

    const currentHero = this.previewHeroes ? this.previewHeroes[this.selectedHero] : null;
    if (currentHero && currentHero.mesh) {
      currentHero.mesh.rotation.y = this.previewRotY;
      currentHero.mesh.position.set(0, 0, 0);

      if (currentHero.player) {
        currentHero.player.animTime = (currentHero.player.animTime || 0) + dt;
        currentHero.player.isGrounded = true;
        currentHero.player.velocity.set(0, 0, 0);
        currentHero.player.animateLimbs(dt);
      } else if (currentHero.data && currentHero.data.head) {
        currentHero.data.animTime = (currentHero.data.animTime || 0) + dt;
        const breathe = Math.sin(currentHero.data.animTime * 3) * 0.015;
        currentHero.data.head.position.y = 0.6 + breathe;
      }
    }

    this.previewRenderer.render(this.previewScene, this.previewCamera);
  }

  renderAchievementsUI() {
    const list = document.getElementById('achievements-list');
    if (!list || !this.achievements) return;

    list.innerHTML = this.achievements.achievements.map(ach => {
      const isDone = ach.unlocked;
      const progressTxt = ach.target ? ` • ${ach.progress || 0}/${ach.target}` : '';
      return `
        <div class="achievement-card ${isDone ? 'unlocked' : ''} tier-${ach.tier.toLowerCase()}">
          <div class="card-icon">${isDone ? ach.icon : '🔒'}</div>
          <div class="card-body">
            <div class="card-title-row">
              <span class="card-title">${ach.title}</span>
              <span class="tier-badge tier-badge-${ach.tier.toLowerCase()}">${ach.tier}</span>
            </div>
            <div class="card-desc">${ach.desc}</div>
            <div class="card-status ${isDone ? 'done' : ''}">${isDone ? '✅ COMPLETED' : `LOCKED${progressTxt}`}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderCollectiblesUI() {
    const list = document.getElementById('collectibles-list');
    if (!list || !this.collectibles) return;

    const collectedIds = this.collectibles.collectedIds;
    list.innerHTML = this.collectibles.itemConfigs.map((item, idx) => {
      const isCollected = collectedIds.has(item.id);
      return `
        <div class="collectible-card ${isCollected ? 'collected' : ''}">
          <div class="card-icon">${isCollected ? '🏆' : '❓'}</div>
          <div class="card-body">
            <div class="card-title-row">
              <span class="card-title">ARTIFACT #${idx + 1}: ${item.name}</span>
              <span class="tier-badge tier-badge-${item.tier.toLowerCase()}">${item.tier}</span>
            </div>
            <div class="card-desc">📍 Location: ${item.desc}</div>
            <div class="card-status ${isCollected ? 'done' : ''}">${isCollected ? '⭐ FOUND & ACQUIRED' : 'HIDDEN IN METROPOLIS'}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  renderKeybindsUI() {
    if (!this.input || !this.input.keybinds) return;
    const listElements = [
      document.getElementById('controls-keybind-list'),
      document.getElementById('pause-keybind-list')
    ];

    const actions = Object.keys(this.input.keybinds);

    listElements.forEach(list => {
      if (!list) return;
      list.innerHTML = actions.map(action => {
        const label = KEYBIND_LABELS[action] || action;
        const currentKey = this.input.formatKeyName(this.input.keybinds[action]);
        return `
          <div class="keybind-row">
            <div class="keybind-info">
              <span class="keybind-action-name">${label}</span>
            </div>
            <button class="keybind-btn" data-action="${action}">${currentKey}</button>
          </div>
        `;
      }).join('');

      // Add remapping click listener to each button
      const buttons = list.querySelectorAll('.keybind-btn');
      buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const actionKey = btn.getAttribute('data-action');
          if (!actionKey) return;

          // Clear listening state on all other buttons
          document.querySelectorAll('.keybind-btn').forEach(b => {
            b.classList.remove('listening');
            const a = b.getAttribute('data-action');
            if (a) b.textContent = this.input.formatKeyName(this.input.keybinds[a]);
          });

          btn.classList.add('listening');
          btn.textContent = 'PRESS ANY KEY...';

          const onKeyDown = (keyEv) => {
            keyEv.preventDefault();
            keyEv.stopPropagation();
            window.removeEventListener('keydown', onKeyDown, true);
            window.removeEventListener('mousedown', onMouseDown, true);

            this.input.keybinds[actionKey] = keyEv.code;
            this.input.saveKeybinds();
            this.renderKeybindsUI();
          };

          const onMouseDown = (mouseEv) => {
            mouseEv.preventDefault();
            mouseEv.stopPropagation();
            window.removeEventListener('keydown', onKeyDown, true);
            window.removeEventListener('mousedown', onMouseDown, true);

            const mouseCode = `Mouse${mouseEv.button}`;
            this.input.keybinds[actionKey] = mouseCode;
            this.input.saveKeybinds();
            this.renderKeybindsUI();
          };

          setTimeout(() => {
            window.addEventListener('keydown', onKeyDown, { capture: true, once: true });
            window.addEventListener('mousedown', onMouseDown, { capture: true, once: true });
          }, 50);
        });
      });
    });
  }

  // Toggle Pause Menu State & Refresh UI
  togglePause(state) {
    this.isPaused = state !== undefined ? state : !this.isPaused;
    const pauseScreen = document.getElementById('pause-screen');
    const tacticalCanvas = document.getElementById('tactical-map-canvas');

    if (this.isPaused) {
      if (pauseScreen) pauseScreen.style.display = 'flex';
      document.exitPointerLock();

      // Refresh Keybind UI in pause menu
      this.renderKeybindsUI();

      // Update Pause Mission Info
      const mission = this.portalManager.getMissionProgress();
      const pTitle = document.getElementById('pause-mission-title');
      const pStatus = document.getElementById('pause-mission-status');
      if (pTitle && mission) pTitle.textContent = mission.zoneTitle || 'Active Crime Incursion';
      if (pStatus && mission) {
        pStatus.textContent = mission.isComplete
          ? 'District Cleared! Scanning metropolis for next crime hotspot...'
          : `Defeat ${mission.total - mission.defeated} remaining hostile targets in this zone!`;
      }

      // Render Tactical Map
      if (tacticalCanvas) {
        this.hud.renderTacticalMap(tacticalCanvas, this.player, this.portalManager, this.city);
      }
    } else {
      if (pauseScreen) pauseScreen.style.display = 'none';
      this.requestPointerLockSafe();
    }
  }

  requestPointerLockSafe() {
    if (!this.container || document.pointerLockElement === this.container) return;
    try {
      const p = this.container.requestPointerLock();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Handled browser pointer lock security debounce safely
        });
      }
    } catch (e) {
      // Safe fallback
    }
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    if (this.touch) {
      this.touch.checkOrientation();
    }
  }

  // Drivable Vehicles: Enter/Exit, Acceleration, Steering & Collision Physics
  handleVehicleInteraction(dt) {
    const promptEl = document.getElementById('vehicle-prompt');
    const trafficCars = this.city.trafficCars || [];

    if (this.player.isDriving && this.player.drivenCar) {
      const car = this.player.drivenCar;
      if (this.touch) this.touch.setDriveVisible(true, true);
      if (promptEl) {
        promptEl.style.display = 'block';
        promptEl.innerHTML = '🚗 STEER WITH JOYSTICK / KEYS • TAP <span class="prompt-key">EXIT</span> OR PRESS <span class="prompt-key">[F]</span>';
      }

      // Exit car (or jump out)
      if (this.input.enterVehiclePressed) {
        this.player.isDriving = false;
        car.isPlayerDriven = false;
        this.player.drivenCar = null;
        if (this.touch) this.touch.setDriveVisible(false, false);
        const exitYaw = car.steerAngle !== undefined ? car.steerAngle : car.mesh.rotation.y;
        this.player.velocity.set(Math.sin(exitYaw) * 12, 16.0, Math.cos(exitYaw) * 12);
        this.player.isGrounded = false;
        this.player.canDoubleJump = true;
        if (this.audio) this.audio.playJump();
        if (promptEl) promptEl.style.display = 'none';
        return;
      }

      car.crashCooldown = Math.max(0, (car.crashCooldown || 0) - dt);

      // Driving physics (supports both WASD keyboard and touch virtual joystick)
      const maxFwdSpeed = 46.0;
      const maxRevSpeed = -18.0;
      const accel = 42.0;
      const brake = 50.0;
      const steerRate = 2.5;

      const fwd = this.input.moveForward || (this.input.moveZ !== undefined && this.input.moveZ < -0.2);
      const bwd = this.input.moveBackward || (this.input.moveZ !== undefined && this.input.moveZ > 0.2);
      const left = this.input.moveLeft || (this.input.moveX !== undefined && this.input.moveX < -0.2);
      const right = this.input.moveRight || (this.input.moveX !== undefined && this.input.moveX > 0.2);

      if (fwd) {
        car.currentSpeed = Math.min(maxFwdSpeed, (car.currentSpeed || 0) + accel * dt);
      } else if (bwd) {
        car.currentSpeed = Math.max(maxRevSpeed, (car.currentSpeed || 0) - brake * dt);
      } else {
        car.currentSpeed = (car.currentSpeed || 0) * Math.pow(0.92, dt * 60);
      }

      if (Math.abs(car.currentSpeed) > 0.3) {
        const steerDir = Math.sign(car.currentSpeed);
        if (left) {
          car.steerAngle = (car.steerAngle || 0) + steerRate * dt * steerDir;
        }
        if (right) {
          car.steerAngle = (car.steerAngle || 0) - steerRate * dt * steerDir;
        }
      }

      const driveDir = new THREE.Vector3(Math.sin(car.steerAngle || 0), 0, Math.cos(car.steerAngle || 0));
      const nextPos = car.mesh.position.clone().addScaledVector(driveDir, (car.currentSpeed || 0) * dt);
      nextPos.y = 0.28;

      // Full AABB Collision test against tall city buildings & island perimeter
      // Note: y: 0.8 to 2.4 allows cars to freely cruise across sidewalks, lots & plazas!
      const testBox = new THREE.Box3(
        new THREE.Vector3(nextPos.x - 1.8, 0.8, nextPos.z - 1.8),
        new THREE.Vector3(nextPos.x + 1.8, 2.4, nextPos.z + 1.8)
      );

      let collided = false;
      for (let i = 0; i < this.city.buildingColliders.length; i++) {
        const bBox = this.city.buildingColliders[i];
        // Only collide with actual vertical building facades (ignore flat ground, lot slabs, & sidewalks)
        if (bBox.max.y < 2.8) continue;
        if (testBox.intersectsBox(bBox)) {
          collided = true;
          break;
        }
      }

      if (Math.abs(nextPos.x) > 560 || Math.abs(nextPos.z) > 560) {
        collided = true;
      }

      if (collided) {
        car.currentSpeed = -(car.currentSpeed || 0) * 0.35;
        if (car.crashCooldown <= 0) {
          car.crashCooldown = 0.45;
          this.cameraSystem.addShake(0.35);
          if (this.audio) {
            if (typeof this.audio.playVehicleCrash === 'function') this.audio.playVehicleCrash();
            else if (typeof this.audio.playEnemyHit === 'function') this.audio.playEnemyHit();
          }
        }
      } else {
        car.mesh.position.copy(nextPos);
        car.mesh.rotation.y = car.steerAngle || 0;
        if (car.box) car.box.setFromObject(car.mesh);
      }

      // Sync player to driver seat
      this.player.position.copy(car.mesh.position).add(new THREE.Vector3(0, 1.2, 0));
      this.player.velocity.copy(driveDir).multiplyScalar(car.currentSpeed || 0);

    } else {
      // Find nearest car to enter
      let nearestCar = null;
      let nearestDist = 5.0;

      for (let i = 0; i < trafficCars.length; i++) {
        const car = trafficCars[i];
        const dist = this.player.position.distanceTo(car.mesh.position);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestCar = car;
        }
      }

      if (nearestCar && !this.player.isSwinging && !this.player.isWallCrawling) {
        if (this.touch) this.touch.setDriveVisible(true, false);
        if (promptEl) {
          promptEl.style.display = 'block';
          promptEl.innerHTML = '🚗 TAP <span class="prompt-key">DRIVE</span> OR PRESS <span class="prompt-key">[F]</span> TO DRIVE VEHICLE';
        }

        if (this.input.enterVehiclePressed) {
          this.player.isDriving = true;
          this.player.drivenCar = nearestCar;
          nearestCar.isPlayerDriven = true;
          nearestCar.currentSpeed = 0;
          nearestCar.steerAngle = nearestCar.mesh.rotation.y;
          if (this.audio) this.audio.playWebZip();
          if (this.touch) this.touch.setDriveVisible(true, true);
        }
      } else {
        if (this.touch) this.touch.setDriveVisible(false, false);
        if (promptEl && promptEl.style.display !== 'none') {
          promptEl.style.display = 'none';
        }
      }
    }
  }

  // Update Atmosphere, Day/Night Cycle (Fast night transition to day)
  updateAtmosphere(time, dt) {
    const sunAngle = this.dayTime * Math.PI * 2;
    const sunY = Math.sin(sunAngle);
    const sunX = Math.cos(sunAngle);

    // Fast night time cycle (5x faster) so player gets back to daytime quickly
    const currentSpeed = sunY < 0 ? this.daySpeed * 5.0 : this.daySpeed;
    this.dayTime = (this.dayTime + currentSpeed * dt) % 1.0;

    this.sunLight.position.set(sunX * 180, sunY * 180, 80);
    this.sunLight.position.add(this.player.position);
    this.sunLight.target.position.copy(this.player.position);

    // Light color & intensity adjustments
    if (sunY > 0) {
      // Day
      this.sunLight.intensity = Math.max(0.4, sunY * 2.8);
      this.sunLight.color.setHSL(0.1, 0.3, 0.95);
      if (this.hemiLight) this.hemiLight.intensity = 1.4 + sunY * 0.4;
    } else {
      // Night (Cyberpunk neon ambient)
      this.sunLight.intensity = 0.3;
      this.sunLight.color.setHSL(0.65, 0.8, 0.5);
      if (this.hemiLight) this.hemiLight.intensity = 0.8;
    }

    // Sky Dome position follows camera so celestial horizon never shifts
    if (this.skyMesh && this.camera) {
      this.skyMesh.position.copy(this.camera.position);
    }

    // Sky Dome uniform updates
    this.skyMat.uniforms.uTime.value = time;
    this.skyMat.uniforms.uSunPosition.value.set(sunX, sunY, 0.5).normalize();
  }

  // Main Game Loop
  animate() {
    requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const elapsedTime = this.clock.getElapsedTime();

    if (!this.isPaused && !(this.touch && this.touch.isOrientationBlocked)) {
      // 1. Camera Look Direction & Exact Crosshair Surface Reticle
      const lookDir = this.cameraSystem.getLookDirection();
      const aimOrigin = this.camera.position;
      const trafficCars = this.city.trafficCars || [];
      const isIronRam = this.player.characterType === 'iron_ram';

      if (!isIronRam) {
        this.webSystem.updateReticle(aimOrigin, lookDir, this.city.buildingColliders, trafficCars, this.player.position);
      } else {
        this.webSystem.reticle.visible = false;
        this.webSystem.webMesh.visible = false;
        this.webSystem.anchorRing.visible = false;
      }

      // 2. Vehicle Driving Interaction & Physics
      this.handleVehicleInteraction(dt);

      // 3. Input Handling - Character Specific (Spider-Ram webs vs Iron-Ram power suit)
      if (!this.player.isDriving) {
        if (!isIronRam) {
          if (this.input.swingPressed && !this.player.isSwinging) {
            const target = this.webSystem.findBestAnchor(aimOrigin, lookDir, this.city.buildingColliders, trafficCars, 95.0, this.player.position);
            this.webSystem.attachWeb(this.player, target);
          }

          if (this.input.swingReleased && this.player.isSwinging) {
            this.webSystem.releaseWeb(this.player, this.input);
          }

          if (this.input.webShootPressed) {
            this.webSystem.shootWebProjectile(this.player, lookDir);
          }
        }

        this.player.handleInput(this.input, lookDir, dt);

        // 4. Physics & Kinematics
        if (!isIronRam && this.player.isSwinging && this.player.swingAnchor) {
          this.physics.applyWebSwingPhysics(this.player, this.player.swingAnchor, this.player.swingRopeLength, this.input.scrollDelta, dt);
        }

        this.physics.integrate(this.player, dt);
        this.physics.resolveCollisions(this.player, this.city.buildingColliders, dt);
      }

      // 5. Update Player, Projectiles, Web, Portals, Collectibles & City
      this.player.update(dt);

      const allEnemies = this.portalManager.getAllEnemies();
      if (isIronRam) {
        this.player.updateProjectiles(dt, allEnemies, this.city.buildingColliders, trafficCars);
      } else {
        this.webSystem.update(this.player, allEnemies, dt, trafficCars);
      }

      this.portalManager.update(this.player, this.city.buildingColliders, elapsedTime, dt);
      this.city.update(dt);

      // Collectibles Magnetism & Pickup Updates
      if (this.collectibles) {
        this.collectibles.update(this.player, dt);
        this.hud.updateCollectibles(this.collectibles.getCollectedCount(), this.collectibles.getTotalCount());
      }

      // Achievement Progression Checks
      if (this.achievements) {
        if (this.player.isSwinging) {
          this.achievements.unlock('first_web');
        }
        if (this.player.isFlying) {
          this.achievements.unlock('iron_flight');
          if (this.player.velocity.length() > 38.0) {
            this.achievements.unlock('supersonic_flight');
          }
        }
        if (this.player.repulsorBolts && this.player.repulsorBolts.length > 0) {
          this.achievements.unlock('repulsor_blast');
        }
        if (this.player.uniBeamActive) {
          this.achievements.unlock('unibeam_surge');
        }
        if (this.player.isGroundSlamming) {
          this.achievements.unlock('ground_slam');
        }
        if (this.player.isDriving) {
          this.achievements.unlock('drive_car');
          if (this.player.drivenCar && Math.abs(this.player.drivenCar.currentSpeed || 0) > 35) {
            this.achievements.unlock('speed_demon');
          }
        }
        if (this.player.isTuckRolling && !this._lastTuckRoll) {
          this.achievements.addProgress('tuck_roll', 1);
        }
        this._lastTuckRoll = this.player.isTuckRolling;

        if (this.player.isWallCrawling && this.player.velocity.y > 1.5) {
          this.achievements.addProgress('wall_climb_100', this.player.velocity.y * dt);
        }
        if (this.player.comboCount >= 10) {
          this.achievements.unlock('combo_10');
        }
        if (this.player.position.y >= 111.0 && Math.hypot(this.player.position.x, this.player.position.z) < 25) {
          this.achievements.unlock('summit_conqueror');
        }

        // Collectibles milestone achievements
        if (this.collectibles) {
          const colCount = this.collectibles.getCollectedCount();
          if (colCount >= 5) this.achievements.unlock('collect_5');
          if (colCount >= 10) this.achievements.unlock('collect_10');
          if (colCount >= 15) this.achievements.unlock('all_collectibles');
        }

        // Syndicate incursion clearance achievements
        const missionProg = this.portalManager.getMissionProgress();
        if (missionProg) {
          if (missionProg.defeated >= 15) {
            this.achievements.unlock('league_veteran');
          }
          if (missionProg.isComplete) {
            this.achievements.unlock('portal_wave');
          }
        }
      }

      // 6. Atmosphere & Sky
      this.updateAtmosphere(elapsedTime, dt);

      // 7. Camera Follow & Mode Sync
      this.cameraSystem.update(this.player, this.input, dt);
      if (this.updateCamBtnText && this._lastCamMode !== this.cameraSystem.viewMode) {
        this._lastCamMode = this.cameraSystem.viewMode;
        this.updateCamBtnText(this.cameraSystem.viewMode);
      }

      // 8. HUD & Minimap
      this.hud.update(this.player, this.portalManager, this.city, dt);

      // 9. Hold [M] Tactical Satellite Map Real-Time Display
      const holdMapOverlay = document.getElementById('hold-map-overlay');
      const holdMapCanvas = document.getElementById('hold-map-canvas');
      const holdMapCoords = document.getElementById('hold-map-coords');

      if (this.input.showMap) {
        if (holdMapOverlay && holdMapOverlay.style.display !== 'flex') {
          holdMapOverlay.style.display = 'flex';
        }
        if (holdMapCanvas) {
          this.hud.renderTacticalMap(holdMapCanvas, this.player, this.portalManager, this.city);
        }
        if (holdMapCoords) {
          const px = Math.round(this.player.position.x);
          const pz = Math.round(this.player.position.z);
          const py = Math.round(this.player.position.y);
          holdMapCoords.textContent = `COORDS: X: ${px} | Z: ${pz} | ALT: ${py}M`;
        }
      } else {
        if (holdMapOverlay && holdMapOverlay.style.display !== 'none') {
          holdMapOverlay.style.display = 'none';
        }
      }

      // 10. Check Game Over
      if (this.player.health <= 0) {
        const gameOverScreen = document.getElementById('game-over-screen');
        if (gameOverScreen && gameOverScreen.style.display !== 'flex') {
          gameOverScreen.style.display = 'flex';
          document.exitPointerLock();
        }
      }

      // Reset single-frame inputs
      this.input.endFrame();
    }

    // Always update 3D Hero Preview if Main Menu is active
    this.updateHeroPreview(dt);

    // Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }
}

// Start Game on load
window.addEventListener('DOMContentLoaded', () => {
  new Game();
});
