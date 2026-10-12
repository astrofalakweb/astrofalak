'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Clock, Crosshair, Layers as LayersIcon, LocateFixed, MapPin, Pause, Play, RotateCcw, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useAppStore, LAYER_LABELS, type LayerKey } from '../lib/store';
import { useAstro } from '../lib/useAstro';
import { CITIES } from '../lib/falak/cities';
import { fmtDateLong, fmtHM, fmtHMS, fromLocal, toISODate, tzLabel } from '../lib/falak/time';
import { clamp } from '../lib/falak/math';

type Tab = 'waktu' | 'lokasi' | 'layer';

function NumField({ label, value, min, max, step, onCommit }: { label: string; value: number; min: number; max: number; step: number; onCommit: (v: number) => void }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const v = parseFloat(text);
    if (isNaN(v)) return setText(String(value));
    const c = clamp(v, min, max);
    setText(String(c));
    onCommit(c);
  };
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] text-slate-400">{label}</span>
      <input
        type="number" step={step} min={min} max={max} value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
        className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 font-mono text-xs focus:border-cyan-500 focus:outline-none"
      />
    </label>
  );
}

export function ControlPanel() {
  const [tab, setTab] = useState<Tab>('waktu');
  const { date, loc, local } = useAstro();
  const s = useAppStore();

  const setLocalTime = (hours: number) => s.setSimDate(fromLocal(local.y, local.m, local.d, hours, loc.tz));

  const events = [
    { label: 'Ekuinoks Maret', sub: '20 Mar · δ ≈ 0°', d: fromLocal(local.y, 2, 20, 12, loc.tz) },
    { label: 'Solstis Juni', sub: '21 Jun · δ ≈ +23.44°', d: fromLocal(local.y, 5, 21, 12, loc.tz) },
    { label: 'Ekuinoks September', sub: '23 Sep · δ ≈ 0°', d: fromLocal(local.y, 8, 23, 12, loc.tz) },
    { label: 'Solstis Desember', sub: '21 Des · δ ≈ −23.44°', d: fromLocal(local.y, 11, 21, 12, loc.tz) },
    { label: 'Rashdul Qiblah I', sub: '28 Mei · 09:18 UTC', d: new Date(Date.UTC(local.y, 4, 28, 9, 18)) },
    { label: 'Rashdul Qiblah II', sub: '16 Jul · 09:27 UTC', d: new Date(Date.UTC(local.y, 6, 16, 9, 27)) },
  ];

  const useGPS = () => {
    if (!navigator.geolocation) return alert('Geolokasi tidak didukung browser ini.');
    navigator.geolocation.getCurrentPosition(
      (p) =>
        s.setLocation({
          name: 'Lokasi Saya (GPS)',
          lat: +p.coords.latitude.toFixed(4),
          lon: +p.coords.longitude.toFixed(4),
          tz: Math.round(-new Date().getTimezoneOffset() / 60),
        }),
      (e) => alert('Gagal membaca GPS: ' + e.message),
    );
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'waktu', label: 'Waktu', icon: <Clock className="h-3.5 w-3.5" /> },
    { key: 'lokasi', label: 'Lokasi', icon: <MapPin className="h-3.5 w-3.5" /> },
    { key: 'layer', label: 'Layer 3D', icon: <LayersIcon className="h-3.5 w-3.5" /> },
  ];

  return (
    <aside className="pointer-events-auto absolute right-4 top-4 z-20 flex max-h-[calc(100%-15rem)] w-[320px] flex-col rounded-xl border border-slate-700/80 bg-slate-900/85 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between px-4 pt-4">
        <h2 className="flex items-center gap-2 text-xs font-bold tracking-wider">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" /> CONTROL PANEL
        </h2>
        <button
          onClick={() => (s.mode === 'live' ? s.setSimDate(date) : s.goLive())}
          className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
            s.mode === 'live' ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : 'border-amber-500/60 bg-amber-500/15 text-amber-300'
          }`}
        >
          {s.mode === 'live' ? '● LIVE' : '◼ MANUAL'}
        </button>
      </div>

      <div className="mt-3 flex border-b border-slate-800 px-2">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 text-xs transition ${
              tab === t.key ? 'border-cyan-400 text-slate-100' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {tab === 'waktu' && (
          <>
            <div>
              <p className="text-[10px] tracking-wider text-slate-400">{s.mode === 'live' ? 'WAKTU RIIL (BERJALAN)' : 'WAKTU SIMULASI'}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="font-mono text-3xl font-bold text-cyan-300">{fmtHMS(date, loc.tz)}</span>
                <button onClick={s.goLive} className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-[11px] hover:bg-slate-700">
                  <RotateCcw className="h-3 w-3" /> Sekarang
                </button>
              </div>
              <p className="text-[11px] text-slate-500">{fmtDateLong(date, loc.tz)} · {tzLabel(loc.tz)}</p>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                <span>Slider Waktu 24 Jam</span>
                <span className="font-mono text-cyan-300">{fmtHM(local.hours)}</span>
              </div>
              <input type="range" min={0} max={23.99} step={1 / 60} value={local.hours}
                onChange={(e) => setLocalTime(parseFloat(e.target.value))} className="w-full accent-cyan-400" />
              <div className="flex justify-between text-[9px] text-slate-500">
                <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59</span>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[10px] tracking-wider text-slate-400">LOMPAT CEPAT</p>
              <div className="grid grid-cols-4 gap-1.5">
                {[[-60, '−1 Jam'], [-15, '−15 Mnt'], [15, '+15 Mnt'], [60, '+1 Jam']].map(([m, l]) => (
                  <button key={l} onClick={() => s.shiftMinutes(m as number)} className="rounded-md border border-slate-700 bg-slate-800/50 py-1.5 text-[11px] hover:bg-slate-700">
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5">
              <p className="mb-2 text-[10px] tracking-wider text-slate-400">ANIMASI GERAK SEMU HARIAN</p>
              <div className="flex items-center gap-2">
                <button onClick={() => s.setPlaying(!s.playing)}
                  className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-semibold ${s.playing ? 'bg-amber-500 text-slate-950' : 'bg-cyan-500 text-slate-950'}`}>
                  {s.playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {s.playing ? 'Jeda' : 'Putar'}
                </button>
                <select value={s.speed} onChange={(e) => s.setSpeed(+e.target.value)}
                  className="flex-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs">
                  <option value={60}>60× (1 mnt/detik)</option>
                  <option value={600}>600× (10 mnt/detik)</option>
                  <option value={3600}>3600× (1 jam/detik)</option>
                  <option value={86400}>86400× (1 hari/detik)</option>
                </select>
              </div>
            </div>

            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-[11px] text-slate-400"><CalendarDays className="h-3 w-3" /> Pilih Tanggal</span>
              <input type="date" value={toISODate(date, loc.tz)}
                onChange={(e) => {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  if (y && m && d) s.setSimDate(fromLocal(y, m - 1, d, local.hours, loc.tz));
                }}
                className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs [color-scheme:dark]" />
            </label>

            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[10px] tracking-wider text-slate-400"><Sparkles className="h-3 w-3 text-amber-400" /> PERISTIWA FALAK SPESIAL</p>
              <div className="grid grid-cols-2 gap-1.5">
                {events.map((ev) => (
                  <button key={ev.label} onClick={() => s.setSimDate(ev.d)}
                    className="rounded-md border border-slate-700 bg-slate-800/40 p-2 text-left hover:border-amber-500/50 hover:bg-slate-800">
                    <div className="text-[11px] font-semibold text-amber-300">{ev.label}</div>
                    <div className="text-[9px] text-slate-500">{ev.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'lokasi' && (
          <>
            <label className="block">
              <span className="mb-1 block text-[11px] text-slate-400">Pilih Kota</span>
              <select
                value={CITIES.findIndex((c) => c.name === loc.name)}
                onChange={(e) => { const c = CITIES[+e.target.value]; if (c) s.setLocation(c); }}
                className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs"
              >
                <option value={-1} disabled>— Kustom: {loc.name} —</option>
                {CITIES.map((c, i) => (
                  <option key={c.name} value={i}>{c.name} ({tzLabel(c.tz)})</option>
                ))}
              </select>
            </label>

            <button onClick={useGPS} className="flex w-full items-center justify-center gap-2 rounded-md border border-cyan-500/50 bg-cyan-500/10 py-2 text-xs text-cyan-200 hover:bg-cyan-500/20">
              <LocateFixed className="h-3.5 w-3.5" /> Gunakan Lokasi GPS Saya
            </button>

            <div className="grid grid-cols-2 gap-2">
              <NumField label="Lintang φ (−90 … 90)" value={loc.lat} min={-89.99} max={89.99} step={0.0001}
                onCommit={(v) => s.setLocation({ ...loc, name: 'Koordinat Kustom', lat: v })} />
              <NumField label="Bujur λ (−180 … 180)" value={loc.lon} min={-180} max={180} step={0.0001}
                onCommit={(v) => s.setLocation({ ...loc, name: 'Koordinat Kustom', lon: v })} />
              <NumField label="Zona Waktu (UTC±)" value={loc.tz} min={-12} max={14} step={1}
                onCommit={(v) => s.setLocation({ ...loc, tz: v })} />
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5 text-[11px] text-slate-400">
              <p className="mb-1 flex items-center gap-1.5 font-semibold text-slate-300"><Crosshair className="h-3 w-3" /> Catatan</p>
              Lintang selatan (LS) bernilai negatif, bujur barat (BB) bernilai negatif. Tinggi kutub langit di atas ufuk selalu sama dengan lintang tempat (φ).
            </div>
          </>
        )}

        {tab === 'layer' && (
          <>
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                <span>Jari-jari Bola Langit</span>
                <span className="font-mono text-cyan-300">{s.radius.toFixed(1)}</span>
              </div>
              <input type="range" min={5} max={16} step={0.5} value={s.radius}
                onChange={(e) => s.setRadius(+e.target.value)} className="w-full accent-cyan-400" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(LAYER_LABELS) as LayerKey[]).map((k) => (
                <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-[11px] transition ${
                  s.layers[k] ? 'border-cyan-500/40 bg-cyan-500/5 text-slate-100' : 'border-slate-800 text-slate-500'
                }`}>
                  <input type="checkbox" checked={s.layers[k]} onChange={() => s.toggleLayer(k)} className="accent-cyan-400" />
                  {LAYER_LABELS[k]}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => s.setLayers(Object.fromEntries(Object.keys(LAYER_LABELS).map((k) => [k, true])))}
                className="rounded-md border border-slate-700 py-1.5 text-[11px] hover:bg-slate-800">Tampilkan Semua</button>
              <button onClick={() => s.setLayers({ meridian: false, primeVertical: false, equator: false, ecliptic: false, diurnal: false, triangle: false, qibla: false, axis: false, arcs: false })}
                className="rounded-md border border-slate-700 py-1.5 text-[11px] hover:bg-slate-800">Minimal</button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
