import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Job, RouteStop } from '../../types';
import { STATUS_CONFIG, formatCurrency } from '../../utils/helpers';
import { Phone, ArrowRight, Clock, MapPin, Building2 } from 'lucide-react';
import { triggerHapticFeedback } from '../../services/nativeMobile';

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

  // Create Apple Maps / Uber style luxury 3D pin icon
  const createCustomIcon = () => {
    const isStop = routeStop !== undefined;
    const stopNumber = routeStop ? routeStop.stopOrder : null;
    const markerColor = statusCfg.colorHex;

    const html = `
      <div class="relative flex items-center justify-center cursor-pointer transform transition-all duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-110 z-20'}">
        ${isUrgent ? `<div class="absolute -inset-2.5 rounded-full bg-red-500/40 animate-ping"></div>` : ''}
        ${isQuoteReq && !isUrgent ? `<div class="absolute -inset-1.5 rounded-full bg-amber-500/30 animate-pulse"></div>` : ''}
        
        <div class="relative flex items-center justify-center w-10 h-10 rounded-[18px] shadow-[0_8px_20px_rgba(0,0,0,0.22)] border-[2.5px] ${
          isSelected ? 'border-blue-600 ring-4 ring-blue-500/35 scale-105' : 'border-white'
        } text-white font-black text-xs pin-shadow" style="background: linear-gradient(145deg, ${markerColor}, ${adjustColorBrightness(markerColor, -25)});">
          ${
            isStop
              ? `<span class="text-sm font-black drop-shadow-md">#${stopNumber}</span>`
              : `<span class="uppercase tracking-tight text-[11px] drop-shadow-md font-black">${job.category.substring(0, 2)}</span>`
          }
        </div>

        ${
          job.isAgencyJob && job.realEstateAgency
            ? `<div class="absolute -top-2 -left-2 bg-purple-800 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-[1.5px] border-white" title="Real Estate: ${job.realEstateAgency}">
                🏢
              </div>`
            : ''
        }

        ${
          isStop
            ? `<div class="absolute -top-2.5 -right-2 bg-slate-950 text-white font-black text-[9px] px-2 py-0.5 rounded-full shadow-lg border border-white/80">
                ${routeStop.eta.split(' ')[0]}
              </div>`
            : ''
        }

        <div class="absolute -bottom-1.5 w-3 h-3 rotate-45 border-r-[2px] border-b-[2px] ${isSelected ? 'border-blue-600' : 'border-white'}" style="background: ${markerColor};"></div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-job-marker',
      iconSize: [40, 40],
      iconAnchor: [20, 42],
      popupAnchor: [0, -42]
    });
  };

  return (
    <Marker
      position={job.coordinates}
      icon={createCustomIcon()}
      eventHandlers={{
        click: () => {
          triggerHapticFeedback('light');
          onSelect(job);
        }
      }}
    >
      <Popup className="custom-leaflet-popup">
        <div className="p-4 min-w-[260px] text-slate-900 bg-white/95 backdrop-blur-xl rounded-[24px] shadow-2xl border border-slate-200/90 ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-xs ${statusCfg.bgClass} ${statusCfg.textClass} ${statusCfg.borderClass}`}
            >
              {statusCfg.shortLabel}
            </span>
            {job.isAgencyJob && job.realEstateAgency && (
              <span className="text-[10px] font-extrabold text-purple-900 bg-purple-100/80 border border-purple-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                🏢 {job.realEstateAgency.split(' ')[0]}
              </span>
            )}
            {routeStop && (
              <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-lg flex items-center gap-1 border border-blue-200/60 shadow-xs">
                <Clock className="w-3 h-3 text-blue-600" /> Stop #{routeStop.stopOrder}
              </span>
            )}
          </div>

          <h3 className="font-black text-sm text-slate-950 line-clamp-1 leading-snug">{job.title}</h3>
          
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">{job.address}</span>
          </div>

          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <p className="text-[11px] font-bold text-slate-900">
                {job.clientName}
                {job.isAgencyJob && job.workOrderNumber && (
                  <span className="block text-[10px] text-purple-700 font-mono font-bold mt-0.5">{job.workOrderNumber}</span>
                )}
              </p>
              {job.quote && (
                <p className="text-xs text-emerald-700 font-black mt-0.5">
                  {formatCurrency(job.quote.totalAmount)}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${job.clientPhone}`}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition active:scale-95 border border-slate-200/60"
                title="Call Client"
                onClick={e => e.stopPropagation()}
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
              </a>
              <button
                onClick={() => {
                  triggerHapticFeedback('light');
                  onOpenFull(job);
                }}
                className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black flex items-center gap-1 text-xs shadow-md transition active:scale-95"
              >
                Details <ArrowRight className="w-3 h-3 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
}
