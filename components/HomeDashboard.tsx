import { useRealtimeAstro } from '../lib/useAstro';
import { useAppStore } from '../lib/store';
import { MapPin, Globe, Sun, Clock, Compass, Orbit, BookOpen, Play, ChevronDown } from 'lucide-react';
import { fmtHM } from '../lib/falak/time';
import { CITIES } from '../lib/falak/cities';

export function HomeDashboard() {
  const { date, loc, sun, schedule, qibla } = useRealtimeAstro(1000);
  const setActivePage = useAppStore((s) => s.setActivePage);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const setLocation = useAppStore((s) => s.setLocation);
  
  const formatStr = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }).format(date);
  const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;

  const navButtons = [
    { label: 'Bola Langit', icon: <Globe className="h-5 w-5" />, color: 'bg-blue-500', action: () => { setActivePage('3d'); setViewMode('celestial'); } },
    { label: 'Posisi Matahari', icon: <Sun className="h-5 w-5" />, color: 'bg-orange-500', action: () => { setActivePage('3d'); setViewMode('celestial'); } },
    { label: 'Waktu Salat', icon: <Clock className="h-5 w-5" />, color: 'bg-teal-500', action: () => setActivePage('waktu') },
    { label: 'Arah Kiblat', icon: <Compass className="h-5 w-5" />, color: 'bg-emerald-500', action: () => setActivePage('kiblat') },
    { label: 'Tata Surya', icon: <Orbit className="h-5 w-5" />, color: 'bg-pink-500', action: () => { setActivePage('3d'); setViewMode('solarsystem'); } },
    { label: 'Panduan', icon: <BookOpen className="h-5 w-5" />, color: 'bg-slate-600', action: () => setActivePage('panduan') },
  ];

  const getPrayerTime = (key: string) => {
    const e = schedule.entries.find(e => e.key === key);
    return e && isFinite(e.time) ? fmtHM(e.time) : '--:--';
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0b141c] text-slate-200">
      <div className="mx-auto max-w-2xl px-4 py-8 pb-24">
        
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500 text-white">
              <Globe className="h-6 w-6" />
            </div>
            <div className="text-left leading-none">
              <h1 className="text-xl font-bold text-white tracking-wide">Astro</h1>
              <h1 className="text-xl font-bold text-cyan-400 tracking-wide">Falak</h1>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
            Laboratorium bola langit interaktif untuk pembelajaran astronomi, ilmu falak, dan sejarah pengamatan Islam. Jelajahi pergerakan benda langit, waktu salat, dan arah kiblat secara visual.
          </p>
        </div>

        {/* Location Card */}
        <div className="mb-4 rounded-xl border border-slate-800 bg-[#14202c] p-4 relative">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 uppercase tracking-wider"><MapPin className="h-3.5 w-3.5" /> Lokasi Saat Ini</div>
            <div className="relative">
              <select
                value={loc.name}
                onChange={(e) => {
                  const c = CITIES.find(x => x.name === e.target.value);
                  if (c) setLocation(c);
                }}
                className="appearance-none bg-transparent pl-2 pr-6 py-1 text-cyan-400 font-medium cursor-pointer outline-none focus:ring-2 focus:ring-cyan-500/50 rounded-md"
              >
                {CITIES.map(c => (
                  <option key={c.name} value={c.name} className="bg-[#14202c] text-slate-200">
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 h-4 w-4 text-cyan-400 pointer-events-none" />
            </div>
          </div>
          <h2 className="mb-3 text-lg font-bold text-white">{loc.name}</h2>
          <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400">
            <div>Lintang<br/><span className="text-slate-200 font-medium">{loc.lat.toFixed(4)}°</span></div>
            <div>Bujur<br/><span className="text-slate-200 font-medium">{loc.lon.toFixed(4)}°</span></div>
            <div>Zona<br/><span className="text-slate-200 font-medium">UTC+{loc.tz}</span></div>
          </div>
        </div>

        {/* Big Action Button */}
        <button 
          onClick={() => { setActivePage('3d'); setViewMode('celestial'); }}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3.5 font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-95"
        >
          <Play className="h-5 w-5 fill-current" /> Mulai Bola Langit 3D
        </button>

        {/* DateTime & Sun Info */}
        <div className="mb-4 flex flex-wrap rounded-xl border border-slate-800 bg-[#14202c] p-4 gap-y-4">
          <div className="w-1/2">
            <div className="text-[10px] text-slate-500 uppercase">Tanggal</div>
            <div className="text-xs font-semibold text-slate-200">{formatStr}</div>
          </div>
          <div className="w-1/2">
            <div className="text-[10px] text-slate-500 uppercase">Waktu</div>
            <div className="text-xs font-semibold text-slate-200">{timeStr}</div>
          </div>
          <div className="w-1/2">
            <div className="text-[10px] text-slate-500 uppercase">Altitude Matahari</div>
            <div className="text-xs font-semibold text-slate-200">{sun.altitude.toFixed(1)}°</div>
          </div>
          <div className="w-1/2">
            <div className="text-[10px] text-slate-500 uppercase">Azimuth Matahari</div>
            <div className="text-xs font-semibold text-slate-200">{sun.azimuth.toFixed(1)}°</div>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          {navButtons.map((btn) => (
            <button key={btn.label} onClick={btn.action} className={`${btn.color} flex items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold text-white shadow-sm hover:opacity-90 active:scale-95 transition-all`}>
              {btn.icon}
              <span className="text-sm">{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Prayer Times Summary */}
        <div className="mb-4 rounded-xl border border-slate-800 bg-[#14202c] p-4">
          <div className="mb-4 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400">
            <Clock className="h-4 w-4" /> Waktu Salat Hari Ini
          </div>
          <div className="grid grid-cols-3 gap-y-4 text-center">
            <div>
              <div className="text-[10px] text-slate-500">Subuh</div>
              <div className="text-sm font-bold text-slate-200">{getPrayerTime('subuh')}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Terbit</div>
              <div className="text-sm font-bold text-slate-200">{getPrayerTime('terbit')}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Zuhur</div>
              <div className="text-sm font-bold text-slate-200">{getPrayerTime('dzuhur')}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Asar</div>
              <div className="text-sm font-bold text-slate-200">{getPrayerTime('ashar')}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Maghrib</div>
              <div className="text-sm font-bold text-slate-200">{getPrayerTime('maghrib')}</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500">Isya</div>
              <div className="text-sm font-bold text-slate-200">{getPrayerTime('isya')}</div>
            </div>
          </div>
        </div>

        {/* Qibla Summary */}
        <div className="mb-4 rounded-xl border border-slate-800 bg-[#14202c] p-4">
          <div className="mb-3 flex items-center gap-1.5 text-xs uppercase tracking-wider text-slate-400">
            <Compass className="h-4 w-4" /> Arah Kiblat
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[10px] text-slate-500">Azimuth</div>
              <div className="text-lg font-bold text-slate-200">{qibla.az.toFixed(1)}°</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-slate-500">Arah</div>
              <div className="text-sm font-semibold text-slate-200">Barat Laut</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500">Jarak</div>
              <div className="text-sm font-bold text-slate-200">{qibla.distance.toFixed(0)} km</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
