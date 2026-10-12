'use client';

import { useMemo } from 'react';
import { useAppStore } from './store';
import { distanceToKaaba, qiblaAzimuth, sunState } from './falak/math';
import { computePrayerTimes } from './falak/prayer';
import { localParts, toISODate } from './falak/time';

/** Hook terpusat: semua besaran astronomi untuk waktu & lokasi aktif. */
export function useAstro() {
  const date = useAppStore((s) => s.date);
  const loc = useAppStore((s) => s.location);

  const sun = useMemo(() => sunState(date, loc.lat, loc.lon), [date, loc.lat, loc.lon]);

  const dayKey = toISODate(date, loc.tz);
  const schedule = useMemo(
    () => computePrayerTimes(date, loc.lat, loc.lon, loc.tz, loc.elevation || 0),
    // dihitung ulang hanya saat tanggal lokal / lokasi berubah
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayKey, loc.lat, loc.lon, loc.tz, loc.elevation],
  );

  const qibla = useMemo(
    () => ({ az: qiblaAzimuth(loc.lat, loc.lon), distance: distanceToKaaba(loc.lat, loc.lon) }),
    [loc.lat, loc.lon],
  );

  const local = localParts(date, loc.tz);

  return { date, loc, sun, schedule, qibla, local };
}

export type DayPhase = { label: string; color: string };

export function dayPhase(altitude: number, hourAngle: number): DayPhase {
  if (altitude > 0) return { label: 'SIANG', color: 'text-amber-300 border-amber-400/50 bg-amber-400/10' };
  if (altitude > -18)
    return hourAngle < 0
      ? { label: 'FAJAR', color: 'text-rose-300 border-rose-400/50 bg-rose-400/10' }
      : { label: 'SENJA', color: 'text-orange-300 border-orange-400/50 bg-orange-400/10' };
  return { label: 'MALAM', color: 'text-indigo-300 border-indigo-400/50 bg-indigo-400/10' };
}
