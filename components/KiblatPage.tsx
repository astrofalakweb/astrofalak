'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
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
  Check,
} from 'lucide-react';
import { LocationPickerModal } from './LocationPickerModal';

type CompassState = 'idle' | 'need-permission' | 'active' | 'unsupported' | 'insecure';
type ReferenceMode = 'qibla' | 'north';

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

  // Mode acuan: 'qibla' (default: Kiblat di atas 12:00) atau 'north' (Utara di 12:00)
  const [referenceMode, setReferenceMode] = useState<ReferenceMode>('qibla');

  // Simulasi heading (untuk perangkat tanpa sensor kompas / desktop)
  const [simHeading, setSimHeading] = useState<number | null>(null);
  const [showSimPanel, setShowSimPanel] = useState(false);

  // Sudut tampilan terinterpolasi tak-terputus
  const dialAngle = useRef(0);
  const pointerAngle = useRef(0);
  const absoluteSeen = useRef(false);

  useEffect(() => setSecure(isSecureOrigin()), []);

  // ---------- Sensor Kompas HP ----------
  const handleOrientation = useRef((e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
    let h: number | null = null;
    if (typeof e.webkitCompassHeading === 'number') {
      // iOS: sudah relatif ke Utara sejati/magnetik
      h = e.webkitCompassHeading;
    } else if (e.alpha !== null && (e.absolute || e.type === 'deviceorientationabsolute')) {
      absoluteSeen.current = true;
      h = 360 - e.alpha;
    } else if (e.alpha !== null) {
      // Fallback jika event absolute tidak didukung browser
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

  // ---------- GPS ----------
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

  // ---------- Perhitungan Sudut & Rotasi ----------
  // Jika ada simulasi dari user, prioritaskan simulasi; jika tidak, gunakan sensor HP
  const activeHeading = simHeading !== null ? simHeading : heading;

  // Nilai azimuth efektif:
  // Jika sensor aktif, gunakan activeHeading.
  // Jika sensor belum aktif/null:
  // - Pada Acuan Kiblat: asumsikan default menghadap Kiblat (hd = qibla.az), sehingga Kiblat berada di 12:00.
  // - Pada Acuan Utara: asumsikan default menghadap Utara (hd = 0).
  const effectiveHd = activeHeading !== null ? activeHeading : referenceMode === 'qibla' ? qibla.az : 0;

  // Target rotasi piringan kompas:
  // - Pada Acuan Kiblat: Piringan berputar dengan offset (qibla.az - effectiveHd).
  //   Ketika HP menghadap Kiblat (effectiveHd === qibla.az), piringan berada pada 0° (Kiblat di 12:00).
  // - Pada Acuan Utara: Piringan berputar dengan offset (-effectiveHd).
  //   Ketika HP menghadap Utara (effectiveHd === 0), Utara berada di 12:00.
  const targetDial = referenceMode === 'qibla' ? qibla.az - effectiveHd : -effectiveHd;

  // Target penunjuk Ka'bah:
  // - Pada Acuan Kiblat: Ka'bah tetap di acuan utama (12:00). Jika HP melenceng, dial berputar.
  // - Pada Acuan Utara: Penunjuk Ka'bah berputar relatif ke Utara: (qibla.az - effectiveHd).
  const targetPointer = referenceMode === 'qibla' ? 0 : qibla.az - effectiveHd;

  dialAngle.current += wrap180(targetDial - dialAngle.current);
  pointerAngle.current += wrap180(targetPointer - pointerAngle.current);

  // Selisih sudut terhadap Kiblat
  const offset = wrap180(qibla.az - effectiveHd);
  const isFacingQibla = activeHeading !== null && Math.abs(offset) < 3;

  const turnHint =
    activeHeading === null
      ? referenceMode === 'qibla'
        ? 'Acuan Utama: Kiblat (12:00)'
        : 'Acuan Utama: Utara (12:00)'
      : isFacingQibla
        ? 'Tepat! Anda menghadap Kiblat'
        : offset > 0
          ? `Putar ke kanan ${Math.abs(offset).toFixed(0)}°`
          : `Putar ke kiri ${Math.abs(offset).toFixed(0)}°`;

  // Sudut posisi mata angin relatif pada piringan (selalu 90° presisi):
  // Di mode Acuan Kiblat, Kiblat adalah 0°.
  // Karena Kiblat ber-azimuth Q dari Utara, maka Utara adalah (-Q) dari Kiblat.
  const cardinalAngles = useMemo(() => {
    if (referenceMode === 'qibla') {
      const u = norm360(-qibla.az);
      return {
        U: u,
        T: norm360(u + 90),
        S: norm360(u + 180),
        B: norm360(u + 270),
        TL: norm360(u + 45),
        TG: norm360(u + 135),
        BD: norm360(u + 225),
        BL: norm360(u + 315),
      };
    } else {
      return {
        U: 0,
        T: 90,
        S: 180,
        B: 270,
        TL: 45,
        TG: 135,
        BD: 225,
        BL: 315,
      };
    }
  }, [referenceMode, qibla.az]);

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
                <b>Mode tidak aman (http).</b> GPS presisi & kompas HP tidak tersedia; tombol GPS akan memakai perkiraan lokasi dari
                jaringan. {INSECURE_HINT}
              </p>
            </div>
          )}
        </div>

        {/* Pemilih Acuan Kompas (Kiblat vs Utara) */}
        <div className="mb-4 rounded-2xl border border-slate-800 bg-[#111923] p-2.5">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Acuan Kompas
            </span>
            <span className="text-[10px] text-teal-400/90 font-mono">
              {referenceMode === 'qibla' ? 'Kiblat di 12:00' : 'Utara di 12:00'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setReferenceMode('qibla')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${
                referenceMode === 'qibla'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>🕋</span>
              <span>Acuan Kiblat (Utama)</span>
              {referenceMode === 'qibla' && <Check className="h-3.5 w-3.5 ml-0.5" />}
            </button>
            <button
              onClick={() => setReferenceMode('north')}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${
                referenceMode === 'north'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Acuan Utara (0°)</span>
              {referenceMode === 'north' && <Check className="h-3.5 w-3.5 ml-0.5" />}
            </button>
          </div>
          <p className="mt-2 px-1 text-[11px] text-slate-400 leading-relaxed">
            {referenceMode === 'qibla' ? (
              <span>
                ✨ <b>Arah Kiblat ({qibla.az.toFixed(1)}°)</b> dijadikan acuan utama di puncak kompas (12:00). Sumbu mata angin <b>Utara, Timur, Selatan, Barat</b> tetap tertata rapi berjarak <b>90° presisi</b>.
              </span>
            ) : (
              <span>
                🧭 <b>Utara Sejati (0°)</b> dijadikan acuan di puncak (12:00). Jarum Ka&apos;bah menunjuk ke azimuth {qibla.az.toFixed(1)}°.
              </span>
            )}
          </p>
        </div>

        {/* Section Kompas */}
        <div className="relative mb-5 flex flex-col items-center">
          {/* Status Arah / Petunjuk Putar */}
          <div
            className={`mb-4 flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all ${
              isFacingQibla
                ? 'scale-105 border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.35)]'
                : 'border-slate-700 bg-slate-900/80 text-slate-300 shadow-md'
            }`}
          >
            {isFacingQibla && <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />}
            <span>{turnHint}</span>
          </div>

          {/* Kotak Kompas */}
          <div className="relative aspect-square w-full max-w-[340px]">
            {/* Penanda fisik arah depan HP (Notch di 12:00) */}
            <div
              className={`absolute left-1/2 top-0 z-20 h-7 w-[3px] -translate-x-1/2 -translate-y-3 rounded-full transition-colors ${
                isFacingQibla ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]' : 'bg-slate-300'
              }`}
            />

            {/* Bingkai Luar Kompas */}
            <div className="relative h-full w-full rounded-full border-[8px] border-[#0c141d] bg-[radial-gradient(circle_at_50%_45%,#152536,#0a111a)] shadow-2xl overflow-hidden p-1">
              {/* Piringan Kompas yang Berputar Sesuai Heading */}
              <div
                className="absolute inset-0 transition-transform duration-200 ease-out"
                style={{ transform: `rotate(${dialAngle.current}deg)` }}
              >
                {/* SVG Graduasi, Sumbu 90° Siku-Siku, dan Skala Derajat */}
                <svg viewBox="0 0 400 400" className="w-full h-full">
                  <defs>
                    <radialGradient id="compassGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#1e3a5f" stopOpacity="0.25" />
                      <stop offset="85%" stopColor="#0b131e" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#050a10" stopOpacity="0.8" />
                    </radialGradient>
                    <linearGradient id="northGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity="1" />
                    </linearGradient>
                    <linearGradient id="qiblaBeamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.0" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>

                  {/* Latar Belakang Lingkaran */}
                  <circle cx="200" cy="200" r="185" fill="url(#compassGlow)" />
                  <circle cx="200" cy="200" r="185" fill="none" stroke="#1e293b" strokeWidth="2" />
                  <circle cx="200" cy="200" r="162" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="200" cy="200" r="115" fill="none" stroke="#1e293b" strokeWidth="1" opacity="0.6" />

                  {/* Sumbu Diagonal 45° (Garis Halus Pembagi Kuadran) */}
                  <g
                    transform={`rotate(${cardinalAngles.U}, 200, 200)`}
                    opacity="0.35"
                    stroke="#475569"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  >
                    <line x1="200" y1="50" x2="200" y2="350" transform="rotate(45, 200, 200)" />
                    <line x1="200" y1="50" x2="200" y2="350" transform="rotate(-45, 200, 200)" />
                  </g>

                  {/* Sumbu Salib Utama 90° (U–S dan B–T Tegak Lurus Presisi) */}
                  <g transform={`rotate(${cardinalAngles.U}, 200, 200)`}>
                    {/* Sumbu Timur – Barat (Horizontal 90°) */}
                    <line x1="42" y1="200" x2="358" y2="200" stroke="#38bdf8" strokeWidth="1.5" opacity="0.75" />
                    {/* Sumbu Selatan (Bagian Bawah 180°) */}
                    <line x1="200" y1="200" x2="200" y2="358" stroke="#64748b" strokeWidth="1.5" opacity="0.8" />
                    {/* Sumbu Utara (Bagian Atas 0° - Berwarna Merah Terang) */}
                    <line x1="200" y1="200" x2="200" y2="42" stroke="url(#northGrad)" strokeWidth="2.5" />

                    {/* Segitiga Panah Penunjuk Arah Utara */}
                    <polygon points="200,32 193,52 207,52" fill="#f43f5e" />

                    {/* Simbol Siku 90° di Kuadran Utama (Mempertegas Hubungan 90 Derajat) */}
                    <path
                      d="M 200,178 L 222,178 L 222,200"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      opacity="0.9"
                    />
                    <circle cx="211" cy="189" r="1.5" fill="#38bdf8" />
                    <text
                      x="228"
                      y="188"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                      fill="#38bdf8"
                      opacity="0.9"
                    >
                      90°
                    </text>
                  </g>

                  {/* Tik-tik Derajat Sekeliling (72 Titik Setiap 5°) */}
                  <g transform={`rotate(${cardinalAngles.U}, 200, 200)`}>
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
                  </g>

                  {/* Angka Derajat Setiap 30° */}
                  <g transform={`rotate(${cardinalAngles.U}, 200, 200)`}>
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
                      // Hindari tumpang tindih teks dengan U, T, S, B
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
                  </g>

                  {/* Label Mata Angin Utama (U, T, S, B - Tepat 90 Derajat Satu Sama Lain) */}
                  <g transform={`rotate(${cardinalAngles.U}, 200, 200)`}>
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
                  </g>

                  {/* Titik Poros Tengah */}
                  <circle cx="200" cy="200" r="8" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                  <circle cx="200" cy="200" r="3" fill="#38bdf8" />
                </svg>
              </div>

              {/* Jarum & Penanda Kiblat (Ka'bah 🕋) */}
              <div
                className="absolute inset-0 transition-transform duration-200 ease-out pointer-events-none"
                style={{ transform: `rotate(${pointerAngle.current}deg)` }}
              >
                {/* Berkas Cahaya Arah Kiblat */}
                <div
                  className={`absolute left-1/2 top-[10%] h-[40%] w-1.5 -translate-x-1/2 rounded-full transition-all ${
                    isFacingQibla
                      ? 'bg-gradient-to-t from-emerald-500 to-emerald-300 shadow-[0_0_24px_rgba(52,211,153,1)] w-2'
                      : 'bg-gradient-to-t from-teal-500/30 to-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                  }`}
                />

                {/* Ikon Ka'bah di Ujung Penunjuk */}
                <div
                  className={`absolute left-1/2 top-[2%] flex h-13 w-13 -translate-x-1/2 items-center justify-center rounded-2xl border-2 transition-all ${
                    isFacingQibla
                      ? 'border-emerald-300 bg-emerald-950/90 shadow-[0_0_32px_rgba(52,211,153,0.85)] scale-110'
                      : 'border-emerald-500/70 bg-slate-900/90 shadow-[0_0_16px_rgba(16,185,129,0.4)]'
                  }`}
                >
                  <span className="text-2xl drop-shadow-md select-none">🕋</span>
                </div>
              </div>

              {/* Titik Pusat Dekoratif */}
              <div
                className={`absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 transition-colors ${
                  isFacingQibla ? 'bg-emerald-400 ring-emerald-950 shadow-[0_0_15px_#34d399]' : 'bg-teal-400 ring-slate-900'
                }`}
              />
            </div>
          </div>

          {/* Indikator Label Sudut di Bawah Kompas */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1 text-[11px] font-mono text-teal-300">
              🕋 Kiblat: <b className="text-white">{qibla.az.toFixed(1)}°</b>
            </span>
            <span className="rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1 text-[11px] font-mono text-slate-300">
              📐 Falak: <b className="text-amber-300">{relativeDirection(qibla.az)}</b>
            </span>
          </div>

          {/* Status Sensor & Tombol Izin */}
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
                <Smartphone className="h-3.5 w-3.5 text-teal-400" /> Menunggu sensor HP… Pegang HP datar dan gerakkan membentuk angka 8 untuk kalibrasi.
              </p>
            )}
            {(compass === 'unsupported' || compass === 'insecure') && (
              <p className="text-center text-[11px] leading-relaxed text-slate-400">
                {compass === 'insecure'
                  ? 'Kompas otomatis butuh koneksi HTTPS. Gunakan slider simulasi di bawah untuk menguji arah putaran.'
                  : 'Sensor giroskop/kompas fisik tidak terdeteksi (umum di laptop/PC). Anda dapat menggunakan slider simulasi di bawah.'}
              </p>
            )}
          </div>
        </div>

        {/* Panel Simulasi Arah HP (Berguna untuk Desktop / Pengujian) */}
        <div className="mb-5 rounded-2xl border border-slate-800 bg-[#111923] p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setShowSimPanel(!showSimPanel)}
              className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-teal-400 transition"
            >
              <Sliders className="h-3.5 w-3.5 text-teal-400" />
              <span>{showSimPanel ? 'Tutup Panel Uji Kompas' : 'Buka Simulator Putar HP (Desktop / Uji)'}</span>
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

              {/* Tombol Pintas Uji */}
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

        {/* Info & Data Telemetri Kompas */}
        <div className="rounded-2xl border border-slate-800 bg-[#111923] p-5 shadow-lg">
          <div className="mb-1 text-[11px] font-bold tracking-widest text-slate-500 text-center uppercase">
            AZIMUTH KIBLAT DARI UTARA SEJATI
          </div>
          <div className="mb-4 text-center">
            <span
              className={`text-5xl font-black tracking-tight transition-colors ${
                isFacingQibla ? 'text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'text-teal-400'
              }`}
            >
              {qibla.az.toFixed(1)}°
            </span>
            <div className="mt-1 text-xs text-slate-400 font-medium">
              Metode Segitiga Bola Trigonometri · Ka&apos;bah (21°25&apos; LU, 39°49&apos; BT)
            </div>
          </div>

          {/* Grid Presisi 90 Derajat Mata Angin */}
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
              Tiap mata angin terpisah tepat 90° (U ke T: +90°, T ke S: +90°, S ke B: +90°, B ke U: +90°).
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 text-center">
            <div>
              <div className="mb-1 text-[11px] font-bold text-slate-500">HEADING HP SAAT INI</div>
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
