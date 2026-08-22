import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mic, KeyRound, Mail, UserPlus, LogIn, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  
  // Form parameters
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Student' | 'Instructor' | 'Admin'>('Student');
  const [consent, setConsent] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const targetUrl = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister 
      ? { username, email, password, role, consentToVoiceProcess: consent }
      : { emailOrUsername: email, password };

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();

      if (!resData.success) {
        throw new Error(resData.message || 'Authentication failed');
      }

      if (isRegister) {
        setSuccessMsg('Account created successfully! Switching to login...');
        setIsRegister(false);
        setPassword('');
      } else {
        login(resData.token, resData.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Connect details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative grid-mesh overflow-hidden">
      {/* Background radial effects */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-panel-neon-purple rounded-2xl p-8 relative z-10 shadow-glowPurple border border-purple-500/20"
      >
        <div className="flex flex-col items-center gap-2 mb-8 text-center animate-pulse">
          <div className="p-3 bg-gradient-to-tr from-cyan-400 to-purple-600 rounded-2xl shadow-glowPurple">
            <Mic className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-wider text-slate-100 mt-2">
            Voice Controlled Learning
          </h2>
          <p className="text-xs text-slate-400">Unlock skills verbally on a gamified node matrix.</p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-xs rounded-lg flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
            <LogIn className="h-4 w-4" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">Username</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. key_coder"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg py-2.5 pl-3 pr-10 text-xs text-slate-200 outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">
              {isRegister ? 'Email Address' : 'Username or Email'}
            </label>
            <div className="relative">
              <input
                type={isRegister ? 'email' : 'text'}
                required
                placeholder={isRegister ? 'student@skills.edu' : 'Username/Email'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg py-2.5 pl-3 pr-10 text-xs text-slate-200 outline-none transition-colors"
              />
              <Mail className="absolute right-3.5 top-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-lg py-2.5 pl-3 pr-10 text-xs text-slate-200 outline-none transition-colors"
              />
              <KeyRound className="absolute right-3.5 top-3 h-4 w-4 text-slate-500" />
            </div>
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1.5">Learning Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Student', 'Instructor', 'Admin'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r as any)}
                      className={`text-xs font-semibold py-2 rounded-lg border transition-all ${
                        role === r 
                          ? 'border-purple-500 bg-purple-950/40 text-purple-300' 
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-2 mt-2">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 accent-purple-500 outline-none"
                  required
                />
                <label htmlFor="consent" className="text-[10px] leading-tight text-slate-400 select-none">
                  I consent to browser Web Speech API voice capture for scoring and matching commands. No biometric voice data is stored remotely.
                </label>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:opacity-90 transition-opacity text-white text-xs font-extrabold uppercase py-3 rounded-lg shadow-lg tracking-wider mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : isRegister ? (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create Student Account</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Enter Skill Academy</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-800 pt-4 text-center">
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors underline font-medium"
          >
            {isRegister ? 'Already registered? Login here.' : 'Build account credentials here.'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
