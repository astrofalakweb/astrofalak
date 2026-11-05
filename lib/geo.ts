import { findClosestCity, type ObserverLocation } from './falak/cities';

export type GeoSource = 'gps' | 'wifi' | 'network' | 'manual' | 'preset';

export interface GeoResult {
  location: ObserverLocation;
  source: GeoSource;
  /** Akurasi (meter) bila tersedia dari sensor */
  accuracy?: number;
  /** Jenis perangkat terdeteksi: mobile (HP/tablet) atau pc (desktop/laptop) */
  deviceType?: 'mobile' | 'pc';
  /** Pesan informasi atau panduan untuk pengguna */
  notice?: string;
}

export class GeoError extends Error {
  constructor(message: string, public hint?: string) {
    super(message);
  }
}

/**
 * Mendeteksi apakah perangkat pengguna adalah smartphone/tablet (mobile) atau desktop/PC.
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTouch = typeof window !== 'undefined' && (('ontouchstart' in window) || navigator.maxTouchPoints > 0);
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth <= 840;
  return isMobileUa || (isTouch && isSmallScreen);
}

/**
 * Browser HANYA mengizinkan sensor GPS pada "secure context": https://… atau http://localhost.
 * Membuka aplikasi lewat http://192.168.x.x dari HP akan ditolak oleh browser seluler.
 */
export function isSecureOrigin(): boolean {
  if (typeof window === 'undefined') return true;
  return window.isSecureContext;
}

export const INSECURE_HINT =
  'Browser HP membatasi sensor GPS pada alamat HTTP biasa. ' +
  'Gunakan "npm run dev:https" lalu buka https://<IP-Komputer>:3000 di HP, ' +
  'atau gunakan pencarian kota/kecamatan dari menu lokasi.';

const deviceTz = () => -new Date().getTimezoneOffset() / 60;

/**
 * Perhitungan zona waktu Indonesia secara astronomis berdasarkan garis bujur:
 *  - WIB  (UTC+7) : Bujur 95° – 115°
 *  - WITA (UTC+8) : Bujur 115° – 125°
 *  - WIT  (UTC+9) : Bujur 125° – 141°
 */
export function tzFromLon(lon: number): number {
  if (lon >= 95 && lon < 115) return 7;
  if (lon >= 115 && lon < 125) return 8;
  if (lon >= 125 && lon <= 141) return 9;
  return Math.round(deviceTz()) || 7;
}

/**
 * Mengambil elevasi (ketinggian tempat dpl) secara presisi menggunakan model elevasi digital global (Open-Meteo DEM).
 * Elevasi sangat krusial dalam hisab rukyat (kerendahan ufuk / Dip = 0.0347 * sqrt(h)).
 */
