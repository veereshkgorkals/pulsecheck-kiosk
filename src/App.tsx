import { useState, useEffect } from 'react';
import { AlertTriangle, Stethoscope, Settings, Phone, Volume2, CheckCircle, Printer } from 'lucide-react';
import { motion } from 'framer-motion';
import { type Language, languageNames, languageCodes, translations } from './i18n';
import { IntakeForm } from './components/IntakeForm';
import { getPatientQueue, savePatientSummary, saveEmergencyAlert, getEmergencyAlerts, updateEmergencyAlertStatus } from './utils/storage';
import { type ClinicalSummary } from './services/aiSummarizerService';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

function App() {
  const [view, setView] = useState<'triage' | 'alert' | 'intake' | 'success' | 'doctor'>('triage');
  const [lang, setLang] = useState<Language>('en');
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [finalSummary, setFinalSummary] = useState<ClinicalSummary | null>(null);

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

  const handleEmergencyTrigger = () => {
    setSpeakingText(null);
    setView('alert');

    const alertId = "EMERGENCY-" + Date.now();
    saveEmergencyAlert({
      id: alertId,
      timestamp: new Date().toISOString(),
      source: "Patient Mobile QR",
      status: "active"
    });

    savePatientSummary({
      id: "EMERG-" + Date.now(),
      tokenNumber: "EMERGENCY-SOS",
      patientInfo: {
        name: "EMERGENCY PATIENT (Unregistered / SOS)",
        dob: "Unknown",
        phone: "Unknown"
      },
      analyzedChiefComplaint: "CRITICAL: Patient triggered emergency SOS at triage screen",
      aiUrgency: "high",
      aiAssignedPainSeverity: 10,
      timestamp: new Date().toISOString(),
      clinicalBulletPoints: [
        "Immediate assistance requested via Mobile QR intake",
        "Bypassed standard questionnaire due to red-flag warning",
        "Requires immediate bedside/waiting room clinical assessment"
      ],
      affectedAnatomy: ["General/Systemic"],
      timeline: "Immediate/Acute",
      detectedOnsetCategory: 'Today',
      assignedDoctorId: "ALL",
      status: "waiting",
      isEscalated: true,
      reportedLanguage: lang,
    });
  };

  if (view === 'doctor') {
    return (
      <ErrorBoundary>
        <DoctorDashboard onClose={() => setView('triage')} />
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-medical-slate-light)] flex flex-col font-sans">
      <header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b-4 border-[var(--color-medical-blue)] flex-wrap gap-4">
        <div className="flex items-center gap-2 text-[var(--color-medical-blue)] font-bold text-2xl">
          <Stethoscope size={32} />
          PulseCheck
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView('doctor')}
            className="text-sm font-bold text-[var(--color-medical-blue)] bg-blue-50 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors"
          >
            [Switch to Doctor Portal]
          </button>
          
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
                  onClick={handleEmergencyTrigger}
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
            
            <h1 className="text-4xl font-black mb-4 uppercase">🚨 Alert Dispatched to Triage Desk</h1>
            
            <div className="bg-white/10 p-6 rounded-lg mb-8 border border-white/20 w-full">
              <p className="text-2xl font-bold mb-4">Please proceed immediately to the ER Front Counter or alert the nearest medical staff.</p>
              <p className="text-lg opacity-90">Staff has been notified of an active emergency alert.</p>
            </div>
            
            <div className="flex flex-col gap-4 w-full max-w-sm">
              <a 
                href="tel:112"
                className="flex items-center justify-center gap-2 bg-white text-[var(--color-alert-red)] px-6 py-4 rounded-full font-black text-xl hover:bg-gray-100 transition-colors shadow-lg"
              >
                <Phone size={24} />
                Call ER Desk / Emergency Hotline
              </a>
              <button 
                onClick={() => { 
                  setSpeakingText(null); 
                  setView('triage'); 
                  // Cancel the active alert
                  const alerts = getEmergencyAlerts();
                  alerts.filter((a: any) => a.status === 'active').forEach((a: any) => updateEmergencyAlertStatus(a.id, 'cancelled'));
                }}
                className="mt-4 text-white/80 hover:text-white underline font-semibold flex justify-center items-center gap-2"
              >
                Cancel / False Alarm
              </button>
            </div>
          </div>
        )}

        {view === 'intake' && (
          <IntakeForm 
            lang={lang} 
            speak={speak} 
            getTtsButtonClass={getTtsButtonClass} 
            onComplete={(summary) => { 
              setSpeakingText(null); 
              setFinalSummary(summary);
              setView('success'); 
            }} 
          />
        )}

        {view === 'success' && (
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border-t-8 border-green-500 p-8 text-center mt-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 10 }}
              className="flex justify-center mb-4 text-green-500"
            >
              <CheckCircle size={64} />
            </motion.div>
            
            <div className="flex justify-center items-center gap-3 mb-6">
              <h3 className="text-2xl font-bold text-slate-800">{t.successMsg}</h3>
              <button 
                onClick={() => speak(t.successMsg)}
                className={getTtsButtonClass(t.successMsg)}
              >
                <Volume2 size={24} />
              </button>
            </div>

            {finalSummary && (
              <>
                {/* TOKEN TICKET CARD */}
                {finalSummary.tokenNumber && (
                  <div className="bg-slate-900 text-white rounded-xl p-6 mb-8 shadow-md border-4 border-slate-800 border-dashed relative overflow-hidden">
                    <div className="text-slate-400 font-bold tracking-widest text-sm mb-2">{t.queueTokenNumber}</div>
                    <div className="text-6xl font-black mb-2 text-[var(--color-medical-blue)] bg-white inline-block px-8 py-4 rounded-lg shadow-inner">
                      {finalSummary.tokenNumber}
                    </div>
                    <div className="text-slate-300 text-sm mb-6 max-w-sm mx-auto">
                      Please take a screenshot or note this number. The physician will call you using this token.
                    </div>
                    
                    <div className="bg-slate-800 rounded-lg p-3 inline-block mb-6">
                      <span className="font-semibold text-slate-400">{t.estimatedWait}</span>{' '}
                      <span className="text-lg font-bold text-white">
                        {Math.max(0, getPatientQueue().filter(p => p.status === 'waiting').length - 1)} {t.patientsAhead}
                      </span>
                    </div>
                    
                    <div>
                      <button 
                        onClick={() => window.print()}
                        className="bg-white text-slate-900 hover:bg-slate-200 transition-colors px-6 py-2 rounded-full font-bold text-sm inline-flex items-center gap-2"
                      >
                        <Printer size={16} /> {t.savePrintToken}
                      </button>
                    </div>
                  </div>
                )}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-left mb-8 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Stethoscope size={20} className="text-[var(--color-medical-blue)]" />
                    Clinical HPI Summary Preview
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    finalSummary.aiUrgency === 'high' ? 'bg-red-100 text-red-700' :
                    finalSummary.aiUrgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {finalSummary.aiUrgency} Urgency
                  </span>
                </div>
                
                <div className="space-y-4 text-sm text-slate-700">
                  <div>
                    <span className="font-semibold text-slate-500 uppercase text-xs block mb-1">Chief Complaint</span>
                    <p className="font-bold text-slate-900 text-base">{finalSummary.analyzedChiefComplaint}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 uppercase text-xs block mb-1">Timeline & Onset</span>
                    <p className="font-medium text-slate-800">{finalSummary.timeline}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-500 uppercase text-xs block mb-1">Key Clinical Findings</span>
                    <ul className="list-disc pl-5 space-y-1 bg-white p-3 rounded border border-slate-200">
                      {finalSummary.clinicalBulletPoints.map((pt, i) => (
                        <li key={i}>{pt}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-slate-200">
                    <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-semibold">
                      Pain Score: {finalSummary.aiAssignedPainSeverity}/10
                    </span>
                    {finalSummary.affectedAnatomy.map(tag => (
                      <span key={tag} className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs border border-slate-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              </>
            )}
            
            <button 
              onClick={() => {
                setSpeakingText(null);
                setView('triage');
              }}
              className="bg-slate-200 text-slate-700 text-lg px-8 py-3 rounded-lg font-bold shadow hover:bg-slate-300 transition-colors"
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
