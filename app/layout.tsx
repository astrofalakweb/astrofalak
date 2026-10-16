import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
// Font khusus halaman Kuis — lebih bulat & ramah dibaca untuk soal panjang
const quiz = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-quiz', weight: ['400', '500', '600', '700', '800'] });

export const metadata: Metadata = {
  title: 'AstroFalak-AR — Bola Langit & Hisab Falak',
  description: 'Visualisasi Bola Langit 3D, waktu salat, arah kiblat & tata surya interaktif dengan hisab falak standar Kemenag RI.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#070e14',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} ${mono.variable} ${quiz.variable}`}>
      <body className="font-sans bg-black text-slate-100 overflow-hidden">
        {children}
      </body>
    </html>
  );
}
