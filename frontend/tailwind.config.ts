import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-bg) / <alpha-value>)',
        backgroundElevated: 'rgb(var(--color-bg-elevated) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        surfaceElevated: 'rgb(var(--color-surface-elevated) / <alpha-value>)',
        surfaceHover: 'rgb(var(--color-surface-hover) / <alpha-value>)',
        border: 'rgb(var(--color-border-subtle) / <alpha-value>)',
        borderStrong: 'rgb(var(--color-border-strong) / <alpha-value>)',
        foreground: 'rgb(var(--color-text-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        muted: 'rgb(var(--color-text-muted) / <alpha-value>)',
        primary: 'rgb(var(--color-accent) / <alpha-value>)',
        primaryForeground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        accentHover: 'rgb(var(--color-accent-hover) / <alpha-value>)',
        accentSoft: 'rgb(var(--color-accent) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        inputBg: 'rgb(var(--color-input-bg) / <alpha-value>)',
        overlay: 'rgb(var(--color-overlay) / <alpha-value>)'
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      boxShadow: {
        soft: 'var(--shadow-soft)'
      },
      animation: {
        'pulse-soft': 'pulseSoft 1.6s ease-in-out infinite'
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' }
        }
      }
    }
  },
  plugins: []
};

export default config;
