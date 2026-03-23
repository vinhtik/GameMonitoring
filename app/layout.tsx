import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Monitoring Platform',
  description: 'Система мониторинга цен, подписок и уведомлений',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_35%),linear-gradient(to_bottom,rgba(15,23,42,1),rgba(2,6,23,1))]">
          {children}
        </div>
      </body>
    </html>
  )
}