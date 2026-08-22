import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVoice, CommandMapping } from '../context/VoiceContext';
import { BookOpen, Sparkles, Volume2, Mic, MicOff, ArrowLeft, RefreshCw, HelpCircle, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface VoiceQuestProps {
  gameId: string;
  onBack: () => void;
}

export const VoiceQuest: React.FC<VoiceQuestProps> = ({ gameId, onBack }) => {
  const { token, updateUserStats } = useAuth();
  const { 
    registerCommands, 
    unregisterCommands, 
    speak, 
    isListening, 
    startRecognition, 
    stopRecognition, 
    pythonConnected,
    transcript 
  } = useVoice();

  const [quest, setQuest] = useState<any>(null);
  const [currentStageId, setCurrentStageId] = useState('start');
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);

  // Quiz-specific state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);

  // Time parameters
  const [timeParams] = useState({ start: Date.now() });
  const [vocalLogs, setVocalLogs] = useState({ executed: 0, failed: 0 });

  // RPG 2D Canvas Minimap State
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 2 });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const targetNodes = [
    { id: 'start', label: 'Start Node', x: 0, y: 2, color: '#10b981' },
    { id: 'shutdown_db', label: 'DB Shutdown', x: 2, y: 0, color: '#a855f7' },
    { id: 'fetch_logs', label: 'Logs Gateway', x: 2, y: 4, color: '#06b6d4' },
    { id: 'victory_lock', label: 'Mainframe Lock', x: 4, y: 2, color: '#eab308' },
    { id: 'destroyed_node', label: 'Breached Trap', x: 2, y: 2, color: '#ef4444' }
  ];

  const fetchQuest = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/games/${gameId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setQuest(data.game);
        // Start score baseline depending on type
        if (data.game.gameType === 'Quiz' || data.game.gameType === 'LogicPuzzle') {
          setScore(0);
        } else {
          setScore(100);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuest();
  }, [gameId]);

  const isQuiz = quest?.gameType === 'Quiz' || quest?.gameType === 'LogicPuzzle';
  const currentQuestion = quest?.questions?.[currentQuestionIdx];
  const currentStage = quest?.questStages?.find((stage: any) => stage.stageId === currentStageId);

  // Shuffle options dynamically when active question switches
  useEffect(() => {
    if (isQuiz && currentQuestion?.options) {
      const shuffled = [...currentQuestion.options].sort(() => Math.random() - 0.5);
      setShuffledOptions(shuffled);
    }
  }, [currentQuestionIdx, quest, isQuiz]);

  // Synchronize player position when stage changes from non-movement events
  useEffect(() => {
    if (!isQuiz && currentStageId) {
      const node = targetNodes.find(n => n.id === currentStageId);
      if (node) {
        setPlayerPos({ x: node.x, y: node.y });
      }
    }
  }, [currentStageId, isQuiz]);

  // RPG Minimap rendering loop
  useEffect(() => {
    if (isQuiz) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dark terminal background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cellWidth = canvas.width / 5;
    const cellHeight = canvas.height / 5;

    // Draw grid vectors
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellWidth, 0);
      ctx.lineTo(i * cellWidth, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellHeight);
      ctx.lineTo(canvas.width, i * cellHeight);
      ctx.stroke();
    }

    // Draw connection lines between nodes representing available paths
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0 * cellWidth + cellWidth / 2, 2 * cellHeight + cellHeight / 2);
    ctx.lineTo(2 * cellWidth + cellWidth / 2, 0 * cellHeight + cellHeight / 2);
    ctx.lineTo(4 * cellWidth + cellWidth / 2, 2 * cellHeight + cellHeight / 2);
    ctx.moveTo(0 * cellWidth + cellWidth / 2, 2 * cellHeight + cellHeight / 2);
    ctx.lineTo(2 * cellWidth + cellWidth / 2, 4 * cellHeight + cellHeight / 2);
    ctx.lineTo(4 * cellWidth + cellWidth / 2, 2 * cellHeight + cellHeight / 2);
    ctx.moveTo(2 * cellWidth + cellWidth / 2, 4 * cellHeight + cellHeight / 2);
    ctx.lineTo(2 * cellWidth + cellWidth / 2, 2 * cellHeight + cellHeight / 2);
    ctx.stroke();

    // Draw nodes
    targetNodes.forEach(node => {
      ctx.shadowBlur = 8;
      ctx.shadowColor = node.color;
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(node.x * cellWidth + cellWidth / 2, node.y * cellHeight + cellHeight / 2, 7, 0, Math.PI * 2);
      ctx.fill();

      // Label text
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#64748b';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x * cellWidth + cellWidth / 2, node.y * cellHeight + cellHeight / 2 - 12);
    });

    // Draw Player avatar
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#10b981';
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(playerPos.x * cellWidth + cellWidth / 2, playerPos.y * cellHeight + cellHeight / 2, 9, 0, Math.PI * 2);
    ctx.fill();

    // Player center light
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(playerPos.x * cellWidth + cellWidth / 2, playerPos.y * cellHeight + cellHeight / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }, [playerPos, isQuiz]);

  const movePlayer = (dx: number, dy: number) => {
    if (isQuiz) return;
    setPlayerPos(prev => {
      const nextX = Math.max(0, Math.min(4, prev.x + dx));
      const nextY = Math.max(0, Math.min(4, prev.y + dy));
      
      const matchedNode = targetNodes.find(node => node.x === nextX && node.y === nextY);
      if (matchedNode && matchedNode.id !== currentStageId) {
        const stageOption = currentStage?.options?.find((opt: any) => opt.targetStageId === matchedNode.id);
        if (stageOption) {
          handleSelectOption(stageOption);
          speak(`Navigating to ${matchedNode.label}`);
        } else if (matchedNode.id === 'start') {
          setCurrentStageId('start');
          speak("Reset coordinates to start node");
        } else {
          speak("Security path restricted. Unlock this node verbally first.");
        }
      }
      return { x: nextX, y: nextY };
    });
  };

  const handleSelectOption = (opt: any) => {
    setVocalLogs(prev => ({ ...prev, executed: prev.executed + 1 }));
    setScore(prev => prev + opt.xpGained);

    if (opt.targetStageId === 'finish_quest') {
      submitQuestOutcome(score + opt.xpGained);
    } else {
      setCurrentStageId(opt.targetStageId);
    }
  };

  // Evaluate single player Quiz answer selection
  const handleSelectQuizAnswer = (selectedOption: string) => {
    if (!currentQuestion) return;
    const isCorrect = selectedOption.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();
    
    setVocalLogs(prev => ({ ...prev, executed: prev.executed + 1 }));

    if (isCorrect) {
      speak("Correct answer!");
      // Add dynamic quiz points
      const points = 100 / quest.questions.length;
      const nextScore = score + points;
      setScore(nextScore);

      if (currentQuestionIdx + 1 < quest.questions.length) {
        setCurrentQuestionIdx(prev => prev + 1);
      } else {
        submitQuestOutcome(nextScore);
      }
    } else {
      speak("Incorrect answer. Try again or check the hint.");
      setVocalLogs(prev => ({ ...prev, failed: prev.failed + 1 }));
      setWrongAnswersCount(prev => prev + 1);
    }
  };

  const triggerQuizHint = () => {
    if (currentQuestion?.hint) {
      speak(`Hint: ${currentQuestion.hint}`);
    } else {
      speak("No hint available for this question.");
    }
  };

  const submitQuestOutcome = async (finalScoreValue?: number) => {
    try {
      const elapsed = Math.floor((Date.now() - timeParams.start) / 1000);
      const rawScore = finalScoreValue !== undefined ? finalScoreValue : score;
      const finalScore = Math.max(0, Math.min(100, Math.round(rawScore)));

      speak("Scenario solved successfully! Logging progress analytics.");
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });

      const res = await fetch(`/api/games/${gameId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          score: finalScore,
          timeSpentSeconds: elapsed,
          commandsExecuted: vocalLogs.executed,
          commandsFailed: vocalLogs.failed,
          hesitationIndex: wrongAnswersCount
        })
      });

      const data = await res.json();
      if (data.success) {
        updateUserStats(data.newXp, data.currentLevel);
      }
      onBack();
    } catch (e) {
      console.error(e);
      onBack();
    }
  };

  // Bind commands loop
  useEffect(() => {
    if (quest) {
      const stageCommands: CommandMapping[] = [];

      if (isQuiz && currentQuestion) {
        // Register verbal answer choice mappings
        const optionsToBind = shuffledOptions.length > 0 ? shuffledOptions : currentQuestion.options;
        optionsToBind.forEach((opt: string, idx: number) => {
          // Exact text match
          stageCommands.push({
            phrase: opt.toLowerCase(),
            description: `Select option: ${opt}`,
            action: () => handleSelectQuizAnswer(opt)
          });
          // "select option X" match
          stageCommands.push({
            phrase: `select option ${opt.toLowerCase()}`,
            description: `Select option: ${opt}`,
            action: () => handleSelectQuizAnswer(opt)
          });
          // "select number X" match
          stageCommands.push({
            phrase: `select number ${idx + 1}`,
            description: `Select index: ${idx + 1}`,
            action: () => handleSelectQuizAnswer(opt)
          });
          stageCommands.push({
            phrase: `select option ${idx + 1}`,
            description: `Select index: ${idx + 1}`,
            action: () => handleSelectQuizAnswer(opt)
          });
        });

        stageCommands.push({
          phrase: "give me a hint",
          description: "Read question hint card",
          action: () => triggerQuizHint()
        });

        // Initialize question speech vocalization
        speak(currentQuestion.prompt);
      } else if (currentStage) {
        // VoiceQuest narrative flow
        speak(currentStage.dialogue);

        currentStage.options.forEach((opt: any) => {
          stageCommands.push({
            phrase: opt.commandText,
            description: `Choose: ${opt.commandText}`,
            action: () => handleSelectOption(opt)
          });
        });

        stageCommands.push({
          phrase: "repeat the question",
          description: "Speak dialogue again",
          action: () => speak(currentStage.dialogue)
        });

        // Bind character navigation movement keys
        stageCommands.push(
          { phrase: "move up", description: "Move character up", action: () => movePlayer(0, -1) },
          { phrase: "go north", description: "Move character up", action: () => movePlayer(0, -1) },
          { phrase: "move down", description: "Move character down", action: () => movePlayer(0, 1) },
          { phrase: "go south", description: "Move character down", action: () => movePlayer(0, 1) },
          { phrase: "move left", description: "Move character left", action: () => movePlayer(-1, 0) },
          { phrase: "go west", description: "Move character left", action: () => movePlayer(-1, 0) },
          { phrase: "move right", description: "Move character right", action: () => movePlayer(1, 0) },
          { phrase: "go east", description: "Move character right", action: () => movePlayer(1, 0) }
        );
      }

      registerCommands(stageCommands);
    }

    return () => {
      unregisterCommands();
    };
  }, [currentStageId, quest, currentQuestionIdx, playerPos, shuffledOptions]);

  // Handle local microphone controls click
  const handleLocalMicToggle = () => {
    if (isListening) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="h-6 w-6 text-purple-400 animate-spin" />
        <span className="text-xs uppercase font-extrabold text-slate-500">Loading Game Arena...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 font-semibold uppercase"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </button>

        {/* Micro Controls Action Button */}
        <div className="flex items-center gap-2">
          {pythonConnected ? (
            <span className="text-[10px] bg-purple-950/60 border border-purple-800 text-purple-400 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider shadow-glowPurple animate-pulse flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Python Speech Engine Active
            </span>
          ) : (
            <button
              onClick={handleLocalMicToggle}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 transition-all ${
                isListening 
                  ? "bg-purple-600 border-purple-400 text-white shadow-glowPurple animate-pulse"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              {isListening ? (
                <>
                  <Mic className="h-3.5 w-3.5" /> Stop Listening
                </>
              ) : (
                <>
                  <MicOff className="h-3.5 w-3.5" /> Start Listening
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full glass-panel border-purple-500/20 rounded-2xl p-6 flex flex-col gap-6"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] bg-purple-950 font-bold border border-purple-800 text-purple-300 px-2 py-0.5 rounded uppercase font-mono">
              {isQuiz ? 'Python Verbal Quiz' : 'VoiceQuest Campaign'}
            </span>
            <h3 className="text-lg font-bold text-slate-200 mt-1">{quest?.title}</h3>
          </div>
          <BookOpen className="h-5 w-5 text-purple-400" />
        </div>

        {/* -------------------- RENDER QUIZ UI -------------------- */}
        {isQuiz && currentQuestion && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-purple-400 font-extrabold uppercase font-mono">Question {currentQuestionIdx + 1} of {quest.questions.length}</span>
                <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 font-mono">Score: {Math.round(score)} XP</span>
              </div>
              <p className="text-sm text-slate-250 leading-relaxed font-bold">
                {currentQuestion.prompt}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Speak choices aloud:</span>
              <div className="grid grid-cols-1 gap-2.5">
                {(shuffledOptions.length > 0 ? shuffledOptions : currentQuestion.options).map((opt: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectQuizAnswer(opt)}
                    className="w-full text-left p-3.5 rounded-lg border border-slate-850 bg-slate-950/40 hover:border-purple-500/30 hover:bg-slate-900 text-xs font-semibold text-slate-300 flex items-center justify-between group transition-all"
                  >
                    <span>🗣 " {opt} "</span>
                    <span className="text-[9px] text-slate-500 group-hover:text-purple-400 uppercase font-mono">Option {idx + 1}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-2">
              <button
                onClick={triggerQuizHint}
                className="py-2.5 px-4 border border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-400 hover:text-slate-200 text-xs font-bold uppercase rounded-lg flex items-center justify-center gap-1.5 transition-all"
              >
                <HelpCircle className="h-4 w-4" /> Hint Advice
              </button>
            </div>
          </div>
        )}

        {/* -------------------- RENDER VOICEQUEST UI -------------------- */}
        {!isQuiz && (
          <>
            {/* Narrative terminal view */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 min-h-[120px] flex flex-col justify-between">
              <p className="text-sm text-slate-300 leading-relaxed font-semibold">
                {currentStage?.dialogue}
              </p>

              <div className="flex items-center gap-1.5 mt-4 text-[10px] text-purple-400 font-bold uppercase cursor-pointer" onClick={() => speak(currentStage?.dialogue)}>
                <Volume2 className="h-4 w-4" /> Repeat Audio Scenarios
              </div>
            </div>

            {/* RPG Canvas Grid Minimap */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Voice-Controlled RPG Minimap</span>
              <div className="w-full flex justify-center items-center bg-slate-950 border border-slate-850 rounded-xl overflow-hidden p-4">
                <canvas 
                  ref={canvasRef} 
                  width={400} 
                  height={200} 
                  className="border border-purple-500/10 rounded-lg max-w-full"
                />
              </div>
              <div className="text-[9px] text-slate-500 font-mono text-center">
                🗣 Say: "move right", "move up", "move down", "move left" to pilot the green player dot.
              </div>
            </div>

            {/* Dynamic speech triggers */}
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono">Verbally Speak one of these options:</span>
              
              <div className="flex flex-col gap-2">
                {currentStage?.options?.map((opt: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleSelectOption(opt)}
                    className="w-full text-left p-3.5 rounded-lg border border-slate-800 bg-slate-950/40 hover:border-purple-500/30 hover:bg-slate-900 text-xs font-semibold text-slate-300 flex items-center justify-between group transition-all"
                  >
                    <span>🗣 " {opt.commandText} "</span>
                    <span className="text-[10px] text-slate-500 group-hover:text-purple-400 uppercase font-mono">[{opt.xpGained} XP]</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Standby status overlays */}
        {isListening ? (
          <div className="flex items-center justify-center gap-2 p-3 bg-purple-950/20 border border-purple-800/20 rounded-xl text-xs text-purple-300 font-bold uppercase py-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-ping"></span> Speech Listener active. Speak choice option directly.
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 p-3 bg-slate-900 border border-slate-800/80 rounded-xl text-xs text-slate-500 font-bold uppercase py-2">
            <Mic className="h-4 w-4 text-slate-600 animate-pulse" /> Microphone Offline. Enable toggling above or in navbar to speak.
          </div>
        )}
      </motion.div>
    </div>
  );
};
