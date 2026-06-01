/**
 * game-state.ts
 * Root GameState record and PlayerState — the single source of truth
 * transferred in full on every STATE_SYNC event.
 * Updated to support real 13 Dead End Drive turn flow and card deck.
 */

import type {
  BoardVersion,
  GameId,
  GamePhase,
  GameSubPhase,
  MovementDie,
  MovementPlan,
  PipCount,
  PlayerId,
  WinCondition,
} from './enums.js';
import type { RuleModuleId, RuleProfile } from './rule-profile.js';
import type { CharacterId, TrapId, CellId }                                           from './enums.js';
import type {
  ActionCard,
  Character,
  DetectiveTrack,
  FireplacePortrait,
  GridCell,
  TrapState,
} from './entities.js';

// ── Player State ──────────────────────────────────────────────────────────────

export interface PlayerState {
  readonly playerId:      PlayerId;
  readonly displayName:   string;
  readonly avatarUrl:     string | null;
  /** Face-down rooting cards (visible to this player only). */
  readonly characterIds:  CharacterId[];
  /**
   * Legacy field — G01 standard uses visible rooting only; kept for schema compat.
   */
  readonly secretCharacterIds: readonly CharacterId[];
  /** Legacy — false when all rooting guests are in `characterIds`. */
  readonly hasHiddenSecretCard: boolean;
  /** Cards in this player's hand (trap cards and wild cards only; detective cards are never kept). */
  readonly hand:          ActionCard[];
  readonly isEliminated:  boolean;      // true when all rooted characters are ELIMINATED
  readonly isConnected:   boolean;
  readonly lastSeenAt:    string;       // ISO 8601
}

// ── Dice Roll Snapshot ────────────────────────────────────────────────────────

export interface DiceRollResult {
  readonly die1:        MovementDie;    // first die value (for first pawn move)
  readonly die2:        MovementDie;    // second die value (for second pawn move)
  readonly isDoubles:   boolean;        // die1 === die2
  readonly rolledBy:    PlayerId;
  readonly rolledAt:    string;         // ISO 8601
}

// ── Root Game State ───────────────────────────────────────────────────────────

export interface GameState {
  readonly gameId:            GameId;
  /** STANDARD = G01 / 1993 digital rules; ADVANCED enables `enabledModules`. */
  readonly ruleProfile:       RuleProfile;
  /** Module toggles when `ruleProfile` is ADVANCED; ignored for STANDARD. */
  readonly enabledModules:    readonly RuleModuleId[];
  /** GRID_21X15 = canonical mansion; FIXTURE = vitest adjacency graph only */
  readonly boardVersion:      BoardVersion;
  readonly phase:             GamePhase;
  /**
   * Intra-turn sub-phase state machine:
   * AWAITING_ROLL → FIRST_MOVE → [AWAITING_TRAP_1] → SECOND_MOVE → [AWAITING_TRAP_2] → TURN_END
   */
  readonly subPhase:          GameSubPhase;
  readonly turnNumber:        number;
  readonly activePlayerId:    PlayerId;
  readonly turnOrder:         readonly PlayerId[];   // 2–4 entries

  // Core entity maps
  readonly players:           Readonly<Record<PlayerId,    PlayerState>>;
  readonly characters:        Readonly<Record<CharacterId, Character>>;
  readonly board:             Readonly<Record<CellId,      GridCell>>;
  readonly traps:             Readonly<Record<TrapId,      TrapState>>;

  // Mansion portrait frame
  readonly detectivePosition: DetectiveTrack;
  readonly activePortrait:    FireplacePortrait;

  // Dice state
  readonly lastDiceRoll:      DiceRollResult | null;
  /** Pips remaining for the current move (one die, combined total, or die2 on second move). */
  readonly pipsRemaining:     PipCount | null;
  /** How many pawn moves have been completed this turn (0, 1, or 2). */
  readonly movesUsedThisTurn: 0 | 1 | 2;
  /**
   * SPLIT = move pawn A with die1, then a different pawn B with die2.
   * COMBINED = one pawn uses die1 + die2, then turn ends.
   */
  readonly movementPlan:      MovementPlan | null;
  /** Set after the first split move; second move must use a different pawn. */
  readonly firstMoveCharacterId: CharacterId | null;

  /**
   * Trap pending resolution: set when a pawn lands on a trap space.
   * The active player must PLAY_TRAP_CARD, DRAW_TRAP_CARD, or DECLINE_TRAP.
   */
  readonly pendingTrapCell:   CellId | null;
  /** Hand card ids eligible to spring the pending trap (captured on landing). */
  readonly pendingTrapHandCardIds: readonly string[] | null;
  /** After drawing on a trap, only this card may be played to spring (PDF rule). */
  readonly pendingTrapDrawnCardId: string | null;

  /**
   * Shared face-down card deck.
   * Server-authoritative. Clients never see the full deck order.
   */
  readonly deck:              ActionCard[];
  readonly discardPile:       ActionCard[];

  // End state
  readonly winner:            PlayerId | null;
  readonly winCondition:      WinCondition | null;
  /**
   * Guests whose rooting owner was revealed because that pawn was eliminated.
   * Only that card is public; other secrets stay hidden.
   */
  readonly exposedRooting: Readonly<Partial<Record<CharacterId, PlayerId>>>;
  /** Legacy 2p endgame full reveal (only when rules require all secrets shown). */
  readonly secretCardsRevealed: boolean;

  // Optional flags
  readonly isPaused?:         boolean;

  readonly createdAt:         string;   // ISO 8601
  readonly updatedAt:         string;   // ISO 8601
}
