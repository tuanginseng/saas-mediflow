import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'MediFlow — Medical Clinic Marketing & Automation',
    template: '%s | MediFlow',
  },
  description:
    'End-to-end marketing and automation platform for medical clinics — from trend content creation to ROI analytics.',
  keywords: ['medical clinic', 'marketing automation', 'CRM', 'patient management', 'healthcare SaaS'],
  authors: [{ name: 'MediFlow Team' }],
  robots: 'noindex, nofollow', // private SaaS — no public indexing
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
