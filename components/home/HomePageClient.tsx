"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";
import HotDealCard from "@/components/products/HotDealCard";
import type { Product } from "@/data/products";
import { useInView } from "@/lib/hooks/useInView";
import { getBlogs } from "@/lib/api/blogs";
import type { ApiBlog } from "@/lib/types/api";
import { getReviewsByProduct } from "@/lib/api/reviews";
import { getCategories } from "@/lib/api/categories";
import { getBestSellerProducts } from "@/lib/api/products";

function normalizeExternalUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed.toLowerCase() === "string") return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://"))
    return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  return trimmed;
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

function formatBlogPostDate(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const AGRISHOW_NAV_LINKS: { label: string; href: string }[] = [
  { label: "Nông Nghiệp 360", href: "/news" },
  { label: "Câu Chuyện Và Nhân Vật", href: "/news" },
  { label: "Podcast - Agrishow", href: "/news" },
  { label: "Trải Nghiệm Nông Nghiệp", href: "/news" },
  { label: "Agritech", href: "/news" },
  { label: "Nông Nghiệp Bền Vững", href: "/news" },
  { label: "Xuất Nhập Khẩu", href: "/news" },
  { label: "Trồng Cây Nuôi Con", href: "/news" },
];

interface HomePageClientProps {
  products: Product[];
}

export default function HomePageClient({ products }: HomePageClientProps) {
  const [activeTab, setActiveTab] = useState<"new" | "bestseller">("new");
  const [bestSellerFromApi, setBestSellerFromApi] = useState<Product[] | null>(
    null,
  );
  const [bestSellerLoading, setBestSellerLoading] = useState(false);
  const bestSellerLoadedRef = useRef(false);
  const [featuredBlog, setFeaturedBlog] = useState<ApiBlog | null>(null);
  const [homepageNewsBlogs, setHomepageNewsBlogs] = useState<ApiBlog[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState<string | null>(null);
  const [fruitParentCategoryId, setFruitParentCategoryId] = useState<
    string | null
  >(null);
  const [fruitChildCategories, setFruitChildCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedFruitCategoryId, setSelectedFruitCategoryId] = useState<
    "all" | string
  >("all");
  const [meatParentCategoryId, setMeatParentCategoryId] = useState<string | null>(
    null,
  );
  const [meatChildCategories, setMeatChildCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedMeatCategoryId, setSelectedMeatCategoryId] = useState<
    "all" | string
  >("all");
  const [seafoodParentCategoryId, setSeafoodParentCategoryId] = useState<
    string | null
  >(null);
  const [seafoodChildCategories, setSeafoodChildCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedSeafoodCategoryId, setSelectedSeafoodCategoryId] = useState<
    "all" | string
  >("all");
  const [dairyParentCategoryId, setDairyParentCategoryId] = useState<
    string | null
  >(null);
  const [dairyChildCategories, setDairyChildCategories] = useState<
    { id: string; name: string }[]
  >([]);
  const [selectedDairyCategoryId, setSelectedDairyCategoryId] = useState<
    "all" | string
  >("all");
  const [ratingOverrides, setRatingOverrides] = useState<
    Record<string, { rating: number; reviewCount: number }>
  >({});

  const productsWithOverrides = useMemo(() => {
    if (!ratingOverrides || Object.keys(ratingOverrides).length === 0)
      return products;
    return products.map((p) => {
      const ov = ratingOverrides[p.id];
      return ov ? { ...p, ...ov } : p;
    });
  }, [products, ratingOverrides]);

  const newProducts = useMemo(() => {
    const toTime = (iso?: string) => {
      if (!iso) return 0;
      const t = new Date(iso).getTime();
      return Number.isNaN(t) ? 0 : t;
    };
    const sorted = [...productsWithOverrides].sort(
      (a, b) => toTime(b.createdAt) - toTime(a.createdAt),
    );
    return sorted.slice(0, 8);
  }, [productsWithOverrides]);
  const bestsellerProducts = useMemo(() => {
    if (bestSellerFromApi && bestSellerFromApi.length > 0) {
      return bestSellerFromApi.slice(0, 8);
    }
    const sorted = [...productsWithOverrides].sort(
      (a, b) => (b.salesCount ?? 0) - (a.salesCount ?? 0),
    );
    return sorted.slice(0, 8);
  }, [productsWithOverrides, bestSellerFromApi]);
  const tabProducts = activeTab === "new" ? newProducts : bestsellerProducts;

  const tetProducts = useMemo(
    () => productsWithOverrides.slice(0, 10),
    [productsWithOverrides],
  );
  const fruitProducts = useMemo(() => {
    const childIds = fruitChildCategories.map((c) => c.id);
    if (childIds.length === 0) return productsWithOverrides.slice(0, 7);
    let filtered = productsWithOverrides.filter((p) =>
      childIds.includes(String(p.category)),
    );
    if (selectedFruitCategoryId !== "all") {
      filtered = filtered.filter(
        (p) => String(p.category) === selectedFruitCategoryId,
      );
    }
    return filtered.slice(0, 7);
  }, [productsWithOverrides, fruitChildCategories, selectedFruitCategoryId]);
  const meatProducts = useMemo(() => {
    const childIds = meatChildCategories.map((c) => c.id);
    if (childIds.length === 0) return productsWithOverrides.slice(0, 7);
    let filtered = productsWithOverrides.filter((p) =>
      childIds.includes(String(p.category)),
    );
    if (selectedMeatCategoryId !== "all") {
      filtered = filtered.filter((p) => String(p.category) === selectedMeatCategoryId);
    }
    return filtered.slice(0, 7);
  }, [productsWithOverrides, meatChildCategories, selectedMeatCategoryId]);
  const seafoodProducts = useMemo(() => {
    const childIds = seafoodChildCategories.map((c) => c.id);
    if (childIds.length === 0) return productsWithOverrides.slice(0, 7);
    let filtered = productsWithOverrides.filter((p) =>
      childIds.includes(String(p.category)),
    );
    if (selectedSeafoodCategoryId !== "all") {
      filtered = filtered.filter(
        (p) => String(p.category) === selectedSeafoodCategoryId,
      );
    }
    return filtered.slice(0, 7);
  }, [productsWithOverrides, seafoodChildCategories, selectedSeafoodCategoryId]);
  const dairyProducts = useMemo(() => {
    const childIds = dairyChildCategories.map((c) => c.id);
    if (childIds.length === 0) return productsWithOverrides.slice(0, 7);
    let filtered = productsWithOverrides.filter((p) =>
      childIds.includes(String(p.category)),
    );
    if (selectedDairyCategoryId !== "all") {
      filtered = filtered.filter((p) => String(p.category) === selectedDairyCategoryId);
    }
    return filtered.slice(0, 7);
  }, [productsWithOverrides, dairyChildCategories, selectedDairyCategoryId]);

  const banners = [
    "/images/homepage/homebanner1.jpg",
    "/images/homepage/homebanner2.jpg",
    "/images/homepage/homebanner3.jpg",
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  const hotDealsInView = useInView({ threshold: 0.1 });
  const tetSectionInView = useInView({ threshold: 0.1 });
  const fruitsSectionInView = useInView({ threshold: 0.1 });
  const meatsSectionInView = useInView({ threshold: 0.1 });
  const seafoodSectionInView = useInView({ threshold: 0.1 });
  const dairySectionInView = useInView({ threshold: 0.1 });
  const agrishowInView = useInView({ threshold: 0.05 });

  const handleNextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const handlePrevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [banners.length]);

  useEffect(() => {
    let cancelled = false;
    getCategories()
      .then((cats) => {
        if (cancelled) return;

        const normalize = (s?: string | null) => (s ?? "").trim().toLowerCase();

        const findParent = (names: string[]) =>
          cats.find((c) => names.includes(normalize(c.categoryName)));

        const mapChildren = (parent: any) =>
          (parent?.children ?? []).map((c: any) => ({
            id: String(c.categoryId),
            name: c.categoryName,
          }));

        const fruitParent = findParent(["trái cây"]);
        setFruitParentCategoryId(fruitParent ? String(fruitParent.categoryId) : null);
        setFruitChildCategories(mapChildren(fruitParent));

        const meatParent = findParent(["thịt"]);
        setMeatParentCategoryId(meatParent ? String(meatParent.categoryId) : null);
        setMeatChildCategories(mapChildren(meatParent));

        const seafoodParent = findParent(["cá, hải sản", "cá hải sản"]);
        setSeafoodParentCategoryId(
          seafoodParent ? String(seafoodParent.categoryId) : null,
        );
        setSeafoodChildCategories(mapChildren(seafoodParent));

        const dairyParent = findParent(["sữa"]);
        setDairyParentCategoryId(dairyParent ? String(dairyParent.categoryId) : null);
        setDairyChildCategories(mapChildren(dairyParent));
      })
      .catch(() => {
        if (cancelled) return;
        setFruitParentCategoryId(null);
        setFruitChildCategories([]);
        setMeatParentCategoryId(null);
        setMeatChildCategories([]);
        setSeafoodParentCategoryId(null);
        setSeafoodChildCategories([]);
        setDairyParentCategoryId(null);
        setDairyChildCategories([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "bestseller") return;
    if (bestSellerLoadedRef.current) return;
    bestSellerLoadedRef.current = true;

    let cancelled = false;
    setBestSellerLoading(true);
    getBestSellerProducts({ top: 12 })
      .then((list) => {
        if (cancelled) return;
        setBestSellerFromApi(list ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setBestSellerFromApi([]);
      })
      .finally(() => {
        if (!cancelled) setBestSellerLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    setFeaturedLoading(true);
    setFeaturedError(null);

    getBlogs({ pageNumber: 1, pageSize: 15 })
      .then((res) => {
        if (cancelled) return;
        const items = (res.items ?? [])
          .filter((b) => getBlogExternalHref(b))
          .slice(0, 15);
        setHomepageNewsBlogs(items);
        if (items.length > 0) {
          const randomIndex = Math.floor(Math.random() * items.length);
          setFeaturedBlog(items[randomIndex]);
        } else {
          setFeaturedBlog(null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setHomepageNewsBlogs([]);
        setFeaturedBlog(null);
        setFeaturedError(
          err instanceof Error ? err.message : "Không thể tải tin nổi bật",
        );
      })
      .finally(() => {
        if (!cancelled) setFeaturedLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // If Products API returns rating=0 but reviews exist, hydrate for homepage cards.
    let cancelled = false;

    const visibleIds = Array.from(
      new Set(
        [
          ...tabProducts,
          ...tetProducts,
          ...fruitProducts,
          ...meatProducts,
          ...seafoodProducts,
          ...dairyProducts,
        ].map((p) => p.id),
      ),
    );
    const targets = visibleIds
      .map((id) => productsWithOverrides.find((p) => p.id === id))
      .filter((p): p is Product => Boolean(p))
      // Avoid infinite loop: products with 0 reviews will stay (0,0) forever.
      // Only hydrate each product once per session (even if result is 0,0).
      .filter((p) => ratingOverrides[p.id] == null)
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
  }, [
    tabProducts,
    tetProducts,
    fruitProducts,
    meatProducts,
    seafoodProducts,
    dairyProducts,
    productsWithOverrides,
    ratingOverrides,
  ]);

  const homepageNewsMain = homepageNewsBlogs[0] ?? null;
  const homepageNewsSupplementary = homepageNewsBlogs.slice(1, 3);
  const homepageNewsMedium = homepageNewsBlogs.slice(3, 5);
  const homepageNewsMini = homepageNewsBlogs.slice(5, 10);

  return (
    <div className="bg-[#F5F5F5]">
      {/* Hero Banner Section */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 opacity-0 animate-fadeInUp">
            <div className="relative rounded-xl overflow-hidden h-[220px] sm:h-[280px] md:h-[340px] lg:h-[400px]">
              <div className="absolute inset-0">
                <div
                  className="flex h-full w-full transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {banners.map((src) => (
                    <div
                      key={src}
                      className="relative h-full w-full flex-shrink-0"
                    >
                      <Image
                        src={src}
                        alt="Nongxanh homepage banner"
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 75vw"
                        priority
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handlePrevBanner}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/70 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300"
              >
                <ChevronLeft size={24} className="text-gray-700" />
              </button>
              <button
                type="button"
                onClick={handleNextBanner}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/70 rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300"
              >
                <ChevronRight size={24} className="text-gray-700" />
              </button>
            </div>
          </div>

          <div className="hidden lg:flex flex-col space-y-3">
            <div
              className="bg-white rounded-lg overflow-hidden shadow-sm opacity-0 animate-fadeInUp hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 aspect-video"
              style={{ animationDelay: "0.2s", animationFillMode: "forwards" }}
            >
              <a href="/news" className="block">
                <div className="relative w-full h-full bg-gray-100 overflow-hidden">
                  {/* Use native img to avoid Next Image fill/layout issues */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/homepage/homebanner4.png"
                    alt="Tin nổi bật"
                    className="w-full h-full object-cover"
                    loading="eager"
                  />
                </div>
              </a>
            </div>
            <div
              className="relative rounded-lg bg-gray-100 overflow-hidden shadow-sm opacity-0 animate-fadeInUp hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-300 aspect-video"
              style={{ animationDelay: "0.3s", animationFillMode: "forwards" }}
            >
              <Image
                src="/images/homepage/homebanner5.png"
                alt="Hồng treo gió 500G - Tặng hộp 150G - giá 269K"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 400px"
              />
            </div>
          </div>
        </div>
      </section>

      {/* New & Bestseller Tabs Section */}
      <section ref={hotDealsInView.ref} className="bg-white py-4 sm:py-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 transition-all duration-700 ${hotDealsInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("new")}
                className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold text-[15px] sm:text-lg transition-colors ${
                  activeTab === "new"
                    ? "bg-[#0A923C] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                SẢN PHẨM MỚI
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("bestseller")}
                className={`px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-bold text-[15px] sm:text-lg transition-colors ${
                  activeTab === "bestseller"
                    ? "bg-[#0A923C] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                BÁN CHẠY NHẤT
              </button>
            </div>
            <Link
              href={
                activeTab === "new"
                  ? "/products?sort=newest"
                  : "/products?sort=bestseller"
              }
              className="text-gray-600 hover:text-[#0A923C] flex items-center gap-1 text-sm sm:text-base"
            >
              Xem tất cả <ChevronRight size={16} />
            </Link>
          </div>
          {activeTab === "bestseller" && bestSellerLoading && (
            <p className="mb-3 text-sm text-gray-500">Đang tải sản phẩm bán chạy...</p>
          )}
          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
              {tabProducts.map((product, i) => (
                <div
                  key={product.id}
                  className={`transition-all duration-500 ${hotDealsInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  style={{ transitionDelay: `${150 + i * 80}ms` }}
                >
                  <HotDealCard product={product} />
                </div>
              ))}
            </div>
            <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 hover:scale-110 border border-gray-200 transition-transform duration-200">
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 hover:scale-110 border border-gray-200 transition-transform duration-200">
              <ChevronRight size={24} className="text-gray-600" />
            </button>
          </div>
        </div>
      </section>

      {/* TET Collections Section */}
      <section ref={tetSectionInView.ref} className="py-6 sm:py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-1 sm:mb-4 transition-all duration-600 ${tetSectionInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              TẾT BÌNH NGỌ COLLECTIONS
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">
                Bánh/Hạt
              </button>
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">
                Khô/Thịt
              </button>
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">
                Mứt/Trái cây sấy
              </button>
              <button className="text-gray-600 hover:text-[#0A923C] text-sm font-medium">
                Trà Cà Phê
              </button>
              <Link
                href="/products?category=tet"
                className="text-gray-600 hover:text-[#0A923C] flex items-center gap-1 text-sm"
              >
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          <div
            className={`relative rounded-2xl overflow-hidden min-h-[200px] h-[220px] sm:h-[260px] mb-0 sm:mb-6 transition-all duration-600 delay-150 ${tetSectionInView.isInView ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          >
            <Image
              src="/images/homepage/homeimg3.jpg"
              alt="Tuyển chọn hương vị ngày Tết"
              fill
              className="object-contain"
              sizes="(max-width: 1400px) 100vw, 1400px"
            />
          </div>
          <div className="relative mt-1 sm:mt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
              {tetProducts.map((product, i) => (
                <div
                  key={product.id}
                  className={`transition-all duration-500 ${tetSectionInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  style={{ transitionDelay: `${200 + i * 50}ms` }}
                >
                  <ProductCard product={product} showWishlist={false} />
                </div>
              ))}
            </div>
            <button className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 hover:scale-110 border border-gray-200 transition-transform duration-200">
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 hover:scale-110 border border-gray-200 transition-transform duration-200">
              <ChevronRight size={24} className="text-gray-600" />
            </button>
          </div>
        </div>
      </section>

      {/* Fresh Fruits Section */}
      <section ref={fruitsSectionInView.ref} className="py-6 sm:py-8 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-1 sm:mb-4 transition-all duration-600 ${fruitsSectionInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              TRÁI CÂY TƯƠI NGON
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              {fruitChildCategories.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedFruitCategoryId("all")}
                  className={`text-sm font-medium transition-colors ${
                    selectedFruitCategoryId === "all"
                      ? "text-[#0A923C]"
                      : "text-gray-600 hover:text-[#0A923C]"
                  }`}
                >
                  Tất cả
                </button>
              )}
              {fruitChildCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedFruitCategoryId(c.id)}
                  className={`text-sm font-medium transition-colors ${
                    selectedFruitCategoryId === c.id
                      ? "text-[#0A923C]"
                      : "text-gray-600 hover:text-[#0A923C]"
                  }`}
                >
                  {c.name}
                </button>
              ))}
              <Link
                href={
                  fruitParentCategoryId
                    ? `/products?category=${encodeURIComponent(fruitParentCategoryId)}`
                    : "/products?category=fruits"
                }
                className="text-gray-600 hover:text-[#0A923C] flex items-center gap-1 text-sm"
              >
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          <div
            className={`relative rounded-2xl overflow-hidden min-h-[200px] h-[220px] sm:h-[260px] mb-0 sm:mb-6 transition-all duration-600 delay-150 ${fruitsSectionInView.isInView ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
          >
            <Image
              src="/images/homepage/homeimg4.png"
              alt="Trái cây tươi ngon"
              fill
              className="object-contain"
              sizes="(max-width: 1400px) 100vw, 1400px"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mt-1 sm:mt-0">
            {fruitProducts.map((product, i) => (
              <div
                key={product.id}
                className={`transition-all duration-500 ${fruitsSectionInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${200 + i * 50}ms` }}
              >
                <ProductCard product={product} showWishlist={false} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fresh Meat Section */}
      <section ref={meatsSectionInView.ref} className="py-6 sm:py-8 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-1 sm:mb-4 transition-all duration-600 ${meatsSectionInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              THỊT TƯƠI NGON
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              {meatChildCategories.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedMeatCategoryId("all")}
                  className={`text-sm font-medium transition-colors ${
                    selectedMeatCategoryId === "all"
                      ? "text-[#0A923C]"
                      : "text-gray-600 hover:text-[#0A923C]"
                  }`}
                >
                  Tất cả
                </button>
              )}
              {meatChildCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedMeatCategoryId(c.id)}
                  className={`text-sm font-medium transition-colors ${
                    selectedMeatCategoryId === c.id
                      ? "text-[#0A923C]"
                      : "text-gray-600 hover:text-[#0A923C]"
                  }`}
                >
                  {c.name}
                </button>
              ))}
              <Link
                href={
                  meatParentCategoryId
                    ? `/products?category=${encodeURIComponent(meatParentCategoryId)}`
                    : "/products?category=meat"
                }
                className="text-gray-600 hover:text-[#0A923C] flex items-center gap-1 text-sm"
              >
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mt-1 sm:mt-0">
            {meatProducts.map((product, i) => (
              <div
                key={product.id}
                className={`transition-all duration-500 ${meatsSectionInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${200 + i * 50}ms` }}
              >
                <ProductCard product={product} showWishlist={false} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fresh Seafood Section */}
      <section ref={seafoodSectionInView.ref} className="py-6 sm:py-8 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-1 sm:mb-4 transition-all duration-600 ${seafoodSectionInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              CÁ, HẢI SẢN TƯƠI NGON
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              {seafoodChildCategories.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedSeafoodCategoryId("all")}
                  className={`text-sm font-medium transition-colors ${
                    selectedSeafoodCategoryId === "all"
                      ? "text-[#0A923C]"
                      : "text-gray-600 hover:text-[#0A923C]"
                  }`}
                >
                  Tất cả
                </button>
              )}
              {seafoodChildCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedSeafoodCategoryId(c.id)}
                  className={`text-sm font-medium transition-colors ${
                    selectedSeafoodCategoryId === c.id
                      ? "text-[#0A923C]"
                      : "text-gray-600 hover:text-[#0A923C]"
                  }`}
                >
                  {c.name}
                </button>
              ))}
              <Link
                href={
                  seafoodParentCategoryId
                    ? `/products?category=${encodeURIComponent(seafoodParentCategoryId)}`
                    : "/products?category=seafood"
                }
                className="text-gray-600 hover:text-[#0A923C] flex items-center gap-1 text-sm"
              >
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mt-1 sm:mt-0">
            {seafoodProducts.map((product, i) => (
              <div
                key={product.id}
                className={`transition-all duration-500 ${seafoodSectionInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${200 + i * 50}ms` }}
              >
                <ProductCard product={product} showWishlist={false} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dairy Section */}
      <section ref={dairySectionInView.ref} className="py-6 sm:py-8 bg-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-1 sm:mb-4 transition-all duration-600 ${dairySectionInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              SỮA TƯƠI NGON
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
              {dairyChildCategories.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDairyCategoryId("all")}
                  className={`text-sm font-medium transition-colors ${
                    selectedDairyCategoryId === "all"
                      ? "text-[#0A923C]"
                      : "text-gray-600 hover:text-[#0A923C]"
                  }`}
                >
                  Tất cả
                </button>
              )}
              {dairyChildCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedDairyCategoryId(c.id)}
                  className={`text-sm font-medium transition-colors ${
                    selectedDairyCategoryId === c.id
                      ? "text-[#0A923C]"
                      : "text-gray-600 hover:text-[#0A923C]"
                  }`}
                >
                  {c.name}
                </button>
              ))}
              <Link
                href={
                  dairyParentCategoryId
                    ? `/products?category=${encodeURIComponent(dairyParentCategoryId)}`
                    : "/products?category=dairy"
                }
                className="text-gray-600 hover:text-[#0A923C] flex items-center gap-1 text-sm"
              >
                Xem tất cả <ChevronRight size={16} />
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 mt-1 sm:mt-0">
            {dairyProducts.map((product, i) => (
              <div
                key={product.id}
                className={`transition-all duration-500 ${dairySectionInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                style={{ transitionDelay: `${200 + i * 50}ms` }}
              >
                <ProductCard product={product} showWishlist={false} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agrishow Section — layout: sidebar | bài lớn + tin phụ | 2 thẻ medium | 5 tin mini */}
      <section ref={agrishowInView.ref} className="py-8">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-8">
          <div
            className={`rounded-lg border border-gray-200 bg-white p-4 sm:p-5 shadow-sm transition-all duration-700 ${agrishowInView.isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-5">
              {/* Cột 1: AGRISHOW */}
              <aside className="lg:col-span-2">
                <div className="rounded-lg border border-gray-100 overflow-hidden bg-white h-full min-h-[200px]">
                  <div className="bg-[#0A923C] px-3 py-3 sm:py-4">
                    <h3 className="text-center text-sm font-bold uppercase tracking-wide text-white sm:text-base">
                      AGRISHOW
                    </h3>
                  </div>
                  <nav className="px-3 py-3 sm:px-4 sm:py-4">
                    <ul className="space-y-2.5 text-sm text-gray-800">
                      {AGRISHOW_NAV_LINKS.map((item) => (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            className="hover:text-[#0A923C] transition-colors"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </aside>

              {/* Cột 2: Bài chính + 2 dòng tin phụ */}
              <div className="lg:col-span-5 flex flex-col">
                <div className="rounded-lg border border-gray-100 overflow-hidden bg-white flex-1 flex flex-col">
                  {featuredLoading ? (
                    <div className="animate-pulse">
                      <div className="aspect-[16/9] max-h-[320px] bg-gray-100" />
                      <div className="p-4 space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-[92%]" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="h-3 bg-gray-100 rounded w-2/3" />
                      </div>
                    </div>
                  ) : homepageNewsMain &&
                    getBlogExternalHref(homepageNewsMain) ? (
                    <>
                      <a
                        href={getBlogExternalHref(homepageNewsMain) ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block shrink-0"
                      >
                        <div className="relative aspect-[16/9] max-h-[320px] w-full bg-gray-100">
                          {normalizeExternalUrl(
                            homepageNewsMain.thumbnailUrl,
                          ) ? (
                            <Image
                              src={
                                normalizeExternalUrl(
                                  homepageNewsMain.thumbnailUrl,
                                ) as string
                              }
                              alt={homepageNewsMain.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 1024px) 100vw, 620px"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-amber-100" />
                          )}
                        </div>
                      </a>
                      <div className="p-4 flex-1 flex flex-col">
                        <a
                          href={getBlogExternalHref(homepageNewsMain) ?? "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <h4 className="text-base sm:text-lg font-bold text-gray-900 leading-snug line-clamp-3 hover:text-[#0A923C]">
                            {homepageNewsMain.title}
                          </h4>
                        </a>
                        <p className="mt-2 text-xs text-gray-500">
                          {homepageNewsMain.authorName ||
                          homepageNewsMain.source
                            ? `Đăng bởi ${homepageNewsMain.authorName || homepageNewsMain.source || "NongXanh"}`
                            : "Đăng bởi NongXanh"}
                          {formatBlogPostDate(
                            homepageNewsMain.createdAt ||
                              homepageNewsMain.updatedAt,
                          )
                            ? ` ngày ${formatBlogPostDate(homepageNewsMain.createdAt || homepageNewsMain.updatedAt)}`
                            : ""}
                        </p>
                        {homepageNewsSupplementary.length > 0 && (
                          <div className="mt-4 border-t border-gray-200 pt-1">
                            {homepageNewsSupplementary.map((blog, idx) => {
                              const href = getBlogExternalHref(blog);
                              if (!href) return null;
                              return (
                                <a
                                  key={blog.blogId}
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`block py-3 text-sm font-medium text-gray-800 hover:text-[#0A923C] ${idx < homepageNewsSupplementary.length - 1 ? "border-b border-gray-100" : ""}`}
                                >
                                  {blog.title}
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-6 flex-1 flex flex-col justify-center">
                      <p className="text-sm text-gray-600 mb-3">
                        {featuredError
                          ? "Không thể tải tin tức từ hệ thống."
                          : "Chưa có tin tức hiển thị."}
                      </p>
                      <Link
                        href="/news"
                        className="text-sm text-[#0A923C] hover:underline"
                      >
                        Xem thêm tin tức tại NongXanh
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Cột 3: 2 thẻ medium */}
              <div className="lg:col-span-3 flex flex-col gap-4">
                {featuredLoading ? (
                  <>
                    <div className="rounded-lg border border-gray-100 overflow-hidden animate-pulse">
                      <div className="h-[140px] bg-gray-100" />
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full" />
                        <div className="h-4 bg-gray-100 rounded w-5/6" />
                      </div>
                    </div>
                    <div className="rounded-lg border border-gray-100 overflow-hidden animate-pulse">
                      <div className="h-[140px] bg-gray-100" />
                      <div className="p-3 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full" />
                      </div>
                    </div>
                  </>
                ) : (
                  homepageNewsMedium.map((blog) => {
                    const href = getBlogExternalHref(blog);
                    const thumb = normalizeExternalUrl(blog.thumbnailUrl);
                    if (!href) return null;
                    return (
                      <a
                        key={blog.blogId}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg border border-gray-100 overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="relative h-[140px] w-full bg-gray-100">
                          {thumb ? (
                            <Image
                              src={thumb}
                              alt={blog.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 1024px) 100vw, 360px"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-sky-50" />
                          )}
                        </div>
                        <div className="p-3">
                          <h4 className="text-sm font-bold text-gray-900 line-clamp-3 leading-snug hover:text-[#0A923C]">
                            {blog.title}
                          </h4>
                        </div>
                      </a>
                    );
                  })
                )}
              </div>

              {/* Cột 4: 5 tin nhỏ (thumb + title) */}
              <div className="lg:col-span-2 flex flex-col gap-3 justify-start">
                {featuredLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex gap-2 animate-pulse">
                      <div className="w-[72px] h-[72px] shrink-0 rounded-md bg-gray-100" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-3 bg-gray-200 rounded w-full" />
                        <div className="h-3 bg-gray-100 rounded w-4/5" />
                      </div>
                    </div>
                  ))
                ) : homepageNewsMini.length > 0 ? (
                  homepageNewsMini.map((blog) => {
                    const href = getBlogExternalHref(blog);
                    const thumb = normalizeExternalUrl(blog.thumbnailUrl);
                    if (!href) return null;
                    return (
                      <a
                        key={blog.blogId}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex gap-2.5 group min-h-[72px]"
                      >
                        <div className="relative w-[72px] h-[72px] shrink-0 overflow-hidden rounded-md bg-gray-100">
                          {thumb ? (
                            <Image
                              src={thumb}
                              alt={blog.title}
                              fill
                              className="object-cover"
                              sizes="72px"
                              unoptimized
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100" />
                          )}
                        </div>
                        <p className="text-xs sm:text-[13px] text-gray-800 leading-snug group-hover:text-[#0A923C] line-clamp-3">
                          {blog.title}
                        </p>
                      </a>
                    );
                  })
                ) : (
                  <Link href="/news" className="flex gap-2.5 group">
                    <div className="w-[72px] h-[72px] shrink-0 rounded-md bg-gradient-to-br from-green-100 to-blue-100" />
                    <p className="text-xs text-gray-700 group-hover:text-[#0A923C] line-clamp-3">
                      Khám phá thêm các bài viết mới nhất tại mục Tin tức.
                    </p>
                  </Link>
                )}
              </div>
            </div>
            <div className="mt-4 text-right border-t border-gray-100 pt-3">
              <Link
                href="/news"
                className="text-sm font-medium text-[#0A923C] hover:underline"
              >
                Xem tất cả tin tức
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
