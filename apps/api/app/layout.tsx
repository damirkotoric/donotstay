import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DoNotStay API',
  description: 'AI-powered hotel review analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
