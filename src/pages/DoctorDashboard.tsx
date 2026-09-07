import { useState, useEffect, useMemo } from 'react';
import { getPatientQueue, savePatientSummary } from '../utils/storage';
import { type ClinicalSummary } from '../services/aiSummarizerService';
import { getAuthenticatedStaff, logoutStaff, type StaffUser } from '../services/authService';
import { DoctorAuthModal } from '../components/DoctorAuthModal';
import { Stethoscope, ClipboardCopy, CheckCircle2, Clock, AlertTriangle, Volume2, ChevronDown, ChevronUp, User, Activity, FileText, LogOut } from 'lucide-react';

interface DoctorDashboardProps {
  onClose: () => void;
}

export function DoctorDashboard({ onClose }: DoctorDashboardProps) {
  const [staffUser, setStaffUser] = useState<StaffUser | null>(getAuthenticatedStaff());
  const [patients, setPatients] = useState<ClinicalSummary[]>([]);
  const [filter, setFilter] = useState<'All' | 'High Urgency' | 'Waiting'>('Waiting');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [transcriptOpen, setTranscriptOpen] = useState(false);
  const [callingToken, setCallingToken] = useState<string | null>(null);

  const loadPatients = () => {
    const queue = getPatientQueue();
    const urgencyWeight = { high: 3, medium: 2, low: 1 };
    
    queue.sort((a, b) => {
      if (a.isEscalated && !b.isEscalated) return -1;
      if (!a.isEscalated && b.isEscalated) return 1;
      
      const wA = urgencyWeight[a.aiUrgency];
      const wB = urgencyWeight[b.aiUrgency];
      if (wA !== wB) return wB - wA;
      
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    setPatients(queue);
  };

  useEffect(() => {
    loadPatients();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pulsecheck_patients_queue') {
        loadPatients();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [showAll, setShowAll] = useState(false);

  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      // Doctor Isolation Filtering
      if (!showAll && staffUser && p.assignedDoctorId !== staffUser.doctorId) {
        return false;
      }
      
      if (filter === 'All') return true;
      if (filter === 'High Urgency') return p.status === 'waiting' && (p.aiUrgency === 'high' || p.isEscalated);
      if (filter === 'Waiting') return p.status === 'waiting';
      return true;
    });
  }, [patients, filter, showAll, staffUser]);

  const selectedPatient = patients.find(p => p.id === selectedPatientId) || null;

  useEffect(() => {
    if (!selectedPatient && filteredPatients.length > 0) {
      setSelectedPatientId(filteredPatients[0].id);
    }
  }, [filteredPatients, selectedPatient]);

  const updatePatient = (updated: ClinicalSummary) => {
    savePatientSummary(updated);
    loadPatients();
    if (selectedPatientId === updated.id && updated.status === 'seen' && filter !== 'All') {
      setSelectedPatientId(null);
    }
  };

  const handleMarkSeen = () => {
    if (selectedPatient) {
      updatePatient({ ...selectedPatient, status: 'seen' });
    }
  };

  const handleEscalate = () => {
    if (selectedPatient) {
      updatePatient({ ...selectedPatient, isEscalated: !selectedPatient.isEscalated });
    }
  };

  const copyToEHR = () => {
    if (!selectedPatient) return;
    const { patientInfo, analyzedChiefComplaint, timeline, clinicalBulletPoints, affectedAnatomy, aiAssignedPainSeverity } = selectedPatient;
    
    const soapNote = `PATIENT: ${patientInfo.name}
DOB: ${patientInfo.dob} | PHONE: ${patientInfo.phone}

--- SUBJECTIVE (SOAP) ---
CHIEF COMPLAINT: ${analyzedChiefComplaint}
TIMELINE/ONSET: ${timeline}
PAIN SEVERITY: ${aiAssignedPainSeverity}/10

CLINICAL BULLETS:
${clinicalBulletPoints.map(b => '- ' + b).join('\n')}

AFFECTED ANATOMY: ${affectedAnatomy.join(', ')}`;

    navigator.clipboard.writeText(soapNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeAgo = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffHrs / 24)} days ago`;
  };

  const urgencyColors = {
    high: 'bg-red-100 text-red-700 border-red-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    low: 'bg-green-100 text-green-700 border-green-200'
  };

  const handleLogout = () => {
    logoutStaff();
    setStaffUser(null);
    onClose();
  };

  if (!staffUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <DoctorAuthModal onAuthenticated={setStaffUser} onCancel={onClose} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans overflow-hidden">
      {/* HEADER */}
      <header className="bg-slate-900 text-white p-4 flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <Activity size={28} className="text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight">PulseCheck EHR Portal</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="flex bg-slate-800 rounded-lg p-1">
            {(['Waiting', 'High Urgency', 'All'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  filter === f ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-sm text-slate-300">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            {patients.filter(p => p.status === 'waiting').length} Active
          </div>
          
          <div className="flex items-center gap-4 border-l border-slate-700 pl-4">
            <div className="text-right hidden md:block">
              <div className="text-sm font-bold">{staffUser.fullName} | {staffUser.department}</div>
              <div className="text-xs text-slate-400">ID: {staffUser.doctorId}</div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-slate-800 hover:bg-red-600 hover:text-white text-slate-300 px-3 py-1.5 rounded transition-colors"
              title="Log out"
            >
              <LogOut size={16} />
              <span className="text-sm font-bold">Logout / Lock Session</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT PANEL: QUEUE */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-slate-200 overflow-y-auto flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50 sticky top-0 z-10">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                {showAll ? 'All Clinic Intakes' : `My Assigned Patients (${filteredPatients.length})`}
              </h2>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showAll} 
                onChange={(e) => setShowAll(e.target.checked)}
                className="rounded border-slate-300 text-[var(--color-medical-blue)] focus:ring-[var(--color-medical-blue)]"
              />
              Show All Clinic Intakes
            </label>
          </div>
          
          <div className="divide-y divide-slate-100">
            {filteredPatients.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No patients found.</div>
            ) : (
              filteredPatients.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`w-full text-left p-4 transition-colors relative border-l-4 ${
                    selectedPatientId === p.id 
                      ? 'bg-blue-50 border-blue-500' 
                      : 'bg-white border-transparent hover:bg-slate-50'
                  } ${p.status === 'seen' ? 'opacity-60' : ''}`}
                >
                  {p.isEscalated && (
                    <div className="absolute top-0 right-0 w-0 h-0 border-t-[30px] border-l-[30px] border-t-red-500 border-l-transparent"></div>
                  )}
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-slate-800">
                      {p.tokenNumber && <span className="text-[var(--color-medical-blue)] mr-1">[{p.tokenNumber}]</span>}
                      {p.patientInfo.name}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase border ${urgencyColors[p.aiUrgency]}`}>
                      {p.aiUrgency}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <User size={12} /> {p.patientInfo.dob}
                    <span className="text-slate-300">•</span>
                    <Clock size={12} /> {timeAgo(p.timestamp)}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-1 font-medium bg-slate-100 px-2 py-1 rounded inline-block w-full overflow-hidden text-ellipsis whitespace-nowrap">
                    {p.analyzedChiefComplaint}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANEL: EHR PREVIEW */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {selectedPatient ? (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* PATIENT HEADER */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex justify-between items-start relative overflow-hidden">
                {callingToken === selectedPatient.tokenNumber && (
                  <div className="absolute top-0 left-0 w-full bg-green-500 text-white text-center text-sm font-bold py-1 animate-pulse">
                    NOW SERVING TOKEN {selectedPatient.tokenNumber}
                  </div>
                )}
                <div className={callingToken === selectedPatient.tokenNumber ? 'mt-4' : ''}>
                  <div className="flex items-center gap-3 mb-2">
                    {selectedPatient.tokenNumber && (
                      <span className="bg-slate-900 text-white px-3 py-1 rounded text-lg font-black tracking-widest shadow-inner">
                        {selectedPatient.tokenNumber}
                      </span>
                    )}
                    <h2 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                      {selectedPatient.patientInfo.name}
                      {selectedPatient.isEscalated && (
                        <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-md uppercase font-bold tracking-wider flex items-center gap-1 animate-pulse">
                          <AlertTriangle size={14} /> Escalated
                        </span>
                      )}
                    </h2>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-500 font-medium">
                    <span>Phone: {selectedPatient.patientInfo.phone}</span>
                    <span>Lang: {(selectedPatient.reportedLanguage || 'en').toUpperCase()}</span>
                    <span>Status: {selectedPatient.status === 'seen' ? 'Seen/Archived' : 'Waiting'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-slate-500 uppercase mb-1">AI Pain Score</div>
                  <div className="text-4xl font-black text-slate-800">
                    {selectedPatient.aiAssignedPainSeverity}<span className="text-xl text-slate-400">/10</span>
                  </div>
                </div>
              </div>

              {/* ACTION CONTROLS */}
              <div className="flex gap-3 flex-wrap">
                {selectedPatient.tokenNumber && (
                  <button
                    onClick={() => {
                      setCallingToken(selectedPatient.tokenNumber!);
                      setTimeout(() => setCallingToken(null), 5000); // Stop flashing after 5s
                    }}
                    className="min-w-[150px] px-6 py-3 rounded-lg font-bold bg-green-100 text-green-800 hover:bg-green-200 border border-green-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Volume2 size={20} />
                    Call Token
                  </button>
                )}
                <button
                  onClick={copyToEHR}
                  className={`flex-1 min-w-[200px] py-3 px-4 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
                    copied ? 'bg-green-100 text-green-700' : 'bg-[var(--color-medical-blue)] text-white hover:bg-blue-600'
                  }`}
                >
                  {copied ? <CheckCircle2 size={20} /> : <ClipboardCopy size={20} />}
                  {copied ? 'Copied to Clipboard!' : 'Copy SOAP Note to EHR'}
                </button>
                <button
                  onClick={handleMarkSeen}
                  disabled={selectedPatient.status === 'seen'}
                  className="min-w-[200px] px-6 py-3 rounded-lg font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 transition-colors"
                >
                  Mark as Seen / Archive
                </button>
                <button
                  onClick={handleEscalate}
                  className={`min-w-[200px] px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors border ${
                    selectedPatient.isEscalated 
                      ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <AlertTriangle size={20} className={selectedPatient.isEscalated ? 'fill-red-100' : ''} />
                  {selectedPatient.isEscalated ? 'Remove Escalation' : 'Escalate / Urgent'}
                </button>
              </div>

              {/* AI CLINICAL HPI SUMMARY */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center gap-2">
                  <FileText className="text-[var(--color-medical-blue)]" size={20} />
                  <h3 className="font-bold text-slate-800 uppercase tracking-wide">AI Clinical HPI (Subjective)</h3>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Chief Complaint</span>
                      <p className="text-lg font-bold text-slate-900">{selectedPatient.analyzedChiefComplaint}</p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Timeline & Onset</span>
                      <p className="text-base font-medium text-slate-800">{selectedPatient.timeline}</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Key Clinical Bullet Points</span>
                    <ul className="list-disc pl-5 space-y-2">
                      {selectedPatient.clinicalBulletPoints.map((pt, i) => (
                        <li key={i} className="text-slate-700">{pt}</li>
                      ))}
                    </ul>
                  </div>

                  {selectedPatient.clinicalBulletPoints.some(b => /motor|neuro|numbness|drop|weak|red flag/i.test(b)) && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <span className="font-bold text-orange-800 text-sm uppercase flex items-center gap-2 mb-2">
                        <AlertTriangle size={16} /> Neurological / Red Flags Detected
                      </span>
                      <p className="text-sm text-orange-900">
                        The AI analyzer detected potential neurological deficits or red flags in the narrative. Proceed with comprehensive neurological exam.
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Affected Anatomy</span>
                    <div className="flex gap-2 flex-wrap">
                      {selectedPatient.affectedAnatomy.map(tag => (
                        <span key={tag} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* AUDIO & TRANSCRIPT ACCORDION */}
              {selectedPatient.voiceRecording && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <button 
                    onClick={() => setTranscriptOpen(!transcriptOpen)}
                    className="w-full bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <Volume2 className="text-[var(--color-medical-blue)]" size={20} />
                      Audio & Transcripts
                    </div>
                    {transcriptOpen ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                  </button>
                  
                  {transcriptOpen && (
                    <div className="p-6 space-y-6">
                      {selectedPatient.voiceRecording.audioBlobUrl && (
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Original Audio</span>
                          <audio controls src={selectedPatient.voiceRecording.audioBlobUrl} className="w-full max-w-md h-10" />
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Original Transcript ({(selectedPatient.reportedLanguage || 'en').toUpperCase()})</span>
                          <p className="text-sm text-slate-600 italic">"{selectedPatient.voiceRecording.originalTranscript}"</p>
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">English Translation</span>
                          <p className="text-sm text-slate-800">"{selectedPatient.voiceRecording.englishTranslation}"</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <Stethoscope size={64} className="mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a patient from the queue</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
