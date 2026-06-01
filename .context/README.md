# Context documentation index

Living project knowledge for **13 Dead End Drive**. Read before mutating code (see `.cursorrules` RULE 0).

| Document | Purpose |
|----------|---------|
| [system_state.md](system_state.md) | Phase status, module registry, test scoreboard |
| [board_rules_13_ded.md](board_rules_13_ded.md) | Canonical gameplay rules (G01 / 1993 digital) |
| [gdd_technical_blueprint.md](gdd_technical_blueprint.md) | GDD ↔ engine alignment matrix |
| [api_contracts.md](api_contracts.md) | Types, socket events, masking, changelog |
| [play_modes.md](play_modes.md) | Solo / local / online + lobby rules |
| [prompt_playbook.md](prompt_playbook.md) | Successful prompt patterns per milestone |
| [srs.md](srs.md) | Software requirements (BDD) |
| [sdd.md](sdd.md) | System design (state machine) |
| [project_proposal.md](project_proposal.md) | External-facing status summary |
| [database_schema.md](database_schema.md) | Supabase / Postgres JSONB shape |
| [ai_skills.md](ai_skills.md) | Agent role definitions |
| [docs/requirements/G01_digital_multiplayer_srs.md](../docs/requirements/G01_digital_multiplayer_srs.md) | Product SRS (authoritative) |
| [docs/HOW_TO_PLAY.md](../docs/HOW_TO_PLAY.md) | Player-facing rules |
| [docs/DEVELOPER_SETUP.md](../docs/DEVELOPER_SETUP.md) | Dev setup — Docker & local run guide |

## Data files (`/data`)

| File | Synced with |
|------|-------------|
| [gdd_board_nodes.json](../data/gdd_board_nodes.json) | `GRID_21X15_*`, obstacles, secret passages |
| [gdd_trap_deck.json](../data/gdd_trap_deck.json) | `buildDeck()` — 10 det / 4 wild / 5 single / 10 dual |

## RFCs (`/context/rfc/`)

| RFC | Topic | Status |
|-----|-------|--------|
| [rfc_001](rfc/rfc_001_spatial_engine.md) | Spatial / adjacency | Historical design |
| [rfc_002](rfc/rfc_002_trap_triggers.md) | Trap resolution | Implemented |
| [rfc_003](rfc/rfc_003_card_validation.md) | Card payloads | Implemented |
| [rfc_004](rfc/rfc_004_supabase_persistence.md) | DB persist | Implemented |
| [rfc_005](rfc/rfc_005_colyseus_nest_transport.md) | Online transport | Implemented |
| [rfc_006](rfc/rfc_006_clean_architecture.md) | `@ded/*` packages | Implemented |
| [rfc_007](rfc/rfc_007_advanced_rule_engine.md) | Rule profiles + modules | Phases 1–5 complete |

## Last full context sync

**2026-06-01** — G01 rooting, RFC 007, GDD JSON sync, 160 tests green.
