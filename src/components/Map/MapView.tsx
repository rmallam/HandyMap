import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { Job, JobStatus, OptimizedRoute, HandymanProfile } from '../../types';
import { extractSuburb } from '../../services/routeOptimizer';
import { DateFilterType, matchesDateFilter } from '../../utils/helpers';
import { JobMarker } from './JobMarker';
import { RoutePolyline } from './RoutePolyline';
import { MapFilters } from './MapFilters';
import { QuickJobSheet } from './QuickJobSheet';

interface MapViewProps {
  jobs: Job[];
  profile?: HandymanProfile;
  currentLocation: [number, number];
  isUsingGPS?: boolean;
  isLocatingGPS?: boolean;
  recenterTrigger?: number;
  activeRoute: OptimizedRoute | null;
  selectedJob: Job | null;
  selectedStatus: JobStatus | 'all' | 'all_total';
  selectedDate?: DateFilterType;
  customDateStart?: string;
  customDateEnd?: string;
  selectedAgency?: string;
  selectedAgent?: string;
  selectedSuburb?: string;
  isOptimizing: boolean;
  onSelectJob: (job: Job | null) => void;
  onSelectStatus: (status: JobStatus | 'all' | 'all_total') => void;
  onSelectDate?: (date: DateFilterType) => void;
  onSelectDateRange?: (startDate: string, endDate: string) => void;
  onSelectAgency?: (agency: string) => void;
  onSelectAgent?: (agent: string) => void;
  onSelectSuburb?: (suburb: string) => void;
  onOptimizeQuotesRoute: () => void;
  onOpenFullJob: (job: Job) => void;
  onCenterMyLocation: () => void;
  onRefreshLocation?: () => void;
}

