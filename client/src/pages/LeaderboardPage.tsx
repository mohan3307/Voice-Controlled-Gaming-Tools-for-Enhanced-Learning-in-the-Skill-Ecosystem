import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../config';
import { useAuth } from '../context/AuthContext';
import { Trophy, Award, Flame, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export const LeaderboardPage: React.FC = () => {
  const { token, user } = useAuth();
  const [board, setBoard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/api/analytics/leaderboard'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setBoard(data.leaderboard);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchBoard();
  }, [token]);

  return (
    <div className="w-full max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-yellow-400" />
        <h2 className="text-xl font-black uppercase tracking-wider text-slate-100">Global Scoreboards</h2>
      </div>

      <div className="glass-panel border-slate-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500 uppercase font-bold tracking-widest animate-pulse">
            Fetching Global Ranks...
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="grid grid-cols-12 px-6 py-3 bg-slate-900 border-b border-slate-800 text-[10px] uppercase font-extrabold text-slate-500 tracking-wider">
              <span className="col-span-2">Rank</span>
              <span className="col-span-5">Student Node</span>
              <span className="col-span-2 text-right">Streak</span>
              <span className="col-span-3 text-right">Valuation</span>
            </div>

            <div className="flex flex-col division-y division-slate-800/40">
              {board.map((item, idx) => {
                const rankNum = idx + 1;
                const isCurrentUser = item.username === user?.username;

                let badgeColor = 'text-slate-500';
                if (rankNum === 1) badgeColor = 'text-yellow-400';
                if (rankNum === 2) badgeColor = 'text-slate-300';
                if (rankNum === 3) badgeColor = 'text-amber-600';

                return (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`grid grid-cols-12 px-6 py-4 items-center text-xs border-b border-slate-900 hover:bg-slate-900/30 transition-colors ${isCurrentUser ? 'bg-purple-950/20 border-l-2 border-l-purple-500' : ''}`}
                  >
                    <div className="col-span-2 flex items-center gap-1">
                      {rankNum <= 3 ? (
                        <Trophy className={`h-4.5 w-4.5 ${badgeColor}`} />
                      ) : (
                        <span className="text-[10px] font-bold text-slate-650 ml-1.5">{rankNum}</span>
                      )}
                    </div>

                    <div className="col-span-5 flex items-center gap-2">
                      <span className={`font-bold ${isCurrentUser ? 'text-purple-300' : 'text-slate-200'}`}>
                        {item.username}
                      </span>
                      {isCurrentUser && (
                        <span className="text-[8px] bg-purple-950 px-1.5 py-0.5 rounded text-purple-400 font-mono font-bold uppercase">YOU</span>
                      )}
                    </div>

                    <div className="col-span-2 text-right flex items-center justify-end gap-1 font-semibold text-amber-500">
                      <Flame className="h-3.5 w-3.5" />
                      <span>{item.streakCount || 0}</span>
                    </div>

                    <div className="col-span-3 text-right flex flex-col items-end">
                      <span className="font-extrabold text-slate-200 uppercase">{item.xp} XP</span>
                      <span className="text-[9px] text-slate-500 font-semibold leading-none">Level {item.level}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
