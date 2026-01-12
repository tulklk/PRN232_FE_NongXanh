import type { Metadata } from 'next'
import './globals.css'
import RootLayoutClient from './RootLayoutClient'

export const metadata: Metadata = {
  title: 'Nông Xanh - Nông Sản Tươi Ngon',
  description: 'Nông Xanh - Cửa hàng nông sản tươi ngon, đặc sản vùng miền',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  )
}
