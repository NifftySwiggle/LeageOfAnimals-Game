import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class CityGenerator {
  constructor(scene) {
    this.scene = scene;
    this.citySize = 20; // 20x20 open-world grid (~1200m x 1200m area, silky smooth 60+ FPS)
    this.blockSize = 34; // Size of each block in world units
    this.roadWidth = 26; // Wide spacious avenues (6-8 lanes)
    this.cellSize = this.blockSize + this.roadWidth; // 60 units per grid cell

    this.buildingColliders = []; // Array of THREE.Box3 for collision & raycasting
    this.swingAnchors = []; // Rooftop corners, cranes, antennas, lamp posts for smart web hooking
    this.trafficCars = []; // Dynamic street vehicles
    this.pixelTextures = {};
    this.materials = {};

    this.initTextures();
    this.initMaterials();
  }

  // Generate procedural pixel-art style and architectural textures via Canvas
  initTextures() {
    // 1. Skyscraper Pixel Window Texture
    const winCanvas = document.createElement('canvas');
    winCanvas.width = 128;
    winCanvas.height = 128;
    const ctx = winCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    // Dark slate facade
    ctx.fillStyle = '#181e29';
    ctx.fillRect(0, 0, 128, 128);

    // Architectural windows
    for (let y = 6; y < 124; y += 12) {
      for (let x = 6; x < 124; x += 12) {
        const rand = Math.random();
        if (rand > 0.35) {
          ctx.fillStyle = rand > 0.8 ? '#7dd3fc' : (rand > 0.6 ? '#fef08a' : '#fed7aa');
        } else {
          ctx.fillStyle = '#0f172a';
        }
        ctx.fillRect(x, y, 8, 8);
      }
    }
    const winTex = new THREE.CanvasTexture(winCanvas);
    winTex.magFilter = THREE.NearestFilter;
    winTex.minFilter = THREE.LinearMipMapLinearFilter;
    winTex.wrapS = THREE.RepeatWrapping;
    winTex.wrapT = THREE.RepeatWrapping;
    this.pixelTextures.windows = winTex;

    // 2. Brick / Shop Pixel Texture
    const brickCanvas = document.createElement('canvas');
    brickCanvas.width = 64;
    brickCanvas.height = 64;
    const bCtx = brickCanvas.getContext('2d');
    bCtx.imageSmoothingEnabled = false;
    bCtx.fillStyle = '#4a2e2b';
    bCtx.fillRect(0, 0, 64, 64);
    for (let y = 0; y < 64; y += 8) {
      for (let x = (y % 16 === 0 ? 0 : 8); x < 64; x += 16) {
        bCtx.fillStyle = (x + y) % 3 === 0 ? '#5c3834' : '#382220';
        bCtx.fillRect(x, y, 14, 6);
      }
    }
    const brickTex = new THREE.CanvasTexture(brickCanvas);
    brickTex.magFilter = THREE.NearestFilter;
    brickTex.wrapS = THREE.RepeatWrapping;
    brickTex.wrapT = THREE.RepeatWrapping;
    this.pixelTextures.brick = brickTex;

    // 3. Directional Road Texture: Z-Axis Avenue (North-South / Alleyway direction)
    const rzCanvas = document.createElement('canvas');
    rzCanvas.width = 128;
    rzCanvas.height = 128;
    const rzCtx = rzCanvas.getContext('2d');
    rzCtx.fillStyle = '#181b22'; // Dark smooth asphalt
    rzCtx.fillRect(0, 0, 128, 128);

    // Subtle asphalt noise
    for (let i = 0; i < 400; i++) {
      rzCtx.fillStyle = Math.random() > 0.5 ? '#1f242e' : '#14171d';
      rzCtx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }

    // Outer solid white road shoulder lines (running along Y/Z)
    rzCtx.fillStyle = '#cbd5e1';
    rzCtx.fillRect(6, 0, 3, 128);
    rzCtx.fillRect(119, 0, 3, 128);

    // Center double yellow line (running along Y/Z)
    rzCtx.fillStyle = '#f59e0b';
    rzCtx.fillRect(61, 0, 2, 128);
    rzCtx.fillRect(65, 0, 2, 128);

    // Dashed white lane dividers (running along Y/Z)
    rzCtx.fillStyle = '#e2e8f0';
    for (let y = 6; y < 128; y += 24) {
      rzCtx.fillRect(34, y, 2, 12);
      rzCtx.fillRect(92, y, 2, 12);
    }

    const roadZTex = new THREE.CanvasTexture(rzCanvas);
    roadZTex.magFilter = THREE.LinearFilter;
    roadZTex.minFilter = THREE.LinearMipMapLinearFilter;
    roadZTex.wrapS = THREE.RepeatWrapping;
    roadZTex.wrapT = THREE.RepeatWrapping;
    this.pixelTextures.roadZ = roadZTex;

    // 4. Directional Road Texture: X-Axis Avenue (East-West direction)
    const rxCanvas = document.createElement('canvas');
    rxCanvas.width = 128;
    rxCanvas.height = 128;
    const rxCtx = rxCanvas.getContext('2d');
    rxCtx.fillStyle = '#181b22';
    rxCtx.fillRect(0, 0, 128, 128);

    for (let i = 0; i < 400; i++) {
      rxCtx.fillStyle = Math.random() > 0.5 ? '#1f242e' : '#14171d';
      rxCtx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2);
    }

    // Outer solid white road shoulder lines (running along X)
    rxCtx.fillStyle = '#cbd5e1';
    rxCtx.fillRect(0, 6, 128, 3);
    rxCtx.fillRect(0, 119, 128, 3);

    // Center double yellow line (running along X)
    rxCtx.fillStyle = '#f59e0b';
    rxCtx.fillRect(0, 61, 128, 2);
    rxCtx.fillRect(0, 65, 128, 2);

    // Dashed white lane dividers (running along X)
    rxCtx.fillStyle = '#e2e8f0';
    for (let x = 6; x < 128; x += 24) {
      rxCtx.fillRect(x, 34, 12, 2);
      rxCtx.fillRect(x, 92, 12, 2);
    }

    const roadXTex = new THREE.CanvasTexture(rxCanvas);
    roadXTex.magFilter = THREE.LinearFilter;
    roadXTex.minFilter = THREE.LinearMipMapLinearFilter;
    roadXTex.wrapS = THREE.RepeatWrapping;
    roadXTex.wrapT = THREE.RepeatWrapping;
    this.pixelTextures.roadX = roadXTex;

    // 5. Crossroads Intersection Texture (with Zebra Crosswalks on all 4 approaches)
    const intCanvas = document.createElement('canvas');
    intCanvas.width = 128;
    intCanvas.height = 128;
    const intCtx = intCanvas.getContext('2d');
    intCtx.fillStyle = '#181b22';
    intCtx.fillRect(0, 0, 128, 128);

    // Zebra Crosswalks (North, South, East, West borders)
    intCtx.fillStyle = '#f8fafc';
    for (let x = 12; x < 116; x += 10) {
      intCtx.fillRect(x, 4, 6, 14);
      intCtx.fillRect(x, 110, 6, 14);
    }
    for (let y = 12; y < 116; y += 10) {
      intCtx.fillRect(4, y, 14, 6);
      intCtx.fillRect(110, y, 14, 6);
    }

    // Stop lines
    intCtx.fillStyle = '#cbd5e1';
    intCtx.fillRect(10, 20, 108, 2);
    intCtx.fillRect(10, 106, 108, 2);
    intCtx.fillRect(20, 10, 2, 108);
    intCtx.fillRect(106, 10, 2, 108);

    const intTex = new THREE.CanvasTexture(intCanvas);
    intTex.magFilter = THREE.LinearFilter;
    intTex.minFilter = THREE.LinearMipMapLinearFilter;
    this.pixelTextures.intersection = intTex;

    // 6. Concrete Sidewalk Paver Texture
    const swCanvas = document.createElement('canvas');
    swCanvas.width = 64;
    swCanvas.height = 64;
    const swCtx = swCanvas.getContext('2d');
    swCtx.fillStyle = '#94a3b8'; // Stone concrete
    swCtx.fillRect(0, 0, 64, 64);

    // Paver grid tiles
    swCtx.strokeStyle = '#64748b';
    swCtx.lineWidth = 1;
    for (let p = 0; p <= 64; p += 16) {
      swCtx.beginPath();
      swCtx.moveTo(p, 0);
      swCtx.lineTo(p, 64);
      swCtx.stroke();

      swCtx.beginPath();
      swCtx.moveTo(0, p);
      swCtx.lineTo(64, p);
      swCtx.stroke();
    }
    for (let i = 0; i < 80; i++) {
      swCtx.fillStyle = Math.random() > 0.5 ? '#cbd5e1' : '#475569';
      swCtx.fillRect(Math.random() * 64, Math.random() * 64, 1, 1);
    }

    const swTex = new THREE.CanvasTexture(swCanvas);
    swTex.magFilter = THREE.NearestFilter;
    swTex.wrapS = THREE.RepeatWrapping;
    swTex.wrapT = THREE.RepeatWrapping;
    this.pixelTextures.sidewalk = swTex;

    // 7. Striped Canopy / Awning Texture
    const cCanvas = document.createElement('canvas');
    cCanvas.width = 32;
    cCanvas.height = 32;
    const cCtx = cCanvas.getContext('2d');
    cCtx.fillStyle = '#dc2626'; // Deep red
    cCtx.fillRect(0, 0, 32, 32);
    cCtx.fillStyle = '#f8fafc'; // White stripes
    for (let x = 0; x < 32; x += 8) {
      cCtx.fillRect(x, 0, 4, 32);
    }
    const cTex = new THREE.CanvasTexture(cCanvas);
    cTex.magFilter = THREE.NearestFilter;
    cTex.wrapS = THREE.RepeatWrapping;
    cTex.wrapT = THREE.RepeatWrapping;
    this.pixelTextures.canopy = cTex;

    // 8. Custom Overhanging Cyberpunk Neon Billboards (Created by NifftySwiggle)
    this.billboardTextures = this.createBillboardTextures();
  }

  createBillboardTextures() {
    const ads = [
      {
        badge: '★ OFFICIAL CREATOR WEBSITE ★',
        title: 'NIFFTYSWIGGLE',
        url: 'https://nifftyswiggle.com',
        bg: '#00f0ff', // Electric Cyan
        glow: '#00f0ff',
        titleColor: '#0a0a0a',
        urlColor: '#ffe600' // Bright gold in black bar
      },
      {
        badge: '★ VISIT CREATOR SITE ★',
        title: 'NIFFTYSWIGGLE.COM',
        url: 'https://nifftyswiggle.com',
        bg: '#ff007f', // Hot Magenta
        glow: '#ff007f',
        titleColor: '#ffffff',
        urlColor: '#00f0ff' // Electric cyan in black bar
      },
      {
        badge: '★ OPEN SOURCE REPOSITORY ★',
        title: 'GITHUB',
        url: 'https://github.com/NifftySwiggle/',
        bg: '#ffe600', // Bright Cyber Yellow
        glow: '#ffe600',
        titleColor: '#0a0a0a',
        urlColor: '#00f0ff' // Electric cyan in black bar
      },
      {
        badge: '★ OFFICIAL SOURCE CODE ★',
        title: 'GITHUB',
        url: 'https://github.com/NifftySwiggle/',
        bg: '#00ff66', // Neon Lime
        glow: '#00ff66',
        titleColor: '#0a0a0a',
        urlColor: '#ffffff' // Crisp white in black bar
      },
      {
        badge: '★ OFFICIAL TWITTER / X ★',
        title: 'TWITTER / X',
        url: 'https://x.com/Nifftyswiggle',
        bg: '#0f172a', // Deep Midnight Blue
        glow: '#00f0ff',
        titleColor: '#00f0ff',
        urlColor: '#ffe600' // Bright gold in black bar
      },
      {
        badge: '★ SPIDER-RAM CREATOR ★',
        title: 'NIFFTYSWIGGLE',
        url: 'https://nifftyswiggle.com',
        bg: '#ff5500', // Blazing Sunset Orange
        glow: '#ff5500',
        titleColor: '#ffffff',
        urlColor: '#ffe600' // Bright gold in black bar
      }
    ];

    return ads.map(ad => {
      const bCanvas = document.createElement('canvas');
      bCanvas.width = 2048;
      bCanvas.height = 1024;
      const bCtx = bCanvas.getContext('2d');
      bCtx.imageSmoothingEnabled = true;
      bCtx.imageSmoothingQuality = 'high';

      // 1. High-Contrast Base Background
      bCtx.fillStyle = ad.bg;
      bCtx.fillRect(0, 0, 2048, 1024);

      // Subtle diagonal hazard stripes on border edge
      bCtx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      for (let s = -1024; s < 3072; s += 64) {
        bCtx.beginPath();
        bCtx.moveTo(s, 0);
        bCtx.lineTo(s + 32, 0);
        bCtx.lineTo(s + 32 - 1024, 1024);
        bCtx.lineTo(s - 1024, 1024);
        bCtx.closePath();
        bCtx.fill();
      }

      // 2. Crisp Outer Bezel Frame
      bCtx.strokeStyle = '#000000';
      bCtx.lineWidth = 36;
      bCtx.strokeRect(18, 18, 2012, 988);

      bCtx.strokeStyle = '#ffffff';
      bCtx.lineWidth = 10;
      bCtx.strokeRect(48, 48, 1952, 928);

      // 3. Top Badge Pill Banner
      bCtx.fillStyle = '#0a0a0a';
      bCtx.beginPath();
      bCtx.roundRect(460, 70, 1128, 120, 60);
      bCtx.fill();
      bCtx.strokeStyle = '#ffffff';
      bCtx.lineWidth = 6;
      bCtx.stroke();

      bCtx.fillStyle = '#ffffff';
      bCtx.textAlign = 'center';
      bCtx.textBaseline = 'middle';
      bCtx.font = '700 52px "Segoe UI", Arial, sans-serif';
      bCtx.fillText(ad.badge, 1024, 130);

      // Helper function: Dynamically fit crisp, clean, readable text
      const renderFitted = (text, centerY, maxW, maxFont, fontFace, fillCol) => {
        let fontSize = maxFont;
        bCtx.font = `700 ${fontSize}px ${fontFace}`;
        while (bCtx.measureText(text).width > maxW && fontSize > 24) {
          fontSize -= 2;
          bCtx.font = `700 ${fontSize}px ${fontFace}`;
        }
        bCtx.fillStyle = fillCol;
        bCtx.fillText(text, 1024, centerY);
      };

      // 4. Main Title - High clarity, bold yet clean
      renderFitted(ad.title, 460, 1800, 180, '"Segoe UI", "Helvetica Neue", Arial, sans-serif', ad.titleColor || '#0a0a0a');

      // 5. Bottom URL Bar Pill (Deep black container with high-luminance neon text)
      bCtx.fillStyle = '#0a0a0a';
      bCtx.beginPath();
      bCtx.roundRect(100, 730, 1848, 180, 90);
      bCtx.fill();
      bCtx.strokeStyle = ad.bg === '#0f172a' ? '#00f0ff' : ad.bg;
      bCtx.lineWidth = 10;
      bCtx.stroke();

      // Full URL fitted with high-luminance, crystal-clear typography (NEVER dark on dark)
      renderFitted(ad.url, 820, 1720, 78, '"Consolas", "Courier New", "Segoe UI", monospace', ad.urlColor || '#00f0ff');

      const tex = new THREE.CanvasTexture(bCanvas);
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 16; // Crystal clear at sharp oblique angles!
      tex.needsUpdate = true;
      return { tex, glow: ad.glow };
    });
  }

  initMaterials() {
    this.materials.skyscraper = new THREE.MeshStandardMaterial({
      map: this.pixelTextures.windows,
      roughness: 0.35,
      metalness: 0.35,
      emissive: 0x0f172a,
      emissiveIntensity: 0.15
    });

    this.materials.midrise = new THREE.MeshStandardMaterial({
      map: this.pixelTextures.brick,
      roughness: 0.75,
      metalness: 0.1
    });

    this.materials.shop = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.65
    });

    // Solid concrete/slate rooftop material without window grids
    this.materials.roof = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.85,
      metalness: 0.1
    });

    this.materials.sidewalk = new THREE.MeshStandardMaterial({
      map: this.pixelTextures.sidewalk,
      roughness: 0.85,
      metalness: 0.05
    });

    // Polygon offset on road materials to eliminate any Z-fighting/flicker
    this.materials.roadZ = new THREE.MeshStandardMaterial({
      map: this.pixelTextures.roadZ,
      roughness: 0.85,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    this.materials.roadX = new THREE.MeshStandardMaterial({
      map: this.pixelTextures.roadX,
      roughness: 0.85,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1
    });

    this.materials.intersection = new THREE.MeshStandardMaterial({
      map: this.pixelTextures.intersection,
      roughness: 0.85,
      metalness: 0.1,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });

    this.materials.metalFrame = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.5,
      metalness: 0.8
    });

    this.materials.fireEscape = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.6,
      metalness: 0.7
    });

    this.materials.cornice = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.2
    });
  }

  generateCity() {
    const halfGrid = Math.floor(this.citySize / 2);
    const totalSpan = this.citySize * this.cellSize;

    // 1. Island Landmass Concrete Foundation
    const islandGeo = new THREE.BoxGeometry(totalSpan, 3.0, totalSpan);
    const islandMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.95
    });
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.set(0, -1.5, 0);
    island.receiveShadow = true;
    this.scene.add(island);

    // 2. Surrounding Ocean Water Plane (Animated Shimmering Blue Sea)
    const oceanGeo = new THREE.PlaneGeometry(4500, 4500, 32, 32);
    this.oceanMaterial = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Vibrant tropical/metropolis deep blue
      roughness: 0.12,
      metalness: 0.75,
      transparent: true,
      opacity: 0.88
    });
    this.oceanMesh = new THREE.Mesh(oceanGeo, this.oceanMaterial);
    this.oceanMesh.rotation.x = -Math.PI / 2;
    this.oceanMesh.position.set(0, -0.6, 0);
    this.scene.add(this.oceanMesh);

    // 3. Perimeter Coastal Seawall & Concrete Docks Barrier
    const seawallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const wallHalf = totalSpan / 2;
    const wallHeight = 2.2;
    const wallThickness = 4.0;

    // North, South, East, West seawalls
    const seawallN = new THREE.Mesh(new THREE.BoxGeometry(totalSpan + 8, wallHeight, wallThickness), seawallMat);
    seawallN.position.set(0, 0.6, -wallHalf);
    const seawallS = seawallN.clone();
    seawallS.position.set(0, 0.6, wallHalf);
    const seawallE = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, totalSpan + 8), seawallMat);
    seawallE.position.set(wallHalf, 0.6, 0);
    const seawallW = seawallE.clone();
    seawallW.position.set(-wallHalf, 0.6, 0);

    this.scene.add(seawallN);
    this.scene.add(seawallS);
    this.scene.add(seawallE);
    this.scene.add(seawallW);

    // 4. Build Directional Road Avenues & Crossroads
    this.generateDirectionalRoadNetwork(halfGrid);

    // 5. Loop through City Grid Blocks: Sidewalks, Buildings, Lamp Posts & Overhangs
    for (let gx = -halfGrid; gx < halfGrid; gx++) {
      for (let gz = -halfGrid; gz < halfGrid; gz++) {
        const posX = gx * this.cellSize;
        const posZ = gz * this.cellSize;
        const distFromCenter = Math.hypot(gx, gz);

        // Always create an elevated Sidewalk Slab for each block
        this.createSidewalk(posX, posZ);

        // 1. Central Landmark & Spawn Tower (at 0,0)
        if (gx === 0 && gz === 0) {
          this.createCentralTower(posX, posZ);
          this.createStreetLights(posX, posZ);
          this.createSidewalkProps(posX, posZ);
          continue;
        }

        // 2. Central Park Landmark (gx: 2..3, gz: 2..3)
        if (gx >= 2 && gx <= 3 && gz >= 2 && gz <= 3) {
          this.createPark(posX, posZ);
          this.createStreetLights(posX, posZ);
          continue;
        }

        // 3. Harbor Landmark (west border)
        if (gx <= -halfGrid + 1) {
          this.createHarbor(posX, posZ);
          continue;
        }

        // 5. Metropolis Public Car Park (gx: 1, gz: 0 - Immediately East of Spawn Tower!)
        if (gx === 1 && gz === 0) {
          this.createCarPark(posX, posZ);
          this.createStreetLights(posX, posZ);
          continue;
        }

        // 6. Downtown South Car Park (gx: -1, gz: 1)
        if (gx === -1 && gz === 1) {
          this.createCarPark(posX, posZ);
          this.createStreetLights(posX, posZ);
          continue;
        }

        // Standard District Building Generation
        let height, width, depth, mat;

        if (distFromCenter < 5) {
          // Financial District: Modern Skyscrapers (55m - 130m)
          height = 50 + Math.random() * 80;
          width = this.blockSize * (0.72 + Math.random() * 0.16);
          depth = this.blockSize * (0.72 + Math.random() * 0.16);
          mat = this.materials.skyscraper;
        } else if (distFromCenter < 9) {
          // Mid-town: Apartments & offices (22m - 50m)
          height = 20 + Math.random() * 30;
          width = this.blockSize * (0.65 + Math.random() * 0.2);
          depth = this.blockSize * (0.65 + Math.random() * 0.2);
          mat = (Math.random() > 0.4) ? this.materials.midrise : this.materials.skyscraper;
        } else {
          // Commercial & industrial (12m - 22m)
          height = 12 + Math.random() * 12;
          width = this.blockSize * (0.58 + Math.random() * 0.25);
          depth = this.blockSize * (0.58 + Math.random() * 0.25);
          mat = this.materials.shop;
        }

        this.createBuilding(posX, posZ, width, height, depth, mat);

        // Place Lamp Posts and Street Details on Sidewalk
        this.createStreetLights(posX, posZ);
        this.createSidewalkProps(posX, posZ);
      }
    }

    // Spawn dynamic traffic cars along directional avenues
    this.createTrafficSystem();
  }

  // 3D Directional Road Network Generation (Batched along avenues with anti-flicker elevations)
  generateDirectionalRoadNetwork(halfGrid) {
    const totalSpan = this.citySize * this.cellSize;
    const roadZGeo = new THREE.PlaneGeometry(this.roadWidth, totalSpan);
    const roadXGeo = new THREE.PlaneGeometry(totalSpan, this.roadWidth);
    const intGeo = new THREE.PlaneGeometry(this.roadWidth, this.roadWidth);

    const halfCell = this.cellSize * 0.5;

    // Longitudinal North-South Avenues (along Z)
    for (let gx = -halfGrid; gx < halfGrid; gx++) {
      const posX = gx * this.cellSize + halfCell;
      const rzMesh = new THREE.Mesh(roadZGeo, this.materials.roadZ);
      rzMesh.rotation.x = -Math.PI / 2;
      rzMesh.position.set(posX, 0.05, 0);
      rzMesh.receiveShadow = true;
      this.scene.add(rzMesh);
    }

    // Latitudinal East-West Avenues (along X)
    for (let gz = -halfGrid; gz < halfGrid; gz++) {
      const posZ = gz * this.cellSize + halfCell;
      const rxMesh = new THREE.Mesh(roadXGeo, this.materials.roadX);
      rxMesh.rotation.x = -Math.PI / 2;
      rxMesh.position.set(0, 0.06, posZ);
      rxMesh.receiveShadow = true;
      this.scene.add(rxMesh);
    }

    // Crossroads Intersection Junctions (with zebra crosswalks)
    for (let gx = -halfGrid; gx < halfGrid; gx++) {
      for (let gz = -halfGrid; gz < halfGrid; gz++) {
        const posX = gx * this.cellSize + halfCell;
        const posZ = gz * this.cellSize + halfCell;
        const intMesh = new THREE.Mesh(intGeo, this.materials.intersection);
        intMesh.rotation.x = -Math.PI / 2;
        intMesh.position.set(posX, 0.08, posZ);
        intMesh.receiveShadow = true;
        this.scene.add(intMesh);
      }
    }
  }

  // Elevated 3D Sidewalk with Concrete Curb
  createSidewalk(x, z) {
    const swHeight = 0.28;
    const swGeo = new THREE.BoxGeometry(this.blockSize, swHeight, this.blockSize);
    const swMesh = new THREE.Mesh(swGeo, this.materials.sidewalk);
    swMesh.position.set(x, swHeight * 0.5, z);
    swMesh.receiveShadow = true;
    this.scene.add(swMesh);

    // Register sidewalk for seamless player collision & grounding
    const swBox = new THREE.Box3().setFromObject(swMesh);
    this.buildingColliders.push(swBox);
  }

  // Create strictly vertical upright building with solid rooftop material (NO windows on roof!)
  createBuilding(x, z, width, height, depth, wallMat) {
    const geo = new THREE.BoxGeometry(width, height, depth);
    // 6 faces: [+X (right), -X (left), +Y (ROOF), -Y (bottom), +Z (front), -Z (back)]
    const mats = [
      wallMat,
      wallMat,
      this.materials.roof,
      this.materials.roof,
      wallMat,
      wallMat
    ];
    const building = new THREE.Mesh(geo, mats);
    building.position.set(x, height / 2 + 0.28, z);
    building.castShadow = true;
    building.receiveShadow = true;
    this.scene.add(building);

    // Bounding Box Collider for Physics
    const box = new THREE.Box3().setFromObject(building);
    this.buildingColliders.push(box);

    const topY = height + 0.28;
    const halfW = width * 0.5;
    const halfD = depth * 0.5;

    // Register rooftop corners as web swing anchors
    this.swingAnchors.push(
      new THREE.Vector3(x - halfW, topY, z - halfD),
      new THREE.Vector3(x + halfW, topY, z + halfD),
      new THREE.Vector3(x - halfW, topY, z + halfD),
      new THREE.Vector3(x + halfW, topY, z - halfD),
      new THREE.Vector3(x, topY, z)
    );

    // 1. Rooftop Props (Clean Flat Rooftops without protruding ledges)
    const rand = Math.random();
    if (rand > 0.5 && height > 25) {
      this.createWaterTower(x + (Math.random() - 0.5) * (width * 0.4), topY, z + (Math.random() - 0.5) * (depth * 0.4));
    }
    if (rand > 0.4) {
      this.createACUnits(x, topY, z, width, depth);
    }
    if (rand > 0.85 && height > 45) {
      this.createRooftopCrane(x, topY, z);
    }

    // 2. Overhanging Cyberpunk Billboards with NifftySwiggle branding
    if (Math.random() > 0.45 && height > 22) {
      this.createOverhangingBillboard(x, topY * 0.6, z, width, depth);
    }

    // 3. Ground-Level Shopfront Canopy Overhangs
    if (Math.random() > 0.45) {
      this.createShopCanopy(x, z, width, depth);
    }
  }

  // Overhanging Cyberpunk Billboards with Metal Mounting Trusses & NifftySwiggle Credits
  createOverhangingBillboard(x, y, z, w, d) {
    const adData = this.billboardTextures[Math.floor(Math.random() * this.billboardTextures.length)];
    const signW = 14;
    const signH = 7;
    const signD = 0.6;

    // Pick a building wall face: 0: +Z, 1: -Z, 2: +X, 3: -X
    const wallSide = Math.floor(Math.random() * 4);
    let signPos, signRotY, trussStart1, trussStart2, trussEnd1, trussEnd2;

    const overhangDist = 2.4;

    if (wallSide === 0) { // +Z Wall
      signPos = new THREE.Vector3(x, y, z + d * 0.5 + overhangDist);
      signRotY = 0;
      trussStart1 = new THREE.Vector3(x - 4, y, z + d * 0.5);
      trussEnd1 = new THREE.Vector3(x - 4, y, signPos.z);
      trussStart2 = new THREE.Vector3(x + 4, y, z + d * 0.5);
      trussEnd2 = new THREE.Vector3(x + 4, y, signPos.z);
    } else if (wallSide === 1) { // -Z Wall
      signPos = new THREE.Vector3(x, y, z - d * 0.5 - overhangDist);
      signRotY = Math.PI;
      trussStart1 = new THREE.Vector3(x - 4, y, z - d * 0.5);
      trussEnd1 = new THREE.Vector3(x - 4, y, signPos.z);
      trussStart2 = new THREE.Vector3(x + 4, y, z - d * 0.5);
      trussEnd2 = new THREE.Vector3(x + 4, y, signPos.z);
    } else if (wallSide === 2) { // +X Wall
      signPos = new THREE.Vector3(x + w * 0.5 + overhangDist, y, z);
      signRotY = Math.PI / 2;
      trussStart1 = new THREE.Vector3(x + w * 0.5, y, z - 4);
      trussEnd1 = new THREE.Vector3(signPos.x, y, z - 4);
      trussStart2 = new THREE.Vector3(x + w * 0.5, y, z + 4);
      trussEnd2 = new THREE.Vector3(signPos.x, y, z + 4);
    } else { // -X Wall
      signPos = new THREE.Vector3(x - w * 0.5 - overhangDist, y, z);
      signRotY = -Math.PI / 2;
      trussStart1 = new THREE.Vector3(x - w * 0.5, y, z - 4);
      trussEnd1 = new THREE.Vector3(signPos.x, y, z - 4);
      trussStart2 = new THREE.Vector3(x - w * 0.5, y, z + 4);
      trussEnd2 = new THREE.Vector3(signPos.x, y, z + 4);
    }

    // Billboard Panel Mesh
    const boardGeo = new THREE.BoxGeometry(signW, signH, signD);
    const boardMat = new THREE.MeshStandardMaterial({
      map: adData.tex,
      emissiveMap: adData.tex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.65,
      roughness: 0.2,
      metalness: 0.1
    });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.copy(signPos);
    board.rotation.y = signRotY;
    this.scene.add(board);

    // Glowing Frame Border
    const frameGeo = new THREE.BoxGeometry(signW + 0.6, signH + 0.6, signD * 0.8);
    const frameMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(adData.glow),
      emissive: new THREE.Color(adData.glow),
      emissiveIntensity: 1.6
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.copy(signPos);
    frame.rotation.y = signRotY;
    this.scene.add(frame);

    // Metal Mounting Support Trusses
    [ [trussStart1, trussEnd1], [trussStart2, trussEnd2] ].forEach(([start, end]) => {
      const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const isZ = Math.abs(start.z - end.z) > 0.01;
      const beamLen = isZ ? Math.abs(start.z - end.z) : Math.abs(start.x - end.x);
      const beamGeo = new THREE.BoxGeometry(isZ ? 0.3 : beamLen, 0.3, isZ ? beamLen : 0.3);
      const beam = new THREE.Mesh(beamGeo, this.materials.metalFrame);
      beam.position.copy(mid);
      this.scene.add(beam);

      const diagGeo = new THREE.BoxGeometry(isZ ? 0.2 : beamLen * 1.1, 0.2, isZ ? beamLen * 1.1 : 0.2);
      const diag = new THREE.Mesh(diagGeo, this.materials.metalFrame);
      diag.position.set(mid.x, mid.y - 1.2, mid.z);
      this.scene.add(diag);
    });

    this.buildingColliders.push(new THREE.Box3().setFromObject(board));
    this.swingAnchors.push(new THREE.Vector3(signPos.x, signPos.y + signH * 0.5 + 0.5, signPos.z));
  }

  // Ground-Floor Shop Canopy / Awning Overhanging the Sidewalk
  createShopCanopy(x, z, w, d) {
    const canopyW = Math.min(w * 0.8, 16);
    const canopyD = 3.2;
    const canopyY = 4.2;

    const cGeo = new THREE.BoxGeometry(canopyW, 0.25, canopyD);
    const cMat = new THREE.MeshStandardMaterial({
      map: this.pixelTextures.canopy,
      roughness: 0.7
    });
    const canopy = new THREE.Mesh(cGeo, cMat);
    canopy.position.set(x, canopyY, z + d * 0.5 + canopyD * 0.5);
    canopy.rotation.x = 0.15;
    this.scene.add(canopy);

    // Support Rods
    [-canopyW * 0.45, canopyW * 0.45].forEach(rx => {
      const rodGeo = new THREE.BoxGeometry(0.1, 0.1, canopyD * 1.1);
      const rod = new THREE.Mesh(rodGeo, this.materials.metalFrame);
      rod.position.set(x + rx, canopyY + 1.2, z + d * 0.5 + canopyD * 0.5);
      rod.rotation.x = 0.55;
      this.scene.add(rod);
    });

    this.buildingColliders.push(new THREE.Box3().setFromObject(canopy));
    this.swingAnchors.push(new THREE.Vector3(x, canopyY + 2.0, z + d * 0.5 + canopyD * 0.5));
  }

  // Detailed Street Lamp Posts on the Sidewalk (Optimized 2 per block for high FPS)
  createStreetLights(x, z) {
    const curbOffset = this.blockSize * 0.5 - 1.4;

    const lampPositions = [
      { pos: new THREE.Vector3(x + curbOffset, 0.28, z), dir: new THREE.Vector3(1, 0, 0) },
      { pos: new THREE.Vector3(x - curbOffset, 0.28, z), dir: new THREE.Vector3(-1, 0, 0) }
    ];

    lampPositions.forEach(({ pos, dir }) => {
      const poleH = 7.5;
      const armLen = 2.4;

      // 1. Pedestal Base on Sidewalk
      const baseGeo = new THREE.BoxGeometry(0.8, 0.4, 0.8);
      const base = new THREE.Mesh(baseGeo, this.materials.metalFrame);
      base.position.set(pos.x, pos.y + 0.2, pos.z);
      this.scene.add(base);

      // 2. Vertical Steel Lamp Pole
      const poleGeo = new THREE.CylinderGeometry(0.18, 0.26, poleH, 8);
      const pole = new THREE.Mesh(poleGeo, this.materials.metalFrame);
      pole.position.set(pos.x, pos.y + poleH * 0.5, pos.z);
      this.scene.add(pole);

      // 3. Cantilever Arm Overhanging Curb
      const isX = Math.abs(dir.x) > 0.5;
      const armGeo = new THREE.BoxGeometry(isX ? armLen : 0.15, 0.15, isX ? 0.15 : armLen);
      const arm = new THREE.Mesh(armGeo, this.materials.metalFrame);
      const armCenter = new THREE.Vector3(
        pos.x + dir.x * (armLen * 0.5),
        pos.y + poleH - 0.2,
        pos.z + dir.z * (armLen * 0.5)
      );
      arm.position.copy(armCenter);
      this.scene.add(arm);

      // 4. Downward Luminaire Head
      const headGeo = new THREE.BoxGeometry(isX ? 0.9 : 0.5, 0.3, isX ? 0.5 : 0.9);
      const headMat = new THREE.MeshStandardMaterial({
        color: 0xfff9c4,
        emissive: 0xffe082,
        emissiveIntensity: 2.2,
        roughness: 0.2
      });
      const head = new THREE.Mesh(headGeo, headMat);
      const headPos = new THREE.Vector3(
        pos.x + dir.x * armLen,
        pos.y + poleH - 0.4,
        pos.z + dir.z * armLen
      );
      head.position.copy(headPos);
      this.scene.add(head);

      // Colliders and street-level web swing anchors
      this.buildingColliders.push(new THREE.Box3().setFromObject(pole));
      this.swingAnchors.push(new THREE.Vector3(headPos.x, headPos.y + 0.5, headPos.z));
    });
  }

  // Sidewalk Street Details: Fire Hydrants
  createSidewalkProps(x, z) {
    const curbOffset = this.blockSize * 0.5 - 2.0;

    const fhGeo = new THREE.CylinderGeometry(0.3, 0.35, 1.1, 8);
    const fhMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.4 });
    const hydrant = new THREE.Mesh(fhGeo, fhMat);
    hydrant.position.set(x + curbOffset, 0.28 + 0.55, z + curbOffset);
    this.scene.add(hydrant);

    const capGeo = new THREE.SphereGeometry(0.32, 8, 6);
    const capMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.position.set(x + curbOffset, 0.28 + 1.1, z + curbOffset);
    this.scene.add(cap);

    this.buildingColliders.push(new THREE.Box3().setFromObject(hydrant));
  }

  // Landmark: Central Skyscraper (Spawn Tower with Helipad Deck)
  createCentralTower(x, z) {
    const baseHeight = 110;
    const baseW = 30;
    const towerGeo = new THREE.BoxGeometry(baseW, baseHeight, baseW);
    const towerMats = [
      this.materials.skyscraper,
      this.materials.skyscraper,
      this.materials.roof,
      this.materials.roof,
      this.materials.skyscraper,
      this.materials.skyscraper
    ];
    const tower = new THREE.Mesh(towerGeo, towerMats);
    tower.position.set(x, baseHeight / 2 + 0.28, z);
    tower.castShadow = true;
    this.scene.add(tower);

    const towerBox = new THREE.Box3(
      new THREE.Vector3(x - baseW * 0.5, 0, z - baseW * 0.5),
      new THREE.Vector3(x + baseW * 0.5, baseHeight + 0.28, z + baseW * 0.5)
    );
    this.buildingColliders.push(towerBox);

    // Rooftop Launchpad Platform
    const padGeo = new THREE.BoxGeometry(baseW * 0.88, 0.5, baseW * 0.88);
    const padMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.set(x, baseHeight + 0.28 + 0.25, z);
    this.scene.add(pad);
    this.buildingColliders.push(new THREE.Box3().setFromObject(pad));

    // Corner beacon lights
    const corners = [
      [-baseW * 0.42, -baseW * 0.42],
      [baseW * 0.42, -baseW * 0.42],
      [-baseW * 0.42, baseW * 0.42],
      [baseW * 0.42, baseW * 0.42]
    ];
    corners.forEach(([cx, cz]) => {
      const bGeo = new THREE.BoxGeometry(1, 2.5, 1);
      const bMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1.8 });
      const b = new THREE.Mesh(bGeo, bMat);
      b.position.set(x + cx, baseHeight + 1.5, z + cz);
      this.scene.add(b);
      this.swingAnchors.push(new THREE.Vector3(x + cx, baseHeight + 2.5, z + cz));
      this.buildingColliders.push(new THREE.Box3().setFromObject(b));
    });
  }

  // Landmark: Central Park
  createPark(x, z) {
    const parkGeo = new THREE.BoxGeometry(this.blockSize * 0.92, 0.4, this.blockSize * 0.92);
    const parkMat = new THREE.MeshStandardMaterial({ color: 0x1e5631, roughness: 0.9 });
    const park = new THREE.Mesh(parkGeo, parkMat);
    park.position.set(x, 0.45, z);
    this.scene.add(park);

    for (let i = 0; i < 6; i++) {
      const tx = x + (Math.random() - 0.5) * (this.blockSize * 0.65);
      const tz = z + (Math.random() - 0.5) * (this.blockSize * 0.65);
      this.createPixelTree(tx, tz);
    }
  }

  createPixelTree(x, z) {
    const trunkGeo = new THREE.BoxGeometry(1.2, 5, 1.2);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.set(x, 2.5 + 0.28, z);

    const leavesGeo = new THREE.BoxGeometry(4.5, 4.5, 4.5);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x2e7d32, roughness: 0.8 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.set(x, 6 + 0.28, z);

    this.scene.add(trunk);
    this.scene.add(leaves);
    this.buildingColliders.push(new THREE.Box3().setFromObject(leaves));
    this.swingAnchors.push(new THREE.Vector3(x, 8.5, z));
  }

  // Landmark: City Sports Stadium
  createStadium(x, z) {
    const stadiumGeo = new THREE.CylinderGeometry(32, 42, 25, 16);
    const stadiumMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.5 });
    const stadium = new THREE.Mesh(stadiumGeo, stadiumMat);
    stadium.position.set(x, 12.5 + 0.28, z);
    this.scene.add(stadium);
    this.buildingColliders.push(new THREE.Box3().setFromObject(stadium));

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const lx = x + Math.cos(angle) * 38;
      const lz = z + Math.sin(angle) * 38;
      const mastGeo = new THREE.BoxGeometry(2, 45, 2);
      const mast = new THREE.Mesh(mastGeo, new THREE.MeshStandardMaterial({ color: 0x78909c }));
      mast.position.set(lx, 22.5, lz);
      this.scene.add(mast);
      this.buildingColliders.push(new THREE.Box3().setFromObject(mast));
      this.swingAnchors.push(new THREE.Vector3(lx, 45, lz));
    }
  }

  // Landmark: Harbor Docks (Incursion Warzone)
  createHarbor(x, z) {
    const waterGeo = new THREE.BoxGeometry(this.blockSize, 2, this.blockSize);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x005577,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.85
    });
    const water = new THREE.Mesh(waterGeo, waterMat);
    water.position.set(x, 0, z);
    this.scene.add(water);

    const pierGeo = new THREE.BoxGeometry(8, 3, this.blockSize * 0.9);
    const pierMat = new THREE.MeshStandardMaterial({ color: 0x546e7a });
    const pier = new THREE.Mesh(pierGeo, pierMat);
    pier.position.set(x + 10, 1.5, z);
    this.scene.add(pier);
    this.buildingColliders.push(new THREE.Box3().setFromObject(pier));

    const colors = [0xd32f2f, 0x1976d2, 0x388e3c, 0xfbc02d];
    for (let i = 0; i < 4; i++) {
      const cGeo = new THREE.BoxGeometry(6, 4, 14);
      const cMat = new THREE.MeshStandardMaterial({ color: colors[i % colors.length] });
      const c = new THREE.Mesh(cGeo, cMat);
      c.position.set(x + (i - 1.5) * 7, 2, z);
      this.scene.add(c);
      this.buildingColliders.push(new THREE.Box3().setFromObject(c));
      this.swingAnchors.push(new THREE.Vector3(x + (i - 1.5) * 7, 4.5, z));
    }
  }

  // Landmark: Open-Air Metropolis Public Car Park with Parked Drivable Vehicles
  createCarPark(posX, posZ) {
    // 1. Asphalt Parking Lot Floor Slab
    const lotGeo = new THREE.BoxGeometry(34, 0.35, 34);
    const lotMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.05
    });
    const lot = new THREE.Mesh(lotGeo, lotMat);
    lot.position.set(posX, 0.28, posZ);
    this.scene.add(lot);

    // 2. Parking Stall White Painted Lines
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    // Center divider strip
    const divGeo = new THREE.PlaneGeometry(0.8, 28);
    const divider = new THREE.Mesh(divGeo, lineMat);
    divider.rotation.x = -Math.PI / 2;
    divider.position.set(posX, 0.48, posZ);
    this.scene.add(divider);

    // Parking slot stall boundary lines
    for (let offset = -12; offset <= 12; offset += 6.0) {
      // West stalls
      const lLine = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 0.22), lineMat);
      lLine.rotation.x = -Math.PI / 2;
      lLine.position.set(posX - 6.0, 0.48, posZ + offset);
      this.scene.add(lLine);

      // East stalls
      const rLine = new THREE.Mesh(new THREE.PlaneGeometry(9.0, 0.22), lineMat);
      rLine.rotation.x = -Math.PI / 2;
      rLine.position.set(posX + 6.0, 0.48, posZ + offset);
      this.scene.add(rLine);
    }

    // 3. Glowing Neon "🅿️ METROPOLIS CAR PARK" Entrance Sign (High-Resolution 1024x256)
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024;
    signCanvas.height = 256;
    const sCtx = signCanvas.getContext('2d');
    sCtx.imageSmoothingEnabled = true;
    sCtx.imageSmoothingQuality = 'high';

    sCtx.fillStyle = '#0f172a';
    sCtx.fillRect(0, 0, 1024, 256);
    sCtx.strokeStyle = '#00f0ff';
    sCtx.lineWidth = 12;
    sCtx.strokeRect(8, 8, 1008, 240);

    sCtx.fillStyle = '#00f0ff';
    sCtx.font = '700 64px "Segoe UI", Arial, sans-serif';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText('🅿️ METROPOLIS CAR PARK', 512, 100);

    sCtx.fillStyle = '#f59e0b';
    sCtx.font = '700 42px "Segoe UI", Arial, sans-serif';
    sCtx.fillText('★ DRIVABLE VEHICLES & VALET ★', 512, 185);

    const signTex = new THREE.CanvasTexture(signCanvas);
    signTex.generateMipmaps = true;
    signTex.minFilter = THREE.LinearMipmapLinearFilter;
    signTex.magFilter = THREE.LinearFilter;
    signTex.anisotropy = 16;
    signTex.needsUpdate = true;
    const signMat = new THREE.MeshBasicMaterial({ map: signTex });

    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(10, 2.5, 0.4), signMat);
    signBoard.position.set(posX, 5.0, posZ - 16.0);
    this.scene.add(signBoard);

    // Sign Support Posts
    const postMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    [-4.5, 4.5].forEach(px => {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.0, 8), postMat);
      post.position.set(posX + px, 2.5, posZ - 16.0);
      this.scene.add(post);
    });

    // 4. Floodlight Lighting Poles on Corners
    [
      [-15, -15],
      [15, -15],
      [-15, 15],
      [15, 15]
    ].forEach(([cx, cz]) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 7.5, 8), postMat);
      pole.position.set(posX + cx, 3.75, posZ + cz);
      this.scene.add(pole);

      const lampHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.3, 0.9),
        new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.2 })
      );
      lampHead.position.set(posX + cx, 7.5, posZ + cz);
      this.scene.add(lampHead);
    });

    // 5. Stationary Parked Drivable Vehicles (Ready to drive by pressing F!)
    const parkedCarConfigs = [
      { color: 0xffcc00, type: 'taxi', ox: -6.5, oz: -9.0, rot: Math.PI / 2 },
      { color: 0xe11d48, type: 'sports', ox: -6.5, oz: -3.0, rot: Math.PI / 2 },
      { color: 0x18181b, type: 'police', ox: -6.5, oz: 3.0, rot: Math.PI / 2 },
      { color: 0x2563eb, type: 'sedan', ox: -6.5, oz: 9.0, rot: Math.PI / 2 },
      { color: 0x9333ea, type: 'sports', ox: 6.5, oz: -9.0, rot: -Math.PI / 2 },
      { color: 0x059669, type: 'sedan', ox: 6.5, oz: -3.0, rot: -Math.PI / 2 },
      { color: 0xf59e0b, type: 'taxi', ox: 6.5, oz: 3.0, rot: -Math.PI / 2 },
      { color: 0x0ea5e9, type: 'sports', ox: 6.5, oz: 9.0, rot: -Math.PI / 2 }
    ];

    parkedCarConfigs.forEach(cfg => {
      const carGroup = this.createDetailedCarMesh(cfg.color, cfg.type);
      carGroup.position.set(posX + cfg.ox, 0.28, posZ + cfg.oz);
      carGroup.rotation.y = cfg.rot;
      this.scene.add(carGroup);

      const carBox = new THREE.Box3().setFromObject(carGroup);

      this.trafficCars.push({
        mesh: carGroup,
        box: carBox,
        speed: 0, // Stationary in parking bay!
        currentSpeed: 0,
        steerAngle: cfg.rot,
        isHorizontal: false,
        limit: 2000,
        isWebbed: false,
        webTimer: 0,
        isParked: true,
        isPlayerDriven: false
      });
    });
  }

  // Water Tower Rooftop Prop
  createWaterTower(x, y, z) {
    const tankGeo = new THREE.CylinderGeometry(3, 3, 5, 8);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63 });
    const tank = new THREE.Mesh(tankGeo, tankMat);
    tank.position.set(x, y + 5, z);

    const legsGeo = new THREE.BoxGeometry(4, 5, 4);
    const legsMat = new THREE.MeshStandardMaterial({ color: 0x424242 });
    const legs = new THREE.Mesh(legsGeo, legsMat);
    legs.position.set(x, y + 2.5, z);

    this.scene.add(tank);
    this.scene.add(legs);
    this.buildingColliders.push(new THREE.Box3().setFromObject(tank));
    this.swingAnchors.push(new THREE.Vector3(x, y + 8, z));
  }

  // AC Units
  createACUnits(x, y, z, w, d) {
    const acGeo = new THREE.BoxGeometry(3.5, 2, 2.5);
    const acMat = new THREE.MeshStandardMaterial({ color: 0xb0bec5 });
    const ac = new THREE.Mesh(acGeo, acMat);
    ac.position.set(x + (Math.random() - 0.5) * (w * 0.4), y + 1, z + (Math.random() - 0.5) * (d * 0.4));
    this.scene.add(ac);
    this.buildingColliders.push(new THREE.Box3().setFromObject(ac));
    this.swingAnchors.push(new THREE.Vector3(ac.position.x, y + 2.2, ac.position.z));
  }

  // Rooftop Crane
  createRooftopCrane(x, y, z) {
    const mastGeo = new THREE.BoxGeometry(2, 22, 2);
    const boomGeo = new THREE.BoxGeometry(36, 2, 2);
    const craneMat = new THREE.MeshStandardMaterial({ color: 0xffa000 });

    const mast = new THREE.Mesh(mastGeo, craneMat);
    mast.position.set(x, y + 11, z);

    const boom = new THREE.Mesh(boomGeo, craneMat);
    boom.position.set(x + 12, y + 22, z);

    this.scene.add(mast);
    this.scene.add(boom);

    this.buildingColliders.push(new THREE.Box3().setFromObject(mast));
    this.buildingColliders.push(new THREE.Box3().setFromObject(boom));

    this.swingAnchors.push(
      new THREE.Vector3(x + 28, y + 22, z),
      new THREE.Vector3(x - 4, y + 22, z),
      new THREE.Vector3(x, y + 24, z)
    );
  }

  // Create Detailed 3D Voxel/Pixel Vehicles (Taxis, Police Cruisers, Sports Cars, SUVs - Scaled to Character)
  createDetailedCarMesh(colorHex, type = 'sedan') {
    const group = new THREE.Group();
    const paintMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.25, metalness: 0.35 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.2, metalness: 0.8 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });
    const headlightMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.5 });
    const taillightMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, emissiveIntensity: 2.2 });

    // 1. Lower Chassis (Scale enlarged ~1.4x for realistic superhero scale)
    const chassisGeo = new THREE.BoxGeometry(3.3, 0.9, 6.4);
    const chassis = new THREE.Mesh(chassisGeo, paintMat);
    chassis.position.y = 0.75;
    group.add(chassis);

    // 2. Cabin & Tinted Windows
    const cabinGeo = new THREE.BoxGeometry(2.9, 0.9, 3.6);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 1.55, -0.3);
    group.add(cabin);

    const roofGeo = new THREE.BoxGeometry(2.95, 0.16, 3.3);
    const roof = new THREE.Mesh(roofGeo, paintMat);
    roof.position.set(0, 2.02, -0.3);
    group.add(roof);

    // 3. Dual Glowing Headlights (Front)
    [-1.1, 1.1].forEach(hx => {
      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.3, 0.12), headlightMat);
      hl.position.set(hx, 0.8, 3.21);
      group.add(hl);
    });

    // 4. Dual Glowing Taillights (Rear)
    [-1.1, 1.1].forEach(tx => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.12), taillightMat);
      tl.position.set(tx, 0.8, -3.21);
      group.add(tl);
    });

    // 5. Four 3D Wheels with Silver Hubcaps
    const wheelGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.42, 14);
    wheelGeo.rotateZ(Math.PI / 2);
    const hubGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.45, 8);
    hubGeo.rotateZ(Math.PI / 2);

    [
      [-1.65, 0.52, 1.9],
      [1.65, 0.52, 1.9],
      [-1.65, 0.52, -1.9],
      [1.65, 0.52, -1.9]
    ].forEach(([wx, wy, wz]) => {
      const wMesh = new THREE.Mesh(wheelGeo, tireMat);
      const hMesh = new THREE.Mesh(hubGeo, chromeMat);
      wMesh.position.set(wx, wy, wz);
      hMesh.position.set(wx, wy, wz);
      group.add(wMesh);
      group.add(hMesh);
    });

    // 6. Vehicle Type Specific Accessories
    if (type === 'taxi') {
      const taxiSignMat = new THREE.MeshStandardMaterial({ color: 0xffea00, emissive: 0xffea00, emissiveIntensity: 2.2 });
      const sign = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 0.5), taxiSignMat);
      sign.position.set(0, 2.25, -0.3);
      group.add(sign);
    } else if (type === 'police') {
      const barRed = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.24, 0.3), new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0xff0055, emissiveIntensity: 2.8 }));
      const barBlue = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.24, 0.3), new THREE.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 2.8 }));
      barRed.position.set(-0.35, 2.22, -0.3);
      barBlue.position.set(0.35, 2.22, -0.3);
      group.add(barRed);
      group.add(barBlue);
    } else if (type === 'sports') {
      const spoilerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 });
      const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.14, 0.7), spoilerMat);
      spoilerWing.position.set(0, 1.45, -2.85);
      group.add(spoilerWing);
    }

    return group;
  }

  // Animated Pixel Traffic Cars aligned with directional lanes
  createTrafficSystem() {
    const carTypes = [
      { color: 0xffcc00, type: 'taxi' },
      { color: 0xe11d48, type: 'sports' },
      { color: 0x2563eb, type: 'sedan' },
      { color: 0x059669, type: 'sedan' },
      { color: 0x18181b, type: 'police' },
      { color: 0x9333ea, type: 'sports' },
      { color: 0xf8fafc, type: 'sedan' }
    ];

    const half = Math.floor(this.citySize / 2);
    const maxCars = 34;

    for (let i = 0; i < maxCars; i++) {
      const isHorizontal = Math.random() > 0.5;
      const roadIndex = Math.floor((Math.random() - 0.5) * (this.citySize - 2));
      const laneOffset = (Math.random() > 0.5 ? 5.5 : -5.5);
      const roadCoord = roadIndex * this.cellSize + this.cellSize * 0.5 + laneOffset;

      const template = carTypes[i % carTypes.length];
      const carGroup = this.createDetailedCarMesh(template.color, template.type);

      const speed = 18 + Math.random() * 10;
      const dir = (laneOffset > 0 ? 1 : -1);

      if (isHorizontal) {
        carGroup.position.set((Math.random() - 0.5) * this.citySize * this.cellSize, 0.28, roadCoord);
        carGroup.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        carGroup.position.set(roadCoord, 0.28, (Math.random() - 0.5) * this.citySize * this.cellSize);
        carGroup.rotation.y = dir > 0 ? 0 : Math.PI;
      }

      this.scene.add(carGroup);
      const carBox = new THREE.Box3().setFromObject(carGroup);

      this.trafficCars.push({
        mesh: carGroup,
        box: carBox,
        speed: speed * dir,
        isHorizontal,
        limit: half * this.cellSize,
        isWebbed: false,
        webTimer: 0
      });
    }
  }

  // Update dynamic world props (cars & colliders)
  update(dt) {
    for (let i = 0; i < this.trafficCars.length; i++) {
      const car = this.trafficCars[i];
      if (car.isPlayerDriven) {
        if (car.box) car.box.setFromObject(car.mesh);
        continue;
      }
      
      // If car is webbed, slow it down
      const currentSpeed = car.isWebbed ? car.speed * 0.35 : car.speed;
      if (car.isWebbed) {
        car.webTimer -= dt;
        if (car.webTimer <= 0) car.isWebbed = false;
      }

      if (car.isHorizontal) {
        car.mesh.position.x += currentSpeed * dt;
        if (Math.abs(car.mesh.position.x) > car.limit) {
          car.mesh.position.x = -Math.sign(car.speed) * car.limit;
        }
      } else {
        car.mesh.position.z += currentSpeed * dt;
        if (Math.abs(car.mesh.position.z) > car.limit) {
          car.mesh.position.z = -Math.sign(car.speed) * car.limit;
        }
      }
      if (car.box) {
        car.box.setFromObject(car.mesh);
      }
    }
  }
}
