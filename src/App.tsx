import React, { useState, useEffect } from 'react';
import { Job, JobStatus, OptimizedRoute, HandymanProfile } from './types';
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
  saveSnoozedReminderIds
} from './services/reminderEngine';
import { Plus } from 'lucide-react';
import { Header } from './components/Navigation/Header';
import { BottomNav } from './components/Navigation/BottomNav';
import { MapView } from './components/Map/MapView';
import { RoutePlannerView } from './components/RoutePlanner/RoutePlannerView';
import { JobList } from './components/Jobs/JobList';
import { DayScheduleView } from './components/Schedule/DayScheduleView';
import { StatsOverview } from './components/Dashboard/StatsOverview';
import { JobDetailModal } from './components/Jobs/JobDetailModal';
import { JobFormModal } from './components/Jobs/JobFormModal';
import { ImportJobsModal } from './components/Jobs/ImportJobsModal';
import { RemindersDrawer } from './components/Reminders/RemindersDrawer';
import { ProfileModal } from './components/Profile/ProfileModal';
import { AuthModal } from './components/Auth/AuthModal';

export function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<HandymanProfile>(loadProfile());
  const [currentLocation, setCurrentLocation] = useState<[number, number]>(profile.baseCoordinates);
  const [isUsingGPS, setIsUsingGPS] = useState(false);
  
  // Authentication & Cloud Sync State
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Navigation & Active View state
  const [activeTab, setActiveTab] = useState<'map' | 'route' | 'jobs' | 'schedule' | 'stats'>('map');
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | 'all'>('all');
  
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Load user-specific jobs and profile from Supabase
  const loadUserData = async (userId: string, userEmail?: string | null) => {
    setCurrentUserId(userId);
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
      setJobs(cloudJobs);
      saveJobs(cloudJobs);
    }
  };

  // Initialize GPS location lock and Auth session
  useEffect(() => {
    // 1. Attempt automatic GPS location lock
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCurrentLocation([pos.coords.latitude, pos.coords.longitude]);
          setIsUsingGPS(true);
        },
        () => {
          // Keep default Point Cook base coordinates if permission denied
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }

    // 2. Initialize Auth state & Supabase data sync
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

        // Realtime Postgres Changes Subscription
        const channel = supabase
          .channel('public:jobs')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'jobs' },
            async (payload: any) => {
              // Only refresh if the change belongs to the current user
              if (currentUserId && (!payload.new?.user_id || payload.new.user_id === currentUserId)) {
                const refreshed = await fetchJobsFromSupabase(currentUserId);
                if (refreshed) {
                  setJobs(refreshed);
                  saveJobs(refreshed);
                }
              }
            }
          )
          .subscribe();

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
            setCurrentUserEmail(null);
            const localJobs = loadJobs();
            setJobs(localJobs);
          }
        });

        return () => {
          supabase.removeChannel(channel);
          authListener.subscription.unsubscribe();
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

  // Optimize multi-stop route with Suburb clustering and Real Estate priority
  const handleGenerateRoute = async (
    filterType: 'quotes_only' | 'active_only' | 'urgent_and_quotes' | 'all' = 'quotes_only',
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
      } else {
        targetJobs = jobs.filter(j => j.status !== 'completed' && j.status !== 'invoiced');
      }

      const route = await calculateOptimizedRoute(
        {
          name: isUsingGPS ? 'My Current Location' : profile.baseAddress,
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

  // Toggle GPS / Base coordinates
  const handleTeleportLocation = () => {
    if (!isUsingGPS && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setCurrentLocation([pos.coords.latitude, pos.coords.longitude]);
          setIsUsingGPS(true);
        },
        () => {
          alert('GPS permission not available. Using Point Cook Base coordinates.');
        }
      );
    } else {
      setCurrentLocation(profile.baseCoordinates);
      setIsUsingGPS(false);
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
        onTeleportLocation={handleTeleportLocation}
        onToggleViewMode={(tab) => setActiveTab(tab)}
        onOpenReminders={() => setIsRemindersDrawerOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        isUsingGPS={isUsingGPS}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {activeTab === 'map' && (
          <MapView
            jobs={jobs}
            currentLocation={currentLocation}
            activeRoute={activeRoute}
            selectedJob={selectedJob}
            selectedStatus={selectedStatus}
            isOptimizing={isOptimizing}
            onSelectJob={setSelectedJob}
            onSelectStatus={setSelectedStatus}
            onOptimizeQuotesRoute={() => handleGenerateRoute('quotes_only')}
            onOpenFullJob={handleOpenFullJob}
            onCenterMyLocation={() => setSelectedJob(null)}
          />
        )}

        {activeTab === 'route' && (
          <RoutePlannerView
            jobs={jobs}
            profile={profile}
            currentLocation={currentLocation}
            activeRoute={activeRoute}
            isOptimizing={isOptimizing}
            onGenerateRoute={handleGenerateRoute}
            onOpenJobDetail={handleOpenFullJob}
            onToggleStopCompleted={handleToggleStopCompleted}
            onClearRoute={handleClearRoute}
            onSwitchToMap={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'jobs' && (
          <JobList
            jobs={jobs}
            profile={profile}
            reminders={reminders}
            onSelectJob={handleOpenFullJob}
            onAddNewJob={() => setIsNewJobOpen(true)}
            onOpenImport={() => setIsImportModalOpen(true)}
          />
        )}

        {activeTab === 'schedule' && (
          <DayScheduleView
            jobs={jobs}
            profile={profile}
            onSelectJob={handleOpenFullJob}
            onPlanRoute={() => {
              handleGenerateRoute('quotes_only');
              setActiveTab('route');
            }}
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
        />
      )}

      {/* Create Job / Quote Request Modal */}
      <JobFormModal
        isOpen={isNewJobOpen}
        onClose={() => setIsNewJobOpen(false)}
        onSave={handleCreateNewJob}
        currentLocation={currentLocation}
      />

      {/* Bulk Excel / CSV Import Modal */}
      <ImportJobsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportJobs={handleBatchImportJobs}
      />

      {/* Handyman Business Profile & ABN Invoicing Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        profile={profile}
        currentUserEmail={currentUserEmail}
        onClose={() => setIsProfileModalOpen(false)}
        onSaveProfile={handleUpdateProfile}
        onOpenAuth={() => setIsAuthModalOpen(true)}
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
      {(activeTab === 'map' || activeTab === 'jobs') && (
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
