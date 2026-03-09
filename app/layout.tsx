import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Browser Edge AI Creative Studio',
  description: 'AI-powered video editing in the browser',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ colorScheme: 'dark' }}>
      <body style={{ background: '#0d0d0d', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
