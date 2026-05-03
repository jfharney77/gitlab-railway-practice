import time

import pytest
from fastapi.testclient import TestClient

from main import app, games

client = TestClient(app)


def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_start_game_returns_game_id_and_product():
    res = client.post("/api/game/start")
    assert res.status_code == 200
    data = res.json()
    assert "game_id" in data
    assert "product_name" in data
    assert isinstance(data["product_name"], str)


def test_guess_higher():
    res = client.post("/api/game/start")
    game_id = res.json()["game_id"]
    games[game_id]["price"] = 100

    res = client.post("/api/game/guess", json={"game_id": game_id, "guess": 50})
    assert res.json()["result"] == "higher"


def test_guess_lower():
    res = client.post("/api/game/start")
    game_id = res.json()["game_id"]
    games[game_id]["price"] = 100

    res = client.post("/api/game/guess", json={"game_id": game_id, "guess": 150})
    assert res.json()["result"] == "lower"


def test_guess_exact_wins():
    res = client.post("/api/game/start")
    game_id = res.json()["game_id"]
    games[game_id]["price"] = 100

    res = client.post("/api/game/guess", json={"game_id": game_id, "guess": 100})
    data = res.json()
    assert data["result"] == "you_win"
    assert data["price"] == 100


def test_guess_after_time_expires_loses():
    res = client.post("/api/game/start")
    game_id = res.json()["game_id"]
    games[game_id]["start_time"] = time.time() - 31  # simulate 31s elapsed

    res = client.post("/api/game/guess", json={"game_id": game_id, "guess": 50})
    data = res.json()
    assert data["result"] == "you_lose"


def test_guess_on_unknown_game_returns_error():
    res = client.post("/api/game/guess", json={"game_id": "fake-id", "guess": 50})
    assert res.json()["result"] == "error"


def test_guess_after_win_is_rejected():
    res = client.post("/api/game/start")
    game_id = res.json()["game_id"]
    games[game_id]["price"] = 100

    client.post("/api/game/guess", json={"game_id": game_id, "guess": 100})  # win
    res = client.post("/api/game/guess", json={"game_id": game_id, "guess": 100})  # replay
    assert res.json()["result"] == "ended"
