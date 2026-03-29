export interface NotificationDto {
  id?: string;
  notificationId?: string;
  title?: string;
  content?: string;
  message?: string;
  type?: string;
  Type?: string;
  isRead?: boolean;
  createdAt?: string;
  [k: string]: unknown;
}

export interface NotificationsPagedDto {
  items?: NotificationDto[];
  totalCount?: number;
  pageNumber?: number;
  pageSize?: number;
  totalPages?: number;
  [k: string]: unknown;
}

export interface NotificationModel {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsPagedModel {
  items: NotificationModel[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages?: number;
}

const getBase = () =>
  typeof window !== "undefined"
    ? ""
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

function getHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function unwrapPaged(json: unknown): NotificationsPagedDto {
  if (!json || typeof json !== "object") return {};
  const o = json as Record<string, unknown>;
  if (Array.isArray(o.items)) return o as unknown as NotificationsPagedDto;
  const data = o.data;
  if (data && typeof data === "object") return data as NotificationsPagedDto;
  return o as NotificationsPagedDto;
}

export function mapNotificationDto(dto: NotificationDto): NotificationModel {
  const id = String(dto.id ?? dto.notificationId ?? "");
  return {
    id,
    title: String(dto.title ?? ""),
    content: String(dto.content ?? dto.message ?? ""),
    type: String(dto.type ?? dto.Type ?? ""),
    isRead: Boolean(dto.isRead),
    createdAt: String(dto.createdAt ?? new Date().toISOString()),
  };
}

export async function getNotifications(
  params: { pageNumber?: number; pageSize?: number },
  token?: string,
): Promise<NotificationsPagedModel> {
  const search = new URLSearchParams();
  if (params.pageNumber) search.set("pageNumber", String(params.pageNumber));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));

  const res = await fetch(
    `${getBase()}/api/notifications?${search.toString()}`,
    {
      headers: getHeaders(token),
      cache: "no-store",
    },
  );
  const json = (await res.json().catch(() => ({}))) as unknown;
  if (!res.ok) {
    const err = json as { error?: string; message?: string };
    throw new Error(err.error || err.message || "Không thể tải thông báo");
  }

  const dto = unwrapPaged(json);
  const items = (dto.items ?? []).map(mapNotificationDto);
  return {
    items,
    totalCount: Number(dto.totalCount ?? items.length) || 0,
    pageNumber: Number(dto.pageNumber ?? params.pageNumber ?? 1) || 1,
    pageSize: Number(dto.pageSize ?? params.pageSize ?? 10) || 10,
    totalPages: dto.totalPages,
  };
}

export async function markNotificationRead(
  id: string,
  token?: string,
): Promise<void> {
  const res = await fetch(
    `${getBase()}/api/notifications/${encodeURIComponent(id)}/read`,
    {
      method: "PATCH",
      headers: getHeaders(token),
    },
  );
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      (json.error as string) ||
        (json.message as string) ||
        "Không thể đánh dấu đã đọc",
    );
  }
}

export async function deleteNotification(
  id: string,
  token?: string,
): Promise<void> {
  const res = await fetch(
    `${getBase()}/api/notifications/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
      headers: getHeaders(token),
    },
  );
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(
      (json.error as string) || (json.message as string) || "Không thể xóa",
    );
  }
}

const UNREAD_PAGE_SIZE = 100;
const UNREAD_MAX_PAGES = 30;
const READ_ALL_PAGE_SIZE = 50;
const READ_ALL_MAX_PAGES = 30;
const READ_ALL_CONCURRENCY = 10;

/** Đếm thông báo chưa đọc (duyệt theo trang cho đến khi hết dữ liệu). */
export async function getUnreadNotificationCount(
  token?: string,
): Promise<number> {
  let unread = 0;
  let page = 1;
  for (;;) {
    const res = await getNotifications(
      { pageNumber: page, pageSize: UNREAD_PAGE_SIZE },
      token,
    );
    unread += res.items.filter((n) => !n.isRead).length;
    const fetched = res.items.length;
    const total = res.totalCount;
    if (fetched < UNREAD_PAGE_SIZE) break;
    if (total > 0 && page * UNREAD_PAGE_SIZE >= total) break;
    page += 1;
    if (page > UNREAD_MAX_PAGES) break;
  }
  return unread;
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;
  const runners = Array.from({ length: Math.max(1, limit) }, async () => {
    for (;;) {
      const current = idx;
      idx += 1;
      if (current >= items.length) break;
      results[current] = await worker(items[current]);
    }
  });
  await Promise.all(runners);
  return results;
}

/** Đánh dấu đã đọc toàn bộ thông báo (duyệt theo trang rồi PATCH từng id chưa đọc). */
export async function markAllNotificationsRead(token?: string): Promise<void> {
  if (!token) return;
  let page = 1;
  for (;;) {
    const res = await getNotifications(
      { pageNumber: page, pageSize: READ_ALL_PAGE_SIZE },
      token,
    );

    const unreadIds = res.items.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length > 0) {
      await mapLimit(unreadIds, READ_ALL_CONCURRENCY, async (id) => {
        try {
          await markNotificationRead(id, token);
        } catch {
          // ignore individual failures
        }
      });
    }

    const fetched = res.items.length;
    const total = res.totalCount;
    if (fetched < READ_ALL_PAGE_SIZE) break;
    if (total > 0 && page * READ_ALL_PAGE_SIZE >= total) break;
    page += 1;
    if (page > READ_ALL_MAX_PAGES) break;
  }
}
