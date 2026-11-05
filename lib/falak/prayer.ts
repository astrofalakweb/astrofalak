// =============================================================
// Hisab Waktu Salat — Algoritma Falak Hakiki Tahkiki Presisi Tinggi
// Standar Ketinggian Matahari (Altitude):
//   Imsak   : h = −22° (Kemenag RI & NU) / h = −20° (Muhammadiyah)
//   Subuh   : h = −20° (Kemenag RI & NU) / h = −18° (Muhammadiyah)
//   Terbit  : h = −1°   (dikurangi ihtiyat untuk kehati-hatian akhir subuh)
//   Dhuha   : h = +4,5°
//   Dzuhur  : H = 0° (kulminasi) + zawal clearance + ihtiyat
//   Ashar   : cot h = factor + tan|φ − δ| (Syafi'i factor=1)
//   Maghrib : h = −1°
//   Isya    : h = −18°
//   Ihtiyat : +2 menit, pembulatan ke atas (ceil) ke menit berikutnya
// =============================================================
import { D2R, R2D, hourAngleForAltitude, solarPosition, sunState } from './math';
import { localParts } from './time';
import { getCachedKhgtDay, parseTimeToHours } from './khgtApi';

export type PrayerKey = 'imsak' | 'subuh' | 'terbit' | 'dhuha' | 'dzuhur' | 'ashar' | 'terbenam' | 'maghrib' | 'isya';

