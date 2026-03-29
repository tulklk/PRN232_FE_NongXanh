'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'
import { getUnreadNotificationCount } from '@/lib/api/notifications'
import { createSignalrClient } from '@/lib/realtime/signalr'
import { cn } from '@/lib/utils'

interface SidebarNotificationBellProps {
  href: string
  activeClassName?: string
}

export default function SidebarNotificationBell({
  href,
  activeClassName = 'bg-primary-green/10 text-primary-green',
}: SidebarNotificationBellProps) {
  const pathname = usePathname()
  const { tokens, isAuthenticated } = useUser()
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    if (!tokens?.idToken) {
      setCount(0)
      return
    }
    try {
      const n = await getUnreadNotificationCount(tokens.idToken)
      setCount(n)
    } catch {
      setCount(0)
    }
  }, [tokens?.idToken])

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken) {
      setCount(0)
      return
    }
    void refresh()
  }, [isAuthenticated, tokens?.idToken, refresh])

  useEffect(() => {
    if (!isAuthenticated || !tokens?.idToken) return
    const client = createSignalrClient(tokens.idToken)
    const off = client.onReceiveNotification(() => {
      void refresh()
    })
    void client.start().catch(() => {})
    return () => {
      off()
      void client.stop().catch(() => {})
    }
  }, [isAuthenticated, tokens?.idToken, refresh])

  useEffect(() => {
    const onFocus = () => void refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  useEffect(() => {
    const onUpdated = () => void refresh()
    window.addEventListener('notifications-updated', onUpdated)
    return () => window.removeEventListener('notifications-updated', onUpdated)
  }, [refresh])

  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <div className="relative shrink-0">
      <Link
        href={href}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900',
          isActive && activeClassName
        )}
        aria-label="Thông báo"
      >
        <Bell size={20} strokeWidth={2} />
        {count > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
            aria-label={`${count} thông báo chưa đọc`}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </Link>
    </div>
  )
}
