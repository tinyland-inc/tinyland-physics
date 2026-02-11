export class ScrollHandler {
  private stickiness = 0;
  private lastScrollTime = 0;
  private scrollVelocity = 0;
  private decayRate = 0.92;
  private totalScrollDistance = 0;
  private scrollStartTime = 0;
  private isScrolling = false;
  private scrollDirection = 0; // -1 for up, 1 for down
  private pullForces: Array<{
    strength: number;
    time: number;
    randomness: number;
    explosive: boolean;
  }> = [];
  private peakVelocity = 0;

  public handleScroll(event: WheelEvent): void {
    const currentTime = Date.now();
    const deltaTime = currentTime - this.lastScrollTime;

    // Track scroll direction
    this.scrollDirection = event.deltaY > 0 ? 1 : -1;

    // Initialize scroll session if needed
    if (!this.isScrolling || deltaTime > 200) {
      this.isScrolling = true;
      this.scrollStartTime = currentTime;
      this.totalScrollDistance = 0;
      this.peakVelocity = 0;
    }

    // Accumulate scroll distance
    this.totalScrollDistance += Math.abs(event.deltaY);

    // Calculate scroll speed (pixels per millisecond)
    const scrollSpeed = Math.abs(event.deltaY) / Math.max(deltaTime, 16);

    // Track peak velocity for explosive effects
    this.peakVelocity = Math.max(this.peakVelocity, scrollSpeed);

    // Update scroll velocity with smoothing
    this.scrollVelocity = this.scrollVelocity * 0.7 + scrollSpeed * 0.3;

    // **DRAMATICALLY ENHANCED STICKINESS CALCULATION**
    // Base stickiness from speed (much more sensitive)
    const speedStickiness = Math.min(this.scrollVelocity / 1.5, 2); // Reduced divisor from 3 to 1.5, increased max to 2

    // Distance-based stickiness for long scrolls (more aggressive)
    const scrollDuration = currentTime - this.scrollStartTime;
    const distanceStickiness = Math.min(this.totalScrollDistance / 400, 2.5); // Reduced threshold from 800 to 400, increased max to 2.5

    // **EXPLOSIVE FORCE CALCULATION** for combined fast + long scrolls
    const explosiveThreshold = speedStickiness * distanceStickiness;
    const isExplosive =
      explosiveThreshold > 2.0 || (speedStickiness > 1.2 && distanceStickiness > 1.0);

    // Combine speed and distance factors with exponential scaling
    let targetStickiness = Math.max(speedStickiness, distanceStickiness * 0.9);
    if (isExplosive) {
      targetStickiness = Math.min(targetStickiness * 1.8, 4.0); // Explosive multiplier
    }

    this.stickiness = Math.max(this.stickiness, targetStickiness);

    // **ENHANCED PULL FORCE GENERATION** with explosive effects
    // Much lower thresholds for activation
    if (speedStickiness > 0.3 || distanceStickiness > 0.3 || isExplosive) {
      this.generatePullForce(
        speedStickiness,
        distanceStickiness,
        this.scrollDirection,
        isExplosive
      );
    }

    this.lastScrollTime = currentTime;

    // Start decay timer
    this.startDecay();

    // End scroll session after inactivity
    setTimeout(() => {
      if (currentTime - this.lastScrollTime >= 200) {
        this.isScrolling = false;
        this.totalScrollDistance = 0;
        this.peakVelocity = 0;
      }
    }, 200);
  }

  private generatePullForce(
    speedStickiness: number,
    distanceStickiness: number,
    direction: number,
    explosive: boolean
  ): void {
    // **MUCH MORE AGGRESSIVE PULL FORCE GENERATION**
    // Generate forces for almost any significant scrolling
    if (direction <= 0 || speedStickiness > 0.4 || distanceStickiness > 0.4 || explosive) {
      let pullStrength = speedStickiness + distanceStickiness * 0.7;

      // **EXPLOSIVE FORCE MULTIPLIER** for dramatic tossing
      if (explosive) {
        pullStrength = Math.min(pullStrength * 2.5, 8.0); // Massive strength boost
      } else {
        pullStrength = Math.min(pullStrength, 3.0); // Increased normal max from 1.5 to 3.0
      }

      // **ENHANCED RANDOMNESS** for more chaotic movement
      const randomnessFactor = explosive
        ? 0.6 + Math.random() * 0.4 // 60-100% randomness for explosive
        : 0.4 + Math.random() * 0.5; // 40-90% randomness for normal

      this.pullForces.push({
        strength: pullStrength,
        time: 0,
        randomness: randomnessFactor,
        explosive: explosive
      });

      // **INCREASED SIMULTANEOUS FORCES** for more chaos
      if (this.pullForces.length > (explosive ? 10 : 8)) {
        this.pullForces.shift();
      }
    }
  }

  private startDecay(): void {
    const decay = () => {
      this.stickiness *= this.decayRate;
      this.scrollVelocity *= this.decayRate;

      // Update pull forces with different decay rates
      this.pullForces = this.pullForces
        .filter((force) => {
          force.time += 0.016; // ~60fps
          // **LONGER DURATION FOR EXPLOSIVE FORCES**
          const maxDuration = force.explosive ? 3.5 : 2.0; // Explosive forces last longer
          return force.time < maxDuration;
        })
        .map((force) => ({
          ...force,
          // **SLOWER DECAY FOR EXPLOSIVE FORCES**
          strength: force.strength * (force.explosive ? 0.995 : 0.98)
        }));

      if (this.stickiness > 0.01 || this.pullForces.length > 0) {
        requestAnimationFrame(decay);
      } else {
        this.stickiness = 0;
        this.scrollVelocity = 0;
      }
    };
    requestAnimationFrame(decay);
  }

  public getStickiness(): number {
    return this.stickiness;
  }

  public getScrollVelocity(): number {
    return this.scrollVelocity;
  }

  public getTotalScrollDistance(): number {
    return this.totalScrollDistance;
  }

  public getPullForces(): Array<{
    strength: number;
    time: number;
    randomness: number;
    explosive: boolean;
  }> {
    return this.pullForces;
  }

  public getScrollDirection(): number {
    return this.scrollDirection;
  }

  public isActivelyScrolling(): boolean {
    return this.isScrolling;
  }

  public getPeakVelocity(): number {
    return this.peakVelocity;
  }
}
