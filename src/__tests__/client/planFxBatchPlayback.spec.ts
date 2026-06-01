// planFxBatchPlayback.spec.ts — pure FX batch playback planning

import { describe, it, expect } from 'vitest';
import { planFxBatchPlayback } from '../../client/fx/planFxBatchPlayback.js';
import type { ClientFxEvent } from '../../client/fx/clientFxTypes.js';
import { PLAYER_A_ID, PLAYER_B_ID } from '../fixtures/gameState.fixtures.js';

const TRAP_KILL_BATCH: readonly ClientFxEvent[] = [
  {
    type:         'TRAP_FIRED',
    trapId:       'CHANDELIER',
    cellId:       'CHAND_TRAP',
    victimNames:  ['Smothers'],
  },
  {
    type:         'CHARACTER_ELIMINATED',
    characterId:  'SMOTHERS',
    cause:        'TRAP',
    displayName:  'Smothers',
  },
];

describe('planFxBatchPlayback', () => {
  it('plans trap sound and overlay for TRAP_FIRED', () => {
    const { plan } = planFxBatchPlayback({
      batch: [{ type: 'TRAP_FIRED', trapId: 'FIREPLACE', cellId: 'FIRE_TRAP', victimNames: [] }],
      winConfettiAlreadyFired: false,
      isMuted: false,
      prefersReducedMotion: false,
    });
    expect(plan.trapPlays).toEqual(['FIREPLACE']);
    expect(plan.trapOverlay?.trapId).toBe('FIREPLACE');
  });

  it('dedupes duplicate CHARACTER_ELIMINATED for the same characterId', () => {
    const batch: ClientFxEvent[] = [
      {
        type: 'CHARACTER_ELIMINATED',
        characterId: 'DUSTY',
        cause: 'DETECTIVE',
        displayName: 'Dusty',
      },
      {
        type: 'CHARACTER_ELIMINATED',
        characterId: 'DUSTY',
        cause: 'DETECTIVE',
        displayName: 'Dusty',
      },
    ];
    const { plan } = planFxBatchPlayback({
      batch,
      winConfettiAlreadyFired: false,
      isMuted: false,
      prefersReducedMotion: false,
    });
    expect(plan.eliminationSounds).toHaveLength(1);
  });

  it('schedules elimination delay from trap impactDelayMs when victim matches trap batch', () => {
    const { plan } = planFxBatchPlayback({
      batch: TRAP_KILL_BATCH,
      winConfettiAlreadyFired: false,
      isMuted: false,
      prefersReducedMotion: false,
    });
    expect(plan.eliminationSounds[0]?.delayMs).toBe(280);
  });

  it('uses zero delay for elimination when not tied to a trap victim in the batch', () => {
    const { plan } = planFxBatchPlayback({
      batch: [
        {
          type: 'CHARACTER_ELIMINATED',
          characterId: 'DUSTY',
          cause: 'DETECTIVE',
          displayName: 'Dusty',
        },
      ],
      winConfettiAlreadyFired: false,
      isMuted: false,
      prefersReducedMotion: false,
    });
    expect(plan.eliminationSounds[0]?.delayMs).toBe(0);
  });

  it('plans playWin and fireConfetti for local winner when allowed', () => {
    const { plan, winConfettiFired } = planFxBatchPlayback({
      batch: [
        {
          type: 'GAME_WON',
          winnerId: PLAYER_A_ID,
          winCondition: 'HEIR_ESCAPED',
          isLocalWinner: true,
        },
      ],
      winConfettiAlreadyFired: false,
      isMuted: false,
      prefersReducedMotion: false,
    });
    expect(plan.playWin).toBe(true);
    expect(plan.fireConfetti).toBe(true);
    expect(winConfettiFired).toBe(true);
  });

  it('does not plan confetti when muted', () => {
    const { plan } = planFxBatchPlayback({
      batch: [
        {
          type: 'GAME_WON',
          winnerId: PLAYER_A_ID,
          winCondition: 'LAST_ALIVE',
          isLocalWinner: true,
        },
      ],
      winConfettiAlreadyFired: false,
      isMuted: true,
      prefersReducedMotion: false,
    });
    expect(plan.playWin).toBe(true);
    expect(plan.fireConfetti).toBe(false);
  });

  it('does not plan confetti when prefersReducedMotion', () => {
    const { plan } = planFxBatchPlayback({
      batch: [
        {
          type: 'GAME_WON',
          winnerId: PLAYER_A_ID,
          winCondition: 'LAST_ALIVE',
          isLocalWinner: true,
        },
      ],
      winConfettiAlreadyFired: false,
      isMuted: false,
      prefersReducedMotion: true,
    });
    expect(plan.fireConfetti).toBe(false);
  });

  it('does not plan confetti for opponent win', () => {
    const { plan } = planFxBatchPlayback({
      batch: [
        {
          type: 'GAME_WON',
          winnerId: PLAYER_B_ID,
          winCondition: 'LAST_ALIVE',
          isLocalWinner: false,
        },
      ],
      winConfettiAlreadyFired: false,
      isMuted: false,
      prefersReducedMotion: false,
    });
    expect(plan.playWin).toBe(true);
    expect(plan.fireConfetti).toBe(false);
  });

  it('does not fire confetti twice when winConfettiAlreadyFired', () => {
    const { plan, winConfettiFired } = planFxBatchPlayback({
      batch: [
        {
          type: 'GAME_WON',
          winnerId: PLAYER_A_ID,
          winCondition: 'LAST_ALIVE',
          isLocalWinner: true,
        },
      ],
      winConfettiAlreadyFired: true,
      isMuted: false,
      prefersReducedMotion: false,
    });
    expect(plan.fireConfetti).toBe(false);
    expect(winConfettiFired).toBe(true);
  });
});
