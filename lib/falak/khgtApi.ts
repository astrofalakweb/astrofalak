// =============================================================
// Sinkronisasi Data Jadwal Salat Muhammadiyah
// Sumber: API Resmi Majelis Tarjih PP Muhammadiyah (KHGT)
// Digunakan oleh: https://pcimmarfakhruddin.org/jadwal-salat-bulanan
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
  if (KHGT_MEMORY_CACHE[cKey]) {
    return KHGT_MEMORY_CACHE[cKey];
  }

  if (typeof window !== 'undefined') {
    try {
      const storageKey = `falak_khgt_${date.getFullYear()}_${date.getMonth() + 1}_${coordKey(lat, lng)}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed: KhgtScheduleItem[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            KHGT_MEMORY_CACHE[`${item.date}_${coordKey(lat, lng)}`] = item;
          });
          if (KHGT_MEMORY_CACHE[cKey]) {
            return KHGT_MEMORY_CACHE[cKey];
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
 * Ambil jadwal salat Muhammadiyah 1 bulan penuh langsung dari API KHGT
 * (sama persis dengan yang diimplementasikan di https://pcimmarfakhruddin.org/jadwal-salat-bulanan).
 */
export async function fetchMonthlyKhgt(
  year: number,
  month: number, // 1-12
  lat: number,
  lng: number,
  onUpdate?: () => void
): Promise<KhgtScheduleItem[] | null> {
  const mStr = String(month).padStart(2, '0');
  const requestDate = `${year}-${mStr}-15`;
  const fetchKey = `${year}_${month}_${coordKey(lat, lng)}`;

  if (FETCH_PROMISES[fetchKey]) {
    return FETCH_PROMISES[fetchKey];
  }

  const promise = (async () => {
    try {
      // Coba lewat proxy internal Next.js terlebih dahulu
      let res: Response;
      try {
        res = await fetch('/api/sholat/muhammadiyah', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, date: requestDate, mode: 'monthly_masehi' }),
        });
      } catch {
        // Fallback langsung ke domain resmi jika route internal belum siap
        res = await fetch('https://api-khgt.muhammadiyah.or.id/api/sholat/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, date: requestDate, mode: 'monthly_masehi' }),
        });
      }

      if (!res.ok) {
        // Fallback langsung ke API pusat
        res = await fetch('https://api-khgt.muhammadiyah.or.id/api/sholat/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, date: requestDate, mode: 'monthly_masehi' }),
        });
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json && json.data && Array.isArray(json.data.schedules)) {
        const schedules: KhgtScheduleItem[] = json.data.schedules;
        schedules.forEach((item) => {
          KHGT_MEMORY_CACHE[`${item.date}_${coordKey(lat, lng)}`] = item;
        });

        if (typeof window !== 'undefined') {
          try {
            const storageKey = `falak_khgt_${year}_${month}_${coordKey(lat, lng)}`;
            localStorage.setItem(storageKey, JSON.stringify(schedules));
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
