import React, { useState } from 'react';
import { authAPI } from '../services/api';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await authAPI.login(username.trim());
      // Store token and user info in localStorage
      localStorage.setItem('snakeGameToken', response.token);
      localStorage.setItem('snakeUser', JSON.stringify({ id: response.id, username: response.username, isLoggedIn: true }));
      onLogin(username.trim());
    } catch (err) {
      setError('Failed to login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-gray-800 p-8 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Login to Snake Game</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="username" className="block text-gray-300 mb-2">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your username"
          />
        </div>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-gray-400">Don't have an account? Sign up is not implemented in this demo.</p>
      </div>
    </div>
  );
};

export default Login;
