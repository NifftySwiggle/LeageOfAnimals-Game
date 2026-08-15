export class AchievementsSystem {
  constructor(audioSystem) {
    this.audio = audioSystem;
    this.storageKey = 'loa_superhero_achievements_v2';

    this.achievements = [
      {
        id: 'first_web',
        title: 'First Web',
        desc: 'Shoot a web line and initiate your first swing.',
        tier: 'EASY',
        icon: '🕸️',
        unlocked: false
      },
      {
        id: 'iron_flight',
        title: 'Flight Propulsion',
        desc: 'Take flight using Iron-Ram\'s repulsor jet thrusters.',
        tier: 'EASY',
        icon: '🚀',
        unlocked: false
      },
      {
        id: 'repulsor_blast',
        title: 'Plasma Artillery',
        desc: 'Fire and detonate an explosive Repulsor Plasma Bolt.',
        tier: 'EASY',
        icon: '💥',
        unlocked: false
      },
      {
        id: 'tuck_roll',
        title: 'Parkour Ram',
        desc: 'Execute 5 Tuck & Roll somersault dashes.',
        tier: 'EASY',
        icon: '💨',
        progress: 0,
        target: 5,
        unlocked: false
      },
      {
        id: 'drive_car',
        title: 'Grand Theft Auto-Ram',
        desc: 'Hijack and drive a vehicle across Metropolis.',
        tier: 'EASY',
        icon: '🚗',
        unlocked: false
      },
      {
        id: 'wall_climb_100',
        title: 'Skyscraper Clinger',
        desc: 'Climb 100 meters vertically on building facades.',
        tier: 'MEDIUM',
        icon: '🧗',
        progress: 0,
        target: 100,
        unlocked: false
      },
      {
        id: 'combo_10',
        title: 'Ram Brawler',
        desc: 'Achieve a 10-hit combat combo against enemies.',
        tier: 'MEDIUM',
        icon: '🥊',
        unlocked: false
      },
      {
        id: 'unibeam_surge',
        title: 'Arc Overload',
        desc: 'Discharge the continuous chest Arc Uni-Beam laser.',
        tier: 'MEDIUM',
        icon: '⚡',
        unlocked: false
      },
      {
        id: 'ground_slam',
        title: 'Kinetic Shockwave',
        desc: 'Unleash a Kinetic Ground Pound Slam from high altitude.',
        tier: 'MEDIUM',
        icon: '☄️',
        unlocked: false
      },
      {
        id: 'portal_wave',
        title: 'Vortex Vanquisher',
        desc: 'Clear a complete crime incursion portal wave.',
        tier: 'MEDIUM',
        icon: '🌀',
        unlocked: false
      },
      {
        id: 'supersonic_flight',
        title: 'Mach 2 Velocity',
        desc: 'Surpass 40 m/s using Iron-Ram\'s Supersonic Boost.',
        tier: 'HARD',
        icon: '✨',
        unlocked: false
      },
      {
        id: 'speed_demon',
        title: 'Hyper Sonic Speed',
        desc: 'Drive a vehicle faster than 35 m/s.',
        tier: 'HARD',
        icon: '🏎️',
        unlocked: false
      },
      {
        id: 'air_stun_5',
        title: 'Mid-Air Marksman',
        desc: 'Web-stun 5 enemies or moving cars while airborne.',
        tier: 'HARD',
        icon: '🎯',
        progress: 0,
        target: 5,
        unlocked: false
      },
      {
        id: 'summit_conqueror',
        title: 'Summit of the Gods',
        desc: 'Reach the apex of Central Skyscraper (110m+).',
        tier: 'HARD',
        icon: '🏙️',
        unlocked: false
      },
      {
        id: 'collect_5',
        title: 'Relic Seeker',
        desc: 'Discover 5 hidden Golden Bighorn Artifacts.',
        tier: 'MEDIUM',
        icon: '💎',
        progress: 0,
        target: 5,
        unlocked: false
      },
      {
        id: 'collect_10',
        title: 'Artifact Hunter',
        desc: 'Discover 10 hidden Golden Bighorn Artifacts.',
        tier: 'HARD',
        icon: '🏆',
        progress: 0,
        target: 10,
        unlocked: false
      },
      {
        id: 'all_collectibles',
        title: 'League Legend',
        desc: 'Collect all 15 hidden Golden Bighorn Artifacts.',
        tier: 'LEGENDARY',
        icon: '👑',
        progress: 0,
        target: 15,
        unlocked: false
      },
      {
        id: 'league_veteran',
        title: 'City Guardian',
        desc: 'Defeat 15 crime syndicate hostiles across the district.',
        tier: 'LEGENDARY',
        icon: '🌟',
        progress: 0,
        target: 15,
        unlocked: false
      }
    ];

    this.load();
    this.createToastContainer();
  }

  load() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.achievements.forEach(ach => {
          if (data[ach.id]) {
            ach.unlocked = data[ach.id].unlocked;
            if (ach.target !== undefined && data[ach.id].progress !== undefined) {
              ach.progress = data[ach.id].progress;
            }
          }
        });
      }
    } catch (e) {
      console.warn('Achievements load error:', e);
    }
  }

  save() {
    try {
      const data = {};
      this.achievements.forEach(ach => {
        data[ach.id] = { unlocked: ach.unlocked, progress: ach.progress };
      });
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Achievements save error:', e);
    }
  }

  unlock(id) {
    const ach = this.achievements.find(a => a.id === id);
    if (!ach || ach.unlocked) return;

    ach.unlocked = true;
    if (ach.target) ach.progress = ach.target;
    this.save();
    this.showToast(ach);

    if (this.audio && typeof this.audio.playPickup === 'function') {
      this.audio.playPickup();
    }
  }

  addProgress(id, amount = 1) {
    const ach = this.achievements.find(a => a.id === id);
    if (!ach || ach.unlocked) return;

    ach.progress = Math.min(ach.target, (ach.progress || 0) + amount);
    if (ach.progress >= ach.target) {
      this.unlock(id);
    } else {
      this.save();
    }
  }

  createToastContainer() {
    if (document.getElementById('achievement-toast-container')) return;
    const container = document.createElement('div');
    container.id = 'achievement-toast-container';
    container.className = 'achievement-toast-container';
    document.body.appendChild(container);
  }

  showToast(ach) {
    const container = document.getElementById('achievement-toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `achievement-toast tier-${ach.tier.toLowerCase()}`;
    toast.innerHTML = `
      <div class="toast-icon">${ach.icon}</div>
      <div class="toast-body">
        <div class="toast-header">
          <span class="toast-tag">🏆 ACHIEVEMENT UNLOCKED</span>
          <span class="toast-tier tier-badge-${ach.tier.toLowerCase()}">${ach.tier}</span>
        </div>
        <div class="toast-title">${ach.title}</div>
        <div class="toast-desc">${ach.desc}</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('show');
    }, 50);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 500);
    }, 4500);
  }

  getUnlockedCount() {
    return this.achievements.filter(a => a.unlocked).length;
  }

  getTotalCount() {
    return this.achievements.length;
  }
}
