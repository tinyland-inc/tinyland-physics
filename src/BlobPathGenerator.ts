/**
 * BlobPathGenerator - SVG path generation for blob shapes
 *
 * This module provides:
 * 1. SSR-safe path generation for blob shapes
 * 2. Pure TypeScript implementation for SVG paths
 * 3. Both async and sync APIs for flexibility
 *
 * Note: Previously supported WASM acceleration, now uses pure TypeScript.
 */

import type { ConvexBlob } from './types.js';

/**
 * Generate deformation array from ConvexBlob
 *
 * Extracts or calculates 8 deformation factors from blob properties.
 * Deformation factors are multipliers for base radius (0.85-1.15 typical).
 */
function extractDeformation(blob: ConvexBlob): Float32Array {
	const deformation = new Float32Array(8);

	if (blob.controlPoints && blob.controlPoints.length >= 8) {
		// Use control point radii as deformation factors
		for (let i = 0; i < 8; i++) {
			const cp = blob.controlPoints[i];
			// Normalize radius relative to base size
			deformation[i] = cp.radius / blob.size;
		}
	} else if (blob.radiusVariations && blob.radiusVariations.length >= 8) {
		// Use radius variations directly
		for (let i = 0; i < 8; i++) {
			deformation[i] = blob.radiusVariations[i];
		}
	} else {
		// Generate procedural deformation based on phase and position
		const phase = blob.phase || 0;
		for (let i = 0; i < 8; i++) {
			const angle = (i / 8) * Math.PI * 2;
			// Subtle organic variation based on phase
			deformation[i] = 1.0 + 0.1 * Math.sin(angle * 2 + phase) + 0.05 * Math.cos(angle * 3 - phase);
		}
	}

	return deformation;
}

/**
 * Generate SVG path string
 *
 * @param blob - ConvexBlob with position, size, and optional control points
 * @returns SVG path string (e.g., "M x,y C ... Z")
 */
export async function generateSmoothBlobPath(blob: ConvexBlob): Promise<string> {
	return generateFallbackPath(blob);
}

/**
 * Synchronous path generation
 *
 * For use in render loops where async is not desired.
 */
export function generateSmoothBlobPathSync(blob: ConvexBlob): string {
	return generateFallbackPath(blob);
}

/**
 * Fallback path generation for SSR/WASM failure
 *
 * Generates a simple organic blob shape using pure TypeScript.
 * Less performant but ensures component renders.
 */
function generateFallbackPath(blob: ConvexBlob): string {
	const cx = blob.currentX;
	const cy = blob.currentY;
	const r = blob.size;
	const phase = blob.phase || 0;

	// Generate 8 points around circle with slight deformation
	const points: Array<{ x: number; y: number }> = [];
	for (let i = 0; i < 8; i++) {
		const angle = (i / 8) * Math.PI * 2;
		// Simple organic variation
		const radiusMod = 1.0 + 0.1 * Math.sin(angle * 2 + phase);
		const x = cx + Math.cos(angle) * r * radiusMod;
		const y = cy + Math.sin(angle) * r * radiusMod;
		points.push({ x, y });
	}

	// Build path with cubic bezier curves
	let path = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
	const smoothing = 0.15;

	for (let i = 0; i < 8; i++) {
		const curr = points[i];
		const next = points[(i + 1) % 8];
		const nextNext = points[(i + 2) % 8];

		// Simple control point calculation
		const cp1x = curr.x + (next.x - curr.x) * smoothing;
		const cp1y = curr.y + (next.y - curr.y) * smoothing;
		const cp2x = next.x - (nextNext.x - curr.x) * (smoothing * 0.3);
		const cp2y = next.y - (nextNext.y - curr.y) * (smoothing * 0.3);

		path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${next.x.toFixed(2)},${next.y.toFixed(2)}`;
	}

	path += ' Z';
	return path;
}

/**
 * Batch path generation for multiple blobs
 *
 * @param blobs - Array of ConvexBlob objects
 * @returns Array of SVG path strings
 */
export async function generateBlobPathsBatch(blobs: ConvexBlob[]): Promise<string[]> {
	return blobs.map((blob) => generateFallbackPath(blob));
}

/**
 * Synchronous batch path generation
 *
 * For use in render loops.
 */
export function generateBlobPathsBatchSync(blobs: ConvexBlob[]): string[] {
	return blobs.map((blob) => generateFallbackPath(blob));
}

/**
 * Pre-initialize path generator
 *
 * This is a no-op now that WASM is removed, but kept for API compatibility.
 */
export async function preInitPathGenerator(): Promise<boolean> {
	return true;
}

/**
 * Check if path generator is ready
 *
 * Always returns true now that we use pure TypeScript.
 */
export function isWasmReady(): boolean {
	return true;
}
