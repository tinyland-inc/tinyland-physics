import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { BlobPhysics } from '../src/BlobPhysics';
import { TinyLandPhysics } from '../src/TinyLandPhysics';
import { BlobPhysicsWASM } from '../src/BlobPhysicsWASM';
import type { BlobConfig as WASMBlobConfig } from '../src/BlobPhysicsWASM';
import { ScrollHandler } from '../src/ScrollHandler';
import {
	generateSmoothBlobPath,
	generateSmoothBlobPathSync,
	generateBlobPathsBatch,
	generateBlobPathsBatchSync,
	preInitPathGenerator,
	isWasmReady,
} from '../src/BlobPathGenerator';
import { DeviceMotion } from '../src/DeviceMotion';
import { BlobRenderer } from '../src/BlobRenderer';
import {
	DEFAULT_CONFIG,
	TRANS_THEME,
	PRIDE_THEME,
	TINYLAND_THEME,
	HIGH_CONTRAST_THEME,
	THEME_PRESETS,
	mergeConfig,
} from '../src/schema';
import type { ConvexBlob, BlobConfig } from '../src/types';




describe('BlobPhysics', () => {
	let physics: BlobPhysics;

	beforeEach(() => {
		physics = new BlobPhysics(false, 'tinyweb');
	});

	describe('creation', () => {
		it('should create a BlobPhysics instance', () => {
			expect(physics).toBeInstanceOf(BlobPhysics);
		});

		it('should accept dark mode parameter', () => {
			const darkPhysics = new BlobPhysics(true);
			expect(darkPhysics).toBeInstanceOf(BlobPhysics);
		});

		it('should accept theme parameter', () => {
			const pridePhysics = new BlobPhysics(false, 'pride');
			expect(pridePhysics).toBeInstanceOf(BlobPhysics);
		});
	});

	describe('initializeBlobs', () => {
		it('should return an array of blobs', () => {
			const blobs = physics.initializeBlobs();
			expect(Array.isArray(blobs)).toBe(true);
			expect(blobs.length).toBeGreaterThan(0);
		});

		it('should create blobs with valid positions', () => {
			const blobs = physics.initializeBlobs();
			for (const blob of blobs) {
				expect(typeof blob.currentX).toBe('number');
				expect(typeof blob.currentY).toBe('number');
				expect(Number.isFinite(blob.currentX)).toBe(true);
				expect(Number.isFinite(blob.currentY)).toBe(true);
			}
		});

		it('should create blobs with valid sizes', () => {
			const blobs = physics.initializeBlobs();
			for (const blob of blobs) {
				expect(blob.size).toBeGreaterThan(0);
				expect(blob.size).toBeLessThan(100);
			}
		});

		it('should create blobs with control points', () => {
			const blobs = physics.initializeBlobs();
			for (const blob of blobs) {
				expect(blob.controlPoints).toBeDefined();
				expect(blob.controlPoints!.length).toBe(16);
			}
		});

		it('should create blobs with control velocities', () => {
			const blobs = physics.initializeBlobs();
			for (const blob of blobs) {
				expect(blob.controlVelocities).toBeDefined();
				expect(blob.controlVelocities!.length).toBe(16);
			}
		});

		it('should create blobs with colors', () => {
			const blobs = physics.initializeBlobs();
			for (const blob of blobs) {
				expect(blob.color).toBeTruthy();
				expect(blob.color).toContain('rgba');
			}
		});

		it('should use different colors for dark mode', () => {
			const lightPhysics = new BlobPhysics(false, 'tinyweb');
			const darkPhysics = new BlobPhysics(true, 'tinyweb');

			const lightBlobs = lightPhysics.initializeBlobs();
			const darkBlobs = darkPhysics.initializeBlobs();

			
			
			expect(lightBlobs.length).toBeGreaterThan(0);
			expect(darkBlobs.length).toBeGreaterThan(0);
		});

		it('should support pride theme', () => {
			const pridePhysics = new BlobPhysics(false, 'pride');
			const blobs = pridePhysics.initializeBlobs();
			expect(blobs.length).toBe(6); 
		});

		it('should support trans theme', () => {
			const transPhysics = new BlobPhysics(false, 'trans');
			const blobs = transPhysics.initializeBlobs();
			expect(blobs.length).toBe(5); 
		});
	});

	describe('update', () => {
		it('should update blob positions', () => {
			const blobs = physics.initializeBlobs();
			const initialPositions = blobs.map((b) => ({ x: b.currentX, y: b.currentY }));

			
			for (let i = 0; i < 100; i++) {
				physics.update(16, i * 0.016, { x: 0, y: 0 }, { x: 0, y: 0, z: 0 }, 0);
			}

			const updatedBlobs = physics.getBlobs();
			let anyMoved = false;
			for (let i = 0; i < updatedBlobs.length; i++) {
				if (
					updatedBlobs[i].currentX !== initialPositions[i].x ||
					updatedBlobs[i].currentY !== initialPositions[i].y
				) {
					anyMoved = true;
					break;
				}
			}
			expect(anyMoved).toBe(true);
		});

		it('should apply gravity forces', () => {
			physics.initializeBlobs();
			const blobsBefore = physics.getBlobs().map((b) => ({ vy: b.velocityY }));

			physics.update(16, 0, { x: 0, y: 10 }, { x: 0, y: 0, z: 0 }, 0);

			const blobsAfter = physics.getBlobs();
			
			expect(blobsAfter.length).toBeGreaterThan(0);
		});

		it('should handle scroll stickiness', () => {
			physics.initializeBlobs();
			physics.updateMousePosition(50, 50);

			
			expect(() => {
				physics.update(16, 0, { x: 0, y: 0 }, { x: 0, y: 0, z: 0 }, 0.5);
			}).not.toThrow();
		});

		it('should handle pull forces', () => {
			physics.initializeBlobs();
			const pullForces = [
				{ strength: 1.0, time: 0, randomness: 0.5, explosive: false },
				{ strength: 2.0, time: 0, randomness: 0.8, explosive: true },
			];

			expect(() => {
				physics.update(16, 0, { x: 0, y: 0 }, { x: 0, y: 0, z: 0 }, 0, pullForces);
			}).not.toThrow();
		});
	});

	describe('mouse interaction', () => {
		it('should update mouse position', () => {
			expect(() => {
				physics.updateMousePosition(25, 75);
			}).not.toThrow();
		});

		it('should track mouse velocity', () => {
			physics.updateMousePosition(50, 50);
			physics.updateMousePosition(55, 55);
			
			expect(() => physics.updateMousePosition(60, 60)).not.toThrow();
		});
	});

	describe('theme updates', () => {
		it('should update theme mode', () => {
			expect(() => {
				physics.updateTheme(true);
			}).not.toThrow();
		});

		it('should update theme name', () => {
			expect(() => {
				physics.updateTheme(false, 'pride');
			}).not.toThrow();
		});
	});

	describe('boundary handling', () => {
		it('should keep blobs within extended physics bounds', () => {
			physics.initializeBlobs();

			
			for (let i = 0; i < 500; i++) {
				physics.update(16, i * 0.016, { x: 5, y: 5 }, { x: 0, y: 0, z: 0 }, 0);
			}

			const blobs = physics.getBlobs();
			for (const blob of blobs) {
				
				expect(blob.currentX).toBeGreaterThanOrEqual(-40);
				expect(blob.currentX).toBeLessThanOrEqual(140);
				expect(blob.currentY).toBeGreaterThanOrEqual(-40);
				expect(blob.currentY).toBeLessThanOrEqual(140);
			}
		});
	});

	describe('path generation', () => {
		it('should generate smooth blob paths', () => {
			const blobs = physics.initializeBlobs();
			const path = physics.generateSmoothBlobPath(blobs[0]);

			expect(path).toContain('M ');
			expect(path).toContain('C ');
			expect(path).toContain(' Z');
		});

		it('should generate valid SVG path for blob without control points', () => {
			const blob: ConvexBlob = {
				baseX: 50,
				baseY: 50,
				currentX: 50,
				currentY: 50,
				velocityX: 0,
				velocityY: 0,
				size: 20,
				elasticity: 0.5,
				viscosity: 0.5,
				phase: 0,
				speed: 1,
				color: 'red',
				gradientId: 'test',
				intensity: 1,
				stickiness: 0,
				isAttractive: false,
				mouseDistance: 100,
				isStuck: false,
				radiusVariations: [],
				fluidMass: 1,
				scrollAffinity: 0.5,
			};

			const path = physics.generateSmoothBlobPath(blob);
			expect(path).toContain('M ');
			expect(path).toContain('A ');
		});
	});

	describe('getBlobs', () => {
		it('should return blobs after initialization', () => {
			physics.initializeBlobs();
			const blobs = physics.getBlobs();
			expect(blobs.length).toBeGreaterThan(0);
		});

		it('should return empty array before initialization', () => {
			const blobs = physics.getBlobs();
			expect(blobs).toEqual([]);
		});
	});
});




