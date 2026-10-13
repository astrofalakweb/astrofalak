'use client';

import type { ObserverLocation } from './falak/cities';

export type GeoSource = 'gps' | 'network';

export interface GeoResult {
  location: ObserverLocation;
  source: GeoSource;
  /** akurasi (meter) bila tersedia */
  accuracy?: number;
  /** pesan informasi untuk ditampilkan ke pengguna (mis. alasan fallback) */
  notice?: string;
}

export class GeoError extends Error {
  constructor(message: string, public hint?: string) {
    super(message);
  }
}

/**
 * Browser HANYA mengizinkan GPS (dan sensor kompas) pada "secure context":
 * https://… atau http://localhost. Membuka aplikasi lewat http://192.168.x.x
 * dari HP akan selalu ditolak tanpa muncul dialog izin.
 */
export function isSecureOrigin(): boolean {
  if (typeof window === 'undefined') return true;
  return window.isSecureContext;
}

export const INSECURE_HINT =
  'Browser memblokir GPS & kompas pada alamat http:// selain localhost. ' +
  'Jalankan "npm run dev:https" lalu buka https://<IP-komputer>:3000 di HP ' +
  '(pilih "Lanjutkan/Advanced → Proceed" pada peringatan sertifikat).';

const deviceTz = () => -new Date().getTimezoneOffset() / 60;

function positionOnce(opts: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, opts));
}

function describe(err: GeolocationPositionError): GeoError {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return new GeoError(
        'Izin lokasi ditolak.',
        'Buka pengaturan situs di browser (ikon gembok/ⓘ di address bar) → Izin → Lokasi → Izinkan, lalu coba lagi.',
      );
    case err.POSITION_UNAVAILABLE:
      return new GeoError('Sinyal lokasi tidak tersedia.', 'Aktifkan Lokasi/GPS di pengaturan HP dan coba di area terbuka.');
    case err.TIMEOUT:
      return new GeoError('Waktu habis saat mencari lokasi.', 'Pastikan GPS aktif lalu coba lagi.');
    default:
      return new GeoError(err.message || 'Gagal membaca lokasi.');
  }
}

/** Perkiraan lokasi dari alamat IP jaringan (tidak butuh HTTPS / izin). */
async function networkLocation(): Promise<GeoResult> {
  const endpoints: { url: string; parse: (j: any) => { lat: number; lon: number; city?: string } | null }[] = [
    { url: 'https://ipwho.is/', parse: (j) => (j?.success ? { lat: j.latitude, lon: j.longitude, city: j.city } : null) },
    { url: 'https://ipapi.co/json/', parse: (j) => (j?.latitude ? { lat: j.latitude, lon: j.longitude, city: j.city } : null) },
  ];
  for (const ep of endpoints) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(ep.url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const p = ep.parse(await res.json());
      if (p && isFinite(p.lat) && isFinite(p.lon)) {
        return {
          source: 'network',
          location: {
            name: `${p.city || 'Lokasi'} (perkiraan jaringan)`,
            lat: +p.lat.toFixed(4),
            lon: +p.lon.toFixed(4),
            tz: deviceTz(),
            elevation: 0,
          },
        };
      }
    } catch {
      /* coba endpoint berikutnya */
    }
  }
  throw new GeoError('Tidak dapat memperkirakan lokasi dari jaringan.');
}

/**
 * Ambil lokasi pengguna. Urutan: GPS akurasi tinggi → GPS akurasi rendah →
 * (bila GPS diblokir/tidak aman) perkiraan lokasi dari jaringan.
 */
export async function locateUser(): Promise<GeoResult> {
  const canGps = typeof navigator !== 'undefined' && !!navigator.geolocation && isSecureOrigin();

  if (canGps) {
    try {
      let pos: GeolocationPosition;
      try {
        pos = await positionOnce({ enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
      } catch (e) {
        const err = e as GeolocationPositionError;
        if (err.code === err.PERMISSION_DENIED) throw err;
        // fallback: akurasi rendah biasanya lebih cepat (Wi-Fi / BTS)
        pos = await positionOnce({ enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 });
      }
      return {
        source: 'gps',
        accuracy: pos.coords.accuracy,
        location: {
          name: 'Lokasi Saya (GPS)',
          lat: +pos.coords.latitude.toFixed(4),
          lon: +pos.coords.longitude.toFixed(4),
          tz: deviceTz(),
          elevation: Math.max(0, Math.round(pos.coords.altitude || 0)),
        },
      };
    } catch (e) {
      const gpsErr = describe(e as GeolocationPositionError);
      try {
        const net = await networkLocation();
        return { ...net, notice: `${gpsErr.message} Memakai perkiraan lokasi dari jaringan.` };
      } catch {
        throw gpsErr;
      }
    }
  }

  // GPS tidak tersedia (biasanya karena http:// tidak aman)
  try {
    const net = await networkLocation();
    return {
      ...net,
      notice: isSecureOrigin()
        ? 'GPS tidak didukung perangkat ini. Memakai perkiraan lokasi dari jaringan.'
        : 'GPS diblokir karena koneksi bukan HTTPS. Memakai perkiraan lokasi dari jaringan (±kota).',
    };
  } catch {
    if (!isSecureOrigin()) throw new GeoError('GPS diblokir karena koneksi bukan HTTPS.', INSECURE_HINT);
    throw new GeoError('GPS tidak didukung di perangkat ini.');
  }
}
