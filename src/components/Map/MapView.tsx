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
  selectedStatus: JobStatus | 'all';
  isOptimizing: boolean;
  onSelectJob: (job: Job | null) => void;
  onSelectStatus: (status: JobStatus | 'all') => void;
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
  recenterTrigger
}: {
  jobs: Job[];
  activeRoute: OptimizedRoute | null;
  selectedJob: Job | null;
  currentLocation: [number, number];
  recenterTrigger?: number;
}) {
  const map = useMap();
  const initialFitDone = useRef(false);

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

  // Auto-fit when route changes
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
    }
  }, [activeRoute, selectedJob, jobs, currentLocation, map]);

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
  isOptimizing,
  onSelectJob,
  onSelectStatus,
  onOptimizeQuotesRoute,
  onOpenFullJob,
  onCenterMyLocation,
  onRefreshLocation
}) => {
  const [selectedSuburb, setSelectedSuburb] = useState<string>('all');
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<DateFilterType>('all');

  // Filter jobs by status, suburb, agency, and date
  const visibleJobs = jobs.filter(job => {
    // When 'all' is selected, exclude paid & invoiced jobs and cancelled jobs to keep the active map uncluttered
    const matchesStatus = selectedStatus === 'all' 
      ? job.status !== 'invoiced' && job.status !== 'cancelled' 
      : job.status === selectedStatus;
    const matchesSuburb = selectedSuburb === 'all' || extractSuburb(job) === selectedSuburb;
    
    let matchesAgency = true;
    if (selectedAgency === 'agency_only') {
      matchesAgency = Boolean(job.isAgencyJob && job.realEstateAgency && job.realEstateAgency.trim().length > 0);
    } else if (selectedAgency === 'direct_only') {
      matchesAgency = !job.isAgencyJob || !job.realEstateAgency || job.realEstateAgency.trim().length === 0;
    } else if (selectedAgency !== 'all') {
      matchesAgency = Boolean(
        job.realEstateAgency &&
        job.realEstateAgency.trim().toLowerCase() === selectedAgency.trim().toLowerCase()
      );
    }

    const matchesDate = matchesDateFilter(job, selectedDate);

    return matchesStatus && matchesSuburb && matchesAgency && matchesDate;
  });

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
        selectedDate={selectedDate}
        onSelectStatus={onSelectStatus}
        onSelectSuburb={setSelectedSuburb}
        onSelectAgency={setSelectedAgency}
        onSelectDate={setSelectedDate}
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