export async function fetchElevation(lat: number, lon: number): Promise<number | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`, {
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const val = data?.elevation?.[0];
      if (typeof val === 'number' && isFinite(val) && val >= 0) {
        return Math.round(val);
      }
    }
  } catch {
    /* Fallback ke referensi kota */
  }
  return null;
}

function describe(err: GeolocationPositionError, isMobile: boolean): GeoError {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return new GeoError(
        'Izin lokasi (GPS) ditolak.',
        isMobile
          ? 'Buka setelan browser di HP (ikon gembok/pengaturan di address bar) → Izin Lokasi → Izinkan, lalu coba lagi.'
          : 'Buka perizinan browser di PC Anda (ikon gembok di sebelah kiri URL) → Izinkan Akses Lokasi.'
      );
    case err.POSITION_UNAVAILABLE:
      return new GeoError(
        'Sinyal lokasi perangkat tidak tersedia.',
        isMobile
          ? 'Pastikan fitur Lokasi/GPS di HP aktif (mode Akurasi Tinggi) dan coba dekat jendela atau ruang terbuka.'
          : 'Layanan lokasi di Windows/PC Anda mungkin nonaktif. Anda dapat mengaktifkannya di Windows Settings → Privacy & Security → Location, atau ketik lokasi di kolom pencarian.'
      );
    case err.TIMEOUT:
      return new GeoError(
        'Waktu pencarian sinyal lokasi habis.',
        isMobile
          ? 'Pastikan GPS HP aktif dengan mode Akurasi Tinggi lalu tekan kembali tombol GPS.'
          : 'Koneksi penentuan posisi pada PC memakan waktu terlalu lama. Pastikan PC terhubung ke internet.'
      );
    default:
      return new GeoError(err.message || 'Gagal membaca lokasi perangkat.');
  }
}

/**
 * Membersihkan nama wilayah dari prefiks birokrasi berlebih agar rapi di UI.
 */
function cleanAdminName(name: string): string {
  return name
    .replace(/^Daerah Khusus Ibukota\s+/i, '')
    .replace(/^Kota Administrasi\s+/i, '')
    .replace(/^Pemerintah\s+/i, '')
    .trim();
}

/**
 * Reverse geocode koordinat menjadi informasi wilayah yang presisi hingga tingkat kelurahan/kecamatan.
 * Prioritas: OpenStreetMap Nominatim (zoom 18) → BigDataCloud → Referensi Kota Terdekat.
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{
  name: string;
  district?: string;
  city?: string;
  province?: string;
  fullAddress?: string;
}> {
  // 1. Coba OpenStreetMap Nominatim dengan zoom detail 18
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
      {
        signal: ctrl.signal,
        headers: { 'Accept-Language': 'id' },
      }
    );
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const addr = data?.address || {};

      const village = addr.village || addr.suburb || addr.neighbourhood || addr.quarter || addr.hamlet;
      const district = addr.district || addr.city_district || addr.municipality || addr.suburb;
      const rawCity = addr.city || addr.regency || addr.county || addr.state_district;
      const province = addr.state;

      const cleanCity = rawCity ? cleanAdminName(rawCity).replace(/^(Kota|Kabupaten)\s+/i, '') : undefined;
      const cleanDist = district ? cleanAdminName(district) : undefined;
      const cleanVill = village ? cleanAdminName(village) : undefined;

      // Susun nama tampilan yang informatif dan ringkas
      let displayName = '';
      if (cleanDist && cleanCity && cleanDist.toLowerCase() !== cleanCity.toLowerCase()) {
        displayName = `Kec. ${cleanDist}, ${cleanCity}`;
      } else if (cleanVill && cleanCity) {
        displayName = `${cleanVill}, ${cleanCity}`;
      } else if (cleanCity) {
        displayName = cleanCity;
      } else if (cleanDist) {
        displayName = `Kec. ${cleanDist}`;
      }

      if (displayName) {
        return {
          name: displayName,
          district: cleanDist,
          city: cleanCity,
          province,
          fullAddress: data.display_name,
        };
      }
    }
  } catch {
    /* fallback */
  }

  // 2. Coba BigDataCloud free client reverse geocoding
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2200);
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    if (res.ok) {
      const d = await res.json();
      const rawCity = d.city ? cleanAdminName(d.city).replace(/^(Kota|Kabupaten)\s+/i, '') : null;
      const sub = d.locality;
      if (rawCity && sub && rawCity.toLowerCase() !== sub.toLowerCase()) {
        return { name: `${rawCity} (${sub})`, city: rawCity, district: sub };
      }
      if (rawCity) return { name: rawCity, city: rawCity };
      if (sub) return { name: sub, district: sub };
    }
  } catch {
    /* fallback */
  }

  // 3. Fallback Offline: cari referensi kota terdekat
  const { city, distanceKm } = findClosestCity(lat, lon);
  if (distanceKm < 40) {
    return { name: city.name.replace(/\s*\(.*?\)/, ''), city: city.name };
  }

  return { name: `Lokasi (${lat.toFixed(4)}°, ${lon.toFixed(4)}°)` };
}

/**
 * Mencari lokasi berdasarkan teks nama kota, kecamatan, kelurahan, atau koordinat numerik (lat, lon).
 */
export async function searchLocations(query: string): Promise<ObserverLocation[]> {
  const q = query.trim();
  if (!q) return [];

  // Jika input berupa format angka koordinat: misal "-6.9175, 107.6191"
  const coordMatch = q.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
  if (coordMatch) {
    const lat = Number(parseFloat(coordMatch[1]).toFixed(6));
    const lon = Number(parseFloat(coordMatch[3]).toFixed(6));
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      const elev = (await fetchElevation(lat, lon)) || 10;
      const geo = await reverseGeocode(lat, lon);
      return [
        {
          name: `${geo.name} (Koordinat)`,
          lat,
          lon,
          tz: tzFromLon(lon),
          elevation: elev,
          source: 'manual',
          fullAddress: geo.fullAddress,
        },
      ];
    }
  }

  // Pencarian melalui Nominatim OpenStreetMap
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        q
      )}&countrycodes=id&limit=6&addressdetails=1`,
      {
        signal: ctrl.signal,
        headers: { 'Accept-Language': 'id' },
      }
    );
    clearTimeout(timer);
    if (res.ok) {
      const items = await res.json();
      const results: ObserverLocation[] = [];
      for (const item of items) {
        const lat = Number(parseFloat(item.lat).toFixed(6));
        const lon = Number(parseFloat(item.lon).toFixed(6));
        const addr = item.address || {};
        const district = addr.district || addr.city_district || addr.suburb;
        const city = addr.city || addr.regency || addr.county;
        const prov = addr.state;

        let shortName = item.display_name.split(',')[0];
        if (district && city && district.toLowerCase() !== city.toLowerCase()) {
          shortName = `${shortName}, ${cleanAdminName(city).replace(/^(Kota|Kabupaten)\s+/i, '')}`;
        }

        results.push({
          name: shortName,
          lat,
          lon,
          tz: tzFromLon(lon),
          elevation: 10, // default, akan diperbarui saat dipilih
          source: 'manual',
          district: district ? cleanAdminName(district) : undefined,
          city: city ? cleanAdminName(city) : undefined,
          province: prov,
          fullAddress: item.display_name,
        });
      }
      return results;
    }
  } catch {
    /* fallback ke pencocokan nama kota lokal */
  }

  return [];
}

