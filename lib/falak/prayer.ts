// =============================================================
// Hisab Waktu Salat — Algoritma Falak Hakiki Tahkiki Presisi Tinggi
// Default: Standar Ephemeris Kementerian Agama Republik Indonesia (Kemenag RI / MABIMS)
//   Subuh   : h = −20°
//   Terbit  : h = −1°   (dikurangi ihtiyat untuk kehati-hatian akhir subuh)
//   Dhuha   : h = +4.5°
//   Dzuhur  : transit (kulminasi) matahari + zawal clearance + ihtiyat
//   Ashar   : cot h = factor + tan|φ − δ| (Syafi'i factor=1, Hanafi factor=2)
//   Maghrib : h = −1°
//   Isya    : h = −18°
//   Imsak   : Subuh − 10 menit
//   Ihtiyat : +2 menit, pembulatan ke atas (ceil) ke menit berikutnya
// =============================================================
import { D2R, R2D, hourAngleForAltitude, solarPosition } from './math';
import { localParts } from './time';
import { getCachedKhgtDay, parseTimeToHours } from './khgtApi';

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

export interface PrayerMethodConfig {
  id: string;
  name: string;
  desc: string;
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
    name: 'Kemenag RI / MABIMS (Resmi)',
    desc: 'Subuh: 20° · Isya: 18° · Asr: Syafi\'i · Ihtiyat: +2m · Standar Resmi Kemenag',
    fajrAngle: -20,
    ishaAngle: -18,
    maghribAngle: -1,
    terbitAngle: -1,
    dhuhaAngle: 4.5,
    asrFactor: 1,
    ihtiyatMinutes: 2,
    zawalOffsetMinutes: 2.8,
    useDipCorrection: false,
  },
  lfnu: {
    id: 'lfnu',
    name: 'Lembaga Falakiyah NU (LF PBNU)',
    desc: 'Standar Resmi LF PBNU · Subuh: 20° · Isya: 18° · Dip Elevasi Ufuk Mar\'i · Hisab Murni Akurat (Tanpa Kelebihan Ihtiyat)',
    fajrAngle: -20,
    ishaAngle: -18,
    maghribAngle: -0.833333,
    terbitAngle: -0.833333,
    dhuhaAngle: 4.5,
    asrFactor: 1,
    ihtiyatMinutes: 0,
    zawalOffsetMinutes: 1.0,
    useDipCorrection: true,
  },
  muhammadiyah: {
    id: 'muhammadiyah',
    name: 'Muhammadiyah (Majelis Tarjih)',
    desc: 'Standar Resmi Majelis Tarjih (KHGT) · Subuh: 18° · Isya: 18° · Presisi Tinggi',
    fajrAngle: -18,
    ishaAngle: -18,
    maghribAngle: -0.833333,
    terbitAngle: -0.833333,
    dhuhaAngle: 4.5,
    asrFactor: 1,
    ihtiyatMinutes: 2,
    zawalOffsetMinutes: 1.5,
    useDipCorrection: true,
  },
  falak_abi: {
    id: 'falak_abi',
    name: 'Falak Abi',
    desc: 'Subuh: 17.7° · Isya: 17.7° · Asr: Syafi\'i · Ihtiyat: 0m · Maghrib: −4.5°',
    fajrAngle: -17.7,
    ishaAngle: -17.7,
    maghribAngle: -4.5,
    terbitAngle: -1,
    dhuhaAngle: 4.5,
    asrFactor: 1,
    ihtiyatMinutes: 0,
    zawalOffsetMinutes: 1.0,
    useDipCorrection: false,
  },
  mwl: {
    id: 'mwl',
    name: 'Muslim World League (MWL)',
    desc: 'Subuh: 18° · Isya: 17° · Asr: Syafi\'i · Ihtiyat: +2m',
    fajrAngle: -18,
    ishaAngle: -17,
    maghribAngle: -0.833333,
    terbitAngle: -0.833333,
    dhuhaAngle: 4.5,
    asrFactor: 1,
    ihtiyatMinutes: 2,
    zawalOffsetMinutes: 2.0,
    useDipCorrection: true,
  },
  isna: {
    id: 'isna',
    name: 'ISNA (North America)',
    desc: 'Subuh: 15° · Isya: 15° · Asr: Syafi\'i · Ihtiyat: +2m',
    fajrAngle: -15,
    ishaAngle: -15,
    maghribAngle: -0.833333,
    terbitAngle: -0.833333,
    dhuhaAngle: 4.5,
    asrFactor: 1,
    ihtiyatMinutes: 2,
    zawalOffsetMinutes: 2.0,
    useDipCorrection: true,
  },
  egypt: {
    id: 'egypt',
    name: 'Egyptian General Authority (ESA)',
    desc: 'Subuh: 19.5° · Isya: 17.5° · Asr: Syafi\'i · Ihtiyat: +2m',
    fajrAngle: -19.5,
    ishaAngle: -17.5,
    maghribAngle: -0.833333,
    terbitAngle: -0.833333,
    dhuhaAngle: 4.5,
    asrFactor: 1,
    ihtiyatMinutes: 2,
    zawalOffsetMinutes: 2.0,
    useDipCorrection: true,
  },
  makkah: {
    id: 'makkah',
    name: 'Umm al-Qura University, Makkah',
    desc: 'Subuh: 18.5° · Isya: +90m pasca Maghrib · Asr: Syafi\'i · Ihtiyat: +2m',
    fajrAngle: -18.5,
    ishaIntervalMinutes: 90,
    maghribAngle: -0.833333,
    terbitAngle: -0.833333,
    dhuhaAngle: 4.5,
    asrFactor: 1,
    ihtiyatMinutes: 2,
    zawalOffsetMinutes: 2.0,
    useDipCorrection: true,
  },
  hanafi: {
    id: 'hanafi',
    name: 'Hanafi (Asr Factor 2)',
    desc: 'Subuh: 18° · Isya: 17° · Asr: Bayangan 2x · Ihtiyat: +2m',
    fajrAngle: -18,
    ishaAngle: -17,
    maghribAngle: -0.833333,
    terbitAngle: -0.833333,
    dhuhaAngle: 4.5,
    asrFactor: 2,
    ihtiyatMinutes: 2,
    zawalOffsetMinutes: 2.0,
    useDipCorrection: true,
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
  const transitFrom = (eot: number) => 12 - eot / 60 + (tz * 15 - lon) / 15;

  // Transit (iterasi 2x agar δ & EoT diambil tepat pada saat transit)
  let transit = transitFrom(sunAt(12).eot);
  transit = transitFrom(sunAt(transit).eot);
  const solNoon = sunAt(transit);

  /** Waktu saat matahari mencapai tinggi tertentu; side -1 = pagi, +1 = sore. */
  const eventTime = (
    alt: number | ((dec: number) => number),
    side: -1 | 1,
    useDip: boolean = false
  ): number => {
    let t = transit + side * 6;
    for (let i = 0; i < 4; i++) {
      const s = sunAt(t);
      const h = typeof alt === 'function' ? alt(s.dec) : alt;
      const ha = hourAngleForAltitude(h, lat, s.dec, elevation, useDip);
      if (isNaN(ha)) return NaN;
      t = transitFrom(s.eot) + (side * ha) / 15;
    }
    return t;
  };

  const ihtiyatMin = method.ihtiyatMinutes ?? IHTIYAT_MINUTES;
  const IH = ihtiyatMin / 60;
  const asrFactor = method.asrFactor ?? 1;
  const asarAlt = asarAltitude(lat, solNoon.dec, asrFactor);
  const useDip = !!method.useDipCorrection;

  const subuhRaw = eventTime(method.fajrAngle, -1, false);
  const terbitAngle = method.terbitAngle ?? -1;
  const terbitRaw = eventTime(terbitAngle, -1, useDip);
  const dhuhaAngle = method.dhuhaAngle ?? 4.5;
  const dhuhaRaw = eventTime(dhuhaAngle, -1, false);
  const asharRaw = eventTime((dec) => asarAltitude(lat, dec, asrFactor), 1, false);
  const maghribAngle = method.maghribAngle ?? -1;
  const maghribRaw = eventTime(maghribAngle, 1, useDip);

  let isyaRaw: number;
  if (method.ishaIntervalMinutes) {
    isyaRaw = maghribRaw + method.ishaIntervalMinutes / 60;
  } else {
    isyaRaw = eventTime(method.ishaAngle ?? -18, 1, false);
  }

  const roundMin = (h: number) => Math.round(h * 60) / 60;

  let subuh: number;
  let terbit: number;
  let dhuha: number;
  let dzuhur: number;
  let ashar: number;
  let maghrib: number;
  let isya: number;
  let terbenam: number;
  let isFromKhgt = false;

  if (method.id === 'lfnu') {
    // Standar Resmi Lembaga Falakiyah NU (LF PBNU):
    // Subuh = -20°, Isya = -18°, Maghrib & Terbit dengan koreksi Dip Elevasi Ufuk Mar'i.
    // Hisab hakiki tahkiki murni tanpa penambahan menit ekstra kaku (+2m) agar tidak ada kelebihan/kekurangan waktu.
    // Waktu dibulatkan secara presisi ke menit terdekat (roundMin).
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
      isFromKhgt = true;
      subuh = tSubuh;
      terbit = tTerbit ?? floorMin(terbitRaw);
      dhuha = tDhuha ?? (terbit + 27 / 60);
      dzuhur = tDzuhur;
      ashar = tAshar;
      terbenam = tMaghrib;
      maghrib = tMaghrib;
      isya = tIsya;
    } else {
      // Fallback hisab astronomis persis sesuai standar Munas Tarjih 31 / KHGT:
      subuh = ceilMin(subuhRaw + 2 / 60);
      terbit = floorMin(terbitRaw);
      dhuha = terbit + 27 / 60;
      dzuhur = ceilMin(transit + 1.5 / 60);
      ashar = ceilMin(asharRaw + 2 / 60);
      terbenam = ceilMin(maghribRaw + 2 / 60);
      maghrib = ceilMin(maghribRaw + 2 / 60);
      isya = ceilMin(isyaRaw + 2 / 60);
    }
  } else {
    // Kemenag RI & metode lainnya: Ihtiyat +2m, pembulatan ke menit berikutnya (ceil)
    subuh = ceilMin(subuhRaw + IH);
    terbit = method.id === 'kemenag' ? floorMin(terbitRaw - IH) : roundMin(terbitRaw);
    dhuha = ceilMin(dhuhaRaw + IH);
    const zawalOffset = (method.zawalOffsetMinutes ?? (ihtiyatMin > 0 ? 2.8 : 0)) / 60;
    dzuhur = ceilMin(transit + zawalOffset);
    ashar = ceilMin(asharRaw + IH);
    terbenam = floorMin(maghribRaw - IH);
    maghrib = ceilMin(maghribRaw + IH);
    isya = method.ishaIntervalMinutes
      ? ceilMin(maghrib + method.ishaIntervalMinutes / 60)
      : ceilMin(isyaRaw + IH);
  }

  const isMuhammadiyah = method.id === 'muhammadiyah';
  const isLfnu = method.id === 'lfnu';

  const entries: PrayerEntry[] = [
    { key: 'imsak', name: 'Imsak', arabic: 'الإمساك', time: subuh - 10 / 60, raw: subuhRaw - 10 / 60, criteria: 'Subuh − 10 mnt' },
    { key: 'subuh', name: 'Subuh', arabic: 'الصبح', time: subuh, raw: subuhRaw, criteria: isMuhammadiyah ? 'h = −18°' : isLfnu ? 'h = −20°' : `h = ${method.fajrAngle}°` },
    { key: 'terbit', name: 'Terbit', arabic: 'الشروق', time: terbit, raw: terbitRaw, criteria: isMuhammadiyah || isLfnu ? 'h = −0.83° − Dip' : `h = ${terbitAngle}°` },
    { key: 'dhuha', name: 'Dhuha', arabic: 'الضحى', time: dhuha, raw: dhuhaRaw, criteria: `h = +${dhuhaAngle}°` },
    { key: 'dzuhur', name: 'Dzuhur', arabic: 'الظهر', time: dzuhur, raw: transit, criteria: isLfnu ? 'Istiwa + 1m zawal' : 'Transit + Zawal' },
    { key: 'ashar', name: 'Ashar', arabic: 'العصر', time: ashar, raw: asharRaw, criteria: `h = ${asarAlt.toFixed(2)}° (faktor ${asrFactor})` },
    { key: 'terbenam', name: 'Terbenam', arabic: 'الغروب', time: terbenam, raw: maghribRaw, criteria: 'h = −0.83° − Dip' },
    { key: 'maghrib', name: 'Maghrib', arabic: 'المغرب', time: maghrib, raw: maghribRaw, criteria: isMuhammadiyah || isLfnu ? 'h = −0.83° − Dip' : `h = ${maghribAngle}°` },
    { key: 'isya', name: 'Isya', arabic: 'العشاء', time: isya, raw: isyaRaw, criteria: method.ishaIntervalMinutes ? `+${method.ishaIntervalMinutes}m pasca Maghrib` : `h = ${method.ishaAngle}°` },
  ];

  return { entries, transit, dec: solNoon.dec, eot: solNoon.eot, asarAltitude: asarAlt };
}
