import React, { useState, useEffect, useRef } from 'react';
import { Job, JobStatus, OptimizedRoute, HandymanProfile, RouteFilterType } from './types';
import { calculateDistanceKm, DateFilterType, generateNextJobNumber } from './utils/helpers';
import { loadJobs, saveJobs, loadProfile, saveProfile, resetToDemoData } from './services/storage';
import { INITIAL_JOBS, DEFAULT_PROFILE } from './data/mockJobs';
import {
  isSupabaseConfigured,
  supabase,
  fetchJobsFromSupabase,
  upsertJobInSupabase,
  batchUpsertJobsInSupabase,
  deleteJobFromSupabase,
  seedJobsToSupabaseIfEmpty,
  getCurrentSession,
  signOutUser,
  fetchUserProfile,
  upsertUserProfile
} from './services/supabase';
import { calculateOptimizedRoute } from './services/routeOptimizer';
import {
  generateReminders,
  loadSnoozedReminderIds,
  saveSnoozedReminderIds,
  checkAndSendMorningDailyDigest
} from './services/reminderEngine';
import { harvestContactsFromJobs } from './services/contactDirectory';
import {
  initNativeDevice,
  getNativeCurrentPosition,
  triggerHapticFeedback
} from './services/nativeMobile';
import { Plus, X, RefreshCw } from 'lucide-react';
import { Header } from './components/Navigation/Header';
import { BottomNav, AppNavTab } from './components/Navigation/BottomNav';
import { MapView } from './components/Map/MapView';
import { DayPlanView } from './components/DayPlan/DayPlanView';
import { JobList } from './components/Jobs/JobList';
import { ContactsView } from './components/Contacts/ContactsView';
import { StatsOverview } from './components/Dashboard/StatsOverview';
import { JobDetailModal } from './components/Jobs/JobDetailModal';
import { JobFormModal } from './components/Jobs/JobFormModal';
import { ImportJobsModal } from './components/Jobs/ImportJobsModal';
import { RemindersDrawer } from './components/Reminders/RemindersDrawer';
import { ProfileModal } from './components/Profile/ProfileModal';
import { AuthModal } from './components/Auth/AuthModal';
import { ParsedWorkOrder } from './services/workOrderParser';

