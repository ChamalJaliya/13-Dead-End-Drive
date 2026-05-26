/**
 * socket-events.ts
 * Discriminated union types for all WebSocket messages.
 * Rebuilt to match real 13 Dead End Drive turn flow.
 *
 * Turn flow events (Client → Server):
 *   1. ROLL_DICE          — start of each turn
 *   2. CHANGE_PORTRAIT    — optional, only on doubles before moving
 *   3. MOVE_PAWN          — move first character (die1 pips)
 *   4. PLAY_TRAP_CARD     — if pawn landed on trap space (optional)
 *      or DRAW_TRAP_CARD  — draw from deck instead
 *      or DECLINE_TRAP    — skip trap attempt entirely
 *   5. MOVE_PAWN          — move second character (die2 pips)
 *   6. (same trap options if second pawn also lands on trap)
 */

import type {
  CardId,
  CardType,
  CharacterId,
  CellId,
  EliminationCause,
  GameId,
  MovementDie,
  MovementPlan,
  PipCount,
  PlayerId,
  PortraitChangeReason,
  SocketErrorCode,
  TrapId,
  TrapStateValue,
  WinCondition,
} from './enums.js';
import type { GameState }   from './game-state.js';
import type { ActionCard }  from './entities.js';

// =============================================================================
// SECTION A — Client → Server Events
// =============================================================================

interface BaseSocketEvent {
  readonly eventId:   string;     // UUID v4 — idempotency key
  readonly gameId:    GameId;
  readonly playerId:  PlayerId;
  readonly timestamp: string;     // ISO 8601
}

// ── ROLL_DICE ─────────────────────────────────────────────────────────────────

export interface RollDiceEvent extends BaseSocketEvent {
  readonly type: 'ROLL_DICE';
}

// ── CHANGE_PORTRAIT (doubles only) ────────────────────────────────────────────
// Player may optionally advance the portrait stack when they roll doubles.

export interface ChangePortraitEvent extends BaseSocketEvent {
  readonly type: 'CHANGE_PORTRAIT';
}

// ── CHOOSE_MOVEMENT_PLAN ──────────────────────────────────────────────────────

export interface ChooseMovementPlanPayload {
  readonly plan: MovementPlan;
}

export interface ChooseMovementPlanEvent extends BaseSocketEvent {
  readonly type:    'CHOOSE_MOVEMENT_PLAN';
  readonly payload: ChooseMovementPlanPayload;
}

// ── MOVE_PAWN ─────────────────────────────────────────────────────────────────

export interface MovePawnPayload {
  readonly characterId: CharacterId;
  readonly fromCell:    CellId;
  readonly toCell:      CellId;
  readonly pipsUsed:    PipCount;
  /** Full ordered traversal path for server-side re-validation */
  readonly path:        readonly CellId[];
  /** true when this move spends die1 + die2 on one pawn */
  readonly usingCombinedDice?: boolean;
}

export interface MovePawnEvent extends BaseSocketEvent {
  readonly type:    'MOVE_PAWN';
  readonly payload: MovePawnPayload;
}

// ── PLAY_TRAP_CARD ────────────────────────────────────────────────────────────
// Player plays a matching trap card or wild card from their hand to spring the trap.

export interface PlayTrapCardPayload {
  readonly cardId:     CardId;
  readonly cardType:   CardType;
  /** The trap cell being targeted (must equal pendingTrapCell) */
  readonly targetCell: CellId;
}

export interface PlayTrapCardEvent extends BaseSocketEvent {
  readonly type:    'PLAY_TRAP_CARD';
  readonly payload: PlayTrapCardPayload;
}

// ── DRAW_TRAP_CARD ────────────────────────────────────────────────────────────
// Player draws from the top of the deck (when they have no matching card,
// or choose to draw instead of playing).

export interface DrawTrapCardEvent extends BaseSocketEvent {
  readonly type: 'DRAW_TRAP_CARD';
}

// ── DECLINE_TRAP ──────────────────────────────────────────────────────────────
// Player declines to spring the trap (has card but chooses not to play it,
// or already drew a non-matching card).

export interface DeclineTrapEvent extends BaseSocketEvent {
  readonly type: 'DECLINE_TRAP';
}

// ── Union of all incoming events ──────────────────────────────────────────────

export type SocketEvent =
  | RollDiceEvent
  | ChangePortraitEvent
  | ChooseMovementPlanEvent
  | MovePawnEvent
  | PlayTrapCardEvent
  | DrawTrapCardEvent
  | DeclineTrapEvent;

// =============================================================================
// SECTION B — Server → Client Responses
// =============================================================================

interface BaseSocketResponse {
  readonly responseId:         string;
  readonly gameId:             string;
  readonly timestamp:          string;
  readonly triggeredByEventId: string;
}

