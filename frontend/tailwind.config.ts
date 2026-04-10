import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: ['class'],
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
  			sans: [
  				'SF Pro Text',
  				'SF Pro Display',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'sans-serif'
  			],
  			display: [
  				'SF Pro Display',
  				'SF Pro Text',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'sans-serif'
  			],
  			mono: [
  				'IBM Plex Mono',
  				'ui-monospace',
  				'SFMono-Regular',
  				'monospace'
  			]
  		},
  		boxShadow: {
  			soft: 'var(--shadow-soft)'
  		},
  		animation: {
  			'pulse-soft': 'pulseSoft 1.6s ease-in-out infinite',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
  		keyframes: {
  			pulseSoft: {
  				'0%, 100%': {
  					opacity: '0.55'
  				},
  				'50%': {
  					opacity: '1'
  				}
  			},
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		}
  	}
  },
  plugins: []
};

export default config;
