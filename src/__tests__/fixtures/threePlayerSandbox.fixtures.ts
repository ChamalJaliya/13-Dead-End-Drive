/**
 * threePlayerSandbox.fixtures.ts
 * Deterministic 3-player development sandbox — GDD §Phase 1 init with fixed deals,
 * pre-assigned trap hands, and seeded random chair placement.
 */

import type { GameState, PlayerState } from '../../types/game-state.js';
import type { Character, ActionCard } from '../../types/entities.js';
import type { CharacterId, CellId, PlayerId } from '../../types/enums.js';
import { CHARACTER_IDS } from '../../types/enums.js';
import { CHARACTER_DATA } from '../../engine/characterCatalog.js';
import {
  INITIAL_BOARD,
  INITIAL_DETECTIVE_TRACK,
  RED_CHAIR_CELLS,
} from '../../engine/boardDefinition.js';
import { INITIAL_TRAPS } from '../../engine/trapDefinition.js';
import {
  CARD_CHANDELIER,
  CARD_DETECTIVE,
  CARD_FIREPLACE,
  CARD_WILD,
  makePortrait,
} from './gameState.fixtures.js';

// ─── Stable sandbox IDs ───────────────────────────────────────────────────────

export const SANDBOX_GAME_ID = 'sandbox-3p-0001';
export const SANDBOX_P1: PlayerId = 'sandbox-player-1';
export const SANDBOX_P2: PlayerId = 'sandbox-player-2';
export const SANDBOX_P3: PlayerId = 'sandbox-player-3';

/** GDD: 3 players × 4 character cards = all 12 identities dealt */
export const SANDBOX_CHARACTER_DEALS: Readonly<Record<PlayerId, readonly CharacterId[]>> = {
  [SANDBOX_P1]: ['SMOTHERS', 'CHARITY', 'LULU', 'PARKER'],
  [SANDBOX_P2]: ['DUSTY', 'CLAY', 'BEAUREGARD_III', 'SPRITZY'],
  [SANDBOX_P3]: ['MADAME_ASTRA', 'HICKORY', 'PIERRE', 'POOPSIE'],
} as const;

/** Pre-assigned trap hands for integration / UI testing */
export const SANDBOX_TRAP_HANDS: Readonly<Record<PlayerId, readonly ActionCard[]>> = {
  [SANDBOX_P1]: [CARD_CHANDELIER, CARD_WILD],
  [SANDBOX_P2]: [CARD_FIREPLACE],
  [SANDBOX_P3]: [CARD_DETECTIVE],
} as const;

/** Seeded chair shuffle: character → red chair (reproducible across runs) */
const SANDBOX_CHAIR_ASSIGNMENT: ReadonlyArray<readonly [CharacterId, CellId]> = [
  ['SMOTHERS',    'RC_7'],
  ['DUSTY',  'RC_2'],
  ['CHARITY',   'RC_11'],
  ['LULU',  'RC_4'],
  ['PARKER',     'RC_9'],
  ['CLAY',   'RC_1'],
  ['BEAUREGARD_III',    'RC_12'],
  ['SPRITZY',  'RC_5'],
  ['MADAME_ASTRA',     'RC_3'],
  ['HICKORY',    'RC_10'],
  ['PIERRE',   'RC_6'],
  ['POOPSIE',  'RC_8'],
] as const;

function ownerOf(charId: CharacterId): PlayerId {
  for (const [pid, cards] of Object.entries(SANDBOX_CHARACTER_DEALS)) {
    if ((cards as readonly CharacterId[]).includes(charId)) {
      return pid as PlayerId;
    }
  }
  throw new Error(`No sandbox owner for ${charId}`);
}

export interface ThreePlayerSandboxOptions {
  readonly activePlayerId?: PlayerId;
  readonly featuredPortraitId?: CharacterId;
  readonly subPhase?: GameState['subPhase'];
}

/**
 * Builds a fully playable 3-player `GameState` with deterministic deals and chair layout.
 * Use in specs, manual QA, or agent sandboxes without calling random `initializeGame()`.
 */
