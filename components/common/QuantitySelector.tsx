'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'

interface QuantitySelectorProps {
  min?: number
  max?: number
  defaultValue?: number
  onChange?: (value: number) => void
  className?: string
}

export default function QuantitySelector({
  min = 1,
  max = 999,
  defaultValue = 1,
  onChange,
  className = '',
}: QuantitySelectorProps) {
  const [quantity, setQuantity] = useState(defaultValue)

  const handleDecrease = () => {
    if (quantity > min) {
      const newValue = quantity - 1
      setQuantity(newValue)
      onChange?.(newValue)
    }
  }

  const handleIncrease = () => {
    if (quantity < max) {
      const newValue = quantity + 1
      setQuantity(newValue)
      onChange?.(newValue)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || min
    const clampedValue = Math.max(min, Math.min(max, value))
    setQuantity(clampedValue)
    onChange?.(clampedValue)
  }

  return (
    <div className={`flex items-center border border-gray-300 rounded ${className}`}>
      <button
        onClick={handleDecrease}
        disabled={quantity <= min}
        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Minus size={16} />
      </button>
      <input
        type="number"
        value={quantity}
        onChange={handleChange}
        min={min}
        max={max}
        className="w-16 text-center border-0 focus:outline-none focus:ring-0"
      />
      <button
        onClick={handleIncrease}
        disabled={quantity >= max}
        className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
