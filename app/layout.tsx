import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kintara P/L Tracker — KINS Trading Analytics',
  description:
    'Professional KINS token P/L dashboard for Kintara marketplace traders. Scan any Solana wallet to calculate buy totals, sell totals, and net profit/loss.',
  openGraph: {
    title: 'Kintara P/L Tracker',
    description: 'Professional KINS trading analytics dashboard',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
