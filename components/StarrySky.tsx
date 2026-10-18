'use client';

import React from 'react';

// Koleksi data bintang statis dan deterministik (aman dari masalah hydration SSR Next.js)
const STARS = [
  { top: '4%', left: '12%', size: 2, color: '#ffffff', anim: 'animate-twinkle-fast', opacity: 0.9 },
  { top: '7%', left: '45%', size: 1.5, color: '#67e8f9', anim: 'animate-twinkle-mid', opacity: 0.8 },
  { top: '11%', left: '78%', size: 2.5, color: '#fde68a', anim: 'animate-twinkle-slow', opacity: 0.95 },
  { top: '14%', left: '24%', size: 1, color: '#ffffff', anim: '', opacity: 0.5 },
  { top: '18%', left: '88%', size: 1.5, color: '#93c5fd', anim: 'animate-twinkle-mid', opacity: 0.75 },
  { top: '22%', left: '6%', size: 1, color: '#ffffff', anim: '', opacity: 0.4 },
  { top: '25%', left: '62%', size: 2, color: '#38bdf8', anim: 'animate-twinkle-fast', opacity: 0.85 },
  { top: '28%', left: '38%', size: 1.5, color: '#ffffff', anim: 'animate-twinkle-slow', opacity: 0.7 },
  { top: '32%', left: '92%', size: 1, color: '#ffffff', anim: '', opacity: 0.6 },
  { top: '36%', left: '18%', size: 2, color: '#fde68a', anim: 'animate-twinkle-mid', opacity: 0.8 },
  { top: '39%', left: '74%', size: 1, color: '#ffffff', anim: '', opacity: 0.5 },
  { top: '43%', left: '52%', size: 1.5, color: '#67e8f9', anim: 'animate-twinkle-fast', opacity: 0.75 },
  { top: '47%', left: '84%', size: 2.5, color: '#ffffff', anim: 'animate-twinkle-slow', opacity: 0.9 },
  { top: '51%', left: '28%', size: 1, color: '#93c5fd', anim: '', opacity: 0.5 },
  { top: '54%', left: '68%', size: 1.5, color: '#ffffff', anim: 'animate-twinkle-mid', opacity: 0.8 },
  { top: '58%', left: '10%', size: 2, color: '#38bdf8', anim: 'animate-twinkle-slow', opacity: 0.7 },
  { top: '62%', left: '42%', size: 1, color: '#ffffff', anim: '', opacity: 0.4 },
  { top: '66%', left: '86%', size: 1.5, color: '#fde68a', anim: 'animate-twinkle-fast', opacity: 0.85 },
  { top: '70%', left: '22%', size: 2, color: '#ffffff', anim: 'animate-twinkle-mid', opacity: 0.8 },
  { top: '74%', left: '60%', size: 1, color: '#67e8f9', anim: '', opacity: 0.6 },
  { top: '78%', left: '94%', size: 1.5, color: '#ffffff', anim: 'animate-twinkle-slow', opacity: 0.75 },
  { top: '82%', left: '34%', size: 2.5, color: '#93c5fd', anim: 'animate-twinkle-fast', opacity: 0.9 },
  { top: '86%', left: '76%', size: 1, color: '#ffffff', anim: '', opacity: 0.5 },
  { top: '90%', left: '14%', size: 1.5, color: '#ffffff', anim: 'animate-twinkle-mid', opacity: 0.7 },
  { top: '94%', left: '50%', size: 2, color: '#38bdf8', anim: 'animate-twinkle-slow', opacity: 0.85 },
  { top: '97%', left: '82%', size: 1, color: '#fde68a', anim: '', opacity: 0.6 },
  // Bintang mikro tambahan untuk kedalaman kosmik
  { top: '5%', left: '65%', size: 1, color: '#ffffff', anim: '', opacity: 0.35 },
  { top: '8%', left: '30%', size: 1, color: '#93c5fd', anim: 'animate-twinkle-fast', opacity: 0.45 },
  { top: '15%', left: '55%', size: 1, color: '#ffffff', anim: '', opacity: 0.3 },
  { top: '23%', left: '80%', size: 1, color: '#67e8f9', anim: '', opacity: 0.5 },
  { top: '35%', left: '3%', size: 1, color: '#ffffff', anim: 'animate-twinkle-mid', opacity: 0.4 },
  { top: '48%', left: '39%', size: 1, color: '#ffffff', anim: '', opacity: 0.35 },
  { top: '65%', left: '15%', size: 1, color: '#fde68a', anim: 'animate-twinkle-slow', opacity: 0.5 },
  { top: '72%', left: '72%', size: 1, color: '#ffffff', anim: '', opacity: 0.4 },
  { top: '85%', left: '46%', size: 1, color: '#38bdf8', anim: 'animate-twinkle-fast', opacity: 0.55 },
  { top: '92%', left: '26%', size: 1, color: '#ffffff', anim: '', opacity: 0.3 },
];

