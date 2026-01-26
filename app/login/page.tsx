'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LoginModal from '@/components/auth/LoginModal'
import { useUser } from '@/contexts/UserContext'
import type { User, AuthTokens } from '@/contexts/UserContext'

export default function LoginPage() {
    const router = useRouter()
    const { login } = useUser()
    const [isOpen, setIsOpen] = useState(true)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleClose = () => {
        setIsOpen(false)
        router.push('/')
    }

    const handleLogin = async (email: string, password: string) => {
        try {
            setLoading(true)
            setError('')

            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const contentType = res.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                throw new Error('API không trả về JSON')
            }

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Đăng nhập thất bại')
            }

            // Extract user data and tokens
            const { tokens, ...userData } = data
            
            if (!tokens || !tokens.idToken) {
                throw new Error('Không nhận được tokens từ server')
            }

            // Use UserContext to store user data and tokens
            login(userData as User, tokens as AuthTokens)

            // Redirect to account profile
            router.push('/account/profile')

        } catch (err: any) {
            console.error('Login error:', err)
            setError(err.message || 'Đăng nhập thất bại')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <LoginModal
                isOpen={isOpen}
                onClose={handleClose}
                onLogin={handleLogin}
                loading={loading}
                error={error}
            />
        </div>
    )
} 