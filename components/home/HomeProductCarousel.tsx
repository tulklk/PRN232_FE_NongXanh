"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Một hàng sản phẩm cuộn ngang, có nút trái/phải (smooth scroll).
 * Mỗi item nên bọc trong HomeProductCarouselSlide.
 */
export function HomeProductCarousel({
  children,
  className = "",
  "aria-label": ariaLabel = "Danh sách sản phẩm",
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    setCanPrev(scrollLeft > 4);
    setCanNext(scrollLeft < max - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(() => updateArrows());
    ro.observe(el);
    const mo = new MutationObserver(() => {
      requestAnimationFrame(updateArrows);
    });
    mo.observe(el, { childList: true, subtree: true });
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
      mo.disconnect();
    };
  }, [updateArrows]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el) return;
    const step = Math.max(280, Math.floor(el.clientWidth * 0.72));
    el.scrollBy({
      left: dir === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  const btnClass =
    "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white p-0 text-gray-700 shadow-md transition hover:border-[#0A923C] hover:bg-[#f0fdf4] hover:text-[#0A923C] disabled:pointer-events-none disabled:opacity-25";

  return (
    <div
      className={`relative px-2 sm:px-10 md:px-12 ${className}`}
      role="region"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        aria-label="Cuộn trái"
        onClick={() => scroll("left")}
        disabled={!canPrev}
        className={`${btnClass} left-0 sm:left-1`}
      >
        <ChevronLeft size={22} strokeWidth={2.2} />
      </button>
      <div
        ref={scrollerRef}
        className="flex flex-nowrap gap-2 overflow-x-auto overflow-y-hidden scroll-smooth pb-1 sm:gap-4 sm:pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
      <button
        type="button"
        aria-label="Cuộn phải"
        onClick={() => scroll("right")}
        disabled={!canNext}
        className={`${btnClass} right-0 sm:right-1`}
      >
        <ChevronRight size={22} strokeWidth={2.2} />
      </button>
    </div>
  );
}

/** Chiều rộng cố định từng thẻ trong carousel (một hàng, không wrap). */
export function HomeProductCarouselSlide({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex-[0_0_auto] w-[min(240px,calc(50vw-1.25rem))] sm:w-[200px] md:w-[220px] lg:w-[240px] ${className}`}
    >
      {children}
    </div>
  );
}
