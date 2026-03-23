'use client'

import { usePathname } from 'next/navigation'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ScrollToTop from '@/components/common/ScrollToTop'
import { UserProvider } from '@/contexts/UserContext'
import { CartProvider } from '@/contexts/CartContext'
import { WishlistProvider } from '@/contexts/WishlistContext'

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAdminPage = pathname?.startsWith('/admin')
  const isStaffPage = pathname?.startsWith('/staff')

  const content = isAdminPage || isStaffPage ? (
    <UserProvider>
      <CartProvider>
        <WishlistProvider>{children}</WishlistProvider>
      </CartProvider>
    </UserProvider>
  ) : (
    <UserProvider>
      <CartProvider>
        <WishlistProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <ScrollToTop />
        </WishlistProvider>
      </CartProvider>
    </UserProvider>
  )

  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {content}
      </GoogleOAuthProvider>
    )
  }

  return content
}
