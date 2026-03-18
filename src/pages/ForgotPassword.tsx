import { A } from '@solidjs/router';
import { createSignal } from 'solid-js';
import { authService, OAUTH_ALLOWED_EMAIL_DOMAIN } from '../services/auth.service';

const ForgotPassword = () => {
  const [email, setEmail] = createSignal('');
  const [submitting, setSubmitting] = createSignal(false);
  const [message, setMessage] = createSignal('');
  const [error, setError] = createSignal('');

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const value = email().trim();
    if (!value) {
      setError('Enter the email linked to your account.');
      return;
    }
    if (value && OAUTH_ALLOWED_EMAIL_DOMAIN && !value.endsWith(`${OAUTH_ALLOWED_EMAIL_DOMAIN}`)) {
      setError('Enter valid CBSUA email address.');
      return;
    }
    setSubmitting(true);
    try {
      await authService.requestPasswordReset(value);
      setMessage(
        'If that email is registered, we sent a password reset link. Please check your inbox (and spam folder).'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send reset email. Please try again.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="flex w-full flex-1 flex-col items-center justify-center py-8 min-h-[calc(100dvh-7rem)] sm:min-h-[calc(100dvh-6.5rem)] animate-card-soft">
      <div class="relative z-0 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <h1 class="text-center text-2xl font-bold text-slate-900 dark:text-slate-100">Forgot password</h1>
        <p class="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Enter the email you use to sign in. We&apos;ll send a link to reset your password.
        </p>
        <p class="mt-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/50 dark:text-amber-100">
          Password reset works for accounts created with email and password. If you usually sign in with Google
          ({OAUTH_ALLOWED_EMAIL_DOMAIN}), you can reset your password in your Google account instead.
        </p>

        <form onSubmit={handleSubmit} class="mt-6 flex flex-col gap-4 text-left">
          <input
            type="email"
            required
            placeholder="firstname.lastname@cbsua.edu.ph"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            class="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {message() && <p class="text-sm text-emerald-600 dark:text-emerald-300">{message()}</p>}
          {error() && <p class="text-sm text-red-600 dark:text-red-400">{error()}</p>}
          <button
            type="submit"
            disabled={submitting()}
            class="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting() ? 'Sending reset link…' : 'Send reset link'}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Remembered your password?{' '}
          <A href="/login" class="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Back to log in
          </A>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;

