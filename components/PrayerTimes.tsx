'use client';

import { useState } from 'react';
import {
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Clock,
  CloudMoon,
  CloudSun,
  Moon,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  X,
} from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useRealtimeAstro } from '../lib/useAstro';
import { IHTIYAT_MINUTES, type PrayerKey, type PrayerEntry } from '../lib/falak/prayer';
import { fmtDuration, fmtHM, fromLocal, tzLabel } from '../lib/falak/time';

const PRAYER_ICONS: Record<PrayerKey, React.ReactNode> = {
  imsak: <Moon className="h-3.5 w-3.5 text-cyan-400" />,
  subuh: <CloudMoon className="h-3.5 w-3.5 text-sky-400" />,
  terbit: <Sunrise className="h-3.5 w-3.5 text-amber-400" />,
  dhuha: <Sun className="h-3.5 w-3.5 text-amber-300" />,
  dzuhur: <Sun className="h-3.5 w-3.5 text-amber-400" />,
  ashar: <CloudSun className="h-3.5 w-3.5 text-orange-400" />,
  terbenam: <Sunset className="h-3.5 w-3.5 text-rose-400" />,
  maghrib: <Sunset className="h-3.5 w-3.5 text-rose-500" />,
  isya: <Moon className="h-3.5 w-3.5 text-indigo-400" />,
};

const FARDHU_KEYS: PrayerKey[] = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];
const FALAK_KEYS: PrayerKey[] = ['imsak', 'terbit', 'dhuha', 'terbenam'];

