import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

export const Shaders = {
  // Swirling Vortex Portal Shader
  createPortalMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(0x9900ff) }, // Deep purple
        uColor2: { value: new THREE.Color(0x00f0ff) }, // Neon cyan
        uColor3: { value: new THREE.Color(0xff0077) }, // Hot pink
        uIntensity: { value: 1.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float uTime;

        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;

          // Pulsing vertex displacement along normal
          float wave = sin(position.y * 3.0 + uTime * 4.0) * cos(position.x * 3.0 + uTime * 3.0) * 0.15;
          vec3 newPos = position + normal * wave;

          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float uTime;
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        uniform vec3 uColor3;
        uniform float uIntensity;

        vec2 hash(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
        }

        float noise(vec2 p) {
          const float K1 = 0.366025404;
          const float K2 = 0.211324865;
          vec2 i = floor(p + (p.x + p.y) * K1);
          vec2 a = p - i + (i.y + i.x) * K2;
          vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec2 b = a - o + K2;
          vec2 c = a - 1.0 + 2.0 * K2;
          vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
          vec3 n = h * h * h * h * vec3(dot(a, hash(i + 0.0)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
          return dot(n, vec3(70.0));
        }

        void main() {
          vec2 center = vec2(0.5, 0.5);
          vec2 uv = vUv - center;
          float dist = length(uv);

          // Polar coordinates for swirl
          float angle = atan(uv.y, uv.x);
          float swirl = angle + 4.0 * log(dist + 0.001) - uTime * 3.5;

          // Radial bands
          float bands = sin(swirl * 6.0 + dist * 20.0 - uTime * 5.0) * 0.5 + 0.5;
          float n = noise(uv * 8.0 + vec2(uTime * 0.8, -uTime * 0.6));

          // Color blend
          vec3 col = mix(uColor1, uColor2, sin(swirl + n * 2.0) * 0.5 + 0.5);
          col = mix(col, uColor3, bands * 0.7);

          // Black hole singularity center
          float centerCore = smoothstep(0.08, 0.18, dist);
          col *= centerCore;

          // Rim glow / event horizon
          float rim = 1.0 - smoothstep(0.38, 0.5, dist);
          float outerRim = smoothstep(0.35, 0.5, dist) * (1.0 - smoothstep(0.48, 0.52, dist)) * 2.5;

          vec3 finalColor = (col + vec3(outerRim) * uColor2) * uIntensity;
          float alpha = rim * smoothstep(0.02, 0.1, dist);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  },

  // Crisp Vibrant Open-World Sky Dome Shader (Clear Sky, Procedural Daytime Clouds & Fixed Celestial Stars)
  createHeroSkyMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSkyColorDay: { value: new THREE.Color(0x38bdf8) }, // Bright crisp sky blue
        uSkyColorZenith: { value: new THREE.Color(0x0284c7) }, // Deep royal zenith
        uSkyColorHorizon: { value: new THREE.Color(0xbae6fd) }, // Warm horizon haze
        uSkyColorNight: { value: new THREE.Color(0x030712) },
        uSunPosition: { value: new THREE.Vector3(0, 1, 0) }
      },
      vertexShader: `
        varying vec3 vLocalDir;
        void main() {
          vLocalDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vLocalDir;
        uniform float uTime;
        uniform vec3 uSkyColorDay;
        uniform vec3 uSkyColorZenith;
        uniform vec3 uSkyColorHorizon;
        uniform vec3 uSkyColorNight;
        uniform vec3 uSunPosition;

        void main() {
          vec3 dir = normalize(vLocalDir);
          float height = clamp(dir.y, 0.0, 1.0);
          float sunDot = max(0.0, dot(dir, normalize(uSunPosition)));

          // Smooth sunny daytime atmosphere gradient
          vec3 dayAtmosphere = mix(uSkyColorHorizon, uSkyColorDay, smoothstep(0.0, 0.35, height));
          dayAtmosphere = mix(dayAtmosphere, uSkyColorZenith, smoothstep(0.35, 0.95, height));

          // Sun glow around sun disc
          vec3 sunGlow = vec3(1.0, 0.95, 0.75) * pow(sunDot, 64.0) * 1.5;
          sunGlow += vec3(1.0, 0.8, 0.5) * pow(sunDot, 12.0) * 0.4;

          // Procedural Fluffy Daytime Clouds
          vec2 cloudUV = dir.xz / (dir.y + 0.22) * 0.45 + vec2(uTime * 0.012, uTime * 0.006);
          float cloudNoise = sin(cloudUV.x * 3.2 + sin(cloudUV.y * 2.8)) * 0.5 + 0.5;
          cloudNoise += sin(cloudUV.x * 6.5 - cloudUV.y * 5.2 + uTime * 0.02) * 0.25;
          cloudNoise += sin(cloudUV.x * 13.0 + cloudUV.y * 11.0) * 0.125;
          float cloudCover = smoothstep(0.50, 0.72, cloudNoise) * smoothstep(0.04, 0.38, height);
          vec3 cloudColor = vec3(1.0, 0.99, 0.97); // Pure white fluffy cloud puffs

          vec3 skyWithClouds = mix(dayAtmosphere + sunGlow, cloudColor, cloudCover * 0.88);

          // Day/Night blend based on sun elevation
          float isDay = smoothstep(-0.05, 0.2, uSunPosition.y);
          vec3 baseSky = mix(uSkyColorNight, skyWithClouds, isDay);

          // Fixed celestial sphere stars (Sparse, natural, non-moving when looking around)
          vec3 starCell = floor(dir * 180.0);
          float starHash = fract(sin(dot(starCell, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
          float isStar = step(0.9978, starHash); // Very sparse, natural stars
          float starBrightness = smoothstep(0.9978, 1.0, starHash);
          float starTwinkle = 0.85 + 0.15 * sin(uTime * 1.5 + starHash * 80.0);
          vec3 stars = vec3(starBrightness * starTwinkle) * isStar * (1.0 - isDay) * smoothstep(0.08, 0.3, height);

          gl_FragColor = vec4(baseSky + stars, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false
    });
  },

  // Pixel Web Cocoon Material for stunned enemies
  createWebCocoonMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0xffffff) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        uniform float uTime;
        uniform vec3 uColor;

        void main() {
          vec2 grid = fract(vUv * 16.0);
          float lines = step(0.85, grid.x) + step(0.85, grid.y);
          lines = clamp(lines, 0.0, 1.0);

          float pulse = sin(uTime * 8.0) * 0.3 + 0.7;
          float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);

          vec3 col = uColor * (lines * 1.5 + rim * 0.8) * pulse;
          float alpha = clamp(lines * 0.8 + rim * 0.5, 0.0, 0.9);

          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
  }
};
