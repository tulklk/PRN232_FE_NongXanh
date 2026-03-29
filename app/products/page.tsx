"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CategorySidebar from "@/components/products/CategorySidebar";
import ProductGrid from "@/components/products/ProductGrid";
import { SORT_OPTIONS } from "@/lib/constants";
import { getProducts } from "@/lib/api/products";
import { getBlogs } from "@/lib/api/blogs";
import { getProviders } from "@/lib/api/providers";
import type { Product } from "@/data/products";
import { getCategories } from "@/lib/api/categories";
import type { ApiBlog, ApiCategory, ApiProvider } from "@/lib/types/api";
import { formatDate } from "@/lib/utils";
import { getReviewsByProduct } from "@/lib/api/reviews";

function normalizeExternalUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed.toLowerCase() === "string") return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  return null;
}

function getBlogExternalHref(blog: ApiBlog): string | null {
  const fromUrl = normalizeExternalUrl(blog.url);
  if (fromUrl) return fromUrl;

  const content = (blog.content ?? "").trim();
  if (content.startsWith("http://") || content.startsWith("https://")) {
    return content;
  }

  return null;
}

function flattenCategories(cats: ApiCategory[]): ApiCategory[] {
  const result: ApiCategory[] = [];
  for (const c of cats) {
    if (!c.isDeleted) {
      result.push(c);
      if (c.children?.length) {
        result.push(...flattenCategories(c.children));
      }
    }
  }
  return result;
}