// Bintang terang dengan kilau 4-sudut (diffraction sparkle)
const SPARKLING_STARS = [
  { top: '12%', left: '82%', color: '#38bdf8', size: 18, anim: 'animate-twinkle-slow' },
  { top: '26%', left: '16%', color: '#67e8f9', size: 14, anim: 'animate-twinkle-mid' },
  { top: '68%', left: '78%', color: '#facc15', size: 16, anim: 'animate-twinkle-slow' },
  { top: '84%', left: '20%', color: '#a78bfa', size: 14, anim: 'animate-twinkle-fast' },
];

export function StarrySky() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none" aria-hidden="true">
      {/* 1. Latar Belakang Gradien Langit Malam Dalam (Deep Cosmic Atmosphere) */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-[#02050f] via-[#060b1e] to-[#040816]"
      />

      {/* 2. Awan Nebula & Debu Galaksi (Ethereal Cosmic Nebula Clouds) */}
      {/* Nebula Ungu / Indigo di Kanan Atas */}
      <div 
        className="absolute -top-[10%] -right-[10%] h-[550px] w-[550px] rounded-full blur-[110px] opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.45) 0%, rgba(99, 102, 241, 0.25) 45%, transparent 70%)',
        }}
      />

      {/* Nebula Falak Sian / Toska di Kiri Tengah */}
      <div 
        className="absolute top-[25%] -left-[15%] h-[600px] w-[600px] rounded-full blur-[120px] opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.4) 0%, rgba(6, 182, 212, 0.25) 40%, transparent 70%)',
        }}
      />

      {/* Cahaya Biru Kosmik di Tengah Bawah */}
      <div 
        className="absolute bottom-[-10%] left-[20%] h-[500px] w-[600px] rounded-full blur-[130px] opacity-20"
        style={{
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(30, 58, 138, 0.2) 50%, transparent 75%)',
        }}
      />

      {/* Jalur Galaksi Bima Sakti / Milky Way Haze lembut melintang */}
      <div 
        className="absolute inset-0 opacity-[0.07] mix-blend-screen"
        style={{
          background: 'linear-gradient(135deg, transparent 15%, rgba(147, 197, 253, 0.2) 35%, rgba(192, 132, 252, 0.25) 50%, rgba(45, 212, 191, 0.15) 65%, transparent 85%)',
        }}
      />

      {/* 3. Bintang-Bintang Langit (Starfield) */}
      {STARS.map((s, idx) => (
        <div
          key={idx}
          className={`absolute rounded-full transition-opacity ${s.anim}`}
          style={{
            top: s.top,
            left: s.left,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: s.color,
            opacity: s.opacity,
            boxShadow: s.size >= 2 ? `0 0 ${s.size * 2}px ${s.color}` : 'none',
          }}
        />
      ))}

      {/* 4. Bintang Terang dengan Kilau Berlian (Sparkling Cross Stars) */}
      {SPARKLING_STARS.map((star, idx) => (
        <div
          key={`sparkle-${idx}`}
          className={`absolute flex items-center justify-center -translate-x-1/2 -translate-y-1/2 ${star.anim}`}
          style={{
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
          }}
        >
          {/* Pusat Bintang */}
          <div 
            className="h-1.5 w-1.5 rounded-full shadow-[0_0_10px_currentColor]"
            style={{ backgroundColor: star.color, color: star.color }}
          />
          {/* Garis Kilau Vertikal & Horizontal */}
          <div 
            className="absolute h-full w-[1px] opacity-60"
            style={{ background: `linear-gradient(to bottom, transparent, ${star.color}, transparent)` }}
          />
          <div 
            className="absolute w-full h-[1px] opacity-60"
            style={{ background: `linear-gradient(to right, transparent, ${star.color}, transparent)` }}
          />
        </div>
      ))}

      {/* 5. Meteor / Bintang Jatuh yang Meluncur Anggun */}
      <div className="absolute top-[8%] right-[12%]">
        <div 
          className="animate-meteor-1 h-[1.5px] w-[110px] rounded-full"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(56, 189, 248, 0.4), #ffffff)',
            boxShadow: '0 0 10px #38bdf8',
          }}
        />
      </div>

      <div className="absolute top-[28%] right-[32%]">
        <div 
          className="animate-meteor-2 h-[1px] w-[80px] rounded-full"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(168, 85, 247, 0.4), #ffffff)',
            boxShadow: '0 0 8px #a855f7',
          }}
        />
      </div>
    </div>
  );
}
