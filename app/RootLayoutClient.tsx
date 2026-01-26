'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { UserProvider } from '@/contexts/UserContext'

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
        {children}
      </UserProvider>
    )
  }

  return (
    <UserProvider>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </UserProvider>
  )
}
