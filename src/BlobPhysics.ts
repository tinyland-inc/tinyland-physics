import type { ConvexBlob, ColorDefinition, DeviceMotionData } from './types.js';

export class BlobPhysics {
	private blobs: ConvexBlob[] = [];
	private isDark: boolean;
	private mouseX = 50;
	private mouseY = 50;
	private mouseVelX = 0;
	private mouseVelY = 0;
	private lastMouseX = 50;
	private lastMouseY = 50;

	// **DRAMATICALLY EXTENDED MARGIN SYSTEM** - Much larger physical space for clipping effects
	private readonly MARGIN_EXTENSION = 1.2;
	private readonly PHYSICS_MIN = -40;
	private readonly PHYSICS_MAX = 140;

	private lightColors: Record<string, ColorDefinition> = {
		// Trans Pride Colors (Bright & Attractive)
		transBlueGlow: { color: 'rgba(91, 206, 250, 0.8)', attractive: true, scrollAffinity: 0.4 },
		transPinkGlow: { color: 'rgba(245, 169, 184, 0.88)', attractive: true, scrollAffinity: 0.8 },
		cloudWhite: { color: 'rgba(255, 255, 255, 0.7)', attractive: false, scrollAffinity: 0.3 },

		// Additional Trans-inspired Pastels (Supporting colors)
		lavenderMist: { color: 'rgba(220, 220, 255, 0.7)', attractive: false, scrollAffinity: 0.35 },
		blushPink: { color: 'rgba(255, 160, 220, 0.8)', attractive: false, scrollAffinity: 0.4 },
		powderBlue: { color: 'rgba(160, 190, 255, 0.8)', attractive: false, scrollAffinity: 0.45 },
		pearlWhite: { color: 'rgba(255, 255, 255, 0.5)', attractive: false, scrollAffinity: 0.25 }
	};

	private darkColors: Record<string, ColorDefinition> = {
		// Trans Pride Colors (enhanced for dark mode)
		transBlueGlow: { color: 'rgba(91, 206, 250, 0.8)', attractive: true, scrollAffinity: 0.6 },
		transPinkGlow: { color: 'rgba(245, 169, 184, 0.75)', attractive: false, scrollAffinity: 0.3 },
		transBlackAccent: { color: 'rgba(40, 40, 40, 0.6)', attractive: false, scrollAffinity: 0.2 },

		// Rainbow Pride Colors (vibrant for dark mode)
		prideRedNeon: { color: 'rgba(255, 50, 50, 0.75)', attractive: false, scrollAffinity: 0.35 },
		prideOrangeNeon: { color: 'rgba(255, 165, 0, 0.8)', attractive: false, scrollAffinity: 0.4 },
		prideGreenNeon: { color: 'rgba(50, 205, 50, 0.75)', attractive: false, scrollAffinity: 0.3 },
		prideBlueNeon: { color: 'rgba(70, 130, 255, 0.8)', attractive: false, scrollAffinity: 0.35 },
		pridePurpleNeon: { color: 'rgba(160, 70, 180, 0.8)', attractive: false, scrollAffinity: 0.4 }
	};

