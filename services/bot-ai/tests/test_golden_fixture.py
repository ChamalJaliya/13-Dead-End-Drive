"""Load shared golden JSON — TS/Python contract gate (RFC 006)."""
import json
from pathlib import Path

from app.decide import decide
from app.schemas import BotDecisionRequest

GOLDEN = (
    Path(__file__).resolve().parents[3]
    / "data"
    / "fixtures"
    / "bot-decision-request.sample.json"
)


def test_golden_fixture_parses_and_decide_returns_valid_index():
    raw = json.loads(GOLDEN.read_text(encoding="utf-8"))
    request = BotDecisionRequest.model_validate(raw)
    response = decide(request)
    assert 0 <= response.actionIndex < len(request.legalActions)
