











import type { ConvexBlob } from './types.js';

export interface BlobConfig {
	antiClusteringStrength: number;
	bounceDamping: number;
	deformationSpeed: number;
	territoryStrength: number;
	viscosity: number;
}

export interface BlobState {
	x: number;
	y: number;
	velocityX: number;
	velocityY: number;
	size: number;
	color: string;
}



const FLOATS_PER_BLOB = 16;



const FLOATS_PER_GLOW = 6;





export class BlobPhysicsWASM {
	private blobData: Float32Array;
	private glowData: Float32Array;
	private configData: Float32Array;
	private numBlobs: number;
	private svgElements: Map<number, SVGPathElement> = new Map();
	private glowElements: Map<number, HTMLElement> = new Map();
	private initialized: boolean = false;
	private width: number = 100;
	private height: number = 100;
	private animationId: number | null = null;

	constructor(numBlobs: number, config: BlobConfig) {
		this.numBlobs = numBlobs;

		
		
		this.blobData = new Float32Array(numBlobs * FLOATS_PER_BLOB);

		
		this.glowData = new Float32Array(numBlobs * FLOATS_PER_GLOW);

		
		this.configData = new Float32Array([
			config.antiClusteringStrength,
			config.bounceDamping,
			config.deformationSpeed,
			config.territoryStrength,
			config.viscosity
		]);
	}

	


	async init(): Promise<void> {
		if (this.initialized) return;

		
		this.initializeBlobPositions();
		this.initialized = true;
		console.log('[BlobPhysicsWASM] Initialized (TypeScript mode)');
	}

	


	private initializeBlobPositions(): void {
		for (let i = 0; i < this.numBlobs; i++) {
			const offset = i * 32;
			const angle = (i / this.numBlobs) * Math.PI * 2;
			const radius = 35 + Math.random() * 30;

			
			this.blobData[offset + 0] = 50 + Math.cos(angle) * radius;
			this.blobData[offset + 1] = 50 + Math.sin(angle) * radius;

			
			this.blobData[offset + 2] = (Math.random() - 0.5) * 0.06;
			this.blobData[offset + 3] = (Math.random() - 0.5) * 0.06;

			
			this.blobData[offset + 4] = 28 + Math.random() * 18;
		}
	}

	


	tick(dt: number, time: number): void {
		if (!this.initialized) {
			return;
		}

		
		for (let i = 0; i < this.numBlobs; i++) {
			const offset = i * FLOATS_PER_BLOB;

			
			let x = this.blobData[offset + 0];
			let y = this.blobData[offset + 1];
			let vx = this.blobData[offset + 2];
			let vy = this.blobData[offset + 3];
			const size = this.blobData[offset + 4];

			
			const phase = time * 0.5 + i * 0.7;
			vx += Math.sin(phase) * 0.001 * dt;
			vy += Math.cos(phase * 0.7) * 0.001 * dt;

			
			const viscosity = this.configData[4];
			vx *= 1 - viscosity * dt * 0.1;
			vy *= 1 - viscosity * dt * 0.1;

			
			x += vx * dt;
			y += vy * dt;

			
			const margin = size * 0.5;
			const damping = this.configData[1];
			if (x < margin) { x = margin; vx = -vx * damping; }
			if (x > 100 - margin) { x = 100 - margin; vx = -vx * damping; }
			if (y < margin) { y = margin; vy = -vy * damping; }
			if (y > 100 - margin) { y = 100 - margin; vy = -vy * damping; }

			
			this.blobData[offset + 0] = x;
			this.blobData[offset + 1] = y;
			this.blobData[offset + 2] = vx;
			this.blobData[offset + 3] = vy;
			this.blobData[offset + 13] = phase; 
		}

		
		this.updateGlowData(time);

		
		this.updateSVGPaths();

		
		this.updateGlowStyles();
	}

	


	private updateGlowData(time: number): void {
		for (let i = 0; i < this.numBlobs; i++) {
			const offset = i * FLOATS_PER_GLOW;
			const phase = time * 2.0 + i * 0.5;

			
			this.glowData[offset + 0] = 0.6 + 0.2 * Math.sin(phase);
			
			this.glowData[offset + 1] = 15 + 5 * Math.sin(phase * 0.7);
			
			this.glowData[offset + 2] = 128;
			this.glowData[offset + 3] = 100;
			this.glowData[offset + 4] = 200;
			this.glowData[offset + 5] = phase;
		}
	}

	


	private updateSVGPaths(): void {
		for (let i = 0; i < this.numBlobs; i++) {
			const element = this.svgElements.get(i);
			if (!element) continue;

			const offset = i * FLOATS_PER_BLOB;
			const cx = this.blobData[offset + 0];
			const cy = this.blobData[offset + 1];
			const size = this.blobData[offset + 4];
			const phase = this.blobData[offset + 13] || 0;

			
			const path = this.generateBlobPath(cx, cy, size, phase);
			element.setAttribute('d', path);
		}
	}

	


