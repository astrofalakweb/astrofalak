'use client';

import { useAppStore } from '../lib/store';
import { Home, Globe, Clock, Compass, Orbit, HelpCircle, BookOpen, GraduationCap } from 'lucide-react';

export function BottomNav() {
  const activePage = useAppStore((s) => s.activePage);
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const setActivePage = useAppStore((s) => s.setActivePage);

  const navItems = [
    {
      id: 'home',
      label: 'Beranda',
      icon: <Home className="h-4 w-4" />,
      isActive: activePage === 'home',
      action: () => setActivePage('home'),
    },
    {
      id: 'celestial',
      label: 'Langit',
      icon: <Globe className="h-4 w-4" />,
      isActive: activePage === '3d' && viewMode === 'celestial',
      action: () => {
        setActivePage('3d');
        setViewMode('celestial');
      },
    },
    {
      id: 'waktu',
      label: 'Salat',
      icon: <Clock className="h-4 w-4" />,
      isActive: activePage === 'waktu',
      action: () => setActivePage('waktu'),
    },
    {
      id: 'kiblat',
      label: 'Kiblat',
      icon: <Compass className="h-4 w-4" />,
      isActive: activePage === 'kiblat',
      action: () => setActivePage('kiblat'),
    },
    {
      id: 'solarsystem',
      label: 'Surya',
      icon: <Orbit className="h-4 w-4" />,
      isActive: activePage === '3d' && viewMode === 'solarsystem',
      action: () => {
        setActivePage('3d');
        setViewMode('solarsystem');
      },
    },
    {
      id: 'kuis',
      label: 'Kuis',
      // Icon Kuis yang atraktif & berwibawa
      icon: <HelpCircle className="h-4 w-4" />,
      isActive: activePage === 'kuis',
      action: () => setActivePage('kuis'),
    },
    {
      id: 'panduan',
      label: 'Panduan',
      icon: <BookOpen className="h-4 w-4" />,
      isActive: activePage === 'panduan',
      action: () => setActivePage('panduan'),
    },
  ];

  return (
    <nav
      className="relative z-40 flex h-16 w-full shrink-0 items-center justify-around border-t border-slate-800/80 bg-[#091118]/95 px-1 pb-[env(safe-area-inset-bottom)] text-slate-400 backdrop-blur-xl md:h-14 md:px-4"
      aria-label="Navigasi Utama"
    >
      {navItems.map((item) => {
        return (
          <button
            key={item.id}
            onClick={item.action}
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-1 px-1 transition-all duration-200 select-none active:scale-95 ${
              item.isActive
                ? 'text-cyan-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {/* Active glowing indicator pill */}
            {item.isActive && (
              <>
                <span className="absolute -top-1.5 h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                <span className="absolute inset-x-1 inset-y-0.5 rounded-xl bg-cyan-500/10 -z-10" />
              </>
            )}

            <div
              className={`transition-transform duration-200 ${
                item.isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''
              }`}
            >
              {item.icon}
            </div>
            <span
              className={`text-[10px] tracking-tight leading-none ${
                item.isActive ? 'text-cyan-300 font-bold' : 'text-slate-400 font-medium'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
