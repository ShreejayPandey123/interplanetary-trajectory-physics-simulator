/**
 * ============================================================================
 * INTERPLANETARY: DEEP SPACE SLINGSHOT FLYBY - FULL CINEMATIC MOVIE ENGINE
 * ============================================================================
 * Features:
 *   - Full-Screen 3D WebGL Space Movie Viewport (100% Canvas Coverage)
 *   - Hollywood-Style Camera Motion (Dolly, Low-Angle Swoop, Orbital Spin)
 *   - Ion Plasma Thruster Particle Trails & Solar Lens Flare FX
 *   - Dynamic On-Screen Movie Subtitles & Storytelling
 * ============================================================================
 */

const AU_SCALE = 5.0; // 1 AU = 5 units in Three.js
const AU_PER_YEAR_TO_KMS = 4.74047046; // 1 AU/year = 4.74047 km/s

const CELESTIAL_BODIES = {
    Sun:     { radius: 0.7,  color: 0xffb703 },
    Mercury: { a: 0.3871, radius: 0.06, color: 0xa8a8a8, period: 0.2408 },
    Venus:   { a: 0.7233, radius: 0.14, color: 0xe8c373, period: 0.6152 },
    Earth:   { a: 1.0,    radius: 0.16, color: 0x3a86ff, period: 1.0 },
    Mars:    { a: 1.5237, radius: 0.12, color: 0xc1440e, period: 1.88 },
    Jupiter: { a: 5.2044, radius: 0.42, color: 0xe0a96d, period: 11.86 },
    Saturn:  { a: 9.5826, radius: 0.36, color: 0xead6a6, period: 29.46 },
    Uranus:  { a: 19.218, radius: 0.22, color: 0x7ec8e3, period: 84.01 },
    Neptune: { a: 30.070, radius: 0.21, color: 0x3d5ef5, period: 164.8 }
};

const MOVIE_SCENES = {
    1: {
        label: "SCENE 1: EARTH DEPARTURE IGNITION",
        text: "The spacecraft ignites engines at Earth (1.0 AU), boosting heliocentric speed to 38.6 km/s to enter the Jupiter transfer ellipse...",
        target: "Earth Departure",
        speed: "38.6 km/s",
        trackTarget: "earth",
        offset: new THREE.Vector3(1.4, -2.0, 0.9)
    },
    2: {
        label: "SCENE 2: DEEP SPACE TRANSIT",
        text: "Coasting along the Keplerian arc. Solar gravity pulls backward on the probe, slowing heliocentric speed down to 7.4 km/s on approach to Jupiter...",
        target: "Deep Space Probe",
        speed: "7.4 km/s",
        trackTarget: "probe",
        offset: new THREE.Vector3(1.8, -2.5, 1.2)
    },
    3: {
        label: "SCENE 3: JUPITER GRAVITY ASSIST SLINGSHOT",
        text: "VECTOR GRAVITY ASSIST: Hyperbolic flyby near Jupiter (0.0025 AU rp) deflects relative velocity, yielding a +9.9 km/s vector speed boost to 17.4 km/s!",
        target: "Jupiter Flyby",
        speed: "17.4 km/s",
        trackTarget: "jupiter",
        offset: new THREE.Vector3(2.8, -3.8, 1.8)
    },
    4: {
        label: "SCENE 4: GRAND SOLAR SYSTEM OVERVIEW",
        text: "With the +9.9 km/s boost gained from Jupiter's orbital momentum, the probe exceeds solar escape velocity, traveling into outer space...",
        target: "Solar System Exit",
        speed: "17.4 km/s",
        trackTarget: "system",
        offset: new THREE.Vector3(0.0, -26.0, 18.0)
    }
};

const state = {
    currentScene: 1,
    simTime: 0.0,
    isCinematicCamActive: true,
    isPaused: false,
    speedMultiplier: 1.0,
    sceneTimer: null,
    
    probePos: new THREE.Vector3(1.0 * AU_SCALE, 0, 0),
    probeVel: new THREE.Vector3(0, 8.1384, 0), // Jupiter transfer departure speed in AU/yr (38.58 km/s)
    probeHistory: [],
    
    targetCamPos: new THREE.Vector3(6.2, -4.5, 2.2),
    targetLookAt: new THREE.Vector3(5.0, 0, 0)
};

let scene, camera, renderer, controls;
let sunMesh, mercuryMesh, venusMesh, earthMesh, marsMesh, jupiterMesh, saturnMesh, uranusMesh, neptuneMesh, probeMesh;
let orbitLines = {};
let trajectoryLine, thrusterParticles, labelsGroup;