export function makeThreePlayerSandbox(
  options: ThreePlayerSandboxOptions = {},
): GameState {
  const featuredPortraitId = options.featuredPortraitId ?? 'CHARITY';
  const activePlayerId = options.activePlayerId ?? SANDBOX_P1;
  const now = '2026-05-25T12:00:00Z';

  const characters = {} as Record<CharacterId, Character>;
  for (const charId of CHARACTER_IDS) {
    const assignment = SANDBOX_CHAIR_ASSIGNMENT.find(([id]) => id === charId);
    const chairCell = assignment?.[1] ?? RED_CHAIR_CELLS[0]!;
    const meta = CHARACTER_DATA[charId]!;
    characters[charId] = {
      id:               charId,
      displayName:      meta.displayName,
      pawnColor:        meta.pawnColor,
      position:         chairCell,
      status:           'ALIVE',
      eliminationCause: null,
      controlledBy:     ownerOf(charId),
      isPortraitHeir:   charId === featuredPortraitId,
      isOnRedChair:     true,
    };
  }

  const board = { ...INITIAL_BOARD };
  for (const cellId of RED_CHAIR_CELLS) {
    board[cellId] = { ...board[cellId]!, occupants: [] };
  }
  for (const [charId, chairId] of SANDBOX_CHAIR_ASSIGNMENT) {
    board[chairId] = {
      ...board[chairId]!,
      occupants: [charId],
    };
  }

  const players: Record<PlayerId, PlayerState> = {
    [SANDBOX_P1]: {
      playerId: SANDBOX_P1,
      displayName: 'Sandbox Alice',
      avatarUrl: null,
      characterIds: [...SANDBOX_CHARACTER_DEALS[SANDBOX_P1]!],
      secretCharacterIds: [],
      hasHiddenSecretCard: false,
      hand: [...SANDBOX_TRAP_HANDS[SANDBOX_P1]!],
      isEliminated: false,
      isConnected: true,
      lastSeenAt: now,
    },
    [SANDBOX_P2]: {
      playerId: SANDBOX_P2,
      displayName: 'Sandbox Bob',
      avatarUrl: null,
      characterIds: [...SANDBOX_CHARACTER_DEALS[SANDBOX_P2]!],
      secretCharacterIds: [],
      hasHiddenSecretCard: false,
      hand: [...SANDBOX_TRAP_HANDS[SANDBOX_P2]!],
      isEliminated: false,
      isConnected: true,
      lastSeenAt: now,
    },
    [SANDBOX_P3]: {
      playerId: SANDBOX_P3,
      displayName: 'Sandbox Carol',
      avatarUrl: null,
      characterIds: [...SANDBOX_CHARACTER_DEALS[SANDBOX_P3]!],
      secretCharacterIds: [],
      hasHiddenSecretCard: false,
      hand: [...SANDBOX_TRAP_HANDS[SANDBOX_P3]!],
      isEliminated: false,
      isConnected: true,
      lastSeenAt: now,
    },
  };

  return {
    gameId:            SANDBOX_GAME_ID,
    boardVersion:      'FIXTURE',
    phase:             'IN_PROGRESS',
    subPhase:          options.subPhase ?? 'AWAITING_ROLL',
    turnNumber:        1,
    activePlayerId,
    turnOrder:         [SANDBOX_P1, SANDBOX_P2, SANDBOX_P3] as const,
    players,
    characters,
    board,
    traps:             { ...INITIAL_TRAPS },
    detectivePosition: { ...INITIAL_DETECTIVE_TRACK },
    activePortrait:    makePortrait(featuredPortraitId),
    lastDiceRoll:      null,
    pipsRemaining:     null,
    movementPlan:      null,
    firstMoveCharacterId: null,
    movesUsedThisTurn: 0,
    pendingTrapCell:   null,
    pendingTrapHandCardIds: null,
    pendingTrapDrawnCardId: null,
    deck:              [],
    discardPile:       [],
    winner:            null,
    winCondition:      null,
    exposedRooting:      {},
    secretCardsRevealed: false,
    createdAt:         now,
    updatedAt:         now,
  };
}

/** JSON-serializable summary for agents and debug tooling */
export function threePlayerSandboxManifest(): {
  readonly gameId: string;
  readonly players: Readonly<Record<PlayerId, { characterIds: CharacterId[]; handLabels: string[] }>>;
  readonly chairAssignment: ReadonlyArray<{ character: CharacterId; chair: CellId }>;
} {
  return {
    gameId: SANDBOX_GAME_ID,
    players: {
      [SANDBOX_P1]: {
        characterIds: [...SANDBOX_CHARACTER_DEALS[SANDBOX_P1]!],
        handLabels: SANDBOX_TRAP_HANDS[SANDBOX_P1]!.map((c) => c.label),
      },
      [SANDBOX_P2]: {
        characterIds: [...SANDBOX_CHARACTER_DEALS[SANDBOX_P2]!],
        handLabels: SANDBOX_TRAP_HANDS[SANDBOX_P2]!.map((c) => c.label),
      },
      [SANDBOX_P3]: {
        characterIds: [...SANDBOX_CHARACTER_DEALS[SANDBOX_P3]!],
        handLabels: SANDBOX_TRAP_HANDS[SANDBOX_P3]!.map((c) => c.label),
      },
    },
    chairAssignment: SANDBOX_CHAIR_ASSIGNMENT.map(([character, chair]) => ({ character, chair })),
  };
}
