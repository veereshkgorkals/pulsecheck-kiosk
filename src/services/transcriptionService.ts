import { type Language } from '../i18n';

export interface TranscriptionResult {
  originalTranscript: string;
  englishTranslation: string;
  audioBlobUrl: string;
}


export const transcribeAudioBlob = async (audioBlob: Blob, lang?: Language, liveTranscript?: string): Promise<TranscriptionResult> => {
  const audioBlobUrl = URL.createObjectURL(audioBlob);
  const finalNative = (liveTranscript && liveTranscript.trim().length > 0) ? liveTranscript.trim() : '';

  // Step A: If browser SpeechRecognition produced a live transcript, use it directly.
  if (finalNative) {
    console.log('[PulseCheck] Using browser SpeechRecognition transcript:', finalNative);
    return {
      originalTranscript: finalNative,
      englishTranslation: finalNative,
      audioBlobUrl
    };
  }

  // Step B: No live transcript (common on mobile). Use Gemini API to transcribe audio.
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  console.log('[PulseCheck] No live transcript available. Attempting Gemini API fallback.');
  console.log('[PulseCheck] API Key present:', !!apiKey, '| Blob type:', audioBlob.type, '| Blob size:', audioBlob.size);

  if (!apiKey) {
    console.error('[PulseCheck] VITE_GEMINI_API_KEY is not set in the build environment!');
    throw new Error('API_KEY_MISSING');
  }

  // Convert audio blob to base64
  let base64Audio = '';
  try {
    base64Audio = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        if (!base64 || base64.length < 100) {
          reject(new Error('Base64 conversion produced empty or too-small output'));
          return;
        }
        resolve(base64);
      };
      reader.onerror = () => reject(new Error('FileReader failed to read audio blob'));
      reader.readAsDataURL(audioBlob);
    });
  } catch (e) {
    console.error('[PulseCheck] Base64 conversion failed:', e);
    throw new Error('AUDIO_CONVERSION_FAILED');
  }

  console.log('[PulseCheck] Base64 audio length:', base64Audio.length);

  const audioMime = audioBlob.type.split(';')[0] || 'audio/webm';

  const prompt = `You are a medical transcription assistant. Transcribe the patient's spoken words in this audio recording verbatim. Language context: ${lang || 'en'}.

Rules:
- If the patient spoke in a non-English language, provide BOTH the original transcript AND an English translation.
- If the audio contains only silence, background noise, or unintelligible sounds, respond with exactly: [NO_SPEECH_DETECTED]
- Otherwise respond with ONLY a JSON object in this exact format (no markdown, no code fences):
{"originalTranscript": "exact words spoken", "englishTranslation": "English translation of the words"}`;

  // Try multiple model endpoints in case one is deprecated
  const models = [
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
  ];

  let lastError = '';

  for (const model of models) {
    try {
      console.log(`[PulseCheck] Trying model: ${model}`);

      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: audioMime,
                data: base64Audio
              }
            }
          ]
        }]
      };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody)
        }
      );

      if (!res.ok) {
        const errBody = await res.text();
        console.warn(`[PulseCheck] Model ${model} returned ${res.status}:`, errBody);
        lastError = `API returned ${res.status}: ${errBody.substring(0, 200)}`;
        continue; // Try next model
      }

      const data = await res.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      console.log('[PulseCheck] Gemini response:', textResponse.substring(0, 300));

      // Check for no speech
      if (textResponse.includes('[NO_SPEECH_DETECTED]')) {
        throw new Error('NO_SPEECH');
      }

      // Parse JSON from response
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        if (parsed.originalTranscript === '[NO_SPEECH_DETECTED]') {
          throw new Error('NO_SPEECH');
        }

        const originalTranscript = parsed.originalTranscript || '';
        const englishTranslation = parsed.englishTranslation || originalTranscript;

        if (originalTranscript.length > 0) {
          console.log('[PulseCheck] Transcription successful via', model);
          return {
            originalTranscript,
            englishTranslation,
            audioBlobUrl
          };
        }
      }

      // If we got a response but couldn't parse it, use the raw text as transcript
      if (textResponse.length > 5 && !textResponse.includes('[NO_SPEECH_DETECTED]')) {
        console.log('[PulseCheck] Using raw Gemini text as transcript');
        return {
          originalTranscript: textResponse.trim(),
          englishTranslation: textResponse.trim(),
          audioBlobUrl
        };
      }

      lastError = 'Could not parse transcription from API response';

    } catch (e: any) {
      if (e.message === 'NO_SPEECH') {
        throw e;
      }
      console.warn(`[PulseCheck] Model ${model} failed:`, e.message);
      lastError = e.message;
      continue; // Try next model
    }
  }

  // All models failed — throw a visible error instead of silently returning placeholder
  console.error('[PulseCheck] All Gemini models failed. Last error:', lastError);
  throw new Error(`TRANSCRIPTION_FAILED: ${lastError}`);
};
