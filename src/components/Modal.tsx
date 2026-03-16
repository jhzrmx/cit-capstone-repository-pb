interface ModalProps {
  open: boolean;
  /** Modal title (shown in header with close button) */
  title: string;
  onClose: () => void;
  children: import('solid-js').JSX.Element;
  /** Click backdrop to close (default true) */
  closeOnBackdropClick?: boolean;
  /** Extra class for the content panel (e.g. max-w-lg) */
  class?: string;
}

const Modal = (props: ModalProps) => {
  const closeOnBackdrop = () => props.closeOnBackdropClick !== false;

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200"
      classList={{
        'opacity-100 pointer-events-auto': props.open,
        'opacity-0 pointer-events-none': !props.open,
      }}
      role="dialog"
      aria-modal="true"
      aria-hidden={!props.open}
    >
      <div
        class="absolute inset-0 bg-black/50 transition-opacity duration-200"
        classList={{
          'opacity-100': props.open,
          'opacity-0': !props.open,
        }}
        onClick={closeOnBackdrop() ? props.onClose : undefined}
      />
      <div
        class={`relative z-10 max-h-[90vh] w-full max-w-md overflow-auto rounded-xl border border-slate-200 bg-white shadow-xl transition-all duration-200 dark:border-slate-700 dark:bg-slate-900 ${props.class ?? ''}`}
        classList={{
          'scale-100 opacity-100': props.open,
          'scale-75 opacity-0': !props.open,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">{props.title}</h2>
          <button
            type="button"
            onClick={props.onClose}
            class="rounded p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div class="px-6 py-4">{props.children}</div>
      </div>
    </div>
  );
};

export default Modal;