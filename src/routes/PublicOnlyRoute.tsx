import { Show, createEffect } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { auth } from '../stores/authStore';

/** Redirect to home if already signed in (login/register). */
const PublicOnlyRoute = (props: { children: import('solid-js').JSX.Element }) => {
  const navigate = useNavigate();

  createEffect(() => {
    if (auth.user && !auth.pendingOAuthDepartment) navigate('/', { replace: true });
  });

  return (
    <Show
      when={!auth.user || auth.pendingOAuthDepartment}
      fallback={<div class="py-12 text-center text-sm text-slate-500">Redirecting…</div>}
    >
      {props.children}
    </Show>
  );
};

export default PublicOnlyRoute;