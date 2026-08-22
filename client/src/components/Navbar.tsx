import React from 'react';
import { useVoice } from '../context/VoiceContext';
import { Mic, MicOff, LogOut, ShieldAlert, Award, Compass, Gamepad2, Layers, KeyRound, Wifi, WifiOff } from 'lucide-react';
import { useAuth as useAuthorizedAuth } from '../context/AuthContext';

export const Navbar: React.FC<{ activeTab: string; setActiveTab: (tab: string) => void }> = ({ activeTab, setActiveTab }) => {
  const { user, logout, isOffline } = useAuthorizedAuth();
  const { isListening, startRecognition, stopRecognition, voiceEnabled, pythonConnected } = useVoice();

  const handleVoiceToggle = () => {
    if (isListening) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass, roles: ['Student', 'Instructor', 'Admin', 'Organization'] },
    { id: 'arena', label: 'Multiplayer Arena', icon: Gamepad2, roles: ['Student', 'Instructor', 'Admin', 'Organization'] },
    { id: 'leaderboard', label: 'Leaderboards', icon: Award, roles: ['Student', 'Instructor', 'Admin', 'Organization'] },
    { id: 'playground', label: 'Playground', icon: Layers, roles: ['Student', 'Instructor', 'Admin', 'Organization'] },
    { id: 'studio', label: 'Creator Studio', icon: Gamepad2, roles: ['Instructor', 'Admin'] },
    { id: 'admin', label: 'Admin Hub', icon: ShieldAlert, roles: ['Admin'] },
  ];

  const visibleItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <nav className="w-full glass-panel border-b border-slate-800 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
        <div className="p-2 bg-gradient-to-tr from-cyan-500 to-purple-600 rounded-lg shadow-glowPurple">
          <Mic className="h-5 w-5 text-white" />
        </div>
        <div>
          <span className="font-extrabold text-sm uppercase tracking-wider bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            VoiceSkill
          </span>
          <span className="block text-[9px] font-medium text-slate-500 uppercase tracking-widest leading-none">
            Ecosystem
          </span>
        </div>
      </div>

      {user && (
        <div className="flex items-center gap-2">
          {visibleItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-900/60 border border-purple-500/40 text-purple-300 shadow-glowPurple'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {user && (
        <div className="flex items-center gap-4">
          {/* Offline/Online indicators */}
          {isOffline ? (
            <div className="flex items-center gap-1 text-rose-400 text-[10px] font-semibold bg-rose-950/40 border border-rose-800/50 px-2 py-1 rounded" title="Works locally, progress will auto sync when online">
              <WifiOff className="h-3 w-3" />
              <span className="hidden sm:inline">Offline Mode</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-semibold bg-emerald-950/40 border border-emerald-800/50 px-2 py-1 rounded">
              <Wifi className="h-3 w-3" />
              <span className="hidden sm:inline">Online</span>
            </div>
          )}

          {/* Python Speech Engine connection state badge */}
          {pythonConnected ? (
            <div className="flex items-center gap-1 text-purple-400 text-[10px] font-semibold bg-purple-950/40 border border-purple-800/50 px-2 py-1 rounded shadow-glowPurple" title="Connected to Python speech engine daemon">
              <Wifi className="h-3 w-3 text-purple-400" />
              <span className="hidden sm:inline">Python Mic</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-slate-500 text-[10px] font-semibold bg-slate-900 border border-slate-800 px-2 py-1 rounded" title="Python speech engine disconnected - browser Web Speech active">
              <WifiOff className="h-3 w-3 text-slate-500" />
              <span className="hidden sm:inline">Browser Mic</span>
            </div>
          )}

          {/* Speech Engine status indicators */}
          {voiceEnabled && (
            <button
              onClick={handleVoiceToggle}
              className={`p-2 rounded-full border transition-all ${
                isListening
                  ? 'bg-purple-600 border-purple-400 shadow-glowPurple text-white pulse-voice'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-purple-500'
              }`}
              title={isListening ? "Voice engine listening - click to stop" : "Voice engine standby - click to start"}
            >
              {isListening ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </button>
          )}

          {/* User parameters (Level + XP) */}
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-slate-100">{user.username}</span>
              <span className="block text-[10px] text-purple-400 font-semibold uppercase">{user.xp} XP</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-900 to-purple-950 flex items-center justify-center border border-cyan-500/40 text-xs font-extrabold text-cyan-300">
              L{user.level}
            </div>
          </div>

          {/* Logout controls */}
          <button
            onClick={logout}
            className="p-2 hover:bg-slate-800/60 rounded bg-slate-900/40 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Log Out Session"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </nav>
  );
};
