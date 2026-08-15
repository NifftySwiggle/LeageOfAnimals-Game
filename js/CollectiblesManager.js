import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export class CollectiblesManager {
  constructor(scene, audioSystem, achievementsSystem) {
    this.scene = scene;
    this.audio = audioSystem;
    this.achievements = achievementsSystem;
    this.storageKey = 'league_of_extraordinary_animals_collectibles';

    this.collectibles = [];
    this.collectedIds = new Set();

    // 15 Distinct Tiered Collectibles across Metropolis
    this.itemConfigs = [
      // --- TIER 1: EASY (Street level, parks, plazas, piers) ---
      { id: 'col_1', name: 'Central Fountain Golden Ram', pos: new THREE.Vector3(50, 1.2, 50), tier: 'EASY', desc: 'Central Park Fountain' },
      { id: 'col_2', name: 'Valet Lot Spare Horn', pos: new THREE.Vector3(50, 1.2, -10), tier: 'EASY', desc: 'Metropolis Car Park' },
      { id: 'col_3', name: 'Harbor Pier Beacon', pos: new THREE.Vector3(-180, 2.0, 0), tier: 'EASY', desc: 'Harbor Shipping Docks' },
      { id: 'col_4', name: 'Downtown Plaza Core', pos: new THREE.Vector3(-50, 1.2, 50), tier: 'EASY', desc: 'Downtown South Plaza' },
      { id: 'col_5', name: 'West Dock Seawall Crest', pos: new THREE.Vector3(-220, 2.5, -80), tier: 'EASY', desc: 'Coastal Seawall' },

      // --- TIER 2: MEDIUM (Fire escapes, bridge arches, crane booms) ---
      { id: 'col_6', name: 'Fire Escape Relic', pos: new THREE.Vector3(75, 24.0, 75), tier: 'MEDIUM', desc: 'Mid-Rise Fire Escape' },
      { id: 'col_7', name: 'Stadium Arch Emblem', pos: new THREE.Vector3(-120, 32.0, 160), tier: 'MEDIUM', desc: 'Metropolis Stadium Arch' },
      { id: 'col_8', name: 'Construction Crane Boom', pos: new THREE.Vector3(-60, 68.0, -60), tier: 'MEDIUM', desc: 'Skyscraper Construction Crane' },
      { id: 'col_9', name: 'Midtown Rooftop Water Tower', pos: new THREE.Vector3(100, 42.0, -100), tier: 'MEDIUM', desc: 'Midtown Water Tower Crest' },
      { id: 'col_10', name: 'Billboard Truss Secret', pos: new THREE.Vector3(-100, 36.0, 80), tier: 'MEDIUM', desc: 'Cyberpunk Billboard Support' },

      // --- TIER 3: HARD / CHALLENGE (Needle spires, mid-air gaps, apex heights) ---
      { id: 'col_11', name: 'Apex Needle Spire', pos: new THREE.Vector3(0, 115.0, 0), tier: 'HARD', desc: 'Central Tower Launchdeck Spire' },
      { id: 'col_12', name: 'Mid-Air Abyss Leap', pos: new THREE.Vector3(60, 65.0, -40), tier: 'HARD', desc: 'Mid-Air Alley Gap between Twin Skyscrapers' },
      { id: 'col_13', name: 'High-Altitude Sky Crane Tip', pos: new THREE.Vector3(-40, 95.0, 120), tier: 'HARD', desc: 'Financial District Apex Crane' },
      { id: 'col_14', name: 'Under-Cantilever Blind Spot', pos: new THREE.Vector3(120, 8.5, 30), tier: 'HARD', desc: 'Overhanging Cantilever Shopfront' },
      { id: 'col_15', name: 'Skyline Pinnacle of the League', pos: new THREE.Vector3(-90, 105.0, -90), tier: 'HARD', desc: 'High-Rise Pinnacle Apex' }
    ];

    this.load();
    this.spawnItems();
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const arr = JSON.parse(saved);
        this.collectedIds = new Set(arr);
      }
    } catch (e) {
      console.warn('Collectibles load error:', e);
    }
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.collectedIds)));
    } catch (e) {
      console.warn('Collectibles save error:', e);
    }
  }

  spawnItems() {
    this.itemConfigs.forEach(cfg => {
      if (this.collectedIds.has(cfg.id)) return;

      const group = new THREE.Group();
      group.position.copy(cfg.pos);

      let color = 0xf59e0b; // Gold
      if (cfg.tier === 'EASY') color = 0x38bdf8; // Cyan
      if (cfg.tier === 'MEDIUM') color = 0xa855f7; // Purple
      if (cfg.tier === 'HARD') color = 0xf59e0b; // Pure Gold

      // 1. Shimmering 3D Golden Ram Artifact
      const ramGeo = new THREE.IcosahedronGeometry(0.7, 0);
      const ramMat = new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 2.5,
        roughness: 0.15,
        metalness: 0.9
      });
      const ramMesh = new THREE.Mesh(ramGeo, ramMat);
      group.add(ramMesh);

      // 2. Dual Orbiting Energy Halo Rings
      const ringGeo = new THREE.TorusGeometry(0.95, 0.05, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
      const ring1 = new THREE.Mesh(ringGeo, ringMat);
      const ring2 = new THREE.Mesh(ringGeo, ringMat);
      ring2.rotation.x = Math.PI / 2;
      group.add(ring1);
      group.add(ring2);

      // 3. Floating Light Beacon
      const light = new THREE.PointLight(color, 2.5, 18);
      group.add(light);

      this.scene.add(group);

      this.collectibles.push({
        id: cfg.id,
        cfg: cfg,
        group: group,
        mesh: ramMesh,
        ring1: ring1,
        ring2: ring2,
        pos: cfg.pos.clone(),
        animTime: Math.random() * 5,
        isCollected: false
      });
    });
  }

  update(player, dt) {
    if (!player) return;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const col = this.collectibles[i];
      col.animTime += dt;

      // Dynamic 3D rotation & hover oscillation
      col.mesh.rotation.y += dt * 2.8;
      col.mesh.rotation.x += dt * 1.4;
      col.ring1.rotation.y += dt * 3.2;
      col.ring2.rotation.x += dt * 2.5;

      const hoverY = col.pos.y + Math.sin(col.animTime * 3.5) * 0.35;
      col.group.position.set(col.pos.x, hoverY, col.pos.z);

      const playerCenter = player.position.clone().add(new THREE.Vector3(0, 1.0, 0));
      const dist = col.group.position.distanceTo(playerCenter);

      // Magnetic Vacuum Pull from 8.0m away!
      if (dist < 8.0) {
        const pullSpeed = Math.min(26.0, 12.0 + (8.0 - dist) * 4.0);
        const pullDir = playerCenter.clone().sub(col.group.position).normalize();
        col.pos.addScaledVector(pullDir, pullSpeed * dt);
      }

      // Collect Trigger
      if (dist < 2.5) {
        col.isCollected = true;
        this.collectedIds.add(col.id);
        this.save();

        if (this.audio && typeof this.audio.playPickup === 'function') {
          this.audio.playPickup();
        }

        if (this.achievements) {
          this.achievements.addProgress('all_collectibles', 1);
        }

        // Heal & refill web fluid on collectible find
        if (typeof player.heal === 'function') player.heal(50);
        if (typeof player.refillWebFluid === 'function') player.refillWebFluid(100);

        this.scene.remove(col.group);
        this.collectibles.splice(i, 1);
      }
    }
  }

  getCollectedCount() {
    return this.collectedIds.size;
  }

  getTotalCount() {
    return this.itemConfigs.length;
  }
}
