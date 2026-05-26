/**
 * gameState.fixtures.ts
 * Shared, schema-compliant mock factories for the 13 Dead End Drive engine test suite.
 */

import type { GameState, PlayerState, DiceRollResult } from '../../types/game-state.js';
import type {
  Character,
  GridCell,
  TrapState,
  DetectiveTrack,
  FireplacePortrait,
  ActionCard,
} from '../../types/entities.js';
import type {
  CharacterId,
  CellId,
  PlayerId,
  TrapId,
  MovementDie,
} from '../../types/enums.js';
import { CHARACTER_IDS } from '../../types/enums.js';
import { INITIAL_BOARD, INITIAL_DETECTIVE_TRACK, RED_CHAIR_CELLS } from '../../engine/boardDefinition.js';
import { INITIAL_TRAPS } from '../../engine/trapDefinition.js';
import { buildDeck } from '../../engine/cardDeck.js';

// ─── Stable IDs ───────────────────────────────────────────────────────────────

export const PLAYER_A_ID: PlayerId = 'player-aaaa-0001';
export const PLAYER_B_ID: PlayerId = 'player-bbbb-0002';
export const GAME_ID                = 'game-test-0001';

// ─── Character Factories ──────────────────────────────────────────────────────

export function makeCharacter(
  overrides: Partial<Character> & { id: CharacterId },
): Character {
  return {
    displayName:      'Test Character',
    pawnColor:        '#ff0000',
    position:         'RC_1',
    status:           'ALIVE',
    eliminationCause: null,
    controlledBy:     PLAYER_A_ID,
    isPortraitHeir:   false,
    isOnRedChair:     true,
    ...overrides,
  };
}

export const SMOTHERS   = makeCharacter({ id: 'SMOTHERS',   position: 'RC_1', controlledBy: PLAYER_A_ID });
export const DUSTY = makeCharacter({ id: 'DUSTY', position: 'RC_2', controlledBy: PLAYER_B_ID });
export const CHARITY  = makeCharacter({
  id:             'CHARITY',
  position:       'RC_3',
  isPortraitHeir: true,
  controlledBy:   PLAYER_A_ID,
});

// ─── Grid Cell Factories ──────────────────────────────────────────────────────

export function makeCell(overrides: Partial<GridCell> & { cellId: CellId }): GridCell {
  const base = INITIAL_BOARD[overrides.cellId];
  return {
    cellType:        'ROOM',
    label:           'Mock Cell',
    occupants:       [],
    trapRef:         null,
    isExitAdjacent:  false,
    isRedChair:      false,
    isSecretPassage: false,
    adjacentCells:   [],
    gridCol:         0,
    gridRow:         0,
    ...base,
    ...overrides,
  };
}

/** Real mansion board from boardDefinition */
export const MOCK_BOARD: Record<CellId, GridCell> = { ...INITIAL_BOARD };

/** Board with all 12 pawns on red chairs */
export function boardWithStartingPawns(): Record<CellId, GridCell> {
  const board = { ...INITIAL_BOARD };
  CHARACTER_IDS.forEach((charId, idx) => {
    const chairId = RED_CHAIR_CELLS[idx]!;
    board[chairId] = {
      ...board[chairId]!,
      occupants: [charId],
    };
  });
  return board;
}

// ─── Trap Factories ───────────────────────────────────────────────────────────

export function makeTrap(
  overrides: Partial<TrapState> & { trapId: TrapId },
): TrapState {
  const base = INITIAL_TRAPS[overrides.trapId];
  return {
    ...base,
    ...overrides,
  };
}

export const CHANDELIER_READY: TrapState = makeTrap({ trapId: 'CHANDELIER', state: 'READY' });
export const CHANDELIER_SPENT: TrapState = makeTrap({ trapId: 'CHANDELIER', state: 'SPENT' });

// ─── Detective Track ──────────────────────────────────────────────────────────

export function makeDetective(overrides?: Partial<DetectiveTrack>): DetectiveTrack {
  return {
    ...INITIAL_DETECTIVE_TRACK,
    ...overrides,
  };
}

// ─── Portrait ─────────────────────────────────────────────────────────────────

export function makePortrait(heirId: CharacterId): FireplacePortrait {
  const stack = [heirId, ...CHARACTER_IDS.filter((id) => id !== heirId)];
  return {
    currentHeirId:     heirId,
    portraitStack:     stack,
    portraitHistory:   [],
    lastChangedOnTurn: 1,
    lastChangedReason: 'INITIAL_DRAW',
  };
}

