# Jira import guide — 13 Dead End Drive (DED)

This folder contains CSV backlogs for importing into a Jira Cloud **Kanban** project with key **DED**.

| File | Rows | Purpose |
|------|------|---------|
| [`ded-jira-backlog-historical.csv`](ded-jira-backlog-historical.csv) | **64** | Phases 1–5 + **RFC 007 (E13)** + **E06 polish** — all **Done** (audit trail) |
| [`ded-jira-backlog-mvp.csv`](ded-jira-backlog-mvp.csv) | **53** | **13 epics** + active MVP backlog + post-v1 |

**Last regenerated:** 2026-06-01 — G01 rooting, RFC 007 phases 1–5, 160/160 Vitest green.

Import **historical first**, then **mvp**, so epic names exist before stories link to them.

---

## 1. Create the Jira project

1. **Jira → Create project → Kanban**.
2. Project name: **13 Dead End Drive**
3. Project key: **DED**
4. Note your site’s **issue type** names (e.g. `Epic`, `Story`, `Task`). CSV `Issue Type` must match exactly.

### Recommended Kanban columns

Map statuses during/after import:

| CSV Status | Kanban column |
|------------|----------------|
| Backlog | Backlog |
| Ready | Ready |
| To Do | Ready (or Backlog) |
| In Progress | In Progress |
| In Review | In Review |
| QA / UAT | *(add column)* or use **In Review** |
| Done | Done |

**WIP limits (Team Lead):** Ready ≤ 8 · In Progress ≤ 5 · In Review ≤ 3 · QA ≤ 5

---

## 2. Prepare Jira fields (before import)

Create these in **Project settings** if they do not exist globally.

### Components

| Name | Description |
|------|-------------|
| `engine` | `@ded/engine`, rules, `processTurn`, RFC 007 modules |
| `network` | Colyseus, Supabase, `@ded/network` |
| `client` | React, 3D/2D, HUD, FX, `LobbyRulesPanel` |
| `bot-ai` | `services/bot-ai`, orchestrator |
| `infra` | Docker, CI, deploy, env |
| `docs` | `.context/*`, G01 SRS, play modes |

### Labels

`role:pm` · `role:ba` · `role:tl` · `role:dev` · `role:qa` · `mvp-v1` · `post-v1` · `done-legacy` · **`rfc-007`**

### Fix versions

| Version | Meaning |
|---------|---------|
| `v0.1-internal` | Shipped Phases 1–5 + RFC 007 + E06 polish |
| `v1.0-mvp-beta` | **MVP public beta** (target) |
| `v1.1` | Post-MVP (online lobby rules, custom house rules, etc.) |

### Custom field (optional but recommended)

Add a text custom field **External ID** (e.g. `customfield_10xxx`) and map the CSV **External ID** column to it. This preserves stable ids like `DED-701` before Jira assigns `DED-123`.

---

## 3. Import order

### Step A — Historical backlog

1. **Jira settings → System → External imports → CSV** (or **Jira → Import** depending on plan).
2. Upload [`ded-jira-backlog-historical.csv`](ded-jira-backlog-historical.csv).
3. Map columns:

| CSV column | Jira field |
|------------|------------|
| Issue Type | Issue Type |
| External ID | External ID *(custom)* or Description prefix |
| Epic Link | Epic Link *(parent epic key, e.g. `DED-E13`)* |
| Summary | Summary |
| Description | Description |
| Priority | Priority |
| Status | Status |
| Labels | Labels |
| Components | Component/s |
| Fix Version/s | Fix Version/s |
| Story Points | Story Points *(if enabled)* |

4. Set **Project** = DED.
5. Run import. Confirm **64** issues created.

**Historical includes:** E01–E05 engine/transport, **E13 RFC 007** (DED-1301–1311), **E06 polish** (DED-601–607), plus DED-803, DED-908, DED-1002, DED-1003, DED-1104.

### Step B — MVP backlog

1. Import [`ded-jira-backlog-mvp.csv`](ded-jira-backlog-mvp.csv) the same way.
2. **Epic Link** uses epic keys (`DED-E07`, `DED-E09`, …). Jira may also accept epic **Summary** text depending on import wizard — match your project’s Epic Link field config.
3. Confirm **53** issues (13 epics + 40 stories). Shipped epics E01–E06 and E13 are **pointers**; detailed stories are in the historical file.

