import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0F1B3D',
          deep: '#091029',
        },
        mint: {
          DEFAULT: '#5EEAD4',
          dim: '#3FC7B2',
        },
        teal: '#0D9488',
        gold: '#F5B841',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
      boxShadow: {
        float: '0 24px 60px -18px rgba(3, 8, 22, 0.75), 0 8px 20px -10px rgba(3, 8, 22, 0.6)',
        'float-lg': '0 40px 90px -24px rgba(3, 8, 22, 0.85), 0 12px 28px -12px rgba(3, 8, 22, 0.7)',
        glow: '0 0 0 1px rgba(94, 234, 212, 0.18), 0 18px 50px -20px rgba(94, 234, 212, 0.35)',
      },
      backgroundImage: {
        'mesh-hero':
          'radial-gradient(80rem 50rem at 72% -8%, rgba(13, 148, 136, 0.32), transparent 62%), radial-gradient(52rem 38rem at 8% 12%, rgba(94, 234, 212, 0.14), transparent 60%), radial-gradient(60rem 45rem at 50% 110%, rgba(15, 27, 61, 0.9), transparent 70%)',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -14px, 0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.85)', opacity: '0.7' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'sweep': {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
      },
      animation: {
        drift: 'drift 7s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        sweep: 'sweep 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