window.addEventListener("DOMContentLoaded", () => {
    initThreeJS();
    initUIEventListeners();
    
    // Auto-run movie sequence immediately on load
    startCinematicMovieSequence();

    requestAnimationFrame(animLoop);
});

function initThreeJS() {
    const container = document.getElementById("webgl-canvas-container");
    const width = window.innerWidth;
    const height = window.innerHeight;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030508, 0.004);

    camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 600);
    camera.position.set(6.2, -4.5, 2.2);
    camera.up.set(0, 0, 1);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x030508, 1);
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.04;
    controls.target.set(5.0, 0, 0);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xffb703, 3.0, 400);
    scene.add(sunLight);

    createStarfield();
    createCelestialBodies();
    createSpacecraftProbe();
    createThrusterParticles();
    createTrajectoryRibbon();

    labelsGroup = new THREE.Group();
    scene.add(labelsGroup);
    create3DSpriteLabels();

    window.addEventListener("resize", onWindowResize);
}

function createStarfield() {
    const count = 2200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 400;
        positions[i + 1] = (Math.random() - 0.5) * 400;
        positions[i + 2] = (Math.random() - 0.5) * 400;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.8 });
    scene.add(new THREE.Points(geometry, material));
}

function createCelestialBodies() {
    // === SUN with corona glow ===
    sunMesh = new THREE.Mesh(
        new THREE.SphereGeometry(CELESTIAL_BODIES.Sun.radius, 48, 48),
        new THREE.MeshBasicMaterial({ color: 0xffb703 })
    );
    scene.add(sunMesh);
    // Solar corona glow
    const coronaGeom = new THREE.SphereGeometry(CELESTIAL_BODIES.Sun.radius * 1.25, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({ color: 0xffdd55, transparent: true, opacity: 0.12 });
    sunMesh.add(new THREE.Mesh(coronaGeom, coronaMat));

    // === MERCURY ===
    mercuryMesh = new THREE.Mesh(
        new THREE.SphereGeometry(CELESTIAL_BODIES.Mercury.radius, 24, 24),
        new THREE.MeshStandardMaterial({ color: 0xa8a8a8, roughness: 0.85, metalness: 0.15 })
    );
    scene.add(mercuryMesh);

    // === VENUS with thick atmosphere haze ===
    venusMesh = new THREE.Mesh(
        new THREE.SphereGeometry(CELESTIAL_BODIES.Venus.radius, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0xd4a853, roughness: 0.6, metalness: 0.05 })
    );
    scene.add(venusMesh);
    const venusAtmoGeom = new THREE.SphereGeometry(CELESTIAL_BODIES.Venus.radius * 1.08, 32, 32);
    const venusAtmoMat = new THREE.MeshBasicMaterial({ color: 0xf5deb3, transparent: true, opacity: 0.25 });
    venusMesh.add(new THREE.Mesh(venusAtmoGeom, venusAtmoMat));

    // === EARTH — realistic layered model ===
    const earthGroup = new THREE.Group();
    // Ocean sphere (deep blue)
    const oceanGeom = new THREE.SphereGeometry(CELESTIAL_BODIES.Earth.radius, 48, 48);
    const oceanMat = new THREE.MeshStandardMaterial({
        color: 0x1a5fb4, roughness: 0.4, metalness: 0.3
    });
    earthGroup.add(new THREE.Mesh(oceanGeom, oceanMat));
    // Land masses layer (slightly larger, green-brown)
    const landGeom = new THREE.SphereGeometry(CELESTIAL_BODIES.Earth.radius * 1.002, 48, 48);
    const landCanvas = document.createElement('canvas');
    landCanvas.width = 256; landCanvas.height = 128;
    const landCtx = landCanvas.getContext('2d');
    // Paint simple continent-like patches
    landCtx.fillStyle = '#1a5fb4';
    landCtx.fillRect(0, 0, 256, 128);
    landCtx.fillStyle = '#3d8c40';
    // North America
    landCtx.beginPath(); landCtx.ellipse(60, 35, 22, 18, 0, 0, Math.PI*2); landCtx.fill();
    // South America
    landCtx.beginPath(); landCtx.ellipse(75, 75, 12, 22, 0.2, 0, Math.PI*2); landCtx.fill();
    // Europe/Africa
    landCtx.fillStyle = '#5a9e3e';
    landCtx.beginPath(); landCtx.ellipse(130, 38, 14, 12, 0, 0, Math.PI*2); landCtx.fill();
    landCtx.fillStyle = '#8B7355';
    landCtx.beginPath(); landCtx.ellipse(133, 70, 15, 25, 0, 0, Math.PI*2); landCtx.fill();
    // Asia
    landCtx.fillStyle = '#4d8c3f';
    landCtx.beginPath(); landCtx.ellipse(175, 35, 30, 16, 0, 0, Math.PI*2); landCtx.fill();
    // Australia
    landCtx.fillStyle = '#c49a3c';
    landCtx.beginPath(); landCtx.ellipse(205, 80, 12, 9, 0, 0, Math.PI*2); landCtx.fill();
    // Antarctica
    landCtx.fillStyle = '#e8e8e8';
    landCtx.fillRect(0, 118, 256, 10);
    // Arctic
    landCtx.fillRect(0, 0, 256, 6);

    const landTex = new THREE.CanvasTexture(landCanvas);
    const landMat = new THREE.MeshStandardMaterial({ map: landTex, roughness: 0.55, metalness: 0.05 });
    earthGroup.add(new THREE.Mesh(landGeom, landMat));
    // Atmosphere glow shell
    const atmoGeom = new THREE.SphereGeometry(CELESTIAL_BODIES.Earth.radius * 1.12, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({ color: 0x4da6ff, transparent: true, opacity: 0.12, side: THREE.BackSide });
    earthGroup.add(new THREE.Mesh(atmoGeom, atmoMat));
    // Cloud layer
    const cloudGeom = new THREE.SphereGeometry(CELESTIAL_BODIES.Earth.radius * 1.04, 32, 32);
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 256; cloudCanvas.height = 128;
    const cloudCtx = cloudCanvas.getContext('2d');
    cloudCtx.clearRect(0, 0, 256, 128);
    cloudCtx.fillStyle = 'rgba(255,255,255,0.6)';
    for (let i = 0; i < 40; i++) {
        const cx = Math.random() * 256, cy = Math.random() * 128;
        const rx = 8 + Math.random() * 18, ry = 3 + Math.random() * 6;
        cloudCtx.beginPath(); cloudCtx.ellipse(cx, cy, rx, ry, Math.random()*Math.PI, 0, Math.PI*2); cloudCtx.fill();
    }
    const cloudTex = new THREE.CanvasTexture(cloudCanvas);
    const cloudMat = new THREE.MeshBasicMaterial({ map: cloudTex, transparent: true, opacity: 0.45 });
    earthGroup.add(new THREE.Mesh(cloudGeom, cloudMat));
    // Earth's moon (tiny)
    const moonGeom = new THREE.SphereGeometry(0.035, 16, 16);
    const moonMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.9 });
    const moonMesh = new THREE.Mesh(moonGeom, moonMat);
    moonMesh.position.set(0.3, 0, 0.05);
    earthGroup.add(moonMesh);
    earthGroup._moon = moonMesh;

    earthMesh = earthGroup;
    scene.add(earthMesh);

    // === MARS with polar ice caps ===
    const marsGroup = new THREE.Group();
    const marsBodyGeom = new THREE.SphereGeometry(CELESTIAL_BODIES.Mars.radius, 32, 32);
    const marsCanvas = document.createElement('canvas');
    marsCanvas.width = 128; marsCanvas.height = 64;
    const marsCtx = marsCanvas.getContext('2d');
    marsCtx.fillStyle = '#c1440e';
    marsCtx.fillRect(0, 0, 128, 64);
    marsCtx.fillStyle = '#8b3a0f';
    marsCtx.beginPath(); marsCtx.ellipse(40, 30, 20, 14, 0, 0, Math.PI*2); marsCtx.fill();
    marsCtx.beginPath(); marsCtx.ellipse(90, 40, 16, 10, 0.5, 0, Math.PI*2); marsCtx.fill();
    // Polar caps
    marsCtx.fillStyle = '#f0e0d0';
    marsCtx.fillRect(0, 0, 128, 5);
    marsCtx.fillRect(0, 59, 128, 5);
    const marsTex = new THREE.CanvasTexture(marsCanvas);
    marsGroup.add(new THREE.Mesh(marsBodyGeom, new THREE.MeshStandardMaterial({ map: marsTex, roughness: 0.75 })));
    marsMesh = marsGroup;
    scene.add(marsMesh);

    // === JUPITER with banded atmosphere ===
    const jupBodyGeom = new THREE.SphereGeometry(CELESTIAL_BODIES.Jupiter.radius, 48, 48);
    const jupCanvas = document.createElement('canvas');
    jupCanvas.width = 256; jupCanvas.height = 128;
    const jupCtx = jupCanvas.getContext('2d');
    const jupBands = ['#e0a96d','#d4955a','#c87c3b','#d4a06a','#b87333','#d4955a','#e8c088','#d4955a','#c87c3b','#e0a96d','#d4a06a','#b87333'];
    for (let i = 0; i < jupBands.length; i++) {
        jupCtx.fillStyle = jupBands[i];
        jupCtx.fillRect(0, Math.floor(i * 128 / jupBands.length), 256, Math.ceil(128 / jupBands.length) + 1);
    }
    // Great Red Spot
    jupCtx.fillStyle = '#c0392b';
    jupCtx.beginPath(); jupCtx.ellipse(160, 72, 16, 10, 0, 0, Math.PI*2); jupCtx.fill();
    const jupTex = new THREE.CanvasTexture(jupCanvas);
    jupiterMesh = new THREE.Mesh(jupBodyGeom, new THREE.MeshStandardMaterial({ map: jupTex, roughness: 0.5 }));
    scene.add(jupiterMesh);

    // === SATURN with prominent ring system ===
    const satBodyGeom = new THREE.SphereGeometry(CELESTIAL_BODIES.Saturn.radius, 48, 48);
    const satCanvas = document.createElement('canvas');
    satCanvas.width = 128; satCanvas.height = 64;
    const satCtx = satCanvas.getContext('2d');
    const satBands = ['#ead6a6','#d4c494','#c4b484','#ead6a6','#d4c494','#e8dbb8','#c4b484','#ead6a6'];
    for (let i = 0; i < satBands.length; i++) {
        satCtx.fillStyle = satBands[i];
        satCtx.fillRect(0, Math.floor(i * 64 / satBands.length), 128, Math.ceil(64 / satBands.length) + 1);
    }
    const satTex = new THREE.CanvasTexture(satCanvas);
    saturnMesh = new THREE.Mesh(satBodyGeom, new THREE.MeshStandardMaterial({ map: satTex, roughness: 0.5 }));
    scene.add(saturnMesh);
    // Saturn rings — multi-band
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 256; ringCanvas.height = 1;
    const ringCtx = ringCanvas.getContext('2d');
    const grad = ringCtx.createLinearGradient(0, 0, 256, 0);
    grad.addColorStop(0.0, 'rgba(180,160,130,0.0)');
    grad.addColorStop(0.15, 'rgba(200,180,150,0.55)');
    grad.addColorStop(0.3, 'rgba(220,200,170,0.7)');
    grad.addColorStop(0.45, 'rgba(180,160,130,0.15)');
    grad.addColorStop(0.5, 'rgba(210,195,165,0.65)');
    grad.addColorStop(0.7, 'rgba(230,215,185,0.6)');
    grad.addColorStop(0.85, 'rgba(200,180,150,0.35)');
    grad.addColorStop(1.0, 'rgba(180,160,130,0.0)');
    ringCtx.fillStyle = grad;
    ringCtx.fillRect(0, 0, 256, 1);
    const ringTex = new THREE.CanvasTexture(ringCanvas);
    const satRingGeom = new THREE.RingGeometry(0.42, 0.75, 64);
    const satRingMat = new THREE.MeshBasicMaterial({ map: ringTex, side: THREE.DoubleSide, transparent: true });
    // Fix ring UVs for radial gradient
    const uvAttr = satRingGeom.attributes.uv;
    const posArr = satRingGeom.attributes.position;
    for (let i = 0; i < uvAttr.count; i++) {
        const x = posArr.getX(i), y = posArr.getY(i);
        const r = Math.sqrt(x*x + y*y);
        uvAttr.setXY(i, (r - 0.42) / (0.75 - 0.42), 0.5);
    }
    const satRing = new THREE.Mesh(satRingGeom, satRingMat);
    satRing.rotation.x = Math.PI / 2.4;
    saturnMesh.add(satRing);

    // === URANUS ===
    uranusMesh = new THREE.Mesh(
        new THREE.SphereGeometry(CELESTIAL_BODIES.Uranus.radius, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0x7ec8e3, roughness: 0.5, metalness: 0.15 })
    );
    scene.add(uranusMesh);
    // Faint ring
    const uranusRingGeom = new THREE.RingGeometry(0.28, 0.36, 48);
    const uranusRingMat = new THREE.MeshBasicMaterial({ color: 0x9dd8ea, side: THREE.DoubleSide, transparent: true, opacity: 0.2 });
    const uranusRing = new THREE.Mesh(uranusRingGeom, uranusRingMat);
    uranusRing.rotation.x = Math.PI / 1.2;
    uranusMesh.add(uranusRing);

    // === NEPTUNE ===
    neptuneMesh = new THREE.Mesh(
        new THREE.SphereGeometry(CELESTIAL_BODIES.Neptune.radius, 32, 32),
        new THREE.MeshStandardMaterial({ color: 0x3d5ef5, roughness: 0.45, metalness: 0.2, emissive: 0x1a2d80, emissiveIntensity: 0.15 })
    );
    scene.add(neptuneMesh);

    // === Orbit Lines for all planets ===
    const planetKeys = ['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune'];
    const planetColors = [0xa8a8a8, 0xe8c373, 0x3a86ff, 0xc1440e, 0xe0a96d, 0xead6a6, 0x7ec8e3, 0x3d5ef5];
    planetKeys.forEach((key, i) => {
        const ol = createOrbitRing(CELESTIAL_BODIES[key].a * AU_SCALE, planetColors[i]);
        orbitLines[key] = ol;
        scene.add(ol);
    });

    updatePlanetaryPositions(0);
}

