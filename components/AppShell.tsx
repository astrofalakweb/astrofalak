'use client';

import { useEffect, useState } from 'react';
import { ArrowUp, Camera, Compass, Eye, Gauge, Mouse, RotateCcw, SlidersHorizontal, Star, Sun, Clock, X } from 'lucide-react';
import { useAppStore, type CameraPreset } from '../lib/store';
import { Header } from './Header';
import { Scene3D } from './Scene3D';
import { HUD } from './HUD';
import { ControlPanel } from './ControlPanel';
import { PrayerTimes } from './PrayerTimes';
import { MonthlyScheduleModal } from './MonthlyScheduleModal';
import { SolarSystemHUD } from './SolarSystemHUD';
import { BottomNav } from './BottomNav';
import { HomeDashboard } from './HomeDashboard';
import { WaktuSalatPage } from './WaktuSalatPage';
import { KiblatPage } from './KiblatPage';
import { QuizPage } from './QuizPage';
import { LearnPage } from './LearnPage';

/**
 * Dua mesin jam TERISOLASI:
 * 1. Jam Bola Langit (store.date) — mode live atau simulasi manual.
 * 2. Jam Tata Surya (store.solarDate) — berdetak sendiri dengan kecepatannya sendiri (solarSpeed),
 *    sehingga tidak pernah memajukan tanggal waktu salat ataupun posisi bola langit!
 */
function useClock() {
  const mode = useAppStore((s) => s.mode);
  const playing = useAppStore((s) => s.playing);
  const solarPlaying = useAppStore((s) => s.solarPlaying);

  // Bola Langit clock
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

  // Tata Surya isolated clock
  useEffect(() => {
    if (solarPlaying) {
      const step = 50;
      const id = setInterval(() => {
        const s = useAppStore.getState();
        s.solarTick(new Date(s.solarDate.getTime() + s.solarSpeed * step));
      }, step);
      return () => clearInterval(id);
    }
  }, [solarPlaying]);
}

const CAMERA_BUTTONS: { key: CameraPreset; label: string; icon: React.ReactNode }[] = [
  { key: 'reset', label: 'Reset', icon: <RotateCcw className="h-3.5 w-3.5" /> },
  { key: 'zenith', label: 'Zenith', icon: <ArrowUp className="h-3.5 w-3.5" /> },
  { key: 'klu', label: 'KLU', icon: <Star className="h-3.5 w-3.5" /> },
  { key: 'sun', label: 'Matahari', icon: <Sun className="h-3.5 w-3.5" /> },
  { key: 'qibla', label: 'Kiblat', icon: <Compass className="h-3.5 w-3.5" /> },
  { key: 'horizon', label: 'Ufuk', icon: <Eye className="h-3.5 w-3.5" /> },
];

