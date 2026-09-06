import { useState } from 'react';
import { Lock, ShieldAlert, ArrowLeft } from 'lucide-react';
import { loginStaff, type StaffUser } from '../services/authService';

interface StaffLoginProps {
  onAuthenticated: (user: StaffUser) => void;
  onCancel: () => void;
}

export function StaffLogin({ onAuthenticated, onCancel }: StaffLoginProps) {
  const [badgeId, setBadgeId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const user = loginStaff(badgeId, pin);
    if (user) {
      onAuthenticated(user);
    } else {
      setError('Unauthorized: Invalid Staff Badge ID or PIN.');
    }
  };

  return (
    <div className="flex-1 w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border-t-8 border-slate-900 rounded-xl shadow-xl overflow-hidden relative">
        <button 
          onClick={onCancel}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 transition-colors"
          title="Return to Kiosk"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="p-8 pb-6 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Lock size={32} className="text-slate-800" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Staff Portal</h2>
          <p className="text-slate-500 font-medium mt-1">Authenticate to access EHR Queue</p>
        </div>

        <div className="px-8 pb-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm font-bold flex items-center gap-2">
              <ShieldAlert size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Staff Badge ID / Email</label>
              <input
                type="text"
                value={badgeId}
                onChange={(e) => setBadgeId(e.target.value)}
                placeholder="e.g. DR-7821"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Security PIN / Password</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="****"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors mt-2"
            >
              Authenticate & Access EHR Queue
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