function createOrbitRing(radius, color) {
    const pts = [];
    for (let i = 0; i <= 128; i++) {
        const theta = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(radius * Math.cos(theta), radius * Math.sin(theta), 0));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineDashedMaterial({ color: color, dashSize: 0.1, gapSize: 0.1, transparent: true, opacity: 0.3 });
    const line = new THREE.Line(geom, mat);
    line.computeLineDistances();
    return line;
}

function createSpacecraftProbe() {
    const probeGroup = new THREE.Group();

    // 1. Octagonal Main Satellite Bus Body
    const bodyGeom = new THREE.CylinderGeometry(0.14, 0.14, 0.32, 8);
    const bodyMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.85,
        roughness: 0.2
    });
    const bodyMesh = new THREE.Mesh(bodyGeom, bodyMat);
    bodyMesh.rotation.x = Math.PI / 2;
    probeGroup.add(bodyMesh);

    // Gold Foil MLI Thermal Blanket Band around Bus
    const foilGeom = new THREE.CylinderGeometry(0.145, 0.145, 0.16, 8);
    const foilMat = new THREE.MeshStandardMaterial({
        color: 0xffb703,
        metalness: 0.95,
        roughness: 0.1
    });
    const foilMesh = new THREE.Mesh(foilGeom, foilMat);
    foilMesh.rotation.x = Math.PI / 2;
    probeGroup.add(foilMesh);

    // 2. High-Gain Parabolic Communications Antenna Dish (forward-facing)
    const dishGeom = new THREE.CylinderGeometry(0.28, 0.05, 0.06, 24);
    const dishMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        roughness: 0.2,
        metalness: 0.25
    });
    const dishMesh = new THREE.Mesh(dishGeom, dishMat);
    dishMesh.rotation.x = Math.PI / 2;
    dishMesh.position.set(0, 0, 0.20);
    probeGroup.add(dishMesh);

    // Antenna Subreflector Feed Horn
    const feedGeom = new THREE.ConeGeometry(0.035, 0.10, 12);
    const feedMat = new THREE.MeshStandardMaterial({ color: 0x00f2fe, metalness: 0.9, emissive: 0x00aacc, emissiveIntensity: 0.5 });
    const feedMesh = new THREE.Mesh(feedGeom, feedMat);
    feedMesh.rotation.x = -Math.PI / 2;
    feedMesh.position.set(0, 0, 0.26);
    probeGroup.add(feedMesh);

    // 3. Solar Array Wings (Port & Starboard)
    const panelGeom = new THREE.BoxGeometry(0.75, 0.22, 0.02);
    const panelMat = new THREE.MeshStandardMaterial({
        color: 0x075985,
        metalness: 0.7,
        roughness: 0.2,
        emissive: 0x0284c7,
        emissiveIntensity: 0.3
    });

    const leftWing = new THREE.Mesh(panelGeom, panelMat);
    leftWing.position.set(0.48, 0, 0);
    probeGroup.add(leftWing);

    const rightWing = new THREE.Mesh(panelGeom, panelMat);
    rightWing.position.set(-0.48, 0, 0);
    probeGroup.add(rightWing);

    // Gold structural trims on solar wings
    const borderGeom = new THREE.BoxGeometry(0.77, 0.24, 0.015);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0xffb703 });
    const leftBorder = new THREE.Mesh(borderGeom, borderMat);
    leftBorder.position.set(0.48, 0, -0.005);
    probeGroup.add(leftBorder);

    const rightBorder = new THREE.Mesh(borderGeom, borderMat);
    rightBorder.position.set(-0.48, 0, -0.005);
    probeGroup.add(rightBorder);

    // 4. Main Ion Thruster Rocket Nozzle (aft-facing)
    const nozzleGeom = new THREE.CylinderGeometry(0.04, 0.10, 0.14, 16);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.95, roughness: 0.15 });
    const nozzleMesh = new THREE.Mesh(nozzleGeom, nozzleMat);
    nozzleMesh.rotation.x = Math.PI / 2;
    nozzleMesh.position.set(0, 0, -0.22);
    probeGroup.add(nozzleMesh);

    // Glowing Ion Plasma Core inside Nozzle
    const glowGeom = new THREE.SphereGeometry(0.05, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const glowMesh = new THREE.Mesh(glowGeom, glowMat);
    glowMesh.position.set(0, 0, -0.25);
    probeGroup.add(glowMesh);

    // 5. Magnetometer Instrument Boom Arm
    const boomGeom = new THREE.CylinderGeometry(0.01, 0.01, 0.6, 8);
    const boomMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });
    const boomMesh = new THREE.Mesh(boomGeom, boomMat);
    boomMesh.position.set(0, 0.38, -0.05);
    probeGroup.add(boomMesh);

    probeMesh = probeGroup;
    scene.add(probeMesh);
}

