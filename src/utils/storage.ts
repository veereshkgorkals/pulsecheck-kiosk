import { type ClinicalSummary } from '../services/aiSummarizerService';

const STORAGE_KEY = 'pulsecheck_patients_queue';

export const savePatientSummary = (summary: ClinicalSummary) => {
  try {
    const existing = getPatientQueue();
    // Overwrite if it exists (for updates like escalate/mark as seen)
    const index = existing.findIndex(p => p.id === summary.id);
    if (index >= 0) {
      existing[index] = summary;
    } else {
      existing.unshift(summary); // Add to beginning of queue
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to save patient summary to local storage', err);
  }
};

const getMockPatients = (): ClinicalSummary[] => {
  return [];
};

export const getPatientQueue = (): ClinicalSummary[] => {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    if (existingStr) {
      return JSON.parse(existingStr);
    } else {
      // Pre-populate realistic mock patients if storage is empty
      const mocks = getMockPatients();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mocks));
      return mocks;
    }
  } catch (err) {
    console.error('Failed to retrieve patient queue from local storage', err);
    return [];
  }
};

export const clearPatientQueue = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export interface EmergencyAlert {
  id: string;
  timestamp: string;
  source: string;
  status: 'active' | 'acknowledged' | 'cancelled';
}

const ALERTS_KEY = 'pulsecheck_emergency_alerts';

export const getEmergencyAlerts = (): EmergencyAlert[] => {
  try {
    const data = localStorage.getItem(ALERTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to parse emergency alerts', err);
    return [];
  }
};

export const saveEmergencyAlert = (alert: EmergencyAlert) => {
  const alerts = getEmergencyAlerts();
  const index = alerts.findIndex(a => a.id === alert.id);
  if (index >= 0) {
    alerts[index] = alert;
  } else {
    alerts.push(alert);
  }
  localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
};

export const updateEmergencyAlertStatus = (id: string, status: EmergencyAlert['status']) => {
  const alerts = getEmergencyAlerts();
  const alert = alerts.find(a => a.id === id);
  if (alert) {
    alert.status = status;
    localStorage.setItem(ALERTS_KEY, JSON.stringify(alerts));
  }
};
