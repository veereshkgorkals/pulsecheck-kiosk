import { useState } from 'react';
import { Volume2, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { translations, type Language } from '../i18n';
import { VoiceRecorder } from './VoiceRecorder';
import { type TranscriptionResult } from '../services/transcriptionService';
import { generateFinalSummary, analyzeNarrative, type ClinicalSummary, type AIAnalysisResult } from '../services/aiSummarizerService';
import { savePatientSummary } from '../utils/storage';
import { Loader2 } from 'lucide-react';

interface IntakeFormProps {
  lang: Language;
  speak: (text: string) => void;
  getTtsButtonClass: (text: string) => string;
  onComplete: (summary: ClinicalSummary) => void;
}

export function IntakeForm({ lang, speak, getTtsButtonClass, onComplete }: IntakeFormProps) {
  const t = translations[lang];
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    phone: '',
    chiefComplaint: '',
    bodyParts: [] as string[],
    otherAffectedArea: '',
    painSeverity: 5,
    onset: '',
    character: '',
    aggravating: '',
    voiceRecording: null as TranscriptionResult | null,
    aiAnalysis: null as AIAnalysisResult | null
  });

  const updateForm = (key: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const toggleBodyPart = (part: string) => {
    setFormData(prev => {
      const parts = prev.bodyParts.includes(part)
        ? prev.bodyParts.filter(p => p !== part)
        : [...prev.bodyParts, part];
      return { ...prev, bodyParts: parts };
    });
    setError('');
  };

  const handleTranscription = (result: TranscriptionResult) => {
    updateForm('voiceRecording', result);
    updateForm('chiefComplaint', result.englishTranslation);
  };

  const nextStep = async () => {
    if (step === 0) {
      if (!formData.firstName || !formData.lastName || !formData.dob || !formData.phone) {
        setError((t as any).requiredErr || 'Please fill in all required fields.');
        return;
      }
    }
    if (step === 1) {
      if (!formData.chiefComplaint) {
        setError((t as any).requiredErr || 'Please fill in all required fields.');
        return;
      }
      
      setIsSubmitting(true);
      setError('');
      try {
        const analysis = await analyzeNarrative(formData.chiefComplaint, formData.voiceRecording?.englishTranslation || '', lang);
        
        updateForm('aiAnalysis', analysis);
        updateForm('painSeverity', analysis.aiAssignedPainSeverity);
        
        if (analysis.detectedOnsetCategory) {
          updateForm('onset', analysis.detectedOnsetCategory);
        } else {
          updateForm('onset', '');
        }

        const bStr = analysis.clinicalBulletPoints.join(' ').toLowerCase();
        if (bStr.includes('sharp')) updateForm('character', t.characterChips[0]);
        else if (bStr.includes('dull')) updateForm('character', t.characterChips[1]);
        else if (bStr.includes('burn')) updateForm('character', t.characterChips[2]);
        else if (bStr.includes('throb')) updateForm('character', t.characterChips[3]);
        else if (bStr.includes('ach')) updateForm('character', t.characterChips[4]);

        setIsSubmitting(false);
      } catch (err) {
        console.error('Narrative analysis failed', err);
        setError('Failed to analyze clinical narrative.');
        setIsSubmitting(false);
        return;
      }
    }
    setError('');
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => Math.max(0, s - 1));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      if (!formData.aiAnalysis) {
        throw new Error('AI analysis missing');
      }
      
      const summary = generateFinalSummary(formData as any, formData.aiAnalysis);
      savePatientSummary(summary);
      onComplete(summary);
    } catch (err) {
      console.error('Failed to generate summary', err);
      setError('An error occurred while generating the clinical note.');
      setIsSubmitting(false);
    }
  };

  const getEmoji = (val: number) => {
    if (val <= 3) return '😄';
    if (val <= 6) return '😐';
    return '😭';
  };

  const getEmojiLabel = (val: number) => {
    if (val <= 3) return t.painMild;
    if (val <= 6) return t.painModerate;
    return t.painSevere;
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
      {/* Step Indicator */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center text-sm font-medium text-slate-500">
        <span className={step >= 0 ? 'text-[var(--color-medical-blue)]' : ''}>1. {t.stepAHeader}</span>
        <span className={step >= 1 ? 'text-[var(--color-medical-blue)]' : ''}>2. {t.stepBHeader}</span>
        <span className={step >= 2 ? 'text-[var(--color-medical-blue)]' : ''}>3. {t.stepCHeader}</span>
        <span className={step >= 3 ? 'text-[var(--color-medical-blue)]' : ''}>4. {t.stepDHeader}</span>
      </div>

      <div className="p-8">
        {error && (
          <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* STEP A */}
        {step === 0 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">{t.stepAHeader}</h2>
              <button 
                onClick={() => speak(t.stepAHeader)}
                className={getTtsButtonClass(t.stepAHeader)}
              >
                <Volume2 size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.firstName} *</label>
                <input 
                  type="text" 
                  value={formData.firstName}
                  onChange={e => updateForm('firstName', e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-[var(--color-medical-blue)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.lastName} *</label>
                <input 
                  type="text" 
                  value={formData.lastName}
                  onChange={e => updateForm('lastName', e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-[var(--color-medical-blue)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.dob} *</label>
                <input 
                  type="date" 
                  value={formData.dob}
                  onChange={e => updateForm('dob', e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-[var(--color-medical-blue)] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t.phone} *</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={e => updateForm('phone', e.target.value)}
                  className="w-full border border-slate-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-[var(--color-medical-blue)] outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP B */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">{t.stepBHeader}</h2>
              <button 
                onClick={() => speak(t.stepBHeader + '. ' + t.chiefComplaintPrompt)}
                className={getTtsButtonClass(t.stepBHeader + '. ' + t.chiefComplaintPrompt)}
              >
                <Volume2 size={20} />
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-lg font-medium text-slate-700 mb-2">{t.chiefComplaintPrompt} *</label>
              <textarea 
                value={formData.chiefComplaint}
                onChange={e => updateForm('chiefComplaint', e.target.value)}
                rows={3}
                className="w-full border border-slate-300 rounded-md px-4 py-3 focus:ring-2 focus:ring-[var(--color-medical-blue)] outline-none resize-none mb-3"
              />
              <VoiceRecorder lang={lang} onTranscribe={handleTranscription} />
              
              {formData.voiceRecording && (
                <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm">
                  <div className="mb-2">
                    <span className="font-semibold text-slate-700 block mb-1">{(t as any).originalTranscript || 'Original Transcript'}</span>
                    <p className="text-slate-600 italic">"{formData.voiceRecording.originalTranscript}"</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">{(t as any).englishTranslation || 'English Translation'}</span>
                    <p className="text-slate-800">"{formData.voiceRecording.englishTranslation}"</p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Select Affected Areas</label>
              <div className="flex flex-wrap gap-2">
                {t.bodyParts.map(part => (
                  <button
                    key={part}
                    onClick={() => toggleBodyPart(part)}
                    className={`px-4 py-2 rounded-full border transition-colors ${
                      formData.bodyParts.includes(part)
                        ? 'bg-[var(--color-medical-blue)] text-white border-[var(--color-medical-blue)]'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-[var(--color-medical-blue)]'
                    }`}
                  >
                    {part}
                  </button>
                ))}
              </div>
              
              {formData.bodyParts.includes(t.bodyParts[t.bodyParts.length - 1]) && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Please specify affected area:</label>
                  <input
                    type="text"
                    value={formData.otherAffectedArea}
                    onChange={e => updateForm('otherAffectedArea', e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-[var(--color-medical-blue)] outline-none"
                    placeholder="e.g. Neck, Shoulder"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP C */}
        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-slate-800">{t.stepCHeader}</h2>
              <button 
                onClick={() => speak(t.stepCHeader)}
                className={getTtsButtonClass(t.stepCHeader)}
              >
                <Volume2 size={20} />
              </button>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-lg font-medium text-slate-700">{t.painSeverity}</label>
                <div className="text-3xl flex items-center gap-2 font-bold text-[var(--color-medical-blue)]">
                  {getEmoji(formData.painSeverity)}
                  <span>{formData.painSeverity}</span>
                  <span className="text-sm font-normal text-slate-500 uppercase">{getEmojiLabel(formData.painSeverity)}</span>
                </div>
              </div>
              
              <div className="mb-4 bg-blue-50 text-blue-800 text-xs px-3 py-2 rounded-md inline-block font-semibold">
                🤖 AI Assessed Severity (Clinically Locked)
                <span className="block font-normal text-blue-600 mt-0.5">Severity calculated from patient narrative description.</span>
              </div>
              
              <input 
                type="range" 
                min="1" 
                max="10" 
                disabled={true}
                value={formData.painSeverity}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-not-allowed accent-slate-400 opacity-70"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-2">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-slate-700">{t.onset}</label>
                {formData.aiAnalysis?.detectedOnsetCategory && (
                  <span className="text-xs text-purple-700 font-medium bg-purple-50 px-2 py-1 rounded-full flex items-center gap-1 border border-purple-100">
                    ✨ Auto-detected (editable)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {t.onsetChips.map(chip => (
                  <button
                    key={chip}
                    onClick={() => updateForm('onset', formData.onset === chip ? '' : chip)}
                    className={`px-4 py-2 rounded-full border transition-colors ${
                      formData.onset === chip
                        ? 'bg-[var(--color-medical-blue)] text-white border-[var(--color-medical-blue)]'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-[var(--color-medical-blue)]'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.character}</label>
              <div className="flex flex-wrap gap-2">
                {t.characterChips.map(chip => (
                  <button
                    key={chip}
                    onClick={() => updateForm('character', formData.character === chip ? '' : chip)}
                    className={`px-4 py-2 rounded-full border transition-colors ${
                      formData.character === chip
                        ? 'bg-[var(--color-medical-blue)] text-white border-[var(--color-medical-blue)]'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-[var(--color-medical-blue)]'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">{t.aggravating}</label>
              <input 
                type="text" 
                value={formData.aggravating}
                onChange={e => updateForm('aggravating', e.target.value)}
                className="w-full border border-slate-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-[var(--color-medical-blue)] outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP D */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-2xl font-bold text-slate-800">{t.stepDHeader}</h2>
              <button 
                onClick={() => speak(t.stepDHeader)}
                className={getTtsButtonClass(t.stepDHeader)}
              >
                <Volume2 size={20} />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-4">
                <div>
                  <span className="block text-xs text-slate-500 uppercase">{t.firstName}</span>
                  <span className="font-medium text-slate-800">{formData.firstName}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 uppercase">{t.lastName}</span>
                  <span className="font-medium text-slate-800">{formData.lastName}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 uppercase">{t.dob}</span>
                  <span className="font-medium text-slate-800">{formData.dob}</span>
                </div>
                <div>
                  <span className="block text-xs text-slate-500 uppercase">{t.phone}</span>
                  <span className="font-medium text-slate-800">{formData.phone}</span>
                </div>
              </div>

              <div className="border-b border-slate-200 pb-4">
                <span className="block text-xs text-slate-500 uppercase">{t.stepBHeader}</span>
                <p className="font-medium text-slate-800">{formData.chiefComplaint}</p>
                {formData.voiceRecording && (
                  <div className="mt-3">
                    <span className="block text-xs text-slate-500 uppercase mb-1">{(t as any).originalAudio || 'Original Audio'}</span>
                    <audio src={formData.voiceRecording.audioBlobUrl} controls className="w-full max-w-sm h-8" />
                  </div>
                )}
                {formData.bodyParts.length > 0 && (
                  <div className="mt-2 text-sm text-slate-600">
                    Areas: {formData.bodyParts.join(', ')}
                  </div>
                )}
              </div>

              <div>
                <span className="block text-xs text-slate-500 uppercase mb-2">{t.stepCHeader}</span>
                <div className="flex gap-4 items-center">
                  <div className="bg-blue-50 text-[var(--color-medical-blue)] px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                    {getEmoji(formData.painSeverity)} {formData.painSeverity}/10 ({getEmojiLabel(formData.painSeverity)})
                  </div>
                  {formData.onset && <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs">{formData.onset}</span>}
                  {formData.character && <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs">{formData.character}</span>}
                </div>
                {formData.aggravating && (
                  <p className="mt-2 text-sm text-slate-700">
                    <span className="font-medium">Aggravating/Relieving:</span> {formData.aggravating}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-200">
          <button 
            onClick={prevStep}
            disabled={step === 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-colors ${
              step === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft size={20} />
            {t.back}
          </button>

          {step < 3 ? (
            <button 
              onClick={nextStep}
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white transition-colors shadow-sm ${
                isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-[var(--color-medical-blue)] hover:bg-blue-600'
              }`}
            >
              {isSubmitting && step === 1 ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  AI Analyzing...
                </>
              ) : (
                <>
                  {t.next}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white transition-colors shadow-sm ${
                isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Generating AI Note...
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  {t.submit}
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
