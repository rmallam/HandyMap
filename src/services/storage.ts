import { Job, HandymanProfile } from '../types';
import { INITIAL_JOBS, DEFAULT_PROFILE } from '../data/mockJobs';

const JOBS_STORAGE_KEY = 'handymap_jobs_v2_point_cook';
const PROFILE_STORAGE_KEY = 'handymap_profile_v2_point_cook';

export function loadJobs(): Job[] {
  try {
    const raw = localStorage.getItem(JOBS_STORAGE_KEY);
    if (!raw) {
      saveJobs(INITIAL_JOBS);
      return INITIAL_JOBS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_JOBS;
  } catch (err) {
    console.error('Failed to load jobs from localStorage:', err);
    return INITIAL_JOBS;
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
  saveJobs(INITIAL_JOBS);
  saveProfile(DEFAULT_PROFILE);
  return INITIAL_JOBS;
}
