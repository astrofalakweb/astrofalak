'use client';

import { useEffect } from 'react';
import { ArrowUp, Compass, Eye, Mouse, RotateCcw, Star, Sun } from 'lucide-react';
import { useAppStore, type CameraPreset } from '../lib/store';
import { Header } from './Header';
import { Scene3D } from './Scene3D';
import { HUD } from './HUD';
import { ControlPanel } from './ControlPanel';
import { PrayerTimes } from './PrayerTimes';
import { QuizModal } from './QuizModal';
import { LearnModal } from './LearnModal';
import { MonthlyScheduleModal } from './MonthlyScheduleModal';

/** Mesin jam: mode live (1 Hz) atau animasi dipercepat. */
function useClock() {
  const mode = useAppStore((s) => s.mode);
  const playing = useAppStore((s) => s.playing);

  useEffect(() => {
    const { tick } = useAppStore.getState();
    if (mode === 'live') {
      tick(new Date());
      const id = setInterval(() => tick(new Date()), 1000);
      return () => clearInterval(id);
    }
    if (playing) {
      const step = 50;
      const id = setInterval(() => {
        const s = useAppStore.getState();
        s.tick(new Date(s.date.getTime() + s.speed * step));
      }, step);
      return () => clearInterval(id);
    }
  }, [mode, playing]);
}

const CAMERA_BUTTONS: { key: CameraPreset; label: string; icon: React.ReactNode }[] = [
  { key: 'reset', label: 'Reset', icon: <RotateCcw className="h-3.5 w-3.5" /> },
  { key: 'zenith', label: 'Zenith', icon: <ArrowUp className="h-3.5 w-3.5" /> },
  { key: 'klu', label: 'KLU', icon: <Star className="h-3.5 w-3.5" /> },
  { key: 'sun', label: 'Matahari', icon: <Sun className="h-3.5 w-3.5" /> },
  { key: 'qibla', label: 'Kiblat', icon: <Compass className="h-3.5 w-3.5" /> },
  { key: 'horizon', label: 'Ufuk', icon: <Eye className="h-3.5 w-3.5" /> },
];

import { SolarSystemHUD } from './SolarSystemHUD';
import { BottomNav } from './BottomNav';
import { HomeDashboard } from './HomeDashboard';
import { WaktuSalatPage } from './WaktuSalatPage';
import { KiblatPage } from './KiblatPage';
import { QuizPage } from './QuizPage';
import { LearnPage } from './LearnPage';

export default function AppShell() {
  useClock();
  const panels = useAppStore((s) => s.panels);
  const modal = useAppStore((s) => s.modal);
  const moveCamera = useAppStore((s) => s.moveCamera);
  const viewMode = useAppStore((s) => s.viewMode);
  const activePage = useAppStore((s) => s.activePage);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <main className="relative flex-1 overflow-hidden">
        {activePage === 'home' && <HomeDashboard />}
        {activePage === 'waktu' && <WaktuSalatPage />}
        {activePage === 'kiblat' && <KiblatPage />}
        {activePage === 'kuis' && <QuizPage />}
        {activePage === 'panduan' && <LearnPage />}
        
        {activePage === '3d' && (
          <>
            <Scene3D />
            
            {viewMode === 'solarsystem' && <SolarSystemHUD />}

            {viewMode === 'celestial' && (
              <>
                <Header />
                {panels.hud && <HUD />}
                {panels.control && <ControlPanel />}
                {panels.prayer && <PrayerTimes />}

                <div className={`absolute right-4 z-20 flex flex-wrap justify-end gap-1.5 ${panels.prayer ? 'bottom-[13.5rem] lg:bottom-[10.5rem]' : 'bottom-4'}`}>
                  {CAMERA_BUTTONS.map((b) => (
                    <button key={b.key} onClick={() => moveCamera(b.key)}
                      className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-300 backdrop-blur hover:border-cyan-500/60 hover:text-white">
                      {b.icon} {b.label}
                    </button>
                  ))}
                </div>

                <div className={`pointer-events-none absolute left-4 z-10 hidden items-center gap-3 text-[10px] text-slate-500 md:flex ${panels.prayer ? 'bottom-[13.5rem] lg:bottom-[10.5rem]' : 'bottom-4'}`}>
                  <span className="flex items-center gap-1"><Mouse className="h-3 w-3" /> Drag: putar</span>
                  <span>Scroll: zoom</span>
                  <span>Klik kanan + drag: geser</span>
                </div>
              </>
            )}
          </>
        )}
      </main>

      <BottomNav />

      {modal?.type === 'monthly' && <MonthlyScheduleModal />}
    </div>
  );
}
