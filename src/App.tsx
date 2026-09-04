import { useState, useEffect } from 'react';
import { AlertTriangle, Stethoscope, Settings, Phone, Volume2, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { type Language, languageNames, languageCodes, translations } from './i18n';
import { IntakeForm } from './components/IntakeForm';
import './index.css';

function App() {
  const [view, setView] = useState<'triage' | 'alert' | 'intake' | 'success'>('triage');
  const [lang, setLang] = useState<Language>('en');
  const [speakingText, setSpeakingText] = useState<string | null>(null);

  const t = translations[lang];

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

      <main className="flex-1 w-full max-w-4xl mx-auto p-6 flex flex-col items-center justify-center gap-6">
        
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

        {view === 'intake' && (
          <IntakeForm 
            lang={lang} 
            speak={speak} 
            getTtsButtonClass={getTtsButtonClass} 
            onComplete={() => { setSpeakingText(null); setView('success'); }} 
          />
        )}

        {view === 'success' && (
          <div className="w-full max-w-lg bg-white rounded-xl shadow-lg border-t-8 border-green-500 p-12 text-center mt-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              className="flex justify-center mb-6 text-green-500"
            >
              <CheckCircle size={80} />
            </motion.div>
            
            <div className="flex justify-center items-center gap-3 mb-4">
              <h3 className="text-3xl font-bold text-slate-800">{t.successMsg}</h3>
              <button 
                onClick={() => speak(t.successMsg)}
                className={getTtsButtonClass(t.successMsg)}
              >
                <Volume2 size={24} />
              </button>
            </div>
            
            <button 
              onClick={() => { setSpeakingText(null); setView('triage'); }}
              className="mt-8 flex items-center justify-center w-full gap-2 px-6 py-3 rounded-lg font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
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
