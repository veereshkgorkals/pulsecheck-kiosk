export type Language = 'en' | 'es' | 'hi' | 'zh' | 'fr';

export const languageNames: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  hi: 'हिन्दी',
  zh: '中文',
  fr: 'Français'
};

export const languageCodes: Record<Language, string> = {
  en: 'en-US',
  es: 'es-ES',
  hi: 'hi-IN',
  zh: 'zh-CN',
  fr: 'fr-FR'
};

export const translations = {
  en: {
    emergencyHeader: 'If you are experiencing a life-threatening emergency, stop and alert staff immediately.',
    symptomsPrompt: 'Do you have any of the following symptoms?',
    symptoms: [
      'Chest pain or pressure',
      'Severe shortness of breath',
      'Sudden weakness or numbness (especially on one side)',
      'Heavy, uncontrolled bleeding'
    ],
    btnEmergency: 'I Need Immediate Help',
    btnContinue: 'Continue to Normal Intake',
    pleaseWait: 'PLEASE WAIT',
    staffAlerted: 'Medical staff have been alerted and are on their way to assist you.',
    playAudio: 'Play Audio Alert',
    cancel: 'Cancel and Return',
    welcome: 'Welcome to PulseCheck',
    successMsg: 'Primary Intake Step successfully reached.',
    backToStart: 'Back to Start',
  },
  es: {
    emergencyHeader: 'Si experimenta una emergencia que pone en peligro su vida, deténgase y avise al personal de inmediato.',
    symptomsPrompt: '¿Tiene alguno de los siguientes síntomas?',
    symptoms: [
      'Dolor o presión en el pecho',
      'Falta de aire severa',
      'Debilidad o entumecimiento repentino (especialmente en un lado)',
      'Sangrado intenso y no controlado'
    ],
    btnEmergency: 'Necesito Ayuda Inmediata',
    btnContinue: 'Continuar a la Admisión Normal',
    pleaseWait: 'POR FAVOR ESPERE',
    staffAlerted: 'El personal médico ha sido alertado y está en camino para ayudarle.',
    playAudio: 'Reproducir Alerta de Audio',
    cancel: 'Cancelar y Volver',
    welcome: 'Bienvenido a PulseCheck',
    successMsg: 'Paso de admisión primaria alcanzado con éxito.',
    backToStart: 'Volver al Inicio',
  },
  hi: {
    emergencyHeader: 'यदि आप जीवन-खतरे वाली आपात स्थिति का अनुभव कर रहे हैं, तो रुकें और तुरंत कर्मचारियों को सचेत करें।',
    symptomsPrompt: 'क्या आपको निम्नलिखित में से कोई लक्षण है?',
    symptoms: [
      'सीने में दर्द या दबाव',
      'गंभीर सांस की तकलीफ',
      'अचानक कमजोरी या सुन्नपन (विशेषकर एक तरफ)',
      'भारी, अनियंत्रित रक्तस्राव'
    ],
    btnEmergency: 'मुझे तत्काल मदद चाहिए',
    btnContinue: 'सामान्य प्रवेश के लिए जारी रखें',
    pleaseWait: 'कृपया प्रतीक्षा करें',
    staffAlerted: 'चिकित्सा कर्मचारियों को सतर्क कर दिया गया है और वे आपकी सहायता के लिए आ रहे हैं।',
    playAudio: 'ऑडियो अलर्ट चलाएं',
    cancel: 'रद्द करें और वापस जाएँ',
    welcome: 'PulseCheck में आपका स्वागत है',
    successMsg: 'प्राथमिक प्रवेश चरण सफलतापूर्वक पहुँच गया।',
    backToStart: 'शुरुआत पर वापस जाएँ',
  },
  zh: {
    emergencyHeader: '如果您正在经历危及生命的紧急情况，请停止并立即联系工作人员。',
    symptomsPrompt: '您是否有以下任何症状？',
    symptoms: [
      '胸痛或压迫感',
      '严重呼吸急促',
      '突然虚弱或麻木（尤其是在一侧）',
      '严重、不受控制的出血'
    ],
    btnEmergency: '我需要立即帮助',
    btnContinue: '继续正常入院',
    pleaseWait: '请稍候',
    staffAlerted: '医务人员已接到通知，正在赶来协助您。',
    playAudio: '播放音频警报',
    cancel: '取消并返回',
    welcome: '欢迎使用 PulseCheck',
    successMsg: '已成功到达初级摄入步骤。',
    backToStart: '回到开始',
  },
  fr: {
    emergencyHeader: 'Si vous rencontrez une urgence potentiellement mortelle, arrêtez-vous et alertez immédiatement le personnel.',
    symptomsPrompt: 'Avez-vous l\'un des symptômes suivants ?',
    symptoms: [
      'Douleur ou pression thoracique',
      'Essoufflement sévère',
      'Faiblesse ou engourdissement soudain (surtout d\'un côté)',
      'Saignement abondant et incontrôlé'
    ],
    btnEmergency: 'J\'ai Besoin d\'Aide Immédiate',
    btnContinue: 'Continuer vers l\'Admission Normale',
    pleaseWait: 'VEUILLEZ PATIENTER',
    staffAlerted: 'Le personnel médical a été alerté et est en route pour vous aider.',
    playAudio: 'Jouer l\'Alerte Audio',
    cancel: 'Annuler et Retourner',
    welcome: 'Bienvenue sur PulseCheck',
    successMsg: 'Étape d\'admission principale atteinte avec succès.',
    backToStart: 'Retour au Début',
  }
};
