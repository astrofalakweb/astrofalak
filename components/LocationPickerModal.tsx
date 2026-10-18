import { useState, useTransition } from 'react';
import {
  X,
  Search,
  Crosshair,
  MapPin,
  Check,
  Compass,
  Mountain,
  Globe2,
  Clock,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { CITIES, type ObserverLocation } from '../lib/falak/cities';
import { locateUser, searchLocations, fetchElevation, tzFromLon, type GeoResult } from '../lib/geo';
import { useAppStore } from '../lib/store';

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LocationPickerModal({ isOpen, onClose }: LocationPickerModalProps) {
  const currentLoc = useAppStore((s) => s.location);
  const setLocation = useAppStore((s) => s.setLocation);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ObserverLocation[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'semua' | 'jawa' | 'sumatera' | 'timur' | 'dunia'>('semua');

  // GPS state
  const [locating, setLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual Coordinates Input Tab
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [manualElev, setManualElev] = useState('');
  const [manualTz, setManualTz] = useState('7');

  if (!isOpen) return null;

  const handleUseGPS = async () => {
    setLocating(true);
    setGpsStatus('Mengunci sinyal satelit & sensor posisi...');
    setErrorMsg(null);
    try {
      const res: GeoResult = await locateUser();
      setLocation(res.location);
      const accText = res.accuracy
        ? `±${res.accuracy < 1000 ? `${res.accuracy} m` : `${(res.accuracy / 1000).toFixed(1)} km`}`
        : '';
      const tag = res.source === 'gps' ? 'GPS Satelit' : res.source === 'wifi' ? 'Wi-Fi' : 'Jaringan';
      setGpsStatus(`Sukses: ${res.location.name} (${tag} ${accText})`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (e: any) {
      setErrorMsg(e?.hint ? `${e.message} ${e.hint}` : e?.message || 'Gagal membaca lokasi perangkat.');
    } finally {
      setLocating(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setErrorMsg(null);
    try {
      const res = await searchLocations(searchQuery);
      setSearchResults(res);
      if (res.length === 0) {
        setErrorMsg(`Tidak ditemukan hasil untuk "${searchQuery}". Coba kata kunci kota atau koordinat.`);
      }
    } catch {
      setErrorMsg('Gagal mencari lokasi. Pastikan perangkat terhubung ke internet.');
    } finally {
      setSearching(false);
    }
  };

  const selectLocation = async (loc: ObserverLocation) => {
    // Jika elevasi belum terisi atau 0, coba ambil elevasi digital real-time
    if (!loc.elevation || loc.elevation <= 0) {
      const elev = await fetchElevation(loc.lat, loc.lon);
      if (elev !== null) {
        loc.elevation = elev;
      }
    }
    setLocation(loc);
    onClose();
  };

  const handleApplyManual = () => {
    const lat = parseFloat(manualLat);
    const lon = parseFloat(manualLon);
    const elev = parseFloat(manualElev) || 10;
    const tz = parseFloat(manualTz) || tzFromLon(lon);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setErrorMsg('Latitude harus antara -90° hingga +90°');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setErrorMsg('Longitude harus antara -180° hingga +180°');
      return;
    }

    const name = manualName.trim() || `Koordinat (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)`;
    const loc: ObserverLocation = {
      name,
      lat: Number(lat.toFixed(6)),
      lon: Number(lon.toFixed(6)),
      elevation: Math.round(elev),
      tz,
      source: 'manual',
    };
    setLocation(loc);
    onClose();
  };

  // Filter preset cities
  const filteredCities = CITIES.filter((c) => {
    if (selectedFilter === 'semua') return true;
    if (selectedFilter === 'jawa') {
      return (
        c.name.includes('Jakarta') ||
        c.name.includes('Bandung') ||
        c.name.includes('Bogor') ||
        c.name.includes('Depok') ||
        c.name.includes('Tangerang') ||
        c.name.includes('Bekasi') ||
        c.name.includes('Semarang') ||
        c.name.includes('Solo') ||
        c.name.includes('Surakarta') ||
        c.name.includes('Yogyakarta') ||
        c.name.includes('Sleman') ||
        c.name.includes('Surabaya') ||
        c.name.includes('Malang') ||
        c.name.includes('Cirebon') ||
        c.name.includes('Serang') ||
        c.name.includes('Kudus') ||
        c.name.includes('Purwokerto') ||
        c.name.includes('Jember')
      );
    }
    if (selectedFilter === 'sumatera') {
      return (
        c.name.includes('Aceh') ||
        c.name.includes('Medan') ||
        c.name.includes('Padang') ||
        c.name.includes('Pekanbaru') ||
        c.name.includes('Batam') ||
        c.name.includes('Palembang') ||
        c.name.includes('Jambi') ||
        c.name.includes('Bengkulu') ||
        c.name.includes('Lampung') ||
        c.name.includes('Pangkal Pinang')
      );
    }
    if (selectedFilter === 'timur') {
      return (
        c.name.includes('Bali') ||
        c.name.includes('Denpasar') ||
        c.name.includes('Mataram') ||
        c.name.includes('Kupang') ||
        c.name.includes('Makassar') ||
        c.name.includes('Manado') ||
        c.name.includes('Pontianak') ||
        c.name.includes('Banjarmasin') ||
        c.name.includes('Balikpapan') ||
        c.name.includes('Samarinda') ||
        c.name.includes('Ambon') ||
        c.name.includes('Jayapura') ||
        c.name.includes('Sorong') ||
        c.name.includes('Merauke')
      );
    }
    if (selectedFilter === 'dunia') {
      return (
        c.name.includes('Makkah') ||
        c.name.includes('Madinah') ||
        c.name.includes('Al-Quds') ||
        c.name.includes('Kairo') ||
        c.name.includes('Kuala Lumpur') ||
        c.name.includes('Tokyo') ||
        c.name.includes('London')
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-slate-700/80 bg-[#0d1620] text-slate-100 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-[#121e2b] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Pilih & Atur Lokasi Pengamat</h2>
              <p className="text-[11px] text-slate-400">
                Akurasi tinggi untuk Mobile, Web, dan Desktop PC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Tombol GPS Otomatis Presisi */}
          <div className="rounded-xl border border-teal-500/40 bg-gradient-to-r from-teal-500/15 via-teal-500/5 to-transparent p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                  <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                    Deteksi GPS Perangkat Otomatis
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  Mengunci satelit GPS (HP) atau Wi-Fi/Jaringan (PC/Laptop) dengan akurasi meter dan elevasi dpl.
                </p>
              </div>
              <button
                onClick={handleUseGPS}
                disabled={locating}
                className="flex items-center justify-center gap-2 rounded-xl border border-teal-400/50 bg-teal-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md hover:bg-teal-400 active:scale-95 disabled:opacity-60 transition shrink-0"
              >
                <Crosshair className={`h-4 w-4 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Mencari Koordinat...' : 'Gunakan GPS Saya'}</span>
              </button>
            </div>
            {gpsStatus && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-teal-500/20 px-3 py-2 text-[11px] font-medium text-teal-200 border border-teal-500/30">
                <Check className="h-3.5 w-3.5 shrink-0 text-teal-300" />
                <span>{gpsStatus}</span>
              </div>
            )}
          </div>

          {/* Alert Error/Hint */}
          {errorMsg && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Form Pencarian Kota / Kecamatan */}
          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kecamatan, kota, kelurahan, atau koordinat (lat, lon)..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-24 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 transition"
              />
              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="absolute right-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 active:scale-95 disabled:opacity-50 transition"
              >
                {searching ? 'Mencari...' : 'Cari'}
              </button>
            </div>
          </form>

          {/* Hasil Pencarian Online */}
          {searchResults.length > 0 && (
            <div className="rounded-xl border border-teal-500/40 bg-[#0f1b26] p-3 space-y-2">
              <div className="text-[10px] uppercase tracking-wider font-bold text-teal-400 flex items-center justify-between">
                <span>Hasil Pencarian ({searchResults.length})</span>
                <span className="text-slate-400 font-normal">Klik untuk memilih</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => selectLocation(r)}
                    className="flex w-full items-center justify-between rounded-lg p-2.5 text-left text-xs hover:bg-teal-500/15 border border-transparent hover:border-teal-500/30 transition group"
                  >
                    <div>
                      <div className="font-bold text-slate-100 group-hover:text-teal-300">{r.name}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-sm">{r.fullAddress || `${r.lat.toFixed(5)}°, ${r.lon.toFixed(5)}°`}</div>
                    </div>
                    <div className="text-right text-[10px] font-mono text-slate-400 shrink-0">
                      <div>{r.lat.toFixed(4)}°, {r.lon.toFixed(4)}°</div>
                      <div className="text-teal-400 font-semibold">UTC+{r.tz}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Accordion Input Koordinat Manual */}
          <div className="rounded-xl border border-slate-800 bg-[#0f1822] overflow-hidden">
            <button
              onClick={() => setShowManual(!showManual)}
              className="flex w-full items-center justify-between p-3 text-xs font-semibold text-slate-300 hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-cyan-400" />
                <span>Atur Koordinat Manual & Ketinggian (Presisi Khusus PC/Rukyat)</span>
              </div>
              <span className="text-[11px] text-teal-400 font-mono">{showManual ? '− Tutup' : '+ Buka'}</span>
            </button>

            {showManual && (
              <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 space-y-3">
                <p className="text-[11px] text-slate-400">
                  Masukkan koordinat dari Google Maps atau GPS navigasi untuk hisab falak presisi:
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">Nama Tempat/Label</label>
                    <input
                      type="text"
                      placeholder="Misal: Rumah Saya, Masjid Al-Falah"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">Zona Waktu (WIB=7, WITA=8, WIT=9)</label>
                    <select
                      value={manualTz}
                      onChange={(e) => setManualTz(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white focus:border-teal-400 focus:outline-none"
                    >
                      <option value="7">UTC+7 (WIB - Barat)</option>
                      <option value="8">UTC+8 (WITA - Tengah)</option>
                      <option value="9">UTC+9 (WIT - Timur)</option>
                      <option value="3">UTC+3 (Arab Saudi)</option>
                      <option value="0">UTC+0 (GMT)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">Lintang / Latitude (°)</label>
                    <input
                      type="text"
                      placeholder="-6.175392"
                      value={manualLat}
                      onChange={(e) => setManualLat(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-white focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">Bujur / Longitude (°)</label>
                    <input
                      type="text"
                      placeholder="106.827153"
                      value={manualLon}
                      onChange={(e) => setManualLon(e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-white focus:border-teal-400 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] font-medium text-slate-400 block mb-1">Elevasi / Ketinggian Tempat di atas laut (Meter dpl)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="15 (meter dpl)"
                        value={manualElev}
                        onChange={(e) => setManualElev(e.target.value)}
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-mono text-white focus:border-teal-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const lat = parseFloat(manualLat);
                          const lon = parseFloat(manualLon);
                          if (!isNaN(lat) && !isNaN(lon)) {
                            const e = await fetchElevation(lat, lon);
                            if (e !== null) setManualElev(e.toString());
                          }
                        }}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700"
                        title="Ambil elevasi otomatis dari satelit Open-Meteo DEM"
                      >
                        Auto-Elevasi DEM
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleApplyManual}
                  className="w-full rounded-xl bg-cyan-500 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 active:scale-95 transition"
                >
                  Terapkan Koordinat Presisi
                </button>
              </div>
            )}
          </div>

          {/* Filter Tab Kota Standar */}
          <div className="pt-2">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                Daftar Kota Standar Indonesia & Mancanegara
              </span>
              <span className="text-[10px] font-mono text-slate-500">{filteredCities.length} Kota</span>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'semua', label: 'Semua' },
                { id: 'jawa', label: 'Jawa & DIY' },
                { id: 'sumatera', label: 'Sumatera' },
                { id: 'timur', label: 'Kalimantan / Timur' },
                { id: 'dunia', label: 'Mancanegara' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedFilter(f.id as any)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition ${
                    selectedFilter === f.id
                      ? 'bg-teal-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Grid Kota */}
            <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/40 divide-y divide-slate-800/60">
              {filteredCities.map((c) => {
                const isActive = currentLoc.name === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => selectLocation(c)}
                    className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs transition ${
                      isActive ? 'bg-teal-500/15 text-teal-300 font-bold' : 'hover:bg-slate-800/50 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isActive && <Check className="h-3.5 w-3.5 text-teal-400 shrink-0" />}
                      <span className={isActive ? 'text-teal-300 font-bold' : 'text-slate-200'}>{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 shrink-0">
                      {c.elevation && (
                        <span className="flex items-center gap-0.5 text-slate-400">
                          <Mountain className="h-3 w-3" /> {c.elevation}m
                        </span>
                      )}
                      <span>UTC+{c.tz}</span>
                      <span className="text-slate-500">{c.lat.toFixed(2)}°, {c.lon.toFixed(2)}°</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-[#0e1722] px-5 py-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-300">Lokasi Aktif:</span>
            <span className="text-teal-300 font-bold truncate max-w-xs">{currentLoc.name}</span>
            {currentLoc.elevation && (
              <span className="text-slate-500">({currentLoc.elevation} m dpl)</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
