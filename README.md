# Snake Game - Frontend

A modern Snake game implementation with React, TypeScript, and Tailwind CSS with multiplayer features.

## Features

- Classic Snake gameplay with two game modes:
  - Pass-through mode: Snake wraps around screen edges
  - Walls mode: Snake dies when hitting screen edges
- Multiplayer features:
  - Login system (mocked)
  - Leaderboard with top scores
  - Watch other players in real-time
- Responsive design using Tailwind CSS
- Keyboard controls (arrow keys)
- Game state management (pause/resume, reset)
- Score tracking and speed progression

## Technologies Used

- React (TypeScript)
- Tailwind CSS
- React Hooks (useState, useEffect, useCallback)
- LocalStorage for user session persistence


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


## Getting Started

### Prerequisites

- Docker (for containerized deployment)

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```

### Running with Docker

1. Build and run with Docker Compose:
   ```bash
   docker-compose up --build
   ```

2. The backend will be available at `http://localhost:8000`


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


Read more:

1. Frontend `frontend/README.md`
2. Backend  `backend//README.md`


## License

This project is licensed under the MIT License.

![AI todo app](/images/snake-game.png)
![AI todo app](/images/api.png)
