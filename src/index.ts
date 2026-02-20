/**
 * @tummycrypt/tinyland-physics
 *
 * Physics simulation engines for blob animations, scroll handling, and device motion.
 *
 * @packageDocumentation
 */

// Core physics engines
export { BlobPhysics } from './BlobPhysics.js';
export { TinyLandPhysics } from './TinyLandPhysics.js';
export { BlobPhysicsWASM } from './BlobPhysicsWASM.js';
export type { BlobConfig as WASMBlobConfig, BlobState } from './BlobPhysicsWASM.js';

// Input handlers
export { ScrollHandler } from './ScrollHandler.js';
export { DeviceMotion } from './DeviceMotion.js';

// Path generation
export {
	generateSmoothBlobPath,
	generateSmoothBlobPathSync,
	generateBlobPathsBatch,
	generateBlobPathsBatchSync,
	preInitPathGenerator,
	isWasmReady,
} from './BlobPathGenerator.js';

// Renderer
export { BlobRenderer } from './BlobRenderer.js';

// Types (from types.ts)
export type {
	Blob,
	BlobConfig,
	ConvexBlob,
	ColorDefinition,
	DeviceMotionData,
	ScrollData,
	VectorProps,
} from './types.js';

// Schema (from schema.ts)
export type {
	TinyVectorsConfig,
	CoreConfig,
	PhysicsConfig,
	RenderingConfig,
	ThemeConfig,
	FeatureFlags,
	ThemePresetName,
	BlendMode,
	ThemeColor,
	ThemePreset,
	BlobCore,
	RenderBlob,
	PhysicsBlob,
	ControlPoint,
	ControlPointVelocity,
	PointerData,
	TinyVectorsEventType,
	TinyVectorsEventHandler,
	TinyVectorsEvent,
	FrameEventData,
	ThemeChangeEventData,
	DeepPartial,
	TinyVectorsConfigOverride,
} from './schema.js';

export {
	DEFAULT_CONFIG,
	TRANS_THEME,
	PRIDE_THEME,
	TINYLAND_THEME,
	HIGH_CONTRAST_THEME,
	THEME_PRESETS,
	mergeConfig,
} from './schema.js';

// Re-export DeviceMotionData and ScrollData from schema as well
// (schema has extended versions with extra fields)
export type {
	DeviceMotionData as SchemaDeviceMotionData,
	ScrollData as SchemaScrollData,
} from './schema.js';