export function PrayerTimes({ onClose, isSheet }: { onClose?: () => void; isSheet?: boolean }) {
  const { schedule, loc, local } = useRealtimeAstro(1000);
  const prayerMethod = useAppStore((s) => s.prayerMethod);
  const setSimDate = useAppStore((s) => s.setSimDate);
  const openModal = useAppStore((s) => s.openModal);
  const panels = useAppStore((s) => s.panels);
  const [collapsed, setCollapsed] = useState(false);

  const entries = schedule.entries;
  const now = local.hours;
  const idx = entries.findIndex((e) => isFinite(e.time) && e.time > now);
  const nextIdx = idx === -1 ? 0 : idx;
  const remaining = idx === -1 ? entries[0].time + 24 - now : entries[idx].time - now;
  const nextEntry = entries[nextIdx];

  const fardhuEntries = entries.filter((e) => FARDHU_KEYS.includes(e.key));
  const falakEntries = entries.filter((e) => FALAK_KEYS.includes(e.key));

  const jumpToTime = (entry: PrayerEntry) => {
    if (isFinite(entry.time)) {
      setSimDate(fromLocal(local.y, local.m, local.d, entry.time, loc.tz));
    }
  };

  // Posisi horizontal desktop dinamis agar tidak pernah menutupi HUD (kiri 300px) atau ControlPanel (kanan 320px)
  const leftCls = panels.hud ? 'lg:left-[324px]' : 'lg:left-4';
  const rightCls = panels.control ? 'lg:right-[344px]' : 'lg:right-4';

  const containerClasses = isSheet
    ? 'flex flex-col h-full w-full overflow-y-auto p-4'
    : `pointer-events-auto absolute bottom-3 z-20 hidden lg:block ${leftCls} ${rightCls} w-auto max-w-3xl mx-auto rounded-2xl border border-slate-700/80 bg-slate-900/95 shadow-2xl backdrop-blur-xl transition-all duration-300`;

  return (
    <section className={containerClasses}>
      {/* ============================================================== */}
      {/* 1. COMPACT DOCK MODE (Saat di-minimize pada layar Desktop)     */}
      {/* ============================================================== */}
      {!isSheet && collapsed ? (
        <div className="flex items-center justify-between gap-3 px-3 py-2">
          {/* Badge Salat Berikutnya */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500" />
            </span>
            <div className="flex items-baseline gap-1.5 truncate text-xs">
              <span className="font-semibold text-slate-300">Berikutnya:</span>
              <span className="font-bold text-cyan-300">{nextEntry.name}</span>
              <span className="font-mono font-bold text-white">{fmtHM(nextEntry.time)}</span>
              <span className="text-[11px] text-slate-400">({fmtDuration(remaining)})</span>
            </div>
          </div>

          {/* Quick 5 Fardhu Pills */}
          <div className="hidden sm:flex items-center gap-1">
            {fardhuEntries.map((e) => {
              const isNext = e.key === nextEntry.key;
              return (
                <button
                  key={e.key}
                  onClick={() => jumpToTime(e)}
                  title={`Klik untuk simulasi 3D waktu ${e.name} (${fmtHM(e.time)})`}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] transition ${
                    isNext
                      ? 'border border-cyan-400/80 bg-cyan-500/20 font-bold text-cyan-200 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                      : 'border border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {PRAYER_ICONS[e.key]}
                  <span>{e.name}</span>
                  <span className="font-mono font-medium">{fmtHM(e.time)}</span>
                </button>
              );
            })}
          </div>

          {/* Tombol Aksi */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => openModal({ type: 'monthly' })}
              className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Jadwal Bulanan"
            >
              <CalendarRange className="h-3 w-3" />
              <span className="hidden md:inline">Bulanan</span>
            </button>
            <button
              onClick={() => setCollapsed(false)}
              className="flex items-center gap-1 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 transition"
              title="Buka Detail Hisab Falak"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              <span>Detail</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="rounded-md p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
                title="Tutup Jadwal Salat"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* 2. EXPANDED OBSERVATORY CONSOLE MODE                            */
        /* ============================================================== */
        <div className="p-3.5 sm:p-4">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Clock className="h-3.5 w-3.5" />
              </div>
              <div>
                <h2 className="text-xs font-bold tracking-wider text-slate-100 flex items-center gap-2">
                  HISAB WAKTU SALAT
                  <span className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-px text-[9px] font-medium text-cyan-300">
                    {prayerMethod === 'google'
                      ? 'Google / Global (0m)'
                      : prayerMethod === 'lfnu'
                      ? 'Falakiyah NU (nu.or.id)'
                      : `Kemenag RI (+${IHTIYAT_MINUTES}m)`}
                  </span>
                </h2>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-950/80 px-2.5 py-0.5 text-[11px] text-slate-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                </span>
                <span>{loc.name} ·</span>
                <span className="font-semibold text-amber-300">{nextEntry.name}</span>
                <span className="font-mono text-cyan-300">{fmtHM(nextEntry.time)}</span>
                <span className="text-slate-400">({fmtDuration(remaining)})</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => openModal({ type: 'monthly' })}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1 text-[11px] text-slate-200 hover:border-slate-600 hover:bg-slate-700/80 transition"
              >
                <CalendarRange className="h-3.5 w-3.5 text-cyan-400" />
                <span>Jadwal Bulanan</span>
              </button>
              {!isSheet && (
                <button
                  onClick={() => setCollapsed(true)}
                  className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800/40 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200 transition"
                  title="Perkecil ke Tampilan Dock"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                  <span className="text-[10px]">Ringkas</span>
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="rounded-lg p-1 text-slate-400 hover:bg-rose-500/20 hover:text-rose-300 transition"
                  title="Tutup"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* TIER 1: 5 SALAT MAKTUBAH (FARDHU) - GRID 5 KOLOM SIMETRIS    */}
          {/* Tidak ada kolom yatim / wrapping aneh seperti buatan AI!     */}
          {/* ============================================================ */}
          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold tracking-wider text-slate-400">
              <span>SALAT 5 WAKTU (FARDHU)</span>
              <span className="text-slate-500">Klik kartu untuk simulasi 3D</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {fardhuEntries.map((e) => {
                const isNext = e.key === nextEntry.key;
                return (
                  <button
                    key={e.key}
                    onClick={() => jumpToTime(e)}
                    title={`Klik untuk memutar bola langit ke waktu ${e.name}`}
                    className={`group relative rounded-xl border p-2.5 text-left transition-all duration-200 ${
                      isNext
                        ? 'border-cyan-400/90 bg-gradient-to-b from-cyan-500/20 via-cyan-950/30 to-slate-950/80 shadow-[0_0_24px_rgba(34,211,238,0.22)] ring-1 ring-cyan-400/50'
                        : 'border-slate-800/90 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/70 hover:-translate-y-0.5'
                    }`}
                  >
                    {isNext && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400 px-2 py-0.5 text-[8px] font-extrabold tracking-wider text-slate-950 shadow-md">
                        BERIKUTNYA
                      </span>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <span className={`flex items-center gap-1.5 font-bold ${isNext ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {PRAYER_ICONS[e.key]}
                        {e.name}
                      </span>
                      <span className="font-serif text-[13px] text-slate-400/80 group-hover:text-slate-200 transition">
                        {e.arabic}
                      </span>
                    </div>

                    <div className={`my-1 text-center font-mono text-xl font-extrabold tracking-tight ${isNext ? 'text-cyan-200' : 'text-white'}`}>
                      {fmtHM(e.time)}
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-400/80 border-t border-slate-800/80 pt-1 leading-tight">
                      <span className="truncate">{e.criteria}</span>
                      <span className="font-mono text-slate-500">Murni {fmtHM(e.raw)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ============================================================ */}
          {/* TIER 2: PENANDA FALAK ASTRONOMIS (IMSAK, TERBIT, DHUHA, DST) */}
          {/* Strip horisontal terpadu, proporsional dan elegan             */}
          {/* ============================================================ */}
          <div className="mt-2.5 rounded-xl border border-slate-800/80 bg-slate-950/50 p-2">
            <div className="mb-1.5 flex items-center justify-between text-[10px] text-slate-400">
              <span className="font-semibold tracking-wider">PENANDA ASTRONOMIS & SUNNAH</span>
              <span className="font-mono text-[9px] text-slate-500">
                Transit: {fmtHM(schedule.transit)} {tzLabel(loc.tz)} · δ = {schedule.dec.toFixed(2)}° · e = {schedule.eot.toFixed(2)} mnt
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {falakEntries.map((e) => {
                const isNext = e.key === nextEntry.key;
                return (
                  <button
                    key={e.key}
                    onClick={() => jumpToTime(e)}
                    title={`Klik untuk simulasi waktu ${e.name}`}
                    className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-xs transition ${
                      isNext
                        ? 'border-amber-400/80 bg-amber-500/15 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.25)]'
                        : 'border-slate-800/90 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {PRAYER_ICONS[e.key]}
                      <span className="font-semibold">{e.name}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold ${isNext ? 'text-amber-300' : 'text-slate-100'}`}>
                        {fmtHM(e.time)}
                      </span>
                      <span className="block text-[8px] text-slate-500 leading-none">
                        {e.criteria}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Telemetri Hisab */}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3 w-3 text-cyan-400/80" />
              Klik salah satu kartu untuk mengarahkan bola langit 3D ke posisi matahari saat waktu tersebut.
            </span>
            <span className="font-mono text-slate-400">
              Ketinggian Matahari Ashar: {schedule.asarAltitude.toFixed(2)}°
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
