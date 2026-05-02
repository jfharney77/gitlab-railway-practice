import os
import random
import time
import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

_raw_origins = os.getenv("CORS_ORIGINS", "*")
cors_origins = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

PRODUCTS = [
    {"name": "Air Fryer", "price": 129},
    {"name": "Bluetooth Speaker", "price": 79},
    {"name": "Coffee Maker", "price": 149},
    {"name": "Electric Kettle", "price": 45},
    {"name": "Instant Pot", "price": 99},
    {"name": "Kitchen Blender", "price": 89},
    {"name": "Yoga Mat", "price": 35},
    {"name": "Desk Lamp", "price": 55},
    {"name": "Backpack", "price": 75},
    {"name": "Stand Mixer", "price": 299},
    {"name": "Toaster Oven", "price": 69},
    {"name": "Electric Griddle", "price": 49},
    {"name": "Rice Cooker", "price": 39},
    {"name": "Handheld Vacuum", "price": 59},
    {"name": "Heated Blanket", "price": 45},
]

HIGHER_MESSAGES = [
    "Higher! Think bigger!",
    "Too low! Go higher!",
    "Come on up! The price is higher!",
    "Not there yet — go higher!",
]

LOWER_MESSAGES = [
    "Lower! Bring it down!",
    "Too high! Go lower!",
    "Whoa, that's too much — lower!",
    "Come on down a bit — lower!",
]

games: dict = {}


class GuessRequest(BaseModel):
    game_id: str
    guess: float


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/game/start")
def start_game():
    product = random.choice(PRODUCTS)
    game_id = str(uuid.uuid4())
    games[game_id] = {
        "product_name": product["name"],
        "price": product["price"],
        "start_time": time.time(),
        "active": True,
    }
    return {"game_id": game_id, "product_name": product["name"]}


@app.post("/api/game/guess")
def make_guess(req: GuessRequest):
    game = games.get(req.game_id)
    if not game:
        return {"result": "error", "message": "Game not found."}

    if not game["active"]:
        return {"result": "ended", "message": "This game has already ended."}

    elapsed = time.time() - game["start_time"]
    if elapsed > 30:
        game["active"] = False
        return {
            "result": "you_lose",
            "message": f"Time's up! The price was ${game['price']}. Better luck next time!",
            "price": game["price"],
        }

    price = game["price"]
    guess = req.guess

    if guess == price:
        game["active"] = False
        remaining = round(30 - elapsed, 1)
        return {
            "result": "you_win",
            "message": f"${int(price)} — that's it! YOU WIN with {remaining}s to spare! 🎉",
            "price": price,
        }
    elif guess < price:
        return {"result": "higher", "message": random.choice(HIGHER_MESSAGES)}
    else:
        return {"result": "lower", "message": random.choice(LOWER_MESSAGES)}
