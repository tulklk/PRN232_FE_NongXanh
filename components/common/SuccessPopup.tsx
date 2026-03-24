'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface SuccessPopupProps {
    message: string
    isOpen: boolean
    onClose: () => void
    duration?: number
}

export default function SuccessPopup({ 
    message, 
    isOpen, 
    onClose,
    duration = 2000 
}: SuccessPopupProps) {
    const [shouldRender, setShouldRender] = useState(false)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true)
            requestAnimationFrame(() => {
                setVisible(true)
            })

            const timer = setTimeout(() => {
                onClose()
            }, duration)

            return () => clearTimeout(timer)
        }

        setVisible(false)
        const hideTimer = setTimeout(() => {
            setShouldRender(false)
        }, 280)

        return () => clearTimeout(hideTimer)
    }, [isOpen, duration, onClose])

    if (!shouldRender) return null

    // Split message by newline if it contains one
    const messageLines = message.split('\n')
    const title = messageLines[0]
    const subtitle = messageLines[1] || ''

    return (
        <div className="fixed right-4 top-4 z-[60] pointer-events-none">
            <div 
                className={`min-w-[320px] max-w-md rounded-lg border-l-4 border-[#0A923C] bg-white p-4 shadow-2xl pointer-events-auto will-change-transform transition-all duration-300 ease-out ${
                    visible
                        ? 'translate-x-0 opacity-100'
                        : 'translate-x-8 opacity-0'
                }`}
            >
                <div className="flex items-start gap-3">
                    {/* Checkmark Icon */}
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center relative">
                            <svg 
                                className="w-6 h-6 text-green-600" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="3" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            >
                                <path 
                                    d="M20 6L9 17l-5-5"
                                    className="checkmark-path"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 mb-1">
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="text-xs text-gray-600">
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
                        aria-label="Đóng"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    )
}
