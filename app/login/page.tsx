'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoginModal from '@/components/auth/LoginModal'

export default function LoginPage() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)

  const handleClose = () => {
    setIsOpen(false)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <LoginModal isOpen={isOpen} onClose={handleClose} />
    </div>
  )
}
