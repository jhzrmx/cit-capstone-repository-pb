/** Base skeleton placeholder – use class for size (e.g. h-4 w-32) */
const Skeleton = (props: { class?: string }) => {
  return (
    <div
      class={`animate-pulse rounded bg-slate-200 dark:bg-slate-700 ${props.class ?? ''}`}
      aria-hidden="true"
    />
  );
};

/** Table skeleton: rows × columns */
const SkeletonTable = (props: { rows?: number; cols?: number; class?: string }) => {
  const rows = props.rows ?? 5;
  const cols = props.cols ?? 5;
  return (
    <div
      class={`overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 ${props.class ?? ''}`}
    >
      <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <thead class="bg-slate-50 dark:bg-slate-800/90">
          <tr>
            {Array.from({ length: cols }).map(() => (
              <th class="px-4 py-3 text-left">
                <Skeleton class="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
          {Array.from({ length: rows }).map(() => (
            <tr class="dark:bg-slate-900">
              {Array.from({ length: cols }).map((_, ci) => (
                <td class="px-4 py-3">
                  <Skeleton class={ci === cols - 1 ? 'h-4 w-16' : 'h-4 w-full max-w-[12rem]'} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/** Card skeleton matching CapstoneCard layout */
const SkeletonCard = () => {
  return (
    <div class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <Skeleton class="h-5 w-3/4" />
      <Skeleton class="mt-2 h-3 w-full" />
      <Skeleton class="mt-1 h-3 w-full" />
      <Skeleton class="mt-2 h-3 w-32" />
      <Skeleton class="mt-1 h-3 w-24" />
      <Skeleton class="mt-1 h-3 w-16" />
    </div>
  );
};

/** Grid of card skeletons (e.g. search results) */
const SkeletonCardGrid = (props: { count?: number; class?: string }) => {
  const count = props.count ?? 6;
  return (
    <div class={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${props.class ?? ''}`}>
      {Array.from({ length: count }).map(() => (
        <SkeletonCard />
      ))}
    </div>
  );
};

/** Detail page skeleton (title, text block, definition list) */
const SkeletonDetail = () => {
  return (
    <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none">
      <Skeleton class="h-8 w-3/4 max-w-xl" />
      <Skeleton class="mt-3 h-4 w-full" />
      <Skeleton class="mt-2 h-4 w-full" />
      <Skeleton class="mt-2 h-4 w-5/6" />
      <div class="mt-6 grid gap-2 sm:grid-cols-2">
        {Array.from({ length: 6 }).map(() => (
          <div class="flex gap-2">
            <Skeleton class="h-4 w-20 shrink-0" />
            <Skeleton class="h-4 flex-1" />
          </div>
        ))}
      </div>
      <div class="mt-6 flex gap-3">
        <Skeleton class="h-10 w-32 rounded-lg" />
        <Skeleton class="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
};

/** List of lines (e.g. dashboard keywords or tags) */
const SkeletonList = (props: { lines?: number; class?: string }) => {
  const lines = props.lines ?? 5;
  return (
    <ul class={`space-y-2 ${props.class ?? ''}`}>
      {Array.from({ length: lines }).map(() => (
        <li class="flex justify-between gap-2">
          <Skeleton class="h-4 flex-1 max-w-[12rem]" />
          <Skeleton class="h-4 w-8 shrink-0" />
        </li>
      ))}
    </ul>
  );
};

/** Chart placeholder (pie/line) – same height as dashboard charts to avoid layout shift */
const SkeletonChart = (props: { class?: string }) => {
  return (
    <div
      class={`flex min-h-[280px] items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/80 ${props.class ?? ''}`}
      aria-hidden="true"
    >
      <Skeleton class="h-48 w-48 rounded-full" />
    </div>
  );
};

/** Full-page table loading (header + table skeleton) */
const SkeletonPageTable = (props: { rows?: number; cols?: number }) => {
  return (
    <div class="mt-6">
      <SkeletonTable rows={props.rows ?? 8} cols={props.cols ?? 5} />
    </div>
  );
};

export { Skeleton, SkeletonTable, SkeletonCard, SkeletonCardGrid, SkeletonDetail, SkeletonList, SkeletonChart, SkeletonPageTable };