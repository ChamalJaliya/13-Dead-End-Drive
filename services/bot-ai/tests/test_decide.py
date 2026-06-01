from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_decide_returns_valid_index():
    res = client.post(
        "/v1/decide",
        json={
            "gameId": "g1",
            "botPlayerId": "player-bot-01",
            "difficulty": "NORMAL",
            "strategy": "HEURISTIC",
            "maskedState": {"players": {"player-bot-01": {"characterIds": []}}},
            "legalActions": [
                {
                    "optionId": "roll",
                    "kind": "ROLL_DICE",
                    "summary": "Roll",
                    "event": {"type": "ROLL_DICE", "gameId": "g1", "playerId": "player-bot-01"},
                }
            ],
        },
    )
    assert res.status_code == 200
    body = res.json()
    assert body["actionIndex"] == 0
    assert body["strategyUsed"] == "HEURISTIC"


def test_decide_rejects_empty_legal():
    res = client.post(
        "/v1/decide",
        json={
            "gameId": "g1",
            "botPlayerId": "player-bot-01",
            "difficulty": "NORMAL",
            "strategy": "HEURISTIC",
            "maskedState": {},
            "legalActions": [],
        },
    )
    assert res.status_code == 422
