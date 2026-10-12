import { useEffect, useState, useMemo } from 'react';
import { Calendar, Settings, MapPin, Moon, Sun, Sunrise, Sunset, Clock, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useAstro } from '../lib/useAstro';
import { useAppStore } from '../lib/store';
import { fmtHM } from '../lib/falak/time';
import { sunState } from '../lib/falak/math';
import { computePrayerTimes } from '../lib/falak/prayer';
import { CITIES } from '../lib/falak/cities';

const ICONS: Record<string, React.ReactNode> = {
  imsak: <Moon className="h-4 w-4" />,
  subuh: <Moon className="h-4 w-4" />,
  terbit: <Sunrise className="h-4 w-4 text-amber-400" />,
  dhuha: <Sun className="h-4 w-4 text-amber-300" />,
  dzuhur: <Sun className="h-4 w-4 text-amber-500" />,
  ashar: <Sun className="h-4 w-4 text-orange-400" />,
  maghrib: <Sunset className="h-4 w-4 text-rose-500" />,
  isya: <Moon className="h-4 w-4 text-indigo-400" />,
};

const METHODS = [
  { id: 'lfnu', name: 'Lembaga Falakiyah NU (LFNU)', desc: 'Subuh: 20° · Isya: 18° · Asr: Shafi · Ihtiyat: +2m' },
  { id: 'kemenag', name: 'Kemenag RI / MABIMS', desc: 'Subuh: 20° · Isya: 18° · Asr: Shafi · Ihtiyat: +2m' },
  { id: 'falak_abi', name: 'Falak Abi', desc: 'Subuh: 17.7° · Isya: 17.7° · Asr: Shafi · Ihtiyat: +0m · Maghrib: -4.5°' },
  { id: 'mwl', name: 'MWL (Hakiki Tahkiki)', desc: 'Subuh: 18° · Isya: 17° · Asr: Shafi · Ihtiyat: +2m' },
  { id: 'isna', name: 'ISNA (Hakiki Tahkiki)', desc: 'Subuh: 15° · Isya: 15° · Asr: Shafi · Ihtiyat: +2m' },
  { id: 'egypt', name: 'Egyptian (Hakiki Tahkiki)', desc: 'Subuh: 19.5° · Isya: 17.5° · Asr: Shafi · Ihtiyat: +2m' },
  { id: 'makkah', name: 'Makkah Umm al-Qura', desc: 'Subuh: 18.5° · Isya: 90m setelah maghrib · Asr: Shafi · Ihtiyat: +2m' },
  { id: 'hanafi', name: 'Hanafi (Asr Factor 2)', desc: 'Subuh: 18° · Isya: 17° · Asr: Hanafi · Ihtiyat: +2m' },
];

