import React from 'react';
import { Map, Navigation, ClipboardList, Calendar, BarChart3 } from 'lucide-react';
import { triggerHapticFeedback } from '../../services/nativeMobile';

interface BottomNavProps {
  activeTab: 'map' | 'route' | 'jobs' | 'schedule' | 'stats';
  quoteRequestsCount: number;
  remindersCount?: number;
  hasActiveRoute: boolean;
  onSelectTab: (tab: 'map' | 'route' | 'jobs' | 'schedule' | 'stats') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  quoteRequestsCount,
  remindersCount = 0,
  hasActiveRoute,
  onSelectTab
}) => {
  const navItems = [
    {
      id: 'map' as const,
      label: 'Map',
      icon: Map,
      badge: quoteRequestsCount > 0 ? quoteRequestsCount : null,
      badgeColor: 'bg-amber-500 text-white'
    },
    {
      id: 'route' as const,
      label: 'Route',
      icon: Navigation,
      badge: hasActiveRoute ? '⚡' : null,
      badgeColor: 'bg-blue-600 text-white'
    },
    {
      id: 'jobs' as const,
      label: 'Jobs',
      icon: ClipboardList,
      badge: remindersCount > 0 ? remindersCount : null,
      badgeColor: 'bg-red-500 text-white'
    },
    {
      id: 'schedule' as const,
      label: 'Schedule',
      icon: Calendar,
      badge: null,
      badgeColor: ''
    },
    {
      id: 'stats' as const,
      label: 'Analytics',
      icon: BarChart3,
      badge: null,
      badgeColor: ''
    }
  ];

  const handleTabClick = (tabId: 'map' | 'route' | 'jobs' | 'schedule' | 'stats') => {
    triggerHapticFeedback('light');
    onSelectTab(tabId);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none flex justify-center px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
      <nav className="pointer-events-auto w-full max-w-lg bg-white/92 backdrop-blur-2xl border border-slate-200/90 rounded-[28px] p-1.5 shadow-[0_16px_40px_-10px_rgba(15,23,42,0.18)] flex items-center justify-between select-none ring-1 ring-black/5">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-[22px] h-[22px] transition-all duration-200 ${
                    isActive
                      ? 'text-white scale-105 stroke-[2.4]'
                      : 'stroke-[1.8] text-slate-500'
                  }`}
                />
                {item.badge !== null && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow-sm border border-white ${
                      isActive ? 'bg-amber-400 text-slate-950 font-extrabold' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              <span
                className={`text-[10px] mt-0.5 tracking-tight transition-all duration-200 ${
                  isActive ? 'font-black text-white' : 'font-semibold text-slate-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
