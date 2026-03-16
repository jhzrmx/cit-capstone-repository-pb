import { createEffect, createResource, createSignal, onCleanup } from 'solid-js';
import { Chart } from 'chart.js/auto';
import { searchLogService } from '../../services/searchLog.service';
import { capstoneService } from '../../services/capstone.service';
import { tagService } from '../../services/tag.service';
import { SkeletonChart } from '../../components/Skeleton';

const MIN_QUERY_LENGTH = 3;
const TOP_QUERIES_LIMIT = 10;
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const PIE_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899',
  '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6',
];

const PieChart = (props: {
  ref: (el: HTMLCanvasElement | undefined) => void;
  data: { label: string; value: number }[];
  title: string;
}) => {
  onCleanup(() => props.ref(undefined));
  return (
    <div class="relative mx-auto mt-4 aspect-square w-full max-w-xs sm:max-w-sm lg:max-w-md">
      <canvas
        ref={props.ref}
        role="img"
        aria-label={props.title}
        class="h-full w-full"
      />
    </div>
  );
};

const LineChart = (props: {
  ref: (el: HTMLCanvasElement | undefined) => void;
  labels: string[];
  values: number[];
  title: string;
}) => {
  onCleanup(() => props.ref(undefined));
  return (
    <div class="relative h-[280px] w-full">
      <canvas ref={props.ref} role="img" aria-label={props.title} />
    </div>
  );
};  

const FacultyDashboard = () => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = createSignal<number | null>(currentYear);
  const [keywordsCanvas, setKeywordsCanvas] = createSignal<HTMLCanvasElement | undefined>(undefined);
  const [tagsCanvas, setTagsCanvas] = createSignal<HTMLCanvasElement | undefined>(undefined);
  const [activityCanvas, setActivityCanvas] = createSignal<HTMLCanvasElement | undefined>(undefined);

  // Stable source keys avoid extra refetches; $autoCancel:false in service reduces empty flash from aborted first request
  const [topQueries] = createResource(
    () => selectedYear(),
    (year) => searchLogService.getTopQueries(TOP_QUERIES_LIMIT, MIN_QUERY_LENGTH, year)
  );

  const [searchByMonth] = createResource(
    () => selectedYear(),
    (year) => searchLogService.getSearchCountByMonth(year)
  );

  const [tagCounts] = createResource(
    () => selectedYear(),
    async (year) => {
      const list = await tagService.getList();
      const { items } = await capstoneService.getList({
        perPage: 200,
        ...(year != null && year > 0 && { filter: `year = ${year}` }),
      });
      const counts: Record<string, number> = {};
      for (const c of items) {
        const tagIds = Array.isArray(c.tags) ? c.tags : [];
        for (const id of tagIds) {
          counts[id] = (counts[id] ?? 0) + 1;
        }
      }
      return list
        .map((t) => ({ tag: t, count: counts[t.id] ?? 0 }))
        .filter((x) => x.count > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    }
  );

  createEffect(() => {
    const data = topQueries();
    const canvas = keywordsCanvas();
    if (!data?.length || !canvas) return;
    const dark = document.documentElement.classList.contains('dark');
    const chart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: data.map(({ query }) => `"${query}"`),
        datasets: [{
          data: data.map(({ count }) => count),
          backgroundColor: PIE_COLORS.slice(0, data.length),
          borderWidth: 1,
          borderColor: dark ? '#1e293b' : '#fff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: dark ? '#94a3b8' : '#64748b' },
          },
        },
      },
    });
    return () => chart.destroy();
  });

  createEffect(() => {
    const data = tagCounts();
    const canvas = tagsCanvas();
    if (!data?.length || !canvas) return;
    const dark = document.documentElement.classList.contains('dark');
    const chart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: data.map(({ tag }) => tag.name),
        datasets: [{
          data: data.map(({ count }) => count),
          backgroundColor: PIE_COLORS.slice(0, data.length),
          borderWidth: 1,
          borderColor: dark ? '#1e293b' : '#fff',
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: dark ? '#94a3b8' : '#64748b' },
          },
        },
      },
    });
    return () => chart.destroy();
  });

  createEffect(() => {
    const data = searchByMonth();
    const canvas = activityCanvas();
    if (!data?.length || !canvas) return;
    const dark = document.documentElement.classList.contains('dark');
    const tickColor = dark ? '#94a3b8' : '#64748b';
    const gridColor = dark ? 'rgba(148, 163, 184, 0.15)' : 'rgba(0,0,0,0.06)';
    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: MONTH_NAMES,
        datasets: [{
          label: 'Searches',
          data: data.map((d) => d.count),
          borderColor: '#6366f1',
          backgroundColor: dark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            ticks: { color: tickColor },
            grid: { color: gridColor },
          },
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1, color: tickColor },
            grid: { color: gridColor },
          },
        },
      },
    });
    return () => chart.destroy();
  });

  const yearOptions = () => {
    const y = currentYear;
    return Array.from({ length: 11 }, (_, i) => y - i);
  };

  const yearLabel = () => (selectedYear() == null ? 'All years' : String(selectedYear()));

  return (
    <div class="animate-page-soft">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Faculty Dashboard</h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400">
        Search trends, popular tags, and user search activity by year.
      </p>

      <div class="mt-6 flex flex-wrap items-center gap-4">
        <label
          for="dashboard-year"
          class="text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Year
        </label>
        <select
          id="dashboard-year"
          value={selectedYear() ?? ''}
          onChange={(e) => {
            const v = e.currentTarget.value;
            setSelectedYear(v === '' ? null : parseInt(v, 10));
          }}
          class="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">All years</option>
          {yearOptions().map((y) => (
            <option value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div class="mt-8 grid gap-6 lg:grid-cols-2">
        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none animate-card-soft">
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Most searched keywords</h2>
          <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {yearLabel()} · Submitted searches only (min {MIN_QUERY_LENGTH} characters).
          </p>
          {topQueries.loading && <SkeletonChart class="mt-4" />}
          {topQueries() && !topQueries.loading && topQueries()!.length === 0 && (
            <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">No searches yet.</p>
          )}
          {topQueries() && !topQueries.loading && topQueries()!.length > 0 && (
            <PieChart
              ref={setKeywordsCanvas}
              data={topQueries()!.map(({ query, count }) => ({ label: query, value: count }))}
              title="Most searched keywords"
            />
          )}
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none animate-card-soft">
          <h2 class="font-semibold text-slate-900 dark:text-slate-100">Popular tags</h2>
          <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            {yearLabel()} · Tag usage across capstones (only tags in use).
          </p>
          {tagCounts.loading && <SkeletonChart class="mt-4" />}
          {tagCounts() && !tagCounts.loading && tagCounts()!.length === 0 && (
            <p class="mt-4 text-sm text-slate-500 dark:text-slate-400">No tags in use yet.</p>
          )}
          {tagCounts() && !tagCounts.loading && tagCounts()!.length > 0 && (
            <PieChart
              ref={setTagsCanvas}
              data={tagCounts()!.map(({ tag, count }) => ({ label: tag.name, value: count }))}
              title="Popular tags"
            />
          )}
        </div>
      </div>

      <div class="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none animate-card-soft">
        <h2 class="font-semibold text-slate-900 dark:text-slate-100">User search activity</h2>
        <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {yearLabel()} · Number of searches per month.
        </p>
        {searchByMonth.loading && <SkeletonChart class="mt-4" />}
        {searchByMonth() && !searchByMonth.loading && (
          <LineChart
            ref={setActivityCanvas}
            labels={MONTH_NAMES}
            values={searchByMonth()!.map((d) => d.count)}
            title="Searches per month"
          />
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;