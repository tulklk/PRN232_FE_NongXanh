'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
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
  addMealCombo: (mealComboId: string, quantity?: number) => Promise<void>
  updateItem: (cartItemId: number | string, quantity: number) => Promise<void>
  removeItem: (cartItemId: number | string) => Promise<void>
  clearCart: () => Promise<void>
  cartCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { tokens, isAuthenticated } = useUser()
  const [cart, setCart] = useState<ApiCart | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cartRequestVersionRef = useRef(0)

  const token = tokens?.idToken

  const refreshCart = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setCart(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    const requestVersion = ++cartRequestVersionRef.current
    try {
      const data = await cartApi.getCart(token)
      if (requestVersion !== cartRequestVersionRef.current) return
      setCart(data)
    } catch (err) {
      if (requestVersion !== cartRequestVersionRef.current) return
      setError(err instanceof Error ? err.message : 'Không thể tải giỏ hàng')
      setCart(null)
    } finally {
      if (requestVersion !== cartRequestVersionRef.current) return
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
      cartRequestVersionRef.current += 1
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

  const addMealCombo = useCallback(
    async (mealComboId: string, quantity = 1) => {
      if (!token) {
        setError('Vui lòng đăng nhập để thêm vào giỏ')
        return
      }
      const id = String(mealComboId ?? '').trim()
      if (!id) {
        setError('Không lấy được mealComboId')
        return
      }
      setLoading(true)
      setError(null)
      cartRequestVersionRef.current += 1
      try {
        const updated = await cartApi.addCartItem(
          { variantId: null, mealComboId: id, quantity },
          token
        )
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
    async (cartItemId: number | string, quantity: number) => {
      if (!token) return
      setLoading(true)
      setError(null)
      cartRequestVersionRef.current += 1
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
    async (cartItemId: number | string) => {
      if (!token) return
      const targetId = String(cartItemId)
      const previousCart = cart

      setLoading(true)
      setError(null)
      cartRequestVersionRef.current += 1

      // Optimistic UI: xóa item ngay trên giao diện, không chờ refresh trang.
      setCart((prev) => {
        if (!prev?.cartItems) return prev
        const nextItems = prev.cartItems.filter(
          (item) => String(item.cartItemId) !== targetId
        )
        const nextTotal = nextItems.reduce(
          (sum, item) => sum + (item.subTotal ?? item.priceAtTime * item.quantity),
          0
        )
        return {
          ...prev,
          cartItems: nextItems,
          totalAmount: nextTotal,
        }
      })

      try {
        await cartApi.removeCartItem(cartItemId, token)
      } catch (err) {
        // Rollback nếu backend trả lỗi
        setCart(previousCart)
        setError(err instanceof Error ? err.message : 'Không thể xóa khỏi giỏ')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [token, cart]
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
    addMealCombo,
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
