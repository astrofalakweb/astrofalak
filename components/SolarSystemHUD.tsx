'use client';

import { useState, useEffect } from 'react';
import { useAppStore, SOLAR_SPEEDS } from '../lib/store';
import {
  Play,
  Pause,
  ChevronDown,
  Check,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Info,
  X,
  Orbit,
  Tag,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const PLANET_COLORS: Record<string, string> = {
  Matahari: '#f59e0b',
  Merkurius: '#94a3b8',
  Venus: '#facc15',
  Bumi: '#38bdf8',
  Bulan: '#cbd5e1',
  Mars: '#f87171',
  Jupiter: '#fb923c',
  Saturnus: '#eab308',
  Uranus: '#2dd4bf',
  Neptunus: '#60a5fa',
  Pluto: '#93c5fd',
};

const PLANET_INFO: Record<
  string,
  { desc: string; radius: string; period: string; dist: string; type: string }
> = {
  Matahari: {
    type: 'Bintang Pusat',
    desc: 'Bintang pusat tata surya penghasil gravitasi dan energi utama kehidupan.',
    radius: '696.340 km',
    period: '-',
    dist: '0 SA',
  },
  Merkurius: {
    type: 'Planet Terestrial',
    desc: 'Planet terkecil dan terdekat dari Matahari dengan kawah mirip Bulan.',
    radius: '2.439 km',
    period: '88 hari',
    dist: '0.39 SA',
  },
  Venus: {
    type: 'Planet Terestrial',
    desc: 'Planet terpanas dengan atmosfer CO2 tebal dan rotasi berlawanan arah.',
    radius: '6.051 km',
    period: '225 hari',
    dist: '0.72 SA',
  },
  Bumi: {
    type: 'Planet Terestrial',
    desc: 'Satu-satunya dunia dengan air cair di permukaan dan kehidupan.',
    radius: '6.371 km',
    period: '365,25 hari',
    dist: '1 SA (149.6 jt km)',
  },
  Bulan: {
    type: 'Satelit Alami',
    desc: 'Satelit alami Bumi yang menjaga kestabilan sumbu putar planet kita.',
    radius: '1.737 km',
    period: '27,3 hari',
    dist: '384.400 km',
  },
  Mars: {
    type: 'Planet Terestrial',
    desc: 'Planet merah dengan ngarai dan gunung berapi terbesar di tata surya.',
    radius: '3.389 km',
    period: '687 hari',
    dist: '1.52 SA',
  },
  Jupiter: {
    type: 'Raksasa Gas',
    desc: 'Planet terbesar pelindung tata surya dengan Bintik Merah Raksasa.',
    radius: '69.911 km',
    period: '11,8 tahun',
    dist: '5.20 SA',
  },
  Saturnus: {
    type: 'Raksasa Gas',
    desc: 'Planet gas spektakuler dengan sistem cincin es paling megah.',
    radius: '58.232 km',
    period: '29,5 tahun',
    dist: '9.58 SA',
  },
  Uranus: {
    type: 'Raksasa Es',
    desc: 'Raksasa es berwarna toska dengan poros rotasi miring ekstrem 98°.',
    radius: '25.362 km',
    period: '84 tahun',
    dist: '19.22 SA',
  },
  Neptunus: {
    type: 'Raksasa Es',
    desc: 'Planet terjauh berwarna biru laut dengan badai angin berkecepatan supersonik.',
    radius: '24.622 km',
    period: '165 tahun',
    dist: '30.05 SA',
  },
  Pluto: {
    type: 'Planet Kerdil',
    desc: 'Planet kerdil beku di Sabuk Kuiper dengan dataran es nitrogen berbentuk hati.',
    radius: '1.188 km',
    period: '248 tahun',
    dist: '39.5 SA',
  },
};

export function SolarSystemHUD() {
  const solarDate = useAppStore((s) => s.solarDate);
  const solarPlaying = useAppStore((s) => s.solarPlaying);
  const setSolarPlaying = useAppStore((s) => s.setSolarPlaying);
  const solarSpeed = useAppStore((s) => s.solarSpeed);
  const setSolarSpeed = useAppStore((s) => s.setSolarSpeed);
  const solarTick = useAppStore((s) => s.solarTick);
  const solarNow = useAppStore((s) => s.solarNow);
  const shiftSolarDays = useAppStore((s) => s.shiftSolarDays);

  const focusPlanet = useAppStore((s) => s.focusPlanet);
  const setFocusPlanet = useAppStore((s) => s.setFocusPlanet);
  const layers = useAppStore((s) => s.layers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);
  const triggerSolarZoom = useAppStore((s) => s.triggerSolarZoom);

  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [isCardMinimized, setIsCardMinimized] = useState(false);

  // Ketika pengguna memilih planet baru, buka kartu info secara otomatis
  useEffect(() => {
    if (focusPlanet) {
      setIsCardMinimized(false);
    }
  }, [focusPlanet]);

  const formatStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(solarDate);

  const timeStr = `${solarDate.getHours().toString().padStart(2, '0')}.${solarDate
    .getMinutes()
    .toString()
    .padStart(2, '0')}.${solarDate.getSeconds().toString().padStart(2, '0')}`;

  const currentSpeedObj = SOLAR_SPEEDS.find((s) => s.value === solarSpeed) || SOLAR_SPEEDS[2];
  const info = focusPlanet && PLANET_INFO[focusPlanet];
  const currentColor = (focusPlanet && PLANET_COLORS[focusPlanet]) || '#38bdf8';

  // Fungsi pengatur waktu animasi manual
  const shiftDays = (days: number) => {
    shiftSolarDays(days);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-sans text-slate-100 select-none overflow-hidden">
      {/* HEADER ATAS TERPADU (UNIFIED TOP HUD CONTAINER)
          Menggabungkan info judul, waktu, kontrol navigasi hari, dan selektor planet
          dalam satu flex container alami sehingga TIDAK AKAN PERNAH bertabrakan/tumpang tindih di layar HP */}
      <div className="pointer-events-auto absolute top-0 inset-x-0 z-20 flex flex-col gap-2 bg-gradient-to-b from-slate-950/95 via-slate-950/80 to-transparent pt-2.5 pb-3 px-3 sm:px-4 backdrop-blur-[2px] sm:backdrop-blur-none">
        {/* BARIS 1: JUDUL, WAKTU & KONTROL HARI */}
        <div className="flex items-center justify-between gap-2">
          {/* Info Judul & Tanggal */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-xs sm:text-sm font-bold tracking-wide text-white drop-shadow truncate">
                <span className="sm:hidden">Tata Surya</span>
                <span className="hidden sm:inline">Penjelajah Tata Surya</span>
              </h1>
              <span className="shrink-0 rounded-full border border-pink-500/40 bg-pink-500/15 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-bold text-pink-300">
                ORBIT 3D
              </span>
            </div>
            <div className="font-mono text-[10px] sm:text-[11px] font-semibold text-cyan-300 drop-shadow truncate">
              {formatStr} <span className="text-slate-500">•</span> {timeStr}
            </div>
          </div>

          {/* Kontrol Navigasi Waktu Animasi (Maju/Mundur Hari & Reset Sekarang) */}
          <div className="shrink-0 flex items-center gap-0.5 rounded-xl border border-slate-800/90 bg-slate-900/90 p-0.5 sm:p-1 shadow-lg backdrop-blur-xl">
            <button
              onClick={() => shiftDays(-1)}
              title="Mundur 1 Hari"
              aria-label="Mundur 1 Hari"
              className="flex h-6 sm:h-7 items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-950/60 px-1.5 sm:px-2 text-[10px] sm:text-xs font-medium text-slate-300 hover:border-cyan-500 hover:text-white active:scale-95 transition"
            >
              <ChevronLeft className="h-3 w-3" />
              <span className="hidden sm:inline">-1 Hari</span>
            </button>

            <button
              onClick={solarNow}
              title="Reset ke waktu saat ini"
              aria-label="Reset ke waktu saat ini"
              className="flex h-6 sm:h-7 items-center justify-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/15 px-2 sm:px-2.5 text-[10px] sm:text-xs font-semibold text-cyan-300 hover:bg-cyan-500/25 active:scale-95 transition"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Sekarang</span>
            </button>

            <button
              onClick={() => shiftDays(1)}
              title="Maju 1 Hari"
              aria-label="Maju 1 Hari"
              className="flex h-6 sm:h-7 items-center justify-center gap-1 rounded-lg border border-slate-800 bg-slate-950/60 px-1.5 sm:px-2 text-[10px] sm:text-xs font-medium text-slate-300 hover:border-cyan-500 hover:text-white active:scale-95 transition"
            >
              <span className="hidden sm:inline">+1 Hari</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* BARIS 2: SELEKTOR PLANET HORIZONTAL CAROUSEL */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-hide -mx-1 px-1 touch-pan-x">
          {/* Tombol Ikhtisar Seluruh Tata Surya */}
          <button
            onClick={() => setFocusPlanet(null)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-bold shadow-sm backdrop-blur-md transition-all active:scale-95 ${
              !focusPlanet
                ? 'border-cyan-400 bg-cyan-600/90 text-white shadow-cyan-500/30 ring-2 ring-cyan-400/40'
                : 'border-slate-800/90 bg-slate-900/85 text-slate-300 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Orbit className="h-3 w-3 text-cyan-300" />
            <span>Tata Surya</span>
          </button>

          {/* Tombol Setiap Planet */}
          {Object.keys(PLANET_INFO).map((p) => {
            const isSelected = focusPlanet === p;
            const color = PLANET_COLORS[p] || '#38bdf8';
            return (
              <button
                key={p}
                onClick={() => setFocusPlanet(isSelected ? null : p)}
                className={`shrink-0 flex items-center gap-1.5 rounded-full border px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold shadow-sm backdrop-blur-md transition-all active:scale-95 ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-600/90 text-white shadow-cyan-500/30 ring-2 ring-cyan-400/40'
                    : 'border-slate-800/90 bg-slate-900/85 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0 shadow-[0_0_5px_currentColor]"
                  style={{ backgroundColor: color, color }}
                />
                <span>{p}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* MINI FLOATING CHIP KETIKA KARTU INFO DIMINIMALKAN */}
      {focusPlanet && isCardMinimized && (
        <div className="pointer-events-auto absolute bottom-16 sm:bottom-4 left-3 sm:left-4 z-20 flex items-center gap-2 rounded-full border border-cyan-500/50 bg-slate-950/90 py-1.5 px-3 shadow-2xl backdrop-blur-xl animate-sheet-up">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor] animate-pulse"
              style={{ backgroundColor: currentColor, color: currentColor }}
            />
            <span className="text-xs font-bold text-white">{focusPlanet}</span>
          </div>

          <div className="h-3 w-px bg-slate-700" />

          <button
            onClick={() => setIsCardMinimized(false)}
            className="flex items-center gap-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 hover:bg-cyan-500/30 active:scale-95 transition"
          >
            <ChevronUp className="h-3 w-3" /> Info
          </button>

          <button
            onClick={() => setFocusPlanet(null)}
            title="Kembali ke tampilan seluruh tata surya"
            className="flex items-center gap-1 rounded-full bg-slate-800/80 px-2.5 py-0.5 text-[10px] font-medium text-slate-300 hover:text-white active:scale-95 transition"
          >
            <Orbit className="h-2.5 w-2.5" /> Tata Surya
          </button>
        </div>
      )}

      {/* KARTU INFO PLANET LENGKAP */}
      {info && !isCardMinimized && (
        <div className="pointer-events-auto absolute bottom-16 sm:bottom-4 left-3 right-3 sm:right-auto sm:w-[310px] z-20 rounded-2xl border border-slate-800/90 bg-slate-950/92 p-3.5 shadow-2xl backdrop-blur-xl animate-sheet-up transition-all">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
            <div className="flex items-center gap-2">
              <span
                className="h-3 w-3 rounded-full shadow-[0_0_8px_currentColor]"
                style={{ backgroundColor: currentColor, color: currentColor }}
              />
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">{focusPlanet}</h3>
                <span className="text-[10px] font-medium text-cyan-400/90">{info.type}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setFocusPlanet(null)}
                title="Keluar ke ikhtisar seluruh tata surya"
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10px] font-medium text-slate-400 hover:border-cyan-500 hover:text-white transition"
              >
                <Orbit className="h-3 w-3" />
                <span className="hidden sm:inline">Ikhtisar</span>
              </button>

              <button
                onClick={() => setIsCardMinimized(true)}
                title="Sembunyikan kartu info (kamera tetap fokus melihat planet)"
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white active:scale-95 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Deskripsi Singkat */}
          <p className="my-2 text-[11px] leading-relaxed text-slate-300">{info.desc}</p>

          {/* Grid Telemetri Data 3-Kolom yang Kompak */}
          <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-800/80 bg-slate-900/60 p-2 text-center text-[10px]">
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-medium">Jari-jari</span>
              <span className="font-bold text-slate-200 truncate" title={info.radius}>
                {info.radius}
              </span>
            </div>
            <div className="flex flex-col border-x border-slate-800/80 px-1">
              <span className="text-[9px] text-slate-500 font-medium">Periode</span>
              <span className="font-bold text-slate-200 truncate" title={info.period}>
                {info.period}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 font-medium">Jarak</span>
              <span className="font-bold text-slate-200 truncate" title={info.dist}>
                {info.dist}
              </span>
            </div>
          </div>

          {/* Zoom Buttons inside Planet Card */}
          <div className="mt-2.5 flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400 font-medium">Jarak Pandang:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => triggerSolarZoom('in')}
                title="Perbesar / Lihat Lebih Dekat"
                className="flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-2 py-1 text-[10px] font-bold text-cyan-300 hover:bg-cyan-500/25 active:scale-95 transition"
              >
                <ZoomIn className="h-3 w-3" /> Dekat
              </button>
              <button
                onClick={() => triggerSolarZoom('out')}
                title="Perkecil / Zoom Out"
                className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1 text-[10px] font-bold text-slate-300 hover:bg-slate-800 active:scale-95 transition"
              >
                <ZoomOut className="h-3 w-3" /> Jauh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM CONTROL DOCK:
          - Pada Mobile: Dock ringkas di bagian bawah
          - Pada Desktop: Dock elegan berposisi tengah bawah (center-dock) bebas dari tumpang tindih */}
      <div className="pointer-events-auto absolute bottom-2.5 left-2.5 right-2.5 sm:left-1/2 sm:-translate-x-1/2 sm:right-auto sm:bottom-4 z-20 flex items-center justify-between sm:justify-center gap-1.5 rounded-2xl border border-slate-800/90 bg-slate-950/92 p-1.5 shadow-2xl backdrop-blur-xl">
        {/* Play/Pause Button */}
        <button
          onClick={() => setSolarPlaying(!solarPlaying)}
          title={solarPlaying ? 'Jeda Simulasi Orbit' : 'Putar Simulasi Orbit'}
          className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/15 px-3 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/25 active:scale-95 transition shrink-0"
        >
          {solarPlaying ? (
            <Pause className="h-3.5 w-3.5 fill-current text-cyan-400" />
          ) : (
            <Play className="h-3.5 w-3.5 fill-current text-cyan-400" />
          )}
          <span className="text-[11px]">{solarPlaying ? 'Jeda' : 'Putar'}</span>
        </button>

        {/* Pemilih Kecepatan: Tampil langsung di desktop (1-klik), atau dropdown popover di mobile */}
        {/* Desktop Speed Pills */}
        <div className="hidden sm:flex items-center gap-1 border-x border-slate-800/80 px-2">
          {SOLAR_SPEEDS.map((sp) => {
            const isCurrent = sp.value === solarSpeed;
            return (
              <button
                key={sp.value}
                onClick={() => setSolarSpeed(sp.value)}
                title={`Kecepatan: ${sp.label}`}
                className={`rounded-lg px-2 py-1 text-[11px] font-semibold transition active:scale-95 ${
                  isCurrent
                    ? 'border border-cyan-400 bg-cyan-500/25 text-cyan-300 shadow-sm shadow-cyan-500/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                {sp.short}
              </button>
            );
          })}
        </div>

        {/* Mobile Speed Button (Dropdown dengan overlay unclipped) */}
        <div className="relative sm:hidden border-l border-slate-800/80 pl-1 shrink-0">
          <button
            onClick={() => setSpeedMenuOpen(!speedMenuOpen)}
            className="flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition"
          >
            <span>{currentSpeedObj.short || currentSpeedObj.label}</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${speedMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {speedMenuOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setSpeedMenuOpen(false)} />
              <div className="fixed bottom-18 left-3 right-3 z-50 rounded-2xl border border-slate-700 bg-slate-900/98 p-2 shadow-2xl backdrop-blur-2xl animate-sheet-up">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                  Kecepatan Orbit
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {SOLAR_SPEEDS.map((sp) => (
                    <button
                      key={sp.value}
                      onClick={() => {
                        setSolarSpeed(sp.value);
                        setSpeedMenuOpen(false);
                      }}
                      className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-medium transition ${
                        sp.value === solarSpeed
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{sp.label}</span>
                      {sp.value === solarSpeed && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-4 w-px bg-slate-800 shrink-0 mx-0.5 sm:hidden" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={() => triggerSolarZoom('out')}
            title="Zoom Out (Menjauh)"
            className="flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-white active:scale-95 transition"
          >
            <ZoomOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Out</span>
          </button>
          <button
            onClick={() => triggerSolarZoom('in')}
            title="Zoom In (Mendekat)"
            className="flex items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-800 hover:text-cyan-400 active:scale-95 transition"
          >
            <ZoomIn className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">In</span>
          </button>
        </div>

        <div className="h-4 w-px bg-slate-800 shrink-0 mx-0.5" />

        {/* Layer Toggles: Garis Edar & Label */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => toggleLayer('grid')}
            title="Tampilkan / Sembunyikan Garis Edar Orbit"
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-medium transition active:scale-95 ${
              layers.grid
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Orbit className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Orbit</span>
          </button>

          <button
            onClick={() => toggleLayer('labels')}
            title="Tampilkan / Sembunyikan Label Nama Planet"
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1 text-[11px] font-medium transition active:scale-95 ${
              layers.labels
                ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Tag className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Label</span>
          </button>
        </div>
      </div>
    </div>
  );
}
