import { useState, useEffect } from 'react';
import { AlertTriangle, Stethoscope, Settings, Phone, Volume2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { type Language, languageNames, languageCodes, translations } from './i18n';
import './index.css';

function App() {
  const [view, setView] = useState<'triage' | 'alert' | 'intake'>('triage');
  const [lang, setLang] = useState<Language>('en');
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  const t = translations[lang];

  // Stop speech when component unmounts or language changes
  useEffect(() => {
    window.speechSynthesis.cancel();
    setSpeakingText(null);
  }, [lang]);

  const speak = (text: string) => {
    if (speakingText === text) {
      window.speechSynthesis.cancel();
      setSpeakingText(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageCodes[lang];
    utterance.onend = () => setSpeakingText(null);
    utterance.onerror = () => setSpeakingText(null);

    window.speechSynthesis.speak(utterance);
    setSpeakingText(text);
  };

  const getTtsButtonClass = (text: string) => 
    `p-2 rounded-full transition-colors ${
      speakingText === text 
        ? 'bg-[var(--color-medical-blue)] text-white animate-pulse' 
        : 'text-[var(--color-medical-slate)] hover:bg-slate-200 bg-slate-100'
    }`;

  return (
    <div className="min-h-screen bg-[var(--color-medical-slate-light)] flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b-4 border-[var(--color-medical-blue)] flex-wrap gap-4">
        <div className="flex items-center gap-2 text-[var(--color-medical-blue)] font-bold text-2xl">
          <Stethoscope size={32} />
          PulseCheck
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
            className="bg-slate-100 border border-slate-300 text-slate-700 rounded-md px-3 py-1.5 font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-medical-blue)]"
          >
            {(Object.keys(languageNames) as Language[]).map(l => (
              <option key={l} value={l}>{languageNames[l]}</option>
            ))}
          </select>
          
          <button className="text-[var(--color-medical-slate)] hover:text-slate-800 transition-colors">
            <Settings size={24} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-6 flex flex-col items-center justify-center gap-6">
        
        {/* Emergency Triage Disclaimer */}
        {view === 'triage' && (
          <div className="w-full max-w-2xl bg-white border-t-8 border-[var(--color-alert-red)] rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              <div className="flex flex-col items-center text-center mb-8 relative">
                <AlertTriangle className="text-[var(--color-alert-red)] mb-4" size={64} />
                
                <div className="flex items-start justify-center gap-3 w-full">
                  <h1 className="text-2xl font-bold text-[var(--color-alert-red)]">
                    {t.emergencyHeader}
                  </h1>
                  <button 
                    onClick={() => speak(t.emergencyHeader)}
                    className={getTtsButtonClass(t.emergencyHeader)}
                    aria-label="Read text aloud"
                  >
                    <Volume2 size={24} />
                  </button>
                </div>
              </div>
              
              <div className="bg-[var(--color-alert-red-light)] rounded-lg p-6 mb-8 text-left relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-red-900 text-lg">
                    {t.symptomsPrompt}
                  </h2>
                  <button 
                    onClick={() => speak(t.symptomsPrompt + ' ' + t.symptoms.join(', '))}
                    className={getTtsButtonClass(t.symptomsPrompt + ' ' + t.symptoms.join(', '))}
                    aria-label="Read symptoms aloud"
                  >
                    <Volume2 size={20} />
                  </button>
                </div>
                
                <ul className="list-disc list-inside text-red-900 space-y-2 text-lg font-medium">
                  {t.symptoms.map((symptom, idx) => (
                    <li key={idx}>{symptom}</li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <button 
                  onClick={() => { setSpeakingText(null); setView('alert'); }}
                  className="flex-1 bg-[var(--color-alert-red)] text-white text-lg px-6 py-4 rounded-lg font-bold shadow-md hover:bg-red-600 transition-colors flex justify-center items-center gap-2">
                  <Phone size={24} />
                  {t.btnEmergency}
                </button>
                <button 
                  onClick={() => { setSpeakingText(null); setView('intake'); }}
                  className="flex-1 bg-slate-100 text-[var(--color-medical-slate)] border-2 border-slate-200 text-lg px-6 py-4 rounded-lg font-semibold shadow-sm hover:bg-slate-200 hover:border-slate-300 transition-colors">
                  {t.btnContinue}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Alert State */}
        {view === 'alert' && (
          <div className="w-full max-w-2xl bg-[var(--color-alert-red)] text-white rounded-xl shadow-2xl overflow-hidden flex flex-col items-center p-12 text-center relative">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="mb-8"
            >
              <AlertTriangle size={120} />
            </motion.div>
            
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-4xl font-bold">{t.pleaseWait}</h1>
              <button 
                onClick={() => speak(t.pleaseWait + '. ' + t.staffAlerted)}
                className={speakingText === t.pleaseWait + '. ' + t.staffAlerted ? 'text-white animate-pulse' : 'text-red-200 hover:text-white'}
              >
                <Volume2 size={28} />
              </button>
            </div>
            
            <p className="text-xl mb-8 font-medium">{t.staffAlerted}</p>
            
            <button 
              className="flex items-center gap-2 bg-white text-[var(--color-alert-red)] px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
              onClick={() => {
                const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
                audio.play().catch(e => console.log('Audio play failed', e));
              }}
            >
              <Volume2 size={24} />
              {t.playAudio}
            </button>
            <button 
              onClick={() => { setSpeakingText(null); setView('triage'); }}
              className="mt-8 text-red-200 underline hover:text-white"
            >
              {t.cancel}
            </button>
          </div>
        )}

        {/* Normal Intake Flow (Placeholder) */}
        {view === 'intake' && (
          <div className="w-full bg-white rounded-lg shadow-sm p-8 text-center mt-6 border border-slate-200">
            <div className="flex justify-center items-center gap-3 mb-2">
              <h3 className="text-2xl font-semibold text-[var(--color-medical-slate)]">{t.welcome}</h3>
              <button 
                onClick={() => speak(t.welcome + '. ' + t.successMsg)}
                className={getTtsButtonClass(t.welcome + '. ' + t.successMsg)}
              >
                <Volume2 size={20} />
              </button>
            </div>
            
            <p className="text-slate-500 mb-6">{t.successMsg}</p>
            <div className="flex justify-center gap-8 text-sm text-slate-400">
              <span>✓ React & Vite</span>
              <span>✓ Tailwind CSS v4</span>
              <span>✓ Lucide Icons</span>
              <span>✓ Framer Motion</span>
            </div>
            <button 
              onClick={() => { setSpeakingText(null); setView('triage'); }}
              className="mt-8 text-blue-500 underline hover:text-blue-600"
            >
              {t.backToStart}
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;
