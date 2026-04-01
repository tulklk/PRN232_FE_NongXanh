"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Send, X } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { getChatDiagnostic, sendChatMessage } from "@/lib/api/chat";
import { getProducts } from "@/lib/api/products";
import { getReviewsByProduct } from "@/lib/api/reviews";
import { formatCurrency } from "@/lib/utils";
import type { Product } from "@/data/products";
import RatingStars from "@/components/common/RatingStars";

type ChatRole = "bot" | "user";

type MiniProduct = Pick<
  Product,
  "id" | "name" | "image" | "currentPrice" | "rating" | "reviewCount"
>;

interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  time: string;
  products?: MiniProduct[];
}

const initialMessages: ChatMessage[] = [
  {
    id: "bot-1",
    role: "bot",
    text: "Xin chào! Mình là trợ lý của Nông Xanh. Bạn cần hỗ trợ gì hôm nay?",
    time: "Vừa xong",
  },
  {
    id: "bot-2",
    role: "bot",
    text: "Bạn có thể hỏi về sản phẩm, đơn hàng, voucher hoặc chính sách giao hàng.",
    time: "Vừa xong",
  },
];

const suggestedPrompts = [
  "Có voucher nào đang áp dụng hôm nay?",
  "Phí ship và thời gian giao hàng thế nào?",
  "Gợi ý sản phẩm bán chạy nhất giúp mình.",
];

