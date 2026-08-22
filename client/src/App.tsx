import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VoiceProvider, useVoice } from './context/VoiceContext';
import { Navbar } from './components/Navbar';
import { VoiceOverlay } from './components/VoiceOverlay';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { VoicePlayground } from './pages/VoicePlayground';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { CreativeStudio } from './pages/CreativeStudio';
import { AdminDashboard } from './pages/AdminDashboard';
import { VoiceQuest } from './pages/VoiceQuest';
import { CodingBattle } from './pages/CodingBattle';
import { MultiplayerArena } from './pages/MultiplayerArena';

const MainLayout: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { connectVoiceSocket } = useVoice();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  
  // Retrieve game type to route to matching game engine pages
  const [activeGameType, setActiveGameType] = useState<'VoiceQuest' | 'CodingBattle' | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.username) {
      connectVoiceSocket(user.username);
    }
  }, [isAuthenticated, user, connectVoiceSocket]);

  if (!isAuthenticated) {
    return <Login />;
  }

  const handleLaunchGame = async (gameId: string) => {
    try {
      const response = await fetch(`/api/games/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setActiveGameId(gameId);
        // Direct routing depending on DB layout types
        if (data.game.gameType === 'VoiceQuest') {
          setActiveGameType('VoiceQuest');
        } else if (data.game.gameType === 'CodingBattle') {
          setActiveGameType('CodingBattle');
        } else {
          // default logic
          setActiveGameType('VoiceQuest');
        }
      }
    } catch (e) {
      console.error('Launch Error callback:', e);
    }
  };

  const handleBackToDashboard = () => {
    setActiveGameId(null);
    setActiveGameType(null);
    setActiveTab('dashboard');
  };

  // Direct gamified consoles triggers
  if (activeGameId && activeGameType === 'VoiceQuest') {
    return <VoiceQuest gameId={activeGameId} onBack={handleBackToDashboard} />;
  }

  if (activeGameId && activeGameType === 'CodingBattle') {
    return <CodingBattle gameId={activeGameId} onBack={handleBackToDashboard} />;
  }

  return (
    <div className="min-h-screen flex flex-col relative pb-12">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {activeTab === 'dashboard' && <Dashboard onLaunchGame={handleLaunchGame} />}
        {activeTab === 'arena' && <MultiplayerArena onBack={handleBackToDashboard} />}
        {activeTab === 'playground' && <VoicePlayground />}
        {activeTab === 'leaderboard' && <LeaderboardPage />}
        {activeTab === 'studio' && <CreativeStudio />}
        {activeTab === 'admin' && <AdminDashboard />}
      </main>

      <VoiceOverlay />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <VoiceProvider>
        <MainLayout />
      </VoiceProvider>
    </AuthProvider>
  );
}

export default App;
