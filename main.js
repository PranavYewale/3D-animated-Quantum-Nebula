import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import confetti from 'canvas-confetti';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

/* ==========================================
   1. AUDIO SYNTH ENGINE (Web Audio API)
   ========================================== */
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.ambientHum = null;
    this.ambientGain = null;
    this.isPlaying = false;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    
    // Create ambient hum nodes
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // start silent
    this.ambientGain.connect(this.ctx.destination);

    // Oscillator 1: Base hum (55Hz)
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(55, this.ctx.currentTime);

    // Oscillator 2: Slightly detuned (56Hz) for phase beating
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(55.8, this.ctx.currentTime);

    // Lowpass filter to make it warmer/subtler
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, this.ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(this.ambientGain);

    osc1.start(0);
    osc2.start(0);
  }

  toggle() {
    this.init();
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      // Fade out hum
      this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.5);
      this.isPlaying = false;
    } else {
      // Fade in hum
      this.ambientGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
      this.ambientGain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 1.0);
      this.isPlaying = true;
    }
    return this.isPlaying;
  }

  playClick() {
    if (!this.isPlaying || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    // Fast frequency sweep down (futuristic click)
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

    osc.start(0);
    osc.stop(this.ctx.currentTime + 0.08);
  }

  playHover() {
    if (!this.isPlaying || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.015, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);

    osc.start(0);
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playTransition() {
    if (!this.isPlaying || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    // Low bandpass filtered sweep
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(100, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.4);
    filter.Q.setValueAtTime(5, this.ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);

    gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);

    osc.start(0);
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playDiagnostic() {
    if (!this.isPlaying || !this.ctx) return;
    // Ascending arpeggio sequence
    const notes = [220, 277.18, 329.63, 440, 554.37, 659.25, 880];
    notes.forEach((freq, index) => {
      setTimeout(() => {
        if (!this.isPlaying || !this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        
        gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);

        osc.start(0);
        osc.stop(this.ctx.currentTime + 0.25);
      }, index * 100);
    });
  }
}

const audio = new AudioEngine();

/* ==========================================
   2. SIMULATED SCI-FI BOOT LOADER
   ========================================== */
function setupLoader() {
  const loader = document.getElementById('loader');
  const progressBar = document.getElementById('progress-bar');
  const progressText = document.getElementById('progress-text');
  
  let progress = 0;
  const interval = setInterval(() => {
    // Increment progress with random steps
    progress += Math.floor(Math.random() * 15) + 5;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      
      // Add slight delay before fading out
      setTimeout(() => {
        loader.classList.add('fade-out');
        document.body.style.overflow = 'visible'; // enable scrolling
        initializeScrollTriggerAnimations();
      }, 500);
    }
    progressBar.style.width = `${progress}%`;
    progressText.innerText = `${progress}%`;
  }, 120);
}

/* ==========================================
   3. THREE.JS SCENE CREATION
   ========================================== */
const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();

// Procedural Studio Lighting Environment Map (High Realism Reflections)
const envCanvas = document.createElement('canvas');
envCanvas.width = 512;
envCanvas.height = 256;
const envCtx = envCanvas.getContext('2d');
const envGrad = envCtx.createLinearGradient(0, 0, 0, 256);
envGrad.addColorStop(0, '#0f172a');
envGrad.addColorStop(1, '#020617');
envCtx.fillStyle = envGrad;
envCtx.fillRect(0, 0, 512, 256);
// Add artificial highlights
envCtx.fillStyle = '#ffffff';
envCtx.fillRect(80, 20, 35, 130);
envCtx.fillStyle = '#00f2fe';
envCtx.fillRect(280, 40, 25, 140);
envCtx.fillStyle = '#ff2a5f';
envCtx.fillRect(180, 80, 25, 90);
const envTexture = new THREE.CanvasTexture(envCanvas);
envTexture.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = envTexture;

// Camera Setup
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 8);

// Renderer Setup
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

// Orbit Controls (Only active in final Section 5)
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.minDistance = 3;
controls.maxDistance = 12;
controls.enabled = false; // Starts disabled

/* ==========================================
   4. LIGHTING SYSTEM
   ========================================== */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
scene.add(ambientLight);

// Key Light
const keyLight = new THREE.DirectionalLight(0xffffff, 2.5);
keyLight.position.set(5, 8, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
keyLight.shadow.bias = -0.001;
scene.add(keyLight);

// Soft Fill Light
const fillLight = new THREE.DirectionalLight(0x4facfe, 1.2);
fillLight.position.set(-5, -2, 3);
scene.add(fillLight);

// Glowing Neon Point Lights (Core Accents)
const cyanGlowLight = new THREE.PointLight(0x00f2fe, 3, 10);
cyanGlowLight.position.set(0, 0, 0);
scene.add(cyanGlowLight);

const crimsonGlowLight = new THREE.PointLight(0xff2a5f, 1, 10);
crimsonGlowLight.position.set(0, 0, 0);
scene.add(crimsonGlowLight);

/* ==========================================
   5. 3D DEVICE MODELING (Chrono-Nexus)
   ========================================== */
const deviceGroup = new THREE.Group();
scene.add(deviceGroup);

// Materials Definitions
const chassisMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x3a4f54, // Default Titanium Silver
  metalness: 0.95,
  roughness: 0.16,
  clearcoat: 1.0,
  clearcoatRoughness: 0.06,
  envMapIntensity: 2.2,
  transparent: true,
  opacity: 1.0
});

