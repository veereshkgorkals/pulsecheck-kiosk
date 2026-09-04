import { type Language } from '../i18n';

export interface TranscriptionResult {
  originalTranscript: string;
  englishTranslation: string;
  audioBlobUrl: string;
}

const mockTranscripts: Record<Language, { native: string; english: string }> = {
  en: { native: "I've been having this sharp pain in my chest since yesterday morning, and it hurts when I breathe deeply.", english: "I've been having this sharp pain in my chest since yesterday morning, and it hurts when I breathe deeply." },
  es: { native: "Tengo un dolor agudo en el pecho desde ayer por la mañana y me duele al respirar profundo.", english: "I have a sharp pain in my chest since yesterday morning and it hurts when I breathe deeply." },
  hi: { native: "कल सुबह से मेरे सीने में तेज दर्द हो रहा है, और गहरी सांस लेने पर बहुत दर्द होता है।", english: "I have been having severe chest pain since yesterday morning, and it hurts a lot when taking deep breaths." },
  zh: { native: "从昨天早上开始我的胸口就有一阵阵刺痛，深呼吸的时候特别疼。", english: "I have had shooting pains in my chest since yesterday morning, and it hurts especially when I take deep breaths." },
  fr: { native: "J'ai une douleur aiguë dans la poitrine depuis hier matin, et ça fait mal quand je respire profondément.", english: "I have a sharp pain in my chest since yesterday morning, and it hurts when I breathe deeply." }
};

export const transcribeAudioBlob = async (audioBlob: Blob, lang: Language): Promise<TranscriptionResult> => {
  const audioBlobUrl = URL.createObjectURL(audioBlob);

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;

  if (apiKey) {
    try {
      // Stub for real API endpoint if they decide to implement it backend-side or direct
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', lang);

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        return {
          originalTranscript: data.originalTranscript,
          englishTranslation: data.englishTranslation,
          audioBlobUrl
        };
      }
    } catch (e) {
      console.warn("API transcription failed, falling back to simulation.", e);
    }
  }

  // Fallback to simulation to ensure the demo never breaks
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        originalTranscript: mockTranscripts[lang].native,
        englishTranslation: mockTranscripts[lang].english,
        audioBlobUrl
      });
    }, 2000); // simulate network delay
  });
};
