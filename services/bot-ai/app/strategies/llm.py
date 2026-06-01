"""LLM strategy stub — falls back to heuristic until OPENAI is wired."""

from __future__ import annotations

from app.schemas import BotActionOption, BotDecisionRequest, BotDifficulty
from app.strategies.heuristic import pick_heuristic_index


def pick_llm_or_fallback(
    request: BotDecisionRequest,
) -> tuple[int, str, bool]:
    """Returns (index, rationale, used_llm)."""
    idx, rationale = pick_heuristic_index(
        request.legalActions,
        request.maskedState,
        request.botPlayerId,
        request.difficulty,
    )
    return idx, f"LLM unavailable; {rationale}", False
