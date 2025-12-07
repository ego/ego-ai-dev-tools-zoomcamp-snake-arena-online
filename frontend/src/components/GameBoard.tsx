import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { gameAPI } from '../services/api';

// Game constants
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

// Types
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };
type GameMode = 'pass-through' | 'walls';

interface GameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  nextDirection: Direction;
  gameMode: GameMode;
  score: number;
  isPlaying: boolean;
  isGameOver: boolean;
  speed: number;
}

const GameBoard: React.FC = () => {
  const { currentUser } = useUser();
  const [gameState, setGameState] = useState<GameState>({
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 15 },
    direction: 'RIGHT',
    nextDirection: 'RIGHT',
    gameMode: 'pass-through',
    score: 0,
    isPlaying: false,
    isGameOver: false,
    speed: INITIAL_SPEED,
  });
  
  const [gameId, setGameId] = useState<number | null>(null);

  // Generate random food position that doesn't overlap with snake
  const generateFood = (snake: Position[]): Position => {
    let newFood: Position;
    let attempts = 0;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      attempts++;
    } while (
      snake.some(segment => segment.x === newFood.x && segment.y === newFood.y) &&
      attempts < 100 // Prevent infinite loop
    );
    return newFood;
  };

  // Initialize game
  const initGame = async () => {
    try {
      if (!currentUser) {
        console.error('No user found');
        // Redirect by changing window location
        window.location.href = '/login';
        return;
      }
      
      // Start a new game session
      const gameResponse = await gameAPI.startGame(currentUser.id, 'pass-through');
      setGameId(gameResponse.id);
      
      setGameState({
        snake: [{ x: 10, y: 10 }],
        food: generateFood([{ x: 10, y: 10 }]),
        direction: 'RIGHT',
        nextDirection: 'RIGHT',
        gameMode: 'pass-through',
        score: 0,
        isPlaying: true,
        isGameOver: false,
        speed: INITIAL_SPEED,
      });
    } catch (err) {
      console.error('Failed to initialize game:', err);
      // Show error message to user
      alert('Failed to initialize game. Please try again.');
    }
  };

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for arrow keys to avoid page scrolling
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }
      
      if (!gameState.isPlaying || gameState.isGameOver) return;

      switch (e.key) {
        case 'ArrowUp':
          if (gameState.direction !== 'DOWN') setGameState(prev => ({ ...prev, nextDirection: 'UP' }));
          break;
        case 'ArrowDown':
          if (gameState.direction !== 'UP') setGameState(prev => ({ ...prev, nextDirection: 'DOWN' }));
          break;
        case 'ArrowLeft':
          if (gameState.direction !== 'RIGHT') setGameState(prev => ({ ...prev, nextDirection: 'LEFT' }));
          break;
        case 'ArrowRight':
          if (gameState.direction !== 'LEFT') setGameState(prev => ({ ...prev, nextDirection: 'RIGHT' }));
          break;
        case ' ':
          setGameState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.direction, gameState.isPlaying, gameState.isGameOver]);

  // Game loop
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isGameOver) return;

    const moveSnake = async () => {
      setGameState(prev => {
        const { snake, food, nextDirection, gameMode, score, speed } = prev;
        const head = { ...snake[0] };
        const direction = nextDirection;

        // Move head based on direction
        switch (direction) {
          case 'UP':
            head.y -= 1;
            break;
          case 'DOWN':
            head.y += 1;
            break;
          case 'LEFT':
            head.x -= 1;
            break;
          case 'RIGHT':
            head.x += 1;
            break;
        }

        // Handle game mode logic
        if (gameMode === 'pass-through') {
          // Wrap around screen
          if (head.x < 0) head.x = GRID_SIZE - 1;
          if (head.x >= GRID_SIZE) head.x = 0;
          if (head.y < 0) head.y = GRID_SIZE - 1;
          if (head.y >= GRID_SIZE) head.y = 0;
        } else {
          // Check wall collision
          if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
            // Update game status to finished when game over
            if (gameId !== null) {
              gameAPI.updateStatus(gameId, 'finished');
            }
            return { ...prev, isGameOver: true, isPlaying: false };
          }
        }

        // Check self collision
        const selfCollision = snake.slice(1).some(
          segment => segment.x === head.x && segment.y === head.y
        );

        if (selfCollision) {
          // Update game status to finished when game over
          if (gameId !== null) {
            gameAPI.updateStatus(gameId, 'finished');
          }
          return { ...prev, isGameOver: true, isPlaying: false };
        }

        // Create new snake array
        const newSnake = [head, ...snake];

        // Check food collision
        let newFood = food;
        let newScore = score;
        let newSpeed = speed;

        if (head.x === food.x && head.y === food.y) {
          // Snake ate food
          newFood = generateFood(newSnake);
          newScore += 10;
          
          // Increase speed every 50 points
          if (newScore % 50 === 0 && newSpeed > 50) {
            newSpeed -= 10;
          }
          
          // Update score in backend if game ID exists
          if (gameId !== null) {
            gameAPI.updateScore(gameId, newScore);
          }
        } else {
          // Remove tail if no food was eaten
          newSnake.pop();
        }

        return {
          ...prev,
          snake: newSnake,
          food: newFood,
          direction,
          score: newScore,
          speed: newSpeed,
        };
      });
    };

    const gameInterval = setInterval(moveSnake, gameState.speed);
    return () => clearInterval(gameInterval);
  }, [gameState.isPlaying, gameState.isGameOver, gameState.speed, gameId]);

  // Start game on mount
  useEffect(() => {
    if (currentUser) {
      initGame();
    } else {
      // Redirect to login page
      window.location.href = '/login';
    }
  }, [currentUser]);
  
  // Handle component unmounting
  useEffect(() => {
    return () => {
      // Clean up when component unmounts
      if (gameId !== null) {
        gameAPI.updateStatus(gameId, 'finished');
      }
    };
  }, [gameId]);

  // Toggle game mode
  const toggleGameMode = async () => {
    const newMode = gameState.gameMode === 'pass-through' ? 'walls' : 'pass-through';
    setGameState(prev => ({
      ...prev,
      gameMode: newMode
    }));
  };

  // Reset game
  const resetGame = async () => {
    if (gameId !== null) {
      // Update game status to finished
      await gameAPI.updateStatus(gameId, 'finished');
    }
    initGame();
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    setGameState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  // If no user is logged in, show a message
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-2xl font-bold mb-6">Please Login First</h2>
        <p className="text-gray-300 mb-6">You need to login to play the game</p>
        <button
          onClick={() => window.location.href = '/login'}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Snake Game</h2>
        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={toggleGameMode}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
          >
            Switch to {gameState.gameMode === 'pass-through' ? 'Walls' : 'Pass-through'} Mode
          </button>
          <button
            onClick={togglePlayPause}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition"
          >
            {gameState.isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded transition"
          >
            Reset Game
          </button>
        </div>
        <div className="text-xl font-bold mb-2">
          Score: <span className="text-green-400">{gameState.score}</span>
        </div>
        <div className="text-lg">
          Mode: <span className="font-bold">{gameState.gameMode}</span>
        </div>
      </div>

      <div
        className="relative border-2 border-gray-600 bg-gray-800 game-board-container"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE
        }}
        tabIndex={0}
      >
        {/* Game board grid */}
        {Array.from({ length: GRID_SIZE }).map((_, y) => (
          Array.from({ length: GRID_SIZE }).map((_, x) => (
            <div
              key={`${x}-${y}`}
              className="absolute border border-gray-700"
              style={{
                left: x * CELL_SIZE,
                top: y * CELL_SIZE,
                width: CELL_SIZE,
                height: CELL_SIZE,
              }}
            />
          ))
        ))}

        {/* Snake */}
        {gameState.snake.map((segment, index) => (
          <div
            key={index}
            className={`absolute rounded-sm ${
              index === 0 ? 'bg-green-500' : 'bg-green-400'
            }`}
            style={{
              left: segment.x * CELL_SIZE,
              top: segment.y * CELL_SIZE,
              width: CELL_SIZE,
              height: CELL_SIZE,
            }}
          />
        ))}

        {/* Food */}
        <div
          className="absolute bg-red-500 rounded-full"
          style={{
            left: gameState.food.x * CELL_SIZE,
            top: gameState.food.y * CELL_SIZE,
            width: CELL_SIZE,
            height: CELL_SIZE,
          }}
        />

        {/* Game over overlay */}
        {gameState.isGameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-red-500 mb-2">Game Over!</h3>
              <p className="text-xl mb-4">Final Score: {gameState.score}</p>
              <button
                onClick={resetGame}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Pause overlay */}
        {!gameState.isPlaying && !gameState.isGameOver && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-yellow-400">Game Paused</h3>
              <p className="mt-2">Press Play or Space to continue</p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-gray-400">
        <p>Use arrow keys to control the snake</p>
        <p>Press Space to pause/resume the game</p>
      </div>
    </div>
  );
};

export default GameBoard;
