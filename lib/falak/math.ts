// =============================================================
// AstroFalak-AR — Math Engine (Astronomi Bola / Hisab Falak)
// Algoritma posisi matahari berbasis Astronomical Almanac
// (ketelitian ~0.01° untuk tahun 1950–2050).
// =============================================================

export const D2R = Math.PI / 180;
export const R2D = 180 / Math.PI;
export const KAABA = { lat: 21.4225, lon: 39.8262 } as const;
export const EARTH_RADIUS_KM = 6371;

export const norm360 = (a: number) => ((a % 360) + 360) % 360;
export const norm180 = (a: number) => {
  const b = norm360(a);
  return b > 180 ? b - 360 : b;
};
export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

const sin = (d: number) => Math.sin(d * D2R);
const cos = (d: number) => Math.cos(d * D2R);
const tan = (d: number) => Math.tan(d * D2R);
const asin = (x: number) => Math.asin(clamp(x, -1, 1)) * R2D;
const acos = (x: number) => Math.acos(clamp(x, -1, 1)) * R2D;
const atan2 = (y: number, x: number) => Math.atan2(y, x) * R2D;

/** Julian Day dari objek Date (instan absolut / UTC). */
export function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

export interface SolarPosition {
  jd: number;
  /** Bujur ekliptika matahari (°) */
  eclipticLongitude: number;
  /** Kemiringan ekliptika ε (°) */
  obliquity: number;
  /** Asensio rekta α (°) */
  ra: number;
  /** Deklinasi δ (°) */
  dec: number;
  /** Perata waktu / Equation of Time (menit) */
  eot: number;
  /** Greenwich Mean Sidereal Time (°) */
  gmst: number;
  /** Jarak bumi–matahari (AU) */
  distanceAU: number;
  /** Semidiameter matahari (°) */
  semiDiameter: number;
}

export function solarPosition(date: Date): SolarPosition {
  const jd = julianDay(date);
  const n = jd - 2451545.0;
  const T = n / 36525.0; // Abad Julian dari J2000.0

  // Geometric Mean Longitude of the Sun (°)
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);

  // Mean Anomaly of the Sun (°)
  const g = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);

  // Eksentrisitas orbit bumi
  const eOrbit = 0.016708634 - 0.000042037 * T - 0.0000001267 * T * T;

  // Persamaan pusat matahari / Equation of the Center (°)
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(g)
          + (0.019993 - 0.000101 * T) * sin(2 * g)
          + 0.000289 * sin(3 * g);

  // Bujur sejati matahari / True Longitude (°)
  const sunTrueLon = L0 + C;

  // Koreksi nutasi dan aberasi untuk bujur tampak / Apparent Longitude (°)
  const omega = 125.04 - 1934.136 * T;
  const lambda = sunTrueLon - 0.00569 - 0.00478 * sin(omega);

  // Kemiringan ekliptika rata-rata / Mean Obliquity (°)
  const eps0 = 23 + (26 + (21.448 - 46.8150 * T - 0.00059 * T * T + 0.001813 * T * T * T) / 60) / 60;
  // Koreksi nutasi untuk kemiringan tampak (°)
  const e = eps0 + 0.00256 * cos(omega);

  // Asensio Rekta α (°) & Deklinasi δ (°)
  const ra = norm360(atan2(cos(e) * sin(lambda), cos(lambda)));
  const dec = asin(sin(e) * sin(lambda));

  // Perata Waktu / Equation of Time (menit) — Smart & Meeus formula
  const y = Math.tan((e / 2) * D2R) ** 2;
  const eotRad = y * Math.sin(2 * L0 * D2R)
               - 2 * eOrbit * Math.sin(g * D2R)
               + 4 * eOrbit * y * Math.sin(g * D2R) * Math.cos(2 * L0 * D2R)
               - 0.5 * y * y * Math.sin(4 * L0 * D2R)
               - 1.25 * eOrbit * eOrbit * Math.sin(2 * g * D2R);
  const eot = eotRad * 4 * R2D;

  // Greenwich Mean Sidereal Time (°)
  const gmst = norm360(280.46061837 + 360.98564736629 * n);

  // Jarak Bumi-Matahari (AU) & Semidiameter (°)
  const distanceAU = (1.000001018 * (1 - eOrbit * eOrbit)) / (1 + eOrbit * cos(g + C));
  const semiDiameter = 0.2666 / distanceAU;

  return { jd, eclipticLongitude: lambda, obliquity: e, ra, dec, eot, gmst, distanceAU, semiDiameter };
}