export interface PrayerEntry {
  key: PrayerKey;
  name: string;
  arabic: string;
  /** jam desimal lokal setelah ihtiyat & pembulatan */
  time: number;
  /** jam desimal lokal hasil hisab murni (tepat saat matahari di altitude standar) */
  raw: number;
  /** kriteria standar tinggi matahari */
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

export interface PrayerMethodConfig {
  id: string;
  name: string;
  desc: string;
  imsakAngle: number;
  fajrAngle: number;
  ishaAngle?: number;
  ishaIntervalMinutes?: number;
  maghribAngle?: number;
  terbitAngle?: number;
  dhuhaAngle?: number;
  asrFactor?: number;
  ihtiyatMinutes?: number;
  zawalOffsetMinutes?: number;
  useDipCorrection?: boolean;
}

export const PRAYER_METHODS: Record<string, PrayerMethodConfig> = {
  kemenag: {
    id: 'kemenag',
    name: 'Kemenag RI',
    desc: 'Imsak: −22° · Subuh: −20° · Terbit/Magrib: −1° · Isya: −18° · Dhuha: +4,5° · Zuhur: H = 0° · Ashar: Syafi\'i · Ihtiyat: +2m',
    imsakAngle: -22,
    fajrAngle: -20,
    ishaAngle: -18,
    maghribAngle: -1,
    terbitAngle: -1,
    dhuhaAngle: 4.5,
    asrFactor: 1,
    ihtiyatMinutes: 2,
    zawalOffsetMinutes: 2.0,
    useDipCorrection: false,
  },
  lfnu: {
    id: 'lfnu',
    name: 'NU (Lembaga Falakiyah PBNU)',
    desc: 'Imsak: −22° · Subuh: −20° · Terbit/Magrib: −1° · Isya: −18° · Dhuha: +4,5° · Zuhur: H = 0° · Ashar: Syafi\'i · Hisab Hakiki Tahkiki',
    imsakAngle: -22,
    fajrAngle: -20,
    ishaAngle: -18,
    maghribAngle: -1,
    terbitAngle: -1,
    dhuhaAngle: 4.5,
    asrFactor: 1,
    ihtiyatMinutes: 0,
    zawalOffsetMinutes: 1.0,
    useDipCorrection: false,
  },
  muhammadiyah: {
    id: 'muhammadiyah',
    name: 'Muhammadiyah (Majelis Tarjih)',
    desc: 'Standar Resmi Majelis Tarjih (KHGT) · Imsak: −20° · Subuh: −18° · Terbit/Magrib: −1° · Isya: −18° · Dhuha: +4,5° · Ashar: Syafi\'i',
    imsakAngle: -20,
    fajrAngle: -18,
    ishaAngle: -18,
    maghribAngle: -1,
    terbitAngle: -1,
    dhuhaAngle: 4.5,
    asrFactor: 1,
    ihtiyatMinutes: 2,
    zawalOffsetMinutes: 1.5,
    useDipCorrection: false,
  },
};

export const IHTIYAT_MINUTES = 2;

const ceilMin = (h: number) => Math.ceil(h * 60 - 1e-9) / 60;
const floorMin = (h: number) => Math.floor(h * 60 + 1e-9) / 60;

export function asarAltitude(lat: number, dec: number, factor: number = 1): number {
  return Math.atan(1 / (factor + Math.tan(Math.abs(lat - dec) * D2R))) * R2D;
}

export function computePrayerTimes(
  date: Date,
  lat: number,
  lon: number,
  tz: number,
  elevation: number = 0,
  methodId: string = 'kemenag'
): PrayerSchedule {
  const method = PRAYER_METHODS[methodId] ?? PRAYER_METHODS.kemenag;
  const p = localParts(date, tz);
  const base = Date.UTC(p.y, p.m, p.d) - tz * 3600000; // tengah malam lokal
  const sunAt = (localHours: number) => solarPosition(new Date(base + localHours * 3600000));
  const stateAt = (localHours: number) => sunState(new Date(base + localHours * 3600000), lat, lon);
  const transitFrom = (eot: number) => 12 - eot / 60 + (tz * 15 - lon) / 15;

  // Transit (iterasi presisi tinggi hingga sudut waktu t = H = 0° tepat pada kulminasi)
  let transit = transitFrom(sunAt(12).eot);
  for (let i = 0; i < 6; i++) {
    const st = stateAt(transit);
    transit -= st.hourAngle / 15;
  }
  const solNoon = stateAt(transit);

  /** Waktu saat matahari mencapai tinggi tertentu; side -1 = pagi, +1 = sore. */
  const eventTime = (
    alt: number | ((dec: number) => number),
    side: -1 | 1,
    useDip: boolean = false
  ): number => {
    let t = transit + side * 6;
    for (let i = 0; i < 6; i++) {
      const st = stateAt(t);
      const h = typeof alt === 'function' ? alt(st.dec) : alt;
      const ha = hourAngleForAltitude(h, lat, st.dec, elevation, useDip);
      if (isNaN(ha)) return NaN;
      const targetHA = side * ha;
      t += (targetHA - st.hourAngle) / 15;
    }
    return t;
  };

  const ihtiyatMin = method.ihtiyatMinutes ?? IHTIYAT_MINUTES;
  const IH = ihtiyatMin / 60;
  const asrFactor = method.asrFactor ?? 1;
  const asarAlt = asarAltitude(lat, solNoon.dec, asrFactor);
  const useDip = !!method.useDipCorrection;

  const isMuhammadiyah = method.id === 'muhammadiyah';
  const imsakAlt = isMuhammadiyah ? -20 : -22;
  const subuhAlt = isMuhammadiyah ? -18 : -20;

  // Waktu hisab murni (raw) tepat pada standar ketinggian matahari:
  // Muhammadiyah  -> Imsak: -20°, Subuh: -18°
  // Kemenag & NU  -> Imsak: -22°, Subuh: -20°
  // Terbit/Magrib: -1°, Isya: -18°, Dhuha: +4.5°, Zuhur: H = 0° (kulminasi), Ashar: asarAlt (Syafi'i)
  const imsakRaw = eventTime(imsakAlt, -1, false);
  const subuhRaw = eventTime(subuhAlt, -1, false);
  const terbitRaw = eventTime(-1, -1, false);
  const dhuhaRaw = eventTime(4.5, -1, false);
  const asharRaw = eventTime(asarAlt, 1, false);
  const maghribRaw = eventTime(-1, 1, false);
  const isyaRaw = eventTime(-18, 1, false);

  const roundMin = (h: number) => Math.round(h * 60) / 60;

  let subuh: number;
  let terbit: number;
  let dhuha: number;
  let dzuhur: number;
  let ashar: number;
  let maghrib: number;
  let isya: number;
  let terbenam: number;

  if (method.id === 'lfnu') {
    // Standar Resmi Lembaga Falakiyah NU (LF PBNU):
    subuh = roundMin(subuhRaw);
    terbit = roundMin(terbitRaw);
    dhuha = roundMin(dhuhaRaw);
    dzuhur = roundMin(transit + 1.0 / 60); // 1.0 menit zawal clearance
    ashar = roundMin(asharRaw);
    terbenam = roundMin(maghribRaw);
    maghrib = roundMin(maghribRaw);
    isya = roundMin(isyaRaw);
  } else if (method.id === 'muhammadiyah') {
    // Standar Resmi Majelis Tarjih PP Muhammadiyah (KHGT):
    // 1. Cek sinkronisasi data resmi KHGT API
    const khgt = getCachedKhgtDay(date, lat, lon);
    const tSubuh = khgt ? parseTimeToHours(khgt.subuh) : null;
    const tDzuhur = khgt ? parseTimeToHours(khgt.dzuhur) : null;
    const tAshar = khgt ? parseTimeToHours(khgt.ashar) : null;
    const tMaghrib = khgt ? parseTimeToHours(khgt.maghrib) : null;
    const tIsya = khgt ? parseTimeToHours(khgt.isya) : null;
    const tTerbit = khgt ? parseTimeToHours(khgt.terbit) : null;
    const tDhuha = khgt ? parseTimeToHours(khgt.dhuha) : null;

    if (khgt && tSubuh !== null && tDzuhur !== null && tAshar !== null && tMaghrib !== null && tIsya !== null) {
      subuh = tSubuh;
      terbit = tTerbit ?? floorMin(terbitRaw);
      dhuha = tDhuha ?? ceilMin(dhuhaRaw + 2 / 60);
      dzuhur = tDzuhur;
      ashar = tAshar;
      terbenam = tMaghrib;
      maghrib = tMaghrib;
      isya = tIsya;
    } else {
      // Fallback hisab astronomis Muhammadiyah:
      const subuhMuhRaw = eventTime(-18, -1, useDip);
      subuh = ceilMin(subuhMuhRaw + 2 / 60);
      terbit = floorMin(terbitRaw);
      dhuha = ceilMin(dhuhaRaw + 2 / 60);
      dzuhur = ceilMin(transit + 1.5 / 60);
      ashar = ceilMin(asharRaw + 2 / 60);
      terbenam = ceilMin(maghribRaw + 2 / 60);
      maghrib = ceilMin(maghribRaw + 2 / 60);
      isya = ceilMin(isyaRaw + 2 / 60);
    }
  } else {
    // Kemenag RI: Ihtiyat +2m, pembulatan ke menit berikutnya (ceil)
    subuh = ceilMin(subuhRaw + IH);
    terbit = floorMin(terbitRaw - IH);
    dhuha = ceilMin(dhuhaRaw + IH);
    const zawalOffset = (method.zawalOffsetMinutes ?? 2.0) / 60;
    dzuhur = ceilMin(transit + zawalOffset);
    ashar = ceilMin(asharRaw + IH);
    terbenam = floorMin(maghribRaw - IH);
    maghrib = ceilMin(maghribRaw + IH);
    isya = ceilMin(isyaRaw + IH);
  }

  const asarFormatted = asarAlt.toFixed(2).replace('.', ',');

  const entries: PrayerEntry[] = [
    { key: 'imsak', name: 'Imsak', arabic: 'الإمساك', time: subuh - 10 / 60, raw: imsakRaw, criteria: isMuhammadiyah ? 'h = −20°' : 'h = −22°' },
    { key: 'subuh', name: 'Subuh', arabic: 'الصبح', time: subuh, raw: subuhRaw, criteria: isMuhammadiyah ? 'h = −18°' : 'h = −20°' },
    { key: 'terbit', name: 'Terbit', arabic: 'الشروق', time: terbit, raw: terbitRaw, criteria: 'h = −1°' },
    { key: 'dhuha', name: 'Dhuha', arabic: 'الضحى', time: dhuha, raw: dhuhaRaw, criteria: 'h = +4,5°' },
    { key: 'dzuhur', name: 'Dzuhur', arabic: 'الظهر', time: dzuhur, raw: transit, criteria: 'H = 0° (kulminasi)' },
    { key: 'ashar', name: 'Ashar', arabic: 'العصر', time: ashar, raw: asharRaw, criteria: `Panjang bayangan (Syafi'i)/${asarFormatted}°` },
    { key: 'terbenam', name: 'Terbenam', arabic: 'الغروب', time: terbenam, raw: maghribRaw, criteria: 'h = −1°' },
    { key: 'maghrib', name: 'Maghrib', arabic: 'المغرب', time: maghrib, raw: maghribRaw, criteria: 'h = −1°' },
    { key: 'isya', name: 'Isya', arabic: 'العشاء', time: isya, raw: isyaRaw, criteria: 'h = −18°' },
  ];

  return { entries, transit, dec: solNoon.dec, eot: solNoon.eot, asarAltitude: asarAlt };
}
