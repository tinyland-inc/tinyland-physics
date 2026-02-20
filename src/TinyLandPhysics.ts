import type { Blob, BlobConfig } from './types';

interface ConvexBlob extends Blob {
  baseX: number;
  baseY: number;
  currentX: number;
  currentY: number;
  velocityX: number;
  velocityY: number;
  size: number;
  elasticity: number;
  viscosity: number;
  phase: number;
  speed: number;
  gradientId: string;
  intensity: number;
  stickiness: number;
  isAttractive: boolean;
  mouseDistance: number;
  isStuck: boolean;
  radiusVariations: number[];
  fluidMass: number;
  scrollAffinity: number;
  surfaceTension?: number;
  density?: number;
  flowResistance?: number;
  controlPoints?: Array<{
    radius: number;
    angle: number;
    targetRadius: number;
    baseRadius: number;
    pressure?: number;
    adhesion?: number;
    tension?: number;
  }>;
  controlVelocities?: Array<{
    radialVelocity: number;
    angularVelocity: number;
    pressureVelocity?: number;
  }>;
  deformationStrength?: number;
  cohesion?: number;
  stretchability?: number;
  lastCollisionTime?: number;
  mergeThreshold?: number;
  splitThreshold?: number;
  isSettled?: boolean;
  settleTime?: number;
  groundContactPoints?: number[];
  restHeight?: number;
  wetting?: number;
  contactAngle?: number;
  pressureDistribution?: number[];
  chaosLevel?: number;
  turbulenceDecay?: number;
  dampingFactor?: number;
  stabilityThreshold?: number;
  lastStableTime?: number;
  expansionPhase?: boolean;
  expansionTime?: number;
  maxExpansionTime?: number;
  wallBounceCount?: number;
  lastBounceTime?: number;
  driftAngle?: number;
  driftSpeed?: number;
  personalSpace?: number;
  repulsionStrength?: number;
  lastRepulsionTime?: number;
}

interface ColorDefinition {
  color: string;
  attractive: boolean;
  scrollAffinity: number;
}

export class TinyLandPhysics {
  private blobs: ConvexBlob[] = [];
  private config: BlobConfig;
  private width: number;
  private height: number;
  private mouseX = 50;
  private mouseY = 50;
  private mouseVelX = 0;
  private mouseVelY = 0;
  private lastMouseX = 50;
  private lastMouseY = 50;
  private animationId: number | null = null;
  private isDark = false;

  // Extended margin system
  private readonly MARGIN_EXTENSION = 1.2;
  private readonly PHYSICS_MIN = -40;
  private readonly PHYSICS_MAX = 140;

  // Color definitions
  private lightColors: Record<string, ColorDefinition> = {
    transBlueGlow: { color: 'rgba(91, 206, 250, 0.8)', attractive: true, scrollAffinity: 0.4 },
    transPinkGlow: { color: 'rgba(245, 169, 184, 0.88)', attractive: true, scrollAffinity: 0.8 },
    cloudWhite: { color: 'rgba(255, 255, 255, 0.7)', attractive: false, scrollAffinity: 0.3 },
    lavenderMist: { color: 'rgba(220, 220, 255, 0.7)', attractive: false, scrollAffinity: 0.35 },
    blushPink: { color: 'rgba(255, 160, 220, 0.8)', attractive: false, scrollAffinity: 0.4 },
    powderBlue: { color: 'rgba(160, 190, 255, 0.8)', attractive: false, scrollAffinity: 0.45 },
    pearlWhite: { color: 'rgba(255, 255, 255, 0.5)', attractive: false, scrollAffinity: 0.25 }
  };

  private darkColors: Record<string, ColorDefinition> = {
    transBlueGlow: { color: 'rgba(91, 206, 250, 0.8)', attractive: true, scrollAffinity: 0.6 },
    transPinkGlow: { color: 'rgba(245, 169, 184, 0.75)', attractive: false, scrollAffinity: 0.3 },
    transBlackAccent: { color: 'rgba(40, 40, 40, 0.6)', attractive: false, scrollAffinity: 0.2 },
    prideRedNeon: { color: 'rgba(255, 50, 50, 0.75)', attractive: false, scrollAffinity: 0.35 },
    prideOrangeNeon: { color: 'rgba(255, 165, 0, 0.8)', attractive: false, scrollAffinity: 0.4 },
    prideGreenNeon: { color: 'rgba(50, 205, 50, 0.75)', attractive: false, scrollAffinity: 0.3 },
    prideBlueNeon: { color: 'rgba(70, 130, 255, 0.8)', attractive: false, scrollAffinity: 0.35 },
    pridePurpleNeon: { color: 'rgba(160, 70, 180, 0.8)', attractive: false, scrollAffinity: 0.4 }
  };