	// Theme-specific color palettes
	private themeColors: Record<string, Record<string, Record<string, ColorDefinition>>> = {
		tinyland: {
			light: this.lightColors,
			dark: this.darkColors
		},
		tinyweb: {
			light: this.lightColors,
			dark: this.darkColors
		},
		pride: {
			light: {
				prideRed: { color: 'rgba(228, 3, 3, 0.7)', attractive: true, scrollAffinity: 0.4 },
				prideOrange: { color: 'rgba(255, 140, 0, 0.7)', attractive: false, scrollAffinity: 0.45 },
				prideYellow: { color: 'rgba(255, 237, 0, 0.7)', attractive: false, scrollAffinity: 0.5 },
				prideGreen: { color: 'rgba(0, 128, 38, 0.7)', attractive: false, scrollAffinity: 0.4 },
				prideBlue: { color: 'rgba(36, 64, 142, 0.7)', attractive: true, scrollAffinity: 0.55 },
				pridePurple: { color: 'rgba(115, 41, 130, 0.7)', attractive: false, scrollAffinity: 0.5 }
			},
			dark: {
				prideRedNeon: { color: 'rgba(255, 50, 50, 0.8)', attractive: true, scrollAffinity: 0.45 },
				prideOrangeNeon: { color: 'rgba(255, 165, 0, 0.85)', attractive: false, scrollAffinity: 0.5 },
				prideYellowNeon: { color: 'rgba(255, 255, 51, 0.85)', attractive: false, scrollAffinity: 0.55 },
				prideGreenNeon: { color: 'rgba(50, 205, 50, 0.8)', attractive: false, scrollAffinity: 0.45 },
				prideBlueNeon: { color: 'rgba(70, 130, 255, 0.85)', attractive: true, scrollAffinity: 0.6 },
				pridePurpleNeon: { color: 'rgba(160, 70, 180, 0.85)', attractive: false, scrollAffinity: 0.55 }
			}
		},
		trans: {
			light: {
				transBlue: { color: 'rgba(91, 206, 250, 0.75)', attractive: true, scrollAffinity: 0.4 },
				transPink: { color: 'rgba(245, 169, 184, 0.8)', attractive: true, scrollAffinity: 0.8 },
				transWhite: { color: 'rgba(255, 255, 255, 0.65)', attractive: false, scrollAffinity: 0.3 },
				transSkyBlue: { color: 'rgba(170, 225, 250, 0.7)', attractive: false, scrollAffinity: 0.35 },
				transRosePink: { color: 'rgba(250, 200, 210, 0.7)', attractive: false, scrollAffinity: 0.45 }
			},
			dark: {
				transBlueNeon: { color: 'rgba(91, 206, 250, 0.85)', attractive: true, scrollAffinity: 0.6 },
				transPinkNeon: { color: 'rgba(245, 169, 184, 0.8)', attractive: false, scrollAffinity: 0.35 },
				transWhiteGlow: { color: 'rgba(255, 255, 255, 0.75)', attractive: false, scrollAffinity: 0.25 },
				transBlueGlow: { color: 'rgba(125, 215, 252, 0.8)', attractive: false, scrollAffinity: 0.4 },
				transPinkGlow: { color: 'rgba(252, 174, 198, 0.8)', attractive: false, scrollAffinity: 0.5 }
			}
		}
	};

	constructor(isDark: boolean, theme: string = 'tinyweb') {
		this.isDark = isDark;
		this.currentTheme = theme;
	}

	private currentTheme: string;

	public updateTheme(isDark: boolean, theme?: string): void {
		this.isDark = isDark;
		if (theme) {
			this.currentTheme = theme;
		}
	}

	// **MOUSE COORDINATE CONVERSION** - Keep mouse in normal 0-100 range for physics
	public updateMousePosition(x: number, y: number): void {
		this.mouseVelX = x - this.lastMouseX;
		this.mouseVelY = y - this.lastMouseY;

		this.lastMouseX = this.mouseX;
		this.lastMouseY = this.mouseY;
		// Mouse coordinates remain in 0-100 range (no conversion needed)
		this.mouseX = x;
		this.mouseY = y;
	}

