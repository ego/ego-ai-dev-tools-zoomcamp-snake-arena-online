import React, { useState, useEffect } from 'react';
import './App.css';
import GameBoard from './components/GameBoard';
import Login from './components/Login';
import Leaderboard from './components/Leaderboard';
import Watching from './components/Watching';
import { UserProvider, useUser } from './context/UserContext';
import { authAPI } from './services/api';

function AppContent() {
  const { currentUser, logout } = useUser();
  const [currentView, setCurrentView] = useState<'game' | 'login' | 'leaderboard' | 'watching'>('login');

  // Check if user is already logged in and handle URL routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#login') {
        setCurrentView('login');
      } else if (hash === '#game') {
        if (currentUser) {
          setCurrentView('game');
        } else {
          setCurrentView('login');
        }
      } else if (hash === '#leaderboard') {
        setCurrentView('leaderboard');
      } else if (hash === '#watch-players') {
        setCurrentView('watching');
      } else {
        // Default to login if no hash or unrecognized hash
        if (currentUser) {
          setCurrentView('game');
        } else {
          setCurrentView('login');
        }
      }
    };

    // Initial check
    handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [currentUser]);

  const handleLogin = async (username: string) => {
    try {
      // Verify user exists or create new one
      const response = await authAPI.login(username);
      // Store token and user info in localStorage
      localStorage.setItem('snakeGameToken', response.token);
      localStorage.setItem('snakeUser', JSON.stringify({ 
        id: response.id, 
        username: response.username, 
        isLoggedIn: true 
      }));
      
      // Update user context and redirect to game
      setCurrentView('game');
      window.location.hash = '#game';
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentView('login');
    window.location.hash = '#login';
  };

  const navigateTo = (view: 'game' | 'login' | 'leaderboard' | 'watching') => {
    setCurrentView(view);
    switch (view) {
      case 'game':
        window.location.hash = '#game';
        break;
      case 'login':
        window.location.hash = '#login';
        break;
      case 'leaderboard':
        window.location.hash = '#leaderboard';
        break;
      case 'watching':
        window.location.hash = '#watch-players';
        break;
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'login':
        return <Login onLogin={handleLogin} />;
      case 'game':
        return <GameBoard />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'watching':
        return <Watching />;
      default:
        return <GameBoard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Snake Game</h1>
        {currentUser && (
          <div className="flex items-center space-x-4">
            <span className="bg-gray-700 px-3 py-1 rounded">
              {currentUser.username}
            </span>
            <nav className="flex space-x-2">
              <button 
                onClick={() => navigateTo('game')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded transition"
              >
                Game
              </button>
              <button 
                onClick={() => navigateTo('leaderboard')}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded transition"
              >
                Leaderboard
              </button>
              <button 
                onClick={() => navigateTo('watching')}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded transition"
              >
                Watch Players
              </button>
              <button 
                onClick={handleLogout}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition"
              >
                Logout
              </button>
            </nav>
          </div>
        )}
      </header>
      <main className="container mx-auto px-4 py-8">
        {renderCurrentView()}
      </main>
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;
