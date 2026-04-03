import { Moon, SunMedium } from 'lucide-react';
import { useThemeStore } from '../../store/theme';

type ThemeToggleProps = {
  compact?: boolean;
};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const mode = useThemeStore((state) => state.mode);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const label = mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-secondary transition hover:bg-surfaceHover hover:text-foreground"
      >
        {mode === 'dark' ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-surfaceHover"
      aria-label={label}
      title={label}
    >
      {mode === 'dark' ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span>{mode === 'dark' ? 'Light' : 'Dark'} mode</span>
    </button>
  );
}