const brassCoreMaterial = new THREE.MeshStandardMaterial({
  color: 0xd4af37, // Polished Gold/Brass
  metalness: 0.85,
  roughness: 0.2,
  transparent: true,
  opacity: 1.0
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.2,
  roughness: 0.05,
  metalness: 0.1,
  transmission: 0.9,
  ior: 1.5,
  thickness: 0.5,
  depthWrite: false
});

// A. Outer Shells (Left & Right halves for exploded view)
const shellGroupLeft = new THREE.Group();
const shellGroupRight = new THREE.Group();
deviceGroup.add(shellGroupLeft);
deviceGroup.add(shellGroupRight);

// Left Shell Part
const outerRingGeoLeft = new THREE.TorusGeometry(1.8, 0.15, 16, 100, Math.PI);
const outerRingLeft = new THREE.Mesh(outerRingGeoLeft, chassisMaterial);
outerRingLeft.rotation.z = Math.PI / 2; // Orient vertically
shellGroupLeft.add(outerRingLeft);

// Left mounting arm
const armGeoLeft = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
const armLeft = new THREE.Mesh(armGeoLeft, chassisMaterial);
armLeft.position.set(-1.8, 0, 0);
armLeft.rotation.z = Math.PI / 2;
shellGroupLeft.add(armLeft);

// Right Shell Part
const outerRingGeoRight = new THREE.TorusGeometry(1.8, 0.15, 16, 100, Math.PI);
const outerRingRight = new THREE.Mesh(outerRingGeoRight, chassisMaterial);
outerRingRight.rotation.z = -Math.PI / 2; // Orient vertically opposite
shellGroupRight.add(outerRingRight);

// Right mounting arm
const armGeoRight = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 8);
const armRight = new THREE.Mesh(armGeoRight, chassisMaterial);
armRight.position.set(1.8, 0, 0);
armRight.rotation.z = Math.PI / 2;
shellGroupRight.add(armRight);


// B. Inner Mechanical Engine (Rotating gears)
const innerEngineGroup = new THREE.Group();
deviceGroup.add(innerEngineGroup);

// Core gear base
const gearBaseGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.25, 32);
const gearBase = new THREE.Mesh(gearBaseGeo, brassCoreMaterial);
gearBase.rotation.x = Math.PI / 2;
innerEngineGroup.add(gearBase);

// Add gear teeth programmatically
const teethCount = 16;
for (let i = 0; i < teethCount; i++) {
  const angle = (i / teethCount) * Math.PI * 2;
  const toothGeo = new THREE.BoxGeometry(0.12, 0.2, 0.15);
  const tooth = new THREE.Mesh(toothGeo, brassCoreMaterial);
  tooth.position.set(Math.cos(angle) * 1.4, Math.sin(angle) * 1.4, 0);
  tooth.rotation.z = angle;
  innerEngineGroup.add(tooth);
}


// C. Quantum Reactor Core (Central glowing engine)
const reactorGroup = new THREE.Group();
deviceGroup.add(reactorGroup);

// Central Sphere
const coreGeo = new THREE.SphereGeometry(0.55, 32, 32);
const coreMaterial = new THREE.MeshStandardMaterial({
  color: 0x00f2fe,
  emissive: 0x00f2fe,
  emissiveIntensity: 1.5,
  roughness: 0.1,
  metalness: 0.1
});
const coreMesh = new THREE.Mesh(coreGeo, coreMaterial);
reactorGroup.add(coreMesh);

// Outer Wireframe Globe surrounding core
const globeGeo = new THREE.SphereGeometry(0.85, 16, 16);
const globeWireframeMat = new THREE.MeshBasicMaterial({
  color: 0x00f2fe,
  wireframe: true,
  transparent: true,
  opacity: 0.4
});
const globeWireframe = new THREE.Mesh(globeGeo, globeWireframeMat);
reactorGroup.add(globeWireframe);

// Inner Sapphire Shield (Protective Glass Dome)
const domeGeo = new THREE.SphereGeometry(1.3, 32, 32);
const domeMesh = new THREE.Mesh(domeGeo, glassMaterial);
deviceGroup.add(domeMesh);

// Polar grid blueprint helper (for Section 5 Blueprint Matrix)
const polarGridHelper = new THREE.PolarGridHelper(5, 16, 8, 64, 0x00f2fe, 0x00f2fe);
polarGridHelper.material.transparent = true;
polarGridHelper.material.opacity = 0;
polarGridHelper.rotation.x = Math.PI / 2; // Lie flat in Z plane
polarGridHelper.position.z = -0.5;
scene.add(polarGridHelper);

