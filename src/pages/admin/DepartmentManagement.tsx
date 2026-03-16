import { createResource, createSignal } from 'solid-js';
import { departmentService } from '../../services/department.service';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import AsyncButton from '../../components/AsyncButton';
import { SkeletonPageTable } from '../../components/Skeleton';
import type { Department } from '../../types';

const DepartmentManagement = () => {
  const [departments, { refetch }] = createResource(() => departmentService.getList());
  const [creating, setCreating] = createSignal(false);
  const [editing, setEditing] = createSignal<Department | null>(null);
  const [deleteTarget, setDeleteTarget] = createSignal<Department | null>(null);
  const [form, setForm] = createSignal({ name: '', code: '' });
  const [error, setError] = createSignal('');

  const handleCreate = async () => {
    setError('');
    const { name, code } = form();
    if (!name.trim() || !code.trim()) {
      setError('Name and code are required.');
      return;
    }
    try {
      await departmentService.create({ name: name.trim(), code: code.trim() });
      setForm({ name: '', code: '' });
      setCreating(false);
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create department');
    }
  };

  const handleUpdate = async () => {
    const d = editing();
    if (!d) return;
    setError('');
    const { name, code } = form();
    if (!name.trim() || !code.trim()) {
      setError('Name and code are required.');
      return;
    }
    try {
      await departmentService.update(d.id, { name: name.trim(), code: code.trim() });
      setEditing(null);
      refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update department');
    }
  };

  const handleDelete = async () => {
    const d = deleteTarget();
    if (!d) return;
    try {
      await departmentService.delete(d.id);
      refetch();
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const openEdit = (d: Department) => {
    setEditing(d);
    setForm({ name: d.name, code: d.code });
  };

  return (
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Department Management</h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400">
        Create, edit, and delete departments. Students choose one when registering.
      </p>

      <div class="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => { setCreating(true); setError(''); setForm({ name: '', code: '' }); }}
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add department
        </button>
      </div>

      {/* List */}
      {departments.loading && <SkeletonPageTable rows={6} cols={3} />}
      {departments() && !departments.loading && (
        <div class="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead class="bg-slate-50 dark:bg-slate-800/90">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Name</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Code</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
              {departments()!.map((d) => (
                <tr class="dark:bg-slate-900">
                  <td class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">{d.name}</td>
                  <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{d.code}</td>
                  <td class="px-4 py-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(d)}
                      class="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(d)}
                      class="text-red-600 hover:underline dark:text-red-400"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={creating()} title="Add department" onClose={() => { setCreating(false); setError(''); setForm({ name: '', code: '' }); }}>
        <div class="flex flex-col gap-3">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</span>
            <input
              type="text"
              value={form().name}
              onInput={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))}
              placeholder="e.g. Information Technology"
              class="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Code</span>
            <input
              type="text"
              value={form().code}
              onInput={(e) => setForm((f) => ({ ...f, code: e.currentTarget.value }))}
              placeholder="e.g. IT, CS"
              class="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
        </div>
        {error() && <p class="mt-2 text-sm text-red-600 dark:text-red-400">{error()}</p>}
        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => { setCreating(false); setError(''); }}
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <AsyncButton
            onClick={handleCreate}
            loadingLabel="Creating…"
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Create
          </AsyncButton>
        </div>
      </Modal>

      <Modal open={editing() !== null} title="Edit department" onClose={() => setEditing(null)}>
        <div class="flex flex-col gap-3">
          <input
            type="text"
            value={form().name}
            onInput={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))}
            placeholder="Name"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            type="text"
            value={form().code}
            onInput={(e) => setForm((f) => ({ ...f, code: e.currentTarget.value }))}
            placeholder="Code"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setEditing(null)}
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <AsyncButton
            onClick={handleUpdate}
            loadingLabel="Saving…"
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Save
          </AsyncButton>
        </div>
      </Modal>

      <ConfirmModal
        open={deleteTarget() !== null}
        title="Delete department?"
        message={deleteTarget() ? `Delete "${deleteTarget()!.name}"? Users linked to it may need to be updated.` : ''}
        danger
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default DepartmentManagement;