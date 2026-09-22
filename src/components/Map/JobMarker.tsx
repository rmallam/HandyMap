import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Job, RouteStop } from '../../types';
import { STATUS_CONFIG, formatCurrency } from '../../utils/helpers';
import { Phone, ArrowRight, Clock, MapPin } from 'lucide-react';

interface JobMarkerProps {
  job: Job;
  routeStop?: RouteStop;
  isSelected?: boolean;
  onSelect: (job: Job) => void;
  onOpenFull: (job: Job) => void;
}

export const JobMarker: React.FC<JobMarkerProps> = ({
  job,
  routeStop,
  isSelected,
  onSelect,
  onOpenFull
}) => {
  const statusCfg = STATUS_CONFIG[job.status];
  const isUrgent = job.status === 'urgent' || job.priority === 'urgent';
  const isQuoteReq = job.status === 'quote_requested';

  // Create Apple Maps / Uber style clean custom pin
  const createCustomIcon = () => {
    const isStop = routeStop !== undefined;
    const stopNumber = routeStop ? routeStop.stopOrder : null;
    const markerColor = statusCfg.colorHex;

    const html = `
      <div class="relative flex items-center justify-center cursor-pointer transform transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-20'}">
        ${isUrgent ? `<div class="absolute -inset-2 rounded-full bg-red-500 opacity-50 animate-ping"></div>` : ''}
        ${isQuoteReq && !isUrgent ? `<div class="absolute -inset-1 rounded-full bg-amber-500 opacity-40 animate-pulse"></div>` : ''}
        
        <div class="relative flex items-center justify-center w-9 h-9 rounded-2xl shadow-md border-[2px] ${isSelected ? 'border-blue-600 ring-4 ring-blue-500/30' : 'border-white'} text-white font-black text-xs pin-shadow" style="background: ${markerColor};">
          ${
            isStop
              ? `<span class="text-sm font-black drop-shadow-sm">#${stopNumber}</span>`
              : `<span class="uppercase tracking-tighter text-[10px] drop-shadow-sm font-bold">${job.category.substring(0, 2)}</span>`
          }
        </div>

        ${
          isStop
            ? `<div class="absolute -top-2.5 -right-2 bg-slate-900 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full shadow-md border border-white">
                ${routeStop.eta.split(' ')[0]}
              </div>`
            : ''
        }

        <div class="absolute -bottom-1 w-2 h-2 rotate-45 border-r border-b ${isSelected ? 'border-blue-600' : 'border-white'}" style="background: ${markerColor};"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-job-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 38],
      popupAnchor: [0, -38]
    });
  };

  return (
    <Marker
      position={job.coordinates}
      icon={createCustomIcon()}
      eventHandlers={{
        click: () => onSelect(job)
      }}
    >
      <Popup className="custom-leaflet-popup">
        <div className="p-3.5 min-w-[250px] text-slate-900 bg-white rounded-2xl shadow-xl border border-slate-200/80">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
            >
              {statusCfg.shortLabel}
            </span>
            {routeStop && (
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md flex items-center gap-1 border border-blue-200/60">
                <Clock className="w-3 h-3" /> Stop #{routeStop.stopOrder} ({routeStop.eta})
              </span>
            )}
          </div>

          <h3 className="font-bold text-sm text-slate-900 line-clamp-1 leading-snug">{job.title}</h3>
          
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{job.address}</span>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <p className="text-[11px] font-semibold text-slate-800">{job.clientName}</p>
              {job.quote && (
                <p className="text-[11px] text-emerald-700 font-extrabold">
                  {formatCurrency(job.quote.totalAmount)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${job.clientPhone}`}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="Call Client"
                onClick={e => e.stopPropagation()}
              >
                <Phone className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => onOpenFull(job)}
                className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 text-xs shadow-sm transition"
              >
                Details <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};
