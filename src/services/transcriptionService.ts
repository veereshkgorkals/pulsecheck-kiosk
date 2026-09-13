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
      const { blobToBase64 } = await import('../utils/audioUtils');
      const base64Audio = await blobToBase64(audioBlob);

      const requestBody = {
        contents: [{
          parts: [
            { text: `Transcribe the patient's spoken words verbatim in the language spoken (Language: ${lang || 'Unknown'}), followed by an accurate English translation. Format as JSON: {"originalTranscript": "...", "englishTranslation": "..."}` },
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
        try {
          const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
              originalTranscript: parsed.originalTranscript || '[Audio Recording Attached - Direct Physician Review Required]',
              englishTranslation: parsed.englishTranslation || '[Audio Recording Attached - Direct Physician Review Required]',
              audioBlobUrl
            };
          }
        } catch (parseError) {
          console.warn("Failed to parse Gemini JSON response", parseError);
        }
      } else {
        const errText = await res.text();
        console.error("Gemini Audio API Error:", errText);
      }
    } catch (e) {
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
