import { Show, createSignal, onMount, For } from 'solid-js';
import { A } from '@solidjs/router';
import { auth } from '../stores/authStore';
import { departmentService } from '../services/department.service';
import { authService } from '../services/auth.service';
import type { Department } from '../types';

const AccountSettings = () => {
  const user = () => auth.user;
  const [departmentName, setDepartmentName] = createSignal<string | null>(null);
  const [departments, setDepartments] = createSignal<Department[]>([]);
  const [name, setName] = createSignal('');
  const [departmentId, setDepartmentId] = createSignal<string>('');
  const [saving, setSaving] = createSignal(false);
  const [message, setMessage] = createSignal('');
  const [error, setError] = createSignal('');

  onMount(async () => {
    const u = user();
    console.log(u);
    if (!u) return;
    setName(u.name);
    // Derive initial department id from either primitive relation field or embedded object / expand
    const rawDept = (u as any).department as unknown;
    let initialDeptId =
      typeof rawDept === 'string'
        ? rawDept
        : rawDept && typeof rawDept === 'object' && typeof (rawDept as { id?: string }).id === 'string'
          ? (rawDept as { id: string }).id
          : '';

    if (!initialDeptId && (u as any).expand?.department && typeof (u as any).expand.department.id === 'string') {
      initialDeptId = (u as any).expand.department.id as string;
    }

    setDepartmentId(initialDeptId);

    if (typeof (u as any).expand?.department?.name === 'string') {
      setDepartmentName((u as any).expand.department.name as string);
    } else if (initialDeptId) {
      try {
        const dept = await departmentService.getOne(initialDeptId);
        setDepartmentName(dept.name);
      } catch {
        setDepartmentName(null);
      }
    }

    try {
      const list = await departmentService.getList();
      setDepartments(list);
      // If we still don't have an id but know the name, try to infer the id from the list.
      if (!initialDeptId && departmentName()) {
        const match = list.find(
          (d) => d.name.toLowerCase().trim() === departmentName()!.toLowerCase().trim()
        );
        if (match) {
          setDepartmentId(match.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  });

  const handleSave = async (e: Event) => {
    e.preventDefault();
    const u = user();
    if (!u) return;
    setMessage('');
    setError('');
    setSaving(true);
    try {
      const updated = await authService.updateUser(u.id, {
        name: name().trim() || u.name,
        department: departmentId() || null,
      });
      setMessage('Account updated.');
      setDepartmentName(
        (updated as any).expand?.department?.name ??
          (departments().find((d) => d.id === departmentId())?.name ?? departmentName())
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div class="flex w-full flex-1 flex-col items-center justify-center py-8 min-h-[calc(100dvh-7rem)] sm:min-h-[calc(100dvh-6.5rem)] animate-card-soft">
      <div class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <h1 class="text-center text-2xl font-bold text-slate-900 dark:text-slate-100">Account settings</h1>
        <Show
          when={user()}
          fallback={<p class="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">You are not signed in.</p>}
        >
          {(u) => (
            <>
              <p class="mt-1 text-center text-sm text-slate-500 dark:text-slate-400">
                Manage basic information for your CIT Capstone account.
              </p>

              <form onSubmit={handleSave} class="mt-6 space-y-4 text-sm">
                <div>
                  <label class="mb-1 block text-slate-500 dark:text-slate-400">Name</label>
                  <input
                    type="text"
                    value={name()}
                    onInput={(e) => setName(e.currentTarget.value)}
                    class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label class="mb-1 block text-slate-500 dark:text-slate-400">Email</label>
                  <p class="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {u().email}
                  </p>
                </div>
                <div>
                  <label class="mb-1 block text-slate-500 dark:text-slate-400">Role</label>
                  <p class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {u().role}
                  </p>
                </div>
                <Show when={u().role !== 'admin'}>
                  <div>
                    <label class="mb-1 block text-slate-500 dark:text-slate-400">Department</label>
                    <select
                      value={departmentId()}
                      onInput={(e) => setDepartmentId(e.currentTarget.value)}
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="">— None —</option>
                      <For each={departments()}>
                        {(d) => (
                          <option value={d.id}>{d.name}</option>
                        )}
                      </For>
                    </select>
                    <p class="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Current: {departmentName() || '—'}
                    </p>
                  </div>
                </Show>

                {message() && <p class="text-xs text-emerald-600 dark:text-emerald-300">{message()}</p>}
                {error() && <p class="text-xs text-red-600 dark:text-red-400">{error()}</p>}

                <div class="pt-2">
                  <button
                    type="submit"
                    disabled={saving()}
                    class="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving() ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>

              <div class="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <p class="font-semibold text-slate-700 dark:text-slate-200">Password & security</p>
                <p class="mt-1">
                  To change your password, use{' '}
                  <A href="/forgot-password" class="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    Forgot password
                  </A>{' '}
                  from the log in screen. For changes to email or role, contact an administrator.
                </p>
              </div>
            </>
          )}
        </Show>
      </div>
    </div>
  );
};

export default AccountSettings;

