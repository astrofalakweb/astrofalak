'use client';

import dynamic from 'next/dynamic';

// Dirender hanya di sisi klien: jam real-time & WebGL tidak boleh di-SSR
// (mencegah error hydration "Text content does not match server-rendered HTML").
const AppShell = dynamic(() => import('../components/AppShell'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-950 text-slate-400">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      <p className="text-sm">Memuat AstroFalak-AR…</p>
    </div>
  ),
});

export default function Home() {
  return <AppShell />;
}
