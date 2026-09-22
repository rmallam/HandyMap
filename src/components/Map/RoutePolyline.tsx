import React from 'react';
import { Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { OptimizedRoute } from '../../types';
import { Navigation, Clock } from 'lucide-react';

interface RoutePolylineProps {
  route: OptimizedRoute | null;
}

export const RoutePolyline: React.FC<RoutePolylineProps> = ({ route }) => {
  if (!route || route.polylineCoordinates.length < 2) return null;

  // Custom icon for Start Location (Handyman Base)
  const startIcon = L.divIcon({
    html: `
      <div class="relative flex items-center justify-center cursor-pointer">
        <div class="absolute -inset-1.5 rounded-full bg-blue-500 opacity-40 animate-ping"></div>
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white shadow-lg border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </div>
      </div>
    `,
    className: 'start-marker-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  return (
    <>
      {/* Start Location Pin */}
      <Marker position={route.startLocation.coordinates} icon={startIcon}>
        <Popup>
          <div className="p-2.5 text-slate-900 bg-white rounded-xl text-xs min-w-[200px] shadow-lg border border-slate-200">
            <p className="font-bold text-blue-600 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5" /> Starting Point
            </p>
            <p className="text-slate-800 font-semibold mt-1">{route.startLocation.name}</p>
            <p className="text-slate-500 text-[11px] mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Total Itinerary: {route.totalDurationMin} min • {route.totalDistanceKm} km
            </p>
          </div>
        </Popup>
      </Marker>

      {/* Main road polyline - Apple Maps Blue */}
      <Polyline
        positions={route.polylineCoordinates}
        pathOptions={{
          color: '#2563eb',
          weight: 6,
          opacity: 0.9,
          lineJoin: 'round',
          lineCap: 'round'
        }}
      />
      {/* Outer subtle shadow casing line */}
      <Polyline
        positions={route.polylineCoordinates}
        pathOptions={{
          color: '#1d4ed8',
          weight: 10,
          opacity: 0.25,
          lineJoin: 'round',
          lineCap: 'round'
        }}
      />
    </>
  );
};
