import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Users, ShieldAlert, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminDashboard: React.FC = () => {
  const { token } = useAuth();

  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { 'Authorization': `Bearer ${token}` };
      const [usersRes, logsRes] = await Promise.all([
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/audit', { headers })
      ]);

      const usersData = await usersRes.json();
      const logsData = await logsRes.json();

      if (usersData.success) setUsers(usersData.users);
      if (logsData.success) setLogs(logsData.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleUpdateRole = async (userId: string, targetRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: targetRole })
      });
      const data = await res.json();
      if (data.success) {
        setSuccess(`User role shifted successfully.`);
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <RefreshCw className="h-6 w-6 text-purple-450 animate-spin" />
        <span className="text-xs uppercase font-extrabold text-slate-550">Resolving Security Audits...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-6 py-8 flex flex-col gap-8">
      <div>
        <h2 className="text-xl font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
          Administrator Hub <ShieldCheck className="h-5 w-5 text-purple-400" />
        </h2>
        <p className="text-xs text-slate-400 mt-1">Audit security transactions, monitor platform health, and adjust administrator levels.</p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-emerald-450" />
          <span>{success}</span>
        </div>
      )}

      {/* Main split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* User list */}
        <div className="glass-panel border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-1.5"><Users className="h-4 w-4 text-purple-400" /> User Matrix list</span>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-500 uppercase tracking-widest">
                  <th className="pb-2">User Profile</th>
                  <th className="pb-2">Current Role</th>
                  <th className="pb-2 text-right">Settings</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id} className="border-b border-slate-900">
                    <td className="py-2.5 flex flex-col">
                      <span className="text-slate-200">{u.username}</span>
                      <span className="text-[9px] text-slate-500 font-mono">{u.email}</span>
                    </td>
                    <td className="py-2.5">
                      <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono uppercase">{u.role}</span>
                    </td>
                    <td className="py-2.5 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                        className="bg-slate-950 border border-slate-850 hover:border-purple-500/40 text-[10px] p-1.5 rounded text-slate-400 outline-none"
                      >
                        <option value="Student">Student</option>
                        <option value="Instructor">Instructor</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit logs lists */}
        <div className="glass-panel border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-1.5"><Layers className="h-4 w-4 text-cyan-400" /> Security logs audits</span>

          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-2">
            {logs.map((log, index) => {
              const isFailure = log.action === 'AUTH_FAILURE';
              return (
                <div key={index} className="p-3 bg-slate-900 border border-slate-850 rounded-lg text-xs flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isFailure ? 'bg-rose-950/40 border border-rose-800 text-rose-400' : 'bg-indigo-950/40 border border-indigo-900 text-indigo-400'}`}>
                      {log.action}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono leading-none">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-slate-350 mt-1 font-semibold leading-relaxed text-[11px]">{log.details}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
