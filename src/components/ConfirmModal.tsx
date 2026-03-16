import { createSignal } from 'solid-js';
import Modal from './Modal';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  /** Sync or async; modal closes only after successful completion */
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const ConfirmModal = (props: ConfirmModalProps) => {
  const [pending, setPending] = createSignal(false);

  const confirm = async () => {
    if (pending()) return;
    setPending(true);
    try {
      await Promise.resolve(props.onConfirm());
      props.onCancel();
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={props.open} title={props.title} onClose={() => !pending() && props.onCancel()}>
      <p class="text-slate-600">{props.message}</p>
      <div class="mt-6 flex justify-end gap-2">
        <button
          type="button"
          disabled={pending()}
          onClick={props.onCancel}
          class="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending()}
          onClick={confirm}
          class="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          classList={{
            'bg-red-600 hover:bg-red-700': props.danger,
            'bg-indigo-600 hover:bg-indigo-700': !props.danger,
          }}
        >
          {pending() ? 'Please wait…' : (props.confirmLabel ?? 'Confirm')}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmModal;