/**
 * gameInitializer.ts
 * Creates a fresh GameState from a lobby configuration.
 * Implements the Milton Bradley / Winning Moves setup rules (1993 booklet).
 */

import type { GameState, PlayerState }   from '../types/game-state.js';
import type { Character }                from '../types/entities.js';
import { CHARACTER_IDS, type CharacterId, type PlayerId } from '../types/enums.js';

import {
  INITIAL_DETECTIVE_TRACK,
  GRID_21X15_DINING_CHAIR_CELLS,
  GRID_21X15_DINING_CHAIR_SET,
  GRID_21X15_INITIAL_BOARD,
} from './boardDefinition.js';
import { buildTraps }                                               from './trapDefinition.js';
import { buildDeck }                                                from './cardDeck.js';
import { buildPortraitStack }                                       from './portraitStack.js';
import { CHARACTER_DATA }                                           from './characterCatalog.js';
export { CHARACTER_DATA, AUNT_AGATHA_DISPLAY_NAME, getCharacterDisplayName } from './characterCatalog.js';

const ALL_CHARACTER_IDS: CharacterId[] = [...CHARACTER_IDS];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

interface CharacterDealResult {
  readonly visible: Record<PlayerId, CharacterId[]>;
  readonly secret: Record<PlayerId, CharacterId[]>;
}

function dealCharacterCards(
  playerIds: readonly PlayerId[],
  cardsPerPlayer: number,
): CharacterDealResult {
  const shuffled = shuffleArray(ALL_CHARACTER_IDS);
  const visible: Record<PlayerId, CharacterId[]> = {};
  const secret: Record<PlayerId, CharacterId[]> = {};

  if (playerIds.length === 2) {
    // PDF 2p: 4 face-up + 2 secret each — all 12 pawns in play
    const [p0, p1] = playerIds as [PlayerId, PlayerId];
    visible[p0] = shuffled.slice(0, 4);
    visible[p1] = shuffled.slice(4, 8);
    secret[p0] = shuffled.slice(8, 10);
    secret[p1] = shuffled.slice(10, 12);
    return { visible, secret };
  }

  playerIds.forEach((pid, i) => {
    visible[pid] = shuffled.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
    secret[pid] = [];
  });

  return { visible, secret };
}

/** True when pawns or board still use pre–dining-ring chair cells. */
export function gridChairSpawnNeedsRepair(state: GameState): boolean {
  if (state.boardVersion !== 'GRID_21X15') return false;

  const pawnMismatch = ALL_CHARACTER_IDS.some((id) => {
    const ch = state.characters[id]!;
    return ch.isOnRedChair && !GRID_21X15_DINING_CHAIR_SET.has(ch.position);
  });

  const boardMismatch =
    GRID_21X15_DINING_CHAIR_CELLS.some(
      (id) => state.board[id]?.cellType !== 'RED_CHAIR',
    ) ||
    Object.values(state.board).some(
      (c) => c.cellType === 'RED_CHAIR' && !GRID_21X15_DINING_CHAIR_SET.has(c.cellId),
    );

  return pawnMismatch || boardMismatch;
}

/**
 * Re-sync board chair markers and snap starting pawns onto the twelve dining chairs.
 */
export function repairGridChairSpawns(state: GameState): GameState {
  if (state.boardVersion !== 'GRID_21X15') return state;

  const board = { ...GRID_21X15_INITIAL_BOARD };
  for (const cell of Object.values(state.board)) {
    if (GRID_21X15_DINING_CHAIR_SET.has(cell.cellId)) continue;
    const canonical = board[cell.cellId];
    if (!canonical) continue;
    board[cell.cellId] = {
      ...canonical,
      occupants: [...cell.occupants],
    };
  }

  const characters = { ...state.characters };
  for (const id of GRID_21X15_DINING_CHAIR_CELLS) {
    board[id] = { ...board[id]!, occupants: [] };
  }

  ALL_CHARACTER_IDS.forEach((charId, idx) => {
    const ch = characters[charId]!;
    if (ch.status !== 'ALIVE' || !ch.isOnRedChair) return;

    const chair = GRID_21X15_DINING_CHAIR_CELLS[idx]!;
    characters[charId] = { ...ch, position: chair };
    board[chair] = { ...board[chair]!, occupants: [charId] };
  });

  return { ...state, board, characters };
}

export function initializeGame(
  gameId: string,
  playerIds: readonly PlayerId[],
  playerNames: Record<PlayerId, string>,
): GameState {
  if (playerIds.length < 2 || playerIds.length > 4) {
    throw new Error('13 Dead End Drive requires 2–4 players.');
  }

  const cardsPerPlayer = playerIds.length <= 3 ? 4 : 3;
  const { visible: characterDeals, secret: secretDeals } = dealCharacterCards(
    playerIds,
    cardsPerPlayer,
  );

  // Portrait: always starts as Aunt Agatha. Only doubles may rotate to reveal the top guest.
  const portraitStack = buildPortraitStack();

  const shuffledChairs = shuffleArray([...GRID_21X15_DINING_CHAIR_CELLS]);
  const characters = {} as Record<CharacterId, Character>;

  ALL_CHARACTER_IDS.forEach((charId, idx) => {
    const chairCell = shuffledChairs[idx]!;
    const data = CHARACTER_DATA[charId]!;

    const controlledBy: PlayerId | null =
      Object.entries(characterDeals).find(([, cards]) =>
        cards.includes(charId),
      )?.[0]
      ?? Object.entries(secretDeals).find(([, cards]) =>
        cards.includes(charId),
      )?.[0]
      ?? null;

    characters[charId] = {
      id:               charId,
      displayName:      data.displayName,
      pawnColor:        data.pawnColor,
      position:         chairCell,
      status:           'ALIVE',
      eliminationCause: null,
      controlledBy,
      isPortraitHeir:   false,
      isOnRedChair:     true,
    };
  });

  const board = { ...GRID_21X15_INITIAL_BOARD };
  ALL_CHARACTER_IDS.forEach((charId, idx) => {
    const chairId = shuffledChairs[idx]!;
    board[chairId] = { ...board[chairId]!, occupants: [charId] };
  });

  const players: Record<PlayerId, PlayerState> = {};
  playerIds.forEach((pid, idx) => {
    const secretIds = secretDeals[pid] ?? [];
    players[pid] = {
      playerId:     pid,
      displayName:  playerNames[pid] ?? `Player ${idx + 1}`,
      avatarUrl:    null,
      characterIds: characterDeals[pid] ?? [],
      secretCharacterIds:    secretIds,
      hasHiddenSecretCard:  secretIds.length > 0,
      hand:         [],
      isEliminated: false,
      isConnected:  true,
      lastSeenAt:   new Date().toISOString(),
    };
  });

  const now = new Date().toISOString();

  return {
    gameId,
    boardVersion:      'GRID_21X15',
    phase:             'IN_PROGRESS',
    subPhase:          'AWAITING_ROLL',
    turnNumber:        1,
    activePlayerId:    playerIds[0]!,
    turnOrder:         playerIds as readonly PlayerId[],
    players,
    characters,
    board,
    traps:             buildTraps('GRID_21X15'),
    detectivePosition: { ...INITIAL_DETECTIVE_TRACK },
    activePortrait: {
      currentHeirId:     'AUNT_AGATHA',
      portraitStack,
      portraitHistory:   [],
      lastChangedOnTurn: 1,
      lastChangedReason: 'OPENING_AGATHA',
    },
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
    createdAt:         now,
    updatedAt:         now,
  };
}
