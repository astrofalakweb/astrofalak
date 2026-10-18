'use client';

import { useMemo, useState } from 'react';
import { CalendarRange, Download, Printer } from 'lucide-react';
import { Modal } from './Modal';
import { useAppStore } from '../lib/store';
import { useRealtimeAstro } from '../lib/useAstro';
import { computePrayerTimes } from '../lib/falak/prayer';
import { BULAN, HARI, fmtHM, fromLocal, tzLabel } from '../lib/falak/time';

export function MonthlyScheduleModal() {
  const close = useAppStore((s) => s.closeModal);
  const { loc, local } = useRealtimeAstro(60000);
  const prayerMethod = useAppStore((s) => s.prayerMethod);
  const [ym, setYm] = useState(`${local.y}-${String(local.m + 1).padStart(2, '0')}`);
  const [y, m] = ym.split('-').map(Number);

  const rows = useMemo(() => {
    if (!y || !m) return [];
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return Array.from({ length: days }, (_, i) => {
      const d = i + 1;
      const date = fromLocal(y, m - 1, d, 12, loc.tz);
      const sch = computePrayerTimes(date, loc.lat, loc.lon, loc.tz, loc.elevation || 0, prayerMethod);
      return { d, weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay(), sch };
    });
  }, [y, m, loc.lat, loc.lon, loc.tz, loc.elevation, prayerMethod]);

  const headers = rows[0]?.sch.entries.map((e) => e.name) ?? [];

  const downloadCSV = () => {
    const lines = [
      `Jadwal Waktu Salat ${loc.name} (${loc.lat}, ${loc.lon}, ${tzLabel(loc.tz)}) - ${BULAN[m - 1]} ${y}`,
      ['Tanggal', 'Hari', ...headers].join(','),
      ...rows.map((r) => [r.d, HARI[r.weekday], ...r.sch.entries.map((e) => fmtHM(e.time))].join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `jadwal-salat-${loc.name.replace(/\W+/g, '-').toLowerCase()}-${ym}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const isToday = (d: number) => y === local.y && m - 1 === local.m && d === local.d;

  return (
    <Modal title="Jadwal Salat Bulanan" icon={<CalendarRange className="h-4 w-4 text-cyan-400" />} onClose={close} maxWidth="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 px-5 py-3">
        <div className="text-xs text-slate-400">
          <span className="font-semibold text-slate-200">{loc.name}</span> · φ {loc.lat.toFixed(4)}° · λ {loc.lon.toFixed(4)}° · {tzLabel(loc.tz)} · {prayerMethod === 'lfnu' ? 'LF PBNU' : prayerMethod === 'muhammadiyah' ? 'Muhammadiyah (Tarjih)' : 'Kemenag RI (+2m)'}
        </div>
        <div className="flex items-center gap-2">
          <input type="month" value={ym} onChange={(e) => e.target.value && setYm(e.target.value)}
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs [color-scheme:dark]" />
          <button onClick={downloadCSV} className="flex items-center gap-1.5 rounded-md border border-slate-700 px-2.5 py-1 text-xs hover:bg-slate-800">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 rounded-md border border-slate-700 px-2.5 py-1 text-xs hover:bg-slate-800">
            <Printer className="h-3.5 w-3.5" /> Cetak
          </button>
        </div>
      </div>
      <div className="p-4">
        <table className="w-full text-center text-xs">
          <thead className="sticky top-0 bg-slate-800 text-slate-300">
            <tr>
              <th className="px-2 py-2 text-left">Tgl</th>
              {headers.map((h) => <th key={h} className="px-2 py-2">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono">
            {rows.map((r) => (
              <tr key={r.d} className={isToday(r.d) ? 'bg-cyan-500/10 text-cyan-200' : r.weekday === 5 ? 'bg-emerald-500/5' : ''}>
                <td className="px-2 py-1.5 text-left font-sans">
                  <span className="font-semibold">{r.d}</span> <span className="text-slate-500">{HARI[r.weekday].slice(0, 3)}</span>
                </td>
                {r.sch.entries.map((e) => <td key={e.key} className="px-2 py-1.5">{fmtHM(e.time)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
