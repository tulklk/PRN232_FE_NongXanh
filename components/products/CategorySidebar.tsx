'use client'

import Link from 'next/link'
import { categories } from '@/data/categories'
import { brands } from '@/data/brands'
import { PRICE_RANGES } from '@/lib/constants'

interface CategorySidebarProps {
  activeCategory?: string
}

export default function CategorySidebar({ activeCategory }: CategorySidebarProps) {
  return (
    <aside className="w-64 space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-bold text-primary-green mb-3">TẤT CẢ SẢN PHẨM</h3>
        <ul className="space-y-2">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/products?category=${category.slug}`}
                className={`block px-3 py-2 rounded hover:bg-gray-100 ${
                  activeCategory === category.slug
                    ? 'bg-primary-green-light text-primary-green-dark font-semibold'
                    : 'text-gray-700'
                }`}
              >
                {category.name}
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
