import { useState, type ReactNode } from 'react';
import { BookOpen, Eye, CheckCircle2 } from 'lucide-react';
import { useAppStore, type CameraPreset, type Layers } from '../lib/store';
import { useAstro } from '../lib/useAstro';
import { fmtHM } from '../lib/falak/time';

interface Section {
  id: string;
  title: string;
  body: ReactNode;
  action?: { label: string; layers?: Partial<Layers>; camera?: CameraPreset };
}

const F = ({ children }: { children: ReactNode }) => (
  <div className="my-3 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-mono text-sm text-cyan-300 shadow-inner">{children}</div>
);
const P = ({ children }: { children: ReactNode }) => <p className="mb-4 text-sm leading-relaxed text-slate-300">{children}</p>;
const Li = ({ children }: { children: ReactNode }) => <li className="mb-2 text-sm leading-relaxed text-slate-300">{children}</li>;

const ALL_OFF: Partial<Layers> = {
  horizon: false, meridian: false, primeVertical: false, equator: false, ecliptic: false,
  diurnal: false, triangle: false, qibla: false, axis: false, arcs: false,
};

export function LearnPage() {
  const setActivePage = useAppStore((s) => s.setActivePage);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const setLayers = useAppStore((s) => s.setLayers);
  const moveCamera = useAppStore((s) => s.moveCamera);
  const { loc, schedule, qibla, sun } = useAstro();
  const [activeId, setActiveId] = useState('panduan');

  const sections: Section[] = [
    {
      id: 'panduan',
      title: 'Panduan Penggunaan',
      body: (
        <>
          <P>AstroFalak-AR adalah media pembelajaran interaktif untuk memvisualisasikan bola langit dan hisab falak sesuai standar Kemenag RI.</P>
          <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
            <li><b>Drag kiri</b>: memutar bola langit · <b>Scroll</b>: zoom · <b>Drag kanan / Shift+drag</b>: geser.</li>
            <li><b>Telemetry HUD</b> (kiri): tinggi, azimuth, deklinasi, sudut waktu, dan parameter segitiga bola secara real-time.</li>
            <li><b>Control Panel</b> (kanan): atur waktu (live/manual/animasi), tanggal, lokasi, GPS, dan layer 3D.</li>
            <li><b>Jadwal Salat</b> (bawah): klik kartu untuk melompat ke waktu salat tersebut pada simulasi.</li>
            <li><b>Tombol kamera</b> (kanan bawah): Reset, Zenith, KLU, Matahari, Kiblat, Ufuk.</li>
            <li><b>Kuis</b>: uji pemahaman — termasuk soal yang dibuat otomatis dari kondisi simulasi.</li>
          </ul>
        </>
      ),
    },
    {
      id: 'bola-langit',
      title: 'Bola Langit & Koordinat',
      body: (
        <>
          <P>Bola langit adalah bola khayal berjari-jari tak hingga dengan pengamat di pusatnya. Semua benda langit seolah-olah menempel pada permukaannya.</P>
          <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
            <li><b>Zenith</b>: titik tepat di atas pengamat; <b>Nadir</b>: tepat di bawahnya.</li>
            <li><b>Ufuk (Horizon)</b>: lingkaran besar berjarak 90° dari zenith. (Garis Hijau).</li>
            <li><b>Kutub Langit</b>: proyeksi kutub bumi. Kutub Utara (KLU) selalu di atas ufuk jika pengamat di belahan utara; di bawah ufuk jika di selatan.</li>
            <li><b>Ekuator Langit</b>: proyeksi ekuator bumi. Berpotongan dengan ufuk tepat di Timur (Az=90°) dan Barat (Az=270°). (Garis Biru Muda).</li>
            <li><b>Ekliptika</b>: bidang edar semu matahari (miring ~23.5° terhadap ekuator). (Garis Oranye).</li>
          </ul>
        </>
      ),
      action: { label: 'Tampilkan Ufuk, Ekuator & Ekliptika', layers: { ...ALL_OFF, horizon: true, equator: true, ecliptic: true, labels: true, grid: true }, camera: 'reset' },
    },
    {
      id: 'waktu-salat',
      title: 'Hisab Awal Waktu Salat',
      body: (
        <>
          <P>Menurut Kemenag RI, hisab waktu salat didasarkan pada ketinggian (altitude, h) matahari dari ufuk:</P>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h4 className="font-bold text-teal-400 mb-2">Subuh (Fajar Shadiq)</h4>
              <p className="text-sm text-slate-300">Dimulai saat fajar menyingsing hingga terbit matahari. Kriteria Kemenag: tinggi matahari <b>−20°</b> (di bawah ufuk timur).</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h4 className="font-bold text-teal-400 mb-2">Terbit & Maghrib</h4>
              <p className="text-sm text-slate-300">Memperhitungkan refraksi atmosfer (0.56°), semi-diameter matahari (0.26°), dll. Kemenag menetapkan tinggi matahari <b>−1°</b>.</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h4 className="font-bold text-teal-400 mb-2">Dzuhur (Zawal)</h4>
              <p className="text-sm text-slate-300">Saat matahari melintasi meridian pengamat (transit/kulminasi). Karena jari-jari matahari, waktu dzuhur ditambah +2 menit dari kulminasi eksak.</p>
            </div>
            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <h4 className="font-bold text-teal-400 mb-2">Ashar</h4>
              <p className="text-sm text-slate-300">Saat panjang bayangan benda vertikal sama dengan panjang benda tersebut + bayangannya saat dzuhur.</p>
            </div>
          </div>
        </>
      ),
    },
    {
      id: 'segitiga-bola',
      title: 'Segitiga Bola (Spherical Triangle)',
      body: (
        <>
          <P>Dalam falak, kita menyelesaikan segitiga pada permukaan bola. Segitiga astronomi utama dibentuk oleh 3 titik: <b>Kutub Langit</b>, <b>Zenith</b>, dan <b>Benda Langit (Matahari)</b>.</P>
          <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm mb-4">
            <li>Sisi a = 90° − h (Jarak zenith)</li>
            <li>Sisi b = 90° − φ (Ko-lintang)</li>
            <li>Sisi c = 90° − δ (Jarak kutub)</li>
            <li>Sudut C = t (Sudut waktu / Hour angle)</li>
            <li>Sudut A = A (Azimuth, dari Utara)</li>
          </ul>
          <P>Contoh penerapan rumus Cosinus pada segitiga bola untuk mencari Sudut Waktu (t) dari ketinggian (h):</P>
          <F>cos(t) = (sin(h) − sin(φ)·sin(δ)) / (cos(φ)·cos(δ))</F>
        </>
      ),
      action: { label: 'Tampilkan Segitiga Astronomi', layers: { ...ALL_OFF, horizon: true, meridian: true, triangle: true, equator: true, arcs: true, labels: true }, camera: 'zenith' },
    },
    {
      id: 'arah-kiblat',
      title: 'Arah Kiblat',
      body: (
        <>
          <P>Kiblat adalah arah jarak terpendek (lingkaran besar) dari lokasi ke Ka'bah (φ = 21°25'21" LU, λ = 39°49'34" BT). Menggunakan trigonometri bola:</P>
          <F>
            tan(Q) = sin(λ - λk) / (cos(φ)·tan(φk) - sin(φ)·cos(λ - λk))
          </F>
          <P>Berdasarkan koordinat Ka'bah dan lokasi saat ini ({loc.name}):</P>
          <ul className="list-disc pl-5 space-y-2 text-slate-300 text-sm">
            <li>φ = {loc.lat.toFixed(4)}°, λ = {loc.lon.toFixed(4)}°</li>
            <li>Azimuth Kiblat (Q) = <b>{qibla.az.toFixed(2)}°</b> dari Utara sejati.</li>
            <li>Jarak ke Ka'bah = {(qibla.distance).toLocaleString('id-ID')} km.</li>
          </ul>
        </>
      ),
      action: { label: 'Tampilkan Arah Kiblat 3D', layers: { ...ALL_OFF, horizon: true, qibla: true, labels: true, grid: true }, camera: 'qibla' },
    }
  ];

  const active = sections.find(s => s.id === activeId) || sections[0];

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0b141c] text-slate-200">
      <div className="mx-auto max-w-5xl px-4 py-8 pb-24 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Menu */}
        <div className="w-full md:w-64 shrink-0">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 text-white shadow-lg shadow-blue-500/20">
              <BookOpen className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wide">Panduan</h1>
          </div>
          
          <div className="flex flex-col gap-1">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  activeId === s.id
                    ? 'bg-blue-500 font-bold text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                {activeId === s.id && <CheckCircle2 className="h-4 w-4 shrink-0 text-blue-200" />}
                <span className="text-sm">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 rounded-2xl border border-slate-800 bg-[#14202c] p-6 md:p-10 shadow-xl">
          <h2 className="mb-6 text-2xl font-bold text-white">{active.title}</h2>
          <div className="prose prose-invert max-w-none">
            {active.body}
          </div>
          
          {active.action && (
            <div className="mt-8 border-t border-slate-800 pt-6">
              <button
                onClick={() => {
                  if (active.action!.layers) setLayers(active.action!.layers);
                  if (active.action!.camera) moveCamera(active.action!.camera);
                  setActivePage('3d');
                  setViewMode('celestial');
                }}
                className="flex items-center gap-2 rounded-xl bg-cyan-600 px-6 py-3 font-bold text-white transition hover:bg-cyan-500 active:scale-95 shadow-lg shadow-cyan-500/20"
              >
                <Eye className="h-5 w-5" />
                {active.action.label}
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
