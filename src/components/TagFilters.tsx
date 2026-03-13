import type { Tag } from '../types';

interface TagFiltersProps {
  tags: Tag[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  class?: string;
}

export default function TagFilters(props: TagFiltersProps) {
  return (
    <div class={props.class ?? ''}>
      <p class="mb-2 text-sm font-medium text-slate-600 dark:text-slate-400">Filter by tags</p>
      <div class="flex flex-wrap gap-2">
        {props.tags.map((tag) => {
          const selected = props.selectedIds.includes(tag.id);
          return (
            <button
              type="button"
              onClick={() => props.onToggle(tag.id)}
              class="rounded-full border px-3 py-1 text-sm font-medium transition-colors"
              classList={{
                'border-indigo-600 bg-indigo-50 text-indigo-800 dark:border-indigo-400 dark:bg-indigo-600 dark:text-white':
                  selected,
                'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700/80':
                  !selected,
              }}
            >
              {tag.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
