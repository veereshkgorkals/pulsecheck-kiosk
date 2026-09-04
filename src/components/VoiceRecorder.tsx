import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, RotateCcw, Check, Loader2 } from 'lucide-react';
import { translations, languageCodes, type Language } from '../i18n';
import { transcribeAudioBlob, type TranscriptionResult } from '../services/transcriptionService';

interface VoiceRecorderProps {
  lang: Language;
  onTranscribe: (result: TranscriptionResult) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ lang, onTranscribe }) => {
  const t = translations[lang];
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  const startRecording = async () => {
    try {
      setErrorMsg('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setLiveTranscript('');

      // Initialize Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = languageCodes[lang] || 'en-US';
        
        let finalTranscript = '';
        recognitionRef.current.onresult = (event: any) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          setLiveTranscript(finalTranscript + interim);
        };
        recognitionRef.current.start();
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setTimer(0);

      timerIntervalRef.current = window.setInterval(() => {
        setTimer((prev) => {
          if (prev >= 59) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone', err);
      alert('Could not access microphone. Please allow permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch(e) {}
    }
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    setErrorMsg('');
    try {
      const result = await transcribeAudioBlob(audioBlob, lang, liveTranscript);
      onTranscribe(result);
    } catch (err: any) {
      console.error('Transcription error', err);
      if (err.message === 'NO_SPEECH') {
        setErrorMsg('No speech detected. Please try recording again and speak clearly.');
        resetRecording();
      } else {
        setErrorMsg('An error occurred during transcription.');
        resetRecording();
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const resetRecording = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setTimer(0);
    setLiveTranscript('');
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e) {}
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (isTranscribing) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border border-slate-200 rounded-lg bg-slate-50 gap-3">
        <Loader2 className="animate-spin text-[var(--color-medical-blue)]" size={32} />
        <span className="text-slate-600 font-medium">{(t as any).transcribeSave || 'Transcribing...'}</span>
      </div>
    );
  }

  if (audioUrl) {
    return (
      <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">{(t as any).originalAudio || 'Recorded Audio'}</span>
          <span className="text-xs text-slate-500">{formatTime(timer)} / 01:00</span>
        </div>
        <audio src={audioUrl} controls className="w-full h-10" />
        <div className="flex gap-2 justify-end">
          <button 
            onClick={resetRecording}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
          >
            <RotateCcw size={16} />
            {(t as any).reRecord || 'Re-record'}
          </button>
          <button 
            onClick={handleTranscribe}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-white bg-[var(--color-medical-blue)] hover:bg-blue-600 rounded"
          >
            <Check size={16} />
            {(t as any).transcribeSave || 'Transcribe & Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {errorMsg && (
        <div className="mb-3 p-3 bg-red-100 text-red-700 text-sm rounded-md font-medium border border-red-200">
          {errorMsg}
        </div>
      )}
      {!isRecording ? (
        <button 
          onClick={startRecording}
          className="flex items-center gap-2 text-[var(--color-medical-blue)] bg-blue-50 px-4 py-2 rounded-full font-medium hover:bg-blue-100 transition-colors w-full sm:w-auto justify-center"
        >
          <Mic size={18} />
          {(t as any).recordSymptomsVoice || 'Record Symptoms by Voice'}
        </button>
      ) : (
        <div className="flex items-center justify-between p-3 border border-red-200 bg-[var(--color-alert-red-light)] rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
            <span className="text-red-700 font-medium">{(t as any).recording || 'Recording...'} {formatTime(timer)}</span>
          </div>
          
          <button 
            onClick={stopRecording}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
          >
            <Square size={16} />
            Stop
          </button>
        </div>
      )}
    </div>
  );
};