// ─── Action Cards ─────────────────────────────────────────────────────────────

export const CARD_CHANDELIER: ActionCard = {
  cardId:        'card-trap-chandelier-0',
  cardType:      'TRAP_CARD',
  label:         'Chandelier',
  description:   'Spring the Chandelier trap to eliminate the character standing there.',
  matchesTrapId: 'CHANDELIER',
  isWild:        false,
  isDetective:   false,
};

export const CARD_FIREPLACE: ActionCard = {
  cardId:        'card-trap-fireplace-0',
  cardType:      'TRAP_CARD',
  label:         'Fireplace',
  description:   'Spring the Fireplace trap to eliminate the character standing there.',
  matchesTrapId: 'FIREPLACE',
  isWild:        false,
  isDetective:   false,
};

export const CARD_WILD: ActionCard = {
  cardId:        'card-wild-0',
  cardType:      'WILD_CARD',
  label:         'Double Trap',
  description:   'Spring ANY trap — can be used on any trap space.',
  matchesTrapId: null,
  isWild:        true,
  isDetective:   false,
};

export const CARD_DETECTIVE: ActionCard = {
  cardId:        'card-detective-0',
  cardType:      'DETECTIVE_CARD',
  label:         'Detective!',
  description:   'The detective advances one step closer to the mansion. Draw again.',
  matchesTrapId: null,
  isWild:        false,
  isDetective:   true,
};

// ─── Player Factories ─────────────────────────────────────────────────────────

export function makePlayer(
  id: PlayerId,
  characterIds: CharacterId[],
  hand: ActionCard[] = [],
  secretCharacterIds: CharacterId[] = [],
): PlayerState {
  return {
    playerId:     id,
    displayName:  `Player ${id.slice(-4)}`,
    avatarUrl:    null,
    characterIds,
    secretCharacterIds,
    hasHiddenSecretCard: secretCharacterIds.length > 0,
    hand,
    isEliminated: false,
    isConnected:  true,
    lastSeenAt:   '2026-05-23T02:00:00Z',
  };
}

// ─── Dice Roll Factory ────────────────────────────────────────────────────────

export function makeDiceRoll(
  die1: MovementDie,
  die2: MovementDie,
  rolledBy: PlayerId = PLAYER_A_ID,
): DiceRollResult {
  return {
    die1,
    die2,
    isDoubles: die1 === die2,
    rolledBy,
    rolledAt:  '2026-05-23T02:00:00Z',
  };
}

/** All 12 characters on red chairs with board occupants */
export function makeAllCharacters(): Record<CharacterId, Character> {
  const chars = {} as Record<CharacterId, Character>;
  CHARACTER_IDS.forEach((charId, idx) => {
    const chairId = RED_CHAIR_CELLS[idx]!;
    const controlledBy =
      ['SMOTHERS', 'CHARITY'].includes(charId) ? PLAYER_A_ID
      : charId === 'DUSTY' ? PLAYER_B_ID
      : null;
    chars[charId] = makeCharacter({
      id:             charId,
      position:       chairId,
      controlledBy,
      isPortraitHeir: charId === 'CHARITY',
      isOnRedChair:   true,
      status:         charId === 'LULU' ? 'ELIMINATED' : 'ALIVE',
    });
  });
  return chars;
}

// ─── Root GameState Factory ───────────────────────────────────────────────────

export function makeGameState(overrides?: Partial<GameState>): GameState {
  const base: GameState = {
    gameId:            GAME_ID,
    boardVersion:      'FIXTURE',
    phase:             'IN_PROGRESS',
    subPhase:          'AWAITING_ROLL',
    turnNumber:        1,
    activePlayerId:    PLAYER_A_ID,
    turnOrder:         [PLAYER_A_ID, PLAYER_B_ID] as const,
    players: {
      [PLAYER_A_ID]: makePlayer(PLAYER_A_ID, ['SMOTHERS', 'CHARITY'], [CARD_CHANDELIER, CARD_WILD]),
      [PLAYER_B_ID]: makePlayer(PLAYER_B_ID, ['DUSTY'], [CARD_FIREPLACE]),
    },
    characters: {
      ...makeAllCharacters(),
      SMOTHERS:   SMOTHERS,
      DUSTY: DUSTY,
      CHARITY:  CHARITY,
      LULU: makeCharacter({ id: 'LULU', status: 'ELIMINATED', controlledBy: PLAYER_B_ID, isOnRedChair: false }),
    },
    board:             boardWithStartingPawns(),
    traps:             { ...INITIAL_TRAPS },
    detectivePosition: makeDetective(),
    activePortrait:    makePortrait('CHARITY'),
    lastDiceRoll:      null,
    pipsRemaining:     null,
    movementPlan:      null,
    firstMoveCharacterId: null,
    movesUsedThisTurn: 0,
    pendingTrapCell:   null,
    pendingTrapHandCardIds: null,
    pendingTrapDrawnCardId: null,
    deck:              buildDeck(),
    discardPile:       [],
    winner:               null,
    winCondition:         null,
    exposedRooting:      {},
    secretCardsRevealed:  false,
    createdAt:         '2026-05-23T01:00:00Z',
    updatedAt:         '2026-05-23T02:00:00Z',
  };

  return overrides ? { ...base, ...overrides } : base;
}