// 3D Biometric Heartbeat pulse wave loop (Section 7 Neural Sync)
const pulseGroup = new THREE.Group();
scene.add(pulseGroup);

const pulsePoints = [];
const segments = 120;
for (let i = 0; i <= segments; i++) {
  const theta = (i / segments) * Math.PI * 2;
  // Heartbeat QRS spike at specific angles
  let radialOffset = 0;
  if (theta > Math.PI * 0.7 && theta < Math.PI * 1.3) {
    const xVal = (theta - Math.PI) * 12;
    radialOffset = Math.sin(xVal) * Math.exp(-xVal * xVal) * 0.75;
  }
  if (theta > Math.PI * 1.5 && theta < Math.PI * 1.7) {
    const xVal = (theta - Math.PI * 1.6) * 18;
    radialOffset = Math.sin(xVal) * Math.exp(-xVal * xVal) * 0.4;
  }
  
  const r = 2.1 + radialOffset;
  pulsePoints.push(new THREE.Vector3(Math.cos(theta) * r, Math.sin(theta) * r, 0));
}

const pulseGeo = new THREE.BufferGeometry().setFromPoints(pulsePoints);
const pulseMat = new THREE.LineBasicMaterial({
  color: 0x10b981, // Emerald Green
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending
});
// Create two crossing orbital lines
const pulseLine1 = new THREE.Line(pulseGeo, pulseMat);
const pulseLine2 = new THREE.Line(pulseGeo, pulseMat);
pulseLine2.rotation.y = Math.PI / 2;
pulseGroup.add(pulseLine1);
pulseGroup.add(pulseLine2);

// Black Hole Singularity & Accretion Disk (Section 8 Anomaly)
const blackHoleMesh = new THREE.Mesh(
  new THREE.SphereGeometry(0.35, 32, 32),
  new THREE.MeshBasicMaterial({ color: 0x000000 })
);
blackHoleMesh.scale.set(0, 0, 0);
scene.add(blackHoleMesh);

const accretionDiskGeo = new THREE.RingGeometry(0.42, 1.4, 64);
const accretionDiskMat = new THREE.MeshBasicMaterial({
  color: 0xff5500, // Hot plasma orange
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0,
  blending: THREE.AdditiveBlending
});
const accretionDisk = new THREE.Mesh(accretionDiskGeo, accretionDiskMat);
accretionDisk.rotation.x = Math.PI / 2.3;
accretionDisk.rotation.y = Math.PI / 8;
scene.add(accretionDisk);


// D. Holographic Projection Interface
const holoGroup = new THREE.Group();
deviceGroup.add(holoGroup);
holoGroup.position.set(0, 0, 1.6);
holoGroup.scale.set(0, 0, 0); // Initially hidden

// Dynamic 2D Canvas for Hologram Text Display
const holoCanvas = document.createElement('canvas');
holoCanvas.width = 512;
holoCanvas.height = 256;
const holoCtx = holoCanvas.getContext('2d');

const holoTexture = new THREE.CanvasTexture(holoCanvas);
const holoMaterial = new THREE.MeshBasicMaterial({
  map: holoTexture,
  transparent: true,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
  opacity: 0.8
});

const holoGeo = new THREE.PlaneGeometry(2.4, 1.2);
const holoPlane = new THREE.Mesh(holoGeo, holoMaterial);
holoGroup.add(holoPlane);

// Ambient circular scanning rings for hologram
const ring1Geo = new THREE.RingGeometry(1.2, 1.22, 64);
const ring1Mat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.4 });
const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
ring1.position.z = -0.1;
holoGroup.add(ring1);

const ring2Geo = new THREE.RingGeometry(1.3, 1.34, 64);
const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x00f2fe, side: THREE.DoubleSide, transparent: true, opacity: 0.15 });
const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
ring2.position.z = -0.15;
holoGroup.add(ring2);

