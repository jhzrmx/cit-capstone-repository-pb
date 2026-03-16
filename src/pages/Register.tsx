import { createSignal, onMount } from 'solid-js';
import { useNavigate, useSearchParams, A } from '@solidjs/router';
import { ClientResponseError } from 'pocketbase';
import { authService, isAllowedOAuthEmail, OAUTH_ALLOWED_EMAIL_DOMAIN } from '../services/auth.service';
import { setAuthLoading } from '../stores/authStore';
import { departmentService } from '../services/department.service';
import type { Department } from '../types';

type Step = 'form' | 'otp';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = createSignal<Step>('form');
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [name, setName] = createSignal('');
  const [departmentId, setDepartmentId] = createSignal('');
  const [departments, setDepartments] = createSignal<Department[]>([]);
  const [error, setError] = createSignal('');
  const [otpId, setOtpId] = createSignal('');
  const [otpCode, setOtpCode] = createSignal('');
  const [sendingOtp, setSendingOtp] = createSignal(false);
  const [verifying, setVerifying] = createSignal(false);

  onMount(async () => {
    try {
      const list = await departmentService.getList();
      setDepartments(list);
      if (list.length > 0) setDepartmentId(list[0].id);
    } catch {
      setDepartments([]);
    }
    const qEmail = searchParams.email as string | undefined;
    const qOtpId = searchParams.otpId as string | undefined;
    if (qEmail?.trim() && qOtpId?.trim()) {
      setEmail(qEmail.trim());
      setOtpId(qOtpId.trim());
      setStep('otp');
    }
  });

  const handleSubmitForm = async (e: Event) => {
    e.preventDefault();
    setError('');
    if (!departmentId()) {
      setError('Please select a department.');
      return;
    }
    if (!isAllowedOAuthEmail(email())) {
      setError(`Registration is only for CBSUA accounts (${OAUTH_ALLOWED_EMAIL_DOMAIN}).`);
      return;
    }
    setAuthLoading(true);
    setSendingOtp(true);
    try {
      await authService.registerCreateOnly(email(), password(), name(), departmentId());
      const { otpId: id } = await authService.requestRegistrationOTP(email());
      setOtpId(id);
      setStep('otp');
    } catch (err: unknown) {
      // Friendlier message when the email is already registered.
      if (err instanceof ClientResponseError) {
        const resp = err.response as { message?: string; data?: Record<string, { message?: string }> } | undefined;
        const emailMsg = resp?.data?.email?.message ?? '';
        const combined = `${resp?.message ?? ''} ${emailMsg}`.toLowerCase();

        if (
          combined.includes('already') ||
          combined.includes('exist') ||
          combined.includes('in use') ||
          combined.includes('registered') ||
          combined.includes('unique')
        ) {
          setError('That email is already registered. Try logging in instead.');
          return;
        }
      }

      const rawMsg = err instanceof Error ? err.message : 'Registration failed';
      const lower = rawMsg.toLowerCase();

      // Hide PocketBase’s very generic message
      const base =
        lower.includes('failed to create record') || lower === 'something went wrong.'
          ? 'Registration failed. Please try again in a moment.'
          : rawMsg;

      const withHint =
        lower.includes('otp') || lower.includes('mail')
          ? base
          : `${base} If the verification email never arrives, enable OTP + SMTP in PocketBase (see docs/REGISTER_OTP.md).`;

      setError(withHint);
    } finally {
      setSendingOtp(false);
      setAuthLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setSendingOtp(true);
    try {
      const { otpId: id } = await authService.requestRegistrationOTP(email());
      setOtpId(id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not resend code.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (e: Event) => {
    e.preventDefault();
    setError('');
    if (!otpCode().trim()) {
      setError('Enter the code from your email.');
      return;
    }
    setVerifying(true);
    setAuthLoading(true);
    try {
      await authService.completeRegistrationWithOTP(otpId(), otpCode().trim());
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code. Try again or resend.');
    } finally {
      setVerifying(false);
      setAuthLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500';

  return (
    <div class="flex w-full flex-1 flex-col items-center justify-center py-8 min-h-[calc(100dvh-7rem)] sm:min-h-[calc(100dvh-6.5rem)] animate-card-soft">
      <div class="relative z-0 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <h1 class="text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
          Student registration
        </h1>
        <p class="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Create an account to search and submit capstones. Faculty and admin accounts are managed by
          administrators.
        </p>
        <p class="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2.5 text-left text-xs text-indigo-900 dark:border-indigo-800/80 dark:bg-indigo-950/50 dark:text-indigo-100">
          Use your CBSUA email only ({OAUTH_ALLOWED_EMAIL_DOMAIN}). We will send a one-time code to
          your inbox.
        </p>

        {step() === 'form' && (
          <form onSubmit={handleSubmitForm} class="mt-6 flex flex-col gap-4 text-left">
            <input
              type="email"
              required
              placeholder={`firstname.lastname${OAUTH_ALLOWED_EMAIL_DOMAIN}`}
              value={email()}
              onInput={(e) => setEmail(e.currentTarget.value)}
              title={`Email must end with ${OAUTH_ALLOWED_EMAIL_DOMAIN}`}
              class={inputClass}
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Password (min 8 characters)"
              value={password()}
              onInput={(e) => setPassword(e.currentTarget.value)}
              class={inputClass}
            />
            <input
              type="text"
              required
              placeholder="Full name"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              class={inputClass}
            />
            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Department
              </span>
              <select
                required
                value={departmentId()}
                onInput={(e) => setDepartmentId(e.currentTarget.value)}
                disabled={departments().length === 0}
                class={`${inputClass} disabled:opacity-60`}
              >
                <option value="">
                  {departments().length === 0
                    ? 'No departments available—contact an administrator'
                    : 'Select department'}
                </option>
                {departments().map((d) => (
                  <option value={d.id}>{d.name}</option>
                ))}
              </select>
            </label>
            {error() && <p class="text-sm text-red-600 dark:text-red-400">{error()}</p>}
            <button
              type="submit"
              disabled={sendingOtp()}
              class="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {sendingOtp() ? 'Creating account & sending code…' : 'Continue — send code to email'}
            </button>
          </form>
        )}

        {step() === 'otp' && (
          <div class="mt-6 border-t border-slate-200 pt-6 dark:border-slate-600">
            <p class="text-sm text-slate-600 dark:text-slate-400">
              We sent a code to <strong class="text-slate-800 dark:text-slate-200">{email()}</strong>.
              Enter it below to finish signing up.
            </p>
            <form onSubmit={handleVerifyOtp} class="mt-4 flex flex-col gap-4 text-left">
              <input
                type="text"
                inputMode="numeric"
                autocomplete="one-time-code"
                placeholder="6-digit code"
                value={otpCode()}
                onInput={(e) => setOtpCode(e.currentTarget.value.replace(/\s/g, ''))}
                class={`${inputClass} text-center text-lg tracking-widest`}
              />
              {error() && <p class="text-sm text-red-600 dark:text-red-400">{error()}</p>}
              <button
                type="submit"
                disabled={verifying()}
                class="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {verifying() ? 'Verifying…' : 'Verify & sign in'}
              </button>
              <button
                type="button"
                disabled={sendingOtp()}
                onClick={handleResendOtp}
                class="text-sm text-indigo-600 hover:underline dark:text-indigo-400 disabled:opacity-50"
              >
                {sendingOtp() ? 'Sending…' : 'Resend code'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setOtpCode('');
                  setError('');
                }}
                class="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              >
                ← Back to form
              </button>
            </form>
          </div>
        )}

        <p class="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Already have an account?{' '}
          <A href="/login" class="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Log in
          </A>
        </p>
      </div>
    </div>
  );
};

export default Register;