	public initializeBlobs(): ConvexBlob[] {
		const themeColorSet = this.themeColors[this.currentTheme] || this.themeColors.tinyweb;
		const colors = this.isDark ? themeColorSet.dark : themeColorSet.light;
		const colorEntries = Object.entries(colors);

		this.blobs = colorEntries.map(([key, colorData], i) => {
			// Use a more balanced distribution strategy in dramatically extended physical space
			const totalBlobs = colorEntries.length;
			const angle = (i / totalBlobs) * Math.PI * 2;
			const radius = 35 + Math.random() * 30; // Larger distribution radius

			// Calculate position in a circle with random offset in extended coordinates
			const baseX = 50 + Math.cos(angle) * radius + (Math.random() - 0.5) * 25;
			const baseY = 50 + Math.sin(angle) * radius + (Math.random() - 0.5) * 25;

			// **ALLOW BLOBS TO BE POSITIONED IN DRAMATICALLY EXTENDED PHYSICAL SPACE**
			const clampedX = Math.max(this.PHYSICS_MIN + 25, Math.min(this.PHYSICS_MAX - 25, baseX));
			const clampedY = Math.max(this.PHYSICS_MIN + 25, Math.min(this.PHYSICS_MAX - 25, baseY));

			// **DRAMATICALLY LARGER BLOB SIZES** - make them really imposing
			const baseSize = 28 + Math.random() * 18; // Increased from 18-30 to 28-46 units

			// Create organic blob shape points with controlled variation
			const numControlPoints = 16; // More points for smoother shapes
			const controlPoints = [];
			const controlVelocities = [];

			for (let j = 0; j < numControlPoints; j++) {
				const pointAngle = (j / numControlPoints) * Math.PI * 2;
				// **CONTROLLED RADIUS VARIATION** to prevent self-intersection
				const radiusVariation = 0.8 + Math.random() * 0.35; // Reduced variation
				const radius = baseSize * radiusVariation;

				controlPoints.push({
					radius: radius,
					angle: pointAngle,
					targetRadius: radius,
					baseRadius: radius,
					pressure: 1.0,
					adhesion: 0.15 + Math.random() * 0.1,
					tension: 0.3 + Math.random() * 0.15
				});

				controlVelocities.push({
					radialVelocity: 0,
					angularVelocity: (Math.random() - 0.5) * 0.0004, // Reduced angular velocity
					pressureVelocity: 0
				});
			}

			return {
				baseX: clampedX,
				baseY: clampedY,
				currentX: clampedX,
				currentY: clampedY,
				// Completely random initial velocities
				velocityX: (Math.random() - 0.5) * 0.06,
				velocityY: (Math.random() - 0.5) * 0.06,
				size: baseSize, // Much larger size
				elasticity: 0.0008 + Math.random() * 0.0004,
				viscosity: 0.988 + Math.random() * 0.008,
				phase: Math.random() * Math.PI * 2,
				speed: 0.006 + Math.random() * 0.003,
				color: colorData.color,
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
				deformationStrength: 0.3 + Math.random() * 0.15, // Reduced deformation
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
				// **TERRITORIES IN DRAMATICALLY EXTENDED SPACE**
				territoryRadius: 70 + Math.random() * 50, // Much larger territories
				territoryX: clampedX,
				territoryY: clampedY,
				// **ENHANCED REPULSION FOR MUCH LARGER BLOBS**
				personalSpace: 50 + Math.random() * 30, // Larger personal space for bigger blobs
				repulsionStrength: 0.018 + Math.random() * 0.01,
				lastRepulsionTime: 0
			};
		});

		return this.blobs;
	}

	public update(
		deltaTime: number,
		time: number,
		gravity: { x: number; y: number },
		tilt: { x: number; y: number; z: number },
		scrollStickiness: number,
		pullForces?: Array<{ strength: number; time: number; randomness: number; explosive: boolean }>
	): void {
		// Apply stronger anti-clustering forces first
		this.applyEnhancedAntiClustering();

		this.blobs.forEach((blob) =>
			this.updateScreensaverPhysics(
				blob,
				deltaTime,
				time,
				gravity,
				tilt,
				scrollStickiness,
				pullForces || []
			)
		);

		// Gentle mouse velocity decay
		this.mouseVelX *= 0.96;
		this.mouseVelY *= 0.96;
	}

	private applyEnhancedAntiClustering(): void {
		// **MUCH STRONGER ANTI-CLUSTERING SYSTEM FOR MUCH LARGER BLOBS**
		for (let i = 0; i < this.blobs.length; i++) {
			const blob1 = this.blobs[i];

			for (let j = i + 1; j < this.blobs.length; j++) {
				const blob2 = this.blobs[j];

				const dx = blob2.currentX - blob1.currentX;
				const dy = blob2.currentY - blob1.currentY;
				const distance = Math.sqrt(dx * dx + dy * dy);

				const requiredDistance = Math.max(blob1.personalSpace || 50, blob2.personalSpace || 50);

				if (distance < requiredDistance && distance > 0) {
					const overlap = requiredDistance - distance;
					// **STRONGER REPULSION FORCE FOR MUCH LARGER BLOBS**
					const repulsionForce = (overlap / requiredDistance) * 0.055; // Increased from 0.045 to 0.055

					const normalizedDx = dx / distance;
					const normalizedDy = dy / distance;

					const force1Multiplier = blob1.repulsionStrength || 0.03; // Increased from 0.025
					const force2Multiplier = blob2.repulsionStrength || 0.03; // Increased from 0.025

					// Apply exponential scaling for very close blobs
					const proximityMultiplier = distance < requiredDistance * 0.7 ? 3.5 : 1.0; // Increased from 3.0 to 3.5

					blob1.velocityX -= normalizedDx * repulsionForce * force1Multiplier * proximityMultiplier;
					blob1.velocityY -= normalizedDy * repulsionForce * force1Multiplier * proximityMultiplier;

					blob2.velocityX += normalizedDx * repulsionForce * force2Multiplier * proximityMultiplier;
					blob2.velocityY += normalizedDy * repulsionForce * force2Multiplier * proximityMultiplier;

					blob1.lastRepulsionTime = Date.now();
					blob2.lastRepulsionTime = Date.now();
				}
			}
		}
	}

