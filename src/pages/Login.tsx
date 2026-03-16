import { createSignal, onMount, Show } from 'solid-js';
import { useNavigate, A } from '@solidjs/router';
import {
  authService,
  formatOAuthError,
  LOGIN_EMAIL_NOT_VERIFIED,
  OAUTH_ALLOWED_EMAIL_DOMAIN,
} from '../services/auth.service';
import { setAuthLoading, setPendingOAuthDepartment } from '../stores/authStore';
import { departmentService } from '../services/department.service';
import Modal from '../components/Modal';
import type { Department } from '../types';

const OAUTH_PROVIDER = import.meta.env.VITE_OAUTH_PROVIDER ?? 'google';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [error, setError] = createSignal('');
  const [oauthBusy, setOauthBusy] = createSignal(false);
  const [showDeptModal, setShowDeptModal] = createSignal(false);
  const [departments, setDepartments] = createSignal<Department[]>([]);
  const [departmentId, setDepartmentId] = createSignal('');
  const [deptSaving, setDeptSaving] = createSignal(false);
  const [loginSubmitting, setLoginSubmitting] = createSignal(false);
  const [deptError, setDeptError] = createSignal('');

  onMount(async () => {
    try {
      const list = await departmentService.getList();
      setDepartments(list);
      if (list.length > 0) setDepartmentId(list[0].id);
    } catch {
      setDepartments([]);
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError('');
    setLoginSubmitting(true);
    setAuthLoading(true);
    try {
      await authService.login(email(), password());
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg === LOGIN_EMAIL_NOT_VERIFIED || msg.includes('not verified')) {
        navigate(
          `/verify-email?email=${encodeURIComponent(email())}&from=login&reason=unverified`,
          { replace: true }
        );
        return;
      }
      setError(msg);
    } finally {
      setLoginSubmitting(false);
      setAuthLoading(false);
    }
  };

  const finishOAuth = (needsDepartment: boolean) => {
    if (needsDepartment && departments().length > 0) {
      setPendingOAuthDepartment(true);
      setShowDeptModal(true);
      return;
    }
    navigate('/');
  };

  const handleOAuthClick = () => {
    setError('');
    setOauthBusy(true);
    setAuthLoading(true);
    authService
      .loginWithOAuth(OAUTH_PROVIDER)
      .then(({ needsDepartment }) => finishOAuth(needsDepartment))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : formatOAuthError(err));
      })
      .finally(() => {
        setOauthBusy(false);
        setAuthLoading(false);
      });
  };

  const saveDepartment = async () => {
    setDeptError('');
    if (!departmentId()) {
      setDeptError('Please select a department.');
      return;
    }
    const user = authService.getCurrentUser();
    if (!user) return;
    setDeptSaving(true);
    try {
      await authService.updateUser(user.id, { department: departmentId() });
      setShowDeptModal(false);
      setPendingOAuthDepartment(false);
      navigate('/', { replace: true });
    } catch (err: unknown) {
      setDeptError(err instanceof Error ? err.message : 'Could not save department.');
    } finally {
      setDeptSaving(false);
    }
  };

  return (
    <div class="flex w-full flex-1 flex-col items-center justify-center py-8 min-h-[calc(100dvh-7rem)] sm:min-h-[calc(100dvh-6.5rem)]">
      {/* One panel: title + Google + email — avoids floating white card over dark / obscured heading */}
      <div class="relative z-0 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <h1 class="text-center text-2xl font-bold text-slate-900 dark:text-slate-100">Log in</h1>

        <div class="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-600 dark:bg-slate-800/80">
          <p class="text-center text-sm font-medium text-slate-800 dark:text-slate-200">CBSUA account</p>
          <p class="mt-1 text-center text-xs text-slate-600 dark:text-slate-400">
            Google sign-in is limited to {OAUTH_ALLOWED_EMAIL_DOMAIN}
          </p>
          <button
            type="button"
            onClick={handleOAuthClick}
            disabled={oauthBusy()}
            class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2.5 text-sm font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-slate-500 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
          >
            <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {oauthBusy() ? 'Opening Google…' : 'Continue with Google'}
          </button>
        </div>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center" aria-hidden="true">
            <div class="w-full border-t border-slate-200 dark:border-slate-600" />
          </div>
          <div class="relative flex justify-center text-xs uppercase tracking-wide">
            <span class="bg-white px-3 text-slate-500 dark:bg-slate-900 dark:text-slate-400">Or email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} class="flex flex-col gap-4 text-left">
          <input
            type="email"
            required
            placeholder="Email"
            value={email()}
            onInput={(e) => setEmail(e.currentTarget.value)}
            class="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password()}
            onInput={(e) => setPassword(e.currentTarget.value)}
            class="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          {error() && <p class="text-sm text-red-600 dark:text-red-400">{error()}</p>}
          <button
            type="submit"
            disabled={loginSubmitting()}
            class="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loginSubmitting() ? 'Signing in…' : 'Log in'}
          </button>
        </form>

        <p class="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
          Don't have an account?{' '}
          <A href="/register" class="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
            Register
          </A>
        </p>
      </div>

      <Modal
        open={showDeptModal()}
        title="Select your department"
        onClose={() => {
          setShowDeptModal(false);
          setPendingOAuthDepartment(false);
          navigate('/', { replace: true });
        }}
        closeOnBackdropClick={false}
      >
        <p class="mb-4 text-sm text-slate-600 dark:text-slate-400">
          Complete your profile by choosing the department you belong to.
        </p>
        <Show
          when={departments().length > 0}
          fallback={
            <p class="text-sm text-amber-800 dark:text-amber-200">
              No departments available. Ask an admin to add departments.
            </p>
          }
        >
          <label class="block">
            <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Department</span>
            <select
              value={departmentId()}
              onChange={(e) => setDepartmentId(e.currentTarget.value)}
              class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {departments().map((d) => (
                <option value={d.id}>{d.name}</option>
              ))}
            </select>
          </label>
        </Show>
        {deptError() && <p class="mt-2 text-sm text-red-600 dark:text-red-400">{deptError()}</p>}
        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setShowDeptModal(false);
              setPendingOAuthDepartment(false);
              navigate('/', { replace: true });
            }}
            class="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Skip for now
          </button>
          <button
            type="button"
            disabled={deptSaving() || departments().length === 0}
            onClick={saveDepartment}
            class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deptSaving() ? 'Saving…' : 'Continue'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Login;