// Function to draw dynamic data on the Hologram canvas
let scanLineY = 0;
function updateHologramCanvas(time) {
  if (!holoCtx) return;
  holoCtx.clearRect(0, 0, holoCanvas.width, holoCanvas.height);

  // Background neon grid
  holoCtx.strokeStyle = 'rgba(0, 242, 254, 0.05)';
  holoCtx.lineWidth = 1;
  const gridSize = 20;
  for (let x = 0; x < holoCanvas.width; x += gridSize) {
    holoCtx.beginPath();
    holoCtx.moveTo(x, 0);
    holoCtx.lineTo(x, holoCanvas.height);
    holoCtx.stroke();
  }
  for (let y = 0; y < holoCanvas.height; y += gridSize) {
    holoCtx.beginPath();
    holoCtx.moveTo(0, y);
    holoCtx.lineTo(holoCanvas.width, y);
    holoCtx.stroke();
  }

  // Draw cybernetic interface elements
  holoCtx.fillStyle = 'rgba(0, 242, 254, 0.85)';
  holoCtx.font = 'bold 22px "Space Grotesk", monospace';
  holoCtx.fillText('CHRONO-NEXUS SYSTEM v2.04', 30, 45);

  holoCtx.font = '14px "Space Grotesk", monospace';
  holoCtx.fillStyle = '#f3f4f6';
  holoCtx.fillText('CORE TEMP: 0.003 Kelvin (CRYOSTABLE)', 30, 85);
  
  const syncPercent = (99.9823 + Math.sin(time * 5) * 0.0012).toFixed(4);
  holoCtx.fillText(`QUANTUM SYNC COHERENCE: ${syncPercent}%`, 30, 115);
  
  const batteryPercent = (100 - (time * 0.001) % 0.1).toFixed(2);
  holoCtx.fillText(`ZERO-POINT BATTERY MODULE: ${batteryPercent}%`, 30, 145);

  const freq = (4.8000 + Math.cos(time * 3) * 0.0005).toFixed(4);
  holoCtx.fillText(`CLOCK OSCILLATOR SPEED: ${freq} GHz`, 30, 175);

  holoCtx.fillStyle = 'rgba(0, 242, 254, 0.4)';
  holoCtx.fillText('STATUS: NEURAL CONNECTION SECURED // LINE ACTIVE', 30, 215);

  // Hologram scanner line effect
  scanLineY = (time * 120) % (holoCanvas.height + 40) - 20;
  const grad = holoCtx.createLinearGradient(0, scanLineY - 15, 0, scanLineY + 15);
  grad.addColorStop(0, 'rgba(0, 242, 254, 0.0)');
  grad.addColorStop(0.5, 'rgba(0, 242, 254, 0.35)');
  grad.addColorStop(1, 'rgba(0, 242, 254, 0.0)');
  holoCtx.fillStyle = grad;
  holoCtx.fillRect(0, scanLineY - 15, holoCanvas.width, 30);

  // Force texture update
  holoTexture.needsUpdate = true;
}


// E. Quantum Particles Swarm (1,200 particle vertices)
const particleCount = 1200;
const particleGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(particleCount * 3);
const originalOrbits = []; // Save original orbit distances to scale dynamically during scroll

for (let i = 0; i < particleCount; i++) {
  // Distribute particles in a spherical ring shell
  const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
  const phi = THREE.MathUtils.randFloat(Math.PI * 0.25, Math.PI * 0.75);
  const radius = THREE.MathUtils.randFloat(2.2, 4.0);

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;

  originalOrbits.push({
    theta: theta,
    phi: phi,
    radius: radius,
    speed: THREE.MathUtils.randFloat(0.15, 0.6)
  });
}

particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

// Custom procedural circular particle texture (soft glow circle)
const pCanvas = document.createElement('canvas');
pCanvas.width = 16;
pCanvas.height = 16;
const pCtx = pCanvas.getContext('2d');
const pGrad = pCtx.createRadialGradient(8, 8, 0, 8, 8, 8);
pGrad.addColorStop(0, 'rgba(0, 242, 254, 1.0)');
pGrad.addColorStop(0.3, 'rgba(0, 242, 254, 0.8)');
pGrad.addColorStop(1, 'rgba(0, 242, 254, 0.0)');
pCtx.fillStyle = pGrad;
pCtx.fillRect(0, 0, 16, 16);
const pTexture = new THREE.CanvasTexture(pCanvas);

const particleMaterial = new THREE.PointsMaterial({
  size: 0.12,
  map: pTexture,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  opacity: 0.75
});

const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
scene.add(particleSystem);

// Variables for scroll-dynamic speed & dispersion
let particleSpeedFactor = 1.0;
let particleRadiusFactor = 1.0;
let warpFactor = 0.0;
let anomalyFactor = 0.0;

function animateParticles(time) {
  const posAttr = particleGeometry.attributes.position;
  
  for (let i = 0; i < particleCount; i++) {
    const orbit = originalOrbits[i];
    
    // Rotate orbits over time
    const currentSpeed = orbit.speed * (1.0 + anomalyFactor * 5.0);
    orbit.theta += currentSpeed * 0.02 * particleSpeedFactor;
    
    // Compress or expand radius dynamically
    let currentRadius = orbit.radius * particleRadiusFactor;
    if (anomalyFactor > 0.01) {
      // Spiral suction: pull particles into event horizon (0.1 to 0.4 distance)
      const suctionOffset = (i % 4) * 0.15;
      currentRadius = currentRadius * (1.0 - anomalyFactor) + (0.1 + suctionOffset) * anomalyFactor;
    }

    // Convert spherical back to cartesian
    let x = currentRadius * Math.sin(orbit.phi) * Math.cos(orbit.theta);
    let y = currentRadius * Math.sin(orbit.phi) * Math.sin(orbit.theta);
    let z = currentRadius * Math.cos(orbit.phi);

    // Warp effect: stretch Z coordinates significantly and compress X/Y
    if (warpFactor > 0.01) {
      z = z + (Math.sin(time * 8 + orbit.speed * 25) * 12 * warpFactor * orbit.speed);
      x = x * (1.0 - warpFactor * 0.75);
      y = y * (1.0 - warpFactor * 0.75);
    }

    // Suction along Z axis as well
    if (anomalyFactor > 0.01) {
      z = z * (1.0 - anomalyFactor);
    }

    posAttr.setXYZ(i, x, y, z);
  }
  
  posAttr.needsUpdate = true;
}

