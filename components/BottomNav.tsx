import { useAppStore } from '../lib/store';
import { Home, Globe, Clock, Compass, Orbit, HelpCircle, BookOpen } from 'lucide-react';

export function BottomNav() {
  const activePage = useAppStore((s) => s.activePage);
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const setActivePage = useAppStore((s) => s.setActivePage);
  
  const navItems = [
    { id: 'home', label: 'Beranda', icon: <Home className="h-4 w-4" />, action: () => setActivePage('home') },
    { id: 'celestial', label: 'Bola Langit', icon: <Globe className="h-4 w-4" />, action: () => { setActivePage('3d'); setViewMode('celestial'); } },
    { id: 'waktu', label: 'Waktu Salat', icon: <Clock className="h-4 w-4" />, action: () => setActivePage('waktu') },
    { id: 'kiblat', label: 'Kiblat', icon: <Compass className="h-4 w-4" />, action: () => setActivePage('kiblat') },
    { id: 'solarsystem', label: 'Tata Surya', icon: <Orbit className="h-4 w-4" />, action: () => { setActivePage('3d'); setViewMode('solarsystem'); } },
    { id: 'kuis', label: 'Kuis', icon: <HelpCircle className="h-4 w-4" />, action: () => setActivePage('kuis') },
    { id: 'panduan', label: 'Panduan', icon: <BookOpen className="h-4 w-4" />, action: () => setActivePage('panduan') },
  ];

  return (
    <div className="flex h-14 w-full items-center justify-around border-t border-slate-800 bg-[#0b141c] px-2 text-slate-400">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={item.action}
          className={`flex flex-col items-center gap-1 p-2 transition-colors ${
            (activePage === item.id) || (activePage === '3d' && viewMode === item.id)
              ? 'text-cyan-500' 
              : 'hover:text-slate-200'
          }`}
        >
          {item.icon}
          <span className="text-[10px] font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
}
