// =============================================================
// Hisab Waktu Salat — Kriteria Kementerian Agama RI
//   Subuh   : h = −20°
//   Terbit  : h = −1°   (dikurangi ihtiyat)
//   Dhuha   : h = +4.5°
//   Dzuhur  : transit (kulminasi) matahari
//   Ashar   : cot h = 1 + tan|φ − δ|
//   Maghrib : h = −1°
//   Isya    : h = −18°
//   Imsak   : Subuh − 10 menit
//   Ihtiyat : +2 menit, lalu dibulatkan ke atas ke menit penuh
// =============================================================
import { D2R, R2D, hourAngleForAltitude, solarPosition } from './math';
import { localParts } from './time';

export type PrayerKey = 'imsak' | 'subuh' | 'terbit' | 'dhuha' | 'dzuhur' | 'ashar' | 'terbenam' | 'maghrib' | 'isya';

export interface PrayerEntry {
  key: PrayerKey;
  name: string;
  arabic: string;
  /** jam desimal lokal setelah ihtiyat & pembulatan */
  time: number;
  /** jam desimal lokal hasil hisab murni */
  raw: number;
  criteria: string;
}

export interface PrayerSchedule {
  entries: PrayerEntry[];
  /** waktu transit/kulminasi (jam desimal lokal) */
  transit: number;
  dec: number;
  eot: number;
  asarAltitude: number;
}

export const IHTIYAT_MINUTES = 2;

const ceilMin = (h: number) => Math.ceil(h * 60 - 1e-9) / 60;
const floorMin = (h: number) => Math.floor(h * 60 + 1e-9) / 60;

export function asarAltitude(lat: number, dec: number): number {
  return Math.atan(1 / (1 + Math.tan(Math.abs(lat - dec) * D2R))) * R2D;
}

export function computePrayerTimes(date: Date, lat: number, lon: number, tz: number, elevation: number = 0): PrayerSchedule {
  const p = localParts(date, tz);
  const base = Date.UTC(p.y, p.m, p.d) - tz * 3600000; // tengah malam lokal
  const sunAt = (localHours: number) => solarPosition(new Date(base + localHours * 3600000));
  const transitFrom = (eot: number) => 12 - eot / 60 + (tz * 15 - lon) / 15;

  // Transit (iterasi 2x agar δ & EoT diambil tepat pada saat transit)
  let transit = transitFrom(sunAt(12).eot);
  transit = transitFrom(sunAt(transit).eot);
  const solNoon = sunAt(transit);

  /** Waktu saat matahari mencapai tinggi tertentu; side -1 = pagi, +1 = sore. */
  const eventTime = (alt: number | ((dec: number) => number), side: -1 | 1): number => {
    let t = transit + side * 6;
    for (let i = 0; i < 4; i++) {
      const s = sunAt(t);
      const h = typeof alt === 'function' ? alt(s.dec) : alt;
      const ha = hourAngleForAltitude(h, lat, s.dec, elevation);
      if (isNaN(ha)) return NaN;
      t = transitFrom(s.eot) + (side * ha) / 15;
    }
    return t;
  };

  const IH = IHTIYAT_MINUTES / 60;
  const subuhRaw = eventTime(-20, -1);
  const terbitRaw = eventTime(-1, -1);
  const dhuhaRaw = eventTime(4.5, -1);
  const asharRaw = eventTime((dec) => asarAltitude(lat, dec), 1);
  const maghribRaw = eventTime(-1, 1);
  const isyaRaw = eventTime(-18, 1);

  const subuh = ceilMin(subuhRaw + IH);
  const asarAlt = asarAltitude(lat, solNoon.dec);

  const entries: PrayerEntry[] = [
    { key: 'imsak', name: 'Imsak', arabic: 'الإمساك', time: subuh - 10 / 60, raw: subuhRaw - 10 / 60, criteria: 'Subuh − 10 mnt' },
    { key: 'subuh', name: 'Subuh', arabic: 'الصبح', time: subuh, raw: subuhRaw, criteria: 'h = −20°' },
    { key: 'terbit', name: 'Terbit', arabic: 'الشروق', time: floorMin(terbitRaw - IH), raw: terbitRaw, criteria: 'h = −1°' },
    { key: 'dhuha', name: 'Dhuha', arabic: 'الضحى', time: ceilMin(dhuhaRaw + IH), raw: dhuhaRaw, criteria: 'h = +4.5°' },
    { key: 'dzuhur', name: 'Dzuhur', arabic: 'الظهر', time: ceilMin(transit + IH), raw: transit, criteria: 'Transit + ihtiyat' },
    { key: 'ashar', name: 'Ashar', arabic: 'العصر', time: ceilMin(asharRaw + IH), raw: asharRaw, criteria: `h = ${asarAlt.toFixed(2)}°` },
    { key: 'terbenam', name: 'Terbenam', arabic: 'الغروب', time: floorMin(maghribRaw - IH), raw: maghribRaw, criteria: 'h = −1°' },
    { key: 'maghrib', name: 'Maghrib', arabic: 'المغرب', time: ceilMin(maghribRaw + IH), raw: maghribRaw, criteria: 'h = −1°' },
    { key: 'isya', name: 'Isya', arabic: 'العشاء', time: ceilMin(isyaRaw + IH), raw: isyaRaw, criteria: 'h = −18°' },
  ];

  return { entries, transit, dec: solNoon.dec, eot: solNoon.eot, asarAltitude: asarAlt };
}
