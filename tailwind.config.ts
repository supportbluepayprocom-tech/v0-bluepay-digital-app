import type { Config } from 'tailwindcss'

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0000ff',
        secondary: '#f8f9ff',
        success: '#16a34a',
        error: '#dc2626',
        warning: '#f59e0b',
        info: '#0000ff',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      backgroundColor: {
        'primary-gradient': 'linear-gradient(135deg, #0000ff 0%, #4f46e5 100%)',
      },
      animation: {
        'pulse-soft': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-left': 'slideLeft 20s linear infinite',
        'lion-slide': 'lionSlide 15s linear infinite',
        'fingerprint-scan': 'fingerprintScan 2s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        slideLeft: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        lionSlide: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        fingerprintScan: {
          '0%': { transform: 'translateY(-50px)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateY(50px)', opacity: '0' },
        },
        glow: {
          '0%, 100%': { 'box-shadow': '0 0 20px rgba(0, 0, 255, 0.5)' },
          '50%': { 'box-shadow': '0 0 40px rgba(0, 0, 255, 0.8)' },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