function createThrusterParticles() {
    const count = 90;
    const geom = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
        pos[i] = (Math.random() - 0.5) * 0.06;
        pos[i + 1] = (Math.random() - 0.5) * 0.06;
        pos[i + 2] = -0.26 - Math.random() * 0.35;
    }

    geom.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x00f2fe, size: 0.05, transparent: true, opacity: 0.95 });
    thrusterParticles = new THREE.Points(geom, mat);
    probeMesh.add(thrusterParticles);
}

function createTrajectoryRibbon() {
    const maxPts = 800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxPts * 3);
    const colors = new Float32Array(maxPts * 3);

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({ vertexColors: true, linewidth: 2.5, transparent: true, opacity: 0.9 });
    trajectoryLine = new THREE.Line(geometry, material);
    scene.add(trajectoryLine);
}

function createTextSprite(text, colorStr) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = colorStr;
    ctx.font = "Bold 24px Outfit, sans-serif";
    ctx.fillText(text, 10, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.8, 0.45, 1);
    return sprite;
}

function create3DSpriteLabels() {
    labelsGroup.add(createTextSprite("☀ Sun", "#ffb703"));           // 0
    labelsGroup.add(createTextSprite("Mercury (0.39 AU)", "#a8a8a8")); // 1
    labelsGroup.add(createTextSprite("Venus (0.72 AU)", "#e8c373"));   // 2
    labelsGroup.add(createTextSprite("Earth (1.0 AU)", "#3a86ff"));    // 3
    labelsGroup.add(createTextSprite("Mars (1.52 AU)", "#c1440e"));    // 4
    labelsGroup.add(createTextSprite("Jupiter (5.20 AU)", "#e0a96d")); // 5
    labelsGroup.add(createTextSprite("Saturn (9.58 AU)", "#ead6a6"));  // 6
    labelsGroup.add(createTextSprite("Uranus (19.2 AU)", "#7ec8e3"));  // 7
    labelsGroup.add(createTextSprite("Neptune (30.1 AU)", "#3d5ef5")); // 8
    labelsGroup.add(createTextSprite("🚀 Probe", "#00f2fe"));         // 9
}

