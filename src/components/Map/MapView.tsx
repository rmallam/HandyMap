import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Job, JobStatus, OptimizedRoute } from '../../types';
import { extractSuburb } from '../../services/routeOptimizer';
import { JobMarker } from './JobMarker';
import { RoutePolyline } from './RoutePolyline';
import { MapFilters } from './MapFilters';
import { QuickJobSheet } from './QuickJobSheet';

interface MapViewProps {
  jobs: Job[];
  currentLocation: [number, number];
  activeRoute: OptimizedRoute | null;
  selectedJob: Job | null;
  selectedStatus: JobStatus | 'all';
  isOptimizing: boolean;
  onSelectJob: (job: Job | null) => void;
  onSelectStatus: (status: JobStatus | 'all') => void;
  onOptimizeQuotesRoute: () => void;
  onOpenFullJob: (job: Job) => void;
  onCenterMyLocation: () => void;
}

// Subcomponent to handle map bounds, resize invalidation and animations
function MapController({
  jobs,
  activeRoute,
  selectedJob,
  currentLocation
}: {
  jobs: Job[];
  activeRoute: OptimizedRoute | null;
  selectedJob: Job | null;
  currentLocation: [number, number];
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
  currentLocation,
  activeRoute,
  selectedJob,
  selectedStatus,
  isOptimizing,
  onSelectJob,
  onSelectStatus,
  onOptimizeQuotesRoute,
  onOpenFullJob,
  onCenterMyLocation
}) => {
  const [selectedSuburb, setSelectedSuburb] = useState<string>('all');
  const [selectedAgency, setSelectedAgency] = useState<string>('all');

  // Filter jobs by status, suburb, and agency
  const visibleJobs = jobs.filter(job => {
    const matchesStatus = selectedStatus === 'all' || job.status === selectedStatus;
    const matchesSuburb = selectedSuburb === 'all' || extractSuburb(job) === selectedSuburb;
    
    let matchesAgency = true;
    if (selectedAgency === 'agency_only') {
      matchesAgency = !!job.isAgencyJob;
    } else if (selectedAgency !== 'all') {
      matchesAgency = job.realEstateAgency === selectedAgency;
    }

    return matchesStatus && matchesSuburb && matchesAgency;
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
        onSelectStatus={onSelectStatus}
        onSelectSuburb={setSelectedSuburb}
        onSelectAgency={setSelectedAgency}
        onOptimizeQuotesRoute={onOptimizeQuotesRoute}
        isOptimizing={isOptimizing}
        hasActiveRoute={activeRoute !== null}
        onCenterMyLocation={onCenterMyLocation}
      />

      {/* Main Leaflet Map with OpenStreetMap Tiles */}
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
        />

        {/* Route Polyline */}
        <RoutePolyline route={activeRoute} />

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
          routeStop={routeStopMap.get(selectedJob.id)}
          currentLocation={currentLocation}
          onClose={() => onSelectJob(null)}
          onOpenFullJob={onOpenFullJob}
        />
      )}
    </div>
  );
};
