import React, { useState, useEffect } from 'react';
import { Job, JobStatus, OptimizedRoute, HandymanProfile } from './types';
import { loadJobs, saveJobs, loadProfile, saveProfile, resetToDemoData } from './services/storage';
import { calculateOptimizedRoute } from './services/routeOptimizer';
import { Header } from './components/Navigation/Header';
import { BottomNav } from './components/Navigation/BottomNav';
import { MapView } from './components/Map/MapView';
import { RoutePlannerView } from './components/RoutePlanner/RoutePlannerView';
import { JobList } from './components/Jobs/JobList';
import { DayScheduleView } from './components/Schedule/DayScheduleView';
import { StatsOverview } from './components/Dashboard/StatsOverview';
import { JobDetailModal } from './components/Jobs/JobDetailModal';
import { JobFormModal } from './components/Jobs/JobFormModal';

export function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<HandymanProfile>(loadProfile());
  const [currentLocation, setCurrentLocation] = useState<[number, number]>(profile.baseCoordinates);
  const [isUsingGPS, setIsUsingGPS] = useState(false);
  
  // Navigation & Active View state
  const [activeTab, setActiveTab] = useState<'map' | 'route' | 'jobs' | 'schedule' | 'stats'>('map');
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | 'all'>('all');
  
  // Selection and Route state
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [activeRoute, setActiveRoute] = useState<OptimizedRoute | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Modals
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);

  // Load initial jobs
  useEffect(() => {
    const loaded = loadJobs();
    setJobs(loaded);
  }, []);

  // Update jobs state and localStorage
  const handleUpdateJobsList = (newJobs: Job[]) => {
    setJobs(newJobs);
    saveJobs(newJobs);
  };

  const handleUpdateSingleJob = (updatedJob: Job) => {
    const nextJobs = jobs.map(j => (j.id === updatedJob.id ? updatedJob : j));
    handleUpdateJobsList(nextJobs);
    setSelectedJob(updatedJob);

    // If active route contains this job, update its reference
    if (activeRoute) {
      const nextStops = activeRoute.stops.map(stop =>
        stop.job.id === updatedJob.id ? { ...stop, job: updatedJob } : stop
      );
      setActiveRoute({ ...activeRoute, stops: nextStops });
    }
  };

  const handleDeleteJob = (jobId: string) => {
    const nextJobs = jobs.filter(j => j.id !== jobId);
    handleUpdateJobsList(nextJobs);
    if (selectedJob?.id === jobId) {
      setSelectedJob(null);
      setIsJobDetailOpen(false);
    }
    if (activeRoute) {
      const nextStops = activeRoute.stops.filter(stop => stop.job.id !== jobId);
      setActiveRoute({ ...activeRoute, stops: nextStops });
    }
  };

  const handleCreateNewJob = (newJob: Job) => {
    const nextJobs = [newJob, ...jobs];
    handleUpdateJobsList(nextJobs);
    setSelectedJob(newJob);
    setActiveTab('map');
  };

  // Optimize multi-stop route
  const handleGenerateRoute = async (
    filterType: 'quotes_only' | 'active_only' | 'urgent_and_quotes' | 'all' = 'quotes_only'
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
        filterType
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
          alert('GPS permission not available. Using Austin Base coordinates.');
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

  // Reset Demo Data
  const handleResetDemoData = () => {
    const demo = resetToDemoData();
    setJobs(demo);
    setSelectedJob(null);
    setActiveRoute(null);
    setCurrentLocation(profile.baseCoordinates);
    setIsUsingGPS(false);
  };

  const quoteRequestsCount = jobs.filter(j => j.status === 'quote_requested').length;

  return (
    <div className="h-full w-full flex flex-col bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Top App Header */}
      <Header
        profile={profile}
        activeTab={activeTab}
        quoteRequestsCount={quoteRequestsCount}
        onAddNewJob={() => setIsNewJobOpen(true)}
        onTeleportLocation={handleTeleportLocation}
        onToggleViewMode={(tab) => setActiveTab(tab)}
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
            onSelectJob={handleOpenFullJob}
            onAddNewJob={() => setIsNewJobOpen(true)}
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

      {/* Bottom Navigation for Mobile & Responsive */}
      <BottomNav
        activeTab={activeTab}
        quoteRequestsCount={quoteRequestsCount}
        hasActiveRoute={activeRoute !== null}
        onSelectTab={setActiveTab}
      />
    </div>
  );
}

export default App;
