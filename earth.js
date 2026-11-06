// Hero 3D scene: a realistic half-earth with a satellite and a ground station (Seoul)
// exchanging yellow light signals. Loaded as an ES module; Three.js comes from the import map.
import * as THREE from 'three';

const wrap = document.querySelector('.hero-earth');
const canvas = wrap && wrap.querySelector('canvas');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (canvas) {
  try { init(); } catch (err) { console.warn('Earth scene disabled:', err); wrap.classList.add('is-failed'); }
}

function init() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 100);

  // Earth radius 1, centre at the origin. The camera frames y = 0 .. ~1.5 so the
  // canvas bottom cuts the globe through its centre: a clean semicircle.
  const R = 1;
  const VIEW_TOP = 1.55;

  // ---------- Lights ----------
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(-1.6, 1.8, 4);
  scene.add(sun);

  // ---------- Earth ----------
  const loader = new THREE.TextureLoader();
  const tex = (name, srgb = false) => {
    const t = loader.load(`./images/earth/${name}`, () => requestRender());
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  };

  const earthGroup = new THREE.Group();
  scene.add(earthGroup);

  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(R, 96, 96),
    new THREE.MeshPhongMaterial({
      map: tex('earth_atmos_2048.jpg', true),
      normalMap: tex('earth_normal_2048.jpg'),
      normalScale: new THREE.Vector2(0.85, -0.85),
      specularMap: tex('earth_specular_2048.jpg'),
      specular: new THREE.Color(0x3a4a5a),
      shininess: 18
    })
  );
  earthGroup.add(earth);

  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.012, 96, 96),
    new THREE.MeshLambertMaterial({ map: tex('earth_clouds_1024.png', true), transparent: true, opacity: 0.8, depthWrite: false })
  );
  earthGroup.add(clouds);

  // Atmosphere: a fresnel rim slightly larger than the planet.
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(R * 1.035, 96, 96),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      uniforms: { color: { value: new THREE.Color(0x7fb8ff) } },
      vertexShader: `
        varying vec3 vNormal; varying vec3 vView;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vView = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        uniform vec3 color; varying vec3 vNormal; varying vec3 vView;
        void main() {
          // Back faces: strongest right at the planet's edge, fading out into space.
          // Back faces: |dot| is ~0.26 at the planet's edge and 0 at the shell's edge.
          float k = clamp(abs(dot(vNormal, vView)) / 0.26, 0.0, 1.0);
          float a = pow(k, 1.6) * 0.7;
          gl_FragColor = vec4(color, a);
        }`
    })
  );
  scene.add(atmosphere);

  // Turn the globe so Korea faces the viewer, a little left of centre.
  const SEOUL = { lat: 37.55, lon: 127.0 };
  const latLon = (lat, lon, r) => {
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon + 180);
    return new THREE.Vector3(-r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
  };
  const seoulLocal = latLon(SEOUL.lat, SEOUL.lon, R);
  const baseYaw = -Math.atan2(seoulLocal.x, seoulLocal.z) + 0.38;
  earthGroup.rotation.y = baseYaw;
  earthGroup.rotation.x = 0.12;

  // ---------- Glow sprite texture ----------
  function glowTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255,248,200,1)');
    grd.addColorStop(0.18, 'rgba(255,224,90,0.95)');
    grd.addColorStop(0.45, 'rgba(255,180,20,0.42)');
    grd.addColorStop(1, 'rgba(255,170,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const glowTex = glowTexture();
  const glowSprite = (scale, opacity = 1) => {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, opacity, depthWrite: false, blending: THREE.NormalBlending }));
    s.scale.setScalar(scale);
    return s;
  };

  // ---------- Ground station (Seoul) ----------
  const station = new THREE.Group();
  const towerMat = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, metalness: 0.3, roughness: 0.5 });
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.009, 0.075, 8), towerMat);
  mast.position.y = 0.0375;
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.02, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2.4), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.35, side: THREE.DoubleSide }));
  dish.position.y = 0.078; dish.rotation.x = Math.PI; // bowl opening upward
  const stationGlow = glowSprite(0.09, 0.9); stationGlow.position.y = 0.08;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.026, 48), new THREE.MeshBasicMaterial({ color: 0xffcf3a, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, blending: THREE.NormalBlending }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.002;
  station.add(mast, dish, stationGlow, ring);
  station.position.copy(latLon(SEOUL.lat, SEOUL.lon, R * 1.004));
  station.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), station.position.clone().normalize());
  earth.add(station);
  const stationTip = new THREE.Object3D(); stationTip.position.y = 0.085; station.add(stationTip);

  // ---------- Satellite ----------
  const satellite = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({ color: 0xd9a63a, metalness: 0.85, roughness: 0.32 });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1d3f8f, metalness: 0.55, roughness: 0.3, emissive: 0x0a1840, emissiveIntensity: 0.4 });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0xdedede, metalness: 0.6, roughness: 0.4 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.07), gold);
  const panelGeo = new THREE.BoxGeometry(0.11, 0.003, 0.045);
  const panelL = new THREE.Mesh(panelGeo, panelMat); panelL.position.x = -0.087;
  const panelR = new THREE.Mesh(panelGeo, panelMat); panelR.position.x = 0.087;
  const boom = new THREE.Mesh(new THREE.CylinderGeometry(0.002, 0.002, 0.18, 6), frameMat); boom.rotation.z = Math.PI / 2;
  const antenna = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.02, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.3, side: THREE.DoubleSide }));
  antenna.position.y = -0.035; // dish points toward the earth
  const satGlow = glowSprite(0.11, 0.85); satGlow.position.y = -0.045;
  satellite.add(body, boom, panelL, panelR, antenna, satGlow);
  satellite.scale.setScalar(1.7);
  scene.add(satellite);
  const satTip = new THREE.Object3D(); satTip.position.y = -0.045; satellite.add(satTip);

  // Orbit: a tilted circle; its lower half falls below the canvas and is never seen.
  const ORBIT_R = 1.36;
  const orbitTilt = new THREE.Euler(0.42, 0, -0.18);
  const orbitPos = a => new THREE.Vector3(Math.cos(a) * ORBIT_R, Math.sin(a) * ORBIT_R, 0).applyEuler(orbitTilt);

  const orbitLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(Array.from({ length: 181 }, (_, i) => orbitPos((i / 180) * Math.PI * 2))),
    new THREE.LineDashedMaterial({ color: 0x9a9a92, dashSize: 0.02, gapSize: 0.025, transparent: true, opacity: 0.55 })
  );
  orbitLine.computeLineDistances();
  scene.add(orbitLine);

  // ---------- Link beam ----------
  const beamGroup = new THREE.Group();
  scene.add(beamGroup);
  const beamCore = new THREE.Mesh(new THREE.CylinderGeometry(0.0022, 0.0022, 1, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xffcf33, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.NormalBlending }));
  const beamHalo = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 1, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xffb800, transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.NormalBlending }));
  beamGroup.add(beamHalo, beamCore);
  const pulses = Array.from({ length: 6 }, (_, i) => {
    const s = glowSprite(i % 2 ? 0.05 : 0.065);
    s.userData = { offset: i / 6, up: i % 2 === 0 };
    beamGroup.add(s);
    return s;
  });

  // ---------- Layout ----------
  function resize() {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Fit the view height (0..VIEW_TOP) and make sure the globe also fits horizontally.
    const halfH = VIEW_TOP / 2;
    const fitH = halfH / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const halfW = camera.aspect < 2 ? R * 1.15 : R * 1.5; // narrow screens: let the orbit run off the sides
    const fitW = halfW / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    const d = Math.max(fitH, fitW);
    const centreY = d === fitH ? halfH : Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * d;
    camera.position.set(0, centreY, d);
    camera.lookAt(0, centreY, 0);
    camera.updateProjectionMatrix();
    requestRender();
  }
  new ResizeObserver(resize).observe(wrap);

  // ---------- Animation ----------
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  let visible = true, frameRequested = false, start = performance.now();

  function update(t) {
    const sec = t / 1000;
    earthGroup.rotation.y = baseYaw + Math.sin(sec * 0.05) * 0.12;
    clouds.rotation.y = sec * 0.01;

    // Satellite crosses the sky left → right in ~20 s, then returns quickly below the horizon.
    const PERIOD = 24, VISIBLE = 0.83;
    const p = (sec % PERIOD) / PERIOD;
    const angle = p < VISIBLE ? Math.PI * (1.04 - 1.08 * (p / VISIBLE))
                              : -Math.PI * 0.04 - Math.PI * 0.92 * ((p - VISIBLE) / (1 - VISIBLE));
    satellite.position.copy(orbitPos(angle));
    satellite.lookAt(0, 0, 0); satellite.rotateX(-Math.PI / 2); // antenna (-y) faces the earth
    panelL.rotation.x = panelR.rotation.x = Math.sin(sec * 0.3) * 0.15;

    // Ground-station ring ripple
    const rip = (sec * 0.7) % 1;
    ring.scale.setScalar(1 + rip * 2.6);
    ring.material.opacity = 0.85 * (1 - rip);

    // Link while the satellite is up in the visible sky.
    stationTip.getWorldPosition(tmpA);
    satTip.getWorldPosition(tmpB);
    const strength = THREE.MathUtils.smoothstep(tmpB.y, 0.3, 0.6);
    beamGroup.visible = strength > 0.01;
    if (beamGroup.visible) {
      const dir = tmpB.clone().sub(tmpA);
      const len = dir.length();
      beamCore.scale.y = beamHalo.scale.y = len;
      [beamCore, beamHalo].forEach(m => {
        m.position.copy(tmpA).addScaledVector(dir, 0.5);
        m.quaternion.setFromUnitVectors(up, dir.clone().normalize());
      });
      beamCore.material.opacity = 0.9 * strength;
      beamHalo.material.opacity = (0.22 + Math.sin(sec * 6) * 0.06) * strength;
      pulses.forEach(p => {
        let k = (sec * 0.45 + p.userData.offset) % 1;
        if (!p.userData.up) k = 1 - k;
        p.position.copy(tmpA).addScaledVector(dir, k);
        p.material.opacity = Math.sin(k * Math.PI) * strength;
      });
    }
    stationGlow.material.opacity = 0.55 + 0.4 * strength;
    satGlow.material.opacity = 0.45 + 0.45 * strength;
  }

  function render(t) {
    frameRequested = false;
    update(reduceMotion ? start + 4000 : t);
    renderer.render(scene, camera);
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
