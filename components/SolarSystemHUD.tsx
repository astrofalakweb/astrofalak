'use client';

import { useState } from 'react';
import { useAppStore, SOLAR_SPEEDS } from '../lib/store';
import { Play, Pause, ChevronDown, Check, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

const PLANET_INFO: Record<string, { desc: string; radius: string; period: string; dist: string }> = {
  Matahari: { desc: 'Bintang pusat tata surya kita.', radius: '696.340 km', period: '-', dist: '0 SA' },
  Merkurius: { desc: 'Planet terdekat dari Matahari, sangat panas di siang hari.', radius: '2.439 km', period: '88 hari', dist: '0.39 SA' },
  Venus: { desc: 'Planet paling terang, dengan atmosfer sangat tebal beracun.', radius: '6.051 km', period: '225 hari', dist: '0.72 SA' },
  Bumi: { desc: 'Satu-satunya planet yang diketahui berpenghuni.', radius: '6.371 km', period: '365,25 hari', dist: '1 SA (149.6 juta km)' },
  Mars: { desc: 'Planet merah dengan gunung berapi terbesar di tata surya.', radius: '3.389 km', period: '687 hari', dist: '1.52 SA' },
  Jupiter: { desc: 'Planet gas raksasa terbesar di tata surya.', radius: '69.911 km', period: '11,8 tahun', dist: '5.20 SA' },
  Saturnus: { desc: 'Planet gas dengan sistem cincin yang sangat indah.', radius: '58.232 km', period: '29,5 tahun', dist: '9.58 SA' },
  Uranus: { desc: 'Raksasa es yang berputar miring pada sumbunya.', radius: '25.362 km', period: '84 tahun', dist: '19.22 SA' },
  Neptunus: { desc: 'Planet terjauh, berwarna biru gelap dengan angin kencang.', radius: '24.622 km', period: '165 tahun', dist: '30.05 SA' },
  Pluto: { desc: 'Planet kerdil di Sabuk Kuiper dengan orbit sangat lonjong.', radius: '1.188 km', period: '248 tahun', dist: '39.5 SA' },
  Bulan: { desc: 'Satelit alami Bumi yang mengatur pasang surut air laut.', radius: '1.737 km', period: '27,3 hari (mengelilingi Bumi)', dist: '384.400 km (dari Bumi)' },
};

export function SolarSystemHUD() {
  // Sistem waktu Tata Surya mandiri — TIDAK mempengaruhi waktu salat atau bola langit
  const solarDate = useAppStore((s) => s.solarDate);
  const solarPlaying = useAppStore((s) => s.solarPlaying);
  const setSolarPlaying = useAppStore((s) => s.setSolarPlaying);
  const solarSpeed = useAppStore((s) => s.solarSpeed);
  const setSolarSpeed = useAppStore((s) => s.setSolarSpeed);
  const solarNow = useAppStore((s) => s.solarNow);

  const focusPlanet = useAppStore((s) => s.focusPlanet);
  const setFocusPlanet = useAppStore((s) => s.setFocusPlanet);
  const layers = useAppStore((s) => s.layers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);
  const triggerSolarZoom = useAppStore((s) => s.triggerSolarZoom);

  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);

  const formatStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(solarDate);

  const timeStr = `${solarDate.getHours().toString().padStart(2, '0')}.${solarDate
    .getMinutes()
    .toString()
    .padStart(2, '0')}.${solarDate.getSeconds().toString().padStart(2, '0')}`;

  const currentSpeedObj = SOLAR_SPEEDS.find((s) => s.value === solarSpeed) || SOLAR_SPEEDS[2];
  const info = focusPlanet && PLANET_INFO[focusPlanet];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-sans text-slate-100">
      {/* HEADER ATAS */}
      <div className="pointer-events-auto absolute left-3 top-3 right-3 flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-wide text-white drop-shadow-md sm:text-lg">Penjelajah Tata Surya</h1>
            <span className="rounded border border-pink-500/40 bg-pink-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-pink-300">
              ORBIT 3D
            </span>
          </div>
          <div className="font-mono text-[11px] text-slate-300 drop-shadow-md">
            {formatStr} pukul {timeStr}
          </div>
        </div>

        {/* Quick Reset Time */}
        <button
          onClick={solarNow}
          title="Reset ke waktu sekarang"
          className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 shadow backdrop-blur-md hover:border-cyan-500 hover:text-white active:scale-95"
        >
          <RotateCcw className="h-3 w-3" /> Sekarang
        </button>
      </div>

      {/* PLANET SELECTOR HORIZONTAL BAR */}
      <div className="pointer-events-auto absolute left-3 right-3 top-16 flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        {Object.keys(PLANET_INFO).map((p) => {
          const isSelected = focusPlanet === p;
          return (
            <button
              key={p}
              onClick={() => setFocusPlanet(isSelected ? null : p)}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur-md transition-all active:scale-95 ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-600 text-white shadow-cyan-500/25'
                  : 'border-slate-800 bg-slate-900/85 text-slate-300 hover:border-slate-700 hover:text-white'
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* INFO PLANET (MODAL KECIL / CARD) */}
      {info && (
        <div className="pointer-events-auto absolute bottom-20 left-3 right-3 max-w-sm rounded-xl border border-slate-800 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-md sm:right-auto sm:w-[300px]">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-cyan-400">{focusPlanet}</h3>
            <button
              onClick={() => setFocusPlanet(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          <p className="my-2 text-xs leading-relaxed text-slate-300">{info.desc}</p>
          <div className="flex flex-col gap-1 border-t border-slate-800/80 pt-2 text-[11px] text-slate-400">
            <div className="flex justify-between">
              <span className="text-slate-500">Jari-jari:</span>
              <span className="font-medium text-slate-200">{info.radius}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Periode orbit:</span>
              <span className="font-medium text-slate-200">{info.period}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Jarak:</span>
              <span className="font-medium text-slate-200">{info.dist}</span>
            </div>
          </div>

          {/* Zoom Buttons inside Planet Card */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
            <span className="text-[10px] text-slate-400 font-medium">Jarak Pandang:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => triggerSolarZoom('in')}
                title="Perbesar / Lihat Lebih Dekat"
                className="flex items-center gap-1 rounded-md border border-cyan-500/40 bg-cyan-500/15 px-2 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/25 active:scale-95 transition"
              >
                <ZoomIn className="h-3 w-3" /> Dekat
              </button>
              <button
                onClick={() => triggerSolarZoom('out')}
                title="Perkecil / Zoom Out"
                className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-[11px] font-bold text-slate-300 hover:bg-slate-700 active:scale-95 transition"
              >
                <ZoomOut className="h-3 w-3" /> Jauh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM CONTROL BAR */}
      <div className="pointer-events-auto absolute bottom-4 left-3 right-3 flex flex-wrap items-center justify-between gap-2 sm:justify-start">
        <div className="relative flex items-center rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-md backdrop-blur-md">
          {/* Play/Pause */}
          <button
            onClick={() => setSolarPlaying(!solarPlaying)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-cyan-400 active:scale-95"
          >
            {solarPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current" />}
            <span className="hidden sm:inline">{solarPlaying ? 'Jeda' : 'Putar'}</span>
          </button>

          {/* Speed Selector (Custom Dark Popover Menu instead of native Android dialog) */}
          <div className="relative border-l border-slate-800">
            <button
              onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
              className="flex items-center gap-1 px-3 py-2 text-[11px] font-medium text-slate-300 hover:text-white"
            >
              <span>{currentSpeedObj.label}</span>
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${speedMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {speedMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setSpeedMenuOpen(false)}
                />
                <div className="absolute bottom-full left-0 z-40 mb-2 w-48 rounded-xl border border-slate-700 bg-slate-900/95 p-1.5 shadow-2xl backdrop-blur-xl animate-sheet-up">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Kecepatan Simulasi
                  </div>
                  {SOLAR_SPEEDS.map((sp) => (
                    <button
                      key={sp.value}
                      onClick={() => {
                        setSolarSpeed(sp.value);
                        setSpeedMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition ${
                        sp.value === solarSpeed
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{sp.label}</span>
                      {sp.value === solarSpeed && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Zoom In / Out Controls */}
        <div className="flex items-center rounded-xl border border-slate-700/80 bg-slate-900/90 shadow-md backdrop-blur-md">
          <button
            onClick={() => triggerSolarZoom('out')}
            title="Zoom Out (Menjauh)"
            className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:text-white active:scale-95 transition"
          >
            <ZoomOut className="h-3.5 w-3.5" />
            <span className="text-[11px]">Zoom Out</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <button
            onClick={() => triggerSolarZoom('in')}
            title="Zoom In (Mendekat)"
            className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:text-white active:scale-95 transition"
          >
            <ZoomIn className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[11px]">Zoom In</span>
          </button>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/90 px-3 py-2 text-[11px] backdrop-blur-md shadow-md">
          <label className="flex cursor-pointer items-center gap-1.5 text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={layers.grid}
              onChange={() => toggleLayer('grid')}
              className="accent-cyan-500"
            />
            <span>Garis edar</span>
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={layers.labels}
              onChange={() => toggleLayer('labels')}
              className="accent-cyan-500"
            />
            <span>Label</span>
          </label>
        </div>
      </div>
    </div>
  );
}
