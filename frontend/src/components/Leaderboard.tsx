import React, { useState, useEffect } from 'react';
import { leaderboardAPI } from '../services/api';

interface LeaderboardEntry {
  id: number;
  username: string;
  score: number;
}

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await leaderboardAPI.getLeaderboard();
        
        // Remove duplicates by keeping the highest score for each user
        const uniquePlayers: Record<number, LeaderboardEntry> = {};
        data.forEach((player: LeaderboardEntry) => {
          if (!uniquePlayers[player.id] || uniquePlayers[player.id].score < player.score) {
            uniquePlayers[player.id] = player;
          }
        });
        
        // Convert back to array and sort by score descending
        const uniqueData = Object.values(uniquePlayers)
          .sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score);
        
        setLeaderboardData(uniqueData);
      } catch (err) {
        setError('Failed to fetch leaderboard data');
        console.error('Leaderboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    
    // Set up real-time updates
    const interval = setInterval(fetchLeaderboard, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <p className="text-xl">Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Leaderboard</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-gray-700 rounded">
          <thead>
            <tr className="bg-gray-600">
              <th className="py-3 px-4 text-left">Rank</th>
              <th className="py-3 px-4 text-left">Player</th>
              <th className="py-3 px-4 text-left">Score</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((player: LeaderboardEntry, index) => (
              <tr key={player.id} className="border-b border-gray-600 hover:bg-gray-600">
                <td className="py-3 px-4">{index + 1}</td>
                <td className="py-3 px-4">{player.username}</td>
                <td className="py-3 px-4 font-bold">{player.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 text-center">
        <p className="text-gray-400">Top players based on highest scores</p>
        <p className="text-gray-500 text-sm mt-2">Data updates automatically every 5 seconds</p>
      </div>
    </div>
  );
};

export default Leaderboard;
