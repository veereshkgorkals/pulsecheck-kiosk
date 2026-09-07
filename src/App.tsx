import { useState, useEffect } from 'react';
import { AlertTriangle, Stethoscope, Settings, Phone, Volume2, CheckCircle, Printer, Copy, Smartphone, MessageSquare, Clock, Calendar, MapPin } from 'lucide-react';
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

  const [showSmsToast, setShowSmsToast] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const t = translations[lang] as any; // Cast as any because we added new keys dynamically

  useEffect(() => {
    window.speechSynthesis.cancel();
    setSpeakingText(null);
  }, [lang]);

  useEffect(() => {
    if (view === 'success' && finalSummary?.tokenNumber) {
      setShowSmsToast(true);
      const timer = setTimeout(() => setShowSmsToast(false), 6000);
      return () => clearTimeout(timer);
    }
  }, [view, finalSummary]);

  const getDigitalTokenMessage = () => {
    if (!finalSummary) return '';
    const patientFirstName = finalSummary.patientInfo?.name?.split(' ')[0] || "Patient";
    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formattedTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const patientsAheadCount = Math.max(0, getPatientQueue().filter(p => p.status === 'waiting').length - 1);
    const estWait = patientsAheadCount * 5;

    return `🏥 *PulseCheck Hospital • OPD Digital Token*
━━━━━━━━━━━━━━━━━━━━
👋 Hello *${patientFirstName}*, your consultation is confirmed!

🎟️ *TOKEN NUMBER:* *${finalSummary.tokenNumber}*
👨‍⚕️ *Consulting Doctor:* Dr. ${finalSummary.assignedDoctorName}
🩺 *Department:* ${finalSummary.assignedDepartment}
⏱️ *Est. Wait Time:* ~${estWait || "20"} mins (${patientsAheadCount || "1"} patients ahead)
📅 *Time:* Today, ${formattedDate} • ${formattedTime}

📍 *Next Steps:*
• Please proceed to the *OPD Waiting Lounge*.
• Watch the display monitors for your token *${finalSummary.tokenNumber}*.
• Your AI triage summary is already on the doctor's screen.

_PulseCheck Smart Intake System_`;
  };

  const handleShare = async () => {
    const msg = getDigitalTokenMessage();
    if (!msg) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Hospital Appointment Token',
          text: msg
        });
      } catch (err) {
        console.error('Share failed', err);
      }
    } else {
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleCopy = () => {
    const msg = getDigitalTokenMessage();
    if (!msg) return;
    navigator.clipboard.writeText(msg);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

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
      isValidClinicalInput: true,
      rejectionReason: null,
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
                  {t.symptoms.map((symptom: string, idx: number) => (
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
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border-t-8 border-green-500 p-8 text-center mt-6 relative">
            
            {/* SIMULATED SMS TOAST NOTIFICATION */}
            {showSmsToast && finalSummary?.patientInfo?.phone && (
              <motion.div 
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="absolute -top-4 left-1/2 -translate-x-1/2 w-11/12 max-w-md bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-200 z-50 cursor-pointer"
                onClick={() => setShowSmsToast(false)}
              >
                <div className="bg-slate-100/50 px-4 py-2 flex items-center justify-between border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="bg-green-500 w-6 h-6 rounded flex items-center justify-center">
                      <MessageSquare size={14} className="text-white" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">{t.hospitalDispatch || 'Hospital Dispatch • Just now'}</span>
                  </div>
                </div>
                <div className="p-4 text-left">
                  <p className="text-sm font-medium text-slate-800">
                    <span className="text-slate-500 block text-xs mb-1 uppercase">{t.smsDispatched || 'SMS dispatched to'} {finalSummary.patientInfo.phone}:</span>
                    "PulseCheck Confirmed: Token {finalSummary.tokenNumber} assigned for {finalSummary.assignedDoctorName} ({finalSummary.assignedDepartment}). Please wait for your turn."
                  </p>
                </div>
              </motion.div>
            )}

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
                {/* UNIFIED DIGITAL TOKEN TICKET CARD */}
                {finalSummary.tokenNumber && (
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden mb-8 max-w-md mx-auto relative">
                    {/* Header Section */}
                    <div className="bg-slate-900 text-white p-6 text-left relative overflow-hidden">
                      <div className="absolute top-0 right-0 opacity-10 text-9xl -mt-4 -mr-4 pointer-events-none">🏥</div>
                      <div className="flex items-center gap-2 text-blue-300 font-bold text-sm tracking-widest uppercase mb-4 relative z-10">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        OPD Digital Token
                      </div>
                      <h3 className="text-2xl font-bold mb-1 relative z-10">
                        Hello {finalSummary.patientInfo?.name?.split(' ')[0] || "Patient"},
                      </h3>
                      <p className="text-slate-300 text-sm relative z-10">Your consultation is confirmed!</p>
                      
                      <div className="mt-8 mb-2 relative z-10">
                        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Token Number</div>
                        <div className="text-5xl font-black text-white">{finalSummary.tokenNumber}</div>
                      </div>
                    </div>

                    {/* Details Section */}
                    <div className="bg-slate-50 p-6 text-left border-b border-slate-200 border-dashed">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-white p-2 rounded shadow-sm"><Stethoscope size={18} className="text-blue-600" /></div>
                          <div>
                            <div className="text-xs text-slate-500 font-bold uppercase">Consulting Doctor</div>
                            <div className="font-bold text-slate-900">Dr. {finalSummary.assignedDoctorName}</div>
                            <div className="text-sm text-slate-600">{finalSummary.assignedDepartment}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="bg-white p-2 rounded shadow-sm"><Clock size={18} className="text-orange-500" /></div>
                          <div>
                            <div className="text-xs text-slate-500 font-bold uppercase">Est. Wait Time</div>
                            <div className="font-bold text-slate-900">
                              ~{Math.max(0, getPatientQueue().filter(p => p.status === 'waiting').length - 1) * 5} mins
                            </div>
                            <div className="text-sm text-slate-600">
                              {Math.max(0, getPatientQueue().filter(p => p.status === 'waiting').length - 1)} {t.patientsAhead || 'patients ahead'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="bg-white p-2 rounded shadow-sm"><Calendar size={18} className="text-purple-500" /></div>
                          <div>
                            <div className="text-xs text-slate-500 font-bold uppercase">Time</div>
                            <div className="font-bold text-slate-900">Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                            <div className="text-sm text-slate-600">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Next Steps */}
                    <div className="p-6 text-left bg-white border-b border-slate-100">
                      <div className="text-xs text-slate-500 font-bold uppercase mb-3 flex items-center gap-2">
                        <MapPin size={16} /> Next Steps
                      </div>
                      <ul className="text-sm text-slate-700 space-y-2 list-disc list-inside ml-1 marker:text-blue-500">
                        <li>Please proceed to the <strong>OPD Waiting Lounge</strong>.</li>
                        <li>Watch the monitors for token <strong>{finalSummary.tokenNumber}</strong>.</li>
                        <li>Your AI triage notes are with the doctor.</li>
                      </ul>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-4 bg-slate-50 flex flex-col sm:flex-row gap-3">
                      <button 
                        onClick={handleShare}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white transition-colors px-4 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
                      >
                        <Smartphone size={18} /> {t.receiveTicketSms || 'WhatsApp Token'}
                      </button>
                      <button 
                        onClick={handleCopy}
                        className="flex-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors px-4 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm relative overflow-hidden"
                      >
                        {copiedSuccess ? (
                          <span className="text-green-600 flex items-center gap-2"><CheckCircle size={18} /> Copied to Clipboard!</span>
                        ) : (
                          <><Copy size={18} /> Copy WhatsApp Text</>
                        )}
                      </button>
                      <button 
                        onClick={() => window.print()}
                        className="p-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg transition-colors flex items-center justify-center"
                        title="Print Ticket"
                      >
                        <Printer size={18} />
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
