import { type Language } from '../i18n';

export interface TranscriptionResult {
  originalTranscript: string;
  englishTranslation: string;
  audioBlobUrl: string;
}


export const transcribeAudioBlob = async (audioBlob: Blob, lang?: Language, liveTranscript?: string): Promise<TranscriptionResult> => {
  const audioBlobUrl = URL.createObjectURL(audioBlob);
  const finalNative = (liveTranscript && liveTranscript.trim().length > 0) ? liveTranscript.trim() : '';

  // Step A: If live transcript exists, use it.
  if (finalNative) {
    return {
      originalTranscript: finalNative,
      englishTranslation: finalNative, // In a real app we'd translate this, but keeping it simple
      audioBlobUrl
    };
  }

  // Step B: Mobile Fallback via Gemini API
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (apiKey) {
    try {
      console.log("Audio Blob Type:", audioBlob.type, "Size:", audioBlob.size);
      console.log("Gemini API Key exists:", !!import.meta.env.VITE_GEMINI_API_KEY);

      let base64Audio = '';
      try {
        const { blobToBase64 } = await import('../utils/audioUtils');
        base64Audio = await blobToBase64(audioBlob);
      } catch (e) {
        // inline fallback if utils import fails
        base64Audio = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(audioBlob);
        });
      }

      const requestBody = {
        contents: [{
          parts: [
            { text: `Transcribe the patient's spoken words in this audio verbatim (Language context: ${lang || 'Unknown'}). If they spoke in a language other than English, provide the original transcript and the English translation. If the audio is pure silence or unintelligible noise, reply with: [NO_SPEECH_DETECTED]. Format as JSON: {"originalTranscript": "...", "englishTranslation": "..."}` },
            {
              inlineData: {
                mimeType: audioBlob.type.split(';')[0] || "audio/webm",
                data: base64Audio
              }
            }
          ]
        }]
      };

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (res.ok) {
        const data = await res.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (textResponse.includes('[NO_SPEECH_DETECTED]')) {
          throw new Error('NO_SPEECH');
        }
        try {
          const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.originalTranscript === '[NO_SPEECH_DETECTED]') {
               throw new Error('NO_SPEECH');
            }
            return {
              originalTranscript: parsed.originalTranscript || '[Audio Recording Attached - Direct Physician Review Required]',
              englishTranslation: parsed.englishTranslation || '[Audio Recording Attached - Direct Physician Review Required]',
              audioBlobUrl
            };
          }
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message === 'NO_SPEECH') throw parseError;
          console.warn("Failed to parse Gemini JSON response", parseError);
        }
      } else {
        const errText = await res.text();
        console.error("Gemini Audio API Error:", errText);
      }
    } catch (e: any) {
      if (e.message === 'NO_SPEECH') {
        throw new Error('NO_SPEECH');
      }
      console.error("Gemini API fallback failed", e);
    }
  }

  // If API key is unavailable or fails, DO NOT block the user.
  return {
    originalTranscript: '[Audio Recording Attached - Direct Physician Review Required]',
    englishTranslation: '[Audio Recording Attached - Direct Physician Review Required]',
    audioBlobUrl
  };
};
