import { A, useLocation, useNavigate } from '@solidjs/router';
import { createSignal, Show } from 'solid-js';
import { auth } from '../stores/authStore';
import { toggleTheme } from '../stores/themeStore';
import ConfirmModal from './ConfirmModal';
import { authService } from '../services/auth.service';
import type { UserRole } from '../types';

const navLinks: { href: string; label: string; roles?: UserRole[] }[] = [
  { href: '/', label: 'Home' },
  { href: '/search', label: 'Search' },
  { href: '/submit', label: 'Submit', roles: ['student'] },
  { href: '/my-submissions', label: 'My Submissions', roles: ['student'] },
  { href: '/faculty/dashboard', label: 'Dashboard', roles: ['faculty'] },
  { href: '/faculty/approvals', label: 'Approvals', roles: ['faculty'] },
  { href: '/admin/users', label: 'Users', roles: ['admin'] },
  { href: '/admin/capstones', label: 'Capstones', roles: ['admin'] },
  { href: '/admin/departments', label: 'Departments', roles: ['admin'] },
];

const canSee = (roles?: UserRole[]) => {
  if (!roles) return true;
  const user = auth.user;
  return user && roles.includes(user.role);
}

const DarkModeButton = () => {
  const [dark, setDark] = createSignal(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );
  return (
    <button
      type="button"
      onClick={() => setDark(toggleTheme())}
      class="rounded-lg p-2 text-slate-600 transition-colors duration-300 ease-out hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      aria-label={dark() ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark() ? 'Light mode' : 'Dark mode'}
    >
      <Show
        when={dark()}
        fallback={
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        }
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      </Show>
    </button>
  );
}

const Layout = (props: { children?: import('solid-js').JSX.Element }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = createSignal(false);
  const [logoutOpen, setLogoutOpen] = createSignal(false);
  const navigate = useNavigate();

  const visibleLinks = () => navLinks.filter((l) => canSee(l.roles));

  return (
    <div class="flex min-h-screen flex-col bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
      <header class="fixed left-0 right-0 top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
        <A href="/" class="min-w-0 shrink text-base font-semibold text-indigo-700 dark:text-indigo-400 sm:text-lg">
          CIT Capstone Repository
        </A>
        <div class="flex shrink-0 items-center gap-1">
          <DarkModeButton />
          <Show when={auth.user}>
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              class="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 md:hidden"
              aria-label="Toggle menu"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </Show>
        </div>
      </header>

      <Show when={auth.user && sidebarOpen()}>
        <div
          class="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      </Show>

      <Show when={auth.user}>
        <aside
          class="fixed left-0 top-14 z-30 h-[calc(100vh-3.5rem)] w-56 -translate-x-full transform border-r border-slate-200 bg-white shadow-lg transition-transform duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 md:translate-x-0 md:shadow-none"
          classList={{
            'translate-x-0': sidebarOpen(),
          }}
        >
          <nav class="flex h-full flex-col overflow-y-auto py-4">
            <ul class="flex flex-1 flex-col gap-0.5 px-3">
              {visibleLinks().map((link) => (
                <li>
                  <A
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    class="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                    classList={{
                      'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300':
                        location.pathname === link.href,
                      'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100':
                        location.pathname !== link.href,
                    }}
                  >
                    {link.label}
                  </A>
                </li>
              ))}
            </ul>
            <div class="mt-auto border-t border-slate-200 px-3 pt-4 dark:border-slate-800">
              <p class="truncate px-3 py-1 text-xs text-slate-500 dark:text-slate-400">{auth.user!.name}</p>
              <button
                type="button"
                onClick={() => {
                  setSidebarOpen(false);
                  setLogoutOpen(true);
                }}
                class="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Log out
              </button>
            </div>
          </nav>
        </aside>
      </Show>

      <main
        class="flex flex-1 flex-col bg-slate-50 dark:bg-slate-950"
        classList={{ 'md:pl-56': !!auth.user }}
      >
        <div class="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col mx-4 pt-14 lg:px-8 animate-page-soft">
          <div class="p-8">
            {props.children}
          </div>
        </div>
      </main>

      <ConfirmModal
        open={logoutOpen()}
        title="Log out?"
        message="You’ll be signed out of the CIT Capstone Repository on this device."
        danger
        confirmLabel="Log out"
        onConfirm={async () => {
          authService.logout();
          navigate('/', { replace: true });
        }}
        onCancel={() => setLogoutOpen(false)}
      />
    </div>
  );
};

export default Layout;