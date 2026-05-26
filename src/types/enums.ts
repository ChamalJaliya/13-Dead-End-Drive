/**
 * enums.ts
 * All branded literal types and const-asserted tuples for the 13 Dead End Drive engine.
 * Rebuilt to match the REAL board game rules (Milton Bradley / Winning Moves Games).
 * No 'any' permitted anywhere in this codebase — enforced by tsconfig strict mode.
 */

// ── Characters (12 playable mansion guests) ───────────────────────────────────
// Aunt Agatha is portrait-only (see characterCatalog.ts).

export const CHARACTER_IDS = [
  'SMOTHERS', 'DUSTY', 'CHARITY', 'LULU', 'PARKER',
  'CLAY', 'BEAUREGARD_III', 'SPRITZY', 'MADAME_ASTRA', 'HICKORY',
  'PIERRE', 'POOPSIE',
] as const;

export type CharacterId = (typeof CHARACTER_IDS)[number];

/** Portrait-only opening card (not a pawn). */
export type PortraitHeirId = CharacterId | 'AUNT_AGATHA';

// ── Traps — canonical 5 from the real game ────────────────────────────────────
// Real game traps: Chandelier, Suit of Armor, Bookcase, Stairs, Fireplace

export const TRAP_IDS = [
  'CHANDELIER',
  'SUIT_OF_ARMOR',
  'BOOKCASE',
  'STAIRS',
  'FIREPLACE',
] as const;

export type TrapId = (typeof TRAP_IDS)[number];

// ── Scalar ID types ───────────────────────────────────────────────────────────

export type CellId   = string;   // e.g. 'LIBRARY' | 'RC_1' | 'EXIT_DOOR'
export type PlayerId = string;   // UUID v4
export type GameId   = string;   // UUID v4
export type CardId   = string;   // UUID v4

// ── Game Phase & Sub-Phase ────────────────────────────────────────────────────

/** `GRID_21X15` = mansion; `FIXTURE` = small adjacency graph for unit tests only. */
export type BoardVersion = 'GRID_21X15' | 'FIXTURE';

export type GamePhase =
  | 'LOBBY'
  | 'INITIALIZATION'
  | 'IN_PROGRESS'
  | 'GAME_OVER';

/**
 * Sub-phase state machine within a single turn:
 *
 * AWAITING_ROLL   → player must roll dice
 * FIRST_MOVE      → player moves first pawn (die1, or die1+die2 if combined)
 * AWAITING_TRAP_1 → first pawn landed on trap, awaiting play/draw/decline
 * SECOND_MOVE     → second pawn move (die2) when using split dice — different pawn
 *   Player may instead choose combined die1+die2 on one pawn before any move.
 * AWAITING_TRAP_2 → second character landed on trap, awaiting play/draw/decline
 * TURN_END        → turn actions exhausted, rotate to next player
 */
export type GameSubPhase =
  | 'AWAITING_ROLL'
  | 'FIRST_MOVE'
  | 'AWAITING_TRAP_1'
  | 'SECOND_MOVE'
  | 'AWAITING_TRAP_2'
  | 'TURN_END';

// ── Character & Trap Status ───────────────────────────────────────────────────

export type CharacterStatus =
  | 'ALIVE'
  | 'ELIMINATED'
  | 'ESCAPED';

export type TrapStateValue =
  | 'READY'    // trap is armed and on the board
  | 'SPENT';   // trap has been triggered; only CHANDELIER can be re-used in digital version

export type EliminationCause = 'TRAP' | 'DETECTIVE';

// ── Win Conditions ────────────────────────────────────────────────────────────

/**
 * HEIR_ESCAPED:      Portrait heir pawn moved to EXIT_DOOR; controlling player wins.
 * LAST_ALIVE:        All other players' character cards are gone; one player remains.
 * DETECTIVE_ARRIVED: Detective reaches front door; whoever controls the current
 *                    portrait heir wins (fixed from incorrect LAST_ALIVE logic).
 */
