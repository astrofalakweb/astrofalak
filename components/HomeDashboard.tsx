import { useState } from 'react';
import { useRealtimeAstro } from '../lib/useAstro';
import { useAppStore } from '../lib/store';
import { MapPin, Globe, Sun, Clock, Compass, Orbit, BookOpen, Play, ChevronDown, Crosshair, CheckCircle2, AlertCircle, Mountain, Sliders } from 'lucide-react';
import { fmtHM } from '../lib/falak/time';
import { CITIES } from '../lib/falak/cities';
import { locateUser } from '../lib/geo';
import { LocationPickerModal } from './LocationPickerModal';
import { StarrySky } from './StarrySky';

export function HomeDashboard() {
  const { date, loc, sun, schedule, qibla } = useRealtimeAstro(1000);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const setLocation = useAppStore((s) => s.setLocation);

  const [locating, setLocating] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [geoNotice, setGeoNotice] = useState<{ type: 'ok' | 'err'; text: string; hint?: string } | null>(null);

  const handleUseGPS = async () => {
    setLocating(true);
    setGeoNotice(null);
    try {
      const res = await locateUser();
      setLocation(res.location);
      const accText = res.accuracy
        ? ` (Akurasi: ±${res.accuracy < 1000 ? `${res.accuracy} m` : `${(res.accuracy / 1000).toFixed(1)} km`})`
        : '';
      setGeoNotice({
        type: 'ok',
        text: `Lokasi berhasil diperbarui${accText}.`,
        hint: res.notice,
      });
    } catch (e: any) {
      setGeoNotice({
        type: 'err',
        text: e?.message || 'Gagal membaca lokasi perangkat.',
        hint: e?.hint,
      });
    } finally {
      setLocating(false);
    }
  };

  const isPresetCity = CITIES.some((x) => x.name === loc.name);
  const isGps = loc.name.includes('(GPS)') || loc.source === 'gps';
  const isWifi = loc.name.includes('(Wi-Fi)') || loc.source === 'wifi';
  const isPc = loc.name.includes('(PC)') || loc.name.includes('Jaringan PC') || loc.source === 'network';
  const isManual = loc.source === 'manual';
  
  const formatStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(date);
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

  const navButtons = [
    { label: 'Bola Langit', icon: <Globe className="h-5 w-5" />, color: 'bg-gradient-to-r from-blue-600 to-indigo-600', action: () => { setActivePage('3d'); setViewMode('celestial'); } },
    { label: 'Posisi Matahari', icon: <Sun className="h-5 w-5" />, color: 'bg-gradient-to-r from-amber-500 to-orange-600', action: () => { setActivePage('3d'); setViewMode('celestial'); } },
    { label: 'Waktu Salat', icon: <Clock className="h-5 w-5" />, color: 'bg-gradient-to-r from-teal-500 to-emerald-600', action: () => setActivePage('waktu') },
    { label: 'Arah Kiblat', icon: <Compass className="h-5 w-5" />, color: 'bg-gradient-to-r from-emerald-600 to-teal-700', action: () => setActivePage('kiblat') },
    { label: 'Tata Surya', icon: <Orbit className="h-5 w-5" />, color: 'bg-gradient-to-r from-pink-500 to-rose-600', action: () => { setActivePage('3d'); setViewMode('solarsystem'); } },
    { label: 'Panduan', icon: <BookOpen className="h-5 w-5" />, color: 'bg-gradient-to-r from-slate-700 to-slate-800', action: () => setActivePage('panduan') },
  ];

  const getPrayerTime = (key: string) => {
    const e = schedule.entries.find(e => e.key === key);
    return e && isFinite(e.time) ? fmtHM(e.time) : '--:--';
  };

  return (
    <div className="relative h-full w-full overflow-y-auto bg-[#02050f] text-slate-100">
      {/* Background Langit Malam Berbintang & Galaksi */}
      <StarrySky />

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 pb-24">
        
        {/* Header Astro Falak dengan Aksen Kosmik */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3.5 flex items-center justify-center gap-3">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 via-cyan-500 to-blue-500 text-white shadow-xl shadow-cyan-500/30 ring-1 ring-cyan-400/40">
              <Globe className="h-6 w-6 text-white drop-shadow" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-cyan-400 animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-cyan-300" />
            </div>
            <div className="text-left leading-none">
              <h1 className="text-2xl font-black text-white tracking-wider">Astro</h1>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300 tracking-wider">Falak</h1>
            </div>
          </div>
          <p className="text-xs text-slate-300/90 leading-relaxed max-w-lg font-medium">
            Laboratorium bola langit interaktif untuk pembelajaran astronomi, ilmu falak, dan sejarah pengamatan Islam. Jelajahi pergerakan benda langit, waktu salat, dan arah kiblat secara visual.
          </p>
        </div>

        {/* Location Card: Rapi, Terstruktur, Bebas Overflow di Mobile ("Tidak Keluar Bagan") */}
        <div className="mb-5 rounded-2xl border border-slate-800/90 bg-slate-900/65 backdrop-blur-xl p-4 sm:p-5 relative shadow-[0_8px_30px_rgb(0,0,0,0.45)] overflow-hidden transition-all hover:border-cyan-500/30">
          {/* Baris 1: Header Lokasi & Tombol Aksi Cepat (GPS & Modal) */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/70">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-sm">
                <MapPin className="h-4 w-4" />
              </div>
              <span className="text-xs uppercase tracking-wider font-bold text-slate-300">
                Lokasi Pengamat
              </span>
            </div>

            {/* Tombol Aksi Cepat: GPS & Modal Pencarian */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleUseGPS}
                disabled={locating}
                title="Gunakan sensor GPS perangkat HP / Wi-Fi"
                className="flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/15 px-2.5 py-1.5 text-[11px] font-bold text-teal-300 hover:bg-teal-500/25 active:scale-95 disabled:opacity-50 transition shadow-sm"
              >
                <Crosshair className={`h-3.5 w-3.5 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Mencari...' : 'GPS Saya'}</span>
              </button>

              <button
                onClick={() => setShowLocModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 px-2.5 py-1.5 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 hover:text-white active:scale-95 transition"
                title="Cari kota, kecamatan, atau masukkan koordinat manual"
              >
                <Sliders className="h-3 w-3 text-cyan-400" />
                <span>Cari / Atur</span>
              </button>
            </div>
          </div>

          {/* Baris 2: Nama Tempat Aktif & Pemilih Kota Cepat */}
          <div className="mt-3.5 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center flex-wrap gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">
                  {loc.name}
                </h2>
                {isGps && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-teal-500/40 bg-teal-500/15 px-2 py-0.5 text-[9px] font-bold text-teal-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                    GPS Satelit Presisi
                  </span>
                )}
                {isWifi && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/40 bg-blue-500/15 px-2 py-0.5 text-[9px] font-bold text-blue-300">
                    Wi-Fi Perangkat
                  </span>
                )}
                {isPc && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/40 bg-violet-500/15 px-2 py-0.5 text-[9px] font-bold text-violet-300">
                    Jaringan PC
                  </span>
                )}
                {isManual && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold text-amber-300">
                    Koordinat Kustom
                  </span>
                )}
                {loc.accuracy && loc.accuracy < 1000 && (
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/60">
                    ±{loc.accuracy} m
                  </span>
                )}
              </div>
            </div>

            {/* Dropdown Kota Cepat (responsif, w-full pada mobile, sm:w-[175px] pada desktop) */}
            <div className="relative w-full sm:w-[175px] shrink-0">
              <select
                value={loc.name}
                onChange={(e) => {
                  const c = CITIES.find((x) => x.name === e.target.value);
                  if (c) {
                    setLocation(c);
                    setGeoNotice(null);
                  }
                }}
                className="w-full appearance-none rounded-xl bg-slate-950/70 border border-slate-700/80 pl-3 pr-8 py-1.5 text-xs font-semibold text-cyan-300 cursor-pointer outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 truncate shadow-inner"
              >
                {!isPresetCity && (
                  <option value={loc.name} className="bg-slate-900 text-teal-300 font-bold">
                    📍 {loc.name}
                  </option>
                )}
                {CITIES.map((c) => (
                  <option key={c.name} value={c.name} className="bg-slate-900 text-slate-200">
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cyan-400 pointer-events-none" />
            </div>
          </div>

          {/* Baris 3: Grid Koordinat 4 Kolom */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400 border-t border-slate-800/70 pt-3">
            <div className="rounded-xl bg-slate-950/40 p-2.5 border border-slate-800/50">
              <div className="text-[10px] text-slate-500 font-medium">Lintang (Lat)</div>
              <div className="text-slate-200 font-mono font-bold text-xs mt-0.5">{loc.lat.toFixed(5)}°</div>
            </div>
            <div className="rounded-xl bg-slate-950/40 p-2.5 border border-slate-800/50">
              <div className="text-[10px] text-slate-500 font-medium">Bujur (Lon)</div>
              <div className="text-slate-200 font-mono font-bold text-xs mt-0.5">{loc.lon.toFixed(5)}°</div>
            </div>
            <div className="rounded-xl bg-slate-950/40 p-2.5 border border-slate-800/50">
              <div className="text-[10px] text-slate-500 font-medium">Elevasi (dpl)</div>
              <div className="text-teal-300 font-mono font-bold text-xs mt-0.5">{loc.elevation ?? 10} m</div>
            </div>
            <div className="rounded-xl bg-slate-950/40 p-2.5 border border-slate-800/50">
              <div className="text-[10px] text-slate-500 font-medium">Zona Waktu</div>
              <div className="text-slate-200 font-mono font-bold text-xs mt-0.5">UTC+{loc.tz}</div>
            </div>
          </div>

          {/* Feedback / Error Notice */}
          {geoNotice && (
            <div
              className={`mt-3 rounded-xl border p-2.5 text-xs ${
                geoNotice.type === 'ok'
                  ? 'border-teal-500/40 bg-teal-500/10 text-teal-200'
                  : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {geoNotice.type === 'ok' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-teal-400 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold">{geoNotice.text}</div>
                  {geoNotice.hint && <div className="mt-1 text-[11px] opacity-90 leading-relaxed">{geoNotice.hint}</div>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Dialog Pemilihan Lokasi & GPS */}
        <LocationPickerModal isOpen={showLocModal} onClose={() => setShowLocModal(false)} />

        {/* Big Action Button dengan Efek Gradien Kosmik */}
        <button 
          onClick={() => { setActivePage('3d'); setViewMode('celestial'); }}
          className="mb-5 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 py-4 font-bold text-white shadow-xl shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-95 hover:shadow-cyan-500/40"
        >
          <Play className="h-5 w-5 fill-current" /> Mulai Bola Langit 3D
        </button>

        {/* DateTime & Sun Info Glassmorphic Card */}
        <div className="mb-5 flex flex-wrap rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 gap-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.35)]">
          <div className="w-1/2">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Tanggal</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-100 mt-0.5">{formatStr}</div>
          </div>
          <div className="w-1/2">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Waktu</div>
            <div className="text-xs sm:text-sm font-bold text-cyan-300 font-mono mt-0.5">{timeStr}</div>
          </div>
          <div className="w-1/2">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Altitude Matahari</div>
            <div className="text-xs sm:text-sm font-semibold text-amber-300 font-mono mt-0.5">{sun.altitude.toFixed(1)}°</div>
          </div>
          <div className="w-1/2">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Azimuth Matahari</div>
            <div className="text-xs sm:text-sm font-semibold text-teal-300 font-mono mt-0.5">{sun.azimuth.toFixed(1)}°</div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          {navButtons.map((btn) => (
            <button key={btn.label} onClick={btn.action} className={`${btn.color} flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left font-bold text-white shadow-lg hover:opacity-95 active:scale-95 transition-all`}>
              <div className="p-1 rounded-lg bg-white/10 shrink-0">
                {btn.icon}
              </div>
              <span className="text-xs sm:text-sm tracking-wide">{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Prayer Times Summary Glassmorphic Card */}
        <div className="mb-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.35)]">
          <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-slate-300">
            <Clock className="h-4 w-4 text-teal-400" /> Waktu Salat Hari Ini
          </div>
          <div className="grid grid-cols-3 gap-y-4 gap-x-2 text-center">
            <div className="rounded-xl bg-slate-950/40 p-2 border border-slate-800/40">
              <div className="text-[10px] text-slate-400 font-medium">Subuh</div>
              <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">{getPrayerTime('subuh')}</div>
            </div>
            <div className="rounded-xl bg-slate-950/40 p-2 border border-slate-800/40">
              <div className="text-[10px] text-slate-400 font-medium">Terbit</div>
              <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">{getPrayerTime('terbit')}</div>
            </div>
            <div className="rounded-xl bg-slate-950/40 p-2 border border-slate-800/40">
              <div className="text-[10px] text-slate-400 font-medium">Zuhur</div>
              <div className="text-sm font-bold text-slate-200 font-mono mt-0.5">{getPrayerTime('dzuhur')}</div>
            </div>
            <div className="rounded-xl bg-slate-950/40 p-2 border border-slate-800/40">
              <div className="text-[10px] text-slate-400 font-medium">Asar</div>
              <div className="text-sm font-bold text-orange-300 font-mono mt-0.5">{getPrayerTime('ashar')}</div>
            </div>
            <div className="rounded-xl bg-slate-950/40 p-2 border border-slate-800/40">
              <div className="text-[10px] text-slate-400 font-medium">Maghrib</div>
              <div className="text-sm font-bold text-rose-300 font-mono mt-0.5">{getPrayerTime('maghrib')}</div>
            </div>
            <div className="rounded-xl bg-slate-950/40 p-2 border border-slate-800/40">
              <div className="text-[10px] text-slate-400 font-medium">Isya</div>
              <div className="text-sm font-bold text-indigo-300 font-mono mt-0.5">{getPrayerTime('isya')}</div>
            </div>
          </div>
        </div>

        {/* Qibla Summary Glassmorphic Card */}
        <div className="mb-5 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(0,0,0,0.35)]">
          <div className="mb-3.5 flex items-center gap-2 text-xs uppercase tracking-wider font-bold text-slate-300">
            <Compass className="h-4 w-4 text-emerald-400" /> Arah Kiblat
          </div>
          <div className="flex justify-between items-end bg-slate-950/40 rounded-xl p-3 border border-slate-800/40">
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Azimuth</div>
              <div className="text-lg font-bold text-emerald-300 font-mono">{qibla.az.toFixed(1)}°</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-slate-400 font-medium">Arah</div>
              <div className="text-sm font-bold text-slate-200">Barat Laut</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-medium">Jarak ke Ka&apos;bah</div>
              <div className="text-sm font-bold text-teal-300 font-mono">{qibla.distance.toFixed(0)} km</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
