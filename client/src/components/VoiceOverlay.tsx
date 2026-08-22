import React, { useEffect, useRef } from 'react';
import { useVoice } from '../context/VoiceContext';
import { Mic, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const VoiceOverlay: React.FC = () => {
  const { isListening, transcript, interimTranscript, confidence, voiceEnabled } = useVoice();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (isListening && voiceEnabled) {
      const initAudio = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;

          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          drawWaveform();
        } catch (err) {
          console.warn('Microphone stream access denied for waveform visualizer:', err);
        }
      };

      initAudio();
    } else {
      cleanupAudio();
    }

    return () => {
      cleanupAudio();
    };
  }, [isListening, voiceEnabled]);

  const cleanupAudio = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const drawWaveform = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    if (!analyser) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isListening) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      // Clear canvas with a trail effect
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw middle horizontal line
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Draw raw waveform
      ctx.lineWidth = 2;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#8b5cf6';
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#06b6d4'); // cyan
      gradient.addColorStop(0.5, '#a855f7'); // purple
      gradient.addColorStop(1, '#ec4899'); // pink
      ctx.strokeStyle = gradient;

      ctx.beginPath();
      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    draw();
  };

  if (!voiceEnabled) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-none">
      <AnimatePresence>
        {isListening && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto p-4 w-80 glass-panel-neon-purple rounded-xl flex flex-col gap-3 shadow-glowPurple border border-purple-500/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">Voice Engine Listening</span>
              </div>
              <div className="text-[10px] bg-purple-950 px-2 py-0.5 rounded text-purple-400 font-mono">
                Conf: {Math.round(confidence * 100)}%
              </div>
            </div>

            {/* Real Audio Waveform Canvas */}
            <canvas 
              ref={canvasRef} 
              width={288} 
              height={48} 
              className="w-full h-12 bg-slate-950/80 rounded-lg border border-purple-500/20 shadow-inner"
            />

            <div className="text-sm min-h-10 text-slate-200 bg-slate-950/40 p-2 rounded border border-slate-800">
              {transcript ? (
                <p className="font-medium text-slate-100">
                  ⚡ {transcript}
                </p>
              ) : interimTranscript ? (
                <p className="text-slate-400 italic">
                  💡 {interimTranscript}
                </p>
              ) : (
                <p className="text-slate-500 text-xs italic">
                  Say a command: "select option A", "give me a hint", "repeat question"...
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <Volume2 className="h-3 w-3 text-purple-400" />
              <span>Voice synthesiser responses active.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic activation sticky indicator */}
      {!isListening && (
        <motion.div 
          className="pointer-events-auto h-12 w-12 rounded-full glass-panel flex items-center justify-center border border-slate-700 bg-slate-900/90 shadow-lg cursor-pointer hover:border-purple-500 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Voice engine standby"
        >
          <Mic className="h-5 w-5 text-slate-400" />
        </motion.div>
      )}
    </div>
  );
};