export type WinCondition =
  | 'HEIR_ESCAPED'
  | 'LAST_ALIVE'
  | 'DETECTIVE_ARRIVED';

export type PortraitChangeReason =
  | 'OPENING_AGATHA'
  | 'INITIAL_DRAW'
  | 'DOUBLES_ROLL'
  | 'HEIR_ELIMINATED';

/** Detective has 10 active slots; step 10 is "at the door". */
export const DETECTIVE_TRACK_MAX_STEPS = 10 as const;

// ── Board Cell Types ──────────────────────────────────────────────────────────

export type CellType =
  | 'ROOM'
  | 'CORRIDOR'
  | 'TRAP_ZONE'          // skull space — trap can be sprung here
  | 'TRAP_DRAW'          // board space — draw trap card on landing
  | 'RED_CHAIR'          // starting positions; special movement rules apply
  | 'SECRET_PASSAGE'     // can teleport to any other secret passage for 1 pip
  | 'THRESHOLD'          // square before exit doorway
  | 'EXIT'               // front door — heir escapes here to win
  | 'DETECTIVE_TRACK'    // outside the mansion; detective moves here
  | 'TABLE'              // dining table obstacle
  | 'STATUE'             // suit of armor statue obstacle
  | 'FIREPLACE'          // fireplace obstacle
  | 'BOOKSHELF'          // bookshelf obstacle
  | 'STAIRCASE'          // staircase obstacle
  | 'COUCH'              // couch/sofa obstacle
  | 'VASE'               // decorative vase/urn obstacle (E1)
  | 'WRITING_TABLE'      // writing desk obstacle (Q1:S1, 3 squares)
  | 'PAINTING'           // painting board on easel (F6/G6/G5, L-shape)
  | 'PIANO';             // piano & piano bench obstacle (C9:E11, 3x3)

/** Canonical board: 21 columns × 15 rows (algebraic A–U, rows 1–15). */
export const GRID_COLUMNS = 21 as const;
export const GRID_ROWS = 15 as const;

// ── Card Types — Real game deck ───────────────────────────────────────────────
/**
 * The real deck contains three card types:
 *   TRAP_CARD:      Matches a specific trap.
 *   WILD_CARD:      Can be played to spring ANY trap.
 *   DETECTIVE_CARD: When drawn, advances the detective one step; never kept in hand.
 */
export type CardType =
  | 'TRAP_CARD'
  | 'WILD_CARD'
  | 'DETECTIVE_CARD';

export type MovementDie = 1 | 2 | 3 | 4 | 5 | 6;

/** Movement pips for a single move (one die, or combined die1 + die2 up to 12). */
export type PipCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

/** After rolling, player chooses one pawn with both dice or two pawns with die1 then die2. */
export type MovementPlan = 'SPLIT' | 'COMBINED';

// On doubles: portrait may be changed + movement options differ.

export type SocketErrorCode =
  | 'INVALID_MOVE'          // illegal path or pip count mismatch
  | 'NOT_YOUR_TURN'         // event from wrong player
  | 'CHARACTER_NOT_YOURS'   // character not controlled by caller
  | 'TRAP_ALREADY_SPENT'    // attempt to fire a SPENT trap
  | 'CARD_NOT_IN_HAND'      // card not found in player hand
  | 'WRONG_TRAP_CARD'       // trap card does not match pending trap
  | 'GAME_ALREADY_OVER'     // action after GAME_OVER phase
  | 'MALFORMED_PAYLOAD'     // schema validation failure
  | 'INVALID_CARD_PAYLOAD'  // missing required subfield in card play event
  | 'IDEMPOTENCY_CONFLICT'  // duplicate eventId already processed
  | 'ROOM_FULL'             // lobby is full (maximum 4 players reached)
  | 'ROOM_NOT_FOUND'        // room session does not exist in memory/store
  | 'GAME_ALREADY_STARTED'  // cannot join if phase is not LOBBY
  | 'UNAUTHORIZED_ACTION'   // socket is not mapped or authenticated as player
  | 'NO_PENDING_TRAP';      // no trap awaiting resolution
