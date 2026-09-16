import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, RotateCcw, Check, Loader2, Play, Pause } from 'lucide-react';
import { translations, type Language } from '../i18n';
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
  const [recordedDuration, setRecordedDuration] = useState(0);

  // Custom playback state â€” replaces native <audio controls> to avoid mobile duration bugs
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playbackIntervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const detectMobile = useCallback(() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent), []);

  const startRecording = async () => {
    try {
      setErrorMsg('');
      setRecordedDuration(0);
      setPlaybackTime(0);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      // Pick the best supported container format
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        mimeType = 'audio/ogg;codecs=opus';
      }

      console.log('[PulseCheck] mimeType:', mimeType || 'browser-default', '| mobile:', detectMobile());

      const opts: MediaRecorderOptions = {};
      if (mimeType) opts.mimeType = mimeType;

      const mediaRecorder = new MediaRecorder(stream, opts);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      setLiveTranscript('');

      // Speech Recognition â€” try on ALL platforms (including mobile).
      // If it fails or produces nothing, the Gemini API fallback handles it.
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognitionRef.current = recognition;
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.maxAlternatives = 1;
          recognition.lang = lang === 'hi' ? 'hi-IN'
                           : lang === 'es' ? 'es-ES'
                           : lang === 'zh' ? 'zh-CN'
                           : lang === 'fr' ? 'fr-FR'
                           : 'en-US';

          let accumulated = '';
          recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                accumulated += event.results[i][0].transcript + ' ';
              } else {
                interim += event.results[i][0].transcript;
              }
            }
            setLiveTranscript(accumulated + interim);
          };

          recognition.onerror = (event: any) => {
            console.warn('[PulseCheck] SpeechRecognition error:', event.error);
          };

          recognition.onend = () => {
            console.log('[PulseCheck] SpeechRecognition session ended');
          };

          // Delay start to let the mic hardware finish initializing
          setTimeout(() => {
            try {
              if (mediaRecorder.state === 'recording') {
                recognition.start();
                console.log('[PulseCheck] SpeechRecognition started');
              }
            } catch (e) {
              console.warn('[PulseCheck] SpeechRecognition.start() failed:', e);
            }
          }, 300);
        } catch (e) {
          console.warn('[PulseCheck] Could not create SpeechRecognition:', e);
        }
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        setRecordedDuration(durationSec);

        const finalMime = mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: finalMime });

        console.log('[PulseCheck] Stopped. duration:', durationSec, 'blob.size:', blob.size, 'chunks:', chunksRef.current.length);

        if (blob.size < 100) {
          setErrorMsg('Recording failed â€” no audio data captured. Please try again.');
          return;
        }

        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Build an Audio element for our custom player
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => {
          setIsPlaying(false);
          setPlaybackTime(0);
          if (playbackIntervalRef.current) {
            clearInterval(playbackIntervalRef.current);
            playbackIntervalRef.current = null;
          }
        };

        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      // *** KEY FIX: pass a 250 ms timeslice ***
      // Without this, mobile Chrome often produces a single blob chunk with
      // incomplete/missing audio frames. The timeslice forces the encoder to
      // flush data every 250 ms, guaranteeing playable audio on all devices.
      mediaRecorder.start(250);
      startTimeRef.current = Date.now();
      setIsRecording(true);
      setTimer(0);

      timerIntervalRef.current = window.setInterval(() => {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000);
        setTimer(elapsed);
        if (elapsed >= 60) {
          stopRecording();
        }
      }, 1000);
    } catch (err) {
      console.error('[PulseCheck] Mic error:', err);
      setErrorMsg('Could not access microphone. Please allow mic permissions.');
    }
  };

  const stopRecording = () => {
    // Stop recognition first so it doesn't fight with the mic track release
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_e) { /* ignore */ }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
        playbackIntervalRef.current = null;
      }
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
        playbackIntervalRef.current = window.setInterval(() => {
          if (audioRef.current) {
            setPlaybackTime(Math.round(audioRef.current.currentTime));
          }
        }, 200);
      }).catch(err => {
        console.error('[PulseCheck] Playback error:', err);
        setErrorMsg('Playback failed. Try re-recording.');
      });
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    setIsTranscribing(true);
    setErrorMsg('');

    console.log('[PulseCheck] Transcribing. blob.type:', audioBlob.type, 'blob.size:', audioBlob.size, 'liveTranscript:', liveTranscript || '(none)');

    try {
      const result = await transcribeAudioBlob(audioBlob, lang, liveTranscript);
      onTranscribe(result);
    } catch (err: any) {
      console.error('[PulseCheck] Transcription error:', err);
      if (err.message === 'NO_SPEECH') {
        setErrorMsg('No clear speech detected. Please speak closer to your microphone and try again.');
      } else if (err.message === 'API_KEY_MISSING') {
        setErrorMsg('Transcription service not configured. Please ensure VITE_GEMINI_API_KEY is set in Netlify environment variables and redeploy.');
      } else if (err.message === 'AUDIO_CONVERSION_FAILED') {
        setErrorMsg('Could not process the audio recording. Please try re-recording.');
      } else if (err.message?.startsWith('TRANSCRIPTION_FAILED')) {
        setErrorMsg(`Transcription failed: ${err.message.replace('TRANSCRIPTION_FAILED: ', '')}. Please try re-recording or type your symptoms manually.`);
      } else {
        setErrorMsg('Transcription failed. Please re-record or type your symptoms manually.');
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const resetRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playbackIntervalRef.current) {
      clearInterval(playbackIntervalRef.current);
      playbackIntervalRef.current = null;
    }
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setTimer(0);
    setRecordedDuration(0);
    setPlaybackTime(0);
    setIsPlaying(false);
    setLiveTranscript('');
    setErrorMsg('');
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (_e) { /* */ }
      }
      if (audioRef.current) audioRef.current.pause();
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // â”€â”€â”€ Review state: recorded audio with custom playback controls â”€â”€â”€
  if (audioUrl && audioBlob) {
    return (
      <div className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex flex-col gap-3">
        {errorMsg && (
          <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md font-medium border border-red-200">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">{(t as any).originalAudio || 'Recorded Audio'}</span>
          <span className="text-xs text-slate-500">{formatTime(recordedDuration)} / 01:00</span>
        </div>

        {/* Custom audio player â€” completely avoids the native <audio controls> Infinity duration bug */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <button
            onClick={togglePlayback}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--color-medical-blue)] text-white hover:bg-blue-600 transition-colors flex-shrink-0"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>

          <div className="flex-1">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-[var(--color-medical-blue)] h-2 rounded-full transition-all duration-200"
                style={{ width: `${recordedDuration > 0 ? Math.min(100, (playbackTime / recordedDuration) * 100) : 0}%` }}
              />
            </div>
          </div>

          <span className="text-xs font-mono text-slate-600 w-14 text-right flex-shrink-0">
            {formatTime(playbackTime)} / {formatTime(recordedDuration)}
          </span>
        </div>

        {liveTranscript && (
          <div className="text-xs text-slate-500 italic px-1">
            Preview: &ldquo;{liveTranscript.trim()}&rdquo;
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={resetRecording}
            disabled={isTranscribing}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded ${
              isTranscribing ? 'text-slate-400 bg-slate-100 cursor-not-allowed' : 'text-slate-600 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <RotateCcw size={16} />
            {(t as any).reRecord || 'Re-record'}
          </button>
          <button
            onClick={handleTranscribe}
            disabled={isTranscribing}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm font-bold text-white rounded ${
              isTranscribing ? 'bg-blue-400 cursor-not-allowed' : 'bg-[var(--color-medical-blue)] hover:bg-blue-600'
            }`}
          >
            {isTranscribing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Transcribing audio...
              </>
            ) : (
              <>
                <Check size={16} />
                {(t as any).transcribeSave || 'Transcribe & Save'}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // â”€â”€â”€ Initial state: record button â”€â”€â”€
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

