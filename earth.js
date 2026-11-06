// Hero 3D scene: photoreal half-earth in deep space. Day/night terminator with a sunset glow,
// flickering city lights on the night side, a detailed satellite in low orbit firing a laser
// at a ground target (Seoul). Three.js + addons come from the import map in index.html.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const wrap = document.querySelector('.hero-earth');
const canvas = wrap && wrap.querySelector('canvas');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas) {
  try { init(); } catch (err) { console.warn('Earth scene disabled:', err); wrap.classList.add('is-failed'); }
}

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const DPR = Math.min(devicePixelRatio || 1, matchMedia('(max-width: 700px)').matches ? 1.5 : 2);
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 200);

  const R = 1;                // earth radius; centre at the origin
  const VIEW_TOP = 1.5;       // canvas shows y = 0 .. VIEW_TOP: a half-earth sitting on the bottom edge
  // Sun from behind-left: day on the left, night on the right, terminator across the disc.
  const SUN_DIR = new THREE.Vector3(-1.0, 0.32, 0.42).normalize();

  // ---------- Textures ----------
  const loader = new THREE.TextureLoader();
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const tex = (name, srgb = true) => {
    const t = loader.load(`./images/earth/${name}`, () => requestRender());
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    return t;
  };
  const dayMap = tex('earth_atmos_2048.jpg');
  const nightMap = tex('earth_lights_2048.png');
  const specMap = tex('earth_specular_2048.jpg', false);
  const cloudMap = tex('earth_clouds_1024.png');

  const shared = { sunDir: { value: SUN_DIR }, time: { value: 0 } };

  // ---------- Earth ----------
  const earthGroup = new THREE.Group();
  scene.add(earthGroup);

  const surfaceVertex = `
      varying vec2 vUv; varying vec3 vNormalW; varying vec3 vPosW;
      void main() {
        vUv = uv;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vPosW = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`;

  const earthMat = new THREE.ShaderMaterial({
    uniforms: { ...shared, dayMap: { value: dayMap }, nightMap: { value: nightMap }, specMap: { value: specMap } },
    vertexShader: surfaceVertex,
    fragmentShader: `
      uniform sampler2D dayMap; uniform sampler2D nightMap; uniform sampler2D specMap;
      uniform vec3 sunDir; uniform float time;
      varying vec2 vUv; varying vec3 vNormalW; varying vec3 vPosW;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        vec3 n = normalize(vNormalW);
        vec3 V = normalize(cameraPosition - vPosW);
        float ndl = dot(n, sunDir);
        float day = smoothstep(-0.12, 0.22, ndl);
        float twilight = exp(-pow((ndl - 0.02) * 6.0, 2.0));

        vec3 albedo = texture2D(dayMap, vUv).rgb;
        vec3 col = albedo * (max(ndl, 0.0) * 1.25 + 0.012);
        col += albedo * vec3(1.0, 0.42, 0.12) * twilight * 0.4;           // sunset band

        // Ocean glint
        float water = texture2D(specMap, vUv).r;
        vec3 H = normalize(sunDir + V);
        col += vec3(1.0, 0.78, 0.5) * pow(max(dot(n, H), 0.0), 60.0) * water * day * 0.6;

        // City lights, flickering in small clusters
        vec3 lights = texture2D(nightMap, vUv).rgb;
        vec2 cell = floor(vUv * vec2(900.0, 450.0));
        float h = hash(cell);
        float flicker = 0.72 + 0.28 * sin(time * (1.5 + h * 4.0) + h * 6.2831);
        flicker *= 0.85 + 0.15 * step(0.5, fract(time * 0.7 + h * 3.0));
        float night = 1.0 - smoothstep(-0.2, 0.08, ndl);
        col += pow(lights, vec3(1.3)) * vec3(1.0, 0.72, 0.38) * night * flicker * 3.6;

        // Atmospheric scattering on the disc edge
        float fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);
        vec3 airDay = vec3(0.32, 0.6, 1.0);
        vec3 airSet = vec3(1.0, 0.45, 0.15);
        vec3 air = mix(airSet, airDay, smoothstep(0.0, 0.45, ndl));
        col += air * fres * smoothstep(-0.25, 0.3, ndl) * 0.55;

        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const earth = new THREE.Mesh(new THREE.SphereGeometry(R, 128, 128), earthMat);
  earthGroup.add(earth);

  const cloudMat = new THREE.ShaderMaterial({
    uniforms: { ...shared, cloudMap: { value: cloudMap } },
    transparent: true,
    depthWrite: false,
    vertexShader: surfaceVertex,
    fragmentShader: `
      uniform sampler2D cloudMap; uniform vec3 sunDir;
      varying vec2 vUv; varying vec3 vNormalW; varying vec3 vPosW;
      void main() {
        vec3 n = normalize(vNormalW);
        float ndl = dot(n, sunDir);
        vec4 ct = texture2D(cloudMap, vUv); float c = ct.a * ct.r;
        float day = smoothstep(-0.15, 0.25, ndl);
        float twilight = exp(-pow((ndl - 0.02) * 6.0, 2.0));
        vec3 col = vec3(1.0) * (max(ndl, 0.0) * 1.05 + 0.008) + vec3(1.0, 0.5, 0.2) * twilight * 0.45;
        gl_FragColor = vec4(col, c * mix(0.35, 0.9, day));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`
  });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.008, 128, 128), cloudMat);
  earthGroup.add(clouds);

  // Outer atmosphere halo
  const ATM = 1.06, ATM_EDGE = Math.sqrt(1 - 1 / (ATM * ATM));
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(R * ATM, 128, 128),
    new THREE.ShaderMaterial({
      uniforms: { ...shared, edge: { value: ATM_EDGE } },
      transparent: true, depthWrite: false, side: THREE.BackSide, blending: THREE.AdditiveBlending,
      vertexShader: `
        varying vec3 vNormalW; varying vec3 vPosW;
        void main() {
          vNormalW = normalize(mat3(modelMatrix) * normal);
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vPosW = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        uniform vec3 sunDir; uniform float edge;
        varying vec3 vNormalW; varying vec3 vPosW;
        void main() {
          vec3 n = normalize(vNormalW);
          vec3 V = normalize(cameraPosition - vPosW);
          float k = clamp(abs(dot(n, V)) / edge, 0.0, 1.0);
          float ndl = dot(n, sunDir);
          vec3 airDay = vec3(0.3, 0.58, 1.0);
          vec3 airSet = vec3(1.0, 0.42, 0.12);
          vec3 col = mix(airSet, airDay, smoothstep(0.0, 0.5, ndl));
          float lit = smoothstep(-0.35, 0.25, ndl);
          gl_FragColor = vec4(col * pow(k, 2.2) * lit * 0.9, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`
    })
  );
  scene.add(atmosphere);

  // Point Korea toward the viewer, right of centre near the dusk line.
  const latLon = (lat, lon, r) => {
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon + 180);
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
  };
  const TARGET = { lat: 37.55, lon: 127.0 }; // Seoul
  const targetLocal = latLon(TARGET.lat, TARGET.lon, R);
  const baseYaw = -Math.atan2(targetLocal.x, targetLocal.z) + 0.42;
  earthGroup.rotation.set(0.1, baseYaw, 0);

  // ---------- Stars ----------
  {
    const N = 1800, pos = new Float32Array(N * 3), seed = new Float32Array(N), size = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = Math.random() * 22 - 2;
      pos[i * 3 + 2] = -25 - Math.random() * 30;
      seed[i] = Math.random();
      size[i] = Math.random() < 0.06 ? 2.2 : 0.8 + Math.random() * 0.9;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
    g.setAttribute('size', new THREE.BufferAttribute(size, 1));
    scene.add(new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: { time: shared.time, dpr: { value: DPR } },
      transparent: true, depthWrite: false,
      vertexShader: `
        attribute float seed; attribute float size; uniform float time; uniform float dpr; varying float vA;
        void main() {
          vA = (0.35 + 0.65 * seed) * (0.75 + 0.25 * sin(time * (0.6 + seed * 1.8) + seed * 40.0));
          gl_PointSize = size * dpr;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying float vA;
        void main() {
          float d = length(gl_PointCoord - 0.5);
          gl_FragColor = vec4(vec3(0.85, 0.9, 1.0) * vA, smoothstep(0.5, 0.1, d) * vA);
        }`
    })));
  }

  // ---------- Lights for the satellite ----------
  scene.add(new THREE.AmbientLight(0x8899bb, 0.25));
  const sun = new THREE.DirectionalLight(0xfff1dd, 3.2);
  sun.position.copy(SUN_DIR).multiplyScalar(10);
  scene.add(sun);
  const earthshine = new THREE.DirectionalLight(0x4d7cff, 0.5);
  earthshine.position.set(0, -1, 0.3);
  scene.add(earthshine);

  // ---------- Glow sprite ----------
  const glowTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,250,225,1)');
    grd.addColorStop(0.15, 'rgba(255,214,90,0.9)');
    grd.addColorStop(0.4, 'rgba(255,150,30,0.28)');
    grd.addColorStop(1, 'rgba(255,120,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const glowSprite = (scale, opacity = 1) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.scale.setScalar(scale);
    return s;
  };

  // ---------- Ground target (Seoul) ----------
  const target = new THREE.Group();
  target.position.copy(latLon(TARGET.lat, TARGET.lon, R * 1.002));
  target.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), target.position.clone().normalize());
  earth.add(target);
  const impact = glowSprite(0.07, 0); impact.position.y = 0.004;
  const rings = [0, 1, 2].map(i => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.012, 0.0145, 64), new THREE.MeshBasicMaterial({ color: 0xffc94a, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.rotation.x = -Math.PI / 2; m.userData.offset = i / 3;
    target.add(m);
    return m;
  });
  target.add(impact);
  const targetPoint = new THREE.Object3D(); targetPoint.position.y = 0.003; target.add(targetPoint);

  // ---------- Satellite ----------
  function foilTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#c8963a'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 260; i++) {
      const x = Math.random() * 256, y = Math.random() * 256, w = 8 + Math.random() * 40, h = 6 + Math.random() * 30;
      g.fillStyle = `hsla(${36 + Math.random() * 10}, ${55 + Math.random() * 30}%, ${35 + Math.random() * 40}%, 0.35)`;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + Math.random() * 8); g.lineTo(x + w * 0.7, y + h); g.lineTo(x - 4, y + h * 0.8); g.closePath(); g.fill();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function panelTexture() {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#c9ced6'; g.fillRect(0, 0, 256, 128);
    const pad = 3;
    for (let x = 0; x < 8; x++) for (let y = 0; y < 4; y++) {
      const cx = x * 32 + pad, cy = y * 32 + pad;
      const grd = g.createLinearGradient(cx, cy, cx + 26, cy + 26);
      grd.addColorStop(0, '#1c3a8c'); grd.addColorStop(1, '#0b1a4a');
      g.fillStyle = grd; g.fillRect(cx, cy, 32 - pad * 2, 32 - pad * 2);
      g.strokeStyle = 'rgba(150,180,255,0.25)'; g.lineWidth = 1;
      for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(cx, cy + k * 6.5); g.lineTo(cx + 26, cy + k * 6.5); g.stroke(); }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = maxAniso; return t;
  }

  const satellite = new THREE.Group();
  const foil = new THREE.MeshStandardMaterial({ map: foilTexture(), metalness: 0.9, roughness: 0.28 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xd8dbe0, metalness: 0.85, roughness: 0.25 });
  const panelMat = new THREE.MeshStandardMaterial({ map: panelTexture(), metalness: 0.6, roughness: 0.22, emissive: 0x0a1a4a, emissiveIntensity: 0.25 });
  const panelBack = new THREE.MeshStandardMaterial({ color: 0x9aa0a8, metalness: 0.7, roughness: 0.4 });

  const bus = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.05), foil);
  const topDeck = new THREE.Mesh(new THREE.BoxGeometry(0.054, 0.006, 0.054), silver); topDeck.position.y = 0.033;
  const botDeck = topDeck.clone(); botDeck.position.y = -0.033;
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.32, 8), silver); boom.rotation.z = Math.PI / 2;
  const panelGeo = new THREE.BoxGeometry(0.12, 0.0025, 0.05);
  const panelMats = [panelBack, panelBack, panelMat, panelMat, panelBack, panelBack];
  const panels = [-1, 1].map(side => {
    const p = new THREE.Group();
    const a = new THREE.Mesh(panelGeo, panelMats); a.position.x = side * 0.095;
    const b = new THREE.Mesh(panelGeo, panelMats); b.position.x = side * 0.22;
    p.add(a, b);
    satellite.add(p);
    return p;
  });
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.026, 32, 12, 0, Math.PI * 2, 0, Math.PI / 3.2), new THREE.MeshStandardMaterial({ color: 0xf4f4f0, metalness: 0.25, roughness: 0.35, side: THREE.DoubleSide }));
  dish.position.y = 0.05;
  const feed = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.03, 6), silver); feed.position.y = 0.045;
  const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.011, 0.016, 20), silver); emitter.position.y = -0.042;
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.007, 20), new THREE.MeshBasicMaterial({ color: 0xffe9a8 }));
  lens.rotation.x = Math.PI / 2; lens.position.y = -0.0505;
  const emitGlow = glowSprite(0.08, 0.9); emitGlow.position.y = -0.052;
  satellite.add(bus, topDeck, botDeck, boom, dish, feed, emitter, lens, emitGlow);
  satellite.scale.setScalar(1.25);
  scene.add(satellite);
  const emitPoint = new THREE.Object3D(); emitPoint.position.y = -0.051; satellite.add(emitPoint);

  // Low orbit, tilted so the satellite passes in front of the limb.
  const ORBIT_R = 1.24;
  const orbitTilt = new THREE.Euler(0.5, 0, -0.2);
  const orbitPos = ang => new THREE.Vector3(Math.cos(ang) * ORBIT_R, Math.sin(ang) * ORBIT_R, 0).applyEuler(orbitTilt);

  // ---------- Laser ----------
  const laser = new THREE.Group();
  scene.add(laser);
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { time: shared.time, strength: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      uniform float time; uniform float strength; varying vec2 vUv;
      void main() {
        float flow = 0.82 + 0.18 * sin(vUv.y * 90.0 + time * 22.0);
        vec3 col = vec3(1.0, 0.86, 0.45) * 3.2 * flow;
        gl_FragColor = vec4(col * strength, strength);
      }`
  });
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 1, 10, 1, true), beamMat);
  const haloMat = new THREE.MeshBasicMaterial({ color: 0xffa21a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const halo = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 14, 1, true), haloMat);
  laser.add(halo, core);

  // ---------- Post-processing ----------
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.45, 0.92);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  // ---------- Layout ----------
  function resize() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfH = VIEW_TOP / 2;
    const halfW = camera.aspect < 2 ? R * 1.12 : R * 1.45; // narrow screens: let the orbit run off the sides
    const fitH = halfH / tanH;
    const fitW = halfW / (tanH * camera.aspect);
    const d = Math.max(fitH, fitW);
    const centreY = d === fitH ? halfH : tanH * d;
    camera.position.set(0, centreY, d);
    camera.lookAt(0, centreY, 0);
    camera.updateProjectionMatrix();
    requestRender();
  }
  new ResizeObserver(resize).observe(wrap);

  // ---------- Animation ----------
  const a = new THREE.Vector3(), b = new THREE.Vector3(), v = new THREE.Vector3(), dir = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0), down = new THREE.Vector3(0, -1, 0), qInv = new THREE.Quaternion(), local = new THREE.Vector3();
  let visible = true, frameRequested = false;
  const start = performance.now();

  function update(t) {
    const sec = (t - start) / 1000;
    shared.time.value = sec;
    earthGroup.rotation.y = baseYaw + Math.sin(sec * 0.04) * 0.08;
    clouds.rotation.y = sec * 0.006;

    // Pass left → right in ~22 s, return quickly below the horizon.
    const PERIOD = 26, VISIBLE = 0.85;
    const p = ((sec + 9) % PERIOD) / PERIOD;
    const ang = p < VISIBLE ? Math.PI * (1.05 - 1.1 * (p / VISIBLE))
                            : -Math.PI * 0.05 - Math.PI * 0.9 * ((p - VISIBLE) / (1 - VISIBLE));
    satellite.position.copy(orbitPos(ang));
    satellite.visible = p < VISIBLE; // hide the fast return trip

    // Aim the emitter (-y) at the target; tilt the panels toward the sun.
    targetPoint.getWorldPosition(b);
    dir.copy(b).sub(satellite.position).normalize();
    satellite.quaternion.setFromUnitVectors(down, dir);
    local.copy(SUN_DIR).applyQuaternion(qInv.copy(satellite.quaternion).invert());
    panels.forEach(pn => { pn.rotation.x = Math.atan2(local.z, local.y) * 0.6; });

    emitPoint.getWorldPosition(a);
    const strength = THREE.MathUtils.smoothstep(satellite.position.y, 0.25, 0.55);
    laser.visible = strength > 0.01;
    if (laser.visible) {
      v.copy(b).sub(a);
      const len = v.length();
      v.divideScalar(len);
      for (const m of [core, halo]) {
        m.scale.y = len;
        m.position.copy(a).lerp(b, 0.5);
        m.quaternion.setFromUnitVectors(up, v);
      }
      beamMat.uniforms.strength.value = strength * (0.92 + 0.08 * Math.sin(sec * 31.0));
      haloMat.opacity = 0.22 * strength;
    }
    impact.material.opacity = strength * (0.85 + 0.15 * Math.sin(sec * 9));
    impact.scale.setScalar(0.06 + 0.012 * Math.sin(sec * 5));
    rings.forEach(r => {
      const k = (sec * 0.6 + r.userData.offset) % 1;
      r.scale.setScalar(1 + k * 3.2);
      r.material.opacity = (1 - k) * 0.8 * strength;
    });
    emitGlow.material.opacity = 0.35 + 0.6 * strength;
  }

  function render(t) {
    frameRequested = false;
    update(reduceMotion ? start + 9000 : t);
    composer.render();
    if (!reduceMotion && visible) requestRender();
  }
  function requestRender() {
    if (frameRequested) return;
    frameRequested = true;
    requestAnimationFrame(render);
  }

  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) requestRender();
  }).observe(wrap);

  resize();
  wrap.classList.add('is-ready');
}
