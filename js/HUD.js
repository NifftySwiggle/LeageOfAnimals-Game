export class HUD {
  constructor() {
    this.healthBar = document.getElementById('health-bar-fill');
    this.healthText = document.getElementById('health-text');
    this.webFluidBar = document.getElementById('web-bar-fill');
    this.webFluidText = document.getElementById('web-text');
    this.comboCounter = document.getElementById('combo-counter');
    this.comboValue = document.getElementById('combo-value');
    this.missionText = document.getElementById('mission-objective');
    this.enemyCountText = document.getElementById('enemy-count');
    this.vortexAlert = document.getElementById('vortex-alert');
    this.speedText = document.getElementById('speed-value');

    // Minimap Canvas
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas ? this.minimapCanvas.getContext('2d') : null;
    this.minimapRange = 220; // World unit visibility radius on minimap

    // Minimization Controls
    this.missionCard = document.getElementById('mission-card');
    this.btnMinimizeMission = document.getElementById('btn-minimize-mission');
    this.missionCollapsedPill = document.getElementById('mission-collapsed-pill');
    this.missionCollapsedDist = document.getElementById('m-pill-dist');
    this.minimapContainer = document.getElementById('minimap-container');
    this.btnMinimizeRadar = document.getElementById('btn-minimize-radar');
    this.radarCollapsedPill = document.getElementById('radar-collapsed-pill');

    this.initMinimization();
  }

  initMinimization() {
    this.isMissionMinimized = localStorage.getItem('loa_mission_minimized') === 'true';
    this.isRadarMinimized = localStorage.getItem('loa_radar_minimized') === 'true';

    this.applyMissionMinimizedState();
    this.applyRadarMinimizedState();

    if (this.btnMinimizeMission) {
      this.btnMinimizeMission.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setMissionMinimized(true);
      });
    }

    if (this.missionCollapsedPill) {
      this.missionCollapsedPill.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setMissionMinimized(false);
      });
    }

    if (this.btnMinimizeRadar) {
      this.btnMinimizeRadar.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setRadarMinimized(true);
      });
    }

    const minimapHeader = document.querySelector('.minimap-header-dock');
    if (minimapHeader) {
      minimapHeader.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setRadarMinimized(true);
      });
    }

    if (this.radarCollapsedPill) {
      this.radarCollapsedPill.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setRadarMinimized(false);
      });
    }
  }

  setMissionMinimized(minimized) {
    this.isMissionMinimized = minimized;
    localStorage.setItem('loa_mission_minimized', minimized ? 'true' : 'false');
    this.applyMissionMinimizedState();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(minimized ? 20 : [15, 25]); } catch (e) {}
    }
    if (window.audioSystem && window.audioSystem.playRadarToggle) {
      window.audioSystem.playRadarToggle(!minimized);
    }
  }

  applyMissionMinimizedState() {
    if (this.missionCard) {
      this.missionCard.classList.toggle('minimized', this.isMissionMinimized);
    }
    if (this.missionCollapsedPill) {
      this.missionCollapsedPill.style.display = this.isMissionMinimized ? 'flex' : 'none';
    }
  }

  setRadarMinimized(minimized) {
    this.isRadarMinimized = minimized;
    localStorage.setItem('loa_radar_minimized', minimized ? 'true' : 'false');
    this.applyRadarMinimizedState();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(minimized ? 20 : [15, 25]); } catch (e) {}
    }
    if (window.audioSystem && window.audioSystem.playRadarToggle) {
      window.audioSystem.playRadarToggle(!minimized);
    }
  }

  applyRadarMinimizedState() {
    if (this.minimapContainer) {
      this.minimapContainer.classList.toggle('minimized', this.isRadarMinimized);
    }
    if (this.radarCollapsedPill) {
      this.radarCollapsedPill.style.display = this.isRadarMinimized ? 'flex' : 'none';
    }
  }

  updateHeroDisplay(characterType) {
    const heroName = document.getElementById('hud-hero-name');
    const healthLabel = document.getElementById('hud-health-label');
    const fluidLabel = document.getElementById('hud-fluid-label');

    if (characterType === 'iron_ram') {
      if (heroName) heroName.textContent = '🛡️ IRON-RAM';
      if (healthLabel) healthLabel.textContent = 'ARMOR INTEGRITY';
      if (fluidLabel) fluidLabel.textContent = 'ARC REACTOR POWER';
    } else {
      if (heroName) heroName.textContent = '🐏 SPIDER-RAM';
      if (healthLabel) healthLabel.textContent = 'SUIT INTEGRITY';
      if (fluidLabel) fluidLabel.textContent = 'WEB FLUID';
    }
  }

  update(player, portalManager, city, isVortexStorm, dt) {
    // 1. Health Bar Update
    if (this.healthBar) {
      const healthPct = (player.health / player.maxHealth) * 100;
      this.healthBar.style.width = `${healthPct}%`;
      this.healthText.textContent = `${Math.ceil(player.health)} / ${player.maxHealth}`;

      if (healthPct < 25) {
        this.healthBar.classList.add('low-health');
      } else {
        this.healthBar.classList.remove('low-health');
      }
    }

    // 2. Web Fluid Bar Update
    if (this.webFluidBar) {
      const fluidPct = (player.webFluid / player.maxWebFluid) * 100;
      this.webFluidBar.style.width = `${fluidPct}%`;
      this.webFluidText.textContent = `${Math.ceil(player.webFluid)}%`;
    }

    // 3. Combo Counter Update
    if (this.comboCounter) {
      if (player.comboCount > 1) {
        this.comboCounter.style.display = 'block';
        this.comboValue.textContent = `${player.comboCount}x HIT!`;
      } else {
        this.comboCounter.style.display = 'none';
      }
    }

    // 4. Speedometer
    if (this.speedText) {
      const speedMph = Math.round(player.velocity.length() * 2.236);
      this.speedText.textContent = `${speedMph} MPH`;
    }

    // 5. Mission Tracker & Harbor Distance
    const mission = portalManager.getMissionProgress();
    if (mission) {
      const distToZone = Math.round(player.position.distanceTo(mission.zoneCenter));
      const distElem = document.getElementById('mission-distance');
      const progFill = document.getElementById('mission-progress-fill');

      const distStr = mission.isComplete ? 'CLEARED' : `${distToZone}m`;
      if (distElem) {
        distElem.textContent = distStr;
      }
      if (this.missionCollapsedDist) {
        this.missionCollapsedDist.textContent = distStr;
      }

      if (progFill) {
        const pct = (mission.defeated / mission.total) * 100;
        progFill.style.width = `${pct}%`;
      }

      if (this.enemyCountText) {
        if (mission.isComplete) {
          this.enemyCountText.textContent = 'STATUS: ZONE CLEARED! SCANNING...';
          this.enemyCountText.style.color = '#00ff88';
        } else {
          this.enemyCountText.textContent = `Zone Targets: ${mission.defeated} / ${mission.total} Defeated`;
          this.enemyCountText.style.color = '#ff0055';
        }
      }

      if (this.missionText) {
        this.missionText.textContent = mission.isComplete
          ? 'Mission Complete: Area secured! Next crime hotspot locating...'
          : (mission.zoneTitle || 'Neutralize the Active Crime Syndicate');
      }
    }

    // 6. Threat Alert Status
    if (this.vortexAlert) {
      if (!mission.isComplete) {
        this.vortexAlert.style.display = 'block';
        this.vortexAlert.textContent = `🚨 ACTIVE THREAT: ${mission.zoneTitle || 'CRIME ZONE'}`;
      } else {
        this.vortexAlert.style.display = 'none';
      }
    }

    // 7. Collectibles Counter Update
    const colElem = document.getElementById('collectibles-hud-text');
    if (colElem && player.collectiblesCount !== undefined) {
      colElem.textContent = `${player.collectiblesCount} / 15`;
    }

    // 8. Render 2D Radar Minimap (Top Right)
    this.renderMinimap(player, portalManager, city);
  }

  updateCollectibles(count, total = 15) {
    const colElem = document.getElementById('collectibles-hud-text');
    if (colElem) {
      colElem.textContent = `${count} / ${total}`;
    }
  }

  renderMinimap(player, portalManager, city) {
    if (this.isRadarMinimized) return;
    if (!this.minimapCtx || !this.minimapCanvas) return;
    const ctx = this.minimapCtx;
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = (w / 2) / this.minimapRange;

    // Clear background
    ctx.fillStyle = 'rgba(10, 15, 26, 0.9)';
    ctx.fillRect(0, 0, w, h);

    // Draw circular grid rings
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, w * 0.25, 0, Math.PI * 2);
    ctx.arc(cx, cy, w * 0.46, 0, Math.PI * 2);
    ctx.stroke();

    // Radar scanline sweep
    const scanAngle = (performance.now() * 0.002) % (Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 240, 255, 0.09)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, w * 0.48, scanAngle, scanAngle + 0.45);
    ctx.closePath();
    ctx.fill();

    const px = player.position.x;
    const pz = player.position.z;

    // Draw Nearby Building Colliders
    ctx.fillStyle = 'rgba(60, 75, 100, 0.55)';
    for (let i = 0; i < city.buildingColliders.length; i++) {
      const box = city.buildingColliders[i];
      const bx = (box.min.x + box.max.x) / 2 - px;
      const bz = (box.min.z + box.max.z) / 2 - pz;
      const bw = (box.max.x - box.min.x) * scale;
      const bd = (box.max.z - box.min.z) * scale;

      if (Math.hypot(bx, bz) < this.minimapRange) {
        ctx.fillRect(cx + bx * scale - bw / 2, cy + bz * scale - bd / 2, bw, bd);
      }
    }

    // Draw Active Mission Waypoint
    for (let i = 0; i < portalManager.portals.length; i++) {
      const portal = portalManager.portals[i];
      const rx = (portal.position.x - px) * scale;
      const rz = (portal.position.z - pz) * scale;

      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(cx + rx, cy + rz, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw Enemy Blips (Yellow/Red dots)
    const enemies = portalManager.getAllEnemies();
    ctx.fillStyle = '#ffea00';
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      const ex = (enemy.position.x - px) * scale;
      const ez = (enemy.position.z - pz) * scale;

      ctx.beginPath();
      ctx.arc(cx + ex, cy + ez, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Rotating Player Directional Arrow (Facing / Walking Direction)
    const forward = player.getForwardVector();
    const arrowAngle = Math.atan2(forward.x, -forward.z);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(arrowAngle);

    // Glowing Arrow Shape pointing in exact walking/facing direction
    ctx.fillStyle = '#00f0ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -10); // Tip pointing forward
    ctx.lineTo(7, 8);
    ctx.lineTo(0, 3);
    ctx.lineTo(-7, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Render Full Tactical Metropolis Map for Pause Menu
  renderTacticalMap(canvas, player, portalManager, city) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const mapScale = (w * 0.44) / 550; // City spans ~1100m

    // Clear background
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, w, h);

    // City grid lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw all building footprints
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let i = 0; i < city.buildingColliders.length; i++) {
      const box = city.buildingColliders[i];
      const bx = (box.min.x + box.max.x) / 2;
      const bz = (box.min.z + box.max.z) / 2;
      const bw = (box.max.x - box.min.x) * mapScale;
      const bd = (box.max.z - box.min.z) * mapScale;

      ctx.fillRect(cx + bx * mapScale - bw / 2, cy + bz * mapScale - bd / 2, bw, bd);
      ctx.strokeRect(cx + bx * mapScale - bw / 2, cy + bz * mapScale - bd / 2, bw, bd);
    }

    // Draw Active Mission Waypoint on Tactical Map
    const mission = portalManager.getMissionProgress();
    if (mission && mission.zoneCenter) {
      const mx = cx + mission.zoneCenter.x * mapScale;
      const mz = cy + mission.zoneCenter.z * mapScale;

      ctx.fillStyle = 'rgba(255, 0, 85, 0.3)';
      ctx.beginPath();
      ctx.arc(mx, mz, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.arc(mx, mz, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffea00';
      ctx.font = 'bold 12px "Orbitron", sans-serif';
      ctx.fillText('TARGET ZONE', mx + 12, mz + 4);
    }

    // Draw Player GPS Position on Tactical Map
    const px = cx + player.position.x * mapScale;
    const pz = cy + player.position.z * mapScale;
    const forward = player.getForwardVector();
    const mapArrowAngle = Math.atan2(forward.x, -forward.z);

    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(mapArrowAngle);
    ctx.fillStyle = '#00f0ff';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(8, 9);
    ctx.lineTo(0, 4);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 12px "Orbitron", sans-serif';
    ctx.fillText('SPIDER-RAM', px + 12, pz + 4);
  }
}