/** State ready for a first pawn move (dice rolled, FIRST_MOVE sub-phase) */
export function makeFirstMoveState(
  die1: MovementDie = 1,
  die2: MovementDie = 2,
  extra?: Partial<GameState>,
): GameState {
  return makeGameState({
    subPhase:          'FIRST_MOVE',
    lastDiceRoll:      makeDiceRoll(die1, die2),
    pipsRemaining:     die1,
    movementPlan:      'SPLIT',
    firstMoveCharacterId: null,
    movesUsedThisTurn: 0,
    ...extra,
  });
}

/** State ready for a second pawn move */
export function makeSecondMoveState(
  die2: MovementDie = 2,
  extra?: Partial<GameState>,
): GameState {
  return makeGameState({
    subPhase:          'SECOND_MOVE',
    lastDiceRoll:      makeDiceRoll(1, die2),
    pipsRemaining:     die2,
    movementPlan:      'SPLIT',
    firstMoveCharacterId: 'SMOTHERS',
    movesUsedThisTurn: 1,
    ...extra,
  });
}

/** Completes both moves in one turn and returns state at TURN_END */
export function completeTurnMoves(
  state: GameState,
  first: { characterId: CharacterId; from: CellId; to: CellId },
  second: { characterId: CharacterId; from: CellId; to: CellId },
): GameState {
  const { moveCharacter } = require('../../engine/moveCharacter.js') as typeof import('../../engine/moveCharacter.js');
  const { processTurn } = require('../../engine/turnOrchestrator.js') as typeof import('../../engine/turnOrchestrator.js');

  const roll = state.lastDiceRoll ?? makeDiceRoll(1, 1);
  const ts = '2026-05-23T03:00:00Z';

  let s = moveCharacter(state, {
    type: 'MOVE_PAWN',
    eventId: 'evt-fix-1',
    gameId: GAME_ID,
    playerId: state.activePlayerId,
    timestamp: ts,
    payload: {
      characterId: first.characterId,
      fromCell: first.from,
      toCell: first.to,
      pipsUsed: roll.die1,
      path: [first.from, first.to],
    },
  });

  if (s.subPhase === 'AWAITING_TRAP_1') {
    const { resolveTrapDecline } = require('../../engine/trapEvaluator.js') as typeof import('../../engine/trapEvaluator.js');
    s = resolveTrapDecline(s, s.activePlayerId, ts);
  }

  s = moveCharacter(s, {
    type: 'MOVE_PAWN',
    eventId: 'evt-fix-2',
    gameId: GAME_ID,
    playerId: s.activePlayerId,
    timestamp: ts,
    payload: {
      characterId: second.characterId,
      fromCell: second.from,
      toCell: second.to,
      pipsUsed: roll.die2,
      path: [second.from, second.to],
    },
  });

  if (s.subPhase === 'AWAITING_TRAP_2') {
    const { resolveTrapDecline } = require('../../engine/trapEvaluator.js') as typeof import('../../engine/trapEvaluator.js');
    s = resolveTrapDecline(s, s.activePlayerId, ts);
  }

  return processTurn(s, {
    type: 'MOVE_PAWN',
    eventId: 'evt-fix-rotate',
    gameId: GAME_ID,
    playerId: s.activePlayerId,
    timestamp: ts,
    payload: {
      characterId: second.characterId,
      fromCell: second.to,
      toCell: second.to,
      pipsUsed: 1,
      path: [second.to, second.to],
    },
  });
}