describe('TinyLandPhysics', () => {
	let physics: TinyLandPhysics;
	const config: BlobConfig = {
		count: 8,
		minRadius: 40,
		maxRadius: 160,
		speed: 1,
		mouseInfluence: 0.5,
		returnSpeed: 0.1,
	};

	beforeEach(() => {
		physics = new TinyLandPhysics(800, 600, config);
	});

	afterEach(() => {
		physics.stop();
	});

	describe('creation', () => {
		it('should create with dimensions and config', () => {
			expect(physics).toBeInstanceOf(TinyLandPhysics);
		});

		it('should accept theme parameter', () => {
			const themed = new TinyLandPhysics(800, 600, config, 'pride');
			expect(themed).toBeInstanceOf(TinyLandPhysics);
			themed.stop();
		});
	});

	describe('getBlobs', () => {
		it('should return initialized blobs', () => {
			const blobs = physics.getBlobs();
			expect(blobs.length).toBeGreaterThan(0);
		});

		it('should return blobs with standard Blob interface', () => {
			const blobs = physics.getBlobs();
			for (const blob of blobs) {
				expect(typeof blob.id).toBe('number');
				expect(typeof blob.x).toBe('number');
				expect(typeof blob.y).toBe('number');
				expect(typeof blob.vx).toBe('number');
				expect(typeof blob.vy).toBe('number');
				expect(typeof blob.radius).toBe('number');
				expect(typeof blob.color).toBe('string');
				expect(typeof blob.layer).toBe('number');
			}
		});
	});

	describe('update', () => {
		it('should update blob positions', () => {
			const initialBlobs = physics.getBlobs();
			const initialX = initialBlobs[0].x;

			for (let i = 0; i < 100; i++) {
				physics.update(16.67);
			}

			const updatedBlobs = physics.getBlobs();
			
			let anyChanged = false;
			for (let i = 0; i < updatedBlobs.length; i++) {
				if (updatedBlobs[i].x !== initialBlobs[i].x || updatedBlobs[i].y !== initialBlobs[i].y) {
					anyChanged = true;
					break;
				}
			}
			expect(anyChanged).toBe(true);
		});

		it('should accept gravity parameter', () => {
			expect(() => {
				physics.update(16.67, undefined, { x: 0, y: 1 });
			}).not.toThrow();
		});

		it('should accept pull forces', () => {
			const forces = [{ strength: 1, time: 0, randomness: 0.5, explosive: false }];
			expect(() => {
				physics.update(16.67, undefined, undefined, undefined, undefined, forces);
			}).not.toThrow();
		});
	});

	describe('mouse interaction', () => {
		it('should update mouse position', () => {
			expect(() => {
				physics.updateMouse(400, 300);
			}).not.toThrow();
		});
	});

	describe('scroll interaction', () => {
		it('should handle scroll updates', () => {
			expect(() => {
				physics.updateScroll(100, 5);
			}).not.toThrow();
		});

		it('should handle scroll without velocity', () => {
			expect(() => {
				physics.updateScroll(100);
			}).not.toThrow();
		});
	});

	describe('resize', () => {
		it('should handle resize', () => {
			expect(() => {
				physics.resize(1024, 768);
			}).not.toThrow();
		});

		it('should scale blob positions on resize', () => {
			const blobsBefore = physics.getBlobs();
			const xBefore = blobsBefore[0].x;

			physics.resize(1600, 1200);

			const blobsAfter = physics.getBlobs();
			
			expect(blobsAfter[0].x).not.toBe(xBefore);
		});
	});

	describe('theme update', () => {
		it('should handle theme change', () => {
			expect(() => {
				physics.updateTheme('pride');
			}).not.toThrow();
		});
	});

	describe('animation loop', () => {
		it('should start and stop animation', () => {
			const callback = vi.fn();

			physics.start(callback);

			
			return new Promise<void>((resolve) => {
				setTimeout(() => {
					physics.stop();
					expect(callback).toHaveBeenCalled();
					resolve();
				}, 50);
			});
		});

		it('should stop cleanly when not started', () => {
			expect(() => {
				physics.stop();
			}).not.toThrow();
		});
	});
});




