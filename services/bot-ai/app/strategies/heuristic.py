"""Heuristic bot — scores precomputed legal actions."""

from __future__ import annotations

import random
from typing import Any

from app.schemas import BotActionOption, BotDifficulty


def _rooting_ids(masked_state: dict[str, Any], bot_player_id: str) -> list[str]:
    players = masked_state.get("players") or {}
    player = players.get(bot_player_id) or {}
    visible = player.get("characterIds") or []
    secret = player.get("secretCharacterIds") or []
    return list(visible) + list(secret)


def _score_action(
    action: BotActionOption,
    masked_state: dict[str, Any],
    rooting: list[str],
    difficulty: BotDifficulty,
) -> float:
    kind = action.kind
    score = 0.0

    if kind == "ROLL_DICE":
        return 100.0

    if kind == "CHOOSE_MOVEMENT_PLAN":
        plan = (action.event.get("payload") or {}).get("plan", "SPLIT")
        return 8.0 if plan == "SPLIT" else 5.0

    if kind == "CHANGE_PORTRAIT":
        stack = (masked_state.get("activePortrait") or {}).get("portraitStack") or []
        heir = stack[0] if stack else None
        return 25.0 if heir in rooting else -5.0

    if kind == "MOVE_PAWN":
        payload = action.event.get("payload") or {}
        char_id = payload.get("characterId")
        to_cell = payload.get("toCell")
        if char_id in rooting:
            if to_cell == "K1":
                score += 40.0
            portrait = (masked_state.get("activePortrait") or {}).get("currentHeirId")
            if portrait == char_id:
                score += 15.0
        elif (masked_state.get("activePortrait") or {}).get("currentHeirId") == char_id:
            score -= 20.0
        board = masked_state.get("board") or {}
        dest = board.get(to_cell) or {}
        if dest.get("trapRef"):
            score += 8.0

    elif kind == "PLAY_TRAP_CARD":
        score += 15.0

    elif kind == "DRAW_TRAP_CARD":
        score += 3.0

    elif kind == "DECLINE_TRAP":
        score += 1.0

    if difficulty == "EASY":
        score += (random.random() - 0.5) * 12.0
    elif difficulty == "HARD":
        score *= 1.15

    return score


def pick_heuristic_index(
    legal_actions: list[BotActionOption],
    masked_state: dict[str, Any],
    bot_player_id: str,
    difficulty: BotDifficulty,
) -> tuple[int, str]:
    rooting = _rooting_ids(masked_state, bot_player_id)
    best_idx = 0
    best_score = float("-inf")

    for idx, action in enumerate(legal_actions):
        s = _score_action(action, masked_state, rooting, difficulty)
        if s > best_score:
            best_score = s
            best_idx = idx

    return best_idx, f"Heuristic score {best_score:.1f}"
