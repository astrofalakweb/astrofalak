import { useAppStore } from '../lib/store';
import { useAstro } from '../lib/useAstro';
import { Play, Pause, FastForward, Rewind } from 'lucide-react';
import { formatTime } from '../lib/falak/prayer';

const PLANET_INFO: Record<string, any> = {
  Matahari: { desc: 'Bintang pusat tata surya kita.', radius: '696.340 km', period: '-', dist: '0 SA' },
  Merkurius: { desc: 'Planet terdekat dari Matahari, sangat panas di siang hari.', radius: '2.439 km', period: '88 hari', dist: '0.39 SA' },
  Venus: { desc: 'Planet paling terang, dengan atmosfer sangat tebal beracun.', radius: '6.051 km', period: '225 hari', dist: '0.72 SA' },
  Bumi: { desc: 'Satu-satunya planet yang diketahui berpenghuni.', radius: '6.371 km', period: '365,25 hari', dist: '1 SA (149.6 juta km)' },
  Mars: { desc: 'Planet merah dengan gunung berapi terbesar di tata surya.', radius: '3.389 km', period: '687 hari', dist: '1.52 SA' },
  Jupiter: { desc: 'Planet gas raksasa terbesar di tata surya.', radius: '69.911 km', period: '11,8 tahun', dist: '5.20 SA' },
  Saturnus: { desc: 'Planet gas dengan sistem cincin yang sangat indah.', radius: '58.232 km', period: '29,5 tahun', dist: '9.58 SA' },
  Uranus: { desc: 'Raksasa es yang berputar miring pada sumbunya.', radius: '25.362 km', period: '84 tahun', dist: '19.22 SA' },
  Neptunus: { desc: 'Planet terjauh, berwarna biru gelap dengan angin kencang.', radius: '24.622 km', period: '165 tahun', dist: '30.05 SA' },
  Bulan: { desc: 'Satelit alami Bumi yang mengatur pasang surut air laut.', radius: '1.737 km', period: '27,3 hari (mengelilingi Bumi)', dist: '384.400 km (dari Bumi)' }
};

export function SolarSystemHUD() {
  const date = useAppStore((s) => s.date);
  const playing = useAppStore((s) => s.playing);
  const setPlaying = useAppStore((s) => s.setPlaying);
  const setSpeed = useAppStore((s) => s.setSpeed);
  const speed = useAppStore((s) => s.speed);
  const goLive = useAppStore((s) => s.goLive);
  
  const focusPlanet = useAppStore((s) => s.focusPlanet);
  const setFocusPlanet = useAppStore((s) => s.setFocusPlanet);
  const layers = useAppStore((s) => s.layers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);

  const formatStr = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(date);

  const timeStr = `${date.getHours().toString().padStart(2, '0')}.${date.getMinutes().toString().padStart(2, '0')}.${date.getSeconds().toString().padStart(2, '0')}`;

  const info = focusPlanet && PLANET_INFO[focusPlanet];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 text-slate-100 font-sans">
      {/* TOP LEFT */}
      <div className="pointer-events-auto absolute left-3 top-2 flex flex-col gap-1">
        <h1 className="text-lg font-bold text-white tracking-wide drop-shadow-md">Penjelajah Tata Surya</h1>
        <div className="text-xs text-slate-300 drop-shadow-md">{formatStr} pukul {timeStr}</div>
      </div>

      {/* PLANET BUTTONS */}
      <div className="pointer-events-auto absolute left-3 top-14 flex max-w-[calc(100vw-24px)] gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        {Object.keys(PLANET_INFO).map((p) => (
          <button
            key={p}
            onClick={() => setFocusPlanet(focusPlanet === p ? null : p)}
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur-md transition-colors ${
              focusPlanet === p
                ? 'bg-cyan-600 border-cyan-400 text-white'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* BOTTOM LEFT INFO */}
      {info && (
        <div className="pointer-events-auto absolute bottom-20 left-3 w-[280px] rounded-xl border border-slate-700 bg-slate-950/85 p-4 shadow-xl backdrop-blur-md">
          <h3 className="mb-2 text-base font-bold text-cyan-400">{focusPlanet}</h3>
          <p className="mb-3 text-xs leading-relaxed text-slate-300">{info.desc}</p>
          <div className="flex flex-col gap-1 text-[11px] text-slate-400">
            <div><span className="text-slate-500">Jari-jari:</span> <span className="font-medium text-slate-200">{info.radius}</span></div>
            <div><span className="text-slate-500">Periode orbit:</span> <span className="font-medium text-slate-200">{info.period}</span></div>
            <div><span className="text-slate-500">Jarak:</span> <span className="font-medium text-slate-200">{info.dist}</span></div>
          </div>
        </div>
      )}

      {/* BOTTOM CONTROL BAR */}
      <div className="pointer-events-auto absolute bottom-4 left-3 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-slate-700 bg-slate-900/80 overflow-hidden backdrop-blur-md shadow-sm">
          <button onClick={() => setPlaying(!playing)} className="px-3 py-1.5 hover:bg-slate-800 text-slate-300">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <select 
            value={speed} 
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="bg-transparent px-2 py-1.5 text-[11px] font-medium text-slate-300 outline-none hover:bg-slate-800 cursor-pointer border-l border-slate-700"
          >
            <option value="1" className="bg-slate-900">1 detik/detik</option>
            <option value="60" className="bg-slate-900">1 menit/detik</option>
            <option value="3600" className="bg-slate-900">1 jam/detik</option>
            <option value="86400" className="bg-slate-900">1 hari/detik</option>
            <option value="604800" className="bg-slate-900">1 minggu/detik</option>
          </select>
        </div>
        
        <button 
          onClick={goLive}
          className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-[11px] font-semibold text-slate-300 shadow-sm backdrop-blur-md hover:bg-slate-800 hover:text-white"
        >
          Sekarang
        </button>

        <div className="flex gap-3 px-2">
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-slate-300 hover:text-white">
            <input type="checkbox" checked={layers.grid} onChange={() => toggleLayer('grid')} className="accent-cyan-500" />
            Garis edar
          </label>
          <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-slate-300 hover:text-white">
            <input type="checkbox" checked={layers.labels} onChange={() => toggleLayer('labels')} className="accent-cyan-500" />
            Label
          </label>
        </div>
      </div>
    </div>
  );
}