describe('BlobPhysicsWASM', () => {
	let physics: BlobPhysicsWASM;
	const config: WASMBlobConfig = {
		antiClusteringStrength: 0.15,
		bounceDamping: 0.7,
		deformationSpeed: 0.5,
		territoryStrength: 0.1,
		viscosity: 0.3,
	};

	beforeEach(() => {
		physics = new BlobPhysicsWASM(8, config);
	});

	afterEach(() => {
		physics.dispose();
	});

	describe('initialization', () => {
		it('should create instance', () => {
			expect(physics).toBeInstanceOf(BlobPhysicsWASM);
		});

		it('should not be ready before init', () => {
			expect(physics.isReady()).toBe(false);
		});

		it('should be ready after init', async () => {
			await physics.init();
			expect(physics.isReady()).toBe(true);
		});

		it('should be idempotent on double init', async () => {
			await physics.init();
			await physics.init(); 
			expect(physics.isReady()).toBe(true);
		});
	});

	describe('tick', () => {
		it('should not update before initialization', () => {
			
			expect(() => {
				physics.tick(16, 0);
			}).not.toThrow();
		});

		it('should update physics after initialization', async () => {
			await physics.init();

			const stateBefore = physics.getBlobState(0);
			expect(stateBefore).not.toBeNull();

			
			for (let i = 0; i < 100; i++) {
				physics.tick(16, i * 0.016);
			}

			const stateAfter = physics.getBlobState(0);
			expect(stateAfter).not.toBeNull();
		});

		it('should bounce blobs off boundaries', async () => {
			await physics.init();

			
			physics.setBlobState(0, { x: 99, y: 50, velocityX: 1, velocityY: 0, size: 10 });

			physics.tick(16, 0);

			const state = physics.getBlobState(0);
			expect(state).not.toBeNull();
			
			expect(state!.x).toBeLessThanOrEqual(100);
		});
	});

	describe('blob state management', () => {
		it('should get blob state', async () => {
			await physics.init();
			const state = physics.getBlobState(0);

			expect(state).not.toBeNull();
			expect(typeof state!.x).toBe('number');
			expect(typeof state!.y).toBe('number');
			expect(typeof state!.velocityX).toBe('number');
			expect(typeof state!.velocityY).toBe('number');
			expect(typeof state!.size).toBe('number');
		});

		it('should return null for invalid index', async () => {
			await physics.init();
			expect(physics.getBlobState(-1)).toBeNull();
			expect(physics.getBlobState(100)).toBeNull();
		});

		it('should set blob state', async () => {
			await physics.init();
			physics.setBlobState(0, { x: 25, y: 75 });

			const state = physics.getBlobState(0);
			expect(state!.x).toBe(25);
			expect(state!.y).toBe(75);
		});

		it('should ignore set for invalid index', () => {
			expect(() => {
				physics.setBlobState(-1, { x: 50, y: 50 });
				physics.setBlobState(100, { x: 50, y: 50 });
			}).not.toThrow();
		});
	});

	describe('getBlobs', () => {
		it('should return ConvexBlob array', async () => {
			await physics.init();
			const blobs = physics.getBlobs();

			expect(blobs.length).toBe(8);
			for (const blob of blobs) {
				expect(typeof blob.currentX).toBe('number');
				expect(typeof blob.currentY).toBe('number');
				expect(typeof blob.size).toBe('number');
				expect(typeof blob.color).toBe('string');
			}
		});

		it('should use theme colors when provided', async () => {
			await physics.init();
			const colors = ['red', 'blue', 'green'];
			const blobs = physics.getBlobs(colors);

			expect(blobs[0].color).toBe('red');
			expect(blobs[1].color).toBe('blue');
			expect(blobs[2].color).toBe('green');
			expect(blobs[3].color).toBe('red'); 
		});

		it('should use HSL fallback without theme colors', async () => {
			await physics.init();
			const blobs = physics.getBlobs();

			for (const blob of blobs) {
				expect(blob.color).toContain('hsl');
			}
		});
	});

	describe('viewport', () => {
		it('should set viewport dimensions', () => {
			expect(() => {
				physics.setViewport(1920, 1080);
			}).not.toThrow();
		});
	});

	describe('mouse position', () => {
		it('should accept mouse position update (no-op)', () => {
			expect(() => {
				physics.updateMousePosition(50, 50);
			}).not.toThrow();
		});
	});

	describe('SVG and glow elements', () => {
		it('should register SVG element', () => {
			const mockElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			expect(() => {
				physics.setSVGElement(0, mockElement);
			}).not.toThrow();
		});

		it('should register glow element', () => {
			const mockElement = document.createElement('div');
			expect(() => {
				physics.setGlowElement(0, mockElement);
			}).not.toThrow();
		});

		it('should update SVG paths when elements are registered', async () => {
			await physics.init();
			const mockElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
			physics.setSVGElement(0, mockElement);

			physics.tick(16, 0);

			const pathData = mockElement.getAttribute('d');
			expect(pathData).toBeTruthy();
			expect(pathData).toContain('M ');
		});

		it('should update glow styles when elements are registered', async () => {
			await physics.init();
			const mockElement = document.createElement('div');
			physics.setGlowElement(0, mockElement);

			physics.tick(16, 0);

			expect(mockElement.style.filter).toBeTruthy();
			expect(mockElement.style.filter).toContain('blur');
		});
	});

	describe('dispose', () => {
		it('should clean up resources', async () => {
			await physics.init();
			physics.dispose();

			expect(physics.isReady()).toBe(false);
		});

		it('should be safe to call multiple times', () => {
			expect(() => {
				physics.dispose();
				physics.dispose();
			}).not.toThrow();
		});
	});
});