/** Konversi koordinat ekliptika (β = 0) ke ekuator. */
export function eclipticToEquatorial(lambda: number, obliquity: number) {
  return {
    ra: norm360(atan2(cos(obliquity) * sin(lambda), cos(lambda))),
    dec: asin(sin(obliquity) * sin(lambda)),
  };
}

/**
 * Konversi (sudut waktu t, deklinasi δ) → (tinggi h, azimuth Az) untuk lintang φ.
 * Azimuth diukur dari Utara searah jarum jam (U=0°, T=90°, S=180°, B=270°).
 */
export function equatorialToHorizontal(H: number, dec: number, lat: number) {
  const altitude = asin(sin(lat) * sin(dec) + cos(lat) * cos(dec) * cos(H));
  const y = -cos(dec) * sin(H);
  const x = sin(dec) * cos(lat) - cos(dec) * cos(H) * sin(lat);
  const azimuth = norm360(atan2(y, x));
  return { altitude, azimuth };
}

export interface SunState extends SolarPosition {
  /** Local Sidereal Time (°) */
  lst: number;
  /** Sudut waktu lokal t (°), negatif = timur/pagi */
  hourAngle: number;
  altitude: number;
  azimuth: number;
}

export function sunState(date: Date, lat: number, lon: number): SunState {
  const sol = solarPosition(date);
  const lst = norm360(sol.gmst + lon);
  const hourAngle = norm180(lst - sol.ra);
  const { altitude, azimuth } = equatorialToHorizontal(hourAngle, sol.dec, lat);
  return { ...sol, lst, hourAngle, altitude, azimuth };
}

/**
 * Sudut waktu (°) saat matahari mencapai tinggi h.
 * cos t = (sin h − sin φ sin δ) / (cos φ cos δ). NaN bila tidak pernah tercapai.
 */
export function hourAngleForAltitude(h: number, lat: number, dec: number, elevation: number = 0, applyDip: boolean = false): number {
  let trueH = h;
  if (applyDip && elevation > 0) {
    // Koreksi kerendahan ufuk (dip) karena elevasi tempat
    const dip = (1.76 / 60) * Math.sqrt(Math.max(0, elevation));
    trueH = h - dip;
  }
  
  const cosT = (sin(trueH) - sin(lat) * sin(dec)) / (cos(lat) * cos(dec));
  if (!isFinite(cosT) || cosT < -1 || cosT > 1) return NaN;
  return acos(cosT);
}

/** Azimuth kiblat (°) dari Utara searah jarum jam. */
export function qiblaAzimuth(lat: number, lon: number): number {
  const dLon = KAABA.lon - lon;
  const y = sin(dLon);
  const x = cos(lat) * tan(KAABA.lat) - sin(lat) * cos(dLon);
  return norm360(atan2(y, x));
}

/** Jarak lingkaran besar ke Ka'bah (km), rumus haversine. */
export function distanceToKaaba(lat: number, lon: number): number {
  const dLat = (KAABA.lat - lat) * D2R;
  const dLon = (KAABA.lon - lon) * D2R;
  const a = Math.sin(dLat / 2) ** 2 + cos(lat) * cos(KAABA.lat) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

export const trig = { sin, cos, tan, asin, acos, atan2 };