// ── STATE_SYNC ────────────────────────────────────────────────────────────────
// Full state broadcast after every committed action.
// privateHand contains cards only visible to the receiving player.

export interface StateSyncPayload {
  readonly gameState:   GameState;
  readonly privateHand: ActionCard[];
}

export interface StateSyncResponse extends BaseSocketResponse {
  readonly type:    'STATE_SYNC';
  readonly payload: StateSyncPayload;
}

// ── DICE_ROLLED ───────────────────────────────────────────────────────────────

export interface DiceRolledPayload {
  readonly die1:      MovementDie;
  readonly die2:      MovementDie;
  readonly isDoubles: boolean;
  readonly rolledBy:  PlayerId;
}

export interface DiceRolledResponse extends BaseSocketResponse {
  readonly type:    'DICE_ROLLED';
  readonly payload: DiceRolledPayload;
}

// ── TRAP_PENDING ──────────────────────────────────────────────────────────────
// Server informs client that a pawn landed on a trap space and awaits a decision.

export interface TrapPendingPayload {
  readonly trapId:     TrapId;
  readonly trapCell:   CellId;
  readonly character:  CharacterId;
}

export interface TrapPendingResponse extends BaseSocketResponse {
  readonly type:    'TRAP_PENDING';
  readonly payload: TrapPendingPayload;
}

// ── TRAP_FIRED ────────────────────────────────────────────────────────────────

export interface TrapFiredPayload {
  readonly trapId:               TrapId;
  readonly affectedCells:        CellId[];
  readonly eliminatedCharacters: CharacterId[];
  readonly newTrapState:         TrapStateValue;
  readonly cardPlayed:           CardId;
}

export interface TrapFiredResponse extends BaseSocketResponse {
  readonly type:    'TRAP_FIRED';
  readonly payload: TrapFiredPayload;
}

// ── CARD_DRAWN ────────────────────────────────────────────────────────────────

export interface CardDrawnPayload {
  readonly drawnCard:          ActionCard;
  readonly wasDetectiveCard:   boolean;
  readonly detectiveAdvanced:  boolean;
}

export interface CardDrawnResponse extends BaseSocketResponse {
  readonly type:    'CARD_DRAWN';
  readonly payload: CardDrawnPayload;
}

// ── CHARACTER_ELIMINATED ──────────────────────────────────────────────────────

export interface CharacterEliminatedPayload {
  readonly characterId:         CharacterId;
  readonly cause:               EliminationCause;
  readonly wasPortraitHeir:     boolean;
  readonly playerEliminated:    boolean;
  readonly eliminatedPlayerId:  PlayerId | null;
}

export interface CharacterEliminatedResponse extends BaseSocketResponse {
  readonly type:    'CHARACTER_ELIMINATED';
  readonly payload: CharacterEliminatedPayload;
}

// ── PORTRAIT_CHANGED ──────────────────────────────────────────────────────────

export interface PortraitChangedPayload {
  readonly previousHeirId: CharacterId;
  readonly newHeirId:      CharacterId;
  readonly reason:         PortraitChangeReason;
}

export interface PortraitChangedResponse extends BaseSocketResponse {
  readonly type:    'PORTRAIT_CHANGED';
  readonly payload: PortraitChangedPayload;
}

// ── DETECTIVE_MOVED ───────────────────────────────────────────────────────────

export interface DetectiveMovedPayload {
  readonly previousStep: number;
  readonly newStep:      number;
  readonly isAtExit:     boolean;
}

export interface DetectiveMovedResponse extends BaseSocketResponse {
  readonly type:    'DETECTIVE_MOVED';
  readonly payload: DetectiveMovedPayload;
}

// ── GAME_OVER ─────────────────────────────────────────────────────────────────

export interface GameOverPayload {
  readonly winnerId:            PlayerId;
  readonly winCondition:        WinCondition;
  readonly survivingCharacters: CharacterId[];
  readonly totalTurns:          number;
}

export interface GameOverResponse extends BaseSocketResponse {
  readonly type:    'GAME_OVER';
  readonly payload: GameOverPayload;
}

// ── ERROR ─────────────────────────────────────────────────────────────────────

export interface ErrorPayload {
  readonly code:           SocketErrorCode;
  readonly message:        string;
  readonly invalidEventId: string;
}

export interface ErrorResponse extends BaseSocketResponse {
  readonly type:    'ERROR';
  readonly payload: ErrorPayload;
}

// ── Union of all outgoing responses ──────────────────────────────────────────

export type SocketResponse =
  | StateSyncResponse
  | DiceRolledResponse
  | TrapPendingResponse
  | TrapFiredResponse
  | CardDrawnResponse
  | CharacterEliminatedResponse
  | PortraitChangedResponse
  | DetectiveMovedResponse
  | GameOverResponse
  | ErrorResponse;