function updateSpriteLabelPositions() {
    const c = labelsGroup.children;
    if (c.length >= 10) {
        c[0].position.set(0, 0, 0.9);
        c[1].position.copy(mercuryMesh.position).add(new THREE.Vector3(0, 0, 0.3));
        c[2].position.copy(venusMesh.position).add(new THREE.Vector3(0, 0, 0.4));
        c[3].position.copy(earthMesh.position).add(new THREE.Vector3(0, 0, 0.5));
        c[4].position.copy(marsMesh.position).add(new THREE.Vector3(0, 0, 0.4));
        c[5].position.copy(jupiterMesh.position).add(new THREE.Vector3(0, 0, 0.7));
        c[6].position.copy(saturnMesh.position).add(new THREE.Vector3(0, 0, 0.6));
        c[7].position.copy(uranusMesh.position).add(new THREE.Vector3(0, 0, 0.5));
        c[8].position.copy(neptuneMesh.position).add(new THREE.Vector3(0, 0, 0.5));
        c[9].position.copy(probeMesh.position).add(new THREE.Vector3(0, 0, 0.5));
    }
}

function updatePlanetaryPositions(t) {
    // Phase offsets so planets don't all start aligned
    const phases = { Mercury: 1.2, Venus: 2.5, Earth: 0, Mars: 0.6, Jupiter: 0.8, Saturn: 3.1, Uranus: 4.7, Neptune: 1.9 };
    const meshes = {
        Mercury: mercuryMesh, Venus: venusMesh, Earth: earthMesh, Mars: marsMesh,
        Jupiter: jupiterMesh, Saturn: saturnMesh, Uranus: uranusMesh, Neptune: neptuneMesh
    };
    for (const [name, mesh] of Object.entries(meshes)) {
        if (!mesh) continue;
        const body = CELESTIAL_BODIES[name];
        const theta = (t / body.period) * Math.PI * 2 + (phases[name] || 0);
        const r = body.a * AU_SCALE;
        mesh.position.set(r * Math.cos(theta), r * Math.sin(theta), 0);
    }
    // Rotate Earth's cloud layer slowly
    if (earthMesh && earthMesh.children && earthMesh.children.length >= 4) {
        earthMesh.children[3].rotation.y += 0.002; // cloud rotation
    }
    // Animate Earth's moon orbit
    if (earthMesh && earthMesh._moon) {
        const moonTheta = t * 13.37 * Math.PI * 2; // ~13x Earth period (sped up for visibility)
        earthMesh._moon.position.set(0.3 * Math.cos(moonTheta), 0.3 * Math.sin(moonTheta), 0.05 * Math.sin(moonTheta * 0.5));
    }
}

