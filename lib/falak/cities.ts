export interface ObserverLocation {
  name: string;
  lat: number;
  lon: number;
  tz: number;
  elevation?: number;
  accuracy?: number;
  source?: 'gps' | 'wifi' | 'network' | 'manual' | 'preset';
  district?: string;
  city?: string;
  province?: string;
  fullAddress?: string;
}

export const CITIES: ObserverLocation[] = [
  // --- DKI Jakarta & Sekitarnya ---
  { name: 'Jakarta (Monas)', lat: -6.175392, lon: 106.827153, tz: 7, elevation: 8, source: 'preset' },
  { name: 'Jakarta Selatan', lat: -6.261493, lon: 106.810600, tz: 7, elevation: 28, source: 'preset' },
  { name: 'Jakarta Timur', lat: -6.225014, lon: 106.900447, tz: 7, elevation: 22, source: 'preset' },
  { name: 'Bogor', lat: -6.597147, lon: 106.806039, tz: 7, elevation: 265, source: 'preset' },
  { name: 'Depok', lat: -6.402484, lon: 106.794241, tz: 7, elevation: 92, source: 'preset' },
  { name: 'Tangerang', lat: -6.178306, lon: 106.631889, tz: 7, elevation: 18, source: 'preset' },
  { name: 'Tangerang Selatan', lat: -6.288890, lon: 106.717890, tz: 7, elevation: 35, source: 'preset' },
  { name: 'Bekasi', lat: -6.238270, lon: 106.975573, tz: 7, elevation: 19, source: 'preset' },
  { name: 'Serang (Banten)', lat: -6.120000, lon: 106.150278, tz: 7, elevation: 39, source: 'preset' },

  // --- Jawa Barat ---
  { name: 'Bandung', lat: -6.917464, lon: 107.619123, tz: 7, elevation: 768, source: 'preset' },
  { name: 'Cimahi', lat: -6.872222, lon: 107.542222, tz: 7, elevation: 740, source: 'preset' },
  { name: 'Cirebon', lat: -6.732044, lon: 108.552316, tz: 7, elevation: 5, source: 'preset' },
  { name: 'Sukabumi', lat: -6.927778, lon: 106.930000, tz: 7, elevation: 584, source: 'preset' },
  { name: 'Tasikmalaya', lat: -7.327400, lon: 108.220700, tz: 7, elevation: 351, source: 'preset' },

  // --- Jawa Tengah & D.I. Yogyakarta ---
  { name: 'Semarang', lat: -6.966667, lon: 110.416667, tz: 7, elevation: 4, source: 'preset' },
  { name: 'Surakarta (Solo)', lat: -7.575489, lon: 110.824326, tz: 7, elevation: 93, source: 'preset' },
  { name: 'Yogyakarta', lat: -7.9778384, lon: 110.3672257, tz: 7, elevation: 398, source: 'preset' },
  { name: 'Sleman (DIY)', lat: -7.716667, lon: 110.355556, tz: 7, elevation: 236, source: 'preset' },
  { name: 'Magelang', lat: -7.479722, lon: 110.217778, tz: 7, elevation: 380, source: 'preset' },
  { name: 'Salatiga', lat: -7.330556, lon: 110.508333, tz: 7, elevation: 580, source: 'preset' },
  { name: 'Purwokerto (Banyumas)', lat: -7.424444, lon: 109.230278, tz: 7, elevation: 84, source: 'preset' },
  { name: 'Pekalongan', lat: -6.888611, lon: 109.675278, tz: 7, elevation: 7, source: 'preset' },
  { name: 'Tegal', lat: -6.869444, lon: 109.140278, tz: 7, elevation: 5, source: 'preset' },
  { name: 'Kudus', lat: -6.804722, lon: 110.840556, tz: 7, elevation: 28, source: 'preset' },

  // --- Jawa Timur ---
  { name: 'Surabaya', lat: -7.257472, lon: 112.752088, tz: 7, elevation: 5, source: 'preset' },
  { name: 'Malang', lat: -7.979700, lon: 112.630400, tz: 7, elevation: 444, source: 'preset' },
  { name: 'Kediri', lat: -7.848016, lon: 112.017829, tz: 7, elevation: 67, source: 'preset' },
  { name: 'Madiun', lat: -7.629800, lon: 111.523900, tz: 7, elevation: 65, source: 'preset' },
  { name: 'Jember', lat: -8.172110, lon: 113.700710, tz: 7, elevation: 89, source: 'preset' },
  { name: 'Banyuwangi', lat: -8.219233, lon: 114.369227, tz: 7, elevation: 16, source: 'preset' },

  // --- Sumatera ---
  { name: 'Banda Aceh', lat: 5.548290, lon: 95.323756, tz: 7, elevation: 21, source: 'preset' },
  { name: 'Medan', lat: 3.595196, lon: 98.672223, tz: 7, elevation: 26, source: 'preset' },
  { name: 'Padang', lat: -0.947083, lon: 100.417181, tz: 7, elevation: 8, source: 'preset' },
  { name: 'Pekanbaru', lat: 0.507068, lon: 101.447779, tz: 7, elevation: 12, source: 'preset' },
  { name: 'Batam', lat: 1.130140, lon: 104.052950, tz: 7, elevation: 24, source: 'preset' },
  { name: 'Tanjung Pinang', lat: 0.916667, lon: 104.450000, tz: 7, elevation: 18, source: 'preset' },
  { name: 'Jambi', lat: -1.610123, lon: 103.613120, tz: 7, elevation: 16, source: 'preset' },
  { name: 'Bengkulu', lat: -3.800440, lon: 102.265540, tz: 7, elevation: 15, source: 'preset' },
  { name: 'Palembang', lat: -2.976074, lon: 104.775431, tz: 7, elevation: 8, source: 'preset' },
  { name: 'Pangkal Pinang', lat: -2.133333, lon: 106.116667, tz: 7, elevation: 20, source: 'preset' },
  { name: 'Bandar Lampung', lat: -5.429444, lon: 105.262500, tz: 7, elevation: 16, source: 'preset' },

  // --- Bali & Nusa Tenggara ---
  { name: 'Denpasar (Bali)', lat: -8.670458, lon: 115.212629, tz: 8, elevation: 34, source: 'preset' },
  { name: 'Mataram (Lombok)', lat: -8.583333, lon: 116.116667, tz: 8, elevation: 15, source: 'preset' },
  { name: 'Kupang (NTT)', lat: -10.177200, lon: 123.607030, tz: 8, elevation: 62, source: 'preset' },

  // --- Kalimantan ---
  { name: 'Pontianak', lat: -0.026330, lon: 109.342504, tz: 7, elevation: 2, source: 'preset' },
  { name: 'Palangka Raya', lat: -2.207670, lon: 113.916450, tz: 7, elevation: 15, source: 'preset' },
  { name: 'Banjarmasin', lat: -3.318600, lon: 114.594378, tz: 8, elevation: 3, source: 'preset' },
  { name: 'Samarinda', lat: -0.502106, lon: 117.153709, tz: 8, elevation: 14, source: 'preset' },
  { name: 'Balikpapan', lat: -1.237920, lon: 116.828880, tz: 8, elevation: 21, source: 'preset' },
  { name: 'Tarakan (Kaltara)', lat: 3.300000, lon: 117.633333, tz: 8, elevation: 10, source: 'preset' },

  // --- Sulawesi ---
  { name: 'Makassar', lat: -5.147665, lon: 119.432732, tz: 8, elevation: 14, source: 'preset' },
  { name: 'Manado', lat: 1.474830, lon: 124.842079, tz: 8, elevation: 10, source: 'preset' },
  { name: 'Palu', lat: -0.891700, lon: 119.870700, tz: 8, elevation: 12, source: 'preset' },
  { name: 'Kendari', lat: -3.998460, lon: 122.512600, tz: 8, elevation: 18, source: 'preset' },
  { name: 'Gorontalo', lat: 0.543544, lon: 123.056769, tz: 8, elevation: 11, source: 'preset' },
  { name: 'Mamuju', lat: -2.674800, lon: 118.888700, tz: 8, elevation: 8, source: 'preset' },

  // --- Maluku & Papua ---
  { name: 'Ambon', lat: -3.695430, lon: 128.181430, tz: 9, elevation: 12, source: 'preset' },
  { name: 'Ternate', lat: 0.791667, lon: 127.383333, tz: 9, elevation: 15, source: 'preset' },
  { name: 'Jayapura', lat: -2.591603, lon: 140.669006, tz: 9, elevation: 15, source: 'preset' },
  { name: 'Sorong', lat: -0.876111, lon: 131.255833, tz: 9, elevation: 10, source: 'preset' },
  { name: 'Manokwari', lat: -0.861453, lon: 134.062042, tz: 9, elevation: 37, source: 'preset' },
  { name: 'Merauke', lat: -8.499100, lon: 140.404900, tz: 9, elevation: 5, source: 'preset' },

  // --- Tempat Bersejarah & Internasional ---
  { name: 'Makkah (Ka\'bah)', lat: 21.422524, lon: 39.826182, tz: 3, elevation: 277, source: 'preset' },
  { name: 'Madinah (Masjid Nabawi)', lat: 24.468611, lon: 39.614167, tz: 3, elevation: 608, source: 'preset' },
  { name: 'Al-Quds (Masjid Al-Aqsha)', lat: 31.776111, lon: 35.235833, tz: 2, elevation: 750, source: 'preset' },
  { name: 'Kairo (Al-Azhar)', lat: 30.045833, lon: 31.262778, tz: 2, elevation: 30, source: 'preset' },
  { name: 'Kuala Lumpur', lat: 3.139003, lon: 101.686855, tz: 8, elevation: 22, source: 'preset' },
  { name: 'Tokyo', lat: 35.676192, lon: 139.650311, tz: 9, elevation: 40, source: 'preset' },
  { name: 'London (Greenwich)', lat: 51.476852, lon: -0.000500, tz: 0, elevation: 46, source: 'preset' },
];

export function findClosestCity(lat: number, lon: number): { city: ObserverLocation; distanceKm: number } {
  const R = 6371; // radius bumi km
  let minD = Infinity;
  let closest = CITIES[0];

  for (const c of CITIES) {
    const dLat = ((c.lat - lat) * Math.PI) / 180;
    const dLon = ((c.lon - lon) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat * Math.PI) / 180) * Math.cos((c.lat * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const d = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (d < minD) {
      minD = d;
      closest = c;
    }
  }

  return { city: closest, distanceKm: minD };
}
