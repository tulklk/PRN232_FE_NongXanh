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
      className="fixed bottom-6 right-6 z-50 flex flex-col items-center justify-center w-14 h-14 rounded-full bg-[#0A923C] text-white shadow-lg hover:bg-[#087a32] hover:scale-105 active:scale-95 transition-all duration-200"
    >
      <ChevronUp size={22} strokeWidth={2.5} className="-mb-0.5" />
      <span className="text-[10px] font-semibold tracking-wide">TOP</span>
    </button>
  )
}
