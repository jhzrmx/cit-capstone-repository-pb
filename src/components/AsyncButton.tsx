import { createSignal, type JSX } from 'solid-js';

export interface AsyncButtonProps {
  type?: 'button' | 'submit';
  class?: string;
  disabled?: boolean;
  /** Shown while the action runs (default: "Please wait…") */
  loadingLabel?: string;
  /** If true, children stay visible; only disabled state changes */
  keepLabel?: boolean;
  onClick?: (e: MouseEvent) => void | Promise<void>;
  children: JSX.Element;
}

/**
 * Disables on click until onClick (async) finishes. Use for any action that hits the API.
 * For form submit, prefer parent `submitting` + disabled on submit button if onSubmit is on the form.
 */
export default function AsyncButton(props: AsyncButtonProps) {
  const [pending, setPending] = createSignal(false);
  const busy = () => pending() || !!props.disabled;

  const handle = async (e: MouseEvent) => {
    if (busy()) return;
    e.preventDefault();
    setPending(true);
    try {
      await props.onClick?.(e);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type={props.type ?? 'button'}
      disabled={busy()}
      onClick={handle}
      class={`${props.class ?? ''} disabled:cursor-not-allowed disabled:opacity-50`}
      aria-busy={pending()}
    >
      {pending() && !props.keepLabel
        ? (props.loadingLabel ?? 'Please wait…')
        : props.children}
    </button>
  );
}
