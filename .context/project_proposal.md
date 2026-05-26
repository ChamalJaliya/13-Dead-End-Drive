# Project Proposal
## *13 Dead End Drive* — Digital Multiplayer Adaptation

---

> **Prepared by:** Development Team  
> **Date:** May 27, 2026  
> **Version:** 1.1  
> **Status:** Active Development · Seeking Collaboration / Funding / Partnership

---

## 1. Executive Summary

**13 Dead End Drive** is a browser-based, real-time multiplayer digital adaptation of the beloved 1993 Hasbro mystery board game of the same name. Players compete in a suspenseful 2–4 player experience set in a Victorian haunted mansion — secretly holding rooting loyalty cards, moving any guest pawn on the board, resolving trap encounters, and racing to satisfy one of three win conditions before the detective reaches the front door.

This proposal outlines the project's vision, **current development status (accurate as of May 27, 2026)**, technical architecture, remaining milestones, and opportunities for collaboration or investment to bring the title to public release.

---

## 2. Project Background & Vision

### 2.1 The Original Game

The 1993 *13 Dead End Drive* is a classic hidden-identity, trap-and-bluff strategy game in which:

- **2–4 players** secretly hold "rooting" loyalty cards tied to mansion character pawns
- Players strategically move **any** pawn across a trap-filled board — helping their own characters survive while eliminating rivals
- The **Fireplace Portrait** determines the current featured heir — the guest shown in the portrait whose escape (or survival) drives the endgame
- **Mechanical traps** (chandelier, suit of armor, bookcase, stairs, fireplace) can eliminate pawns when sprung
- A **Detective token** advances toward the mansion door on a **10-step track** — when it arrives, the player rooting for the **current portrait guest** wins
- Three distinct **win conditions** create dynamic, unpredictable gameplay

### 2.2 The Digital Opportunity

While the physical game is beloved, it is out of print and difficult to play remotely. A faithful, feature-rich digital adaptation unlocks:

- **Accessibility**: Play from anywhere, with friends across the globe
- **Automation**: Server-authoritative rules, trap resolution, win checks, and state sync reduce table errors
- **Enhanced UX**: Dual 2D/3D views, cinematic trap feedback, collapsible HUD, and real-time event logs
- **Scalability**: Foundation for online matchmaking, tournaments, and AI opponents

---

## 3. Current Development Status

The project is actively under development. **Core engine, local multiplayer transport, and primary client UI are complete** for solo and same-browser multiplayer play.

### 3.1 Phase Completion Overview

| Phase | Feature Area | Status |
|-------|-------------|--------|
| **Phase 1** | Architecture & Data Modelling | ✅ **Complete** |
| **Phase 2** | Core Engine (pathing, traps, cards, win, turns) | ✅ **Complete** |
| **Phase 3.1–3.5** | Session manager, Supabase layer, broadcast, idempotency, local multiplayer | ✅ **Complete** |
| **Phase 3.6** | Reconnect & hand projection | 🔲 **Pending** |
| **Phase 4** | Client UI (2D/3D board, HUD, animations, lobby, game over) | ✅ **Complete** |

> **Total test suite: 82/82 tests GREEN** (`npx vitest run`, 21 spec files including React UI specs).

### 3.2 What Is Already Working

Visitors can launch the application (`npm run dev`) and experience:

- **Solo or local multiplayer** — host/join rooms with cross-tab real-time sync
- **Full turn loop** — roll 2d6, choose split or combined movement, optional portrait change on doubles, move pawns, resolve traps (play / draw / decline), advance detective on detective cards
- **21×15 mansion board** — canonical `GRID_21X15` grid (315 cells, algebraic `A1`–`U15`), not a legacy node graph
- **12 dining-chair spawns** — pawns start on chairs `J5`–`L9`; opening-chair rules enforced (clear the table before free movement)
- **Dual render mode** — 2D canvas (`Scene2D`) and immersive 3D WebGL (`Scene3D` / React Three Fiber)
- **Gameplay HUD** — featured heir card, collapsible estate console, dice panel, rooting display, event log, **bottom hand panel**, **deck/discard widget**, **10-slot detective track**
- **Win & game over** — heir escape to `K1`, last player with living rooted guests, detective at door (step 10)

