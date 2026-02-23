export interface Blob {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  targetX: number;
  targetY: number;
  color: string;
  layer: number;
  territoryX?: number;
  territoryY?: number;
  territoryRadius?: number;
  deformX?: number;
  deformY?: number;
  rotation?: number;
}

export interface BlobConfig {
  count: number;
  minRadius: number;
  maxRadius: number;
  speed: number;
  mouseInfluence: number;
  returnSpeed: number;
}

export interface ConvexBlob {
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
	color: string;
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
	
	territoryRadius?: number;
	territoryX?: number;
	territoryY?: number;
	
	personalSpace?: number;
	repulsionStrength?: number;
	lastRepulsionTime?: number;
}

export interface ColorDefinition {
	color: string;
	attractive: boolean;
	scrollAffinity: number;
}

export interface DeviceMotionData {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  x?: number;
  y?: number;
  z?: number;
}

export interface ScrollData {
  y: number;
  velocity: number;
  direction: 'up' | 'down' | 'idle';
}

export interface VectorProps {
	isDark?: boolean;
	opacity?: number;
	animated?: boolean;
	mouseX?: number;
	mouseY?: number;
}
