import './globals.css';

export const metadata = {
  title: 'Kintara P/L Tracker',
  description: 'Wallet analytics for Kintara KINS marketplace activity',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