/**
 * Teknik Progressive High-Accuracy GNSS/GPS Sampling.
 * Di Mobile: Satelit GNSS memerlukan 2-6 detik untuk mengunci rasi satelit.
 * Koordinat awal dari menara BTS/ISP seluler (sering berpusat di Jakarta) dengan akurasi kasar (>1000m)
 * disaring agar tidak langsung dipakai, melainkan menunggu kunci satelit GPS perangkat yang sesungguhnya.
 */
function getPrecisePosition(isMobile: boolean, timeoutMs?: number): Promise<GeolocationPosition> {
  const effectiveTimeout = timeoutMs || (isMobile ? 12000 : 6000);

  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return reject(new Error('Geolocation tidak didukung pada browser ini.'));
    }

    let bestPos: GeolocationPosition | null = null;
    let watchId: number | null = null;
    let timer: NodeJS.Timeout | null = null;
    let stableTimer: NodeJS.Timeout | null = null;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (stableTimer) {
        clearTimeout(stableTimer);
        stableTimer = null;
      }
    };

    // Batas waktu maksimal pencarian sinyal satelit
    timer = setTimeout(() => {
      cleanup();
      if (bestPos) {
        resolve(bestPos);
      } else {
        // Coba panggilan one-shot terakhir
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 4000,
          maximumAge: 0,
        });
      }
    }, effectiveTimeout);

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const acc = pos.coords.accuracy;

          if (!bestPos || acc < bestPos.coords.accuracy) {
            bestPos = pos;
          }

          // 1. Mobile GPS Satelit: Jika akurasi <= 45m, rasi satelit GNSS telah terkunci presisi tinggi!
          if (isMobile && acc <= 45) {
            cleanup();
            resolve(pos);
            return;
          }

          // 2. Mobile Wi-Fi/A-GPS: Jika akurasi <= 90m, tunggu 1.2 detik untuk kesempatan satelit lebih rapat
          if (isMobile && acc <= 90) {
            if (!stableTimer) {
              stableTimer = setTimeout(() => {
                cleanup();
                resolve(bestPos || pos);
              }, 1200);
            }
            return;
          }

          // 3. Laptop/PC: Wi-Fi positioning umumnya 20m - 80m
          if (!isMobile && acc <= 80) {
            if (!stableTimer) {
              stableTimer = setTimeout(() => {
                cleanup();
                resolve(bestPos || pos);
              }, 1000);
            }
            return;
          }
        },
        (err) => {
          // Hanya batalkan langsung jika izin ditolak pengguna secara tegas
          if (err.code === err.PERMISSION_DENIED) {
            cleanup();
            reject(err);
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: effectiveTimeout,
        }
      );
    } catch {
      cleanup();
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: effectiveTimeout,
        maximumAge: 0,
      });
    }
  });
}

