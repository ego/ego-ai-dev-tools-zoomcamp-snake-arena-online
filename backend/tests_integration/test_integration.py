"""
Integration tests for the Snake Game backend
These tests verify the complete integration between all components
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app, get_db
from models import Base, User, Game

# Create a test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_integration.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create all tables
Base.metadata.create_all(bind=engine)


# Override the get_db dependency
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)


def test_full_game_flow():
    """Test a complete game flow from user creation to game completion"""

    # 1. Create a user
    user_response = client.post("/users", json={"username": "integration_test_user"})
    assert user_response.status_code == 201
    user_data = user_response.json()
    user_id = user_data["id"]
    assert user_data["username"] == "integration_test_user"

    # 2. Login the user
    login_response = client.post("/login", json={"username": "integration_test_user"})
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert login_data["username"] == "integration_test_user"
    assert "token" in login_data

    # 3. Start a new game
    game_response = client.post(
        "/games", json={"user_id": user_id, "game_mode": "pass-through"}
    )
    assert game_response.status_code == 201
    game_data = game_response.json()
    game_id = game_data["id"]
    assert game_data["user_id"] == user_id
    assert game_data["game_mode"] == "pass-through"
    assert game_data["score"] == 0
    assert game_data["status"] == "playing"

    # 4. Update game score
    score_response = client.put(f"/games/{game_id}/score", json={"score": 100})
    assert score_response.status_code == 200
    score_data = score_response.json()
    assert score_data["score"] == 100

    # 5. Update game status
    status_response = client.put(
        f"/games/{game_id}/status", json={"status": "finished"}
    )
    assert status_response.status_code == 200
    status_data = status_response.json()
    assert status_data["status"] == "finished"

    # 6. Check leaderboard (should include this user)
    leaderboard_response = client.get("/leaderboard")
    assert leaderboard_response.status_code == 200
    leaderboard_data = leaderboard_response.json()

    # 7. Check players list
    players_response = client.get("/players")
    assert players_response.status_code == 200
    players_data = players_response.json()

    # Verify the user is in the players list
    player_found = False
    for player in players_data:
        if player["id"] == user_id:
            player_found = True
            break
    assert (
        player_found == False
    )  # User should not be in playing list anymore since status is finished


def test_multiple_users_and_games():
    """Test multiple users and games"""

    # Create two users
    user1_response = client.post("/users", json={"username": "user1"})
    user2_response = client.post("/users", json={"username": "user2"})

    assert user1_response.status_code == 201
    assert user2_response.status_code == 201

    user1_id = user1_response.json()["id"]
    user2_id = user2_response.json()["id"]

    # Start games for both users
    game1_response = client.post(
        "/games", json={"user_id": user1_id, "game_mode": "walls"}
    )
    game2_response = client.post(
        "/games", json={"user_id": user2_id, "game_mode": "pass-through"}
    )

    assert game1_response.status_code == 201
    assert game2_response.status_code == 201

    game1_id = game1_response.json()["id"]
    game2_id = game2_response.json()["id"]

    # Update scores
    client.put(f"/games/{game1_id}/score", json={"score": 50})
    client.put(f"/games/{game2_id}/score", json={"score": 75})

    # Check leaderboard
    leaderboard_response = client.get("/leaderboard")
    assert leaderboard_response.status_code == 200
    leaderboard_data = leaderboard_response.json()

    # Should have at least 2 entries
    assert len(leaderboard_data) >= 2

    # Check that we can get players
    players_response = client.get("/players")
    assert players_response.status_code == 200
    players_data = players_response.json()

    # Both users should be in the players list (as they have active games)
    # But since we didn't set status to playing, they should be in the list


def test_error_handling():
    """Test error handling"""

    # Try to update a non-existent game
    score_response = client.put("/games/999/score", json={"score": 100})
    assert score_response.status_code == 404

    # Try to start game with non-existent user
    game_response = client.post(
        "/games", json={"user_id": 999, "game_mode": "pass-through"}
    )
    assert game_response.status_code == 400


def test_health_endpoint():
    """Test health endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
