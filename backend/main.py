from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
import uvicorn
import os
from fastapi.middleware.cors import CORSMiddleware

# Import database models and setup
from models import Base, engine, get_db, User, Game

# Initialize FastAPI app
app = FastAPI(
    title="Snake Game API",
    version="1.0.0",
    description="API for the Snake Game application with multiplayer features",
)

# Add CORS middleware to fix OPTIONS request issues
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Create database tables
Base.metadata.create_all(bind=engine)


# Pydantic models
class LoginRequest(BaseModel):
    username: str


class LoginResponse(BaseModel):
    id: int
    username: str
    token: str


class UserCreate(BaseModel):
    username: str


class UserResponse(BaseModel):
    id: int
    username: str
    created_at: datetime


class LeaderboardEntry(BaseModel):
    id: int
    username: str
    score: int


class Player(BaseModel):
    id: int
    username: str
    score: int
    status: str  # playing, idle, finished
    game_mode: str  # pass-through, walls


class GameStart(BaseModel):
    user_id: int
    game_mode: str  # pass-through, walls


class ScoreUpdate(BaseModel):
    score: int


class GameStatusUpdate(BaseModel):
    status: str  # playing, idle, finished


class GameResponse(BaseModel):
    id: int
    user_id: int
    score: int
    game_mode: str  # pass-through, walls
    status: str  # playing, idle, finished
    created_at: datetime


# Helper functions
def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()


def create_user_in_db(db: Session, username: str) -> User:
    user = User(username=username)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_game_in_db(db: Session, user_id: int, game_mode: str) -> Game:
    game = Game(user_id=user_id, game_mode=game_mode)
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


def get_leaderboard_from_db(db: Session) -> List[LeaderboardEntry]:
    # Get top 10 players by highest score
    # This query gets the highest score for each user
    leaderboard_query = (
        db.query(User.id.label("user_id"), User.username, Game.score.label("score"))
        .join(Game)
        .filter(Game.status == "finished")
        .order_by(Game.score.desc())
        .limit(10)
    )

    leaderboard = []
    for user_id, username, score in leaderboard_query:
        leaderboard.append(LeaderboardEntry(id=user_id, username=username, score=score))

    return leaderboard


def get_players_from_db(db: Session) -> List[Player]:
    # Get all players currently playing
    players_query = (
        db.query(
            User.id.label("user_id"),
            User.username,
            Game.score,
            Game.status,
            Game.game_mode,
        )
        .join(Game)
        .filter(Game.status == "playing")
    )

    players = []
    for user_id, username, score, game_status, game_mode in players_query:
        players.append(
            Player(
                id=user_id,
                username=username,
                score=score,
                status=game_status,
                game_mode=game_mode,
            )
        )

    return players


# API Endpoints
@app.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate a user and return a token"""
    user = get_user_by_username(db, request.username)
    if not user:
        # Create new user if doesn't exist
        user = create_user_in_db(db, request.username)

    # In a real app, this would be a JWT token
    token = f"mock_token_for_{user.username}"

    return LoginResponse(id=user.id, username=user.username, token=token)


@app.post("/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user_endpoint(user_create: UserCreate, db: Session = Depends(get_db)):
    """Create a new user"""
    existing_user = get_user_by_username(db, user_create.username)
    if existing_user:
        raise HTTPException(status_code=409, detail="User already exists")

    user = create_user_in_db(db, user_create.username)
    return user


@app.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard_endpoint(db: Session = Depends(get_db)):
    """Get leaderboard data"""
    return get_leaderboard_from_db(db)


@app.get("/players", response_model=List[Player])
async def get_players_endpoint(db: Session = Depends(get_db)):
    """Get list of players with their current status"""
    return get_players_from_db(db)


@app.post("/games", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
async def start_game(game_start: GameStart, db: Session = Depends(get_db)):
    """Start a new game"""
    # Verify user exists
    user = db.query(User).filter(User.id == game_start.user_id).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")

    game = create_game_in_db(db, game_start.user_id, game_start.game_mode)
    return game


@app.put("/games/{game_id}/score", response_model=GameResponse)
async def update_score(
    game_id: int, score_update: ScoreUpdate, db: Session = Depends(get_db)
):
    """Update game score"""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    game.score = score_update.score
    db.commit()
    db.refresh(game)

    return game


@app.put("/games/{game_id}/status", response_model=GameResponse)
async def update_game_status(
    game_id: int, status_update: GameStatusUpdate, db: Session = Depends(get_db)
):
    """Update game status"""
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")

    game.status = status_update.status
    db.commit()
    db.refresh(game)

    return game


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


# Main entry point
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
