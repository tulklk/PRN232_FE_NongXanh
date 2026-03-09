'use client'

import { useState } from 'react'
import Image from 'next/image'

interface ProductImagesGalleryProps {
  mainImage: string
  images?: string[]
  name: string
}

export default function ProductImagesGallery({
  mainImage,
  images,
  name,
}: ProductImagesGalleryProps) {
  const allImages: string[] = []

  if (mainImage) {
    allImages.push(mainImage)
  }
  if (images && images.length > 0) {
    images.forEach((url) => {
      if (url && !allImages.includes(url)) {
        allImages.push(url)
      }
    })
  }

  const [currentIndex, setCurrentIndex] = useState(0)

  if (allImages.length === 0) {
    return null
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % allImages.length)
  }

  return (
    <div>
      <div className="relative w-full aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
        <Image
          src={allImages[currentIndex]}
          alt={name}
          fill
          className="object-cover rounded-lg"
          sizes="(max-width: 768px) 100vw, 40vw"
        />
        {allImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-black/60"
            >
              ›
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {allImages.map((url, index) => (
          <button
            key={`${url}-${index}`}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`relative aspect-square rounded overflow-hidden border ${
              index === currentIndex ? 'border-primary-green' : 'border-transparent'
            }`}
          >
            <Image
              src={url}
              alt={`${name} ${index + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 25vw, 10vw"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

