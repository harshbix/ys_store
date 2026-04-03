import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        surface: '#111111',
        surfaceElevated: '#1C1C1C',
        border: '#2A2A2A',
        foreground: '#F0EDE8',
        secondary: '#A8A49E',
        muted: '#666660',
        primary: '#C8A96E',
        primaryForeground: '#0A0A0A',
        accent: '#C8A96E',
        accentSoft: '#C8A96E',
        danger: '#D75858',
        success: '#25D366'
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
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
