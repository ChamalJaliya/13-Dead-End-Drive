# G01 — 13 Dead End Drive Digital Multiplayer Game (SRS)

**Source:** `G01_ 13 Dead End Drive  Digital Multiplayer Game.docx.pdf` (11 pages)  
**Role:** Authoritative product requirements for **STANDARD** (`ruleProfile: 'STANDARD'`) engine behavior.

This is the **1993 Hasbro** digital adaptation (2–4 players). It is **not** the 2002 sequel (*1313 Dead End Drive*).

---

## Traceability

| G01 section | Requirement | Implementation |
|-------------|-------------|----------------|
| §4 | Hidden identity — opponents cannot see your rooting cards | `filterStateForPlayer`, broadcast pipeline |
| §5.1.2 | 21×15 board, 12 pawns, portrait, 2D/3D HUD | Client + `GRID_21X15` |
| §5.1.3 | Split/combined movement, opening chairs, doubles portrait, one pawn per cell | `movementPlan`, `chairPhase`, `turnOrchestrator` |
| §5.1.4 | Five traps; 29-card deck (10 detective / 4 wild / 5 single / 10 dual); trap + detective chain | `trapEvaluator`, `cardDeck`, `data/gdd_trap_deck.json` |
| §5.1.5 | Heir escape, last survivor, detective arrival | `winCondition.ts` |
| §5.2 | Lobby, host start (2–4 players), settings (player count, default view) | Lobby / Colyseus (partial) |

### Product decisions not spelled out in G01

| Topic | Decision |
|-------|----------|
| Rooting deal | **2p = 6**, **3p = 4**, **4p = 3** — all in `characterIds`; no `secretCharacterIds` deal |
| Chair phase | No **combined** dice until **all** pawns leave dining chairs (stricter than PDF wording) |

---

## Win conditions (§5.1.5)

1. **Heir escape** — Portrait guest reaches front door alive; player holding **that** guest’s rooting card wins.  
2. **Last survivor** — Only one player has a living rooted guest.  
3. **Detective arrival** — Detective at step 10; player holding current portrait guest’s rooting card wins.

---

## Advanced rules (RFC 007)

Optional modules (`ADVANCED` + `enabledModules`) are **not** in G01. Phase 1 adds `ruleProfile` / registry stub only; lobby toggles are Phase 2.

---

## References

- Player guide: [`docs/HOW_TO_PLAY.md`](../HOW_TO_PLAY.md)  
- Engine mapping: [`.context/board_rules_13_ded.md`](../../.context/board_rules_13_ded.md)  
- RFC 007: [`.context/rfc/rfc_007_advanced_rule_engine.md`](../../.context/rfc/rfc_007_advanced_rule_engine.md)
