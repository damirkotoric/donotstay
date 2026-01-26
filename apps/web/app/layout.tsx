import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Analytics } from '@vercel/analytics/react';

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
    apple: '/logo-donotstay.png',
  },
  openGraph: {
    title: 'DoNotStay - AI Hotel Review Analysis',
    description:
      'Get instant AI verdicts on hotels before you book. Works on Booking.com.',
    type: 'website',
    images: ['/social.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DoNotStay - AI Hotel Review Analysis',
    description:
      'Get instant AI verdicts on hotels before you book. Works on Booking.com.',
    images: ['/social.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link
          rel="icon"
          href="/logo-donotstay.png"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/logo-donotstay-white.png"
          media="(prefers-color-scheme: dark)"
        />
      </head>
      <body className="font-sans antialiased bg-background">
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
