import { createEffect, createResource, createSignal } from 'solid-js';
import { Show } from 'solid-js';
import { authService } from '../../services/auth.service';

const SEARCH_DEBOUNCE_MS = 350;
import { departmentService } from '../../services/department.service';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import AsyncButton from '../../components/AsyncButton';
import { SkeletonPageTable } from '../../components/Skeleton';
import type { User, UserRole } from '../../types';

const UserManagement = () => {
  const [listSearchQuery, setListSearchQuery] = createSignal('');
  const [debouncedListQuery, setDebouncedListQuery] = createSignal('');
  createEffect(() => {
    const q = listSearchQuery();
    const t = setTimeout(() => setDebouncedListQuery(q), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  });

  const [users, { refetch }] = createResource(
    () => debouncedListQuery(),
    (q) => authService.getUsersList(1, 100, q)
  );
  const [departments] = createResource(() => departmentService.getList());
  const [editing, setEditing] = createSignal<User | null>(null);
  const [creating, setCreating] = createSignal(false);
  const [deleteTarget, setDeleteTarget] = createSignal<User | null>(null);
  const [form, setForm] = createSignal({ name: '', email: '', role: 'student' as UserRole, department: '' });
  const [createForm, setCreateForm] = createSignal({
    name: '',
    email: '',
    password: '',
    role: 'student' as UserRole,
    department: '',
  });
  const [createError, setCreateError] = createSignal('');

  const handleUpdate = async () => {
    const u = editing();
    if (!u) return;
    try {
      await authService.updateUser(u.id, {
        name: form().name,
        email: form().email,
        role: form().role,
        department: form().department || null,
      });
      refetch();
      setEditing(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    const u = deleteTarget();
    if (!u) return;
    try {
      await authService.deleteUser(u.id);
      refetch();
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const openEdit = (u: User) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      department: u.department ?? '',
    });
  };

  const handleCreate = async () => {
    setCreateError('');
    const { name, email, password, role, department } = createForm();
    if (!email.trim() || !password.trim() || !name.trim()) {
      setCreateError('Name, email, and password are required.');
      return;
    }
    if (password.length < 8) {
      setCreateError('Password must be at least 8 characters.');
      return;
    }
    try {
      await authService.createUser({
        email: email.trim(),
        password,
        name: name.trim(),
        role,
        department: department || undefined,
      });
      setCreateForm({ name: '', email: '', password: '', role: 'student', department: '' });
      setCreating(false);
      refetch();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create user');
    }
  };

  const departmentName = (u: User) => u.expand?.department?.name ?? '—';

  return (
    <div>
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">User Management</h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400">
        Create, update, and delete users. Assign roles and departments. Only students can self-register.
      </p>

      <div class="mt-6 flex flex-wrap items-center justify-between gap-4">
        <input
          type="search"
          placeholder="🔎︎ Search users"
          value={listSearchQuery()}
          onInput={(e) => setListSearchQuery(e.currentTarget.value)}
          class="min-w-[220px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={() => { setCreating(true); setCreateError(''); }}
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add user
        </button>
      </div>

      {users.loading && <SkeletonPageTable rows={8} cols={5} />}
      {users() && !users.loading && (
        <div class="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead class="bg-slate-50 dark:bg-slate-800/90">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Name</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Email</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Role</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Department</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
              {users()!.items.map((u) => (
                <tr class="dark:bg-slate-900">
                  <td class="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">{u.name}</td>
                  <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{u.email}</td>
                  <td class="px-4 py-3 text-sm capitalize text-slate-600 dark:text-slate-400">{u.role}</td>
                  <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{departmentName(u)}</td>
                  <td class="px-4 py-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      class="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(u)}
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

      <Modal
        open={creating()}
        title="Add user"
        onClose={() => { setCreating(false); setCreateError(''); }}
      >
        <div class="flex flex-col gap-3">
          <input
            type="text"
            value={createForm().name}
            onInput={(e) => setCreateForm((f) => ({ ...f, name: e.currentTarget.value }))}
            placeholder="Full name"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            type="email"
            value={createForm().email}
            onInput={(e) => setCreateForm((f) => ({ ...f, email: e.currentTarget.value }))}
            placeholder="Email"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            type="password"
            value={createForm().password}
            onInput={(e) => setCreateForm((f) => ({ ...f, password: e.currentTarget.value }))}
            placeholder="Password (min 8 characters)"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</span>
            <select
              value={createForm().role}
              onInput={(e) => {
                const role = e.currentTarget.value as UserRole;
                setCreateForm((f) => ({ ...f, role, department: role === 'admin' ? '' : f.department }));
              }}
              class="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <Show when={createForm().role !== 'admin'}>
            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Department</span>
              <select
                value={createForm().department}
                onInput={(e) => setCreateForm((f) => ({ ...f, department: e.currentTarget.value }))}
                class="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">— None —</option>
                {departments()?.map((d) => (
                  <option value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
          </Show>
        </div>
        {createError() && (
          <p class="mt-2 text-sm text-red-600 dark:text-red-400">{createError()}</p>
        )}
        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => { setCreating(false); setCreateError(''); }}
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

      <Modal open={editing() !== null} title="Edit user" onClose={() => setEditing(null)}>
        <div class="flex flex-col gap-3">
          <input
            type="text"
            value={form().name}
            onInput={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))}
            placeholder="Name"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <input
            type="email"
            value={form().email}
            onInput={(e) => setForm((f) => ({ ...f, email: e.currentTarget.value }))}
            placeholder="Email"
            class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</span>
            <select
              value={form().role}
              onInput={(e) => {
                const role = e.currentTarget.value as UserRole;
                setForm((f) => ({ ...f, role, department: role === 'admin' ? '' : f.department }));
              }}
              class="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <Show when={form().role !== 'admin'}>
            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Department</span>
              <select
                value={form().department}
                onInput={(e) => setForm((f) => ({ ...f, department: e.currentTarget.value }))}
                class="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">— None —</option>
                {departments()?.map((d) => (
                  <option value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
          </Show>
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
        title="Delete user?"
        message={deleteTarget() ? `Delete "${deleteTarget()!.name}"? This cannot be undone.` : ''}
        danger
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default UserManagement;