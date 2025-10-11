import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { CommandPaletteProvider } from '@/components/command/CommandPaletteProvider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fleet Office Management System',
  description: 'Professional pilot certification tracking and leave management for fleet operations',
  keywords: ['Fleet Management', 'Pilot Management', 'Certification Tracking', 'Leave Management', 'Fleet Operations'],
  authors: [{ name: 'Fleet Office Management Team' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fleet Office',
  },
  openGraph: {
    type: 'website',
    title: 'Fleet Office Management System',
    description: 'Professional fleet operations management with pilot certification tracking',
    siteName: 'Fleet Office',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0EA5E9', // Professional Sky Blue
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* PWA Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon-192x192.png" type="image/png" sizes="192x192" />
        <link rel="icon" href="/icon-512x512.png" type="image/png" sizes="512x512" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icon-512x512.png" sizes="512x512" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Theme Colors - Professional Sky Blue */}
        <meta name="theme-color" content="#0EA5E9" />
        <meta name="msapplication-TileColor" content="#0EA5E9" />

        {/* iOS Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Fleet Office" />

        {/* Android/Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Fleet Office" />

        {/* Microsoft */}
        <meta name="msapplication-TileImage" content="/icon-192x192.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ErrorBoundary>
          <div className="min-h-screen bg-neutral-50" id="app-root">
            <Providers>
              <CommandPaletteProvider>{children}</CommandPaletteProvider>
            </Providers>
            {/* Sonner Toast notifications with professional branding */}
            <Toaster
              position="top-right"
              theme="light"
              toastOptions={{
                style: {
                  border: '2px solid #0EA5E9', // Professional Sky Blue
                  borderRadius: '0.5rem',
                },
                className: 'bg-white text-[#000000]',
              }}
            />
          </div>
        </ErrorBoundary>
      </body>
    </html>
  );
}
