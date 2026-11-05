// =============================================================
// Sinkronisasi Data Jadwal Salat Muhammadiyah
// Sumber: API Resmi Majelis Tarjih PP Muhammadiyah (KHGT)
// =============================================================

export interface KhgtScheduleItem {
  date: string; // YYYY-MM-DD
  day_name?: string;
  hijri?: string;
  imsak: string; // HH:mm
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  meta?: {
    tz: number;
    elevation: number;
    engine: string;
  };
}

// In-memory cache keyed by "YYYY-MM-DD_lat_lng"
const KHGT_MEMORY_CACHE: Record<string, KhgtScheduleItem | undefined> = {};
const FETCH_PROMISES: Record<string, Promise<KhgtScheduleItem[] | null> | undefined> = {};

// Titik acuan resmi Yogyakarta
export const YOGYA_KHGT_REF = { lat: -7.9778384, lng: 110.3672257, elevation: 398 };

export function isYogyaRegion(lat: number, lng: number): boolean {
  return lat > -8.25 && lat < -7.55 && lng > 110.10 && lng < 110.60;
}

function coordKey(lat: number, lng: number): string {
  return `${lat.toFixed(3)}_${lng.toFixed(3)}`;
}

function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseTimeToHours(hhmm?: string): number | null {
  if (!hhmm || typeof hhmm !== 'string' || !hhmm.includes(':')) return null;
  const [h, m] = hhmm.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h + m / 60;
}

/**
 * Cek apakah jadwal KHGT sudah tersedia di memori atau localStorage.
 */
export function getCachedKhgtDay(date: Date, lat: number, lng: number): KhgtScheduleItem | null {
  const dKey = dateKey(date);
  const cKey = `${dKey}_${coordKey(lat, lng)}`;
  const isYogya = isYogyaRegion(lat, lng);
  const yKey = `${dKey}_${coordKey(YOGYA_KHGT_REF.lat, YOGYA_KHGT_REF.lng)}`;

  if (KHGT_MEMORY_CACHE[cKey]) {
    // Validasi agar data lama 17:35 di Yogyakarta tidak dipakai lagi
    const item = KHGT_MEMORY_CACHE[cKey]!;
    if (isYogya && item.date === '2026-10-19' && item.maghrib === '17:35') {
      delete KHGT_MEMORY_CACHE[cKey];
    } else {
      return item;
    }
  }

  if (isYogya && KHGT_MEMORY_CACHE[yKey]) {
    const item = KHGT_MEMORY_CACHE[yKey]!;
    if (item.date !== '2026-10-19' || item.maghrib !== '17:35') {
      return item;
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const keysToCheck = [
        `falak_khgt_${date.getFullYear()}_${date.getMonth() + 1}_${coordKey(lat, lng)}`,
      ];
      if (isYogya) {
        keysToCheck.push(`falak_khgt_${date.getFullYear()}_${date.getMonth() + 1}_${coordKey(YOGYA_KHGT_REF.lat, YOGYA_KHGT_REF.lng)}`);
      }

      for (const storageKey of keysToCheck) {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed: KhgtScheduleItem[] = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            // Jika ada cache usang Yogyakarta dengan maghrib 17:35 pada tgl 19, bersihkan
            const hasStale19 = isYogya && parsed.some((s) => s.date === '2026-10-19' && s.maghrib === '17:35');
            if (hasStale19) {
              localStorage.removeItem(storageKey);
              continue;
            }

            parsed.forEach((item) => {
              KHGT_MEMORY_CACHE[`${item.date}_${coordKey(lat, lng)}`] = item;
              if (isYogya) {
                KHGT_MEMORY_CACHE[`${item.date}_${coordKey(YOGYA_KHGT_REF.lat, YOGYA_KHGT_REF.lng)}`] = item;
              }
            });

            if (KHGT_MEMORY_CACHE[cKey]) return KHGT_MEMORY_CACHE[cKey]!;
            if (isYogya && KHGT_MEMORY_CACHE[yKey]) return KHGT_MEMORY_CACHE[yKey]!;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return null;
}

/**
 * Ambil jadwal salat Muhammadiyah 1 bulan penuh langsung dari API KHGT Majelis Tarjih.
 */
export async function fetchMonthlyKhgt(
  year: number,
  month: number, // 1-12
  lat: number,
  lng: number,
  onUpdate?: () => void,
  elevation?: number
): Promise<KhgtScheduleItem[] | null> {
  const mStr = String(month).padStart(2, '0');
  const requestDate = `${year}-${mStr}-15`;

  const isYogya = isYogyaRegion(lat, lng);
  const targetLat = isYogya ? YOGYA_KHGT_REF.lat : lat;
  const targetLng = isYogya ? YOGYA_KHGT_REF.lng : lng;
  const targetElev = isYogya ? YOGYA_KHGT_REF.elevation : (elevation || 0);

  const fetchKey = `${year}_${month}_${coordKey(targetLat, targetLng)}`;

  if (FETCH_PROMISES[fetchKey]) {
    return FETCH_PROMISES[fetchKey];
  }

  const promise = (async () => {
    try {
      const payload = {
        lat: targetLat,
        lng: targetLng,
        elevation: targetElev,
        date: requestDate,
        mode: 'monthly_masehi',
      };

      // Coba lewat proxy internal Next.js terlebih dahulu
      let res: Response;
      try {
        res = await fetch('/api/sholat/muhammadiyah', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        // Fallback langsung ke API resmi jika route internal belum siap
        res = await fetch('https://api-khgt.muhammadiyah.or.id/api/sholat/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        // Fallback langsung ke API pusat
        res = await fetch('https://api-khgt.muhammadiyah.or.id/api/sholat/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json && json.data && Array.isArray(json.data.schedules)) {
        const schedules: KhgtScheduleItem[] = json.data.schedules;
        schedules.forEach((item) => {
          KHGT_MEMORY_CACHE[`${item.date}_${coordKey(lat, lng)}`] = item;
          KHGT_MEMORY_CACHE[`${item.date}_${coordKey(targetLat, targetLng)}`] = item;
        });

        if (typeof window !== 'undefined') {
          try {
            const storageKey = `falak_khgt_${year}_${month}_${coordKey(lat, lng)}`;
            localStorage.setItem(storageKey, JSON.stringify(schedules));
            if (isYogya) {
              const yStorageKey = `falak_khgt_${year}_${month}_${coordKey(targetLat, targetLng)}`;
              localStorage.setItem(yStorageKey, JSON.stringify(schedules));
            }
          } catch {
            // ignore
          }
        }

        if (onUpdate) onUpdate();
        return schedules;
      }
      return null;
    } catch (e) {
      console.warn('[KHGT Muhammadiyah] Offline/fallback mode aktif:', e);
      return null;
    } finally {
      delete FETCH_PROMISES[fetchKey];
    }
  })();

  FETCH_PROMISES[fetchKey] = promise;
  return promise;
}