	private updateScreensaverPhysics(
		blob: ConvexBlob,
		deltaTime: number,
		time: number,
		gravity: { x: number; y: number },
		tilt: { x: number; y: number; z: number },
		scrollStickiness: number,
		pullForces: Array<{ strength: number; time: number; randomness: number; explosive: boolean }>
	): void {
		// Calculate mouse distance (mouse remains in 0-100 range)
		blob.mouseDistance = Math.sqrt(
			Math.pow(blob.currentX - this.mouseX, 2) + Math.pow(blob.currentY - this.mouseY, 2)
		);

		// Enhanced territorial movement to prevent center-bias
		this.updateTerritorialMovement(blob, time);

		// **APPLY ACCELEROMETER FORCES** if available (gravity contains tilt data from device motion)
		this.applyAccelerometerForces(blob, gravity, tilt);

		// Bouncing phase - with accelerometer influence
		this.updateMovementWithAccelerometer(blob, time, gravity, tilt);

		// Add escape velocity if recently repulsed
		this.addEscapeVelocity(blob);

		// **ENHANCED ORGANIC DEFORMATION WITH SELF-INTERSECTION PREVENTION**
		this.updateSafeOrganicDeformation(blob, time);

		// Handle scroll interactions (mild)
		if (scrollStickiness > 0.01) {
			this.applyScrollEffect(blob, scrollStickiness);
		}

		// Apply pull forces but with reduced intensity
		pullForces.forEach((force) => {
			if (blob.scrollAffinity > 0.1) {
				const mildForce = force.strength * 0.15; // Reduced for larger blobs
				this.applyMildPullForce(blob, mildForce, force.explosive);
			}
		});

		// Update position with gentle movement
		blob.currentX += blob.velocityX;
		blob.currentY += blob.velocityY;

		// **DRAMATICALLY EXTENDED WALL BOUNCING** - walls are at the dramatically extended boundaries
		this.handleDramaticallyExtendedWallBouncing(blob);

		// Apply gentle friction
		blob.velocityX *= 0.992;
		blob.velocityY *= 0.992;
	}

	private applyAccelerometerForces(
		blob: ConvexBlob,
		gravity: { x: number; y: number },
		tilt: { x: number; y: number; z: number }
	): void {
		// Apply gentle gravitational forces based on device orientation
		const accelerometerStrength = 0.0008; // Gentle influence for larger blobs
		const maxForce = 0.003; // Cap the maximum force

		// Apply gravity forces (inverted for natural feel)
		const gravityX = Math.max(-maxForce, Math.min(maxForce, gravity.x * accelerometerStrength));
		const gravityY = Math.max(-maxForce, Math.min(maxForce, gravity.y * accelerometerStrength));

		blob.velocityX += gravityX;
		blob.velocityY += gravityY;

		// Add subtle shape deformation based on acceleration
		if (blob.controlPoints && (Math.abs(gravity.x) > 0.3 || Math.abs(gravity.y) > 0.3)) {
			const deformationAmount = Math.min(0.08, (Math.abs(gravity.x) + Math.abs(gravity.y)) * 0.02);
			blob.chaosLevel = Math.min((blob.chaosLevel || 0) + deformationAmount, 0.2);
		}
	}

	private updateMovementWithAccelerometer(
		blob: ConvexBlob,
		time: number,
		gravity: { x: number; y: number },
		tilt: { x: number; y: number; z: number }
	): void {
		// Pure random drift for base movement
		const neutralDriftX = (Math.random() - 0.5) * 0.001;
		const neutralDriftY = (Math.random() - 0.5) * 0.001;

		blob.velocityX += neutralDriftX;
		blob.velocityY += neutralDriftY;

		// Very gentle brownian motion
		const brownianTime = time * 0.1 + blob.phase;
		const brownianX = Math.sin(brownianTime + blob.driftAngle!) * 0.0005;
		const brownianY = Math.cos(brownianTime * 1.3 + blob.driftAngle!) * 0.0005;

		blob.velocityX += brownianX;
		blob.velocityY += brownianY;

		// Change drift direction randomly
		if (Math.random() < 0.002) {
			// 0.2% chance per frame
			blob.driftAngle = Math.random() * Math.PI * 2;
		}
	}

