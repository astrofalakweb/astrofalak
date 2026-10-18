'use client';

import { CalendarDays, Clock, Expand, Eye, EyeOff, Gauge, MapPin, Orbit, SlidersHorizontal } from 'lucide-react';
import { useAppStore, type PanelKey } from '../lib/store';
import { useAstro } from '../lib/useAstro';
import { latLabel, lonLabel } from '../lib/falak/format';
import { fmtDateShort, fmtHMS, tzLabel } from '../lib/falak/time';

export function Header() {
  const { date, loc } = useAstro();
  const mode = useAppStore((s) => s.mode);
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const playing = useAppStore((s) => s.playing);
  const panels = useAppStore((s) => s.panels);
  const togglePanel = useAppStore((s) => s.togglePanel);
  const openModal = useAppStore((s) => s.openModal);

  const toggles: { key: PanelKey; label: string; icon: React.ReactNode }[] = [
    { key: 'hud', label: 'HUD', icon: <Gauge className="h-3.5 w-3.5" /> },
    { key: 'control', label: 'Kontrol', icon: <SlidersHorizontal className="h-3.5 w-3.5" /> },
    { key: 'prayer', label: 'Waktu Salat', icon: <Clock className="h-3.5 w-3.5" /> },
  ];

  const isAnyPanelOpen = panels.hud || panels.control || panels.prayer;
  const toggleAllPanels = () => {
    if (isAnyPanelOpen) {
      useAppStore.setState({ panels: { hud: false, control: false, prayer: false } });
    } else {
      useAppStore.setState({ panels: { hud: false, control: true, prayer: true } });
    }
  };

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => undefined);
  };

  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/95 px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-cyan-500/20">
          <Orbit className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-sm font-bold">
            AstroFalak
            <span className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 text-[9px] font-semibold text-cyan-300">WEBGL 3D</span>
          </h1>
          <p className="hidden truncate text-[10px] text-slate-400 md:block">Visualisasi Bola Langit & Hisab Falak Standar Kemenag RI</p>
        </div>
      </div>

      <div className="hidden items-center gap-2 lg:flex">
        <div className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs">
          <MapPin className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-semibold">{loc.name}</span>
          <span className="text-[10px] text-slate-500">({latLabel(loc.lat)}, {lonLabel(loc.lon)}, {tzLabel(loc.tz)})</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs">
          <CalendarDays className="h-3.5 w-3.5 text-cyan-400" />
          <span>{fmtDateShort(date, loc.tz)}</span>
          <span className="text-slate-600">|</span>
          <span className="font-mono font-bold text-cyan-300">{fmtHMS(date, loc.tz)}</span>
          {mode === 'live' ? (
            <span className="rounded border border-emerald-500/60 bg-emerald-500/15 px-1.5 text-[9px] font-bold text-emerald-300">LIVE</span>
          ) : (
            <span className="rounded border border-amber-500/60 bg-amber-500/15 px-1.5 text-[9px] font-bold text-amber-300">{playing ? 'ANIMASI' : 'SIMULASI'}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {toggles.map((t) => (
          <button
            key={t.key}
            onClick={() => togglePanel(t.key)}
            className={`hidden items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition lg:flex ${
              panels[t.key] ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-300' : 'border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}

        {/* Tombol Mode Bersih / Immersive (1 klik sembunyikan semua kontrol) */}
        <button
          title={isAnyPanelOpen ? 'Mode Bersih (Sembunyikan Semua Panel agar Bola Langit Tidak Tertutup)' : 'Tampilkan Panel Kontrol'}
          onClick={toggleAllPanels}
          className={`hidden items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition lg:flex ${
            !isAnyPanelOpen
              ? 'border-emerald-500/80 bg-emerald-500/20 text-emerald-300 shadow-md shadow-emerald-500/20'
              : 'border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          {!isAnyPanelOpen ? <Eye className="h-3.5 w-3.5 text-emerald-400" /> : <EyeOff className="h-3.5 w-3.5" />}
          <span className="hidden xl:inline">{!isAnyPanelOpen ? 'Layar Bersih' : 'Sembunyikan'}</span>
        </button>
        <div className="mx-1 hidden h-6 w-px bg-slate-800 lg:block" />
        
        {/* Toggle Mode Pandangan */}
        <div className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 p-0.5 sm:p-1">
          <button
            onClick={() => setViewMode('celestial')}
            className={`rounded px-2 py-1 text-[10px] font-semibold transition ${
              viewMode === 'celestial' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="hidden sm:inline">BOLA </span>LANGIT
          </button>
          <button
            onClick={() => setViewMode('solarsystem')}
            className={`rounded px-2 py-1 text-[10px] font-semibold transition ${
              viewMode === 'solarsystem' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="hidden sm:inline">TATA </span>SURYA
          </button>
        </div>

        <div className="mx-1 hidden h-6 w-px bg-slate-800 sm:block" />
        
        <button title="Layar penuh" onClick={fullscreen} className="rounded-md p-1.5 text-slate-400 hover:text-slate-100">
          <Expand className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
