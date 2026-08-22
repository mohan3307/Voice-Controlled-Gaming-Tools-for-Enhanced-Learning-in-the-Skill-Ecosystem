import React, { useState } from 'react';
import { useVoice } from '../context/VoiceContext';
import { Mic, MicOff, Volume2, Sliders, CheckCircle, Sparkles, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export const VoicePlayground: React.FC = () => {
  const { 
    isListening, 
    startRecognition, 
    stopRecognition, 
    transcript, 
    confidence, 
    speechHistory,
    microphoneSettings,
    updateMicrophoneSettings,
    speak,
    pythonConnected
  } = useVoice();

  // Settings configs
  const [gain, setGain] = useState(microphoneSettings.gain);
  const [noiseCancelling, setNoiseCancelling] = useState(microphoneSettings.noiseCancelling);
  const [language, setLanguage] = useState(microphoneSettings.language);

  // Custom mock tester
  const [customPhrase, setCustomPhrase] = useState('');
  const [phraseStatus, setPhraseStatus] = useState<string | null>(null);

  const applySettingsChanges = () => {
    updateMicrophoneSettings({
      gain,
      noiseCancelling,
      language
    });
    setPhraseStatus('Microphone parameters saved successfully.');
    speak("Voice preferences initialized.");
    setTimeout(() => setPhraseStatus(null), 3000);
  };

  const handleTestSpeechTrigger = () => {
    if (!customPhrase) return;
    speak(`Testing custom voice response: ${customPhrase}`);
    setPhraseStatus(`Text-to-speech queue committed for phrase: "${customPhrase}"`);
    setTimeout(() => setPhraseStatus(null), 4000);
  };

  // Toggle local mic helper
  const handleLocalMicToggle = () => {
    if (isListening) {
      stopRecognition();
    } else {
      startRecognition();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8 flex flex-col gap-8">
      {/* Headings */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
            Voice Playground <Sparkles className="h-4 w-4 text-purple-400" />
          </h2>
          <p className="text-xs text-slate-400 mt-1">Calibrate microphone settings, debug custom phrases, and test synthetic synthesizers.</p>
        </div>

        {/* Micro Controls Action Button directly in the header page */}
        <div className="flex items-center gap-2">
          {pythonConnected ? (
            <span className="text-[10px] bg-purple-950/60 border border-purple-800 text-purple-400 px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider shadow-glowPurple animate-pulse flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Python Mic Connected
            </span>
          ) : (
            <button
              onClick={handleLocalMicToggle}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 transition-all ${
                isListening 
                  ? "bg-purple-600 border-purple-400 text-white shadow-glowPurple animate-pulse"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              {isListening ? (
                <>
                  <Mic className="h-3.5 w-3.5 animate-pulse" /> Stop Listening
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Settings widget */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="glass-panel border-slate-800 rounded-2xl p-5 flex flex-col gap-5">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-purple-400" /> Calibration Panel
            </span>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Input Microphone Gain: {Math.round(gain * 100)}%</label>
                <input
                  type="range"
                  min="0.2"
                  max="2.0"
                  step="0.1"
                  value={gain}
                  onChange={(e) => setGain(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-slate-400">Noise Tolerance filter</label>
                <input
                  type="checkbox"
                  checked={noiseCancelling}
                  onChange={(e) => setNoiseCancelling(e.target.checked)}
                  className="accent-purple-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5">Spoken Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg p-2 text-xs text-slate-300 outline-none"
                >
                  <option value="en-US">English (United States)</option>
                  <option value="en-GB">English (Great Britain)</option>
                  <option value="es-ES">Spanish (Spain)</option>
                  <option value="fr-FR">French (France)</option>
                </select>
              </div>

              <button
                onClick={applySettingsChanges}
                className="w-full bg-purple-600 text-white font-extrabold uppercase py-2.5 rounded-lg text-[10px] shadow hover:opacity-90 transition-opacity mt-2"
              >
                Apply Parameters
              </button>
            </div>
          </div>

          {/* Test TTS triggers */}
          <div className="glass-panel border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-1.5">
              <Volume2 className="h-4 w-4 text-cyan-400" /> Synthesizer Test
            </span>

            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="e.g. Scoping error resolved successfully."
                value={customPhrase}
                onChange={(e) => setCustomPhrase(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg p-2 text-xs text-slate-300 outline-none"
              />
              <button
                onClick={handleTestSpeechTrigger}
                className="w-full border border-slate-800 hover:border-cyan-500/40 bg-slate-950/40 text-slate-400 hover:text-cyan-300 font-bold uppercase py-2.5 rounded-lg text-[10px] flex items-center justify-center gap-1.5 transition-all"
              >
                <Play className="h-3.5 w-3.5 fill-cyan-400/20" /> Trigger Speech Output
              </button>
            </div>
          </div>
        </div>

        {/* Live Calibration screen */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {phraseStatus && (
            <div className="p-3 bg-cyan-950/60 border border-cyan-800 text-cyan-300 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>{phraseStatus}</span>
            </div>
          )}

          <div className="glass-panel border-slate-800 rounded-2xl p-6">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-4">Oscilloscope calibration</span>

            <div className="bg-slate-950 border border-slate-900 rounded-xl p-6 flex flex-col items-center justify-center gap-4 relative min-h-[160px]">
              {isListening ? (
                <>
                  <div className="flex gap-1.5 h-12 w-full justify-center items-center">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [12, 45, 12] }}
                        transition={{ duration: 0.4 + i * 0.05, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-1.5 bg-gradient-to-t from-cyan-400 to-purple-600 rounded-full"
                      />
                    ))}
                  </div>

                  <div className="text-center">
                    <span className="block text-xs font-bold text-cyan-300">⚡ "{transcript || 'Listening for speech input...'}"</span>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-widest mt-1">Confidence Rating: {Math.round(confidence * 100)}%</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-2 text-center text-slate-500">
                  <Mic className="h-8 w-8 text-slate-700 animate-pulse" />
                  <span className="text-xs uppercase font-extrabold tracking-widest">Calibration Standby</span>
                  <p className="text-[10px] max-w-xs text-slate-600">Activate micro controls above or in navigation header to begin voice testing.</p>
                </div>
              )}
            </div>
          </div>

          {/* Test log parameters lists */}
          <div className="glass-panel border-slate-800 rounded-2xl p-6">
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-4">Command History log</span>
            
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-2">
              {speechHistory.length > 0 ? (
                speechHistory.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-850">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-300">{h.text}</span>
                      <span className="text-[9px] text-slate-500">{h.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${h.matched ? 'bg-purple-950/40 border border-purple-800 text-purple-400' : 'bg-slate-800 text-slate-500'}`}>
                        {h.matched ? 'Matched Action' : 'No Action Matched'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">Conf: {Math.round(h.confidence * 100)}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center border border-dashed border-slate-855 rounded-xl text-slate-500 text-xs">
                  Empty history loop. Speak words to populate logs.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
