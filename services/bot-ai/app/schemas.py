from typing import Any, Literal

from pydantic import BaseModel, Field

BotDifficulty = Literal["EASY", "NORMAL", "HARD"]
BotStrategy = Literal["HEURISTIC", "LLM"]


class BotActionOption(BaseModel):
    optionId: str
    kind: str
    summary: str
    event: dict[str, Any]


class BotDecisionRequest(BaseModel):
    gameId: str
    botPlayerId: str
    difficulty: BotDifficulty = "NORMAL"
    strategy: BotStrategy = "HEURISTIC"
    maskedState: dict[str, Any]
    legalActions: list[BotActionOption] = Field(min_length=1)


class BotDecisionResponse(BaseModel):
    actionIndex: int
    confidence: float
    rationale: str
    strategyUsed: BotStrategy