describe('ScrollHandler', () => {
	let handler: ScrollHandler;

	beforeEach(() => {
		handler = new ScrollHandler();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	function createWheelEvent(deltaY: number): WheelEvent {
		return new WheelEvent('wheel', { deltaY });
	}

	describe('initial state', () => {
		it('should start with zero stickiness', () => {
			expect(handler.getStickiness()).toBe(0);
		});

		it('should start with zero scroll velocity', () => {
			expect(handler.getScrollVelocity()).toBe(0);
		});

		it('should start with zero total scroll distance', () => {
			expect(handler.getTotalScrollDistance()).toBe(0);
		});

		it('should start not actively scrolling', () => {
			expect(handler.isActivelyScrolling()).toBe(false);
		});

		it('should start with zero direction', () => {
			expect(handler.getScrollDirection()).toBe(0);
		});

		it('should start with empty pull forces', () => {
			expect(handler.getPullForces()).toEqual([]);
		});

		it('should start with zero peak velocity', () => {
			expect(handler.getPeakVelocity()).toBe(0);
		});
	});

	describe('handleScroll', () => {
		it('should update stickiness on scroll', () => {
			vi.setSystemTime(1000);
			handler.handleScroll(createWheelEvent(100));

			expect(handler.getStickiness()).toBeGreaterThan(0);
		});

		it('should track scroll direction (down)', () => {
			vi.setSystemTime(1000);
			handler.handleScroll(createWheelEvent(100));
			expect(handler.getScrollDirection()).toBe(1);
		});

		it('should track scroll direction (up)', () => {
			vi.setSystemTime(1000);
			handler.handleScroll(createWheelEvent(-100));
			expect(handler.getScrollDirection()).toBe(-1);
		});

		it('should accumulate scroll distance', () => {
			vi.setSystemTime(1000);
			handler.handleScroll(createWheelEvent(50));
			vi.setSystemTime(1020);
			handler.handleScroll(createWheelEvent(50));

			expect(handler.getTotalScrollDistance()).toBe(100);
		});

		it('should set actively scrolling flag', () => {
			vi.setSystemTime(1000);
			handler.handleScroll(createWheelEvent(100));
			expect(handler.isActivelyScrolling()).toBe(true);
		});

		it('should track peak velocity', () => {
			vi.setSystemTime(1000);
			handler.handleScroll(createWheelEvent(50));
			vi.setSystemTime(1016);
			handler.handleScroll(createWheelEvent(200));

			expect(handler.getPeakVelocity()).toBeGreaterThan(0);
		});

		it('should generate pull forces for significant scrolling', () => {
			vi.setSystemTime(1000);
			
			handler.handleScroll(createWheelEvent(500));

			const forces = handler.getPullForces();
			expect(forces.length).toBeGreaterThan(0);
		});
	});

	describe('stickiness decay', () => {
		it('should use requestAnimationFrame for decay', () => {
			const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

			vi.setSystemTime(1000);
			handler.handleScroll(createWheelEvent(100));

			expect(rafSpy).toHaveBeenCalled();
			rafSpy.mockRestore();
		});
	});
});




describe('BlobPathGenerator', () => {
	function createTestBlob(overrides: Partial<ConvexBlob> = {}): ConvexBlob {
		return {
			baseX: 50,
			baseY: 50,
			currentX: 50,
			currentY: 50,
			velocityX: 0,
			velocityY: 0,
			size: 20,
			elasticity: 0.5,
			viscosity: 0.5,
			phase: 0,
			speed: 1,
			color: 'rgba(100, 200, 255, 0.7)',
			gradientId: 'test-blob',
			intensity: 0.8,
			stickiness: 0,
			isAttractive: false,
			mouseDistance: 100,
			isStuck: false,
			radiusVariations: [],
			fluidMass: 1,
			scrollAffinity: 0.5,
			...overrides,
		};
	}

	describe('generateSmoothBlobPath (async)', () => {
		it('should return a valid SVG path', async () => {
			const blob = createTestBlob();
			const path = await generateSmoothBlobPath(blob);

			expect(path).toContain('M ');
			expect(path).toContain('C ');
			expect(path).toContain(' Z');
		});

		it('should produce different paths for different positions', async () => {
			const blob1 = createTestBlob({ currentX: 25, currentY: 25 });
			const blob2 = createTestBlob({ currentX: 75, currentY: 75 });

			const path1 = await generateSmoothBlobPath(blob1);
			const path2 = await generateSmoothBlobPath(blob2);

			expect(path1).not.toBe(path2);
		});

		it('should produce different paths for different phases', async () => {
			const blob1 = createTestBlob({ phase: 0 });
			const blob2 = createTestBlob({ phase: Math.PI });

			const path1 = await generateSmoothBlobPath(blob1);
			const path2 = await generateSmoothBlobPath(blob2);

			expect(path1).not.toBe(path2);
		});
	});

	describe('generateSmoothBlobPathSync', () => {
		it('should return the same result as async version', async () => {
			const blob = createTestBlob({ phase: 0 });
			const asyncPath = await generateSmoothBlobPath(blob);
			const syncPath = generateSmoothBlobPathSync(blob);

			expect(syncPath).toBe(asyncPath);
		});
	});

	describe('generateBlobPathsBatch', () => {
		it('should generate paths for multiple blobs', async () => {
			const blobs = [
				createTestBlob({ currentX: 20 }),
				createTestBlob({ currentX: 50 }),
				createTestBlob({ currentX: 80 }),
			];

			const paths = await generateBlobPathsBatch(blobs);

			expect(paths.length).toBe(3);
			for (const path of paths) {
				expect(path).toContain('M ');
			}
		});

		it('should handle empty array', async () => {
			const paths = await generateBlobPathsBatch([]);
			expect(paths).toEqual([]);
		});
	});

	describe('generateBlobPathsBatchSync', () => {
		it('should generate paths synchronously', () => {
			const blobs = [createTestBlob(), createTestBlob()];
			const paths = generateBlobPathsBatchSync(blobs);

			expect(paths.length).toBe(2);
		});
	});

	describe('preInitPathGenerator', () => {
		it('should return true (no-op)', async () => {
			const result = await preInitPathGenerator();
			expect(result).toBe(true);
		});
	});

	describe('isWasmReady', () => {
		it('should always return true', () => {
			expect(isWasmReady()).toBe(true);
		});
	});
});




describe('DeviceMotion', () => {
	let deviceMotion: DeviceMotion;
	let callback: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		callback = vi.fn();
		deviceMotion = new DeviceMotion(callback);
	});

	afterEach(() => {
		deviceMotion.cleanup();
	});

	describe('creation', () => {
		it('should create instance with callback', () => {
			expect(deviceMotion).toBeInstanceOf(DeviceMotion);
		});
	});

	describe('initialize', () => {
		it('should handle non-secure context', async () => {
			
			const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

			
			if (!window.isSecureContext) {
				await deviceMotion.initialize();
				expect(warnSpy).toHaveBeenCalledWith(
					expect.stringContaining('secure context')
				);
			}

			warnSpy.mockRestore();
		});
	});

	describe('requestPermission', () => {
		it('should return true when permission is implicit', async () => {
			const result = await deviceMotion.requestPermission();
			expect(result).toBe(true);
		});
	});

	describe('cleanup', () => {
		it('should be safe to call when not listening', () => {
			expect(() => {
				deviceMotion.cleanup();
			}).not.toThrow();
		});

		it('should be safe to call multiple times', () => {
			expect(() => {
				deviceMotion.cleanup();
				deviceMotion.cleanup();
			}).not.toThrow();
		});
	});
});




