/**
 * kinematicsEngine.spec.ts
 * 3 unit tests verifying real-time gameplay physics, gravity acceleration, and collision bounds.
 *
 * Tests cover:
 *   1. Gravity parity (calculateFallingVector displacement matches physical law)
 *   2. Envelope breach (colliding paths flip isImpact flag true)
 *   3. Terminal closure (elapsed time >= 800ms exits loops cleanly)
 */

import { describe, it, expect } from 'vitest';
import {
  calculateFallingVector,
  checkTrapCollision,
  updateAnimation,
  type AnimationState,
  type Vector2D,
} from '../../client/physics/kinematicsEngine.js';

describe('Gameplay Physics & Kinematics Engine', () => {
  const START_POS: Vector2D = { x: 100, y: 10 };
  const TARGET_POS: Vector2D = { x: 100, y: 200 };
  const GRAVITY = 980; // 980 pixels/s^2
  const THRESHOLD = 10; // Bounding radius in pixels

  // ── Assertion 1 (Gravity Parity) ──────────────────────────────────────────

  it('calculates absolute displacement matching quadratic gravity acceleration', () => {
    // Test for t = 0s -> displacement = 0
    const pos0 = calculateFallingVector(START_POS, 0, GRAVITY);
    expect(pos0.x).toBe(100);
    expect(pos0.y).toBe(10);

    // Test for t = 0.5s -> displacement = 0.5 * 980 * 0.5^2 = 122.5
    const pos1 = calculateFallingVector(START_POS, 0.5, GRAVITY);
    expect(pos1.x).toBe(100);
    expect(pos1.y).toBe(132.5); // 10 + 122.5

    // Test for t = 1.0s -> displacement = 0.5 * 980 * 1.0^2 = 490
    const pos2 = calculateFallingVector(START_POS, 1.0, GRAVITY);
    expect(pos2.x).toBe(100);
    expect(pos2.y).toBe(500); // 10 + 490
  });

  // ── Assertion 2 (Envelope Breach) ──────────────────────────────────────────

  it('successfully flags isImpact true when trap passes within the bounding threshold of a pawn', () => {
    // Case A: Trap far away -> no collision
    const farPos: Vector2D = { x: 100, y: 50 };
    const check1 = checkTrapCollision(farPos, TARGET_POS, THRESHOLD);
    expect(check1.isImpact).toBe(false);

    // Case B: Trap inside bounding diameter threshold -> collision triggers screenshake
    const closePos: Vector2D = { x: 100, y: 195 }; // Distance = 5 <= 10
    const check2 = checkTrapCollision(closePos, TARGET_POS, THRESHOLD);
    expect(check2.isImpact).toBe(true);

    // Case C: Trap on top of target -> exact intersection
    const exactPos: Vector2D = { x: 100, y: 200 };
    const check3 = checkTrapCollision(exactPos, TARGET_POS, THRESHOLD);
    expect(check3.isImpact).toBe(true);
  });

  // ── Assertion 3 (Terminal Closure) ────────────────────────────────────────

  it('exits cleanly and returns isFinished true when runtime reaches or exceeds 800ms boundary', () => {
    const initialState: AnimationState = {
      startTime:  0,
      duration:   800, // 800ms terminal limit
      currentPos: START_POS,
      isImpact:   false,
      isFinished: false,
    };

    // Frame A: elapsed = 200ms -> active and falling
    const state1 = updateAnimation(200, initialState, START_POS, TARGET_POS, GRAVITY, THRESHOLD);
    expect(state1.isFinished).toBe(false);
    expect(state1.currentPos.y).toBeGreaterThan(10);
    expect(state1.currentPos.y).toBeLessThan(200);

    // Frame B: elapsed = 800ms -> matches terminal duration threshold -> shuts down loop
    const state2 = updateAnimation(800, initialState, START_POS, TARGET_POS, GRAVITY, THRESHOLD);
    expect(state2.isFinished).toBe(true);
    expect(state2.currentPos).toEqual(TARGET_POS);
    expect(state2.isImpact).toBe(true);

    // Frame C: elapsed = 1000ms -> past bounds check -> stays finished
    const state3 = updateAnimation(1000, initialState, START_POS, TARGET_POS, GRAVITY, THRESHOLD);
    expect(state3.isFinished).toBe(true);
    expect(state3.currentPos).toEqual(TARGET_POS);
  });
});
