import React, { useState, useEffect } from 'react';
import { playersAPI } from '../services/api';

interface Player {
  id: number;
  username: string;
  score: number;
  status: 'playing' | 'idle' | 'finished';
  gameMode: 'pass-through' | 'walls';
}

const Watching = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const response = await playersAPI.getPlayers();
        setPlayers(response);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch players:', err);
        setError('Failed to load player data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
    
    // Set up real-time updates
    const interval = setInterval(fetchPlayers, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <p className="text-xl">Loading players...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <p className="text-xl text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Watching Other Players</h2>
      
      {players.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400 mb-4">No players currently playing</p>
          <p className="text-gray-500 text-sm">Start a game to see players in action!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map(player => (
            <div 
              key={player.id} 
              className={`p-4 rounded-lg border ${
                player.status === 'playing' 
                  ? 'border-green-500 bg-green-900/20' 
                  : player.status === 'idle' 
                    ? 'border-yellow-500 bg-yellow-900/20' 
                    : 'border-red-500 bg-red-900/20'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{player.username}</h3>
                  <p className="text-gray-300">Score: <span className="font-bold">{player.score}</span></p>
                  <p className="text-gray-300">Mode: <span className="font-bold">{player.gameMode}</span></p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  player.status === 'playing' 
                    ? 'bg-green-500 text-white' 
                    : player.status === 'idle' 
                      ? 'bg-yellow-500 text-black' 
                      : 'bg-red-500 text-white'
                }`}>
                  {player.status}
                </span>
              </div>
              <div className="mt-3">
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full ${
                      player.status === 'playing' 
                        ? 'bg-green-500' 
                        : player.status === 'idle' 
                          ? 'bg-yellow-500' 
                          : 'bg-red-500'
                    }`} 
                    style={{ width: `${Math.min(100, player.score / 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <p className="text-gray-400">Real-time data of other players playing the game</p>
        <p className="text-gray-500 text-sm mt-2">Data updates automatically every 5 seconds</p>
      </div>
    </div>
  );
};

export default Watching;