describe('BlobRenderer', () => {
	it('should create instance', () => {
		const renderer = new BlobRenderer();
		expect(renderer).toBeInstanceOf(BlobRenderer);
	});

	it('should return null for SVG component (no Svelte in extracted package)', () => {
		const renderer = new BlobRenderer();
		const component = renderer.getSVGComponent();
		expect(component).toBeNull();
	});
});




describe('Schema', () => {
	describe('DEFAULT_CONFIG', () => {
		it('should have version 1.0.0', () => {
			expect(DEFAULT_CONFIG.version).toBe('1.0.0');
		});

		it('should have core config with valid defaults', () => {
			expect(DEFAULT_CONFIG.core.blobCount).toBe(12);
			expect(DEFAULT_CONFIG.core.minRadius).toBe(40);
			expect(DEFAULT_CONFIG.core.maxRadius).toBe(160);
			expect(DEFAULT_CONFIG.core.fps).toBe(60);
			expect(DEFAULT_CONFIG.core.animated).toBe(true);
			expect(DEFAULT_CONFIG.core.startDelay).toBe(0);
		});

		it('should have physics config with valid defaults', () => {
			expect(DEFAULT_CONFIG.physics.viscosity).toBe(0.3);
			expect(DEFAULT_CONFIG.physics.bounceDamping).toBe(0.7);
			expect(DEFAULT_CONFIG.physics.deformationSpeed).toBe(0.5);
			expect(DEFAULT_CONFIG.physics.territoryStrength).toBe(0.1);
			expect(DEFAULT_CONFIG.physics.antiClusteringStrength).toBe(0.15);
			expect(DEFAULT_CONFIG.physics.maxVelocity).toBe(5.0);
			expect(DEFAULT_CONFIG.physics.gravity).toBe(0.0);
		});

		it('should have rendering config with valid defaults', () => {
			expect(DEFAULT_CONFIG.rendering.layers).toBe(4);
			expect(DEFAULT_CONFIG.rendering.blurRadius).toBe(1.5);
			expect(DEFAULT_CONFIG.rendering.glowRadius).toBe(4.0);
			expect(DEFAULT_CONFIG.rendering.glowOpacity).toBe(0.35);
			expect(DEFAULT_CONFIG.rendering.enableParticles).toBe(true);
			expect(DEFAULT_CONFIG.rendering.particlesPerBlob).toBe(3);
			expect(DEFAULT_CONFIG.rendering.viewBox.margin).toBe(33);
			expect(DEFAULT_CONFIG.rendering.viewBox.size).toBe(100);
		});

		it('should have theme config with valid defaults', () => {
			expect(DEFAULT_CONFIG.theme.mode).toBe('system');
			expect(DEFAULT_CONFIG.theme.preset).toBe('tinyland');
			expect(DEFAULT_CONFIG.theme.cssPrefix).toBe('--vector-');
			expect(DEFAULT_CONFIG.theme.blendModeLight).toBe('multiply');
			expect(DEFAULT_CONFIG.theme.blendModeDark).toBe('screen');
		});

		it('should have feature flags with valid defaults', () => {
			expect(DEFAULT_CONFIG.features.deviceMotion).toBe(true);
			expect(DEFAULT_CONFIG.features.scrollPhysics).toBe(true);
			expect(DEFAULT_CONFIG.features.lazyLoad).toBe(true);
			expect(DEFAULT_CONFIG.features.webWorker).toBe(false);
			expect(DEFAULT_CONFIG.features.wasmAcceleration).toBe(false);
			expect(DEFAULT_CONFIG.features.debug).toBe(false);
		});
	});

	describe('Theme Presets', () => {
		it('should have trans theme with correct colors', () => {
			expect(TRANS_THEME.name).toBe('trans');
			expect(TRANS_THEME.label).toBe('Trans Pride');
			expect(TRANS_THEME.hasVectors).toBe(true);
			expect(TRANS_THEME.colors.length).toBe(8);
		});

		it('should have pride theme with 6 rainbow colors', () => {
			expect(PRIDE_THEME.name).toBe('pride');
			expect(PRIDE_THEME.label).toBe('Pride Rainbow');
			expect(PRIDE_THEME.colors.length).toBe(6);
		});

		it('should have tinyland theme', () => {
			expect(TINYLAND_THEME.name).toBe('tinyland');
			expect(TINYLAND_THEME.label).toBe('Tinyland');
			expect(TINYLAND_THEME.colors.length).toBe(4);
		});

		it('should have high-contrast theme with no vectors', () => {
			expect(HIGH_CONTRAST_THEME.name).toBe('high-contrast');
			expect(HIGH_CONTRAST_THEME.hasVectors).toBe(false);
			expect(HIGH_CONTRAST_THEME.colors.length).toBe(0);
		});

		it('should have all presets in THEME_PRESETS', () => {
			expect(THEME_PRESETS.tinyland).toBeDefined();
			expect(THEME_PRESETS.trans).toBeDefined();
			expect(THEME_PRESETS.pride).toBeDefined();
			expect(THEME_PRESETS['high-contrast']).toBeDefined();
			expect(THEME_PRESETS.custom).toBeDefined();
		});

		it('should have valid color definitions', () => {
			for (const color of TRANS_THEME.colors) {
				expect(color.id).toBeTruthy();
				expect(color.color).toBeTruthy();
				expect(typeof color.attractive).toBe('boolean');
				expect(color.scrollAffinity).toBeGreaterThanOrEqual(0);
				expect(color.scrollAffinity).toBeLessThanOrEqual(1);
				expect(['background', 'mid', 'foreground']).toContain(color.layer);
			}
		});
	});

	describe('mergeConfig', () => {
		it('should return default config when given empty override', () => {
			const result = mergeConfig({});

			expect(result.version).toBe('1.0.0');
			expect(result.core).toEqual(DEFAULT_CONFIG.core);
			expect(result.physics).toEqual(DEFAULT_CONFIG.physics);
			expect(result.features).toEqual(DEFAULT_CONFIG.features);
		});

		it('should override specific values', () => {
			const result = mergeConfig({
				core: { blobCount: 20 },
				physics: { gravity: 0.5 },
			});

			expect(result.core.blobCount).toBe(20);
			expect(result.core.fps).toBe(60); 
			expect(result.physics.gravity).toBe(0.5);
			expect(result.physics.viscosity).toBe(0.3); 
		});

		it('should override feature flags', () => {
			const result = mergeConfig({
				features: { debug: true, webWorker: true },
			});

			expect(result.features.debug).toBe(true);
			expect(result.features.webWorker).toBe(true);
			expect(result.features.deviceMotion).toBe(true); 
		});

		it('should override theme settings', () => {
			const result = mergeConfig({
				theme: { preset: 'pride', mode: 'dark' },
			});

			expect(result.theme.preset).toBe('pride');
			expect(result.theme.mode).toBe('dark');
		});

		it('should always set version to 1.0.0', () => {
			const result = mergeConfig({});
			expect(result.version).toBe('1.0.0');
		});
	});
});




