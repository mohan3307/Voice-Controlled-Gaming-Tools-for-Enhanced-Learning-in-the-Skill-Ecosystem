import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVoice, CommandMapping } from '../context/VoiceContext';
import { Terminal, Code, PlayCircle, HelpCircle, ArrowLeft, RefreshCw, Brain, Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface CodingBattleProps {
  gameId: string;
  onBack: () => void;
}

const translateSpokenToCode = (spoken: string, isPython: boolean): string => {
  let text = spoken.toLowerCase().trim();
  
  // Clean up start phrase if present
  if (text.startsWith('dictate ')) {
    text = text.replace(/^dictate\s+/, '');
  }

  if (isPython) {
    // Python syntax translations
    // 1. declare constant X equals Y -> X = Y
    let match = text.match(/declare\s+constant\s+(\w+)\s+equals\s+(.+)/);
    if (match) {
      const val = parseValue(match[2]);
      return `${match[1]} = ${val}`;
    }

    // 2. declare variable X equals Y -> X = Y
    match = text.match(/declare\s+variable\s+(\w+)\s+equals\s+(.+)/);
    if (match) {
      const val = parseValue(match[2]);
      return `${match[1]} = ${val}`;
    }

    // 3. create function X -> def X():\n    pass
    match = text.match(/create\s+function\s+(\w+)/);
    if (match) {
      return `def ${match[1]}():\n    pass`;
    }

    // 4. return X -> return X
    match = text.match(/return\s+(.+)/);
    if (match) {
      return `return ${match[1]}`;
    }

    // 5. print X -> print(X)
    match = text.match(/print\s+(.+)/);
    if (match) {
      const val = parseValue(match[1]);
      return `print(${val})`;
    }

    // 6. comment X -> # X
    match = text.match(/comment\s+(.+)/);
    if (match) {
      return `# ${match[1]}`;
    }
  } else {
    // JavaScript/TypeScript translations
    // 1. declare constant X equals Y -> const X = Y;
    let match = text.match(/declare\s+constant\s+(\w+)\s+equals\s+(.+)/);
    if (match) {
      const val = parseValue(match[2]);
      return `const ${match[1]} = ${val};`;
    }

    // 2. declare variable X equals Y -> let X = Y;
    match = text.match(/declare\s+variable\s+(\w+)\s+equals\s+(.+)/);
    if (match) {
      const val = parseValue(match[2]);
      return `let ${match[1]} = ${val};`;
    }

    // 3. create function X -> function X() {\n  \n}
    match = text.match(/create\s+function\s+(\w+)/);
    if (match) {
      return `function ${match[1]}() {\n  \n}`;
    }

    // 4. return X -> return X;
    match = text.match(/return\s+(.+)/);
    if (match) {
      return `return ${match[1]};`;
    }

    // 5. print X -> console.log(X);
    match = text.match(/print\s+(.+)/);
    if (match) {
      const val = parseValue(match[1]);
      return `console.log(${val});`;
    }

    // 6. comment X -> // X
    match = text.match(/comment\s+(.+)/);
    if (match) {
      return `// ${match[1]}`;
    }
  }

  return text; // fallback
};

const parseValue = (val: string): string => {
  val = val.trim();
  if (/^\d+$/.test(val)) return val;
  const numMap: { [key: string]: string } = {
    'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
    'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
    'ten': '10', 'hundred': '100'
  };
  if (numMap[val]) return numMap[val];
  if (val.startsWith('"') || val.startsWith("'")) return val;
  return `"${val}"`;
};

export const CodingBattle: React.FC<CodingBattleProps> = ({ gameId, onBack }) => {
  const { token, updateUserStats } = useAuth();
  const { 
    registerCommands, 
    unregisterCommands, 
    speak, 
    transcript,
    isListening,
    startRecognition,
    stopRecognition,
    pythonConnected
  } = useVoice();

  const [game, setGame] = useState<any>(null);
  const [activeChallengeIndex, setActiveChallengeIndex] = useState(0);
  const [codeLines, setCodeLines] = useState<string[]>([]);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [logs, setLogs] = useState({ executed: 0, failed: 0 });
  
  const [loading, setLoading] = useState(true);
  const [timeParams] = useState({ start: Date.now() });

  // Dictation States
  const [dictationBuffer, setDictationBuffer] = useState('');
  const [translatedCode, setTranslatedCode] = useState('');

  // AI Tutor advice state
  const [tutorMessage, setTutorMessage] = useState<string | null>(null);

  const fetchGame = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/games/${gameId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setGame(data.game);
        if (data.game?.codingChallenges?.length > 0) {
          setCodeLines(data.game.codingChallenges[0].buggyCode.split('\n'));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  const activeChallenge = game?.codingChallenges?.[activeChallengeIndex];
  const isPython = activeChallenge?.language === 'python';

  const selectTargetLine = (lineIdx: number) => {
    setSelectedLine(lineIdx);
    speak(`Line ${lineIdx + 1} selected.`);
    setLogs(prev => ({ ...prev, executed: prev.executed + 1 }));
  };

  const applyBugFix = () => {
    if (!activeChallenge) return;
    const updated = [...codeLines];
    updated[activeChallenge.correctLineIndex] = activeChallenge.correctLine;
    setCodeLines(updated);
    speak("Scoping fix applied to buffer template.");
    setLogs(prev => ({ ...prev, executed: prev.executed + 1 }));
  };

  const triggerVocalHint = () => {
    if (!activeChallenge) return;
    const items = activeChallenge.hints;
    const currentClue = items[hintIndex % items.length];
    speak(currentClue);
    setHintIndex(prev => prev + 1);
    setLogs(prev => ({ ...prev, executed: prev.executed + 1 }));
  };

  // AI Coding Tutor Facility
  const askAITutor = () => {
    if (!activeChallenge) return;
    
    let explanation = "";
    if (isPython) {
      explanation = `Hey there! In Python, we define code structures using strict indentation (typically 4 spaces) instead of curly braces. Also, we declare variables simply as name equals value, without any let or var keywords. For this challenge, we have a while-loop. To avoid an infinite loop, we must increment the count variable inside the loop body using count plus equals one.`;
    } else {
      explanation = `Hey there! In JavaScript, declaring variables with let or const has block scope. Reading them before their declaration line is not allowed and throws a ReferenceError. You can fix this hoisting bug by commenting out the console log line.`;
    }
    
    speak(explanation);
    setTutorMessage(explanation);
    setLogs(prev => ({ ...prev, executed: prev.executed + 1 }));
    setTimeout(() => setTutorMessage(null), 15000);
  };

  const clearDictationBuffer = () => {
    setDictationBuffer('');
    setTranslatedCode('');
    speak("Dictation buffer cleared.");
  };

  const insertDictatedLine = () => {
    if (!translatedCode) {
      speak("No code translated to insert.");
      return;
    }
    if (selectedLine !== null) {
      const updated = [...codeLines];
      updated[selectedLine] = translatedCode;
      setCodeLines(updated);
      speak(`Inserted code at line ${selectedLine + 1}.`);
    } else {
      setCodeLines(prev => [...prev, translatedCode]);
      speak("Appended code to buffer.");
    }
  };

  const evaluateCodeSubmission = async () => {
    if (!activeChallenge || !game) return;

    const isFixed = codeLines[activeChallenge.correctLineIndex] === activeChallenge.correctLine;

    if (!isFixed) {
      speak("Compilation Failure on sandbox buffer. Please review instructions and try again.");
      setLogs(prev => ({ ...prev, failed: prev.failed + 1 }));
      return;
    }

    // Check if there is another challenge in this level
    if (activeChallengeIndex + 1 < game.codingChallenges.length) {
      speak("Syntax compilation successful! Correct. Loading next problem.");
      confetti({ particleCount: 50, spread: 40 });
      
      const nextIndex = activeChallengeIndex + 1;
      setActiveChallengeIndex(nextIndex);
      setCodeLines(game.codingChallenges[nextIndex].buggyCode.split('\n'));
      setSelectedLine(null);
      setLogs(prev => ({ ...prev, executed: prev.executed + 1 }));
      return;
    }

    // All challenges completed successfully!
    speak("All challenges completed successfully! Committing records.");
    confetti({ particleCount: 80, spread: 60 });

    try {
      const elapsed = Math.floor((Date.now() - timeParams.start) / 1000);
      const res = await fetch(`/api/games/${gameId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          score: 100,
          timeSpentSeconds: elapsed,
          commandsExecuted: logs.executed,
          commandsFailed: logs.failed
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

  // Watch for custom dictation prefixes in real time
  useEffect(() => {
    if (transcript && transcript.startsWith('dictate ')) {
      const phrase = transcript.replace(/^dictate\s+/, '');
      setDictationBuffer(phrase);
      const code = translateSpokenToCode(phrase, isPython);
      setTranslatedCode(code);
      speak(`Translated as: ${code}`);
    }
  }, [transcript, isPython]);

  // Configure Speech Recognition mappings
  useEffect(() => {
    if (activeChallenge) {
      const commands: CommandMapping[] = [
        {
          phrase: "give me a hint",
          description: "Read task hint card",
          action: () => triggerVocalHint()
        },
        {
          phrase: "select line two",
          description: "Highlights the line index 1",
          action: () => selectTargetLine(1)
        },
        {
          phrase: "select line three",
          description: "Highlights the line index 2",
          action: () => selectTargetLine(2)
        },
        {
          phrase: "select line four",
          description: "Highlights the line index 3",
          action: () => selectTargetLine(3)
        },
        {
          phrase: "select line five",
          description: "Highlights the line index 4",
          action: () => selectTargetLine(4)
        },
        {
          phrase: "apply scoping fix",
          description: "Overwrites the buggy code",
          action: () => applyBugFix()
        },
        {
          phrase: "submit code answer",
          description: "Evaluates score and logs progress",
          action: () => evaluateCodeSubmission()
        },
        {
          phrase: "insert dictated line",
          description: "Write translated buffer line into active code",
          action: () => insertDictatedLine()
        },
        {
          phrase: "clear dictation",
          description: "Clear speech dictation buffer",
          action: () => clearDictationBuffer()
        },
        {
          phrase: "clear buffer",
          description: "Clear speech dictation buffer",
          action: () => clearDictationBuffer()
        },
        {
          phrase: "ask AI tutor",
          description: "Generate vocal coding tutor explanation",
          action: () => askAITutor()
        },
        {
          phrase: "explain code",
          description: "Generate vocal coding tutor explanation",
          action: () => askAITutor()
        }
      ];
      registerCommands(commands);
    }

    return () => {
      unregisterCommands();
    };
  }, [activeChallenge, codeLines, selectedLine, translatedCode, isPython]);

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
        <span className="text-xs uppercase font-extrabold text-slate-500">Initializing Debug Compiler...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
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
            <span className="text-[10px] bg-purple-950/60 border border-purple-800 text-purple-400 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider shadow-glowPurple flex items-center gap-1.5">
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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full glass-panel border-cyan-500/20 rounded-2xl p-6 flex flex-col gap-6"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="text-[10px] bg-cyan-950 font-bold border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded uppercase font-mono">
              Coding Battle Sandbox ({activeChallenge?.language}) - Problem {activeChallengeIndex + 1} of {game?.codingChallenges?.length || 1}
            </span>
            <h3 className="text-lg font-bold text-slate-200 mt-1">{game?.title}</h3>
          </div>
          <Code className="h-5 w-5 text-cyan-400" />
        </div>

        {/* AI Tutor Advice Banner */}
        {tutorMessage && (
          <div className="p-4 bg-purple-950/60 border border-purple-800 rounded-xl flex gap-3 items-start animate-pulse">
            <Brain className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="block text-[10px] font-black uppercase text-purple-300 tracking-wider">AI Coding Tutor explanation</span>
              <p className="text-xs text-slate-300 mt-1 italic leading-relaxed">{tutorMessage}</p>
            </div>
          </div>
        )}

        <div>
          <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Challenge Objective</span>
          <p className="text-xs text-slate-300 bg-slate-900 border border-slate-800/80 p-3.5 rounded-lg leading-relaxed">
            {activeChallenge?.instructions}
          </p>
        </div>

        {/* Code display screen */}
        <div className="flex flex-col border border-slate-800 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs shadow-inner">
          <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 text-[10px] uppercase font-extrabold text-slate-500 tracking-widest flex items-center justify-between">
            <span>main.py - sandbox editor</span>
            <span>Python compiler v3.10</span>
          </div>

          <div className="p-4 flex flex-col gap-1 min-h-[120px]">
            {codeLines.map((line, idx) => {
              const isSelected = selectedLine === idx;
              let rowBg = isSelected ? 'bg-cyan-950/40 text-cyan-200 border-l-2 border-cyan-450' : '';

              return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedLine(idx)}
                  className={`flex items-center py-1 px-3 rounded transition-colors cursor-pointer hover:bg-slate-900/60 ${rowBg}`}
                >
                  <span className="w-8 select-none text-[10px] text-slate-600 text-right pr-3">{idx + 1}</span>
                  {isSelected ? (
                    <input
                      type="text"
                      value={line}
                      onChange={(e) => {
                        const updated = [...codeLines];
                        updated[idx] = e.target.value;
                        setCodeLines(updated);
                      }}
                      className="bg-slate-950 border border-cyan-500 rounded px-2.5 py-1 text-cyan-200 font-mono text-xs focus:outline-none w-full"
                      autoFocus
                    />
                  ) : (
                    <pre className="whitespace-pre font-mono text-xs">{line}</pre>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Speech-to-Code Dictation Workspace */}
        <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400">Speech-to-Code Workspace</span>
            <span className="text-[9px] bg-cyan-950/40 border border-cyan-850 text-cyan-300 px-2 py-0.5 rounded font-mono">
              Prefix speech with "dictate ..."
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1 bg-slate-950 p-3 rounded-lg border border-slate-850">
              <span className="text-[9px] uppercase font-bold text-slate-500">Spoken Words Buffer</span>
              <p className="text-xs text-slate-400 italic min-h-6">
                {dictationBuffer ? `"${dictationBuffer}"` : isPython ? "Try: 'dictate declare variable count equals zero'" : "Try: 'dictate declare constant score equals hundred'"}
              </p>
            </div>
            <div className="flex flex-col gap-1 bg-slate-950 p-3 rounded-lg border border-slate-850">
              <span className="text-[9px] uppercase font-bold text-slate-500">Compiled {isPython ? 'Python' : 'JS'} Syntax</span>
              <code className="text-xs text-cyan-400 font-mono min-h-6 block">
                {translatedCode || "// Code translation will display here"}
              </code>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
            <div className="text-[10px] text-slate-400 font-semibold">
              🗣 Speak <span className="text-slate-200">"insert dictated line"</span> to write, or <span className="text-slate-200">"clear dictation"</span> to reset.
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearDictationBuffer}
                className="px-3 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-400 hover:text-slate-200 font-bold uppercase transition-all"
              >
                Clear
              </button>
              <button
                onClick={insertDictatedLine}
                className="px-3 py-1 bg-cyan-950/40 border border-cyan-800 rounded text-[10px] text-cyan-400 hover:text-cyan-200 font-bold uppercase transition-all"
              >
                Insert Line
              </button>
            </div>
          </div>
        </div>

        {/* Quick Speak Instructions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col gap-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Sandbox Vocal Commands</span>
            <ul className="text-xs text-slate-400 flex flex-col gap-1.5 font-semibold">
              <li>🗣 " select line two " / " select line five "</li>
              <li>🗣 " apply scoping fix " (Inject correct line)</li>
              <li>🗣 " ask AI tutor " / " explain code " (Vocal advice)</li>
              <li>🗣 " give me a hint " / " submit code answer "</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col justify-between gap-3">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Calibration Output</span>
              <span className="block text-xs mt-1 font-semibold text-slate-200">Selected Line: {selectedLine !== null ? `Line ${selectedLine + 1}` : 'None'}</span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={askAITutor}
                className="flex-1 py-2 border border-purple-800 hover:bg-purple-950/20 rounded-lg text-purple-400 hover:text-purple-300 text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all"
              >
                <Brain className="h-4 w-4" /> Ask AI Tutor
              </button>
              <button
                onClick={applyBugFix}
                className="flex-1 py-2 border border-slate-800 rounded-lg hover:border-cyan-500/40 bg-slate-950/40 hover:bg-slate-900 text-slate-400 hover:text-cyan-300 text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all"
              >
                <PlayCircle className="h-4 w-4" /> Fix line
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={evaluateCodeSubmission}
          className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-extrabold uppercase py-3 rounded-lg text-xs shadow-lg tracking-wider transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
        >
          <Terminal className="h-4 w-4" /> Submit Compiler Sandbox
        </button>
      </motion.div>
    </div>
  );
};
