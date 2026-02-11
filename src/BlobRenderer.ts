/**
 * BlobRenderer - Minimal rendering utilities for blob animations.
 *
 * Note: The original BlobRenderer imported a Svelte component (BlobSVG.svelte).
 * This extracted version provides the renderer interface without the Svelte coupling.
 * For the Svelte component, import BlobSVG.svelte directly from the monorepo.
 */
export class BlobRenderer {
  /**
   * Get the SVG component reference.
   *
   * In the extracted package, this returns null since the Svelte component
   * is not available. Use the monorepo's BlobSVG.svelte directly instead.
   */
  public getSVGComponent(): null {
    return null;
  }
}
