import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Righteous } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { Providers } from './providers'
import './globals.css'
import { LoginModal } from '@/components/auth/login-modal'
import { Header } from '@/components/layout/header'
import ClarityScript from "@/components/ClarityScript"
import { GoogleAnalytics } from '@next/third-parties/google'
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

const righteous = Righteous({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-righteous'
})

export const metadata: Metadata = {
  title: 'ArgenStats - Datos económicos en tiempo real',
  description: 'Monitorea los principales indicadores económicos de Argentina con datos oficiales del INDEC',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="es" className={`${inter.variable} ${righteous.variable}`} suppressHydrationWarning>
        <body className="font-sans antialiased bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
          <Providers>
          <Header />
          <LoginModal />
            {children}
          </Providers>
          <ClarityScript />
          <GoogleAnalytics gaId="G-WFK681BVSD" />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}