### Step C — Verify epic links

1. Open **DED-E13** → child issues DED-1301–1311.
2. Open **DED-E07** → child issues DED-701–706.
3. If links are missing, bulk-edit stories and set **Parent** / **Epic Link** using **External ID**.

---

## 4. Board views (filters)

Create quick filters on the Kanban board:

| View name | JQL |
|-----------|-----|
| MVP active | `project = DED AND labels = mvp-v1 AND status != Done` |
| QA swimlane | `project = DED AND labels = role:qa` |
| Dev ready | `project = DED AND labels = role:dev AND status = Ready` |
| BA backlog | `project = DED AND labels = role:ba` |
| TL architecture | `project = DED AND (labels = role:tl OR component = infra)` |
| PM launch | `project = DED AND fixVersion = "v1.0-mvp-beta" AND labels = role:pm` |
| Post-v1 | `project = DED AND labels = post-v1` |
| RFC 007 audit | `project = DED AND labels = rfc-007` |

---

## 5. MVP v1 critical path (execution order)

1. ~~**E06 polish** + **E13 RFC 007**~~ — **Done** (historical import).
2. **E07** — Auth (DED-701–706) in parallel with BA/PM legal.
3. **E08** — Deploy staging (DED-801, 802, 804–806); DED-803 already Done (historical).
4. **E09** — Full QA on staging: STANDARD rules + **G01 rooting** (DED-905) + optional **ADVANCED** local (DED-905b); UAT DED-909.
5. **E11** — Beta launch (DED-1102 legal blocker, DED-1103 invite).

**Quality gates (Team Lead):**

```bash
npx vitest run --reporter=verbose   # 160/160, 41 files — 0 failures
npm run test:bot-ai
npm run lint:boundaries
```

Staging with `AUTH_REQUIRED=true` and real Supabase before UAT sign-off.

---

## 6. RACI (quick reference)

| Activity | PM | BA | TL | Full Stack | QA |
|----------|:--:|:--:|:--:|:----------:|:--:|
| Scope / MVP cut | A | R | C | I | C |
| Acceptance criteria | A | R | C | C | C |
| Architecture / RFC | I | C | A | R | I |
| Implementation | I | C | C | R | I |
| Playtest / UAT | A | C | I | I | R |
| Release sign-off | A | C | C | C | R |

*A = Accountable · R = Responsible · C = Consulted · I = Informed*

---

## 7. Troubleshooting import

| Problem | Fix |
|---------|-----|
| Epic Link not resolved | Import epics first; use External ID `DED-E13` as Epic Link value |
| Unknown Issue Type `Epic` | Enable epics: **Project settings → Features → Epics** |
| Status not found | Add missing statuses in workflow or map CSV status in import wizard |
| Labels truncated | Create labels in project before import |
| Duplicate External ID | Skip re-import; search `DED-701` in External ID field |

---

## 8. Source of truth in repo

Backlog content is derived from:

- [`.context/system_state.md`](../../.context/system_state.md) — phase status, 160 tests
- [`.context/play_modes.md`](../../.context/play_modes.md) — solo / local / online + lobby rules
- [`docs/DEVELOPER_SETUP.md`](../../docs/DEVELOPER_SETUP.md) — developer Docker & local setup
- [`.context/board_rules_13_ded.md`](../../.context/board_rules_13_ded.md) — rules fidelity (DED-904), G01 + ADVANCED
- [`.context/rfc/rfc_007_advanced_rule_engine.md`](../../.context/rfc/rfc_007_advanced_rule_engine.md) — E13 stories
- [`docs/requirements/G01_digital_multiplayer_srs.md`](../../docs/requirements/G01_digital_multiplayer_srs.md) — product SRS
- [`.cursor/plans/jira_kanban_backlog_9a1afb47.plan.md`](../../.cursor/plans/jira_kanban_backlog_9a1afb47.plan.md) — full epic/story catalog

**Regenerate CSVs:** edit the Node script in the plan or re-run the generator from the latest plan tables.

---

*Generated 2026-06-01 · Project: 13 Dead End Drive · MVP target: v1.0-mvp-beta*
