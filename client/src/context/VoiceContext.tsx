import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config';

export interface CommandMapping {
  phrase: string;
  action: () => void;
  description: string;
}

interface VoiceContextType {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  speechHistory: Array<{ text: string; confidence: number; timestamp: string; matched: boolean }>;
  voiceEnabled: boolean;
  startRecognition: () => void;
  stopRecognition: () => void;
  speak: (text: string, overrideRate?: number, overridePitch?: number) => void;
  registerCommands: (commands: CommandMapping[]) => void;
  unregisterCommands: () => void;
  microphoneSettings: { gain: number; noiseCancelling: boolean; language: string };
  updateMicrophoneSettings: (settings: any) => void;
  speechRate: number;
  speechPitch: number;
  setSpeechSettings: (rate: number, pitch: number) => void;
  pythonConnected: boolean;
  connectVoiceSocket: (username: string) => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(1);
  const [speechHistory, setSpeechHistory] = useState<VoiceContextType['speechHistory']>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [microphoneSettings, setMicrophoneSettings] = useState({
    gain: 1.0,
    noiseCancelling: true,
    language: 'en-US'
  });

  // Global Speech synthesis modifiers
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);

  // Python socket connection state
  const [pythonConnected, setPythonConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const setSpeechSettings = (rate: number, pitch: number) => {
    setSpeechRate(rate);
    setSpeechPitch(pitch);
  };

  const commandsRef = useRef<CommandMapping[]>([]);
  const recognitionRef = useRef<any>(null);

  // Connect Voice WebSockets to bridge Python commands
  const connectVoiceSocket = (username: string) => {
    if (socketRef.current) return; // Already initialized

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_personal_room', { username });
    });

    socket.on('response_status', () => {
      setPythonConnected(true);
    });

    socket.on('python_voice_command', ({ phrase }) => {
      // Feed voice command transcript from Python directly to parser
      setTranscript(phrase);
      setConfidence(0.98);
      processVoiceCommand(phrase, 0.98);
    });

    socket.on('disconnect', () => {
      setPythonConnected(false);
    });
  };

  // Setup Web Speech Recognition Instance (local browser fallback)
  useEffect(() => {
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = microphoneSettings.language;

      rec.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      rec.onresult = (event: any) => {
        let finalTrans = '';
        let interimTrans = '';
        let latestConfidence = 1;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTrans += result[0].transcript;
            latestConfidence = result[0].confidence;
          } else {
            interimTrans += result[0].transcript;
          }
        }

        setInterimTranscript(interimTrans);

        if (finalTrans) {
          const cleanedText = finalTrans.toLowerCase().trim();
          setTranscript(cleanedText);
          setConfidence(latestConfidence);
          processVoiceCommand(cleanedText, latestConfidence);
        }
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error:', e.error);
        if (e.error === 'not-allowed') {
          setVoiceEnabled(false);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = rec;
    } else {
      console.warn('Speech recognition not supported in this browser environment');
      setVoiceEnabled(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [microphoneSettings.language]);

  // Command Evaluation engine
  const processVoiceCommand = (text: string, confScore: number) => {
    let matched = false;
    
    // Scan registered context commands
    for (const cmdMapping of commandsRef.current) {
      const matchPattern = new RegExp(`\\b${cmdMapping.phrase}\\b`, 'i');
      if (matchPattern.test(text) || text.includes(cmdMapping.phrase.toLowerCase())) {
        cmdMapping.action();
        matched = true;
        break; // Trigger first match callback
      }
    }

    // Append to speech history logs
    const historyEntry = {
      text,
      confidence: confScore,
      timestamp: new Date().toLocaleTimeString(),
      matched
    };
    setSpeechHistory(prev => [historyEntry, ...prev].slice(0, 30));

    // Optional audio confirmation feedback
    if (matched) {
      speakConfirm(text);
    }
  };

  const startRecognition = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Recognition already active');
      }
    }
  };

  const stopRecognition = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const speakConfirm = (phraseText: string) => {
    speak(`Executing command: ${phraseText}`);
  };

  const speak = (msg: string, overrideRate?: number, overridePitch?: number) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.rate = overrideRate !== undefined ? overrideRate : speechRate;
      utterance.pitch = overridePitch !== undefined ? overridePitch : speechPitch;
      window.speechSynthesis.speak(utterance);
    }
  };

  const registerCommands = (cmds: CommandMapping[]) => {
    commandsRef.current = cmds;
  };

  const unregisterCommands = () => {
    commandsRef.current = [];
  };

  const updateMicrophoneSettings = (settings: any) => {
    setMicrophoneSettings(prev => ({ ...prev, ...settings }));
  };

  return (
    <VoiceContext.Provider value={{
      isListening,
      transcript,
      interimTranscript,
      confidence,
      speechHistory,
      voiceEnabled,
      startRecognition,
      stopRecognition,
      speak,
      registerCommands,
      unregisterCommands,
      microphoneSettings,
      updateMicrophoneSettings,
      speechRate,
      speechPitch,
      setSpeechSettings,
      pythonConnected,
      connectVoiceSocket
    }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider wrapper');
  }
  return context;
};