  constructor(width: number, height: number, config: BlobConfig, theme: string = 'tinyland') {
    this.width = width;
    this.height = height;
    this.config = config;
    this.isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    this.initBlobs();
  }

  private initBlobs() {
    const colors = this.isDark ? this.darkColors : this.lightColors;
    const colorEntries = Object.entries(colors);

    this.blobs = colorEntries.map(([key, colorData], i) => {
      const totalBlobs = colorEntries.length;
      const angle = (i / totalBlobs) * Math.PI * 2;
      const radius = 35 + Math.random() * 30;

      const baseX = 50 + Math.cos(angle) * radius + (Math.random() - 0.5) * 25;
      const baseY = 50 + Math.sin(angle) * radius + (Math.random() - 0.5) * 25;

      const clampedX = Math.max(this.PHYSICS_MIN + 25, Math.min(this.PHYSICS_MAX - 25, baseX));
      const clampedY = Math.max(this.PHYSICS_MIN + 25, Math.min(this.PHYSICS_MAX - 25, baseY));

      // Dramatically larger blob sizes
      const baseSize = 28 + Math.random() * 18;

      // Create organic blob shape points
      const numControlPoints = 16;
      const controlPoints = [];
      const controlVelocities = [];

      for (let j = 0; j < numControlPoints; j++) {
        const pointAngle = (j / numControlPoints) * Math.PI * 2;
        const radiusVariation = 0.8 + Math.random() * 0.35;
        const pointRadius = baseSize * radiusVariation;

        controlPoints.push({
          radius: pointRadius,
          angle: pointAngle,
          targetRadius: pointRadius,
          baseRadius: pointRadius,
          pressure: 1.0,
          adhesion: 0.15 + Math.random() * 0.1,
          tension: 0.3 + Math.random() * 0.15
        });

        controlVelocities.push({
          radialVelocity: 0,
          angularVelocity: (Math.random() - 0.5) * 0.0004,
          pressureVelocity: 0
        });
      }

      // Convert to standard Blob interface with extended properties
      const blob: ConvexBlob = {
        id: i,
        x: clampedX * this.width / 100,
        y: clampedY * this.height / 100,
        vx: (Math.random() - 0.5) * 0.06,
        vy: (Math.random() - 0.5) * 0.06,
        radius: baseSize * 2.5, // Larger for visual impact
        targetX: clampedX * this.width / 100,
        targetY: clampedY * this.height / 100,
        color: colorData.color,
        layer: Math.floor(i / Math.ceil(totalBlobs / 3)),
        territoryX: clampedX,
        territoryY: clampedY,
        territoryRadius: 70 + Math.random() * 50,
        deformX: 1,
        deformY: 1,
        rotation: Math.random() * Math.PI * 2,

        // Extended properties for ConvexBlob
        baseX: clampedX,
        baseY: clampedY,
        currentX: clampedX,
        currentY: clampedY,
        velocityX: (Math.random() - 0.5) * 0.06,
        velocityY: (Math.random() - 0.5) * 0.06,
        size: baseSize,
        elasticity: 0.0008 + Math.random() * 0.0004,
        viscosity: 0.988 + Math.random() * 0.008,
        phase: Math.random() * Math.PI * 2,
        speed: 0.006 + Math.random() * 0.003,
        gradientId: `blob${i}`,
        intensity: 0.65 + Math.random() * 0.2,
        stickiness: 2,
        isAttractive: colorData.attractive,
        mouseDistance: 100,
        isStuck: false,
        radiusVariations: [],
        fluidMass: 0.5 + Math.random() * 0.25,
        scrollAffinity: colorData.scrollAffinity,
        surfaceTension: 0.02 + Math.random() * 0.01,
        density: 0.4 + Math.random() * 0.1,
        flowResistance: 0.002 + Math.random() * 0.001,
        controlPoints: controlPoints,
        controlVelocities: controlVelocities,
        deformationStrength: 0.3 + Math.random() * 0.15,
        cohesion: 0.05 + Math.random() * 0.03,
        stretchability: 0.8 + Math.random() * 0.3,
        lastCollisionTime: 0,
        mergeThreshold: baseSize * 0.5,
        splitThreshold: baseSize * 1.5,
        isSettled: false,
        settleTime: 0,
        groundContactPoints: [],
        restHeight: baseSize * 0.7,
        wetting: 0.15 + Math.random() * 0.1,
        contactAngle: 70 + Math.random() * 30,
        pressureDistribution: new Array(numControlPoints).fill(1.0),
        chaosLevel: 0,
        turbulenceDecay: 0.985,
        expansionPhase: false,
        expansionTime: 0,
        maxExpansionTime: 20 + Math.random() * 40,
        wallBounceCount: 0,
        lastBounceTime: 0,
        driftAngle: Math.random() * Math.PI * 2,
        driftSpeed: 0.03 + Math.random() * 0.04,
        personalSpace: 50 + Math.random() * 30,
        repulsionStrength: 0.018 + Math.random() * 0.01,
        lastRepulsionTime: 0
      };

      return blob;
    });
  }

