import React from 'react';
import { Map, Navigation, ClipboardList, Calendar, BarChart3 } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'map' | 'route' | 'jobs' | 'schedule' | 'stats';
  quoteRequestsCount: number;
  hasActiveRoute: boolean;
  onSelectTab: (tab: 'map' | 'route' | 'jobs' | 'schedule' | 'stats') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  quoteRequestsCount,
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
      label: 'Optimal Route',
      icon: Navigation,
      badge: hasActiveRoute ? '⚡' : null,
      badgeColor: 'bg-blue-600 text-white'
    },
    {
      id: 'jobs' as const,
      label: 'Jobs & Quotes',
      icon: ClipboardList,
      badge: null,
      badgeColor: ''
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-white/95 backdrop-blur-xl border-t border-slate-200/90 z-40 px-2 sm:px-6 flex items-center justify-around select-none shadow-[0_-2px_6px_rgba(0,0,0,0.03)]">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`relative flex flex-col items-center justify-center py-1.5 px-3 sm:px-4 rounded-xl transition-all duration-150 active:scale-95 ${
              isActive
                ? 'text-blue-600 font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-blue-600 stroke-[2.3]' : 'stroke-[1.8]'}`} />
              {item.badge !== null && (
                <span className={`absolute -top-1.5 -right-3 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full shadow-sm ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </div>

            <span className="text-[11px] mt-1 font-medium tracking-tight">
              {item.label}
            </span>

            {isActive && (
              <span className="absolute bottom-0 w-6 h-0.5 bg-blue-600 rounded-full"></span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
