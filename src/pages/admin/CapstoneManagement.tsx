import { createEffect, createResource, createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import { capstoneService } from '../../services/capstone.service';

const SEARCH_DEBOUNCE_MS = 350;
import { authorService } from '../../services/author.service';
import { tagService } from '../../services/tag.service';
import { authService } from '../../services/auth.service';
import Modal from '../../components/Modal';
import ConfirmModal from '../../components/ConfirmModal';
import { SkeletonPageTable } from '../../components/Skeleton';
import RichTextEditor from '../../components/RichTextEditor';
import type { Capstone, AuthorInput, User, CapstoneStatus, Tag } from '../../types';

// Author in form: optional id when editing (existing author record)
type AuthorEntry = AuthorInput & { id?: string };

const emptyForm = () => ({
  title: '',
  abstract: '',
  authors: [] as AuthorEntry[],
  tags: [] as string[],
  repository_link: '',
  year: new Date().getFullYear(),
  status: 'pending' as CapstoneStatus,
  pdf_file: null as File | null,
});

const capstoneListFilter = (query: string): string => {
  const q = (query ?? '').trim();
  if (!q) return '';
  const escaped = q.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `(title ~ "${escaped}" || abstract ~ "${escaped}")`;
};

const CapstoneManagement = () => {
  const [listSearchQuery, setListSearchQuery] = createSignal('');
  const [debouncedListQuery, setDebouncedListQuery] = createSignal('');
  createEffect(() => {
    const q = listSearchQuery();
    const t = setTimeout(() => setDebouncedListQuery(q), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  });

  const [list, { refetch }] = createResource(
    () => debouncedListQuery(),
    (q) => {
      const filter = capstoneListFilter(q);
      return capstoneService.getList({ perPage: 100, ...(filter && { filter }) });
    }
  );
  const [tags, { refetch: refetchTags }] = createResource(() => tagService.getList());
  const [tagSearchQuery, setTagSearchQuery] = createSignal('');
  const [tagCreating, setTagCreating] = createSignal(false);
  const [deleteTarget, setDeleteTarget] = createSignal<Capstone | null>(null);
  const [creating, setCreating] = createSignal(false);
  const [editingCapstone, setEditingCapstone] = createSignal<Capstone | null>(null);
  const [createError, setCreateError] = createSignal('');
  const [createSubmitting, setCreateSubmitting] = createSignal(false);
  const [authorSearchQuery, setAuthorSearchQuery] = createSignal('');
  const [authorSearchResults, setAuthorSearchResults] = createSignal<User[]>([]);
  const [authorSearching, setAuthorSearching] = createSignal(false);
  const [createForm, setCreateForm] = createSignal(emptyForm());

  const isModalOpen = () => creating() || editingCapstone() !== null;
  const isEditing = () => editingCapstone() !== null;

  const handleDelete = async () => {
    const c = deleteTarget();
    if (!c) return;
    try {
      await capstoneService.delete(c.id);
      refetch();
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  const searchAuthors = async () => {
    const q = authorSearchQuery().trim();
    setAuthorSearching(true);
    try {
      const users = await authService.searchUsers(q, { role: 'student', limit: 15 });
      setAuthorSearchResults(users);
    } catch {
      setAuthorSearchResults([]);
    } finally {
      setAuthorSearching(false);
    }
  };

  const addAuthorFromUser = (u: User) => {
    const existing = createForm().authors.some((a) => a.user === u.id);
    if (existing) return;
    setCreateForm((f) => ({
      ...f,
      authors: [...f.authors, { name: u.name, user: u.id } as AuthorEntry],
    }));
    setAuthorSearchQuery('');
    setAuthorSearchResults([]);
  };

  const addAuthorByName = () => {
    const name = authorSearchQuery().trim();
    if (!name) return;
    setCreateForm((f) => ({
      ...f,
      authors: [...f.authors, { name, user: undefined } as AuthorEntry],
    }));
    setAuthorSearchQuery('');
    setAuthorSearchResults([]);
  };

  const openEdit = (c: Capstone) => {
    setEditingCapstone(c);
    setCreateForm({
      title: c.title,
      abstract: c.abstract,
      authors: (c.expand?.authors ?? []).map((a) => ({
        id: a.id,
        name: a.name,
        user: a.user ?? undefined,
      })) as AuthorEntry[],
      tags: c.tags ?? [],
      repository_link: c.repository_link ?? '',
      year: c.year,
      status: c.status,
      pdf_file: null,
    });
    setCreateError('');
  };

  const closeModal = () => {
    setCreating(false);
    setEditingCapstone(null);
    setCreateForm(emptyForm());
    setCreateError('');
    setAuthorSearchQuery('');
    setAuthorSearchResults([]);
    setTagSearchQuery('');
  };

  const removeAuthor = (index: number) => {
    setCreateForm((f) => ({
      ...f,
      authors: f.authors.filter((_, i) => i !== index),
    }));
  };

  // Tag search: filter loaded tags by name (client-side)
  const tagSearchResults = (): Tag[] => {
    const q = tagSearchQuery().trim().toLowerCase();
    const all = tags() ?? [];
    const selected = createForm().tags;
    const matching = q
      ? all.filter((t) => t.name.toLowerCase().includes(q) && !selected.includes(t.id))
      : all.filter((t) => !selected.includes(t.id));
    return matching.slice(0, 15);
  };

  const addTagToForm = (tag: Tag) => {
    if (createForm().tags.includes(tag.id)) return;
    setCreateForm((f) => ({ ...f, tags: [...f.tags, tag.id] }));
    setTagSearchQuery('');
  };

  const addTagAsNew = async () => {
    const name = tagSearchQuery().trim();
    if (!name) return;
    setTagCreating(true);
    try {
      const created = await tagService.create({ name });
      refetchTags();
      setCreateForm((f) => (f.tags.includes(created.id) ? f : { ...f, tags: [...f.tags, created.id] }));
      setTagSearchQuery('');
    } catch {
      setCreateError('Failed to create tag.');
    } finally {
      setTagCreating(false);
    }
  };

  const removeTag = (tagId: string) => {
    setCreateForm((f) => ({ ...f, tags: f.tags.filter((id) => id !== tagId) }));
  };

  const handleCreate = async () => {
    setCreateError('');
    const f = createForm();
    if (!f.title.trim() || !f.abstract.trim()) {
      setCreateError('Title and abstract are required.');
      return;
    }
    if (f.authors.length === 0) {
      setCreateError('Add at least one author.');
      return;
    }
    setCreateSubmitting(true);
    try {
      await capstoneService.create({
        title: f.title.trim(),
        abstract: f.abstract.trim(),
        authors: f.authors,
        tags: f.tags,
        repository_link: f.repository_link.trim(),
        year: f.year,
        pdf_file: f.pdf_file,
        status: 'approved',
      });
      closeModal();
      refetch();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to create capstone');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    setCreateError('');
    const cap = editingCapstone();
    if (!cap) return;
    const f = createForm();
    if (!f.title.trim() || !f.abstract.trim()) {
      setCreateError('Title and abstract are required.');
      return;
    }
    if (f.authors.length === 0) {
      setCreateError('Add at least one author.');
      return;
    }
    setCreateSubmitting(true);
    try {
      const authorIds: string[] = [];
      for (const a of f.authors) {
        if (a.id) {
          authorIds.push(a.id);
        } else {
          const created = await authorService.create({ name: a.name, user: a.user ?? null });
          authorIds.push(created.id);
        }
      }
      await capstoneService.update(cap.id, {
        title: f.title.trim(),
        abstract: f.abstract.trim(),
        authors: authorIds,
        tags: f.tags,
        repository_link: f.repository_link.trim(),
        year: f.year,
        status: f.status,
      });
      closeModal();
      refetch();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Failed to update capstone');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (isEditing()) handleUpdate();
    else handleCreate();
  };

  return (
    <div class="animate-page-soft">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Capstone Management</h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400">View, edit, and delete all capstones.</p>

      <div class="mt-6 flex flex-wrap items-center justify-between gap-4">
        <input
          type="search"
          placeholder="🔎︎ Search capstones"
          value={listSearchQuery()}
          onInput={(e) => setListSearchQuery(e.currentTarget.value)}
          class="min-w-[220px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <button
          type="button"
          onClick={() => { setCreating(true); setCreateError(''); }}
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add capstone
        </button>
      </div>

      {list.loading && <SkeletonPageTable rows={8} cols={5} />}
      {list() && !list.loading && (
        <div class="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead class="bg-slate-50 dark:bg-slate-800/90">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Title</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Authors</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Status</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Year</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
              {list()!.items.map((c) => (
                <tr class="dark:bg-slate-900">
                  <td class="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{c.title}</td>
                  <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {(c.expand?.authors ?? []).map((a: { name: string }) => a.name).join(', ') || '—'}
                  </td>
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
                  <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{c.year}</td>
                  <td class="px-4 py-3 flex gap-2">
                    <A
                      href={`/capstone/${c.id}`}
                      class="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      View
                    </A>
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      class="text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(c)}
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

      {/* Add / Edit capstone modal */}
      <Modal
        open={isModalOpen()}
        title={isEditing() ? 'Edit capstone' : 'Add capstone'}
        onClose={closeModal}
        class="max-w-lg scrollbar-hide"
      >
        <form
          onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
          class="flex flex-col gap-4"
        >
              <label class="block">
                <span class="font-medium text-slate-700 dark:text-slate-300">Title</span>
                <input
                  type="text"
                  required
                  value={createForm().title}
                  onInput={(e) => setCreateForm((f) => ({ ...f, title: e.currentTarget.value }))}
                  class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
              <label class="block">
                <span class="font-medium text-slate-700 dark:text-slate-300">Abstract</span>
                <div class="mt-1">
                  <RichTextEditor
                    value={createForm().abstract}
                    onChange={(html) => setCreateForm((f) => ({ ...f, abstract: html }))}
                    placeholder="Short summary of the capstone (supports bold, italic, underline, and lists)…"
                    minHeight="9rem"
                  />
                </div>
              </label>
              <div>
                <span class="font-medium text-slate-700 dark:text-slate-300">Authors (required)</span>
                <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Search for a student user or add by name.
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={authorSearchQuery()}
                    onInput={(e) => setAuthorSearchQuery(e.currentTarget.value)}
                    onFocus={() => searchAuthors()}
                    class="flex-1 min-w-[200px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={searchAuthors}
                    disabled={authorSearching()}
                    class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {authorSearching() ? 'Searching…' : 'Search'}
                  </button>
                  <button
                    type="button"
                    onClick={addAuthorByName}
                    class="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    Add as author anyway
                  </button>
                </div>
                {authorSearchResults().length > 0 && (
                  <ul class="mt-2 max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 dark:border-slate-600 dark:bg-slate-800">
                    {authorSearchResults().map((u) => (
                      <li>
                        <button
                          type="button"
                          onClick={() => addAuthorFromUser(u)}
                          class="w-full px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/80"
                        >
                          {u.name} <span class="text-slate-400 dark:text-slate-500">({u.email})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {createForm().authors.length > 0 && (
                  <div class="mt-2 flex flex-wrap gap-2">
                    {createForm().authors.map((a, i) => (
                      <span class="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-100">
                        {a.name}
                        {a.user != null && (
                          <span class="text-xs text-indigo-600 dark:text-indigo-300">(user)</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeAuthor(i)}
                          class="ml-0.5 text-indigo-600 hover:text-indigo-800 dark:text-indigo-300 dark:hover:text-indigo-100"
                          aria-label="Remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <span class="font-medium text-slate-700 dark:text-slate-300">Tags</span>
                <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  Search for a tag or add a new one.
                </p>
                <div class="mt-2 flex flex-wrap gap-2">
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={tagSearchQuery()}
                    onInput={(e) => setTagSearchQuery(e.currentTarget.value)}
                    class="flex-1 min-w-[200px] rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={addTagAsNew}
                    disabled={!tagSearchQuery().trim() || tagCreating()}
                    class="rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                  >
                    {tagCreating() ? 'Adding…' : 'Add as tag'}
                  </button>
                </div>
                {tagSearchResults().length > 0 && (
                  <ul class="mt-2 max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 dark:border-slate-600 dark:bg-slate-800">
                    {tagSearchResults().map((tag) => (
                      <li>
                        <button
                          type="button"
                          onClick={() => addTagToForm(tag)}
                          class="w-full px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700/80"
                        >
                          {tag.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {createForm().tags.length > 0 && (
                  <div class="mt-2 flex flex-wrap gap-2">
                    {createForm().tags.map((tagId) => {
                      const tag = tags()?.find((t) => t.id === tagId);
                      return (
                        <span class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                          {tag?.name ?? tagId}
                          <button
                            type="button"
                            onClick={() => removeTag(tagId)}
                            class="ml-0.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                            aria-label="Remove"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <label class="block">
                <span class="font-medium text-slate-700 dark:text-slate-300">Repository link</span>
                <input
                  type="url"
                  placeholder="https://..."
                  value={createForm().repository_link}
                  onInput={(e) => setCreateForm((f) => ({ ...f, repository_link: e.currentTarget.value }))}
                  class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
              <label class="block">
                <span class="font-medium text-slate-700 dark:text-slate-300">Year</span>
                <input
                  type="number"
                  min="2000"
                  max="2030"
                  value={createForm().year}
                  onInput={(e) => setCreateForm((f) => ({ ...f, year: parseInt(e.currentTarget.value, 10) || createForm().year }))}
                  class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
              {isEditing() && (
                <label class="block">
                  <span class="font-medium text-slate-700 dark:text-slate-300">Status</span>
                  <select
                    value={createForm().status}
                    onInput={(e) => setCreateForm((f) => ({ ...f, status: e.currentTarget.value as CapstoneStatus }))}
                    class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </label>
              )}
              <label class="block">
                <span class="font-medium text-slate-700 dark:text-slate-300">PDF file (optional)</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setCreateForm((f) => ({ ...f, pdf_file: e.currentTarget.files?.[0] ?? null }))}
                  class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 file:mr-2 file:rounded file:border-0 file:bg-indigo-50 file:px-2 file:py-1 file:text-indigo-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:file:bg-indigo-950 dark:file:text-indigo-200"
                />
              </label>
              {createError() && (
                <p class="text-sm text-red-600 dark:text-red-400">{createError()}</p>
              )}
              <div class="flex gap-2 justify-end border-t border-slate-200 pt-4 dark:border-slate-600">
                <button
                  type="button"
                  onClick={closeModal}
                  class="rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting()}
                  class="rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createSubmitting() ? (isEditing() ? 'Saving…' : 'Creating…') : isEditing() ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
      </Modal>

      <ConfirmModal
        open={deleteTarget() !== null}
        title="Delete capstone?"
        message={deleteTarget() ? `Delete "${deleteTarget()!.title}"? This cannot be undone.` : ''}
        danger
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default CapstoneManagement;