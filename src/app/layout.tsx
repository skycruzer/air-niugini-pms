import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { CommandPaletteProvider } from '@/components/command/CommandPaletteProvider';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Air Niugini Pilot Management System',
  description: 'B767 Fleet Pilot Certification and Leave Management System for Air Niugini',
  keywords: ['Air Niugini', 'Pilot Management', 'B767', 'Certification', 'Leave Management'],
  authors: [{ name: 'Air Niugini IT Department' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Air Niugini PMS',
  },
  openGraph: {
    type: 'website',
    title: 'Air Niugini Pilot Management System',
    description: 'B767 Fleet Pilot Certification and Leave Management',
    siteName: 'Air Niugini PMS',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#E4002B',
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

        {/* Theme Colors */}
        <meta name="theme-color" content="#E4002B" />
        <meta name="msapplication-TileColor" content="#E4002B" />

        {/* iOS Support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Air Niugini PMS" />

        {/* Android/Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Air Niugini PMS" />

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
            {/* Sonner Toast notifications with Air Niugini branding */}
            <Toaster
              position="top-right"
              theme="light"
              toastOptions={{
                style: {
                  border: '2px solid #E4002B',
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
