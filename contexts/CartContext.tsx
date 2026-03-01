'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import type { ApiCart } from '@/lib/types/api'
import * as cartApi from '@/lib/api/cart'
import { useUser } from '@/contexts/UserContext'

interface CartContextType {
  cart: ApiCart | null
  loading: boolean
  error: string | null
  refreshCart: () => Promise<void>
  addItem: (variantId: number, quantity?: number) => Promise<void>
  updateItem: (cartItemId: number, quantity: number) => Promise<void>
  removeItem: (cartItemId: number) => Promise<void>
  clearCart: () => Promise<void>
  cartCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { tokens, isAuthenticated } = useUser()
  const [cart, setCart] = useState<ApiCart | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = tokens?.idToken

  const refreshCart = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setCart(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await cartApi.getCart(token)
      setCart(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải giỏ hàng')
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [token, isAuthenticated])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  const addItem = useCallback(
    async (variantId: number, quantity = 1) => {
      if (!token) {
        setError('Vui lòng đăng nhập để thêm vào giỏ')
        return
      }
      setLoading(true)
      setError(null)
      try {
        const updated = await cartApi.addCartItem({ variantId, quantity }, token)
        setCart(updated)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể thêm vào giỏ')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [token]
  )

  const updateItem = useCallback(
    async (cartItemId: number, quantity: number) => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        const updated = await cartApi.updateCartItem(cartItemId, quantity, token)
        setCart(updated)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể cập nhật giỏ')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [token]
  )

  const removeItem = useCallback(
    async (cartItemId: number) => {
      if (!token) return
      setLoading(true)
      setError(null)
      try {
        await cartApi.removeCartItem(cartItemId, token)
        await refreshCart()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể xóa khỏi giỏ')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [token, refreshCart]
  )

  const clearCart = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      await cartApi.clearCart(token)
      setCart(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa giỏ')
      throw err
    } finally {
      setLoading(false)
    }
  }, [token])

  const cartCount =
    cart?.cartItems?.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  const value: CartContextType = {
    cart,
    loading,
    error,
    refreshCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    cartCount,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
