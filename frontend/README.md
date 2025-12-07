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

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application

To start the development server:
```bash
npm start
```

To run tests:
```bash
npm test
```

To build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── GameBoard.tsx    # Main game board and logic
│   ├── Login.tsx        # Login component
│   ├── Leaderboard.tsx  # Leaderboard component
│   └── Watching.tsx     # Watch other players component
├── context/             # React context for user state
│   └── UserContext.tsx  # User context provider
├── App.tsx              # Main application component
└── index.tsx            # Entry point
```

## Game Controls

- Arrow keys: Control snake direction
- Space: Pause/resume game
- Mouse: Click buttons to interact with UI

## Game Modes

### Pass-through Mode
- Snake can move through screen edges and appear on the opposite side

### Walls Mode
- Game ends when snake hits screen edges

## Testing

The application includes comprehensive tests with 90%+ coverage. Tests are written using React Testing Library and Jest.

## License

This project is licensed under the MIT License.
