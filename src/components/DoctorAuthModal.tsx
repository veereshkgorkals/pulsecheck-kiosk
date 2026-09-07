import { useState } from 'react';
import { Lock, ShieldAlert, ArrowLeft, KeyRound, UserPlus, LogIn, CheckCircle2 } from 'lucide-react';
import { loginDoctor, registerDoctor, ADMIN_KEY, type StaffUser } from '../services/authService';

interface DoctorAuthModalProps {
  onAuthenticated: (user: StaffUser) => void;
  onCancel: () => void;
}

export function DoctorAuthModal({ onAuthenticated, onCancel }: DoctorAuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login State
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Register State
  const [regName, setRegName] = useState('');
  const [regDept, setRegDept] = useState('Emergency Medicine');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regAdminKey, setRegAdminKey] = useState('');
  const [regError, setRegError] = useState('');
  
  // Success State
  const [successId, setSuccessId] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    const user = loginDoctor(loginId, loginPass);
    if (user) {
      onAuthenticated(user);
    } else {
      setLoginError('Unauthorized: Invalid Doctor ID/Email or Password.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    
    if (regPass !== regConfirm) {
      setRegError('Passwords do not match.');
      return;
    }
    
    if (regAdminKey !== ADMIN_KEY) {
      setRegError('Unauthorized: Invalid Hospital Admin Key. Only verified hospital staff may register.');
      return;
    }
    
    try {
      const fullName = regName.startsWith('Dr.') ? regName : `Dr. ${regName}`;
      const newDoc = registerDoctor({
        fullName,
        department: regDept,
        email: regEmail,
        password: regPass
      });
      
      setSuccessId(newDoc.doctorId);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
    }
  };

  const switchToLogin = () => {
    if (successId) {
      setLoginId(successId);
    }
    setSuccessId(null);
    setActiveTab('login');
    setRegPass('');
    setRegConfirm('');
    setRegAdminKey('');
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

        <div className="pt-8 pb-4 text-center px-4">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Lock size={32} className="text-slate-800" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Doctor Portal</h2>
          <p className="text-slate-500 font-medium mt-1">Authenticate to access EHR Queue</p>
        </div>

        {!successId && (
          <div className="flex border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('login')}
              className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'login' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <LogIn size={16} /> Doctor Login
            </button>
            <button 
              onClick={() => setActiveTab('register')}
              className={`flex-1 py-3 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'register' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-700'}`}
            >
              <UserPlus size={16} /> Authorized Registration
            </button>
          </div>
        )}

        <div className="px-8 pb-8 pt-6 max-h-[60vh] overflow-y-auto">
          
          {successId ? (
            <div className="text-center py-6">
              <CheckCircle2 size={64} className="mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">Registration Successful!</h3>
              <p className="text-slate-600 mb-6">
                Your assigned Doctor ID is: <br/>
                <span className="text-2xl font-black text-[var(--color-medical-blue)] block mt-2">{successId}</span>
              </p>
              <p className="text-sm text-slate-500 mb-8">Use this ID or your email to sign in.</p>
              <button
                onClick={switchToLogin}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center transition-colors"
              >
                Go to Login
              </button>
            </div>
          ) : activeTab === 'login' ? (
            /* LOGIN TAB */
            <>
              {loginError && (
                <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm font-bold flex items-start gap-2">
                  <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Doctor ID or Work Email</label>
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="e.g. DOC-2026-001 or name@hospital.org"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors mt-6"
                >
                  <LogIn size={20} />
                  Login to Dashboard
                </button>
              </form>
            </>
          ) : (
            /* REGISTER TAB */
            <>
              {regError && (
                <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded text-red-700 text-sm font-bold flex items-start gap-2">
                  <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                  <span>{regError}</span>
                </div>
              )}
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Dr. Priya Patel"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Hospital Department</label>
                  <select
                    value={regDept}
                    onChange={(e) => setRegDept(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                    required
                  >
                    <option value="Emergency Medicine">Emergency Medicine</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Triage">Triage</option>
                    <option value="Pediatrics">Pediatrics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="name@hospital.org"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      value={regPass}
                      onChange={(e) => setRegPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Confirm</label>
                    <input
                      type="password"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 mt-4">
                  <label className="block text-sm font-bold text-slate-700 mb-1">Hospital Admin Authorization Key</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={regAdminKey}
                      onChange={(e) => setRegAdminKey(e.target.value)}
                      placeholder="Enter Admin Secret Key"
                      className="w-full px-4 py-3 pl-10 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-900 font-bold focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      required
                    />
                    <KeyRound size={18} className="absolute left-3 top-3.5 text-indigo-400" />
                  </div>
                  <div className="mt-2 text-right">
                    <button 
                      type="button"
                      onClick={() => setRegAdminKey(ADMIN_KEY)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors"
                    >
                      Demo Admin Key: {ADMIN_KEY}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors mt-6"
                >
                  <UserPlus size={20} />
                  Register Doctor
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
