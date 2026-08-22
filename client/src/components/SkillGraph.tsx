import React, { useState } from 'react';
import { Award, CheckCircle, Lock, Play, BookOpen, Terminal, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

interface SkillNode {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: 'Frontend' | 'Backend' | 'DataScience' | 'DevOps' | 'Cybersecurity' | 'Python' | 'Java' | 'HTML' | 'DataStructures' | 'MachineLearning' | 'English';
  prerequisites: any[];
  completion: 'Completed' | 'Started' | 'Locked';
  score: number;
  levelNeeded?: number;
  games: Array<{ _id: string; title: string; gameType: string }>;
  badgeAwarded?: {
    title: string;
    icon: string;
    description: string;
  };
}

interface SkillGraphProps {
  skills: SkillNode[];
  onSelectGame: (gameId: string) => void;
}

const CATEGORIES = [
  { id: 'Python', label: 'Python' },
  { id: 'Java', label: 'Java OOP' },
  { id: 'HTML', label: 'HTML Web' },
  { id: 'DataStructures', label: 'Data Structures' },
  { id: 'MachineLearning', label: 'Machine Learning' },
  { id: 'English', label: 'Spoken English' }
];

export const SkillGraph: React.FC<SkillGraphProps> = ({ skills, onSelectGame }) => {
  const [activeCategory, setActiveCategory] = useState<string>('Python');
  const [selectedNode, setSelectedNode] = useState<SkillNode | null>(null);

  // Filter skills by active subject tab category selection
  const filteredSkills = skills.filter(s => s.category === activeCategory);

  // Distribute filtered roadmap nodes horizontally with alternating vertical waves
  const nodesWithCoords = filteredSkills.map((skill, index) => {
    const colOffset = index * 220 + 100;
    const rowOffset = 170 + (index % 2 === 0 ? 35 : -35);

    return {
      ...skill,
      x: colOffset,
      y: rowOffset
    };
  });

  return (
    <div className="w-full glass-panel border border-slate-800 rounded-2xl p-6 relative overflow-hidden bg-slate-950/20 flex flex-col gap-6">
      
      {/* Header and Legend indicators */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-purple-300">Skill Graph Map</h3>
          <p className="text-[11px] text-slate-400">Prerequisite paths link nodes. Audibly unlock badges by matching nodes.</p>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500 block"></span> Completed</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-purple-500 block"></span> In Progress</div>
          <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-700 block"></span> Locked</div>
        </div>
      </div>

      {/* Subject Filter Tabs Navigation */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedNode(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                isActive
                  ? "bg-purple-900/60 border border-purple-500/40 text-purple-300 shadow-glowPurple"
                  : "bg-slate-900/40 border border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* SVG Canvas Map grid */}
      <div className="w-full overflow-x-auto border border-slate-900 rounded-2xl bg-slate-950/30 p-2">
        <div 
          style={{ minWidth: `${Math.max(800, nodesWithCoords.length * 200 + 150)}px` }} 
          className="h-[320px] relative"
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Draw connection vectors */}
            {nodesWithCoords.map(node => {
              return node.prerequisites.map((prereq: any) => {
                const parentId = typeof prereq === 'object' ? prereq._id : prereq;
                const parentNode = nodesWithCoords.find(n => n._id === parentId);
                if (!parentNode) return null;

                const isCompletedPath = node.completion === 'Completed' && parentNode.completion === 'Completed';

                return (
                  <g key={`${node._id}-${parentId}`}>
                    <defs>
                      <linearGradient id={`grad-${node._id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={parentNode.completion === 'Completed' ? '#10b981' : '#6366f1'} />
                        <stop offset="100%" stopColor={node.completion === 'Completed' ? '#10b981' : '#a855f7'} />
                      </linearGradient>
                    </defs>
                    <path
                      d={`M ${parentNode.x} ${parentNode.y} C ${(parentNode.x + node.x) / 2} ${parentNode.y}, ${(parentNode.x + node.x) / 2} ${node.y}, ${node.x} ${node.y}`}
                      fill="none"
                      stroke={`url(#grad-${node._id})`}
                      strokeWidth={isCompletedPath ? 3 : 1.5}
                      strokeDasharray={node.completion === 'Locked' ? '4,4' : 'none'}
                      opacity={node.completion === 'Locked' ? 0.3 : 0.7}
                      className={node.completion === 'Started' ? 'animate-pulse' : ''}
                    />
                  </g>
                );
              });
            })}
          </svg>

          {/* Draw node indicators */}
          {nodesWithCoords.map(node => {
            const isCompleted = node.completion === 'Completed';
            const isStarted = node.completion === 'Started';
            const isLocked = node.completion === 'Locked';

            let ringColor = 'border-slate-700 text-slate-500 bg-slate-900';
            if (isCompleted) ringColor = 'border-emerald-500 text-emerald-400 bg-emerald-950/60 shadow-glowGreen';
            if (isStarted) ringColor = 'border-purple-500 text-purple-400 bg-purple-950/60 shadow-glowPurple';

            return (
              <motion.div
                key={node._id}
                style={{ left: node.x - 22, top: node.y - 22 }}
                className={`absolute h-11 w-11 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${ringColor} hover:scale-110`}
                onClick={() => setSelectedNode(node)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : isLocked ? (
                  <Lock className="h-4 w-4" />
                ) : (
                  <Play className="h-5 w-5 fill-purple-400/20" />
                )}
              </motion.div>
            );
          })}

          {/* Quick labels overlays */}
          {nodesWithCoords.map(node => (
            <div
              key={`lbl-${node._id}`}
              style={{ left: node.x - 80, top: node.y + 26 }}
              className="absolute w-[160px] text-center pointer-events-none"
            >
              <span className="text-[10px] font-bold block text-slate-200 truncate">{node.name}</span>
              <span className="text-[8px] text-slate-500 uppercase tracking-widest leading-none">Level {node.levelNeeded}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Node Drawer / Modal */}
      {selectedNode && (
        <div className="absolute inset-0 bg-slate-950/95 flex flex-col justify-center p-6 border-t border-slate-800 backdrop-blur z-20 animate-fadeIn">
          <div className="max-w-md mx-auto w-full flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] bg-purple-950 font-bold border border-purple-800 text-purple-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Level {selectedNode.levelNeeded} - {CATEGORIES.find(c => c.id === selectedNode.category)?.label}
                </span>
                <h4 className="text-lg font-bold text-slate-200 mt-1">{selectedNode.name}</h4>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-[10px] text-slate-500 hover:text-slate-300 uppercase font-semibold"
              >
                [close]
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">{selectedNode.description}</p>

            {selectedNode.badgeAwarded && (
              <div className="flex items-center gap-3 bg-purple-950/20 p-3 rounded-lg border border-purple-500/10">
                <div className="p-2 bg-gradient-to-tr from-yellow-500 to-purple-600 rounded text-white">
                  <Award className="h-4 w-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-yellow-400">Award: {selectedNode.badgeAwarded.title}</span>
                  <span className="block text-[10px] text-slate-400 leading-normal">{selectedNode.badgeAwarded.description}</span>
                </div>
              </div>
            )}

            {/* Split Challenge Action Buttons */}
            {selectedNode.completion === 'Locked' ? (
              <div className="text-xs text-rose-400 flex items-center justify-center gap-1.5 font-bold uppercase py-3.5 bg-rose-955/20 border border-rose-900/30 rounded-xl mt-2">
                <Lock className="h-4 w-4 animate-pulse" /> Prerequisites Locked - Complete previous levels first
              </div>
            ) : (
              <div className="flex flex-col gap-2 mt-2 border-t border-slate-900 pt-3">
                <span className="text-[9px] uppercase font-black text-slate-500 block mb-1">Select Challenge Type:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedNode.games && selectedNode.games.map((g: any) => {
                    const isQuiz = g.gameType === 'Quiz' || g.gameType === 'LogicPuzzle';
                    return (
                      <button
                        key={g._id}
                        onClick={() => {
                          onSelectGame(g._id);
                          setSelectedNode(null);
                        }}
                        className={`px-4 py-2.5 rounded-xl border font-extrabold uppercase text-[9px] tracking-wider transition-all hover:scale-102 flex items-center justify-center gap-1.5 ${
                          isQuiz
                            ? "bg-purple-950/60 border-purple-800 hover:border-purple-500 text-purple-300 shadow-glowPurple"
                            : "bg-cyan-950/60 border-cyan-800 hover:border-cyan-500 text-cyan-300 shadow-glowCyan"
                        }`}
                      >
                        {isQuiz ? (
                          <>
                            <BookOpen className="h-3.5 w-3.5 text-purple-400" /> Start Conceptual Quiz
                          </>
                        ) : (
                          <>
                            <Terminal className="h-3.5 w-3.5 text-cyan-400" /> {g.gameType === 'CodingBattle' ? "Start Practical Battle" : "Start Adventure Quest"}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