---

## 4. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript 5.5 (strict) |
| **3D** | Three.js · React Three Fiber · @react-three/drei |
| **Build** | Vite 5 |
| **State** | Zustand 5 |
| **Backend / Realtime** | Supabase (persistence + WebSocket-style channels) |
| **Game engine** | Custom pure-functional TypeScript (`src/engine/`) |
| **Styling** | Tailwind CSS v4 |
| **Testing** | Vitest 2.x — **82 tests**, all green (`*.spec.ts` + `*.spec.tsx`, happy-dom) |
| **Type safety** | Strict mode · zero `any` · discriminated unions on events and card payloads |

---

## 5. Architecture Overview

Three cleanly separated layers:

### 5.1 Pure Game Engine (`src/engine/`)

Every action is modelled as immutable state transition:

```
(GameState, Event) → GameState
```

The engine provides:

- **Path validation** — graph-based adjacency on `GRID_21X15` (orthogonal movement, furniture blockers)
- **Opening chair phase** — must vacate dining chairs before moving other pawns; no returning to chair cells
- **Trap resolution** — on skull/trap landing: play matching card, draw from deck, or decline; detective cards advance track and force redraw
- **Portrait system** — opens as **Aunt Agatha**; optional rotation on doubles; forced rotation when featured guest dies
- **Detective track** — **10 steps**; step 10 = at door
- **Win detection** — heir at exit (`K1`), last player with living rooted guests, detective arrival

Engine functions are **synchronous, immutable, and side-effect-free** — suitable for authoritative server replay and delta sync.

### 5.2 Network Transport (`src/network/`)

- Full `GameState` broadcast with **per-player masking** (opponents cannot see hands or rooting; owners always see their own secret cards)
- Idempotent event routing (`IDEMPOTENCY_CONFLICT` guard)
- Room lifecycle (create, join, play) via session manager + Supabase schema
- **Local multiplayer client** for same-machine / cross-tab play without external hosting

### 5.3 Client Rendering (`src/client/`)

- **2D Canvas** — pan/zoom board, pawn tokens, detective marker, move highlights
- **3D WebGL** — mansion furniture, dining table, trap cinematics, pawn name tags, compass (camera reset)
- **HUD overlays** — `HUD3D`, `HandPanel`, `DeckWidget`, `DetectiveWidget`, `DicePanel`, `LobbyScreen`, `GameOverScreen`

---

## 6. Key Game Features (Implemented Rules)

### Hidden Identity & Bluffing

Players hold visible and (in 2-player games) secret rooting cards. **Any active player may move any alive pawn.** When a guest is eliminated, only that guest's rooting owner is revealed (`exposedRooting`); other secrets stay hidden until game over.

### Trap Deck & Skull Spaces

**29-card deck:** 10 detective, 4 wild, 5 single-trap, 10 dual-trap combination cards.

On landing a **trap zone**, the active player chooses:

- **Play** a matching trap or wild from hand (optional elimination), or  
- **Draw** one card, or  
- **Decline** (pawn survives; trap remains ready)

**Detective cards:** revealed, advance detective one step, discarded, draw again until non-detective. Trap/wild cards may be **retained in hand**.

Five board traps:

| Trap | Role |
|------|------|
| **Chandelier** | Ceiling drop elimination zone |
| **Suit of Armor** | Armor strike zone |
| **Bookcase** | Crushing zone |
| **Stairs** | Staircase hazard zone |
| **Fireplace** | Fireplace hazard zone |

### Fireplace Portrait

- Game **starts with Aunt Agatha** in the portrait (not yet a movable heir).
- On **doubles**, active player **may** rotate to the top guest on the shuffled stack (optional).
- When the featured portrait guest is **eliminated**, portrait rotates to the next guest.

### Detective Track

