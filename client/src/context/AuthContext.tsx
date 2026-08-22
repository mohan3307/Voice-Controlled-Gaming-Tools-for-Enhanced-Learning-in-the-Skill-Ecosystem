import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'Student' | 'Instructor' | 'Admin' | 'Organization';
  xp: number;
  level: number;
  streakCount: number;
  microphoneSettings?: {
    gain: number;
    noiseCancelling: boolean;
    commandLanguage: string;
  };
  consentToVoiceProcess: boolean;
}

interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (token: string, user: UserProfile) => void;
  logout: () => void;
  updateUserStats: (xp: number, level: number) => void;
  syncOfflineProgress: () => Promise<void>;
  isOffline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Sync online/offline markers
  useEffect(() => {
    const goOnline = () => {
      setIsOffline(false);
      flushOfflineData();
    };
    const goOffline = () => setIsOffline(true);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    
    // Parse cached user
    const cachedUser = localStorage.getItem('user');
    if (cachedUser) {
      setUser(JSON.parse(cachedUser));
    }

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const login = (authToken: string, userProfile: UserProfile) => {
    setToken(authToken);
    setUser(userProfile);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userProfile));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUserStats = (xp: number, level: number) => {
    if (user) {
      const updatedUser = { ...user, xp, level };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  // Offline Synchronization engine
  // Save submissions in localStorage when connection is drop, then flushing it when connection returns
  const syncOfflineProgress = async () => {
    const queue = localStorage.getItem('offline_submissions');
    if (!queue) return;
    
    const submissions = JSON.parse(queue);
    console.log(`Syncing offline actions queue. Total items: ${submissions.length}`);
    
    for (const sub of submissions) {
      try {
        await fetch(`/api/games/${sub.gameId}/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(sub.data)
        });
      } catch (err) {
        console.error('Failed to sync offline submission point:', err);
      }
    }
    
    localStorage.removeItem('offline_submissions');
  };

  const flushOfflineData = () => {
    if (token) {
      syncOfflineProgress();
    }
  };

  return (
    <AuthContext.Provider value={{
      token,
      user,
      isAuthenticated: !!token,
      login,
      logout,
      updateUserStats,
      syncOfflineProgress,
      isOffline
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider wrapper');
  }
  return context;
};
export { AuthContext };
