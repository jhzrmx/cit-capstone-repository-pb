import { createEffect, onCleanup, onMount } from 'solid-js';
import type { JSX } from 'solid-js';

interface RichTextEditorProps {
  id?: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  class?: string;
  'aria-label'?: string;
}

const RichTextEditor = (props: RichTextEditorProps) => {
  let editorRef: HTMLDivElement | undefined;

  const minHeight = props.minHeight ?? '8rem';

  const syncFromValue = () => {
    if (!editorRef) return;
    // Do not clobber user typing; only sync when editor is not focused.
    if (document.activeElement === editorRef) return;
    const normalized = props.value || '';
    if (editorRef.innerHTML !== normalized) {
      editorRef.innerHTML = normalized;
    }
  };

  const emitChange = () => {
    const html = editorRef?.innerHTML ?? '';
    props.onChange(html);
  };

  const exec = (cmd: string) => {
    // document.execCommand is deprecated but still widely supported and fine for a small editor.
    document.execCommand(cmd, false);
    editorRef?.focus();
    emitChange();
  };

  const handlePaste: JSX.EventHandlerUnion<HTMLDivElement, ClipboardEvent> = (e) => {
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') ?? '';
    if (text) {
      document.execCommand('insertText', false, text);
      emitChange();
    }
  };

  const handleInput: JSX.EventHandlerUnion<HTMLDivElement, InputEvent> = () => {
    emitChange();
  };

  onMount(syncFromValue);

  createEffect(syncFromValue);

  onCleanup(() => {
    editorRef = undefined;
  });

  return (
    <div
      class={`overflow-hidden rounded-lg border border-slate-300 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-900 ${
        props.class ?? ''
      }`}
    >
      <div class="flex gap-1 border-b border-slate-200 bg-slate-50 px-1.5 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
        <button
          type="button"
          onClick={() => exec('bold')}
          class="rounded p-1.5 text-xs hover:bg-slate-200/80 dark:hover:bg-slate-700"
          title="Bold"
          aria-label="Bold"
        >
          <span class="text-[0.7rem] tracking-wide">B</span>
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          class="rounded p-1.5 text-xs hover:bg-slate-200/80 dark:hover:bg-slate-700"
          title="Italic"
          aria-label="Italic"
        >
          <span class="italic">I</span>
        </button>
        <button
          type="button"
          onClick={() => exec('underline')}
          class="rounded p-1.5 text-xs hover:bg-slate-200/80 dark:hover:bg-slate-700"
          title="Underline"
          aria-label="Underline"
        >
          <span class="underline">U</span>
        </button>
        <span class="mx-1 h-5 w-px self-center bg-slate-200 dark:bg-slate-600" />
        <button
          type="button"
          onClick={() => exec('removeFormat')}
          class="rounded p-1.5 text-xs hover:bg-slate-200/80 dark:hover:bg-slate-700"
          title="Clear formatting"
          aria-label="Clear formatting"
        >
          ✕
        </button>
      </div>
      <div
        ref={(el) => {
          editorRef = el ?? undefined;
        }}
        id={props.id}
        contentEditable
        role="textbox"
        aria-label={props['aria-label'] ?? 'Rich text editor'}
        data-placeholder={props.placeholder ?? 'Write content…'}
        onInput={handleInput}
        onPaste={handlePaste}
        class="rich-text-editor-area w-full min-w-0 cursor-text overflow-y-auto bg-white px-4 py-2 text-sm text-slate-900 outline-none dark:bg-slate-900 dark:text-slate-100"
        style={{ 'min-height': minHeight }}
      />
    </div>
  );
};

export default RichTextEditor;
