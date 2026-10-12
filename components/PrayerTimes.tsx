'use client';

import { useState } from 'react';
import { CalendarRange, ChevronDown, Clock, CloudMoon, CloudSun, Moon, Sun, Sunrise, Sunset } from 'lucide-react';
import { useAppStore } from '../lib/store';
import { useAstro } from '../lib/useAstro';
import { IHTIYAT_MINUTES, type PrayerKey } from '../lib/falak/prayer';
import { fmtDuration, fmtHM, fromLocal, tzLabel } from '../lib/falak/time';

const ICONS: Record<PrayerKey, React.ReactNode> = {
  imsak: <Moon className="h-3.5 w-3.5" />,
  subuh: <CloudMoon className="h-3.5 w-3.5" />,
  terbit: <Sunrise className="h-3.5 w-3.5" />,
  dhuha: <CloudSun className="h-3.5 w-3.5" />,
  dzuhur: <Sun className="h-3.5 w-3.5" />,
  ashar: <CloudSun className="h-3.5 w-3.5" />,
  maghrib: <Sunset className="h-3.5 w-3.5" />,
  isya: <Moon className="h-3.5 w-3.5" />,
};

export function PrayerTimes() {
  const { schedule, loc, local } = useAstro();
  const setSimDate = useAppStore((s) => s.setSimDate);
  const openModal = useAppStore((s) => s.openModal);
  const [collapsed, setCollapsed] = useState(false);

  const entries = schedule.entries;
  const now = local.hours;
  const idx = entries.findIndex((e) => isFinite(e.time) && e.time > now);
  const nextIdx = idx === -1 ? 0 : idx;
  const remaining = idx === -1 ? entries[0].time + 24 - now : entries[idx].time - now;

  return (
    <section className="pointer-events-auto absolute bottom-4 left-1/2 z-20 w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 rounded-xl border border-slate-700/80 bg-slate-900/85 px-4 py-3 shadow-2xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Clock className="h-4 w-4 text-cyan-400" />
          <h2 className="text-xs font-bold tracking-wider">JADWAL WAKTU SALAT (HISAB FALAK)</h2>
          <span className="rounded border border-cyan-500/40 bg-cyan-500/10 px-1.5 py-px text-[10px] text-cyan-300">Ihtiyat +{IHTIYAT_MINUTES}m</span>
          <span className="text-[11px] text-slate-400">
            {loc.name} · <span className="text-amber-300">{entries[nextIdx].name}</span> dalam {fmtDuration(remaining)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => openModal({ type: 'monthly' })} className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800/50 px-2.5 py-1 text-[11px] hover:bg-slate-700">
            <CalendarRange className="h-3.5 w-3.5" /> Jadwal Bulanan
          </button>
          <span className="hidden rounded-md border border-slate-700 px-2 py-1 text-[11px] text-slate-400 md:inline">Kriteria Kemenag RI</span>
          <button onClick={() => setCollapsed(!collapsed)} className="rounded p-1 text-slate-400 hover:text-slate-100">
            <ChevronDown className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="mt-3 grid grid-cols-4 gap-2 lg:grid-cols-8">
            {entries.map((e, i) => {
              const isNext = i === nextIdx;
              return (
                <button
                  key={e.key}
                  onClick={() => isFinite(e.time) && setSimDate(fromLocal(local.y, local.m, local.d, e.time, loc.tz))}
                  className={`relative rounded-lg border p-2.5 text-left transition hover:bg-slate-800 ${
                    isNext ? 'border-cyan-400 bg-cyan-500/10 shadow-[0_0_18px_rgba(34,211,238,0.25)]' : 'border-slate-700/80 bg-slate-950/60'
                  }`}
                >
                  {isNext && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-cyan-400 px-2 text-[8px] font-bold text-slate-950">BERIKUTNYA</span>
                  )}
                  <div className={`flex items-center justify-between text-[11px] ${isNext ? 'text-cyan-300' : 'text-slate-400'}`}>
                    <span className="flex items-center gap-1">{ICONS[e.key]} {e.name}</span>
                    <span className="font-serif text-xs">{e.arabic}</span>
                  </div>
                  <div className={`my-1 text-center font-mono text-xl font-bold ${isNext ? 'text-cyan-200' : 'text-slate-50'}`}>{fmtHM(e.time)}</div>
                  <div className="text-center text-[9px] leading-tight text-slate-500">
                    {e.criteria}
                    <br />Murni: {fmtHM(e.raw)}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex flex-wrap justify-between gap-2 text-[10px] text-slate-500">
            <span>* Klik kartu salat untuk memindahkan simulasi 3D ke waktu tersebut.</span>
            <span>
              Transit: {fmtHM(schedule.transit)} {tzLabel(loc.tz)} · δ = {schedule.dec.toFixed(2)}° · e = {schedule.eot.toFixed(2)} mnt
            </span>
          </div>
        </>
      )}
    </section>
  );
}
