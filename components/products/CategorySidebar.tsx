'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { brands } from '@/data/brands'
import { PRICE_RANGES } from '@/lib/constants'
import { getCategories } from '@/lib/api/categories'
import type { ApiCategory } from '@/lib/types/api'

interface CategorySidebarProps {
  activeCategory?: string
}

export default function CategorySidebar({ activeCategory }: CategorySidebarProps) {
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [hoveredParentId, setHoveredParentId] = useState<number | null>(null)
  const sidebarSubmenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    return () => {
      if (sidebarSubmenuTimeoutRef.current) clearTimeout(sidebarSubmenuTimeoutRef.current)
    }
  }, [])

  const topLevelCategories = categories.filter((c) => !c.isDeleted)

  const handleParentEnter = (categoryId: number) => {
    if (sidebarSubmenuTimeoutRef.current) {
      clearTimeout(sidebarSubmenuTimeoutRef.current)
      sidebarSubmenuTimeoutRef.current = null
    }
    setHoveredParentId(categoryId)
  }

  const handleParentLeave = () => {
    sidebarSubmenuTimeoutRef.current = setTimeout(() => setHoveredParentId(null), 120)
  }

  return (
    <aside className="w-64 space-y-6">
      {/* Categories - chỉ hiển thị danh mục cha, hover thì hiện con */}
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
          {topLevelCategories.map((cat) => {
            const hasChildren = cat.children && cat.children.length > 0 && !cat.children.every((c) => c.isDeleted)
            const children = (cat.children || []).filter((c) => !c.isDeleted)
            if (!hasChildren) {
              return (
                <li key={cat.categoryId}>
                  <Link
                    href={`/products?category=${cat.categoryId}`}
                    className={`block px-3 py-2 rounded hover:bg-gray-100 ${
                      activeCategory === String(cat.categoryId)
                        ? 'bg-primary-green-light text-primary-green-dark font-semibold'
                        : 'text-gray-700'
                    }`}
                  >
                    {cat.categoryName}
                  </Link>
                </li>
              )
            }
            return (
              <li
                key={cat.categoryId}
                className="relative"
                onMouseEnter={() => handleParentEnter(cat.categoryId)}
                onMouseLeave={handleParentLeave}
              >
                <Link
                  href={`/products?category=${cat.categoryId}`}
                  className={`block px-3 py-2 rounded hover:bg-gray-100 ${
                    activeCategory === String(cat.categoryId)
                      ? 'bg-primary-green-light text-primary-green-dark font-semibold'
                      : 'text-gray-700'
                  }`}
                >
                  {cat.categoryName}
                </Link>
                {hoveredParentId === cat.categoryId && (
                  <div className="absolute left-full top-0 ml-0 w-52 bg-white border border-gray-200 shadow-lg py-2 z-50 rounded-r min-w-[11rem]">
                    {children.map((child) => (
                      <Link
                        key={child.categoryId}
                        href={`/products?category=${child.categoryId}`}
                        className={`block px-4 py-2 text-sm rounded-r hover:bg-gray-100 ${
                          activeCategory === String(child.categoryId)
                            ? 'bg-primary-green-light text-primary-green-dark font-semibold'
                            : 'text-gray-700'
                        }`}
                      >
                        {child.categoryName}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            )
          })}
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