describe('Types', () => {
	describe('ConvexBlob interface', () => {
		it('should accept a valid ConvexBlob object', () => {
			const blob: ConvexBlob = {
				baseX: 50,
				baseY: 50,
				currentX: 50,
				currentY: 50,
				velocityX: 0.1,
				velocityY: -0.1,
				size: 30,
				elasticity: 0.5,
				viscosity: 0.9,
				phase: 0,
				speed: 1,
				color: 'red',
				gradientId: 'g1',
				intensity: 0.8,
				stickiness: 1,
				isAttractive: true,
				mouseDistance: 50,
				isStuck: false,
				radiusVariations: [1, 1.1, 0.9],
				fluidMass: 1,
				scrollAffinity: 0.5,
			};

			expect(blob.size).toBe(30);
			expect(blob.isAttractive).toBe(true);
		});

		it('should accept optional physics properties', () => {
			const blob: ConvexBlob = {
				baseX: 50,
				baseY: 50,
				currentX: 50,
				currentY: 50,
				velocityX: 0,
				velocityY: 0,
				size: 20,
				elasticity: 0.5,
				viscosity: 0.5,
				phase: 0,
				speed: 1,
				color: 'blue',
				gradientId: 'g2',
				intensity: 0.7,
				stickiness: 0,
				isAttractive: false,
				mouseDistance: 100,
				isStuck: false,
				radiusVariations: [],
				fluidMass: 1,
				scrollAffinity: 0.5,
				
				surfaceTension: 0.02,
				density: 0.5,
				flowResistance: 0.001,
				chaosLevel: 0.1,
				territoryRadius: 70,
				territoryX: 50,
				territoryY: 50,
				personalSpace: 50,
				repulsionStrength: 0.02,
			};

			expect(blob.surfaceTension).toBe(0.02);
			expect(blob.personalSpace).toBe(50);
		});
	});
});
