/**
 * executeFxBatchPlan.ts
 * Applies a playback plan from planFxBatchPlayback (Web Audio + confetti side effects).
 */

import { gameAudio } from '../audio/gameAudioInstance.js';
import { fireWinnerConfetti } from './winnerConfetti.js';
import { planFxBatchPlayback } from './planFxBatchPlayback.js';
import type { TrapOverlayPayload } from '../components/TrapCinematicOverlay.js';
import type { ClientFxEvent } from './clientFxTypes.js';

export interface ExecuteFxBatchPlanOptions {
  readonly winConfettiAlreadyFired: boolean;
  readonly isMuted: boolean;
  readonly prefersReducedMotion: boolean;
  readonly onTrapOverlay: (payload: TrapOverlayPayload | null) => void;
  readonly onWinConfettiFired: () => void;
}

export function executeFxBatchPlan(
  batch: readonly ClientFxEvent[],
  options: ExecuteFxBatchPlanOptions,
): void {
  const { plan, winConfettiFired } = planFxBatchPlayback({
    batch,
    winConfettiAlreadyFired: options.winConfettiAlreadyFired,
    isMuted: options.isMuted,
    prefersReducedMotion: options.prefersReducedMotion,
  });

  for (const trapId of plan.trapPlays) {
    gameAudio.playTrap(trapId);
  }

  if (plan.trapOverlay) {
    options.onTrapOverlay(plan.trapOverlay);
  }

  for (const elim of plan.eliminationSounds) {
    globalThis.setTimeout(() => {
      gameAudio.playElimination(elim.cause);
    }, elim.delayMs);
  }

  if (plan.playWin) {
    gameAudio.playWin();
  }

  if (plan.fireConfetti) {
    fireWinnerConfetti();
  }

  if (winConfettiFired && !options.winConfettiAlreadyFired) {
    options.onWinConfettiFired();
  }
}
