export function toDMS(deg: number, withPlus = false): string {
  if (!isFinite(deg)) return '—';
  const sign = deg < 0 ? '-' : withPlus ? '+' : '';
  let total = Math.round(Math.abs(deg) * 36000) / 10; // detik busur, 1 desimal
  const d = Math.floor(total / 3600);
  total -= d * 3600;
  const m = Math.floor(total / 60);
  const s = total - m * 60;
  return `${sign}${d}° ${m}' ${s.toFixed(1)}"`;
}

function dm(deg: number): string {
  let d = Math.floor(deg);
  let m = Math.round((deg - d) * 60);
  if (m === 60) {
    d += 1;
    m = 0;
  }
  return `${d}° ${m}'`;
}

export const latLabel = (lat: number) => `${dm(Math.abs(lat))} ${lat < 0 ? 'LS' : 'LU'}`;
export const lonLabel = (lon: number) => `${dm(Math.abs(lon))} ${lon < 0 ? 'BB' : 'BT'}`;

export const signed = (v: number, digits = 2) =>
  isFinite(v) ? `${v >= 0 ? '+' : ''}${v.toFixed(digits)}` : '—';

const COMPASS = ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'];
export const compassName = (az: number) => COMPASS[Math.round((((az % 360) + 360) % 360) / 45) % 8];

/** Arah relatif terhadap garis Timur–Barat, gaya buku falak (mis. "25.15° B→U"). */
export function relativeDirection(az: number): string {
  const a = ((az % 360) + 360) % 360;
  if (a >= 270) return `${(a - 270).toFixed(2)}° B→U`;
  if (a >= 180) return `${(270 - a).toFixed(2)}° B→S`;
  if (a >= 90) return `${(a - 90).toFixed(2)}° T→S`;
  return `${(90 - a).toFixed(2)}° T→U`;
}
