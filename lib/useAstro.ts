'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from './store';
import type { ObserverLocation } from './falak/cities';
import { distanceToKaaba, qiblaAzimuth, sunState } from './falak/math';
import { computePrayerTimes } from './falak/prayer';
import { localParts, toISODate } from './falak/time';
import { fetchMonthlyKhgt } from './falak/khgtApi';

function useAstroFor(date: Date, loc: ObserverLocation, methodId: string = 'kemenag') {
  const khgtSyncNonce = useAppStore((s) => s.khgtSyncNonce);
  const triggerKhgtSync = useAppStore((s) => s.triggerKhgtSync);

  // Jika metode Muhammadiyah aktif, otomatis ambil data resmi KHGT bulanan
  useEffect(() => {
    if (methodId === 'muhammadiyah') {
      const y = date.getFullYear();
      const m = date.getMonth() + 1;
      fetchMonthlyKhgt(y, m, loc.lat, loc.lon, () => {
        triggerKhgtSync();
      }, loc.elevation);
    }
  }, [methodId, date.getFullYear(), date.getMonth(), loc.lat, loc.lon, loc.elevation, triggerKhgtSync]);

  const sun = useMemo(() => sunState(date, loc.lat, loc.lon), [date, loc.lat, loc.lon]);

  const dayKey = toISODate(date, loc.tz);
  const schedule = useMemo(
    () => computePrayerTimes(date, loc.lat, loc.lon, loc.tz, loc.elevation || 0, methodId),
    // dihitung ulang hanya saat tanggal lokal / lokasi / metode hisab / sync KHGT berubah
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dayKey, loc.lat, loc.lon, loc.tz, loc.elevation, methodId, khgtSyncNonce],
  );

  const qibla = useMemo(
    () => ({ az: qiblaAzimuth(loc.lat, loc.lon), distance: distanceToKaaba(loc.lat, loc.lon) }),
    [loc.lat, loc.lon],
  );

  const local = localParts(date, loc.tz);

  return { date, loc, sun, schedule, qibla, local };
}

/**
 * Besaran astronomi untuk waktu SIMULASI Bola Langit (`store.date`).
 * Dipakai oleh visualisasi 3D, HUD, dan panel kontrol.
 */
export function useAstro() {
  const date = useAppStore((s) => s.date);
  const loc = useAppStore((s) => s.location);
  const prayerMethod = useAppStore((s) => s.prayerMethod);
  return useAstroFor(date, loc, prayerMethod);
}

/** Jam perangkat yang berdetak sendiri, tidak terpengaruh simulasi apa pun. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Besaran astronomi untuk WAKTU NYATA. Dipakai halaman Waktu Salat, Beranda,
 * Kiblat & Kuis agar jadwal salat tidak ikut berubah ketika simulasi
 * Bola Langit / Tata Surya dipercepat.
 */
export function useRealtimeAstro(intervalMs = 1000) {
  const now = useNow(intervalMs);
  const loc = useAppStore((s) => s.location);
  const prayerMethod = useAppStore((s) => s.prayerMethod);
  return useAstroFor(now, loc, prayerMethod);
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