	private updateTerritorialMovement(blob: ConvexBlob, time: number): void {
		// Each blob tends to wander around its territory in dramatically extended space
		const territoryX = blob.territoryX || blob.baseX;
		const territoryY = blob.territoryY || blob.baseY;
		const territoryRadius = blob.territoryRadius || 70; // Much larger for dramatically extended space

		// Distance from territory center
		const distanceFromTerritory = Math.sqrt(
			Math.pow(blob.currentX - territoryX, 2) + Math.pow(blob.currentY - territoryY, 2)
		);

		// Very gentle pull back to territory
		if (distanceFromTerritory > territoryRadius) {
			const pullStrength = ((distanceFromTerritory - territoryRadius) / territoryRadius) * 0.0002;
			const angleToTerritory = Math.atan2(territoryY - blob.currentY, territoryX - blob.currentX);

			blob.velocityX += Math.cos(angleToTerritory) * pullStrength;
			blob.velocityY += Math.sin(angleToTerritory) * pullStrength;
		}

		// Completely random drift within territory
		const driftTime = time * 0.15 + blob.phase;
		const randomDriftX = (Math.random() - 0.5) * 0.003;
		const randomDriftY = (Math.random() - 0.5) * 0.003;

		blob.velocityX += randomDriftX;
		blob.velocityY += randomDriftY;

		// Periodic territory relocation to maintain distribution in dramatically extended space
		if (time % 45 < 0.1) {
			// Every 45 seconds
			const randomOffset = 35; // Much larger offset for dramatically extended space
			blob.territoryX = Math.max(
				this.PHYSICS_MIN + 35,
				Math.min(this.PHYSICS_MAX - 35, territoryX + (Math.random() - 0.5) * randomOffset)
			);
			blob.territoryY = Math.max(
				this.PHYSICS_MIN + 35,
				Math.min(this.PHYSICS_MAX - 35, territoryY + (Math.random() - 0.5) * randomOffset)
			);
		}
	}

	private addEscapeVelocity(blob: ConvexBlob): void {
		// Add extra velocity if recently repulsed to help escape clustering
		if (blob.lastRepulsionTime && Date.now() - blob.lastRepulsionTime < 3000) {
			const escapeStrength = 0.01; // Increased escape velocity for much larger blobs
			const escapeAngle = Math.random() * Math.PI * 2;

			blob.velocityX += Math.cos(escapeAngle) * escapeStrength;
			blob.velocityY += Math.sin(escapeAngle) * escapeStrength;
		}
	}

	private updateSafeOrganicDeformation(blob: ConvexBlob, time: number): void {
		if (!blob.controlPoints || !blob.controlVelocities) return;

		blob.controlPoints.forEach((point, i) => {
			// **CONTROLLED ORGANIC PULSING** to prevent self-intersection
			const pulseTime = time * 0.15 + i * 0.4 + blob.phase; // Slower pulsing
			const pulseAmount = Math.sin(pulseTime) * 0.02; // Much smaller pulse amount

			// **ENFORCE MINIMUM AND MAXIMUM RADIUS** to prevent self-intersection
			const minRadius = point.baseRadius * 0.85; // Never shrink below 85% of base
			const maxRadius = point.baseRadius * 1.15; // Never grow above 115% of base

			const targetRadius = point.baseRadius * (1 + pulseAmount);
			point.targetRadius = Math.max(minRadius, Math.min(maxRadius, targetRadius));

			// Smooth radius transition
			const radiusDiff = point.targetRadius - point.radius;
			point.radius += radiusDiff * 0.008; // Slower transition

			// **CONTROLLED ROTATION** to maintain shape integrity

			// @ts-ignore
			blob.controlVelocities[i].angularVelocity += (Math.random() - 0.5) * 0.00003; // Much smaller angular changes
			// @ts-ignore
			blob.controlVelocities[i].angularVelocity *= 0.999;
			// @ts-ignore
			if (blob.controlVelocities) {
				blob.controlVelocities[i].angularVelocity = Math.max(
					-0.0008,
					Math.min(0.0008, blob.controlVelocities[i].angularVelocity)
				);
			} // Clamp angular velocity
			// @ts-ignore
			point.angle += blob.controlVelocities[i].angularVelocity;
		});

		// **SMOOTHING PASS** to ensure adjacent points don't create sharp angles
		this.smoothControlPoints(blob);
	}

