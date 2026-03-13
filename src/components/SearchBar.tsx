import { createEffect, createSignal } from 'solid-js';

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  onSearch: (query: string) => void;
  /** When true, call onSearch on every input (for debounced search). When false, only on submit (e.g. landing page). */
  searchOnInput?: boolean;
  /** Called only when the user submits the form (Enter or Search button). Use for analytics/logging. */
  onSearchSubmit?: (query: string) => void;
  class?: string;
}

export default function SearchBar(props: SearchBarProps) {
  const [value, setValue] = createSignal(props.initialValue ?? '');

  // Sync input with URL/initialValue when it changes (e.g. navigating with ?q=)
  createEffect(() => {
    const v = props.initialValue ?? '';
    setValue(v);
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    const trimmed = value().trim();
    props.onSearch(trimmed);
    props.onSearchSubmit?.(trimmed);
  };

  const handleInput = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
    const v = e.currentTarget.value;
    setValue(v);
    if (props.searchOnInput) props.onSearch(v);
  };

  return (
    <form onSubmit={handleSubmit} class={props.class ?? ''}>
      <div class="flex gap-2">
        <input
          type="search"
          value={value()}
          onInput={handleInput}
          placeholder={props.placeholder ?? 'Search by title or abstract...'}
          class="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-800 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
        />
        <button
          type="submit"
          class="rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
        >
          Search
        </button>
      </div>
    </form>
  );
}
