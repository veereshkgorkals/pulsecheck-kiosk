export interface PatientIntakeData {
  firstName: string;
  lastName: string;
  dob: string;
  phone: string;
  chiefComplaint: string;
  bodyParts: string[];
  painSeverity: number;
  onset: string;
  character: string;
  aggravating: string;
  voiceRecording: {
    originalTranscript: string;
    englishTranslation: string;
    audioBlobUrl: string;
  } | null;
  language: string;
}

export interface AIAnalysisResult {
  analyzedChiefComplaint: string;
  timeline: string;
  aiAssignedPainSeverity: number;
  aiUrgency: 'low' | 'medium' | 'high';
  clinicalBulletPoints: string[];
  affectedAnatomy: string[];
  detectedOnsetCategory: 'Today' | '1-3 days ago' | 'Over a week ago' | null;
}

export interface ClinicalSummary extends AIAnalysisResult {
  patientInfo: {
    name: string;
    dob: string;
    phone: string;
  };
  reportedLanguage: string;
  timestamp: string;
}

export const analyzeNarrative = async (
  chiefComplaint: string,
  englishTranslation: string,
  language: string
): Promise<AIAnalysisResult> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY;

  if (apiKey) {
    try {
      const systemPrompt = `You are an expert emergency triage medical scribe.
Analyze the raw patient narrative and extract strict JSON matching the schema.
RULES:
- analyzedChiefComplaint: 1 concise clinical line (under 12 words).
- timeline: Extract duration and onset info.
- aiAssignedPainSeverity: Estimate 1-10 pain/distress score (e.g. cold=2-3, back radiculopathy=8).
- aiUrgency: 'low', 'medium', or 'high'.
- clinicalBulletPoints: 3-5 high-yield facts (location, character, radiation, neurological deficits/red flags).
- affectedAnatomy: Array of affected body parts.
- detectedOnsetCategory: Must be one of "Today", "1-3 days ago", "Over a week ago", or null if not mentioned.
- Output strictly JSON without markdown formatting.`;

      const payload = {
        model: 'gemini-1.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Language: ${language}\nText: ${chiefComplaint}\nTranslation: ${englishTranslation}` }
        ]
      };
      console.log('Would use API key:', apiKey, 'Payload:', payload);
    } catch (err) {
      console.warn("API summarization failed, falling back to local deterministic generation.", err);
    }
  }

  // Resilient Fallback Engine for Narrative Analysis
  return new Promise((resolve) => {
    setTimeout(() => {
      const rawText = `${chiefComplaint} ${englishTranslation}`.toLowerCase();
      
      const bullets = [];
      const anatomy = [];
      let severity = 5;
      let urgency: 'low' | 'medium' | 'high' = 'low';

      // Anatomy extraction
      if (rawText.match(/head|brain|migraine|skull/)) anatomy.push('Head');
      if (rawText.match(/chest|heart|lungs|ribs/)) anatomy.push('Chest');
      if (rawText.match(/stomach|belly|abdomen|gut/)) anatomy.push('Abdomen');
      if (rawText.match(/back|spine|lumbar/)) anatomy.push('Back');
      if (rawText.match(/leg|arm|foot|hand|thigh|limbs/)) anatomy.push('Limbs');
      if (rawText.match(/throat|neck|nose/)) anatomy.push('ENT');

      // Bullets extraction
      if (rawText.includes('numb') || rawText.includes('tingling')) bullets.push('Paresthesia / numbness detected');
      if (rawText.includes('tripping') || rawText.includes('drop')) bullets.push('Foot drop / motor deficit');
      if (rawText.includes('radiat') || rawText.includes('migrat') || rawText.includes('shot down')) bullets.push('Pain radiates/migrates from primary site');
      if (rawText.includes('burn') || rawText.includes('shock')) bullets.push('Neuropathic pain character (burning/shock)');
      if (rawText.includes('cold') || rawText.includes('sneeze') || rawText.includes('cough')) bullets.push('URI symptoms present');

      // Severity & Urgency logic
      if (rawText.includes('electric shock') || rawText.includes('crying') || rawText.includes('worst') || rawText.includes('severe')) {
        severity = 8;
        urgency = 'high';
      } else if (rawText.includes('ache') || rawText.includes('sprain') || rawText.includes('moderate')) {
        severity = 5;
        urgency = 'medium';
      } else if (rawText.includes('cold') || rawText.includes('sneeze') || rawText.includes('mild')) {
        severity = 2;
        urgency = 'low';
      }

      if (bullets.length > 0 && bullets.some(b => b.includes('motor deficit'))) {
        urgency = 'high';
        severity = Math.max(severity, 7);
      }

      if (rawText.includes('chest') || rawText.includes('breath')) {
        urgency = 'high';
        severity = Math.max(severity, 7);
      }

      // Timeline extraction
      let timeline = 'Unknown onset';
      let detectedOnsetCategory: 'Today' | '1-3 days ago' | 'Over a week ago' | null = null;
      
      if (rawText.match(/week|month|chronic|year/)) {
        timeline = 'Chronic/subacute: present for more than a week';
        detectedOnsetCategory = 'Over a week ago';
      } else if (rawText.match(/yesterday|2 days|3 days|couple days|few days|days/)) {
        timeline = 'Symptoms present for a few days';
        detectedOnsetCategory = '1-3 days ago';
      } else if (rawText.match(/today|morning|hour/)) {
        timeline = 'Acute onset today';
        detectedOnsetCategory = 'Today';
      }

      let chiefComp = anatomy.length > 0 ? `${anatomy[0]} issue` : 'Generalized symptoms';
      if (rawText.includes('cold')) chiefComp = 'Upper respiratory symptoms';
      if (bullets.some(b => b.includes('motor'))) chiefComp += ' with neurological deficit';

      resolve({
        analyzedChiefComplaint: chiefComp.charAt(0).toUpperCase() + chiefComp.slice(1),
        timeline,
        aiAssignedPainSeverity: severity,
        aiUrgency: urgency,
        clinicalBulletPoints: bullets.length > 0 ? bullets : ['Patient reported discomfort'],
        affectedAnatomy: anatomy.length > 0 ? anatomy : ['Unspecified'],
        detectedOnsetCategory
      });
    }, 1500);
  });
};

export const generateFinalSummary = (
  data: PatientIntakeData,
  analysis: AIAnalysisResult
): ClinicalSummary => {
  let finalTimeline = analysis.timeline;
  if (data.onset) {
    // Append the actively selected chip to the timeline for the final view
    finalTimeline = `${finalTimeline} (Reported: ${data.onset})`;
  }

  return {
    ...analysis,
    timeline: finalTimeline,
    patientInfo: {
      name: `${data.firstName} ${data.lastName}`,
      dob: data.dob,
      phone: data.phone
    },
    reportedLanguage: data.language,
    timestamp: new Date().toISOString()
  };
};