function updateProbeSimulation(dt) {
    const pos = state.probePos;
    const vel = state.probeVel;

    const r_sun = pos.length() / AU_SCALE;
    const mu_sun = 39.4784;

    // Solar gravitational acceleration
    const acc = pos.clone().negate().normalize().multiplyScalar(mu_sun / (Math.max(r_sun, 0.1) ** 2));

    // Jupiter gravitational perturbation (N-body gravity assist)
    if (jupiterMesh) {
        const jupPos = jupiterMesh.position;
        const dJupVec = pos.clone().sub(jupPos);
        const dJup = dJupVec.length() / AU_SCALE;
        const mu_jup = mu_sun * 9.546e-4; // Jupiter gravitational parameter
        
        if (dJup < 1.5) {
            const jupAcc = dJupVec.negate().normalize().multiplyScalar(mu_jup / (Math.max(dJup, 0.002) ** 2));
            acc.add(jupAcc);
        }
    }

    vel.addScaledVector(acc, dt * 0.05);
    pos.addScaledVector(vel, dt * 0.05);

    state.probeHistory.push(pos.clone());
    if (state.probeHistory.length > 800) state.probeHistory.shift();

    probeMesh.position.copy(pos);

    // Rotate probe to point along velocity vector
    if (vel.length() > 0.001) {
        const targetRot = new THREE.Vector3().addVectors(pos, vel);
        probeMesh.lookAt(targetRot);
    }
}

