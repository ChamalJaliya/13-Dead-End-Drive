/**
 * planFxBatchPlayback.ts
 * Pure playback plan for a drained fxQueue batch (testable; no React/Web Audio).
 */

import { getTrapCinematic } from '../cinematics/trapCinematics.js';
import type { TrapOverlayPayload } from '../components/TrapCinematicOverlay.js';
import type { ClientFxEvent } from './clientFxTypes.js';
import { isTrapFiredEvent, isEliminationEvent, isGameWonEvent } from './clientFxTypes.js';
import type { TrapId, EliminationCause, CharacterId } from '../../types/enums.js';

export interface EliminationSoundPlan {
  readonly characterId: CharacterId;
  readonly cause: EliminationCause;
  readonly delayMs: number;
}

export interface FxBatchPlaybackPlan {
  readonly trapPlays: readonly TrapId[];
  readonly trapOverlay: TrapOverlayPayload | null;
  readonly eliminationSounds: readonly EliminationSoundPlan[];
  readonly playWin: boolean;
  readonly fireConfetti: boolean;
}

export interface PlanFxBatchPlaybackInput {
  readonly batch: readonly ClientFxEvent[];
  readonly winConfettiAlreadyFired: boolean;
  readonly isMuted: boolean;
  readonly prefersReducedMotion: boolean;
}

export interface PlanFxBatchPlaybackResult {
  readonly plan: FxBatchPlaybackPlan;
  readonly winConfettiFired: boolean;
}

export function planFxBatchPlayback(
  input: PlanFxBatchPlaybackInput,
): PlanFxBatchPlaybackResult {
  const elimPlayed = new Set<string>();
  const trapPlays: TrapId[] = [];
  let trapOverlay: TrapOverlayPayload | null = null;
  const eliminationSounds: EliminationSoundPlan[] = [];
  let playWin = false;
  let fireConfetti = false;
  let winConfettiFired = input.winConfettiAlreadyFired;

  for (const event of input.batch) {
    if (isTrapFiredEvent(event)) {
      trapPlays.push(event.trapId);
      trapOverlay = {
        trapId:      event.trapId,
        cellId:      event.cellId,
        victimNames: event.victimNames,
      };
    } else if (isEliminationEvent(event)) {
      if (!elimPlayed.has(event.characterId)) {
        elimPlayed.add(event.characterId);
        const trapEvent = input.batch.find(isTrapFiredEvent);
        const delay =
          trapEvent && trapEvent.victimNames.includes(event.displayName)
            ? getTrapCinematic(trapEvent.trapId).impactDelayMs
            : 0;
        eliminationSounds.push({
          characterId: event.characterId,
          cause:       event.cause,
          delayMs:     delay,
        });
      }
    } else if (isGameWonEvent(event)) {
      playWin = true;
      if (
        event.isLocalWinner &&
        !winConfettiFired &&
        !input.prefersReducedMotion &&
        !input.isMuted
      ) {
        fireConfetti = true;
        winConfettiFired = true;
      }
    }
  }

  return {
    plan: {
      trapPlays,
      trapOverlay,
      eliminationSounds,
      playWin,
      fireConfetti,
    },
    winConfettiFired,
  };
}
