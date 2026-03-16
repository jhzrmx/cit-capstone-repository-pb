import { createSignal, Show } from 'solid-js';
import { A, useSearchParams } from '@solidjs/router';
import { authService } from '../services/auth.service';

const PasswordReset = () => {
  const [params] = useSearchParams();
  const token = () => params.token ?? '';

  const [password, setPassword] = createSignal('');
  const [confirm, setConfirm] = createSignal('');
  const [submitting, setSubmitting] = createSignal(false);
  const [success, setSuccess] = createSignal(false);
  const [error, setError] = createSignal('');

  const hasToken = () => !!token().trim();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');

    if (!hasToken()) {
      setError('This link is missing a reset token. Please request a new password reset email.');
      return;
    }

    const pwd = password().trim();
    const c = confirm().trim();

    if (!pwd || !c) {
      setError('Enter and confirm your new password.');
      return;
    }

    if (pwd.length < 8) {
      setError('Your new password must be at least 8 characters long.');
      return;
    }

    if (pwd !== c) {
      setError('The passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await authService.confirmPasswordReset(token(), pwd);
      setSuccess(true);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : 'This reset link is invalid or has expired. Please request a new password reset email.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="flex w-full flex-1 flex-col items-center justify-center py-8 min-h-[calc(100dvh-7rem)] sm:min-h-[calc(100dvh-6.5rem)] animate-card-soft">
      <div class="relative z-0 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <h1 class="text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
          Reset password
        </h1>

        <Show when={hasToken()} fallback={
          <p class="mt-3 text-center text-sm text-slate-600 dark:text-slate-400">
            This password reset link is missing a token or is invalid.
            {' '}
            <A href="/forgot-password" class="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Request a new reset email
            </A>
            .
          </p>
        }>
          <Show when={!success()} fallback={
            <p class="mt-3 text-center text-sm text-emerald-600 dark:text-emerald-300">
              Your password has been updated. You can now{' '}
              <A href="/login" class="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                sign in
              </A>
              .
            </p>
          }>
            <p class="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
              Choose a new password for your account. After you save it, you can use it to sign in.
            </p>

            <form onSubmit={handleSubmit} class="mt-6 flex flex-col gap-4 text-left">
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  New password
                </label>
                <input
                  type="password"
                  autocomplete="new-password"
                  value={password()}
                  onInput={(e) => setPassword(e.currentTarget.value)}
                  class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Confirm password
                </label>
                <input
                  type="password"
                  autocomplete="new-password"
                  value={confirm()}
                  onInput={(e) => setConfirm(e.currentTarget.value)}
                  class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              {error() && <p class="text-sm text-red-600 dark:text-red-400">{error()}</p>}

              <button
                type="submit"
                disabled={submitting()}
                class="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting() ? 'Saving new password…' : 'Save new password'}
              </button>
            </form>
          </Show>
        </Show>
      </div>
    </div>
  );
};

export default PasswordReset;

