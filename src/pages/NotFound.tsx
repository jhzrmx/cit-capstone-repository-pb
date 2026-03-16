import { A } from '@solidjs/router';

const NotFound = () => {
  return (
    <div class="flex w-full flex-1 flex-col items-center justify-center py-8 min-h-[calc(100dvh-7rem)] sm:min-h-[calc(100dvh-6.5rem)] animate-card-soft">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <p class="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">404</p>
        <h1 class="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">Page not found</h1>
        <p class="mt-3 text-sm text-slate-600 dark:text-slate-400">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <div class="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <A
            href="/"
            class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
          >
            Back to home
          </A>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

