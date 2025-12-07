# Snake Game Backend

Backend API for the Snake Game application with multiplayer features.

## Features

- User authentication and management
- Game session tracking
- Leaderboard functionality
- Real-time player status monitoring
- RESTful API with OpenAPI specification

## Technologies Used

- Python 3.11
- FastAPI
- SQLAlchemy (ORM)
- PostgreSQL (production) / SQLite (development)
- uv (dependency management)
- Docker for containerization

## API Endpoints

### Authentication
- `POST /login` - Authenticate user
- `POST /users` - Create new user

### Game Management
- `POST /games` - Start a new game
- `PUT /games/{game_id}/score` - Update game score
- `PUT /games/{game_id}/status` - Update game status

### Data Retrieval
- `GET /leaderboard` - Get leaderboard data
- `GET /players` - Get list of active players
- `GET /health` - Health check endpoint

## Getting Started

### Prerequisites

- Python 3.11
- Docker (for containerized deployment)

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies using uv:
   ```bash
   uv sync
   ```

### Running Locally

1. Start the development server:
   ```bash
   uv run python main.py
   ```

2. The API will be available at `http://localhost:8000`

### Running with Docker

1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

2. The backend will be available at `http://localhost:8000`

## Testing

Run tests with pytest:
```bash
pytest tests.py
```

## API Documentation

The API is documented using OpenAPI specification. You can view the documentation at:
- `http://localhost:8000/docs` (Swagger UI)
- `http://localhost:8000/redoc` (ReDoc)

## Database Schema

The application uses SQLAlchemy models for database operations:

### Users Table
- `id` (Integer, Primary Key)
- `username` (String, Unique)
- `created_at` (DateTime)

### Games Table
- `id` (Integer, Primary Key)
- `user_id` (Integer, Foreign Key to Users)
- `score` (Integer)
- `game_mode` (String)
- `status` (String)
- `created_at` (DateTime)

## Environment Variables

- `DATABASE_URL` - Database connection string
- `PORT` - Port number (default: 8000)

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Backend       │
│   (React)       │───▶│   (FastAPI)     │───▶│   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Database      │
                    │   (PostgreSQL)  │
                    └─────────────────┘
```

## CI/CD Pipeline

This project uses AWS CDK for infrastructure as code deployment:

1. **Source Code**: GitHub repository
2. **Build**: Automated CI pipeline
3. **Deploy**: AWS CDK deployment to ECS Fargate
4. **Infrastructure**: 
   - VPC with public and private subnets
   - ECS Cluster with Fargate service
   - RDS PostgreSQL database
   - Application Load Balancer

## License

This project is licensed under the MIT License.