function normalizeCategoryId(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function getDirectChildCategoryIds(
  selectedCategoryId: string,
  categories: ApiCategory[],
): string[] {
  const selectedKey = normalizeCategoryId(selectedCategoryId);
  if (!selectedKey) return [];

  const fromParentId = categories
    .filter(
      (c) =>
        !c.isDeleted &&
        normalizeCategoryId((c as any).parentId) === selectedKey,
    )
    .map((c) => String(c.categoryId));

  const fromChildrenField = categories
    .filter((c) => normalizeCategoryId(c.categoryId) === selectedKey)
    .flatMap((c) => (c.children ?? []).filter((x) => !x.isDeleted))
    .map((c) => String(c.categoryId));

  return Array.from(new Set([...fromParentId, ...fromChildrenField]));
}

const LARGE_FETCH_PAGE_SIZE = 500;

function ProductsContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "all";
  const sortParam = searchParams.get("sort");
  const keyword = searchParams.get("q")?.trim() ?? "";
  const providerParam = searchParams.get("provider")?.trim() ?? "";
  const minPriceStr = searchParams.get("minPrice");
  const maxPriceStr = searchParams.get("maxPrice");
  const hasPriceFilter =
    (minPriceStr !== null && minPriceStr !== "") ||
    (maxPriceStr !== null && maxPriceStr !== "");

  const [sortBy, setSortBy] = useState("newest");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [providers, setProviders] = useState<ApiProvider[]>([]);
  const [relatedBlogs, setRelatedBlogs] = useState<ApiBlog[]>([]);
  const [relatedBlogsLoading, setRelatedBlogsLoading] = useState(true);
  const [ratingOverrides, setRatingOverrides] = useState<
    Record<string, { rating: number; reviewCount: number }>
  >({});
  const pageSize = 16;

  useEffect(() => {
    if (
      sortParam === "bestseller" ||
      sortParam === "price-low" ||
      sortParam === "price-high" ||
      sortParam === "newest"
    ) {
      setSortBy(sortParam);
    }
  }, [sortParam]);

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    getProviders(1, 200)
      .then(setProviders)
      .catch(() => setProviders([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRelatedBlogsLoading(true);
    getBlogs({ pageNumber: 1, pageSize: 6 })
      .then((res) => {
        if (cancelled) return;
        const items = res.items ?? [];
        setRelatedBlogs(items.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setRelatedBlogs([]);
      })
      .finally(() => {
        if (!cancelled) setRelatedBlogsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPageNumber(1);
  }, [category, providerParam, minPriceStr, maxPriceStr]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const loadProducts = async () => {
      const providerIdArg = providerParam || undefined;
      const useLargeBatch = hasPriceFilter;
      const apiPage = useLargeBatch ? 1 : pageNumber;
      const apiPageSize = useLargeBatch ? LARGE_FETCH_PAGE_SIZE : pageSize;

      try {
        if (category === "all") {
          const res = await getProducts({
            pageNumber: apiPage,
            pageSize: apiPageSize,
            providerId: providerIdArg,
          });
          if (cancelled) return;
          setProducts(res.items);
          if (useLargeBatch) {
            setTotalPages(1);
          } else {
            setTotalPages(
              res.totalPages ??
                (Math.ceil((res.totalCount ?? 0) / pageSize) || 1),
            );
          }
          return;
        }

        const childCategoryIds = getDirectChildCategoryIds(
          category,
          categories,
        );
        const isParentCategory = childCategoryIds.length > 0;

        if (!isParentCategory) {
          const res = await getProducts({
            pageNumber: apiPage,
            pageSize: apiPageSize,
            categoryId: category,
            providerId: providerIdArg,
          });
          if (cancelled) return;
          setProducts(res.items);
          if (useLargeBatch) {
            setTotalPages(1);
          } else {
            setTotalPages(
              res.totalPages ??
                (Math.ceil((res.totalCount ?? 0) / pageSize) || 1),
            );
          }
          return;
        }

        const perChildSize = useLargeBatch ? 500 : 200;
        const results = await Promise.all(
          childCategoryIds.map((childId) =>
            getProducts({
              pageNumber: 1,
              pageSize: perChildSize,
              categoryId: childId,
              providerId: providerIdArg,
            }),
          ),
        );
        if (cancelled) return;

        const merged: Product[] = [];
        const seen = new Set<string>();
        results.forEach((res) => {
          res.items.forEach((item) => {
            const key = String(item.id);
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(item);
          });
        });

        if (useLargeBatch) {
          setProducts(merged);
          setTotalPages(1);
        } else {
          const start = (pageNumber - 1) * pageSize;
          const paged = merged.slice(start, start + pageSize);
          setProducts(paged);
          setTotalPages(Math.max(1, Math.ceil(merged.length / pageSize)));
        }
      } catch {
        if (!cancelled) {
          setProducts([]);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      cancelled = true;
    };
  }, [
    category,
    pageNumber,
    pageSize,
    categories,
    providerParam,
    hasPriceFilter,
  ]);

  const allCategories = useMemo(
    () => flattenCategories(categories),
    [categories],
  );

  const activeCategoryObj =
    category !== "all"
      ? allCategories.find((c) => String(c.categoryId) === category)
      : null;

  const pageTitle =
    activeCategoryObj?.categoryName?.toUpperCase() ??
    (category === "all" ? "TẤT CẢ SẢN PHẨM" : "SẢN PHẨM");

  const selectedProviderName = useMemo(() => {
    if (!providerParam) return null;
    const pr = providers.find((x) => String(x.providerId) === providerParam);
    return pr?.providerName?.trim() ?? null;
  }, [providers, providerParam]);

  const filterMinPrice = useMemo(() => {
    if (minPriceStr === null || minPriceStr === "") return null;
    const n = Number(minPriceStr);
    return Number.isFinite(n) ? n : null;
  }, [minPriceStr]);

  const filterMaxPrice = useMemo(() => {
    if (maxPriceStr === null || maxPriceStr === "") return null;
    const n = Number(maxPriceStr);
    return Number.isFinite(n) ? n : null;
  }, [maxPriceStr]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    if (category !== "all") {
      const selectedCategory = String(category).trim().toLowerCase();
      const childCategoryIds = getDirectChildCategoryIds(
        category,
        categories,
      ).map((id) => normalizeCategoryId(id));
      const isParentCategory = childCategoryIds.length > 0;
      const allowedCategoryIds = isParentCategory
        ? new Set(childCategoryIds)
        : new Set([selectedCategory]);

      filtered = filtered.filter((p) => {
        const categoryOfProduct = String(
          (p as any).categoryId ?? p.category ?? "",
        )
          .trim()
          .toLowerCase();
        return allowedCategoryIds.has(categoryOfProduct);
      });
    }

    if (providerParam) {
      filtered = filtered.filter((p) => {
        if (p.providerId && String(p.providerId) === providerParam) return true;
        if (selectedProviderName) {
          return (
            p.seller.trim().toLowerCase() === selectedProviderName.toLowerCase()
          );
        }
        return false;
      });
    }

    if (filterMinPrice !== null && filtered.length > 0) {
      filtered = filtered.filter((p) => p.currentPrice >= filterMinPrice);
    }
    if (filterMaxPrice !== null && filtered.length > 0) {
      filtered = filtered.filter((p) => p.currentPrice <= filterMaxPrice);
    }

    if (keyword) {
      const lower = keyword.toLowerCase();
      filtered = filtered.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(lower);
        const descMatch = p.description
          ? p.description.toLowerCase().includes(lower)
          : false;
        return nameMatch || descMatch;
      });
    }

    switch (sortBy) {
      case "bestseller":
        filtered.sort((a, b) => b.salesCount - a.salesCount);
        break;
      case "price-low":
        filtered.sort((a, b) => a.currentPrice - b.currentPrice);
        break;
      case "price-high":
        filtered.sort((a, b) => b.currentPrice - a.currentPrice);
        break;
      case "newest":
      default:
        break;
    }
    return filtered;
  }, [
    products,
    sortBy,
    keyword,
    category,
    categories,
    providerParam,
    selectedProviderName,
    filterMinPrice,
    filterMaxPrice,
  ]);

  const productsWithOverrides = useMemo(() => {
    if (!ratingOverrides || Object.keys(ratingOverrides).length === 0)
      return filteredAndSortedProducts;
    return filteredAndSortedProducts.map((p) => {
      const ov = ratingOverrides[p.id];
      return ov ? { ...p, ...ov } : p;
    });
  }, [filteredAndSortedProducts, ratingOverrides]);

  const effectiveTotalPages = useMemo(() => {
    if (hasPriceFilter) {
      return Math.max(1, Math.ceil(productsWithOverrides.length / pageSize));
    }
    return totalPages;
  }, [hasPriceFilter, productsWithOverrides.length, totalPages, pageSize]);

  const pagedProducts = useMemo(() => {
    if (hasPriceFilter) {
      const start = (pageNumber - 1) * pageSize;
      return productsWithOverrides.slice(start, start + pageSize);
    }
    return productsWithOverrides;
  }, [hasPriceFilter, pageNumber, pageSize, productsWithOverrides]);

  useEffect(() => {
    let cancelled = false;

    const targets = Array.from(new Set(pagedProducts.map((p) => p.id)))
      .map((id) => pagedProducts.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p))
      .filter((p) => (p.rating ?? 0) === 0 && (p.reviewCount ?? 0) === 0)
      .slice(0, 20);

    const load = async () => {
      const updates: Record<string, { rating: number; reviewCount: number }> =
        {};
      for (const p of targets) {
        try {
          const cacheKey = `nx_review_stats_${p.id}`;
          const cached = sessionStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached) as {
              rating: number;
              reviewCount: number;
            };
            if (
              parsed &&
              typeof parsed.rating === "number" &&
              typeof parsed.reviewCount === "number"
            ) {
              updates[p.id] = parsed;
              continue;
            }
          }

          const items = await getReviewsByProduct(p.id);
          const count = items.length;
          if (count <= 0) {
            sessionStorage.setItem(
              cacheKey,
              JSON.stringify({ rating: 0, reviewCount: 0 }),
            );
            continue;
          }
          const avg =
            items.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count;
          const next = {
            rating: Number.isFinite(avg) ? Math.round(avg * 10) / 10 : 0,
            reviewCount: count,
          };
          updates[p.id] = next;
          sessionStorage.setItem(cacheKey, JSON.stringify(next));
        } catch {
          // ignore
        }
      }

      if (cancelled) return;
      if (Object.keys(updates).length === 0) return;
      setRatingOverrides((prev) => ({ ...prev, ...updates }));
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [pagedProducts]);

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar (desktop) */}
          <div className="hidden md:block">
            <CategorySidebar activeCategory={category} />
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile category / filter bar */}
            <div className="mb-4 flex items-center justify-between gap-3 lg:hidden">
              <h1 className="text-xl font-bold text-primary-green">
                {pageTitle}
              </h1>
              <button
                type="button"
                className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white flex items-center gap-2"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Bộ lọc
              </button>
            </div>

            {/* Desktop page title */}
            <h1 className="hidden lg:block text-3xl font-bold text-primary-green mb-2">
              {pageTitle}
            </h1>
            {keyword && (
              <p className="mb-4 text-sm text-gray-600">
                Kết quả tìm kiếm cho &quot;
                <span className="font-medium">{keyword}</span>
                &quot; ({productsWithOverrides.length} sản phẩm)
              </p>
            )}

            {/* Sort Options */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSortBy(option.value)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      sortBy === option.value
                        ? "bg-primary-green text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-green text-sm"
                />
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="py-12 text-center text-gray-500">
                Đang tải sản phẩm...
              </div>
            ) : pagedProducts.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                Không tìm thấy sản phẩm.
              </div>
            ) : (
              <ProductGrid
                products={pagedProducts}
                columns={4}
                mobileColumns={2}
                showWishlist={false}
              />
            )}

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={pageNumber <= 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Trang {pageNumber} / {effectiveTotalPages}
              </span>
              <button
                onClick={() =>
                  setPageNumber((p) => Math.min(effectiveTotalPages, p + 1))
                }
                disabled={pageNumber >= effectiveTotalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>

            {/* Recently Viewed Products */}
            {filteredAndSortedProducts.length > 0 && (
              <section className="mt-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  SẢN PHẨM ĐÃ XEM
                </h2>
                <ProductGrid
                  products={productsWithOverrides.slice(0, 4)}
                  columns={4}
                  mobileColumns={2}
                  showWishlist={false}
                />
              </section>
            )}

            {/* Related News — cùng nguồn bài viết như trang /news */}
            <section className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                TIN TỨC LIÊN QUAN
              </h2>
              {relatedBlogsLoading ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  Đang tải tin tức...
                </div>
              ) : relatedBlogs.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  Chưa có tin tức.{" "}
                  <Link
                    href="/news"
                    className="text-primary-green font-medium hover:underline"
                  >
                    Xem trang tin tức
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {relatedBlogs.map((blog) => {
                    const href = getBlogExternalHref(blog);
                    const thumb = normalizeExternalUrl(blog.thumbnailUrl);
                    const cardBody = (
                      <>
                        <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                          {thumb ? (
                            <Image
                              src={thumb}
                              alt={blog.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 33vw"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-yellow-50" />
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-xs text-gray-500 mb-1 line-clamp-1">
                            {blog.source?.trim() || "Tin tức Nông Xanh"}
                          </p>
                          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm hover:text-primary-green">
                            {blog.title}
                          </h3>
                          <p className="text-xs text-gray-400">
                            {formatDate(blog.createdAt)}
                          </p>
                        </div>
                      </>
                    );
                    return href ? (
                      <Link
                        key={blog.blogId}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                      >
                        {cardBody}
                      </Link>
                    ) : (
                      <div
                        key={blog.blogId}
                        className="bg-white rounded-lg overflow-hidden shadow-sm opacity-80"
                      >
                        {cardBody}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}
