import { Job, HandymanProfile } from '../types';
import { INITIAL_JOBS, DEFAULT_PROFILE } from '../data/mockJobs';

const JOBS_STORAGE_KEY = 'handymap_jobs_v3_clean';
const PROFILE_STORAGE_KEY = 'handymap_profile_v3_clean';

export function loadJobs(): Job[] {
  try {
    // Clear old legacy keys with stale mock jobs
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('handymap_jobs_v2_point_cook');
      localStorage.removeItem('handymap_jobs_v1');
    }

    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    if (!raw) {
      saveJobs([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load jobs from localStorage:', err);
    return [];
  }
}

export function saveJobs(jobs: Job[]): void {
  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
  } catch (err) {
    console.error('Failed to save jobs to localStorage:', err);
  }
}

export function loadProfile(): HandymanProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      saveProfile(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load profile from localStorage:', err);
    return DEFAULT_PROFILE;
  }
}

export function saveProfile(profile: HandymanProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save profile to localStorage:', err);
  }
}

export function resetToDemoData(): Job[] {
  saveJobs([]);
  return [];
}
