import { A } from '@solidjs/router';
import type { Capstone } from '../types';

interface CapstoneCardProps {
  capstone: Capstone;
}

export default function CapstoneCard(props: CapstoneCardProps) {
  const c = props.capstone;
  const authors = () => (c.expand?.authors ?? []).map((a) => a.name).join(', ') || '—';
  const tagNames = () => (c.expand?.tags ?? []).map((t) => t.name).join(', ') || '—';

  return (
    <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:shadow-none dark:hover:border-slate-600">
      <A href={`/capstone/${c.id}`} class="block">
        <h3 class="font-semibold text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400">
          {c.title}
        </h3>
        <p class="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{c.abstract}</p>
        <p class="mt-2 text-xs text-slate-500 dark:text-slate-500">
          <span class="font-medium text-slate-600 dark:text-slate-400">Authors:</span> {authors()}
        </p>
        <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-500">
          <span class="font-medium text-slate-600 dark:text-slate-400">Tags:</span> {tagNames()}
        </p>
        <p class="mt-1 text-xs text-slate-400 dark:text-slate-500">Year: {c.year}</p>
      </A>
    </article>
  );
}