	private smoothControlPoints(blob: ConvexBlob): void {
		if (!blob.controlPoints || blob.controlPoints.length < 3) return;

		// Apply smoothing to prevent sharp transitions between adjacent points
		for (let i = 0; i < blob.controlPoints.length; i++) {
			const current = blob.controlPoints[i];
			const prev =
				blob.controlPoints[(i - 1 + blob.controlPoints.length) % blob.controlPoints.length];
			const next = blob.controlPoints[(i + 1) % blob.controlPoints.length];

			// Smooth radius variations
			const avgRadius = (prev.radius + current.radius + next.radius) / 3;
			const smoothingFactor = 0.05; // Gentle smoothing
			current.radius = current.radius * (1 - smoothingFactor) + avgRadius * smoothingFactor;

			// Ensure minimum distance between adjacent points to prevent self-intersection
			const minRadiusDiff = blob.size * 0.1;
			if (Math.abs(current.radius - prev.radius) > minRadiusDiff) {
				const adjustment = (Math.abs(current.radius - prev.radius) - minRadiusDiff) * 0.5;
				if (current.radius > prev.radius) {
					current.radius -= adjustment;
					prev.radius += adjustment;
				} else {
					current.radius += adjustment;
					prev.radius -= adjustment;
				}
			}
		}
	}

	private applyScrollEffect(blob: ConvexBlob, scrollStickiness: number): void {
		// Very mild effect to preserve normal page scrolling
		const attractionStrength = scrollStickiness * blob.scrollAffinity * 0.0002; // Reduced for larger blobs
		blob.velocityX += (this.mouseX - blob.currentX) * attractionStrength;
		blob.velocityY += (this.mouseY - blob.currentY) * attractionStrength;

		// Gentle shape disturbance
		if (scrollStickiness > 0.15) {
			blob.chaosLevel = Math.min((blob.chaosLevel || 0) + scrollStickiness * 0.02, 0.15); // Reduced chaos for stability
		}
	}

	private applyMildPullForce(blob: ConvexBlob, force: number, explosive: boolean): void {
		if (explosive) {
			// Very gentle "explosion" effect with no directional bias
			const explosionForce = force * 0.04; // Reduced for larger blobs
			const randomDirection = Math.random() * Math.PI * 2;

			blob.velocityX += Math.cos(randomDirection) * explosionForce;
			blob.velocityY += Math.sin(randomDirection) * explosionForce;

			blob.chaosLevel = Math.min((blob.chaosLevel || 0) + force * 0.04, 0.2); // Reduced chaos
		} else {
			// Random direction instead of upward pull to eliminate left bias
			const randomAngle = Math.random() * Math.PI * 2;
			blob.velocityX += Math.cos(randomAngle) * force * 0.01; // Reduced for larger blobs
			blob.velocityY += Math.sin(randomAngle) * force * 0.01;
		}
	}

	// **DRAMATICALLY EXTENDED WALL BOUNCING** - handles much larger boundaries for extreme clipping
	private handleDramaticallyExtendedWallBouncing(blob: ConvexBlob): void {
		const margin = blob.size * 0.8; // Reduced margin allows more clipping
		const damping = 0.65;
		const currentTime = Date.now();

		// **DRAMATICALLY EXTENDED PHYSICAL BOUNDARIES** (physics can move far beyond visible area)
		// Left wall - allows dramatic clipping on left side
		if (blob.currentX < this.PHYSICS_MIN + margin) {
			blob.currentX = this.PHYSICS_MIN + margin;
			blob.velocityX = Math.abs(blob.velocityX) * damping;
			this.recordBounce(blob, currentTime);
		}

		// Right wall - allows dramatic clipping on right side
		if (blob.currentX > this.PHYSICS_MAX - margin) {
			blob.currentX = this.PHYSICS_MAX - margin;
			blob.velocityX = -Math.abs(blob.velocityX) * damping;
			this.recordBounce(blob, currentTime);
		}

		// Top wall - less clipping allowed at top/bottom for readability
		if (blob.currentY < this.PHYSICS_MIN + margin * 1.5) {
			blob.currentY = this.PHYSICS_MIN + margin * 1.5;
			blob.velocityY = Math.abs(blob.velocityY) * damping;
			this.recordBounce(blob, currentTime);
		}

		// Bottom wall - less clipping allowed at top/bottom for readability
		if (blob.currentY > this.PHYSICS_MAX - margin * 1.5) {
			blob.currentY = this.PHYSICS_MAX - margin * 1.5;
			blob.velocityY = -Math.abs(blob.velocityY) * damping;
			this.recordBounce(blob, currentTime);
		}
	}

