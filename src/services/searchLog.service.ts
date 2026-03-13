import { pb } from './pocketbase';
import type { SearchLog } from '../types';

const COLLECTION = 'search_logs';

function isAbortError(e: unknown): boolean {
  if (!e || typeof e !== 'object') return false;
  const err = e as { status?: number; name?: string; message?: string };
  return err.status === 0 || err.name === 'AbortError' || (err.message?.toLowerCase?.().includes?.('abort') ?? false);
}

export const searchLogService = {
  async log(query: string, tagsClicked: string[] = []): Promise<void> {
    const trimmed = (query ?? '').trim();
    if (!trimmed) return;
    const userId = pb.authStore.record?.id;
    if (!userId) return; // createRule requires auth
    const body: { query: string; user: string; tags_clicked?: string } = {
      query: trimmed,
      user: userId,
    };
    if (tagsClicked.length > 0) body.tags_clicked = tagsClicked.join(',');
    await pb.collection(COLLECTION).create(body);
  },

  /** Returns top queries, optionally filtered by year (null = all years). Min length 3 by default. */
  async getTopQueries(limit = 10, minLength = 3, year?: number | null): Promise<{ query: string; count: number }[]> {
    const filter =
      year != null && year > 0 ? `strftime('%Y', created) = "${year}"` : '';
    const counts: Record<string, number> = {};
    let page = 1;
    const perPage = 200;
    while (true) {
      const result = await pb.collection(COLLECTION).getList(page, perPage, {
        sort: 'created',
        ...(filter && { filter }),
        $autoCancel: false,
      });
      for (const item of result.items as unknown as SearchLog[]) {
        const q = (item.query || '').trim();
        if (q.length >= minLength) counts[q] = (counts[q] ?? 0) + 1;
      }
      if (result.items.length < perPage) break;
      page += 1;
    }
    return Object.entries(counts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },

  /** Search count per month (1–12). year = null means all years (aggregate by month). */
  async getSearchCountByMonth(year: number | null): Promise<{ month: number; count: number }[]> {
    const empty = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 }));
    try {
      const filter =
        year != null && year > 0
          ? `strftime('%Y', created) = "${year}"`
          : '';
      const all: { month: number; count: number }[] = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 }));
      let page = 1;
      const perPage = 200;
      while (true) {
        const result = await pb.collection(COLLECTION).getList(page, perPage, {
          ...(filter && { filter }),
          sort: 'created',
          $autoCancel: false,
        });
        for (const item of result.items as unknown as SearchLog[]) {
          const created = item.created ? new Date(item.created) : null;
          if (created) {
            const m = created.getUTCMonth() + 1;
            if (m >= 1 && m <= 12) all[m - 1].count += 1;
          }
        }
        if (result.items.length < perPage) break;
        page += 1;
      }
      return all;
    } catch (e) {
      if (isAbortError(e)) return empty;
      throw e;
    }
  },

  async getRecent(limit = 20): Promise<SearchLog[]> {
    const result = await pb.collection(COLLECTION).getList(1, limit, {
      sort: '-created',
      expand: 'user',
    });
    return result.items as unknown as SearchLog[];
  },
};
