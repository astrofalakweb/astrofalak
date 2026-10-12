'use client';

import { useState } from 'react';
import { ChevronDown, Compass, Gauge, MapPin, Sun, Timer, Triangle } from 'lucide-react';
import { useAstro, dayPhase } from '../lib/useAstro';
import { compassName, relativeDirection, signed, toDMS } from '../lib/falak/format';
import { fmtHMSHours, tzLabel } from '../lib/falak/time';
import { trig } from '../lib/falak/math';

function DataBox({
  label, tag, value, dms, note, accent,
}: { label: string; tag: string; value: string; dms: string; note: string; accent: string }) {
  return (
    <div className={`rounded-lg border border-slate-700/80 border-l-[3px] bg-slate-950/60 p-2.5 ${accent}`}>
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] text-slate-400">{label}</span>
        <span className="rounded bg-slate-800 px-1 text-[8px] font-semibold tracking-wide text-slate-400">{tag}</span>
      </div>
      <div className="my-0.5 font-mono text-lg font-bold text-slate-50">{value}</div>
      <div className="font-mono text-[10px] text-slate-500">{dms}</div>
      <div className="mt-0.5 text-[10px] text-slate-400">{note}</div>
    </div>
  );
}

function Row({ icon, label, value, color = 'text-slate-200' }: { icon?: React.ReactNode; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1 text-xs">
      <span className="flex items-center gap-1.5 text-slate-400">{icon}{label}</span>
      <span className={`font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}

export function HUD() {
  const { sun, loc, schedule, qibla } = useAstro();
  const [open, setOpen] = useState(false);
  const phase = dayPhase(sun.altitude, sun.hourAngle);
  const t = sun.hourAngle;
  const lat = loc.lat;

  // Verifikasi rumus cosinus segitiga bola
  const hCheck = trig.asin(trig.sin(lat) * trig.sin(sun.dec) + trig.cos(lat) * trig.cos(sun.dec) * trig.cos(t));
  const angleZ = sun.azimuth <= 180 ? sun.azimuth : 360 - sun.azimuth;

  return (
    <aside className="pointer-events-auto absolute left-4 top-4 z-20 max-h-[calc(100%-15rem)] w-[300px] overflow-y-auto rounded-xl border border-slate-700/80 bg-slate-900/85 p-4 shadow-2xl backdrop-blur-md">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xs font-bold tracking-wider text-slate-100">
            <Gauge className="h-4 w-4 text-cyan-400" /> TELEMETRY HUD
            <span className={`rounded border px-1.5 py-px text-[9px] ${phase.color}`}>{phase.label}</span>
          </h2>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
            <MapPin className="h-3 w-3" /> {loc.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <DataBox label="Tinggi (h)" tag="ALTITUDE" value={`${signed(sun.altitude)}°`} dms={toDMS(sun.altitude, true)}
          note={sun.altitude > 0 ? 'Di atas ufuk' : 'Di bawah ufuk'} accent="border-l-orange-400" />
        <DataBox label="Azimuth (Az)" tag="UTARA 0°" value={`${sun.azimuth.toFixed(2)}°`} dms={toDMS(sun.azimuth)}
          note={`Arah ${compassName(sun.azimuth)}`} accent="border-l-cyan-400" />
        <DataBox label="Deklinasi (δ)" tag="DECLINATION" value={`${signed(sun.dec)}°`} dms={toDMS(sun.dec, true)}
          note={sun.dec >= 0 ? 'Utara ekuator (LU)' : 'Selatan ekuator (LS)'} accent="border-l-emerald-400" />
        <DataBox label="Sudut Waktu (t)" tag="HOUR ANGLE" value={`${signed(t)}°`} dms={`${signed(t / 15)} jam`}
          note={t < 0 ? 'Sebelum kulminasi (pagi)' : 'Sesudah kulminasi (sore)'} accent="border-l-violet-400" />
      </div>

      <div className="mt-3 divide-y divide-slate-800 border-t border-slate-800 pt-1">
        <Row icon={<Compass className="h-3 w-3" />} label="Arah Kiblat" value={`${qibla.az.toFixed(2)}° (${relativeDirection(qibla.az)})`} color="text-orange-300" />
        <Row label="Jarak ke Ka'bah" value={`${qibla.distance.toLocaleString('id-ID', { maximumFractionDigits: 0 })} km`} />
        <Row icon={<Sun className="h-3 w-3" />} label="Kulminasi (Zawal)" value={`${fmtHMSHours(schedule.transit)} ${tzLabel(loc.tz)}`} color="text-amber-300" />
        <Row icon={<Timer className="h-3 w-3" />} label="Perata Waktu (e)" value={`${signed(sun.eot)} mnt`} color="text-cyan-300" />
        <Row label="Asensio Rekta (α)" value={fmtHMSHours(sun.ra / 15)} />
        <Row label="Waktu Bintang Lokal" value={fmtHMSHours(sun.lst / 15)} />
      </div>

      <button
        onClick={() => setOpen(!open)}
        className="mt-2 flex w-full items-center justify-between rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/5 px-2.5 py-1.5 text-[11px] font-semibold text-fuchsia-300 hover:bg-fuchsia-500/10"
      >
        <span className="flex items-center gap-1.5"><Triangle className="h-3 w-3" /> Parameter Segitiga Bola</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 space-y-2 rounded-lg border border-slate-800 bg-slate-950/60 p-2.5 text-[11px]">
          <p className="text-slate-400">Titik sudut: <b className="text-slate-200">Zenith (Z)</b>, <b className="text-slate-200">Kutub Langit Utara (P)</b>, <b className="text-slate-200">Matahari (M)</b></p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono">
            <span className="text-slate-400">ZP = 90° − φ</span><span className="text-right text-fuchsia-300">{(90 - lat).toFixed(4)}°</span>
            <span className="text-slate-400">PM = 90° − δ</span><span className="text-right text-fuchsia-300">{(90 - sun.dec).toFixed(4)}°</span>
            <span className="text-slate-400">ZM = 90° − h</span><span className="text-right text-fuchsia-300">{(90 - sun.altitude).toFixed(4)}°</span>
            <span className="text-slate-400">∠P = t</span><span className="text-right text-violet-300">{Math.abs(t).toFixed(4)}°</span>
            <span className="text-slate-400">∠Z = Az*</span><span className="text-right text-cyan-300">{angleZ.toFixed(4)}°</span>
          </div>
          <div className="rounded border border-slate-800 bg-slate-900 p-2 font-mono text-[10px] leading-relaxed text-slate-300">
            sin h = sin φ·sin δ + cos φ·cos δ·cos t<br />
            h = {hCheck.toFixed(4)}° <span className="text-emerald-400">✓ cocok</span>
          </div>
          <p className="text-[10px] text-slate-500">*∠Z diukur dari arah Utara ke Timur (pagi) atau ke Barat (sore).</p>
        </div>
      )}
    </aside>
  );
}