/**
 * Fallback penentuan lokasi IP jaringan untuk PC/Desktop yang tidak memiliki sensor Wi-Fi/GPS
 * atau ketika layanan Geolocation dimatikan oleh sistem operasi.
 */
async function fallbackPcNetworkLocation(): Promise<GeoResult> {
  const endpoints = [
    {
      url: 'https://freeipapi.com/api/json',
      parse: (j: any) =>
        j?.latitude && isFinite(j.latitude)
          ? { lat: j.latitude, lon: j.longitude, city: j.cityName, region: j.regionName }
          : null,
    },
    {
      url: 'https://ipwho.is/',
      parse: (j: any) =>
        j?.success && isFinite(j.latitude)
          ? { lat: j.latitude, lon: j.longitude, city: j.city, region: j.region }
          : null,
    },
    {
      url: 'https://api.bigdatacloud.net/data/reverse-geocode-client',
      parse: (j: any) =>
        j?.latitude && isFinite(j.latitude)
          ? { lat: j.latitude, lon: j.longitude, city: j.city || j.locality, region: j.principalSubdivision }
          : null,
    },
  ];

  for (const ep of endpoints) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3500);
      const res = await fetch(ep.url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) continue;
      const p = ep.parse(await res.json());
      if (p && isFinite(p.lat) && isFinite(p.lon)) {
        const lat = Number(Number(p.lat).toFixed(6));
        const lon = Number(Number(p.lon).toFixed(6));
        const tz = tzFromLon(lon);

        // Ambil elevasi terdekat
        const elev = (await fetchElevation(lat, lon)) || 10;
        const { city: closestCity } = findClosestCity(lat, lon);
        const cityName = p.city ? cleanAdminName(p.city) : closestCity.name;

        return {
          source: 'network',
          accuracy: 5000,
          deviceType: 'pc',
          notice:
            'Layanan lokasi perangkat PC tidak aktif. Menggunakan perkiraan jaringan internet (ISP). ' +
            'Untuk hisab falak presisi, Anda dapat memilih kota Anda langsung dari menu pilihan lokasi.',
          location: {
            name: `${cityName} (Jaringan PC)`,
            lat,
            lon,
            tz,
            elevation: elev,
            accuracy: 5000,
            source: 'network',
            city: cityName,
            province: p.region,
          },
        };
      }
    } catch {
      /* coba endpoint berikutnya */
    }
  }

  throw new GeoError('Tidak dapat menentukan lokasi perangkat.');
}

