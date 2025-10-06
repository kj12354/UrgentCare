import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'UrgentCare EMR',
  description: 'AI-powered urgent care EMR',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