- **10 active slots**; **slot 10 = front door** (`K1` area).
- Each detective card drawn advances the track by one.
- When the detective reaches the door, the player holding the **current portrait guest's** rooting card wins (`DETECTIVE_ARRIVED`).

### Movement

- Roll **2d6** every turn.
- **Split:** pawn A moves exactly die1, then a **different** pawn B moves exactly die2.
- **Combined:** one pawn moves die1 + die2, then turn ends.
- **Doubles:** same movement options; optional portrait change only (no mandatory extra draw).

### Win Conditions

| Condition | Winner |
|-----------|--------|
| Featured portrait guest reaches **`K1`** alive | Player rooting for that guest |
| Only one player has a **living rooted** guest | That player |
| Detective reaches **step 10** (door) | Player rooting for **current portrait guest** |

---

## 7. Remaining Roadmap

### Near-term

| Item | Description |
|------|-------------|
| **Phase 3.6** | Reconnect & hand projection for mid-game disconnects |
| **Polish** | Mobile/touch UX, audio, accessibility pass |

### Medium-term

| Item | Description |
|------|-------------|
| **Full online multiplayer** | Cross-device rooms, invite links beyond local/cross-tab |
| **Trap deck extensions** | Optional GDD hand cards (portrait change / secret passage as deck cards) if desired |
| **Spectator / replay** | Read-only observers, event log replay |

### Explicitly out of scope (this release)

| Excluded | Reason |
|----------|--------|
| **1313 Dead End Drive** sequel mechanics | Different product (will board, midnight clock, etc.) |
| **Secret passage teleports** on 21×15 board | Deferred |
| **Trap draw squares** on board | Trap cards drawn only on skull/trap landings |
| **Legacy 118-node board** | Removed; `GRID_21X15` is canonical |

### Longer-term

| Feature | Description |
|---------|-------------|
| AI opponents | Bots for solo or mixed lobbies |
| Accounts & leaderboards | Persistent profiles and stats |
| Tournaments | Bracketed play |
| Sound & music | Ambient mansion audio, trap SFX |
| PWA / app store | Installable web app distribution |

---

## 8. What We're Looking For

### Collaborators

- **UI/UX polish** — mobile layout, tutorial flow, accessibility  
- **Sound design** — trap and ambient audio  
- **QA / playtesting** — structured 2–4 player sessions for edge cases  

### Technical Partners

Platforms for indie browser games, realtime multiplayer, or interactive experiences.

### Publishers / Distributors

Web portals, PWA distribution, or licensing for classic tabletop revivals.

### Funding / Grants

Independent game development, cultural preservation of out-of-print titles.

---

## 9. Project Metrics at a Glance

| Metric | Value |
|--------|-------|
| **Test suite** | 82/82 passing (100% green) |
| **Core engine modules** | 12+ pure-functional modules |
| **Playable board** | 21×15 grid (`GRID_21X15`), 315 cells |
| **Start positions** | 12 dining chairs (`J5`–`L9`) |
| **Exit cell** | `K1` (front door) |
| **Character pawns** | 12 guests |
| **Trap mechanisms** | 5 (chandelier, armor, bookcase, stairs, fireplace) |
| **Trap deck** | 29 cards |
| **Detective track** | 10 steps |
| **Render modes** | 2D Canvas + 3D WebGL |
| **Realtime transport** | Supabase + local multiplayer client |
| **TypeScript** | Strict · zero `any` |
| **Source size (`src/`)** | ~590 KB TypeScript/TSX |

---

## 10. Contact & Next Steps

1. **Request a live demo** — walkthrough of solo/local multiplayer build  
2. **Review the codebase** — available under agreed terms  
3. **Discuss collaboration** — scope, timeline, and contribution model  

---

*This proposal is confidential and intended for the recipient only. Game mechanics are based on the original 1993 Hasbro board game (*13 Dead End Drive*, not the 2002 sequel *1313 Dead End Drive*). This is an independent digital adaptation project.*

---

**Document version:** 1.1 · **Last updated:** May 27, 2026 · **Aligned with:** `.context/system_state.md`, `.context/board_rules_13_ded.md`