	private generateBlobPath(cx: number, cy: number, size: number, phase: number): string {
		const points: Array<{ x: number; y: number }> = [];
		const numPoints = 8;

		for (let i = 0; i < numPoints; i++) {
			const angle = (i / numPoints) * Math.PI * 2;
			
			const radiusMod = 1.0 + 0.1 * Math.sin(angle * 2 + phase) + 0.05 * Math.cos(angle * 3 - phase);
			const x = cx + Math.cos(angle) * size * radiusMod;
			const y = cy + Math.sin(angle) * size * radiusMod;
			points.push({ x, y });
		}

		
		let path = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
		const smoothing = 0.15;

		for (let i = 0; i < numPoints; i++) {
			const curr = points[i];
			const next = points[(i + 1) % numPoints];
			const nextNext = points[(i + 2) % numPoints];

			const cp1x = curr.x + (next.x - curr.x) * smoothing;
			const cp1y = curr.y + (next.y - curr.y) * smoothing;
			const cp2x = next.x - (nextNext.x - curr.x) * (smoothing * 0.3);
			const cp2y = next.y - (nextNext.y - curr.y) * (smoothing * 0.3);

			path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${next.x.toFixed(2)},${next.y.toFixed(2)}`;
		}

		return path + ' Z';
	}

	


	private updateGlowStyles(): void {
		for (let i = 0; i < this.numBlobs; i++) {
			const element = this.glowElements.get(i);
			if (!element) continue;

			const offset = i * FLOATS_PER_GLOW;
			const intensity = this.glowData[offset + 0];
			const spread = this.glowData[offset + 1];

			element.style.filter = `blur(${spread.toFixed(1)}px) opacity(${intensity.toFixed(2)})`;
		}
	}

	


	setSVGElement(index: number, element: SVGPathElement): void {
		this.svgElements.set(index, element);
	}

	


	setGlowElement(index: number, element: HTMLElement): void {
		this.glowElements.set(index, element);
	}

	


	getBlobState(index: number): BlobState | null {
		if (index < 0 || index >= this.numBlobs) return null;

		const offset = index * FLOATS_PER_BLOB;
		return {
			x: this.blobData[offset + 0],
			y: this.blobData[offset + 1],
			velocityX: this.blobData[offset + 2],
			velocityY: this.blobData[offset + 3],
			size: this.blobData[offset + 4],
			color: '' 
		};
	}

	



	getBlobs(themeColors?: string[]): ConvexBlob[] {
		const blobs: ConvexBlob[] = [];
		for (let i = 0; i < this.numBlobs; i++) {
			const offset = i * FLOATS_PER_BLOB;
			const x = this.blobData[offset + 0];
			const y = this.blobData[offset + 1];
			const size = this.blobData[offset + 4];

			
			const color = themeColors && themeColors.length > 0
				? themeColors[i % themeColors.length]
				: `hsl(${(i * 30) % 360}, 70%, 60%)`;

			blobs.push({
				baseX: x,
				baseY: y,
				currentX: x,
				currentY: y,
				velocityX: this.blobData[offset + 2],
				velocityY: this.blobData[offset + 3],
				size,
				elasticity: 0.7,
				viscosity: 0.3,
				phase: this.blobData[offset + 13], 
				speed: 0.5,
				color,
				gradientId: `blob-gradient-${i}`,
				intensity: 0.7,
				stickiness: 0.2,
				isAttractive: i % 2 === 0,
				mouseDistance: 100,
				isStuck: false,
				radiusVariations: [],
				fluidMass: size * 0.1,
				scrollAffinity: 0.5
			});
		}
		return blobs;
	}

	


	setBlobState(index: number, state: Partial<BlobState>): void {
		if (index < 0 || index >= this.numBlobs) return;

		const offset = index * FLOATS_PER_BLOB;
		if (state.x !== undefined) this.blobData[offset + 0] = state.x;
		if (state.y !== undefined) this.blobData[offset + 1] = state.y;
		if (state.velocityX !== undefined) this.blobData[offset + 2] = state.velocityX;
		if (state.velocityY !== undefined) this.blobData[offset + 3] = state.velocityY;
		if (state.size !== undefined) this.blobData[offset + 4] = state.size;
	}

	


	setViewport(width: number, height: number): void {
		this.width = width;
		this.height = height;
	}

	




	updateMousePosition(_x: number, _y: number): void {
		
	}

	


	dispose(): void {
		if (this.animationId) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}

		this.svgElements.clear();
		this.glowElements.clear();
		this.initialized = false;
	}

	


	isReady(): boolean {
		return this.initialized;
	}
}
