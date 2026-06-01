/**
 * gameInitializer.ts
 * Creates a fresh GameState from a lobby configuration.
 * Implements the Milton Bradley / Winning Moves setup rules (1993 booklet).
 */

import type { GameState, PlayerState }   from '@ded/types/game-state.js';
import type { Character }                from '@ded/types/entities.js';
import { CHARACTER_IDS, type CharacterId, type PlayerId } from '@ded/types/enums.js';
import type { RuleModuleId, RuleProfile } from '@ded/types/rule-profile.js';
import {
  DEFAULT_ENABLED_MODULES,
  DEFAULT_RULE_PROFILE,
} from '@ded/types/rule-profile.js';

import {
  INITIAL_DETECTIVE_TRACK,
  GRID_21X15_DINING_CHAIR_CELLS,
  GRID_21X15_DINING_CHAIR_SET,
  GRID_21X15_INITIAL_BOARD,
} from './boardDefinition.js';
import { buildTraps }                                               from './trapDefinition.js';
import { buildDeck, buildExtendedDeck }                             from './cardDeck.js';
import { applyBoardModulesForState }                                from './rules/applyBoardModules.js';
import { registerBuiltinRuleModules }                               from './rules/registerBuiltinModules.js';
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
}

export interface InitializeGameOptions {
  readonly ruleProfile?: RuleProfile;
  readonly enabledModules?: readonly RuleModuleId[];
}

function rootingCardsPerPlayer(playerCount: number): number {
  if (playerCount === 2) return 6;
  if (playerCount === 3) return 4;
  return 3;
}

function dealCharacterCards(
  playerIds: readonly PlayerId[],
  cardsPerPlayer: number,
): CharacterDealResult {
  const shuffled = shuffleArray(ALL_CHARACTER_IDS);
  const visible: Record<PlayerId, CharacterId[]> = {};

  playerIds.forEach((pid, i) => {
    visible[pid] = shuffled.slice(i * cardsPerPlayer, (i + 1) * cardsPerPlayer);
  });

  return { visible };
}

/** True when pawns or board still use pre–dining-ring chair cells. */
export function gridChairSpawnNeedsRepair(state: GameState): boolean {
  if (state.boardVersion !== 'GRID_21X15') return false;
  if (state.phase === 'LOBBY') return false;

  const pawnMismatch = ALL_CHARACTER_IDS.some((id) => {
    const ch = state.characters[id];
    if (!ch) return false;
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
  if (state.phase === 'LOBBY') return state;

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
    const ch = characters[charId];
    if (!ch || ch.status !== 'ALIVE' || !ch.isOnRedChair) return;

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
  options: InitializeGameOptions = {},
): GameState {
  registerBuiltinRuleModules();

  if (playerIds.length < 2 || playerIds.length > 4) {
    throw new Error('13 Dead End Drive requires 2–4 players.');
  }

  const ruleProfile = options.ruleProfile ?? DEFAULT_RULE_PROFILE;
  const enabledModules =
    ruleProfile === 'STANDARD'
      ? DEFAULT_ENABLED_MODULES
      : (options.enabledModules ?? DEFAULT_ENABLED_MODULES);

  const cardsPerPlayer = rootingCardsPerPlayer(playerIds.length);
  const { visible: characterDeals } = dealCharacterCards(
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
      )?.[0] ?? null;

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
    players[pid] = {
      playerId:     pid,
      displayName:  playerNames[pid] ?? `Player ${idx + 1}`,
      avatarUrl:    null,
      characterIds: characterDeals[pid] ?? [],
      secretCharacterIds:    [],
      hasHiddenSecretCard:  false,
      hand:         [],
      isEliminated: false,
      isConnected:  true,
      lastSeenAt:   new Date().toISOString(),
    };
  });

  const now = new Date().toISOString();
  const useExtendedDeck = enabledModules.includes('EXTENDED_TRAP_DECK');

  let gameState: GameState = {
    gameId,
    ruleProfile,
    enabledModules,
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
    deck:              useExtendedDeck ? buildExtendedDeck() : buildDeck(),
    discardPile:       [],
    winner:               null,
    winCondition:         null,
    exposedRooting:      {},
    secretCardsRevealed:  false,
    createdAt:         now,
    updatedAt:         now,
  };

  gameState = applyBoardModulesForState(gameState);
  return gameState;
}
