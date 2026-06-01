// executeFxBatchPlan.spec.ts — side-effect execution wiring for FX batches

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PLAYER_A_ID } from '../fixtures/gameState.fixtures.js';

const { playTrap, playElimination, playWin, isMuted, fireWinnerConfetti } = vi.hoisted(() => ({
  playTrap: vi.fn(),
  playElimination: vi.fn(),
  playWin: vi.fn(),
  isMuted: vi.fn(() => false),
  fireWinnerConfetti: vi.fn(),
}));

vi.mock('../../client/audio/gameAudioInstance.js', () => ({
  gameAudio: {
    playTrap,
    playElimination,
    playWin,
    isMuted,
  },
}));

vi.mock('../../client/fx/winnerConfetti.js', () => ({
  fireWinnerConfetti,
}));

import { executeFxBatchPlan } from '../../client/fx/executeFxBatchPlan.js';

describe('executeFxBatchPlan', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    playTrap.mockClear();
    playElimination.mockClear();
    playWin.mockClear();
    fireWinnerConfetti.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('plays trap audio immediately and elimination after impact delay', () => {
    const onTrapOverlay = vi.fn();
    const onWinConfettiFired = vi.fn();

    executeFxBatchPlan(
      [
        {
          type: 'TRAP_FIRED',
          trapId: 'CHANDELIER',
          cellId: 'CHAND_TRAP',
          victimNames: ['Smothers'],
        },
        {
          type: 'CHARACTER_ELIMINATED',
          characterId: 'SMOTHERS',
          cause: 'TRAP',
          displayName: 'Smothers',
        },
      ],
      {
        winConfettiAlreadyFired: false,
        isMuted: false,
        prefersReducedMotion: false,
        onTrapOverlay,
        onWinConfettiFired,
      },
    );

    expect(playTrap).toHaveBeenCalledWith('CHANDELIER');
    expect(onTrapOverlay).toHaveBeenCalled();
    expect(playElimination).not.toHaveBeenCalled();

    vi.advanceTimersByTime(280);
    expect(playElimination).toHaveBeenCalledWith('TRAP');
  });

  it('fires confetti and win audio for local winner when not muted', () => {
    executeFxBatchPlan(
      [
        {
          type: 'GAME_WON',
          winnerId: PLAYER_A_ID,
          winCondition: 'HEIR_ESCAPED',
          isLocalWinner: true,
        },
      ],
      {
        winConfettiAlreadyFired: false,
        isMuted: false,
        prefersReducedMotion: false,
        onTrapOverlay: vi.fn(),
        onWinConfettiFired: vi.fn(),
      },
    );

    expect(playWin).toHaveBeenCalled();
    expect(fireWinnerConfetti).toHaveBeenCalled();
  });
});
