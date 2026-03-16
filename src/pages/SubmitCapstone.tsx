import { createSignal, onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { capstoneService } from '../services/capstone.service';
import { tagService } from '../services/tag.service';
import { auth } from '../stores/authStore';
import { Skeleton } from '../components/Skeleton';
import type { Tag } from '../types';

const SubmitCapstone = () => {
  const navigate = useNavigate();
  const [tags, setTags] = createSignal<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = createSignal(true);
  const [tagSearchQuery, setTagSearchQuery] = createSignal('');
  const [title, setTitle] = createSignal('');
  const [abstract, setAbstract] = createSignal('');
  const [selectedTagIds, setSelectedTagIds] = createSignal<string[]>([]);
  const [repositoryLink, setRepositoryLink] = createSignal('');
  const [year, setYear] = createSignal(new Date().getFullYear());
  const [pdfFile, setPdfFile] = createSignal<File | null>(null);
  const [error, setError] = createSignal('');
  const [submitting, setSubmitting] = createSignal(false);

  onMount(async () => {
    const list = await tagService.getList();
    setTags(list);
    setTagsLoading(false);
  });

  const tagSearchResults = (): Tag[] => {
    const q = tagSearchQuery().trim().toLowerCase();
    const all = tags();
    if (!all.length) return [];
    const selected = selectedTagIds();
    const matching = q
      ? all.filter((t) => t.name.toLowerCase().includes(q) && !selected.includes(t.id))
      : all.filter((t) => !selected.includes(t.id));
    return matching.slice(0, 15);
  };

  const addTag = (tag: Tag) => {
    if (selectedTagIds().includes(tag.id)) return;
    setSelectedTagIds((prev) => [...prev, tag.id]);
    setTagSearchQuery('');
  };

  const removeTag = (tagId: string) => {
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!auth.user) return;
    setError('');
    setSubmitting(true);
    try {
      await capstoneService.create({
        title: title(),
        abstract: abstract(),
        authors: [{ name: auth.user!.name, user: auth.user!.id }],
        tags: selectedTagIds(),
        pdf_file: pdfFile(),
        repository_link: repositoryLink(),
        year: year(),
      });
      navigate('/my-submissions');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass =
    'mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500';
  const inputClassNoMt =
    'w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500';

  return (
    <div class="mx-auto max-w-xl animate-page-soft">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">Submit Capstone</h1>
      <p class="mt-1 text-slate-600 dark:text-slate-400">
        Your submission will be reviewed by faculty before it appears in search.
      </p>
      <form onSubmit={handleSubmit} class="mt-6 flex flex-col gap-4">
        <label class="block">
          <span class="font-medium text-slate-700 dark:text-slate-300">Title</span>
          <input
            type="text"
            required
            value={title()}
            onInput={(e) => setTitle(e.currentTarget.value)}
            class={fieldClass}
          />
        </label>
        <label class="block">
          <span class="font-medium text-slate-700 dark:text-slate-300">Abstract</span>
          <textarea
            required
            rows={4}
            value={abstract()}
            onInput={(e) => setAbstract(e.currentTarget.value)}
            class={fieldClass}
          />
        </label>
        <div>
          <span class="font-medium text-slate-700 dark:text-slate-300">Tags</span>
          <p class="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
            Search and add tags for your capstone.
          </p>
          {tagsLoading() ? (
            <div class="mt-2 flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map(() => (
                <Skeleton class="h-8 w-20 rounded-full" />
              ))}
            </div>
          ) : (
            <div class="mt-2 space-y-2">
              <input
                type="text"
                placeholder="Search by name..."
                value={tagSearchQuery()}
                onInput={(e) => setTagSearchQuery(e.currentTarget.value)}
                class={inputClassNoMt}
              />
              {tagSearchResults().length > 0 && (
                <ul class="scrollbar-thin max-h-32 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-sm dark:border-slate-600 dark:bg-slate-800 dark:shadow-none">
                  {tagSearchResults().map((tag) => (
                    <li>
                      <button
                        type="button"
                        onClick={() => addTag(tag)}
                        class="w-full px-4 py-2 text-left text-sm text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/90"
                      >
                        {tag.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedTagIds().length > 0 && (
                <div class="flex flex-wrap gap-2">
                  {selectedTagIds().map((tagId) => {
                    const tag = tags().find((t) => t.id === tagId);
                    return (
                      <span class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
                        {tag?.name ?? tagId}
                        <button
                          type="button"
                          onClick={() => removeTag(tagId)}
                          class="ml-0.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                          aria-label="Remove tag"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        <label class="block">
          <span class="font-medium text-slate-700 dark:text-slate-300">Repository link</span>
          <input
            type="url"
            placeholder="https://..."
            value={repositoryLink()}
            onInput={(e) => setRepositoryLink(e.currentTarget.value)}
            class={fieldClass}
          />
        </label>
        <label class="block">
          <span class="font-medium text-slate-700 dark:text-slate-300">Year</span>
          <input
            type="number"
            min="2000"
            max="2030"
            value={year()}
            onInput={(e) => setYear(parseInt(e.currentTarget.value, 10) || year())}
            class={fieldClass}
          />
        </label>
        <label class="block">
          <span class="font-medium text-slate-700 dark:text-slate-300">PDF file (optional)</span>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setPdfFile(e.currentTarget.files?.[0] ?? null)}
            class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 file:mr-2 file:rounded file:border-0 file:bg-indigo-50 file:px-2 file:py-1 file:text-indigo-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:file:bg-indigo-950 dark:file:text-indigo-200"
          />
        </label>
        {error() && <p class="text-sm text-red-600 dark:text-red-400">{error()}</p>}
        <button
          type="submit"
          disabled={submitting()}
          class="rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting() ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

export default SubmitCapstone;