export default function AppShell() {
  useClock();
  const panels = useAppStore((s) => s.panels);
  const modal = useAppStore((s) => s.modal);
  const moveCamera = useAppStore((s) => s.moveCamera);
  const viewMode = useAppStore((s) => s.viewMode);
  const activePage = useAppStore((s) => s.activePage);
  const mobileSheet = useAppStore((s) => s.mobileSheet);
  const setMobileSheet = useAppStore((s) => s.setMobileSheet);

  const [showMobileCam, setShowMobileCam] = useState(false);

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] w-full flex-col overflow-hidden bg-slate-950 text-slate-100">
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

                {/* DESKTOP FLOATING PANELS (hanya di layar besar lg ke atas agar tidak saling tumpang tindih) */}
                {panels.hud && <HUD />}
                {panels.control && <ControlPanel />}
                {panels.prayer && <PrayerTimes />}

                {/* DESKTOP CAMERA BAR (posisi tengah atas di antara HUD & ControlPanel, tidak pernah menabrak PrayerTimes) */}
                <div className="hidden lg:flex absolute top-16 left-1/2 -translate-x-1/2 z-20 items-center gap-1.5 rounded-full border border-slate-700/80 bg-slate-900/85 px-3 py-1.5 shadow-xl backdrop-blur-md">
                  {CAMERA_BUTTONS.map((b) => (
                    <button
                      key={b.key}
                      onClick={() => moveCamera(b.key)}
                      className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 text-[11px] font-medium text-slate-300 hover:border-cyan-500/60 hover:text-white active:scale-95 transition"
                    >
                      {b.icon} {b.label}
                    </button>
                  ))}
                </div>

                {/* Petunjuk kontrol mouse desktop */}
                <div className="pointer-events-none absolute left-4 bottom-3 z-10 hidden items-center gap-3 text-[10px] text-slate-500 lg:flex">
                  <span className="flex items-center gap-1">
                    <Mouse className="h-3 w-3" /> Drag: putar
                  </span>
                  <span>Scroll: zoom</span>
                  <span>Klik kanan: geser</span>
                </div>

                {/* MOBILE / TABLET FLOATING TOOLBAR (layar < lg) */}
                <div className="pointer-events-auto absolute bottom-3 left-3 right-3 z-20 flex flex-col items-center gap-2 lg:hidden">
                  {/* Camera Angle Bar on mobile when opened */}
                  {showMobileCam && (
                    <div className="flex w-full items-center justify-between gap-1 overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-md animate-sheet-up scrollbar-hide">
                      {CAMERA_BUTTONS.map((b) => (
                        <button
                          key={b.key}
                          onClick={() => {
                            moveCamera(b.key);
                            setShowMobileCam(false);
                          }}
                          className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-[11px] text-slate-300 hover:text-white active:scale-95"
                        >
                          {b.icon} {b.label}
                        </button>
                      ))}
                      <button
                        onClick={() => setShowMobileCam(false)}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Tutup Kamera"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Quick Panel Buttons */}
                  <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700/80 bg-slate-900/90 px-3 py-1.5 shadow-2xl backdrop-blur-xl">
                    <button
                      onClick={() => {
                        setShowMobileCam(false);
                        setMobileSheet(mobileSheet === 'hud' ? null : 'hud');
                      }}
                      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
                        mobileSheet === 'hud'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Gauge className="h-3.5 w-3.5 text-cyan-400" />
                      <span>HUD</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileCam(false);
                        setMobileSheet(mobileSheet === 'control' ? null : 'control');
                      }}
                      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
                        mobileSheet === 'control'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
                      <span>Kontrol</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowMobileCam(false);
                        setMobileSheet(mobileSheet === 'prayer' ? null : 'prayer');
                      }}
                      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
                        mobileSheet === 'prayer'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Salat</span>
                    </button>

                    <div className="h-4 w-px bg-slate-800" />

                    <button
                      onClick={() => setShowMobileCam(!showMobileCam)}
                      className={`flex items-center gap-1 rounded-xl p-1.5 text-xs transition ${
                        showMobileCam ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-white'
                      }`}
                      title="Kamera Sudut Pandang"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* MOBILE / TABLET BOTTOM SHEET DRAWER (layar < lg) */}
                {mobileSheet && (
                  <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden">
                    {/* Backdrop */}
                    <div
                      className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
                      onClick={() => setMobileSheet(null)}
                    />

                    {/* Sheet Content */}
                    <div className="relative z-10 flex max-h-[80dvh] w-full flex-col rounded-t-3xl border-t border-slate-700/80 bg-slate-900/98 shadow-2xl backdrop-blur-2xl animate-sheet-up">
                      {/* Drag handle */}
                      <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-slate-700" />

                      <div className="flex-1 overflow-y-auto">
                        {mobileSheet === 'hud' && <HUD onClose={() => setMobileSheet(null)} isSheet />}
                        {mobileSheet === 'control' && <ControlPanel onClose={() => setMobileSheet(null)} isSheet />}
                        {mobileSheet === 'prayer' && <PrayerTimes onClose={() => setMobileSheet(null)} isSheet />}
                      </div>
                    </div>
                  </div>
                )}
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
