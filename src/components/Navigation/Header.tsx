import React, { useState, useRef, useEffect } from 'react';
import { HandymanProfile } from '../../types';
import { triggerHapticFeedback } from '../../services/nativeMobile';
import {
  Wrench,
  Plus,
  Map,
  List,
  Navigation,
  Bell,
  UserCog,
  LogIn,
  LogOut,
  ChevronDown,
  Cloud,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  profile: HandymanProfile;
  activeTab: string;
  quoteRequestsCount: number;
  remindersCount?: number;
  hasUrgentReminders?: boolean;
  currentUserEmail?: string | null;
  onAddNewJob: () => void;
  onTeleportLocation: () => void;
  onToggleViewMode: (tab: 'map' | 'jobs') => void;
  onOpenReminders?: () => void;
  onOpenProfile?: () => void;
  onOpenImport?: () => void;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
  isUsingGPS: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  profile,
  activeTab,
  remindersCount = 0,
  hasUrgentReminders = false,
  currentUserEmail,
  onAddNewJob,
  onTeleportLocation,
  onToggleViewMode,
  onOpenReminders,
  onOpenProfile,
  onOpenImport,
  onOpenAuth,
  onSignOut,
  isUsingGPS
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'HM';
  };

  const handleSegmentClick = (tab: 'map' | 'jobs') => {
    triggerHapticFeedback('light');
    onToggleViewMode(tab);
  };

  return (
    <header className="h-[calc(4.3rem+env(safe-area-inset-top,0px))] pt-[env(safe-area-inset-top,0px)] bg-white/90 backdrop-blur-2xl border-b border-slate-200/80 px-3.5 sm:px-6 flex items-center justify-between gap-2.5 sm:gap-4 shrink-0 z-30 select-none shadow-[0_4px_24px_-4px_rgba(15,23,42,0.05)]">
      {/* Brand & Handyman info */}
      <div 
        onClick={onOpenProfile}
        className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0"
        title="Click to edit Handyman Profile & ABN"
      >
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl brand-gradient flex items-center justify-center text-white shadow-md shadow-blue-600/25 shrink-0 group-hover:scale-105 transition duration-200 ring-2 ring-white/80">
          <Wrench className="w-4.5 h-4.5 stroke-[2.3]" />
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-black text-xs sm:text-sm text-slate-950 tracking-tight flex items-center gap-1">
              <span>HandyMap</span>
              <span className="text-[9px] uppercase font-black bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-1.5 py-0.2 rounded-md shadow-xs">
                PRO
              </span>
            </h1>
            {profile.abn && (
              <span className="hidden md:inline text-[9px] font-mono font-bold bg-amber-50 text-amber-900 border border-amber-200/90 px-1.5 py-0.2 rounded-md">
                ABN: {profile.abn}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 font-semibold truncate max-w-[130px] sm:max-w-none hidden xs:block group-hover:text-blue-600 transition">
            {profile.businessName}
          </p>
        </div>
      </div>

      {/* Center: Apple-style Segmented Map / List Toggle (Shown on Map and Jobs view) */}
      {(activeTab === 'map' || activeTab === 'jobs') ? (
        <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 shadow-inner">
          <button
            onClick={() => handleSegmentClick('map')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
              activeTab === 'map'
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-900/10 ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Switch to Map View"
          >
            <Map className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Map</span>
          </button>

          <button
            onClick={() => handleSegmentClick('jobs')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all duration-200 active:scale-95 ${
              activeTab === 'jobs'
                ? 'bg-white text-slate-900 shadow-sm shadow-slate-900/10 ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Switch to Jobs List"
          >
            <List className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>List</span>
          </button>
        </div>
      ) : (
        <div className="hidden sm:flex items-center gap-1 text-xs font-extrabold text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/60">
          <span className="capitalize">{activeTab} Hub</span>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* User Auth Chip / Sign In Button */}
        {currentUserEmail ? (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 p-1 sm:pl-1.5 sm:pr-2.5 sm:py-1 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-700 transition active:scale-95 shadow-sm shrink-0"
              title={`Logged in as ${currentUserEmail}`}
            >
              <div className="w-6 h-6 rounded-xl emerald-gradient text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                {getInitials(profile.name, currentUserEmail)}
              </div>
              <span className="text-xs font-bold max-w-[80px] sm:max-w-[120px] truncate hidden md:inline text-slate-800">
                {currentUserEmail.split('@')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:inline" />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-slate-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ring-1 ring-black/5">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Signed in as</p>
                  <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{currentUserEmail}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 text-[10px] text-emerald-600 font-bold">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Cloud Database Synced</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenProfile?.();
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                >
                  <UserCog className="w-4 h-4 text-blue-600" />
                  <span>Profile & ABN Settings</span>
                </button>

                {onOpenImport && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenImport();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Import Excel / CSV</span>
                  </button>
                )}

                {onSignOut && (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-2.5 sm:px-3 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95 shrink-0"
            title="Sign in with Password or Email OTP"
          >
            <LogIn className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}

        {/* Reminders / Notification Bell Button */}
        {onOpenReminders && (
          <button
            onClick={() => {
              triggerHapticFeedback('light');
              onOpenReminders();
            }}
            className={`p-2 sm:p-2.5 rounded-2xl relative transition active:scale-95 border shrink-0 ${
              hasUrgentReminders
                ? 'bg-red-50 text-red-700 border-red-200/90 shadow-sm'
                : remindersCount > 0
                ? 'bg-amber-50/80 text-amber-800 border-amber-200/90 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200/90 hover:bg-slate-50 shadow-xs'
            }`}
            title={`${remindersCount} action reminders pending`}
          >
            <Bell className={`w-4 h-4 ${hasUrgentReminders ? 'animate-bounce text-red-600' : ''}`} />
            {remindersCount > 0 && (
              <span className={`absolute -top-1 -right-1 text-[9px] font-black px-1.5 py-0.2 rounded-full border-2 border-white shadow-sm ${
                hasUrgentReminders ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
              }`}>
                {remindersCount}
              </span>
            )}
          </button>
        )}

        {/* GPS location status button */}
        <button
          onClick={() => {
            triggerHapticFeedback('light');
            onTeleportLocation();
          }}
          className={`p-2 sm:px-3 sm:py-2 rounded-2xl text-xs font-bold flex items-center gap-1.5 border transition active:scale-95 shrink-0 ${
            isUsingGPS
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 shadow-xs'
          }`}
          title="Toggle live device GPS or Point Cook Base"
        >
          <Navigation className={`w-3.5 h-3.5 ${isUsingGPS ? 'text-emerald-600 fill-emerald-600 animate-pulse' : 'text-slate-500'}`} />
          <span className="hidden md:inline">{isUsingGPS ? 'Live GPS' : 'Base'}</span>
        </button>

        {/* Quick Add Job Button */}
        <button
          onClick={() => {
            triggerHapticFeedback('light');
            onAddNewJob();
          }}
          className="px-3 sm:px-4 py-2 rounded-2xl brand-gradient hover:opacity-95 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/25 transition active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">New Lead</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>
    </header>
  );
};
