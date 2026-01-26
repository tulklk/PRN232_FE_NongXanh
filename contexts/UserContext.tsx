'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  userId: string
  firebaseUid: string
  email: string
  phoneNumber: string
  displayName: string
  provider: string
  accessToken: string | null
}

export interface AuthTokens {
  idToken: string
  refreshToken: string
  expiresIn: number
}

interface UserContextType {
  user: User | null
  tokens: AuthTokens | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (userData: User, tokens: AuthTokens) => void
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const STORAGE_KEYS = {
  USER: 'user',
  TOKENS: 'authTokens',
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tokens, setTokens] = useState<AuthTokens | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user data from localStorage on mount
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER)
        const storedTokens = localStorage.getItem(STORAGE_KEYS.TOKENS)

        if (storedUser) {
          const userData = JSON.parse(storedUser)
          setUser(userData)
        }

        if (storedTokens) {
          const tokensData = JSON.parse(storedTokens)
          setTokens(tokensData)
        }
      } catch (error) {
        console.error('Error loading user from storage:', error)
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEYS.USER)
        localStorage.removeItem(STORAGE_KEYS.TOKENS)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserFromStorage()

    // Listen for storage changes (for multi-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.USER) {
        if (e.newValue) {
          setUser(JSON.parse(e.newValue))
        } else {
          setUser(null)
        }
      }
      if (e.key === STORAGE_KEYS.TOKENS) {
        if (e.newValue) {
          setTokens(JSON.parse(e.newValue))
        } else {
          setTokens(null)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const login = (userData: User, tokensData: AuthTokens) => {
    setUser(userData)
    setTokens(tokensData)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))
    localStorage.setItem(STORAGE_KEYS.TOKENS, JSON.stringify(tokensData))
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('userLogin'))
  }

  const logout = () => {
    setUser(null)
    setTokens(null)
    localStorage.removeItem(STORAGE_KEYS.USER)
    localStorage.removeItem(STORAGE_KEYS.TOKENS)
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('userLogout'))
  }

  const updateUser = (userData: Partial<User>) => {
    if (!user) return
    
    const updatedUser = { ...user, ...userData }
    setUser(updatedUser)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser))
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('userUpdate'))
  }

  const value: UserContextType = {
    user,
    tokens,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
