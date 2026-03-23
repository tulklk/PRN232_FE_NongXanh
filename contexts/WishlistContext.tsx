'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useUser } from '@/contexts/UserContext'
import { addWishlist, getMyWishlist, removeWishlist } from '@/lib/api/wishlists'
import type { ApiWishlistItem } from '@/lib/types/api'

interface WishlistContextType {
  wishlistItems: ApiWishlistItem[]
  wishlistProductIds: Set<string>
  loading: boolean
  refreshWishlist: () => Promise<void>
  toggleWishlist: (productId: number | string) => Promise<boolean>
  removeFromWishlist: (productId: number | string) => Promise<void>
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, tokens } = useUser()
  const [wishlistItems, setWishlistItems] = useState<ApiWishlistItem[]>([])
  const [loading, setLoading] = useState(false)

  const token = tokens?.idToken

  const refreshWishlist = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setWishlistItems([])
      return
    }
    setLoading(true)
    try {
      const items = await getMyWishlist(token)
      setWishlistItems(items)
    } catch {
      setWishlistItems([])
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, token])

  useEffect(() => {
    refreshWishlist()
  }, [refreshWishlist])

  const wishlistProductIds = useMemo(() => {
    const set = new Set<string>()
    wishlistItems.forEach((item) => {
      if (item.productId != null) set.add(String(item.productId))
    })
    return set
  }, [wishlistItems])

  const removeFromWishlist = useCallback(
    async (productId: number | string) => {
      if (!token) return
      const key = String(productId)
      setWishlistItems((prev) => prev.filter((x) => String(x.productId) !== key))
      try {
        await removeWishlist(productId, token)
      } catch {
        await refreshWishlist()
      }
    },
    [refreshWishlist, token]
  )

  const toggleWishlist = useCallback(
    async (productId: number | string) => {
      if (!token) return false
      const key = String(productId)
      const exists = wishlistProductIds.has(key)
      if (exists) {
        await removeFromWishlist(productId)
        return false
      }
      const optimistic: ApiWishlistItem = {
        productId: key,
      }
      setWishlistItems((prev) => [optimistic, ...prev])
      try {
        await addWishlist({ productId: key }, token)
        await refreshWishlist()
        return true
      } catch {
        setWishlistItems((prev) => prev.filter((x) => String(x.productId) !== key))
        return false
      }
    },
    [refreshWishlist, removeFromWishlist, token, wishlistProductIds]
  )

  const value: WishlistContextType = {
    wishlistItems,
    wishlistProductIds,
    loading,
    refreshWishlist,
    toggleWishlist,
    removeFromWishlist,
  }

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) {
    throw new Error('useWishlist must be used within WishlistProvider')
  }
  return ctx
}
