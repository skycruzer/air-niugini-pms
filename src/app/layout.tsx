import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Air Niugini Pilot Management System',
  description: 'B767 Fleet Pilot Certification and Leave Management System for Air Niugini',
  keywords: ['Air Niugini', 'Pilot Management', 'B767', 'Certification', 'Leave Management'],
  authors: [{ name: 'Air Niugini IT Department' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#E4002B" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Air Niugini PMS" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#E4002B" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-neutral-50" id="app-root">
          <Providers>
            {children}
          </Providers>
        </div>
      </body>
    </html>
  )
}