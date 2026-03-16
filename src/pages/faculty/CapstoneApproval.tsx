import { createResource, createSignal } from 'solid-js';
import { capstoneService } from '../../services/capstone.service';
import ConfirmModal from '../../components/ConfirmModal';
import { SkeletonPageTable } from '../../components/Skeleton';

const CapstoneApproval = () => {
  const [pending, { refetch }] = createResource(() => capstoneService.getPendingSubmissions());
  const [confirmAction, setConfirmAction] = createSignal<{
    type: 'approve' | 'reject';
    id: string;
    title: string;
  } | null>(null);

  const handleApprove = async (id: string) => {
    await capstoneService.approve(id);
    refetch();
    setConfirmAction(null);
  };

  const handleReject = async (id: string) => {
    await capstoneService.reject(id);
    refetch();
    setConfirmAction(null);
  };

  return (
    <div class="animate-page-soft">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Capstone Approval</h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400">Approve or reject student submissions.</p>

      {pending.loading && <SkeletonPageTable rows={6} cols={5} />}
      {pending()?.length === 0 && !pending.loading && (
        <p class="mt-8 text-slate-500 dark:text-slate-400">No pending submissions.</p>
      )}
      {pending() && !pending.loading && pending()!.length > 0 && (
        <div class="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead class="bg-slate-50 dark:bg-slate-800/90">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Title</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Authors</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Tags</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Submitted</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
              {pending()!.map((c) => (
                <tr class="dark:bg-slate-900">
                  <td class="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{c.title}</td>
                  <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {(c.expand?.authors ?? []).map((a: { name: string }) => a.name).join(', ') || '—'}
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {(c.expand?.tags ?? []).map((t: { name: string }) => t.name).join(', ') || '—'}
                  </td>
                  <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(c.created).toLocaleDateString()}
                  </td>
                  <td class="px-4 py-3 flex gap-2">
                    <a
                      href={`/capstone/${c.id}`}
                      class="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      View
                    </a>
                    <button
                      type="button"
                      onClick={() => setConfirmAction({ type: 'approve', id: c.id, title: c.title })}
                      class="text-green-600 hover:underline dark:text-emerald-400"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmAction({ type: 'reject', id: c.id, title: c.title })}
                      class="text-red-600 hover:underline dark:text-red-400"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={confirmAction() !== null}
        title={confirmAction()?.type === 'approve' ? 'Approve capstone?' : 'Reject capstone?'}
        message={
          confirmAction()
            ? `"${confirmAction()!.title}" will be ${confirmAction()!.type === 'approve' ? 'approved and visible in search.' : 'rejected.'}`
            : ''
        }
        danger={confirmAction()?.type === 'reject'}
        confirmLabel={confirmAction()?.type === 'approve' ? 'Approve' : 'Reject'}
        onConfirm={async () => {
          const a = confirmAction();
          if (!a) return;
          try {
            if (a.type === 'approve') await handleApprove(a.id);
            else await handleReject(a.id);
          } catch (e) {
            console.error(e);
            throw e;
          }
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
};

export default CapstoneApproval;