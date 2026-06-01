import './globals.css'
import { ReactNode } from 'react'

export const metadata = { title: 'COPREM Dashboard', description: 'Jeff AI Executive Partner' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen font-mono">{children}</body>
    </html>
  )
}