/* ==========================================
   6. GSAP SCROLLTRIGGER INTERFACE ANIMATIONS
   ========================================== */
function initializeScrollTriggerAnimations() {
  const sections = document.querySelectorAll('.scroll-section');
  const navLinks = document.querySelectorAll('.nav-link');
  const dots = document.querySelectorAll('.dot');
  const scrollFill = document.getElementById('scroll-bar-fill');

  // Trigger sound hum and transitions based on scroll active sections
  let currentActiveSectionIndex = 0;

  function updateActiveSection(index) {
    if (index === currentActiveSectionIndex) return;
    
    sections.forEach(s => s.classList.remove('active'));
    sections[index].classList.add('active');
    
    navLinks.forEach(l => l.classList.remove('active'));
    if (navLinks[index]) navLinks[index].classList.add('active');
    
    dots.forEach(d => d.classList.remove('active'));
    if (dots[index]) dots[index].classList.add('active');

    // Update vertical scrollbar fill
    scrollFill.style.height = `${(index / (sections.length - 1)) * 100}%`;

    currentActiveSectionIndex = index;
    audio.playTransition();
  }

  // Bind active section to scroll triggers
  sections.forEach((section, index) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 50%',
      end: 'bottom 50%',
      onEnter: () => updateActiveSection(index),
      onEnterBack: () => updateActiveSection(index)
    });
  });

  // Main Scroll Timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.scroll-container',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2, // Smooth follow-along
    }
  });

  // Section 1 -> Section 2: Explode / Deconstruct
  tl.to(camera.position, { x: 0, y: 2, z: 6.5, ease: 'power2.inOut' }, 0)
    .to(shellGroupLeft.position, { x: -0.9, y: 0.4, z: -0.3, ease: 'power2.inOut' }, 0)
    .to(shellGroupRight.position, { x: 0.9, y: -0.4, z: 0.3, ease: 'power2.inOut' }, 0)
    .to(innerEngineGroup.position, { z: -0.8, ease: 'power2.inOut' }, 0)
    .to(reactorGroup.scale, { x: 1.2, y: 1.2, z: 1.2, ease: 'power2.inOut' }, 0)
    .to(coreMaterial, { emissiveIntensity: 3.5, ease: 'power2.inOut' }, 0);

  // Section 2 -> Section 3: Holographic Plane scales up, Casing slides back partially
  tl.to(camera.position, { x: 3.8, y: 1.2, z: 4.8, ease: 'power2.inOut' }, 1)
    .to(shellGroupLeft.position, { x: -0.4, y: 0.2, z: -0.1, ease: 'power2.inOut' }, 1)
    .to(shellGroupRight.position, { x: 0.4, y: -0.2, z: 0.1, ease: 'power2.inOut' }, 1)
    .to(holoGroup.scale, { x: 1.0, y: 1.0, z: 1.0, ease: 'back.out(1.5)' }, 1)
    .to(ring1.rotation, { z: Math.PI * 4, ease: 'power1.inOut' }, 1);

  // Section 3 -> Section 4: Zoom into Core, compression of Particles into Vortex
  tl.to(camera.position, { x: 0, y: 0.05, z: 1.9, ease: 'power3.inOut' }, 2)
    .to(holoGroup.scale, { x: 0, y: 0, z: 0, ease: 'power2.inOut' }, 2)
    .to(shellGroupLeft.position, { x: -2.5, ease: 'power3.inOut' }, 2)
    .to(shellGroupRight.position, { x: 2.5, ease: 'power3.inOut' }, 2)
    .to({ speed: 1.0, radius: 1.0 }, {
      speed: 4.5,
      radius: 0.42,
      ease: 'power3.inOut',
      onUpdate: function() {
        particleSpeedFactor = this.targets()[0].speed;
        particleRadiusFactor = this.targets()[0].radius;
      }
    }, 2)
    .to(coreMaterial.color, { r: 1.0, g: 0.16, b: 0.37, ease: 'power2.inOut' }, 2)
    .to(coreMaterial.emissive, { r: 1.0, g: 0.16, b: 0.37, ease: 'power2.inOut' }, 2)
    .to(crimsonGlowLight, { intensity: 4, ease: 'power2.inOut' }, 2)
    .to(cyanGlowLight, { intensity: 0.5, ease: 'power2.inOut' }, 2);

  // Section 4 -> Section 5: Core -> Blueprint Matrix (Side profile, grid helper appears)
  tl.to(camera.position, { x: 5.2, y: 0.5, z: 2.2, ease: 'power2.inOut' }, 3)
    .to(shellGroupLeft.position, { x: -0.4, y: 0, z: 0, ease: 'power2.inOut' }, 3)
    .to(shellGroupRight.position, { x: 0.4, y: 0, z: 0, ease: 'power2.inOut' }, 3)
    .to(innerEngineGroup.position, { z: -0.4, ease: 'power2.inOut' }, 3)
    .to(polarGridHelper.material, { opacity: 0.55, ease: 'power2.inOut' }, 3)
    .to(coreMaterial.color, { r: 0.0, g: 0.95, b: 1.0, ease: 'power2.inOut' }, 3)
    .to(coreMaterial.emissive, { r: 0.0, g: 0.95, b: 1.0, ease: 'power2.inOut' }, 3)
    .to(crimsonGlowLight, { intensity: 1.0, ease: 'power2.inOut' }, 3)
    .to(cyanGlowLight, { intensity: 3.0, ease: 'power2.inOut' }, 3)
    .to({ speed: 4.5, radius: 0.42 }, {
      speed: 1.5,
      radius: 1.0,
      ease: 'power2.inOut',
      onUpdate: function() {
        particleSpeedFactor = this.targets()[0].speed;
        particleRadiusFactor = this.targets()[0].radius;
      }
    }, 3);

  // Section 5 -> Section 6: Blueprint -> Chrono-Warp (Lightspeed stretch effect)
  tl.to(camera.position, { x: 0, y: 0, z: -3.0, ease: 'power3.inOut' }, 4)
    .to(polarGridHelper.material, { opacity: 0.0, ease: 'power2.inOut' }, 4)
    .to(deviceGroup.scale, { x: 12.0, y: 12.0, z: 12.0, ease: 'power3.inOut' }, 4)
    .to(chassisMaterial, { opacity: 0.05, ease: 'power2.inOut' }, 4)
    .to(brassCoreMaterial, { opacity: 0.05, ease: 'power2.inOut' }, 4)
    .to(glassMaterial, { opacity: 0.02, ease: 'power2.inOut' }, 4)
    .to(coreMaterial, { opacity: 0.05, ease: 'power2.inOut' }, 4)
    .to({ speed: 1.5, radius: 1.0, warp: 0.0 }, {
      speed: 16.0,
      radius: 0.35,
      warp: 1.0,
      ease: 'power3.inOut',
      onUpdate: function() {
        particleSpeedFactor = this.targets()[0].speed;
        particleRadiusFactor = this.targets()[0].radius;
        warpFactor = this.targets()[0].warp;
      }
    }, 4);

  // Section 6 -> Section 7: Chrono-Warp -> Neural Sync (Heartbeat orbital line)
  tl.to(camera.position, { x: -2.0, y: 1.2, z: 4.8, ease: 'power3.inOut' }, 5)
    .to(deviceGroup.scale, { x: 1.0, y: 1.0, z: 1.0, ease: 'power3.inOut' }, 5)
    .to(shellGroupLeft.position, { x: -0.2, y: 0.1, z: -0.05, ease: 'power3.inOut' }, 5)
    .to(shellGroupRight.position, { x: 0.2, y: -0.1, z: 0.05, ease: 'power3.inOut' }, 5)
    .to(chassisMaterial, { opacity: 1.0, ease: 'power3.inOut' }, 5)
    .to(brassCoreMaterial, { opacity: 1.0, ease: 'power3.inOut' }, 5)
    .to(glassMaterial, { opacity: 0.25, ease: 'power3.inOut' }, 5)
    .to(coreMaterial, { opacity: 1.0, ease: 'power3.inOut' }, 5)
    .to(pulseMat, { opacity: 0.8, ease: 'power2.inOut' }, 5)
    .to(coreMaterial.color, { r: 0.06, g: 0.72, b: 0.50, ease: 'power2.inOut' }, 5) // Green/emerald
    .to(coreMaterial.emissive, { r: 0.06, g: 0.72, b: 0.50, ease: 'power2.inOut' }, 5)
    .to(cyanGlowLight.color, { r: 0.06, g: 0.72, b: 0.50, ease: 'power2.inOut' }, 5)
    .to({ speed: 16.0, radius: 0.35, warp: 1.0 }, {
      speed: 1.2,
      radius: 1.0,
      warp: 0.0,
      ease: 'power3.inOut',
      onUpdate: function() {
        particleSpeedFactor = this.targets()[0].speed;
        particleRadiusFactor = this.targets()[0].radius;
        warpFactor = this.targets()[0].warp;
      }
    }, 5);

  // Section 7 -> Section 8: Neural Sync -> Anomaly collapse (Chaotic tumble + Accretion disk)
  tl.to(camera.position, { x: 0, y: 0.1, z: 2.2, ease: 'power3.inOut' }, 6)
    .to(pulseMat, { opacity: 0.0, ease: 'power2.inOut' }, 6)
    .to(shellGroupLeft.position, { x: -2.8, y: 1.2, z: -1.5, ease: 'power3.inOut' }, 6)
    .to(shellGroupRight.position, { x: 2.8, y: -1.2, z: 1.5, ease: 'power3.inOut' }, 6)
    .to(innerEngineGroup.position, { z: 2.6, ease: 'power3.inOut' }, 6)
    .to(chassisMaterial, { opacity: 0.08, ease: 'power3.inOut' }, 6)
    .to(brassCoreMaterial, { opacity: 0.08, ease: 'power3.inOut' }, 6)
    .to(glassMaterial, { opacity: 0.01, ease: 'power3.inOut' }, 6)
    .to(coreMesh.scale, { x: 0.01, y: 0.01, z: 0.01, ease: 'power3.inOut' }, 6)
    .to(blackHoleMesh.scale, { x: 1.0, y: 1.0, z: 1.0, ease: 'power3.inOut' }, 6)
    .to(accretionDiskMat, { opacity: 0.95, ease: 'power2.inOut' }, 6)
    .to(cyanGlowLight, { intensity: 0, ease: 'power2.inOut' }, 6)
    .to(crimsonGlowLight, { intensity: 6.0, ease: 'power2.inOut' }, 6)
    .to(crimsonGlowLight.color, { r: 1.0, g: 0.0, b: 0.1, ease: 'power2.inOut' }, 6)
    .to({ anomaly: 0.0 }, {
      anomaly: 1.0,
      ease: 'power3.inOut',
      onUpdate: function() {
        anomalyFactor = this.targets()[0].anomaly;
      }
    }, 6);

  // Section 8 -> Section 9: Anomaly -> Customize (Restore watch)
  tl.to(camera.position, { x: 0, y: 0, z: 6.2, ease: 'power3.out' }, 7)
    .to(shellGroupLeft.position, { x: 0, y: 0, z: 0, ease: 'power3.out' }, 7)
    .to(shellGroupRight.position, { x: 0, y: 0, z: 0, ease: 'power3.out' }, 7)
    .to(innerEngineGroup.position, { z: 0, ease: 'power3.out' }, 7)
    .to(chassisMaterial, { opacity: 1.0, ease: 'power3.out' }, 7)
    .to(brassCoreMaterial, { opacity: 1.0, ease: 'power3.out' }, 7)
    .to(glassMaterial, { opacity: 0.2, ease: 'power3.out' }, 7)
    .to(coreMesh.scale, { x: 1.0, y: 1.0, z: 1.0, ease: 'power3.out' }, 7)
    .to(blackHoleMesh.scale, { x: 0, y: 0, z: 0, ease: 'power3.out' }, 7)
    .to(accretionDiskMat, { opacity: 0, ease: 'power3.out' }, 7)
    .to(coreMaterial.color, { r: 0.0, g: 0.95, b: 1.0, ease: 'power3.out' }, 7)
    .to(coreMaterial.emissive, { r: 0.0, g: 0.95, b: 1.0, ease: 'power3.out' }, 7)
    .to(cyanGlowLight.color, { r: 0.0, g: 0.95, b: 1.0, ease: 'power3.out' }, 7)
    .to(cyanGlowLight, { intensity: 3.0, ease: 'power3.out' }, 7)
    .to(crimsonGlowLight, { intensity: 1.0, ease: 'power3.out' }, 7)
    .to({ anomaly: 1.0 }, {
      anomaly: 0.0,
      ease: 'power3.out',
      onUpdate: function() {
        anomalyFactor = this.targets()[0].anomaly;
      }
    }, 7);

  // Setup callbacks when entering and leaving free orbit mode
  ScrollTrigger.create({
    trigger: '#customize',
    start: 'top 30%',
    end: 'bottom bottom',
    onEnter: () => {
      controls.enabled = true;
      document.getElementById('orbit-btn').classList.add('active');
    },
    onLeaveBack: () => {
      controls.enabled = false;
      document.getElementById('orbit-btn').classList.remove('active');
      // Reset camera smoothly
      gsap.to(camera.position, { x: 0, y: 0, z: 6.2, duration: 1.0 });
      gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 1.0 });
    }
  });
}

