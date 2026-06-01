/**
 * entities.ts
 * Core board, character, trap, detective track, portrait, and card entity shapes.
 * Updated to match real 13 Dead End Drive rules.
 */

import type {
  CardId,
  CardType,
  CellId,
  CellType,
  CharacterId,
  CharacterStatus,
  EliminationCause,
  PlayerId,
  PortraitChangeReason,
  PortraitHeirId,
  TrapId,
  TrapStateValue,
} from './enums.js';

// ── Board Cell ────────────────────────────────────────────────────────────────

export interface GridCell {
  readonly cellId:           CellId;
  readonly cellType:         CellType;
  readonly label:            string;          // human-readable room name for UI
  readonly occupants:        CharacterId[];
  readonly trapRef:          TrapId | null;   // set only when cellType === 'TRAP_ZONE'
  readonly isExitAdjacent:   boolean;
  readonly isRedChair:       boolean;         // one of the 12 starting positions
  readonly isSecretPassage:  boolean;         // can teleport to any other secret passage
  /** Adjacency list: cellIds reachable in one step from this cell */
  readonly adjacentCells:    CellId[];
  /** Grid coordinates for the 2D renderer (col, row); 0,0 until manual layout pass */
  readonly gridCol:          number;
  readonly gridRow:          number;
  /** Algebraic grid id (e.g. K8) on GRID_21X15 board */
  readonly boardIndex?:     number;
}

// ── Character ─────────────────────────────────────────────────────────────────

export interface Character {
  readonly id:               CharacterId;
  readonly displayName:      string;
  readonly pawnColor:        string;           // CSS color string
  readonly position:         CellId;
  readonly status:           CharacterStatus;
  readonly eliminationCause: EliminationCause | null;
  readonly controlledBy:     PlayerId | null;  // null = neutral / unassigned
  readonly isPortraitHeir:   boolean;          // true if this is the current portrait heir
  readonly isOnRedChair:     boolean;          // false once pawn leaves starting position
}

// ── Trap ──────────────────────────────────────────────────────────────────────

export interface TrapState {
  readonly trapId:             TrapId;
  readonly label:              string;
  readonly state:              TrapStateValue;
  /** Cell(s) the trap occupies (skull space) */
  readonly targetCells:        CellId[];
  /** Cell(s) where characters are eliminated when trap fires */
  readonly eliminatesOnCells:  CellId[];
}

// ── Detective Track ───────────────────────────────────────────────────────────

export interface DetectiveTrack {
  readonly currentStep:   number;
  readonly maxSteps:      number;     // when currentStep >= maxSteps, game ends
  readonly trackCells:    CellId[];   // detective position cells (detective track)
  readonly isAtExit:      boolean;    // currentStep >= maxSteps
}

// ── Fireplace Portrait (Heir frame) ───────────────────────────────────────────

export interface FireplacePortrait {
  /** May be `AUNT_AGATHA` at game start; becomes a guest after first doubles rotation. */
  readonly currentHeirId:      PortraitHeirId;
  /** Shuffled portrait stack; index 0 is the card showing in the frame. */
  readonly portraitStack:      readonly CharacterId[];
  readonly portraitHistory:    PortraitHeirId[];    // previously shown heirs
  readonly lastChangedOnTurn:  number;
  readonly lastChangedReason:  PortraitChangeReason;
}

// ── Action Card ───────────────────────────────────────────────────────────────

/**
 * Cards in the real game deck:
 *   - TRAP_CARD:      Matches a specific trap. Play to spring that trap.
 *   - WILD_CARD:      Matches any trap. Play to spring any trap.
 *   - DETECTIVE_CARD: When drawn from the deck, advance detective; never kept in hand.
 */
export interface ActionCard {
  readonly cardId:         CardId;
  readonly cardType:       CardType;
  readonly label:          string;
  readonly description:    string;
  /** Which trap this card matches. null for WILD_CARD and DETECTIVE_CARD. */
  readonly matchesTrapId:  TrapId | null;
  readonly matchesTrapIds?: readonly TrapId[];
  readonly isWild:         boolean;
  readonly isDetective:    boolean;
}

