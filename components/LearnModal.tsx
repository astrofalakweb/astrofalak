'use client';

import { useState, type ReactNode } from 'react';
import { BookOpen, Eye } from 'lucide-react';
import { Modal } from './Modal';
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
  <div className="my-2 rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 font-mono text-xs text-cyan-200">{children}</div>
);
const P = ({ children }: { children: ReactNode }) => <p className="mb-2 text-sm leading-relaxed text-slate-300">{children}</p>;
const Li = ({ children }: { children: ReactNode }) => <li className="mb-1 text-sm leading-relaxed text-slate-300">{children}</li>;

const ALL_OFF: Partial<Layers> = {
  horizon: false, meridian: false, primeVertical: false, equator: false, ecliptic: false,
  diurnal: false, triangle: false, qibla: false, axis: false, arcs: false,
};

export function LearnModal({ initial }: { initial?: string }) {
  const close = useAppStore((s) => s.closeModal);
  const setLayers = useAppStore((s) => s.setLayers);
  const moveCamera = useAppStore((s) => s.moveCamera);
  const { loc, schedule, qibla, sun } = useAstro();

  const sections: Section[] = [
    {
      id: 'panduan',
      title: 'Panduan Penggunaan',
      body: (
        <>
          <P>AstroFalak-AR adalah media pembelajaran interaktif untuk memvisualisasikan bola langit dan hisab falak sesuai standar Kemenag RI.</P>
          <ul className="list-disc pl-5">
            <Li><b>Drag kiri</b>: memutar bola langit · <b>Scroll</b>: zoom · <b>Drag kanan / Shift+drag</b>: geser.</Li>
            <Li><b>Telemetry HUD</b> (kiri): tinggi, azimuth, deklinasi, sudut waktu, dan parameter segitiga bola secara real-time.</Li>
            <Li><b>Control Panel</b> (kanan): atur waktu (live/manual/animasi), tanggal, lokasi, GPS, dan layer 3D.</Li>
            <Li><b>Jadwal Salat</b> (bawah): klik kartu untuk melompat ke waktu salat tersebut pada simulasi.</Li>
            <Li><b>Tombol kamera</b> (kanan bawah): Reset, Zenith, KLU, Matahari, Kiblat, Ufuk.</Li>
            <Li><b>Kuis</b>: uji pemahaman — termasuk soal yang dibuat otomatis dari kondisi simulasi.</Li>
          </ul>
        </>
      ),
    },
    {
      id: 'bola-langit',
      title: 'Bola Langit',
      body: (
        <>
          <P>Bola langit adalah bola khayal berjari-jari tak hingga dengan pengamat di pusatnya. Semua benda langit seolah-olah menempel pada permukaannya.</P>
          <ul className="list-disc pl-5">
            <Li><b>Zenith</b>: titik tepat di atas pengamat; <b>Nadir</b>: tepat di bawahnya.</Li>
            <Li><b>Ufuk</b>: lingkaran besar berjarak 90° dari zenith.</Li>
            <Li><b>Meridian</b>: lingkaran besar melalui Utara, Zenith, Selatan, dan kedua kutub langit.</Li>
            <Li><b>Kutub Langit</b> (KLU/KLS): perpanjangan sumbu rotasi bumi. Tinggi kutub = lintang tempat.</Li>
          </ul>
          <F>Tinggi KLU di {loc.name} = φ = {loc.lat.toFixed(2)}°</F>
        </>
      ),
      action: { label: 'Tampilkan ufuk, meridian & kutub', layers: { ...ALL_OFF, horizon: true, meridian: true, axis: true }, camera: 'reset' },
    },
    {
      id: 'horizon',
      title: 'Koordinat Horizon',
      body: (
        <>
          <P>Bidang dasarnya adalah ufuk. Posisi benda dinyatakan dengan:</P>
          <ul className="list-disc pl-5">
            <Li><b>Tinggi (h)</b>: busur dari ufuk ke benda, −90° s.d. +90°.</Li>
            <Li><b>Azimuth (Az)</b>: busur sepanjang ufuk dari Utara searah jarum jam, 0°–360°.</Li>
          </ul>
          <F>Matahari saat ini: h = {sun.altitude.toFixed(2)}°, Az = {sun.azimuth.toFixed(2)}°</F>
          <P>Koordinat ini bersifat lokal: berubah terhadap waktu dan tempat pengamat.</P>
        </>
      ),
      action: { label: 'Tampilkan busur h & Az', layers: { ...ALL_OFF, horizon: true, arcs: true }, camera: 'sun' },
    },
    {
      id: 'ekuator',
      title: 'Koordinat Ekuator',
      body: (
        <>
          <P>Bidang dasarnya ekuator langit (proyeksi ekuator bumi). Besaran yang digunakan:</P>
          <ul className="list-disc pl-5">
            <Li><b>Deklinasi (δ)</b>: jarak sudut dari ekuator langit, positif ke utara.</Li>
            <Li><b>Sudut waktu (t)</b>: busur dari meridian ke lingkaran waktu benda, positif ke barat.</Li>
            <Li><b>Asensio rekta (α)</b>: diukur dari Titik Aries (γ) ke timur.</Li>
          </ul>
          <F>t = LST − α</F>
          <P>Dalam sehari, matahari menempuh lingkaran deklinasi (lintasan harian, garis kuning putus-putus) yang sejajar ekuator.</P>
        </>
      ),
      action: { label: 'Tampilkan ekuator & lintasan harian', layers: { ...ALL_OFF, horizon: true, equator: true, diurnal: true, axis: true }, camera: 'reset' },
    },
    {
      id: 'ekliptika',
      title: 'Ekliptika & Musim',
      body: (
        <>
          <P>Ekliptika adalah lintasan semu tahunan matahari, miring ε ≈ 23,44° terhadap ekuator langit.</P>
          <ul className="list-disc pl-5">
            <Li><b>Ekuinoks</b> (±20 Mar & ±23 Sep): δ = 0°, siang ≈ malam.</Li>
            <Li><b>Solstis Juni</b> (±21 Jun): δ = +23,44°. <b>Solstis Desember</b> (±21 Des): δ = −23,44°.</Li>
          </ul>
          <F>sin δ = sin ε · sin λ☉ &nbsp;&nbsp;→&nbsp; δ saat ini = {sun.dec.toFixed(2)}°</F>
          <P>Coba tombol “Peristiwa Falak Spesial” di Control Panel lalu amati perubahan lintasan harian.</P>
        </>
      ),
      action: { label: 'Tampilkan ekuator & ekliptika', layers: { ...ALL_OFF, horizon: true, equator: true, ecliptic: true, diurnal: true }, camera: 'klu' },
    },
    {
      id: 'segitiga',
      title: 'Segitiga Bola',
      body: (
        <>
          <P>Segitiga astronomis dibentuk oleh tiga titik: <b>Zenith (Z)</b>, <b>Kutub Langit Utara (P)</b>, dan <b>Matahari (M)</b>, dihubungkan oleh busur lingkaran besar.</P>
          <ul className="list-disc pl-5">
            <Li>Sisi ZP = 90° − φ, PM = 90° − δ, ZM = 90° − h.</Li>
            <Li>Sudut di P = sudut waktu t; sudut di Z = azimuth (dari utara).</Li>
          </ul>
          <F>
            sin h = sin φ sin δ + cos φ cos δ cos t<br />
            cos t = (sin h − sin φ sin δ) / (cos φ cos δ)<br />
            tan Az = −sin t / (cos φ tan δ − sin φ cos t)
          </F>
          <P>Rumus kedua adalah inti hisab waktu salat: diberikan h (kriteria), dicari t, lalu waktu = transit ± t/15.</P>
        </>
      ),
      action: { label: 'Tampilkan segitiga bola', layers: { ...ALL_OFF, horizon: true, meridian: true, triangle: true, axis: true }, camera: 'reset' },
    },
    {
      id: 'salat',
      title: 'Hisab Waktu Salat',
      body: (
        <>
          <P>Kriteria Kementerian Agama RI yang digunakan aplikasi ini:</P>
          <div className="my-2 overflow-hidden rounded-lg border border-slate-700">
            <table className="w-full text-xs">
              <thead className="bg-slate-800 text-slate-300"><tr><th className="px-3 py-1.5 text-left">Waktu</th><th className="px-3 py-1.5 text-left">Kriteria</th><th className="px-3 py-1.5 text-right">{loc.name}</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {schedule.entries.map((e) => (
                  <tr key={e.key}><td className="px-3 py-1.5">{e.name}</td><td className="px-3 py-1.5 font-mono text-slate-400">{e.criteria}</td><td className="px-3 py-1.5 text-right font-mono text-cyan-300">{fmtHM(e.time)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <F>
            Transit = 12 − e + (λ_daerah − λ)/15<br />
            Waktu = Transit ± t/15 + ihtiyat (2 menit)
          </F>
          <P>Waktu hasil hisab “murni” kemudian ditambah ihtiyat 2 menit dan dibulatkan ke atas ke menit penuh (khusus terbit dikurangi).</P>
        </>
      ),
      action: { label: 'Tampilkan lintasan harian & ufuk', layers: { ...ALL_OFF, horizon: true, diurnal: true, arcs: true }, camera: 'horizon' },
    },
    {
      id: 'kiblat',
      title: 'Arah Kiblat',
      body: (
        <>
          <P>Arah kiblat adalah arah lingkaran besar terpendek dari lokasi ke Ka'bah (φk = 21,4225° LU, λk = 39,8262° BT).</P>
          <F>tan Q = sin Δλ / (cos φ · tan φk − sin φ · cos Δλ), &nbsp;Δλ = λk − λ</F>
          <F>Azimuth kiblat {loc.name} = {qibla.az.toFixed(2)}° · jarak ≈ {Math.round(qibla.distance).toLocaleString('id-ID')} km</F>
          <P><b>Rashdul Qiblah</b>: setiap ±28 Mei pukul 16:18 WIB dan ±16 Juli pukul 16:27 WIB matahari tepat di atas Ka'bah, sehingga bayangan benda tegak lurus menunjuk arah kiblat.</P>
        </>
      ),
      action: { label: 'Tampilkan arah kiblat', layers: { ...ALL_OFF, horizon: true, qibla: true }, camera: 'qibla' },
    },
    {
      id: 'eot',
      title: 'Perata Waktu (EoT)',
      body: (
        <>
          <P>Perata waktu (e) adalah selisih waktu matahari hakiki terhadap waktu matahari pertengahan, akibat orbit bumi yang elips dan kemiringan sumbu bumi. Nilainya berkisar −14 s.d. +16 menit.</P>
          <F>e saat ini = {sun.eot.toFixed(2)} menit</F>
          <P>Karena e, waktu kulminasi tidak selalu pukul 12:00 waktu lokal rata-rata.</P>
        </>
      ),
    },
  ];

  const [active, setActive] = useState(initial && sections.some((s) => s.id === initial) ? initial : sections[0].id);
  const sec = sections.find((s) => s.id === active) ?? sections[0];

  const apply = () => {
    if (!sec.action) return;
    if (sec.action.layers) setLayers({ ...sec.action.layers, labels: true });
    if (sec.action.camera) moveCamera(sec.action.camera);
    close();
  };

  return (
    <Modal title="Materi Ilmu Falak" icon={<BookOpen className="h-4 w-4 text-violet-400" />} onClose={close} maxWidth="max-w-4xl">
      <div className="flex min-h-[420px] flex-col md:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-800 p-2 md:w-52 md:flex-col md:border-b-0 md:border-r">
          {sections.map((s, i) => (
            <button key={s.id} onClick={() => setActive(s.id)}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-left text-xs transition ${
                active === s.id ? 'bg-violet-500/15 text-violet-200' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}>
              <span className="mr-1.5 text-slate-600">{i}.</span>{s.title}
            </button>
          ))}
        </nav>
        <article className="flex-1 p-5">
          <h3 className="mb-3 text-lg font-bold text-slate-100">{sec.title}</h3>
          {sec.body}
          {sec.action && (
            <button onClick={apply} className="mt-3 flex items-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400">
              <Eye className="h-4 w-4" /> {sec.action.label} di 3D
            </button>
          )}
        </article>
      </div>
    </Modal>
  );
}