	private recordBounce(blob: ConvexBlob, currentTime: number): void {
		blob.wallBounceCount = (blob.wallBounceCount || 0) + 1;
		blob.lastBounceTime = currentTime;

		// Add enhanced randomness after bounce for better dispersion
		blob.velocityX += (Math.random() - 0.5) * 0.05; // Increased for much larger blobs
		blob.velocityY += (Math.random() - 0.5) * 0.05;

		// Change drift direction after bounce
		blob.driftAngle = Math.random() * Math.PI * 2;

		// Gentle shape disturbance from impact
		if (blob.controlPoints) {
			blob.chaosLevel = Math.min((blob.chaosLevel || 0) + 0.04, 0.15); // Reduced chaos for stability
		}
	}

	public generateSmoothBlobPath(blob: ConvexBlob): string {
		if (!blob.controlPoints || blob.controlPoints.length < 3) {
			// Fallback to circle - use coordinates directly (no scaling)
			const displayX = blob.currentX;
			const displayY = blob.currentY;
			const displaySize = blob.size; // Keep original size

			return `M ${displayX - displaySize},${displayY}
					A ${displaySize},${displaySize} 0 1,1 ${displayX + displaySize},${displayY}
					A ${displaySize},${displaySize} 0 1,1 ${displayX - displaySize},${displayY}`;
		}

		// **GENERATE PATH WITHOUT SIZE SCALING** - coordinates and sizes remain unchanged
		const displayX = blob.currentX;
		const displayY = blob.currentY;

		const points = blob.controlPoints.map((point) => {
			const x = displayX + Math.cos(point.angle) * point.radius;
			const y = displayY + Math.sin(point.angle) * point.radius;
			return { x, y };
		});

		// **CONVEX HULL ALGORITHM** to ensure no self-intersection
		const convexPoints = this.generateConvexHull(points);

		// Create smooth curved path from convex hull
		let path = `M ${convexPoints[0].x},${convexPoints[0].y}`;

		for (let i = 0; i < convexPoints.length; i++) {
			const current = convexPoints[i];
			const next = convexPoints[(i + 1) % convexPoints.length];
			const nextNext = convexPoints[(i + 2) % convexPoints.length];

			// **CONSERVATIVE CONTROL POINTS** for smooth curves without self-intersection
			const cp1x = current.x + (next.x - current.x) * 0.15; // Reduced from 0.25
			const cp1y = current.y + (next.y - current.y) * 0.15;
			const cp2x = next.x - (nextNext.x - current.x) * 0.05; // Reduced from 0.08
			const cp2y = next.y - (nextNext.y - current.y) * 0.05;

			path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
		}

		path += ' Z';
		return path;
	}

	private generateConvexHull(
		points: Array<{ x: number; y: number }>
	): Array<{ x: number; y: number }> {
		if (points.length < 3) return points;

		// Simple gift wrapping algorithm for convex hull
		const hull: Array<{ x: number; y: number }> = [];

		// Find the bottommost point (or leftmost if tie)
		let startPoint = points[0];
		for (const point of points) {
			if (point.y < startPoint.y || (point.y === startPoint.y && point.x < startPoint.x)) {
				startPoint = point;
			}
		}

		let currentPoint = startPoint;
		do {
			hull.push(currentPoint);
			let nextPoint = points[0];

			for (const point of points) {
				if (nextPoint === currentPoint || this.isLeftTurn(currentPoint, nextPoint, point)) {
					nextPoint = point;
				}
			}

			currentPoint = nextPoint;
		} while (currentPoint !== startPoint && hull.length < points.length);

		return hull;
	}

	private isLeftTurn(
		p1: { x: number; y: number },
		p2: { x: number; y: number },
		p3: { x: number; y: number }
	): boolean {
		return (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x) > 0;
	}

	// **RETURN BLOBS WITH ORIGINAL COORDINATES** - no conversion needed for display
	public getBlobs(): ConvexBlob[] {
		return this.blobs; // Return blobs as-is, maintaining original size and positioning
	}
}
