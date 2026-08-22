import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import { SkillGraph } from '../components/SkillGraph';
import { Award, Flame, Zap, Activity, Brain, Trophy, ChevronRight, RefreshCw, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface DashboardProps {
  onLaunchGame: (gameId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLaunchGame }) => {
  const { user, token } = useAuth();
  const { speak, setSpeechSettings } = useVoice();
  
  // Dashboard states
  const [skills, setSkills] = useState([]);
  const [stats, setStats] = useState<any>(null);
  const [aiCoach, setAICoach] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Personality State
  const [personality, setPersonality] = useState<'Mentor' | 'Professor' | 'Developer'>('Mentor');

  const getVocalizedFeedback = (rawFeedback: string, pers: string) => {
    switch (pers) {
      case 'Professor':
        return `Attention student. Review this syllabus report: ${rawFeedback}`;
      case 'Developer':
        return `Oh look, another syntax bug to crush. Let's inspect this: ${rawFeedback}`;
      case 'Mentor':
      default:
        return `Hello learner! Keep up the momentum: ${rawFeedback}`;
    }
  };

  const applyPersonalitySettings = (pers: 'Mentor' | 'Professor' | 'Developer') => {
    switch (pers) {
      case 'Professor':
        setSpeechSettings(0.85, 0.8); // Slower rate, lower pitch
        break;
      case 'Developer':
        setSpeechSettings(1.25, 1.15); // Faster rate, higher pitch
        break;
      case 'Mentor':
      default:
        setSpeechSettings(1.0, 1.0); // Standard settings
        break;
    }
  };

  // Fetch initial dashboard payloads
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };

      const [skillsRes, statsRes, aiRes] = await Promise.all([
        fetch('/api/skills', { headers }),
        fetch('/api/analytics/stats', { headers }),
        fetch('/api/analytics/recommendations', { headers })
      ]);

      const skillsData = await skillsRes.json();
      const statsData = await statsRes.json();
      const aiData = await aiRes.json();

      if (skillsData.success) setSkills(skillsData.skills);
      if (statsData.success) setStats(statsData.stats);
      if (aiData.success) {
        setAICoach(aiData);
        // Apply current voice configuration
        applyPersonalitySettings(personality);
        const vocalMessage = getVocalizedFeedback(aiData.feedback, personality);
        setTimeout(() => speak(vocalMessage), 500);
      }
    } catch (e) {
      console.error('Failed to resolve dashboard payloads:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const handlePersonalityChange = (pers: 'Mentor' | 'Professor' | 'Developer') => {
    setPersonality(pers);
    applyPersonalitySettings(pers);
    if (aiCoach?.feedback) {
      const vocalMessage = getVocalizedFeedback(aiCoach.feedback, pers);
      speak(vocalMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-3">
        <RefreshCw className="h-7 w-7 text-purple-500 animate-spin" />
        <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">Loading Academy Feeds...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
      {/* 1. Welcome Summary Banner */}
      <div className="w-full glass-panel border border-slate-800 rounded-2xl p-6 relative overflow-hidden bg-gradient-to-r from-slate-900/90 to-purple-950/20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight flex items-center gap-2">
              Skill Command Center: {user?.username || 'Gamer'}! <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Calibrate your local Python Speech Engine to unlock voice coding sandboxes, dungeon quests, and multiplayer arenas.
            </p>
          </div>

          <div className="flex gap-4 items-center">
            {/* XP widget */}
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <Zap className="h-5 w-5 text-cyan-400" />
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-500">Current XP</span>
                <span className="block text-sm font-black text-slate-200">{user?.xp} XP</span>
              </div>
            </div>

            {/* Streak widget */}
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex items-center gap-3">
              <Flame className="h-5 w-5 text-amber-500 animate-pulse" />
              <div>
                <span className="block text-[9px] uppercase font-bold text-slate-500">Activity Streak</span>
                <span className="block text-sm font-black text-slate-200">{user?.streakCount} Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main visual split - (AI Suggestions && Skill Graph) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* AI Learning Coach Alerts */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel border-purple-500/20 rounded-2xl p-5 bg-purple-950/5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-300">AI Learning Coach Advisor</h3>
            </div>
            
            <p className="text-xs bg-slate-900/40 border border-slate-800/60 p-3 rounded-lg text-slate-300 italic text-[11px] leading-relaxed">
              "{aiCoach?.feedback}"
            </p>

            {/* Coach Personality Settings Selector */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-800/50">
              <span className="text-[9px] uppercase font-bold text-slate-500">Coach Personality</span>
              <div className="grid grid-cols-3 gap-1">
                {(['Mentor', 'Professor', 'Developer'] as const).map(pers => {
                  const isActive = personality === pers;
                  return (
                    <button
                      key={pers}
                      onClick={() => handlePersonalityChange(pers)}
                      className={`py-1 rounded text-[9px] font-black uppercase transition-all ${
                        isActive 
                          ? "bg-purple-600 border border-purple-500 text-white shadow-glowPurple"
                          : "bg-slate-955 border border-slate-850 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {pers}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-500 mb-2">Strengths</span>
              <div className="flex flex-wrap gap-1.5">
                {aiCoach?.strengths?.map((str: string, index: number) => (
                  <span key={index} className="text-[10px] bg-emerald-950/40 border border-emerald-800/80 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    ✓ {str}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-500 mb-2">Weakness Targets</span>
              <div className="flex flex-wrap gap-1.5">
                {aiCoach?.weaknesses?.map((weak: string, index: number) => (
                  <span key={index} className="text-[10px] bg-rose-950/20 border border-rose-900/80 text-rose-400 px-2 py-0.5 rounded-full font-semibold">
                    ✗ {weak}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Recommended Tasks List */}
          <div className="glass-panel border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Coach Recommendations</span>
            {aiCoach?.recommendedGames?.map((rec: any, idx: number) => (
              <div 
                key={idx}
                onClick={() => onLaunchGame(rec.gameId)}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-850 hover:border-purple-500/40 cursor-pointer transition-all duration-200"
              >
                <div>
                  <span className="block text-[9px] bg-indigo-950/40 border border-indigo-900 text-indigo-300 px-2 py-0.5 rounded font-bold uppercase w-max mb-1">{rec.gameType}</span>
                  <span className="block text-xs font-bold text-slate-200">{rec.title}</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">{rec.reason}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-purple-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Interactive node map graph and charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <SkillGraph skills={skills} onSelectGame={onLaunchGame} />
          
          {/* Recharts progress chart widgets */}
          <div className="glass-panel border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block">Activity Timeline Progress</span>
                <span className="text-xs font-bold text-slate-200 mt-1">Completed activities count logs over time</span>
              </div>
              <Activity className="h-4 w-4 text-purple-500" />
            </div>

            {stats?.timelineData?.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.timelineData}>
                    <defs>
                      <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#475569" fontSize={9} />
                    <YAxis stroke="#475569" fontSize={9} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '10px' }} />
                    <Area type="monotone" dataKey="activities" stroke="#a855f7" fillOpacity={1} fill="url(#colorAct)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                Play a game completely to view your learning analytics timeline charts.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Badges Grid */}
      <div className="glass-panel border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">Unlocked Badge Medals</h3>
        </div>

        {stats?.badgesUnlocked?.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stats.badgesUnlocked.map((badge: any, index: number) => {
              return (
                <div key={index} className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center text-center gap-2 shadow-sm hover:border-yellow-500/40 transition-colors">
                  <div className="p-3 bg-gradient-to-tr from-yellow-500 to-amber-600 rounded-full text-slate-950">
                    <Award className="h-5 w-5" />
                  </div>
                  <span className="block text-xs font-black text-slate-200 leading-tight">{badge.title}</span>
                  <span className="block text-[9px] text-slate-500 leading-normal">{badge.description}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-500 flex flex-col items-center gap-1">
            <Award className="h-6 w-6 text-slate-600" />
            <span>No achievements earned yet. Score 90% or above in a challenge to secure standard Badge cards.</span>
          </div>
        )}
      </div>
    </div>
  );
};
