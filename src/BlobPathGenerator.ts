










import type { ConvexBlob } from './types.js';







function extractDeformation(blob: ConvexBlob): Float32Array {
	const deformation = new Float32Array(8);

	if (blob.controlPoints && blob.controlPoints.length >= 8) {
		
		for (let i = 0; i < 8; i++) {
			const cp = blob.controlPoints[i];
			
			deformation[i] = cp.radius / blob.size;
		}
	} else if (blob.radiusVariations && blob.radiusVariations.length >= 8) {
		
		for (let i = 0; i < 8; i++) {
			deformation[i] = blob.radiusVariations[i];
		}
	} else {
		
		const phase = blob.phase || 0;
		for (let i = 0; i < 8; i++) {
			const angle = (i / 8) * Math.PI * 2;
			
			deformation[i] = 1.0 + 0.1 * Math.sin(angle * 2 + phase) + 0.05 * Math.cos(angle * 3 - phase);
		}
	}

	return deformation;
}







export async function generateSmoothBlobPath(blob: ConvexBlob): Promise<string> {
	return generateFallbackPath(blob);
}






export function generateSmoothBlobPathSync(blob: ConvexBlob): string {
	return generateFallbackPath(blob);
}







function generateFallbackPath(blob: ConvexBlob): string {
	const cx = blob.currentX;
	const cy = blob.currentY;
	const r = blob.size;
	const phase = blob.phase || 0;

	
	const points: Array<{ x: number; y: number }> = [];
	for (let i = 0; i < 8; i++) {
		const angle = (i / 8) * Math.PI * 2;
		
		const radiusMod = 1.0 + 0.1 * Math.sin(angle * 2 + phase);
		const x = cx + Math.cos(angle) * r * radiusMod;
		const y = cy + Math.sin(angle) * r * radiusMod;
		points.push({ x, y });
	}

	
	let path = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
	const smoothing = 0.15;

	for (let i = 0; i < 8; i++) {
		const curr = points[i];
		const next = points[(i + 1) % 8];
		const nextNext = points[(i + 2) % 8];

		
		const cp1x = curr.x + (next.x - curr.x) * smoothing;
		const cp1y = curr.y + (next.y - curr.y) * smoothing;
		const cp2x = next.x - (nextNext.x - curr.x) * (smoothing * 0.3);
		const cp2y = next.y - (nextNext.y - curr.y) * (smoothing * 0.3);

		path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${next.x.toFixed(2)},${next.y.toFixed(2)}`;
	}

	path += ' Z';
	return path;
}







export async function generateBlobPathsBatch(blobs: ConvexBlob[]): Promise<string[]> {
	return blobs.map((blob) => generateFallbackPath(blob));
}






export function generateBlobPathsBatchSync(blobs: ConvexBlob[]): string[] {
	return blobs.map((blob) => generateFallbackPath(blob));
}






export async function preInitPathGenerator(): Promise<boolean> {
	return true;
}






export function isWasmReady(): boolean {
	return true;
}
