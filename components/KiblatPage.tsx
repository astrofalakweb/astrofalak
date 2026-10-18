'use client';

import { useEffect, useRef, useState } from 'react';
import { useRealtimeAstro } from '../lib/useAstro';
import { useAppStore } from '../lib/store';
import { INSECURE_HINT, isSecureOrigin, locateUser } from '../lib/geo';
import { AlertTriangle, CheckCircle2, Compass, Crosshair, Info, MapPin, Smartphone, Search } from 'lucide-react';
import { LocationPickerModal } from './LocationPickerModal';

type CompassState = 'idle' | 'need-permission' | 'active' | 'unsupported' | 'insecure';

/** Normalisasi sudut ke rentang (−180, 180]. */
const wrap180 = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;

export function KiblatPage() {
  const { qibla, loc } = useRealtimeAstro(60000);
  const setLocation = useAppStore((s) => s.setLocation);

  const [heading, setHeading] = useState<number | null>(null);
  const [compass, setCompass] = useState<CompassState>('idle');
  const [isLocating, setIsLocating] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [geoMsg, setGeoMsg] = useState<{ type: 'error' | 'info' | 'ok'; text: string; hint?: string } | null>(null);
  const [secure, setSecure] = useState(true);

  // sudut tampilan "tak terputus" agar animasi tidak berputar 360° saat melewati Utara
  const dialAngle = useRef(0);
  const pointerAngle = useRef(0);
  const absoluteSeen = useRef(false);

  useEffect(() => setSecure(isSecureOrigin()), []);

  // ---------- Kompas ----------
  const handleOrientation = useRef((e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
    let h: number | null = null;
    if (typeof e.webkitCompassHeading === 'number') {
      h = e.webkitCompassHeading; // iOS: sudah relatif ke Utara
    } else if (e.alpha !== null && (e.absolute || e.type === 'deviceorientationabsolute')) {
      absoluteSeen.current = true;
      h = 360 - e.alpha;
    } else if (e.alpha !== null && !absoluteSeen.current) {
      // event relatif (tidak mengacu Utara) diabaikan jika sumber absolut tersedia
      return;
    }
    if (h === null) return;
    const screenAngle = (typeof window !== 'undefined' && window.screen?.orientation?.angle) || 0;
    setHeading((((h + screenAngle) % 360) + 360) % 360);
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
    // iOS 13+ wajib minta izin lewat tap pengguna
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

  // ---------- Rotasi ----------
  const hd = heading ?? 0;
  const targetDial = -hd;
  const targetPointer = qibla.az - hd;
  dialAngle.current += wrap180(targetDial - dialAngle.current);
  pointerAngle.current += wrap180(targetPointer - pointerAngle.current);

  const offset = wrap180(qibla.az - hd);
  const isFacingQibla = heading !== null && Math.abs(offset) < 3;
  const turnHint =
    heading === null ? null : isFacingQibla ? 'Tepat! Anda menghadap Kiblat' : offset > 0 ? `Putar ke kanan ${Math.abs(offset).toFixed(0)}°` : `Putar ke kiri ${Math.abs(offset).toFixed(0)}°`;

  return (
    <div className="h-full w-full overflow-y-auto bg-[#070e14] text-slate-200">
      <div className="mx-auto max-w-lg px-4 pb-10 pt-5">
        {/* Lokasi & GPS */}
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

        {/* Kompas */}
        <div className="relative mb-6 flex flex-col items-center">
          <div
            className={`mb-5 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest transition-all ${
              isFacingQibla ? 'scale-105 border-emerald-400/60 bg-emerald-500/15 text-emerald-300' : 'border-slate-700 bg-slate-900/60 text-slate-400'
            }`}
          >
            {turnHint ?? 'Arah Kiblat dari Utara'}
          </div>

          <div className="relative aspect-square w-full max-w-[320px]">
            {/* penanda arah atas HP */}
            <div
              className={`absolute left-1/2 top-0 z-10 h-7 w-[3px] -translate-x-1/2 -translate-y-3 rounded-full transition-colors ${
                isFacingQibla ? 'bg-emerald-400' : 'bg-slate-400/70'
              }`}
            />
            <div className="absolute inset-0 rounded-full border-[8px] border-[#0c141d] bg-[radial-gradient(circle_at_50%_40%,#132231,#0b131c)] shadow-2xl">
              {/* Piringan kompas */}
              <div className="absolute inset-0 transition-transform duration-200 ease-out" style={{ transform: `rotate(${dialAngle.current}deg)` }}>
                {Array.from({ length: 72 }).map((_, i) => (
                  <div key={i} className="absolute inset-0" style={{ transform: `rotate(${i * 5}deg)` }}>
                    <div className={`mx-auto ${i % 18 === 0 ? 'h-3 w-[2px] bg-slate-300' : i % 2 === 0 ? 'h-2 w-px bg-slate-600' : 'h-1 w-px bg-slate-700'}`} />
                  </div>
                ))}
                {[
                  ['U', 0, 'text-rose-400'],
                  ['T', 90, 'text-slate-400'],
                  ['S', 180, 'text-slate-400'],
                  ['B', 270, 'text-slate-400'],
                ].map(([l, a, c]) => (
                  <div key={l as string} className="absolute inset-0" style={{ transform: `rotate(${a}deg)` }}>
                    <div className={`mx-auto mt-5 w-fit text-sm font-bold ${c}`} style={{ transform: `rotate(${-(a as number)}deg)` }}>
                      {l}
                    </div>
                  </div>
                ))}
              </div>

              {/* Penunjuk Kiblat */}
              <div className="absolute inset-0 transition-transform duration-200 ease-out" style={{ transform: `rotate(${pointerAngle.current}deg)` }}>
                <div
                  className={`absolute left-1/2 top-[14%] h-[36%] w-1.5 -translate-x-1/2 rounded-full transition-colors ${
                    isFacingQibla ? 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)]' : 'bg-teal-500/50'
                  }`}
                />
                <div
                  className={`absolute left-1/2 top-[3%] flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full border-4 transition-colors ${
                    isFacingQibla ? 'border-emerald-400 bg-emerald-950 shadow-[0_0_30px_rgba(52,211,153,0.6)]' : 'border-teal-800 bg-slate-900'
                  }`}
                >
                  <span className="text-xl">🕋</span>
                </div>
              </div>

              <div
                className={`absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 transition-colors ${
                  isFacingQibla ? 'bg-emerald-400 ring-emerald-900' : 'bg-slate-300 ring-slate-800'
                }`}
              />
            </div>
          </div>

          {/* Status sensor */}
          <div className="mt-5 w-full">
            {compass === 'need-permission' && (
              <button
                id="kiblat-compass-permission"
                onClick={requestCompass}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-sm font-bold text-slate-950 active:scale-95"
              >
                <Compass className="h-4 w-4" /> Aktifkan Kompas
              </button>
            )}
            {compass === 'active' && heading === null && (
              <p className="flex items-center justify-center gap-2 text-center text-[11px] text-slate-500">
                <Smartphone className="h-3.5 w-3.5" /> Menunggu sensor kompas… gerakkan HP membentuk angka 8 untuk kalibrasi.
              </p>
            )}
            {(compass === 'unsupported' || compass === 'insecure') && (
              <p className="text-center text-[11px] leading-relaxed text-slate-500">
                {compass === 'insecure'
                  ? 'Kompas otomatis butuh HTTPS. Gunakan kompas manual: arahkan HP ke Utara, lalu putar sesuai azimuth di bawah.'
                  : 'Sensor kompas tidak tersedia di perangkat ini. Gunakan azimuth di bawah dengan kompas fisik.'}
              </p>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="rounded-2xl border border-slate-800 bg-[#111923] p-5 text-center shadow-lg">
          <div className="mb-1 text-[11px] font-bold tracking-widest text-slate-500">AZIMUTH KIBLAT (DARI UTARA SEJATI)</div>
          <div className={`mb-5 text-5xl font-bold transition-colors ${isFacingQibla ? 'text-emerald-400' : 'text-teal-400'}`}>{qibla.az.toFixed(1)}°</div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
            <div>
              <div className="mb-1 text-[11px] font-bold text-slate-500">HEADING HP</div>
              <div className="font-mono text-base text-slate-200">{heading === null ? '—' : `${Math.round(heading)}°`}</div>
            </div>
            <div>
              <div className="mb-1 text-[11px] font-bold text-slate-500">JARAK KE KA&apos;BAH</div>
              <div className="font-mono text-base text-slate-200">{Math.round(qibla.distance).toLocaleString('id-ID')} km</div>
            </div>
          </div>
        </div>

        {/* Modal Dialog Pemilihan Lokasi & GPS */}
        <LocationPickerModal isOpen={showLocModal} onClose={() => setShowLocModal(false)} />
      </div>
    </div>
  );
}