function updateTrajectoryRender() {
    const history = state.probeHistory;
    const posAttr = trajectoryLine.geometry.attributes.position;
    const colAttr = trajectoryLine.geometry.attributes.color;

    const count = history.length;
    trajectoryLine.geometry.setDrawRange(0, count);

    for (let i = 0; i < count; i++) {
        const p = history[i];
        posAttr.setXYZ(i, p.x, p.y, p.z);
        const norm = i / Math.max(count, 1);
        colAttr.setXYZ(i, 0.0, 0.95 * norm, 1.0);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
}

function updateCinematicCamera() {
    if (!state.isCinematicCamActive) return;

    const sceneData = MOVIE_SCENES[state.currentScene];
    if (sceneData) {
        let focusObj = null;
        if (sceneData.trackTarget === "earth" && earthMesh) focusObj = earthMesh;
        else if (sceneData.trackTarget === "probe" && probeMesh) focusObj = probeMesh;
        else if (sceneData.trackTarget === "jupiter" && jupiterMesh) focusObj = jupiterMesh;

        if (focusObj) {
            state.targetLookAt.copy(focusObj.position);
            state.targetCamPos.copy(focusObj.position).add(sceneData.offset);
        } else {
            state.targetLookAt.set(0, 0, 0);
            state.targetCamPos.copy(sceneData.offset);
        }
    }

    // Smooth camera tracking interpolation
    camera.position.lerp(state.targetCamPos, 0.045);
    controls.target.lerp(state.targetLookAt, 0.045);
}

function setMovieScene(sceneIdx) {
    state.currentScene = sceneIdx;

    document.querySelectorAll(".scene-btn").forEach(btn => {
        const s = parseInt(btn.getAttribute("data-scene"));
        if (s === sceneIdx) btn.classList.add("active");
        else btn.classList.remove("active");
    });

    const data = MOVIE_SCENES[sceneIdx];
    if (data) {
        document.getElementById("subLabel").innerText = data.label;
        document.getElementById("subText").innerText = data.text;
        document.getElementById("targetHud").innerHTML = `Target: <strong>${data.target}</strong>`;
        document.getElementById("hudSpeed").innerText = data.speed;
    }
}

function startCinematicMovieSequence() {
    state.isCinematicCamActive = true;
    const btn = document.getElementById("btnToggleCam");
    if (btn) {
        btn.className = "btn-movie active-state";
        btn.innerHTML = '<i class="fa-solid fa-video"></i> <span>Camera: Auto</span> <span class="btn-status-tag" id="camStatusTag">ON</span>';
    }

    let idx = state.currentScene;
    setMovieScene(idx);

    if (state.sceneTimer) clearInterval(state.sceneTimer);
    state.sceneTimer = setInterval(() => {
        if (!state.isPaused) {
            idx++;
            if (idx > 4) idx = 1;
            setMovieScene(idx);
        }
    }, 6000); // 6 seconds per scene
}

function stopCinematicMovieSequence() {
    state.isCinematicCamActive = false;
    if (state.sceneTimer) clearInterval(state.sceneTimer);
    const btn = document.getElementById("btnToggleCam");
    if (btn) {
        btn.className = "btn-movie";
        btn.innerHTML = '<i class="fa-solid fa-video-slash"></i> <span>Camera: Manual</span> <span class="btn-status-tag" id="camStatusTag" style="background:#ff4d6d; color:#fff;">OFF</span>';
    }
}

function initUIEventListeners() {
    document.querySelectorAll(".scene-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const s = parseInt(btn.getAttribute("data-scene"));
            setMovieScene(s);
        });
    });

    const camBtn = document.getElementById("btnToggleCam");
    if (camBtn) {
        camBtn.addEventListener("click", () => {
            if (state.isCinematicCamActive) {
                stopCinematicMovieSequence();
            } else {
                startCinematicMovieSequence();
            }
        });
    }

    const playBtn = document.getElementById("btnTogglePlay");
    if (playBtn) {
        playBtn.addEventListener("click", () => {
            state.isPaused = !state.isPaused;
            const playIcon = document.getElementById("playBtnIcon");
            const playText = document.getElementById("playBtnText");

            if (state.isPaused) {
                playBtn.classList.add("active-state");
                if (playIcon) playIcon.className = "fa-solid fa-play";
                if (playText) playText.innerText = "Sim: Paused";
            } else {
                playBtn.classList.remove("active-state");
                if (playIcon) playIcon.className = "fa-solid fa-pause";
                if (playText) playText.innerText = "Sim: Running";
            }
        });
    }

    const speedBtn = document.getElementById("btnToggleSpeed");
    if (speedBtn) {
        speedBtn.addEventListener("click", () => {
            if (state.speedMultiplier === 1.0) state.speedMultiplier = 2.0;
            else if (state.speedMultiplier === 2.0) state.speedMultiplier = 0.5;
            else state.speedMultiplier = 1.0;

            const speedText = document.getElementById("speedBtnText");
            if (speedText) speedText.innerText = `Speed: ${state.speedMultiplier}x`;
            
            if (state.speedMultiplier !== 1.0) {
                speedBtn.classList.add("active-state");
            } else {
                speedBtn.classList.remove("active-state");
            }
        });
    }

    document.getElementById("btnHandoutModal").addEventListener("click", () => {
        document.getElementById("handoutModal").classList.add("active");
    });
    document.getElementById("btnCloseModal").addEventListener("click", () => {
        document.getElementById("handoutModal").classList.remove("active");
    });

    // Close modal on escape key
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            document.getElementById("handoutModal").classList.remove("active");
        }
    });
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}

function updateHUD() {
    const r = (state.probePos.length() / AU_SCALE).toFixed(2);
    const speed_auyr = state.probeVel.length();
    const speed_kms = (speed_auyr * AU_PER_YEAR_TO_KMS).toFixed(1);

    document.getElementById("hudSpeed").innerText = `${speed_kms} km/s`;
    document.getElementById("hudDist").innerText = `${r} AU`;
    document.getElementById("hudTime").innerText = `${(state.simTime * 12.0).toFixed(1)} months`;
}

function animLoop() {
    requestAnimationFrame(animLoop);

    if (!state.isPaused) {
        const dt = 0.01 * state.speedMultiplier;
        state.simTime += dt;

        updatePlanetaryPositions(state.simTime);
        updateProbeSimulation(dt);
        updateSpriteLabelPositions();
        updateTrajectoryRender();
        updateHUD();
    }

    updateCinematicCamera();
    controls.update();
    renderer.render(scene, camera);
}
