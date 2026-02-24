import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        accent: {
          DEFAULT: '#1B5E20',
          light: '#2E7D32',
          dark: '#1B5E20',
        },
        surface: {
          primary: 'var(--surface-primary)',
          secondary: 'var(--surface-secondary)',
          tertiary: 'var(--surface-tertiary)',
          subtle: 'var(--surface-subtle)',
          inverse: 'var(--surface-inverse)',
        },
        content: {
          primary: 'rgb(var(--content-primary) / <alpha-value>)',
          secondary: 'var(--content-secondary)',
          tertiary: 'var(--content-tertiary)',
          disabled: 'var(--content-disabled)',
          placeholder: 'var(--content-placeholder)',
          inverse: 'var(--content-inverse)',
        },
        border: {
          default: 'var(--border-default)',
          subtle: 'var(--border-subtle)',
        },
        hover: {
          DEFAULT: 'var(--hover-bg)',
        },
        error: {
          DEFAULT: 'rgb(var(--color-error) / <alpha-value>)',
          bg: 'var(--color-error-bg)',
          border: 'var(--color-error-border)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          bg: 'var(--color-warning-bg)',
          border: 'var(--color-warning-border)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          bg: 'var(--color-info-bg)',
          border: 'var(--color-info-border)',
        },
        success: {
          DEFAULT: 'var(--color-success)',
          bg: 'var(--color-success-bg)',
          border: 'var(--color-success-border)',
        },
      },
      fontSize: {
        'display': ['36px', { lineHeight: '36px', fontWeight: '700' }],
        'heading-lg': ['24px', { lineHeight: '36px', fontWeight: '600' }],
        'heading-md': ['20px', { lineHeight: '20px', fontWeight: '600' }],
        'heading-sm': ['16px', { lineHeight: '19px', fontWeight: '700' }],
        'body-lg': ['16px', { lineHeight: '19px', fontWeight: '500' }],
        'body-md': ['15px', { lineHeight: '24px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '21px', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '18px', fontWeight: '400' }],
      },
      boxShadow: {
        'card': '6px 6px 50px rgba(0, 0, 0, 0.05)',
        'avatar': '0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        'xs': '4px',
        'sm': '5px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
        'full': '100px',
        'circle': '50%',
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '9': '36px',
      },
    },
  },
  plugins: [],
};

export default config;
