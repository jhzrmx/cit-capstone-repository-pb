import { useNavigate, A } from '@solidjs/router';
import { Show } from 'solid-js';
import SearchBar from '../components/SearchBar';
import { auth } from '../stores/authStore';
import BeautifulBackground from '../components/BeautifulBackground';

const Landing = () => {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div class="relative flex min-h-0 flex-1 overflow-hidden animate-page-soft">
      <div class="mx-auto max-w-4xl px-4 pt-12 pb-10 text-center sm:pt-20 sm:pb-12">
        <p class="mb-6 inline-block rounded-full border border-indigo-200/80 bg-white/80 px-4 py-1.5 text-sm font-medium tracking-wide text-indigo-700 shadow-sm backdrop-blur-sm dark:border-indigo-500/40 dark:bg-slate-800/90 dark:text-indigo-300">
          College of Information Technology
        </p>

        <h1 class="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 md:text-6xl">
          <span class="block text-slate-900 dark:text-slate-100">CIT Capstone</span>
          <span class="mt-2 block bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-violet-400">
            Repository
          </span>
        </h1>
        <p class="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300 sm:text-xl">
          Discover, explore, and learn from capstone projects by students and researchers. Sign in to search by title,
          abstract, or tags.
        </p>

        <div class="mx-auto mt-12 max-w-xl">
          <Show
            when={auth.user}
            fallback={
              <div class="space-y-2">
                <div class="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <A
                    href="/login"
                    class="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950"
                  >
                    Log in
                  </A>
                  <A
                    href="/register"
                    class="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-700 dark:focus:ring-offset-slate-950"
                  >
                    Register
                  </A>
                </div>
              </div>
            }
          >
            <SearchBar onSearch={handleSearch} placeholder="Search by title or abstract..." />
            <p class="mt-5">
              <A
                href="/search"
                class="font-medium text-indigo-600 hover:text-indigo-700 hover:underline dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Browse all capstones
                <span aria-hidden="true"> →</span>
              </A>
            </p>
          </Show>
        </div>

        <Show when={!auth.user}>
          <div class="mx-auto mt-12 grid max-w-3xl gap-8 text-left sm:grid-cols-3 sm:gap-6">
            <div class="rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 animate-card-soft">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 class="mt-4 font-semibold text-slate-900 dark:text-slate-100">Search & discover</h3>
              <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Find projects by keyword or filter by tags once you sign in.
              </p>
            </div>
            <div class="rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 animate-card-soft">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 class="mt-4 font-semibold text-slate-900 dark:text-slate-100">Submit your work</h3>
              <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Students can submit capstones for faculty approval.
              </p>
            </div>
            <div class="rounded-2xl border border-slate-200/60 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 animate-card-soft">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 7h8m0 0v8m0-8v-8M3 21h18M3 10h18M3 7v14a2 2 0 002 2h14a2 2 0 002-2V7"
                  />
                </svg>
              </div>
              <h3 class="mt-4 font-semibold text-slate-900 dark:text-slate-100">Browse & learn</h3>
              <p class="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Access abstracts, PDFs, and repository links.
              </p>
            </div>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Landing;