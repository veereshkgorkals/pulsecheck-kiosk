import fs from 'fs';

let content = fs.readFileSync('src/i18n.ts', 'utf-8');

const keys = {
  en: `
    recordSymptomsVoice: 'Record Symptoms by Voice',
    recording: 'Recording...',
    listening: 'Listening...',
    reRecord: 'Re-record',
    transcribeSave: 'Transcribe & Save',
    originalAudio: 'Original Audio',
    englishTranslation: 'English Translation',
    originalTranscript: 'Original Transcript',`,
  es: `
    recordSymptomsVoice: 'Grabar síntomas por voz',
    recording: 'Grabando...',
    listening: 'Escuchando...',
    reRecord: 'Volver a grabar',
    transcribeSave: 'Transcribir y Guardar',
    originalAudio: 'Audio Original',
    englishTranslation: 'Traducción al Inglés',
    originalTranscript: 'Transcripción Original',`,
  hi: `
    recordSymptomsVoice: 'आवाज़ से लक्षण रिकॉर्ड करें',
    recording: 'रिकॉर्डिंग...',
    listening: 'सुन रहा है...',
    reRecord: 'फिर से रिकॉर्ड करें',
    transcribeSave: 'ट्रांसक्राइब करें और सहेजें',
    originalAudio: 'मूल ऑडियो',
    englishTranslation: 'अंग्रेजी अनुवाद',
    originalTranscript: 'मूल ट्रांसक्रिप्ट',`,
  zh: `
    recordSymptomsVoice: '语音录制症状',
    recording: '录音中...',
    listening: '聆听中...',
    reRecord: '重新录制',
    transcribeSave: '转录并保存',
    originalAudio: '原声音频',
    englishTranslation: '英文翻译',
    originalTranscript: '原始录音',`,
  fr: `
    recordSymptomsVoice: 'Enregistrer les symptômes par la voix',
    recording: 'Enregistrement...',
    listening: 'Écoute...',
    reRecord: 'Réenregistrer',
    transcribeSave: 'Transcrire et Sauvegarder',
    originalAudio: 'Audio Original',
    englishTranslation: 'Traduction Anglaise',
    originalTranscript: 'Transcription Originale',`
};

const langs = ['en', 'es', 'hi', 'zh', 'fr'];
let matches = 0;
content = content.replace(/(\s+requiredErr:\s*'.*?',?)/g, (match) => {
  const lang = langs[matches];
  matches++;
  return keys[lang] + match;
});

fs.writeFileSync('src/i18n.ts', content);
console.log('i18n updated successfully.');