function stripDiacritics(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function normalizeForMatch(input: string): string {
  return (
    stripDiacritics(input)
      .toLowerCase()
      .replace(/[_*`~]/g, " ")
      // Avoid unicode property escapes for older TS targets.
      .replace(/[^a-z0-9\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function extractCandidateProductNames(aiText: string, limit = 5): string[] {
  const text = (aiText ?? "").trim();
  if (!text) return [];

  // Split by common separators seen in AI replies.
  const rawLines = text
    .split(/\r?\n| - |\s-\s|\s•\s|\s\|\s/gi)
    .map((l) => l.trim())
    .filter(Boolean);

  const candidates: string[] = [];
  const seen = new Set<string>();

  for (const line of rawLines) {
    if (candidates.length >= limit) break;

    // Remove leading list markers.
    const cleaned = line.replace(/^[-•\d.)\s]+/g, "").trim();
    if (!cleaned) continue;

    // Heuristic: take text before ':' as name, otherwise take full line.
    const beforeColon = cleaned.includes(":")
      ? cleaned.split(":")[0].trim()
      : cleaned;

    // Remove trailing price fragments like "65000 đ", "65.000đ", "65000 vnd".
    const nameOnly = beforeColon
      .replace(/\b\d[\d.\s]*\s*(đ|d|vnd|vnđ)\b/gi, "")
      .replace(/\b(price|giá)\b/gi, "")
      .trim();

    if (nameOnly.length < 3) continue;

    const key = normalizeForMatch(nameOnly);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    candidates.push(nameOnly);
  }

  return candidates;
}

export default function ChatWidget() {
  const { user, tokens } = useUser();
  const [open, setOpen] = useState(false);
  const [renderPanel, setRenderPanel] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const [diagnosticChecked, setDiagnosticChecked] = useState(false);
  const [isAiAvailable, setIsAiAvailable] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(true);

  const productCacheRef = useRef<Product[] | null>(null);
  const productCachePromiseRef = useRef<Promise<Product[]> | null>(null);

  const canSend = !isSending && input.trim().length > 0;
  const userDisplayName = user?.displayName?.trim() || "User";
  const userInitial = userDisplayName.charAt(0).toUpperCase() || "U";

  const groupedMessages = useMemo(() => messages, [messages]);

  const buildHistoryPayload = (history: ChatMessage[]) =>
    history.slice(-12).map((msg) => ({
      role: msg.role === "bot" ? "assistant" : "user",
      content: msg.text,
    }));

  const ensureProductsCache = async (): Promise<Product[]> => {
    if (productCacheRef.current) return productCacheRef.current;
    if (productCachePromiseRef.current) return productCachePromiseRef.current;
    productCachePromiseRef.current = getProducts({
      pageNumber: 1,
      pageSize: 200,
    })
      .then((res) => {
        productCacheRef.current = res.items ?? [];
        return productCacheRef.current;
      })
      .catch(() => {
        productCacheRef.current = [];
        return [];
      })
      .finally(() => {
        productCachePromiseRef.current = null;
      });
    return productCachePromiseRef.current;
  };

  const ensureReviewStats = async (
    productId: string,
  ): Promise<{ rating: number; reviewCount: number }> => {
    const cacheKey = `nx_review_stats_${productId}`;
    try {
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
          return parsed;
        }
      }
    } catch {
      // ignore cache errors
    }

    try {
      const items = await getReviewsByProduct(productId);
      const count = items.length;
      if (count <= 0) {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ rating: 0, reviewCount: 0 }),
        );
        return { rating: 0, reviewCount: 0 };
      }
      const avg =
        items.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count;
      const next = {
        rating: Number.isFinite(avg) ? Math.round(avg * 10) / 10 : 0,
        reviewCount: count,
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(next));
      return next;
    } catch {
      return { rating: 0, reviewCount: 0 };
    }
  };

  const matchProductsByNames = async (
    names: string[],
  ): Promise<MiniProduct[]> => {
    if (!names || names.length === 0) return [];
    const all = await ensureProductsCache();
    if (!all || all.length === 0) return [];

    const normalizedAll = all.map((p) => ({
      p,
      key: normalizeForMatch(p.name),
    }));

    const picked: MiniProduct[] = [];
    const pickedIds = new Set<string>();

    for (const name of names) {
      const key = normalizeForMatch(name);
      if (!key) continue;

      const exact = normalizedAll.find((x) => x.key === key);
      const starts = normalizedAll.find((x) => x.key.startsWith(key));
      const includes = normalizedAll.find((x) => x.key.includes(key));
      const found = exact?.p ?? starts?.p ?? includes?.p ?? null;
      if (!found) continue;
      if (pickedIds.has(found.id)) continue;
      pickedIds.add(found.id);
      picked.push({
        id: found.id,
        name: found.name,
        image: found.image,
        currentPrice: found.currentPrice,
        rating: found.rating,
        reviewCount: found.reviewCount,
      });
      if (picked.length >= 5) break;
    }

    // Ensure rating/reviewCount like homepage cards when API returns 0/0.
    const enriched = await Promise.all(
      picked.map(async (p) => {
        if ((p.rating ?? 0) > 0 || (p.reviewCount ?? 0) > 0) return p;
        const stats = await ensureReviewStats(p.id);
        return { ...p, ...stats };
      }),
    );

    return enriched;
  };

  const handleSend = async (prefilledText?: string) => {
    const value = (prefilledText ?? input).trim();
    if (!value || isSending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: value,
      time: "Vừa xong",
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setShowSuggestions(false);
    setIsSending(true);
    try {
      const result = await sendChatMessage(
        {
          message: value,
          messages: buildHistoryPayload(nextMessages),
        },
        tokens?.idToken,
      );

      const candidateNames = extractCandidateProductNames(result.text, 5);
      const matchedProducts =
        candidateNames.length > 0
          ? await matchProductsByNames(candidateNames)
          : [];

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: "bot",
        text: result.text,
        time: "Vừa xong",
        ...(matchedProducts.length > 0 ? { products: matchedProducts } : {}),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsAiAvailable(true);
    } catch (error) {
      const fallbackMessage: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: "bot",
        text:
          error instanceof Error
            ? `Xin lỗi, hiện chưa thể phản hồi: ${error.message}`
            : "Xin lỗi, hệ thống AI đang bận. Bạn vui lòng thử lại sau.",
        time: "Vừa xong",
      };
      setMessages((prev) => [...prev, fallbackMessage]);
      setIsAiAvailable(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    if (isSending) return;
    handleSend(prompt);
  };

  const handleTogglePanel = () => {
    if (open) {
      setOpen(false);
      setTimeout(() => {
        setRenderPanel(false);
      }, 260);
      return;
    }
    setRenderPanel(true);
    // Trigger enter animation after mount.
    requestAnimationFrame(() => {
      setOpen(true);
    });
  };

  useEffect(() => {
    if (!open || diagnosticChecked) return;
    let cancelled = false;
    getChatDiagnostic(tokens?.idToken)
      .then(() => {
        if (cancelled) return;
        setIsAiAvailable(true);
      })
      .catch(() => {
        if (cancelled) return;
        setIsAiAvailable(false);
      })
      .finally(() => {
        if (cancelled) return;
        setDiagnosticChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, diagnosticChecked, tokens?.idToken]);

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={handleTogglePanel}
          aria-label="Mở khung chat"
          className="fixed bottom-6 right-6 z-[70] inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#73C66B] shadow-lg transition-all duration-300 hover:scale-110 hover:bg-[#5fb657] active:scale-95 animate-[chatPulse_2.2s_ease-in-out_infinite]"
        >
          <Image
            src="/images/chatbox/chatboxicon.png"
            alt="AI chat"
            width={56}
            height={56}
            className="h-full w-full rounded-full object-cover transition-transform duration-300 scale-[1.35]"
          />
        </button>
      )}

      {renderPanel && (
        <div
          className={`fixed bottom-24 right-4 z-[80] w-[calc(100vw-2rem)] max-w-[360px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 ease-out sm:right-6 sm:w-[360px] ${
            open
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none translate-y-5 scale-90 opacity-0"
          }`}
        >
          <div className="flex items-center justify-between bg-[#0A923C] px-4 py-3 text-white">
            <div className="flex items-center gap-2.5">
              <Image
                src="/images/chatbox/chatboxicon.png"
                alt="AI chat avatar"
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold">Trợ lý Nông Xanh</p>
                <p className="text-[11px] text-green-100">
                  Online - Trả lời nhanh
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTogglePanel}
              className="rounded p-1 hover:bg-white/15 transition-colors"
              aria-label="Đóng chat"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[430px] min-h-[350px] overflow-y-auto bg-gray-50 px-3 py-3">
            {!isAiAvailable && (
              <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                Kết nối AI đang gián đoạn. Tin nhắn vẫn được gửi thử lại tự động
                ở lần kế tiếp.
              </div>
            )}
            <div className="space-y-3">
              {groupedMessages.map((message) => {
                const isUser = message.role === "user";
                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <Image
                        src="/images/chatbox/chatboxicon.png"
                        alt="AI"
                        width={32}
                        height={32}
                        className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                      />
                    )}
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 shadow-sm ${
                        isUser
                          ? "bg-[#0A923C] text-sm text-white rounded-br-sm"
                          : "bg-white text-[13px] text-gray-700 border border-gray-200 rounded-bl-sm"
                      }`}
                    >
                      <p>{message.text}</p>
                      {message.role === "bot" &&
                        message.products &&
                        message.products.length > 0 && (
                          <div className="mt-2 grid grid-cols-1 gap-2">
                            {message.products.map((p) => (
                              <Link
                                key={p.id}
                                href={`/products/${p.id}`}
                                className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2 py-2 hover:border-[#0A923C] hover:shadow-sm transition-colors"
                              >
                                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                                  <Image
                                    src={p.image}
                                    alt={p.name}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="line-clamp-1 text-[12px] font-semibold text-gray-900">
                                    {p.name}
                                  </div>
                                  <div className="mt-0.5 flex items-center gap-1.5">
                                    <RatingStars
                                      rating={p.rating}
                                      size={12}
                                      showNumber
                                    />
                                    <span className="text-[11px] text-gray-500">
                                      ({p.reviewCount})
                                    </span>
                                  </div>
                                  <div className="mt-0.5 text-[12px] font-bold text-[#0A923C]">
                                    {formatCurrency(p.currentPrice)}
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      <p
                        className={`mt-1 text-[10px] ${
                          isUser ? "text-green-100" : "text-gray-400"
                        }`}
                      >
                        {message.time}
                      </p>
                    </div>
                    {isUser && (
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#dff3dc] text-xs font-semibold text-[#0A923C]">
                        {userInitial}
                      </div>
                    )}
                  </div>
                );
              })}
              {isSending && (
                <div className="flex items-end gap-2 justify-start">
                  <Image
                    src="/images/chatbox/chatboxicon.png"
                    alt="AI"
                    width={32}
                    height={32}
                    className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                  />
                  <div className="max-w-[85%] rounded-xl rounded-bl-sm border border-gray-200 bg-white px-3 py-2 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] text-gray-600">
                        Đang trả lời
                      </span>
                      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gray-400" />
                      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gray-400 [animation-delay:0.15s]" />
                      <span className="typing-dot h-1.5 w-1.5 rounded-full bg-gray-400 [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 bg-white p-2.5">
            {showSuggestions && (
              <div className="mb-2 flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => handleSuggestionClick(prompt)}
                    disabled={isSending}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700 transition-colors hover:border-[#0A923C] hover:text-[#0A923C] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Nhập tin nhắn..."
                className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none transition-colors focus:border-[#0A923C] focus:ring-2 focus:ring-[#0A923C]/20"
              />
              <button
                type="button"
                onClick={() => {
                  void handleSend();
                }}
                disabled={!canSend}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#0A923C] text-white transition-colors hover:bg-[#087a32] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Gửi tin nhắn"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes chatPulse {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }
        @keyframes typingBounce {
          0%,
          80%,
          100% {
            transform: translateY(0);
            opacity: 0.35;
          }
          40% {
            transform: translateY(-3px);
            opacity: 1;
          }
        }
        .typing-dot {
          animation: typingBounce 1.05s infinite ease-in-out;
        }
      `}</style>
    </>
  );
}
