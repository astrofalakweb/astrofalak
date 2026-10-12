// Utilitas waktu berbasis zona waktu lokasi (bukan zona waktu browser).

export const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
export const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const pad = (n: number) => n.toString().padStart(2, '0');

export interface LocalParts {
  y: number;
  m: number; // 0-11
  d: number;
  weekday: number;
  h: number;
  min: number;
  s: number;
  /** jam desimal lokal */
  hours: number;
}

export function localParts(date: Date, tz: number): LocalParts {
  const t = new Date(date.getTime() + tz * 3600000);
  const h = t.getUTCHours();
  const min = t.getUTCMinutes();
  const s = t.getUTCSeconds();
  return {
    y: t.getUTCFullYear(),
    m: t.getUTCMonth(),
    d: t.getUTCDate(),
    weekday: t.getUTCDay(),
    h,
    min,
    s,
    hours: h + min / 60 + s / 3600,
  };
}

/** Bangun Date dari tanggal & jam desimal lokal pada zona waktu tz. */
export function fromLocal(y: number, m: number, d: number, hours: number, tz: number): Date {
  return new Date(Date.UTC(y, m, d) + (hours - tz) * 3600000);
}

export function fmtHMS(date: Date, tz: number): string {
  const p = localParts(date, tz);
  return `${pad(p.h)}:${pad(p.min)}:${pad(p.s)}`;
}

export function fmtHM(hours: number): string {
  if (!isFinite(hours)) return '--:--';
  let m = Math.round(hours * 60);
  m = ((m % 1440) + 1440) % 1440;
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
}

export function fmtHMSHours(hours: number): string {
  if (!isFinite(hours)) return '--:--:--';
  let s = Math.round(hours * 3600);
  s = ((s % 86400) + 86400) % 86400;
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

export function fmtDateLong(date: Date, tz: number): string {
  const p = localParts(date, tz);
  return `${HARI[p.weekday]}, ${p.d} ${BULAN[p.m]} ${p.y}`;
}

export function fmtDateShort(date: Date, tz: number): string {
  const p = localParts(date, tz);
  return `${HARI[p.weekday].slice(0, 3)}, ${p.d} ${BULAN[p.m].slice(0, 3)} ${p.y}`;
}

export function toISODate(date: Date, tz: number): string {
  const p = localParts(date, tz);
  return `${p.y}-${pad(p.m + 1)}-${pad(p.d)}`;
}

export function fmtDuration(hours: number): string {
  const total = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m} menit`;
  return `${h} jam ${m} menit`;
}

export function tzLabel(tz: number): string {
  if (tz === 7) return 'WIB';
  if (tz === 8) return 'WITA';
  if (tz === 9) return 'WIT';
  return `UTC${tz >= 0 ? '+' : ''}${tz}`;
}
