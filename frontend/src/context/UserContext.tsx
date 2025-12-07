import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  username: string;
  isLoggedIn: boolean;
}

interface UserContextType {
  currentUser: User | null;
  login: (username: string) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Check for existing user session on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('snakeUser');
    const token = localStorage.getItem('snakeGameToken');
    
    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser({
          id: user.id,
          username: user.username,
          isLoggedIn: true
        });
      } catch (e) {
        console.error('Failed to parse stored user:', e);
        // Clear invalid data
        localStorage.removeItem('snakeGameToken');
        localStorage.removeItem('snakeUser');
      }
    }
  }, []);

  const login = (username: string) => {
    // Create mock user object for login
    const mockUser = {
      id: Math.floor(Math.random() * 10000), // Mock ID
      username: username,
      isLoggedIn: true
    };
    setCurrentUser(mockUser);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('snakeGameToken');
    localStorage.removeItem('snakeUser');
  };

  return (
    <UserContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext };
