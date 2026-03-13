import { createEffect, createSignal, onMount } from 'solid-js';

const DEBOUNCE_MS = 350;

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  return ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = undefined;
      fn(...args);
    }, ms);
  }) as T;
}
import { useSearchParams } from '@solidjs/router';
import SearchBar from '../components/SearchBar';
import TagFilters from '../components/TagFilters';
import CapstoneCard from '../components/CapstoneCard';
import { Skeleton, SkeletonCardGrid } from '../components/Skeleton';
import { capstoneService } from '../services/capstone.service';
import { tagService } from '../services/tag.service';
import { searchLogService } from '../services/searchLog.service';
import { auth } from '../stores/authStore';
import { capstoneState, setCapstones, setCapstoneLoading } from '../stores/capstoneStore';
import { searchState, setSearchQuery, toggleTagId, clearFilters, setYearFrom, setYearTo } from '../stores/searchStore';
import type { Tag } from '../types';

const PER_PAGE = 20;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tags, setTags] = createSignal<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = createSignal(true);
  const [page, setPage] = createSignal(1);

  onMount(async () => {
    const list = await tagService.getList();
    setTags(list);
    setTagsLoading(false);
  });

  const runSearch = async () => {
    setCapstoneLoading(true);
    try {
      const { items, total } = await capstoneService.search({
        query: searchState.query,
        tagIds: searchState.selectedTagIds,
        yearFrom: searchState.yearFrom,
        yearTo: searchState.yearTo,
        page: page(),
        perPage: PER_PAGE,
      });
      setCapstones(items, total);
    } catch (e) {
      const aborted =
        (e as { status?: number })?.status === 0 ||
        (e as Error)?.name === 'AbortError' ||
        (e as Error)?.message?.toLowerCase?.().includes?.('abort');
      if (!aborted) {
        console.error(e);
        setCapstones([], 0);
      }
    } finally {
      setCapstoneLoading(false);
    }
  };

  createEffect(() => {
    const q = (searchParams.q as string) ?? '';
    setSearchQuery(q);
  });

  createEffect(() => {
    if (
      searchState.yearFrom != null &&
      searchState.yearTo != null &&
      searchState.yearTo < searchState.yearFrom
    ) {
      setYearTo(searchState.yearFrom);
    }
  });

  createEffect(() => {
    void searchState.query;
    void searchState.selectedTagIds;
    void searchState.yearFrom;
    void searchState.yearTo;
    void page();
    runSearch();
  });

  const applySearch = (query: string) => {
    const trimmed = query.trim();
    setSearchQuery(trimmed);
    setSearchParams({ q: trimmed });
    setPage(1);
  };

  const handleSearch = debounce(applySearch, DEBOUNCE_MS);

  const handleToggleTag = (id: string) => {
    toggleTagId(id);
    setPage(1);
  };

  const handleClearFilters = () => {
    clearFilters();
    setPage(1);
  };

  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 10;
  const yearOptions = Array.from({ length: currentYear - minYear + 1 }, (_, i) => currentYear - i);
  const yearToOptions = () =>
    searchState.yearFrom != null
      ? yearOptions.filter((y) => y >= searchState.yearFrom!)
      : yearOptions;

  return (
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Search Capstones</h1>
      <div class="mt-6 flex flex-col gap-6">
        <SearchBar
          initialValue={
            (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q) ?? searchState.query ?? ''
          }
          onSearch={handleSearch}
          onSearchSubmit={(query) => {
            if (auth.user && query) searchLogService.log(query, searchState.selectedTagIds).catch(() => {});
          }}
          searchOnInput
        />
        {tagsLoading() ? (
          <div>
            <p class="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Filter by tags</p>
            <div class="flex flex-wrap gap-2">
              <Skeleton class="h-8 w-20 rounded-full" />
              <Skeleton class="h-8 w-24 rounded-full" />
              <Skeleton class="h-8 w-16 rounded-full" />
            </div>
          </div>
        ) : (
          <TagFilters tags={tags()} selectedIds={searchState.selectedTagIds} onToggle={handleToggleTag} />
        )}
        <div class="flex flex-wrap items-end gap-4">
          <div>
            <label
              for="year-from"
              class="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-400"
            >
              Year (from)
            </label>
            <select
              id="year-from"
              value={searchState.yearFrom ?? ''}
              onChange={(e) => {
                const v = e.currentTarget.value;
                const nextFrom = v === '' ? null : parseInt(v, 10);
                setYearFrom(nextFrom);
                if (nextFrom != null && searchState.yearTo != null && searchState.yearTo < nextFrom) {
                  setYearTo(nextFrom);
                }
                setPage(1);
              }}
              class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Any</option>
              {yearOptions.map((y) => (
                <option value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div>
            <label
              for="year-to"
              class="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-400"
            >
              Year (to)
            </label>
            <select
              id="year-to"
              value={searchState.yearTo ?? ''}
              onChange={(e) => {
                const v = e.currentTarget.value;
                setYearTo(v === '' ? null : parseInt(v, 10));
                setPage(1);
              }}
              class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Any</option>
              {yearToOptions().map((y) => (
                <option value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={handleClearFilters}
          class="self-start text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Clear filters
        </button>
      </div>

      {capstoneState.loading && (
        <div class="mt-8">
          <SkeletonCardGrid count={6} />
        </div>
      )}
      {!capstoneState.loading && capstoneState.items.length === 0 && (
        <p class="mt-8 text-center text-slate-500 dark:text-slate-400">No capstones found.</p>
      )}
      {!capstoneState.loading && capstoneState.items.length > 0 && (
        <>
          <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capstoneState.items.map((c) => (
              <CapstoneCard capstone={c} />
            ))}
          </div>
          {capstoneState.total > PER_PAGE && (
            <div class="mt-6 flex justify-center gap-2">
              <button
                type="button"
                disabled={page() <= 1}
                onClick={() => setPage((p) => p - 1)}
                class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Previous
              </button>
              <span class="py-1 text-sm text-slate-600 dark:text-slate-400">
                Page {page()} of {Math.ceil(capstoneState.total / PER_PAGE)}
              </span>
              <button
                type="button"
                disabled={page() * PER_PAGE >= capstoneState.total}
                onClick={() => setPage((p) => p + 1)}
                class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
