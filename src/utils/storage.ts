import { type ClinicalSummary } from '../services/aiSummarizerService';

const STORAGE_KEY = 'pulsecheck_patients';

export const savePatientSummary = (summary: ClinicalSummary) => {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    const existing: ClinicalSummary[] = existingStr ? JSON.parse(existingStr) : [];
    
    existing.unshift(summary); // Add to beginning of queue
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
  } catch (err) {
    console.error('Failed to save patient summary to local storage', err);
  }
};

export const getPatientQueue = (): ClinicalSummary[] => {
  try {
    const existingStr = localStorage.getItem(STORAGE_KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch (err) {
    console.error('Failed to retrieve patient queue from local storage', err);
    return [];
  }
};

export const clearPatientQueue = () => {
  localStorage.removeItem(STORAGE_KEY);
};