function formatDuration(ms: number) {
  if (ms < 0) return '00:00:00';
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function WaktuSalatPage() {
  const { schedule, loc, date } = useAstro();
  const setActivePage = useAppStore((s) => s.setActivePage);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const moveCamera = useAppStore((s) => s.moveCamera);
  const setSimDate = useAppStore((s) => s.setSimDate);
  const setLocation = useAppStore((s) => s.setLocation);

  const [now, setNow] = useState(new Date());
  const [view, setView] = useState<'daily' | 'monthly'>('daily');
  const [showSettings, setShowSettings] = useState(false);
  const [showLocPicker, setShowLocPicker] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [activeMethod, setActiveMethod] = useState('lfnu');

  useEffect(() => {
    // Render lebih cepat agar hitung mundur halus
    const t = setInterval(() => setNow(new Date()), 50);
    return () => clearInterval(t);
  }, []);

  const currentHrs = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  
  // Exclude terbenam for finding "next prayer" in daily view
  const prayerEntries = schedule.entries.filter(e => e.key !== 'terbenam' && e.key !== 'terbit' && e.key !== 'imsak');
  let nextIdx = prayerEntries.findIndex((e) => currentHrs < e.time);
  if (nextIdx === -1) nextIdx = 0; // Wrap around to tomorrow's imsak/subuh
  const nextPrayer = prayerEntries[nextIdx];
  const activeEntry = nextPrayer;

  const getSunData = (timeHrs: number) => {
    const d = new Date(date);
    d.setHours(Math.floor(timeHrs), (timeHrs % 1) * 60, 0);
    return sunState(d, loc.lat, loc.lon);
  };

  const jumpToTime = (timeHrs: number) => {
    const d = new Date(date);
    d.setHours(Math.floor(timeHrs), (timeHrs % 1) * 60, 0);
    setSimDate(d);
    setActivePage('3d');
    setViewMode('celestial');
    moveCamera('matahari');
  };

  // Kalkulasi Countdown
  let msDiff = 0;
  let totalDur = 1;
  let elapsedDur = 0;
  if (activeEntry) {
    let nextDate = new Date(now);
    nextDate.setHours(Math.floor(activeEntry.time), (activeEntry.time % 1) * 60, 0);
    if (nextIdx === 0 && currentHrs > 12) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    msDiff = nextDate.getTime() - now.getTime();
    
    const prevIdx = (nextIdx - 1 + prayerEntries.length) % prayerEntries.length;
    const prevPrayer = prayerEntries[prevIdx];
    let prevDate = new Date(now);
    prevDate.setHours(Math.floor(prevPrayer.time), (prevPrayer.time % 1) * 60, 0);
    if (prevIdx > nextIdx) {
      prevDate.setDate(prevDate.getDate() - 1);
    }
    
    totalDur = nextDate.getTime() - prevDate.getTime();
    elapsedDur = now.getTime() - prevDate.getTime();
  }
  const pct = Math.max(0, Math.min(100, (elapsedDur / totalDur) * 100));

  // Monthly Data
  const monthDate = new Date(date.getFullYear(), date.getMonth() + monthOffset, 1);
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const currentMonthStr = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(monthDate);
  
  const monthlyData = useMemo(() => {
    const res = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(monthDate.getFullYear(), monthDate.getMonth(), i, 12, 0, 0);
      const s = computePrayerTimes(d, loc.lat, loc.lon, loc.tz, loc.elevation || 0);
      res.push({ day: i, schedule: s });
    }
    return res;
  }, [monthDate.getFullYear(), monthDate.getMonth(), loc.lat, loc.lon, loc.tz, loc.elevation]);

  return (
    <div className="h-full w-full overflow-y-auto bg-[#070e14] text-slate-200 font-sans selection:bg-teal-500/30">
      <div className="mx-auto max-w-4xl px-4 py-6 pb-24">
        
        {/* Top Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-teal-400" />
            <h1 className="text-lg font-bold text-white tracking-wide">Jadwal Shalat</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] uppercase text-slate-500 font-semibold">Waktu Lokal</div>
              <div className="font-mono text-sm font-bold text-teal-400">{now.toLocaleTimeString('id-ID')}</div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { setView(view === 'daily' ? 'monthly' : 'daily'); setShowSettings(false); setShowLocPicker(false); }}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${view === 'monthly' ? 'border-teal-500 bg-teal-500/20 text-teal-400' : 'border-slate-800 bg-[#14202c] hover:bg-slate-800'}`}
              >
                <Calendar className="h-4 w-4" />
              </button>
              <button 
                onClick={() => { setShowSettings(!showSettings); setShowLocPicker(false); }}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${showSettings ? 'border-teal-500 bg-teal-500/20 text-teal-400' : 'border-slate-800 bg-[#14202c] hover:bg-slate-800'}`}
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Location & Status Bar */}
        <div className="mb-6 rounded-xl border border-slate-800 bg-[#111923] p-4 relative">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {loc.name}
              </h2>
              <div className="text-[10px] text-slate-500 mb-2 font-mono mt-1">
                {loc.lat.toFixed(4)}°, {loc.lon.toFixed(4)}° · UTC+{loc.tz}
              </div>
            </div>
            <button 
              onClick={() => { setShowLocPicker(!showLocPicker); setShowSettings(false); }}
              className="text-xs font-bold text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 px-3 py-1.5 rounded border border-teal-500/20 transition-colors"
            >
              Ganti Lokasi
            </button>
          </div>
          
          <div className="text-xs text-slate-400 mb-4">{new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date)}</div>
          
          <div className="flex flex-wrap gap-2 text-[10px] font-bold">
            <span className="rounded bg-teal-500/10 px-2 py-1 text-teal-400 border border-teal-500/20">Hakiki Tahkiki</span>
            <span className="rounded bg-slate-800 px-2 py-1 text-slate-300">{METHODS.find(m => m.id === activeMethod)?.name}</span>
            <span className="rounded bg-slate-800 px-2 py-1 text-slate-300">Ihtiyat +2m</span>
          </div>
        </div>

        {/* Location Picker Panel */}
        {showLocPicker && (
          <div className="mb-6 rounded-xl border border-slate-800 bg-[#111923] overflow-hidden">
            <div className="bg-[#0c141d] px-5 py-3 text-xs font-bold text-teal-400 border-b border-slate-800">
              Pilih Lokasi Referensi
            </div>
            <div className="max-h-64 overflow-y-auto flex flex-col">
              {CITIES.map((c) => (
                <button
                  key={c.name}
                  onClick={() => { setLocation(c); setShowLocPicker(false); }}
                  className={`flex items-center justify-between border-b border-slate-800/50 p-4 text-left transition-colors last:border-0 ${loc.name === c.name ? 'bg-teal-500/20' : 'hover:bg-slate-800/50'}`}
                >
                  <span className={`text-sm font-bold ${loc.name === c.name ? 'text-teal-400' : 'text-slate-200'}`}>{c.name}</span>
                  <span className="text-[10px] font-mono text-slate-500">{c.lat.toFixed(2)}°, {c.lon.toFixed(2)}°</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="mb-6 rounded-xl border border-slate-800 bg-[#111923] overflow-hidden">
            <div className="bg-[#0c141d] px-5 py-3 text-xs font-bold text-teal-400 border-b border-slate-800">
              Metode Perhitungan (Hakiki Tahkiki)
            </div>
            <div className="flex flex-col">
              {METHODS.map(m => (
                <button 
                  key={m.id}
                  onClick={() => setActiveMethod(m.id)}
                  className={`flex flex-col border-b border-slate-800/50 p-4 text-left transition-colors last:border-0 ${activeMethod === m.id ? 'bg-teal-500/20' : 'hover:bg-slate-800/50'}`}
                >
                  <span className={`text-sm font-bold ${activeMethod === m.id ? 'text-teal-400' : 'text-slate-200'}`}>{m.name}</span>
                  <span className="text-[10px] text-slate-500 mt-1">{m.desc}</span>
                </button>
              ))}
            </div>
            <div className="bg-[#0c141d] px-5 py-4 text-[10px] text-slate-500 border-t border-slate-800 flex items-start gap-3">
              <Info className="h-4 w-4 shrink-0 text-slate-400" />
              <p>Metode Hakiki Tahkiki menghitung posisi matahari menggunakan algoritma Falak secara presisi (Julian Day, deklinasi, persamaan waktu) dengan koreksi ketinggian tempat. Ihtiyat ditambahkan sebagai pengaman. Pembulatan ke menit berikutnya (round up).</p>
            </div>
          </div>
        )}

        {/* Daily View */}
        {!showSettings && view === 'daily' && (
          <>
            {/* Next Prayer Card */}
            {activeEntry && (
              <div 
                onClick={() => jumpToTime(activeEntry.time)}
                className="group mb-6 cursor-pointer rounded-xl border border-teal-500/30 bg-gradient-to-br from-[#0c2225] to-[#0f1b25] p-5 transition hover:border-teal-400/50 hover:shadow-lg hover:shadow-teal-900/20 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                <div className="relative z-10 flex items-end justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-500">
                      <Clock className="h-3.5 w-3.5" /> Shalat Berikutnya
                    </div>
                    <div className="text-4xl font-bold text-white mb-1">{activeEntry.name}</div>
                    <div className="font-mono text-xl text-teal-400">{fmtHM(activeEntry.time)}</div>
                  </div>
                  <div className="text-right">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">Hitung Mundur</div>
                    <div className="font-mono text-2xl font-bold text-white">{formatDuration(msDiff)}</div>
                  </div>
                </div>
                <div className="relative z-10 mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-800/50">
                  <div className="h-full bg-teal-500 transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                </div>
                <div className="relative z-10 mt-2 text-[10px] text-slate-500 text-right">
                  Klik untuk melompat ke visualisasi 3D Bola Langit
                </div>
              </div>
            )}

            {/* Grid List */}
            <div className="grid gap-3 sm:grid-cols-2">
              {schedule.entries.filter(e => e.key !== 'terbenam').map((e) => {
                const isNext = e.key === activeEntry?.key;
                const isPassed = !isNext && currentHrs > e.time;
                const sun = getSunData(e.time);
                
                return (
                  <div 
                    key={e.key} 
                    onClick={() => jumpToTime(e.time)}
                    className={`group relative flex cursor-pointer flex-col justify-between rounded-xl border p-4 transition hover:border-teal-500 hover:shadow-lg hover:shadow-teal-900/10 ${
                      isNext ? 'border-teal-500/50 bg-[#122329]' : 'border-slate-800 bg-[#111923]'
                    }`}
                  >
                    {isNext && <span className="absolute right-3 top-3 rounded bg-teal-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal-400">Berikutnya</span>}
                    
                    <div className="mb-4">
                      <div className={`mb-1 flex items-center gap-2 text-sm font-bold ${isNext ? 'text-teal-400' : 'text-slate-300'}`}>
                        {ICONS[e.key]} {e.name}
                      </div>
                      <div className={`text-2xl font-bold font-mono ${isNext ? 'text-white' : (isPassed ? 'text-slate-500' : 'text-slate-200')}`}>
                        {isFinite(e.time) ? fmtHM(e.time) : '--:--'}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-500">{e.criteria}</div>
                    </div>

                    <div className="flex justify-between border-t border-slate-800/60 pt-3">
                      <div className="text-[10px] text-slate-500">
                        <div>Altitude</div>
                        <div>Azimuth</div>
                      </div>
                      <div className="text-[10px] font-mono text-slate-300 text-right">
                        <div>{sun.altitude.toFixed(1)}°</div>
                        <div>{sun.azimuth.toFixed(1)}°</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timeline Hari Ini */}
            <div className="mt-6 rounded-xl border border-slate-800 bg-[#111923] p-5">
              <h3 className="mb-6 font-bold text-white">Timeline Hari Ini</h3>
              <div className="relative h-1.5 w-full rounded-full bg-slate-700/50 mb-8">
                {/* Garis current time (hijau) yang sudah lewat */}
                <div 
                  className="absolute left-0 top-0 h-full bg-teal-500 rounded-full" 
                  style={{ width: `${(currentHrs / 24) * 100}%` }}
                />
                
                {/* Titik Jadwal */}
                {schedule.entries.map(e => {
                  if (e.key === 'terbenam') return null; // skip terbenam on timeline to avoid clutter if requested
                  const pos = (e.time / 24) * 100;
                  return (
                    <div 
                      key={e.key} 
                      className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#111923]"
                      style={{ 
                        left: `${pos}%`, 
                        backgroundColor: currentHrs > e.time ? '#14b8a6' : '#f59e0b',
                        zIndex: 10
                      }}
                      title={e.name}
                    />
                  );
                })}
                
                {/* Indikator Waktu Saat Ini */}
                <div 
                  className="absolute top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                  style={{ left: `${(currentHrs / 24) * 100}%`, zIndex: 20 }}
                >
                  <div className="mb-1 text-[10px] font-bold text-teal-400 font-mono">
                    {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="h-6 w-1 bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.8)]" />
                  <div className="h-4 w-4 rounded-full border-[3px] border-teal-400 bg-[#111923] mt-[-2px]" />
                </div>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>24:00</span>
              </div>
            </div>

            {/* Data Astronomi */}
            <div className="mt-6 rounded-xl border border-slate-800 bg-[#111923] p-5">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-teal-400">
                <Info className="h-4 w-4" /> Data Astronomi
              </h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Deklinasi Matahari</span>
                  <span className="font-mono text-white">{schedule.dec.toFixed(4)}°</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Equation of Time</span>
                  <span className="font-mono text-white">{(schedule.eot).toFixed(2)}m</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Solar Noon</span>
                  <span className="font-mono text-white">{fmtHM(schedule.transit)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Ihtiyat</span>
                  <span className="font-mono text-white">+2m</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Monthly View */}
        {view === 'monthly' && (
          <div className="rounded-xl border border-slate-800 bg-[#111923] overflow-hidden">
            <div className="flex items-center justify-between bg-[#0c141d] p-4 border-b border-slate-800">
              <button 
                onClick={() => setMonthOffset(o => o - 1)}
                className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="text-sm font-bold text-white">{currentMonthStr}</div>
              <button 
                onClick={() => setMonthOffset(o => o + 1)}
                className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#14202c] text-[10px] font-bold uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-800">Tgl</th>
                    <th className="px-4 py-3 border-b border-slate-800">Subuh</th>
                    <th className="px-4 py-3 border-b border-slate-800">Terbit</th>
                    <th className="px-4 py-3 border-b border-slate-800 text-amber-400/80">Dhuha</th>
                    <th className="px-4 py-3 border-b border-slate-800 text-amber-400/80">Zuhur</th>
                    <th className="px-4 py-3 border-b border-slate-800 text-amber-400/80">Asar</th>
                    <th className="px-4 py-3 border-b border-slate-800 text-rose-400/80">Magrib</th>
                    <th className="px-4 py-3 border-b border-slate-800 text-indigo-400/80">Isya</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {monthlyData.map(({ day, schedule }) => {
                    const getT = (k: string) => {
                      const e = schedule.entries.find(x => x.key === k);
                      return e ? fmtHM(e.time) : '--:--';
                    };
                    
                    const isToday = day === date.getDate() && monthOffset === 0;
                    
                    return (
                      <tr key={day} className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${isToday ? 'bg-teal-900/20 text-teal-400 font-bold' : ''}`}>
                        <td className="px-4 py-3">{day.toString().padStart(2, '0')}</td>
                        <td className="px-4 py-3">{getT('subuh')}</td>
                        <td className="px-4 py-3">{getT('terbit')}</td>
                        <td className="px-4 py-3">{getT('dhuha')}</td>
                        <td className="px-4 py-3">{getT('dzuhur')}</td>
                        <td className="px-4 py-3">{getT('ashar')}</td>
                        <td className="px-4 py-3">{getT('maghrib')}</td>
                        <td className="px-4 py-3">{getT('isya')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
