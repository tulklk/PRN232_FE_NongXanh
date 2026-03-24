'use client'

import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!visible) return null

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Cuộn lên đầu trang"
      className="fixed bottom-[5.5rem] right-6 z-50 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-transparent text-[#73C66B] shadow-none hover:scale-105 active:scale-95 transition-all duration-200"
    >
      <ChevronUp size={22} strokeWidth={2.5} className="-mb-0.5" />
      <span className="text-[10px] font-semibold tracking-wide">TOP</span>
    </button>
  )
}
