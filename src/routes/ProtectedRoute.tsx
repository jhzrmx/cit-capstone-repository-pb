import { Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { auth } from '../stores/authStore';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: import('solid-js').JSX.Element;
  roles?: UserRole[];
}

const ProtectedRoute = (props: ProtectedRouteProps) => {
  const navigate = useNavigate();

  const allowed = () => {
    const user = auth.user;
    if (!user) return false;
    if (!props.roles) return true;
    return props.roles.includes(user.role);
  };

  return (
    <Show
      when={allowed()}
      fallback={
        <div class="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950/50">
          <p class="text-amber-900 dark:text-amber-100">
            You need to sign in or don't have permission to view this page.
          </p>
          <button
            type="button"
            onClick={() => navigate(auth.user ? '/' : '/login')}
            class="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-white hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600"
          >
            {auth.user ? 'Go to Home' : 'Log in'}
          </button>
        </div>
      }
    >
      {props.children}
    </Show>
  );
};

export default ProtectedRoute;