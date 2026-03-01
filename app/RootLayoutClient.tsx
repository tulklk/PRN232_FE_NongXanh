'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { UserProvider } from '@/contexts/UserContext'
import { CartProvider } from '@/contexts/CartContext'

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')
  const isStaffPage = pathname?.startsWith('/staff')

  // Hide Header/Footer for admin and staff pages
  if (isAdminPage || isStaffPage) {
    return (
      <UserProvider>
        <CartProvider>
          {children}
        </CartProvider>
      </UserProvider>
    )
  }

  return (
    <UserProvider>
      <CartProvider>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </CartProvider>
    </UserProvider>
  )
}