/* ==========================================
   7. INTERACTIVE INTERFACE CONTROLS & EVENTS
   ========================================== */
function setupUI() {
  // Audio Toggle
  const soundBtn = document.getElementById('sound-toggle');
  soundBtn.addEventListener('click', () => {
    const isPlaying = audio.toggle();
    if (isPlaying) {
      soundBtn.classList.add('playing');
      soundBtn.querySelector('.btn-text').innerText = 'AUDIO ON';
      audio.playClick();
    } else {
      soundBtn.classList.remove('playing');
      soundBtn.querySelector('.btn-text').innerText = 'AUDIO OFF';
    }
  });
  
  soundBtn.addEventListener('mouseenter', () => audio.playHover());

  // Navigation Links Click Handling
  document.querySelectorAll('.nav-link, .dot').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      audio.playClick();
      const targetId = el.getAttribute('href') ? el.getAttribute('href').substring(1) : el.getAttribute('data-target');
      const targetSection = document.getElementById(targetId);
      
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
    el.addEventListener('mouseenter', () => audio.playHover());
  });

  // Customize - Chassis Color Pickers
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      audio.playClick();
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const newHex = btn.getAttribute('data-color');
      
      // Animate material color change
      gsap.to(chassisMaterial.color, {
        r: parseInt(newHex.substring(1, 3), 16) / 255,
        g: parseInt(newHex.substring(3, 5), 16) / 255,
        b: parseInt(newHex.substring(5, 7), 16) / 255,
        duration: 0.8
      });
    });
    btn.addEventListener('mouseenter', () => audio.playHover());
  });

  // Customize - Hologram Toggle
  const holoToggle = document.getElementById('hologram-toggle');
  let holoActive = true;
  
  holoToggle.addEventListener('click', () => {
    audio.playClick();
    holoActive = !holoActive;
    
    if (holoActive) {
      holoToggle.classList.add('active');
      holoToggle.innerText = 'ACTIVE';
      gsap.to(holoGroup.scale, { x: 1, y: 1, z: 1, duration: 0.6, ease: 'back.out' });
    } else {
      holoToggle.classList.remove('active');
      holoToggle.innerText = 'DISABLED';
      gsap.to(holoGroup.scale, { x: 0, y: 0, z: 0, duration: 0.6, ease: 'power2.in' });
    }
  });
  holoToggle.addEventListener('mouseenter', () => audio.playHover());

  // Customize - Run Diagnostics (Confetti burst + Core Flashing + Synthesizer Arpeggio)
  const diagBtn = document.getElementById('diagnostic-btn');
  diagBtn.addEventListener('click', () => {
    audio.playDiagnostic();
    
    // Core lighting flash
    const pulseTimeline = gsap.timeline();
    pulseTimeline.to(coreMaterial, { emissiveIntensity: 6.0, duration: 0.15, yoyo: true, repeat: 3 })
                 .to(coreMaterial, { emissiveIntensity: 1.5, duration: 0.5 });
                 
    // Trigger confetti
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00f2fe', '#4facfe', '#ff2a5f', '#10b981']
    });
  });
  diagBtn.addEventListener('mouseenter', () => audio.playHover());

  // Customize - Orbit Rotation Toggle
  const orbitBtn = document.getElementById('orbit-btn');
  orbitBtn.addEventListener('click', () => {
    audio.playClick();
    controls.enabled = !controls.enabled;
    
    if (controls.enabled) {
      orbitBtn.classList.add('active');
    } else {
      orbitBtn.classList.remove('active');
      // Smoothly return back to default angle
      gsap.to(camera.position, { x: 0, y: 0, z: 6.2, duration: 1.0 });
      gsap.to(controls.target, { x: 0, y: 0, z: 0, duration: 1.0 });
    }
  });
  orbitBtn.addEventListener('mouseenter', () => audio.playHover());
}