export function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<HandymanProfile>(loadProfile());
  const [currentLocation, setCurrentLocation] = useState<[number, number]>(profile.baseCoordinates);
  const [isUsingGPS, setIsUsingGPS] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  
  // Authentication & Cloud Sync State
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDismissedAuthBanner, setIsDismissedAuthBanner] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Navigation & Active View state
  const [activeTab, setActiveTab] = useState<AppNavTab>('map');
  // Shared Operational Filter state across Map & Job List
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | 'all' | 'all_total'>('all');
  const [selectedDate, setSelectedDate] = useState<DateFilterType>('all');
  const [customDateStart, setCustomDateStart] = useState<string>('');
  const [customDateEnd, setCustomDateEnd] = useState<string>('');
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedSuburb, setSelectedSuburb] = useState<string>('all');

  const handleSelectDateRange = (startDate: string, endDate: string) => {
    setCustomDateStart(startDate);
    setCustomDateEnd(endDate);
    setSelectedDate('date_range');
  };
  
  // Selection and Route state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeRoute, setActiveRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Reminders & Follow-ups state
  const [snoozedReminderIds, setSnoozedReminderIds] = useState<string[]>(loadSnoozedReminderIds());
  const [isRemindersDrawerOpen, setIsRemindersDrawerOpen] = useState(false);

  // Modals
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [initialWorkOrder, setInitialWorkOrder] = useState<{ parsed: ParsedWorkOrder; filename: string } | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleImportWorkOrderFromPdf = (parsed: ParsedWorkOrder, filename: string) => {
    setInitialWorkOrder({ parsed, filename });
    setIsNewJobOpen(true);
  };

  // Load user-specific jobs and profile from Supabase
  const loadUserData = async (userId: string, userEmail?: string | null) => {
    setCurrentUserId(userId);
    currentUserIdRef.current = userId;
    if (userEmail) setCurrentUserEmail(userEmail);

    // 1. Fetch user's isolated profile
    const cloudProfile = await fetchUserProfile(userId);
    if (cloudProfile) {
      setProfile(cloudProfile);
      saveProfile(cloudProfile);
    } else {
      const currentLocal = loadProfile();
      await upsertUserProfile(userId, currentLocal);
    }

    // 2. Fetch user's isolated jobs
    const cloudJobs = await fetchJobsFromSupabase(userId);
    if (cloudJobs !== null) {
      if (cloudJobs.length === 0) {
        // If Supabase has no jobs for this user yet, but browser has existing local jobs, migrate them to cloud!
        const localJobs = loadJobs();
        if (localJobs.length > 0) {
          await batchUpsertJobsInSupabase(localJobs, userId);
          setJobs(localJobs);
          return;
        }
      }
      setJobs(cloudJobs);
      saveJobs(cloudJobs);
    }
  };

  // Manual 1-tap Cloud Sync
  const handleManualSync = async () => {
    triggerHapticFeedback('light');
    const uid = currentUserIdRef.current || currentUserId;
    if (!isSupabaseConfigured || !uid) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSyncing(true);
    try {
      const cloudJobs = await fetchJobsFromSupabase(uid);
      if (cloudJobs !== null) {
        setJobs(cloudJobs);
        saveJobs(cloudJobs);
      }
      const cloudProfile = await fetchUserProfile(uid);
      if (cloudProfile) {
        setProfile(cloudProfile);
        saveProfile(cloudProfile);
      }
      triggerHapticFeedback('success');
    } catch (err) {
      console.warn('Manual sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Initialize Native Mobile features, GPS location lock, and Auth session
  useEffect(() => {
    // 1. Initialize native status bar & Android hardware back button
    initNativeDevice(() => {
      // Android back button: close modals first if open
      if (isJobDetailOpen) setIsJobDetailOpen(false);
      else if (isNewJobOpen) setIsNewJobOpen(false);
      else if (isRemindersDrawerOpen) setIsRemindersDrawerOpen(false);
      else if (isProfileModalOpen) setIsProfileModalOpen(false);
      else if (activeTab !== 'map') setActiveTab('map');
    });

    // 2. High accuracy GPS lock (Native hardware GPS with web fallback)
    getNativeCurrentPosition().then(coords => {
      if (coords) {
        setCurrentLocation(coords);
        setIsUsingGPS(true);
      }
    });

    // 3. Initialize Auth state & Supabase data sync
    async function initAuthAndData() {
      if (isSupabaseConfigured && supabase) {
        // Check existing active session or URL token
        const session = await getCurrentSession();
        if (session?.user) {
          await loadUserData(session.user.id, session.user.email);
        } else {
          // Unauthenticated: load local browser sandbox
          const localJobs = loadJobs();
          setJobs(localJobs);
          const localProfile = loadProfile();
          setProfile(localProfile);
        }

        // Realtime Postgres Changes Subscription (Uses currentUserIdRef to avoid stale closure)
        const channel = supabase
          .channel('public:jobs')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'jobs' },
            async (payload: any) => {
              const uid = currentUserIdRef.current;
              // Refresh if the change belongs to the current user
              if (uid && (!payload.new?.user_id || payload.new.user_id === uid || payload.old?.user_id === uid)) {
                const refreshed = await fetchJobsFromSupabase(uid);
                if (refreshed) {
                  setJobs(refreshed);
                  saveJobs(refreshed);
                }
              }
            }
          )
          .subscribe();

        // Auto-refresh when user switches back to browser tab (Essential for mobile browsers)
        const handleVisibilityOrFocus = async () => {
          if (document.visibilityState === 'visible') {
            const uid = currentUserIdRef.current;
            if (uid) {
              const refreshed = await fetchJobsFromSupabase(uid);
              if (refreshed) {
                setJobs(refreshed);
                saveJobs(refreshed);
              }
            } else {
              const sess = await getCurrentSession();
              if (sess?.user) {
                await loadUserData(sess.user.id, sess.user.email);
              }
            }
          }
        };

        window.addEventListener('visibilitychange', handleVisibilityOrFocus);
        window.addEventListener('focus', handleVisibilityOrFocus);

        // Background polling every 20 seconds while tab is active for instant laptop/phone parity
        const pollTimer = setInterval(() => {
          if (document.visibilityState === 'visible' && currentUserIdRef.current) {
            fetchJobsFromSupabase(currentUserIdRef.current).then(refreshed => {
              if (refreshed) {
                setJobs(refreshed);
                saveJobs(refreshed);
              }
            });
          }
        }, 20000);

        // Auth state listener (Handles direct password login, OTP code, or Magic Link redirect clicks)
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (currentSession?.user) {
            await loadUserData(currentSession.user.id, currentSession.user.email);
            setIsAuthModalOpen(false);

            // Clean URL hash if magic link / auth token was present in URL
            if (window.location.hash || window.location.search.includes('code=')) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          } else if (event === 'SIGNED_OUT') {
            setCurrentUserId(null);
            currentUserIdRef.current = null;
            setCurrentUserEmail(null);
            const localJobs = loadJobs();
            setJobs(localJobs);
          }
        });

        return () => {
          supabase.removeChannel(channel);
          authListener.subscription.unsubscribe();
          window.removeEventListener('visibilitychange', handleVisibilityOrFocus);
          window.removeEventListener('focus', handleVisibilityOrFocus);
          clearInterval(pollTimer);
        };
      } else {
        // Offline / Local storage mode
        const loadedJobs = loadJobs();
        setJobs(loadedJobs);
        const loadedProfile = loadProfile();
        setProfile(loadedProfile);
      }
    }

    initAuthAndData();
  }, []);

  // Check and dispatch single consolidated Morning Daily Digest for today's scheduled jobs
  // and harvest existing contacts into the directory rolodex
  useEffect(() => {
    if (jobs.length > 0) {
      checkAndSendMorningDailyDigest(jobs, profile);
      harvestContactsFromJobs(jobs);
    }
  }, [jobs, profile]);

  // Update jobs state and localStorage
  const handleUpdateJobsList = (newJobs: Job[]) => {
    setJobs(newJobs);
    saveJobs(newJobs);
  };

  const handleUpdateSingleJob = async (updatedJob: Job) => {
    const nextJobs = jobs.map(j => (j.id === updatedJob.id ? updatedJob : j));
    handleUpdateJobsList(nextJobs);
    setSelectedJob(updatedJob);

    // Sync to Supabase strictly scoped to current user
    if (isSupabaseConfigured && currentUserId) {
      upsertJobInSupabase(updatedJob, currentUserId);
    }

    // If active route contains this job, update its reference
    if (activeRoute) {
      const nextStops = activeRoute.stops.map(stop =>
        stop.job.id === updatedJob.id ? { ...stop, job: updatedJob } : stop
      );
      setActiveRoute({ ...activeRoute, stops: nextStops });
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    const nextJobs = jobs.filter(j => j.id !== jobId);
    handleUpdateJobsList(nextJobs);
    if (selectedJob?.id === jobId) {
      setSelectedJob(null);
      setIsJobDetailOpen(false);
    }
    if (isSupabaseConfigured && currentUserId) {
      deleteJobFromSupabase(jobId, currentUserId);
    }
    if (activeRoute) {
      const nextStops = activeRoute.stops.filter(stop => stop.job.id !== jobId);
      setActiveRoute({ ...activeRoute, stops: nextStops });
    }
  };

  const handleCreateNewJob = async (newJob: Job) => {
    const nextJobs = [newJob, ...jobs];
    handleUpdateJobsList(nextJobs);
    setSelectedJob(newJob);
    setActiveTab('map');
    if (isSupabaseConfigured && currentUserId) {
      upsertJobInSupabase(newJob, currentUserId);
    }
  };

  const handleDuplicateJob = async (sourceJob: Job) => {
    const now = new Date();
    const nextJobNumber = generateNextJobNumber(jobs);
    const newId = `job-${Date.now()}`;

    const duplicatedJob: Job = {
      ...sourceJob,
      id: newId,
      jobNumber: nextJobNumber,
      quoteNumber: undefined,
      invoiceNumber: undefined,
      title: `${sourceJob.title} (Copy)`,
      status: 'quote_requested',
      appointmentTime: undefined,
      quoteRequestedDate: now.toISOString(),
      photos: [],
      timeLogs: [],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    const nextJobs = [duplicatedJob, ...jobs];
    handleUpdateJobsList(nextJobs);
    setSelectedJob(duplicatedJob);
    setIsJobDetailOpen(true);

    if (isSupabaseConfigured && currentUserId) {
      upsertJobInSupabase(duplicatedJob, currentUserId);
    }

    triggerHapticFeedback('success');
    return duplicatedJob;
  };

  const handleBatchImportJobs = async (importedJobs: Job[]) => {
    // Non-destructive merge by ID or Job Number to allow re-syncing from bookkeeping exports
    const mergedJobs = [...jobs];
    importedJobs.forEach(imp => {
      const matchIndex = mergedJobs.findIndex(
        j => j.id === imp.id || (imp.jobNumber && j.jobNumber.toLowerCase() === imp.jobNumber.toLowerCase() && !imp.jobNumber.startsWith('JOB-'))
      );
      if (matchIndex >= 0) {
        mergedJobs[matchIndex] = { ...mergedJobs[matchIndex], ...imp, id: mergedJobs[matchIndex].id };
      } else {
        mergedJobs.unshift(imp);
      }
    });

    handleUpdateJobsList(mergedJobs);
    setActiveTab('jobs');
    if (isSupabaseConfigured && currentUserId) {
      await batchUpsertJobsInSupabase(importedJobs, currentUserId);
    }
  };

  // Optimize multi-stop route with Suburb clustering, Closest-to-me, and Real Estate priority
  const handleGenerateRoute = async (
    filterType: RouteFilterType = 'quotes_only',
    targetSuburb: string = 'all',
    prioritizeAgency: boolean = true
  ) => {
    setIsOptimizing(true);
    try {
      let targetJobs: Job[] = [];

      if (filterType === 'quotes_only') {
        targetJobs = jobs.filter(j => j.status === 'quote_requested');
      } else if (filterType === 'active_only') {
        targetJobs = jobs.filter(j => j.status === 'in_progress');
      } else if (filterType === 'urgent_and_quotes') {
        targetJobs = jobs.filter(j => j.status === 'urgent' || j.status === 'quote_requested');
      } else if (filterType === 'closest_to_me') {
        // All non-completed jobs sequenced purely by distance to driver
        targetJobs = jobs.filter(j => j.status !== 'completed' && j.status !== 'invoiced' && j.status !== 'cancelled');
      } else {
        targetJobs = jobs.filter(j => j.status !== 'completed' && j.status !== 'invoiced' && j.status !== 'cancelled');
      }

      const route = await calculateOptimizedRoute(
        {
          name: isUsingGPS ? 'My Live Location' : profile.baseAddress,
          coordinates: currentLocation
        },
        targetJobs,
        filterType,
        targetSuburb,
        prioritizeAgency
      );

      setActiveRoute(route);
    } catch (err) {
      console.error('Routing optimization error:', err);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleToggleStopCompleted = (stopId: string) => {
    if (!activeRoute) return;
    const nextStops = activeRoute.stops.map(s =>
      s.id === stopId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    setActiveRoute({ ...activeRoute, stops: nextStops });
  };

  const handleClearRoute = () => {
    setActiveRoute(null);
  };

  // High-accuracy live GPS refresh function
  const handleRefreshLiveLocation = async (announce = true): Promise<[number, number] | null> => {
    setIsLocatingGPS(true);
    try {
      triggerHapticFeedback('light');
      const pos = await getNativeCurrentPosition();
      if (pos) {
        setCurrentLocation(pos);
        setIsUsingGPS(true);
        triggerHapticFeedback('success');
        return pos;
      } else if (announce) {
        alert('Could not acquire live GPS position. Please check location permissions.');
      }
      return null;
    } catch (err) {
      console.warn('GPS location request error:', err);
      if (announce) {
        alert('Location service error. Using default base coordinates.');
      }
      return null;
    } finally {
      setIsLocatingGPS(false);
    }
  };

  // Center Map on Live Location & Find Closest Job
  const handleCenterOnMyLocation = async () => {
    setIsLocatingGPS(true);
    triggerHapticFeedback('light');
    let coords = await getNativeCurrentPosition();
    if (!coords) {
      coords = currentLocation;
    } else {
      setCurrentLocation(coords);
      setIsUsingGPS(true);
    }
    setIsLocatingGPS(false);
    setRecenterTrigger(prev => prev + 1);

    // Find the closest active job to the user's location
    const activeCandidateJobs = jobs.filter(
      j => j.status !== 'invoiced' && j.status !== 'completed' && j.status !== 'cancelled'
    );

    if (activeCandidateJobs.length > 0 && coords) {
      let closestJob = activeCandidateJobs[0];
      let minDistance = calculateDistanceKm(
        coords[0],
        coords[1],
        closestJob.coordinates[0],
        closestJob.coordinates[1]
      );

      for (let i = 1; i < activeCandidateJobs.length; i++) {
        const d = calculateDistanceKm(
          coords[0],
          coords[1],
          activeCandidateJobs[i].coordinates[0],
          activeCandidateJobs[i].coordinates[1]
        );
        if (d < minDistance) {
          minDistance = d;
          closestJob = activeCandidateJobs[i];
        }
      }

      // Automatically select and highlight the closest job
      setSelectedJob(closestJob);
      triggerHapticFeedback('success');
    }
  };

  // Toggle GPS vs Base coordinates
  const handleToggleGpsMode = async () => {
    triggerHapticFeedback('light');
    if (!isUsingGPS) {
      await handleRefreshLiveLocation(false);
    } else {
      setCurrentLocation(profile.baseCoordinates);
      setIsUsingGPS(false);
      setRecenterTrigger(prev => prev + 1);
    }
  };

  // Open Full Job modal
  const handleOpenFullJob = (job: Job) => {
    setSelectedJob(job);
    setIsJobDetailOpen(true);
  };

  // Update Profile (Persists to localStorage and Supabase)
  const handleUpdateProfile = async (updatedProfile: HandymanProfile) => {
    setProfile(updatedProfile);
    saveProfile(updatedProfile);

    // If signed into Supabase, persist to profiles table
    if (isSupabaseConfigured && currentUserId) {
      await upsertUserProfile(currentUserId, updatedProfile);
    }
  };

  // Authentication Handlers
  const handleLoginSuccess = async (email: string) => {
    setCurrentUserEmail(email);
    if (isSupabaseConfigured) {
      const session = await getCurrentSession();
      if (session?.user) {
        await loadUserData(session.user.id, email);
      }
    }
  };

  const handleSignOut = async () => {
    if (isSupabaseConfigured) {
      await signOutUser();
    }
    setCurrentUserId(null);
    setCurrentUserEmail(null);
    setJobs(INITIAL_JOBS);
    setProfile(DEFAULT_PROFILE);
  };

  const handleResetDemoData = () => {
    const demo = resetToDemoData();
    setJobs(demo);
    setSelectedJob(null);
    setActiveRoute(null);
    setCurrentLocation(profile.baseCoordinates);
    setIsUsingGPS(false);
    setSnoozedReminderIds([]);
    saveSnoozedReminderIds([]);
    if (isSupabaseConfigured && currentUserId) {
      seedJobsToSupabaseIfEmpty(demo, currentUserId);
    }
  };

  // Snooze / Dismiss a reminder
  const handleSnoozeReminder = (reminderId: string) => {
    const isCurrentlySnoozed = snoozedReminderIds.includes(reminderId);
    const nextIds = isCurrentlySnoozed
      ? snoozedReminderIds.filter(id => id !== reminderId)
      : [...snoozedReminderIds, reminderId];
    setSnoozedReminderIds(nextIds);
    saveSnoozedReminderIds(nextIds);
  };

  const handleClearAllSnoozed = () => {
    setSnoozedReminderIds([]);
    saveSnoozedReminderIds([]);
  };

  const quoteRequestsCount = jobs.filter(j => j.status === 'quote_requested').length;
  
  // Smart Reminders & Follow-Ups calculation
  const reminders = generateReminders(jobs, profile, snoozedReminderIds);
  const activeRemindersCount = reminders.filter(r => !r.isSnoozed).length;
  const hasUrgentReminders = reminders.some(r => !r.isSnoozed && r.urgency === 'urgent');

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Top App Header */}
      <Header
        profile={profile}
        activeTab={activeTab}
        quoteRequestsCount={quoteRequestsCount}
        remindersCount={activeRemindersCount}
        hasUrgentReminders={hasUrgentReminders}
        currentUserEmail={currentUserEmail}
        onAddNewJob={() => setIsNewJobOpen(true)}
        onTeleportLocation={handleToggleGpsMode}
        onToggleViewMode={(tab) => setActiveTab(tab)}
        onOpenContacts={() => setActiveTab('contacts')}
        onOpenReminders={() => setIsRemindersDrawerOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onManualSync={handleManualSync}
        isSyncing={isSyncing}
        isUsingGPS={isUsingGPS}
      />

      {/* Unauthenticated Cloud Sync Warning Banner */}
      {!currentUserEmail && !isDismissedAuthBanner && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white px-3.5 py-2 text-xs flex items-center justify-between gap-2 shadow-sm shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
            <p className="font-bold truncate text-[11px] sm:text-xs">
              <span className="font-black">Local browser mode:</span> Sign in to sync your jobs with laptop & other devices.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-2.5 py-1 bg-white text-amber-900 rounded-lg font-black text-[11px] shadow-sm hover:bg-amber-50 active:scale-95 transition"
            >
              Sign In
            </button>
            <button
              onClick={() => setIsDismissedAuthBanner(true)}
              className="p-1 hover:bg-amber-600 rounded-md transition text-amber-100 hover:text-white"
              title="Dismiss notice"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'map' && (
          <MapView
            jobs={jobs}
            profile={profile}
            currentLocation={currentLocation}
            isUsingGPS={isUsingGPS}
            isLocatingGPS={isLocatingGPS}
            recenterTrigger={recenterTrigger}
            activeRoute={activeRoute}
            selectedJob={selectedJob}
            selectedStatus={selectedStatus}
            selectedDate={selectedDate}
            customDateStart={customDateStart}
            customDateEnd={customDateEnd}
            selectedAgency={selectedAgency}
            selectedAgent={selectedAgent}
            selectedSuburb={selectedSuburb}
            isOptimizing={isOptimizing}
            onSelectJob={setSelectedJob}
            onSelectStatus={setSelectedStatus}
            onSelectDate={setSelectedDate}
            onSelectDateRange={handleSelectDateRange}
            onSelectAgency={setSelectedAgency}
            onSelectAgent={setSelectedAgent}
            onSelectSuburb={setSelectedSuburb}
            onOptimizeQuotesRoute={() => handleGenerateRoute('quotes_only')}
            onOpenFullJob={handleOpenFullJob}
            onCenterMyLocation={handleCenterOnMyLocation}
            onRefreshLocation={() => handleRefreshLiveLocation(true)}
          />
        )}

        {(activeTab === 'day_plan' || activeTab === 'route' || activeTab === 'schedule') && (
          <DayPlanView
            jobs={jobs}
            profile={profile}
            currentLocation={currentLocation}
            isUsingGPS={isUsingGPS}
            isLocatingGPS={isLocatingGPS}
            activeRoute={activeRoute}
            isOptimizing={isOptimizing}
            onGenerateRoute={handleGenerateRoute}
            onOpenJobDetail={handleOpenFullJob}
            onToggleStopCompleted={handleToggleStopCompleted}
            onClearRoute={handleClearRoute}
            onSwitchToMap={() => setActiveTab('map')}
            onRefreshLocation={() => handleRefreshLiveLocation(true)}
            onToggleGpsMode={handleToggleGpsMode}
            onUpdateJob={handleUpdateSingleJob}
          />
        )}

        {activeTab === 'jobs' && (
          <JobList
            jobs={jobs}
            profile={profile}
            reminders={reminders}
            statusFilter={selectedStatus}
            onSelectStatus={setSelectedStatus}
            dateFilter={selectedDate}
            onSelectDate={setSelectedDate}
            customDateStart={customDateStart}
            customDateEnd={customDateEnd}
            onSelectDateRange={handleSelectDateRange}
            agencyFilter={selectedAgency}
            onSelectAgency={setSelectedAgency}
            agentFilter={selectedAgent}
            onSelectAgent={setSelectedAgent}
            onSelectJob={handleOpenFullJob}
            onAddNewJob={() => {
              setInitialWorkOrder(null);
              setIsNewJobOpen(true);
            }}
            onDuplicateJob={handleDuplicateJob}
            onOpenImport={() => setIsImportModalOpen(true)}
            onImportWorkOrder={handleImportWorkOrderFromPdf}
            onOpenContacts={() => setActiveTab('contacts')}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactsView
            jobs={jobs}
            onOpenJob={handleOpenFullJob}
          />
        )}

        {activeTab === 'stats' && (
          <StatsOverview
            jobs={jobs}
            profile={profile}
            onResetDemoData={handleResetDemoData}
          />
        )}
      </main>

      {/* Full Job Dossier & Quote Builder Modal */}
      {isJobDetailOpen && selectedJob && (
        <JobDetailModal
          job={selectedJob}
          profile={profile}
          currentLocation={currentLocation}
          onClose={() => setIsJobDetailOpen(false)}
          onUpdateJob={handleUpdateSingleJob}
          onDeleteJob={handleDeleteJob}
          onDuplicateJob={handleDuplicateJob}
        />
      )}

      {/* Create Job / Quote Request Modal */}
      <JobFormModal
        isOpen={isNewJobOpen}
        onClose={() => {
          setIsNewJobOpen(false);
          setInitialWorkOrder(null);
        }}
        onSave={handleCreateNewJob}
        currentLocation={currentLocation}
        initialWorkOrder={initialWorkOrder}
      />

      {/* Bulk Excel / CSV Import Modal */}
      <ImportJobsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportJobs={handleBatchImportJobs}
        jobs={jobs}
      />

      {/* Handyman Business Profile & ABN Invoicing Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        profile={profile}
        currentUserEmail={currentUserEmail}
        onClose={() => setIsProfileModalOpen(false)}
        onSaveProfile={handleUpdateProfile}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenImport={() => setIsImportModalOpen(true)}
      />

      {/* Handyman User & Password / Email OTP Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Smart Reminders & Follow-Ups Drawer */}
      <RemindersDrawer
        isOpen={isRemindersDrawerOpen}
        reminders={reminders}
        profile={profile}
        onClose={() => setIsRemindersDrawerOpen(false)}
        onOpenJob={handleOpenFullJob}
        onSnoozeReminder={handleSnoozeReminder}
        onClearAllSnoozed={handleClearAllSnoozed}
      />

      {/* Mobile Thumb-Zone Floating Action Button (FAB) */}
      {(activeTab === 'map' || activeTab === 'jobs' || activeTab === 'day_plan' || activeTab === 'route') && (
        <button
          onClick={() => setIsNewJobOpen(true)}
          className="fixed bottom-[calc(4.6rem+env(safe-area-inset-bottom,0px))] right-3.5 z-30 sm:hidden bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-600/40 w-13 h-13 rounded-full flex items-center justify-center active:scale-95 transition-all duration-150 border-2 border-white/80"
          title="Create New Job or Quote"
          aria-label="Create New Job"
        >
          <Plus className="w-6 h-6 stroke-[2.8]" />
        </button>
      )}

      {/* Bottom Navigation for Mobile & Responsive */}
      <BottomNav
        activeTab={activeTab}
        quoteRequestsCount={quoteRequestsCount}
        remindersCount={activeRemindersCount}
        hasActiveRoute={activeRoute !== null}
        onSelectTab={setActiveTab}
      />
    </div>
  );
}

export default App;
