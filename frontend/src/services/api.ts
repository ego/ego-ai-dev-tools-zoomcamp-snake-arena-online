import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 10000,
});

// Add a request interceptor to include token in headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('snakeGameToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear local storage
      localStorage.removeItem('snakeGameToken');
      localStorage.removeItem('snakeUser');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Endpoints
export const authAPI = {
  login: async (username: string) => {
    const response = await api.post('/login', { username });
    return response.data;
  },
};

export const userAPI = {
  create: async (username: string) => {
    const response = await api.post('/users', { username });
    return response.data;
  },
};

export const gameAPI = {
  startGame: async (userId: number, gameMode: string) => {
    const response = await api.post('/games', { user_id: userId, game_mode: gameMode });
    return response.data;
  },
  
  updateScore: async (gameId: number, score: number) => {
    const response = await api.put(`/games/${gameId}/score`, { score });
    return response.data;
  },
  
  updateStatus: async (gameId: number, status: string) => {
    const response = await api.put(`/games/${gameId}/status`, { status });
    return response.data;
  },
};

export const leaderboardAPI = {
  getLeaderboard: async () => {
    const response = await api.get('/leaderboard');
    return response.data;
  },
};

export const playersAPI = {
  getPlayers: async () => {
    const response = await api.get('/players');
    return response.data;
  },
};

export default api;
