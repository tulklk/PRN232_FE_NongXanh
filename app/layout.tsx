import type { Metadata } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'
import RootLayoutClient from './RootLayoutClient'

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-be-vietnam-pro',
})

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
    <html lang="vi" className={beVietnamPro.variable}>
      <body className={beVietnamPro.className}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  )
}
