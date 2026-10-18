'use client';

import { useEffect, useRef, useState } from 'react';
import { useRealtimeAstro } from '../lib/useAstro';
import { useAppStore } from '../lib/store';
import { INSECURE_HINT, isSecureOrigin, locateUser } from '../lib/geo';
import { relativeDirection } from '../lib/falak/format';
import {
  AlertTriangle,
  CheckCircle2,
  Compass,
  Crosshair,
  Info,
  MapPin,
  Smartphone,
  RotateCcw,
  Sliders,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { LocationPickerModal } from './LocationPickerModal';

type CompassState = 'idle' | 'need-permission' | 'active' | 'unsupported' | 'insecure';

/** Normalisasi sudut ke rentang (−180, 180]. */
const wrap180 = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
/** Normalisasi sudut ke [0, 360). */
const norm360 = (a: number) => (((a % 360) + 360) % 360);

export function KiblatPage() {
  const { qibla, loc } = useRealtimeAstro(60000);
  const setLocation = useAppStore((s) => s.setLocation);

  const [heading, setHeading] = useState<number | null>(null);
  const [compass, setCompass] = useState<CompassState>('idle');
  const [isLocating, setIsLocating] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [geoMsg, setGeoMsg] = useState<{ type: 'error' | 'info' | 'ok'; text: string; hint?: string } | null>(null);
  const [secure, setSecure] = useState(true);

  // Simulasi heading (untuk perangkat desktop / uji tanpa sensor)
  const [simHeading, setSimHeading] = useState<number | null>(null);
  const [showSimPanel, setShowSimPanel] = useState(false);

  // Sudut rotasi terinterpolasi untuk animasi mulus
  const dialAngle = useRef(0);
  const pointerAngle = useRef(0);
  const absoluteSeen = useRef(false);
  const prevFacing = useRef(false);

  useEffect(() => setSecure(isSecureOrigin()), []);

  // ---------- Sensor Kompas HP (Device Orientation) ----------
  const handleOrientation = useRef((e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
    let h: number | null = null;
    if (typeof e.webkitCompassHeading === 'number') {
      // iOS CoreLocation: sudah mengacu ke Utara sejati/magnetik
      h = e.webkitCompassHeading;
    } else if (e.alpha !== null && (e.absolute || e.type === 'deviceorientationabsolute')) {
      absoluteSeen.current = true;
      h = 360 - e.alpha;
    } else if (e.alpha !== null) {
      // Fallback jika browser hanya mengirimkan deviceorientation biasa
      h = 360 - e.alpha;
    }
    if (h === null) return;

    const screenAngle =
      typeof window !== 'undefined'
        ? window.screen?.orientation?.angle ?? (window as any).orientation ?? 0
        : 0;

    const finalH = norm360(h + screenAngle);
    setHeading(finalH);
  });

  const startCompass = () => {
    const fn = handleOrientation.current as EventListener;
    window.addEventListener('deviceorientationabsolute', fn);
    window.addEventListener('deviceorientation', fn);
    setCompass('active');
  };

  useEffect(() => {
    if (!isSecureOrigin()) {
      setCompass('insecure');
      return;
    }
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) {
      setCompass('unsupported');
      return;
    }
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      setCompass('need-permission');
    } else {
      startCompass();
    }
    const fn = handleOrientation.current as EventListener;
    return () => {
      window.removeEventListener('deviceorientationabsolute', fn);
      window.removeEventListener('deviceorientation', fn);
    };
  }, []);

  const requestCompass = async () => {
    try {
      const p = await (DeviceOrientationEvent as any).requestPermission();
      if (p === 'granted') startCompass();
      else setCompass('unsupported');
    } catch {
      setCompass('unsupported');
    }
  };

  // ---------- GPS Lokasi ----------
  const getLocation = async () => {
    setIsLocating(true);
    setGeoMsg(null);
    try {
      const r = await locateUser();
      setLocation(r.location);
      const accText = r.accuracy
        ? ` (Akurasi: ±${r.accuracy < 1000 ? `${r.accuracy} m` : `${(r.accuracy / 1000).toFixed(1)} km`})`
        : '';
      setGeoMsg({
        type: r.source === 'network' ? 'info' : 'ok',
        text: `Lokasi diperbarui${accText}.`,
        hint: r.notice,
      });
    } catch (e: any) {
      setGeoMsg({ type: 'error', text: e?.message || 'Gagal mendapatkan lokasi.', hint: e?.hint });
    } finally {
      setIsLocating(false);
    }
  };

  // ---------- Perhitungan Sudut Kompas ala QiblaFinder.io ----------
  // Prioritaskan simulasi manual jika sedang aktif, sebaliknya gunakan sensor perangkat
  const activeHeading = simHeading !== null ? simHeading : heading;

  // Nilai arah hadap efektif:
  // Jika perangkat memiliki sensor/simulasi aktif, gunakan activeHeading.
  // Jika masih null (default buka di desktop/sebelum gerak), kompas otomatis menghadap Kiblat
  // sehingga Ka'bah berada di puncak (12:00) dan mata angin U-S & B-T tersusun rapi 90°.
  const effectiveHd = activeHeading !== null ? activeHeading : qibla.az;

  // Target rotasi piringan kompas:
  // Piringan kompas berputar sebesar -effectiveHd sehingga arah hadap HP selalu di 12:00.
  const targetDial = -effectiveHd;

  // Target penunjuk Ka'bah:
  // Ka'bah berada pada azimuth qibla.az - effectiveHd (ketika effectiveHd === qibla.az, jarum tepat di 12:00).
  const targetPointer = qibla.az - effectiveHd;

  dialAngle.current += wrap180(targetDial - dialAngle.current);
  pointerAngle.current += wrap180(targetPointer - pointerAngle.current);

  // Selisih derajat terhadap arah Kiblat
  const offset = wrap180(qibla.az - effectiveHd);
  const isFacingQibla = Math.abs(offset) < 3.5;

  // Haptic feedback getar saat tepat menghadap kiblat
  useEffect(() => {
    if (isFacingQibla && !prevFacing.current && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(60);
      } catch {}
    }
    prevFacing.current = isFacingQibla;
  }, [isFacingQibla]);

  const turnHint = isFacingQibla
    ? 'Tepat! Anda menghadap Kiblat'
    : offset > 0
      ? `Putar ke kanan ${Math.abs(offset).toFixed(0)}°`
      : `Putar ke kiri ${Math.abs(offset).toFixed(0)}°`;

  return (
    <div className="h-full w-full overflow-y-auto bg-[#070e14] text-slate-200">
      <div className="mx-auto max-w-lg px-4 pb-12 pt-5">
        {/* Lokasi & GPS Card */}
        <div className="mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#111923] p-4 shadow-lg">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-500">
                <MapPin className="h-3 w-3" /> Lokasi Anda
              </div>
              <div className="truncate text-base font-bold text-teal-400">{loc.name}</div>
              <div className="mt-0.5 font-mono text-[11px] text-slate-400 flex items-center flex-wrap gap-2">
                <span>{loc.lat.toFixed(5)}°, {loc.lon.toFixed(5)}°</span>
                {loc.elevation !== undefined && (
                  <span className="text-teal-400">· {loc.elevation} m dpl</span>
                )}
                {loc.accuracy && loc.accuracy < 1000 && (
                  <span className="text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded text-[9px] border border-slate-700">±{loc.accuracy}m</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowLocModal(true)}
                title="Pilih atau cari kota lain"
                className="rounded-xl border border-slate-700 bg-slate-800/80 px-2.5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                Cari Kota
              </button>
              <button
                id="kiblat-gps-button"
                onClick={getLocation}
                disabled={isLocating}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-2.5 text-xs font-bold text-teal-300 transition hover:bg-teal-500/20 active:scale-95 disabled:opacity-60"
              >
                <Crosshair className={`h-4 w-4 ${isLocating ? 'animate-spin' : ''}`} />
                {isLocating ? 'Mencari…' : 'GPS Saya'}
              </button>
            </div>
          </div>

          {geoMsg && (
            <div
              className={`flex gap-2.5 rounded-xl border p-3 text-xs leading-relaxed ${
                geoMsg.type === 'error'
                  ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                  : geoMsg.type === 'info'
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              }`}
            >
              {geoMsg.type === 'ok' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />}
              <div>
                <p className="font-semibold">{geoMsg.text}</p>
                {geoMsg.hint && <p className="mt-1 text-[11px] opacity-80">{geoMsg.hint}</p>}
              </div>
            </div>
          )}

          {!secure && !geoMsg && (
            <div className="flex gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] leading-relaxed text-amber-100">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                <b>Mode tidak aman (http).</b> GPS presisi & kompas HP membutuhkan HTTPS; tombol GPS akan memakai perkiraan lokasi dari
                jaringan. {INSECURE_HINT}
              </p>
            </div>
          )}
        </div>

        {/* Section Kompas QiblaFinder */}
        <div className="relative mb-5 flex flex-col items-center">
          {/* Petunjuk Arah Dinamis (Putar ke kanan/kiri atau Tepat) */}
          <div
            className={`mb-4 flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              isFacingQibla
                ? 'scale-105 border-emerald-400 bg-emerald-500/25 text-emerald-300 shadow-[0_0_30px_rgba(52,211,153,0.4)]'
                : 'border-slate-800 bg-[#111923] text-slate-300 shadow-md'
            }`}
          >
            {isFacingQibla ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span>{turnHint}</span>
              </>
            ) : offset > 0 ? (
              <>
                <span>{turnHint}</span>
                <ChevronRight className="h-4 w-4 text-emerald-400 animate-pulse" />
              </>
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span>{turnHint}</span>
              </>
            )}
          </div>

          {/* Kotak Kompas Qibla */}
          <div className="relative aspect-square w-full max-w-[340px]">
            {/* Indikator Garis Depan HP (Notch di 12:00) */}
            <div
              className={`absolute left-1/2 top-0 z-20 h-7 w-[3px] -translate-x-1/2 -translate-y-3 rounded-full transition-colors duration-300 ${
                isFacingQibla ? 'bg-emerald-400 shadow-[0_0_15px_#34d399]' : 'bg-slate-400'
              }`}
            />

            {/* Bingkai Kompas Bulat */}
            <div
              className={`relative h-full w-full rounded-full border-[8px] transition-all duration-500 overflow-hidden shadow-2xl p-1 ${
                isFacingQibla
                  ? 'border-emerald-500/40 bg-[radial-gradient(circle_at_50%_45%,#064e3b,#022c22,#070e14)] shadow-[0_0_50px_rgba(16,185,129,0.3)]'
                  : 'border-[#0c141d] bg-[radial-gradient(circle_at_50%_45%,#132231,#0a111a)]'
              }`}
            >
              {/* Gelombang Radar saat Tepat Menghadap Kiblat */}
              {isFacingQibla && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="absolute w-[90%] h-[90%] rounded-full border border-emerald-400/20 animate-ping" />
                  <div className="absolute w-[60%] h-[60%] rounded-full border border-emerald-400/30 animate-pulse" />
                </div>
              )}

              {/* Piringan Kompas yang Berputar Sesuai Hadap HP */}
              <div
                className="absolute inset-0 transition-transform duration-200 ease-out"
                style={{ transform: `rotate(${dialAngle.current}deg)` }}
              >
                {/* SVG Piringan 360°, Sumbu 90° Siku-Siku, dan Skala Mata Angin */}
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  <defs>
                    <radialGradient id="compassCenterGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#0f172a" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#020617" stopOpacity="0.95" />
                    </radialGradient>
                    <linearGradient id="northAxisGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="qiblaLineGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>

                  {/* Lingkaran Luar & Kisi Skala */}
                  <circle cx="200" cy="200" r="186" fill="url(#compassCenterGlow)" />
                  <circle cx="200" cy="200" r="186" fill="none" stroke="#1e293b" strokeWidth="2" />
                  <circle cx="200" cy="200" r="162" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
                  <circle cx="200" cy="200" r="120" fill="none" stroke="#1e293b" strokeWidth="1" opacity="0.5" />

                  {/* Sumbu Diagonal 45° (Pembagi Kuadran Halus) */}
                  <g opacity="0.3" stroke="#475569" strokeWidth="1" strokeDasharray="4 4">
                    <line x1="200" y1="50" x2="200" y2="350" transform="rotate(45, 200, 200)" />
                    <line x1="200" y1="50" x2="200" y2="350" transform="rotate(-45, 200, 200)" />
                  </g>

                  {/* Sumbu Salib 90° Presisi (Utara–Selatan & Barat–Timur Siku-Siku Sempurna) */}
                  <g>
                    {/* Sumbu Barat – Timur (Horizontal 90°) */}
                    <line x1="42" y1="200" x2="358" y2="200" stroke="#38bdf8" strokeWidth="1.5" opacity="0.65" />

                    {/* Sumbu Selatan (Bawah 180°) */}
                    <line x1="200" y1="200" x2="200" y2="358" stroke="#64748b" strokeWidth="1.5" opacity="0.75" />

                    {/* Sumbu Utara (Atas 0° - Panah Merah) */}
                    <line x1="200" y1="200" x2="200" y2="42" stroke="url(#northAxisGrad)" strokeWidth="2.5" />
                    <polygon points="200,32 193,52 207,52" fill="#f43f5e" />

                    {/* Simbol Siku 90° di Kuadran Utama */}
                    <path
                      d="M 200,178 L 222,178 L 222,200"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      opacity="0.85"
                    />
                    <circle cx="211" cy="189" r="1.5" fill="#38bdf8" />
                    <text
                      x="228"
                      y="188"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill="#38bdf8"
                      opacity="0.85"
                    >
                      90°
                    </text>
                  </g>

                  {/* Garis Arah Kiblat di Piringan Kompas */}
                  <g transform={`rotate(${qibla.az}, 200, 200)`}>
                    <line x1="200" y1="200" x2="200" y2="48" stroke="url(#qiblaLineGrad)" strokeWidth="2.5" strokeDasharray="4 2" />
                    <circle cx="200" cy="48" r="4" fill="#34d399" />
                  </g>

                  {/* Tik-tik Derajat 360° (72 Titik Setiap 5°) */}
                  {Array.from({ length: 72 }).map((_, i) => {
                    const deg = i * 5;
                    const isCardinal = deg % 90 === 0;
                    const is30 = deg % 30 === 0;
                    const is10 = deg % 10 === 0;
                    const len = isCardinal ? 16 : is30 ? 12 : is10 ? 8 : 4;
                    const strokeColor = isCardinal
                      ? deg === 0
                        ? '#f43f5e'
                        : '#38bdf8'
                      : is30
                        ? '#cbd5e1'
                        : is10
                          ? '#64748b'
                          : '#334155';
                    const strokeW = isCardinal ? 2.5 : is30 ? 1.8 : 1;

                    return (
                      <line
                        key={i}
                        x1="200"
                        y1="18"
                        x2="200"
                        y2={18 + len}
                        stroke={strokeColor}
                        strokeWidth={strokeW}
                        transform={`rotate(${deg}, 200, 200)`}
                      />
                    );
                  })}

                  {/* Angka Derajat Setiap 30° */}
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                    if (deg % 90 === 0) return null;
                    const rad = ((deg - 90) * Math.PI) / 180;
                    const r = 150;
                    const x = 200 + r * Math.cos(rad);
                    const y = 200 + r * Math.sin(rad);

                    return (
                      <text
                        key={deg}
                        x={x}
                        y={y + 3}
                        textAnchor="middle"
                        fontSize="9"
                        fontFamily="monospace"
                        fill="#64748b"
                        fontWeight="bold"
                      >
                        {deg}°
                      </text>
                    );
                  })}

                  {/* Label Mata Angin Utama (U, T, S, B - Tepat 90 Derajat Satu Sama Lain) */}
                  {/* Utara (U - 0°) */}
                  <g transform="translate(200, 62)">
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      fontSize="16"
                      fontWeight="900"
                      fill="#f43f5e"
                      className="drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                    >
                      U
                    </text>
                    <text x="0" y="11" textAnchor="middle" fontSize="9" fontFamily="monospace" fontWeight="bold" fill="#fda4af">
                      0°
                    </text>
                  </g>

                  {/* Timur (T - 90°) */}
                  <g transform="translate(340, 200)">
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fontSize="15"
                      fontWeight="800"
                      fill="#e2e8f0"
                    >
                      T
                    </text>
                    <text x="0" y="15" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#94a3b8">
                      90°
                    </text>
                  </g>

                  {/* Selatan (S - 180°) */}
                  <g transform="translate(200, 342)">
                    <text
                      x="0"
                      y="0"
                      textAnchor="middle"
                      fontSize="15"
                      fontWeight="800"
                      fill="#cbd5e1"
                    >
                      S
                    </text>
                    <text x="0" y="11" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#94a3b8">
                      180°
                    </text>
                  </g>

                  {/* Barat (B - 270°) */}
                  <g transform="translate(60, 200)">
                    <text
                      x="0"
                      y="4"
                      textAnchor="middle"
                      fontSize="15"
                      fontWeight="800"
                      fill="#e2e8f0"
                    >
                      B
                    </text>
                    <text x="0" y="15" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#94a3b8">
                      270°
                    </text>
                  </g>

                  {/* Mata Angin Antara (TL, TG, BD, BL) */}
                  <text x="274" y="126" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">
                    TL
                  </text>
                  <text x="274" y="282" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">
                    TG
                  </text>
                  <text x="126" y="282" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">
                    BD
                  </text>
                  <text x="126" y="126" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b">
                    BL
                  </text>

                  {/* Titik Poros Tengah */}
                  <circle cx="200" cy="200" r="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                  <circle cx="200" cy="200" r="3.5" fill={isFacingQibla ? '#34d399' : '#38bdf8'} />
                </svg>
              </div>

              {/* Jarum & Ikon Ka'bah (Menunjuk Langsung ke Kiblat) */}
              <div
                className="absolute inset-0 transition-transform duration-200 ease-out pointer-events-none"
                style={{ transform: `rotate(${pointerAngle.current}deg)` }}
              >
                {/* Berkas Cahaya Arah Kiblat */}
                <div
                  className={`absolute left-1/2 top-[10%] h-[40%] w-1.5 -translate-x-1/2 rounded-full transition-all duration-300 ${
                    isFacingQibla
                      ? 'bg-gradient-to-t from-emerald-500 to-emerald-300 shadow-[0_0_25px_rgba(52,211,153,1)] w-2.5'
                      : 'bg-gradient-to-t from-teal-500/20 to-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                  }`}
                />

                {/* Ikon Ka'bah 3D/Badge di Ujung Jarum */}
                <div
                  className={`absolute left-1/2 top-[2%] flex h-13 w-13 -translate-x-1/2 items-center justify-center rounded-2xl border-2 transition-all duration-300 ${
                    isFacingQibla
                      ? 'border-emerald-300 bg-emerald-950 shadow-[0_0_35px_rgba(52,211,153,0.9)] scale-110'
                      : 'border-emerald-500/70 bg-slate-900/90 shadow-[0_0_16px_rgba(16,185,129,0.4)]'
                  }`}
                >
                  <span className="text-2xl drop-shadow select-none">🕋</span>
                </div>
              </div>

              {/* Titik Tengah Dekoratif */}
              <div
                className={`absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 transition-colors duration-300 ${
                  isFacingQibla ? 'bg-emerald-400 ring-emerald-950 shadow-[0_0_20px_#34d399]' : 'bg-teal-400 ring-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Indikator Azimuth & Falak di Bawah Kompas */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1 text-[11px] font-mono text-teal-300">
              🕋 Kiblat: <b className="text-white">{qibla.az.toFixed(1)}°</b>
            </span>
            <span className="rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1 text-[11px] font-mono text-slate-300">
              📐 Falak: <b className="text-amber-300">{relativeDirection(qibla.az)}</b>
            </span>
          </div>

          {/* Status Sensor HP & Tombol Izin */}
          <div className="mt-4 w-full">
            {compass === 'need-permission' && (
              <button
                id="kiblat-compass-permission"
                onClick={requestCompass}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 py-3 text-sm font-bold text-slate-950 shadow-lg active:scale-95"
              >
                <Compass className="h-4 w-4" /> Aktifkan Sensor Kompas HP
              </button>
            )}
            {compass === 'active' && heading === null && (
              <p className="flex items-center justify-center gap-2 text-center text-[11px] text-slate-400">
                <Smartphone className="h-3.5 w-3.5 text-teal-400" /> Menunggu sensor HP… Gerakkan HP membentuk angka 8 di udara untuk kalibrasi.
              </p>
            )}
            {(compass === 'unsupported' || compass === 'insecure') && (
              <p className="text-center text-[11px] leading-relaxed text-slate-400">
                {compass === 'insecure'
                  ? 'Kompas langsung memerlukan HTTPS. Anda dapat menggunakan simulator putar HP di bawah untuk pengujian.'
                  : 'Sensor kompas fisik tidak terdeteksi (seperti di laptop/PC). Anda dapat menggunakan simulator putar HP di bawah.'}
              </p>
            )}
          </div>
        </div>

        {/* Panel Simulasi Arah HP (Berguna untuk Desktop / Laptop) */}
        <div className="mb-5 rounded-2xl border border-slate-800 bg-[#111923] p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowSimPanel(!showSimPanel)}
              className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-teal-400 transition"
            >
              <Sliders className="h-3.5 w-3.5 text-teal-400" />
              <span>{showSimPanel ? 'Tutup Simulator Putar HP' : 'Buka Simulator Putar HP (Desktop / Pengujian)'}</span>
            </button>
            {simHeading !== null && (
              <button
                onClick={() => setSimHeading(null)}
                className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
              >
                <RotateCcw className="h-3 w-3" /> Reset Simulasi
              </button>
            )}
          </div>

          {showSimPanel && (
            <div className="space-y-3 pt-2 border-t border-slate-800/80">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Simulasi Sudut Hadap HP:</span>
                  <span className="font-mono font-bold text-teal-300">
                    {simHeading !== null ? `${simHeading}°` : `${Math.round(effectiveHd)}° (Otomatis)`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="359"
                  value={simHeading !== null ? simHeading : Math.round(effectiveHd)}
                  onChange={(e) => setSimHeading(Number(e.target.value))}
                  className="w-full accent-teal-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                />
              </div>

              {/* Tombol Pintas Uji Hadap */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  onClick={() => setSimHeading(Math.round(qibla.az))}
                  className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 py-1.5 px-2 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/20"
                >
                  🎯 Kiblat ({qibla.az.toFixed(0)}°)
                </button>
                <button
                  onClick={() => setSimHeading(0)}
                  className="rounded-lg border border-rose-500/40 bg-rose-500/10 py-1.5 px-2 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20"
                >
                  🧭 Utara (0°)
                </button>
                <button
                  onClick={() => setSimHeading(90)}
                  className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 py-1.5 px-2 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/20"
                >
                  ➡️ Timur (90°)
                </button>
                <button
                  onClick={() => setSimHeading(270)}
                  className="rounded-lg border border-amber-500/40 bg-amber-500/10 py-1.5 px-2 text-[11px] font-bold text-amber-300 hover:bg-amber-500/20"
                >
                  ⬅️ Barat (270°)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info & Data Telemetri Kiblat */}
        <div className="rounded-2xl border border-slate-800 bg-[#111923] p-5 shadow-lg">
          <div className="mb-1 text-[11px] font-bold tracking-widest text-slate-500 text-center uppercase">
            AZIMUTH KIBLAT (DARI UTARA SEJATI)
          </div>
          <div className="mb-4 text-center">
            <span
              className={`text-5xl font-black tracking-tight transition-colors duration-300 ${
                isFacingQibla ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'text-teal-400'
              }`}
            >
              {qibla.az.toFixed(1)}°
            </span>
            <div className="mt-1 text-xs text-slate-400 font-medium">
              Koordinat Ka&apos;bah: 21°25&apos;21&quot; LU, 39°49&apos;34&quot; BT
            </div>
          </div>

          {/* Grid 4 Mata Angin Utama (Rapi Siku 90°) */}
          <div className="mb-4 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Orientasi 4 Mata Angin Utama</span>
              <span className="text-teal-400 font-mono">Siku-Siku 90.0°</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-2">
                <div className="text-[10px] text-rose-400 font-bold">UTARA (U)</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">0°</div>
              </div>
              <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-2">
                <div className="text-[10px] text-cyan-400 font-bold">TIMUR (T)</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">90°</div>
              </div>
              <div className="rounded-lg bg-slate-800/50 border border-slate-700/40 p-2">
                <div className="text-[10px] text-slate-400 font-bold">SELATAN (S)</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">180°</div>
              </div>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2">
                <div className="text-[10px] text-amber-400 font-bold">BARAT (B)</div>
                <div className="text-xs font-bold text-slate-200 mt-0.5">270°</div>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-slate-500 text-center">
              Seluruh mata angin terpisah tepat 90° ortogonal membentuk salib kompas sejati.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 text-center">
            <div>
              <div className="mb-1 text-[11px] font-bold text-slate-500">HEADING PERANGKAT</div>
              <div className="font-mono text-base font-bold text-slate-200">
                {activeHeading === null ? '—' : `${Math.round(activeHeading)}°`}
                {simHeading !== null && <span className="ml-1 text-[10px] text-teal-400 font-normal">(Uji)</span>}
              </div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold text-slate-500">JARAK KE KA&apos;BAH</div>
              <div className="font-mono text-base font-bold text-slate-200">
                {Math.round(qibla.distance).toLocaleString('id-ID')} km
              </div>
            </div>
          </div>
        </div>

        {/* Modal Pemilihan Lokasi */}
        <LocationPickerModal isOpen={showLocModal} onClose={() => setShowLocModal(false)} />
      </div>
    </div>
  );
}
