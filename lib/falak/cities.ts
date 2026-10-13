export interface ObserverLocation {
  name: string;
  lat: number;
  lon: number;
  tz: number;
  elevation?: number;
}

export const CITIES: ObserverLocation[] = [
  { name: 'Jakarta (Monas)', lat: -6.1754, lon: 106.8272, tz: 7, elevation: 8 },
  { name: 'Bandung', lat: -6.9175, lon: 107.6191, tz: 7, elevation: 768 },
  { name: 'Semarang', lat: -6.9667, lon: 110.4167, tz: 7, elevation: 4 },
  { name: 'Yogyakarta (Masjid Agung Gedhe Kauman)', lat: -7.803889, lon: 110.3625, tz: 7, elevation: 114 },
  { name: 'Surabaya', lat: -7.2575, lon: 112.7521, tz: 7, elevation: 5 },
  { name: 'Banda Aceh', lat: 5.5483, lon: 95.3238, tz: 7, elevation: 21 },
  { name: 'Medan', lat: 3.5952, lon: 98.6722, tz: 7, elevation: 26 },
  { name: 'Padang', lat: -0.9471, lon: 100.4172, tz: 7, elevation: 8 },
  { name: 'Palembang', lat: -2.9761, lon: 104.7754, tz: 7, elevation: 8 },
  { name: 'Pontianak', lat: -0.0263, lon: 109.3425, tz: 7, elevation: 2 },
  { name: 'Banjarmasin', lat: -3.3186, lon: 114.5944, tz: 8, elevation: 3 },
  { name: 'Denpasar', lat: -8.6705, lon: 115.2126, tz: 8, elevation: 34 },
  { name: 'Mataram', lat: -8.5833, lon: 116.1167, tz: 8, elevation: 15 },
  { name: 'Makassar', lat: -5.1477, lon: 119.4327, tz: 8, elevation: 14 },
  { name: 'Manado', lat: 1.4748, lon: 124.8421, tz: 8, elevation: 10 },
  { name: 'Ambon', lat: -3.6954, lon: 128.1814, tz: 9, elevation: 12 },
  { name: 'Jayapura', lat: -2.5916, lon: 140.669, tz: 9, elevation: 15 },
  { name: 'Makkah (Ka\'bah)', lat: 21.4225, lon: 39.8262, tz: 3, elevation: 277 },
  { name: 'Madinah', lat: 24.4686, lon: 39.6142, tz: 3, elevation: 608 },
  { name: 'Kairo', lat: 30.0444, lon: 31.2357, tz: 2, elevation: 23 },
  { name: 'Kuala Lumpur', lat: 3.139, lon: 101.6869, tz: 8, elevation: 22 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, tz: 9, elevation: 40 },
  { name: 'London', lat: 51.5074, lon: -0.1278, tz: 0, elevation: 11 },
];