  updateMouse(x: number, y: number) {
    // Convert to percentage coordinates
    const percentX = (x / this.width) * 100;
    const percentY = (y / this.height) * 100;

    this.mouseVelX = percentX - this.lastMouseX;
    this.mouseVelY = percentY - this.lastMouseY;

    this.lastMouseX = this.mouseX;
    this.lastMouseY = this.mouseY;
    this.mouseX = percentX;
    this.mouseY = percentY;
  }

  updateScroll(scrollY: number, velocity?: number) {
    // Implement scroll-based forces
    this.blobs.forEach(blob => {
      const scrollForce = velocity ? velocity * 0.1 : 0;
      blob.vy += scrollForce * blob.scrollAffinity;
    });
  }

  updateDeviceMotion(beta: number, gamma: number, acceleration?: DeviceMotionEvent['accelerationIncludingGravity']) {
    // Apply device tilt to blob physics
    const tiltX = gamma / 90; // -1 to 1
    const tiltY = beta / 90;  // -2 to 2

    this.blobs.forEach(blob => {
      blob.vx += tiltX * 0.5;
      blob.vy += tiltY * 0.5;

      if (acceleration) {
        const accelMagnitude = Math.sqrt(
          (acceleration.x || 0) ** 2 +
          (acceleration.y || 0) ** 2 +
          (acceleration.z || 0) ** 2
        );

        const deformFactor = Math.min(accelMagnitude * 0.01, 0.3);
        blob.deformX = 1 + (Math.random() - 0.5) * deformFactor;
        blob.deformY = 1 + (Math.random() - 0.5) * deformFactor;
      }
    });
  }

  updateTheme(theme: string) {
    this.isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
    // Re-initialize blobs with new colors
    this.initBlobs();
  }

  resize(width: number, height: number) {
    const scaleX = width / this.width;
    const scaleY = height / this.height;

    this.width = width;
    this.height = height;

    this.blobs.forEach(blob => {
      blob.x *= scaleX;
      blob.y *= scaleY;
      blob.targetX *= scaleX;
      blob.targetY *= scaleY;
      blob.currentX = blob.x / width * 100;
      blob.currentY = blob.y / height * 100;
    });
  }

  private updateBlob(blob: ConvexBlob, dt: number) {
    // Mouse interaction
    const mouseXPixel = this.mouseX * this.width / 100;
    const mouseYPixel = this.mouseY * this.height / 100;
    const dx = mouseXPixel - blob.x;
    const dy = mouseYPixel - blob.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 300 && distance > 0) {
      const force = (300 - distance) / 300;
      const pushForce = force * this.config.mouseInfluence * 2;
      blob.vx -= (dx / distance) * pushForce;
      blob.vy -= (dy / distance) * pushForce;
      blob.velocityX = blob.vx;
      blob.velocityY = blob.vy;
    }

    // Anti-clustering
    this.blobs.forEach(other => {
      if (other.id === blob.id) return;

      const cdx = blob.x - other.x;
      const cdy = blob.y - other.y;
      const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
      const minDist = (blob.radius + other.radius) * 1.2;

      if (cdist < minDist && cdist > 0) {
        const overlap = (minDist - cdist) / minDist;
        const repulsion = overlap * 0.08;

        blob.vx += (cdx / cdist) * repulsion * blob.radius;
        blob.vy += (cdy / cdist) * repulsion * blob.radius;
      }
    });

