const STORAGE_KEY = 'cit-capstone-theme';

const apply = (dark: boolean) => {
  document.documentElement.classList.toggle('dark', dark);
  try {
    localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light');
  } catch {
    /* ignore */
  }
};

/** Call once before paint to avoid flash */
export const initTheme = (): void => {
  if (typeof document === 'undefined') return;
  let dark = false;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark') dark = true;
    else if (stored === 'light') dark = false;
    else dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    dark = false;
  }
  apply(dark);
};

export const isDark = (): boolean => {
  return document.documentElement.classList.contains('dark');
};

const THEME_TRANSITION_MS = 380;

export const toggleTheme = (): boolean => {
  const root = document.documentElement;
  const next = !root.classList.contains('dark');
  root.classList.add('theme-transitioning');
  requestAnimationFrame(() => {
    apply(next);
    window.setTimeout(() => root.classList.remove('theme-transitioning'), THEME_TRANSITION_MS);
  });
  return next;
};

export const setTheme = (dark: boolean): void => {
  apply(dark);
};