/* ==========================================
   8. RUNTIME RENDERING LOOP
   ========================================== */
const clock = new THREE.Clock();

function tick() {
  const elapsedTime = clock.getElapsedTime();

  // Slow ambient rotations of entire device (unless manually dragging via controls)
  if (!controls.enabled) {
    deviceGroup.rotation.y = elapsedTime * 0.18;
    deviceGroup.rotation.x = Math.sin(elapsedTime * 0.25) * 0.15;
  } else {
    controls.update();
  }

  // Animate inner gears
  innerEngineGroup.rotation.z = -elapsedTime * 0.8;

  // Animate wireframe globe mesh
  globeWireframe.rotation.y = -elapsedTime * 0.4;
  globeWireframe.rotation.x = elapsedTime * 0.2;

  // Orbiting dynamic neon rings
  ring1.rotation.z = elapsedTime * 0.5;
  ring2.rotation.z = -elapsedTime * 0.35;

  // Core pulsation (subtle scaling and glow breathing)
  const pulseFactor = Math.sin(elapsedTime * 4.0) * 0.05 + 1.0;
  reactorGroup.scale.set(pulseFactor, pulseFactor, pulseFactor);

  // Update dynamic hologram plane texture
  updateHologramCanvas(elapsedTime);

  // Update custom quantum particle cloud
  animateParticles(elapsedTime);

  // Render Scene
  renderer.render(scene, camera);

  // Request next frame
  window.requestAnimationFrame(tick);
}

// Window resizing adjustments
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/* ==========================================
   9. BOOTSTRAP INITIALIZATION
   ========================================== */
setupLoader();
setupUI();
tick();
