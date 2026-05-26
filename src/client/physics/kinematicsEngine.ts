/**
 * kinematicsEngine.ts
 * Real-time gameplay physics & kinematics engine — Phase 4.2 implementation.
 *
 * Provides decoupled, mathematically precise polynomial interpolation and radial
 * collision detection to animate mansion traps (e.g. falling chandelier) smoothly.
 */

export interface Vector2D {
  readonly x: number;
  readonly y: number;
}

export interface AnimationState {
  readonly startTime:  number;  // Timestamp in ms
  readonly duration:   number;  // Animation lifetime in ms (e.g. 800ms)
  readonly currentPos: Vector2D;
  readonly isImpact:   boolean; // Set true when collision threshold is breached
  readonly isFinished: boolean; // Set true when lifetime bounds are breached
}

/**
 * Resolves uniform gravity acceleration displacement based on the quadratic formula:
 *   y_t = y_0 + 0.5 * g * t^2
 */
export function calculateFallingVector(
  start: Vector2D,
  t: number, // Elapsed time in seconds
  g: number, // Gravity constant (e.g. 980 pixels/s^2)
): Vector2D {
  const displacement = 0.5 * g * t * t;
  return {
    x: start.x,
    y: start.y + displacement,
  };
}

/**
 * Euclidean distance-based bounding circle intersection scanner.
 * Triggers a collision impact flag if distance falls below threshold.
 */
export function checkTrapCollision(
  trapPos: Vector2D,
  pawnPos: Vector2D,
  threshold: number,
): { readonly isImpact: boolean } {
  const dx = trapPos.x - pawnPos.x;
  const dy = trapPos.y - pawnPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return {
    isImpact: distance <= threshold,
  };
}

/**
 * High-frequency frame calculator returning a fresh, immutable AnimationState.
 * Enforces strict 800ms terminal closure boundaries.
 */
export function updateAnimation(
  elapsedTimeMs: number, // Milliseconds since animation started
  state: AnimationState,
  startPos: Vector2D,
  targetPos: Vector2D,
  g: number,
  threshold: number,
): AnimationState {
  // Enforce terminal lifetime boundary check
  if (elapsedTimeMs >= state.duration) {
    return {
      ...state,
      currentPos: targetPos,
      isImpact:   true,
      isFinished: true,
    };
  }

  const t = elapsedTimeMs / 1000; // Convert to seconds for kinematics formulas
  const currentPos = calculateFallingVector(startPos, t, g);

  // Evaluate radial intersection bounds
  const { isImpact } = checkTrapCollision(currentPos, targetPos, threshold);

  return {
    startTime:  state.startTime,
    duration:   state.duration,
    currentPos,
    isImpact:   isImpact || state.isImpact, // Retain true if impact has already triggered
    isFinished: false,
  };
}
