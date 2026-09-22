import React from 'react';
import { HandymanProfile } from '../../types';
import { Wrench, Plus, MapPin, Map, List } from 'lucide-react';

interface HeaderProps {
  profile: HandymanProfile;
  activeTab: string;
  quoteRequestsCount: number;
  onAddNewJob: () => void;
  onTeleportLocation: () => void;
  onToggleViewMode: (tab: 'map' | 'jobs') => void;
  isUsingGPS: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeTab,
  onAddNewJob,
  onTeleportLocation,
  onToggleViewMode,
  isUsingGPS
}) => {
  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Brand & Handyman info */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
          <Wrench className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight flex items-center gap-1">
              <span>HandyMap</span>
              <span className="text-[10px] uppercase font-black bg-blue-50 text-blue-700 border border-blue-200/60 px-1.5 py-0.2 rounded-md">
                PRO
              </span>
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 font-medium truncate max-w-[130px] sm:max-w-none hidden xs:block">
            {profile.businessName}
          </p>
        </div>
      </div>

      {/* Center: Apple-style Segmented Map / List Toggle */}
      <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shadow-inner">
        <button
          onClick={() => onToggleViewMode('map')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
            activeTab === 'map'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Switch to Map View"
        >
          <Map className="w-3.5 h-3.5" />
          <span>Map</span>
        </button>

        <button
          onClick={() => onToggleViewMode('jobs')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all duration-200 ${
            activeTab === 'jobs'
              ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          title="Switch to Jobs List"
        >
          <List className="w-3.5 h-3.5" />
          <span>List</span>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* GPS location status button */}
        <button
          onClick={onTeleportLocation}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
            isUsingGPS
              ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-sm'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 shadow-sm'
          }`}
          title="Toggle current device GPS or Point Cook Base"
        >
          <MapPin className={`w-3.5 h-3.5 ${isUsingGPS ? 'text-blue-600 animate-bounce-subtle' : 'text-slate-500'}`} />
          <span className="hidden md:inline">{isUsingGPS ? 'GPS Active' : 'Point Cook Base'}</span>
        </button>

        {/* Quick Add Job Button */}
        <button
          onClick={onAddNewJob}
          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">New Lead</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
    </header>
  );
};
