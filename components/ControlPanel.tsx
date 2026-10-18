'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Clock, Crosshair, Layers as LayersIcon, LocateFixed, MapPin, Pause, Play, RotateCcw, SlidersHorizontal, Sparkles, X, Search } from 'lucide-react';
import { useAppStore, LAYER_LABELS, type LayerKey } from '../lib/store';
import { useAstro } from '../lib/useAstro';
import { locateUser } from '../lib/geo';
import { CITIES } from '../lib/falak/cities';
import { fmtDateLong, fmtHM, fmtHMS, fromLocal, toISODate, tzLabel } from '../lib/falak/time';
import { clamp } from '../lib/falak/math';
import { LocationPickerModal } from './LocationPickerModal';

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

export function ControlPanel({ onClose, isSheet }: { onClose?: () => void; isSheet?: boolean }) {
  const [tab, setTab] = useState<Tab>('waktu');
  const { date, loc, local } = useAstro();
  const s = useAppStore();

  const setLocalTime = (hours: number) => s.setSimDate(fromLocal(local.y, local.m, local.d, hours, loc.tz));

  // State untuk input manual Jam, Menit, Detik
  const [hInput, setHInput] = useState(local.h.toString().padStart(2, '0'));
  const [mInput, setMInput] = useState(local.min.toString().padStart(2, '0'));
  const [sInput, setSInput] = useState(local.s.toString().padStart(2, '0'));
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [appliedNotice, setAppliedNotice] = useState(false);

  useEffect(() => {
    if (!isEditingTime) {
      setHInput(local.h.toString().padStart(2, '0'));
      setMInput(local.min.toString().padStart(2, '0'));
      setSInput(local.s.toString().padStart(2, '0'));
    }
  }, [local.h, local.min, local.s, isEditingTime]);

  const commitExactTime = (overrideH?: number, overrideM?: number, overrideS?: number) => {
    let h = overrideH !== undefined ? overrideH : parseInt(hInput, 10);
    let m = overrideM !== undefined ? overrideM : parseInt(mInput, 10);
    let sec = overrideS !== undefined ? overrideS : parseInt(sInput, 10);

    if (isNaN(h)) h = local.h;
    if (isNaN(m)) m = local.min;
    if (isNaN(sec)) sec = local.s;

    h = Math.max(0, Math.min(23, h));
    m = Math.max(0, Math.min(59, m));
    sec = Math.max(0, Math.min(59, sec));

    setHInput(h.toString().padStart(2, '0'));
    setMInput(m.toString().padStart(2, '0'));
    setSInput(sec.toString().padStart(2, '0'));

    const decimalHours = h + m / 60 + sec / 3600;
    s.setSimDate(fromLocal(local.y, local.m, local.d, decimalHours, loc.tz));
    setIsEditingTime(false);

    setAppliedNotice(true);
    setTimeout(() => setAppliedNotice(false), 1500);
  };

  const adjustHMS = (dh: number, dm: number, ds: number) => {
    let totalSec = local.h * 3600 + local.min * 60 + local.s + dh * 3600 + dm * 60 + ds;
    totalSec = ((totalSec % 86400) + 86400) % 86400;
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const sec = totalSec % 60;
    commitExactTime(h, m, sec);
  };

  const handleNativeTimeChange = (val: string) => {
    if (!val) return;
    const parts = val.split(':').map(Number);
    if (parts.length >= 2) {
      const h = parts[0] ?? 0;
      const m = parts[1] ?? 0;
      const sec = parts[2] ?? 0;
      commitExactTime(h, m, sec);
    }
  };

  const events = [
    { label: 'Ekuinoks Maret', sub: '20 Mar · δ ≈ 0°', d: fromLocal(local.y, 2, 20, 12, loc.tz) },
    { label: 'Solstis Juni', sub: '21 Jun · δ ≈ +23.44°', d: fromLocal(local.y, 5, 21, 12, loc.tz) },
    { label: 'Ekuinoks September', sub: '23 Sep · δ ≈ 0°', d: fromLocal(local.y, 8, 23, 12, loc.tz) },
    { label: 'Solstis Desember', sub: '21 Des · δ ≈ −23.44°', d: fromLocal(local.y, 11, 21, 12, loc.tz) },
    { label: 'Rashdul Qiblah I', sub: '28 Mei · 09:18 UTC', d: new Date(Date.UTC(local.y, 4, 28, 9, 18)) },
    { label: 'Rashdul Qiblah II', sub: '16 Jul · 09:27 UTC', d: new Date(Date.UTC(local.y, 6, 16, 9, 27)) },
  ];

  const [minimized, setMinimized] = useState(false);

  const [geoLoading, setGeoLoading] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  const useGPS = async () => {
    setGeoLoading(true);
    setGeoNotice(null);
    try {
      const res = await locateUser();
      s.setLocation(res.location);
      if (res.notice) setGeoNotice(res.notice);
    } catch (e: any) {
      setGeoNotice(e?.message || 'Gagal membaca GPS.');
    } finally {
      setGeoLoading(false);
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'waktu', label: 'Waktu', icon: <Clock className="h-3.5 w-3.5" /> },
    { key: 'lokasi', label: 'Lokasi', icon: <MapPin className="h-3.5 w-3.5" /> },
    { key: 'layer', label: 'Layer 3D', icon: <LayersIcon className="h-3.5 w-3.5" /> },
  ];

  if (!isSheet && minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="pointer-events-auto absolute right-2 top-20 z-20 hidden lg:flex items-center gap-1.5 rounded-l-xl border border-r-0 border-cyan-500/40 bg-slate-900/90 py-2.5 px-2 text-xs font-bold text-cyan-300 shadow-xl backdrop-blur-md hover:bg-slate-800 hover:text-white transition group"
        title="Buka Kontrol Bola Langit"
      >
        <ChevronLeft className="h-3 w-3 text-cyan-400" />
        <span className="[writing-mode:vertical-lr] text-[10px] tracking-widest uppercase font-mono text-slate-300">KONTROL</span>
        <SlidersHorizontal className="h-4 w-4 text-cyan-400 group-hover:scale-110 transition-transform" />
      </button>
    );
  }

  return (
    <aside
      className={
        isSheet
          ? 'flex flex-col h-full w-full'
          : 'pointer-events-auto absolute right-4 top-16 z-20 hidden lg:flex max-h-[calc(100vh-140px)] w-[290px] flex-col rounded-xl border border-slate-700/80 bg-slate-900/80 shadow-2xl backdrop-blur-xl'
      }
    >
      <div className="flex items-center justify-between px-3.5 pt-3.5">
        <h2 className="flex items-center gap-1.5 text-xs font-bold tracking-wider text-slate-100">
          <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-400" /> KONTROL
        </h2>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => (s.mode === 'live' ? s.setSimDate(date) : s.goLive())}
            className={`rounded-md border px-2 py-0.5 text-[10px] font-bold transition ${
              s.mode === 'live' ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300' : 'border-amber-500/60 bg-amber-500/15 text-amber-300'
            }`}
          >
            {s.mode === 'live' ? '● LIVE' : '◼ MANUAL'}
          </button>
          <button
            onClick={() => setMinimized(true)}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-cyan-300 transition"
            title="Ciutkan ke tepi kanan"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              title="Tutup Kontrol"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
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
                <span className="font-mono text-3xl font-bold text-cyan-300 tracking-tight">{fmtHMS(date, loc.tz)}</span>
                <button onClick={s.goLive} className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/60 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition">
                  <RotateCcw className="h-3 w-3 text-cyan-400" /> Sekarang
                </button>
              </div>
              <p className="text-[11px] text-slate-500">{fmtDateLong(date, loc.tz)} · {tzLabel(loc.tz)}</p>
            </div>

            {/* KOTAK INPUT WAKTU MANUAL (JAM, MENIT, DETIK) */}
            <div className="rounded-xl border border-cyan-500/30 bg-slate-950/80 p-3 shadow-lg">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-wider text-cyan-300">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" /> MASUKKAN WAKTU MANUAL
                </span>
                {appliedNotice ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    <Check className="h-2.5 w-2.5" /> Diterapkan!
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-mono">
                    Jam : Mnt : Dtk
                  </span>
                )}
              </div>

              {/* 3 Kotak Input: Jam, Menit, Detik */}
              <div className="grid grid-cols-3 gap-2">
                {/* JAM */}
                <div className="flex flex-col items-center rounded-lg border border-slate-700/80 bg-slate-900/90 p-1.5 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/40 transition">
                  <span className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase">Jam</span>
                  <div className="flex items-center w-full justify-between px-1 my-0.5">
                    <button
                      type="button"
                      onClick={() => adjustHMS(-1, 0, 0)}
                      className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                      title="Kurang 1 Jam"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={hInput}
                      onChange={(e) => {
                        setIsEditingTime(true);
                        const v = e.target.value.replace(/\D/g, '');
                        if (v.length <= 2) setHInput(v);
                      }}
                      onBlur={() => commitExactTime()}
                      onKeyDown={(e) => e.key === 'Enter' && commitExactTime()}
                      className="w-8 text-center font-mono text-base font-bold text-cyan-300 bg-transparent outline-none p-0"
                    />
                    <button
                      type="button"
                      onClick={() => adjustHMS(1, 0, 0)}
                      className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                      title="Tambah 1 Jam"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* MENIT */}
                <div className="flex flex-col items-center rounded-lg border border-slate-700/80 bg-slate-900/90 p-1.5 focus-within:border-cyan-400 focus-within:ring-1 focus-within:ring-cyan-400/40 transition">
                  <span className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase">Menit</span>
                  <div className="flex items-center w-full justify-between px-1 my-0.5">
                    <button
                      type="button"
                      onClick={() => adjustHMS(0, -1, 0)}
                      className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                      title="Kurang 1 Menit"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={mInput}
                      onChange={(e) => {
                        setIsEditingTime(true);
                        const v = e.target.value.replace(/\D/g, '');
                        if (v.length <= 2) setMInput(v);
                      }}
                      onBlur={() => commitExactTime()}
                      onKeyDown={(e) => e.key === 'Enter' && commitExactTime()}
                      className="w-8 text-center font-mono text-base font-bold text-cyan-300 bg-transparent outline-none p-0"
                    />
                    <button
                      type="button"
                      onClick={() => adjustHMS(0, 1, 0)}
                      className="p-1 rounded text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition"
                      title="Tambah 1 Menit"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* DETIK */}
                <div className="flex flex-col items-center rounded-lg border border-amber-500/40 bg-amber-950/20 p-1.5 focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/40 transition">
                  <span className="text-[9px] font-semibold tracking-wider text-amber-300 uppercase">Detik</span>
                  <div className="flex items-center w-full justify-between px-1 my-0.5">
                    <button
                      type="button"
                      onClick={() => adjustHMS(0, 0, -1)}
                      className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
                      title="Kurang 1 Detik"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={sInput}
                      onChange={(e) => {
                        setIsEditingTime(true);
                        const v = e.target.value.replace(/\D/g, '');
                        if (v.length <= 2) setSInput(v);
                      }}
                      onBlur={() => commitExactTime()}
                      onKeyDown={(e) => e.key === 'Enter' && commitExactTime()}
                      className="w-8 text-center font-mono text-base font-bold text-amber-300 bg-transparent outline-none p-0"
                    />
                    <button
                      type="button"
                      onClick={() => adjustHMS(0, 0, 1)}
                      className="p-1 rounded text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition"
                      title="Tambah 1 Detik"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Aksi Tambahan: Nudge Detik & Tombol Terapkan */}
              <div className="mt-2.5 flex items-center justify-between gap-1 pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => s.shiftSeconds(-10)}
                    className="rounded bg-slate-800/90 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    title="Mundur 10 Detik"
                  >
                    −10d
                  </button>
                  <button
                    type="button"
                    onClick={() => s.shiftSeconds(10)}
                    className="rounded bg-slate-800/90 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    title="Maju 10 Detik"
                  >
                    +10d
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const decimalHours = local.h + local.min / 60; // reset ke 00 detik
                      s.setSimDate(fromLocal(local.y, local.m, local.d, decimalHours, loc.tz));
                    }}
                    className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/20 transition"
                    title="Setel detik ke :00 tepat"
                  >
                    :00 dtk
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <label className="relative cursor-pointer" title="Buka pemilih waktu bawaan browser">
                    <input
                      type="time"
                      step="1"
                      value={`${hInput.padStart(2, '0')}:${mInput.padStart(2, '0')}:${sInput.padStart(2, '0')}`}
                      onChange={(e) => handleNativeTimeChange(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="rounded border border-slate-700 bg-slate-800/80 p-1 text-slate-400 hover:text-cyan-300 hover:bg-slate-700 transition">
                      <Clock className="h-3 w-3" />
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={() => commitExactTime()}
                    className="rounded-lg border border-cyan-500/50 bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-300 hover:bg-cyan-500/30 active:scale-95 transition flex items-center gap-1"
                  >
                    <Check className="h-3 w-3" />
                    Terapkan
                  </button>
                </div>
              </div>
            </div>

            {/* SLIDER WAKTU 24 JAM */}
            <div>
              <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                <span>Slider Waktu 24 Jam</span>
                <span className="font-mono font-bold text-cyan-300">{fmtHMS(date, loc.tz)}</span>
              </div>
              <input
                type="range"
                min={0}
                max={23.9999}
                step={1 / 3600}
                value={local.hours}
                onChange={(e) => setLocalTime(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>00:00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>23:59:59</span>
              </div>
            </div>

            {/* LOMPAT CEPAT */}
            <div>
              <p className="mb-1.5 text-[10px] tracking-wider text-slate-400">LOMPAT CEPAT</p>
              <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                {[[-60, '−1 Jam'], [-15, '−15 Mnt'], [15, '+15 Mnt'], [60, '+1 Jam']].map(([m, l]) => (
                  <button key={l} onClick={() => s.shiftMinutes(m as number)} className="rounded-md border border-slate-700 bg-slate-800/50 py-1.5 text-[11px] hover:bg-slate-700 transition">
                    {l}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {([
                  [-60, '−1 Mnt'],
                  [-10, '−10 Dtk'],
                  [10, '+10 Dtk'],
                  [60, '+1 Mnt'],
                ] as const).map(([val, label]) => (
                  <button
                    key={label}
                    onClick={() => (label.includes('Dtk') ? s.shiftSeconds(val) : s.shiftMinutes(val / 60))}
                    className="rounded-md border border-slate-800 bg-slate-900/60 py-1 text-[10px] text-slate-300 hover:border-slate-700 hover:bg-slate-800 transition"
                  >
                    {label}
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
                className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1.5 text-xs truncate"
              >
                {CITIES.findIndex((c) => c.name === loc.name) === -1 && (
                  <option value={-1}>📍 {loc.name}</option>
                )}
                {CITIES.map((c, i) => (
                  <option key={c.name} value={i}>{c.name} ({tzLabel(c.tz)})</option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={useGPS}
                disabled={geoLoading}
                className="flex items-center justify-center gap-1.5 rounded-md border border-cyan-500/50 bg-cyan-500/10 py-2 text-xs text-cyan-200 transition hover:bg-cyan-500/20 disabled:opacity-50"
              >
                <LocateFixed className={`h-3.5 w-3.5 ${geoLoading ? 'animate-spin' : ''}`} />
                {geoLoading ? 'Membaca…' : 'GPS Saya'}
              </button>
              <button
                onClick={() => setShowLocModal(true)}
                className="flex items-center justify-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 py-2 text-xs text-slate-200 transition hover:bg-slate-700"
              >
                <Search className="h-3.5 w-3.5 text-teal-400" />
                Cari / Peta
              </button>
            </div>
            {geoNotice && (
              <div className="rounded border border-amber-500/30 bg-amber-500/10 p-2 text-[10px] text-amber-200">
                {geoNotice}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <NumField label="Lintang φ (−90 … 90)" value={loc.lat} min={-89.99} max={89.99} step={0.00001}
                onCommit={(v) => s.setLocation({ ...loc, name: 'Koordinat Kustom', lat: v, source: 'manual' })} />
              <NumField label="Bujur λ (−180 … 180)" value={loc.lon} min={-180} max={180} step={0.00001}
                onCommit={(v) => s.setLocation({ ...loc, name: 'Koordinat Kustom', lon: v, source: 'manual' })} />
              <NumField label="Elevasi (m dpl)" value={loc.elevation ?? 10} min={-500} max={8848} step={1}
                onCommit={(v) => s.setLocation({ ...loc, elevation: v, source: 'manual' })} />
              <NumField label="Zona Waktu (UTC±)" value={loc.tz} min={-12} max={14} step={1}
                onCommit={(v) => s.setLocation({ ...loc, tz: v })} />
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-2.5 text-[11px] text-slate-400">
              <p className="mb-1 flex items-center gap-1.5 font-semibold text-slate-300"><Crosshair className="h-3 w-3 text-cyan-400" /> Catatan Hisab</p>
              Lintang selatan (LS) negatif, bujur barat (BB) negatif. Elevasi memengaruhi waktu terbit/terbenam matahari (kerendahan ufuk / dip).
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

      <LocationPickerModal isOpen={showLocModal} onClose={() => setShowLocModal(false)} />
    </aside>
  );
}
