import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVoice, CommandMapping } from '../context/VoiceContext';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { Gamepad2, Users, Trophy, KeyRound, ArrowLeft, Volume2, MessageSquare, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

interface MultiplayerArenaProps {
  onBack: () => void;
}

export const MultiplayerArena: React.FC<MultiplayerArenaProps> = ({ onBack }) => {
  const { user } = useAuth();
  const { registerCommands, unregisterCommands, speak } = useVoice();

  // Socket state
  const socketRef = useRef<Socket | null>(null);

  // Form states
  const [roomId, setRoomId] = useState('');
  const [username] = useState(user?.username || 'Gamer');
  const [inLobby, setInLobby] = useState(false);

  // Active lobby room state
  const [roomState, setRoomState] = useState<any>(null);
  
  // Game states
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [peerActivity, setPeerActivity] = useState<string | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [winnerMessage, setWinnerMessage] = useState('');
  
  // Buzzer details
  const [buzzerTimer, setBuzzerTimer] = useState(0);

  // Sample Multiplayer questions set
  const questionsSet = [
    { prompt: 'Resolve HTTP status indicating page not found.', options: ['404', '200', '500', '403'], correctAnswer: '404' },
    { prompt: 'Select the command that creates a directory.', options: ['mkdir', 'rmdir', 'cd', 'ls'], correctAnswer: 'mkdir' },
    { prompt: 'What scope does "const" hold in variables?', options: ['Block Scope', 'Global Scope', 'Hoisted Scope', 'Prototype Scope'], correctAnswer: 'Block Scope' }
  ];

  useEffect(() => {
    // Establish WebSocket connection
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('room_update', (room: any) => {
      setRoomState(room);
    });

    socketRef.current.on('game_started', (room: any) => {
      setRoomState(room);
      setGameOver(false);
      setWinnerMessage('');
      setCurrentQuestionIdx(0);
      setBuzzerTimer(0);
      speak("The speed battle has commenced. Speak buzzer to lock your turn first!");
    });

    socketRef.current.on('timer_update', (timer: number) => {
      setRoomState((prev: any) => prev ? { ...prev, timer } : null);
    });

    socketRef.current.on('peer_voice_action', ({ username: peerName, phrase }) => {
      setPeerActivity(`${peerName} spoke: "${phrase}"`);
      setTimeout(() => setPeerActivity(null), 3000);
    });

    socketRef.current.on('buzzer_locked', ({ username: lockerName, buzzerTimer: seconds }) => {
      setBuzzerTimer(seconds);
      speak(`Buzzer locked by ${lockerName === username ? 'you' : lockerName}`);
    });

    socketRef.current.on('buzzer_released', () => {
      setBuzzerTimer(0);
    });

    socketRef.current.on('game_over', (finalRoom: any) => {
      setRoomState(finalRoom);
      setGameOver(true);
      
      // Determine winner
      const players = finalRoom.players;
      players.sort((a: any, b: any) => b.score - a.score);
      const top = players[0];

      if (top) {
        if (top.username === username) {
          setWinnerMessage("Congratulations! You won the speed battle!");
          confetti({ particleCount: 60, spread: 45 });
        } else {
          setWinnerMessage(`Victory claimed by ${top.username}.`);
        }
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Buzzer Countdown Interval handler
  useEffect(() => {
    let interval: any = null;
    const holder = roomState?.activeBuzzerHolder;

    if (holder && buzzerTimer > 0) {
      interval = setInterval(() => {
        setBuzzerTimer(prev => {
          if (prev <= 1) {
            // Auto release if we are the holder
            if (holder === username) {
              socketRef.current?.emit('release_buzzer', { roomId });
              speak("Buzzer response window timed out.");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [roomState?.activeBuzzerHolder, buzzerTimer]);

  const triggerBuzzer = () => {
    if (roomState?.activeBuzzerHolder) return;
    socketRef.current?.emit('hit_buzzer', { roomId, username });
  };

  // Hook spoken options depending on Buzzer holder state
  useEffect(() => {
    if (inLobby && roomState?.isActive && !gameOver) {
      const q = questionsSet[currentQuestionIdx % questionsSet.length];
      const commands: CommandMapping[] = [];

      const activeHolder = roomState?.activeBuzzerHolder;

      if (!activeHolder) {
        // Register verbal buzzer claims
        commands.push({
          phrase: "buzzer",
          description: "Lock buzzer access verbally",
          action: () => triggerBuzzer()
        });
        commands.push({
          phrase: "hit buzzer",
          description: "Lock buzzer access verbally",
          action: () => triggerBuzzer()
        });
      } else if (activeHolder === username) {
        // Register answer option selections
        q.options.forEach(opt => {
          commands.push({
            phrase: `select option ${opt.toLowerCase()}`,
            description: `Choose option ${opt}`,
            action: () => handleSelectOption(opt, q.correctAnswer)
          });
        });
      }

      commands.push({
        phrase: "repeat the question",
        description: "Speak query prompt",
        action: () => speak(q.prompt)
      });

      registerCommands(commands);
    }
    
    return () => {
      unregisterCommands();
    };
  }, [inLobby, roomState?.isActive, roomState?.activeBuzzerHolder, currentQuestionIdx, gameOver]);

  const joinLobby = () => {
    if (!roomId) return;
    socketRef.current?.emit('join_room', {
      roomId,
      username,
      gameTitle: 'Console Showdown'
    });
    setInLobby(true);
  };

  const startBattle = () => {
    socketRef.current?.emit('start_game', { roomId });
  };

  const handleSelectOption = (opt: string, correctAns: string) => {
    const isCorrect = opt.toLowerCase() === correctAns.toLowerCase();
    
    socketRef.current?.emit('voice_action', {
      roomId,
      username,
      phrase: `Select Option ${opt}`
    });

    if (isCorrect) {
      speak("Correct answer!");
      socketRef.current?.emit('submit_score', { roomId, username, scoreDelta: 15 });
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      speak("Wrong choice. Score deducted.");
      socketRef.current?.emit('submit_score', { roomId, username, scoreDelta: -5 });
      socketRef.current?.emit('release_buzzer', { roomId });
    }
  };

  const leaveLobby = () => {
    socketRef.current?.emit('leave_room', { roomId, username });
    setInLobby(false);
    setGameOver(false);
  };

  const currentQuestion = questionsSet[currentQuestionIdx % questionsSet.length];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button 
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-350 font-semibold mb-6 uppercase"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
      </button>

      {!inLobby ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md mx-auto glass-panel border-slate-800 rounded-2xl p-6 flex flex-col gap-6"
        >
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="p-3 bg-gradient-to-tr from-cyan-400 to-purple-600 rounded-2xl">
              <Gamepad2 className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wider text-slate-200 mt-2">Multiplayer Arena</h3>
            <p className="text-xs text-slate-450 leading-relaxed max-w-xs">Host or join head-to-head lobbies to speed race coding quizzes verbally.</p>
          </div>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Lobby Access Code</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. room-101"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg py-2.5 pl-3 pr-10 text-xs text-slate-200 outline-none"
                />
                <KeyRound className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-550" />
              </div>
            </div>

            <button
              onClick={joinLobby}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 font-extrabold uppercase py-3 rounded-lg text-xs leading-none shadow tracking-wider mt-2 hover:opacity-90 animate-pulse"
            >
              Initialize Arena Lobby
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full glass-panel-neon-cyan border border-cyan-500/20 rounded-2xl p-6 flex flex-col gap-6 shadow-glowCyan"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] bg-cyan-950 font-bold border border-cyan-800 text-cyan-300 px-2 py-0.5 rounded font-mono uppercase">
                Room: {roomId}
              </span>
              <h3 className="text-base font-bold text-slate-200 mt-1">{roomState?.gameTitle}</h3>
            </div>
            <Users className="h-5 w-5 text-cyan-400 animate-pulse" />
          </div>

          {peerActivity && (
            <div className="p-2.5 bg-purple-950/40 border border-purple-800/80 rounded-lg text-[10px] text-purple-300 font-semibold flex items-center gap-1.5 animate-pulse">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{peerActivity}</span>
            </div>
          )}

          {!roomState?.isActive ? (
            <div className="flex flex-col gap-6 items-center py-10 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400 animate-pulse">Waiting for Opponents...</span>
              
              <div className="flex flex-wrap gap-3 justify-center">
                {roomState?.players?.map((p: any, idx: number) => (
                  <div key={idx} className="px-4 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs font-bold text-slate-200">
                    🏆 {p.username}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={leaveLobby}
                  className="px-4 py-2 text-xs font-bold uppercase text-slate-400 bg-slate-950 border border-slate-800 rounded-lg hover:border-slate-700"
                >
                  Leave Lobby
                </button>
                <button
                  onClick={startBattle}
                  className="px-4 py-2 text-xs font-black uppercase text-white bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg"
                >
                  Launch Battle
                </button>
              </div>
            </div>
          ) : gameOver ? (
            <div className="flex flex-col items-center gap-4 py-12 text-center bg-slate-900 rounded-xl">
              <Trophy className="h-10 w-10 text-yellow-400 animate-pulse" />
              <h4 className="text-md font-bold text-slate-200">{winnerMessage}</h4>
              <button
                onClick={leaveLobby}
                className="px-5 py-2.5 bg-slate-950 border border-slate-805 text-slate-400 hover:text-slate-200 font-bold uppercase text-xs rounded-lg mt-3"
              >
                Close Arena Lobbies
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Emergency Verbal Buzzer Banner */}
              <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black tracking-widest text-cyan-400">Verbal Arena Buzzer</span>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {!roomState?.activeBuzzerHolder 
                      ? "Speak 'buzzer' or click the button to claim your turn!"
                      : roomState.activeBuzzerHolder === username
                        ? "You have the floor! Speak the correct option before the timer runs out."
                        : `${roomState.activeBuzzerHolder} has locked the buzzer.`}
                  </p>
                </div>

                <motion.button
                  onClick={triggerBuzzer}
                  disabled={!!roomState?.activeBuzzerHolder}
                  className={`px-6 py-3 rounded-full text-xs font-mono font-black uppercase tracking-wider transition-all duration-300 ${
                    !roomState?.activeBuzzerHolder
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-glowRed border border-rose-500 cursor-pointer"
                      : roomState.activeBuzzerHolder === username
                        ? "bg-emerald-600 text-white shadow-glowGreen border border-emerald-500"
                        : "bg-slate-950 text-slate-600 border border-slate-900"
                  }`}
                >
                  {!roomState?.activeBuzzerHolder 
                    ? "🚨 HIT BUZZER" 
                    : roomState.activeBuzzerHolder === username
                      ? `🟢 YOUR TURN: ${buzzerTimer}s`
                      : `🔒 LOCKED: ${roomState.activeBuzzerHolder} (${buzzerTimer}s)`}
                </motion.button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Question card */}
                <div className="md:col-span-2 flex flex-col gap-6">
                  <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl flex flex-col justify-between min-h-[140px]">
                    <p className="text-sm font-bold text-slate-300">{currentQuestion?.prompt}</p>
                    
                    <div className="text-[10px] text-cyan-400 font-bold uppercase flex items-center gap-1.5 mt-3 select-none cursor-pointer" onClick={() => speak(currentQuestion.prompt)}>
                      <Volume2 className="h-4 w-4" /> Trigger Voice Readout
                    </div>
                  </div>

                  {/* Spoken directives */}
                  <div className="flex flex-col gap-2.5">
                    <span className="text-[10px] uppercase font-bold text-slate-450 tracking-wider">
                      {roomState?.activeBuzzerHolder === username 
                        ? "Options to speak aloud:" 
                        : "Hit the buzzer to enable options:"}
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {currentQuestion?.options?.map((opt, idx) => {
                        const isDisabled = roomState?.activeBuzzerHolder !== username;
                        return (
                          <button
                            key={idx}
                            disabled={isDisabled}
                            onClick={() => handleSelectOption(opt, currentQuestion.correctAnswer)}
                            className={`p-3 border rounded-xl text-left text-xs font-semibold transition-all ${
                              isDisabled
                                ? "bg-slate-950/20 border-slate-900 text-slate-650 cursor-not-allowed opacity-40"
                                : "bg-slate-950 border-slate-850 hover:border-cyan-500/40 text-slate-300 hover:bg-slate-900"
                            }`}
                          >
                            🗣 " select option {opt.toLowerCase()} "
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Real-time scoreboard */}
                <div className="md:col-span-1 glass-panel border-slate-850 rounded-xl p-5 flex flex-col gap-5 justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Timer</span>
                      <span className="text-xs font-black text-rose-400">{roomState?.timer}s</span>
                    </div>
                    <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full" style={{ width: `${(roomState?.timer / 60) * 100}%` }}></div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">Live Rankings</span>
                    <div className="flex flex-col gap-2.5">
                      {roomState?.players?.map((p: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-300">⚔ {p.username}</span>
                          <span className="font-extrabold text-cyan-400 uppercase font-mono">{p.score} PTS</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={leaveLobby}
                    className="w-full bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 py-2.5 rounded-lg font-bold uppercase text-[9px] mt-4"
                  >
                    Forfeit Battle
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};
