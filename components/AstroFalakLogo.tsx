/* eslint-disable @next/next/no-img-element */
'use client';

export interface AstroFalakLogoProps {
  size?: number;
  variant?: 'emblem' | 'lockup' | 'compass';
  angle?: number;
  className?: string;
  showTicks?: boolean;
}

export function AstroFalakLogo({
  size = 48,
  variant = 'emblem',
  angle = 294.7,
  className = '',
  showTicks = true,
}: AstroFalakLogoProps) {
  // 1. Logo Kunci Lengkap (Emblem Bola Langit Organik + Teks ASTROFALAK yang Mengalir Lembut)
  if (variant === 'lockup') {
    return (
      <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
        {/* Pendaran Cahaya Kosmik Halus */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 rounded-full bg-gradient-to-tr from-cyan-500/20 via-sky-400/15 to-amber-400/15 blur-2xl pointer-events-none opacity-80" />

        {/* Lingkaran Emblem Bola Langit yang Lembut (Tanpa Sudut Kaku) */}
        <div
          className="relative rounded-full p-2 flex items-center justify-center shadow-[0_0_35px_rgba(56,189,248,0.2)] transition-transform duration-500 hover:scale-105"
          style={{ width: size, height: size }}
        >
          <div className="absolute inset-0 rounded-full border border-cyan-400/30 opacity-70" />
          <div className="absolute -inset-1 rounded-full border border-amber-400/15 opacity-50" />
          
          <img
            src="/logo-emblem.png"
            alt="AstroFalak Official Emblem"
            width={size}
            height={size}
            className="h-full w-full rounded-full object-cover [mask-image:radial-gradient(circle_at_center,black_64%,transparent_98%)] select-none pointer-events-none drop-shadow-md"
          />

          {/* Manik-manik Bintang Berpendar di Tepian Orbit */}
          <span className="absolute top-1 right-2.5 h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#38bdf8] animate-pulse" />
          <span className="absolute bottom-1.5 left-2 h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_6px_#fbbf24]" />
        </div>

        {/* Tipografi ASTROFALAK yang Nyaman di Mata */}
        <div className="mt-2.5 flex items-center tracking-[0.22em] font-black leading-none text-2xl sm:text-3xl">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 via-cyan-200 to-teal-200 drop-shadow-[0_2px_12px_rgba(56,189,248,0.35)]">
            ASTRO
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 drop-shadow-[0_2px_12px_rgba(245,158,11,0.35)]">
            FALAK
          </span>
        </div>
      </div>
    );
  }

  // 2. Emblem Bulat Bola Langit Astrolabe (Organik, Halus, Tepian Lembut)
  if (variant === 'emblem') {
    return (
      <div
        className={`relative inline-flex items-center justify-center select-none shrink-0 rounded-full border border-cyan-500/30 bg-slate-950/60 shadow-[0_0_15px_rgba(56,189,248,0.2)] overflow-hidden transition-transform hover:scale-105 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src="/logo-emblem.png"
          alt="AstroFalak Emblem"
          width={size}
          height={size}
          className="h-full w-full rounded-full object-cover [mask-image:radial-gradient(circle_at_center,black_65%,transparent_98%)] select-none pointer-events-none"
        />
      </div>
    );
  }

  // 3. Dial Kompas Kiblat (Digunakan pada Widget & Kompas Interaktif)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-lg select-none ${className}`}
    >
      <defs>
        {/* Latar Belakang Kompas Gelap Mewah */}
        <radialGradient id="afDialBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#101927" />
          <stop offset="70%" stopColor="#0b121e" />
          <stop offset="100%" stopColor="#040810" />
        </radialGradient>

        {/* Pendar Cahaya Hijau/Teal Kiblat */}
        <filter id="afTealGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#2dd4bf" floodOpacity="0.7" />
        </filter>
        
        {/* Gradien Batang Jarum Penunjuk */}
        <linearGradient id="afArmGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#0d9488" />
          <stop offset="100%" stopColor="#34d399" />
        </linearGradient>
      </defs>

      {/* Piringan Kompas Utama */}
      <circle cx="50" cy="50" r="48" fill="url(#afDialBg)" stroke="#1e293b" strokeWidth="2" />
      <circle cx="50" cy="50" r="45" fill="none" stroke="#0f172a" strokeWidth="1" />

      {/* Tik-tik Derajat Sekeliling Piringan Kompas */}
      {showTicks &&
        Array.from({ length: 36 }).map((_, i) => {
          const deg = i * 10;
          if (deg === 0) return null; // Tik 0° digambar khusus dengan garis putih tegas
          const isCardinal = deg % 90 === 0;
          const isMajor = deg % 30 === 0;
          return (
            <line
              key={deg}
              x1="50"
              y1={isCardinal ? '5' : isMajor ? '7' : '8.5'}
              x2="50"
              y2="11.5"
              stroke={isCardinal ? '#94a3b8' : isMajor ? '#475569' : '#334155'}
              strokeWidth={isCardinal ? 1.6 : 1}
              transform={`rotate(${deg}, 50, 50)`}
            />
          );
        })}

      {/* Garis Tik Putih Tegas Arah Utara Sejati (0°) */}
      <line x1="50" y1="3.5" x2="50" y2="12.5" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />

      {/* Huruf Mata Angin: U (Merah Tebal), T, S, B (Slate Terang) */}
      <text
        x="50"
        y="21"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="900"
        fill="#f43f5e"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        U
      </text>
      <text
        x="84"
        y="52.5"
        textAnchor="middle"
        fontSize="6.5"
        fontWeight="700"
        fill="#cbd5e1"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        T
      </text>
      <text
        x="50"
        y="86.5"
        textAnchor="middle"
        fontSize="6.5"
        fontWeight="700"
        fill="#94a3b8"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        S
      </text>
      <text
        x="16"
        y="52.5"
        textAnchor="middle"
        fontSize="6.5"
        fontWeight="700"
        fill="#cbd5e1"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        B
      </text>

      {/* Jarum Penunjuk + Ikon Ka'bah (Dirotasi Sesuai Arah Azimuth Kiblat) */}
      <g transform={`rotate(${angle}, 50, 50)`}>
        {/* Batang Jarum Menuju Ka'bah */}
        <line
          x1="50"
          y1="50"
          x2="50"
          y2="21"
          stroke="url(#afArmGrad)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Lingkaran Penampung Ka'bah dengan Bezel Neon Teal */}
        <circle
          cx="50"
          cy="20"
          r="9.5"
          fill="#0a0f18"
          stroke="#2dd4bf"
          strokeWidth="1.8"
          filter="url(#afTealGlow)"
        />

        {/* Ikon Ka'bah 3D Isometrik dengan Sabuk Emas Kiswah & Pintu */}
        <g transform="translate(50, 20) scale(0.68)">
          {/* Atap Ka'bah (Bidang Belah Ketupat Abu-abu Gelap) */}
          <polygon points="0,-7 7,-3.5 0,0 -7,-3.5" fill="#27272a" stroke="#3f3f46" strokeWidth="0.5" />

          {/* Sisi Kanan Ka'bah (Hitam dengan Sabuk Emas & Pintu Emas) */}
          <polygon points="0,0 7,-3.5 7,6.5 0,10" fill="#09090b" />
          {/* Sabuk Emas Kiswah Sisi Kanan */}
          <polygon points="0,2.2 7,-1.3 7,0.3 0,3.8" fill="#fbbf24" />
          {/* Pintu Ka'bah Emas */}
          <polygon points="2,3.5 5,2 5,7.5 2,9" fill="#f59e0b" />

          {/* Sisi Kiri Ka'bah (Hitam Sedikit Terang dengan Sabuk Emas) */}
          <polygon points="-7,-3.5 0,0 0,10 -7,6.5" fill="#18181b" />
          {/* Sabuk Emas Kiswah Sisi Kiri */}
          <polygon points="-7,-1.3 0,2.2 0,3.8 -7,0.3" fill="#fbbf24" />
        </g>
      </g>

      {/* Titik Poros Tengah Putih Bersih (Sesuai Screenshot User) */}
      <circle cx="50" cy="50" r="4.8" fill="#f8fafc" stroke="#0f172a" strokeWidth="1.4" />
    </svg>
  );
}