/**
 * Titik masuk utama pengambilan lokasi untuk semua perangkat (HP / Tablet / Web / PC).
 *  - Mobile (HP): Menjalankan hardware GNSS dengan akurasi satelit bertahap (< 12m).
 *  - Laptop/PC Wi-Fi: Menggunakan Google/Windows Location Service dengan resolusi Wi-Fi.
 *  - Desktop Kabel LAN: Bila browser tidak memiliki sensor lokasi, menggunakan perkiraan ISP
 *    dengan pesan informasi transparan, tanpa mengunci pengguna ke Jakarta.
 */
export async function locateUser(): Promise<GeoResult> {
  const isMobile = isMobileDevice();
  const hasGeo = typeof navigator !== 'undefined' && !!navigator.geolocation;

  if (!hasGeo) {
    if (!isMobile) return await fallbackPcNetworkLocation();
    throw new GeoError('Perangkat ini tidak mendukung fitur Geolocation/GPS.');
  }

  // Jika di HP dan koneksi bukan HTTPS, jelaskan panduannya
  if (isMobile && !isSecureOrigin()) {
    try {
      const pos = await getPrecisePosition(isMobile, 4000);
      return await buildLocationResult(pos, isMobile);
    } catch {
      throw new GeoError('GPS pada HP diblokir karena halaman dibuka lewat HTTP biasa.', INSECURE_HINT);
    }
  }

  // Ambil posisi perangkat secara presisi
  try {
    const pos = await getPrecisePosition(isMobile);
    return await buildLocationResult(pos, isMobile);
  } catch (e: any) {
    if (e?.code === e?.PERMISSION_DENIED) {
      throw describe(e as GeolocationPositionError, isMobile);
    }

    // Pada PC (misal desktop Ethernet tanpa kartu Wi-Fi), tawarkan perkiraan jaringan jika sensor hardware tidak ada
    if (!isMobile) {
      try {
        return await fallbackPcNetworkLocation();
      } catch {
        throw describe(e as GeolocationPositionError, isMobile);
      }
    }

    throw describe(e as GeolocationPositionError, isMobile);
  }
}

async function buildLocationResult(pos: GeolocationPosition, isMobile: boolean): Promise<GeoResult> {
  // Presisi koordinat hingga 6 digit desimal (resolusi ~10 centimeter)
  const lat = Number(pos.coords.latitude.toFixed(6));
  const lon = Number(pos.coords.longitude.toFixed(6));
  const accuracy = Math.round(pos.coords.accuracy || 0);

  // Jalankan reverse geocoding & pemindaian elevasi secara paralel untuk respon cepat
  const [geo, fetchedElev] = await Promise.all([
    reverseGeocode(lat, lon),
    fetchElevation(lat, lon),
  ]);

  // Ketinggian tempat (elevation): Prioritas Open-Meteo DEM -> sensor altimeter -> referensi kota
  let elevation = fetchedElev ?? Math.max(0, Math.round(pos.coords.altitude || 0));
  const { city: closestCity, distanceKm } = findClosestCity(lat, lon);
  if (elevation === 0 && distanceKm < 35 && closestCity.elevation) {
    elevation = closestCity.elevation;
  }

  const deviceTag = isMobile ? 'GPS' : accuracy <= 100 ? 'Wi-Fi' : 'PC';
  const displayName = `${geo.name} (${deviceTag})`;
  const tz = tzFromLon(lon);

  // Sumber sinyal
  const source: GeoSource = accuracy <= 35 ? 'gps' : accuracy <= 300 ? 'wifi' : 'network';

  return {
    source,
    accuracy,
    deviceType: isMobile ? 'mobile' : 'pc',
    location: {
      name: displayName,
      lat,
      lon,
      tz,
      elevation,
      accuracy,
      source,
      district: geo.district,
      city: geo.city,
      province: geo.province,
      fullAddress: geo.fullAddress,
    },
  };
}