    // Territory-based movement
    const territoryXPixel = (blob.territoryX ?? blob.baseX) * this.width / 100;
    const territoryYPixel = (blob.territoryY ?? blob.baseY) * this.height / 100;
    const territoryDx = territoryXPixel - blob.x;
    const territoryDy = territoryYPixel - blob.y;
    const territoryDist = Math.sqrt(territoryDx * territoryDx + territoryDy * territoryDy);
    const territoryRadiusPixel = (blob.territoryRadius ?? 70) * Math.min(this.width, this.height) / 100;

    if (territoryDist > territoryRadiusPixel) {
      const returnForce = (territoryDist - territoryRadiusPixel) / territoryDist * 0.02;
      blob.vx += territoryDx * returnForce;
      blob.vy += territoryDy * returnForce;
    }

    // Apply velocity
    blob.x += blob.vx * dt;
    blob.y += blob.vy * dt;
    blob.rotation = (blob.rotation ?? 0) + (blob.vx * 0.001 + blob.vy * 0.001) * dt;

    // Update normalized positions
    blob.currentX = blob.x / this.width * 100;
    blob.currentY = blob.y / this.height * 100;

    // Damping
    blob.vx *= 0.92;
    blob.vy *= 0.92;
    blob.velocityX = blob.vx;
    blob.velocityY = blob.vy;

    // Gradually restore deformation
    blob.deformX = (blob.deformX ?? 1) + (1 - (blob.deformX ?? 1)) * 0.1;
    blob.deformY = (blob.deformY ?? 1) + (1 - (blob.deformY ?? 1)) * 0.1;

    // Keep within extended bounds
    const minX = this.PHYSICS_MIN * this.width / 100;
    const maxX = this.PHYSICS_MAX * this.width / 100;
    const minY = this.PHYSICS_MIN * this.height / 100;
    const maxY = this.PHYSICS_MAX * this.height / 100;

    if (blob.x < minX) blob.x = minX;
    if (blob.x > maxX) blob.x = maxX;
    if (blob.y < minY) blob.y = minY;
    if (blob.y > maxY) blob.y = maxY;
  }

  update(
    dt: number = 16.67,
    time?: number,
    gravity?: { x: number; y: number },
    tilt?: { x: number; y: number; z: number },
    scrollStickiness?: number,
    pullForces?: Array<{ strength: number; time: number; randomness: number; explosive: boolean }>
  ) {
    // Apply gravity if provided
    if (gravity) {
      this.blobs.forEach(blob => {
        blob.vx += gravity.x * 0.1;
        blob.vy += gravity.y * 0.1;
      });
    }

    // Apply pull forces from scrolling
    if (pullForces) {
      pullForces.forEach(force => {
        this.blobs.forEach(blob => {
          const randomAngle = Math.random() * Math.PI * 2;
          const forceMagnitude = force.strength * force.randomness * 0.5;
          blob.vx += Math.cos(randomAngle) * forceMagnitude;
          blob.vy += Math.sin(randomAngle) * forceMagnitude;
        });
      });
    }

    // Update all blobs
    this.blobs.forEach(blob => this.updateBlob(blob, dt / 16.67));
  }

  getBlobs(): Blob[] {
    // Convert ConvexBlob array to Blob array for compatibility
    return this.blobs.map(blob => ({
      id: blob.id,
      x: blob.x,
      y: blob.y,
      vx: blob.vx,
      vy: blob.vy,
      radius: blob.radius,
      targetX: blob.targetX,
      targetY: blob.targetY,
      color: blob.color,
      layer: blob.layer,
      territoryX: blob.territoryX,
      territoryY: blob.territoryY,
      territoryRadius: blob.territoryRadius,
      deformX: blob.deformX,
      deformY: blob.deformY,
      rotation: blob.rotation
    }));
  }

  start(onUpdate: (blobs: Blob[]) => void) {
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const dt = Math.min(currentTime - lastTime, 33.33);
      lastTime = currentTime;

      this.update(dt);
      onUpdate(this.getBlobs());
      this.animationId = requestAnimationFrame(animate);
    };

    animate(performance.now());
  }

  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}
