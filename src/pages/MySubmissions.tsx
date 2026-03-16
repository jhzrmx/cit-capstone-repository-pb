import { createResource } from 'solid-js';
import { A } from '@solidjs/router';
import { capstoneService } from '../services/capstone.service';
import { SkeletonPageTable } from '../components/Skeleton';

const MySubmissions = () => {
  const [capstones] = createResource(() => capstoneService.getMySubmissions());

  return (
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">My Submissions</h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400">
        Track the approval status of your capstone submissions.
      </p>
      {capstones.loading && <SkeletonPageTable rows={5} cols={4} />}
      {capstones.error && (
        <p class="mt-4 text-red-600 dark:text-red-400">Failed to load submissions.</p>
      )}
      {capstones()?.length === 0 && !capstones.loading && (
        <p class="mt-8 text-slate-500 dark:text-slate-400">
          You have not submitted any capstones yet.
        </p>
      )}
      {capstones() && !capstones.loading && capstones()!.length > 0 && (
        <div class="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead class="bg-slate-50 dark:bg-slate-800/90">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                  Title
                </th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                  Status
                </th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                  Submitted
                </th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
              {capstones()!.map((c) => (
                <tr class="dark:bg-slate-900">
                  <td class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">{c.title}</td>
                  <td class="px-4 py-3">
                    <span
                      class="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
                      classList={{
                        'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200':
                          c.status === 'pending',
                        'bg-green-100 text-green-900 dark:bg-emerald-950/80 dark:text-emerald-200':
                          c.status === 'approved',
                        'bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-200':
                          c.status === 'rejected',
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(c.created).toLocaleDateString()}
                  </td>
                  <td class="px-4 py-3">
                    <A
                      href={`/capstone/${c.id}`}
                      class="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      View
                    </A>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MySubmissions;