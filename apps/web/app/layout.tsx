import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'DoNotStay - Know Which Hotels to Avoid Before You Book',
  description:
    'AI analyzes hotel reviews and gives you a verdict: Stay, Questionable, or Do Not Stay. Stop parsing 500 reviews. Get instant clarity.',
  keywords: [
    'hotel reviews',
    'AI analysis',
    'Booking.com',
    'travel',
    'hotel checker',
    'avoid bad hotels',
  ],
  icons: {
    icon: '/logo-donotstay.png',
    apple: '/logo-donotstay.png',
  },
  openGraph: {
    title: 'DoNotStay - AI Hotel Review Analysis',
    description:
      'Get instant AI verdicts on hotels before you book. Works on Booking.com.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
