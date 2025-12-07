from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from main import app, get_db
from models import Base

# Create a test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
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


def test_create_user():
    response = client.post("/users", json={"username": "testuser"})
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "testuser"
    assert "id" in data


def test_create_duplicate_user():
    # Create a user first
    client.post("/users", json={"username": "duplicateuser"})

    # Try to create the same user again
    response = client.post("/users", json={"username": "duplicateuser"})
    assert response.status_code == 409


def test_login():
    response = client.post("/login", json={"username": "loginuser"})
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "loginuser"
    assert "token" in data


def test_start_game():
    # First create a user
    user_response = client.post("/users", json={"username": "gameuser"})
    user_data = user_response.json()
    user_id = user_data["id"]

    # Start a game
    response = client.post(
        "/games", json={"user_id": user_id, "game_mode": "pass-through"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user_id"] == user_id
    assert data["game_mode"] == "pass-through"
    assert data["score"] == 0
    assert data["status"] == "playing"


def test_update_score():
    # First create a user and game
    user_response = client.post("/users", json={"username": "scoreuser"})
    user_data = user_response.json()
    user_id = user_data["id"]

    game_response = client.post(
        "/games", json={"user_id": user_id, "game_mode": "walls"}
    )
    game_data = game_response.json()
    game_id = game_data["id"]

    # Update score
    response = client.put(f"/games/{game_id}/score", json={"score": 100})
    assert response.status_code == 200
    data = response.json()
    assert data["score"] == 100


def test_update_game_status():
    # First create a user and game
    user_response = client.post("/users", json={"username": "statususer"})
    user_data = user_response.json()
    user_id = user_data["id"]

    game_response = client.post(
        "/games", json={"user_id": user_id, "game_mode": "pass-through"}
    )
    game_data = game_response.json()
    game_id = game_data["id"]

    # Update status
    response = client.put(f"/games/{game_id}/status", json={"status": "finished"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "finished"


def test_get_leaderboard():
    response = client.get("/leaderboard")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_get_players():
    response = client.get("/players")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


# Test error cases
def test_game_not_found():
    response = client.put("/games/999/score", json={"score": 100})
    assert response.status_code == 404


def test_user_not_found():
    response = client.post("/games", json={"user_id": 999, "game_mode": "pass-through"})
    assert response.status_code == 400