// Subcomponent to handle map bounds, resize invalidation and animations
function MapController({
  jobs,
  activeRoute,
  selectedJob,
  currentLocation,
  recenterTrigger,
  filterKey
}: {
  jobs: Job[];
  activeRoute: OptimizedRoute | null;
  selectedJob: Job | null;
  currentLocation: [number, number];
  recenterTrigger?: number;
  filterKey?: string;
}) {
  const map = useMap();
  const initialFitDone = useRef(false);
  const prevFilterKey = useRef<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  // Trigger flyTo when user explicitly asks to center on their location
  useEffect(() => {
    if (recenterTrigger && recenterTrigger > 0) {
      map.flyTo(currentLocation, 15, { duration: 0.8 });
    }
  }, [recenterTrigger, currentLocation, map]);

  // Auto-fit when route changes or when user selects a job
  useEffect(() => {
    if (activeRoute && activeRoute.polylineCoordinates.length > 0) {
      const bounds = L.latLngBounds(activeRoute.polylineCoordinates);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
      return;
    }

    if (selectedJob) {
      map.flyTo(selectedJob.coordinates, 15, { duration: 0.8 });
      return;
    }

    // Initial load fit all jobs
    if (!initialFitDone.current && jobs.length > 0) {
      const points = [currentLocation, ...jobs.map(j => j.coordinates)];
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      initialFitDone.current = true;
      prevFilterKey.current = filterKey || '';
      return;
    }

    // When filter changes, re-fit map to the visible filtered jobs
    if (filterKey !== undefined && filterKey !== prevFilterKey.current) {
      prevFilterKey.current = filterKey;
      if (jobs.length > 0) {
        if (jobs.length === 1) {
          map.flyTo(jobs[0].coordinates, 15, { duration: 0.8 });
        } else {
          const bounds = L.latLngBounds(jobs.map(j => j.coordinates));
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
      }
    }
  }, [activeRoute, selectedJob, jobs, currentLocation, map, filterKey]);

  return null;
}

export const MapView: React.FC<MapViewProps> = ({
  jobs,
  profile,
  currentLocation,
  isUsingGPS,
  isLocatingGPS,
  recenterTrigger,
  activeRoute,
  selectedJob,
  selectedStatus,
  selectedDate: propDate,
  customDateStart: propCustomDateStart,
  customDateEnd: propCustomDateEnd,
  selectedAgency: propAgency,
  selectedAgent: propAgent,
  selectedSuburb: propSuburb,
  isOptimizing,
  onSelectJob,
  onSelectStatus,
  onSelectDate: propOnSelectDate,
  onSelectDateRange: propOnSelectDateRange,
  onSelectAgency: propOnSelectAgency,
  onSelectAgent: propOnSelectAgent,
  onSelectSuburb: propOnSelectSuburb,
  onOptimizeQuotesRoute,
  onOpenFullJob,
  onCenterMyLocation,
  onRefreshLocation
}) => {
  const [internalSuburb, setInternalSuburb] = useState<string>('all');
  const [internalAgency, setInternalAgency] = useState<string>('all');
  const [internalAgent, setInternalAgent] = useState<string>('all');
  const [internalDate, setInternalDate] = useState<DateFilterType>('all');

  const selectedSuburb = propSuburb !== undefined ? propSuburb : internalSuburb;
  const setSelectedSuburb = propOnSelectSuburb || setInternalSuburb;

  const selectedAgency = propAgency !== undefined ? propAgency : internalAgency;
  const setSelectedAgency = propOnSelectAgency || setInternalAgency;

  const selectedAgent = propAgent !== undefined ? propAgent : internalAgent;
  const setSelectedAgent = propOnSelectAgent || setInternalAgent;

  const selectedDate = propDate !== undefined ? propDate : internalDate;
  const setSelectedDate = propOnSelectDate || setInternalDate;

  const [internalDateStart, setInternalDateStart] = useState<string>('');
  const [internalDateEnd, setInternalDateEnd] = useState<string>('');
  const customDateStart = propCustomDateStart !== undefined ? propCustomDateStart : internalDateStart;
  const customDateEnd = propCustomDateEnd !== undefined ? propCustomDateEnd : internalDateEnd;
  const handleSelectDateRange = propOnSelectDateRange || ((start: string, end: string) => {
    setInternalDateStart(start);
    setInternalDateEnd(end);
    setSelectedDate('date_range');
  });

  // Filter jobs by status, suburb, agency, agent, and date
  const visibleJobs = jobs.filter(job => {
    // When 'all' is selected, exclude paid & invoiced jobs and cancelled jobs to keep the active map uncluttered
    const matchesStatus = (selectedStatus === 'all' || selectedStatus === 'all_total')
      ? (selectedStatus === 'all' ? (job.status !== 'invoiced' && job.status !== 'cancelled') : true)
      : job.status === selectedStatus;

    const matchesSuburb = selectedSuburb === 'all' || extractSuburb(job) === selectedSuburb;
    
    let matchesAgency = true;
    if (selectedAgency === 'agency_only') {
      matchesAgency = Boolean(job.isAgencyJob && job.realEstateAgency && job.realEstateAgency.trim().length > 0);
    } else if (selectedAgency === 'direct_only') {
      matchesAgency = !job.isAgencyJob || !job.realEstateAgency || job.realEstateAgency.trim().length === 0;
    } else if (selectedAgency !== 'all') {
      const targetAgency = selectedAgency.trim().toLowerCase();
      const jobAgency = (job.realEstateAgency || '').trim().toLowerCase();
      matchesAgency = Boolean(
        jobAgency &&
        (jobAgency === targetAgency ||
         jobAgency.includes(targetAgency) ||
         targetAgency.includes(jobAgency))
      );
    }

    let matchesAgent = true;
    if (selectedAgent && selectedAgent !== 'all') {
      const targetAgent = selectedAgent.trim().toLowerCase();
      const jobAgent = (job.realEstateAgentName || '').trim().toLowerCase();
      matchesAgent = Boolean(
        jobAgent &&
        (jobAgent === targetAgent ||
         jobAgent.includes(targetAgent) ||
         targetAgent.includes(jobAgent))
      );
    }

    const matchesDate = matchesDateFilter(job, selectedDate, new Date(), customDateStart, customDateEnd);

    return matchesStatus && matchesSuburb && matchesAgency && matchesAgent && matchesDate;
  });

  const filterKey = `${selectedStatus}_${selectedAgency}_${selectedAgent}_${selectedDate}_${selectedSuburb}`;

  // Map route stop index by job ID
  const routeStopMap = new Map();
  if (activeRoute) {
    activeRoute.stops.forEach(stop => {
      routeStopMap.set(stop.job.id, stop);
    });
  }

  return (
    <div className="relative w-full h-full min-h-full flex-1 bg-slate-100 overflow-hidden select-none">
      {/* Floating Filter & Route Action Bar */}
      <MapFilters
        jobs={jobs}
        selectedStatus={selectedStatus}
        selectedSuburb={selectedSuburb}
        selectedAgency={selectedAgency}
        selectedAgent={selectedAgent}
        selectedDate={selectedDate}
        customDateStart={customDateStart}
        customDateEnd={customDateEnd}
        onSelectStatus={onSelectStatus}
        onSelectSuburb={setSelectedSuburb}
        onSelectAgency={setSelectedAgency}
        onSelectAgent={setSelectedAgent}
        onSelectDate={setSelectedDate}
        onSelectDateRange={handleSelectDateRange}
        onOptimizeQuotesRoute={onOptimizeQuotesRoute}
        isOptimizing={isOptimizing}
        hasActiveRoute={activeRoute !== null}
        onCenterMyLocation={onCenterMyLocation}
        isUsingGPS={isUsingGPS}
        isLocatingGPS={isLocatingGPS}
      />

      {/* Main Leaflet Map with CartoDB Voyager High-Res Vector Aesthetic Tiles */}
      <MapContainer
        center={currentLocation}
        zoom={13}
        scrollWheelZoom={true}
        zoomControl={false}
        style={{ width: '100%', height: '100%', minHeight: '100%' }}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapController
          jobs={visibleJobs}
          activeRoute={activeRoute}
          selectedJob={selectedJob}
          currentLocation={currentLocation}
          recenterTrigger={recenterTrigger}
          filterKey={filterKey}
        />

        {/* Route Polyline */}
        <RoutePolyline route={activeRoute} />

        {/* Live Handyman Location Pulsing Marker */}
        <Marker
          position={currentLocation}
          zIndexOffset={1000}
          icon={L.divIcon({
            className: 'custom-live-location-pin',
            html: `
              <div class="relative flex items-center justify-center w-8 h-8">
                <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-40"></div>
                <div class="absolute w-5 h-5 bg-blue-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                  <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
                </div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })}
        >
          <Tooltip direction="top" offset={[0, -12]} opacity={1}>
            <div className="text-[11px] font-extrabold text-slate-900 flex items-center gap-1.5 px-1 py-0.5">
              <span className={`w-2 h-2 rounded-full ${isUsingGPS ? 'bg-emerald-500 animate-pulse' : 'bg-blue-600'}`} />
              <span>{isUsingGPS ? '📍 You are here (Live GPS)' : `🏠 Base: ${profile?.baseAddress || 'Point Cook'}`}</span>
            </div>
          </Tooltip>
        </Marker>

        {/* Job Markers */}
        {visibleJobs.map(job => (
          <JobMarker
            key={job.id}
            job={job}
            routeStop={routeStopMap.get(job.id)}
            isSelected={selectedJob?.id === job.id}
            onSelect={onSelectJob}
            onOpenFull={onOpenFullJob}
          />
        ))}
      </MapContainer>

      {/* Quick Bottom Sheet on Marker Tap */}
      {selectedJob && (
        <QuickJobSheet
          job={selectedJob}
          profile={profile}
          routeStop={routeStopMap.get(selectedJob.id)}
          currentLocation={currentLocation}
          onClose={() => onSelectJob(null)}
          onOpenFullJob={onOpenFullJob}
        />
      )}
    </div>
  );
};
