'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { brands } from '@/data/brands'
import { PRICE_RANGES } from '@/lib/constants'
import { getCategories } from '@/lib/api/categories'
import type { ApiCategory } from '@/lib/types/api'

interface CategorySidebarProps {
  activeCategory?: string
}

function flattenCategories(cats: ApiCategory[]): ApiCategory[] {
  const result: ApiCategory[] = []
  for (const c of cats) {
    if (!c.isDeleted) {
      result.push(c)
      if (c.children?.length) {
        result.push(...flattenCategories(c.children))
      }
    }
  }
  return result
}

export default function CategorySidebar({ activeCategory }: CategorySidebarProps) {
  const [categories, setCategories] = useState<ApiCategory[]>([])

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  const allCategories = flattenCategories(categories)

  return (
    <aside className="w-64 space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-bold text-primary-green mb-3">TẤT CẢ SẢN PHẨM</h3>
        <ul className="space-y-2">
          <li>
            <Link
              href="/products"
              className={`block px-3 py-2 rounded hover:bg-gray-100 ${
                !activeCategory || activeCategory === 'all'
                  ? 'bg-primary-green-light text-primary-green-dark font-semibold'
                  : 'text-gray-700'
              }`}
            >
              Tất cả
            </Link>
          </li>
          {allCategories.map((category) => (
            <li key={category.categoryId}>
              <Link
                href={`/products?category=${category.categoryId}`}
                className={`block px-3 py-2 rounded hover:bg-gray-100 ${
                  activeCategory === String(category.categoryId)
                    ? 'bg-primary-green-light text-primary-green-dark font-semibold'
                    : 'text-gray-700'
                }`}
              >
                {category.categoryName}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-bold text-primary-green mb-3">NHỮNG THƯƠNG HIỆU UY TÍN</h3>
        <div className="grid grid-cols-2 gap-2">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="bg-white border border-gray-200 rounded p-3 hover:border-primary-green cursor-pointer"
            >
              <div className="text-xs font-semibold text-center">{brand.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Ranges */}
      <div>
        <h3 className="font-bold text-primary-green mb-3">KHOẢNG GIÁ (TRÊN MỖI KG)</h3>
        <ul className="space-y-2">
          {PRICE_RANGES.map((range, index) => (
            <li key={index}>
              <label className="flex items-center cursor-pointer hover:text-primary-green">
                <input
                  type="checkbox"
                  className="mr-2 rounded border-gray-300 text-primary-green focus:ring-primary-green"
                />
                <span className="text-sm">{range.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
