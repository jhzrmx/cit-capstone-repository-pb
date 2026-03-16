import { createResource, Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import { capstoneService } from '../services/capstone.service';
import { pb } from '../services/pocketbase';
import { SkeletonDetail } from '../components/Skeleton';
import SafeHtmlContent from '../components/SafeHtmlContent';

const CapstoneDetail = () => {
  const params = useParams();
  const capstoneId = () => params.id;
  const [capstone] = createResource(
    capstoneId,
    (id: string | undefined) => (id ? capstoneService.getOne(id) : Promise.reject(new Error('No id')))
  );

  const pdfUrl = () => {
    const c = capstone();
    if (!c?.pdf_file) return null;
    return pb.files.getUrl(c, c.pdf_file);
  };

  return (
    <Show when={!capstone.loading} fallback={<SkeletonDetail />}>
      <Show when={capstone()} keyed>
        {(c) => (
          <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:shadow-none animate-card-soft">
            <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">{c.title}</h1>
            <div class="mt-2 text-sm">
              <SafeHtmlContent html={c.abstract} />
            </div>
            <dl class="mt-6 grid gap-2 sm:grid-cols-2">
              <dt class="font-medium text-slate-500 dark:text-slate-400">Authors</dt>
              <dd class="text-slate-900 dark:text-slate-100">
                {(c.expand?.authors ?? []).map((a) => a.name).join(', ') || '—'}
              </dd>
              <dt class="font-medium text-slate-500 dark:text-slate-400">Tags</dt>
              <dd class="text-slate-900 dark:text-slate-100">
                {(c.expand?.tags ?? []).map((t) => t.name).join(', ') || '—'}
              </dd>
              <dt class="font-medium text-slate-500 dark:text-slate-400">Year</dt>
              <dd class="text-slate-900 dark:text-slate-100">{c.year}</dd>
              <dt class="font-medium text-slate-500 dark:text-slate-400">Status</dt>
              <dd class="text-slate-900 dark:text-slate-100">
                <span
                  class={`inline-block rounded-full px-2.5 py-0.5 text-sm font-medium capitalize ${
                    c.status === 'pending'
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200'
                      : c.status === 'approved'
                        ? 'bg-green-100 text-green-900 dark:bg-emerald-950/80 dark:text-emerald-200'
                        : c.status === 'rejected'
                          ? 'bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-200'
                          : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                  }`}
                >
                  {c.status}
                </span>
              </dd>
            </dl>
            <div class="mt-6 flex flex-wrap gap-3">
              {c.pdf_file && (
                <a
                  href={pdfUrl() ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Download PDF
                </a>
              )}
              {c.repository_link && (
                <a
                  href={c.repository_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Repository
                </a>
              )}
            </div>
          </div>
        )}
      </Show>
      <Show when={capstone.error}>
        <p class="text-red-600 dark:text-red-400">Failed to load capstone.</p>
      </Show>
    </Show>
  );
};

export default CapstoneDetail;