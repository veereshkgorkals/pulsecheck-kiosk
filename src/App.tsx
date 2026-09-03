import { AlertTriangle, Stethoscope, Settings } from 'lucide-react';
import './index.css';

function App() {
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
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col gap-6">
        
        {/* Emergency Triage Disclaimer (Mockup) */}
        <div className="bg-[var(--color-alert-red-light)] border-l-4 border-[var(--color-alert-red)] p-5 rounded-md flex gap-4 shadow-sm">
          <AlertTriangle className="text-[var(--color-alert-red)] shrink-0 mt-1" size={28} />
          <div>
            <h2 className="text-[var(--color-alert-red)] font-bold text-lg mb-1">
              EMERGENCY WARNING
            </h2>
            <p className="text-red-900 font-medium">
              If you are experiencing a life-threatening emergency (e.g., chest pain, severe shortness of breath, sudden weakness/numbness, major bleeding), stop and alert staff immediately.
            </p>
            <div className="mt-4 flex gap-4">
              <button className="bg-[var(--color-alert-red)] text-white px-5 py-2 rounded font-bold shadow hover:bg-red-600 transition-colors">
                I Need Immediate Help
              </button>
              <button className="bg-white text-[var(--color-medical-slate)] border border-[var(--color-medical-slate)] px-5 py-2 rounded font-semibold shadow-sm hover:bg-slate-50 transition-colors">
                Continue to Normal Intake
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Placeholder */}
        <div className="bg-white rounded-lg shadow-sm p-8 text-center mt-6 border border-slate-200">
          <h3 className="text-2xl font-semibold text-[var(--color-medical-slate)] mb-2">Welcome to PulseCheck</h3>
          <p className="text-slate-500 mb-6">Modular frontend successfully initialized.</p>
          <div className="flex justify-center gap-8 text-sm text-slate-400">
            <span>✓ React & Vite</span>
            <span>✓ Tailwind CSS v4</span>
            <span>✓ Lucide Icons</span>
            <span>✓ Framer Motion</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
