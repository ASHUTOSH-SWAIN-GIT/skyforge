import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Skyforge - Database Design Tool',
  description: 'Collaborative database schema design using Go and Next.js',
  icons: {
    icon: [
      { url: '/icon.jpg?v=1', type: 'image/jpeg' },
    ],
    shortcut: '/icon.jpg?v=1',
    apple: '/icon.jpg?v=1',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Analytics/>
      </body>
    </html>
  )
}