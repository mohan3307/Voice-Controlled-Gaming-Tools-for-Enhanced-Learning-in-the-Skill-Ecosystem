import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config';
import { useAuth } from '../context/AuthContext';
import { useVoice } from '../context/VoiceContext';
import { Gamepad2, Plus, Trash2, CheckCircle, Download, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export const CreativeStudio: React.FC = () => {
  const { token } = useAuth();
  const { speak } = useVoice();

  // Loader states
  const [skills, setSkills] = useState<any[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillAssociated, setSkillAssociated] = useState('');
  const [gameType, setGameType] = useState<'Quiz' | 'VoiceQuest' | 'CodingBattle'>('Quiz');
  const [baseDifficulty, setBaseDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Expert'>('Easy');
  const [xpReward, setXpReward] = useState(100);

  // Dynamic lists
  const [questions, setQuestions] = useState<any[]>([]);
  const [questStages, setQuestStages] = useState<any[]>([]);

  // Temp parameters
  const [tempPrompt, setTempPrompt] = useState('');
  const [tempOptions, setTempOptions] = useState('');
  const [tempCorrect, setTempCorrect] = useState('');
  
  const [tempStageId, setTempStageId] = useState('');
  const [tempDialogue, setTempDialogue] = useState('');
  const [tempCommand, setTempCommand] = useState('');
  const [tempTarget, setTempTarget] = useState('');

  const fetchSkillsList = async () => {
    try {
      const res = await fetch(getApiUrl('/api/skills'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSkills(data.skills);
        if (data.skills.length > 0) setSkillAssociated(data.skills[0]._id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) fetchSkillsList();
  }, [token]);

  const addQuizQuestion = () => {
    if (!tempPrompt || !tempOptions || !tempCorrect) return;
    const opts = tempOptions.split(',').map(s => s.trim());
    setQuestions(prev => [...prev, {
      prompt: tempPrompt,
      options: opts,
      correctAnswer: tempCorrect,
      hint: "Speak option details directly."
    }]);

    setTempPrompt('');
    setTempOptions('');
    setTempCorrect('');
  };

  const addQuestStage = () => {
    if (!tempStageId || !tempDialogue || !tempCommand || !tempTarget) return;
    setQuestStages(prev => [...prev, {
      stageId: tempStageId,
      dialogue: tempDialogue,
      options: [{
        commandText: tempCommand,
        targetStageId: tempTarget,
        xpGained: 40
      }]
    }]);

    setTempStageId('');
    setTempDialogue('');
    setTempCommand('');
    setTempTarget('');
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setErrorMsg(null);

    const payload = {
      title,
      description,
      skillAssociated,
      gameType,
      baseDifficulty,
      xpReward,
      questions: gameType === 'Quiz' ? questions : [],
      questStages: gameType === 'VoiceQuest' ? questStages : []
    };

    try {
      const res = await fetch(getApiUrl('/api/games'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      setSuccess('Game challenge module published successfully!');
      speak("Challenge node compiled.");
      
      // Reset main form
      setTitle('');
      setDescription('');
      setQuestions([]);
      setQuestStages([]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification Error publication.');
    }
  };

  // CSV Exporter Simulation
  const exportToCSV = () => {
    const header = ['Game Type', 'Title', 'Difficulty', 'XP Bounty', 'Skill Target'];
    const rows = [[gameType, title, baseDifficulty, xpReward, skillAssociated]];
    const content = [header.join(','), ...rows.map(r => r.join(','))].join('\n');

    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.toLowerCase().replace(/ /g, '_')}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8 flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
          Game Creator Studio <Gamepad2 className="h-5 w-5 text-purple-400" />
        </h2>
        <p className="text-xs text-slate-400 mt-1">Submit custom voice scenarios and download template CSV logs without coding.</p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-805 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          <span>{success}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handlePublish} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Configurations parameters */}
        <div className="glass-panel border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-2">Challenge settings</span>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Game Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Scoping Hoisting showdown"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Description</label>
            <textarea
              required
              rows={3}
              placeholder="Explain objectives and spoken instructions..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Category Skill Link</label>
              <select
                value={skillAssociated}
                onChange={(e) => setSkillAssociated(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg p-2.5 text-xs text-slate-300 outline-none"
              >
                {skills.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Bounty Reward</label>
              <input
                type="number"
                value={xpReward}
                onChange={(e) => setXpReward(parseInt(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg p-2.5 text-xs text-slate-200 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Game Format Type</label>
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg p-2.5 text-xs text-slate-350 outline-none font-semibold text-purple-300"
              >
                <option value="Quiz">Option Choice Quiz</option>
                <option value="VoiceQuest">VoiceQuest Dialogue</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Difficulty Tier</label>
              <select
                value={baseDifficulty}
                onChange={(e) => setBaseDifficulty(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg p-2.5 text-xs text-slate-300 outline-none"
              >
                <option value="Easy">Easy Mode</option>
                <option value="Medium">Medium Mode</option>
                <option value="Hard">Hard Mode</option>
                <option value="Expert">Expert Mode</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2.5 mt-4">
            <button
              type="button"
              onClick={exportToCSV}
              className="flex-1 border border-slate-800 hover:border-emerald-500/40 bg-slate-950/40 text-slate-400 hover:text-emerald-400 font-extrabold uppercase py-3 rounded-lg text-[10px] flex items-center justify-center gap-1.5 transition-all"
            >
              <FileSpreadsheet className="h-4 w-4" /> Export CSV templates
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-extrabold uppercase py-3 rounded-lg text-[10px] hover:opacity-90 transition-opacity"
            >
              Publish Challenge
            </button>
          </div>
        </div>

        {/* Dynamic challenges builder panel (Quiz vs Quest dialogues) */}
        <div className="glass-panel border-slate-800 rounded-2xl p-6 flex flex-col gap-4">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-2">Item content builder</span>

          {gameType === 'Quiz' ? (
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Prompt Question</label>
                <input
                  type="text"
                  placeholder="e.g. Which command deletes a system directory?"
                  value={tempPrompt}
                  onChange={(e) => setTempPrompt(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Multiple Choices (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="rm -rf, rmdir, cd, ls"
                  value={tempOptions}
                  onChange={(e) => setTempOptions(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-350 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Correct Answer</label>
                <input
                  type="text"
                  placeholder="rm -rf"
                  value={tempCorrect}
                  onChange={(e) => setTempCorrect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-300 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={addQuizQuestion}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700/60 rounded text-slate-300 font-bold uppercase text-[9px]"
              >
                + Append Question to list ({questions.length})
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Stage ID key</label>
                  <input
                    type="text"
                    placeholder="e.g. security_breach"
                    value={tempStageId}
                    onChange={(e) => setTempStageId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-300 outline-none animate-pulse"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Choice destination stage ID</label>
                  <input
                    type="text"
                    placeholder="finish_quest"
                    value={tempTarget}
                    onChange={(e) => setTempTarget(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-300 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Narrative Dialogue branch</label>
                <textarea
                  rows={2}
                  placeholder="What should the console display to student?"
                  value={tempDialogue}
                  onChange={(e) => setTempDialogue(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5">Target spoken command trigger</label>
                <input
                  type="text"
                  placeholder="e.g. override firewall"
                  value={tempCommand}
                  onChange={(e) => setTempCommand(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-300 outline-none"
                />
              </div>

              <button
                type="button"
                onClick={addQuestStage}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700/60 rounded text-slate-300 font-bold uppercase text-[9px]"
              >
                + Append Dialogue stage ({questStages.length})
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
