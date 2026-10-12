import './globals.css';
import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'AstroFalak-AR',
  description: 'Visualisasi Bola Langit & Hisab Falak Standar Kemenag RI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} ${mono.variable}`}>
      <body className="font-sans bg-black text-slate-100 overflow-hidden">
        {children}
      </body>
    </html>
  );
}
