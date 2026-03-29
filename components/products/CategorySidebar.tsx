"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PRICE_RANGES, type PriceRangeOption } from "@/lib/constants";
import { getCategories } from "@/lib/api/categories";
import { getProviders } from "@/lib/api/providers";
import type { ApiCategory, ApiProvider } from "@/lib/types/api";

interface CategorySidebarProps {
  activeCategory?: string;
}

export default function CategorySidebar({
  activeCategory,
}: CategorySidebarProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [hoveredParentId, setHoveredParentId] = useState<number | null>(null);
  const sidebarSubmenuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const buildProductsHref = (
    overrides: Record<string, string | null | undefined>,
  ) => {
    const p = new URLSearchParams(searchParams.toString());
    for (const [key, raw] of Object.entries(overrides)) {
      if (raw === undefined) continue;
      if (raw === null || raw === "") p.delete(key);
      else p.set(key, raw);
    }
    const qs = p.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  const curMin = searchParams.get("minPrice");
  const curMax = searchParams.get("maxPrice");

  const priceRangeMatches = (range: PriceRangeOption) => {
    if (range.max === null) {
      return curMin === String(range.min) && (curMax === null || curMax === "");
    }
    return curMin === String(range.min) && curMax === String(range.max);
  };

  const togglePriceRange = (range: PriceRangeOption) => {
    const p = new URLSearchParams(searchParams.toString());
    if (priceRangeMatches(range)) {
      p.delete("minPrice");
      p.delete("maxPrice");
    } else {
      p.set("minPrice", String(range.min));
      if (range.max === null) p.delete("maxPrice");
      else p.set("maxPrice", String(range.max));
    }
    const qs = p.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  };

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));

    getProviders(1, 100)
      .then((items) => {
        setProviders(items);
      })
      .catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    return () => {
      if (sidebarSubmenuTimeoutRef.current)
        clearTimeout(sidebarSubmenuTimeoutRef.current);
    };
  }, []);

  const topLevelCategories = categories.filter((c) => !c.isDeleted);
  const resolveProviderImageSrc = (provider: ApiProvider): string | null => {
    const p = provider as ApiProvider & {
      ImageUrl?: string | null;
      imageURL?: string | null;
      imageurl?: string | null;
      providerImageUrl?: string | null;
      ProviderImageUrl?: string | null;
      logoUrl?: string | null;
      LogoUrl?: string | null;
      image?: string | null;
    };
    const raw = (
      provider.imageUrl ??
      p.ImageUrl ??
      p.imageURL ??
      p.imageurl ??
      p.providerImageUrl ??
      p.ProviderImageUrl ??
      p.logoUrl ??
      p.LogoUrl ??
      p.image ??
      ""
    )
      .toString()
      .trim();

    if (!raw) return null;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) return null;
    return `https://res.cloudinary.com/${cloudName}/image/upload/${raw}`;
  };

  const featuredProviders = providers
    .map((p) => ({ provider: p, imageSrc: resolveProviderImageSrc(p) }))
    .filter((x) => Boolean(x.imageSrc))
    .slice(0, 6);

  const handleParentEnter = (categoryId: number) => {
    if (sidebarSubmenuTimeoutRef.current) {
      clearTimeout(sidebarSubmenuTimeoutRef.current);
      sidebarSubmenuTimeoutRef.current = null;
    }
    setHoveredParentId(categoryId);
  };

  const handleParentLeave = () => {
    sidebarSubmenuTimeoutRef.current = setTimeout(
      () => setHoveredParentId(null),
      120,
    );
  };

  return (
    <aside className="w-64 space-y-6">
      {/* Categories - chỉ hiển thị danh mục cha, hover thì hiện con */}
      <div>
        <h3 className="font-bold text-primary-green mb-3">TẤT CẢ SẢN PHẨM</h3>
        <ul className="space-y-2">
          <li>
            <Link
              href={buildProductsHref({ category: null })}
              className={`block px-3 py-2 rounded hover:bg-gray-100 ${
                !activeCategory || activeCategory === "all"
                  ? "bg-primary-green-light text-primary-green-dark font-semibold"
                  : "text-gray-700"
              }`}
            >
              Tất cả
            </Link>
          </li>
          {topLevelCategories.map((cat) => {
            const hasChildren =
              cat.children &&
              cat.children.length > 0 &&
              !cat.children.every((c) => c.isDeleted);
            const children = (cat.children || []).filter((c) => !c.isDeleted);
            if (!hasChildren) {
              return (
                <li key={cat.categoryId}>
                  <Link
                    href={buildProductsHref({
                      category: String(cat.categoryId),
                    })}
                    className={`block px-3 py-2 rounded hover:bg-gray-100 ${
                      activeCategory === String(cat.categoryId)
                        ? "bg-primary-green-light text-primary-green-dark font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    {cat.categoryName}
                  </Link>
                </li>
              );
            }
            return (
              <li
                key={cat.categoryId}
                className="relative"
                onMouseEnter={() => handleParentEnter(cat.categoryId)}
                onMouseLeave={handleParentLeave}
              >
                <Link
                  href={buildProductsHref({ category: String(cat.categoryId) })}
                  className={`block px-3 py-2 rounded hover:bg-gray-100 ${
                    activeCategory === String(cat.categoryId)
                      ? "bg-primary-green-light text-primary-green-dark font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  {cat.categoryName}
                </Link>
                {hoveredParentId === cat.categoryId && (
                  <div className="absolute left-full top-0 ml-0 w-52 bg-white border border-gray-200 shadow-lg py-2 z-50 rounded-r min-w-[11rem]">
                    {children.map((child) => (
                      <Link
                        key={child.categoryId}
                        href={buildProductsHref({
                          category: String(child.categoryId),
                        })}
                        className={`block px-4 py-2 text-sm rounded-r hover:bg-gray-100 ${
                          activeCategory === String(child.categoryId)
                            ? "bg-primary-green-light text-primary-green-dark font-semibold"
                            : "text-gray-700"
                        }`}
                      >
                        {child.categoryName}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Brands */}
      <div>
        <h3 className="font-bold text-primary-green mb-3">
          NHỮNG THƯƠNG HIỆU UY TÍN
        </h3>
        <div className="grid grid-cols-2 gap-1.5">
          {featuredProviders.length > 0 ? (
            featuredProviders.map(({ provider, imageSrc }, i) => {
              const idStr = String(provider.providerId);
              const isBrandActive = searchParams.get("provider") === idStr;
              return (
                <Link
                  key={provider.providerId}
                  href={
                    isBrandActive
                      ? buildProductsHref({ provider: null })
                      : buildProductsHref({ provider: idStr })
                  }
                  title={provider.providerName ?? "Provider"}
                  className={`block bg-white border rounded p-1.5 transition-colors hover:border-primary-green ${
                    isBrandActive
                      ? "border-primary-green ring-1 ring-primary-green/30"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={imageSrc as string}
                    alt={provider.providerName ?? "Provider"}
                    className="h-10 w-full rounded object-contain pointer-events-none"
                    loading={i < 2 ? "eager" : "lazy"}
                    fetchPriority={i < 2 ? "high" : "auto"}
                  />
                </Link>
              );
            })
          ) : (
            <div className="col-span-2 text-sm text-gray-500">
              Chưa có nhà cung cấp
            </div>
          )}
        </div>
      </div>

      {/* Price Ranges */}
      <div>
        <h3 className="font-bold text-primary-green mb-3">KHOẢNG GIÁ</h3>
        <ul className="space-y-2">
          {PRICE_RANGES.map((range, index) => (
            <li key={index}>
              <label className="flex items-center cursor-pointer hover:text-primary-green">
                <input
                  type="checkbox"
                  checked={priceRangeMatches(range)}
                  onChange={() => togglePriceRange(range)}
                  className="mr-2 rounded border-gray-300 text-primary-green focus:ring-primary-green"
                />
                <span className="text-sm">{range.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
