from fastapi import APIRouter, HTTPException

from app.config import LLM_ENABLED
from app.schemas import BotDecisionRequest, BotDecisionResponse
from app.strategies.heuristic import pick_heuristic_index
from app.strategies.llm import pick_llm_or_fallback

router = APIRouter()


@router.post("/v1/decide", response_model=BotDecisionResponse)
def decide(request: BotDecisionRequest) -> BotDecisionResponse:
    if not request.legalActions:
        raise HTTPException(status_code=422, detail="legalActions must not be empty")

    n = len(request.legalActions)
    strategy_used = request.strategy

    if request.strategy == "LLM" and LLM_ENABLED:
        index, rationale, used = pick_llm_or_fallback(request)
        if not used:
            strategy_used = "HEURISTIC"
    else:
        if request.strategy == "LLM":
            strategy_used = "HEURISTIC"
        index, rationale = pick_heuristic_index(
            request.legalActions,
            request.maskedState,
            request.botPlayerId,
            request.difficulty,
        )

    if index < 0 or index >= n:
        raise HTTPException(status_code=422, detail="actionIndex out of range")

    return BotDecisionResponse(
        actionIndex=index,
        confidence=0.75,
        rationale=rationale,
        strategyUsed=strategy_used,
    )
