import { createSignal, onMount, Show } from 'solid-js';
import { useNavigate, useSearchParams, A } from '@solidjs/router';
import { authService } from '../services/auth.service';
import { setAuthLoading } from '../stores/authStore';

/**
 * Public page: send OTP to email and complete verification (same as Register step 2).
 * Linked from Login when password login fails (unverified) or directly /verify-email?email=...
 */
const VerifyEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = createSignal('');
  const [otpId, setOtpId] = createSignal('');
  const [otpCode, setOtpCode] = createSignal('');
  const [sending, setSending] = createSignal(false);
  const [verifying, setVerifying] = createSignal(false);
  const [error, setError] = createSignal('');
  const [sentOnce, setSentOnce] = createSignal(false);

  const fromLogin = () => searchParams.from === 'login' || searchParams.reason === 'unverified';

  onMount(() => {
    const q = (searchParams.email as string)?.trim();
    if (q) setEmail(q);
    if (searchParams.sent === '1') setSentOnce(true);
  });

  const sendCode = async () => {
    setError('');
    if (!email().trim()) {
      setError('Enter the email you used to register.');
      return;
    }
    setSending(true);
    try {
      const { otpId: id } = await authService.requestRegistrationOTP(email());
      setOtpId(id);
      setSentOnce(true);
      navigate(`/verify-email?email=${encodeURIComponent(email())}&sent=1`, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send code.');
    } finally {
      setSending(false);
    }
  };

  const verify = async (e: Event) => {
    e.preventDefault();
    setError('');
    if (!otpId()) {
      setError('Send a code to your email first.');
      return;
    }
    if (!otpCode().trim()) {
      setError('Enter the code from your email.');
      return;
    }
    setVerifying(true);
    setAuthLoading(true);
    try {
      await authService.completeRegistrationWithOTP(otpId(), otpCode().trim());
      navigate('/', { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid or expired code.');
    } finally {
      setVerifying(false);
      setAuthLoading(false);
    }
  };

  return (
    <div class="flex w-full flex-1 flex-col items-center justify-center py-8 min-h-[calc(100dvh-7rem)] sm:min-h-[calc(100dvh-6.5rem)] animate-card-soft">
      <div class="relative z-0 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <h1 class="text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
          Verify your account
        </h1>

        <Show
          when={fromLogin()}
          fallback={
            <p class="mt-3 text-center text-sm text-slate-600 dark:text-slate-400">
              Enter the email you registered with. We’ll send a one-time code. After verifying, you can sign in with
              email and password.
            </p>
          }
        >
          <p class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-100">
            That account isn’t verified yet. Confirm your email with the code we send below—then you can use{' '}
            <strong>Log in</strong> with your password.
          </p>
        </Show>

        <div class="mt-6 flex flex-col gap-4">
          <label class="block text-left">
            <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
            <input
              type="email"
              placeholder="you@cbsua.edu.ph"
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              disabled={!!otpId() && sentOnce()}
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-800/80"
            />
          </label>

          <Show
            when={!otpId() || !sentOnce()}
            fallback={
              <p class="text-xs text-slate-500 dark:text-slate-400">
                Code sent to <strong class="text-slate-700 dark:text-slate-200">{email()}</strong>.{' '}
                <button
                  type="button"
                  class="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                  onClick={() => {
                    setOtpId('');
                    setSentOnce(false);
                    setOtpCode('');
                    navigate('/verify-email', { replace: true });
                  }}
                >
                  Wrong email?
                </button>
              </p>
            }
          >
            <button
              type="button"
              disabled={sending() || !email().trim()}
              onClick={sendCode}
              class="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {sending() ? 'Sending…' : 'Send verification code'}
            </button>
          </Show>

          <Show when={otpId() && sentOnce()}>
            <form
              onSubmit={verify}
              class="flex flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-600"
            >
              <label class="block text-left">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">One-time code</span>
                <input
                  type="text"
                  inputMode="numeric"
                  autocomplete="one-time-code"
                  placeholder="6-digit code"
                  value={otpCode()}
                  onInput={(e) => setOtpCode(e.currentTarget.value.replace(/\s/g, ''))}
                  class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-lg tracking-widest text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
              <button
                type="submit"
                disabled={verifying()}
                class="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {verifying() ? 'Verifying…' : 'Verify & continue'}
              </button>
              <button
                type="button"
                disabled={sending()}
                onClick={sendCode}
                class="text-sm text-indigo-600 hover:underline disabled:opacity-50 dark:text-indigo-400"
              >
                {sending() ? 'Sending…' : 'Resend code'}
              </button>
            </form>
          </Show>

          {error() && (
            <p class="text-sm text-red-600 dark:text-red-400" role="alert">
              {error()}
            </p>
          )}
        </div>

        <p class="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          <A href="/login" class="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Back to log in
          </A>
          <span class="text-slate-400 dark:text-slate-500"> · </span>
          <A href="/register" class="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Register
          </A>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;