import { useState } from 'react';
import { AlertTriangle, Stethoscope, Settings, Phone, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import './index.css';

function App() {
  const [view, setView] = useState<'triage' | 'alert' | 'intake'>('triage');

  return (
    <div className="min-h-screen bg-[var(--color-medical-slate-light)] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b-4 border-[var(--color-medical-blue)]">
        <div className="flex items-center gap-2 text-[var(--color-medical-blue)] font-bold text-2xl">
          <Stethoscope size={32} />
          PulseCheck
        </div>
        <button className="text-[var(--color-medical-slate)] hover:text-slate-800 transition-colors">
          <Settings size={24} />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-6 flex flex-col items-center justify-center gap-6">
        
        {/* Emergency Triage Disclaimer */}
        {view === 'triage' && (
          <div className="w-full max-w-2xl bg-white border-t-8 border-[var(--color-alert-red)] rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col items-center text-center mb-8">
                <AlertTriangle className="text-[var(--color-alert-red)] mb-4" size={64} />
                <h1 className="text-2xl font-bold text-[var(--color-alert-red)]">
                  If you are experiencing a life-threatening emergency, stop and alert staff immediately.
                </h1>
              </div>
              
              <div className="bg-[var(--color-alert-red-light)] rounded-lg p-6 mb-8 text-left">
                <h2 className="font-semibold text-red-900 mb-4 text-lg">Do you have any of the following symptoms?</h2>
                <ul className="list-disc list-inside text-red-900 space-y-2 text-lg font-medium">
                  <li>Chest pain or pressure</li>
                  <li>Severe shortness of breath</li>
                  <li>Sudden weakness or numbness (especially on one side)</li>
                  <li>Heavy, uncontrolled bleeding</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <button 
                  onClick={() => setView('alert')}
                  className="flex-1 bg-[var(--color-alert-red)] text-white text-lg px-6 py-4 rounded-lg font-bold shadow-md hover:bg-red-600 transition-colors flex justify-center items-center gap-2">
                  <Phone size={24} />
                  I Need Immediate Help
                </button>
                <button 
                  onClick={() => setView('intake')}
                  className="flex-1 bg-slate-100 text-[var(--color-medical-slate)] border-2 border-slate-200 text-lg px-6 py-4 rounded-lg font-semibold shadow-sm hover:bg-slate-200 hover:border-slate-300 transition-colors">
                  Continue to Normal Intake
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Alert State */}
        {view === 'alert' && (
          <div className="w-full max-w-2xl bg-[var(--color-alert-red)] text-white rounded-xl shadow-2xl overflow-hidden flex flex-col items-center p-12 text-center">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="mb-8"
            >
              <AlertTriangle size={120} />
            </motion.div>
            <h1 className="text-4xl font-bold mb-4">PLEASE WAIT</h1>
            <p className="text-xl mb-8 font-medium">Medical staff have been alerted and are on their way to assist you.</p>
            <button 
              className="flex items-center gap-2 bg-white text-[var(--color-alert-red)] px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
              onClick={() => {
                const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
                audio.play().catch(e => console.log('Audio play failed', e));
              }}
            >
              <Volume2 size={24} />
              Play Audio Alert
            </button>
            <button 
              onClick={() => setView('triage')}
              className="mt-8 text-red-200 underline hover:text-white"
            >
              Cancel and Return
            </button>
          </div>
        )}

        {/* Normal Intake Flow (Placeholder) */}
        {view === 'intake' && (
          <div className="w-full bg-white rounded-lg shadow-sm p-8 text-center mt-6 border border-slate-200">
            <h3 className="text-2xl font-semibold text-[var(--color-medical-slate)] mb-2">Welcome to PulseCheck</h3>
            <p className="text-slate-500 mb-6">Primary Intake Step successfully reached.</p>
            <div className="flex justify-center gap-8 text-sm text-slate-400">
              <span>✓ React & Vite</span>
              <span>✓ Tailwind CSS v4</span>
              <span>✓ Lucide Icons</span>
              <span>✓ Framer Motion</span>
            </div>
            <button 
              onClick={() => setView('triage')}
              className="mt-8 text-blue-500 underline hover:text-blue-600"
            >
              Back to Start
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
