// Import React to provide the React namespace for React.ReactNode
import React from 'react'
import './globals.css'
import { Inter } from 'next/font/google'

import { AuthProvider } from '../components/providers/AuthProvider'
import { MobileProvider } from '../components/providers/MobileProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Pneu Control',
  description: 'Sistema avançado de gestão de frotas e controle de pneus'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="antialiased font-sans">
        <AuthProvider>
          <MobileProvider>
            {children}
          </MobileProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
